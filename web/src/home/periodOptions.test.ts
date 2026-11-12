import assert from "node:assert/strict";
import test from "node:test";
import { allPeriod, monthPeriod, narrowestPeriodFor, periodKey, within } from "./periodOptions.ts";

test("이번 달은 1일부터 오늘까지", () => {
  const p = monthPeriod(new Date(2026, 10, 12));
  assert.deepEqual([p.preset, p.from, p.to], ["custom", "2026-11-01", "2026-11-12"]);
});

test("전체는 오늘부터 거슬러 1년(최대 범위)", () => {
  const p = allPeriod(new Date(2026, 10, 12));
  assert.deepEqual([p.from, p.to], ["2025-11-13", "2026-11-12"]);
});

test("기록이 든 가장 좁은 기간: 오늘 → 이번 주 → 이번 달 → 전체. 1년 넘으면 없음 (handoff 7-2)", () => {
  const now = new Date(2026, 10, 12); // 목요일. 이번 주는 11-09(월)부터
  assert.equal(narrowestPeriodFor("2026-11-12", now), "today");
  assert.equal(narrowestPeriodFor("2026-11-09", now), "week");
  assert.equal(narrowestPeriodFor("2026-11-05", now), "month"); // 7일 전은 이번 주에 들지 않는다
  assert.equal(narrowestPeriodFor("2026-10-20", now), "all");
  assert.equal(narrowestPeriodFor("2025-01-01", now), null);
  assert.ok(within(monthPeriod(now), "2026-11-01") && !within(monthPeriod(now), "2026-10-31"));
});

test("날짜가 같으면 이번 달·전체 이름으로 알아본다", () => {
  assert.equal(periodKey(monthPeriod()), "month");
  assert.equal(periodKey(allPeriod()), "all");
  assert.equal(periodKey({ preset: "custom", from: "2020-01-01", to: "2020-01-02" }), "custom");
});
