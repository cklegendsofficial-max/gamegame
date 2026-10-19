import { Group, Mesh, Shape, ShapeGeometry, SphereGeometry } from "three";
import { M, Parts, seeded } from "./Kit";
import { overlayGlb } from "./Models";
import {
  RigBase,
  UNIT,
  buildHumanoid,
  buildQuadruped,
  type HumanoidOpts,
  type HumanoidRig,
  type QuadOpts,
  type QuadRig,
} from "./Rigs";

/**
 * Oyundaki tüm canlı aktörlerin fabrikaları: kahraman (sınıfa göre), yoldaşlar,
 * askerler, haramiler, kervan develeri, NPC'ler ve bölge bosları.
 */

export type Actor = RigBase;

/** Varsa `.glb` ile prosedürel mesh'i örter; yoksa no-op. */
function dress(rig: { root: Group }, key: string): void {
  overlayGlb(rig.root, key);
}

// ───────────────────────── Binekler ─────────────────────────

const HORSE_COATS: QuadOpts[] = [
  { kind: "horse", coat: 0x7a5232, accent: 0x2a1c12, mane: 0x1a120c, saddle: 0x8a2a1a },
  { kind: "horse", coat: 0x9a9aa0, accent: 0x55555c, mane: 0x3a3a40, saddle: 0x2a4a7a },
  { kind: "horse", coat: 0xe8e4dc, accent: 0xb8b4ac, mane: 0xcfcbc2, saddle: 0xc9a227 },
  { kind: "horse", coat: 0x2a2a2e, accent: 0x15151a, mane: 0x0a0a0e, saddle: 0x5a1a1a },
  { kind: "horse", coat: 0xb0793a, accent: 0x5a3a1e, mane: 0x3a2412, saddle: 0x2a6a4a },
];

export function horseOpts(i: number, saddle?: number): QuadOpts {
  const h = HORSE_COATS[Math.abs(i) % HORSE_COATS.length];
  return { ...h, saddle: saddle ?? h.saddle };
}

// ───────────────────────── Kahraman ─────────────────────────

export type HeroClass = "alp" | "bahadir" | "suikastci" | "hirsiz" | "kam" | string;

export interface HeroLook {
  cls?: HeroClass | null;
  free?: boolean;
  /** 0 = yaya, 1..3 = at kalitesi. */
  mount?: number;
}

export function buildHero(look: HeroLook): HumanoidRig {
  const free = look.free !== false;
  let o: HumanoidOpts;
  if (!free) {
    o = { skin: 0xb88c64, cloth: 0x6a5a40, armor: "rags", pants: 0x4a3c2a, boots: 0x3a2c1c, hunch: 0.15, build: 0.92, hair: { col: 0x2a1c10 }, scale: 1 };
  } else {
    switch (look.cls) {
      case "bahadir":
        o = { cloth: 0x6a1c1c, trim: 0xd4af37, armor: "plate", armorCol: 0x8a909a, helm: "conical", helmCol: 0xa8aeb8, weapon: "axe", shield: true, shieldCol: 0x2a3a6a, cape: 0xa02020, beard: 0x2a1c10, build: 1.18, pants: 0x3a2a2a };
        break;
      case "suikastci":
        o = { cloth: 0x22222a, trim: 0x8a1a1a, armor: "leather", armorCol: 0x2a2a32, helm: "hood", helmCol: 0x1c1c22, weapon: "twin", cape: 0x2a2a34, pants: 0x1c1c22, boots: 0x15151a, build: 0.92 };
        break;
      case "hirsiz":
        o = { cloth: 0x4a5a3a, trim: 0x2a1c10, armor: "leather", armorCol: 0x5a4a2a, helm: "bandana", helmCol: 0xa23a2a, weapon: "dagger", cape: 0x3a4a2a, pants: 0x3a3228, build: 0.9 };
        break;
      case "kam":
        o = { cloth: 0x2a3a7a, trim: 0xd4af37, armor: "robe", armorCol: 0xd4af37, helm: "feather", helmCol: 0x6a5844, weapon: "staff", cape: 0x4a2a7a, beard: 0xc8c8c8, build: 1 };
        break;
      case "alp":
      default:
        o = { cloth: 0x2a5a4a, trim: 0xd4af37, armor: "mail", armorCol: 0x8a9096, helm: "conical", helmCol: 0xa8aeb8, weapon: "sword", shield: true, shieldCol: 0xa23a1a, cape: 0xb02a1a, beard: 0x3a2412, build: 1.08, pants: 0x3a3a3a };
        break;
    }
  }
  if (free && look.mount && look.mount > 0) {
    o.mounted = horseOpts(look.mount === 3 ? 2 : look.mount === 2 ? 0 : 1);
    if (look.mount === 3 && o.mounted) o.mounted.saddle = 0xc9a227;
  }
  o.scale = (o.scale ?? 1) * 1.08;
  const rig = buildHumanoid(o);
  dress(rig, free ? `hero_${look.cls ?? "alp"}` : "hero_slave");
  return rig;
}

