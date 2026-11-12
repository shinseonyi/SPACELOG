// 관측소 (W-05, README 6-4): 별자리로 묶은 기록을 한곳에서 본다. 탐사선(probe/)과는 별개의 화면이다.
// 별자리 관측(대시보드 · 표 · 텍스트 · 사진)과 재발견 혜성 관측. 데이터는 시연용(web/src/demo)과 서버의 기록을 함께 쓴다.
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Orbit, Pencil, Waypoints, X } from "lucide-react";
import type { Planet, Star } from "@spacelog/shared/types";
import { api, RequestError } from "../api/client.ts";
import type { CsvTable } from "../demo/csv.ts";
import { isCsvStar, loadCsvTable, provideCsvText } from "../demo/csvSource.ts";
import { buildDashboard, COUNT_KEY, toCsv } from "../demo/dashboard.ts";
import { demo, useDemo } from "../demo/demoStore.ts";
import { DEFAULT_VIZ, type Link, type LinkViz, type VizMode } from "../demo/types.ts";
import { addedAt, preview, shortDate } from "../panel/format.ts";
import { openRediscoveredStar } from "../rediscovery/rediscovery.ts";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { starTitle } from "../ui/starTitle.ts";
import { planetLook } from "../view/look.ts";
import { cometList, withCsvSections } from "./comet.ts";
import { CometView, Dashboard_, PhotosView, TableView, TextsView, type RecordCardItem } from "./ObsViews.tsx";
import { useAllRecords } from "./useAllRecords.ts";
import "./observatory.css";

const DRAFT = "__draft";
const MODE_LABEL: Record<VizMode, string> = { dash: "시각화 대시보드", table: "표 · CSV", photos: "사진 모아보기", texts: "텍스트 모아보기" };

export function Observatory() {
  const route = useStore((s) => s.route);
  if (route.name !== "observatory") return null;
  return <Panel initialComet={!!route.comet} routeLinkId={route.linkId} />;
}

