import { CircleGeometry, Group, Mesh, MeshBasicMaterial, type Object3D } from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { Actor } from "./Actors3D";

export type UnitKind = "hero" | "bandit" | "boss" | "caravan" | "rival" | "march";

const RING: Record<UnitKind, number> = {
  hero: 0xffd56a,
  bandit: 0xff4a3a,
  boss: 0xc58cff,
  caravan: 0xe2bd62,
  rival: 0x6ab8ff,
  march: 0x9ad88a,
};

export function disposeTree(o: Object3D): void {
  o.traverse((c) => {
    const m = c as Mesh;
    if (m.isMesh && m.geometry) m.geometry.dispose();
  });
}

const ringGeo = new CircleGeometry(1, 36);
const shadowGeo = new CircleGeometry(1, 20);
const shadowMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

interface Follower {
  a: Actor;
  x: number;
  z: number;
  row: number;
  side: number;
}

export interface FormationOpts {
  spacing?: number;
  spread?: number;
  /** Tek s�ra (kervan). */
  column?: boolean;
}

/**
 * Harita birliği: lider + arkasında yürüyen takipçiler (askerler, develer...).
 * Lider gerçek konum değişiminden yön/hız türetir; takipçiler yumuşakça iz sürer.
 */
export class Unit3D {
  root = new Group();
  tag = new Group();
  label: CSS2DObject;
  leader: Actor | null = null;
  private followers: Follower[] = [];
  private fGroup = new Group();
  private ring: Mesh;
  private blob: Mesh;
  private sig = "";
  private ringR = 40;
  private lx = Number.NaN;
  private lz = Number.NaN;
  spacing = 30;
  spread = 22;

  constructor(
    public kind: UnitKind,
    name: string,
    private elev: (x: number, z: number) => number,
  ) {
    const ringMat = new MeshBasicMaterial({ color: RING[kind], transparent: true, opacity: kind === "hero" ? 0.55 : 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    this.ring = new Mesh(ringGeo, ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.y = 0.9;
    this.ring.renderOrder = 2;
    this.blob = new Mesh(shadowGeo, shadowMat);
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.position.y = 0.6;
    this.blob.renderOrder = 1;
    this.tag.add(this.ring, this.blob);
    const el = document.createElement("div");
    el.className = `w3d-label token ${kind}`;
    el.textContent = name;
    this.label = new CSS2DObject(el);
    this.label.position.y = -3;
    this.tag.add(this.label);
    this.root.add(this.tag, this.fGroup);
  }

  setName(text: string): void {
    const el = this.label.element as HTMLElement;
    if (el.textContent !== text) el.textContent = text;
  }

  setLeader(a: Actor, ringR?: number): void {
    if (this.leader) {
      this.root.remove(this.leader.root);
      disposeTree(this.leader.root);
    }
    this.leader = a;
    this.root.add(a.root);
    this.ringR = ringR ?? Math.max(26, a.height * 0.42);
    this.ring.scale.setScalar(this.ringR);
    this.blob.scale.setScalar(this.ringR * 0.8);
    this.lx = Number.NaN;
  }

  /** `sig` değişirse takipçiler yeniden kurulur. */
  setFollowers(sig: string, makers: (() => Actor)[], opts: FormationOpts = {}): void {
    if (sig === this.sig) return;
    this.sig = sig;
    for (const f of this.followers) {
      this.fGroup.remove(f.a.root);
      disposeTree(f.a.root);
    }
    this.followers = [];
    this.spacing = opts.spacing ?? 30;
    this.spread = opts.spread ?? 22;
    const n = makers.length;
    makers.forEach((mk, i) => {
      const a = mk();
      const row = opts.column ? i + 1 : Math.floor(i / 2) + 1;
      const side = opts.column || n === 1 ? 0 : i % 2 ? 1 : -1;
      const f: Follower = { a, x: Number.NaN, z: Number.NaN, row, side };
      this.followers.push(f);
      this.fGroup.add(a.root);
    });
  }

  /** `detail`: takipçiler yalnız yakındayken görünür (draw-call tasarrufu). */
  update(dt: number, t: number, x: number, z: number, detail = true): void {
    const a = this.leader;
    if (!a) return;
    const y = this.elev(x, z);
    // ışınlanma (yolculuk, hızlı seyahat): sıfırla
    if (!Number.isNaN(this.lx) && Math.hypot(x - this.lx, z - this.lz) > 250) {
      a.reset();
      for (const f of this.followers) f.x = Number.NaN;
    }
    this.lx = x;
    this.lz = z;
    a.follow(x, y, z, dt, t);
    this.tag.position.set(x, y, z);
    this.fGroup.visible = detail;
    if (!detail) return;
    const hd = a.heading;
    const fx = Math.sin(hd);
    const fz = Math.cos(hd);
    const rx = Math.cos(hd);
    const rz = -Math.sin(hd);
    const k = Math.min(1, dt * 3.4);
    for (let i = 0; i < this.followers.length; i++) {
      const f = this.followers[i]!;
      const tx = x - fx * f.row * this.spacing + rx * f.side * this.spread;
      const tz = z - fz * f.row * this.spacing + rz * f.side * this.spread;
      if (Number.isNaN(f.x)) {
        f.x = tx;
        f.z = tz;
        f.a.reset();
      } else {
        f.x += (tx - f.x) * k;
        f.z += (tz - f.z) * k;
      }
      const ey = this.elev(f.x, f.z);
      f.a.follow(f.x, ey, f.z, dt, t);
      // yan?ndaki yolda? (ilk takip�i): y�r�rken belirgin ad?m nabz?
      if (i === 0 && f.a.sp > 0.15) {
        f.a.root.position.y = ey + Math.abs(Math.sin(t * 11)) * 2.4;
      }
    }
  }

  get followersBuilt(): boolean {
    return this.sig !== "";
  }

  get height(): number {
    return this.leader?.height ?? 60;
  }
}
