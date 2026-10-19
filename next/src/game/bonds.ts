import type { CompId } from "./story";
import type { RoadFx } from "./road";
import type { Army } from "./data";

export type BondEvent = "win" | "lose" | "boss" | "conquer" | "kilic" | "feast" | "taxHeavy" | "trade" | "robbed" | "sing" | "toreFair" | "toreHarsh" | "voyage" | "rescue" | "hunt";

export const BOND_START = 20;
export const BOND_QUEST = 50;
export const BOND_LEAVE = -40;
export const SWORN_MULT = 1.5;

/** Yoldaşların neyi sevip neyi sevmediği. */
export const BOND_FX: Record<BondEvent, Partial<Record<CompId, number>>> = {
  win: { batu: 2, ferhat: 1 },
  lose: { batu: -3, leyla: -1 },
  boss: { batu: 4, korkut: 3, ferhat: 3, ayse: 1 },
  conquer: { batu: 5, ayse: -3, lucia: -2, leyla: 1 },
  kilic: { ayse: -12, korkut: -8, batu: 3, lucia: -6 },
  feast: { ayse: 4, korkut: 4, leyla: 2, batu: 2 },
  taxHeavy: { ayse: -2, korkut: -1, leyla: 1 },
  trade: { leyla: 2, lucia: 2 },
  robbed: { leyla: -4, lucia: -4, batu: -2 },
  sing: { korkut: 4, ayse: 1 },
  toreFair: { ayse: 4, korkut: 3, ferhat: 1 },
  toreHarsh: { ayse: -4, batu: 2, korkut: -2 },
  voyage: { lucia: 4, leyla: 2 },
  rescue: { ayse: 3, ferhat: 2, batu: 1 },
  hunt: { ferhat: 4, batu: 2, korkut: 1 },
};

export const BOND_LIKES: Record<CompId, string> = {
  ayse: "Merhamet, adil hüküm, şölen",
  korkut: "Türküler, destanlar, adil töre",
  ferhat: "Sürek avı, boss avları, kurtarmalar",
  batu: "Savaş, fetih, sert yönetim",
  leyla: "Kârlı ticaret, düzen",
  lucia: "Deniz seferleri, ticaret",
};

export const BOND_LIKES_EN: Record<CompId, string> = {
  ayse: "Mercy, fair judgment, feasts",
  korkut: "Songs, sagas, fair töre",
  ferhat: "Grand hunts, boss hunts, rescues",
  batu: "War, conquest, a firm hand",
  leyla: "Profitable trade, order",
  lucia: "Sea voyages, trade",
};

export function bondTier(v: number): { name: string; en: string; cls: string } {
  if (v >= 75) return { name: "Can yoldaşı", en: "Soulmate", cls: "cheap" };
  if (v >= 40) return { name: "Güvenir", en: "Trusting", cls: "cheap" };
  if (v >= 0) return { name: "Temkinli", en: "Wary", cls: "" };
  return { name: "Küskün", en: "Resentful", cls: "dear" };
}

