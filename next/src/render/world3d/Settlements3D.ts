import { Color, CanvasTexture, CircleGeometry, MeshStandardMaterial, SRGBColorSpace } from "three";
import { M, Parts, seeded } from "./Kit";
import { L, addBanner, addFire, addSmoke, gableGeo, makeFlagMat, newPlace, pyramidGeo, type PlaceModel } from "./Build";

/**
 * Harita yerleşimleri: köy, yurt obası, haydut kampı, kale (4 kademe), kurgan,
 * vaha, harabe, kaynak düğümleri. Hepsi malzeme başına birleşik mesh (düşük draw call).
 */

const C = {
  mud: 0xc2a06a,
  mudDark: 0x9a7a4a,
  plaster: 0xdccfb0,
  timber: 0x6a4a2a,
  timberDark: 0x4a3220,
  thatch: 0xcfae5a,
  thatchDark: 0xa88a40,
  stone: 0xa8a090,
  stoneDark: 0x7a7468,
  stoneLight: 0xc4bca8,
  char: 0x2a2420,
  grass: 0x5a7a3a,
  leaf: 0x3f7a35,
  leaf2: 0x5a9040,
  felt: 0xe8e0cc,
  red: 0xa8301f,
  door: 0x3a2616,
  sand: 0xd8c08a,
};

