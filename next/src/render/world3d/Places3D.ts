import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Material,
} from "three";

function seeded(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const matCache = new Map<string, MeshStandardMaterial>();
function mat(hex: number, rough = 0.85, metal = 0.05): MeshStandardMaterial {
  const k = `${hex}_${rough}_${metal}`;
  let m = matCache.get(k);
  if (!m) {
    m = new MeshStandardMaterial({
      color: new Color(hex),
      roughness: rough,
      metalness: metal,
    });
    matCache.set(k, m);
  }
  return m;
}

function box(w: number, h: number, d: number, m: Material, x: number, y: number, z: number): Mesh {
  const mesh = new Mesh(new BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(rTop: number, rBot: number, h: number, m: Material, x: number, y: number, z: number, seg = 8): Mesh {
  const mesh = new Mesh(new CylinderGeometry(rTop, rBot, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cone(r: number, h: number, m: Material, x: number, y: number, z: number, seg = 6): Mesh {
  const mesh = new Mesh(new ConeGeometry(r, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Kubbeli şehir — Semerkant tarzı. */
export function buildCityMesh(seed = 1, scale = 1): Group {
  const rnd = seeded(seed);
  const g = new Group();
  const stone = mat(0x8a7a62, 0.88);
  const mud = mat(0xb09058, 0.85);
  const dome = mat(0x3aac9a, 0.4, 0.28);
  const roof = mat(0x7a5040, 0.78);
  const wall = mat(0x7a6a52, 0.9);

  // sur
  const wallH = 5.5 * scale;
  const wallT = 1.2 * scale;
  const half = 14 * scale;
  g.add(box(half * 2, wallH, wallT, wall, 0, wallH / 2, -half));
  g.add(box(half * 2, wallH, wallT, wall, 0, wallH / 2, half));
  g.add(box(wallT, wallH, half * 2, wall, -half, wallH / 2, 0));
  g.add(box(wallT, wallH, half * 2, wall, half, wallH / 2, 0));
  // kapı
  g.add(box(4 * scale, wallH * 1.15, wallT * 1.4, stone, 0, wallH * 0.55, half));
  // kuleler
  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ] as const) {
    g.add(cyl(2.2 * scale, 2.6 * scale, wallH * 1.4, stone, x, wallH * 0.7, z, 8));
    g.add(cone(2.8 * scale, 3 * scale, roof, x, wallH * 1.4 + 1.5 * scale, z, 6));
  }
  // iç binalar
  for (let i = 0; i < 7; i++) {
    const bx = (rnd() - 0.5) * half * 1.4;
    const bz = (rnd() - 0.5) * half * 1.4;
    const bw = (2.5 + rnd() * 3) * scale;
    const bh = (3 + rnd() * 4) * scale;
    const bd = (2.5 + rnd() * 3) * scale;
    g.add(box(bw, bh, bd, mud, bx, bh / 2, bz));
    g.add(box(bw * 1.05, 0.6 * scale, bd * 1.05, roof, bx, bh + 0.3 * scale, bz));
  }
  // merkez kubbe
  const dh = 8 * scale;
  g.add(cyl(3.5 * scale, 4 * scale, dh * 0.6, stone, 0, dh * 0.3, 0, 10));
  const domeMesh = new Mesh(new SphereGeometry(4.2 * scale, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), dome);
  domeMesh.position.set(0, dh * 0.55, 0);
  domeMesh.castShadow = true;
  g.add(domeMesh);
  // minare
  g.add(cyl(0.9 * scale, 1.1 * scale, 14 * scale, stone, 6 * scale, 7 * scale, -4 * scale, 8));
  g.add(cone(1.4 * scale, 2.2 * scale, dome, 6 * scale, 15 * scale, -4 * scale, 6));

  g.userData.kind = "city";
  return g;
}

/** Köy / yurt kümesi. */
export function buildVillageMesh(seed = 2, yurtHeavy = true, scale = 1): Group {
  const rnd = seeded(seed);
  const g = new Group();
  const felt = mat(0xc8b090, 0.9);
  const mud = mat(0x7a6040, 0.88);
  const dark = mat(0x3a3028, 0.85);
  const n = yurtHeavy ? 5 : 4;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd() * 0.3;
    const r = (4 + rnd() * 5) * scale;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (yurtHeavy || rnd() > 0.4) {
      const yr = (1.8 + rnd() * 0.6) * scale;
      g.add(cyl(yr, yr * 1.05, 2.2 * scale, felt, x, 1.1 * scale, z, 10));
      g.add(cone(yr * 1.1, 1.6 * scale, dark, x, 2.2 * scale + 0.8 * scale, z, 8));
    } else {
      const h = (2.2 + rnd()) * scale;
      g.add(box(2.4 * scale, h, 2.2 * scale, mud, x, h / 2, z));
      g.add(box(2.6 * scale, 0.4 * scale, 2.4 * scale, dark, x, h + 0.2 * scale, z));
    }
  }
  // ateş çukuru
  g.add(cyl(1.2 * scale, 1.4 * scale, 0.35 * scale, mat(0x2a2018), 0, 0.15 * scale, 0, 8));
  const glow = new Mesh(new SphereGeometry(0.7 * scale, 8, 6), mat(0xff6622, 0.4, 0.1));
  glow.position.set(0, 0.9 * scale, 0);
  (glow.material as MeshStandardMaterial).emissive = new Color(0xff4400);
  (glow.material as MeshStandardMaterial).emissiveIntensity = 1.2;
  g.add(glow);
  g.userData.kind = "village";
  return g;
}

/** Kale / hisar. */
export function buildFortMesh(seed = 3, scale = 1): Group {
  const rnd = seeded(seed);
  const g = new Group();
  const stone = mat(0x5a554c, 0.92);
  const dark = mat(0x3a3832, 0.9);
  const half = 10 * scale;
  const h = 7 * scale;
  g.add(box(half * 2, h, 1.6 * scale, stone, 0, h / 2, -half));
  g.add(box(half * 2, h, 1.6 * scale, stone, 0, h / 2, half));
  g.add(box(1.6 * scale, h, half * 2, stone, -half, h / 2, 0));
  g.add(box(1.6 * scale, h, half * 2, stone, half, h / 2, 0));
  // keep
  g.add(box(8 * scale, 12 * scale, 8 * scale, dark, 0, 6 * scale, 0));
  g.add(box(9 * scale, 1.2 * scale, 9 * scale, stone, 0, 12.6 * scale, 0));
  for (const [x, z] of [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ] as const) {
    const th = (10 + rnd() * 3) * scale;
    g.add(cyl(2.4 * scale, 2.8 * scale, th, stone, x, th / 2, z, 8));
    g.add(box(5.2 * scale, 1.2 * scale, 5.2 * scale, dark, x, th + 0.4 * scale, z));
  }
  g.userData.kind = "fort";
  return g;
}

/** Kamp / çadır. */
export function buildCampMesh(scale = 1): Group {
  const g = new Group();
  const canvas = mat(0xb8a078, 0.88);
  const pole = mat(0x3a2a18, 0.8);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 4.5 * scale;
    g.add(cone(2.4 * scale, 3.8 * scale, canvas, x, 1.9 * scale, 0, 6));
    g.add(cyl(0.12 * scale, 0.12 * scale, 4 * scale, pole, x, 2 * scale, 0, 4));
  }
  const fire = new Mesh(new SphereGeometry(0.55 * scale, 8, 6), mat(0xff5522, 0.35));
  fire.position.set(0, 0.7 * scale, 3 * scale);
  (fire.material as MeshStandardMaterial).emissive = new Color(0xff3300);
  (fire.material as MeshStandardMaterial).emissiveIntensity = 1.4;
  g.add(fire);
  g.userData.kind = "camp";
  return g;
}

/** Kurgan höyük. */
export function buildKurganMesh(scale = 1): Group {
  const g = new Group();
  const earth = mat(0x4a3a28, 0.95);
  const stone = mat(0x6a6558, 0.9);
  g.add(cone(6 * scale, 4.5 * scale, earth, 0, 2.2 * scale, 0, 10));
  g.add(cyl(1.2 * scale, 1.4 * scale, 3.5 * scale, stone, 0, 4.5 * scale, 0, 6));
  g.userData.kind = "kurgan";
  return g;
}

/** Vaha / kuyu. */
export function buildOasisMesh(scale = 1): Group {
  const g = new Group();
  const palm = mat(0x2a5a28, 0.8);
  const trunk = mat(0x5a4030, 0.85);
  const water = mat(0x1a4a58, 0.35, 0.4);
  g.add(cyl(3.5 * scale, 3.5 * scale, 0.25 * scale, water, 0, 0.1 * scale, 0, 12));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const x = Math.cos(a) * 5 * scale;
    const z = Math.sin(a) * 5 * scale;
    g.add(cyl(0.35 * scale, 0.45 * scale, 5 * scale, trunk, x, 2.5 * scale, z, 6));
    g.add(cone(2.2 * scale, 2.5 * scale, palm, x, 5.5 * scale, z, 6));
  }
  g.userData.kind = "oasis";
  return g;
}

export type PlaceKind = "city" | "village" | "fort" | "camp" | "kurgan" | "oasis" | "pass" | "ruins";

export function buildPlaceMesh(kind: PlaceKind, seed = 1, scale = 1): Group {
  switch (kind) {
    case "city":
      return buildCityMesh(seed, scale);
    case "village":
      return buildVillageMesh(seed, true, scale);
    case "fort":
      return buildFortMesh(seed, scale);
    case "camp":
      return buildCampMesh(scale);
    case "kurgan":
      return buildKurganMesh(scale);
    case "oasis":
      return buildOasisMesh(scale);
    case "pass":
      return buildFortMesh(seed + 17, scale * 0.7);
    case "ruins":
      return buildKurganMesh(scale * 0.85);
    default:
      return buildVillageMesh(seed, false, scale);
  }
}
