import assert from "node:assert/strict";
import test from "node:test";
import { distancesFrom, formatDistance, formatStamp, recencyRows, type Point3 } from "./distance.ts";

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).toISOString();

test("모든 행성을 최근에 기록을 넣은 순서로, 기록 없는 행성은 맨 뒤(id 순)", () => {
  const stars = [
    { planetId: "a", createdAtUtc: at(10, 9) },
    { planetId: "a", createdAtUtc: at(12, 8) },
    { planetId: "b", createdAtUtc: at(12, 14, 30) },
    { planetId: "c", createdAtUtc: at(5, 23) },
  ];
  const rows = recencyRows(["e", "a", "d", "c", "b"], stars);
  assert.deepEqual(rows.map((r) => r.id), ["b", "a", "c", "d", "e"]);
  assert.equal(rows[0].last, at(12, 14, 30));
  assert.equal(rows[1].last, at(12, 8)); // 그 행성의 가장 최근 기록
  assert.equal(rows[3].last, null);
});

test("시각 표시는 월.일 시:분 (24시간제, 두 자리)", () => {
  assert.equal(formatStamp(at(12, 14, 30)), "11.12 14:30");
  assert.equal(formatStamp(new Date(2026, 0, 3, 7, 5).toISOString()), "01.03 07:05");
});

test("기준 행성에서의 거리(m): 기준은 0, 좌표 그대로 3차원 거리. 기준이 없으면 빈 값", () => {
  const pts = new Map<string, Point3>([["a", [0, 0, 0]], ["b", [300, 400, 0]], ["c", [0, 0, 260]]]);
  const d = distancesFrom("a", pts);
  assert.equal(d.get("a"), 0);
  assert.equal(d.get("b"), 500);
  assert.equal(d.get("c"), 260);
  assert.equal(distancesFrom("없음", pts).size, 0);
  assert.equal(formatDistance(1234), "1,234m");
});
