// 별자리 계산. 상태를 바꾸지 않고 새 목록을 돌려주는 순수 함수라 테스트하기 쉽다 (시안의 reduce: link · linkAdd · linkEdit · linkSet · unlink · deleteStar).
import { DEFAULT_VIZ, type Link, type LinkViz } from "./types.ts";

export const LINK_NAME_MAX = 24;

const uniq = (ids: string[]) => [...new Set(ids)];

export interface NewLink {
  id: string;
  name: string;
  memo?: string;
  starIds: string[];
  viz?: LinkViz;
  now?: Date;
}

/** 이름을 비우면 "별자리 N" 으로 붙인다 (시안: "비우면 자동으로 붙여요") */
export function autoLinkName(links: Link[]): string {
  let n = links.length + 1;
  while (links.some((l) => l.name === `별자리 ${n}`)) n++;
  return `별자리 ${n}`;
}

/** 새 별자리. 기록이 하나도 없으면 만들지 않는다 (빈 별자리는 없다) */
export function createLink(links: Link[], input: NewLink): Link[] {
  const starIds = uniq(input.starIds);
  if (starIds.length === 0) return links;
  const name = input.name.trim().slice(0, LINK_NAME_MAX) || autoLinkName(links);
  const link: Link = { id: input.id, name, memo: (input.memo ?? "").trim(), starIds, viz: input.viz ?? { ...DEFAULT_VIZ }, createdAtUtc: (input.now ?? new Date()).toISOString() };
  return [...links, link];
}

/** 이름·관측 목적 고치기. 이름을 비우면 이전 이름을 지킨다 */
export function editLink(links: Link[], id: string, patch: { name?: string; memo?: string }): Link[] {
  return links.map((l) =>
    l.id !== id ? l : { ...l, name: patch.name?.trim() ? patch.name.trim().slice(0, LINK_NAME_MAX) : l.name, memo: patch.memo !== undefined ? patch.memo.trim() : l.memo },
  );
}

/** 별자리의 기록을 통째로 바꾼다 (수정 모드의 저장). 결과가 비면 별자리를 풀어 버린다 */
export function setLinkStars(links: Link[], id: string, starIds: string[]): Link[] {
  const next = uniq(starIds);
  return links.flatMap((l) => (l.id !== id ? [l] : next.length === 0 ? [] : [{ ...l, starIds: next }]));
}

export function addLinkStars(links: Link[], id: string, starIds: string[]): Link[] {
  return links.map((l) => (l.id === id ? { ...l, starIds: uniq([...l.starIds, ...starIds]) } : l));
}

export function setLinkViz(links: Link[], id: string, viz: LinkViz): Link[] {
  return links.map((l) => (l.id === id ? { ...l, viz } : l));
}

export function unlink(links: Link[], id: string): Link[] {
  return links.filter((l) => l.id !== id);
}

/** 지워진 기록을 별자리에서 빼고, 비게 된 별자리는 없앤다 (README 7장) */
export function removeStarsFromLinks(links: Link[], goneIds: string[]): Link[] {
  const gone = new Set(goneIds);
  return links.flatMap((l) => {
    const starIds = l.starIds.filter((id) => !gone.has(id));
    return starIds.length === 0 ? [] : starIds.length === l.starIds.length ? [l] : [{ ...l, starIds }];
  });
}

/** 이 행성에 든 기록이 있는 별자리 (행성 패널의 "별자리" 구역) */
export function linksOfPlanet(links: Link[], stars: { id: string; planetId: string }[], planetId: string): Link[] {
  const own = new Set(stars.filter((s) => s.planetId === planetId).map((s) => s.id));
  return links.filter((l) => l.starIds.some((id) => own.has(id)));
}

/** 별자리가 걸친 행성들 (우주의 별자리 선을 그릴 행성 id, 처음 나온 순서) */
export function planetsOfLink(link: Link, stars: { id: string; planetId: string }[]): string[] {
  const byId = new Map(stars.map((s) => [s.id, s.planetId]));
  return uniq(link.starIds.flatMap((id) => (byId.has(id) ? [byId.get(id) as string] : [])));
}