/** Yol olayından sonra muhafız yoldaşın tek satırlık sözü. */
export const ESCORT_ROAD: Partial<Record<string, Partial<Record<CompId, string>>>> = {
  kurt: {
    ferhat: "Ferhat: \"Kurtla konuşmayı bilen, bozkırı da bilir.\"",
    batu: "Batu: \"Bir sonraki sürüye kılıç yeter.\"",
    korkut: "Korkut: \"Bozkurt uğurdur; ama aç kurt değil.\"",
  },
  dervis: {
    korkut: "Korkut: \"Söz ateşte pişer; biz de dinledik.\"",
    ayse: "Ayşe: \"Bu gece yüreklerimiz yumuşadı.\"",
  },
  zar: {
    leyla: "Leyla: \"Zar masası dürüst değilse, keseyi kapat.\"",
    lucia: "Lucia: \"Limanda da böyle oynarlar; denizci bilmezse batar.\"",
  },
  ceylan: {
    ferhat: "Ferhat: \"İyi av; yarın da iz süreriz.\"",
    batu: "Batu: \"Et var, moral var.\"",
  },
  harami_pusu: {
    batu: "Batu: \"Geçit temiz. Ben önde yürürüm.\"",
    ferhat: "Ferhat: \"Pusuyu koklamıştım; iyi ki dinledin.\"",
    ayse: "Ayşe: \"Kan dökülmeden de geçilebilirdi… yine de sağ çıktık.\"",
  },
  yoldas_nobet: {
    ayse: "Ayşe: \"Nöbet bile paylaşılınca hafifler.\"",
    korkut: "Korkut: \"Ateş söner, söz kalır.\"",
    ferhat: "Ferhat: \"Sabah iz taze olur.\"",
    batu: "Batu: \"Konuşmak da bir tür kılıçtır.\"",
    leyla: "Leyla: \"Hesap tutmak da nöbettir.\"",
    lucia: "Lucia: \"Rüzgâr hangi limandan eserse essin, yanındayım.\"",
  },
  kuyu: {
    ayse: "Ayşe: \"Bir yudum su, bir dünya şükür.\"",
    korkut: "Korkut: \"İyilik yolu kısaltır.\"",
  },
  senlik: {
    batu: "Batu: \"Güreş güzeldi; kan yok, şan var.\"",
    ayse: "Ayşe: \"Obanın gücü bize de bulaştı.\"",
  },
  r_konya_sema: {
    korkut: "Korkut: \"Ney ile kopuz kardeştir; bu dönüşü unutma.\"",
    ayse: "Ayşe: \"İçim yumuşadı. Bir an evimiz gibiydi.\"",
  },
  r_bizans_gumruk: {
    leyla: "Leyla: \"Gümrük her yerde aynı: gülümse, say, geç.\"",
    lucia: "Lucia: \"Liman memuruyla pazarlık denizci işidir.\"",
  },
  r_kashgar_yesim: {
    leyla: "Leyla: \"Yeşim doğruysa Kaşgar'da servet, yanlışsa ders.\"",
    ferhat: "Ferhat: \"Taşın damarı dağdaki gibi; sahteyse ağırlığı yalan söyler.\"",
  },
  r_buhara_kagit: {
    korkut: "Korkut: \"Kâğıt destanı taşır; söz uçmasın diye.\"",
    ayse: "Ayşe: \"Annem de böyle sayfalar kuruturdu…\"",
  },
  r_merv_kanal: {
    ayse: "Ayşe: \"Su paylaşmak, ekmek paylaşmaktır.\"",
    batu: "Batu: \"Kanal açmak da bir savaştır; ama halk kazanır.\"",
  },
  r_tebriz_hali: {
    leyla: "Leyla: \"Her düğüm bir fiyat; her renk bir rota.\"",
    lucia: "Lucia: \"Venedik'te böyle bir halı saray eder.\"",
  },
  r_nisabur_firuze: {
    ferhat: "Ferhat: \"Dağ taşı yalan söylemez; satıcı söyler.\"",
    leyla: "Leyla: \"Firuze Rey'de iki katına çıkar — bile.\"",
  },
  r_rey_hekim: {
    ayse: "Ayşe: \"Ot bilmek, kılıç bilmek kadar önemli.\"",
    korkut: "Korkut: \"İyileşen beden destanı daha uzun söyler.\"",
  },
};

/** Olay kimliği yoksa yoldaşın genel yol sözü. */
export const ESCORT_FALLBACK: Record<CompId, string[]> = {
  ayse: ["Ayşe: \"Yol uzun, ama yalnız değiliz.\"", "Ayşe: \"Birbirimize bakarsak yeter.\""],
  korkut: ["Korkut: \"Her adım bir destan dizesidir.\"", "Korkut: \"Bozkır dinler; sen de dinle.\""],
  ferhat: ["Ferhat: \"İz taze; rüzgâr bizimle.\"", "Ferhat: \"Önde yürüyeyim, sen arkayı tut.\""],
  batu: ["Batu: \"Kılıç hazır, yol açık.\"", "Batu: \"Bir savaş daha yakın gibi.\""],
  leyla: ["Leyla: \"Bu yolun da bir kârı vardır.\"", "Leyla: \"Keseyi sıkı tut, fırsat kaçmasın.\""],
  lucia: ["Lucia: \"Karada da dümen tutarım.\"", "Lucia: \"Fırtına yoksa şükret.\""],
};

export function escortRoadLine(evId: string, escort: CompId): string {
  const hit = ESCORT_ROAD[evId]?.[escort];
  if (hit) return hit;
  if (evId.startsWith("r_")) {
    const city = evId.split("_")[1];
    const alias = (city && ESCORT_ROAD[city]?.[escort]) || undefined;
    if (alias) return alias;
  }
  return ESCORT_FALLBACK[escort][Math.floor(Math.random() * ESCORT_FALLBACK[escort].length)]!;
}

