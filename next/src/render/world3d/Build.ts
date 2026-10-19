import { BufferGeometry, Color, Matrix4, Object3D, ConeGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { M, Parts, type V3 } from "./Kit";
import type { RigMode } from "./Rigs";
import type { NpcKind } from "./Actors3D";

/** Yerleşim modelleri için ortak tipler + yerel dönüşümlü parça yardımcısı. */

export type SpotKind = NpcKind | "soldier" | "bandit" | "chief" | "archer" | "camel" | "horse";

export interface NpcSpot {
  kind: SpotKind;
  x: number;
  z: number;
  yaw: number;
  mode: RigMode;
  seed: number;
  /** Yürüyen figür: merkez etrafında dairesel yol. */
  walk?: { cx: number; cz: number; rx: number; rz: number; speed: number; phase: number };
  team?: number;
}

export interface PlaceModel {
  root: Group;
  anim: ((t: number) => void)[];
  npcs: NpcSpot[];
  /** Sahip rengi taşıyan bayrak malzemesi (paylaşımsız). */
  flagMat?: MeshStandardMaterial;
  radius: number;
}

export function newPlace(radius: number): PlaceModel {
  return { root: new Group(), anim: [], npcs: [], radius };
}

/** Yerel çerçeve: (ox,oy,oz) konumunda, yaw döndürülmüş parça ekleyici. */
export class L {
  constructor(
    public p: Parts,
    public ox = 0,
    public oy = 0,
    public oz = 0,
    public yaw = 0,
  ) {}

  T(x: number, y: number, z: number): V3 {
    const c = Math.cos(this.yaw);
    const s = Math.sin(this.yaw);
    return [this.ox + x * c + z * s, this.oy + y, this.oz - x * s + z * c];
  }

  sub(x: number, y: number, z: number, yaw = 0): L {
    const [px, py, pz] = this.T(x, y, z);
    return new L(this.p, px, py, pz, this.yaw + yaw);
  }

  add(geo: BufferGeometry, m: ReturnType<typeof M>, x: number, y: number, z: number, r?: V3, s?: V3): this {
    this.p.add(geo, m, this.T(x, y, z), this.R(r), s);
    return this;
  }

  private R(r?: V3): V3 {
    return r ? [r[0], r[1] + this.yaw, r[2]] : [0, this.yaw, 0];
  }

  box(w: number, h: number, d: number, m: ReturnType<typeof M>, x: number, y: number, z: number, r?: V3, s?: V3): this {
    this.p.box(w, h, d, m, this.T(x, y, z), this.R(r), s);
    return this;
  }
  cyl(rt: number, rb: number, h: number, m: ReturnType<typeof M>, x: number, y: number, z: number, seg = 8, r?: V3, s?: V3): this {
    this.p.cyl(rt, rb, h, m, this.T(x, y, z), seg, this.R(r), s);
    return this;
  }
  cone(r: number, h: number, m: ReturnType<typeof M>, x: number, y: number, z: number, seg = 6, rot?: V3, s?: V3): this {
    this.p.cone(r, h, m, this.T(x, y, z), seg, this.R(rot), s);
    return this;
  }
  sph(r: number, m: ReturnType<typeof M>, x: number, y: number, z: number, s?: V3, seg = 10, rot?: V3): this {
    this.p.sph(r, m, this.T(x, y, z), s, seg, this.R(rot));
    return this;
  }
  dome(r: number, m: ReturnType<typeof M>, x: number, y: number, z: number, s?: V3, seg = 12): this {
    this.p.dome(r, m, this.T(x, y, z), s, seg);
    return this;
  }
  torus(r: number, tube: number, m: ReturnType<typeof M>, x: number, y: number, z: number, rot?: V3, arc = Math.PI * 2, seg = 12): this {
    this.p.torus(r, tube, m, this.T(x, y, z), this.R(rot), arc, seg);
    return this;
  }
}

/** Paylaşımsız bayrak / sahiplik kumaşı. */
export function makeFlagMat(hex: number): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: new Color(hex), roughness: 0.8, side: DoubleSide, flatShading: true });
}

// ───────────────────────── animasyonlu efektler ─────────────────────────

const flameGeo = new ConeGeometry(1, 2, 6, 1);
flameGeo.translate(0, 1, 0);
const flameA = new MeshBasicMaterial({ color: 0xff6a14, transparent: true, opacity: 0.88, depthWrite: false });
const flameB = new MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.95, depthWrite: false });

/** Çalan ateş: iki sivri alev + közler. `anim`a tick eklenir. */
export function addFire(root: Group, anim: ((t: number) => void)[], x: number, y: number, z: number, s = 1): void {
  const g = new Group();
  g.userData.keep = true;
  g.position.set(x, y, z);
  const a = new Mesh(flameGeo, flameA);
  const b = new Mesh(flameGeo, flameB);
  g.add(a, b);
  root.add(g);
  const ph = x * 0.37 + z * 0.19;
  anim.push((t) => {
    const f = 0.85 + Math.sin(t * 11 + ph) * 0.15 + Math.sin(t * 17 + ph * 2) * 0.08;
    a.scale.set(2.6 * s * (1.1 - f * 0.12), 4.6 * s * f, 2.6 * s);
    a.rotation.y = t * 2 + ph;
    a.position.y = 0;
    b.scale.set(1.5 * s, 3.0 * s * (0.9 + Math.sin(t * 13 + ph) * 0.15), 1.5 * s);
    b.rotation.y = -t * 3;
    b.position.y = 0;
  });
}

const smokeGeo = new SphereGeometry(1, 7, 6);

