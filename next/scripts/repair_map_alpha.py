"""Mevcut WebP cutout'ları yeniden punch + iç siyah delik doldur."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets"

TARGETS = [
    "map/castle.webp",
    "map/village.webp",
    "map/serai.webp",
    "map/siege.webp",
    "map/archer.webp",
    "map/rider.webp",
    "map/oasis.webp",
    "map/camp.webp",
    "icons/u_archer.webp",
    "icons/u_cavalry.webp",
    "heroes/npc_blacksmith.webp",
    "heroes/npc_merchant.webp",
    "heroes/npc_innkeeper.webp",
    "heroes/enemy_sword.webp",
    "heroes/enemy_axe.webp",
]


def luma_sat(r: int, g: int, b: int) -> tuple[float, float]:
    return 0.299 * r + 0.587 * g + 0.114 * b, max(r, g, b) - min(r, g, b)


def punch_alpha(im: Image.Image, tol: int = 48) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None

    def get(x: int, y: int) -> tuple[int, int, int, int]:
        return px[x, y]  # type: ignore

    samples: list[tuple[int, int, int]] = []
    for x, y in [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2),
        (2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3),
    ]:
        r, g, b, a = get(x, y)
        if a > 200:
            samples.append((r, g, b))
    if not samples:
        return im

    ar = sum(s[0] for s in samples) / len(samples)
    ag = sum(s[1] for s in samples) / len(samples)
    ab = sum(s[2] for s in samples) / len(samples)
    corner_L = luma_sat(int(ar), int(ag), int(ab))[0]
    light = corner_L >= 175
    dark = corner_L <= 55
    mid = not light and not dark
    tol2 = tol * tol

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = get(x, y)
        if a < 40:
            return True
        L, S = luma_sat(r, g, b)
        dist = (r - ar) ** 2 + (g - ag) ** 2 + (b - ab) ** 2
        if light:
            return L > 150 and S < 52 and dist <= tol2 * 2.4
        if dark:
            return L < 75 and S < 58 and dist <= tol2 * 2.4
        return S < 62 and dist <= tol2 * 2.0

    def near(a: tuple[int, int], b: tuple[int, int]) -> bool:
        ra, ga, ba, _ = get(*a)
        rb, gb, bb, _ = get(*b)
        return (ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2 <= tol2 * (1.5 if mid else 1.1)

    mark = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    step = max(1, min(w, h) // 40)
    for x in range(0, w, step):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, step):
        seeds += [(0, y), (w - 1, y)]
    for sx, sy in seeds:
        if is_bg(sx, sy) and not mark[sy][sx]:
            mark[sy][sx] = True
            stack.append((sx, sy))

    while stack:
        x, y = stack.pop()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or mark[ny][nx]:
                continue
            if not is_bg(nx, ny) or not near((x, y), (nx, ny)):
                continue
            mark[ny][nx] = True
            stack.append((nx, ny))

    out = im.copy()
    opx = out.load()
    assert opx is not None
    for y in range(h):
        for x in range(w):
            if mark[y][x]:
                opx[x, y] = (0, 0, 0, 0)
                continue
            nb = 0
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and mark[ny][nx]:
                    nb += 1
            if nb:
                r, g, b, _ = get(x, y)
                opx[x, y] = (r, g, b, max(0, 255 - nb * 72))
    return out


def fill_black_voids(im: Image.Image) -> Image.Image:
    """İç siyah delikleri (alpha>0 ama neredeyse siyah) komşu renkle doldur."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None
    out = im.copy()
    opx = out.load()
    assert opx is not None

    def get(x: int, y: int) -> tuple[int, int, int, int]:
        return px[x, y]  # type: ignore

    void = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = get(x, y)
            if a < 30:
                continue
            L = 0.299 * r + 0.587 * g + 0.114 * b
            if L < 18 and max(r, g, b) - min(r, g, b) < 12:
                void[y][x] = True

    # flood only voids that touch another void cluster (interior holes), skip silhouette
    for _pass in range(4):
        changed = False
        for y in range(1, h - 1):
            for x in range(1, w - 1):
                if not void[y][x]:
                    continue
                rs = gs = bs = n = 0
                for ny in range(y - 2, y + 3):
                    for nx in range(x - 2, x + 3):
                        if nx < 0 or ny < 0 or nx >= w or ny >= h:
                            continue
                        if void[ny][nx]:
                            continue
                        r, g, b, a = get(nx, ny)
                        if a < 80:
                            continue
                        L = 0.299 * r + 0.587 * g + 0.114 * b
                        if L < 28:
                            continue
                        rs += r
                        gs += g
                        bs += b
                        n += 1
                if n >= 3:
                    opx[x, y] = (rs // n, gs // n, bs // n, 255)
                    void[y][x] = False
                    changed = True
        if not changed:
            break
    return out


def soft_feather(im: Image.Image) -> Image.Image:
    """Kenar alpha’yı yumuşat — map token’da halo azaltır."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None
    out = im.copy()
    opx = out.load()
    assert opx is not None
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]  # type: ignore
            if a == 0 or a == 255:
                continue
            # yarı saydam kenarı biraz daha temiz tut
            if a < 90:
                opx[x, y] = (r, g, b, max(0, a - 20))
    return out


def repair(path: Path) -> None:
    if not path.exists():
        print("SKIP missing", path.relative_to(ROOT))
        return
    im = Image.open(path)
    # oasis: gri studio zemin agresif punch
    tol = 56 if "oasis" in path.name else 48
    im = punch_alpha(im, tol=tol)
    im = fill_black_voids(im)
    im = soft_feather(im)
    im.save(path, "WEBP", quality=92, method=6)
    print("OK", path.relative_to(ROOT), im.size)


def main() -> None:
    for rel in TARGETS:
        repair(ROOT / rel)


if __name__ == "__main__":
    main()
