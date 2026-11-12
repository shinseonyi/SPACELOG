// 좁은 화면(959px 이하)에서 홈 배너가 들어갈 자리: 오른쪽 창의 카드(메뉴) 바로 아래 (home/SideWindow.tsx).
// 오른쪽 창이 자리를 그리면 알려 주고, HomeBanner 가 그 자리로 배너를 옮겨 그린다(포털). 오른쪽 창이 없으면 상단 바 아래 가운데.
import { createStore, useStore } from "zustand";

export const bannerSlot = createStore<{ el: HTMLElement | null }>()(() => ({ el: null }));
export const setBannerSlot = (el: HTMLElement | null) => {
  if (bannerSlot.getState().el !== el) bannerSlot.setState({ el });
};
export const useBannerSlot = () => useStore(bannerSlot, (s) => s.el);
