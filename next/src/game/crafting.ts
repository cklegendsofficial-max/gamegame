import type { Good, Item, Slot } from "./rpg";
import type { GearMods } from "./legend";

export type Mat = Good | "ruh" | "parsomen" | "gold";
export type Cost = Partial<Record<Mat, number>>;

export interface Consumable {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: Cost;
  lv: number;
}

export const CONSUMABLES: Consumable[] = [
  { id: "merhem", name: "Şifa Merhemi", icon: "healer", desc: "Canının yarısını hemen doldurur.", cost: { pamuk: 1, baharat: 1, gold: 10 }, lv: 1 },
  { id: "kimiz", name: "Kımız Tulumu", icon: "food", desc: "Enerjini tamamen doldurur.", cost: { deri: 1, pamuk: 1, gold: 15 }, lv: 1 },
  { id: "davul", name: "Savaş Davulu", icon: "trophy", desc: "Sonraki 3 savaşta birliğin %15 güçlü vurur.", cost: { deri: 2, gumus: 1, gold: 30 }, lv: 4 },
  { id: "totem", name: "Kurt Totemi", icon: "tr_wolf", desc: "Sonraki 3 savaşta kahraman saldırısı %25 artar.", cost: { turkuaz: 1, ruh: 1, gold: 40 }, lv: 6 },
  { id: "tutsu", name: "Ruh Tütsüsü", icon: "spices", desc: "Sonraki 3 savaşta her tur %4 can yenilersin.", cost: { baharat: 2, yesim: 1, gold: 50 }, lv: 8 },
];
export const CONS_BY_ID: Record<string, Consumable> = Object.fromEntries(CONSUMABLES.map((c) => [c.id, c]));

export interface Refine {
  id: string;
  name: string;
  icon: string;
  out: "ruh" | "parsomen";
  cost: Cost;
}

export const REFINES: Refine[] = [
  { id: "ruhdamit", name: "Ruh Taşı damıt", icon: "ruh", out: "ruh", cost: { turkuaz: 3, yesim: 1, gold: 60 } },
  { id: "parsomenyaz", name: "Kutsal Parşömen yaz", icon: "parsomen", out: "parsomen", cost: { ipek: 2, ruh: 3, gold: 80 } },
];

export const CRAFT_SLOTS: Slot[] = ["silah", "zirh", "kalkan", "tilsim"];

export function gearCost(slot: Slot, t: number): Cost {
  const c: Cost = { gold: Math.round(35 * t * t) };
  if (slot === "silah") {
    c.demir = 2 * t;
    if (t >= 3) c.gumus = t - 2;
  } else if (slot === "zirh") {
    c.deri = 2 * t;
    c.demir = t;
    c.pamuk = t;
  } else if (slot === "kalkan") {
    c.demir = t + 1;
    c.deri = t;
  } else {
    c.turkuaz = t;
    if (t >= 3) c.yesim = t - 2;
  }
  if (t >= 4) c.ruh = t - 3;
  return c;
}

/** Kademe 4 ve 5 tarifleri için gereken zanaat seviyesi. */
export const TIER_ZL = [0, 0, 0, 0, 3, 6];

export interface CraftMat {
  id: string;
  name: string;
  icon: string;
  desc: string;
  slots: Slot[];
  /** Ustalık ağacında açıldığı zanaat seviyesi. */
  zl: number;
  cost: (t: number) => Cost;
  apply: (it: Item, t: number) => void;
}

export const CRAFT_MATS: CraftMat[] = [
  { id: "sade", name: "Sade demir", icon: "mat_iron", desc: "Bildik tarif; ek malzeme istemez.", slots: ["silah", "zirh", "kalkan", "tilsim"], zl: 0, cost: () => ({}), apply: () => {} },
  {
    id: "sam", name: "Şam çeliği", icon: "it_sword_4", desc: "Dalgalı desenli çelik: saldırı +%20, kritik +%2.", slots: ["silah"], zl: 2,
    cost: (t) => ({ gumus: 1 + Math.floor(t / 2), gold: 25 * t }),
    apply: (it) => { it.atk = Math.round(it.atk * 1.2) + 1; it.crit = Math.round((it.crit + 0.02) * 1000) / 1000; },
  },
  {
    id: "cin", name: "Çin demiri", icon: "porcelain", desc: "Sert, yorulmaz demir: dayanıklılık verir. Silahta savunma ve can, zırhta savunma +%25.", slots: ["silah", "zirh", "kalkan"], zl: 4,
    cost: (t) => (t >= 3 ? { demir: t, porselen: 1, gold: 20 * t } : { demir: t, gold: 20 * t }),
    apply: (it, t) => {
      if (it.slot === "silah") { it.def += 1 + t; it.hp += 4 * t; }
      else { it.def = Math.round(it.def * 1.25) + 1; it.hp += 2 * t; }
    },
  },
  {
    id: "kosele", name: "Kösele deri", icon: "mat_leather", desc: "Kat kat dikilmiş sığır derisi: can +%35.", slots: ["zirh", "kalkan"], zl: 4,
    cost: (t) => ({ deri: t + 1, gold: 15 * t }),
    apply: (it, t) => { it.hp = Math.round(it.hp * 1.35) + 2 * t; },
  },
  {
    id: "ipek", name: "İpek astar", icon: "silk", desc: "Oku yavaşlatan ipek katmanlar: savunma ve hız +%3.", slots: ["zirh"], zl: 7,
    cost: (t) => ({ ipek: 1 + Math.floor(t / 2), gold: 30 * t }),
    apply: (it, t) => { it.def += t; it.mods = { ...(it.mods ?? {}), spd: Math.round(((it.mods?.spd ?? 0) + 0.03) * 100) / 100 }; },
  },
  {
    id: "turkuaz", name: "Turkuaz kakma", icon: "turquoise", desc: "Komutanın taşı: liderlik artar.", slots: ["tilsim"], zl: 7,
    cost: (t) => ({ turkuaz: 1 + Math.floor(t / 2), gold: 20 * t }),
    apply: (it, t) => { it.lid += 1 + Math.floor(t / 2); },
  },
  {
    id: "yesim", name: "Yeşim kakma", icon: "jade", desc: "Hanların taşı: karizma artar.", slots: ["tilsim"], zl: 7,
    cost: (t) => ({ yesim: 1, gold: 25 * t }),
    apply: (it, t) => { it.kar += 1 + Math.floor(t / 2); },
  },
];
export const MAT_BY_ID: Record<string, CraftMat> = Object.fromEntries(CRAFT_MATS.map((m) => [m.id, m]));

