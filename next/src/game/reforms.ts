import type { Unit } from "./data";
import type { UnitMul } from "./battle";
import type { FactionId } from "./factions";
import type { Slot } from "./rpg";

/** Bir asker türünün eğitim basamağı: saldırı/can çarpanı ve ücret çarpanı. */
export interface DrillStep {
  id: string;
  name: string;
  atk: number;
  hp: number;
  wage: number;
  desc: string;
  /** Kültür birliği: bu devletle en az Dost olmak ya da onun bir şehrine sahip olmak gerekir. */
  fac?: FactionId;
}

export const DRILL: Record<Unit, { lv1: DrillStep; lv2: DrillStep[] }> = {
  spear: {
    lv1: { id: "kalkanli", name: "Kalkanlı Mızraklı", atk: 1.12, hp: 1.18, wage: 1.2, desc: "Kalkan ve sıkı saf: can +%18, saldırı +%12." },
    lv2: [
      { id: "agir", name: "Ağır Piyade", atk: 1.28, hp: 1.4, wage: 1.5, desc: "Zincir zırhlı ön saf. Can +%40, saldırı +%28." },
      { id: "gulam", name: "Gazne Gulamı", atk: 1.42, hp: 1.3, wage: 1.6, fac: "gazne", desc: "Sarayda yetişmiş seçkin piyade. Saldırı +%42, can +%30." },
      { id: "skutatos", name: "Bizans Skutatosu", atk: 1.22, hp: 1.6, wage: 1.6, fac: "bizans", desc: "Büyük oval kalkanlı duvar. Can +%60, saldırı +%22." },
    ],
  },
  archer: {
    lv1: { id: "keskin", name: "Keskin Nişancı", atk: 1.18, hp: 1.05, wage: 1.2, desc: "Uzun menzilli talim: saldırı +%18." },
    lv2: [
      { id: "agiryay", name: "Ağır Yay Okçusu", atk: 1.38, hp: 1.12, wage: 1.5, desc: "Boynuz yayla zırh delen ok. Saldırı +%38." },
      { id: "oguz", name: "Oğuz Atlı Okçusu", atk: 1.5, hp: 1.2, wage: 1.7, fac: "selcuk", desc: "Dörtnalda geriye ok atan Türkmen. Saldırı +%50, can +%20." },
    ],
  },
  horse: {
    lv1: { id: "akinci", name: "Akıncı", atk: 1.15, hp: 1.1, wage: 1.2, desc: "Hızlı baskın süvarisi: saldırı +%15, can +%10." },
    lv2: [
      { id: "zirhli", name: "Zırhlı Süvari", atk: 1.3, hp: 1.38, wage: 1.5, desc: "At zırhlı ağır süvari. Can +%38, saldırı +%30." },
      { id: "bozkir", name: "Karahan Bozkır Süvarisi", atk: 1.45, hp: 1.25, wage: 1.6, fac: "karahan", desc: "Tengri'nin rüzgârı. Saldırı +%45, can +%25." },
      { id: "katafrakt", name: "Katafrakt", atk: 1.32, hp: 1.6, wage: 1.8, fac: "bizans", desc: "Tepeden tırnağa demir. Can +%60, saldırı +%32." },
    ],
  },
};

/** Basamağa çıkmak için gereken birlik tecrübesi ve taban altın. */
export const DRILL_XP = [0, 60, 220];
export const DRILL_GOLD = [0, 120, 380];
export const DRILL_PER_MAN = [0, 4, 9];

export type Drill = Partial<Record<Unit, { lv: number; br?: string }>>;

export function drillStep(d: Drill | undefined, u: Unit): DrillStep | null {
  const x = d?.[u];
  if (!x || x.lv <= 0) return null;
  if (x.lv === 1) return DRILL[u].lv1;
  return DRILL[u].lv2.find((b) => b.id === x.br) ?? DRILL[u].lv2[0];
}

export function drillMul(d: Drill | undefined): UnitMul {
  const m: UnitMul = { atk: {}, hp: {} };
  for (const u of ["spear", "archer", "horse"] as Unit[]) {
    const st = drillStep(d, u);
    if (!st) continue;
    m.atk[u] = st.atk;
    m.hp[u] = st.hp;
  }
  return m;
}

// ---------- beylik yönetimi ----------

