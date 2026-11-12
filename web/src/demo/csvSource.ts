// CSV 기록의 내용(열·행)을 가져온다. 제품에서는 서버가 넣을 때 읽어 두고 조회 API로 주는 일이라(README 7장) 시연용이다.
// 1) 예시 데이터 시드가 등록해 둔 표 → 2) 사용자가 직접 고른 CSV 파일(이 브라우저에 저장, csvStore) → 3) 서버의 원본 파일
// (GET /api/stars/:id/original, 서버가 만들면 쓸 수 있다)을 받아 읽기. 모두 없으면 null.
import { requestObjectUrl } from "../api/client.ts";
import { decodeCsv, parseCsv, type CsvTable } from "./csv.ts";
import { getCsvTable, saveCsvTable } from "./csvStore.ts";

const registered = new Map<string, CsvTable>();
const cache = new Map<string, CsvTable | null>();

/** 목업 시드(`&mock=seed`)가 CSV 표를 미리 넣어 둔다 */
export function registerCsvTables(tables: Record<string, CsvTable>): void {
  for (const [id, t] of Object.entries(tables)) registered.set(id, t);
}

export async function loadCsvTable(starId: string): Promise<CsvTable | null> {
  const hit = registered.get(starId) ?? getCsvTable(starId);
  if (hit) return hit;
  if (cache.has(starId)) return cache.get(starId) ?? null;
  let table: CsvTable | null = null;
  try {
    const url = await requestObjectUrl(`/api/stars/${encodeURIComponent(starId)}/original`);
    try {
      table = parseCsv(decodeCsv(await (await fetch(url)).arrayBuffer()));
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    table = null; // 서버가 아직 원본을 주지 않거나, 보관함에서 사라진 경우
  }
  cache.set(starId, table);
  return table;
}

/**
 * 사용자가 고른 CSV 파일의 글자를 읽어 이 기록의 내용으로 저장한다. 표로 읽을 수 없으면(머리글 + 1행 이상 없음) null.
 * 서버에 CSV 내용을 주는 API가 생기기 전까지 쓰는 시연용 경로다.
 */
export function provideCsvText(starId: string, text: string): CsvTable | null {
  const table = parseCsv(text);
  if (!table) return null;
  saveCsvTable(starId, table);
  cache.delete(starId);
  return table;
}

/** CSV 로 볼 수 있는 기록인가 (파일이고 이름·형식이 CSV) */
export function isCsvStar(s: { kind: string; originalName: string | null; mimeType: string | null }): boolean {
  return s.kind === "file" && (/\.csv$/i.test(s.originalName ?? "") || s.mimeType === "text/csv");
}
