import type { Army, Unit } from "./data";
import type { Boss } from "./battle";
import { BOSS_KITS, type Arena, type BossKit, type BossMove, type Kin } from "./bosses";
import type { Item, Slot } from "./rpg";
import { W, H } from "../world/gen";

/** Bölge bosslarının düşürdüğü nadir malzemeler; efsane tariflerinin ve destan birliklerinin anahtarı. */
export const RARE_MATS = ["pul", "inci", "zehir", "golgeipek", "devkemigi", "gokdemir", "ayazkurk"] as const;
export type RareMat = (typeof RARE_MATS)[number];

export const RARE_INFO: Record<RareMat, { name: string; icon: string; desc: string }> = {
  pul: { name: "Şahmeran Pulu", icon: "mt_sahmeran", desc: "Yılanların şahının zümrüt pulu. Zehre ve lanete karşı korur." },
  inci: { name: "Hazar İncisi", icon: "mt_inci", desc: "Evren'in çenesinden düşen dev inci. Can ve şifa verir." },
  zehir: { name: "Akrep Zehri", icon: "mt_zehir", desc: "Zehirdiş'in iğnesinden damlayan kehribar zehir. Kılıca sürülür." },
  golgeipek: { name: "Gölge İpeği", icon: "mt_golgeipek", desc: "Fedailerin gece örtüsü. Hız ve sinsi vuruş verir." },
  devkemigi: { name: "Dev Kemiği", icon: "mt_devkemigi", desc: "Yelbegen'in oyma kemiği. Taş gibi sert, kalkanlara işlenir." },
  gokdemir: { name: "Gök Demiri", icon: "mt_gokdemir", desc: "Tanrı Dağları'na düşmüş yıldız demiri. Efsane kılıçların özü." },
  ayazkurk: { name: "Ayaz Kürkü", icon: "mt_ayazkurk", desc: "Karakoncolos'un buz tutmuş postu. Soğuğa ve korkuya karşı." },
};

export type RegionId = "rum" | "kafkas" | "hazar" | "kipcak" | "karakum" | "horasan" | "maveraunnehir" | "tanri";

export interface AreaBoss {
  id: string;
  name: string;
  icon: string;
  /** Normalize koordinat (0-1); oyun en yakın geçilebilir hücreye yerleştirir. */
  lair: [number, number];
  lairName: string;
  /** En düşük güç basamağı; kahraman güçlendikçe yükselir. */
  tier: number;
  /** Muhafız ordusunun oranı [mızrak, okçu, atlı]. */
  mix: [number, number, number];
  kit: BossKit;
  /** Boss savaşında söylenen sözler. */
  lines: BossLines;
  /** Yenilince söylediği son söz. */
  death: string[];
  /** Bossu yenince bölgede anlatılan efsane. */
  lore: string;
}

export interface BossLines {
  /** Savaş başında, rastgele biri giriş sözü olur. */
  intro?: string[];
  /** Hamlesi isabet edince. */
  hit?: string[];
  /** Hamlesi karşılanınca. */
  hurt?: string[];
  /** İkinci evreye geçerken. */
  rage?: string[];
  /** Canı azaldığında. */
  low?: string[];
  /** Tur başında ara sıra. */
  taunt?: string[];
}

export interface Region {
  id: RegionId;
  name: string;
  /** Bölgenin merkezi (normalize). */
  at: [number, number];
  /** Bu bölgedeki haydut gruplarının adı. */
  foe: string;
  /** Bölge haydutlarının türü. */
  kin?: Kin;
  /** Haritada çete renk tonu. */
  tint: number;
  /** Bölgede düşen nadir malzeme. */
  mat?: RareMat;
  /** Bölgenin çetelerinin savaş meydanı. */
  arena?: Arena;
  /** Bölge düşmanlarının ağırlıklı birlik oranı. */
  mix: [number, number, number];
  boss?: AreaBoss;
  text: string;
}

const breath = (name: string, tell: string, pow = 1.4): BossMove => ({ kind: "nefes", name, tell, pow });
const charge = (name: string, tell: string, pow = 2.2): BossMove => ({ kind: "hucum", name, tell, pow });
const summon = (name: string, tell: string, pow = 0.22, mix: [number, number, number] = [1, 1, 1]): BossMove => ({ kind: "cagir", name, tell, pow, mix });
const curse = (name: string, tell: string, pow = 22): BossMove => ({ kind: "lanet", name, tell, pow });
const heal = (name: string, tell: string, pow = 0.12): BossMove => ({ kind: "sifa", name, tell, pow });
const quake = (name: string, tell: string, pow = 0.55): BossMove => ({ kind: "deprem", name, tell, pow });

