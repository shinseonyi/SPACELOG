import { useStore } from "../state/store.ts";
import { useSceneState } from "../universe/sceneState.ts";

/**
 * 왼쪽 아래 조작 안내 한 줄. 항상 펼쳐 둔다 — 접기(?)와 조망 버튼은 없앴다. 모든 행성 보기는 확대 조절의 배율(맞춤) 버튼.
 * 2.5D · 3D: WASD 비행 · Space/Shift 상승·하강 · 드래그 시점 · 휠 앞뒤 · E 착륙. 2D 는 같은 키가 평면 조작이라 문구만 바꾼다.
 */
export function ControlsHint() {
  const webgl = useSceneState((s) => s.webgl);
  const view = useStore((s) => s.view);
  const edit = useStore((s) => s.editPos);
  if (edit) return null; // 위치 편집 중에는 블랙홀이 이 자리를 쓴다
  if (view !== "2d" && webgl === false) return null; // 3D류 보기는 WebGL 이 있어야 한다
  const flat = view === "2d";
  return (
    <div className="hint card" role="note" aria-label="조작 안내">
      <p className="hint__keys">
        <span><kbd>WASD</kbd>{flat ? "이동" : "비행"}</span>
        <span><kbd>Space</kbd><kbd>Shift</kbd>{flat ? "축소·확대" : "상승·하강"}</span>
        <span><kbd>드래그</kbd>{flat ? "화면 이동" : "시점"}</span>
        <span><kbd>휠</kbd>{flat ? "확대·축소" : "앞뒤"}</span>
        <span><kbd>E</kbd>착륙</span>
      </p>
    </div>
  );
}
