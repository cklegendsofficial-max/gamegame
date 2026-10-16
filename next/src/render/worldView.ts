import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import { CITIES, GH, GW, H, NH, NW, TW, W, type World } from "../world/gen";
import type { Camera } from "./camera";
import type { Game } from "../game/game";
import { CITY_NAME, DAY_SEC, NODE_SPRITE, armySize } from "../game/data";
import { CAPITAL, SLAVE_RADIUS } from "../game/state";
import { FACTIONS, citiesOf, type FactionId } from "../game/factions";
import { nemName } from "../game/nemesis";
import { TOMBS, tombOf } from "../game/deep";
import { FORT_TIERS, type FortOwner } from "../game/forts";
import { SEASONS } from "../game/seasons";
import { alongPath, seaPath } from "../game/hazar";
import { tamgaCanvas, type Tamga } from "../game/ozan";
import { boyOf } from "../game/korkut";
import { t as tr } from "../i18n";
import { settings } from "../settings";
import { terrainMesh, type TerrainMesh } from "./terrain";
import { Life } from "./life";
import { RARITY } from "../game/rpg";
import { Fig, HERO_STYLE, REGION_STYLE, TROOP_STYLE, figureFrames, type FigKind, type FigStyle } from "./figures";
import { bushTextures, palmTextures, peakTextures, propTex, softenIsoTex, yurtTextures } from "./props";
import { AREA_BOSSES, regionAt } from "../game/regions";
import { PORTS } from "../game/hazar";
import { MAP_W } from "./mapScale";

const urls: Record<string, string> = {};
for (const [p, u] of Object.entries(import.meta.glob<string>("../assets/**/*.webp", { eager: true, query: "?url", import: "default" }))) {
  const parts = p.split("/");
  urls[parts[parts.length - 2] + "/" + parts[parts.length - 1].replace(".webp", "")] = u;
}

export function assetUrl(key: string): string {
  return urls[key] ?? urls["icons/" + key] ?? "";
}

const FOG_UP = 4;
const RIVAL_COL: Record<string, number> = { peace: 0xe8d39a, ally: 0x6fe07a, war: 0xff4a3a, vassal: 0xffc94a, dead: 0x888888 };
const LABEL_STYLE = { fontFamily: "Georgia, serif", fontSize: 26, fill: "#fff3d6", stroke: { color: "#2a1606", width: 6 }, fontWeight: "bold" as const };

const fortColor = (o: FortOwner): string => (o === "me" ? "#ffd36a" : o === "harami" ? "#ff8a70" : FACTIONS[o].color);
/** Kale seviyesine göre hafif ton farkı: t1 ahşap sıcaklığı kendi dokusundan gelir, t2 palanka hafif soğuk taş, t3 kale hafif sıcak taş, t4 hisar altın. */
const fortTint = (tier: 1 | 2 | 3 | 4): number => (tier === 4 ? 0xffe6a8 : tier === 3 ? 0xf2e2c6 : tier === 2 ? 0xdce6ef : 0xffffff);

