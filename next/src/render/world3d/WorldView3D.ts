import { clearGlb, hasGlb, overlayGlb, preloadActorGlbs } from "./Models";
import {
  AmbientLight,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineLoop,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PCFSoftShadowMap,
  PMREMGenerator,
  PlaneGeometry,
  Raycaster,
  Vector2,
  Vector3,
  RingGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  WebGLRenderer,
  SRGBColorSpace,
  type Texture,
} from "three";
import { convexHull, inflateHull } from "../realmGeom";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { CITIES, GH, GW, H, NH, NW, W, type World } from "../../world/gen";
import type { Camera } from "../camera";
import type { IWorldView } from "../iWorldView";
import type { Game } from "../../game/game";
import { CITY_NAME, DAY_SEC, armySize } from "../../game/data";
import { CAPITAL } from "../../game/state";
import { FORT_TIERS } from "../../game/forts";
import { FACTIONS, FACTION_KEYS, citiesOf, factionOf, type FactionId } from "../../game/factions";
import { PORTS, alongPath, seaPath } from "../../game/hazar";
import { t as tr } from "../../i18n";
import { settings } from "../../settings";
import { assetUrl } from "../assets";
import { buildTerrain, heightAt } from "./Terrain3D";
import { AREA_BOSSES } from "../../game/regions";
import { CineLook, DAY_CLEAR, DAY_FOG } from "./CineLook";
import { loadCineKit, type CineTextures } from "./CineKit";
import { buildNatureProps, scatterFog, fadePeaks } from "./Props3D";
import { buildBandit, buildBoss, buildCamel, buildCompanion, buildHero, buildSoldier, type BanditKind } from "./Actors3D";
import { Unit3D } from "./Units3D";
import { AmbientFx } from "./AmbientFx";
import { banditFormation, banditLook, caravanFormation, troopFormation } from "./Armies3D";
import { ACTOR_MUL, PlaceLife } from "./Population3D";
import { disposeTree } from "./Units3D";
import { bakeStatic, type PlaceModel } from "./Build";
import { buildCamp, buildFort, buildKurgan, buildNode, buildOasis, buildRuin, buildVillage, buildYurtCamp } from "./Settlements3D";
import { buildCity } from "./Cities3D";
import { buildPier, buildPirateNest, buildShip, type ShipModel } from "./Ships3D";

type PlaceKind = "city" | "village" | "camp" | "fort" | "kurgan" | "node" | "ruin" | "oasis" | "other";

interface PlaceMark {
  root: Group;
  model: PlaceModel;
  life: PlaceLife | null;
  label?: CSS2DObject;
  kind: PlaceKind;
  /** overlayGlb anahtarı; yoksa kind kullanılır */
  glb?: string;
  /** ağır yer glb'si yakına gelince bir kez yüklenir */
  glbOn?: boolean;
  wx: number;
  wy: number;
  sig: string;
  labelH: number;
  shOn?: boolean;
}

interface BossEntry {
  u: Unit3D;
  lx: number;
  ly: number;
  ph: number;
  patrol: boolean;
  /** konum yumuşatma */
  px: number;
  py: number;
}

const hexNum = (s: string): number => parseInt(s.replace("#", ""), 16) || 0xcccccc;

/**
 * Mount & Blade campaign map tarzı overworld:
 * 3D arazi + gerçek 3D yerleşimler (surlu şehir, kale, köy, yurt, kamp) ve
 * eklemli, yürüyen birimler (kahraman, haramiler, bosslar, kervanlar, gemiler).
 */
export class WorldView3D implements IWorldView {
  fogDirty = true;
  layer = {
    scale: { set(_z: number) {} },
    position: { set(_x: number, _y: number) {} },
  };

  private host: HTMLElement;
  private renderer: WebGLRenderer;
  private labelRenderer: CSS2DRenderer;
  private cine!: CineLook;
  private scene = new Scene();
  private cam3 = new PerspectiveCamera(40, 1, 8, 32000);
  private sun = new DirectionalLight(0xffd8a8, 1.85);
  private rim = new DirectionalLight(0x8899bb, 0.4);
  private hemi = new HemisphereLight(0xc8d8e8, 0x6a5838, 0.75);
  private amb = new AmbientLight(0xb8a888, 0.45);
  private placesG = new Group();
  private unitsG = new Group();
  private fxG = new Group();
  private shipsG = new Group();
  private tex = new Map<string, Texture>();
  private loader = new TextureLoader();
  private cityM: PlaceMark[] = [];
  private villageM: PlaceMark[] = [];
  private campM: PlaceMark[] = [];
  private fortM: PlaceMark[] = [];
  private kurganM: PlaceMark[] = [];
  private nodeM: PlaceMark[] = [];
  private ruinM: PlaceMark[] = [];
  private oasisM: PlaceMark[] = [];
  private nestM: PlaceMark[] = [];
  private pierM: { m: PlaceMark; city: string; dock: { x: number; y: number }; dir: number }[] = [];
  /** Devlet toprak halkaları (şehir ayak izi). */
  private realmRings = new Map<string, Mesh>();
  private realmLabels = new Map<string, CSS2DObject>();
  /** Konveks ülke dolgusu + sınır çizgisi. */
  private realmFills = new Map<string, Mesh>();
  private realmBorders = new Map<string, LineLoop>();
  private heroU!: Unit3D;
  private heroKey = "";
  private heroBase = 1;
  private bandits = new Map<number, Unit3D>();
  private caravans = new Map<number, Unit3D>();
  private bosses = new Map<string, BossEntry>();
  private rivals = new Map<string, { u: Unit3D; sig: string }>();
  private marches = new Map<number, Unit3D>();
  private shipPool: { model: ShipModel; kind: "dhow" | "pirate"; used: boolean }[] = [];
  private waterSpot = new Map<string, { x: number; y: number }>();
  private markSpr: Sprite | null = null;
  private markT = 0;
  private craftT = 0;
  private levelT = 0;
  private ambient: AmbientFx | null = null;
  private dayF = 1;
  private time = 0;
  private zt = 0.5;
  private cx = 0;
  private cy = 0;
  private terrain!: Group;
  private cineTex: CineTextures | null = null;
  private sky!: Mesh;
  private fogPlane: Mesh | null = null;
  private fogCanvas: HTMLCanvasElement | null = null;
  private fogTex: import("three").CanvasTexture | null = null;
  canvas: HTMLCanvasElement;

