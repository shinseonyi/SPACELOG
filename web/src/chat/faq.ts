// 우주먼지(챗봇)의 정해진 답 (design handoff 5-3 · 5-4). 키워드로 고르고, 위에서부터 먼저 맞는 것을 쓴다.
// 여기 없는 질문은 챗봇 서버(AI)에 묻는다 (controller.ts). 순수 함수만 있어 테스트가 쉽다.

/** 답 아래의 바로 가기 버튼이 하는 일 (handoff 5-8) */
export type ActionId = "openLinks" | "openObservatory" | "openProbe" | "startEditPositions" | "view3d";
/** 답과 함께 빛무리가 날아가 머무는 화면 요소. `data-guide-target` 값과 같다 (handoff 5-5, 9) */
export type GuideTarget = "links" | "observatory" | "probe" | "edit" | "view3d" | "period" | "add";

export interface Answer {
  text: string;
  action?: ActionId;
  target?: GuideTarget;
  /** 재발견 혜성 답: 관측소가 열리면 그 안의 "재발견 혜성 관측"까지 한 번 더 날아간다 (5-5 2단계) */
  then?: "comet";
}

export const BOT_NAME = "우주먼지";
export const GREETING = "안녕하세요, 우주먼지예요.\n작아서 이 우주 어디든 떠다녀 봤어요. 무엇을 찾고 있나요?";
export const UNKNOWN = "거기까지는 아직 떠다녀 보지 못했어요.\n기록 넣기, 별자리, 관측소, 탐사선, 블랙홀에 대해 물어봐 주세요.";
export const FAILED = "지금은 답을 떠올리지 못했어요.\n잠시 뒤에 다시 물어봐 주세요.";
export const STAY = "제가 그 옆에 가 있을게요.";
export const FOLLOW_UP = "다른 궁금한 게 있으신가요?";
export const WAITING = "떠올리는 중이에요";

export const ACTION_LABEL: Record<ActionId, string> = {
  openLinks: "별자리 목록 열기",
  openObservatory: "관측소 열기",
  openProbe: "탐사선 열기",
  startEditPositions: "위치 편집 켜기",
  view3d: "3D로 보기",
};

const ACTION_TARGET: Record<ActionId, GuideTarget> = { openLinks: "links", openObservatory: "observatory", openProbe: "probe", startEditPositions: "edit", view3d: "view3d" };

/** 추천 질문 9개 (순서대로). 처음에 5개, 답마다 아직 묻지 않은 것 4개 */
export const QUESTION_POOL = ["기록은 어떻게 넣어요", "별자리가 뭐예요", "재발견 혜성이 뭐예요", "AI에게 보내려면", "행성을 지우고 싶어요", "CSV를 그래프로 보고 싶어요", "예전 기록을 다시 보려면", "3D로 볼 수 있나요", "기록이 안 보여요"];

type Row = [RegExp, string, ActionId?, GuideTarget?, "comet"?];
const FAQ: Row[] = [
  [/검색|찾기|찾고|찾을/, "검색은 아직 없어요. 위쪽 기간을 ‘전체’로 넓힌 뒤 기록 목록에서 찾아야 해요."],
  [/블랙홀|지우|삭제|복구|되살|꺼내/, "행성은 ‘위치 편집’을 켜고 블랙홀로 끌어 넣으면 보관돼요. 블랙홀을 누르면 다시 꺼낼 수 있어요.\n기록 하나는 기록 상세에서 지우는데, 이건 되돌릴 수 없어요.", "startEditPositions"],
  [/탐사선|ai|복사|보내|프롬프트/i, "탐사선은 기록을 실어 하나의 텍스트로 묶어 줘요. 복사해서 AI에게 붙여 넣으면 돼요. 자동으로 보내지지는 않아요.", "openProbe"],
  [/관측소|대시보드|그래프|차트|csv|사진|표/i, "관측소에서는 별자리를 대시보드, 표, 사진, 텍스트로 볼 수 있어요. CSV 기록이 들어 있으면 그래프로 그려져요.", "openObservatory"],
  [/별자리|묶|연결/, "별자리는 기록에 관측 목적을 붙여 묶어 두는 거예요. 기록을 체크하고 ‘별자리 만들기’를 누르면 돼요.", "openLinks"],
  [/재발견|혜성|예전|지난|옛/, "재발견 혜성은 예전에 넣은 기록이 다시 돌아오는 거예요. 넣은 지 7일이 지나면 ‘N일 전 오늘의 기록’으로 나타나요.\n왼쪽 아래 혜성 카드나 관측소의 ‘재발견 혜성 관측’에서 볼 수 있어요.", "openObservatory", undefined, "comet"],
  [/3d|거리|깊이|입체/i, "위쪽의 ‘3D’를 누르면 행성이 깊이를 두고 떠 있어요. 왼쪽 아래 카드에서 행성 사이 거리도 볼 수 있어요.", "view3d"],
  [/색|모양|고리|성운|수정|이름/, "행성을 누른 뒤 패널의 행성 메뉴에서 ‘행성 수정’을 고르면 이름, 색, 모양을 바꿀 수 있어요.\n성운은 아직 다듬지 않은 생각을 조각으로 남겨 두는 곳이에요."],
  [/위치|옮기|배치/, "오른쪽 아래 ‘위치 편집’을 켜면 행성을 끌어서 옮길 수 있어요.", "startEditPositions"],
  [/넣|추가|올리|업로드|저장|메모/, "기록은 수집 앱에 끌어다 놓거나, 이 화면 아래의 ‘기록 넣기’로 넣을 수 있어요. 파일, 링크, 메모 모두 괜찮아요.", undefined, "add"],
  [/기간|오늘|이번|전체|안 ?보|없어|사라/, "기록이 안 보이면 기간을 확인해 보세요. 위쪽 기간 버튼에서 ‘이번 달’이나 ‘전체’로 넓힐 수 있어요.", undefined, "period"],
  [/누구|우주먼지|너는|뭐야|뭘 해|할 수/, "저는 우주먼지예요. SPACELOG에서 무엇이 어디에 있는지 알려 드려요. 기록 안의 내용까지는 아직 읽지 못해요."],
];

/** 정해진 답. 없으면 null (→ AI 에 묻는다) */
export function answerFor(question: string): Answer | null {
  const q = question.trim();
  const row = FAQ.find(([re]) => re.test(q));
  if (!row) return null;
  const [, text, action, target, then] = row;
  const a: Answer = { text };
  if (action) a.action = action;
  const t = target ?? (action ? ACTION_TARGET[action] : undefined);
  if (t) a.target = t;
  if (then) a.then = then;
  return a;
}

/** 아직 묻지 않은 추천 질문. 처음(대화가 인사뿐)엔 5개, 그 뒤엔 4개 */
export function suggestions(asked: string[], first: boolean): string[] {
  return QUESTION_POOL.filter((q) => !asked.includes(q)).slice(0, first ? 5 : 4);
}