const SAHMERAN: AreaBoss = {
  id: "sahmeran", name: "Şahmeran", icon: "heroes/boss_sahmeran", lair: [0.285, 0.41], lairName: "Yılanlı Mağara", tier: 3, mix: [1, 1, 0],
  kit: {
    title: "Yılanların Şahı", intro: "\"Benim sırrımı bilen ya ölür ya da benim olur, yolcu.\"", arena: "magara", kin: "yilan", theme: "kara",
    moves: [curse("Zümrüt bakış", "Şahmeran'ın gözleri yeşil yanıyor; bakan taş kesiliyor!", 24), summon("Yılan seli", "Mağaranın duvarlarından binlerce yılan dökülüyor!", 0.25, [1, 1, 0]), heal("Deri değiştirir", "Şahmeran kabuğunu sıyırıyor; altından yepyeni pullar çıkıyor!", 0.12)],
    rage: { name: "Yılan kuyruğu", text: "Şahmeran kadın suretini bıraktı; mağarayı dolduran dev kuyruğu kıvrılıyor!", atk: 1.35, move: charge("Kuyruk darbesi", "Dev kuyruk geriye kıvrıldı; kayalar sarsılıyor!", 2.4) },
  },
  lines: {
    intro: ["\"Benim sırrımı bilen ya ölür ya da benim olur, yolcu.\"", "\"Camasb da böyle gelmişti. O da gidince ihanet etti.\"", "\"Kulaklarını tıka; yılanlarımın şarkısı tatlıdır.\"", "\"Etimi yiyen hekim olur derler. Önce dişimden geçmen gerek.\""],
    hit: ["\"Zehrim kanında dolaşıyor artık.\"", "\"Tıslayan bin dil; hangisinden kaçacaksın?\"", "\"Taş kesil ve beni dinle.\""],
    hurt: ["\"Pullarım... pullarımı mı kırdın?\"", "\"Sen bilge misin, deli mi?\"", "\"Bu hamleyi kimden öğrendin, ölümlü?\""],
    rage: ["\"Yeter! Gerçek suretimi görmek istedin, gör!\"", "\"Mağaram seni bütün olarak yutacak!\""],
    low: ["\"Sırrım... beni bırak, sana şifamı vereyim...\"", "\"Yılanlarım, beni koruyun!\""],
    taunt: ["\"Kaç adımda düşeceğini sayıyorum.\"", "\"Sıcak kanın kokusu... güzel.\"", "\"Benim adım dualarda geçer; seninki geçmeyecek.\""],
  },
  death: ["\"Etimden şifa olsun... ama sırrımı kimseye söyleme.\"", "\"Yılanlarım dağılacak... ama geri döneceğim. Her bahar döneriz.\""],
  lore: "Kafkas dağlarında, yılanların şahı Şahmeran'ın yenildiği anlatılır. Pulları zehre karşı muska olur.",
};

const EVREN: AreaBoss = {
  id: "evren", name: "Evren", icon: "heroes/boss_evren", lair: [0.448, 0.39], lairName: "Mangışlak Kayalıkları", tier: 3, mix: [1, 1, 0],
  kit: {
    title: "Hazar'ın Ejderi", intro: "Deniz köpürdü; kayaların arasından kanatlı, pullu bir ejderin başı yükseldi.", arena: "deniz", kin: "korsan", theme: "buz",
    moves: [breath("Tuzlu dalga", "Evren ağzını açtı; deniz geri çekiliyor: dalga gelecek!", 1.6), charge("Kıyıya atılış", "Evren kuyruğunu suya vurup sana atıldı!", 2.4), summon("Korsan yandaşları", "Korsan kayıkları kıyıya yanaşıyor; Evren'e kurban getirenler!", 0.22, [1, 1, 0])],
    rage: { name: "Fırtına", text: "Evren göğe kükredi; Hazar'ın üstünde kara bir fırtına koptu!", atk: 1.3, move: quake("Dev dalga", "Ufukta su bir duvar gibi yükseliyor!", 0.6) },
  },
  lines: {
    intro: ["Deniz köpürdü; kayaların arasından kanatlı, pullu bir ejderin başı yükseldi.", "\"Gemilerinin tahtaları dişlerimin arasında kalır, kervancı.\"", "\"Hazar benim. Her dalga benim nefesim.\""],
    hit: ["\"Tuzlu su ciğerlerini yaksın!\"", "\"Boğul, ufak balık!\"", "\"Dalgalarım seni kumsala çarpacak!\""],
    hurt: ["\"Bir insan... Evren'i mi kanattı?\"", "Evren acıyla kükredi; deniz kızıla boyandı.", "\"Bu kadar küstahlığı ancak deniz affeder, ben affetmem!\""],
    rage: ["\"Fırtınam uyandı, artık kıyı da yok!\"", "\"Göğü ve denizi birleştireceğim!\""],
    low: ["\"Derinlere... derinlere çekilmeliyim...\"", "Evren'in kanatları suyu dövüyor; kaçmaya çalışıyor!"],
    taunt: ["\"Gemin olmadan buraya mı geldin? Cesur ya da aptal.\"", "\"İncilerimi mi istiyorsun? Önce dişlerimi say.\""],
  },
  death: ["Evren son kez kükredi ve dalgaların altına gömüldü. Çenesinden kocaman bir inci kumsala yuvarlandı.", "\"Deniz... beni... geri alacak...\""],
  lore: "Mangışlak kıyısında Hazar'ın ejderi Evren yere serildi; o gün korsan kayıkları uzun süre denize açılamadı.",
};

