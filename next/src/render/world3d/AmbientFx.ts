import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, Group, MathUtils, Points, PointsMaterial, Sprite, SpriteMaterial, type Texture } from "three";

/**
 * Harita atmosferi: kahraman yürürken ayak tozu, kamera çevresinde süzülen toz/polen zerrecikleri.
 * Küçük sabit havuzlar kullanır (yeni nesne üretmez), eco modunda hiç kurulmaz.
 */

let softTex: Texture | null = null;
function soft(): Texture {
  if (softTex) return softTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,0.95)");
  gr.addColorStop(0.45, "rgba(255,255,255,0.35)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  softTex = new CanvasTexture(c);
  return softTex;
}

interface Puff {
  s: Sprite;
  life: number;
  max: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
}

const PUFFS = 26;
const MOTES = 140;
const BIRDS = 9;
const BOX = 900;

let birdTex: Texture | null = null;
function birdMap(): Texture {
  if (birdTex) return birdTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, 64, 64);
  g.strokeStyle = "rgba(28, 22, 16, 0.85)";
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(8, 36);
  g.quadraticCurveTo(32, 8, 56, 36);
  g.stroke();
  birdTex = new CanvasTexture(c);
  return birdTex;
}

interface Bird {
  s: Sprite;
  a: number;
  r: number;
  h: number;
  w: number;
  ph: number;
}

export class AmbientFx {
  readonly group = new Group();
  private puffs: Puff[] = [];
  private motes: Points;
  private mpos: Float32Array;
  private mvel: Float32Array;
  private birds: Bird[] = [];
  private next = 0;
  private emitT = 0;
  private t = 0;
  private lx = Number.NaN;
  private lz = Number.NaN;
  private seed = 1;

