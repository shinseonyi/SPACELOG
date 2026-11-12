import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { demo, useDemo } from "../demo/demoStore.ts";
import { freeSpot } from "../demo/planets.ts";
import { store, useStore } from "../state/store.ts";
import heroUrl from "../assets/planet-hero.png";
import nebulaUrl from "../assets/planet-nebula.png";
import ringUrl from "../assets/planet-ring.png";
import { clampZoom, landCam, leftOccupied, overviewCam, planetNodes, rightOccupied, type Cam2D, type PlanetNode } from "./look.ts";
import { FLAT_BLUR_PX, FLAT_BLUR_REF, FLAT_DIM, focusBlur } from "./focusBlur.ts";
import { marksOf, segmentsOf, useLinkPaths } from "./linkPaths.ts";
import { viewApi } from "./viewApi.ts";
import "./view.css";

const EASE = "cubic-bezier(0.25, 0.1, 0.25, 1)";
const FLY_MS = 800;
const PAN_SPEED = 720; // px/초 (배율 1 기준)
const ZOOM_RATE = 1.4; // 초당 배율 변화

const STARFIELD = (() => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: 140 }, (_, i) => ({ key: i, x: rnd() * 100, y: rnd() * 100, s: rnd() < 0.85 ? 1 : 2, o: 0.25 + rnd() * 0.6 }));
})();

/**
 * 2D 보기: 행성을 평면에 놓고 끌어서 옮기고 확대·축소한다 (README 6-1, 시안의 "2.5D").
 * DOM/CSS로 그린다. 3D 장면과 같은 계약(flyToPlanet 등록 · camera "overview")을 따른다.
 */
