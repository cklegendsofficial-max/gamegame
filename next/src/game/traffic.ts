/** İpek Yolu trafik yardımcıları: kervan balonu + en kârlı rota. */
import { CITIES } from "../world/gen";
import { CITY_NAME } from "./data";
import { CITY_TRADE, GOODS, GOOD_KEYS, type Good } from "./rpg";
import type { Caravan } from "./state";

export interface TradeRoute {
  from: string;
  to: string;
  good: Good;
  /** Tahmini birim kâr (satış − alış, çarpan yok). */
  margin: number;
  fromName: string;
  toName: string;
  goodName: string;
}

/** Şehir çifti × mallar üzerinde en yüksek (dear/cheap) marjı. */
export function bestTradeRoute(): TradeRoute | null {
  let best: TradeRoute | null = null;
  for (const a of CITIES) {
    const ta = CITY_TRADE[a.id];
    if (!ta) continue;
    for (const b of CITIES) {
      if (a.id === b.id) continue;
      const tb = CITY_TRADE[b.id];
      if (!tb) continue;
      for (const g of GOOD_KEYS) {
        if (!ta.cheap.includes(g) || !tb.dear.includes(g)) continue;
        const buy = GOODS[g].base * 0.6;
        const sell = GOODS[g].base * 1.55;
        const margin = sell - buy;
        if (!best || margin > best.margin) {
          best = {
            from: a.id,
            to: b.id,
            good: g,
            margin,
            fromName: CITY_NAME[a.id],
            toName: CITY_NAME[b.id],
            goodName: GOODS[g].name,
          };
        }
      }
    }
  }
  return best;
}

export function caravanBubble(cv: Caravan): { icon: string; label: string; good: Good } {
  return {
    icon: GOODS[cv.good].icon,
    label: GOODS[cv.good].name,
    good: cv.good,
  };
}

/** Kervan malını hedef şehirde satsan birim başına tahmini kâr. */
export function caravanProfitHint(_cv: Caravan, buyPrice: number, sellAtTo: number): number {
  void _cv;
  return Math.max(0, Math.round(sellAtTo - buyPrice));
}

export function cityXY(id: string): { x: number; y: number } | null {
  const c = CITIES.find((x) => x.id === id);
  return c ? { x: c.x, y: c.y } : null;
}
