import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Star } from "@spacelog/shared/types";
import { formatHash, parseHash } from "./router.ts";
import { createWebStore } from "./state/store.ts";

const star = (id: string, planetId: string) => ({ id, planetId, kind: "text" }) as Star;

describe("체크한 기록(전역 선택)", () => {
  it("행성 패널을 옮기고 닫아도, 기간을 바꿔도 선택이 유지된다 (여러 행성의 기록을 묶으려면)", () => {
    const s = createWebStore(() => {});
    s.setState({ stars: [star("a", "p1"), star("b", "p2")] });
    s.getState().togglePicked("a");
    s.getState().openPanel("p2");
    s.getState().togglePicked("b");
    s.getState().closePanel();
    s.getState().returnToOverview();
    assert.deepEqual(s.getState().picked, ["a", "b"]);
  });

  it("같은 기록을 다시 누르면 빠지고, 해제하면 비워진다", () => {
    const s = createWebStore(() => {});
    s.getState().togglePicked("a");
    s.getState().togglePicked("b");
    s.getState().togglePicked("a");
    assert.deepEqual(s.getState().picked, ["b"]);
    s.getState().clearPicked();
    assert.deepEqual(s.getState().picked, []);
  });

  it("기록이 지워지면 선택에서도 빠진다", () => {
    const s = createWebStore(() => {});
    s.setState({ stars: [star("a", "p1"), star("b", "p1")] });
    s.getState().togglePicked("a");
    s.getState().togglePicked("b");
    s.getState().starsDeleted(["a"]);
    assert.deepEqual(s.getState().picked, ["b"]);
  });
});

describe("관측소 경로", () => {
  it("해시를 읽고 다시 만든다 (별자리 · 혜성 · 기본)", () => {
    assert.deepEqual(parseHash("#/observatory").route, { name: "observatory" });
    assert.deepEqual(parseHash("#/observatory/comet").route, { name: "observatory", comet: true });
    assert.deepEqual(parseHash("#/observatory/link%2F1").route, { name: "observatory", linkId: "link/1" });
    assert.equal(formatHash({ name: "observatory" }), "#/observatory");
    assert.equal(formatHash({ name: "observatory", comet: true }), "#/observatory/comet");
    assert.equal(formatHash({ name: "observatory", linkId: "link/1" }), "#/observatory/link%2F1");
  });

  it("열면 선택한 기록(저장 전 묶음)을 들고, Esc(goBack)로 홈으로 돌아가면 선택은 남아 있다", () => {
    const hashes: string[] = [];
    const s = createWebStore((h) => hashes.push(h));
    s.getState().togglePicked("a");
    s.getState().openObservatory({ draftIds: ["a", "a", "b"] });
    assert.deepEqual(s.getState().obsDraft, ["a", "b"]);
    assert.deepEqual(s.getState().route, { name: "observatory" });
    s.getState().goBack();
    assert.deepEqual(s.getState().route, { name: "home" });
    assert.deepEqual(s.getState().picked, ["a"]);
    s.getState().openObservatory({ linkId: "l1" });
    assert.equal(s.getState().obsDraft, null);
    assert.equal(hashes.at(-1), "#/observatory/l1");
  });
});
