// Boss kitlerinin dengesi: aynı boss savaşını kitsiz, karşılıksız ve tam karşılıklı oynatır.
import { Sim, type Boss, type Champion, type Field } from "../next/src/game/battle";
import type { Army } from "../next/src/game/data";
import { KARA_HAN, ERLIK, KOK_BORU, KASIM, FORT_GUARD, GATE_GUARD, PEAK_GUARD } from "../next/src/game/story";

const N = Number(process.argv[2] ?? 600);
const champ = (lv: number): Champion => ({ atk: 10 + lv * 3, def: 4 + lv, hp: 200 + lv * 45, maxHp: 200 + lv * 45, crit: 0.12, critMult: 1.8, dodge: 0.05, heal: 0.02, rage: false, firstStrike: false, skills: [] });

const fights: { name: string; lv: number; a: Army; b: Army; bb: number; boss: Boss }[] = [
  { name: "Kasım", lv: 5, a: { spear: 8, archer: 5, horse: 3 }, b: { spear: 8, archer: 4, horse: 0 }, bb: 0.1, boss: KASIM },
  { name: "Kara Han", lv: 14, a: { spear: 70, archer: 55, horse: 45 }, b: FORT_GUARD, bb: 0.3, boss: KARA_HAN },
  { name: "Erlik", lv: 22, a: { spear: 130, archer: 100, horse: 90 }, b: GATE_GUARD, bb: 0.35, boss: ERLIK },
  { name: "Kök Börü", lv: 26, a: { spear: 160, archer: 130, horse: 110 }, b: PEAK_GUARD, bb: 0.4, boss: KOK_BORU },
];

for (const f of fights) {
  const row: string[] = [];
  for (const mode of ["kitsiz", "karşılıksız", "%60", "tam"] as const) {
    let win = 0, rounds = 0, counters = 0;
    for (let i = 0; i < N; i++) {
      const boss = mode === "kitsiz" ? { ...f.boss, name: "x" } : f.boss;
      const field: Field = { ground: "bozkir", night: false };
      const s = new Sim(f.a, 0.2 + f.lv * 0.01, f.b, f.bb, champ(f.lv), boss, field, false);
      s.autoCounter = mode === "karşılıksız" ? 0 : mode === "tam" ? 1 : 0.6;
      const res = s.finish();
      if (res.win) win++;
      rounds += res.rounds.length;
      counters += s.counters;
    }
    row.push(`${mode} %${((win / N) * 100).toFixed(0).padStart(3)} (tur ${(rounds / N).toFixed(1)}, karşılık ${(counters / N).toFixed(1)})`);
  }
  console.log(`${f.name.padEnd(9)} ${row.join("  |  ")}`);
}
