import { useSyncExternalStore } from "react";

/** 가장 좁은 화면(휴대폰). "기록 넣기"를 "행성 추가" 옆으로 (CSS 의 480px 규칙과 같은 값) */
export const NARROW_QUERY = "(max-width: 480px)";
/** 오른쪽 창이 아래 버튼 · 카드와 겹치기 시작하는 폭(측정). 오른쪽 창 카드를 접는다 (home.css 의 959px 규칙과 같은 값) */
export const FOLD_QUERY = "(max-width: 959px)";
/** "기록 넣기"가 가운데 아래에 있는 폭 (add.css 의 959px 규칙 반대). 우주먼지를 그 위로 옮긴다 */
export const WIDE_QUERY = "(min-width: 960px)";

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
