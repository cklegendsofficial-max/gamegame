import { ARMOR_NAME, WEAPON_NAME, WEAPON_STAT, type ArmorKind, type ClassDef, type WeaponKind } from "./classes";
import { SETS, modsText, type GearMods, type SetId, type Unique } from "./legend";
import { BREEDS, horseName, type Breed, type HorseInfo } from "./horse";
import { t } from "../i18n";

export type Stat = "guc" | "cev" | "day" | "lid" | "kar";
export const STAT_KEYS: Stat[] = ["guc", "cev", "day", "lid", "kar"];
export const STAT_INFO: Record<Stat, { name: string; short: string; desc: string; icon: string }> = {
  guc: { name: "Güç", short: "GÜÇ", desc: "Kılıç ve balta hasarı, çalışma verimi, taşıma kapasitesi", icon: "r_sword" },
  cev: { name: "Çeviklik", short: "ÇEV", desc: "Hançer ve yay hasarı, yürüyüş hızı", icon: "r_bow" },
  day: { name: "Dayanıklılık", short: "DAY", desc: "Can, enerji ve savunma", icon: "shield" },
  lid: { name: "Liderlik", short: "LİD", desc: "Birlik büyüklüğü ve askerlerin saldırı gücü", icon: "tug" },
  kar: { name: "Karizma", short: "KAR", desc: "Asa hasarı, gönüllü sayısı, asker ücreti ve pazar fiyatları", icon: "crown" },
};

export type Skill = "silah" | "ticaret" | "emek" | "zanaat";
export const SKILL_KEYS: Skill[] = ["silah", "ticaret", "emek", "zanaat"];
export const SKILL_INFO: Record<Skill, { name: string; desc: string; icon: string }> = {
  silah: { name: "Silah Ustalığı", desc: "Silahınla verdiğin hasarı her seviyede %6 artırır. Talim meydanında ve savaşta gelişir.", icon: "swords" },
  ticaret: { name: "Ticaret", desc: "Alış-satış fiyatlarını iyileştirir. Pazarda alışveriş yaptıkça gelişir.", icon: "merchant" },
  emek: { name: "Emek", desc: "Ormanda, ocakta ve tarlada çalışma verimini artırır.", icon: "mat_wood" },
  zanaat: { name: "Zanaat", desc: "Atölyede ürettikçe gelişir; nadir ve efsanevi eşya çıkarma şansını artırır.", icon: "anvil" },
};

export function skillLv(xp: number): number {
  return Math.min(50, Math.floor(Math.sqrt(xp / 20)));
}

export function skillNext(lv: number): number {
  return 20 * (lv + 1) * (lv + 1);
}

export type Slot = "silah" | "zirh" | "kalkan" | "at" | "tilsim";
export const SLOTS: Slot[] = ["silah", "zirh", "kalkan", "at", "tilsim"];
export const SLOT_NAME: Record<Slot, string> = { silah: "Silah", zirh: "Zırh", kalkan: "Kalkan", at: "Binek", tilsim: "Tılsım" };

export interface Item {
  id: number;
  slot: Slot;
  kind: WeaponKind | ArmorKind | "";
  tier: number;
  rar: number;
  name: string;
  icon: string;
  atk: number;
  def: number;
  hp: number;
  spd: number;
  carry: number;
  lid: number;
  kar: number;
  crit: number;
  lvReq: number;
  req: { stat: Stat; v: number } | null;
  plus?: number;
  base?: { atk: number; def: number; hp: number; name: string };
  set?: SetId;
  uq?: string;
  mods?: GearMods;
  horse?: HorseInfo;
  /** Nadir ve üstü eşyaların rastgele ekleri (AFFIXES anahtarları). */
  afx?: string[];
  /** Atölyede seçilen malzeme (CRAFT_MATS anahtarı). */
  mat?: string;
  /** Usta imzası tarifi. */
  sig?: string;
  /** Kahramanın ilk silahı: öldürdükçe büyür. */
  yad?: { kills: number; lv: number };
}

