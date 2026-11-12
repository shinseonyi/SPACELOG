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
  /** 비어 있지 않은 값의 80% 이상이 숫자 (시안 규칙) */
  numeric: boolean;
  /** 서로 다른 값 수 */
  distinct: number;
  /** 숫자로 읽은 값들 */
  nums: number[];
  /** 행을 구분하는 번호 열(id · no · 번호 …, 또는 값이 전부 다른 이어지는 정수). 계산·차트에서 기본으로 뺀다 (README 6-4) */
  isId: boolean;
}

export const toNumber = (v: unknown): number | null => {
  const t = String(v ?? "").trim().replace(/,/g, "");
  return t !== "" && Number.isFinite(+t) ? +t : null;
};

const ID_NAME = /^(id|_id|no|no\.|num|index|idx|번호|순번|연번)$/i;
const ID_SUFFIX = /(_id|Id|ID)$/;

/** 열마다 숫자 열인지, 값이 몇 가지인지, 번호 열인지를 읽는다. 대시보드가 쓸 열을 고르는 기준 */
export function analyzeColumns(table: CsvTable): ColumnInfo[] {
  const n = table.rows.length;
  return table.cols.map((name, index) => {
    const vals = table.rows.map((r) => r[index]).filter((v) => v !== "" && v != null);
    const nums = vals.map(toNumber).filter((x): x is number => x !== null);
    const numeric = vals.length > 0 && nums.length >= vals.length * 0.8;
    const distinct = new Set(vals.map(String)).size;
    const label = name.trim();
    const isId =
      ID_NAME.test(label) ||
      ID_SUFFIX.test(label) ||
      (numeric && n > 2 && distinct === n && nums.every(Number.isInteger) && Math.max(...nums) - Math.min(...nums) === n - 1);
    return { name, index, numeric, distinct, nums, isId };
  });
}
