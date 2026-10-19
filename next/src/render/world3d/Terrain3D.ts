import {
  CanvasTexture,
  Group,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  type Texture,
} from "three";
import { GH, GW, H, W, type World } from "../../world/gen";
import type { CineTextures } from "./CineKit";

const ELEV = 160;
const SKIRT = Math.max(W, H) * 0.65;

function sample(arr: Float32Array, gx: number, gy: number): number {
  const x0 = Math.max(0, Math.min(GW - 1, Math.floor(gx)));
  const y0 = Math.max(0, Math.min(GH - 1, Math.floor(gy)));
  const x1 = Math.min(GW - 1, x0 + 1);
  const y1 = Math.min(GH - 1, y0 + 1);
  const fx = Math.max(0, Math.min(1, gx - x0));
  const fy = Math.max(0, Math.min(1, gy - y0));
  const a = arr[y0 * GW + x0];
  const b = arr[y0 * GW + x1];
  const c = arr[y1 * GW + x0];
  const d = arr[y1 * GW + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

/** Yükseklik: taban + dağ kütlesi + sırt kabartısı (tek kaynak: hem mesh hem yürüme). */
function relief(h: number, wx: number, wy: number): number {
  const mound = h > 0.45 ? Math.pow((h - 0.45) / 0.55, 1.5) * ELEV * 0.42 : 0;
  let ridge = 0;
  if (h > 0.4) {
    const k = Math.min(1, (h - 0.4) / 0.35);
    ridge = (Math.sin(wx * 0.012 + Math.sin(wy * 0.006) * 2) * Math.sin(wy * 0.015 - wx * 0.004) + Math.sin(wx * 0.034 + wy * 0.021) * 0.45) * 15 * k;
  }
  return h * ELEV * 0.42 + mound + ridge;
}

function elevOf(world: World, wx: number, wy: number): number {
  const h = sample(world.height, (wx / W) * (GW - 1), (wy / H) * (GH - 1));
  if (h < 0) return -2;
  return relief(h, wx, wy);
}

function addSkirts(root: Group, world: World, sand: Texture | null): void {
  const sandMat = new MeshLambertMaterial({
    map: sand ?? undefined,
    color: sand ? 0xffffff : 0x9a7a48,
  });
  const far = new MeshLambertMaterial({ color: 0x5a4a32 });

  {
    const geo = new PlaneGeometry(W + SKIRT * 2, SKIRT, 40, 12);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = W / 2 + lx;
      const t = (lz + SKIRT / 2) / SKIRT;
      const edge = elevOf(world, Math.max(0, Math.min(W, wx)), 4);
      pos.setY(i, edge * t * t - (1 - t) * 18);
    }
    geo.computeVertexNormals();
    const m = new Mesh(geo, sandMat);
    m.position.set(W / 2, 0, -SKIRT / 2);
    m.receiveShadow = true;
    root.add(m);
  }
  {
    const geo = new PlaneGeometry(W + SKIRT * 2, SKIRT, 40, 12);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wx = W / 2 + lx;
      const t = 1 - (lz + SKIRT / 2) / SKIRT;
      const edge = elevOf(world, Math.max(0, Math.min(W, wx)), H - 4);
      pos.setY(i, edge * t * t - (1 - t) * 18);
    }
    geo.computeVertexNormals();
    const m = new Mesh(geo, sandMat);
    m.position.set(W / 2, 0, H + SKIRT / 2);
    root.add(m);
  }
  {
    const geo = new PlaneGeometry(SKIRT, H + SKIRT * 2, 12, 40);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wy = H / 2 + lz;
      const t = (lx + SKIRT / 2) / SKIRT;
      const edge = elevOf(world, 4, Math.max(0, Math.min(H, wy)));
      pos.setY(i, edge * t * t - (1 - t) * 18);
    }
    geo.computeVertexNormals();
    const m = new Mesh(geo, sandMat);
    m.position.set(-SKIRT / 2, 0, H / 2);
    root.add(m);
  }
  {
    const geo = new PlaneGeometry(SKIRT, H + SKIRT * 2, 12, 40);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);
      const wy = H / 2 + lz;
      const t = 1 - (lx + SKIRT / 2) / SKIRT;
      const edge = elevOf(world, W - 4, Math.max(0, Math.min(H, wy)));
      pos.setY(i, edge * t * t - (1 - t) * 18);
    }
    geo.computeVertexNormals();
    const m = new Mesh(geo, sandMat);
    m.position.set(W + SKIRT / 2, 0, H / 2);
    root.add(m);
  }

  const apron = new Mesh(new PlaneGeometry(W * 8, H * 8), far);
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(W / 2, -22, H / 2);
  root.add(apron);
}