export interface Signature {
  id: string;
  /** {w} sınıf silahının adıyla, {wp} iyelik ekli haliyle doldurulur. */
  name: string;
  slot: Slot;
  tier: number;
  rar: number;
  zl: number;
  icon: string;
  desc: string;
  cost: Cost;
  mods: GearMods;
}

export const SIGNATURES: Signature[] = [
  { id: "usta", name: "Usta Damgalı {w}", slot: "silah", tier: 3, rar: 3, zl: 5, icon: "anvil", desc: "Ustanın mührünü taşıyan ilk silahın. Saldırı +%6, kritik +%3.", cost: { demir: 6, gumus: 2, gold: 450, ruh: 1 }, mods: { atk: 0.06, crit: 0.03 } },
  { id: "zirh", name: "Ustanın Zırhı", slot: "zirh", tier: 4, rar: 3, zl: 9, icon: "shield", desc: "Ölçüne göre dövülmüş zırh. Savunma ve can +%8.", cost: { demir: 8, deri: 6, ipek: 2, gold: 900, ruh: 2 }, mods: { def: 0.08, hp: 0.08 } },
  { id: "pir", name: "Demirci Pirinin Mührü", slot: "tilsim", tier: 4, rar: 4, zl: 12, icon: "seal", desc: "Ustalar ustasının mührü. Ganimet +%10, tecrübe +%8, ordu gücü +%4.", cost: { yesim: 2, turkuaz: 3, gumus: 3, gold: 1500, ruh: 4 }, mods: { loot: 0.1, xp: 0.08, army: 0.04 } },
  { id: "kut", name: "Kut {wp}", slot: "silah", tier: 5, rar: 4, zl: 16, icon: "crown", desc: "Gökten düşen demirden dövülür. Saldırı +%12, kritik +%5, ordu +%5.", cost: { demir: 12, gumus: 5, yesim: 2, gold: 4000, ruh: 8, parsomen: 2 }, mods: { atk: 0.12, crit: 0.05, army: 0.05 } },
];
export const SIG_BY_ID: Record<string, Signature> = Object.fromEntries(SIGNATURES.map((s) => [s.id, s]));

/** Zanaat ustalık ağacı: seviye yükseldikçe açılan tarifler. */
export const MASTERY: { zl: number; name: string; desc: string; icon: string }[] = [
  { zl: 0, name: "Çırak", desc: "Kademe 1–3 eşyalar, sade demir", icon: "anvil" },
  { zl: 2, name: "Şam çeliği", desc: "Silahlara saldırı katan dalgalı çelik", icon: "it_sword_4" },
  { zl: 3, name: "Kalfa", desc: "Kademe 4 tarifleri", icon: "it_armor_4" },
  { zl: 4, name: "Çin demiri · Kösele", desc: "Dayanıklılık ve can veren malzemeler", icon: "porcelain" },
  { zl: 5, name: "İmza: Usta Damgalı silah", desc: "İlk imza eşyan", icon: "seal" },
  { zl: 6, name: "Usta", desc: "Kademe 5 tarifleri", icon: "it_sword_5" },
  { zl: 7, name: "İpek · Turkuaz · Yeşim", desc: "Zırh astarı ve tılsım kakmaları", icon: "silk" },
  { zl: 9, name: "İmza: Ustanın Zırhı", desc: "Ölçüne dövülmüş zırh", icon: "shield" },
  { zl: 12, name: "İmza: Pirin Mührü", desc: "Efsanevi tılsım", icon: "crown" },
  { zl: 16, name: "İmza: Kut silahı", desc: "Gök demirinden efsanevi silah", icon: "trophy" },
];