/** Yürürken ara sıra söylenen kısa sözler (gündüz). */
export const ROAD_CHAT: Record<CompId, string[]> = {
  ayse: ["Annemizin otları hâlâ cebimde. Yara olursa ben buradayım.", "Kardeşim, dön de bak: arkamızda kimse yok. İlk kez rahat nefes alıyorum.", "Şu mor çiçek ateş düşürür. Bir demet toplasam mı?"],
  korkut: ["Rüzgârın sesini dinle evlat; bozkır bir destan mırıldanıyor.", "Her yolun bir türküsü vardır. Bu yolun türküsünü sen yazıyorsun.", "Kopuzum susmuş ama kulağım dolu: yakında bir sürü atın nalı duyuluyor."],
  ferhat: ["İz taze. Bir at sürüsü geçmiş, ama binicisiz.", "Rüzgâr kuzeyden dönüyor. Yarın hava bozar.", "Kurtlar gibi yürü: sessiz ve sabırlı."],
  batu: ["Safları sıkı tut, komutan. Yürüyüş düzeni savaşın yarısıdır.", "Ben hakanın yüzbaşısıydım; sen onun hiç sahip olamadığı bir lidersin.", "Kılıcın ağırlaşırsa sana talim yaptırırım."],
  leyla: ["Bu yolda fiyat hep yukarı gider: önce yağma, sonra kıtlık, sonra ben satarım.", "Şu sepetler boşsa kervan iyi gitmemiş demektir.", "Bir şehirde ucuz alan, ötekinde pahalı satan zengin olur. Basit."],
  lucia: ["Denizi özledim ama bu bozkır da bir deniz gibi: dalgalı ve sonsuz.", "Venedik'te bu ipek bir şehir eder. Burada sadece yol parası.", "Haritanın kenarına bir ejderha çiz derler; ben de bozkır diyorum."],
};

/** Gece yürüyüşü sözleri. */
/** Şehre yaklaşırken yoldaşların o şehre özgü sözleri. */
export const CITY_CHAT: Record<CompId, Partial<Record<string, string>>> = {
  ayse: {
    bukhara: "Buhara... annemin mezarı bu yolun kenarında. Biraz yavaş yürüsek olur mu?",
    samarkand: "Semerkant'ın çeşmeleri... Küçükken burada su taşırdım. Her şey daha büyük sanmıştım.",
    konya: "Konya'da şifacıların bahçesi meşhurdur. Bir akşam otları bana da göster.",
    rey: "Rey hekimleri kemik yerine oturtmayı bilir. Yaralarını bir gösterelim.",
  },
  korkut: {
    kashgar: "Kaşgar'da dağlar türkü söyler gibi. Bir ağıt geçti aklımdan; akşama kopuza dökerim.",
    samarkand: "Semerkant... Atalarımız burada çadır kurmazdı, ama destanları geçerdi buradan.",
    merv: "Merv'in bahçeleri bozkırdan gelene cennet gibi gelir. Dinlen, diyor bu rüzgâr.",
    konya: "Konya'nın ney sesi kopuza yakın akraba. Kulak ver, aynı hasreti çekiyor.",
  },
  ferhat: {
    kashgar: "Kaşgar'ın yamaçlarında kar bars izi var. Gözünü açık tut.",
    tabriz: "Tebriz'in dağ rüzgârı yön şaşırtır. İzimi kaybetme.",
    nishapur: "Nişabur'un kayalığında dağ keçisi çok. Av vakti gelirse haber ver.",
    merv: "Merv ovası düz görünür ama kum çukurları vardır. Atın ayağına bak.",
  },
  batu: {
    constantinople: "Bu surlar... Kuşatma düşündüm, sonra vazgeçtim. Duvarı kırmak değil, kapıyı açtırmak gerek.",
    tabriz: "Tebriz'in hanlarında kavga çıkar derler. Kılıcım hazır.",
    samarkand: "Semerkant'ta güçlü olan, sözünü dinletir. Bir gün bu şehrin sancağını biz taşıyalım.",
    rey: "Rey'in çarşısında kalabalık çok; kese çalan çok. Elini kemerinden ayırma.",
  },
  leyla: {
    constantinople: "Kostantiniyye! Burada bir kese baharat bir kese altın eder. Yükü iyi sayalım.",
    bukhara: "Buhara halıcılarının fiyatı sabah bir, akşam iki. Sabah gidelim.",
    kashgar: "Kaşgar'da yeşim al, Konya'da sat. Sana bunu bedavaya veriyorum.",
    samarkand: "Semerkant pazarında pazarlık sanattır. Seni izleyeyim, ben de öğreneyim.",
  },
  lucia: {
    constantinople: "Liman kokusu! Gemilerin direklerini sayarım hep. Evimden bir şey var burada.",
    konya: "Konya'dan deniz çok uzak... Yine de burada hâlâ tuz kokusu duyar gibiyim.",
    tabriz: "Tebriz'de Venedikli tüccarlar var. Ağzımdan kaçan bir şarkıyı tanırlar belki.",
    rey: "Rey'de camlar renkli olur; Venedik ustaları bile kıskanır.",
  },
};
export const ROAD_CHAT_NIGHT: Record<CompId, string[]> = {
  ayse: ["Karanlıkta yaraları görmek zor. Dikkat et.", "Yıldızlar annemin gözleri gibi parlıyor bu gece."],
  korkut: ["Gece Erlik'in nefesi yakındır. Dua et.", "Ay bu gece destan yazıyor; sen de ona kulak ver."],
  ferhat: ["Ateşi söndür gerekirse; gözler karanlıkta çok şey görür.", "Kurt sesi duydum. Yakın değil ama dikkat."],
  batu: ["Nöbeti ben tutarım. Sen yarın için dinlen.", "Gece pusu zamanıdır. Gözümü açık tutuyorum."],
  leyla: ["Geceleyin kimse pazarlık yapmaz. Sadece soyar.", "Kesemi sıkı tut; karanlıkta eller uzun."],
  lucia: ["Şu yıldızlar denizcilerin pusulası. Burada da yolumuzu bulur.", "Gece yürümek, deniz fırtınasına benzer: sabır ister."],
};
/** Savaşta yoldaş becerisi tetiklenince kısa bağırış. */
export const COMP_BATTLE_BARK: Record<CompId, string[]> = {
  ayse: ["Dayanın — ben buradayım!", "Yarayı bırakın, ben bakarım!", "Ayağa kalkın, henüz bitmedi!"],
  korkut: ["Adınız destana yazılsın!", "Tengri şahidim olsun!", "Kopuz susmasın, siz de susmayın!"],
  ferhat: ["İzi kaçırmayın!", "Sağ kanat — benimle!", "Rüzgârı okuyun, okları değil!"],
  batu: ["Çarpın, bozgun bırakın!", "Ben öndeyim — gelin!", "Saflar kilit, ileri!"],
  leyla: ["Düzeni bozmayın!", "Kese sonra — şimdi saflar!", "Kaçan payını kaybeder!"],
  lucia: ["Dalga gibi vurun!", "Liman yok — sadece zafer!", "Rüzgâr bizimle!"],
};

