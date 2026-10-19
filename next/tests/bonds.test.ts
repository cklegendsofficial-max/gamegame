import { describe, expect, it } from "vitest";
import { CAMPFIRES, CITY_CHAT, COMP_BATTLE_BARK, COMP_WIN_BARK } from "../src/game/bonds";
import { COMPANIONS, type CompId } from "../src/game/story";

const ids = COMPANIONS.map((c) => c.id);

describe("yoldaş bağları", () => {
  it("kamp ateşi kimlikleri tekil ve her yoldaşı kapsar", () => {
    const seen = CAMPFIRES.map((f) => f.id);
    expect(new Set(seen).size).toBe(seen.length);
    const who = new Set<CompId>();
    for (const f of CAMPFIRES) {
      who.add(f.a);
      who.add(f.b);
      expect(f.lines.length).toBeGreaterThan(0);
      expect(f.sideA.length).toBeGreaterThan(0);
    }
    for (const id of ids) expect(who.has(id), id).toBe(true);
  });

  it("şehir sözü ve savaş nidaları her yoldaşta var", () => {
    for (const id of ids) {
      expect(Object.keys(CITY_CHAT[id] ?? {}).length, `şehir:${id}`).toBeGreaterThanOrEqual(3);
      expect(COMP_BATTLE_BARK[id].length, `nara:${id}`).toBeGreaterThanOrEqual(2);
      expect(COMP_WIN_BARK[id].length, `zafer:${id}`).toBeGreaterThanOrEqual(2);
    }
  });
});
