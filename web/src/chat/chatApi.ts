// 챗봇 서버(chatbot/) 호출. 정해진 답에 없는 질문만 여기로 온다. 주소는 빌드할 때 VITE_CHATBOT_URL 로 넣는다.
// 서버는 답을 SSE 로 조금씩 보낸다 (`data: {"text":"…"}` … `data: [DONE]`). 질문·답은 서버에 저장되지 않는다 (chatbot/README.md).

export const CHATBOT_URL = ((import.meta.env.VITE_CHATBOT_URL as string | undefined) ?? "").trim().replace(/\/$/, "");
export const CHATBOT_OK = /^https?:\/\//i.test(CHATBOT_URL);

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** 답변 글자를 조각마다 돌려준다. 서버가 거절하면(403·429 등) 그 문구로 Error 를 던진다 */
export async function* askChatbot(messages: ChatTurn[], signal: AbortSignal, fetchFn: typeof fetch = fetch): AsyncGenerator<string> {
  const res = await fetchFn(`${CHATBOT_URL}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error || "지금은 답변하지 못했어요");
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const line = buf.slice(0, i).replace(/^data: /, "");
      buf = buf.slice(i + 2);
      if (line === "[DONE]") return;
      const ev = JSON.parse(line) as { text?: string; error?: string };
      if (ev.error) throw new Error(ev.error);
      if (ev.text) yield ev.text;
    }
  }
}
