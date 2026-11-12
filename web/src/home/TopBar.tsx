import { Rocket } from "lucide-react";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { PeriodPicker } from "./PeriodPicker.tsx";

/** 왼쪽 위: 서비스 이름, 기간 안 기록·행성 개수, 기간 선택, 탐사선 (SPEC 1-4). 2단계에서 새 상단 바로 교체한다 */
export function TopBar() {
  const stars = useStore((s) => s.stars.length);
  const planets = useStore((s) => s.planets.filter((p) => (p.starCountInPeriod ?? 0) > 0).length);
  const cargo = useStore((s) => s.cargo.length);
  return (
    <header className="topbar card">
      <h1 className="topbar__brand">
        SPACE<span>LOG</span>
      </h1>
      <p className="topbar__stats">
        기록 <b>{stars}</b> · 행성 <b>{planets}</b>
      </p>
      <PeriodPicker />
      <Button variant="accent" className="topbar__probe" onClick={() => store.getState().openProbe()}>
        <Rocket size={16} aria-hidden /> 탐사선{cargo > 0 && <span className="badge">{cargo}</span>}
      </Button>
    </header>
  );
}