export const COMP_WIN_BARK: Record<CompId, string[]> = {
  ayse: ["Yaşıyorsunuz — bu yeter.", "Yaraları sonra sararız."],
  korkut: ["Bu gün destana geçer.", "Adınızı kopuza yazdım."],
  ferhat: ["İz soğudu. Yol açık.", "Av bitti; şimdi yürürüz."],
  batu: ["Saflar duruyor. İyi.", "Bir zafer daha — payınızı alın."],
  leyla: ["Ganimeti sayın, sonra yürürüz.", "Kayıp az; kâr iyi."],
  lucia: ["Liman kazandı sayılır.", "Rüzgâr döndü, lehine."],
};

export interface CqChoice {
  label: string;
  text: string;
  bond: number;
  fx: RoadFx;
  fight?: (lv: number) => Army;
}

export interface CqStep {
  city: string;
  text: string;
  btn?: string;
  choices?: CqChoice[];
}

export interface CompQuest {
  id: CompId;
  title: string;
  offer: string;
  steps: CqStep[];
  sworn: string;
}

const A = (s: number, a: number, h: number): Army => ({ spear: s, archer: a, horse: h });

export const COMP_QUESTS: Record<CompId, CompQuest> = {
  ayse: {
    id: "ayse",
    title: "Annemizin Mezarı",
    offer: "Ayşe bir gece ateşin başında sessizce konuştu: \"Annemizi Kara Tamga baskınında Buhara yolunda gömdüler. Mezarı başında dua bile edemedik. Benimle gelir misin?\"",
    steps: [
      { city: "bukhara", text: "Buhara'nın yaşlı mezarcısı hatırladı: \"O baskında ölenleri şehrin dışına, kervan yolunun kenarına gömdük. Ama şimdi o tarlayı bir bey sahiplenmiş, mezar taşlarını sökmüş.\"", btn: "Beyin konağına git" },
      { city: "bukhara", text: "Bey, sökülen taşlarla ahırını örmüş. Ayşe titriyor: \"Ne yapacağız?\"", choices: [
        { label: "Taşları satın al (300 altın)", text: "Bey parayı aldı, taşlar yerine kondu. Ayşe annesinin başında saatlerce ağladı, sonra ilk kez gülümsedi.", bond: 25, fx: { gold: -300, renown: 3 } },
        { label: "Beyi kurultaya şikâyet et", text: "Töre açıktı: ölünün taşına dokunulmaz. Bey taşları yerine koymak ve ceza ödemek zorunda kaldı.", bond: 20, fx: { kut: 4, renown: 5 } },
        { label: "Taşları zorla geri al", text: "Beyin adamlarını dağıttın ve taşları geri dikti. Ayşe minnettar ama şiddetten ürktü.", bond: 10, fx: { renown: 6 }, fight: (lv) => A(6 + lv, 3 + lv, 2 + Math.floor(lv / 2)) },
      ] },
    ],
    sworn: "Ayşe artık yalnızca kız kardeşin değil, ruhunun yarısı. Şifası iki kat güçlü.",
  },
  korkut: {
    id: "korkut",
    title: "Kayıp Kopuz",
    offer: "Derviş Korkut kopuzunun tellerini okşadı: \"Bu kopuz ustamındı. Onun ustasınınki ise Merv'de bir hazine avcısının elinde. O kopuzla söylenen destan, ölüleri bile ağlatır derler.\"",
    steps: [
      { city: "merv", text: "Merv çarşısında hazine avcısı Tahir bulundu. \"Kopuz mu? Onu Nişabur'daki bir tüccara sattım, gümüş tellerini sökmüş olmasın!\"", btn: "Nişabur'a yola çık" },
      { city: "nishapur", text: "Tüccar kopuzu duvarına asmış, satmaya niyeti yok. Korkut'un gözleri dolu.", choices: [
        { label: "Bir türkü yarışı teklif et", text: "Korkut kopuzuyla öyle bir destan söyledi ki tüccar ağladı ve kopuzu kendi eliyle verdi.", bond: 25, fx: { renown: 8, xp: 120 } },
        { label: "Kopuzu satın al (450 altın)", text: "Tüccar pazarlığı sevdi ama sonunda razı oldu. Korkut kopuzu göğsüne bastırdı.", bond: 20, fx: { gold: -450, renown: 4 } },
      ] },
    ],
    sworn: "Ustasının kopuzuyla Korkut'un sözleri artık daha derine işliyor. Tecrübe ve ordu bonusu %50 arttı.",
  },
  ferhat: {
    id: "ferhat",
    title: "Ak Bozkurt",
    offer: "Ferhat yere çömelip bir iz gösterdi: \"Bu, kurtlar arasında büyüdüğüm sürünün başbuğu Ak Bozkurt'un izi. Peşinde avcılar var. Onu kurtarmalıyım.\"",
    steps: [
      { city: "kashgar", text: "Kaşgar'da avcıların, beyaz bir kurt postu için yüz altın ödül koyan bir tüccara çalıştığını öğrendin. Avcılar dağ yolunda kamp kurmuş.", btn: "Avcıların izini sür" },
      { city: "kashgar", text: "Kamp önünde: kafeste yaralı Ak Bozkurt, çevresinde silahlı avcılar.", choices: [
        { label: "Kampa saldır", text: "Avcıları dağıttın. Ferhat kafesi açtı; Ak Bozkurt ona baktı, uludu ve dağlara koştu.", bond: 25, fx: { renown: 8, xp: 160 }, fight: (lv) => A(4 + lv, 8 + lv, 3 + Math.floor(lv / 2)) },
        { label: "Avcılara ödülden fazlasını öde (250 altın)", text: "Avcılar parayı alıp gitti. Ferhat kurdu serbest bıraktı; kan dökülmediği için sessizce teşekkür etti.", bond: 18, fx: { gold: -250, kut: 2 } },
      ] },
    ],
    sworn: "Ferhat'ın izciliği artık bir kurt sürüsünün gözleriyle bakıyor. Hız ve görüş %50 arttı.",
  },
  batu: {
    id: "batu",
    title: "Sancağın Lekesi",
    offer: "Batu kılıcını bileyledi: \"Beni ordudan korkaklıkla suçlayarak kovdular. Asıl kaçan, beni suçlayan Togan Tarkan'dı. Şimdi Rey'de muhafız başı. Adımı temize çıkarmak istiyorum.\"",
    steps: [
      { city: "rey", text: "Rey'de eski askerlerden biri konuştu: \"O gün Togan kaçtı, Batu geride kalıp yaralıları taşıdı. Ama kimse Togan'a karşı tanıklık etmeye cesaret edemez.\"", btn: "Togan'la yüzleş" },
      { city: "rey", text: "Togan Tarkan muhafızlarıyla karşında. Batu dişlerini sıkıyor.", choices: [
        { label: "Teke tek dövüş iste", text: "Batu, Togan'ı herkesin önünde yere serdi ama canını bağışladı. Askerler onun adını yeniden saygıyla anıyor.", bond: 25, fx: { renown: 10, xp: 180 }, fight: (lv) => A(10 + lv * 2, 4 + lv, 4 + lv) },
        { label: "Tanıkları kurultaya götür", text: "Tanıklar konuştu, Togan rütbesini yitirdi. Batu kılıcını kınına soktu: \"Adalet kılıçtan keskin.\"", bond: 15, fx: { kut: 4, renown: 6 } },
      ] },
    ],
    sworn: "Batu'nun onuru geri döndü; savaşta yanında olmak askerlerine yürek veriyor. Saldırı ve ordu bonusu %50 arttı.",
  },
  leyla: {
    id: "leyla",
    title: "Babamın Borcu",
    offer: "Leyla defterini kapattı: \"Babamın dükkânını borç yüzünden Tebriz'in tefecisi aldı. Ama o borç sahte senetle yazıldı. Kanıtı Konya'daki ortağında.\"",
    steps: [
      { city: "konya", text: "Konya'da babasının eski ortağı titrek elleriyle gerçek senedi çıkardı: \"Korktum, kimseye gösteremedim.\"", btn: "Senedi Tebriz'e götür" },
      { city: "tabriz", text: "Tefeci kadı huzurunda. Elinde sahte senet, yanında kiralık adamları.", choices: [
        { label: "Senedi kadıya sun", text: "Kadı sahteliği gördü; dükkân Leyla'ya döndü, tefeci zindanı boyladı. Leyla ilk kez babasının tezgâhında durdu.", bond: 25, fx: { gold: 200, renown: 6, kut: 2 } },
        { label: "Tefecinin adamlarını dağıt", text: "Kiralık kılıçlar kaçtı, tefeci dükkânın anahtarını kendi eliyle verdi. Leyla memnun ama çarşıda dedikodu başladı.", bond: 15, fx: { gold: 300, wanted: 1 }, fight: (lv) => A(8 + lv, 4 + lv, 2) },
      ] },
    ],
    sworn: "Leyla'nın dükkânı artık senin kervanlarının da ambarı. Ticaret ve yük bonusu %50 arttı.",
  },
  lucia: {
    id: "lucia",
    title: "Venedik Mührü",
    offer: "Lucia altın bir mühür gösterdi: \"Bu, Venedik konseyinin mührü. Onu Konstantiniyye'ye ulaştırırsam Doğu'da serbest ticaret izni alacağız. Ama Ceneviz casusları peşimde.\"",
    steps: [
      { city: "tabriz", text: "Tebriz hanında Cenevizli casus seni bekliyordu: \"Mührü bize ver, iki katını öderiz.\" Lucia başını iki yana salladı.", btn: "Yola devam" },
      { city: "constantinople", text: "Galata kapısında Ceneviz muhafızları yolu kesti.", choices: [
        { label: "Kapıyı zorla geç", text: "Muhafızları dağıttın, mühür konseye ulaştı. Lucia seni Venedik'in fahri tüccarı ilan ettirdi.", bond: 25, fx: { renown: 10, gold: 400 }, fight: (lv) => A(8 + lv * 2, 6 + lv, 2 + lv) },
        { label: "Bizans muhafızlarına rüşvet ver (300 altın)", text: "Gizli bir kapıdan geçtiniz. Lucia mührü teslim etti ve sana göz kırptı: \"Doğu'yu iyi biliyorsun.\"", bond: 20, fx: { gold: -300, renown: 6 } },
      ] },
    ],
    sworn: "Venedik ticaret izniyle Lucia'nın bağlantıları artık senin de. Ticaret ve yük bonusu %50 arttı.",
  },
};

