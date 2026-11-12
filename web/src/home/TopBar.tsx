import { Rocket } from "lucide-react";
import { store, useStore, type SideTab } from "../state/store.ts";
import { PeriodPicker } from "./PeriodPicker.tsx";

/** 별자리는 5단계(시연용 데이터 계층)에서 생긴다. 그때까지 0 */
const LINK_COUNT = 0;

/** 상단 바: 로고, 목록 칩 3개(기록 · 행성 · 별자리), 기간, 탐사선 (README 6-1) */
export function TopBar() {
  const stars = useStore((s) => s.stars.length);
  const planets = useStore((s) => s.planets.filter((p) => (p.starCountInPeriod ?? 0) > 0).length);
  const cargo = useStore((s) => s.cargo.length);
  const tab = useStore((s) => s.sideTab);
  const chip = (key: SideTab, label: string, n: number) => (
    <button
      type="button"
      className={`chip${tab === key ? " is-on" : ""}`}
      aria-pressed={tab === key}
      title={`${label} 목록 열기 · 닫기`}
      onClick={() => store.getState().toggleSideTab(key)}
    >
      {label} {n}
    </button>
  );
  return (
    <header className="topbar card">
      <h1 className="topbar__brand">SPACELOG</h1>
      {chip("rec", "기록", stars)}
      {chip("planet", "행성", planets)}
      {chip("link", "별자리", LINK_COUNT)}
      <span className="topbar__spacer" />
      <PeriodPicker />
      <button type="button" className="pill-btn" onClick={() => store.getState().openProbe()}>
        <Rocket size={16} aria-hidden /> 탐사선
        {cargo > 0 && <span className="badge">{cargo}</span>}
      </button>
    </header>
  );
}
