// 웹에서 기록 넣기의 순수 규칙 (화면과 분리해 테스트한다). 종류 판별과 파일 사전 검사는 수집 앱과 같은 함수를 쓴다.
import type { CreateStarsResponse, Star } from "@spacelog/shared/types";
import { classifyText, precheckFiles, rejectionLines, starTitle, type Rejected, type TextPayload } from "../../../apps/collector/dropzone/precheck.ts";

export { classifyText, rejectionLines, type TextPayload };

/** 메모 칸·붙여넣기 글자 → 서버로 보낼 본문. 비었으면 null. 링크 한 줄이면 링크, 그 밖은 메모(긴 글은 서버가 .txt 로 저장) */
export function textBody(raw: string): { kind: "text"; text: string } | { kind: "link"; url: string } | null {
  const t = classifyText(null, raw);
  if (t.kind === "empty") return null;
  return t.kind === "link" ? { kind: "link", url: t.url } : { kind: "text", text: t.text };
}

/** 고른·끌어 놓은 파일 중 보낼 것(최대 20, 200MB 이하)과 거부한 것 */
export function splitFiles(files: File[]): { send: File[]; rejected: Rejected[] } {
  const { accepted, rejected } = precheckFiles(files.map((f) => ({ name: f.name, size: f.size, isDirectory: false })));
  return { send: accepted.map((i) => files[i]), rejected };
}

/** 넣은 뒤 알림 문구: "넣었어요 · 회의 메모 · 생각 조각 행성" / "3개 넣었어요 · 읽은 것들 행성" */
export function addedMessage(created: Star[], planetName: string | null): string {
  const head = created.length > 1 ? `${created.length}개 넣었어요` : `넣었어요 · ${starTitle(created[0])}`;
  return planetName ? `${head} · ${planetName} 행성` : head;
}

/** 서버 응답 여러 개를 하나로 */
export function mergeResults(list: CreateStarsResponse[]): CreateStarsResponse {
  return { created: list.flatMap((r) => r.created), duplicates: list.flatMap((r) => r.duplicates), rejected: list.flatMap((r) => r.rejected) };
}
