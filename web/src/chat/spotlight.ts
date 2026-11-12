// 대화창 뒤 덮개(어둡게 · 흐리게)에 뚫는 구멍: 길잡이가 가리키는 버튼(과 제자리 "Here!"의 우주먼지)만 또렷하게 남긴다. 순수 함수.

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** 여러 상자를 감싸는 가장 작은 상자. 없으면 null */
export function unionBox(boxes: Box[]): Box | null {
  if (boxes.length === 0) return null;
  return boxes.reduce((u, b) => ({ left: Math.min(u.left, b.left), top: Math.min(u.top, b.top), right: Math.max(u.right, b.right), bottom: Math.max(u.bottom, b.bottom) }));
}

/**
 * 상자 둘레 pad 만큼 여유를 둔 타원 구멍 (CSS mask-image 값). 상자 안쪽은 완전히 또렷하고,
 * 그 밖으로 반지름의 절반 가까이에 걸쳐 서서히 덮개로 돌아간다 — 구멍이 도려낸 것처럼 보이지 않게
 */
export function spotMask(b: Box, pad = 120): string {
  const cx = (b.left + b.right) / 2;
  const cy = (b.top + b.bottom) / 2;
  const rx = (b.right - b.left) / 2 + pad;
  const ry = (b.bottom - b.top) / 2 + pad;
  return `radial-gradient(ellipse ${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, transparent 35%, rgba(0, 0, 0, 0.55) 70%, #000 100%)`;
}
