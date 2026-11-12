import { useStore } from "../state/store.ts";
import { PlanetPanel } from "./PlanetPanel.tsx";
import { StarDetail } from "./StarDetail.tsx";

/** 우주 위에 열리는 오른쪽 패널. 기록 상세가 열려 있으면 그것을, 아니면 행성 패널을 (SPEC 1-5) */
export function PanelHost() {
  const starId = useStore((s) => s.selectedStarId);
  const planetId = useStore((s) => s.selectedPlanetId);
  if (starId) return <StarDetail starId={starId} />;
  if (planetId) return <PlanetPanel planetId={planetId} />;
  return null;
}
