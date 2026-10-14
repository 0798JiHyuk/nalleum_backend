const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!OPENAI_API_KEY) {
  console.warn(
    "[warn] OPENAI_API_KEY is not set. Requests to /api/interview-questions will fail.",
  );
}

// ✅ OpenAI Client (Chat Completions 전용)
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

/**
 * 면접 질문 프롬프트 생성
 */
function buildPrompt(body) {
  const name = body.name || "";
  const company = body.company || "";
  const role = body.role || "";
  const major = body.major || "";
  const certifications = body.certifications || "없음";

  return (
    "당신은 실제 기업 면접관이다.\n" +
    "아래 지원자 정보를 참고하여 실제 면접에서 나올 법한 질문 3개를 한국어로 작성하라.\n\n" +
    "[지원자 정보]\n" +
    `이름: ${name}\n` +
    `희망기업: ${company}\n` +
    `희망직종: ${role}\n` +
    `관심산업: ${major}\n` +
    `자격증: ${certifications}\n\n` +
    "[요구사항]\n" +
    "- 질문은 각각 한 문장\n" +
    "- 질문은 서로 겹치지 않게\n" +
    "- 번호 없이 질문 문장만 출력\n"
  );
}

/**
 * 면접 질문 생성 API
 */
app.post("/api/interview-questions", async (req, res) => {
  try {
    const { name, company, role, major, certifications } = req.body || {};

    if (![name, company, role, major].every(value => typeof value === "string" && value.trim().length > 0 && value.length <= 500) || (certifications != null && (typeof certifications !== "string" || certifications.length > 2000))) {
      return res.status(400).json({
        error: "name, company, role, major are required",
      });
    }

    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: "Interview generation is not configured",
      });
    }

    const prompt = buildPrompt({
      name,
      company,
      role,
      major,
      certifications,
    });

    // 🔥 Chat Completions API (안정 버전)
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: "너는 면접관이며 면접 질문만 생성한다.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content || "";

    // 결과 정리 (JSON 강제 안 함)
    const questions = text
      .split(/\n+/)
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return res.json({ questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "OpenAI API error",
    });
  }
});

/**
 * 헬스 체크
 */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
