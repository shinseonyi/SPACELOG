import { ArrowRight, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { CHATBOT_OK, CHATBOT_URL } from "./chatApi.ts";
import { useChat } from "./chatStore.ts";
import { closeChat, installRelayout, runAction, sendChat, toggleChat } from "./controller.ts";
import { ACTION_LABEL, BOT_NAME, FOLLOW_UP, suggestions, WAITING } from "./faq.ts";
import "./chat.css";

/** 흰 빛무리: 바깥 빛 · 핵 · 도는 반짝이 6개 (handoff 5-1) */
const SPARKS: [number, number, number, number][] = [[8, 10, 3, 0], [36, 8, 2, 0.7], [40, 30, 3, 1.3], [12, 36, 2, 1.9], [24, 2, 2, 2.4], [4, 24, 2, 0.4]];
export function Glow() {
  return (
    <span className="glow" aria-hidden>
      <i className="glow__halo" />
      <i className="glow__core" />
      <span className="glow__sparks">
        {SPARKS.map(([x, y, size, delay], i) => (
          <i key={i} style={{ left: x, top: y, width: size, height: size, "--dur": `${1.6 + i * 0.25}s`, "--delay": `${delay}s` } as CSSProperties} />
        ))}
      </span>
    </span>
  );
}

/**
 * 왼쪽 아래 묶음의 챗봇 버튼: 빛무리 + 이름표 "우주먼지" + "hello" 말풍선 (5-1, 문구는 팀 결정). 대화창이 열려 있으면 말풍선은 숨긴다.
 * 빛무리는 하나뿐이다: 길잡이로 날아가 있는 동안(GuideGlow)에는 버튼 자리(빛무리·이름표·말풍선)를 비워 두고, 돌아오면 다시 보인다.
 * 위치 편집(블랙홀이 켜진) 중에도 비워 둔다 — 그 자리는 블랙홀과 행성을 다루는 데 쓴다 (5-6).
 */
export function CosmicDustButton() {
  const open = useChat((s) => s.open);
  const edit = useStore((s) => s.editPos);
  const away = useChat((s) => s.guide !== null) || edit;
  return (
    <span className="dust">
      {!open && !away && (
        <span className="dust__bubble" aria-hidden>
          <span>hello</span>
        </span>
      )}
      <button type="button" className="dust__btn" data-guide-source="dust" aria-label={`${BOT_NAME} 챗봇 ${open ? "닫기" : "열기"}`} aria-expanded={open} aria-haspopup="dialog" disabled={edit} onClick={toggleChat}>
        {!away && <Glow />}
      </button>
      {!away && <span className="dust__name">{BOT_NAME}</span>}
    </span>
  );
}

/** 대화창 + 길잡이 빛무리. App 에 한 번 둔다 */
export function CosmicDust() {
  useEffect(installRelayout, []); // 보기 방식·위치 편집·창 크기가 바뀌면 빛무리가 따라가고 대화창 높이를 다시 잰다
  return (
    <>
      <GuideGlow />
      <ChatPanel />
    </>
  );
}

function GuideGlow() {
  const guide = useChat((s) => s.guide);
  const obsOpen = useStore((s) => s.route.name === "observatory");
  if (!guide || (obsOpen && !guide.over)) return null; // 관측소가 열려 있으면 1단계 빛무리는 숨긴다 (6-5)
  const cls = `guide${guide.move ? " guide--move" : ""}${guide.over ? " guide--over" : ""}${guide.fade ? " guide--fade" : ""}`;
  return (
    <span className={cls} style={{ left: guide.x, top: guide.y }} aria-hidden>
      <Glow />
    </span>
  );
}

function ChatPanel() {
  const open = useChat((s) => s.open);
  const height = useChat((s) => s.height);
  const messages = useChat((s) => s.messages);
  const typing = useChat((s) => s.typing);
  const input = useChat((s) => s.input);
  const setInput = useChat((s) => s.setInput);
  const edit = useStore((s) => s.editPos);
  const obsOpen = useStore((s) => s.route.name === "observatory");
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  // 새 메시지가 오면 맨 아래로. 열리면 입력 칸에 포커스
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  if (!open) return null;
  const asked = messages.filter((m) => m.who === "user").map((m) => m.text);
  const chips = typing ? [] : suggestions(asked, messages.length <= 1);
  const dim = obsOpen ? "obs" : edit ? "edit" : undefined; // 관측소가 열리면 0%, 위치 편집 중엔 16% (5-6)

  return (
    <section
      className="chat"
      role="dialog"
      aria-label={`${BOT_NAME} 챗봇`}
      data-dim={dim}
      style={{ height }}
      onKeyDown={(e) => {
        e.stopPropagation(); // 대화창 안의 키는 우주 비행 키(WASD 등)로 가지 않는다 (5-7)
        if (e.key === "Escape") closeChat();
      }}
    >
      <header className="chat__head">
        <i className="chat__dot" aria-hidden />
        <div className="chat__titles">
          <span className="chat__title">{BOT_NAME}</span>
          <span className="chat__sub">이 우주를 떠다니는 길잡이</span>
        </div>
        {CHATBOT_OK && (
          <a className="chat__newtab" href={CHATBOT_URL} target="_blank" rel="noreferrer">
            새 탭에서 열기
          </a>
        )}
        <Button className="btn--icon" aria-label="챗봇 닫기" onClick={closeChat}>
          <X size={14} aria-hidden />
        </Button>
      </header>

      <div className="chat__log" ref={log} aria-live="polite">
        {messages.map((m) =>
          m.who === "user" ? (
            <span key={m.id} className="chat__msg chat__msg--user">{m.text}</span>
          ) : (
            <div key={m.id} className="chat__group">
              <span className="chat__msg chat__msg--bot">{m.text || "…"}</span>
              {m.action && (
                <button type="button" className="chat__chip" onClick={() => runAction(m.action!)}>
                  {ACTION_LABEL[m.action]}
                  <ArrowRight size={12} aria-hidden />
                </button>
              )}
            </div>
          ),
        )}
        {typing && <span className="chat__msg chat__msg--bot chat__msg--wait">{WAITING}</span>}
        {chips.length > 0 && (
          <div className="chat__group chat__group--wide">
            {messages.length > 1 && <span className="chat__msg chat__msg--bot">{FOLLOW_UP}</span>}
            <div className="chat__chips">
              {chips.map((q) => (
                <button key={q} type="button" className="chat__chip" onClick={() => sendChat(q)}>{q}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        className="chat__form"
        onSubmit={(e) => {
          e.preventDefault();
          sendChat(input);
        }}
      >
        <input
          ref={field}
          className="chat__input"
          value={input}
          maxLength={200}
          autoComplete="off"
          placeholder="어디서 무엇을 하는지 물어보세요"
          aria-label="질문"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.nativeEvent.isComposing) e.preventDefault(); // 한글 조합 중 Enter 는 보내지 않는다
          }}
        />
        <button type="submit" className="chat__send" aria-label="보내기" disabled={typing || !input.trim()}>
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </section>
  );
}
