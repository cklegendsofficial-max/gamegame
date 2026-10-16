import { Rectangle, Sprite, Texture } from "pixi.js";

/** Haritadaki küçük figürlerin türü: yaya mızraklı, okçu, kılıçlı ya da atlı. */
export type FigKind = "spear" | "archer" | "sword" | "rider" | "horsearcher";
export type Hat = "bork" | "tolga" | "sarik" | "kukuleta" | "papak" | "kurk" | "migfer";

export interface FigStyle {
  coat: string;
  trim: string;
  hat: Hat;
  hatCol: string;
  skin?: string;
  horse?: string;
  mane?: string;
  /** Kahraman için pelerin. */
  cape?: string;
}

export const FRAMES = 8;
const S = 64;
const R = 2;

/** v3: FW şehir tonlarıyla sıcak kenar + kum temas gölgesi. */
const FIG_VER = "v3";
const cache = new Map<string, Texture[]>();
/** FW isometric şehirlerle ortak kenar/gölge paleti. */
const FIG_OUT = "#2a180c";
const FIG_SAND = "rgba(196,160,106,0.35)";

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Dolu kapsül bacak/kol — ince çizgi “çöp adam” görünümünü kırar. */
function limb(g: CanvasRenderingContext2D, x: number, y: number, a1: number, l1: number, a2: number, l2: number, w: number, col: string, out = FIG_OUT): [number, number] {
  const kx = x + Math.sin(a1) * l1;
  const ky = y + Math.cos(a1) * l1;
  const fx = kx + Math.sin(a2) * l2;
  const fy = ky + Math.cos(a2) * l2;
  g.lineCap = "round";
  g.lineJoin = "round";
  const seg = (x0: number, y0: number, x1: number, y1: number, ww: number) => {
    g.strokeStyle = out;
    g.lineWidth = ww + 2.4;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.strokeStyle = col;
    g.lineWidth = ww;
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    // eklem topu
    g.fillStyle = col;
    g.beginPath();
    g.arc(x1, y1, ww * 0.55, 0, Math.PI * 2);
    g.fill();
  };
  seg(x, y, kx, ky, w * 1.35);
  seg(kx, ky, fx, fy, w * 1.15);
  return [fx, fy];
}

