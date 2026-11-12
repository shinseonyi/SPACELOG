import assert from "node:assert/strict";
import test from "node:test";
import { analyzeColumns, CSV_MAX_COLS, CSV_MAX_ROWS, parseCsv } from "./csv.ts";
import { createDemoStore } from "./demoStore.ts";
import { addLinkStars, autoLinkName, createLink, editLink, linksOfPlanet, planetsOfLink, removeStarsFromLinks, setLinkStars, unlink } from "./links.ts";
import { forgetPlanet, freeSpot, PLANET_GAP, purgePlanet, restorePlanet, setPlanetOverride, trashedIds, trashPlanet } from "./planets.ts";
import { DEMO_KEY, loadDemo, saveDemo, type KeyValue } from "./storage.ts";
import { emptyDemoData, type Link } from "./types.ts";

const memory = (): KeyValue & { map: Map<string, string> } => {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
};
const link = (id: string, starIds: string[]): Link => ({ id, name: id, memo: "", starIds, viz: { mode: "texts", chart: "bar" }, createdAtUtc: "2026-11-12T00:00:00Z" });

// ── CSV ──
test("CSV: 따옴표 안의 쉼표·줄바꿈·큰따옴표, BOM, \\r\\n", () => {
  const t = parseCsv('﻿name,note\r\n"김, 철수","한 줄\n두 줄"\r\n"He said ""hi""",x\r\n')!;
  assert.deepEqual(t.cols, ["name", "note"]);
  assert.deepEqual(t.rows, [["김, 철수", "한 줄\n두 줄"], ['He said "hi"', "x"]]);
});

test("CSV: 머리글만 있거나 비었으면 null, 빈 머리글은 '열 N'", () => {
  assert.equal(parseCsv("a,b\n"), null);
  assert.equal(parseCsv(""), null);
  assert.deepEqual(parseCsv(",b\n1,2")!.cols, ["열 1", "b"]);
});

test("CSV: 12열 · 300행에서 자르고 알려 준다", () => {
  const head = Array.from({ length: 15 }, (_, i) => `c${i}`).join(",");
  const rows = Array.from({ length: 305 }, (_, i) => `${i},${"x,".repeat(14)}x`).join("\n");
  const t = parseCsv(`${head}\n${rows}`)!;
  assert.equal(t.cols.length, CSV_MAX_COLS);
  assert.equal(t.rows.length, CSV_MAX_ROWS);
  assert.ok(t.truncated);
  assert.equal(parseCsv("a,b\n1,2")!.truncated, false);
});

test("CSV: 숫자 열 · 값 가짓수 · 1씩 이어지는 번호 열", () => {
  const t = parseCsv("id,type,minutes\n1,run,30\n2,swim,45\n3,run,1,200\n4,run,")!;
  const [id, type, minutes] = analyzeColumns(t);
  assert.deepEqual([id.numeric, id.sequential], [true, true]);
  assert.deepEqual([type.numeric, type.distinct], [false, 2]);
  assert.deepEqual([minutes.numeric, minutes.sequential], [true, false]);
});

// ── 별자리 ──
test("별자리: 만들기는 기록 중복을 없애고, 기록이 없으면 만들지 않으며, 이름을 비우면 자동", () => {
  const made = createLink([], { id: "a", name: " ", starIds: ["s1", "s1", "s2"] });
  assert.deepEqual(made[0].starIds, ["s1", "s2"]);
  assert.equal(made[0].name, "별자리 1");
  assert.equal(createLink(made, { id: "b", name: "x", starIds: [] }), made);
  assert.equal(autoLinkName([link("별자리 1", ["s"])]), "별자리 2");
});

test("별자리: 이름·목적 수정, 기록 넣고 빼기, 비면 사라짐", () => {
  const ls = [link("a", ["s1", "s2"])];
  assert.equal(editLink(ls, "a", { name: "  ", memo: " 목적 " })[0].name, "a");
  assert.equal(editLink(ls, "a", { memo: " 목적 " })[0].memo, "목적");
  assert.deepEqual(addLinkStars(ls, "a", ["s2", "s3"])[0].starIds, ["s1", "s2", "s3"]);
  assert.deepEqual(setLinkStars(ls, "a", ["s9"])[0].starIds, ["s9"]);
  assert.deepEqual(setLinkStars(ls, "a", []), []);
  assert.deepEqual(unlink(ls, "a"), []);
});

test("별자리: 기록이 지워지면 빠지고, 비게 되면 별자리도 없어진다", () => {
  const ls = [link("a", ["s1", "s2"]), link("b", ["s3"])];
  const out = removeStarsFromLinks(ls, ["s2", "s3"]);
  assert.deepEqual(out.map((l) => [l.id, l.starIds]), [["a", ["s1"]]]);
  assert.equal(removeStarsFromLinks(ls, ["zzz"])[0], ls[0]); // 바뀐 게 없으면 같은 객체
});

