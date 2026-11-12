import type { Star } from "@spacelog/shared/types";

/** 오늘이면 "오후 3:12", 아니면 "11.10 오후 3:12" */
export function addedAt(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const t = d.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return t;
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${t}`;
}

/** "11.10" (월.일). 관측소의 기록 줄 */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

const PREVIEW_MAX = 90;

/** 기록 줄의 내용 앞부분. 텍스트는 글자 수가 아니라 실제 내용 앞 90자 (README 6-2) */
export function preview(star: Pick<Star, "kind" | "textBody" | "linkDomain" | "memo">): string {
  if (star.kind === "text") {
    const body = star.textBody?.trim().replace(/\s+/g, " ") ?? "";
    return body.length > PREVIEW_MAX ? `${body.slice(0, PREVIEW_MAX)}…` : body;
  }
  if (star.kind === "link") return star.linkDomain ?? "";
  return star.memo?.trim().replace(/\s+/g, " ").slice(0, PREVIEW_MAX) ?? "";
}

export function fileSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}
