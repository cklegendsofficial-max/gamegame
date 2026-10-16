import { fbm, ridged, rng, segDist, value2 } from "./noise";

/** Dünya ölçeği: ilk sürüm 4800×2800 idi; eski kayıtlar bu orana göre büyütülür. */
export const W0 = 4800;
export const WS = 1.5;
export const W = W0 * WS;
export const H = 2800 * WS;
export const GW = W / 4;
export const GH = H / 4;
export const TW = 3000;
export const TH = 1750;
export const NAV = 20;
export const NW = W / NAV;
export const NH = H / NAV;

export interface CityDef {
  id: string;
  x: number;
  y: number;
}

export const CITIES: CityDef[] = [
  { id: "constantinople", x: 0.12, y: 0.47 },
  { id: "konya", x: 0.2, y: 0.62 },
  { id: "tabriz", x: 0.33, y: 0.47 },
  { id: "rey", x: 0.5, y: 0.66 },
  { id: "nishapur", x: 0.62, y: 0.6 },
  { id: "merv", x: 0.68, y: 0.7 },
  { id: "bukhara", x: 0.72, y: 0.48 },
  { id: "samarkand", x: 0.79, y: 0.44 },
  { id: "kashgar", x: 0.93, y: 0.34 },
].map((c) => ({ id: c.id, x: c.x * W, y: c.y * H }));

const SEAS: [number, number, number, number][] = [
  [0.08, 0.95, 0.2, 0.16],
  [0.47, 1.02, 0.1, 0.07],
  [0.885, 0.2, 0.018, 0.009],
  [-0.02, 0.62, 0.05, 0.1],
];

/** Kıyı çizgisi boyunca uzanan denizler: [x, y, yarıçap(px)] noktaları. */
const COASTS: { name: string; pts: [number, number, number][] }[] = [
  { name: "Hazar Denizi", pts: [[0.392, 0.07, 300], [0.405, 0.15, 330], [0.418, 0.23, 250], [0.425, 0.31, 215], [0.416, 0.39, 205], [0.401, 0.46, 200], [0.414, 0.525, 175]] },
  { name: "Aral Gölü", pts: [[0.574, 0.195, 150], [0.588, 0.235, 230], [0.604, 0.262, 210]] },
  { name: "Karadeniz", pts: [[0.075, 0.315, 270], [0.13, 0.33, 330], [0.19, 0.315, 320], [0.25, 0.3, 290], [0.275, 0.285, 200]] },
  { name: "Azak Denizi", pts: [[0.218, 0.232, 50], [0.222, 0.2, 110], [0.245, 0.185, 100]] },
];
/** Denizin içine uzanan kara (Kırım). */
const CAPES: [number, number, number, number][] = [[0.178, 0.262, 0.03, 0.036]];

const OASES: [number, number, string][] = [
  [0.6, 0.53, "Tecen Vahası"],
  [0.64, 0.585, "Serahs Vahası"],
  [0.66, 0.34, "Karakum Kuyusu"],
  [0.69, 0.4, "Kızılkum Vahası"],
  [0.97, 0.43, "Hotan Vahası"],
  [0.53, 0.74, "Tabas Vahası"],
  [0.5, 0.31, "Üstyurt Kuyusu"],
  [0.28, 0.86, "Tedmür Vahası"],
];

/** Tarihî geçitler ve yaklaşık yerleri; her geçide en yakın ad verilir. */
const PASS_NAMES: [number, number, string][] = [
  [0.36, 0.42, "Derbent Kapısı"],
  [0.76, 0.52, "Demir Kapı"],
  [0.87, 0.38, "Torugart Geçidi"],
  [0.2, 0.55, "Gülek Boğazı"],
  [0.62, 0.64, "Kopet Geçidi"],
  [0.5, 0.62, "Hazar Kapısı"],
  [0.33, 0.56, "Zagros Geçidi"],
  [0.27, 0.48, "Kafkas Geçidi"],
];

