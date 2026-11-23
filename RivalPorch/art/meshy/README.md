# Meshy drop-in hooks

Export Meshy clay assets into these paths (PNG or GLB companions later). The game resolves:

| Hook path | Used for |
|-----------|----------|
| `art/meshy/busts/bust-n7-tailor-ayla.png` … `bust-n12-*.png` | Unlockable roster portraits |
| `art/meshy/busts/pose-*.png` | Shop pose collection (placeholders) |
| `art/meshy/props/frame-*.png` | Shop frame collection |
| `art/meshy/stages/` | Future arena/street variants |

Until a file exists, the UI falls back to day-1 `assets/rival-porch/` busts / CSS chrome.
