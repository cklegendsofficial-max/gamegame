/**
 * Tripo uzun dosya adlarını oyun anahtarlarına çevirir.
 * Kullanım: node scripts/rename_tripo_2100.mjs
 * models/ içindeki *.glb taranır; bilinen kalıplar eşleşirse yeniden adlandırılır.
 * Zaten doğru adlı dosyalara dokunulmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/assets/models");

/** sıra önemli: daha spesifik kalıp önce */
const MAP = [
  [/ship.?pirate|pirate.?dhow|dark.?pirate/i, "ship_pirate.glb"],
  [/\bdhow\b|sailing.?ship|medieval.?ship/i, "ship.glb"],
  [/\bpier\b|\bdock\b|harbor/i, "pier.glb"],
  [/pirate.?nest|pirate.?hideout|pirate.?camp/i, "pirate.glb"],
  [/hero.?slave|slave.?youth|ragged/i, "hero_slave.glb"],
  [/hero.?bahadir|bahadir|heavy.?champion|plate.?axe/i, "hero_bahadir.glb"],
  [/hero.?suikast|assassin|twin.?dagger/i, "hero_suikastci.glb"],
  [/hero.?hirsiz|thief.?rogue|bandana.?dagger/i, "hero_hirsiz.glb"],
  [/hero.?kam|shaman|feathered.?staff/i, "hero_kam.glb"],
  [/hero.?alp|\balp.?warrior\b|chainmail.?conical/i, "hero_alp.glb"],
  [/comp.?ayse|healer.?woman|teal.?robe/i, "comp_ayse.glb"],
  [/comp.?korkut|dervish|kopuz|bork/i, "comp_korkut.glb"],
  [/comp.?ferhat|hunter.?tracker/i, "comp_ferhat.glb"],
  [/comp.?batu|aging.?captain|horned.?helmet.?axe/i, "comp_batu.glb"],
  [/comp.?leyla|merchant.?woman.?bow/i, "comp_leyla.glb"],
  [/comp.?lucia|venetian/i, "comp_lucia.glb"],
  [/soldier.?archer|turkic.?archer/i, "soldier_archer.glb"],
  [/soldier.?cav|cavalryman|mounted.?spear/i, "soldier_cav.glb"],
  [/soldier.?sword|swordsman.?infantry/i, "soldier_sword.glb"],
  [/soldier.?spear|spear.?infantry/i, "soldier_spear.glb"],
  [/\bcamel\b|bactrian/i, "camel.glb"],
  [/\bhorse\b|steppe.?horse/i, "horse.glb"],
  [/bandit.?chief|war.?chief/i, "bandit_chief.glb"],
  [/bandit.?heavy|bandit.?brute|viking.?warrior/i, "bandit_heavy.glb"],
  [/bandit.?rider|bandit.?horseman/i, "bandit_rider.glb"],
  [/bandit.?axe/i, "bandit_axe.glb"],
  [/bandit.?sword|silk.?road.?bandit/i, "bandit_sword.glb"],
  [/green.?archer|comp.?leyla/i, "comp_leyla.glb"],
  [/comp.?batu|turkic.?warrior.?3d.?model.?\(1\)/i, "comp_batu.glb"],
  [/boss.?kokboru|kokboru|wolf.?spirit/i, "boss_kokboru.glb"],
  [/boss.?karahan|karahan|tyrant.?warlord|medieval.?warrior/i, "boss_karahan.glb"],
  [/boss.?erlik|\berlik\b/i, "boss_erlik.glb"],
  [/boss.?golem|stone.?golem/i, "boss_golem.glb"],
  [/boss.?albasti|\balbasti\b/i, "boss_albasti.glb"],
];

const KNOWN = new Set([
  "city.glb", "city_samarkand.glb", "city_bukhara.glb", "city_constantinople.glb",
  "city_konya.glb", "city_tabriz.glb", "city_merv.glb", "city_kashgar.glb",
  "city_rey.glb", "city_nishapur.glb", "fort.glb", "village.glb", "camp.glb",
  "kurgan.glb", "oasis.glb", "ruin.glb", "yurts.glb", "node.glb",
  ...MAP.map(([, t]) => t),
]);

const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".glb"));
let n = 0;
for (const f of files) {
  if (KNOWN.has(f) || /@/.test(f) && KNOWN.has(f.replace(/@[\d.]+/, ""))) continue;
  const hit = MAP.find(([re]) => re.test(f));
  if (!hit) {
    console.log(`? bilinmeyen: ${f}`);
    continue;
  }
  const dest = hit[1];
  const destPath = path.join(dir, dest);
  if (fs.existsSync(destPath)) {
    console.log(`skip (hedef var): ${f} -> ${dest}`);
    continue;
  }
  fs.renameSync(path.join(dir, f), destPath);
  console.log(`OK ${f} -> ${dest}`);
  n++;
}
console.log(`Bitti: ${n} yeniden adlandırıldı.`);
