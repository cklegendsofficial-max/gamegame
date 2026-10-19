import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector2,
  Vector3,
  Euler,
  Sprite,
  SpriteMaterial,
  type Texture,
} from "three";
import { CITIES, GH, GW, H, W, type World } from "../../world/gen";
import { heightAt } from "./Terrain3D";
import type { CineTextures } from "./CineKit";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded } from "./Kit";

/** Ağaç + dağ billboard ormanı — Hollywood campaign density. */
export function buildNatureProps(world: World, cine: CineTextures): Group {
  const root = new Group();
  root.name = "natureProps";

  // Cine JPG cutout’lar gürültülü kutu bırakıyor; alpha’lı flora / mtn webp kullan.
  const treePool = cine.flora.length ? [...cine.flora] : [];
  const peaks = cine.peaks.filter((t) => t !== cine.mtn);

  // Ağaçlar — world.trees: [x,y,kind, x,y,kind, ...]
  const trees = world.trees;
  const step = Math.max(3, Math.floor(trees.length / 900) * 3 || 3);
  for (let i = 0; i + 2 < trees.length; i += step) {
    if (!treePool.length) break;
    const wx = trees[i];
    const wy = trees[i + 1];
    const kind = trees[i + 2] | 0;
    const tex = treePool[(i + kind) % treePool.length];
    const elev = heightAt(world, wx, wy);
    if (elev < 1) continue;
    const spr = mkBillboard(tex, 28 + (kind ? 18 : 10) + (i % 7));
    spr.position.set(wx, elev, wy);
    root.add(spr);
  }

  // Zirve dağ silüetleri
  const peakPts = world.peaks;
  const pStep = Math.max(3, Math.floor(peakPts.length / 60) * 3 || 3);
  for (let i = 0; i + 2 < peakPts.length; i += pStep) {
    if (!peaks.length) break;
    const wx = peakPts[i];
    const wy = peakPts[i + 1];
    const hNorm = peakPts[i + 2];
    const tex = peaks[i % peaks.length];
    const elev = heightAt(world, wx, wy);
    const h = 90 + hNorm * 170;
    const spr = mkBillboard(tex, h);
    spr.position.set(wx, elev + h * 0.15, wy);
    spr.userData.peak = true;
    root.add(spr);
  }

  root.add(buildScatter(world));
  return root;
}

function mkBillboard(tex: Texture, h: number): Sprite {
  const mat = new SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.22,
  });
  const s = new Sprite(mat);
  const img = tex.image as { width?: number; height?: number } | undefined;
  const aspect = img?.width && img?.height ? img.width / Math.max(1, img.height) : 1;
  s.scale.set(h * Math.min(aspect, 2.2), h, 1);
  s.center.set(0.5, 0);
  return s;
}

/** Kameranın bakış noktasına yakın dağ silüetlerini saydamlaştır (birimleri örtmesin). */
export function fadePeaks(root: Group, cx: number, cy: number): void {
  for (const c of root.children) {
    if (!c.userData.peak) continue;
    const d = Math.hypot(c.position.x - cx, c.position.z - cy);
    const o = Math.min(1, Math.max(0, (d - 380) / 520));
    const s = c as Sprite;
    s.material.opacity = o;
    s.visible = o > 0.02;
  }
}
/** Zemin örtüsü: ot tutamları, çalılar, kayalar — araziden örneklenen renkle, parçalı (frustum cull) InstancedMesh. */
/** Sis dokusu (WorldView3D doldurur); doluysa örtü sisli hücrelerde gizlenir. */
export const scatterFog: { tex: { value: Texture | null } } = { tex: { value: null } };