  constructor(host: HTMLElement, private world: World) {
    this.host = host;
    const gfx = settings.gfx ?? (settings.eco ? "low" : "high");
    const eco = gfx === "low";
    const mid = gfx === "mid";
    this.renderer = new WebGLRenderer({
      antialias: gfx === "high",
      powerPreference: eco ? "low-power" : "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(eco ? 1 : mid ? Math.min(1.25, devicePixelRatio || 1) : Math.min(1.75, devicePixelRatio || 1));
    this.renderer.setClearColor(DAY_CLEAR, 1);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.shadowMap.enabled = !eco;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.canvas = this.renderer.domElement;
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    host.appendChild(this.canvas);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = "absolute";
    this.labelRenderer.domElement.style.inset = "0";
    this.labelRenderer.domElement.style.pointerEvents = "none";
    this.labelRenderer.domElement.style.zIndex = "3";
    host.appendChild(this.labelRenderer.domElement);

    this.scene.background = DAY_FOG.clone();
    // ufuk sisi — üst kenar void'ini yumuşatır
    this.scene.fog = new FogExp2(DAY_FOG.getHex(), eco ? 0.00016 : 0.00011);
    this.sky = this.makeSkyDome();
    this.scene.add(this.sky);
    this.scene.add(this.hemi, this.amb, this.sun, this.rim);
    this.sun.castShadow = !eco;
    if (!eco) {
      const map = mid ? 1024 : 2048;
      this.sun.shadow.mapSize.set(map, map);
      this.sun.shadow.camera.near = 20;
      this.sun.shadow.camera.far = 8000;
      const s = 2800;
      this.sun.shadow.camera.left = -s;
      this.sun.shadow.camera.right = s;
      this.sun.shadow.camera.top = s;
      this.sun.shadow.camera.bottom = -s;
      this.sun.shadow.bias = -0.00015;
    }
    this.rim.position.set(-400, 200, 600);
    this.scene.add(this.sun.target);
    this.scene.add(this.rim.target);
    this.scene.add(this.placesG, this.unitsG, this.fxG, this.shipsG);
    if (gfx === "high") {
      this.ambient = new AmbientFx();
      this.fxG.add(this.ambient.group);
    }

    this.cine = new CineLook(this.renderer, this.scene, this.cam3, eco);
    // Hafif ortam yansıması: zırh/metal siyah kalmasın, gölgeler dolgu ışığı alsın
    const pm = new PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.22;
    pm.dispose();
  }

  async load(): Promise<void> {
    const keys = ["icons/tug"];
    await Promise.all(
      keys.map(async (k) => {
        const u = assetUrl(k);
        if (!u) return;
        const t = await this.loader.loadAsync(u);
        t.colorSpace = SRGBColorSpace;
        this.tex.set(k, t);
      }),
    );

    this.cineTex = await loadCineKit();
    this.terrain = buildTerrain(this.world, this.cineTex);
    this.scene.add(this.terrain);
    this.propsG = buildNatureProps(this.world, this.cineTex);
    this.scene.add(this.propsG);
    this.buildFogPlane();
    this.buildStaticPlaces();
    this.placeBosses();
    preloadActorGlbs(); // kahraman/asker/gemi — küçük dosyalar; harita 60MB lazy

    this.heroU = new Unit3D("hero", "…", this.elev);
    this.unitsG.add(this.heroU.root);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private elev = (x: number, z: number): number => heightAt(this.world, x, z);

  /** Gündüz gökyüzü — AoE / M&B campaign mavi-bej ufuk. */
  private makeSkyDome(): Mesh {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 160;
    const g = c.getContext("2d")!;
    const grd = g.createLinearGradient(0, 0, 0, 160);
    grd.addColorStop(0, "#3a6088");
    grd.addColorStop(0.35, "#6a98b8");
    grd.addColorStop(0.55, "#a8c4d8");
    grd.addColorStop(0.72, "#d4c4a0");
    grd.addColorStop(0.88, "#c4a878");
    grd.addColorStop(1, "#8a7a58");
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 160);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    const mat = new MeshBasicMaterial({ map: tex, side: BackSide, fog: false, depthWrite: false });
    const mesh = new Mesh(new SphereGeometry(16000, 32, 20), mat);
    mesh.name = "sky";
    return mesh;
  }

  // ───────────────────────── bosslar ─────────────────────────

  private placeBosses(): void {
    for (const b of AREA_BOSSES) {
      const [nx, ny] = b.lair;
      const wx = nx * W;
      const wy = ny * H;
      const u = new Unit3D("boss", b.name, this.elev);
      const a = buildBoss(b.id);
      a.root.scale.multiplyScalar(ACTOR_MUL);
      a.height *= ACTOR_MUL;
      u.setLeader(a, a.height * 0.5);
      this.unitsG.add(u.root);
      const patrol = !["sahmeran", "evren"].includes(b.id);
      this.bosses.set(b.id, { u, lx: wx, ly: wy, ph: wx * 0.013 + wy * 0.007, patrol, px: wx, py: wy });
    }
  }

  private resize(): void {
    const w = Math.max(1, this.host.clientWidth || window.innerWidth || 1);
    const h = Math.max(1, this.host.clientHeight || window.innerHeight || 1);
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.cam3.aspect = w / h;
    this.cam3.updateProjectionMatrix();
    this.cine.setSize(w, h);
  }

  private texOf(key: string): Texture | null {
    return this.tex.get(key) ?? this.tex.get("icons/" + key) ?? null;
  }

  private mkSprite(key: string, h: number): Sprite {
    const t = this.texOf(key);
    const mat = new SpriteMaterial({
      map: t ?? undefined,
      transparent: true,
      depthWrite: false,
      color: t ? 0xffffff : 0xffd56a,
    });
    const s = new Sprite(mat);
    const img = t?.image as { width?: number; height?: number } | undefined;
    const aspect = img?.width && img?.height ? img.width / Math.max(1, img.height) : 1;
    s.scale.set(h * aspect, h, 1);
    s.center.set(0.5, 0);
    return s;
  }

  private mkLabel(text: string, cls = ""): CSS2DObject {
    const el = document.createElement("div");
    el.className = `w3d-label ${cls}`.trim();
    el.textContent = text;
    return new CSS2DObject(el);
  }

  // ───────────────────────── yerleşimler ─────────────────────────

  private placeModelAt(model: PlaceModel, wx: number, wy: number, kind: PlaceKind, sig: string, name?: string, lcls = "", labelH = 50, team?: number, glb?: string): PlaceMark {
    const root = new Group();
    const elev = heightAt(this.world, wx, wy);
    root.position.set(wx, elev, wy);
    root.add(model.root);
    if (kind === "node" || kind === "ruin" || kind === "oasis") {
      model.root.traverse((o) => {
        if ((o as Mesh).isMesh) (o as Mesh).castShadow = false;
      });
    }
    bakeStatic(model.root);
    // Yer glb'leri yakına gelince yüklenir (60MB×N başlangıçta tarayıcıyı öldürüyor).
    // node.glb (~60MB) kampanya haritasında değmez — prosedürel nöbet kulübesi kalsın.
    const gKey =
      glb ??
      (kind !== "city" && kind !== "other" && kind !== "node" ? kind : undefined);
    let label: CSS2DObject | undefined;
    if (name) {
      label = this.mkLabel(name, lcls);
      label.position.y = labelH;
      root.add(label);
    }
    const life = model.npcs.length ? new PlaceLife(model, team) : null;
    this.placesG.add(root);
    return { root, model, life, label, kind, glb: gKey, glbOn: false, wx, wy, sig, labelH };
  }

  /** Durum değişince modeli yenile (kamp yıkıldı, köy yağmalandı, kale yükseldi...). */
  private swapModel(m: PlaceMark, model: PlaceModel, sig: string, team?: number): void {
    m.root.remove(m.model.root);
    disposeTree(m.model.root);
    bakeStatic(model.root);
    m.root.add(model.root);
    m.model = model;
    m.life = model.npcs.length ? new PlaceLife(model, team) : null;
    m.sig = sig;
    m.shOn = undefined;
    m.glbOn = false; // yakında yeniden overlay
  }

  private buildStaticPlaces(): void {
    CITIES.forEach((c, i) => {
      const cap = c.id === CAPITAL.id;
      const model = buildCity(c.id, cap, 0xe0b04a);
      const m = this.placeModelAt(model, c.x, c.y, "city", "", CITY_NAME[c.id] + (cap ? " ★" : ""), "city", 118, 0x7a3a2a);
      m.glb = hasGlb(`city_${c.id}`) ? `city_${c.id}` : hasGlb("city") ? "city" : undefined;
      this.cityM[i] = m;
    });
    for (const o of this.world.oases) {
      this.oasisM.push(this.placeModelAt(buildOasis(Math.floor(o.x + o.y)), o.x, o.y, "oasis", "", tr(o.name), "oasis", 34));
    }
    // iskeleler + korsan yuvaları
    for (const pt of PORTS) {
      const c = CITIES.find((k) => k.id === pt.city);
      if (!c) continue;
      const dock = this.dockOf(pt.city);
      const dir = Math.atan2(dock.x - c.x, dock.y - c.y);
      const len = Math.hypot(dock.x - c.x, dock.y - c.y);
      void len;
      const px = dock.x - Math.sin(dir) * 76;
      const py = dock.y - Math.cos(dir) * 76;
      const m = this.placeModelAt(buildPier(), px, py, "other", "", undefined, "", 50, undefined, "pier");
      m.root.rotation.y = dir;
      m.root.position.y = 0;
      this.pierM.push({ m, city: pt.city, dock, dir });
    }
    for (const [nx, ny] of [[0.408, 0.27], [0.205, 0.335]] as [number, number][]) {
      const m = this.placeModelAt(buildPirateNest(false), nx * W, ny * H, "other", "alive", tr("Korsan Yuvası"), "camp", 52, 0x2a2420, "pirate");
      m.root.position.y = Math.max(m.root.position.y, 0);
      this.nestM.push(m);
    }
  }

  attachState(game: Game): void {
    const s = game.s;
    this.villageM = s.villages.map((v, i) => {
      const st = v.state === "ruined" ? 2 : v.state === "raided" ? 1 : 0;
      const model = v.yurt ? buildYurtCamp(i * 7 + 3, st as 0 | 1 | 2) : buildVillage(i * 7 + 3, st as 0 | 1 | 2);
      const glbKey = v.yurt ? (hasGlb("yurts") ? "yurts" : undefined) : hasGlb("village") ? "village" : undefined;
      return this.placeModelAt(model, v.x, v.y, "village", String(st), v.name, "village", 40, undefined, glbKey);
    });
    this.campM = s.camps.map((c, i) =>
      this.placeModelAt(buildCamp(i * 5 + 1, c.tier, c.alive), c.x, c.y, "camp", `${c.alive}|${c.tier}`, c.name, "camp", 44, undefined, hasGlb("camp") ? "camp" : undefined),
    );
    // node: 60MB glb yok — prosedürel
    this.nodeM = s.nodes.map((n, i) => this.placeModelAt(buildNode(n.kind, i * 3 + 1), n.x, n.y, "node", "", undefined, "", 50, undefined, undefined));
    this.ruinM = s.ruins.map((r, i) => this.placeModelAt(buildRuin(i * 3 + 2), r.x, r.y, "ruin", "", undefined, "", 50, undefined, hasGlb("ruin") ? "ruin" : undefined));
    this.kurganM = s.kurgans.map((k, i) =>
      this.placeModelAt(buildKurgan(i * 3 + 1, k.tier, k.alive), k.x, k.y, "kurgan", `${k.alive}`, `Kurgan Sv ${k.tier}`, "kurgan", 36, undefined, hasGlb("kurgan") ? "kurgan" : undefined),
    );
    this.fortM = s.forts.map((f, i) => {
      const col = this.fortCol(f.owner);
      const m = this.placeModelAt(buildFort(f.tier, i * 7 + 2, col), f.x, f.y, "fort", `${f.tier}`, f.name, "fort", 72 + f.tier * 8, col, hasGlb("fort") ? "fort" : undefined);
      return m;
    });
    this.heroPortrait(game.face());
    // Kahraman çevresindeki şehir/kale .glb'lerini hemen ısıt — ilk bakışta 3D görünsün
    this.warmNearbyPlaces(s.hero.x, s.hero.y);
  }

  /** İlk karede yakındaki büyük yer modellerini kuyruğa al. */
  private warmNearbyPlaces(hx: number, hy: number): void {
    const near = (m: PlaceMark, r: number) => {
      if (!m.glb || m.glbOn) return;
      if (Math.hypot(m.wx - hx, m.wy - hy) > r) return;
      m.glbOn = true;
      overlayGlb(m.model.root, m.glb);
    };
    for (const m of this.cityM) near(m, 4200);
    for (const m of this.fortM) near(m, 3200);
    for (const m of this.villageM) near(m, 1400);
    for (const m of this.campM) near(m, 1200);
    for (const m of this.oasisM) near(m, 1400);
  }

  private fortCol(owner: string): number {
    if (owner === "me") return 0xffd36a;
    if (owner === "harami") return 0xb0503a;
    const f = FACTIONS[owner as FactionId];
    return f ? hexNum(f.color) : 0xcccccc;
  }

  /** Limana en yakın açık su (2D ile aynı arama). */
  private isWater(x: number, y: number): boolean {
    const gx = Math.floor(x / 4);
    const gy = Math.floor(y / 4);
    if (gx < 0 || gy < 0 || gx >= GW || gy >= GH) return false;
    return this.world.height[gy * GW + gx] < -0.02;
  }

  private dockOf(city: string): { x: number; y: number } {
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

  /** 3D'de kahraman kimliği update()'te çözülür; bu çağrı geriye dönük uyumluluk içindir. */
  heroPortrait(_key: string): void {
    this.heroKey = "";
  }

  levelUpFx(): void {
    this.levelT = 1.2;
  }

  craftBurst(color = 0xffd56a): void {
    this.craftT = 0.8;
    void color;
  }

  marker(x: number, y: number): void {
    if (!this.markSpr) {
      this.markSpr = this.mkSprite("icons/tug", 40);
      this.fxG.add(this.markSpr);
    }
    const elev = heightAt(this.world, x, y);
    this.markSpr.position.set(x, elev + 10, y);
    this.markSpr.visible = true;
    this.markT = 2.5;
  }

  private buildFogPlane(): void {
    const c = document.createElement("canvas");
    c.width = NW;
    c.height = NH;
    this.fogCanvas = c;
    this.fogTex = new CanvasTexture(c);
    this.fogTex.colorSpace = SRGBColorSpace; scatterFog.tex.value = this.fogTex;
    const geo = new PlaneGeometry(W, H);
    geo.rotateX(-Math.PI / 2);
    const mat = new MeshBasicMaterial({
      map: this.fogTex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0.88,
    });
    this.fogPlane = new Mesh(geo, mat);
    this.fogPlane.position.set(W / 2, 6, H / 2);
    this.fogPlane.renderOrder = 10;
    this.scene.add(this.fogPlane);
  }

  private paintFog(game: Game): void {
    if (!this.fogCanvas || !this.fogTex) return;
    const g = this.fogCanvas.getContext("2d")!;
    const ex = game.s.explored;
    const img = g.createImageData(NW, NH);
    for (let i = 0; i < NW * NH; i++) {
      const o = i * 4;
      if (ex[i]) {
        img.data[o + 3] = 0;
      } else {
        // AoE sis: mavi-gri pus, siyah örtü değil
        img.data[o] = 72;
        img.data[o + 1] = 82;
        img.data[o + 2] = 98;
        img.data[o + 3] = 150;
      }
    }
    // sert hücre kenarları yerine yumuşak sis sınırı (ctx.filter yoksa sessizce düz çizilir)
    const tmp = document.createElement("canvas");
    tmp.width = NW;
    tmp.height = NH;
    tmp.getContext("2d")!.putImageData(img, 0, 0);
    g.clearRect(0, 0, NW, NH);
    g.filter = "blur(1.6px)";
    g.drawImage(tmp, 0, 0);
    g.filter = "none";
    this.fogTex.needsUpdate = true;
  }

  private syncCam(cam: Camera): void {
    const elev = heightAt(this.world, cam.x, cam.y);
    const zt = MathUtils.clamp((cam.zoom - cam.minZoom) / Math.max(0.01, cam.maxZoom - cam.minZoom), 0, 1);
    // Yakında daha alçak mesafe — .glb silüetleri okunur
    const dist = MathUtils.lerp(1700, 260, zt);
    this.zt = zt;
    this.cx = cam.x;
    this.cy = cam.y;
    // Daha yatay M&B bakışı — 3D derinlik okunsun (eski 0.78 çok dik / “2D gibi” duruyordu)
    const pitch = 0.52;
    this.cam3.position.set(cam.x, elev + dist * pitch, cam.y + dist * 0.92);
    this.cam3.lookAt(cam.x, elev + 28, cam.y + dist * 0.02);
    this.sky.position.set(cam.x, elev, cam.y);
    // Gölge kutusu görüş alanını izler (yakınken keskin, çizim sayısı az); kayma olmasın diye texel'e oturt
    if (this.sun.castShadow) {
      const sc = this.sun.shadow.camera;
      const s = MathUtils.lerp(1500, 560, zt);
      if (Math.abs(sc.right - s) > 1) {
        sc.left = -s;
        sc.right = s;
        sc.top = s;
        sc.bottom = -s;
        sc.updateProjectionMatrix();
      }
    }
    const stp = (2 * (this.sun.shadow.camera.right || 2800)) / 2048;
    const sx = Math.round(cam.x / stp) * stp;
    const sy = Math.round(cam.y / stp) * stp;
    this.sun.position.set(sx + 800, 1600, sy - 500);
    this.sun.target.position.set(sx, elev, sy);
    this.sun.target.updateMatrixWorld();
    this.rim.position.set(cam.x - 600, 500, cam.y + 400);
    this.rim.target.position.set(cam.x, elev, cam.y);
    this.rim.target.updateMatrixWorld();
  }

  private dayLight(game: Game): void {
    const day = (game.s.time / DAY_SEC) % 1;
    const sunH = Math.sin(day * Math.PI * 2 - Math.PI / 2);
    const dayF = MathUtils.clamp(sunH * 0.5 + 0.5, 0.35, 1);
    this.dayF = dayF;
    this.sun.intensity = 0.8 + dayF * 1.1;
    this.rim.intensity = 0.25 + (1 - dayF) * 0.2;
    this.hemi.intensity = 0.3 + dayF * 0.22;
    this.amb.intensity = 0.16 + dayF * 0.1;
    // gece/şafak/gün: güneş rengi ayın mavisinden sıcak altına süzülür (okunaklı kalır, ama zaman hissedilir)
    const warm = MathUtils.smoothstep(dayF, 0.35, 0.75);
    this.sun.color.setRGB(0.62 + warm * 0.38, 0.7 + warm * 0.28, 0.95 + warm * 0.0 - warm * 0.12);
    this.sun.intensity *= 0.82 + warm * 0.18;
    // her zaman açık mavi-bej — asla siyah sis
    const fogCol = new Color().setHSL(0.58, 0.22, 0.52 + dayF * 0.12);
    (this.scene.fog as FogExp2).color.copy(fogCol);
    this.scene.background = fogCol;
    this.renderer.setClearColor(fogCol.getHex(), 1);
  }

  /** 2D’deki siyaset boyasının 3D karşılığı: halka + konveks dolgu/sınır + etiket. */
  private syncRealmPaint(game: Game): void {
    if (!game.s.free) {
      for (const m of this.realmRings.values()) m.visible = false;
      for (const l of this.realmLabels.values()) l.visible = false;
      for (const m of this.realmFills.values()) m.visible = false;
      for (const m of this.realmBorders.values()) m.visible = false;
      return;
    }
    const warFacs = new Set<FactionId>();
    for (const war of game.s.wd?.wars ?? []) {
      warFacs.add(war.a);
      warFacs.add(war.b);
    }
    for (const c of CITIES) {
      const own = !!game.s.owned[c.id];
      const fac = factionOf(c.id);
      const col = own ? "#ffd56a" : FACTIONS[fac].color;
      const war = !own && warFacs.has(fac);
      let ring = this.realmRings.get(c.id);
      if (!ring) {
        const geo = new RingGeometry(125, 205, 48);
        const mat = new MeshBasicMaterial({
          color: new Color(col),
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        });
        ring = new Mesh(geo, mat);
        ring.rotation.x = -Math.PI / 2;
        this.fxG.add(ring);
        this.realmRings.set(c.id, ring);
      }
      const elev = heightAt(this.world, c.x, c.y);
      ring.position.set(c.x, elev + 1.2, c.y);
      const mat = ring.material as MeshBasicMaterial;
      mat.color.set(col);
      const pulse = war ? 0.22 + Math.sin(this.time * 2.5) * 0.08 : 0.2;
      mat.opacity = pulse;
      ring.scale.setScalar(war ? 1.08 + Math.sin(this.time * 2.2) * 0.04 : 1);
      ring.visible = true;
      const m = this.cityM[CITIES.findIndex((x) => x.id === c.id)];
      if (m?.label) {
        const el = m.label.element as HTMLElement;
        el.style.color = col;
        const base = CITY_NAME[c.id] + (c.id === CAPITAL.id ? " ★" : "");
        el.textContent = war ? `${base} · ⚔` : base;
      }
      // sahip bayrağı + muhafız üniforması
      if (m) {
        const num = hexNum(col);
        if (m.model.flagMat && m.model.flagMat.color.getHex() !== num) m.model.flagMat.color.set(num);
        m.life?.setTeam(num);
      }
    }

    const paintHull = (key: string, pts: { x: number; y: number }[], hex: string, war: boolean, label: string) => {
      if (pts.length < 1) {
        this.realmFills.get(key) && (this.realmFills.get(key)!.visible = false);
        this.realmBorders.get(key) && (this.realmBorders.get(key)!.visible = false);
        const lb0 = this.realmLabels.get(key);
        if (lb0) lb0.visible = false;
        return;
      }
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      const elev = heightAt(this.world, cx, cy);
      const hull0 = convexHull(pts);
      if (hull0.length >= 3) {
        const hull = inflateHull(hull0, 160);
        // dolgu
        let fill = this.realmFills.get(key);
        const shape = new Shape();
        shape.moveTo(hull[0]!.x - cx, hull[0]!.y - cy);
        for (let i = 1; i < hull.length; i++) shape.lineTo(hull[i]!.x - cx, hull[i]!.y - cy);
        shape.closePath();
        const fillGeo = new ShapeGeometry(shape);
        if (!fill) {
          fill = new Mesh(
            fillGeo,
            new MeshBasicMaterial({
              color: new Color(hex),
              transparent: true,
              opacity: war ? 0.14 : 0.08,
              depthWrite: false,
              side: DoubleSide,
            }),
          );
          fill.rotation.x = -Math.PI / 2;
          this.fxG.add(fill);
          this.realmFills.set(key, fill);
        } else {
          fill.geometry.dispose();
          fill.geometry = fillGeo;
          const fm = fill.material as MeshBasicMaterial;
          fm.color.set(hex);
          fm.opacity = war ? 0.14 + Math.sin(this.time * 2.2) * 0.03 : 0.08;
        }
        fill.position.set(cx, elev + 0.6, cy);
        fill.visible = true;

        // sınır çizgisi (arazi yüksekliğine oturur)
        const pos: number[] = [];
        for (const p of hull) {
          pos.push(p.x, heightAt(this.world, p.x, p.y) + 3.5, p.y);
        }
        pos.push(hull[0]!.x, heightAt(this.world, hull[0]!.x, hull[0]!.y) + 3.5, hull[0]!.y);
        const lineGeo = new BufferGeometry();
        lineGeo.setAttribute("position", new Float32BufferAttribute(pos, 3));
        let border = this.realmBorders.get(key);
        if (!border) {
          border = new LineLoop(
            lineGeo,
            new LineBasicMaterial({
              color: new Color(hex),
              transparent: true,
              opacity: war ? 0.85 : 0.55,
              linewidth: 2,
            }),
          );
          this.fxG.add(border);
          this.realmBorders.set(key, border);
        } else {
          border.geometry.dispose();
          border.geometry = lineGeo;
          const bm = border.material as LineBasicMaterial;
          bm.color.set(hex);
          bm.opacity = war ? 0.75 + Math.sin(this.time * 2.5) * 0.12 : 0.55;
        }
        border.visible = true;
      }

      let lb = this.realmLabels.get(key);
      if (!lb) {
        lb = this.mkLabel(label, "w3d-realm");
        this.fxG.add(lb);
        this.realmLabels.set(key, lb);
      }
      (lb.element as HTMLElement).textContent = war ? `${label} ⚔` : label;
      (lb.element as HTMLElement).style.color = hex;
      lb.position.set(cx, elev + 130, cy);
      lb.visible = true;
    };

    for (const f of FACTION_KEYS) {
      const cities = citiesOf(f)
        .filter((id) => !game.s.owned[id])
        .map((id) => CITIES.find((c) => c.id === id)!);
      paintHull(f, cities, FACTIONS[f].color, warFacs.has(f), FACTIONS[f].short);
    }
    const mine = CITIES.filter((c) => game.s.owned[c.id]);
    paintHull("me", mine, "#ffd56a", false, tr("Senin toprakların"));
  }

  // ───────────────────────── birimler ─────────────────────────

  private heroSync(game: Game): void {
    const s = game.s;
    const h = s.hero;
    const at = s.free ? h.equip.at?.icon ?? "" : "";
    const mount = !at ? 0 : at === "mount_3" ? 3 : at === "mount_2" ? 2 : 1;
    const cls = s.cls ?? "alp";
    const key = `${cls}|${s.free}|${mount}`;
    if (key !== this.heroKey) {
      this.heroKey = key;
      const a = buildHero({ cls, free: s.free, mount });
      a.root.scale.multiplyScalar(ACTOR_MUL * 1.3);
      a.height *= ACTOR_MUL * 1.3;
      this.heroBase = a.root.scale.x;
      this.heroU.setLeader(a, 46);
    }
    const f = troopFormation(h.army, 0xb83a24, 1, 9);
    // Yoldaşlar kahramanın hemen arkasında yürür (en çok 3), askerler onların ardından.
    const raw = s.free ? ((s.comps ?? []) as string[]).slice(0, 3) : [];
    const esc = s.escort && raw.includes(s.escort) ? s.escort : null;
    const comps = esc ? [esc, ...raw.filter((id) => id !== esc)] : raw;
    const compMakers = comps.map((id) => () => {
      const c = buildCompanion(id);
      const mul = id === esc ? ACTOR_MUL * 1.18 : ACTOR_MUL * 1.05;
      c.root.scale.multiplyScalar(mul);
      c.height *= mul;
      return c;
    });
    this.heroU.setFollowers("h|" + comps.join(",") + "|" + (esc ?? "") + "|" + f.sig, [...compMakers, ...f.makers], { spacing: esc ? 28 : 34, spread: esc ? 22 : 26 });
    this.heroU.setName(`${h.name} · ${armySize(h.army)}`);
    this.heroU.update(this.dtv, this.time, h.x, h.y, true);
    if (this.heroU.leader) {
      const pulse = this.levelT > 0 ? 1 + Math.sin(this.levelT * 10) * 0.1 : 1;
      this.heroU.leader.root.scale.setScalar(this.heroBase * pulse);
    }
  }

  private dtv = 0.016;

  private syncBandits(game: Game): void {
    const live = new Set<number>();
    for (const b of game.s.bandits) {
      live.add(b.id);
      let u = this.bandits.get(b.id);
      const camp = game.s.camps[b.camp];
      if (!u) {
        u = new Unit3D("bandit", camp?.name ?? tr("Harami"), this.elev);
        const look = banditLook(b.id) as BanditKind;
        const a = buildBandit(look, b.id);
        a.root.scale.multiplyScalar(ACTOR_MUL);
        a.height *= ACTOR_MUL;
        u.setLeader(a, a.height * 0.46);
        this.unitsG.add(u.root);
        this.bandits.set(b.id, u);
      }
      const near = Math.hypot(b.x - this.cx, b.y - this.cy) < 1500;
      const f = banditFormation(b.army, b.id);
      if (near || u.followersBuilt) u.setFollowers("b|" + f.sig, f.makers, { spacing: 28, spread: 22 });
      u.setName(`${camp?.name ?? tr("Çete")} · ${armySize(b.army)}`);
      u.update(this.dtv, this.time, b.x, b.y, near);
      u.root.visible = game.isExplored(b.x, b.y);
      (u.label.element as HTMLElement).style.display = this.zt > 0.1 ? "" : "none";
    }
    for (const [id, u] of this.bandits) {
      if (!live.has(id)) {
        this.unitsG.remove(u.root);
        disposeTree(u.root);
        u.label.element.remove();
        this.bandits.delete(id);
      }
    }
  }

  private syncCaravans(game: Game): void {
    const live = new Set<number>();
    for (const cv of game.s.caravans) {
      live.add(cv.id);
      let u = this.caravans.get(cv.id);
      const fac = FACTIONS[cv.fac as keyof typeof FACTIONS];
      const col = fac ? hexNum(fac.color) : 0x7a5a2a;
      if (!u) {
        u = new Unit3D("caravan", tr("Kervan"), this.elev);
        const a = buildCamel(cv.id, 6);
        a.root.scale.multiplyScalar(ACTOR_MUL);
        a.height *= ACTOR_MUL;
        u.setLeader(a, 34);
        this.unitsG.add(u.root);
        this.caravans.set(cv.id, u);
      }
      const near = Math.hypot(cv.x - this.cx, cv.y - this.cy) < 1500;
      const f = caravanFormation(cv.guard, col, cv.id);
      if (near || u.followersBuilt) u.setFollowers("c|" + f.sig, f.makers, { spacing: 46, column: true });
      u.setName(`${fac?.short ?? tr("Kervan")} → ${CITY_NAME[cv.to] ?? cv.to}`);
      u.update(this.dtv, this.time, cv.x, cv.y, near);
      u.root.visible = game.isExplored(cv.x, cv.y);
      (u.label.element as HTMLElement).style.display = this.zt > 0.2 ? "" : "none";
    }
    for (const [id, u] of this.caravans) {
      if (!live.has(id)) {
        this.unitsG.remove(u.root);
        disposeTree(u.root);
        u.label.element.remove();
        this.caravans.delete(id);
      }
    }
  }

  private syncBosses(game: Game): void {
    AREA_BOSSES.forEach((b, i) => {
      const e = this.bosses.get(b.id);
      if (!e) return;
      const alive = game.denAlive?.(i) ?? true;
      const visible = game.isExplored(e.lx, e.ly) && alive;
      e.u.root.visible = visible;
      e.u.setName(alive ? b.name : `${b.name} · ${tr("uyuyor")}`);
      if (!visible) return;
      // inine yakın devriye: lair etrafında yavaş 8 şekli
      let tx = e.lx;
      let ty = e.ly;
      if (e.patrol) {
        const k = this.time * 0.1 + e.ph;
        tx += Math.cos(k) * 95;
        ty += Math.sin(k * 2) * 55;
      }
      e.px += (tx - e.px) * Math.min(1, this.dtv * 3);
      e.py += (ty - e.py) * Math.min(1, this.dtv * 3);
      e.u.update(this.dtv, this.time, e.px, e.py, true);
    });
  }

  private syncRivals(game: Game): void {
    const live = new Set<string>();
    for (const r of game.s.rivals) {
      if (r.status === "dead") continue;
      live.add(r.id);
      const col = r.status === "war" ? 0x8a2a1a : r.status === "ally" ? 0x2a6a38 : 0x2f4f9a;
      let e = this.rivals.get(r.id);
      if (!e) {
        const u = new Unit3D("rival", `${r.name} ${r.title}`, this.elev);
        const a = buildSoldier("cav", col, r.id.length * 7 + 3);
        a.root.scale.multiplyScalar(ACTOR_MUL * 1.12);
        a.height *= ACTOR_MUL * 1.12;
        u.setLeader(a, 44);
        this.unitsG.add(u.root);
        e = { u, sig: "" };
        this.rivals.set(r.id, e);
      }
      const near = Math.hypot(r.x - this.cx, r.y - this.cy) < 1500;
      const tot = armySize(r.army);
      const f = troopFormation(r.army, col, r.id.length, 7);
      if (near || e.u.followersBuilt) e.u.setFollowers("r|" + f.sig, f.makers, { spacing: 32, spread: 24 });
      e.u.setName(`${r.name} ${r.title}${tot > 0 ? ` · ${tot}` : ""}`);
      e.u.update(this.dtv, this.time, r.x, r.y, near);
      e.u.root.visible = game.isExplored(r.x, r.y);
    }
    for (const [id, e] of this.rivals) {
      if (!live.has(id)) {
        this.unitsG.remove(e.u.root);
        disposeTree(e.u.root);
        e.u.label.element.remove();
        this.rivals.delete(id);
      }
    }
  }

  private syncMarches(game: Game): void {
    const live = new Set<number>();
    for (const m of game.s.marches) {
      live.add(m.id);
      let u = this.marches.get(m.id);
      if (!u) {
        u = new Unit3D("march", "", this.elev);
        const a = buildSoldier("spear", 0xb83a24, m.id + 5);
        a.root.scale.multiplyScalar(ACTOR_MUL);
        a.height *= ACTOR_MUL;
        u.setLeader(a, 34);
        this.unitsG.add(u.root);
        this.marches.set(m.id, u);
      }
      const near = Math.hypot(m.x - this.cx, m.y - this.cy) < 1500;
      const f = troopFormation(m.army, 0xb83a24, m.id, 5);
      if (near || u.followersBuilt) u.setFollowers("m|" + f.sig, f.makers, { spacing: 30, spread: 22 });
      u.setName(m.phase === "gather" ? `⛏ ${Math.max(0, Math.ceil((m.until - Date.now()) / 1000))}sn` : m.phase === "back" ? `↩ ${Math.round(m.load)}` : `→ ${armySize(m.army)}`);
      u.update(this.dtv, this.time, m.x, m.y, near);
    }
    for (const [id, u] of this.marches) {
      if (!live.has(id)) {
        this.unitsG.remove(u.root);
        disposeTree(u.root);
        u.label.element.remove();
        this.marches.delete(id);
      }
    }
  }

  // ───────────────────────── gemiler ─────────────────────────

  private ship(i: number, kind: "dhow" | "pirate", x: number, z: number, yaw: number, speed: number, scale = 1): void {
    let e = this.shipPool[i];
    if (!e || e.kind !== kind) {
      if (e) {
        this.shipsG.remove(e.model.root);
        disposeTree(e.model.root);
      }
      const model = buildShip(kind);
      overlayGlb(model.root, kind === "pirate" ? "ship_pirate" : "ship");
      e = { model, kind, used: false };
      this.shipPool[i] = e;
      this.shipsG.add(e.model.root);
    }
    e.used = true;
    e.model.root.visible = true;
    e.model.root.position.set(x, -0.6, z);
    e.model.root.rotation.y = yaw;
    e.model.root.scale.setScalar(scale);
    e.model.tick(this.time, speed);
  }

  private syncShips(game: Game): void {
    const s = game.s;
    for (const e of this.shipPool) if (e) e.used = false;
    let used = 0;
    const put = (kind: "dhow" | "pirate", x: number, z: number, yaw: number, speed: number, sc = 1) => {
      // Sis açılmamış olsa da kameraya yakın deniz gemilerini göster (glb doğrulama)
      if (!game.isExplored(x, z) && Math.hypot(x - this.cx, z - this.cy) > 2200) return;
      this.ship(used++, kind, x, z, yaw, speed, sc);
    };
    const vy = s.fleet.voyage;
    if (vy) {
      const pts = seaPath(vy.from, vy.to, W, H);
      const k = (s.time - vy.at) / vy.dur;
      const p = alongPath(pts, k);
      const p2 = alongPath(pts, k + 0.02);
      const yaw = Math.atan2(p2.x - p.x, p2.y - p.y) || (p.dx > 0 ? Math.PI / 2 : -Math.PI / 2);
      const n = Math.max(1, Math.min(3, s.fleet.ships));
      for (let i = 0; i < n; i++) {
        const sx = Math.sin(yaw);
        const sz = Math.cos(yaw);
        put("dhow", p.x - sx * i * 90 + sz * i * 26, p.y - sz * i * 90 - sx * i * 26, yaw, 1, 1.15 - i * 0.08);
      }
    } else if (s.fleet.ships > 0) {
      for (const pm of this.pierM) {
        for (let i = 0; i < Math.min(2, s.fleet.ships); i++) {
          const off = (i % 2 ? 1 : -1) * (48 + i * 40);
          put("dhow", pm.dock.x + Math.cos(pm.dir) * off + Math.sin(pm.dir) * 20, pm.dock.y - Math.sin(pm.dir) * off + Math.cos(pm.dir) * 20, pm.dir + (i ? 0.15 : -0.1), 0, 1.1);
        }
      }
    }
    const lanes: [string, string, number][] = [["tabriz", "rey", 0], ["rey", "bukhara", 0.37], ["tabriz", "bukhara", 0.71], ["tabriz", "constantinople", 0.2], ["tabriz", "constantinople", 0.66]];
    lanes.forEach(([a, b, off], i) => {
      const pts = seaPath(a, b, W, H);
      const ph = (this.time / (90 + i * 13) + off) % 2;
      const k = ph < 1 ? ph : 2 - ph;
      const p = alongPath(pts, 0.08 + k * 0.84);
      const q = alongPath(pts, 0.08 + (ph < 1 ? k + 0.02 : k - 0.02) * 0.84);
      const yaw = Math.atan2(q.x - p.x, q.y - p.y);
      put(i % 3 === 2 ? "pirate" : "dhow", p.x + 40, p.y - 30 + i * 8, yaw, 0.7, 1.0);
    });
    for (let i = used; i < this.shipPool.length; i++) {
      const e = this.shipPool[i];
      if (e) e.model.root.visible = false;
    }
  }

  // ───────────────────────── ana güncelleme ─────────────────────────

  private syncPlaces(game: Game, dt: number): void {
    const s = game.s;
    const dist = (m: PlaceMark) => Math.hypot(m.wx - this.cx, m.wy - this.cy);
    const lod = (m: PlaceMark, minZt: number) => {
      if (m.label) {
        const on = this.zt >= minZt;
        (m.label.element as HTMLElement).style.display = on ? "" : "none";
        m.label.visible = on && dist(m) < 1500 + this.zt * 900;
      }
    };
    const live = (m: PlaceMark, near = 850) => {
      const d = dist(m);
      // Yer .glb: yakında yükle, uzaklaşınca boşalt (60MB×N VRAM / FPS)
      const loadR =
        m.kind === "city" || m.kind === "fort"
          ? 3600
          : m.kind === "village" || m.kind === "camp"
            ? 1600
            : Math.max(near * 1.6, 1100);
      const unloadR = loadR * 1.85;
      if (m.glb && !m.glbOn && d < loadR) {
        m.glbOn = true;
        overlayGlb(m.model.root, m.glb);
      } else if (m.glb && m.glbOn && d > unloadR) {
        m.glbOn = false;
        clearGlb(m.model.root);
      }
      const on = d < this.sun.shadow.camera.right * 0.9;
      if (on !== m.shOn) {
        m.shOn = on;
        m.model.root.traverse((o) => {
          if (!(o as Mesh).isMesh) return;
          if (o.userData.sh === undefined) o.userData.sh = o.castShadow;
          o.castShadow = on && o.userData.sh;
        });
      }
      for (const f of m.model.anim) f(this.time);
      m.life?.update(dt, this.time, this.zt > 0.3 && d < near * (0.45 + 0.55 * this.zt));
    };

    this.cityM.forEach((m) => {
      m.root.visible = true;
      live(m, 1100);
    });
    this.campM.forEach((m, i) => {
      const c = s.camps[i];
      if (!c) return;
      const sig = `${c.alive}|${c.tier}`;
      if (sig !== m.sig) this.swapModel(m, buildCamp(i * 5 + 1, c.tier, c.alive), sig);
      m.root.visible = game.isExplored(c.x, c.y);
      if (m.label) (m.label.element as HTMLElement).textContent = c.alive ? c.name : `${c.name} · ${tr("harabe")}`;
      lod(m, 0.2);
      if (m.root.visible) live(m, 800);
    });
    this.villageM.forEach((m, i) => {
      const v = s.villages[i];
      if (!v) return;
      const st = v.state === "ruined" ? 2 : v.state === "raided" ? 1 : 0;
      if (String(st) !== m.sig) this.swapModel(m, v.yurt ? buildYurtCamp(i * 7 + 3, st as 0 | 1 | 2) : buildVillage(i * 7 + 3, st as 0 | 1 | 2), String(st));
      m.root.visible = game.isExplored(v.x, v.y);
      lod(m, 0.16);
      if (m.root.visible) live(m, 800);
    });
    this.fortM.forEach((m, i) => {
      const f = s.forts[i];
      if (!f) return;
      const col = this.fortCol(f.owner);
      if (`${f.tier}` !== m.sig) this.swapModel(m, buildFort(f.tier, i * 7 + 2, col), `${f.tier}`, col);
      m.root.visible = game.isExplored(f.x, f.y);
      const css = f.owner === "me" ? "#ffd36a" : f.owner === "harami" ? "#ff8a70" : FACTIONS[f.owner as FactionId]?.color ?? "#eee";
      if (m.label) {
        (m.label.element as HTMLElement).textContent = `${f.name} · ${tr(FORT_TIERS[f.tier].name)}`;
        (m.label.element as HTMLElement).style.color = css;
      }
      if (m.model.flagMat && m.model.flagMat.color.getHex() !== col) m.model.flagMat.color.set(col);
      m.life?.setTeam(col);
      lod(m, 0.04);
      if (m.root.visible) live(m, 900);
    });
    this.kurganM.forEach((m, i) => {
      const k = s.kurgans[i];
      if (!k) return;
      if (`${k.alive}` !== m.sig) this.swapModel(m, buildKurgan(i * 3 + 1, k.tier, k.alive), `${k.alive}`);
      m.root.visible = game.isExplored(k.x, k.y);
      lod(m, 0.3);
      if (m.root.visible) live(m, 700);
    });
    this.nodeM.forEach((m, i) => {
      const nd = s.nodes[i];
      if (!nd) return;
      m.root.visible = game.isExplored(nd.x, nd.y);
      if (m.root.visible) live(m, 600);
    });
    this.ruinM.forEach((m, i) => {
      const r = s.ruins[i];
      if (!r) return;
      m.root.visible = game.isExplored(r.x, r.y) && !r.looted;
      if (m.root.visible) live(m, 700);
    });
    this.oasisM.forEach((m) => {
      m.root.visible = game.isExplored(m.wx, m.wy);
      lod(m, 0.25);
      if (m.root.visible) live(m, 600);
    });
    const calm = (s.fleet.calm ?? 0) > s.time;
    for (const m of this.nestM) {
      const sig = calm ? "calm" : "alive";
      if (sig !== m.sig) {
        this.swapModel(m, buildPirateNest(calm), sig, 0x2a2420);
        m.root.position.y = Math.max(m.root.position.y, 0);
      }
      m.root.visible = game.isExplored(m.wx, m.wy);
      lod(m, 0.2);
      if (m.root.visible) live(m, 800);
    }
    for (const pm of this.pierM) {
      pm.m.root.visible = game.isExplored(pm.dock.x, pm.dock.y);
      if (pm.m.root.visible) live(pm.m, 800);
    }
  }

  private propsG: Group | null = null;
  private ray = new Raycaster();
  private rayPlane = new Plane(new Vector3(0, 1, 0), 0);
  private rayHit = new Vector3();

  pickGround(sx: number, sy: number, lift = 0): { x: number; y: number } | null {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.cam3.updateMatrixWorld();
    this.ray.setFromCamera({ x: (sx / w) * 2 - 1, y: -(sy / h) * 2 + 1 } as Vector2, this.cam3);
    let elev = heightAt(this.world, this.cx, this.cy);
    for (let i = 0; i < 4; i++) {
      this.rayPlane.constant = -(elev + lift);
      if (!this.ray.ray.intersectPlane(this.rayPlane, this.rayHit)) return null;
      elev = heightAt(this.world, this.rayHit.x, this.rayHit.z);
    }
    return { x: this.rayHit.x, y: this.rayHit.z };
  }

  private startMs = 0;
  private lastMs = 0;
  private avgMs = 16;
  private slowN = 0;
  private degrade = 0;

  update(dt: number, game: Game, cam: Camera): void {
    this.time += dt;
    this.dtv = Math.max(0.001, Math.min(0.1, dt));
    // Yavaş cihazda otomatik sadeleşme: kare süresi uzun kalırsa gölge, sonra çözünürlük düşer
    const nowMs = performance.now();
    if (!this.startMs) this.startMs = nowMs;
    if (this.lastMs && nowMs - this.startMs > 12000) {
      const real = Math.min(120, nowMs - this.lastMs);
      this.avgMs += (real - this.avgMs) * 0.04;
      this.slowN = this.avgMs > 40 ? this.slowN + 1 : Math.max(0, this.slowN - 2);
      if (this.slowN > 180 && this.degrade < 3) {
        this.degrade++;
        this.slowN = 0;
        if (this.degrade === 1) this.cine.enabled = false;
        else if (this.degrade === 2) this.sun.castShadow = false;
        else this.renderer.setPixelRatio(Math.max(0.75, this.renderer.getPixelRatio() * 0.75));
      }
    }
    this.lastMs = nowMs;
    this.syncCam(cam);
    if (this.propsG) fadePeaks(this.propsG, cam.x, cam.y);
    this.dayLight(game);
    this.cine.tick(this.time);
    if (this.fogDirty) {
      this.fogDirty = false;
      this.paintFog(game);
    }

    this.heroSync(game);
    this.ambient?.update(this.dtv, game.s.hero.x, game.s.hero.y, this.cx, this.cy, this.elev, this.dayF, this.zt);
    this.syncPlaces(game, this.dtv);
    this.syncRealmPaint(game);
    this.syncBandits(game);
    this.syncCaravans(game);
    this.syncBosses(game);
    this.syncRivals(game);
    this.syncMarches(game);
    this.syncShips(game);

    if (this.markT > 0) {
      this.markT -= dt;
      if (this.markSpr) {
        this.markSpr.visible = this.markT > 0;
        this.markSpr.position.y += Math.sin(this.time * 6) * 0.4;
      }
    }
    if (this.craftT > 0) this.craftT -= dt;
    if (this.levelT > 0) this.levelT -= dt;

    this.renderFrame();
  }

  renderFrame(): void {
    this.cine.render(() => {
      this.renderer.render(this.scene, this.cam3);
    });
    this.labelRenderer.render(this.scene, this.cam3);
    if ((this.declutterN = (this.declutterN + 1) % 8) === 0) this.declutterLabels();
  }

  private declutterN = 0;

  /** Üst üste binen etiketlerden öncelikli olanı (kahraman > yer adı > birlik) bırakır, diğerini gizler. */
  private declutterLabels(): void {
    const els = Array.from(this.labelRenderer.domElement.querySelectorAll<HTMLElement>(".w3d-label"));
    type Item = { el: HTMLElement; pr: number; r: DOMRect };
    const items: Item[] = [];
    for (const el of els) {
      if (el.classList.contains("w3d-realm")) continue;
      if (el.style.display === "none") continue;
      const pr = el.classList.contains("hero") ? 0 : el.classList.contains("token") && !el.classList.contains("boss") ? 2 : 1;
      el.style.visibility = "";
      const r = el.getBoundingClientRect();
      if (r.width < 2) continue;
      items.push({ el, pr, r });
    }
    items.sort((a, b) => a.pr - b.pr);
    const kept: DOMRect[] = [];
    for (const it of items) {
      const r = it.r;
      const hit = kept.some((k) => r.left < k.right - 2 && r.right > k.left + 2 && r.top < k.bottom - 1 && r.bottom > k.top + 1);
      if (hit && it.pr > 0) it.el.style.visibility = "hidden";
      else kept.push(r);
    }
  }
}
