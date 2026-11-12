import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Rocket } from "lucide-react";
import { PLANET_NAME_MAX, type Planet, type Star } from "@spacelog/shared/types";
import { api } from "../api/client.ts";
import { PERIOD_LABEL, periodFor, periodKey } from "../home/periodOptions.ts";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { ConfirmDialog } from "../ui/ConfirmDialog.tsx";
import { KindIcon } from "../ui/KindIcon.tsx";
import { SidePanel } from "../ui/SidePanel.tsx";
import { starTitle } from "../ui/starTitle.ts";
import { planetLook } from "../view/look.ts";
import { addedAt, preview } from "./format.ts";
import { useRangeCounts, type RangeKey } from "./useRangeCounts.ts";
import { useSave } from "./useSave.ts";
import "./panel.css";

const RANGES: RangeKey[] = ["today", "week", "month", "all"];
type Sheet = null | "create" | "rename" | "merge";

/** 행성 패널 (README 6-2). 행성 수정(색·모양)과 별자리 구역은 5~7단계에서 붙인다 */
export function PlanetPanel({ planetId }: { planetId: string }) {
  const planet = useStore((s) => s.planets.find((p) => p.id === planetId));
  const planets = useStore((s) => s.planets);
  const allStars = useStore((s) => s.stars);
  const period = useStore((s) => s.period);
  const stars = useMemo(() => allStars.filter((s) => s.planetId === planetId).sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)), [allStars, planetId]);
  const counts = useRangeCounts(planetId, planet?.starCountTotal, allStars.length);
  const active = periodKey(period);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirm, setConfirm] = useState<null | "merge" | "delete">(null);
  const [mergeTo, setMergeTo] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const { busy, run } = useSave();
  const menuRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSheet(null);
    setConfirm(null);
    setPicked([]);
    setMenu(false);
  }, [planetId]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRoot.current?.contains(e.target as Node)) {
        setMenu(false);
        if (e instanceof KeyboardEvent) e.preventDefault(); // 메뉴만 닫고 한 단계 뒤로 가지는 않는다
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  if (!planet) return null;
  const look = planetLook(planet);
  const system = planet.system !== null;
  const total = planet.starCountTotal ?? 0;
  const others = planets.filter((p) => p.id !== planetId);
  const alive = picked.filter((id) => stars.some((s) => s.id === id));
  const toggle = (id: string) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const load = () => {
    const { addToCargo, showToast } = store.getState();
    const added = alive.filter((starId) => addToCargo({ type: "star", starId })).length;
    showToast(added === alive.length ? `기록 ${added}개를 탐사선에 실었어요` : `${added}개를 실었어요. 나머지는 이미 실려 있어요`, "success");
    setPicked([]);
  };
  const loadPlanet = () => {
    const ok = store.getState().addToCargo({ type: "planet", planetId, period });
    store.getState().showToast(ok ? `‘${planet.name}’ 행성을 탐사선에 실었어요` : "이미 실은 행성이에요", ok ? "success" : "info");
  };

  return (
    <SidePanel
      title={
        <span className="ppanel__title">
          <span className="ppanel__name">{planet.name}</span>
          <span className="chipcount" style={{ color: look.accent }}>{look.unit} {total}</span>
        </span>
      }
      onClose={() => store.getState().closePanel()}
      headerExtra={
        <div className="ppanel__menu" ref={menuRoot}>
          <Button className="btn--icon" aria-label="행성 메뉴" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}><MoreHorizontal size={16} aria-hidden /></Button>
          {menu && (
            <ul className="menu" role="menu">
              <MenuItem label="새 행성 만들기" onPick={() => { setMenu(false); setSheet("create"); }} />
              <MenuItem label="이름 바꾸기" disabled={system} hint="미분류는 이름을 바꿀 수 없어요" onPick={() => { setMenu(false); setSheet("rename"); }} />
              <MenuItem label="다른 행성에 합치기" disabled={system || others.length === 0} hint={system ? "미분류는 합칠 수 없어요" : "합칠 행성이 없어요"} onPick={() => { setMenu(false); setMergeTo(others[0]?.id ?? ""); setSheet("merge"); }} />
              <MenuItem label="빈 행성 삭제" disabled={system || total > 0} hint={system ? "미분류는 삭제할 수 없어요" : "기록이 있는 행성은 삭제할 수 없어요"} onPick={() => { setMenu(false); setConfirm("delete"); }} />
            </ul>
          )}
        </div>
      }
      footer={
        alive.length > 0 ? (
          <div className="pfoot">
            <Button variant="primary" onClick={load}><Rocket size={16} aria-hidden /> 탐사선에 싣기 · {alive.length}</Button>
            <Button variant="ghost" onClick={() => setPicked([])}>해제</Button>
          </div>
        ) : total > 0 ? (
          <Button onClick={loadPlanet}><Rocket size={16} aria-hidden /> 행성 전체를 탐사선에 싣기</Button>
        ) : undefined
      }
    >
      {sheet === "create" && (
        <NameSheet
          title="새 행성 만들기"
          submitLabel="만들기"
          planets={planets}
          busy={busy}
          onCancel={() => setSheet(null)}
          onSubmit={async (name) => {
            if (await run(() => api.createPlanet(name), `‘${name}’ 행성을 만들었어요`)) {
              setSheet(null);
              await store.getState().refresh();
            }
          }}
        />
      )}
      {sheet === "rename" && (
        <NameSheet
          title="이름 바꾸기"
          submitLabel="바꾸기"
          initial={planet.name}
          self={planet.id}
          planets={planets}
          busy={busy}
          onCancel={() => setSheet(null)}
          onSubmit={async (name) => {
            if (await run(() => api.renamePlanet(planet.id, name), "이름을 바꿨어요")) {
              setSheet(null);
              await store.getState().refresh();
            }
          }}
        />
      )}
      {sheet === "merge" && (
        <section className="sheet" aria-label="행성 합치기">
          <h3 className="sheet__title">다른 행성에 합치기</h3>
          <label className="field">
            합칠 행성
            <select value={mergeTo} onChange={(e) => setMergeTo(e.target.value)}>
              {others.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="sheet__actions">
            <Button onClick={() => setSheet(null)}>취소</Button>
            <Button variant="primary" disabled={!mergeTo} onClick={() => setConfirm("merge")}>합치기</Button>
          </div>
        </section>
      )}

      {system && <p className="note">미분류에는 아직 정하지 못한 기록이 모여요.</p>}
      {look.shape === "nebula" && <p className="note">아직 구체화되지 않은 아이디어를 조각으로 남기는 곳이에요.</p>}

      <h3 className="plist__title">{PERIOD_LABEL[active === "custom" ? "custom" : active]} 넣은 {look.unit} {stars.length}</h3>
      {stars.length === 0 ? (
        <p className="empty-note">
          {total === 0 ? "아직 기록이 없어요. 수집 앱의 드롭존에 파일·링크·글을 끌어다 놓아 보세요." : "이 기간에 넣은 기록이 없어요. 아래에서 기간을 넓혀 보세요."}
        </p>
      ) : (
        <ul className="plist">
          {stars.map((s) => <StarRow key={s.id} star={s} planet={planet} checked={alive.includes(s.id)} onToggle={() => toggle(s.id)} />)}
        </ul>
      )}

      <div className="prange" role="group" aria-label="보는 기간">
        {RANGES.map((k) => (
          <button key={k} type="button" className={active === k ? "is-on" : ""} aria-pressed={active === k} onClick={() => void store.getState().setPeriod(periodFor(k))}>
            {PERIOD_LABEL[k]}
            {counts[k] !== undefined && <span className="prange__n">{counts[k]}</span>}
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={confirm === "merge"}
        title="행성 합치기"
        message={`‘${planet.name}’ 행성의 기록 ${total}개가 ‘${others.find((p) => p.id === mergeTo)?.name ?? ""}’ 행성으로 옮겨지고, ‘${planet.name}’ 행성은 사라져요.`}
        confirmLabel="합치기"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (await run(() => api.mergePlanet(planet.id, mergeTo), "행성을 합쳤어요")) {
            setConfirm(null);
            setSheet(null);
            store.getState().planetMerged(planet.id, mergeTo);
          }
        }}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="빈 행성 삭제"
        message={`‘${planet.name}’ 행성을 삭제할까요? 기록이 없는 행성만 삭제할 수 있고, 되돌릴 수 없어요.`}
        confirmLabel="삭제하기"
        danger
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (await run(() => api.deletePlanet(planet.id), "행성을 삭제했어요")) {
            setConfirm(null);
            store.getState().planetDeleted(planet.id);
          }
        }}
      />
    </SidePanel>
  );
}

