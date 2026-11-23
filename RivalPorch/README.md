# Rival Porch — Day-1 Vertical Slice

Static web game (plain HTML / CSS / JS). Clay mahalle social loop → Porch Cup auto-battler → match comic share stub.

## Run locally

From this folder:

```bash
npx --yes serve -l 4173
```

Or any static server:

```bash
python3 -m http.server 4173
```

Open **http://localhost:4173** (or the URL printed by `serve`).

> Content is loaded via `fetch("data/content.json")`, so open through a local server — not `file://`.

## Play flow

1. **Title** — tap to start (TR/EN toggle)
2. **Street** — 6 neighbor hotspots on clay street hero
3. **Neighbor** — gift / talk / mini drama (strings from `data/content.json`)
4. **Porch Cup lobby** — pick 3 of 6
5. **Placement** — drop units on 2×3 grid (or Auto-place)
6. **Auto fight** — vs bot roster; synergies Tea / Rivalry / Neon
7. **Match comic** — result panels + copy text / export image / share stubs

Shop is a monetization placeholder only.

## Layout

```
RivalPorch/
  index.html
  css/style.css
  js/game.js
  data/content.json          # copied from Project store
  assets/rival-porch/*.png   # street-hero, arena-stage, 6 busts
  README.md
```

## Art / content sources

- GDD: Project `docs/rival-porch-gdd-slice.md`
- Art map: `docs/rival-porch-art-integration.md`
- Content pack: `internal/rival-porch-content.json` → `data/content.json`
- PNGs: Project `media/rival-porch/`
