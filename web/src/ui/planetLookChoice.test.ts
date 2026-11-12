import assert from "node:assert/strict";
import test from "node:test";
import { suggestColor } from "./planetLookChoice.ts";

test("새 행성 색: 아직 안 쓴 색 중 첫 번째(팔레트 순서), 다 쓰였으면 가장 적게 쓰인 색", () => {
  assert.equal(suggestColor([]), "planet-1");
  assert.equal(suggestColor(["planet-1", "planet-2"]), "planet-3");
  assert.equal(suggestColor(["planet-9"]), "planet-2"); // planet-9 는 planet-1 로 돌려 쓴다
  const all = ["planet-1", "planet-2", "planet-3", "planet-4", "planet-5", "planet-8", "planet-7"];
  assert.equal(suggestColor([...all, "planet-1", "planet-2"]), "planet-3");
});
