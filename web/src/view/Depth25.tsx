import { useEffect, useMemo, useRef } from "react";
import { sceneState } from "../universe/sceneState.ts";
import { webglSupported } from "../universe/webglSupport.ts";
import { useStore } from "../state/store.ts";
import { DepthScene, type DepthPlanet } from "./Depth25.ts";
import { planetNodes, recencyRank } from "./look.ts";
import "./view.css";

/** 앞뒤 간격: 최근에 기록을 넣은 행성이 앞, 한 단계마다 260 뒤로 (README 6-1) */
const DEPTH_STEP = 260;

/** 2.5D 보기를 React 화면에 붙이는 껍데기. WebGL 이 없으면 그리지 않는다 (POLICY 3-1) */
export function Depth25() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<DepthScene | null>(null);
  const planets = useStore((s) => s.planets);
  const stars = useStore((s) => s.stars);
  const data = useMemo<DepthPlanet[]>(() => {
    const rank = recencyRank(planets, stars);
    return planetNodes(planets).map((n) => ({ ...n, depth: (rank.get(n.id) ?? 0) * DEPTH_STEP }));
  }, [planets, stars]);
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    const ok = webglSupported();
    sceneState.setState({ webgl: ok });
    if (!ok || !host.current) return;
    let gone = false;
    let made: DepthScene | null = null;
    void DepthScene.create(host.current).then((s) => {
      if (gone) return s.dispose();
      made = s;
      scene.current = s;
      s.setPlanets(latest.current);
    });
    return () => {
      gone = true;
      scene.current = null;
      made?.dispose();
    };
  }, []);

  useEffect(() => {
    scene.current?.setPlanets(data);
  }, [data]);

  return <div ref={host} className="universe" />;
}