export type Tax = 0 | 1 | 2;
export const TAX: { name: string; gold: number; mood: number; desc: string }[] = [
  { name: "Hafif vergi", gold: 0.7, mood: 0.6, desc: "Halk rahat nefes alır: altın −%30, memnuniyet her gün artar." },
  { name: "Örf vergisi", gold: 1, mood: 0, desc: "Töreye uygun pay. Memnuniyet olduğu yerde kalır." },
  { name: "Ağır vergi", gold: 1.4, mood: -0.9, desc: "Hazine dolar, halk homurdanır: altın +%40, memnuniyet her gün düşer." },
];

export type Spec = "" | "demirhane" | "dokuma" | "atcilik" | "medrese";
export const SPECS: { id: Exclude<Spec, "">; name: string; icon: string; desc: string; cost: number }[] = [
  { id: "demirhane", name: "Demirhane", icon: "anvil", desc: "Atölyede eşya dökmek %20 ucuz, örste başarı şansı +%5.", cost: 900 },
  { id: "dokuma", name: "Dokuma tezgâhları", icon: "carpets", desc: "Çarşı geliri +%25 ve her gün 2 halı üretir.", cost: 900 },
  { id: "atcilik", name: "Atçılık", icon: "stable", desc: "Atlı tutmak ve eğitmek %25 ucuz, birlik sınırı +4.", cost: 900 },
  { id: "medrese", name: "Medrese", icon: "scroll", desc: "Her gün +3 şöhret, tecrübe kazancı +%10.", cost: 900 },
];
export const SPEC_SWITCH = 600;

/** Memnuniyet (0-100) üretim çarpanı. */
export function moodMul(mood: number): number {
  if (mood < 25) return 0.7;
  if (mood < 45) return 0.9;
  if (mood > 75) return 1.12;
  return 1;
}

export interface Realm {
  tax: Tax;
  mood: number;
  spec: Spec;
  day: number;
  /** son ayaklanma günü */
  riot?: number;
}

export function newRealm(day: number): Realm {
  return { tax: 1, mood: 60, spec: "", day };
}

// ---------- NPC sipariş defteri ----------

export interface Order {
  id: number;
  city: string;
  who: string;
  slot: Slot;
  tier: number;
  rar: number;
  gold: number;
  rep: number;
  until: number;
}

export const ORDER_WHO = ["Kervanbaşı", "Sipahi beyi", "Medrese hocası", "Tüccar kadın", "Sınır muhafızı", "Saray kâhyası", "Avcıbaşı", "Genç alp"];
export const ORDER_WHY: Record<Slot, string[]> = {
  silah: ["oğlunun ilk seferi için", "kaybettiği kılıcının yerine", "beyine armağan etmek için"],
  zirh: ["sınır boyuna gitmeden önce", "kervanı korurken giymek için", "düğün alayında parlamak için"],
  kalkan: ["kale kapısında nöbet için", "okçulara karşı", "kardeşine hediye"],
  at: ["uzak yola", "posta tatarı için", "yarış için"],
  tilsim: ["nazardan korunmak için", "yolu açık olsun diye", "kızının çeyizine"],
};

// ---------- zorluk ----------

export type Diff = "kolay" | "normal" | "destan";
export const DIFFS: Record<Diff, { name: string; foe: number; loot: number; desc: string }> = {
  kolay: { name: "Kolay", foe: 0.8, loot: 1.15, desc: "Haramiler daha az, ganimet daha bol. Hikâyeyi rahat oynamak için." },
  normal: { name: "Normal", foe: 1, loot: 1, desc: "Dengeli bozkır." },
  destan: { name: "Destan", foe: 1.3, loot: 0.9, desc: "Düşmanlar kalabalık ve acımasız. Gerçek bir sınav." },
};

// ---------- tarihçe (ticaret defteri) ----------

export const LEDGER_DAYS = 12;
export type Ledger = Record<string, Partial<Record<string, [number, number, number][]>>>;

/** Fiyat geçmişinden küçük bir SVG çizgi grafiği. */
export function sparkline(pts: [number, number, number][], w = 72, h = 18): string {
  if (pts.length < 2) return "";
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  const sx = (x: number) => ((x - x0) / Math.max(1, x1 - x0)) * (w - 2) + 1;
  const sy = (y: number) => h - 1 - ((y - y0) / Math.max(1, y1 - y0)) * (h - 2);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join("");
  const up = ys[ys.length - 1] >= ys[0];
  return `<svg class="spark ${up ? "up" : "down"}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${d}"/></svg>`;
}

// ---------- vasallık ----------

export const FEALTY_REP = 250;
export const FEALTY_FEE = (lv: number) => 8 + lv * 2;
export const FEALTY_BREAK = 220;
