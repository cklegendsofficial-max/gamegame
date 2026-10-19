import { M, Parts, seeded } from "./Kit";
import { L, addBanner, addFire, addSmoke, gableGeo, makeFlagMat, newPlace, pyramidGeo, type PlaceModel } from "./Build";
import { palm, roundTower, rock, tree, wallSeg } from "./Settlements3D";

/**
 * Dokuz şehir: surlar, kuleler, kapı, evler, han, demirci, pazar + her şehrin
 * kendine özgü silüeti (Registan, Kalyan, Ayasofya, Mevlana...).
 */

type StyleId = "turquoise" | "mudbrick" | "china" | "bazaar" | "seljuk" | "byzantine";

interface Style {
  wall: number;
  wallDark: number;
  houses: number[];
  roof: number;
  dome: number;
  accent: number;
  ground: number;
  pitched: boolean;
}

const STYLES: Record<StyleId, Style> = {
  turquoise: { wall: 0xdcc088, wallDark: 0xb8a070, houses: [0xe0c890, 0xd4b47c, 0xe8d4a0, 0xcaa86a], roof: 0x1fb0a0, dome: 0x1fb4a4, accent: 0x1a6a9a, ground: 0xc8b484, pitched: false },
  mudbrick: { wall: 0xc09a60, wallDark: 0x9a7848, houses: [0xc8a468, 0xb8925a, 0xd0b074, 0xbb9a62], roof: 0xa07a48, dome: 0x2a9a9a, accent: 0x8a5a2a, ground: 0xc0a070, pitched: false },
  china: { wall: 0xb8a890, wallDark: 0x8a7a68, houses: [0xe0d0b0, 0xd4c4a4, 0xc8b898, 0xe6d8bc], roof: 0xb02a22, dome: 0xd4a830, accent: 0xb02a22, ground: 0xbcae8c, pitched: true },
  bazaar: { wall: 0xc4aa78, wallDark: 0x9a8458, houses: [0xd4b884, 0xc8a874, 0xdcc294, 0xc0a06c], roof: 0xb0794a, dome: 0xb88a58, accent: 0x2a5a8a, ground: 0xc2ac80, pitched: false },
  seljuk: { wall: 0xcdbc9e, wallDark: 0xa89878, houses: [0xdccaa8, 0xd0bc98, 0xe4d4b4, 0xc8b490], roof: 0xa8452a, dome: 0x2c9a84, accent: 0x2a7a6a, ground: 0xc6b690, pitched: true },
  byzantine: { wall: 0xe0d0aa, wallDark: 0xb8a67e, houses: [0xeadcb8, 0xdcc89c, 0xf0e4c4, 0xd8c498], roof: 0xc0502a, dome: 0x8a9ca8, accent: 0xa02a3a, ground: 0xcab88e, pitched: true },
};

const CITY_STYLE: Record<string, StyleId> = {
  samarkand: "turquoise",
  bukhara: "turquoise",
  nishapur: "turquoise",
  merv: "mudbrick",
  kashgar: "china",
  rey: "bazaar",
  tabriz: "bazaar",
  konya: "seljuk",
  constantinople: "byzantine",
};

// ───────────────────────── parçalar ─────────────────────────

function minaret(l: L, x: number, z: number, h: number, r: number, band: number, cap: number): void {
  l.cyl(r * 0.78, r, h, M(0xe8dcc0), x, h / 2, z, 12);
  const n = Math.max(2, Math.floor(h / 14));
  for (let i = 0; i < n; i++) l.cyl(r * 0.84, r * 0.84, 1.8, M(band), x, h * 0.2 + (i * h * 0.5) / n, z, 12);
  l.cyl(r * 1.7, r * 1.4, 2.4, M(0xcfc0a0), x, h * 0.84, z, 12);
  l.cyl(r * 0.7, r * 0.7, h * 0.12, M(0xe8dcc0), x, h * 0.92, z, 10);
  l.cone(r * 1.0, h * 0.16, M(cap), x, h + h * 0.06, z, 10);
  l.sph(r * 0.25, M(0xd4af37, { metal: 0.6 }), x, h + h * 0.15, z, undefined, 6);
}

function pishtaq(l: L, x: number, z: number, w: number, h: number, col: number, tile: number, yaw = 0): void {
  const k = l.sub(x, 0, z, yaw);
  k.box(w, h, 5, M(col), 0, h / 2, 0);
  k.box(w * 0.52, h * 0.64, 5.6, M(0x16110d), 0, h * 0.32, 0.3);
  k.cyl(w * 0.26, w * 0.26, 5.6, M(0x16110d), 0, h * 0.64, 0.3, 14, [Math.PI / 2, 0, 0]);
  k.box(w * 1.02, 2.2, 5.4, M(tile), 0, h - 1.2, 0.1);
  k.box(w * 0.7, 1.4, 5.8, M(tile), 0, h * 0.78, 0.35);
  for (const s of [-1, 1]) {
    k.cyl(1.2, 1.4, h * 0.95, M(tile), s * w * 0.46, h * 0.48, 2.9, 8);
  }
}

