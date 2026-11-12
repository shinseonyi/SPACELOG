import { useMemo } from "react";
import type { Star } from "@spacelog/shared/types";
import { useAllRecords } from "../observatory/useAllRecords.ts";
import { useStore } from "../state/store.ts";

/**
 * 체크한 기록의 실제 내용. 다른 행성·다른 기간의 기록도 찾을 수 있게 최근 1년 전체에서 읽고,
 * 지금 우주에 있는 기록은 그쪽 값을 우선한다. 찾을 수 없는 기록(지워짐·1년 전)은 뺀다.
 */
export function usePickedStars(): Star[] {
  const picked = useStore((s) => s.picked);
  const current = useStore((s) => s.stars);
  const all = useAllRecords();
  return useMemo(() => {
    const byId = new Map<string, Star>((all?.stars ?? []).map((s) => [s.id, s]));
    for (const s of current) byId.set(s.id, s);
    return picked.map((id) => byId.get(id)).filter((s): s is Star => !!s);
  }, [picked, current, all]);
}
