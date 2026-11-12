import { HOW_TO_USE_URL } from "../ui/links.ts";
import { X } from "lucide-react";
import { store, useStore, type SideTab, type ViewMode } from "../state/store.ts";
import { useDemo } from "../demo/demoStore.ts";
import { PeriodPicker } from "./PeriodPicker.tsx";
import "../view/view.css";

const VIEWS: { key: ViewMode; label: string; hint: string }[] = [
  { key: "2d", label: "2D", hint: "평면으로 한눈에 보기" },
  { key: "2.5d", label: "2.5D", hint: "깊이감 있게 날아다니며 보기" },
  { key: "3d", label: "3D", hint: "3D 우주를 날아다니며 보기" },
];

/** 상단 바: 로고, 목록 칩 3개(기록 · 행성 · 별자리), 보기 방식, 기간 (README 6-1). 탐사선·관측소는 오른쪽 아래 (ActionBar) */
export function TopBar() {
  const stars = useStore((s) => s.stars.length);
  const planets = useStore((s) => s.planets.filter((p) => (p.starCountInPeriod ?? 0) > 0).length);
  const tab = useStore((s) => s.sideTab);
  const view = useStore((s) => s.view);
  const links = useDemo((s) => s.links.length);
  const picked = useStore((s) => s.picked.length);
  const chip = (key: SideTab, label: string, n: number) => (
    <button
      type="button"
      className={`chip${tab === key ? " is-on" : ""}`}
      aria-pressed={tab === key}
      title={`${label} 목록 열기 · 닫기`}
      data-guide-target={key === "link" ? "links" : undefined} // 우주먼지의 길잡이 비행 표식 (chat/controller.ts)
      onClick={() => store.getState().toggleSideTab(key)}
    >
      {label} {n}
    </button>
  );
  return (
    <header className="topbar card">
      <h1 className="topbar__brand">
        <a className="topbar__logo" href={HOW_TO_USE_URL} target="_blank" rel="noreferrer" title="사용 방법 보기 (How to use)">SPACELOG</a>
      </h1>
      {chip("rec", "기록", stars)}
      {chip("planet", "행성", planets)}
      {chip("link", "별자리", links)}
      {picked > 0 && (
        <span className="chip chip--pick" role="group" aria-label={`선택한 기록 ${picked}개`}>
          <button type="button" className="chip__label" title="선택한 기록 보기" onClick={() => store.getState().openSideTab("rec")}>선택 {picked}</button>
          <button type="button" className="chip__x" aria-label="선택 해제" title="선택 해제" onClick={() => store.getState().clearPicked()}><X size={12} aria-hidden /></button>
        </span>
      )}
      <span className="topbar__spacer" />
      <div className="viewseg" role="radiogroup" aria-label="보기 방식">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" role="radio" aria-checked={view === v.key} title={v.hint} className={view === v.key ? "is-on" : ""} data-guide-target={v.key === "3d" ? "view3d" : undefined} onClick={() => store.getState().setView(v.key)}>
            {v.label}
          </button>
        ))}
      </div>
      <PeriodPicker />
    </header>
  );
}