export function setPiece(id: number, cls: ClassDef, set: SetId, slot: Slot, tier: number): Item {
  const it = classItem(id, cls, slot, tier, 4, false);
  it.name = SETS[set].pieces[slot];
  it.set = set;
  return it;
}

export function uniqueItem(id: number, cls: ClassDef, u: Unique, tier: number): Item {
  const slot = u.slot === "kalkan" && !cls.shield ? "tilsim" : u.slot;
  const it = classItem(id, cls, slot, tier, 4, false);
  it.name = u.name;
  it.uq = u.id;
  it.mods = { ...u.mods };
  return it;
}

export const PLUS_MAX = 9;
export const PLUS_CHANCE = [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.42, 0.3, 0.2];

export function canPlus(it: Item): boolean {
  return (it.slot === "silah" || it.slot === "zirh" || it.slot === "kalkan") && (it.plus ?? 0) < PLUS_MAX;
}

export function plusCost(it: Item): { gold: number; ruh: number } {
  const p = it.plus ?? 0;
  return { gold: Math.round(itemPrice(it) * 0.25 * (p + 1)), ruh: p >= 3 ? p - 2 : 0 };
}

export function setPlus(it: Item, p: number): void {
  it.base ??= { atk: it.atk, def: it.def, hp: it.hp, name: it.name };
  it.plus = Math.max(0, Math.min(PLUS_MAX, p));
  const m = 1 + 0.13 * it.plus;
  it.atk = Math.round(it.base.atk * m + (it.base.atk ? it.plus : 0));
  it.def = Math.round(it.base.def * m + (it.base.def ? it.plus * 0.5 : 0));
  it.hp = Math.round(it.base.hp * m);
  it.name = it.plus ? `${it.base.name} +${it.plus}` : it.base.name;
}

export const RARITY = [
  { name: "Sıradan", mult: 1, color: "#e8dcc0" },
  { name: "İyi", mult: 1.25, color: "#8fe07a" },
  { name: "Nadir", mult: 1.55, color: "#6ab8ff" },
  { name: "Destansı", mult: 2, color: "#d58cff" },
  { name: "Efsanevi", mult: 2.6, color: "#ff9a3c" },
];

const WEAPONS: Record<WeaponKind, { names: string[]; icon: string; atk: number[]; crit: number }> = {
  kilic: { names: ["Paslı Kılıç", "Demir Kılıç", "Çelik Pala", "Şam Kılıcı", "Hükümdar Kılıcı"], icon: "it_sword_", atk: [4, 8, 13, 19, 27], crit: 0 },
  balta: { names: ["Odun Baltası", "Savaş Baltası", "Çift Ağızlı Balta", "Tolga Baltası", "Ejder Baltası"], icon: "it_axe_", atk: [6, 11, 17, 25, 35], crit: 0 },
  hancer: { names: ["Kör Hançer", "Demir Hançer", "Kıvrık Hançer", "Gölge Hançeri", "Ateş Hançeri"], icon: "it_dagger_", atk: [3, 7, 11, 17, 24], crit: 0.08 },
  ok: { names: ["Av Yayı", "Kompozit Yay", "Türk Yayı", "Usta Yayı", "Hakan Yayı"], icon: "it_bow_", atk: [4, 8, 13, 19, 27], crit: 0.04 },
  asa: { names: ["Ardıç Asa", "Kemik Asa", "Kristal Asa", "Tengri Asası", "Gök Kurt Asası"], icon: "it_staff_", atk: [4, 7, 12, 18, 25], crit: 0 },
};
const HEAVY = ["Keçe Yelek", "Deri Zırh", "Zincir Zırh", "Lamel Zırh", "Altın Lamel"];
const LIGHT = ["Deri Yelek", "Bağcıklı Deri", "Sertleştirilmiş Deri", "Gece Zırhı", "Gölge Cübbesi"];
const SHIELDS = ["Hasır Kalkan", "Ahşap Kalkan", "Demir Kalkan", "Tolga Kalkan", "Ejder Kalkan"];
const MOUNTS = ["Katır", "Bozkır Atı", "Arap Atı"];
const CHARMS = [
  { name: "Kurt Dişi", icon: "tr_wolf" },
  { name: "Kartal Tüyü", icon: "tr_feather" },
  { name: "Yeşim Göz", icon: "tr_jadeeye" },
  { name: "Kristal Muska", icon: "tr_crystal" },
  { name: "Yıldız Taşı", icon: "tr_star" },
];
export const ITEM_NAMES = { weapons: WEAPONS, heavy: HEAVY, light: LIGHT, shields: SHIELDS, mounts: MOUNTS, charms: CHARMS };
export const WEAPON_KINDS: WeaponKind[] = ["kilic", "balta", "hancer", "ok", "asa"];

