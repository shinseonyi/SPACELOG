import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FolderOpen, Rocket, Trash2 } from "lucide-react";
import type { Star } from "@spacelog/shared/types";
import { api, requestObjectUrl, RequestError } from "../api/client.ts";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { ConfirmDialog } from "../ui/ConfirmDialog.tsx";
import { KindIcon } from "../ui/KindIcon.tsx";
import { SidePanel } from "../ui/SidePanel.tsx";
import { starTitle } from "../ui/starTitle.ts";
import { Thumbnail } from "../ui/Thumbnail.tsx";
import { planetLook } from "../view/look.ts";
import { addedAt, fileSize } from "./format.ts";
import { useSave } from "./useSave.ts";
import "./panel.css";

const MEMO_MAX = 1000;
const SAVE_DELAY = 700;

/** 기록 상세 (README 6-3). 같은 패널 안에서 행성 패널과 바뀐다 */
export function StarDetail({ starId }: { starId: string }) {
  const listed = useStore((s) => s.stars.find((x) => x.id === starId));
  const allStars = useStore((s) => s.stars);
  const planets = useStore((s) => s.planets);
  const [fetched, setFetched] = useState<Star | null>(null);
  const [gone, setGone] = useState(false);
  // 목록의 기록에는 텍스트 본문이 없을 수 있어 하나씩 받아 온다 (GET /api/stars/:id). 목록 쪽이 바뀌면(옮김·메모) 그것을 따른다
  const star: Star | undefined = fetched?.id === starId ? { ...fetched, ...(listed ?? {}), textBody: fetched.textBody ?? listed?.textBody ?? null } : listed;
  useEffect(() => {
    let alive = true;
    setFetched(null);
    setGone(false);
    api.star(starId).then(
      (s) => alive && setFetched(s),
      (e) => {
        if (alive && e instanceof RequestError && e.code === "NOT_FOUND") setGone(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [starId]);

  const planet = planets.find((p) => p.id === star?.planetId);
  const siblings = useMemo(
    () => (star ? allStars.filter((s) => s.planetId === star.planetId).sort((a, b) => b.createdAtUtc.localeCompare(a.createdAtUtc)) : []),
    [allStars, star?.planetId], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const at = star ? siblings.findIndex((s) => s.id === star.id) : -1;
  const back = () => (star ? store.getState().openPanel(star.planetId) : store.getState().closePanel());

  if (!star)
    return (
      <SidePanel title={gone ? "기록을 찾을 수 없어요" : "불러오는 중"} onClose={() => store.getState().closePanel()}>
        {gone ? <p className="empty-note">지워졌거나 옮겨진 기록이에요.</p> : <div className="skeleton" aria-busy="true" />}
      </SidePanel>
    );

  return (
    <SidePanel
      title={
        <span className="dnav">
          <button type="button" className="dnav__back" onClick={back}><ChevronLeft size={16} aria-hidden />{planet?.name ?? "행성"}</button>
        </span>
      }
      onClose={() => store.getState().closePanel()}
      headerExtra={
        at >= 0 && siblings.length > 1 ? (
          <span className="dnav__pager" role="group" aria-label="같은 행성의 기록">
            <Button className="btn--icon" aria-label="이전 기록" disabled={at <= 0} onClick={() => store.getState().openStar(siblings[at - 1].id)}><ChevronLeft size={16} aria-hidden /></Button>
            <span className="dnav__count">{at + 1} / {siblings.length}</span>
            <Button className="btn--icon" aria-label="다음 기록" disabled={at >= siblings.length - 1} onClick={() => store.getState().openStar(siblings[at + 1].id)}><ChevronRight size={16} aria-hidden /></Button>
          </span>
        ) : undefined
      }
    >
      <Detail key={star.id} star={star} planetId={star.planetId} accent={planet ? planetLook(planet).accent : undefined} />
    </SidePanel>
  );
}

function Detail({ star, planetId, accent }: { star: Star; planetId: string; accent?: string }) {
  const planets = useStore((s) => s.planets);
  const { busy, run } = useSave();
  const [memo, setMemo] = useState(star.memo ?? "");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [moveTo, setMoveTo] = useState(planetId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const base = useRef(star.memo ?? ""); // 서버에 있는 값
  const title = starTitle(star);
  const canOpen = star.kind === "image" || star.kind === "file";

  // 메모 자동 저장: 멈춘 뒤 0.7초
  useEffect(() => {
    if (memo === base.current) return;
    const t = setTimeout(async () => {
      setSaved("saving");
      const ok = await run(() => api.updateStar(star.id, { memo: memo.trim() ? memo : null }));
      if (ok) {
        base.current = memo;
        setSaved("saved");
        void store.getState().refresh();
      } else setSaved("idle");
    }, SAVE_DELAY);
    return () => clearTimeout(t);
  }, [memo, star.id, run]);

  const move = async () => {
    if (await run(() => api.updateStar(star.id, { planetId: moveTo }), `‘${planets.find((p) => p.id === moveTo)?.name ?? ""}’ 행성으로 옮겼어요`)) {
      await store.getState().refresh();
      store.getState().openStar(star.id); // 새 행성을 따라 패널 갱신
    }
  };
  const open = (mode: "file" | "folder") => void run(() => api.openStarFile(star.id, { mode }));
  const load = () => {
    const ok = store.getState().addToCargo({ type: "star", starId: star.id });
    store.getState().showToast(ok ? "탐사선에 실었어요" : "이미 실은 기록이에요", ok ? "success" : "info");
  };

  return (
    <div className="detail">
      <h3 className="detail__title">{title}</h3>
      <p className="detail__meta" style={{ color: accent }}>{addedAt(star.createdAtUtc)} 넣음{star.sizeBytes !== null && ` · ${fileSize(star.sizeBytes)}`}</p>
      {star.originalMissing && <p className="note note--warn" role="alert">보관함에서 원본 파일을 찾지 못했어요.</p>}

      <Preview star={star} />

      <label className="field">
        <span className="field__row">메모<span className="field__hint" aria-live="polite">{saved === "saving" ? "저장 중…" : saved === "saved" ? "저장했어요" : `${memo.length}/${MEMO_MAX}`}</span></span>
        <textarea value={memo} maxLength={MEMO_MAX} rows={3} placeholder="이 기록에 남기고 싶은 말" onChange={(e) => { setMemo(e.target.value); setSaved("idle"); }} />
      </label>

      <div className="detail__actions">
        {canOpen && (
          <>
            <Button onClick={() => open("file")} disabled={busy || !!star.originalMissing}><ExternalLink size={16} aria-hidden /> 원본 열기</Button>
            <Button onClick={() => open("folder")} disabled={busy}><FolderOpen size={16} aria-hidden /> 폴더에서 보기</Button>
          </>
        )}
        <Button onClick={load}><Rocket size={16} aria-hidden /> 탐사선에 싣기</Button>
      </div>

      <div className="move">
        <label className="field">
          다른 행성으로 옮기기
          <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {planets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <Button variant="primary" disabled={busy || moveTo === planetId} onClick={move}>옮기기</Button>
      </div>

      <Button variant="ghost" className="detail__delete" onClick={() => setConfirmDelete(true)}><Trash2 size={16} aria-hidden /> 이 기록 삭제</Button>
      <ConfirmDialog
        open={confirmDelete}
        title="기록 삭제"
        message={`‘${title}’ 기록과 보관함에 복사해 둔 원본이 영구 삭제돼요. 되돌릴 수 없어요.`}
        confirmLabel="삭제하기"
        danger
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          if (await run(() => api.deleteStar(star.id), "기록을 삭제했어요")) {
            setConfirmDelete(false);
            store.getState().starsDeleted([star.id]);
          }
        }}
      />
    </div>
  );
}

/** 미리보기: 이미지는 사진, 텍스트는 본문 전체, 링크는 주소, 그 외는 아이콘 자리 */
function Preview({ star }: { star: Star }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (star.kind !== "image" || star.originalMissing) return;
    let url: string | null = null;
    let alive = true;
    requestObjectUrl(`/api/stars/${encodeURIComponent(star.id)}/original`).then(
      (u) => (alive ? setSrc((url = u)) : URL.revokeObjectURL(u)),
      () => undefined, // 못 받으면 아래 썸네일·아이콘으로 보여 준다
    );
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
      setSrc(null);
    };
  }, [star.id, star.kind, star.originalMissing]);

  if (star.kind === "text")
    return <pre className="preview preview--text" tabIndex={0}>{star.textBody ?? "본문이 파일로 저장된 긴 글이에요. 원본 열기로 볼 수 있어요."}</pre>;
  if (star.kind === "link")
    return (
      <div className="preview preview--link">
        <KindIcon kind="link" size={20} />
        <a href={star.url ?? undefined} target="_blank" rel="noreferrer">{star.url}</a>
      </div>
    );
  if (star.kind === "image" && src) return <img className="preview preview--image" src={src} alt={starTitle(star)} />;
  return (
    <div className="preview preview--placeholder">
      <Thumbnail star={star} size={72} />
      <span>{star.originalName ?? "이름 없는 기록"}</span>
    </div>
  );
}
