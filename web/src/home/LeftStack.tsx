import { Minus, MessageCircle, Plus } from "lucide-react";
import { useStore } from "../state/store.ts";
import { useViewApi } from "../view/viewApi.ts";
import { RediscoverySlot } from "./RediscoveryCard.tsx";

/** 배포한 챗봇 주소. 설정값이 없으면 버튼을 그리지 않는다 (README 6-1, 9단계에서 주소 확정) */
const CHATBOT_URL = (import.meta.env.VITE_CHATBOT_URL as string | undefined) || "";

/**
 * 왼쪽 아래 묶음. 아래에서 위로 쌓인다 (left 24 · bottom 72 · gap 12 · 폭 260).
 * 확대 조절(켜진 보기가 알려 줄 때만) + 챗봇 버튼, 재발견 혜성 카드. 행성 간 거리 카드는 3D 쪽 데이터와 함께 붙인다.
 */
export function LeftStack() {
  const zoom = useViewApi((s) => s.zoom);
  const edit = useStore((s) => s.editPos);
  return (
    <div className="stack" data-edit={edit || undefined}>
      <div className="stack__row">
        {zoom && (
          <div className="zoom card" role="group" aria-label="확대 축소">
            <button type="button" className="zoom__step" aria-label="확대" title="확대 (Shift)" onClick={zoom.zoomIn}><Plus size={18} aria-hidden /></button>
            <button type="button" className="zoom__fit" aria-label={`배율 ${zoom.label}. 모든 행성이 보이게 맞추기`} title="모든 행성이 보이게 맞추기" onClick={zoom.fit}>{zoom.label}</button>
            <button type="button" className="zoom__step" aria-label="축소" title="축소 (Space)" onClick={zoom.zoomOut}><Minus size={18} aria-hidden /></button>
          </div>
        )}
        {CHATBOT_URL && (
          <a className="chatbot" href={CHATBOT_URL} target="_blank" rel="noreferrer" aria-label="챗봇 열기" title="챗봇 열기">
            <MessageCircle size={22} aria-hidden />
          </a>
        )}
      </div>
      <RediscoverySlot />
    </div>
  );
}
