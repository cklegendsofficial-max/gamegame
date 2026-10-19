import type { Army } from "./data";
import type { Stat } from "./rpg";
import type { SeasonId } from "./seasons";
import type { CompId } from "./story";

export interface RoadFx {
  gold?: number;
  food?: number;
  /** maks. canın oranı */
  hp?: number;
  /** yükün oranı kadar kayıp */
  cargo?: number;
  /** rastgele mal kazancı */
  good?: number;
  units?: Partial<Army>;
  renown?: number;
  kut?: number;
  xp?: number;
  wanted?: number;
}

export interface RoadOpt {
  label: string;
  cost?: { gold?: number; food?: number };
  check?: { stat: Stat; dc: number };
  ok: RoadFx & { text: string };
  fail?: RoadFx & { text: string };
  fight?: { army: Army; bonus: number; foe: string };
  /** Bu seçenek yoldaş becerisiyle açıldıysa rozet için. */
  comp?: CompId;
}

export interface RoadCtx {
  season: SeasonId;
  night: boolean;
  cargo: number;
  army: number;
  lv: number;
  /** Ana destan peşindeyken yol olayları sıklaşır / özel olaylar açılır. */
  onQuest?: boolean;
  act?: 1 | 2 | 3;
  /** Yanındaki yoldaşlar — yol olaylarını renklendirir. */
  comps: CompId[];
  /** Yakındaki şehir kimliği (en yakın şehir ~900 birim içindeyse). */
  city?: string;
  /** Yanında yürüyen muhafız yoldaş. */
  escort?: CompId;
}

export interface RoadEvent {
  id: string;
  title: string;
  icon: string;
  text: string;
  when?: (c: RoadCtx) => boolean;
  opts: (c: RoadCtx) => RoadOpt[];
}

export const ROAD_STEP = 620;
export const ROAD_CHANCE = 0.48;
export const ROAD_PER_DAY = 4;

export function checkChance(stat: number, dc: number): number {
  return Math.max(0.15, Math.min(0.9, stat / (stat + dc * 0.35)));
}

const a = (spear: number, archer: number, horse: number): Army => ({ spear, archer, horse });

