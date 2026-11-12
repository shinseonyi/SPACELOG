// 오른쪽 창(행성 · 별자리 · 기록 목록)의 반투명 상태.
// 우주(빈 공간)를 누르거나 시점을 움직이면(끌기 · 휠 · 이동 키) 창이 반투명해져 우주가 보이고, 창에 마우스를 올리거나 누르면 다시 또렷해진다.
import { createStore, useStore } from "zustand";

export const sideDim = createStore<{ dim: boolean }>()(() => ({ dim: false }));

/** 우주를 다루기 시작했다: 창을 반투명하게 (2D · 2.5D · 3D 의 입력 처리가 부른다) */
export const dimSide = () => {
  if (!sideDim.getState().dim) sideDim.setState({ dim: true });
};
/** 창으로 돌아왔다: 다시 또렷하게 */
export const undimSide = () => {
  if (sideDim.getState().dim) sideDim.setState({ dim: false });
};
export const useSideDim = () => useStore(sideDim, (s) => s.dim);
