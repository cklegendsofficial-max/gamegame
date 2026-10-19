# Tripo3D — 2100 kredi (kalan dalga)

Faz 1 harita (18) bitti. Bu dosya: deniz + kahraman + yoldaş + ordu + harami + boss.

## Ayar (her üretimde)

| Ayar | Değer |
|------|--------|
| Mod | Text → 3D |
| Texture | **Standard** |
| Smart low-poly | **Açık** |
| Quad / HD / parts | Kapalı |
| Format | **GLB** → `next/src/assets/models/<anahtar>.glb` |
| Hedef maliyet | ~20–30 kredi / kabul |

**Bütçe:** ~40 kabul + ~15 yeniden ≈ 1100–1650 kredi; 450–900 yedek.  
**Önemli:** Simplify ile indir — 60MB×N oyun kırar. Uzun Tripo adı OK; biz yeniden adlandırırız.

---

## Stil A — Yer / gemi (prop)

Her prop prompt’unun **en başına** yapıştır:

```
Game-ready low-poly 3D prop for a Silk Road Turkic steppe strategy game, top-down readable silhouette, warm adobe sand felt bronze dark wood, no modern objects, no people, no base platform, grounded flat bottom, single solid landmark, clean PBR, stylized not realistic photo, compact footprint.
```

## Stil B — Karakter / yaratık

Her karakter prompt’unun **en başına** yapıştır:

```
Game-ready low-poly stylized character for a Silk Road Turkic medieval strategy RPG, idle A-pose facing +Z, feet on ground y=0, height about 61 units, clean topology, no base platform, no modern clothing, warm earth bronze felt metal, not anime, not photoreal, single character only.
```

---

# DALGA E — Deniz (4) · Stil A

### 1) `ship.glb`
```
[STİL A]
Medieval Silk Road dhow sailing ship, lateen sail, wooden hull warm oak, gold trim, no crew, side profile clear, length about 80 units, grounded waterline flat.
```

### 2) `ship_pirate.glb`
```
[STİL A]
Dark pirate dhow, black-brown hull, tattered dark sail, red accents, menacing low-poly, no crew, length about 84 units, flat waterline.
```

### 3) `pier.glb`
```
[STİL A]
Wooden harbor pier / dock with pilings and short plank walkway, Silk Road port, compact map prop, footprint about 70 units long, no boats no people.
```

### 4) `pirate.glb`
```
[STİL A]
Pirate nest hideout on rocky shore: dark tents, broken crates, black flag pole empty, campfire ring, compact footprint about 55 units.
```

---

# DALGA F — Kahraman (6) · Stil B

### 5) `hero_slave.glb`
```
[STİL B]
Turkic slave youth in ragged dirty cloth, hunched slightly, bare feet or worn sandals, no armor no weapon, thin build, desperate but dignified, height 61.
```

### 6) `hero_alp.glb`
```
[STİL B]
Turkic alp warrior, chainmail, conical helmet, sword and round shield, short red cape, beard, athletic build, height 61.
```

### 7) `hero_bahadir.glb`
```
[STİL B]
Heavy Turkic bahadir champion, plate armor hints, horned or conical helm, two-handed axe, red-gold trim, bulky muscular, height 61.
```

### 8) `hero_suikastci.glb`
```
[STİL B]
Turkic assassin, dark hooded cloak, twin daggers, lean silhouette, black-grey leather, height 61.
```

### 9) `hero_hirsiz.glb`
```
[STİL B]
Turkic thief rogue, leather armor, red bandana, dagger, light build, green-brown cloth, height 61.
```

### 10) `hero_kam.glb`
```
[STİL B]
Turkic kam shaman, blue-purple robe, feathered headpiece, wooden staff, silver beard, mystical but grounded, height 61.
```

---

# DALGA G — Yoldaş (6) · Stil B

### 11) `comp_ayse.glb`
```
[STİL B]
Young Central Asian woman healer, teal-green robe, long dark hair, wooden staff, gentle stance, no modern clothes, height about 58 units.
```

### 12) `comp_korkut.glb`
```
[STİL B]
Elder Turkic dervish bard, red robe, white felt bork hat, white beard, holding kopuz lute, slight hunch, wise, height 61.
```

### 13) `comp_ferhat.glb`
```
[STİL B]
Turkic steppe hunter tracker, leather and apron, hammer or hunting knife, dark beard, strong build, earth tones, height 61.
```

