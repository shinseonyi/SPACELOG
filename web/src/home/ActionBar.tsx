import { Orbit, Rocket } from "lucide-react";
import { useDemo } from "../demo/demoStore.ts";
import { store, useStore } from "../state/store.ts";

/**
 * 오른쪽 아래 버튼 묶음 (README 6-1): 탐사선 · N, 관측소 · N. 높이 44px 알약.
 * 위치 편집 · 행성 추가는 7단계에서 이 묶음 앞에 붙는다. 패널·관측소·탐사선이 열려 있으면 숨긴다.
 */
export function ActionBar() {
  const cargo = useStore((s) => s.cargo.length);
  const links = useDemo((s) => s.links.length);
  const hidden = useStore((s) => s.selectedPlanetId !== null || s.selectedStarId !== null || s.route.name === "probe" || s.route.name === "observatory");
  if (hidden) return null;
  return (
    <div className="actionbar">
      <button type="button" className="actionbar__btn" onClick={() => store.getState().openProbe()}>
        <Rocket size={16} aria-hidden /> 탐사선{cargo > 0 && <span className="actionbar__n">{cargo}</span>}
      </button>
      <button type="button" className="actionbar__btn actionbar__btn--primary" onClick={() => store.getState().openObservatory()}>
        <Orbit size={16} aria-hidden /> 관측소{links > 0 && <span className="actionbar__n">{links}</span>}
      </button>
    </div>
  );
}
