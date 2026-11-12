// 가장 좁은 화면에서 "기록 넣기" 버튼이 들어갈 자리: 오른쪽 아래 세로 버튼 묶음의 "행성 추가" 왼쪽 (home/ActionBar.tsx).
// ActionBar 가 자리를 그리면 알려 주고, AddRecord 가 그 자리로 버튼을 옮겨 그린다(포털).
import { createStore, useStore } from "zustand";

export const addSlot = createStore<{ el: HTMLElement | null }>()(() => ({ el: null }));
export const setAddSlot = (el: HTMLElement | null) => {
  if (addSlot.getState().el !== el) addSlot.setState({ el });
};
export const useAddSlot = () => useStore(addSlot, (s) => s.el);

