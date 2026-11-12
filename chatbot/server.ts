// 챗봇 서버: 안내 문서를 지식으로 Claude 가 사용법 질문에 답한다. 제품(수집 앱·로컬 웹)과 별개로 배포한다 (README 6-1 챗봇 버튼이 이 주소를 연다).
// - API 키는 서버 환경 변수에만 둔다. 브라우저에는 주지 않는다.
// - 질문·답변 내용은 저장하거나 기록하지 않는다 (요청 수와 오류 종류만 센다).
// - 같은 출처(이 서버가 내려주는 화면)에서 온 요청만 받고, IP별 · 하루 전체 사용량을 제한한다.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DailyCap, LIMITS, parseChat, RateLimiter, systemPrompt, type ChatMessage } from "./lib.ts";

/** 답변 글자를 한 조각씩 돌려주는 함수. 실제로는 Claude API (anthropic.ts), 테스트에서는 가짜 */
export type Streamer = (system: string, messages: ChatMessage[], signal: AbortSignal) => AsyncIterable<string>;

export interface ChatServerOptions {
  streamer: Streamer;
  knowledge: string;
  html: string;
  perIpPerMinute?: number;
  dailyMax?: number;
}

const json = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
};

async function readBody(req: IncomingMessage): Promise<unknown | "too_big" | "bad"> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > LIMITS.maxBodyBytes) return "too_big";
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return "bad";
  }
}

/** 프록시 뒤(Render)에서는 x-forwarded-for 의 첫 주소가 사용자 IP 다 */
const clientIp = (req: IncomingMessage) => String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "?").split(",")[0].trim();

export function createChatServer(opt: ChatServerOptions): Server {
  const system = systemPrompt(opt.knowledge);
  const perIp = new RateLimiter(opt.perIpPerMinute ?? 12, 60_000);
  const daily = new DailyCap(opt.dailyMax ?? 3000);

  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    const headers = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "x-frame-options": "DENY" };
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

    if (req.method === "GET" && url.pathname === "/healthz") return json(res, 200, { ok: true });
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" });
      return void res.end(opt.html);
    }
    if (!(req.method === "POST" && url.pathname === "/api/chat")) return json(res, 404, { error: "찾을 수 없어요" });

    // 다른 사이트에서 이 주소로 몰래 요청하는 것을 막는다 (같은 출처만)
    const origin = req.headers.origin;
    if (origin) {
      let sameOrigin = false;
      try {
        sameOrigin = new URL(origin).host === req.headers.host;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) return json(res, 403, { error: "이 주소에서는 사용할 수 없어요" });
    }
    if (!perIp.allow(clientIp(req))) return json(res, 429, { error: "질문이 너무 빨라요. 잠시 뒤에 다시 물어봐 주세요" });
    if (!daily.take()) return json(res, 429, { error: "오늘 답변할 수 있는 횟수를 다 썼어요. 내일 다시 물어봐 주세요" });

    const body = await readBody(req);
    if (body === "too_big") return json(res, 413, { error: "질문이 너무 길어요" });
    if (body === "bad") return json(res, 400, { error: "요청 형식이 올바르지 않아요" });
    const parsed = parseChat(body);
    if (!parsed.ok) return json(res, 400, { error: parsed.error });

    // 서버 보내기 이벤트(SSE)로 답변을 조금씩 보낸다
    res.writeHead(200, { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", connection: "keep-alive" });
    const abort = new AbortController();
    res.on("close", () => abort.abort()); // 사용자가 창을 닫으면 Claude 호출도 멈춘다 (비용 절약)
    try {
      for await (const text of opt.streamer(system, parsed.messages, abort.signal)) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      res.write("data: [DONE]\n\n");
    } catch (e) {
      if (!abort.signal.aborted) {
        console.error("[chatbot] 답변 실패:", e instanceof Error ? e.name : "unknown"); // 내용은 남기지 않고 종류만
        res.write(`data: ${JSON.stringify({ error: "지금은 답변하지 못했어요. 잠시 뒤에 다시 시도해 주세요" })}\n\n`);
      }
    }
    res.end();
  });
}

// `node chatbot/server.ts` 로 직접 실행할 때만 켠다 (테스트가 가져다 쓸 때는 켜지 않는다)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { anthropicStreamer } = await import("./anthropic.ts");
  const here = (f: string) => fileURLToPath(new URL(f, import.meta.url));
  const port = Number(process.env.PORT ?? 8788);
  const model = process.env.CHATBOT_MODEL || "claude-opus-5-5";
  createChatServer({
    streamer: anthropicStreamer(model),
    knowledge: readFileSync(here("./knowledge.md"), "utf8"),
    html: readFileSync(here("./public/index.html"), "utf8"),
    perIpPerMinute: Number(process.env.CHATBOT_PER_MINUTE ?? 12),
    dailyMax: Number(process.env.CHATBOT_DAILY_MAX ?? 3000),
  }).listen(port, () => console.log(`[chatbot] http://localhost:${port} (model ${model})`));
}
