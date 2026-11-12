import { useEffect, useState } from "react";
import { api, RequestError } from "../api/client.ts";
import { periodFor } from "../home/periodOptions.ts";

export type RangeKey = "today" | "week" | "month" | "all";
export type RangeCounts = Partial<Record<RangeKey, number>>;

/**
 * 행성 패널 아래 기간 버튼(오늘 / 이번 주 / 이번 달 / 전체)에 붙는 기록 수.
 * 기간마다 /api/universe 를 한 번씩 받아 이 행성 몫을 읽는다 (로컬 서버라 가볍다). 전체는 행성의 starCountTotal.
 * `version` 이 바뀌면(기록이 옮겨지거나 지워짐) 다시 센다.
 */
export function useRangeCounts(planetId: string, total: number | undefined, version: unknown): RangeCounts {
  const [counts, setCounts] = useState<RangeCounts>({});
  useEffect(() => {
    let alive = true;
    const keys: Exclude<RangeKey, "all">[] = ["today", "week", "month"];
    Promise.all(
      keys.map(async (k) => {
        const p = periodFor(k);
        try {
          const u = await api.universe(p.from, p.to);
          return [k, u.planets.find((x) => x.id === planetId)?.starCountInPeriod ?? 0] as const;
        } catch (e) {
          if (!(e instanceof RequestError)) throw e;
          return [k, undefined] as const; // 못 세면 숫자를 비운다
        }
      }),
    ).then((rows) => alive && setCounts(Object.fromEntries(rows)));
    return () => {
      alive = false;
    };
  }, [planetId, version]);
  return { ...counts, all: total };
}