const VOW = "aeıioöuü";
const POSS_DONE = new Set(["Şam Kılıcı", "Hükümdar Kılıcı", "Odun Baltası", "Savaş Baltası", "Tolga Baltası", "Ejder Baltası", "Gölge Hançeri", "Ateş Hançeri", "Av Yayı", "Türk Yayı", "Usta Yayı", "Hakan Yayı", "Tengri Asası", "Gök Kurt Asası", "Gece Zırhı", "Gölge Cübbesi", "Kurt Dişi", "Kartal Tüyü", "Yıldız Taşı", "Bozkır Atı", "Arap Atı"]);

/** Ad tamlamasının ikinci ögesi: "Demir Kılıç" → "Demir Kılıcı". */
export function poss(name: string): string {
  if ([...POSS_DONE].some((p) => name === p || name.endsWith(" " + p))) return name;
  const words = name.split(" ");
  const last = words.pop()!;
  const low = last.toLocaleLowerCase("tr");
  const lastV = [...low].reverse().find((c) => VOW.includes(c)) ?? "a";
  const v = "aı".includes(lastV) ? "ı" : "ei".includes(lastV) ? "i" : "ou".includes(lastV) ? "u" : "ü";
  const end = low[low.length - 1];
  const syll = [...low].filter((c) => VOW.includes(c)).length;
  let stem = last;
  if (VOW.includes(end)) stem = last + "s";
  else if (end === "ç") stem = last.slice(0, -1) + "c";
  else if (end === "k" && syll > 1) stem = last.slice(0, -1) + "ğ";
  else if (end === "p" && syll > 1) stem = last.slice(0, -1) + "b";
  return [...words, stem + v].join(" ");
}

export interface Affix {
  id: string;
  name: string;
  /** "pre": sıfat ("Ateşli"), "own": tamlayan ("Hanın"). */
  kind: "pre" | "own";
  slots: Slot[];
  roll: (it: Item, t: number, q: number) => void;
}

const addMod = (it: Item, k: keyof GearMods, v: number) => {
  it.mods ??= {};
  it.mods[k] = Math.round(((it.mods[k] ?? 0) + v) * 1000) / 1000;
};

