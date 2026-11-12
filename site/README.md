# site — SpaceLog 받는 곳 (Render에 올리는 유일한 것)

수집 앱을 **받고 설치하는 방법만** 안내하는 정적 페이지 한 장이다. 빌드 도구가 없다. `index.html` + `styles.css`가 전부다.

## 왜 이것만 올리나

SpaceLog는 기록이 내 PC에만 있는 제품이다 (PRD 3장, [POLICY](../docs/POLICY.md) 1-1·1-3: 로컬 서버는 `127.0.0.1`에만 바인딩). 그래서 **보관함·로컬 서버·로컬 웹은 호스팅하지 않는다.** 올리면 제품의 전제가 깨진다.

| 어디서 도나 | 무엇 |
| --- | --- |
| Render (공개) | 이 폴더 — 받는 곳 안내 한 장. 사용자 데이터 없음 |
| 사용자 PC | 수집 앱, 로컬 서버, 로컬 웹(`web/dist`), 보관함 |

## 디자인

[docs/DESIGN.md](../docs/DESIGN.md) 3장 토큰을 그대로 쓴다 — 컬러(`--ink` `--space` `--panel` `--yellow` `--violet` …), 타이포(Black Han Sans / Pretendard / IBM Plex Mono), 모양(3px 잉크 테두리, 흐리지 않은 단색 드롭 섀도, 16px 카드 모서리), 760px에서 1단으로 바뀌는 배치(12장).

한 가지만 다르다: **서체를 CDN에서 불러온다.** DESIGN 3-2는 "로컬 웹은 인터넷 없이도 열려야 하므로 woff2를 로컬 서버에 같이 넣는다"고 정했는데, 이 페이지는 로컬 웹이 아니라 공개 웹사이트라 그 조건이 적용되지 않는다. 로컬 웹(`web/`)은 지금처럼 `@fontsource` 패키지를 쓴다.

## 로컬에서 보기

브라우저로 `site/index.html`을 바로 열면 된다. 서버가 필요 없다.

## Render 설정

[`render.yaml`](../render.yaml)에 있다. 대시보드에서 직접 만들 경우:

| 항목 | 값 |
| --- | --- |
| Type | Static Site |
| Root Directory | `site` |
| Build Command | 비움 |
| Publish Directory | `.` |

## 내려받기 링크

`#받기`의 Windows·macOS 줄은 `https://github.com/delightPIP/teamproject/releases/latest`로 간다 (이슈 #57). 이 주소는 **공개된(Publish) 릴리스가 하나라도 있어야** 열린다 — 초안만 있으면 404다. 그래서 순서는 태그 푸시 → Release 초안 확인 → Publish → 이 페이지가 Render에 올라가 있는지 확인. 만드는 법은 [apps/collector/README.md](../apps/collector/README.md) "설치 파일 만들기".

zip 파일 이름(`SpaceLog-<버전>-windows-x64.zip` 등)을 바꾸면 `#받기` 안내 문구도 같이 고친다.

서명하지 않은 빌드를 올리는 동안에는 `#막힐때` 섹션(SmartScreen·Gatekeeper 안내)을 지우지 않는다. 스파이크에서 서명 없는 실행 파일이 실제로 윈도우 앱 제어 정책에 막혔다 ([ADR 0001](../docs/adr/0001-collector-server-stack.md) 4-1, PRD 8장).

## 페이지 구성

- `index.html` — 첫 페이지. 바로 체험 페이지(`how-to-use/`)로 넘긴다.
- `download/` — 받는 곳(설치 파일 · 소스). 체험 페이지의 "PC앱 다운로드 받기"가 연다. 디자인은 예전 그대로.
- `how-to-use/` — 체험 페이지. 제품 웹의 상단 바 로고가 연다 (공개 주소가 없으면 수집 앱의 로컬 서버가 이 폴더를 `/how-to-use/`로 내려준다).

## 체험 페이지 (`how-to-use/`)

디자이너의 프로토타입 두 장(`SPACELOG_Collector`, `SPACELOG_Prototype`)을 **시연용 페이지(How to Use)**로 올린다. 입구는 `how-to-use/` (수집 앱 화면으로 이동). 설치 전에 "기록 넣기 → 웹 우주 → 별자리 · 관측소 → 재발견" 흐름을 체험 가이드(12단계)로 따라 해 볼 수 있다.

- **예시 데이터로만 동작한다.** 사용자가 끌어다 놓은 파일·글은 브라우저 안에서만 쓰이고 서버로 보내지 않는다 (코드에 업로드 호출이 없다: `fetch`는 같은 서버의 시안 파일을 불러오는 데만 쓴다). 진행 상태는 브라우저 `localStorage`에 둔다.
- 제품 웹(`web/`)과는 **별개**다. 위의 "왜 이것만 올리나"는 그대로 지킨다: 보관함·로컬 서버·로컬 웹은 올리지 않는다.
- 아이콘·서체·3D 라이브러리를 외부(unpkg · jsdelivr · Google Fonts)에서 불러온다. 이 요청으로 그 서버들은 방문자의 IP를 볼 수 있다.
- 시안의 원본은 `docs/design/2.5d/.../design/`이다. 사본을 만들 때 빠진 파일을 가리키던 "전체 화면 흐름"(`SPACELOG_Flow.dc.html`) 링크는 뺐다. 시안이 바뀌면 같은 파일들을 다시 복사한다 (`W0*` · `S0*` · 두 페이지 · `support.js` · `spacelog-*.js` · `_ds` · 에셋 4장).
- 나중에 서비스 랜딩 페이지 홈 디자인을 추가해 소개 사이트로 발전시킬 예정이다 (핸드오프 README 6-5). 지금 받는 곳(`download/`)은 예전 디자인 그대로다.
