// 행성을 고르면(패널 열림) 심도 효과: 고른 행성에 초점, 다른 행성은 거리에 따라 흐리게 (2D · 2.5D 공용 계산).

/**
 * 흐림 정도 0 ~ 1. gap = 초점에서 떨어진 거리, ref = 가장 흐려지는 거리.
 * 초점 가까이(ref 의 nearRatio 안)는 전혀 흐리지 않고, 그 밖에서 부드러운 계단으로 1 까지 — 이웃 행성끼리는 약하게
 */
export const NEAR_RATIO = 0.3;
export function focusBlur(gap: number, ref: number, nearRatio = NEAR_RATIO): number {
  if (!(ref > 0)) return 0;
  const near = ref * nearRatio;
  const t = Math.min(1, Math.max(0, (Math.abs(gap) - near) / (ref - near)));
  return t * t * (3 - 2 * t);
}

/** 2D: 화면에서 가장 흐린 정도의 흐림(px)과 어둡기. 1 = 가장 흐림 */
export const FLAT_BLUR_PX = 9;
export const FLAT_DIM = 0.3;
/** 2D: 이 거리(우주 px)만큼 떨어지면 가장 흐리다. 흐림 없는 띠는 FLAT_NEAR_RATIO 만큼 → 바로 옆 행성(약 300 ~ 360)은 살짝만, 두 칸 너머부터 뚜렷이 */
export const FLAT_BLUR_REF = 800;
export const FLAT_NEAR_RATIO = 0.1;