const ZEHIRDIS: AreaBoss = {
  id: "akrep", name: "Zehirdiş", icon: "heroes/boss_akrep", lair: [0.665, 0.37], lairName: "Kara Kum Çukuru", tier: 3, mix: [1, 0, 1],
  kit: {
    title: "Karakum'un Dev Akrebi", intro: "Kum dalgalandı; kum tepesi kalktı ve kıskaçlarını açtı.", arena: "col", kin: "akrep", theme: "ates",
    moves: [charge("Kıskaç saldırısı", "Zehirdiş kıskaçlarını açtı, kumu yararak geliyor!", 2.2), breath("Zehir püskürtür", "Kuyruk kıvrıldı; iğnesinden kehribar zehir damlıyor!", 1.5), summon("Akrep yuvası", "Kumun altından yüzlerce akrep çıkıyor!", 0.28, [1, 0, 0])],
    rage: { name: "Kum fırtınası", text: "Zehirdiş kumun altına daldı; çöl bir kazan gibi kaynıyor!", atk: 1.35, move: quake("Kum çukuru", "Ayağının altındaki kum çöküyor!", 0.6) },
  },
  lines: {
    intro: ["Kum dalgalandı; kum tepesi kalktı ve kıskaçlarını açtı.", "Güneşin altında bir kuyruk kalktı; gölgesi kervan yolunu ikiye böldü.", "Develer kükredi ve kaçtı. Kum tıkırdıyor."],
    hit: ["Zehirdiş'in iğnesi kalkanları delip geçti!", "Kıskaçlar kapandı; çığlıklar kumda boğuldu.", "Kehribar zehir askerlerinin damarlarında yanıyor!"],
    hurt: ["Zehirdiş geriye sendeledi; kabuğundan kara kan sızıyor.", "Kıskacın biri kopup kuma düştü!"],
    rage: ["Zehirdiş kumun altına daldı. Her yer titriyor.", "Kuyruk deli gibi savruluyor; Zehirdiş öfkeden kör!"],
    low: ["Zehirdiş kuyruğunu üstüne kıvırdı; kendini korumaya çalışıyor.", "Kabuğu çatlak çatlak; Zehirdiş yuvasına çekilmek istiyor."],
    taunt: ["Kum tıkırdıyor: yüz bacak bir yerlerde yürüyor.", "Sıcak titreşiyor; iğnenin parıltısı her yerde."],
  },
  death: ["Dev akrep kumun üstüne yığıldı; kuyruğu son kez göğe kalktı ve düştü.", "Zehirdiş'in kabuğu güneşte çatladı; içinden kehribar zehir sızdı."],
  lore: "Karakum'da kervanları yutan Zehirdiş öldürüldü. Kervancılar artık kuyuya korkmadan iniyor.",
};

const FEDAI: AreaBoss = {
  id: "fedai", name: "Fedai Ustası Hasan", icon: "heroes/boss_fedai", lair: [0.465, 0.575], lairName: "Alamut Kayası", tier: 4, mix: [1, 1, 0],
  kit: {
    title: "Alamut'un Gölgesi", intro: "\"Sen beni görmeden önce ben seni üç kez öldürmüştüm.\"", arena: "kale", kin: "fedai", theme: "kara",
    moves: [charge("Gölge hançeri", "Bir gölge kayboldu... arkanda bir nefes!", 2.6), curse("Kara söz", "Ustanın fısıltısı askerlerinin kulağında: \"Kaçın...\"", 24), summon("Fedailer", "Damlarda gölgeler beliriyor: fedailer iniyor!", 0.22, [1, 1, 0])],
    rage: { name: "Kızıl gece", text: "Usta yüzündeki örtüyü attı; fedailer bıçaklarını dudaklarına götürdü!", atk: 1.4, move: breath("Hançer yağmuru", "Gecenin içinden yüzlerce hançer parlıyor!", 1.6) },
  },
  lines: {
    intro: ["\"Sen beni görmeden önce ben seni üç kez öldürmüştüm.\"", "\"Yastığının altına hançer bırakmıştım. Görmedin mi?\"", "\"Kale yüksek, yol dar. Geri dönmek için hâlâ vaktin var.\"", "\"Hükümdarlar benden korkar. Sen kim oluyorsun?\""],
    hit: ["\"Gördün mü? Gölgeden çıkıp gölgeye döndüm.\"", "\"Bir, iki... üçüncü hançer kalbine.\"", "\"Sessizlik en keskin bıçaktır.\""],
    hurt: ["\"Beni okudun... nasıl?\"", "\"İlk kez biri hançerimi savuşturdu.\"", "\"Ustamın bile yapamadığını yaptın.\""],
    rage: ["\"Artık saklanmayacağım. Yüzüme bak!\"", "\"Fedailerim, cennet bu gece!\""],
    low: ["\"Kale... kale düşmemeli...\"", "Usta duvara yaslandı; nefesi hırıltılı."],
    taunt: ["\"Aşçın da bizden, kervancın da.\"", "\"Kimin sana ihanet edeceğini biliyorum. Sen bilmiyorsun.\""],
  },
  death: ["\"Ben ölürsem yerime bin kişi gelir... ama hiçbiri benim kadar sabırlı olmaz.\"", "Usta gülümsedi: \"Seni öldürmesi için birini çoktan gönderdim... belki.\""],
  lore: "Alamut kayalarında fedailerin ustası düştü. Kervansaraylarda bir süre kimse yastığının altını yoklamadı.",
};

