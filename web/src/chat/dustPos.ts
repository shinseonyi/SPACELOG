// 우주먼지 버튼을 끌어서 옮긴 자리. 메모리에만 둔다 — 새로 고치거나 앱을 다시 켜면 원래 자리(왼쪽 아래 묶음 · 기록 넣기 위)로 돌아간다.
import { createStore, useStore } from "zustand";

export interface DustPos {
  /** 버튼 묶음(.dust: 빛무리 + 이름표)의 왼쪽 위, 화면 px */
  x: number;
  y: number;
}

export const dustPos = createStore<{ pos: DustPos | null }>()(() => ({ pos: null }));
export const useDustPos = () => useStore(dustPos, (s) => s.pos);
export const setDustPos = (pos: DustPos | null) => dustPos.setState({ pos });

/** 위 "hello" 말풍선(-32)이 잘리지 않을 만큼 위를 비운다 */
export const DUST_TOP_ROOM = 36;
const EDGE = 8;

/** 화면 안에 들어오게 자른다. w · h = 버튼 묶음 크기, vw · vh = 화면 크기 */
export function clampDust(p: DustPos, w: number, h: number, vw: number, vh: number): DustPos {
  const x = Math.min(Math.max(p.x, EDGE), Math.max(EDGE, vw - w - EDGE));
  const y = Math.min(Math.max(p.y, DUST_TOP_ROOM), Math.max(DUST_TOP_ROOM, vh - h - EDGE));
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * 끌기: 누른 뒤 4px 넘게 움직이면 옮긴다. 처음 옮길 때 버튼이 다른 자리(.dust-free)로 다시 그려지므로
 * 버튼이 아니라 window 에서 따라간다. 끌고 놓은 뒤의 누름은 대화창을 열지 않는다 (consumeDragClick)
 */
let dragged = false;
export function startDustDrag(down: PointerEvent, rect: DOMRect) {
  dragged = false;
  const { pointerId, clientX: sx, clientY: sy } = down;
  const move = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!dragged && Math.hypot(dx, dy) <= 4) return;
    dragged = true;
    setDustPos(clampDust({ x: rect.left + dx, y: rect.top + dy }, rect.width, rect.height, window.innerWidth, window.innerHeight));
  };
  const end = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end);
  window.addEventListener("pointercancel", end);
}
/** 방금 끌기로 끝난 누름이면 true (한 번만) */
export function consumeDragClick(): boolean {
  const was = dragged;
  dragged = false;
  return was;
}
