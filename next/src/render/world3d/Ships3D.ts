import { BufferGeometry, Float32BufferAttribute, Group } from "three";
import { M, Parts } from "./Kit";
import { L, addFire, addSmoke, gableGeo, newPlace, pyramidGeo, type PlaceModel } from "./Build";

/** Gemiler (dhow / korsan), iskele ve korsan yuvası. Dünya birimi; +Z baş. */

export interface ShipModel {
  root: Group;
  /** Sallanma + yelken şişmesi; `speed` 0..1. */
  tick: (t: number, speed: number) => void;
  length: number;
}

function sailGeo(w: number, h: number): BufferGeometry {
  // yamuk (latin) yelken: z ekseninde uzanan, hafif şişkin
  const a = [0, 0, -w * 0.5, 0, 0, w * 0.5, 0, h, w * 0.1];
  const b = [0, 0, -w * 0.5, 0, h, w * 0.1, 0, h * 0.62, -w * 0.45];
  const g = new BufferGeometry();
  const pos = [...a, ...b];
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new Float32BufferAttribute(new Array(12).fill(0), 2));
  g.computeVertexNormals();
  return g;
}

export function buildShip(kind: "dhow" | "pirate"): ShipModel {
  const root = new Group();
  const hull = new Group();
  root.add(hull);
  const pirate = kind === "pirate";
  const hullCol = pirate ? 0x2a2420 : 0x8a5a2e;
  const trim = pirate ? 0x7a1a14 : 0xd4af37;
  const deck = pirate ? 0x4a3a2c : 0xb88a52;
  const sailCol = pirate ? 0x2c2a30 : 0xf0e8d0;
  const p = new Parts();
  const l = new L(p);
  const len = pirate ? 84 : 76;
  // gövde: kıç yüksek, baş sivri
  l.sph(1, M(hullCol, { rough: 0.8 }), 0, 4.2, 0, [10, 6, len * 0.5], 10);
  l.box(18, 1.6, len * 0.78, M(deck), 0, 8.6, -2);
  l.box(19.6, 2.2, len * 0.8, M(trim), 0, 7.6, -2);
  l.cone(7.6, 22, M(hullCol, { rough: 0.8 }), 0, 6, len * 0.5 + 6, 8, [Math.PI / 2, 0, 0], [1, 1, 0.9]);
  // kıç kasarası
  l.box(18, 7, 20, M(hullCol), 0, 12.4, -len * 0.36);
  l.box(19.6, 1.4, 21, M(trim), 0, 16.4, -len * 0.36);
  if (pirate) l.add(gableGeo(17, 18, 5), M(0x1a1612), 0, 16.4, -len * 0.36);
  // küpeşte
  for (let i = 0; i < 9; i++) {
    const z = -len * 0.3 + i * (len * 0.6) / 8;
    l.box(0.6, 3, 0.6, M(trim), -9.2, 10.4, z);
    l.box(0.6, 3, 0.6, M(trim), 9.2, 10.4, z);
  }
  l.box(0.5, 0.5, len * 0.6, M(trim), -9.2, 12, 0);
  l.box(0.5, 0.5, len * 0.6, M(trim), 9.2, 12, 0);
  // direk(ler)
  const masts: { z: number; h: number }[] = pirate ? [{ z: 14, h: 62 }, { z: -12, h: 54 }] : [{ z: 4, h: 58 }];
  for (const m of masts) {
    l.cyl(1.2, 1.7, m.h, M(0x5a3c22), 0, 8 + m.h / 2, m.z, 6);
    l.box(1, 1, 26, M(0x5a3c22), 0, 8 + m.h * 0.82, m.z, [0.35, 0, 0], undefined);
  }
  // fıçı / sandık
  l.box(5, 4, 5, M(0x6a4a2a), 4, 11, len * 0.18);
  l.cyl(2.4, 2.4, 4, M(0x4a3220), -4, 11, len * 0.14, 8);
  l.cyl(0.6, 0.6, 6, M(0x2a2a30, { metal: 0.5 }), 0, 11, len * 0.44, 6, [Math.PI / 2 - 0.2, 0, 0]);
  const hullMesh = p.build(true, true, true);
  hull.add(hullMesh);

  // yelkenler
  const sails: Group[] = [];
  const sp = M(sailCol, { double: true, rough: 0.95 });
  for (const m of masts) {
    const s = new Group();
    s.position.set(0, 8 + m.h * 0.18, m.z);
    const part = new Parts();
    part.add(sailGeo(24, m.h * 0.72), sp, [0, 0, 0]);
    s.add(part.build(false));
    hull.add(s);
    sails.push(s);
  }
  // flama
  const flag = new Group();
  const fp = new Parts();
  fp.box(0.3, 5, 10, M(pirate ? 0x111111 : 0xb02a1a, { double: true }), [0, 0, 5]);
  if (pirate) fp.sph(1.4, M(0xe8e0d0), [0.3, 0.4, 5.4], [0.4, 1, 1], 6);
  flag.add(fp.build(false));
  flag.position.set(0, 8 + masts[0].h, masts[0].z);
  hull.add(flag);

  const t0 = Math.random() * 10;
  return {
    root,
    length: len,
    tick: (t, speed) => {
      const tt = t + t0;
      hull.rotation.z = Math.sin(tt * 1.1) * 0.05;
      hull.rotation.x = Math.sin(tt * 0.9 + 1) * 0.035;
      hull.position.y = Math.sin(tt * 1.3) * 0.9 + 0.8;
      sails.forEach((s, i) => {
        s.rotation.y = Math.sin(tt * 0.8 + i) * 0.06 + (speed > 0.05 ? 0.1 : 0);
        s.scale.x = 1 + Math.sin(tt * 1.6 + i * 2) * 0.05;
      });
      flag.rotation.y = Math.sin(tt * 3.2) * 0.4;
    },
  };
}