function makeAtlas(): { tex: Texture; trees: Texture[]; peaks: Texture[] } {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 128;
  const g = c.getContext("2d")!;
  const pine = (ox: number, dark: string, light: string) => {
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.ellipse(ox + 32, 58, 14, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a3a1e";
    g.fillRect(ox + 30, 46, 5, 12);
    for (let k = 0; k < 3; k++) {
      const y = 8 + k * 12;
      const w = 10 + k * 6;
      g.fillStyle = dark;
      g.beginPath();
      g.moveTo(ox + 32, y);
      g.lineTo(ox + 32 + w, y + 20);
      g.lineTo(ox + 32 - w, y + 20);
      g.fill();
      g.fillStyle = light;
      g.beginPath();
      g.moveTo(ox + 32, y);
      g.lineTo(ox + 32 - w, y + 20);
      g.lineTo(ox + 30, y + 20);
      g.fill();
    }
  };
  const round = (ox: number, dark: string, light: string) => {
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.ellipse(ox + 32, 58, 16, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a3a1e";
    g.fillRect(ox + 30, 40, 5, 18);
    g.fillStyle = dark;
    g.beginPath();
    g.arc(ox + 32, 30, 17, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = light;
    g.beginPath();
    g.arc(ox + 27, 25, 10, 0, Math.PI * 2);
    g.fill();
  };
  pine(0, "#244a2a", "#3d6e3a");
  pine(64, "#2c5530", "#4a7d40");
  round(128, "#3f6b2e", "#62913f");
  round(192, "#4f6e2a", "#7a9a45");
  const peak = (ox: number, top: number, px: number, base: string, lit: string, dark: string, snow: boolean) => {
    const L = ox + 6;
    const Rr = ox + 122;
    const tx = ox + px;
    g.fillStyle = "rgba(0,0,0,0.2)";
    g.beginPath();
    g.ellipse(ox + 64, 120, 60, 8, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = base;
    g.beginPath();
    g.moveTo(L, 120);
    g.quadraticCurveTo(tx - 30, top + 40, tx, top);
    g.quadraticCurveTo(tx + 30, top + 44, Rr, 120);
    g.fill();
    g.fillStyle = lit;
    g.beginPath();
    g.moveTo(L, 120);
    g.quadraticCurveTo(tx - 30, top + 40, tx, top);
    g.lineTo(tx - 6, top + 40);
    g.lineTo(tx + 2, top + 64);
    g.lineTo(tx - 10, 120);
    g.fill();
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(tx, top);
    g.quadraticCurveTo(tx + 30, top + 44, Rr, 120);
    g.lineTo(tx + 26, 120);
    g.lineTo(tx + 12, top + 50);
    g.fill();
    if (snow) {
      g.fillStyle = "#f2f5f8";
      g.beginPath();
      g.moveTo(tx, top);
      g.lineTo(tx + 16, top + 26);
      g.lineTo(tx + 7, top + 22);
      g.lineTo(tx + 1, top + 32);
      g.lineTo(tx - 7, top + 21);
      g.lineTo(tx - 15, top + 26);
      g.fill();
    }
  };
  peak(256, 54, 58, "#8f7a5c", "#b5a07c", "#6c5a42", false);
  peak(384, 24, 70, "#7d7266", "#a8998a", "#5a5148", false);
  peak(512, 8, 60, "#7a7068", "#a99c90", "#544c46", true);
  const tex = Texture.from(c);
  const sub = (x: number, y: number, w: number, h: number) => new Texture({ source: tex.source, frame: new Rectangle(x, y, w, h) });
  return { tex, trees: [0, 64, 128, 192].map((x) => sub(x, 0, 64, 64)), peaks: [256, 384, 512].map((x) => sub(x, 0, 128, 128)) };
}

interface Marker {
  sp: Container;
  x: number;
  y: number;
  label?: Text;
}

export class WorldView {
  layer = new Container();
  private deco = new Container();
  private places = new Container();
  private labels = new Container();
  /** Sisin üstünde kalan şehir adları; eski haritalardaki mürekkep yazılar gibi. */
  private ink = new Container();
  private units = new Container();
  private pathG = new Graphics();
  private fxG = new Graphics();
  /** Sahip olunan şehirlerin sur halkası: surlar yükseldikçe genişler/koyulaşır; başkentte her zaman soluk görünür. */
  private wallRingG = new Graphics();
  private fog!: Sprite;
  private fogCanvas = document.createElement("canvas");
  private fogSmall = document.createElement("canvas");
  private fogPaper = document.createElement("canvas");
  private paperTex: HTMLCanvasElement | null = null;
  private night = new Graphics();
  private seasonG = new Graphics();
  private snowG = new Graphics();
  private seasonK = "";
  private clouds = new Container();
  private lights = new Container();
  private troops = new Container();
  fogDirty = true;
  private tex: Record<string, Texture> = {};
  private villageM: Marker[] = [];
  private villageSt: (string | undefined)[] = [];
  private campM: Marker[] = [];
  private nodeM: Marker[] = [];
  private ruinM: Marker[] = [];
  private kurganM: Marker[] = [];
  private kaleM: Marker[] = [];
  private kaleF: Sprite[] = [];
  private fortM: Marker | null = null;
  private gateM: Marker | null = null;
  private peakM: Marker | null = null;
  private boyM: Marker | null = null;
  private boyK = "";
  private otagM: Marker | null = null;
  private kipM: Marker[] | null = null;
  /** Dağ silüeti dekoru: uzaktan (düşük zoom) seyrekleşir/solar, gereksiz yere GPU yormasın. */
  private peakSprites: Sprite[] = [];
  private peakLodOn = true;
  private seraiF = new Map<string, Sprite>();
  private ownF = new Map<string, Sprite>();
  private rivalsM = new Map<string, { c: Container; st: string }>();
  private compM = new Map<string, Container>();
  private trail: number[] = [];
  private cityM: Marker[] = [];
  private hero!: Container;
  private heroCount!: Text;
  private heroFlag!: Sprite;
  private heroTamga!: Sprite;
  private heroHorse!: Sprite;
  private heroFig!: Fig;
  private heroBadge!: Container;
  private horseKey = "";
  private face = 1;
  private dustG = new Graphics();
  private dust: { x: number; y: number; t: number }[] = [];
  private dustAcc = 0;
  private tamgaKey = "";
  private heroBars!: Graphics;
  private bandits = new Map<number, Container>();
  private marchesM = new Map<number, Container>();
  private caravansM = new Map<number, Container>();
  private stormC = new Container();
  private stormM = new Map<number, { glow: Sprite; g: Graphics; flash: number }>();
  private glow!: Texture;
  private terrain: TerrainMesh | null = null;
  private life: Life | null = null;
  private mark: { x: number; y: number; t: number } | null = null;
  private time = 0;
  private sagaT = -9;
  private sagaAt: { x: number; y: number } | null = null;
  private visT = 0;

  constructor(private app: Application, private world: World) {}

  /** Flora/yurt/kamp soft-base; şehir/kale/kule CC0’ye soft-fade çerçevesi. */
  private injectProps(): void {
    const yurts = yurtTextures(4);
    const palms = palmTextures(5);
    const bushes = bushTextures(4);
    this.tex["map/yurts"] = yurts[0];
    // sticker kampın sert dairesel dirt tabanı yerine soft kum kamp
    this.tex["map/camp"] = propTex("camp", 0);
    // CC0 köy sticker'ları yerine yurt kampıyla aynı oturuş mantığında prosedürel köy
    this.tex["map/village"] = propTex("village", 0);
    this.tex["map/village2"] = propTex("village", 1);
    // baked canvas'ta "map/oasis" asset'i yok — procedural vaha üret
    this.tex["map/oasis"] = propTex("oasis", 0);
    this.tex["flora/palm"] = palms[0];
    this.tex["flora/saxaul"] = bushes[0];
    this.tex["flora/bush"] = bushes[1];
    this.tex["flora/tamarisk"] = bushes[2];
    yurts.forEach((t, i) => (this.tex[`prop/yurt${i}`] = t));
    palms.forEach((t, i) => (this.tex[`prop/palm${i}`] = t));
    bushes.forEach((t, i) => (this.tex[`prop/bush${i}`] = t));
    peakTextures().forEach((t, i) => (this.tex[`prop/peak${i}`] = t));
  }

  /** Şehir/kale/kule CC0 dokularını yurt-kamp soft oturuş diline çek. */
  private softenCityAssets(): void {
    for (const k of Object.keys(this.tex)) {
      if (k.startsWith("cities/") || k === "map/castle" || k === "map/tower" || k === "map/tower_wood" || k === "map/barracks") {
        this.tex[k] = softenIsoTex(this.tex[k]);
      }
    }
  }

  async load(): Promise<void> {
    const keys = Object.keys(urls);
    await Promise.all(keys.map(async (k) => (this.tex[k] = await Assets.load<Texture>(urls[k]))));
    this.injectProps();
    this.softenCityAssets();
    if (!settings.eco) {
      try {
        this.terrain = terrainMesh(this.world, { sand: this.tex["tex/sand"], steppe: this.tex["tex/steppe"], grass: this.tex["tex/grass"], rock: this.tex["tex/rock"] });
        this.layer.addChild(this.terrain.mesh);
      } catch (e) {
        console.warn("terrain shader", e);
        this.terrain = null;
      }
    }
    if (!this.terrain) {
      const terrain = new Sprite(Texture.from(this.world.canvas));
      terrain.scale.set(W / TW);
      this.layer.addChild(terrain);
    }
    this.layer.addChild(this.pathG);
    this.buildDeco();
    this.layer.addChild(this.deco);
    this.layer.addChild(this.seasonG);
    this.buildPlaces();
    this.layer.addChild(this.scarG);
    this.layer.addChild(this.wallRingG);
    this.layer.addChild(this.places);
    this.layer.addChild(this.labels);
    this.layer.addChild(this.units);
    this.layer.addChild(this.fxG);
    this.layer.addChild(this.scarAirG);
    this.glow = this.glowTex();
    this.layer.addChild(this.stormC);
    this.buildAmbience();
    this.fogSmall.width = NW;
    this.fogSmall.height = NH;
    this.fogCanvas.width = this.fogPaper.width = NW * FOG_UP;
    this.fogCanvas.height = this.fogPaper.height = NH * FOG_UP;
    this.fog = new Sprite(Texture.from(this.fogCanvas));
    this.fog.scale.set(W / this.fogCanvas.width, H / this.fogCanvas.height);
    this.layer.addChild(this.fog);
    this.layer.addChild(this.ink);
    this.app.stage.addChild(this.layer);
    this.buildHero();
  }

  /** Keşfedilmemiş toprakların eski harita kâğıdı: lekeler, lifler, ince tarama. */
  private parchment(): HTMLCanvasElement {
    if (this.paperTex) return this.paperTex;
    const c = document.createElement("canvas");
    const w = (c.width = this.fogCanvas.width);
    const h = (c.height = this.fogCanvas.height);
    const g = c.getContext("2d")!;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const base = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, w * 0.7);
    base.addColorStop(0, "#b8935a");
    base.addColorStop(1, "#7a5a32");
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const r = 3 + rnd() ** 3 * 46;
      g.fillStyle = rnd() < 0.55 ? `rgba(70,44,18,${0.03 + rnd() * 0.05})` : `rgba(235,210,160,${0.03 + rnd() * 0.05})`;
      g.beginPath();
      g.ellipse(rnd() * w, rnd() * h, r, r * (0.5 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    g.lineWidth = 0.6;
    for (let i = 0; i < 700; i++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const a = rnd() * Math.PI;
      const l = 3 + rnd() * 10;
      g.strokeStyle = `rgba(60,38,16,${0.08 + rnd() * 0.1})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    g.strokeStyle = "rgba(60,38,16,0.07)";
    g.lineWidth = 0.8;
    for (let d = -h; d < w; d += 9) {
      g.beginPath();
      g.moveTo(d, h);
      g.lineTo(d + h, 0);
      g.stroke();
    }
    return (this.paperTex = c);
  }

  private glowTex(): Texture {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.35, "rgba(255,255,255,0.45)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    return Texture.from(c);
  }

  private buildAmbience(): void {
    const glow = this.glowTex();
    for (let k = 0; k < 9; k++) {
      const s = new Sprite(glow);
      s.anchor.set(0.5);
      s.tint = 0x1a120a;
      s.alpha = 0.16;
      s.width = 700 + ((k * 337) % 500);
      s.height = s.width * 0.55;
      s.position.set(((k * 1931) % W), ((k * 787) % H));
      this.clouds.addChild(s);
    }
    this.layer.addChild(this.clouds);
    this.layer.addChild(this.snowG);
    this.layer.addChild(this.night);
    for (const c of CITIES) {
      const s = new Sprite(glow);
      s.anchor.set(0.5);
      s.tint = 0xffb050;
      s.width = s.height = c.id === CAPITAL.id ? 340 : 260;
      s.position.set(c.x, c.y - 10);
      s.blendMode = "add";
      this.lights.addChild(s);
    }
    this.torch = new Sprite(glow);
    this.torch.anchor.set(0.5);
    this.torch.tint = 0xffa040;
    this.torch.width = this.torch.height = 230;
    this.torch.blendMode = "add";
    this.lights.addChild(this.torch);
    this.layer.addChild(this.lights);
  }

  private torch!: Sprite;
  private campFires: Sprite[] = [];

  private drawStorms(game: Game, dt: number): void {
    const live = new Set<number>();
    for (const st of game.s.storms) {
      live.add(st.id);
      let m = this.stormM.get(st.id);
      if (!m) {
        const glow = new Sprite(this.glow);
        glow.anchor.set(0.5);
        glow.tint = st.kind === "kum" ? 0xd9b47a : 0x46566e;
        const g = new Graphics();
        this.stormC.addChild(glow, g);
        m = { glow, g, flash: 0 };
        this.stormM.set(st.id, m);
      }
      const k = Math.max(0, Math.min(1, st.age / 6, st.life / 6));
      const sand = st.kind === "kum";
      m.glow.position.set(st.x, st.y);
      m.glow.width = st.r * 2.6;
      m.glow.height = st.r * 2.3;
      if (!sand && m.flash <= 0 && Math.random() < dt * 0.12) m.flash = 0.25;
      m.flash -= dt;
      m.glow.tint = !sand && m.flash > 0 ? 0xb8c8ff : sand ? 0xb4823e : 0x26324a;
      m.glow.alpha = k * (sand ? 0.85 : 0.7) + (m.flash > 0 ? 0.3 : 0);
      const g = m.g;
      g.clear();
      if (sand) {
        for (let i = 0; i < 26; i++) {
          const h1 = ((i * 2654435761 + 99) >>> 0) / 4294967296;
          const h2 = ((i * 40503 + 7) >>> 0) % 1000 / 1000;
          const a = h1 * Math.PI * 2 + this.time * 0.15;
          const rr = Math.sqrt(h2) * st.r * 0.85;
          const x = st.x + Math.cos(a) * rr + Math.sin(this.time * 0.7 + i) * 18;
          const y = st.y + Math.sin(a) * rr * 0.8;
          g.circle(x, y, 26 + (i % 5) * 9);
        }
        g.fill({ color: 0xd2a660, alpha: k * 0.16 });
      }
      const n = sand ? 280 : 230;
      const wx = sand ? 1 : 0.35;
      const wy = sand ? 0.18 : 1;
      const L = st.r * 0.9;
      for (let i = 0; i < n; i++) {
        const h1 = ((i * 2654435761) >>> 0) / 4294967296;
        const h2 = ((i * 2246822519 + 13) >>> 0) / 4294967296;
        const h3 = ((i * 3266489917 + 7) >>> 0) / 4294967296;
        const a = h1 * Math.PI * 2;
        const rr = Math.sqrt(h2) * st.r;
        const shift = (((this.time * (sand ? 140 : 260) + h3 * L) % L) + L) % L - L / 2;
        const x = st.x + Math.cos(a) * rr + wx * shift;
        const y = st.y + Math.sin(a) * rr + wy * shift;
        const edge = 1 - Math.hypot(x - st.x, y - st.y) / st.r;
        if (edge <= 0) continue;
        const len = sand ? 10 + h3 * 14 : 12 + h3 * 10;
        g.moveTo(x, y).lineTo(x + wx * len, y + wy * len);
      }
      g.stroke({ color: sand ? 0xf6deaa : 0xcfe0fa, width: sand ? 2.4 : 1.6, alpha: k * (sand ? 0.8 : 0.7) });
    }
    for (const [id, m] of this.stormM) if (!live.has(id)) {
      m.glow.destroy();
      m.g.destroy();
      this.stormM.delete(id);
    }
  }

  t(key: string): Texture {
    return this.tex[key] ?? this.tex["icons/" + key] ?? Texture.WHITE;
  }

  private occF = new Map<string, Sprite>();

  private smoke(x: number, y: number, k: number, color = 0x4a4038, sc = 1): void {
    const g = this.fxG;
    for (let i = 0; i < 8; i++) {
      const ph = (this.time * 0.22 + i / 8 + x * 0.0007) % 1;
      const px = x + (Math.sin(this.time * 0.8 + i * 1.7) * 14 + ph * 40) * sc;
      g.circle(px, y - ph * 170 * sc, (14 + ph * 38) * sc).fill({ color, alpha: (1 - ph) * 0.5 * k });
    }
  }

  /** Dünyanın nabzı haritada: cepheler, işgal sancakları, kıtlık dumanı, kuraklık, kurt gözleri. */
  private drawPulse(game: Game, inv: number): void {
    const s = game.s;
    const w = s.wd;
    if (!w) return;
    const g = this.fxG;
    const col = (f: FactionId) => parseInt(FACTIONS[f].color.slice(1), 16);
    const pos = (id: string) => CITIES.find((c) => c.id === id)!;
    for (const war of w.wars) {
      const ca = citiesOf(war.a).map(pos);
      const cb = citiesOf(war.b).map(pos);
      let best: [{ x: number; y: number }, { x: number; y: number }] | null = null;
      for (const a of ca) for (const b of cb) if (!best || Math.hypot(a.x - b.x, a.y - b.y) < Math.hypot(best[0].x - best[1].x, best[0].y - best[1].y)) best = [a, b];
      if (!best) continue;
      const [A, B] = best;
      const k = 0.5 + Math.max(-0.3, Math.min(0.3, (war.score / 100) * 0.3 + war.takes * 0.04));
      const fx = A.x + (B.x - A.x) * k;
      const fy = A.y + (B.y - A.y) * k;
      if (!game.isExplored(fx, fy) && !game.isExplored(A.x, A.y) && !game.isExplored(B.x, B.y)) continue;
      for (const [P, f] of [[A, war.a], [B, war.b]] as const) {
        const d = Math.hypot(fx - P.x, fy - P.y);
        const n = Math.floor(d / 70);
        for (let i = 1; i < n; i++) {
          const ph = (i / n + this.time * 0.04) % 1;
          if (ph < 0.12) continue;
          const x = P.x + (fx - P.x) * ph;
          const y = P.y + (fy - P.y) * ph + Math.sin(this.time * 9 + i) * 1.5;
          g.circle(x, y, 10 * inv).fill({ color: 0x1a0e04, alpha: 0.55 });
          g.circle(x, y - 1, 7 * inv).fill({ color: col(f), alpha: 0.95 });
          g.rect(x - 1 * inv, y - 20 * inv, 2 * inv, 16 * inv).fill({ color: 0xe8e0d0, alpha: 0.9 });
        }
        const bx = P.x + (fx - P.x) * 0.82;
        const by = P.y + (fy - P.y) * 0.82;
        g.rect(bx - 1.5 * inv, by - 40 * inv, 3 * inv, 40 * inv).fill({ color: 0x2a1606 });
        g.poly([bx, by - 40 * inv, bx + (fx > P.x ? 22 : -22) * inv, by - 33 * inv + Math.sin(this.time * 5) * 2, bx, by - 26 * inv]).fill({ color: col(f) });
      }
      const pr = (this.time * 0.9) % 1;
      g.circle(fx, fy, 50 + pr * 90).stroke({ color: 0xff5030, width: 4, alpha: 0.6 * (1 - pr) });
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + this.time * 3;
        const r = 18 + ((i * 37 + Math.floor(this.time * 8)) % 30);
        g.circle(fx + Math.cos(a) * r, fy - 10 + Math.sin(a) * r * 0.6, 2.5 * inv).fill({ color: 0xffd080, alpha: 0.5 + 0.5 * Math.sin(this.time * 20 + i) });
      }
      this.smoke(fx, fy - 10, 1, 0x3a3430, inv);
      const sw = 22 * inv;
      g.moveTo(fx - sw, fy - sw - 30).lineTo(fx + sw, fy + sw - 30).moveTo(fx + sw, fy - sw - 30).lineTo(fx - sw, fy + sw - 30).stroke({ color: 0xfff0d0, width: 5 * inv, alpha: 0.9 });
    }
    if (this.time - this.sagaT > 1) {
      this.sagaT = this.time;
      this.sagaAt = s.free ? (game.chapter()?.goto(game) ?? null) : null;
    }
    const sp = this.sagaAt;
    if (sp) {
      const pr = (this.time * 0.6) % 1;
      g.ellipse(sp.x, sp.y, (40 + pr * 60) * inv, (16 + pr * 24) * inv).stroke({ color: 0xc89bff, width: 3 * inv, alpha: 0.7 * (1 - pr) });
      g.rect(sp.x - 6 * inv, sp.y - 150 * inv, 12 * inv, 150 * inv).fill({ color: 0xb07cff, alpha: 0.16 });
      g.rect(sp.x - 2 * inv, sp.y - 150 * inv, 4 * inv, 150 * inv).fill({ color: 0xe6d0ff, alpha: 0.35 });
      const by = sp.y - 170 * inv - Math.abs(Math.sin(this.time * 3)) * 14 * inv;
      g.poly([sp.x - 14 * inv, by - 14 * inv, sp.x + 14 * inv, by - 14 * inv, sp.x, by + 6 * inv]).fill({ color: 0xc89bff }).stroke({ color: 0x2a0e44, width: 2 * inv });
    }
    for (const c of CITIES) {
      const occ = w.occ[c.id];
      let f = this.occF.get(c.id);
      if (occ && !f) {
        f = new Sprite(this.t("tug"));
        f.anchor.set(0.5, 1);
        f.scale.set(96 / f.texture.height);
        f.position.set(c.x + 4, c.y - 56);
        this.places.addChild(f);
        this.occF.set(c.id, f);
      }
      if (f) {
        f.visible = !!occ && !s.owned[c.id];
        if (occ) f.tint = col(occ);
        f.rotation = Math.sin(this.time * 2 + c.x) * 0.04;
      }
      const sh = w.short[c.id] ?? 0;
      if (sh >= 3 && game.isExplored(c.x, c.y)) this.smoke(c.x - 30, c.y - 30, Math.min(1, (sh - 2) / 4), sh >= 6 ? 0x2a2420 : 0x6a5c4e, Math.min(1.8, inv));
    }
    if (w.drought && game.isExplored(w.drought.x, w.drought.y)) {
      const d = w.drought;
      const a = 0.14 + Math.sin(this.time * 1.3) * 0.03;
      g.ellipse(d.x, d.y, 720, 520).fill({ color: 0xb8701e, alpha: a });
      g.ellipse(d.x, d.y, 480, 340).fill({ color: 0xd08a2a, alpha: a });
      g.ellipse(d.x, d.y, 720, 520).stroke({ color: 0xffb040, width: 6, alpha: 0.35 });
      for (let i = 0; i < 18; i++) {
        const a0 = i * 2.39;
        const r0 = 80 + ((i * 131) % 380);
        const cx = d.x + Math.cos(a0) * r0;
        const cy = d.y + Math.sin(a0) * r0 * 0.7;
        g.moveTo(cx, cy).lineTo(cx + 18, cy + 9).lineTo(cx + 30, cy + 4).moveTo(cx + 18, cy + 9).lineTo(cx + 22, cy + 24);
      }
      g.stroke({ color: 0x5a3410, width: 3, alpha: 0.5 });
      for (let i = 0; i < 14; i++) {
        const yy = d.y - 300 + i * 46;
        const xx = d.x - 380 + ((i * 97) % 160);
        for (let j = 0; j < 6; j++) {
          const x = xx + j * 90;
          const y = yy + Math.sin(this.time * 4 + i + j) * 4;
          if (j) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
      }
      g.stroke({ color: 0xffe0a0, width: 2, alpha: 0.25 });
    }
    const t = game.dayOf().t;
    const dark = Math.max(0, -Math.cos(t * Math.PI * 2));
    if (dark > 0.4 && w.wolves >= 65) {
      const h = s.hero;
      for (let i = 0; i < 4; i++) {
        const blink = Math.sin(this.time * 0.9 + i * 2.1);
        if (blink < -0.2) continue;
        const a = i * 1.57 + Math.floor(this.time / 6 + i) * 0.9;
        const r = 260 + ((i * 53) % 120);
        const x = h.x + Math.cos(a) * r;
        const y = h.y + Math.sin(a) * r;
        const e = (blink + 0.2) * dark;
        g.circle(x - 7, y, 4 * inv).circle(x + 7, y, 4 * inv).fill({ color: 0xffe060, alpha: Math.min(0.95, e * 1.3) });
      }
    }
    const h = s.hero;
    for (let i = 0; i < s.ruins.length; i++) {
      const r = s.ruins[i];
      if (r.looted || Math.abs(r.x - h.x) > 2600 || Math.abs(r.y - h.y) > 1800 || !game.isExplored(r.x, r.y)) continue;
      for (let k = 0; k < 4; k++) {
        const ph = (this.time * 0.35 + k / 4 + i * 0.13) % 1;
        const x = r.x + Math.sin(i * 3.1 + k * 1.9) * 26 + Math.sin(this.time + k) * 4;
        g.circle(x, r.y - 20 - ph * 60, 2.4 * Math.min(2, inv)).fill({ color: 0xffe6a0, alpha: Math.sin(ph * Math.PI) * 0.8 });
      }
    }
    for (const [c, p] of Object.entries(w.plague ?? {})) {
      if (p <= 0) continue;
      const P = pos(c);
      if (!P || !game.isExplored(P.x, P.y)) continue;
      const a = 0.16 + p * 0.05 + Math.sin(this.time * 1.1 + P.x) * 0.03;
      g.ellipse(P.x, P.y, 200 + p * 40, 140 + p * 26).fill({ color: 0x8a9a10, alpha: a * 0.7 });
      g.ellipse(P.x, P.y, 130 + p * 30, 90 + p * 20).fill({ color: 0xb8c828, alpha: a * 0.6 });
      const n = Math.round(8 + p * 3);
      for (let i = 0; i < n; i++) {
        const ph = (this.time * 0.12 + i / n) % 1;
        const ang = i * 2.4 + this.time * 0.3;
        const rr = 60 + ph * (140 + p * 30);
        g.circle(P.x + Math.cos(ang) * rr, P.y + Math.sin(ang) * rr * 0.65 - ph * 50, (12 + ph * 22) * Math.min(1.6, inv)).fill({ color: 0xd8e050, alpha: (1 - ph) * 0.4 });
      }
      g.ellipse(P.x, P.y, 200 + p * 40, 140 + p * 26).stroke({ color: 0xd0d040, width: 3 * inv, alpha: 0.5 });
      if (w.quarantine?.[c]) g.circle(P.x, P.y, 200 + p * 30).stroke({ color: 0xffd040, width: 4 * inv, alpha: 0.55 });
    }
    if (w.hoard && game.isExplored(w.hoard.x, w.hoard.y)) {
      const { x, y } = w.hoard;
      const pr = (this.time * 0.7) % 1;
      g.circle(x, y, 30 + pr * 70).stroke({ color: 0xffd040, width: 4 * inv, alpha: 0.7 * (1 - pr) });
      const sw = 20 * inv;
      g.moveTo(x - sw, y - sw).lineTo(x + sw, y + sw).moveTo(x + sw, y - sw).lineTo(x - sw, y + sw).stroke({ color: 0x8a1010, width: 9 * inv, alpha: 0.95 });
      g.moveTo(x - sw, y - sw).lineTo(x + sw, y + sw).moveTo(x + sw, y - sw).lineTo(x - sw, y + sw).stroke({ color: 0xe03020, width: 5 * inv, alpha: 0.95 });
    }
  }

  private buildDeco(): void {
    const items: { y: number; s: Sprite }[] = [];
    const hash = (n: number) => (((n * 2654435761) ^ (n >>> 7) * 40503) >>> 0) / 4294967296;
    const fl = (names: string[]) => names.map((n) => this.tex["flora/" + n]).filter(Boolean);
    const rich = fl(["pine0"]).length > 0;
    const atlas = rich ? null : makeAtlas();
    const PINE = fl(["pine0", "pine1", "pine2", "pine3", "pop0", "pine1"]);
    const BROAD = fl(["elm", "mulberry", "walnut", "pop1", "pop2", "pop3", "apricot", "elm", "walnut"]);
    const peaks = peakTextures();
    const tree = (tex: Texture, x: number, y: number, hgt: number, r: number, tint = 0xffffff) => {
      const s = new Sprite(tex);
      s.anchor.set(0.5, 0.94);
      s.position.set(x, y);
      const sc = hgt / tex.height;
      s.scale.set(sc * (r > 0.5 ? 1 : -1), sc);
      s.tint = tint;
      items.push({ y, s });
    };
    const tr = this.world.trees;
    const stride = Math.max(1, Math.floor(tr.length / 3 / 9000));
    for (let k = 0; k < tr.length; k += 3 * stride) {
      const r = hash(k + 11);
      if (atlas) {
        const s = new Sprite(atlas.trees[(tr[k + 2] ? 0 : 2) + ((k / 3) % 2)]);
        s.anchor.set(0.5, 0.9);
        s.position.set(tr[k], tr[k + 1]);
        s.scale.set(0.42 + ((k * 7) % 10) / 40);
        items.push({ y: tr[k + 1], s });
        continue;
      }
      const north = tr[k + 1] < H * 0.42;
      const pool = tr[k + 2] || (north && r < 0.6) ? PINE : BROAD;
      tree(pool[Math.floor(hash(k + 5) * pool.length)], tr[k], tr[k + 1], 30 + r * 16, hash(k + 3));
    }
    if (!atlas) this.scatterDry(tree, hash);
    const pk = this.world.peaks;
    for (let k = 0; k < pk.length; k += 3) {
      const h = pk[k + 2];
      const r = ((k * 2654435761) >>> 0) / 4294967296;
      const v = h < 0.58 ? 0 : h < 0.73 + r * 0.06 ? 1 : 2;
      const sc = 0.5 + Math.min(0.48, (h - 0.5) * 1.35) + r * 0.16;
      const flip = r > 0.5 ? 1 : -1;
      const s = new Sprite(this.tex[`prop/peak${v}`] ?? peaks[v]);
      s.anchor.set(0.5, 0.95);
      // geniş yatay, daha alçak — Paint konisi değil yumuşak sıradağ
      s.scale.set(sc * flip * (1.15 + r * 0.2), sc * (0.72 + r * 0.12));
      s.position.set(pk[k], pk[k + 1]);
      const tn = 200 + Math.floor(r * 32);
      s.tint = (tn << 16) | ((tn - 22) << 8) | Math.min(255, tn - 42);
      s.alpha = 0.88;
      items.push({ y: pk[k + 1], s });
      this.peakSprites.push(s);
    }
    items.sort((a, b) => a.y - b.y);
    // Chunked culling: per-sprite bounds checks on ~10k deco sprites dominated frame CPU.
    const CH = 900;
    const cols = Math.ceil(W / CH);
    const rows = Math.ceil(H / CH);
    const chunks: (Container | undefined)[] = new Array(cols * rows);
    const box: number[] = [];
    for (const it of items) {
      const cx = Math.min(cols - 1, Math.max(0, Math.floor(it.s.x / CH)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(it.s.y / CH)));
      const i = cy * cols + cx;
      let c = chunks[i];
      if (!c) {
        c = chunks[i] = new Container();
        c.cullable = true;
        c.cullableChildren = false;
        box[i * 4] = Infinity;
        box[i * 4 + 1] = Infinity;
        box[i * 4 + 2] = -Infinity;
        box[i * 4 + 3] = -Infinity;
      }
      c.addChild(it.s);
      const r = 160 * Math.abs(it.s.scale.y) + 40;
      box[i * 4] = Math.min(box[i * 4], it.s.x - r);
      box[i * 4 + 1] = Math.min(box[i * 4 + 1], it.s.y - r * 2);
      box[i * 4 + 2] = Math.max(box[i * 4 + 2], it.s.x + r);
      box[i * 4 + 3] = Math.max(box[i * 4 + 3], it.s.y + r * 0.4);
    }
    chunks.forEach((c, i) => {
      if (!c) return;
      c.cullArea = new Rectangle(box[i * 4], box[i * 4 + 1], box[i * 4 + 2] - box[i * 4], box[i * 4 + 3] - box[i * 4 + 1]);
      this.deco.addChild(c);
    });
  }

  private scatterDry(tree: (tex: Texture, x: number, y: number, hgt: number, r: number, tint?: number) => void, hash: (n: number) => number): void {
    const { height, moist, river, road } = this.world;
    const palms = [0, 1, 2, 3, 4].map((i) => this.tex[`prop/palm${i}`]).filter(Boolean);
    const shrub = [0, 1, 2, 3].map((i) => this.tex[`prop/bush${i}`]).filter(Boolean);
    if (!shrub.length && !palms.length) return;
    const sx = W / GW, sy = H / GH;
    const nearRiver = (x: number, y: number) => {
      for (let v = -5; v <= 5; v += 2) for (let u = -5; u <= 5; u += 2) {
        const xx = x + u, yy = y + v;
        if (xx >= 0 && yy >= 0 && xx < GW && yy < GH && river[yy * GW + xx]) return true;
      }
      return false;
    };
    for (let y = 3; y < GH - 3; y += 5) for (let x = 3; x < GW - 3; x += 5) {
      const n = y * GW + x;
      const r = hash(n * 7 + 1);
      const h = height[n], m = moist[n];
      if (h < 0.04 || h > 0.46) continue;
      const wx = (x + (hash(n + 2) - 0.5) * 4) * sx, wy = (y + (hash(n + 4) - 0.5) * 4) * sy;
      if (road[Math.floor((wy / H) * NH) * NW + Math.floor((wx / W) * NW)]) continue;
      if (CITIES.some((c) => Math.abs(c.x - wx) < 80 && Math.abs(c.y - wy) < 60)) continue;
      if (palms.length && m < 0.45 && r < 0.28 && nearRiver(x, y)) {
        const p = palms[Math.floor(hash(n + 11) * palms.length)];
        tree(p, wx, wy, 48 + hash(n + 9) * 22, hash(n + 6));
        continue;
      }
      if (!shrub.length || m > 0.5 || r > (m < 0.25 ? 0.04 : 0.07)) continue;
      const sp = shrub[Math.floor(hash(n + 8) * shrub.length)];
      tree(sp, wx, wy, 16 + hash(n + 9) * 10, hash(n + 6));
    }
  }

  private label(text: string, x: number, y: number, size = 1): Text {
    const t = new Text({ text, style: { ...LABEL_STYLE, fontSize: LABEL_STYLE.fontSize * size } });
    t.anchor.set(0.5, 0);
    t.position.set(x, y);
    t.resolution = 2;
    return t;
  }

  /** Soft-fade pişmiş dokular (yurt/kamp/köy + softIso şehir/kale): minik temas gölgesi. */
  private isSoftSeated(key: string): boolean {
    return (
      key === "map/yurts" ||
      key === "map/camp" ||
      key === "map/village" ||
      key === "map/village2" ||
      key.startsWith("prop/yurt") ||
      key.startsWith("cities/") ||
      key === "map/castle" ||
      key === "map/tower" ||
      key === "map/tower_wood" ||
      key === "map/barracks"
    );
  }

  private place(key: string, x: number, y: number, w: number, name?: string, lsize = 0.8): Marker {
    const c = new Container();
    const soft = this.isSoftSeated(key);
    const footY = w * 0.11;
    // soft-seated: dokunun kendi kum + fade tabanı var → sadece minik temas
    // diğer (ruins/kurgan/node): geniş soft kum lekesi
    const ground = soft
      ? new Graphics().ellipse(0, footY, w * 0.32, w * 0.09).fill({ color: 0x1a0f06, alpha: 0.22 })
      : new Graphics()
          .ellipse(0, footY, w * 0.52, w * 0.2).fill({ color: 0xc4a06a, alpha: 0.32 })
          .ellipse(0, footY + 2, w * 0.4, w * 0.14).fill({ color: 0xb89058, alpha: 0.18 })
          .ellipse(1, footY + 3, w * 0.3, w * 0.1).fill({ color: 0x2a1808, alpha: 0.16 });
    let texKey = key;
    if (key === "map/yurts") texKey = `prop/yurt${Math.abs(Math.floor(x * 0.13 + y * 0.07)) % 4}`;
    else if (key === "map/village") texKey = (Math.abs(Math.floor(x + y)) % 2 === 0 && this.tex["map/village2"]) ? "map/village2" : "map/village";
    const s = new Sprite(this.t(texKey));
    s.anchor.set(0.5, 0.92);
    s.scale.set(w / Math.max(1, s.texture.width));
    s.label = "img";
    c.addChild(ground, s);
    c.position.set(x, y);
    c.cullable = true;
    this.places.addChild(c);
    let label: Text | undefined;
    if (name) {
      const above = key.startsWith("cities/");
      label = this.label(name, x, above ? y - w * 0.62 : y + w * 0.18, lsize);
      if (above) label.anchor.set(0.5, 1);
      (above ? this.ink : this.labels).addChild(label);
    }
    return { sp: c, x, y, label };
  }

  private barRect: { l: number; r: number; b: number } | null = null;

  /** Üst çubuğun altında kalacak şehir etiketlerini şehrin altına çevirir. */
  private flipLabels(cam: Camera): void {
    const bar = this.barRect;
    this.cityM.forEach((m, i) => {
      const lb = m.label;
      if (!lb) return;
      const w = CITIES[i].id === CAPITAL.id ? MAP_W.cityCap : MAP_W.city;
      const up = m.y - w * 0.62;
      const top = cam.toScreen(m.x, up).y - lb.height * cam.zoom;
      const sx = cam.toScreen(m.x, m.y).x;
      const half = (lb.width * cam.zoom) / 2;
      const hidden = !!bar && top < bar.b + 4 && sx + half > bar.l && sx - half < bar.r;
      if (hidden) {
        lb.anchor.set(0.5, 0);
        lb.position.set(m.x, m.y + w * 0.24);
      } else {
        lb.anchor.set(0.5, 1);
        lb.position.set(m.x, up);
      }
    });
  }

  private buildPlaces(): void {
    CITIES.forEach((c) => {
      const cap = c.id === CAPITAL.id;
      const m = this.place("cities/" + c.id, c.x, c.y, cap ? MAP_W.cityCap : MAP_W.city, CITY_NAME[c.id] + (cap ? " ★" : ""), cap ? 1.25 : 1.05);
      this.cityM.push(m);
    });
    this.buildMarks();
  }

  private markL: { t: Text; x: number; y: number; kind: "sign" | "pass" | "oasis" | "sea"; post?: Graphics }[] = [];

  /** Geçitler, yol işaretleri, vaha ve deniz adları. */
  private buildMarks(): void {
    const w = this.world;
    const add = (kind: "sign" | "pass" | "oasis" | "sea", x: number, y: number, text: string, fill: string, size: number, post?: Graphics) => {
      const t = this.label(text, x, y, size);
      t.style.fill = fill;
      if (kind === "sea") {
        t.style.fontStyle = "italic";
        t.style.letterSpacing = 6;
        t.alpha = 0.75;
        t.anchor.set(0.5, 0.5);
      }
      this.labels.addChild(t);
      this.markL.push({ t, x, y, kind, post });
    };
    for (const sea of w.seas) add("sea", sea.x, sea.y, tr(sea.name), "#cfe8f4", 1.3);
    for (const o of w.oases) {
      // baked canvas’taki düz “Paint” vahayı üstte 3D-ish prop ile ört
      const m = this.place("map/oasis", o.x, o.y, MAP_W.oasis, undefined, 0.6);
      m.sp.zIndex = o.y;
      add("oasis", o.x, o.y + 58, tr(o.name), "#bfe6a0", 0.65);
    }
    for (const p of w.passes) {
      const g = new Graphics();
      g.poly([-16, 8, 0, -16, 16, 8]).fill({ color: 0x6a5a4a, alpha: 0.9 }).stroke({ color: 0xf0e0c0, width: 2 });
      g.poly([-6, -2, 0, -16, 6, -2]).fill({ color: 0xf4f4f4 });
      g.position.set(p.x, p.y);
      this.places.addChild(g);
      add("pass", p.x, p.y + 14, `⛰ ${tr(p.name)}`, "#f0dcb0", 0.75, g);
    }
    for (const s of w.signs) {
      const g = new Graphics();
      g.rect(-1.5, -22, 3, 24).fill(0x5a3a1a);
      const dx = Math.cos(s.a) >= 0 ? 1 : -1;
      g.poly([-12 * dx, -24, 8 * dx, -24, 14 * dx, -19, 8 * dx, -14, -12 * dx, -14]).fill(0xc89a5a).stroke({ color: 0x5a3a1a, width: 1.2 });
      g.position.set(s.x, s.y);
      this.places.addChild(g);
      add("sign", s.x, s.y + 4, `${dx > 0 ? "" : "← "}${CITY_NAME[s.to] ?? s.to}${dx > 0 ? " →" : ""}`, "#f4e0b0", 0.6, g);
    }
  }

  private syncMarks(game: Game, cam: Camera): void {
    const ls = Math.min(2.2, Math.max(0.8, 0.65 / cam.zoom));
    for (const m of this.markL) {
      const seen = m.kind === "sea" || game.isExplored(m.x, m.y);
      const z = m.kind === "sign" ? cam.zoom > 0.6 : m.kind === "sea" ? true : cam.zoom > 0.38;
      m.t.visible = seen && z;
      if (m.post) m.post.visible = seen;
      m.t.scale.set(m.kind === "sea" ? Math.min(3, Math.max(1, 0.8 / cam.zoom)) : ls);
    }
  }

  attachState(game: Game): void {
    const s = game.s;
    if (this.life) {
      this.life.ground.destroy({ children: true });
      this.life.air.destroy({ children: true });
    }
    this.life = new Life(this.world, s.villages, this.glow);
    this.layer.addChildAt(this.life.ground, this.layer.getChildIndex(this.deco));
    this.layer.addChildAt(this.life.air, this.layer.getChildIndex(this.units) + 1);
    // hiyerarşi: şehir(170–210) > kale > köy > kamp > birlik
    this.villageM = s.villages.map((v) => this.place(v.yurt ? "map/yurts" : "map/village", v.x, v.y, v.yurt ? MAP_W.yurt : MAP_W.village, v.name, 0.68));
    this.villageSt = s.villages.map(() => undefined);
    this.campM = s.camps.map((c) => this.place("map/camp", c.x, c.y, MAP_W.camp, c.name, 0.68));
    this.campFires = s.camps.map((c) => {
      const f = new Sprite(this.glow);
      f.anchor.set(0.5);
      f.tint = 0xff6a2a;
      f.width = f.height = 150;
      f.position.set(c.x, c.y);
      f.blendMode = "add";
      this.lights.addChild(f);
      return f;
    });
    this.nodeM = s.nodes.map((n) => this.place("map/" + NODE_SPRITE[n.kind], n.x, n.y, MAP_W.node));
    this.ruinM = s.ruins.map((r) => this.place("map/ruins", r.x, r.y, MAP_W.ruin));
    this.kurganM = s.kurgans.map((k) => this.place("map/kurgan", k.x, k.y, MAP_W.kurgan, `Kurgan Taşı Sv ${k.tier}`, 0.62));
    this.kaleM = s.forts.map((f) => {
      const m = this.place(FORT_TIERS[f.tier].art, f.x, f.y, MAP_W.fort(f.tier), f.name, 0.72);
      const img = m.sp.getChildByLabel("img") as Sprite | null;
      if (img) img.tint = fortTint(f.tier);
      return m;
    });
    this.kaleF = s.forts.map((f) => {
      const fw = MAP_W.fort(f.tier);
      const fl = new Sprite(this.t("tug"));
      fl.anchor.set(0.5, 1);
      fl.scale.set(56 / fl.texture.height);
      fl.position.set(f.x + fw * 0.26, f.y - fw * 0.045);
      this.places.addChild(fl);
      return fl;
    });
    for (const m of [...this.campM]) if (m.label) m.label.style.fill = "#ffb0a0";
    for (const m of this.kurganM) if (m.label) m.label.style.fill = "#e0b8ff";
    this.places.children.sort((a, b) => a.y - b.y);
    this.heroPortrait(game.face());
  }

  private ring(color: number, r: number): Graphics {
    return new Graphics().circle(0, 0, r).fill({ color: 0x1a0f06, alpha: 0.9 }).circle(0, 0, r).stroke({ color, width: 4 });
  }

  private mongolM: Container | null = null;
  private mongolG = new Graphics();
  private burnM = new Map<string, Sprite>();

  /** Moğol tümeni: noyan portresi, çevresinde dönen atlı sürüsü; yanan şehirler kararır ve alev alır. */
  private drawMongol(game: Game, inv: number): void {
    const p = game.mongolPos();
    const g = this.mongolG;
    g.clear();
    if (p) {
      if (!this.mongolM) {
        this.mongolM = this.portrait("heroes/boss_hakan", 22, 0xc0392b);
        const t = new Text({ text: "Moğol Tümeni", style: { ...LABEL_STYLE, fontSize: 14, fill: "#ffb4a0" } });
        t.anchor.set(0.5, 0);
        t.position.set(0, 26);
        t.resolution = 2;
        this.mongolM.addChild(t);
        this.units.addChild(g, this.mongolM);
      }
      this.mongolM.visible = true;
      this.mongolM.position.set(p.x, p.y);
      this.mongolM.scale.set(inv * 1.1);
      for (let i = 0; i < 70; i++) {
        const a = i * 2.39996 + this.time * (i % 2 ? 0.1 : -0.07);
        const r = 30 + Math.sqrt(i / 70) * 62 + Math.sin(this.time * 2 + i) * 3;
        const x = p.x + Math.cos(a) * r * 1.4;
        const y = p.y + Math.sin(a) * r * 0.7 - Math.abs(Math.sin(this.time * 8 + i)) * 1.5;
        g.ellipse(x, y, 3.4, 1.8).fill({ color: 0x2a1a12, alpha: 0.85 });
        g.circle(x + (i % 2 ? 1.6 : -1.6), y - 2.2, 1.1).fill({ color: 0x3a2418 });
      }
      for (let i = 0; i < 8; i++) {
        const a = this.time * 0.5 + i * 0.8;
        g.circle(p.x - 90 + Math.cos(a) * 30 - ((this.time * 20 + i * 15) % 60), p.y + 10 + Math.sin(a * 1.3) * 14, 14 + (i % 3) * 6).fill({ color: 0xc8a878, alpha: 0.12 });
      }
    } else if (this.mongolM) this.mongolM.visible = false;
    const fallen = game.s.mongol?.fallen ?? [];
    CITIES.forEach((c, i) => {
      const burning = fallen.some((f) => f.id === c.id);
      const scarred = !burning && game.cityScarred(c.id);
      const m = this.cityM[i];
      if (m) m.sp.tint = burning ? 0x8a6656 : scarred ? 0xab9684 : 0xffffff;
      let f = this.burnM.get(c.id);
      if (burning && !f) {
        f = new Sprite(this.glow);
        f.anchor.set(0.5);
        f.tint = 0xff5a1a;
        f.blendMode = "add";
        this.units.addChildAt(f, 0);
        this.burnM.set(c.id, f);
      }
      if (f) {
        f.visible = burning;
        if (burning) {
          f.position.set(c.x, c.y - 20);
          f.width = f.height = 200 + Math.sin(this.time * 7 + i) * 18 + Math.sin(this.time * 17) * 8;
          f.alpha = 0.55;
        }
      }
    });
  }

  private portrait(key: string, r: number, color: number): Container {
    const c = new Container();
    c.addChild(this.ring(color, r + 3));
    const s = new Sprite(this.t(key));
    s.anchor.set(0.5);
    const sc = (r * 2.1) / Math.max(s.texture.width, s.texture.height);
    s.scale.set(sc);
    s.label = "face";
    const mask = new Graphics().circle(0, 0, r).fill(0xffffff);
    s.mask = mask;
    c.addChild(mask, s);
    return c;
  }

  heroPortrait(key: string): void {
    const s = this.hero.getChildByLabel("face", true) as Sprite | null;
    if (!s) return;
    s.texture = this.t(key);
    s.scale.set(44 / Math.max(s.texture.width, s.texture.height));
    this.heroFlag.visible = key !== "heroes/slave";
  }

  private syncTamga(t: Tamga | undefined): void {
    const key = t ? `${t.shape}|${t.mark}|${t.color}` : "";
    this.heroTamga.visible = this.heroFlag.visible && !!t;
    if (!t || key === this.tamgaKey) return;
    this.tamgaKey = key;
    const old = this.heroTamga.texture;
    this.heroTamga.texture = Texture.from(tamgaCanvas(t, 64));
    if (old && old !== Texture.EMPTY) old.destroy(true);
    this.heroTamga.width = this.heroTamga.height = 30;
  }

  private gearKey = "";
  private gearG = new Graphics();
  private gearWeap = new Sprite();
  private gearSet = 0;

  /** Kuşanılan zırhın nadirliği halkayı boyar, silah rozet olur, iki set parçası parıltı verir. */
  private syncGear(game: Game): void {
    const s = game.s;
    const eq = s.hero.equip;
    const top = Math.max(-1, ...[eq.zirh, eq.silah, eq.kalkan].map((it) => (it ? it.rar : -1)));
    const plus = Math.max(0, ...[eq.zirh, eq.silah].map((it) => it?.plus ?? 0));
    const sets = Object.values(eq).filter((it) => it?.set).length;
    const key = s.free ? `${top}|${plus}|${sets}|${eq.silah?.icon ?? ""}` : "";
    if (key !== this.gearKey) {
      this.gearKey = key;
      this.gearSet = sets;
      const g = this.gearG.clear();
      if (key && top >= 1) {
        const col = parseInt(RARITY[top].color.slice(1), 16);
        g.circle(0, 0, 27).stroke({ color: col, width: 3 + Math.min(3, plus * 0.4), alpha: 0.95 });
        if (plus >= 5) g.circle(0, 0, 31).stroke({ color: col, width: 1.5, alpha: 0.6 });
      }
      const wi = s.free && eq.silah && (this.tex[eq.silah.icon] || this.tex["icons/" + eq.silah.icon]) ? eq.silah.icon : "";
      this.gearWeap.visible = !!wi;
      if (wi) {
        this.gearWeap.texture = this.t(wi);
        this.gearWeap.scale.set(22 / Math.max(1, this.gearWeap.texture.width, this.gearWeap.texture.height));
      }
    }
    this.gearG.alpha = this.gearSet >= 2 ? 0.75 + 0.25 * Math.sin(this.time * 4) : 1;
  }

  private buildHero(): void {
    const c = new Container();
    // temas gölgesi — uçan siyah disk değil
    const sh = new Graphics()
      .ellipse(0, 38, 28, 9).fill({ color: 0xc9a46a, alpha: 0.3 })
      .ellipse(1, 39, 22, 6).fill({ color: 0x2a1808, alpha: 0.22 });
    const flag = new Sprite(this.t("tug"));
    flag.anchor.set(0.5, 1);
    flag.scale.set(42 / flag.texture.height);
    flag.position.set(20, -6);
    const p = this.portrait("heroes/hero1", 14, 0xffd56a);
    this.heroCount = new Text({ text: "0", style: { ...LABEL_STYLE, fontSize: 20 } });
    this.heroCount.anchor.set(0.5, 0);
    this.heroCount.position.set(0, 44);
    this.heroCount.resolution = 2;
    this.heroBars = new Graphics();
    this.heroTamga = new Sprite();
    this.heroTamga.anchor.set(0.5);
    this.heroTamga.position.set(26, -36);
    this.heroHorse = new Sprite();
    this.heroHorse.anchor.set(0.5, 0.8);
    this.heroHorse.position.set(-4, 30);
    this.heroHorse.visible = false;
    this.gearWeap.anchor.set(0.5);
    this.gearWeap.position.set(-18, 10);
    this.gearWeap.visible = false;
    const badge = new Container();
    // rozet küçük — asıl görünüm figür; portre baskın olmasın
    badge.addChild(flag, this.heroTamga, p, this.gearG, this.gearWeap);
    badge.position.set(0, -56);
    badge.scale.set(0.46);
    this.heroBadge = badge;
    this.heroFig = new Fig(figureFrames("sword", HERO_STYLE), 44);
    this.heroFig.position.set(0, 28);
    sh.position.set(0, 4);
    c.addChild(sh, this.heroHorse, this.heroFig, badge, this.heroCount, this.heroBars);
    this.heroFlag = flag;
    this.hero = c;
    this.units.addChild(this.dustG);
    this.units.addChild(this.troops);
    this.units.addChild(c);
  }

  private scarG = new Graphics();
  private scarAirG = new Graphics();
  private lvAt = -99;
  private craftAt = -99;
  private craftCol = 0xffd56a;

  levelUpFx(): void {
    this.lvAt = this.time;
  }

  /** Örs/nadirlik/set tamamlanma: kahraman etrafında renkli kıvılcım. */
  craftBurst(color = 0xffd56a): void {
    this.craftAt = this.time;
    this.craftCol = color;
  }

  /** Taze savaş yerleri: kararmış toprak, tüten duman, dönen leş kargaları; üç günde silinir. */
  private drawScars(game: Game): void {
    const g = this.scarG.clear();
    const air = this.scarAirG.clear();
    const s = game.s;
    if (!s.scars?.length) return;
    const life = DAY_SEC * 3;
    s.scars = s.scars.filter((c) => s.time - c.t < life);
    for (const [i, c] of s.scars.entries()) {
      if (!game.isExplored(c.x, c.y)) continue;
      const age = (s.time - c.t) / life;
      const fade = 1 - age * age;
      const r = 26 + Math.min(40, Math.sqrt(c.n) * 4);
      g.ellipse(c.x, c.y + 6, r, r * 0.45).fill({ color: 0x2a1a0c, alpha: 0.32 * fade });
      g.ellipse(c.x - r * 0.3, c.y + 4, r * 0.45, r * 0.18).fill({ color: 0x1a0e06, alpha: 0.28 * fade });
      for (let k = 0; k < 5; k++) {
        const a = i * 2.3 + k * 1.7;
        g.rect(c.x + Math.cos(a) * r * 0.7, c.y + 6 + Math.sin(a) * r * 0.3, 3, 1.5).fill({ color: 0x5a4632, alpha: 0.7 * fade });
      }
      if (age < 0.6) {
        for (let k = 0; k < 6; k++) {
          const ph = (this.time * 0.35 + k / 6 + i * 0.13) % 1;
          const sx = c.x + Math.sin(ph * 5 + k) * 5 + ph * 14;
          air.circle(sx, c.y - ph * 70, 6 + ph * 16).fill({ color: 0x4a4540, alpha: 0.4 * (1 - ph) * (1 - age / 0.6) });
        }
      }
      if (c.w) {
        const fx = c.x + r * 0.4, fy = c.y + 2, wv = Math.sin(this.time * 4 + i) * 2;
        const pr = (this.time * 0.8 + i * 0.3) % 1;
        air.ellipse(c.x, c.y + 6, r + 6 + pr * 30, (r + 6 + pr * 30) * 0.45).stroke({ color: 0xfff0c8, width: 3, alpha: 0.7 * (1 - pr) });
        air.rect(fx - 1.2, fy - 44, 2.4, 44).fill({ color: 0x3a2410 });
        air.poly([fx + 1, fy - 44, fx + 24, fy - 40 + wv, fx + 22, fy - 31 + wv, fx + 1, fy - 30]).fill({ color: 0xf2e6c8 });
        air.poly([fx + 1, fy - 44, fx + 24, fy - 40 + wv, fx + 23, fy - 37 + wv, fx + 1, fy - 40]).fill({ color: 0xc8302a });
        air.ellipse(c.x - 8, c.y + 8, 7, 3).fill({ color: 0x6a4a2a, alpha: 0.9 });
        air.ellipse(c.x + 6, c.y + 12, 7, 3).fill({ color: 0x6a4a2a, alpha: 0.9 });
      }
      const crows = c.n >= 20 ? 4 : 2;
      for (let k = 0; k < crows; k++) {
        const a = this.time * (0.7 + k * 0.13) + (k * Math.PI * 2) / crows + i;
        const cx = c.x + Math.cos(a) * (r + 10), cy = c.y - 50 + Math.sin(a) * (r + 10) * 0.35;
        const fl = Math.sin(this.time * 9 + k * 2) * 3;
        air.moveTo(cx - 7, cy - fl).lineTo(cx, cy + 1).lineTo(cx + 7, cy - fl).stroke({ color: 0x140c08, width: 2.2, alpha: 0.9 * fade });
      }
    }
  }

  private birdC: Container | null = null;
  private birdKind = "";

  private drawBird(game: Game, inv: number): void {
    const b = game.s.bird;
    if (!b) {
      this.birdC?.destroy({ children: true });
      this.birdC = null;
      return;
    }
    if (!this.birdC || this.birdKind !== b.kind) {
      this.birdC?.destroy({ children: true });
      const c = new Container();
      const sh = new Graphics().ellipse(0, 0, 14, 5).fill({ color: 0x000000, alpha: 0.32 });
      sh.label = "sh";
      const sp = new Sprite(this.t("bird_" + b.kind));
      sp.anchor.set(0.5);
      sp.scale.set(48 / Math.max(sp.texture.width, sp.texture.height));
      sp.label = "sp";
      c.addChild(sh, sp);
      this.units.addChild(c);
      this.birdC = c;
      this.birdKind = b.kind;
    }
    const c = this.birdC;
    const f = game.birdFly;
    const h = game.s.hero;
    const sp = c.getChildByLabel("sp") as Sprite;
    const sh = c.getChildByLabel("sh")!;
    let x: number, y: number, lift: number;
    if (f) {
      x = f.x;
      y = f.y;
      lift = 46;
      sp.scale.x = Math.abs(sp.scale.x) * ((f.back ? h.x - f.x : f.tx - f.x) < 0 ? 1 : -1);
    } else {
      const a = this.time * 1.3;
      x = h.x + Math.cos(a) * 34;
      y = h.y + Math.sin(a) * 14;
      lift = 52 + Math.sin(this.time * 2.1) * 4;
      sp.scale.x = Math.abs(sp.scale.x) * (Math.sin(a) > 0 ? 1 : -1);
    }
    c.position.set(x, y);
    c.scale.set(inv);
    sp.y = -lift;
    sp.scale.y = Math.abs(sp.scale.x) * (1 + Math.sin(this.time * 14) * 0.08);
    sh.alpha = f ? 0.6 : 1;
    c.visible = game.isExplored(x, y);
    c.zIndex = y;
  }

  private walkPrev = new Map<string, { x: number; y: number; m: number; d: number }>();

  /** Haritadaki birlik yürürken zıplar ve sallanır; durunca yavaşça durulur. */
  private walk(key: string, c: Container, x: number, y: number, dt: number, seed: number, amp = 1): { v: number; dir: number } {
    const p = this.walkPrev.get(key);
    const v = p && dt > 0 ? Math.hypot(x - p.x, y - p.y) / dt : 0;
    const m = p ? p.m + ((v > 3 ? 1 : 0) - p.m) * Math.min(1, dt * 6) : 0;
    const dir = p && Math.abs(x - p.x) > 0.01 ? Math.sign(x - p.x) : p?.d ?? 1;
    if (this.walkPrev.size > 600) this.walkPrev.clear();
    this.walkPrev.set(key, { x, y, m, d: dir });
    const ph = this.time * 10 + seed * 1.7;
    c.position.set(x, y - Math.abs(Math.sin(ph)) * 3.5 * m * amp);
    c.rotation = Math.sin(ph) * 0.07 * m * amp;
    return { v, dir };
  }

  marker(x: number, y: number): void {
    this.mark = { x, y, t: 0 };
  }

  // ---------- gemiler ----------

  private shipC = new Container();
  private shipPool: Sprite[] = [];
  private nestM: Sprite[] = [];
  private waterSpot = new Map<string, { x: number; y: number }>();

  private isWater(x: number, y: number): boolean {
    const gx = Math.floor(x / 4);
    const gy = Math.floor(y / 4);
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
    return this.world.height[gy * GW + gx] < -0.02;
  }

  /** Limana en yakın açık su. */
  private dock(city: string): { x: number; y: number } {
    const hit = this.waterSpot.get(city);
    if (hit) return hit;
    const c = CITIES.find((k) => k.id === city)!;
    let best = { x: c.x, y: c.y };
    search: for (let r = 40; r < 900; r += 20) {
      const n = Math.round(r / 6);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const x = c.x + Math.cos(a) * r;
        const y = c.y + Math.sin(a) * r;
        if (this.isWater(x, y) && this.isWater(x + Math.cos(a) * 30, y + Math.sin(a) * 30)) {
          best = { x: x + Math.cos(a) * 30, y: y + Math.sin(a) * 30 };
          break search;
        }
      }
    }
    this.waterSpot.set(city, best);
    return best;
  }

  private drawShips(game: Game, dt: number): void {
    const s = game.s;
    if (!this.shipC.parent) this.units.addChild(this.shipC);
    void dt;
    let used = 0;
    const ship = (key: string, x: number, y: number, dir: number, size: number, seed: number, alpha = 1) => {
      if (!game.isExplored(x, y)) return;
      let sp = this.shipPool[used];
      if (!sp) {
        sp = new Sprite();
        sp.anchor.set(0.5, 0.78);
        this.shipC.addChild(sp);
        this.shipPool.push(sp);
      }
      used++;
      const tx = this.t(key);
      if (sp.texture !== tx) sp.texture = tx;
      const k = size / Math.max(1, tx.width);
      sp.scale.set(k * (dir < 0 ? 1 : -1), k);
      sp.position.set(x, y + Math.sin(this.time * 1.8 + seed) * 2.2);
      sp.rotation = Math.sin(this.time * 1.3 + seed * 1.7) * 0.045;
      sp.alpha = alpha;
      sp.visible = true;
      sp.zIndex = y;
      this.fxG.ellipse(x, y + 4, size * 0.42, size * 0.09).stroke({ color: 0xffffff, width: 2, alpha: 0.28 });
      const wk = (this.time * 0.9 + seed) % 1;
      this.fxG.ellipse(x + dir * -size * (0.35 + wk * 0.5), y + 6, size * (0.12 + wk * 0.2), size * (0.03 + wk * 0.04)).stroke({ color: 0xffffff, width: 1.6, alpha: 0.35 * (1 - wk) });
    };
    const vy = s.fleet.voyage;
    if (vy) {
      const pts = seaPath(vy.from, vy.to, W, H);
      const p = alongPath(pts, (s.time - vy.at) / vy.dur);
      const n = Math.max(1, Math.min(3, s.fleet.ships));
      for (let i = 0; i < n; i++) ship("map/ship", p.x - p.dx * i * 70, p.y + i * 22, p.dx, 110 - i * 8, i);
    } else if (s.fleet.ships > 0) {
      PORTS.forEach((pt, j) => {
        const d = this.dock(pt.city);
        for (let i = 0; i < Math.min(2, s.fleet.ships); i++) ship("map/ship", d.x + i * 46, d.y + i * 16, 1, 84, j * 3 + i);
      });
    }
    const lanes: [string, string, number][] = [["tabriz", "rey", 0], ["rey", "bukhara", 0.37], ["tabriz", "bukhara", 0.71], ["tabriz", "constantinople", 0.2], ["tabriz", "constantinople", 0.66]];
    lanes.forEach(([a, b, off], i) => {
      const pts = seaPath(a, b, W, H);
      const ph = (this.time / (90 + i * 13) + off) % 2;
      const k = ph < 1 ? ph : 2 - ph;
      const p = alongPath(pts, 0.08 + k * 0.84);
      ship(i % 3 === 2 ? "map/ship_pirate" : "map/ship", p.x + 40, p.y - 30 + i * 8, ph < 1 ? p.dx : -p.dx, 80, i * 5.3, 0.95);
    });
    for (let i = used; i < this.shipPool.length; i++) this.shipPool[i].visible = false;
    if (!this.nestM.length) {
      for (const [nx, ny] of [[0.408, 0.27], [0.205, 0.335]] as [number, number][]) {
        const sp = new Sprite(this.t("map/pirate_nest"));
        sp.anchor.set(0.5, 0.75);
        sp.scale.set(150 / Math.max(1, sp.texture.width));
        sp.position.set(nx * W, ny * H);
        this.shipC.addChild(sp);
        this.nestM.push(sp);
      }
    }
    const calm = (s.fleet.calm ?? 0) > s.time;
    for (const sp of this.nestM) {
      sp.visible = game.isExplored(sp.x, sp.y);
      sp.alpha = calm ? 0.45 : 1;
      if (!calm && sp.visible) {
        const pr = (this.time * 0.5 + sp.x * 0.001) % 1;
        this.fxG.circle(sp.x, sp.y - 30, 40 + pr * 40).stroke({ color: 0xff5a3c, width: 3, alpha: 0.4 * (1 - pr) });
      }
    }
  }

  // ---------- bölge bossları ----------

  private denM: { c: Container; label: Text; timer: Text }[] = [];

  private drawDens(game: Game, inv: number): void {
    const s = game.s;
    if (!this.denM.length) {
      AREA_BOSSES.forEach((b, i) => {
        const p = game.denPos(i);
        const c = new Container();
        const aura = new Graphics();
        aura.label = "aura";
        const port = this.portrait(b.icon, 30, 0xff4a3a);
        port.position.set(0, -44);
        const base = new Sprite(this.t("map/kurgan"));
        base.anchor.set(0.5, 0.8);
        base.scale.set(70 / Math.max(1, base.texture.width));
        base.tint = 0x9a7060;
        const label = new Text({ text: b.lairName, style: { ...LABEL_STYLE, fontSize: 18, fill: "#ffb0a0" } });
        label.anchor.set(0.5, 0);
        label.position.set(0, 16);
        label.resolution = 2;
        const timer = new Text({ text: "", style: { ...LABEL_STYLE, fontSize: 16, fill: "#e8d8c0" } });
        timer.anchor.set(0.5, 0);
        timer.position.set(0, 42);
        timer.resolution = 2;
        c.addChild(aura, base, port, label, timer);
        c.position.set(p.x, p.y);
        this.places.addChild(c);
        this.denM.push({ c, label, timer });
      });
    }
    this.denM.forEach((m, i) => {
      const p = game.denPos(i);
      const vis = s.free && game.isExplored(p.x, p.y);
      m.c.visible = vis;
      if (!vis) return;
      const alive = game.denAlive(i);
      m.c.scale.set(Math.max(0.8, inv * 0.9));
      m.c.alpha = alive ? 1 : 0.55;
      const aura = m.c.getChildByLabel("aura") as Graphics;
      aura.clear();
      if (alive) {
        const pr = (this.time * 0.55 + i * 0.17) % 1;
        aura.circle(0, -44, 36 + pr * 34).stroke({ color: 0xff4a3a, width: 4, alpha: 0.7 * (1 - pr) });
        aura.circle(0, -44, 34 + Math.sin(this.time * 3 + i) * 3).fill({ color: 0xff3a20, alpha: 0.16 });
        m.timer.text = `${AREA_BOSSES[i].name} · ${tr("Bölge bossu")}`;
      } else {
        const mm = Math.ceil(game.denLeft(i) / 60000);
        m.timer.text = `${AREA_BOSSES[i].name} · ⏳ ${mm} ${tr("dk")}`;
      }
    });
  }

  private caravan(id: number, color: number): Container {
    let c = this.caravansM.get(id);
    if (c) return c;
    c = new Container();
    const sh = new Graphics()
      .ellipse(0, 20, 18, 5.6).fill({ color: 0x000000, alpha: 0.12 })
      .ellipse(0, 20, 13, 4).fill({ color: 0x000000, alpha: 0.16 })
      .ellipse(0, 20, 7, 2.4).fill({ color: 0x000000, alpha: 0.2 });
    const p = this.portrait("j_caravan", 16, color);
    const ex = new Text({ text: "⚔", style: { ...LABEL_STYLE, fontSize: 22, fill: "#ff5a3c" } });
    ex.anchor.set(0.5, 1);
    ex.position.set(0, -18);
    ex.label = "ex";
    c.addChild(sh, p, ex);
    this.units.addChild(c);
    this.caravansM.set(id, c);
    return c;
  }

  private bandit(id: number, posse = false, nem = "", x = 0, y = 0): Container {
    let c = this.bandits.get(id);
    if (c) return c;
    c = new Container();
    const reg = regionAt(x, y);
    const st: FigStyle = posse ? { coat: "#2a4a8a", trim: "#d8d8e8", hat: "migfer", hatCol: "#a0a0b0", horse: "#5a3a20" } : nem ? { ...REGION_STYLE[reg.id], cape: "#4a1a6a" } : REGION_STYLE[reg.id];
    const horsey = posse || reg.mix[2] >= 0.4;
    const kinds: FigKind[] = horsey ? ["rider", reg.mix[1] >= 0.3 ? "horsearcher" : "rider"] : ["spear", reg.mix[1] >= 0.4 ? "archer" : "sword"];
    const figs = new Container();
    figs.label = "figs";
    kinds.forEach((k, i) => {
      const f = new Fig(figureFrames(k, st), k === "rider" || k === "horsearcher" ? 46 : 40);
      f.position.set(i ? -12 : 8, i ? 10 : 14);
      figs.addChild(f);
    });
    // figürler zaten gölge taşıyor; ekstra uçan disk yok
    c.addChild(figs);
    // rozet sadece nemesis’te — normal haydutlarda çöp-adam + ikon karmaşası olmasın
    if (nem) {
      const p = this.portrait("j_bandit", 22, 0xa64dff);
      p.scale.set(0.7);
      p.position.set(0, -56);
      const glow = new Graphics().circle(0, -56, 28).fill({ color: 0xa64dff, alpha: 0.2 });
      glow.label = "glow";
      c.addChild(glow, p);
      const nl = new Text({ text: nem, style: { ...LABEL_STYLE, fontSize: 14, fill: "#e6c4ff" } });
      nl.anchor.set(0.5, 0);
      nl.position.set(0, 52);
      nl.resolution = 2;
      c.addChild(nl);
    } else if (posse) {
      const ring = new Graphics().circle(0, -48, 10).stroke({ color: 0x4a8cff, width: 3, alpha: 0.85 });
      c.addChild(ring);
    }
    const t = new Text({ text: "", style: { ...LABEL_STYLE, fontSize: 18, fill: "#ffc4b4" } });
    t.anchor.set(0.5, 0);
    t.position.set(0, 42);
    t.resolution = 2;
    t.label = "count";
    const ex = new Text({ text: "!", style: { ...LABEL_STYLE, fontSize: 28, fill: "#ff5a3c" } });
    ex.anchor.set(0.5, 1);
    ex.position.set(0, -62);
    ex.label = "ex";
    c.addChild(t, ex);
    this.units.addChild(c);
    this.bandits.set(id, c);
    return c;
  }

  private march(id: number): Container {
    let c = this.marchesM.get(id);
    if (c) return c;
    c = new Container();
    const p = this.portrait("soldier", 14, 0x7fd36a);
    const t = new Text({ text: "", style: { ...LABEL_STYLE, fontSize: 13, fill: "#d4ffc4" } });
    t.anchor.set(0.5, 0);
    t.position.set(0, 16);
    t.resolution = 2;
    t.label = "txt";
    c.addChild(p, t);
    this.units.addChild(c);
    this.marchesM.set(id, c);
    return c;
  }

  update(dt: number, game: Game, cam: Camera): void {
    const s = game.s;
    this.time += dt;
    this.terrain?.tick(dt, game.season());
    const h = s.hero;
    const moving = !!h.path;
    this.hero.position.set(h.x, h.y);
    const n = armySize(h.army);
    this.heroCount.text = n > 0 ? String(n) : "";
    this.syncTamga(s.free ? s.tamga : undefined);
    const inv = Math.min(2.0, Math.max(0.7, 0.85 / cam.zoom));
    // orta bant: zoom’dan bağımsız ~okunur silüet; şehir(170–210) hâlâ büyük
    const unitInv = Math.min(1.35, Math.max(0.75, 0.95 / cam.zoom));
    this.hero.scale.set(unitInv);
    const lx = this.trail[this.trail.length - 2];
    if (lx !== undefined && Math.abs(h.x - lx) > 0.05) this.face = h.x > lx ? 1 : -1;
    const hk = s.free ? h.equip.at?.icon ?? "" : "";
    if (hk !== this.horseKey) {
      this.horseKey = hk;
      this.heroHorse.visible = false;
      const st: FigStyle = { ...HERO_STYLE, horse: hk === "mount_3" ? "#e8e0d0" : hk === "mount_2" ? "#5a3418" : "#8a7a6a" };
      this.heroFig.setFrames(figureFrames(hk ? "rider" : "sword", st));
      this.heroFig.size = hk ? 48 : 44;
    }
    this.heroFig.tick(dt, moving ? game.heroSpeed() : 0, this.face, hk ? 1.25 : 1);
    this.heroBadge.y = -50 - (moving ? Math.abs(Math.sin(this.time * 9)) * 1.5 : 0);
    this.syncGear(game);
    this.dustAcc += moving && s.free ? dt : 0;
    while (this.dustAcc > 0.07) {
      this.dustAcc -= 0.07;
      this.dust.push({ x: h.x - this.face * 12 * inv + (Math.random() - 0.5) * 10 * inv, y: h.y + 24 * inv, t: 0 });
    }
    this.dustG.clear();
    for (const d of this.dust) {
      d.t += dt;
      const k = d.t / 0.9;
      if (k >= 1) continue;
      this.dustG.circle(d.x - this.face * k * 10 * inv, d.y - k * 8 * inv, (4 + k * 9) * inv).fill({ color: 0xd8c08a, alpha: 0.38 * (1 - k) });
    }
    this.dust = this.dust.filter((d) => d.t < 0.9);
    this.trail.push(h.x, h.y);
    if (this.trail.length > 400) this.trail.splice(0, this.trail.length - 400);
    this.drawBird(game, inv);
    this.drawMongol(game, inv);
    this.drawScars(game);
    s.comps.forEach((id, i) => {
      let c = this.compM.get(id);
      if (!c) {
        c = this.portrait("companions/" + id, 12, 0x8fe07a);
        this.units.addChildAt(c, 0);
        this.compM.set(id, c);
      }
      const back = Math.max(0, this.trail.length - 2 - (i + 1) * 18 * 2);
      const tx = this.trail[back] ?? h.x;
      const ty = this.trail[back + 1] ?? h.y;
      const escorting = id === s.escort;
      const fx = escorting ? h.x + this.face * 30 : Math.hypot(tx - h.x, ty - h.y) < 8 ? h.x - 26 + i * 26 : tx;
      const fy = escorting ? h.y - 2 : Math.hypot(tx - h.x, ty - h.y) < 8 ? h.y + 30 : ty;
      c.position.set(c.x + (fx - c.x) * Math.min(1, dt * (escorting ? 9 : 6)), c.y + (fy - c.y) * Math.min(1, dt * (escorting ? 9 : 6)) - (moving ? Math.abs(Math.sin(this.time * 9 + i)) * 2 : 0));
      c.scale.set(escorting ? inv * 1.1 : inv);
    });
    const ar = h.army;
    const tot = armySize(ar);
    const figs = Math.min(10, Math.ceil(tot / 4));
    const kinds: FigKind[] = [];
    if (figs > 0) {
      const nh = Math.round((ar.horse / tot) * figs);
      const na = Math.round((ar.archer / tot) * figs);
      for (let k = 0; k < figs; k++) kinds.push(k < nh ? "rider" : k < nh + na ? "archer" : "spear");
    }
    while (this.troops.children.length > figs) this.troops.children[this.troops.children.length - 1].destroy();
    while (this.troops.children.length < figs) {
      const f = new Container();
      const sp = new Fig(figureFrames("spear", TROOP_STYLE), 32);
      sp.label = "fig";
      f.addChild(sp);
      f.position.set(h.x, h.y);
      this.troops.addChild(f);
    }
    const unitOf: Record<FigKind, "spear" | "archer" | "horse"> = { spear: "spear", archer: "archer", rider: "horse", sword: "spear", horsearcher: "horse" };
    this.troops.children.forEach((f, k) => {
      const sp = (f as Container).getChildByLabel("fig") as Fig;
      const lv = s.drill?.[unitOf[kinds[k]]]?.lv ?? 0;
      const st: FigStyle = lv >= 4 ? { ...TROOP_STYLE, coat: "#2a3a6a", trim: "#f0d070", cape: "#c8a040", hatCol: "#d8d8e8" } : lv >= 3 ? { ...TROOP_STYLE, cape: "#5a1a12", trim: "#f0c860" } : lv >= 1 ? TROOP_STYLE : { ...TROOP_STYLE, hat: "bork", hatCol: "#5a3a1e" };
      sp.setFrames(figureFrames(kinds[k], st));
      sp.size = kinds[k] === "rider" ? 36 : 32;
      const pdx = f.x;
      const row = Math.floor(k / 3);
      const col = (k % 3) - 1;
      const back = Math.max(0, this.trail.length - 2 - (8 + row * 10) * 2);
      const bx = this.trail[back] ?? h.x;
      const by = this.trail[back + 1] ?? h.y;
      const idle = Math.hypot(bx - h.x, by - h.y) < 6;
      const ox = idle ? h.x + (col * 26 + (row % 2) * 13) * unitInv : bx + col * 16 * unitInv;
      const oy = idle ? h.y + (42 + row * 18) * unitInv : by + col * 7 * unitInv;
      f.x += (ox - f.x) * Math.min(1, dt * 5);
      f.y += (oy - f.y) * Math.min(1, dt * 5);
      const vx = dt > 0 ? (f.x - pdx) / dt / unitInv : 0;
      sp.tick(dt, moving ? Math.max(Math.abs(vx), game.heroSpeed() * 0.8) : 0, Math.abs(vx) > 2 ? Math.sign(vx) : this.face, kinds[k] === "rider" ? 1.25 : 1);
      f.scale.set(unitInv);
      f.visible = s.free;
    });
    if (s.story.fort && !this.fortM) {
      this.fortM = this.place("map/castle", s.story.fort.x, s.story.fort.y, MAP_W.storyCastle, "Kara Tamga Kalesi", 1);
      if (this.fortM.label) this.fortM.label.style.fill = "#ff8a8a";
    }
    if (this.fortM) {
      this.fortM.sp.visible = !s.story.done;
      if (this.fortM.label) this.fortM.label.visible = !s.story.done;
    }
    if (s.act2.gate && !this.gateM) {
      this.gateM = this.place("map/erlik_gate", s.act2.gate.x, s.act2.gate.y, MAP_W.gate, "Erlik'in Kapısı", 1);
      if (this.gateM.label) this.gateM.label.style.fill = "#d9a3ff";
    }
    if (this.gateM) {
      this.gateM.sp.alpha = s.act2.done ? 0.45 : 1;
      if (this.gateM.label) this.gateM.label.text = s.act2.done ? "Mühürlü Kapı" : "Erlik'in Kapısı";
    }
    if (s.otag) {
      if (!this.otagM) {
        this.otagM = this.place("map/yurts", s.otag.x, s.otag.y, MAP_W.otag, "Ak Otağ", 0.9);
        if (this.otagM.label) this.otagM.label.style.fill = "#ffe08a";
      }
      if (this.otagM.x !== s.otag.x || this.otagM.y !== s.otag.y) {
        this.otagM.x = s.otag.x;
        this.otagM.y = s.otag.y;
        this.otagM.sp.position.set(s.otag.x, s.otag.y);
        this.otagM.label?.position.set(s.otag.x, s.otag.y + MAP_W.otag * 0.18);
      }
    }
    const bk = s.boy?.at ? `${s.boy.id}|${s.boy.step}|${s.boy.at.x | 0}` : "";
    if (bk !== this.boyK) {
      this.boyK = bk;
      if (this.boyM) {
        this.boyM.sp.destroy({ children: true });
        this.boyM.label?.destroy();
        this.boyM = null;
      }
      const st = s.boy && boyOf(s.boy.id)?.steps[s.boy.step];
      if (st && s.boy?.at) {
        this.boyM = this.place(st.img, s.boy.at.x, s.boy.at.y, MAP_W.boy, st.place, 0.85);
        this.boyM.sp.tint = 0xffe0b0;
        if (this.boyM.label) this.boyM.label.style.fill = "#ffcf7a";
      }
    }
    if (s.act3.peak && !this.peakM) {
      this.peakM = this.place("map/ruins", s.act3.peak.x, s.act3.peak.y, MAP_W.peak, "Tengri Dağı", 1);
      this.peakM.sp.tint = 0xbfe4ff;
      if (this.peakM.label) this.peakM.label.style.fill = "#9fdcff";
    }
    if (s.free && !this.kipM) {
      this.kipM = game.kipPois().map((p) => {
        const [key, w, name, tint, col] = p.kind === "horde" ? ["map/yurts", MAP_W.kipHorde, "Kıpçak Ordası", 0xffe0b0, "#ffcf7a"] as const : p.kind === "fort" ? ["map/castle", MAP_W.kipFort, "Kara Kıpçak Ordugâhı", 0xd09080, "#ff9a8a"] as const : ["map/kurgan", MAP_W.kurgan, "Taş Baba", 0xc8d4e0, "#d8e4ee"] as const;
        const m = this.place(key, p.x, p.y, w, tr(name), p.kind === "stone" ? 0.6 : 0.85);
        m.sp.tint = tint;
        if (m.label) m.label.style.fill = col;
        return m;
      });
    }
    if (this.kipM && s.kip) {
      const k = s.kip;
      game.kipPois().forEach((p, i) => {
        const m = this.kipM![i];
        const dim = p.kind === "fort" ? k.fort : p.kind === "stone" ? k.stones.includes(p.n) : false;
        m.sp.alpha = dim ? 0.5 : 1;
      });
    }
    const hb = this.heroBars;
    hb.clear();
    const kut = s.beylik ? s.kut ?? 50 : 50;
    if (kut >= 75 || kut <= 20) {
      const good = kut >= 75;
      const p = (this.time * 0.7) % 1;
      hb.circle(0, 4, 30 + p * 26).stroke({ color: good ? 0xffd86a : 0x5a2a6a, width: 3, alpha: (good ? 0.55 : 0.65) * (1 - p) });
      for (let i = 0; i < 6; i++) {
        const a = this.time * (good ? 1.2 : -0.8) + (i * Math.PI) / 3;
        hb.circle(Math.cos(a) * 30, 4 + Math.sin(a) * 12 - (good ? (this.time * 20 + i * 7) % 20 : 0), good ? 2.4 : 3.2).fill({ color: good ? 0xfff0a0 : 0x3a1a4a, alpha: 0.8 });
      }
    }
    const hpK = Math.max(0, Math.min(1, h.hp / game.maxHp()));
    if (hpK < 0.999) {
      hb.rect(-22, -72, 44, 5).fill({ color: 0x000000, alpha: 0.6 });
      hb.rect(-22, -72, 44 * hpK, 5).fill(hpK > 0.5 ? 0x7fd36a : hpK > 0.25 ? 0xffd56a : 0xff5a3c);
    }
    if (game.act) {
      const k = game.act.t / game.act.dur;
      hb.arc(0, -50, 19, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2).stroke({ color: 0xffe08a, width: 5 });
    }

    this.pathG.clear();
    if (h.path) {
      let px = h.x;
      let py = h.y;
      for (let k = h.pathI; k < h.path.length; k += 2) {
        const x = h.path[k];
        const y = h.path[k + 1];
        const d = Math.hypot(x - px, y - py);
        const n = Math.floor(d / 14);
        for (let j = 1; j <= n; j++) this.pathG.circle(px + ((x - px) * j) / n, py + ((y - py) * j) / n, 3.2);
        px = x;
        py = y;
      }
      this.pathG.fill({ color: 0xffe08a, alpha: 0.85 });
    }
    for (const m of s.marches) {
      if (m.phase === "gather") continue;
      for (let k = m.pathI; k < m.path.length; k += 6) this.pathG.circle(m.path[k], m.path[k + 1], 2.4);
    }
    this.pathG.fill({ color: 0x9be38a, alpha: 0.7 });

    // Kendi kervanlarımın rotası: aktif seferdeyken şehirler arası kesik çizgi.
    for (const mc of s.mycv ?? []) {
      if (mc.status !== "yol") continue;
      const a = CITIES.find((x) => x.id === mc.from);
      const b = CITIES.find((x) => x.id === mc.to);
      if (!a || !b || !(game.isExplored(a.x, a.y) || game.isExplored(b.x, b.y))) continue;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(1, Math.min(70, Math.round(d / 28)));
      for (let j = 0; j <= n; j++) if (j % 3 !== 2) this.pathG.circle(a.x + ((b.x - a.x) * j) / n, a.y + ((b.y - a.y) * j) / n, 2.1);
    }
    this.pathG.fill({ color: 0xffd56a, alpha: 0.55 });

    const live = new Set<number>();
    for (const b of s.bandits) {
      live.add(b.id);
      const nm = b.nem ? s.nemeses.find((n) => n.id === b.nem) : undefined;
      const c = this.bandit(b.id, b.posse, nm ? nemName(nm) : "", b.x, b.y);
      const glow = c.getChildByLabel("glow");
      if (glow) glow.scale.set(1 + Math.sin(this.time * 4) * 0.12);
      const vis = game.isExplored(b.x, b.y);
      c.visible = vis;
      const mv = this.walk("b" + b.id, c, b.x, b.y, dt, b.id, 0.25);
      if (vis) for (const f of (c.getChildByLabel("figs") as Container).children) (f as Fig).tick(dt, mv.v, mv.dir, b.chase ? 1.4 : 1);
      c.scale.set(unitInv * 0.88);
      (c.getChildByLabel("count") as Text).text = String(armySize(b.army));
      const ex = c.getChildByLabel("ex")!;
      ex.visible = b.chase;
      ex.y = -58 - Math.abs(Math.sin(this.time * 6)) * 4;
    }
    if (cam.zoom < 0.55) {
      const cell = 120 / cam.zoom;
      const groups = new Map<string, { lead: Container; n: number; total: number; best: number }>();
      for (const b of s.bandits) {
        const c = this.bandits.get(b.id)!;
        if (!c.visible || b.nem || b.posse || b.chase) continue;
        const key = `${Math.floor(b.x / cell)},${Math.floor(b.y / cell)}`;
        const size = armySize(b.army);
        const gr = groups.get(key);
        if (!gr) {
          groups.set(key, { lead: c, n: 1, total: size, best: size });
          continue;
        }
        gr.n++;
        gr.total += size;
        if (size > gr.best) {
          gr.lead.visible = false;
          gr.lead = c;
          gr.best = size;
        } else c.visible = false;
      }
      for (const gr of groups.values())
        if (gr.n > 1) {
          (gr.lead.getChildByLabel("count") as Text).text = `${gr.n}× · ${gr.total}`;
          gr.lead.scale.set(unitInv);
        }
    }
    for (const [id, c] of this.bandits) if (!live.has(id)) {
      c.destroy({ children: true });
      this.bandits.delete(id);
    }
    const liveC = new Set<number>();
    for (const cv of s.caravans) {
      liveC.add(cv.id);
      const c = this.caravan(cv.id, parseInt(FACTIONS[cv.fac as FactionId].color.slice(1), 16));
      c.visible = game.isExplored(cv.x, cv.y);
      this.walk("c" + cv.id, c, cv.x, cv.y, dt, cv.id, 0.6);
      c.scale.set(inv * 0.9);
      const ex = c.getChildByLabel("ex")!;
      ex.visible = !!cv.raid;
      ex.alpha = 0.6 + Math.abs(Math.sin(this.time * 8)) * 0.4;
    }
    for (const mc of s.mycv ?? []) {
      const id = 900000 + mc.id;
      liveC.add(id);
      const c = this.caravan(id, 0xffd56a);
      const p = game.myCvPos(mc);
      this.walk("m" + mc.id, c, p.x, p.y, dt, mc.id, 0.6);
      c.scale.set(inv * 0.85);
      c.getChildByLabel("ex")!.visible = false;
    }
    for (const [id, c] of this.caravansM) if (!liveC.has(id)) {
      c.destroy({ children: true });
      this.caravansM.delete(id);
    }
    s.rivals.forEach((r) => {
      let e = this.rivalsM.get(r.id);
      if (e && e.st !== r.status + r.name) {
        e.c.destroy({ children: true });
        this.rivalsM.delete(r.id);
        e = undefined;
      }
      if (r.status === "dead") return;
      if (!e) {
        const col = RIVAL_COL[r.status];
        const c = new Container();
        const sh = new Graphics()
          .ellipse(0, 20, 18, 5.6).fill({ color: 0x000000, alpha: 0.12 })
          .ellipse(0, 20, 13, 4).fill({ color: 0x000000, alpha: 0.16 })
          .ellipse(0, 20, 7, 2.4).fill({ color: 0x000000, alpha: 0.2 });
        const glow = new Graphics().circle(0, 0, 32).fill({ color: col, alpha: 0.18 });
        glow.label = "glow";
        const p = this.portrait(r.icon, 24, col);
        const nl = new Text({ text: `${r.name} ${r.title}`, style: { ...LABEL_STYLE, fontSize: 14, fill: "#" + col.toString(16).padStart(6, "0") } });
        nl.anchor.set(0.5, 0);
        nl.position.set(0, 30);
        nl.resolution = 2;
        const tg = new Sprite(this.t("tug"));
        tg.anchor.set(0.5, 1);
        tg.scale.set(34 / tg.texture.height);
        tg.tint = col;
        tg.position.set(20, -14);
        c.addChild(sh, glow, tg, p, nl);
        this.units.addChild(c);
        e = { c, st: r.status + r.name };
        this.rivalsM.set(r.id, e);
      }
      const c = e.c;
      c.visible = game.isExplored(r.x, r.y);
      this.walk("r" + r.id, c, r.x, r.y, dt, r.id.length * 3.1);
      c.scale.set(inv);
      c.zIndex = r.y;
      const glow = c.getChildByLabel("glow");
      if (glow) glow.scale.set(1 + Math.sin(this.time * (r.status === "war" ? 6 : 2)) * 0.12);
    });
    const liveM = new Set<number>();
    for (const m of s.marches) {
      liveM.add(m.id);
      const c = this.march(m.id);
      this.walk("a" + m.id, c, m.x, m.y, dt, m.id);
      c.scale.set(inv);
      const txt = c.getChildByLabel("txt") as Text;
      txt.text = m.phase === "gather" ? `⛏ ${Math.max(0, Math.ceil((m.until - Date.now()) / 1000))}sn` : m.phase === "back" ? `↩ ${Math.round(m.load)}` : `→ ${armySize(m.army)}`;
    }
    for (const [id, c] of this.marchesM) if (!liveM.has(id)) {
      c.destroy({ children: true });
      this.marchesM.delete(id);
    }

    this.visT -= dt;
    if (this.visT <= 0) {
      this.visT = 0.4;
      // Etiket LOD: tür başına farklı zoom eşiği — şehir her zaman, kale erken, köy orta, kamp/kurgan geç görünür.
      const vis = (m: Marker, alive = true, minZoom = 0.42) => {
        const e = alive && game.isExplored(m.x, m.y);
        m.sp.visible = e;
        if (m.label) m.label.visible = e && cam.zoom > minZoom;
      };
      this.villageM.forEach((m, i) => {
        vis(m, true, 0.45);
        const v = s.villages[i];
        if (v.state === this.villageSt[i]) return;
        this.villageSt[i] = v.state;
        const img = m.sp.getChildByLabel("img") as Sprite | null;
        if (!img) return;
        // baskın: toprak kararır; harabe: village2 asset'ine döner + yanık ton
        img.tint = v.state === "ruined" ? 0x7a6050 : v.state === "raided" ? 0xa89078 : 0xffffff;
        if (!v.yurt && v.state === "ruined" && this.tex["map/village2"]) img.texture = this.tex["map/village2"];
      });
      this.campM.forEach((m, i) => vis(m, s.camps[i].alive, 0.55));
      this.nodeM.forEach((m) => vis(m));
      this.ruinM.forEach((m, i) => vis(m, !s.ruins[i].looted));
      this.kurganM.forEach((m, i) => {
        const k = s.kurgans[i];
        vis(m, true, 0.5);
        m.sp.alpha = k.alive ? 1 : k.delved ? 0.35 : 0.6;
        if (m.label) m.label.text = k.alive ? `Kurgan Taşı Sv ${k.tier}` : k.delved ? "Boş Mezar" : TOMBS[tombOf(i)].name;
      });
      this.kaleM.forEach((m, i) => {
        const f = s.forts[i];
        if (!f) return;
        vis(m, true, 0.35);
        const col = fortColor(f.owner);
        if (m.label) {
          m.label.text = `${f.name} · ${tr(FORT_TIERS[f.tier].name)}`;
          m.label.style.fill = col;
        }
        const fl = this.kaleF[i];
        fl.visible = m.sp.visible;
        fl.tint = col;
        fl.alpha = f.threat ? 0.55 + 0.45 * Math.abs(Math.sin(this.time * 4)) : 1;
        const img = m.sp.getChildByLabel("img") as Sprite | null;
        if (img) img.tint = f.owner === "me" && f.wall <= 0 ? 0xcf8a78 : fortTint(f.tier);
      });
      this.cityM.forEach((m) => {
        m.sp.visible = true;
        if (m.label) m.label.visible = true;
      });
      const bar = document.querySelector(".top")?.getBoundingClientRect();
      const cv = (this.app.canvas as HTMLCanvasElement).getBoundingClientRect();
      this.barRect = bar && bar.height ? { l: bar.left - cv.left, r: bar.right - cv.left, b: bar.bottom - cv.top } : null;
      for (const id of Object.keys(s.serais)) {
        if (this.seraiF.has(id)) continue;
        const c = CITIES.find((x) => x.id === id)!;
        const f = new Sprite(this.t("tug"));
        f.anchor.set(0.5, 1);
        f.scale.set(60 / f.texture.height);
        f.position.set(c.x + 62, c.y - 20);
        this.places.addChild(f);
        this.seraiF.set(id, f);
      }
      for (const c of CITIES) {
        const own = !!s.owned[c.id];
        let f = this.ownF.get(c.id);
        if (own && !f) {
          f = new Sprite(this.t("tug"));
          f.anchor.set(0.5, 1);
          f.scale.set(84 / f.texture.height);
          f.tint = 0xffd36a;
          f.position.set(c.x - 66, c.y - 16);
          this.places.addChild(f);
          this.ownF.set(c.id, f);
        }
        if (f) f.visible = own;
      }
      this.wallRingG.clear();
      for (const c of CITIES) {
        const own = !!s.owned[c.id];
        const cap = c.id === CAPITAL.id;
        if (!own && !cap) continue;
        if (!game.isExplored(c.x, c.y)) continue;
        const lv = own ? game.cbl(c.id, "sur") : 0;
        const w = cap ? MAP_W.cityCap : MAP_W.city;
        const r = w * 0.58 + lv * 12;
        const alpha = own ? 0.22 + lv * 0.13 : 0.14;
        this.wallRingG.circle(c.x, c.y, r).stroke({ color: 0xffe9b0, width: 2.5 + lv * 1.4, alpha });
      }
      const ls = Math.min(2.4, Math.max(0.9, 0.7 / cam.zoom));
      for (const m of [...this.villageM, ...this.campM, ...this.kurganM, ...this.kaleM, ...this.cityM]) if (m.label) m.label.scale.set(ls);
      this.syncMarks(game, cam);
      // Uzaktan dağ silüeti: seyrekleş ve sönükleş; yakınken tam yoğunluk.
      const peakLodOn = cam.zoom < 0.4;
      if (peakLodOn !== this.peakLodOn) {
        this.peakLodOn = peakLodOn;
        this.peakSprites.forEach((sp, i) => {
          sp.visible = !peakLodOn || i % 2 === 0;
          sp.alpha = peakLodOn ? 0.5 : 0.88;
        });
      }
    }
    this.flipLabels(cam);

    this.fxG.clear();
    // Geçici sefer okları: bey akını ya da vali seferi, hedefe doğru kısa bir süre akar.
    if (s.fxMarch?.length) {
      const nowT = Date.now();
      s.fxMarch = s.fxMarch.filter((m) => m.until > nowT);
      for (const m of s.fxMarch) {
        const dur = m.until - m.t0;
        const k = dur > 0 ? Math.max(0, Math.min(1, (nowT - m.t0) / dur)) : 1;
        const x = m.x + (m.tx - m.x) * k;
        const y = m.y + (m.ty - m.y) * k;
        if (!game.isExplored(x, y) && !game.isExplored(m.x, m.y) && !game.isExplored(m.tx, m.ty)) continue;
        const ang = Math.atan2(m.ty - m.y, m.tx - m.x);
        const tipx = x + Math.cos(ang) * 9 * inv;
        const tipy = y + Math.sin(ang) * 9 * inv;
        this.fxG.poly([tipx, tipy, x - Math.cos(ang - 2.4) * 8 * inv, y - Math.sin(ang - 2.4) * 8 * inv, x - Math.cos(ang + 2.4) * 8 * inv, y - Math.sin(ang + 2.4) * 8 * inv]).fill({ color: m.col, alpha: 0.9 });
        this.fxG.moveTo(m.x, m.y).lineTo(x, y).stroke({ color: m.col, width: 2 * inv, alpha: 0.3 * Math.min(1, k * 3) });
      }
    }
    const hx = s.hero.x, hy = s.hero.y;
    const lk = (this.time - this.lvAt) / 2.6;
    if (lk >= 0 && lk < 1) {
      const a = 1 - lk;
      const w = 26 * (1 - lk * 0.6);
      this.fxG.rect(hx - w, hy - 520, w * 2, 510).fill({ color: 0xffd56a, alpha: 0.22 * a });
      this.fxG.rect(hx - w * 0.35, hy - 520, w * 0.7, 510).fill({ color: 0xfff4c8, alpha: 0.4 * a });
      for (let k = 0; k < 3; k++) {
        const q = (lk * 1.6 + k / 3) % 1;
        this.fxG.ellipse(hx, hy + 4, 20 + q * 90, 8 + q * 34).stroke({ color: 0xffd56a, width: 4, alpha: 0.8 * (1 - q) * a });
      }
      for (let k = 0; k < 14; k++) {
        const q = (lk * 1.3 + k * 0.071) % 1;
        this.fxG.circle(hx + Math.sin(k * 2.4 + this.time * 2) * 26, hy - q * 160, 2.5).fill({ color: 0xfff0b0, alpha: (1 - q) * a });
      }
    }
    const ck = (this.time - this.craftAt) / 1.8;
    if (ck >= 0 && ck < 1) {
      const a = 1 - ck;
      const col = this.craftCol;
      for (let k = 0; k < 4; k++) {
        const q = (ck * 1.4 + k / 4) % 1;
        this.fxG.ellipse(hx, hy + 2, 14 + q * 70, 6 + q * 28).stroke({ color: col, width: 3, alpha: 0.75 * (1 - q) * a });
      }
      for (let k = 0; k < 18; k++) {
        const ang = k * 0.7 + this.time * 3;
        const q = (ck * 1.5 + k * 0.055) % 1;
        this.fxG.circle(hx + Math.cos(ang) * (12 + q * 48), hy - 8 - q * 90, 2 + (1 - q) * 2).fill({ color: col, alpha: (1 - q) * a });
      }
    }
    if (!s.free) this.fxG.circle(CAPITAL.x, CAPITAL.y, SLAVE_RADIUS).stroke({ color: 0xff6a4a, width: 4, alpha: 0.35 + Math.sin(this.time * 2) * 0.1 });
    for (const v of s.villages) if (v.state === "ruined" && game.isExplored(v.x, v.y)) this.smoke(v.x - 10, v.y - 26, 0.5, 0x4a4038, inv);
    for (const c of CITIES) if (!game.sacked(c.id) && game.cityScarred(c.id) && game.isExplored(c.x, c.y)) this.smoke(c.x - 24, c.y - 30, 0.4, 0x4a4038, inv);
    if (s.raid) {
      const v = s.villages[s.raid.v];
      const pr = (this.time * 1.4) % 1;
      this.fxG.circle(v.x, v.y, 30 + pr * 40).stroke({ color: 0xff3a1a, width: 4, alpha: 0.9 * (1 - pr) });
      this.fxG.circle(v.x, v.y - 10, 8 + Math.sin(this.time * 10) * 2).fill({ color: 0xff7a2a, alpha: 0.8 });
    }
    if (s.story.fort && !s.story.done) {
      const pr = (this.time * 0.5) % 1;
      this.fxG.circle(s.story.fort.x, s.story.fort.y - 20, 60 + pr * 50).stroke({ color: 0xff3a3a, width: 4, alpha: 0.6 * (1 - pr) });
    }
    if (s.act2.gate && !s.act2.done) {
      const pr = (this.time * 0.4) % 1;
      this.fxG.circle(s.act2.gate.x, s.act2.gate.y - 30, 70 + pr * 70).stroke({ color: 0xa64dff, width: 5, alpha: 0.7 * (1 - pr) });
      this.fxG.circle(s.act2.gate.x, s.act2.gate.y - 30, 26 + Math.sin(this.time * 3) * 6).fill({ color: 0xa64dff, alpha: 0.18 });
    }
    this.drawShips(game, dt);
    this.drawDens(game, inv);
    if (s.act3.peak && !s.act3.ending) {
      const pr = (this.time * 0.35) % 1;
      const p = s.act3.peak;
      this.fxG.rect(p.x - 10, p.y - 420, 20, 380).fill({ color: 0x9fdcff, alpha: 0.12 + Math.sin(this.time * 2) * 0.04 });
      this.fxG.circle(p.x, p.y - 30, 70 + pr * 80).stroke({ color: 0x7fd0ff, width: 5, alpha: 0.7 * (1 - pr) });
    }
    for (const k of s.kurgans) {
      if (!game.isExplored(k.x, k.y) || (!k.alive && k.delved)) continue;
      const pr = (this.time * 0.6 + k.x * 0.001) % 1;
      if (k.alive) this.fxG.circle(k.x, k.y - 8, 26 + pr * 34).stroke({ color: 0xb46aff, width: 3, alpha: 0.55 * (1 - pr) });
      else this.fxG.ellipse(k.x, k.y + 4, 22 + Math.sin(this.time * 3) * 3, 8).fill({ color: 0xffc860, alpha: 0.35 });
    }
    for (const f of s.forts) {
      if (f.owner !== "me") continue;
      this.fxG.circle(f.x, f.y, FORT_TIERS[f.tier].guard).stroke({ color: 0xffd36a, width: 5, alpha: 0.3 });
      if (f.threat) {
        const pr = (this.time * 0.8) % 1;
        this.fxG.circle(f.x, f.y - 20, 60 + pr * 60).stroke({ color: 0xff3a3a, width: 4, alpha: 0.7 * (1 - pr) });
      }
    }
    for (const b of s.bounties) {
      if (!b.taken) continue;
      const c = s.camps[b.camp];
      if (c.alive) this.fxG.circle(c.x, c.y, 52 + Math.sin(this.time * 4) * 4).stroke({ color: 0xffd56a, width: 4, alpha: 0.8 });
    }
    if (this.mark) {
      this.mark.t += dt;
      const k = this.mark.t / 0.8;
      if (k >= 1) this.mark = null;
      else this.fxG.circle(this.mark.x, this.mark.y, 10 + k * 24).stroke({ color: 0xffe08a, width: 3, alpha: 1 - k });
    }
    const tg = game.target;
    if (tg && tg.kind !== "point") {
      const p = game.targetPos(tg);
      if (p) this.fxG.circle(p.x, p.y, 40 + Math.sin(this.time * 5) * 4).stroke({ color: tg.kind === "bandit" || tg.kind === "camp" ? 0xff6a4a : 0xffe08a, width: 3, alpha: 0.9 });
    }
    if (s.free) this.drawPulse(game, inv);

    if (this.fogDirty) {
      this.fogDirty = false;
      const sg = this.fogSmall.getContext("2d")!;
      const img = sg.createImageData(NW, NH);
      for (let i = 0; i < NW * NH; i++) {
        const o = i * 4;
        img.data[o] = 34;
        img.data[o + 1] = 20;
        img.data[o + 2] = 8;
        img.data[o + 3] = s.explored[i] ? 0 : 255;
      }
      sg.putImageData(img, 0, 0);
      const fw = this.fogCanvas.width;
      const fh = this.fogCanvas.height;
      const stretch = (c: CanvasRenderingContext2D, blur: number) => {
        c.filter = `blur(${blur}px)`;
        c.imageSmoothingEnabled = true;
        c.drawImage(this.fogSmall, -FOG_UP, -FOG_UP, fw + FOG_UP * 2, fh + FOG_UP * 2);
        c.filter = "none";
      };
      const g = this.fogCanvas.getContext("2d")!;
      g.clearRect(0, 0, fw, fh);
      g.globalAlpha = 0.62;
      stretch(g, FOG_UP * 2.6);
      const pc = this.fogPaper.getContext("2d")!;
      pc.globalCompositeOperation = "copy";
      stretch(pc, FOG_UP * 0.9);
      pc.globalCompositeOperation = "source-in";
      pc.drawImage(this.parchment(), 0, 0);
      pc.globalCompositeOperation = "source-over";
      g.globalAlpha = 0.8;
      g.drawImage(this.fogPaper, 0, 0);
      g.globalAlpha = 1;
      this.fog.texture.source.update();
    }

    this.drawStorms(game, dt);

    const sk = game.season();
    if (sk !== this.seasonK) {
      this.seasonK = sk;
      const S = SEASONS[sk];
      this.seasonG.clear().rect(0, 0, W, H).fill({ color: S.tint, alpha: S.tintA * (this.terrain ? 0.4 : 1) });
      this.deco.tint = S.deco;
    }
    this.snowG.clear();
    if (sk === "kis") {
      const vw = cam.w / cam.zoom;
      const vh = cam.h / cam.zoom;
      const x0 = cam.x - vw / 2;
      const y0 = cam.y - vh / 2;
      const r = Math.max(1.4, 2.2 / cam.zoom);
      for (let i = 0; i < 140; i++) {
        const fx = ((i * 7919) % 1000) / 1000;
        const fy = ((i * 104729) % 1000) / 1000;
        const sp = 0.06 + ((i * 31) % 10) / 100;
        const px = x0 + (((fx + Math.sin(this.time * 0.7 + i) * 0.015 + this.time * 0.01) % 1) + 1) % 1 * vw;
        const py = y0 + ((fy + this.time * sp) % 1) * vh;
        this.snowG.circle(px, py, r * (0.7 + (i % 3) * 0.25));
      }
      this.snowG.fill({ color: 0xffffff, alpha: 0.85 });
    } else if (sk === "guz" || sk === "bahar") {
      const vw = cam.w / cam.zoom;
      const vh = cam.h / cam.zoom;
      const x0 = cam.x - vw / 2;
      const y0 = cam.y - vh / 2;
      const r = Math.max(2.2, 3.4 / cam.zoom);
      const fall = sk === "guz";
      const cols = fall ? [0xd2691e, 0xb8860b, 0x8b4513, 0xe0a030] : [0xffd0e0, 0xffffff, 0xffb6d0];
      const n = fall ? 46 : 34;
      for (let c = 0; c < cols.length; c++) {
        for (let i = c; i < n; i += cols.length) {
          const fx = ((i * 7919) % 1000) / 1000;
          const fy = ((i * 104729) % 1000) / 1000;
          const sp = 0.025 + ((i * 31) % 10) / 300;
          const px = x0 + ((((fx + this.time * (fall ? 0.03 : 0.012) + Math.sin(this.time * 1.3 + i) * 0.02) % 1) + 1) % 1) * vw;
          const py = y0 + ((fy + this.time * sp) % 1) * vh;
          const tw = Math.abs(Math.sin(this.time * 2.5 + i));
          this.snowG.ellipse(px, py, r * (0.6 + tw * 0.8), r * 0.55);
        }
        this.snowG.fill({ color: cols[c], alpha: 0.75 });
      }
    }

    const { t } = game.dayOf();
    const dark = Math.max(0, Math.cos(t * Math.PI * 2) * -1) * 0.38;
    this.night.clear();
    if (dark > 0.01) this.night.rect(0, 0, W, H).fill({ color: 0x0c1430, alpha: dark });
    {
      const k = 1 - dark * 1.15;
      const ch = (v: number) => Math.round(Math.min(1, v) * 255);
      this.fog.tint = (ch(k) << 16) | (ch(k + dark * 0.12) << 8) | ch(k + dark * 0.4);
    }
    {
      const vw = cam.w / cam.zoom / 2;
      const vh = cam.h / cam.zoom / 2;
      this.life?.update(dt, this.time, { x0: cam.x - vw, y0: cam.y - vh, x1: cam.x + vw, y1: cam.y + vh }, dark, sk === "kis", cam.zoom);
    }
    this.lights.visible = dark > 0.03;
    this.lights.alpha = Math.min(0.85, dark * 2.4) * (0.92 + Math.sin(this.time * 3) * 0.08);
    if (this.lights.visible) {
      const h = game.s.hero;
      this.torch.position.set(h.x, h.y - 6);
      this.torch.width = this.torch.height = 220 + Math.sin(this.time * 9) * 8 + Math.sin(this.time * 23) * 4;
      this.campFires.forEach((f, i) => {
        const c = game.s.camps[i];
        f.visible = c.alive && game.isExplored(c.x, c.y);
        f.width = f.height = 140 + Math.sin(this.time * 7 + i) * 10;
      });
    }
    for (const c of this.clouds.children) {
      c.x += dt * 9;
      c.y += dt * 2;
      if (c.x - c.width / 2 > W) c.x = -c.width / 2;
      if (c.y - c.height / 2 > H) c.y = -c.height / 2;
    }
  }
}
