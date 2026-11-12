import assert from "node:assert/strict";
import test from "node:test";
import type { Star } from "@spacelog/shared/types";
import { addedMessage, mergeResults, splitFiles, textBody } from "./addInput.ts";

test("메모 칸: 링크 한 줄은 링크, 그 밖은 메모, 공백뿐이면 보내지 않는다", () => {
  assert.deepEqual(textBody("  https://example.com/a  "), { kind: "link", url: "https://example.com/a" });
  assert.deepEqual(textBody("읽어 볼 것 https://example.com"), { kind: "text", text: "읽어 볼 것 https://example.com" });
  assert.deepEqual(textBody("회의 메모\n둘째 줄"), { kind: "text", text: "회의 메모\n둘째 줄" });
  assert.equal(textBody("   \n "), null);
});

test("파일: 200MB 넘는 것과 21번째부터는 보내지 않는다", () => {
  const file = (name: string, size: number) => ({ name, size }) as File;
  const many = Array.from({ length: 21 }, (_, i) => file(`f${i}.txt`, 10));
  const { send, rejected } = splitFiles([file("큰.mov", 201 * 1024 * 1024), ...many]);
  assert.equal(send.length, 20);
  assert.deepEqual(rejected.map((r) => [r.name, r.code]), [["큰.mov", "FILE_TOO_LARGE"], ["f20.txt", "TOO_MANY_FILES"]]);
});

test("넣은 뒤 알림 문구", () => {
  const star = (over: Partial<Star>) => ({ kind: "text", textBody: "회의 메모", linkTitle: null, linkDomain: null, originalName: null, url: null, ...over }) as Star;
  assert.equal(addedMessage([star({})], "생각 조각"), "넣었어요 · 회의 메모 · 생각 조각 행성");
  assert.equal(addedMessage([star({}), star({ kind: "file", originalName: "a.pdf" })], "읽은 것들"), "2개 넣었어요 · 읽은 것들 행성");
  assert.equal(addedMessage([star({ kind: "link", url: "https://www.notion.so/x", linkDomain: "notion.so" })], null), "넣었어요 · notion.so");
});

test("응답 여러 개를 합친다", () => {
  const r = mergeResults([{ created: [{ id: "a" } as Star], duplicates: [], rejected: [] }, { created: [{ id: "b" } as Star], duplicates: [], rejected: [] }]);
  assert.deepEqual(r.created.map((s) => s.id), ["a", "b"]);
});