const YELBEGEN: AreaBoss = {
  id: "yelbegen", name: "Yelbegen", icon: "heroes/boss_yelbegen", lair: [0.33, 0.17], lairName: "Dev Kemikli Tepe", tier: 4, mix: [1, 0, 1],
  kit: {
    title: "Yedi Başlı Dev", intro: "Tepede yedi baş birden döndü; yedi ağızdan aynı kahkaha yükseldi.", arena: "ordugah", kin: "kipcak", theme: "bozkir",
    moves: [quake("Yeri döver", "Yelbegen sopasını iki eliyle kaldırdı!", 0.55), charge("Yedi baş hücumu", "Yedi baş aynı anda kükredi; dev koşuyor!", 2.4), summon("Kıpçak kölelerini çağırır", "Devin çevresindeki Kıpçak çadırlarından adamlar fırlıyor!", 0.22, [0, 0, 1])],
    rage: { name: "Başlar ayrılır", text: "Devin başlarından biri koptu ama yerine ikisi çıktı!", atk: 1.35, move: curse("Yedi kahkaha", "Yedi baş aynı anda gülüyor; askerlerinin aklı dağılıyor!", 26) },
  },
  lines: {
    intro: ["Tepede yedi baş birden döndü; yedi ağızdan aynı kahkaha yükseldi.", "\"Yedi başım var, yedisi de aç!\"", "\"Kıpçaklar bana her ay bir at verir. Sen kaç at edersin?\""],
    hit: ["\"Bir başım ezdi, altısı güldü!\"", "Sopanın inişiyle yer yarıldı; askerlerin savruldu.", "\"Ezildin mi, küçük adam?\""],
    hurt: ["Başlardan biri kükreyip öbürüne kızdı: \"Sen bakıyordun!\"", "\"Kim vurdu? Hangimize vurdu?\"", "Yelbegen'in dizi büküldü; tepe sarsıldı."],
    rage: ["\"Bir baş gitti, iki baş geldi!\"", "Dev kükredi: yedi sesin yedisi de öfkeli."],
    low: ["Başlar birbirine bağırıyor: \"Kaçalım!\" \"Hayır, savaşalım!\"", "\"Yeter... yedi başım da ağrıyor...\""],
    taunt: ["Başlardan biri esniyor; öbürü seni süzüyor.", "\"Seni kaynatıp çorba mı yapsak, yoksa çiğ mi yesek?\""],
  },
  death: ["Yedi baş birer birer yere düştü; son baş \"Biz kardeştik...\" diye inledi.", "Dev tepenin üstüne yıkıldı; kemikleri ay ışığında parladı."],
  lore: "Kıpçak bozkırında yedi başlı Yelbegen devrildi. Obalar kemiklerini kalkanlarına işledi.",
};

const AKBARS: AreaBoss = {
  id: "akbars", name: "Ak Bars", icon: "heroes/boss_akbars", lair: [0.865, 0.275], lairName: "Buzlu Kartal Kayası", tier: 5, mix: [0, 1, 1],
  kit: {
    title: "Tanrı Dağları'nın Leoparı", intro: "Karda bir iz yoktu; sonra bir gölge düştü ve iki buz mavisi göz parladı.", arena: "zirve", kin: "bars", theme: "buz",
    moves: [charge("Kar sıçrayışı", "Ak Bars kayanın üstünde gerildi: sıçrayacak!", 2.6), breath("Buz kükremesi", "Ak Bars kükremeye hazırlanıyor; nefesi buz kesiyor!", 1.5), curse("Av bakışı", "Leoparın gözleri birliğinin en zayıfını seçti!", 22)],
    rage: { name: "Gök Bars", text: "Leoparın beneklerinde mavi ışık yandı; Tengri'nin avcısı uyandı!", atk: 1.4, move: quake("Çığ", "Kükremesi dağı sarstı; kar kütlesi kayıyor!", 0.6) },
  },
  lines: {
    intro: ["Karda bir iz yoktu; sonra bir gölge düştü ve iki buz mavisi göz parladı.", "Kayalarda bir hırıltı dolaştı. Atlar kişnedi, kimse kıpırdamadı.", "Ak Bars kuyruğunu kıvırdı; avını seçiyor."],
    hit: ["Ak Bars'ın pençeleri zırhları kâğıt gibi yırttı.", "Bir sıçrayış, bir çığlık; leopar yine kayanın üstünde.", "Karın üstünde kızıl izler kaldı."],
    hurt: ["Ak Bars geri sıçradı; böğründen kan damlıyor.", "Leopar ilk kez hırladı: öfke değil, şaşkınlık."],
    rage: ["Benekleri gök gibi yanıyor: Ak Bars artık av değil, avcı!", "Leoparın kükremesi bütün vadide yankılandı."],
    low: ["Ak Bars topallıyor ama gözleri hâlâ sende.", "Leopar kayalara doğru geriliyor; kaçmayı mı düşünüyor?"],
    taunt: ["Rüzgâr döndü; leopar kokunu aldı.", "Kayaların ardında bir kuyruk ucu belirip kayboldu."],
  },
  death: ["Ak Bars kara yattı; gözlerindeki mavi ışık yavaşça söndü.", "Leopar son kez başını kaldırdı, göğe baktı ve kar onu örttü."],
  lore: "Tanrı Dağları'nın beyaz leoparı yenildi. Kaşgarlı demirciler, ininde bulunan gök demirini hâlâ anlatır.",
};

