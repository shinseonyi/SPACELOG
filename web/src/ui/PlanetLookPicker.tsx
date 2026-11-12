import { PLANET_COLORS, type PlanetShapeChoice } from "../demo/types.ts";
import { PLANET_SHAPES } from "./planetLookChoice.ts";

/** 행성 색 7가지 + 모양(기본 / 고리 / 성운). 행성 수정과 새 행성 만들기가 같이 쓴다 (README 6-2) */
export function PlanetLookPicker({ colorToken, shape, onColor, onShape }: {
  colorToken: string;
  shape: PlanetShapeChoice;
  onColor(token: string): void;
  onShape(shape: PlanetShapeChoice): void;
}) {
  return (
    <>
      <div className="field">
        색상
        <div className="swatches" role="radiogroup" aria-label="색상">
          {PLANET_COLORS.map((c) => (
            <button key={c.token} type="button" role="radio" aria-checked={colorToken === c.token} aria-label={c.label} title={c.label} className={`swatch${colorToken === c.token ? " is-on" : ""}`} style={{ background: `var(--${c.token})` }} onClick={() => onColor(c.token)} />
          ))}
        </div>
      </div>
      <div className="field">
        모양
        <div className="shapes" role="radiogroup" aria-label="모양">
          {PLANET_SHAPES.map((s) => (
            <button key={s.key || "default"} type="button" role="radio" aria-checked={shape === s.key} className={`shape${shape === s.key ? " is-on" : ""}`} onClick={() => onShape(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>
    </>
  );
}
