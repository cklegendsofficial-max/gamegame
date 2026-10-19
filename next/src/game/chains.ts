import type { Good } from "./rpg";

/** Bir şehir zincirinin tek adımı. `n` adımın hedefidir; `visit` adımında hedef şehirdir. */
export interface ChainStep {
  title: string;
  text: string;
  kind: "deliver" | "wins" | "kills" | "gold" | "visit" | "crafted" | "camps" | "profit" | "renown";
  n: number;
  good?: Good;
  city?: string;
  reward: { gold?: number; renown?: number; xp?: number; item?: boolean };
  /** Adım bitince anlatılan sonuç. */
  after: string;
}

export interface Chain {
  title: string;
  giver: string;
  intro: string;
  steps: ChainStep[];
}

export const CHAINS: Record<string, Chain> = {
  constantinople: {
    title: "Mozaikçinin Borcu",
    giver: "Mozaikçi Theodoros",
    intro: "Ayasofya'nın yaşlı mozaikçisi, kaybolan çırağını ve yarım kalan bir duvar resmini anlatıyor.",
    steps: [
      { title: "Lacivert taş", text: "Mozaiğin göğü için 4 Türkuaz getir.", kind: "deliver", good: "turkuaz", n: 4, reward: { gold: 60, xp: 40 }, after: "Taşları ışığa tutuyor: \"Bu mavi, Tanrı'nın gözü gibi.\" Sonra çırağının Konya yolunda görüldüğünü söylüyor." },
      { title: "Konya yolundaki iz", text: "Çırağın izini sürmek için Konya'ya git.", kind: "visit", city: "konya", n: 1, reward: { gold: 40, xp: 60 }, after: "Konya hanında çırağın bıraktığı mektubu buluyorsun: haramiler onu yol bekçisi diye tutmuş." },
      { title: "Çırağın hürriyeti", text: "Yollardaki haramileri dağıt: 3 savaş kazan.", kind: "wins", n: 3, reward: { gold: 150, renown: 20, item: true }, after: "Çırak eve döndü. Mozaiğin köşesine, yüzü kalabalığın içinde seçilen küçük bir atlı ekleniyor: sen." },
      { title: "Kubbenin gözü", text: "Ayasofya'nın kubbesine yeni bir göz yapılacak: 3 eşya üret.", kind: "crafted", n: 3, reward: { gold: 260, renown: 30, xp: 160, item: true }, after: "Theodoros, kubbenin tepesindeki mozaiğe senin dövdüğün bir demir halka gömüyor. \"Yüzyıllar sonra bile bu şehir senin elini taşıyacak,\" diyor." },
    ],
  },
  konya: {
    title: "Sema Halkası",
    giver: "Dervişlerin pîri",
    intro: "Dergâhın pîri, kervansaraydaki fakirler için bir aşevi açmak istiyor.",
    steps: [
      { title: "Aş kazanı", text: "Aşevi için 120 akçe bağışla.", kind: "gold", n: 120, reward: { renown: 15, xp: 50 }, after: "Kazan kaynamaya başladı. Pîr gülümsüyor: \"Doyan karın dua eder.\"" },
      { title: "Yolcuların güvenliği", text: "Dergâh yolunu kesen 2 harami kampını dağıt.", kind: "camps", n: 2, reward: { gold: 80, xp: 80 }, after: "Yollar sakinleşti; aşevine gelen yolcu sayısı iki katına çıktı." },
      { title: "Hırka", text: "Pîrin hırkasının astarı için 4 İpek getir.", kind: "deliver", good: "ipek", n: 4, reward: { gold: 120, renown: 25, item: true }, after: "Pîr sana kendi tespihini veriyor. Konya'da adın artık dua ile anılıyor." },
      { title: "Sema gecesi", text: "Dergâhın büyük semâsı için 150 şöhret daha topla.", kind: "renown", n: 150, reward: { gold: 280, renown: 40, xp: 170, item: true }, after: "Semâ gecesi dergâhın avlusu yolcularla doldu. Pîr, ney sesi arasında fısıldıyor: \"Yol, yürüyene yoldaşlık eder.\"" },
    ],
  },
  tabriz: {
    title: "Halıdaki Sır",
    giver: "Dokumacı Gülbahar",
    intro: "Gülbahar, ninesinden kalan bir halının desenlerinde gömülü bir hazinenin yolunu gördüğünü söylüyor.",
    steps: [
      { title: "Eksik renk", text: "Deseni tamamlamak için 3 Halı getir.", kind: "deliver", good: "hali", n: 3, reward: { gold: 60, xp: 40 }, after: "Halıları yan yana seriyor; desenler bir dağ geçidini gösteriyor." },
      { title: "Geçidin bekçileri", text: "Geçidi tutan haramileri yen: 2 savaş kazan.", kind: "wins", n: 2, reward: { gold: 90, xp: 70 }, after: "Geçitte, kayaya oyulmuş bir tamga buluyorsun. Desenin son parçası Rey'de." },
      { title: "Rey'deki son düğüm", text: "Desenin son parçasını bulmak için Rey'e git.", kind: "visit", city: "rey", n: 1, reward: { gold: 200, renown: 20, item: true }, after: "Rey'deki eski kuyuda bir sandık: içinde Gülbahar'ın ninesinin çeyizi ve sana ayrılmış bir pay." },
      { title: "Büyük halı", text: "Gülbahar'ın saray halısı için 5 Halı getir.", kind: "deliver", good: "hali", n: 5, reward: { gold: 300, renown: 35, xp: 170, item: true }, after: "Gülbahar halıyı tezgâha seriyor; ortadaki medalyonda atının ve senin siluetin dokunmuş. \"Desen hiç yalan söylemez,\" diyor." },
    ],
  },
  rey: {
    title: "Kütüphanenin Külleri",
    giver: "Kütüphaneci Ebu Said",
    intro: "Rey kütüphanesi yanmış; Ebu Said kurtarılan kitapları yeniden ciltletmek istiyor.",
    steps: [
      { title: "Cilt derisi", text: "Ciltler için 5 Deri getir.", kind: "deliver", good: "deri", n: 5, reward: { gold: 50, xp: 50 }, after: "İlk kitaplar ciltleniyor. Ebu Said yangını çıkaranların hâlâ şehirde olduğundan şüpheleniyor." },
      { title: "Kundakçılar", text: "Kütüphane için bağış topla: 400 altın ticaret kârı yap.", kind: "profit", n: 400, reward: { gold: 100, xp: 90 }, after: "Çetenin elebaşı itiraf ediyor: kitapları satmak için kütüphaneyi yakmışlar. Senin kârın da raflara döndü." },
      { title: "Yeni raflar", text: "Yeni raflar için 200 akçe bağışla.", kind: "gold", n: 200, reward: { renown: 35, xp: 120, item: true }, after: "Kütüphanenin kapısına adın kazındı. Ebu Said sana kurtardığı en eski kitabı hediye ediyor." },
      { title: "Yeni âlimler", text: "Kütüphane için ticaretten 1200 altın kâr daha yap.", kind: "profit", n: 1200, reward: { gold: 320, renown: 40, xp: 180, item: true }, after: "Rey'in ulemâsı kütüphaneye geri döndü. Ebu Said, üst kata \"Kervanın Odası\" yazılı bir levha asıyor." },
    ],
  },
  nishapur: {
    title: "Turkuaz Ocağı",
    giver: "Ocakbaşı Bahram",
    intro: "Nişabur'un ünlü turkuaz ocağı çökmüş; ocakbaşı madencileri kurtarmak için yardım istiyor.",
    steps: [
      { title: "Destek kirişleri", text: "Kirişler için 6 Demir getir.", kind: "deliver", good: "demir", n: 6, reward: { gold: 70, xp: 50 }, after: "Kirişler yerleşti; madenciler birer birer gün ışığına çıkıyor." },
      { title: "Ocak yağmacıları", text: "Ocağı yağmalayanları kovala: 2 savaş kazan.", kind: "wins", n: 2, reward: { gold: 90, xp: 80 }, after: "Yağmacıların bıraktığı sandıkta Merv'e gidecek bir mühür var." },
      { title: "Merv'deki alıcı", text: "Çalıntı taşların alıcısını bulmak için Merv'e git.", kind: "visit", city: "merv", n: 1, reward: { gold: 180, renown: 25, item: true }, after: "Alıcı yakalandı, taşlar ocağa döndü. Bahram sana ocağın en güzel taşından bir yüzük yaptırıyor." },
      { title: "Ocağın bekçisi", text: "Ocak yolunu korumak için 3 harami kampını dağıt.", kind: "camps", n: 3, reward: { gold: 300, renown: 35, xp: 170, item: true }, after: "Bahram ocağın girişine senin tamganı kazıtıyor: \"Bu kapıdan artık yalnız dost girer.\"" },
    ],
  },
  merv: {
    title: "Kervan Kızı",
    giver: "Kervanbaşı Ayşegül",
    intro: "Merv'in tek kadın kervanbaşısı, babasının batan kervanını yeniden yola çıkarmak istiyor.",
    steps: [
      { title: "İlk yük", text: "Kervana yük olsun diye 5 Pamuk getir.", kind: "deliver", good: "pamuk", n: 5, reward: { gold: 50, xp: 40 }, after: "Develer yüklendi. Ayşegül ilk seferin Buhara'ya olacağını söylüyor." },
      { title: "Buhara yolu", text: "Kervana öncülük et: Buhara'ya git.", kind: "visit", city: "bukhara", n: 1, reward: { gold: 80, xp: 70 }, after: "Kervan Buhara'ya sağ salim vardı. Ama dönüş yolunda haramiler pusuda." },
      { title: "Dönüş yolu", text: "Adını yollara yay: 40 şöhret kazan.", kind: "renown", n: 40, reward: { gold: 220, renown: 25, item: true }, after: "Ayşegül'ün kervanı Merv'in en güçlüsü oldu. Kervanbaşılar loncası seni onur üyesi yaptı." },
      { title: "Ayşegül'ün sözü", text: "Kervanbaşılar loncasına 300 akçe bağışla.", kind: "gold", n: 300, reward: { renown: 50, xp: 190, gold: 150, item: true }, after: "Ayşegül ilk sefer defterini sana veriyor: \"Babamın yolunu sen açtın. Merv kapısında adın sofrada geçecek.\"" },
    ],
  },
  bukhara: {
    title: "Medresenin Kubbesi",
    giver: "Müderris İsmail",
    intro: "Medresenin kubbesi çatlamış; müderris, ustaların bile çaresiz kaldığını söylüyor.",
    steps: [
      { title: "Usta eli", text: "Ustalığını göster: 2 eşya üret.", kind: "crafted", n: 2, reward: { gold: 60, xp: 60 }, after: "İşçiliğini gören müderris, kubbenin demir kuşağını sana emanet ediyor." },
      { title: "Çini", text: "Kubbe çinileri için 4 Türkuaz getir.", kind: "deliver", good: "turkuaz", n: 4, reward: { gold: 100, xp: 80 }, after: "Kubbe yeniden parlıyor. Talebeler adını derslerinde anmaya başladı." },
      { title: "Vakıf", text: "Medresenin geleceği için 250 akçe vakfet.", kind: "gold", n: 250, reward: { renown: 40, xp: 150, item: true }, after: "Vakfiyeye adın yazıldı. Buhara'da kapılar sana artık her zaman açık." },
      { title: "Usta mühürü", text: "Medresenin demirci atölyesi için 4 eşya üret.", kind: "crafted", n: 4, reward: { gold: 320, renown: 40, xp: 190, item: true }, after: "İsmail sana medresenin usta mühürünü veriyor: \"Elin bu işi Buhara'nın en iyi ustalarından daha iyi biliyor.\"" },
    ],
  },
  samarkand: {
    title: "Eski Efendinin Gölgesi",
    giver: "Pazar kâhyası Kadir",
    intro: "Eski efendinin adamları köle pazarında hâlâ insan satıyor; Kadir onları durdurmak istiyor.",
    steps: [
      { title: "Tanıklar", text: "Pazar kâhyasının adamlarına 80 akçe ver, tanıkları korusunlar.", kind: "gold", n: 80, reward: { xp: 50, renown: 10 }, after: "Tanıklar konuşmaya başladı: efendinin adamları Buhara yolunda kervan basıyor." },
      { title: "Yol baskını", text: "Efendinin adamlarını dağıt: 3 savaş kazan.", kind: "wins", n: 3, reward: { gold: 120, xp: 90 }, after: "Kurtardığın tutsakların biri seni tanıyor: aynı ocakta çalışmıştınız." },
      { title: "Zincirleri kır", text: "Tutsakları özgür bırakmak için 40 düşman devir.", kind: "kills", n: 40, reward: { gold: 250, renown: 45, item: true }, after: "Semerkant'ın köle pazarı kapandı. Eski efendinin adı artık yalnızca senin hikâyende anılıyor." },
      { title: "Özgür pazar", text: "Semerkant pazarına özgür tüccarlar çek: 800 altın ticaret kârı yap.", kind: "profit", n: 800, reward: { gold: 350, renown: 50, xp: 200, item: true }, after: "Zincir sesinin yerini pazarcı naraları aldı. Kadir meydanın ortasına küçük bir taş diktiriyor: \"Burada kimse satılmaz.\"" },
    ],
  },
  kashgar: {
    title: "Kaşgarlı'nın Divanı",
    giver: "Bilge Mahmud'un torunu",
    intro: "Divanü Lügati't-Türk'ün kayıp bir nüshası; torun onu bulmak için seni Kaşgar'dan uzaklara yolluyor.",
    steps: [
      { title: "Kâğıt ve mürekkep", text: "Nüshayı çoğaltmak için 4 Porselen ile takas edecek tüccarlara yardım et: 4 Porselen getir.", kind: "deliver", good: "porselen", n: 4, reward: { gold: 70, xp: 60 }, after: "Tüccarlar kayıp nüshanın Semerkant'a götürüldüğünü fısıldıyor." },
      { title: "Semerkant izi", text: "Nüshanın izini sürmek için Semerkant'a git.", kind: "visit", city: "samarkand", n: 1, reward: { gold: 90, xp: 80 }, after: "Nüsha bir sahafın elinde; fakat onu almak isteyen paralı askerler de var." },
      { title: "Paralı askerler", text: "Nüshayı korumak için 2 savaş kazan.", kind: "wins", n: 2, reward: { gold: 200, renown: 40, item: true }, after: "Divan, Kaşgar'a döndü. İlk sayfaya senin adın ve \"Türk'ün dilini koruyan\" sözü yazıldı." },
      { title: "Divanın çırakları", text: "Kaşgar medresesinin hocalarına 5 Porselen ulaştır.", kind: "deliver", good: "porselen", n: 5, reward: { gold: 340, renown: 50, xp: 200, item: true }, after: "Kaşgar'ın çocukları artık divandan ders alıyor. Torun, yolun sonunda sana kendi kalemini veriyor: \"Dil, kılıçtan uzun yaşar.\"" },
    ],
  },
};
