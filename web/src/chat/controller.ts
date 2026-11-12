// 우주먼지의 흐름: 열고 닫기, 질문 보내기, 바로 가기, 길잡이 비행 (handoff 5-2 · 5-5). 화면은 CosmicDust.tsx 가 그린다.
// 정해진 답(faq.ts)이 있으면 650ms 뒤 바로, 없으면 챗봇 서버(AI)에 묻는다. 서버 주소가 없거나 실패하면 모른다고 답한다.
import { store } from "../state/store.ts";
import { askChatbot, CHATBOT_OK, type ChatTurn } from "./chatApi.ts";
import { chat } from "./chatStore.ts";
import { answerFor, FAILED, STAY, UNKNOWN, type ActionId, type GuideTarget } from "./faq.ts";

/** 챗봇 버튼(빛무리)의 표식. LeftStack 의 버튼에 붙어 있다 */
export const SOURCE_SEL = '[data-guide-source="dust"]';
const PANEL_SEL = ".chat";
const THINK_MS = 650;
const FLY_MS = 900;
const COMET_STAY_MS = 2600;
const COMET_FADE_MS = 700;
const COMET_WAIT_MS = 120_000;
const MAX_TURNS = 12;

let thinkTimer: ReturnType<typeof setTimeout> | null = null;
let abortAi: AbortController | null = null;
let cometUnsub: (() => void) | null = null;
let cometTimers: ReturnType<typeof setTimeout>[] = [];
let cometStage2 = false;
/** 1단계 빛무리가 가리키는 버튼의 클릭 감시와 사라지는 타이머 */
let settleCtrl: AbortController | null = null;
let settleTimers: ReturnType<typeof setTimeout>[] = [];
/** 1단계 빛무리가 지금 가리키는 버튼. 화면 배치가 바뀌면 다시 찾아 따라간다 */
let currentTarget: GuideTarget | null = null;

const rectOf = (sel: string): DOMRect | null => {
  const el = document.querySelector<HTMLElement>(sel);
  return el && el.getClientRects().length > 0 ? el.getBoundingClientRect() : null;
};

/** 빛무리의 출발점: 챗봇 버튼의 빛 중심 */
function sourcePoint(): { x: number; y: number } | null {
  const r = rectOf(SOURCE_SEL);
  return r ? { x: r.left + r.width / 2, y: r.top + 24 } : null;
}

/** 답이 가리키는 요소의 바로 위 30px(위가 좁으면 아래 30px). 화면에 없거나 대화창 뒤면 null (5-5) */
export function locate(target: GuideTarget): { x: number; y: number } | null {
  const r = rectOf(`[data-guide-target="${target}"]`);
  if (!r) return null;
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const panel = rectOf(PANEL_SEL);
  if (panel && cx > panel.left && cx < panel.right && cy > panel.top && cy < panel.bottom) return null;
  const above = r.top - 30;
  return { x: cx, y: above < 76 ? r.bottom + 30 : above };
}

/** 빛무리를 from 에 놓았다가 한 틱 뒤 to 로 미끄러뜨린다 */
function fly(from: { x: number; y: number }, to: { x: number; y: number }, over = false) {
  chat.getState().setGuide({ x: from.x, y: from.y, move: false, over });
  setTimeout(() => {
    const g = chat.getState().guide;
    if (g && g.x === from.x && g.y === from.y) chat.getState().setGuide({ x: to.x, y: to.y, move: true, over });
  }, 60);
}

function cancelSettle() {
  settleCtrl?.abort();
  settleCtrl = null;
  for (const t of settleTimers) clearTimeout(t);
  settleTimers = [];
}

/** 가리키던 버튼을 눌렀다(또는 바로 가기로 같은 일을 했다): 잠시 머문 뒤 옅어지며 사라진다. 2단계와 같은 리듬 */
function settleGuide() {
  if (settleTimers.length) return; // 이미 사라지는 중
  settleCtrl?.abort();
  settleCtrl = null;
  settleTimers.push(
    setTimeout(() => {
      const g = chat.getState().guide;
      if (g && !g.over) chat.getState().setGuide({ ...g, move: false, fade: true });
      settleTimers.push(
        setTimeout(() => {
          const cur = chat.getState().guide;
          if (cur?.fade && !cur.over) chat.getState().setGuide(null);
          settleTimers = [];
        }, COMET_FADE_MS),
      );
    }, COMET_STAY_MS),
  );
}

/** 1단계 빛무리가 가리키는 버튼을 누르면 사라지도록 지켜본다 */
function watchTarget(target: GuideTarget) {
  cancelSettle();
  const el = document.querySelector<HTMLElement>(`[data-guide-target="${target}"]`);
  if (!el) return;
  settleCtrl = new AbortController();
  el.addEventListener("click", settleGuide, { once: true, signal: settleCtrl.signal });
}