export interface Landmark {
  x: number;
  y: number;
  name: string;
}

export interface Sign {
  x: number;
  y: number;
  /** Okun gösterdiği şehir ve yön (radyan). */
  to: string;
  a: number;
}

const COAST_BOX = COASTS.map((c) => {
  const pad = Math.max(...c.pts.map((p) => p[2])) * 1.6;
  return { x0: Math.min(...c.pts.map((p) => p[0] * W)) - pad, x1: Math.max(...c.pts.map((p) => p[0] * W)) + pad, y0: Math.min(...c.pts.map((p) => p[1] * H)) - pad, y1: Math.max(...c.pts.map((p) => p[1] * H)) + pad };
});

function coastDist(wx: number, wy: number, pts: [number, number, number][]): number {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay, ar] = pts[i];
    const [bx, by, br] = pts[i + 1];
    const px = ax * W, py = ay * H, qx = bx * W, qy = by * H;
    const dx = qx - px, dy = qy - py;
    const t = Math.max(0, Math.min(1, ((wx - px) * dx + (wy - py) * dy) / (dx * dx + dy * dy)));
    const d = Math.hypot(wx - (px + dx * t), wy - (py + dy * t)) / lerp(ar, br, t);
    best = Math.min(best, d * d);
  }
  return best;
}

const RIDGES: [number, number, number, number, number, number][] = [
  [0.24, 0.37, 0.36, 0.41, 150, 0.75],
  [0.13, 0.69, 0.31, 0.6, 140, 0.55],
  [0.34, 0.53, 0.45, 0.88, 170, 0.62],
  [0.39, 0.585, 0.53, 0.6, 120, 0.72],
  [0.55, 0.64, 0.66, 0.635, 110, 0.5],
  [0.7, 0.8, 0.83, 0.68, 170, 0.8],
  [0.84, 0.5, 0.87, 0.72, 160, 0.92],
  [0.76, 0.33, 0.99, 0.25, 170, 0.88],
  [0.9, 0.04, 1.02, 0.12, 160, 0.7],
  [0.86, 0.5, 0.99, 0.48, 120, 0.6],
];

const DESERTS: [number, number, number][] = [
  [0.61, 0.56, 0.085],
  [0.67, 0.36, 0.07],
  [0.98, 0.4, 0.09],
  [0.53, 0.76, 0.07],
  [0.29, 0.88, 0.08],
  [0.5, 0.33, 0.06],
];

const RIVERS: [number, number][][] = [
  [[0.835, 0.6], [0.79, 0.57], [0.74, 0.6], [0.69, 0.55], [0.64, 0.45], [0.6, 0.33], [0.585, 0.27]],
  [[0.86, 0.32], [0.82, 0.36], [0.76, 0.37], [0.7, 0.33], [0.65, 0.28], [0.6, 0.235]],
  [[0.76, 0.42], [0.73, 0.46], [0.7, 0.5]],
  [[0.3, 0.55], [0.36, 0.7], [0.42, 0.85], [0.45, 0.96]],
  [[0.33, 0.0], [0.35, 0.03], [0.37, 0.045], [0.388, 0.065]],
  [[0.27, 0.07], [0.258, 0.12], [0.246, 0.172]],
];

export const ROAD_LINKS: [string, string][] = [
  ["kashgar", "samarkand"],
  ["samarkand", "bukhara"],
  ["bukhara", "merv"],
  ["merv", "nishapur"],
  ["nishapur", "rey"],
  ["rey", "tabriz"],
  ["tabriz", "konya"],
  ["konya", "constantinople"],
  ["tabriz", "constantinople"],
];

