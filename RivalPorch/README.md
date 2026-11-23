# Rival Porch — Deep vertical slice

Static web game (HTML / CSS / JS modules). Multi-day evening loop, Porch Cup ladder, fair cosmetics economy.

## Run

```bash
cd RivalPorch
npx --yes serve -l 4173
```

Open **http://localhost:4173** (not `file://` — JSON loads via fetch).

## Deep loop how-to-play (15–25+ min evenings)

1. **Continue / New block** on title (save in `localStorage` v3).
2. **Evening agenda** — finish all checks before overnight:
   - Porch check-in (streak + Porch Coins)
   - **3 neighbor deep scenes** (branching trees, 3+ choices)
   - Street event (4-option daily beat)
   - Gift / shop errand (spend Porch Coins — affinity only)
   - Weekend days 6–7: **Season Cup night** (practice Cup anytime)
3. **End evening** → overnight affinity ticks → next day. Cup wins unlock neighbors toward **12**.
4. **Shop** — Porch skins / poses / comic frames / emotes. Spend **Porch Coins**, **Neon Thread**, or **Clay Tokens**. Cosmetics never change combat. Ads off.
5. **Porch Week Pass** — read-only progress track (free claimable; Clay track stub unlock). F2P story stays completable.
6. **Ladder** — season week, bot difficulty ramp, unlock schedule.

### Currencies (from store economy pack)

| ID | Role |
|----|------|
| `porch_coins` | Soft — gifts, décor, basic cosmetics |
| `neon_thread` | Soft rare — mid cosmetics |
| `clay_tokens` | Hard — cosmetics / Pass only (no power) |

Earn rates + catalog: `data/economy.json` (copied from Project `internal/rival-porch-economy.json`).  
Session agenda sidecar: `data/depth-meta.json`.  
Stories: `data/stories.json` — store pack schemaVersion 2 (3 arcs, 16 dialogue trees, 34 daily events, endings, unlocks).  
Ladder: `data/ladder.json`.

### Story loop
- Week focus + active **arc beat** on the evening agenda
- Neighbor **Sahne** opens branching dialogue (affinity / rep / flags)
- **Sokak olayı** draws from the 34-event weighted pool
- Persistence: `storyFlags`, `arcs`, `reputation`, `seenDailyEvents`, `completedTrees`, `storyUnlocks`
- Affinity scale **0–100**; Season 1 endings evaluate from day 28+

## Meshy hooks

Drop exports under `art/meshy/` — see `art/meshy/README.md`. Missing files fall back to day-1 busts.

## Layout

```
RivalPorch/
  index.html
  css/style.css
  js/{game,save,wallet}.js
  data/{content,economy,stories,ladder,depth-meta}.json
  assets/rival-porch/*.png
  art/meshy/...
```
