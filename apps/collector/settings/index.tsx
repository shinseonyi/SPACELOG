// 설정 창 (SPEC 1-2): 단축키 바꾸기 · 재발견 알림 켜기/끄기 · 로그인 시 자동 실행 · 보관함 위치 · 디스크 사용량
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { SettingsBridge, SettingsView, StorageInfo } from "../main/ipcTypes.ts";

declare global {
  interface Window {
    collectorSettings: SettingsBridge;
  }
}
const s = window.collectorSettings;

function formatBytes(n: number | null): string {
  if (n == null) return "알 수 없음";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

/** 키 입력 → Electron accelerator. 수정 키 하나 이상 + 일반 키 하나 */
function toAccelerator(e: React.KeyboardEvent): string | null {
  const mods: string[] = [];
  if (e.ctrlKey || e.metaKey) mods.push("CommandOrControl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (["Control", "Meta", "Alt", "Shift"].includes(e.key) || mods.length === 0) return null;
  // e.code로 읽는다: 한글 입력 상태에서도 자판 위치가 같고, Electron accelerator 이름과 맞추기 쉽다
  const c = e.code;
  const key = c.startsWith("Key") ? c.slice(3) : c.startsWith("Digit") ? c.slice(5) : c.startsWith("Arrow") ? c.slice(5) : /^F\d{1,2}$/.test(c) || ["Space", "Tab", "Enter", "Backspace", "Delete", "Home", "End", "PageUp", "PageDown"].includes(c) ? c : null;
  if (!key) return null;
  return [...mods, key].join("+");
}

const label = (acc: string) => (navigator.platform.startsWith("Mac") ? acc.replace("CommandOrControl", "⌘") : acc.replace("CommandOrControl", "Ctrl"));

function SettingsPage() {
  const [v, setV] = useState<SettingsView | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void s.get().then(setV);
    void s.storage().then(setStorage);
  }, []);

  async function update(patch: Partial<SettingsView>) {
    const r = await s.update(patch);
    setV(r.settings);
    setMsg(r.error ?? "저장했어요");
    if (patch.vaultPath) void s.storage().then(setStorage);
  }

  if (!v) return <p className="loading">불러오는 중…</p>;
  return (
    <main className="set-wrap">
      <header className="set-head">
        <h1>설정</h1>
      </header>

      <section className="set-box" aria-label="클립보드 기록 단축키">
        <div className="set-line">
          <span className="grow">클립보드 기록 단축키</span>
          <button
            type="button"
            className={`key-btn${capturing ? " is-capturing" : ""}`}
            onClick={() => setCapturing(true)}
            onBlur={() => setCapturing(false)}
            onKeyDown={(e) => {
              if (!capturing) return;
              e.preventDefault();
              if (e.key === "Escape") return setCapturing(false);
              const acc = toAccelerator(e);
              if (acc) {
                setCapturing(false);
                void update({ shortcut: acc });
              }
            }}
          >
            {capturing ? "새 단축키를 누르세요 (Esc 취소)" : label(v.shortcut)}
          </button>
        </div>
        {!v.shortcutRegistered && <p className="set-warn">지금 단축키가 등록되지 않았어요. 다른 조합을 골라 주세요</p>}
      </section>

      <section className="set-box" aria-label="재발견 알림">
        <div className="set-line">
          <div className="grow">
            <span>재발견 알림</span>
            <span className="set-hint">하루 1회 · {v.notificationTimeEffective} 이후 · 7일 전 오늘의 기록</span>
          </div>
          <button type="button" className="switch" role="switch" aria-checked={v.rediscoveryNotification} aria-label="재발견 알림" onClick={() => void update({ rediscoveryNotification: !v.rediscoveryNotification })} />
        </div>
        {v.notificationTimeEffective !== v.notificationTime && <p className="set-hint">개발용 SPACELOG_NOTIFY_AT로 알림 시각이 {v.notificationTimeEffective}로 바뀌어 있어요</p>}
      </section>

      <section className="set-box" aria-label="보관함 위치">
        <div className="set-line">
          <div className="grow">
            <span>보관함 위치</span>
            <span className="set-hint">사용량 {formatBytes(storage?.usedBytes ?? null)} · 남은 공간 {formatBytes(storage?.freeBytes ?? null)}</span>
          </div>
          <button type="button" className="btn small" onClick={() => s.openVault()}>
            폴더 열기
          </button>
          <button
            type="button"
            className="btn small"
            onClick={async () => {
              const r = await s.chooseVault();
              if (r) {
                setV(r.settings);
                setMsg(r.error ?? "보관함 위치를 바꾸고 로컬 서버를 다시 켰어요");
                void s.storage().then(setStorage);
              }
            }}
          >
            위치 바꾸기
          </button>
        </div>
        <p className="set-path" title={v.vaultPath}>
          {v.vaultPath}
        </p>
        <p className="set-hint">위치를 바꿔도 이전 보관함의 기록은 옮기지 않아요</p>
      </section>

      <section className="set-box" aria-label="로그인 시 자동 실행">
        <div className="set-line">
          <span className="grow">로그인 시 자동 실행</span>
          <button type="button" className="switch" role="switch" aria-checked={v.launchAtLogin} aria-label="로그인 시 자동 실행" onClick={() => void update({ launchAtLogin: !v.launchAtLogin })} />
        </div>
        {!v.isPackaged && <p className="set-hint">개발 모드에서는 저장만 하고 운영체제에 등록하지 않아요</p>}
      </section>

      {msg && (
        <p className="set-msg" role="status">
          {msg}
        </p>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<SettingsPage />);
