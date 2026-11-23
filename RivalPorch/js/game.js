import { loadSave, persistSave, clearSave, defaultSave } from "./save.js";
import {
  econT, grant, canPay, pay, bestAffordablePrice, ownCosmetic, owns,
  formatPrice, rewardLabel, applyDailyEarn, applyCupEarn, formatCurrencyDelta,
  addPassXp, claimPassReward,
} from "./wallet.js";
import * as Story from "./story.js";
import * as Quests from "./quests.js";

const DAY1_BUSTS = {
  n1: "assets/rival-porch/bust-n1-aunt-merve.png",
  n2: "assets/rival-porch/bust-n2-coach-cem.png",
  n3: "assets/rival-porch/bust-n3-kid-leyla.png",
  n4: "assets/rival-porch/bust-n4-mr-orhan.png",
  n5: "assets/rival-porch/bust-n5-dj-peri.png",
  n6: "assets/rival-porch/bust-n6-baker-can.png",
};

const MESHY_BUSTS = {
  n1: "assets/rival-porch/meshy/fig-bust-n1-aunt-merve.png",
  n2: "assets/rival-porch/meshy/fig-bust-n2-coach-cem.png",
  n3: "assets/rival-porch/meshy/fig-bust-n3-kid-leyla.png",
  n4: "assets/rival-porch/meshy/fig-bust-n4-mr-orhan.png",
  n5: "assets/rival-porch/meshy/fig-bust-n5-dj-peri.png",
  n6: "assets/rival-porch/meshy/fig-bust-n6-baker-can.png",
};

const ART = {
  // Meshy clay environments as primary stage — gold busts stay for face readability on cards
  streetHero: "assets/rival-porch/meshy/env-street-block.png",
  streetHeroFallback: "assets/rival-porch/street-hero.png",
  arenaStage: "assets/rival-porch/meshy/env-arena-stage.png",
  arenaStageFallback: "assets/rival-porch/arena-stage.png",
  busts: { ...DAY1_BUSTS },
  meshyBusts: { ...MESHY_BUSTS },
  meshyRoot: "assets/rival-porch/meshy/",
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
  dialogue: null, // { tree, nodeId, ctx }
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
  questPack: null,
  questTab: "active",
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
  if (state.save.affinity[id] == null) state.save.affinity[id] = 12;
  if (!state.save.traits[id]) {
    const n = neighborById(id);
    state.save.traits[id] = n ? { [n.trait]: 2 } : {};
  }
}

