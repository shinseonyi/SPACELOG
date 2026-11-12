// 바깥 사이트 주소. 빌드할 때 들어간다 (web/.env.example)

/** 받는 곳(Render 의 site/) 공개 주소. 비워 두면 로컬 서버가 내려주는 사본(/how-to-use/)을 쓴다 */
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").trim().replace(/\/$/, "");

/** 사용 방법(How to use) 체험 페이지 — 상단 바 로고가 연다 */
export const HOW_TO_USE_URL = SITE_URL ? `${SITE_URL}/how-to-use/` : "/how-to-use/";
