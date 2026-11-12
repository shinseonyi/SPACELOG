// 재발견 별 열기 계산 (SPEC 3-6 "딥링크로 별 열기", 6장 S3 제안). 화면·스토어와 분리해 테스트한다.
import { customPeriod, localDate, toLocalDateString } from "@spacelog/shared/period";
import type { Period, Star } from "@spacelog/shared/types";
import { narrowestPeriodFor, periodFor, within } from "../home/periodOptions.ts";

/** 별의 현지 날짜. 서버가 계산해 준 값이 있으면 그것을 쓴다 */
export function starLocalDate(star: Pick<Star, "createdAtUtc" | "localDate">, now: Date = new Date()): string {
  return star.localDate ?? localDate(star.createdAtUtc, now);
}

/**
 * 별이 지금 기간 밖이면 그 별이 든 가장 좁은 기간(오늘 → 이번 주 → 이번 달 → 전체)을 돌려준다. 안이면 null (기간을 바꾸지 않음).
 * 7일 전 별은 이번 주(월요일부터)에 들지 않아 "이번 달"이 된다 (design handoff 7-2). 1년보다 오래됐으면 `직접 지정 [별 날짜 ~ 오늘]`.
 */
export function periodToShowStar(starDate: string, current: Period, now: Date = new Date()): Period | null {
  if (within(current, starDate)) return null;
  const key = narrowestPeriodFor(starDate, now);
  return key ? periodFor(key, now) : customPeriod(starDate, toLocalDateString(now));
}

/** 알림이 연 주소인지: `#/star/:id?from=rediscovery` */
export function isRediscoveryLink(params: URLSearchParams): boolean {
  return params.get("from") === "rediscovery";
}

/** 카드 shown 이벤트는 그날 처음 1회만 보낸다 (이슈 #7). 저장 키 */
export function cardShownKey(localDate: string, starId: string): string {
  return `spacelog.rediscovery.cardShown.${localDate}.${starId}`;
}
