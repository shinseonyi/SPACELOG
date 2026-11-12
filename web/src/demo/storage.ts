// 시연용 데이터의 브라우저 저장. localStorage 를 못 쓰는 환경(시크릿 창 등)에서도 화면은 동작하고, 새로고침하면 처음으로 돌아간다.
import { emptyDemoData, type DemoData, type Link, type PlanetOverride, type TrashedPlanet } from "./types.ts";

export const DEMO_KEY = "spacelog.demo.v1";

/** localStorage 와 같은 모양이면 된다. 테스트에서 가짜를 넣는다 */
export type KeyValue = Pick<Storage, "getItem" | "setItem">;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function toLink(v: unknown): Link | null {
  if (!isObj(v) || typeof v.id !== "string" || typeof v.name !== "string") return null;
  const starIds = strings(v.starIds);
  if (starIds.length === 0) return null; // 빈 별자리는 없다
  const viz = isObj(v.viz) ? (v.viz as unknown as Link["viz"]) : { mode: "texts" as const, chart: "bar" as const };
  return { id: v.id, name: v.name, memo: typeof v.memo === "string" ? v.memo : "", starIds, viz, createdAtUtc: typeof v.createdAtUtc === "string" ? v.createdAtUtc : new Date(0).toISOString() };
}

function toTrash(v: unknown): TrashedPlanet | null {
  if (!isObj(v) || typeof v.planetId !== "string" || typeof v.name !== "string") return null;
  return { planetId: v.planetId, name: v.name, colorToken: typeof v.colorToken === "string" ? v.colorToken : "planet-1", starIds: strings(v.starIds), trashedAtUtc: typeof v.trashedAtUtc === "string" ? v.trashedAtUtc : new Date(0).toISOString() };
}

/** 저장된 값을 읽는다. 없거나 깨졌거나 모양이 다르면 읽을 수 있는 만큼만 살리고 나머지는 비운다 */
export function loadDemo(kv: KeyValue | null = browserStorage()): DemoData {
  try {
    const raw = kv?.getItem(DEMO_KEY);
    if (!raw) return emptyDemoData();
    const v: unknown = JSON.parse(raw);
    if (!isObj(v)) return emptyDemoData();
    const planets: Record<string, PlanetOverride> = {};
    if (isObj(v.planets)) for (const [id, o] of Object.entries(v.planets)) if (isObj(o)) planets[id] = o as PlanetOverride;
    return {
      links: (Array.isArray(v.links) ? v.links : []).map(toLink).filter((l): l is Link => l !== null),
      hiddenLinkIds: strings(v.hiddenLinkIds),
      planets,
      trash: (Array.isArray(v.trash) ? v.trash : []).map(toTrash).filter((t): t is TrashedPlanet => t !== null),
    };
  } catch {
    return emptyDemoData();
  }
}

export function saveDemo(data: DemoData, kv: KeyValue | null = browserStorage()): void {
  try {
    kv?.setItem(DEMO_KEY, JSON.stringify(data));
  } catch {
    // 저장 못 해도 이번 방문에서는 동작한다
  }
}

function browserStorage(): KeyValue | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
