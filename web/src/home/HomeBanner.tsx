import { todayPeriod } from "@spacelog/shared/period";
import { NETWORK_MESSAGE } from "../api/client.ts";
import { store, useStore } from "../state/store.ts";
import { Banner } from "../ui/Banner.tsx";
import { useSceneState } from "../universe/sceneState.ts";

/** 배너는 한 번에 1개, 우선순위: 서버 끊김 > WebGL 없음 > 성능 상한 > 기간 자동 확장 (SPEC 1-4) */
export function HomeBanner() {
  const lost = useStore((s) => s.connection === "lost");
  const loading = useStore((s) => s.loading);
  const expanded = useStore((s) => s.periodAutoExpanded);
  const webgl = useSceneState((s) => s.webgl);
  const starsHidden = useSceneState((s) => s.starsHidden);
  const view = useStore((s) => s.view);
  const isToday = useStore((s) => s.period.preset === "today");

  let banner = null;
  if (lost)
    banner = (
      <Banner tone="error" action={{ label: "다시 시도", onClick: () => void store.getState().refresh(), disabled: loading }}>
        {NETWORK_MESSAGE}
      </Banner>
    );
  else if (view !== "2d" && webgl === false) banner = <Banner tone="info">이 브라우저에서는 3D 우주를 볼 수 없어요. 2D 보기로 바꾸거나 목록에서 행성을 골라 보세요</Banner>;
  else if (view === "3d" && starsHidden)
    // 기록 상한 초과 상태 (DESIGN W-01): 기간이 이미 오늘이면 버튼을 넣지 않는다
    banner = (
      <Banner tone="warning" action={isToday ? undefined : { label: "오늘만 보기", onClick: () => void store.getState().setPeriod(todayPeriod()) }}>
        기간을 좁히면 기록이 보여요
      </Banner>
    );
  else if (expanded) banner = <Banner tone="info">오늘은 기록이 없어 이번 주 우주를 보여드려요</Banner>;
  return banner && <div className="home-banner card">{banner}</div>;
}