function head(g: CanvasRenderingContext2D, x: number, y: number, st: FigStyle): void {
  const skin = st.skin ?? "#d8a878";
  g.fillStyle = FIG_OUT;
  g.beginPath();
  g.arc(x, y, 7.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = skin;
  g.beginPath();
  g.arc(x, y, 6.1, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = shade(skin.startsWith("#") ? skin : "#d8a878", 0.2);
  g.beginPath();
  g.arc(x - 1.6, y - 0.8, 3.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = shade(skin.startsWith("#") ? skin : "#d8a878", -0.28);
  g.beginPath();
  g.arc(x - 1.4, y + 1.2, 4.2, Math.PI * 0.55, Math.PI * 1.45);
  g.fill();
  g.fillStyle = "#1a1008";
  g.beginPath();
  g.arc(x + 2.4, y - 0.6, 1.1, 0, Math.PI * 2);
  g.fill();
  const hc = st.hatCol;
  g.fillStyle = hc;
  g.strokeStyle = "#1a1008";
  g.lineWidth = 1;
  g.beginPath();
  switch (st.hat) {
    case "bork":
      g.moveTo(x - 5.4, y - 1.5);
      g.quadraticCurveTo(x - 4, y - 10, x + 1, y - 10.5);
      g.quadraticCurveTo(x + 6, y - 9, x + 5.4, y - 1.5);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = shade("#8a6a40", 0.1);
      g.fillRect(x - 6, y - 3.2, 12, 2.6);
      break;
    case "tolga":
    case "migfer":
      g.moveTo(x - 5.4, y - 1);
      g.lineTo(x - 4.4, y - 6);
      g.lineTo(x + 0.5, y - (st.hat === "tolga" ? 13 : 9));
      g.lineTo(x + 5, y - 6);
      g.lineTo(x + 5.6, y - 1);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = shade(hc, 0.45);
      g.beginPath();
      g.moveTo(x - 2, y - 6);
      g.lineTo(x + 0.5, y - (st.hat === "tolga" ? 12 : 8.5));
      g.lineTo(x + 0.8, y - 6);
      g.fill();
      if (st.hat === "tolga") {
        g.fillStyle = "#c8302a";
        g.fillRect(x - 0.4, y - 16, 1.8, 3.5);
      }
      break;
    case "sarik":
      g.ellipse(x, y - 4.5, 6.4, 4.4, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.strokeStyle = shade(hc, -0.25);
      g.beginPath();
      g.moveTo(x - 5.6, y - 4);
      g.quadraticCurveTo(x, y - 7.5, x + 5.6, y - 5);
      g.stroke();
      break;
    case "kukuleta":
      g.moveTo(x - 6, y + 4);
      g.quadraticCurveTo(x - 7, y - 8, x - 1, y - 9);
      g.quadraticCurveTo(x + 6, y - 8, x + 5, y - 2);
      g.lineTo(x + 3.5, y - 2);
      g.quadraticCurveTo(x, y - 6, x - 2.5, y + 4);
      g.closePath();
      g.fill();
      g.stroke();
      break;
    case "papak":
    case "kurk":
      g.rect(x - 5.8, y - 9, 11.6, 7.2);
      g.fill();
      g.stroke();
      g.fillStyle = shade(hc, 0.25);
      for (let k = 0; k < 4; k++) g.fillRect(x - 5 + k * 3, y - 8.5, 1.4, 6);
      break;
  }
}

function weapon(g: CanvasRenderingContext2D, kind: FigKind, hx: number, hy: number, swing: number): void {
  g.lineCap = "round";
  if (kind === "spear" || kind === "rider") {
    const a = -0.35 + swing * 0.15;
    const ex = hx + Math.sin(a + Math.PI) * -22, ey = hy - 26;
    g.strokeStyle = "#1a1008";
    g.lineWidth = 2.6;
    g.beginPath();
    g.moveTo(hx - (ex - hx) * 0.35, hy + 9);
    g.lineTo(ex, ey);
    g.stroke();
    g.strokeStyle = "#8a5a2a";
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = "#e8e8f0";
    g.strokeStyle = "#1a1008";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(ex, ey - 6);
    g.lineTo(ex + 2.2, ey + 1);
    g.lineTo(ex - 2.2, ey + 1);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = "#c8302a";
    g.fillRect(ex - 1.6, ey + 1, 3.2, 2.4);
  } else if (kind === "archer" || kind === "horsearcher") {
    g.strokeStyle = "#1a1008";
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(hx + 1, hy, 9, -1.25, 1.25);
    g.stroke();
    g.strokeStyle = "#a8743a";
    g.lineWidth = 1.5;
    g.stroke();
    g.strokeStyle = "rgba(240,230,200,0.9)";
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(hx + 1 + Math.cos(-1.25) * 9, hy + Math.sin(-1.25) * 9);
    g.lineTo(hx - 2 - swing, hy);
    g.lineTo(hx + 1 + Math.cos(1.25) * 9, hy + Math.sin(1.25) * 9);
    g.stroke();
  } else {
    const a = -0.9 + swing * 0.3;
    const ex = hx + Math.cos(a) * 13, ey = hy + Math.sin(a) * 13;
    g.strokeStyle = "#1a1008";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(hx, hy);
    g.lineTo(ex, ey);
    g.stroke();
    g.strokeStyle = "#e6e6ee";
    g.lineWidth = 1.6;
    g.stroke();
    g.fillStyle = "#c8a040";
    g.fillRect(hx - 2, hy - 1, 4, 2);
  }
}

function body(g: CanvasRenderingContext2D, x: number, hipY: number, st: FigStyle, lean: number): { sx: number; sy: number } {
  const sx = x + lean;
  const sy = hipY - 15;
  if (st.cape) {
    g.fillStyle = st.cape;
    g.strokeStyle = "#1a1008";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(sx - 3, sy + 1);
    g.quadraticCurveTo(x - 13, hipY - 2, x - 12 - lean * 2, hipY + 8);
    g.lineTo(x - 2, hipY + 4);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // dolu gövde (omuz geniş)
  g.fillStyle = "#1a1008";
  g.beginPath();
  g.moveTo(sx - 7.2, sy - 1);
  g.lineTo(sx + 7.2, sy - 1);
  g.lineTo(x + 8.5, hipY + 6);
  g.lineTo(x - 8.5, hipY + 6);
  g.closePath();
  g.fill();
  g.fillStyle = st.coat;
  g.beginPath();
  g.moveTo(sx - 6.4, sy);
  g.lineTo(sx + 6.4, sy);
  g.lineTo(x + 7.5, hipY + 5);
  g.lineTo(x - 7.5, hipY + 5);
  g.closePath();
  g.fill();
  g.fillStyle = shade(st.coat.startsWith("#") ? st.coat : "#7a2a1e", 0.28);
  g.beginPath();
  g.moveTo(sx + 0.2, sy + 0.5);
  g.lineTo(sx + 5.8, sy + 0.5);
  g.lineTo(x + 7, hipY + 4.5);
  g.lineTo(x + 1.2, hipY + 4.5);
  g.closePath();
  g.fill();
  // haritada okunabilirlik için ucuz kumaş kırışıklığı + etek gölgesi (bir kez çizilip dokuya pişer, çalışma anında bedava)
  g.fillStyle = "rgba(10,6,2,0.2)";
  g.fillRect(x - 7.5, hipY + 2.6, 15, 2.4);
  g.strokeStyle = shade(st.coat.startsWith("#") ? st.coat : "#5a3a2a", -0.4);
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(sx - 2.8, sy + 1.6);
  g.lineTo(x - 3.6, hipY + 2.6);
  g.moveTo(sx + 3.2, sy + 1.6);
  g.lineTo(x + 4, hipY + 2.6);
  g.stroke();
  g.fillStyle = st.trim;
  g.fillRect(x - 7.2, hipY - 1.5, 14.4, 3);
  g.fillRect(sx - 0.8, sy, 1.8, hipY - sy + 5);
  return { sx, sy };
}

function drawFoot(g: CanvasRenderingContext2D, kind: FigKind, st: FigStyle, p: number, idle: boolean): void {
  const a = idle ? 0 : Math.sin(p * Math.PI * 2);
  const bob = idle ? 0 : Math.abs(Math.cos(p * Math.PI * 2)) * 1.6;
  const x = 32;
  const hipY = 40 - bob;
  // FW şehirleriyle aynı kum ailesi: sıcak sand rim + koyu temas
  g.fillStyle = FIG_SAND;
  g.beginPath();
  g.ellipse(32, 58.5, 16, 5, 0, 0, Math.PI * 2);
  g.fill();
  const sh = g.createRadialGradient(32, 58, 1, 32, 58, 14);
  sh.addColorStop(0, "rgba(26,15,6,0.45)");
  sh.addColorStop(1, "rgba(26,15,6,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.ellipse(32, 58, 13, 4, 0, 0, Math.PI * 2);
  g.fill();
  const pants = shade(st.coat.startsWith("#") ? st.coat : "#5a3a2a", -0.45);
  limb(g, x - 2, hipY + 2, -a * 0.55, 9, -a * 0.55 + Math.max(0, -a) * 0.7 - 0.05, 8.5, 4.6, pants);
  limb(g, x + 2, hipY + 2, a * 0.55, 9, a * 0.55 + Math.max(0, a) * 0.7 - 0.05, 8.5, 4.6, pants);
  // ayakkabı
  g.fillStyle = "#2a1810";
  g.beginPath();
  g.ellipse(x - 2 + Math.sin(-a * 0.55) * 16, 56 - bob * 0.3, 3.5, 1.8, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(x + 2 + Math.sin(a * 0.55) * 16, 56 - bob * 0.3, 3.5, 1.8, 0, 0, Math.PI * 2);
  g.fill();
  const lean = idle ? 0 : 1.2;
  const { sx, sy } = body(g, x, hipY, st, lean);
  limb(g, sx - 3, sy + 3, -a * 0.5 + 0.35, 7, -a * 0.3 + 0.55, 6.5, 3.6, shade(st.coat.startsWith("#") ? st.coat : "#5a3a2a", -0.15));
  head(g, sx + 1, sy - 7.5, st);
  const fa = kind === "archer" ? -1.35 : -0.7 + a * 0.35;
  const [hx, hy] = limb(g, sx + 3, sy + 3, fa, 7, fa - 0.2, 7, 3.6, st.coat);
  weapon(g, kind, hx, hy, a);
  g.fillStyle = st.skin ?? "#d8a878";
  g.beginPath();
  g.arc(hx, hy, 2.2, 0, Math.PI * 2);
  g.fill();
  if (kind === "spear" || kind === "sword") {
    g.fillStyle = shade(st.trim.startsWith("#") ? st.trim : "#c8a040", -0.15);
    g.strokeStyle = "#1a1008";
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(sx - 5, sy + 10, 4, 7.5, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    g.fillStyle = st.trim;
    g.beginPath();
    g.arc(sx - 5, sy + 10, 1.5, 0, Math.PI * 2);
    g.fill();
  }
}

function drawRider(g: CanvasRenderingContext2D, kind: FigKind, st: FigStyle, p: number, idle: boolean): void {
  const hc = st.horse ?? "#7a4a26";
  const mane = st.mane ?? "#2a1a0c";
  const t = p * Math.PI * 2;
  const bob = idle ? 0 : Math.sin(t * 2) * 1.3;
  const by = 36 + bob;
  g.fillStyle = FIG_SAND;
  g.beginPath();
  g.ellipse(32, 58.5, 24, 6, 0, 0, Math.PI * 2);
  g.fill();
  const sh = g.createRadialGradient(32, 58, 2, 32, 58, 22);
  sh.addColorStop(0, "rgba(26,15,6,0.48)");
  sh.addColorStop(1, "rgba(26,15,6,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.ellipse(32, 58, 20, 4.6, 0, 0, Math.PI * 2);
  g.fill();
  const legs: [number, number][] = [[20, 0], [23, 0.15], [40, 0.5], [43, 0.65]];
  const dark = shade(hc, -0.35);
  legs.forEach(([lx, off], i) => {
    const ph = t + off * Math.PI * 2;
    const sw = idle ? (i % 2 ? 0.08 : -0.08) : Math.sin(ph) * 0.75;
    const kb = idle ? 0.05 : Math.max(0, Math.cos(ph)) * 1.1;
    const front = lx > 30;
    limb(g, lx, by + 4, sw, 9, sw + (front ? -kb : kb), 9.5, 4.2, i % 2 ? hc : dark);
  });
  g.fillStyle = mane;
  g.strokeStyle = "#1a1008";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(15, by - 2);
  g.quadraticCurveTo(6, by + (idle ? 4 : 1 + Math.sin(t * 2) * 3), 8, by + 12);
  g.lineTo(11, by + 10);
  g.quadraticCurveTo(10, by + 3, 17, by + 1);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = hc;
  g.beginPath();
  g.ellipse(31, by, 16, 7.5, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = shade(hc, 0.18);
  g.beginPath();
  g.ellipse(32, by - 2.5, 12, 3.2, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = hc;
  g.beginPath();
  g.moveTo(41, by - 4);
  g.quadraticCurveTo(46, by - 14, 50, by - 17);
  g.lineTo(56, by - 12);
  g.quadraticCurveTo(57, by - 9, 54, by - 8.5);
  g.lineTo(49, by - 10);
  g.quadraticCurveTo(47, by - 2, 45, by + 2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = mane;
  g.beginPath();
  g.moveTo(41, by - 5);
  g.quadraticCurveTo(45, by - 15, 50, by - 18);
  g.lineTo(48, by - 13);
  g.quadraticCurveTo(44, by - 8, 43, by - 3);
  g.closePath();
  g.fill();
  g.fillStyle = "#1a1008";
  g.fillRect(52, by - 14, 1.4, 1.4);
  g.fillStyle = st.trim;
  g.fillRect(26, by - 7.5, 9, 3);
  g.strokeStyle = st.trim;
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(55, by - 10);
  g.lineTo(36, by - 12);
  g.stroke();
  const hipY = by - 6;
  const x = 30;
  limb(g, x + 1, hipY, 0.5, 6, -0.2, 6, 3, shade(st.coat.startsWith("#") ? st.coat : "#5a3a2a", -0.45));
  const { sx, sy } = body(g, x, hipY - 3, st, idle ? 0.5 : 1.6 + Math.sin(t * 2) * 0.5);
  head(g, sx + 1, sy - 6, st);
  const fa = kind === "horsearcher" ? -1.4 : -0.95;
  const [hx, hy] = limb(g, sx + 2, sy + 2, fa, 6, fa - 0.25, 6, 2.6, st.coat);
  weapon(g, kind === "horsearcher" ? "archer" : "spear", hx, hy, idle ? 0 : Math.sin(t));
}

/** Bir karenin piksel boyu (sayfada kareler yan yana dizilir). */
export const FIG_PX = S * R;
const sheets = new Map<string, HTMLCanvasElement>();

/** Figürün yürüyüş/dörtnala karelerini üretir; son kare duruş karesidir. */
export function figureFrames(kind: FigKind, st: FigStyle): Texture[] {
  const key = `${FIG_VER}|${kind}|${st.coat}|${st.trim}|${st.hat}|${st.hatCol}|${st.horse ?? ""}|${st.cape ?? ""}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = figureSheet(kind, st);
  const base = Texture.from(c);
  const out = Array.from({ length: FRAMES + 1 }, (_, f) => new Texture({ source: base.source, frame: new Rectangle(f * S * R, 0, S * R, S * R) }));
  cache.set(key, out);
  return out;
}

/** Aynı kareleri düz canvas olarak verir (2B savaş alanı için). */
export function figureSheet(kind: FigKind, st: FigStyle): HTMLCanvasElement {
  const key = `${FIG_VER}|${kind}|${st.coat}|${st.trim}|${st.hat}|${st.hatCol}|${st.horse ?? ""}|${st.cape ?? ""}`;
  const hit = sheets.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = S * R * (FRAMES + 1);
  c.height = S * R;
  const g = c.getContext("2d")!;
  for (let f = 0; f <= FRAMES; f++) {
    g.save();
    g.translate(f * S * R, 0);
    g.scale(R, R);
    const idle = f === FRAMES;
    if (kind === "rider" || kind === "horsearcher") drawRider(g, kind, st, f / FRAMES, idle);
    else drawFoot(g, kind, st, f / FRAMES, idle);
    g.restore();
  }
  sheets.set(key, c);
  return c;
}

/** Hareket hızına göre kare değiştiren figür. */
export class Fig extends Sprite {
  private ph = Math.random();
  constructor(public frames: Texture[], public size = 34) {
    super(frames[FRAMES]);
    this.anchor.set(0.48, 0.9);
    this.scale.set(size / S / R);
  }

  setFrames(fr: Texture[]): void {
    if (fr === this.frames) return;
    this.frames = fr;
    this.texture = fr[FRAMES];
  }

  /** v: hız (birim/sn), dir: yön (-1 sol, 1 sağ). */
  tick(dt: number, v: number, dir: number, rate = 1): void {
    const k = this.size / S / R;
    if (dir) this.scale.x = k * (dir < 0 ? -1 : 1);
    this.scale.y = k;
    if (v < 3) {
      this.texture = this.frames[FRAMES];
      return;
    }
    this.ph = (this.ph + dt * Math.min(2.6, 0.9 + v / 60) * rate * 1.6) % 1;
    this.texture = this.frames[Math.floor(this.ph * FRAMES) % FRAMES];
  }
}

export const HERO_STYLE: FigStyle = { coat: "#9a3a24", trim: "#e8c45a", hat: "bork", hatCol: "#6a4428", cape: "#6a2218", horse: "#7a4a28", mane: "#1a0e06" };
export const TROOP_STYLE: FigStyle = { coat: "#8a4028", trim: "#e0b858", hat: "tolga", hatCol: "#9a9088", horse: "#8a5430" };

/** Bölgeye göre haydut kıyafeti. */
export const REGION_STYLE: Record<string, FigStyle> = {
  rum: { coat: "#5a4a7a", trim: "#c8c0e0", hat: "migfer", hatCol: "#9a9aa8", horse: "#4a3a30" },
  kafkas: { coat: "#4a3a2a", trim: "#a08060", hat: "papak", hatCol: "#2a2020", horse: "#3a2a1e" },
  hazar: { coat: "#2a5a6a", trim: "#d8d0b0", hat: "sarik", hatCol: "#c84a3a", horse: "#6a5a4a" },
  kipcak: { coat: "#8a6a3a", trim: "#d8b070", hat: "bork", hatCol: "#5a4a2a", horse: "#a07a4a", mane: "#4a3a2a" },
  karakum: { coat: "#c8a060", trim: "#6a3a1a", hat: "sarik", hatCol: "#e8dcc0", horse: "#c09a6a" },
  horasan: { coat: "#2a2030", trim: "#a83a3a", hat: "kukuleta", hatCol: "#1a141e", horse: "#2a2020" },
  maveraunnehir: { coat: "#7a2a1e", trim: "#c89040", hat: "bork", hatCol: "#3a2a1a", horse: "#6a3a1a" },
  tanri: { coat: "#9aa8b8", trim: "#4a5a6a", hat: "kurk", hatCol: "#e8e8e8", horse: "#d8d0c8", mane: "#8a8078" },
};
