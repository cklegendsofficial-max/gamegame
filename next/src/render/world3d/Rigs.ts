import { Group } from "three";
import { M, Parts, turnToward } from "./Kit";

/**
 * Eklemli low-poly iskeletler: insan + dört ayaklı (at/deve/kurt/kaplan).
 * Model birimi: insan boyu ≈ 1.8. +Z ileri yöndür (kamera güneyden bakar).
 */

export type RigMode = "walk" | "hammer" | "stand" | "cheer";

/** Tam yürüyüş hızı olarak kabul edilen dünya birimi/sn. */
const REF_SPEED = 70;

export class RigBase {
  root = new Group();
  yaw = new Group();
  heading = 0;
  sp = 0;
  /** Saldırı vuruşu 0..1 (kol kalkar, iner); 0 = kapalı. */
  attack = 0;
  mode: RigMode = "walk";
  /** Dünya birimiyle yaklaşık boy (etiket yüksekliği için). */
  height = 60;
  anim: (dt: number, sp: number, t: number, mode: RigMode) => void = () => {};
  private lx = Number.NaN;
  private lz = Number.NaN;

  constructor() {
    this.root.add(this.yaw);
  }

  update(dt: number, target: number, t: number): void {
    this.sp += (target - this.sp) * Math.min(1, dt * 8);
    this.anim(dt, this.sp, t, this.mode);
    this.yaw.rotation.y = this.heading;
  }

  /** Konumdan yön + hız çıkarır; yürüme animasyonunu sürer. */
  follow(x: number, y: number, z: number, dt: number, t: number): void {
    this.root.position.set(x, y, z);
    let speed = 0;
    if (!Number.isNaN(this.lx) && dt > 0) {
      const dx = x - this.lx;
      const dz = z - this.lz;
      const d = Math.hypot(dx, dz);
      const raw = d / dt / REF_SPEED;
      // yavaş yürüyüş bile belirgin adım atsın (kayma hissi olmasın)
      speed = raw < 0.02 ? 0 : Math.min(1, 0.3 + raw * 0.8);
      if (d > 0.02) this.heading = turnToward(this.heading, Math.atan2(dx, dz), dt * 9);
    }
    this.lx = x;
    this.lz = z;
    this.update(dt, speed, t);
  }

  /** Işınlanma sonrası hız hesabını sıfırla. */
  reset(): void {
    this.lx = Number.NaN;
    this.lz = Number.NaN;
    this.sp = 0;
  }

  face(h: number): void {
    this.heading = h;
    this.yaw.rotation.y = h;
  }
}

// ───────────────────────── İNSAN ─────────────────────────

export type HelmKind = "none" | "kalpak" | "conical" | "horned" | "turban" | "hood" | "skull" | "feather" | "bork" | "crown" | "bandana";
export type WeaponKind = "none" | "sword" | "axe" | "spear" | "bow" | "staff" | "dagger" | "club" | "hammer" | "kopuz" | "twin";
export type ArmorKind = "none" | "leather" | "mail" | "plate" | "robe" | "rags";

export interface HumanoidOpts {
  skin?: number;
  cloth?: number;
  trim?: number;
  pants?: number;
  boots?: number;
  helm?: HelmKind;
  helmCol?: number;
  armor?: ArmorKind;
  armorCol?: number;
  weapon?: WeaponKind;
  shield?: boolean;
  shieldCol?: number;
  cape?: number;
  beard?: number | null;
  hair?: { col: number; long?: boolean } | null;
  /** Gövde genişliği çarpanı. */
  build?: number;
  /** Kol uzunluğu çarpanı (karakoncolos). */
  armLen?: number;
  /** Öne eğik duruş (rad). */
  hunch?: number;
  heads?: number;
  eyeGlow?: number | null;
  noLegs?: boolean;
  mounted?: QuadOpts | null;
  /** Dünya ölçeği (1 ≈ 61 birim boy). */
  scale?: number;
  apron?: number | null;
}

export const UNIT = 34;