// ───────────────────────── Yoldaşlar ─────────────────────────

export function buildCompanion(id: string): HumanoidRig {
  let rig: HumanoidRig;
  switch (id) {
    case "ayse":
      rig = buildHumanoid({ cloth: 0x2f8a6a, trim: 0xd4af37, armor: "robe", armorCol: 0xd4af37, hair: { col: 0x1a1008, long: true }, weapon: "staff", build: 0.82, skin: 0xd8b090, scale: 1.04 });
      break;
    case "batu":
      rig = buildHumanoid({ cloth: 0x6a2a1a, trim: 0xd4af37, armor: "plate", armorCol: 0x7a7e86, helm: "horned", helmCol: 0x5a5e66, weapon: "axe", shield: true, shieldCol: 0x3a2a1a, beard: 0x1a120c, build: 1.3, cape: 0x4a1a1a, scale: 1.12 });
      break;
    case "ferhat":
      rig = buildHumanoid({ cloth: 0x5a4a3a, trim: 0x2a1c10, armor: "leather", armorCol: 0x4a3a2a, apron: 0x2a1c14, weapon: "hammer", beard: 0x4a2a14, hair: { col: 0x4a2a14 }, build: 1.22, skin: 0xb88c64, scale: 1.05 });
      break;
    case "korkut":
      rig = buildHumanoid({ cloth: 0x7a2a2a, trim: 0xd4af37, armor: "robe", armorCol: 0xd4af37, helm: "bork", helmCol: 0xe8e0c8, weapon: "kopuz", beard: 0xe8e8e8, build: 0.95, hunch: 0.08, scale: 1 });
      break;
    case "leyla":
      rig = buildHumanoid({ cloth: 0x3a6a3a, trim: 0xd4af37, armor: "leather", armorCol: 0x4a5a2a, hair: { col: 0x6a2a14, long: true }, helm: "feather", helmCol: 0x6a5844, weapon: "bow", build: 0.84, skin: 0xd8b090, scale: 1.02, pants: 0x3a3a2a });
      break;
    case "lucia":
      rig = buildHumanoid({ cloth: 0x6a2a8a, trim: 0xe8e0c8, armor: "robe", armorCol: 0xe8e0c8, hair: { col: 0x8a3a1a, long: true }, helm: "crown", weapon: "staff", build: 0.84, skin: 0xe0bc9a, cape: 0xe8e0c8, scale: 1.03 });
      break;
    default:
      rig = buildHumanoid({ cloth: 0x5a6a8a, armor: "leather", weapon: "sword", scale: 1.02 });
  }
  dress(rig, `comp_${id}`);
  return rig;
}

// ───────────────────────── Askerler ─────────────────────────

export type TroopKind = "spear" | "archer" | "cav" | "sword";

export function buildSoldier(kind: TroopKind, teamCol: number, seed = 1): HumanoidRig {
  const r = seeded(seed);
  const skin = [0xc9a07a, 0xb88c64, 0xd8b090, 0xa87c58][Math.floor(r() * 4)];
  const base: HumanoidOpts = { skin, cloth: teamCol, trim: 0x2a1c10, scale: 1 + r() * 0.06, beard: r() > 0.55 ? 0x2a1c10 : null };
  let rig: HumanoidRig;
  switch (kind) {
    case "archer":
      rig = buildHumanoid({ ...base, armor: "leather", armorCol: 0x6a4a2a, helm: "kalpak", helmCol: teamCol, weapon: "bow", build: 0.95 });
      break;
    case "cav":
      rig = buildHumanoid({ ...base, armor: "mail", armorCol: 0x8a9096, helm: "conical", helmCol: 0x9aa0a8, weapon: "spear", shield: true, shieldCol: teamCol, mounted: horseOpts(Math.floor(r() * 5)), scale: 1 });
      break;
    case "sword":
      rig = buildHumanoid({ ...base, armor: "mail", armorCol: 0x8a9096, helm: "conical", helmCol: 0x9aa0a8, weapon: "sword", shield: true, shieldCol: teamCol });
      break;
    case "spear":
    default:
      rig = buildHumanoid({ ...base, armor: "mail", armorCol: 0x7a8086, helm: "conical", helmCol: 0x9aa0a8, weapon: "spear", shield: true, shieldCol: teamCol });
  }
  dress(rig, `soldier_${kind}`);
  return rig;
}

