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

test("조망은 모든 행성이 들어오고, 오른쪽 창만큼 왼쪽으로 치운다", () => {
  const nodes = planetNodes([planet("a"), planet("b", { createdAtUtc: "2026-11-02T00:00:00Z" })]);
  const box = boundsOf(nodes)!;
  const cam = overviewCam(nodes, 1280, 800, 324);
  assert.ok((box.x1 - box.x0) * cam.z <= 1280 - 324);
  assert.ok(cam.x > (box.x0 + box.x1) / 2);
  assert.deepEqual(overviewCam([], 1280, 800, 0), { x: 0, y: 0, z: 1 });
});

test("착륙: 넓은 화면 1.7배, 좁은 화면 1.2배. 오른쪽 가림은 좁은 화면에서 0", () => {
  assert.equal(landCam({ x: 0, y: 0 }, 1280, 456).z, 1.7);
  assert.equal(landCam({ x: 0, y: 0 }, 400, 0).z, 1.2);
  assert.deepEqual([rightOccupied(1280, true, true), rightOccupied(1280, false, true), rightOccupied(1280, false, false), rightOccupied(400, true, true)], [456, 324, 0, 0]);
});
