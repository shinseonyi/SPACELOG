import assert from "node:assert/strict";
import test from "node:test";
import { focusBlur, NEAR_RATIO } from "./focusBlur.ts";

test("초점 가까이는 0, 기준 거리 이상이면 1, 사이는 단조 증가", () => {
  assert.equal(focusBlur(0, 1000), 0);
  assert.equal(focusBlur(1000 * NEAR_RATIO, 1000), 0); // 가까운 띠 안은 전혀 흐리지 않는다
  assert.equal(focusBlur(1000, 1000), 1);
  assert.equal(focusBlur(5000, 1000), 1);
  assert.equal(focusBlur(-1000, 1000), 1); // 앞쪽도 같다
  const a = focusBlur(400, 1000), b = focusBlur(600, 1000), c = focusBlur(900, 1000);
  assert.ok(0 < a && a < b && b < c && c < 1);
});

test("기준 거리가 없으면 흐리지 않는다", () => {
  assert.equal(focusBlur(500, 0), 0);
  assert.equal(focusBlur(500, NaN), 0);
});
