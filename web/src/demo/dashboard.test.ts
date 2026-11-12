import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv } from "./csv.ts";
import { applyColumnChoices, buildDashboard, COUNT_KEY, donutGradient, fmt, toCsv, TOP_N } from "./dashboard.ts";
import type { LinkViz } from "./types.ts";

const viz = (over: Partial<LinkViz> = {}): LinkViz => ({ mode: "dash", chart: "bar", ...over });
const workouts = parseCsv(
  ["id,종목,시간,칼로리", "1,러닝,60,500", "2,러닝,30,300", "3,요가,45,", "4,수영,40,350", "5,요가,15,100"].join("\n"),
)!;

test("번호 열(id)은 기본으로 끄고, 묶는 기준은 값이 2~12가지인 글자 열, 값은 첫 숫자 열", () => {
  const d = buildDashboard(workouts, viz(), "c1");
  assert.deepEqual(d.columns.map((c) => [c.name, c.off]), [["id", true], ["종목", false], ["시간", false], ["칼로리", false]]);
  assert.equal(d.cat.name, "종목");
  assert.equal(d.valKey, "시간");
  assert.equal(d.agg, "avg");
  assert.match(d.colNote, /‘id’ 열은 행 번호로 보여 계산에서 기본으로 뺐어요/);
});

test("평균: 종목별 시간 평균, 큰 순서", () => {
  const d = buildDashboard(workouts, viz(), "c1");
  assert.deepEqual(d.segs.map((s) => [s.label, s.value]), [["러닝", 45], ["수영", 40], ["요가", 30]]);
  assert.equal(d.chartTitle, "종목별 시간 평균");
  assert.equal(d.segs[0].pct, 100);
  assert.equal(d.total, "3"); // 평균일 때는 항목 수
  assert.equal(d.totalLabel, "항목");
});

test("합계와 행 수로 바꾸고, 값이 빈 행은 평균에서 뺀다", () => {
  const sum = buildDashboard(workouts, viz({ agg: "sum", val: "칼로리" }), "c1");
  assert.deepEqual(sum.segs.map((s) => [s.label, s.value]), [["러닝", 800], ["수영", 350], ["요가", 100]]); // 요가의 빈 칸은 건너뜀
  assert.equal(sum.chartTitle, "종목별 칼로리 합계");
  const avg = buildDashboard(workouts, viz({ val: "칼로리" }), "c1");
  assert.equal(avg.segs.find((s) => s.label === "요가")!.value, 100); // 빈 칸이 0으로 평균을 깎지 않는다
  const count = buildDashboard(workouts, viz({ val: COUNT_KEY }), "c1");
  assert.deepEqual(count.segs.map((s) => [s.label, s.value]), [["러닝", 2], ["요가", 2], ["수영", 1]]);
  assert.equal(count.chartTitle, "종목별 행 수");
});

test("요약 카드: 행, 열, 숫자 열 평균 2개(번호 열은 뒤로)", () => {
  const d = buildDashboard(workouts, viz(), "c1");
  assert.deepEqual(d.stats.map((s) => [s.label, s.value]), [["행", "5"], ["열", "4"], ["시간 평균", "38"], ["칼로리 평균", "312.5"]]);
});

test("쓸 열을 사용자가 바꾸면 따른다. 다시 넣은 번호 열은 안내에서 빠진다", () => {
  const on = buildDashboard(workouts, viz({ cols: { c1: { id: true, 시간: false } } }), "c1");
  assert.equal(on.columns.find((c) => c.name === "id")!.off, false);
  assert.equal(on.columns.find((c) => c.name === "시간")!.off, true);
  assert.equal(on.valKey, "칼로리"); // 시간을 껐으니 남은 숫자 열 중 번호 열이 아닌 것을 먼저 쓴다 (id 를 다시 켰어도)
  assert.match(on.colNote, /‘시간’ 열을 계산에서 뺀 상태예요/);
  assert.deepEqual(applyColumnChoices(workouts, { 종목: false }).filter((c) => c.off).map((c) => c.name), ["id", "종목"]); // id 는 기본으로 꺼져 있다
});

test("묶을 글자 열이 없으면 첫 글자 열을 행 이름으로 쓴다", () => {
  const t = parseCsv("이름,점수\n가,1\n나,2\n다,3\n라,4\n마,5\n바,6\n사,7\n아,8\n자,9\n차,10\n카,11\n타,12\n파,13")!; // 이름 13가지 → 기준 후보 아님
  const d = buildDashboard(t, viz(), "x");
  assert.equal(d.cat.name, "이름");
  assert.equal(d.segs.length, TOP_N);
  assert.match(d.chartNote, /값이 큰 순서로 12개만 그렸어요. 전체 13개는 표에서 볼 수 있어요/);
});

test("도넛 색 구간은 몫만큼 이어진다", () => {
  const d = buildDashboard(workouts, viz({ chart: "donut", agg: "sum", val: "칼로리" }), "c1");
  const g = donutGradient(d.segs);
  assert.ok(g.startsWith("conic-gradient(#2997ff 0.00% 64.00%"), g); // 800 / 1250
  assert.ok(g.endsWith("100.00%)"));
});

test("숫자 표기와 CSV 내보내기(쉼표·따옴표·줄바꿈 보존)", () => {
  assert.equal(fmt(1234.56), "1,234.6");
  assert.equal(fmt(3), "3");
  const t = { cols: ["이름", "메모"], rows: [["김, 철수", 'He said "hi"'], ["둘", "한 줄\n두 줄"]], truncated: false };
  const csv = toCsv(t);
  assert.equal(csv, '이름,메모\n"김, 철수","He said ""hi"""\n둘,"한 줄\n두 줄"');
  assert.deepEqual(parseCsv(csv)!.rows, t.rows); // 다시 읽어도 같다
});
