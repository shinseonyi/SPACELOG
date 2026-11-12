import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight, Pencil, Waypoints, X } from "lucide-react";
import type { Star } from "@spacelog/shared/types";
import { demo, useDemo } from "../demo/demoStore.ts";
import { LinkView } from "./LinkSheets.tsx";
import { PickedTools } from "./PickedTools.tsx";
import { store, useStore } from "../state/store.ts";
import { planetColorToken } from "../ui/planetColor.ts";
import { starTitle } from "../ui/starTitle.ts";
import { useSceneState } from "../universe/sceneState.ts";
import { NARROW_QUERY, useMedia } from "../ui/useMedia.ts";

const time = (iso: string) => new Date(iso).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });
const accent = (token: string) => `var(--${planetColorToken(token)})`;

/**
 * 오른쪽 창 (폭 300px, right 24 · top 88). 위 칩에서 고른 목록 하나만 연다. 행성 패널·기록 상세가 열리면 숨긴다.
 * 행성 줄을 누르면 날아가 패널을 연다 (SPEC 1-4, POLICY 2-5): 0개 행성은 흐리게, 날아가지 않고 패널만.
 */
/**
 * 가장 좁은 화면(480px 이하)에서는 오른쪽 창의 카드를 모두 접어 두고, 제목을 눌러 펼친다. 넓은 화면에서는 늘 펼침.
 * open = 지금 내용을 보일지
 */
function useFold(): { narrow: boolean; open: boolean; toggle(): void } {
  const narrow = useMedia(NARROW_QUERY);
  const [unfolded, setUnfolded] = useState(false);
  return { narrow, open: !narrow || unfolded, toggle: () => setUnfolded((v) => !v) };
}

/** 카드 제목. 좁은 화면에서는 접기 · 펼치기 버튼(▾) */
function CardTitle({ title, fold, className = "" }: { title: string; fold: ReturnType<typeof useFold>; className?: string }) {
  if (!fold.narrow) return <h2 className={`side__title ${className}`.trim()}>{title}</h2>;
  return (
    <h2 className={`side__title side__title--fold ${className}`.trim()}>
      <button type="button" className="side__fold" aria-expanded={fold.open} onClick={fold.toggle}>
        <span>{title}</span>
        <ChevronDown size={16} aria-hidden className={fold.open ? "is-open" : undefined} />
      </button>
    </h2>
  );
}

export function SideWindow() {
  const tab = useStore((s) => s.sideTab);
  const hidden = useStore((s) => s.selectedPlanetId !== null || s.selectedStarId !== null);
  if (!tab || hidden) return null;
  return (
    <aside className={`side${tab === "home" ? " side--home" : ""}`} aria-label={tab === "home" ? "행성 · 별자리 · 기록 목록" : tab === "planet" ? "행성 목록" : tab === "rec" ? "기록 목록" : "별자리 목록"}>
      {tab === "home" && (
        <>
          <PlanetCard closable />
          <LinkQuickCard />
          <RecordCard />
        </>
      )}
      {tab === "planet" && <PlanetCard />}
      {tab === "planet" && <LinkQuickCard />}
      {tab === "rec" && <RecordCard />}
      {tab === "link" && <LinkCard />}
    </aside>
  );
}

function PlanetCard({ closable = false }: { closable?: boolean }) {
  const planets = useStore((s) => s.planets);
  const selected = useStore((s) => s.selectedPlanetId);
  const near = useSceneState((s) => s.nearPlanetId);
  const sorted = [...planets].sort((a, b) => Number(!!a.system) - Number(!!b.system) || (b.starCountInPeriod ?? 0) - (a.starCountInPeriod ?? 0));
  const fold = useFold();
  return (
    <section className={`card side__card side__card--planets${fold.open ? "" : " is-folded"}`}>
      <div className="side__head">
        <CardTitle title="행성으로 바로 날아가기" fold={fold} />
        {closable && (
          <button type="button" className="btn btn--icon side__close" aria-label="목록 닫기" title="목록 닫기 (위 태그로 다시 열기)" onClick={() => store.getState().closeSide()}>
            <X size={14} aria-hidden />
          </button>
        )}
      </div>
      {fold.open && <ul className="rows rows--scroll">
        {sorted.map((p) => {
          const n = p.starCountInPeriod ?? 0;
          const here = p.id === near || p.id === selected;
          return (
            <li key={p.id}>
              <button
                type="button"
                className={`row${here ? " is-here" : ""}${n === 0 ? " is-empty" : ""}`}
                aria-current={p.id === selected ? "true" : undefined}
                onClick={() => (n > 0 ? store.getState().flyToPlanet(p.id, "openPanel") : store.getState().openPanel(p.id))}
              >
                <i className="row__dot" style={{ background: accent(p.colorToken) }} />
                <span className="row__name">{p.name}</span>
                <span className="row__n" style={{ color: accent(p.colorToken) }}>{n}</span>
                <ArrowUpRight size={14} aria-hidden className="row__go" />
              </button>
            </li>
          );
        })}
      </ul>}
    </section>
  );
}

