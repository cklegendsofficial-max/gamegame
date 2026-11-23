import { loadSave, persistSave, clearSave, defaultSave } from "./save.js";
import {
  econT, grant, canPay, pay, bestAffordablePrice, ownCosmetic, owns,
  formatPrice, rewardLabel, applyDailyEarn, applyCupEarn, addPassXp, claimPassReward,
} from "./wallet.js";

const DAY1_BUSTS = {
  n1: "assets/rival-porch/bust-n1-aunt-merve.png",
  n2: "assets/rival-porch/bust-n2-coach-cem.png",
  n3: "assets/rival-porch/bust-n3-kid-leyla.png",
  n4: "assets/rival-porch/bust-n4-mr-orhan.png",
  n5: "assets/rival-porch/bust-n5-dj-peri.png",
  n6: "assets/rival-porch/bust-n6-baker-can.png",
};

const ART = {
  streetHero: "assets/rival-porch/street-hero.png",
  arenaStage: "assets/rival-porch/arena-stage.png",
  busts: { ...DAY1_BUSTS },
  meshyRoot: "art/meshy/",
};

const UNIT_STATS = {
  n1: { hp: 95, atk: 9, def: 7, spd: 10 },
  n2: { hp: 115, atk: 15, def: 9, spd: 9 },
  n3: { hp: 72, atk: 19, def: 4, spd: 15 },
  n4: { hp: 145, atk: 10, def: 17, spd: 6 },
  n5: { hp: 88, atk: 13, def: 5, spd: 12 },
  n6: { hp: 100, atk: 8, def: 8, spd: 8 },
};

const state = {
  content: null,
  economy: null,
  depthMeta: null,
  stories: null,
  ladder: null,
  shopTab: "skins",
  save: null,
  locale: "tr",
  selectedNeighbor: null,
  storyArc: null,
  storyNodeId: null,
  streetEvent: null,
  cupPicks: [],
  placement: [],
  selectedBench: null,
  lastResult: null,
  fightTimer: null,
  pickCount: 3,
  botMult: 1,
};

const el = { app: document.getElementById("app"), canvas: document.getElementById("share-canvas") };

function t(key) {
  const s = state.content?.uiStrings?.[key];
  if (!s) return key;
  return s[state.locale] || s.en || key;
}
function loc(obj) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[state.locale] || obj.en || obj.tr || "";
}
function fillTemplate(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
function toast(msg) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    el.app.appendChild(node);
  }
  node.textContent = msg;
  node.classList.add("show");
  clearTimeout(node._hide);
  node._hide = setTimeout(() => node.classList.remove("show"), 2400);
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id)?.classList.add("active");
}
function saveNow() {
  state.save.locale = state.locale;
  persistSave(state.save);
}

function allNeighbors() {
  const extras = (state.ladder?.extraNeighbors || []).map((n) => ({
    ...n,
    giftLines: n.giftLines || [
      {
        id: `${n.id}_gift`,
        itemTag: "tea",
        text: loc({ tr: "Teşekkürler, komşu.", en: "Thanks, neighbor." })
          ? { tr: "Teşekkürler, komşu.", en: "Thanks, neighbor." }
          : { tr: "Teşekkürler.", en: "Thanks." },
        affinityDelta: 1,
      },
    ],
    talkLines: n.talkLines || [
      { id: `${n.id}_talk`, text: { tr: "Mahalle büyüyor.", en: "The block is growing." } },
    ],
    drama: n.drama || null,
  }));
  const map = new Map();
  for (const n of state.content.neighbors) map.set(n.id, n);
  for (const n of extras) if (!map.has(n.id)) map.set(n.id, n);
  return [...map.values()];
}

function neighborById(id) {
  return allNeighbors().find((n) => n.id === id);
}

function unlockedNeighbors() {
  return allNeighbors().filter((n) => state.save.unlockedNeighbors.includes(n.id));
}

function bust(id) {
  const n = neighborById(id);
  const meshy = n?.meshyHook;
  if (meshy) return meshy;
  if (ART.busts[id]) return ART.busts[id];
  const fallback = ["n1", "n2", "n3", "n4", "n5", "n6"][(id.replace(/\D/g, "") - 1) % 6];
  return ART.busts[fallback] || ART.busts.n1;
}

function unitStatsFor(id) {
  const n = neighborById(id);
  if (n?.stats) return { ...n.stats };
  return { ...(UNIT_STATS[id] || { hp: 90, atk: 10, def: 8, spd: 10 }) };
}

function weekNumber() {
  const d = state.save.dayIndex;
  const dpw = state.ladder?.season?.daysPerWeek || 7;
  return Math.min(state.ladder?.season?.weeks || 8, Math.ceil(d / dpw));
}

function dayOfWeek() {
  const dpw = state.ladder?.season?.daysPerWeek || 7;
  return ((state.save.dayIndex - 1) % dpw) + 1;
}

function isCupNight() {
  const days = state.depthMeta.eveningAgenda.weekendExtra?.daysOfWeek || [6, 7];
  return days.includes(dayOfWeek());
}

function difficultyForWeek() {
  const w = weekNumber();
  const rows = state.ladder.botDifficulty || [];
  return rows.find((r) => w <= r.weekMax) || rows[rows.length - 1] || { statMult: 1 };
}

function pickCountForWeek() {
  const w = weekNumber();
  const rows = state.ladder.rosterExpansion?.cupPickCountByWeek || [];
  const row = rows.find((r) => w <= r.weekMax) || rows[rows.length - 1];
  return row?.picks || 3;
}

function activeSynergyDefs() {
  const base = state.content.synergies || [];
  const grown = (state.ladder.synergyGrowth || []).filter((s) => weekNumber() >= (s.unlockWeek || 1));
  return [...base, ...grown];
}

function activeSynergies(tags) {
  return activeSynergyDefs().filter((s) => {
    const count = tags.filter((tag) => s.tagsRequired.includes(tag)).length;
    return count >= s.minCount;
  });
}

function ensureNeighborState(id) {
  if (state.save.affinity[id] == null) state.save.affinity[id] = 3;
  if (!state.save.traits[id]) {
    const n = neighborById(id);
    state.save.traits[id] = n ? { [n.trait]: 2 } : {};
  }
}

function bumpAffinity(id, delta) {
  ensureNeighborState(id);
  state.save.affinity[id] = Math.max(0, Math.min(10, (state.save.affinity[id] || 0) + delta));
}

function applyEffects(effects, neighborId) {
  if (!effects) return;
  if (effects.affinityDelta && neighborId) bumpAffinity(neighborId, effects.affinityDelta);
  if (effects.affinity) {
    for (const [id, d] of Object.entries(effects.affinity)) bumpAffinity(id, d);
  }
  if (effects.affinityAll) {
    for (const n of unlockedNeighbors()) bumpAffinity(n.id, effects.affinityAll);
  }
  if (effects.traits && neighborId) {
    ensureNeighborState(neighborId);
    for (const [k, v] of Object.entries(effects.traits)) {
      state.save.traits[neighborId][k] = (state.save.traits[neighborId][k] || 0) + v;
    }
  }
  const curMap = { teaLeaves: "porch_coins", neonTokens: "neon_thread", ovenCoins: "porch_coins", porch_coins: "porch_coins", neon_thread: "neon_thread", clay_tokens: "clay_tokens" };
  for (const [k, v] of Object.entries(effects)) {
    if (curMap[k] && typeof v === "number") state.save.currencies[curMap[k]] = (state.save.currencies[curMap[k]] || 0) + v;
  }
  if (effects.mood) state.save.mood = Math.max(0, Math.min(5, state.save.mood + effects.mood));
  if (effects.storyFlags) {
    for (const [k, v] of Object.entries(effects.storyFlags)) state.save.storyFlags[k] = v;
  }
  if (effects.inventoryGift) {
    state.save.inventory[effects.inventoryGift] = (state.save.inventory[effects.inventoryGift] || 0) + 1;
  }
  if (effects.checkinBonus) state.save.checkinStreak += effects.checkinBonus;
  saveNow();
}