export function buildTerrain(world: World, cine?: CineTextures | null): Group {
  const root = new Group();
  root.name = "terrainRoot";

  const segX = Math.min(360, GW - 1);
  const segZ = Math.min(220, GH - 1);
  const geo = new PlaneGeometry(W, H, segX, segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i);
    const lz = pos.getZ(i);
    const wx = lx + W / 2;
    const wy = lz + H / 2;
    const h = sample(world.height, (wx / W) * (GW - 1), (wy / H) * (GH - 1));
    if (h < 0) {
      pos.setY(i, -2);
      continue;
    }
    const micro = Math.sin(wx * 0.025) * Math.cos(wy * 0.022) * 2.2;
    pos.setY(i, relief(h, wx, wy) + micro);
  }
  geo.computeVertexNormals();

  const map = new CanvasTexture(world.canvas);
  map.colorSpace = SRGBColorSpace;

  // Biyom boyası + AI kum detayı (Hollywood zemin)
  const detail = cine?.sand ?? cine?.steppe ?? null;
  const mat = new MeshStandardMaterial({
    map,
    color: 0xffffff,
    bumpMap: detail ?? undefined,
    bumpScale: detail ? 1.4 : 0,
    roughness: 1,
    metalness: 0.02,
  });
  // Yüksek frekanslı doku: kar/boş alanlar düz beyaz kumaş gibi görünmesin
  const rockTex = cine?.rock ?? detail;
  if (rockTex) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uDetail = { value: rockTex };
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uDetail;")
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          vec3 dtA = texture2D(uDetail, vMapUv * 90.0).rgb;
          vec3 dtB = texture2D(uDetail, vMapUv * 23.0 + 0.37).rgb;
          float dl = dot(dtA, vec3(0.333)) * 0.6 + dot(dtB, vec3(0.333)) * 0.4;
          float snowK = smoothstep(0.62, 0.86, min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b));
          float tl = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          diffuseColor.rgb = mix(vec3(tl), diffuseColor.rgb, 0.84) * vec3(1.0, 0.95, 0.86);
          diffuseColor.rgb *= mix(0.5 + dl * 0.95, 0.5 + dl * 0.95, snowK);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.9, 0.95, 1.05), snowK * 0.5);
          float big = dot(texture2D(uDetail, vMapUv * 4.0 + 0.11).rgb, vec3(0.333));
          float mid = dot(texture2D(uDetail, vMapUv * 11.0 + 0.53).rgb, vec3(0.333));
          vec3 tone = mix(vec3(0.88, 0.95, 0.8), vec3(1.1, 1.03, 0.9), smoothstep(0.32, 0.68, big * 0.6 + mid * 0.4));
          diffuseColor.rgb *= mix(vec3(1.0), tone, 1.0 - snowK * 0.8);`,
        );
    };
  }

  const mesh = new Mesh(geo, mat);
  mesh.position.set(W / 2, 0, H / 2);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  root.add(mesh);

  const waterTex = cine?.water ?? null;
  const water = new Mesh(
    new PlaneGeometry(W * 1.02, H * 1.02),
    new MeshStandardMaterial({
      map: waterTex ?? undefined,
      color: waterTex ? 0xffffff : 0x2a6a88,
      transparent: true,
      opacity: 0.88,
      emissive: 0x16506a,
      emissiveIntensity: 0.75,
      roughness: 0.35,
      metalness: 0.25,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(W / 2, -1.2, H / 2);
  root.add(water);

  addSkirts(root, world, cine?.sand ?? null);
  return root;
}

export function heightAt(world: World, wx: number, wy: number): number {
  return Math.max(0, elevOf(world, wx, wy));
}
