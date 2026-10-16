import type { Army, Unit } from "./data";
import type { Boss, Order } from "./battle";

/** Savaşın geçtiği özel mekân: zemin dokusunu, arka planı ve birlik çarpanlarını belirler. */
export type Arena = "avlu" | "pazar" | "kale" | "sur" | "kurgan" | "yeralti" | "zirve" | "ates" | "otag" | "ordugah" | "orman" | "magara" | "deniz" | "col";

export const ARENAS: Record<Arena, { name: string; img: string; night?: boolean; mul: Partial<Record<Unit, number>>; text: string; tint: string }> = {
  avlu: { name: "Tekke avlusu", img: "arena/avlu", mul: { spear: 1.15, horse: 0.8 }, text: "Dar avlu: atlılar dönemez, mızrak safı kapıyı tutar. Mızraklı +%15, atlı -%20.", tint: "#e6c890" },
  pazar: { name: "Esir pazarı", img: "arena/pazar", mul: { spear: 1.1, horse: 0.75, archer: 0.9 }, text: "Tezgâhlar ve zincirler arasında göğüs göğüse: atlı -%25, okçu -%10, mızraklı +%10.", tint: "#d9a066" },
  kale: { name: "Kara Tamga Kalesi", img: "arena/kale", mul: { horse: 0.7, spear: 1.1, archer: 1.1 }, text: "Kara kayalara oyulmuş kale kapısı: atlı -%30, mızraklı ve okçu +%10.", tint: "#7a6a8a" },
  sur: { name: "Sur dibi", img: "arena/sur", mul: { horse: 0.75, archer: 1.15 }, text: "Surların gölgesinde: okçu +%15, atlı -%25.", tint: "#c8a878" },
  kurgan: { name: "Kurgan tepesi", img: "arena/kurgan", night: true, mul: { archer: 0.9, spear: 1.1 }, text: "Balballar arasında mor ışık: okçu -%10, mızraklı +%10.", tint: "#9a7ad0" },
  yeralti: { name: "Erlik'in yurdu", img: "arena/yeralti", night: true, mul: { horse: 0.8, archer: 0.85, spear: 1.1 }, text: "Yerin dokuz kat altı, lav yarıkları: atlı -%20, okçu -%15, mızraklı +%10.", tint: "#b04aff" },
  zirve: { name: "Tengri zirvesi", img: "arena/zirve", mul: { horse: 0.7, archer: 1.15 }, text: "Buz ve kar, gök çok yakın: atlı -%30, okçu +%15.", tint: "#9ad8ff" },
  ates: { name: "Kamın ateşi", img: "arena/ates", night: true, mul: { archer: 0.9 }, text: "Ayin ateşinin çevresinde gölgeler dans ediyor: okçu -%10.", tint: "#ff9a4a" },
  otag: { name: "Otağ meydanı", img: "arena/otag", night: true, mul: { horse: 1.1, archer: 0.9 }, text: "Gece baskını, yanan çadırlar: atlı +%10, okçu -%10.", tint: "#ffb060" },
  ordugah: { name: "Moğol ordugâhı", img: "arena/ordugah", mul: { horse: 1.25, spear: 0.9 }, text: "Uçsuz bozkır, at sırtında bir ordu: atlı +%25, mızraklı -%10.", tint: "#e0c070" },
  orman: { name: "Kayın ormanı", img: "arena/orman", mul: { spear: 1.2, horse: 0.8, archer: 0.85 }, text: "Ağaçlar okları keser, atlar takılır: mızraklı +%20, atlı -%20, okçu -%15.", tint: "#8ab070" },
  magara: { name: "Dev mağarası", img: "arena/magara", night: true, mul: { horse: 0.7, archer: 0.9, spear: 1.15 }, text: "Kayalık mağara ağzı: atlı -%30, okçu -%10, mızraklı +%15.", tint: "#c08a5a" },
  deniz: { name: "Gemi güvertesi", img: "arena/deniz", mul: { horse: 0.5, spear: 1.15, archer: 1.05 }, text: "Sallanan güverte: atlı -%50, mızraklı +%15, okçu +%5.", tint: "#8ac8e8" },
  col: { name: "Kızgın çöl", img: "arena/col", mul: { spear: 0.85, horse: 1.1, archer: 0.95 }, text: "Kum ve güneş: mızraklı -%15, atlı +%10, okçu -%5.", tint: "#f0b860" },
};

