# Meshy / AI 3D — Kervan Krallık .glb paketi

Dosya adı = oyun anahtarı. Örnek: `fort.glb` → `src/assets/models/fort.glb`  
Ölçek: dünya birimi (insan ≈ **61** yükseklik). Gerekirse `fort@1.4.glb`.

Şu an **yalnızca harita yerleri** otomatik bağlanıyor (`Models.ts` + `WorldView3D`).  
Kahraman / asker / yoldaş için dosya koyunca kodda `overlayGlb` açmak gerekir (Faz 2).

---

## Stil kutsal kitabı (her prompt’un başına yapıştır)

```
Low-poly game-ready 3D asset for a Silk Road / Turkic steppe strategy RPG (11th–13th c. vibe).
Clean silhouette readable from top-down isometric (~45°). No modern details.
Warm sand, adobe, felt, bronze, dark wood. Soft PBR, no neon.
Single object, grounded on flat base, centered origin, feet/base at y=0.
Avoid: anime, sci-fi, marble Greco temples, Chinese dragons unless asked.
Triangle budget target: places 3k–12k, characters 2k–6k.
Export: GLB, one mesh or few meshes, reasonable UVs.
```

---

## FAZ 1 — Harita yerleri (kodda hazır · ~18 kalem)

| # | Dosya | Öncelik | Ne |
|---|--------|---------|-----|
| 1 | `city.glb` | P0 | Genel İpek Yolu şehir silüeti (kubbe + sur + minare/kule) |
| 2 | `city_samarkand.glb` | P0 | Başkent: büyük Registan / camii + sur |
| 3 | `city_bukhara.glb` | P0 | Turkuaz kubbe, medrese |
| 4 | `city_constantinople.glb` | P1 | Sur + kilise/kubbe, Bizans |
| 5 | `city_konya.glb` | P1 | Selçuklu taş, tekke hissi |
| 6 | `city_tabriz.glb` | P1 | Çarşı / kervansaray |
| 7 | `city_rey.glb` | P2 | İran platosu şehir |
| 8 | `city_nishapur.glb` | P2 | Dağ etekleri şehir |
| 9 | `city_merv.glb` | P2 | Vaha şehir, kerpiç |
| 10 | `city_kashgar.glb` | P2 | Doğu ucu, dağ geçidi şehir |
| 11 | `fort.glb` | P0 | Ortaçağ bozkır kalesi / burç |
| 12 | `village.glb` | P0 | Kerpiç köy + ahır |
| 13 | `camp.glb` | P0 | Harami kampı, çadır + ateş izi |
| 14 | `kurgan.glb` | P0 | Balbal / mezar höyüğü + dikili taş |
| 15 | `oasis.glb` | P1 | Palmiye + su + küçük kulübe |
| 16 | `ruin.glb` | P1 | Yıkık sur / antik taş |
| 17 | `node.glb` | P2 | Kaynak noktası (orman yığını / ocak / tarla işareti) — tek jenerik yeter |
| 18 | `yurts.glb` | P1* | Keçe otağ kümesi (*şu an köy anahtarı `village`; kodda `yurts` eklenince) |

**İsteğe bağlı (kodda `other` — şimdilik bağlanmıyor, sonra 3 satır):**  
`pier.glb`, `pirate.glb`, `ship.glb`, `ship_pirate.glb`

---

## FAZ 2 — Aktörler (kod bağlanınca · ~25 kalem)

| Dosya | Not |
|--------|-----|
| `hero_slave.glb` | Köle, paçavra |
| `hero_alp.glb` | Zırh + kılıç + kalkan |
| `hero_bahadir.glb` | Balta, plaka |
| `hero_suikastci.glb` | Kapüşon, twin |
| `hero_hirsiz.glb` | Hafif deri, hançer |
| `hero_kam.glb` | Cübbe, asa |
| `comp_ayse.glb` | Şifacı kadın |
| `comp_korkut.glb` | Yaşlı ozan, kopuz |
| `comp_ferhat.glb` | Avcı |
| `comp_batu.glb` | Yüzbaşı |
| `comp_leyla.glb` | Tüccar |
| `comp_lucia.glb` | Venedikli |
| `soldier_spear.glb` | Mızraklı |
| `soldier_archer.glb` | Okçu |
| `soldier_cav.glb` | Atlı (veya at ayrı) |
| `bandit_sword.glb` / `axe` / `rider` / `heavy` / `chief` | 5 |
| `camel.glb` | Kervan |
| `horse.glb` | Binek |

Boss’lar (çok): önce 4–5 ikonik (`kokboru`, `karahan`, `erlik`, `golem`, `albasti`).

---

## Örnek Meshy prompt’ları

### city_samarkand.glb
```
[STİL KİTABI]

Samarkand capital landmark for top-down strategy map.
Cluster of Islamic golden-age buildings: large turquoise dome, brick portals,
low walls, a few towers. Compact footprint, readable silhouette from above.
Warm adobe + blue tile accents. No people. Scale: tallest dome ~120–140 units.
```

### fort.glb
```
[STİL KİTABI]

Steppe fortress keep: square stone tower, crenellations, small gatehouse,
wooden gate, dry ditch suggestion. Compact for map pin. Height ~80–100 units.
Banner pole empty (game tints team color).
```

### village.glb
```
[STİL KİTABI]

Central Asian mud-brick village cluster: 4–6 houses with flat roofs,
a pen, hay pile. Soft earth colors. Footprint ~70 units wide.
```

### camp.glb
```
[STİL KİTABI]

Bandit hideout: dark tents, broken cart, spear rack, campfire ring.
Menacing but low-poly. Footprint ~55 units.
```

### kurgan.glb
```
[STİL KİTABI]

Ancient Turkic burial mound with one standing stone balbal (anthropomorphic
stele). Grass/earth mound. Height ~40 units. Mystical but not fantasy neon.
```

### hero_alp.glb
```
[STİL KİTABI]

Turkic alp warrior, T-pose or slight idle, game character.
Chainmail, conical helmet, sword and round shield, short cape.
Proportions: height ~61 units. Clean topology for games. No base platform.
```

---

## İş akışı

1. **Önce P0** (city + city_samarkand + fort + village + camp + kurgan) → oyunda hemen fark edilir.  
2. Meshy’de her kalem için: Text-to-3D → (gerekirse) Remesh / Texture → **GLB indir**.  
3. Dosyayı `next/src/assets/models/<anahtar>.glb` koy → Vite hot reload.  
4. Çok büyükse `anahtar@0.8.glb` ile ölçek.  
5. Faz 2 aktörler için kodda `overlayGlb(actor.root, "hero_alp")` bağlanır.

## Toplam

| Dalga | Kalem | Etki |
|-------|-------|------|
| Faz 1 P0 | **6** | Harita “AAA” ilk izlenim |
| Faz 1 tam | **~18** | Tüm yerler |
| Faz 2 aktör | **~25** | Kahraman/ordu/yoldaş |
| Boss set | **~10–20** | İsteğe bağlı |

**Pratik öneri:** Meshy’ye önce **6 P0** yaptır; stil tutunca şehir varyantlarını aynı seed/stil ile çoğalt.
