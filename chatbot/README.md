# chatbot — SpaceLog 사용법 안내 챗봇

제품 화면 왼쪽 아래의 **챗봇 버튼**이 여는 별도 웹 페이지다. "별자리는 어떻게 만들어요?", "CSV 대시보드는 어디서 봐요?" 같은 질문에 Claude가 `knowledge.md`(화면 흐름 안내 문서)만 근거로 답한다. 제품(수집 앱·로컬 웹)과 **따로 배포**한다.

## 어떻게 동작하나

```
브라우저(public/index.html) → POST /api/chat → server.ts → Claude API(anthropic.ts)
                              ← 답변을 조금씩(SSE) ←
```

- **API 키는 서버 환경 변수에만 둔다.** 브라우저로는 가지 않는다.
- **질문·답변은 저장하지 않는다.** 로그에는 오류 종류만 남는다. 챗봇은 사용자의 기록을 볼 수 없다 (제품의 "기록은 내 PC에만" 원칙은 그대로).
- 같은 출처의 화면에서 온 요청만 받는다. IP별 분당 12회, 하루 전체 3,000회까지 (환경 변수로 바꾼다). 질문은 1,000자, 대화는 최근 12개까지.
- 모델 기본값은 `claude-opus-5-5`, `effort: low`. 안내 문서는 매번 같아서 프롬프트 캐싱으로 입력 비용을 줄인다. 안전 분류기가 거절하면 서버 쪽 대체 모델로 이어 간다(`fallbacks: "default"`).

## 실행

```bash
cd chatbot
npm install
ANTHROPIC_API_KEY=sk-ant-... npm start     # http://localhost:8788
```

| 환경 변수 | 뜻 | 기본 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Claude API 키 (**필수**, 커밋 금지) | — |
| `PORT` | 포트 | 8788 |
| `CHATBOT_MODEL` | 모델. 비용이 부담되면 `claude-haiku-5-5` 로 바꿀 수 있다 | `claude-opus-5-5` |
| `CHATBOT_PER_MINUTE` | IP별 분당 질문 수 | 12 |
| `CHATBOT_DAILY_MAX` | 하루 전체 질문 수(비용 상한) | 3000 |

## 테스트

`npm test` (또는 루트의 `npm test`). 가짜 Claude로 입력 검사, 사용량 제한, SSE 응답, 다른 출처 거절, 오류 처리를 확인한다. **API 키가 필요 없고 비용이 들지 않는다.**

## 배포 (Render)

[`render.yaml`](../render.yaml)의 `spacelog-chatbot` 서비스(Web Service, Node 24). Render 대시보드에서 환경 변수 `ANTHROPIC_API_KEY`를 직접 넣는다(파일에는 값을 쓰지 않는다). 배포되면 나오는 주소(`https://spacelog-chatbot.onrender.com` 등)를 제품 웹을 **빌드할 때** `web/.env`의 `VITE_CHATBOT_URL`에 넣고 다시 빌드한다. 주소가 없으면 제품의 챗봇 버튼은 "준비 중"이라고 알린다.

## 지식 문서 갱신

`knowledge.md`는 `docs/design/2.5d/.../SCREEN_FLOW.md`의 사본에 "지금 알아 둘 한계"(7장)를 붙인 것이다. 화면이나 기능이 바뀌면 이 파일을 고치고 다시 배포한다. 챗봇은 이 문서에 없는 내용은 모른다고 답하도록 되어 있다.