// ───────────────────────── Haramiler ─────────────────────────

export type BanditKind = "sword" | "axe" | "rider" | "heavy" | "chief";

const BANDIT_CLOTH = [0x6a3a2a, 0x4a4a32, 0x5a3a4a, 0x3a4a5a, 0x7a5a2a];

export function buildBandit(kind: BanditKind, seed = 1): HumanoidRig {
  const r = seeded(seed);
  const cloth = BANDIT_CLOTH[Math.floor(r() * BANDIT_CLOTH.length)];
  const skin = [0xb88c64, 0xa87c58, 0xc9a07a][Math.floor(r() * 3)];
  const base: HumanoidOpts = { skin, cloth, trim: 0x1a120c, pants: 0x3a2e24, boots: 0x20160e };
  let rig: HumanoidRig;
  switch (kind) {
    case "axe":
      rig = buildHumanoid({ ...base, armor: "leather", armorCol: 0x4a3a28, helm: "kalpak", helmCol: 0x6a5844, weapon: "axe", beard: 0x2a1c10, build: 1.08 });
      break;
    case "rider":
      rig = buildHumanoid({ ...base, armor: "leather", armorCol: 0x4a3a28, helm: "conical", helmCol: 0x6a5a4a, weapon: "sword", mounted: { ...horseOpts(Math.floor(r() * 5) + 3), saddle: 0x4a2a14 }, cape: 0x6a2a1a, scale: 1 });
      break;
    case "heavy":
      rig = buildHumanoid({ ...base, armor: "mail", armorCol: 0x5a5a5e, helm: "conical", helmCol: 0x5a5a60, weapon: "club", shield: true, shieldCol: 0x4a3a28, beard: 0x1a120c, build: 1.3, scale: 1.08 });
      break;
    case "chief":
      rig = buildHumanoid({ ...base, cloth: 0x4a1a1a, armor: "plate", armorCol: 0x3a3a42, helm: "horned", helmCol: 0x2a2a30, weapon: "axe", cape: 0x8a1a1a, beard: 0x1a120c, build: 1.28, scale: 1.2, eyeGlow: 0xff5a2a });
      break;
    case "sword":
    default:
      rig = buildHumanoid({ ...base, armor: "leather", armorCol: 0x4a3a28, helm: "bandana", helmCol: [0xa23a2a, 0x3a5a8a, 0x5a5a2a][Math.floor(r() * 3)], weapon: "sword", shield: r() > 0.5, shieldCol: 0x5a3a20, beard: r() > 0.5 ? 0x2a1c10 : null });
  }
  dress(rig, `bandit_${kind}`);
  return rig;
}

// ───────────────────────── NPC'ler ─────────────────────────

export type NpcKind = "merchant" | "blacksmith" | "innkeeper" | "scout" | "villager" | "guard" | "elder" | "porter";

