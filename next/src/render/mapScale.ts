/**
 * Haritadaki tüm sticker/prop genişliklerinin kilitli hiyerarşisi.
 * Şehir > kale > köy/obə > kamp/düğüm > höyük; büyüklük sırası asla bozulmaz.
 * P0: bir kademe daha büyüt — AoE/M&B ‘ilk bakışta silüet’ (mobil).
 */
export const MAP_W = {
  cityCap: 268,
  city: 220,
  fort: (tier: 1 | 2 | 3 | 4) => ([126, 144, 162, 182] as const)[tier - 1],
  village: 118,
  yurt: 108,
  camp: 90,
  node: 80,
  ruin: 84,
  kurgan: 78,
  oasis: 168,
  storyCastle: 160,
  gate: 180,
  otag: 126,
  boy: 142,
  peak: 170,
  kipFort: 148,
  kipHorde: 120,
} as const;
