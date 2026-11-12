// 웹 개발용 목업 (`npm run dev:mock`). 개발 B의 mocks/api JSON을 그대로 돌려준다.
// 목업의 가상 "오늘"은 2026-11-11 이라 기간과 상관없이 같은 우주를 돌려준다 (mocks/api/README.md).
// `#/?token=dev&mock=empty` 로 열면 기록 0건 우주, `&stars=2000` 이면 별 2,000개 우주 (성능 측정).
import { ERROR_MESSAGES } from "@spacelog/shared/errors";
import type { ExportRequest, Planet, Star, UniverseResponse } from "@spacelog/shared/types";
import { buildExport } from "../../../apps/server/export/buildExport.ts";
import universe from "../../../mocks/api/universe.json";
import universeEmpty from "../../../mocks/api/universe.empty.json";
import rediscoveryToday from "../../../mocks/api/rediscovery/today.json";
import { localDate } from "@spacelog/shared/period";
import { registerCsvTables } from "../demo/csvSource.ts";
import { buildSeed, universeIn, type SeedPlanet, type SeedRecord } from "../demo/seed.ts";
import seedPlanets from "../../../docs/design/2.5d/design_handoff_spacelog_2_5d/mock-data/planets.json";
import seedRecords from "../../../docs/design/2.5d/design_handoff_spacelog_2_5d/mock-data/records.json";
import { RequestError } from "./client.ts";

// JSON import 는 리터럴 타입이 넓혀져 있다. 형식은 mocks/api/mocks.test.ts 가 검사한다
const starFiles = Object.values(import.meta.glob("../../../mocks/api/stars/*.json", { eager: true, import: "default" })) as Star[];

const params = new URLSearchParams(location.hash.split("?")[1]);
const empty = params.get("mock") === "empty";
/** `#/?token=dev&mock=seed`: 디자이너의 예시 데이터(행성 6 · 기록 41, CSV 6개 포함)로 연다. 기간별로 거르고, 7일 전 기록으로 재발견 혜성이 뜬다 */
const seed = params.get("mock") === "seed" ? buildSeed(seedPlanets as unknown as SeedPlanet[], seedRecords as unknown as SeedRecord[]) : null;
if (seed) registerCsvTables(seed.tables);
let data = seed ? { stars: seed.stars, planets: seed.planets } : withStarCount((empty ? universeEmpty : universe) as unknown as UniverseResponse, Number(params.get("stars")) || 0);

/** 성능 측정용: `&stars=2000` 이면 별 N개를 만들어 행성에 나눠 준다 */
function withStarCount(u: UniverseResponse, n: number): UniverseResponse {
  if (n <= 0 || u.stars.length === 0) return u;
  const planets = u.planets.filter((p) => !p.system);
  const stars = Array.from({ length: n }, (_, i) => ({
    ...u.stars[i % u.stars.length],
    id: `perf-${String(i).padStart(5, "0")}`,
    planetId: planets[i % planets.length].id,
  }));
  return {
    stars,
    planets: u.planets.map((p) => ({ ...p, starCountInPeriod: stars.filter((s) => s.planetId === p.id).length })),
  };
}

/** 목업에서 받은 재발견 이벤트 (개발 중 확인용) */
export const mockRediscoveryEvents: unknown[] = [];

/** 목업의 가상 "오늘" (mocks/api/README.md) */
const MOCK_NOW = new Date("2026-11-11T12:00:00+09:00");

