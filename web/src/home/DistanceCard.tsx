import { useMemo } from "react";
import { store, useStore } from "../state/store.ts";
import { planetLook } from "../view/look.ts";
import { formatStamp, recencyRows } from "./distance.ts";

/**
 * 행성 간 거리 카드 (2.5D · 3D 보기, 왼쪽 아래 묶음의 맨 아래).
 * 거리는 m 대신 "가장 최근에 기록을 넣은 시각"(11.12 14:30)으로 보여 준다. 2.5D 는 최근에 기록을 넣은 행성을 앞에 두므로 이 순서가 곧 화면 속 가까운 순서다.
 * 접지 않고 모든 행성을 보여 준다(길면 카드 안에서 스크롤). 줄을 누르면 그 행성으로 날아가 착륙한다. 기간 안의 기록 기준(우주 화면과 같음).
 */
export function DistanceCard() {
  const view = useStore((s) => s.view);
  const planets = useStore((s) => s.planets);
  const stars = useStore((s) => s.stars);
  const selected = useStore((s) => s.selectedPlanetId);
  const edit = useStore((s) => s.editPos);
  const rows = useMemo(() => recencyRows(planets.map((p) => p.id), stars), [planets, stars]);

  if (view === "2d" || edit || planets.length < 2) return null;

  return (
    <section className="dist" aria-label="행성 간 거리">
      <span className="dist__title">행성 간 거리 · 최근 기록 순</span>
      <ul className="dist__list">
        {rows.map((r) => {
          const p = planets.find((x) => x.id === r.id);
          if (!p) return null;
          const when = r.last ? formatStamp(r.last) : "기록 없음";
          return (
            <li key={r.id}>
              <button type="button" className={`dist__row${r.id === selected ? " is-on" : ""}`} aria-current={r.id === selected || undefined} title="이 행성으로 이동" aria-label={`${p.name}(으)로 이동, 최근 기록 ${when}`} onClick={() => void store.getState().flyToPlanet(r.id, "openPanel")}>
                <i className="dist__dot" style={{ background: planetLook(p).accent }} />
                <span className="dist__name">{p.name}</span>
                <span className={`dist__d${r.last ? "" : " is-empty"}`}>{when}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
