// 웹에서 기록 넣기 (design handoff 2.5d README "웹에서 기록 넣기", 시안 SPACELOG_Prototype). 수집 앱과 같은 POST /api/stars 를 부른다.
// - 우주 홈 가운데 아래 [＋ 기록 넣기 · 끌어다 놓기 · 붙여넣기] → 메모 창(메모·링크 한 줄, 파일 고르기)
// - 화면 어디에 파일·글자를 끌어다 놓거나, 입력 칸 밖에서 붙여넣어도 넣는다
// - 넣은 뒤 흰 알림 "넣었어요 · 제목 · 행성" + [넣기 취소] 7초. 행성 패널을 연 채 넣으면 그 행성으로 옮긴다
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Paperclip, Plus, Sparkle, X } from "lucide-react";
import type { CreateStarsResponse } from "@spacelog/shared/types";
import { api, RequestError } from "../api/client.ts";
import { store, useStore } from "../state/store.ts";
import { addedMessage, classifyText, mergeResults, rejectionLines, splitFiles, textBody } from "./addInput.ts";
import { INLINE_QUERY, useAddSlot } from "./addSlot.ts";
import "./add.css";

const inlineMq = typeof window !== "undefined" ? window.matchMedia(INLINE_QUERY) : null;
const subscribeMq = (cb: () => void) => {
  inlineMq?.addEventListener("change", cb);
  return () => inlineMq?.removeEventListener("change", cb);
};
/** 가장 좁은 화면인가 (버튼을 "행성 추가" 옆으로) */
const useInline = () => useSyncExternalStore(subscribeMq, () => !!inlineMq?.matches, () => false);

const UNDO_MS = 7000;

