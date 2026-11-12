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

export function periodFor(key: Exclude<PeriodKey, "custom">): Period {
  if (key === "today") return todayPeriod();
  if (key === "week") return weekPeriod();
  return key === "month" ? monthPeriod() : allPeriod();
}

const same = (a: Period, b: Period) => a.from === b.from && a.to === b.to;

/** 지금 기간이 어느 항목인지. 이번 달·전체는 날짜가 같을 때만 그 이름으로 부른다 */
export function periodKey(period: Period): PeriodKey {
  if (period.preset === "today" || period.preset === "week") return period.preset;
  if (same(period, monthPeriod())) return "month";
  if (same(period, allPeriod())) return "all";
  return "custom";
}

export const PERIOD_LABEL: Record<PeriodKey, string> = { today: "오늘", week: "이번 주", month: "이번 달", all: "전체", custom: "직접 지정" };
export const PERIOD_ORDER: PeriodKey[] = ["today", "week", "month", "all", "custom"];
