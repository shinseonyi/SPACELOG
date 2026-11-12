// 로컬 API fetch 래퍼 (SPEC 2-6, 3-3).
// - 모든 요청에 X-Session-Token 헤더
// - 오류는 RequestError(code, 화면 문구)로 던진다. 서버 문구가 있으면 그것을, 없으면 shared 기본 문구를 쓴다
// - 서버에 닿지 못하면(네트워크 실패) connection = "lost", 응답을 받으면 "ok"
import { ERROR_MESSAGES, isApiError, type ErrorCode } from "@spacelog/shared/errors";
import type {
  ExportRequest,
  ExportResponse,
  OpenStarRequest,
  Planet,
  RediscoveryEventRequest,
  RediscoveryTodayResponse,
  StarResponse,
  UniverseResponse,
  UpdateStarRequest,
} from "@spacelog/shared/types";

const TOKEN_KEY = "space-archive.sessionToken";

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 저장소를 못 쓰면 이번 페이지에서만 쓴다
    memoryToken = token;
  }
}
let memoryToken: string | null = null;
const currentToken = () => getToken() ?? memoryToken;

/** 서버 오류 코드가 아닌, 웹에서만 생기는 실패 */
export const NETWORK_MESSAGE = "수집 앱이 꺼져 있거나 응답하지 않아요"; // SPEC 3-4
const UNKNOWN_MESSAGE = "문제가 생겼어요. 잠시 후 다시 시도해 주세요";

/** API 요청 실패. code 는 shared 오류 코드 18종 또는 웹 전용 "NETWORK" · "UNKNOWN" */
export class RequestError extends Error {
  code: ErrorCode | "NETWORK" | "UNKNOWN";
  status: number;
  constructor(code: RequestError["code"], message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type Listeners = { onConnection(s: "ok" | "lost"): void; onUnauthorized(): void };
let listeners: Listeners = { onConnection() {}, onUnauthorized() {} };
export function setApiListeners(l: Listeners): void {
  listeners = l;
}

type Mock = (method: string, path: string, body?: unknown) => Promise<unknown>;
let mock: Mock | null = null;
/** 목업 모드(`npm run dev:mock`)에서 main.ts가 등록한다. */
export function setMock(m: Mock | null): void {
  mock = m;
}

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = currentToken();
  if (token) headers["X-Session-Token"] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    listeners.onConnection("lost");
    throw new RequestError("NETWORK", NETWORK_MESSAGE, 0);
  }
  listeners.onConnection("ok");
  if (res.ok) return res;

  const err: unknown = await res.json().catch(() => null);
  const code = isApiError(err) ? err.error.code : res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN";
  if (code === "UNAUTHORIZED") listeners.onUnauthorized();
  const message = isApiError(err) ? err.error.message : code === "UNKNOWN" ? UNKNOWN_MESSAGE : ERROR_MESSAGES[code];
  throw new RequestError(code, message, res.status);
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (mock) {
    const data = await mock(method, path, body);
    listeners.onConnection("ok");
    return data as T;
  }
  const res = await send(method, path, body);
  return (res.status === 204 ? null : await res.json()) as T;
}

/** 이미지처럼 <img>가 헤더를 못 붙이는 바이트 응답. 다 쓰면 URL.revokeObjectURL 로 해제한다. */
export async function requestObjectUrl(path: string): Promise<string> {
  if (mock) throw new RequestError("NOT_FOUND", ERROR_MESSAGES.NOT_FOUND, 404);
  const res = await send("GET", path);
  return URL.createObjectURL(await res.blob());
}

/**
 * 서버가 아직 이 API를 만들지 않았을 때(경로 없음)도 404 로 온다. 시연용으로 서버를 바꾸지 않는 동안
 * 기록·행성 수정 화면이 이 경우를 알아보고 안내할 수 있게 한다 (README 4-1 결정 기록).
 */
export const NOT_SUPPORTED_MESSAGE = "이 기능은 서버가 아직 지원하지 않아요";
export function isNotSupported(e: unknown): boolean {
  return e instanceof RequestError && e.status === 404;
}

export const api = {
  universe: (from: string, to: string) =>
    request<UniverseResponse>("GET", `/api/universe?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  star: (id: string) => request<StarResponse>("GET", `/api/stars/${encodeURIComponent(id)}`),
  /** 탐사선 내보내기 생성 (SPEC 3-8). 복사는 웹이 한다 */
  exportCargo: (body: ExportRequest) => request<ExportResponse>("POST", "/api/export", body),
  /** 오늘의 재발견 별 (SPEC 3-6). 후보가 없으면 null */
  rediscoveryToday: () => request<RediscoveryTodayResponse>("GET", "/api/rediscovery/today"),
  /** 재발견 이벤트 기록 (POST /api/rediscovery/events) */
  rediscoveryEvent: (body: RediscoveryEventRequest) => request<null>("POST", "/api/rediscovery/events", body),

  // ── 기록·행성 수정 (SPEC 2-6). 서버 담당(#5)이 만들면 바로 동작한다 ──
  updateStar: (id: string, body: UpdateStarRequest) => request<StarResponse>("PATCH", `/api/stars/${encodeURIComponent(id)}`, body),
  deleteStar: (id: string) => request<null>("DELETE", `/api/stars/${encodeURIComponent(id)}`),
  openStarFile: (id: string, body: OpenStarRequest) => request<null>("POST", `/api/stars/${encodeURIComponent(id)}/open`, body),
  createPlanet: (name: string) => request<Planet>("POST", "/api/planets", { name }),
  renamePlanet: (id: string, name: string) => request<Planet>("PATCH", `/api/planets/${encodeURIComponent(id)}`, { name }),
  deletePlanet: (id: string) => request<null>("DELETE", `/api/planets/${encodeURIComponent(id)}`),
  mergePlanet: (id: string, targetId: string) => request<null>("POST", `/api/planets/${encodeURIComponent(id)}/merge`, { targetId }),
};
