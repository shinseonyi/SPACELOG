import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { DailyCap, LIMITS, parseChat, RateLimiter, systemPrompt } from "./lib.ts";
import { createChatServer, type Streamer } from "./server.ts";

test("대화 검사: 마지막은 사용자 질문, 앞의 assistant 는 버리고, 길이·형식을 막는다", () => {
  assert.deepEqual(parseChat({ messages: [{ role: "user", content: " 안녕 " }] }), { ok: true, messages: [{ role: "user", content: "안녕" }] });
  const long = parseChat({ messages: [{ role: "assistant", content: "처음" }, { role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }] });
  assert.ok(long.ok && long.messages[0].role === "user");
  assert.equal(parseChat({ messages: [{ role: "user", content: "x" }, { role: "assistant", content: "y" }] }).ok, false); // 마지막이 assistant
  assert.equal(parseChat({ messages: [] }).ok, false);
  assert.equal(parseChat(null).ok, false);
  assert.equal(parseChat({ messages: [{ role: "system", content: "x" }] }).ok, false);
  assert.equal(parseChat({ messages: [{ role: "user", content: 5 }] }).ok, false);
  assert.equal(parseChat({ messages: [{ role: "user", content: "가".repeat(LIMITS.maxChars + 1) }] }).ok, false);
});

test("최근 12개 대화만 보낸다", () => {
  const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i}` }));
  many.push({ role: "user", content: "마지막" });
  const r = parseChat({ messages: many });
  assert.ok(r.ok && r.messages.length <= LIMITS.maxMessages && r.messages.at(-1)?.content === "마지막" && r.messages[0].role === "user");
});

test("IP별 사용량 제한과 하루 전체 상한", () => {
  const rl = new RateLimiter(2, 1000);
  assert.deepEqual([rl.allow("a", 0), rl.allow("a", 10), rl.allow("a", 20), rl.allow("b", 20)], [true, true, false, true]);
  assert.equal(rl.allow("a", 2000), true); // 창이 지나면 다시
  const cap = new DailyCap(2);
  const d1 = new Date("2026-11-12T10:00:00Z");
  assert.deepEqual([cap.take(d1), cap.take(d1), cap.take(d1)], [true, true, false]);
  assert.equal(cap.take(new Date("2026-11-13T00:10:00Z")), true); // 날짜가 바뀌면 0 부터
});

test("시스템 프롬프트에 안내 문서와 답변 규칙이 들어간다", () => {
  const p = systemPrompt("## 문서\n별자리는 기록을 묶는 것");
  assert.match(p, /\[안내 문서\]\n## 문서\n별자리는 기록을 묶는 것$/);
  assert.match(p, /문서에 없거나 확실하지 않으면 모른다고/);
});

async function start(streamer: Streamer, extra: { perIpPerMinute?: number; dailyMax?: number } = {}) {
  const server = createChatServer({ streamer, knowledge: "지식", html: "<html>챗봇</html>", ...extra });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
}
const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(`${url}/api/chat`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

test("서버: 화면·상태 확인, 답변을 SSE 로 조금씩 보낸다 (가짜 AI)", async () => {
  let seen: { system: string; n: number } | null = null;
  const { server, url } = await start(async function* (system, messages) {
    seen = { system, n: messages.length };
    yield "안녕";
    yield "하세요";
  });
  try {
    assert.equal((await fetch(`${url}/healthz`)).status, 200);
    assert.match(await (await fetch(url)).text(), /챗봇/);
    const res = await post(url, { messages: [{ role: "user", content: "어떻게 써요?" }] });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/event-stream/);
    const text = await res.text();
    assert.equal(text, 'data: {"text":"안녕"}\n\ndata: {"text":"하세요"}\n\ndata: [DONE]\n\n');
    assert.ok(seen && (seen as { system: string }).system.includes("지식") && (seen as { n: number }).n === 1);
  } finally {
    server.close();
  }
});

test("서버: 잘못된 요청과 다른 출처, 사용량 초과를 거절한다", async () => {
  const { server, url } = await start(async function* () { yield "ok"; }, { perIpPerMinute: 2, dailyMax: 100 });
  try {
    assert.equal((await post(url, { messages: [] })).status, 400);
    assert.equal((await fetch(`${url}/api/chat`, { method: "POST", body: "{깨짐" })).status, 400);
    assert.equal((await fetch(`${url}/nope`)).status, 404);
    const cross = await post(url, { messages: [{ role: "user", content: "x" }] }, { origin: "https://evil.example" });
    assert.equal(cross.status, 403);
    // 위 요청들이 이미 이 IP 의 사용량을 썼다: 한 번 더 보내면 제한에 걸린다
    const limited = await post(url, { messages: [{ role: "user", content: "x" }] });
    assert.equal(limited.status, 429);
  } finally {
    server.close();
  }
});

test("서버: AI 호출이 실패해도 내용 없이 오류 문구만 보내고, 서버는 계속 산다", async () => {
  const { server, url } = await start(async function* () { throw new Error("비밀 내용"); yield ""; });
  try {
    const text = await (await post(url, { messages: [{ role: "user", content: "x" }] })).text();
    assert.match(text, /"error":"지금은 답변하지 못했어요/);
    assert.ok(!text.includes("비밀 내용")); // 내부 오류 내용은 사용자에게 보내지 않는다
    assert.equal((await fetch(`${url}/healthz`)).status, 200);
  } finally {
    server.close();
  }
});
