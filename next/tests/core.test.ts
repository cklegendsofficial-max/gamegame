import { describe, expect, it } from "vitest";
import { fight, odds } from "../src/game/battle";
import { xpNeed, armySize, CITY_NAME } from "../src/game/data";
import { CHAINS } from "../src/game/chains";
import { COMPANIONS } from "../src/game/story";
import { CONSUMABLES, RUNES, RUNE_BY_ID } from "../src/game/crafting";
import { SETS, SET_KEYS } from "../src/game/legend";
import { PLUS_CHANCE, PLUS_MAX } from "../src/game/rpg";

const army = (spear: number, archer: number, horse: number) => ({ spear, archer, horse });

describe("savaş çözümleyici", () => {
  it("çok güçlü ordu zayıfı yener", () => {
    const wins = Array.from({ length: 20 }, () => fight(army(120, 60, 40), 0, army(10, 5, 0)).win).filter(Boolean).length;
    expect(wins).toBeGreaterThanOrEqual(19);
  });
  it("olasılık 0..1 aralığında ve güçle artar", () => {
    const lo = odds(army(20, 10, 5), 0, army(60, 30, 20));
    const hi = odds(army(90, 40, 30), 0, army(60, 30, 20));
    expect(lo).toBeGreaterThanOrEqual(0);
    expect(hi).toBeLessThanOrEqual(1);
    expect(hi).toBeGreaterThan(lo);
  });
  it("savaş sonrası ordu negatif olmaz", () => {
    const a = army(30, 10, 5);
    const r = fight(a, 0, army(40, 20, 10));
    for (const k of ["spear", "archer", "horse"] as const) {
      expect(r.lostA[k]).toBeGreaterThanOrEqual(0);
      expect(r.lostA[k]).toBeLessThanOrEqual(a[k]);
    }
    expect(armySize(r.lostA)).toBeGreaterThanOrEqual(0);
  });
  it("eksik boss alanları NaN üretmez", () => {
    const bad = { name: "Test", icon: "", atk: undefined as unknown as number, def: undefined as unknown as number, hp: 800 };
    const r = fight(army(40, 20, 10), 5, army(5, 0, 0), 0, null, bad as never);
    for (const round of r.rounds) {
      expect(Number.isFinite(round.bhp)).toBe(true);
      expect(round.bhp).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("kuşatma eşikleri", () => {
  it("erken erişim: seviye 8 ve 80 şöhret", async () => {
    const { SIEGE_LV, SIEGE_RENOWN } = await import("../src/game/conquest");
    expect(SIEGE_LV).toBe(8);
    expect(SIEGE_RENOWN).toBe(80);
  });
  it("yardım yaklaşınca reliefSoon işaretler", async () => {
    const { newSiege, siegeDay } = await import("../src/game/siege");
    const army = { spear: 20, archer: 10, horse: 5 };
    const r = newSiege("bukhara", 0.3, army, 1, () => 0.5);
    r.relief = 2;
    const out = siegeDay(r, "starve", { kar: 5, renown: 100, armyN: 40, rnd: () => 0.9 });
    expect(out.reliefSoon).toBe(true);
    expect(r.relief).toBe(1);
  });
});

describe("ilerleme eğrisi", () => {
  it("TP ihtiyacı seviyeyle artar", () => {
    for (let lv = 1; lv < 40; lv++) expect(xpNeed(lv + 1)).toBeGreaterThan(xpNeed(lv));
  });
});

describe("içerik bütünlüğü", () => {
  it("her şehir zincirinin 4 adımı ve ödülü var", () => {
    const all = Object.values(CHAINS);
    expect(all.length).toBeGreaterThanOrEqual(9);
    for (const c of all) {
      expect(c.steps.length).toBe(4);
      expect(c.title).toBeTruthy();
    }
  });
  it("yoldaşlar benzersiz ve tam tanımlı", () => {
    const ids = COMPANIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of COMPANIONS) {
      expect(c.name && c.role && c.perk).toBeTruthy();
    }
  });
  it("tüketim ve rün tabloları tutarlı", () => {
    for (const r of RUNES) expect(RUNE_BY_ID[r.id]).toBe(r);
    for (const c of CONSUMABLES) expect(Object.keys(c.cost).length).toBeGreaterThan(0);
  });
  it("set parçaları tüm slotlar için isimli", () => {
    for (const k of SET_KEYS) {
      expect(SETS[k].name).toBeTruthy();
      expect(Object.keys(SETS[k].pieces).length).toBeGreaterThan(0);
    }
  });
  it("artı (+) şansları azalan ve geçerli", () => {
    expect(PLUS_CHANCE.length).toBe(PLUS_MAX);
    for (let i = 1; i < PLUS_CHANCE.length; i++) expect(PLUS_CHANCE[i]).toBeLessThanOrEqual(PLUS_CHANCE[i - 1]);
  });
  it("şehir adları dolu", () => {
    expect(Object.keys(CITY_NAME).length).toBeGreaterThanOrEqual(9);
  });
});