import { useMemo, useState } from "react";
import { ArrowUpRight, Rocket, X } from "lucide-react";
import type { Star } from "@spacelog/shared/types";
import { demo, useDemo } from "../demo/demoStore.ts";
import { store, useStore } from "../state/store.ts";
import { planetColorToken } from "../ui/planetColor.ts";
import { starTitle } from "../ui/starTitle.ts";
import { useSceneState } from "../universe/sceneState.ts";

const time = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
const accent = (token: string) => `var(--${planetColorToken(token)})`;

/**
 * 오른쪽 창 (폭 300px, right 24 · top 88). 위 칩에서 고른 목록 하나만 연다. 행성 패널·기록 상세가 열리면 숨긴다.
 * 행성 줄을 누르면 날아가 패널을 연다 (SPEC 1-4, POLICY 2-5): 0개 행성은 흐리게, 날아가지 않고 패널만.
 */
export function SideWindow() {
  const tab = useStore((s) => s.sideTab);
  const hidden = useStore((s) => s.selectedPlanetId !== null || s.selectedStarId !== null);
  if (!tab || hidden) return null;
  return (
    <aside className="side" aria-label={tab === "planet" ? "행성 목록" : tab === "rec" ? "기록 목록" : "별자리 목록"}>
      {tab === "planet" && <PlanetCard />}
      {tab === "rec" && <RecordCard />}
      {tab === "link" && <LinkCard />}
    </aside>
  );
}

function PlanetCard() {
  const planets = useStore((s) => s.planets);
  const selected = useStore((s) => s.selectedPlanetId);
  const near = useSceneState((s) => s.nearPlanetId);
  const sorted = [...planets].sort((a, b) => Number(!!a.system) - Number(!!b.system) || (b.starCountInPeriod ?? 0) - (a.starCountInPeriod ?? 0));
  return (
    <section className="card side__card">
      <h2 className="side__title">행성으로 바로 날아가기</h2>
      <ul className="rows">
        {sorted.map((p) => {
          const n = p.starCountInPeriod ?? 0;
          const here = p.id === near || p.id === selected;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`row${here ? " is-here" : ""}${n === 0 ? " is-empty" : ""}`}
                aria-current={p.id === selected ? "true" : undefined}
                onClick={() => (n > 0 ? store.getState().flyToPlanet(p.id, "openPanel") : store.getState().openPanel(p.id))}
              >
                <i className="row__dot" style={{ background: accent(p.colorToken) }} />
                <span className="row__name">{p.name}</span>
                <span className="row__n" style={{ color: accent(p.colorToken) }}>{n}</span>
                <ArrowUpRight size={14} aria-hidden className="row__go" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecordCard() {
  const stars = useStore((s) => s.stars);
  const planets = useStore((s) => s.planets);
  const label = useStore((s) => (s.period.preset === "today" ? "오늘" : s.period.preset === "week" ? "이번 주" : "이 기간"));
  const [mode, setMode] = useState<"all" | "planet">("all");
  const [picked, setPicked] = useState<string[]>([]);
  const planetOf = useMemo(() => new Map(planets.map((p) => [p.id, p])), [planets]);
  const rows = useMemo(() => [...stars].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)), [stars]);
  const alive = picked.filter((id) => stars.some((s) => s.id === id)); // 목록에서 사라진 기록은 선택에서도 뺀다

  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const load = () => {
    const { addToCargo, showToast } = store.getState();
    const added = alive.filter((starId) => addToCargo({ type: "star", starId })).length;
    showToast(added === alive.length ? `기록 ${added}개를 탐사선에 실었어요` : `${added}개를 실었어요. 나머지는 이미 실려 있어요`, "success");
    setPicked([]);
  };

  const row = (s: Star) => {
    const planet = planetOf.get(s.planetId);
    const on = alive.includes(s.id);
    return (
      <li key={s.id} className={`row row--rec${on ? " is-picked" : ""}`}>
        <button type="button" role="checkbox" aria-checked={on} aria-label={`${starTitle(s)} 선택`} className={`check${on ? " is-on" : ""}`} onClick={() => toggle(s.id)} />
        <button type="button" className="row__main" onClick={() => store.getState().openStar(s.id)}>
          <i className="row__dot" style={{ background: accent(planet?.colorToken ?? "planet-1") }} />
          <span className="row__text">
            <span className="row__title">{starTitle(s)}</span>
            <span className="row__sub">{planet?.name ?? "행성"} · {time(s.createdAtUtc)}</span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className="card side__card side__card--list">
      <h2 className="side__title">{label} 기록 {stars.length}</h2>
      <div className="seg2" role="radiogroup" aria-label="목록 보기 방식">
        {(["all", "planet"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>
            {m === "all" ? "전체 보기" : "행성별 보기"}
          </button>
        ))}
      </div>
      {stars.length === 0 ? (
        <p className="side__empty">이 기간에 넣은 기록이 없어요.</p>
      ) : (
        <ul className="rows rows--scroll">
          {mode === "all"
            ? rows.map(row)
            : planets
                .map((p) => ({ p, own: rows.filter((s) => s.planetId === p.id) }))
                .filter((g) => g.own.length > 0)
                .map((g) => (
                  <li key={g.p.id} className="group">
                    <span className="group__title" style={{ color: accent(g.p.colorToken) }}>{g.p.name} · {g.own.length}</span>
                    <ul className="rows">{g.own.map(row)}</ul>
                  </li>
                ))}
        </ul>
      )}
      {alive.length > 0 && (
        <div className="side__bar">
          <button type="button" className="btn btn--primary" onClick={load}>
            <Rocket size={16} aria-hidden /> 탐사선에 싣기 · {alive.length}
          </button>
          <button type="button" className="side__clear" onClick={() => setPicked([])}>해제</button>
        </div>
      )}
    </section>
  );
}

/** 별자리 목록. 체크한 별자리만 우주에 선으로 보인다 (README 6-1). 만들기·수정은 6단계 */
function LinkCard() {
  const links = useDemo((s) => s.links);
  const hidden = useDemo((s) => s.hiddenLinkIds);
  return (
    <section className="card side__card">
      <div className="side__head">
        <h2 className="side__title">별자리 {links.length}</h2>
        <button type="button" className="btn btn--icon" aria-label="별자리 목록 닫기" onClick={() => store.getState().toggleSideTab("link")}>
          <X size={14} aria-hidden />
        </button>
      </div>
      {links.length === 0 ? (
        <p className="side__empty">아직 별자리가 없어요. 기록을 체크해 별자리를 만들면 여기에 모입니다.</p>
      ) : (
        <>
          <p className="side__note">체크한 별자리만 우주에 선으로 보여요</p>
          <ul className="rows">
            {links.map((l) => {
              const shown = !hidden.includes(l.id);
              return (
                <li key={l.id} className="row row--rec">
                  <button type="button" role="checkbox" aria-checked={shown} aria-label={`${l.name} 우주에 ${shown ? "숨기기" : "보이기"}`} title="우주에 보이기 · 숨기기" className={`check${shown ? " is-on" : ""}`} onClick={() => toggleShown(l.id)} />
                  <span className="row__main">
                    <span className="row__text">
                      <span className="row__title">{l.name}</span>
                      <span className="row__sub">기록 {l.starIds.length}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

const toggleShown = (id: string) => demo.getState().toggleLinkShown(id);