test("별자리: 행성별 찾기와 걸친 행성", () => {
  const stars = [{ id: "s1", planetId: "p1" }, { id: "s2", planetId: "p2" }, { id: "s3", planetId: "p1" }];
  const ls = [link("a", ["s1", "s3", "s2"]), link("b", ["s2"])];
  assert.deepEqual(linksOfPlanet(ls, stars, "p1").map((l) => l.id), ["a"]);
  assert.deepEqual(planetsOfLink(ls[0], stars), ["p1", "p2"]);
  assert.deepEqual(planetsOfLink(link("c", ["없음"]), stars), []);
});

// ── 행성 ──
test("행성 위치: 비어 있으면 그대로, 가까우면 가장 가까운 빈자리, 자기 자신은 비교에서 뺀다", () => {
  const others = [{ id: "a", x: 0, y: 0 }];
  assert.deepEqual(freeSpot(others, 500, 0), { x: 500, y: 0 });
  const moved = freeSpot(others, 10, 0);
  assert.ok(Math.hypot(moved.x, moved.y) >= PLANET_GAP);
  assert.ok(Math.hypot(moved.x - 10, moved.y) < PLANET_GAP + 41); // 가까운 곳
  assert.deepEqual(freeSpot(others, 10, 0, "a"), { x: 10, y: 0 });
});

test("행성 덧씌우기와 블랙홀: 보관 → 꺼내기, 완전 삭제", () => {
  let d = setPlanetOverride(emptyDemoData(), "p1", { colorToken: "planet-3", x: 5 }, new Date("2026-11-12T00:00:00Z"));
  d = setPlanetOverride(d, "p1", { shape: "ring" });
  assert.deepEqual([d.planets.p1.colorToken, d.planets.p1.shape, d.planets.p1.x], ["planet-3", "ring", 5]);
  d = trashPlanet(d, { planetId: "p1", name: "제품 기획", colorToken: "planet-3", starIds: ["s1"] });
  assert.equal(trashPlanet(d, { planetId: "p1", name: "x", colorToken: "planet-1", starIds: [] }), d); // 두 번 넣지 않는다
  assert.ok(trashedIds(d).has("p1"));
  const back = restorePlanet(d, "p1");
  assert.equal(back.item?.name, "제품 기획");
  assert.equal(back.data.trash.length, 0);
  assert.equal(restorePlanet(d, "없음").item, null);
  assert.deepEqual(purgePlanet(d, "p1").planets, {});
  assert.deepEqual(forgetPlanet(d, "p1").planets, {});
});

// ── 저장 ──
test("저장: 쓰고 읽으면 같고, 깨진 값은 읽을 수 있는 만큼만 살린다", () => {
  const kv = memory();
  const data = { ...emptyDemoData(), links: [link("a", ["s1"])], hiddenLinkIds: ["a"], planets: { p1: { x: 1 } } };
  saveDemo(data, kv);
  assert.deepEqual(loadDemo(kv), data);

  kv.map.set(DEMO_KEY, "{깨진 json");
  assert.deepEqual(loadDemo(kv), emptyDemoData());
  kv.map.set(DEMO_KEY, JSON.stringify({ links: [{ id: "x", name: "n", starIds: [] }, { id: "y", name: "n", starIds: ["s"] }, 7], hiddenLinkIds: ["a", 3], planets: { p: "bad", q: {} }, trash: [{ planetId: 1 }] }));
  const got = loadDemo(kv);
  assert.deepEqual(got.links.map((l) => l.id), ["y"]); // 빈 별자리·엉뚱한 값은 버린다
  assert.deepEqual(got.hiddenLinkIds, ["a"]);
  assert.deepEqual(Object.keys(got.planets), ["q"]);
  assert.deepEqual(got.trash, []);
  assert.deepEqual(loadDemo(null), emptyDemoData());
});

test("저장소를 못 쓰는 환경에서도 던지지 않는다", () => {
  const broken: KeyValue = { getItem: () => { throw new Error("막힘"); }, setItem: () => { throw new Error("막힘"); } };
  assert.deepEqual(loadDemo(broken), emptyDemoData());
  assert.doesNotThrow(() => saveDemo(emptyDemoData(), broken));
});

// ── 상태 저장소 ──
test("상태 저장소: 바꿀 때마다 저장하고, 새로 열면 이어 쓴다", () => {
  const kv = memory();
  const a = createDemoStore(kv);
  const id = a.getState().addLink({ name: "운동", starIds: ["s1", "s2"], memo: "목적" });
  assert.ok(id);
  assert.equal(a.getState().addLink({ name: "빈 것", starIds: [] }), null);
  a.getState().toggleLinkShown(id!);
  a.getState().setPlanet("p1", { shape: "nebula" });
  a.getState().sendToBlackHole({ planetId: "p2", name: "읽은 것들", colorToken: "planet-2", starIds: [] });

  const b = createDemoStore(kv); // 새로고침한 것처럼
  assert.deepEqual(b.getState().links.map((l) => l.name), ["운동"]);
  assert.deepEqual(b.getState().hiddenLinkIds, [id]);
  assert.equal(b.getState().planets.p1.shape, "nebula");
  assert.equal(b.getState().restoreFromBlackHole("p2")?.name, "읽은 것들");

  b.getState().starsGone(["s1", "s2"]); // 기록이 모두 지워지면 별자리도, 숨김 표시도 정리된다
  assert.deepEqual([b.getState().links.length, b.getState().hiddenLinkIds.length], [0, 0]);
});
