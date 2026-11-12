import assert from "node:assert/strict";
import test from "node:test";
import { allPeriod, monthPeriod, periodKey } from "./periodOptions.ts";

test("이번 달은 1일부터 오늘까지", () => {
  const p = monthPeriod(new Date(2026, 10, 12));
  assert.deepEqual([p.preset, p.from, p.to], ["custom", "2026-11-01", "2026-11-12"]);
});

test("전체는 오늘부터 거슬러 1년(최대 범위)", () => {
  const p = allPeriod(new Date(2026, 10, 12));
  assert.deepEqual([p.from, p.to], ["2025-11-13", "2026-11-12"]);
});

test("날짜가 같으면 이번 달·전체 이름으로 알아본다", () => {
  assert.equal(periodKey(monthPeriod()), "month");
  assert.equal(periodKey(allPeriod()), "all");
  assert.equal(periodKey({ preset: "custom", from: "2020-01-01", to: "2020-01-02" }), "custom");
});
