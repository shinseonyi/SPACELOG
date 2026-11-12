import assert from "node:assert/strict";
import test from "node:test";
import { localDate } from "@spacelog/shared/period";
import { buildSeed, csvAddon, seedTime, universeIn, type SeedPlanet, type SeedRecord } from "./seed.ts";

const now = new Date(2026, 10, 12, 16, 0); // 2026-11-12 16:00 현지
const planets: SeedPlanet[] = [
  { id: "p1", name: "제품 기획", color: "파랑" },
  { id: "p6", name: "CSV 데이터", color: "하늘" },
];
const rec = (over: Partial<SeedRecord>): SeedRecord => ({ id: "x", planetId: "p1", kind: "text", title: "t", source: "", memo: "", daysAgo: 0, time: "10:30", ...over });
const records: SeedRecord[] = [
  rec({ id: "s1", kind: "text", daysAgo: 0, body: "본문" }),
  rec({ id: "s2", kind: "link", title: "노션", source: "notion.so", daysAgo: 7, time: "11:00" }),
  rec({ id: "i1", kind: "image", daysAgo: 1 }),
  rec({ id: "c1", planetId: "p6", kind: "csv", title: "workouts.csv", daysAgo: 0, table: { columns: ["id", "종목"], rows: [["1", "러닝"], ["2", "요가"]] } }),
];

test("날짜는 오늘 기준 daysAgo + 시각으로 바꾼다", () => {
  const t = new Date(seedTime(now, 7, "11:05"));
  assert.deepEqual([t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes()], [2026, 10, 5, 11, 5]);
});

test("이미지 예시는 빼고, CSV 는 파일 기록 + 표로 바꾼다", () => {
  const s = buildSeed(planets, records, now);
  assert.deepEqual(s.stars.map((x) => x.id), ["s1", "s2", "c1"]);
  const csv = s.stars.find((x) => x.id === "c1")!;
  assert.deepEqual([csv.kind, csv.originalName, csv.mimeType], ["file", "workouts.csv", "text/csv"]);
  assert.deepEqual(s.tables.c1, { cols: ["id", "종목"], rows: [["1", "러닝"], ["2", "요가"]], truncated: false });
  const link = s.stars.find((x) => x.id === "s2")!;
  assert.deepEqual([link.url, link.linkDomain, link.linkTitle], ["https://notion.so", "notion.so", "노션"]);
  assert.equal(s.stars.find((x) => x.id === "s1")!.textBody, "본문");
});

test("본문이 빈 예시 텍스트는 제목을 본문으로 쓴다", () => {
  const s = buildSeed(planets, [rec({ id: "t1", kind: "text", title: "탐사선 이름 아이디어", body: "" })], now);
  assert.equal(s.stars[0].textBody, "탐사선 이름 아이디어");
});

test("행성 색 이름은 토큰으로, 기록 수는 전체로 센다. 정확히 7일 전 기록을 찾는다", () => {
  const s = buildSeed(planets, records, now);
  assert.deepEqual(s.planets.map((p) => [p.colorToken, p.starCountTotal]), [["planet-1", 2], ["planet-7", 1]]);
  assert.equal(s.rediscoveryId, "s2");
  assert.equal(buildSeed(planets, [rec({ daysAgo: 3 })], now).rediscoveryId, null);
});

test("기간으로 거르면 기간 내 · 전체 개수가 따로 나온다", () => {
  const s = buildSeed(planets, records, now);
  const today = universeIn(s, "2026-11-12", "2026-11-12", (iso) => localDate(iso, now));
  assert.deepEqual(today.stars.map((x) => x.id), ["s1", "c1"]);
  assert.deepEqual(today.planets.map((p) => [p.starCountInPeriod, p.starCountTotal]), [[1, 2], [1, 1]]);
  const week = universeIn(s, "2026-11-05", "2026-11-12", (iso) => localDate(iso, now));
  assert.equal(week.stars.length, 3);
});

test("CSV 더하기: 팀원의 데이터는 그대로 두고 CSV 행성·기록·표만 덧붙인다", () => {
  const a = csvAddon(planets, records, now);
  assert.deepEqual(a.planets.map((p) => [p.id, p.name, p.starCountInPeriod, p.starCountTotal]), [["p6", "CSV 데이터", 1, 1]]);
  assert.deepEqual(a.stars.map((s) => [s.id, s.originalName, s.planetId]), [["c1", "workouts.csv", "p6"]]);
  assert.deepEqual(Object.keys(a.tables), ["c1"]);
  assert.equal(csvAddon(planets, [rec({ id: "t", kind: "text" })], now).stars.length, 0); // CSV 가 없으면 아무것도 더하지 않는다
});