export function buildNpc(kind: NpcKind, seed = 1, teamCol = 0x7a3a2a): HumanoidRig {
  const r = seeded(seed);
  const skin = [0xc9a07a, 0xb88c64, 0xd8b090, 0xa87c58][Math.floor(r() * 4)];
  const tint = [0x7a5a3a, 0x4a6a4a, 0x6a4a5a, 0x4a5a7a, 0x8a6a3a, 0x5a4a3a][Math.floor(r() * 6)];
  switch (kind) {
    case "merchant":
      return buildHumanoid({ skin, cloth: [0x2a5a8a, 0x8a2a4a, 0x2a7a5a][Math.floor(r() * 3)], trim: 0xd4af37, armor: "robe", armorCol: 0xd4af37, helm: "turban", helmCol: [0xe8e0c8, 0xc23a3a, 0x3a7ac2][Math.floor(r() * 3)], beard: 0x2a1c10, build: 1.05, scale: 1.0 });
    case "blacksmith":
      return buildHumanoid({ skin: 0xb88c64, cloth: 0x4a3a2c, trim: 0x2a1c10, armor: "leather", armorCol: 0x3a2a1c, apron: 0x1e150e, weapon: "hammer", beard: 0x3a2412, hair: { col: 0x3a2412 }, build: 1.28, scale: 1.08 });
    case "innkeeper":
      return buildHumanoid({ skin: 0xd8b090, cloth: 0x8a6a4a, trim: 0x3a2a1a, armor: "leather", armorCol: 0x9a7a52, apron: 0xe8e0d0, beard: 0x4a3018, hair: { col: 0x4a3018 }, build: 1.35, scale: 1.0 });
    case "scout":
      return buildHumanoid({ skin, cloth: 0x4a5a3a, trim: 0x2a1c10, armor: "leather", armorCol: 0x5a4a2a, helm: "kalpak", helmCol: 0x6a5844, weapon: "bow", cape: 0x3a4a2a, build: 0.95 });
    case "guard":
      return buildHumanoid({ skin, cloth: teamCol, trim: 0x2a1c10, armor: "mail", armorCol: 0x7a8086, helm: "conical", helmCol: 0x9aa0a8, weapon: "spear", shield: true, shieldCol: teamCol });
    case "elder":
      return buildHumanoid({ skin, cloth: 0x8a8a7a, trim: 0x4a3a2a, armor: "robe", armorCol: 0x6a5a3a, helm: "bork", helmCol: 0xe8e0c8, weapon: "staff", beard: 0xe8e8e8, hunch: 0.12, build: 0.95 });
    case "porter":
      return buildHumanoid({ skin, cloth: tint, trim: 0x2a1c10, armor: "rags", helm: r() > 0.5 ? "kalpak" : "none", helmCol: 0x6a5844, build: 1, hunch: 0.1 });
    case "villager":
    default: {
      const female = r() > 0.55;
      return buildHumanoid({
        skin,
        cloth: tint,
        trim: 0x2a1c10,
        armor: female ? "robe" : "rags",
        armorCol: 0xc9a46a,
        helm: female ? "none" : (["none", "kalpak", "bork"] as const)[Math.floor(r() * 3)],
        helmCol: 0x6a5844,
        hair: female ? { col: [0x1a1008, 0x4a2a14, 0x8a5a2a][Math.floor(r() * 3)], long: true } : r() > 0.5 ? { col: 0x2a1c10 } : null,
        beard: !female && r() > 0.6 ? 0x3a2a1a : null,
        build: female ? 0.84 : 1,
        scale: female ? 0.97 : 1,
      });
    }
  }
}

export function buildCamel(seed = 1, packs = 4): QuadRig {
  const r = seeded(seed);
  const rig = buildQuadruped({
    kind: "camel",
    coat: [0xb8935a, 0xa8834a, 0xc9a46a][Math.floor(r() * 3)],
    accent: 0x7a5a30,
    mane: 0x5a3a1e,
    saddle: 0x8a2a2a,
    packs,
    scale: 1,
  });
  dress(rig, "camel");
  return rig;
}

export function buildWolf(seed = 1): QuadRig {
  const r = seeded(seed);
  return buildQuadruped({ kind: "wolf", coat: r() > 0.5 ? 0x6a6a70 : 0x3a3a40, accent: 0x2a2a2e, eye: 0xffaa22, scale: 1 });
}

// ───────────────────────── Bosslar ─────────────────────────

/** Gövde parçaları (küreler) bir omurga eğrisi üzerinde kıvrılır. */
function sphereChain(n: number, rad: (i: number) => number, matFor: (i: number) => ReturnType<typeof M>): { g: Group; segs: Mesh[] } {
  const geo = new SphereGeometry(1, 9, 7);
  const g = new Group();
  const segs: Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const m = new Mesh(geo, matFor(i));
    m.scale.setScalar(rad(i));
    m.castShadow = true;
    g.add(m);
    segs.push(m);
  }
  return { g, segs };
}