const KARAKONCOLOS: AreaBoss = {
  id: "karakoncolos", name: "Karakoncolos", icon: "heroes/boss_karakoncolos", lair: [0.165, 0.53], lairName: "Zemheri Ormanı", tier: 3, mix: [1, 1, 0],
  kit: {
    title: "Zemheri'nin Kara Kıllısı", intro: "\"Kara mı, kar mı? Bil bakalım!\" Kıllı kara bir şey ağaçların arasından sırıttı.", arena: "orman", kin: "golge", theme: "kara",
    moves: [curse("Bilmece", "Karakoncolos bilmece soruyor; yanlış cevap veren donuyor!", 24), charge("Kar fırtınasıyla atılır", "Ağaçların arasından tipi gibi geliyor!", 2.2), summon("Zemheri gölgeleri", "Karın altından kara gölgeler doğruluyor!", 0.22)],
    rage: { name: "Zemheri gecesi", text: "Ay karardı; zemheri ayazı kemiklere işliyor!", atk: 1.35, move: breath("Ayaz nefesi", "Karakoncolos derin bir nefes çekti; ağaçlar buz tutuyor!", 1.6) },
  },
  lines: {
    intro: ["\"Kara mı, kar mı? Bil bakalım!\" Kıllı kara bir şey ağaçların arasından sırıttı.", "\"Zemheri benim ayım. Kapını çalan ben değilsem kimdir?\"", "\"Kırk gece ayaz, kırk bilmece. Hangisini istersin?\""],
    hit: ["\"Bilemedin! Donsun parmakların!\"", "\"Kar değil, kara! Hah hah!\"", "Kıllı pençeler ayaz gibi kemiğe işledi."],
    hurt: ["\"Bildin mi? Kimse bilmezdi!\"", "\"Ateş mi o? Uzak tut onu benden!\""],
    rage: ["\"Ay da benim, gece de benim!\"", "Karakoncolos uludu; orman buz kesti."],
    low: ["\"Horoz ötmeden... horoz ötmeden kaçmalıyım...\"", "\"Bilmece bitti... bitti...\""],
    taunt: ["\"Bilmece: Ağzı yok konuşur, ayağı yok yürür. Nedir?\"", "\"Ateşin söndü mü? Söner, söner...\""],
  },
  death: ["Horoz öttü; Karakoncolos bir kar yığınına dönüşüp dağıldı.", "\"Zemheri... gelecek yıl yine gelir...\""],
  lore: "Anadolu ormanlarında zemheri gecelerinin kara kıllısı yenildi. Köylüler o kış kapılarını gönül rahatlığıyla açtı.",
};

export const REGIONS: Region[] = [
  { id: "rum", name: "Rum Diyarı", at: [0.16, 0.56], foe: "Bizans Paralıları", tint: 0xd0c8ff, mat: "ayazkurk", arena: "orman", mix: [0.55, 0.25, 0.2], boss: KARAKONCOLOS, text: "Ormanlı Anadolu yaylaları. Paralı askerler ve zemheride Karakoncolos." },
  { id: "kafkas", name: "Kafkas Dağları", at: [0.3, 0.43], foe: "Dağ Haydutları", tint: 0xa8e8a0, mat: "pul", mix: [0.4, 0.5, 0.1], boss: SAHMERAN, text: "Sarp geçitler, okçu dağlılar ve mağaralarda Şahmeran." },
  { id: "hazar", name: "Hazar Kıyısı", at: [0.43, 0.32], foe: "Hazar Korsanları", kin: "korsan", tint: 0x9ad8ff, mat: "inci", mix: [0.55, 0.45, 0], boss: EVREN, text: "Tuzlu kıyılar, korsan kayıkları ve Mangışlak'ta Evren ejderi." },
  { id: "kipcak", name: "Deşt-i Kıpçak", at: [0.32, 0.16], foe: "Kıpçak Akıncıları", kin: "kipcak", tint: 0xffd8a0, mat: "devkemigi", mix: [0.15, 0.3, 0.55], boss: YELBEGEN, text: "Uçsuz kuzey bozkırı. Atlı akıncılar ve yedi başlı Yelbegen." },
  { id: "karakum", name: "Karakum Çölü", at: [0.64, 0.43], foe: "Çöl Akıncıları", tint: 0xffc070, mat: "zehir", arena: "col", mix: [0.3, 0.3, 0.4], boss: ZEHIRDIS, text: "Kızgın kum tepeleri. Deve süvarileri ve dev akrep Zehirdiş." },
  { id: "horasan", name: "Horasan", at: [0.53, 0.63], foe: "Haşhaşi Fedaileri", kin: "fedai", tint: 0xc8a0ff, mat: "golgeipek", mix: [0.55, 0.45, 0], boss: FEDAI, text: "Kaleler ve vahalar. Gölgede bekleyen fedailer ve Alamut ustası." },
  { id: "maveraunnehir", name: "Mâverâünnehir", at: [0.75, 0.52], foe: "Haramiler", tint: 0xffffff, mix: [0.5, 0.35, 0.15], text: "İki ırmak arası, ipek yolunun kalbi. Haramiler kervan pususunda." },
  { id: "tanri", name: "Tanrı Dağları", at: [0.9, 0.3], foe: "Dağ Kırgızları", tint: 0xc0e8ff, mat: "gokdemir", arena: "zirve", mix: [0.2, 0.5, 0.3], boss: AKBARS, text: "Buzlu zirveler, yıldız demiri ve beyaz leopar Ak Bars." },
];
export const REGION_BY_ID: Record<RegionId, Region> = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, Region>;
export const AREA_BOSSES: AreaBoss[] = REGIONS.flatMap((r) => (r.boss ? [r.boss] : []));
for (const b of AREA_BOSSES) BOSS_KITS[b.name] = b.kit;

