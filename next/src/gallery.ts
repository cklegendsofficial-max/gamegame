import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { buildBandit, buildBoss, buildCamel, buildCompanion, buildHero, buildNpc, buildSoldier, buildWolf, type Actor } from "./render/world3d/Actors3D";
import type { PlaceModel } from "./render/world3d/Build";
import { buildCity } from "./render/world3d/Cities3D";
import { buildPier, buildPirateNest, buildShip } from "./render/world3d/Ships3D";
import { PlaceLife } from "./render/world3d/Population3D";
import { buildCamp, buildFort, buildKurgan, buildNode, buildOasis, buildRuin, buildVillage, buildYurtCamp } from "./render/world3d/Settlements3D";

/** Geliştirme aracı: modelleri tek sayfada görmek için (gallery.html?set=heroes). */

const q = new URLSearchParams(location.search);
const set = q.get("set") ?? "heroes";
const sp = parseFloat(q.get("sp") ?? "0");
const camZ = parseFloat(q.get("z") ?? "0");
const camH = parseFloat(q.get("h") ?? "1");
const only = q.get("only");

const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color(0x8fb4d0);
scene.fog = new Fog(0x8fb4d0, 700, 2400);
scene.add(new HemisphereLight(0xdfeeff, 0x6a5a40, 0.85));
scene.add(new AmbientLight(0xffffff, 0.15));
const sun = new DirectionalLight(0xfff1d6, 2.3);
sun.position.set(-260, 420, 300);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -500;
sun.shadow.camera.right = 500;
sun.shadow.camera.top = 400;
sun.shadow.camera.bottom = -400;
sun.shadow.camera.far = 1400;
scene.add(sun);
const ground = new Mesh(new PlaneGeometry(4000, 4000), new MeshStandardMaterial({ color: 0x6e8a4a, roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const actors: { a: Actor; baseX: number; baseZ: number; path: boolean }[] = [];
const places: { p: PlaceModel; life: PlaceLife }[] = [];
const root = new Group();
scene.add(root);

type Entry = [string, () => Actor | PlaceModel, number?];
const SETS: Record<string, Entry[]> = {
  heroes: [
    ["alp", () => buildHero({ cls: "alp", free: true })],
    ["bahadir", () => buildHero({ cls: "bahadir", free: true })],
    ["suikastci", () => buildHero({ cls: "suikastci", free: true })],
    ["hirsiz", () => buildHero({ cls: "hirsiz", free: true })],
    ["kam", () => buildHero({ cls: "kam", free: true })],
    ["köle", () => buildHero({ free: false })],
    ["alp+at", () => buildHero({ cls: "alp", mount: 2 }), 1.6],
    ["bahadir+at3", () => buildHero({ cls: "bahadir", mount: 3 }), 1.6],
  ],
  companions: ["ayse", "batu", "ferhat", "korkut", "leyla", "lucia"].map((id): Entry => [id, () => buildCompanion(id)]),
  troops: [
    ["mızrak", () => buildSoldier("spear", 0xb02a1a, 3)],
    ["okçu", () => buildSoldier("archer", 0xb02a1a, 5)],
    ["kılıç", () => buildSoldier("sword", 0xb02a1a, 7)],
    ["atlı", () => buildSoldier("cav", 0xb02a1a, 9), 1.6],
    ["rakip", () => buildSoldier("spear", 0x2a5aa0, 11)],
    ["moğol", () => buildSoldier("archer", 0x2a2a2a, 13)],
  ],
  bandits: [
    ["kılıç", () => buildBandit("sword", 2)],
    ["balta", () => buildBandit("axe", 4)],
    ["ağır", () => buildBandit("heavy", 6)],
    ["şef", () => buildBandit("chief", 8)],
    ["atlı", () => buildBandit("rider", 10), 1.6],
    ["kurt", () => buildWolf(3), 1.3],
  ],
  npcs: [
    ["tüccar", () => buildNpc("merchant", 1)],
    ["demirci", () => buildNpc("blacksmith", 1)],
    ["hancı", () => buildNpc("innkeeper", 1)],
    ["gözcü", () => buildNpc("scout", 1)],
    ["bekçi", () => buildNpc("guard", 1)],
    ["ihtiyar", () => buildNpc("elder", 1)],
    ["köylü1", () => buildNpc("villager", 3)],
    ["köylü2", () => buildNpc("villager", 7)],
    ["köylü3", () => buildNpc("villager", 12)],
    ["hamal", () => buildNpc("porter", 5)],
    ["deve", () => buildCamel(2, 4), 2],
  ],
  places: [
    ["koy", () => buildVillage(3), 1.7],
    ["koy-yagma", () => buildVillage(3, 1), 1.7],
    ["yurt", () => buildYurtCamp(4), 1.7],
    ["kamp1", () => buildCamp(5, 1, true), 1.5],
    ["kamp3", () => buildCamp(6, 3, true), 1.5],
    ["kamp-olu", () => buildCamp(5, 2, false), 1.5],
  ],
  places2: [
    ["kule", () => buildFort(1, 3, 0xe0b04a), 1.6],
    ["palanka", () => buildFort(2, 4, 0x5aa8ff), 2.2],
    ["kale", () => buildFort(3, 5, 0xc07cff), 2.6],
    ["hisar", () => buildFort(4, 6, 0xff6a4a), 3.2],
  ],
  cities: ["samarkand", "bukhara", "nishapur", "merv", "kashgar", "rey", "tabriz", "konya", "constantinople"].map((id): Entry => [id, () => buildCity(id, id === "samarkand", 0xe0b04a), 3.6]),
  ships: [
    ["dhow", () => { const s = buildShip("dhow"); s.root.rotation.y = 1.15; return { root: s.root, anim: [(t: number) => s.tick(t, 0.5)], npcs: [], radius: 40 } as PlaceModel; }, 1.4],
    ["pirate", () => { const s = buildShip("pirate"); s.root.rotation.y = 1.15; return { root: s.root, anim: [(t: number) => s.tick(t, 0.5)], npcs: [], radius: 40 } as PlaceModel; }, 1.4],
    ["iskele", () => buildPier(), 1.5],
    ["yuva", () => buildPirateNest(false), 1.7],
  ],
  places3: [
    ["kurgan", () => buildKurgan(2, 2, true), 1.6],
    ["vaha", () => buildOasis(3), 1.9],
    ["harabe", () => buildRuin(4), 1.4],
    ["altin", () => buildNode("gold", 1), 1.3],
    ["tas", () => buildNode("stone", 2), 1.3],
    ["orman", () => buildNode("wood", 3), 1.3],
    ["tarla", () => buildNode("food", 4), 1.3],
  ],
  bosses: ["karakoncolos", "yelbegen", "fedai", "akbars", "sahmeran", "evren", "akrep"].map((id): Entry => [id, () => buildBoss(id), 2]),
};

const onlySet = only ? only.split(",") : null;
const entries = (SETS[set] ?? SETS.heroes).filter((e) => !onlySet || onlySet.includes(e[0]));
let x = 0;
const gap = parseFloat(q.get("gap") ?? "0") || 0;
const total = entries.reduce((s, e) => s + (e[2] ?? 1) * 70 + gap, 0);
x = -total / 2;
const label: string[] = [];
for (const [name, mk, w] of entries) {
  const a0 = mk();
  const span = (w ?? 1) * 70 + gap;
  if ("npcs" in a0) {
    a0.root.position.set(x + span / 2, 0, 0);
    root.add(a0.root);
    places.push({ p: a0, life: new PlaceLife(a0) });
    label.push(name);
    x += span;
    continue;
  }
  const a = a0;
  a.root.position.set(x + span / 2, 0, 0);
  a.face(parseFloat(q.get("yaw") ?? "0.35"));
  root.add(a.root);
  actors.push({ a, baseX: x + span / 2, baseZ: 0, path: sp > 0 });
  label.push(name);
  x += span;
}
document.getElementById("lbl")!.textContent = `${set}: ${label.join(" · ")}`;

const cam = new PerspectiveCamera(32, innerWidth / innerHeight, 1, 5000);
const span = Math.max(220, total);
const el = (parseFloat(q.get("el") ?? "10") * Math.PI) / 180;
const dist = 60 + span * 1.0 + camZ;
cam.position.set(0, 45 * camH + Math.sin(el) * dist, Math.cos(el) * dist);
cam.lookAt(0, 45 * camH, 0);
addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
});

let last = performance.now();
let t = 0;
function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  for (const pl of places) {
    for (const f of pl.p.anim) f(t);
    pl.life.update(dt, t, true);
  }
  for (const e of actors) {
    if (e.path) {
      const R = 28;
      const w = (sp * 70) / R;
      const wx = e.baseX + Math.cos(t * w) * R;
      const wz = Math.sin(t * w) * R;
      e.a.follow(wx, 0, wz, dt, t);
    } else {
      e.a.update(dt, 0, t);
    }
  }
  renderer.render(scene, cam);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
(window as unknown as { __gal: unknown }).__gal = { actors, scene, cam, renderer };
