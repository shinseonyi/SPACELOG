// 2D · 2.5D 보기가 함께 쓰는 행성 모습·크기·배치 (README 6-1). 숫자만 다뤄 테스트할 수 있게 둔다.
// 시연용(README 4-1 결정 기록): 서버 Planet에는 좌표·모양이 없어서, 좌표는 3D와 같은 id 시드 배치(universe/layout.ts)를 평면에 펴서 쓰고,
// 모양은 "미분류" 시스템 행성만 성운으로 정한다. 사용자가 고르는 색·모양·좌표는 7단계(위치 편집·행성 수정)에서 web/src/demo 로 붙인다.
import type { Planet } from "@spacelog/shared/types";
import { planetColorToken } from "../ui/planetColor.ts";
import { planetPositions } from "../universe/layout.ts";

export type PlanetShape = "" | "ring" | "nebula";

/** 3D 단위 → 화면 px. 행성끼리 중심 거리가 320px 이상이 되도록 (최소 간격 39 × 10 = 390) */
export const PX_PER_UNIT = 10;

/** 기본 행성 사진(planet-hero.png)에 입히는 색조 필터. 값은 design/spacelog-data.js. 6번(노랑)은 시안에 없어 같은 방식으로 맞춘 값 */
const FILTER: Record<string, string> = {
  "planet-1": "none",
  "planet-2": "hue-rotate(175deg) saturate(1.3)",
  "planet-3": "hue-rotate(55deg) saturate(1.2)",
  "planet-4": "hue-rotate(115deg) saturate(1.2)",
  "planet-5": "hue-rotate(-75deg) saturate(1.2)",
  "planet-6": "hue-rotate(190deg) saturate(1.3)",
  "planet-7": "hue-rotate(-20deg) saturate(1.4)",
  "planet-8": "hue-rotate(150deg) saturate(1.6)",
};

export interface PlanetLook {
  /** CSS 색 (`var(--planet-N)`) */
  accent: string;
  /** 같은 색의 hex. 캔버스(Three.js)에는 CSS 변수를 못 써서 필요하다 */
  accentHex: string;
  filter: string;
  shape: PlanetShape;
  /** 성운은 "조각", 나머지는 "기록" */
  unit: "기록" | "조각";
}

const ACCENT_HEX: Record<string, string> = {
  "planet-1": "#8fb4ff", "planet-2": "#ffb07a", "planet-3": "#c4a8ff", "planet-4": "#ff8fcf",
  "planet-5": "#6fdcaa", "planet-6": "#ffd36f", "planet-7": "#7fe3ff", "planet-8": "#ff8f7a",
};

export function planetLook(p: Pick<Planet, "colorToken" | "system">): PlanetLook {
  const token = planetColorToken(p.colorToken);
  const shape: PlanetShape = p.system === "uncategorized" ? "nebula" : "";
  return { accent: `var(--${token})`, accentHex: ACCENT_HEX[token], filter: FILTER[token], shape, unit: shape === "nebula" ? "조각" : "기록" };
}

/** 행성 지름(px). 기록 0개는 40, 가장 큰 행성이 27개를 넘으면 상대 크기로 (README 6-1) */
export function planetSizePx(count: number, maxCount: number): number {
  if (count <= 0) return 40;
  return maxCount > 27 ? 64 + 156 * Math.sqrt(count / maxCount) : 64 + Math.sqrt(count) * 30;
}

export interface PlanetNode {
  id: string;
  name: string;
  /** 우주 위 평면 좌표(px). 중심 기준 */
  x: number;
  y: number;
  count: number;
  size: number;
  look: PlanetLook;
}

/** 행성 목록 → 그릴 노드. 기간이 바뀌어도 같은 행성은 같은 자리다 (planetPositions) */
export function planetNodes(planets: Planet[]): PlanetNode[] {
  const pos = planetPositions(planets);
  const max = Math.max(0, ...planets.map((p) => p.starCountInPeriod ?? 0));
  return planets.map((p) => {
    const at = pos.get(p.id) ?? [0, 0, 0];
    const count = p.starCountInPeriod ?? 0;
    return { id: p.id, name: p.name, x: Math.round(at[0] * PX_PER_UNIT), y: Math.round(at[2] * PX_PER_UNIT), count, size: planetSizePx(count, max), look: planetLook(p) };
  });
}

/** 가장 최근에 기록을 넣은 행성부터 0,1,2… 순위. 2.5D에서 앞쪽에 놓는 기준 (README 6-1). 기록이 없는 행성은 맨 뒤 */
export function recencyRank(planets: Pick<Planet, "id">[], stars: { planetId: string; createdAtUtc: string }[]): Map<string, number> {
  const last = new Map<string, string>();
  for (const s of stars) if ((last.get(s.planetId) ?? "") < s.createdAtUtc) last.set(s.planetId, s.createdAtUtc);
  const order = [...planets].sort((a, b) => (last.get(b.id) ?? "").localeCompare(last.get(a.id) ?? "") || a.id.localeCompare(b.id));
  return new Map(order.map((p, i) => [p.id, i]));
}

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** 모든 행성이 들어오는 경계 상자 (행성 반지름 + 궤도 18px) */
export function boundsOf(nodes: Pick<PlanetNode, "x" | "y" | "size">[]): Box | null {
  if (nodes.length === 0) return null;
  const r = (n: { size: number }) => n.size / 2 + 18;
  return {
    x0: Math.min(...nodes.map((n) => n.x - r(n))),
    y0: Math.min(...nodes.map((n) => n.y - r(n))),
    x1: Math.max(...nodes.map((n) => n.x + r(n))),
    y1: Math.max(...nodes.map((n) => n.y + r(n))),
  };
}

export interface Cam2D {
  x: number;
  y: number;
  z: number;
}

export const ZOOM_MIN = 0.15;
export const ZOOM_MAX = 2.4;
export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/**
 * 조망: 모든 행성이 보이게. 오른쪽 창(rightOcc)이 가린 만큼 왼쪽으로 치우쳐 놓는다.
 * 카메라 (x,y)는 화면 중심에 오는 우주 좌표, z는 배율.
 */
export function overviewCam(nodes: PlanetNode[], w: number, h: number, rightOcc: number): Cam2D {
  const b = boundsOf(nodes);
  if (!b) return { x: 0, y: 0, z: 1 };
  const bandW = Math.max(120, w - rightOcc - 112);
  const bandH = Math.max(120, h - 144 - 128 - 52); // 위 바 · 아래 버튼 · 이름표
  const z = clampZoom(Math.min(1.15, bandW / (b.x1 - b.x0), bandH / (b.y1 - b.y0)));
  return { x: (b.x0 + b.x1) / 2 + rightOcc / 2 / z, y: (b.y0 + b.y1) / 2 + 24 / z, z };
}

/** 행성 하나에 착륙: 그 행성이 (오른쪽 창을 뺀) 화면 가운데에 오고 크게 보인다 */
export function landCam(node: Pick<PlanetNode, "x" | "y">, w: number, rightOcc: number): Cam2D {
  const z = w < 760 ? 1.2 : 1.7;
  return { x: node.x + rightOcc / 2 / z, y: node.y, z };
}

/** 오른쪽에서 가린 폭: 행성 패널(440+16) > 오른쪽 창(300+24) > 없음. 좁은 화면은 전체 폭이라 비우지 않는다 */
export function rightOccupied(w: number, panelOpen: boolean, sideOpen: boolean): number {
  if (w < 760) return 0;
  return panelOpen ? 456 : sideOpen ? 324 : 0;
}