function mosque(l: L, x: number, z: number, r: number, wh: number, st: Style, minarets: number, domeCol = st.dome, yaw = 0): void {
  const k = l.sub(x, 0, z, yaw);
  k.box(r * 2, wh, r * 2, M(st.wall, { rough: 0.9 }), 0, wh / 2, 0);
  k.box(r * 2.1, 2, r * 2.1, M(st.wallDark), 0, wh + 0.4, 0);
  for (let i = 0; i < 4; i++) k.box(2.4, wh * 0.45, 0.6, M(0x16110d), -r * 0.6 + i * r * 0.4, wh * 0.55, r + 0.2);
  k.box(r * 0.5, wh * 0.6, 0.8, M(0x16110d), 0, wh * 0.3, r + 0.2);
  k.cyl(r * 0.78, r * 0.86, r * 0.34, M(st.wall), 0, wh + r * 0.17, 0, 16);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.box(1.6, r * 0.18, 0.5, M(0x16110d), Math.cos(a) * r * 0.8, wh + r * 0.18, Math.sin(a) * r * 0.8, [0, -a + Math.PI / 2, 0]);
  }
  k.dome(r * 0.82, M(domeCol, { rough: 0.35, metal: 0.25 }), 0, wh + r * 0.34, 0, [1, 1.08, 1], 18);
  k.cyl(0.4, 0.5, r * 0.4, M(0xd4af37, { metal: 0.6 }), 0, wh + r * 1.24, 0, 6);
  k.sph(1, M(0xd4af37, { metal: 0.6 }), 0, wh + r * 1.5, 0, undefined, 6);
  const mh = wh + r * 1.1;
  if (minarets >= 1) {
    minaret(k, -r - 3, r + 3, mh, 2.6, st.accent, st.dome);
    if (minarets >= 2) minaret(k, r + 3, r + 3, mh, 2.6, st.accent, st.dome);
    if (minarets >= 4) {
      minaret(k, -r - 3, -r - 3, mh, 2.6, st.accent, st.dome);
      minaret(k, r + 3, -r - 3, mh, 2.6, st.accent, st.dome);
    }
  }
}

function madrasa(l: L, x: number, z: number, w: number, d: number, h: number, yaw: number, st: Style, minarets = true): void {
  const k = l.sub(x, 0, z, yaw);
  k.box(w, h, d, M(st.wall, { rough: 0.9 }), 0, h / 2, 0);
  k.box(w + 1.5, 1.6, d + 1.5, M(st.wallDark), 0, h + 0.2, 0);
  for (let i = 0; i < 6; i++) k.box(2.2, h * 0.34, 0.6, M(0x16110d), -w * 0.4 + i * (w * 0.16), h * 0.62, d / 2 + 0.2);
  pishtaq(k, 0, d / 2 + 1.2, w * 0.4, h * 1.35, st.wall, st.accent);
  k.dome(w * 0.22, M(st.dome, { rough: 0.35, metal: 0.25 }), 0, h + 1, -d * 0.2, [1, 1.1, 1], 14);
  if (minarets) {
    minaret(k, -w / 2 + 2, d / 2, h * 1.9, 2.4, st.accent, st.dome);
    minaret(k, w / 2 - 2, d / 2, h * 1.9, 2.4, st.accent, st.dome);
  }
}

function fountain(l: L, x: number, z: number): void {
  l.cyl(8, 9, 2.4, M(0xb8aa8a), x, 1.2, z, 14);
  l.cyl(6.6, 6.6, 0.6, M(0x2f8aa8, { rough: 0.2, metal: 0.2 }), x, 2.4, z, 14);
  l.cyl(1.1, 1.4, 6, M(0xb8aa8a), x, 5, z, 8);
  l.sph(2.4, M(0xb8aa8a), x, 8.2, z, [1, 0.5, 1], 8);
  l.sph(0.8, M(0x7ac8e0, { emissive: 0x2a8aa8, ei: 0.5 }), x, 9.6, z, undefined, 6);
}

