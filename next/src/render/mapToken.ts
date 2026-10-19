import { Container, Graphics, Sprite, Texture } from "pixi.js";

export type TokenKind = "hero" | "bandit" | "boss" | "caravan" | "rival" | "ally" | "mongol";

const ACCENT: Record<TokenKind, { rim: number; glow: number; badge: string }> = {
  hero: { rim: 0xffd56a, glow: 0xffe8a0, badge: "★" },
  bandit: { rim: 0xff5a3a, glow: 0xff8a70, badge: "⚔" },
  boss: { rim: 0xc58cff, glow: 0xe0b0ff, badge: "☠" },
  caravan: { rim: 0xe2bd62, glow: 0xffe2a0, badge: "◆" },
  rival: { rim: 0x6ab8ff, glow: 0xa8d4ff, badge: "♦" },
  ally: { rim: 0x7fd36a, glow: 0xb0f090, badge: "" },
  mongol: { rim: 0xc0392b, glow: 0xff8060, badge: "◆" },
};

/**
 * 2.5D harita için yüksek kaliteli çerçeveli portre.
 * Figürlerle birlikte kullanılır; düz kırmızı daire yerine metalik halka + gölge + rozet.
 */
export function mapPortrait(
  face: Texture,
  r: number,
  kind: TokenKind = "ally",
  colorOverride?: number,
): Container {
  const c = new Container();
  const acc = ACCENT[kind];
  const rim = colorOverride ?? acc.rim;

  // yer teması
  const sh = new Graphics()
    .ellipse(0, r * 0.92, r * 0.95, r * 0.28)
    .fill({ color: 0x000000, alpha: 0.38 });
  c.addChild(sh);

  // koyu disk + çift halka
  const frame = new Graphics();
  frame.circle(0, 0, r + 5).fill({ color: 0x100804, alpha: 0.96 });
  frame.circle(0, 0, r + 5).stroke({ color: rim, width: kind === "boss" ? 4.5 : 3.5, alpha: 1 });
  frame.circle(0, 0, r + 1.5).stroke({ color: acc.glow, width: 1.25, alpha: 0.5 });
  if (kind === "boss") {
    frame.circle(0, 0, r + 9).stroke({ color: rim, width: 1.5, alpha: 0.35 });
  }
  if (kind === "hero") {
    // küçük sancak ucu
    frame
      .poly([r + 2, -r * 0.85, r + 14, -r * 0.55, r + 2, -r * 0.35])
      .fill({ color: rim, alpha: 0.95 });
  }
  if (kind === "bandit") {
    frame
      .poly([0, -r - 10, 7, -r - 2, -7, -r - 2])
      .fill({ color: rim, alpha: 0.9 });
  }
  c.addChild(frame);

  const s = new Sprite(face);
  s.anchor.set(0.5);
  // Hafif içe çek — kirli alpha / halo maske dışında kalır
  const sc = (r * 1.92) / Math.max(1, face.width, face.height);
  s.scale.set(sc);
  s.label = "face";
  const mask = new Graphics().circle(0, 0, r - 1).fill(0xffffff);
  s.mask = mask;
  c.addChild(mask, s);
  // Kenar halkası: cutout halo’yu rim altında gizler
  const soft = new Graphics().circle(0, 0, r - 0.5).stroke({ color: 0x1a1008, width: Math.max(2, r * 0.12), alpha: 0.45 });
  soft.label = "soft";
  c.addChild(soft);

  // alt ışık noktası
  const gem = new Graphics().circle(0, r * 0.72, Math.max(3, r * 0.14)).fill({ color: rim, alpha: 0.85 });
  gem.label = "gem";
  c.addChild(gem);

  // birleşik art motion: ince aura (tickToken ile nabız)
  const aura = new Graphics().circle(0, 0, r + 11).stroke({ color: rim, width: 1.5, alpha: 0.28 });
  aura.label = "aura";
  c.addChildAt(aura, 1);

  c.label = `tok_${kind}`;
  return c;
}

/** Portre token’larına ortak nefes / aura — procedural Fig ile aynı nabız dili. */
export function tickToken(c: Container, time: number, kind: TokenKind = "ally"): void {
  const aura = c.getChildByLabel("aura") as Graphics | null;
  const gem = c.getChildByLabel("gem") as Graphics | null;
  const rate = kind === "boss" ? 3.2 : kind === "bandit" || kind === "mongol" ? 4.2 : 2.4;
  const bob = Math.sin(time * rate);
  c.pivot.y = bob * (kind === "boss" ? 1.4 : 0.9);
  if (aura) aura.alpha = 0.18 + 0.14 * (0.5 + 0.5 * bob);
  if (gem) gem.alpha = 0.7 + 0.25 * (0.5 + 0.5 * Math.sin(time * rate * 1.3));
}