export const AFFIXES: Affix[] = [
  { id: "kurtdisli", name: "Kurt Dişli", kind: "pre", slots: ["silah"], roll: (it, t, q) => { it.crit = Math.round((it.crit + 0.02 + 0.008 * t * q) * 1000) / 1000; } },
  { id: "atesli", name: "Ateşli", kind: "pre", slots: ["silah"], roll: (it, t, q) => { it.atk += Math.max(1, Math.round(it.atk * 0.12 * q + t * 0.5)); } },
  { id: "keskin", name: "Keskin", kind: "pre", slots: ["silah"], roll: (it, t, q) => { it.atk += Math.max(1, Math.round(t * 1.4 * q)); } },
  { id: "zehirli", name: "Zehirli", kind: "pre", slots: ["silah"], roll: (it, t, q) => { it.atk += Math.round(t * 0.6 * q); it.crit = Math.round((it.crit + 0.015 * q) * 1000) / 1000; } },
  { id: "saglam", name: "Sağlam", kind: "pre", slots: ["zirh", "kalkan"], roll: (it, t, q) => { it.def += Math.max(1, Math.round(t * 1.1 * q)); } },
  { id: "keceli", name: "Keçe Astarlı", kind: "pre", slots: ["zirh", "kalkan"], roll: (it, t, q) => { it.hp += Math.max(2, Math.round(t * 5 * q)); } },
  { id: "orgulu", name: "Demir Örgülü", kind: "pre", slots: ["zirh", "kalkan"], roll: (it, t, q) => { it.def += Math.round(t * 0.6 * q); it.hp += Math.round(t * 2.5 * q); } },
  { id: "ruzgar", name: "Rüzgâr Hızlı", kind: "pre", slots: ["zirh", "tilsim"], roll: (it, t, q) => addMod(it, "spd", Math.round((0.015 + 0.006 * t) * q * 100) / 100) },
  { id: "bilge", name: "Bilge", kind: "pre", slots: ["tilsim"], roll: (it, t, q) => { it.kar += Math.max(1, Math.round(t * 0.5 * q)); } },
  { id: "yigit", name: "Yiğit", kind: "pre", slots: ["tilsim"], roll: (it, t, q) => { it.lid += Math.max(1, Math.round(t * 0.5 * q)); } },
  { id: "han", name: "Hanın", kind: "own", slots: ["silah", "zirh", "kalkan", "tilsim"], roll: (it, t, q) => { it.kar += Math.max(1, Math.round(t * 0.35 * q)); it.lid += Math.max(1, Math.round(t * 0.35 * q)); } },
  { id: "bahadir", name: "Bahadırın", kind: "own", slots: ["silah", "zirh", "kalkan"], roll: (it, t, q) => { it.hp += Math.max(3, Math.round(t * 4 * q)); } },
  { id: "kurt", name: "Kurdun", kind: "own", slots: ["silah", "tilsim"], roll: (it, t, q) => { if (it.slot === "silah") it.atk += Math.max(1, Math.round(t * q)); else addMod(it, "atk", Math.round(0.03 * q * 100) / 100); } },
  { id: "kartal", name: "Kartalın", kind: "own", slots: ["silah", "zirh", "tilsim"], roll: (it, t, q) => { it.crit = Math.round((it.crit + 0.01 + 0.004 * t * q) * 1000) / 1000; } },
  { id: "tengri", name: "Tengri'nin", kind: "own", slots: ["silah", "zirh", "kalkan", "tilsim"], roll: (_it, _t, q) => addMod(_it, "xp", Math.round(0.04 * q * 100) / 100) },
  { id: "tuccar", name: "Tüccarın", kind: "own", slots: ["zirh", "tilsim"], roll: (it, t, q) => addMod(it, "carry", Math.round(6 * t * q)) },
  { id: "ozan", name: "Ozanın", kind: "own", slots: ["kalkan", "tilsim"], roll: (it, t, q) => { it.kar += Math.max(1, Math.round(t * 0.4 * q)); addMod(it, "army", 0.02); } },
];
export const AFFIX_BY_ID: Record<string, Affix> = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));

/** Nadir eşyaya bir, destansı ve üstüne iki ek verir; değerler her seferinde farklı çıkar. */
function rollAffixes(it: Item, base: string): void {
  if (it.rar < 2 || it.slot === "at") return;
  const pick = (kind: Affix["kind"]) => {
    const pool = AFFIXES.filter((a) => a.kind === kind && a.slots.includes(it.slot));
    return pool[Math.floor(Math.random() * pool.length)];
  };
  const want: Affix["kind"][] = it.rar >= 3 ? ["own", "pre"] : [Math.random() < 0.5 ? "own" : "pre"];
  const got = want.map(pick).filter((a): a is Affix => !!a);
  for (const a of got) a.roll(it, it.tier, 0.6 + Math.random() * 0.8);
  it.afx = got.map((a) => a.id);
  it.name = affixName(it.afx, base);
}

export function affixName(afx: string[], base: string): string {
  const own = afx.map((id) => AFFIX_BY_ID[id]).find((a) => a?.kind === "own");
  const pre = afx.map((id) => AFFIX_BY_ID[id]).find((a) => a?.kind === "pre");
  const core = pre ? `${pre.name} ${base}` : base;
  return own ? `${own.name} ${poss(core)}` : core;
}

