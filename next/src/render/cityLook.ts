/**
 * Harita softIso şehirlerinin silüet kimliği: tint + hafif ölçek.
 * Aynı CC0 dilinde kalırken screenshot'ta şehirleri ayırt eder.
 */
export const CITY_TINT: Record<string, number> = {
  samarkand: 0xfff2dc,
  bukhara: 0xe8f0ff,
  merv: 0xffe8d0,
  kashgar: 0xf0ffe8,
  rey: 0xffe0e8,
  nishapur: 0xe0f8ff,
  tabriz: 0xfff0e0,
  konya: 0xf5e8ff,
  constantinople: 0xe8f4ff,
};

/** 1 = MAP_W.city; başkent ayrı ölçekte. */
export const CITY_SCALE: Record<string, number> = {
  samarkand: 1.06,
  bukhara: 1.02,
  merv: 1.04,
  kashgar: 0.98,
  rey: 1.0,
  nishapur: 0.97,
  tabriz: 1.01,
  konya: 1.03,
  constantinople: 1.08,
};

/** Şehir girişi / pazar için kısa silüet satırları. */
export const CITY_SKYLINE: Record<string, string> = {
  samarkand: "Turkuaz kubbeler ve Registan avlusu ufukta parlıyor.",
  bukhara: "Medrese minareleri ve kervansaray kubbeleri yükseliyor.",
  merv: "Kerpiç surlar ve eski kale burnu ovaya bakıyor.",
  kashgar: "Çin kapısına giden yolun başında yeşim çarşıları.",
  rey: "Dağ eteklerinde çarşı dumanı ve demirci dövülmesi.",
  nishapur: "Firuze çatıların altında şair meclisleri.",
  tabriz: "Uzun çarşı çatıları ve halı tezgâhları sırası.",
  konya: "Selçuklu taç kapıları ve çift başlı kartal nişleri.",
  constantinople: "Altın boynuz ve sur kuleleri denize yaslanıyor.",
};

/** Şehir girişi için ek atmosfer satırları (rastgele seçilir). */
export const CITY_FLAVOR: Record<string, string[]> = {
  samarkand: ["Registan avlusunda öğle ezanı yankılanıyor.", "Turkuaz çiniler güneşte yanıp sönüyor.", "İpek yüklü develer Kapıağası'nda sıraya girdi."],
  bukhara: ["Medrese avlusunda talebeler münazara ediyor.", "Kervansaray hanında çay kazanları kaynıyor.", "Kalyan minaresi gölgesini çarşıya düşürüyor."],
  merv: ["Eski kale burnundan rüzgâr toz kaldırıyor.", "Amuderya yolundan pamuk kervanı geliyor.", "Sur dibinde çömlekçiler çark çeviriyor."],
  kashgar: ["Yeşim tezgâhları Çin yoluna bakıyor.", "Tanrı Dağları'ndan karlı rüzgâr indi.", "Uygur tüccarlar çarşıda Türkçe pazarlık ediyor."],
  rey: ["Demirci örsleri gece gündüz susmuyor.", "Dağdan inen yolcu han kapısında dinleniyor.", "Baharat kokusu çarşıyı sarıyor."],
  nishapur: ["Firuze atölyelerinde taş yontuluyor.", "Şair meclisinde bir gazel okunuyor.", "Kervanbaşılar kitap sandığı açıyor."],
  tabriz: ["Halı tezgâhları kilometrelerce uzanıyor.", "Ermeni ve Türk tüccarlar aynı hanı paylaşıyor.", "Bakır çarşısında çekiç sesleri."],
  konya: ["Alaeddin Tepesi'nden şehir ayaklar altında.", "Çift başlı kartal nişleri güneşte parlıyor.", "Mevlevi semahından ney sesi geliyor."],
  constantinople: ["Altın Boynuz'da gemi direkleri orman gibi.", "Sur kapısında gümrükçüler mühür basıyor.", "Ayasofya kubbesi bulutlara değiyor."],
};
