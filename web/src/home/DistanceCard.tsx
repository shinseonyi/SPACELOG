import { useMemo } from "react";
import { useDemo } from "../demo/demoStore.ts";
import { store, useStore } from "../state/store.ts";
import { planetPositions } from "../universe/layout.ts";
import { DEPTH_STEP, planetLook, planetNodes, recencyRank } from "../view/look.ts";
import { distancesFrom, formatDistance, formatStamp, recencyRows, type Point3 } from "./distance.ts";

/**
 * 행성 간 거리 카드 (2.5D · 3D 보기, 왼쪽 아래 묶음의 맨 아래). 최근에 기록을 넣은 순서로 모든 행성을 접지 않고 보여 준다(길면 카드 안 스크롤).
 * 줄 값: 가장 최근에 기록을 넣은 시각 "11.12 14:20" + 뒤에 괄호로 거리 "(453m)". 거리는 기준 행성(착륙한 행성, 없으면 맨 위 행성)에서 잰다.
 * 2.5D 는 최근에 기록을 넣은 행성을 앞에 두므로 줄 순서가 곧 화면 속 앞뒤 순서다. 줄을 누르면 그 행성으로 날아가 착륙한다. 기간 안의 기록 기준.
 */
export function DistanceCard() {
  const view = useStore((s) => s.view);
  const planets = useStore((s) => s.planets);
  const stars = useStore((s) => s.stars);
  const selected = useStore((s) => s.selectedPlanetId);
  const edit = useStore((s) => s.editPos);
  const overrides = useDemo((s) => s.planets);
  const rows = useMemo(() => recencyRows(planets.map((p) => p.id), stars), [planets, stars]);

  // 각 보기가 행성을 놓는 좌표 (2.5D: 평면 x·y + 최근 기록 순 깊이, 3D: 장면 좌표)
  const points = useMemo(() => {
    const m = new Map<string, Point3>();
    if (view === "2.5d") {
      const rank = recencyRank(planets, stars);
      for (const n of planetNodes(planets, overrides)) m.set(n.id, [n.x, n.y, (rank.get(n.id) ?? 0) * DEPTH_STEP]);
    } else if (view === "3d") for (const [id, p] of planetPositions(planets)) m.set(id, p);
    return m;
  }, [view, planets, stars, overrides]);

  if (view === "2d" || edit || planets.length < 2) return null;
  const refId = selected && rows.some((r) => r.id === selected) ? selected : rows[0]?.id;
  const dist = refId ? distancesFrom(refId, points) : new Map<string, number>();

  return (
    <section className="dist" aria-label="행성 간 거리">
      <span className="dist__title">행성 간 거리 · 최근 기록 순</span>
      <ul className="dist__list">
        {rows.map((r) => {
          const p = planets.find((x) => x.id === r.id);
          if (!p) return null;
          const when = r.last ? formatStamp(r.last) : "기록 없음";
          const d = dist.get(r.id);
          const far = r.id === refId ? "기준" : d !== undefined ? formatDistance(d) : "";
          return (
            <li key={r.id}>
              <button type="button" className={`dist__row${r.id === selected ? " is-on" : ""}`} aria-current={r.id === selected || undefined} title="이 행성으로 이동" aria-label={`${p.name}(으)로 이동, 최근 기록 ${when}${far ? `, ${far}` : ""}`} onClick={() => void store.getState().flyToPlanet(r.id, "openPanel")}>
                <i className="dist__dot" style={{ background: planetLook(p).accent }} />
                <span className="dist__name">{p.name}</span>
                <span className={`dist__d${r.last ? "" : " is-empty"}`}>
                  {when}
                  {far && <span className="dist__m"> ({far})</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