function weaponGroup(kind: WeaponKind, metal: number): Group {
  const g = new Group();
  const steel = M(metal, { rough: 0.35, metal: 0.7 });
  const wood = M(0x5a3a1e, { rough: 0.8 });
  const gold = M(0xd4af37, { rough: 0.4, metal: 0.6 });
  const p = new Parts();
  switch (kind) {
    case "sword":
      p.box(0.07, 0.8, 0.02, steel, [0, 0.62, 0]);
      p.box(0.3, 0.05, 0.06, gold, [0, 0.22, 0]);
      p.cyl(0.03, 0.03, 0.22, wood, [0, 0.1, 0], 6);
      p.sph(0.045, gold, [0, -0.02, 0], undefined, 6);
      break;
    case "axe":
      p.cyl(0.03, 0.035, 1.0, wood, [0, 0.4, 0], 6);
      p.box(0.34, 0.3, 0.05, steel, [0.14, 0.78, 0], [0, 0, 0.1]);
      p.box(0.05, 0.14, 0.06, steel, [-0.06, 0.78, 0]);
      break;
    case "spear":
      p.cyl(0.028, 0.03, 2.1, wood, [0, 0.7, 0], 6);
      p.cone(0.07, 0.34, steel, [0, 1.9, 0], 5);
      p.box(0.1, 0.1, 0.02, M(0xb02a1a), [0, 1.62, 0.04]);
      break;
    case "bow":
      p.torus(0.55, 0.025, wood, [0, 0.4, 0], [0, 0, Math.PI / 2 + 0.0], Math.PI * 0.95, 14);
      p.box(0.012, 1.08, 0.012, M(0xe8e0c8), [-0.0, 0.4, 0]);
      break;
    case "staff":
      p.cyl(0.035, 0.04, 1.9, wood, [0, 0.6, 0], 6);
      p.sph(0.12, M(0x44aaff, { emissive: 0x2288ff, ei: 0.9, rough: 0.3 }), [0, 1.62, 0], undefined, 8);
      p.torus(0.14, 0.02, gold, [0, 1.62, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 10);
      break;
    case "dagger":
      p.box(0.05, 0.36, 0.015, steel, [0, 0.3, 0]);
      p.box(0.14, 0.03, 0.04, gold, [0, 0.1, 0]);
      p.cyl(0.022, 0.022, 0.12, wood, [0, 0.02, 0], 5);
      break;
    case "club":
      p.cyl(0.07, 0.05, 1.0, wood, [0, 0.45, 0], 6);
      p.sph(0.17, wood, [0, 1.0, 0], [1, 1.3, 1], 7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        p.cone(0.03, 0.09, steel, [Math.cos(a) * 0.15, 1.0 + (i % 2) * 0.1, Math.sin(a) * 0.15], 4, [Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4]);
      }
      break;
    case "hammer":
      p.cyl(0.03, 0.035, 0.7, wood, [0, 0.28, 0], 6);
      p.box(0.26, 0.18, 0.16, steel, [0, 0.68, 0]);
      break;
    case "kopuz":
      p.sph(0.17, wood, [0, 0.1, 0.05], [1, 1.2, 0.5], 8);
      p.cyl(0.025, 0.025, 0.7, wood, [0, 0.55, 0.04], 5);
      break;
    default:
      break;
  }
  g.add(p.build(false, true));
  return g;
}

function helmParts(p: Parts, kind: HelmKind, col: number, skin: number, y: number): void {
  const metal = M(col, { rough: 0.35, metal: 0.7 });
  const cloth = M(col, { rough: 0.9 });
  const fur = M(0x6a5844, { rough: 1 });
  const gold = M(0xd4af37, { rough: 0.4, metal: 0.6 });
  switch (kind) {
    case "kalpak":
      p.cyl(0.19, 0.2, 0.2, fur, [0, y + 0.1, 0], 10);
      p.cyl(0.14, 0.18, 0.1, cloth, [0, y + 0.25, 0], 10);
      break;
    case "conical":
      p.dome(0.2, metal, [0, y + 0.075, 0], [1, 1.1, 1.05]);
      p.cone(0.05, 0.22, metal, [0, y + 0.34, 0], 6);
      p.cyl(0.205, 0.205, 0.04, gold, [0, y + 0.09, 0], 12);
      {
        const av = M(0x8a8a90, { rough: 0.6, metal: 0.5 });
        p.box(0.38, 0.2, 0.06, av, [0, y - 0.12, -0.18]);
        for (const s of [-1, 1]) p.box(0.05, 0.2, 0.3, av, [s * 0.19, y - 0.12, -0.03]);
        p.box(0.022, 0.09, 0.02, metal, [0, y + 0.0, 0.195]);
      }
      break;
    case "horned":
      p.dome(0.2, metal, [0, y + 0.02, 0], [1, 0.95, 1.05]);
      for (const s of [-1, 1]) p.cone(0.045, 0.3, M(0xe8e0c8), [s * 0.2, y + 0.18, 0], 5, [0, 0, -s * 0.8]);
      break;
    case "turban":
      p.sph(0.2, cloth, [0, y + 0.07, 0], [1.08, 0.78, 1.08], 10);
      p.torus(0.19, 0.04, M(0xe8e0c8), [0, y + 0.06, 0], [Math.PI / 2, 0, 0], Math.PI * 2, 12);
      p.sph(0.05, gold, [0, y + 0.1, 0.19], undefined, 6);
      break;
    case "hood":
      p.sph(0.215, cloth, [0, y + 0.01, -0.02], [1, 1.02, 1.05], 10);
      p.cone(0.14, 0.2, cloth, [0, y - 0.19, -0.12], 6, [0.5, 0, 0]);
      break;
    case "skull":
      p.sph(0.19, M(0xe6e0d0), [0, y, 0], [1, 1.05, 1], 8);
      p.box(0.14, 0.09, 0.14, M(0xe6e0d0), [0, y - 0.15, 0.05]);
      p.box(0.07, 0.06, 0.04, M(0x110608, { emissive: 0xff2200, ei: 0.8 }), [-0.07, y + 0.02, 0.17]);
      p.box(0.07, 0.06, 0.04, M(0x110608, { emissive: 0xff2200, ei: 0.8 }), [0.07, y + 0.02, 0.17]);
      break;
    case "feather":
      p.cyl(0.19, 0.2, 0.16, fur, [0, y + 0.08, 0], 10);
      p.cone(0.04, 0.5, M(0x3a8a5a), [0.04, y + 0.38, -0.02], 4, [0.15, 0, -0.22]);
      p.cone(0.04, 0.42, M(0xd8442a), [-0.05, y + 0.34, -0.02], 4, [0.15, 0, 0.25]);
      break;
    case "bork":
      p.cyl(0.14, 0.19, 0.36, cloth, [0, y + 0.16, 0], 10);
      p.cyl(0.2, 0.2, 0.06, fur, [0, y + 0.0, 0], 10);
      break;
    case "crown":
      p.cyl(0.17, 0.19, 0.12, gold, [0, y + 0.1, 0], 8);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        p.cone(0.035, 0.12, gold, [Math.cos(a) * 0.17, y + 0.2, Math.sin(a) * 0.17], 4);
      }
      break;
    case "bandana":
      p.cyl(0.185, 0.185, 0.07, cloth, [0, y + 0.1, 0], 10);
      p.box(0.06, 0.16, 0.04, cloth, [0.17, y + 0.02, -0.12], [0, 0, 0.3]);
      break;
    default:
      break;
  }
  void skin;
}