export interface World {
  seed: number;
  height: Float32Array;
  moist: Float32Array;
  river: Uint8Array;
  cost: Float32Array;
  road: Uint8Array;
  reach: Uint8Array;
  canvas: HTMLCanvasElement;
  trees: number[];
  peaks: number[];
  roads: number[][];
  oases: Landmark[];
  passes: Landmark[];
  signs: Sign[];
  bridges: { x: number; y: number; a: number }[];
  seas: Landmark[];
}

const SEED = 7331;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const C = {
  deep: [24, 64, 96],
  shallow: [58, 126, 152],
  beach: [222, 204, 150],
  desert: [218, 184, 122],
  steppe: [190, 176, 108],
  grass: [128, 156, 78],
  forest: [74, 112, 56],
  hills: [150, 128, 92],
  rock: [128, 118, 108],
  snow: [238, 240, 242],
  river: [64, 132, 160],
  road: [176, 146, 100],
};

function riverPaths(): number[][] {
  const out: number[][] = [];
  for (const r of RIVERS) {
    const pts: number[] = [];
    for (let i = 0; i < r.length - 1; i++) {
      const [ax, ay] = r[i];
      const [bx, by] = r[i + 1];
      const n = 14;
      for (let k = 0; k < n; k++) {
        const t = k / n;
        const x = lerp(ax, bx, t);
        const y = lerp(ay, by, t);
        const off = (value2(x * 30, y * 30, SEED + 5) - 0.5) * 0.018;
        pts.push((x + off) * W, (y - off) * H);
      }
    }
    const last = r[r.length - 1];
    pts.push(last[0] * W, last[1] * H);
    out.push(pts);
  }
  return out;
}

