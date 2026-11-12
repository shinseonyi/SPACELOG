// 지금 켜진 우주 보기가 홈의 확대 조절(왼쪽 아래)에 알려 주는 값. 보기마다 확대·이동 방식이 달라 화면 계약(WebState)에는 넣지 않고 따로 둔다.
import { createStore, useStore } from "zustand";

export interface ZoomControl {
  /** 가운데 버튼 글자. 2D는 "100%" 같은 배율 */
  label: string;
  zoomIn(): void;
  zoomOut(): void;
  /** 모든 행성이 보이게 맞추기 */
  fit(): void;
}

export const viewApi = createStore<{ zoom: ZoomControl | null }>()(() => ({ zoom: null }));

export function useViewApi<T>(selector: (s: { zoom: ZoomControl | null }) => T): T {
  return useStore(viewApi, selector);
}
