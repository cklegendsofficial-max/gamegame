/** Hazine: Yarmak (premium para), paketler, Destan Yolu sezon kartı, kozmetikler ve şeffaf oranlı sandık. Hesap geneli (kayıttan bağımsız). */

export const IAP_KEY = "kk_iap";

export type ProductId = "y_80" | "y_450" | "y_1000" | "y_2400" | "starter" | "pass" | "kervan";

export interface Product {
  id: ProductId;
  name: string;
  desc: string;
  icon: string;
  /** Mağaza fiyatı alınamazsa gösterilen fiyat. */
  fallback: string;
  yarmak?: number;
  bonus?: number;
  tag?: string;
  once?: boolean;
  consumable: boolean;
}

export const PRODUCTS: Product[] = [
  { id: "starter", name: "Yolcu Kesesi", desc: "300 Yarmak · 5000 altın · 5 Ruh Taşı · 3 Alp Nişanı · Kervanbaşı çerçevesi", icon: "sandik", fallback: "₺59,99", yarmak: 300, tag: "Tek sefer · 8× değer", once: true, consumable: false },
  { id: "pass", name: "Destan Yolu Kartı", desc: "Bu sezonun altın yolunu açar: 30 basamakta Yarmak, sandık, özel çerçeve, sancak ve destan eşyası.", icon: "arena/pass", fallback: "₺189,99", tag: "Sezonluk", consumable: true },
  { id: "kervan", name: "Kervan Ağası · 30 gün", desc: "Hemen 100 Yarmak, sonra 30 gün boyunca her gün 40 Yarmak + 1000 altın. Toplam 1300 Yarmak.", icon: "j_caravan", fallback: "₺99,99", yarmak: 100, tag: "En kârlı", consumable: true },
  { id: "y_80", name: "Bir avuç Yarmak", desc: "80 Yarmak", icon: "yarmak", fallback: "₺34,99", yarmak: 80, consumable: true },
  { id: "y_450", name: "Yarmak kesesi", desc: "400 + 50 hediye Yarmak", icon: "yarmak", fallback: "₺169,99", yarmak: 400, bonus: 50, consumable: true },
  { id: "y_1000", name: "Yarmak sandığı", desc: "850 + 150 hediye Yarmak", icon: "yarmak", fallback: "₺339,99", yarmak: 850, bonus: 150, tag: "En popüler", consumable: true },
  { id: "y_2400", name: "Han hazinesi", desc: "1800 + 600 hediye Yarmak", icon: "yarmak", fallback: "₺749,99", yarmak: 1800, bonus: 600, tag: "En iyi değer", consumable: true },
];
export const PRODUCT_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p])) as Record<ProductId, Product>;

export type CosKind = "frame" | "banner" | "lakap";
export interface Cosmetic {
  id: string;
  kind: CosKind;
  name: string;
  desc: string;
  /** Yarmak fiyatı; yoksa satılmaz (kart, sandık ya da başarıyla kazanılır). */
  price?: number;
  color: string;
  from?: "pass" | "chest" | "starter" | "deed";
  /** Başarı ile açılan lakaplar için koşul açıklaması. */
  deed?: string;
}