export interface HumanoidRig extends RigBase {
  horse?: QuadRig;
}

export function buildHumanoid(o: HumanoidOpts = {}): HumanoidRig {
  const rig = new RigBase() as HumanoidRig;
  const skin = o.skin ?? 0xc9a07a;
  const cloth = o.cloth ?? 0x7a5a3a;
  const trim = o.trim ?? 0x2a1c10;
  const pants = o.pants ?? 0x4a3a2a;
  const boots = o.boots ?? 0x2a1c12;
  const armor = o.armor ?? "none";
  const bw = o.build ?? 1;
  const armLen = o.armLen ?? 1;
  const weapon = o.weapon ?? "none";
  const heads = o.heads ?? 1;
  const sc = (o.scale ?? 1) * UNIT * (o.mounted ? 0.92 : 1);
  rig.root.scale.setScalar(sc);
  rig.height = (o.mounted ? 2.8 : 1.95) * sc * (o.heads ? 1 : 1);

  const body = new Group();
  rig.yaw.add(body);

  // ── bacaklar
  const legs: Group[] = [];
  if (!o.noLegs) {
    for (const s of [-1, 1]) {
      const lg = new Group();
      lg.position.set(s * 0.13 * bw, 0.92, 0);
      const lp = new Parts();
      const pc = armor === "robe" ? cloth : pants;
      lp.cyl(0.098, 0.078, 0.52, M(pc), [0, -0.26, 0], 10);
      lp.sph(0.08, M(pc), [0, -0.52, 0], undefined, 8);
      lp.cyl(0.078, 0.09, 0.4, M(boots, { rough: 0.7 }), [0, -0.68, 0], 10);
      lp.box(0.14, 0.08, 0.28, M(boots, { rough: 0.7 }), [0, -0.9, 0.05]);
      lg.add(lp.build(true, true));
      body.add(lg);
      legs.push(lg);
    }
  }

  // ── gövde
  const torsoG = new Group();
  body.add(torsoG);
  {
    const tp = new Parts();
    const torsoCol = armor === "plate" || armor === "mail" ? (o.armorCol ?? 0x8a8a90) : cloth;
    const metalish = armor === "plate" || armor === "mail";
    const tm = M(torsoCol, { rough: metalish ? 0.4 : 0.9, metal: metalish ? 0.55 : 0.05 });
    tp.sph(0.285 * bw, tm, [0, 1.3, 0], [1, 1.02, 0.72], 14);
    tp.cyl(0.25 * bw, 0.2 * bw, 0.34, tm, [0, 1.0, 0], 14, undefined, [1, 1, 0.72]);
    tp.sph(0.23 * bw, tm, [0, 0.92, 0], [1, 0.6, 0.75], 12);
    tp.cyl(0.215 * bw, 0.225 * bw, 0.07, M(trim), [0, 0.99, 0], 14, undefined, [1, 1, 0.78]);
    if (armor === "leather") {
      tp.sph(0.3 * bw, M(o.armorCol ?? 0x5a3a20, { rough: 0.8 }), [0, 1.3, 0.01], [1, 0.78, 0.76], 14);
      tp.box(0.035, 0.4, 0.22 * bw, M(trim), [0, 1.3, 0.1 * bw]);
    } else if (armor === "mail") {
      tp.cyl(0.27 * bw, 0.34 * bw, 0.3, M(o.armorCol ?? 0x7a7a82, { rough: 0.5, metal: 0.55 }), [0, 0.82, 0], 8);
    } else if (armor === "plate") {
      tp.sph(0.3 * bw, M(o.armorCol ?? 0x9a9aa4, { rough: 0.3, metal: 0.75 }), [0, 1.3, 0.02], [1, 0.92, 0.78], 14);
      tp.cyl(0.27 * bw, 0.33 * bw, 0.26, M(trim), [0, 0.84, 0], 8);
    } else if (armor === "robe") {
      tp.cyl(0.26 * bw, 0.44 * bw, 0.95, M(cloth), [0, 0.5, 0], 9);
      tp.box(0.54 * bw, 0.07, 0.32 * bw, M(o.armorCol ?? 0xd4af37, { metal: 0.4 }), [0, 0.97, 0]);
    } else if (armor === "rags") {
      tp.box(0.5 * bw, 0.2, 0.3 * bw, M(0x6a5a40), [0, 0.8, 0], [0, 0, 0.08]);
    }
    if (o.apron) tp.box(0.4 * bw, 0.65, 0.04, M(o.apron, { rough: 0.9 }), [0, 1.0, 0.17 * bw]);
    // omuzluklar
    const shCol = metalish ? M(o.armorCol ?? 0x9a9aa4, { rough: 0.3, metal: 0.7 }) : M(trim);
    for (const s of [-1, 1]) tp.sph(0.125 * bw, shCol, [s * 0.31 * bw, 1.5, 0], [1, 0.8, 1], 7);
    // boyun
    tp.cyl(0.06, 0.07, 0.1, M(skin), [0, 1.56, 0], 6);
    torsoG.add(tp.build(true, true));
  }
  // pelerin: omuzdan asılı, yürürken/koşarken savrulan ayrı parça
  let capeG: Group | null = null;
  if (o.cape) {
    capeG = new Group();
    capeG.position.set(0, 1.52, -0.19 * bw);
    const cp = new Parts();
    const cm = M(o.cape, { double: true, rough: 0.95 });
    cp.box(0.42 * bw, 0.5, 0.035, cm, [0, -0.25, 0]);
    cp.box(0.5 * bw, 0.45, 0.03, cm, [0, -0.7, -0.015], [0.04, 0, 0]);
    cp.box(0.52 * bw, 0.05, 0.04, M(trim, { rough: 0.8 }), [0, -0.94, -0.02]);
    cp.box(0.46 * bw, 0.06, 0.07, M(trim, { rough: 0.8 }), [0, 0.0, 0.0]);
    capeG.add(cp.build(true, true));
    torsoG.add(capeG);
  }

  // ── baş
  const headG = new Group();
  headG.position.set(0, 1.7, 0);
  body.add(headG);
  const headMesh: Group[] = [];
  const offsets: [number, number][] = heads >= 3 ? [[0, 0], [-0.26, -0.05], [0.26, -0.05]] : heads === 2 ? [[-0.15, 0], [0.15, 0]] : [[0, 0]];
  for (const [ox, oy] of offsets) {
    const hg = new Group();
    hg.position.set(ox, oy, 0);
    const hp = new Parts();
    hp.sph(0.175, M(skin, { rough: 0.8 }), [0, 0, 0], [1, 1.08, 1.02], 16);
    hp.box(0.2, 0.03, 0.05, M(skin, { rough: 0.8 }), [0, 0.062, 0.148]);
    hp.box(0.045, 0.07, 0.06, M(skin), [0, -0.02, 0.17]);
    const eye = o.eyeGlow ? M(0x110606, { emissive: o.eyeGlow, ei: 1.4 }) : M(0x1a120c);
    const browCol = o.hair?.col ?? o.beard ?? 0x2a1c10;
    for (const s of [-1, 1]) {
      hp.sph(0.03, M(0xe9dfcc, { rough: 0.5 }), [s * 0.065, 0.04, 0.158], [1, 0.75, 0.5], 8);
      hp.sph(0.016, eye, [s * 0.065, 0.04, 0.172], [1, 1, 0.6], 6);
      hp.box(0.07, 0.016, 0.03, M(browCol, { rough: 1 }), [s * 0.065, 0.088, 0.158], [0, 0, s * -0.14]);
    }
    hp.box(0.1, 0.014, 0.03, M(0x6a3a2a), [0, -0.09, 0.16]);
    if (o.beard) {
      const bm = M(o.beard, { rough: 1 });
      hp.sph(0.13, bm, [0, -0.13, 0.07], [1, 1.2, 0.8], 10);
      hp.sph(0.05, bm, [0, -0.2, 0.12], [1.1, 1.3, 0.8], 8);
      hp.box(0.13, 0.03, 0.04, bm, [0, -0.06, 0.17], [0.15, 0, 0]);
    }
    if (o.hair) {
      hp.dome(0.185, M(o.hair.col, { rough: 1 }), [0, 0.01, -0.01], [1, 1.05, 1.05]);
      if (o.hair.long) hp.box(0.34, 0.5, 0.1, M(o.hair.col, { rough: 1 }), [0, -0.25, -0.12]);
    }
    helmParts(hp, o.helm ?? "none", o.helmCol ?? 0x8a8a90, skin, 0.0);
    hg.add(hp.build(true, true));
    headG.add(hg);
    headMesh.push(hg);
  }

  // ── kollar
  const arms: Group[] = [];
  for (const s of [-1, 1]) {
    const ag = new Group();
    ag.position.set(s * 0.33 * bw, 1.46, 0);
    const ap = new Parts();
    const sleeve = armor === "plate" ? (o.armorCol ?? 0x9a9aa4) : cloth;
    const L = 0.55 * armLen;
    ap.cyl(0.07, 0.058, L, M(sleeve, { rough: armor === "plate" ? 0.35 : 0.9, metal: armor === "plate" ? 0.6 : 0.05 }), [0, -L / 2, 0], 10);
    ap.cyl(0.062, 0.07, 0.16, M(trim), [0, -L + 0.06, 0], 7);
    ap.sph(0.065, M(skin), [0, -L - 0.05, 0], undefined, 7);
    ag.add(ap.build(true, true));
    body.add(ag);
    arms.push(ag);
  }
  const armL = arms[0];
  const armR = arms[1];
  const handY = -0.55 * armLen - 0.05;

  // ── silah
  const wMetal = 0xb8bcc4;
  if (weapon !== "none") {
    if (weapon === "twin") {
      for (const a of arms) {
        const w = weaponGroup("dagger", wMetal);
        w.position.set(0, handY, 0.02);
        w.rotation.x = Math.PI / 2;
        a.add(w);
      }
    } else if (weapon === "bow") {
      const w = weaponGroup("bow", wMetal);
      w.position.set(0, handY, 0.05);
      w.rotation.set(0, Math.PI / 2, 0);
      armL.add(w);
    } else if (weapon === "kopuz") {
      const w = weaponGroup("kopuz", wMetal);
      w.position.set(0.0, handY + 0.1, 0.08);
      w.rotation.x = 0.6;
      armL.add(w);
    } else {
      const w = weaponGroup(weapon, wMetal);
      w.position.set(0, handY, 0.02);
      w.rotation.x = Math.PI / 2 - 0.15;
      armR.add(w);
    }
  }
  if (o.shield) {
    const sp = new Parts();
    const sc2 = o.shieldCol ?? 0x8a2a1a;
    sp.cyl(0.22, 0.22, 0.05, M(sc2, { rough: 0.7 }), [0, 0, 0], 16, [Math.PI / 2, 0, 0]);
    sp.torus(0.22, 0.025, M(0xb8bcc4, { metal: 0.6, rough: 0.4 }), [0, 0, 0.03], [0, 0, 0], Math.PI * 2, 14);
    sp.sph(0.07, M(0xd4af37, { metal: 0.6, rough: 0.4 }), [0, 0, 0.05], [1, 1, 0.6], 10);
    const sg = sp.build(true, true);
    sg.position.set(-0.03, handY + 0.2, 0.14);
    sg.rotation.y = -0.3;
    armL.add(sg);
  }

  // ── binek
  let horse: QuadRig | undefined;
  if (o.mounted) {
    horse = buildQuadruped(o.mounted);
    horse.root.scale.setScalar(1);
    rig.yaw.add(horse.yaw);
    body.position.y = 0.62;
    body.position.z = -0.05;
    for (const lg of legs) lg.rotation.x = -0.35;
    legs.forEach((lg, i) => {
      lg.rotation.z = (i === 0 ? 1 : -1) * 0.38;
    });
    rig.horse = horse;
  }

  const hunch = o.hunch ?? 0;
  torsoG.rotation.x = hunch * 0.6;
  headG.rotation.x = hunch * 0.5;
  headG.position.z = hunch * 0.35;
  headG.position.y = 1.7 - hunch * 0.12;

  // ── animasyon
  let ph = Math.random() * 6;
  rig.anim = (dt, sp, t, mode) => {
    const freq = 3.2 + sp * 7.5;
    ph += dt * freq;
    const sw = Math.sin(ph) * sp;
    if (horse) {
      horse.anim(dt, sp, t, mode);
      body.position.y = 0.62 + Math.abs(Math.sin(ph * 0.5)) * 0.05 * sp;
      torsoG.rotation.x = hunch * 0.6 + 0.08 * sp;
      if (capeG) {
        capeG.rotation.x = 0.35 + sp * 0.7 + Math.sin(t * 3.1 + ph) * (0.05 + 0.09 * sp);
        capeG.rotation.z = Math.sin(t * 2.1 + ph * 0.4) * 0.07;
      }
      for (const a of arms) a.rotation.x = -0.45 - 0.1 * Math.sin(ph) * sp;
      armR.rotation.x = weapon === "spear" ? -0.15 : -0.7;
      headG.rotation.y = Math.sin(t * 0.7 + rig.heading) * 0.12;
      return;
    }
    for (let i = 0; i < legs.length; i++) legs[i].rotation.x = sw * 0.85 * (i === 0 ? 1 : -1);
    body.position.y = Math.abs(Math.sin(ph)) * 0.06 * sp + Math.sin(t * 1.9) * 0.008;
    torsoG.rotation.x = hunch * 0.6 + 0.07 * sp;
    torsoG.rotation.y = -sw * 0.12;
    if (capeG) {
      capeG.rotation.x = 0.1 + sp * 0.55 + Math.sin(t * 2.6 + ph * 0.5) * (0.03 + 0.07 * sp);
      capeG.rotation.z = Math.sin(t * 1.7 + ph * 0.3) * 0.05 * (0.4 + sp);
    }
    headG.rotation.y = Math.sin(t * 0.6 + rig.heading * 2) * 0.18 * (1 - sp);
    const swingL = -sw * 0.75;
    const swingR = sw * 0.75;
    const idleBreath = Math.sin(t * 1.9) * 0.025;
    if (mode === "hammer") {
      armR.rotation.x = -1.3 + Math.sin(t * 5.2) * 0.9;
      armL.rotation.x = -0.6 + Math.sin(t * 5.2 + 0.4) * 0.2;
    } else if (mode === "cheer") {
      armR.rotation.x = -2.6 + Math.sin(t * 6) * 0.25;
      armL.rotation.x = -2.5 + Math.sin(t * 6 + 1) * 0.25;
    } else if (weapon === "bow") {
      armL.rotation.x = -1.35;
      armR.rotation.x = swingR * 0.6 - 0.2;
    } else if (weapon === "spear") {
      armR.rotation.x = -0.2 + swingR * 0.3;
      armL.rotation.x = swingL * 0.7 + idleBreath;
    } else if (weapon === "none") {
      armL.rotation.x = swingL + idleBreath;
      armR.rotation.x = swingR - idleBreath;
    } else if (weapon === "twin") {
      armL.rotation.x = -0.5 + swingL * 0.6;
      armR.rotation.x = -0.5 + swingR * 0.6;
    } else {
      armL.rotation.x = swingL + idleBreath;
      armR.rotation.x = -0.5 + swingR * 0.45 + (sp < 0.1 ? Math.sin(t * 2.4) * 0.05 : 0);
    }
    if (o.shield) armL.rotation.x = -0.45 + swingL * 0.3;
    armL.rotation.z = 0.06;
    armR.rotation.z = -0.06;
    if (rig.attack > 0) {
      const a = rig.attack;
      if (weapon === "bow") {
        armR.rotation.x = -1.35;
        armR.rotation.y = -0.3 * Math.sin(a * Math.PI);
      } else {
        const wind = Math.min(1, a / 0.45);
        const hit = Math.max(0, (a - 0.45) / 0.55);
        armR.rotation.x = -0.4 - wind * 2.0 + hit * 2.4;
        torsoG.rotation.x += 0.3 * Math.sin(a * Math.PI);
        torsoG.rotation.y = -0.35 * Math.sin(a * Math.PI);
      }
    }
  };
  rig.anim(0, 0, 0, "walk");
  return rig;
}

