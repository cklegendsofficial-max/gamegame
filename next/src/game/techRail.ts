import { UNITS, UNIT_KEYS, unitUnlocked } from "./data";
import { DRILL_MAX } from "./reforms";
import { ERAS } from "./world";
import type { Game } from "./game";

/** Tek bir kilit: ulaşılmamış birim ya da terfi, ve nedeni. */
export interface TechLock {
  label: string;
  done: boolean;
  why: string;
}

export interface TechRailStatus {
  eraName: string;
  eraText: string;
  locks: TechLock[];
  /** HUD'da gösterilecek bir sonraki açılması gereken kilit; hepsi açıksa null. */
  nextLock: TechLock | null;
  /** Araştırma kuyruğu: şimdiki ve bir sonraki açılmamış kilit (en çok 2 öğe). */
  queue: TechLock[];
}

/** Kışla/talim rayı: çağ adı + birim kilitleri + terfi basamakları; HUD'un kışla bölümü bunu özetler. */
export function techRailStatus(g: Game): TechRailStatus {
  const s = g.s;
  const kl = g.bld("kisla");
  const E = ERAS[s.wd?.era ?? "kurulus"];
  const locks: TechLock[] = [];
  for (const u of UNIT_KEYS) {
    const need = u === "archer" ? 2 : u === "horse" ? 4 : 0;
    const done = unitUnlocked(u, kl);
    locks.push({ label: `${UNITS[u].name} birimi`, done, why: done ? "" : `Kışla seviyesi ${need} gerekir (şu an ${kl})` });
  }
  for (const u of UNIT_KEYS) {
    const lv = g.drillLv(u);
    if (lv >= DRILL_MAX) {
      locks.push({ label: `${g.unitName(u)} talimi`, done: true, why: "" });
      continue;
    }
    const why = g.drillReason(u);
    locks.push({ label: `${g.unitName(u)} terfisi (${lv}/${DRILL_MAX})`, done: false, why: why || "Talim meydanında terfi hazır" });
  }
  const pending = locks.filter((l) => !l.done && l.why);
  const nextLock = pending[0] ?? null;
  return { eraName: E.name, eraText: E.text, locks, nextLock, queue: pending.slice(0, 2) };
}