export function generate(): World {
  const height = new Float32Array(GW * GH);
  const moist = new Float32Array(GW * GH);
  const river = new Uint8Array(GW * GH);
  const ridges = RIDGES.map(([ax, ay, bx, by, wd, pk]) => {
    const cut = wd * 3 * WS;
    return { ax: ax * W, ay: ay * H, bx: bx * W, by: by * H, wd, pk, x0: Math.min(ax * W, bx * W) - cut, x1: Math.max(ax * W, bx * W) + cut, y0: Math.min(ay * H, by * H) - cut, y1: Math.max(ay * H, by * H) + cut };
  });
  for (let gy = 0; gy < GH; gy++) {
    const ny = gy / GH;
    for (let gx = 0; gx < GW; gx++) {
      const nx = gx / GW;
      const wx = nx * W;
      const wy = ny * H;
      let h = 0.16 + (fbm(nx * 7, ny * 4, SEED) - 0.5) * 0.32;
      let rg = -1;
      for (let ri = 0; ri < ridges.length; ri++) {
        const r = ridges[ri];
        if (wx < r.x0 || wx > r.x1 || wy < r.y0 || wy > r.y1) continue;
        const wd = r.wd;
        const pk = r.pk;
        const d = segDist(wx, wy, r.ax, r.ay, r.bx, r.by) / WS;
        if (d > wd * 3) continue;
        const f = Math.exp(-(d * d) / (wd * wd));
        if (rg < 0) rg = ridged(nx * 16, ny * 9.5, SEED + 3);
        h += pk * f * (0.45 + 0.85 * rg);
      }
      let water = -1;
      let sea = 1e9;
      for (const [cx, cy, rx, ry] of SEAS) sea = Math.min(sea, ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2);
      COASTS.forEach((c, ci) => {
        const b = COAST_BOX[ci];
        if (wx > b.x0 && wx < b.x1 && wy > b.y0 && wy < b.y1) sea = Math.min(sea, coastDist(wx, wy, c.pts));
      });
      for (const [cx, cy, rx, ry] of CAPES) {
        const k = ((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2;
        if (k < 1.6) sea = Math.max(sea, lerp(2.4, sea, Math.max(0, (k - 0.6) / 1)));
      }
      if (sea < 2.2) water = 1 - (sea + (fbm(nx * 9, ny * 9, SEED + 9) - 0.5) * 0.9);
      for (const c of CITIES) {
        const d2 = (wx - c.x) ** 2 + (wy - c.y) ** 2;
        if (d2 < 19600) {
          const d = Math.sqrt(d2);
          const t = Math.max(0, (d - 60) / 80);
          h = Math.min(h, lerp(0.2, h, t));
          water = Math.min(water, lerp(-0.3, water, t));
        }
      }
      if (water > 0) h = -0.04 - water * 0.6;
      let m = 0.52 + (fbm(nx * 5 + 10, ny * 5, SEED + 1) - 0.5) * 0.55 + (0.3 - ny) * 0.35;
      for (const [cx, cy, r] of DESERTS) {
        const d = ((nx - cx) ** 2 + ((ny - cy) * 0.58) ** 2) / (r * r);
        m -= 0.7 * Math.exp(-d);
      }
      for (const [ox, oy] of OASES) {
        const d2 = (wx - ox * W) ** 2 + (wy - oy * H) ** 2;
        if (d2 < 40000) m += 0.62 * Math.exp(-d2 / 4500);
      }
      const i = gy * GW + gx;
      height[i] = h;
      moist[i] = m;
    }
  }
  const rivers = riverPaths();
  for (const pts of rivers) {
    for (let k = 0; k < pts.length - 2; k += 2) {
      const ax = pts[k], ay = pts[k + 1], bx = pts[k + 2], by = pts[k + 3];
      const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 2);
      for (let s = 0; s <= steps; s++) {
        const x = lerp(ax, bx, s / steps) / (W / GW);
        const y = lerp(ay, by, s / steps) / (H / GH);
        for (let oy = -3; oy <= 3; oy++)
          for (let ox = -3; ox <= 3; ox++) {
            const gx = Math.round(x + ox);
            const gy = Math.round(y + oy);
            if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) continue;
            const d = Math.hypot(ox, oy);
            const i = gy * GW + gx;
            if (d <= 1.3 && height[i] >= 0) river[i] = 2;
            if (d <= 3) moist[i] += 0.12 * (1 - d / 3);
          }
      }
    }
  }
  for (let gy = 0; gy < GH; gy++)
    for (let gx = 0; gx < GW; gx++) {
      const i = gy * GW + gx;
      if (height[i] < 0) continue;
      let near = false;
      for (let o = -4; o <= 4 && !near; o += 2) {
        const a = height[Math.max(0, Math.min(GH - 1, gy + o)) * GW + gx];
        const b = height[gy * GW + Math.max(0, Math.min(GW - 1, gx + o))];
        if (a < 0 || b < 0) near = true;
      }
      if (near) moist[i] += 0.12;
    }

  const cost = new Float32Array(NW * NH);
  const road = new Uint8Array(NW * NH);
  for (let ny = 0; ny < NH; ny++)
    for (let nx = 0; nx < NW; nx++) {
      let worst = 0;
      let sum = 0;
      let wet = 0;
      let blocked = 0;
      for (let oy = 0; oy < 5; oy++)
        for (let ox = 0; ox < 5; ox++) {
          const i = (ny * 5 + oy) * GW + nx * 5 + ox;
          const h = height[i];
          if (h < 0 || h > 0.66) blocked++;
          if (river[i]) wet++;
          worst = Math.max(worst, h);
          const m = moist[i];
          sum += h > 0.42 ? 3 : h > 0.32 ? 1.8 : m > 0.66 ? 1.6 : m < 0.22 ? 1.4 : 1;
        }
      const ci = ny * NW + nx;
      cost[ci] = blocked > 12 ? Infinity : sum / 25 + (wet > 0 ? 1.5 : 0);
    }

  const roads: number[][] = [];
  const ends: [string, string][] = [];
  for (const [a, b] of ROAD_LINKS) {
    const ca = CITIES.find((c) => c.id === a)!;
    const cb = CITIES.find((c) => c.id === b)!;
    const path = astar(cost, Math.floor(ca.x / NAV), Math.floor(ca.y / NAV), Math.floor(cb.x / NAV), Math.floor(cb.y / NAV), true);
    if (!path) continue;
    const pts: number[] = [];
    for (let k = 0; k < path.length; k += 2) {
      road[path[k + 1] * NW + path[k]] = 1;
      const jx = (value2(path[k] * 0.7, path[k + 1] * 0.7, SEED + 11) - 0.5) * NAV * 0.8;
      const jy = (value2(path[k] * 0.7 + 50, path[k + 1] * 0.7, SEED + 11) - 0.5) * NAV * 0.8;
      pts.push(path[k] * NAV + NAV / 2 + jx, path[k + 1] * NAV + NAV / 2 + jy);
    }
    pts[0] = ca.x;
    pts[1] = ca.y;
    pts[pts.length - 2] = cb.x;
    pts[pts.length - 1] = cb.y;
    roads.push(pts);
    ends.push([a, b]);
  }
  for (let i = 0; i < cost.length; i++) if (road[i] && cost[i] !== Infinity) cost[i] = Math.min(cost[i], 0.55);

  const reach = new Uint8Array(NW * NH);
  const sam = CITIES.find((c) => c.id === "samarkand")!;
  const q = [Math.floor(sam.y / NAV) * NW + Math.floor(sam.x / NAV)];
  reach[q[0]] = 1;
  while (q.length) {
    const i = q.pop()!;
    const x = i % NW;
    const y = (i - x) / NW;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= NW || ny >= NH) continue;
      const j = ny * NW + nx;
      if (reach[j] || cost[j] === Infinity) continue;
      reach[j] = 1;
      q.push(j);
    }
  }

  const marks = landmarks(height, river, roads, ends);
  const { canvas, trees, peaks } = paint(height, moist, river, rivers, roads, marks);
  return { seed: SEED, height, moist, river, cost, road, reach, canvas, trees, peaks, roads, ...marks };
}

