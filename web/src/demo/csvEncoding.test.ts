import assert from "node:assert/strict";
import test from "node:test";
import { decodeCsv, detectDelimiter, parseCsv } from "./csv.ts";

test("UTF-8 은 그대로, 한국어 엑셀의 CP949(EUC-KR) 바이트는 한글로 읽는다", () => {
  const utf8 = new TextEncoder().encode("종목,시간\n러닝,60");
  assert.equal(decodeCsv(utf8), "종목,시간\n러닝,60");
  // "한글" 의 CP949 바이트 (UTF-8 로는 읽을 수 없는 값)
  assert.equal(decodeCsv(Uint8Array.from([0xc7, 0xd1, 0xb1, 0xdb])), "한글");
  // ArrayBuffer 도 받는다 (File.arrayBuffer())
  assert.equal(decodeCsv(Uint8Array.from([0xc7, 0xd1, 0xb1, 0xdb]).buffer), "한글");
});

test("구분자: 첫 줄에서 가장 많은 쉼표·세미콜론·탭, 따옴표 안은 세지 않는다", () => {
  assert.equal(detectDelimiter("a,b,c\n1,2,3"), ",");
  assert.equal(detectDelimiter("a;b;c\n1;2;3"), ";");
  assert.equal(detectDelimiter("a\tb\tc\n1\t2\t3"), "\t");
  assert.equal(detectDelimiter('"a,b,c";d\n1;2'), ";"); // 따옴표 안의 쉼표는 구분자가 아니다
  assert.equal(detectDelimiter("한 칸짜리"), ","); // 하나도 없으면 쉼표
});

test("세미콜론·탭으로 나뉜 파일도 열과 행으로 읽는다", () => {
  assert.deepEqual(parseCsv("종목;시간;칼로리\n러닝;60;500\n요가;45;150")!.cols, ["종목", "시간", "칼로리"]);
  const tsv = parseCsv("종목\t시간\n러닝\t60\n요가\t45")!;
  assert.deepEqual([tsv.cols, tsv.rows], [["종목", "시간"], [["러닝", "60"], ["요가", "45"]]]);
  // 값 안의 쉼표는 구분자가 아니므로 그대로 남는다
  assert.deepEqual(parseCsv("이름;메모\n철수;사과, 배")!.rows, [["철수", "사과, 배"]]);
});