function RecordCard() {
  const stars = useStore((s) => s.stars);
  const planets = useStore((s) => s.planets);
  const label = useStore((s) => (s.period.preset === "today" ? "오늘" : s.period.preset === "week" ? "이번 주" : "이 기간"));
  const [mode, setMode] = useState<"all" | "planet">("all");
  const picked = useStore((s) => s.picked); // 전역 선택: 다른 행성·패널로 옮겨도 유지된다
  const planetOf = useMemo(() => new Map(planets.map((p) => [p.id, p])), [planets]);
  const rows = useMemo(() => [...stars].sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)), [stars]);
  const fold = useFold();

  const row = (s: Star) => {
    const planet = planetOf.get(s.planetId);
    const on = picked.includes(s.id);
    return (
      <li key={s.id} className={`row row--rec${on ? " is-picked" : ""}`}>
        <button type="button" role="checkbox" aria-checked={on} aria-label={`${starTitle(s)} 선택`} className={`check${on ? " is-on" : ""}`} onClick={() => store.getState().togglePicked(s.id)} />
        <button type="button" className="row__main" onClick={() => store.getState().openStar(s.id)}>
          <i className="row__dot" style={{ background: accent(planet?.colorToken ?? "planet-1") }} />
          <span className="row__text">
            <span className="row__title">{starTitle(s)}</span>
            <span className="row__sub">{planet?.name ?? "행성"} · {time(s.createdAtUtc)}</span>
          </span>
        </button>
      </li>
    );
  };

  return (
    <section className={`card side__card side__card--list${fold.open ? "" : " is-folded"}`}>
      <CardTitle title={`${label} 기록 ${stars.length}`} fold={fold} />
      {fold.open && (<>
      <div className="seg2" role="radiogroup" aria-label="목록 보기 방식">
        {(["all", "planet"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "is-on" : ""} onClick={() => setMode(m)}>
            {m === "all" ? "전체 보기" : "행성별 보기"}
          </button>
        ))}
      </div>
      {stars.length === 0 ? (
        <p className="side__empty">이 기간에 넣은 기록이 없어요.</p>
      ) : (
        <ul className="rows rows--scroll">
          {mode === "all"
            ? rows.map(row)
            : planets
                .map((p) => ({ p, own: rows.filter((s) => s.planetId === p.id) }))
                .filter((g) => g.own.length > 0)
                .map((g) => (
                  <li key={g.p.id} className="group">
                    <span className="group__title" style={{ color: accent(g.p.colorToken) }}>{g.p.name} · {g.own.length}</span>
                    <ul className="rows">{g.own.map(row)}</ul>
                  </li>
                ))}
        </ul>
      )}
      </>)}
      <PickedTools />
    </section>
  );
}

const QUICK_MAX = 5;

/**
 * 행성 목록 아래 "별자리 바로 보기" (시안 W01 별자리 카드). 별자리가 있을 때만.
 * 체크 = 그 별자리를 우주에 선으로 잇기(행성끼리). 이름을 누르면 그 별자리의 기록 창. 5개까지, 나머지는 위의 별자리 태그에서
 */
