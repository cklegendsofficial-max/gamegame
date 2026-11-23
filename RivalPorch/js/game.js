import { loadSave, persistSave, clearSave, defaultSave } from "./save.js";
import {
  econT, grant, canPay, pay, bestAffordablePrice, ownCosmetic, owns,
  formatPrice, rewardLabel, applyDailyEarn, applyCupEarn, formatCurrencyDelta,
  addPassXp, claimPassReward,
} from "./wallet.js";
import * as Story from "./story.js";
import * as Quests from "./quests.js";
import {
  preloadSfx, unlockAudio, playKnock, playTeapotClink, playWinSting,
  playUiTap, startCrowdMurmur, stopCrowdMurmur,
} from "./sfx.js";
import * as Combat from "./combat.js";
import * as Density from "./density.js";

const DAY1_BUSTS = {
  n1: "assets/rival-porch/bust-n1-aunt-merve.png",
  n2: "assets/rival-porch/bust-n2-coach-cem.png",
  n3: "assets/rival-porch/bust-n3-kid-leyla.png",
  n4: "assets/rival-porch/bust-n4-mr-orhan.png",
  n5: "assets/rival-porch/bust-n5-dj-peri.png",
  n6: "assets/rival-porch/bust-n6-baker-can.png",
};

const MESHY_BUSTS = {
  n1: "assets/rival-porch/meshy/wave3/busts/bust-n1-aunt-merve.png",
  n2: "assets/rival-porch/meshy/wave3/busts/bust-n2-coach-cem.png",
  n3: "assets/rival-porch/meshy/wave3/busts/bust-n3-kid-leyla.png",
  n4: "assets/rival-porch/meshy/wave3/busts/bust-n4-mr-orhan.png",
  n5: "assets/rival-porch/meshy/wave3/busts/bust-n5-dj-peri.png",
  n6: "assets/rival-porch/meshy/wave3/busts/bust-n6-baker-can.png",
};

const ART = {
  // visual-fix-2: wave3 landscape heroes + busts/props (cover ≤1.12, data-wave=3)
  streetHero: "assets/rival-porch/meshy/wave3/heroes/hero-street-title.png",
  streetHeroFallback: "assets/rival-porch/meshy/env-street-block.png",
  arenaStage: "assets/rival-porch/meshy/wave3/heroes/hero-arena-cup.png",
  arenaStageFallback: "assets/rival-porch/meshy/env-arena-stage.png",
  busts: { ...MESHY_BUSTS },
  meshyBusts: { ...MESHY_BUSTS },
  goldBusts: { ...MESHY_BUSTS }, // wave3 closed — no pre-wave3 gold flash
  meshyRoot: "assets/rival-porch/meshy/",
  props: {
    demlik: "assets/rival-porch/meshy/wave3/props/prop-hero-demlik.png",
    duduk: "assets/rival-porch/meshy/wave3/props/prop-hero-duduk.png",
    gazete: "assets/rival-porch/meshy/wave3/props/prop-hero-gazete.png",
    kulaklik: "assets/rival-porch/meshy/wave3/props/prop-hero-kulaklik.png",
    tepsi: "assets/rival-porch/meshy/wave3/props/prop-hero-tepsi.png",
    ucurtma: "assets/rival-porch/meshy/wave3/props/prop-hero-ucurtma.png",
  },
  vfxRivalry: "assets/rival-porch/meshy/wave3/vfx/vfx-rivalry-still.png",
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
  combatPack: null,
  densityPack: null,
  uxPack: null,
  practiceMode: false,
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
function toast(msg, ms = 2400) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    el.app.appendChild(node);
  }
  node.textContent = msg;
  node.classList.add("show");
  clearTimeout(node._hide);
  node._hide = setTimeout(() => node.classList.remove("show"), Math.max(800, ms));
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => {
    s.classList.remove("active");
    s.classList.remove("rp-screen--street", "rp-screen--evening", "rp-screen--fight", "rp-screen--title");
  });
  const node = document.getElementById(id);
  if (node) {
    node.classList.add("active");
    const map = {
      "screen-street": "rp-screen--street",
      "screen-evening": "rp-screen--evening",
      "screen-fight": "rp-screen--fight",
      "screen-title": "rp-screen--title",
    };
    if (map[id]) node.classList.add(map[id]);
  }
  // Ambient bed on street / cup lobby; duck elsewhere
  if (id === "screen-street" || id === "screen-cup") startCrowdMurmur();
  else stopCrowdMurmur();
}

function storyFlag(id) {
  return !!state.save.storyFlags?.[id];
}

/** ux-session-2 + density: Day1 End evening = practice flags only; Day2+ always. */
function canEndEvening() {
  return Density.canEndEvening(state.save, state.uxPack2, state.densityPack);
}

function syncEndEveningUnlock() {
  state.ui = state.ui || {};
  const ok = canEndEvening();
  state.ui.endEveningEnabled = ok;
  state.ui.endEveningBlockedReason = ok ? null : "practice";
  state.ui.overnightReachable = ok;
  return ok;
}

/** Atomic Practice finish — flags + unlock before next evening paint (≤1 render). */
function onPracticeResolved() {
  state.save.storyFlags = state.save.storyFlags || {};
  const gate = state.uxPack2?.endEveningGate || {};
  const setFlags = gate.onPracticeResolvedSetFlags || [
    "practice_cup_done",
    "syn_taught_syn_rivalry",
    "first_evening_practice_cleared",
  ];
  for (const f of setFlags) state.save.storyFlags[f] = true;
  for (const f of gate.alsoEnsureFlags || [
    "practice_cup_rivalry_pop_seen",
    "practice_cup_porch_call_done",
  ]) {
    state.save.storyFlags[f] = true;
  }
  const teach = Density.practiceTeach(state.densityPack);
  for (const f of teach?.flagGates?.setsFlagsOnComplete || []) state.save.storyFlags[f] = true;
  state.save.evening.cupDone = true;
  syncEndEveningUnlock();
  saveNow();
  return state.ui.endEveningEnabled;
}

function eveningPrimaryCta() {
  const tr = state.locale === "tr";
  if (!storyFlag("practice_cup_done") && (state.save.dayIndex || 1) <= 1) {
    if (!state.save.evening?.checkin && !storyFlag("welcome_checkin_done")) {
      return { id: "sa_checkin", action: "goto-street", label: tr ? "Demliğe git" : "Go to the pot" };
    }
    if ((state.save.evening?.visits?.length || 0) < 3 && !storyFlag("welcome_met_three")) {
      return { id: "sa_visit", action: "goto-street", label: tr ? "Bir kapı çal" : "Knock a door" };
    }
    return { id: "sa_practice", action: "goto-cup", label: tr ? "Prova maçı ★" : "Practice match ★" };
  }
  if (canEndEvening()) {
    return { id: "end_evening", action: "end-evening", label: loc(state.uxPack2?.strings?.["evening.cta.end"]) || (tr ? "Akşamı bırak" : "End evening") };
  }
  return { id: "sa_visit", action: "goto-street", label: tr ? "Sokağa çık" : "Out to the street" };
}

function synergyFooterFromPicks(pickedIds = []) {
  const tags = pickedIds.map((id) => neighborById(id)?.synergyTag).filter(Boolean);
  const order = ["syn_rivalry", "syn_tea_circle", "syn_neon_night"];
  const pools = state.combatPack?.synergyTagPools || [];
  const footerSync = state.combatPack?.synergyFooterSync?.footerModel?.items;
  return order.map((sid) => {
    const pool = pools.find((p) => p.synergyId === sid);
    const def = (state.content.synergies || []).find((s) => s.id === sid);
    const item = (footerSync || []).find((i) => i.synergyId === sid);
    const tagPool = pool?.tagsThatCount || def?.tagsRequired || [];
    const min = pool?.minCount || def?.minCount || 2;
    const matched = tags.filter((t) => tagPool.includes(t)).length;
    const active = matched >= min;
    const name = loc(def?.name) || loc(item?.inactiveLabel) || sid;
    return { sid, matched, min, active, name, tagPool };
  });
}

/** story-form-2: Day2 cold-choice rewrite — WC + journal + flags (once). */
function applyDay2ColdRewrite() {
  const form = state.questPack?.storyForm2 || state.storyForm2;
  const rw = form?.day2ColdRewrites;
  if (!rw || (state.save.dayIndex || 1) < (rw.activateOnDayIndexMin || 2)) return null;
  const branch = (rw.branches || []).find((b) =>
    (b.when?.flagsAll || []).every((f) => state.save.storyFlags?.[f])
  );
  if (!branch) return null;
  state.save.storyFlags = state.save.storyFlags || {};
  const qs = Quests.ensureQuestSave(state.save);
  if (branch.worldConsequenceId && !qs.worldActive.includes(branch.worldConsequenceId)) {
    qs.worldActive.push(branch.worldConsequenceId);
  }
  if (!state.save.storyFlags[rw.applyOnceFlag]) {
    for (const f of branch.setFlagsOnApply || []) state.save.storyFlags[f] = true;
    const beat = (form.journalConsequenceBeats || []).find((j) => j.id === branch.journalBeatId);
    if (beat) {
      state.save.journalConsequenceBeats = state.save.journalConsequenceBeats || [];
      if (!state.save.journalConsequenceBeats.some((x) => x.id === beat.id)) {
        state.save.journalConsequenceBeats.unshift({
          id: beat.id,
          day: state.save.dayIndex,
          title: beat.title,
          body: beat.body,
          repTrack: beat.repTrack,
        });
        state.save.storyRecap = state.save.storyRecap || [];
        state.save.storyRecap.unshift({
          day: state.save.dayIndex,
          text: `${loc(beat.title)} — ${loc(beat.body)}`,
          kind: "consequence",
        });
      }
    }
  } else {
    // still ensure WC stays active after objective refresh
    Quests.refreshWorldConsequences(state.save, state.questPack);
  }
  return branch;
}

function day2ColdBranch() {
  return applyDay2ColdRewrite();
}

function streetPropOverlayHtml(screen = "street") {
  const overlays = state.questPack?.storyForm3?.streetPropOverlays || state.storyForm3?.streetPropOverlays || [];
  const day = state.save.dayIndex || 1;
  const hit = overlays
    .filter((o) => (o.when?.dayIndexMin || 2) <= day)
    .filter((o) => (o.screens || ["street"]).includes(screen))
    .filter((o) => (o.when?.flagsAll || []).every((f) => storyFlag(f)))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  if (!hit) return "";
  const label = loc(hit.prop?.label) || "";
  const npc = hit.npcLine ? `${loc(neighborById(hit.npcLine.speakerId)?.name) || ""}: ${loc(hit.npcLine.text)}` : "";
  return `<div class="rp-prop-overlay ${hit.prop?.cssClass || ""}" data-prop="${hit.id}">
    <span class="rp-prop-chip">${label}</span>
    ${npc ? `<p class="rp-prop-npc">${npc}</p>` : ""}
  </div>`;
}

/** mechanics-fix-3: Show me → picks + pads + unlock Start same tick. */
function applyShowMePractice() {
  const adv = state.combatPack?.lobbyAutoAdvance?.onShowMe || {};
  const teach = Combat.nextLobbyTeach(state.combatPack, state.save.storyFlags || {});
  const picks = adv.applyAutoPickFallback || teach?.autoPickFallback || ["n2", "n4", "n1"];
  state.cupPicks = picks.slice(0, state.pickCount || 3);
  state.save.storyFlags = state.save.storyFlags || {};
  for (const f of adv.setsFlags || ["practice_show_me_applied", "practice_draft_ready"]) {
    state.save.storyFlags[f] = true;
  }
  // placement from map (pad front/back → slots 0-5)
  const padToSlot = {
    p_front_left: 0, p_front_mid: 1, p_front_right: 2,
    p_back_left: 3, p_back_mid: 4, p_back_right: 5,
  };
  state.placement = Array(6).fill(null);
  if (adv.placementMap?.length) {
    for (const row of adv.placementMap) {
      const slot = padToSlot[row.padId];
      if (slot != null) state.placement[slot] = row.neighborId;
    }
  } else {
    autoPlaceSilent();
  }
  if (adv.enemyLineupFixed?.length) {
    state.enemyLineup = adv.enemyLineupFixed.map((r) => r.botId);
  } else {
    state.enemyLineup = pickEnemyLineup(state.cupPicks);
  }
  state.showMeApplied = true;
  state.practiceDraftReady = true;
  saveNow();
  return loc(adv.coachLine) || (state.locale === "tr" ? "Roster hazır — Start'a bas" : "Roster set — tap Start");
}

