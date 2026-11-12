// 예시 데이터(docs/design/2.5d/.../mock-data)를 앱이 쓰는 모양(Planet · Star)으로 바꾼다. 순수 함수라 테스트할 수 있다.
// 날짜는 `daysAgo`(오늘부터 며칠 전) + `time` 상대값이라 오늘 기준으로 계산한다 (mock-data/README.md).
// 시연용(README 4-1): 서버·mocks/api 는 건드리지 않고, `npm run dev:mock` 에서 `&mock=seed` 로 열 때만 쓴다.
import type { Planet, Star } from "@spacelog/shared/types";
import type { CsvTable } from "./csv.ts";
import { PLANET_COLORS } from "./types.ts";

export interface SeedPlanet {
  id: string;
  name: string;
  color: string;
  shape?: string;
  x?: number;
  y?: number;
}

export interface SeedRecord {
  id: string;
  planetId: string;
  kind: "text" | "link" | "file" | "csv" | "image";
  title: string;
  source: string;
  memo: string;
  daysAgo: number;
  time: string;
  body?: string;
  table?: { columns: string[]; rows: string[][] };
}

export interface Seed {
  planets: Planet[];
  stars: Star[];
  /** CSV 기록 id → 열·행 */
  tables: Record<string, CsvTable>;
  /** 정확히 7일 전 기록의 id (재발견 혜성 카드용) */
  rediscoveryId: string | null;
}

/** 오늘 기준 `daysAgo` 일 전 `time`(현지 시각)의 UTC 시각 */
export function seedTime(now: Date, daysAgo: number, time: string): string {
  const at = new Date(now);
  at.setDate(at.getDate() - daysAgo);
  const [h, m] = time.split(":").map(Number);
  at.setHours(h || 0, m || 0, 0, 0);
  return at.toISOString();
}

const colorToken = (label: string, i: number) => PLANET_COLORS.find((c) => c.label === label)?.token ?? `planet-${(i % 8) + 1}`;

const SIZE: Record<string, string> = { PDF: "application/pdf", PNG: "image/png", JPG: "image/jpeg", CSV: "text/csv", TXT: "text/plain" };

export function buildSeed(planets: SeedPlanet[], records: SeedRecord[], now: Date = new Date()): Seed {
  const alive = records.filter((r) => r.kind !== "image"); // 이미지 예시는 실제 이미지가 없어 쓰지 않는다
  const tables: Record<string, CsvTable> = {};
  const stars: Star[] = alive.map((r) => {
    const createdAtUtc = seedTime(now, r.daysAgo, r.time);
    const isCsv = r.kind === "csv";
    if (isCsv && r.table) tables[r.id] = { cols: r.table.columns, rows: r.table.rows, truncated: false };
    const ext = r.title.split(".").pop()?.toUpperCase() ?? "";
    return {
      id: r.id,
      kind: r.kind === "csv" ? "file" : r.kind,
      planetId: r.planetId,
      createdAtUtc,
      tzOffsetMin: -now.getTimezoneOffset(),
      updatedAtUtc: createdAtUtc,
      storagePath: r.kind === "file" || isCsv ? `originals/seed/${r.id}` : null,
      originalName: r.kind === "file" || isCsv ? r.title : null,
      mimeType: r.kind === "file" || isCsv ? (isCsv ? "text/csv" : (SIZE[ext] ?? null)) : null,
      sizeBytes: null,
      sha256: null,
      url: r.kind === "link" ? `https://${r.source}` : null,
      linkTitle: r.kind === "link" ? r.title : null,
      linkDomain: r.kind === "link" ? r.source : null,
      // 본문이 비어 있는 예시 텍스트는 제목을 본문으로 쓴다 (텍스트 기록의 제목은 본문에서 따오므로 "이름 없는 기록"이 되지 않게)
      textBody: r.kind === "text" ? r.body || r.title || null : null,
      thumbnailPath: null,
      thumbnailStatus: "fallback",
      linkFetchStatus: r.kind === "link" ? "done" : "none",
      memo: r.memo || null,
    };
  });
  const ps: Planet[] = planets.map((p, i) => ({
    id: p.id,
    name: p.name,
    system: null,
    defaultFor: null,
    colorToken: colorToken(p.color, i),
    createdAtUtc: seedTime(now, 30 - i, "09:00"),
    starCountTotal: stars.filter((s) => s.planetId === p.id).length,
  }));
  const seven = alive.find((r) => r.daysAgo === 7);
  return { planets: ps, stars, tables, rediscoveryId: seven?.id ?? null };
}

/** 기간(현지 날짜 from~to, 포함) 안의 우주. 행성에는 기간 내·전체 기록 수를 계산해 붙인다 */
export function universeIn(seed: Pick<Seed, "planets" | "stars">, from: string, to: string, localDate: (iso: string) => string) {
  const inRange = seed.stars.filter((s) => {
    const d = localDate(s.createdAtUtc);
    return d >= from && d <= to;
  });
  return {
    stars: inRange,
    planets: seed.planets.map((p) => ({
      ...p,
      starCountInPeriod: inRange.filter((s) => s.planetId === p.id).length,
      starCountTotal: seed.stars.filter((s) => s.planetId === p.id).length,
    })),
  };
}
