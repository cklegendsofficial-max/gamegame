/**
 * Hollywood / campaign görsel hattı
 * ---------------------------------
 * AI görüntü (GenerateImage / DALL-E tarzı) → albedo & billboard.
 * Gerçek GLB için ileride Meshy/Tripo; şimdilik sinematik 2.5D/3D hibrit.
 * Asset yolu: `src/assets/cine/*` → assetUrl("cine/cine_sand")
 *
 * JPG cutout’larda alpha yok → köşe rengine göre punchAlpha ile şeffaflaştırılır.
 * Harita landmark’ları için photoreal cine_castle/yurt yerine map/*.webp tercih edilir
 * (WorldView3D); cine_* yalnızca arazi albedo / full-bleed sahne.
 */
import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
} from "three";
import { assetUrl } from "../assets";

export type CineTextures = {
  sand: Texture | null;
  grass: Texture | null;
  rock: Texture | null;
  brick: Texture | null;
  water: Texture | null;
  tree: Texture | null;
  yurt: Texture | null;
  castle: Texture | null;
  mtn: Texture | null;
  flora: Texture[];
  peaks: Texture[];
  steppe: Texture | null;
};

const loader = new TextureLoader();

/** JPG/WebP cutout: köşe rengine göre flood-fill (açık / koyu / orta gri stüdyo). */
export function punchAlpha(src: Texture, tol = 42): Texture {
  const img = src.image as HTMLImageElement | ImageBitmap | HTMLCanvasElement | undefined;
  if (!img || !("width" in img) || !img.width) return src;
  const w = img.width;
  const h = img.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img as CanvasImageSource, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  // Zaten alpha’lı webp/png ise dokunma
  if (px[3]! < 200 || px[((h - 1) * w + (w - 1)) * 4 + 3]! < 200) return src;

  const luma = (i: number) => 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
  const sat = (i: number) => Math.max(px[i]!, px[i + 1]!, px[i + 2]!) - Math.min(px[i]!, px[i + 1]!, px[i + 2]!);
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4, (w >> 1) * 4, ((h >> 1) * w) * 4];
  let ar = 0, ag = 0, ab = 0;
  for (const i of corners) {
    ar += px[i]!;
    ag += px[i + 1]!;
    ab += px[i + 2]!;
  }
  ar /= corners.length;
  ag /= corners.length;
  ab /= corners.length;
  const cornerL = 0.299 * ar + 0.587 * ag + 0.114 * ab;
  const light = cornerL >= 175;
  const dark = cornerL <= 55;
  const mid = !light && !dark;
  const tol2 = tol * tol;
  const isBg = (p: number) => {
    const i = p * 4;
    if (px[i + 3]! < 40) return true;
    const L = luma(i);
    const S = sat(i);
    const dist = (px[i]! - ar) ** 2 + (px[i + 1]! - ag) ** 2 + (px[i + 2]! - ab) ** 2;
    if (light) return L > 155 && S < 48 && dist <= tol2 * 2.2;
    if (dark) return L < 70 && S < 55 && dist <= tol2 * 2.2;
    return S < 58 && dist <= tol2 * 1.8;
  };

  const n = w * h;
  const mark = new Uint8Array(n);
  const stack: number[] = [];
  const step = Math.max(1, Math.min(w, h) >> 5);
  const seeds: number[] = [0, w - 1, (h - 1) * w, n - 1];
  for (let x = 0; x < w; x += step) seeds.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y += step) seeds.push(y * w, y * w + w - 1);
  for (const s of seeds) {
    if (!isBg(s) || mark[s]) continue;
    mark[s] = 1;
    stack.push(s);
  }
  const nearLim = tol2 * (mid ? 1.4 : 1);
  const near = (i: number, j: number) => {
    const a = i * 4;
    const b = j * 4;
    const dr = px[a]! - px[b]!;
    const dg = px[a + 1]! - px[b + 1]!;
    const db = px[a + 2]! - px[b + 2]!;
    return dr * dr + dg * dg + db * db <= nearLim;
  };
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w;
    const y = (p / w) | 0;
    const tryPush = (np: number) => {
      if (mark[np] || !isBg(np) || !near(p, np)) return;
      mark[np] = 1;
      stack.push(np);
    };
    if (x > 0) tryPush(p - 1);
    if (x + 1 < w) tryPush(p + 1);
    if (y > 0) tryPush(p - w);
    if (y + 1 < h) tryPush(p + w);
  }
  for (let p = 0; p < n; p++) {
    if (mark[p]) {
      px[p * 4 + 3] = 0;
      continue;
    }
    const x = p % w;
    const y = (p / w) | 0;
    let nb = 0;
    if (x > 0 && mark[p - 1]) nb++;
    if (x + 1 < w && mark[p + 1]) nb++;
    if (y > 0 && mark[p - w]) nb++;
    if (y + 1 < h && mark[p + w]) nb++;
    if (nb) px[p * 4 + 3] = Math.max(0, 255 - nb * 70);
  }
  ctx.putImageData(data, 0, 0);
  const out = new CanvasTexture(canvas);
  out.colorSpace = SRGBColorSpace;
  out.needsUpdate = true;
  src.dispose();
  return out;
}

async function loadKey(key: string, cutout = false): Promise<Texture | null> {
  const u = assetUrl(key);
  if (!u) return null;
  try {
    const loaded = await loader.loadAsync(u);
    loaded.colorSpace = SRGBColorSpace;
    return cutout ? punchAlpha(loaded) : loaded;
  } catch {
    return null;
  }
}

async function tile(key: string, n: number): Promise<Texture | null> {
  const t = await loadKey(key);
  if (t) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(n, n);
  }
  return t;
}

export async function loadCineKit(): Promise<CineTextures> {
  const [
    sand,
    grass,
    rock,
    brick,
    water,
    tree,
    yurt,
    castle,
    mtn,
    steppe,
    pine0,
    pine1,
    pine2,
    pine3,
    m0,
    m1,
    m2,
    m3,
  ] = await Promise.all([
    tile("cine/cine_sand", 72),
    tile("cine/cine_grass", 56),
    tile("cine/cine_rock", 36),
    tile("cine/cine_brick", 10),
    tile("cine/cine_water", 28),
    loadKey("cine/cine_tree"),
    loadKey("cine/cine_yurt"),
    loadKey("cine/cine_castle", true),
    loadKey("cine/cine_mtn", true),
    tile("tex/steppe", 56),
    loadKey("flora/pine0"),
    loadKey("flora/pine1"),
    loadKey("flora/pine2"),
    loadKey("flora/pine3"),
    loadKey("mtn/m0"),
    loadKey("mtn/m1"),
    loadKey("mtn/m2"),
    loadKey("mtn/m3"),
  ]);

  return {
    sand: sand ?? steppe,
    grass,
    rock,
    brick,
    water,
    tree,
    yurt,
    castle,
    mtn,
    steppe,
    flora: [pine0, pine1, pine2, pine3].filter(Boolean) as Texture[],
    peaks: [mtn, m0, m1, m2, m3].filter(Boolean) as Texture[],
  };
}