function wingGeo(): ShapeGeometry {
  const s = new Shape();
  s.moveTo(0, 0);
  s.lineTo(0.5, 1.0);
  s.lineTo(1.9, 1.5);
  s.lineTo(3.3, 0.55);
  s.lineTo(2.6, 0.15);
  s.lineTo(2.3, 0.62);
  s.lineTo(1.7, -0.2);
  s.lineTo(1.3, 0.35);
  s.lineTo(0.8, -0.5);
  s.lineTo(0.3, -0.1);
  s.lineTo(0, 0);
  return new ShapeGeometry(s);
}

function bone(p: Parts, ax: number, ay: number, bx: number, by: number, t: number, mat: ReturnType<typeof M>): void {
  const len = Math.hypot(bx - ax, by - ay);
  p.box(len, t, t, mat, [(ax + bx) / 2, (ay + by) / 2, 0.01], [0, 0, Math.atan2(by - ay, bx - ax)]);
}

/** Evren — kanatlı ejderha. */
export function buildDragon(): Actor {
  const rig = new RigBase();
  const scale = UNIT * 0.95;
  rig.root.scale.setScalar(scale);
  rig.height = 3.6 * scale;
  const N = 18;
  const hide = 0x8a2a1a;
  const { g, segs } = sphereChain(
    N,
    (i) => {
      const u = i / (N - 1);
      return 0.42 * (1 - Math.pow(Math.abs(u - 0.28), 1.1) * 0.8) * (1 - u * 0.78) + 0.05;
    },
    (i) => M(i % 2 ? hide : 0x70200f, { rough: 0.7 }),
  );
  rig.yaw.add(g);
  // baş + boynuz
  const head = new Group();
  const hp = new Parts();
  hp.box(0.4, 0.28, 0.7, M(hide), [0, 0, 0.3], [0.15, 0, 0]);
  hp.box(0.3, 0.14, 0.4, M(0x70200f), [0, -0.12, 0.62], [0.1, 0, 0]);
  for (const s of [-1, 1]) {
    hp.cone(0.07, 0.6, M(0xe8e0c8), [s * 0.2, 0.28, 0.0], 5, [-0.9, 0, -s * 0.4]);
    hp.box(0.07, 0.07, 0.04, M(0x111111, { emissive: 0xff7a1a, ei: 1.6 }), [s * 0.17, 0.08, 0.54]);
    for (let k = 0; k < 3; k++) hp.cone(0.025, 0.1, M(0xf0ead8), [s * 0.1, -0.2, 0.5 + k * 0.1], 4, [Math.PI, 0, 0]);
  }
  head.add(hp.build(true, true));
  rig.yaw.add(head);
  // kanatlar
  const wing = wingGeo();
  const memb = M(0x4a1208, { double: true, rough: 0.9 });
  const wings: { pivot: Group; s: number }[] = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(s * 0.25, 0.85, -1.0);
    const inner = new Group();
    inner.rotation.x = Math.PI / 2;
    inner.scale.x = s;
    const wm = new Mesh(wing, memb);
    wm.castShadow = true;
    inner.add(wm);
    const bp = new Parts();
    const bm = M(hide);
    bone(bp, 0, 0, 0.5, 1.0, 0.07, bm);
    bone(bp, 0.5, 1.0, 1.9, 1.5, 0.06, bm);
    bone(bp, 1.9, 1.5, 3.3, 0.55, 0.05, bm);
    bone(bp, 1.9, 1.5, 1.7, -0.2, 0.035, bm);
    bone(bp, 1.9, 1.5, 0.8, -0.5, 0.035, bm);
    inner.add(bp.build(true, true));
    pivot.add(inner);
    rig.yaw.add(pivot);
    wings.push({ pivot, s });
  }
  // bacaklar
  const lp = new Parts();
  for (const [x, z] of [[-0.36, -0.6], [0.36, -0.6], [-0.3, -2.0], [0.3, -2.0]] as const) {
    lp.cyl(0.09, 0.06, 0.55, M(hide), [x, 0.3, z], 6);
    lp.box(0.16, 0.06, 0.24, M(0x2a1008), [x, 0.03, z + 0.06]);
    for (const q of [-1, 0, 1]) lp.cone(0.02, 0.1, M(0xf0ead8), [x + q * 0.05, 0.03, z + 0.2], 4, [Math.PI / 2, 0, 0]);
  }
  rig.yaw.add(lp.build(true, true));
  // sırt dikenleri
  const spikes: Mesh[] = [];
  const spikeMat = M(0xe0a050);
  const spikeGeo = new SphereGeometry(1, 4, 3);
  for (let i = 0; i < N - 2; i++) {
    const s = new Mesh(spikeGeo, spikeMat);
    s.scale.set(0.05, 0.16, 0.08);
    rig.yaw.add(s);
    spikes.push(s);
  }

  let ph = 0;
  rig.anim = (dt, sp2, t) => {
    ph += dt * (1.2 + sp2 * 3);
    const amp = 0.14 + sp2 * 0.12;
    const hover = 0.2 + Math.sin(t * 1.3) * 0.04;
    let px = 0;
    let pz = 1.0;
    let hx = 0;
    let hy = 0;
    let hz = 0;
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1);
      const lat = Math.sin(ph * 1.2 - i * 0.55) * amp * (0.3 + u);
      const vy = 0.5 + Math.sin(ph * 0.9 - i * 0.4) * 0.05 + (i < 6 ? (6 - i) * 0.1 : 0) - u * 0.22 + hover;
      pz -= i === 0 ? 0 : 0.27 + (1 - u) * 0.05;
      px = lat;
      segs[i].position.set(px, vy, pz);
      if (i === 0) {
        hx = px;
        hy = vy;
        hz = pz;
      }
      if (i < spikes.length) spikes[i].position.set(px, vy + segs[i].scale.y * 0.95, pz);
    }
    head.position.set(hx, hy + 0.05, hz + 0.35);
    head.rotation.y = Math.sin(t * 0.8) * 0.2;
    head.rotation.x = Math.sin(t * 1.4) * 0.05;
    for (const w of wings) {
      const f = Math.sin(t * (1.8 + sp2 * 2)) * 0.5 - 0.1;
      w.pivot.rotation.z = w.s * f;
    }
  };
  rig.anim(0, 0, 0, "walk");
  return rig;
}

