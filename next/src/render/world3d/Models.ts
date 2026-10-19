/**
 * İsteğe bağlı .glb model katmanı.
 * `src/assets/models/<anahtar>.glb` varsa prosedürel modelin üstüne biner.
 * Aktörler: local ~2 birim (root.scale UNIT). Yer/gemi: dünya birimi.
 * İnce ayar: `fort@1.4.glb`
 */
import { Box3, Group, Mesh, SRGBColorSpace, Vector3, type Object3D, type Texture } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const files = import.meta.glob("../../assets/models/*.glb", { query: "?url", import: "default", eager: false }) as Record<string, () => Promise<string>>;

const table = new Map<string, { load: () => Promise<string>; scale: number }>();
for (const path in files) {
  const base = path.split("/").pop()!.replace(/\.glb$/, "");
  const [key, sc] = base.split("@");
  table.set(key, { load: files[path], scale: sc ? Number(sc) || 1 : 1 });
}

function fitHeight(key: string): number {
  if (key === "soldier_cav" || key === "bandit_rider" || key === "camel") return 2.8;
  if (key === "horse") return 1.6;
  if (/^(hero_|comp_|soldier_|bandit_|boss_)/.test(key)) return 2.05;
  // Yer modelleri biraz yüksek — uzak kamerada silüet okunsun
  if (key.startsWith("city") || key === "fort") return 140;
  if (key === "village" || key === "camp" || key === "yurts" || key === "pirate") return 78;
  if (key === "kurgan" || key === "oasis" || key === "ruin") return 56;
  if (key === "node") return 36;
  if (key === "pier") return 22;
  if (key.startsWith("ship")) return 32;
  return 70;
}

const cache = new Map<string, Promise<Object3D | null>>();
let loader: GLTFLoader | null = null;

export function hasGlb(key: string): boolean {
  return table.has(key);
}

export function glbKeys(): string[] {
  return [...table.keys()];
}

export function glbCount(): number {
  return table.size;
}

function prepMats(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = true;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      if (!mat) continue;
      const std = mat as { map?: Texture; color?: { r: number }; transparent?: boolean; opacity?: number; needsUpdate?: boolean };
      if (std.map) {
        std.map.colorSpace = SRGBColorSpace;
        std.map.needsUpdate = true;
      }
      if (std.transparent && (std.opacity ?? 1) < 0.05) std.opacity = 1;
      std.needsUpdate = true;
    }
  });
}

/** Anahtara karşılık gelen modelin kopyası (yoksa null). Ayak y=0. */
export async function loadGlb(key: string): Promise<Object3D | null> {
  const ent = table.get(key);
  if (!ent) return null;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      try {
        loader ??= new GLTFLoader();
        const url = await ent.load();
        const g = await loader.loadAsync(url);
        const root = new Group();
        root.add(g.scene);
        let box = new Box3().setFromObject(root);
        const h0 = Math.max(0.001, box.max.y - box.min.y);
        g.scene.scale.setScalar((fitHeight(key) / h0) * ent.scale);
        box = new Box3().setFromObject(root);
        const c = box.getCenter(new Vector3());
        g.scene.position.set(-c.x, -box.min.y, -c.z);
        prepMats(root);
        root.userData.glbOverlay = true;
        root.userData.glbKey = key;
        return root;
      } catch (e) {
        console.warn(`GLB yüklenemedi: ${key}`, e);
        return null;
      }
    })();
    cache.set(key, p);
  }
  const base = await p;
  if (!base) return null;
  const copy = base.clone(true);
  copy.userData.glbOverlay = true;
  copy.userData.glbKey = key;
  return copy;
}

function disposeOverlay(o: Object3D): void {
  o.traverse((n) => {
    const mesh = n as Mesh;
    if (mesh.isMesh) mesh.geometry?.dispose();
  });
}

/**
 * Prosedürel çocukları gizler (PlaceLife / ateş `userData.keep` hariç), glb ekler.
 * Aynı anahtar zaten duruyorsa no-op.
 */
export function overlayGlb(host: Object3D, key: string): void {
  if (!table.has(key)) return;
  if (host.userData.glbKey === key && host.children.some((c) => c.userData.glbOverlay && c.visible)) return;
  host.userData.glbKey = key;
  void loadGlb(key).then((m) => {
    if (!m) return;
    if (!host.parent && host.children.length === 0) return;
    for (const c of [...host.children]) {
      if (c.userData.glbOverlay) {
        host.remove(c);
        disposeOverlay(c);
      } else if (!c.userData.keep) {
        c.visible = false;
      }
    }
    m.visible = true;
    host.add(m);
  });
}

/** Uzak yerlerden .glb'yi kaldır, prosedürel görünümü geri aç (VRAM). */
export function clearGlb(host: Object3D): void {
  let had = false;
  for (const c of [...host.children]) {
    if (c.userData.glbOverlay) {
      host.remove(c);
      disposeOverlay(c);
      had = true;
    } else if (!c.userData.keep) {
      c.visible = true;
    }
  }
  if (had) delete host.userData.glbKey;
}

/** Küçük aktör glb'lerini arka planda ısıt (harita 60MB'ları değil). */
export function preloadActorGlbs(): void {
  for (const k of table.keys()) {
    if (/^(hero_|comp_|soldier_|bandit_|boss_|camel|horse|ship)/.test(k)) void loadGlb(k);
  }
}
