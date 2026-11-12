// 사용자가 직접 고른 CSV 파일의 내용(열·행)을 이 브라우저에 저장한다. 시연용 (README 4-1).
// 서버에는 CSV 내용을 내려주는 API가 아직 없어서, 서버에 넣은 CSV 기록이라도 웹이 내용을 읽을 길이 없다.
// 그래서 같은 CSV 파일을 한 번 골라 주면 그 내용을 여기에 두고 대시보드·표로 보여 준다. 서버로는 아무것도 올라가지 않는다.
import type { CsvTable } from "./csv.ts";
import type { KeyValue } from "./storage.ts";

export const CSV_KEY = "spacelog.demo.csv.v1";

type Saved = Record<string, CsvTable>;

const browser = (): KeyValue | null => {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
};

const isTable = (v: unknown): v is CsvTable =>
  typeof v === "object" && v !== null && Array.isArray((v as CsvTable).cols) && Array.isArray((v as CsvTable).rows) && (v as CsvTable).cols.every((c) => typeof c === "string");

export function readCsvTables(kv: KeyValue | null = browser()): Saved {
  try {
    const raw = kv?.getItem(CSV_KEY);
    if (!raw) return {};
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return {};
    return Object.fromEntries(Object.entries(v).filter(([, t]) => isTable(t))) as Saved;
  } catch {
    return {};
  }
}

/** 기록 id 에 CSV 내용을 저장한다. 저장소가 막혀 있으면 false (이번 방문에서는 메모리에서만 쓴다) */
export function saveCsvTable(starId: string, table: CsvTable, kv: KeyValue | null = browser()): boolean {
  try {
    if (!kv) return false;
    kv.setItem(CSV_KEY, JSON.stringify({ ...readCsvTables(kv), [starId]: table }));
    return true;
  } catch {
    return false;
  }
}

export function getCsvTable(starId: string, kv: KeyValue | null = browser()): CsvTable | null {
  return readCsvTables(kv)[starId] ?? null;
}
