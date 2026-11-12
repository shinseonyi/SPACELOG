import assert from "node:assert/strict";
import test from "node:test";
import { focusBlur } from "./focusBlur.ts";

test("초점이면 0, 기준 거리 이상이면 1, 사이는 단조 증가", () => {
  assert.equal(focusBlur(0, 1000), 0);
  assert.equal(focusBlur(1000, 1000), 1);
  assert.equal(focusBlur(5000, 1000), 1);
  assert.equal(focusBlur(-1000, 1000), 1); // 앞쪽도 같다
  const a = focusBlur(200, 1000), b = focusBlur(500, 1000), c = focusBlur(800, 1000);
  assert.ok(0 < a && a < b && b < c && c < 1);
});

test("기준 거리가 없으면 흐리지 않는다", () => {
  assert.equal(focusBlur(500, 0), 0);
  assert.equal(focusBlur(500, NaN), 0);
});
