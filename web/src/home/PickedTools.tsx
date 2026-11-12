import { useState } from "react";
import { Orbit, Rocket, Waypoints } from "lucide-react";
import { store, useStore } from "../state/store.ts";
import { Button } from "../ui/Button.tsx";
import { CreateLinkSheet } from "./LinkSheets.tsx";
import { usePickedStars } from "./usePickedStars.ts";

/**
 * 체크한 기록으로 할 일: 탐사선에 싣기 · 별자리 만들기 · 관측소에서 바로 보기. 셋은 같은 크기의 전체 폭 버튼이다.
 * 선택은 전역(store.picked)이라 오른쪽 창의 기록 목록과 행성 패널 어디서든 같은 선택을 이어서 쓴다.
 * 체크한 기록이 없으면 아무것도 그리지 않는다.
 */
export function PickedTools() {
  const stars = usePickedStars();
  const [creating, setCreating] = useState(false);
  const count = useStore((s) => s.picked.length);
  if (count === 0 || stars.length === 0) return null;

  const load = () => {
    const { addToCargo, showToast, clearPicked } = store.getState();
    const added = stars.filter((s) => addToCargo({ type: "star", starId: s.id })).length;
    showToast(added === stars.length ? `기록 ${added}개를 탐사선에 실었어요` : `${added}개를 실었어요. 나머지는 이미 실려 있어요`, "success");
    clearPicked();
  };

  if (creating)
    return (
      <CreateLinkSheet
        stars={stars}
        onCancel={() => setCreating(false)}
        onDone={() => {
          setCreating(false);
          store.getState().clearPicked();
        }}
      />
    );
  return (
    <div className="pick">
      <div className="pick__head">
        <span className="pick__count">선택한 기록 {stars.length}개</span>
        <button type="button" className="side__clear" onClick={() => store.getState().clearPicked()}>선택 해제</button>
      </div>
      <div className="pick__btns">
        <Button onClick={load}><Rocket size={16} aria-hidden /> 탐사선에 싣기</Button>
        <Button variant="primary" onClick={() => setCreating(true)}><Waypoints size={16} aria-hidden /> 별자리 만들기</Button>
        <Button onClick={() => store.getState().openObservatory({ draftIds: stars.map((s) => s.id) })}><Orbit size={16} aria-hidden /> 관측소에서 바로 보기</Button>
      </div>
    </div>
  );
}
