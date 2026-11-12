// 오른쪽 창의 별자리 도구: 기록 목록에서 별자리 만들기, 별자리의 기록 창(보기·수정). 시안 W01_Home 의 lf* · lv* 부분 (README 6-1).
import { useMemo, useState } from "react";
import { ChevronLeft, Pencil } from "lucide-react";
import type { Star } from "@spacelog/shared/types";
import { isCsvStar } from "../demo/csvSource.ts";
import { demo } from "../demo/demoStore.ts";
import { LINK_NAME_MAX } from "../demo/links.ts";
import type { ChartKind, Link, LinkViz, VizMode } from "../demo/types.ts";
import { useAllRecords } from "../observatory/useAllRecords.ts";
import { addedAt, preview, shortDate } from "../panel/format.ts";
import { store } from "../state/store.ts";
import { planetColorToken } from "../ui/planetColor.ts";
import { starTitle } from "../ui/starTitle.ts";
import { Button } from "../ui/Button.tsx";

const accent = (token: string | undefined) => `var(--${planetColorToken(token ?? "planet-1")})`;
const MODE_LABEL: Record<VizMode, string> = { dash: "시각화 대시보드", table: "표 · CSV", photos: "사진 모아보기", texts: "텍스트 모아보기" };
const CHART_LABEL: Record<ChartKind, string> = { bar: "막대", donut: "도넛" };

/** 고른 기록으로 볼 수 있는 보기 방식 (시안: CSV 가 있으면 대시보드·표, 사진·텍스트는 늘 가능) */
export function availableModes(stars: Pick<Star, "kind" | "originalName" | "mimeType">[]): VizMode[] {
  return [...(stars.some(isCsvStar) ? (["dash", "table"] as VizMode[]) : []), ...(stars.some((s) => s.kind === "image") ? (["photos"] as VizMode[]) : []), "texts"];
}

/** 별자리 만들기 시트 (README 6-2). 이름(비우면 자동) · 관측 목적 · 보기 방식 · 차트 모양 */
export function CreateLinkSheet({ stars, onCancel, onDone }: { stars: Star[]; onCancel(): void; onDone(): void }) {
  const modes = availableModes(stars);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [mode, setMode] = useState<VizMode>(modes[0]);
  const [chart, setChart] = useState<ChartKind>("bar");
  const create = () => {
    const viz: LinkViz = { mode, chart, agg: "avg" };
    const id = demo.getState().addLink({ name, memo, starIds: stars.map((s) => s.id), viz });
    if (!id) return;
    onDone();
    store.getState().showToast("별자리로 저장했어요", "success");
    store.getState().openObservatory({ linkId: id });
  };
  return (
    <form className="lsheet" aria-label="별자리 만들기" onSubmit={(e) => { e.preventDefault(); create(); }}>
      <h3 className="lsheet__title">별자리 만들기 · 기록 {stars.length}개</h3>
      <input value={name} maxLength={LINK_NAME_MAX} aria-label="별자리 이름" placeholder="별자리 이름 (비우면 자동으로 붙여요)" onChange={(e) => setName(e.target.value)} />
      <textarea value={memo} rows={2} aria-label="관측 목적" placeholder="관측 목적: 이 기록들로 무엇을 보고 싶나요?" onChange={(e) => setMemo(e.target.value)} />
      <div className="lsheet__q">
        <span>보기 방식</span>
        <div role="radiogroup" aria-label="보기 방식">
          {modes.map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>{MODE_LABEL[m]}</button>)}
        </div>
      </div>
      {mode === "dash" && (
        <div className="lsheet__q">
          <span>차트 모양</span>
          <div role="radiogroup" aria-label="차트 모양">
            {(["bar", "donut"] as ChartKind[]).map((c) => <button key={c} type="button" role="radio" aria-checked={chart === c} className={chart === c ? "is-on" : ""} onClick={() => setChart(c)}>{CHART_LABEL[c]}</button>)}
          </div>
        </div>
      )}
      <div className="lsheet__actions">
        <Button onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary">저장하고 관측소에서 보기</Button>
      </div>
    </form>
  );
}