export type FireBuffKind = "trade" | "wage" | "mercy" | "fear" | "sea";

export interface Campfire {
  id: string;
  a: CompId;
  b: CompId;
  lines: [CompId, string][];
  sideA: string;
  sideB: string;
  /** Yanında durunca dünya etkisi (3 gün). */
  buffA?: FireBuffKind;
  buffB?: FireBuffKind;
}

/** Gece kamp ateşi başında iki yoldaşın konuşması; kimin yanında durduğun bağlarını değiştirir. */
export const CAMPFIRES: Campfire[] = [
  { id: "korkut-ayse", a: "korkut", b: "ayse", lines: [
    ["korkut", "Kopuzun teli gevşemiş. Bu bozkır her şeyi gevşetir; teli de, yemini de."],
    ["ayse", "Yemini gevşeten bozkır değil Dede, insanın kendisi. Ben tutsakken kimse yeminini hatırlamadı."],
    ["korkut", "Hatırlayan biri vardı ama kızım. Şimdi yanında oturuyor."],
  ], sideA: "Dede haklı: yemin sözle değil yolla tutulur", sideB: "Ayşe haklı: unutulanları unutmamalıyız" },
  { id: "batu-ayse", a: "batu", b: "ayse", lines: [
    ["batu", "Dünkü köyü yaksaydık haramiler bir daha oraya sığınamazdı."],
    ["ayse", "Köylüler de sığınamazdı Batu. Ateşle temizlenen yerde ekmek de pişmez."],
    ["batu", "Merhametle de kılıç bilenmez."],
  ], sideA: "Batu: korku düzen getirir", sideB: "Ayşe: halk yanımızda olmalı", buffA: "fear", buffB: "mercy" },
  { id: "ferhat-batu", a: "ferhat", b: "batu", lines: [
    ["ferhat", "Bugün bir kurt izi gördüm; dişi, yavrulu. Avlamadım."],
    ["batu", "Yavrular büyür, sürüye katılır, bir gün atlarımızı yer."],
    ["ferhat", "Bozkırın da hakkı var Batu. Hepsini alırsan geriye ne kalır?"],
  ], sideA: "Ferhat: av ölçüyle yapılır", sideB: "Batu: tehlikeyi kökünden kes" },
  { id: "leyla-lucia", a: "leyla", b: "lucia", lines: [
    ["leyla", "Venedikliler ipeği bizden üç akçeye alıp kendi limanlarında otuza satıyor."],
    ["lucia", "Gemiyi, fırtınayı, korsanı da biz göğüslüyoruz tatlım. Deniz bedava değil."],
    ["leyla", "Kervan yolu da bedava değil. Kumda ölen develeri sen saymadın."],
  ], sideA: "Leyla: kâr kervanında kalmalı", sideB: "Lucia: deniz yolu ortaklık ister", buffA: "trade", buffB: "sea" },
  { id: "korkut-batu", a: "korkut", b: "batu", lines: [
    ["batu", "Dede, destanlarında hep kılıçlar konuşuyor. Ama sen hiç kılıç tutmadın."],
    ["korkut", "Kılıcı tutan unutulur oğul, onu anlatan kalır. Senin adını da biri söyleyecek, değil mi?"],
    ["batu", "Söylesin. Ama ben yaşarken söylesin."],
  ], sideA: "Korkut: söz kılıçtan uzun yaşar", sideB: "Batu: şan meydanda kazanılır" },
  { id: "leyla-batu", a: "leyla", b: "batu", lines: [
    ["leyla", "Askerlerin ganimet payı hazineyi kurutuyor. Biraz kısalım."],
    ["batu", "Payını alamayan asker ilk pusuda kaçar. Altını sen say, kılıcı ben."],
  ], sideA: "Leyla: hazine önce", sideB: "Batu: asker önce", buffA: "trade", buffB: "wage" },
  { id: "ayse-ferhat", a: "ayse", b: "ferhat", lines: [
    ["ferhat", "Ayşe, sen o geceyi hiç anlatmıyorsun. Kara Tamga'nın elinden nasıl kurtuldun?"],
    ["ayse", "Anlatmıyorum çünkü anlatınca yeniden yaşıyorum. Sen avını anlatır mısın, ölürken nasıl baktığını?"],
    ["ferhat", "…Haklısın. Bir daha sormam."],
  ], sideA: "Ferhat merak etti, kötü niyeti yoktu", sideB: "Ayşe'nin sessizliğine saygı duy" },
  { id: "korkut-lucia", a: "korkut", b: "lucia", lines: [
    ["lucia", "Sizin destanlarınızda hiç deniz yok, Dede."],
    ["korkut", "Bizim denizimiz bozkırdır kızım. Dalgası rüzgârla gelir, boğulan da olur."],
    ["lucia", "O zaman ben de bozkırın denizcisiyim."],
  ], sideA: "Dede'nin bozkır denizi", sideB: "Lucia'nın gerçek denizi" },
  { id: "ferhat-leyla", a: "ferhat", b: "leyla", lines: [
    ["leyla", "İz sürdüğün yerde mal bırakılmaz Ferhat. Kervan izi para eder."],
    ["ferhat", "İz para etmez. İz, yarın kimin aç kalacağını söyler."],
    ["leyla", "O zaman ikimiz de doğru konuşuyoruz; sen açlığı, ben keseyi sayıyoruz."],
  ], sideA: "Ferhat: iz yaşamdır", sideB: "Leyla: iz ticarettir" },
  { id: "ayse-lucia", a: "ayse", b: "lucia", lines: [
    ["lucia", "Venedik'te şifacılar ücret alır. Sen neden bedava sarıyorsun?"],
    ["ayse", "Çünkü bir gün ben de yara içindeydim ve kimse ücret sormadı."],
    ["lucia", "…O zaman bir kese ot alayım, sen de bir gece dinlen."],
  ], sideA: "Ayşe: şifa borç olmaz", sideB: "Lucia: karşılık da saygı" },
  { id: "korkut-ferhat", a: "korkut", b: "ferhat", lines: [
    ["korkut", "Kurtla büyüyen çocuk destanda hep yalnız kalır. Sen de mi öyle?"],
    ["ferhat", "Yalnız değilim Dede. Sürü başka türlü bağlar."],
    ["korkut", "O zaman anlat; belki kopuz da o bağı öğrenir."],
  ], sideA: "Korkut: sözle bağ kur", sideB: "Ferhat: sürü yeter" },
  { id: "batu-lucia", a: "batu", b: "lucia", lines: [
    ["batu", "Denizci kadın kılıç tutmaz derlerdi. Sen tutuyorsun."],
    ["lucia", "Kılıç tutmayan gemi batırır Batu. Ben ikisini de öğrendim."],
    ["batu", "O zaman yarın ön safta yerin hazır."],
  ], sideA: "Batu: ön saf senin", sideB: "Lucia: gemide kalırım" },
  { id: "ayse-leyla", a: "ayse", b: "leyla", lines: [
    ["leyla", "Şifanın da fiyatı olmalı. Yoksa her yaralı kapına gelir."],
    ["ayse", "Gelsin. Kapım açıksa kapıdır."],
    ["leyla", "Senin kapın, benim defterim. İkimiz de tutuyoruz bir şeyleri."],
  ], sideA: "Ayşe: kapı açık kalsın", sideB: "Leyla: defter de tutulsun" },
];

