// 우주 위 별자리 선 (README 6-1): 두 행성 이상에 걸친 별자리를 행성 사이 흰 실선(투명도 0.4)과 이름표로 그린다.
// 어느 행성을 이을지는 별자리에 든 기록이 놓인 행성들이다. 한 행성에만 있는 별자리는 선 없이 그 행성 위에 이름표만 띄운다.
import { useMemo } from "react";
import type { Star } from "@spacelog/shared/types";
import { useDemo } from "../demo/demoStore.ts";
import { planetsOfLink } from "../demo/links.ts";
import type { Link } from "../demo/types.ts";
import { useAllRecords } from "../observatory/useAllRecords.ts";
import { useStore } from "../state/store.ts";

export interface LinkPath {
  id: string;
  name: string;
  /** 이을 행성들. 별자리의 기록이 처음 나온 순서대로 이웃끼리 잇는다 */
  planetIds: string[];
}

/** 우주에 보일 별자리들. 숨긴 별자리와, 우주에 있는 행성에 기록이 하나도 없는 별자리는 뺀다 */
export function linkPaths(links: Link[], stars: Pick<Star, "id" | "planetId">[], hiddenIds: string[], knownPlanetIds?: Set<string>): LinkPath[] {
  const hidden = new Set(hiddenIds);
  return links
    .filter((l) => !hidden.has(l.id))
    .map((l) => ({ id: l.id, name: l.name, planetIds: planetsOfLink(l, stars).filter((p) => !knownPlanetIds || knownPlanetIds.has(p)) }))
    .filter((p) => p.planetIds.length >= 1);
}

export interface Segment {
  linkId: string;
  a: string;
  b: string;
}

/** 이웃한 행성끼리 잇는 선분들. 한 행성 안의 별자리는 선분이 없다 */
export function segmentsOf(paths: LinkPath[]): Segment[] {
  return paths.flatMap((p) => p.planetIds.slice(0, -1).map((a, i) => ({ linkId: p.id, a, b: p.planetIds[i + 1] })));
}

export interface LinkMark {
  linkId: string;
  name: string;
  /** 이름표를 놓을 선분(첫 선분). 한 행성 안의 별자리는 a = b = 그 행성 */
  a: string;
  b: string;
  /** 한 행성 안의 별자리: 선 없이 그 행성 위에 이름표만 */
  solo: boolean;
  /** 같은 자리(같은 두 행성 사이 · 같은 행성 위)의 이름표가 겹치지 않게 쌓는 순번 (0부터) */
  stack: number;
}

/** 별자리마다 이름표 하나: 첫 선분 위, 한 행성 안의 별자리는 그 행성 위. 같은 자리의 이름표는 겹치지 않게 순번을 준다 */
export function marksOf(paths: LinkPath[]): LinkMark[] {
  const seen = new Map<string, number>();
  return paths.map((p) => {
    const solo = p.planetIds.length === 1;
    const a = p.planetIds[0];
    const b = solo ? a : p.planetIds[1];
    const key = solo ? `solo|${a}` : [a, b].sort().join("|");
    const stack = seen.get(key) ?? 0;
    seen.set(key, stack + 1);
    return { linkId: p.id, name: p.name, a, b, solo, stack };
  });
}

/** 지금 우주에 그릴 별자리들. 기간 밖 기록도 찾을 수 있게 최근 1년 전체에서 행성을 읽는다 */
export function useLinkPaths(): LinkPath[] {
  const links = useDemo((s) => s.links);
  const hidden = useDemo((s) => s.hiddenLinkIds);
  const current = useStore((s) => s.stars);
  const planets = useStore((s) => s.planets);
  const all = useAllRecords();
  return useMemo(() => {
    const byId = new Map<string, Pick<Star, "id" | "planetId">>((all?.stars ?? []).map((s) => [s.id, s]));
    for (const s of current) byId.set(s.id, s);
    return linkPaths(links, [...byId.values()], hidden, new Set(planets.map((p) => p.id)));
  }, [links, hidden, current, planets, all]);
}
