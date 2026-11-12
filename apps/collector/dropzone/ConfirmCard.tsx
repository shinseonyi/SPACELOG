// 넣은 직후 확인 카드 (SPEC 1-1, POLICY 2-3·2-6, 시안 S02_Confirm).
// 행성·메모는 이번에 넣은 모든 기록에 같이 적용. 입력이 없으면 10초 후 지금 값으로 확정하고 접힌다.
// 접어도 결과는 남아, 다시 펼치면 같은 확인 화면이 보이고 "새 기록 넣기"로 빈 화면으로 돌아간다 (README 6-5).
import { useEffect, useRef, useState } from "react";
import type { PlanetOption, SaveResult } from "../main/ipcTypes.ts";
import { MEMO_MAX, cleanMemo } from "./precheck.ts";

export interface Preview {
  name: string;
  url: string | null; // 이미지면 미리보기 object URL
}

export const AUTO_CONFIRM_MS = 10_000; // SPEC 6장 S2 확정

const KIND_LABEL = { image: "이미지", file: "파일", link: "링크", text: "텍스트" } as const;
const KIND_ICON = { image: "🖼", file: "📄", link: "🔗", text: "T" } as const;

export function ConfirmCard({ result, previews, planets, revisit = false, onDone, onNew }: {
  result: SaveResult;
  previews: Preview[];
  planets: PlanetOption[];
  /** 접었다가 다시 펼친 화면: 자동으로 닫지 않고 "새 기록 넣기"를 보인다 */
  revisit?: boolean;
  onDone(): void;
  onNew(): void;
}) {
  const stars = result.stars;
  const assigned = stars[0].planetId;
  const samePlanet = stars.every((s) => s.planetId === assigned);
  const [planetId, setPlanetId] = useState<string>(samePlanet ? assigned : "");
  const [memo, setMemo] = useState("");
  const [touched, setTouched] = useState(revisit);
  const [left, setLeft] = useState(AUTO_CONFIRM_MS / 1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const memoRef = useRef<HTMLInputElement>(null);

  // 서버가 준 행성이 목록에 없으면(목록을 아직 못 받음 등) 그 행성을 "자동 배정"으로 보인다
  const options = planets.some((p) => p.id === assigned) || !samePlanet ? planets : [{ id: assigned, name: "자동 배정" }, ...planets];

  async function commit(apply: boolean) {
    if (saving) return;
    if (!apply) return onDone(); // 건너뛰기: 기본 배정 그대로
    const patch: { ids: string[]; planetId?: string; memo?: string | null } = { ids: stars.map((s) => s.id) };
    if (planetId && (!samePlanet || planetId !== assigned)) patch.planetId = planetId;
    if (memo.trim()) patch.memo = cleanMemo(memo.trim());
    if (!patch.planetId && patch.memo === undefined) return onDone();
    setSaving(true);
    const r = await window.collector.confirm(patch);
    setSaving(false);
    if (r.ok) onDone();
    else {
      setError(r.error);
      setTouched(true); // 오류를 읽을 수 있게 자동 접힘을 멈춘다
    }
  }

  // 넣기 취소: 방금 넣은 기록을 되돌린다. 서버가 못 하면 이유를 보이고 카드는 그대로 둔다
  async function cancel() {
    if (saving) return;
    setSaving(true);
    const r = await window.collector.undo(stars.map((s) => s.id));
    setSaving(false);
    if (r.ok) onNew();
    else {
      setError(r.error);
      setTouched(true);
    }
  }

  // 자동 확정: 입력·드롭다운을 건드리면 멈춘다
  useEffect(() => {
    if (touched) return;
    if (left <= 0) {
      void commit(true);
      return;
    }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, touched]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return; // 한글 조합 중 Enter는 확정이 아니다
      if (e.key === "Enter" && (e.target as HTMLElement)?.tagName === "BUTTON") return; // 버튼 위 Enter는 그 버튼대로
      if (e.key === "Enter") {
        e.preventDefault();
        void commit(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        void commit(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planetId, memo, saving]);

  // 오류 문구가 생기면 창 높이를 다시 맞춘다 (body는 overflow:hidden)
  useEffect(() => {
    window.collector.setMode("confirm", document.getElementById("card")?.scrollHeight);
  }, [error]);

  const one = stars.length === 1 ? stars[0] : null;
  const first = stars[0];
  const thumb = previews[0];
  const title = one ? one.title : `기록 ${stars.length}개를 넣었어요`;
  const sub = one ? KIND_LABEL[one.kind] : stars.map((s) => KIND_LABEL[s.kind]).filter((k, i, a) => a.indexOf(k) === i).join(" · ");
  return (
    <div className="card" id="card" role="dialog" aria-label="넣은 직후 확인">
      <div className="card-item">
        <span className="card-thumb" aria-hidden>
          {thumb?.url ? <img src={thumb.url} alt="" /> : <span>{KIND_ICON[first.kind]}</span>}
        </span>
        <div className="card-text">
          <p className="card-title" title={title}>{title}</p>
          <span className="card-sub">{sub} · 저장했어요</span>
          <i className="card-bar" />
        </div>
      </div>
      {result.lines.length > 0 && (
        <ul className="card-lines">
          {result.lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
      <label className="card-row">
        <span>행성</span>
        <select
          value={planetId}
          aria-label="배정된 행성"
          onChange={(e) => {
            setPlanetId(e.target.value);
            setTouched(true);
          }}
          onFocus={() => setTouched(true)}
        >
          {!samePlanet && <option value="">행성별 자동 배정 유지</option>}
          {options.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <p className="card-sub" style={{ padding: "0 4px" }}>새 행성은 웹에서 만들 수 있어요.</p>
      <input
        ref={memoRef}
        className="memo-in"
        value={memo}
        maxLength={MEMO_MAX}
        placeholder="한 줄 메모 (선택) · Enter로 저장"
        aria-label="한 줄 메모"
        onChange={(e) => {
          setMemo(e.target.value.replace(/[\r\n]+/g, " "));
          setTouched(true);
        }}
        onFocus={() => setTouched(true)}
      />
      {memo.length > 0 && <span className="card-sub" style={{ marginTop: -6, textAlign: "right" }}>{memo.length}/{MEMO_MAX}</span>}
      {error && (
        <p className="card-error" role="alert">
          {error}
        </p>
      )}
      <footer className="card-foot">
        {revisit ? (
          <button type="button" className="btn small" onClick={onNew} disabled={saving}>
            새 기록 넣기
          </button>
        ) : (
          <span className="card-hint">{touched ? "입력을 마치면 닫기를 누르세요" : `${left}초 후 닫혀요`}</span>
        )}
        <button type="button" className="link-btn" onClick={() => void cancel()} disabled={saving}>
          넣기 취소
        </button>
        <button type="button" className="btn small" onClick={() => void commit(true)} disabled={saving}>
          닫기
        </button>
      </footer>
    </div>
  );
}
