// CSV 읽기 (README 7장 "CSV 내용", 시안 spacelog-data.js 의 parseCsv). 한도: 12열 · 300행.
// 제품에서는 서버가 넣을 때 읽어 두는 일이라 이 파일은 시연용이다.

export const CSV_MAX_COLS = 12;
export const CSV_MAX_ROWS = 300;

export interface CsvTable {
  cols: string[];
  rows: string[][];
  /** 한도를 넘어 잘렸는지 (화면에 알려 줄 때 쓴다) */
  truncated: boolean;
}

/** CSV 글자를 열과 행으로 푼다. 따옴표 안의 쉼표·줄바꿈, BOM, \r\n 을 처리한다. 머리글 + 1행 이상이 없으면 null */
export function parseCsv(input: string): CsvTable | null {
  const text = String(input ?? "").replace(/^﻿/, "");
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const endRow = () => {
    row.push(cell);
    cell = "";
    if (row.some((v) => v.trim() !== "")) out.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += ch;
  }
  endRow();
  if (out.length < 2) return null;
  const cols = out[0].slice(0, CSV_MAX_COLS).map((c, i) => c.trim() || `열 ${i + 1}`);
  const body = out.slice(1);
  return {
    cols,
    rows: body.slice(0, CSV_MAX_ROWS).map((r) => cols.map((_, i) => (r[i] ?? "").trim())),
    truncated: out[0].length > CSV_MAX_COLS || body.length > CSV_MAX_ROWS,
  };
}

export interface ColumnInfo {
  name: string;
  index: number;
  /** 비어 있지 않은 값이 모두 숫자 */
  numeric: boolean;
  /** 서로 다른 값 수 */
  distinct: number;
  /** 1, 2, 3… 처럼 1씩 이어지는 번호 열. 대시보드에서 기본 제외한다 (README 6-4) */
  sequential: boolean;
}

const toNumber = (v: string): number | null => {
  const t = v.replace(/,/g, "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export { toNumber };

/** 열마다 숫자 열인지, 값이 몇 가지인지, 번호 열인지를 읽는다. 대시보드가 쓸 열을 고르는 기준 */
export function analyzeColumns(table: CsvTable): ColumnInfo[] {
  return table.cols.map((name, index) => {
    const values = table.rows.map((r) => r[index]).filter((v) => v !== "");
    const nums = values.map(toNumber);
    const numeric = values.length > 0 && nums.every((n) => n !== null);
    const distinct = new Set(values).size;
    const sequential = numeric && values.length > 1 && nums.every((n, i) => i === 0 || n === (nums[i - 1] as number) + 1);
    return { name, index, numeric, distinct, sequential };
  });
}
