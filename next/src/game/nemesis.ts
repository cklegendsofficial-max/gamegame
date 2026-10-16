export type NemTrait = "okcu" | "akinci" | "zirhli" | "kurnaz" | "korkusuz" | "yagmaci";

export interface Nemesis {
  id: number;
  name: string;
  epithet: string;
  trait: NemTrait;
  lv: number;
  wins: number;
  scars: number;
  camp: number;
  alive: boolean;
  why: string;
  bro?: boolean;
  han?: boolean;
  /** töreye göre diyet ödenip barışıldı */
  peace?: boolean;
}

export const diyetCost = (lv: number): number => 300 + lv * 120;

export const BRO_MAX = 2;

export const BRO_MODS: Record<NemTrait, { atk?: number; def?: number; spd?: number; crit?: number; army?: number; loot?: number; text: string }> = {
  okcu: { atk: 0.06, text: "Okçularının ustalığı: saldırı +%6" },
  akinci: { spd: 0.06, text: "Akıncı yolları: hız +%6" },
  zirhli: { def: 0.06, text: "Demirci sırları: savunma +%6" },
  kurnaz: { crit: 0.04, text: "Pusu bilgisi: kritik +%4" },
  korkusuz: { army: 0.05, text: "Korkusuz yiğitler: ordu gücü +%5" },
  yagmaci: { loot: 0.08, text: "Yağma tecrübesi: ganimet +%8" },
};

export const BRO_BETRAY: Record<NemTrait, number> = { okcu: 0.01, akinci: 0.015, zirhli: 0.01, kurnaz: 0.04, korkusuz: 0, yagmaci: 0.035 };

export const NEM_TRAITS: Record<NemTrait, { name: string; desc: string; bonus: number }> = {
  okcu: { name: "Okçubaşı", desc: "Çetesi okçulardan oluşur; uzaktan vurur.", bonus: 0.04 },
  akinci: { name: "Akıncı", desc: "Atlıları hızlıdır; peşine düştü mü kurtulamazsın.", bonus: 0.03 },
  zirhli: { name: "Demir Zırhlı", desc: "Kendisi ve adamları ağır zırhlıdır.", bonus: 0.12 },
  kurnaz: { name: "Kurnaz", desc: "Pusu ustasıdır; seni çok uzaktan sezer.", bonus: 0.05 },
  korkusuz: { name: "Korkusuz", desc: "Asla kaçmaz, ölümüne dövüşür.", bonus: 0.08 },
  yagmaci: { name: "Yağmacı", desc: "Seni yenerse kesenin bir kısmını alır; kervanların belasıdır.", bonus: 0.03 },
};
export const NEM_TRAIT_KEYS = Object.keys(NEM_TRAITS) as NemTrait[];

const NAMES = ["Toğrul", "Bozok", "Kaçar", "Ulaş", "Tarkan", "Kutalmış", "Sançar", "Aybars", "Temir", "Karaca", "Yavlak", "Bayçar", "Alpagu", "Kayır", "Burçak", "Tuman", "Ilbars", "Çolpan"];
const EPITHETS = ["Kanlı", "Tek Göz", "Kara", "Sırtlan", "Deli", "Çakal", "Yılan Dilli", "Kurt Dişli", "Demir Pençe", "Kızıl Sakal", "Sağır", "Kambur", "Kuzgun"];
export const SCAR_EPITHETS = ["Yaralı", "Ölümden Dönen", "Yanık Yüzlü", "Ölmeyen"];

export const TAUNTS = [
  "Bozkır geniş ama benim için dar, {hero}. Bir gün yine karşılaşacağız.",
  "Adını hançerimin sapına kazıdım. Sırada boğazın var.",
  "Bugün canını bağışladım. Yarın bağışlamam.",
  "Kervanını, atını, kılıcını… hepsini alacağım. Sonra da adını.",
  "Annene söyle, oğlunun mezar taşını hazırlasın.",
  "Kılıcın ağırmış ama elin titriyor, {hero}. Bir dahakine kaldırmaya gücün yetmez.",
  "Senin türkünü ben yakacağım; sonu hep aynı biter.",
  "Kervan yollarında adın bir fıkra oldu. Herkes gülüyor.",
  "Atını bıraktım, çünkü seni yine yenmek istiyorum.",
  "Ben bir kurdum, sen kuzu. Bozkırın töresi bu.",
  "Yüzündeki yarayı ben açtım. Her aynaya baktığında beni hatırla.",
  "Sana bir tavsiye: bir dahaki sefere daha çok asker getir.",
  "Toprak seni istemiyor, {hero}. Ben de istemiyorum ama kısmet.",
];