function autoPlaceSilent() {
  state.placement = Array(6).fill(null);
  const rank = (id) => {
    const role = (neighborById(id)?.role || "").toLowerCase();
    if (/tank|bruiser/.test(role)) return 0;
    if (/support/.test(role)) return 1;
    if (/heal/.test(role)) return 2;
    if (/burst|aoe|assassin|glass|cannon/.test(role)) return 3;
    return 2;
  };
  const front = [0, 1];
  const back = [3, 4, 2, 5];
  const ordered = [...state.cupPicks].sort((a, b) => rank(a) - rank(b));
  const frontIds = ordered.filter((id) => rank(id) <= 1).slice(0, 2);
  const backIds = ordered.filter((id) => !frontIds.includes(id));
  frontIds.forEach((id, i) => { state.placement[front[i]] = id; });
  backIds.forEach((id, i) => { state.placement[back[i] ?? 5] = id; });
  ordered.forEach((id) => {
    if (state.placement.includes(id)) return;
    const slot = state.placement.findIndex((x) => !x);
    if (slot >= 0) state.placement[slot] = id;
  });
}

function ensurePracticePlacement() {
  const filled = (state.placement || []).filter(Boolean).length;
  if (filled >= (state.cupPicks?.length || 0) && state.cupPicks?.length) return;
  if (!state.cupPicks?.length) {
    applyShowMePractice();
    return;
  }
  autoPlaceSilent();
  if (!state.enemyLineup?.length) state.enemyLineup = pickEnemyLineup(state.cupPicks);
}

