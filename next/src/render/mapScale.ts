/**
 * Haritadaki tüm sticker/prop genişliklerinin kilitli hiyerarşisi.
 * Şehir > kale > köy/obə > kamp/düğüm > höyük; büyüklük sırası asla bozulmaz.
 */
export const MAP_W = {
  cityCap: 210,
  city: 170,
  fort: (tier: 1 | 2 | 3 | 4) => ([98, 112, 126, 142] as const)[tier - 1],
  village: 90,
  yurt: 82,
  camp: 70,
  node: 66,
  ruin: 68,
  kurgan: 60,
  oasis: 140,
  storyCastle: 128,
  gate: 145,
  otag: 100,
  boy: 115,
  peak: 140,
  kipFort: 118,
  kipHorde: 95,
} as const;
