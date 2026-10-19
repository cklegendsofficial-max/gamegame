import {
  CircleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  type Texture,
} from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { buildFigure, FACTION_COLORS } from "./Figures3D";

export type TokenKind = "bandit" | "caravan" | "boss" | "hero" | "rival";

const RING: Record<TokenKind, number> = {
  hero: 0xffd56a,
  bandit: 0xff4a3a,
  boss: 0xc58cff,
  caravan: 0xe2bd62,
  rival: 0x6ab8ff,
};

const DEFAULT_H: Record<TokenKind, number> = {
  hero: 120,
  boss: 110,
  caravan: 70,
  bandit: 85,
  rival: 90,
};

const FIG_OPTS: Record<
  TokenKind,
  { primary: number; secondary: number; weapon: "sword" | "bow" | "staff" | "axe" | "none"; boss?: boolean; mounted?: boolean }
> = {
  hero: { ...FACTION_COLORS.player },
  bandit: { ...FACTION_COLORS.bandit },
  boss: { ...FACTION_COLORS.boss, boss: true },
  caravan: { ...FACTION_COLORS.caravan },
  rival: { ...FACTION_COLORS.soldier },
};

export interface UnitToken {
  root: Group;
  /** Billboard sprite; texture yoksa görünmez, mesh kullanılır. */
  sprite: Sprite;
  mesh: Group | null;
  label: CSS2DObject;
  kind: TokenKind;
  bob: number;
  baseScale: number;
  height: number;
}

function hasImage(tex: Texture | null): boolean {
  if (!tex) return false;
  const img = tex.image as { width?: number; height?: number } | undefined;
  return !!(img && (img.width ?? 0) > 4 && (img.height ?? 0) > 4);
}

function spriteAspect(tex: Texture): number {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img?.width || !img.height) return 0.65;
  return Math.min(1.15, Math.max(0.45, img.width / img.height));
}

/** Tam boy cutout billboard; texture yoksa Figures3D low-poly. Sarı kare yok. */
export function makeUnitToken(
  tex: Texture | null,
  kind: TokenKind,
  height?: number,
  name = "",
  opts?: { mounted?: boolean; weapon?: "sword" | "bow" | "staff" | "axe" | "none" },
): UnitToken {
  const h = height ?? DEFAULT_H[kind];
  const root = new Group();
  const ringCol = RING[kind];
  const fo = FIG_OPTS[kind];
  const mounted = opts?.mounted ?? !!fo.mounted;
  const weapon = opts?.weapon ?? fo.weapon;

  // yer gölgesi
  const shadow = new Mesh(
    new CircleGeometry(h * (kind === "hero" ? 0.22 : 0.16), 24),
    new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.35;
  // birimler yerleşim/prop sprite'larının üstünde çizilir (sis düzlemi 10'da)
  shadow.renderOrder = 4;
  root.add(shadow);

  // tür halkası (ayak altı, daire portre değil)
  const ring = new Mesh(
    new CircleGeometry(h * (kind === "boss" ? 0.26 : kind === "hero" ? 0.24 : 0.18), 32),
    new MeshBasicMaterial({
      color: ringCol,
      transparent: true,
      opacity: kind === "hero" ? 0.42 : 0.32,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.55;
  ring.renderOrder = 4;
  root.add(ring);

  const mat = new SpriteMaterial({
    map: hasImage(tex) ? tex : null,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.12,
  });
  if (tex) tex.colorSpace = SRGBColorSpace;
  const sprite = new Sprite(mat);
  sprite.center.set(0.5, 0);
  if (hasImage(tex) && tex) {
    const asp = spriteAspect(tex);
    sprite.scale.set(h * asp, h, 1);
    sprite.visible = true;
  } else {
    sprite.scale.set(0.01, 0.01, 1);
    sprite.visible = false;
  }
  sprite.position.y = 0;
  sprite.renderOrder = 5;
  root.add(sprite);

  let mesh: Group | null = null;
  if (!sprite.visible) {
    mesh = buildFigure({
      primary: fo.primary,
      secondary: fo.secondary,
      weapon: weapon,
      boss: fo.boss,
      mounted,
      scale: h / 28,
    });
    mesh.position.y = 0;
    root.add(mesh);
  }

  const el = document.createElement("div");
  el.className = `w3d-label token ${kind}`;
  el.textContent = name;
  const label = new CSS2DObject(el);
  // etiket ayak altında / gövde dibinde
  label.position.y = -2;
  root.add(label);

  return {
    root,
    sprite,
    mesh,
    label,
    kind,
    bob: Math.random() * Math.PI * 2,
    baseScale: 1,
    height: h,
  };
}

/** Hero yüz/siluet değişince texture güncelle; yoksa mesh’e düş. */
export function setTokenTexture(tok: UnitToken, tex: Texture | null): void {
  const mat = tok.sprite.material as SpriteMaterial;
  if (hasImage(tex) && tex) {
    tex.colorSpace = SRGBColorSpace;
    mat.map = tex;
    mat.needsUpdate = true;
    tok.sprite.visible = true;
    const asp = spriteAspect(tex);
    tok.sprite.scale.set(tok.height * asp, tok.height, 1);
    if (tok.mesh) {
      tok.root.remove(tok.mesh);
      tok.mesh = null;
    }
  } else {
    mat.map = null;
    mat.needsUpdate = true;
    tok.sprite.visible = false;
    if (!tok.mesh) {
      const fo = FIG_OPTS[tok.kind];
      tok.mesh = buildFigure({
        primary: fo.primary,
        secondary: fo.secondary,
        weapon: fo.weapon,
        boss: fo.boss,
        scale: tok.height / 28,
      });
      tok.root.add(tok.mesh);
    }
  }
}

export function setTokenLabel(tok: UnitToken, text: string): void {
  (tok.label.element as HTMLElement).textContent = text;
}

export function tickToken(tok: UnitToken, time: number, elev: number, x: number, z: number): void {
  const bob =
    tok.kind === "hero"
      ? Math.sin(time * 1.8 + tok.bob) * 1.4
      : tok.kind === "boss"
        ? Math.sin(time * 1.5 + tok.bob) * 2.8
        : Math.sin(time * 2.2 + tok.bob) * 1.6;
  tok.root.position.set(x, elev, z);
  if (tok.sprite.visible) {
    tok.sprite.position.y = bob;
  }
  if (tok.mesh) {
    tok.mesh.position.y = bob * 0.15;
    tok.mesh.rotation.y = Math.sin(time * 0.6 + tok.bob) * 0.08;
  }
  if (tok.kind === "boss") {
    const pulse = 1 + Math.sin(time * 2 + tok.bob) * 0.05;
    tok.root.scale.setScalar(tok.baseScale * pulse);
  }
}

/** Bandit çeşidi için texture anahtarı. */
export function banditTexKey(id: number): string {
  const roll = (id * 9301 + 49297) % 100;
  if (roll < 22) return "heroes/enemy_sword";
  if (roll < 42) return "heroes/enemy_axe";
  if (roll < 62) return "heroes/enemy_rider";
  if (roll < 82) return "heroes/enemy_heavy";
  return "heroes/enemy_chief";
}

export function banditFigOpts(id: number): { mounted?: boolean; weapon?: "sword" | "bow" | "staff" | "axe" | "none" } {
  const key = banditTexKey(id);
  if (key.includes("rider")) return { mounted: true, weapon: "sword" };
  if (key.includes("axe")) return { weapon: "axe" };
  if (key.includes("heavy") || key.includes("chief")) return { weapon: "axe" };
  return { weapon: "sword" };
}
