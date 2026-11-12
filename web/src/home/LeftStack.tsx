import { MessageCircle } from "lucide-react";
import { RediscoverySlot } from "./RediscoveryCard.tsx";

/** 배포한 챗봇 주소. 설정값이 없으면 버튼을 그리지 않는다 (README 6-1, 9단계에서 주소 확정) */
const CHATBOT_URL = (import.meta.env.VITE_CHATBOT_URL as string | undefined) || "";

/**
 * 왼쪽 아래 묶음. 아래에서 위로 쌓인다 (left 24 · bottom 72 · gap 12 · 폭 260).
 * 지금은 챗봇 버튼과 재발견 혜성 카드. 확대 조절은 3단계(2.5D), 행성 간 거리 카드는 3D 쪽 데이터와 함께 붙인다.
 */
export function LeftStack() {
  return (
    <div className="stack">
      {CHATBOT_URL && (
        <a className="chatbot" href={CHATBOT_URL} target="_blank" rel="noreferrer" aria-label="챗봇 열기" title="챗봇 열기">
          <MessageCircle size={22} aria-hidden />
        </a>
      )}
      <RediscoverySlot />
    </div>
  );
}
