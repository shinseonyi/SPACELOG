// SPACELOG 3D 보기 엔진 (three.js). W01_Home이 3D 보기일 때만 불러 씁니다.
// 좌표: 행성 (x, y, z) → 3D (x, -y, -z). 1 단위 = 1m.
(function () {
  let loading;
  const load = () => window.THREE ? Promise.resolve() : (loading = loading || new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = 'https://unpkg.com/three@0.149.0/build/three.min.js';
    s.onload = () => res(); s.onerror = () => { loading = null; rej(new Error('three.js를 불러오지 못했습니다')); }; document.head.appendChild(s);
  }));
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const hash = (i, n) => { const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return v - Math.floor(v); };
  const FOG = 0.00042, SPEED = 560, FOV = 50;

  function planetTexture(T, base, accent, seed) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
    const A = new T.Color(base), B = new T.Color(accent), W = new T.Color('#ffffff'), col = new T.Color();
    for (let y = 0; y < 128; y++) {
      const t = 0.5 + 0.5 * Math.sin(y * 0.11 + seed) * Math.cos(y * 0.037 + seed * 2.3), w = Math.max(0, Math.sin(y * 0.23 + seed * 5.1)) * 0.25;
      col.copy(A).lerp(B, t).lerp(W, w); g.fillStyle = '#' + col.getHexString(); g.fillRect(0, y, 256, 1);
    }
    for (let i = 0; i < 26; i++) {
      g.globalAlpha = 0.06 + hash(i, seed) * 0.1; g.fillStyle = hash(i, seed + 1) > 0.5 ? '#ffffff' : '#000000';
      g.beginPath(); g.ellipse(hash(i, seed + 2) * 256, hash(i, seed + 3) * 128, 10 + hash(i, seed + 4) * 34, 2 + hash(i, seed + 5) * 5, 0, 0, Math.PI * 2); g.fill();
    }
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; return tex;
  }

  function build(host, cb, imgs) {
    const T = window.THREE, V3 = T.Vector3;
    // 2.5D와 같은 행성 사진을 같은 영역으로 잘라 쓰고, 행성 색(필터)도 그대로 입힙니다.
    const photo = p => { const c = document.createElement('canvas'), g2 = c.getContext('2d'), f = p.filter && p.filter !== 'none' ? p.filter : 'none';
      if (p.shape === 'ring' || p.shape === 'nebula') { const im = p.shape === 'ring' ? imgs.ring : imgs.nebula; c.width = im.width; c.height = im.height; g2.filter = f; g2.drawImage(im, 0, 0); }
      else { const im = imgs.hero, sw2 = im.width / 2.3, sx = im.width * 0.637 / 2.3, sy = Math.max(0, (1 - im.width / (2.3 * im.height)) * 0.62 * im.height);
        c.width = c.height = 256; g2.beginPath(); g2.arc(128, 128, 127, 0, Math.PI * 2); g2.clip(); g2.filter = f; g2.drawImage(im, sx, sy, sw2, sw2, 0, 0, 256, 256); }
      const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; return tex; };
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputEncoding = T.sRGBEncoding; renderer.setClearColor(0x000000, 1);
    const el = renderer.domElement; el.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
    const labels = document.createElement('div'); labels.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    host.appendChild(el); host.appendChild(labels);

    const scene = new T.Scene(); scene.fog = new T.Fog(0x000000, 1, 20000);           // 거리 안개
    const camera = new T.PerspectiveCamera(FOV, 1, 1, 30000);
    scene.add(new T.AmbientLight(0xffffff, 0.42));
    const sun = new T.DirectionalLight(0xffffff, 1.15); sun.position.set(-1, 0.7, 0.9); scene.add(sun);

    const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 14, 0, Math.PI * 2); g.fill(); return new T.CanvasTexture(c); })();
    const points = (n, at, size, opacity, near) => {
      const pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const v = at(i); pos[i * 3] = v[0]; pos[i * 3 + 1] = v[1]; pos[i * 3 + 2] = v[2]; }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const pts = new T.Points(geo, new T.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, map: dotTex, alphaTest: 0.05, transparent: true, opacity, fog: near, depthWrite: false })); pts.frustumCulled = false; return pts;
    };
    // 먼 별(카메라를 따라다녀 무한히 멀게 보임)과 가까운 먼지(지나가며 시차를 만듦)
    const stars = points(1400, i => { const u = hash(i, 1) * 2 - 1, th = hash(i, 2) * Math.PI * 2, s = Math.sqrt(1 - u * u); return [9000 * s * Math.cos(th), 9000 * u, 9000 * s * Math.sin(th)]; }, 1.6, 0.8, false);
    const dust = points(520, i => [(hash(i, 3) - 0.5) * 7000, (hash(i, 4) - 0.5) * 4200, (hash(i, 5) - 0.5) * 7000 - 600], 2.6, 0.5, true);
    scene.add(stars, dust);

    const world = new T.Group(), lines = new T.Group(); scene.add(world, lines);
    const nodes = new Map(); let marks = [];
    let data = { planets: [], links: [], guides: [] }, sig = '', active = true, enabled = true, disposed = false, nebula = null;
    const cam = { pos: new V3(0, 0, 1600), yaw: 0, pitch: 0, vel: new V3(), fov: FOV, fly: null };
    const keys = {}; let wheel = 0, sw = 0, sh = 0, occ = 0, blocks = [], tick = 0;
    const P = p => new V3(p.x, -p.y, -p.z);
    const angles = (from, to) => { const d = to.clone().sub(from).normalize(); return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(Math.max(-1, Math.min(1, d.y))) }; };

    const free = g => { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map !== nebula) o.material.map.dispose(); o.material.dispose(); } }); while (g.children.length) g.remove(g.children[0]); };
    const pill = (text, onClick) => {
      const b = document.createElement(onClick ? 'button' : 'span'); b.textContent = text;
      b.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-9999px,0);white-space:nowrap;padding:3px 10px;border-radius:9999px;background:#000;border:1px solid rgba(255,255,255,0.24);color:#fff;font:400 12px/1.4 var(--font-text);font-variant-numeric:tabular-nums;pointer-events:' + (onClick ? 'auto;cursor:pointer' : 'none');
      if (onClick) { b.type = 'button'; b.onpointerdown = e => e.stopPropagation(); b.onclick = e => { e.stopPropagation(); onClick(); }; }
      labels.appendChild(b); return b;
    };

    function rebuild() {
      free(world); free(lines); labels.innerHTML = ''; nodes.clear(); marks = [];
      const shared = new Set((data.guides || []).map(g => [g.from, g.to].sort().join('|')));
      const byId = {}; data.planets.forEach(p => { byId[p.id] = p; });
      data.planets.forEach((p, idx) => {
        const g = new T.Group(); g.position.copy(P(p)); const dim = p.count ? 1 : 0.7, spin = false;
        const mesh = new T.Sprite(new T.SpriteMaterial({ map: photo(p), transparent: true, opacity: dim, depthWrite: false }));
        if (p.shape === 'ring') { const wd = p.r * 2 / 0.492; mesh.scale.set(wd, wd * imgs.ring.height / imgs.ring.width, 1); mesh.center.set(0.501, 0.512); }
        else if (p.shape === 'nebula') mesh.scale.set(p.r * 4.2, p.r * 4.2, 1);
        else mesh.scale.set(p.r * 2, p.r * 2, 1);
        g.add(mesh);
        // 기록 = 행성 둘레를 도는 점 (최대 12개)
        const orbit = new T.Group(); orbit.rotation.set(1.15, 0, 0.35 + hash(idx, 7));
        const n = Math.min(12, p.count), dotMat = new T.MeshBasicMaterial({ color: p.accent }), k = p.shape === 'ring' ? 2.5 : 1.45;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = p.r * (k + hash(i, idx) * 0.45), d = new T.Mesh(new T.SphereGeometry(Math.max(2.5, p.r * 0.045), 8, 8), dotMat); d.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0); orbit.add(d); }
        g.add(orbit);
        const pick = new T.Mesh(new T.SphereGeometry(p.r * (p.shape === 'nebula' ? 1.4 : 1.15), 12, 8), new T.MeshBasicMaterial({ visible: false })); pick.userData.id = p.id; g.add(pick);
        world.add(g);
        const lb = document.createElement('button'); lb.type = 'button';
        lb.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-9999px,0);display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 8px;border:0;background:none;cursor:pointer;pointer-events:auto;white-space:nowrap';
        const a = document.createElement('span'), b = document.createElement('span');
        a.textContent = p.name; a.style.cssText = 'font:600 14px/1.3 var(--font-text);color:#fff';
        b.textContent = p.unit + ' ' + p.count; b.style.cssText = 'font:400 12px/1.3 var(--font-text);color:' + p.accent;
        lb.appendChild(a); lb.appendChild(b); lb.setAttribute('aria-label', p.name + ', ' + p.unit + ' ' + p.count + '개. 눌러서 착륙');
        lb.onpointerdown = e => e.stopPropagation(); lb.onclick = e => { e.stopPropagation(); cb.onPick && cb.onPick(p.id); };
        labels.appendChild(lb);
        nodes.set(p.id, { p, g, mesh, orbit, pick, lb, el: lb, spin, at: g.position });
      });
      // 별자리 선
      (data.links || []).forEach(l => { for (let i = 0; i < l.ids.length - 1; i++) { const a = byId[l.ids[i]], b = byId[l.ids[i + 1]]; if (!a || !b) continue;
        lines.add(new T.Line(new T.BufferGeometry().setFromPoints([P(a), P(b)]), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })));
        if (i === 0) marks.push({ A: P(a), B: P(b), at: P(a).lerp(P(b), 0.5), el: pill(l.name, () => cb.onLink && cb.onLink(l.id)) }); } });
      // 거리 선: 점선 + 100m마다 눈금 + 가운데 숫자
      (data.guides || []).forEach((gd, gi) => { const a = byId[gd.from], b = byId[gd.to]; if (!a || !b) return; const A = P(a), B = P(b), len = A.distanceTo(B);
        const ln = new T.Line(new T.BufferGeometry().setFromPoints([A, B]), new T.LineDashedMaterial({ color: 0xffffff, dashSize: 14, gapSize: 10, transparent: true, opacity: 0.55 })); ln.computeLineDistances(); lines.add(ln);
        const ticks = []; for (let d = 100; d < len; d += 100) ticks.push(A.clone().lerp(B, d / len));
        if (ticks.length) lines.add(new T.Points(new T.BufferGeometry().setFromPoints(ticks), new T.PointsMaterial({ color: 0xffffff, size: 4, sizeAttenuation: false, transparent: true, opacity: 0.9 })));
        if (gi === 0) marks.push({ at: A.clone().lerp(B, 0.36), dy: -30, el: pill(gd.text) }); });
    }

    function pose(pos, a, ms, warp) {
      cam.vel.set(0, 0, 0);
      if (!ms) { cam.pos.copy(pos); cam.yaw = a.yaw; cam.pitch = a.pitch; cam.fly = null; return; }
      let dy = a.yaw - cam.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      cam.fly = { t: 0, ms, p0: cam.pos.clone(), p1: pos.clone(), y0: cam.yaw, y1: cam.yaw + dy, x0: cam.pitch, x1: a.pitch, warp };
    }
    function flyTo(id, ms) {
      const p = data.planets.find(x => x.id === id); if (!p) return;
      const C = P(p), dist = p.r * 4.4 + 140, dir = cam.pos.clone().sub(C); dir.y *= 0.25; if (dir.lengthSq() < 1) dir.set(0, 0, 1);
      dir.normalize().lerp(new V3(0, 0.12, 1), 0.6).normalize();
      const pos = C.clone().addScaledVector(dir, dist), right = new V3().crossVectors(dir.clone().negate(), new V3(0, 1, 0)).normalize();
      pose(pos, angles(pos, C), ms === undefined ? 1100 : ms, true);
    }
    function overview(ms) {
      const ps = data.planets; if (!ps.length) { pose(new V3(0, 0, 1600), { yaw: 0, pitch: 0 }, ms, false); return; }
      const lo = new V3(Infinity, Infinity, Infinity), hi = new V3(-Infinity, -Infinity, -Infinity);
      ps.forEach(p => { const c = P(p), r = p.r * 2; lo.min(c.clone().subScalar(r)); hi.max(c.clone().addScalar(r)); });
      const c = lo.clone().add(hi).multiplyScalar(0.5), ex = hi.x - lo.x, ey = hi.y - lo.y, asp = Math.max(200, (host.clientWidth || 16) - (data.occ || 0) - (data.occL || 0)) / (host.clientHeight || 9);
      const D = Math.max(ex / asp, ey) * 0.5 / Math.tan(FOV * Math.PI / 360) * 1.15 + 200, pos = new V3(c.x, c.y + ey * 0.08, hi.z + D);
      pose(pos, angles(pos, c), ms === undefined ? 1100 : ms, false);
    }

    const fwd = new V3(), right = new V3(), want = new V3(), up = new V3(0, 1, 0), tmp = new V3(), tmp2 = new V3(), camUp = new V3();
    let last = performance.now(), raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!active || disposed) return;
      const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      if (w !== sw || h !== sh) { sw = w; sh = h; renderer.setSize(w, h, false); camera.aspect = w / h; }
      let warp = 0;
      if (cam.fly) { const f = cam.fly; f.t = Math.min(1, f.t + dt * 1000 / f.ms); const k = ease(f.t);
        cam.pos.lerpVectors(f.p0, f.p1, k); cam.yaw = f.y0 + (f.y1 - f.y0) * k; cam.pitch = f.x0 + (f.x1 - f.x0) * k;
        if (f.warp) warp = Math.sin(Math.PI * f.t); if (f.t >= 1) cam.fly = null; wheel = 0;
      } else {
        fwd.set(-Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch)); right.crossVectors(fwd, up).normalize();
        want.set(0, 0, 0);
        if (enabled) { if (keys.w) want.add(fwd); if (keys.s) want.sub(fwd); if (keys.d) want.add(right); if (keys.a) want.sub(right); if (keys[' ']) want.y += 1; if (keys.shift) want.y -= 1; }
        if (want.lengthSq()) want.normalize().multiplyScalar(SPEED);
        cam.vel.lerp(want, 1 - Math.exp(-dt * 4)); if (wheel) { cam.vel.addScaledVector(fwd, wheel); wheel = 0; }
        cam.pos.addScaledVector(cam.vel, dt);
      }
      // 시야각 동적 제어: 빠를수록, 워프 중일수록 넓어집니다.
      const target = FOV + Math.min(1.6, cam.vel.length() / SPEED) * 14 + warp * 30;
      cam.fov += (target - cam.fov) * (1 - Math.exp(-dt * 6)); camera.fov = cam.fov;
      occ += ((data.occ || 0) - (data.occL || 0) - occ) * (1 - Math.exp(-dt * 5)); camera.setViewOffset(w, h, occ / 2, 0, w, h);
      camera.position.copy(cam.pos); camera.rotation.set(cam.pitch, cam.yaw, 0, 'YXZ'); camera.updateMatrixWorld(); stars.position.copy(cam.pos);
      nodes.forEach(n => { if (n.spin) n.mesh.rotation.y += dt * 0.12; n.orbit.rotation.z += dt * 0.22; });
      let dmin = Infinity, dmax = 0; nodes.forEach(n => { const d = cam.pos.distanceTo(n.at); if (d < dmin) dmin = d; if (d > dmax) dmax = d; });
      if (dmax) { scene.fog.near = dmin * 0.9; scene.fog.far = scene.fog.near + Math.max(400, dmax - scene.fog.near) / 0.55; }
      renderer.render(scene, camera);
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      // 화면 위 UI(문서 전체의 버튼·카드·목록)의 영역을 읽어 이름표가 그 밑에 깔리지 않게 합니다.
      if (!(tick++ % 15)) { const hr = host.getBoundingClientRect(); blocks = [];
        host.ownerDocument.querySelectorAll('button, aside, header, nav, [data-screen-label]').forEach(x => { if (x === host || host.contains(x) || x.contains(host)) return; const r = x.getBoundingClientRect();
          if (r.width < 2 || r.height < 2 || r.right < hr.left || r.left > hr.right || r.bottom < hr.top || r.top > hr.bottom || r.width * r.height > hr.width * hr.height * 0.6) return;
          blocks.push([r.left - hr.left, r.top - hr.top, r.right - hr.left, r.bottom - hr.top]); }); }
      const placed = blocks.slice(), hide = x => { x.style.transform = 'translate(-9999px,0)'; };
      const cut = (r, q) => r[0] < q[2] - 2 && r[2] > q[0] + 2 && r[1] < q[3] - 2 && r[3] > q[1] + 2, clash = r => placed.some(q => cut(r, q));
      const size = o => { if (!o.w) { o.w = o.el.offsetWidth; o.h = o.el.offsetHeight; } };
      const show = (o, r, at) => { placed.push(r); o.el.style.transform = 'translate(' + r[0].toFixed(1) + 'px,' + r[1].toFixed(1) + 'px)';
        if (at) { const f = Math.max(0, Math.min(1, (cam.pos.distanceTo(at) - scene.fog.near) / (scene.fog.far - scene.fog.near))); o.el.style.opacity = Math.max(0.72, 1 - f * 0.5).toFixed(2); } };
      const list = [...nodes.values()].sort((a, b) => cam.pos.distanceToSquared(a.at) - cam.pos.distanceToSquared(b.at)), limit = w - (data.occ || 0) - 8, pxK = (h / 2) / Math.tan(camera.fov * Math.PI / 360);
      list.forEach(n => { tmp.copy(n.at).project(camera); n.vis = tmp.z <= 1 && tmp.z >= -1; n.sx = (tmp.x * 0.5 + 0.5) * w; n.sy = (-tmp.y * 0.5 + 0.5) * h; n.pr = n.p.r / Math.max(1, cam.pos.distanceTo(n.at)) * pxK;
        const k = n.p.shape === 'ring' ? 2.2 : n.p.shape === 'nebula' ? 1.6 : 1; n.disc = [n.sx - n.pr * k, n.sy - n.pr, n.sx + n.pr * k, n.sy + n.pr]; });
      // 행성 이름표: 아래 → 위 → 오른쪽 → 왼쪽 순으로 빈자리를 찾고, 모두 막혔을 때만 숨깁니다.
      list.forEach(n => { if (!n.vis || n.p.id === data.focusId || n.sx > limit) return hide(n.el); size(n);
        const g = 6, v = n.pr * (n.p.shape === 'ring' ? 1.35 : 1.08), hz = (n.disc[2] - n.disc[0]) / 2;
        const tries = [[n.sx - n.w / 2, n.sy + v + g], [n.sx - n.w / 2, n.sy - v - g - n.h], [n.sx + hz + g, n.sy - n.h / 2], [n.sx - hz - g - n.w, n.sy - n.h / 2]];
        for (const c of tries) { const r = [c[0], c[1], c[0] + n.w, c[1] + n.h];
          if (r[0] < 0 || r[1] < 0 || r[2] > limit + 8 || r[3] > h || clash(r) || list.some(m => m !== n && m.vis && cut(r, m.disc))) continue; return show(n, r, n.at); }
        hide(n.el); });
      list.forEach(n => { if (n.vis) placed.push(n.disc); });
      marks.forEach(m => { size(m);
        const at = (v, dy) => { tmp.copy(v).project(camera); const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h + dy; if (tmp.z > 1 || tmp.z < -1 || x > limit) return null; const top = dy ? y : y - m.h / 2; return [x - m.w / 2, top, x + m.w / 2, top + m.h]; };
        if (m.A) { let first = null;
          for (const k of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) for (const dy of [0, -24, 12]) { const r = at(tmp2.copy(m.A).lerp(m.B, k), dy); if (!r) continue; first = first || r; if (!clash(r)) return show(m, r); }
          return first ? show(m, first) : hide(m.el); }
        const r = at(m.at, m.dy || 0); if (!r || clash(r)) return hide(m.el); show(m, r); });
    }

    // 입력: 드래그 = 시점 회전, 휠 = 앞뒤 이동, 클릭 = 행성 고르기
    const ray = new T.Raycaster(); let drag = null;
    const down = e => { if (e.button !== 0) return; e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; try { el.setPointerCapture(e.pointerId); } catch (x) {} el.style.cursor = 'grabbing'; };
    const move = e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) drag.moved = true; if (!drag.moved) return;
      cam.fly = null; cam.yaw += dx * 0.0035; cam.pitch = Math.max(-1.3, Math.min(1.3, cam.pitch + dy * 0.0035)); };
    const upH = e => { if (!drag) return; const d = drag; drag = null; el.style.cursor = 'grab'; if (d.moved) return;
      const r = el.getBoundingClientRect(); ray.setFromCamera({ x: (e.clientX - r.left) / r.width * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera);
      const hit = ray.intersectObjects([...nodes.values()].map(n => n.pick), false)[0];
      if (hit) cb.onPick && cb.onPick(hit.object.userData.id); else cb.onBg && cb.onBg(); };
    const wheelH = e => { e.preventDefault(); e.stopPropagation(); cam.fly = null; wheel += -e.deltaY * 6; };
    const keyName = e => e.key === 'Shift' ? 'shift' : (e.key || '').toLowerCase();
    const kd = e => { if (!active || !enabled || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.metaKey || e.ctrlKey || e.altKey) return; const k = keyName(e);
      if (k === 'e') { let best = null; fwd.set(-Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), -Math.cos(cam.yaw) * Math.cos(cam.pitch));
        nodes.forEach(n => { const v = n.at.clone().sub(cam.pos), d = v.length(); if (v.dot(fwd) > 0 && (!best || d < best.d)) best = { d, id: n.p.id }; }); if (best) cb.onPick && cb.onPick(best.id); return; }
      if (['w', 'a', 's', 'd', ' ', 'shift'].includes(k)) { keys[k] = true; cam.fly = null; if (k === ' ') e.preventDefault(); } };
    const ku = e => { keys[keyName(e)] = false; };
    const blur = () => { Object.keys(keys).forEach(k => { keys[k] = false; }); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', upH); el.addEventListener('pointercancel', () => { drag = null; });
    el.addEventListener('wheel', wheelH, { passive: false });
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
    raf = requestAnimationFrame(frame);

    return {
      setData(d) { data = d || data; const s2 = JSON.stringify([data.planets, data.links, data.guides]); if (s2 !== sig) { sig = s2; rebuild(); } enabled = data.keys !== false; if (!enabled) blur(); },
      setActive(a) { active = !!a; if (!active) blur(); },
      flyTo, overview,
      dolly(dir) { cam.fly = null; wheel += dir * 900; },
      dispose() { disposed = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur);
        free(world); free(lines); renderer.dispose(); if (el.parentNode) el.parentNode.removeChild(el); if (labels.parentNode) labels.parentNode.removeChild(labels); }
    };
  }

  const img = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
  window.SPACELOG3D = { create: (host, cb) => load().then(() => Promise.all([img('assets/planet-hero.png'), img('assets/planet-ring.png'), img('assets/planet-nebula.png')])).then(([hero, ring, nebula]) => build(host, cb || {}, { hero, ring, nebula })) };
})();
