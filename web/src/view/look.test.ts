import assert from "node:assert/strict";
import test from "node:test";
import type { Planet } from "@spacelog/shared/types";
import { boundsOf, landCam, overviewCam, planetLook, planetNodes, planetSizePx, recencyRank, rightOccupied } from "./look.ts";

const planet = (id: string, over: Partial<Planet> = {}): Planet => ({
  id, name: id, system: null, defaultFor: null, colorToken: "planet-1", createdAtUtc: "2026-11-01T00:00:00Z", starCountInPeriod: 1, ...over,
});

test("행성 크기: 0개 40px, 27개 이하 64 + √n×30, 넘으면 최댓값 기준 상대", () => {
  assert.equal(planetSizePx(0, 10), 40);
  assert.equal(planetSizePx(4, 4), 64 + 2 * 30);
  assert.equal(planetSizePx(100, 100), 220);
  assert.equal(planetSizePx(25, 100), 64 + 156 * 0.5);
});

test("미분류 시스템 행성만 성운(조각), 색은 순서대로 돌아간다", () => {
  assert.deepEqual([planetLook({ colorToken: "planet-1", system: "uncategorized" }).shape, planetLook({ colorToken: "planet-1", system: "uncategorized" }).unit], ["nebula", "조각"]);
  assert.equal(planetLook({ colorToken: "planet-9", system: null }).accent, "var(--planet-1)");
  assert.equal(planetLook({ colorToken: "planet-2", system: null }).filter, "hue-rotate(175deg) saturate(1.3)");
});

test("행성 배치는 가운데에 모여 있다 (조망에서 점처럼 작아지지 않는다)", () => {
  const ps = Array.from({ length: 7 }, (_, i) => planet(`p${i}`, { createdAtUtc: `2026-11-0${i + 1}T00:00:00Z` }));
  const nodes = planetNodes(ps);
  const box = boundsOf(nodes)!;
  assert.ok(box.x1 - box.x0 < 1100 && box.y1 - box.y0 < 800, `${box.x1 - box.x0} x ${box.y1 - box.y0}`);
  assert.ok(overviewCam(nodes, 1280, 800, 324).z >= 0.6); // 시안 화면(1280x800)에서 행성이 충분히 크게 보인다
});

test("같은 행성은 늘 같은 자리, 서로 320px 이상 떨어진다", () => {
  const ps = Array.from({ length: 8 }, (_, i) => planet(`p${i}`, { createdAtUtc: `2026-11-0${i + 1}T00:00:00Z` }));
  const a = planetNodes(ps);
  const b = planetNodes([...ps].reverse());
  for (const n of a) assert.deepEqual([n.x, n.y], [b.find((m) => m.id === n.id)!.x, b.find((m) => m.id === n.id)!.y]);
  for (const n of a) for (const m of a) if (n !== m) assert.ok(Math.hypot(n.x - m.x, n.y - m.y) >= 320);
});

test("최근에 기록을 넣은 행성이 앞, 기록 없는 행성은 맨 뒤", () => {
  const rank = recencyRank([{ id: "a" }, { id: "b" }, { id: "c" }], [
    { planetId: "a", createdAtUtc: "2026-11-01T00:00:00Z" },
    { planetId: "b", createdAtUtc: "2026-11-05T00:00:00Z" },
  ]);
  assert.deepEqual([rank.get("b"), rank.get("a"), rank.get("c")], [0, 1, 2]);
});

test("기록이 없는 행성은 모두 같은 순위로 맨 뒤 (2.5D 같은 깊이)", () => {
  const rank = recencyRank([{ id: "z" }, { id: "a" }, { id: "b" }, { id: "y" }], [{ planetId: "b", createdAtUtc: "2026-11-05T00:00:00Z" }]);
  assert.deepEqual([rank.get("b"), rank.get("a"), rank.get("y"), rank.get("z")], [0, 1, 1, 1]);
  const none = recencyRank([{ id: "a" }, { id: "b" }], []);
  assert.deepEqual([none.get("a"), none.get("b")], [0, 0]);
});

test("조망은 모든 행성이 들어오고, 오른쪽 창만큼 왼쪽으로 치운다", () => {
  const nodes = planetNodes([planet("a"), planet("b", { createdAtUtc: "2026-11-02T00:00:00Z" })]);
  const box = boundsOf(nodes)!;
  const cam = overviewCam(nodes, 1280, 800, 324);
  assert.ok((box.x1 - box.x0) * cam.z <= 1280 - 324);
  assert.ok(cam.x > (box.x0 + box.x1) / 2);
  assert.deepEqual(overviewCam([], 1280, 800, 0), { x: 0, y: 0, z: 1 });
  // 왼쪽 아래 묶음 자리만큼 오른쪽으로 비켜 놓는다 (카메라 x 가 줄어든다)
  assert.ok(overviewCam(nodes, 1280, 800, 324, 150).x < cam.x);
});

test("착륙: 넓은 화면 1.7배, 좁은 화면 1.2배. 오른쪽 가림은 좁은 화면에서 0", () => {
  assert.equal(landCam({ x: 0, y: 0 }, 1280, 456).z, 1.7);
  assert.equal(landCam({ x: 0, y: 0 }, 400, 0).z, 1.2);
  assert.deepEqual([rightOccupied(1280, true, true), rightOccupied(1280, false, true), rightOccupied(1280, false, false), rightOccupied(400, true, true)], [456, 324, 0, 0]);
});

test("사용자가 옮긴 위치와 고른 모양이 기본 배치·기본 모양보다 앞선다", () => {
  const ps = [planet("a"), planet("b", { system: "uncategorized", createdAtUtc: "2026-11-02T00:00:00Z" })];
  const base = planetNodes(ps);
  assert.deepEqual([base[1].look.shape, base[1].look.unit], ["nebula", "조각"]); // 미분류는 기본이 성운

  const moved = planetNodes(ps, { a: { x: 700, y: -300, shape: "ring" }, b: { shape: "" } });
  assert.deepEqual([moved[0].x, moved[0].y, moved[0].look.shape], [700, -300, "ring"]);
  assert.deepEqual([moved[1].x, moved[1].y], [base[1].x, base[1].y]); // 위치를 안 옮긴 행성은 기본 배치 그대로
  assert.deepEqual([moved[1].look.shape, moved[1].look.unit], ["", "기록"]); // 기본 모양을 직접 골랐으면 성운이 아니다
});

test("x 나 y 하나만 있으면 옮긴 것으로 치지 않는다", () => {
  const ps = [planet("a")];
  const base = planetNodes(ps);
  assert.deepEqual([planetNodes(ps, { a: { x: 5 } })[0].x, planetNodes(ps, { a: { y: 5 } })[0].y], [base[0].x, base[0].y]);
});