function LinkQuickCard() {
  const links = useDemo((s) => s.links);
  const hidden = useDemo((s) => s.hiddenLinkIds);
  const fold = useFold();
  if (links.length === 0) return null;
  return (
    <section className={`card side__card lquick${fold.open ? "" : " is-folded"}`} aria-label="별자리 바로 보기">
      <CardTitle title="별자리 바로 보기" fold={fold} className="lquick__title" />
      {fold.open && (<>
      <p className="side__note">체크한 별자리만 우주에 선으로 보여요</p>
      <ul className="rows lquick__rows">
        {links.slice(0, QUICK_MAX).map((l) => {
          const shown = !hidden.includes(l.id);
          return (
            <li key={l.id} className="lquick__row">
              <button type="button" role="checkbox" aria-checked={shown} aria-label={`${l.name} 우주에 선으로 ${shown ? "숨기기" : "보이기"}`} title="우주에 선으로 보이기 · 숨기기" className={`check${shown ? " is-on" : ""}`} onClick={() => demo.getState().toggleLinkShown(l.id)} />
              <button type="button" className="lquick__open" title="별자리의 기록 보기" onClick={() => store.getState().openLinkView(l.id)}>
                <span className="lquick__name">{l.name}</span>
                <span className="lquick__n">기록 {l.starIds.length}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {links.length > QUICK_MAX && <p className="side__note lquick__more">외 {links.length - QUICK_MAX}개는 위의 별자리 태그에서 볼 수 있어요</p>}
      </>)}
    </section>
  );
}

/**
 * 별자리 목록 (시안 W01 "별자리 목록"). 줄 = 별자리 아이콘 · 이름 · "기록 N · 관측 목적" · ＞(눌러서 그 별자리의 기록 창).
 * 오른쪽 연필을 누르면 그 줄 아래에서 바로 고친다: 이름 · 관측 목적 · 우주에 선 보이기 · [별자리 풀기] [취소] [저장].
 */
function LinkCard() {
  const links = useDemo((s) => s.links);
  const hidden = useDemo((s) => s.hiddenLinkIds);
  const viewId = useStore((s) => s.linkViewId);
  const [editId, setEditId] = useState<string | null>(null);
  const fold = useFold();
  const viewing = links.find((l) => l.id === viewId);
  if (viewing) return <LinkView key={viewing.id} link={viewing} onBack={() => store.getState().openLinkView(null)} />;
  return (
    <section className={`card side__card${fold.open ? "" : " is-folded"}`}>
      <div className="side__head">
        <CardTitle title={`별자리 목록(${links.length})`} fold={fold} />
        <button type="button" className="btn btn--icon" aria-label="별자리 목록 닫기" onClick={() => store.getState().toggleSideTab("link")}>
          <X size={14} aria-hidden />
        </button>
      </div>
      {!fold.open ? null : links.length === 0 ? (
        <p className="side__empty">아직 별자리가 없어요. 기록을 체크해 별자리를 만들면 여기에 모입니다.</p>
      ) : (
        <ul className="rows lmenu">
          {links.map((l) => (
            <li key={l.id} className={`lmenu__item${editId === l.id ? " is-editing" : ""}`}>
              <div className="lmenu__row">
                <button type="button" className="lmenu__open" title="별자리의 기록 보기" onClick={() => store.getState().openLinkView(l.id)}>
                  <Waypoints size={16} aria-hidden className="lmenu__icon" />
                  <span className="row__text">
                    <span className="row__title">{l.name}</span>
                    <span className="row__sub">기록 {l.starIds.length}{l.memo ? ` · ${l.memo}` : ""}{hidden.includes(l.id) ? " · 선 숨김" : ""}</span>
                  </span>
                  <ChevronRight size={14} aria-hidden className="lmenu__chev" />
                </button>
                <button type="button" className="lmenu__edit" aria-label={`${l.name} 별자리 수정`} aria-expanded={editId === l.id} title="별자리 수정" onClick={() => setEditId(editId === l.id ? null : l.id)}>
                  <Pencil size={14} aria-hidden />
                </button>
              </div>
              {editId === l.id && <LinkInlineEdit link={l} shown={!hidden.includes(l.id)} onDone={() => setEditId(null)} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 별자리 목록 안에서 바로 고치기 (시안 W01 lkEdit) */
function LinkInlineEdit({ link, shown, onDone }: { link: { id: string; name: string; memo: string }; shown: boolean; onDone(): void }) {
  const [name, setName] = useState(link.name);
  const [memo, setMemo] = useState(link.memo ?? "");
  const [show, setShow] = useState(shown);
  const save = () => {
    if (!name.trim()) return;
    demo.getState().editLink(link.id, { name: name.trim(), memo });
    if (show !== shown) demo.getState().toggleLinkShown(link.id);
    store.getState().showToast("별자리를 수정했어요", "success");
    onDone();
  };
  const remove = () => {
    demo.getState().removeLink(link.id);
    store.getState().showToast(`‘${link.name}’ 별자리를 풀었어요. 기록은 그대로 있어요`);
    onDone();
  };
  const key = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // 우주 비행 키로 가지 않게
    if (e.key === "Escape") onDone();
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.currentTarget.tagName === "INPUT") save();
  };
  return (
    <div className="lmenu__form">
      <input value={name} maxLength={24} autoFocus aria-label="별자리 이름" placeholder="별자리 이름" onChange={(e) => setName(e.target.value)} onKeyDown={key} />
      <textarea value={memo} rows={2} aria-label="관측 목적" placeholder="관측 목적: 이 기록들로 무엇을 보고 싶나요?" onChange={(e) => setMemo(e.target.value)} onKeyDown={key} />
      <label className="lmenu__show">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        우주에 선으로 보이기
      </label>
      <div className="lmenu__actions">
        <button type="button" className="lmenu__remove" onClick={remove}>별자리 풀기</button>
        <span />
        <button type="button" className="lmenu__btn" onClick={onDone}>취소</button>
        <button type="button" className="lmenu__btn lmenu__btn--primary" disabled={!name.trim()} onClick={save}>저장</button>
      </div>
    </div>
  );
}