/** Yükselen duman — her puf kendi malzemesine sahiptir (opaklık). */
export function addSmoke(root: Group, anim: ((t: number) => void)[], x: number, y: number, z: number, s = 1, col = 0x8a8a8e, n = 4): void {
  const puffs: { m: Mesh; mat: MeshBasicMaterial; o: number }[] = [];
  for (let i = 0; i < n; i++) {
    const mat = new MeshBasicMaterial({ color: col, transparent: true, opacity: 0.4, depthWrite: false });
    const m = new Mesh(smokeGeo, mat);
    m.renderOrder = 3;
    m.userData.keep = true;
    root.add(m);
    puffs.push({ m, mat, o: i / n });
  }
  anim.push((t) => {
    for (const p of puffs) {
      const k = (t * 0.22 + p.o) % 1;
      p.m.position.set(x + Math.sin(t * 0.7 + p.o * 6) * 2 * s + k * 10 * s, y + k * 38 * s, z);
      p.m.scale.setScalar((3 + k * 9) * s);
      p.mat.opacity = 0.42 * (1 - k) * Math.min(1, k * 6);
    }
  });
}

/** Rüzgârda dalgalanan bayrak: direk + sallanan kumaş. */
export function addBanner(root: Group, anim: ((t: number) => void)[], x: number, y: number, z: number, h: number, mat: MeshStandardMaterial, w = 12, hh = 8): void {
  const p = new Parts();
  p.cyl(0.6, 0.8, h, M(0x4a3a2a), [0, h / 2, 0], 5);
  p.sph(1.1, M(0xd4af37, { metal: 0.6 }), [0, h + 0.8, 0], undefined, 6);
  const pole = p.build();
  pole.position.set(x, y, z);
  root.add(pole);
  const pivot = new Group();
  pivot.userData.keep = true;
  pivot.position.set(x, y + h - hh * 0.5 - 1, z);
  const flag = new Parts();
  flag.box(w, hh, 0.3, M(0xffffff), [w / 2, 0, 0]);
  const fm = flag.build(false);
  fm.children.forEach((c) => ((c as Mesh).material = mat));
  pivot.add(fm);
  root.add(pivot);
  const ph = x * 0.11 + z * 0.07;
  anim.push((t) => {
    pivot.rotation.y = Math.sin(t * 3 + ph) * 0.35 + 0.15;
    pivot.rotation.z = Math.sin(t * 2.3 + ph) * 0.06;
  });
}

function flatGeo(tris: number[][]): BufferGeometry {
  const pos: number[] = [];
  for (const t of tris) pos.push(...t);
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

/** Dikd�rtgen tabanl� piramit �at� (taban y=0, tepe y=h). */
export function pyramidGeo(w: number, d: number, h: number): BufferGeometry {
  const a = w / 2;
  const b = d / 2;
  return flatGeo([
    [-a, 0, b, a, 0, b, 0, h, 0],
    [a, 0, b, a, 0, -b, 0, h, 0],
    [a, 0, -b, -a, 0, -b, 0, h, 0],
    [-a, 0, -b, -a, 0, b, 0, h, 0],
  ]);
}

/** Be�ik �at�: mahya z ekseni boyunca. */
export function gableGeo(w: number, d: number, h: number): BufferGeometry {
  const a = w / 2;
  const b = d / 2;
  return flatGeo([
    [a, 0, b, a, 0, -b, 0, h, -b],
    [a, 0, b, 0, h, -b, 0, h, b],
    [-a, 0, -b, -a, 0, b, 0, h, b],
    [-a, 0, -b, 0, h, b, 0, h, -b],
    [-a, 0, b, a, 0, b, 0, h, b],
    [a, 0, -b, -a, 0, -b, 0, h, -b],
  ]);
}

/**
 * Yerleşim modelindeki duran (animasyonsuz) mesh'leri malzeme başına tek mesh'e birleştirir.
 * `userData.keep` taşıyan (ateş, duman, bayrak) düğümler dokunulmaz. Çizim sayısını ~10x düşürür.
 */
export function bakeStatic(root: Group): void {
  root.updateMatrixWorld(true);
  const inv = new Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<string, { mat: MeshStandardMaterial; cast: boolean; recv: boolean; geos: BufferGeometry[]; src: Mesh[] }>();
  const visit = (o: Object3D): void => {
    if (o.userData.keep) return;
    const me = o as Mesh;
    if (me.isMesh && !Array.isArray(me.material) && me.geometry.attributes.position && me.geometry.attributes.normal && me.geometry.attributes.uv) {
      const mat = me.material as MeshStandardMaterial;
      const key = `${mat.uuid}|${me.castShadow ? 1 : 0}|${me.receiveShadow ? 1 : 0}|${me.geometry.attributes.color ? 1 : 0}|${me.renderOrder}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { mat, cast: me.castShadow, recv: me.receiveShadow, geos: [], src: [] }));
      const g = me.geometry.clone();
      g.applyMatrix4(new Matrix4().multiplyMatrices(inv, me.matrixWorld));
      b.geos.push(g.index ? g.toNonIndexed() : g);
      b.src.push(me);
      return;
    }
    for (const c of o.children) visit(c);
  };
  visit(root);
  for (const b of buckets.values()) {
    for (const g of b.geos) {
      // yalnızca ortak öznitelikler birleşebilir
      for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv" && k !== "color") g.deleteAttribute(k);
    }
    const merged = mergeGeometries(b.geos, false);
    if (!merged) continue;
    for (const m of b.src) {
      m.parent?.remove(m);
      m.geometry.dispose();
    }
    const mesh = new Mesh(merged, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.recv;
    mesh.matrixAutoUpdate = false;
    root.add(mesh);
  }
  // boş kalan grupları temizle
  const prune = (o: Object3D): void => {
    for (const c of [...o.children]) {
      prune(c);
      if (c.type === "Group" && c.children.length === 0 && !c.userData.keep) o.remove(c);
    }
  };
  prune(root);
}