/** Şahmeran — yılan kadın. */
export function buildSahmeran(): Actor {
  const rig = new RigBase();
  const scale = UNIT * 1.0;
  rig.root.scale.setScalar(scale);
  rig.height = 3.0 * scale;
  const N = 56;
  const { g, segs } = sphereChain(
    N,
    (i) => 0.08 + 0.23 * Math.pow(i / (N - 1), 0.65),
    (i) => M(i % 6 < 2 ? 0xc9a24a : i % 6 < 4 ? 0x2a8a4a : 0x1f6a3a, { rough: 0.6 }),
  );
  rig.yaw.add(g);
  const COIL = 40;
  const place = (t: number) => {
    for (let i = 0; i < N; i++) {
      let a: number;
      let r: number;
      let y: number;
      if (i < COIL) {
        a = i * 0.36;
        r = 1.2 - i * 0.0175;
        y = 0.1 + i * 0.008 + segs[i].scale.y * 0.6;
      } else {
        const u = (i - COIL) / (N - 1 - COIL);
        a = COIL * 0.36 + u * 1.5;
        r = (1.2 - COIL * 0.0175) * (1 - u * 0.95);
        y = 0.4 + u * 0.58;
      }
      const wob = Math.sin(t * 1.4 + i * 0.2) * 0.012;
      segs[i].position.set(Math.cos(a) * (r + wob), y, Math.sin(a) * (r + wob));
    }
  };
  const top = new Group();
  rig.yaw.add(top);
  const hum = buildHumanoid({ noLegs: true, cloth: 0x2a8a5a, trim: 0xd4af37, skin: 0xd8b898, hair: { col: 0x0e2a1c, long: true }, helm: "crown", weapon: "none", build: 0.86, scale: 1 });
  hum.root.scale.setScalar(1);
  top.add(hum.root);
  top.position.set(0, 0.02, 0);
  rig.anim = (dt, sp, t) => {
    place(t);
    hum.update(dt, 0, t);
    hum.anim(dt, 0, t, "walk");
    top.position.x = Math.sin(t * 0.9) * 0.05;
    top.rotation.z = Math.sin(t * 0.9) * 0.05;
    void sp;
  };
  rig.anim(0, 0, 0, "walk");
  return rig;
}