function eveningStats() {
  const needVisits = state.depthMeta.eveningAgenda.requiredActions.find((a) => a.id === "visits")?.count || 3;
  const e = state.save.evening;
  return {
    needVisits,
    visits: e.visits.length,
    checkin: e.checkin,
    streetEvent: e.streetEvent,
    errand: e.errand,
    cupRequired: isCupNight(),
    cupDone: e.cupDone,
    complete:
      e.checkin &&
      e.visits.length >= needVisits &&
      e.streetEvent &&
      e.errand &&
      (!isCupNight() || e.cupDone),
  };
}

function hudHtml() {
  const s = state.save;
  const dayLine = fillTemplate(t("day.label"), { day: s.dayIndex, week: weekNumber() });
  return `
    <div class="meta-hud">
      <div class="meta-day">${dayLine}</div>
      <div class="meta-currencies">
        <span title="porch_coins">🪙 ${s.currencies.porch_coins||0}</span>
        <span title="neon_thread">🧵 ${s.currencies.neon_thread||0}</span>
        <span title="clay_tokens">🧱 ${s.currencies.clay_tokens||0}</span>
      </div>
    </div>`;
}

function buildShell() {
  el.app.innerHTML = `
    <section class="screen screen-title active" id="screen-title"></section>
    <section class="screen" id="screen-evening"></section>
    <section class="screen screen-street" id="screen-street"></section>
    <section class="screen screen-neighbor" id="screen-neighbor"></section>
    <section class="screen" id="screen-story"></section>
    <section class="screen" id="screen-event"></section>
    <section class="screen" id="screen-cup"></section>
    <section class="screen" id="screen-draft"></section>
    <section class="screen" id="screen-fight"></section>
    <section class="screen" id="screen-comic"></section>
    <section class="screen" id="screen-shop"></section>
    <section class="screen" id="screen-ladder"></section>
  `;
}

function renderTitle() {
  const screen = document.getElementById("screen-title");
  screen.style.backgroundImage = `url("${ART.streetHero}")`;
  const hasSave = state.save.dayIndex > 1 || state.save.evening.checkin || state.save.cupHistory.length;
  screen.innerHTML = `
    <div class="title-panel">
      <button class="btn btn-secondary lang-toggle" type="button" data-action="toggle-lang">${state.locale === "tr" ? "EN" : "TR"}</button>
      <h1 class="brand">${t("app.title")}</h1>
      <p class="title-tag">${state.locale === "tr"
        ? "Uzun akşamlar, demlenen ilişkiler, sezonluk Porch Cup."
        : "Long evenings, brewing bonds, seasonal Porch Cup."}</p>
      ${hasSave ? `<button class="btn btn-primary" type="button" data-action="continue-save">${t("common.continue_save")} — ${fillTemplate(t("day.label"), { day: state.save.dayIndex, week: weekNumber() })}</button>` : ""}
      <button class="btn ${hasSave ? "btn-secondary" : "btn-primary"}" type="button" data-action="new-game">${hasSave ? t("common.new_game") : t("boot.tap_to_start")}</button>
      <button class="btn btn-secondary" type="button" data-action="open-shop">${t("shop.title")}</button>
    </div>`;
}

function renderEvening() {
  const st = eveningStats();
  const screen = document.getElementById("screen-evening");
  const items = [
    { ok: st.checkin, label: t("street.porch_checkin") },
    { ok: st.visits >= st.needVisits, label: `${t("evening.visit_need")} ${st.visits}/${st.needVisits}` },
    { ok: st.streetEvent, label: t("street.event") },
    { ok: st.errand, label: loc(state.depthMeta.eveningAgenda.requiredActions.find((a) => a.id === "errand").label) },
  ];
  if (st.cupRequired) items.push({ ok: st.cupDone, label: t("cup.season_night") });

  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("evening.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="open-ladder">${t("meta.ladder")}</button>
    </div>
    <p class="muted">${fillTemplate(t("day.streak"), { n: state.save.checkinStreak })} · mood ${state.save.mood}/5</p>
    <ul class="agenda-list">
      ${items.map((i) => `<li class="${i.ok ? "done" : ""}">${i.ok ? "✓" : "○"} ${i.label}</li>`).join("")}
    </ul>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="goto-street">${t("street.header")}</button>
      <button class="btn btn-teal" type="button" data-action="open-shop">${t("shop.title")}</button>
      ${st.cupRequired || true ? `<button class="btn btn-ember" type="button" data-action="goto-cup">${isCupNight() ? t("cup.season_night") : t("cup.practice")}</button>` : ""}
    </div>
    <div class="btn-row">
      <button class="btn btn-rose" type="button" data-action="end-evening" ${st.complete ? "" : "disabled"}>${t("evening.end")}</button>
    </div>
    ${st.complete ? "" : `<p class="street-hint">${t("evening.locked")}</p>`}
  `;
}

function renderStreet() {
  const screen = document.getElementById("screen-street");
  const spots = unlockedNeighbors()
    .slice(0, 12)
    .map((n) => {
      const done = state.save.evening.visits.includes(n.id);
      return `<button class="hotspot ${done ? "visited" : ""}" type="button" data-action="open-neighbor" data-id="${n.id}" aria-label="${loc(n.name)}">
        <img class="bust-mini" src="${bust(n.id)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" />
        <span class="label">${loc(n.name)}${done ? " ✓" : ""}</span>
      </button>`;
    })
    .join("");

  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar">
      <h2>${t("street.header")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <div class="street-stage" style="background-image:url('${ART.streetHero}')">
      <div class="hotspots hotspots-wrap">${spots}</div>
    </div>
    <p class="street-hint">${t("street.hint_tap_neighbor")}</p>
    <div class="mood-bar">
      <button class="btn btn-rose" type="button" data-action="checkin" ${state.save.evening.checkin ? "disabled" : ""}>${t("street.porch_checkin")}</button>
      <button class="btn btn-secondary" type="button" data-action="street-event" ${state.save.evening.streetEvent ? "disabled" : ""}>${t("street.event")}</button>
      <button class="btn btn-teal" type="button" data-action="open-shop">${t("shop.gifts")}</button>
    </div>`;
}

function pickArcForNeighbor(id) {
  const arcs = (state.stories.neighborArcs || []).filter((a) => a.neighborId === id && state.save.dayIndex >= (a.minDay || 1));
  arcs.sort((a, b) => (b.minDay || 1) - (a.minDay || 1));
  return arcs[0] || null;
}

function renderNeighbor(id) {
  ensureNeighborState(id);
  state.selectedNeighbor = id;
  const n = neighborById(id);
  const affinity = state.save.affinity[id] || 0;
  const visited = state.save.evening.visits.includes(id);
  const screen = document.getElementById("screen-neighbor");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(n.name)}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-street">${t("common.back")}</button>
    </div>
    <div class="neighbor-hero">
      <div class="bust-frame frame-${state.save.equipped?.comic_frame || "frame_chalk_grid"}"><img src="${bust(id)}" alt="${loc(n.name)}" onerror="this.src='${DAY1_BUSTS.n1}'" /></div>
      <div class="neighbor-meta">
        <h2>${loc(n.name)}</h2>
        <p class="meta-line"><strong>${t("neighbor.trait")}:</strong> ${n.trait}</p>
        <p class="meta-line"><strong>${t("neighbor.role")}:</strong> ${n.role}</p>
        <p class="meta-line"><strong>${t("neighbor.prop")}:</strong> ${loc(n.prop?.label)}</p>
        <p class="meta-line"><span class="chip ${(n.synergyTag || "").toLowerCase()}">${n.synergyTag}</span></p>
        <p class="meta-line">${t("neighbor.affinity")}: ${affinity}/10</p>
        <div class="affinity-bar"><div class="affinity-fill" style="width:${affinity * 10}%"></div></div>
      </div>
    </div>
    <div class="dialog-box" id="neighbor-dialog">
      ${visited ? t("story.done") : state.locale === "tr" ? "Derin sahne, hediye veya klasik drama." : "Deep scene, gift, or classic drama."}
    </div>
    <div class="btn-row" id="neighbor-actions">
      <button class="btn btn-primary" type="button" data-action="start-story" data-id="${id}" ${visited ? "disabled" : ""}>${t("story.scene")}</button>
      <button class="btn btn-teal" type="button" data-action="gift" data-id="${id}">${t("neighbor.gift")}</button>
      <button class="btn btn-secondary" type="button" data-action="talk" data-id="${id}">${t("neighbor.talk")}</button>
      ${n.drama ? `<button class="btn btn-ember" type="button" data-action="drama" data-id="${id}">${t("neighbor.drama")}</button>` : ""}
    </div>`;
}

function startStory(id) {
  const arc = pickArcForNeighbor(id);
  if (!arc) {
    toast("No arc");
    return;
  }
  state.storyArc = arc;
  state.storyNodeId = state.save.storyProgress[arc.id] || arc.startNode;
  renderStory();
  showScreen("screen-story");
}

function renderStory() {
  const arc = state.storyArc;
  const node = arc.nodes[state.storyNodeId];
  const n = neighborById(arc.neighborId);
  const screen = document.getElementById("screen-story");
  if (!node) {
    finishStoryVisit(arc.neighborId);
    return;
  }
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(arc.title)}</h2>
      <button class="btn btn-secondary" type="button" data-action="open-neighbor" data-id="${arc.neighborId}">${t("common.back")}</button>
    </div>
    <div class="neighbor-hero compact">
      <div class="bust-frame"><img src="${bust(n.id)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" /></div>
      <div><h2>${loc(n.name)}</h2><p class="muted">${t("story.scene")}</p></div>
    </div>
    <div class="dialog-box"><p class="prompt">${loc(node.text)}</p>
      <div class="choice-stack">
        ${node.choices
          .map(
            (c) =>
              `<button class="btn btn-secondary" type="button" data-action="story-choice" data-cid="${c.id}">${loc(c.label)}</button>`
          )
          .join("")}
      </div>
    </div>`;
}