### 14) `comp_batu.glb`
```
[STİL B]
Aging Turkic captain, heavy armor, horned helmet, axe and shield, grey-streak beard, bulky, height 63.
```

### 15) `comp_leyla.glb`
```
[STİL B]
Turkic merchant woman, green leather travel outfit, feathered hat, bow, long auburn hair, confident, height 58.
```

### 16) `comp_lucia.glb`
```
[STİL B]
Venetian merchant woman on Silk Road, purple robe cream trim, long hair, staff, Mediterranean look, height 58.
```

---

# DALGA H — Ordu / binek (6)

### 17) `soldier_spear.glb` · Stil B
```
[STİL B]
Turkic spear infantry, mail armor, conical helm, spear and round shield, generic army unit, height 61.
```

### 18) `soldier_archer.glb` · Stil B
```
[STİL B]
Turkic archer, leather armor, kalpak hat, composite bow, quiver, height 61.
```

### 19) `soldier_cav.glb` · Stil B
```
[STİL B]
Turkic cavalryman mounted on horse, mail, conical helm, spear and shield, horse included as one asset, compact scale height about 90 units total.
```

### 20) `soldier_sword.glb` · Stil B
```
[STİL B]
Turkic swordsman infantry, mail, conical helm, sword and round shield, height 61.
```

### 21) `camel.glb` · Stil B (hayvan)
```
Game-ready low-poly Bactrian camel with saddle packs for caravan, standing, warm brown coat, no rider, grounded feet y=0, strategy game asset, height about 70 units.
```

### 22) `horse.glb` · Stil B (hayvan)
```
Game-ready low-poly steppe horse with simple saddle, standing, bay brown coat, no rider, grounded, strategy game, height about 55 units.
```

---

# DALGA I — Harami (5) · Stil B

### 23) `bandit_sword.glb`
```
[STİL B]
Silk Road bandit with sword, leather armor, colorful bandana, rough beard, menacing, height 61.
```

### 24) `bandit_axe.glb`
```
[STİL B]
Stocky bandit with axe, leather, kalpak hat, dark beard, height 61.
```

### 25) `bandit_rider.glb`
```
[STİL B]
Bandit horseman mounted, leather armor, conical helm, sword, dark cape, horse included, total height about 90.
```

### 26) `bandit_heavy.glb`
```
[STİL B]
Heavy bandit brute, mail scraps, club and shield, bulky build, height 64.
```

### 27) `bandit_chief.glb`
```
[STİL B]
Bandit war chief, dark plate hints, horned helm, greataxe, red cape, intimidating, taller height 68.
```

---

# DALGA J — Boss (5, kredi kalırsa) · Stil B

Yalnızca E–I kabul edildikten sonra.

### 28) `boss_kokboru.glb`
```
[STİL B]
Mythic white-blue wolf spirit Kokboru, bipedal or large wolf stance, icy fur accents, legendary boss, no platform, height about 90 units, Silk Road myth not anime.
```

### 29) `boss_karahan.glb`
```
[STİL B]
Dark tyrant warlord Karahan, black-gold armor, cruel crown-helm, huge scimitar, imposing boss, height about 80 units.
```

### 30) `boss_erlik.glb`
```
[STİL B]
Underworld demon Erlik, dark horned figure, bone and ash tones, mystical staff, terrifying boss, height about 90 units, Turkic myth.
```

### 31) `boss_golem.glb`
```
[STİL B]
Ancient stone golem of desert ruins, adobe and rock body, glowing runes subtle, bulky boss, height about 100 units.
```

### 32) `boss_albasti.glb`
```
[STİL B]
Albasti night demon spirit, pale wild hair, ragged cloth, eerie stance, Turkic folklore boss, height about 70 units.
```

---

## Kabul checklist

- Silüet üstten / izometrik okunuyor mu?
- Modern / yazı / ekstra insan yok mu?
- Alt düz (y=0)?
- Boyut aşırıysa kaydet: `ad@0.7.glb`

## Oyuna koyma

1. GLB’yi `next/src/assets/models/` altına at (Tripo uzun adı OK).
2. `node scripts/rename_tripo_2100.mjs` çalıştır **veya** söyle, yeniden adlandırırım.
3. Vite hot reload → prosedürel modelin üstüne biner.
