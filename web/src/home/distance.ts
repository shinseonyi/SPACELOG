// 행성 간 거리 카드의 계산 (design handoff 2.5d README 6-1 "행성 간 거리 카드"). 화면과 분리해 테스트한다.
export type Point3 = readonly [number, number, number];

export interface DistanceRow {
  id: string;
  /** 기준 행성에서의 거리(소수 반올림). 기준 행성 자신은 0 */
  d: number;
}

/** 기준 행성: 착륙해 있는 행성, 없으면 가장 최근에 기록을 넣은 행성(순위 0) */
export function referencePlanet(ids: string[], selectedId: string | null, rank: Map<string, number>): string | null {
  if (selectedId && ids.includes(selectedId)) return selectedId;
  return [...ids].sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity))[0] ?? null;
}

/** 기준 행성에서 가까운 순서. 기준 행성은 빼고, 같은 거리면 id 순 */
export function distancesFrom(refId: string, points: Map<string, Point3>): DistanceRow[] {
  const ref = points.get(refId);
  if (!ref) return [];
  const rows: DistanceRow[] = [];
  for (const [id, p] of points) {
    if (id === refId) continue;
    rows.push({ id, d: Math.round(Math.hypot(p[0] - ref[0], p[1] - ref[1], p[2] - ref[2])) });
  }
  return rows.sort((a, b) => a.d - b.d || a.id.localeCompare(b.id));
}

/** "1,234m" */
export const formatDistance = (d: number) => `${d.toLocaleString("ko-KR")}m`;
