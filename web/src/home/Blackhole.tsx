import { useHoleOver } from "./holeHover.ts";
import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api/client.ts";
import { demo, useDemo } from "../demo/demoStore.ts";
import { freeSpot } from "../demo/planets.ts";
import type { TrashedPlanet } from "../demo/types.ts";
import { useSave } from "../panel/useSave.ts";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { planetColorToken } from "../ui/planetColor.ts";
import { planetNodes } from "../view/look.ts";
import blackholeUrl from "../assets/blackhole-wide.png";

const when = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 블랙홀 (README 6-1): 위치 편집 중 왼쪽 아래에 나타난다. 행성을 끌어다 놓으면 확인 뒤 보관함으로 보내고,
 * 블랙홀을 누르면 보관한 행성 목록(꺼내기 · 완전히 삭제)이 열린다. 서버에서 지우는 게 아니라 웹이 숨겼다가 되돌린다.
 */
/** 행성이 블랙홀로 빨려 들어가는 시간 (view.css · Depth25 와 같은 값) */
export const VANISH_MS = 750;

export function Blackhole() {
  const edit = useStore((s) => s.editPos);
  const ask = useStore((s) => s.askTrash);
  const eating = useStore((s) => s.vanishing !== null);
  const holding = useStore((s) => s.askTrash !== null); // 행성이 블랙홀에 놓인 채 묻는 중
  const over = useHoleOver(); // 행성을 끌어 위에 올려 둔 중 (놓기 전)
  const trash = useDemo((s) => s.trash);
  const [open, setOpen] = useState(false);
  if (!edit) return null;
  return (
    <>
      <button type="button" className={`bh${eating ? " is-eating" : ""}${holding ? " is-holding" : ""}${over ? " is-over" : ""}`} data-blackhole aria-expanded={open} title="블랙홀 열기" onClick={() => setOpen((v) => !v)}>
        <span className="bh__img" aria-hidden style={{ backgroundImage: `url(${blackholeUrl})` }} />
        <span className="bh__text">
          <span className="bh__name">블랙홀</span>
          <span className="bh__sub">{over ? "놓으면 블랙홀에 넣어요" : trash.length ? `${trash.length}개 보관 중` : "행성을 끌어 넣으세요"}</span>
        </span>
      </button>
      {open && <TrashList items={trash} onClose={() => setOpen(false)} />}
      {ask && <AskCard planetId={ask} />}
    </>
  );
}

function AskCard({ planetId }: { planetId: string }) {
  const planet = useStore((s) => s.planets.find((p) => p.id === planetId));
  if (!planet) return null;
  const n = planet.starCountTotal ?? 0;
  const send = () => {
    const s = store.getState();
    // 먼저 빨려 들어가는 연출(보기가 그린다), 끝나면 보관함으로
    s.setAskTrash(null);
    s.setVanishing(planetId);
    setTimeout(() => {
      demo.getState().sendToBlackHole({ planetId, name: planet.name, colorToken: planet.colorToken, starIds: [], starCount: n });
      store.getState().planetDeleted(planetId); // 탐사선에 실은 것 · 열려 있던 패널 정리
      store.getState().setVanishing(null);
      store.getState().showToast(`‘${planet.name}’ 행성을 블랙홀에 넣었어요`);
    }, VANISH_MS);
  };
  return (
    <div className="bh-card" role="alertdialog" aria-label="행성을 블랙홀에 넣기">
      <strong>‘{planet.name}’ 행성을 블랙홀에 넣을까요?</strong>
      <p>기록 {n}개는 행성과 함께 보관돼요. 우주와 목록에서 사라지지만 블랙홀에서 언제든 꺼낼 수 있어요.</p>
      <div className="bh-card__actions">
        <Button onClick={() => store.getState().setAskTrash(null)}>취소</Button>
        <Button variant="primary" onClick={send}>블랙홀에 넣기</Button>
      </div>
    </div>
  );
}

function TrashList({ items, onClose }: { items: TrashedPlanet[]; onClose(): void }) {
  const { busy, run } = useSave();
  const planets = useStore((s) => s.planets);
  const overrides = useDemo((s) => s.planets);

  const restore = (t: TrashedPlanet) => {
    const back = demo.getState().restoreFromBlackHole(t.planetId);
    if (!back) return;
    // 돌아올 자리: 보관 전 위치 근처의 빈자리 (그 사이 다른 행성이 놓였을 수 있다)
    const prev = overrides[t.planetId];
    const others = planetNodes(planets, overrides);
    const spot = freeSpot(others, prev?.x ?? 0, prev?.y ?? 0, t.planetId);
    demo.getState().setPlanet(t.planetId, spot);
    store.getState().showToast(`‘${t.name}’ 행성을 꺼냈어요`, "success");
  };
  const purge = async (t: TrashedPlanet) => {
    // 서버의 행성 삭제는 기록이 없는 행성만 된다 (SPEC). 기록이 있으면 서버가 완전 삭제를 지원할 때까지 보관만 한다
    if (await run(() => api.deletePlanet(t.planetId), `‘${t.name}’ 행성을 완전히 삭제했어요`)) demo.getState().purgeFromBlackHole(t.planetId);
  };

  return (
    <div className="bh-list" role="dialog" aria-label="블랙홀 보관함">
      <div className="bh-list__head">
        <strong>블랙홀에 보관 중인 행성</strong>
        <Button className="btn--icon" aria-label="닫기" onClick={onClose}><X size={14} aria-hidden /></Button>
      </div>
      {items.length === 0 && <p className="bh-list__empty">블랙홀이 비어 있어요. 행성을 끌어 넣으면 여기에 보관됩니다.</p>}
      <ul>
        {items.map((t) => {
          const n = t.starCount ?? 0;
          return (
            <li key={t.planetId}>
              <i className="bh-list__dot" style={{ background: `var(--${planetColorToken(t.colorToken)})` }} />
              <span className="bh-list__text">
                <span className="bh-list__name">{t.name}</span>
                <span className="bh-list__sub">기록 {n}개 · {when(t.trashedAtUtc)} 보관</span>
              </span>
              <Button variant="primary" disabled={busy} onClick={() => restore(t)}>꺼내기</Button>
              <Button disabled={busy || n > 0} title={n > 0 ? "기록이 있는 행성은 서버가 완전 삭제를 지원하면 지울 수 있어요" : undefined} onClick={() => void purge(t)}>완전히 삭제</Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