function schedulePracticeLobbyAntiStall() {
  clearTimeout(state._lobbyStallTimer);
  if (!state.practiceMode) return;
  const ms = state.combatPack?.lobbyAutoAdvance?.antiStall?.detectStuckMs || 8000;
  state._lobbyStallTimer = setTimeout(() => {
    if (!state.practiceMode || state.save.evening?.cupDone) return;
    if (state.cupPicks?.length === 3 || storyFlag("practice_show_me_applied")) {
      ensurePracticePlacement();
      state.practiceDraftReady = true;
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.practice_lobby_unstuck = true;
      const toastMsg = state.combatPack?.lobbyAutoAdvance?.antiStall?.whenStuckOnLobbyWithShowMeDone?.toast;
      toast(loc(toastMsg) || (state.locale === "tr" ? "Takılma kalktı — Start açık." : "Unstuck — Start is open."));
      renderCupLobby();
    }
  }, ms);
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

function practiceCupRequired() {
  // First evenings must teach Practice Cup — not skippable until done once
  if (Density.practiceExitBlocked(state.densityPack, state.save)) return true;
  return !isCupNight() && !state.save.storyFlags?.practice_cup_done;
}

function echoBannerHtml() {
  const echo = Density.pickEcho(state.densityPack, state.save, state.questPack, "evening");
  if (!echo) return "";
  state.save.density = state.save.density || { microUsed: {}, echoShown: {} };
  state.save.density.echoShown[echo.id] = state.save.dayIndex || 1;
  return `<div class="quest-echo">
    <strong>${loc(echo.headline)}</strong>
    <p>${loc(echo.body)}</p>
    <button class="rp-btn rp-btn--ghost" type="button" data-action="goto-street">${loc(echo.cta) || (state.locale === "tr" ? "Kapı çal" : "Knock")}</button>
  </div>`;
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
  return Combat.activeFromPools(state.combatPack, tags, activeSynergyDefs());
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
  const cupRequired = isCupNight() || practiceCupRequired();
  // ux-session-2: End evening is NOT agenda/ritual — Practice flags (Day1) / always (Day2+)
  const endOk = canEndEvening();
  return {
    needVisits,
    visits: e.visits.length,
    checkin: e.checkin,
    streetEvent: e.streetEvent,
    errand: e.errand,
    secondBeat: !!e.secondBeat,
    cupRequired,
    cupDone: e.cupDone,
    complete: endOk,
    endEveningEnabled: endOk,
  };
}

function currencyName(id) {
  return shopStr(`shop.currency.${id === "porch_coins" ? "coins" : id === "neon_thread" ? "thread" : "tokens"}`);
}

function unfinishedQuestHeadline() {
  Quests.ensureQuestSave(state.save);
  const actives = Quests.activeQuests(state.questPack, state.save);
  if (!actives.length) {
    const avail = Quests.availableQuests(state.questPack, state.save)[0];
    if (avail) {
      return state.locale === "tr"
        ? `Bekleyen görev: ${loc(avail.title)}`
        : `Waiting quest: ${loc(avail.title)}`;
    }
    return null;
  }
  const main = actives.find((q) => q.type === "main") || actives[0];
  const e = state.save.quests.entries[main.id];
  const next = (main.objectives || []).find((o) => !Quests.objectiveDone(e, o));
  const nextLabel = next ? loc(next.label) : (state.locale === "tr" ? "ödülü topla" : "claim reward");
  const title = loc(main.title);
  if (!nextLabel || nextLabel === title) {
    return state.locale === "tr" ? `Yarım: ${title}` : `Unfinished: ${title}`;
  }
  return state.locale === "tr"
    ? `${title} — sırada: ${nextLabel}`
    : `${title} — next: ${nextLabel}`;
}


function uxStr(key, fallback) {
  const s = state.uxPack?.strings?.[key];
  if (s) return loc(s);
  return fallback;
}

function firstEveningBeats() {
  const beats = state.uxPack?.firstEvening?.beats || [];
  const flags = state.save.storyFlags || {};
  const out = [];
  for (const b of beats) {
    let done = false;
    if (b.flagDone) done = !!flags[b.flagDone];
    if (b.alsoEvening === "checkin" && state.save.evening?.checkin) done = true;
    if (b.flagsAll?.length) done = b.flagsAll.every((f) => flags[f]);
    if (b.questReady && state.questPack) {
      const e = state.save.quests?.entries?.[b.questReady];
      const q = Quests.questDef(state.questPack, b.questReady);
      if (e && (e.status === "done" || e.status === "completed")) done = true;
      else if (e && q && Quests.questReadyToComplete(q, e)) done = false; // show claim beat
      else done = true; // hide until claimable
    }
    if (!done) out.push(b);
  }
  return out.slice(0, 3);
}

function questHudWhisper() {
  const tr = state.locale === "tr";
  const flags = state.save.storyFlags || {};
  const beats = state.uxPack?.firstEvening?.beats || [];
  const byId = Object.fromEntries(beats.map((b) => [b.id, b]));
  // claimable main?
  if (state.questPack) {
    const actives = Quests.activeQuests(state.questPack, state.save);
    for (const q of actives.filter((x) => x.type === "main")) {
      const e = state.save.quests.entries[q.id];
      if (Quests.questReadyToComplete(q, e) && byId.fe_claim) return loc(byId.fe_claim.whisper);
    }
  }
  if (state.save.dayIndex <= 1 && !flags.practice_cup_done && byId.fe_prova) return loc(byId.fe_prova.whisper);
  for (const id of ["fe_steam", "fe_doors", "fe_kite", "fe_claim"]) {
    const b = byId[id];
    if (!b) continue;
    if (b.flagDone && flags[b.flagDone]) continue;
    if (b.alsoEvening === "checkin" && state.save.evening?.checkin) continue;
    if (b.flagsAll?.every((f) => flags[f])) continue;
    return loc(b.whisper);
  }
  const echo = Density.pickEcho(state.densityPack, state.save, state.questPack, "evening");
  if (echo && (echo.priority || 0) >= 85) return loc(echo.headline);
  return loc(state.uxPack?.questHud?.fallback) || (tr ? "Sokak nefes alıyor" : "The street is breathing");
}

function objectivePlayerLabel(obj) {
  const map = state.uxPack?.objectiveLabels || {};
  if (map[obj.id]) return loc(map[obj.id]);
  let label = loc(obj.label);
  // strip systems jargon
  label = label.replace(/affinity\s*≥\s*\d+/gi, "").replace(/win optional/gi, "").replace(/\s{2,}/g, " ").trim();
  return label || loc(obj.label);
}


function flagsMatchWhen(when = {}, save = {}) {
  const flags = save.storyFlags || {};
  if (when.flagsAll?.some((f) => !flags[f])) return false;
  if (when.flagsNone?.some((f) => flags[f])) return false;
  if (when.flagsAny?.length && !when.flagsAny.some((f) => flags[f])) return false;
  return true;
}

function pickReactiveDialogue(slot = "evening") {
  const schedules = state.stories?.dialogueSchedules || [];
  const ranked = schedules
    .filter((s) => (!s.slot || s.slot === slot) && flagsMatchWhen(s.when, state.save))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const top = ranked[0];
  if (!top) return null;
  const id = top.dialogueTreeId || top.dialogueId || top.treeId;
  const trees = state.stories?.dialogueTrees;
  if (Array.isArray(trees)) return trees.find((t) => t.id === id) || null;
  return trees?.[id] || null;
}

function reactiveDialogueBannerHtml() {
  // Prefer density echo ≥85 over reactive offer
  const echo = Density.pickEcho(state.densityPack, state.save, state.questPack, "evening");
  if (echo && (echo.priority || 0) >= 85) return "";
  const tree = pickReactiveDialogue("evening");
  if (!tree) return "";
  const root = (tree.nodes || []).find((n) => n.id === (tree.start || "root")) || (tree.nodes || [])[0];
  const line = loc(root?.text) || loc(tree.title) || tree.id;
  return `<div class="quest-echo react-echo">
    <strong>${state.locale === "tr" ? "Sokak hatırlıyor" : "The street remembers"}</strong>
    <p>${line}</p>
    <button class="rp-btn rp-btn--ghost" type="button" data-action="open-reactive-dlg" data-id="${tree.id}">${state.locale === "tr" ? "Dinle" : "Listen"}</button>
  </div>`;
}

function hudHtml() {
  const s = state.save;
  const dayLine = fillTemplate(t("day.label"), { day: s.dayIndex, week: weekNumber() });
  const qLine = unfinishedQuestHeadline();
  return `
    <div class="meta-hud">
      <div class="meta-day">${dayLine}</div>
      <div class="meta-currencies">
        <span title="${currencyName("porch_coins")}">🪙 ${s.currencies.porch_coins||0} <em>${currencyName("porch_coins")}</em></span>
        <span title="${currencyName("neon_thread")}">🧵 ${s.currencies.neon_thread||0} <em>${currencyName("neon_thread")}</em></span>
        <span title="${currencyName("clay_tokens")}">🧱 ${s.currencies.clay_tokens||0} <em>${currencyName("clay_tokens")}</em></span>
      </div>
      <button class="hud-quest" type="button" data-action="open-quests" title="${questHudWhisper()}">
        <span class="hud-quest-label">${state.locale === "tr" ? "GÖREV" : "QUEST"}</span>
        <span class="hud-quest-next">${questHudWhisper()}</span>
      </button>
    </div>`;
}

function synergyCoachHtml(pickedIds = []) {
  const tr = state.locale === "tr";
  const tags = pickedIds.map((id) => neighborById(id)?.synergyTag).filter(Boolean);
  const active = activeSynergies(tags);
  // Teach order: Rivalry → Tea → Neon (combat juice pack)
  const order = ["syn_rivalry", "syn_tea_circle", "syn_neon_night"];
  const defs = order
    .map((id) => (state.content.synergies || []).find((s) => s.id === id))
    .filter(Boolean);
  const seen = state.save.storyFlags || {};
  const nextTeach =
    defs.find((s) => !seen[`syn_taught_${s.id}`]) || defs[0];
  const tipFor = (s) => {
    const examples = unlockedNeighbors()
      .filter((n) => s.tagsRequired.includes(n.synergyTag))
      .slice(0, 3)
      .map((n) => loc(n.name))
      .join(" · ");
    const on = active.some((a) => a.id === s.id);
    const focus = nextTeach?.id === s.id && !on;
    return `<div class="syn-coach-card ${on ? "on" : ""} ${focus ? "focus" : ""}">
      <div class="syn-coach-title">${on ? "✓ " : focus ? "★ " : ""}${loc(s.name)} <span class="chip ${s.tagsRequired[0].toLowerCase()}">${s.tagsRequired.join("+")}</span></div>
      <p>${loc(s.rules?.description)}</p>
      <p class="muted">${tr ? "Örnek:" : "Try:"} ${examples || "—"}</p>
    </div>`;
  };
  const head = nextTeach
    ? tr
      ? `Önce bunu kur: ${loc(nextTeach.name)}`
      : `Form this first: ${loc(nextTeach.name)}`
    : tr
      ? "Tea heal · Rivalry düşük HP hasarı · Neon açılış dodge"
      : "Tea heals · Rivalry low-HP damage · Neon opening dodge";
  return `<div class="syn-coach">
    <h3 class="section-label">${tr ? "Sinerji okulu" : "Synergy school"}</h3>
    <p class="muted">${head}</p>
    <div class="syn-coach-grid">${defs.map(tipFor).join("")}</div>
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

function stageLayer(kind = "street", dim = false) {
  const primary = kind === "arena" ? ART.arenaStage : ART.streetHero;
  const fallback = kind === "arena" ? ART.arenaStageFallback : ART.streetHeroFallback;
  return `<div class="rp-stage" data-stage="${kind}" data-wave="3" ${dim ? 'data-dim="night"' : ""} aria-hidden="true">
    <img class="rp-stage__img" src="${primary}" alt="" decoding="async" onerror="this.onerror=null;this.src='${fallback}'" />
    <div class="rp-stage__vignette"></div>
  </div>`;
}

function goldBust(id) {
  return ART.busts[id] || ART.goldBusts?.[id] || bust(id);
}

function porchCallProp(opt) {
  const id = opt?.id || "";
  if (id.includes("tea") || id.includes("oven")) return ART.props.demlik;
  if (id.includes("whistle")) return ART.props.duduk;
  if (id.includes("neon")) return ART.props.kulaklik;
  if (id.includes("chaos") || id.includes("kite")) return ART.props.ucurtma;
  if (id.includes("fence") || id.includes("hold")) return ART.props.gazete;
  if (id.includes("cheer")) return ART.props.tepsi;
  return ART.props.duduk;
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
                const ok = have >= need || Quests.objectiveDone(e, o);
                const frac = need > 1 ? ` <span class="agenda-hint">${have}/${need} ${state.locale === "tr" ? "kapı" : "doors"}</span>` : "";
                return `<li class="${ok ? "done" : ""}">${ok ? "✓" : "○"} ${objectivePlayerLabel(o)}${ok ? "" : frac}</li>`;
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
  screen.style.backgroundImage = "";
  const hasSave = state.save.dayIndex > 1 || state.save.evening.checkin || state.save.cupHistory.length;
  const stake = state.locale === "tr"
    ? "Bu akşam: üç kapı, bir seçim, bir sahne."
    : "Tonight: three doors, one choice, one stage.";
  screen.innerHTML = `
    ${stageLayer("street")}
    <div class="rp-title-stack">
      <button class="rp-chip rp-lang" type="button" data-action="toggle-lang" aria-label="Language">EN | TR · ${state.locale.toUpperCase()}</button>
      <h1 class="rp-brand">${t("app.title")}</h1>
      <p class="rp-lede">${stake}</p>
    </div>
    <footer class="rp-dock rp-dock--title">
      ${hasSave ? `<button class="rp-btn rp-btn--primary" type="button" data-action="continue-save">${t("common.continue_save")} — ${fillTemplate(t("day.label"), { day: state.save.dayIndex, week: weekNumber() })}</button>` : ""}
      <button class="rp-btn rp-btn--primary" type="button" data-action="new-game">${hasSave ? t("common.new_game") : t("boot.tap_to_start")}</button>
      <button class="rp-btn rp-btn--ghost" type="button" data-action="open-shop">${t("shop.title")}</button>
    </footer>`;
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
  const qHead = unfinishedQuestHeadline();
  if (qHead && d >= 2) {
    return {
      tr: map[d]?.tr ? `${map[d].tr.split(" — ")[0]} — ${qHead}` : qHead,
      en: map[d]?.en ? `${map[d].en.split(" — ")[0]} — ${qHead}` : qHead,
    };
  }
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
  unlockAudio();
  playKnock();
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
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.first_evening_cup_available = true;
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
  const teaser = Density.pickOvernightTeaser(state.densityPack, state.save, state.questPack);
  const echo = Density.pickEcho(state.densityPack, state.save, state.questPack, "overnight_wake");
  const whisper = questHudWhisper();
  const teaserLines = (teaser?.lines || []).map((l) => loc(l)).filter(Boolean);
  const bitsSrc = [
    ...teaserLines.slice(0, 2),
    ...(payoff?.lines || []).slice(0, 1),
    echo ? loc(echo.body) : null,
  ]
    .filter(Boolean)
    .slice(0, 3);
  const bits = bitsSrc.map((l) => `<li>${l}</li>`).join("") || `<li>${tr ? "Mahalle uyudu." : "The block slept."}</li>`;
  const tomorrow = teaser ? loc(teaser.title) : loc(dayHeadline());
  const hook = teaser ? loc(teaser.tomorrowHook) : payoff?.tease || "";
  const primaryLabel = tr ? `Yarım kalan: ${whisper}` : `Still open: ${whisper}`;
  const primaryCta = whisper.includes("ödül") || whisper.toLowerCase().includes("reward") || whisper.toLowerCase().includes("tray")
    ? "open-quests"
    : "overnight-open-quest";
  screen.innerHTML = `
    ${stageLayer("street", true)}
    <div class="rp-overnight">
      <p class="rp-kicker">${tr ? "Gece geçti" : "Night passed"}</p>
      <h2 class="rp-night-title">${tomorrow}</h2>
      <p class="overnight-quest-pull">◎ ${tr ? "Yarım kalan" : "Still open"}: ${whisper}</p>
      <ul class="rp-ticks">${bits}</ul>
      <p class="evening-cup-tease">${hook}</p>
      <button class="rp-btn rp-btn--primary" type="button" data-action="${primaryCta}">${primaryLabel}</button>
      <button class="rp-btn rp-btn--ghost" type="button" data-action="goto-evening">${tr ? "Yeni akşama gir" : "Enter the new evening"}</button>
    </div>`;
  showScreen("screen-overnight");
}


function renderEvening() {
  syncEndEveningUnlock();
  const st = eveningStats();
  const screen = document.getElementById("screen-evening");
  const week = Story.weekDef(state.stories, state.save.dayIndex);
  Quests.ensureQuestSave(state.save);
  Quests.autoOfferArcQuests(state.questPack, state.save);
  Quests.syncQuestProgressFromWorld(state.save, state.questPack);
  const day2Branch = applyDay2ColdRewrite();
  if (day2Branch) saveNow();
  const mainAgenda = Quests.mainQuestAgenda(state.questPack, state.save, state.locale);

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
  // story-form-2: prefer cold-path eveningBanner / eveningHook over generic carry
  if (day2Branch?.eveningBanner) hook = day2Branch.eveningBanner;
  else if (day2Branch?.eveningHook) hook = day2Branch.eveningHook;

  const nightOne = state.save.dayIndex <= 1;
  const adventureBeats = nightOne ? firstEveningBeats() : [];
  const mainTitle = mainAgenda?.title || (state.locale === "tr" ? "Akşam omurgası" : "Evening spine");
  const beatMax = state.uxPack?.firstEvening?.beats?.length || 4;
  const beatDone = beatMax - (adventureBeats.length || 0);
  const mainDone = nightOne
    ? Math.max(0, beatDone)
    : mainAgenda
      ? mainAgenda.objectives.filter((o) => o.done).length
      : 0;
  const mainTotal = nightOne ? beatMax : mainAgenda ? mainAgenda.objectives.length : 1;
  const faceId = mainAgenda?.quest?.neighbors?.[0] || unlockedNeighbors()[0]?.id || "n1";
  const nextBeat = adventureBeats[0];
  const support = !nightOne
    ? loc(hook)
    : nextBeat
      ? loc(nextBeat.line)
      : uxStr(
          "evening.nightOne.support",
          state.locale === "tr"
            ? "Üç kapı hâlâ nefes alıyor. Cumartesi Kupası dinliyor."
            : "Three doors still breathe. Saturday Cup is listening."
        );

  const cta = eveningPrimaryCta();
  const endEnabled = !!st.endEveningEnabled;
  const endLabel =
    loc(state.uxPack2?.strings?.["evening.cta.end"]) ||
    (state.locale === "tr" ? "Akşamı bırak" : "End evening");
  const lockedCopy = loc(state.uxPack2?.strings?.["gate.end_evening.practice"]) ||
    uxStr(
      "evening.locked",
      state.locale === "tr" ? "Akşam bitmez — Cem Prova'da düdük çalıyor." : "Evening won't end — Cem's still whistling Practice."
    );

  screen.innerHTML = `
    ${stageLayer("street")}
    ${hudHtml()}
    ${streetPropOverlayHtml("evening")}
    <div class="rp-mid rp-evening-card">
      <p class="rp-kicker">${state.locale === "tr" ? "Ana" : "Main"} · ${mainTitle}</p>
      <h2 class="rp-night-title">${loc(dayHeadline())}</h2>
      <div class="rp-progress">
        <img src="${goldBust(faceId)}" alt="" width="40" height="40" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
        <div class="rp-progress__bar" aria-valuenow="${mainDone}" aria-valuemax="${mainTotal}"><i style="width:${Math.round((mainDone / Math.max(1, mainTotal)) * 100)}%"></i></div>
        <span>${fillTemplate(uxStr("evening.progress.beats", state.locale === "tr" ? "Vuruş {n}/{max}" : "Beats {n}/{max}"), { n: mainDone, max: mainTotal })}</span>
      </div>
      <p class="rp-mid__line">${support}</p>
      ${echoBannerHtml()}
      ${
        mainAgenda?.ready
          ? `<button class="rp-btn rp-btn--primary" type="button" data-action="quest-complete" data-id="${mainAgenda.quest.id}">${state.locale === "tr" ? "Tepsideki ödülü aç" : "Open the tray reward"}</button>`
          : ""
      }
    </div>
    <footer class="rp-dock">
      <button class="rp-btn rp-btn--primary" type="button" data-action="${cta.action}">${cta.label}</button>
      <button class="rp-btn" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
      <button class="rp-btn ${st.cupRequired && !st.cupDone ? "rp-btn--ember" : ""}" type="button" data-action="goto-cup">${isCupNight() ? t("cup.season_night") : t("cup.practice")}${st.cupRequired && !st.cupDone ? " ★" : ""}</button>
    </footer>
    <div class="rp-dock-extra">
      <button class="rp-btn rp-btn--ghost" type="button" data-action="open-shop">${t("shop.title")}</button>
      <button class="rp-btn rp-btn--ghost" type="button" data-action="open-story-log">${state.locale === "tr" ? "Hikâye" : "Journal"}</button>
      <button class="rp-btn rp-btn--ghost" type="button" data-action="end-evening" ${endEnabled ? "" : "disabled"} data-end-enabled="${endEnabled ? "1" : "0"}">${endLabel}</button>
    </div>
    ${endEnabled ? "" : `<p class="street-hint">${lockedCopy}</p>`}
  `;
}

function renderStreet() {
  const screen = document.getElementById("screen-street");
  // visual-fix-2 wave3 L-block hotspots
  const HOT = {
    n1: [18, 42],
    n2: [32, 40],
    n3: [46, 39],
    n4: [58, 40],
    n5: [70, 39],
    n6: [82, 41],
  };
  // Always show ≥4 bust hotspots (visual-fix-3); prefer unlocked, pad with roster
  const roster = unlockedNeighbors().length
    ? unlockedNeighbors()
    : allNeighbors().filter((n) => ["n1", "n2", "n3", "n4", "n5", "n6"].includes(n.id));
  const spots = roster.slice(0, 6).map((n) => {
    const done = state.save.evening.visits.includes(n.id);
    const avail = !done;
    const xy = HOT[n.id] || [50, 48];
    return `<button class="rp-hotspot ${done ? "visited" : ""} ${avail ? "is-available" : ""}" style="--x:${xy[0]}%;--y:${xy[1]}%" type="button" data-action="open-neighbor" data-id="${n.id}" aria-label="${loc(n.name)}">
        <img class="rp-hotspot__bust" src="${goldBust(n.id)}" alt="" width="56" height="56" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
        <span class="rp-hotspot__glow" aria-hidden="true"></span>
        <span class="rp-hotspot__name">${loc(n.name)}${done ? " ✓" : ""}</span>
      </button>`;
  }).join("");

  applyDay2ColdRewrite();
  const spine = unfinishedQuestHeadline();
  const worldBits = worldStreetLines();
  const needCheckin = !state.save.evening.checkin;
  const checkinLabel = state.locale === "tr" ? "Demlik" : "Check-in";
  const npcWhisper = (() => {
    const b = day2ColdBranch();
    return b?.streetNpcLine
      ? `${loc(neighborById(b.streetNpcLine.speakerId)?.name) || ""}: ${loc(b.streetNpcLine.text)}`
      : "";
  })();

  screen.innerHTML = `
    ${stageLayer("street")}
    ${hudHtml()}
    ${streetPropOverlayHtml("street")}
    <button class="rp-chip rp-back" type="button" data-action="goto-evening">${t("common.back")}</button>
    <div class="rp-hotspots" role="list">${spots}</div>
    ${worldBits.length ? `<div class="world-banner street-float rp-wc-loud">${worldBits.map((l) => `<span>◈ ${l}</span>`).join("")}</div>` : ""}
    ${npcWhisper ? `<div class="rp-npc-remember"><span>${npcWhisper}</span></div>` : ""}
    ${spine ? `<div class="rp-whisper"><span>◎ ${spine}</span></div>` : ""}
    <footer class="rp-dock">
      <button class="rp-btn rp-btn--primary" type="button" data-action="checkin" ${needCheckin ? "" : "disabled"}>${needCheckin ? checkinLabel : t("street.porch_checkin")}</button>
      <button class="rp-btn" type="button" data-action="street-event" ${state.save.evening.streetEvent ? "disabled" : ""}>${t("street.event")}</button>
      <button class="rp-btn" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
      ${!storyFlag("practice_cup_done") ? `<button class="rp-btn" type="button" data-action="goto-cup">${state.locale === "tr" ? "Prova ★" : "Practice ★"}</button>` : ""}
    </footer>`;
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
      <div class="bust-frame frame-${state.save.equipped?.comic_frame || "frame_chalk_grid"}"><img src="${bust(id)}" alt="${loc(n.name)}" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" /></div>
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
        <div class="bust-frame"><img src="${bust(sid)}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" /></div>
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
      <div class="bust-frame"><img src="${bust(sid)}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" /></div>
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
  // ux-session-2: stay on street after visit — no agenda bounce
  const visits = state.save.evening.visits.length;
  const visitToast = state.uxPack2?.stageActions?.toasts?.visit;
  if (ctx?.neighborId && visitToast) {
    toast(fillTemplate(loc(visitToast), { n: Math.min(3, visits) }));
  } else {
    toast(feedbackLog?.length ? feedbackLog[feedbackLog.length - 1] : t("story.done"));
  }
  if (ctx?.neighborId) {
    renderStreet();
    showScreen("screen-street");
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
  playTeapotClink();
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
  } else {
    const ck = state.uxPack2?.stageActions?.toasts?.checkin;
    toast(ck ? loc(ck) : t("street.mood_tea"));
  }
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.welcome_checkin_done = true;
  emitQuestEvent({ type: "checkin" });
  saveNow();
  renderStreet();
  showScreen("screen-street");
}

function openStreetEvent() {
  if (state.save.evening.streetEvent) return;
  // Prefer density micro-event; fall back to story daily pool
  const micro = Density.pickMicroEvent(state.densityPack, state.save, "street");
  const ev = Density.microToStreetEvent(micro) || Story.pickDailyEvent(state.stories, state.save);
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
  let summary = null;
  if (ev?._micro) {
    // Apply micro-event payload directly
    for (const row of choice?.affinity || []) bumpAffinity(row.id, (row.delta || 0) * 2);
    if (choice?.rep) Story.bumpRep(state.save, choice.rep);
    for (const f of choice?.setFlags || []) {
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags[f] = true;
    }
    if (choice?.neighborId && choice?.affinityDelta) bumpAffinity(choice.neighborId, choice.affinityDelta * 2);
    Density.markMicroUsed(state.save, ev.id);
    summary = { flags: choice?.setFlags || [] };
  } else {
    summary = Story.applyChoicePayload(state.save, state.stories, choice, null);
    if (choice?.traitDeltas) {
      const nid = (ev.tags || []).includes("neon") ? "n5" : "n1";
      ensureNeighborState(nid);
      for (const [k, v] of Object.entries(choice.traitDeltas)) {
        state.save.traits[nid][k] = (state.save.traits[nid][k] || 0) + v;
      }
    }
    if (!state.save.seenDailyEvents.includes(ev.id)) state.save.seenDailyEvents.push(ev.id);
  }
  state.save.evening.streetEvent = true;
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
  const fb = Story.formatChoiceSummary
    ? Story.formatChoiceSummary(summary, state.locale, (nid) => loc(neighborById(nid)?.name))
    : "";
  const screen = document.getElementById("screen-event");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${loc(ev.title) || t("street.event")}</h2></div>
    <div class="dialog-box">
      <p class="prompt">${loc(choice.label)}</p>
      ${fb ? `<p class="choice-feedback">${fb}</p>` : ""}
      <p class="muted">${state.locale === "tr" ? "Sokak bunu hatırlayacak." : "The street will remember that."}</p>
      <div class="choice-stack">
        <button class="btn btn-primary" type="button" data-action="goto-street">${t("common.continue")}</button>
      </div>
    </div>`;
  const evToast = state.uxPack2?.stageActions?.toasts?.event;
  toast(evToast ? loc(evToast) : fb || loc(choice.label));
  showScreen("screen-event");
}

function endEvening() {
  syncEndEveningUnlock();
  if (!canEndEvening()) {
    const teach = Density.practiceTeach(state.densityPack);
    toast(
      loc(state.uxPack2?.strings?.["gate.end_evening.practice"]) ||
        loc(state.uxPack?.skipGates?.endEveningPractice) ||
        loc(teach?.ui?.endEvening?.blockedCopy) ||
        uxStr("evening.locked", state.locale === "tr" ? "Akşam bitmez — Cem Prova'da düdük çalıyor." : "Evening won't end — Cem's still whistling Practice.")
    );
    if (practiceCupRequired() && !state.save.evening.cupDone) {
      renderCupLobby();
      showScreen("screen-cup");
    }
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

  Quests.ensureQuestSave(state.save);
  const openQs = Quests.activeQuests(state.questPack, state.save);
  for (const q of openQs.slice(0, 3)) {
    const e = state.save.quests.entries[q.id];
    const next = (q.objectives || []).find((o) => !Quests.objectiveDone(e, o));
    const nextLabel = next ? loc(next.label) : loc(q.title);
    lines.push(
      tr
        ? `Yarım kalan: ${loc(q.title)} — sırada ${nextLabel}`
        : `Unfinished: ${loc(q.title)} — still need ${nextLabel}`
    );
  }
  if (!openQs.length) {
    const waiting = Quests.availableQuests(state.questPack, state.save)[0];
    if (waiting) {
      lines.push(
        tr
          ? `Kapıda bekleyen görev: ${loc(waiting.title)}`
          : `A quest waits at the door: ${loc(waiting.title)}`
      );
    }
  }

  state.save.dayIndex += 1;
  state.save.weekNumber = weekNumber();
  state.save.dailyEarn = { talkCoins: 0, dramaThread: false, shareClaimed: false };
  state.save.evening = {
    checkin: false,
    visits: [],
    streetEvent: false,
    errand: false,
    secondBeat: false,
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
  const spine = (state.questPack?.journalSpine || []).map((step) => {
    const done = !!(state.save.storyFlags?.[step.completeFlag] || state.save.quests?.entries?.[step.questId]?.status === "done" || state.save.quests?.entries?.[step.questId]?.status === "completed");
    const active = Quests.isAccepted?.(state.save, step.questId) || state.save.quests?.entries?.[step.questId]?.status === "active";
    return `<button class="spine-chip ${done ? "done" : active ? "active" : ""}" type="button" data-action="open-quests">${done ? "✓ " : ""}${loc(step.label)}</button>`;
  }).join("");
  applyDay2ColdRewrite();
  const day = state.save.dayIndex || 1;
  const dramaCards = (state.questPack?.storyForm3?.journalDramaCards || [])
    .filter((c) => (c.when?.dayIndexMin || 2) <= day)
    .filter((c) => (c.when?.flagsAny || []).some((f) => storyFlag(f)) || (c.when?.flagsAll || []).every((f) => storyFlag(f)))
    .map(
      (c) => `<article class="journal-drama ${c.tone || ""}">
        <p class="rp-kicker">${loc(c.eyebrow)}</p>
        <h3>${loc(c.title)}</h3>
        <p>${loc(c.body)}</p>
        <button class="btn btn-teal" type="button" data-action="goto-street">${loc(c.cta) || (tr ? "Sokağa bak" : "See the street")}</button>
      </article>`
    )
    .join("");
  const consequenceBits = (state.save.journalConsequenceBeats || [])
    .map((b) => `<li><strong>${loc(b.title)}</strong> — ${loc(b.body)}</li>`)
    .join("");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="art-hero journal-hero" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}">
      <div class="art-hero-scrim">
        <div class="topbar"><h2>${state.locale === "tr" ? "Hikâye defteri" : "Story journal"}</h2>
          <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
        </div>
        <p class="evening-cup-tease">${state.locale === "tr" ? "ANA GÖREV omurgası · ark izleri" : "MAIN QUEST spine · arc marks"}</p>
        <div class="spine-strip">${spine || ""}</div>
      </div>
    </div>
    ${dramaCards ? `<h3 class="section-label">${tr ? "Yankı" : "Aftermath"}</h3><div class="journal-drama-list">${dramaCards}</div>` : ""}
    ${consequenceBits ? `<h3 class="section-label">${tr ? "Yankı / Sonuç" : "Consequence"}</h3><ul class="agenda-list">${consequenceBits}</ul>` : ""}
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
  state.practiceMode = !isCupNight() && !(state.save.storyFlags?.practice_cup_done);
  const teach = Combat.nextLobbyTeach(state.combatPack, state.save.storyFlags || {});
  const spotlight = new Set(teach?.spotlightNeighborIds || []);
  const cards = list
    .map((n) => {
      const selected = state.cupPicks.includes(n.id);
      const src = goldBust(n.id);
      const tag = n.synergyTag || "";
      const dim = spotlight.size && !spotlight.has(n.id) && !selected;
      return `<button class="pick-card ${selected ? "selected" : ""} ${spotlight.has(n.id) ? "spotlight" : ""} ${dim ? "dimmed" : ""}" type="button" data-action="toggle-pick" data-id="${n.id}">
        <img src="${src}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
        <div class="name">${loc(n.name)}</div>
        <div class="muted pick-meta">${n.role} · <span class="chip ${String(tag).toLowerCase()}">${tag}</span></div>
      </button>`;
    })
    .join("");
  const tags = state.cupPicks.map((id) => neighborById(id).synergyTag);
  const syns = activeSynergies(tags);
  const footerRows = synergyFooterFromPicks(state.cupPicks);
  const footerActiveIds = footerRows.filter((r) => r.active).map((r) => r.sid).sort().join(",");
  const liveActiveIds = syns.map((s) => s.id).sort().join(",");
  const footerDesync = footerActiveIds !== liveActiveIds;
  if (footerDesync) {
    // mechanics-fix-3: never soft-lock Start behind desync — same-tick recover
    console.warn("synergy_footer_desync_recovered", { footerActiveIds, liveActiveIds });
  }
  const rivalryOn = syns.some((s) => s.id === "syn_rivalry") || footerRows.some((r) => r.sid === "syn_rivalry" && r.active);
  const showMeDone = !!state.showMeApplied || storyFlag("practice_show_me_applied");
  const teachSynOk =
    showMeDone ||
    rivalryOn ||
    !teach?.requireSynergyToReady ||
    !teach?.synergyId ||
    syns.some((s) => s.id === teach.synergyId) ||
    state.save.storyFlags?.[`syn_taught_${teach.synergyId}`];
  // fix-3: 3 picks + (Show me OR Rivalry) — footer desync does NOT block
  const ready = state.cupPicks.length === state.pickCount && teachSynOk;
  if (ready && state.practiceMode) {
    ensurePracticePlacement();
    state.practiceDraftReady = true;
  }
  schedulePracticeLobbyAntiStall();
  const pillMeta = state.combatPack?.synergyTeach?.synergyPillMeta || [];
  const synDesc = (s) => {
    const meta = pillMeta.find((m) => m.synergyId === s.id);
    if (meta && state.combatPack?.synergyTeach?.lobbyPillTemplate) {
      return fillTemplate(loc(state.combatPack.synergyTeach.lobbyPillTemplate), {
        name: loc(s.name),
        tags: (meta.tagPoolDisplay || s.tagsRequired || []).join("/"),
        ruleOneLiner: loc(meta.ruleOneLiner),
        firesWhen: loc(meta.firesWhen),
      });
    }
    return loc(s.rules?.description) || loc(s.name);
  };
  // mechanics-fix-2: footer shows matched/min for ALL synergies from draft picks
  const preview = footerRows
    .map((r) => {
      const chipClass = String(r.tagPool[0] || "").toLowerCase();
      return `<span class="chip ${chipClass} ${r.active ? "on" : "off"}" title="${r.name}">${r.name} ${r.matched}/${r.min}</span>`;
    })
    .join("");
  const startLabels = state.combatPack?.startEnabledRules?.labels || {};
  const synHint = rivalryOn || showMeDone
    ? (loc(state.combatPack?.lobbyAutoAdvance?.onShowMe?.coachLine) ||
      (state.locale === "tr" ? "Roster hazır — Start'a bas, Rekabeti dövüşte gör." : "Roster set — tap Start, see Rivalry in the fight."))
    : syns.length
      ? syns.map(synDesc).join(" · ")
      : state.locale === "tr"
        ? "Aynı etiketlerden 2+ seç → sinerji"
        : "Pick 2+ matching tags → synergy";
  const startLabel = ready
    ? loc(startLabels.enabled) || (state.locale === "tr" ? "Start — arena" : "Start — arena")
    : state.cupPicks.length < state.pickCount
      ? loc(startLabels.disabledNeedPicks) || t("cup.start")
      : loc(startLabels.disabledNeedSynergy) || t("cup.start");
  // Practice: Start skips draft when auto-placed (Show me / Rivalry)
  const startAction =
    state.practiceMode && ready && (state.placement || []).filter(Boolean).length >= state.cupPicks.length
      ? "start-fight"
      : "goto-draft";
  const teachBlock = teach
    ? `<div class="syn-teach">
        <p>${loc(teach.lines)}</p>
        <div class="btn-row">
          <button class="btn btn-teal" type="button" data-action="syn-show-me" data-id="${teach.synergyId}">${loc(teach.showMeLabel)}</button>
        </div>
      </div>`
    : "";

  const cupWorld = worldCupLines();
  const prac = state.practiceMode ? Combat.practiceSetup(state.combatPack) : null;
  screen.innerHTML = `
    ${stageLayer("arena")}
    ${hudHtml()}
    <div class="rp-mid cup-mid">
      <div class="topbar"><h2>${prac ? loc(prac.title) : t("cup.lobby_title")}</h2>
        <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
      </div>
      <p class="street-hint">${fillTemplate(t("cup.week"), { week: weekNumber(), mult: state.botMult.toFixed(2) })} · ${isCupNight() ? t("cup.season_night") : t("cup.practice")}</p>
      ${cupWorld.length ? `<p class="world-consequence">${cupWorld.map((l) => `◈ ${l}`).join(" · ")}</p>` : ""}
      <p class="evening-cup-tease">${fillTemplate(t("cup.picks"), { n: state.pickCount })} · ${synHint}</p>
      ${teachBlock}
    </div>
    <div class="pick-grid pick-grid-dense">${cards}</div>
    <div class="synergy-pills" style="justify-content:center">${preview}</div>
    <p class="pick-status">${state.cupPicks.length}/${state.pickCount}${teach && !teachSynOk ? (state.locale === "tr" ? " · sinerji kur" : " · form synergy") : ""}</p>
    ${synergyCoachHtml(state.cupPicks)}
    <div class="btn-row">
      <button class="btn btn-primary ${ready ? "rp-cta-pulse" : ""}" type="button" data-action="${startAction}" ${ready ? "" : "disabled"} data-ready="${ready ? "1" : "0"}">${startLabel}</button>
      ${
        state.practiceMode && ready
          ? `<button class="btn btn-secondary" type="button" data-action="goto-draft">${state.locale === "tr" ? "Yerleri düzenle" : "Adjust pads"}</button>`
          : ""
      }
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
      const src = pid ? goldBust(pid) : "";
      const filled = pid
        ? `<img src="${src}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />`
        : `<span class="cell-lane">${lane}</span>`;
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
      const mid = unit.mirrorOf;
      const src = goldBust(mid);
      return `<div class="cell enemy filled ${idx < 3 ? "lane-front" : "lane-back"}"><img src="${src}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" /></div>`;
    })
    .join("");
  const bench = state.cupPicks
    .map((id) => {
      const placed = state.placement.includes(id);
      const role = neighborById(id)?.role || "";
      const tag = neighborById(id)?.synergyTag || "";
      const src = goldBust(id);
      return `<button class="bench-unit ${placed ? "placed" : ""} ${state.selectedBench === id ? "selected" : ""}" type="button" data-action="select-bench" data-id="${id}" ${placed ? "disabled" : ""}>
        <img src="${src}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" /><span class="bench-role">${role} · ${tag}</span></button>`;
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
  const liveSyn = activeSynergies(state.cupPicks.map((id) => neighborById(id)?.synergyTag).filter(Boolean));
  const liveSynLine = liveSyn.length
    ? liveSyn.map((s) => loc(s.name)).join(" · ")
    : tr
      ? "Sinerji yok — Tea/Rivalry/Neon etiketlerini eşleştir"
      : "No synergy — match Tea / Rivalry / Neon tags";
  screen.innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("draft.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-cup">${t("common.back")}</button>
    </div>
    <p class="street-hint">${t("draft.hint")} · ${formHint}</p>
    <p class="syn-live">${liveSynLine}</p>
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
  // mechanics-fix-3: never abort to lobby — fill pads if empty
  if (!state.cupPicks?.length) applyShowMePractice();
  ensurePracticePlacement();
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_fight_entered = true;
  const prac = state.practiceMode ? Combat.practiceSetup(state.combatPack) : null;
  const lineup = prac ? Density.practiceLineup(prac, state.densityPack) : null;
  if (prac && !state.save.storyFlags?.practice_cup_done) {
    // Prefer Show-me / manual placement; only overwrite if still empty
    const filled = (state.placement || []).filter(Boolean).length;
    if (!filled && lineup?.playerLineup?.length) {
      const placement = Array(6).fill(null);
      const practiceSlots = [1, 2, 3];
      (lineup.playerLineup || []).forEach((row, i) => {
        placement[practiceSlots[i] ?? Combat.cellToSlot(row.cell)] = row.neighborId;
      });
      state.placement = placement;
      state.cupPicks = (lineup.playerLineup || []).map((r) => r.neighborId);
      state.enemyLineup = (lineup.enemyLineup || []).map((r) => r.botId);
    } else if (!state.enemyLineup?.length && lineup?.enemyLineup?.length) {
      state.enemyLineup = (lineup.enemyLineup || []).map((r) => r.botId);
    }
  }
  const allyIds = state.placement.filter(Boolean);
  const bot = state.content.botCupRoster;
  const placedSlots = state.placement
    .map((id, slot) => (id ? slot : null))
    .filter((s) => s != null);
  const allFront = placedSlots.length > 0 && placedSlots.every((s) => s < 3);
  // Bot challenge pack: aggro + pressure curves
  const curve = state.combatPack?.botAi?.pressureCurve || {};
  const week = weekNumber();
  const pressure =
    (prac && curve.practiceCup) ||
    (week <= 1 && curve.week1Ladder) ||
    (week === 2 && curve.week2Ladder) ||
    curve.week3Ladder ||
    {};
  const aggro = pressure.botAggro || state.combatPack?.botAi?.aggroDefault || 1.15;
  let mult = (state.botMult || 1) * aggro * (pressure.botDamageDealtMult || 1);
  if (allFront) mult *= 1.28;
  if (prac && pressure.winBiasRespectCombatPack !== false) mult *= 0.92;
  const enemyIds = state.enemyLineup?.length ? state.enemyLineup : pickEnemyLineup(allyIds);
  state.enemyLineup = enemyIds;
  // Match draft board: bots sit front/front/back (slots 0,1,3)
  const enemySlots = prac
    ? [1, 2, 3].slice(0, (lineup.enemyLineup || []).length)
    : [0, 1, 3];
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
    practice: !!prac,
    scripted: prac ? Density.mergedPracticeScript(prac, state.densityPack) : [],
    scriptedDone: new Set(),
    cannotDismissPorch: false,
  };
  if (allFront) {
    battle.log.unshift(state.locale === "tr" ? "Bot: hep ön sıra cezası!" : "Bot: all-front punish!");
  }
  state.battle = battle;
  // Clear lobby toast chrome before fight stage
  document.querySelectorAll(".toast").forEach((n) => n.remove());
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
    // Porch-call: practice script owns timing; otherwise ~45% fight / ally ≤50% HP
    const allyLow = battle.allies.some((u) => u.alive && u.hp / u.maxHp <= 0.5);
    const timeGate = battle.practice
      ? false
      : battle.elapsed >= 12 || (battle.elapsed >= 8 && allyLow);
    if (!battle.actionOffered && timeGate && battle.allies.some((u) => u.alive) && battle.enemies.some((u) => u.alive)) {
      battle.actionOffered = true;
      battle.paused = true;
      updateFightUI(battle);
      showFightActions(battle);
      return;
    }
    combatAcc += uiMs;
    while (combatAcc >= tickMs) {
      combatAcc -= tickMs;
      runScriptedMoments(battle);
      if (battle.paused) break;
      combatTick(battle);
    }
    battle.floaters = (battle.floaters || []).filter((f) => battle.elapsed - f.t < 0.85);
    updateFightUI(battle);
    const bothAlive = battle.allies.some((u) => u.alive) && battle.enemies.some((u) => u.alive);
    const timeUp = battle.elapsed >= 75;
    // Practice hard gate: don't finish until porch call resolved
    if (battle.practice && !battle.actionUsed && (timeUp || !bothAlive)) {
      if (!battle.actionOffered) {
        battle.actionOffered = true;
        battle.paused = true;
        battle.cannotDismissPorch = true;
        updateFightUI(battle);
        showFightActions(battle);
      }
      return;
    }
    if (timeUp || !bothAlive) {
      endFight(battle);
    }
  }, uiMs);
}

