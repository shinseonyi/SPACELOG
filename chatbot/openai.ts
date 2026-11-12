// OpenAI API 호출 (공식 SDK, Chat Completions 스트리밍). 서버가 켜질 때만 불러온다.
// 시스템 프롬프트(안내 문서)는 매번 같아서 OpenAI 가 자동으로 캐싱한다 (앞부분이 같을 때).
import OpenAI from "openai";
import type { ChatMessage } from "./lib.ts";

export const MAX_TOKENS = 1500;

export function openaiStreamer(model: string) {
  const client = new OpenAI(); // OPENAI_API_KEY 를 환경에서 읽는다
  return async function* (system: string, messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
    const stream = await client.chat.completions.create(
      {
        model,
        max_completion_tokens: MAX_TOKENS,
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      },
      { signal },
    );
    let finish: string | null = null;
    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.delta?.content) yield choice.delta.content;
      if (choice?.delta && "refusal" in choice.delta && choice.delta.refusal) finish = "refusal";
      if (choice?.finish_reason) finish = finish ?? choice.finish_reason;
    }
    if (finish === "refusal" || finish === "content_filter") yield "\n\n이 질문에는 답해 드릴 수 없어요. SpaceLog 사용법을 물어봐 주세요.";
    else if (finish === "length") yield "\n\n(답변이 길어 여기서 줄였어요. 더 궁금한 부분을 이어서 물어봐 주세요.)";
  };
}
