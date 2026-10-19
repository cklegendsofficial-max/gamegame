import type { Good } from "./rpg";

/** Alınan/satılan her birimin pazara etkisi ve dakikalık toparlanma hızı. */
export const MKT_STEP = 0.055;
export const MKT_DECAY = 0.14;

/** Bir birim alış/satışın şehir fiyat dalgasına etkisi. */
export function shiftMarket(m: Partial<Record<Good, number>>, g: Good, buy: boolean): void {
  m[g] = buy ? Math.min(1.5, (m[g] ?? 0) + MKT_STEP) : Math.max(-0.7, (m[g] ?? 0) - MKT_STEP);
}

/** Beceri + karizma + yoldaş ticaretinin alış çarpanı (ek kesintiler sonra çıkar). */
export function buySpread(skill: number, kar: number, trade: number): number {
  return Math.max(1.02, 1.12 - skill * 0.006 - kar * 0.004 - trade);
}

/** Beceri + karizma + yoldaş ticaretinin satış çarpanı (ek primler sonra eklenir). */
export function sellSpread(skill: number, kar: number, trade: number): number {
  return Math.min(0.98, 0.88 + skill * 0.006 + kar * 0.004 + trade);
}
