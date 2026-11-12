import assert from "node:assert/strict";
import test from "node:test";
import { distancesFrom, formatDistance, referencePlanet, type Point3 } from "./distance.ts";

const pts = new Map<string, Point3>([
  ["a", [0, 0, 0]],
  ["b", [300, 400, 0]],
  ["c", [0, 0, 260]],
  ["d", [0, 0, -260]],
]);

test("기준 행성에서 가까운 순서, 기준 행성은 빼고 같은 거리면 id 순", () => {
  assert.deepEqual(distancesFrom("a", pts), [{ id: "c", d: 260 }, { id: "d", d: 260 }, { id: "b", d: 500 }]);
  assert.deepEqual(distancesFrom("없음", pts), []);
});

test("기준 행성: 착륙한 행성 → 없으면 가장 최근에 기록을 넣은 행성", () => {
  const rank = new Map([["a", 2], ["b", 0], ["c", 1]]);
  assert.equal(referencePlanet(["a", "b", "c"], "c", rank), "c");
  assert.equal(referencePlanet(["a", "b", "c"], null, rank), "b");
  assert.equal(referencePlanet(["a", "b", "c"], "지운 행성", rank), "b");
  assert.equal(referencePlanet([], null, rank), null);
});

test("거리 표시는 천 단위 쉼표 + m", () => {
  assert.equal(formatDistance(627), "627m");
  assert.equal(formatDistance(1234), "1,234m");
});
