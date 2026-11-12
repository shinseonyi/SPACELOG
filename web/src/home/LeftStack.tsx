import { Minus, Plus } from "lucide-react";
import { CosmicDustButton } from "../chat/CosmicDust.tsx";
import { useStore } from "../state/store.ts";
import { useViewApi } from "../view/viewApi.ts";
import { RediscoverySlot } from "./RediscoveryCard.tsx";

/**
 * 왼쪽 아래 묶음. 아래에서 위로 쌓인다 (left 24 · bottom 88 · gap 12 · 폭 260).
 * 확대 조절(켜진 보기가 알려 줄 때만) + 우주먼지 버튼(chat/), 재발견 혜성 카드. 행성 간 거리 카드는 3D 쪽 데이터와 함께 붙인다.
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
        <CosmicDustButton />
      </div>
      <RediscoverySlot />
    </div>
  );
}
