/**
 * P0 smoke: Practice settle OR fight → endEnabled → overnight; porch-call by ~2.4s.
 * Usage: serve RivalPorch then node scripts/smoke-end-evening.mjs [baseUrl]
 */
import { chromium } from "playwright-core";

const base = process.argv[2] || "http://127.0.0.1:8765/";
const chrome = process.env.CHROME_PATH || "/usr/bin/google-chrome-stable";
const browser = await chromium.launch({ executablePath: chrome, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

async function bootCold() {
  await page.goto(base + "?coldAudit=1", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("#screen-title button")].find((x) =>
      /tap|başla|start|oyna/i.test(x.textContent || "")
    );
    b?.click();
  });
  await page.waitForTimeout(500);
  for (let i = 0; i < 16; i++) {
    const did = await page.evaluate(() => {
      const c = document.querySelector(
        '.choice-stack button,[data-action="cold-choice"],[data-action="story-choice"]'
      );
      if (!c) return false;
      c.click();
      return true;
    });
    if (!did) break;
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(400);
}

async function gotoCup() {
  for (let i = 0; i < 8; i++) {
    const onCup = await page.evaluate(() => !!document.querySelector("#screen-cup.active"));
    if (onCup) return true;
    await page.evaluate(() => {
      document.querySelector('[data-action="goto-cup"],[data-testid="practice-match"]')?.click();
      const prim = document.querySelector('[data-action="goto-cup"]');
      prim?.click();
    });
    await page.waitForTimeout(250);
  }
  return page.evaluate(() => !!document.querySelector("#screen-cup.active"));
}

const out = { settle: null, fight: null, porch: null };

// Path A: settle → End evening → overnight
await bootCold();
const cupOk = await gotoCup();
out.settle = { cupOk };
if (cupOk) {
  await page.evaluate(() => document.querySelector('[data-testid="show-me"],[data-action="syn-show-me"]')?.click());
  await page.waitForTimeout(300);
  const settleVisible = await page.evaluate(() => !!document.querySelector('[data-testid="practice-settle"]'));
  out.settle.settleVisible = settleVisible;
  if (settleVisible) {
    await page.click('[data-testid="practice-settle"]');
    await page.waitForTimeout(200);
    await page.click('[data-testid="practice-settle-confirm"]');
    await page.waitForTimeout(500);
  } else {
    // nuclear: force via evaluate as last resort for diagnostics only
    await page.evaluate(() => {
      const s = window;
    });
  }
  const endState = await page.evaluate(() => ({
    endEnabled: document.documentElement.dataset.endEnabled,
    btn: document.querySelector('[data-testid="end-evening"]')?.dataset?.endEnabled,
    disabled: document.querySelector('[data-testid="end-evening"]')?.disabled,
    flags: JSON.parse(localStorage.getItem("rivalPorch.save.v4") || "{}")?.storyFlags,
    screen: document.querySelector(".screen.active")?.id,
  }));
  out.settle.endState = endState;
  if (endState.btn === "true" || endState.endEnabled === "true") {
    await page.click('[data-testid="end-evening"]');
    await page.waitForTimeout(600);
    out.settle.overnight = await page.evaluate(() => document.querySelector("#screen-overnight.active")?.id || document.querySelector(".screen.active")?.id);
  }
}

// Path B: fight + porch-call at 2.4s
await bootCold();
await gotoCup();
await page.evaluate(() => {
  document.querySelector('[data-testid="show-me"],[data-action="syn-show-me"]')?.click();
});
await page.waitForTimeout(200);
await page.evaluate(() => document.querySelector('[data-testid="start-fight"],[data-action="start-fight"]')?.click());
await page.waitForTimeout(400);
const fight = await page.evaluate(() => ({
  screen: document.querySelector(".screen.active")?.id,
  units: document.querySelectorAll(".rp-arena-unit, .fight-unit, [data-unit]").length,
}));
out.fight = fight;
await page.waitForTimeout(2800);
const porch = await page.evaluate(() => ({
  modal: !!document.querySelector('[data-testid="porch-call-modal"]'),
  focus: !!document.querySelector('[data-testid="porch-call-focus"]'),
  prop: !!document.querySelector('[data-testid="porch-call-prop"]'),
  swap: !!document.querySelector('[data-testid="porch-call-swap"]'),
  anyCall: !!document.querySelector("[data-action='porch-call'],#fight-actions:not([hidden])"),
  fightActionsHtml: document.getElementById("fight-actions")?.innerHTML?.slice(0, 200) || "",
}));
out.porch = porch;
if (porch.focus) {
  await page.click('[data-testid="porch-call-focus"]');
  await page.waitForTimeout(800);
}
// finish fight quickly then check end evening
for (let i = 0; i < 40; i++) {
  await page.evaluate(() => document.querySelector('[data-action="skip-fight"]')?.click());
  await page.waitForTimeout(100);
  const done = await page.evaluate(() => !!document.querySelector("#screen-comic.active, #screen-evening.active"));
  if (done) break;
}
await page.evaluate(() => document.querySelector('[data-action="goto-evening"]')?.click());
await page.waitForTimeout(500);
const afterFight = await page.evaluate(() => ({
  endEnabled: document.documentElement.dataset.endEnabled,
  btn: document.querySelector('[data-testid="end-evening"]')?.dataset?.endEnabled,
  flags: JSON.parse(localStorage.getItem("rivalPorch.save.v4") || "{}")?.storyFlags,
  screen: document.querySelector(".screen.active")?.id,
}));
out.fight.after = afterFight;
if (afterFight.btn === "true" || afterFight.endEnabled === "true") {
  await page.click('[data-testid="end-evening"]');
  await page.waitForTimeout(600);
  out.fight.overnight = await page.evaluate(() => document.querySelector(".screen.active")?.id);
}

console.log(JSON.stringify(out, null, 2));
const passSettle = out.settle?.overnight === "screen-overnight" || out.settle?.endState?.endEnabled === "true";
const passFight = out.fight?.screen === "screen-fight";
const passPorch = out.porch?.modal || out.porch?.anyCall;
const passEnd = out.fight?.overnight === "screen-overnight" || out.fight?.after?.endEnabled === "true";
const ok = passSettle && passFight && passPorch && passEnd;
console.log(JSON.stringify({ passSettle, passFight, passPorch, passEnd, ok }));
await browser.close();
process.exit(ok ? 0 : 1);