function townHouse(l: L, x: number, z: number, w: number, d: number, h: number, yaw: number, st: Style, rnd: () => number, wallCol: number): void {
  const k = l.sub(x, 0, z, yaw);
  k.box(w, h, d, M(wallCol, { rough: 0.95 }), 0, h / 2, 0);
  k.box(w + 0.6, 1.5, d + 0.6, M(st.wallDark), 0, 0.75, 0);
  k.box(w * 0.22, h * 0.52, 0.5, M(0x3a2616), w * 0.18, h * 0.26, d / 2 + 0.2);
  for (let i = 0; i < 2; i++) {
    k.box(w * 0.14, h * 0.2, 0.5, M(0x1c1410), -w * 0.28 + i * w * 0.16, h * 0.66, d / 2 + 0.2);
    k.box(w * 0.18, 0.6, 0.8, M(st.accent), -w * 0.28 + i * w * 0.16, h * 0.54, d / 2 + 0.3);
  }
  const kind = st.pitched ? 1 : rnd() < 0.18 ? 2 : 0;
  if (kind === 1) {
    k.add(rnd() < 0.5 ? gableGeo(w + 4, d + 4, h * 0.55) : pyramidGeo(w + 4, d + 4, h * 0.6), M(st.roof, { rough: 1 }), 0, h, 0);
  } else if (kind === 2) {
    k.dome(Math.min(w, d) * 0.5, M(st.dome, { rough: 0.4, metal: 0.2 }), 0, h, 0, [1, 0.9, 1], 10);
  } else {
    k.box(w + 1.4, 1.4, d + 1.4, M(st.wallDark), 0, h + 0.5, 0);
    if (rnd() < 0.4) k.box(w * 0.28, h * 0.22, d * 0.28, M(wallCol), -w * 0.2, h + h * 0.11 + 1.2, 0);
    if (rnd() < 0.3) k.add(pyramidGeo(w * 0.3, d * 0.3, 4), M(0xc8503a), w * 0.2, h + 1.2, 0);
  }
}

function stall(l: L, x: number, z: number, yaw: number, ca: number, cb: number, goods: number): void {
  const k = l.sub(x, 0, z, yaw);
  for (const sx of [-1, 1]) {
    k.box(0.8, 11, 0.8, M(0x5a3c22), sx * 6.2, 5.5, -3);
    k.box(0.8, 8, 0.8, M(0x5a3c22), sx * 6.2, 4, 4);
  }
  for (let i = 0; i < 6; i++) k.box(2.1, 0.6, 9.6, M(i % 2 ? ca : cb, { double: true }), -5.2 + i * 2.1, 9.6 - 0.07 * i * 0, 0.4, [0.28, 0, 0]);
  k.box(13, 3.4, 3, M(0x7a5a38), 0, 1.7, 5.4);
  for (let i = 0; i < 5; i++) k.sph(1.1, M(goods + i * 0x0a1208), -5 + i * 2.5, 4.2, 5.4, undefined, 6);
  k.box(5, 3, 4, M(0x8a6a3a), 7.5, 1.5, -2);
}

// ───────────────────────── Han ─────────────────────────

function han(l: L, pl: PlaceModel, x: number, z: number, yaw: number, st: Style): void {
  const k = l.sub(x, 0, z, yaw);
  const W = 40;
  const D = 34;
  const h = 15;
  const wc = st.wall;
  // dış duvarlar
  k.box(W, h, 3.2, M(wc, { rough: 0.95 }), 0, h / 2, -D / 2);
  k.box(3.2, h, D, M(wc, { rough: 0.95 }), -W / 2, h / 2, 0);
  k.box(3.2, h, D, M(wc, { rough: 0.95 }), W / 2, h / 2, 0);
  k.box(W * 0.33, h, 3.2, M(wc, { rough: 0.95 }), -W * 0.335, h / 2, D / 2);
  k.box(W * 0.33, h, 3.2, M(wc, { rough: 0.95 }), W * 0.335, h / 2, D / 2);
  k.box(W + 3.4, 1.6, 3.8, M(st.wallDark), 0, h + 0.2, -D / 2);
  k.box(3.8, 1.6, D + 0.4, M(st.wallDark), -W / 2, h + 0.2, 0);
  k.box(3.8, 1.6, D + 0.4, M(st.wallDark), W / 2, h + 0.2, 0);
  // kapı / eyvan
  pishtaq(k, 0, D / 2 + 0.5, W * 0.34, h * 1.35, wc, st.accent);
  k.dome(W * 0.1, M(st.dome, { rough: 0.4, metal: 0.2 }), 0, h * 1.35 - 1, D / 2 - 2, [1, 1, 1], 10);
  // avlu çevresi: kemerli odalar
  for (let i = 0; i < 4; i++) {
    k.box(6, 9, 5, M(st.wallDark), -W / 2 + 6, 4.5, -D / 2 + 6 + i * 6.8);
    k.box(6, 9, 5, M(st.wallDark), W / 2 - 6, 4.5, -D / 2 + 6 + i * 6.8);
    k.box(0.6, 6, 3, M(0x16110d), -W / 2 + 9.1, 3.5, -D / 2 + 6 + i * 6.8);
    k.box(0.6, 6, 3, M(0x16110d), W / 2 - 9.1, 3.5, -D / 2 + 6 + i * 6.8);
  }
  // avlu zemini + havuz
  k.box(W - 4, 0.5, D - 4, M(0xb8a47a, { rough: 1 }), 0, 0.3, 0);
  k.cyl(4, 4.4, 1.4, M(0xb8aa8a), 0, 0.7, -2, 10);
  k.cyl(3, 3, 0.4, M(0x2f8aa8, { rough: 0.2 }), 0, 1.4, -2, 10);
  // tabela direği + asılı tabela
  k.box(0.7, 24, 0.7, M(0x4a3220), W * 0.34, 12, D / 2 + 5);
  k.box(7, 4.4, 0.6, M(0xd4af37, { metal: 0.4 }), W * 0.34 + 3.8, 22, D / 2 + 5);
  // dışarıda bağlı develer için yem yalağı
  k.box(10, 2.2, 3, M(0x6a4a2a), -W * 0.6, 1.1, D / 2 + 8);
  k.box(0.8, 5, 0.8, M(0x4a3220), -W * 0.6 - 5, 2.5, D / 2 + 8);
  k.box(0.8, 5, 0.8, M(0x4a3220), -W * 0.6 + 5, 2.5, D / 2 + 8);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const wp = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  const inn = wp(W * 0.12, D / 2 + 9);
  pl.npcs.push({ kind: "innkeeper", x: inn[0], z: inn[1], yaw: yaw + 0.4, mode: "stand", seed: 21 });
  const cm = wp(-W * 0.6, D / 2 + 16);
  pl.npcs.push({ kind: "camel", x: cm[0], z: cm[1], yaw: yaw + 1.2, mode: "stand", seed: 33 });
  const cm2 = wp(-W * 0.35, D / 2 + 22);
  pl.npcs.push({ kind: "camel", x: cm2[0], z: cm2[1], yaw: yaw + 2, mode: "stand", seed: 34 });
  const pt = wp(0, 4);
  pl.npcs.push({ kind: "porter", x: pt[0], z: pt[1], yaw: 0, mode: "walk", seed: 7, walk: { cx: pt[0], cz: pt[1], rx: 10, rz: 6, speed: 0.1, phase: 0 } });
}