// ───────────────────────── iskele ─────────────────────────

export function buildPier(): PlaceModel {
  const pl = newPlace(50);
  const p = new Parts();
  const l = new L(p);
  const wood = M(0x7a5a38);
  const dark = M(0x4a3220);
  const len = 78;
  for (let i = 0; i < 13; i++) l.box(15, 1, 5.6, i % 2 ? wood : M(0x6a4c2e), 0, 3.4, i * 6 + 3);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) l.cyl(0.9, 1.1, 14, dark, s * 8, -2, i * 12 + 2, 6);
  l.box(0.8, 5, 0.8, dark, -7.4, 6.4, 30);
  l.box(0.8, 5, 0.8, dark, 7.4, 6.4, 30);
  // sandıklar + çuvallar
  l.box(5, 4, 5, M(0x8a6a3a), -4, 5.6, 14);
  l.box(4, 3, 4, M(0x6a4a2a), -5, 5.1, 22, [0, 0.4, 0]);
  l.cyl(2.2, 2.2, 4, M(0x4a3220), 4, 5.6, 36, 8);
  l.sph(2.2, M(0xd8c8a0), 4.6, 5, 24, [1, 0.8, 1], 6);
  // vinç
  l.box(1.2, 18, 1.2, dark, 6, 12, 60);
  l.box(14, 1, 1, dark, 0, 21, 60);
  l.box(0.2, 8, 0.2, M(0x3a2a1a), -6, 17, 60);
  // fener
  l.cyl(0.4, 0.4, 8, dark, -7, 8, len - 4, 4);
  l.sph(1.2, M(0xffcf5a, { emissive: 0xffaa22, ei: 1 }), -7, 12.6, len - 4, undefined, 6);
  pl.root.add(p.build(true, true, true));
  pl.npcs.push({ kind: "porter", x: 0, z: 18, yaw: 0, mode: "walk", seed: 3, walk: { cx: 0, cz: 22, rx: 3, rz: 16, speed: 0.12, phase: 0 } });
  return pl;
}

// ───────────────────────── korsan yuvası ─────────────────────────

export function buildPirateNest(calm: boolean): PlaceModel {
  const pl = newPlace(60);
  const p = new Parts();
  const l = new L(p);
  l.cyl(46, 52, 3, M(0x7a6a52, { rough: 1 }), 0, 0.5, 0, 14);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    l.sph(10 + (i % 3) * 3, M(0x6a6258, { rough: 1 }), Math.cos(a) * 40, 4, Math.sin(a) * 36, [1, 0.8, 1], 6);
  }
  // kıyıya vurmuş gemi gövdesi
  l.sph(1, M(0x2a2420), -12, 8, 6, [8, 7, 24], 8, [0, 0.4, 0.5]);
  l.box(1.2, 28, 1.2, M(0x4a3220), -14, 20, 4, [0, 0, 0.35]);
  l.add(gableGeo(2, 14, 12), M(0x2c2a30, { double: true }), -9, 22, 4);
  // barakalar
  for (const [x, z, y] of [[18, -6, 0.6], [24, 14, -0.4], [-30, -20, 1.2]] as const) {
    const k = l.sub(x, 0, z, y);
    k.box(14, 9, 12, M(0x4a3a2c), 0, 4.5, 0);
    k.add(gableGeo(17, 15, 7), M(0x3a2a20), 0, 9, 0);
    k.box(4, 6, 0.6, M(0x16110d), 0, 3, 6.2);
  }
  // kafatası bayrağı
  l.cyl(0.8, 1, 36, M(0x4a3220), 0, 18, 0, 6);
  l.box(14, 9, 0.5, M(0x151515, { double: true }), 7, 31, 0);
  l.sph(2.4, M(0xe8e0d0), 7, 31, 0.5, [1, 1.1, 0.4], 7);
  l.box(6, 0.8, 0.6, M(0xe8e0d0), 7, 27.6, 0.5, [0, 0, 0.5]);
  l.box(6, 0.8, 0.6, M(0xe8e0d0), 7, 27.6, 0.5, [0, 0, -0.5]);
  // palisade + fıçılar
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.2;
    if (Math.abs(a - Math.PI / 2) < 0.4) continue;
    l.cyl(1, 1.2, 15, M(0x4a3220), Math.cos(a) * 30, 7.5, Math.sin(a) * 28, 6);
    l.cone(1, 3, M(0x4a3220), Math.cos(a) * 30, 16, Math.sin(a) * 28, 6);
  }
  for (let i = 0; i < 4; i++) l.cyl(2.6, 2.6, 5, M(0x5a3a20), 10 + (i % 2) * 5, 3.5, -16 - Math.floor(i / 2) * 6, 8);
  l.add(pyramidGeo(10, 10, 5), M(0x2c2a30), 30, 14, -10);
  pl.root.add(p.build(true, true, true));
  if (!calm) {
    addFire(pl.root, pl.anim, 8, 3, 8, 1.1);
    addSmoke(pl.root, pl.anim, 8, 6, 8, 1, 0x3a3a3e, 4);
    pl.npcs.push({ kind: "bandit", x: 4, z: 16, yaw: 0, mode: "stand", seed: 311 });
    pl.npcs.push({ kind: "bandit", x: 14, z: 10, yaw: 2, mode: "stand", seed: 313 });
    pl.npcs.push({ kind: "chief", x: 0, z: 2, yaw: 3, mode: "stand", seed: 317 });
  }
  return pl;
}
