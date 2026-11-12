// 행성 모습·위치·블랙홀 계산 (시안의 reduce: editPlanet · movePlanet · destroyPlanet · restorePlanet · purgePlanet). 순수 함수.
import type { DemoData, PlanetOverride, TrashedPlanet } from "./types.ts";

/** 행성 둘의 중심이 이보다 가까우면 안 된다 (README 6-1) */
export const PLANET_GAP = 320;

export interface Placed {
  id: string;
  x: number;
  y: number;
}

/**
 * 놓고 싶은 자리가 비어 있으면 그대로, 아니면 가장 가까운 빈자리 (README 6-1 위치 편집).
 * 40px 간격의 동심원을 안쪽부터 돌며 24방향을 찾는다. selfId 는 옮기는 행성 자신(비교에서 뺀다).
 */
export function freeSpot(others: Placed[], x: number, y: number, selfId?: string): { x: number; y: number } {
  const ok = (px: number, py: number) => others.every((p) => p.id === selfId || Math.hypot(p.x - px, p.y - py) >= PLANET_GAP);
  if (ok(x, y)) return { x, y };
  for (let r = 40; r < 4000; r += 40) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const px = Math.round(x + Math.cos(a) * r);
      const py = Math.round(y + Math.sin(a) * r);
      if (ok(px, py)) return { x: px, y: py };
    }
  }
  return { x, y };
}

/** 행성의 모습·위치를 덧씌운다. 바꾼 시각을 같이 적는다 */
export function setPlanetOverride(data: DemoData, id: string, patch: PlanetOverride, now: Date = new Date()): DemoData {
  return { ...data, planets: { ...data.planets, [id]: { ...data.planets[id], ...patch, editedAtUtc: now.toISOString() } } };
}

/** 행성을 지울 때 덧씌운 값도 같이 버린다 */
export function forgetPlanet(data: DemoData, id: string): DemoData {
  const { [id]: _gone, ...rest } = data.planets;
  void _gone;
  return { ...data, planets: rest };
}

/** 블랙홀에 넣기. 서버에서 지우지 않고 웹이 숨긴다 (서버의 soft delete 가 생기기 전까지) */
export function trashPlanet(data: DemoData, item: Omit<TrashedPlanet, "trashedAtUtc">, now: Date = new Date()): DemoData {
  if (data.trash.some((t) => t.planetId === item.planetId)) return data;
  return { ...data, trash: [...data.trash, { ...item, trashedAtUtc: now.toISOString() }] };
}

/** 블랙홀에서 꺼내기. 별자리 연결은 되살리지 않는다 (시안과 같다) */
export function restorePlanet(data: DemoData, planetId: string): { data: DemoData; item: TrashedPlanet | null } {
  const item = data.trash.find((t) => t.planetId === planetId) ?? null;
  return { data: item ? { ...data, trash: data.trash.filter((t) => t.planetId !== planetId) } : data, item };
}

/** 블랙홀에서 완전히 삭제 (덧씌운 값도 같이 버린다) */
export function purgePlanet(data: DemoData, planetId: string): DemoData {
  return forgetPlanet({ ...data, trash: data.trash.filter((t) => t.planetId !== planetId) }, planetId);
}

/** 보관 중인 행성 id 모음. 우주·목록·개수에서 뺄 때 쓴다 */
export function trashedIds(data: DemoData): Set<string> {
  return new Set(data.trash.map((t) => t.planetId));
}