function bumpAffinity(id, delta) {
  ensureNeighborState(id);
  Story.bumpAffinity(state.save, state.stories, id, delta);
  Story.applyStoryUnlocks(state.stories, state.save);
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

function currencyName(id) {
  return shopStr(`shop.currency.${id === "porch_coins" ? "coins" : id === "neon_thread" ? "thread" : "tokens"}`);
}

function hudHtml() {
  const s = state.save;
  const dayLine = fillTemplate(t("day.label"), { day: s.dayIndex, week: weekNumber() });
  return `
    <div class="meta-hud">
      <div class="meta-day">${dayLine}</div>
      <div class="meta-currencies">
        <span title="${currencyName("porch_coins")}">🪙 ${s.currencies.porch_coins||0} <em>${currencyName("porch_coins")}</em></span>
        <span title="${currencyName("neon_thread")}">🧵 ${s.currencies.neon_thread||0} <em>${currencyName("neon_thread")}</em></span>
        <span title="${currencyName("clay_tokens")}">🧱 ${s.currencies.clay_tokens||0} <em>${currencyName("clay_tokens")}</em></span>
      </div>
    </div>`;
}

function buildShell() {
  el.app.innerHTML = `
    <section class="screen screen-title active" id="screen-title"></section>
    <section class="screen" id="screen-cold"></section>
    <section class="screen" id="screen-overnight"></section>
    <section class="screen" id="screen-evening"></section>
    <section class="screen screen-street" id="screen-street"></section>
    <section class="screen screen-neighbor" id="screen-neighbor"></section>
    <section class="screen" id="screen-story"></section>
    <section class="screen" id="screen-quests"></section>
    <section class="screen" id="screen-event"></section>
    <section class="screen" id="screen-cup"></section>
    <section class="screen" id="screen-draft"></section>
    <section class="screen" id="screen-fight"></section>
    <section class="screen" id="screen-comic"></section>
    <section class="screen" id="screen-shop"></section>
    <section class="screen" id="screen-ladder"></section>
  `;
}

function stageBg(primary, fallback) {
  return `url("${primary}"), url("${fallback}")`;
}

function noteQuestHits(hits) {
  if (!hits?.length) return;
  const first = hits[0];
  const def = Quests.questDef(state.questPack, first.questId);
  const title = loc(def?.title) || first.questId;
  if (first.questComplete) {
    toast((state.locale === "tr" ? "Görev hazır · " : "Quest ready · ") + title);
  } else {
    toast(`${title}: ${first.progress}/${first.need}`);
  }
}

function grantQuestRewards(rewards = {}) {
  const delta = {};
  if (rewards.porch_coins) delta.porch_coins = rewards.porch_coins;
  if (rewards.neon_thread) delta.neon_thread = rewards.neon_thread;
  if (rewards.clay_tokens) delta.clay_tokens = rewards.clay_tokens;
  if (Object.keys(delta).length) grant(state.save, delta);
  if (rewards.passXp) addPassXp(state.save, rewards.passXp);
  if (rewards.rep) Story.bumpRep(state.save, rewards.rep);
}

function emitQuestEvent(event) {
  if (!state.questPack) return;
  const hits = Quests.applyQuestEvent(state.save, state.questPack, event);
  noteQuestHits(hits);
  saveNow();
}

function worldStreetLines() {
  const list = Quests.activeWorldConsequences(state.save, state.questPack);
  return list
    .map((w) => loc(w.streetVisual))
    .filter(Boolean)
    .slice(-3);
}

function worldCupLines() {
  const list = Quests.activeWorldConsequences(state.save, state.questPack);
  return list
    .map((w) => loc(w.cupLobby))
    .filter(Boolean)
    .slice(-3);
}

function renderQuestLog() {
  const screen = document.getElementById("screen-quests");
  const tr = state.locale === "tr";
  const tab = state.questTab || "active";
  Quests.ensureQuestSave(state.save);
  Quests.autoOfferArcQuests(state.questPack, state.save);
  const tabs = [
    ["active", tr ? "Aktif" : "Active"],
    ["available", tr ? "Al" : "Available"],
    ["done", tr ? "Bitti" : "Done"],
  ];
  const tabBtns = tabs
    .map(
      ([id, label]) =>
        `<button class="tab-btn ${tab === id ? "active" : ""}" type="button" data-action="quest-tab" data-id="${id}">${label}</button>`
    )
    .join("");

  let body = "";
  if (tab === "available") {
    const list = Quests.availableQuests(state.questPack, state.save);
    body = list.length
      ? list
          .map((q) => {
            const objs = (q.objectives || [])
              .map((o) => `<li>○ ${loc(o.label)}</li>`)
              .join("");
            const rewardBits = [];
            if (q.rewards?.porch_coins) rewardBits.push(`+${q.rewards.porch_coins} 🪙`);
            if (q.rewards?.neon_thread) rewardBits.push(`+${q.rewards.neon_thread} 🧵`);
            return `<article class="quest-card art-card">
              <h3>${loc(q.title)}</h3>
              <p class="muted">${loc(q.blurb)}</p>
              <ul class="quest-obj">${objs}</ul>
              <p class="quest-reward">${rewardBits.join(" · ") || "—"}</p>
              <button class="btn btn-primary" type="button" data-action="quest-accept" data-id="${q.id}">${tr ? "Kabul et" : "Accept"}</button>
            </article>`;
          })
          .join("")
      : `<p class="muted">${tr ? "Şu an alınacak görev yok." : "No quests to accept right now."}</p>`;
  } else if (tab === "done") {
    const list = Quests.completedQuests(state.questPack, state.save);
    body = list.length
      ? list
          .map((q) => {
            const e = state.save.quests.entries[q.id];
            return `<article class="quest-card done art-card">
              <h3>✓ ${loc(q.title)}</h3>
              <p class="muted">${tr ? `Gün ${e?.completedDay || "—"}` : `Day ${e?.completedDay || "—"}`}</p>
            </article>`;
          })
          .join("")
      : `<p class="muted">${tr ? "Henüz biten görev yok." : "No completed quests yet."}</p>`;
  } else {
    const list = Quests.activeQuests(state.questPack, state.save);
    body = list.length
      ? list
          .map((q) => {
            const e = state.save.quests.entries[q.id];
            const objs = (q.objectives || [])
              .map((o) => {
                const have = e?.progress?.[o.id] || 0;
                const need = o.count || 1;
                const ok = have >= need;
                return `<li class="${ok ? "done" : ""}">${ok ? "✓" : "○"} ${loc(o.label)} <span class="agenda-hint">${have}/${need}</span></li>`;
              })
              .join("");
            const ready = Quests.questReadyToComplete(q, e);
            return `<article class="quest-card art-card ${ready ? "ready" : ""}">
              <h3>${loc(q.title)}</h3>
              <p class="muted">${loc(q.blurb)}</p>
              <ul class="quest-obj agenda-list">${objs}</ul>
              ${
                ready
                  ? `<button class="btn btn-ember" type="button" data-action="quest-complete" data-id="${q.id}">${tr ? "Ödülü topla" : "Claim reward"}</button>`
                  : `<p class="muted">${tr ? "Hedefleri tamamla" : "Finish the objectives"}</p>`
              }
            </article>`;
          })
          .join("")
      : `<p class="muted">${tr ? "Aktif görev yok — Available'dan kabul et." : "No active quests — accept one from Available."}</p>
         <button class="btn btn-primary" type="button" data-action="quest-tab" data-id="available">${tr ? "Görevlere bak" : "Browse quests"}</button>`;
  }

  screen.innerHTML = `
    ${hudHtml()}
    <div class="art-hero quest-hero" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}">
      <div class="art-hero-scrim">
        <div class="topbar"><h2>${tr ? "Görev Defteri" : "Quest Log"}</h2>
          <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
        </div>
        <p class="evening-cup-tease">${tr ? "Kabul et · ilerle · tamamla. Arklar buradan yaşar." : "Accept · progress · complete. Arcs live here."}</p>
        <div class="tab-row">${tabBtns}</div>
      </div>
    </div>
    <div class="quest-list">${body}</div>`;
  showScreen("screen-quests");
}

function renderTitle() {
  const screen = document.getElementById("screen-title");
  screen.style.backgroundImage = stageBg(ART.streetHero, ART.streetHeroFallback);
  const hasSave = state.save.dayIndex > 1 || state.save.evening.checkin || state.save.cupHistory.length;
  const stake = state.locale === "tr"
    ? "Karşı Sırt bu Cumartesi Cup'a geliyor. Bu akşam üç kapı, bir seçim, bir sahne."
    : "Rival Ridge brings Cup on Saturday. Tonight: three doors, one choice, one stage.";
  screen.innerHTML = `
    <div class="title-panel">
      <button class="btn btn-secondary lang-toggle" type="button" data-action="toggle-lang" aria-label="Language">EN | TR · ${state.locale.toUpperCase()}</button>
      <h1 class="brand">${t("app.title")}</h1>
      <p class="title-tag">${stake}</p>
      <p class="muted title-sub">${state.locale === "tr"
        ? "Kil diorama mahalle · demlenen ilişkiler · sezonluk Porch Cup"
        : "Clay-diorama street · brewing bonds · seasonal Porch Cup"}</p>
      ${hasSave ? `<button class="btn btn-primary" type="button" data-action="continue-save">${t("common.continue_save")} — ${fillTemplate(t("day.label"), { day: state.save.dayIndex, week: weekNumber() })}</button>` : ""}
      <button class="btn ${hasSave ? "btn-secondary" : "btn-primary"}" type="button" data-action="new-game">${hasSave ? t("common.new_game") : t("boot.tap_to_start")}</button>
      <button class="btn btn-secondary" type="button" data-action="open-shop">${t("shop.title")}</button>
    </div>`;
}


function daysUntilCupNight() {
  const days = state.depthMeta?.eveningAgenda?.weekendExtra?.daysOfWeek || [6, 7];
  const dow = dayOfWeek();
  let best = 7;
  for (const d of days) {
    const delta = (d - dow + 7) % 7;
    if (delta < best) best = delta;
  }
  return best;
}

function dayHeadline() {
  const d = state.save.dayIndex;
  const map = {
    1: { tr: "İlk Gece — Kapı Çalıyor", en: "Night One — Someone's Knocking" },
    2: { tr: "İkinci Gece — Yankı", en: "Night Two — The Echo" },
    3: { tr: "Üçüncü Gece — Ölçüm", en: "Night Three — Being Measured" },
    4: { tr: "Dördüncü Gece — İpler Geriliyor", en: "Night Four — Strings Tighten" },
    5: { tr: "Cup Öncesi — Isınma", en: "Cup Eve Warmup" },
    6: { tr: "Sezon Cup Gecesi", en: "Season Cup Night" },
    7: { tr: "Cup Sonrası — Mahalle Konuşur", en: "After Cup — The Block Talks" },
  };
  if (map[d]) return map[d];
  const week = Story.weekDef(state.stories, d);
  return week?.title || { tr: `Gün ${d}`, en: `Day ${d}` };
}

function renderColdOpen() {
  const screen = document.getElementById("screen-cold");
  screen.style.backgroundImage = stageBg(ART.streetHero, ART.streetHeroFallback);
  const tr = state.locale === "tr";
  screen.innerHTML = `
    <div class="cold-open">
      <p class="cold-knock" id="cold-knock">${tr ? "…tak. tak. tak." : "…knock. knock. knock."}</p>
      <h1 class="brand cold-brand cold-reveal" id="cold-brand" hidden>${t("app.title")}</h1>
      <div class="dialog-box cold-box cold-reveal" id="cold-box" hidden>
        <p class="prompt">${tr
          ? "Kapıda Leyla — uçurtma ipi Orhan'ın antenine dolanmış. Karşı Sırt fenerleri yanıyor. Bu ilk seçimin mahalleyi şekillendirir."
          : "Leyla at your door — kite string tangled in Orhan's antenna. Rival Ridge lanterns are already lit. This first choice shapes the block."}</p>
        <div class="choice-stack">
          <button class="btn btn-primary" type="button" data-action="cold-choice" data-cid="mediate">${tr ? "Arabulucu ol — birlikte çözün" : "Mediate — untangle together"}</button>
          <button class="btn btn-ember" type="button" data-action="cold-choice" data-cid="instigate">${tr ? "Uçurtmayı savun — antene meydan oku" : "Defend the kite — dare the antenna"}</button>
          <button class="btn btn-teal" type="button" data-action="cold-choice" data-cid="stage">${tr ? "Cup'a çevir — bu bir sahne" : "Make it Cup drama — stage it"}</button>
        </div>
      </div>
      <p class="muted cold-hint cold-reveal" id="cold-hint" hidden>${tr ? "Sonra akşam gündemi açılır." : "Then the evening agenda opens."}</p>
    </div>`;
  showScreen("screen-cold");
  // Staggered cold open: knock → brand → stake choices
  setTimeout(() => {
    const b = document.getElementById("cold-brand");
    if (b) b.hidden = false;
  }, 550);
  setTimeout(() => {
    const box = document.getElementById("cold-box");
    const hint = document.getElementById("cold-hint");
    if (box) box.hidden = false;
    if (hint) hint.hidden = false;
  }, 1100);
}

function resolveColdOpen(cid) {
  ensureNeighborState("n3");
  ensureNeighborState("n4");
  const packs = {
    mediate: {
      aff: [["n3", 4], ["n4", 3]],
      rep: { rep_mediator: 3 },
      flags: ["cold_open_mediate", "kite_path_coop"],
      note: { tr: "İlk kapı: arabuluculuk.", en: "First knock: mediation." },
    },
    instigate: {
      aff: [["n3", 5], ["n4", -2]],
      rep: { rep_instigator: 3 },
      flags: ["cold_open_instigate", "kite_path_defend"],
      note: { tr: "İlk kapı: uçurtma isyanı.", en: "First knock: kite rebellion." },
    },
    stage: {
      aff: [["n3", 2], ["n4", 1], ["n2", 2]],
      rep: { rep_stage: 3 },
      flags: ["cold_open_stage", "kite_path_coop"],
      note: { tr: "İlk kapı: sahne kuruldu.", en: "First knock: the stage is set." },
    },
  };
  const p = packs[cid] || packs.mediate;
  for (const [id, d] of p.aff) bumpAffinity(id, d);
  Story.bumpRep(state.save, p.rep);
  for (const f of p.flags) Story.setFlag(state.save, f);
  // Seeds Antenna Op main quest drama objective
  Story.setFlag(state.save, "arc_kite_antenna_seed");
  Story.setFlag(state.save, "arc_kite_antenna_seed_resolved");
  state.save.coldOpenDone = true;
  if (!state.save.storyRecap) state.save.storyRecap = [];
  state.save.storyRecap.unshift({ day: 1, text: loc(p.note) });
  Quests.ensureQuestSave(state.save);
  // Soft-start: auto-accept Welcome main quest so evening has real objectives day 1
  if (state.questPack && !Quests.isAccepted(state.save, "mq_welcome_porch")) {
    Quests.acceptQuest(state.save, state.questPack, "mq_welcome_porch");
  }
  emitQuestEvent({ type: "flag", flag: "arc_kite_antenna_seed_resolved" });
  saveNow();
  const fb = Story.formatChoiceSummary(
    { affinity: p.aff.map(([id, delta]) => ({ id, delta })), rep: Object.entries(p.rep).map(([id, delta]) => ({ id, delta })) },
    state.locale,
    (nid) => loc(neighborById(nid)?.name)
  );
  toast(fb || loc(p.note));
  renderEvening();
  showScreen("screen-evening");
}

function renderOvernight(payoff) {
  const screen = document.getElementById("screen-overnight");
  const tr = state.locale === "tr";
  const bits = (payoff?.lines || []).map((l) => `<li>${l}</li>`).join("") || `<li>${tr ? "Mahalle uyudu." : "The block slept."}</li>`;
  const tomorrow = loc(dayHeadline());
  screen.innerHTML = `
    ${hudHtml()}
    <div class="overnight-card">
      <p class="muted overnight-kicker">${tr ? "Gece geçti" : "Night passed"}</p>
      <h2>${tomorrow}</h2>
      <p class="prompt">${fillTemplate(t("idle.overnight_done"), { day: state.save.dayIndex })}</p>
      <ul class="agenda-list">${bits}</ul>
      <p class="evening-cup-tease">${payoff?.tease || ""}</p>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-action="goto-evening">${tr ? "Yeni akşama gir" : "Enter the new evening"}</button>
      </div>
    </div>`;
  showScreen("screen-overnight");
}


function renderEvening() {
  const st = eveningStats();
  const screen = document.getElementById("screen-evening");
  const week = Story.weekDef(state.stories, state.save.dayIndex);
  const arcBeat = Story.nextArcBeat(state.stories, state.save);
  const dom = Story.dominantRep(state.save);
  const errandLabel = state.locale === "tr"
    ? "Hediye veya dükkân (zorunlu)"
    : "Gift or shop (required)";
  const items = [
    { ok: st.checkin, label: t("street.porch_checkin"), hint: state.locale === "tr" ? "+jeton, streak" : "+coins, streak" },
    { ok: st.visits >= st.needVisits, label: `${t("evening.visit_need")} ${st.visits}/${st.needVisits}`, hint: state.locale === "tr" ? "3 derin sahne" : "3 deep scenes" },
    { ok: st.streetEvent, label: t("street.event"), hint: state.locale === "tr" ? "günlük seçim" : "daily choice" },
    { ok: st.errand, label: errandLabel, hint: state.locale === "tr" ? "hediye / alışveriş" : "gift / purchase" },
  ];
  if (st.cupRequired) items.push({ ok: st.cupDone, label: t("cup.season_night"), hint: "Cup" });

  const dayHooks = {
    1: {
      tr: "İlk akşam: üç kapı çal, bir sır öğren. Cumartesi Cup seni bekliyor.",
      en: "Night one: knock three doors, learn one secret. Saturday Cup is watching.",
    },
    2: {
      tr: "İkinci gece: dünkü seçimin yankılanır. Uçurtma ipi henüz çözülmedi.",
      en: "Night two: yesterday's choice echoes. The kite string isn't done with you.",
    },
    3: {
      tr: "Mahalle seni ölçüyor. Bir hediye, bir olay, bir sahne — sonra uyku.",
      en: "The block is measuring you. One gift, one event, one scene — then sleep.",
    },
  };
  let hook = dayHooks[state.save.dayIndex] || week?.cup?.tone || {
    tr: "Cumartesi yaklaşıyor. Bağları demle, formasyonu kur.",
    en: "Saturday closes in. Brew bonds, set the formation.",
  };
  // Personalize from last story note / cold-open residue
  const lastNote = (state.save.storyRecap || [])[0];
  if (state.save.dayIndex >= 2 && lastNote?.text) {
    const short = lastNote.text.length > 70 ? `${lastNote.text.slice(0, 68)}…` : lastNote.text;
    hook = {
      tr: `Dünden kalan: ${short}`,
      en: `Carried from yesterday: ${short}`,
    };
  } else if (state.save.dayIndex >= 2) {
    const flags = Object.keys(state.save.storyFlags || {}).filter((f) => state.save.storyFlags[f] && f.startsWith("free_"));
    if (flags.length) {
      hook = {
        tr: `Dünkü porch izi hâlâ sıcak (${flags.length} bayrak). Kapıları tekrar çal.`,
        en: `Yesterday's porch mark is still warm (${flags.length} flags). Knock the doors again.`,
      };
    }
  }
  const cupTease = `<p class="evening-cup-tease">${loc(hook)}</p>`;

  const untilCup = daysUntilCupNight();
  const cupCount =
    untilCup === 0
      ? state.locale === "tr" ? "★ Bugün Cup gecesi" : "★ Cup night is tonight"
      : state.locale === "tr"
        ? `Cup'a ${untilCup} gün`
        : `${untilCup} day${untilCup === 1 ? "" : "s"} to Cup`;

  Quests.ensureQuestSave(state.save);
  Quests.autoOfferArcQuests(state.questPack, state.save);
  Quests.syncQuestProgressFromWorld(state.save, state.questPack);
  const activeQ = Quests.activeQuests(state.questPack, state.save);
  const availN = Quests.availableQuests(state.questPack, state.save).length;
  const mainAgenda = Quests.mainQuestAgenda(state.questPack, state.save, state.locale);
  const questStrip = activeQ.length
    ? activeQ
        .slice(0, 2)
        .map((q) => {
          const e = state.save.quests.entries[q.id];
          const done = (q.objectives || []).filter((o) => Quests.objectiveDone(e, o)).length;
          const total = (q.objectives || []).length;
          const ready = Quests.questReadyToComplete(q, e);
          return `<button class="quest-chip ${ready ? "ready" : ""}" type="button" data-action="open-quests">
            <strong>${loc(q.title)}</strong>
            <span>${done}/${total}${ready ? (state.locale === "tr" ? " · topla" : " · claim") : ""}</span>
          </button>`;
        })
        .join("")
    : `<button class="quest-chip" type="button" data-action="open-quests">${
        state.locale === "tr"
          ? availN
            ? `${availN} görev seni bekliyor`
            : "Görev defteri"
          : availN
            ? `${availN} quests waiting`
            : "Quest log"
      }</button>`;

  const worldBits = worldStreetLines();
  const mainBlock = mainAgenda
    ? `<div class="main-quest-panel">
        <h3 class="section-label">${state.locale === "tr" ? "Ana görev" : "Main quest"} · ${mainAgenda.title}</h3>
        <ul class="agenda-list">
          ${mainAgenda.objectives
            .map(
              (o) =>
                `<li class="${o.done ? "done" : ""}">${o.done ? "✓" : "○"} ${o.label} <span class="agenda-hint">${o.have}/${o.need}</span></li>`
            )
            .join("")}
        </ul>
        ${
          mainAgenda.ready
            ? `<button class="btn btn-ember" type="button" data-action="quest-complete" data-id="${mainAgenda.quest.id}">${state.locale === "tr" ? "Ana görev ödülünü topla" : "Claim main quest reward"}</button>`
            : ""
        }
      </div>`
    : `<p class="street-hint">${state.locale === "tr" ? "Henüz ana görev yok — Görevler → Available." : "No main quest yet — Quests → Available."}</p>`;

  screen.innerHTML = `
    ${hudHtml()}
    <div class="art-hero evening-hero" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}">
      <div class="art-hero-scrim">
        <div class="topbar"><h2>${loc(dayHeadline())}</h2>
          <button class="btn btn-secondary" type="button" data-action="open-ladder">${t("meta.ladder")}</button>
        </div>
        <p class="muted evening-meta">${fillTemplate(t("day.streak"), { n: state.save.checkinStreak })} · ${state.save.moodLabel || "calm"}${dom ? ` · ${Story.repLabel(dom, state.locale)}` : ""} · <strong class="cup-countdown">${cupCount}</strong></p>
        <p class="prompt evening-week">${loc(week?.title)} — ${loc(week?.focus)}</p>
        ${arcBeat
          ? `<p class="arc-banner">🎭 <strong>${loc(arcBeat.arc.title)}</strong> — ${loc(arcBeat.beat.prompt)}
              <span class="chip tea">${(arcBeat.arc.neighbors || []).map((id) => loc(neighborById(id)?.name) || id).slice(0, 3).join(" · ")}</span></p>`
          : `<p class="muted">${state.locale === "tr" ? "Kapıları gez — her komşunun kendi sahnesi var." : "Walk the doors — each neighbor has their own scene."}</p>`}
        ${cupTease}
        ${worldBits.length ? `<p class="world-consequence">${worldBits.map((l) => `◈ ${l}`).join(" · ")}</p>` : ""}
        <div class="quest-strip">${questStrip}</div>
      </div>
    </div>
    ${mainBlock}
    <h3 class="section-label">${state.locale === "tr" ? "Akşam ritüeli" : "Evening ritual"}</h3>
    <ul class="agenda-list agenda-compact">
      ${items.map((i) => `<li class="${i.ok ? "done" : ""}">${i.ok ? "✓" : "○"} ${i.label}${i.hint && !i.ok ? ` <span class="agenda-hint">${i.hint}</span>` : ""}</li>`).join("")}
    </ul>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="goto-street">${t("street.header")}</button>
      <button class="btn btn-teal" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
      <button class="btn btn-ember" type="button" data-action="goto-cup">${isCupNight() ? t("cup.season_night") : t("cup.practice")}</button>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-action="open-shop">${t("shop.title")}</button>
      <button class="btn btn-secondary" type="button" data-action="open-story-log">${state.locale === "tr" ? "Hikâye defteri" : "Story ledger"}</button>
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
      const meshy = ART.meshyBusts[n.id] || bust(n.id);
      return `<button class="hotspot clay-spot ${done ? "visited" : ""}" type="button" data-action="open-neighbor" data-id="${n.id}" aria-label="${loc(n.name)}">
        <img class="bust-mini" src="${meshy}" alt="" onerror="this.src='${bust(n.id)}'" />
        <span class="label">${loc(n.name)}${done ? " ✓" : ""}</span>
      </button>`;
    })
    .join("");

  const activeQ = Quests.activeMainQuest(state.questPack, state.save) || Quests.activeQuests(state.questPack, state.save)[0];
  const questHint = activeQ
    ? `<p class="street-quest-hint"><button type="button" data-action="open-quests">${loc(activeQ.title)}</button> — ${Quests.progressSummary(activeQ, state.save.quests.entries[activeQ.id], state.locale).split(" · ")[0] || ""}</p>`
    : "";
  const worldBits = worldStreetLines();

  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar">
      <h2>${t("street.header")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <div class="street-stage clay-stage" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}">
      <div class="prop-row" aria-hidden="true">
        <span class="prop-chip">🫖</span><span class="prop-chip">🪁</span><span class="prop-chip">📰</span><span class="prop-chip">🎧</span>
      </div>
      <div class="hotspots hotspots-wrap">${spots}</div>
      ${worldBits.length ? `<div class="world-banner">${worldBits.map((l) => `<span>◈ ${l}</span>`).join("")}</div>` : ""}
    </div>
    ${questHint}
    <p class="street-hint">${t("street.hint_tap_neighbor")}</p>
    <div class="mood-bar">
      <button class="btn btn-rose" type="button" data-action="checkin" ${state.save.evening.checkin ? "disabled" : ""}>${t("street.porch_checkin")}</button>
      <button class="btn btn-secondary" type="button" data-action="street-event" ${state.save.evening.streetEvent ? "disabled" : ""}>${t("street.event")}</button>
      <button class="btn btn-teal" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
    </div>`;
}


function affinityLabel(id) {
  const band = Story.affinityBand(state.stories, state.save.affinity[id] || 0);
  return band ? loc(band.label) : "";
}

function renderNeighbor(id) {
  ensureNeighborState(id);
  state.selectedNeighbor = id;
  const n = neighborById(id);
  const affinity = state.save.affinity[id] || 0;
  const visited = state.save.evening.visits.includes(id);
  const offer = Story.dialogueForNeighborVisit(state.stories, state.save, id);
  const screen = document.getElementById("screen-neighbor");
  const offerHint = offer
    ? offer.kind === "arc"
      ? loc(offer.arc.title) + " · " + loc(offer.beat.prompt)
      : offer.kind === "secret"
        ? state.locale === "tr" ? "Sır kapısı aralandı…" : "A secret door creaks…"
        : offer.kind === "cup_eve"
          ? state.locale === "tr" ? "Cup öncesi sohbet" : "Cup-eve chatter"
          : (() => {
              const free = offer.tree || Story.freePorchTree(id);
              const root = free ? Story.getNode(free, free.start) : null;
              const tease = root ? loc(root.text) : "";
              return tease
                ? tease.length > 96
                  ? `${tease.slice(0, 94)}…`
                  : tease
                : state.locale === "tr"
                  ? `${loc(n.name)} verandası — senin sahnen`
                  : `${loc(n.name)}'s porch — your scene`;
            })()
    : "";
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
        <p class="meta-line"><span class="chip ${(n.synergyTag || "").toLowerCase()}">${n.synergyTag}</span></p>
        <p class="meta-line">${t("neighbor.affinity")}: ${affinity}/100 · ${affinityLabel(id)}</p>
        <div class="affinity-bar"><div class="affinity-fill" style="width:${affinity}%"></div></div>
      </div>
    </div>
    <div class="dialog-box" id="neighbor-dialog">
      ${visited && !offer ? t("story.done") : offerHint || (state.locale === "tr" ? "Sahne, hediye veya konuşma." : "Scene, gift, or talk.")}
    </div>
    <div class="btn-row" id="neighbor-actions">
      <button class="btn btn-primary" type="button" data-action="start-story" data-id="${id}" ${visited && offer?.kind === "free" ? "disabled" : ""}>${t("story.scene")}</button>
      <button class="btn btn-teal" type="button" data-action="gift" data-id="${id}">${t("neighbor.gift")}</button>
      <button class="btn btn-secondary" type="button" data-action="talk" data-id="${id}">${t("neighbor.talk")}</button>
      ${n.drama ? `<button class="btn btn-ember" type="button" data-action="drama" data-id="${id}">${t("neighbor.drama")}</button>` : ""}
    </div>
    <p class="muted action-hints">${state.locale === "tr"
      ? "Sahne: ilişki + hikâye · Hediye: gündem errand · Konuş: hızlı bağ · Drama: trait"
      : "Scene: bond + story · Gift: agenda errand · Talk: quick bond · Drama: traits"}</p>`;
}

function startStory(id) {
  const offer = Story.dialogueForNeighborVisit(state.stories, state.save, id);
  const free = Story.freePorchTree(id, state.save);
  if (!offer?.tree && !free) {
    toast(state.locale === "tr" ? "Bugün yeni sahne yok — olay veya hediye dene" : "No scene today — try event or gift");
    return;
  }
  if (offer?.kind === "arc") {
    Story.markBeatStarted(state.save, offer.beat);
    for (const f of offer.beat.setFlags || []) {
      if (!String(f).includes("complete")) Story.setFlag(state.save, f);
    }
  }
  const tree = offer?.tree || free;
  state.dialogue = {
    tree,
    nodeId: tree.start,
    ctx: { kind: offer?.kind || "free", neighborId: id, arc: offer?.arc, beat: offer?.beat },
    feedbackLog: [],
  };
  const node = Story.getNode(state.dialogue.tree, state.dialogue.nodeId);
  Story.applyNodeArrival(state.save, node);
  saveNow();
  renderDialogue();
  showScreen("screen-story");
}

function renderDialogue() {
  const { tree, nodeId, ctx } = state.dialogue || {};
  const node = Story.getNode(tree, nodeId);
  const screen = document.getElementById("screen-story");
  if (!node) {
    finishDialogue();
    return;
  }
  const speaker = node.speaker ? neighborById(node.speaker) : neighborById(ctx.neighborId);
  const sid = speaker?.id || ctx.neighborId || "n1";
  const kindLabel =
    ctx.kind === "arc"
      ? loc(ctx.arc?.title)
      : ctx.kind === "secret"
        ? state.locale === "tr" ? "Sır" : "Secret"
        : ctx.kind === "cup_eve"
          ? state.locale === "tr" ? "Cup öncesi" : "Cup eve"
          : t("story.scene");
  const lastFb = state.dialogue?.lastFeedback || "";
  if (node.ends && !(node.choices && node.choices.length)) {
    screen.innerHTML = `
      ${hudHtml()}
      <div class="topbar"><h2>${kindLabel}</h2>
        <button class="btn btn-secondary" type="button" data-action="open-neighbor" data-id="${ctx.neighborId}">${t("common.back")}</button>
      </div>
      <div class="neighbor-hero compact">
        <div class="bust-frame"><img src="${bust(sid)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" /></div>
        <div><h2>${loc(speaker?.name) || ""}</h2><p class="muted">${ctx.beat ? loc(ctx.beat.prompt) : ""}</p></div>
      </div>
      <div class="dialog-box"><p class="prompt">${loc(node.text)}</p>
        ${lastFb ? `<p class="choice-feedback">${lastFb}</p>` : ""}
        <div class="choice-stack">
          <button class="btn btn-primary" type="button" data-action="dialogue-end">${t("common.continue")}</button>
        </div>
      </div>`;
    return;
  }
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${kindLabel}</h2>
      <button class="btn btn-secondary" type="button" data-action="open-neighbor" data-id="${ctx.neighborId}">${t("common.back")}</button>
    </div>
    <div class="neighbor-hero compact">
      <div class="bust-frame"><img src="${bust(sid)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" /></div>
      <div><h2>${loc(speaker?.name) || ""}</h2><p class="muted">${ctx.beat ? loc(ctx.beat.prompt) : ""}</p></div>
    </div>
    <div class="dialog-box"><p class="prompt">${loc(node.text)}</p>
      ${lastFb ? `<p class="choice-feedback">${lastFb}</p>` : ""}
      <div class="choice-stack">
        ${(node.choices || [])
          .map(
            (c) =>
              `<button class="btn btn-secondary" type="button" data-action="story-choice" data-cid="${c.id}">${loc(c.label)}</button>`
          )
          .join("")}
      </div>
    </div>`;
}

function storyChoice(cid) {
  const { tree, nodeId, ctx } = state.dialogue;
  const node = Story.getNode(tree, nodeId);
  const choice = (node.choices || []).find((c) => c.id === cid);
  if (!choice) return;
  const summary = Story.applyChoicePayload(state.save, state.stories, choice, ctx.neighborId || node.speaker);
  const fb = Story.formatChoiceSummary(summary, state.locale, (nid) => loc(neighborById(nid)?.name));
  state.dialogue.lastFeedback = fb;
  state.dialogue.lastChoiceLabel = loc(choice.label);
  if (fb) {
    state.dialogue.feedbackLog = [...(state.dialogue.feedbackLog || []), fb];
    toast(fb);
  }
  Story.applyStoryUnlocks(state.stories, state.save);
  if (!choice.next) {
    finishDialogue();
    return;
  }
  state.dialogue.nodeId = choice.next;
  const next = Story.getNode(tree, choice.next);
  Story.applyNodeArrival(state.save, next);
  saveNow();
  renderDialogue();
}

function finishDialogue() {
  const { tree, ctx, nodeId, feedbackLog } = state.dialogue || {};
  const node = Story.getNode(tree, nodeId);
  Story.applyNodeArrival(state.save, node);
  if (tree?.id && !state.save.completedTrees.includes(tree.id)) state.save.completedTrees.push(tree.id);
  if (ctx?.kind === "arc" && ctx.beat) {
    Story.setFlag(state.save, ctx.beat.id + "_done");
    for (const f of ctx.beat.setFlags || []) Story.setFlag(state.save, f);
    const st = Story.ensureArcState(state.save, ctx.arc.id, state.save.dayIndex);
    st.lastBeatId = ctx.beat.id;
    if ((ctx.beat.setFlags || []).some((f) => String(f).includes("complete"))) {
      st.complete = true;
      Story.resolveArcRewards(state.stories, state.save, ctx.arc);
    }
    emitQuestEvent({ type: "arc_beat", arcId: ctx.arc.id, beatId: ctx.beat.id });
  }
  if (ctx?.kind === "cup_eve") state.save.evening.cupEveDone = true;
  if (ctx?.neighborId && !state.save.evening.visits.includes(ctx.neighborId)) {
    state.save.evening.visits.push(ctx.neighborId);
  }
  if (ctx?.neighborId) {
    emitQuestEvent({ type: "visit_scene", neighborId: ctx.neighborId });
  }
  // Remember plain-language beats for story ledger
  if (!state.save.storyRecap) state.save.storyRecap = [];
  const who = loc(neighborById(ctx?.neighborId)?.name) || "";
  const choiceNote = state.dialogue?.lastChoiceLabel;
  const line = choiceNote
    ? `${who}: “${choiceNote}”${feedbackLog?.length ? ` → ${feedbackLog[feedbackLog.length - 1]}` : ""}`
    : feedbackLog?.length
      ? `${who}: ${feedbackLog[feedbackLog.length - 1]}`
      : who
        ? state.locale === "tr" ? `${who} ile konuştun.` : `You spoke with ${who}.`
        : "";
  if (line) {
    state.save.storyRecap.unshift({ day: state.save.dayIndex, text: line });
    state.save.storyRecap = state.save.storyRecap.slice(0, 24);
  }
  Story.applyStoryUnlocks(state.stories, state.save);
  addPassXp(state.save, 0.4);
  saveNow();
  toast(feedbackLog?.length ? feedbackLog[feedbackLog.length - 1] : t("story.done"));
  if (ctx?.neighborId) {
    renderNeighbor(ctx.neighborId);
    showScreen("screen-neighbor");
  } else {
    renderEvening();
    showScreen("screen-evening");
  }
  state.dialogue = null;
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
  const gain = (line.affinityDelta || affordable.affinityDelta || 1) * 3;
  bumpAffinity(id, gain);
  state.save.evening.errand = true;
  addPassXp(state.save, 0.2);
  saveNow();
  renderNeighbor(id);
  const tr = state.locale === "tr";
  document.getElementById("neighbor-dialog").innerHTML = `
    <div class="gift-confirm">
      <p class="gift-confirm-title">${tr ? "Hediye alındı" : "Gift received"}</p>
      <p>${loc(line.text)}</p>
      <p class="choice-feedback">−${affordable.cost.porch_coins} 🪙 · ${loc(affordable.name)} · ${t("neighbor.affinity")} +${gain}</p>
      <p class="muted">${tr ? "Errand ✓ — akşam gündemine dönebilirsin." : "Errand ✓ — you can return to the evening agenda."}</p>
    </div>`;
  emitQuestEvent({ type: "gift", neighborId: id });
  toast(tr ? `Hediye onay · ${loc(n.name)} +${gain}` : `Gift confirmed · ${loc(n.name)} +${gain}`);
}

function doTalk(id) {
  const n = neighborById(id);
  const lines = n.talkLines || [];
  const line = lines[Math.floor(Math.random() * Math.max(1, lines.length))] || { text: { tr: "…", en: "…" } };
  bumpAffinity(id, 3);
  applyDailyEarn(state.save, state.economy, "talk");
  emitQuestEvent({ type: "talk", neighborId: id });
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
  bumpAffinity(nid, (choice.affinityDelta || 0) * 3);
  ensureNeighborState(nid);
  for (const [trait, delta] of Object.entries(choice.traitDeltas || {})) {
    state.save.traits[nid][trait] = (state.save.traits[nid][trait] || 0) + delta;
  }
  state.save.dramaFlags[n.drama.id] = cid;
  applyDailyEarn(state.save, state.economy, "drama");
  addPassXp(state.save, 0.35);
  saveNow();
  renderNeighbor(nid);
  const traitBits = Object.entries(choice.traitDeltas || {})
    .map(([k, v]) => `${k} ${v > 0 ? "+" : ""}${v}`)
    .join(" · ");
  document.getElementById("neighbor-dialog").innerHTML = `<p>${loc(choice.label)}</p>
    <p class="choice-feedback">${state.locale === "tr" ? "İlişki" : "Bond"} ${(choice.affinityDelta || 0) * 3 > 0 ? "+" : ""}${(choice.affinityDelta || 0) * 3}${traitBits ? ` · ${traitBits}` : ""}</p>`;
}

function porchCheckin() {
  if (state.save.evening.checkin) return;
  state.save.evening.checkin = true;
  if (state.save.lastCheckinDay === state.save.dayIndex - 1) state.save.checkinStreak += 1;
  else state.save.checkinStreak = 1;
  state.save.lastCheckinDay = state.save.dayIndex;
  for (const n of unlockedNeighbors()) bumpAffinity(n.id, 3);
  applyDailyEarn(state.save, state.economy, "checkin");
  Story.syncWeekArcs(state.stories, state.save);
  addPassXp(state.save, 0.35);
  const every = state.depthMeta.streak?.checkinBonusEvery || 3;
  if (state.save.checkinStreak > 0 && state.save.checkinStreak % every === 0) {
    grant(state.save, { porch_coins: state.depthMeta.streak.bonusPorchCoins || 15 });
    toast(`Streak ${state.save.checkinStreak}! +${state.depthMeta.streak.bonusPorchCoins} 🪙`);
  } else toast(t("street.mood_tea"));
  emitQuestEvent({ type: "checkin" });
  saveNow();
  renderStreet();
}

function openStreetEvent() {
  if (state.save.evening.streetEvent) return;
  const ev = Story.pickDailyEvent(state.stories, state.save);
  state.streetEvent = ev;
  const screen = document.getElementById("screen-event");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(ev.title) || t("street.event")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-street">${t("common.back")}</button>
    </div>
    <div class="dialog-box">
      <p class="prompt">${loc(ev.prompt)}</p>
      <div class="choice-stack">
        ${(ev.choices || [])
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
  const choice = (ev.choices || []).find((c) => c.id === cid);
  const summary = Story.applyChoicePayload(state.save, state.stories, choice, null);
  if (choice?.traitDeltas) {
    const nid = (ev.tags || []).includes("neon") ? "n5" : "n1";
    ensureNeighborState(nid);
    for (const [k, v] of Object.entries(choice.traitDeltas)) {
      state.save.traits[nid][k] = (state.save.traits[nid][k] || 0) + v;
    }
  }
  state.save.evening.streetEvent = true;
  if (!state.save.seenDailyEvents.includes(ev.id)) state.save.seenDailyEvents.push(ev.id);
  Story.applyStoryUnlocks(state.stories, state.save);
  addPassXp(state.save, 0.25);
  if (!state.save.storyRecap) state.save.storyRecap = [];
  state.save.storyRecap.unshift({
    day: state.save.dayIndex,
    text: `${loc(ev.title)} → ${loc(choice.label)}`,
  });
  state.save.storyRecap = state.save.storyRecap.slice(0, 24);
  emitQuestEvent({ type: "street_event", eventId: ev.id });
  saveNow();
  const fb = Story.formatChoiceSummary(summary, state.locale, (nid) => loc(neighborById(nid)?.name));
  const screen = document.getElementById("screen-event");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(ev.title) || t("street.event")}</h2></div>
    <div class="dialog-box">
      <p class="prompt">${loc(choice.label)}</p>
      ${fb ? `<p class="choice-feedback">${fb}</p>` : ""}
      <p class="muted">${state.locale === "tr" ? "Sokak bunu hatırlayacak." : "The street will remember that."}</p>
      <div class="choice-stack">
        <button class="btn btn-primary" type="button" data-action="goto-evening">${t("common.continue")}</button>
      </div>
    </div>`;
  toast(fb || loc(choice.label));
  showScreen("screen-event");
}

function endEvening() {
  const st = eveningStats();
  if (!st.complete) {
    toast(t("evening.locked"));
    return;
  }
  const overnight = state.stories.relationshipThresholds?.overnightIdle || { minDelta: 1, maxDelta: 3 };
  const lines = [];
  const tr = state.locale === "tr";
  let affTotal = 0;
  for (const n of unlockedNeighbors()) {
    const gain = overnight.minDelta + Math.floor(Math.random() * (overnight.maxDelta - overnight.minDelta + 1));
    bumpAffinity(n.id, gain);
    affTotal += gain;
  }
  lines.push(tr ? `İlişkiler +${affTotal} (dağınık)` : `Bonds +${affTotal} across the block`);
  const beforeCoins = state.save.currencies.porch_coins || 0;
  applyDailyEarn(state.save, state.economy, "overnight");
  const coinGain = (state.save.currencies.porch_coins || 0) - beforeCoins;
  if (coinGain) lines.push(tr ? `Gece jetonu +${coinGain}` : `Overnight coins +${coinGain}`);
  addPassXp(state.save, 1);
  lines.push(tr ? "Pass XP +1" : "Pass XP +1");

  const lastNote = (state.save.storyRecap || [])[0]?.text;
  if (lastNote) lines.push(tr ? `Hatırlanan: ${lastNote}` : `Remembered: ${lastNote}`);

  state.save.dayIndex += 1;
  state.save.weekNumber = weekNumber();
  state.save.dailyEarn = { talkCoins: 0, dramaThread: false, shareClaimed: false };
  state.save.evening = {
    checkin: false,
    visits: [],
    streetEvent: false,
    errand: false,
    cupDone: false,
    cupEveDone: false,
    complete: false,
  };
  state.save.visitedArcToday = {};
  Story.syncWeekArcs(state.stories, state.save);
  Story.applyStoryUnlocks(state.stories, state.save);
  unlockNeighborsIfReady();

  if (state.save.dayIndex >= 28) {
    const ending = Story.evaluateEndings(state.stories, state.save);
    if (ending) state.save.endingId = ending.id;
  }
  saveNow();

  const until = daysUntilCupNight();
  const tease =
    until === 0
      ? tr
        ? "Sabah: Cup gecesi. Formasyonunu hazırla."
        : "Morning: Cup night. Set your formation."
      : tr
        ? `${loc(dayHeadline())} · Cup'a ${until} gün`
        : `${loc(dayHeadline())} · ${until} day${until === 1 ? "" : "s"} to Cup`;

  if (state.save.endingId && state.save.dayIndex >= 30) {
    renderEnding();
    showScreen("screen-story");
    return;
  }
  renderOvernight({ lines, tease });
}

function renderEnding() {
  const ending = (state.stories.endings || []).find((e) => e.id === state.save.endingId) || Story.evaluateEndings(state.stories, state.save);
  const screen = document.getElementById("screen-story");
  const dom = Story.dominantRep(state.save);
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(state.stories.season1?.title) || "Season 1"}</h2></div>
    <p class="result-banner win">${loc(ending?.title) || "—"}</p>
    <div class="dialog-box"><p>${loc(ending?.summary)}</p>
      <p class="muted">${dom ? Story.repLabel(dom, state.locale) : ""}</p>
    </div>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="goto-evening">${t("common.continue")}</button>
    </div>`;
}

function renderStoryLog() {
  const screen = document.getElementById("screen-story");
  const ending = state.save.endingId
    ? (state.stories.endings || []).find((e) => e.id === state.save.endingId)
    : null;
  const unlocks = state.save.storyUnlocks || { skins: [], unitMods: [] };
  const arcs = (state.stories.arcs || [])
    .map((a) => {
      const st = state.save.arcs?.[a.id];
      const beats = a.beats || [];
      const doneBeats = beats.filter((b) => state.save.storyFlags?.[b.id + "_done"] || state.save.storyFlags?.[b.id]).length;
      const status = st?.complete
        ? state.locale === "tr" ? "bitti" : "done"
        : st
          ? state.locale === "tr" ? "devam" : "open"
          : state.locale === "tr" ? "kilitli" : "locked";
      const beatLine = beats
        .map((b) => {
          const ok = !!(state.save.storyFlags?.[b.id + "_done"] || state.save.storyFlags?.[b.id]);
          return `<li class="${ok ? "done" : ""}">${ok ? "✓" : "○"} ${loc(b.prompt)}</li>`;
        })
        .join("");
      return `<article class="arc-card art-card ${st?.complete ? "done" : st ? "open" : "locked"}">
        <h3>${st?.complete ? "✓ " : st ? "● " : "○ "}${loc(a.title)} <span class="agenda-hint">${status} · ${doneBeats}/${beats.length}</span></h3>
        <p class="muted">${(a.neighbors || []).map((id) => loc(neighborById(id)?.name) || id).join(" · ")}</p>
        <ul class="agenda-list quest-obj">${beatLine || `<li class="muted">—</li>`}</ul>
      </article>`;
    })
    .join("");
  const repLine = Object.entries(state.save.reputation || {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${Story.repLabel(k, state.locale)} ${v}`)
    .join(" · ") || "—";
  const recap = (state.save.storyRecap || [])
    .map((r) => `<li>Day ${r.day}: ${r.text}</li>`)
    .join("") || `<li class="muted">${state.locale === "tr" ? "Henüz not yok — sahneleri oyna." : "No notes yet — play scenes."}</li>`;
  const unlockBits = [
    ...(unlocks.skins || []).map((id) => id.replace(/^skin_/, "")),
    ...(unlocks.unitMods || []).map((id) => id.replace(/^mod_/, "")),
  ];
  const activeQ = Quests.activeQuests(state.questPack, state.save);
  const questBits = activeQ.length
    ? activeQ.map((q) => `<li>● ${loc(q.title)}</li>`).join("")
    : `<li class="muted">${state.locale === "tr" ? "Aktif görev yok" : "No active quests"}</li>`;
  screen.innerHTML = `
    ${hudHtml()}
    <div class="art-hero journal-hero" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}">
      <div class="art-hero-scrim">
        <div class="topbar"><h2>${state.locale === "tr" ? "Hikâye defteri" : "Story journal"}</h2>
          <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
        </div>
        <p class="evening-cup-tease">${state.locale === "tr" ? "Ark ilerlemesi · seçim izleri · görevler" : "Arc progress · choice marks · quests"}</p>
      </div>
    </div>
    <h3 class="section-label">${state.locale === "tr" ? "Arklar" : "Arcs"}</h3>
    <div class="arc-list">${arcs}</div>
    <h3 class="section-label">${state.locale === "tr" ? "Aktif görevler" : "Active quests"}</h3>
    <ul class="agenda-list">${questBits}</ul>
    <div class="btn-row"><button class="btn btn-teal" type="button" data-action="open-quests">${state.locale === "tr" ? "Görev defteri" : "Quest log"}</button></div>
    <h3 class="section-label">${state.locale === "tr" ? "Mahalle ünü" : "Street rep"}</h3>
    <p class="muted">${repLine}</p>
    <h3 class="section-label">${state.locale === "tr" ? "Son notlar" : "Recent notes"}</h3>
    <ul class="agenda-list recap-list">${recap}</ul>
    <h3 class="section-label">${state.locale === "tr" ? "Hikâye ödülleri" : "Story unlocks"}</h3>
    <p class="muted">${unlockBits.length ? unlockBits.join(", ") : state.locale === "tr" ? "Henüz yok" : "None yet"}</p>
    <h3 class="section-label">${state.locale === "tr" ? "Sezon sonu" : "Season end"}</h3>
    <p class="muted">${ending ? loc(ending.title) : state.locale === "tr" ? "28. günden sonra kilitlenir" : "Locks after day 28"}</p>
    ${ending ? `<p>${loc(ending.summary)}</p>` : ""}`;
  showScreen("screen-story");
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
  const syns = activeSynergies(tags);
  const synDesc = (s) => loc(s.rules?.description) || loc(s.name);
  const preview = syns
    .map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}" title="${synDesc(s)}">${loc(s.name)}</span>`)
    .join("") || `<span class="muted">${t("synergy.active")}: —</span>`;
  const synHint = syns.length
    ? syns.map(synDesc).join(" · ")
    : state.locale === "tr"
      ? "Aynı etiketlerden 2+ seç → sinerji"
      : "Pick 2+ matching tags → synergy";

  const cupWorld = worldCupLines();
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("cup.lobby_title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
    </div>
    <p class="street-hint">${fillTemplate(t("cup.week"), { week: weekNumber(), mult: state.botMult.toFixed(2) })} · ${isCupNight() ? t("cup.season_night") : t("cup.practice")}</p>
    <p class="muted">${econT(state.economy, state.locale, "cup.flair.free_ok")}</p>
    <div class="arena-hero clay-stage" style="background-image:${stageBg(ART.arenaStage, ART.arenaStageFallback)}"></div>
    ${cupWorld.length ? `<p class="world-consequence">${cupWorld.map((l) => `◈ ${l}`).join(" · ")}</p>` : ""}
    <p class="street-hint">${fillTemplate(t("cup.picks"), { n: state.pickCount })} (${list.length} ${state.locale === "tr" ? "açık" : "unlocked"})</p>
    <div class="pick-grid pick-grid-dense">${cards}</div>
    <div class="synergy-pills" style="justify-content:center">${preview}</div>
    <p class="muted synergy-hint">${synHint}</p>
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
  if (!state.enemyLineup?.length) state.enemyLineup = pickEnemyLineup(state.cupPicks);
  const enemyIds = state.enemyLineup;
  const tr = state.locale === "tr";
  const allyCells = state.placement
    .map((pid, idx) => {
      const lane = idx < 3 ? (tr ? "ön" : "F") : (tr ? "arka" : "B");
      const filled = pid ? `<img src="${bust(pid)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" />` : `<span class="cell-lane">${lane}</span>`;
      return `<button class="cell ${pid ? "filled" : ""} ${idx < 3 ? "lane-front" : "lane-back"}" type="button" data-action="place-cell" data-idx="${idx}">${filled}</button>`;
    })
    .join("");
  // Bots: 2 front + 1 back so formation reads
  const enemyLayout = [enemyIds[0], enemyIds[1], null, enemyIds[2], null, null];
  const enemyHtml = enemyLayout
    .map((botId, idx) => {
      if (!botId) {
        const lane = idx < 3 ? (tr ? "ön" : "F") : (tr ? "arka" : "B");
        return `<div class="cell enemy ${idx < 3 ? "lane-front" : "lane-back"}"><span class="cell-lane">${lane}</span></div>`;
      }
      const unit = bot.units.find((u) => u.id === botId);
      return `<div class="cell enemy filled ${idx < 3 ? "lane-front" : "lane-back"}"><img src="${bust(unit.mirrorOf)}" alt="" /></div>`;
    })
    .join("");
  const bench = state.cupPicks
    .map((id) => {
      const placed = state.placement.includes(id);
      const role = neighborById(id)?.role || "";
      return `<button class="bench-unit ${placed ? "placed" : ""} ${state.selectedBench === id ? "selected" : ""}" type="button" data-action="select-bench" data-id="${id}" ${placed ? "disabled" : ""}>
        <img src="${bust(id)}" alt="" onerror="this.src='${DAY1_BUSTS.n1}'" /><span class="bench-role">${role}</span></button>`;
    })
    .join("");
  const placedCount = state.placement.filter(Boolean).length;
  const frontCount = state.placement.slice(0, 3).filter(Boolean).length;
  const backCount = state.placement.slice(3).filter(Boolean).length;
  const formHint =
    placedCount === 0
      ? tr
        ? "Tank/ön · burst/heal arka — Auto akıllı dizer"
        : "Tanks front · burst/heal back — Auto places smart"
      : tr
        ? `Ön ${frontCount} · Arka ${backCount}${frontCount === placedCount && placedCount > 1 ? " ⚠ hep ön" : ""}`
        : `Front ${frontCount} · Back ${backCount}${frontCount === placedCount && placedCount > 1 ? " ⚠ all-front" : ""}`;
  const screen = document.getElementById("screen-draft");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("draft.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-cup">${t("common.back")}</button>
    </div>
    <p class="street-hint">${t("draft.hint")} · ${formHint}</p>
    <div class="placement-board">
      <div><div class="grid-label">${tr ? "Sen (ön→arka)" : "You (front→back)"}</div><div class="grid-side ally-side">${allyCells}</div></div>
      <div><div class="grid-label">${loc(bot.label)}</div><div class="grid-side enemy-side">${enemyHtml}</div></div>
    </div>
    <div class="bench">${bench}</div>
    <p class="muted">${state.selectedBench ? (tr ? "Şimdi bir hücreye dokun" : "Now tap a cell") : (tr ? "Önce tepside birim seç" : "Pick a unit from the tray first")}</p>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-action="auto-place">${tr ? "Otomatik (rol)" : "Auto (by role)"}</button>
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
  const rank = (id) => {
    const role = (neighborById(id)?.role || "").toLowerCase();
    if (/tank|bruiser/.test(role)) return 0;
    if (/support/.test(role)) return 1;
    if (/heal/.test(role)) return 2;
    if (/burst|aoe|assassin|glass|cannon/.test(role)) return 3;
    return 2;
  };
  // Front slots 0–1 for tanks/bruisers; back 3–4 for burst/heal — never all-front
  const front = [0, 1];
  const back = [3, 4, 2, 5];
  const ordered = [...state.cupPicks].sort((a, b) => rank(a) - rank(b));
  const frontIds = ordered.filter((id) => rank(id) <= 1).slice(0, 2);
  const backIds = ordered.filter((id) => !frontIds.includes(id));
  frontIds.forEach((id, i) => {
    state.placement[front[i]] = id;
  });
  backIds.forEach((id, i) => {
    state.placement[back[i] ?? 5] = id;
  });
  // If only one front-capable, still keep at least one in back when 3 picks
  const filled = state.placement.filter(Boolean).length;
  if (filled < state.cupPicks.length) {
    ordered.forEach((id) => {
      if (state.placement.includes(id)) return;
      const slot = state.placement.findIndex((x) => !x);
      if (slot >= 0) state.placement[slot] = id;
    });
  }
  state.selectedBench = null;
  renderDraft();
  const allFront = state.placement.slice(0, 3).filter(Boolean).length === state.cupPicks.length;
  if (allFront) toast(state.locale === "tr" ? "Uyarı: hep ön sıra — bot cezalandırır" : "Warn: all-front — bots will punish");
}

function makeFighter(neighborId, side, slot) {
  const n = neighborById(neighborId);
  const base = unitStatsFor(neighborId);
  const aff = state.save.affinity[neighborId] || 0;
  // affinity is 0–100; keep modest combat scaling
  base.hp += Math.floor(aff / 5);
  base.atk += Math.floor(aff / 20);
  const mod = Story.unitModFor(state.save, state.stories, neighborId);
  if (mod?.combat) {
    if (mod.combat.atkBonusPercent) base.atk = Math.round(base.atk * (1 + mod.combat.atkBonusPercent));
    if (mod.combat.defPenaltyPercent) base.def = Math.max(1, Math.round(base.def * (1 - mod.combat.defPenaltyPercent)));
    if (mod.combat.defBonusPercent) base.def = Math.round(base.def * (1 + mod.combat.defBonusPercent));
    if (mod.combat.hpBonusPercent) base.hp = Math.round(base.hp * (1 + mod.combat.hpBonusPercent));
  }
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

function pickEnemyLineup(allyIds) {
  const bot = state.content.botCupRoster;
  const mirrored = new Set(allyIds.map((id) => `bot_${id}`));
  const pool = (bot.units || []).filter((u) => !mirrored.has(u.id));
  const picks = [];
  const preferred = (bot.defaultLineup || []).filter((id) => !mirrored.has(id));
  for (const id of preferred) {
    if (picks.length >= 3) break;
    if (!picks.includes(id)) picks.push(id);
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const u of shuffled) {
    if (picks.length >= 3) break;
    if (!picks.includes(u.id)) picks.push(u.id);
  }
  while (picks.length < 3) {
    const fallback = (bot.units || []).find((u) => !picks.includes(u.id));
    if (!fallback) break;
    picks.push(fallback.id);
  }
  return picks.slice(0, 3);
}

function startFight() {
  if (state.fightTimer) clearInterval(state.fightTimer);
  const allyIds = state.placement.filter(Boolean);
  const bot = state.content.botCupRoster;
  const placedSlots = state.placement
    .map((id, slot) => (id ? slot : null))
    .filter((s) => s != null);
  const allFront = placedSlots.length > 0 && placedSlots.every((s) => s < 3);
  // Practice Cup bots fight harder; all-front placement gets punished harder
  let mult = (state.botMult || 1) * (isCupNight() ? 1 : 1.18);
  if (allFront) mult *= 1.28;
  const enemyIds = state.enemyLineup?.length ? state.enemyLineup : pickEnemyLineup(allyIds);
  state.enemyLineup = enemyIds;
  // Match draft board: bots sit front/front/back (slots 0,1,3)
  const enemySlots = [0, 1, 3];
  const enemies = enemyIds.map((id, i) => makeBotFighter(bot.units.find((x) => x.id === id), enemySlots[i] ?? i, mult));
  // Preserve placement slots on fighters
  const allies = state.placement
    .map((id, slot) => (id ? makeFighter(id, "ally", slot) : null))
    .filter(Boolean);
  const battle = {
    allies,
    enemies,
    allySyn: activeSynergies(allies.map((a) => a.synergyTag)),
    enemySyn: activeSynergies(enemies.map((a) => a.synergyTag)),
    elapsed: 0,
    finished: false,
    log: [],
    floaters: [],
    paused: false,
    actionUsed: false,
    actionOffered: false,
    focusTargetSlot: null,
    allFront,
    propReady: true,
  };
  if (allFront) {
    battle.log.unshift(state.locale === "tr" ? "Bot: hep ön sıra cezası!" : "Bot: all-front punish!");
  }
  state.battle = battle;
  renderFight(battle);
  showScreen("screen-fight");
  resumeFightLoop(battle);
}

function resumeFightLoop(battle) {
  if (state.fightTimer) clearInterval(state.fightTimer);
  const tickMs = 700;
  const uiMs = 100;
  let combatAcc = 0;
  const startedAt = performance.now() - battle.elapsed * 1000;
  state.fightTimer = setInterval(() => {
    if (battle.finished || battle.paused) return;
    battle.elapsed = (performance.now() - startedAt) / 1000;
    // Offer one player action mid-fight
    if (!battle.actionOffered && battle.elapsed >= 2.4 && battle.allies.some((u) => u.alive) && battle.enemies.some((u) => u.alive)) {
      battle.actionOffered = true;
      battle.paused = true;
      updateFightUI(battle);
      showFightActions(battle);
      return;
    }
    combatAcc += uiMs;
    while (combatAcc >= tickMs) {
      combatAcc -= tickMs;
      combatTick(battle);
    }
    battle.floaters = (battle.floaters || []).filter((f) => battle.elapsed - f.t < 0.85);
    updateFightUI(battle);
    if (battle.elapsed >= 75 || !battle.allies.some((u) => u.alive) || !battle.enemies.some((u) => u.alive)) {
      endFight(battle);
    }
  }, uiMs);
}

function showFightActions(battle) {
  const bar = document.getElementById("fight-actions");
  if (!bar) return;
  const tr = state.locale === "tr";
  const foes = battle.enemies.filter((u) => u.alive);
  const focusBtns = foes
    .map(
      (u) =>
        `<button class="btn btn-ember" type="button" data-action="fight-focus" data-slot="${u.slot}">${tr ? "Hedef" : "Focus"} ${u.name}</button>`
    )
    .join("");
  bar.innerHTML = `
    <p class="fight-action-prompt">${tr ? "Porch hamlesi — birini seç" : "Porch call — pick one"}</p>
    <div class="btn-row wrap">${focusBtns}
      <button class="btn btn-teal" type="button" data-action="fight-prop">${tr ? "Prop: demlik heal" : "Prop: teapot heal"}</button>
      <button class="btn btn-secondary" type="button" data-action="fight-swap">${tr ? "Ön↔Arka swap" : "Front↔Back swap"}</button>
    </div>`;
  bar.hidden = false;
}

function applyFightFocus(slot) {
  const battle = state.battle;
  if (!battle || battle.actionUsed) return;
  battle.focusTargetSlot = Number(slot);
  battle.actionUsed = true;
  battle.paused = false;
  const foe = battle.enemies.find((u) => u.slot === Number(slot));
  const msg = state.locale === "tr" ? `Odak: ${foe?.name || slot}` : `Focus fire: ${foe?.name || slot}`;
  battle.log.unshift(msg);
  toast(msg);
  hideFightActions();
  updateFightUI(battle);
  resumeFightLoop(battle);
}

function applyFightProp() {
  const battle = state.battle;
  if (!battle || battle.actionUsed) return;
  const hurt = battle.allies.filter((u) => u.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (hurt) {
    const heal = Math.max(12, Math.floor(hurt.maxHp * 0.22));
    hurt.hp = Math.min(hurt.maxHp, hurt.hp + heal);
    const msg = state.locale === "tr" ? `Demlik +${heal} → ${hurt.name}` : `Teapot +${heal} → ${hurt.name}`;
    battle.log.unshift(msg);
    toast(msg);
  }
  battle.actionUsed = true;
  battle.paused = false;
  hideFightActions();
  updateFightUI(battle);
  resumeFightLoop(battle);
}

function applyFightSwap() {
  const battle = state.battle;
  if (!battle || battle.actionUsed) return;
  const living = battle.allies.filter((u) => u.alive);
  if (living.length >= 2) {
    const front = living.find((u) => u.slot < 3) || living[0];
    const back = living.find((u) => u.slot >= 3 && u !== front) || living.find((u) => u !== front);
    if (front && back) {
      const s = front.slot;
      front.slot = back.slot;
      back.slot = s;
      const msg = `Swap: ${front.name} ↔ ${back.name}`;
      battle.log.unshift(msg);
      toast(msg);
    }
  }
  battle.actionUsed = true;
  battle.paused = false;
  hideFightActions();
  updateFightUI(battle);
  resumeFightLoop(battle);
}

function hideFightActions() {
  const bar = document.getElementById("fight-actions");
  if (bar) {
    bar.hidden = true;
    bar.innerHTML = "";
  }
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
    if (attacker.side === "ally" && battle.focusTargetSlot != null) {
      const focused = foes.find((f) => f.slot === battle.focusTargetSlot);
      if (focused) target = focused;
    }
    // All-front punish: enemy attackers get +20% vs front-row allies
    if (attacker.side === "enemy" && battle.allFront) {
      /* applied below via dmg mult */
    }

    const syns = attacker.side === "ally" ? battle.enemySyn : battle.allySyn;
    const neon = syns.find((s) => s.rules.type === "opening_dodge");
    if (neon && battle.elapsed <= neon.rules.windowSec && Math.random() < neon.rules.dodgeChance) continue;

    let dmg = Math.max(1, attacker.atk - Math.floor(target.def * 0.45));
    if (attacker.side === "enemy" && battle.allFront && target.slot < 3) dmg = Math.floor(dmg * 1.2);
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
      for (const f of foes) applyDamage(f, f === target ? dmg : Math.max(1, Math.floor(dmg * 0.35)), attacker, battle);
    } else applyDamage(target, dmg, attacker, battle);

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

function applyDamage(target, dmg, attacker, battle) {
  target.hp -= dmg;
  attacker.damageDealt += dmg;
  if (battle) {
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: target.side, slot: target.slot, dmg, t: battle.elapsed });
    battle.log = battle.log || [];
    battle.log.unshift(`${attacker.name} → ${target.name} −${dmg}`);
    battle.log = battle.log.slice(0, 4);
  }
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
  const tr = state.locale === "tr";
  const screen = document.getElementById("screen-fight");
  screen.innerHTML = `
    <div class="topbar"><h2>${t("fight.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="skip-fight">${t("fight.skip")}</button>
    </div>
    <div class="fight-hud" style="margin-bottom:0.35rem">
      <span id="ally-hp-total" class="hud-ally"></span><span id="fight-timer">0.0s</span><span id="enemy-hp-total" class="hud-enemy"></span>
    </div>
    <div class="fight-stage clay-stage" style="background-image:${stageBg(ART.arenaStage, ART.arenaStageFallback)}">
      <div class="fight-side-label enemy-label">${tr ? "Rakip" : "Rival"}</div>
      <div class="fight-lane-label">${tr ? "ön" : "front"}</div>
      <div class="fight-row front" id="enemy-front"></div>
      <div class="fight-lane-label muted">${tr ? "arka" : "back"}</div>
      <div class="fight-row back" id="enemy-back"></div>
      <div class="fight-vs">VS</div>
      <div class="fight-lane-label">${tr ? "ön" : "front"}</div>
      <div class="fight-row front" id="ally-front"></div>
      <div class="fight-lane-label muted">${tr ? "arka" : "back"}</div>
      <div class="fight-row back" id="ally-back"></div>
      <div class="fight-side-label ally-label">${tr ? "Senin porch" : "Your porch"}</div>
    </div>
    <div class="synergy-pills">${synPills}</div>
    <div class="fight-actions" id="fight-actions" hidden></div>
    <p class="fight-log muted" id="fight-log"></p>`;
  screen._battle = battle;
  updateFightUI(battle);
}

function unitCard(u, side, floaters = []) {
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  const floater = floaters
    .filter((f) => f.side === side && f.slot === u.slot)
    .map((f) => `<span class="dmg-floater">−${f.dmg}</span>`)
    .join("");
  return `<div class="unit-slot ${side === "enemy" ? "enemy" : "ally"} ${u.alive ? "" : "dead"}" data-side="${side}" data-slot="${u.slot}">
    <div class="unit-name">${u.name}</div>
    <img src="${bust(u.mirrorOf || u.id)}" alt="${u.name}" onerror="this.src='${DAY1_BUSTS.n1}'" />
    <div class="hp-track"><div class="hp-fill" style="width:${pct}%"></div></div>
    <div class="hp-num">${Math.max(0, Math.round(u.hp))}/${u.maxHp}</div>
    ${floater}
  </div>`;
}

function updateFightUI(battle) {
  const enemyFront = document.getElementById("enemy-front");
  const enemyBack = document.getElementById("enemy-back");
  const allyFront = document.getElementById("ally-front");
  const allyBack = document.getElementById("ally-back");
  if (!enemyFront || !allyFront) return;
  const floaters = battle.floaters || [];
  const split = (units, side) => {
    const front = units.filter((u) => (u.slot ?? 0) < 3).sort((a, b) => a.slot - b.slot);
    const back = units.filter((u) => (u.slot ?? 0) >= 3).sort((a, b) => a.slot - b.slot);
    // If all were placed in one band, still show them (fallback)
    if (!front.length && !back.length) return { front: units, back: [] };
    if (!front.length) return { front: back.slice(0, Math.ceil(back.length / 2)), back: back.slice(Math.ceil(back.length / 2)) };
    if (!back.length && units.length > 2) {
      return { front: front.slice(0, 2), back: front.slice(2) };
    }
    return { front, back };
  };
  const e = split(battle.enemies, "enemy");
  const a = split(battle.allies, "ally");
  enemyFront.innerHTML = e.front.map((u) => unitCard(u, "enemy", floaters)).join("") || `<span class="muted">—</span>`;
  enemyBack.innerHTML = e.back.map((u) => unitCard(u, "enemy", floaters)).join("") || `<span class="muted lane-empty">·</span>`;
  allyFront.innerHTML = a.front.map((u) => unitCard(u, "ally", floaters)).join("") || `<span class="muted">—</span>`;
  allyBack.innerHTML = a.back.map((u) => unitCard(u, "ally", floaters)).join("") || `<span class="muted lane-empty">·</span>`;
  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  document.getElementById("ally-hp-total").textContent = `${state.locale === "tr" ? "Sen" : "You"} ${allyHp}`;
  document.getElementById("enemy-hp-total").textContent = `Bot ${enemyHp}`;
  document.getElementById("fight-timer").textContent = `${battle.elapsed.toFixed(1)}s`;
  const log = document.getElementById("fight-log");
  if (log) log.textContent = (battle.log || []).join(" · ");
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
  let earn = applyCupEarn(state.save, state.economy, { won, hadSynergy: !!syn, shared: false });
  // Practice Cup pays half soft currency so Day-1 economy isn't warped
  if (!isCupNight() && earn?.delta) {
    for (const [k, v] of Object.entries(earn.delta)) {
      if (v > 0 && (k === "porch_coins" || k === "neon_thread")) {
        const cut = Math.floor(v / 2);
        state.save.currencies[k] = Math.max(0, (state.save.currencies[k] || 0) - cut);
        earn.delta[k] = v - cut;
      }
    }
    earn.delta = Object.fromEntries(Object.entries(earn.delta).filter(([, v]) => v));
  }
  state.lastResult.rewards = earn?.delta || {};
  state.lastResult.rewardLine = formatCurrencyDelta(earn?.delta, state.economy, state.locale);
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
  unlockNeighborsIfReady();
  emitQuestEvent({ type: "cup_finish", won });
  if (syn) emitQuestEvent({ type: "cup_synergy", synergy: syn.id || syn.name });
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
    <p class="street-hint muted">${t("fight.hp_total")}: ${r.allyHp} vs ${r.enemyHp} · MVP ${r.mvp}</p>
    ${r.rewardLine ? `<p class="reward-breakdown">${state.locale === "tr" ? "Ödül" : "Rewards"}: ${r.rewardLine}</p>` : ""}
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

function wrapCanvasText(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function exportShareImage() {
  const r = state.lastResult;
  if (!r) return;
  const canvas = el.canvas;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const finish = () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rival-porch-cup.png";
      a.click();
      URL.revokeObjectURL(url);
      toast(state.locale === "tr" ? "Görsel indirildi" : "Image downloaded");
      emitQuestEvent({ type: "share" });
    });
  };
  ctx.fillStyle = "#1A1612";
  ctx.fillRect(0, 0, W, H);
  const arena = new Image();
  arena.onload = () => {
    const heroH = Math.floor(H * 0.34);
    ctx.drawImage(arena, 0, 0, W, heroH);
    ctx.fillStyle = "rgba(26,22,18,0.55)";
    ctx.fillRect(0, 0, W, heroH);
    ctx.fillStyle = "#F2E6D8";
    ctx.font = "bold 56px Fraunces, serif";
    ctx.fillText(t("app.title"), 48, 88);
    ctx.font = "bold 42px Nunito, sans-serif";
    ctx.fillStyle = r.won ? "#2EC4B6" : "#FF6B4A";
    const resultLine = r.won
      ? state.locale === "tr" ? "Cup Zaferi" : "Cup Victory"
      : state.locale === "tr" ? "Cup Yenilgisi" : "Cup Defeat";
    ctx.fillText(resultLine, 48, 150);
    ctx.fillStyle = "#F5C878";
    ctx.font = "28px Nunito, sans-serif";
    ctx.fillText(`${r.allyHp} vs ${r.enemyHp} · MVP ${r.mvp}`, 48, 200);
    ctx.fillStyle = "#E8A045";
    ctx.font = "24px Nunito, sans-serif";
    const comic = state.content.matchComic;
    const headlineTpl = comic?.panels?.[0]?.textTemplate || {
      tr: "{winner} kazandı · {synergy}",
      en: "{winner} wins · {synergy}",
    };
    const headline = fillTemplate(loc(headlineTpl), {
      winner: r.winner,
      synergy: r.synergy,
      mvp: r.mvp,
    });
    wrapCanvasText(ctx, headline, W - 96).forEach((ln, i) => ctx.fillText(ln, 48, 245 + i * 30));
    if (r.rewardLine) {
      ctx.fillStyle = "#F2E6D8";
      ctx.font = "22px Nunito, sans-serif";
      ctx.fillText(r.rewardLine, 48, 340);
    }
    // Bottom strip caption — one clean line, not per-bust repeats
    const stripY = H - 110;
    ctx.fillStyle = "rgba(26,22,18,0.92)";
    ctx.fillRect(0, stripY, W, 110);
    const stripTpl = comic?.panels?.[1]?.textTemplate || {
      tr: "MVP {mvp} · {synergy} parladi",
      en: "MVP {mvp} · {synergy} lit up",
    };
    const strip = fillTemplate(loc(stripTpl), {
      winner: r.winner,
      synergy: r.synergy,
      mvp: r.mvp,
    });
    ctx.fillStyle = "#F2E6D8";
    ctx.font = "26px Nunito, sans-serif";
    const stripLines = wrapCanvasText(ctx, strip, W - 96);
    stripLines.forEach((ln, i) => ctx.fillText(ln, 48, stripY + 42 + i * 30));

    let loaded = 0;
    const team = r.team.slice(0, 3);
    if (!team.length) {
      finish();
      return;
    }
    const bustY = 380;
    team.forEach((id, i) => {
      const img = new Image();
      img.onload = () => {
        const x = 64 + i * 340;
        ctx.drawImage(img, x, bustY, 260, 260);
        ctx.fillStyle = "#F2E6D8";
        ctx.font = "bold 24px Nunito, sans-serif";
        ctx.fillText(loc(neighborById(id)?.name) || id, x, bustY + 290);
        loaded += 1;
        if (loaded === team.length) finish();
      };
      img.onerror = () => {
        loaded += 1;
        if (loaded === team.length) finish();
      };
      img.src = bust(id);
    });
  };
  arena.onerror = finish;
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
          <div class="muted">${shopStr("shop.fairness_badge")}</div>
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
        `<div class="shop-card iap-card"><div class="name">${loc(i.name)}</div><div class="muted">~${i.priceBandUsd} USD · ${state.locale === "tr" ? "önizleme" : "preview"}</div>
        <button class="btn btn-ember" type="button" data-action="iap-stub" data-sku="${i.sku}">${shopStr("shop.buy")}</button></div>`
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
    ${tab === "skins" ? `<h3 class="section-label">${state.locale === "tr" ? "Destek paketleri" : "Support packs"}</h3><div class="shop-grid">${iap}</div><p class="muted">${shopStr("iap.disclaimer")}</p>` : ""}
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
          <div>${rewardLabel(r.free, state.locale, state.economy)}</div>
          <button class="btn btn-secondary" type="button" data-action="claim-pass" data-track="free" data-level="${r.level}" ${unlocked && !freeClaimed ? "" : "disabled"}>${freeClaimed ? "✓" : shopStr("shop.claim")}</button>
        </div>
        <div class="pass-cell paid">
          <div class="muted">${shopStr("pass.paid")}</div>
          <div>${rewardLabel(r.paid, state.locale, state.economy)}</div>
          <button class="btn btn-ember" type="button" data-action="claim-pass" data-track="paid" data-level="${r.level}" ${unlocked && state.save.passPaidUnlocked && !paidClaimed ? "" : "disabled"}>${paidClaimed ? "✓" : state.save.passPaidUnlocked ? shopStr("shop.claim") : "🔒"}</button>
        </div>
      </div>`;
    })
    .join("");
  const beat = (pass.storyWeekMap || []).find((b) => state.save.dayIndex >= b.days[0] && state.save.dayIndex <= b.days[1]);
  const beatLabel = {
    meet_the_block: { tr: "Mahalle tanışması", en: "Meet the block" },
    rivalries_heat: { tr: "Rekabet ısınıyor", en: "Rivalries heat up" },
    neon_nights: { tr: "Neon geceler", en: "Neon nights" },
    festival_cup_prep: { tr: "Festival Cup hazırlığı", en: "Festival Cup prep" },
    street_finale: { tr: "Sokak finali", en: "Street finale" },
  };
  const xpShown = Number(state.save.passXp || 0).toFixed(1).replace(/\.0$/, "");
  const passIap = (state.economy.iaps?.recommendedFirst3 || []).find((i) => i.sku === "iap_porch_week_pass");
  const passPrice = passIap?.priceBandUsd ? `$${Number(passIap.priceBandUsd).toFixed(2)}` : "$4.99";
  const ctaLabel = state.save.passPaidUnlocked
    ? shopStr("shop.owned")
    : state.locale === "tr"
      ? `Kil Yol · ${passPrice}`
      : `Clay Track · ${passPrice}`;
  return `
    <div class="pass-header">
      <h3>${loc(pass.name)}</h3>
      <p class="muted">${shopStr("pass.xp_hint")}</p>
      <p>${shopStr("pass.story_sync")}${beat ? ` · ${loc(beatLabel[beat.beat] || { en: String(beat.beat).replace(/_/g, " ") })}` : ""}</p>
      <p class="muted">${state.locale === "tr"
        ? "Ücretsiz yol herkese açık. Kil yol sadece kozmetik — hikâyeyi kilitlemez."
        : "Free track for everyone. Clay track is cosmetics only — never gates story."}</p>
      <p class="pick-status">Lv ${level}/30 · XP ${xpShown}</p>
      <button class="btn btn-ember" type="button" data-action="iap-stub" data-sku="iap_porch_week_pass" ${state.save.passPaidUnlocked ? "disabled" : ""}>${ctaLabel}</button>
      <p class="muted">${shopStr("iap.story_clear")} · ${shopStr("iap.disclaimer")}</p>
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
      state.save.locale = state.locale;
      state.save.coldOpenDone = false;
      for (const n of state.content.neighbors) ensureNeighborState(n.id);
      Story.syncWeekArcs(state.stories, state.save);
      saveNow();
      renderColdOpen();
      break;
    case "cold-choice":
      resolveColdOpen(target.dataset.cid);
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
      // Preview unlock for Clay track cosmetics — never gates story
      state.save.passPaidUnlocked = true;
      saveNow();
      toast(state.locale === "tr" ? "Kil yol açıldı (önizleme)" : "Clay track unlocked (preview)");
      renderShop();
      break;
    case "iap-stub":
      if (target.dataset.sku === "iap_porch_week_pass") {
        state.save.passPaidUnlocked = true;
        saveNow();
        toast(state.locale === "tr" ? "Kil Yol açıldı · $4.99 (önizleme)" : "Clay Track unlocked · $4.99 (preview)");
        renderShop();
      } else if (target.dataset.sku === "iap_clay_tokens_mini") {
        toast((state.locale === "tr" ? "Önizleme: " : "Preview: ") + target.dataset.sku);
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
      state.enemyLineup = null;
      renderCupLobby();
      showScreen("screen-cup");
      break;
    case "goto-draft":
      state.placement = Array(6).fill(null);
      state.selectedBench = null;
      state.enemyLineup = pickEnemyLineup(state.cupPicks);
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
    case "dialogue-end":
      finishDialogue();
      break;
    case "open-story-log":
      renderStoryLog();
      break;
    case "open-quests":
      state.questTab = "active";
      renderQuestLog();
      break;
    case "quest-tab":
      state.questTab = target.dataset.id || "active";
      renderQuestLog();
      break;
    case "quest-accept": {
      const ok = Quests.acceptQuest(state.save, state.questPack, target.dataset.id);
      if (ok) {
        const def = Quests.questDef(state.questPack, target.dataset.id);
        toast((state.locale === "tr" ? "Görev alındı · " : "Quest accepted · ") + loc(def?.title));
        saveNow();
        state.questTab = "active";
        renderQuestLog();
      }
      break;
    }
    case "quest-complete": {
      const rewards = Quests.completeQuest(state.save, state.questPack, target.dataset.id, grantQuestRewards);
      if (rewards) {
        const def = Quests.questDef(state.questPack, target.dataset.id);
        toast((state.locale === "tr" ? "Görev bitti · " : "Quest complete · ") + loc(def?.title));
        saveNow();
        if (document.getElementById("screen-evening")?.classList.contains("active")) renderEvening();
        else if (document.getElementById("screen-quests")?.classList.contains("active")) renderQuestLog();
        else renderEvening();
      }
      break;
    }
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
      hideFightActions();
      skipFight();
      break;
    case "fight-focus":
      applyFightFocus(target.dataset.slot);
      break;
    case "fight-prop":
      applyFightProp();
      break;
    case "fight-swap":
      applyFightSwap();
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

async function loadQuestPack() {
  const stub = await fetch("data/quests.json").then((r) => r.json());
  // Optional overlay copied from Project store worker pack
  let overlay = null;
  try {
    const r = await fetch("data/quests.overlay.json");
    if (r.ok) overlay = await r.json();
  } catch {
    /* no overlay yet */
  }
  return Quests.mergeQuestPacks(stub, overlay);
}

async function tryPullStorePacks() {
  // Store quest pack is copied into data/quests.overlay.json by the agent when ready.
}

async function boot() {
  try {
    const [content, economy, stories, ladder, depthMeta, questPack] = await Promise.all([
      fetch("data/content.json").then((r) => r.json()),
      fetch("data/economy.json").then((r) => r.json()),
      fetch("data/stories.json").then((r) => r.json()),
      fetch("data/ladder.json").then((r) => r.json()),
      fetch("data/depth-meta.json").then((r) => r.json()),
      loadQuestPack(),
    ]);
    state.content = content;
    state.economy = economy;
    state.stories = stories;
    state.ladder = ladder;
    state.depthMeta = depthMeta;
    state.questPack = questPack;
    // Merge economy uiStrings over content placeholders for shop/pass
    state.content.uiStrings = { ...state.content.uiStrings, ...economy.uiStrings };
    const hadSave = !!localStorage.getItem("rivalPorch.save.v4");
    state.save = loadSave(economy, depthMeta);
    Quests.ensureQuestSave(state.save);
    const navLang = (navigator.language || "").toLowerCase().startsWith("tr") ? "tr" : "en";
    // Fresh profiles follow the browser; existing saves keep their locale.
    if (!hadSave) state.save.locale = navLang;
    state.locale = state.save.locale || navLang;
    for (const n of content.neighbors) ensureNeighborState(n.id);
    Story.syncWeekArcs(state.stories, state.save);
    Story.applyStoryUnlocks(state.stories, state.save);
    Quests.autoOfferArcQuests(state.questPack, state.save);
    saveNow();
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
