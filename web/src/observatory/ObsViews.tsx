// 관측소의 보기들: 대시보드 · 표 · 텍스트 모아보기 · 사진 모아보기 · 재발견 혜성 (README 6-4). 받은 값을 그리기만 한다.
import { useState } from "react";
import type { CsvTable } from "../demo/csv.ts";
import { donutGradient, type Dashboard } from "../demo/dashboard.ts";
import type { ChartKind } from "../demo/types.ts";
import { Thumbnail } from "../ui/Thumbnail.tsx";
import type { Star } from "@spacelog/shared/types";
import type { Comet } from "./comet.ts";

export function Dashboard_({ dash, chart }: { dash: Dashboard; chart: ChartKind }) {
  return (
    <div className="obs-dash" data-screen-label="CSV 대시보드">
      <div className="obs-stats">
        {dash.stats.map((s) => (
          <div key={s.key} className="obs-stat">
            <span className="obs-stat__label">{s.label}</span>
            <span className="obs-stat__value">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="obs-card obs-chart">
        <span className="obs-card__title">{dash.chartTitle}</span>
        {chart === "bar" ? (
          <div className="obs-bars">
            {dash.segs.map((b) => (
              <div key={b.key} className="obs-bar">
                <span className="obs-bar__label" title={b.label}>{b.label}</span>
                <span className="obs-bar__track"><i style={{ width: `${b.pct}%` }} /></span>
                <span className="obs-bar__value">{b.valueText}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="obs-donut-wrap">
            <div className="obs-donut" role="img" aria-label={dash.chartTitle} style={{ background: donutGradient(dash.segs) }}>
              <div className="obs-donut__hole">
                <span className="obs-donut__total">{dash.total}</span>
                <span className="obs-donut__label">{dash.totalLabel}</span>
              </div>
            </div>
            <ul className="obs-legend">
              {dash.segs.map((b) => (
                <li key={b.key}>
                  <i style={{ background: b.color }} />
                  <span className="obs-legend__name" title={b.label}>{b.label}</span>
                  <span className="obs-legend__value">{b.valueText} · {b.share}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {dash.chartNote && <span className="obs-note">{dash.chartNote}</span>}
      </div>
    </div>
  );
}

const TABLE_ROWS = 100;

export function TableView({ title, table, csv }: { title: string; table: CsvTable; csv: string }) {
  const [raw, setRaw] = useState(false);
  const rows = table.rows.slice(0, TABLE_ROWS);
  const grid = `repeat(${table.cols.length}, minmax(96px, 1fr))`;
  return (
    <div className="obs-card obs-table" data-screen-label="CSV 데이터">
      <div className="obs-table__head">
        <span className="obs-card__title">{title} · {table.rows.length.toLocaleString("ko-KR")}행{table.rows.length > TABLE_ROWS ? ` (처음 ${TABLE_ROWS}행만 표시)` : ""}</span>
        <button type="button" className="obs-pill" aria-pressed={raw} onClick={() => setRaw((v) => !v)}>{raw ? "표로 보기" : "CSV 원문 보기"}</button>
      </div>
      {raw ? (
        <pre className="obs-raw" tabIndex={0}>{csv}</pre>
      ) : (
        <div className="obs-grid-scroll">
          <div role="table" style={{ minWidth: table.cols.length * 116 + 40 }}>
            <div role="row" className="obs-grid obs-grid--head" style={{ gridTemplateColumns: grid }}>
              {table.cols.map((c, i) => <span key={i} role="columnheader" title={c}>{c}</span>)}
            </div>
            {rows.map((r, i) => (
              <div key={i} role="row" className="obs-grid" style={{ gridTemplateColumns: grid }}>
                {table.cols.map((_, j) => <span key={j} role="cell" title={r[j]}>{r[j] ?? ""}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface RecordCardItem {
  star: Star;
  title: string;
  body: string;
  accent: string;
  sub: string;
}

export function TextsView({ items, onOpen }: { items: RecordCardItem[]; onOpen(s: Star): void }) {
  if (items.length === 0)
    return (
      <div className="obs-empty">
        <strong>이 묶음에는 텍스트 기록이 없어요.</strong>
        <span>메모나 붙여 넣은 글을 기록으로 넣고 이 묶음에 포함하면 여기에 내용이 모여 보입니다.</span>
      </div>
    );
  return (
    <div className="obs-cards" data-screen-label="텍스트 모아보기">
      {items.map((x) => (
        <button key={x.star.id} type="button" className="obs-card obs-textcard" title="기록 상세 열기" onClick={() => onOpen(x.star)}>
          <span className="obs-textcard__title">{x.title}</span>
          <span className="obs-textcard__body">{x.body}</span>
          <span className="obs-textcard__sub" style={{ color: x.accent }}>{x.sub}</span>
        </button>
      ))}
    </div>
  );
}

export function PhotosView({ items, onOpen }: { items: RecordCardItem[]; onOpen(s: Star): void }) {
  if (items.length === 0)
    return (
      <div className="obs-empty">
        <strong>이 묶음에는 이미지 기록이 없어요.</strong>
        <span>이미지를 기록으로 넣고 이 묶음에 포함하면 여기에 모아 보입니다.</span>
      </div>
    );
  return (
    <div className="obs-photos" data-screen-label="사진 모아보기">
      {items.map((x) => (
        <button key={x.star.id} type="button" className="obs-card obs-photo" title="기록 상세 열기" onClick={() => onOpen(x.star)}>
          <span className="obs-photo__img" style={{ background: `color-mix(in srgb, ${x.accent} 22%, #161618)` }}><Thumbnail star={x.star} size={96} /></span>
          <span className="obs-photo__title">{x.title}</span>
          <span className="obs-photo__sub">{x.sub}</span>
        </button>
      ))}
    </div>
  );
}

export interface CometRow extends Comet {
  title: string;
  accent: string;
  sub: string;
}

export function CometView({ rows, total, onOpen }: { rows: CometRow[]; total: number; onOpen(s: Star): void }) {
  if (rows.length === 0)
    return (
      <div className="obs-empty">
        <strong>아직 다시 만날 기록이 없어요.</strong>
        <span>넣은 지 7일이 넘은 기록이 생기면 혜성이 되어 여기에 모입니다.</span>
      </div>
    );
  return (
    <div className="obs-comets" data-screen-label="재발견 혜성 관측">
      <p className="obs-note">넣은 지 7일이 넘은 기록 {total}개{total > rows.length ? ` 중 가까운 ${rows.length}개` : ""} · 가까운 날짜부터</p>
      <ul>
        {rows.map((c) => (
          <li key={c.star.id}>
            <button type="button" className="obs-comet" onClick={() => onOpen(c.star)} title="기록 상세 열기">
              <i className="obs-dot" style={{ background: c.accent }} />
              <span className="obs-comet__text">
                <span className="obs-comet__title">{c.title}{c.today && <b className="obs-badge">오늘의 재발견</b>}</span>
                <span className="obs-comet__sub">{c.sub}</span>
              </span>
              <span className="obs-comet__ago">{c.ago}일 전</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
