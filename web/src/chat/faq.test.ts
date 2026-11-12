import assert from "node:assert/strict";
import test from "node:test";
import { answerFor, QUESTION_POOL, suggestions } from "./faq.ts";

test("추천 질문 9개는 모두 정해진 답이 있고, 바로 가기와 날아갈 곳이 시안대로다", () => {
  const got = QUESTION_POOL.map((q) => answerFor(q));
  assert.ok(got.every((a) => a !== null));
  assert.equal(got[0]?.target, "add"); // 기록은 어떻게 넣어요 → "기록 넣기" (제품에 버튼이 없으면 날아가지 않는다)
  assert.deepEqual([got[1]?.action, got[1]?.target], ["openLinks", "links"]);
  assert.deepEqual([got[2]?.action, got[2]?.then], ["openObservatory", "comet"]);
  assert.equal(got[3]?.action, "openProbe");
  assert.equal(got[4]?.action, "startEditPositions");
  assert.equal(got[5]?.action, "openObservatory");
  assert.equal(got[6]?.then, "comet");
  assert.equal(got[7]?.action, "view3d");
  assert.equal(got[8]?.target, "period");
});

test("위에서부터 먼저 맞는 답을 고른다. 대소문자를 가리지 않고, 모르면 null", () => {
  assert.equal(answerFor("csv 파일을 지우고 싶어요")?.action, "startEditPositions"); // 블랙홀·삭제 줄이 관측소 줄보다 위
  assert.equal(answerFor("AI에게 보내려면")?.action, "openProbe");
  assert.equal(answerFor("  3d 로 볼 수 있나요 ")?.action, "view3d");
  assert.equal(answerFor("너는 누구야")?.action, undefined);
  assert.equal(answerFor("점심 메뉴 골라 줘"), null);
});

test("추천 질문: 처음 5개, 그 뒤 아직 묻지 않은 4개", () => {
  assert.equal(suggestions([], true).length, 5);
  const next = suggestions(["별자리가 뭐예요"], false);
  assert.equal(next.length, 4);
  assert.ok(!next.includes("별자리가 뭐예요"));
  assert.deepEqual(suggestions(QUESTION_POOL, false), []);
});
