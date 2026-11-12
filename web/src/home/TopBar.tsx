import { Rocket } from "lucide-react";
import { store, useStore, type SideTab, type ViewMode } from "../state/store.ts";
import { useDemo } from "../demo/demoStore.ts";
import { PeriodPicker } from "./PeriodPicker.tsx";
import "../view/view.css";

const VIEWS: { key: ViewMode; label: string; hint: string }[] = [
  { key: "2d", label: "2D", hint: "평면으로 한눈에 보기" },
  { key: "2.5d", label: "2.5D", hint: "깊이감 있게 날아다니며 보기" },
  { key: "3d", label: "3D", hint: "3D 우주를 날아다니며 보기" },
];

/** 상단 바: 로고, 목록 칩 3개(기록 · 행성 · 별자리), 기간, 탐사선 (README 6-1) */
export function TopBar() {
  const stars = useStore((s) => s.stars.length);
  const planets = useStore((s) => s.planets.filter((p) => (p.starCountInPeriod ?? 0) > 0).length);
  const cargo = useStore((s) => s.cargo.length);
  const tab = useStore((s) => s.sideTab);
  const view = useStore((s) => s.view);
  const links = useDemo((s) => s.links.length);
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
      {chip("link", "별자리", links)}
      <span className="topbar__spacer" />
      <div className="viewseg" role="radiogroup" aria-label="보기 방식">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" role="radio" aria-checked={view === v.key} title={v.hint} className={view === v.key ? "is-on" : ""} onClick={() => store.getState().setView(v.key)}>
            {v.label}
          </button>
        ))}
      </div>
      <PeriodPicker />
      <button type="button" className="pill-btn" onClick={() => store.getState().openProbe()}>
        <Rocket size={16} aria-hidden /> 탐사선
        {cargo > 0 && <span className="badge">{cargo}</span>}
      </button>
    </header>
  );
}
