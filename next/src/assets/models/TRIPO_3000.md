# Tripo3D — 3000 kredi planı

## Ayar (her üretimde)

| Ayar | Değer | Neden |
|------|--------|--------|
| Mod | **Text → 3D** (H2/H3) | 20 kredi / textured |
| Texture | **Standard** (detailed değil) | +10 kredi boşa |
| Smart low-poly | **Açık** (varsa, +10) | Oyun mesh |
| Quad / parts / HD geo | **Kapalı** | Pahalı, gerekmez |
| Format | **GLB** indir | Doğrudan `models/` |

**Birim maliyet (hedef):** ~**20–30** kredi / kabul edilen model.  
**Bütçe:** 3000 → ~**90–120 deneme** veya **~70–90 kabul** (1.3× yeniden üretim payı).

P1 (40–50) sadece karakterlerde kullan; harita için fazla.

---

## Stil öneki (HER prompt’un en başına yapıştır)

```
Game-ready low-poly 3D prop for a Silk Road Turkic steppe strategy game, top-down readable silhouette, warm adobe sand felt bronze dark wood, no modern objects, no people, no base platform, grounded flat bottom, single solid landmark, clean PBR, stylized not realistic photo, compact footprint.
```

---

## Sıra (kopyala → Tripo → kaydet)

Dosya adı = oyundaki anahtar. Kayıt: `next/src/assets/models/<ad>.glb`

### DALGA A — Harita çekirdeği (P0) · ~8 model · ~200–280 kredi

Oyunda hemen fark edilir; kod zaten bağlı.

#### 1) `city.glb`
```
[STİL ÖNEKİ]
Generic medieval Central Asian Silk Road city block: low walls, one turquoise dome, brick portal, two small towers, adobe houses clustered tight. Readable from above. Footprint about 100 units wide, tallest point under 140.
```

#### 2) `city_samarkand.glb`
```
[STİL ÖNEKİ]
Samarkand capital landmark: large turquoise dome mosque/madrasa complex, ornate brick iwans, city wall segment, golden age Timurid vibe. Compact map icon scale, no people. Tallest dome ~130 units.
```

#### 3) `fort.glb`
```
[STİL ÖNEKİ]
Steppe fortress keep: square stone tower with crenellations, small wooden gate, dry ditch suggestion, empty banner pole. Compact fort for strategy map. Height ~90 units.
```

#### 4) `village.glb`
```
[STİL ÖNEKİ]
Central Asian mud-brick village cluster: five flat-roof houses, animal pen, hay stack, dirt yard. Soft earth colors. Footprint ~70 units.
```

#### 5) `camp.glb`
```
[STİL ÖNEKİ]
Bandit camp hideout: dark felt tents, broken cart, spear rack, campfire ring with stones. Menacing low-poly. Footprint ~55 units.
```

#### 6) `kurgan.glb`
```
[STİL ÖNEKİ]
Ancient Turkic burial mound with one standing anthropomorphic stone balbal stele. Grass earth mound, mystical but not neon fantasy. Height ~40 units.
```

#### 7) `oasis.glb`
```
[STİL ÖNEKİ]
Desert oasis landmark: small pool of water, three date palms, tiny adobe hut. Compact map prop. Footprint ~50 units.
```

#### 8) `ruin.glb`
```
[STİL ÖNEKİ]
Ruined Silk Road caravanserai walls: broken arches, fallen bricks, sand drifts. Low-poly wreckage. Footprint ~60 units.
```

**Dur:** Oyunda aç, ölçek/`@0.8` ayarla. Beğenmediğin 2–3’ü yeniden üret (aynı prompt + “simpler silhouette, fewer details”).

---

### DALGA B — Şehir kimlikleri · 8 model · ~200–280 kredi

Aynı stil, şehir farkı.

#### 9) `city_bukhara.glb`
```
[STİL ÖNEKİ]
Bukhara: turquoise twin domes, tall minaret suggestion, brick madrasa courtyard silhouette. Compact city pin.
```

#### 10) `city_constantinople.glb`
```
[STİL ÖNEKİ]
Constantinople Byzantine silhouette: massive walls, dome of Hagia Sophia style church, stone greys and gold accents. Compact map landmark, not full city.
```

