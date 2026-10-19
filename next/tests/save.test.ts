import { describe, expect, it } from "vitest";
import { CITIES, NAV, NW, astar, generate } from "../src/world/gen";
import { loadGame, newGame, saveGame } from "../src/game/state";

// gen.ts canvas ister: sahte 2B bağlam
const ctx2d: Record<string, unknown> = new Proxy({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) } as Record<string, unknown>, { get: (t, k: string) => (k in t ? t[k] : () => ctx2d) });
(globalThis as unknown as { document: { createElement: () => unknown } }).document.createElement = () => ({ style: {}, width: 0, height: 0, getContext: () => ctx2d, addEventListener() {}, toDataURL: () => "" });

describe("kayıt", () => {
  const w = generate();
  it("yeni oyun tutarlı başlar", () => {
    const s = newGame(w);
    expect(Number.isFinite(s.hero.x) && Number.isFinite(s.hero.y)).toBe(true);
    expect(s.hero.lv).toBeGreaterThanOrEqual(1);
    expect(s.villages.length).toBeGreaterThan(5);
  });
  it("kaydet-yükle gidiş dönüşü korur", () => {
    const s = newGame(w);
    s.hero.lv = 7;
    s.res.gold = 4321;
    saveGame(s);
    const l = loadGame(w);
    expect(l.hero.lv).toBe(7);
    expect(l.res.gold).toBe(4321);
  });
  it("bozuk konum yüklemede onarılır", () => {
    const s = newGame(w);
    s.hero.x = NaN;
    saveGame(s);
    const l = loadGame(w);
    expect(Number.isFinite(l.hero.x)).toBe(true);
  });
});

describe("dünya", () => {
  const w = generate();
  it("her şehir Semerkant'tan yürünerek ulaşılabilir", () => {
    const cap = CITIES.find((c) => c.id === "samarkand")!;
    for (const c of CITIES) {
      if (c === cap) continue;
      const path = astar(w.cost, Math.floor(cap.x / NAV), Math.floor(cap.y / NAV), Math.floor(c.x / NAV), Math.floor(c.y / NAV));
      expect(path, c.id).not.toBeNull();
    }
    expect(NW).toBeGreaterThan(0);
  });
});
