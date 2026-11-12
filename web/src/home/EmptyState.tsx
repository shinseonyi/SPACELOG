import { useEffect, useState } from "react";
import { useStore } from "../state/store.ts";

/**
 * 빈 우주 안내 (POLICY 3-2). 전체 0건이면 첫 실행 안내.
 * 흰 카드로 한 번 띄우고 [확인]을 누르면 닫는다. 기록이 생겼다가 다시 0건이 되면 다시 띄운다
 */
export function EmptyState() {
  const show = useStore((s) => s.lastSyncedAt !== null && !s.loading && s.stars.length === 0);
  const total = useStore((s) => s.planets.reduce((n, p) => n + (p.starCountTotal ?? 0), 0));
  const custom = useStore((s) => s.period.preset === "custom");
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!show) setDismissed(false);
  }, [show]);
  if (!show || dismissed) return null;
  const close = (
    <button type="button" className="empty__ok" onClick={() => setDismissed(true)}>
      확인
    </button>
  );
  if (total === 0)
    return (
      <div className="empty" role="status">
        <h2>첫 기록을 남겨 보세요.</h2>
        <p>화면 가장자리의 드롭존에 파일·링크·글을 끌어다 놓으면 기록이 돼요.</p>
        <p>
          클립보드는 <kbd>⌘⇧Space</kbd> (윈도우 <kbd>Ctrl+Shift+Space</kbd>)로 바로 넣을 수 있어요.
        </p>
        {close}
      </div>
    );
  return (
    <div className="empty" role="status">
      <p>{custom ? "이 기간에는 기록이 없어요. 기간을 넓혀 보세요" : "드롭존에 첫 기록을 끌어다 놓아 보세요"}</p>
      {close}
    </div>
  );
}