function storyChoice(cid) {
  const arc = state.storyArc;
  const node = arc.nodes[state.storyNodeId];
  const choice = node.choices.find((c) => c.id === cid);
  if (!choice) return;
  applyEffects(choice.effects, arc.neighborId);
  if (!choice.next) {
    state.save.storyProgress[arc.id] = arc.startNode;
    finishStoryVisit(arc.neighborId);
    return;
  }
  state.storyNodeId = choice.next;
  state.save.storyProgress[arc.id] = choice.next;
  saveNow();
  renderStory();
}

function finishStoryVisit(id) {
  if (!state.save.evening.visits.includes(id)) state.save.evening.visits.push(id);
  state.save.visitedArcToday[id] = true;
  saveNow();
  toast(t("story.done"));
  renderNeighbor(id);
  showScreen("screen-neighbor");
}

function doGift(id) {
  const n = neighborById(id);
  const gifts = state.depthMeta.giftCatalog || [];
  const affordable = gifts.find((g) => canPay(state.save, { currency: "porch_coins", amount: g.cost.porch_coins }));
  if (!affordable) {
    toast(state.locale === "tr" ? "Veranda Jetonu yetmiyor — dükkân / check-in" : "Need Porch Coins — shop / check-in");
    state.shopTab = "gifts";
    renderShop();
    showScreen("screen-shop");
    return;
  }
  pay(state.save, { currency: "porch_coins", amount: affordable.cost.porch_coins });
  const line = (n.giftLines && n.giftLines[0]) || {
    text: { tr: "Teşekkürler.", en: "Thanks." },
    affinityDelta: affordable.affinityDelta || 1,
  };
  bumpAffinity(id, line.affinityDelta || affordable.affinityDelta || 1);
  state.save.evening.errand = true;
  addPassXp(state.save, 0.2);
  saveNow();
  renderNeighbor(id);
  document.getElementById("neighbor-dialog").innerHTML = `<p>${loc(line.text)}</p><p class="muted">-${affordable.cost.porch_coins} 🪙 · ${loc(affordable.name)}</p>`;
}

function doTalk(id) {
  const n = neighborById(id);
  const lines = n.talkLines || [];
  const line = lines[Math.floor(Math.random() * Math.max(1, lines.length))] || {
    text: { tr: "…", en: "…" },
  };
  bumpAffinity(id, 1);
  applyDailyEarn(state.save, state.economy, "talk");
  saveNow();
  renderNeighbor(id);
  document.getElementById("neighbor-dialog").innerHTML = `<p>${loc(line.text)}</p>`;
}

function doDrama(id) {
  const n = neighborById(id);
  if (!n.drama) return;
  const d = n.drama;
  document.getElementById("neighbor-dialog").innerHTML = `
    <p class="prompt">${loc(d.prompt)}</p>
    <div class="choice-stack">
      ${d.choices
        .map(
          (c) =>
            `<button class="btn btn-secondary" type="button" data-action="drama-choice" data-nid="${id}" data-cid="${c.id}">${loc(c.label)}</button>`
        )
        .join("")}
    </div>`;
  const actions = document.getElementById("neighbor-actions");
  if (actions) actions.style.display = "none";
}

function resolveDrama(nid, cid) {
  const n = neighborById(nid);
  const choice = n.drama.choices.find((c) => c.id === cid);
  bumpAffinity(nid, choice.affinityDelta || 0);
  ensureNeighborState(nid);
  for (const [trait, delta] of Object.entries(choice.traitDeltas || {})) {
    state.save.traits[nid][trait] = (state.save.traits[nid][trait] || 0) + delta;
  }
  state.save.dramaFlags[n.drama.id] = cid;
  state.save.evening.errand = true;
  applyDailyEarn(state.save, state.economy, "drama");
  addPassXp(state.save, 0.35);
  saveNow();
  renderNeighbor(nid);
  document.getElementById("neighbor-dialog").innerHTML = `<p>${loc(choice.label)} ✓</p>`;
}

function porchCheckin() {
  if (state.save.evening.checkin) return;
  state.save.evening.checkin = true;
  if (state.save.lastCheckinDay === state.save.dayIndex - 1) state.save.checkinStreak += 1;
  else state.save.checkinStreak = 1;
  state.save.lastCheckinDay = state.save.dayIndex;
  for (const n of unlockedNeighbors()) bumpAffinity(n.id, 1);
  applyDailyEarn(state.save, state.economy, "checkin");
  addPassXp(state.save, 0.35);
  const every = state.depthMeta.streak?.checkinBonusEvery || 3;
  if (state.save.checkinStreak > 0 && state.save.checkinStreak % every === 0) {
    grant(state.save, { porch_coins: state.depthMeta.streak.bonusPorchCoins || 15 });
    toast(`Streak ${state.save.checkinStreak}! +${state.depthMeta.streak.bonusPorchCoins} 🪙`);
  } else toast(t("street.mood_tea"));
  saveNow();
  renderStreet();
}

