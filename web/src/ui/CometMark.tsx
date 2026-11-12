import heroUrl from "../assets/planet-hero.png";

/**
 * 재발견 혜성 그림: 행성 색의 머리 + 뒤로 길게 빠지는 꼬리 (design handoff 6-4 · 7-3).
 * `lg`(56px)는 우주 홈의 혜성 카드 — 머리가 행성 사진. `sm`(36×28)은 관측소의 재발견 혜성 줄 — 머리가 색 점.
 */
export function CometMark({ accent, filter, size = "sm" }: { accent: string; filter?: string; size?: "sm" | "lg" }) {
  return (
    <span className={`comet comet--${size}`} aria-hidden>
      <i className="comet__tail" style={{ background: accent }} />
      <i className="comet__head" style={size === "lg" ? { backgroundImage: `url(${heroUrl})`, filter } : { background: accent }} />
    </span>
  );
}