  constructor() {
    for (let i = 0; i < PUFFS; i++) {
      const m = new SpriteMaterial({ map: soft(), color: 0xcbb68a, transparent: true, opacity: 0, depthWrite: false });
      const s = new Sprite(m);
      s.visible = false;
      s.renderOrder = 5;
      this.group.add(s);
      this.puffs.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: 20 });
    }
    this.mpos = new Float32Array(MOTES * 3);
    this.mvel = new Float32Array(MOTES * 3);
    for (let i = 0; i < MOTES; i++) {
      this.mpos[i * 3] = (this.rnd() - 0.5) * BOX * 2;
      this.mpos[i * 3 + 1] = 10 + this.rnd() * 150;
      this.mpos[i * 3 + 2] = (this.rnd() - 0.5) * BOX * 2;
      this.mvel[i * 3] = 6 + this.rnd() * 8;
      this.mvel[i * 3 + 1] = (this.rnd() - 0.5) * 3;
      this.mvel[i * 3 + 2] = (this.rnd() - 0.5) * 5;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(this.mpos, 3));
    const mat = new PointsMaterial({ map: soft(), color: 0xffe9b0, size: 7, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false, blending: AdditiveBlending });
    this.motes = new Points(geo, mat);
    this.motes.frustumCulled = false;
    this.motes.renderOrder = 6;
    this.group.add(this.motes);
    for (let i = 0; i < BIRDS; i++) {
      const m = new SpriteMaterial({ map: birdMap(), color: 0x1c1610, transparent: true, opacity: 0.72, depthWrite: false });
      const s = new Sprite(m);
      s.renderOrder = 7;
      this.group.add(s);
      this.birds.push({ s, a: this.rnd() * 6.28, r: 220 + this.rnd() * 520, h: 70 + this.rnd() * 140, w: 0.18 + this.rnd() * 0.22, ph: this.rnd() * 6 });
    }
  }

  private rnd(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }

  /**
   * @param hx,hz kahramanın dünya konumu; @param cx,cz kamera odağı; @param groundY(x,z) zemin yüksekliği
   * @param day 0..1 gün ışığı (gece tozu azaltır)
   */
  update(dt: number, hx: number, hz: number, cx: number, cz: number, groundY: (x: number, z: number) => number, day: number, zoomNear: number): void {
    // — ayak tozu
    this.t += dt;
    const t = this.t;
    const moved = Number.isNaN(this.lx) ? 0 : Math.hypot(hx - this.lx, hz - this.lz);
    const speed = dt > 0 ? moved / dt : 0;
    this.lx = hx;
    this.lz = hz;
    if (moved > 120) this.emitT = 0; // ışınlanma: iz bırakma
    else if (speed > 12) {
      this.emitT -= dt;
      if (this.emitT <= 0) {
        this.emitT = 0.11;
        const p = this.puffs[this.next++ % PUFFS]!;
        p.life = p.max = 0.9 + this.rnd() * 0.5;
        p.size = 22 + this.rnd() * 16;
        p.vx = (this.rnd() - 0.5) * 12;
        p.vz = (this.rnd() - 0.5) * 12;
        p.vy = 14 + this.rnd() * 10;
        p.s.position.set(hx + (this.rnd() - 0.5) * 22, groundY(hx, hz) + 5, hz + (this.rnd() - 0.5) * 22);
        p.s.visible = true;
      }
    }
    for (const p of this.puffs) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.s.visible = false;
        continue;
      }
      const k = p.life / p.max;
      p.s.position.x += p.vx * dt;
      p.s.position.y += p.vy * dt;
      p.s.position.z += p.vz * dt;
      p.s.scale.setScalar(p.size * (1.6 - k * 0.8));
      (p.s.material as SpriteMaterial).opacity = Math.min(0.32, k * 0.4);
    }

    // — süzülen zerrecikler (kameraya göre sarılır)
    const pa = this.mpos;
    const gy = groundY(cx, cz);
    for (let i = 0; i < MOTES; i++) {
      const j = i * 3;
      pa[j]! += this.mvel[j]! * dt;
      pa[j + 1]! += this.mvel[j + 1]! * dt + Math.sin((pa[j]! + pa[j + 2]!) * 0.01 + i) * 0.1;
      pa[j + 2]! += this.mvel[j + 2]! * dt;
      if (pa[j]! > BOX) pa[j]! -= BOX * 2;
      if (pa[j]! < -BOX) pa[j]! += BOX * 2;
      if (pa[j + 2]! > BOX) pa[j + 2]! -= BOX * 2;
      if (pa[j + 2]! < -BOX) pa[j + 2]! += BOX * 2;
      if (pa[j + 1]! > 170) pa[j + 1]! = 10;
      if (pa[j + 1]! < 6) pa[j + 1]! = 150;
    }
    this.motes.position.set(cx, gy, cz);
    this.motes.geometry.attributes.position!.needsUpdate = true;
    const mat = this.motes.material as PointsMaterial;
    mat.opacity = MathUtils.clamp(day, 0.2, 1) * 0.32 * MathUtils.clamp(zoomNear, 0, 1);
    mat.size = 5 + zoomNear * 6;

    const vis = MathUtils.clamp(day, 0.15, 1) * MathUtils.clamp(zoomNear * 1.4, 0.2, 1);
    for (const b of this.birds) {
      b.a += b.w * dt;
      const flap = 0.72 + Math.sin(t * 9 + b.ph) * 0.18;
      const x = cx + Math.cos(b.a) * b.r;
      const z = cz + Math.sin(b.a) * b.r * 0.62;
      const y = gy + b.h + Math.sin(b.a * 2 + b.ph) * 14;
      b.s.position.set(x, y, z);
      b.s.scale.set(18 * flap, 10, 1);
      (b.s.material as SpriteMaterial).opacity = vis * 0.7;
      b.s.visible = day > 0.12;
    }
  }

  dispose(): void {
    for (const p of this.puffs) (p.s.material as SpriteMaterial).dispose();
    for (const b of this.birds) (b.s.material as SpriteMaterial).dispose();
    this.motes.geometry.dispose();
    (this.motes.material as PointsMaterial).dispose();
  }
}