function openStreetEvent() {
  if (state.save.evening.streetEvent) return;
  const pool = (state.stories.streetEvents || []).filter((e) => state.save.dayIndex >= (e.minDay || 1));
  state.streetEvent = pool[Math.floor(Math.random() * pool.length)] || pool[0];
  const screen = document.getElementById("screen-event");
  const ev = state.streetEvent;
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("street.event")}</h2></div>
    <div class="dialog-box">
      <p class="prompt">${loc(ev.prompt)}</p>
      <div class="choice-stack">
        ${ev.choices
          .map(
            (c) =>
              `<button class="btn btn-secondary" type="button" data-action="event-choice" data-cid="${c.id}">${loc(c.label)}</button>`
          )
          .join("")}
      </div>
    </div>`;
  showScreen("screen-event");
}

function resolveEvent(cid) {
  const ev = state.streetEvent;
  const choice = ev.choices.find((c) => c.id === cid);
  applyEffects(choice.effects, null);
  state.save.evening.streetEvent = true;
  saveNow();
  toast(loc(choice.label));
  renderEvening();
  showScreen("screen-evening");
}

function endEvening() {
  const st = eveningStats();
  if (!st.complete) {
    toast(t("evening.locked"));
    return;
  }
  for (const n of unlockedNeighbors()) {
    const gain = 1 + Math.floor(Math.random() * 3);
    bumpAffinity(n.id, gain);
  }
  applyDailyEarn(state.save, state.economy, "overnight");
  addPassXp(state.save, 1);

  state.save.dayIndex += 1;
  state.save.weekNumber = weekNumber();
  state.save.dailyEarn = { talkCoins: 0, dramaThread: false, shareClaimed: false };
  state.save.evening = {
    checkin: false,
    visits: [],
    streetEvent: false,
    errand: false,
    cupDone: false,
    complete: false,
  };
  state.save.visitedArcToday = {};
  unlockNeighborsIfReady();
  saveNow();
  toast(fillTemplate(t("idle.overnight_done"), { day: state.save.dayIndex }));
  renderEvening();
  showScreen("screen-evening");
}

function unlockNeighborsIfReady() {
  for (const row of state.ladder.unlockSchedule || []) {
    if (state.save.unlockedNeighbors.includes(row.id)) continue;
    if (state.save.dayIndex < row.unlockDay) continue;
    if ((row.requiresWins || 0) > state.save.totalWins) continue;
    state.save.unlockedNeighbors.push(row.id);
    ensureNeighborState(row.id);
    const n = neighborById(row.id);
    toast(fillTemplate(t("unlock.new_neighbor"), { name: loc(n?.name) || row.id }));
  }
}

function renderCupLobby() {
  state.pickCount = pickCountForWeek();
  state.botMult = difficultyForWeek().statMult || 1;
  const screen = document.getElementById("screen-cup");
  const list = unlockedNeighbors();
  const cards = list
    .map((n) => {
      const selected = state.cupPicks.includes(n.id);
      return `<button class="pick-card ${selected ? "selected" : ""}" type="button" data-action="toggle-pick" data-id="${n.id}">
        <img src="${bust(n.id)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" />
        <div class="name">${loc(n.name)}</div>
        <div class="muted" style="font-size:0.65rem">${n.role}</div>
      </button>`;
    })
    .join("");
  const ready = state.cupPicks.length === state.pickCount;
  const tags = state.cupPicks.map((id) => neighborById(id).synergyTag);
  const preview = activeSynergies(tags)
    .map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">${loc(s.name)}</span>`)
    .join("") || `<span class="muted">${t("synergy.active")}: —</span>`;

  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("cup.lobby_title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <p class="street-hint">${fillTemplate(t("cup.week"), { week: weekNumber(), mult: state.botMult.toFixed(2) })} · ${isCupNight() ? t("cup.season_night") : t("cup.practice")}</p>
    <p class="muted">${econT(state.economy, state.locale, "cup.flair.free_ok")}</p>
    <div class="arena-hero" style="background-image:url('${ART.arenaStage}')"></div>
    <p class="street-hint">${fillTemplate(t("cup.picks"), { n: state.pickCount })} (${list.length} ${state.locale === "tr" ? "açık" : "unlocked"})</p>
    <div class="pick-grid pick-grid-dense">${cards}</div>
    <div class="synergy-pills" style="justify-content:center">${preview}</div>
    <p class="pick-status">${state.cupPicks.length}/${state.pickCount}</p>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="goto-draft" ${ready ? "" : "disabled"}>${t("cup.start")}</button>
    </div>`;
}

function togglePick(id) {
  const i = state.cupPicks.indexOf(id);
  if (i >= 0) state.cupPicks.splice(i, 1);
  else if (state.cupPicks.length < state.pickCount) state.cupPicks.push(id);
  else toast(t("cup.locked_need_three"));
  renderCupLobby();
}

function renderDraft() {
  const slots = 6;
  if (state.placement.length !== slots) state.placement = Array(slots).fill(null);
  const bot = state.content.botCupRoster;
  const enemyIds = bot.defaultLineup;
  const allyCells = state.placement
    .map((pid, idx) => {
      const filled = pid ? `<img src="${bust(pid)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" />` : "";
      return `<button class="cell ${pid ? "filled" : ""}" type="button" data-action="place-cell" data-idx="${idx}">${filled}</button>`;
    })
    .join("");
  const enemyLayout = [enemyIds[0], enemyIds[1], null, enemyIds[2], null, null];
  const enemyHtml = enemyLayout
    .map((botId) => {
      if (!botId) return `<div class="cell enemy"></div>`;
      const unit = bot.units.find((u) => u.id === botId);
      return `<div class="cell enemy filled"><img src="${bust(unit.mirrorOf)}" alt="" /></div>`;
    })
    .join("");
  const bench = state.cupPicks
    .map((id) => {
      const placed = state.placement.includes(id);
      return `<button class="bench-unit ${placed ? "placed" : ""} ${state.selectedBench === id ? "selected" : ""}" type="button" data-action="select-bench" data-id="${id}" ${placed ? "disabled" : ""}>
        <img src="${bust(id)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" /></button>`;
    })
    .join("");
  const placedCount = state.placement.filter(Boolean).length;
  const screen = document.getElementById("screen-draft");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("draft.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-cup">${t("common.back")}</button>
    </div>
    <p class="street-hint">${t("draft.hint")}</p>
    <div class="placement-board">
      <div><div class="grid-label">${state.locale === "tr" ? "Sen" : "You"}</div><div class="grid-side">${allyCells}</div></div>
      <div><div class="grid-label">${loc(bot.label)}</div><div class="grid-side">${enemyHtml}</div></div>
    </div>
    <div class="bench">${bench}</div>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-action="auto-place">${state.locale === "tr" ? "Otomatik" : "Auto"}</button>
      <button class="btn btn-primary" type="button" data-action="start-fight" ${placedCount === state.cupPicks.length ? "" : "disabled"}>${t("draft.confirm")}</button>
    </div>`;
}