/** Tek yoldaş veya kamp ateşi havuzu boşken gece anısı. */
export const PARTY_MEMORIES: Record<CompId, { id: string; title: string; text: string; bond: number }[]> = {
  ayse: [
    { id: "ayse-anne", title: "Annemizin ninnişi", text: "Ayşe ateşe bakarak mırıldandı: \"Annemiz kaçmadan önce hep aynı ninniyi söylerdi. Bazen rüzgârda duyuyorum.\"", bond: 3 },
    { id: "ayse-yara", title: "Eski yara", text: "Ayşe omzundaki kara damgaya dokundu: \"İyileşiyor. Ama soğuk gecelerde yine acıyor. Yanımda kalman yetiyor.\"", bond: 4 },
  ],
  korkut: [
    { id: "korkut-kopuz", title: "Kopuzun rüyası", text: "Korkut telleri okşadı: \"Bu gece rüyamda Ötüken'i gördüm. Adın orada yazılıydı — henüz bitmemiş bir destanın ilk satırı.\"", bond: 3 },
    { id: "korkut-sus", title: "Sessizlik", text: "Korkut uzun süre konuşmadı. Sonra: \"Bazen en iyi türkü, ateşin çıtırtısıdır.\"", bond: 2 },
  ],
  ferhat: [
    { id: "ferhat-iz", title: "Gece izi", text: "Ferhat külleri üfledi: \"Kuzeyden kurt geçti. Aç değil — yavrulu. Yarın yolumuzu kesmez.\"", bond: 3 },
    { id: "ferhat-yildiz", title: "Yıldız okuma", text: "Ferhat göğe baktı: \"Üç yıldız yan yana. Eskiden sürü bu gece göç ederdi. Biz de sabah erken kalkalım.\"", bond: 2 },
  ],
  batu: [
    { id: "batu-kilic", title: "Biley taşı", text: "Batu kılıcını bileledi: \"Yarın birileri ölecek. Biley taşı dürüsttür; yalan söylemez.\"", bond: 2 },
    { id: "batu-eski", title: "Eski yüzbaşı", text: "Batu gülümsedi: \"Hakan ordusunda böyle gecelerde nöbetçi uyurdu. Ben uyumazdım. Hâlâ uyumuyorum.\"", bond: 3 },
  ],
  leyla: [
    { id: "leyla-hesap", title: "Gece defteri", text: "Leyla defterini kapadı: \"Bugün üç akçe kâr, iki akçe risk. Sen riski seviyorsun; ben kârı. İkimiz de lazımız.\"", bond: 3 },
    { id: "leyla-carsi", title: "Çarşı kokusu", text: "Leyla: \"Bu ateşte baharat yok ama yine de çarşıyı özledim. Yarın bir şehirde fiyat sorarız.\"", bond: 2 },
  ],
  lucia: [
    { id: "lucia-dalga", title: "Kara deniz", text: "Lucia: \"Bozkırda dalga yok diyorsunuz. Rüzgâr var ya — o da bir deniz. Yalnızca tuz eksik.\"", bond: 3 },
    { id: "lucia-mektup", title: "Venedik mektubu", text: "Lucia bir mektubu ateşe yaklaştırdı ama yakmadı: \"Annem yazmış. 'Doğu'da kaybolma' diyor. Kaybolmadım — bulundum.\"", bond: 4 },
  ],
};
