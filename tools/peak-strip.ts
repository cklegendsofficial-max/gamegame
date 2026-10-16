import { chromium } from "playwright-core";
import { readFileSync, writeFileSync } from "fs";
const jobs = [
  ["tools/cc0/td_ex/PNG/Details/rocks_5.png", "next/src/assets/map/peak0.webp"],
  ["tools/cc0/td_ex/PNG/Details/rocks_1.png", "next/src/assets/map/peak1.webp"],
  ["tools/cc0/td_ex/PNG/Details/rocks_3.png", "next/src/assets/map/peak2.webp"],
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
for (const [src, out] of jobs) {
  const url = "data:image/png;base64," + readFileSync(src).toString("base64");
  const data = await page.evaluate(async (url) => {
    const i = new Image();
    i.src = url;
    await i.decode();
    const W = 200, H = 170;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    const mist = g.createRadialGradient(W / 2, H * 0.88, 8, W / 2, H * 0.88, 90);
    mist.addColorStop(0, "rgba(150,110,70,0.45)");
    mist.addColorStop(0.55, "rgba(150,110,70,0.15)");
    mist.addColorStop(1, "rgba(150,110,70,0)");
    g.fillStyle = mist;
    g.beginPath();
    g.ellipse(W / 2, H * 0.9, 88, 20, 0, 0, Math.PI * 2);
    g.fill();
    const k = Math.min((W * 0.92) / i.width, (H * 0.85) / i.height);
    const dx = (W - i.width * k) / 2, dy = H * 0.05;
    g.drawImage(i, dx, dy, i.width * k, i.height * k);
    const d = g.getImageData(0, 0, W, H), p = d.data;
    for (let n = 0; n < W * H; n++) {
      const o = n * 4, r = p[o], gg = p[o + 1], b = p[o + 2], a = p[o + 3];
      if (a < 8) continue;
      if (r < 18 && gg < 18 && b < 18) { p[o + 3] = 0; continue; }
      if (gg > r + 25 && gg > b + 20 && gg > 90) { p[o + 3] = 0; continue; }
      const y = (n / W) | 0;
      if (y > H * 0.72 && r > 90 && r < 190 && gg > 60 && gg < 150 && b < 100 && r - b > 35) { p[o + 3] = 0; continue; }
      if (gg > 140 && r < 120 && b < 100) { p[o + 3] = 0; continue; }
    }
    g.putImageData(d, 0, 0);
    return c.toDataURL("image/webp", 0.88);
  }, url);
  writeFileSync(out, Buffer.from(data.split(",")[1], "base64"));
  console.log("ok", out);
}
await browser.close();