export function regionAt(x: number, y: number): Region {
  const nx = x / W;
  const ny = y / H;
  let best = REGIONS[0];
  let bd = Infinity;
  for (const r of REGIONS) {
    const d = Math.hypot((nx - r.at[0]) * 1.4, ny - r.at[1]);
    if (d < bd) {
      bd = d;
      best = r;
    }
  }
  return best;
}

export function bossRegion(b: AreaBoss): Region {
  return REGIONS.find((r) => r.boss === b)!;
}

/** Bölge bossunun respawn süresi (gerçek zaman). */
export const DEN_RESPAWN = 60 * 60000;

export function denTier(b: AreaBoss, lv: number): number {
  return Math.max(b.tier, Math.min(8, Math.floor(2 + lv / 5)));
}

export function denBoss(b: AreaBoss, lv: number): Boss {
  const t = denTier(b, lv);
  return { name: b.name, icon: b.icon, hp: Math.round(150 * Math.pow(t, 1.5)), atk: Math.round(7 * Math.pow(t, 1.32)), def: 3 + t * 3 };
}

export function denGuard(b: AreaBoss, lv: number): Army {
  const t = denTier(b, lv);
  const n = Math.round(9 * Math.pow(1.62, t - 1));
  const s = b.mix[0] + b.mix[1] + b.mix[2];
  return { spear: Math.round((n * b.mix[0]) / s), archer: Math.round((n * b.mix[1]) / s), horse: Math.round((n * b.mix[2]) / s) };
}

/** Bölgeye göre çete ordusunu yeniden dağıtır: bozkırda atlı, dağda okçu ağırlıklı. */
export function regionArmy(a: Army, r: Region): Army {
  const n = a.spear + a.archer + a.horse;
  const [sp, ar, ho] = r.mix;
  const t = sp + ar + ho;
  const h = Math.round((n * ho) / t);
  const ac = Math.round((n * ar) / t);
  return { spear: Math.max(0, n - h - ac), archer: ac, horse: h };
}

// ---------- boss sözleri ----------

type Theme = BossKit["theme"];
const THEME_LINES: Record<Theme, Required<BossLines>> = {
  kara: {
    intro: [],
    hit: ["\"Yerin dibine kadar seni ezeceğim!\"", "\"Kanın taşlara iyi yakışıyor.\"", "\"Diz çök!\""],
    hurt: ["\"Bu... nasıl olur?\"", "\"Şansın bir kez yaver gitti.\"", "\"Bunu ödeyeceksin!\""],
    rage: ["\"Artık oyun bitti!\"", "\"Gerçek gücümü görmek istedin, işte!\""],
    low: ["\"Hayır... böyle bitmemeli...\"", "\"Bir adım daha atarsan...\""],
    taunt: ["\"Korkunun kokusunu alıyorum.\"", "\"Senin gibilerin mezarı çoktur buralarda.\""],
  },
  buz: {
    intro: [],
    hit: ["\"Don ve kırıl!\"", "\"Ayaz kemiklerine işlesin.\"", "Buz kristalleri askerlerinin yüzünü kesiyor."],
    hurt: ["\"Ateşin mi var, yüreğin mi?\"", "Buzlu zırhında bir çatlak açıldı."],
    rage: ["\"Kış seni yutacak!\"", "Hava bir anda kesildi; nefesler buz tuttu."],
    low: ["\"Bahar... bahar gelmemeli...\"", "Buzlar eriyor; düşmanın gücü sızıyor."],
    taunt: ["\"Soğuk mu? Daha başlamadık.\"", "Rüzgâr uluyor: kimin için?"],
  },
  ates: {
    intro: [],
    hit: ["\"Kül ol!\"", "\"Alevlerim seni çağırıyor.\"", "Kızgın bir dalga safları yaladı."],
    hurt: ["\"Ateşimi söndüremezsin!\"", "Kıvılcımlar söndü; düşman sendeledi."],
    rage: ["\"Her şey yansın!\"", "Ateş göğe yükseldi; gece gündüz oldu."],
    low: ["\"Közüm... közüm sönüyor...\"", "Alevler titriyor, cılızlaşıyor."],
    taunt: ["\"Sıcak mı geldi?\"", "Kor gözler seni süzüyor."],
  },
  mor: {
    intro: [],
    hit: ["\"Ruhun benim olacak.\"", "\"Karanlık seni sarıyor.\"", "Mor ışık askerlerinin gözlerini kör etti."],
    hurt: ["\"Atalarının ruhu mu seni koruyor?\"", "Gölgeler çığlık atarak dağıldı."],
    rage: ["\"Dokuz kat aşağıdan sesler yükseliyor!\"", "Mor alevler duvarlara tırmanıyor."],
    low: ["\"Erlik... bana güç ver...\"", "Gölgeler incelip saydamlaşıyor."],
    taunt: ["\"Ölüler de seni bekliyor.\"", "Fısıltılar: adını biliyorlar."],
  },
  bozkir: {
    intro: [],
    hit: ["\"Bozkırda zayıf olan ezilir!\"", "\"Atların tozunu yut!\"", "\"Tuğum senin başının üstünde dalgalanacak!\""],
    hurt: ["\"İyi vurdun, yiğit!\"", "\"Bu hamleye bozkır şahit olsun.\""],
    rage: ["\"Davullar çalsın!\"", "\"Artık sonuna kadar!\""],
    low: ["\"Atımı getirin!\"", "\"Bozkır geniş... kaçacak yer çok...\""],
    taunt: ["\"Gözlerinde korku var.\"", "\"Senin gibileri kahvaltıda yerim.\""],
  },
};