// ───────────────────────── Demirci ─────────────────────────

function forge(l: L, pl: PlaceModel, x: number, z: number, yaw: number): void {
  const k = l.sub(x, 0, z, yaw);
  const wood = M(0x5a3c22);
  for (const [px, pz] of [[-9, -8], [9, -8], [-9, 8], [9, 8]] as const) k.box(1.2, 14, 1.2, wood, px, 7, pz);
  k.add(gableGeo(24, 22, 8), M(0x6a4030, { rough: 1 }), 0, 14, 0);
  k.box(18, 0.8, 16, M(0x4a3a2a, { rough: 1 }), 0, 0.5, 0);
  // ocak (taş + parlayan kor)
  k.box(7, 6, 6, M(0x8a8478), -5, 3, -5);
  k.box(5.6, 0.6, 4.6, M(0x2a0a04, { emissive: 0xff5a14, ei: 1.4 }), -5, 6.2, -5);
  k.box(3.2, 20, 3.2, M(0x7a746a), -5, 10, -7);
  // örs
  k.box(3, 4, 3, M(0x4a3a2a), 4, 2, 2);
  k.box(5.4, 1.6, 2.2, M(0x3a3a42, { metal: 0.6 }), 4, 4.6, 2);
  k.cone(0.9, 2.4, M(0x3a3a42), 7.2, 4.6, 2, 5, [0, 0, -Math.PI / 2]);
  // körük + su fıçısı + silah rafı
  k.box(3.6, 2.4, 2.4, M(0x6a3a1a), -9.6, 2.6, -2);
  k.cyl(2, 2, 3.6, M(0x4a3220), 8, 1.8, -5, 8);
  k.box(7, 0.6, 0.6, wood, 0, 9, 8.2);
  for (let i = 0; i < 4; i++) k.box(0.5, 7, 0.3, M(0xc4c8d0, { metal: 0.7, rough: 0.3 }), -3 + i * 2, 5.2, 8.4, [0, 0, 0.1]);
  k.box(6, 3.8, 0.5, M(0x8a1a14), 0, 15, 11.4);
  k.sph(1.4, M(0xd4af37, { metal: 0.5 }), 0, 15, 11.8, [1.3, 0.5, 0.5], 6);
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const wp = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
  const at = wp(4, 6);
  pl.npcs.push({ kind: "blacksmith", x: at[0], z: at[1], yaw: yaw + Math.PI * 0.9, mode: "hammer", seed: 5 });
  const f = wp(-5, -5);
  const ch = wp(-5, -7);
  addFire(pl.root, pl.anim, f[0], 6.4, f[1], 0.5);
  addSmoke(pl.root, pl.anim, ch[0], 20.5, ch[1], 0.9, 0x6a6a6e, 4);
}

