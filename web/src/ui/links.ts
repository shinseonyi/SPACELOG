// 바깥 사이트 주소. 빌드할 때 들어간다 (web/.env.example)

/** 받는 곳(Render 의 site/). 비워 두면 render.yaml 의 서비스 이름으로 */
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://spacelog-download.onrender.com").trim().replace(/\/$/, "");

/** 사용 방법(How to use) 체험 페이지 — 상단 바 로고가 연다 */
export const HOW_TO_USE_URL = `${SITE_URL}/how-to-use/`;