/** Düşmanın türü: birliklerinin görünüşünü ve savaştaki davranışını değiştirir. */
export type Kin = "insan" | "balbal" | "kurt" | "golge" | "mogol" | "albasti" | "bekci" | "yilan" | "akrep" | "bars" | "korsan" | "fedai" | "kipcak";

export interface KinDef {
  name: string;
  /** Düşman birliklerinin ikonları (mızrak, okçu, atlı). */
  icons: Partial<Record<Unit, string>>;
  tint: string;
  text: string;
  /** Senin birliklerinin bu düşmana karşı vuruş çarpanı. */
  vs: Partial<Record<Unit, number>>;
  /** Düşman birliklerinin vuruş çarpanı. */
  atk: Partial<Record<Unit, number>>;
  /** Düşmanın moral kaybı çarpanı (0 = hiç kaçmaz). */
  fear: number;
  /** Her tur senin moraline etkisi. */
  dread?: number;
  /** İlk tur ek baskın vuruşu. */
  ambush?: number;
  /** Her tur kahramanın canından yüzde emme. */
  drain?: number;
}

export const KINS: Record<Kin, KinDef> = {
  insan: { name: "İnsan ordusu", icons: {}, tint: "", text: "", vs: {}, atk: {}, fear: 1 },
  balbal: {
    name: "Uyanmış balballar", icons: { spear: "kin/balbal", archer: "kin/balbal", horse: "kin/balbal" }, tint: "rgba(150,140,170,0.45)",
    text: "Taştan askerler: oklar sekip düşer (okçu -%55), gürz gibi inen mızraklar işler (mızraklı +%25). Korku bilmezler.",
    vs: { archer: 0.45, spear: 1.25, horse: 0.9 }, atk: { spear: 1.1 }, fear: 0,
  },
  kurt: {
    name: "Kurt sürüsü", icons: { spear: "kin/kurt", archer: "kin/kurt", horse: "kin/kurt" }, tint: "",
    text: "Hızlı ve sinsi: ilk saldırı onlardan gelir. Okla vurmak zor (okçu -%25), mızrak safına çarpınca dağılırlar (mızraklı +%30). Çabuk ürkerler.",
    vs: { archer: 0.75, spear: 1.3 }, atk: { horse: 1.15 }, fear: 1.5, ambush: 0.35,
  },
  golge: {
    name: "Erlik'in gölgeleri", icons: { spear: "kin/golge", archer: "kin/golge", horse: "kin/golge" }, tint: "rgba(120,40,190,0.5)",
    text: "Karanlıktan doğan ruhlar: atlar ürker (atlı -%25), her tur korku yayarlar (moral -4). Kaçmayı bilmezler.",
    vs: { horse: 0.75 }, atk: { spear: 1.1, archer: 1.1 }, fear: 0.4, dread: 4,
  },
  mogol: {
    name: "Moğol atlı okçuları", icons: { horse: "kin/mogol", archer: "kin/mogol" }, tint: "",
    text: "At sırtında ok atan tümenler: atlıları da ok yağdırır (düşman atlı +%30). Kalkan safı oklara dayanır, ama yakalamak zordur (mızraklı -%10).",
    vs: { spear: 0.9, horse: 1.1 }, atk: { horse: 1.3, archer: 1.1 }, fear: 0.8,
  },
  albasti: {
    name: "Albastılar", icons: { spear: "kin/albasti", archer: "kin/albasti", horse: "kin/albasti" }, tint: "rgba(60,90,40,0.4)",
    text: "Gecenin cadıları: kahramanın canını emerler (her tur -%3) ve korku salarlar (moral -3).",
    vs: { archer: 0.9 }, atk: {}, fear: 0.7, dread: 3, drain: 0.03,
  },
  bekci: {
    name: "Gök Bekçileri", icons: { spear: "kin/bekci", archer: "kin/bekci", horse: "kin/bekci" }, tint: "rgba(120,190,255,0.35)",
    text: "Buzdan zırhlı, Tengri'nin muhafızları: kılıç donar (tüm birlikler -%10), atlar kayar (atlı -%20). Asla kaçmazlar.",
    vs: { spear: 0.9, archer: 0.9, horse: 0.72 }, atk: { archer: 1.15 }, fear: 0,
  },
  yilan: {
    name: "Yılan sürüsü", icons: { spear: "kin/yilan", archer: "kin/yilan", horse: "kin/yilan" }, tint: "rgba(40,140,70,0.35)",
    text: "Zehirli ve kaygan: kahramanın canını zehirler (her tur -%2), oklar pullardan seker (okçu -%20). Mızrak başlarını ezer (mızraklı +%20).",
    vs: { archer: 0.8, spear: 1.2 }, atk: { spear: 1.1 }, fear: 0.5, drain: 0.02, ambush: 0.15,
  },
  akrep: {
    name: "Dev akrepler", icons: { spear: "kin/akrep", archer: "kin/akrep", horse: "kin/akrep" }, tint: "rgba(200,120,30,0.3)",
    text: "Kabukları sert (tüm birlikler -%10), iğneleri zehirli (her tur moral -2). Atlılar kum üstünde iyi kaçar (atlı +%10).",
    vs: { spear: 0.9, archer: 0.85, horse: 1.1 }, atk: { spear: 1.15, horse: 1.1 }, fear: 0.3, dread: 2,
  },
  bars: {
    name: "Kar leoparları", icons: { spear: "kin/bars", archer: "kin/bars", horse: "kin/bars" }, tint: "rgba(170,210,255,0.3)",
    text: "Kayalardan sıçrar, ilk vuruş onlardan (pusu). Okla vurmak zor (okçu -%30), mızrak safına çarpınca dağılırlar (mızraklı +%25).",
    vs: { archer: 0.7, spear: 1.25 }, atk: { horse: 1.25 }, fear: 1.2, ambush: 0.4,
  },
  korsan: {
    name: "Hazar korsanları", icons: {}, tint: "",
    text: "Kayıklardan çıkıp baskın yaparlar (pusu). Kıyıda göğüs göğüse dövüşürler: atlı -%15.",
    vs: { horse: 0.85 }, atk: { spear: 1.12 }, fear: 1.1, ambush: 0.2,
  },
  fedai: {
    name: "Haşhaşi fedaileri", icons: {}, tint: "rgba(60,20,80,0.25)",
    text: "Gölgeden saldırır (güçlü pusu), korku nedir bilmez. Kahramanı hedef alırlar (her tur -%2 can).",
    vs: {}, atk: { spear: 1.15, archer: 1.1 }, fear: 0.35, ambush: 0.45, drain: 0.02,
  },
  kipcak: {
    name: "Kıpçak akıncıları", icons: { horse: "kin/mogol" }, tint: "",
    text: "Bozkırın atlı okçuları: atlıları çok güçlü (düşman atlı +%25). Mızrak safı onları durdurur (mızraklı +%15).",
    vs: { spear: 1.15 }, atk: { horse: 1.25 }, fear: 0.9,
  },
};