function selectBench(id) {
  state.selectedBench = id;
  renderDraft();
}
function placeCell(idx) {
  const current = state.placement[idx];
  if (current) {
    state.placement[idx] = null;
    state.selectedBench = current;
    renderDraft();
    return;
  }
  if (!state.selectedBench) {
    toast(state.locale === "tr" ? "Önce birim seç" : "Pick a unit first");
    return;
  }
  state.placement[idx] = state.selectedBench;
  state.selectedBench = null;
  renderDraft();
}
function autoPlace() {
  state.placement = Array(6).fill(null);
  state.cupPicks.forEach((id, i) => {
    state.placement[i] = id;
  });
  state.selectedBench = null;
  renderDraft();
}

function makeFighter(neighborId, side, slot) {
  const n = neighborById(neighborId);
  const base = unitStatsFor(neighborId);
  const aff = state.save.affinity[neighborId] || 0;
  base.hp += aff * 2;
  base.atk += Math.floor(aff / 3);
  return {
    id: neighborId,
    side,
    slot,
    name: loc(n.name),
    synergyTag: n.synergyTag,
    role: n.role,
    maxHp: base.hp,
    hp: base.hp,
    atk: base.atk,
    def: base.def,
    spd: base.spd,
    alive: true,
    damageDealt: 0,
  };
}

function makeBotFighter(botUnit, slot, mult) {
  const stats = botUnit.stats;
  const scale = (v) => Math.round(v * mult);
  return {
    id: botUnit.id,
    mirrorOf: botUnit.mirrorOf,
    side: "enemy",
    slot,
    name: loc(botUnit.name),
    synergyTag: botUnit.synergyTag,
    role: botUnit.role,
    maxHp: scale(stats.hp),
    hp: scale(stats.hp),
    atk: scale(stats.atk),
    def: scale(stats.def),
    spd: stats.spd,
    alive: true,
    damageDealt: 0,
  };
}

function startFight() {
  if (state.fightTimer) clearInterval(state.fightTimer);
  const allyIds = state.placement.filter(Boolean);
  const bot = state.content.botCupRoster;
  const mult = state.botMult || 1;
  const enemies = bot.defaultLineup.map((id, i) => makeBotFighter(bot.units.find((x) => x.id === id), i, mult));
  const allies = allyIds.map((id, i) => makeFighter(id, "ally", i));
  const battle = {
    allies,
    enemies,
    allySyn: activeSynergies(allies.map((a) => a.synergyTag)),
    enemySyn: activeSynergies(enemies.map((a) => a.synergyTag)),
    elapsed: 0,
    finished: false,
  };
  renderFight(battle);
  showScreen("screen-fight");
  const tickMs = 400;
  const uiMs = 100;
  let combatAcc = 0;
  const startedAt = performance.now();
  state.fightTimer = setInterval(() => {
    if (battle.finished) return;
    battle.elapsed = (performance.now() - startedAt) / 1000;
    combatAcc += uiMs;
    while (combatAcc >= tickMs) {
      combatAcc -= tickMs;
      combatTick(battle);
    }
    updateFightUI(battle);
    if (battle.elapsed >= 75 || !battle.allies.some((u) => u.alive) || !battle.enemies.some((u) => u.alive)) {
      endFight(battle);
    }
  }, uiMs);
}

function combatTick(battle) {
  const livingAllies = battle.allies.filter((u) => u.alive);
  const livingEnemies = battle.enemies.filter((u) => u.alive);
  if (!livingAllies.length || !livingEnemies.length) return;

  const order = [...livingAllies, ...livingEnemies].sort((a, b) => b.spd - a.spd);
  for (const attacker of order) {
    if (!attacker.alive) continue;
    const foes = attacker.side === "ally" ? battle.enemies.filter((u) => u.alive) : battle.allies.filter((u) => u.alive);
    if (!foes.length) break;
    let target = foes.reduce((a, b) => (a.hp < b.hp ? a : b));

    const syns = attacker.side === "ally" ? battle.enemySyn : battle.allySyn;
    const neon = syns.find((s) => s.rules.type === "opening_dodge");
    if (neon && battle.elapsed <= neon.rules.windowSec && Math.random() < neon.rules.dodgeChance) continue;

    let dmg = Math.max(1, attacker.atk - Math.floor(target.def * 0.45));
    const selfSyn = attacker.side === "ally" ? battle.allySyn : battle.enemySyn;
    const rivalry = selfSyn.find((s) => s.rules.type === "low_hp_damage_buff");
    if (rivalry && attacker.hp / attacker.maxHp <= rivalry.rules.hpThresholdPercent) {
      dmg = Math.floor(dmg * (1 + rivalry.rules.damageBonusPercent));
    }
    const fence = selfSyn.find((s) => s.rules.type === "team_def_buff");
    if (fence) dmg = Math.max(1, Math.floor(dmg * (1 - (fence.rules.defBonusPercent || 0) * 0.5)));
    const chaos = selfSyn.find((s) => s.rules.type === "crit_chance");
    if (chaos && Math.random() < chaos.rules.critChance) dmg = Math.floor(dmg * (chaos.rules.critMult || 1.5));

    if (attacker.role === "AoE" || /AoE|Burst/i.test(attacker.role || "")) {
      for (const f of foes) applyDamage(f, f === target ? dmg : Math.max(1, Math.floor(dmg * 0.35)), attacker);
    } else applyDamage(target, dmg, attacker);

    if (/Healer|heal/i.test(attacker.role || "") || attacker.synergyTag === "Oven") {
      const friends = attacker.side === "ally" ? battle.allies : battle.enemies;
      const hurt = friends.filter((u) => u.alive && u.hp < u.maxHp).sort((a, b) => a.hp - b.hp)[0];
      if (hurt) hurt.hp = Math.min(hurt.maxHp, hurt.hp + Math.max(2, Math.floor(attacker.atk * 0.6)));
    }
    flashUnit(target.side, target.slot);
  }

  for (const side of ["ally", "enemy"]) {
    const syns = side === "ally" ? battle.allySyn : battle.enemySyn;
    for (const tea of syns.filter((s) => s.rules.type === "periodic_heal_aura")) {
      const interval = tea.rules.intervalSec || 4;
      if (Math.floor(battle.elapsed / interval) !== Math.floor((battle.elapsed - 0.4) / interval)) {
        const units = side === "ally" ? battle.allies : battle.enemies;
        for (const u of units) {
          if (!u.alive) continue;
          u.hp = Math.min(u.maxHp, u.hp + Math.floor(u.maxHp * tea.rules.healPercentMaxHp));
        }
      }
    }
  }
}

function applyDamage(target, dmg, attacker) {
  target.hp -= dmg;
  attacker.damageDealt += dmg;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
}
function flashUnit(side, slot) {
  const node = document.querySelector(`.unit-slot[data-side="${side}"][data-slot="${slot}"]`);
  if (!node) return;
  node.classList.remove("hit");
  void node.offsetWidth;
  node.classList.add("hit");
}

function renderFight(battle) {
  const allyPills = battle.allySyn.map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">${loc(s.name)}</span>`).join("");
  const enemyPills = battle.enemySyn.map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">Bot · ${loc(s.name)}</span>`).join("");
  const synPills = allyPills || enemyPills ? allyPills + enemyPills : `<span class="muted">${t("synergy.active")}: —</span>`;
  const screen = document.getElementById("screen-fight");
  screen.innerHTML = `
    <div class="topbar"><h2>${t("fight.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="skip-fight">${t("fight.skip")}</button>
    </div>
    <div class="fight-hud" style="margin-bottom:0.35rem">
      <span id="ally-hp-total"></span><span id="fight-timer">0.0s</span><span id="enemy-hp-total"></span>
    </div>
    <div class="fight-stage" style="background-image:url('${ART.arenaStage}')">
      <div class="fight-row" id="enemy-row"></div>
      <div class="fight-row" id="ally-row"></div>
    </div>
    <div class="synergy-pills">${synPills}</div>`;
  screen._battle = battle;
  updateFightUI(battle);
}

