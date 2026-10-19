"""Gemini JFIF → RGBA WebP. Orta-gri stüdyo zemin + kenar flood-fill + çift karakter kırpma."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\OyunProjesi\next\src\assets")
DL = Path(r"C:\Users\ckleg\Downloads")
GEN = Path(r"C:\Users\ckleg\.cursor\projects\c-OyunProjesi\assets")


def luma_sat(r: int, g: int, b: int) -> tuple[float, float]:
    return 0.299 * r + 0.587 * g + 0.114 * b, max(r, g, b) - min(r, g, b)


def punch_alpha(im: Image.Image, tol: int = 42) -> Image.Image:
    """Studio cutout: köşe rengine yakın + düşük satürasyon → şeffaf (açık/koyu/orta gri)."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    assert px is not None

    def get(x: int, y: int) -> tuple[int, int, int, int]:
        return px[x, y]  # type: ignore

    samples: list[tuple[int, int, int]] = []
    for x, y in [
        (0, 0),
        (w - 1, 0),
        (0, h - 1),
        (w - 1, h - 1),
        (w // 2, 0),
        (w // 2, h - 1),
        (0, h // 2),
        (w - 1, h // 2),
        (2, 2),
        (w - 3, 2),
        (2, h - 3),
        (w - 3, h - 3),
        (w // 4, 0),
        ((3 * w) // 4, 0),
        (w // 4, h - 1),
        ((3 * w) // 4, h - 1),
    ]:
        r, g, b, a = get(x, y)
        if a > 200:
            samples.append((r, g, b))
    if get(0, 0)[3] < 180 and get(w - 1, h - 1)[3] < 180:
        return im
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
            return L > 155 and S < 48 and dist <= tol2 * 2.2
        if dark:
            return L < 70 and S < 55 and dist <= tol2 * 2.2
        # orta gri (#6a6a6a vb.)
        return S < 58 and dist <= tol2 * 1.8

    def near(a: tuple[int, int], b: tuple[int, int]) -> bool:
        ra, ga, ba, _ = get(*a)
        rb, gb, bb, _ = get(*b)
        return (ra - rb) ** 2 + (ga - gb) ** 2 + (ba - bb) ** 2 <= tol2 * (1.4 if mid else 1.0)

    mark = [[False] * w for _ in range(h)]
    stack: list[tuple[int, int]] = []
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    step = max(1, min(w, h) // 48)
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
                opx[x, y] = (r, g, b, max(0, 255 - nb * 80))
    return out


def fit(im: Image.Image, max_edge: int) -> Image.Image:
    w, h = im.size
    s = min(1.0, max_edge / max(w, h))
    if s < 1:
        im = im.resize((max(1, int(w * s)), max(1, int(h * s))), Image.Resampling.LANCZOS)
    return im


def save_rgba(im: Image.Image, dest: Path, punch: bool, max_edge: int = 1024) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = fit(im, max_edge)
    if punch:
        im = punch_alpha(im)
        dest = dest.with_suffix(".webp")
        im.save(dest, "WEBP", quality=92, method=6)
    else:
        if dest.suffix.lower() in {".jpg", ".jpeg"}:
            im.convert("RGB").save(dest, "JPEG", quality=90, optimize=True)
        else:
            im.save(dest.with_suffix(".webp"), "WEBP", quality=92, method=6)
            dest = dest.with_suffix(".webp")
    print("OK", dest.relative_to(ROOT), im.size)


def open_src(name: str) -> Image.Image:
    p = DL / name
    if not p.exists():
        raise FileNotFoundError(p)
    return Image.open(p)


def crop_halves(im: Image.Image) -> tuple[Image.Image, Image.Image]:
    w, h = im.size
    mid = w // 2
    return im.crop((0, 0, mid, h)), im.crop((mid, 0, w, h))


def main() -> None:
    # --- harita pins ---
    save_rgba(open_src("Gemini_Generated_Image_9b79u99b79u99b79.jfif"), ROOT / "map/yurts.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_57gv2k57gv2k57gv.jfif"), ROOT / "map/serai.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_f0jy2hf0jy2hf0jy.jfif"), ROOT / "map/castle.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_5cwvvr5cwvvr5cwv.jfif"), ROOT / "map/camp.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_gq51g3gq51g3gq51.jfif"), ROOT / "map/kurgan.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_c2djydc2djydc2dj.jfif"), ROOT / "map/serai_alt.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_c2djydc2djydc2dj (1).jfif"), ROOT / "map/yurts2.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_c2djydc2djydc2dj (2).jfif"), ROOT / "map/village.webp", True)

    # --- birlikler ---
    archer = open_src("Gemini_Generated_Image_y783j9y783j9y783.jfif")
    save_rgba(archer, ROOT / "map/archer.webp", True)
    save_rgba(archer, ROOT / "icons/u_archer.webp", True, 512)
    rider = open_src("Gemini_Generated_Image_96va2f96va2f96va.jfif")
    save_rgba(rider, ROOT / "map/rider.webp", True)
    save_rgba(rider, ROOT / "icons/u_cavalry.webp", True, 512)
    spear = open_src("Gemini_Generated_Image_fgpgcwfgpgcwfgpg.jfif")
    save_rgba(spear, ROOT / "map/soldier.webp", True)
    save_rgba(spear, ROOT / "icons/u_spear.webp", True, 512)
    save_rgba(spear, ROOT / "icons/soldier.webp", True, 512)

    # --- kuşatma ---
    save_rgba(open_src("Gemini_Generated_Image_7yp6xc7yp6xc7yp6.jfif"), ROOT / "map/siege.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_7yp6xc7yp6xc7yp6 (1).jfif"), ROOT / "map/siege_alt.webp", True)

    # --- dost NPC ---
    save_rgba(open_src("Gemini_Generated_Image_a5n4hea5n4hea5n4.jfif"), ROOT / "heroes/npc_blacksmith.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_bq9nobq9nobq9nob.jfif"), ROOT / "heroes/npc_blacksmith_alt.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_bq9nobq9nobq9nob (2).jfif"), ROOT / "heroes/npc_innkeeper.webp", True)
    merc_sheet = open_src("Gemini_Generated_Image_bq9nobq9nobq9nob (3).jfif")
    mL, mR = crop_halves(merc_sheet)
    save_rgba(mL, ROOT / "heroes/npc_merchant.webp", True)
    save_rgba(mR, ROOT / "heroes/npc_scout.webp", True)

    # --- düşman NPC (çift savaşçı) ---
    foe = open_src("Gemini_Generated_Image_bobjbjbobjbjbobj (1).jfif")
    fL, fR = crop_halves(foe)
    save_rgba(fL, ROOT / "heroes/enemy_sword.webp", True)
    save_rgba(fR, ROOT / "heroes/enemy_axe.webp", True)
    save_rgba(fL, ROOT / "icons/j_bandit.webp", True, 512)
    save_rgba(fR, ROOT / "heroes/enemy_guard.webp", True)

    # atlı düşman / reis
    save_rgba(open_src("Gemini_Generated_Image_bobjbjbobjbjbobj.jfif"), ROOT / "heroes/enemy_rider.webp", True)
    save_rgba(open_src("Gemini_Generated_Image_bobjbjbobjbjbobj (2).jfif"), ROOT / "heroes/enemy_heavy.webp", True)

    # üretilen harami reisi
    chief = GEN / "enemy_bandit_chief.jpg"
    if chief.exists():
        save_rgba(Image.open(chief), ROOT / "heroes/enemy_chief.webp", True)
        save_rgba(Image.open(chief), ROOT / "icons/j_bandit.webp", True, 512)

    # --- silk road maps ---
    save_rgba(open_src("Gemini_Generated_Image_biz01kbiz01kbiz0.jfif"), ROOT / "cine/silk_road_map.jpg", False, 1600)
    save_rgba(open_src("Gemini_Generated_Image_oqac74oqac74oqac.jfif"), ROOT / "cine/silk_road_float.jpg", False, 1400)


if __name__ == "__main__":
    main()