/** Zehirdiş — dev akrep. */
export function buildScorpion(): Actor {
  const rig = new RigBase();
  const scale = UNIT * 1.35;
  rig.root.scale.setScalar(scale);
  rig.height = 1.8 * scale;
  const shell = M(0x2a1c14, { rough: 0.5, metal: 0.25 });
  const shell2 = M(0x4a2a1a, { rough: 0.55, metal: 0.2 });
  const glow = M(0x1a0a05, { emissive: 0xa0ff30, ei: 1.5 });
  const body = new Group();
  rig.yaw.add(body);
  const bp = new Parts();
  bp.sph(0.62, shell, [0, 0.5, 0.35], [1, 0.55, 1.1], 10);
  bp.sph(0.4, shell2, [0, 0.62, 0.55], [1, 0.4, 0.9], 8);
  for (let i = 0; i < 5; i++) bp.sph(0.4 - i * 0.04, i % 2 ? shell : shell2, [0, 0.5, -0.35 - i * 0.28], [1, 0.62, 0.75], 8);
  for (const s of [-1, 1]) {
    bp.box(0.06, 0.06, 0.04, glow, [s * 0.2, 0.7, 0.92]);
    bp.box(0.06, 0.06, 0.04, glow, [s * 0.34, 0.66, 0.84]);
  }
  body.add(bp.build(true, true));

  // kuyruk zinciri
  const tail: Group[] = [];
  let parent: Group = body;
  const T = 6;
  for (let i = 0; i < T; i++) {
    const seg = new Group();
    if (i === 0) seg.position.set(0, 0.62, -1.75);
    else seg.position.set(0, 0.36 - i * 0.015, 0);
    seg.rotation.x = i === 0 ? -0.45 : 0.52;
    const tp = new Parts();
    const rr = 0.15 - i * 0.012;
    tp.cyl(rr * 0.85, rr, 0.38, shell2, [0, 0.19, 0], 7);
    tp.sph(rr * 1.1, shell, [0, 0.38, 0], undefined, 7);
    if (i === T - 1) {
      tp.sph(0.17, shell, [0, 0.48, 0.05], [1, 1.2, 1.3], 8);
      tp.cone(0.06, 0.3, glow, [0, 0.72, 0.12], 5, [0.9, 0, 0]);
    }
    seg.add(tp.build(true, true));
    parent.add(seg);
    parent = seg;
    tail.push(seg);
  }

  // bacaklar
  const legs: { g: Group; lower: Group; s: number; i: number }[] = [];
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const g = new Group();
      g.position.set(s * 0.42, 0.4, 0.62 - i * 0.34);
      g.rotation.z = -s * 1.0;
      g.rotation.y = s * (0.55 - i * 0.28);
      const up = new Parts();
      up.cyl(0.055, 0.045, 0.5, shell2, [0, 0.25, 0], 5);
      g.add(up.build(true, true));
      const lower = new Group();
      lower.position.set(0, 0.5, 0);
      lower.rotation.z = -s * 1.4;
      const lp = new Parts();
      lp.cyl(0.045, 0.02, 0.8, shell, [0, 0.4, 0], 5);
      lower.add(lp.build(true, true));
      g.add(lower);
      body.add(g);
      legs.push({ g, lower, s, i });
    }
  }
  // kıskaçlar
  const claws: Group[] = [];
  for (const s of [-1, 1]) {
    const arm = new Group();
    arm.position.set(s * 0.42, 0.5, 0.85);
    arm.rotation.y = s * 0.55;
    const ap = new Parts();
    ap.cyl(0.07, 0.08, 0.7, shell2, [0, 0, 0.35], 6, [Math.PI / 2, 0, 0]);
    ap.box(0.28, 0.14, 0.44, shell, [s * 0.04, 0, 0.88]);
    ap.cone(0.07, 0.36, shell, [s * 0.1, 0, 1.2], 5, [Math.PI / 2, 0, 0]);
    arm.add(ap.build(true, true));
    const pin = new Group();
    pin.position.set(-s * 0.1, 0, 1.0);
    const pp = new Parts();
    pp.cone(0.06, 0.34, shell, [0, 0, 0.17], 5, [Math.PI / 2, 0, 0]);
    pin.add(pp.build(true, true));
    arm.add(pin);
    body.add(arm);
    claws.push(arm);
  }

  let ph = 0;
  rig.anim = (dt, sp, t) => {
    ph += dt * (3 + sp * 8);
    for (const l of legs) {
      const a = Math.sin(ph + (l.i % 2 ? Math.PI : 0) + (l.s > 0 ? 0 : Math.PI));
      l.g.rotation.x = a * 0.25 * (0.25 + sp);
      l.lower.rotation.x = Math.max(0, a) * 0.3 * (0.25 + sp);
    }
    for (let i = 1; i < tail.length; i++) tail[i].rotation.x = 0.52 + Math.sin(t * 1.8 + i * 0.5) * 0.07 + (sp > 0.1 ? Math.sin(ph) * 0.03 : 0);
    tail[0].rotation.x = -0.45 + Math.sin(t * 1.5) * 0.05;
    claws.forEach((c, i) => (c.rotation.x = Math.sin(t * 1.6 + i * 2) * 0.07 - 0.05));
    body.position.y = Math.abs(Math.sin(ph)) * 0.02 * sp;
  };
  rig.anim(0, 0, 0, "walk");
  return rig;
}

