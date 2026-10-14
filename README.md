# Spoiler · 맞춤형 면접 질문 API

지원자의 희망 기업·직무·관심 산업을 입력받아 한국어 면접 질문을 생성하는 Express 백엔드 프로토타입입니다.

## 현재 구현과 계획
| 구분 | 내용 |
|---|---|
| 구현 | POST /api/interview-questions, GET /health |
| 구현 | 필수 입력 검사, OpenAI 호출, 최대 3개 질문 정리 |
| 별도 코드 | src/db/index.js의 메모리 저장소 — 현재 server.js에 연결되지 않음 |
| 후속 계획 | 뉴스 수집, Firestore 영속 저장, FCM 푸시, 사용자 인증 |

현재 실행 코드는 **JavaScript / CommonJS**입니다. TypeScript, Firestore, FCM이 적용된 운영 서버로 소개하지 않습니다.

## 실행
```bash
npm ci
npm start
```

`.env`에 설정합니다.
```dotenv
PORT=3000
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o-mini
```

키가 없어도 서버와 헬스체크는 동작하며, 질문 생성은 503을 반환합니다. 실제 생성에는 외부 API 자격 증명과 사용 비용이 필요합니다.

## API 계약
`POST /api/interview-questions`
```json
{
  "name": "지원자",
  "company": "지원 기업",
  "role": "백엔드 개발",
  "major": "IT 서비스",
  "certifications": "없음"
}
```

응답: `{ "questions": ["질문 1", "질문 2", "질문 3"] }`

name, company, role, major는 공백이 아닌 문자열이며 각 500자 이내입니다. certifications는 선택 문자열이며 2,000자 이내입니다. 모델 출력에 따라 질문 개수가 3개보다 적을 수 있습니다.

| 상태 | 의미 |
|---|---|
| 200 | 생성 성공 |
| 400 | 입력 오류 |
| 503 | AI 연동 미설정 |
| 500 | 외부 API 호출 실패 |

## 구조 및 개선 기록
`server.js`에서 요청 검사 → 프롬프트 구성 → 모델 호출 → 응답 정리를 수행합니다.
이번 정리에서 키 미설정 시 클라이언트 생성 오류를 방지하고 입력 타입·길이를 검증하며 외부 오류 상세의 클라이언트 노출을 제거했습니다.

## 협업 및 다음 단계
기존 Backend A(외부 연동·데이터) / Backend B(API·서비스) 역할 분리를 유지합니다. 실제 담당 영역은 팀 기록에 따라 구분합니다.
인증, 호출 제한, 뉴스 연동, 영속 저장, 모델 응답 검증을 보강한 뒤 운영 배포를 검토합니다.
