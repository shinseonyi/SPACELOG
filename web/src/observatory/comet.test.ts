import assert from "node:assert/strict";
import test from "node:test";
import type { Star } from "@spacelog/shared/types";
import { cometList, COMET_MAX, daysAgoOf, withCsvSections } from "./comet.ts";

const now = new Date(2026, 10, 12, 16, 0);
const at = (daysAgo: number, h = 10) => new Date(2026, 10, 12 - daysAgo, h, 0).toISOString();
const star = (id: string, daysAgo: number, h = 10): Star => ({ id, createdAtUtc: at(daysAgo, h) }) as Star;

test("며칠 전인지는 현지 날짜 기준이다 (시각이 달라도 같은 날이면 같은 값)", () => {
  assert.equal(daysAgoOf(at(0, 1), now), 0);
  assert.equal(daysAgoOf(at(0, 23), now), 0);
  assert.equal(daysAgoOf(at(7, 23), now), 7);
  assert.equal(daysAgoOf(at(30, 0), now), 30);
});

test("7일이 넘은 기록만, 가까운 날짜부터. 같은 날은 늦게 넣은 것이 먼저. 정확히 7일 전에 표시", () => {
  const { items, total } = cometList([star("a", 0), star("b", 6), star("c", 7, 9), star("d", 7, 15), star("e", 13), star("f", 8)], now);
  assert.deepEqual(items.map((c) => c.star.id), ["d", "c", "f", "e"]);
  assert.deepEqual(items.map((c) => c.today), [true, true, false, false]);
  assert.equal(total, 4);
});

test("최대 60개까지만 보이고 전체 수는 알려 준다", () => {
  const many = Array.from({ length: 75 }, (_, i) => star(`s${i}`, 7 + (i % 20)));
  const { items, total } = cometList(many, now);
  assert.equal(items.length, COMET_MAX);
  assert.equal(total, 75);
});

test("AI용 텍스트: 기록 목록 뒤에 CSV 데이터를 붙인다", () => {
  const out = withCsvSections("## 내 기록 묶음", [{ title: "workouts.csv", table: { cols: ["a", "b"], rows: [["1", "x, y"]], truncated: false } }]);
  assert.equal(out, '## 내 기록 묶음\n\n### 데이터: workouts.csv\na,b\n1,"x, y"');
  assert.equal(withCsvSections("본문", []), "본문");
});