export function AddRecord() {
  const routeName = useStore((s) => s.route.name);
  const edit = useStore((s) => s.editPos);
  const panelPlanet = useStore((s) => s.planets.find((p) => p.id === s.selectedPlanetId) ?? null);
  const [open, setOpen] = useState(false);
  const slot = useAddSlot();
  const inline = useInline() && !!slot;
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [added, setAdded] = useState<{ ids: string[]; text: string } | null>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlay = routeName === "observatory" || routeName === "probe"; // 관측소·탐사선이 덮고 있으면 받지 않는다

  const add = useCallback(async (files: File[], text: string | null) => {
    const s = store.getState();
    const { send, rejected } = splitFiles(files);
    const body = text ? textBody(text) : null;
    if (send.length === 0 && !body) {
      if (rejected.length) s.showToast(rejectionLines({ duplicates: [], rejected }).join("\n"), "error");
      else s.showToast("넣을 수 있는 내용이 없어요");
      return;
    }
    const target = s.planets.find((p) => p.id === s.selectedPlanetId) ?? null;
    setBusy(true);
    try {
      const parts: CreateStarsResponse[] = [];
      if (send.length) parts.push(await api.createFiles(send));
      if (body) parts.push(await api.createTextOrLink(body));
      const res = mergeResults(parts);
      res.rejected.push(...rejected);
      const ids = res.created.map((c) => c.id);
      if (target && ids.length) await api.updateStars({ ids, planetId: target.id });
      await store.getState().refresh();
      const lines = rejectionLines(res);
      if (lines.length) store.getState().showToast(lines.length > 1 ? `${lines[0]} 외 ${lines.length - 1}건` : lines[0], ids.length ? "info" : "error");
      if (ids.length) {
        const planetId = target?.id ?? res.created[0].planetId;
        const name = store.getState().planets.find((p) => p.id === planetId)?.name ?? null;
        if (undoTimer.current) clearTimeout(undoTimer.current);
        setAdded({ ids, text: addedMessage(res.created, name) });
        undoTimer.current = setTimeout(() => setAdded(null), UNDO_MS);
      }
    } catch (e) {
      if (!(e instanceof RequestError)) throw e;
      store.getState().showToast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }, []);

  const undo = async () => {
    if (!added) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const { ids } = added;
    setAdded(null);
    try {
      for (const id of ids) await api.deleteStar(id);
      store.getState().starsDeleted(ids);
      store.getState().showToast("넣기를 취소했어요");
    } catch (e) {
      if (!(e instanceof RequestError)) throw e;
      store.getState().showToast(e.message, "error");
    }
  };

  // 화면 어디든 끌어다 놓기 · 입력 칸 밖에서 붙여넣기. 페이지 안에서 시작한 끌기(이미지·링크)는 무시한다
  useEffect(() => {
    let depth = 0;
    let inside = false;
    const outside = (e: DragEvent) => !inside && !overlay && !!e.dataTransfer && [...e.dataTransfer.types].some((t) => t === "Files" || t === "text/plain" || t === "text/uri-list");
    const onStart = () => (inside = true);
    const onEnd = () => (inside = false);
    const onEnter = (e: DragEvent) => {
      if (!outside(e)) return;
      e.preventDefault();
      depth += 1;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (outside(e)) e.preventDefault();
    };
    const onLeave = () => {
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!outside(e) || !e.dataTransfer) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      const files = [...e.dataTransfer.files];
      const t = files.length ? null : classifyText(e.dataTransfer.getData("text/uri-list"), e.dataTransfer.getData("text/plain"));
      void add(files, t && t.kind !== "empty" ? (t.kind === "link" ? t.url : t.text) : null);
    };
    const onPaste = (e: ClipboardEvent) => {
      if (overlay || !e.clipboardData) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("dialog[open]")) return;
      const files = [...e.clipboardData.files];
      const text = files.length ? null : e.clipboardData.getData("text/plain");
      if (!files.length && !text?.trim()) return;
      e.preventDefault();
      void add(files, text);
    };
    window.addEventListener("dragstart", onStart);
    window.addEventListener("dragend", onEnd);
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragstart", onStart);
      window.removeEventListener("dragend", onEnd);
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [add, overlay]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const close = () => {
    setOpen(false);
    setNote("");
  };
  const save = () => {
    if (!note.trim() || busy) return;
    const text = note;
    close();
    void add([], text);
  };
  const where = panelPlanet ? `${panelPlanet.name} 행성에 넣어요` : "종류에 맞는 행성에 자동으로 넣어요";
  const showButton = !open && !added && !dragging && !edit && !overlay && !panelPlanet;

  return (
    <>
      {showButton && (() => {
        const button = (
          <button type="button" className={`addrec${inline ? " addrec--inline" : ""}`} data-guide-target="add" disabled={busy} onClick={() => setOpen(true)}>
            <Plus size={16} aria-hidden />
            <span>{busy ? "넣는 중…" : "기록 넣기"}</span>
            <span className="addrec__sub">끌어다 놓기 · 붙여넣기</span>
          </button>
        );
        return inline && slot ? createPortal(button, slot) : button; // 가장 좁은 화면: 세로 버튼 묶음의 "행성 추가" 왼쪽
      })()}

      {open && (
        <div className="addrec-wrap">
          <section
            className="addrec-sheet"
            role="dialog"
            aria-label="기록 넣기"
            onKeyDown={(e) => {
              e.stopPropagation(); // 안의 키는 우주 비행 키로 가지 않는다
              if (e.key === "Escape") close();
            }}
          >
            <header className="addrec-sheet__head">
              <span>기록 넣기</span>
              <button type="button" className="addrec-sheet__x" aria-label="닫기" onClick={close}><X size={14} aria-hidden /></button>
            </header>
            <textarea
              ref={field}
              className="addrec-sheet__note"
              rows={3}
              value={note}
              placeholder="메모를 적어 보세요. 링크를 붙여 넣어도 돼요"
              aria-label="메모"
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  save();
                }
              }}
            />
            <div className="addrec-sheet__foot">
              <button type="button" className="addrec-sheet__pick" onClick={() => picker.current?.click()}><Paperclip size={14} aria-hidden /> 파일 고르기</button>
              <span className="addrec-sheet__hint">{panelPlanet ? where : "Enter로 넣기 · Shift+Enter 줄바꿈"}</span>
              <button type="button" className="addrec-sheet__go" disabled={!note.trim() || busy} onClick={save}>넣기</button>
            </div>
          </section>
        </div>
      )}
      <input
        ref={picker}
        type="file"
        multiple
        hidden
        aria-label="기록으로 넣을 파일"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (!files.length) return;
          close();
          void add(files, null);
        }}
      />

      {dragging && (
        <div className="addrec-drop" aria-hidden>
          <Sparkle size={28} />
          <strong>놓으면 기록이 됩니다</strong>
          <span>{where}</span>
        </div>
      )}

      {added && (
        <div className="addrec-done" role="status">
          <span className="addrec-done__text">{added.text}</span>
          <button type="button" onClick={() => void undo()}>넣기 취소</button>
        </div>
      )}
    </>
  );
}
