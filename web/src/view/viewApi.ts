// 지금 켜진 우주 보기가 홈의 확대 조절(왼쪽 아래)에 알려 주는 값. 보기마다 확대·이동 방식이 달라 화면 계약(WebState)에는 넣지 않고 따로 둔다.
import { createStore, useStore } from "zustand";

export interface ZoomControl {
  /**
   * 지금 배율(%). 가운데 [맞춤] 버튼 아래에 "(78%)"로 보인다. 2D·2.5D 같은 자리.
   * 2D: 평면 확대 배율. 2.5D: 맞춤(모든 행성이 보이는 거리)을 100%로, 가까이 날아가면 커지고 멀어지면 작아진다
   */
  percent: number;
  zoomIn(): void;
  zoomOut(): void;
  /** 모든 행성이 보이게 맞추기 */
  fit(): void;
}

export const viewApi = createStore<{ zoom: ZoomControl | null }>()(() => ({ zoom: null }));

export function useViewApi<T>(selector: (s: { zoom: ZoomControl | null }) => T): T {
  return useStore(viewApi, selector);
}
