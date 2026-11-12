import { useEffect, useState } from "react";
import type { Planet, Star } from "@spacelog/shared/types";
import { api, RequestError } from "../api/client.ts";
import { allPeriod } from "../home/periodOptions.ts";
import { useStore } from "../state/store.ts";

/**
 * 기간과 무관하게 최근 1년 전체의 기록·행성. 별자리는 기간 밖 기록도 묶을 수 있어 관측소와 별자리 창이 쓴다.
 * 우주의 기록이 바뀌면(옮김·삭제·기간 변경) 다시 받는다. 아직 못 받았으면 null.
 */
export function useAllRecords(): { stars: Star[]; planets: Planet[] } | null {
  const version = useStore((s) => s.stars.length + s.planets.length);
  const [data, setData] = useState<{ stars: Star[]; planets: Planet[] } | null>(null);
  useEffect(() => {
    let alive = true;
    const p = allPeriod();
    api.universe(p.from, p.to).then(
      (u) => alive && setData({ stars: u.stars, planets: u.planets }),
      (e) => {
        if (!(e instanceof RequestError)) throw e;
        if (alive) setData((cur) => cur ?? { stars: [], planets: [] });
      },
    );
    return () => {
      alive = false;
    };
  }, [version]);
  return data;
}
