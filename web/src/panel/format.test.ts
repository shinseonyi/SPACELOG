import assert from "node:assert/strict";
import test from "node:test";
import { addedAt, daysAgo, fileSize, preview } from "./format.ts";

test("텍스트 기록은 글자 수가 아니라 실제 내용 앞 90자를 보여 준다", () => {
  const body = `첫 줄\n둘째   줄 ${"가".repeat(100)}`;
  const p = preview({ kind: "text", textBody: body, linkDomain: null, memo: null });
  assert.ok(p.startsWith("첫 줄 둘째 줄 가"));
  assert.equal([...p].length, 91); // 90자 + …
  assert.equal(preview({ kind: "text", textBody: null, linkDomain: null, memo: null }), "");
});

test("링크는 도메인, 파일·이미지는 메모 앞부분", () => {
  assert.equal(preview({ kind: "link", textBody: null, linkDomain: "youtube.com", memo: null }), "youtube.com");
  assert.equal(preview({ kind: "image", textBody: null, linkDomain: null, memo: " 회의  캡처 " }), "회의 캡처");
});

test("넣은 때: 오늘은 시각만, 지난 날은 날짜도", () => {
  const now = new Date(2026, 10, 12, 18, 0);
  assert.ok(!addedAt(new Date(2026, 10, 12, 9, 5).toISOString(), now).includes("."));
  assert.ok(addedAt(new Date(2026, 10, 3, 9, 5).toISOString(), now).startsWith("11.03 "));
});

test("며칠 전: 날짜 단위로 센다. 어젯밤 늦게 넣은 것도 1일 전, 오늘·미래는 0", () => {
  const now = new Date(2026, 10, 12, 9, 0);
  assert.equal(daysAgo(new Date(2026, 10, 12, 0, 5).toISOString(), now), 0);
  assert.equal(daysAgo(new Date(2026, 10, 11, 23, 50).toISOString(), now), 1);
  assert.equal(daysAgo(new Date(2026, 10, 5, 18, 0).toISOString(), now), 7);
  assert.equal(daysAgo(new Date(2026, 10, 13, 1, 0).toISOString(), now), 0);
});

test("파일 크기", () => {
  assert.deepEqual([fileSize(null), fileSize(512), fileSize(2048), fileSize(3 * 1024 * 1024)], ["", "512B", "2.0KB", "3.0MB"]);
});
