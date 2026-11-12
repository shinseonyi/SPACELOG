import type { DaysAgo, Star } from "@spacelog/shared/types";
import { shortDate } from "../panel/format.ts";
import { useRediscoveryCard } from "../rediscovery/rediscovery.ts";
import { useStore } from "../state/store.ts";
import { CometMark } from "../ui/CometMark.tsx";
import { starTitle } from "../ui/starTitle.ts";
import { planetLook } from "../view/look.ts";

type Props = {
  star: Star;
  daysAgo: DaysAgo;
  planetName: string;
  /** 행성 색 · 행성 사진 색 필터 (view/look.ts) */
  accent: string;
  filter?: string;
  /** 카드를 누르면: 그 행성으로 이동한 뒤 기록 상세 */
  onOpen(): void;
};

/**
 * 우주 홈의 재발견 혜성 카드 (SPEC 1-4, design handoff 7-3). 오늘의 별·이벤트 기록·별 열기는 개발 A의 useRediscoveryCard()(#7)가 맡는다.
 * 후보가 없으면 그리지 않는다. 카드 전체가 버튼이고 닫기는 없다 — 시안 W01 그대로.
 */
export function RediscoverySlot() {
  const { today, open } = useRediscoveryCard();
  const planet = useStore((s) => s.planets.find((p) => p.id === today?.star.planetId));
  if (!today) return null;
  const look = planet ? planetLook(planet) : null;
  return <RediscoveryCard star={today.star} daysAgo={today.daysAgo} planetName={planet?.name ?? "행성"} accent={look?.accent ?? "#fff"} filter={look?.filter} onOpen={open} />;
}

/** "재발견 혜성 · N일 전 오늘의 기록" 카드 화면. 데이터·이벤트는 props 로 받는다 */
export function RediscoveryCard({ star, daysAgo, planetName, accent, filter, onOpen }: Props) {
  const title = starTitle(star);
  return (
    <button type="button" className="rediscovery" aria-label={`${daysAgo}일 전 오늘의 기록 열기`} title={title} onClick={onOpen}>
      <CometMark accent={accent} filter={filter} size="lg" />
      <span className="rediscovery__text">
        <span className="rediscovery__eyebrow" style={{ color: accent }}>재발견 혜성 · {daysAgo}일 전 오늘의 기록</span>
        <strong className="rediscovery__title">{title}</strong>
        <span className="rediscovery__sub">{planetName} · {shortDate(star.createdAtUtc)}</span>
      </span>
    </button>
  );
}
