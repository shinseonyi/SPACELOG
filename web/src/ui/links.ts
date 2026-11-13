// 바깥 사이트 주소. 빌드할 때 들어간다 (web/.env.example)

/** 받는 곳(Render 의 site/) 공개 주소. 비워 두면 로컬 서버가 내려주는 사본(/how-to-use/)을 쓴다 */
const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").trim().replace(/\/$/, "");

/**
 * 사용 방법(How to use) 체험 페이지 — 상단 바 로고가 연다.
 * 예시 데이터(mock) 빌드는 체험 페이지 안(site/how-to-use/web/)에 올라가므로 한 단계 위가 입구다
 */
export const HOW_TO_USE_URL = import.meta.env.VITE_API_MOCK === "1" ? "../" : SITE_URL ? `${SITE_URL}/how-to-use/` : "/how-to-use/";