export const COSMETICS: Cosmetic[] = [
  { id: "kervanbasi", kind: "frame", name: "Kervanbaşı", desc: "Deve kılından örülmüş, bakır kakmalı çerçeve.", color: "#c8874a", from: "starter" },
  { id: "kurt", kind: "frame", name: "Bozkurt", desc: "Gümüş kurt dişleriyle çevrili çerçeve.", price: 300, color: "#b8c8d8" },
  { id: "ejder", kind: "frame", name: "Ejder Pulu", desc: "Kızıl pullar arasında yanan bir göz.", price: 500, color: "#ff6a3a" },
  { id: "gok", kind: "frame", name: "Gök Tengri", desc: "Yıldızların içinden ışıyan mavi hale.", price: 800, color: "#7fd0ff" },
  { id: "buz", kind: "frame", name: "Buz Devi", desc: "Hiç erimeyen buzdan çerçeve.", color: "#bfefff", from: "chest" },
  { id: "altin", kind: "frame", name: "Altın Yol", desc: "Destan Yolu'nun 15. basamağı.", color: "#ffd56a", from: "pass" },
  { id: "destan", kind: "frame", name: "Destan", desc: "Destan Yolu'nun zirvesi: her sezon yalnızca sonuna varanlara.", color: "#ff9a3c", from: "pass" },
  { id: "kizil", kind: "banner", name: "Kızıl Sancak", desc: "Savaş meydanında kan rengi sancak.", price: 200, color: "#c8202a" },
  { id: "gece", kind: "banner", name: "Gece Sancağı", desc: "Ay ışığında parlayan lacivert sancak.", price: 200, color: "#1e2f6a" },
  { id: "ak", kind: "banner", name: "Ak Sancak", desc: "Barışın ve hürriyetin beyaz sancağı.", price: 200, color: "#efe8d8" },
  { id: "ates", kind: "banner", name: "Ateş Sancağı", desc: "Ucunda alev dalgalanan sancak.", color: "#ff7a1a", from: "chest" },
  { id: "yildiz", kind: "banner", name: "Yıldız Sancağı", desc: "Destan Yolu'nun 20. basamağı.", color: "#3a6aff", from: "pass" },
  { id: "kartal", kind: "lakap", name: "Bozkırın Kartalı", desc: "Ozanlar seni bu adla anar.", price: 150, color: "#ffd56a" },
  { id: "efendi", kind: "lakap", name: "Kervanların Efendisi", desc: "İpek Yolu'nda adın önünden yürür.", price: 150, color: "#ffd56a" },
  { id: "talihli", kind: "lakap", name: "Talihli", desc: "Sandıklar sana gülümser.", color: "#8fe07a", from: "chest" },
  { id: "yolcu", kind: "lakap", name: "Destan Yolcusu", desc: "Destan Yolu'nun 30. basamağı (ücretsiz yol).", color: "#e2bd62", from: "pass" },
  { id: "zincir", kind: "lakap", name: "Zincir Kıran", desc: "Köle tüccarı Kasım'ı yendin.", color: "#e8dcc0", from: "deed", deed: "Köle Tüccarı Kasım" },
  { id: "karahan", kind: "lakap", name: "Kara Tamga'yı Yıkan", desc: "Kara Han'ı yendin.", color: "#ff8a6a", from: "deed", deed: "Kara Han" },
  { id: "erlik", kind: "lakap", name: "Erlik'i İndiren", desc: "Erlik Han'ı tahtından indirdin.", color: "#d58cff", from: "deed", deed: "Erlik Han" },
  { id: "borudost", kind: "lakap", name: "Gök Kurt'un Dostu", desc: "Kök Börü başını eğdi.", color: "#7fd0ff", from: "deed", deed: "Kök Börü" },
  { id: "ejderavci", kind: "lakap", name: "Ejder Avcısı", desc: "Yer Ejderi'ni yendin.", color: "#ff7a5c", from: "deed", deed: "Yer Ejderi" },
  { id: "tepegoz", kind: "lakap", name: "Basat'ın Yolunda", desc: "Tepegöz'ü yendin.", color: "#ffb070", from: "deed", deed: "Tepegöz" },
];
export const COS_BY_ID: Record<string, Cosmetic> = Object.fromEntries(COSMETICS.map((c) => [c.id, c]));

export interface Spend {
  id: string;
  name: string;
  desc: string;
  icon: string;
  price: number;
}

export const SPENDS: Spend[] = [
  { id: "kese", name: "Altın kesesi", desc: "Seviyene göre altın", icon: "coins", price: 60 },
  { id: "hazine", name: "Altın hazinesi", desc: "6 kese değerinde altın", icon: "sandik", price: 300 },
  { id: "ruh", name: "5 Ruh Taşı", desc: "Örs, simya ve rün kazıma için", icon: "ruh", price: 70 },
  { id: "parsomen", name: "2 Kutsal Parşömen", desc: "Güçlendirmede eşyayı korur", icon: "parsomen", price: 90 },
  { id: "nisan", name: "2 Alp Nişanı", desc: "Orhun rünü kazımak için", icon: "nisan", price: 120 },
  { id: "iksir", name: "Yol azığı", desc: "3 Şifa Merhemi + 3 Kımız Tulumu", icon: "healer", price: 40 },
];

export const CHEST_PRICE = 160;
export const CHEST10_PRICE = 1440;
export const CHEST_PITY = 10;
export type ChestKind = "legend" | "epic" | "rare" | "nisan" | "ruh" | "cos" | "yarmak";
/** Sandık oranları oyuncuya aynen gösterilir. */
export const CHEST_TABLE: { kind: ChestKind; name: string; p: number; icon: string }[] = [
  { kind: "legend", name: "Destan eşyası ya da set parçası", p: 0.05, icon: "trophy" },
  { kind: "epic", name: "Destansı eşya", p: 0.18, icon: "it_sword_4" },
  { kind: "rare", name: "Nadir eşya", p: 0.3, icon: "it_sword_3" },
  { kind: "nisan", name: "3 Alp Nişanı", p: 0.15, icon: "nisan" },
  { kind: "ruh", name: "8 Ruh Taşı", p: 0.17, icon: "ruh" },
  { kind: "cos", name: "Sandığa özel kozmetik (hepsi varsa 60 Yarmak)", p: 0.1, icon: "seal" },
  { kind: "yarmak", name: "40 Yarmak", p: 0.05, icon: "yarmak" },
];

