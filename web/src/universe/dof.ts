// 3D 심도 효과: 행성을 고르면(패널 열림) 그 행성에 초점을 맞추고 앞뒤로 멀수록 흐리게 (BokehPass).
// 고른 행성이 없으면 효과를 거두고 원래대로 바로 그린다 (후처리 비용 없음).
import * as THREE from "three";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";

/** 초점에서 1단위 떨어질 때의 흐림, 가장 흐린 정도 (BokehShader 값. 화면 폭 대비) */
const APERTURE = 0.0004;
const MAX_BLUR = 0.005;

export class DepthOfField {
  private readonly composer: EffectComposer;
  private readonly bokeh: BokehPass;
  private strength = 0;
  private focus = 1;
  private readonly v = new THREE.Vector3();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));
    this.bokeh = new BokehPass(scene, camera, { focus: 1, aperture: 0, maxblur: 0 });
    this.composer.addPass(this.bokeh);
    this.composer.addPass(new OutputPass());
  }

  setSize(w: number, h: number) {
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
  }

  /** target = 초점을 맞출 곳(월드 좌표). null 이면 효과를 거둔다. 세기는 천천히 따라간다 */
  render(dt: number, target: THREE.Vector3 | null) {
    const want = target ? 1 : 0;
    this.strength += (want - this.strength) * (1 - Math.exp(-dt * 4));
    if (Math.abs(want - this.strength) < 0.01) this.strength = want;
    if (target) this.focus = Math.max(0.1, -this.v.copy(target).applyMatrix4(this.camera.matrixWorldInverse).z);
    if (this.strength <= 0) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    const u = this.bokeh.uniforms as Record<string, THREE.IUniform<number>>;
    u.focus.value = this.focus;
    u.aperture.value = APERTURE * this.strength;
    u.maxblur.value = MAX_BLUR * this.strength;
    this.composer.render(dt);
  }

  dispose() {
    this.bokeh.dispose();
    this.composer.dispose();
  }
}
