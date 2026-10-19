import type { Good } from "./rpg";

export interface MyCaravan {
  id: number;
  name: string;
  from: string;
  to: string;
  go: Good | null;
  back: Good | null;
  cap: number;
  guards: number;
  dir: 1 | -1;
  t: number;
  cargo: number;
  paid: number;
  trips: number;
  profit: number;
  status: "yol" | "bekle";
  /** Sigortalı mı (bir yağmayı karşılar) */
  ins?: boolean;
  log: string[];
}

export const MYCV_COST = 900;
export const MYCV_CAP = 18;
export const MYCV_GUARD = 250;
export const MYCV_GUARD_MAX = 3;
export const MYCV_UPGRADE = 600;
export const MYCV_FEE = 0.92;
export const MYCV_NAMES = ["Deve Katarı", "Yıldız Kervanı", "İpek Katarı", "Çöl Gemisi", "Altın Çan", "Kum Yeli"];

export function mycvDays(dist: number): number {
  return Math.max(0.7, Math.min(7, dist / 500));
}

/** Sigorta bedeli: yağmada ödenen sermayenin %75'i geri gelir (bir kez). */
export const MYCV_INSURE = 220;
export const MYCV_INSURE_BACK = 0.75;

/** Yolu bilen kervan: her sefer riski biraz düşürür (en çok %22). */
export function mycvRoute(c: MyCaravan): number {
  return Math.min(0.22, c.trips * 0.008);
}

export function mycvRisk(c: MyCaravan, danger: number): number {
  return Math.max(0.01, (0.1 + danger) * (1 - c.guards * 0.28) * (1 - mycvRoute(c)));
}
