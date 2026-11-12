import { useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { CosmicDustButton } from "../chat/CosmicDust.tsx";
import { clampDust, dustPos, setDustPos, useDustPos } from "../chat/dustPos.ts";
import { useStore } from "../state/store.ts";
import { WIDE_QUERY, useMedia } from "../ui/useMedia.ts";
import { useViewApi } from "../view/viewApi.ts";
import { DistanceCard } from "./DistanceCard.tsx";
import { RediscoverySlot } from "./RediscoveryCard.tsx";

/**
 * 왼쪽 아래 묶음. 아래에서 위로 쌓인다 (left 24 · bottom 88 · gap 12 · 폭 260).
 * 위에서 아래로: 확대 조절(켜진 보기가 알려 줄 때만) + 우주먼지 버튼(chat/) → 재발견 혜성 카드 → 행성 간 거리 카드(2.5D · 3D) (handoff 7-3).
 * column-reverse 라 JSX 순서는 그 반대다.
 * 넓은 화면(960px 이상, "기록 넣기"가 가운데 아래)에서는 우주먼지 버튼을 "기록 넣기" 바로 위 가운데로 뺀다 (.dust-dock).
 * 사용자가 우주먼지를 끌어 옮겼으면 그 자리에 그린다 (.dust-free). 창 크기가 바뀌면 화면 안으로 다시 넣는다.
 */
export function LeftStack() {
  const zoom = useViewApi((s) => s.zoom);
  const edit = useStore((s) => s.editPos);
  const wide = useMedia(WIDE_QUERY);
  const moved = useDustPos();
  useEffect(() => {
    const fit = () => {
      const p = dustPos.getState().pos;
      const el = document.querySelector(".dust-free .dust");
      if (!p || !el) return;
      const r = el.getBoundingClientRect();
      const c = clampDust(p, r.width, r.height, window.innerWidth, window.innerHeight);
      if (c.x !== p.x || c.y !== p.y) setDustPos(c);
    };
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  const dust = <CosmicDustButton />;
  return (
    <>
      <div className="stack" data-edit={edit || undefined}>
        <DistanceCard />
        <RediscoverySlot />
        <div className="stack__row">
          {zoom && (
            <div className="zoom card" role="group" aria-label="확대 축소">
              <button type="button" className="zoom__step" aria-label="확대" title="확대 (Shift)" onClick={zoom.zoomIn}><Plus size={18} aria-hidden /></button>
              <button type="button" className="zoom__fit" aria-label={`맞춤: 모든 행성이 보이게 맞추기. 지금 배율 ${zoom.percent}%`} title="모든 행성이 보이게 맞추기" onClick={zoom.fit}>
                <span className="zoom__fit-label">맞춤</span>
                <span className="zoom__pct">({zoom.percent}%)</span>
              </button>
              <button type="button" className="zoom__step" aria-label="축소" title="축소 (Space)" onClick={zoom.zoomOut}><Minus size={18} aria-hidden /></button>
            </div>
          )}
          {!moved && !wide && dust}
        </div>
      </div>
      {moved ? (
        <div className="dust-free" style={{ left: moved.x, top: moved.y }}>
          {dust}
        </div>
      ) : (
        wide && <div className="dust-dock">{dust}</div>
      )}
    </>
  );
}
