import { chromium } from "playwright-core";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Üretilen PNG'leri oyuna alır: kırpıp ölçekler, istenirse magenta arka planı saydam yapar, WebP yazar.
 * usage: tsx tools/art-in.ts <src.png>=<out.webp>@<w>x<h>[:key] ...
 * key verilirse kenarlardan taşan düz arka plan (magenta ya da köşe rengi) silinir.
 */
const jobs = process.argv.slice(2).map((a) => {
  const [src, rest] = a.split("=");
  const [out, spec] = rest.split("@");
  const [size, key] = spec.split(":");
  const [w, h] = size.split("x").map(Number);
  return { src, out, w, h, key: key === "key", round: key === "round" };
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
await page.evaluate("window.__name = (f) => f");
for (const j of jobs) {
  const mime = /\.jpe?g$/i.test(j.src) ? "image/jpeg" : "image/png";
  const url = `data:${mime};base64,${readFileSync(j.src).toString("base64")}`;
  const out = (await page.evaluate(`(async () => {
    const i = new Image(); i.src = ${JSON.stringify(url)}; await i.decode();
    const W = ${j.w}, H = ${j.h}, KEY = ${j.key}, ROUND = ${j.round};
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.imageSmoothingQuality = "high";
    const k = Math.max(W / i.width, H / i.height);
    g.drawImage(i, (W - i.width * k) / 2, (H - i.height * k) / 2, i.width * k, i.height * k);
    if (KEY) {
      const d = g.getImageData(0, 0, W, H), p = d.data;
      const cr = p[0], cg = p[1], cb = p[2];
      const far = (o) => Math.hypot(p[o] - cr, p[o + 1] - cg, p[o + 2] - cb);
      const seen = new Uint8Array(W * H), q = [];
      for (let x = 0; x < W; x++) { q.push(x, (H - 1) * W + x); }
      for (let y = 0; y < H; y++) { q.push(y * W, y * W + W - 1); }
      while (q.length) {
        const n = q.pop(); if (seen[n]) continue; seen[n] = 1;
        const o = n * 4; const dist = far(o);
        if (dist > 70) continue;
        p[o + 3] = dist < 40 ? 0 : Math.round(255 * (dist - 40) / 30);
        const x = n % W, y = (n / W) | 0;
        if (x > 0) q.push(n - 1); if (x < W - 1) q.push(n + 1); if (y > 0) q.push(n - W); if (y < H - 1) q.push(n + W);
      }
      for (let n = 0; n < W * H; n++) {
        const o = n * 4;
        if (seen[n] || p[o + 3] === 0) continue;
        const dist = far(o);
        if (dist < 45) p[o + 3] = 0;
        else if (dist < 70) p[o + 3] = Math.min(p[o + 3], Math.round(255 * (dist - 45) / 25));
      }
      const magenta = cg < 90 && cr > 150 && cb > 90;
      if (magenta) {
        const a0 = new Uint8Array(W * H);
        for (let n = 0; n < W * H; n++) a0[n] = p[n * 4 + 3];
        const R = 2;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const n = y * W + x, o = n * 4;
          if (a0[n] === 0) continue;
          let edge = a0[n] < 250;
          for (let dy = -R; dy <= R && !edge; dy++) for (let dx = -R; dx <= R && !edge; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx >= 0 && yy >= 0 && xx < W && yy < H && a0[yy * W + xx] < 128) edge = true;
          }
          if (!edge) continue;
          const m = Math.min(p[o], p[o + 2]) - p[o + 1];
          if (m > 12) { p[o] -= m * 0.85; p[o + 2] -= m * 0.85; }
        }
      }
      g.putImageData(d, 0, 0);
    }
    if (ROUND) {
      const d = g.getImageData(0, 0, W, H), p = d.data;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const r = Math.hypot((x - W / 2) / (W / 2), (y - H * 0.46) / (H / 2));
        const a = Math.max(0, Math.min(1, (0.98 - r) / 0.22));
        p[(y * W + x) * 4 + 3] = Math.round(p[(y * W + x) * 4 + 3] * a * a * (3 - 2 * a));
      }
      g.putImageData(d, 0, 0);
    }
    return c.toDataURL("image/webp", 0.86);
  })()`)) as string;
  mkdirSync(dirname(j.out), { recursive: true });
  writeFileSync(j.out, Buffer.from(out.split(",")[1], "base64"));
  console.log(j.out);
}
await browser.close();