export type MoveKind = "nefes" | "hucum" | "cagir" | "lanet" | "sifa" | "deprem";

/** Her boss hareketinin karşılığı olan emir. */
export const COUNTER: Record<MoveKind, Order> = { nefes: "siper", hucum: "ricat", cagir: "yagmur", lanet: "nara", sifa: "kanat", deprem: "ricat" };

export const MOVE_HINT: Record<MoveKind, string> = {
  nefes: "Kalkan Siperi kur!",
  hucum: "Turan Taktiği ile çekil!",
  cagir: "Ok Yağmuru ile toplanmadan vur!",
  lanet: "Nara at, korkuyu kır!",
  sifa: "Kanat saldırısıyla ayini boz!",
  deprem: "Turan Taktiği ile geri çekil!",
};

export interface BossMove {
  kind: MoveKind;
  name: string;
  /** Bir tur önceden görünen uyarı. */
  tell: string;
  pow: number;
  /** "cagir" için çağrılan birlik oranı [mızrak, okçu, atlı]. */
  mix?: [number, number, number];
}

export interface BossKit {
  title: string;
  intro: string;
  arena: Arena;
  kin: Kin;
  moves: BossMove[];
  /** Can yarıya inince. */
  rage: { name: string; text: string; atk: number; move: BossMove };
  /** Bu bossa özgü ganimet (UNIQUES/BOSS_LOOT anahtarı). */
  loot?: string;
  theme: "kara" | "buz" | "ates" | "mor" | "bozkir";
}

