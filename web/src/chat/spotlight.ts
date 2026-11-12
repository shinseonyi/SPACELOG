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

/** 상자 둘레 pad 만큼 여유를 둔 타원 구멍. 가장자리는 부드럽게 (CSS mask-image 값) */
export function spotMask(b: Box, pad = 36): string {
  const cx = (b.left + b.right) / 2;
  const cy = (b.top + b.bottom) / 2;
  // 타원이 모서리까지 덮도록 반지름을 √2 배 가까이 키운다
  const rx = ((b.right - b.left) / 2 + pad) * 1.25;
  const ry = ((b.bottom - b.top) / 2 + pad) * 1.25;
  return `radial-gradient(ellipse ${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${cx.toFixed(0)}px ${cy.toFixed(0)}px, transparent 70%, #000 100%)`;
}