// ───────────────────────── Şehir silüetleri ─────────────────────────

function landmark(id: string, l: L, st: Style, pl: PlaceModel): void {
  switch (id) {
    case "samarkand": {
      // Registan: üç medrese avluyu çevreler
      madrasa(l, 0, -46, 52, 24, 24, 0, st);
      madrasa(l, -50, -16, 44, 22, 20, Math.PI / 2, st, false);
      madrasa(l, 50, -16, 44, 22, 20, -Math.PI / 2, st, false);
      mosque(l, 0, -74, 12, 16, st, 0, st.dome);
      break;
    }
    case "bukhara": {
      // Kalyan minaresi + Mir-i Arab + Ark yüksek tabanı
      l.cyl(5.2, 7, 74, M(0xcfae78), -30, 37, -48, 14);
      for (let i = 0; i < 6; i++) l.cyl(5.4 - i * 0.18, 5.4 - i * 0.18, 2.2, M(i % 2 ? st.accent : 0xb8946a), -30, 12 + i * 8.5, -48, 14);
      l.cyl(8.6, 7, 4, M(0xcfae78), -30, 66, -48, 14);
      l.cyl(5, 5.6, 8, M(0xe0c690), -30, 72, -48, 12);
      l.cone(6, 9, M(st.dome), -30, 80.5, -48, 12);
      mosque(l, 14, -48, 20, 18, st, 2, st.dome);
      madrasa(l, 50, -22, 40, 22, 18, -Math.PI / 2, st, false);
      break;
    }
    case "nishapur": {
      mosque(l, 0, -44, 18, 18, st, 2, st.dome);
      // Hayyam köşkü: sekiz sütunlu kubbeli bahçe köşkü
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        l.cyl(0.8, 0.9, 12, M(0xe8dcc0), 46 + Math.cos(a) * 8, 6, -28 + Math.sin(a) * 8, 6);
      }
      l.cyl(10, 10, 1.2, M(0xd8cca8), 46, 12.4, -28, 12);
      l.dome(9, M(st.dome, { rough: 0.35, metal: 0.25 }), 46, 13, -28, [1, 1.1, 1], 12);
      l.cyl(11, 11, 0.8, M(0xcfc29c), 46, 0.6, -28, 14);
      l.cyl(13, 13, 0.5, M(0x2f8aa8, { rough: 0.2 }), 12, 0.6, 2, 14, undefined, [1, 1, 0.5]);
      break;
    }
    case "merv": {
      // Sultan Sencer türbesi + yığma kerpiç kale (Gyz Gala)
      l.box(36, 34, 36, M(0xcbb07c, { rough: 0.95 }), 0, 17, -50);
      l.cyl(15, 17, 10, M(0xcbb07c), 0, 39, -50, 14);
      l.dome(16, M(0x2a9a9a, { rough: 0.35, metal: 0.25 }), 0, 44, -50, [1, 1.15, 1], 16);
      l.sph(1.2, M(0xd4af37, { metal: 0.6 }), 0, 63, -50, undefined, 6);
      pishtaq(l, 0, -30, 18, 26, 0xcbb07c, st.accent);
      l.cyl(18, 28, 42, M(0xb28f5a, { rough: 1 }), -58, 21, -34, 12);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        l.box(4, 36, 5, M(0xa8844e), -58 + Math.cos(a) * 26, 18, -34 + Math.sin(a) * 26, [0, -a, 0]);
      }
      l.cyl(15, 16, 4, M(0xa8844e), -58, 44, -34, 12);
      break;
    }
    case "kashgar": {
      // Id Kah: sarı portal, ince minareler, pagoda kapı
      pishtaq(l, 0, -30, 54, 36, 0xe0b850, 0xa82a2a);
      l.box(64, 18, 28, M(0xd8c8a0, { rough: 0.95 }), 0, 9, -48);
      l.box(66, 2, 30, M(st.wallDark), 0, 19, -48);
      for (let i = 0; i < 8; i++) l.cyl(1.2, 1.3, 16, M(0xa82a2a), -28 + i * 8, 8, -34, 8);
      minaret(l, -32, -28, 46, 2.6, 0xa82a2a, st.dome);
      minaret(l, 32, -28, 46, 2.6, 0xa82a2a, st.dome);
      for (let i = 0; i < 3; i++) {
        l.add(pyramidGeo(34 - i * 8, 34 - i * 8, 8), M(st.roof), 0, 36 + i * 9, -30);
        l.box(30 - i * 8, 5, 4, M(0xe0b850), 0, 36 + i * 9 - 3, -30);
      }
      l.sph(1.6, M(0xd4af37, { metal: 0.6 }), 0, 66, -30, undefined, 6);
      break;
    }
    case "rey": {
      // Tuğrul kulesi + kubbeli çarşı
      l.cyl(8.8, 10, 62, M(0xb87a4a), -36, 31, -50, 14);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        l.box(1.8, 62, 2.4, M(0xa56a3c), -36 + Math.cos(a) * 9.6, 31, -50 + Math.sin(a) * 9.6, [0, -a, 0]);
      }
      l.cyl(9.4, 9.4, 2.4, M(0x8a5a3a), -36, 60, -50, 14);
      l.cone(9.8, 20, M(0xa56a3c), -36, 71, -50, 14);
      // çarşı
      l.box(70, 16, 22, M(st.wall, { rough: 0.95 }), 14, 8, -54);
      for (let i = 0; i < 6; i++) l.dome(7, M(st.dome, { rough: 0.6 }), -10 + i * 14, 16, -54, [1, 0.9, 1], 10);
      for (let i = 0; i < 7; i++) l.box(3.4, 10, 0.6, M(0x16110d), -18 + i * 10.5, 5, -42.6);
      mosque(l, 56, -34, 12, 14, st, 1, 0x2a6a9a);
      break;
    }
    case "tabriz": {
      // Arg kale duvarı + Mavi Cami + çarşı kubbeleri
      l.box(46, 58, 24, M(0xa86a42, { rough: 1 }), -34, 29, -56);
      l.box(20, 36, 25, M(0x16110d), -34, 18, -56);
      l.cyl(10, 10, 25, M(0x16110d), -34, 36, -56, 14, [Math.PI / 2, 0, 0]);
      l.box(48, 2.4, 26, M(0x7a4a2c), -34, 59, -56);
      mosque(l, 22, -50, 20, 18, st, 2, st.dome, 0);
      l.box(60, 12, 18, M(st.wall, { rough: 0.95 }), 16, 6, -4);
      for (let i = 0; i < 5; i++) l.dome(6, M(st.dome, { rough: 0.6 }), -8 + i * 12.5, 12, -4, [1, 0.9, 1], 9);
      break;
    }
    case "konya": {
      // Mevlana: çiftlenmiş turkuaz yivli kubbe + Alaaddin portali
      l.box(34, 18, 26, M(st.wall, { rough: 0.95 }), -6, 9, -50);
      l.cyl(10, 11, 14, M(st.wall), -12, 25, -50, 14);
      l.cone(12, 24, M(0x2c9a8a, { rough: 0.4, metal: 0.2 }), -12, 44, -50, 16);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        l.box(0.8, 24, 0.8, M(0x1a7a6a), -12 + Math.cos(a) * 9, 31, -50 + Math.sin(a) * 9, [0.28 * Math.cos(a), 0, -0.28 * Math.sin(a)]);
      }
      l.dome(7, M(0x2c9a8a, { rough: 0.4, metal: 0.2 }), 10, 18, -50, [1, 1, 1], 12);
      minaret(l, 22, -38, 52, 2.8, 0x2a7a8a, 0x2c9a8a);
      pishtaq(l, 0, -22, 30, 32, 0xd8c8a0, 0x2a6a8a);
      // çift başlı kartal rölyefi
      l.box(7, 4, 0.8, M(0x7a6a50), 0, 28, -19);
      l.sph(1.3, M(0x7a6a50), -2.2, 30.4, -19, undefined, 6);
      l.sph(1.3, M(0x7a6a50), 2.2, 30.4, -19, undefined, 6);
      break;
    }
    case "constantinople": {
      // Ayasofya: ana kubbe + yarım kubbeler + payandalar + 4 minare
      l.box(70, 34, 54, M(0xd8b888, { rough: 0.95 }), 0, 17, -52);
      l.box(72, 2.4, 56, M(0xb89868), 0, 34.6, -52);
      l.cyl(24, 26, 10, M(0xd8b888), 0, 41, -52, 20);
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        l.box(2.2, 5, 0.6, M(0x16110d), Math.cos(a) * 24.8, 42, -52 + Math.sin(a) * 24.8, [0, -a + Math.PI / 2, 0]);
      }
      l.dome(26, M(0x8a9ca8, { rough: 0.4, metal: 0.3 }), 0, 46, -52, [1, 0.95, 1], 24);
      l.dome(17, M(0x8a9ca8, { rough: 0.4, metal: 0.3 }), 0, 30, -22, [1, 0.8, 1], 16);
      l.dome(17, M(0x8a9ca8, { rough: 0.4, metal: 0.3 }), 0, 30, -82, [1, 0.8, 1], 16);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) l.box(8, 36, 8, M(0xc8a878), sx * 36, 18, -52 + sz * 30);
      l.sph(1.4, M(0xd4af37, { metal: 0.6 }), 0, 74, -52, undefined, 6);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) minaret(l, sx * 44, -52 + sz * 36, 74, 2.8, 0xb8946a, 0x8a9ca8);
      // Konstantin sütunu
      l.cyl(2.6, 3.2, 40, M(0xb8a888), 38, 20, 6, 10);
      l.sph(2.8, M(0xd4af37, { metal: 0.5 }), 38, 42, 6, undefined, 6);
      break;
    }
    default:
      mosque(l, 0, -46, 16, 16, st, 2);
  }
  void pl;
}

