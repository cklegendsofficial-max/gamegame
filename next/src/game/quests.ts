import { CITIES } from "../world/gen";
import type { Res } from "./data";
import type { Game } from "./game";
import { CAPITAL } from "./state";

/** İlk kan çetesinin kamp işareti (normal kamplarla karışmasın). */
export const FIRST_BLOOD_CAMP = -2;
export const FIRST_BLOOD_ARMY = { spear: 3, archer: 1, horse: 0 };

export interface Quest {
  title: string;
  text: string;
  done: (g: Game) => boolean;
  reward: Partial<Res>;
  goto?: (g: Game) => { x: number; y: number } | null;
  /** Yalnızca kölelik dönemine ait; hürriyetten sonra listeden düşer. */
  slave?: boolean;
}

export const QUESTS: Quest[] = [
  { title: "Efendinin ocakları", text: "Semerkant yakınındaki ormana, taş ocağına ya da tarlaya git. 3 vardiya çalış (göreve dokun → işaret).", done: (g) => g.s.c.shifts >= 3, reward: { gold: 5 }, goto: (g) => g.s.nodes[g.nearestWorkNode()], slave: true },
  { title: "Hürriyet bedeli", text: "60 akçe biriktir → Semerkant → Efendi sekmesi → «Hürriyetini satın al».", done: (g) => g.s.free, reward: { gold: 20 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }), slave: true },
  { title: "İlk silah", text: "Semerkant → Demirci → bir silah al → Kahraman ekranından kuşan.", done: (g) => !!g.eq("silah"), reward: { gold: 15 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }) },
  { title: "İlk döküm", text: "Pazardan demir/deri/pamuk al → şehir Atölyesi → bir slotta Dök. Bitince Kahraman → Teçhizat'tan kuşan.", done: (g) => g.s.c.crafted >= 1, reward: { gold: 20 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }) },
  { title: "Destanın yolu", text: "Buhara'ya git, Derviş Korkut'u bul (Kara Tamga Destanı · Bölüm 1).", done: (g) => g.s.story.ch >= 1 || !!g.hasComp("korkut"), reward: { gold: 25 }, goto: () => CITIES.find((c) => c.id === "bukhara")! },
  { title: "Talim", text: "Bir şehrin talim meydanında kılıç ya da ok talimi yap.", done: (g) => g.s.c.trains >= 1, reward: { gold: 20 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }) },
  { title: "Yoldaşlar", text: "Bir köye git ve en az 3 gönüllü topla.", done: (g) => g.s.c.recruits >= 3, reward: { gold: 30 }, goto: (g) => g.nearest(g.s.villages) },
  { title: "İlk kan", text: "Semerkant kapısının dışındaki küçük çeteyi yen. Önce silahını kuşanan.", done: (g) => g.s.c.wins >= 1, reward: { gold: 40 }, goto: (g) => g.s.bandits.find((b) => b.camp === FIRST_BLOOD_CAMP) ?? g.nearest(g.s.bandits.filter((b) => g.isExplored(b.x, b.y))) ?? g.nearest(g.s.camps) },
  { title: "Güçlen", text: "3. seviyeye ulaş ve stat puanlarını Kahraman ekranından dağıt.", done: (g) => g.s.hero.lv >= 3 && g.s.hero.points === 0, reward: { gold: 40 } },
  { title: "İpek Yolu tüccarı", text: "Bir şehirde ucuz mal al, başka şehirde pahalıya sat. Toplam 150 altın kâr et.", done: (g) => g.s.c.profit >= 150, reward: { gold: 60 }, goto: () => CITIES[6] },
  { title: "Ödül avcısı", text: "Bir handan ödül ilanı al ve bir harami kampını yerle bir et.", done: (g) => g.s.c.camps >= 1, reward: { gold: 100 }, goto: (g) => g.nearest(g.s.camps.filter((c) => c.alive)) },
  { title: "Kendi hanın", text: "Semerkant dışında bir şehrin hanında kendi kervansarayını kur. Kasası sen yoldayken altın biriktirir.", done: (g) => g.seraiCount() >= 1, reward: { gold: 120 }, goto: () => CITIES[6] },
  { title: "Beylik", text: "40 şöhret ve 1500 altın topla, Semerkant'ta kendi beyliğini kur.", done: (g) => g.s.beylik, reward: { wood: 200, stone: 200 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }) },
  { title: "Başkenti büyüt", text: "Sarayı 2. seviyeye çıkar.", done: (g) => g.bld("saray") >= 2, reward: { gold: 200 }, goto: () => ({ x: CAPITAL.x, y: CAPITAL.y }) },
  { title: "Kaynak seferi", text: "Başkent garnizonundan bir kaynak noktasına toplama seferi gönder.", done: (g) => g.s.c.marched >= 1, reward: { food: 300, wood: 300 }, goto: (g) => g.nearest(g.s.nodes) },
];
