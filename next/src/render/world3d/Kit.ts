import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Euler,
  FrontSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: number;
  ei?: number;
  flat?: boolean;
  double?: boolean;
  opacity?: number;
}

const cache = new Map<string, MeshStandardMaterial>();

/** K��e renkli ortak malzeme (akt�r rigleri). */
export const VC_MAT = new MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.82, metalness: 0.05 });

/** Önbellekli malzeme — tüm modeller paylaşır (draw-call / bellek tasarrufu). */
export function M(hex: number, o: MatOpts = {}): MeshStandardMaterial {
  const key = `${hex}|${o.rough ?? 0.85}|${o.metal ?? 0.05}|${o.emissive ?? 0}|${o.ei ?? 0}|${o.flat ?? 1}|${o.double ? 1 : 0}|${o.opacity ?? 1}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({
      color: new Color(hex),
      roughness: o.rough ?? 0.85,
      // Ortam haritası yok: yüksek metalness siyah görünür → yumuşat.
      metalness: Math.min(0.28, (o.metal ?? 0.05) * 0.4),
      flatShading: o.flat ?? false,
      side: o.double ? DoubleSide : FrontSide,
      emissive: new Color(o.emissive ?? 0x000000),
      emissiveIntensity: o.ei ?? 0,
      transparent: (o.opacity ?? 1) < 1,
      opacity: o.opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m;
}

export function seeded(seed: number): () => number {
  let s = (Math.abs(seed | 0) * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Statik parçaları malzeme başına tek mesh'e birleştirir.
 * Bir köy ~40 parça olsa da 3–6 draw call'a iner.
 */
export class Parts {
  private groups = new Map<MeshStandardMaterial, BufferGeometry[]>();
  private m4 = new Matrix4();
  private q = new Quaternion();
  private e = new Euler();
  private v = new Vector3();
  private s = new Vector3();

  add(geo: BufferGeometry, mat: MeshStandardMaterial, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]): this {
    this.e.set(r[0], r[1], r[2], "YXZ");
    this.q.setFromEuler(this.e);
    this.m4.compose(this.v.set(p[0], p[1], p[2]), this.q, this.s.set(s[0], s[1], s[2]));
    geo.applyMatrix4(this.m4);
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (g !== geo) geo.dispose();
    let l = this.groups.get(mat);
    if (!l) this.groups.set(mat, (l = []));
    l.push(g);
    return this;
  }

  box(w: number, h: number, d: number, mat: MeshStandardMaterial, p: V3, r?: V3, s?: V3): this {
    return this.add(new BoxGeometry(w, h, d), mat, p, r, s);
  }
  cyl(rt: number, rb: number, h: number, mat: MeshStandardMaterial, p: V3, seg = 8, r?: V3, s?: V3): this {
    return this.add(new CylinderGeometry(rt, rb, h, seg), mat, p, r, s);
  }
  cone(r: number, h: number, mat: MeshStandardMaterial, p: V3, seg = 6, rot?: V3, s?: V3): this {
    return this.add(new ConeGeometry(r, h, seg), mat, p, rot, s);
  }
  sph(r: number, mat: MeshStandardMaterial, p: V3, s?: V3, seg = 10, rot?: V3): this {
    return this.add(new SphereGeometry(r, seg, Math.max(5, Math.round(seg * 0.7))), mat, p, rot, s);
  }
  /** Üst yarım küre (kubbe). */
  dome(r: number, mat: MeshStandardMaterial, p: V3, s?: V3, seg = 12): this {
    return this.add(new SphereGeometry(r, seg, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, p, undefined, s);
  }
  torus(r: number, tube: number, mat: MeshStandardMaterial, p: V3, rot?: V3, arc = Math.PI * 2, seg = 12): this {
    return this.add(new TorusGeometry(r, tube, 5, seg, arc), mat, p, rot);
  }

  /**
   * `vc`: normal malzemeli par�alar tek k��e-rengi mesh'ine birle�tirilir
   * (akt�rler i�in ~4x daha az draw call). Emisyonlu / �ift y�zl� / saydam olanlar ayr� kal�r.
   */
  build(shadow = true, vc = false, recv = false): Group {
    const out = new Group();
    if (vc) {
      const plain: BufferGeometry[] = [];
      for (const [mat, list] of this.groups) {
        const special = mat.emissiveIntensity > 0 || mat.side !== FrontSide || mat.transparent;
        if (special) {
          const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
          if (!merged) continue;
          const mesh = new Mesh(merged, mat);
          mesh.castShadow = shadow;
          out.add(mesh);
          continue;
        }
        for (const g of list) {
          const n = g.attributes.position.count;
          const col = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            col[i * 3] = mat.color.r;
            col[i * 3 + 1] = mat.color.g;
            col[i * 3 + 2] = mat.color.b;
          }
          g.setAttribute("color", new BufferAttribute(col, 3));
          plain.push(g);
        }
      }
      if (plain.length) {
        const merged = plain.length === 1 ? plain[0] : mergeGeometries(plain, false);
        if (merged) {
          const mesh = new Mesh(merged, VC_MAT);
          mesh.castShadow = shadow;
          mesh.receiveShadow = recv;
          out.add(mesh);
        }
      }
      this.groups.clear();
      return out;
    }
    for (const [mat, list] of this.groups) {
      const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!merged) continue;
      const mesh = new Mesh(merged, mat);
      mesh.castShadow = shadow;
      mesh.receiveShadow = shadow;
      out.add(mesh);
    }
    this.groups.clear();
    return out;
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** En kısa açı farkıyla yumuşak dönüş. */
export function turnToward(cur: number, target: number, k: number): number {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, k);
}
