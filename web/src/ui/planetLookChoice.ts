// 행성 색·모양 고르기의 순수 규칙 (행성 수정 · 새 행성 만들기가 같이 쓴다). 화면은 PlanetLookPicker.tsx
import { PLANET_COLORS, type PlanetShapeChoice } from "../demo/types.ts";
import { planetColorToken } from "./planetColor.ts";

export const PLANET_SHAPES: { key: PlanetShapeChoice; label: string }[] = [
  { key: "", label: "기본" },
  { key: "ring", label: "고리" },
  { key: "nebula", label: "성운" },
];

/**
 * 새 행성의 처음 색: 아직 아무 행성도 쓰지 않은 색 중 첫 번째. 모두 쓰였으면 가장 적게 쓰인 색.
 * `used` 는 지금 행성들의 실제 색(사용자가 바꾼 색이 있으면 그 색).
 */
export function suggestColor(used: string[]): string {
  const count = new Map<string, number>();
  for (const t of used) count.set(planetColorToken(t), (count.get(planetColorToken(t)) ?? 0) + 1);
  return [...PLANET_COLORS].sort((a, b) => (count.get(a.token) ?? 0) - (count.get(b.token) ?? 0))[0].token;
}
