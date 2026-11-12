# chatbot — SpaceLog 사용법 안내 챗봇

제품의 **우주먼지**(우주 홈 왼쪽 아래 빛무리, `web/src/chat/`)가 정해진 답에 없는 질문을 보내는 서버다. "별자리는 어떻게 만들어요?", "CSV 대시보드는 어디서 봐요?" 같은 질문에 AI가 `knowledge.md`(화면 흐름 안내 문서)만 근거로 우주먼지의 말투로 답한다. 같은 서버가 내려주는 `public/index.html`은 대화창의 "새 탭에서 열기"가 여는 독립 페이지다. 제품(수집 앱·로컬 웹)과 **따로 배포**한다.

우주먼지의 답 순서: ① 시안의 정해진 답 12개(`web/src/chat/faq.ts`, 키워드로 고름 — 바로 가기 버튼·길잡이 비행 포함) ② 없으면 이 서버에 묻는다 ③ 서버 주소가 없거나 실패하면 "거기까지는 아직 떠다녀 보지 못했어요".

## 어떻게 동작하나

```
제품 웹의 우주먼지(web/src/chat/chatApi.ts) ┐
독립 페이지(public/index.html)              ┴→ POST /api/chat → server.ts → OpenAI API(openai.ts)
                                            ← 답변을 조금씩(SSE) ←
```

- **API 키는 서버 환경 변수에만 둔다.** 브라우저로는 가지 않는다.
- **질문·답변은 저장하지 않는다.** 로그에는 오류 종류만 남는다. 챗봇은 사용자의 기록을 볼 수 없다 (제품의 "기록은 내 PC에만" 원칙은 그대로).
- 질문을 받는 출처: 이 서버의 화면(같은 출처), 사용자 PC의 제품 웹(`http://localhost:*`, `http://127.0.0.1:*` — CORS 로 허용), `CHATBOT_ALLOWED_ORIGINS` 에 적은 출처. 그 밖의 사이트는 403. IP별 분당 12회, 하루 전체 3,000회까지 (환경 변수로 바꾼다). 질문은 1,000자, 대화는 최근 12개까지.
- 모델 기본값은 `gpt-5-mini`(가볍고 싼 등급). 안내 문서는 매번 같은 앞부분이라 OpenAI가 자동으로 캐싱해 입력 비용을 줄인다.

## 실행

```bash
cd chatbot
npm install
`chatbot/.env` 에 `OPENAI_API_KEY=sk-...` 를 적고 `npm start`     # http://localhost:8788
```

| 환경 변수 | 뜻 | 기본 |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API 키 (**필수**, 커밋 금지) | — |
| `PORT` | 포트 | 8788 |
| `CHATBOT_MODEL` | 모델. 답변 품질이 아쉬우면 한 단계 위 모델로 올린다 (`OPENAI_MODEL` 로 적어도 된다) | `gpt-5-mini` |
| `CHATBOT_PER_MINUTE` | IP별 분당 질문 수 | 12 |
| `CHATBOT_DAILY_MAX` | 하루 전체 질문 수(비용 상한) | 3000 |
| `CHATBOT_ALLOWED_ORIGINS` | 로컬 제품 웹 외에 질문을 보내도 되는 출처(공백 구분, 예: `https://spacelog.example`) | — |

## 테스트

`npm test` (또는 루트의 `npm test`). 가짜 AI로 입력 검사, 사용량 제한, SSE 응답, 다른 출처 거절, 오류 처리를 확인한다. **API 키가 필요 없고 비용이 들지 않는다.**

## 배포 (Render)

[`render.yaml`](../render.yaml)의 `spacelog-chatbot` 서비스(Web Service, Node 24). Render 대시보드에서 환경 변수 `OPENAI_API_KEY`를 직접 넣는다(파일에는 값을 쓰지 않는다). 배포되면 나오는 주소(`https://spacelog-chatbot.onrender.com` 등)를 제품 웹을 **빌드할 때** `web/.env`의 `VITE_CHATBOT_URL`에 넣고 다시 빌드한다. 주소가 없어도 우주먼지는 정해진 답으로 동작하고, 그 밖의 질문에는 모른다고 답한다.

## 지식 문서 갱신

`knowledge.md`는 `docs/design/2.5d/.../SCREEN_FLOW.md`의 사본에 "지금 알아 둘 한계"(7장)를 붙인 것이다. 화면이나 기능이 바뀌면 이 파일을 고치고 다시 배포한다. 챗봇은 이 문서에 없는 내용은 모른다고 답하도록 되어 있다.
