// CSV 대시보드 계산 (README 6-4, 시안 W05_Observatory.dc.html). 화면 없이 숫자만 다뤄 테스트한다. AI 는 쓰지 않고 규칙만 쓴다.
import { analyzeColumns, toNumber, type ColumnInfo, type CsvTable } from "./csv.ts";
import type { Aggregate, LinkViz } from "./types.ts";

/** 차트 색 (design/W05 TONES). 막대는 단색, 도넛은 이 순서로 */
export const TONES = ["#2997ff", "#f5f5f7", "#a1a1a6", "#6e6e73", "#d2d2d7", "#8e8e93", "#48484a"];
export const TOP_N = 12;
export const COUNT_KEY = "__count";

export const fmt = (v: number): string => (Math.round(v * 10) / 10).toLocaleString("ko-KR");

export interface DashColumn extends ColumnInfo {
  /** 계산에서 뺀 열 (번호 열은 기본으로 끔) */
  off: boolean;
}

export interface Seg {
  key: string;
  label: string;
  value: number;
  valueText: string;
  /** 가장 큰 값 대비 막대 길이 (0~100) */
  pct: number;
  /** 도넛에서 차지하는 몫 (%) */
  share: number;
  color: string;
}

export interface Stat {
  key: string;
  label: string;
  value: string;
}

export interface Dashboard {
  columns: DashColumn[];
  numCols: DashColumn[];
  catCols: DashColumn[];
  cat: DashColumn;
  /** 값 열 이름 또는 COUNT_KEY(행 수) */
  valKey: string;
  valCol: DashColumn | null;
  agg: Aggregate;
  segs: Seg[];
  stats: Stat[];
  chartTitle: string;
  chartNote: string;
  total: string;
  totalLabel: string;
  /** 번호 열을 자동으로 뺐거나 사용자가 뺀 열을 알리는 안내 */
  colNote: string;
}

/** 열 켜기·끄기 상태를 적용한 열 목록. 사용자가 정한 값이 있으면 그것을, 없으면 번호 열만 끈다 */
export function applyColumnChoices(table: CsvTable, overrides: Record<string, boolean> = {}): DashColumn[] {
  return analyzeColumns(table).map((c) => ({ ...c, off: c.name in overrides ? !overrides[c.name] : c.isId }));
}

export function buildDashboard(table: CsvTable, viz: LinkViz, csvId: string): Dashboard {
  const overrides = viz.cols?.[csvId] ?? {};
  const columns = applyColumnChoices(table, overrides);
  const numCols = columns.filter((c) => c.numeric && !c.off);
  let catCols = columns.filter((c) => !c.numeric && !c.off && c.distinct >= 2 && c.distinct <= TOP_N);
  // 묶을 글자 열이 없으면 첫 글자 열(없으면 첫 열)을 행 이름으로 쓴다
  if (catCols.length === 0) catCols = [columns.find((c) => !c.numeric && !c.off) ?? columns.find((c) => !c.off) ?? columns[0]];
  const cat = catCols.find((c) => c.name === viz.cat) ?? catCols[0];
  const firstValue = numCols.find((c) => !c.isId) ?? numCols[0];
  const valKey = viz.val === COUNT_KEY || numCols.some((c) => c.name === viz.val) ? (viz.val as string) : (firstValue?.name ?? COUNT_KEY);
  const valCol = numCols.find((c) => c.name === valKey) ?? null;
  const agg: Aggregate = viz.agg === "sum" ? "sum" : "avg";

  const groups = new Map<string, { sum: number; n: number; rows: number }>();
  for (const r of table.rows) {
    const k = String(r[cat.index] ?? "");
    if (k === "") continue;
    const g = groups.get(k) ?? { sum: 0, n: 0, rows: 0 };
    g.rows++;
    if (valCol) {
      const n = toNumber(r[valCol.index]);
      if (n !== null) {
        g.sum += n;
        g.n++;
      }
    }
    groups.set(k, g);
  }
  const all = [...groups].map(([k, g]) => ({ k, v: valCol ? (agg === "sum" ? g.sum : g.n ? g.sum / g.n : 0) : g.rows })).sort((a, b) => b.v - a.v);
  const top = all.slice(0, TOP_N);
  const max = Math.max(1e-9, ...top.map((x) => x.v));
  const tot = top.reduce((a, x) => a + Math.max(0, x.v), 0) || 1;
  const segs: Seg[] = top.map((x, i) => ({
    key: x.k,
    label: x.k,
    value: x.v,
    valueText: fmt(x.v),
    pct: Math.max(0, (x.v / max) * 100),
    share: Math.round((Math.max(0, x.v) / tot) * 100),
    color: TONES[i % TONES.length],
  }));

  const average = (c: DashColumn) => c.nums.reduce((a, b) => a + b, 0) / c.nums.length;
  const statCols = [...numCols.filter((c) => !c.isId), ...numCols.filter((c) => c.isId)].slice(0, 2);
  const stats: Stat[] = [
    { key: "rows", label: "행", value: table.rows.length.toLocaleString("ko-KR") },
    { key: "cols", label: "열", value: String(table.cols.length) },
    ...statCols.map((c) => ({ key: c.name, label: `${c.name} 평균`, value: fmt(average(c)) })),
  ];

  const autoOff = columns.filter((c) => c.off && c.isId && !(c.name in overrides));
  const offAll = columns.filter((c) => c.off);
  const names = (cs: DashColumn[]) => `‘${cs.map((c) => c.name).join("’, ‘")}’`;
  return {
    columns,
    numCols,
    catCols,
    cat,
    valKey,
    valCol,
    agg,
    segs,
    stats,
    chartTitle: `${cat.name}별 ${valCol ? valCol.name + (agg === "sum" ? " 합계" : " 평균") : "행 수"}`,
    chartNote: all.length > top.length ? `값이 큰 순서로 ${top.length}개만 그렸어요. 전체 ${all.length}개는 표에서 볼 수 있어요.` : "",
    total: valCol && agg === "avg" ? String(top.length) : fmt(tot),
    totalLabel: valCol && agg === "avg" ? "항목" : valCol ? `${valCol.name} 합계` : "행",
    colNote: autoOff.length
      ? `${names(autoOff)} 열은 행 번호로 보여 계산에서 기본으로 뺐어요. ‘쓸 열’에서 눌러 다시 넣거나 다른 열을 뺄 수 있어요.`
      : offAll.length
        ? `${names(offAll)} 열을 계산에서 뺀 상태예요. ‘쓸 열’에서 눌러 다시 넣을 수 있어요.`
        : "",
  };
}

/** 도넛 차트의 conic-gradient 값 */
export function donutGradient(segs: Seg[]): string {
  const tot = segs.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
  let acc = 0;
  return `conic-gradient(${segs
    .map((s) => {
      const from = (acc / tot) * 100;
      acc += Math.max(0, s.value);
      return `${s.color} ${from.toFixed(2)}% ${((acc / tot) * 100).toFixed(2)}%`;
    })
    .join(", ")})`;
}

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 표 → CSV 글자 (복사·내려받기·AI용 텍스트). 따옴표·쉼표·줄바꿈은 다시 감싼다 */
export function toCsv(table: CsvTable): string {
  return [table.cols, ...table.rows].map((r) => r.map(esc).join(",")).join("\n");
}