function buildScatter(world: World): Group {
  const out = new Group();
  out.name = "scatter";
  const cv = world.canvas;
  const cx = cv.getContext("2d")!;
  const img = cx.getImageData(0, 0, cv.width, cv.height).data;
  const rnd = seeded(20260);

  // geometriler
  const blade = (h: number, lean: number, ang: number): BufferGeometry => {
    const g = new ConeGeometry(0.55, h, 3, 1);
    g.translate(0, h / 2, 0);
    g.rotateZ(lean);
    g.rotateY(ang);
    return g;
  };
  const tuft = mergeGeometries([blade(7, 0.25, 0), blade(9, -0.18, 2.1), blade(6, 0.3, 4.2), blade(8, 0.05, 1)].map((g) => g.toNonIndexed()), false)!;
  const rock = new IcosahedronGeometry(1, 0);
  {
    const pos = rock.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      const j = 0.75 + rnd() * 0.5;
      for (let k = 0; k < 3; k++) pos.setXYZ(i + k, pos.getX(i + k) * j, pos.getY(i + k) * (0.6 + rnd() * 0.3), pos.getZ(i + k) * j);
    }
    rock.computeVertexNormals();
  }
  const bush = (() => {
    const parts: BufferGeometry[] = [];
    for (const [x, y, z, r] of [[0, 2.4, 0, 3.4], [2.6, 1.8, 1, 2.4], [-2.2, 1.8, -1.2, 2.6]] as number[][]) {
      const s = new IcosahedronGeometry(r, 1);
      s.translate(x, y, z);
      parts.push(s.index ? s.toNonIndexed() : s);
    }
    return mergeGeometries(parts, false)!;
  })();
  // çam/kavak: gövde + üç kat koni (köşe rengiyle: gövde kahve, yaprak beyaz → örnek rengi çarpar)
  const tree = (() => {
    const parts: BufferGeometry[] = [];
    const paint = (g: BufferGeometry, r: number, gr: number, b: number): BufferGeometry => {
      const n = g.attributes.position.count;
      const a = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) (a[i * 3] = r), (a[i * 3 + 1] = gr), (a[i * 3 + 2] = b);
      g.setAttribute("color", new Float32BufferAttribute(a, 3));
      return g;
    };
    const trunk = new CylinderGeometry(0.7, 1.0, 7, 5);
    trunk.translate(0, 3.5, 0);
    parts.push(paint(trunk.toNonIndexed(), 0.38, 0.27, 0.17));
    const tiers: [number, number, number][] = [[6.5, 8, 7], [10.5, 6.2, 7], [14, 4.2, 6.5]];
    for (const [y, r, h] of tiers) {
      const c = new ConeGeometry(r, h, 7, 1);
      c.translate(0, y + h / 2 - 1.5, 0);
      parts.push(paint(c.toNonIndexed(), 1, 1, 1));
    }
    return mergeGeometries(parts, false)!;
  })();
  for (const g of [tuft, rock, bush, tree]) {
    if (!g.attributes.uv) g.setAttribute("uv", new Float32BufferAttribute(new Array(g.attributes.position.count * 2).fill(0), 2));
  }
  const mat = new MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true });
  const matSmooth = new MeshStandardMaterial({ roughness: 1, metalness: 0, side: 2 });
  // sisle kaplı (keşfedilmemiş) alanda örtü görünmesin
  const fogCut = (sh: { uniforms: Record<string, { value: unknown }>; vertexShader: string; fragmentShader: string }): void => {
    sh.uniforms.uFogTex = scatterFog.tex;
    sh.uniforms.uFogWH = { value: new Vector2(W, H) };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vFogUv;\nuniform vec2 uFogWH;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\n vFogUv = vec2(instanceMatrix[3].x / uFogWH.x, 1.0 - instanceMatrix[3].z / uFogWH.y);\n#else\n vFogUv = vec2(0.5);\n#endif");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vFogUv;\nuniform sampler2D uFogTex;")
      .replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n if (texture2D(uFogTex, vFogUv).a > 0.3) discard;");
  };
  mat.onBeforeCompile = fogCut;
  matSmooth.onBeforeCompile = fogCut;

  type Item = { x: number; y: number; z: number; s: number; r: number; c: Color };
  const CX = 8;
  const CY = 4;
  const buckets = { tuft: new Map<number, Item[]>(), rock: new Map<number, Item[]>(), bush: new Map<number, Item[]>(), tree: new Map<number, Item[]>() };
  const put = (kind: keyof typeof buckets, it: Item) => {
    const k = Math.floor((it.x / W) * CX) + Math.floor((it.z / H) * CY) * CX;
    const m = buckets[kind];
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  };
  const near = (x: number, y: number) => CITIES.some((c) => Math.hypot(c.x - x, c.y - y) < 190);
  const want = { tuft: 9000, bush: 1500, rock: 1700, tree: 3200 };
  const tryKind = (kind: keyof typeof want, n: number) => {
    let placed = 0;
    for (let a = 0; a < n * 6 && placed < n; a++) {
      const wx = rnd() * W;
      const wy = rnd() * H;
      const h = world.height[Math.min(GH - 1, Math.floor((wy / H) * GH)) * GW + Math.min(GW - 1, Math.floor((wx / W) * GW))];
      if (h < (kind === "tree" ? 0.06 : 0.03) || h > (kind === "rock" ? 0.8 : kind === "tree" ? 0.5 : 0.55)) continue;
      if (near(wx, wy)) continue;
      const px = Math.min(cv.width - 1, Math.floor((wx / W) * cv.width));
      const py = Math.min(cv.height - 1, Math.floor((wy / H) * cv.height));
      const o = (py * cv.width + px) * 4;
      const col = new Color(img[o] / 255, img[o + 1] / 255, img[o + 2] / 255);
      // koyu/mavi (su, yol, sınır) pikselleri atla; çok açık (kar) olanları atla
      const lum = col.r * 0.3 + col.g * 0.59 + col.b * 0.11;
      if (lum < 0.2 || (col.b > col.r + 0.08 && col.b > col.g)) continue;
      if (lum > 0.82 && kind !== "rock") continue;
      if (kind === "tree") {
        if (!(col.g > col.r * 0.9 && col.g > col.b * 1.05)) continue;
        // ormanlar öbek öbek: düşük frekanslı yoğunluk
        const dn = 0.5 + 0.5 * Math.sin(wx * 0.0042 + Math.sin(wy * 0.0031) * 2) * Math.sin(wy * 0.0057 + 1.3 + Math.sin(wx * 0.0023) * 2);
        if (dn < 0.52 || rnd() > dn * 1.1) continue;
      }
      const hh = heightAt(world, wx, wy);
      const k = 0.8 + rnd() * 0.45;
      const c = col.clone();
      if (kind === "tuft") c.lerp(new Color(0.36, 0.44, 0.2), 0.45).multiplyScalar(0.72 + rnd() * 0.4);
      else if (kind === "bush") c.lerp(new Color(0.22, 0.36, 0.16), 0.6).multiplyScalar(0.7 + rnd() * 0.4);
      else if (kind === "tree") c.set(0.07 + rnd() * 0.08, 0.17 + rnd() * 0.12, 0.05 + rnd() * 0.06).lerp(col, 0.12);
      else c.set(0.42 + rnd() * 0.16, 0.38 + rnd() * 0.14, 0.33 + rnd() * 0.1).lerp(col, 0.25);
      put(kind, { x: wx, y: hh, z: wy, s: kind === "rock" ? 2 + rnd() * rnd() * 9 : kind === "tree" ? 0.8 + rnd() * 0.9 : k, r: rnd() * Math.PI * 2, c });
      placed++;
    }
  };
  tryKind("tuft", want.tuft);
  tryKind("bush", want.bush);
  tryKind("rock", want.rock);
  tryKind("tree", want.tree);

  const m4 = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const sc = new Vector3();
  const pos = new Vector3();
  const geoOf = { tuft, rock, bush, tree };
  const matTree = new MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true, vertexColors: true });
  matTree.onBeforeCompile = fogCut;
  for (const kind of ["tuft", "bush", "rock", "tree"] as const) {
    for (const items of buckets[kind].values()) {
      const im = new InstancedMesh(geoOf[kind], kind === "tuft" ? matSmooth : kind === "tree" ? matTree : mat, items.length);
      items.forEach((it, i) => {
        e.set(0, it.r, 0);
        q.setFromEuler(e);
        pos.set(it.x, it.y - (kind === "rock" ? it.s * 0.15 : 0.4), it.z);
        sc.setScalar(it.s);
        m4.compose(pos, q, sc);
        im.setMatrixAt(i, m4);
        im.setColorAt(i, it.c);
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = kind === "rock" || kind === "tree";
      im.receiveShadow = true;
      im.computeBoundingSphere();
      out.add(im);
    }
  }
  return out;
}