import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { customPeriod } from "@spacelog/shared/period";
import { store, useStore } from "../state/store.ts";
import { PERIOD_LABEL, PERIOD_ORDER, periodFor, periodKey, type PeriodKey } from "./periodOptions.ts";

const dot = (d: string) => d.replaceAll("-", ".");

/** 기간 선택 버튼 + 메뉴: 오늘 · 이번 주 · 이번 달 · 전체 · 직접 지정 (README 6-1). 직접 지정은 최대 1년 */
export function PeriodPicker() {
  const period = useStore((s) => s.period);
  const current = periodKey(period);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !custom) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) {
        setOpen(false);
        setCustom(false);
        if (e instanceof KeyboardEvent) e.preventDefault(); // 메뉴만 닫고 한 단계 뒤로 가지는 않는다
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, custom]);

  const choose = (key: PeriodKey) => {
    if (key === "custom") {
      setFrom(period.from);
      setTo(period.to);
      setCustom(true);
      setOpen(false);
      return;
    }
    setCustom(false);
    setOpen(false);
    void store.getState().setPeriod(periodFor(key));
  };

  const apply = () => {
    if (!from || !to) return;
    const p = customPeriod(from, to);
    if (p.to !== (from > to ? from : to)) store.getState().showToast(`최대 1년까지 볼 수 있어 ${dot(p.to)}까지로 맞췄어요`);
    void store.getState().setPeriod(p);
    setCustom(false);
  };

  return (
    <div className="period" ref={root}>
      <button
        type="button"
        className="pill-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setCustom(false);
          setOpen((v) => !v);
        }}
      >
        {current === "custom" ? `${dot(period.from)} ~ ${dot(period.to)}` : PERIOD_LABEL[current]}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <ul className="menu" role="listbox" aria-label="기간">
          {PERIOD_ORDER.map((key) => (
            <li key={key} role="presentation">
              <button type="button" role="option" aria-selected={key === current} className={`menu__item${key === current ? " is-on" : ""}`} onClick={() => choose(key)}>
                {PERIOD_LABEL[key]}
              </button>
            </li>
          ))}
        </ul>
      )}
      {custom && (
        <form
          className="menu period__form"
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <label>
            시작일
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} required />
          </label>
          <label>
            종료일
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} required />
          </label>
          <button type="submit" className="btn btn--primary">보기</button>
        </form>
      )}
    </div>
  );
}
