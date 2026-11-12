// 드롭존 상태 머신 (SPEC 1-1): collapsed → expanded → dragOver → saving → confirm / error
import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectorBridge, DropzoneStatus, SaveResult } from "../main/ipcTypes.ts";
import { ConfirmCard, type Preview } from "./ConfirmCard.tsx";
import { isLowDisk } from "./precheck.ts";

declare global {
  interface Window {
    collector: CollectorBridge;
    collectorEvents: { onExpand(cb: () => void): void; onToast(cb: (m: string) => void): void };
  }
}

export type DropState = "collapsed" | "expanded" | "dragOver" | "saving" | "confirm" | "error";

const COLLAPSE_AFTER_LEAVE_MS = 2000; // 마우스 나감 2초 후 접힘
const ERROR_MS = 4000; // 오류 토스트 4초

const c = window.collector;

export function DropZone() {
  const [state, setState] = useState<DropState>("collapsed");
  const [status, setStatus] = useState<DropzoneStatus | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState<{ message: string; lines: string[] } | null>(null);
  const [progress, setProgress] = useState<string>("");
  const [memo, setMemo] = useState("");
  const prevState = useRef<DropState>("collapsed");
  const leaveTimer = useRef<number | null>(null);
  const dragDepth = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 창 크기는 상태에 맞춰 main이 바꾼다 (오른쪽 가장자리에 붙인 채)
  useEffect(() => {
    if (state === "collapsed") c.setMode("collapsed");
    else if (state === "confirm" || (state === "expanded" && result)) c.setMode("confirm", document.getElementById("card")?.scrollHeight);
    else c.setMode("expanded");
  }, [state, result]);

  useEffect(() => {
    void c.status().then(setStatus);
    c.onStatus(setStatus);
    window.collectorEvents.onExpand(() => setState((s) => (s === "collapsed" ? "expanded" : s)));
    window.collectorEvents.onToast((m) => showError(m, []));
    c.onSaving(() => {
      if (stateRef.current === "confirm" || stateRef.current === "saving") return; // 열린 확인 카드를 덮지 않는다
      setProgress("클립보드를 기록으로 만드는 중…");
      setState("saving");
    });
    c.onShortcutResult((r) => {
      // 확인 카드가 열려 있는 동안 단축키로 넣은 기록은 저장만 되고 카드는 바꾸지 않는다 (기본 배정 그대로)
      if (stateRef.current === "confirm") return;
      finish(r, [], performance.now());
    });
    // 창 전체에서 기본 동작(파일을 열어 페이지 이동)을 막는다
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showError = useCallback((message: string, lines: string[]) => {
    prevState.current = stateRef.current === "error" ? prevState.current : stateRef.current;
    setError({ message, lines });
    setState("error");
  }, []);

  // 오류: 4초 후 또는 클릭 → 이전 상태 (saving·confirm으로는 돌아가지 않는다)
  useEffect(() => {
    if (state !== "error") return;
    const t = window.setTimeout(leaveError, ERROR_MS + (error?.lines.length ?? 0) * 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, error]);

  function leaveError() {
    const back = prevState.current;
    setState(back === "saving" || back === "confirm" || back === "dragOver" ? "expanded" : back);
  }

  function finish(r: SaveResult, pv: Preview[], t0: number) {
    if (r.stars.length > 0) {
      // 저장 완료 표시 = 측정 끝 (SPEC 3-2). 다음 프레임에 카드가 그려진 뒤 잰다
      requestAnimationFrame(() => c.metric({ event: "saved", source: r.source, count: r.stars.length, dropToConfirmMs: Math.round(performance.now() - t0), serverMs: r.serverMs }));
      setResult(r);
      setPreviews(pv);
      setState("confirm");
    } else {
      c.metric({ event: "failed", source: r.source, error: r.error, lines: r.lines.length });
      showError(r.error ?? (r.lines.length === 1 ? r.lines[0] : "넣지 못했어요"), r.lines.length === 1 && !r.error ? [] : r.lines);
    }
  }

  async function handleTransfer(dt: DataTransfer, source: "drop" | "paste") {
    const t0 = performance.now();
    if (stateRef.current === "saving" || stateRef.current === "confirm") return; // 확인 카드가 닫힌 뒤에 다시 넣는다
    const files = [...dt.files];
    // 폴더 판별은 drop 이벤트 안에서 동기로 읽어야 한다 (await 뒤에는 items가 비워진다)
    const dirs = [...dt.items].filter((it) => it.kind === "file").map((it) => !!it.webkitGetAsEntry?.()?.isDirectory);
    const uriList = dt.getData("text/uri-list");
    const text = dt.getData("text/plain");
    const pv: Preview[] = files.slice(0, 4).map((f) => ({ name: f.name, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null }));
    setProgress(files.length > 0 ? `기록을 만드는 중… (${files.length}개)` : "기록을 만드는 중…");
    setState("saving");
    try {
      const r = files.length > 0 ? await c.saveFiles(files, dirs, source) : await c.saveText({ uriList, text }, source);
      finish(r, pv, t0);
    } catch (err) {
      console.error(err);
      showError("저장하지 못했어요. 잠시 뒤 다시 넣어 주세요", []);
    }
  }

  // 붙여넣기 (⌘/Ctrl+V, SPEC 1-1 expanded 안내)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea")) return; // 메모 입력 중의 붙여넣기는 그대로
      if (!e.clipboardData) return;
      // 펼쳐 둔 드롭존에서만 받는다. 확인 카드 뒤에 포커스가 남아 있을 때의 Ctrl+V로 별이 생기지 않게
      if (stateRef.current !== "expanded") return;
      e.preventDefault();
      void handleTransfer(e.clipboardData, "paste");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 트레이·단축키·오류 뒤처럼 마우스 없이 펼쳐졌으면 마우스가 올라오지 않는 한 2초 뒤 접는다
  useEffect(() => {
    if (state !== "expanded") return;
    if (document.querySelector(".panel:hover, .card:hover")) return;
    leaveTimer.current = window.setTimeout(() => setState((s) => (s === "expanded" ? "collapsed" : s)), COLLAPSE_AFTER_LEAVE_MS + 1000);
    return () => {
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [state]);

  useEffect(() => {
    dragDepth.current = 0;
  }, [state]);

  function onMouseEnter() {
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    if (state === "collapsed") setState("expanded");
  }
  function onMouseLeave() {
    if (state !== "expanded") return;
    leaveTimer.current = window.setTimeout(() => setState((s) => (s === "expanded" ? "collapsed" : s)), COLLAPSE_AFTER_LEAVE_MS);
  }
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current++;
    if (state === "collapsed" || state === "expanded") {
      prevState.current = state;
      setState("dragOver");
    }
  }
  function onDragLeave(e: React.DragEvent) {
    // 자식 요소 사이를 오갈 때의 dragleave는 무시한다. 요소가 바뀌어 짝이 안 맞는 dragenter가 있어도 창을 벗어나면 풀린다
    const to = e.relatedTarget as Node | null;
    if (to && e.currentTarget.contains(to)) return;
    dragDepth.current = 0;
    if (state === "dragOver") setState(prevState.current === "collapsed" ? "collapsed" : "expanded");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    void handleTransfer(e.dataTransfer, "drop");
  }

  // 확인 카드를 닫아도 결과는 남긴다. 접었다 다시 펼치면 같은 확인 화면이 보이고, "새 기록 넣기"로 빈 화면으로 돌아간다 (README 6-5)
  function closeCard() {
    setState("collapsed");
  }

  function newRecord() {
    previews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
    setResult(null);
    setPreviews([]);
    setState("expanded");
  }

  // 간단한 메모도 기록으로 넣는다 (README 6-5): Enter 로 텍스트 기록 만들기
  async function saveMemo() {
    const text = memo.trim();
    if (!text || stateRef.current === "saving") return;
    const t0 = performance.now();
    setMemo("");
    setProgress("기록을 만드는 중…");
    setState("saving");
    try {
      finish(await c.saveText({ uriList: "", text }, "paste"), [], t0);
    } catch (err) {
      console.error(err);
      showError("저장하지 못했어요. 잠시 뒤 다시 넣어 주세요", []);
    }
  }

  const lowDisk = isLowDisk(status?.freeBytes ?? null);
  const serverDown = status?.server === "error";
  const dragHandlers = { onDragEnter, onDragOver: (e: React.DragEvent) => e.preventDefault(), onDragLeave, onDrop };

  if (state === "collapsed") {
    return (
      <div className="handle" onMouseEnter={onMouseEnter} {...dragHandlers} title="SpaceLog 드롭존" aria-label="SpaceLog 드롭존 펼치기">
        <span className={`planet-dot${serverDown ? " is-error" : lowDisk ? " is-warn" : ""}`} aria-hidden />
        <span className="handle-count" aria-label="오늘 넣은 기록">
          {status?.todayCount ?? "·"}
        </span>
        <span className="handle-label">오늘</span>
      </div>
    );
  }

  if ((state === "confirm" || state === "expanded") && result) {
    return (
      <div style={{ height: "100%" }} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <ConfirmCard key={result.stars[0]?.id} result={result} previews={previews} planets={status?.planets ?? []} revisit={state === "expanded"} onDone={closeCard} onNew={newRecord} />
      </div>
    );
  }

  return (
    <div className="panel" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} {...dragHandlers}>
      <header className="p-head">
        <span className="p-logo" aria-hidden><i /></span>
        <span className="p-brand">SPACELOG</span>
        <button type="button" className="icon-btn" title="접기" aria-label="접기" onClick={() => setState("collapsed")}>»</button>
      </header>
      {lowDisk && status?.freeBytes != null && (
        <div className="band band-warn" role="status">
          디스크 공간이 부족해요 (남은 공간 {Math.floor(status.freeBytes / 1024 / 1024)} MB)
        </div>
      )}
      {serverDown && (
        <div className="band band-danger" role="alert">
          로컬 서버를 켜지 못했어요. 트레이 메뉴에서 다시 켜 주세요
        </div>
      )}
      <div className={`zone zone-${state}`} onClick={state === "error" ? leaveError : undefined}>
        {state === "saving" && (
          <>
            <span className="spinner" aria-hidden />
            <p className="zone-sub">{progress}</p>
          </>
        )}
        {state === "dragOver" && (
          <>
            <p className="zone-big">놓으면 기록이 됩니다</p>
            <p className="zone-sub">여러 개를 놓으면 각각 기록돼요</p>
          </>
        )}
        {state === "expanded" && (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            <p className="zone-big">
              끌어다 놓으면<br />기록이 됩니다.
            </p>
            <p className="zone-sub">클립보드에서 바로 붙여넣을 수도 있어요.</p>
          </>
        )}
        {state === "error" && error && (
          <div className="toast" role="alert">
            <p className="toast-title">{error.message}</p>
            {error.lines.length > 0 && (
              <ul>
                {error.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <input
        className="memo-in"
        value={memo}
        maxLength={10000}
        placeholder="간단한 메모를 남겨 보세요 · Enter"
        aria-label="간단한 메모"
        onChange={(e) => setMemo(e.target.value.replace(/[\r\n]+/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void saveMemo();
          }
        }}
      />
      <div className="keys">
        <span>붙여넣기</span>
        <kbd>Ctrl/⌘ V</kbd>
        <span>· 클립보드 바로 기록</span>
        <kbd>{status?.shortcut ?? ""}</kbd>
      </div>
      <div className="tools" aria-label="다른 도구에서 가져오기">
        <span className="tools-title">다른 도구에서도 가져오기</span>
        <div className="tools-row">
          {["Google Drive", "Notion", "Slack"].map((t) => (
            <button key={t} type="button" className="tool" disabled aria-disabled>
              {t} <b>연결 예정</b>
            </button>
          ))}
        </div>
      </div>
      <footer className="foot">
        <div className="foot-main">
          <button type="button" className="btn primary" onClick={() => c.openUniverse()}>
            우주 보기
          </button>
          <button type="button" className="btn" onClick={() => c.openRediscovery()}>
            재발견 알림 보기
          </button>
        </div>
        <button type="button" className="icon-btn outline" onClick={() => c.openSettings()} title="설정" aria-label="설정">
          ⚙
        </button>
      </footer>
    </div>
  );
}
