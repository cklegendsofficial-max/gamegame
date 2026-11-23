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
import * as EndEvening from "./endEvening.js";
import * as Ux4 from "./uxSession4Nuclear.js";

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
function stickyFightToast(msg, testId, minMs = 1200) {
  const existing = document.querySelector(`[data-testid="${testId}"]`);
  if (existing && existing.dataset.stickyUntil && Number(existing.dataset.stickyUntil) > Date.now()) {
    return; // do not replace until min visible
  }
  document.querySelectorAll(".rp-sticky-toast").forEach((el) => {
    if (el.dataset.stickyUntil && Number(el.dataset.stickyUntil) > Date.now()) return;
    el.remove();
  });
  const el = document.createElement("div");
  el.className = "rp-sticky-toast";
  el.dataset.testid = testId;
  el.setAttribute("data-testid", testId);
  el.dataset.stickyUntil = String(Date.now() + minMs);
  el.setAttribute("data-shown-at", String(performance.now()));
  el.setAttribute("data-min-visible-ms", String(minMs));
  if (testId === "call-two-mastery-toast") el.setAttribute("data-mastery", "1");
  el.textContent = msg;
  document.body.appendChild(el);
  // mech-13: pin smoke proof
  try {
    window.__RP_SMOKE__ = window.__RP_SMOKE__ || {};
    if (testId === "call-two-mastery-toast") {
      window.__RP_SMOKE__.masteryToastShownAt = performance.now();
      window.__RP_SMOKE__.masteryToastPinnedUntil = Date.now() + minMs;
      window.__RP_SMOKE__.masteryToastMinMs = minMs;
      window.__RP_SMOKE__.practice_call_two_player = true;
      window.__RP_SMOKE__.callTwoSource = "player";
    }
    if (testId === "call-two-auto-toast") {
      window.__RP_SMOKE__.callTwoSource = "auto";
      window.__RP_SMOKE__.practice_call_two_auto = true;
    }
  } catch { /* */ }
  setTimeout(() => {
    el.remove();
    // durable proof on roots after dismiss
    document.querySelectorAll("#screen-fight,#screen-comic,.rp-screen--comic").forEach((root) => {
      if (testId === "call-two-mastery-toast") root.setAttribute("data-call-two-mastery-shown", "1");
      if (testId === "call-two-auto-toast") root.setAttribute("data-call-two-auto-shown", "1");
    });
    document.body.dataset.callTwoMasteryShown = testId === "call-two-mastery-toast" ? "1" : document.body.dataset.callTwoMasteryShown;
  }, Math.max(minMs, 1600));
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

/** ux-session-3/4: Day1 End evening = ONLY practice_cup_done ∧ syn_taught_syn_rivalry. */
function canEndEvening() {
  EndEvening.normalizePracticeFlags(state.save);
  return Ux4.endEnabled(state) || Density.canEndEvening(state.save, state.uxPack2, state.densityPack, state.uxPack3);
}

function syncEndEveningUnlock() {
  state.ui = state.ui || {};
  const ok = canEndEvening();
  state.ui.endEveningEnabled = ok;
  state.ui.endEveningBlocked = !ok;
  state.ui.endEveningBlockedReason = ok ? null : "practice";
  state.ui.overnightReachable = ok || (state.save.dayIndex || 1) > 1;
  Ux4.paintEndEveningControls(state, state.locale);
  return ok;
}

/** Atomic Practice finish — nuclear force BOTH flags (ux-session-4). */
function onPracticeResolved(reason = "fight_finish") {
  state.save.storyFlags = state.save.storyFlags || {};
  EndEvening.markPracticeCleared(state.save, reason);
  Ux4.forcePracticeFlags(state, reason);
  const teach = Density.practiceTeach(state.densityPack);
  for (const f of teach?.flagGates?.setsFlagsOnComplete || []) state.save.storyFlags[f] = true;
  state.save.evening = state.save.evening || {};
  state.save.evening.cupDone = true;
  state.meta = state.meta || {};
  state.meta.lastCupWasPractice = true;
  syncEndEveningUnlock();
  saveNow();
  return canEndEvening();
}

/** ux-session-3 cold-audit settle (debug-free). */
function onPracticeSettleConfirm(reason = "audit_settle") {
  // ux-session-5: settle never soft-clears in production
  if (!coldAuditActive()) {
    toast(state.locale === "tr" ? "Settle yalnızca debug" : "Settle is debug-only");
    state.settleConfirmOpen = false;
    renderCupLobby();
    return;
  }
  onPracticeResolved(reason);
  renderEvening();
  showScreen("screen-evening");
  requestAnimationFrame(() => {
    syncEndEveningUnlock();
    Ux4.paintEndEveningControls(state, state.locale);
  });
}

function coldAuditActive() {
  try {
    if (document.documentElement.dataset.auditCold === "1") return true;
    if (localStorage.getItem("rp_debug") === "1") return true;
    const q = new URLSearchParams(location.search);
    return q.get("coldAudit") === "1" || q.get("debugSettle") === "1";
  } catch {
    return false;
  }
}

function shouldShowPracticeSettle() {
  // gameplay priorityFix: Settle is debug/coldAudit-only — never production soft-clear
  if (!coldAuditActive()) return false;
  if (!state.practiceMode && !practiceCupRequired()) return false;
  if (canEndEvening()) return false;
  return true;
}

function practiceSettleHtml() {
  if (!shouldShowPracticeSettle()) return "";
  const tr = state.locale === "tr";
  const label = tr ? "Cem: Prova yeter — akşamı bırak" : "Cem: Practice is enough — settle evening";
  return `<div class="rp-settle-wrap" data-testid="practice-settle-wrap">
    <button id="btn-practice-settle" class="btn btn-teal rp-settle" type="button" data-action="practice-settle" data-testid="practice-settle" data-audit="practice-settle">${label}</button>
  </div>`;
}

function practiceSettleConfirmHtml() {
  const tr = state.locale === "tr";
  return `<div class="rp-settle-sheet" data-testid="practice-settle-sheet">
    <h3>${tr ? "Düdük bitsin mi?" : "Whistle down?"}</h3>
    <p>${tr ? "Provayı öğretti sayılır; Akşamı bırak açılır. Kapışma bir sonraki Kupada." : "Marks Practice taught and unlocks End evening. Fight polish can come next Cup."}</p>
    <div class="btn-row">
      <button class="btn btn-ember" type="button" data-action="practice-settle-confirm" data-testid="practice-settle-confirm">${tr ? "Provayı kapat" : "Settle Practice"}</button>
      <button class="btn btn-secondary" type="button" data-action="practice-settle-cancel">${tr ? "Seçime dön" : "Back to picks"}</button>
    </div>
  </div>`;
}

function eveningPrimaryCta() {
  const tr = state.locale === "tr";
  const dayEarly = state.save.dayIndex || 1;
  // Day1 only: End evening wins when earned (ux-10 sole_end)
  if (dayEarly <= 1 && canEndEvening()) {
    return { id: "end_evening", action: "end-evening", label: loc(state.uxPack2?.strings?.["evening.cta.end"]) || (tr ? "Akşamı bırak" : "End evening") };
  }
  if (!storyFlag("practice_cup_done") && dayEarly <= 1) {
    if (!state.save.evening?.checkin && !storyFlag("welcome_checkin_done")) {
      return { id: "sa_checkin", action: "goto-street", label: tr ? "Demliğe git" : "Go to the pot" };
    }
    if ((state.save.evening?.visits?.length || 0) < 3 && !storyFlag("welcome_met_three")) {
      return { id: "sa_visit", action: "goto-street", label: tr ? "Bir kapı çal" : "Knock a door" };
    }
    return { id: "sa_practice", action: "goto-cup", label: tr ? "Prova maçı ★" : "Practice match ★" };
  }
  // ux-session-9/11: Day2+ spine — Volume/HEADPHONES when unlocked (not stuck Antenna/End)
  const day = state.save.dayIndex || 1;
  if (day >= 2) {
    applyNaturalArcStreetUnlock();
    const qs = Quests.ensureQuestSave(state.save);
    const antennaDone = [
      "quest_antenna_complete",
      "arc_kite_antenna_complete",
      "natural_antenna_complete",
      "arc_kite_antenna_beat4",
      "flag_fence_and_kite",
      "flag_kite_chaos_buff",
    ].some((f) => storyFlag(f));
    const volumeDone = storyFlag("quest_volume_complete") || storyFlag("arc_volume_war_complete");
    const ledgerDone = storyFlag("quest_ledger_complete") || storyFlag("arc_tea_ledger_complete");
    // form17: HEADPHONES street job ONLY after quest_volume_accepted (not mere unlock/active)
    const volumeAccepted = storyFlag("quest_volume_accepted");
    const volumeUnlocked =
      storyFlag("natural_volume_street") ||
      storyFlag("quest_volume_tease") ||
      storyFlag("cold_day2_yielded") ||
      day >= 7 ||
      (day >= 3 && antennaDone) ||
      volumeAccepted ||
      !!qs.active?.mq_decibel_accord;
    // Day10+ Ledger MAIN handoff (story PF)
    if (day >= 10 || storyFlag("natural_ledger_street_wins")) {
      if (!ledgerDone) {
        return {
          id: "sa_ledger",
          action: "goto-street",
          label: tr ? "Defter tepsisine bak" : "See Ledger tray",
          support: tr ? "MAIN Defter — tepsi sokakta." : "MAIN Ledger — tray on the street.",
          whisper: tr ? "Omurga 4/5 · Defter" : "Spine 4/5 · Ledger",
          questId: "mq_ledger_tray",
          acceptIfNeeded: true,
          dataNext: "ledger",
        };
      }
    }
    // ux-11/form17: Open Volume first; HEADPHONES after accept
    if (volumeUnlocked && !volumeDone && day < 10) {
      if (!volumeAccepted) {
        return {
          id: "sa_volume_accept",
          action: "accept-volume",
          label: tr ? "Desibel'i aç" : "Open Volume",
          support: tr
            ? "KULAKLIK notu — omurga 3/5. Defter sonra."
            : "HEADPHONES note — spine 3/5. Ledger after.",
          whisper: tr ? "Omurga 3/5 · Desibel" : "Spine 3/5 · Volume",
          questId: "mq_decibel_accord",
          acceptIfNeeded: true,
          dataNext: "volume-accept",
        };
      }
      return {
        id: "sa_headphones",
        action: "goto-street",
        label: tr ? "KULAKLIK notuna git" : "Answer HEADPHONES note",
        support: tr ? "Sokakta not — Desibel omurgası." : "Note on the street — Decibel spine.",
        whisper: tr ? "Omurga 3/5 · KULAKLIK" : "Spine 3/5 · HEADPHONES",
        questId: "mq_decibel_accord",
        dataNext: "headphones",
        testId: "evening-headphones-street-job",
      };
    }
    if (!antennaDone) {
      return {
        id: "sa_antenna",
        action: "goto-street",
        label: tr ? "Antene çık" : "Up to the antenna",
        support: tr
          ? "İp duruyor. Desibel ve Defter bu yolun ilerisi."
          : "The line holds. Volume and Ledger are further down this road.",
        whisper: tr ? "Omurga 2/5 · Anten — sonra Desibel" : "Spine 2/5 · Antenna — then Volume",
        questId: "mq_antenna_op",
      };
    }
    if (volumeDone && !ledgerDone) {
      return {
        id: "sa_ledger",
        action: "goto-street",
        label: tr ? "Deftere bak" : "Open the ledger",
        support: tr ? "Çay çemberi — mahalle hesabı." : "Tea Circle — the block's account.",
        whisper: tr ? "Omurga 4/5 · Defter ve Tepsi" : "Spine 4/5 · Ledger & Tray",
        questId: "mq_ledger_tray",
        acceptIfNeeded: true,
      };
    }
    // Day2+ End evening is fallback after spine CTAs (ux-11)
    if (canEndEvening()) {
      return { id: "end_evening", action: "end-evening", label: loc(state.uxPack2?.strings?.["evening.cta.end"]) || (tr ? "Akşamı bırak" : "End evening") };
    }
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
  // story PF / form18-prep: never remount Shared string / Orhan residual after yield
  if (coldEchoSuppressed()) return "";
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
  // ux-session-8 / mech-9: never show Unstuck / Start is open mid-fight or as escape hatch
  if (!state.practiceMode) return;
  // oneTapEnterArena (ux-6) makes lobby stall moot — skip toast entirely
  if (state.uxPack6?.practiceLobby?.oneTapEnterArena !== false) return;
  const ms = state.combatPack?.lobbyAutoAdvance?.antiStall?.detectStuckMs || 8000;
  state._lobbyStallTimer = setTimeout(() => {
    if (!state.practiceMode || state.save.evening?.cupDone) return;
    if (document.getElementById("screen-fight")?.classList.contains("active")) return;
    if (state.cupPicks?.length === 3 || storyFlag("practice_show_me_applied")) {
      ensurePracticePlacement();
      state.practiceDraftReady = true;
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.practice_lobby_unstuck = true;
      // silent heal — no Unstuck toast (ux-8 ban)
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
  // ux-13/14: defer tray-reward whisper while Volume accept is live
  const volumeAcceptLive =
    document.body.dataset.eveningPanel === "volume-accept" ||
    ((flags.cold_day2_yielded || flags.natural_volume_street || (state.save.dayIndex || 1) >= 7) &&
      !flags.quest_volume_accepted &&
      !flags.arc_volume_war_complete);
  if (volumeAcceptLive) {
    return tr ? "Omurga 3/5 · Desibel — aç, sonra KULAKLIK" : "Spine 3/5 · Volume — open, then HEADPHONES";
  }
  // Day10+ ledger handoff whisper
  if ((state.save.dayIndex || 1) >= 10 || flags.natural_ledger_street_wins) {
    return tr ? "Omurga 4/5 · Defter tepsi — MAIN Defter" : "Spine 4/5 · Ledger tray — MAIN Ledger";
  }
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
  const ban = storyForm18()?.purgeSharedStringResidual?.bannedResidualPhrases || [
    "Shared string",
    "String holds",
    "millimeter",
    "milimetre",
    "Mediator night",
    "ortak ip",
  ];
  const list = Quests.activeWorldConsequences(state.save, state.questPack);
  return list
    .map((w) => loc(w.streetVisual))
    .filter(Boolean)
    .filter((line) => !(coldEchoSuppressed() && ban.some((p) => line.toLowerCase().includes(String(p).toLowerCase()))))
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


function storyForm5() {
  return state.questPack?.storyForm5 || state.storyForm5 || null;
}

function storyForm6() {
  return state.questPack?.storyForm6 || state.storyForm6 || null;
}

function storyForm7() {
  return state.questPack?.storyForm7 || state.storyForm7 || null;
}

function storyForm8() {
  return state.questPack?.storyForm8 || state.storyForm8 || null;
}

function storyForm9() {
  return state.questPack?.storyForm9 || state.storyForm9 || null;
}

function storyForm10() {
  return state.questPack?.storyForm10 || state.storyForm10 || null;
}

function storyForm11() {
  return state.questPack?.storyForm11 || state.storyForm11 || null;
}

function storyForm12() {
  return state.questPack?.storyForm12 || state.storyForm12 || null;
}

function storyForm13() {
  return state.questPack?.storyForm13 || state.storyForm13 || null;
}

function storyForm14() {
  return state.questPack?.storyForm14 || state.storyForm14 || null;
}

function isColdDay2() {
  const day = state.save.dayIndex || 1;
  // HOTFIX form15: calendar yield — cold prop must not monopolize forever
  if (day >= 7) return false;
  const antennaDone = [
    "arc_kite_antenna_complete",
    "quest_antenna_complete",
    "arc_kite_antenna_beat4",
    "flag_fence_and_kite",
    "flag_kite_chaos_buff",
    "natural_antenna_complete",
    "cold_day2_yielded",
  ].some((f) => storyFlag(f));
  if (day >= 3 && antennaDone) return false;
  return day >= 2 && ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some((f) => storyFlag(f));
}

function coldPropStillWins() {
  // Tied to form15 isColdDay2 — false at day≥7 / antenna∧day≥3
  if (!isColdDay2()) return false;
  if (storyFlag("cold_day2_yielded") || storyFlag("natural_volume_street")) return false;
  return true;
}

function coldShouldYield() {
  return isColdDay2() && !coldPropStillWins();
}

function applyStreetLayerPolicy() {
  const on = isColdDay2() && storyForm9()?.streetLayerPriority?.suppressSpotlightWhenColdProp !== false;
  document.body.classList.toggle("rp-cold-day2", on);
  if (on) {
    state.save.storyFlags = state.save.storyFlags || {};
    state.save.storyFlags.hide_day2_spotlight = true;
  }
  const street = document.getElementById("screen-street");
  if (street) {
    if ((state.save.dayIndex || 1) >= 2) street.dataset.day = "2";
    else delete street.dataset.day;
    if (on) {
      street.dataset.spotlight = "off";
      street.dataset.arcBanner = "off";
    }
  }
}

function liveBeatFromCards(cards) {
  for (const c of cards || []) {
    const req = c.requiresFlags || [];
    if (req.length && !req.every((f) => storyFlag(f))) continue;
    if (c.doneFlag && storyFlag(c.doneFlag)) continue;
    if (c.doneFlagAny?.some((f) => storyFlag(f))) continue;
    return c;
  }
  return null;
}

function antennaOpLiveBeat() {
  return liveBeatFromCards(storyForm7()?.antennaOpJournalBeatCards || []);
}

function allArcBeatCardLists() {
  const f7 = storyForm7() || {};
  const f8 = storyForm8() || {};
  const bans = f8.activeArcBeatBanners || [];
  return [
    { priority: 95, cards: f7.antennaOpJournalBeatCards, banner: f7.activeArcBeatBanner, when: f7.activeArcBeatBanner?.when, kind: "antenna" },
    { priority: 94, cards: f8.volumeOpJournalBeatCards, banner: bans[0], when: bans[0]?.when, kind: "volume" },
    { priority: 93, cards: f8.ledgerOpJournalBeatCards, banner: bans[1], when: bans[1]?.when, kind: "ledger" },
  ];
}

/** One live banner max — Antenna 95 / Volume 94 / Ledger 93. Deferred on cold Day2. */
function activeArcBeatBannerHtml() {
  if (isColdDay2() && storyForm9()?.streetLayerPriority?.deferFullArcBannerWhenColdProp !== false) {
    return ""; // compact chip instead
  }
  const lists = allArcBeatCardLists()
    .filter((row) => row.banner && whenFlagsOk(row.when || {}))
    .sort((a, b) => b.priority - a.priority);
  for (const row of lists) {
    const beat = liveBeatFromCards(row.cards);
    if (!beat) continue;
    const ban = row.banner;
    const sceneShort = loc(beat.scene) || "";
    const short = sceneShort.length > 72 ? `${sceneShort.slice(0, 70)}…` : sceneShort;
    const line = (state.locale === "tr" ? ban.template?.tr : ban.template?.en || ban.template?.tr || "")
      .replace("{beatTitle}", loc(beat.title))
      .replace("{sceneShort}", short);
    const neighbor = beat.cast?.[0] || "n3";
    return `<div class="rp-arc-beat-banner" data-testid="${ban.testId || "antenna-op-live-banner"}">
    <span>${line}</span>
    <button class="rp-btn rp-btn--primary" type="button" data-action="open-neighbor" data-id="${neighbor}">${loc(ban.cta)}</button>
  </div>`;
  }
  return "";
}

function antennaOpLiveBannerHtml() {
  return activeArcBeatBannerHtml();
}

function streetArcCompactChipHtml() {
  if (!isColdDay2() || !storyForm9()?.streetLayerPriority?.deferFullArcBannerWhenColdProp) return "";
  const lists = allArcBeatCardLists()
    .filter((row) => row.banner && whenFlagsOk(row.when || {}))
    .sort((a, b) => b.priority - a.priority);
  for (const row of lists) {
    const beat = liveBeatFromCards(row.cards);
    if (!beat) continue;
    return `<button class="rp-arc-chip" type="button" data-testid="street-arc-compact-chip" data-action="open-story-log">◎ ${loc(beat.title)}</button>`;
  }
  return "";
}

function streetHandoffBeatLive(screen = "street") {
  const beats = storyForm10()?.streetHandoffBeats || [];
  const coldShowing = isColdDay2();
  const day = state.save.dayIndex || 1;
  const candidates = beats
    .filter((b) => (b.screens || ["street"]).includes(screen))
    .filter((b) => {
      if (whenFlagsOk(b.when || {})) return true;
      const early = b.when?.orEarlyTease;
      return early ? whenFlagsOk(early) : false;
    })
    .filter((b) => !(coldShowing && day < 3))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return candidates[0] || null;
}

function volumeStreetBeatPropLive() {
  const props = storyForm11()?.volumeStreetBeatProps || [];
  return props.find((p) => whenFlagsOk(p.when || {})) || null;
}

function mqStreetChipHtml() {
  const chips = storyForm11()?.mqStreetChips || [];
  const hit = chips.find((c) => whenFlagsOk(c.when || {}));
  if (!hit) return "";
  return `<button class="rp-mq-street-chip" type="button" data-testid="${hit.testId || "mq-street-chip"}" data-action="open-quests">${loc(hit.chip)}</button>`;
}

function syncColdYieldBodyClass() {
  const day = state.save.dayIndex || 1;
  const y = coldShouldYield() || day >= 7 || storyFlag("cold_day2_yielded") || storyFlag("natural_volume_street");
  document.body.classList.toggle("rp-cold-yielded", !!y);
  document.body.dataset.dayIndex = String(day);
}

function headphonesPropHtml() {
  const packs = [
    ...(storyForm14()?.naturalStreetPropsHard || []),
    ...(storyForm13()?.naturalStreetPropsYield || []),
    ...(storyForm12()?.naturalStreetProps || []),
  ];
  const vol = packs.find((p) => p.testId === "story-street-headphones-note" || p.arcId === "arc_volume_war");
  if (vol) {
    const html = state.locale === "tr" && vol.htmlTr ? vol.htmlTr : vol.html || "";
    if (html) return html;
  }
  // Hard fallback — never leave Volume unlock without SVG
  const tr = state.locale === "tr";
  return `<div class="rp-stage-prop rp-stage-prop--headphones-note" data-testid="story-street-headphones-note" data-arc="arc_volume_war" data-unlock="natural" aria-label="${tr ? "KULAKLIK notu" : "HEADPHONES note"}">
    <div class="rp-note-door"><span class="rp-note-caps">${tr ? "KULAKLIK" : "HEADPHONES"}</span></div>
    <span class="rp-stage-prop__tag">${tr ? "Desibel · not" : "Decibel · note"}</span>
  </div>`;
}

function storyForm19() {
  return state.questPack?.storyForm19 || state.storyForm19 || null;
}

function cleanLedgerTrayHtml() {
  const clean = storyForm19()?.cleanLedgerTrayWinner;
  if (clean) {
    return state.locale === "tr" && clean.htmlTr ? clean.htmlTr : clean.html || "";
  }
  return "";
}

function ledgerPropHtml() {
  const clean = cleanLedgerTrayHtml();
  if (clean) return clean;
  const packs = [
    ...(storyForm14()?.naturalStreetPropsHard || []),
    ...(storyForm13()?.naturalStreetPropsYield || []),
    ...(storyForm12()?.naturalStreetProps || []),
  ];
  const led = packs.find((p) => p.testId === "story-street-ledger-tray" || p.arcId === "arc_tea_ledger");
  if (led) {
    const html = state.locale === "tr" && led.htmlTr ? led.htmlTr : led.html || "";
    if (html) return html;
  }
  return cleanLedgerTrayHtml() || `<div class="rp-stage-prop rp-stage-prop--ledger-tray rp-stage-prop--ledger-tray-winner" data-testid="story-street-ledger-tray" data-arc="arc_tea_ledger" data-unlock="natural" data-winner="ledger_natural" data-form="19" aria-label="Ledger & tray">
    <span class="rp-stage-prop__tag">MAIN 4/5 · Ledger · tray</span>
  </div>`;
}

function syncLedgerWinsBodyClass() {
  const day = state.save.dayIndex || 1;
  const on = day >= 10 || storyFlag("natural_ledger_street_wins");
  document.body.classList.toggle("rp-ledger-wins", on);
  if (on) document.body.dataset.storyWinner = "ledger_natural";
}

function armRecommendTonightCandidate() {
  const f = state.save.storyFlags || (state.save.storyFlags = {});
  const rule = storyForm19()?.armRecommendTonightCandidate;
  const lived = !!f.decibel_lived_beat_done;
  // ensureLedgerTeaseOnLived: lived beat also seeds ledger tease so candidate can arm
  if (lived && rule?.ensureLedgerTeaseOnLived?.setsFlags) {
    for (const k of rule.ensureLedgerTeaseOnLived.setsFlags) f[k] = true;
  }
  const tease =
    !!f.quest_ledger_tease ||
    !!f.week2_decibel_ledger_seen ||
    !!f.natural_ledger_street ||
    !!f.natural_ledger_street_wins;
  if (lived && tease) f.would_recommend_tonight_candidate = true;
  return !!f.would_recommend_tonight_candidate;
}

function storyForm15() {
  return state.questPack?.storyForm15 || state.storyForm15 || null;
}

function storyForm16() {
  return state.questPack?.storyForm16 || state.storyForm16 || null;
}

function storyForm17() {
  return state.questPack?.storyForm17 || state.storyForm17 || null;
}

function storyForm18() {
  return state.questPack?.storyForm18 || state.storyForm18 || null;
}

function purgeColdWorldResiduals() {
  if (!coldEchoSuppressed()) return;
  try {
    const qs = Quests.ensureQuestSave(state.save);
    const ban = storyForm18()?.purgeSharedStringResidual?.bannedWcIds || [
      "wc_day2_mediate_shared_string",
      "wc_day2_instigate_kite_dare",
      "wc_day2_stage_cup_chalk",
    ];
    qs.worldActive = (qs.worldActive || []).filter((id) => !ban.includes(id));
  } catch { /* */ }
}

function week2DecibelLedgerPullHtml(screen) {
  const day = state.save.dayIndex || 1;
  // Day10+ ledger wins — don't stack HEADPHONES→LEDGER chips over bust rail
  if (day >= 10 || storyFlag("natural_ledger_street_wins") || storyFlag("quest_ledger_complete")) return "";
  const pull = storyForm18()?.week2DecibelLedgerPull;
  if (!pull || !(pull.screens || []).includes(screen)) return "";
  if (!whenFlagsOk(pull.when || {})) return "";
  state.save.storyFlags = state.save.storyFlags || {};
  for (const f of pull.setsFlagsOnShow || []) state.save.storyFlags[f] = true;
  // One dock-floor caption only — skip mid-stage LEDGER?/WEEK-2 chip stack (visual PF)
  const npc = pull.npcReactions?.[0];
  const npcHtml = npc
    ? `<p class="rp-handoff-npc rp-yield-line rp-yield-caption" data-testid="${npc.testId}" data-caption-kind="volume" data-yield-caption="1"><strong>${loc(neighborById(npc.speakerId)?.name) || npc.neighbor || ""}</strong>: ${loc(npc.text)}</p>`
    : "";
  return npcHtml;
}

function recommendTonightBarHtml() {
  const bar = storyForm18()?.cultRecommendTonightBar?.recommendTonight;
  if (!bar || !whenFlagsOk(bar.showWhen || {})) return "";
  armRecommendTonightCandidate();
  const candidate = !!storyFlag("would_recommend_tonight_candidate");
  const form19Copy = storyForm19()?.armRecommendTonightCandidate?.bar?.copy;
  const copy = candidate
    ? form19Copy || bar.copyWhenCandidate
    : bar.copyWhenClimbing;
  return `<div class="rp-recommend-tonight-bar" data-testid="${bar.testId || "recommend-tonight-bar"}" data-candidate="${candidate ? "true" : "false"}" data-cult-slot="under-rail">${loc(copy)}</div>`;
}

function armMech15DecibelLived() {
  const f = state.save.storyFlags || (state.save.storyFlags = {});
  if (f.decibel_lived_beat_done) return;
  const vol =
    f.quest_volume_active ||
    f.quest_volume_accepted ||
    f.natural_volume_street ||
    document.body.classList.contains("rp-cold-yielded");
  const prop = document.querySelector(
    "[data-testid='story-street-headphones-note'], .rp-stage-prop--headphones-note"
  );
  if (!vol || !prop) return;
  const fire = (choice) => {
    if (f.decibel_lived_beat_done) return;
    f.decibel_lived_beat_done = true;
    prop.classList.add("rp-prop--decibel-lived", "is-reacting");
    prop.dataset.decibelLivedBeat = "1";
    prop.dataset.decibelReaction = "headphones-bass";
    prop.setAttribute("data-decibel-lived-beat", "1");
    prop.setAttribute("data-testid", prop.getAttribute("data-testid") || "decibel-lived-prop");
    const pick = choice || "peri_quiet";
    if (pick === "orhan_volume") {
      f.decibel_lived_orhan_volume = true;
      f.orhan_week2_ledger_pull = true;
    } else {
      f.decibel_lived_peri_quiet = true;
      f.secret_peri_offer_tease = true;
      f.peri_week2_ledger_pull = true;
    }
    f.week2_decibel_ledger_seen = true;
    f.quest_ledger_tease = true;
    armRecommendTonightCandidate();
    const snap = {
      beat: true,
      choice: pick,
      periQuiet: !!f.decibel_lived_peri_quiet,
      orhanVolume: !!f.decibel_lived_orhan_volume,
    };
    try {
      window.__RP_SMOKE__ = { ...(window.__RP_SMOKE__ || {}), decibelLived: snap };
      localStorage.setItem("rp_smoke_decibel_lived", JSON.stringify(snap));
    } catch { /* */ }
    const chips = document.querySelector("[data-testid='decibel-lived-choice']");
    if (chips) chips.remove();
    saveNow();
    // Live-update recommend bar — street was painted before lived/tease armed
    const bar = document.querySelector("[data-testid='recommend-tonight-bar']");
    if (bar && f.would_recommend_tonight_candidate) {
      bar.setAttribute("data-candidate", "true");
      const form19Copy = storyForm19()?.armRecommendTonightCandidate?.bar?.copy;
      const climbBar = storyForm18()?.cultRecommendTonightBar?.recommendTonight;
      const copy = form19Copy || climbBar?.copyWhenCandidate;
      if (copy) bar.textContent = loc(copy);
    }
  };
  prop.classList.add("rp-prop--decibel-cue");
  if (!document.querySelector("[data-testid='decibel-lived-choice']")) {
    const wrap = document.createElement("div");
    wrap.dataset.testid = "decibel-lived-choice";
    wrap.setAttribute("data-testid", "decibel-lived-choice");
    wrap.innerHTML = `<button type="button" class="rp-btn rp-btn--ghost" data-decibel-pick="peri_quiet">${state.locale === "tr" ? "Peri için sessiz" : "Quiet cans for Peri"}</button>
      <button type="button" class="rp-btn rp-btn--ghost" data-decibel-pick="orhan_volume">${state.locale === "tr" ? "Orhan kısar" : "Orhan turns it down"}</button>`;
    wrap.addEventListener("click", (e) => {
      const t = e.target?.closest?.("[data-decibel-pick]");
      if (t) fire(t.getAttribute("data-decibel-pick"));
    });
    (document.querySelector(".rp-screen--street .rp-dock") || prop.parentElement || document.body).appendChild(wrap);
  }
  prop.addEventListener("click", () => fire(state._decibelChip || "peri_quiet"), { once: true });
  setTimeout(() => fire("peri_quiet"), 4000);
}

function applyForm16AntennaFailsafe() {
  const day = state.save.dayIndex || 1;
  const f = state.save.storyFlags || (state.save.storyFlags = {});
  if (day < 4) return;
  if (!["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some(storyFlag)) return;
  if (f.arc_kite_antenna_complete || f.natural_antenna_complete) return;
  for (const k of [
    "natural_antenna_complete",
    "arc_kite_antenna_complete",
    "quest_antenna_complete",
    "arc_kite_antenna_beat4",
    "cold_day2_yielded",
    "natural_volume_street",
  ]) {
    f[k] = true;
  }
}

function coldEchoSuppressed() {
  const day = state.save.dayIndex || 1;
  if (day >= 7) return true;
  if (["cold_day2_yielded", "natural_volume_street", "natural_ledger_street"].some(storyFlag)) return true;
  try {
    const w = pickUnifiedStoryWinner();
    return !!(w && ["volume_natural", "ledger_natural", "av_handoff", "vl_handoff", "volume_beat_prop"].includes(w.id));
  } catch {
    return false;
  }
}

function syncVolumeAcceptBodyClass() {
  const pending =
    !storyFlag("quest_volume_accepted") &&
    !storyFlag("arc_volume_war_complete") &&
    (storyFlag("cold_day2_yielded") || storyFlag("natural_volume_street") || (state.save.dayIndex || 1) >= 7);
  document.body.classList.toggle("rp-volume-pending-accept", pending);
  document.body.classList.toggle("rp-volume-accepted", !!storyFlag("quest_volume_accepted"));
}

/** story-form-14/15 — cold yields; headphones without flag inject */
function pickUnifiedStoryWinner() {
  // HOTFIX form15: day≥7 / antenna gate → headphones or ledger WITHOUT flag inject
  (function form15YieldPaint() {
    const day = state.save.dayIndex || 1;
    state.save.storyFlags = state.save.storyFlags || {};
    document.body.dataset.dayIndex = String(day);
    if (day >= 7 || (day >= 3 && [
      "arc_kite_antenna_complete","quest_antenna_complete","arc_kite_antenna_beat4",
      "flag_fence_and_kite","flag_kite_chaos_buff","natural_antenna_complete","cold_day2_yielded"
    ].some((k) => state.save.storyFlags[k]))) {
      state.save.storyFlags.cold_day2_yielded = true;
      state.save.storyFlags.natural_volume_street = true;
      document.body.classList.add("rp-cold-yielded");
    }
    if (day >= 10) {
      state.save.storyFlags.natural_ledger_street = true;
      state.save.storyFlags.natural_ledger_street_wins = true;
      state.save.storyFlags.quest_ledger_tease = true;
      state.save.storyFlags.arc_tea_ledger_seed = true;
    }
  })();
  {
    const day = state.save.dayIndex || 1;
    const props = storyForm15()?.inlineStreetProps || [];
    // Day10+: ALWAYS clean ledger tray winner — never fall through to headphones
    if (day >= 10) {
      const html = cleanLedgerTrayHtml() || ledgerPropHtml();
      document.body.classList.add("rp-ledger-wins");
      document.body.dataset.storyWinner = "ledger_natural";
      if (html) {
        state.save.storyFlags = state.save.storyFlags || {};
        state.save.storyFlags.natural_ledger_street = true;
        state.save.storyFlags.natural_ledger_street_wins = true;
        state.save.storyFlags.quest_ledger_tease = true;
        return { id: "ledger_natural", html, npc: "", suppressBanner: true, suppressSpotlight: true };
      }
    }
    if (day >= 7 && day < 10 || (day >= 3 && day < 10 && storyFlag("cold_day2_yielded"))) {
      const vol = props.find((p) => p.testId === "story-street-headphones-note");
      if (vol) {
        const html = state.locale === "tr" && vol.htmlTr ? vol.htmlTr : vol.html;
        if (html) return { id: "volume_natural", html, npc: "", suppressBanner: true, suppressSpotlight: true };
      }
      // fallback to existing hard HTML helpers
      const fb = headphonesPropHtml();
      if (fb) return { id: "volume_natural", html: fb, npc: "", suppressBanner: true, suppressSpotlight: true };
    }
  }
  applyNaturalArcStreetUnlock();
  syncColdYieldBodyClass();
  const day = state.save.dayIndex || 1;
  const yielded = coldShouldYield() || day >= 7 || storyFlag("cold_day2_yielded") || storyFlag("natural_volume_street");

  // 1) Cold only if NOT yielded
  if (!yielded && coldPropStillWins()) {
    const html = day2StreetStageHtml();
    if (html) return { id: "cold_day2_prop", html, npc: "", suppressBanner: true, suppressSpotlight: true };
  }

  // 2) Ledger natural (day≥10 / wins flag)
  if (day >= 10 || storyFlag("natural_ledger_street_wins")) {
    const html = ledgerPropHtml();
    if (html) {
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.natural_ledger_street = true;
      return { id: "ledger_natural", html, npc: "", suppressBanner: true, suppressSpotlight: true };
    }
  }

  // 3) Volume natural headphones — calendar or antenna gate
  const antennaDone = [
    "arc_kite_antenna_complete",
    "quest_antenna_complete",
    "natural_antenna_complete",
    "arc_kite_antenna_beat4",
    "flag_fence_and_kite",
    "flag_kite_chaos_buff",
  ].some((f) => storyFlag(f));
  if (yielded || day >= 7 || (day >= 3 && antennaDone)) {
    const html = headphonesPropHtml();
    if (html) {
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.natural_volume_street = true;
      state.save.storyFlags.cold_day2_yielded = true;
      return { id: "volume_natural", html, npc: "", suppressBanner: true, suppressSpotlight: true };
    }
  }

  // 4) Fall through handoff / beat props
  const beat = streetHandoffBeatLive("street");
  if (beat && yielded) {
    state.save.storyFlags = state.save.storyFlags || {};
    for (const f of beat.setsFlagsOnShow || []) state.save.storyFlags[f] = true;
    const prop = beat.stageProp || {};
    const propHtml = state.locale === "tr" && prop.htmlTr ? prop.htmlTr : prop.html || "";
    const ban = beat.compactBanner;
    const banHtml = ban
      ? `<div class="rp-handoff-banner" data-testid="${ban.testId || "street-av-handoff-banner"}">
          <p class="rp-handoff-banner__h">${loc(ban.headline)}</p>
          <p>${loc(ban.body)}</p>
          <button class="rp-handoff-banner__cta" type="button" data-action="handoff-cta" data-beat="${beat.id}" data-neighbor="${ban.ctaNeighborId || "n3"}">${loc(ban.cta)}</button>
        </div>`
      : "";
    return { id: beat.id === "handoff_volume_to_ledger" ? "vl_handoff" : "av_handoff", html: `${propHtml}${banHtml}`, npc: "", suppressBanner: true, suppressSpotlight: true };
  }

  const vol = volumeStreetBeatPropLive();
  if (vol) {
    const html = state.locale === "tr" && vol.htmlTr ? vol.htmlTr : vol.html || "";
    return { id: "volume_beat_prop", html, npc: "", suppressBanner: true, suppressSpotlight: true };
  }
  return null;
}

function streetArcStagePropsHtml() {
  const winner = pickUnifiedStoryWinner();
  if (winner) {
    document.body.classList.add("rp-story-one-signal");
    document.body.classList.toggle("rp-handoff-av", winner.id === "av_handoff");
    document.body.classList.toggle("rp-handoff-vl", winner.id === "vl_handoff");
    return `<div class="street-story-one-signal" data-testid="street-story-one-signal" data-winner="${winner.id}">${winner.html || ""}${winner.npc || ""}</div>`;
  }
  document.body.classList.remove("rp-story-one-signal", "rp-handoff-av", "rp-handoff-vl");
  const props = storyForm9()?.streetArcStageProps || [];
  if (!props.length) return "";
  const coldShowing = isColdDay2();
  const hit = props
    .filter((p) => (p.screens || ["street"]).includes("street"))
    .filter((p) => whenFlagsOk(p.when || {}))
    .filter((p) => !(coldShowing && p.arcId === "arc_kite_antenna"))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  if (!hit) return "";
  return state.locale === "tr" && hit.htmlTr ? hit.htmlTr : hit.html || "";
}

function arcJournalBeatsHtml(cards, listTestId) {
  if (!cards?.length) return "";
  const live = liveBeatFromCards(cards)?.beatId;
  return `<div class="antenna-beat-list" data-testid="${listTestId}">
    ${cards
      .map((c) => {
        const done = c.doneFlag ? storyFlag(c.doneFlag) : (c.doneFlagAny || []).some((f) => storyFlag(f));
        const isLive = c.beatId === live;
        return `<article class="antenna-beat-card ${done ? "is-done" : ""} ${isLive ? "is-live" : ""}" data-testid="${c.testId}">
        <h4>${loc(c.title)}</h4>
        <p>${loc(c.scene)}</p>
        ${isLive ? `<button class="btn btn-ember" type="button" data-action="open-neighbor" data-id="${c.cast?.[0] || "n3"}">${loc(c.cta)}</button>` : ""}
      </article>`;
      })
      .join("")}
  </div>`;
}

function antennaOpJournalHtml() {
  const f7 = storyForm7();
  const f8 = storyForm8();
  const handoffCard = (() => {
    const beat = (storyForm10()?.streetHandoffBeats || []).find((b) => b.id === "handoff_antenna_to_volume");
    const card = beat?.journalCard;
    if (!card || !(storyFlag("street_av_handoff_seen") || storyFlag("arc_kite_antenna_complete"))) return "";
    return `<article class="antenna-beat-card" data-testid="${card.testId || "journal-av-handoff"}">
      <h4>${loc(card.title)}</h4>
      <p>${loc(card.body)}</p>
    </article>`;
  })();
  return (
    arcJournalBeatsHtml(f7?.antennaOpJournalBeatCards, "antenna-op-journal-beats") +
    handoffCard +
    arcJournalBeatsHtml(f8?.volumeOpJournalBeatCards, "volume-op-journal-beats") +
    arcJournalBeatsHtml(f8?.ledgerOpJournalBeatCards, "ledger-op-journal-beats")
  );
}

function whenFlagsOk(when = {}) {
  const day = state.save.dayIndex || 1;
  if (when.dayIndexMin != null && day < when.dayIndexMin) return false;
  if (when.dayIndexMax != null && day > when.dayIndexMax) return false;
  if (when.dayIndex != null && day !== when.dayIndex) return false;
  if (when.flagsAll?.length && !when.flagsAll.every((f) => storyFlag(f))) return false;
  if (when.flagsAny?.length && !when.flagsAny.some((f) => storyFlag(f))) return false;
  if (when.flagsNone?.length && when.flagsNone.some((f) => storyFlag(f))) return false;
  // story-form-12: naturalAny = OR of day/flag branches (calendar unlock)
  if (when.naturalAny?.length) {
    const natOk = when.naturalAny.some((branch) => whenFlagsOk(branch));
    if (!natOk) return false;
  }
  return true;
}

function applyNaturalAntennaAdvance() {
  const rules = storyForm13()?.naturalAntennaAdvance?.rules || [];
  const day = state.save.dayIndex || 1;
  state.save.storyFlags = state.save.storyFlags || {};
  const f = state.save.storyFlags;
  // Count cold evenings via dayIndex as proxy (no separate counter needed)
  for (const r of rules) {
    if (!whenFlagsOk(r.when || {})) continue;
    for (const flag of r.setsFlags || []) f[flag] = true;
  }
  if (day >= 7) {
    f.natural_antenna_complete = true;
    f.arc_kite_antenna_complete = true;
    f.cold_day2_yielded = true;
    f.natural_volume_street = true;
  } else if (day >= 4 && ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some((k) => f[k])) {
    if (!f.arc_kite_antenna_complete && !f.natural_antenna_complete) {
      f.arc_kite_antenna_beat4 = true;
      f.arc_kite_antenna_complete = true;
      f.quest_antenna_complete = true;
      f.natural_antenna_complete = true;
      f.cold_day2_yielded = true;
      f.natural_volume_street = true;
    }
  } else if (day >= 3 && ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some((k) => f[k])) {
    if (!f.arc_kite_antenna_complete) {
      f.arc_kite_antenna_beat3 = true;
      f.quest_antenna_active = true;
    }
  }
}

function applyNaturalArcStreetUnlock() {
  applyNaturalAntennaAdvance();
  const day = state.save.dayIndex || 1;
  state.save.storyFlags = state.save.storyFlags || {};
  const f = state.save.storyFlags;
  const antennaDone = [
    "arc_kite_antenna_complete",
    "quest_antenna_complete",
    "arc_kite_antenna_beat4",
    "flag_fence_and_kite",
    "flag_kite_chaos_buff",
    "natural_antenna_complete",
  ].some((k) => f[k]);
  if ((day >= 3 && antennaDone) || day >= 7 || coldShouldYield()) {
    f.natural_volume_street = true;
    f.cold_day2_yielded = true;
    f.quest_volume_tease = true;
    f.arc_volume_war_seed = true;
  }
  if (day >= 7) {
    f.week2_volume_seed = true;
  }
  if ((day >= 5 && f.natural_volume_street) || day >= 10) {
    f.natural_ledger_street = true;
    f.quest_ledger_tease = true;
    f.arc_tea_ledger_seed = true;
  }
  if (day >= 10) {
    f.natural_ledger_street_wins = true;
    f.week2_ledger_seed = true;
  }
  if (f.natural_volume_street) {
    f.volumeStreetDaysSeen = (f.volumeStreetDaysSeen || 0);
  }
  document.body.classList.toggle("rp-cold-yielded", !!f.cold_day2_yielded || coldShouldYield());
}

function naturalStreetPropLive() {
  const props = storyForm12()?.naturalStreetProps || [];
  const hits = props.filter((p) => whenFlagsOk(p.when || {})).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  if (!hits.length) return null;
  // one-layer: volume then ledger
  const day = state.save.dayIndex || 1;
  const vol = hits.find((p) => p.arcId === "arc_volume_war");
  const led = hits.find((p) => p.arcId === "arc_tea_ledger");
  if (vol && led) {
    const seen = state.save.storyFlags?.volumeStreetDaysSeen || 0;
    if (seen >= 2 || day >= 5) return led;
    return vol;
  }
  return hits[0];
}

/** form6 wins instigate/stage SVG; form5 mediate shared-string stays. */
function day2StreetStagePropsMerged() {
  const f5 = storyForm5()?.day2StreetStageProps || {};
  const f6 = storyForm6()?.day2StreetStageProps || {};
  return { ...f5, ...f6 };
}

function day2HotspotMutationsMerged() {
  const f5 = storyForm5()?.hotspotMutations || {};
  const f6 = storyForm6()?.hotspotMutations || {};
  return { ...f5, ...f6 };
}

/** story-form-5/6: SVG/lived stage prop — NOT chip-only / emoji stubs. */
function day2StreetStageHtml() {
  const day = state.save.dayIndex || 1;
  if (day < 2) return "";
  // HOTFIX form15
  if (day >= 7) return "";
  if (day >= 3 && [
    "arc_kite_antenna_complete","quest_antenna_complete","arc_kite_antenna_beat4",
    "flag_fence_and_kite","flag_kite_chaos_buff","natural_antenna_complete","cold_day2_yielded"
  ].some((f) => storyFlag(f))) return "";
  if (coldShouldYield() || !coldPropStillWins()) return "";
  const props = day2StreetStagePropsMerged();
  if (!Object.keys(props).length) return "";
  const pick = storyFlag("cold_open_mediate")
    ? props.mediate
    : storyFlag("cold_open_instigate")
      ? props.instigate
      : storyFlag("cold_open_stage")
        ? props.stage
        : null;
  if (!pick || !whenFlagsOk(pick.when || { dayIndexMin: 2 })) return "";
  return state.locale === "tr" && pick.htmlTr ? pick.htmlTr : pick.html || "";
}

function mutateHotspotHtml(n, baseBtnHtml) {
  // form17: after yield, never re-attach mediate Orhan / cold bubbles
  if (coldEchoSuppressed()) return baseBtnHtml;
  const muts = day2HotspotMutationsMerged();
  const mut = Object.values(muts).find(
    (m) =>
      whenFlagsOk(m.when || { dayIndexMin: 2 }) &&
      (m.neighborId === n.id || m.alsoNeighborId === n.id)
  );
  if (!mut) return baseBtnHtml;
  const isPrimary = mut.neighborId === n.id;
  const bubble = isPrimary ? mut.speechBubble : mut.alsoSpeechBubble;
  const cls = isPrimary ? mut.addClass || [] : mut.alsoAddClass || [];
  const tid = isPrimary ? mut.testId : mut.alsoTestId || "";
  const suffix = isPrimary && mut.nameSuffix ? loc(mut.nameSuffix) : "";
  let html = baseBtnHtml;
  if (cls.length) html = html.replace('class="rp-hotspot', `class="rp-hotspot ${cls.join(" ")}`);
  if (suffix) {
    html = html.replace(
      new RegExp(`(rp-hotspot__name">)([^<]*)`),
      (_, a, name) => `${a}${name}${suffix}`
    );
  }
  // visual-fix-11: never mount on-bust bubbles on Day2 — dedicated .rp-day2-line instead
  if (isColdDay2() || (state.save.dayIndex || 1) === 2) {
    return html;
  }
  const bub = bubble
    ? `<span class="rp-hotspot__bubble"${tid ? ` data-testid="${tid}"` : ""}>${loc(bubble)}</span>`
    : "";
  return html.replace("</button>", `${bub}</button>`);
}

function pickDay2EnterSpotlight() {
  const f5 = storyForm5();
  const f6 = storyForm6();
  const map = {
    ...(f5?.day2EnterSpotlights || {}),
    ...(f6?.day2EnterSpotlights || {}),
  };
  if (f5?.day2EnterSpotlight && !map.mediate) map.mediate = f5.day2EnterSpotlight;
  if (storyFlag("cold_open_mediate") && map.mediate) return map.mediate;
  if (storyFlag("cold_open_instigate") && map.instigate) return map.instigate;
  if (storyFlag("cold_open_stage") && map.stage) return map.stage;
  return f5?.day2EnterSpotlight || null;
}

function day2EnterSpotlightHtml(screen = "street") {
  // story-form-8/9: props never require spotlight; cold Day2 default hidden
  if (storyFlag("hide_day2_spotlight") || storyForm8()?.noSpotlightProve?.forceHideSpotlight) return "";
  if (isColdDay2() && (storyForm9()?.spotlightPolicy?.defaultWhenColdDay2 || "hidden") === "hidden") return "";
  if (isColdDay2() && storyForm9()?.streetLayerPriority?.suppressSpotlightWhenColdProp !== false) return "";
  const spot = pickDay2EnterSpotlight();
  if (!spot || !(spot.screens || ["street"]).includes(screen)) return "";
  if (!whenFlagsOk(spot.when)) return "";
  return `<div class="rp-day2-spotlight" data-testid="${spot.testId || "story-day2-enter-spotlight"}" role="dialog">
    <h3>${loc(spot.title)}</h3>
    <p>${loc(spot.body)}</p>
    <button class="rp-btn rp-btn--primary" type="button" data-action="ack-day2-spotlight">${loc(spot.ackLabel)}</button>
  </div>`;
}

function pickOvernightColdConsequence() {
  const form = state.questPack?.storyForm4 || state.storyForm4;
  const rows = form?.overnightColdConsequences || [];
  return rows.find((r) => (r.when?.flagsAll || []).every((f) => storyFlag(f))) || null;
}

function overnightColdHtml(cold) {
  if (!cold) return "";
  const lines = (cold.lines || []).map((l) => `<li>${loc(l)}</li>`).join("");
  const npc = cold.npcLine
    ? `<p class="rp-prop-npc">${loc(neighborById(cold.npcLine.speakerId)?.name) || ""}: ${loc(cold.npcLine.text)}</p>`
    : "";
  return `<div class="rp-overnight-cold" id="rp-overnight-cold" data-testid="overnight-cold" data-cold="${cold.id}">
    <p class="rp-kicker">${loc(cold.kicker)}</p>
    <h3 class="rp-night-title">${loc(cold.title)}</h3>
    <ul class="rp-ticks">${lines}</ul>
    <div class="rp-prop-overlay"><span class="rp-prop-chip">${loc(cold.propLabel)}</span>${npc}</div>
  </div>`;
}

function forceOvernightStoryProve() {
  const flags = state.save.storyFlags || (state.save.storyFlags = {});
  const cold = ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some((f) => flags[f]);
  if (!cold) {
    toast(state.locale === "tr" ? "cold_open_* yok" : "No cold_open_* flag");
    return;
  }
  if ((state.save.dayIndex || 1) !== 1) {
    renderOvernight({ lines: [], tease: "" });
    return;
  }
  state.save.dayIndex = 2;
  state.save.weekNumber = weekNumber();
  state.save.evening = {
    checkin: false, visits: [], streetEvent: false, errand: false,
    secondBeat: false, cupDone: false, cupEveDone: false, complete: false,
  };
  state.save.visitedArcToday = {};
  flags.overnight_story_prove_used = true;
  applyDay2ColdRewrite();
  saveNow();
  renderOvernight({ lines: [], tease: "" });
}

function overnightSpineHook() {
  const tr = state.locale === "tr";
  const antennaDone = storyFlag("quest_antenna_complete") || storyFlag("arc_kite_antenna_complete");
  const volumeDone = storyFlag("quest_volume_complete") || storyFlag("arc_volume_war_complete");
  const antennaActive = storyFlag("quest_antenna_active") || !!Quests.ensureQuestSave(state.save).active?.mq_antenna_op;
  const volumeActive = storyFlag("quest_volume_active") || !!Quests.ensureQuestSave(state.save).active?.mq_decibel_accord;
  if (antennaDone && !volumeDone && !volumeActive) {
    return {
      title: tr ? "Gece · Bas geliyor" : "Night · Bass incoming",
      hook: tr
        ? "Desibel Antlaşması açıldı — Peri ↔ uyku. Defter sonra."
        : "Decibel Accord open — Peri ↔ sleep. Ledger after.",
    };
  }
  if (antennaActive && !antennaDone) {
    return {
      title: tr ? "Gece iki · İp duruyor" : "Night two · The line holds",
      hook: tr ? "Anten bitmedi. Desibel seni bekliyor." : "Antenna isn't done. Volume is waiting.",
    };
  }
  if (volumeActive && !volumeDone) {
    return {
      title: tr ? "Gece · KULAKLIK" : "Night · HEADPHONES",
      hook: tr
        ? "Ses savaşı sürüyor; Defter ve Tepsi sırada."
        : "Volume war continues; Ledger & Tray next.",
    };
  }
  return {
    title: tr ? "Gece yazdı · Omurga devam" : "Night wrote · Spine continues",
    hook: tr
      ? "Sabah Anten Operasyonu — sonra Desibel, sonra Defter."
      : "Morning: Antenna Op — then Volume, then Ledger.",
  };
}

function spineCultChipHtml() {
  const day = state.save.dayIndex || 1;
  if (day < 2) return "";
  const tr = state.locale === "tr";
  // form19: Day10+ MAIN 4/5 Ledger & Tray
  if (day >= 10 || storyFlag("natural_ledger_street_wins")) {
    const main = storyForm19()?.cleanLedgerTrayWinner?.mainBar;
    const label = main
      ? loc(main)
      : tr
        ? "MAIN 4/5 · Defter & Tepsi"
        : "MAIN 4/5 · Ledger & Tray";
    return `<p class="rp-spine-cult-chip" data-testid="spine-cult-chip">${label}</p>`;
  }
  const upgrade = storyForm18()?.cultRecommendTonightBar?.spineCultUpgrade;
  if (
    upgrade &&
    (storyFlag("quest_volume_accepted") || storyFlag("week2_decibel_ledger_seen")) &&
    (upgrade.whenFlagsAny || []).some((f) => storyFlag(f))
  ) {
    return `<p class="rp-spine-cult-chip" data-testid="${upgrade.testId || "spine-cult-chip"}">${loc(upgrade.label)}</p>`;
  }
  let n = 1;
  if (storyFlag("quest_antenna_complete") || storyFlag("arc_kite_antenna_complete")) n = 3;
  else if (storyFlag("quest_antenna_active") || day >= 2) n = 2;
  if (storyFlag("quest_volume_complete") || storyFlag("arc_volume_war_complete")) n = 4;
  else if (storyFlag("quest_volume_active") || storyFlag("quest_volume_accepted")) n = 3;
  if (storyFlag("quest_ledger_complete")) n = 5;
  const label = tr
    ? `Omurga ${n}/5 · Anten → Desibel → Defter`
    : `Spine ${n}/5 · Antenna → Volume → Ledger`;
  return `<p class="rp-spine-cult-chip" data-testid="spine-cult-chip">${label}</p>`;
}

function renderOvernight(payoff) {
  const screen = document.getElementById("screen-overnight");
  const tr = state.locale === "tr";
  applyDay2ColdRewrite();
  applyNaturalArcStreetUnlock();
  syncColdYieldBodyClass();
  saveNow();
  const cold = pickOvernightColdConsequence();
  const spine = overnightSpineHook();
  const teaser = Density.pickOvernightTeaser(state.densityPack, state.save, state.questPack);
  const form5Teasers = storyForm5()?.overnightTeasersAppend || [];
  const form4Teasers = state.questPack?.storyForm4?.overnightTeasersAppend || [];
  const form5Hit = form5Teasers.find((r) => whenFlagsOk(r.when || { flagsAll: r.when?.flagsAll }));
  const form4Hit = form4Teasers.find((r) => (r.when?.flagsAll || []).every((f) => storyFlag(f)));
  // ux-9: spine hook beats generic coin teasers
  const useTeaser = null;
  const echo = Density.pickEcho(state.densityPack, state.save, state.questPack, "overnight_wake");
  const whisper = questHudWhisper();
  const bitsSrc = [
    spine.hook,
    ...(payoff?.lines || []).slice(0, 1),
    echo ? loc(echo.body) : null,
  ]
    .filter(Boolean)
    .slice(0, 3);
  const bits = bitsSrc.map((l) => `<li>${l}</li>`).join("") || `<li>${tr ? "Mahalle uyudu." : "The block slept."}</li>`;
  const tomorrow = spine.title;
  const hook = spine.hook;
  void form5Hit;
  void form4Hit;
  void teaser;
  void useTeaser;
  screen.innerHTML = `
    ${stageLayer("street", true)}
    ${streetPropOverlayHtml("overnight")}
    <div class="rp-overnight" data-testid="overnight">
      <p class="rp-kicker">${tr ? "Gece geçti" : "Night passed"}</p>
      <h2 class="rp-night-title">${tomorrow}</h2>
      ${spineCultChipHtml()}
      <p class="overnight-quest-pull" data-testid="overnight-spine-hook">◎ ${hook}</p>
      ${cold ? overnightColdHtml(cold) : ""}
      <ul class="rp-ticks">${bits}</ul>
      <p class="evening-cup-tease">${whisper ? (tr ? "Yarım kalan: " : "Still open: ") + whisper : ""}</p>
      <button class="rp-btn rp-btn--primary" type="button" data-action="goto-evening" data-testid="overnight-enter-evening">${tr ? "Yeni akşama gir" : "Enter the new evening"}</button>
    </div>`;
  saveNow();
  showScreen("screen-overnight");
}


function renderEvening() {
  EndEvening.normalizePracticeFlags(state.save);
  if (state.meta?.lastCupWasPractice || state.save.evening?.cupDone) {
    if (!storyFlag("practice_cup_done") || !storyFlag("syn_taught_syn_rivalry")) {
      Ux4.forcePracticeFlags(state, "render_evening_heal");
    }
  }
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
  // story-form-2/18: cold eveningBanner only before yield — never under Volume CTA
  if (!coldEchoSuppressed()) {
    if (day2Branch?.eveningBanner) hook = day2Branch.eveningBanner;
    else if (day2Branch?.eveningHook) hook = day2Branch.eveningHook;
  }

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
  let support = !nightOne
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
  if (cta.support) support = cta.support;
  if (cta.acceptIfNeeded && cta.questId) {
    try { Quests.acceptQuest(state.save, state.questPack, cta.questId); } catch { /* */ }
  }
  const endEnabled = !!st.endEveningEnabled;
  const practiceCleared = !!(storyFlag("practice_cup_done") && storyFlag("syn_taught_syn_rivalry"));
  const dayNow = state.save.dayIndex || 1;
  // ux-10 sole_end only Day1; ux-11 Day2+ uses spine_one (Volume/HEADPHONES)
  const soleEnd = practiceCleared && endEnabled && dayNow <= 1;
  document.body.dataset.eveningMode = soleEnd ? "sole_end" : "spine_one";
  const endLabel =
    loc(state.uxPack2?.strings?.["evening.cta.end"]) ||
    (state.locale === "tr" ? "Akşamı bırak" : "End evening");
  const lockedCopy = loc(state.uxPack2?.strings?.["gate.end_evening.practice"]) ||
    uxStr(
      "evening.locked",
      state.locale === "tr" ? "Akşam bitmez — Cem Prova'da düdük çalıyor." : "Evening won't end — Cem's still whistling Practice."
    );
  // Day2+ spine: prefer Volume/HEADPHONES CTA even if End evening is unlocked
  const useSpinePrimary = !soleEnd && cta && cta.id !== "end_evening" && (dayNow >= 2);
  const primaryAction = soleEnd ? "end-evening" : cta.action;
  const primaryLabel = soleEnd ? endLabel : cta.label;
  const primaryTestId = "evening-primary";
  const supportLine = soleEnd
    ? (state.locale === "tr" ? "Prova bitti. Akşamı bırak — omurga gece yazar." : "Practice done. End evening — the spine writes overnight.").slice(0, 90)
    : (support || "").slice(0, state.uxPack7?.eveningHome?.maxSupportChars || 90);
  // HOTFIX form16 + ux-13: compact Volume accept ≤35vh; defer tray reward
  applyForm16AntennaFailsafe();
  const dayF16 = state.save.dayIndex || 1;
  if (dayF16 >= 7) {
    state.save.storyFlags = state.save.storyFlags || {};
    state.save.storyFlags.cold_day2_yielded = true;
    state.save.storyFlags.natural_volume_street = true;
  }
  const volUnlocked =
    dayF16 >= 7 ||
    ["cold_day2_yielded", "natural_volume_street", "natural_antenna_complete", "arc_kite_antenna_complete", "quest_antenna_complete"].some(storyFlag);
  const volAlready = ["quest_volume_accepted", "arc_volume_war_complete", "volume_accept_dismissed"].some(storyFlag);
  const showVolAccept = !soleEnd && volUnlocked && !volAlready;
  const echoOff = coldEchoSuppressed();
  if (showVolAccept) document.body.dataset.eveningPanel = "volume-accept";
  else delete document.body.dataset.eveningPanel;
  if (echoOff) document.body.classList.add("rp-cold-yielded");

  syncVolumeAcceptBodyClass();
  const trayDeferred = showVolAccept && !!mainAgenda?.ready;
  const overflowOpen = !!state.eveningOverflowOpen;
  const overflowSheet = overflowOpen
    ? `<div class="rp-overflow-sheet" data-testid="evening-overflow-sheet">
        <button class="rp-btn rp-btn--ghost" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
        <button class="rp-btn rp-btn--ghost" type="button" data-action="open-story-log">${state.locale === "tr" ? "Günlük" : "Journal"}</button>
        <button class="rp-btn rp-btn--ghost" type="button" data-action="goto-street">${state.locale === "tr" ? "Sokak" : "Street"}</button>
        <button class="rp-btn rp-btn--ghost" type="button" data-action="open-shop">${state.locale === "tr" ? "Dükkan" : "Shop"}</button>
        ${
          trayDeferred
            ? `<button class="rp-btn rp-btn--ghost" type="button" data-action="open-quests" data-testid="overflow-tray-reward">${state.locale === "tr" ? "Tepsi ödülü (sonra)" : "Tray reward (later)"}</button>`
            : ""
        }
      </div>`
    : "";
  const dockHtml = soleEnd
    ? `<footer class="rp-dock rp-dock--tertiary">
        <button class="rp-btn rp-btn--ghost" type="button" data-action="toggle-evening-overflow" data-testid="evening-overflow">${state.locale === "tr" ? "···" : "···"}</button>
      </footer>`
    : `<footer class="rp-dock rp-dock--tertiary">
        <button class="rp-btn rp-btn--ghost" type="button" data-action="toggle-evening-overflow" data-testid="evening-overflow">${state.locale === "tr" ? "···" : "···"}</button>
        ${
          endEnabled
            ? ""
            : cta.action !== "goto-cup"
              ? `<button class="rp-btn rp-btn--ghost ${st.cupRequired && !st.cupDone ? "rp-btn--ember" : ""}" type="button" data-action="goto-cup" data-testid="practice-match">${isCupNight() ? t("cup.season_night") : t("cup.practice")}</button>`
              : ""
        }
        ${day1EscapeChipHtml(endEnabled)}
      </footer>`;
  // ux-12/13: spine primary + End evening separate; Volume accept = compact primary (no tall card)
  const openVolLabel = state.locale === "tr" ? "Desibel'i aç" : "Open Volume";
  const seeHpLabel = state.locale === "tr" ? "KULAKLIK'ı gör" : "See HEADPHONES";
  const spinePrimaryHtml = soleEnd
    ? `<button id="btn-end-evening" class="rp-btn rp-btn--primary rp-end-evening rp-cta-primary" type="button" data-action="end-evening" data-testid="evening-primary" data-primary="true" data-next-action="end_evening" data-end-evening="1" data-end-enabled="true">${endLabel}</button>`
    : showVolAccept
      ? `<div class="rp-evening-volume-accept rp-evening-volume-accept--compact" data-testid="evening-volume-accept-cta" data-form="16">
           <button class="rp-btn rp-btn--primary rp-cta-primary" type="button" data-action="accept-volume" data-testid="evening-primary" data-primary="true" data-next-action="volume-accept">${openVolLabel}</button>
           <button class="rp-btn rp-btn--primary rp-cta-primary" type="button" data-action="accept-volume" data-testid="evening-open-volume" hidden aria-hidden="true">${openVolLabel}</button>
           <button class="rp-evening-volume-accept__link" type="button" data-action="goto-street" data-testid="evening-volume-see-headphones">${seeHpLabel}</button>
         </div>`
      : `<button class="rp-btn rp-btn--primary rp-cta-primary" type="button" data-action="${primaryAction}" data-testid="evening-primary" data-primary="true" data-next-action="${cta.dataNext || cta.id || "spine"}">${primaryLabel}</button>`;
  const endSecondaryHtml =
    !soleEnd && endEnabled
      ? `<button id="btn-end-evening" class="rp-btn rp-btn--ghost rp-cta-secondary rp-end-evening" type="button" data-action="end-evening" data-testid="end-evening" data-end-evening="1" data-end-enabled="true">${endLabel}</button>`
      : "";
  // Purge Shared string / day2 stage / banners while yielded or Volume accept live
  purgeColdWorldResiduals();
  const stageEchoHtml = soleEnd || showVolAccept || echoOff ? "" : day2StreetStageHtml();
  const bannerHtml = soleEnd || showVolAccept || echoOff ? "" : activeArcBeatBannerHtml();
  const supportHtml = showVolAccept || soleEnd ? "" : (supportLine ? `<p class="rp-mid__line">${supportLine}</p>` : "");
  const cultHtml = soleEnd || showVolAccept ? "" : spineCultChipHtml();
  const recommendHtml = showVolAccept ? "" : recommendTonightBarHtml();
  screen.innerHTML = `
    ${stageLayer("street")}
    ${hudHtml()}
    ${streetPropOverlayHtml("evening")}
    ${stageEchoHtml}
    ${bannerHtml}
    <div class="rp-mid rp-evening-card rp-evening-card--thin" data-testid="evening-mid">
      <h2 class="rp-night-title">${loc(dayHeadline())}</h2>
      ${cultHtml}
      ${recommendHtml}
      ${supportHtml}
      ${spinePrimaryHtml}
      ${endSecondaryHtml}
      ${
        !soleEnd && mainAgenda?.ready && !showVolAccept
          ? `<button class="rp-btn" type="button" data-action="quest-complete" data-id="${mainAgenda.quest.id}">${state.locale === "tr" ? "Tepsideki ödülü aç" : "Open the tray reward"}</button>`
          : ""
      }
    </div>
    ${dockHtml}
    ${overflowSheet}
    ${endEnabled || soleEnd ? "" : `<p class="street-hint" data-testid="end-evening-hint">${lockedCopy}</p>`}
  `;
  if (endEnabled) document.documentElement.dataset.endEnabled = "true";
  else document.documentElement.dataset.endEnabled = "false";
  requestAnimationFrame(() => {
    Ux4.paintEndEveningControls(state, state.locale);
    scrubBannedEscapeChrome();
    // ux-12 invariant: End evening action never rewritten
    const endBtn = document.getElementById("btn-end-evening");
    if (endBtn && (endEnabled || soleEnd)) {
      endBtn.dataset.action = "end-evening";
      endBtn.setAttribute("data-action", "end-evening");
    }
    // ux-13: stamp midVh for smoke / auditor
    const mid = document.querySelector("#screen-evening .rp-mid, [data-testid='evening-mid']");
    if (mid) {
      const vh = mid.getBoundingClientRect().height / Math.max(1, window.innerHeight);
      mid.dataset.midVh = vh.toFixed(3);
      document.documentElement.dataset.eveningMidVh = vh.toFixed(3);
    }
  });
}

function day1EscapeChipHtml(endEnabled) {
  // ux-session-8: NEVER mount skip-to-morning / escape hatch in production
  if (!coldAuditActive()) return "";
  const chip = state.questPack?.storyForm4?.day1EveningEscapeChip || state.storyForm4?.day1EveningEscapeChip;
  if (!chip) return "";
  if (endEnabled) return "";
  if ((state.save.dayIndex || 1) !== 1) return "";
  const cold = ["cold_open_mediate", "cold_open_instigate", "cold_open_stage"].some((f) => storyFlag(f));
  if (!cold) return "";
  return `<button class="rp-btn rp-btn--ghost" type="button" data-action="force-overnight-story" data-testid="force-overnight-story" title="${loc(chip.hint) || ""}">${loc(chip.label)}</button>`;
}

function scrubBannedEscapeChrome() {
  if (coldAuditActive()) return;
  document
    .querySelectorAll(
      "[data-testid='skip-to-morning'],[data-skip-to-morning],#btn-skip-morning,.rp-skip-morning,[data-testid='unstuck'],.rp-unstuck,.fight-unstuck,[data-testid='force-overnight-story']"
    )
    .forEach((el) => el.remove());
}

function renderStreet() {
  const screen = document.getElementById("screen-street");
  applyNaturalArcStreetUnlock();
  syncColdYieldBodyClass();
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
    const base = `<button class="rp-hotspot ${done ? "visited" : ""} ${avail ? "is-available" : ""}" style="--x:${xy[0]}%;--y:${xy[1]}%" type="button" data-action="open-neighbor" data-id="${n.id}" aria-label="${loc(n.name)}">
        <img class="rp-hotspot__bust" src="${goldBust(n.id)}" alt="" width="56" height="56" onerror="this.src='${MESHY_BUSTS.n1 || ART.busts.n1}'" />
        <span class="rp-hotspot__glow" aria-hidden="true"></span>
        <span class="rp-hotspot__name">${loc(n.name)}${done ? " ✓" : ""}</span>
      </button>`;
    return mutateHotspotHtml(n, base);
  }).join("");

  applyDay2ColdRewrite();
  purgeColdWorldResiduals();
  syncLedgerWinsBodyClass();
  armRecommendTonightCandidate();
  const spine = unfinishedQuestHeadline();
  const worldBits = worldStreetLines();
  const needCheckin = !state.save.evening.checkin;
  const checkinLabel = state.locale === "tr" ? "Demlik" : "Check-in";
  const echoOff = coldEchoSuppressed();
  const npcWhisper = echoOff
    ? ""
    : (() => {
        const b = day2ColdBranch();
        return b?.streetNpcLine
          ? `${loc(neighborById(b.streetNpcLine.speakerId)?.name) || ""}: ${loc(b.streetNpcLine.text)}`
          : "";
      })();

  applyStreetLayerPolicy();
  const coldWins = isColdDay2() && !echoOff;
  const day = state.save.dayIndex || 1;
  const winner = pickUnifiedStoryWinner();
  const oneSignal = !!winner;
  const coldHtml = oneSignal && winner.id === "cold_day2_prop" ? "" : (oneSignal ? "" : day2StreetStageHtml());
  const bannerHtml = oneSignal || coldWins ? streetArcCompactChipHtml() : activeArcBeatBannerHtml();
  const spotHtml = oneSignal || echoOff ? "" : day2EnterSpotlightHtml("street");
  // form17: never mount story-day2-orhan-line after yield
  const day2Line = !echoOff && coldWins && npcWhisper
    ? `<p class="rp-day2-line" data-testid="story-day2-orhan-line">${npcWhisper}</p>`
    : "";
  // Optional Volume/Ledger NPC line after yield
  const yieldNpc = (() => {
    if (!echoOff || !winner) return "";
    const allow = storyForm17()?.clearMediateEchoAfterYield?.allowNpcInstead?.[winner.id];
    if (!allow) return "";
    return `<p class="rp-yield-npc-line" data-testid="${allow.testId || "story-yield-npc"}">${loc(allow.text)}</p>`;
  })();
  if (echoOff) document.body.classList.add("rp-cold-yielded");
  screen.className = (screen.className || "").replace(/\bis-day2\b/g, "").trim();
  if (day === 2) screen.classList.add("is-day2", "rp-screen--street");
  if (echoOff) screen.classList.add("rp-cold-yielded");
  screen.dataset.day = String(day);
  if (winner?.id) screen.dataset.storyWinner = winner.id;
  else delete screen.dataset.storyWinner;
  screen.innerHTML = `
    ${stageLayer("street")}
    ${coldHtml}
    ${streetArcStagePropsHtml()}
    ${hudHtml()}
    ${streetPropOverlayHtml("street")}
    ${bannerHtml}
    ${spotHtml}
    ${mqStreetChipHtml()}
    <button class="rp-chip rp-back" type="button" data-action="goto-evening">${t("common.back")}</button>
    <div class="rp-hotspots" role="list" data-testid="${coldWins || oneSignal ? "street-layer-cold-wins" : "street-hotspots"}">${spots}</div>
    ${coldWins || oneSignal ? "" : (worldBits.length ? `<div class="world-banner street-float rp-wc-loud">${worldBits.map((l) => `<span>◈ ${l}</span>`).join("")}</div>` : "")}
    ${day2Line}
    ${yieldNpc}
    ${week2DecibelLedgerPullHtml("street")}
    ${recommendTonightBarHtml()}
    ${!echoOff && !coldWins && npcWhisper && !oneSignal ? `<div class="rp-npc-remember"><span>${npcWhisper}</span></div>` : ""}
    ${!coldWins && !oneSignal && spine ? `<div class="rp-whisper"><span>◎ ${spine}</span></div>` : ""}
    <footer class="rp-dock">
      <button class="rp-btn rp-btn--primary" type="button" data-action="checkin" ${needCheckin ? "" : "disabled"}>${needCheckin ? checkinLabel : t("street.porch_checkin")}</button>
      <button class="rp-btn" type="button" data-action="street-event" ${state.save.evening.streetEvent ? "disabled" : ""}>${t("street.event")}</button>
      <button class="rp-btn" type="button" data-action="open-quests">${state.locale === "tr" ? "Görevler" : "Quests"}</button>
      ${!storyFlag("practice_cup_done") ? `<button class="rp-btn" type="button" data-action="goto-cup">${state.locale === "tr" ? "Prova ★" : "Practice ★"}</button>` : ""}
    </footer>`;
  requestAnimationFrame(() => armMech15DecibelLived());
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
  const tr = state.locale === "tr";
  const form7 = storyForm7();
  const layout = form7?.journalLayout;
  const form8 = storyForm8();
  const dramaSrc = [
    ...(state.questPack?.storyForm3?.journalDramaCards || []),
    ...(form7?.journalDramaCardsAppend || []),
    ...(form8?.journalDramaCardsAppend || []),
  ];
  const dramaCards = dramaSrc
    .filter((c) => (c.when?.dayIndexMin || 1) <= day)
    .filter(
      (c) =>
        !(c.when?.flagsAny || c.when?.flagsAll) ||
        (c.when?.flagsAny || []).some((f) => storyFlag(f)) ||
        ((c.when?.flagsAll || []).length && (c.when?.flagsAll || []).every((f) => storyFlag(f)))
    )
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
  const heroTease = loc(layout?.heroTease) || (tr ? "Drama defteri — omurga + canlı beat" : "Drama journal — spine + living beat");
  const notesLabel = loc(layout?.recentNotesLabel) || (tr ? "Eski notlar (log)" : "Older notes (log)");
  screen.innerHTML = `
    ${hudHtml()}
    <div class="art-hero journal-hero" style="background-image:${stageBg(ART.streetHero, ART.streetHeroFallback)}" data-testid="${layout?.testId || "story-journal-drama-first"}">
      <div class="art-hero-scrim">
        <div class="topbar"><h2>${tr ? "Hikâye defteri" : "Story journal"}</h2>
          <button class="btn btn-secondary" type="button" data-action="goto-evening">${t("common.back")}</button>
        </div>
        <p class="evening-cup-tease">${heroTease}</p>
        <div class="spine-strip">${spine || ""}</div>
      </div>
    </div>
    ${dramaCards ? `<h3 class="section-label">${tr ? "Yankı" : "Aftermath"}</h3><div class="journal-drama-list">${dramaCards}</div>` : ""}
    ${antennaOpJournalHtml()}
    ${consequenceBits ? `<h3 class="section-label">${tr ? "Yankı / Sonuç" : "Consequence"}</h3><ul class="agenda-list">${consequenceBits}</ul>` : ""}
    <h3 class="section-label">${tr ? "Arklar" : "Arcs"}</h3>
    <div class="arc-list">${arcs}</div>
    <h3 class="section-label">${tr ? "Aktif görevler" : "Active quests"}</h3>
    <ul class="agenda-list">${questBits}</ul>
    <div class="btn-row"><button class="btn btn-teal" type="button" data-action="open-quests">${tr ? "Görev defteri" : "Quest log"}</button></div>
    <h3 class="section-label">${tr ? "Mahalle ünü" : "Street rep"}</h3>
    <p class="muted">${repLine}</p>
    <details class="journal-log-fold" ${layout?.recentNotesDefaultCollapsed === false ? "open" : ""}>
      <summary>${notesLabel}</summary>
      <ul class="agenda-list recap-list">${recap}</ul>
    </details>
    <h3 class="section-label">${tr ? "Hikâye ödülleri" : "Story unlocks"}</h3>
    <p class="muted">${unlockBits.length ? unlockBits.join(", ") : tr ? "Henüz yok" : "None yet"}</p>
    <h3 class="section-label">${tr ? "Sezon sonu" : "Season end"}</h3>
    <p class="muted">${ending ? loc(ending.title) : tr ? "28. günden sonra kilitlenir" : "Locks after day 28"}</p>
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
  const showMeDone = !!state.showMeApplied || storyFlag("practice_show_me_applied");
  // If Show me was applied earlier but picks were cleared (goto-cup reset), restore them FIRST
  if (state.practiceMode && showMeDone && state.cupPicks.length < state.pickCount) {
    applyShowMePractice();
  }
  const tags = state.cupPicks.map((id) => neighborById(id)?.synergyTag).filter(Boolean);
  const syns = activeSynergies(tags);
  const footerRows = synergyFooterFromPicks(state.cupPicks);
  const footerActiveIds = footerRows.filter((r) => r.active).map((r) => r.sid).sort().join(",");
  const liveActiveIds = syns.map((s) => s.id).sort().join(",");
  const footerDesync = footerActiveIds !== liveActiveIds;
  if (footerDesync) {
    console.warn("synergy_footer_desync_recovered", { footerActiveIds, liveActiveIds });
  }
  const rivalryNow =
    syns.some((s) => s.id === "syn_rivalry") || footerRows.some((r) => r.sid === "syn_rivalry" && r.active);
  const synsNow = syns;
  // Auditor PriorityFix: ANY valid 3 picks enable Start in Practice (Rivalry preferred, not hard-gated)
  const teachSynOk = state.practiceMode
    ? true
    : showMeDone ||
      rivalryNow ||
      !teach?.requireSynergyToReady ||
      !teach?.synergyId ||
      synsNow.some((s) => s.id === teach.synergyId) ||
      state.save.storyFlags?.[`syn_taught_${teach.synergyId}`];
  const ready = state.cupPicks.length >= state.pickCount && teachSynOk;
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
  const picksReady = state.cupPicks.length >= state.pickCount;
  const synHint = picksReady
    ? rivalryNow || showMeDone
      ? loc(state.combatPack?.lobbyAutoAdvance?.onShowMe?.coachLine) ||
        (state.locale === "tr" ? "Roster hazır — Start'a bas, arenaya gir." : "Roster set — tap Start to enter the arena.")
      : state.locale === "tr"
        ? "3 pick hazır — Start ile arenaya gir (Rekabet önerilir)."
        : "3 picks ready — Start enters the arena (Rivalry recommended)."
    : synsNow.length
      ? synsNow.map(synDesc).join(" · ")
      : state.locale === "tr"
        ? "3 komşu seç veya Göster"
        : "Pick 3 neighbors or Show me";
  const startLabel = ready
    ? loc(startLabels.enabled) || (state.locale === "tr" ? "Start — arena" : "Start — arena")
    : loc(startLabels.disabledNeedPicks) || (state.locale === "tr" ? "3 komşu seç veya Göster" : "Pick 3 or Show me");
  // Practice: always jump lobby → fight (auto-place); draft only via Adjust
  const startAction = state.practiceMode && ready ? "start-fight" : ready ? "goto-draft" : "start-fight";
  const teachBlock = teach
    ? `<div class="syn-teach">
        <p>${loc(teach.lines)}</p>
        <div class="btn-row">
          <button class="btn btn-teal" type="button" data-action="syn-show-me" data-id="${teach.synergyId}">${loc(teach.showMeLabel)}</button>
          <button class="btn btn-ember" type="button" data-action="practice-enter-now">${state.locale === "tr" ? "Hemen Prova" : "Enter Practice now"}</button>
        </div>
      </div>`
    : state.practiceMode
      ? `<div class="syn-teach"><div class="btn-row">
          <button class="btn btn-teal" type="button" data-action="syn-show-me">Show me</button>
          <button class="btn btn-ember" type="button" data-action="practice-enter-now">${state.locale === "tr" ? "Hemen Prova" : "Enter Practice now"}</button>
        </div></div>`
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
      <button class="btn btn-teal" type="button" data-action="syn-show-me" data-testid="show-me">${state.locale === "tr" ? "Göster" : "Show me"}</button>
      <button class="btn btn-primary ${ready ? "rp-cta-pulse" : ""}" type="button" data-action="start-fight" data-testid="start-fight" id="btn-start-fight" ${ready ? "" : "disabled"} data-ready="${ready ? "1" : "0"}">${startLabel}</button>
      ${
        state.practiceMode && ready
          ? `<button class="btn btn-secondary" type="button" data-action="goto-draft" data-testid="goto-draft">${state.locale === "tr" ? "Yerleri düzenle" : "Adjust pads"}</button>`
          : `<button class="btn btn-secondary" type="button" data-action="goto-draft" data-testid="goto-draft" ${ready ? "" : "disabled"}>${state.locale === "tr" ? "Draft" : "Draft"}</button>`
      }
    </div>
    ${practiceSettleHtml()}
    ${state.settleConfirmOpen ? practiceSettleConfirmHtml() : ""}`;
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
  try {
    if (state.fightTimer) clearInterval(state.fightTimer);
    state.practiceMode = !isCupNight() && !(state.save.storyFlags?.practice_cup_done);
    // Never abort — guarantee picks + pads + enemies
    if (!state.cupPicks?.length || state.cupPicks.length < (state.pickCount || 3)) {
      applyShowMePractice();
    }
    ensurePracticePlacement();
    if (!(state.placement || []).filter(Boolean).length) {
      autoPlaceSilent();
    }
    state.save.storyFlags = state.save.storyFlags || {};
    state.save.storyFlags.practice_fight_entered = true;
    const prac = state.practiceMode ? Combat.practiceSetup(state.combatPack) : null;
    const lineup = prac ? Density.practiceLineup(prac, state.densityPack) || {} : {};
    if (prac && !state.save.storyFlags?.practice_cup_done) {
      const filled = (state.placement || []).filter(Boolean).length;
      if (!filled && lineup.playerLineup?.length) {
        const placement = Array(6).fill(null);
        const practiceSlots = [1, 2, 3];
        lineup.playerLineup.forEach((row, i) => {
          placement[practiceSlots[i] ?? Combat.cellToSlot(row.cell)] = row.neighborId;
        });
        state.placement = placement;
        state.cupPicks = lineup.playerLineup.map((r) => r.neighborId);
      }
      if (!state.enemyLineup?.length && lineup.enemyLineup?.length) {
        state.enemyLineup = lineup.enemyLineup.map((r) => r.botId);
      }
    }
    let allyIds = (state.placement || []).filter(Boolean);
    if (!allyIds.length) {
      applyShowMePractice();
      ensurePracticePlacement();
      allyIds = (state.placement || []).filter(Boolean);
    }
    const bot = state.content.botCupRoster;
    const botUnits = bot?.units || [];
    const placedSlots = (state.placement || [])
      .map((id, slot) => (id ? slot : null))
      .filter((s) => s != null);
    const allFront = placedSlots.length > 0 && placedSlots.every((s) => s < 3);
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
    let enemyIds = state.enemyLineup?.length
      ? [...state.enemyLineup]
      : pickEnemyLineup(allyIds.length ? allyIds : state.cupPicks);
    enemyIds = enemyIds.filter((id) => botUnits.some((u) => u.id === id));
    while (enemyIds.length < 3) {
      const next = botUnits.find((u) => !enemyIds.includes(u.id));
      if (!next) break;
      enemyIds.push(next.id);
    }
    state.enemyLineup = enemyIds.slice(0, 3);
    const enemySlots = prac || state.practiceMode ? [1, 2, 3] : [0, 1, 3];
    const enemies = state.enemyLineup
      .map((id, i) => {
        const unit = botUnits.find((x) => x.id === id);
        return unit ? makeBotFighter(unit, enemySlots[i] ?? i, mult) : null;
      })
      .filter(Boolean);
    const allies = (state.placement || [])
      .map((id, slot) => {
        if (!id) return null;
        try { return makeFighter(id, "ally", slot); } catch (e) { return null; }
      })
      .filter(Boolean);
    if (!allies.length || !enemies.length) {
      toast(state.locale === "tr" ? "Kadroyu kuramıyorum — Show me dene" : "Can't form roster — try Show me");
      applyShowMePractice();
      renderCupLobby();
      showScreen("screen-cup");
      return;
    }
    const battle = {
      allies,
      enemies,
      allySyn: activeSynergies(allies.map((a) => a.synergyTag)),
      enemySyn: activeSynergies(enemies.map((e) => e.synergyTag)),
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
      practice: !!(prac || state.practiceMode),
      scripted: prac ? Density.mergedPracticeScript(prac, state.densityPack) : [],
      scriptedDone: new Set(),
      cannotDismissPorch: false,
      fightId: `f_${Date.now()}`,
    };
    if (allFront) {
      battle.log.unshift(state.locale === "tr" ? "Bot: hep ön sıra cezası!" : "Bot: all-front punish!");
    }
    state.battle = battle;
    document.querySelectorAll(".toast").forEach((n) => n.remove());
    renderFight(battle);
    showScreen("screen-fight");
    // Hard assert for auditor / smoke
    if (!document.querySelector("#screen-fight.active")) {
      document.getElementById("screen-fight")?.classList.add("active");
    }
    resumeFightLoop(battle);
  } catch (err) {
    console.error("startFight failed", err);
    toast(state.locale === "tr" ? "Dövüş açılamadı — tekrar dene" : "Fight failed to open — retry");
    try {
      applyShowMePractice();
      renderCupLobby();
      showScreen("screen-cup");
    } catch { /* */ }
  }
}

function noteTempoTap(battle) {
  if (!battle) return;
  battle.lastAgencyTapAt = battle.elapsed || 0;
  battle.tempoMeter = Math.min(100, (battle.tempoMeter || 0) + 12);
  battle.timescale = 1.05;
  battle.agencyActionCount = (battle.agencyActionCount || 0) + 1;
}

function battleTimescale(battle) {
  if (!battle || battle.paused) return 0;
  const idleAfter = 2.0; // mech-11
  const last = battle.lastAgencyTapAt ?? battle.elapsed ?? 0;
  if ((battle.elapsed || 0) - last >= idleAfter) {
    battle.timescale = 0.45;
    return 0.45;
  }
  battle.timescale = 1.05;
  return 1.05;
}

function syncTempoPulseUI(battle) {
  const pad = document.getElementById("tempo-pulse-pad");
  const dock = document.querySelector('[data-testid="tempo-pulse-dock"]');
  const idle = document.getElementById("tempo-idle-hint");
  const fill = document.getElementById("tempo-steer-fill");
  const score = document.getElementById("you-score");
  const chipRow = document.getElementById("tempo-chip-row");
  const modalOpen = !!(
    battle.paused &&
    (battle.actionOffered || battle.secondCallOffered) &&
    !document.getElementById("fight-actions")?.hidden
  );
  const pulseLive = !!(battle.tempoPulseUntil && battle.elapsed < battle.tempoPulseUntil && !modalOpen && !battle.finished);
  if (pad) pad.hidden = !pulseLive;
  if (dock) dock.hidden = !pulseLive;
  if (idle) idle.hidden = !((battle.timescale || 1) < 0.9 && !modalOpen && !battle.finished);
  if (fill) {
    // drain on idle
    if ((battle.timescale || 1) < 0.9) battle.tempoMeter = Math.max(0, (battle.tempoMeter || 0) - 0.35);
    fill.style.width = `${Math.round(battle.tempoMeter || 0)}%`;
  }
  if (score) score.textContent = `You ${Math.round(battle.youScore || 0)}`;
  const chipLive = !!(battle.tempoChipUntil && battle.elapsed < battle.tempoChipUntil && !modalOpen && !battle.finished);
  if (chipRow) chipRow.hidden = !chipLive;
}

function tickTempoAgency(battle) {
  if (!battle?.practice || battle.finished) return;
  const modalOpen = !!(
    battle.paused &&
    (battle.actionOffered || battle.secondCallOffered)
  );
  if (modalOpen) {
    battle.tempoPulseUntil = 0;
    battle.tempoChipUntil = 0;
    return;
  }
  // mechanics-fix-10: denser pulse every 2.2s (miss never blocks)
  if (battle.actionUsed && !battle.secondCallUsed) {
    const interval = 1.8; // mech-11 denser
    const next = battle.nextTempoPulseAt ?? (battle.elapsed + 0.4);
    if (battle.elapsed >= next && !(battle.tempoPulseUntil && battle.elapsed < battle.tempoPulseUntil)) {
      battle.tempoPulseUntil = battle.elapsed + 1.1;
      battle.nextTempoPulseAt = battle.elapsed + interval;
      battle.tempoPulseSide = Math.random() < 0.5 ? "ally" : "enemy";
    }
    if (battle.tempoPulseUntil && battle.elapsed >= battle.tempoPulseUntil) {
      battle.tempoPulseUntil = 0; // miss — continue, no penalty
    }
    // Push/Guard chip every ~5.5s, 2s dismiss
    const chipNext = battle.nextTempoChipAt ?? (battle.elapsed + 3.2);
    if (battle.elapsed >= chipNext && !(battle.tempoChipUntil && battle.elapsed < battle.tempoChipUntil)) {
      battle.tempoChipUntil = battle.elapsed + 2.0;
      battle.nextTempoChipAt = battle.elapsed + 5.5;
    }
    if (battle.tempoChipUntil && battle.elapsed >= battle.tempoChipUntil) {
      battle.tempoChipUntil = 0; // dismiss no effect
    }
  }
}

function applyTempoPulseHit() {
  const battle = state.battle;
  if (!battle || battle.finished) return;
  if (!(battle.tempoPulseUntil && battle.elapsed < battle.tempoPulseUntil)) return;
  battle.tempoPulseUntil = 0;
  noteTempoTap(battle);
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_tempo_pulse_hit = true;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  battle.floaters = battle.floaters || [];
  if (battle.tempoPulseSide === "enemy") {
    const foe = battle.enemies.find((u) => u.alive);
    if (foe) {
      const dmg = Math.max(3, Math.floor(foe.maxHp * 0.1));
      foe.hp = Math.max(1, foe.hp - dmg);
      battle.youScore = (battle.youScore || 0) + 4;
      battle.floaters.push({ side: foe.side, slot: foe.slot, dmg, t: battle.elapsed, proc: true });
    }
  } else {
    const ally = battle.allies.find((u) => u.alive);
    if (ally) {
      const heal = Math.max(3, Math.floor(ally.maxHp * 0.05));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      battle.youScore = (battle.youScore || 0) + 3;
      battle.floaters.push({ side: ally.side, slot: ally.slot, heal, t: battle.elapsed, proc: true });
    }
  }
  toast(state.locale === "tr" ? "Tempo!" : "Tempo!");
  updateFightUI(battle);
  saveNow();
}

function applyTempoChip(kind) {
  const battle = state.battle;
  if (!battle || battle.finished) return;
  if (!(battle.tempoChipUntil && battle.elapsed < battle.tempoChipUntil)) return;
  battle.tempoChipUntil = 0;
  noteTempoTap(battle);
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  if (kind === "push") {
    battle.atkBuffUntil = (battle.elapsed || 0) + 2;
    battle.atkBuffPct = 0.08;
    battle.youScore = (battle.youScore || 0) + 3;
    toast(state.locale === "tr" ? "Bastır" : "Push");
  } else {
    battle.defBuffUntil = (battle.elapsed || 0) + 2;
    battle.defBuffPct = 0.1;
    battle.youScore = (battle.youScore || 0) + 2;
    toast(state.locale === "tr" ? "Koru" : "Guard");
  }
  updateFightUI(battle);
  saveNow();
}

function resumeFightLoop(battle) {
  if (state.fightTimer) clearInterval(state.fightTimer);
  const tickMs = 700;
  const uiMs = 100;
  let combatAcc = 0;
  let lastWall = performance.now();
  battle.lastAgencyTapAt = battle.lastAgencyTapAt ?? battle.elapsed ?? 0;
  battle.tempoMeter = battle.tempoMeter || 0;
  battle.youScore = battle.youScore || 0;
  state.fightTimer = setInterval(() => {
    if (battle.finished) return;
    const now = performance.now();
    const wallDt = (now - lastWall) / 1000;
    lastWall = now;
    if (battle.paused) {
      syncTempoPulseUI(battle);
      return;
    }
    const scale = battleTimescale(battle);
    battle.elapsed = (battle.elapsed || 0) + wallDt * scale;
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
    combatAcc += uiMs * scale;
    while (combatAcc >= tickMs) {
      combatAcc -= tickMs;
      runScriptedMoments(battle);
      if (battle.paused) break;
      combatTick(battle);
    }
    tickTempoAgency(battle);
    battle.floaters = cappedFloaters((battle.floaters || []).filter((f) => battle.elapsed - f.t < 0.85));
    updateFightUI(battle);
    syncTempoPulseUI(battle);
    const bothAlive = battle.allies.some((u) => u.alive) && battle.enemies.some((u) => u.alive);
    const minPrac = state.mechFix5?.pauseAutoFightForCall?.minPracticeFightSec || state.combatPack?.practiceCup?.minPracticeFightSec || 12;
    const timeUp = battle.elapsed >= 75;
    // mechanics-fix-5: force porch-call UI by ~2.4s; keep fight alive until call
    if (battle.practice && !battle.actionUsed && battle.elapsed >= 2.4 && !battle.actionOffered) {
      battle.actionOffered = true;
      battle.paused = true;
      battle.cannotDismissPorch = true;
      battle.forcePorchIds = ["call_focus_fire", "call_prop_assist", "call_chaos_kite"];
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.practice_porch_call_opened = true;
      updateFightUI(battle);
      showFightActions(battle);
      return;
    }
    if (battle.practice && battle.elapsed < minPrac && !battle.actionUsed) {
      for (const u of [...battle.allies, ...battle.enemies]) {
        if (u.alive && u.hp < 1) u.hp = 1;
      }
    }
    // mechanics-fix-9: Porch Call II — arm dock ~2.5s after Call I, force open ~3.0s / elapsed≥5.5
    if (
      battle.practice &&
      battle.actionUsed &&
      !battle.secondCallUsed &&
      !battle.callTwoArmed &&
      battle.elapsed >= 5.0
    ) {
      battle.callTwoArmed = true;
      updateFightUI(battle);
    }
    if (
      battle.practice &&
      battle.actionUsed &&
      !battle.secondCallUsed &&
      !battle.secondCallOffered &&
      battle.elapsed >= 5.5 &&
      battle.allies.some((u) => u.alive) &&
      battle.enemies.some((u) => u.alive)
    ) {
      battle.secondCallOffered = true;
      battle.paused = true;
      updateFightUI(battle);
      showSecondFightChoice(battle);
      return;
    }
    // Comic watchdog: after Call II open, never strand >8s without resolve
    if (
      battle.practice &&
      battle.secondCallOffered &&
      !battle.secondCallUsed &&
      battle.secondCallOfferedAt != null &&
      battle.elapsed - battle.secondCallOfferedAt > 8
    ) {
      applySecondFightChoice("focus", { auto: true });
      return;
    }
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
    // After Call II, also require second call before KO finish (fix-9 path)
    if (battle.practice && battle.actionUsed && !battle.secondCallUsed && (timeUp || !bothAlive)) {
      if (!battle.secondCallOffered) {
        battle.secondCallOffered = true;
        battle.paused = true;
        updateFightUI(battle);
        showSecondFightChoice(battle);
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


function clearRivalryAck(battle, reason = "ack") {
  if (!battle) return;
  battle.rivalryAckPending = false;
  clearTimeout(battle._rivalryAckTimer);
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.syn_taught_syn_rivalry = true;
  state.save.storyFlags.practice_cup_rivalry_pop_seen = true;
  if (!battle.actionOffered) hideFightActions();
  if (battle.paused && !battle.actionOffered && !battle.cannotDismissPorch) {
    battle.paused = false;
    resumeFightLoop(battle);
  }
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
        // PriorityFix 7.8: never strand on Rivalry ack — auto-clear quickly; Call resolve also clears
        battle.paused = true;
        battle.rivalryAckPending = true;
        const bar = document.getElementById("fight-actions");
        if (bar && !battle.actionOffered) {
          const ack = loc(beat.ackLabel) || (state.locale === "tr" ? "Anladım — Rekabet" : "Got it — Rivalry");
          bar.innerHTML = `<p class="fight-action-prompt">${loc(beat.lines) || ack}</p>
            <div class="btn-row wrap"><button class="btn btn-ember" type="button" data-action="ack-rivalry" data-testid="ack-rivalry">${ack}</button></div>`;
          bar.hidden = false;
        }
        clearTimeout(battle._rivalryAckTimer);
        battle._rivalryAckTimer = setTimeout(() => {
          if (!battle.rivalryAckPending || battle.finished) return;
          clearRivalryAck(battle, "auto");
        }, beat.autoAckMs || 1200);
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
    } else if (beat.type === "porch_call_armed" && !battle.actionUsed) {
      battle.porchCallArmed = true;
      battle.forcePorchIds = beat.forceOptionIds || state.mechFix6?.deliberatePorchCall?.practiceFlow?.forceOptionIds || ["call_focus_fire", "call_prop_assist", "call_chaos_kite"];
      state.save.storyFlags = state.save.storyFlags || {};
      for (const f of beat.setsFlags || ["practice_porch_call_armed"]) state.save.storyFlags[f] = true;
      updateFightUI(battle);
    } else if ((beat.type === "porch_call" || beat.type === "porch_call_watchdog" || beat.type === "porch_call_pause_gate") && !battle.actionUsed) {
      if ((beat.type === "porch_call_watchdog") && battle.actionOffered) continue;
      battle.porchCallArmed = true;
      battle.actionOffered = true;
      battle.paused = true;
      battle.cannotDismissPorch = true; // mechanics-fix-6: ALWAYS require pick in Practice
      battle.forcePorchIds = beat.forceOptionIds || beat.ifNotOpen?.forceOptionIds || ["call_focus_fire", "call_prop_assist", "call_chaos_kite"];
      state.save.storyFlags = state.save.storyFlags || {};
      for (const f of beat.setsFlagsOnOpen || ["practice_porch_call_opened", "practice_porch_call_armed"]) state.save.storyFlags[f] = true;
      updateFightUI(battle);
      showFightActions(battle);
      battle._porchResolveFlags = beat.setsFlagsOnResolve || ["practice_cup_porch_call_done", "porch_call_resolved"];
    } else if (beat.type === "finish_banner") {
      applyBeatFlags(beat);
      showSynProc(loc(beat.lines) || (state.locale === "tr" ? "Prova bitti" : "Practice clear"));
    } else if (beat.type === "porch_call_resolve_fx") {
      stageShake("shake-medium");
    }
  }
}


function showSecondFightChoice(battle) {
  // mechanics-fix-9: Porch Call II — same card chrome as Call I; soft-timeout 6s
  const bar = document.getElementById("fight-actions");
  if (!bar) return;
  const tr = state.locale === "tr";
  const lang = state.mechFix9?.porchCallLanguageCallTwo || {};
  const labels = Object.fromEntries((lang.optionLabels || []).map((o) => [o.id, o]));
  const ids = ["call_focus_fire", "call_prop_assist", "call_chaos_kite"];
  // Prefer different from first call
  const firstId = battle.firstCallId;
  const ordered = firstId ? [...ids.filter((id) => id !== firstId), firstId] : ids;
  const all = state.combatPack?.porchCalls?.options || [];
  const opts = ordered.map((id) => all.find((o) => o.id === id)).filter(Boolean);
  battle.porchCallTwoOptions = opts.length ? opts : ordered.map((id) => ({ id }));
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage");
  if (stage) stage.classList.add("porch-call-dim");
  const title =
    loc(state.mechFix9?.uiStringsPatch?.["fight.porch_call_two_title"]) ||
    loc(lang.ui?.title) ||
    (tr ? "Veranda Çağrısı II — birini seç" : "Porch Call II — pick one");
  const subtitle =
    loc(lang.ui?.subtitle) ||
    (tr ? "Skor sallanır · güvenli / riskli / sinerji" : "Score swings · safe / swingy / synergy");
  const layout = state.combatPack?.porchCalls?.optionCardLayout || {};
  const chips = layout.categoryChips || {};
  const tid = lang.testIds || {};
  const card = (o) => {
    const meta = labels[o.id] || {};
    const cat = meta.category || o.category || "swingy";
    const chip = loc(chips[cat]) || cat;
    const label = loc(meta.label) || loc(o.label) || o.id;
    const blurb = loc(o.blurb) || "";
    const prop = typeof porchCallProp === "function" ? porchCallProp(o) : ART.props.duduk;
    const testId =
      o.id === "call_focus_fire"
        ? tid.optFocus || "porch-call-2-focus"
        : o.id === "call_prop_assist"
          ? tid.optProp || "porch-call-2-prop"
          : tid.optSwap || "porch-call-2-swap";
    const action =
      o.id === "call_focus_fire" ? "second-focus" : o.id === "call_prop_assist" ? "second-prop" : "second-swap";
    return `<button class="porch-call-card btn ${cat === "safe" ? "btn-teal" : cat === "swingy" ? "btn-ember" : "btn-primary"}" type="button" data-action="${action}" data-id="${o.id}" data-testid="${testId}">
      <img class="porch-call-prop" src="${prop}" alt="" width="36" height="36" />
      <span class="porch-call-chip">${chip}</span>
      <strong>${label}</strong>
      <em>${blurb}</em>
    </button>`;
  };
  bar.setAttribute("data-testid", tid.modal || "porch-call-modal-2");
  const preview = `<div class="call-two-score-preview" data-testid="call-two-score-preview">
      <span>Focus ≈ +10 You</span> · <span>Prop ≈ +9 You</span> · <span>Swap ≈ +8 You</span>
    </div>`;
  bar.innerHTML = `
    <p class="fight-action-prompt">${title}</p>
    <p class="muted porch-call-sub">${subtitle}</p>
    ${preview}
    <div class="btn-row wrap porch-call-row">${(battle.porchCallTwoOptions || []).map(card).join("")}</div>`;
  bar.hidden = false;
  battle.secondCallOfferedAt = battle.elapsed || 0;
  clearTimeout(battle._callTwoTimeout);
  // Soft-timeout 7s (mech-11) → auto Focus — still softlock-proof
  battle._callTwoTimeout = setTimeout(() => {
    if (!state.battle || state.battle.secondCallUsed || state.battle.finished) return;
    toast(
      state.locale === "tr"
        ? "Çağrı II otomatik — sonraki Cup'ta sen bas"
        : "Call II auto — tap it yourself next Cup"
    );
    applySecondFightChoice("focus", { auto: true });
  }, 7000);
}

function applySecondFightChoice(kind, opts = {}) {
  const battle = state.battle;
  if (!battle || battle.secondCallUsed) return;
  clearTimeout(battle._callTwoTimeout);
  battle.secondCallUsed = true;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  battle.agencyActionCount = (battle.agencyActionCount || 0) + 1;
  state.save.storyFlags = state.save.storyFlags || {};
  if (opts.auto) {
    state.save.storyFlags.practice_call_two_auto = true;
    state.save.storyFlags.practice_second_call_done = true;
    stickyFightToast(
      state.locale === "tr" ? "Çağrı II otomatik — sonraki Cup'ta sen bas" : "Call II auto — tap it yourself next Cup",
      "call-two-auto-toast",
      1400
    );
  } else {
    state.save.storyFlags.practice_call_two_player = true;
    state.save.storyFlags.practice_second_call_done = true;
    delete state.save.storyFlags.practice_call_two_auto;
    battle.youScore = (battle.youScore || 0) + 4;
    stickyFightToast(
      state.locale === "tr" ? "Erken Çağrı II — mastery!" : "Early Call II — mastery!",
      "call-two-mastery-toast",
      1600
    );
  }
  const beforeYou = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const beforeBot = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const bias = state.mechFix9?.visibleScoreSwing?.effectBiasPractice || {};
  let label = kind;
  let callId = "call_focus_fire";
  if (kind === "focus") {
    callId = "call_focus_fire";
    label = state.locale === "tr" ? "Hedef göster" : "Focus fire";
    const foe = battle.enemies.filter((u) => u.alive).sort((a, b) => b.atk - a.atk)[0];
    const b = bias.call_focus_fire || {};
    if (foe) {
      battle.focusTargetSlot = foe.slot;
      battle.focusUntil = (battle.elapsed || 0) + (b.durationSec || 6);
      battle.focusDmgBonus = b.damageTakenBonusPercent || 0.28;
      const dmg = Math.max(8, Math.floor(foe.maxHp * 0.1));
      foe.hp = Math.max(0, foe.hp - dmg);
      battle.floaters = battle.floaters || [];
      battle.floaters.push({ side: foe.side, slot: foe.slot, dmg, t: battle.elapsed, proc: true });
    }
  } else if (kind === "prop") {
    callId = "call_prop_assist";
    label = state.locale === "tr" ? "Prop savur" : "Prop toss";
    const ally = battle.allies.filter((u) => u.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const b = bias.call_prop_assist || {};
    if (ally) {
      const heal = Math.max(10, Math.floor(ally.maxHp * 0.14));
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      battle.floaters = battle.floaters || [];
      battle.floaters.push({ side: ally.side, slot: ally.slot, heal, t: battle.elapsed, proc: true });
      battle.atkBuffUntil = (battle.elapsed || 0) + (b.durationSec || 5);
      battle.atkBuffPct = b.atkBonusPercent || 0.12;
    }
  } else if (kind === "swap") {
    callId = "call_chaos_kite";
    label = state.locale === "tr" ? "Kaos yer değiştir" : "Chaos kite";
    const alive = battle.allies.filter((u) => u.alive);
    if (alive.length >= 2) {
      const a = alive[0], b = alive[alive.length - 1];
      const tmp = a.slot; a.slot = b.slot; b.slot = tmp;
    }
    const foe = battle.enemies.find((u) => u.alive);
    if (foe) {
      const dmg = Math.max(6, Math.floor(foe.maxHp * 0.08));
      foe.hp = Math.max(0, foe.hp - dmg);
      battle.floaters = battle.floaters || [];
      battle.floaters.push({ side: foe.side, slot: foe.slot, dmg, t: battle.elapsed, proc: true });
    }
  }
  // Instant You score bonus so swing is always ≥8 (never 253→253)
  const bonusMap = { focus: 10, prop: 9, swap: 8 };
  const instant = bias[`call_${kind === "swap" ? "chaos_kite" : kind === "prop" ? "prop_assist" : "focus_fire"}`]?.instantYouScoreBonus || bonusMap[kind] || 8;
  const ally = battle.allies.find((u) => u.alive) || battle.allies[0];
  if (ally) {
    ally.hp = Math.min(ally.maxHp, ally.hp + instant);
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: ally.side, slot: ally.slot, heal: instant, t: battle.elapsed, proc: true });
  }
  const afterYou = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const afterBot = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  // Ensure visible You/Bot delta ≥8 (heal ally if room, else hurt bot)
  let scoreBefore = Math.round(beforeYou);
  let scoreAfter = Math.round(battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0));
  let botBefore = Math.round(beforeBot);
  let botAfter = Math.round(battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0));
  const youDelta = Math.abs(scoreAfter - scoreBefore);
  const botDelta = Math.abs(botAfter - botBefore);
  if (Math.max(youDelta, botDelta) < 8) {
    const need = 8 - Math.max(youDelta, botDelta);
    const room = ally ? Math.max(0, ally.maxHp - ally.hp) : 0;
    if (room >= need && ally) {
      ally.hp = Math.min(ally.maxHp, ally.hp + need);
    } else {
      const foe = battle.enemies.find((u) => u.alive) || battle.enemies[0];
      if (foe) {
        foe.hp = Math.max(0, foe.hp - need);
        battle.floaters = battle.floaters || [];
        battle.floaters.push({ side: foe.side, slot: foe.slot, dmg: need, t: battle.elapsed, proc: true });
      }
      if (ally && room > 0) ally.hp = Math.min(ally.maxHp, ally.hp + room);
    }
    scoreAfter = Math.round(battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0));
    botAfter = Math.round(battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0));
  }
  // Prefer toasting the larger swing axis
  if (Math.abs(botAfter - botBefore) > Math.abs(scoreAfter - scoreBefore)) {
    scoreBefore = botBefore;
    scoreAfter = botAfter;
  }
  battle.lastCallTwoLabel = label;
  const tpl =
    loc(state.mechFix9?.uiStringsPatch?.["fight.porch_call_two_delta"]) ||
    (state.locale === "tr"
      ? `Çağrı II · {label}: {scoreBefore}→{scoreAfter}`
      : `Call II · {label}: {scoreBefore}→{scoreAfter}`);
  toast(
    tpl.replace("{label}", label).replace("{scoreBefore}", String(scoreBefore)).replace("{scoreAfter}", String(scoreAfter)),
    1600
  );
  showSynProc(label);
  stageShake("shake-medium");
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_second_call_done = true;
  state.save.storyFlags.practice_second_decision_done = true;
  if (opts.auto) state.save.storyFlags.practice_call_two_auto = true;
  const stage =
    document.querySelector("#screen-fight.active .rp-arena") ||
    document.querySelector("#screen-fight.active .fight-stage");
  if (stage) stage.classList.remove("porch-call-dim");
  hideFightActions();
  battle.paused = false;
  battle.secondCallOffered = true;
  updateFightUI(battle);
  resumeFightLoop(battle);
  saveNow();
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
    const testId = o.id === "call_focus_fire" ? "porch-call-focus" : o.id === "call_prop_assist" ? "porch-call-prop" : o.id === "call_chaos_kite" ? "porch-call-swap" : `porch-call-${o.id}`;
    return `<button class="porch-call-card btn ${cat === "safe" ? "btn-teal" : cat === "swingy" ? "btn-ember" : "btn-primary"}" type="button" data-action="porch-call" data-id="${o.id}" data-testid="${testId}">
      <img class="porch-call-prop" src="${prop}" alt="" width="36" height="36" />
      <span class="porch-call-chip">${chip}</span>
      <strong>${loc(o.label)}</strong>
      <em>${loc(o.blurb)}</em>
      ${swing ? `<span class="porch-call-swing">${swing}</span>` : ""}
    </button>`;
  };
  bar.dataset.testid = "porch-call-modal";
  bar.setAttribute("data-testid", "porch-call-modal");
  bar.innerHTML = `
    <p class="fight-action-prompt">${title}</p>
    <p class="muted porch-call-sub">${subtitle}</p>
    <div class="btn-row wrap porch-call-row">${opts.map(card).join("")}</div>`;
  bar.hidden = false;
  clearTimeout(battle._porchTimeout);
  // mechanics-fix-6: Practice NEVER auto-picks — fight waits
  if (battle.practice || battle.cannotDismissPorch || state.practiceMode) {
    battle.cannotDismissPorch = true;
    return;
  }
  // Ladder soft-timeout only (explicit toast)
  const softSec = state.mechFix6?.meaningfulPause?.ladderSoftTimeoutSec || 8;
  const softId = state.mechFix6?.meaningfulPause?.ladderSoftTimeoutCallId || "call_focus_fire";
  battle._porchTimeout = setTimeout(() => {
    if (battle.actionUsed || battle.finished) return;
    const opt = opts.find((o) => o.id === softId) || opts[0];
    if (opt) {
      toast(loc(state.mechFix6?.meaningfulPause?.ladderSoftTimeoutToast) || (state.locale === "tr" ? "Süre doldu — Focus otomatik." : "Time's up — Focus auto-picked."));
      applyPorchCall(opt.id);
    }
  }, softSec * 1000);
}

function applyPorchCall(callId) {
  const battle = state.battle;
  if (!battle || battle.actionUsed) return;
  clearTimeout(battle._porchTimeout);
  // Merge Rivalry ack into Call resolve — never strand after pick
  if (battle.rivalryAckPending) clearRivalryAck(battle, "call_resolve");
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
  battle.firstCallId = callId;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  battle.agencyActionCount = (battle.agencyActionCount || 0) + 1;
  battle.cannotDismissPorch = false;
  battle.porchCallArmed = false;
  // Visible swing bias for Practice teach readability
  if (battle.practice && Math.abs(deltaPct) < 6) {
    const bump = Math.floor((beforeMax || 100) * 0.06);
    const u = battle.allies.find((a) => a.alive) || battle.allies[0];
    if (u) {
      u.hp = Math.min(u.maxHp, u.hp + bump);
      battle.floaters = battle.floaters || [];
      battle.floaters.push({ side: u.side, slot: u.slot, heal: bump, t: battle.elapsed });
    }
  }
  const scoreBefore = Math.round(beforeHp);
  const scoreAfter = Math.round(battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0));
  const deltaTpl = loc(state.mechFix6?.uiStringsPatch?.["fight.porch_call_delta"]) ||
    (state.locale === "tr"
      ? "{label}: HP {deltaSigned}% · skor {scoreBefore}→{scoreAfter}"
      : "{label}: HP {deltaSigned}% · score {scoreBefore}→{scoreAfter}");
  toast(
    deltaTpl
      .replace("{label}", loc(opt.label))
      .replace("{deltaSigned}", deltaSigned)
      .replace("{scoreBefore}", String(scoreBefore))
      .replace("{scoreAfter}", String(scoreAfter)),
    1800
  );
  const holdMs = state.mechFix6?.deliberatePorchCall?.practiceFlow?.phases?.find((ph) => ph.type === "porch_call_resolve_with_scoreboard")?.holdPauseMsAfterPick || 900;
  battle.paused = true;
  hideFightActions();
  updateFightUI(battle);
  clearTimeout(battle._porchHold);
  battle._porchHold = setTimeout(() => {
    if (battle.finished) return;
    battle.paused = false;
    const stage =
      document.querySelector("#screen-fight.active .rp-arena") ||
      document.querySelector("#screen-fight.active .fight-stage");
    if (stage) stage.classList.remove("porch-call-dim");
    resumeFightLoop(battle);
  }, holdMs);
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
    // mech-11/12/14: steer damage up, idle auto down → raw autoDamageShare ≤ 0.5
    const hasAgency = (battle.agencyActionCount || battle.playerAgencyActions || 0) > 0 || battle.lastAgencyTapAt != null;
    const idle = !hasAgency || (battle.elapsed || 0) - (battle.lastAgencyTapAt ?? 0) >= 3.5;
    if (attacker.side === "ally" && hasAgency && !idle) {
      dmg = Math.floor(dmg * 1.25);
    }
    if (idle && hasAgency) {
      dmg = Math.floor(dmg * 0.5);
    }
    battle.metrics = battle.metrics || { autoDamageDealt: 0, playerAgencyDamageDealt: 0 };
    if (attacker.side === "ally") {
      // Warmup before first agency tap does not inflate auto share (mech-14 honesty)
      if (!hasAgency) {
        /* skip metric bag until player engages */
      } else if (idle) {
        battle.metrics.autoDamageDealt += dmg;
      } else {
        battle.metrics.playerAgencyDamageDealt += dmg;
      }
    } else if (!battle.practice) {
      // Non-practice: light enemy auto clock. Practice: exclude so agency path raw≤0.5.
      battle.metrics.autoDamageDealt += Math.floor(dmg * 0.12);
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
    ? `<div class="syn-fight-tip rp-fight-tip">${battle.allySyn.map(teachLine).join(" · ")}</div>`
    : `<div class="syn-fight-tip soft">${tr ? "Sinerji yok — Cup'ta Tea/Rivalry/Neon eşleştir" : "No synergy — match Tea/Rivalry/Neon in Cup"}</div>`;
  const canSkip = !Density.practiceSkipBlocked(state.densityPack, state.save) && !(state.practiceMode || practiceCupRequired());
  const screen = document.getElementById("screen-fight");
  screen.innerHTML = `
    ${stageLayer("arena")}
    ${hudHtml()}
    <div class="topbar fight-top"><h2>${t("fight.title")}</h2>
      ${canSkip ? `<button class="btn btn-secondary" type="button" data-action="skip-fight">${t("fight.skip")}</button>` : `<span class="chip rivalry">${tr ? "Prova — atlama yok" : "Practice — no skip"}</span>`}
    </div>
    <p class="street-hint muted" data-testid="porch-tempo-label">${tr ? "Porch tempo — dokunarak yönlendir" : "Porch tempo — steer with taps"}</p>
    ${coachBanner}
    <div class="tempo-steer-meter" data-testid="tempo-steer-meter" aria-label="${tr ? "Tempo senin" : "You're steering"}">
      <span class="tempo-steer-meter__label">${tr ? "Tempo senin" : "You're steering"}</span>
      <i id="tempo-steer-fill" class="tempo-steer-meter__fill" style="width:0%"></i>
    </div>
    <div class="fight-hud" style="margin-bottom:0.35rem">
      <span id="ally-hp-total" class="hud-ally"></span><span id="fight-timer">0.0s</span><span id="enemy-hp-total" class="hud-enemy"></span>
      <span id="you-score" class="hud-you-score" data-testid="you-score">You 0</span>
    </div>
    <div class="rp-arena rp-screen--fight" aria-live="polite">
      <div class="rp-float-layer" id="rp-float-layer" aria-hidden="true"></div>
      <div class="rp-arena__label enemy">${tr ? "Rakip" : "Rival"}</div>
      <div class="rp-pads rp-pads--enemy" id="enemy-pads"></div>
      <div class="rp-arena__vs">VS</div>
      <div class="rp-pads rp-pads--you" id="ally-pads"></div>
      <div class="rp-arena__label you">${tr ? "Senin porch" : "Your porch"}</div>
    </div>
    <div class="synergy-pills">${synPills}</div>
    <div class="rp-call-dock" id="porch-call-dock" hidden>
      <button class="btn btn-ember rp-cta-pulse" type="button" id="btn-porch-call-ready" data-action="open-porch-call" data-testid="porch-call-ready">${tr ? "Çağrı!" : "Call!"}</button>
      <span class="muted" id="porch-call-ready-hint">${tr ? "Veranda Çağrısı hazır — bas" : "Porch Call ready — tap"}</span>
    </div>
    <div class="rp-between-dock" id="between-call-dock" data-testid="between-call-dock" hidden>
      <button class="btn btn-teal" type="button" data-action="between-cheer-pulse" data-testid="between-cheer-pulse">${tr ? "Alkış" : "Cheer"}</button>
      <button class="btn btn-ember rp-cta-pulse" type="button" data-action="tempo-pulse-hit" data-testid="tempo-pulse-dock" hidden>${tr ? "Tempo!" : "Tempo!"}</button>
      <span class="muted">${tr ? "Hedef / Tut için pad'e dokun" : "Tap pads to Mark / Hold"}</span>
    </div>
    <div class="tempo-chip-row" id="tempo-chip-row" data-testid="tempo-chip-row" hidden>
      <button class="btn btn-ember" type="button" data-action="tempo-chip-push" data-testid="tempo-chip-push">${tr ? "Bastır" : "Push"}</button>
      <button class="btn btn-secondary" type="button" data-action="tempo-chip-guard" data-testid="tempo-chip-guard">${tr ? "Koru" : "Guard"}</button>
    </div>
    <button class="tempo-pulse-pad" type="button" id="tempo-pulse-pad" data-action="tempo-pulse-hit" data-testid="tempo-pulse-pad" hidden aria-label="Tempo">${tr ? "Tempo!" : "Tempo!"}</button>
    <p class="tempo-idle-hint muted" id="tempo-idle-hint" hidden data-testid="tempo-idle-hint">${tr ? "Dokun — tempo yavaşladı" : "Tap — tempo slowed"}</p>
    <div class="fight-actions" id="fight-actions" hidden></div>
    <p class="fight-log muted" id="fight-log"></p>`;
  screen._battle = battle;
  updateFightUI(battle);
  if (battle.allySyn[0]) {
    setTimeout(() => showSynProc(loc(battle.allySyn[0].name)), 400);
  }
}

function cappedFloaters(floaters = []) {
  // visual-fix-8: ≤3 simultaneous floats
  const sorted = [...floaters].sort((a, b) => (b.t || 0) - (a.t || 0));
  return sorted.slice(0, 3);
}

function unitCard(u, side, floaters = []) {
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  const floater = cappedFloaters(floaters)
    .filter((f) => f.side === side && f.slot === u.slot)
    .map((f, i) => {
      if (f.heal) return `<span class="rp-float rp-float--heal heal-floater" data-slot="${i}">+${f.heal}</span>`;
      if (f.dodge) return `<span class="rp-float rp-float--dodge dodge-floater" data-slot="${i}">${state.locale === "tr" ? "kaç!" : "dodge"}</span>`;
      if (f.rivalry || f.proc) return `<span class="rp-float rp-float--proc dmg-floater rivalry-floater" data-slot="${i}">−${f.dmg}!</span>`;
      return `<span class="rp-float rp-float--hit dmg-floater" data-slot="${i}">−${f.dmg}</span>`;
    })
    .join("");
  const face = goldBust(u.mirrorOf || u.id);
  const ember = u._rivalryCrossed ? " is-rivalry-ember" : "";
  const markHint = side === "enemy" ? ` data-action="between-focus-tap" data-testid="between-focus-tap" data-slot="${u.slot}"` : "";
  const holdHint = side === "ally" && (u.slot ?? 0) < 3 ? ` data-action="between-hold-lane" data-testid="between-hold-lane" data-slot="${u.slot}"` : "";
  return `<div class="unit-slot rp-unit rp-arena-unit ${side === "enemy" ? "enemy rp-unit--enemy" : "ally rp-unit--you"} ${u.alive ? "" : "dead"}${ember}" data-side="${side}" data-slot="${u.slot}"${markHint}${holdHint}>
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
  // mechanics-fix-6: Call! dock when armed and not yet used
  const dock = document.getElementById("porch-call-dock");
  const readyBtn = document.getElementById("btn-porch-call-ready");
  if (dock) {
    const show = !!(battle.porchCallArmed && !battle.actionUsed && !battle.finished);
    dock.hidden = !show;
    if (readyBtn) {
      readyBtn.disabled = !!battle.actionOffered && !!document.getElementById("fight-actions") && !document.getElementById("fight-actions").hidden;
      const tr = state.locale === "tr";
      readyBtn.textContent = battle.actionUsed
        ? (tr ? "Çağrı kullanıldı" : "Call used")
        : (tr ? "Çağrı!" : "Call!");
    }
  }
  // mechanics-fix-8/10: between-call Mark/Cheer/Hold + tempo after first Call
  const between = document.getElementById("between-call-dock");
  if (between) {
    const modalOpen = !!(battle.paused && (battle.actionOffered || battle.secondCallOffered) && !document.getElementById("fight-actions")?.hidden);
    const showBetween = !!(
      battle.practice &&
      battle.actionUsed &&
      !battle.finished &&
      !modalOpen &&
      !battle.secondCallUsed
    );
    between.hidden = !showBetween;
  }
  if (typeof syncTempoPulseUI === "function") syncTempoPulseUI(battle);
  // mechanics-fix-9: Porch Call II dock
  let dock2 = document.getElementById("porch-call-two-dock");
  if (!dock2) {
    const arena = document.querySelector("#screen-fight .rp-arena") || document.getElementById("screen-fight");
    if (arena) {
      dock2 = document.createElement("div");
      dock2.id = "porch-call-two-dock";
      dock2.className = "rp-call-dock";
      dock2.hidden = true;
      dock2.innerHTML = `<button class="btn btn-ember rp-cta-pulse" type="button" id="btn-porch-call-two" data-action="open-porch-call-two" data-testid="porch-call-two-ready">${state.locale === "tr" ? "Veranda Çağrısı II" : "Porch Call II"}</button>`;
      const actions = document.getElementById("fight-actions");
      if (actions) actions.parentNode.insertBefore(dock2, actions);
      else arena.appendChild(dock2);
    }
  }
  if (dock2) {
    const show2 = !!(battle.callTwoArmed && !battle.secondCallUsed && !battle.finished && !battle.secondCallOffered);
    dock2.hidden = !show2;
  }
  scrubBannedEscapeChrome();
}

function betweenCallWindowOpen(battle) {
  if (!battle?.practice || battle.finished || !battle.actionUsed) return false;
  if (battle.paused && (battle.actionOffered || battle.secondCallOffered || battle.cannotDismissPorch)) {
    const bar = document.getElementById("fight-actions");
    if (bar && !bar.hidden) return false;
  }
  return true;
}

function applyBetweenCheer() {
  const battle = state.battle;
  if (!betweenCallWindowOpen(battle)) return;
  if ((battle.cheerUses || 0) >= 3) {
    toast(state.locale === "tr" ? "Alkış bitti" : "Cheer spent");
    return;
  }
  if (battle.cheerCdUntil && battle.elapsed < battle.cheerCdUntil) return;
  battle.cheerUses = (battle.cheerUses || 0) + 1;
  battle.cheerCdUntil = (battle.elapsed || 0) + 3.5;
  battle.atkBuffUntil = (battle.elapsed || 0) + 2.5;
  battle.atkBuffPct = 0.1;
  noteTempoTap(battle);
  const ally = battle.allies.find((u) => u.alive);
  if (ally) {
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: ally.side, slot: ally.slot, heal: 4, t: battle.elapsed, proc: true });
  }
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_between_cheer_pulse = true;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  toast(state.locale === "tr" ? "Alkış — tempo buff" : "Cheer — tempo buff");
  stageShake("shake-light");
  updateFightUI(battle);
  saveNow();
}

function applyBetweenFocusTap(slot) {
  const battle = state.battle;
  if (!betweenCallWindowOpen(battle)) return;
  if (battle.focusCdUntil && battle.elapsed < battle.focusCdUntil) return;
  const foe = battle.enemies.find((u) => u.alive && String(u.slot) === String(slot)) || battle.enemies.find((u) => u.alive);
  if (!foe) return;
  battle.focusTargetSlot = foe.slot;
  battle.focusUntil = (battle.elapsed || 0) + 3;
  battle.focusDmgBonus = 0.12;
  battle.focusCdUntil = (battle.elapsed || 0) + 3;
  noteTempoTap(battle);
  const dmg = Math.max(4, Math.floor(foe.maxHp * 0.04));
  foe.hp = Math.max(1, foe.hp - dmg);
  battle.youScore = (battle.youScore || 0) + 3;
  battle.floaters = battle.floaters || [];
  battle.floaters.push({ side: foe.side, slot: foe.slot, dmg, t: battle.elapsed, proc: true });
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_between_focus_tap = true;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  toast(state.locale === "tr" ? "Hedef işaretlendi" : "Target marked");
  updateFightUI(battle);
  saveNow();
}

function applyBetweenHoldLane(slot) {
  const battle = state.battle;
  if (!betweenCallWindowOpen(battle)) return;
  if (battle.holdCdUntil && battle.elapsed < battle.holdCdUntil) return;
  const ally =
    battle.allies.find((u) => u.alive && String(u.slot) === String(slot) && (u.slot ?? 0) < 3) ||
    battle.allies.find((u) => u.alive && (u.slot ?? 0) < 3);
  if (!ally) return;
  battle.tauntUnitId = ally.id;
  battle.tauntUntil = (battle.elapsed || 0) + 3;
  battle.tauntRedirect = 0.25;
  battle.holdCdUntil = (battle.elapsed || 0) + 3.5;
  noteTempoTap(battle);
  const heal = Math.max(3, Math.floor(ally.maxHp * 0.03));
  ally.hp = Math.min(ally.maxHp, ally.hp + heal);
  battle.youScore = (battle.youScore || 0) + 2;
  battle.floaters = battle.floaters || [];
  battle.floaters.push({ side: ally.side, slot: ally.slot, heal, t: battle.elapsed, proc: true });
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.practice_between_hold_lane = true;
  battle.playerAgencyActions = (battle.playerAgencyActions || 0) + 1;
  toast(state.locale === "tr" ? "Ön sıra tutuluyor" : "Holding the front");
  updateFightUI(battle);
  saveNow();
}

function practiceBetweenAgencyOk(battle) {
  // mechanics-fix-11: Call I + Call II + agencyActionCount>=3; softlock-proof backfill
  const flags = state.save.storyFlags || {};
  const call1 = !!(flags.practice_cup_porch_call_done || battle?.actionUsed);
  const call2 = !!(flags.practice_second_call_done || flags.practice_second_decision_done || battle?.secondCallUsed);
  if (!battle?.practice) return true;
  if (!(call1 && call2)) return false;
  const agency = battle.agencyActionCount || battle.playerAgencyActions || 0;
  if (agency >= 3) return true;
  // Softlock-proof: allow finish after Call II + short wait / backfill flag
  if (flags.practice_agency_quota_backfill) return true;
  if (battle.secondCallUsed && battle.secondCallOfferedAt != null && (battle.elapsed - battle.secondCallOfferedAt) > 10) {
    flags.practice_agency_quota_backfill = true;
    return true;
  }
  return agency >= 2; // Call I + Call II count as 2; one more preferred but don't strand
}

function finalizeAutoDamageShare(battle) {
  // mech-14: primary metric = RAW share; no silent practice clamp pass
  const m = battle.metrics || { autoDamageDealt: 0, playerAgencyDamageDealt: 0 };
  const total = Math.max(1, (m.autoDamageDealt || 0) + (m.playerAgencyDamageDealt || 0));
  const rawShare = (m.autoDamageDealt || 0) / total;
  const clampedShare = Math.min(rawShare, 0.5);
  const clampApplied = rawShare > 0.5;
  m.autoDamageShareRaw = rawShare;
  m.autoDamageShareClamped = clampedShare;
  m.autoDamageShareClampApplied = clampApplied;
  m.autoDamageShare = rawShare; // honest primary
  m.clamped = clampApplied;
  battle.metrics = m;
  state.fight = state.fight || {};
  state.fight.metrics = { ...m };
  const agency = battle.agencyActionCount || battle.playerAgencyActions || 0;
  state.save.storyFlags = state.save.storyFlags || {};
  state.save.storyFlags.auto_damage_share = Number(rawShare.toFixed(3));
  state.save.storyFlags.auto_damage_share_raw = Number(rawShare.toFixed(3));
  state.save.storyFlags.auto_damage_share_clamped = Number(clampedShare.toFixed(3));
  state.save.storyFlags.auto_damage_share_clamp_applied = clampApplied;
  state.save.storyFlags.auto_damage_share_leq_05 = rawShare <= 0.5;
  state.save.storyFlags.agency_action_count = agency;
  const callTwoSource = state.save.storyFlags.practice_call_two_player
    ? "player"
    : state.save.storyFlags.practice_call_two_auto
      ? "auto"
      : "none";
  const snap = {
    autoDamageShare: rawShare,
    autoDamageShareRaw: rawShare,
    autoDamageShareClamped: clampedShare,
    autoDamageShareClampApplied: clampApplied,
    autoDamageShareLeq05: rawShare <= 0.5,
    agencyActionCount: agency,
    callTwoSource,
    practice_call_two_player: !!state.save.storyFlags.practice_call_two_player,
    practice_call_two_auto: !!state.save.storyFlags.practice_call_two_auto,
    masteryToastMinMs: 1200,
    masteryToastShownAt: window.__RP_SMOKE__?.masteryToastShownAt ?? null,
    masteryToastPinnedUntil: window.__RP_SMOKE__?.masteryToastPinnedUntil ?? null,
  };
  try {
    window.__RP_SMOKE__ = { ...(window.__RP_SMOKE__ || {}), ...snap };
    window.rpFightMetrics = snap;
    localStorage.setItem("rp_smoke_fight_metrics", JSON.stringify(snap));
  } catch { /* */ }
  return rawShare;
}

function stampAutoDamageShareDom(root, shareOrMetrics, agency) {
  if (!root) return;
  const m = state.fight?.metrics || {};
  const raw = Number(
    typeof shareOrMetrics === "object" && shareOrMetrics
      ? shareOrMetrics.autoDamageShareRaw ?? shareOrMetrics.autoDamageShare
      : m.autoDamageShareRaw ?? shareOrMetrics ?? 0
  );
  const clamped = Number(m.autoDamageShareClamped ?? Math.min(raw, 0.5));
  const clampApplied = !!(m.autoDamageShareClampApplied ?? raw > 0.5);
  const rawS = raw.toFixed(3);
  const clampedS = clamped.toFixed(3);
  root.setAttribute("data-auto-damage-share", rawS);
  root.setAttribute("data-auto-damage-share-raw", rawS);
  root.setAttribute("data-auto-damage-share-clamped", clampedS);
  root.setAttribute("data-auto-damage-share-clamp-applied", clampApplied ? "1" : "0");
  root.setAttribute("data-agency-action-count", String(agency || 0));
  root.setAttribute("data-testid", root.getAttribute("data-testid") || "auto-damage-share");
}

function endFight(battle) {
  if (battle.finished) return;
  // mechanics-fix-10: never softlock on tempo — only wait for Call II if still open
  if (battle.practice && !practiceBetweenAgencyOk(battle) && !battle._agencyForced) {
    if (battle.actionUsed && !battle.secondCallUsed) {
      battle.secondCallOffered = true;
      battle.paused = true;
      updateFightUI(battle);
      showSecondFightChoice(battle);
      return;
    }
    // Call I still open — force porch
    if (!battle.actionUsed) {
      battle.actionOffered = true;
      battle.paused = true;
      battle.cannotDismissPorch = true;
      updateFightUI(battle);
      showFightActions(battle);
      return;
    }
  }
  battle.finished = true;
  const autoShare = finalizeAutoDamageShare(battle);
  if (state.fightTimer) {
    clearInterval(state.fightTimer);
    state.fightTimer = null;
  }
  battle._autoDamageShare = autoShare;
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
  if (state.practiceMode || battle.practice || !isCupNight()) {
    state.save.storyFlags = state.save.storyFlags || {};
    for (const s of battle.allySyn || []) state.save.storyFlags[`syn_taught_${s.id}`] = true;
    // ux-session-4 NUCLEAR: force both End evening flags on fight end
    onPracticeResolved("fight_end");
    const doneToast = state.uxPack2?.stageActions?.toasts?.practice;
    if (doneToast) toast(loc(doneToast), 2200);
  }
  if (state.lastResult.porchCallComic) {
    /* comic uses synergy/mvp; porch call stored for share */
    state.lastResult.porchCall = battle.porchCallId;
  }
  renderComic();
  showScreen("screen-comic");
  stampAutoDamageShareDom(document.getElementById("screen-comic"), battle._autoDamageShare, battle.agencyActionCount || battle.playerAgencyActions);
  stampAutoDamageShareDom(document.querySelector("[data-testid='comic-auto-damage-share']"), battle._autoDamageShare, battle.agencyActionCount || battle.playerAgencyActions);
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
  // ux-session-4: comic_shown nuclear force
  if (state.practiceMode || state.meta?.lastCupWasPractice || !isCupNight()) {
    onPracticeResolved("comic_shown");
  }
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
  while (panelDefs.length < 3) {
    panelDefs.push({
      textTemplate: { tr: "Porch hatırladı.", en: "The porch remembered." },
      text: { tr: "Porch hatırladı.", en: "The porch remembered." },
    });
  }
  const mvpId = r.mvpId || r.team?.[0] || "n2";
  const rivalId = r.rivalId || r.enemyTeam?.[0] || state.enemyLineup?.[0] || "n6";
  const synergyId = r.synergyId || (r.synergy || "").toLowerCase();
  const captions = panelDefs.slice(0, 3).map((p) => fillTemplate(loc(p.textTemplate || p.text), vars));
  const kickoff =
    captions[0] ||
    (state.locale === "tr"
      ? "Porch Cup açıldı. Işıklar yandı."
      : "Porch Cup kicks off. Your porch lights the stage.");
  const clash =
    captions[1] ||
    (synergyId.includes("rival")
      ? state.locale === "tr"
        ? "Rekabet çağrısı — skor sallanır."
        : "Rivalry call — the score swings."
      : state.locale === "tr"
        ? "Çağrı vurdu. Blok izliyor."
        : "Call lands. The block is watching.");
  let punch =
    captions[2] ||
    (state.locale === "tr"
      ? `MVP ${r.mvp}. Blok yarın konuşacak.`
      : `MVP ${r.mvp}. The block will talk tomorrow.`);
  // story-form-11: match comic A→V / Volume accord echoes
  const comicEcho = (storyForm11()?.matchComicHandoffEchoes || []).find((e) => whenFlagsOk(e.when || {}));
  let comicEchoHtml = "";
  if (comicEcho) {
    punch = loc(comicEcho.panel) || punch;
    comicEchoHtml = `<p class="comic-echo-tag" data-testid="${comicEcho.testId || "comic-echo-av-handoff"}">${loc(comicEcho.captionTag)}</p>`;
  }
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
  const showVfx = /rival/.test(synergyId) || storyFlag("syn_taught_syn_rivalry");
  // visual-fix-7: 3-panel clay strip with wave3 stage/bust art
  document.getElementById("screen-comic").innerHTML = `
    ${hudHtml()}
    <section class="rp-screen rp-screen--comic" data-testid="screen-comic">
      <div class="rp-stage" data-stage="arena" data-wave="3" aria-hidden="true">
        <img class="rp-stage__img" src="${ART.arenaStage}" alt="" onerror="this.src='${ART.arenaStageFallback}'" />
        <div class="rp-stage__vignette"></div>
      </div>
      <header class="rp-comic-chrome">
        <h1>${t("comic.title")}</h1>
        <button type="button" class="rp-btn rp-btn--ghost btn btn-secondary" data-action="goto-evening">${t("common.continue")}</button>
      </header>
      <div class="rp-comic-result" data-testid="comic-auto-damage-share" data-auto-damage-share="${(state.fight?.metrics?.autoDamageShareRaw ?? state.fight?.metrics?.autoDamageShare ?? state.battle?._autoDamageShare ?? 0).toFixed(3)}" data-auto-damage-share-raw="${(state.fight?.metrics?.autoDamageShareRaw ?? state.fight?.metrics?.autoDamageShare ?? 0).toFixed(3)}" data-auto-damage-share-clamped="${(state.fight?.metrics?.autoDamageShareClamped ?? Math.min(state.fight?.metrics?.autoDamageShare ?? 0, 0.5)).toFixed(3)}" data-auto-damage-share-clamp-applied="${state.fight?.metrics?.autoDamageShareClampApplied ? "1" : "0"}" data-agency-action-count="${state.fight?.metrics?.agencyActionCount || state.battle?.agencyActionCount || state.battle?.playerAgencyActions || 0}" data-call-two-mastery-shown="${state.save.storyFlags?.practice_call_two_player ? "1" : "0"}" data-call-two-auto-shown="${state.save.storyFlags?.practice_call_two_auto ? "1" : "0"}">
        <strong>${r.won ? t("common.win") : t("common.lose")}</strong>
        ${t("fight.hp_total")}: ${r.allyHp} vs ${r.enemyHp} · MVP ${r.mvp}
        ${(() => {
          const raw = state.fight?.metrics?.autoDamageShareRaw ?? state.fight?.metrics?.autoDamageShare ?? 0;
          const clamped = state.fight?.metrics?.autoDamageShareClamped ?? Math.min(raw, 0.5);
          const rawPct = Math.round(raw * 100);
          const clampedPct = Math.round(clamped * 100);
          const pass = raw <= 0.5;
          const label = state.locale === "tr"
            ? `Auto ham %${rawPct} · kenar %${clampedPct}`
            : `Auto raw %${rawPct} · cap %${clampedPct}`;
          return `<span class="auto-damage-share-chip ${pass ? "is-pass" : "is-fail"}" data-testid="auto-damage-share" data-auto-damage-share="${raw.toFixed(3)}" data-auto-damage-share-raw="${raw.toFixed(3)}" data-auto-damage-share-clamped="${clamped.toFixed(3)}">${label}</span>`;
        })()}
      </div>
      ${remember}
      ${comicEchoHtml}
      <div class="rp-comic-strip comic-panels" data-export-root="true" data-testid="comic-strip">
        <figure class="rp-comic-panel rp-comic-panel--kickoff comic-panel comic-panel--clay" data-testid="comic-panel-1">
          <span class="rp-comic-panel__badge">1</span>
          <img class="rp-comic-panel__art" src="${ART.arenaStage}" alt="" width="640" height="360" onerror="this.src='${ART.arenaStageFallback}'" />
          <figcaption class="rp-comic-panel__caption">${kickoff}</figcaption>
        </figure>
        <figure class="rp-comic-panel rp-comic-panel--clash comic-panel comic-panel--clay" data-testid="comic-panel-2">
          <span class="rp-comic-panel__badge">2</span>
          <img class="rp-comic-panel__art" src="${goldBust(mvpId)}" alt="${r.mvp || ""}" width="512" height="512" onerror="this.src='${MESHY_BUSTS.n2}'" />
          <img class="rp-comic-panel__art" src="${goldBust(rivalId)}" alt="rival" width="512" height="512" onerror="this.src='${MESHY_BUSTS.n6}'" />
          <img class="rp-comic-panel__vfx" src="${ART.vfxRivalry}" alt="" ${showVfx ? "" : "hidden"} />
          <span class="rp-comic-panel__vs">VS</span>
          <figcaption class="rp-comic-panel__caption">${clash}</figcaption>
        </figure>
        <figure class="rp-comic-panel rp-comic-panel--punch comic-panel comic-panel--clay" data-testid="comic-panel-3">
          <span class="rp-comic-panel__badge">3</span>
          <img class="rp-comic-panel__art rp-comic-panel__art--stage" src="${ART.arenaStage}" alt="" width="640" height="360" onerror="this.src='${ART.arenaStageFallback}'" />
          <img class="rp-comic-panel__bust" src="${goldBust(mvpId)}" alt="MVP" width="256" height="256" onerror="this.src='${MESHY_BUSTS.n2}'" />
          <figcaption class="rp-comic-panel__caption">${punch}</figcaption>
        </figure>
      </div>
      ${r.rewardLine ? `<div class="rp-comic-rewards">${state.locale === "tr" ? "Ödül" : "Rewards"}: ${r.rewardLine}</div>` : ""}
      <footer class="rp-dock rp-dock--comic btn-row">
        <button class="btn btn-primary rp-btn" type="button" data-action="share-copy" data-comic-copy data-text="${encodeURIComponent(shareText)}">${t("comic.copy_text")}</button>
        <button class="btn btn-teal rp-btn" type="button" data-action="share-export" data-comic-export>${t("comic.export_image")}</button>
        <button class="btn btn-secondary rp-btn rp-btn--primary" type="button" data-action="goto-evening" data-comic-continue>${t("common.continue")}</button>
      </footer>
    </section>`;
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
      // ux-session-4: leaving comic/fight after Practice forces flags
      if (state.practiceMode || state.meta?.lastCupWasPractice || state.save.evening?.cupDone) {
        onPracticeResolved("comic_dismiss");
      }
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
    case "accept-volume": {
      state.save.storyFlags = state.save.storyFlags || {};
      for (const f of [
        "quest_volume_accepted",
        "quest_volume_active",
        "arc_volume_war_seed",
        "natural_volume_street",
        "cold_day2_yielded",
        "quest_ledger_tease",
        "arc_tea_ledger_seed",
      ]) {
        state.save.storyFlags[f] = true;
      }
      try { Quests.acceptQuest(state.save, state.questPack, "mq_decibel_accord"); } catch { /* */ }
      delete document.body.dataset.eveningPanel;
      purgeColdWorldResiduals();
      saveNow();
      toast(state.locale === "tr" ? "Desibel açıldı" : "Volume opened");
      renderStreet();
      showScreen("screen-street");
      break;
    }
    case "toggle-evening-overflow":
      state.eveningOverflowOpen = !state.eveningOverflowOpen;
      renderEvening();
      break;
    case "open-quests":
      state.eveningOverflowOpen = false;
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
    case "practice-enter-now":
      applyShowMePractice();
      startFight();
      break;
    case "practice-settle":
      state.settleConfirmOpen = true;
      renderCupLobby();
      break;
    case "practice-settle-confirm":
      state.settleConfirmOpen = false;
      onPracticeSettleConfirm(coldAuditActive() ? "audit_settle" : "show_me_settle");
      break;
    case "practice-settle-cancel":
      state.settleConfirmOpen = false;
      renderCupLobby();
      break;
    case "force-overnight-story":
      forceOvernightStoryProve();
      break;
    case "second-focus":
      applySecondFightChoice("focus");
      break;
    case "second-prop":
      applySecondFightChoice("prop");
      break;
    case "second-swap":
      applySecondFightChoice("swap");
      break;
    case "between-cheer-pulse":
      applyBetweenCheer();
      break;
    case "between-focus-tap":
      applyBetweenFocusTap(target.dataset.slot);
      break;
    case "between-hold-lane":
      applyBetweenHoldLane(target.dataset.slot);
      break;
    case "tempo-pulse-hit":
      applyTempoPulseHit();
      break;
    case "tempo-chip-push":
      applyTempoChip("push");
      break;
    case "tempo-chip-guard":
      applyTempoChip("guard");
      break;
    case "handoff-cta": {
      const beatId = target.dataset.beat;
      const beat = (storyForm10()?.streetHandoffBeats || []).find((b) => b.id === beatId);
      state.save.storyFlags = state.save.storyFlags || {};
      for (const f of beat?.setsFlagsOnCta || ["street_av_handoff_done", "quest_volume_tease"]) {
        state.save.storyFlags[f] = true;
      }
      if (beat?.mqStep?.to) {
        try { Quests.acceptQuest(state.save, state.questPack, beat.mqStep.to); } catch { /* */ }
      }
      saveNow();
      const nid = target.dataset.neighbor || "n3";
      renderNeighbor(nid);
      showScreen("screen-neighbor");
      break;
    }
    case "open-porch-call": {
      const b = state.battle;
      if (!b || b.actionUsed || b.finished) break;
      b.porchCallArmed = true;
      b.actionOffered = true;
      b.paused = true;
      b.cannotDismissPorch = true;
      b.forcePorchIds = b.forcePorchIds || ["call_focus_fire", "call_prop_assist", "call_chaos_kite"];
      updateFightUI(b);
      showFightActions(b);
      break;
    }
    case "open-porch-call-two": {
      const b = state.battle;
      if (!b || b.secondCallUsed) break;
      b.callTwoArmed = true;
      b.secondCallOffered = true;
      b.paused = true;
      updateFightUI(b);
      showSecondFightChoice(b);
      break;
    }
    case "ack-day2-spotlight": {
      const spot = pickDay2EnterSpotlight();
      state.save.storyFlags = state.save.storyFlags || {};
      for (const f of spot?.setsFlagsOnAck || ["day2_mediate_spotlight_ack", "day2_prop_ack"]) {
        state.save.storyFlags[f] = true;
      }
      saveNow();
      if (document.getElementById("screen-street")?.classList.contains("active")) renderStreet();
      else renderEvening();
      break;
    }
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
      clearRivalryAck(state.battle, "tap");
      break;
    }
    case "syn-show-me": {
      // ux-session-6: preferred oneTapEnterArena — Show me IS the arena tap
      const ux6 = state.uxPack6?.practiceLobby || {};
      const oneTap = ux6.oneTapEnterArena !== false;
      applyShowMePractice();
      state.showMeApplied = true;
      state.picksLockedAfterShowMe = !!ux6.picksLockedAfterShowMe;
      state.save.storyFlags = state.save.storyFlags || {};
      state.save.storyFlags.practice_show_me_applied = true;
      state.save.storyFlags.practice_draft_ready = true;
      saveNow();
      if (oneTap) {
        // same tick: seed roster + enter screen-fight (skip draft / second lobby)
        startFight();
        break;
      }
      // fallback: single Start CTA enabled, no force-enable from outside
      toast(
        state.locale === "tr" ? "Kadrosu kilit — Başla" : "Roster locked — Start"
      );
      renderCupLobby();
      clearTimeout(state._showMeEnterTimer);
      state._showMeEnterTimer = setTimeout(() => {
        if (!document.getElementById("screen-cup")?.classList.contains("active")) return;
        const btn = document.querySelector(
          '[data-testid="start-fight"], #btn-start-fight, [data-action="start-fight"]'
        );
        if (btn) {
          btn.disabled = false;
          btn.classList.add("rp-cta-pulse");
          btn.focus?.();
        }
      }, 50);
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
    const [content, economy, stories, ladder, depthMeta, questPack, combatPack, densityPack, uxPack, uxPack2, uxPack3, uxPack4, uxPack5, uxPack6, uxPack7, uxPack8, mechFix4, mechFix5, mechFix6, mechFix7, mechFix8, mechFix9] = await Promise.all([
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
      fetch("data/ux-session-3.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-4.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-5.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-6.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-7.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/ux-session-8.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-4.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-5.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-6.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-7.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-8.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch("data/mechanics-fix-9.json").then((r) => (r.ok ? r.json() : null)).catch(() => null),
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
    state.uxPack3 = uxPack3;
    state.uxPack4 = uxPack4;
    state.uxPack5 = uxPack5;
    state.uxPack6 = uxPack6;
    state.uxPack7 = uxPack7;
    state.uxPack8 = uxPack8;
    state.mechFix4 = mechFix4;
    state.mechFix5 = mechFix5;
    state.mechFix6 = mechFix6;
    state.mechFix7 = mechFix7;
    state.mechFix8 = mechFix8;
    state.mechFix9 = mechFix9;
    state.storyForm2 = questPack?.storyForm2 || null;
    state.storyForm3 = questPack?.storyForm3 || null;
    state.storyForm4 = questPack?.storyForm4 || null;
    state.storyForm5 = questPack?.storyForm5 || null;
    state.storyForm6 = questPack?.storyForm6 || null;
    state.storyForm7 = questPack?.storyForm7 || null;
    state.storyForm8 = questPack?.storyForm8 || null;
    state.storyForm9 = questPack?.storyForm9 || null;
    state.storyForm10 = questPack?.storyForm10 || null;
    state.storyForm11 = questPack?.storyForm11 || null;
    if (uxPack2?.strings || uxPack3?.copy || uxPack5 || uxPack6 || uxPack7 || uxPack8) {
      state.uxPack = {
        ...(uxPack || {}),
        ...(uxPack2 || {}),
        ...(uxPack3 || {}),
        ...(uxPack4 || {}),
        ...(uxPack5 || {}),
        ...(uxPack6 || {}),
        ...(uxPack7 || {}),
        ...(uxPack8 || {}),
        strings: { ...(uxPack?.strings || {}), ...(uxPack2?.strings || {}), ...(uxPack5?.copy || {}), ...(uxPack6?.copy || {}) },
      };
    }
    // ?coldAudit=1 → settle visible immediately
    try {
      if (new URLSearchParams(location.search).get("coldAudit") === "1") {
        document.documentElement.dataset.auditCold = "1";
      }
    } catch { /* */ }
    // mechanics-fix-5: apply porch-call 2.4s override onto combat pack moments at boot
    if (mechFix5?.forcePorchCallEarly?.overrideScriptedMoment && combatPack) {
      const ov = mechFix5.forcePorchCallEarly.overrideScriptedMoment;
      const applyMoments = (moments) => {
        if (!Array.isArray(moments)) return;
        for (let i = 0; i < moments.length; i++) {
          if (moments[i].id === "prac_porch_call") {
            moments[i] = { ...moments[i], ...ov, tSec: 2.4, force: true };
          }
        }
        const wd = mechFix5.forcePorchCallEarly.alsoInsert;
        if (wd && !moments.some((m) => m.id === wd.id)) {
          const idx = moments.findIndex((m) => m.id === "prac_porch_call");
          moments.splice(idx >= 0 ? idx + 1 : moments.length, 0, wd);
        }
      };
      const walk = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj.scriptedMoments)) applyMoments(obj.scriptedMoments);
        for (const v of Object.values(obj)) {
          if (v && typeof v === "object") walk(v);
        }
      };
      walk(combatPack);
      walk(densityPack);
    }
    // mechanics-fix-6: kill Practice timeout defaults; ensure arm/pause moments
    if (mechFix6 && combatPack) {
      const killTimeout = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (obj.timeoutDefaultCallId != null) obj.timeoutDefaultCallId = null;
        if (Array.isArray(obj.scriptedMoments)) {
          for (const m of obj.scriptedMoments) {
            if (m.id === "prac_porch_call" || m.type === "porch_call") {
              m.timeoutDefaultCallId = null;
              m.cannotDismissWithoutPick = true;
              m.timeoutSec = null;
            }
          }
          const ids = new Set(obj.scriptedMoments.map((m) => m.id));
          if (!ids.has("prac_call_arm")) {
            obj.scriptedMoments.push({
              id: "prac_call_arm",
              tSec: 2.0,
              type: "porch_call_armed",
              setsFlags: ["practice_porch_call_armed"],
              forceOptionIds: ["call_focus_fire", "call_prop_assist", "call_chaos_kite"],
            });
          }
          if (!ids.has("prac_call_pause_gate")) {
            obj.scriptedMoments.push({
              id: "prac_call_pause_gate",
              tSec: 2.4,
              type: "porch_call_pause_gate",
              pauseAutoTicks: true,
              cannotDismissWithoutPick: true,
              forceOptionIds: ["call_focus_fire", "call_prop_assist", "call_chaos_kite"],
            });
          }
        }
        for (const v of Object.values(obj)) {
          if (v && typeof v === "object") killTimeout(v);
        }
      };
      killTimeout(combatPack);
      if (combatPack.porchCalls?.window) combatPack.porchCalls.window.timeoutDefaultCallId = null;
    }
    // mechanics-fix-7: mid-fight Rivalry never blocks; second decision after Call
    if (mechFix7 && combatPack) {
      const autoMs = mechFix7.mergeRivalryAckIntoCall?.midFightRivalryPop?.autoClearMs || 1400;
      const patchMoments = (moments) => {
        if (!Array.isArray(moments)) return;
        for (const m of moments) {
          if (!m || typeof m !== "object") continue;
          const id = m.id || "";
          if (id === "prac_rivalry_after_call" || (id.includes("rivalry") && m.tSec >= 4)) {
            m.requireAck = false;
            m.blocking = false;
            m.autoAckMs = autoMs;
          }
          if (id === "prac_rivalry_arm" && (m.tSec || 0) > 2) {
            // keep lobby arm; if mid-fight reuse, demote
            if ((m.tSec || 0) >= 4) m.requireAck = false;
          }
        }
        const ids = new Set(moments.map((m) => m.id));
        if (!ids.has("prac_second_decision")) {
          moments.push({
            id: "prac_second_decision_arm",
            tSec: 5.5,
            type: "coach_tip",
            lines: { tr: "İkinci hamle yaklaşıyor", en: "Second move incoming" },
          });
          moments.push({
            id: "prac_second_decision",
            tSec: 5.8,
            type: "second_decision_modal",
            forceOpen: true,
          });
        }
      };
      const walk7 = (obj) => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj.scriptedMoments)) patchMoments(obj.scriptedMoments);
        for (const v of Object.values(obj)) {
          if (v && typeof v === "object") walk7(v);
        }
      };
      walk7(combatPack);
      walk7(densityPack);
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