export function makeItem(id: number, slot: Slot, tier: number, rar: number, kind: WeaponKind | ArmorKind | "" = "", affix = true): Item {
  tier = Math.max(1, Math.min(5, tier));
  const m = RARITY[rar].mult;
  const it: Item = { id, slot, kind: "", tier, rar, name: "", icon: "", atk: 0, def: 0, hp: 0, spd: 0, carry: 0, lid: 0, kar: 0, crit: 0, lvReq: (tier - 1) * 3 + 1, req: null };
  const t = tier - 1;
  const need = 1 + t * 3;
  if (slot === "silah") {
    const k = (WEAPON_KINDS as string[]).includes(kind) ? (kind as WeaponKind) : "kilic";
    const w = WEAPONS[k];
    it.kind = k;
    it.name = w.names[t];
    it.icon = w.icon + tier;
    it.atk = Math.round(w.atk[t] * m);
    it.crit = w.crit;
    it.req = { stat: WEAPON_STAT[k], v: need };
  } else if (slot === "zirh") {
    const heavy = kind !== "hafif";
    it.kind = heavy ? "agir" : "hafif";
    it.name = (heavy ? HEAVY : LIGHT)[t];
    it.icon = heavy ? `it_armor_${tier}` : `it_light_${tier}`;
    it.def = Math.round((heavy ? [3, 6, 10, 15, 22] : [2, 4, 7, 11, 16])[t] * m);
    it.hp = Math.round((heavy ? [5, 10, 18, 28, 40] : [4, 8, 14, 22, 32])[t] * m);
    if (heavy) it.req = { stat: "guc", v: need };
  } else if (slot === "kalkan") {
    it.name = SHIELDS[t];
    it.icon = `it_shield_${tier}`;
    it.def = Math.round([2, 4, 7, 11, 16][t] * m);
    it.req = { stat: "day", v: need };
  } else if (slot === "at") {
    const k = Math.min(2, Math.floor(t / 2 + 0.5));
    it.tier = k * 2 + 1;
    it.lvReq = k * 5 + 1;
    it.name = MOUNTS[k];
    it.icon = `mount_${k + 1}`;
    it.spd = Math.round([10, 22, 35][k] * m) / 100;
    it.carry = Math.round([30, 50, 80][k] * m);
  } else {
    it.name = CHARMS[t].name;
    it.icon = CHARMS[t].icon;
    it.lid = Math.round(tier * 0.6 * m + 0.4);
    it.kar = Math.round(tier * 0.6 * m);
  }
  if (affix && rar >= 2 && slot !== "at") rollAffixes(it, it.name);
  else if (rar > 0) it.name = `${RARITY[rar].name} ${it.name}`;
  return it;
}

export function classItem(id: number, cls: ClassDef, slot: Slot, tier: number, rar: number, affix = true): Item {
  if (slot === "silah") return makeItem(id, slot, tier, rar, cls.weapons[Math.floor(Math.random() * cls.weapons.length)], affix);
  if (slot === "zirh") return makeItem(id, slot, tier, rar, cls.armor, affix);
  return makeItem(id, slot, tier, rar, "", affix);
}

/** Kahramanın şu anki seviyesi ve statlarıyla kuşanabileceği en yüksek kademe. */
export function fitTier(it: Item, lv: number, stats: Record<Stat, number>): number {
  let t = it.tier;
  while (t > 1 && ((t - 1) * 3 + 1 > lv || (it.req && 1 + (t - 1) * 3 > stats[it.req.stat]))) t--;
  return t;
}

export interface LootFit {
  lv: number;
  stats: Record<Stat, number>;
}

