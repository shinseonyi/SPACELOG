import { useState } from "react";
import { Move, Orbit, Plus, Rocket } from "lucide-react";
import { PLANET_NAME_MAX, type Planet } from "@spacelog/shared/types";
import { api } from "../api/client.ts";
import { demo, useDemo } from "../demo/demoStore.ts";
import type { PlanetShapeChoice } from "../demo/types.ts";
import { useSave } from "../panel/useSave.ts";
import { store, useStore } from "../state/store.ts";
import { setAddSlot } from "../add/addSlot.ts";
import { Button } from "../ui/Button.tsx";
import { suggestColor } from "../ui/planetLookChoice.ts";
import { PlanetLookPicker } from "../ui/PlanetLookPicker.tsx";

/**
 * 오른쪽 아래 버튼 묶음 (README 6-1): 위치 편집 · 행성 추가 · 탐사선 · N · 관측소 · N. 높이 44px 알약.
 * 위치 편집은 2D 에서만. 패널·관측소·탐사선이 열려 있으면 숨긴다. `data-guide-target`은 우주먼지의 길잡이 비행이 찾는 표식 (chat/controller.ts).
 */
export function ActionBar() {
  const cargo = useStore((s) => s.cargo.length);
  const links = useDemo((s) => s.links.length);
  const view = useStore((s) => s.view);
  const edit = useStore((s) => s.editPos);
  const [adding, setAdding] = useState(false);
  const hidden = useStore((s) => s.selectedPlanetId !== null || s.selectedStarId !== null || s.route.name === "probe" || s.route.name === "observatory");
  if (hidden) return null;
  return (
    <div className="actionbar">
      {adding && <NewPlanetCard onClose={() => setAdding(false)} />}
      {view === "2d" && (
        <button type="button" className={`actionbar__btn${edit ? " is-on" : ""}`} aria-pressed={edit} data-guide-target="edit" onClick={() => store.getState().setEditPos(!edit)}>
          <Move size={16} aria-hidden /> 위치 편집
        </button>
      )}
      <div className="actionbar__row">
        {/* 가장 좁은 화면에서 "기록 넣기"가 이 자리로 온다 (add/addSlot.ts) */}
        <span className="actionbar__slot" ref={setAddSlot} />
        <button type="button" className="actionbar__btn" aria-expanded={adding} onClick={() => setAdding((v) => !v)}>
          <Plus size={16} aria-hidden /> 행성 추가
        </button>
      </div>
      <button type="button" className="actionbar__btn" data-guide-target="probe" onClick={() => store.getState().openProbe()}>
        <Rocket size={16} aria-hidden /> 탐사선{cargo > 0 && <span className="actionbar__n">{cargo}</span>}
      </button>
      <button type="button" className="actionbar__btn actionbar__btn--primary" data-guide-target="observatory" onClick={() => store.getState().openObservatory()}>
        <Orbit size={16} aria-hidden /> 관측소{links > 0 && <span className="actionbar__n">{links}</span>}
      </button>
    </div>
  );
}

/**
 * 새 행성 만들기: 이름(1~20자, 같은 이름은 대소문자 무시로 안 됨, POLICY 2-4) · 색 7가지 · 모양(기본 / 고리 / 성운).
 * 처음 색은 아직 아무 행성도 안 쓴 색. 색·모양은 행성 수정과 같이 이 브라우저에 덧씌운다. 서버가 아직 지원하지 않으면 그렇게 알린다
 */
function NewPlanetCard({ onClose }: { onClose(): void }) {
  const planets = useStore((s) => s.planets);
  const overrides = useDemo((s) => s.planets);
  const { busy, run } = useSave();
  const [name, setName] = useState("");
  const [colorToken, setColorToken] = useState(() => suggestColor(planets.map((p) => overrides[p.id]?.colorToken ?? p.colorToken)));
  const [shape, setShape] = useState<PlanetShapeChoice>("");
  const [touched, setTouched] = useState(false);
  const trimmed = name.trim();
  const error = !trimmed ? "이름을 입력해 주세요" : planets.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()) ? "같은 이름의 행성이 있어요" : "";
  const create = async () => {
    if (error) return setTouched(true);
    let made: Planet | null = null;
    if (await run(async () => { made = await api.createPlanet(trimmed); }, `‘${trimmed}’ 행성을 만들었어요`)) {
      if (made) demo.getState().setPlanet((made as Planet).id, { colorToken, shape });
      onClose();
      await store.getState().refresh();
    }
  };
  return (
    <form className="newplanet" aria-label="새 행성 만들기" onSubmit={(e) => { e.preventDefault(); void create(); }}>
      <strong>새 행성 만들기</strong>
      <input value={name} maxLength={PLANET_NAME_MAX} autoFocus placeholder="행성 이름" aria-label="행성 이름" aria-invalid={touched && !!error} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
      {touched && error && <p className="newplanet__error" role="alert">{error}</p>}
      <PlanetLookPicker colorToken={colorToken} shape={shape} onColor={setColorToken} onShape={setShape} />
      <div className="newplanet__actions">
        <Button onClick={onClose}>취소</Button>
        <Button type="submit" variant="primary" disabled={busy || !!error}>만들기</Button>
      </div>
    </form>
  );
}
