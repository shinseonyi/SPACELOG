// 재발견 혜성 관측 (README 6-4): 모든 행성에서 넣은 지 7일이 넘은 기록을 가까운 날짜순으로 (최대 60). 정확히 7일 전 기록에 "오늘의 재발견" 표시.
import { localDate, parseLocalDate, toLocalDateString } from "@spacelog/shared/period";
import type { Star } from "@spacelog/shared/types";
import { toCsv } from "../demo/dashboard.ts";
import type { CsvTable } from "../demo/csv.ts";

export const COMET_MIN_DAYS = 7;
export const COMET_MAX = 60;

/** 넣은 지 며칠 됐는지 (현지 날짜 기준, 오늘이면 0) */
export function daysAgoOf(createdAtUtc: string, now: Date = new Date()): number {
  const day = localDate(createdAtUtc, now);
  return Math.round((parseLocalDate(toLocalDateString(now)).getTime() - parseLocalDate(day).getTime()) / 86400000);
}

export interface Comet {
  star: Star;
  ago: number;
  /** 정확히 7일 전: 오늘의 재발견 */
  today: boolean;
}

export function cometList(stars: Star[], now: Date = new Date()): { items: Comet[]; total: number } {
  const old = stars
    .map((star) => ({ star, ago: daysAgoOf(star.createdAtUtc, now) }))
    .filter((c) => c.ago >= COMET_MIN_DAYS)
    .sort((a, b) => a.ago - b.ago || b.star.createdAtUtc.localeCompare(a.star.createdAtUtc));
  return { items: old.slice(0, COMET_MAX).map((c) => ({ ...c, today: c.ago === COMET_MIN_DAYS })), total: old.length };
}

/** "AI용 텍스트 복사": 내보내기 API 가 만든 글(기록 목록) 뒤에 CSV 데이터를 붙인다 (시안 copyAi) */
export function withCsvSections(base: string, tables: { title: string; table: CsvTable }[]): string {
  return base + tables.map((t) => `\n\n### 데이터: ${t.title}\n${toCsv(t.table)}`).join("");
}