export function rollItem(id: number, tier: number, cls: ClassDef | null, luck = 0, fit?: LootFit): Item {
  const slots: Slot[] = ["silah", "silah", "zirh", "zirh", "kalkan", "at", "tilsim"];
  let slot = slots[Math.floor(Math.random() * slots.length)];
  const r = Math.random() + luck;
  const rar = r > 0.97 ? 3 : r > 0.85 ? 2 : r > 0.6 ? 1 : 0;
  const t = Math.max(1, Math.min(5, tier + (Math.random() < 0.25 ? 1 : 0) - (Math.random() < 0.25 ? 1 : 0)));
  if (cls && Math.random() < (fit ? 0.85 : 0.65)) {
    if (slot === "kalkan" && !cls.shield) slot = "zirh";
    const it = classItem(id, cls, slot, t, rar);
    if (!fit) return it;
    const ft = fitTier(it, fit.lv, fit.stats);
    return ft < it.tier && Math.random() < 0.75 ? makeItem(id, slot, ft, rar, it.kind) : it;
  }
  const kind = slot === "silah" ? WEAPON_KINDS[Math.floor(Math.random() * 5)] : slot === "zirh" ? (Math.random() < 0.5 ? "agir" : "hafif") : "";
  return makeItem(id, slot, t, rar, kind);
}

const YAD_AT = [10, 40, 120, 300, 700, 1500];
const YAD_EPI = ["", "Kan Tatmış", "Ün Salmış", "Yiğit", "Destanlık", "Kurt Ruhlu", "Tengri Kutlu"];

export function yadNext(it: Item): number | null {
  return it.yad ? YAD_AT[it.yad.lv] ?? null : null;
}

/** Yadigâr silaha öldürülen düşmanları işler; seviye atlarsa adı ve gücü büyür. */
export function growHeirloom(it: Item, kills: number, ownerGen: string): boolean {
  if (!it.yad || it.slot !== "silah") return false;
  it.yad.kills += kills;
  let up = false;
  while (it.yad.lv < YAD_AT.length && it.yad.kills >= YAD_AT[it.yad.lv]) {
    it.yad.lv++;
    up = true;
  }
  if (!up) return false;
  const L = it.yad.lv;
  const k = it.kind as WeaponKind;
  const w = WEAPONS[k] ?? WEAPONS.kilic;
  const idx = Math.min(4, Math.floor(L * 0.75));
  const plus = it.plus ?? 0;
  const base = it.base ?? { atk: it.atk, def: it.def, hp: it.hp, name: it.name };
  base.atk = Math.max(base.atk, Math.round(w.atk[idx] * (1 + 0.25 * L)));
  const noun = WEAPON_NAME[k] ?? "Kılıç";
  base.name = L >= 4 ? `${ownerGen} ${YAD_EPI[L]} ${poss(noun)}` : `${YAD_EPI[L]} ${noun}`;
  it.base = base;
  it.tier = Math.max(it.tier, idx + 1);
  it.icon = w.icon + Math.max(Number(it.icon.slice(-1)) || 1, idx + 1);
  it.crit = Math.round((it.crit + 0.01) * 1000) / 1000;
  it.rar = Math.max(it.rar, Math.min(4, Math.floor(L * 0.7)));
  setPlus(it, plus);
  return true;
}

const SLOT_PRICE: Record<Slot, number> = { silah: 1.1, zirh: 1, kalkan: 0.8, at: 1.6, tilsim: 0.85 };

/** Fiyat kademe, nadirlik, yuva ve eşyanın gücünden (affix dahil) hesaplanır. */
export function itemPrice(it: Item): number {
  const base = 30 * Math.pow(it.tier, 2.1) * RARITY[it.rar].mult * SLOT_PRICE[it.slot];
  const mods = Object.keys(it.mods ?? {}).length;
  const ref = Math.max(1, 6 * it.tier * RARITY[it.rar].mult);
  const power = Math.max(0.85, Math.min(1.3, 0.85 + (gearScore(it) / ref) * 0.15));
  return Math.round(base * power * (1 + 0.12 * mods) * (1 + 0.3 * (it.plus ?? 0)) * (it.set || it.uq ? 2.5 : 1));
}

