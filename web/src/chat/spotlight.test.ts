import assert from "node:assert/strict";
import test from "node:test";
import { spotMask, unionBox } from "./spotlight.ts";

test("상자 합치기: 모두 감싸는 상자, 없으면 null", () => {
  assert.equal(unionBox([]), null);
  assert.deepEqual(unionBox([{ left: 10, top: 20, right: 30, bottom: 40 }]), { left: 10, top: 20, right: 30, bottom: 40 });
  assert.deepEqual(
    unionBox([
      { left: 10, top: 50, right: 30, bottom: 70 },
      { left: 0, top: 20, right: 20, bottom: 40 },
    ]),
    { left: 0, top: 20, right: 30, bottom: 70 },
  );
});

test("구멍 마스크: 상자 가운데에 여유를 둔 타원, 안쪽은 투명하고 가장자리로 서서히 덮인다", () => {
  const m = spotMask({ left: 100, top: 100, right: 300, bottom: 150 }, 120);
  assert.match(m, /^radial-gradient\(ellipse 220px 145px at 200px 125px, transparent 35%, rgba\(0, 0, 0, 0\.55\) 70%, #000 100%\)$/);
});