export const ROAD_EVENTS: RoadEvent[] = [
  // ---- Bölgesel olaylar: yalnızca ilgili şehrin çevresinde çıkar ----
  {
    id: "r_konya_sema",
    title: "Semazenler",
    icon: "cities/konya",
    text: "Konya'nın kapısında beyaz giysili dervişler yavaşça dönüyor. Ney sesi bozkırın rüzgârına karışıyor.",
    when: (c) => c.city === "konya",
    opts: () => [
      { label: "Sessizce izle", ok: { text: "Bir saat durup dinledin. Zihnin durulmuş, adımların hafiflemiş.", xp: 14, kut: 2 } },
      { label: "Tekkeye bağış bırak", cost: { gold: 25 }, ok: { text: "Şeyh elini göğsüne koydu: \"Yolun açık olsun.\" Sofrada sıcak çorba çıktı.", renown: 3, kut: 2, hp: 0.15 } },
    ],
  },
  {
    id: "r_bizans_gumruk",
    title: "Gümrük Memuru",
    icon: "cities/constantinople",
    text: "Kostantiniyye surlarının dibinde bir memur defterini açtı: \"Kervan vergisi, yabancı. Mühürlü belgen var mı?\"",
    when: (c) => c.city === "constantinople" && c.cargo > 0,
    opts: (c) => [
      { label: "Vergiyi öde", cost: { gold: 30 + c.lv * 4 }, ok: { text: "Mühür vuruldu. Surların gölgesinde rahatça geçtin.", xp: 8 } },
      { label: "Pazarlık et", check: { stat: "kar", dc: 11 }, ok: { text: "Memuru güldürdün; vergi yarıya indi, üstüne bir de çay ikram etti.", gold: 20, xp: 18 }, fail: { text: "Memur kaşlarını çattı; yükün bir kısmına el konuldu.", cargo: 0.12 } },
    ],
  },
  {
    id: "r_kashgar_yesim",
    title: "Yeşim Satıcısı",
    icon: "jade",
    text: "Kaşgar yolunda bir satıcı, çuvalından süt rengi bir yeşim çıkardı. \"Kunlun'dan, efendi. Şans getirir.\"",
    when: (c) => c.city === "kashgar",
    opts: () => [
      { label: "Satın al", cost: { gold: 50 }, check: { stat: "kar", dc: 9 }, ok: { text: "Taş gerçekmiş! Bir tüccar yarın iki katına alacak.", good: 2, renown: 1, xp: 14 }, fail: { text: "Camdan farksız çıktı. Satıcı çoktan ortadan kaybolmuş.", xp: 4 } },
      { label: "Geç", ok: { text: "Satıcı omuz silkti. \"Başka kervan gelir.\"" } },
    ],
  },
  {
    id: "r_buhara_kagit",
    title: "Kâğıt Ustası",
    icon: "cities/bukhara",
    text: "Buhara'nın dış mahallesinde bir usta, taze kâğıtları ipe asmış kurutuyor. \"Semerkant kâğıdı değil bu; ama onun ağabeyi.\"",
    when: (c) => c.city === "bukhara" || c.city === "samarkand",
    opts: () => [
      { label: "Ustayı dinle", ok: { text: "Kâğıdın sırrını anlattı: çiğ pamuk, pirinç suyu, sabır. Bir şey öğrendin.", xp: 22 } },
      { label: "Bir deste satın al", cost: { gold: 20 }, ok: { text: "Defterin sayfaları hazır; yoldaşlar bile tarih tutmak istiyor.", kut: 2, renown: 1 } },
    ],
  },
  {
    id: "r_merv_kanal",
    title: "Kurumuş Kanal",
    icon: "map/oasis",
    text: "Merv'in tarlalarını besleyen kanal çatlamış; köylüler çamurlu elleriyle sana bakıyor.",
    when: (c) => c.city === "merv",
    opts: (c) => [
      { label: "Kanalı onarmalarına yardım et", check: { stat: "guc", dc: 9 }, ok: { text: "Birlikte taş taşıdınız; su yeniden aktı. Köylüler sana yiyecek yükledi.", food: 40, renown: 3, kut: 2, xp: 20 }, fail: { text: "Taşlar kaydı; yarın yeniden denenecek. Yine de iyi niyetin hatırlandı.", hp: -0.1, renown: 1 } },
      { label: "Yoluna devam et", ok: { text: c.army > 20 ? "Büyük birliğin ağır adımları toz kaldırdı; köylüler sessizce izledi." : "Köylülerin bakışları omzunda yolculuk ettin.", kut: -1 } },
    ],
  },
  {
    id: "r_tebriz_hali",
    title: "Halı Dokuyucuları",
    icon: "carpets",
    text: "Tebriz yakınında bir köy halkı dokuduğu halıları yola sermiş, güneşte kurutuyor. Renkler gözü alıyor.",
    when: (c) => c.city === "tabriz",
    opts: () => [
      { label: "Toptan al, kervana yükle", cost: { gold: 60 }, ok: { text: "Halılar develerin sırtında gül bahçesi gibi duruyor. Başka pazarda iyi para eder.", good: 3, xp: 10 } },
      { label: "Desen öğren", ok: { text: "Yaşlı dokuyucu düğümlerin dilini anlattı: her renk bir dua, her desen bir yol.", xp: 16, kut: 1 } },
    ],
  },
  {
    id: "r_nisabur_firuze",
    title: "Firuze Ocağı",
    icon: "cities/nishapur",
    text: "Nişabur dağlarında bir madenci, avucunda gök mavisi bir taş tutuyor. \"Ocaktan yeni çıktı. Cebini bana göster.\"",
    when: (c) => c.city === "nishapur",
    opts: () => [
      { label: "Pazarlıkla al", check: { stat: "kar", dc: 10 }, cost: { gold: 35 }, ok: { text: "Taşı sakladın; Rey'de bir kuyumcu iyi para verecek.", gold: 90, xp: 15 }, fail: { text: "Taş soluk çıktı. Madenci gülümseyip uzaklaştı.", xp: 5 } },
      { label: "Madene bak", ok: { text: "Karanlık galeride gözlerini alıştırdın; ustalar sana güvenmeye başladı.", xp: 12, renown: 1 } },
    ],
  },
  {
    id: "r_rey_hekim",
    title: "Gezgin Hekim",
    icon: "healer",
    text: "Rey yolunda otlarla dolu torbasını sırtlamış yaşlı bir hekim, yarana bakıp başını salladı.",
    when: (c) => c.city === "rey",
    opts: () => [
      { label: "Tedaviyi kabul et", cost: { gold: 15 }, ok: { text: "Merhem sürüldü, ot çayı içirildi. Yorgunluk kemiklerinden süzüldü.", hp: 0.35, xp: 6 } },
      { label: "Otları sor", check: { stat: "day", dc: 8 }, ok: { text: "Hangi otun kanı durdurduğunu öğrendin. Torbana bir avuç girdi.", hp: 0.12, xp: 18 }, fail: { text: "Karıştırdın; çayın tadı kötü ama zarar vermedi.", xp: 5 } },
    ],
  },  {
    id: "teker",
    title: "Kırık Dingil",
    icon: "j_caravan",
    text: "Taşlı bir yokuşta arabanın dingili çatırdayarak kırıldı. Yükler yola saçıldı, develer huysuzlanıyor.",
    when: (c) => c.cargo > 0,
    opts: () => [
      { label: "Dingili kendin onar", check: { stat: "guc", dc: 9 }, ok: { text: "Kollarını sıvadın, kırık dingili sırımla sardın. Kervan yoluna devam ediyor.", xp: 15 }, fail: { text: "Dingil elinde ikiye ayrıldı. Yükün bir kısmını yol kenarında bırakmak zorunda kaldın.", cargo: 0.25 } },
      { label: "Yükü hafiflet", ok: { text: "En ağır balyaları bıraktın. Kervan hafifledi ama keselerin de.", cargo: 0.15 } },
    ],
  },
  {
    id: "kuyu",
    title: "Kuyu Başında Yolcu",
    icon: "map/oasis",
    text: "Kurumuş bir kuyunun başında yaşlı bir yolcu, dudakları çatlamış, sana bakıyor.",
    opts: () => [
      { label: "Azığını paylaş", cost: { food: 15 }, ok: { text: "Yaşlı adam suyu içti, gözleri doldu: \"Tengri yolunu açık etsin.\" Kervandakiler bu cömertliği konuşuyor.", renown: 3, kut: 2, xp: 10 } },
      { label: "Yoluna devam et", ok: { text: "Arkana bakmadan yürüdün. Rüzgâr bir süre boyunca sessiz kaldı." } },
    ],
  },
  {
    id: "kum",
    title: "Kum Duvarı",
    icon: "map/oasis",
    text: "Ufukta kızıl bir duvar yükseliyor. Kum fırtınası birkaç dakika içinde kervanı yutacak.",
    when: (c) => c.season === "yaz" || c.season === "guz",
    opts: () => [
      { label: "Hızla geç", check: { stat: "cev", dc: 9 }, ok: { text: "Atları kamçıladın; fırtınanın kuyruğundan sıyrılıp kurtuldun.", xp: 15 }, fail: { text: "Fırtına yakaladı. Gözler kum dolu, birkaç çuval savruldu.", hp: -0.2, food: -25 } },
      { label: "Develeri çöktür, siper al", ok: { text: "Develerin arkasına sığındınız. Fırtına uğuldayarak geçti; hepiniz yorgun ama sağsınız.", hp: -0.08 } },
    ],
  },
  {
    id: "kurt",
    title: "Kurt Sürüsü",
    icon: "j_bandit",
    text: "Karanlıkta yeşil gözler parladı. Aç bir kurt sürüsü kervanın etrafında daire çiziyor.",
    when: (c) => c.night || c.season === "kis",
    opts: (c) => {
      const opts: RoadOpt[] = [
        { label: "Kılıcını çek", check: { stat: "guc", dc: 10 }, ok: { text: "Sürü başını yere serdin; ötekiler karanlığa dağıldı. Postları değerli.", good: 2, xp: 25, renown: 2 }, fail: { text: "Kurtlar saldırdı. Onları kovdun ama kolunda derin dişler var.", hp: -0.22 } },
        { label: "Ateş yak, bekle", cost: { food: 20 }, ok: { text: "Bütün gece ateşi besledin. Şafakla birlikte sürü çekildi." } },
        { label: "Kurt Tengri'nin elçisidir, et at", cost: { food: 30 }, ok: { text: "Sürüye bir koyun bıraktın. Yaşlı dişi kurt başını eğip uzaklaştı. Kam olsa \"iyi alamet\" derdi.", kut: 3 } },
      ];
      if (c.comps.includes("ferhat")) {
        opts.unshift({
          label: "Ferhat iz sürsün",
          comp: "ferhat",
          cost: { food: 15 },
          ok: { text: "Ferhat rüzgârı okudu, sürüye bir koyun bıraktırdı. Kurtlar uzaklaşırken: \"Bu gece av bizim değil.\" Post yerine saygı kazandın.", xp: 18, kut: 2, renown: 1 },
        });
      }
      return opts;
    },
  },
  {
    id: "yarali",
    title: "Yaralı Atlı",
    icon: "u_cavalry",
    text: "Yol kenarında oku kanayan bir atlı yatıyor. Atı başında bekliyor. \"Haramiler...\" diye fısıldıyor.",
    opts: () => [
      { label: "Yarasını sar", cost: { food: 10 }, check: { stat: "kar", dc: 7 }, ok: { text: "Atlı ayağa kalktı, kılıcını sana uzattı: \"Bu can senin.\" Birliğine katıldı.", units: { horse: 1 }, kut: 1 }, fail: { text: "Elinden geleni yaptın ama atlı şafak sökmeden göçtü. Atını ve adını yanına aldın.", renown: 2 } },
      { label: "Atını ve kesesini al", ok: { text: "Kesede bir avuç gümüş vardı. Kervandakiler gözlerini kaçırıyor.", gold: 45, kut: -3 } },
      { label: "Geç", ok: { text: "Yolun kenarında bir kartal dönüp duruyor." } },
    ],
  },
  {
    id: "harac",
    title: "Yol Haracı",
    icon: "j_bandit",
    text: "Dar bir geçitte silahlı adamlar yolu kesti. \"Bu yol bizim beyimizin, geçmek isteyen haraç öder.\"",
    when: (c) => c.cargo > 0 || c.army > 0,
    opts: (c) => {
      const fee = 40 + c.lv * 8;
      const n = 4 + Math.round(c.lv * 0.7);
      return [
        { label: `Haracı öde`, cost: { gold: fee }, ok: { text: "Altınları saydın, adamlar kenara çekildi. Bir gün bu yol senin olacak." } },
        { label: "Pazarlık et", check: { stat: "kar", dc: 9 }, ok: { text: "Beylerinin adını sordun, kendi tuğunu anlattın. Haraççılar eğilip yolu açtı, bir kuruş almadan.", renown: 2 }, fail: { text: "Sözlerin işe yaramadı; iki katını ödedin.", gold: -fee * 2 } },
        { label: "Kılıçla geç", fight: { army: a(Math.ceil(n * 0.5), Math.ceil(n * 0.3), Math.ceil(n * 0.2)), bonus: 0, foe: "Haraççılar" }, ok: { text: "Geçit artık açık. Haraççıların kesesi de senin.", gold: fee, renown: 3 }, fail: { text: "Geri püskürtüldün." } },
      ];
    },
  },
  {
    id: "dervis",
    title: "Gezgin Derviş",
    icon: "healer",
    text: "Eski hırkalı bir derviş ateşinin başına davet ediyor. \"Yol uzun, söz kısa; otur da dinle.\"",
    opts: (c) => {
      const opts: RoadOpt[] = [
        { label: "Otur, dinle", ok: { text: "Derviş gece boyu Horasan erenlerini, Yesevi'nin hikmetlerini anlattı. Sabah zihnin berrak.", xp: 40 } },
        { label: "Sadaka ver", cost: { gold: 25 }, ok: { text: "Derviş elini başına koydu, dua etti. Yorgunluğun bir anda geçti.", hp: 0.5, kut: 2 } },
      ];
      if (c.comps.includes("korkut")) {
        opts.unshift({
          label: "Korkut'u konuştur",
          comp: "korkut",
          ok: { text: "Dede kopuzunu indirdi; dervişle sırayla destan okudular. Ateşin etrafında askerler bile nefesini tuttu.", xp: 55, kut: 3, renown: 2 },
        });
      }
      return opts;
    },
  },
  {
    id: "terk",
    title: "Terk Edilmiş Kervan",
    icon: "j_caravan",
    text: "Yağmalanmış bir kervanın enkazı. Develer ölmüş, ama bazı balyalar hâlâ sağlam görünüyor.",
    opts: () => [
      { label: "Balyaları topla", check: { stat: "cev", dc: 8 }, ok: { text: "Haramiler acele etmiş; geride değerli mallar kalmış.", good: 3 }, fail: { text: "Haramiler pusudaymış! Ok yağmurunun altında birkaç balya kapıp kaçtın.", good: 1, hp: -0.15 } },
      { label: "Kervancıları göm", ok: { text: "Ölüleri töreye uygun gömdün, kurganlarına birer taş koydun. Adın kervan yollarında hayırla anılacak.", renown: 3, kut: 2 } },
    ],
  },
  {
    id: "kacak",
    title: "Kaçak Köleler",
    icon: "heroes/slave",
    text: "Sazlıkta saklanan bir avuç kaçak köle. Zincir izleri bileklerinde taze. Peşlerinde köle tacirlerinin atlıları var.",
    opts: () => [
      { label: "Onları sakla, birliğine al", cost: { food: 20 }, ok: { text: "Bir zamanlar senin de bileklerinde zincir vardı. Kaçaklar sana yemin etti.", units: { spear: 3 }, kut: 3 } },
      { label: "Tacirlere teslim et", ok: { text: "Tacirler kese dolusu altın saydı. Kaçakların bakışı uzun süre aklından çıkmayacak.", gold: 90, kut: -5 } },
      { label: "Görmezden gel", ok: { text: "Sazlığın yanından sessizce geçtin." } },
    ],
  },
  {
    id: "senlik",
    title: "Yayla Şenliği",
    icon: "map/yurts",
    text: "Bir obada şenlik var: güreş, at yarışı, kımız. Bey çağırıyor: \"Misafir, bir güreş tutmaz mısın?\"",
    when: (c) => c.season === "bahar" || c.season === "yaz",
    opts: () => [
      { label: "Kispeti giy, güreş", check: { stat: "guc", dc: 10 }, ok: { text: "Obanın pehlivanını sırtüstü yere serdin! Bey ödülünü ve bir kese altın verdi.", gold: 70, renown: 5, xp: 20 }, fail: { text: "Pehlivan seni bir çırpıda yere serdi. Gülüşmeler arasında kalkıp elini sıktın.", hp: -0.1, renown: 1 } },
      { label: "At yarışına gir", check: { stat: "cev", dc: 10 }, ok: { text: "Atın rüzgâr gibi uçtu, ilk sen vardın. Ödül: iki tay ve şan.", units: { horse: 2 }, renown: 3 }, fail: { text: "Sonuncu geldin ama obanın kızları sana el salladı.", renown: 1 } },
      { label: "Kımız iç, dinlen", ok: { text: "Gece boyu kopuz çaldı, kımız aktı. Sabah dinç uyandın.", hp: 0.35, food: 30 } },
    ],
  },
  {
    id: "zar",
    title: "Kervansaray Kumarı",
    icon: "coins",
    text: "Bir kervansarayın avlusunda tüccarlar aşık kemiğiyle oynuyor. \"Gel yiğit, şansını dene!\"",
    opts: (c) => {
      const opts: RoadOpt[] = [
        { label: "60 altın koy", cost: { gold: 60 }, check: { stat: "cev", dc: 12 }, ok: { text: "Aşıklar \"at\" geldi! Tüccarlar homurdanarak keseyi uzattı.", gold: 150 }, fail: { text: "Aşık \"tava\" düştü. Altınlar başka keseye gitti." } },
        { label: "Seyret", ok: { text: "Kimin hile yaptığını izledin. Bir dahakine sen de bilirsin.", xp: 8 } },
      ];
      if (c.comps.includes("leyla")) {
        opts.unshift({
          label: "Leyla masayı okusun",
          comp: "leyla",
          check: { stat: "kar", dc: 8 },
          ok: { text: "Leyla zarın ağırlığını elinde tarttı: \"Bu masa hileli.\" Tüccarlar utançla kenara çekildi; sen de birkaç akçe kazandın.", gold: 35, xp: 12 },
          fail: { text: "Leyla yanıldı — ya da masayı bilerek bırakmışlardı. Bir avuç gümüş uçtu.", gold: -25 },
        });
      }
      return opts;
    },
  },
  {
    id: "elci",
    title: "Han Elçisi",
    icon: "lord_bey",
    text: "Atı köpüklenmiş bir ulak yolunu kesti. \"Beyim, efendim haber yolladı: yolda gördüklerini anlatırsan ödülü büyük.\"",
    when: (c) => c.lv >= 4,
    opts: () => [
      { label: "Bildiklerini anlat", check: { stat: "kar", dc: 10 }, ok: { text: "Hanın ulağı her sözünü yazdı. Kesesini uzatırken: \"Efendim bu adı unutmayacak.\"", gold: 80, renown: 4 }, fail: { text: "Ulak sözlerine pek inanmadı ama bir avuç gümüş bıraktı.", gold: 20 } },
      { label: "Sırrını sakla", ok: { text: "\"Bozkırda dil kılıçtan keskindir.\" Ulak omuz silkip gitti.", kut: 1 } },
    ],
  },
  {
    id: "sel",
    title: "Taşkın Dere",
    icon: "map/oasis",
    text: "Dağlardan inen kar suyu dereyi kabartmış. Bulanık su köpürerek akıyor; karşı kıyı uzak görünüyor.",
    when: (c) => c.season === "bahar",
    opts: () => [
      { label: "Atları suya sür", check: { stat: "cev", dc: 10 }, ok: { text: "Akıntıya çapraz girdin, atlar yüzerek karşıya çıktı. Bir gün kazandın.", xp: 20 }, fail: { text: "Akıntı bir yük atını sürükledi. Erzakın bir kısmı suya gitti.", food: -40, hp: -0.1 } },
      { label: "Suyun çekilmesini bekle", cost: { food: 25 }, ok: { text: "İki gün kıyıda bekledin. Su çekilince sığ yerden rahatça geçtiniz." } },
    ],
  },
  {
    id: "ceylan",
    title: "Ceylan Sürüsü",
    icon: "food",
    text: "Bozkırın ortasında yüzlerce ceylan otluyor. Rüzgâr senden yana; seni henüz fark etmediler.",
    when: (c) => !c.night,
    opts: () => [
      { label: "Yayını gerip ava çık", check: { stat: "cev", dc: 9 }, ok: { text: "Üç ceylanı tek tek düşürdün. Akşam ateşinde et kızarıyor, askerlerin keyfi yerinde.", food: 60, xp: 15 }, fail: { text: "Okun ıskaladı, sürü toz bulutu içinde kayboldu.", xp: 5 } },
      { label: "Bırak otlasınlar", ok: { text: "Yaşlı bir avcı \"Doymuş sürüyü ürkütme, bozkırın bereketi kaçar\" derdi. Yoluna devam ettin.", kut: 1 } },
    ],
  },
  {
    id: "kam",
    title: "Kamın Ayini",
    icon: "sk_golge",
    text: "Bir tepede davul sesi. Yaşlı bir kam ateşin çevresinde dönüyor, gök ruhlarına sesleniyor. Seni görünce durdu: \"Yolcu, ruhlar senin adını söylüyor.\"",
    opts: () => [
      { label: "Kamın ayinine katıl", cost: { gold: 30 }, ok: { text: "Kam davulunu üç kez vurdu, alnına kül sürdü. İçinde bir şeyin hafiflediğini hissettin.", kut: 4, hp: 0.4 } },
      { label: "Fal baktır", check: { stat: "kar", dc: 9 }, ok: { text: "\"Doğuda bir kale seni bekliyor; surlarına tuğun dikilecek.\" Askerlerin bu kehaneti dilden dile anlatıyor.", renown: 3, xp: 15 }, fail: { text: "Kam yüzüne uzun uzun baktı ve hiçbir şey söylemedi. Bu sessizlik içine kurt düşürdü.", kut: -1 } },
      { label: "Uzaktan selamla", ok: { text: "Elini göğsüne koyup geçtin. Davul sesi uzun süre ardından geldi." } },
    ],
  },
  {
    id: "artik",
    title: "Dağılmış Ordu",
    icon: "u_spear",
    text: "Yenilmiş bir beyin askerleri, aç ve yorgun, bir dere kenarında kamp kurmuş. Kılıçları körelmiş ama gözleri hâlâ kavgacı.",
    when: (c) => c.lv >= 6,
    opts: (c) => {
      const n = 3 + Math.round(c.lv * 0.4);
      return [
        { label: "Onları besle, saflarına al", cost: { food: 30, gold: 40 + c.lv * 5 }, ok: { text: "Askerler karınlarını doyurunca sana yemin etti. Birliğin büyüdü.", units: { spear: Math.ceil(n * 0.6), archer: Math.floor(n * 0.4) }, renown: 2 } },
        { label: "Silahlarını bırakmalarını iste", check: { stat: "kar", dc: 11 }, ok: { text: "Sesindeki buyruk onları ikna etti; silahlarını teslim edip dağıldılar. Kılıçları iyi para eder.", gold: 60 + c.lv * 6, renown: 2 }, fail: { text: "\"Biz de bir zamanlar senin gibiydik!\" diye bağırıp üstüne yürüdüler. Ucuz atlattın.", hp: -0.18 } },
        { label: "Uzak dur", ok: { text: "Onları kendi kaderleriyle baş başa bıraktın." } },
      ];
    },
  },
  {
    id: "seyyar",
    title: "Seyyar Tüccar",
    icon: "merchant",
    text: "Tek devesiyle yol alan bir tüccar seni selamladı. \"Şehre varmadan mal almak isteyen var mı? Fiyatım yoldan ucuz!\"",
    opts: () => [
      { label: "Mallarına bak", cost: { gold: 70 }, ok: { text: "Birkaç balya mal aldın. Doğru şehirde iki katına gider.", good: 2 } },
      { label: "Yol haberlerini sor", ok: { text: "Tüccar hangi geçitte harami olduğunu, hangi kalenin el değiştirdiğini anlattı.", xp: 10 } },
    ],
  },
  {
    id: "menzil",
    title: "Menzil Ocağı",
    icon: "map/yurts",
    text: "Yol kenarında duman tüten bir menzil: yolcular çorba içiyor, atlar dinleniyor. İhtiyar menzilci seni çağırıyor: \"Çorba bedava, haberler para.\"",
    when: (c) => c.lv >= 3,
    opts: () => [
      { label: "Çorba iç, dinlen", ok: { text: "Sıcak çorba ve kısa bir uyku; yorgunluğun dağıldı. Askerlerin de neşelendi.", hp: 0.25, food: 15, xp: 8 } },
      { label: "Kestirme yol öğren", cost: { gold: 25 }, ok: { text: "Menzilci parmağıyla bir sırtı gösterdi: \"Oradan geçersen yarım gün kazanırsın.\" Ayakların hafifledi.", xp: 12, renown: 1 } },
      { label: "Geç git", ok: { text: "Elini sallayıp geçtin; ocak dumanı ardından kaldı." } },
    ],
  },
  {
    id: "ulak",
    title: "Destan Ulağı",
    icon: "scroll",
    text: "Atı köpük içinde bir ulak önüne dikildi. Kemerinde Korkut'un mührü var: \"Yolun doğru, ama acele et. Gökyüzü beklemez.\"",
    when: (c) => !!c.onQuest && c.lv >= 4,
    opts: () => [
      { label: "Ulağın atını al, hızlan", ok: { text: "Taze atın nalı bozkıra vurdu. Hedefin artık daha yakın hissediliyor.", xp: 20, renown: 2 } },
      { label: "Ulakla birlikte dinlen", cost: { food: 10 }, ok: { text: "Ulak sana kısa bir destan parçası okudu; yüreğin ve bedenin toparlandı.", hp: 0.35, kut: 2, xp: 15 } },
    ],
  },
  {
    id: "kervan_refah",
    title: "Refah Kervanı",
    icon: "j_caravan",
    text: "İpek yüklü bir kervan yavaş ilerliyor. Kervanbaşı elini kaldırdı: \"Muhafız arıyoruz; payını veririz.\"",
    when: (c) => c.lv >= 5 && c.army >= 8,
    opts: (c) => [
      { label: "Muhafızlık yap", ok: { text: "Kervanı bir geçide kadar korudun. Kervanbaşı kesesini açtı.", gold: 40 + c.lv * 4, renown: 2, xp: 18 } },
      { label: "Ticaret teklifi", check: { stat: "kar", dc: 10 }, ok: { text: "İyi pazarlık: ucuza mal aldın, doğru şehirde katlanır.", good: 3, xp: 12 }, fail: { text: "Kervanbaşı güldü: \"Bugün fiyat yok.\" El sıkışıp ayrıldınız.", xp: 4 } },
      { label: "Yoluna devam", ok: { text: "Develerin çanları uzaklaştı." } },
    ],
  },
  {
    id: "harami_pusu",
    title: "Geçit Pususu",
    icon: "j_bandit",
    text: "Dar bir geçitte kaya düşmüş gibi duruyor… ama kayanın ardından ok kirişleri geriliyor. Haramiler seni bekliyor.",
    when: (c) => c.lv >= 4,
    opts: (c) => {
      const n = 6 + Math.round(c.lv * 0.8);
      return [
        { label: "Pusuyu boz (savaş)", fight: { army: a(Math.ceil(n * 0.5), Math.ceil(n * 0.35), Math.floor(n * 0.15)), bonus: 0.12, foe: "Geçit haramileri" }, ok: { text: "Pusu dağıldı; geçit yeniden açıldı.", gold: 35 + c.lv * 5, renown: 3, xp: 25 }, fail: { text: "Oklar yağmur gibi indi; geçitten yaralı çıktın.", hp: -0.22 } },
        { label: "Geri dön, dolan", cost: { food: 20 }, ok: { text: "Uzun yoldan dolandın. Zaman kaybettin ama kan dökülmedi.", xp: 8 } },
        { label: "Pazarlık et", check: { stat: "kar", dc: 12 }, cost: { gold: 40 }, ok: { text: "Başa \"yol vergisi\" ödedin; geçit açıldı. Utanç ucuz geldi.", renown: -1, xp: 10 }, fail: { text: "Pazarlık bozuldu; yine de kılıç çekmek zorunda kaldın.", hp: -0.12 } },
      ];
    },
  },
  {
    id: "yoldas_nobet",
    title: "Nöbet Ateşi",
    icon: "tug",
    text: "Gece nöbetinde yoldaşın ateşe bir dal attı. \"Konuşsak mı, yoksa rüzgâr yeter mi?\" diye sordu.",
    when: (c) => c.night && c.comps.length >= 1,
    opts: (c) => {
      const who = c.escort && c.comps.includes(c.escort) ? c.escort : c.comps[0];
      const talk: Record<CompId, string> = {
        ayse: "Ayşe yaralarını temizlerken eski günleri anlattı. Bağın güçlendi.",
        korkut: "Korkut kısık sesle bir destan mırıldandı. Ateş bile dinliyor gibiydi.",
        ferhat: "Ferhat kurt izlerini çizdi kuma: yarın hangi sırtın av vereceğini biliyor.",
        batu: "Batu kılıcını bileyleyip fısıldadı: \"Yarın kan dökülürse ben önde olurum.\"",
        leyla: "Leyla keseyi saydı, sonra güldü: \"Bu gece ziyan yok; sabah kazanç konuşuruz.\"",
        lucia: "Lucia liman rüzgârını anlattı; bozkır bile tuz kokusu aldı.",
      };
      return [
        { label: "Konuş, dinle", ok: { text: talk[who] ?? "Gece boyu fısıldaştınız; sabah yol daha kısa geldi.", xp: 12, kut: 1 } },
        { label: "Nöbete odaklan", ok: { text: "Sessizlik de bir bağdır. Ateş söndü, yollar dürüst kaldı.", xp: 6 } },
      ];
    },
  },
];
