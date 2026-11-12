import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useDemo } from "../demo/demoStore.ts";
import { store, useStore } from "../state/store.ts";
import { planetPositions } from "../universe/layout.ts";
import { DEPTH_STEP, planetLook, planetNodes, recencyRank } from "../view/look.ts";
import { distancesFrom, formatDistance, referencePlanet, type Point3 } from "./distance.ts";

/** 처음에 보이는 줄 수. 착륙해 패널이 열려 있으면 2줄만 (시안 W01) */
const TOP = 4;
const TOP_LANDED = 2;

/**
 * 행성 간 거리 카드 (2.5D · 3D 보기, 왼쪽 아래 묶음의 맨 아래). "‘기준 행성’에서의 거리" + 가까운 행성 줄(색 점 · 이름 · 627m).
 * 줄을 누르면 그 행성으로 날아가 착륙한다. 나머지는 "그 외 행성 N"으로 펼친다. 거리는 각 보기가 행성을 놓는 좌표 그대로 잰다.
 */
export function DistanceCard() {
  const view = useStore((s) => s.view);
  const planets = useStore((s) => s.planets);
  const stars = useStore((s) => s.stars);
  const selected = useStore((s) => s.selectedPlanetId);
  const edit = useStore((s) => s.editPos);
  const overrides = useDemo((s) => s.planets);
  const [more, setMore] = useState(false);

  const rank = useMemo(() => recencyRank(planets, stars), [planets, stars]);
  const points = useMemo(() => {
    const m = new Map<string, Point3>();
    if (view === "2.5d") for (const n of planetNodes(planets, overrides)) m.set(n.id, [n.x, n.y, (rank.get(n.id) ?? 0) * DEPTH_STEP]);
    else if (view === "3d") for (const [id, p] of planetPositions(planets)) m.set(id, p);
    return m;
  }, [view, planets, overrides, rank]);

  if (view === "2d" || edit || planets.length < 2) return null;
  const refId = referencePlanet(planets.map((p) => p.id), selected, rank);
  const ref = planets.find((p) => p.id === refId);
  if (!ref) return null;
  const rows = distancesFrom(ref.id, points);
  const top = selected ? TOP_LANDED : TOP;
  const shown = rows.slice(0, top);
  const rest = rows.slice(top);

  const row = (id: string, label: string) => {
    const p = planets.find((x) => x.id === id);
    if (!p) return null;
    return (
      <li key={id}>
        <button type="button" className="dist__row" title="이 행성으로 이동" aria-label={id === ref.id ? `${p.name}, 기준 행성. 눌러서 이동` : `${p.name}(으)로 이동, ${label}`} onClick={() => void store.getState().flyToPlanet(id, "openPanel")}>
          <i className="dist__dot" style={{ background: planetLook(p).accent }} />
          <span className="dist__name">{p.name}</span>
          <span className="dist__d">{label}</span>
        </button>
      </li>
    );
  };

  return (
    <section className="dist" aria-label="행성 간 거리">
      <span className="dist__title">‘{ref.name}’에서의 거리</span>
      <ul className="dist__list">
        {row(ref.id, "기준")}
        {shown.map((r) => row(r.id, formatDistance(r.d)))}
      </ul>
      {rest.length > 0 && (
        <>
          <button type="button" className="dist__more" aria-expanded={more} onClick={() => setMore((v) => !v)}>
            <span>그 외 행성 {rest.length}</span>
            {more ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
          </button>
          {more && <ul className="dist__list dist__list--rest">{rest.map((r) => row(r.id, formatDistance(r.d)))}</ul>}
        </>
      )}
    </section>
  );
}