export function Flat2D() {
  const planets = useStore((s) => s.planets);
  const overrides = useDemo((s) => s.planets);
  const nodes = useMemo(() => planetNodes(planets, overrides), [planets, overrides]);
  const paths = useLinkPaths();
  const segs = useMemo(() => segmentsOf(paths), [paths]);
  const marks = useMemo(() => marksOf(paths), [paths]);
  const editPos = useStore((s) => s.editPos);
  const focusId = useStore((s) => s.selectedPlanetId);
  const [pdrag, setPdrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const pmeta = useRef<{ id: string; sx: number; sy: number; px: number; py: number; moved: boolean } | null>(null);
  const shownNodes = useMemo(() => (pdrag ? nodes.map((n) => (n.id === pdrag.id ? { ...n, x: pdrag.x, y: pdrag.y } : n)) : nodes), [nodes, pdrag]);
  const at = useMemo(() => new Map(shownNodes.map((n) => [n.id, n])), [shownNodes]);
  const [cam, setCam] = useState<Cam2D>({ x: 0, y: 0, z: 1 });
  const [anim, setAnim] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const live = useRef({ cam, nodes });
  live.current = { cam, nodes };
  const fitted = useRef(false);
  const flight = useRef<{ done(arrived: boolean): void; timer: number } | null>(null);
  const drag = useRef<{ x: number; y: number; sx: number; sy: number; moved: boolean } | null>(null);

  const size = () => ({ w: root.current?.clientWidth ?? 1280, h: root.current?.clientHeight ?? 800 });
  const occupied = () => {
    const s = store.getState();
    return rightOccupied(size().w, s.selectedPlanetId !== null || s.selectedStarId !== null);
  };

  const cancelFlight = useCallback(() => {
    const f = flight.current;
    if (!f) return;
    clearTimeout(f.timer);
    flight.current = null;
    f.done(false);
  }, []);

  const move = useCallback((next: Cam2D, ms: number) => {
    setAnim(ms);
    setCam(next);
  }, []);

  const overview = useCallback((ms: number) => {
    cancelFlight();
    const { w, h } = size();
    move(overviewCam(live.current.nodes, w, h, occupied(), leftOccupied(w)), ms);
  }, [cancelFlight, move]);

  // 자동 비행(착륙) 등록: 도착하면 true, 사용자가 끌거나 키를 눌러 멈추면 false
  useEffect(() => {
    store.getState().registerFlyToPlanet(
      (id) =>
        new Promise<boolean>((resolve) => {
          cancelFlight();
          const node = live.current.nodes.find((n) => n.id === id);
          if (!node) return resolve(false);
          const occ = rightOccupied(size().w, true); // 곧 패널이 열린다
          move(landCam(node, size().w, occ), FLY_MS);
          flight.current = {
            done: resolve,
            timer: window.setTimeout(() => {
              flight.current = null;
              resolve(true);
            }, FLY_MS),
          };
        }),
    );
    return () => {
      store.getState().registerFlyToPlanet(null);
      cancelFlight();
    };
  }, [cancelFlight, move]);

  // 처음 행성이 들어오면 한 번 조망으로 맞춘다
  useEffect(() => {
    if (!fitted.current && nodes.length > 0) {
      fitted.current = true;
      overview(0);
    }
  }, [nodes, overview]);

  // Esc 등으로 조망 요청이 오면 조망으로, 창 크기가 바뀌면 다시 맞춘다
  useEffect(() => {
    const off = store.subscribe((s, prev) => {
      if (s.camera === "overview" && prev.camera !== "overview") overview(FLY_MS);
    });
    const onResize = () => {
      const s = store.getState();
      if (s.selectedPlanetId) {
        const n = live.current.nodes.find((x) => x.id === s.selectedPlanetId);
        if (n) move(landCam(n, size().w, occupied()), 0);
      } else overview(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      off();
      window.removeEventListener("resize", onResize);
    };
  }, [overview, move]);

  // 확대 조절(왼쪽 아래)에 연결
  useEffect(() => {
    const zoomBy = (k: number) => {
      cancelFlight();
      const c = live.current.cam;
      move({ ...c, z: clampZoom(c.z * k) }, 250);
    };
    viewApi.setState({ zoom: { percent: Math.round(cam.z * 100), zoomIn: () => zoomBy(1.25), zoomOut: () => zoomBy(0.8), fit: () => overview(600) } });
  }, [cam.z, cancelFlight, move, overview]);
  useEffect(() => () => viewApi.setState({ zoom: null }), []);

  // 키: WASD = 이동, Space = 축소, Shift = 확대, E = 가운데에 가장 가까운 행성에 착륙. 패널이 열려 있거나 입력 중이면 받지 않는다
  useEffect(() => {
    const keys = new Set<string>();
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = live.current.cam;
      const dx = Number(keys.has("d")) - Number(keys.has("a"));
      const dy = Number(keys.has("s")) - Number(keys.has("w"));
      const dz = Number(keys.has("shift")) - Number(keys.has(" "));
      setAnim(0);
      setCam({ x: c.x + (dx * PAN_SPEED * dt) / c.z, y: c.y + (dy * PAN_SPEED * dt) / c.z, z: clampZoom(c.z * Math.exp(dz * Math.log(ZOOM_RATE) * dt * 2)) });
      raf = requestAnimationFrame(tick);
    };
    const name = (e: KeyboardEvent) => (e.key === "Shift" ? "shift" : e.key.toLowerCase());
    const blocked = (e: KeyboardEvent) => {
      const s = store.getState();
      return (
        e.metaKey || e.ctrlKey || e.altKey ||
        (e.target instanceof Element && !!e.target.closest("input, textarea, select, [contenteditable='true']")) ||
        !!document.querySelector("dialog[open]") ||
        s.selectedPlanetId !== null || s.selectedStarId !== null || s.route.name === "probe" || s.route.name === "observatory"
      );
    };
    const down = (e: KeyboardEvent) => {
      if (blocked(e)) return;
      const k = name(e);
      if (k === "e") {
        const c = live.current.cam;
        const near = live.current.nodes.reduce<PlanetNode | null>((b, n) => (!b || Math.hypot(n.x - c.x, n.y - c.y) < Math.hypot(b.x - c.x, b.y - c.y) ? n : b), null);
        if (near) void store.getState().flyToPlanet(near.id, "openPanel");
        return;
      }
      if (!["w", "a", "s", "d", " ", "shift"].includes(k)) return;
      if (k === " ") e.preventDefault();
      cancelFlight();
      if (keys.size === 0) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
      keys.add(k);
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(name(e));
      if (keys.size === 0) cancelAnimationFrame(raf);
    };
    const stop = () => {
      keys.clear();
      cancelAnimationFrame(raf);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", stop);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", stop);
      stop();
    };
  }, [cancelFlight]);

  // 끌어서 옮기기. 4px 넘게 움직였으면 끌기, 아니면 클릭
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
  };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) {
        d.moved = true;
        cancelFlight();
      }
      if (!d.moved) return;
      const c = live.current.cam;
      setAnim(0);
      setCam({ ...c, x: c.x - (e.clientX - d.x) / c.z, y: c.y - (e.clientY - d.y) / c.z });
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const onUp = () => {
      // 끌고 난 직후의 click 이 행성을 누른 것으로 처리되지 않게, 한 틱 뒤에 비운다
      setTimeout(() => (drag.current = null), 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [cancelFlight]);

  // 위치 편집: 행성을 끌어 옮긴다. 놓은 곳이 블랙홀이면 보내기를 묻고, 다른 행성과 320px 안이면 가까운 빈자리로 옮긴다 (README 6-1)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const m = pmeta.current;
      if (!m) return;
      if (!m.moved && Math.hypot(e.clientX - m.sx, e.clientY - m.sy) > 4) m.moved = true;
      if (!m.moved) return;
      const z = live.current.cam.z;
      setPdrag({ id: m.id, x: Math.round(m.px + (e.clientX - m.sx) / z), y: Math.round(m.py + (e.clientY - m.sy) / z) });
    };
    const onUp = (e: PointerEvent) => {
      const m = pmeta.current;
      pmeta.current = null;
      if (!m || !m.moved) return setPdrag(null);
      const z = live.current.cam.z;
      const x = Math.round(m.px + (e.clientX - m.sx) / z);
      const y = Math.round(m.py + (e.clientY - m.sy) / z);
      setPdrag(null);
      const hole = document.querySelector("[data-blackhole]")?.getBoundingClientRect();
      if (hole && e.clientX >= hole.left && e.clientX <= hole.right && e.clientY >= hole.top && e.clientY <= hole.bottom) {
        const s = store.getState();
        if (s.planets.length <= 1) s.showToast("마지막 행성은 블랙홀에 넣을 수 없어요");
        else s.setAskTrash(m.id);
        return;
      }
      const spot = freeSpot(live.current.nodes.filter((n) => n.id !== m.id), x, y, m.id);
      demo.getState().setPlanet(m.id, { x: spot.x, y: spot.y });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const onBgClick = (e: React.MouseEvent) => {
    if (drag.current?.moved || (e.target as Element).closest("button")) return;
    const s = store.getState();
    if (s.selectedPlanetId || s.selectedStarId) s.closePanel(); // 빈 우주를 누르면 착륙에서 빠져나온다
    overview(FLY_MS);
  };

  const onWheel = (e: React.WheelEvent) => {
    if ((e.target as Element).closest(".side, .side-panel")) return;
    cancelFlight();
    const c = live.current.cam;
    move({ ...c, z: clampZoom(c.z * Math.exp(-e.deltaY * 0.0012)) }, 0);
  };

  const transition = anim ? `transform ${anim}ms ${EASE}` : "none";
  const labelScale = cam.z < 1 ? 1 / cam.z : 1;
  return (
    <div className="flat" ref={root} onPointerDown={onPointerDown} onClick={onBgClick} onWheel={onWheel}>
      <div className="flat__stars" aria-hidden style={{ transform: `translate(${-cam.x * 0.12}px, ${-cam.y * 0.12}px)`, transition }}>
        {STARFIELD.map((d) => (
          <i key={d.key} style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, opacity: d.o }} />
        ))}
      </div>
      <div className="flat__world" style={{ transform: `translate(${-cam.x * cam.z}px, ${-cam.y * cam.z}px) scale(${cam.z})`, transition }}>
        <svg className="flat__lines" aria-hidden width="1" height="1">
          {segs.map((s, i) => {
            const a = at.get(s.a);
            const b = at.get(s.b);
            return a && b ? <line key={`${s.linkId}-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} /> : null;
          })}
        </svg>
        {shownNodes.map((n) => (
          <PlanetButton
            key={n.id}
            node={n}
            blur={blurOf(n, focusId ? at.get(focusId) : undefined)}
            labelScale={labelScale}
            editing={editPos}
            dragging={pdrag?.id === n.id}
            onEditDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation(); // 바탕 끌기(화면 이동)가 아니라 행성 끌기
              cancelFlight();
              pmeta.current = { id: n.id, sx: e.clientX, sy: e.clientY, px: n.x, py: n.y, moved: false };
            }}
          />
        ))}
        {marks.map((m) => {
          const a = at.get(m.a);
          const b = at.get(m.b);
          if (!a || !b) return null;
          // 한 행성 안의 별자리: 선 없이 그 행성 바로 위(이름은 아래에 있으므로)에서 위로 쌓는다
          const style = m.solo
            ? { left: a.x, top: a.y - a.size / 2 - 10, transformOrigin: "50% 100%", transform: `translate(-50%, -100%) translateY(${-m.stack * 28 * labelScale}px) scale(${labelScale})` }
            : { left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 + m.stack * 28, transform: `translate(-50%, -50%) scale(${labelScale})` };
          return (
            <button
              key={m.linkId}
              type="button"
              className="flat__linkmark"
              title="별자리의 기록 보기"
              style={style}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                store.getState().openLinkView(m.linkId);
              }}
            >
              {m.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 심도 효과: 고른 행성(패널 열림)에서 멀수록 흐리게. 고른 행성 · 고른 것이 없으면 0 */
function blurOf(n: PlanetNode, focus: PlanetNode | undefined): number {
  if (!focus || focus.id === n.id) return 0;
  return focusBlur(Math.hypot(n.x - focus.x, n.y - focus.y), FLAT_BLUR_REF);
}

function PlanetButton({ node: n, blur, labelScale, editing, dragging, onEditDown }: { node: PlanetNode; blur: number; labelScale: number; editing: boolean; dragging: boolean; onEditDown(e: React.PointerEvent): void }) {
  const { look } = n;
  const dots = Math.min(n.count, 12);
  const open = () => (n.count > 0 ? void store.getState().flyToPlanet(n.id, "openPanel") : store.getState().openPanel(n.id));
  return (
    <button
      type="button"
      className={`flat__planet${editing ? " is-edit" : ""}${dragging ? " is-dragging" : ""}`}
      style={{ left: n.x, top: n.y, width: n.size, height: n.size, opacity: n.count ? 1 : 0.45, filter: blur > 0.01 ? `blur(${(blur * FLAT_BLUR_PX).toFixed(2)}px) brightness(${(1 - blur * FLAT_DIM).toFixed(2)})` : undefined }}
      aria-label={`${n.name}, ${look.unit} ${n.count}개. 눌러서 착륙`}
      onPointerDown={editing ? onEditDown : undefined}
      onClick={editing ? undefined : open}
    >
      <span className="flat__body" style={{ width: n.size, height: n.size }}>
        {n.count > 0 && (
          <span className="flat__orbit" aria-hidden style={{ animationDuration: `${40 + n.size / 4}s` }}>
            {Array.from({ length: dots }, (_, i) => {
              const a = (i / dots) * Math.PI * 2;
              return <i key={i} style={{ left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%`, background: look.accent }} />;
            })}
          </span>
        )}
        {look.shape === "nebula" ? (
          <img className="flat__nebula" src={nebulaUrl} alt="" draggable={false} style={{ filter: look.filter === "none" ? undefined : look.filter }} />
        ) : (
          <span className="flat__disc" style={{ backgroundImage: `url(${heroUrl})`, filter: look.filter === "none" ? undefined : look.filter }} />
        )}
        {look.shape === "ring" && <img className="flat__ring" src={ringUrl} alt="" draggable={false} style={{ filter: look.filter === "none" ? undefined : look.filter }} />}
      </span>
      <span className="flat__label" style={{ transform: `translateX(-50%) scale(${labelScale})` }}>
        <span className="flat__name">{n.name}</span>
        <span className="flat__count" style={{ color: look.accent }}>{look.unit} {n.count}</span>
      </span>
    </button>
  );
}
