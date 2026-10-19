/** Ergenekon'dan Çıkış — 20 katlı haftalık tohumlu roguelike (kurgan derinliğinden ayrı). */
import { army, type Army } from "./data";
import type { Boss } from "./battle";
import { weekId } from "./weekly";

export const ERG_MAX = 20;

export type ErgBless = "atk" | "def" | "heal" | "gold" | "torch" | "army" | "crit" | "ruh" | "speed";

export const ERG_BLESS: Record<
  ErgBless,
  { name: string; icon: string; desc: string; en: string }
> = {
  atk: { name: "Bozkurt Dişi", icon: "ord_nara", desc: "Savaşta +%8 güç (birikir).", en: "+8% combat power (stacks)." },
  def: { name: "Demir Yele", icon: "ord_siper", desc: "Düşman gücü −%6 (birikir).", en: "Enemy power −6% (stacks)." },
  heal: { name: "Umay Kanadı", icon: "healer", desc: "Canının %25'ini yenile.", en: "Restore 25% HP." },
  gold: { name: "Altın Tüy", icon: "coins", desc: "+40 altın (kat ×2).", en: "+40 gold (×2 by floor)." },
  torch: { name: "Gök Ateşi", icon: "map/kurgan", desc: "+2 meşale.", en: "+2 torches." },
  army: { name: "Kırk Alp", icon: "u_spear", desc: "+3 mızraklı asker.", en: "+3 spearmen." },
  crit: { name: "Şimşek", icon: "swords", desc: "Bir sonraki savaşta +%12 güç.", en: "+12% power next fight." },
  ruh: { name: "Ata Fısıltısı", icon: "ruh", desc: "+2 Ruh Taşı.", en: "+2 Spirit Stones." },
  speed: { name: "Yelboğa", icon: "j_caravan", desc: "Kaçış şansı / moral (savaşta +%4).", en: "+4% combat edge." },
};

export const ERG_BLESS_KEYS = Object.keys(ERG_BLESS) as ErgBless[];

export interface ErgRun {
  week: number;
  seed: number;
  floor: number;
  torch: number;
  gold: number;
  ruh: number;
  atk: number;
  def: number;
  edge: number;
  nextCrit: number;
  items: number;
}

export interface ErgBoardRow {
  week: number;
  name: string;
  floor: number;
  clear: boolean;
  at: number;
}

/** Mulberry32 — haftalık tohumdan tekrarlanabilir zar. */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ergWeekSeed(week = weekId()): number {
  return (week * 2654435761) >>> 0;
}

export function newErgRun(week = weekId()): ErgRun {
  return {
    week,
    seed: ergWeekSeed(week),
    floor: 1,
    torch: 6,
    gold: 0,
    ruh: 0,
    atk: 0,
    def: 0,
    edge: 0,
    nextCrit: 0,
    items: 0,
  };
}

export function ergRngAt(run: ErgRun, salt: number): () => number {
  return mulberry((run.seed ^ Math.imul(run.floor, 0x9e3779b9) ^ salt) >>> 0);
}

/** Kat için 3 farklı nimet (tohum sabit). */
export function ergBlessChoices(run: ErgRun): ErgBless[] {
  const rng = ergRngAt(run, 0xbe15);
  const pool = [...ERG_BLESS_KEYS];
  const out: ErgBless[] = [];
  while (out.length < 3 && pool.length) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]!);
  }
  return out;
}

export function ergIsBoss(floor: number): boolean {
  return floor % 5 === 0;
}

export function ergFoeArmy(floor: number, rng: () => number): Army {
  const n = Math.round(4 + floor * 1.35 + rng() * (2 + floor * 0.25));
  const spear = Math.round(n * (0.45 + rng() * 0.2));
  const archer = Math.round(n * (0.25 + rng() * 0.2));
  const horse = Math.max(0, n - spear - archer);
  return army(spear, archer, horse);
}

export function ergBoss(floor: number): Boss & { lore: string } {
  const tier = Math.min(3, Math.max(0, Math.floor(floor / 5) - 1));
  const names = ["Demir Kurt", "Kara Yele", "Buz Diş", "Gök Börü Gölgesi"];
  const icons = ["heroes/boss_kokboru", "heroes/boss_karahan", "heroes/boss_buz", "heroes/boss_kokboru"];
  const t = 1.2 + floor * 0.28;
  return {
    name: names[tier] ?? "Ergenekon Bekçisi",
    icon: icons[tier] ?? "heroes/boss_kokboru",
    hp: Math.round(100 * Math.pow(t, 1.4)),
    atk: Math.round(6 * Math.pow(t, 1.2)),
    def: 2 + Math.round(t * 2.5),
    lore:
      floor >= ERG_MAX
        ? "Dağın ağzında Gök Börü'nün gölgesi duruyor. Çıkış onun arkasında."
        : "Ergenekon'un demir kapısını tutan bekçi. Geçmeden yol yok.",
  };
}

export function ergBonus(run: ErgRun): number {
  return run.atk * 0.08 - run.def * 0.06 + run.edge * 0.04 + run.nextCrit;
}

export function ergScore(run: ErgRun, clear: boolean): number {
  return run.floor * 100 + run.gold + run.ruh * 40 + (clear ? 2000 : 0) + run.items * 80;
}

export function ergLore(_floor: number, rng: () => number): string {
  const lines = [
    "Demir dağların arasında dar bir geçit; rüzgâr ataların adını fısıldıyor.",
    "Kayalarda Orhun yazısı: \"Demir eritilmeden çıkış yok.\"",
    "Bir kurt izi, karda taze. Gök Börü yakın.",
    "Mağarada sönmüş bir ocak; külde kırık bir kılıç.",
    "Tavan damlıyor — demir damlaları. Ergenekon'un damarı.",
    "Uzaktan davul; kırk alp yürüyüşü gibi.",
    "Bir balbal yüzü sana bakıyor; gözleri boş ama tanıdık.",
    "Çıkış ışığı uzak, ama var. Kat kat yaklaş.",
  ];
  return lines[Math.floor(rng() * lines.length)] ?? lines[0]!;
}

export function ergCanEnter(free: boolean, lv: number, storyDone: boolean, deepBest: number): string | null {
  if (!free) return "Önce hürriyetini kazan.";
  if (storyDone || lv >= 10 || deepBest >= 5) return null;
  return "Sv 10, 5. derinlik katı veya destan sonu gerekir.";
}