const breath = (name: string, tell: string, pow = 1.4): BossMove => ({ kind: "nefes", name, tell, pow });
const charge = (name: string, tell: string, pow = 2.2): BossMove => ({ kind: "hucum", name, tell, pow });
const summon = (name: string, tell: string, pow = 0.22, mix: [number, number, number] = [1, 1, 1]): BossMove => ({ kind: "cagir", name, tell, pow, mix });
const curse = (name: string, tell: string, pow = 22): BossMove => ({ kind: "lanet", name, tell, pow });
const heal = (name: string, tell: string, pow = 0.12): BossMove => ({ kind: "sifa", name, tell, pow });
const quake = (name: string, tell: string, pow = 0.55): BossMove => ({ kind: "deprem", name, tell, pow });

export const BOSS_KITS: Record<string, BossKit> = {
  "Köle Tüccarı Kasım": {
    title: "Merv'in Zincir Taciri", intro: "\"Bu kız kıymetli, yiğit. Seni de zincire vurup yanına satarım!\"", arena: "pazar", kin: "insan", theme: "bozkir",
    moves: [summon("Bekçileri çağırır", "Kasım ıslık çaldı: tezgâhların ardından bekçiler koşuyor!", 0.35, [1, 1, 0]), charge("Zincir savurur", "Kasım ağır zincirini başının üstünde döndürüyor!", 1.8)],
    rage: { name: "Altın kesesi", text: "Kasım kesesini havaya fırlattı: \"Kim onu vurursa yüz altın!\"", atk: 1.2, move: summon("Paralı bıçkınlar", "Pazarın her köşesinden bıçkınlar altına koşuyor!", 0.4, [1, 0, 0]) },
    loot: "kasim",
  },
  "Kara Han": {
    title: "Kara Tamga'nın Efendisi", intro: "\"Babanın boynundaki halkayı ben taktım. Seninkini de ben takacağım.\"", arena: "kale", kin: "insan", theme: "kara",
    moves: [charge("Kara kılıç hamlesi", "Kara Han kılıcını iki eliyle kaldırdı, doğrudan sana koşuyor!", 2.4), summon("Kale okçuları", "Surların üstünde yüzlerce yay geriliyor!", 0.2, [0, 1, 0]), curse("Damganın laneti", "Kara Han damgalı elini kaldırdı; omzundaki damga yanmaya başladı!", 24)],
    rage: { name: "Esir ruhları", text: "Kara Han zindanlardaki esirlerin ruhlarını kılıcına çekti; kılıç mor yanıyor!", atk: 1.35, move: breath("Ruh dalgası", "Kılıçtan mor bir dalga kabarıyor!", 1.6) },
    loot: "karahan",
  },
  "Erlik'in Gölgesi": {
    title: "Yeraltının Habercisi", intro: "Ateşin içinden kara bir siluet yükseldi. Sesi dokuz kat aşağıdan geliyordu.", arena: "ates", kin: "golge", theme: "mor",
    moves: [curse("Karanlık fısıltı", "Gölge kulaklarına fısıldıyor; askerlerin titriyor!", 20), breath("Kara duman", "Gölge ağzını açtı; ateşten kara duman yükseliyor!", 1.2)],
    rage: { name: "Ateşi yutar", text: "Gölge ayin ateşini içine çekti; alevler simsiyah!", atk: 1.3, move: heal("Ateşten beslenir", "Gölge alevleri emiyor; yaraları kapanıyor!", 0.15) },
  },
  "Erlik Han": {
    title: "Yeraltının Hanı", intro: "\"Dokuz kat aşağı indin, küçük köle. Burada zincirlerin yeniden dövülür.\"", arena: "yeralti", kin: "golge", theme: "mor",
    moves: [breath("Dokuz katın nefesi", "Erlik derin bir nefes alıyor; yer kızıla kesti!", 1.8), summon("Kara ruhlar", "Lav yarıklarından eller uzanıyor: Erlik ölüleri çağırıyor!", 0.18, [1, 1, 0]), curse("Kara zincir", "Erlik zincirini yere vurdu; askerlerinin yüreği daralıyor!", 26), heal("Ruh yutar", "Erlik düşen askerlerin ruhlarını çekiyor!", 0.1)],
    rage: { name: "Gerçek suret", text: "Erlik'in tacı yarıldı; boynuzları tavana değiyor. Gerçek suretini gösterdi!", atk: 1.4, move: quake("Yer yarılır", "Erlik iki elini yere bastırdı; zemin çatlıyor!", 0.6) },
    loot: "erlik",
  },
  "Kök Börü": {
    title: "Ergenekon'un Kurdu", intro: "Gök yeleli kurt başını kaldırdı. Gözlerinde bütün ataların bakışı vardı.", arena: "zirve", kin: "bekci", theme: "buz",
    moves: [charge("Gök sıçrayışı", "Kök Börü geriye çekildi, kar tozu kalkıyor: sıçrayacak!", 2.6), breath("Buz uluması", "Kök Börü başını göğe kaldırdı: uluması buz kesiyor!", 1.5), summon("Sürüyü çağırır", "Zirvenin ardından mavi gözler parlıyor: sürü geliyor!", 0.2, [0, 0, 1])],
    rage: { name: "Tengri'nin ışığı", text: "Gökten mavi bir ışık kurdun üstüne indi; yelesi alev gibi!", atk: 1.35, move: quake("Çığ", "Zirve gürlüyor: kar kütlesi kayıyor!", 0.6) },
    loot: "kokboru",
  },
  "Tepegöz": {
    title: "Tek Gözlü Dev", intro: "\"Oğuz'un yiğitleri bana günde iki kişi, beş yüz koyun verirdi. Sen kaçıncısın?\"", arena: "magara", kin: "insan", theme: "kara",
    moves: [charge("Kaya fırlatır", "Tepegöz koca bir kayayı başının üstüne kaldırdı!", 2.4), quake("Yeri döver", "Tepegöz yumruklarını kaldırdı; yer titreyecek!", 0.55)],
    rage: { name: "Kör öfke", text: "Tek gözü kan çanağı: Tepegöz körlemesine saldırıyor!", atk: 1.4, move: breath("Ağaç savurur", "Tepegöz bir ağacı kökünden söktü!", 1.6) },
    loot: "tepegoz",
  },
  "Deli Dumrul": {
    title: "Kuru Çayın Bekçisi", intro: "\"Geçenden otuz üç, geçmeyenden döve döve kırk akçe!\"", arena: "orman", kin: "insan", theme: "bozkir",
    moves: [charge("Gürz darbesi", "Dumrul gürzünü iki eliyle kaldırdı!", 2), curse("Kahkaha", "Dumrul kahkaha atıyor; askerlerin şaşkın!", 16)],
    rage: { name: "Azrail'e meydan", text: "\"Azrail'i bulamadım, seni bulduk!\" Dumrul köpürdü.", atk: 1.3, move: charge("Köprü yıkan", "Dumrul köprünün kalasını söktü, üstüne koşuyor!", 2.4) },
    loot: "dumrul",
  },
  "Şöklü Melik": {
    title: "Kâfir Kalesinin Beyi", intro: "\"Oğuz beylerini zindanımda çürüttüm. Sen de onların yanına gideceksin.\"", arena: "kale", kin: "insan", theme: "kara",
    moves: [summon("Kale muhafızları", "Kalenin kapısı açıldı; zırhlı muhafızlar çıkıyor!", 0.22, [1, 0, 1]), charge("Melik'in mızrağı", "Şöklü Melik atını mahmuzladı, mızrağı sende!", 2.2), heal("Kale şifacıları", "Surların ardında şifacılar Melik'in yarasını sarıyor!", 0.1)],
    rage: { name: "Zindan anahtarı", text: "Melik zindanı açtı: esir Oğuz beylerini kalkan yaptı!", atk: 1.3, move: curse("Esirlerin çığlığı", "Zincirli beylerin çığlığı yüreğini dağlıyor!", 24) },
    loot: "soklu",
  },
  "Kara Kıpçak Başbuğu Tuğrıl": {
    title: "Kıpçak Bozkırının Kurdu", intro: "\"Kıpçak tuğu kimseye eğilmez. Sen eğilirsin.\"", arena: "ordugah", kin: "insan", theme: "bozkir",
    moves: [summon("Kıpçak atlıları", "Ufukta toz bulutu: Kıpçak atlıları dolanıyor!", 0.22, [0, 0, 1]), charge("Başbuğ hücumu", "Tuğrıl atını şahlandırdı, sana dönüyor!", 2.2)],
    rage: { name: "Kurt bayrağı", text: "Tuğrıl kurt başlı tuğu dikti; Kıpçaklar uluyor!", atk: 1.3, move: curse("Kıpçak naraları", "Binlerce boğazdan nara yükseliyor!", 22) },
  },
  "Erlik'in Yeği Kara Kuş": {
    title: "Alt Dünyanın Kanadı", intro: "Kanatlarını açınca mağaranın tavanı karardı.", arena: "yeralti", kin: "golge", theme: "mor",
    moves: [breath("Kanat fırtınası", "Kara Kuş kanatlarını geriye gerdi: fırtına geliyor!", 1.4), charge("Pençe dalışı", "Kara Kuş tavana yükseldi, pençeleri sende!", 2.2)],
    rage: { name: "Kara tüyler", text: "Kara Kuş tüylerini döktü; her tüy bir gölgeye dönüşüyor!", atk: 1.3, move: summon("Tüy gölgeleri", "Havada uçuşan tüyler gölge askere dönüşüyor!", 0.25) },
    loot: "karakus",
  },
  "Ak Börü": {
    title: "Bozkırın Ak Kurdu", intro: "Ay ışığında bembeyaz bir kurt. Sürünün başı seni süzüyor.", arena: "orman", kin: "kurt", theme: "buz",
    moves: [charge("Gırtlağa atılır", "Ak Börü sinsice yere yattı: atılacak!", 2.2), summon("Sürü uluması", "Ak Börü uludu; çalılıkların arasından gözler parlıyor!", 0.3, [0, 0, 1])],
    rage: { name: "Yaralı kurt", text: "Yaralı kurt dişlerini gösterdi: şimdi daha tehlikeli!", atk: 1.35, move: charge("Son atılış", "Ak Börü bütün gücünü topluyor!", 2.6) },
    loot: "akboru",
  },
  "Taş Muhafız": {
    title: "Kurganın Bekçisi", intro: "Taş gövdesindeki çatlaklardan mor ışık sızıyor.", arena: "kurgan", kin: "balbal", theme: "mor",
    moves: [quake("Yeri döver", "Taş Muhafız yumruklarını kaldırdı!", 0.5), summon("Balbalları uyandırır", "Çevredeki balballar yerinden kıpırdıyor!", 0.2, [1, 0, 0])],
    rage: { name: "Çatlayan taş", text: "Gövdesi çatladı; içinden mor ruh ışığı taşıyor!", atk: 1.3, move: breath("Ruh patlaması", "Çatlaklardan ışık kabarıyor!", 1.4) },
  },
  "Albastı": {
    title: "Loğusaların Korkusu", intro: "Saçları yılan gibi kıvrılan bir kadın, kurganın tepesinde gülüyor.", arena: "kurgan", kin: "albasti", theme: "mor",
    moves: [curse("Kara ninni", "Albastı bir ninni mırıldanıyor; askerlerin uyuklamaya başladı!", 22), heal("Can emer", "Albastı yaralı askerlerinin üstüne eğiliyor!", 0.12)],
    rage: { name: "Gerçek yüz", text: "Albastı'nın yüzü çatladı; altında kurt dişleri!", atk: 1.35, move: charge("Ciğer söker", "Albastı dört ayak üstünde sana koşuyor!", 2.2) },
  },
  "Mumyalanmış Hakan": {
    title: "Altın Tacın Laneti", intro: "Çürümüş başında altın taç hâlâ parlıyor.", arena: "yeralti", kin: "balbal", theme: "kara",
    moves: [summon("Kırk köle", "Kapıda diz çökmüş iskeletler ayağa kalkıyor!", 0.22, [1, 1, 0]), curse("Dokuz kuşak laneti", "Hakan parmağını sana uzattı: lanet okuyor!", 22)],
    rage: { name: "Tacın gazabı", text: "Altın taç alev aldı!", atk: 1.3, move: breath("Altın ateş", "Taçtan altın renkli alev yükseliyor!", 1.4) },
  },
  "Kara Kam": {
    title: "Erlik'in Davulcusu", intro: "Davulunun her vuruşunda yerin dokuz katından bir ruh yükselir.", arena: "ates", kin: "golge", theme: "mor",
    moves: [summon("Ruh çağırır", "Kara Kam davuluna üç kez vurdu!", 0.22), curse("Gözleri yanar", "Kara Kam'ın gözleri Erlik ateşiyle tutuştu!", 22), heal("Davul ayini", "Davul hızlanıyor; kamın yaraları kapanıyor!", 0.12)],
    rage: { name: "Yarılan davul", text: "Davul yarıldı; içinden kara bir rüzgâr çıktı!", atk: 1.35, move: breath("Kara rüzgâr", "Kara rüzgâr dönmeye başladı!", 1.5) },
  },
  "Buz Devi": {
    title: "Tengri'nin Kışı", intro: "Nefesi kılıçları kırar, bakışı kanı dondurur.", arena: "zirve", kin: "bekci", theme: "buz",
    moves: [breath("Buz nefesi", "Buz Devi derin bir nefes alıyor; havada buz kristalleri!", 1.5), quake("Buzul yarılır", "Dev ayağını kaldırdı: buz çatlayacak!", 0.55)],
    rage: { name: "Kar fırtınası", text: "Mağaranın içinde kar fırtınası koptu!", atk: 1.3, move: charge("Buz yumruğu", "Dev yumruğunu buzla kapladı!", 2.4) },
  },
  "Yer Ejderi": {
    title: "Kara Pullu Uyuyan", intro: "Bin yıldır hazinesinin üstünde uyuyordu. Şimdi uyandı.", arena: "magara", kin: "insan", theme: "ates",
    moves: [breath("Ejder ateşi", "Ejderin göğsü kor gibi parlıyor: ateş geliyor!", 2), charge("Kuyruk savurması", "Ejder kuyruğunu geriye kıvırdı!", 2)],
    rage: { name: "Kanatlar açıldı", text: "Ejder kanatlarını açtı; mağara sarsılıyor!", atk: 1.4, move: quake("Mağara çöker", "Tavandan kayalar kopuyor!", 0.6) },
    loot: "ejder",
  },
  "Kırkların Başbuğu": {
    title: "Kırk Alpin Önderi", intro: "\"Kırk alp benimle gömüldü. Seni kabul etmeleri için beni yenmelisin.\"", arena: "kurgan", kin: "balbal", theme: "kara",
    moves: [summon("Kırk alp", "Kırk kalkan duvardan iniyor; ölü alpler saf tutuyor!", 0.22, [1, 0, 1]), charge("Başbuğ kılıcı", "Başbuğ kılıcını çekti, selam verdi ve saldırıyor!", 2.2)],
    rage: { name: "Tuğ dalgalanır", text: "Rüzgârsız tuğ dalgalandı: kırk alp nara atıyor!", atk: 1.3, move: curse("Ölülerin narası", "Kırk ölü boğazdan nara yükseliyor!", 22) },
  },
  "Taş Bekçi": {
    title: "Mezarın İlk Kapısı", intro: "Bin yıldır kapıyı bekleyen dev balbal.", arena: "kurgan", kin: "balbal", theme: "mor",
    moves: [quake("Kapı çarpar", "Taş Bekçi kollarını kaldırdı!", 0.5), charge("Taş yumruk", "Gözlerindeki kor parladı!", 2)],
    rage: { name: "Kor gözler", text: "Gözlerindeki kor alev aldı!", atk: 1.3, move: breath("Kor nefesi", "Taşın ağzından kor yükseliyor!", 1.4) },
  },
  "Albastı Ana": {
    title: "Yeraltının Kraliçesi", intro: "Saçları yılan gibi kıvrılıyor.", arena: "yeralti", kin: "albasti", theme: "mor",
    moves: [curse("Yılan saçlar", "Albastı Ana'nın saçları kabarıyor!", 24), heal("Can emer", "Albastı Ana düşenlerin üstüne eğiliyor!", 0.12), summon("Kızlarını çağırır", "Karanlıktan albastılar sürünüyor!", 0.2)],
    rage: { name: "Kraliçenin öfkesi", text: "Albastı Ana çığlık attı; duvarlar kanıyor!", atk: 1.35, move: breath("Çığlık", "Albastı Ana ağzını sonuna kadar açtı!", 1.5) },
  },
  "Erlik'in Elçisi": {
    title: "Kara Zırhlı Haberci", intro: "Arkasında dokuz kat karanlık var.", arena: "yeralti", kin: "golge", theme: "mor",
    moves: [charge("Kara mızrak", "Elçi kara mızrağını sana çevirdi!", 2.2), curse("Erlik'in fermanı", "Elçi bir ferman açtı: ölüm fermanı!", 22)],
    rage: { name: "Kara zırh yarılır", text: "Zırhının altından duman taşıyor!", atk: 1.3, move: summon("Duman askerler", "Dumandan askerler doğuyor!", 0.22) },
  },
};