/** Harita boss id → özel glb (yoksa `boss_${id}`). */
const BOSS_GLB: Record<string, string> = {
  akbars: "boss_kokboru",
  yelbegen: "boss_golem",
  karakoncolos: "boss_albasti",
  // hikâye / deep id'leri doğrudan dosya adıyla
  kokboru: "boss_kokboru",
  karahan: "boss_karahan",
  erlik: "boss_erlik",
  golem: "boss_golem",
  albasti: "boss_albasti",
};

/** Karakoncolos, Yelbegen, Fedai: iskelet insan varyantları. */
export function buildBoss(id: string): Actor {
  let rig: Actor;
  switch (id) {
    case "karakoncolos":
    case "albasti":
      rig = buildHumanoid({ skin: 0x5a5a68, cloth: 0x3a3a4a, trim: 0x22222c, armor: "rags", helm: "hood", helmCol: 0x2a2a38, hair: null, beard: null, armLen: 1.5, hunch: 0.5, build: 0.88, eyeGlow: 0xffd23a, scale: 1.25, pants: 0x2a2a36, boots: 0x1c1c24, weapon: "none" });
      break;
    case "yelbegen":
    case "golem":
      rig = buildHumanoid({ skin: 0x8a7a58, cloth: 0x4a3a2a, trim: 0x2a1c10, armor: "rags", armorCol: 0x5a4a30, heads: 3, build: 1.55, armLen: 1.15, hunch: 0.1, weapon: "club", eyeGlow: 0xff4a1a, scale: 1.7, pants: 0x3a2e22, boots: 0x20160e, hair: { col: 0x2a1c10 } });
      break;
    case "fedai":
      rig = buildHumanoid({ skin: 0xb88c64, cloth: 0x4a2030, trim: 0xc02a2a, armor: "leather", armorCol: 0x30303c, helm: "hood", helmCol: 0x3a1c28, weapon: "twin", cape: 0x8a1a1a, eyeGlow: 0xff3a3a, build: 1.0, scale: 1.18, pants: 0x2c2c38 });
      break;
    case "akbars":
    case "kokboru":
      rig = buildQuadruped({ kind: "leopard", coat: 0xe6ecf0, accent: 0xc2ccd4, spots: 0x3a3a46, eye: 0x66ddff, scale: 2.2 });
      break;
    case "karahan":
    case "erlik":
      rig = buildHumanoid({ skin: 0x6a5a4a, cloth: 0x2a1a1a, armor: "plate", armorCol: 0x3a3a42, helm: "crown", weapon: "axe", cape: 0x1a0a0a, eyeGlow: 0xff3a1a, build: 1.35, scale: 1.5 });
      break;
    case "evren":
      rig = buildDragon();
      break;
    case "sahmeran":
      rig = buildSahmeran();
      break;
    case "akrep":
      rig = buildScorpion();
      break;
    default:
      rig = buildHumanoid({ skin: 0x6a5a4a, cloth: 0x3a2a2a, armor: "rags", weapon: "club", eyeGlow: 0xff3a1a, build: 1.3, scale: 1.4 });
  }
  dress(rig, BOSS_GLB[id] ?? `boss_${id}`);
  return rig;
}
