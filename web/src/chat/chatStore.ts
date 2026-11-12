// 우주먼지 대화 상태 (handoff 5-8). 저장하지 않는다 — 새로고침하면 인사말부터.
// 버튼(LeftStack)과 대화창·빛무리(App)가 떨어져 있어 작은 스토어로 잇는다. 흐름(보내기·비행)은 controller.ts.
import { createStore, useStore as useZustand } from "zustand";
import { GREETING, type ActionId } from "./faq.ts";

export interface ChatMsg {
  id: number;
  who: "bot" | "user";
  text: string;
  action?: ActionId;
  /** AI 답이 아직 오는 중 */
  streaming?: boolean;
}

/** 길잡이 빛무리. 화면(viewport) 좌표의 중심점 */
export interface Guide {
  x: number;
  y: number;
  /** true 면 900ms 동안 미끄러져 간다, false 면 그 자리에 바로 */
  move: boolean;
  /** 2단계(관측소 위). 관측소보다 위층에 그린다 */
  over?: boolean;
  /** 옅어지며 사라지는 중 */
  fade?: boolean;
  /** 버튼 자리에 돌아와 옅어지는 중: 그동안 버튼의 빛무리가 다시 켜져 서로 겹치며 바뀐다 */
  home?: boolean;
  /** 위치를 가리키는 중: 위에 "Here!" 말풍선 (버튼 자리로 돌아갈 때는 없음) */
  here?: boolean;
  /** 버튼 아래쪽에 머문다(위가 좁을 때). 말풍선도 빛 아래에 띄워 버튼을 가리지 않는다 */
  below?: boolean;
}

export interface ChatState {
  open: boolean;
  /** 열 때 잰 높이(px). 확대 조절 줄을 덮는다 (5-2) */
  height: number;
  messages: ChatMsg[];
  typing: boolean;
  input: string;
  guide: Guide | null;
  /** 날아가지 않고 버튼 자리에서 가리키는 중 (우주먼지가 가리킬 버튼 바로 위에 있을 때): 버튼의 말풍선이 "Here!" */
  here: boolean;
  /** "Here!"를 띄운 횟수. 바뀔 때마다 버튼을 다시 그려 두 바퀴 도는 동작을 처음부터 다시 한다 */
  hereSeq: number;
  /** 재발견 혜성 답 뒤, 관측소가 열리기를 기다리는 중 (5-5 2단계) */
  cometWait: boolean;

  setOpen(open: boolean, height?: number): void;
  setInput(input: string): void;
  push(m: Omit<ChatMsg, "id">): number;
  patch(id: number, text: string, done?: boolean): void;
  setTyping(typing: boolean): void;
  setGuide(guide: Guide | null): void;
  setHere(here: boolean): void;
  setCometWait(on: boolean): void;
}

export function createChatStore() {
  let seq = 0;
  return createStore<ChatState>()((set, get) => ({
    open: false,
    height: 520,
    messages: [{ id: ++seq, who: "bot", text: GREETING }],
    typing: false,
    input: "",
    guide: null,
    here: false,
    hereSeq: 0,
    cometWait: false,

    setOpen(open, height) {
      set({ open, ...(height ? { height } : {}) });
    },
    setInput(input) {
      set({ input });
    },
    push(m) {
      const id = ++seq;
      set({ messages: [...get().messages, { ...m, id }] });
      return id;
    },
    patch(id, text, done) {
      set({ messages: get().messages.map((m) => (m.id === id ? { ...m, text, streaming: done ? undefined : m.streaming } : m)) });
    },
    setTyping(typing) {
      set({ typing });
    },
    setGuide(guide) {
      set({ guide });
    },
    setHere(here) {
      set(here ? { here, hereSeq: get().hereSeq + 1 } : { here });
    },
    setCometWait(cometWait) {
      set({ cometWait });
    },
  }));
}

export const chat = createChatStore();

export function useChat<T>(selector: (s: ChatState) => T): T {
  return useZustand(chat, selector);
}
