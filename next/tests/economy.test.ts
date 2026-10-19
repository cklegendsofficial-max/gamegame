import { describe, expect, it } from "vitest";
import { CRAFT_SLOTS, REFINES, RUNES, TIER_ZL, gearCost } from "../src/game/crafting";
import { MKT_STEP, buySpread, sellSpread, shiftMarket } from "../src/game/market";
import { CITY_TRADE, GOODS, GOOD_KEYS, goodMult, itemPrice, makeItem } from "../src/game/rpg";

describe("pazar", () => {
  it("alış fiyat dalgasını yükseltir, satış düşürür", () => {
    const m: Partial<Record<(typeof GOOD_KEYS)[number], number>> = {};
    shiftMarket(m, "ipek", true);
    expect(m.ipek).toBeCloseTo(MKT_STEP, 5);
    shiftMarket(m, "ipek", false);
    expect(m.ipek).toBeCloseTo(0, 5);
    for (let i = 0; i < 40; i++) shiftMarket(m, "ipek", true);
    expect(m.ipek).toBeLessThanOrEqual(1.5);
    for (let i = 0; i < 80; i++) shiftMarket(m, "ipek", false);
    expect(m.ipek).toBeGreaterThanOrEqual(-0.7);
  });

  it("ticaret becerisi alış-satış makasını daraltır", () => {
    const buy0 = buySpread(0, 0, 0);
    const sell0 = sellSpread(0, 0, 0);
    const buy5 = buySpread(5, 0, 0);
    const sell5 = sellSpread(5, 0, 0);
    expect(buy0).toBeGreaterThan(sell0);
    expect(buy5).toBeLessThan(buy0);
    expect(sell5).toBeGreaterThan(sell0);
    expect(buy5 - sell5).toBeLessThan(buy0 - sell0);
  });

  it("şehirler farklı malları ucuz/pahalı satar", () => {
    const cities = Object.keys(CITY_TRADE);
    expect(cities.length).toBeGreaterThan(3);
    const cheap = GOOD_KEYS.map((g) => ({ g, m: Math.min(...cities.map((c) => goodMult(c, g))) }));
    expect(cheap.every((x) => x.m < 1 || GOODS[x.g].base > 0)).toBe(true);
    const silk = cities.map((c) => goodMult(c, "ipek"));
    expect(Math.max(...silk)).toBeGreaterThan(Math.min(...silk));
  });
});

describe("zanaat", () => {
  it("üst kademe daha pahalıdır", () => {
    for (const sl of CRAFT_SLOTS) {
      const a = gearCost(sl, 2);
      const b = gearCost(sl, 4);
      expect(b.gold ?? 0).toBeGreaterThan(a.gold ?? 0);
    }
    expect(TIER_ZL[4]).toBeGreaterThan(0);
    expect(TIER_ZL[5]).toBeGreaterThan(TIER_ZL[4]!);
  });

  it("rün ve damıtma tarifleri tekil ve maliyeti var", () => {
    expect(new Set(RUNES.map((r) => r.id)).size).toBe(RUNES.length);
    for (const r of RUNES) expect((r.cost.gold ?? 0) + (r.cost.nisan ?? 0)).toBeGreaterThan(0);
    expect(new Set(REFINES.map((r) => r.id)).size).toBe(REFINES.length);
    expect(REFINES.some((r) => r.out === "celik")).toBe(true);
  });

  it("nadir eşya daha değerlidir", () => {
    const common = makeItem(1, "silah", 2, 0, "", false);
    const rare = makeItem(2, "silah", 2, 3, "", false);
    expect(itemPrice(rare)).toBeGreaterThan(itemPrice(common));
  });
});
