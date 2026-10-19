"""cine_yurt / cine_tree: damalı stüdyo arka planını sil, sinematik plate'e oturt."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / "src" / "assets" / "cine"
TARGETS = ["cine_yurt.jpg", "cine_tree.jpg"]
PLATE = "cine_sand.jpg"


def is_checker(r: int, g: int, b: int) -> bool:
    """Damalı stüdyo: nötr açık gri veya beyaz."""
    mx, mn = max(r, g, b), min(r, g, b)
    if mx - mn > 18:
        return False
    L = 0.299 * r + 0.587 * g + 0.114 * b
    return L >= 188


def punch(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None
    mark = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []
    step = max(1, min(w, h) // 32)
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for x in range(0, w, step):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, step):
        seeds.append((0, y))
        seeds.append((w - 1, y))
    for x, y in seeds:
        r, g, b, a = px[x, y]
        if a < 40 or is_checker(r, g, b):
            if not mark[y][x]:
                mark[y][x] = True
                stack.append((x, y))
    while stack:
        x, y = stack.pop()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h or mark[ny][nx]:
                continue
            r, g, b, a = px[nx, ny]
            if a < 40 or is_checker(r, g, b):
                mark[ny][nx] = True
                stack.append((nx, ny))
    # yarı-damalı kenar yumuşatma: komşu damalıysa soluk gri/beyazı da al
    for y in range(h):
        for x in range(w):
            if mark[y][x]:
                continue
            r, g, b, a = px[x, y]
            if a < 40:
                mark[y][x] = True
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            L = 0.299 * r + 0.587 * g + 0.114 * b
            if mx - mn > 22 or L < 200:
                continue
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and mark[ny][nx]:
                    mark[y][x] = True
                    break
    out = im.copy()
    op = out.load()
    assert op is not None
    for y in range(h):
        for x in range(w):
            if mark[y][x]:
                r, g, b, _ = op[x, y]
                op[x, y] = (r, g, b, 0)
    return out


def plate_for(size: tuple[int, int]) -> Image.Image:
    sand = Image.open(ROOT / PLATE).convert("RGB")
    sand = sand.resize(size, Image.Resampling.LANCZOS)
    # akşam platosu: biraz koyulaştır + vignette hissi
    sand = sand.point(lambda v: int(v * 0.62))
    dark = Image.new("RGB", size, (18, 12, 8))
    return Image.blend(sand, dark, 0.28)


def composite(cut: Image.Image, bg: Image.Image) -> Image.Image:
    # yumuşak kenar
    a = cut.split()[3].filter(ImageFilter.GaussianBlur(0.6))
    cut = Image.merge("RGBA", (*cut.split()[:3], a))
    base = bg.convert("RGBA")
    base.alpha_composite(cut)
    return base.convert("RGB")


def main() -> None:
    for name in TARGETS:
        path = ROOT / name
        if not path.exists():
            print("skip missing", name)
            continue
        src = Image.open(path)
        cut = punch(src)
        # alpha webp yedek (props / ileride)
        webp = path.with_suffix(".webp")
        cut.save(webp, "WEBP", quality=92, method=4)
        scene = composite(cut, plate_for(src.size))
        scene.save(path, "JPEG", quality=92, optimize=True)
        # doğrula: köşe artık damalı değil
        px = scene.load()
        assert px is not None
        c = px[2, 2]
        print(f"{name}: repaired corner={c}; alpha={webp.name}")


if __name__ == "__main__":
    main()