/** Aynı yuvadaki eşyaları kabaca karşılaştırmak için tek sayılık güç. */
export function gearScore(it: Item): number {
  const m = it.mods ?? {};
  const modSum = (Object.keys(m) as (keyof GearMods)[]).reduce((a, k) => a + (k === "carry" ? m[k]! / 200 : m[k]!), 0);
  return it.atk + it.def * 1.2 + it.hp / 3 + it.crit * 120 + it.spd * 50 + it.carry / 10 + (it.lid + it.kar) * 2 + modSum * 60 + (it.plus ?? 0);
}

export function kindName(it: Item): string {
  if (it.slot === "silah") return WEAPON_NAME[it.kind as WeaponKind];
  if (it.slot === "zirh") return ARMOR_NAME[it.kind === "agir" ? "agir" : "hafif"];
  return SLOT_NAME[it.slot];
}

const MAT_NAME: Record<string, string> = { sam: "Şam çeliği", cin: "Çin demiri", kosele: "Kösele", ipek: "İpek astarlı", turkuaz: "Turkuaz kakmalı", yesim: "Yeşim kakmalı" };

export function itemStats(it: Item): string {
  const p: string[] = [];
  if (it.atk) p.push(`${t("Saldırı")} ${it.atk}`);
  if (it.crit) p.push(`${t("Kritik")} +%${Math.round(it.crit * 100)}`);
  if (it.def) p.push(`${t("Savunma")} ${it.def}`);
  if (it.hp) p.push(`${t("Can")} +${it.hp}`);
  if (it.spd) p.push(`${t("Hız")} +%${Math.round(it.spd * 100)}`);
  if (it.carry) p.push(`${t("Yük")} +${it.carry}`);
  if (it.lid) p.push(`${t("Liderlik")} +${it.lid}`);
  if (it.kar) p.push(`${t("Karizma")} +${it.kar}`);
  if (it.mods) p.push(modsText(it.mods));
  if (it.horse) p.push(`${it.horse.gen}. kuşak${it.horse.sire ? ` · ${it.horse.sire} × ${it.horse.dam}` : ""}`);
  if (it.yad) {
    const nx = yadNext(it);
    p.push(`${t("Yadigâr")} · ${it.yad.kills}${nx ? `/${nx}` : ""} ${t("düşman")}`);
  }
  if (it.mat && MAT_NAME[it.mat]) p.push(t(MAT_NAME[it.mat]));
  if (it.sig) p.push(t("İmza eşyası"));
  const pr = itemProc(it);
  if (pr) p.push(`✦ ${t(pr.name)}: ${t(PROC_TEXT[pr.kind])}`);
  return p.join(" · ");
}

type ProcKind = "poison" | "stun" | "burst" | "drain" | "shield" | "aura";
const PROC_TEXT: Record<ProcKind, string> = {
  poison: "her tur ek yara",
  stun: "düşmanı sersemletir",
  burst: "üç turda bir ağır darbe",
  drain: "vurdukça can emer",
  shield: "ilk turlarda hasarı keser",
  aura: "bütün orduya güç verir",
};
const WEAPON_PROC: Record<WeaponKind, { name: string; kind: ProcKind; pow: number }> = {
  kilic: { name: "Kan İzi", kind: "poison", pow: 0.12 },
  balta: { name: "Kemik Kıran", kind: "stun", pow: 0.22 },
  hancer: { name: "Sinsi Darbe", kind: "burst", pow: 0.6 },
  ok: { name: "Ok Yağmuru", kind: "burst", pow: 0.5 },
  asa: { name: "Ruh Emici", kind: "drain", pow: 0.25 },
};

/** Destansı ve efsanevi eşyaların savaşta tetiklenen özel etkisi. */
export function itemProc(it: Item): { name: string; kind: ProcKind; pow: number } | null {
  if (it.rar < 3 || it.slot === "at") return null;
  const k = it.rar >= 4 ? 1.5 : 1;
  const base =
    it.slot === "silah" ? WEAPON_PROC[it.kind as WeaponKind] :
    it.slot === "zirh" ? { name: "Demir Duvar", kind: "shield" as const, pow: 0.08 } :
    it.slot === "kalkan" ? { name: "Kalkan Duvarı", kind: "shield" as const, pow: 0.1 } :
    { name: "Tengri'nin Lütfu", kind: "aura" as const, pow: 0.04 };
  return base ? { ...base, pow: base.pow * k } : null;
}

