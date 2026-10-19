import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { ROAD_EVENTS } from "../src/game/road";

const keys = new Set<string>();
const walk = (dir: string, parent: string): void => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(`${dir}/${e.name}`, e.name);
    else keys.add(`${parent}/${e.name.replace(/\.(webp|jpg|jpeg)$/i, "")}`);
  }
};
walk("src/assets", "");

describe("yol olayları", () => {
  it("kimlikler tekil, simgeler gerçekten var", () => {
    const ids = ROAD_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ROAD_EVENTS) {
      const ok = keys.has(e.icon) || keys.has(`icons/${e.icon}`);
      expect(ok, `${e.id}: ${e.icon}`).toBe(true);
    }
  });
  it("her olay en az bir seçenek sunar", () => {
    const ctx = { season: "yaz" as const, night: true, cargo: 5, army: 10, lv: 5, comps: ["ayse" as const], city: "konya" };
    for (const e of ROAD_EVENTS) expect(e.opts(ctx).length, e.id).toBeGreaterThan(0);
  });
});
