import { describe, expect, it } from "vitest";
import { banditArmy, campGarrison, kurganGuard } from "../src/game/state";
import { gearCost, CRAFT_SLOTS } from "../src/game/crafting";
import { armySize, UNITS } from "../src/game/data";
import { BOSS_KITS, COUNTER } from "../src/game/bosses";
import { ROAD_CHAT, ROAD_CHAT_NIGHT } from "../src/game/bonds";
import { COMPANIONS } from "../src/game/story";

describe("haramı ve garnizon ölçekleme", () => {
  it("seviye arttıkça ortalama çete büyür", () => {
    const avg = (t: number) => Array.from({ length: 200 }, () => armySize(banditArmy(t))).reduce((a, b) => a + b, 0) / 200;
    expect(avg(1)).toBeLessThan(avg(3));
    expect(avg(3)).toBeLessThan(avg(5));
  });
  it("ilk kademe çeteler yeni oyuncu için küçük", () => {
    for (let i = 0; i < 100; i++) expect(armySize(banditArmy(1))).toBeLessThanOrEqual(8);
  });
  it("kamp ve kurgan garnizonları boş değil", () => {
    for (let t = 1; t <= 5; t++) {
      expect(armySize(campGarrison(t))).toBeGreaterThan(0);
      expect(armySize(kurganGuard(t))).toBeGreaterThan(0);
    }
  });
});

describe("craft maliyetleri", () => {
  it("kademe arttıkça altın maliyeti artar", () => {
    for (const slot of CRAFT_SLOTS) {
      for (let t = 1; t < 6; t++) expect(gearCost(slot, t + 1).gold!).toBeGreaterThan(gearCost(slot, t).gold!);
    }
  });
  it("tüm birim türlerinin tanımı var", () => {
    for (const k of ["spear", "archer", "horse"] as const) expect(UNITS[k]).toBeTruthy();
  });
});

describe("boss kitleri", () => {
  const kits = Object.entries(BOSS_KITS);
  it("her bossun en az iki hamlesi, öfke evresi ve karşı emri var", () => {
    expect(kits.length).toBeGreaterThanOrEqual(10);
    for (const [name, k] of kits) {
      expect(k.moves.length, name).toBeGreaterThanOrEqual(2);
      expect(k.rage.move.tell, name).toBeTruthy();
      for (const m of [...k.moves, k.rage.move]) expect(COUNTER[m.kind], `${name}/${m.name}`).toBeTruthy();
    }
  });
});

describe("yoldaş sözleri", () => {
  it("her yoldaşın gündüz ve gece sözü var", () => {
    for (const c of COMPANIONS) {
      expect(ROAD_CHAT[c.id].length, c.id).toBeGreaterThan(0);
      expect(ROAD_CHAT_NIGHT[c.id].length, c.id).toBeGreaterThan(0);
    }
  });
});