export function makeHorse(id: number, breed: Breed, info: HorseInfo, st?: { spd: number; carry: number; hp: number }, name?: string): Item {
  const b = BREEDS[breed];
  const s = st ?? { spd: b.spd, carry: b.carry, hp: b.hp };
  const score = s.spd * 100 + s.carry * 0.3 + s.hp;
  const rar = breed === "tulpar" ? 4 : score > 75 ? 3 : score > 58 ? 2 : score > 44 ? 1 : 0;
  return {
    id, slot: "at", kind: "", tier: Math.min(5, 1 + Math.floor(score / 18)), rar,
    name: `${name ?? horseName()} (${b.name})`, icon: breed === "tulpar" ? "mount_3" : b.icon,
    atk: 0, def: 0, hp: Math.round(s.hp), spd: Math.round(s.spd * 100) / 100, carry: Math.round(s.carry), lid: 0, kar: 0, crit: 0, lvReq: 1, req: null,
    horse: info, ...(breed === "tulpar" ? { mods: { atk: 0.05, army: 0.04 } } : {}),
  };
}

export type Good = "pamuk" | "deri" | "demir" | "baharat" | "hali" | "ipek" | "porselen" | "turkuaz" | "yesim" | "gumus";
export const GOOD_KEYS: Good[] = ["pamuk", "deri", "demir", "baharat", "hali", "gumus", "turkuaz", "ipek", "porselen", "yesim"];
export const GOODS: Record<Good, { name: string; icon: string; base: number }> = {
  pamuk: { name: "Pamuk", icon: "cotton", base: 12 },
  deri: { name: "Deri", icon: "mat_leather", base: 16 },
  demir: { name: "Demir", icon: "mat_iron", base: 22 },
  baharat: { name: "Baharat", icon: "spices", base: 40 },
  hali: { name: "Halı", icon: "carpets", base: 52 },
  gumus: { name: "Gümüş", icon: "silver", base: 48 },
  turkuaz: { name: "Turkuaz", icon: "turquoise", base: 60 },
  ipek: { name: "İpek", icon: "silk", base: 70 },
  porselen: { name: "Porselen", icon: "porcelain", base: 85 },
  yesim: { name: "Yeşim", icon: "jade", base: 95 },
};

export const CITY_TRADE: Record<string, { cheap: Good[]; dear: Good[]; tier: [number, number] }> = {
  kashgar: { cheap: ["ipek", "porselen", "yesim"], dear: ["gumus", "hali", "demir"], tier: [2, 4] },
  samarkand: { cheap: ["pamuk", "hali"], dear: ["porselen", "baharat"], tier: [1, 2] },
  bukhara: { cheap: ["pamuk", "deri"], dear: ["ipek", "yesim"], tier: [1, 2] },
  merv: { cheap: ["deri", "turkuaz"], dear: ["pamuk", "porselen"], tier: [1, 3] },
  nishapur: { cheap: ["turkuaz", "demir"], dear: ["ipek", "deri"], tier: [2, 3] },
  rey: { cheap: ["baharat", "demir"], dear: ["turkuaz", "yesim"], tier: [2, 4] },
  tabriz: { cheap: ["hali", "gumus"], dear: ["baharat", "ipek"], tier: [3, 4] },
  konya: { cheap: ["gumus", "deri"], dear: ["hali", "porselen"], tier: [3, 5] },
  constantinople: { cheap: ["gumus", "demir"], dear: ["ipek", "baharat", "porselen", "yesim"], tier: [4, 5] },
};

export function goodMult(city: string, g: Good): number {
  const t = CITY_TRADE[city];
  if (t.cheap.includes(g)) return 0.6;
  if (t.dear.includes(g)) return 1.55;
  return 1;
}