/** Bu bossa ait söz havuzundan birini seçer; yoksa temasına uygun genel söz. */
export function bossLine(name: string, theme: Theme, k: keyof BossLines): string | null {
  const ab = AREA_BOSSES.find((b) => b.name === name);
  const own = ab?.lines[k] ?? [];
  const pool = own.length ? own : THEME_LINES[theme][k];
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// ---------- yöre işi eşyalar ----------

export interface Yore {
  id: string;
  /** "Semerkant işi" etiketi. */
  name: string;
  /** Bu yörenin ustalarının üstün olduğu eşya türleri. */
  slots: Slot[];
  /** Silah türü tercihi. */
  kinds?: string[];
  desc: string;
  apply: (it: Item, t: number) => void;
}

const m3 = (v: number) => Math.round(v * 1000) / 1000;
const addMod = (it: Item, k: string, v: number) => {
  const mods = (it.mods ??= {}) as Record<string, number>;
  mods[k] = m3((mods[k] ?? 0) + v);
};

export const YORE: Record<string, Yore> = {
  constantinople: { id: "constantinople", name: "Bizans işi", slots: ["zirh", "kalkan"], desc: "Kat kat lamel: savunma +%15.", apply: (it, t) => { it.def = Math.round(it.def * 1.15) + 1; it.hp += t; } },
  konya: { id: "konya", name: "Selçuklu işi", slots: ["silah", "kalkan"], desc: "Çift başlı kartal damgası: saldırı +%8, can +%5.", apply: (it, t) => { if (it.atk) it.atk = Math.round(it.atk * 1.08) + 1; it.hp += 2 * t; } },
  tabriz: { id: "tabriz", name: "Tebriz işi", slots: ["tilsim", "zirh"], desc: "Halı desenli: karizma artar.", apply: (it, t) => { it.kar += 1 + Math.floor(t / 2); } },
  rey: { id: "rey", name: "Rey çeliği", slots: ["silah"], desc: "Gece de susmayan örsler: kritik +%3.", apply: (it) => { it.crit = m3(it.crit + 0.03); } },
  nishapur: { id: "nishapur", name: "Nişabur firuzesi", slots: ["tilsim"], desc: "Firuze kakma: liderlik artar.", apply: (it, t) => { it.lid += 1 + Math.floor(t / 2); } },
  merv: { id: "merv", name: "Merv işi", slots: ["zirh", "tilsim"], desc: "İnce ipek astar: hız +%3.", apply: (it) => addMod(it, "spd", 0.03) },
  bukhara: { id: "bukhara", name: "Buhara işi", slots: ["tilsim", "kalkan"], desc: "Medrese duasıyla: tecrübe +%5.", apply: (it) => addMod(it, "xp", 0.05) },
  samarkand: { id: "samarkand", name: "Semerkant çeliği", slots: ["silah"], desc: "Dalgalı çelik: saldırı +%12.", apply: (it) => { it.atk = Math.round(it.atk * 1.12) + 1; } },
  kashgar: { id: "kashgar", name: "Kaşgar yeşimi", slots: ["tilsim", "silah"], desc: "Yeşim kabza: ganimet +%6.", apply: (it) => addMod(it, "loot", 0.06) },
  rum: { id: "rum", name: "Ayaz işi", slots: ["zirh"], desc: "Kürk astar: can +%15.", apply: (it, t) => { it.hp = Math.round(it.hp * 1.15) + t; } },
  kafkas: { id: "kafkas", name: "Kafkas işi", slots: ["kalkan", "silah"], desc: "Dağ demircisi: savunma +2, saldırı +1.", apply: (it, t) => { it.def += 1 + Math.floor(t / 2); if (it.atk) it.atk += 1; } },
  hazar: { id: "hazar", name: "Hazar işi", slots: ["tilsim", "zirh"], desc: "İnci işlemeli: can artar.", apply: (it, t) => { it.hp += 3 * t; } },
  kipcak: { id: "kipcak", name: "Kıpçak işi", slots: ["silah", "tilsim"], desc: "Bozkır yayı: ordu gücü +%3.", apply: (it) => addMod(it, "army", 0.03) },
  karakum: { id: "karakum", name: "Çöl işi", slots: ["silah"], desc: "Zehir oluklu: saldırı ve kritik.", apply: (it, t) => { it.atk += Math.ceil(t / 2); it.crit = m3(it.crit + 0.015); } },
  horasan: { id: "horasan", name: "Fedai işi", slots: ["silah", "zirh"], desc: "Gölge işi: kritik +%2, hız +%2.", apply: (it) => { it.crit = m3(it.crit + 0.02); addMod(it, "spd", 0.02); } },
  maveraunnehir: { id: "maveraunnehir", name: "Soğd işi", slots: ["tilsim"], desc: "Soğd tüccar mührü: yük +20.", apply: (it) => addMod(it, "carry", 20) },
  tanri: { id: "tanri", name: "Gök demiri", slots: ["silah", "kalkan"], desc: "Yıldız demiri: saldırı +%10, savunma +1.", apply: (it) => { if (it.atk) it.atk = Math.round(it.atk * 1.1) + 1; it.def += 1; } },
};

/** Eşyaya yöre işçiliği uygular (bir kez). */
export function applyYore(it: Item, org: string): Item {
  const o = YORE[org];
  if (!o || it.org || it.slot === "at") return it;
  o.apply(it, it.tier);
  it.org = org;
  return it;
}

/** Şehrin demircisinin üstün olduğu eşya türleri. */
export function yoreSlots(org: string): Slot[] {
  return YORE[org]?.slots ?? [];
}

// ---------- destan birlikleri ----------

export interface Legion {
  name: string;
  desc: string;
  atk: number;
  hp: number;
  wage: number;
  cost: Partial<Record<RareMat, number>>;
}

export const LEGIONS: Record<Unit, Legion> = {
  spear: { name: "Gök Demir Muhafızları", desc: "Yıldız demirinden mızrak, dev kemiğinden kalkan. Saldırı ve can ×1.25.", atk: 1.25, hp: 1.25, wage: 1.3, cost: { gokdemir: 3, devkemigi: 3 } },
  archer: { name: "Şahmeran Okçuları", desc: "Okları akrep zehrine bandırılmış, yılan pulu zırhlı. Saldırı ×1.35, can ×1.1.", atk: 1.35, hp: 1.1, wage: 1.3, cost: { zehir: 3, pul: 3 } },
  horse: { name: "Ayaz Atlıları", desc: "Kürk pelerinli, inci koşumlu, gölge kadar hızlı. Saldırı ×1.25, can ×1.2.", atk: 1.25, hp: 1.2, wage: 1.3, cost: { ayazkurk: 3, inci: 2, golgeipek: 2 } },
};

/** Bölge bossu ganimetinden çıkan efsane tarifleri (demircide dökülür). */
export interface Relic {
  id: string;
  name: string;
  slot: Slot;
  icon: string;
  desc: string;
  cost: Partial<Record<RareMat | "ruh" | "nisan" | "gold", number>>;
  mods: Record<string, number>;
  zl: number;
}

export const RELICS: Relic[] = [
  { id: "sahmeran", name: "Şahmeran Tacı", slot: "tilsim", icon: "mt_sahmeran", zl: 4, desc: "Zümrüt pullu taç: tur başı şifa +%2, ordu +%4.", cost: { pul: 4, ruh: 3, gold: 1800 }, mods: { heal: 0.02, army: 0.04 } },
  { id: "evren", name: "Evren Dişi", slot: "silah", icon: "mt_inci", zl: 5, desc: "Ejder dişinden kılıç: saldırı +%10, can +%8.", cost: { inci: 4, gokdemir: 1, ruh: 3, gold: 2200 }, mods: { atk: 0.1, hp: 0.08 } },
  { id: "zehirdis", name: "Zehirdiş İğnesi", slot: "silah", icon: "mt_zehir", zl: 5, desc: "Akrep iğnesinden hançer-kılıç: kritik +%8, saldırı +%5.", cost: { zehir: 5, ruh: 3, gold: 2000 }, mods: { crit: 0.08, atk: 0.05 } },
  { id: "golge", name: "Gölge Örtüsü", slot: "zirh", icon: "mt_golgeipek", zl: 6, desc: "Fedai ipeği: hız +%8, kritik +%4, savunma +%5.", cost: { golgeipek: 5, ruh: 3, gold: 2200 }, mods: { spd: 0.08, crit: 0.04, def: 0.05 } },
  { id: "yelbegen", name: "Yelbegen Kalkanı", slot: "kalkan", icon: "mt_devkemigi", zl: 6, desc: "Dev kemiğinden kalkan: savunma +%14, can +%10.", cost: { devkemigi: 5, ruh: 3, gold: 2400 }, mods: { def: 0.14, hp: 0.1 } },
  { id: "akbars", name: "Gök Demir Pala", slot: "silah", icon: "mt_gokdemir", zl: 8, desc: "Yıldız demirinden pala: saldırı +%16, kritik +%4, ordu +%4.", cost: { gokdemir: 6, ruh: 5, nisan: 2, gold: 4000 }, mods: { atk: 0.16, crit: 0.04, army: 0.04 } },
  { id: "ayaz", name: "Ayaz Postu", slot: "zirh", icon: "mt_ayazkurk", zl: 5, desc: "Karakoncolos kürkü: can +%15, savunma +%8.", cost: { ayazkurk: 5, ruh: 3, gold: 2000 }, mods: { hp: 0.15, def: 0.08 } },
  { id: "yedi", name: "Yedi İklim Mührü", slot: "tilsim", icon: "seal", zl: 12, desc: "Yedi bölgenin özünden: tecrübe +%10, ganimet +%10, ordu +%6, saldırı +%6.", cost: { pul: 2, inci: 2, zehir: 2, golgeipek: 2, devkemigi: 2, gokdemir: 2, ayazkurk: 2, nisan: 3, gold: 8000 }, mods: { xp: 0.1, loot: 0.1, army: 0.06, atk: 0.06 } },
];
export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map((r) => [r.id, r]));
