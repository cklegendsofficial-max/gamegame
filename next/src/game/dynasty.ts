import type { FactionId } from "./factions";

export const YEAR_DAYS = 16;
export const KID_MAX = 3;
export const KID_EVERY = 10;

export const SON_NAMES = ["Alp", "Tuğrul", "Arslan", "Kaya", "Tolun", "Ertuğ", "Bilge", "Atsız", "Aybars", "Oğuz", "Temür", "Tarkan", "Kılıç", "Yağı", "Togan", "Sungur", "Börü", "Ilgaz"];
export const DAUGHTER_NAMES = ["Tomris", "Terken", "Altunay", "Gökçe", "Bengü", "Aybike", "Ulduz", "Sırma", "Alaca", "Börte", "Ay", "Kutlu", "Yaruk", "Saru"];

export interface Spouse {
  name: string;
  from: string;
}

export interface Kid {
  name: string;
  born: number;
  son: boolean;
}

export interface Family {
  spouse: Spouse | null;
  kids: Kid[];
  next: number;
  /** Evlilikle bağlanan müttefik devlet (gelinin beyinin bağlı olduğu devlet). */
  allyFac?: FactionId;
}

export const FAMILY_DEFAULT: Family = { spouse: null, kids: [], next: 0 };

/** Hanedanın varisi: en büyük oğul, yoksa en büyük çocuk. */
export function heirOf(f: Family): Kid | null {
  if (!f.kids.length) return null;
  const sons = f.kids.filter((k) => k.son);
  const pool = sons.length ? sons : f.kids;
  return pool.reduce((a, b) => (a.born <= b.born ? a : b));
}

export function pick<T>(a: T[], not: T[] = []): T {
  const pool = a.filter((x) => !not.includes(x));
  const src = pool.length ? pool : a;
  return src[Math.floor(Math.random() * src.length)];
}

export function makeHeirs(not: string[] = []): string[] {
  const n = 1 + (Math.random() < 0.5 ? 1 : 0);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(pick(SON_NAMES, [...not, ...out]));
  return out;
}

export function brideOf(rivalId: string): string {
  let h = 0;
  for (const ch of rivalId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return DAUGHTER_NAMES[h % DAUGHTER_NAMES.length];
}

export function brideGold(lv: number): number {
  return 600 + lv * 60;
}

/** Yıllık ölüm olasılığı */
export function deathChance(age: number): number {
  return age < 50 ? 0.01 : Math.min(0.6, (age - 48) * 0.035);
}

export function kidAge(k: Kid, day: number): number {
  return Math.floor((day - k.born) / YEAR_DAYS);
}
