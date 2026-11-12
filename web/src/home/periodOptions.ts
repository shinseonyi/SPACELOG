import { addDays, customPeriod, todayPeriod, toLocalDateString, weekPeriod } from "@spacelog/shared/period";
import type { Period } from "@spacelog/shared/types";

/** 시연용 기간 (README 4-1 결정 기록): `PeriodPreset`은 바꾸지 않고 날짜 범위(custom)로 서버에 요청한다 */
export type PeriodKey = "today" | "week" | "month" | "all" | "custom";

/** 이번 달: 이번 달 1일 ~ 오늘 */
export function monthPeriod(now: Date = new Date()): Period {
  const first = toLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  return customPeriod(first, toLocalDateString(now));
}

/** 전체: 서버가 한 번에 1년까지만 받으므로 오늘부터 거슬러 1년 (POLICY 2-1) */
export function allPeriod(now: Date = new Date()): Period {
  const today = toLocalDateString(now);
  return customPeriod(addDays(today, -364), today);
}

export function periodFor(key: Exclude<PeriodKey, "custom">, now: Date = new Date()): Period {
  if (key === "today") return todayPeriod(now);
  if (key === "week") return weekPeriod(now);
  return key === "month" ? monthPeriod(now) : allPeriod(now);
}

const same = (a: Period, b: Period) => a.from === b.from && a.to === b.to;

/** 지금 기간이 어느 항목인지. 이번 달·전체는 날짜가 같을 때만 그 이름으로 부른다 */
export function periodKey(period: Period): PeriodKey {
  if (period.preset === "today" || period.preset === "week") return period.preset;
  if (same(period, monthPeriod())) return "month";
  if (same(period, allPeriod())) return "all";
  return "custom";
}

/** 그 날짜("YYYY-MM-DD")가 기간 안에 있는가 */
export const within = (period: Period, day: string) => period.from <= day && day <= period.to;

/** 그 날짜가 들어가는 가장 좁은 기간: 오늘 → 이번 주 → 이번 달 → 전체. 1년보다 오래됐으면 null (handoff 7-2) */
export function narrowestPeriodFor(day: string, now: Date = new Date()): Exclude<PeriodKey, "custom"> | null {
  const candidates: [Exclude<PeriodKey, "custom">, Period][] = [["today", todayPeriod(now)], ["week", weekPeriod(now)], ["month", monthPeriod(now)], ["all", allPeriod(now)]];
  return candidates.find(([, p]) => within(p, day))?.[0] ?? null;
}

export const PERIOD_LABEL: Record<PeriodKey, string> ={ today: "오늘", week: "이번 주", month: "이번 달", all: "전체", custom: "직접 지정" };
export const PERIOD_ORDER: PeriodKey[] = ["today", "week", "month", "all", "custom"];