function Panel({ initialComet, routeLinkId }: { initialComet: boolean; routeLinkId?: string }) {
  const data = useAllRecords();
  const links = useDemo((s) => s.links);
  const draft = useStore((s) => s.obsDraft);
  const [mode, setMode] = useState<"link" | "comet">(initialComet ? "comet" : "link");
  const [sel, setSel] = useState<string | null>(null);
  const [draftViz, setDraftViz] = useState<LinkViz>({ ...DEFAULT_VIZ, mode: "dash" });
  const [edit, setEdit] = useState(false);
  const [le, setLe] = useState<{ name: string; memo: string } | null>(null);
  const [tables, setTables] = useState<Record<string, CsvTable | null>>({});

  const byId = useMemo(() => new Map((data?.stars ?? []).map((s) => [s.id, s])), [data]);
  const planetOf = useMemo(() => new Map((data?.planets ?? []).map((p) => [p.id, p])), [data]);
  const accentOf = (s: Star) => (planetOf.get(s.planetId) ? planetLook(planetOf.get(s.planetId) as Planet).accent : "#fff");
  const planetName = (s: Star) => planetOf.get(s.planetId)?.name ?? "";
  const subOf = (s: Star) => [planetName(s), shortDate(s.createdAtUtc), preview(s)].filter(Boolean).join(" · ");
  const open = (s: Star) => void openRediscoveredStar(s);

  // 맨 앞은 지금 고른 기록(저장 전), 그 뒤는 저장된 별자리
  const dup = !!draft && links.some((l) => l.starIds.length === draft.length && l.starIds.every((i) => draft.includes(i)));
  const draftLink: Link | null = draft && !dup ? { id: DRAFT, name: "선택한 기록", memo: "", starIds: draft, viz: draftViz, createdAtUtc: "" } : null;
  const entries = [...(draftLink ? [draftLink] : []), ...links]
    .map((l) => ({ l, ms: l.starIds.map((id) => byId.get(id)).filter((s): s is Star => !!s) }))
    .filter((o) => o.ms.length > 0);
  const has = (id?: string | null) => !!id && entries.some((o) => o.l.id === id);
  const selId = has(sel) ? (sel as string) : has(routeLinkId) ? (routeLinkId as string) : (entries[0]?.l.id ?? null);
  const cur = entries.find((o) => o.l.id === selId) ?? null;
  const isDraft = cur?.l.id === DRAFT;

  const list = useMemo(() => [...(cur?.ms ?? [])].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)), [cur]);
  const csvStars = list.filter(isCsvStar);
  // CSV 내용 읽기: 표가 아직 없는 CSV 기록만 한 번씩
  const wanted = csvStars.map((s) => s.id).filter((id) => !(id in tables)).join(",");
  useEffect(() => {
    if (!wanted) return;
    let alive = true;
    for (const id of wanted.split(",")) {
      void loadCsvTable(id).then((t) => alive && setTables((cur0) => ({ ...cur0, [id]: t })));
    }
    return () => {
      alive = false;
    };
  }, [wanted]);

  if (!data) return <Shell mode={mode} setMode={setMode}><p className="obs-note" role="status">불러오는 중…</p></Shell>;

  if (mode === "comet") {
    const { items, total } = cometList(data.stars);
    const rows = items.map((c) => ({ ...c, title: starTitle(c.star), accent: accentOf(c.star), sub: subOf(c.star) }));
    return <Shell mode={mode} setMode={setMode}><CometView rows={rows} total={total} onOpen={open} /></Shell>;
  }

  if (!cur)
    return (
      <Shell mode={mode} setMode={setMode}>
        <div className="obs-empty obs-empty--big">
          <strong>아직 별자리가 없어요.</strong>
          <span>우주의 기록 목록에서 기록을 체크해 “관측소에서 바로 보기”를 누르거나 별자리를 만들면 여기에서 묶어서 볼 수 있어요.</span>
          <Button onClick={() => store.getState().goBack()}>우주로 돌아가기</Button>
        </div>
      </Shell>
    );

  const viz: LinkViz = { agg: "avg", ...cur.l.viz };
  const setViz = (patch: Partial<LinkViz>) => (isDraft ? setDraftViz({ ...viz, ...patch }) : demo.getState().setLinkViz(cur.l.id, { ...viz, ...patch }));
  const datas = csvStars.filter((s) => tables[s.id]);
  // 내용을 읽지 못한 CSV(서버가 원본 내용을 주지 않을 때): 사용자가 같은 파일을 골라 주면 이 브라우저에서만 대시보드로 본다
  const missing = csvStars.filter((s) => s.id in tables && tables[s.id] === null);
  const chooseCsv = async (star: Star, file: File | undefined) => {
    if (!file) return;
    const table = provideCsvText(star.id, await file.text());
    if (!table) return store.getState().showToast("CSV로 읽지 못했어요. 머리글과 한 줄 이상이 있는 파일인지 확인해 주세요", "error");
    setTables((cur0) => ({ ...cur0, [star.id]: table }));
    store.getState().showToast(`‘${starTitle(star)}’ 내용을 읽었어요`, "success");
  };
  const pick = datas.find((s) => s.id === viz.csvId) ?? datas[0];
  const table = pick ? (tables[pick.id] as CsvTable) : null;
  const imgs = list.filter((s) => s.kind === "image");
  const avail: VizMode[] = [...(pick ? (["dash", "table"] as VizMode[]) : []), "photos", "texts"];
  const vmode: VizMode = avail.includes(viz.mode) ? viz.mode : avail[0];
  const dash = pick && table ? buildDashboard(table, { ...viz, mode: vmode }, pick.id) : null;
  const csvText = table ? toCsv(table) : "";
  const planetCount = new Set(list.map((s) => s.planetId)).size;
  const ids = list.map((s) => s.id);

  const setIds = (next: string[]) => {
    if (isDraft) store.setState({ obsDraft: next.length ? next : null });
    else if (next.length === 0) store.getState().showToast("별자리에는 기록이 하나는 있어야 해요. 없애려면 ‘별자리 풀기’를 누르세요");
    else demo.getState().setLinkStars(cur.l.id, next);
    if (isDraft && next.length === 0) setEdit(false);
  };
  const others = (data.stars ?? []).filter((s) => !ids.includes(s.id)).sort((a, b) => Number(isCsvStar(b)) - Number(isCsvStar(a)) || b.createdAtUtc.localeCompare(a.createdAtUtc)).slice(0, 60);
  const copy = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      store.getState().showToast(ok, "success");
    } catch {
      store.getState().showToast("복사하지 못했어요. 브라우저가 클립보드를 막았을 수 있어요", "error");
    }
  };
  const copyAi = async () => {
    try {
      const res = await api.exportCargo({ items: ids.map((starId) => ({ type: "star" as const, starId })), format: "claude" });
      await copy(withCsvSections(res.content, datas.map((s) => ({ title: starTitle(s), table: tables[s.id] as CsvTable }))), "AI용 텍스트를 복사했어요");
    } catch (e) {
      if (!(e instanceof RequestError)) throw e;
      store.getState().showToast(e.message, "error");
    }
  };
  const download = () => {
    if (!pick) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(new Blob(["﻿" + csvText], { type: "text/csv;charset=utf-8" }));
    a.href = url;
    a.download = /\.csv$/i.test(starTitle(pick)) ? starTitle(pick) : `${starTitle(pick)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    store.getState().showToast("CSV를 내려받았어요", "success");
  };

  const textItems: RecordCardItem[] = list
    .filter((s) => s.kind === "text" || isCsvStar(s))
    .map((s) => ({
      star: s,
      title: starTitle(s),
      body: s.kind === "text" ? (s.textBody || s.memo || "(내용이 저장돼 있지 않아요)") : s.memo ? `메모 · ${s.memo}` : "메모가 아직 없어요. 기록 상세에서 메모를 남기면 여기에 보입니다.",
      accent: accentOf(s),
      sub: `${planetName(s)} · ${shortDate(s.createdAtUtc)}`,
    }));
  const photoItems: RecordCardItem[] = imgs.map((s) => ({ star: s, title: starTitle(s), body: "", accent: accentOf(s), sub: `${planetName(s)} · ${shortDate(s.createdAtUtc)}${s.memo ? ` · ${s.memo}` : ""}` }));

  const saveDraft = () => {
    const id = demo.getState().addLink({ name: "", starIds: ids, viz: { ...viz, mode: vmode } });
    store.setState({ obsDraft: null });
    if (id) {
      setSel(id);
      store.getState().showToast("별자리로 저장했어요", "success");
    }
  };
  const saveLe = () => {
    if (!le || !le.name.trim()) return;
    demo.getState().editLink(cur.l.id, { name: le.name, memo: le.memo });
    setLe(null);
    store.getState().showToast("별자리를 수정했어요", "success");
  };
  const remove = () => {
    if (isDraft) {
      store.setState({ obsDraft: null });
      store.getState().showToast("선택을 비웠어요");
    } else {
      demo.getState().removeLink(cur.l.id);
      store.getState().showToast(`‘${cur.l.name}’ 별자리를 풀었어요. 기록은 그대로 있어요`);
    }
    setSel(null);
  };

  return (
    <Shell mode={mode} setMode={setMode}>
      <div className="obs-tabs" role="tablist" aria-label="별자리">
        {entries.map((o) => (
          <button key={o.l.id} type="button" role="tab" aria-selected={o.l.id === selId} className={`obs-opt${o.l.id === selId ? " is-on" : ""}`} onClick={() => { setSel(o.l.id); setLe(null); setEdit(false); }}>
            {o.l.name} <span className="obs-tabs__n">{o.ms.length}</span>
          </button>
        ))}
      </div>

      <section className="obs-card obs-head" aria-label="별자리 정보">
        <div className="obs-head__top">
          <Waypoints size={18} aria-hidden />
          <div className="obs-head__text">
            {le ? (
              <div className="obs-leform">
                <input value={le.name} maxLength={24} aria-label="별자리 이름" placeholder="별자리 이름" onChange={(e) => setLe({ ...le, name: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) saveLe(); }} />
                <textarea value={le.memo} rows={2} aria-label="관측 목적" placeholder="관측 목적: 이 기록들로 무엇을 보고 싶나요?" onChange={(e) => setLe({ ...le, memo: e.target.value })} />
                <div className="obs-actions">
                  <Button onClick={() => setLe(null)}>취소</Button>
                  <Button variant="primary" disabled={!le.name.trim()} onClick={saveLe}>저장</Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="obs-head__name">{cur.l.name}</h2>
                <p className="obs-head__meta">기록 {list.length} · CSV 데이터 {csvStars.length} · 사진 {imgs.length} · 행성 {planetCount}</p>
                {cur.l.memo && <p className="obs-head__memo">관측 목적 · {cur.l.memo}</p>}
              </>
            )}
          </div>
          {!le && (
            <div className="obs-actions">
              {isDraft ? <Button variant="primary" onClick={saveDraft}>별자리로 저장</Button> : <Button onClick={() => setLe({ name: cur.l.name, memo: cur.l.memo })}><Pencil size={14} aria-hidden /> 이름·목적 수정</Button>}
              <Button variant="ghost" onClick={remove}>{isDraft ? "선택 비우기" : "별자리 풀기"}</Button>
            </div>
          )}
        </div>

        <div className="obs-settings" data-screen-label="보기 설정">
          {datas.length > 1 && vmode !== "photos" && (
            <Group label="데이터">{datas.map((s) => <Opt key={s.id} on={s.id === pick?.id} onClick={() => setViz({ csvId: s.id })}>{starTitle(s)}</Opt>)}</Group>
          )}
          {avail.length > 1 && <Group label="보기 방식">{avail.map((m) => <Opt key={m} on={m === vmode} onClick={() => setViz({ mode: m })}>{MODE_LABEL[m]}</Opt>)}</Group>}
          {dash && vmode === "dash" && (
            <>
              {dash.catCols.length > 1 && <Group label="묶는 기준">{dash.catCols.map((c) => <Opt key={c.name} on={c.name === dash.cat.name} onClick={() => setViz({ cat: c.name })}>{c.name}</Opt>)}</Group>}
              <Group label="값">
                {dash.numCols.map((c) => <Opt key={c.name} on={c.name === dash.valKey} onClick={() => setViz({ val: c.name })}>{c.name}</Opt>)}
                <Opt on={dash.valKey === COUNT_KEY} onClick={() => setViz({ val: COUNT_KEY })}>행 수</Opt>
              </Group>
              {dash.valCol && <Group label="계산"><Opt on={dash.agg === "avg"} onClick={() => setViz({ agg: "avg" })}>평균</Opt><Opt on={dash.agg === "sum"} onClick={() => setViz({ agg: "sum" })}>합계</Opt></Group>}
              <Group label="차트 모양"><Opt on={viz.chart === "bar"} onClick={() => setViz({ chart: "bar" })}>막대</Opt><Opt on={viz.chart === "donut"} onClick={() => setViz({ chart: "donut" })}>도넛</Opt></Group>
              <Group label="쓸 열">
                {dash.columns.map((c) => (
                  <Opt key={c.name} on={!c.off} off={c.off} onClick={() => pick && setViz({ cols: { ...(viz.cols ?? {}), [pick.id]: { ...(viz.cols?.[pick.id] ?? {}), [c.name]: c.off } } })}>{c.name}</Opt>
                ))}
              </Group>
              {dash.colNote && <span className="obs-note">{dash.colNote}</span>}
            </>
          )}
        </div>
      </section>

      {missing.length > 0 && (
        <section className="obs-card obs-missing" aria-label="CSV 내용을 읽지 못한 기록">
          <strong>CSV 내용을 읽지 못해 대시보드·표로 볼 수 없어요</strong>
          <p className="obs-note">서버가 아직 CSV 파일의 내용을 주지 않아요. 같은 CSV 파일을 골라 주시면 이 브라우저에서만 대시보드와 표로 볼 수 있어요. 서버로는 올라가지 않아요.</p>
          <ul>
            {missing.map((s) => (
              <li key={s.id}>
                <span className="obs-missing__name">{starTitle(s)}</span>
                <label className="obs-pill obs-pill--file">
                  CSV 파일 고르기
                  <input type="file" accept=".csv,text/csv" onChange={(e) => { void chooseCsv(s, e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}
      {vmode === "dash" && dash && <Dashboard_ dash={dash} chart={viz.chart} />}
      {vmode === "table" && pick && table && <TableView title={starTitle(pick)} table={table} csv={csvText} />}
      {vmode === "photos" && (imgs.length > 0 || !!pick) && <PhotosView items={photoItems} onOpen={open} />}
      {vmode === "texts" && <TextsView items={textItems} onOpen={open} />}
      {!pick && imgs.length === 0 && vmode !== "texts" && missing.length === 0 && (
        <div className="obs-empty">
          <strong>이 묶음에는 대시보드로 볼 CSV 데이터나 모아 볼 사진이 없어요.</strong>
          <span>{list.some((s) => /\.csv$/i.test(s.originalName ?? "")) ? "CSV 파일이 있지만 내용을 읽지 못했어요. 서버가 원본을 주지 않으면 대시보드로 볼 수 없어요." : "CSV 파일을 기록으로 넣고 이 묶음에 포함하면, 그 데이터의 열을 기준으로 대시보드가 만들어집니다."}</span>
        </div>
      )}

      <section className="obs-card obs-records" aria-label="이 묶음의 기록">
        <div className="obs-records__head">
          <span className="obs-card__title">기록 {list.length}</span>
          <button type="button" className="obs-pill" aria-pressed={edit} onClick={() => setEdit((v) => !v)}>{edit ? "수정 완료" : "기록 수정하기"}</button>
        </div>
        <ul className="obs-rows">
          {list.map((s) => (
            <li key={s.id} className="obs-row">
              <button type="button" className="obs-row__main" onClick={() => open(s)} title="기록 상세 열기">
                <i className="obs-dot" style={{ background: accentOf(s) }} />
                <span className="obs-row__text">
                  <span className="obs-row__title">{starTitle(s)}{tables[s.id] && <b className="obs-badge">CSV</b>}</span>
                  <span className="obs-row__sub">{planetName(s)} · {addedAt(s.createdAtUtc)} {preview(s) && `· ${preview(s)}`}</span>
                </span>
              </button>
              {edit && <Button variant="ghost" aria-label={`${starTitle(s)} 빼기`} onClick={() => setIds(ids.filter((i) => i !== s.id))}><X size={14} aria-hidden /> 빼기</Button>}
            </li>
          ))}
        </ul>
        {edit && (
          <>
            <p className="obs-note">{others.length ? `더할 수 있는 기록 ${others.length}${others.length >= 60 ? " (최근 60개만 표시)" : ""}` : "더할 수 있는 기록이 없어요"}</p>
            <ul className="obs-rows">
              {others.map((s) => (
                <li key={s.id} className="obs-row">
                  <button type="button" role="checkbox" aria-checked={false} className="check" aria-label={`${starTitle(s)} 넣기`} title="체크해서 이 묶음에 넣기" onClick={() => setIds([...ids, s.id])} />
                  <span className="obs-row__text">
                    <span className="obs-row__title">{starTitle(s)}{isCsvStar(s) && <b className="obs-badge">CSV</b>}</span>
                    <span className="obs-row__sub">{subOf(s)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="obs-export">
        <p className="obs-note">{vmode === "photos" ? "사진은 미리보기용 축소본입니다. 원본은 내 PC 보관함에 그대로 있어요." : pick ? `대시보드와 CSV는 ‘${starTitle(pick)}’의 데이터입니다. 원본 파일은 내 PC 보관함에 그대로 있어요.` : "AI용 텍스트에는 이 묶음의 기록 목록이 담깁니다."}</p>
        <div className="obs-actions">
          <Button variant="primary" onClick={() => void copyAi()}><Copy size={14} aria-hidden /> AI용 텍스트 복사</Button>
          {pick && <Button onClick={() => void copy(csvText, "CSV를 복사했어요")}><Copy size={14} aria-hidden /> CSV 복사</Button>}
          {pick && <Button onClick={download}><Download size={14} aria-hidden /> CSV 내려받기</Button>}
        </div>
      </div>
    </Shell>
  );
}

function Shell({ mode, setMode, children }: { mode: "link" | "comet"; setMode(m: "link" | "comet"): void; children: React.ReactNode }) {
  return (
    <section className="obs" aria-label="관측소">
      <header className="obs-header">
        <h2 className="obs-header__title">관측소</h2>
        <div className="obs-seg" role="radiogroup" aria-label="관측 방식">
          <button type="button" role="radio" aria-checked={mode === "link"} className={mode === "link" ? "is-on" : ""} onClick={() => setMode("link")}><Waypoints size={14} aria-hidden /> 별자리 관측</button>
          <button type="button" role="radio" aria-checked={mode === "comet"} className={mode === "comet" ? "is-on" : ""} onClick={() => setMode("comet")}><Orbit size={14} aria-hidden /> 재발견 혜성 관측</button>
        </div>
        <Button className="btn--icon" aria-label="관측소 닫기" onClick={() => store.getState().goBack()}><X size={16} aria-hidden /></Button>
      </header>
      <div className="obs-body">{children}</div>
    </section>
  );
}

function Opt({ on, onClick, children, off }: { on: boolean; onClick(): void; children: string; off?: boolean }) {
  return (
    <button type="button" role="radio" aria-checked={on} className={`obs-opt${on ? " is-on" : ""}${off ? " is-off" : ""}`} onClick={onClick} title={children}>
      {children}
    </button>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="obs-setting">
      <span className="obs-setting__label">{label}</span>
      <div className="obs-setting__opts" role="radiogroup" aria-label={label}>{children}</div>
    </div>
  );
}