/** 목업의 쓰기: 메모리에서만 바뀐다(새로고침하면 처음으로). 서버가 아직 안 만든 수정 API의 화면 확인용 */
function recount() {
  data.planets = data.planets.map((p) => {
    const n = data.stars.filter((s) => s.planetId === p.id).length;
    return { ...p, starCountInPeriod: n, starCountTotal: n };
  });
}
let planetSeq = 0;
function mockWrite(method: string, pathname: string, body: unknown): unknown | undefined {
  const b = (body ?? {}) as Record<string, string | null | undefined>;
  const star = pathname.match(/^\/api\/stars\/([^/]+)$/);
  if (star) {
    const id = decodeURIComponent(star[1]);
    const cur = data.stars.find((s) => s.id === id);
    if (!cur) return undefined;
    if (method === "PATCH") {
      const next = { ...cur, ...(b.memo !== undefined ? { memo: b.memo || null } : {}), ...(b.planetId ? { planetId: b.planetId } : {}), updatedAtUtc: new Date().toISOString() };
      data.stars = data.stars.map((s) => (s.id === id ? next : s));
      recount();
      return next;
    }
    if (method === "DELETE") {
      data.stars = data.stars.filter((s) => s.id !== id);
      recount();
      return null;
    }
  }
  if (method === "POST" && /^\/api\/stars\/[^/]+\/open$/.test(pathname)) return null;
  if (method === "POST" && pathname === "/api/planets") {
    const p: Planet = { id: `mock-planet-${++planetSeq}`, name: String(b.name ?? "").trim(), system: null, defaultFor: null, colorToken: `planet-${(data.planets.length % 8) + 1}`, createdAtUtc: new Date().toISOString(), starCountInPeriod: 0, starCountTotal: 0 };
    data.planets = [...data.planets, p];
    return p;
  }
  const planet = pathname.match(/^\/api\/planets\/([^/]+)(\/merge)?$/);
  if (planet) {
    const id = decodeURIComponent(planet[1]);
    if (!data.planets.some((p) => p.id === id)) return undefined;
    if (method === "PATCH") {
      data.planets = data.planets.map((p) => (p.id === id ? { ...p, name: String(b.name ?? p.name).trim() } : p));
      return data.planets.find((p) => p.id === id);
    }
    if (method === "DELETE") {
      data.planets = data.planets.filter((p) => p.id !== id);
      return null;
    }
    if (method === "POST" && planet[2] && b.targetId) {
      data.stars = data.stars.map((s) => (s.planetId === id ? { ...s, planetId: String(b.targetId) } : s));
      data.planets = data.planets.filter((p) => p.id !== id);
      recount();
      return null;
    }
  }
  return undefined;
}

export async function mockApi(method: string, path: string, body?: unknown): Promise<unknown> {
  await new Promise((r) => setTimeout(r, 150));
  const url = new URL(path, "http://mock");
  if (method !== "GET") {
    const done = mockWrite(method, url.pathname, body);
    if (done !== undefined) return done;
  }
  if (method === "GET" && url.pathname === "/api/health") return { ok: true };
  if (method === "GET" && url.pathname === "/api/universe") {
    if (!seed) return data;
    return universeIn({ stars: data.stars, planets: data.planets }, url.searchParams.get("from") ?? "0000-01-01", url.searchParams.get("to") ?? "9999-12-31", (iso) => localDate(iso));
  }
  const m = url.pathname.match(/^\/api\/stars\/([^/]+)$/);
  if (method === "GET" && m) {
    const id = decodeURIComponent(m[1]);
    const star = [...data.stars, ...starFiles].find((s) => s.id === id);
    if (star) return star;
  }
  if (method === "POST" && url.pathname === "/api/export") {
    // 서버와 같은 생성 로직 (apps/server/export). 목업에는 원본 파일이 없어 .md 본문은 비어 있다
    const { items, format } = body as ExportRequest;
    return buildExport(items, format, { stars: data.stars, planets: data.planets, now: MOCK_NOW });
  }
  if (method === "POST" && url.pathname === "/api/rediscovery/events") {
    mockRediscoveryEvents.push(body);
    console.info("[mock] 재발견 이벤트", body);
    return null;
  }
  if (method === "GET" && url.pathname === "/api/rediscovery/today") {
    if (seed) {
      const star = data.stars.find((s) => s.id === seed.rediscoveryId);
      return star ? { star, daysAgo: 7 } : null;
    }
    return empty ? null : rediscoveryToday;
  }
  throw new RequestError("NOT_FOUND", `${ERROR_MESSAGES.NOT_FOUND} (목업에 없는 API: ${method} ${url.pathname})`, 404);
}
