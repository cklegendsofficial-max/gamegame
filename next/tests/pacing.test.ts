import { describe, expect, it } from "vitest";
import { xpNeed } from "../src/game/data";

describe("ilerleme tempo", () => {
  it("erken seviyeler makul bir XP eğrisi izler", () => {
    for (let lv = 1; lv < 20; lv++) expect(xpNeed(lv + 1)).toBeGreaterThan(xpNeed(lv));
    expect(xpNeed(1)).toBeGreaterThanOrEqual(50);
    // tek savaş (en çok ~1.3 x ihtiyaç) ilk seviyeden 2 seviye atlatamaz
    expect(Math.round(xpNeed(1) * 1.3) + 3).toBeLessThan(xpNeed(1) + xpNeed(2));
  });
});
