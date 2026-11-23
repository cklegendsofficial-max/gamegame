/**
 * Assert street .rp-hotspot hit targets: ≥4 with height≥48 and width≥48.
 * Usage: serve RivalPorch then NODE_PATH=... node scripts/smoke-hotspots.mjs [baseUrl]
 */
import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://127.0.0.1:8765/';
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const browser = await chromium.launch({ executablePath: chrome, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto(base, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.evaluate(() => {
  const b = [...document.querySelectorAll('#screen-title button')].find((x) =>
    /tap|başla|start|oyna/i.test(x.textContent || '')
  );
  b?.click();
});
await page.waitForTimeout(600);
for (let i = 0; i < 12; i++) {
  const did = await page.evaluate(() => {
    const c = document.querySelector('.choice-stack button,[data-action="cold-choice"],[data-action="story-choice"]');
    if (!c) return false;
    c.click();
    return true;
  });
  if (!did) break;
  await page.waitForTimeout(120);
}
await page.evaluate(() => document.querySelector('[data-action="goto-street"]')?.click());
await page.waitForTimeout(500);
const dims = await page.evaluate(() =>
  [...document.querySelectorAll('.rp-hotspot')].map((h) => {
    const r = h.getBoundingClientRect();
    return { h: Math.round(r.height), w: Math.round(r.width) };
  })
);
const ok = dims.filter((d) => d.h >= 48 && d.w >= 48 && d.w <= 96);
console.log(JSON.stringify({ dims, pass: ok.length, need: 4 }));
await browser.close();
if (ok.length < 4) process.exit(1);
