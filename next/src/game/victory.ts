import { armySize } from "./data";
import { citiesOf, FACTIONS, type FactionId } from "./factions";
import { SHIP_MAX } from "./hazar";
import type { Game } from "./game";

/** Devlet başına bitiş koşulu: şehirleri ele geçirmek yetmez, o devletin ruhuna uygun bir yol da gerekir. */
export interface VictoryDef {
  id: FactionId;
  name: string;
  label: string;
  check: (g: Game) => boolean;
}

function ownsAll(g: Game, cities: string[]): boolean {
  return cities.length > 0 && cities.every((c) => !!g.s.owned[c]);
}

/** Selçuklu yolu: ordu ağırlıklı okçu/atlıda ya da terfide zirvede. */
function highArcherHorse(g: Game): boolean {
  const a = g.s.hero.army;
  const total = armySize(a);
  const share = total ? (a.archer + a.horse) / total : 0;
  return share >= 0.6 || g.drillLv("archer") >= 3 || g.drillLv("horse") >= 3;
}

export const VICTORIES: VictoryDef[] = [
  {
    id: "karahan",
    name: "Karahan Zaferi",
    label: "Kaşgar, Semerkant ve Buhara senin; Kağan seçildin ya da adın bütün bozkırda şöhretle anılıyor.",
    check: (g) => ownsAll(g, citiesOf("karahan")) && (!!g.s.kagan || g.s.renown >= 1000),
  },
  {
    id: "gazne",
    name: "Gazne Zaferi",
    label: "Merv ve Nişabur'u aldın; ağır mızraklı talimini Gazne Gulamı ya da seçkin bölük seviyesine taşıdın.",
    check: (g) => ownsAll(g, ["merv", "nishapur"]) && (g.s.drill?.spear?.br === "gulam" || (g.s.drill?.spear?.lv ?? 0) >= 3),
  },
  {
    id: "selcuk",
    name: "Selçuklu Zaferi",
    label: "Rey, Tebriz ve Konya senin; ordun okçu ve atlı ağırlıklı, Oğuz atlı okçusu talimine yakın.",
    check: (g) => ownsAll(g, citiesOf("selcuk")) && highArcherHorse(g),
  },
  {
    id: "bizans",
    name: "Bizans Zaferi",
    label: "Konstantiniyye senin; donanman ve ticaret filon İpek Yolu'nun batı kapısını elinde tutuyor.",
    check: (g) => !!g.s.owned["constantinople"] && ((g.s.fleet?.ships ?? 0) >= SHIP_MAX || (g.s.c.voyages ?? 0) >= 15),
  },
];

/** Henüz bildirilmemiş ilk zaferi döndürür. */
export function checkVictory(g: Game): VictoryDef | null {
  if (g.s.factionWin) return null;
  return VICTORIES.find((v) => v.check(g)) ?? null;
}

export function victoryIcon(id: FactionId): string {
  return `icons/${FACTIONS[id].icon}`;
}