function applyBeatFlags(beat) {
  const flags = [...(beat.setsFlags || []), ...(beat.setsFlagsOnResolve || [])];
  if (!flags.length) return;
  state.save.storyFlags = state.save.storyFlags || {};
  for (const f of flags) state.save.storyFlags[f] = true;
  saveNow();
}

function runScriptedMoments(battle) {
  if (!battle.scripted?.length) return;
  for (const beat of battle.scripted) {
    if (battle.scriptedDone.has(beat.id)) continue;
    if (battle.elapsed < (beat.tSec || 0)) continue;
    battle.scriptedDone.add(beat.id);
    if (beat.type === "gate_lock") {
      battle.gateLocks = new Set(beat.locks || ["skip", "end_evening"]);
      if (beat.lines) showSynProc(loc(beat.lines));
    } else if (beat.type === "coach_line" || beat.type === "coach_tip" || beat.type === "synergy_badge_pulse") {
      if (beat.condition === "syn_tea_circle_not_active" && battle.allySyn.some((s) => s.id === "syn_tea_circle")) continue;
      showSynProc(loc(beat.lines));
      battle.log.unshift(loc(beat.lines));
      if (beat.cameraShakeId) stageShake(Combat.shakeClass(state.combatPack?.juiceHints, beat.cameraShakeId));
      applyBeatFlags(beat);
      if (beat.requireAck) {
        battle.paused = true;
        const bar = document.getElementById("fight-actions");
        if (bar) {
          const ack = loc(beat.ackLabel) || (state.locale === "tr" ? "Anladım — Rekabet" : "Got it — Rivalry");
          bar.innerHTML = `<p class="fight-action-prompt">${loc(beat.lines) || ack}</p>
            <div class="btn-row wrap"><button class="btn btn-ember" type="button" data-action="ack-rivalry">${ack}</button></div>`;
          bar.hidden = false;
        }
      }
    } else if (beat.type === "forced_hit") {
      const u = battle.allies.find((a) => a.id === beat.targetNeighborId || a.mirrorOf === beat.targetNeighborId);
      if (u && u.alive) {
        const dmg = Math.max(1, Math.floor(u.maxHp * (beat.damagePercentMaxHp || 0.18)));
        u.hp = Math.max(1, u.hp - dmg);
        battle.floaters.push({ side: u.side, slot: u.slot, dmg, t: battle.elapsed });
        stageShake("shake");
      }
    } else if (beat.type === "force_ally_hp_then_synergy_pop") {
      const u = battle.allies.find((a) => a.id === beat.targetNeighborId || a.mirrorOf === beat.targetNeighborId);
      if (u && u.alive) {
        u.hp = Math.max(1, Math.floor(u.maxHp * (beat.setHpPercent || 0.32)));
        showSynProc(loc(beat.lines));
        battle.floaters.push({ side: u.side, slot: u.slot, dmg: 9, rivalry: true, t: battle.elapsed });
        stageShake("shake-medium");
        state.save.storyFlags = state.save.storyFlags || {};
        state.save.storyFlags.practice_cup_rivalry_pop_seen = true;
        state.save.storyFlags.syn_taught_syn_rivalry = true;
        applyBeatFlags(beat);
        saveNow();
      }
    } else if (beat.type === "porch_call" && !battle.actionUsed) {
      battle.actionOffered = true;
      battle.paused = true;
      battle.cannotDismissPorch = !!beat.cannotDismissWithoutPick;
      battle.forcePorchIds = beat.forceOptionIds || null;
      updateFightUI(battle);
      showFightActions(battle);
      // flags apply on resolve via applyPorchCall
      battle._porchResolveFlags = beat.setsFlagsOnResolve || [];
    } else if (beat.type === "finish_banner") {
      applyBeatFlags(beat);
      showSynProc(loc(beat.lines) || (state.locale === "tr" ? "Prova bitti" : "Practice clear"));
    } else if (beat.type === "porch_call_resolve_fx") {
      stageShake("shake-medium");
    }
  }
}