let decalTex: CanvasTexture | null = null;
const decalMats = new Map<number, MeshStandardMaterial>();
function decalMat(col: number): MeshStandardMaterial {
  if (!decalTex) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, "rgba(255,255,255,0.95)");
    gr.addColorStop(0.55, "rgba(255,255,255,0.8)");
    gr.addColorStop(0.82, "rgba(255,255,255,0.28)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    // organik kenar: rastgele lekeler
    const rnd = seeded(7);
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2;
      const d = 40 + rnd() * 24;
      g.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.35})`;
      g.beginPath();
      g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 3 + rnd() * 8, 0, 7);
      g.fill();
    }
    decalTex = new CanvasTexture(c);
    decalTex.colorSpace = SRGBColorSpace;
  }
  let m = decalMats.get(col);
  if (!m) {
    m = new MeshStandardMaterial({ color: new Color(col).lerp(new Color(0x9a8456), 0.6), map: decalTex, transparent: true, opacity: 0.7, depthWrite: false, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    decalMats.set(col, m);
  }
  return m;
}

/** Yerleşim zemini: küçük sağlam kaide + araziyle yumuşakça kaynaşan leke (sert disk yok). */
export function ground(l: L, r: number, col: number, y = 0.6, _seg = 20): void {
  l.cyl(r * 0.78, r * 0.92, 9, M(col, { rough: 1 }), 0, y - 4.5, 0, 18);
  l.add(new CircleGeometry(r * 1.3, 32).rotateX(-Math.PI / 2), decalMat(col), 0, y + 0.5, 0);
}

export function tree(l: L, x: number, z: number, s: number, kind: 0 | 1 | 2 = 0): void {
  const trunk = M(0x5a3c22);
  if (kind === 2) {
    // kavak: ince uzun
    l.cyl(0.9 * s, 1.3 * s, 8 * s, trunk, x, 4 * s, z, 6);
    l.sph(4 * s, M(C.leaf2), x, 15 * s, z, [0.55, 2.0, 0.55], 7);
    return;
  }
  l.cyl(1.1 * s, 1.7 * s, 8 * s, trunk, x, 4 * s, z, 6);
  if (kind === 1) {
    l.cone(6.5 * s, 11 * s, M(0x2f6a3a), x, 13 * s, z, 7);
    l.cone(5 * s, 9 * s, M(0x357540), x, 18 * s, z, 7);
  } else {
    l.sph(6.5 * s, M(C.leaf), x, 12 * s, z, [1, 0.85, 1], 8);
    l.sph(4.6 * s, M(C.leaf2), x + 2.5 * s, 15 * s, z - 1 * s, [1, 0.85, 1], 7);
  }
}

export function palm(l: L, x: number, z: number, s: number, lean: number): void {
  const trunk = M(0x8a6a3a);
  for (let i = 0; i < 5; i++) {
    l.cyl(0.9 * s, 1.1 * s, 3.4 * s, trunk, x + Math.sin(lean) * i * 1.1 * s, 1.6 * s + i * 3.2 * s, z, 6, [0, 0, -lean * 0.45]);
  }
  const tx = x + Math.sin(lean) * 5 * s;
  const ty = 17 * s;
  const lf = M(0x3a8a3a, { double: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    l.box(0.9 * s, 0.25 * s, 9 * s, lf, tx + Math.cos(a) * 3.4 * s, ty - 1.2 * s, z + Math.sin(a) * 3.4 * s, [0.55, -a + Math.PI / 2, 0]);
  }
  l.sph(1.2 * s, M(0x5a3a1a), tx, ty - 0.8 * s, z, undefined, 6);
}

export function rock(l: L, x: number, z: number, s: number, col = C.stone): void {
  l.sph(s, M(col, { rough: 1 }), x, s * 0.35, z, [1.2, 0.7, 1], 6, [0.3, x, 0.2]);
}

function door(l: L, x: number, y: number, z: number, w: number, h: number): void {
  l.box(w, h, 0.5, M(C.door), x, y, z);
}

/** Köy evi: duvar + saman/kiremit çatı + kapı + pencere. */
export function cottage(l: L, x: number, z: number, w: number, d: number, h: number, yaw: number, wall: number, roof: number, state: number): void {
  const s = l.sub(x, 0, z, yaw);
  if (state >= 2) {
    // yıkık: alçak, kırık duvarlar
    s.box(w, h * 0.35, 1.6, M(C.char), 0, h * 0.17, d / 2 - 0.8);
    s.box(1.6, h * 0.5, d, M(C.char), -w / 2 + 0.8, h * 0.25, 0);
    s.box(w * 0.5, h * 0.25, 1.6, M(C.char), w * 0.2, h * 0.12, -d / 2 + 0.8);
    s.box(2.4, 1.2, 12, M(C.timberDark), 0, 0.8, 0, [0, 0.4, 0.2]);
    return;
  }
  const wc = state === 1 ? 0x6a5a4a : wall;
  s.box(w, h, d, M(wc, { rough: 0.95 }), 0, h / 2, 0);
  s.box(w + 0.4, 1.4, d + 0.4, M(C.stoneDark), 0, 0.7, 0);
  door(s, w * 0.2, h * 0.36, d / 2 + 0.2, w * 0.24, h * 0.7);
  s.box(w * 0.2, h * 0.22, 0.5, M(0x2a1c10), -w * 0.25, h * 0.58, d / 2 + 0.2);
  s.box(w * 0.26, 0.5, 0.7, M(C.timber), -w * 0.25, h * 0.45, d / 2 + 0.3);
  if (state === 0) {
    s.add(gableGeo(w + 4, d + 4, h * 0.62), M(roof, { rough: 1 }), 0, h, 0);
    s.box(w + 4.2, 0.6, 0.8, M(C.timberDark), 0, h + h * 0.62, 0);
  } else {
    s.add(gableGeo(w + 3, d + 3, h * 0.4), M(C.char, { rough: 1 }), 0, h, 0, [0, 0, 0.06]);
  }
}

export function haystack(l: L, x: number, z: number, s: number): void {
  l.cyl(3.2 * s, 3.6 * s, 4.5 * s, M(C.thatchDark), x, 2.2 * s, z, 8);
  l.cone(3.2 * s, 3.5 * s, M(C.thatch), x, 6.2 * s, z, 8);
}

export function well(l: L, x: number, z: number): void {
  l.cyl(3.6, 4, 3.4, M(C.stone), x, 1.7, z, 10);
  l.cyl(2.6, 2.6, 0.5, M(0x244a60), x, 3.3, z, 10);
  l.box(0.8, 8, 0.8, M(C.timber), x - 3.5, 4, z);
  l.box(0.8, 8, 0.8, M(C.timber), x + 3.5, 4, z);
  l.add(gableGeo(9, 6, 3), M(C.thatchDark), x, 8, z, [0, Math.PI / 2, 0]);
}

export function fence(l: L, x0: number, z0: number, x1: number, z1: number): void {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 5));
  const ang = Math.atan2(x1 - x0, z1 - z0);
  const wood = M(C.timber);
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    l.box(1, 6, 1, wood, x0 + (x1 - x0) * k, 3, z0 + (z1 - z0) * k);
  }
  const len = Math.hypot(x1 - x0, z1 - z0);
  l.box(0.6, 0.6, len, wood, (x0 + x1) / 2, 5, (z0 + z1) / 2, [0, ang, 0]);
  l.box(0.6, 0.6, len, wood, (x0 + x1) / 2, 2.6, (z0 + z1) / 2, [0, ang, 0]);
}

function field(l: L, x: number, z: number, w: number, d: number, yaw: number, col: number, stripe: number): void {
  const s = l.sub(x, 0, z, yaw);
  s.box(w, 0.5, d, M(0x6a4a2a, { rough: 1 }), 0, 0.3, 0);
  const n = Math.floor(w / 3.2);
  for (let i = 0; i < n; i++) {
    s.box(1.6, 1.1, d * 0.92, M(i % 2 ? col : stripe, { rough: 1 }), -w / 2 + 2 + i * 3.2, 0.7, 0);
  }
}

// ───────────────────────── Köy ─────────────────────────

export function buildVillage(seed: number, state: 0 | 1 | 2 = 0): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(62);
  const p = new Parts();
  const l = new L(p);
  ground(l, 62, 0x9a8458, 0.6, 18);
  const n = 6 + Math.floor(rnd() * 2);
  const roofs = [C.thatch, 0xb0522f, C.thatchDark];
  const walls = [C.plaster, 0xcdb48a, 0xd8c8a4, 0xbfa57a];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.4;
    const r = 32 + rnd() * 12;
    const w = 17 + rnd() * 6;
    const d = 15 + rnd() * 5;
    cottage(l, Math.cos(a) * r, Math.sin(a) * r, w, d, 15 + rnd() * 4, -a + Math.PI / 2 + (rnd() - 0.5) * 0.4, walls[Math.floor(rnd() * walls.length)], roofs[Math.floor(rnd() * roofs.length)], state);
  }
  well(l, 0, 0);
  haystack(l, 20, -40, 1.7);
  haystack(l, -40, 20, 1.5);
  fence(l, -44, 38, -10, 46);
  fence(l, 14, 44, 46, 30);
  field(l, 62, -30, 22, 36, 0.2, 0x7aa84a, 0x8ab85a);
  field(l, -62, -26, 20, 30, -0.15, 0xc8a840, 0xb89830);
  tree(l, -40, -44, 0.9);
  tree(l, 38, 46, 1, 1);
  tree(l, 58, 8, 0.8, 2);
  pl.root.add(p.build(true, true, true));
  if (state === 0) {
    addSmoke(pl.root, pl.anim, 8, 14, 12, 0.6, 0xa0a0a4, 3);
    pl.npcs.push({ kind: "villager", x: 6, z: 8, yaw: 0, mode: "walk", seed: seed + 1, walk: { cx: 0, cz: 0, rx: 17, rz: 14, speed: 0.12, phase: 0 } });
    pl.npcs.push({ kind: "villager", x: -8, z: -4, yaw: 1, mode: "walk", seed: seed + 5, walk: { cx: -4, cz: 6, rx: 22, rz: 9, speed: -0.09, phase: 2 } });
    pl.npcs.push({ kind: "elder", x: -4, z: 10, yaw: 0.6, mode: "stand", seed: seed + 9 });
  } else if (state === 1) {
    addFire(pl.root, pl.anim, 22, 4, 18, 1.4);
    addFire(pl.root, pl.anim, -20, 4, -14, 1.1);
    addSmoke(pl.root, pl.anim, 22, 8, 18, 1.5, 0x3a3a3e, 5);
    addSmoke(pl.root, pl.anim, -20, 8, -14, 1.2, 0x3a3a3e, 5);
  } else {
    addSmoke(pl.root, pl.anim, 10, 4, -6, 0.9, 0x4a4a4e, 3);
  }
  return pl;
}

// ───────────────────────── Yurt ─────────────────────────

export function yurt(l: L, x: number, z: number, s: number, yaw: number, col: number): void {
  const k = l.sub(x, 0, z, yaw);
  const felt = M(col, { rough: 1 });
  k.cyl(9 * s, 9.4 * s, 7 * s, felt, 0, 3.5 * s, 0, 14);
  k.cone(10.4 * s, 7 * s, felt, 0, 10.4 * s, 0, 14);
  k.cyl(2.2 * s, 2.2 * s, 0.8 * s, M(0x2a1c10), 0, 14.2 * s, 0, 8);
  k.torus(9.3 * s, 0.4 * s, M(C.red), 0, 5.2 * s, 0, [Math.PI / 2, 0, 0], Math.PI * 2, 16);
  k.box(4.4 * s, 5.6 * s, 0.8 * s, M(0x6a2a1a), 0, 2.8 * s, 9.2 * s);
  k.box(3.2 * s, 4.6 * s, 0.9 * s, M(C.door), 0, 2.4 * s, 9.35 * s);
  for (let i = 0; i < 6; i++) k.box(0.7 * s, 6 * s, 0.4 * s, M(0x8a6a3a), -7.2 * s + i * 2.9 * s, 3.4 * s, 9.1 * s, undefined, undefined);
}

export function buildYurtCamp(seed: number, state: 0 | 1 | 2 = 0): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(60);
  const p = new Parts();
  const l = new L(p);
  ground(l, 64, 0x8a9a5a, 0.5, 18);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3;
    const r = i === 0 ? 0 : 40 + rnd() * 6;
    if (state >= 2 && i > 1) continue;
    yurt(l, Math.cos(a) * r * (i === 0 ? 0 : 1), Math.sin(a) * r * (i === 0 ? 0 : 1), i === 0 ? 1.8 : 1.3 + rnd() * 0.2, -a + Math.PI / 2, state === 1 ? 0x6a5a48 : i === 0 ? 0xf4ecd8 : C.felt);
  }
  // atlık çiti
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 1.1 + 2.6;
    l.box(1, 5, 1, M(C.timber), Math.cos(a) * 58, 2.5, Math.sin(a) * 58);
  }
  l.torus(58, 0.6, M(C.timber), 0, 4.4, 0, [Math.PI / 2, 0, 0], Math.PI * 1.1, 24);
  // tüg + kurutma çerçevesi
  l.box(0.8, 22, 0.8, M(C.timberDark), 0, 11, 24);
  l.cone(1.2, 3.4, M(0xd4af37, { metal: 0.5 }), 0, 23.5, 24, 6);
  for (let i = 0; i < 3; i++) l.cone(2.6, 8, M(i % 2 ? 0xe8e0cc : 0x2a2a2a), -3 + i * 3, 17, 24.6, 5, [Math.PI, 0, 0]);
  haystack(l, -30, -20, 0.9);
  pl.root.add(p.build(true, true, true));
  if (state === 0) {
    addFire(pl.root, pl.anim, 12, 0.5, 16, 0.9);
    addSmoke(pl.root, pl.anim, 0, 15, 0, 0.7, 0xb0b0b4, 3);
    pl.npcs.push({ kind: "villager", x: 14, z: 20, yaw: 1, mode: "walk", seed: seed + 3, walk: { cx: 4, cz: 14, rx: 16, rz: 10, speed: 0.1, phase: 1 } });
    pl.npcs.push({ kind: "horse", x: -36, z: 18, yaw: 0.8, mode: "walk", seed: seed + 7, walk: { cx: -36, cz: 12, rx: 10, rz: 8, speed: 0.06, phase: 0 } });
    pl.npcs.push({ kind: "horse", x: 38, z: -16, yaw: 2, mode: "walk", seed: seed + 8, walk: { cx: 36, cz: -18, rx: 9, rz: 7, speed: -0.05, phase: 2 } });
  } else if (state === 1) {
    addFire(pl.root, pl.anim, 0, 4, 0, 1.6);
    addSmoke(pl.root, pl.anim, 0, 8, 0, 1.6, 0x303034, 5);
  }
  return pl;
}

// ───────────────────────── Haydut kampı ─────────────────────────

export function tent(l: L, x: number, z: number, w: number, h: number, yaw: number, col: number, fallen = false): void {
  const k = l.sub(x, 0, z, yaw);
  if (fallen) {
    k.box(w, 1.4, w * 0.9, M(col, { rough: 1 }), 0, 0.9, 0, [0, 0.3, 0.05]);
    k.box(0.8, 9, 0.8, M(C.timber), w * 0.3, 1.2, -2, [0, 0, 1.3]);
    return;
  }
  k.add(pyramidGeo(w, w * 0.9, h), M(col, { rough: 1, double: true }), 0, 0, 0);
  k.box(w * 0.34, h * 0.62, 0.5, M(0x1c1410), 0, h * 0.31, w * 0.45 + 0.15);
  k.box(0.7, h + 3, 0.7, M(C.timber), 0, (h + 3) / 2, 0);
}

function palisade(l: L, r: number, gapA: number, gapW: number, h: number, n: number): void {
  const wood = M(0x6a4c2e);
  const dark = M(C.timberDark);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let da = Math.abs(a - gapA);
    if (da > Math.PI) da = Math.PI * 2 - da;
    if (da < gapW) continue;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const hh = h * (0.85 + ((i * 7) % 5) * 0.06);
    l.cyl(1.1, 1.3, hh, i % 2 ? wood : dark, x, hh / 2, z, 6);
    l.cone(1.1, 3, i % 2 ? wood : dark, x, hh + 1.4, z, 6);
  }
}

export function buildCamp(seed: number, tier: number, alive: boolean): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(54);
  const p = new Parts();
  const l = new L(p);
  ground(l, 52, alive ? 0x7a6444 : 0x5a5248, 0.5, 18);
  // 2D'deki kamp yönünden: çit güneye açık (kapı +z)
  palisade(l, 46, Math.PI / 2, 0.4, 17 + tier * 1.5, 28);
  const nt = 2 + Math.min(3, tier);
  const cols = [0x6a3a2a, 0x4a4a32, 0x5a3a4a, 0x3a4a5a, 0x7a5a2a];
  for (let i = 0; i < nt; i++) {
    const a = Math.PI + (i / Math.max(1, nt - 1) - 0.5) * 2.5;
    tent(l, Math.cos(a) * 31, Math.sin(a) * 31 - 4, 22 + rnd() * 4, 16 + rnd() * 3, -a - Math.PI / 2 + Math.PI, cols[i % cols.length], !alive);
  }
  // ateş çukuru
  l.cyl(6.4, 7.2, 1.6, M(C.stoneDark), 0, 0.8, 4, 10);
  l.cyl(5, 5, 0.8, M(0x1a1410), 0, 1.4, 4, 10);
  for (let i = 0; i < 3; i++) l.cyl(0.9, 0.9, 8, M(C.timber), Math.cos(i * 2.1) * 2, 2.2, 4 + Math.sin(i * 2.1) * 2, 5, [Math.PI / 2, i * 2.1, 0]);
  // kafatası totemi + bayrak
  l.cyl(1, 1.3, 22, M(C.timberDark), -22, 11, 18, 6);
  l.sph(2.4, M(0xe6e0d0), -22, 22.5, 18, [1, 1.1, 1], 7);
  l.box(10, 6, 0.4, M(alive ? 0x8a1a1a : 0x4a3a3a, { double: true }), -17, 19, 18);
  // silah rafı / sandıklar / bidonlar
  l.box(10, 0.8, 1, M(C.timber), 24, 5, 14);
  l.box(0.8, 6, 0.8, M(C.timber), 19.5, 3, 14);
  l.box(0.8, 6, 0.8, M(C.timber), 28.5, 3, 14);
  for (let i = 0; i < 4; i++) l.box(0.5, 7, 0.5, M(0xb8bcc4, { metal: 0.6, rough: 0.4 }), 21 + i * 2.2, 5.5, 14, [0, 0, 0.12]);
  l.box(6, 5, 6, M(0x7a5a30), 24, 2.5, -14);
  l.box(5, 4, 5, M(0x6a4a28), 30, 2, -10, [0, 0.5, 0]);
  l.cyl(2.6, 2.6, 5, M(0x5a3a20), 20, 2.5, -20, 8);
  if (tier >= 2) {
    // gözetleme kulesi
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) l.cyl(0.9, 1.2, 26, M(C.timber), 34 + sx * 4, 13, -26 + sz * 4, 5, [sz * 0.06, 0, -sx * 0.06]);
    l.box(13, 1, 13, M(C.timberDark), 34, 25, -26);
    l.add(pyramidGeo(14, 14, 7), M(0x5a4030), 34, 26, -26);
  }
  rock(l, -34, -26, 5);
  rock(l, 36, 30, 4);
  pl.root.add(p.build(true, true, true));
  if (alive) {
    addFire(pl.root, pl.anim, 0, 1.6, 4, 1.5);
    addSmoke(pl.root, pl.anim, 0, 8, 4, 1.1, 0x6a6a6e, 4);
    const n = 2 + Math.min(3, tier);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.6;
      pl.npcs.push({ kind: i === 0 && tier >= 3 ? "chief" : "bandit", x: Math.cos(a) * 12, z: 4 + Math.sin(a) * 12, yaw: a + Math.PI, mode: "stand", seed: seed * 7 + i });
    }
    pl.npcs.push({ kind: "bandit", x: 20, z: 34, yaw: Math.PI / 2, mode: "walk", seed: seed + 91, walk: { cx: 4, cz: 36, rx: 22, rz: 4, speed: 0.1, phase: 0 } });
  } else {
    addSmoke(pl.root, pl.anim, 0, 3, 4, 0.7, 0x4a4a4e, 2);
  }
  return pl;
}

// ───────────────────────── Kale / hisar ─────────────────────────

export function merlons(l: L, x: number, z: number, len: number, yaw: number, y: number, col: number): void {
  const s = l.sub(x, y, z, yaw);
  const n = Math.max(2, Math.round(len / 5));
  for (let i = 0; i < n; i++) s.box(2.6, 2.6, 1.8, M(col), -len / 2 + (i + 0.5) * (len / n), 1.3, 0);
}

export function wallSeg(l: L, x0: number, z0: number, x1: number, z1: number, h: number, th: number, col: number): void {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const yaw = Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const s = l.sub(cx, 0, cz, yaw);
  s.box(len, h, th, M(col, { rough: 0.95 }), 0, h / 2, 0);
  s.box(len, 1.2, th + 1.6, M(C.stoneDark), 0, h + 0.2, 0);
  merlons(l, cx, cz, len, yaw, h + 0.8, col);
}

export function roundTower(l: L, x: number, z: number, r: number, h: number, col: number, roof: number, flagMat: ReturnType<typeof makeFlagMat> | null, pl: PlaceModel): void {
  l.cyl(r * 0.95, r * 1.08, h, M(col, { rough: 0.95 }), x, h / 2, z, 12);
  l.cyl(r * 1.18, r * 1.0, 3, M(C.stoneDark), x, h + 0.4, z, 12);
  l.cone(r * 1.3, r * 1.5, M(roof, { rough: 0.9 }), x, h + 1.9 + r * 0.75, z, 12);
  for (let i = 0; i < 3; i++) l.box(1.1, 3, 0.4, M(0x1c1410), x + Math.cos(i * 0.8 - 0.8) * r * 0.96, h * (0.45 + i * 0.1), z + Math.sin(i * 0.8 - 0.8 + Math.PI / 2) * r * 0.96);
  void flagMat;
  void pl;
}

export function buildFort(tier: 1 | 2 | 3 | 4, seed: number, ownerCol: number): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(tier * 14 + 40);
  const flag = makeFlagMat(ownerCol);
  pl.flagMat = flag;
  const p = new Parts();
  const l = new L(p);
  const R = 30 + tier * 7;
  ground(l, R + 10, 0x8a7c5a, 0.5, 22);
  if (tier === 1) {
    // ahşap gözetleme kulesi + küçük çit
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      l.cyl(1.3, 1.8, 34, M(C.timber), sx * 7, 17, sz * 7, 6, [sz * 0.08, 0, -sx * 0.08]);
    }
    l.box(18, 1.4, 18, M(C.timberDark), 0, 33, 0);
    for (const [sx, sz] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) l.box(sx ? 0.8 : 18, 4, sz ? 0.8 : 18, M(C.timber), sx * 8.6, 36, sz * 8.6);
    l.box(11, 8, 11, M(C.timber), 0, 38, 0);
    l.add(pyramidGeo(17, 17, 10), M(0x5a4030), 0, 42, 0);
    l.box(1, 34, 1.2, M(C.timberDark), 0, 17, 9, [-0.18, 0, 0]);
    palisade(l, 26, Math.PI / 2, 0.35, 11, 22);
    l.box(10, 5, 8, M(C.timberDark), 16, 2.5, -14);
    pl.root.add(p.build(true, true, true));
    addBanner(pl.root, pl.anim, 0, 48, 0, 16, flag, 11, 7);
    pl.npcs.push({ kind: "guard", x: 8, z: 14, yaw: 1.4, mode: "stand", seed: seed + 1 });
  } else if (tier === 2) {
    const h = 15;
    const hw = 34;
    // ahşap palanka: duvarlar sıralı kazık
    const wood = M(0x6a4c2e);
    const dark = M(C.timberDark);
    const side = (x0: number, z0: number, x1: number, z1: number, gap = false) => {
      const n = 13;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        if (gap && Math.abs(k - 0.5) < 0.12) continue;
        const x = x0 + (x1 - x0) * k;
        const z = z0 + (z1 - z0) * k;
        const hh = h * (0.9 + ((i * 5) % 4) * 0.05);
        l.cyl(1.3, 1.5, hh, i % 2 ? wood : dark, x, hh / 2, z, 6);
        l.cone(1.3, 3.4, i % 2 ? wood : dark, x, hh + 1.6, z, 6);
      }
    };
    side(-hw, -hw, hw, -hw);
    side(hw, -hw, hw, hw);
    side(hw, hw, -hw, hw, true);
    side(-hw, hw, -hw, -hw);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      const tx = sx * hw;
      const tz = sz * hw;
      for (const [qx, qz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]] as const) l.cyl(0.9, 1.2, 28, M(C.timber), tx + qx, 14, tz + qz, 5);
      l.box(10, 1.2, 10, M(C.timberDark), tx, 27, tz);
      l.box(9, 6, 9, M(C.timber), tx, 31, tz);
      l.add(pyramidGeo(13, 13, 7), M(0x5a4030), tx, 34, tz);
    }
    l.box(26, 12, 22, M(0x8a7a62), 0, 6, -8);
    l.add(gableGeo(30, 26, 9), M(0x7a4a32), 0, 12, -8);
    l.box(10, 18, 10, M(C.timber), 14, 9, 8);
    pl.root.add(p.build(true, true, true));
    addBanner(pl.root, pl.anim, hw, 38, -hw, 16, flag, 12, 8);
    addBanner(pl.root, pl.anim, -hw, 38, -hw, 16, flag, 12, 8);
    addFire(pl.root, pl.anim, 0, 0.6, 14, 0.7);
    pl.npcs.push({ kind: "guard", x: -8, z: hw + 8, yaw: Math.PI / 2, mode: "stand", seed: seed + 1 });
    pl.npcs.push({ kind: "guard", x: 8, z: hw + 8, yaw: Math.PI / 2, mode: "stand", seed: seed + 2 });
    pl.npcs.push({ kind: "guard", x: 0, z: 4, yaw: 0, mode: "walk", seed: seed + 3, walk: { cx: 0, cz: 6, rx: 20, rz: 12, speed: 0.1, phase: 0 } });
  } else {
    const big = tier === 4;
    const hw = big ? 46 : 36;
    const wh = big ? 26 : 22;
    const wc = C.stoneLight;
    const shade = C.stone;
    // perde duvarı
    wallSeg(l, -hw, -hw, hw, -hw, wh, 7, wc);
    wallSeg(l, hw, -hw, hw, hw, wh, 7, wc);
    wallSeg(l, -hw, hw, -hw, -hw, wh, 7, wc);
    // ön duvar kapı boşluklu
    const gate = big ? 13 : 10;
    wallSeg(l, -hw, hw, -gate, hw, wh, 7, wc);
    wallSeg(l, gate, hw, hw, hw, wh, 7, wc);
    // kule + bayrak
    const tr = big ? 11 : 9;
    const th = wh + (big ? 14 : 10);
    const towers: [number, number][] = [[-hw, -hw], [hw, -hw], [-hw, hw], [hw, hw]];
    if (big) towers.push([0, -hw], [-hw, 0], [hw, 0]);
    for (const [tx, tz] of towers) roundTower(l, tx, tz, tr, th, shade, tier === 4 ? 0x2f4f8a : 0x8a3a2a, null, pl);
    // kapı kulesi
    l.box(gate * 2 + 8, wh + 10, 12, M(shade), 0, (wh + 10) / 2, hw);
    l.box(gate * 2 - 2, wh * 0.78, 13, M(0x16110d), 0, wh * 0.39, hw + 0.4);
    l.cyl(gate - 1, gate - 1, 13, M(0x16110d), 0, wh * 0.78, hw + 0.4, 12, [Math.PI / 2, 0, 0], [1, 1, 1]);
    for (let i = 0; i < 6; i++) l.box(0.7, wh * 0.9, 0.8, M(0x2a2a30, { metal: 0.5 }), -gate + 2 + i * ((gate * 2 - 4) / 5), wh * 0.5, hw + 5.6);
    merlons(l, 0, hw, gate * 2 + 8, 0, wh + 10, wc);
    // iç yapılar
    const kw = big ? 34 : 26;
    const kh = big ? 56 : 42;
    l.box(kw, kh, kw, M(wc, { rough: 0.9 }), 0, kh / 2, -6);
    l.box(kw + 3, 3, kw + 3, M(shade), 0, kh + 1, -6);
    merlons(l, 0, -6 + kw / 2 + 1, kw + 3, 0, kh + 2.4, wc);
    merlons(l, 0, -6 - kw / 2 - 1, kw + 3, 0, kh + 2.4, wc);
    merlons(l, kw / 2 + 1, -6, kw + 3, Math.PI / 2, kh + 2.4, wc);
    merlons(l, -kw / 2 - 1, -6, kw + 3, Math.PI / 2, kh + 2.4, wc);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
      l.cyl(4.2, 4.6, kh + 10, M(shade), sx * kw * 0.5, (kh + 10) / 2, -6 + sz * kw * 0.5, 10);
      l.cone(5.6, 9, M(big ? 0x2f4f8a : 0x8a3a2a), sx * kw * 0.5, kh + 14.5, -6 + sz * kw * 0.5, 10);
    }
    for (let i = 0; i < 3; i++) l.box(1.6, 5, 0.5, M(0x16110d), -6 + i * 6, kh * 0.55, -6 + kw / 2 + 0.3);
    l.box(7, 12, 0.6, M(0x16110d), 0, 6, -6 + kw / 2 + 0.3);
    // avlu detayları
    l.box(14, 8, 10, M(0x8a7a62), -hw + 14, 4, 10);
    l.add(gableGeo(18, 14, 6), M(0x7a4a32), -hw + 14, 8, 10);
    l.cyl(3.6, 3.8, 3, M(C.stone), hw - 14, 1.5, 16, 10);
    l.cyl(2.6, 2.6, 0.5, M(0x244a60), hw - 14, 3, 16, 10);
    pl.root.add(p.build(true, true, true));
    addBanner(pl.root, pl.anim, 0, kh + 4, -6, big ? 28 : 22, flag, big ? 18 : 14, big ? 11 : 9);
    for (const [tx, tz] of towers.slice(0, 4)) addBanner(pl.root, pl.anim, tx, th + 14, tz, 14, flag, 10, 6.5);
    addBanner(pl.root, pl.anim, 0, wh + 20, hw, 14, flag, 11, 7);
    addFire(pl.root, pl.anim, -gate - 6, 6, hw + 8, 0.55);
    addFire(pl.root, pl.anim, gate + 6, 6, hw + 8, 0.55);
    pl.npcs.push({ kind: "guard", x: -gate - 6, z: hw + 14, yaw: Math.PI / 2, mode: "stand", seed: seed + 1 });
    pl.npcs.push({ kind: "guard", x: gate + 6, z: hw + 14, yaw: Math.PI / 2, mode: "stand", seed: seed + 2 });
    pl.npcs.push({ kind: "guard", x: 0, z: 10, yaw: 0, mode: "walk", seed: seed + 3, walk: { cx: 0, cz: 14, rx: 26, rz: 14, speed: 0.09, phase: 0 } });
    if (big) pl.npcs.push({ kind: "guard", x: 0, z: 20, yaw: 0, mode: "walk", seed: seed + 4, walk: { cx: 0, cz: 14, rx: 26, rz: 14, speed: -0.09, phase: 3 } });
  }
  void rnd;
  return pl;
}

// ───────────────────────── Kurgan ─────────────────────────

export function buildKurgan(seed: number, tier: number, alive: boolean): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(50);
  const p = new Parts();
  const l = new L(p);
  const r = 20 + tier * 3;
  l.dome(r, M(alive ? 0x6a7a42 : 0x7a7a52, { rough: 1 }), 0, 0, 0, [1, 0.62, 1], 16);
  l.dome(r * 0.55, M(0x7a8a4a, { rough: 1 }), 4, 6, 3, [1, 0.35, 1], 10);
  // taş halka
  const n = 12 + tier * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const hh = 3 + rnd() * 2.5;
    l.box(2.8, hh, 1.8, M(C.stone), Math.cos(a) * (r + 7), hh / 2, Math.sin(a) * (r + 7), [0, -a, (rnd() - 0.5) * 0.15]);
  }
  // balbal taşları (insan biçimli dikili taş)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6;
    const x = Math.cos(a) * (r + 14);
    const z = Math.sin(a) * (r + 14);
    l.box(2.6, 11, 1.8, M(C.stoneDark), x, 5.5, z, [0, -a, 0]);
    l.sph(1.7, M(C.stoneDark), x, 12, z, [1, 1.1, 1], 6);
    l.box(2, 0.6, 2, M(C.stoneDark), x, 8, z, [0, -a, 0]);
  }
  // giriş
  l.box(6, 7, 4, M(0x16110d), 0, 3.5, r * 0.58);
  l.box(8, 1.4, 5, M(C.stone), 0, 7.4, r * 0.58);
  if (tier >= 2) {
    for (const s of [-1, 1]) {
      l.cyl(0.5, 0.6, 22, M(C.timberDark), s * 12, 11, r * 0.78, 5);
      l.cone(2.4, 8, M(0xe8e0cc), s * 12, 18, r * 0.78, 6, [Math.PI, 0, 0]);
    }
  }
  pl.root.add(p.build(true, true, true));
  if (alive) {
    addFire(pl.root, pl.anim, -6, 6, r * 0.7, 0.6);
    addFire(pl.root, pl.anim, 6, 6, r * 0.7, 0.6);
    addSmoke(pl.root, pl.anim, 0, 8, r * 0.6, 0.8, 0x7a6a9a, 3);
  }
  return pl;
}

// ───────────────────────── Vaha ─────────────────────────

export function buildOasis(seed: number): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(62);
  const p = new Parts();
  const l = new L(p);
  l.cyl(58, 62, 1, M(0xd8c690, { rough: 1 }), 0, 0.2, 0, 22);
  l.cyl(40, 42, 1.3, M(0x7aa04a, { rough: 1 }), 0, 0.5, 0, 22, undefined, [1, 1, 0.78]);
  l.cyl(30, 31, 1.5, M(0x2f8aa8, { rough: 0.2, metal: 0.2 }), 0, 0.9, 0, 22, undefined, [1, 1, 0.72]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rnd() * 0.4;
    palm(l, Math.cos(a) * (36 + rnd() * 8), Math.sin(a) * (26 + rnd() * 6), 0.8 + rnd() * 0.45, (rnd() - 0.5) * 0.8);
  }
  for (let i = 0; i < 14; i++) {
    const a = rnd() * Math.PI * 2;
    l.cone(0.5, 5 + rnd() * 3, M(0x4a8a3a), Math.cos(a) * 27, 3, Math.sin(a) * 19, 4);
  }
  yurt(l, 44, 14, 0.6, 2.2, C.felt);
  rock(l, -46, 12, 4);
  rock(l, 20, 36, 3);
  pl.root.add(p.build(true, true, true));
  pl.npcs.push({ kind: "camel", x: -30, z: 30, yaw: 0, mode: "walk", seed: seed + 3, walk: { cx: -30, cz: 28, rx: 8, rz: 6, speed: 0.06, phase: 0 } });
  return pl;
}

// ───────────────────────── Harabe ─────────────────────────

export function buildRuin(seed: number): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(44);
  const p = new Parts();
  const l = new L(p);
  l.cyl(36, 40, 1, M(0xb8a47a, { rough: 1 }), 0, 0.2, 0, 16);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 18;
    const z = Math.sin(a) * 18;
    const hh = i % 3 === 0 ? 4 : 18 - i * 1.5;
    l.cyl(2.2, 2.6, hh, M(C.stoneLight), x, hh / 2, z, 8, [0, 0, (rnd() - 0.5) * 0.08]);
    if (hh > 10) l.box(5.8, 1.8, 5.8, M(C.stone), x, hh + 0.8, z, [0, a, 0]);
  }
  // devrik sütunlar
  for (let i = 0; i < 3; i++) l.cyl(2.2, 2.2, 14, M(C.stoneLight), -8 + i * 9, 2.2, 8 + i * 3, 8, [0, 0.4 + i, Math.PI / 2]);
  // duvar kalıntısı
  l.box(26, 7, 3, M(C.stone), 6, 3.5, -22, [0, 0.12, 0]);
  l.box(12, 4, 3, M(C.stone), -20, 2, -14, [0, -0.5, 0]);
  l.box(3, 10, 14, M(C.stone), 24, 5, 0);
  for (let i = 0; i < 12; i++) rock(l, (rnd() - 0.5) * 50, (rnd() - 0.5) * 50, 1.4 + rnd() * 1.6, C.stoneLight);
  pl.root.add(p.build(true, true, true));
  return pl;
}

// ───────────────────────── Kaynak düğümleri ─────────────────────────

export type NodeKindName = "food" | "wood" | "stone" | "gold";

export function buildNode(kind: NodeKindName, seed: number): PlaceModel {
  const rnd = seeded(seed);
  const pl = newPlace(44);
  const p = new Parts();
  const l = new L(p);
  if (kind === "gold") {
    ground(l, 34, 0x6a5a48, 0.4, 14);
    l.sph(22, M(0x7a6a58, { rough: 1 }), 0, 0, -4, [1.2, 0.8, 1], 8);
    l.sph(13, M(0x8a7a66, { rough: 1 }), -10, 2, -10, [1, 0.8, 1], 7);
    for (const s of [-1, 1]) l.box(2, 15, 2, M(C.timber), s * 6.5, 7.5, 12);
    l.box(17, 2.2, 3, M(C.timberDark), 0, 15.6, 12);
    l.box(11, 13, 2, M(0x100c08), 0, 6.5, 11);
    for (let i = 0; i < 5; i++) l.box(1.6, 0.5, 14, M(C.timber), -3 + i * 1.5, 0.5, 20, [0, 0, 0]);
    l.box(7, 4, 5, M(0x5a4a3a), 3, 3, 24);
    for (let i = 0; i < 8; i++) l.sph(0.9 + rnd() * 0.5, M(0xf2c230, { emissive: 0xaa7a10, ei: 0.5, metal: 0.5 }), 2 + rnd() * 3, 5.2, 23 + rnd() * 2, undefined, 5);
    l.cyl(0.4, 0.4, 6, M(C.timber), 12, 3, 14, 4);
    l.sph(1.1, M(0xffcf5a, { emissive: 0xffaa22, ei: 1 }), 12, 6.6, 14, undefined, 6);
    for (let i = 0; i < 7; i++) rock(l, (rnd() - 0.5) * 60, (rnd() - 0.5) * 40, 1.6 + rnd() * 2);
    pl.npcs.push({ kind: "porter", x: -12, z: 20, yaw: 1, mode: "walk", seed: seed + 1, walk: { cx: 0, cz: 22, rx: 16, rz: 4, speed: 0.1, phase: 0 } });
  } else if (kind === "stone") {
    ground(l, 36, 0xa09484, 0.4, 14);
    for (let i = 0; i < 4; i++) l.box(46 - i * 9, 6, 28 - i * 5, M(i % 2 ? C.stone : C.stoneLight, { rough: 1 }), 0, 3 + i * 6, -8 - i * 2);
    for (let i = 0; i < 10; i++) l.box(5 + rnd() * 2, 3.5, 4, M(C.stoneLight), -22 + (i % 5) * 8, 1.8 + Math.floor(i / 5) * 3.5, 22 + (i % 2) * 2);
    l.box(1.4, 24, 1.4, M(C.timber), 24, 12, 8);
    l.box(22, 1.2, 1.2, M(C.timber), 14, 24, 8, [0, 0, -0.1]);
    l.box(0.2, 14, 0.2, M(0x3a2a1a), 5, 17, 8);
    l.box(5, 4, 5, M(C.stone), 5, 9, 8);
    for (let i = 0; i < 6; i++) rock(l, (rnd() - 0.5) * 60, 24 + rnd() * 8, 1.4 + rnd() * 1.4, C.stoneDark);
    pl.npcs.push({ kind: "porter", x: -14, z: 18, yaw: 1, mode: "hammer", seed: seed + 1 });
  } else if (kind === "wood") {
    ground(l, 38, 0x6a7a44, 0.4, 14);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + rnd();
      tree(l, Math.cos(a) * (22 + rnd() * 10), Math.sin(a) * (20 + rnd() * 8) - 2, 1 + rnd() * 0.5, (i % 3) as 0 | 1 | 2);
    }
    for (let i = 0; i < 9; i++) l.cyl(2, 2, 18, M(0x7a5230), -18 + (i % 3) * 4.2, 2.1 + Math.floor(i / 3) * 3.6, 18, 7, [0, 0.3, Math.PI / 2]);
    l.box(14, 8, 11, M(C.timber), 20, 4, 14);
    l.add(gableGeo(17, 14, 6), M(C.thatchDark), 20, 8, 14);
    for (let i = 0; i < 4; i++) l.cyl(1.6, 2, 2.4, M(0x8a6a3a), -10 + i * 8, 1.2, -16, 7);
    l.box(0.6, 5, 0.6, M(C.timberDark), 4, 3.4, 22, [0, 0, 0.5]);
    pl.npcs.push({ kind: "porter", x: -8, z: 24, yaw: 1, mode: "hammer", seed: seed + 1 });
  } else {
    ground(l, 38, 0x8a9a52, 0.4, 14);
    field(l, -16, -6, 28, 30, 0.1, 0x7aa84a, 0x5a9a3a);
    field(l, 20, -2, 24, 26, -0.1, 0xd8b840, 0xc8a830);
    field(l, 0, 28, 30, 14, 0, 0x6a9a3a, 0x8ab85a);
    l.box(14, 9, 12, M(0xb89864), 28, 4.5, 24);
    l.add(gableGeo(17, 15, 7), M(0xa8452a), 28, 9, 24);
    haystack(l, -30, 26, 1);
    haystack(l, -22, 30, 0.8);
    l.box(0.6, 12, 0.6, M(C.timber), -4, 6, 14);
    l.box(8, 0.6, 0.6, M(C.timber), -4, 9, 14);
    l.sph(1.6, M(0xd8c090), -4, 13, 14, undefined, 6);
    tree(l, 38, 6, 0.9);
    pl.npcs.push({ kind: "villager", x: 0, z: 6, yaw: 1, mode: "walk", seed: seed + 2, walk: { cx: 0, cz: 6, rx: 22, rz: 14, speed: 0.08, phase: 0 } });
  }
  pl.root.add(p.build(true, true, true));
  return pl;
}
