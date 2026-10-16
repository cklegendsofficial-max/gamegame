import type { Slot } from "./rpg";

/** Şehir ustaları: her biri tek bir şehre bağlı, haftada bir ziyaret edilebilen küçük bonus kaynağı. */
export interface Craftsman {
  id: string;
  city: string;
  name: string;
  role: string;
  icon: string;
  /** Bonusun geçerli olduğu döküm yuvası. */
  slot: Slot;
  /** rar: bir sonraki dökümün nadirliğini +1 artırır · discount: bir sonraki dökümün altın maliyetini yarıya indirir. */
  kind: "rar" | "discount";
  desc: string;
}

export const ARTISAN_COOLDOWN_DAYS = 7;

export const CRAFTSMEN: Craftsman[] = [
  { id: "demirci", city: "rey", name: "Demirci Tuğrul", role: "Demirci ustası", icon: "anvil", slot: "silah", kind: "rar", desc: "Rey'in gece gündüz sönmeyen örsünde çalışır. Ziyaretinden sonra bir sonraki silah dökümüne nadirlik bahşeder." },
  { id: "terzi", city: "merv", name: "Terzi Gülnaz", role: "Terzi ustası", icon: "mat_leather", slot: "zirh", kind: "discount", desc: "Merv'in ipek ve deri ustası. Ziyaretinden sonra bir sonraki zırh dökümü yarı fiyatına çıkar." },
  { id: "kuyumcu", city: "nishapur", name: "Kuyumcu Baha", role: "Kuyumcu ustası", icon: "turquoise", slot: "tilsim", kind: "rar", desc: "Nişabur firuzesinin sırrını bilir. Ziyaretinden sonra bir sonraki tılsım dökümüne nadirlik bahşeder." },
  { id: "okcu", city: "kashgar", name: "Okçu Ustası Alp", role: "Yay ustası", icon: "u_archer", slot: "silah", kind: "discount", desc: "Bozkırın en keskin gözlü yay ustası. Ziyaretinden sonra bir sonraki silah dökümü yarı fiyatına çıkar." },
];

export const CRAFTSMAN_BY_CITY: Record<string, Craftsman> = Object.fromEntries(CRAFTSMEN.map((c) => [c.city, c]));
