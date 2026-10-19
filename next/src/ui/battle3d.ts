import {
  ACESFilmicToneMapping,
  AmbientLight,
  CanvasTexture,
  Color,
  ConeGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { buildBandit, buildCompanion, buildSoldier } from "../render/world3d/Actors3D";
import type { HumanoidRig } from "../render/world3d/Rigs";
import { seeded } from "../render/world3d/Kit";

/** Savaş sahnesi için 3D katman: BattleField'ın glyph'lerini gerçek figürlere çevirir. */

export interface B3Item {
  key: object;
  s: 0 | 1;
  u: "spear" | "archer" | "horse";
  /** 0..1 yatay (zaten ofsetli) */
  x: number;
  /** 0..1 derinlik (0 uzak) */
  y: number;
  mv: number;
  /** 0..1 vuruş fazı, 0 = yok */
  swing: number;
  ph: number;
  /** ölü ise ölümden beri geçen ms, değilse -1 */
  age: number;
  /** yoldaş kimliği (varsa özel figür) */
  comp?: string;
}

const FW = 900;
const FD = 330;
const TINT: Record<string, number> = { bozkir: 0xb4ac78, cayir: 0x86a85c, kum: 0xd8c08a, dag: 0x9a9084 };
const SKY: Record<string, [string, string]> = { bozkir: ["#5d86b0", "#d8cfae"], cayir: ["#5a8ab8", "#cfe0e8"], kum: ["#7aa0c0", "#ecd8a8"], dag: ["#6a7e98", "#c8ccd4"] };

interface Entry {
  rig: HumanoidRig;
  seen: number;
}

export class Battle3D {
  readonly canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(32, 3.5, 20, 4000);
  private actors = new Map<object, Entry>();
  private stag = new Map<object, number>();
  private frame = 0;
  private lastMs = performance.now();
  private cw = 0;
  private ch = 0;
  private sun: DirectionalLight;
  private hemi: HemisphereLight;
  private amb: AmbientLight;
  private group = new Group();
  private t0 = performance.now();

  readonly overlay: boolean;

  constructor(ground: string, groundImg: HTMLImageElement | null, night: boolean, overlay = false) {
    this.overlay = overlay;
    this.canvas = document.createElement("canvas");
    this.renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: overlay, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = night ? 0.75 : 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;

    const [top, hor] = SKY[ground] ?? SKY.bozkir;
    const sc = document.createElement("canvas");
    sc.width = 4;
    sc.height = 128;
    const g = sc.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, night ? "#10162c" : top);
    gr.addColorStop(0.7, night ? "#2a2c44" : hor);
    gr.addColorStop(1, night ? "#2a2c44" : hor);
    g.fillStyle = gr;
    g.fillRect(0, 0, 4, 128);
    const skyTex = new CanvasTexture(sc);
    skyTex.colorSpace = SRGBColorSpace;
    if (!overlay) {
      this.scene.background = skyTex;
      this.scene.fog = new Fog(new Color(night ? 0x23263c : hor), 900, 2600);
    } else this.renderer.setClearColor(0x000000, 0);

    this.hemi = new HemisphereLight(night ? 0x5a6a9a : 0xcfe0f4, 0x6a5a40, night ? 0.5 : 0.75);
    this.amb = new AmbientLight(0xffffff, night ? 0.12 : 0.18);
    this.sun = new DirectionalLight(night ? 0x9ab0ff : 0xfff0d0, night ? 0.9 : 2.3);
    this.sun.position.set(-380, 620, 360);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 1024);
    const sh = this.sun.shadow.camera;
    sh.left = -640;
    sh.right = 640;
    sh.top = 380;
    sh.bottom = -380;
    sh.near = 50;
    sh.far = 1800;
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.hemi, this.amb, this.sun, this.sun.target, this.group);

    // zemin
    let tex: Texture | null = null;
    if (groundImg && groundImg.complete && groundImg.naturalWidth) {
      tex = new Texture(groundImg);
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(16, 9);
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      tex.needsUpdate = true;
    }
    const gm = overlay ? new ShadowMaterial({ opacity: night ? 0.3 : 0.42 }) : new MeshStandardMaterial({ color: TINT[ground] ?? TINT.bozkir, map: tex ?? undefined, roughness: 1, metalness: 0 });
    const plane = new Mesh(new PlaneGeometry(4200, 2600), gm);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.group.add(plane);

    if (!overlay) {
      this.scatter(ground);
      this.hills(ground);
    }
  }

  private scatter(ground: string): void {
    const rnd = seeded(ground.length * 977 + 11);
    const rockG = new IcosahedronGeometry(1, 0);
    const rocks = new InstancedMesh(rockG, new MeshStandardMaterial({ color: 0x8a8478, roughness: 1, flatShading: true }), 160);
    const tuftG = new ConeGeometry(0.7, 9, 4);
    tuftG.translate(0, 4.5, 0);
    const tc = ground === "kum" ? 0x9a8a50 : ground === "dag" ? 0x6a6a52 : 0x5a7a38;
    const tufts = new InstancedMesh(tuftG, new MeshStandardMaterial({ color: tc, roughness: 1 }), 900);
    const m = new Matrix4();
    const q = new Quaternion();
    const p = new Vector3();
    const s = new Vector3();
    for (let i = 0; i < 160; i++) {
      p.set((rnd() - 0.5) * 2000, 0, (rnd() - 0.5) * 900 - 100);
      const k = 3 + rnd() * rnd() * 14;
      s.set(k, k * 0.6, k);
      m.compose(p, q.setFromAxisAngle(new Vector3(0, 1, 0), rnd() * 6), s);
      rocks.setMatrixAt(i, m);
    }
    for (let i = 0; i < 900; i++) {
      p.set((rnd() - 0.5) * 2200, 0, (rnd() - 0.5) * 1100 - 100);
      const k = 0.7 + rnd() * 0.9;
      s.set(k, k, k);
      m.compose(p, q.setFromAxisAngle(new Vector3(0, 1, 0), rnd() * 6), s);
      tufts.setMatrixAt(i, m);
    }
    rocks.castShadow = true;
    rocks.receiveShadow = true;
    this.group.add(rocks, tufts);
  }

  private hills(ground: string): void {
    const rnd = seeded(77 + ground.length);
    const col = ground === "dag" ? 0x6a6660 : ground === "cayir" ? 0x5a7448 : ground === "kum" ? 0xb09a68 : 0x7a7a58;
    const mat = new MeshStandardMaterial({ color: col, roughness: 1, flatShading: true });
    for (let i = 0; i < 16; i++) {
      const r = 160 + rnd() * 320;
      const h = ground === "dag" ? 120 + rnd() * 340 : 30 + rnd() * 70;
      const hill = new Mesh(new ConeGeometry(r, h, 7), mat);
      hill.position.set(-1500 + i * 200 + rnd() * 120, h / 2 - 8, -1000 - rnd() * 500);
      hill.rotation.y = rnd() * 3;
      this.group.add(hill);
    }
  }

  private size(w: number, h: number): void {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.cw === w && this.ch === h) return;
    this.cw = w;
    this.ch = h;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    // yatay şeridin tamamı görünsün
    const half = Math.tan((this.camera.fov * Math.PI) / 360);
    const d = Math.max(380, (FW * 0.5) / (half * this.camera.aspect));
    const pitch = 0.66; // rad
    const tz = 8;
    this.camera.position.set(0, 18 + Math.sin(pitch) * d, tz + Math.cos(pitch) * d);
    this.camera.lookAt(0, 22, tz - (this.overlay ? 78 : 6));
    this.camera.updateProjectionMatrix();
  }

  private make(it: B3Item): HumanoidRig {
    const seed = Math.floor(it.ph * 1000) + 3;
    if (it.comp) return buildCompanion(it.comp);
    if (it.s === 0) return buildSoldier(it.u === "horse" ? "cav" : it.u, 0x3a62a8, seed);
    if (it.u === "horse") return buildBandit("rider", seed);
    if (it.u === "archer") return buildSoldier("archer", 0x7a2a22, seed);
    return buildBandit(seed % 3 === 0 ? "axe" : seed % 7 === 0 ? "heavy" : "sword", seed);
  }

  render(items: B3Item[], w: number, h: number): void {
    this.size(Math.max(2, w), Math.max(2, h));
    const nowMs = performance.now();
    const dt = Math.min(0.05, (nowMs - this.lastMs) / 1000);
    this.lastMs = nowMs;
    const t = (nowMs - this.t0) / 1000;
    this.frame++;
    // isabet tepkisi: savuran birimin yakınındaki rakip sendeler
    for (const a of items) {
      if (a.age >= 0 || a.swing < 0.5 || a.swing > 0.68) continue;
      let best: B3Item | null = null;
      let bd = 80;
      for (const b of items) {
        if (b.s === a.s || b.age >= 0) continue;
        const d = Math.hypot((b.x - a.x) * FW, (b.y - a.y) * FD * 1.6);
        if (d < bd) (bd = d), (best = b);
      }
      if (best) this.stag.set(best.key, 1);
    }
    for (const [k, v] of this.stag) {
      const nv = v - dt * 3.2;
      if (nv <= 0) this.stag.delete(k);
      else this.stag.set(k, nv);
    }
    for (const it of items) {
      let e = this.actors.get(it.key);
      if (!e) {
        const rig = this.make(it);
        rig.root.traverse((o) => {
          const m = o as Mesh;
          if (m.isMesh) m.receiveShadow = false;
        });
        this.group.add(rig.root);
        e = { rig, seen: this.frame };
        this.actors.set(it.key, e);
      }
      e.seen = this.frame;
      const rig = e.rig;
      const dir = it.s ? -1 : 1;
      const wx = (it.x - 0.5) * FW;
      const wz = (it.y - 0.5) * FD;
      rig.root.position.set(wx, 0, wz);
      rig.heading = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      rig.attack = it.age < 0 ? it.swing : 0;
      if (it.age >= 0) {
        const k = it.age / 900;
        rig.root.rotation.z = dir * Math.min(1, it.age / 260) * 1.45;
        rig.root.position.y = -Math.max(0, k - 0.6) * 24 + Math.min(1, it.age / 260) * 3;
        rig.update(dt, 0, t);
      } else {
        const sg = this.stag.get(it.key) ?? 0;
        rig.root.rotation.z = -dir * sg * 0.2;
        rig.root.position.x -= dir * sg * 7;
        rig.update(dt, it.mv, t);
      }
    }
    for (const [key, e] of this.actors) {
      if (e.seen !== this.frame) {
        this.group.remove(e.rig.root);
        this.actors.delete(key);
      }
    }
    this.sun.target.position.set(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) m.geometry.dispose();
    });
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