export function rollChest(pity: number): ChestKind {
  if (pity >= CHEST_PITY - 1) return "legend";
  let r = Math.random();
  for (const c of CHEST_TABLE) if ((r -= c.p) < 0) return c.kind;
  return "rare";
}

// ---------- Destan Yolu (sezon kartı) ----------

export const SEASON_DAYS = 30;
const SEASON_EPOCH = Date.UTC(2026, 0, 1);
const DAY_MS = 86_400_000;
export const seasonId = (now = Date.now()) => Math.floor((now - SEASON_EPOCH) / (SEASON_DAYS * DAY_MS));
export const seasonLeftDays = (now = Date.now()) => Math.ceil(((seasonId(now) + 1) * SEASON_DAYS * DAY_MS + SEASON_EPOCH - now) / DAY_MS);

export const PASS_TIERS = 30;
export const PASS_STEP = 100;

export type RewardKind = "gold" | "ruh" | "nisan" | "parsomen" | "yarmak" | "chest" | "cos" | "legend";
export interface Reward {
  kind: RewardKind;
  n?: number;
  id?: string;
}

function freeReward(t: number): Reward {
  if (t === PASS_TIERS) return { kind: "cos", id: "yolcu" };
  if (t === 10 || t === 20) return { kind: "chest", n: 1 };
  if (t % 5 === 0) return { kind: "yarmak", n: 15 };
  if (t % 3 === 0) return { kind: "nisan", n: 1 };
  if (t % 4 === 0) return { kind: "ruh", n: 2 };
  return { kind: "gold", n: 300 + t * 60 };
}

function premReward(t: number): Reward {
  if (t === PASS_TIERS) return { kind: "cos", id: "destan" };
  if (t === 29) return { kind: "legend", n: 1 };
  if (t === 15) return { kind: "cos", id: "altin" };
  if (t === 20) return { kind: "cos", id: "yildiz" };
  if (t === 25) return { kind: "chest", n: 2 };
  if (t === 8 || t === 18 || t === 28) return { kind: "chest", n: 1 };
  if (t % 5 === 0) return { kind: "yarmak", n: 60 };
  if (t % 3 === 0) return { kind: "nisan", n: 2 };
  if (t % 2 === 0) return { kind: "ruh", n: 4 };
  return { kind: "gold", n: 800 + t * 120 };
}

export const PASS = Array.from({ length: PASS_TIERS }, (_, i) => ({ tier: i + 1, free: freeReward(i + 1), prem: premReward(i + 1) }));

export function rewardText(r: Reward): string {
  switch (r.kind) {
    case "gold": return `${r.n} altın`;
    case "ruh": return `${r.n} Ruh Taşı`;
    case "nisan": return `${r.n} Alp Nişanı`;
    case "parsomen": return `${r.n} Parşömen`;
    case "yarmak": return `${r.n} Yarmak`;
    case "chest": return `${r.n} Destan Sandığı`;
    case "legend": return "Destan eşyası";
    case "cos": return COS_BY_ID[r.id!]?.name ?? "Kozmetik";
  }
}

export function rewardIcon(r: Reward): string {
  switch (r.kind) {
    case "gold": return "coins";
    case "chest": return "sandik";
    case "legend": return "trophy";
    case "cos": return COS_BY_ID[r.id!]?.kind === "lakap" ? "scroll" : COS_BY_ID[r.id!]?.kind === "banner" ? "tug" : "seal";
    default: return r.kind;
  }
}

// ---------- Hesap durumu ----------

export interface IapState {
  v: 1;
  yarmak: number;
  owned: string[];
  bought: Partial<Record<ProductId, number>>;
  equip: Partial<Record<CosKind, string>>;
  pass: { season: number; xp: number; prem: boolean; free: number[]; paid: number[] };
  chests: number;
  pity: number;
  kervan: { until: number; last: number } | null;
  daily: number;
  spent: number;
}

const fresh = (): IapState => ({ v: 1, yarmak: 0, owned: [], bought: {}, equip: {}, pass: { season: seasonId(), xp: 0, prem: false, free: [], paid: [] }, chests: 0, pity: 0, kervan: null, daily: 0, spent: 0 });

export function loadIap(): IapState {
  let st: IapState;
  try {
    st = { ...fresh(), ...(JSON.parse(localStorage.getItem(IAP_KEY) ?? "null") as Partial<IapState> | null) };
  } catch {
    st = fresh();
  }
  if (st.pass.season !== seasonId()) st.pass = { season: seasonId(), xp: 0, prem: false, free: [], paid: [] };
  return st;
}

export function saveIap(st: IapState): void {
  localStorage.setItem(IAP_KEY, JSON.stringify(st));
}

export const dayKey = (now = Date.now()) => Math.floor(now / DAY_MS);
export const passTier = (xp: number) => Math.min(PASS_TIERS, Math.floor(xp / PASS_STEP));