// ───────────────────────── DÖRT AYAKLI ─────────────────────────

export type QuadKind = "horse" | "camel" | "wolf" | "leopard";

export interface QuadOpts {
  kind: QuadKind;
  coat: number;
  accent?: number;
  mane?: number;
  /** Eyer / örtü rengi. */
  saddle?: number | null;
  spots?: number | null;
  /** Yük (kervan): sırtta denk sayısı. */
  packs?: number;
  scale?: number;
  eye?: number | null;
}

export interface QuadRig extends RigBase {}

export function buildQuadruped(o: QuadOpts): QuadRig {
  const rig = new RigBase() as QuadRig;
  const k = o.kind;
  const coat = M(o.coat, { rough: 0.85 });
  const accent = M(o.accent ?? 0x2a1c12, { rough: 0.9 });
  const maneM = M(o.mane ?? o.accent ?? 0x1a120c, { rough: 1 });
  const sc = (o.scale ?? 1) * UNIT;
  rig.root.scale.setScalar(sc);
  const big = k === "camel";
  const low = k === "wolf" || k === "leopard";
  const bodyY = low ? 0.62 : big ? 1.45 : 1.18;
  const legH = low ? 0.55 : big ? 1.2 : 0.95;
  rig.height = (big ? 2.7 : low ? 1.0 : 2.1) * sc;

  const body = new Group();
  rig.yaw.add(body);
  const bp = new Parts();
  const len = low ? 0.62 : big ? 0.78 : 0.7;
  const wid = low ? 0.2 : big ? 0.3 : 0.27;
  bp.sph(1, coat, [0, bodyY, 0], [wid, low ? 0.24 : 0.34, len], 10);
  bp.sph(1, coat, [0, bodyY + 0.02, len * 0.7], [wid * 1.05, low ? 0.26 : 0.36, 0.3], 8);
  bp.sph(1, coat, [0, bodyY, -len * 0.7], [wid * 1.05, low ? 0.25 : 0.34, 0.3], 8);

  // boyun + baş
  const neckLen = big ? 0.95 : low ? 0.3 : 0.75;
  const nz = len * 0.95;
  const nTilt = big ? 0.5 : low ? 0.9 : 0.75;
  bp.cyl(low ? 0.09 : 0.12, low ? 0.13 : 0.19, neckLen, coat, [0, bodyY + neckLen * 0.42, nz + neckLen * 0.18], 7, [nTilt, 0, 0]);
  const hy = bodyY + neckLen * 0.82 + (big ? 0.1 : 0.12);
  const hz = nz + neckLen * 0.5 + 0.18;
  if (low) {
    bp.sph(0.16, coat, [0, hy - 0.1, hz - 0.05], [0.9, 0.85, 1.15], 8);
    bp.box(0.12, 0.09, 0.2, o.kind === "leopard" ? coat : accent, [0, hy - 0.14, hz + 0.16]);
    bp.cone(0.045, 0.09, coat, [-0.09, hy + 0.04, hz - 0.1], 4);
    bp.cone(0.045, 0.09, coat, [0.09, hy + 0.04, hz - 0.1], 4);
  } else if (big) {
    bp.box(0.2, 0.2, 0.42, coat, [0, hy, hz + 0.05], [0.4, 0, 0]);
    bp.cone(0.04, 0.12, coat, [-0.08, hy + 0.14, hz - 0.1], 4);
    bp.cone(0.04, 0.12, coat, [0.08, hy + 0.14, hz - 0.1], 4);
    // hörgüçler
    bp.sph(0.28, accent, [0, bodyY + 0.42, 0.3], [0.9, 1.1, 0.9], 8);
    bp.sph(0.26, accent, [0, bodyY + 0.4, -0.3], [0.9, 1.1, 0.9], 8);
  } else {
    bp.box(0.19, 0.21, 0.5, coat, [0, hy, hz], [0.55, 0, 0]);
    bp.box(0.15, 0.14, 0.18, accent, [0, hy - 0.16, hz + 0.24], [0.55, 0, 0]);
    bp.cone(0.04, 0.14, coat, [-0.07, hy + 0.17, hz - 0.12], 4);
    bp.cone(0.04, 0.14, coat, [0.07, hy + 0.17, hz - 0.12], 4);
    // yele
    bp.box(0.06, 0.55, 0.12, maneM, [0, bodyY + 0.5, nz + 0.1], [0.75, 0, 0]);
  }
  const eye = o.eye ? M(0x110606, { emissive: o.eye, ei: 1.2 }) : M(0x120c08);
  const eyeZ = low ? hz + 0.04 : hz + 0.12;
  bp.box(0.03, 0.03, 0.03, eye, [-0.09, hy + (low ? -0.06 : 0.02), eyeZ]);
  bp.box(0.03, 0.03, 0.03, eye, [0.09, hy + (low ? -0.06 : 0.02), eyeZ]);

  // eyer / yük
  if (o.saddle && !low) {
    bp.box(0.6, 0.06, 0.62, M(o.saddle, { rough: 0.8 }), [0, bodyY + (big ? 0.62 : 0.36), 0.0]);
    bp.box(0.4, 0.1, 0.34, M(0x4a2a14), [0, bodyY + (big ? 0.68 : 0.42), 0]);
  }
  const packs = o.packs ?? 0;
  for (let i = 0; i < packs; i++) {
    const s = i % 2 ? 1 : -1;
    bp.box(0.34, 0.42, 0.5, M(i % 3 === 0 ? 0xb8864a : i % 3 === 1 ? 0x8a5a3a : 0xc9a46a), [s * 0.34, bodyY + 0.05, (i >> 1) * 0.5 - 0.15], [0, 0, s * 0.08]);
  }
  if (o.spots) {
    const sp = M(o.spots, { rough: 1 });
    for (let i = 0; i < 14; i++) {
      const rz = ((i * 0.37) % 1) * len * 1.7 - len * 0.85;
      const rs = i % 2 ? 1 : -1;
      bp.sph(0.05, sp, [rs * wid * 0.82, bodyY + 0.06 + ((i * 7) % 5) * 0.03, rz], [0.5, 1, 1.2], 5);
    }
  }
  body.add(bp.build(true, true));

  // kuyruk
  const tail = new Group();
  tail.position.set(0, bodyY + 0.08, -len * 0.95);
  const tp = new Parts();
  if (low) {
    tp.cyl(0.05, 0.035, 0.85, coat, [0, 0.05, -0.38], 6, [-1.15, 0, 0]);
    if (o.spots) for (let i = 0; i < 4; i++) tp.cyl(0.055, 0.055, 0.05, M(o.spots), [0, 0.18 + i * 0.03, -0.18 - i * 0.2], 6, [-1.15, 0, 0]);
  } else {
    tp.cyl(0.06, 0.03, big ? 0.55 : 0.85, maneM, [0, -(big ? 0.25 : 0.4), -0.1], 6, [0.18, 0, 0]);
  }
  tail.add(tp.build(true, true));
  body.add(tail);

  // bacaklar (önce-ön: FL, FR, BL, BR)
  const legs: { g: Group; lower: Group; front: boolean; left: boolean }[] = [];
  for (const [lx, lz, front] of [
    [-1, 1, true],
    [1, 1, true],
    [-1, -1, false],
    [1, -1, false],
  ] as const) {
    const g = new Group();
    g.position.set(lx * (wid * 0.72), bodyY - 0.08, lz * len * 0.62);
    const up = new Parts();
    const uh = legH * 0.5;
    up.cyl(low ? 0.075 : 0.095, low ? 0.06 : 0.07, uh + 0.05, coat, [0, -uh / 2, 0], 6);
    g.add(up.build(true, true));
    const lower = new Group();
    lower.position.set(0, -uh, 0);
    const lp = new Parts();
    lp.cyl(low ? 0.055 : 0.06, low ? 0.05 : 0.05, legH * 0.5, low ? coat : accent, [0, -legH * 0.25, 0], 6);
    lp.cyl(low ? 0.065 : 0.065, low ? 0.07 : 0.075, 0.1, M(0x1a120c), [0, -legH * 0.5 + 0.03, low ? 0.03 : 0], 6);
    lower.add(lp.build(true, true));
    g.add(lower);
    body.add(g);
    legs.push({ g, lower, front, left: lx < 0 });
  }

  let ph = Math.random() * 6;
  rig.anim = (dt, sp, t) => {
    const gallop = sp > 0.72;
    ph += dt * (2.4 + sp * (gallop ? 9 : 6));
    for (const l of legs) {
      const diag = l.left === l.front ? 0 : Math.PI;
      const phase = gallop ? (l.front ? 0 : 0.7) + (l.left ? 0 : 0.18) : diag;
      const a = Math.sin(ph + phase);
      l.g.rotation.x = a * (gallop ? 0.95 : 0.6) * sp;
      l.lower.rotation.x = Math.max(0, -a) * 0.9 * sp;
    }
    body.position.y = Math.abs(Math.sin(ph)) * 0.07 * sp * (gallop ? 1.6 : 1);
    body.rotation.x = Math.sin(ph) * 0.04 * sp * (gallop ? 2 : 1);
    tail.rotation.x = 0.1 + Math.sin(t * 2.4 + 1) * 0.12 + sp * 0.35;
    tail.rotation.z = Math.sin(t * 1.7) * 0.2;
  };
  rig.anim(0, 0, 0, "walk");
  return rig;
}
