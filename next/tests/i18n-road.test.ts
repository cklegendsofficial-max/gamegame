import { afterAll, describe, expect, it } from "vitest";
import "../src/i18n-road";
import { ROAD_EVENTS } from "../src/game/road";
import { t } from "../src/i18n";
import { settings } from "../src/settings";

describe("yol olayları İngilizce kapsamı", () => {
  const prev = settings.lang;
  afterAll(() => ((settings as { lang?: string }).lang = prev));
  it("başlık, metin ve seçeneklerin hepsi çevrilmiş", () => {
    (settings as { lang?: string }).lang = "en";
    const ctx = { season: "yaz" as const, night: true, cargo: 5, army: 10, lv: 5, comps: ["ayse", "korkut", "ferhat", "batu", "leyla", "lucia"] as never[], escort: "ayse" as never, city: "konya" };
    const miss = new Set<string>();
    const chk = (s?: string) => {
      if (s && t(s) === s) miss.add(s);
    };
    for (const e of ROAD_EVENTS) {
      chk(e.title);
      chk(e.text);
      for (const o of e.opts(ctx)) {
        chk(o.label);
        chk(o.ok.text);
        chk(o.fail?.text);
      }
    }
    expect([...miss]).toEqual([]);
  });
});
