import { ACESFilmicToneMapping, Color, HalfFloatType, Vector2, WebGLRenderTarget, WebGLRenderer, type Camera, type Scene } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/** Sinematik renk derecelendirme: sıcak ışık, soğuk gölge, hafif kontrast, vinyet, ince film greni. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as unknown },
    uVig: { value: 0.32 },
    uTime: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVig; uniform float uTime; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126,0.7152,0.0722));
      // gölgeler soğuk-mavi, aydınlıklar sıcak-altın
      vec3 shadowTint = vec3(0.90, 0.96, 1.10);
      vec3 highTint = vec3(1.08, 1.02, 0.90);
      c.rgb *= mix(shadowTint, highTint, smoothstep(0.12, 0.75, l));
      // doygunluk + S eğrisi kontrast
      c.rgb = mix(vec3(l), c.rgb, 1.16);
      c.rgb = mix(c.rgb, c.rgb * c.rgb * (3.0 - 2.0 * c.rgb), 0.35);
      vec2 d = vUv - 0.5;
      float v = smoothstep(0.85, 0.2, length(d * vec2(1.15, 1.0)));
      c.rgb *= mix(1.0 - uVig, 1.0, v);
      c.rgb += (h(vUv * 931.0 + uTime) - 0.5) * 0.012;
      gl_FragColor = c;
    }`,
};

/**
 * Sinematik son işlem: HDR render → bloom → renk derecelendirme → ACES ton eşleme.
 * Kompozitör bozulursa (ya da cihaz yavaşsa) doğrudan render'a düşer.
 */
export class CineLook {
  enabled = true;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private grade: ShaderPass | null = null;
  private w = 0;
  private h = 0;

  constructor(
    private renderer: WebGLRenderer,
    private scene: Scene,
    private camera: Camera,
    private eco: boolean,
  ) {
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
  }

  private build(): void {
    if (this.composer || this.eco || this.w < 8 || this.h < 8) return;
    try {
      const pr = this.renderer.getPixelRatio();
      const rt = new WebGLRenderTarget(this.w * pr, this.h * pr, { type: HalfFloatType, samples: 4 });
      const c = new EffectComposer(this.renderer, rt);
      c.setPixelRatio(pr);
      c.setSize(this.w, this.h);
      c.addPass(new RenderPass(this.scene, this.camera));
      this.bloom = new UnrealBloomPass(new Vector2(this.w / 2, this.h / 2), 0.28, 0.65, 0.92);
      c.addPass(this.bloom);
      c.addPass(new OutputPass());
      this.grade = new ShaderPass(GradeShader);
      c.addPass(this.grade);
      this.composer = c;
    } catch (e) {
      console.warn("CineLook composer failed, direct render", e);
      this.composer = null;
      this.enabled = false;
    }
  }

  setSize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio());
      this.composer.setSize(w, h);
    } else this.build();
  }

  tick(time: number): void {
    if (this.grade) this.grade.uniforms.uTime.value = time % 10;
  }

  render(fallback?: () => void): void {
    if (fallback && !this.enabled) {
      fallback();
      return;
    }
    if (this.composer && this.enabled) {
      this.composer.render();
      return;
    }
    if (fallback) fallback();
    else this.renderer.render(this.scene, this.camera);
  }
}

/** Gündüz ufku */
export const DAY_FOG = new Color(0x9bb4c8);
export const DAY_CLEAR = 0x87a4bc;
export const SNYDER_FOG = DAY_FOG;
export const SNYDER_CLEAR = DAY_CLEAR;