function showFightActions(battle) {
  const bar = document.getElementById("fight-actions");
  if (!bar) return;
  const tr = state.locale === "tr";
  const synIds = (battle.allySyn || []).map((s) => s.id);
  let opts =
    Combat.pickPorchCallOptions(state.combatPack, synIds, state.practiceMode) ||
    [];
  if (battle.forcePorchIds?.length) {
    const all = state.combatPack?.porchCalls?.options || [];
    opts = battle.forcePorchIds.map((id) => all.find((o) => o.id === id) || opts.find((o) => o.id === id)).filter(Boolean);
  }
  if (!opts.length) {
    // Legacy fallback
    const foes = battle.enemies.filter((u) => u.alive);
    bar.innerHTML = `
      <p class="fight-action-prompt">${tr ? "Porch hamlesi — birini seç" : "Porch call — pick one"}</p>
      <div class="btn-row wrap">
        ${foes.map((u) => `<button class="btn btn-ember" type="button" data-action="fight-focus" data-slot="${u.slot}">${tr ? "Hedef" : "Focus"} ${u.name}</button>`).join("")}
        <button class="btn btn-teal" type="button" data-action="fight-prop">${tr ? "Prop: demlik heal" : "Prop: teapot heal"}</button>
        <button class="btn btn-secondary" type="button" data-action="fight-swap">${tr ? "Ön↔Arka swap" : "Front↔Back swap"}</button>
      </div>`;
    bar.hidden = false;
    return;
  }
  battle.porchCallOptions = opts;
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage");
  if (stage) stage.classList.add("porch-call-dim");
  const layout = state.combatPack?.porchCalls?.optionCardLayout || {};
  const chips = layout.categoryChips || {};
  const winUi = state.combatPack?.porchCalls?.window?.ui || {};
  const title = loc(winUi.title) || (tr ? "Veranda Çağrısı — birini seç" : "Porch Call — pick one");
  const subtitle = loc(winUi.subtitle) || (tr ? "Skor sallanır · güvenli / riskli / sinerji" : "Score swings · safe / swingy / synergy");
  const card = (o) => {
    const cat = o.category || "safe";
    const chip = loc(chips[cat]) || cat;
    const swing = o.hpSwingDisplay
      ? (tr ? `≈ %${o.hpSwingDisplay.minPercent}–${o.hpSwingDisplay.maxPercent} takım HP` : `≈ ${o.hpSwingDisplay.minPercent}–${o.hpSwingDisplay.maxPercent}% team HP`)
      : "";
    const prop = porchCallProp(o);
    return `<button class="porch-call-card btn ${cat === "safe" ? "btn-teal" : cat === "swingy" ? "btn-ember" : "btn-primary"}" type="button" data-action="porch-call" data-id="${o.id}">
      <img class="porch-call-prop" src="${prop}" alt="" width="36" height="36" />
      <span class="porch-call-chip">${chip}</span>
      <strong>${loc(o.label)}</strong>
      <em>${loc(o.blurb)}</em>
      ${swing ? `<span class="porch-call-swing">${swing}</span>` : ""}
    </button>`;
  };
  bar.innerHTML = `
    <p class="fight-action-prompt">${title}</p>
    <p class="muted porch-call-sub">${subtitle}</p>
    <div class="btn-row wrap porch-call-row">${opts.map(card).join("")}</div>`;
  bar.hidden = false;
  clearTimeout(battle._porchTimeout);
  // Practice teach: cannot dismiss without pick — no auto-timeout
  if (battle.cannotDismissPorch) return;
  const pause = state.combatPack?.porchCalls?.window?.pauseSec || 2.2;
  battle._porchTimeout = setTimeout(() => {
    if (battle.actionUsed || battle.finished) return;
    const defId = state.combatPack?.porchCalls?.window?.timeoutDefaultCallId || "call_cheer";
    const opt = opts.find((o) => o.id === defId) || opts[0];
    if (opt) applyPorchCall(opt.id);
  }, Math.max(2200, pause * 1000));
}