const MONGOL_KIT: BossKit = {
  title: "Cengiz'in Noyanı", intro: "\"Gök tek, yeryüzünde de tek han olacak. Diz çök ya da kül ol.\"", arena: "ordugah", kin: "mogol", theme: "bozkir",
  moves: [summon("Tümen dolanır", "Ufukta sancaklar kalktı: tümen kanatlardan dolanıyor!", 0.18, [0, 1, 2]), breath("Ok bulutu", "Binlerce yay aynı anda gerildi: gökyüzü kararacak!", 1.6), charge("Noyan hücumu", "Noyan zırhlı muhafızlarıyla sana yöneldi!", 2.2)],
  rage: { name: "Kara Bulut", text: "Noyan davulları çaldırdı: Moğol düzeni bir dalga gibi kapanıyor!", atk: 1.3, move: curse("Korku haberi", "Yanan şehirlerin haberi saflarında dolaşıyor!", 26) },
  loot: "noyan",
};

/** Bossun adına göre savaş kiti; "Uyanmış" gibi önekleri tanır. */
export function bossKit(b: Boss | null): BossKit | null {
  if (!b) return null;
  const n = b.name.replace(/^Uyanmış /, "");
  if (BOSS_KITS[n]) return BOSS_KITS[n];
  if (/Noyan|Tümen Başı/.test(n)) return MONGOL_KIT;
  return null;
}

