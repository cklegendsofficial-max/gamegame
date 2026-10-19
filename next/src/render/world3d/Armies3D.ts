import type { Army } from "../../game/data";
import { buildBandit, buildCamel, buildSoldier, type Actor, type BanditKind } from "./Actors3D";

/** Ordu bileşiminden görünen takipçi listesi (en fazla `max`). */

function visibleCount(tot: number, max: number): number {
  if (tot <= 0) return 0;
  const n = tot < 4 ? 1 : tot < 10 ? 2 : tot < 20 ? 3 : tot < 40 ? 5 : tot < 80 ? 7 : 9;
  return Math.min(max, n);
}

function shrink(a: Actor, k: number): Actor {
  a.root.scale.multiplyScalar(k);
  a.height *= k;
  return a;
}

export interface Formation {
  sig: string;
  makers: (() => Actor)[];
}

export function troopFormation(army: Army, team: number, seed: number, max = 9): Formation {
  const tot = army.spear + army.archer + army.horse;
  const n = visibleCount(tot, max);
  if (n === 0) return { sig: `0|${team}`, makers: [] };
  const share = [army.spear, army.archer, army.horse].map((v) => (v / tot) * n);
  const cnt = share.map((s) => Math.floor(s));
  let rest = n - cnt.reduce((a, b) => a + b, 0);
  const order = share.map((s, i) => [s - Math.floor(s), i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest <= 0) break;
    cnt[i]++;
    rest--;
  }
  const kinds: ("spear" | "archer" | "cav")[] = [];
  // atlılar öne, okçular arkaya
  for (let i = 0; i < cnt[2]; i++) kinds.push("cav");
  for (let i = 0; i < cnt[0]; i++) kinds.push("spear");
  for (let i = 0; i < cnt[1]; i++) kinds.push("archer");
  return {
    sig: `${kinds.join(",")}|${team}`,
    makers: kinds.map((k, i) => () => shrink(buildSoldier(k, team, seed * 13 + i * 7 + 1), 0.9)),
  };
}

export type BanditLook = "sword" | "axe" | "rider" | "heavy" | "chief";

export function banditLook(id: number): BanditLook {
  const roll = (id * 9301 + 49297) % 100;
  if (roll < 22) return "sword";
  if (roll < 42) return "axe";
  if (roll < 62) return "rider";
  if (roll < 82) return "heavy";
  return "chief";
}

export function banditFormation(army: Army, id: number): Formation {
  const tot = army.spear + army.archer + army.horse;
  const n = tot <= 2 ? 0 : tot <= 6 ? 1 : tot <= 12 ? 2 : tot <= 24 ? 3 : 4;
  const pool: BanditKind[] = ["sword", "axe", "heavy", "sword", "rider"];
  const kinds: BanditKind[] = [];
  for (let i = 0; i < n; i++) kinds.push(pool[(id + i * 3) % pool.length]);
  return { sig: kinds.join(","), makers: kinds.map((k, i) => () => buildBandit(k, id * 11 + i)) };
}

export function caravanFormation(guard: Army, team: number, id: number): Formation {
  const g = guard.spear + guard.archer + guard.horse;
  const guards = g <= 0 ? 0 : g < 12 ? 1 : 2;
  const makers: (() => Actor)[] = [() => buildCamel(id + 1, 5), () => buildCamel(id + 2, 4)];
  for (let i = 0; i < guards; i++) makers.push(() => shrink(buildSoldier(i ? "archer" : "spear", team, id * 5 + i), 0.95));
  return { sig: `cv|${guards}|${team}`, makers };
}
