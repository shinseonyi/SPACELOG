// 2.5D 보기 엔진 (Three.js). 시안의 spacelog-3d.js(design/)를 이 레포 방식으로 옮겼다 (README 6-1).
// 행성은 사진 스프라이트, 시점은 자유 비행. 좌표: 행성 (x, y, z) → 3D (x, -y, -z), 1단위 = 1px.
// 시안 대비 달라진 점: 별자리 선 · 거리 선은 별자리(5·6단계)·거리 카드와 함께 붙이고, 이름표는 행성 아래에만 놓는다(겹침 피하기 생략).
import * as THREE from "three";
import { store } from "../state/store.ts";
import heroUrl from "../assets/planet-hero.png";
import nebulaUrl from "../assets/planet-nebula.png";
import ringUrl from "../assets/planet-ring.png";
import { marksOf, segmentsOf, type LinkPath } from "./linkPaths.ts";
import { focusBlur } from "./focusBlur.ts";
import { rightOccupied, type PlanetNode } from "./look.ts";
import { viewApi } from "./viewApi.ts";

export interface DepthPlanet extends PlanetNode {
  /** 앞쪽(최근 기록)일수록 작다. 0, 260, 520… 뒤로 */
  depth: number;
}

const SPEED = 560;
const FOV = 50;
const hash = (i: number, n: number) => {
  const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(src));
    i.src = src;
  });

interface Imgs {
  hero: HTMLImageElement;
  ring: HTMLImageElement;
  nebula: HTMLImageElement;
}
let imgs: Promise<Imgs> | null = null;
const loadImgs = () => (imgs ??= Promise.all([loadImage(heroUrl), loadImage(ringUrl), loadImage(nebulaUrl)]).then(([hero, ring, nebula]) => ({ hero, ring, nebula })));

/** 심도 효과의 흐림 단계 (256px 사진 기준 흐림 px). 0 = 원본 */
const BLUR_STEPS = [0, 2, 4, 7, 10, 14];

interface Node3 {
  p: DepthPlanet;
  g: THREE.Group;
  orbit: THREE.Group;
  sprite: THREE.Sprite;
  dotMat: THREE.MeshBasicMaterial;
  /** 심도 효과: 지금 흐림 정도 0 ~ 1 과 쓰고 있는 흐림 단계 */
  blur: number;
  level: number;
  pick: THREE.Mesh;
  label: HTMLButtonElement;
  at: THREE.Vector3;
  sx: number;
  sy: number;
  pr: number;
  vis: boolean;
}

interface Flight {
  t: number;
  ms: number;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  y0: number;
  y1: number;
  x0: number;
  x1: number;
  warp: boolean;
  done?(arrived: boolean): void;
}

export class DepthScene {
  private readonly host: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(FOV, 1, 1, 30000);
  private readonly world = new THREE.Group();
  private readonly lines = new THREE.Group();
  private linkPaths: LinkPath[] = [];
  private marks: { el: HTMLButtonElement; a: THREE.Vector3; b: THREE.Vector3; stack: number; solo: Node3 | null }[] = [];
  private readonly labels = document.createElement("div");
  private readonly nodes = new Map<string, Node3>();
  private readonly stars: THREE.Points;
  private readonly cam = { pos: new THREE.Vector3(0, 0, 1600), yaw: 0, pitch: 0, vel: new THREE.Vector3(), fov: FOV, fly: null as Flight | null };
  private readonly keys = new Set<string>();
  private readonly cleanups: (() => void)[] = [];
  private readonly ray = new THREE.Raycaster();
  private planets: DepthPlanet[] = [];
  private sig = "";
  private wheel = 0;
  private sw = 0;
  private sh = 0;
  private occ = 0;
  /** 맞춤 시점의 바라보는 중심과 거리. 배율(%) = 맞춤 거리 / 지금 거리 */
  private fit = { center: new THREE.Vector3(0, 0, 0), dist: 1600 };
  private pct = 100;
  private pctAt = 0;
  private raf = 0;
  private last = performance.now();
  private disposed = false;
  private drag: { x: number; y: number; sx: number; sy: number; moved: boolean } | null = null;
  private readonly textures = new Map<string, THREE.CanvasTexture>();