/** Savaşın başlığına ve düşman adına göre düşman türü. */
export function kinFor(title: string, foe: string): Kin | null {
  const s = `${title} ${foe}`;
  if (/Moğol/.test(s)) return "mogol";
  if (/[Kk]urt|Börü/.test(s)) return "kurt";
  if (/Balbal|Kurgan|Taş asker|Yazıt|Harabe bekçi/.test(s)) return "balbal";
  if (/Gölge|Erlik|Alt Dünya/.test(s)) return "golge";
  if (/Albastı/.test(s)) return "albasti";
  if (/Gök Bekçi|Tengri Dağı/.test(s)) return "bekci";
  if (/[Kk]orsan/.test(s)) return "korsan";
  if (/Fedai|Haşhaşi/.test(s)) return "fedai";
  if (/Kıpçak Akıncı/.test(s)) return "kipcak";
  return null;
}

export function arenaFor(title: string): Arena | null {
  if (/[Kk]orsan/.test(title)) return "deniz";
  if (/[Kk]uşatma|[Ss]avunması/.test(title)) return "sur";
  if (/Ordugâh|Moğol Tümeni|Son Savaş/.test(title)) return "ordugah";
  if (/Kurt sürüsü/.test(title)) return "orman";
  if (/Harabe|Alt Dünya/.test(title)) return /Alt Dünya/.test(title) ? "yeralti" : "kurgan";
  return null;
}

export function kinSummon(b0: Army, pow: number, mix: [number, number, number] = [1, 1, 1]): Army {
  const n = Math.max(3, Math.round(Math.max(10, b0.spear + b0.archer + b0.horse) * pow));
  const t = mix[0] + mix[1] + mix[2];
  return { spear: Math.round((n * mix[0]) / t), archer: Math.round((n * mix[1]) / t), horse: Math.round((n * mix[2]) / t) };
}
