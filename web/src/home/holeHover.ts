// 행성을 끌어 블랙홀 위에 올려 둔 상태 (놓기 전). 블랙홀이 반응하고(밝아지며 커지고 그림이 비친다) 행성은 조금 작아진다.
// 2D(Flat2D) · 2.5D(Depth25)의 끌기가 포인터 위치로 갱신하고, Blackhole 이 읽는다.
import { createStore, useStore } from "zustand";

export const holeHover = createStore<{ over: boolean }>()(() => ({ over: false }));
export const useHoleOver = () => useStore(holeHover, (s) => s.over);

/** 포인터가 블랙홀 위인가. 블랙홀이 없으면 false */
export function overHole(clientX: number, clientY: number): boolean {
  const r = document.querySelector("[data-blackhole]")?.getBoundingClientRect();
  return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
}
export const setHoleOver = (over: boolean) => {
  if (holeHover.getState().over !== over) holeHover.setState({ over });
};