// ───────────────────────── ana yapıcı ─────────────────────────

export function buildCity(id: string, capital: boolean, ownerCol: number): PlaceModel {
  const sid = CITY_STYLE[id] ?? "bazaar";
  const st = STYLES[sid];
  const seed = id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 9973;
  const rnd = seeded(seed);
  const R = id === "constantinople" ? 118 : capital ? 112 : 104;
  const pl = newPlace(R + 20);
  const flag = makeFlagMat(ownerCol);
  pl.flagMat = flag;
  const p = new Parts();
  const l = new L(p);

  // zemin kaidesi + kaldırım
  l.cyl(R + 12, R + 22, 16, M(0x8a7a58, { rough: 1 }), 0, -8, 0, 28);
  l.cyl(R + 10, R + 12, 1.6, M(st.ground, { rough: 1 }), 0, 0.2, 0, 28);
  l.cyl(R - 4, R - 2, 0.6, M(st.ground, { rough: 1 }), 0, 1.1, 0, 28);
  // ana cadde + meydan
  l.box(18, 0.5, R * 0.95, M(0xaa9a78, { rough: 1 }), 0, 1.5, R * 0.5);
  l.cyl(28, 28, 0.5, M(0xb4a482, { rough: 1 }), 0, 1.5, 28, 24);
  l.box(R * 1.2, 0.5, 12, M(0xaa9a78, { rough: 1 }), 0, 1.45, 28);

  // surlar + kuleler
  const n = 10;
  const wallH = 24;
  const verts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI / 2 + Math.PI / n + (i * Math.PI * 2) / n;
    verts.push([Math.cos(a) * R, Math.sin(a) * R]);
  }
  const g = 13;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = verts[i];
    const [x1, z1] = verts[(i + 1) % n];
    if (i === n - 1) {
      // kapı kenarı: v[n-1] → v[0], ortası kapı
      const mx = (x0 + x1) / 2;
      const mz = (z0 + z1) / 2;
      const dx = (x1 - x0) / Math.hypot(x1 - x0, z1 - z0);
      const dz = (z1 - z0) / Math.hypot(x1 - x0, z1 - z0);
      wallSeg(l, x0, z0, mx + dx * g * -1.0, mz + dz * g * -1.0, wallH, 7, st.wall);
      wallSeg(l, mx + dx * g, mz + dz * g, x1, z1, wallH, 7, st.wall);
      // kapı kulesi
      l.box(g * 2 + 14, wallH + 12, 14, M(st.wall, { rough: 0.9 }), mx, (wallH + 12) / 2, mz);
      l.box(g * 1.5, wallH * 0.82, 15, M(0x16110d), mx, wallH * 0.41, mz + 0.4);
      l.cyl(g * 0.75, g * 0.75, 15, M(0x16110d), mx, wallH * 0.82, mz + 0.4, 14, [Math.PI / 2, 0, 0]);
      for (let k = 0; k < 7; k++) l.box(0.7, wallH * 0.95, 0.8, M(0x2a2a30, { metal: 0.5 }), mx - g * 0.7 + k * (g * 1.4) / 6, wallH * 0.5, mz + 7.4);
      l.box(g * 2 + 16, 2, 16, M(st.wallDark), mx, wallH + 12.6, mz);
      for (let k = 0; k < 6; k++) l.box(3, 3, 2.4, M(st.wall), mx - g - 5 + k * ((g * 2 + 10) / 5), wallH + 14.6, mz + 6);
      l.dome(g * 0.9, M(st.dome, { rough: 0.35, metal: 0.25 }), mx, wallH + 13.6, mz - 3, [1, 1, 1], 12);
    } else {
      wallSeg(l, x0, z0, x1, z1, wallH, 7, st.wall);
    }
  }
  for (let i = 0; i < n; i++) {
    const [tx, tz] = verts[i];
    roundTower(l, tx, tz, 9, wallH + 9, st.wallDark, st.roof, null, pl);
  }

  // yerleşim yasak bölgeleri
  const solids: { x: number; z: number; r: number }[] = [
    { x: 0, z: -50, r: 58 },
    { x: 0, z: 28, r: 34 },
    { x: 0, z: R * 0.6, r: 16 },
    { x: 60, z: 6, r: 40 },
    { x: -62, z: 14, r: 28 },
  ];
  // han (doğu), demirci (batı)
  han(l, pl, 64, 6, -Math.PI / 2 + 0.1, st);
  forge(l, pl, -64, 16, Math.PI / 2);
  // pazar tezgâhları
  const cols: [number, number, number][] = [[0xc23a3a, 0xe8e0c8, 0xe0a030], [0x2a6ac2, 0xe8e0c8, 0xc87a3a], [0x2aa05a, 0xe8e0c8, 0xb04a8a], [0xd49a2a, 0xe8e0c8, 0x6aa02a]];
  const stalls: [number, number, number][] = [[-22, 38, 0.1], [22, 38, -0.1], [-30, 14, -0.5], [30, 16, 0.5]];
  stalls.forEach(([sx, sz, sy], i) => {
    stall(l, sx, sz, sy, cols[i][0], cols[i][1], cols[i][2]);
    pl.npcs.push({ kind: "merchant", x: sx + Math.sin(sy) * -2, z: sz - 6, yaw: sy + 0.1, mode: "stand", seed: 40 + i });
  });
  fountain(l, 0, 28);

  // evler
  const placed: { x: number; z: number; r: number }[] = [];
  const nHouse = capital ? 30 : 26;
  let tries = 0;
  while (placed.length < nHouse && tries < 600) {
    tries++;
    const a = rnd() * Math.PI * 2;
    const rr = 36 + rnd() * (R - 36 - 18);
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    if (Math.hypot(x, z) > R - 20) continue;
    if (Math.abs(x) < 15 && z > 0) continue; // cadde
    if (Math.abs(z - 28) < 11 && Math.abs(x) < R * 0.6) continue; // meydan şeridi
    if (solids.some((s) => Math.hypot(x - s.x, z - s.z) < s.r)) continue;
    const w = 15 + rnd() * 8;
    const d = 14 + rnd() * 6;
    const rad = Math.max(w, d) * 0.72;
    if (placed.some((q) => Math.hypot(x - q.x, z - q.z) < rad + q.r + 3)) continue;
    placed.push({ x, z, r: rad });
    const yaw = Math.atan2(-x, -z) + Math.PI + (rnd() - 0.5) * 0.35;
    townHouse(l, x, z, w, d, 13 + rnd() * 11, yaw, st, rnd, st.houses[Math.floor(rnd() * st.houses.length)]);
  }
  // bahçe ağaçları
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = 30 + rnd() * (R - 54);
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    if (Math.abs(x) < 16 && z > 0) continue;
    if (solids.some((s) => Math.hypot(x - s.x, z - s.z) < s.r)) continue;
    if (placed.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 6)) continue;
    if (sid === "mudbrick" || sid === "turquoise") palm(l, x, z, 0.8, rnd() - 0.5);
    else tree(l, x, z, 0.8, (i % 3) as 0 | 1 | 2);
  }
  rock(l, R + 6, 40, 4);

  // silüet yapısı
  landmark(id, l, st, pl);
  pl.root.add(p.build(true, true, true));

  // bayraklar
  const topH = wallH + 18;
  for (let i = 0; i < n; i += 2) addBanner(pl.root, pl.anim, verts[i][0], topH + 10, verts[i][1], 14, flag, 11, 7);
  addBanner(pl.root, pl.anim, 0, wallH + 24, R, 18, flag, 14, 9);

  // halk
  pl.npcs.push({ kind: "guard", x: -14, z: R + 12, yaw: Math.PI / 2, mode: "stand", seed: 61 });
  pl.npcs.push({ kind: "guard", x: 14, z: R + 12, yaw: Math.PI / 2, mode: "stand", seed: 62 });
  pl.npcs.push({ kind: "guard", x: -18, z: R - 6, yaw: Math.PI / 2, mode: "walk", seed: 63, walk: { cx: 0, cz: R - 10, rx: 28, rz: 4, speed: 0.07, phase: 0 } });
  for (let i = 0; i < 5; i++) {
    pl.npcs.push({
      kind: "villager",
      x: 0,
      z: 28,
      yaw: 0,
      mode: "walk",
      seed: 70 + i * 3,
      walk: { cx: (i - 2) * 10, cz: 30 + (i % 2) * 8, rx: 16 + i * 3, rz: 7 + (i % 3) * 3, speed: (i % 2 ? 1 : -1) * (0.09 + i * 0.01), phase: i * 1.7 },
    });
  }
  pl.npcs.push({ kind: "elder", x: 12, z: 38, yaw: -0.8, mode: "stand", seed: 95 });
  addSmoke(pl.root, pl.anim, -42, 26, -18, 0.7, 0x8a8a90, 3);
  addSmoke(pl.root, pl.anim, 34, 22, 16, 0.55, 0x7a7a80, 3);
  addSmoke(pl.root, pl.anim, 10, 30, -46, 0.75, 0x6a6a70, 4);
  addFire(pl.root, pl.anim, 6, 2.2, 22, 0.35);
  return pl;
}