function unitCard(u, side) {
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  return `<div class="unit-slot ${side === "enemy" ? "enemy" : ""} ${u.alive ? "" : "dead"}" data-side="${side}" data-slot="${u.slot}">
    <img src="${bust(u.mirrorOf || u.id)}" alt="${u.name}" onerror="this.src='${DAY1_BUSTS.n1}'" />
    <div class="hp-track"><div class="hp-fill" style="width:${pct}%"></div></div>
  </div>`;
}

function updateFightUI(battle) {
  const enemyRow = document.getElementById("enemy-row");
  const allyRow = document.getElementById("ally-row");
  if (!enemyRow || !allyRow) return;
  enemyRow.innerHTML = battle.enemies.map((u) => unitCard(u, "enemy")).join("");
  allyRow.innerHTML = battle.allies.map((u) => unitCard(u, "ally")).join("");
  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  document.getElementById("ally-hp-total").textContent = `${state.locale === "tr" ? "Sen" : "You"} ${allyHp}`;
  document.getElementById("enemy-hp-total").textContent = `Bot ${enemyHp}`;
  document.getElementById("fight-timer").textContent = `${battle.elapsed.toFixed(1)}s`;
}

function endFight(battle) {
  if (battle.finished) return;
  battle.finished = true;
  if (state.fightTimer) {
    clearInterval(state.fightTimer);
    state.fightTimer = null;
  }
  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const won = allyHp >= enemyHp;
  const mvpUnit = [...battle.allies].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  const syn = battle.allySyn[0] || null;
  state.lastResult = {
    won,
    allyHp,
    enemyHp,
    mvp: mvpUnit?.name || "—",
    synergy: syn ? loc(syn.name) : "Solo",
    winner: won ? (state.locale === "tr" ? "Senin Porch" : "Your Porch") : loc(state.content.botCupRoster.label),
    team: state.cupPicks.slice(),
    season: isCupNight(),
  };
  state.save.totalCups += 1;
  if (won) state.save.totalWins += 1;
  applyCupEarn(state.save, state.economy, { won, hadSynergy: !!syn, shared: false });
  addPassXp(state.save, isCupNight() ? 1.2 : 0.6);
  state.save.cupHistory.unshift({
    day: state.save.dayIndex,
    week: weekNumber(),
    won,
    mvp: state.lastResult.mvp,
    synergy: state.lastResult.synergy,
    season: isCupNight(),
  });
  state.save.cupHistory = state.save.cupHistory.slice(0, 20);
  if (isCupNight()) state.save.evening.cupDone = true;
  else state.save.evening.errand = true;
  unlockNeighborsIfReady();
  saveNow();
  renderComic();
  showScreen("screen-comic");
}

function skipFight() {
  const battle = document.getElementById("screen-fight")?._battle;
  if (!battle || battle.finished) return;
  for (let i = 0; i < 24 && !battle.finished; i++) {
    battle.elapsed += 2;
    combatTick(battle);
  }
  endFight(battle);
}

function renderComic() {
  const r = state.lastResult;
  const comic = state.content.matchComic;
  const vars = { winner: r.winner, synergy: r.synergy, mvp: r.mvp };
  const panels = comic.panels
    .map((p, i) => {
      const imgId = r.team[i % r.team.length];
      return `<article class="comic-panel" style="animation-delay:${i * 0.08}s">
        <img src="${bust(imgId)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" />
        <p>${fillTemplate(loc(p.textTemplate), vars)}</p>
      </article>`;
    })
    .join("");
  const shareText = fillTemplate(loc(state.content.uiStrings["comic.share_text"]), vars);
  document.getElementById("screen-comic").innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("comic.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.continue")}</button>
    </div>
    <p class="result-banner ${r.won ? "win" : "lose"}">${r.won ? t("common.win") : t("common.lose")}</p>
    <p class="street-hint muted">${t("fight.hp_total")}: ${r.allyHp} vs ${r.enemyHp}</p>
    <div class="comic-panels">${panels}</div>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="share-copy" data-text="${encodeURIComponent(shareText)}">${t("comic.copy_text")}</button>
      <button class="btn btn-teal" type="button" data-action="share-export">${t("comic.export_image")}</button>
      <button class="btn btn-secondary" type="button" data-action="share-native" data-text="${encodeURIComponent(shareText)}">${t("comic.share")}</button>
    </div>`;
}

async function copyShare(text) {
  try {
    await navigator.clipboard.writeText(text);
    applyCupEarn(state.save, state.economy, { won: !!state.lastResult?.won, hadSynergy: false, shared: true });
    saveNow();
    toast(state.locale === "tr" ? "Kopyalandı" : "Copied");
  } catch {
    toast(text);
  }
}
async function nativeShare(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: t("app.title"), text });
      return;
    } catch {
      /* */
    }
  }
  copyShare(text);
}

function exportShareImage() {
  const r = state.lastResult;
  if (!r) return;
  const canvas = el.canvas;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1A1612";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const arena = new Image();
  arena.onload = () => {
    ctx.drawImage(arena, 0, 0, canvas.width, Math.floor(canvas.height * 0.42));
    ctx.fillStyle = "#F2E6D8";
    ctx.font = "bold 64px Fraunces, serif";
    ctx.fillText(t("app.title"), 64, 120);
    let loaded = 0;
    r.team.forEach((id, i) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 80 + i * 300, 520, 260, 260);
        loaded += 1;
        if (loaded === r.team.length) {
          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "rival-porch-cup.png";
            a.click();
            URL.revokeObjectURL(url);
            toast(state.locale === "tr" ? "Görsel indirildi" : "Image downloaded");
          });
        }
      };
      img.src = bust(id);
    });
  };
  arena.src = ART.arenaStage;
}


function shopStr(key) {
  return econT(state.economy, state.locale, key) || t(key);
}

function renderShop() {
  const screen = document.getElementById("screen-shop");
  const tab = state.shopTab || "skins";
  const cat = state.economy.shopCatalog || {};
  const tabs = [
    ["skins", "shop.tab.skins", "porch_skins"],
    ["poses", "shop.tab.poses", "unit_poses"],
    ["frames", "shop.tab.frames", "comic_frames"],
    ["emotes", "shop.tab.emotes", "emotes"],
    ["gifts", "shop.gifts", null],
    ["pass", "shop.tab.pass", null],
  ];
  // fallback key for gifts
  const tabBtns = tabs
    .map(([id, key]) => {
      const label = id === "gifts" ? (state.locale === "tr" ? "Hediyeler" : "Gifts") : shopStr(key);
      return `<button class="tab-btn ${tab === id ? "active" : ""}" type="button" data-action="shop-tab" data-id="${id}">${label}</button>`;
    })
    .join("");

  let body = "";
  if (tab === "pass") {
    body = renderPassTrackHtml();
  } else if (tab === "gifts") {
    body = (state.depthMeta.giftCatalog || [])
      .map((gft) => {
        const price = { currency: "porch_coins", amount: gft.cost.porch_coins };
        const ok = canPay(state.save, price);
        return `<div class="shop-card">
          <div class="name">${loc(gft.name)}</div>
          <div class="muted">${formatPrice(price, state.economy, state.locale)} · affinity +${gft.affinityDelta}</div>
          <p class="muted">${shopStr("gift.wrap.hint")}</p>
          <button class="btn btn-primary" type="button" data-action="buy-gift-stock" data-id="${gft.id}" ${ok ? "" : "disabled"}>${shopStr("shop.buy")}</button>
        </div>`;
      })
      .join("");
    const decor = state.depthMeta.decorGoals || [];
    const done = decor.filter((d) => state.save.decorSlots[d]).length;
    body += `<div class="shop-card">
      <div class="name">${shopStr("goal.decor.title")}</div>
      <div class="muted">${fillTemplate(shopStr("goal.decor.progress"), { n: done })}</div>
      <div class="btn-row">${decor
        .map((d) => {
          const owned = state.save.decorSlots[d];
          return `<button class="btn ${owned ? "btn-secondary" : "btn-teal"}" type="button" data-action="buy-decor" data-id="${d}" ${owned ? "disabled" : ""}>${owned ? "✓" : ""} ${d} · 150🪙</button>`;
        })
        .join("")}</div>
    </div>`;
  } else {
    const kind = tabs.find((x) => x[0] === tab)?.[2];
    const items = cat[kind] || [];
    body = items
      .map((item) => {
        if (item.power) return ""; // never sell power
        const owned = owns(state.save, kind, item.id);
        const price = bestAffordablePrice(state.save, item.prices || []) || (item.prices || [])[0];
        const equipped =
          (kind === "porch_skins" && state.save.equipped.porch_skin === item.id) ||
          (kind === "comic_frames" && state.save.equipped.comic_frame === item.id) ||
          (kind === "emotes" && state.save.equipped.emote === item.id);
        const priceOpts = (item.prices || [])
          .map(
            (p) =>
              `<button class="btn btn-primary" type="button" data-action="buy-cosmetic" data-kind="${kind}" data-id="${item.id}" data-cur="${p.currency}" data-amt="${p.amount}" ${canPay(state.save, p) ? "" : "disabled"}>${shopStr("shop.buy")} · ${formatPrice(p, state.economy, state.locale)}</button>`
          )
          .join("");
        return `<div class="shop-card rarity-${item.rarity || "common"}">
          <div class="name">${loc(item.name)}</div>
          <div class="muted">${shopStr("shop.fairness_badge")} · power:false</div>
          ${owned
            ? `<button class="btn btn-secondary" type="button" data-action="equip-cosmetic" data-kind="${kind}" data-id="${item.id}" ${equipped ? "disabled" : ""}>${equipped ? shopStr("shop.owned") : shopStr("shop.equip")}</button>`
            : priceOpts || `<span class="muted">${shopStr("shop.empty_soon")}</span>`}
        </div>`;
      })
      .join("");
  }

  const iap = (state.economy.iaps?.recommendedFirst3 || [])
    .map(
      (i) =>
        `<div class="shop-card iap-card"><div class="name">${loc(i.name)}</div><div class="muted">~${i.priceBandUsd} USD · stub</div>
        <button class="btn btn-ember" type="button" data-action="iap-stub" data-sku="${i.sku}">${shopStr("shop.buy")} (stub)</button></div>`
    )
    .join("");

  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${shopStr("shop.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <p class="street-hint">${shopStr("shop.subtitle")}</p>
    <p class="chip tea">${shopStr("shop.fairness_badge")}</p>
    <p class="muted">${shopStr("shop.ads_off")} · ${shopStr("iap.story_clear")}</p>
    <div class="tab-row">${tabBtns}</div>
    <div class="shop-grid">${body}</div>
    ${tab === "skins" ? `<h3 class="section-label">IAP stubs</h3><div class="shop-grid">${iap}</div><p class="muted">${shopStr("iap.disclaimer")}</p>` : ""}
  `;
}