function applyPorchCall(callId) {
  const battle = state.battle;
  if (!battle || battle.actionUsed) return;
  clearTimeout(battle._porchTimeout);
  const opt =
    (battle.porchCallOptions || []).find((o) => o.id === callId) ||
    state.combatPack?.porchCalls?.options?.find((o) => o.id === callId);
  if (!opt) return;
  const beforeHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const beforeMax = battle.allies.reduce((s, u) => s + u.maxHp, 0) || 1;
  const label = Combat.applyPorchCallEffect(battle, opt, loc);
  battle.log.unshift(label);
  const afterHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const deltaPct = Math.round(((afterHp - beforeHp) / beforeMax) * 100);
  const deltaSigned = `${deltaPct >= 0 ? "+" : ""}${deltaPct}`;
  const fb = state.combatPack?.porchCalls?.resolveFeedback;
  const toastTpl = loc(fb?.toastTemplate) || (state.locale === "tr" ? "Çağrı: {label} · takım HP {deltaSigned}%" : "Call: {label} · team HP {deltaSigned}%");
  const toastMs = state.combatPack?.porchCallPropJuice?.resolveStickiness?.teamHpDeltaToastMs
    || state.combatPack?.porchCalls?.resolveFeedback?.toastMs
    || 1800;
  toast(toastTpl.replace("{label}", loc(opt.label)).replace("{deltaSigned}", deltaSigned), toastMs);
  if (opt.id === "call_tea_break" || opt.id === "call_oven_warm") playTeapotClink();
  showSynProc(label);
  stageShake(Combat.shakeClass(state.combatPack?.juiceHints, opt.cameraShakeId) || "shake-medium");
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.porch_call_resolved = true;
  if (state.practiceMode || practiceCupRequired()) {
    state.save.storyFlags.practice_cup_porch_call_done = true;
    for (const f of battle._porchResolveFlags || []) state.save.storyFlags[f] = true;
    saveNow();
  }
  battle.actionUsed = true;
  battle.paused = false;
  battle.cannotDismissPorch = false;
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage");
  if (stage) stage.classList.remove("porch-call-dim");
  hideFightActions();
  updateFightUI(battle);
  resumeFightLoop(battle);
}