interface Marks {
  oases: Landmark[];
  passes: Landmark[];
  signs: Sign[];
  bridges: { x: number; y: number; a: number }[];
  seas: Landmark[];
}

/** Vahalar, geçitler, köprüler ve yol işaretleri. */
function landmarks(height: Float32Array, river: Uint8Array, roads: number[][], ends: [string, string][]): Marks {
  const gi = (x: number, y: number) => Math.min(GH - 1, Math.max(0, Math.floor(y / (H / GH)))) * GW + Math.min(GW - 1, Math.max(0, Math.floor(x / (W / GW))));
  const nearCity = (x: number, y: number, r: number) => CITIES.some((c) => Math.hypot(c.x - x, c.y - y) < r);
  const oases = OASES.map(([x, y, name]) => ({ x: x * W, y: y * H, name })).filter((o) => height[gi(o.x, o.y)] >= 0);
  const passes: Landmark[] = [];
  const bridges: { x: number; y: number; a: number }[] = [];
  const signs: Sign[] = [];
  roads.forEach((pts, ri) => {
    const [a, b] = ends[ri];
    let top = -1;
    let topH = 0.36;
    let wet = false;
    let run = 0;
    let n = 0;
    for (let k = 2; k < pts.length - 2; k += 2) {
      const x = pts[k], y = pts[k + 1];
      const h = height[gi(x, y)];
      if (h > topH && !nearCity(x, y, 300)) {
        topH = h;
        top = k;
      }
      const ang = Math.atan2(pts[k + 3] - pts[k - 1], pts[k + 2] - pts[k - 2]);
      const r = river[gi(x, y)] === 2;
      if (r && !wet && !bridges.some((q) => Math.hypot(q.x - x, q.y - y) < 80)) bridges.push({ x, y, a: ang });
      wet = r;
      run += Math.hypot(x - pts[k - 2], y - pts[k - 1]);
      if (run > 700 && !nearCity(x, y, 280)) {
        run = 0;
        const back = n++ % 2 === 1;
        signs.push({ x: x + Math.cos(ang + Math.PI / 2) * 22, y: y + Math.sin(ang + Math.PI / 2) * 22, to: back ? a : b, a: back ? ang + Math.PI : ang });
      }
    }
    if (top > 0) {
      const x = pts[top], y = pts[top + 1];
      if (!passes.some((p) => Math.hypot(p.x - x, p.y - y) < 600)) {
        const free = PASS_NAMES.filter(([, , n]) => !passes.some((p) => p.name === n));
        const near = free.reduce((a, b) => (Math.hypot(b[0] * W - x, b[1] * H - y) < Math.hypot(a[0] * W - x, a[1] * H - y) ? b : a), free[0] ?? PASS_NAMES[0]);
        passes.push({ x, y, name: near[2] });
      }
    }
  });
  const seas = COASTS.map((c) => {
    const m = c.pts[Math.floor(c.pts.length / 2)];
    return { x: m[0] * W, y: m[1] * H, name: c.name };
  });
  return { oases, passes, signs, bridges, seas };
}