export const REVENGE = [
  "Kampımı yaktın, kardeşlerimi kılıçtan geçirdin. Yemin olsun, aynısını sana yapacağım!",
  "Çadırımı yaktın ama ben külünden doğarım. Bekle beni.",
  "O gece kaçtım ama unutmadım. Hiçbir şeyi unutmam.",
  "Kardeşimin kanı kılıcında kurumadı. Benimki de seninkine karışacak.",
  "Sürümü dağıttın; şimdi tek başıma, ama tek başıma daha tehlikeliyim.",
  "Her gece senin yüzünü görüyorum, {hero}. Bir gece gerçekten göreceğim.",
  "Ateşimi söndürdün. Ben de seninkini söndüreceğim.",
  "Yaralarım kapandı. Borcum açık.",
];

export const LAST_WORDS = [
  "\"Gökte kuzgunlar dönüyor… benim için mi?\"",
  "\"Seni… küçümsemiştim…\"",
  "\"Kardeşlerim intikamımı alacak…\"",
  "\"Bozkır… ne güzeldi…\"",
  "\"Kılıcımı… kardeşime ver…\"",
  "\"Anam… beni kımızla büyüttü… sütü hâlâ ağzımda…\"",
  "\"Atımı… atımı serbest bırak. O suçsuz.\"",
  "\"İyi dövüştün. Bunu kimseye söyleme.\"",
  "\"Gök Tengri… beni affeder mi?\"",
  "\"Bir türkü yak benim için… kısa olsun.\"",
  "\"Kurtlar yesin beni. Kurtlar adildir.\"",
  "\"Sen de bir gün… benim gibi… yalnız…\"",
];

/** Huya göre ek sözler: kurnaz, akıncı, korkusuz ve yağmacı reisler kendine özgü konuşur. */
export const TRAIT_TAUNTS: Partial<Record<string, string[]>> = {
  kurnaz: ["Tuzağımı fark etmedin bile, {hero}. Bir dahakini de fark etmeyeceksin.", "Senin adımlarını sayıyorum. Kervancın bana çalışıyor; bilmiyor muydun?"],
  akinci: ["Atım rüzgârdan hızlı. Kaçamazsın, kovalayamazsın.", "Ufukta bir toz bulutu görürsen, o benim."],
  korkusuz: ["Ölümden korkmuyorum. Senden hiç korkmuyorum.", "Yarama tuz basıp yine geldim. Sen gelebilir misin?"],
  yagmaci: ["Kesen hafiflemiş, {hero}. Ağırlığını ben taşırım.", "Altının sesi tatlı. Seninkinin sesi daha tatlı."],
};

export function nemName(n: Nemesis): string {
  return `${n.epithet} ${n.name}${n.han ? " Han" : ""}`;
}

export function makeNemesis(id: number, camp: number, why: string, taken: string[], R: () => number = Math.random): Nemesis {
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const free = NAMES.filter((x) => !taken.includes(x));
  return { id, name: pick(free.length ? free : NAMES), epithet: pick(EPITHETS), trait: pick(NEM_TRAIT_KEYS), lv: 1, wins: 0, scars: 0, camp, alive: true, why };
}

export function nemBoss(n: Nemesis, tier: number) {
  const t = tier + n.lv * 0.6;
  return { name: nemName(n), icon: "j_bandit", hp: Math.round(90 * Math.pow(t, 1.4)), atk: Math.round(5 * Math.pow(t, 1.25)), def: 2 + Math.round(t * 2.5) + (n.trait === "zirhli" ? 4 : 0) };
}

export const NEM_MAX = 5;