/** 대화창 높이: 화면 가운데에 뜨므로 위아래 88px(상단 바)을 뺀 높이, 420 ~ 680 */
export function panelHeight(vh: number): number {
  return Math.round(Math.min(680, Math.max(420, vh - 176)));
}

/** 대화창 높이를 다시 잰다 (창 크기가 바뀌면) */
function measurePanel() {
  const s = chat.getState();
  if (!s.open) return;
  const h = panelHeight(window.innerHeight);
  if (h !== s.height) s.setOpen(true, h);
}

/**
 * 화면 배치가 바뀌었다(보기 방식 전환, 위치 편집, 창 크기, 패널·목록 열림). 대화창 높이를 다시 재고,
 * 1단계 빛무리는 가리키던 버튼을 다시 찾아 따라간다. 버튼이 사라졌으면(예: 3D 에는 "위치 편집"이 없다) 제자리로 돌아온다.
 */
function relayout() {
  measurePanel();
  const s = chat.getState();
  const g = s.guide;
  if (!g || g.over || g.fade || !currentTarget) return;
  const spot = locate(currentTarget);
  if (!spot) {
    currentTarget = null;
    cancelSettle();
    s.setGuide(null);
    return;
  }
  if (Math.abs(spot.x - g.x) > 0.5 || Math.abs(spot.y - g.y) > 0.5) {
    s.setGuide({ x: spot.x, y: spot.y, move: true });
    watchTarget(currentTarget); // 다시 그려진 버튼이면 클릭 감시도 새로 건다
  }
}

/** 배치가 바뀌는 신호를 모아 relayout 을 부른다 (그려진 뒤 재도록 조금 미룬다). 해제 함수를 돌려준다 — CosmicDust 가 떠 있는 동안만 */
export function installRelayout(): () => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      relayout();
    }, 120);
  };
  const unsub = store.subscribe((s, prev) => {
    if (s.view !== prev.view || s.editPos !== prev.editPos || s.sideTab !== prev.sideTab || s.route.name !== prev.route.name || s.selectedPlanetId !== prev.selectedPlanetId || s.cargo.length !== prev.cargo.length) schedule();
  });
  window.addEventListener("resize", schedule);
  return () => {
    unsub();
    window.removeEventListener("resize", schedule);
    if (t) clearTimeout(t);
  };
}

/** 대화창을 연다. 높이는 확대 조절·챗봇 버튼 줄을 완전히 덮도록 열 때 잰다 (5-2) */
export function openChat() {
  cancelComet();
  cancelSettle();
  chat.getState().setGuide(null);
  chat.getState().setOpen(true, panelHeight(window.innerHeight));
}

/** 닫는다. 날아가 있던 빛무리는 버튼 자리로 돌아온 뒤 사라진다 (5-5) */
export function closeChat() {
  const { guide, open } = chat.getState();
  if (!open) return;
  stopThinking();
  cancelComet();
  cancelSettle();
  chat.getState().setOpen(false);
  chat.getState().setTyping(false);
  const home = sourcePoint();
  if (guide && home) {
    chat.getState().setGuide({ x: guide.x, y: guide.y, move: false });
    setTimeout(() => chat.getState().setGuide({ x: home.x, y: home.y, move: true }), 20);
    setTimeout(() => {
      const g = chat.getState().guide;
      if (g && g.x === home.x && g.y === home.y) chat.getState().setGuide(null);
    }, FLY_MS + 40);
  } else chat.getState().setGuide(null);
}

export function toggleChat() {
  if (chat.getState().open) closeChat();
  else openChat();
}

function stopThinking() {
  if (thinkTimer) clearTimeout(thinkTimer);
  thinkTimer = null;
  abortAi?.abort();
  abortAi = null;
}

