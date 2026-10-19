import type { Army } from "./data";
import type { Boss } from "./battle";
import type { RoadFx } from "./road";

export type BoyAct = "talk" | "pay" | "fight" | "choice";

export interface BoyChoice {
  label: string;
  text: string;
  fx: RoadFx;
  /** boyu burada bitirir */
  end?: boolean;
}

export interface BoyStep {
  near: string;
  place: string;
  img: string;
  text: string;
  act: BoyAct;
  btn: string;
  done: string;
  cost?: { gold?: number; food?: number };
  army?: (lv: number) => Army;
  boss?: Boss;
  bonus?: number;
  choices?: BoyChoice[];
}

export interface Boy {
  id: string;
  name: string;
  icon: string;
  lv: number;
  intro: string;
  reward: RoadFx & { legend?: boolean };
  steps: BoyStep[];
}

export interface BoyState {
  id: string;
  step: number;
  at: { x: number; y: number } | null;
}

const a = (n: number, s: number, ar: number, h: number): Army => ({ spear: Math.round(n * s), archer: Math.round(n * ar), horse: Math.round(n * h) });

export const TEPEGOZ: Boss = { name: "Tepegöz", icon: "heroes/boss_golem", hp: 2600, atk: 46, def: 22 };
export const DUMRUL: Boss = { name: "Deli Dumrul", icon: "heroes/boss_hakan", hp: 900, atk: 24, def: 12 };
export const SOKLU: Boss = { name: "Şöklü Melik", icon: "heroes/boss_soklu", hp: 3400, atk: 54, def: 26 };
export const BOGA: Boss = { name: "Kızgın Boğa", icon: "heroes/boss_yelbegen", hp: 1300, atk: 30, def: 14 };
export const UC_CANAVAR: Boss = { name: "Selcen'in Üç Canavarı", icon: "heroes/boss_evren", hp: 2000, atk: 38, def: 18 };
export const DUZMURD: Boss = { name: "Düzmürd Meliki", icon: "heroes/boss_karakoncolos", hp: 2300, atk: 42, def: 20 };
export const ALINCA: Boss = { name: "Alinca Tekfuru", icon: "heroes/boss_noyan", hp: 1900, atk: 36, def: 18 };
export const SUFREK: Boss = { name: "Süfrek Tekfuru", icon: "heroes/boss_fedai", hp: 2100, atk: 40, def: 19 };
export const YARTIKUC: Boss = { name: "Yartıküç Melik", icon: "heroes/boss_akbars", hp: 2500, atk: 44, def: 22 };
export const DIS_OGUZ: Boss = { name: "Dış Oğuz Beyleri", icon: "heroes/boss_akboru", hp: 3200, atk: 50, def: 24 };