function renderPassTrackHtml() {
  const pass = state.economy.seasonPass;
  const level = state.save.passLevel || 1;
  const rows = (pass.rewards || [])
    .map((r) => {
      const unlocked = r.level <= level;
      const freeClaimed = (state.save.claimedPassFree || []).includes(r.level);
      const paidClaimed = (state.save.claimedPassPaid || []).includes(r.level);
      return `<div class="pass-row ${unlocked ? "unlocked" : "locked"}">
        <div class="pass-lvl">${r.level}</div>
        <div class="pass-cell free">
          <div class="muted">${shopStr("pass.free")}</div>
          <div>${rewardLabel(r.free, state.locale)}</div>
          <button class="btn btn-secondary" type="button" data-action="claim-pass" data-track="free" data-level="${r.level}" ${unlocked && !freeClaimed ? "" : "disabled"}>${freeClaimed ? "✓" : shopStr("shop.buy")}</button>
        </div>
        <div class="pass-cell paid">
          <div class="muted">${shopStr("pass.paid")}</div>
          <div>${rewardLabel(r.paid, state.locale)}</div>
          <button class="btn btn-ember" type="button" data-action="claim-pass" data-track="paid" data-level="${r.level}" ${unlocked && state.save.passPaidUnlocked && !paidClaimed ? "" : "disabled"}>${paidClaimed ? "✓" : "🔒"}</button>
        </div>
      </div>`;
    })
    .join("");
  const beat = (pass.storyWeekMap || []).find((b) => state.save.dayIndex >= b.days[0] && state.save.dayIndex <= b.days[1]);
  return `
    <div class="pass-header">
      <h3>${loc(pass.name)}</h3>
      <p class="muted">${shopStr("pass.xp_hint")}</p>
      <p>${shopStr("pass.story_sync")}${beat ? ` · ${beat.beat}` : ""}</p>
      <p class="pick-status">Lv ${level}/30 · XP ${state.save.passXp||0}</p>
      <button class="btn btn-ember" type="button" data-action="unlock-pass-stub" ${state.save.passPaidUnlocked ? "disabled" : ""}>${state.save.passPaidUnlocked ? shopStr("shop.owned") : shopStr("pass.unlock_cta")} (read-only stub)</button>
      <p class="muted">${shopStr("iap.story_clear")}</p>
    </div>
    <div class="pass-track">${rows}</div>`;
}

function buyCosmetic(kind, id, currency, amount) {
  const items = state.economy.shopCatalog?.[kind] || [];
  const item = items.find((x) => x.id === id);
  if (!item || item.power) return;
  if (owns(state.save, kind, id)) return;
  const price = { currency, amount: Number(amount) };
  if (!pay(state.save, price)) return;
  ownCosmetic(state.save, kind, id);
  state.save.evening.errand = true;
  saveNow();
  renderShop();
  toast(loc(item.name));
}

function equipCosmetic(kind, id) {
  if (!owns(state.save, kind, id)) return;
  if (kind === "porch_skins") state.save.equipped.porch_skin = id;
  if (kind === "comic_frames") state.save.equipped.comic_frame = id;
  if (kind === "emotes") state.save.equipped.emote = id;
  if (kind === "unit_poses") {
    const item = (state.economy.shopCatalog.unit_poses || []).find((x) => x.id === id);
    if (item?.neighborId) state.save.equipped.unit_poses[item.neighborId] = id;
  }
  saveNow();
  renderShop();
}

function buyGiftStock(id) {
  const gft = (state.depthMeta.giftCatalog || []).find((x) => x.id === id);
  if (!gft) return;
  const price = { currency: "porch_coins", amount: gft.cost.porch_coins };
  if (!pay(state.save, price)) return;
  state.save.inventory[id] = (state.save.inventory[id] || 0) + 1;
  state.save.evening.errand = true;
  saveNow();
  renderShop();
  toast(loc(gft.name) + " ×" + state.save.inventory[id]);
}