function stageShake(cls = "shake") {
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage") ||
    document.querySelector("#screen-fight.active .rp-stage");
  if (!stage) return;
  stage.classList.remove("shake", "shake-medium", "shake-heavy");
  void stage.offsetWidth;
  stage.classList.add(cls || "shake");
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
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: hurt.side, slot: hurt.slot, heal, t: battle.elapsed });
    const msg = state.locale === "tr" ? `Demlik +${heal} → ${hurt.name}` : `Teapot +${heal} → ${hurt.name}`;
    battle.log.unshift(msg);
    showSynProc(state.locale === "tr" ? "Demlik" : "Teapot");
    playTeapotClink();
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
    if (neon && battle.elapsed <= neon.rules.windowSec && Math.random() < neon.rules.dodgeChance) {
      if (attacker.side === "enemy") showSynProc(loc(neon.name));
      battle.floaters = battle.floaters || [];
      battle.floaters.push({
        side: target.side,
        slot: target.slot,
        dodge: true,
        t: battle.elapsed,
      });
      battle.log.unshift(`${loc(neon.name)} dodge`);
      continue;
    }

    // Porch-call dodge buff
    if (attacker.side === "enemy" && battle.dodgeBuffUntil && battle.elapsed <= battle.dodgeBuffUntil) {
      if (Math.random() < (battle.dodgeBuffChance || 0.15)) {
        battle.floaters = battle.floaters || [];
        battle.floaters.push({ side: target.side, slot: target.slot, dodge: true, t: battle.elapsed });
        continue;
      }
    }
    let atk = attacker.atk;
    if (attacker.side === "ally" && battle.atkBuffUntil && battle.elapsed <= battle.atkBuffUntil) {
      atk = Math.floor(atk * (1 + (battle.atkBuffPct || 0.12)));
    }
    let def = target.def;
    if (target.side === "ally" && battle.defBuffUntil && battle.elapsed <= battle.defBuffUntil) {
      def = Math.floor(def * (1 + (battle.defBuffPct || 0.2)));
    }
    let dmg = Math.max(1, atk - Math.floor(def * 0.45));
    if (attacker.side === "enemy" && battle.allFront && target.slot < 3) dmg = Math.floor(dmg * 1.2);
    if (attacker.side === "ally" && battle.focusUntil && battle.elapsed <= battle.focusUntil && target.slot === battle.focusTargetSlot) {
      dmg = Math.floor(dmg * (1 + (battle.focusDmgBonus || 0.2)));
    }
    const selfSyn = attacker.side === "ally" ? battle.allySyn : battle.enemySyn;
    const rivalry = selfSyn.find((s) => s.rules.type === "low_hp_damage_buff");
    let rivalryProc = false;
    let rivalryCrossing = false;
    const thr = rivalry?.rules?.hpThresholdPercent ?? 0.35;
    if (rivalry && attacker.hp / attacker.maxHp <= thr) {
      dmg = Math.floor(dmg * (1 + rivalry.rules.damageBonusPercent));
      rivalryProc = attacker.side === "ally";
      // Sticky once-per-crossing (mechanics-fix-2)
      if (rivalryProc && !attacker._rivalryCrossed) {
        attacker._rivalryCrossed = true;
        rivalryCrossing = true;
        battle.rivalryProcKeys = battle.rivalryProcKeys || new Set();
        const key = `rivalry_proc_${battle.fightId || "f"}_${attacker.id}_cross`;
        if (!battle.rivalryProcKeys.has(key)) {
          battle.rivalryProcKeys.add(key);
          battle.floaters = battle.floaters || [];
          battle.floaters.push({
            side: attacker.side,
            slot: attacker.slot,
            dmg: 0,
            rivalry: true,
            rivalrySticky: true,
            t: battle.elapsed,
          });
          stageShake("shake-medium");
          showSynProc(
            state.locale === "tr"
              ? "Rekabet! Düşük HP → daha sert vuruş"
              : "Rivalry! Low HP → harder hits"
          );
          if (state.practiceMode || battle.practice) {
            state.save.storyFlags = state.save.storyFlags || {};
            state.save.storyFlags.practice_cup_rivalry_pop_seen = true;
            state.save.storyFlags.syn_taught_syn_rivalry = true;
          }
        }
      }
    }
    attacker._rivalryCrossingHit = rivalryCrossing;
    const fence = selfSyn.find((s) => s.rules.type === "team_def_buff");
    if (fence) dmg = Math.max(1, Math.floor(dmg * (1 - (fence.rules.defBonusPercent || 0) * 0.5)));
    const chaos = selfSyn.find((s) => s.rules.type === "crit_chance");
    if (chaos && Math.random() < chaos.rules.critChance) dmg = Math.floor(dmg * (chaos.rules.critMult || 1.5));

    if (attacker.role === "AoE" || /AoE|Burst/i.test(attacker.role || "")) {
      for (const f of foes) applyDamage(f, f === target ? dmg : Math.max(1, Math.floor(dmg * 0.35)), attacker, battle, rivalryProc && f === target);
    } else applyDamage(target, dmg, attacker, battle, rivalryProc);

    if (/Healer|heal/i.test(attacker.role || "") || attacker.synergyTag === "Oven") {
      const friends = attacker.side === "ally" ? battle.allies : battle.enemies;
      const hurt = friends.filter((u) => u.alive && u.hp < u.maxHp).sort((a, b) => a.hp - b.hp)[0];
      if (hurt) {
        const amt = Math.max(2, Math.floor(attacker.atk * 0.6));
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + amt);
        battle.floaters = battle.floaters || [];
        battle.floaters.push({ side: hurt.side, slot: hurt.slot, heal: amt, t: battle.elapsed });
      }
    }
    flashUnit(target.side, target.slot);
  }

  for (const side of ["ally", "enemy"]) {
    const syns = side === "ally" ? battle.allySyn : battle.enemySyn;
    for (const tea of syns.filter((s) => s.rules.type === "periodic_heal_aura")) {
      const interval = tea.rules.intervalSec || 4;
      if (Math.floor(battle.elapsed / interval) !== Math.floor((battle.elapsed - 0.4) / interval)) {
        const units = side === "ally" ? battle.allies : battle.enemies;
        let healed = 0;
        for (const u of units) {
          if (!u.alive) continue;
          const amt = Math.max(1, Math.floor(u.maxHp * tea.rules.healPercentMaxHp));
          u.hp = Math.min(u.maxHp, u.hp + amt);
          battle.floaters = battle.floaters || [];
          battle.floaters.push({ side: u.side, slot: u.slot, heal: amt, t: battle.elapsed });
          healed += amt;
        }
        if (healed && side === "ally") {
          battle.log.unshift(`${loc(tea.name)} +${healed}`);
          showSynProc(loc(tea.name));
        }
      }
    }
  }
}

function showSynProc(text) {
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage");
  if (!stage) return;
  let node = stage.querySelector(".syn-proc");
  if (!node) {
    node = document.createElement("div");
    node.className = "syn-proc";
    stage.appendChild(node);
  }
  node.textContent = text;
  node.classList.remove("pop");
  void node.offsetWidth;
  node.classList.add("pop");
  const rivalry = /rivalry|rekabet/i.test(String(text || ""));
  if (rivalry && ART.vfxRivalry) {
    let vfx = stage.querySelector('.rp-vfx[data-vfx="rivalry"]');
    if (!vfx) {
      vfx = document.createElement("img");
      vfx.className = "rp-vfx syn-rivalry-vfx";
      vfx.dataset.vfx = "rivalry";
      vfx.alt = "";
      stage.appendChild(vfx);
    }
    vfx.hidden = false;
    vfx.src = ART.vfxRivalry;
    vfx.classList.remove("pop");
    void vfx.offsetWidth;
    vfx.classList.add("pop");
    clearTimeout(vfx._t);
    vfx._t = setTimeout(() => {
      vfx.hidden = true;
      vfx.remove();
    }, 900);
  }
}

function applyDamage(target, dmg, attacker, battle, rivalryProc = false) {
  target.hp -= dmg;
  attacker.damageDealt += dmg;
  if (battle) {
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: target.side, slot: target.slot, dmg, rivalry: rivalryProc, t: battle.elapsed });
    battle.log = battle.log || [];
    // Shake + coach float only on crossing (handled in combatTick); gold float on buffed hits
    battle.log.unshift(`${attacker.name} → ${target.name} −${dmg}${rivalryProc ? "!" : ""}`);
    battle.log = battle.log.slice(0, 4);
  }
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
    stageShake("shake-heavy");
  }
}
function flashUnit(side, slot) {
  const node = document.querySelector(`.unit-slot[data-side="${side}"][data-slot="${slot}"]`);
  if (!node) return;
  node.classList.remove("hit");
  void node.offsetWidth;
  node.classList.add("hit");
  stageShake("shake");
}

function renderFight(battle) {
  const allyPills = battle.allySyn.map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">${loc(s.name)}</span>`).join("");
  const enemyPills = battle.enemySyn.map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">Bot · ${loc(s.name)}</span>`).join("");
  const synPills = allyPills || enemyPills ? allyPills + enemyPills : `<span class="muted">${t("synergy.active")}: —</span>`;
  const tr = state.locale === "tr";
  state.save.storyFlags = state.save.storyFlags || {};
  for (const s of battle.allySyn) {
    state.save.storyFlags[`syn_taught_${s.id}`] = true;
  }
  if (battle.allySyn.length) state.save.storyFlags.synergy_school_seen = true;
  saveNow();
  const teachLine = (s) => {
    if (s.id === "syn_rivalry") return tr ? "Rekabet! Düşük HP → sert vuruş" : "Rivalry! Low HP → harder hits";
    if (s.id === "syn_tea_circle") return tr ? "Çay Çemberi — heal aura" : "Tea Circle — heal aura";
    if (s.id === "syn_neon_night") return tr ? "Neon Gece — 8 sn dodge penceresi" : "Neon Night — 8s dodge window";
    return loc(s.name);
  };
  const coachBanner = battle.allySyn.length
    ? `<div class="syn-fight-tip">${battle.allySyn.map(teachLine).join(" · ")}</div>`
    : `<div class="syn-fight-tip soft">${tr ? "Sinerji yok — Cup'ta Tea/Rivalry/Neon eşleştir" : "No synergy — match Tea/Rivalry/Neon in Cup"}</div>`;
  const canSkip = !Density.practiceSkipBlocked(state.densityPack, state.save) && !(state.practiceMode || practiceCupRequired());
  const screen = document.getElementById("screen-fight");
  screen.innerHTML = `
    ${stageLayer("arena")}
    ${hudHtml()}
    <div class="topbar fight-top"><h2>${t("fight.title")}</h2>
      ${canSkip ? `<button class="btn btn-secondary" type="button" data-action="skip-fight">${t("fight.skip")}</button>` : `<span class="chip rivalry">${tr ? "Prova — atlama yok" : "Practice — no skip"}</span>`}
    </div>
    ${coachBanner}
    <div class="fight-hud" style="margin-bottom:0.35rem">
      <span id="ally-hp-total" class="hud-ally"></span><span id="fight-timer">0.0s</span><span id="enemy-hp-total" class="hud-enemy"></span>
    </div>
    <div class="rp-arena" aria-live="polite">
      <div class="rp-arena__label enemy">${tr ? "Rakip" : "Rival"}</div>
      <div class="rp-pads rp-pads--enemy" id="enemy-pads"></div>
      <div class="rp-arena__vs">VS</div>
      <div class="rp-pads rp-pads--you" id="ally-pads"></div>
      <div class="rp-arena__label you">${tr ? "Senin porch" : "Your porch"}</div>
    </div>
    <div class="synergy-pills">${synPills}</div>
    <div class="fight-actions" id="fight-actions" hidden></div>
    <p class="fight-log muted" id="fight-log"></p>`;
  screen._battle = battle;
  updateFightUI(battle);
  if (battle.allySyn[0]) {
    setTimeout(() => showSynProc(loc(battle.allySyn[0].name)), 400);
  }
}

function unitCard(u, side, floaters = []) {
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  const floater = floaters
    .filter((f) => f.side === side && f.slot === u.slot)
    .map((f) => {
      if (f.heal) return `<span class="heal-floater">+${f.heal}</span>`;
      if (f.dodge) return `<span class="dodge-floater">${state.locale === "tr" ? "kaç!" : "dodge"}</span>`;
      if (f.rivalry) return `<span class="dmg-floater rivalry-floater">−${f.dmg}!</span>`;
      return `<span class="dmg-floater">−${f.dmg}</span>`;
    })
    .join("");
  const face = goldBust(u.mirrorOf || u.id);
  const ember = u._rivalryCrossed ? " is-rivalry-ember" : "";
  return `<div class="unit-slot rp-unit rp-arena-unit ${side === "enemy" ? "enemy rp-unit--enemy" : "ally rp-unit--you"} ${u.alive ? "" : "dead"}${ember}" data-side="${side}" data-slot="${u.slot}">
    <div class="unit-name rp-unit__name">${u.name}</div>
    <img src="${face}" alt="${u.name}" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
    <div class="hp-track rp-hp"><i style="width:${pct}%"></i><span class="hp-num">${Math.max(0, Math.round(u.hp))}/${u.maxHp}</span></div>
    ${floater}
  </div>`;
}

function padPositions(side) {
  // visual-fix-2 wave3 8×4 grid — 3-man uses mid front (1/2/3)
  if (side === "enemy") {
    return {
      0: [26, 32],
      1: [38, 30],
      2: [50, 29],
      3: [62, 30],
      4: [74, 32],
      5: [50, 24],
    };
  }
  return {
    0: [26, 62],
    1: [38, 64],
    2: [50, 65],
    3: [62, 64],
    4: [74, 62],
    5: [50, 72],
  };
}

