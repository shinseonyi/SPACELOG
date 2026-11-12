import assert from "node:assert/strict";
import test from "node:test";
import { clampDust, DUST_TOP_ROOM } from "./dustPos.ts";

test("화면 안이면 그대로 (정수로)", () => {
  assert.deepEqual(clampDust({ x: 200.4, y: 300.6 }, 60, 74, 1440, 900), { x: 200, y: 301 });
});

test("화면 밖으로 끌면 가장자리 8px 안, 위는 말풍선 자리만큼 비운다", () => {
  assert.deepEqual(clampDust({ x: -50, y: -50 }, 60, 74, 1440, 900), { x: 8, y: DUST_TOP_ROOM });
  assert.deepEqual(clampDust({ x: 5000, y: 5000 }, 60, 74, 1440, 900), { x: 1440 - 60 - 8, y: 900 - 74 - 8 });
});

test("화면이 버튼보다 작아도 왼쪽 위에 붙는다", () => {
  assert.deepEqual(clampDust({ x: 100, y: 100 }, 60, 74, 40, 40), { x: 8, y: DUST_TOP_ROOM });
});