#### 11) `city_konya.glb`
```
[STİL ÖNEKİ]
Konya Seljuk stone city: conical turquoise tomb dome, stout stone walls, austere Islamic architecture. Compact.
```

#### 12) `city_tabriz.glb`
```
[STİL ÖNEKİ]
Tabriz bazaar city: covered market arches, brick caravanserai, mountain plateau adobe. Compact landmark.
```

#### 13) `city_merv.glb`
```
[STİL ÖNEKİ]
Merv oasis city: mud-brick citadel walls, flat roofs, dusty earth tones, canal hint. Compact.
```

#### 14) `city_kashgar.glb`
```
[STİL ÖNEKİ]
Kashgar frontier city: Pamir mountain gate vibe, clay walls, central Asian market square, snowy peak suggestion far. Compact.
```

#### 15) `city_rey.glb`
```
[STİL ÖNEKİ]
Rey Iranian plateau city: mud brick, windcatcher towers, desert haze colors. Compact.
```

#### 16) `city_nishapur.glb`
```
[STİL ÖNEKİ]
Nishapur foothill city: turquoise tile accents, brick, rocky ground base. Compact.
```

---

### DALGA C — Bonus yerler · ~3–4 · ~80–120 kredi

#### 17) `yurts.glb`
```
[STİL ÖNEKİ]
Nomad yurt camp: three white felt yurts with wooden lattice hint, smoke from one, steppe grass. Footprint ~55.
```
*(Kodda şimdilik `village` ile gelir; sonra `yurts` anahtarı açılır.)*

#### 18) `node.glb`
```
[STİL ÖNEKİ]
Resource outpost marker: wood pile, stone quarry cart, and small field fence combined as one compact prop. Footprint ~35.
```

#### 19) `ship.glb` (opsiyonel)
```
[STİL ÖNEKİ]
Medieval dhow sailing ship, lateen sail, wooden hull, no crew. Side profile clear. Length ~80 units.
```

---

### DALGA D — Karakterler (kalan kredi) · ~20–30 kredi/adet H3 veya 40 P1

Sadece A+B oturduktan sonra. Kodda henüz otomatik değil — yine de stokla.

Öncelik sırası:
1. `hero_alp.glb`
2. `hero_slave.glb`
3. `soldier_spear.glb`
4. `comp_korkut.glb`
5. `comp_ayse.glb`
6. `camel.glb`

#### Örnek: `hero_alp.glb`
```
Game-ready low-poly stylized Turkic alp warrior character, idle A-pose, chainmail, conical helmet, sword and round shield, short red cape, height about 1.8m proportions, clean topology, no base platform, Silk Road medieval, not anime.
```

#### Örnek: `camel.glb`
```
Game-ready low-poly Bactrian camel with saddle packs for caravan, standing, warm brown coat, no rider, grounded, strategy game asset.
```

---

## 3000 kredi dağılımı (önerilen)

| Kalem | Kredi |
|--------|--------|
| Dalga A (8) + 3 yeniden | ~220–280 |
| Dalga B (8) + 4 yeniden | ~240–320 |
| Dalga C (3–4) + 2 yeniden | ~100–150 |
| **Ara toplam harita** | **~600–750** |
| Karakter denemeleri (10–15) | ~300–450 |
| **Yedek / felaket yeniden** | **~1800** |

Yedek büyük kalsın: Tripo bazen çöp üretir; aynı prompt’u 2. kez denemek normal.

Alternatif “agresif”: yedeksiz ~100 textured model → kalite düşer. **Önerilen: önce 16–20 yer modeli kaliteli.**

---

## Kabul / reddet checklist

- Üstten bakınca şekil okunuyor mu?
- Modern detay / karakter / yazı yok mu?
- Altı düz mü (yere oturuyor)?
- Çok ince uzun kuleler (z-fighting) yok mu?
- Boyut aşırıysa dosyayı `ad@0.7.glb` yap

## Oyuna koyma

```
next/src/assets/models/city_samarkand.glb
next/src/assets/models/fort.glb
...
```

Vite kaydedince haritada prosedürel modelin üstüne biner.