function sampleH(height: Float32Array, x: number, y: number): number {
  const gx = Math.max(0, Math.min(GW - 1.001, x));
  const gy = Math.max(0, Math.min(GH - 1.001, y));
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const i = y0 * GW + x0;
  return lerp(lerp(height[i], height[i + 1], fx), lerp(height[i + GW], height[i + GW + 1], fx), fy);
}

function paint(height: Float32Array, moist: Float32Array, river: Uint8Array, rivers: number[][], roads: number[][], marks: Marks): { canvas: HTMLCanvasElement; trees: number[]; peaks: number[] } {
  const canvas = document.createElement("canvas");
  canvas.width = TW;
  canvas.height = TH;
  const g = canvas.getContext("2d")!;
  const img = g.createImageData(TW, TH);
  const d = img.data;
  const sx = GW / TW;
  const sy = GH / TH;
  const trees: number[] = [];
  const peaks: number[] = [];
  const R = rng(SEED);
  let cr = 0;
  let cg = 0;
  let cb = 0;
  const set = (c: number[]) => {
    cr = c[0];
    cg = c[1];
    cb = c[2];
  };
  const blend = (c: number[], t: number) => {
    cr += (c[0] - cr) * t;
    cg += (c[1] - cg) * t;
    cb += (c[2] - cb) * t;
  };
  const FOAM = [120, 180, 196];
  const SURF = [190, 220, 220];
  const DUNE_HI = [238, 210, 150];
  const DUNE_LO = [176, 140, 88];
  for (let y = 0; y < TH; y++) {
    const gy = y * sy;
    const vy = ((y / TH - 0.5) * 1.3) ** 2;
    for (let x = 0; x < TW; x++) {
      const gx = x * sx;
      const h = sampleH(height, gx, gy);
      const gi = Math.min(GH - 1, Math.floor(gy)) * GW + Math.min(GW - 1, Math.floor(gx));
      const m = moist[gi];
      const fine = value2(x * 0.09, y * 0.09, SEED + 21) - 0.5;
      const grain = value2(x * 0.6, y * 0.6, SEED + 22) - 0.5;
      if (h < 0) {
        const t = Math.min(1, -h / 0.35);
        set(C.shallow);
        blend(C.deep, t);
        const wave = Math.sin(x * 0.05 + y * 0.02 + fine * 6) * 0.5 + 0.5;
        blend(FOAM, wave * 0.06 * (1 - t));
        if (h > -0.025) blend(SURF, 0.35);
      } else {
        if (h > 0.72) {
          set(C.rock);
          blend(C.snow, Math.min(1, (h - 0.72) / 0.08 + fine * 0.8));
        } else if (h > 0.5) {
          set(C.hills);
          blend(C.rock, Math.min(1, (h - 0.5) / 0.15));
        } else {
          const mm = m + fine * 0.12;
          if (mm < 0.2) {
            set(C.desert);
            const dune = Math.sin(x * 0.11 + Math.sin(y * 0.03) * 3 + fine * 4);
            blend(DUNE_HI, Math.max(0, dune) * 0.25);
            blend(DUNE_LO, Math.max(0, -dune) * 0.12);
          } else if (mm < 0.3) {
            set(C.desert);
            blend(C.steppe, (mm - 0.2) / 0.1);
          } else if (mm < 0.46) {
            set(C.steppe);
            blend(C.grass, Math.max(0, (mm - 0.38) / 0.08));
          } else if (mm < 0.64) {
            set(C.grass);
            blend(C.forest, Math.max(0, (mm - 0.58) / 0.06));
          } else set(C.forest);
          if (h > 0.32) blend(C.hills, Math.min(1, (h - 0.32) / 0.18));
          if (h < 0.025) blend(C.beach, 0.7);
        }
        if (river[gi] === 2) blend(C.river, 0.85);
      }
      let shade = 1;
      if (h >= 0) {
        const hx = sampleH(height, gx + 0.7, gy) - sampleH(height, gx - 0.7, gy);
        const hy = sampleH(height, gx, gy + 0.7) - sampleH(height, gx, gy - 0.7);
        shade = Math.max(0.55, Math.min(1.35, 1 - (hx + hy) * 5.5));
      }
      const vig = 1 - 0.35 * Math.max(0, Math.sqrt(((x / TW - 0.5) * 1.1) ** 2 + vy) - 0.45);
      const k = shade * vig * (1 + grain * 0.06 + fine * 0.05);
      const o = (y * TW + x) * 4;
      d[o] = cr * k;
      d[o + 1] = cg * k;
      d[o + 2] = cb * k;
      d[o + 3] = 255;
      if ((x & 3) === 0 && (y & 3) === 0 && h >= 0.03) {
        if (h < 0.4 && m > 0.6 && R() < 0.5) trees.push(x * (W / TW) + R() * 6, y * (H / TH) + R() * 6, m > 0.7 ? 1 : 0);
        else if (h < 0.3 && m > 0.48 && R() < 0.05) trees.push(x * (W / TW) + R() * 6, y * (H / TH) + R() * 6, 0);
      }
      if ((x % 18) === 0 && (y % 18) === 0 && h > 0.5 && R() < 0.28 + (h - 0.5) * 1.4) peaks.push((x + (R() - 0.5) * 22) * (W / TW), (y + (R() - 0.5) * 22) * (H / TH), h);
    }
  }
  g.putImageData(img, 0, 0);
  g.save();
  g.scale(TW / W, TH / H);
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const pts of rivers) {
    g.strokeStyle = "rgba(48,110,140,0.9)";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]);
    g.stroke();
    g.strokeStyle = "rgba(120,190,210,0.5)";
    g.lineWidth = 2.5;
    g.stroke();
  }
  for (const pts of roads) {
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    for (let k = 2; k < pts.length - 2; k += 2) {
      const mx = (pts[k] + pts[k + 2]) / 2;
      const my = (pts[k + 1] + pts[k + 3]) / 2;
      g.quadraticCurveTo(pts[k], pts[k + 1], mx, my);
    }
    g.lineTo(pts[pts.length - 2], pts[pts.length - 1]);
    g.strokeStyle = "rgba(90,62,34,0.55)";
    g.lineWidth = 9;
    g.stroke();
    g.strokeStyle = "rgba(214,184,132,0.9)";
    g.lineWidth = 5;
    g.setLineDash([]);
    g.stroke();
  }
  for (const o of marks.oases) {
    // Sadece ıslak kum lekesi — ağaç/havuz sprite’ı worldView prop’unda (sticker yok)
    g.save();
    const wet = g.createRadialGradient(o.x, o.y, 6, o.x, o.y, 48);
    wet.addColorStop(0, "rgba(70,110,90,0.35)");
    wet.addColorStop(0.55, "rgba(120,100,60,0.22)");
    wet.addColorStop(1, "rgba(120,100,60,0)");
    g.fillStyle = wet;
    g.beginPath();
    g.ellipse(o.x, o.y, 52, 32, -0.2, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  for (const b of marks.bridges) {
    g.save();
    g.translate(b.x, b.y);
    g.rotate(b.a);
    g.fillStyle = "rgba(60,40,22,0.6)";
    g.fillRect(-20, -9, 40, 18);
    g.fillStyle = "rgba(168,128,84,1)";
    g.fillRect(-18, -7, 36, 14);
    g.strokeStyle = "rgba(98,66,36,0.95)";
    g.lineWidth = 1.5;
    for (let k = -14; k <= 14; k += 5) {
      g.beginPath();
      g.moveTo(k, -7);
      g.lineTo(k, 7);
      g.stroke();
    }
    g.fillStyle = "rgba(70,46,24,1)";
    g.fillRect(-19, -9, 38, 2.5);
    g.fillRect(-19, 6.5, 38, 2.5);
    g.restore();
  }
  g.restore();
  return { canvas, trees, peaks };
}

export function astar(cost: Float32Array, sx: number, sy: number, tx: number, ty: number, roadMode = false): number[] | null {
  if (sx === tx && sy === ty) return [sx, sy];
  if (cost[ty * NW + tx] === Infinity || cost[sy * NW + sx] === Infinity) return null;
  const N = NW * NH;
  const gScore = new Float32Array(N).fill(Infinity);
  const from = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const heap: number[] = [];
  const fs: number[] = [];
  const push = (i: number, f: number) => {
    heap.push(i);
    fs.push(f);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (fs[p] <= fs[k]) break;
      [heap[p], heap[k]] = [heap[k], heap[p]];
      [fs[p], fs[k]] = [fs[k], fs[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const lh = heap.pop()!;
    const lf = fs.pop()!;
    if (heap.length) {
      heap[0] = lh;
      fs[0] = lf;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < heap.length && fs[l] < fs[m]) m = l;
        if (r < heap.length && fs[r] < fs[m]) m = r;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k], heap[m]];
        [fs[m], fs[k]] = [fs[k], fs[m]];
        k = m;
      }
    }
    return top;
  };
  const minC = roadMode ? 1 : 0.55;
  const start = sy * NW + sx;
  const goal = ty * NW + tx;
  gScore[start] = 0;
  push(start, 0);
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let iter = 0;
  while (heap.length && iter++ < 200000) {
    const i = pop();
    if (i === goal) break;
    if (closed[i]) continue;
    closed[i] = 1;
    const x = i % NW;
    const y = (i - x) / NW;
    for (const [dx, dy, dl] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= NW || ny >= NH) continue;
      const j = ny * NW + nx;
      const c = cost[j];
      if (c === Infinity || closed[j]) continue;
      if (dx && dy && (cost[y * NW + nx] === Infinity || cost[ny * NW + x] === Infinity)) continue;
      const step = (roadMode ? Math.max(1, c) : c) * dl;
      const ng = gScore[i] + step;
      if (ng < gScore[j]) {
        gScore[j] = ng;
        from[j] = i;
        push(j, ng + Math.hypot(tx - nx, ty - ny) * minC);
      }
    }
  }
  if (from[goal] < 0) return null;
  const out: number[] = [];
  let k = goal;
  while (k !== start && k >= 0) {
    out.push(k % NW, Math.floor(k / NW));
    k = from[k];
  }
  out.push(sx, sy);
  const res: number[] = [];
  for (let i = out.length - 2; i >= 0; i -= 2) res.push(out[i], out[i + 1]);
  return res;
}
