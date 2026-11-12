// 행성 간 거리 카드의 계산. 거리는 m 가 아니라 "가장 최근에 기록을 넣은 시각"으로 보여 준다 —
// 2.5D 보기가 최근에 기록을 넣은 행성을 앞에 두므로(README 6-1) 그 순서가 곧 화면 속 거리다. 화면과 분리해 테스트한다.

export interface DistanceRow {
  id: string;
  /** 그 행성에 가장 최근에 기록을 넣은 시각(UTC ISO). 기록이 없으면 null */
  last: string | null;
}

/** 모든 행성을 최근에 기록을 넣은 순서로. 기록이 없는 행성은 맨 뒤, 그 안에서는 id 순 (view/look.ts recencyRank 와 같은 순서) */
export function recencyRows(planetIds: string[], stars: { planetId: string; createdAtUtc: string }[]): DistanceRow[] {
  const last = new Map<string, string>();
  for (const s of stars) if ((last.get(s.planetId) ?? "") < s.createdAtUtc) last.set(s.planetId, s.createdAtUtc);
  return planetIds
    .map((id) => ({ id, last: last.get(id) ?? null }))
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? "") || a.id.localeCompare(b.id));
}

/** "11.12 14:30" (월.일 시:분, 현지 시각 24시간제) */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export type Point3 = readonly [number, number, number];

/** 기준 행성에서 각 행성까지의 거리(반올림). 기준 행성은 0. 좌표는 각 보기가 행성을 놓는 자리 그대로 */
export function distancesFrom(refId: string, points: Map<string, Point3>): Map<string, number> {
  const out = new Map<string, number>();
  const ref = points.get(refId);
  if (!ref) return out;
  for (const [id, p] of points) out.set(id, Math.round(Math.hypot(p[0] - ref[0], p[1] - ref[1], p[2] - ref[2])));
  return out;
}

/** "1,234m" */
export const formatDistance = (d: number) => `${d.toLocaleString("ko-KR")}m`;