/** 질문을 보낸다. 빈 질문이나 답을 기다리는 중이면 무시 */
export function sendChat(raw: string) {
  const q = raw.trim();
  const s = chat.getState();
  if (!q || s.typing) return;
  stopThinking();
  cancelComet();
  cancelSettle();
  s.push({ who: "user", text: q });
  s.setInput("");
  s.setTyping(true);

  const a = answerFor(q);
  if (a) {
    thinkTimer = setTimeout(() => {
      thinkTimer = null;
      const spot = a.target ? locate(a.target) : null;
      const from = sourcePoint();
      chat.getState().push({ who: "bot", text: spot ? `${a.text}\n${STAY}` : a.text, action: a.action });
      chat.getState().setTyping(false);
      currentTarget = spot && from ? (a.target ?? null) : null;
      if (spot && from) {
        fly(from, spot);
        if (a.then !== "comet" && a.target) watchTarget(a.target); // 재발견 혜성 답은 2단계가 이어받는다
      } else chat.getState().setGuide(null);
      if (a.then === "comet") waitForObservatory();
    }, THINK_MS);
    return;
  }

  if (!CHATBOT_OK) {
    thinkTimer = setTimeout(() => {
      thinkTimer = null;
      chat.getState().push({ who: "bot", text: UNKNOWN });
      chat.getState().setTyping(false);
      chat.getState().setGuide(null);
    }, THINK_MS);
    return;
  }

  chat.getState().setGuide(null);
  currentTarget = null;
  const ctrl = new AbortController();
  abortAi = ctrl;
  const history: ChatTurn[] = chat
    .getState()
    .messages.slice(1) // 인사말은 뺀다
    .map((m) => ({ role: m.who === "bot" ? "assistant" : "user", content: m.text }) as ChatTurn)
    .slice(-MAX_TURNS);
  void (async () => {
    let id = -1;
    let text = "";
    try {
      for await (const chunk of askChatbot(history, ctrl.signal)) {
        if (ctrl.signal.aborted) return;
        if (id < 0) {
          chat.getState().setTyping(false);
          id = chat.getState().push({ who: "bot", text: "", streaming: true });
        }
        text += chunk;
        chat.getState().patch(id, text);
      }
      if (ctrl.signal.aborted) return;
      if (id < 0) chat.getState().push({ who: "bot", text: UNKNOWN });
      else chat.getState().patch(id, text, true);
    } catch (e) {
      if (ctrl.signal.aborted) return;
      const msg = e instanceof Error && e.message && !/fetch/i.test(e.message) ? e.message : FAILED;
      if (id < 0) chat.getState().push({ who: "bot", text: msg });
      else chat.getState().patch(id, text || msg, true);
    } finally {
      if (!ctrl.signal.aborted) {
        chat.getState().setTyping(false);
        if (abortAi === ctrl) abortAi = null;
      }
    }
  })();
}

/** 답 아래의 바로 가기 버튼 (5-4). 가리키던 일을 대신 해 준 것이라, 빛무리도 잠시 뒤 사라진다 */
export function runAction(action: ActionId) {
  const s = store.getState();
  if (chat.getState().guide && !chat.getState().cometWait) settleGuide();
  if (action === "openLinks") s.openSideTab("link");
  else if (action === "openObservatory") s.openObservatory();
  else if (action === "openProbe") s.openProbe();
  else if (action === "view3d") s.setView("3d");
  else if (action === "startEditPositions") {
    if (s.view !== "2d") {
      s.setView("2d");
      s.showToast("위치 편집은 2D 보기에서 해요. 2D로 바꿨어요");
    }
    store.getState().setEditPos(true);
  }
}

// ── 2단계 비행: 관측소가 열리면 "재발견 혜성 관측" 버튼으로 (5-5) ──

function cancelComet() {
  cometUnsub?.();
  cometUnsub = null;
  for (const t of cometTimers) clearTimeout(t);
  cometTimers = [];
  if (cometStage2) chat.getState().setGuide(null);
  cometStage2 = false;
  if (chat.getState().cometWait) chat.getState().setCometWait(false);
}

function waitForObservatory() {
  cancelComet();
  chat.getState().setCometWait(true);
  cometTimers.push(setTimeout(cancelComet, COMET_WAIT_MS)); // 관측소를 열지 않으면 기다리기를 그만둔다
  const onRoute = () => {
    const open = store.getState().route.name === "observatory";
    if (open && !cometStage2) cometTimers.push(setTimeout(flyToCometMode, 80)); // 관측소가 그려진 뒤 위치를 잰다
    else if (!open && cometStage2) cancelComet(); // 누르지 않고 닫으면 바로 사라진다
  };
  cometUnsub = store.subscribe((s, prev) => {
    if (s.route.name !== prev.route.name) onRoute();
  });
  onRoute();
}

function flyToCometMode() {
  const el = document.querySelector<HTMLElement>('[data-guide-target="comet-mode"]');
  const r = el && el.getClientRects().length > 0 ? el.getBoundingClientRect() : null;
  if (!el || !r) return cancelComet();
  const g = chat.getState().guide ?? sourcePoint();
  if (!g) return cancelComet();
  cometStage2 = true;
  fly({ x: g.x, y: g.y }, { x: r.left, y: r.top }, true); // 버튼의 왼쪽 위 모서리, 관측소 위층에
  el.addEventListener(
    "click",
    () => {
      // 눌렀으면 2.6초 머문 뒤 0.7초 동안 옅어지며 사라진다
      cometTimers.push(
        setTimeout(() => {
          const cur = chat.getState().guide;
          if (cur) chat.getState().setGuide({ ...cur, move: false, fade: true });
          cometTimers.push(setTimeout(cancelComet, COMET_FADE_MS));
        }, COMET_STAY_MS),
      );
    },
    { once: true },
  );
}