  private readonly img: Imgs;

  private constructor(host: HTMLElement, img: Imgs) {
    this.host = host;
    this.img = img;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000000, 1);
    const el = this.renderer.domElement;
    el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab";
    this.labels.style.cssText = "position:absolute;inset:0;overflow:hidden;overflow:clip;pointer-events:none";
    host.append(el, this.labels);

    this.scene.fog = new THREE.Fog(0x000000, 1, 20000); // 거리 안개
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.42));
    const dot = (() => {
      const c = document.createElement("canvas");
      c.width = c.height = 32;
      const g = c.getContext("2d")!;
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(16, 16, 14, 0, Math.PI * 2);
      g.fill();
      return new THREE.CanvasTexture(c);
    })();
    const points = (n: number, at: (i: number) => number[], size: number, opacity: number, fog: boolean) => {
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) pos.set(at(i), i * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, map: dot, alphaTest: 0.05, transparent: true, opacity, fog, depthWrite: false }));
      pts.frustumCulled = false;
      return pts;
    };
    // 먼 별(카메라를 따라다녀 무한히 멀게 보임)과 가까운 먼지(지나가며 시차를 만듦)
    this.stars = points(1400, (i) => {
      const u = hash(i, 1) * 2 - 1, th = hash(i, 2) * Math.PI * 2, s = Math.sqrt(1 - u * u);
      return [9000 * s * Math.cos(th), 9000 * u, 9000 * s * Math.sin(th)];
    }, 1.6, 0.8, false);
    const dust = points(520, (i) => [(hash(i, 3) - 0.5) * 7000, (hash(i, 4) - 0.5) * 4200, (hash(i, 5) - 0.5) * 7000 - 600], 2.6, 0.5, true);
    this.scene.add(this.stars, dust, this.world, this.lines);

    // 입력: 드래그 = 시점 회전, 휠 = 앞뒤 이동, 클릭 = 행성 고르기
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void, opt?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opt);
      this.cleanups.push(() => t.removeEventListener(type, fn as EventListener));
    };
    on(el, "pointerdown", (e) => {
      if (e.button !== 0) return;
      this.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch { /* 캡처 못 해도 끌기는 동작 */ }
      el.style.cursor = "grabbing";
    });
    on(el, "pointermove", (e) => {
      const d = this.drag;
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
      if (!d.moved) return;
      this.cancelFly();
      this.cam.yaw += dx * 0.0035;
      this.cam.pitch = Math.max(-1.3, Math.min(1.3, this.cam.pitch + dy * 0.0035));
    });
    on(el, "pointerup", (e) => {
      const d = this.drag;
      if (!d) return;
      this.drag = null;
      el.style.cursor = "grab";
      if (d.moved) return;
      const r = el.getBoundingClientRect();
      this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.camera);
      const hit = this.ray.intersectObjects([...this.nodes.values()].map((n) => n.pick), false)[0];
      if (hit) this.openPlanet(hit.object.userData.id as string);
      else this.bgTap();
    });
    on(el, "pointercancel", () => { this.drag = null; });
    on(el, "wheel", (e) => {
      e.preventDefault();
      this.cancelFly();
      this.wheel += -e.deltaY * 6;
    }, { passive: false });
    const keyName = (e: KeyboardEvent) => (e.key === "Shift" ? "shift" : (e.key || "").toLowerCase());
    const blocked = (e: KeyboardEvent) => {
      const s = store.getState();
      return (
        e.metaKey || e.ctrlKey || e.altKey ||
        (e.target instanceof Element && !!e.target.closest("input, textarea, select, [contenteditable='true']")) ||
        !!document.querySelector("dialog[open]") ||
        s.selectedPlanetId !== null || s.selectedStarId !== null || s.route.name === "probe" || s.route.name === "observatory"
      );
    };
    const kd = (e: KeyboardEvent) => {
      if (this.disposed || blocked(e)) return;
      const k = keyName(e);
      if (k === "e") {
        const fwd = this.forward();
        let best: { d: number; id: string } | null = null;
        this.nodes.forEach((n) => {
          const v = n.at.clone().sub(this.cam.pos), d = v.length();
          if (v.dot(fwd) > 0 && (!best || d < best.d)) best = { d, id: n.p.id };
        });
        if (best) this.openPlanet((best as { id: string }).id);
        return;
      }
      if (["w", "a", "s", "d", " ", "shift"].includes(k)) {
        this.keys.add(k);
        this.cancelFly();
        if (k === " ") e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => this.keys.delete(keyName(e));
    const blur = () => this.keys.clear();
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    window.addEventListener("blur", blur);
    this.cleanups.push(() => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      window.removeEventListener("blur", blur);
    });

    // 스토어 계약: 자동 비행 등록, 조망 요청, 확대 조절
    store.getState().registerFlyToPlanet((id) => this.flyTo(id));
    this.cleanups.push(store.subscribe((s, prev) => {
      if (s.camera === "overview" && prev.camera !== "overview") this.overview(1100);
    }));
    viewApi.setState({ zoom: { percent: 100, zoomIn: () => this.dolly(1), zoomOut: () => this.dolly(-1), fit: () => this.overview(900) } });

    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  static async create(host: HTMLElement): Promise<DepthScene> {
    return new DepthScene(host, await loadImgs());
  }

  /** 행성 사진 텍스처. 색조 필터를 캔버스에 미리 입혀 둔다 */
  /** 심도 효과용 흐린 사진. 단계 0 = 원본, 1 ~ BLUR_STEPS.length-1 = 점점 흐리게 (256px 기준 흐림 px) */
  private blurred(p: DepthPlanet, level: number): THREE.CanvasTexture {
    const base = this.photo(p);
    if (level <= 0) return base;
    const key = `${p.look.shape}|${p.look.filter}|b${level}`;
    const cached = this.textures.get(key);
    if (cached) return cached;
    const src = base.image as HTMLCanvasElement;
    const c = document.createElement("canvas");
    c.width = src.width;
    c.height = src.height;
    const g = c.getContext("2d")!;
    g.filter = `blur(${((BLUR_STEPS[level] * src.width) / 256).toFixed(1)}px)`;
    g.drawImage(src, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.set(key, tex);
    return tex;
  }

  /**
   * 심도 효과: 행성을 고르면(패널 열림) 그 행성에 초점을 맞추고, 다른 행성은 카메라에서의 거리가 초점과 다를수록 흐리고 어둡게.
   * 흐림 정도는 천천히 따라가고, 사진은 흐림 단계 그림으로 바꿔 끼운다. 공전 점 · 이름표도 같이 흐려진다
   */
  private applyFocus(dt: number, camPos: THREE.Vector3) {
    const focusId = store.getState().selectedPlanetId;
    const f = focusId ? this.nodes.get(focusId) : undefined;
    const fd = f ? camPos.distanceTo(f.at) : 0;
    const k = 1 - Math.exp(-dt * 4);
    this.nodes.forEach((n) => {
      const want = f && n !== f ? focusBlur(camPos.distanceTo(n.at) - fd, Math.max(400, fd * 1.2)) : 0;
      n.blur += (want - n.blur) * k;
      if (Math.abs(want - n.blur) < 0.002) n.blur = want;
      const level = Math.round(n.blur * (BLUR_STEPS.length - 1));
      if (level !== n.level) {
        n.level = level;
        n.sprite.material.map = this.blurred(n.p, level);
      }
      n.sprite.material.color.setScalar(1 - n.blur * 0.4);
      n.dotMat.opacity = 1 - n.blur * 0.75;
    });
  }

  private photo(p: DepthPlanet): THREE.CanvasTexture {
    const key = `${p.look.shape}|${p.look.filter}`;
    const cached = this.textures.get(key);
    if (cached) return cached;
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const f = p.look.filter;
    if (p.look.shape === "ring" || p.look.shape === "nebula") {
      const im = p.look.shape === "ring" ? this.img.ring : this.img.nebula;
      c.width = im.width;
      c.height = im.height;
      g.filter = f;
      g.drawImage(im, 0, 0);
    } else {
      const im = this.img.hero, sw = im.width / 2.3, sx = (im.width * 0.637) / 2.3, sy = Math.max(0, (1 - im.width / (2.3 * im.height)) * 0.62 * im.height);
      c.width = c.height = 256;
      g.beginPath();
      g.arc(128, 128, 127, 0, Math.PI * 2);
      g.clip();
      g.filter = f;
      g.drawImage(im, sx, sy, sw, sw, 0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.set(key, tex);
    return tex;
  }

  private pos(p: DepthPlanet) {
    return new THREE.Vector3(p.x, -p.y, -p.depth);
  }

  setPlanets(planets: DepthPlanet[]) {
    const sig = JSON.stringify(planets.map((p) => [p.id, p.name, p.x, p.y, p.depth, p.count, p.size, p.look.filter, p.look.shape]));
    if (sig === this.sig) return;
    const first = this.planets.length === 0;
    this.sig = sig;
    this.planets = planets;
    this.rebuild();
    if (first && planets.length > 0) this.overview(0);
  }

  private rebuild() {
    this.world.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material as THREE.Material | undefined;
      mat?.dispose();
    });
    this.world.clear();
    this.labels.innerHTML = "";
    this.nodes.clear();
    this.planets.forEach((p, idx) => {
      const r = p.size / 2;
      const g = new THREE.Group();
      g.position.copy(this.pos(p));
      const mesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.photo(p), transparent: true, opacity: p.count ? 1 : 0.7, depthWrite: false }));
      if (p.look.shape === "ring") {
        const wd = (r * 2) / 0.492;
        mesh.scale.set(wd, (wd * this.img.ring.height) / this.img.ring.width, 1);
        mesh.center.set(0.501, 0.512);
      } else if (p.look.shape === "nebula") mesh.scale.set(r * 4.2, r * 4.2, 1);
      else mesh.scale.set(r * 2, r * 2, 1);
      g.add(mesh);
      // 기록 = 행성 둘레를 도는 점 (최대 12개)
      const orbit = new THREE.Group();
      orbit.rotation.set(1.15, 0, 0.35 + hash(idx, 7));
      const n = Math.min(12, p.count);
      const dotMat = new THREE.MeshBasicMaterial({ color: p.look.accentHex, transparent: true });
      const k = p.look.shape === "ring" ? 2.5 : 1.45;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, rr = r * (k + hash(i, idx) * 0.45);
        const d = new THREE.Mesh(new THREE.SphereGeometry(Math.max(2.5, r * 0.045), 8, 8), dotMat);
        d.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0);
        orbit.add(d);
      }
      g.add(orbit);
      const pick = new THREE.Mesh(new THREE.SphereGeometry(r * (p.look.shape === "nebula" ? 1.4 : 1.15), 12, 8), new THREE.MeshBasicMaterial({ visible: false }));
      pick.userData.id = p.id;
      g.add(pick);
      this.world.add(g);

      const label = document.createElement("button");
      label.type = "button";
      label.className = "depth__label";
      label.innerHTML = `<span class="depth__name"></span><span class="depth__count" style="color:${p.look.accentHex}"></span>`;
      (label.children[0] as HTMLElement).textContent = p.name;
      (label.children[1] as HTMLElement).textContent = `${p.look.unit} ${p.count}`;
      label.setAttribute("aria-label", `${p.name}, ${p.look.unit} ${p.count}개. 눌러서 착륙`);
      label.onpointerdown = (e) => e.stopPropagation();
      label.onclick = (e) => {
        e.stopPropagation();
        this.openPlanet(p.id);
      };
      this.labels.appendChild(label);
      this.nodes.set(p.id, { p, g, orbit, sprite: mesh, dotMat, blur: 0, level: 0, pick, label, at: g.position, sx: 0, sy: 0, pr: 0, vis: false });
    });
    this.rebuildLinks();
  }

  /** 별자리 선 · 이름표 (README 6-1): 행성 사이 흰 실선(투명도 0.4)과 검정 알약 이름표. 이름표를 누르면 별자리 기록 창 */
  setLinks(paths: LinkPath[]) {
    this.linkPaths = paths;
    this.rebuildLinks();
  }

  private rebuildLinks() {
    this.lines.traverse((o) => {
      const m = o as THREE.Line;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    this.lines.clear();
    this.marks.forEach((m) => m.el.remove());
    this.marks = [];
    for (const s of segmentsOf(this.linkPaths)) {
      const a = this.nodes.get(s.a);
      const b = this.nodes.get(s.b);
      if (!a || !b) continue;
      this.lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a.at.clone(), b.at.clone()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })));
    }
    for (const m of marksOf(this.linkPaths)) {
      const a = this.nodes.get(m.a);
      const b = this.nodes.get(m.b);
      if (!a || !b) continue;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "depth__linkmark";
      el.title = "별자리의 기록 보기";
      el.textContent = m.name;
      el.onpointerdown = (e) => e.stopPropagation();
      el.onclick = (e) => {
        e.stopPropagation();
        store.getState().openLinkView(m.linkId);
      };
      this.labels.appendChild(el);
      this.marks.push({ el, a: a.at.clone(), b: b.at.clone(), stack: m.stack, solo: m.solo ? a : null });
    }
  }

  private openPlanet(id: string) {
    const n = this.nodes.get(id);
    if (!n) return;
    if (n.p.count > 0) void store.getState().flyToPlanet(id, "openPanel");
    else store.getState().openPanel(id); // 0개 행성은 날아가지 않고 패널만 (POLICY 2-5)
  }

  private bgTap() {
    const s = store.getState();
    if (s.selectedPlanetId || s.selectedStarId) s.closePanel();
    this.overview(1100);
  }

  private forward() {
    const { yaw, pitch } = this.cam;
    return new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  }

  private angles(from: THREE.Vector3, to: THREE.Vector3) {
    const d = to.clone().sub(from).normalize();
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(Math.max(-1, Math.min(1, d.y))) };
  }

  private cancelFly() {
    const f = this.cam.fly;
    if (!f) return;
    this.cam.fly = null;
    f.done?.(false);
  }

  private pose(pos: THREE.Vector3, a: { yaw: number; pitch: number }, ms: number, warp: boolean, done?: (arrived: boolean) => void) {
    this.cancelFly();
    this.cam.vel.set(0, 0, 0);
    if (!ms) {
      this.cam.pos.copy(pos);
      this.cam.yaw = a.yaw;
      this.cam.pitch = a.pitch;
      done?.(true);
      return;
    }
    let dy = a.yaw - this.cam.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.cam.fly = { t: 0, ms, p0: this.cam.pos.clone(), p1: pos.clone(), y0: this.cam.yaw, y1: this.cam.yaw + dy, x0: this.cam.pitch, x1: a.pitch, warp, done };
  }

  flyTo(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      const p = this.planets.find((x) => x.id === id);
      if (!p) return resolve(false);
      const C = this.pos(p), dist = (p.size / 2) * 4.4 + 140;
      const dir = this.cam.pos.clone().sub(C);
      dir.y *= 0.25;
      if (dir.lengthSq() < 1) dir.set(0, 0, 1);
      dir.normalize().lerp(new THREE.Vector3(0, 0.12, 1), 0.6).normalize();
      const pos = C.clone().addScaledVector(dir, dist);
      this.pose(pos, this.angles(pos, C), 1100, true, resolve);
    });
  }

  overview(ms: number) {
    const ps = this.planets;
    if (!ps.length) {
      this.fit = { center: new THREE.Vector3(0, 0, 0), dist: 1600 };
      return this.pose(new THREE.Vector3(0, 0, 1600), { yaw: 0, pitch: 0 }, ms, false);
    }
    const lo = new THREE.Vector3(Infinity, Infinity, Infinity), hi = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    ps.forEach((p) => {
      const c = this.pos(p), r = p.size;
      lo.min(c.clone().subScalar(r));
      hi.max(c.clone().addScalar(r));
    });
    const c = lo.clone().add(hi).multiplyScalar(0.5), ex = hi.x - lo.x, ey = hi.y - lo.y;
    const asp = Math.max(200, (this.host.clientWidth || 16) - this.occupied()) / (this.host.clientHeight || 9);
    const D = ((Math.max(ex / asp, ey) * 0.5) / Math.tan((FOV * Math.PI) / 360)) * 1.15 + 200;
    const pos = new THREE.Vector3(c.x, c.y + ey * 0.08, hi.z + D);
    this.fit = { center: c.clone(), dist: pos.distanceTo(c) };
    this.pose(pos, this.angles(pos, c), ms, false);
  }

  /** 앞뒤로 한 걸음 (확대 조절 버튼) */
  dolly(dir: number) {
    this.cancelFly();
    this.wheel += dir * 900;
  }

  /** 확대 조절의 배율(%)을 알린다. 값이 바뀔 때만, 0.1초에 한 번까지 (매 프레임 화면을 다시 그리지 않게) */
  private reportPercent(now: number) {
    if (now - this.pctAt < 100) return;
    const pct = Math.max(1, Math.round((this.fit.dist / Math.max(1, this.cam.pos.distanceTo(this.fit.center))) * 100));
    if (pct === this.pct) return;
    this.pct = pct;
    this.pctAt = now;
    const z = viewApi.getState().zoom;
    if (z) viewApi.setState({ zoom: { ...z, percent: pct } });
  }

  private occupied() {
    const s = store.getState();
    return rightOccupied(this.host.clientWidth, s.selectedPlanetId !== null || s.selectedStarId !== null);
  }

  private frame(now: number) {
    this.raf = requestAnimationFrame((t) => this.frame(t));
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    if (w !== this.sw || h !== this.sh) {
      this.sw = w;
      this.sh = h;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
    }
    const cam = this.cam;
    let warp = 0;
    if (cam.fly) {
      const f = cam.fly;
      f.t = Math.min(1, f.t + (dt * 1000) / f.ms);
      const k = ease(f.t);
      cam.pos.lerpVectors(f.p0, f.p1, k);
      cam.yaw = f.y0 + (f.y1 - f.y0) * k;
      cam.pitch = f.x0 + (f.x1 - f.x0) * k;
      if (f.warp) warp = Math.sin(Math.PI * f.t);
      if (f.t >= 1) {
        cam.fly = null;
        f.done?.(true);
      }
      this.wheel = 0;
    } else {
      const fwd = this.forward(), right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
      const want = new THREE.Vector3();
      if (this.keys.has("w")) want.add(fwd);
      if (this.keys.has("s")) want.sub(fwd);
      if (this.keys.has("d")) want.add(right);
      if (this.keys.has("a")) want.sub(right);
      if (this.keys.has(" ")) want.y += 1;
      if (this.keys.has("shift")) want.y -= 1;
      if (want.lengthSq()) want.normalize().multiplyScalar(SPEED);
      cam.vel.lerp(want, 1 - Math.exp(-dt * 4));
      if (this.wheel) {
        cam.vel.addScaledVector(fwd, this.wheel);
        this.wheel = 0;
      }
      cam.pos.addScaledVector(cam.vel, dt);
    }
    // 시야각: 빠를수록, 워프 중일수록 넓어진다
    const target = FOV + Math.min(1.6, cam.vel.length() / SPEED) * 14 + warp * 30;
    cam.fov += (target - cam.fov) * (1 - Math.exp(-dt * 6));
    this.camera.fov = cam.fov;
    // 오른쪽 창·패널이 가린 만큼 화면 중심을 왼쪽으로 민다
    this.occ += (this.occupied() - this.occ) * (1 - Math.exp(-dt * 5));
    this.camera.setViewOffset(w, h, this.occ / 2, 0, w, h);
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(cam.pos);
    this.camera.rotation.set(cam.pitch, cam.yaw, 0, "YXZ");
    this.camera.updateMatrixWorld();
    this.stars.position.copy(cam.pos);
    this.reportPercent(now);

    let dmin = Infinity, dmax = 0;
    this.nodes.forEach((n) => {
      n.orbit.rotation.z += dt * 0.22;
      const d = cam.pos.distanceTo(n.at);
      if (d < dmin) dmin = d;
      if (d > dmax) dmax = d;
    });
    const fog = this.scene.fog as THREE.Fog;
    if (dmax) {
      fog.near = dmin * 0.9;
      fog.far = fog.near + Math.max(400, dmax - fog.near) / 0.55;
    }
    this.applyFocus(dt, cam.pos);
    this.renderer.render(this.scene, this.camera);

    // 이름표: 행성 아래. 화면 밖·뒤쪽이거나 지금 열린 행성이면 숨긴다
    const focus = store.getState().selectedPlanetId;
    const v = new THREE.Vector3();
    const pxK = h / 2 / Math.tan((this.camera.fov * Math.PI) / 360);
    this.nodes.forEach((n) => {
      v.copy(n.at).project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * w, sy = (-v.y * 0.5 + 0.5) * h;
      const pr = (n.p.size / 2 / Math.max(1, cam.pos.distanceTo(n.at))) * pxK;
      const visible = v.z <= 1 && v.z >= -1 && n.p.id !== focus && sx > -40 && sx < w - this.occ + 40 && sy > -40 && sy < h + 40;
      n.sx = sx; n.sy = sy; n.pr = pr; n.vis = visible; // 한 행성 안의 별자리 이름표가 쓴다
      if (!visible) {
        n.label.style.transform = "translate(-9999px,0)";
        return;
      }
      const lw = n.label.offsetWidth;
      n.label.style.transform = `translate(${(sx - lw / 2).toFixed(1)}px,${(sy + pr * (n.p.look.shape === "ring" ? 1.35 : 1.08) + 6).toFixed(1)}px)`;
      const f = Math.max(0, Math.min(1, (cam.pos.distanceTo(n.at) - fog.near) / (fog.far - fog.near)));
      n.label.style.opacity = (Math.max(0.72, 1 - f * 0.5) * (1 - n.blur * 0.5)).toFixed(2);
      n.label.style.filter = n.blur > 0.01 ? `blur(${(n.blur * 2.5).toFixed(2)}px)` : "";
    });
    // 별자리 이름표: 첫 선분의 가운데. 한 행성 안의 별자리는 그 행성 바로 위에서 위로 쌓는다. 화면 밖·뒤쪽이면 숨긴다
    for (const m of this.marks) {
      if (m.solo) {
        const n = m.solo;
        if (!n.vis) {
          m.el.style.transform = "translate(-9999px,0)";
          continue;
        }
        const top = n.sy - n.pr * (n.p.look.shape === "ring" ? 1.35 : 1.08) - 8 - m.stack * 26;
        m.el.style.transform = `translate(${(n.sx - m.el.offsetWidth / 2).toFixed(1)}px,${(top - m.el.offsetHeight).toFixed(1)}px)`;
        continue;
      }
      v.copy(m.a).lerp(m.b, 0.5).project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h + m.stack * 26;
      if (v.z > 1 || v.z < -1 || sx < -40 || sx > w - this.occ + 40 || sy < -40 || sy > h + 40) {
        m.el.style.transform = "translate(-9999px,0)";
        continue;
      }
      m.el.style.transform = `translate(${(sx - m.el.offsetWidth / 2).toFixed(1)}px,${(sy - m.el.offsetHeight / 2).toFixed(1)}px)`;
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.cancelFly();
    store.getState().registerFlyToPlanet(null);
    viewApi.setState({ zoom: null });
    this.cleanups.forEach((fn) => fn());
    this.world.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material | undefined)?.dispose();
    });
    this.textures.forEach((t) => t.dispose());
    this.marks.forEach((m) => m.el.remove());
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labels.remove();
  }
}