export const BOYS: Boy[] = [
  {
    id: "dumrul",
    name: "Deli Dumrul Boyu",
    icon: "heroes/boss_hakan",
    lv: 5,
    intro: "Dede Korkut kopuzunu akortladı: \"Duha Koca oğlu Deli Dumrul, kuru bir çayın üstüne köprü kurmuş. Geçenden otuz üç akçe, geçmeyenden döve döve kırk akçe alırmış. Bir gün Azrail'e meydan okumuş...\"",
    reward: { gold: 300, renown: 25, kut: 4 },
    steps: [
      {
        near: "bukhara",
        place: "Kuru Çay Köprüsü",
        img: "map/tower",
        text: "Kupkuru bir çayın üstünde gereksiz bir köprü. Başında dev gibi bir yiğit, elinde gürz: \"Geçenden otuz üç, geçmeyenden kırk akçe!\"",
        act: "choice",
        btn: "Deli Dumrul'la konuş",
        done: "",
        choices: [
          { label: "Otuz üç akçeyi öde", text: "Dumrul kahkahayla güldü: \"Akıllı adamsın!\" Sonra gözleri karardı: \"Dün bir yiğit öldü, Azrail canını aldı dediler. Kimdir bu Azrail? Bulup canını alacağım!\"", fx: { gold: -33 } },
          { label: "\"Kuru çaya köprü olmaz\" de", text: "Dumrul'un yüzü kızardı, sonra güldü: \"Doğru söyledin, ama sözüm sözdür.\" Gözleri bozkıra daldı: \"Azrail denen o kuşu bulacağım!\"", fx: { kut: 1 } },
        ],
      },
      {
        near: "bukhara",
        place: "Dumrul'un Otağı",
        img: "map/yurts",
        text: "Dumrul döşeğinde yatıyor; Azrail göğsüne çökmüş. Karısı başucunda ağlıyor: \"Benim canım onun canına kurban olsun!\"",
        act: "choice",
        btn: "Otağa gir",
        done: "",
        choices: [
          { label: "Tanrı'ya yalvar, Dumrul'la birlikte dua et", text: "Dumrul kibrini bıraktı, ellerini göğe açtı. Gökten bir ses geldi: \"Karı koca yüz kırk yıl yaşasın!\" Dumrul sana sarıldı ve atlılarıyla sancağına katıldı.", fx: { units: { horse: 6 }, kut: 6 }, end: true },
          { label: "Dumrul'u Azrail'e karşı kışkırt", text: "Dumrul döşeğinden fırladı, kılıcını kaptı... ve kibirle sana döndü: \"Önce seni deneyeyim!\"", fx: {} },
        ],
      },
      {
        near: "bukhara",
        place: "Kuru Çay Köprüsü",
        img: "map/tower",
        text: "Deli Dumrul köprünün başında gürzünü sallıyor. \"Gel bakalım yiğit, Azrail'den önce sen!\"",
        act: "fight",
        btn: "Dumrul ile dövüş",
        done: "Dumrul yere serildi, gürzü kırıldı. Ayağa kalkınca güldü: \"Azrail'den önce sana yenildim. Ders aldım.\" Köprüyü yıktı, geçiş parasını yoksullara dağıttı.",
        army: (lv) => a(10 + lv, 0.5, 0.2, 0.3),
        boss: DUMRUL,
        bonus: 0.05,
      },
    ],
  },
  {
    id: "tepegoz",
    name: "Basat'ın Tepegöz'ü Öldürdüğü Boy",
    icon: "heroes/boss_golem",
    lv: 9,
    intro: "Dede Korkut sesini alçalttı: \"Oğuz'un başına bir bela geldi: tek gözlü, oku işlemez, kılıç kesmez Tepegöz. Her gün iki adam, beş yüz koyun ister. Basat'ın kardeşini de yedi...\"",
    reward: { renown: 60, kut: 8, legend: true },
    steps: [
      {
        near: "merv",
        place: "Oğuz Çoban Obası",
        img: "map/yurts",
        text: "Korkudan titreyen çobanlar. Ambarlar boş; her gün Tepegöz'e haraç gidiyor. \"Ey yiğit, açlıktan öleceğiz. Önce karnımızı doyur, sonra yolunu gösterelim.\"",
        act: "pay",
        btn: "Erzak dağıt",
        cost: { food: 150 },
        done: "Çobanlar doydu. Yaşlı bir kadın fısıldadı: \"Tepegöz'ün gücü gözünde. Basat şişi ateşte kızdırıp gözüne sapladı... Mağarası güneydeki kayalıklarda.\"",
      },
      {
        near: "merv",
        place: "Tepegöz'ün Mağarası",
        img: "map/ruins",
        text: "Kemik yığınları, dev bir ocak ve içeriden gelen gök gürültüsü gibi horultu. Tepegöz'ün kulları mağaranın ağzında nöbette.",
        act: "fight",
        btn: "Mağaraya gir",
        done: "Kızgın şiş Tepegöz'ün tek gözüne saplandı. Dev böğürerek mağarayı yıktı; Basat'ın öcü alındı. Oğuz obaları yeniden nefes aldı.",
        army: (lv) => a(26 + lv * 2, 0.5, 0.3, 0.2),
        boss: TEPEGOZ,
        bonus: 0.12,
      },
    ],
  },
  {
    id: "beyrek",
    name: "Bamsı Beyrek Boyu",
    icon: "u_archer",
    lv: 12,
    intro: "Dede Korkut kopuzunu göğsüne bastırdı: \"Bamsı Beyrek düğün gecesi Bayburt Hisarı'na tutsak düştü. On altı yıl zindanda kaldı. Nişanlısı Banı Çiçek onu hâlâ bekliyor...\"",
    reward: { gold: 500, renown: 45, kut: 6, units: { horse: 8 } },
    steps: [
      {
        near: "tabriz",
        place: "Bayburt Hisarı",
        img: "map/castle",
        text: "Kayalara gömülü bir hisar. Zindanında on altı yıldır bir Oğuz yiğidi çürüyor. Burçlarda Bayburt beyinin kâfir askerleri.",
        act: "fight",
        btn: "Hisara saldır",
        done: "Zindan kapısı kırıldı. Saçı sakalı ağarmış bir adam ışığa çıktı: \"Ben Bamsı Beyrek'im. Banı Çiçek'im beni bekliyor mu?\"",
        army: (lv) => a(30 + lv * 2, 0.45, 0.35, 0.2),
        bonus: 0.15,
      },
      {
        near: "rey",
        place: "Banı Çiçek'in Düğünü",
        img: "map/yurts",
        text: "Obada davullar çalıyor: Banı Çiçek zorla Yalancıoğlu'na veriliyor. Beyrek ozan kılığına girdi, kopuzunu kaptı. \"Bir yay ister,\" diyor, \"bir de dost eli.\"",
        act: "choice",
        btn: "Düğüne gir",
        done: "",
        choices: [
          { label: "Beyrek'e kendi yayını ver", text: "Beyrek yayı gerdi; kimsenin kuramadığı yay onun elinde inledi. Ok yüzüğü vurdu, Banı Çiçek onu tanıdı. Yalancıoğlu kaçtı, düğün asıl sahibine kaldı.", fx: { renown: 10, kut: 3 } },
          { label: "Yalancıoğlu'nu meydanda yüzleştir", text: "Herkesin önünde Yalancıoğlu'nun yalanını açığa çıkardın. Beyrek kılıcını çekmeden kazandı; Oğuz beyleri töreye saygını konuştu.", fx: { kut: 6 } },
        ],
      },
    ],
  },
  {
    id: "kazan",
    name: "Salur Kazan'ın Evinin Yağmalandığı Boy",
    icon: "lord_bey",
    lv: 16,
    intro: "Dede Korkut'un sesi titredi: \"Kazan Han ava çıkınca Şöklü Melik otağını basmış; anasını, karısını, oğlu Uruz'u tutsak etmiş. Kazan bir başına kalmış...\"",
    reward: { gold: 900, renown: 80, kut: 10, legend: true },
    steps: [
      {
        near: "kashgar",
        place: "Yağmalanmış Otağ",
        img: "map/camp",
        text: "Yanmış çadırlar, dağılmış sürüler. Salur Kazan bir çobanla tek başına oturuyor: \"Yiğit, dost musun düşman mı? Ailem Şöklü Melik'in elinde.\"",
        act: "talk",
        btn: "Kazan'a elini uzat",
        done: "Kazan kılıcını kuşandı: \"Öyleyse beraber yürüyelim. Melik'in kalesi doğudaki kayalıklarda.\"",
      },
      {
        near: "kashgar",
        place: "Şöklü Melik'in Kalesi",
        img: "map/castle",
        text: "Kalenin avlusunda Oğuz tutsakları zincirli. Şöklü Melik burçtan alay ediyor: \"Kazan'ın oğlunu çengele asacağım!\"",
        act: "fight",
        btn: "Kaleye saldır",
        done: "Şöklü Melik'in kellesi burçtan aşağı yuvarlandı. Uruz, Kazan'ın anası ve Burla Hatun zincirlerinden kurtuldu.",
        army: (lv) => a(40 + lv * 2.5, 0.4, 0.35, 0.25),
        boss: SOKLU,
        bonus: 0.15,
      },
      {
        near: "kashgar",
        place: "Kazan'ın Otağı",
        img: "map/yurts",
        text: "Otağ yeniden dikildi, kazanlar kaynıyor. Kazan Han ganimetin yarısını sana uzatıyor.",
        act: "choice",
        btn: "Toya katıl",
        done: "",
        choices: [
          { label: "Ganimeti Oğuz beylerine dağıt", text: "\"Ganimet beylerin hakkıdır\" dedin. Kazan Han ayağa kalktı: \"Bu yiğit töreyi benden iyi bilir!\" Bütün Oğuz senin adını andı.", fx: { kut: 8, renown: 20 } },
          { label: "Payını al", text: "Kazan Han yarısını sandıklarla gönderdi. Hazinen doldu.", fx: { gold: 800 } },
        ],
      },
    ],
  },
  {
    id: "bugac",
    name: "Dirsek Oğlu Bugaç Boyu",
    icon: "heroes/boss_yelbegen",
    lv: 7,
    intro: "Dede Korkut kopuzunu okşadı: \"Dirse Han'ın bir oğlu olmuş ama töreye göre on beşine varana dek adı konmamış. Oğuz'un bir toyunda azgın bir boğa salıverilmiş; adsız yiğit onu çevirmiş...\"",
    reward: { gold: 250, renown: 20, kut: 5 },
    steps: [
      {
        near: "kashgar",
        place: "Oğuz Toyu",
        img: "map/yurts",
        text: "Davullar çalarken ipi kopan azgın bir boğa meydana dalıyor; çocuklar kaçışıyor, yiğitler geri çekiliyor. Dirse Han'ın adsız oğlu yumruğunu sıkmış, boğanın karşısına dikiliyor.",
        act: "fight",
        btn: "Boğayı dizginle",
        done: "Boğa son kez böğürüp dizlerinin üstüne çöktü. Dede Korkut geldi, elini adsız yiğidin başına koydu: \"Senin adın Bugaç olsun, boy senin olsun!\"",
        army: (lv) => a(8 + lv, 0.3, 0.1, 0.1),
        boss: BOGA,
        bonus: 0.08,
      },
      {
        near: "kashgar",
        place: "Dirse Han'ın Otağı",
        img: "map/yurts",
        text: "Bir cariyenin fitlemesiyle Dirse Han, oğlunun tahtına göz diktiğine inandırılmış. Bugaç av dönüşü sırtından vurulup kayalığa bırakılmış; Hızır'ın merhemiyle güç bulmuş. Şimdi babasının otağının önünde duruyor.",
        act: "choice",
        btn: "Otağa gir",
        done: "",
        choices: [
          { label: "Babanı bağışla, anana sarıl", text: "Anası Bugaç'ı tanıyınca kendinden geçti; Dirse Han gözyaşları içinde oğlunun ayaklarına kapandı. Bugaç babasını kaldırdı: \"Töre kan ister demez, hoşgörü ister.\"", fx: { kut: 6, renown: 6 } },
          { label: "Cariyeyi töreye şikâyet et", text: "Oğuz beyleri fitneciyi dinledi, yalanı ortaya döküldü. Bugaç adaleti kılıçsız kazandı; Dirse Han oğlunu bağrına bastı.", fx: { renown: 10 } },
        ],
      },
      {
        near: "kashgar",
        place: "Yağmalanan Oba",
        img: "map/camp",
        text: "Bugaç'ın yaralı olduğunu duyan düşman akıncıları obaya saldırmış. Kadınlar, çobanlar çaresiz; Bugaç henüz tam iyileşmemiş olsa da kılıcını kuşanıyor.",
        act: "fight",
        btn: "Obayı savun",
        done: "Akıncılar dağıtıldı, oba kurtuldu. Dede Korkut geldi, boy boyladı: \"Bundan sonra Bugaç'ın adı Oğuz'da yiğitlik demektir.\"",
        army: (lv) => a(14 + lv * 1.5, 0.35, 0.35, 0.3),
        bonus: 0.1,
      },
    ],
  },
  {
    id: "kanturali",
    name: "Kanlı Koca Oğlu Kan Turalı Boyu",
    icon: "heroes/boss_evren",
    lv: 11,
    intro: "Dede Korkut gözlerini kıstı: \"Kan Turalı evlenmek istemiş ama babası demiş: 'Trabzon tekfurunun kızı Selcen Hatun'u isteyen önce onun üç canavarını yenmeli.' Kan Turalı güldü: 'Benim için zor değil.'\"",
    reward: { gold: 400, renown: 35, kut: 6, units: { horse: 6 } },
    steps: [
      {
        near: "constantinople",
        place: "Trabzon Tekfurunun Meydanı",
        img: "map/castle",
        text: "Meydanda zincirlerinden boşanmış bir aslan, kızgın bir boğa ve azgın bir deve birden salınmış. Selcen Hatun burçtan izliyor; Kan Turalı sırıtarak kılıcını çekiyor: \"Yardım ister misin, yoksa seyret mi dersin?\"",
        act: "fight",
        btn: "Canavarlarla dövüş",
        done: "Üç canavar da toza serildi. Selcen Hatun burçtan indi, gözleri Kan Turalı'dan çok yanındaki yiğide bakıyordu. Tekfur sözünü tuttu, düğün hazırlığı başladı.",
        army: (lv) => a(16 + lv * 1.5, 0.3, 0.3, 0.2),
        boss: UC_CANAVAR,
        bonus: 0.1,
      },
      {
        near: "constantinople",
        place: "Dönüş Yolu",
        img: "map/camp",
        text: "Düğün alayı dönerken Kan Turalı yorgunluktan uyuyakalmış; tekfurun pişman olan adamları pusu kurmuş. Selcen Hatun yayını eline almış, tek başına savunuyor.",
        act: "choice",
        btn: "Pusuya karşılık ver",
        done: "",
        choices: [
          { label: "Selcen'in yanında dövüş", text: "Birlikte pusuyu dağıttınız. Kan Turalı uyanınca durumu gördü, Selcen'e hak verdi: \"Demek ki yiğitlik bana değil, ikimize yetiyormuş.\"", fx: { renown: 12, kut: 4 } },
          { label: "Kan Turalı'yı uyandır, onu öne sür", text: "Kan Turalı uyanıp pusuyu kendi kılıcıyla dağıttı, şerefini kurtardı. Selcen Hatun'a gönülden teşekkür etti.", fx: { renown: 8 } },
        ],
      },
    ],
  },
  {
    id: "yigenek",
    name: "Kazılık Koca Oğlu Yigenek Boyu",
    icon: "heroes/boss_karakoncolos",
    lv: 13,
    intro: "Dede Korkut'un sesi ağırlaştı: \"Kazılık Koca, kâfir Düzmürd'ün elinde on altı yıl zindanda yattı. Oğlu Yigenek büyüdü, babasının esir olduğunu öğrenince yayını eline aldı...\"",
    reward: { gold: 550, renown: 45, kut: 7, legend: true },
    steps: [
      {
        near: "nishapur",
        place: "Oğuz Divanı",
        img: "map/yurts",
        text: "Yigenek, babasının on altı yıldır zindanda çürüdüğünü öğrenmiş; beyler onu caydırmaya çalışıyor: \"Düzmürd'ün kalesi alınmaz.\" Yigenek yayını yere vuruyor: \"Alınmazsa ben alırım.\"",
        act: "talk",
        btn: "Yola çıkma kararını bildir",
        done: "Oğuz beyleri Yigenek'in azmini görünce peşine düştü. Düzmürd'ün kalesi doğudaki kayalıklarda.",
      },
      {
        near: "nishapur",
        place: "Düzmürd'ün Kalesi",
        img: "map/castle",
        text: "Kale burçlarında Düzmürd, zindana inen merdivende Kazılık Koca'nın zincir sesleri duyuluyor. Düzmürd alay ediyor: \"On altı yıldır kimse gelmedi, sen mi geleceksin?\"",
        act: "fight",
        btn: "Kaleye saldır",
        done: "Düzmürd'ün kellesi burçtan yuvarlandı. Zindan kapısı kırıldığında Kazılık Koca, oğlunun yüzünü on altı yıl sonra ilk kez gördü.",
        army: (lv) => a(32 + lv * 2, 0.4, 0.3, 0.3),
        boss: DUZMURD,
        bonus: 0.12,
      },
      {
        near: "nishapur",
        place: "Baba Ocağı",
        img: "map/yurts",
        text: "Kazılık Koca zincirlerden kurtulmuş ama onurunu da geri istiyor: \"On altı yıl boyun eğdim, bir toy ver de Oğuz görsün ki hâlâ bir Koca'yım.\"",
        act: "choice",
        btn: "Toy hazırla",
        done: "",
        choices: [
          { label: "Büyük bir toy ver", text: "Toyda Dede Korkut boy boyladı: \"Babasını kurtaran oğul, Oğuz'un en genç kahramanı oldu.\" Kazılık Koca başını dik tuttu.", fx: { renown: 15, kut: 5 } },
          { label: "Sessizce eve dön", text: "Törensiz ama gönülden bir dönüş oldu. Kazılık Koca oğlunun elini sıktı, başka söze gerek kalmadı.", fx: { gold: 300 } },
        ],
      },
    ],
  },
  {
    id: "segrek",
    name: "Uşun Koca Oğlu Segrek Boyu",
    icon: "heroes/boss_noyan",
    lv: 16,
    intro: "Dede Korkut başını salladı: \"Uşun Koca'nın oğlu Egrek, Alinca Kalesi'nde esir düşmüş. Küçük kardeşi Segrek'e bu söylenmemiş, onu evlendirip oyalamaya çalışmışlar. Ama düğün gecesi gerçeği öğrenmiş...\"",
    reward: { gold: 700, renown: 55, kut: 8, units: { horse: 10 } },
    steps: [
      {
        near: "samarkand",
        place: "Segrek'in Düğünü",
        img: "map/yurts",
        text: "Davullar çalıyor, gelin bekliyor ama Segrek'in yüzü asık: biri ona kardeşi Egrek'in Alinca Kalesi'nde esir olduğunu fısıldamış. \"Kardeşim zincirdeyken ben düğün mü yapayım?\"",
        act: "choice",
        btn: "Kararını ver",
        done: "",
        choices: [
          { label: "Düğünü bırak, hemen yola çık", text: "Gelinin ve ailenin şaşkın bakışları arasında atına atladı. \"Dönünce düğünü tamamlarım,\" dedi, \"ama önce kardeşim.\"", fx: { kut: 4 } },
          { label: "Düğünü bitir, sabah yola çık", text: "Töreye saygı gösterdi ama gözü hep kapıdaydı. Sabah ilk ışıkla kardeşinin yolunu tuttu.", fx: { renown: 5 } },
        ],
      },
      {
        near: "samarkand",
        place: "Alinca Kalesi",
        img: "map/castle",
        text: "Kale burçlarında Egrek'in zincir sesleri duyuluyor. Alinca Tekfuru, kardeşini tanımayan Segrek'i önce hapsettirmek istiyor; ama Segrek kılıcını çekmiş.",
        act: "fight",
        btn: "Kaleye saldır",
        done: "Alinca Tekfuru yere serildi. Zindan kapısı kırıldığında iki kardeş birbirini tanıyamadan kucaklaştı; Egrek sonunda gözyaşlarıyla \"Sen Segrek misin?\" diyebildi.",
        army: (lv) => a(36 + lv * 2, 0.35, 0.35, 0.3),
        boss: ALINCA,
        bonus: 0.14,
      },
      {
        near: "samarkand",
        place: "Dönüş Yolu",
        img: "map/camp",
        text: "İki kardeş birlikte eve dönerken Egrek, Segrek'e bıraktığı gelini soruyor. Segrek güler: \"Önce seni kurtardım, töre bozulmadı ki.\"",
        act: "talk",
        btn: "Eve doğru yürü",
        done: "Köye vardıklarında gelin kapıda bekliyordu; düğün bu kez eksiksiz tamamlandı. Dede Korkut kopuzunu aldı: \"Kardeş kardeşi zincirden kurtarırsa, töre de düğün de eksik kalmaz.\"",
      },
    ],
  },
  {
    id: "uruz",
    name: "Kazan Bey Oğlu Uruz'un Tutsağı",
    icon: "heroes/boss_fedai",
    lv: 9,
    intro: "Dede Korkut telleri gergin tuttu: \"Kazan Bey'in oğlu Uruz, avda düşmana tutsak düşmüş. Anası Burla Hatun ağıt yakmış, Kazan kılıcını kuşanmış… Ama asıl yiğitlik, oğlunu kurtarmaya giden yolda ortaya çıkar.\"",
    reward: { gold: 320, renown: 28, kut: 5, units: { spear: 8 } },
    steps: [
      {
        near: "merv",
        place: "Av Yolu",
        img: "map/camp",
        text: "Uruz'un avcıları dağılmış, kılıçları yerde. Bir çoban fısıldıyor: \"Süfrek Tekfuru oğlanı alıp kaleye götürdü; Burla Hatun ağıt yakıyor.\"",
        act: "talk",
        btn: "İzi takip et",
        done: "Çobanın tarif ettiği geçitten kaleye doğru iz sürdün. Uruz'un atının nalı hâlâ toprakta.",
      },
      {
        near: "merv",
        place: "Süfrek Kalesi",
        img: "map/castle",
        text: "Kale burçlarında Süfrek Tekfuru alay ediyor: \"Kazan'ın oğlunu fidye karşılığı satarım!\" İçeriden Uruz'un zincir sesi geliyor.",
        act: "fight",
        btn: "Kaleyi bas",
        done: "Süfrek yere serildi. Zindanda Uruz'u buldun; yüzü toz içinde ama gözleri hâlâ yiğitçe bakıyordu: \"Babam gelecek sandım… Sen geldin.\"",
        army: (lv) => a(18 + lv * 1.6, 0.4, 0.3, 0.3),
        boss: SUFREK,
        bonus: 0.1,
      },
      {
        near: "merv",
        place: "Burla Hatun'un Otağı",
        img: "map/yurts",
        text: "Burla Hatun oğlunu bağrına bastı. Kazan Han sana bir kadeh kımız uzatıyor: \"Oğlumu getiren, benim kardeşimdir.\"",
        act: "choice",
        btn: "Kabul et",
        done: "",
        choices: [
          { label: "Şeref payını al, otağda kal", text: "Kazan seni otağına aldı; Oğuz beyleri adını andı. Uruz kılıcını sana armağan etti.", fx: { renown: 14, kut: 3 } },
          { label: "Sessizce yoluna devam et", text: "Kazan'ın hediyesini geri çevirdin ama gönlü sende kaldı. Burla Hatun yol azığın doldurdu.", fx: { gold: 200, food: 60 } },
        ],
      },
    ],
  },
  {
    id: "emren",
    name: "Begil Oğlu Emren Boyu",
    icon: "heroes/boss_akbars",
    lv: 15,
    intro: "Dede Korkut sesini alçalttı: \"Begil, avda ayağını kırmış; Oğuz'un düşmanı Yartıküç bunu duyunca obaya saldırmış. Begil'in oğlu Emren henüz delikanlı, ama babasının yayını eline almış…\"",
    reward: { gold: 600, renown: 48, kut: 7, legend: true },
    steps: [
      {
        near: "tabriz",
        place: "Begil'in Otağı",
        img: "map/yurts",
        text: "Begil ayağındaki sargıya bakıyor, utançla: \"Yiğitlik bitti, oğlum. Sen kaç.\" Emren babasının yayını omzuna asmış: \"Kaçmak töre değil.\"",
        act: "choice",
        btn: "Emren'le konuş",
        done: "",
        choices: [
          { label: "Emren'i yüreklendir", text: "\"Babanın yayını taşıyan, babasının şerefini taşır\" dedin. Emren gözleri dolu, başını salladı.", fx: { kut: 3 } },
          { label: "Begil'e merhem ve erzak bırak", text: "Begil'in yarasına merhem sürdün, otağa yiyecek bıraktın. Emren minnetle baktı: \"Şimdi yalnız değiliz.\"", fx: { food: -40, renown: 4 } },
        ],
      },
      {
        near: "tabriz",
        place: "Yartıküç'ün Ordugâhı",
        img: "map/camp",
        text: "Yartıküç, Begil'in yaralı olduğunu duyunca obayı yağmalamaya gelmiş. Emren yayını germiş, karşılarında tek başına duruyor.",
        act: "fight",
        btn: "Emren'in yanında savaş",
        done: "Yartıküç kaçtı; Emren babasının yayını göğe kaldırdı. Begil oğlunu kucakladı: \"Artık adın Emren'dir, boy senindir.\"",
        army: (lv) => a(28 + lv * 2, 0.35, 0.35, 0.3),
        boss: YARTIKUC,
        bonus: 0.12,
      },
      {
        near: "tabriz",
        place: "Zafer Toyu",
        img: "map/yurts",
        text: "Dede Korkut geldi, Emren'in başına el koydu. Oğuz beyleri toy bekliyor.",
        act: "talk",
        btn: "Toyu dinle",
        done: "Kopuz çaldı: \"Baba yaralıyken oğul kılıç kuşanırsa, töre yeniden doğar.\" Emren'in adı bozkıra yayıldı.",
      },
    ],
  },
  {
    id: "salur",
    name: "Salur Kazan'ın Tutsaklığı",
    icon: "heroes/boss_karakus",
    lv: 18,
    intro: "Dede Korkut derin bir nefes aldı: \"Salur Kazan bir gece tek başına ava çıkmış, düşmana tutsak düşmüş. Oğlu Uruz, anası Burla, bütün Oğuz ağıt yakmış… Kurtarmak için yiğit ister.\"",
    reward: { gold: 750, renown: 60, kut: 9, units: { horse: 8, archer: 6 } },
    steps: [
      {
        near: "bukhara",
        place: "Oğuz Divanı",
        img: "map/yurts",
        text: "Otağda ağıt var. Uruz kılıcını çekmiş: \"Babamı kim kurtaracak?\" Beyler birbirine bakıyor; kimse ilk adımı atmıyor.",
        act: "choice",
        btn: "Söz al",
        done: "",
        choices: [
          { label: "\"Ben giderim\" de", text: "Beyler şaşkın baktı. Uruz elini omzuna koydu: \"O zaman ikimiz.\"", fx: { kut: 4, renown: 6 } },
          { label: "Beyleri ant içmeye çağır", text: "Herkes kımız kadehini kaldırdı. Oğuz bir arada yola çıktı; sen önde.", fx: { renown: 10 } },
        ],
      },
      {
        near: "bukhara",
        place: "Tutsak Kalesi",
        img: "map/castle",
        text: "Kazan Han zindanda, zincirli ama dimdik. Gardiyanlar kapıda; içeriden Kazan'ın sesi: \"Oğlum değilse kimse gelmesin!\"",
        act: "fight",
        btn: "Zindanı bas",
        done: "Kapılar kırıldı. Kazan zincirlerini kendi kopardı, seni görünce güldü: \"Demek Oğuz hâlâ Oğuz.\"",
        army: (lv) => a(40 + lv * 2.2, 0.35, 0.35, 0.3),
        boss: { name: "Tutsak Kalesi Muhafızı", icon: "heroes/boss_karakus", hp: 2800, atk: 48, def: 23 },
        bonus: 0.14,
      },
      {
        near: "bukhara",
        place: "Dönüş Toyu",
        img: "map/yurts",
        text: "Kazan Han kurtulmuş, Burla Hatun ağlamayı bırakmış. Dede Korkut kopuzunu bekletiyor.",
        act: "talk",
        btn: "Boyu dinle",
        done: "\"Tutsak düşen beyi kurtaran, beyin tahtına ortak olur\" dedi Korkut. Kazan sana bir tuğ hediye etti.",
      },
    ],
  },
  {
    id: "icdis",
    name: "İç Oğuz'a Dış Oğuz Asi",
    icon: "heroes/boss_akboru",
    lv: 20,
    intro: "Dede Korkut'un sesi ağırlaştı: \"İç Oğuz ile Dış Oğuz bir toya çağrılmış; Dış Oğuz gelmemiş, asi olmuş. Aradaki kan, Bamsi Beyrek'in ölümüne kadar varmış… Bu boy, kardeşliğin kırıldığı yerdir.\"",
    reward: { gold: 900, renown: 80, kut: 12, legend: true },
    steps: [
      {
        near: "samarkand",
        place: "Bölünmüş Toy",
        img: "map/yurts",
        text: "İç Oğuz otağında kazan kaynıyor; Dış Oğuz'un tuğları ufukta, çağrıya gelmemiş. Beyrek arabulucu olmak istiyor ama kılıçlar çekilmiş.",
        act: "choice",
        btn: "Araya gir",
        done: "",
        choices: [
          { label: "Barış için ant öner", text: "İki taraf da dinledi. Ant sözü havada kaldı ama kan dökülmedi — henüz.", fx: { kut: 6, renown: 8 } },
          { label: "Dış Oğuz'u yola getir (gözdağı)", text: "Tuğunu yükselttin; Dış Oğuz beyleri geri çekildi ama kinleri büyüdü.", fx: { renown: 5 } },
        ],
      },
      {
        near: "samarkand",
        place: "Asi Ordugâh",
        img: "map/camp",
        text: "Dış Oğuz beyleri toplandı; aralarında Beyrek'i hedef görenler var. \"İç Oğuz'un gözdesi düşsün\" diyorlar. Savaş kaçınılmaz.",
        act: "fight",
        btn: "Kardeş kanını durdur",
        done: "Asi beyler dağıldı. Beyrek yaralı ama ayakta; elini omzuna koydu: \"Kardeşliği sen savundun.\"",
        army: (lv) => a(48 + lv * 2.4, 0.35, 0.35, 0.3),
        boss: DIS_OGUZ,
        bonus: 0.16,
      },
      {
        near: "samarkand",
        place: "Yeniden Kurulan Sofra",
        img: "map/yurts",
        text: "İç ve Dış Oğuz yeniden aynı sofrada. Dede Korkut kopuzunu indirdi: son boy bu.",
        act: "talk",
        btn: "Son boyu dinle",
        done: "\"Kardeş kardeşi vurursa töre ağlar; kardeşi savunan, Oğuz'un en ulu yiğididir\" dedi Korkut. On iki boy tamamlandı; adın bitigde mühürlendi.",
      },
    ],
  },
];

export function boyOf(id: string): Boy | undefined {
  return BOYS.find((b) => b.id === id);
}
