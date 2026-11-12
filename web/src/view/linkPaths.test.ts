import assert from "node:assert/strict";
import test from "node:test";
import type { Link } from "../demo/types.ts";
import { linkPaths, marksOf, segmentsOf } from "./linkPaths.ts";

const link = (id: string, starIds: string[]): Link => ({ id, name: `별자리 ${id}`, memo: "", starIds, viz: { mode: "texts", chart: "bar" }, createdAtUtc: "" });
const stars = [
  { id: "s1", planetId: "p1" }, { id: "s2", planetId: "p2" }, { id: "s3", planetId: "p3" }, { id: "s4", planetId: "p1" },
];

test("기록이 처음 나온 순서대로 행성을 잇는다. 한 행성 안의 별자리도 남고 선분은 없다", () => {
  const paths = linkPaths([link("a", ["s2", "s1", "s3", "s4"]), link("b", ["s1", "s4"])], stars, []);
  assert.deepEqual(paths.map((p) => [p.id, p.planetIds]), [["a", ["p2", "p1", "p3"]], ["b", ["p1"]]]);
  assert.deepEqual(segmentsOf(paths).filter((s) => s.linkId === "b"), []); // b 는 한 행성 안이라 선이 없다
});

test("숨긴 별자리와, 우주에 없는 행성은 뺀다", () => {
  const ls = [link("a", ["s1", "s2"]), link("b", ["s1", "s3"])];
  assert.deepEqual(linkPaths(ls, stars, ["a"]).map((p) => p.id), ["b"]);
  // p3 이 우주에 없으면(블랙홀 등) b 는 p1 하나만 남아 선 없이 이름표만
  assert.deepEqual(linkPaths(ls, stars, [], new Set(["p1", "p2"])).map((p) => [p.id, p.planetIds]), [["a", ["p1", "p2"]], ["b", ["p1"]]]);
  // 기록이 모두 우주에 없는 행성에 있으면 뺀다
  assert.deepEqual(linkPaths(ls, stars, [], new Set(["p9"])), []);
});

test("선분은 이웃한 행성끼리, 이름표는 별자리마다 첫 선분에 하나", () => {
  const paths = linkPaths([link("a", ["s2", "s1", "s3"])], stars, []);
  assert.deepEqual(segmentsOf(paths).map((s) => [s.a, s.b]), [["p2", "p1"], ["p1", "p3"]]);
  assert.deepEqual(marksOf(paths).map((m) => [m.a, m.b, m.solo, m.stack]), [["p2", "p1", false, 0]]);
});

test("한 행성 안의 별자리는 그 행성 위 이름표. 같은 행성 위의 이름표끼리 순번을 받는다", () => {
  const paths = linkPaths([link("a", ["s1", "s4"]), link("b", ["s4"]), link("c", ["s1", "s2"]), link("d", ["s2"])], stars, []);
  assert.deepEqual(marksOf(paths).map((m) => [m.linkId, m.a, m.b, m.solo, m.stack]), [
    ["a", "p1", "p1", true, 0],
    ["b", "p1", "p1", true, 1],
    ["c", "p1", "p2", false, 0],
    ["d", "p2", "p2", true, 0],
  ]);
});

test("같은 두 행성을 잇는 별자리의 이름표는 겹치지 않게 순번을 받는다", () => {
  const paths = linkPaths([link("a", ["s1", "s2"]), link("b", ["s4", "s2"]), link("c", ["s1", "s3"])], stars, []);
  assert.deepEqual(marksOf(paths).map((m) => [m.linkId, m.stack]), [["a", 0], ["b", 1], ["c", 0]]);
});
