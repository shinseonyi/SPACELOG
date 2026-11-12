// Claude API 호출 (공식 SDK). 서버가 켜질 때만 불러온다.
// - 시스템 프롬프트(안내 문서)는 매번 같아서 프롬프트 캐싱으로 입력 비용을 줄인다 (최상위 cache_control).
// - Opus 5.5 는 사고가 늘 켜져 있어 thinking 을 보내지 않고, 짧은 안내라 effort 는 low.
// - 안전 분류기가 거절하면(refusal) 서버 쪽 대체 모델로 이어 가도록 fallbacks 를 켠다.
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./lib.ts";

export const MAX_TOKENS = 1500;

export function anthropicStreamer(model: string) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY 를 환경에서 읽는다
  return async function* (system: string, messages: ChatMessage[], signal: AbortSignal): AsyncGenerator<string> {
    const stream = client.beta.messages.stream(
      {
        model,
        max_tokens: MAX_TOKENS,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        cache_control: { type: "ephemeral" },
        output_config: { effort: "low" },
        system,
        messages,
      } as Anthropic.Beta.MessageCreateParamsStreaming,
      { signal },
    );
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") yield "\n\n이 질문에는 답해 드릴 수 없어요. SpaceLog 사용법을 물어봐 주세요.";
    else if (final.stop_reason === "max_tokens") yield "\n\n(답변이 길어 여기서 줄였어요. 더 궁금한 부분을 이어서 물어봐 주세요.)";
  };
}
