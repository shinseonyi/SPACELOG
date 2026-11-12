import { useSyncExternalStore } from "react";

/** 가장 좁은 화면(휴대폰). 오른쪽 창 카드 접기 · "기록 넣기"를 "행성 추가" 옆으로 (CSS 의 480px 규칙과 같은 값) */
export const NARROW_QUERY = "(max-width: 480px)";

const cache = new Map<string, MediaQueryList>();
const mql = (q: string) => {
  if (typeof window === "undefined") return null;
  let m = cache.get(q);
  if (!m) cache.set(q, (m = window.matchMedia(q)));
  return m;
};

/** CSS 미디어 쿼리가 지금 맞는지. 창 크기가 바뀌면 다시 그린다 */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = mql(query);
      m?.addEventListener("change", cb);
      return () => m?.removeEventListener("change", cb);
    },
    () => !!mql(query)?.matches,
    () => false,
  );
}
