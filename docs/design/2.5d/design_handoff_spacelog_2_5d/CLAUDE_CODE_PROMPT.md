# Claude Code에 붙여 넣을 첫 지시문

레포 루트(`SPACELOG`)에서 `SPACELOG-2.5D` 브랜치를 체크아웃하고, 이 폴더(`design_handoff_spacelog_2_5d/`)를 `docs/design/2.5d/` 아래에 넣은 뒤 Claude Code에 아래를 붙여 넣으세요.

```
docs/design/2.5d/design_handoff_spacelog_2_5d/README.md를 먼저 끝까지 읽어 줘.
이 문서는 디자이너가 HTML 시안으로 만든 새 디자인을 이 레포(web/ = React + Three.js + Vite + TS + Zustand,
apps/collector/ = Electron)에 적용하기 위한 핸드오프야. design/ 폴더의 *.dc.html은 참고용 시안이지
그대로 옮길 코드가 아니야. 레포의 기존 패턴(store.ts 계약, @spacelog/shared 타입, CSS 파일 구조)을 따라 다시 구현해 줘.

진행 방식:
1. README 10장의 순서대로, 한 번에 한 단계씩 진행해.
2. 각 단계를 시작하기 전에 바꿀 파일 목록과 계획을 먼저 보여 주고 내 확인을 받아.
3. 각 단계가 끝나면 루트에서 npm test, web에서 npm run typecheck를 돌리고 결과를 알려 줘.
4. README 4장의 "팀 문서와 어긋나는 점"에 해당하는 변경은 docs/SPEC.md, docs/DESIGN.md도 같이 고쳐.
5. 시안과 레포 코드가 충돌해서 판단이 필요한 곳은 임의로 정하지 말고 물어봐.
6. 시연용으로 먼저 진행해. apps/server, packages/shared, mocks/api는 수정하지 마. 새 기능의 데이터와 타입은 web/src/demo/에 두고 localStorage로 저장해 (README 4-1 "결정 기록").

지금은 1단계(디자인 토큰 교체 + ui/* 새 스타일 + 화면 문구 "별" → "기록")부터 시작해 줘.
값은 design/design.md 2~8절과 README 5장을 따라.
```

## 단계별로 이어서 줄 지시 (README 10장과 같은 순서)

2. `우주 홈 2D 요소(상단 바, 오른쪽 창, 왼쪽 아래 묶음)를 README 6-1과 design/W01_Home.dc.html대로 구현해 줘.`
3. `2.5D 보기를 추가하고 2.5D/3D 전환을 넣어 줘. 기존 universe/ 3D는 3D 보기로 유지해.`
4. `행성 패널과 기록 상세를 README 6-2, 6-3대로 구현해서 App.tsx의 PanelPlaceholder를 교체해 줘.`
5. `(서버 변경은 보류) README 7장의 새 데이터(별자리, 행성 모습·좌표, 블랙홀 보관함, CSV 내용)를 web/src/demo/에 시연용으로 만들어 줘. 타입·예시 데이터·localStorage 저장·CSV 읽기를 포함하고, apps/server, packages/shared, mocks/api는 건드리지 마.`
5-1. `mock-data/README.md를 읽고, 예시 데이터(행성 6, 기록 41, 체험 별자리 1. 이미지 예시는 뺐음)를 처음 실행할 때 한 번 넣는 시연용 시드로 web/src/demo/에 반영해 줘. 서버가 아니라 웹에서 넣고, 날짜는 daysAgo로 오늘 기준 변환해야 해. 이미 기록이 있는 사용자에게는 넣지 마.`
6. `별자리 UI와 관측소(README 6-4)를 새 화면으로 구현해 줘. 탐사선(probe/)은 기능을 그대로 두고 README 6-4b대로 스타일과 싣는 버튼만 맞춰 줘. CSV 대시보드 규칙은 design/W05_Observatory.dc.html의 로직을 참고해.`
7. `위치 편집, 블랙홀, 행성 수정을 구현해 줘.`
8. `수집 앱(apps/collector)의 스타일과 문구를 README 6-5대로 바꿔 줘.`
9. `(선택) 체험 가이드와 챗봇 링크 버튼을 넣어 줘.`

## 미리 정해 두면 좋은 것

- **브랜치:** 이 문서를 쓸 때 `SPACELOG-2.5D` 브랜치가 원격에서 보이지 않았습니다. 로컬에만 있다면 `git push -u origin SPACELOG-2.5D`로 올려 두세요.
- **2.5D 렌더러:** DOM/CSS로 그릴지(시안과 같음), Three.js 직교 카메라로 그릴지.
- **서버 변경 범위:** 정했습니다. 시연용으로 먼저, 서버·공유 타입은 바꾸지 않습니다. 완성한 화면으로 서버 담당자와 논의한 뒤 정합니다 (README 4-1).
- **체험 가이드:** 제품에 넣을지, 소개 사이트(`site/`)용으로만 둘지.
- **챗봇 주소:** 배포 후 넣을 URL.