function buyDecor(id) {
  if (state.save.decorSlots[id]) return;
  if (!pay(state.save, { currency: "porch_coins", amount: 150 })) {
    toast("150 🪙");
    return;
  }
  state.save.decorSlots[id] = true;
  state.save.evening.errand = true;
  saveNow();
  renderShop();
}

function renderLadder() {
  const screen = document.getElementById("screen-ladder");
  const hist = state.save.cupHistory
    .map(
      (h) =>
        `<li>${h.won ? "W" : "L"} · day ${h.day} w${h.week} · ${h.mvp} · ${h.synergy}${h.season ? " ★" : ""}</li>`
    )
    .join("") || `<li class="muted">—</li>`;
  const unlocks = (state.ladder.unlockSchedule || [])
    .map((u) => {
      const open = state.save.unlockedNeighbors.includes(u.id);
      const n = neighborById(u.id);
      return `<li class="${open ? "done" : ""}">${open ? "✓" : "○"} ${loc(n?.name) || u.id} · day ${u.unlockDay}${u.requiresWins ? ` · ${u.requiresWins}W` : ""}</li>`;
    })
    .join("");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("meta.ladder")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <p>${loc(state.ladder.season?.name)} · ${fillTemplate(t("cup.week"), { week: weekNumber(), mult: difficultyForWeek().statMult.toFixed(2) })}</p>
    <h3 class="section-label">${t("meta.history")}</h3>
    <ul class="agenda-list">${hist}</ul>
    <h3 class="section-label">Roster → 12</h3>
    <ul class="agenda-list">${unlocks}</ul>`;
}

function onAction(action, target) {
  switch (action) {
    case "toggle-lang":
      state.locale = state.locale === "tr" ? "en" : "tr";
      state.save.locale = state.locale;
      saveNow();
      document.documentElement.lang = state.locale;
      document.title = t("app.title");
      renderTitle();
      showScreen("screen-title");
      break;
    case "new-game":
      state.save = defaultSave(state.economy, state.depthMeta);
      for (const n of state.content.neighbors) ensureNeighborState(n.id);
      saveNow();
      renderEvening();
      showScreen("screen-evening");
      break;
    case "shop-tab":
      state.shopTab = target.dataset.id;
      renderShop();
      break;
    case "buy-cosmetic":
      buyCosmetic(target.dataset.kind, target.dataset.id, target.dataset.cur, target.dataset.amt);
      break;
    case "equip-cosmetic":
      equipCosmetic(target.dataset.kind, target.dataset.id);
      break;
    case "buy-gift-stock":
      buyGiftStock(target.dataset.id);
      break;
    case "buy-decor":
      buyDecor(target.dataset.id);
      break;
    case "claim-pass":
      claimPassReward(state.save, state.economy, Number(target.dataset.level), target.dataset.track);
      saveNow();
      renderShop();
      break;
    case "unlock-pass-stub":
      // Read-only progress UI: stub unlock for preview only — does not gate story
      state.save.passPaidUnlocked = true;
      saveNow();
      toast(shopStr("pass.unlock_cta") + " (stub)");
      renderShop();
      break;
    case "iap-stub":
      toast((state.locale === "tr" ? "IAP stub: " : "IAP stub: ") + target.dataset.sku);
      if (target.dataset.sku === "iap_porch_week_pass") {
        state.save.passPaidUnlocked = true;
        saveNow();
        renderShop();
      } else if (target.dataset.sku === "iap_clay_tokens_mini") {
        grant(state.save, { clay_tokens: 80 });
        saveNow();
        renderShop();
      } else if (target.dataset.sku === "iap_skin_warm_deluxe") {
        ownCosmetic(state.save, "porch_skins", "skin_warm_lamp_deluxe");
        saveNow();
        renderShop();
      }
      break;
    case "continue-save":
      renderEvening();
      showScreen("screen-evening");
      break;
    case "goto-evening":
      renderEvening();
      showScreen("screen-evening");
      break;
    case "goto-street":
      renderStreet();
      showScreen("screen-street");
      break;
    case "goto-cup":
      state.cupPicks = [];
      renderCupLobby();
      showScreen("screen-cup");
      break;
    case "goto-draft":
      state.placement = Array(6).fill(null);
      state.selectedBench = null;
      renderDraft();
      showScreen("screen-draft");
      break;
    case "open-shop":
      renderShop();
      showScreen("screen-shop");
      break;
    case "open-ladder":
      renderLadder();
      showScreen("screen-ladder");
      break;
    case "open-neighbor":
      renderNeighbor(target.dataset.id);
      showScreen("screen-neighbor");
      break;
    case "start-story":
      startStory(target.dataset.id);
      break;
    case "story-choice":
      storyChoice(target.dataset.cid);
      break;
    case "gift":
      doGift(target.dataset.id);
      break;
    case "talk":
      doTalk(target.dataset.id);
      break;
    case "drama":
      doDrama(target.dataset.id);
      break;
    case "drama-choice":
      resolveDrama(target.dataset.nid, target.dataset.cid);
      break;
    case "checkin":
      porchCheckin();
      break;
    case "street-event":
      openStreetEvent();
      break;
    case "event-choice":
      resolveEvent(target.dataset.cid);
      break;
    case "end-evening":
      endEvening();
      break;
    case "toggle-pick":
      togglePick(target.dataset.id);
      break;
    case "select-bench":
      selectBench(target.dataset.id);
      break;
    case "place-cell":
      placeCell(Number(target.dataset.idx));
      break;
    case "auto-place":
      autoPlace();
      break;
    case "start-fight":
      startFight();
      break;
    case "skip-fight":
      skipFight();
      break;
    case "share-copy":
      copyShare(decodeURIComponent(target.dataset.text || ""));
      break;
    case "share-native":
      nativeShare(decodeURIComponent(target.dataset.text || ""));
      break;
    case "share-export":
      exportShareImage();
      break;
        default:
      break;
  }
}

el.app.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  onAction(target.dataset.action, target);
});

async function tryPullStorePacks() {
  // Optional live pulls are store-side; in-repo copies are authoritative for the build.
  // When store files appear, operators can copy into data/. We attempt same-origin stubs only.
}

async function boot() {
  try {
    const [content, economy, stories, ladder, depthMeta] = await Promise.all([
      fetch("data/content.json").then((r) => r.json()),
      fetch("data/economy.json").then((r) => r.json()),
      fetch("data/stories.json").then((r) => r.json()),
      fetch("data/ladder.json").then((r) => r.json()),
      fetch("data/depth-meta.json").then((r) => r.json()),
    ]);
    state.content = content;
    state.economy = economy;
    state.stories = stories;
    state.ladder = ladder;
    state.depthMeta = depthMeta;
    // Merge economy uiStrings over content placeholders for shop/pass
    state.content.uiStrings = { ...state.content.uiStrings, ...economy.uiStrings };
    state.save = loadSave(economy, depthMeta);
    state.locale = state.save.locale || content.localeDefault || "tr";
    for (const n of content.neighbors) ensureNeighborState(n.id);
    buildShell();
    document.documentElement.lang = state.locale;
    document.title = t("app.title");
    renderTitle();
    showScreen("screen-title");
  } catch (err) {
    el.app.innerHTML = `<div class="loading">Boot failed<br/><code>${String(err)}</code></div>`;
  }
}

boot();
