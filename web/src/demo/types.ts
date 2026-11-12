// 시연용 데이터 타입 (README 4-1 결정 기록, 7장). 서버·공유 타입을 바꾸지 않으려고 web/ 안에 둔다.
// 서버 담당자와 합의하면 packages/shared 로 옮긴다. 이름은 README 7장 제안을 따른다.

export type VizMode = "dash" | "table" | "photos" | "texts";
export type ChartKind = "bar" | "donut";
export type Aggregate = "avg" | "sum";

/** 별자리 관측 화면의 보기 설정 (README 6-4). 대시보드가 아닌 보기는 mode 만 쓴다 */
export interface LinkViz {
  mode: VizMode;
  chart: ChartKind;
  /** 대시보드·표에 쓰는 CSV 기록 */
  csvId?: string;
  /** 묶는 기준 열 (값이 2~12가지인 글자 열) */
  cat?: string;
  /** 값 열. 없으면 행 수 */
  val?: string;
  agg?: Aggregate;
  /** CSV 기록(id)별로 사용자가 켜고 끈 열: 열 이름 → 쓸지 여부. 없는 열은 기본(번호 열만 끔)을 따른다 */
  cols?: Record<string, Record<string, boolean>>;
}

/** 별자리: 기록에 관측 목적을 붙여 묶은 것. 사용자가 직접 묶는 그룹 */
export interface Link {
  id: string;
  name: string;
  /** 관측 목적 */
  memo: string;
  starIds: string[];
  viz: LinkViz;
  createdAtUtc: string;
}

/** 행성 색 7가지 (README 6-2 "행성 수정"). tokens.css 의 planet-N 이름으로 둔다 */
export const PLANET_COLORS = [
  { token: "planet-1", label: "파랑" },
  { token: "planet-2", label: "주황" },
  { token: "planet-3", label: "보라" },
  { token: "planet-4", label: "분홍" },
  { token: "planet-5", label: "초록" },
  { token: "planet-8", label: "빨강" },
  { token: "planet-7", label: "하늘" },
] as const;

export type PlanetShapeChoice = "" | "ring" | "nebula";

/** 서버 Planet 위에 사용자가 덧씌운 모습·위치. 없는 값은 서버·기본 규칙을 따른다 */
export interface PlanetOverride {
  colorToken?: string;
  shape?: PlanetShapeChoice;
  /** 우주 위 평면 좌표(px). 2D·2.5D 가 같이 쓴다 */
  x?: number;
  y?: number;
  editedAtUtc?: string;
}

/** 블랙홀에 보관한 행성. 서버에서 지우지 않고 웹이 숨기고, 꺼내면 되돌린다 */
export interface TrashedPlanet {
  planetId: string;
  name: string;
  colorToken: string;
  /** 보관할 때의 기록 id. 보관 중에는 목록·개수에서 뺀다 */
  starIds: string[];
  trashedAtUtc: string;
}

export interface DemoData {
  links: Link[];
  /** 우주에 선을 그리지 않을 별자리 (오른쪽 창 체크 상자). 개인 화면 설정 */
  hiddenLinkIds: string[];
  planets: Record<string, PlanetOverride>;
  trash: TrashedPlanet[];
}

export const emptyDemoData = (): DemoData => ({ links: [], hiddenLinkIds: [], planets: {}, trash: [] });

export const DEFAULT_VIZ: LinkViz = { mode: "texts", chart: "bar" };
