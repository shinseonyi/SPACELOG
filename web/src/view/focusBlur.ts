// 행성을 고르면(패널 열림) 심도 효과: 고른 행성에 초점, 다른 행성은 거리에 따라 흐리게 (2D · 2.5D 공용 계산).

/** 흐림 정도 0 ~ 1. gap = 초점에서 떨어진 거리, ref = 가장 흐려지는 거리. 가까운 것은 거의 그대로(부드러운 계단) */
export function focusBlur(gap: number, ref: number): number {
  if (!(ref > 0)) return 0;
  const t = Math.min(1, Math.max(0, Math.abs(gap) / ref));
  return t * t * (3 - 2 * t);
}

/** 2D: 화면에서 가장 흐린 정도의 흐림(화면 px)과 어둡기. 1 = 가장 흐림 */
export const FLAT_BLUR_PX = 7;
export const FLAT_DIM = 0.4;
/** 2D: 고른 행성에서 화면상 이 거리(px)만큼 떨어지면 가장 흐리다. 확대하면 같은 행성도 멀어져 더 흐리고, 축소하면 또렷해진다 */
export const FLAT_BLUR_REF = 640;
