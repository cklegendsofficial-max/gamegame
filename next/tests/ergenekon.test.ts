import { describe, expect, it } from "vitest";
import {
  ERG_MAX,
  ergBlessChoices,
  ergBonus,
  ergCanEnter,
  ergFoeArmy,
  ergIsBoss,
  ergScore,
  mulberry,
  newErgRun,
} from "../src/game/ergenekon";

describe("Ergenekon", () => {
  it("haftalık tohum aynı nimetleri üretir", () => {
    const a = newErgRun(42);
    const b = newErgRun(42);
    expect(ergBlessChoices(a)).toEqual(ergBlessChoices(b));
    a.floor = 7;
    b.floor = 7;
    expect(ergBlessChoices(a)).toEqual(ergBlessChoices(b));
  });

  it("boss katları 5'in katı", () => {
    expect(ergIsBoss(5)).toBe(true);
    expect(ergIsBoss(20)).toBe(true);
    expect(ergIsBoss(3)).toBe(false);
    expect(ERG_MAX).toBe(20);
  });

  it("düşman ordusu pozitif ve tohumlu", () => {
    const r1 = mulberry(99);
    const r2 = mulberry(99);
    const a = ergFoeArmy(8, r1);
    const b = ergFoeArmy(8, r2);
    expect(a).toEqual(b);
    expect(a.spear + a.archer + a.horse).toBeGreaterThan(0);
  });

  it("nimet birikimi skoru ve kilidi", () => {
    const run = newErgRun(1);
    run.atk = 2;
    run.def = 1;
    run.edge = 1;
    run.nextCrit = 0.12;
    expect(ergBonus(run)).toBeCloseTo(0.08 * 2 - 0.06 + 0.04 + 0.12, 5);
    run.floor = 12;
    run.gold = 100;
    expect(ergScore(run, false)).toBeGreaterThan(1000);
    expect(ergScore(run, true)).toBeGreaterThan(ergScore(run, false));
    expect(ergCanEnter(false, 20, true, 20)).toMatch(/hürriyet/i);
    expect(ergCanEnter(true, 10, false, 0)).toBeNull();
    expect(ergCanEnter(true, 5, false, 5)).toBeNull();
    expect(ergCanEnter(true, 5, false, 0)).toMatch(/Sv|derinlik|destan/i);
  });
});