function updateFightUI(battle) {
  const enemyPads = document.getElementById("enemy-pads");
  const allyPads = document.getElementById("ally-pads");
  // Legacy row fallback if old markup still mounted
  const enemyFront = document.getElementById("enemy-front");
  const allyFront = document.getElementById("ally-front");
  const floaters = battle.floaters || [];

  const renderPads = (el, units, side) => {
    if (!el) return;
    const map = padPositions(side);
    el.innerHTML = units
      .map((u) => {
        const [x, y] = map[u.slot] || [50, side === "enemy" ? 28 : 68];
        const lane = (u.slot ?? 0) < 3 ? "is-front" : "is-back";
        return `<div class="rp-pad rp-arena-pad is-occupied ${lane}" style="--pad-x:${x}%;--pad-y:${y}%">${unitCard(u, side, floaters)}</div>`;
      })
      .join("");
  };

  if (enemyPads && allyPads) {
    renderPads(enemyPads, battle.enemies, "enemy");
    renderPads(allyPads, battle.allies, "ally");
  } else if (enemyFront && allyFront) {
    const split = (units) => {
      const front = units.filter((u) => (u.slot ?? 0) < 3).sort((a, b) => a.slot - b.slot);
      const back = units.filter((u) => (u.slot ?? 0) >= 3).sort((a, b) => a.slot - b.slot);
      return { front, back };
    };
    const e = split(battle.enemies);
    const a = split(battle.allies);
    enemyFront.innerHTML = e.front.map((u) => unitCard(u, "enemy", floaters)).join("") || `<span class="muted">—</span>`;
    const enemyBack = document.getElementById("enemy-back");
    const allyBack = document.getElementById("ally-back");
    if (enemyBack) enemyBack.innerHTML = e.back.map((u) => unitCard(u, "enemy", floaters)).join("") || `<span class="muted">·</span>`;
    allyFront.innerHTML = a.front.map((u) => unitCard(u, "ally", floaters)).join("") || `<span class="muted">—</span>`;
    if (allyBack) allyBack.innerHTML = a.back.map((u) => unitCard(u, "ally", floaters)).join("") || `<span class="muted">·</span>`;
  }

  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const allyEl = document.getElementById("ally-hp-total");
  const enemyEl = document.getElementById("enemy-hp-total");
  const timerEl = document.getElementById("fight-timer");
  if (allyEl) allyEl.textContent = `${state.locale === "tr" ? "Sen" : "You"} ${allyHp}`;
  if (enemyEl) enemyEl.textContent = `Bot ${enemyHp}`;
  if (timerEl) timerEl.textContent = `${battle.elapsed.toFixed(1)}s`;
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
  state.save.evening.cupDone = true;
  unlockNeighborsIfReady();
  emitQuestEvent({ type: "cup_finish", won });
  if (syn) emitQuestEvent({ type: "cup_synergy", synergy: syn.id || syn.name });
  saveNow();
  if (won) playWinSting();
  if (state.practiceMode || battle.practice) {
    state.save.storyFlags = state.save.storyFlags || {};
    for (const s of battle.allySyn || []) state.save.storyFlags[`syn_taught_${s.id}`] = true;
    // mechanics-fix-2 + ux-session-2: atomic Practice finish → End evening ≤1 render
    onPracticeResolved();
    const doneToast = state.uxPack2?.stageActions?.toasts?.practice;
    if (doneToast) toast(loc(doneToast), 2200);
  }
  if (state.lastResult.porchCallComic) {
    /* comic uses synergy/mvp; porch call stored for share */
    state.lastResult.porchCall = battle.porchCallId;
  }
  renderComic();
  showScreen("screen-comic");
}

function skipFight() {
  if (Density.practiceSkipBlocked(state.densityPack, state.save) || state.practiceMode || practiceCupRequired()) {
    const teach = Density.practiceTeach(state.densityPack);
    const toastMsg = loc(teach?.flagGates?.softSkipAttempts?.onAttempt?.toast) ||
      (state.locale === "tr" ? "Atlama yok. Rozeti gör, çağrıyı seç." : "No skip. See the badge, pick the call.");
    toast(toastMsg);
    state.save.storyFlags = state.save.storyFlags || {};
    state.save.storyFlags.practice_soft_skip_blocked = true;
    saveNow();
    showSynProc(state.locale === "tr" ? "Rekabet rozeti" : "Rivalry badge");
    return;
  }
  const battle = document.getElementById("screen-fight")?._battle || state.battle;
  if (!battle || battle.finished) return;
  for (let i = 0; i < 24 && !battle.finished; i++) {
    battle.elapsed += 2;
    combatTick(battle);
  }
  endFight(battle);
}

function doSecondStreetBeat() {
  const st = eveningStats();
  if (!st.checkin || st.visits < st.needVisits) {
    toast(state.locale === "tr" ? "Önce demlik — Merve kapıda." : "Pot first — Merve's at the door.");
    return;
  }
  if (state.save.evening.secondBeat) {
    toast(state.locale === "tr" ? "İkinci tur alındı" : "Second beat already done");
    return;
  }
  // Prefer evening-slot micro-event for density pull
  const micro = Density.pickMicroEvent(state.densityPack, state.save, "evening")
    || Density.pickMicroEvent(state.densityPack, state.save, "street");
  if (micro && !state.save.evening.streetEvent) {
    state.save.evening.secondBeat = true;
    saveNow();
    state.streetEvent = Density.microToStreetEvent(micro);
    const ev = state.streetEvent;
    const screen = document.getElementById("screen-event");
    screen.innerHTML = `
      ${hudHtml()}
      <div class="topbar"><h2>${loc(ev.title)}</h2>
        <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
      </div>
      <div class="dialog-box">
        <p class="prompt">${loc(ev.prompt)}</p>
        <div class="choice-stack">
          ${(ev.choices || [])
            .map((c) => `<button class="btn btn-secondary" type="button" data-action="event-choice" data-cid="${c.id}">${loc(c.label)}</button>`)
            .join("")}
        </div>
      </div>`;
    showScreen("screen-event");
    return;
  }
  // Extra door knock + small rewards densify the evening
  const candidates = unlockedNeighbors().filter((n) => !state.save.evening.visits.includes(n.id));
  const pick = candidates[0] || unlockedNeighbors()[0];
  if (pick) {
    bumpAffinity(pick.id, 2);
    if (!state.save.evening.visits.includes(pick.id)) state.save.evening.visits.push(pick.id);
    emitQuestEvent({ type: "talk", neighborId: pick.id });
  }
  grant(state.save, { porch_coins: 4, neon_thread: 1 });
  addPassXp(state.save, 0.35);
  state.save.evening.secondBeat = true;
  saveNow();
  playKnock();
  toast(
    state.locale === "tr"
      ? `İkinci tur · ${loc(pick?.name) || "mahalle"} +jeton`
      : `Second beat · ${loc(pick?.name) || "block"} +coins`
  );
  renderEvening();
  showScreen("screen-evening");
}

function renderComic() {
  const r = state.lastResult;
  const comic = state.content.matchComic;
  const vars = { winner: r.winner, synergy: r.synergy, mvp: r.mvp };
  let panelDefs = [...(comic.panels || [])];
  // story-form-3: cold echo panel insert
  const inserts = state.questPack?.storyForm3?.comicPanelInserts || [];
  for (const ins of inserts) {
    const when = ins.when || {};
    const ok =
      (when.flagsAny || []).some((f) => storyFlag(f)) ||
      (when.flagsAll || []).every((f) => storyFlag(f));
    if (!ok) continue;
    const at = Math.min(panelDefs.length, ins.afterPanelIndex ?? 1);
    panelDefs = [...panelDefs.slice(0, at), { textTemplate: ins.textTemplate || ins.text }, ...panelDefs.slice(at)];
  }
  const panels = panelDefs
    .map((p, i) => {
      const imgId = r.team[i % Math.max(1, r.team.length)];
      return `<article class="comic-panel" style="animation-delay:${i * 0.08}s">
        <img src="${bust(imgId)}" alt="" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
        <p>${fillTemplate(loc(p.textTemplate || p.text), vars)}</p>
      </article>`;
    })
    .join("");
  const shareText = fillTemplate(loc(state.content.uiStrings["comic.share_text"]), vars);
  const banner = state.questPack?.storyForm3?.comicRememberBanner || state.stories?.porchCupNarrative?.comicRememberBanner;
  let remember = "";
  if (banner && (banner.when?.flagsAny || []).some((f) => storyFlag(f))) {
    const flag = ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].find((f) => storyFlag(f));
    const body = flag ? banner.bodyByFlag?.[flag] : null;
    remember = `<div class="comic-remember"><strong>${loc(banner.title)}</strong><p>${loc(body) || ""}</p></div>`;
    state.save.storyFlags = state.save.storyFlags || {};
    state.save.storyFlags.comic_cold_echo_seen = true;
  }
  document.getElementById("screen-comic").innerHTML = `
    ${hudHtml()}
    <div class="topbar"><h2>${t("comic.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.continue")}</button>
    </div>
    <p class="result-banner ${r.won ? "win" : "lose"}">${r.won ? t("common.win") : t("common.lose")}</p>
    <p class="street-hint muted">${t("fight.hp_total")}: ${r.allyHp} vs ${r.enemyHp} · MVP ${r.mvp}</p>
    ${r.rewardLine ? `<p class="reward-breakdown">${state.locale === "tr" ? "Ödül" : "Rewards"}: ${r.rewardLine}</p>` : ""}
    ${remember}
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
        playWinSting();
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
    case "second-beat":
      doSecondStreetBeat();
      break;
    case "overnight-open-quest":
      state.questTab = "active";
      renderQuestLog();
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
    case "porch-call":
      applyPorchCall(target.dataset.id);
      break;
    case "open-reactive-dlg": {
      const id = target.dataset.id;
      const trees = state.stories?.dialogueTrees;
      const tree = Array.isArray(trees) ? trees.find((t) => t.id === id) : trees?.[id];
      if (!tree) break;
      state.save.storyFlags = state.save.storyFlags || {};
      if (id.includes("kite_aftermath")) state.save.storyFlags.react_kite_aftermath_seen = true;
      if (id.includes("bass_patience")) state.save.storyFlags.react_orhan_bass_patience_seen = true;
      if (id.includes("peri_stay")) state.save.storyFlags.react_peri_stay_or_leave_seen = true;
      if (id.includes("ledger_hears")) state.save.storyFlags.react_ledger_hears_neon_seen = true;
      if (id.includes("finale_street")) state.save.storyFlags.react_finale_street_memory_seen = true;
      state.dialogue = {
        tree,
        nodeId: tree.start || "root",
        ctx: { kind: "reactive", neighborId: tree.speakerId || (tree.nodes || [])[0]?.speaker },
        feedbackLog: [],
      };
      const node = Story.getNode(tree, state.dialogue.nodeId);
      if (node) Story.applyNodeArrival(state.save, node);
      saveNow();
      renderDialogue();
      showScreen("screen-story");
      break;
    }
    case "ack-rivalry": {
      const b = state.battle;
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.syn_taught_syn_rivalry = true;
      saveNow();
      hideFightActions();
      if (b) {
        b.paused = false;
        resumeFightLoop(b);
      }
      break;
    }
    case "syn-show-me": {
      const msg = applyShowMePractice();
      toast(msg);
      renderCupLobby();
      break;
    }
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
  unlockAudio();
  const target = e.target.closest("[data-action]");
  if (!target) return;
  playUiTap();
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
    const [content, economy, stories, ladder, depthMeta, questPack, combatPack, densityPack, uxPack, uxPack2] = await Promise.all([
      fetch("data/content.json").then((r) => r.json()),
      fetch("data/economy.json").then((r) => r.json()),
      fetch("data/stories.json").then((r) => r.json()),
      fetch("data/ladder.json").then((r) => r.json()),
      fetch("data/depth-meta.json").then((r) => r.json()),
      loadQuestPack(),
      fetch("data/combat-pack.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/session-density.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-1.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-2.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    state.content = content;
    state.economy = economy;
    state.stories = stories;
    state.ladder = ladder;
    state.depthMeta = depthMeta;
    state.questPack = questPack;
    state.combatPack = combatPack;
    state.densityPack = densityPack;
    state.uxPack = uxPack;
    state.uxPack2 = uxPack2;
    state.storyForm2 = questPack?.storyForm2 || null;
    state.storyForm3 = questPack?.storyForm3 || null;
    if (uxPack2?.strings) {
      state.uxPack = { ...(uxPack || {}), ...(uxPack2 || {}), strings: { ...(uxPack?.strings || {}), ...(uxPack2.strings || {}) } };
    }
    if (combatPack) Combat.applySynergyPools(state.content, combatPack);
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
    preloadSfx().catch(() => {});
    renderTitle();
    showScreen("screen-title");
  } catch (err) {
    el.app.innerHTML = `<div class="loading">Boot failed<br/><code>${String(err)}</code></div>`;
  }
}

boot();