function MenuItem({ label, onPick, disabled, hint }: { label: string; onPick(): void; disabled?: boolean; hint?: string }) {
  return (
    <li role="presentation">
      <button type="button" role="menuitem" className="menu__item" disabled={disabled} title={disabled ? hint : undefined} onClick={onPick}>
        {label}
      </button>
    </li>
  );
}

function StarRow({ star, planet, checked, onToggle }: { star: Star; planet: Planet; checked: boolean; onToggle(): void }) {
  const text = preview(star);
  return (
    <li className={`prow${checked ? " is-picked" : ""}`}>
      <button type="button" role="checkbox" aria-checked={checked} aria-label={`${starTitle(star)} 선택`} className={`check${checked ? " is-on" : ""}`} onClick={onToggle} />
      <button type="button" className="prow__main" onClick={() => store.getState().openStar(star.id)}>
        <span className="prow__icon" style={{ color: planetLook(planet).accent }}><KindIcon kind={star.kind} size={16} /></span>
        <span className="prow__text">
          <span className="prow__title">{starTitle(star)}</span>
          <span className="prow__sub">{addedAt(star.createdAtUtc)}{text && ` · ${text}`}</span>
        </span>
      </button>
    </li>
  );
}

/** 이름 입력 시트 (새 행성 · 이름 바꾸기). 이름은 1~20자, 대소문자 무시로 같은 이름이 없어야 한다 (POLICY 2-4) */
function NameSheet({ title, submitLabel, initial = "", self, planets, busy, onCancel, onSubmit }: {
  title: string;
  submitLabel: string;
  initial?: string;
  self?: string;
  planets: Planet[];
  busy: boolean;
  onCancel(): void;
  onSubmit(name: string): void;
}) {
  const [name, setName] = useState(initial);
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const dup = planets.some((p) => p.id !== self && p.name.toLowerCase() === trimmed.toLowerCase());
  const error = !trimmed ? "이름을 입력해 주세요" : dup ? "같은 이름의 행성이 있어요" : "";
  const ok = !error && trimmed !== initial;
  return (
    <form className="sheet" aria-label={title} onSubmit={(e) => { e.preventDefault(); if (ok) onSubmit(trimmed); }}>
      <h3 className="sheet__title">{title}</h3>
      <label className="field">
        행성 이름
        <input value={name} maxLength={PLANET_NAME_MAX} autoFocus onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !!error} />
      </label>
      {touched && error && <p className="field__error" role="alert">{error}</p>}
      <div className="sheet__actions">
        <Button onClick={onCancel}>취소</Button>
        <Button type="submit" variant="primary" disabled={!ok || busy}>{submitLabel}</Button>
      </div>
    </form>
  );
}
