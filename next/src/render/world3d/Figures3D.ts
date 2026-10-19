import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "three";

function bodyMat(hex: number, emissive = 0, emisI = 0): MeshStandardMaterial {
  const m = new MeshStandardMaterial({
    color: new Color(hex),
    roughness: 0.72,
    metalness: 0.15,
  });
  if (emissive) {
    m.emissive = new Color(emissive);
    m.emissiveIntensity = emisI;
  }
  return m;
}

function limb(
  w: number,
  h: number,
  d: number,
  mat: MeshStandardMaterial,
  x: number,
  y: number,
  z: number
): Mesh {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** Düşük-poly sinematik figür: gövde + kafa + silah. */
export function buildFigure(opts: {
  primary: number;
  secondary?: number;
  scale?: number;
  boss?: boolean;
  mounted?: boolean;
  weapon?: "sword" | "bow" | "staff" | "axe" | "none";
}): Group {
  const scale = opts.scale ?? 1;
  const g = new Group();
  const cloth = bodyMat(opts.primary);
  const accent = bodyMat(opts.secondary ?? 0x2a2018);
  const skin = bodyMat(0xc4a882);
  const metal = bodyMat(0x8a8a90, 0, 0);
  metal.metalness = 0.65;
  metal.roughness = 0.35;

  const s = scale;
  // bacaklar
  g.add(limb(0.35 * s, 0.9 * s, 0.35 * s, cloth, -0.22 * s, 0.45 * s, 0));
  g.add(limb(0.35 * s, 0.9 * s, 0.35 * s, cloth, 0.22 * s, 0.45 * s, 0));
  // gövde
  const torso = new Mesh(new BoxGeometry(0.7 * s, 0.95 * s, 0.4 * s), cloth);
  torso.position.set(0, 1.25 * s, 0);
  torso.castShadow = true;
  g.add(torso);
  // omuz
  g.add(limb(0.95 * s, 0.28 * s, 0.4 * s, accent, 0, 1.65 * s, 0));
  // kollar
  g.add(limb(0.22 * s, 0.7 * s, 0.22 * s, cloth, -0.52 * s, 1.2 * s, 0));
  g.add(limb(0.22 * s, 0.7 * s, 0.22 * s, cloth, 0.52 * s, 1.2 * s, 0));
  // kafa
  const head = new Mesh(new SphereGeometry(0.28 * s, 8, 6), skin);
  head.position.set(0, 1.95 * s, 0);
  head.castShadow = true;
  g.add(head);
  // miğfer / saç
  const helm = new Mesh(new SphereGeometry(0.3 * s, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), accent);
  helm.position.set(0, 2.05 * s, 0);
  g.add(helm);

  const w = opts.weapon ?? "sword";
  if (w === "sword" || w === "axe") {
    const blade = new Mesh(
      new BoxGeometry(0.08 * s, w === "axe" ? 0.5 * s : 0.85 * s, 0.18 * s),
      metal
    );
    blade.position.set(0.72 * s, 1.35 * s, 0.15 * s);
    blade.rotation.z = -0.35;
    g.add(blade);
    if (w === "axe") {
      const headA = new Mesh(new BoxGeometry(0.35 * s, 0.25 * s, 0.08 * s), metal);
      headA.position.set(0.72 * s, 1.55 * s, 0.15 * s);
      g.add(headA);
    }
  } else if (w === "bow") {
    const bow = new Mesh(new CylinderGeometry(0.04 * s, 0.04 * s, 1.1 * s, 6), bodyMat(0x5a3a20));
    bow.position.set(-0.65 * s, 1.3 * s, 0.1 * s);
    bow.rotation.z = 0.2;
    g.add(bow);
  } else if (w === "staff") {
    const staff = new Mesh(new CylinderGeometry(0.06 * s, 0.06 * s, 1.6 * s, 6), bodyMat(0x4a3020));
    staff.position.set(0.65 * s, 1.4 * s, 0);
    g.add(staff);
    const orb = new Mesh(new SphereGeometry(0.18 * s, 8, 6), bodyMat(0x44aaff, 0x2288ff, 1.2));
    orb.position.set(0.65 * s, 2.25 * s, 0);
    g.add(orb);
  }

  if (opts.mounted) {
    const horse = bodyMat(0x3a2a1a);
    const body = new Mesh(new BoxGeometry(1.6 * s, 0.7 * s, 0.55 * s), horse);
    body.position.set(0, 0.55 * s, 0);
    body.castShadow = true;
    g.add(body);
    const hHead = new Mesh(new BoxGeometry(0.45 * s, 0.4 * s, 0.35 * s), horse);
    hHead.position.set(0.85 * s, 0.85 * s, 0);
    g.add(hHead);
    // yükselt figürü
    torso.position.y += 0.55 * s;
    head.position.y += 0.55 * s;
    helm.position.y += 0.55 * s;
  }

  if (opts.boss) {
    const aura = new Mesh(
      new CylinderGeometry(1.4 * s, 1.6 * s, 0.08 * s, 16),
      bodyMat(0xff2200, 0xff4400, 0.9)
    );
    aura.position.y = 0.04;
    g.add(aura);
    const crown = new Mesh(new ConeGeometry(0.35 * s, 0.4 * s, 5), bodyMat(0xd4af37, 0xffaa00, 0.4));
    crown.position.set(0, 2.35 * s + (opts.mounted ? 0.55 * s : 0), 0);
    g.add(crown);
    g.scale.setScalar(1.35);
  }

  g.userData.figure = true;
  return g;
}

export const FACTION_COLORS: Record<string, { primary: number; secondary: number; weapon: "sword" | "bow" | "staff" | "axe" | "none" }> = {
  player: { primary: 0xc45a28, secondary: 0x2a1a10, weapon: "sword" },
  bandit: { primary: 0x4a3a30, secondary: 0x1a1510, weapon: "axe" },
  caravan: { primary: 0xc8a060, secondary: 0x5a4020, weapon: "none" },
  boss: { primary: 0x5a1020, secondary: 0x1a0508, weapon: "axe" },
  mongol: { primary: 0x2a3a28, secondary: 0x1a2018, weapon: "bow" },
  soldier: { primary: 0x3a4a58, secondary: 0x1a2028, weapon: "sword" },
  mage: { primary: 0x2a2860, secondary: 0x1a1040, weapon: "staff" },
};