/** 별자리의 기록 창: 이름 · 관측 목적 · 기록 목록 · 수정 · 관측소에서 보기 (시안 lv*) */
export function LinkView({ link, onBack }: { link: Link; onBack(): void }) {
  const data = useAllRecords();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(link.name);
  const [memo, setMemo] = useState(link.memo);
  const [ids, setIds] = useState(link.starIds);
  const byId = useMemo(() => new Map((data?.stars ?? []).map((s) => [s.id, s])), [data]);
  const planetOf = useMemo(() => new Map((data?.planets ?? []).map((p) => [p.id, p])), [data]);
  const shown = (editing ? ids : link.starIds).map((id) => byId.get(id)).filter((s): s is Star => !!s);
  const others = useMemo(
    () => (data?.stars ?? []).filter((s) => !ids.includes(s.id)).sort((a, b) => Number(isCsvStar(b)) - Number(isCsvStar(a)) || b.createdAtUtc.localeCompare(a.createdAtUtc)).slice(0, 60),
    [data, ids],
  );
  const sub = (s: Star) => [planetOf.get(s.planetId)?.name ?? "", shortDate(s.createdAtUtc), preview(s)].filter(Boolean).join(" · ");
  const start = () => {
    setName(link.name);
    setMemo(link.memo);
    setIds(link.starIds);
    setEditing(true);
  };
  const save = () => {
    if (!name.trim()) return;
    if (ids.length === 0) {
      store.getState().showToast("별자리에는 기록이 하나는 있어야 해요. 없애려면 ‘별자리 풀기’를 누르세요");
      return;
    }
    demo.getState().editLink(link.id, { name, memo });
    demo.getState().setLinkStars(link.id, ids);
    setEditing(false);
    store.getState().showToast("별자리를 수정했어요", "success");
  };
  const unlink = () => {
    demo.getState().removeLink(link.id);
    store.getState().showToast(`‘${link.name}’ 별자리를 풀었어요. 기록은 그대로 있어요`);
    onBack();
  };

  return (
    <section className="card side__card side__card--list lview" aria-label="별자리 기록 목록">
      <div className="lview__head">
        <button type="button" className="lview__back" aria-label="별자리 목록으로" onClick={onBack}><ChevronLeft size={16} aria-hidden /></button>
        <span className="lview__titles">
          <span className="lview__name">{editing ? "별자리 수정" : link.name}</span>
          <span className="lview__sub">기록 {editing ? ids.length : link.starIds.length}개</span>
        </span>
      </div>
      {editing ? (
        <div className="lview__form">
          <input value={name} maxLength={LINK_NAME_MAX} aria-label="별자리 이름" placeholder="별자리 이름" onChange={(e) => setName(e.target.value)} />
          <textarea value={memo} rows={2} aria-label="관측 목적" placeholder="관측 목적: 이 기록들로 무엇을 보고 싶나요?" onChange={(e) => setMemo(e.target.value)} />
        </div>
      ) : (
        link.memo && <p className="lview__memo">{link.memo}</p>
      )}
      <ul className="rows rows--scroll">
        {shown.map((s) => (
          <li key={s.id} className="row row--rec">
            {editing && <button type="button" role="checkbox" aria-checked className="check is-on" aria-label={`${starTitle(s)} 빼기`} title="체크를 풀어 별자리에서 빼기" onClick={() => setIds(ids.filter((i) => i !== s.id))} />}
            <button type="button" className="row__main" title="기록 상세 열기" onClick={() => !editing && store.getState().openStar(s.id)} disabled={editing}>
              <i className="row__dot" style={{ background: accent(planetOf.get(s.planetId)?.colorToken) }} />
              <span className="row__text">
                <span className="row__title">{starTitle(s)}</span>
                <span className="row__sub">{sub(s)}</span>
              </span>
            </button>
          </li>
        ))}
        {editing && (
          <>
            <li className="lview__more">{others.length ? "넣을 수 있는 기록" : "더 넣을 기록이 없어요"}</li>
            {others.map((s) => (
              <li key={s.id} className="row row--rec">
                <button type="button" role="checkbox" aria-checked={false} className="check" aria-label={`${starTitle(s)} 넣기`} title="체크해서 별자리에 넣기" onClick={() => setIds([...ids, s.id])} />
                <span className="row__main">
                  <i className="row__dot" style={{ background: accent(planetOf.get(s.planetId)?.colorToken) }} />
                  <span className="row__text">
                    <span className="row__title">{starTitle(s)}</span>
                    <span className="row__sub">{addedAt(s.createdAtUtc)} · {sub(s)}</span>
                  </span>
                </span>
              </li>
            ))}
          </>
        )}
      </ul>
      <div className="side__bar side__bar--col">
        {editing ? (
          <div className="lsheet__actions">
            <Button variant="ghost" onClick={unlink}>별자리 풀기</Button>
            <Button onClick={() => setEditing(false)}>취소</Button>
            <Button variant="primary" disabled={!name.trim()} onClick={save}>저장</Button>
          </div>
        ) : (
          <>
            <Button onClick={start}><Pencil size={14} aria-hidden /> 별자리 수정하기</Button>
            <Button variant="primary" onClick={() => store.getState().openObservatory({ linkId: link.id })}>관측소에서 보기</Button>
          </>
        )}
      </div>
    </section>
  );
}
