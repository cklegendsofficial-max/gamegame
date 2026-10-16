import type { GameState } from "./state";

/** Oyuncunun hürriyetten sonra seçtiği, bitig/chain sisteminden ayrı opsiyonel destanlar: "kendi hikâyeni yaz". */

export interface SagaGoal {
  text: string;
  need: number;
  of: (s: GameState) => number;
}

export interface SideSagaReward {
  gold?: number;
  renown?: number;
  title?: string;
}

export interface SideSaga {
  id: string;
  title: string;
  icon: string;
  desc: string;
  startCost: { gold?: number; renown?: number };
  goals: SagaGoal[];
  reward: SideSagaReward;
  ending: string;
}

export const SIDE_SAGAS: SideSaga[] = [
  {
    id: "tuccar",
    title: "Tüccar Destanı",
    icon: "coins",
    desc: "Kervanının adı İpek Yolu'nun bir ucundan öbür ucuna ulaşsın; her tüccar seninle anılmak istesin.",
    startCost: { gold: 150 },
    goals: [
      { text: "Toplam 1500 altın ticaret kârı yap", need: 1500, of: (s) => s.c.profit },
      { text: "7 sefer tamamla (kervan sözleşmesi ya da deniz seferi)", need: 7, of: (s) => (s.c.contracts ?? 0) + (s.c.voyages ?? 0) },
      { text: "Toplam 500 altın yatırım yap (harca)", need: 500, of: (s) => s.c.spent },
    ],
    reward: { gold: 600, renown: 25, title: "Tüccarların Hamisi" },
    ending: "Semerkant çarşısında senin adınla anılan bir kervansaray kapısı açıldı. Tüccarlar artık senin tamganı gördüğünde yol vergisi istemiyor; adın İpek Yolu'nun bir ucundan öbür ucuna, kervan kervan taşınıyor.",
  },
  {
    id: "intikam",
    title: "İntikam Destanı",
    icon: "swords",
    desc: "Sana ya da halkına kötülük edenlerin hesabını bozkırın her köşesinde sor; kimse cezasız kalmasın.",
    startCost: { renown: 10 },
    goals: [
      { text: "40 düşman devir", need: 40, of: (s) => s.kills },
      { text: "3 harami kampını dağıt", need: 3, of: (s) => s.c.camps },
      { text: "Bir can düşmanını öldür", need: 1, of: (s) => s.c.slain },
    ],
    reward: { gold: 300, renown: 40, title: "Kan Davası Bitiren" },
    ending: "Son düşmanın da toprağa düştüğünde, bozkırda bir ağıt değil bir zafer türküsü yükseldi. Kan davan kapandı; artık geceleri sırtını dönüp uyuyabilirsin.",
  },
  {
    id: "ozan",
    title: "Ozan Destanı",
    icon: "scroll",
    desc: "Kopuzun seni türkülerde yaşatsın; adın hanlarda, çarşılarda, çoban ateşlerinde dolaşsın.",
    startCost: { gold: 80 },
    goals: [
      { text: "3 destan yakılsın", need: 3, of: (s) => s.songs?.length ?? 0 },
      { text: "Bitig'e 10 sayfa ekle", need: 10, of: (s) => s.bitig?.length ?? 0 },
      { text: "500 şöhret kazan", need: 500, of: (s) => Math.round(s.renown) },
    ],
    reward: { gold: 200, renown: 60, title: "Bozkırın Ozanı" },
    ending: "Bir çoban ateşinin başında, hiç tanımadığın bir ozan senin adını andığı bir türkü söyledi. O gün anladın: artık hikâyen senden büyük, bütün bozkırın malı oldu.",
  },
  {
    id: "fatih",
    title: "Fatih Destanı",
    icon: "siege",
    desc: "Kılıcınla şehirler fethet, tuğun yabancı burçlarda dalgalansın; bozkır senin fetihlerinle büyüsün.",
    startCost: { gold: 300 },
    goals: [
      { text: "2 şehir fethet", need: 2, of: (s) => s.c.conquests },
      { text: "20 savaş kazan", need: 20, of: (s) => s.c.wins },
      { text: "2 kale fethet", need: 2, of: (s) => s.c.forts },
    ],
    reward: { gold: 500, renown: 80, title: "Fetihler Kağanı" },
    ending: "Son kale de senin tuğuna eğildiğinde, ozanlar seni artık yalnız bir bey değil bir fetihler çağının adı olarak anmaya başladı. Burçlarda senin rengin, pazarlarda senin adın.",
  },
  {
    id: "gezgin",
    title: "Gezgin Destanı",
    icon: "map/kurgan",
    desc: "Bozkırın her köşesini gör, her kurganı aç, her şehrin kapısından geç.",
    startCost: { gold: 60 },
    goals: [
      { text: "5 Kurgan Taşı devir", need: 5, of: (s) => s.c.kurgans },
      { text: "Yeraltında 25. kata in", need: 25, of: (s) => s.deepBest },
      { text: "7 şehrin kapısından geç", need: 7, of: (s) => s.visited?.length ?? 0 },
    ],
    reward: { gold: 250, renown: 50, title: "Bozkırın Gezgini" },
    ending: "Haritanda artık karanlık kalan köşe yok. Kurganların sırrını, şehirlerin kapılarını, yeraltının en derin katını gördün. Bozkır senin avucunda bir destan defteri gibi açık.",
  },
];

export function sagaOf(id: string): SideSaga | undefined {
  return SIDE_SAGAS.find((x) => x.id === id);
}

export function sagaReward(r: SideSagaReward): string {
  const p: string[] = [];
  if (r.gold) p.push(`+${r.gold} altın`);
  if (r.renown) p.push(`+${r.renown} şöhret`);
  if (r.title) p.push(`"${r.title}" unvanı`);
  return p.join(" · ");
}
