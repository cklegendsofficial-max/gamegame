/** Rival Porch quest log — accept / progress / complete (worker pack + stub). */

export function emptyQuestSave() {
  return { entries: {}, lastClaimed: [], worldActive: [] };
}

export function ensureQuestSave(save) {
  if (!save.quests || typeof save.quests !== "object") save.quests = emptyQuestSave();
  if (!save.quests.entries) save.quests.entries = {};
  if (!save.quests.lastClaimed) save.quests.lastClaimed = [];
  if (!save.quests.worldActive) save.quests.worldActive = [];
  return save.quests;
}

/** Convert worker pack objectives into runtime track shape. */
function normalizeObjective(o) {
  const track = o.track || {};
  let type = track.type || o.kind || "flag";
  const out = {
    id: o.id,
    label: o.label,
    count: track.count || 1,
    kind: o.kind,
    worldConsequenceId: o.worldConsequenceId || null,
    setsFlags: o.setsFlags || [],
    rawTrack: track,
  };
  if (type === "action" && track.actionId === "porch_checkin") type = "checkin";
  if (type === "cupComplete" || type === "cupCompleteAny") type = "cup_finish";
  if (type === "cupSynergyAny") type = "cup_synergy";
  if (type === "dialogueComplete") type = "visit_scene";
  if (type === "talk") type = "talk";
  if (type === "affinityAny") type = "affinity_any";
  if (type === "flagAny") type = "flag_any";
  if (type === "dailyEvent") type = "street_event";
  if (type === "shareComic") type = "share";
  if (type === "cosmeticOwned" || type === "decorOwned") type = "own_item";
  if (type === "walletOr") type = "wallet";
  if (type === "compound" || type === "or" || type === "choice") type = type; // keep
  out.type = type;
  if (track.neighborId || o.neighborId) out.neighborId = track.neighborId || o.neighborId;
  if (track.flag) out.flag = track.flag;
  if (track.flags) out.flags = track.flags;
  if (track.min != null) out.min = track.min;
  if (track.itemId) out.itemId = track.itemId;
  if (track.tags) out.tags = track.tags;
  if (track.all) out.all = track.all;
  if (track.options) out.options = track.options;
  return out;
}

function normalizeQuest(q) {
  const links = q.links || {};
  return {
    id: q.id,
    type: q.type || "side",
    title: q.title,
    blurb: q.blurb || q.summary,
    summary: q.summary || q.blurb,
    giver: q.giver || null,
    arcId: links.arcId || q.arcId || null,
    acceptDayMin: q.dayWindow?.start || q.acceptDayMin || 1,
    acceptDayMax: q.dayWindow?.end || q.acceptDayMax || 99,
    week: q.week || null,
    neighbors: q.neighbors || [],
    unlockRequires: q.unlockRequires || {},
    setsFlagsOnStart: q.setsFlagsOnStart || [],
    objectives: (q.objectives || []).map(normalizeObjective),
    rewards: q.rewards || {},
    expire: q.expire || null,
    failure: q.failure || null,
    links,
    _raw: q,
  };
}

export function normalizeQuestPack(raw) {
  if (!raw) return { schemaVersion: 1, quests: [], worldConsequences: {} };
  const quests = (raw.quests || []).map(normalizeQuest);
  let worldConsequences = raw.worldConsequences || {};
  if (Array.isArray(worldConsequences)) {
    const map = {};
    for (const w of worldConsequences) if (w?.id) map[w.id] = w;
    worldConsequences = map;
  }
  return {
    schemaVersion: raw.schemaVersion || 1,
    source: raw.questPackId || raw.source || "pack",
    quests,
    worldConsequences,
    dayCalendar: raw.dayCalendar || null,
    principles: raw.principles || null,
    journalSpine: raw.journalSpine || null,
    storyForm2: raw.storyForm2 || null,
    storyForm3: raw.storyForm3 || null,
    storyForm4: raw.storyForm4 || null,
    storyForm5: raw.storyForm5 || null,
    storyForm6: raw.storyForm6 || null,
    storyForm7: raw.storyForm7 || null,
    storyForm8: raw.storyForm8 || null,
    storyForm9: raw.storyForm9 || null,
    storyForm10: raw.storyForm10 || null,
    storyForm12: raw.storyForm12 || null,
    storyForm13: raw.storyForm13 || null,
    storyForm14: raw.storyForm14 || null,
    storyForm15: raw.storyForm15 || null,
    storyForm16: raw.storyForm16 || null,
    storyForm17: raw.storyForm17 || null,
    storyForm18: raw.storyForm18 || null,
    storyForm19: raw.storyForm19 || null,
    storyForm20: raw.storyForm20 || null,
    storyForm11: raw.storyForm11 || null,
  };
}

export function mergeQuestPacks(stub, overlay) {
  const a = normalizeQuestPack(stub);
  const b = overlay ? normalizeQuestPack(overlay) : null;
  if (!b?.quests?.length) {
    // Still merge form overlays / WC even if quest list empty
    if (!overlay) return a;
    return {
      ...a,
      worldConsequences: { ...(a.worldConsequences || {}), ...(b.worldConsequences || {}) },
      storyForm2: b.storyForm2 || a.storyForm2,
      storyForm3: b.storyForm3 || a.storyForm3,
      storyForm4: b.storyForm4 || a.storyForm4,
      storyForm5: b.storyForm5 || a.storyForm5,
      storyForm6: b.storyForm6 || a.storyForm6,
      storyForm7: b.storyForm7 || a.storyForm7,
      storyForm8: b.storyForm8 || a.storyForm8,
      storyForm9: b.storyForm9 || a.storyForm9,
      storyForm10: b.storyForm10 || a.storyForm10,
      storyForm12: b.storyForm12 || a.storyForm12,
      storyForm13: b.storyForm13 || a.storyForm13,
      storyForm14: b.storyForm14 || a.storyForm14,
      storyForm15: b.storyForm15 || a.storyForm15,
      storyForm16: b.storyForm16 || a.storyForm16,
      storyForm17: b.storyForm17 || a.storyForm17,
      storyForm18: b.storyForm18 || a.storyForm18,
      storyForm19: b.storyForm19 || a.storyForm19,
      storyForm20: b.storyForm20 || a.storyForm20,
      storyForm11: b.storyForm11 || a.storyForm11,
      journalSpine: b.journalSpine || a.journalSpine,
    };
  }
  // Overlay (worker pack) wins entirely when present — it's the design source of truth
  return {
    ...a,
    ...b,
    source: b.source || "merged",
    worldConsequences: { ...(a.worldConsequences || {}), ...(b.worldConsequences || {}) },
    storyForm2: b.storyForm2 || a.storyForm2,
    storyForm3: b.storyForm3 || a.storyForm3,
    storyForm4: b.storyForm4 || a.storyForm4,
    storyForm5: b.storyForm5 || a.storyForm5,
    storyForm6: b.storyForm6 || a.storyForm6,
    storyForm7: b.storyForm7 || a.storyForm7,
    storyForm8: b.storyForm8 || a.storyForm8,
    storyForm9: b.storyForm9 || a.storyForm9,
    storyForm10: b.storyForm10 || a.storyForm10,
      storyForm12: b.storyForm12 || a.storyForm12,
      storyForm13: b.storyForm13 || a.storyForm13,
      storyForm14: b.storyForm14 || a.storyForm14,
      storyForm15: b.storyForm15 || a.storyForm15,
      storyForm16: b.storyForm16 || a.storyForm16,
      storyForm17: b.storyForm17 || a.storyForm17,
      storyForm18: b.storyForm18 || a.storyForm18,
      storyForm19: b.storyForm19 || a.storyForm19,
      storyForm20: b.storyForm20 || a.storyForm20,
    storyForm11: b.storyForm11 || a.storyForm11,
    journalSpine: b.journalSpine || a.journalSpine,
  };
}

export function allQuestDefs(pack) {
  return pack?.quests || [];
}

export function questDef(pack, id) {
  return allQuestDefs(pack).find((q) => q.id === id) || null;
}

export function isAccepted(save, id) {
  const e = ensureQuestSave(save).entries[id];
  return e?.status === "active" || e?.status === "complete";
}

export function isComplete(save, id) {
  return ensureQuestSave(save).entries[id]?.status === "complete";
}

function hasFlag(save, flag) {
  return !!save.storyFlags?.[flag];
}

function unlockOk(save, req = {}) {
  if (req.flagsAll?.length && !req.flagsAll.every((f) => hasFlag(save, f))) return false;
  if (req.flagsAny?.length && !req.flagsAny.some((f) => hasFlag(save, f))) return false;
  if (req.questComplete?.length) {
    for (const id of req.questComplete) {
      if (!isComplete(save, id)) return false;
    }
  }
  if (req.questCompleteId && !isComplete(save, req.questCompleteId)) return false;
  return true;
}

export function availableQuests(pack, save) {
  const day = save.dayIndex || 1;
  return allQuestDefs(pack).filter((q) => {
    if (isAccepted(save, q.id)) return false;
    if (day < (q.acceptDayMin || 1)) return false;
    // Side quests only inside window; main stays offerable after window (soft expire on claim)
    if (q.type !== "main" && day > (q.acceptDayMax || 99)) return false;
    if (!unlockOk(save, q.unlockRequires)) return false;
    return true;
  });
}

export function activeQuests(pack, save) {
  ensureQuestSave(save);
  return allQuestDefs(pack).filter((q) => ensureQuestSave(save).entries[q.id]?.status === "active");
}

export function activeMainQuest(pack, save) {
  return activeQuests(pack, save).find((q) => q.type === "main") || null;
}

export function completedQuests(pack, save) {
  ensureQuestSave(save);
  return allQuestDefs(pack).filter((q) => ensureQuestSave(save).entries[q.id]?.status === "complete");
}

export function acceptQuest(save, pack, id) {
  const def = questDef(pack, id);
  if (!def || isAccepted(save, id)) return false;
  const qs = ensureQuestSave(save);
  const progress = {};
  for (const o of def.objectives || []) progress[o.id] = 0;
  qs.entries[id] = {
    status: "active",
    progress,
    acceptedDay: save.dayIndex || 1,
  };
  save.storyFlags = save.storyFlags || {};
  for (const f of def.setsFlagsOnStart || []) save.storyFlags[f] = true;
  if (def.arcId) {
    if (!save.arcs) save.arcs = {};
    if (!save.arcs[def.arcId]) {
      save.arcs[def.arcId] = { startedDay: save.dayIndex || 1, complete: false, lastBeatId: null };
    }
    save.storyFlags[`${def.arcId}_active`] = true;
    save.storyFlags[`${def.arcId}_seed`] = true;
  }
  // Recompute flag-based progress immediately
  syncQuestProgressFromWorld(save, pack);
  return true;
}

export function objectiveDone(entry, obj) {
  return (entry?.progress?.[obj.id] || 0) >= (obj.count || 1);
}

export function questReadyToComplete(def, entry) {
  if (!def || !entry || entry.status !== "active") return false;
  return (def.objectives || []).every((o) => objectiveDone(entry, o));
}

function bumpObj(entry, obj, amount = 1) {
  const need = obj.count || 1;
  const before = entry.progress[obj.id] || 0;
  if (before >= need) return false;
  entry.progress[obj.id] = Math.min(need, before + amount);
  return entry.progress[obj.id] !== before;
}

function trackSatisfied(save, trackLike, pack) {
  if (!trackLike) return false;
  const type = trackLike.type;
  if (type === "flag") return hasFlag(save, trackLike.flag);
  if (type === "flagAny" || type === "flag_any") return (trackLike.flags || []).some((f) => hasFlag(save, f));
  if (type === "affinityAny" || type === "affinity_any") {
    const min = trackLike.min ?? 10;
    const need = trackLike.count || 1;
    const n = Object.values(save.affinity || {}).filter((v) => (v || 0) >= min).length;
    return n >= need;
  }
  if (type === "cosmeticOwned" || type === "decorOwned" || type === "own_item") {
    const id = trackLike.itemId;
    const owned = save.ownedCosmetics || {};
    for (const arr of Object.values(owned)) if ((arr || []).includes(id)) return true;
    if (save.decorSlots?.[id]) return true;
    if (save.inventory?.[id]) return true;
    return false;
  }
  if (type === "compound") return (trackLike.all || []).every((t) => trackSatisfied(save, t, pack));
  if (type === "or") return (trackLike.options || []).some((t) => trackSatisfied(save, t, pack));
  return false;
}

/** Pull flag/affinity/own progress from world state into active quests. */
export function syncQuestProgressFromWorld(save, pack) {
  const qs = ensureQuestSave(save);
  const newly = [];
  for (const def of activeQuests(pack, save)) {
    const entry = qs.entries[def.id];
    if (!entry || entry.status !== "active") continue;
    for (const obj of def.objectives || []) {
      if (objectiveDone(entry, obj)) continue;
      let setTo = null;
      if (obj.type === "flag" && hasFlag(save, obj.flag)) setTo = obj.count || 1;
      else if (obj.type === "flag_any" && (obj.flags || []).some((f) => hasFlag(save, f))) setTo = obj.count || 1;
      else if (obj.type === "affinity_any") {
        const min = obj.min ?? 10;
        const n = Object.values(save.affinity || {}).filter((v) => (v || 0) >= min).length;
        setTo = Math.min(obj.count || 1, n);
      } else if (obj.type === "own_item" && trackSatisfied(save, { type: "own_item", itemId: obj.itemId }, pack)) {
        setTo = obj.count || 1;
      } else if ((obj.type === "compound" || obj.type === "or") && trackSatisfied(save, obj.rawTrack || obj, pack)) {
        setTo = obj.count || 1;
      } else if (obj.rawTrack && trackSatisfied(save, obj.rawTrack, pack)) {
        setTo = obj.count || 1;
      }
      if (setTo != null && setTo > (entry.progress[obj.id] || 0)) {
        entry.progress[obj.id] = setTo;
        newly.push({ questId: def.id, objId: obj.id, progress: setTo, need: obj.count || 1 });
        onObjectiveAdvanced(save, pack, def, obj, entry);
      }
    }
  }
  refreshWorldConsequences(save, pack);
  return newly;
}

function onObjectiveAdvanced(save, pack, def, obj, entry) {
  save.storyFlags = save.storyFlags || {};
  for (const f of obj.setsFlags || []) save.storyFlags[f] = true;
  if (obj.worldConsequenceId && objectiveDone(entry, obj)) {
    const qs = ensureQuestSave(save);
    if (!qs.worldActive.includes(obj.worldConsequenceId)) qs.worldActive.push(obj.worldConsequenceId);
  }
}

export function applyQuestEvent(save, pack, event) {
  const qs = ensureQuestSave(save);
  const hit = [];
  for (const def of activeQuests(pack, save)) {
    const entry = qs.entries[def.id];
    if (!entry || entry.status !== "active") continue;
    for (const obj of def.objectives || []) {
      if (objectiveDone(entry, obj)) continue;
      if (!eventMatches(obj, event, save)) continue;
      if (bumpObj(entry, obj, event.amount || 1)) {
        onObjectiveAdvanced(save, pack, def, obj, entry);
        hit.push({
          questId: def.id,
          objId: obj.id,
          progress: entry.progress[obj.id],
          need: obj.count || 1,
          questComplete: questReadyToComplete(def, entry),
        });
      }
    }
  }
  // Also sync derived progress (affinity/flags)
  const synced = syncQuestProgressFromWorld(save, pack);
  for (const s of synced) {
    if (!hit.some((h) => h.questId === s.questId && h.objId === s.objId)) {
      const def = questDef(pack, s.questId);
      const entry = qs.entries[s.questId];
      hit.push({ ...s, questComplete: questReadyToComplete(def, entry) });
    }
  }
  refreshWorldConsequences(save, pack);
  return hit;
}

function eventMatches(obj, event, save) {
  if (!event?.type) return false;
  if (obj.type === "checkin") return event.type === "checkin";
  if (obj.type === "gift") {
    if (event.type !== "gift") return false;
    if (obj.neighborId && event.neighborId !== obj.neighborId) return false;
    return true;
  }
  if (obj.type === "talk" || obj.type === "visit_scene") {
    if (event.type !== "visit_scene" && event.type !== "talk") return false;
    if (obj.neighborId && event.neighborId !== obj.neighborId) return false;
    return true;
  }
  if (obj.type === "visit_any") return event.type === "visit_scene" || event.type === "talk";
  if (obj.type === "cup_finish") return event.type === "cup_finish";
  if (obj.type === "cup_synergy") return event.type === "cup_synergy";
  if (obj.type === "street_event") return event.type === "street_event";
  if (obj.type === "share") return event.type === "share";
  if (obj.type === "arc_beat") {
    if (event.type === "arc_beat") {
      if (obj.arcId && event.arcId !== obj.arcId) return false;
      return true;
    }
    // flag-based arc beats handled in sync
    return false;
  }
  if (obj.type === "flag" && event.type === "flag") return event.flag === obj.flag;
  return false;
}

export function refreshWorldConsequences(save, pack) {
  const qs = ensureQuestSave(save);
  const active = new Set(qs.worldActive || []);
  // story-form-2: keep cold Day2 WC ids across objective rebuilds
  const coldKeep = (qs.worldActive || []).filter((id) => String(id).startsWith("wc_day2_"));
  for (const id of coldKeep) active.add(id);
  for (const def of activeQuests(pack, save).concat(completedQuests(pack, save))) {
    const entry = qs.entries[def.id];
    if (!entry) continue;
    for (const obj of def.objectives || []) {
      if (obj.worldConsequenceId && objectiveDone(entry, obj)) active.add(obj.worldConsequenceId);
    }
  }
  // Re-inject from form-2 branch if Day2+ and cold flags present
  const form2 = pack?.storyForm2;
  const rw = form2?.day2ColdRewrites;
  if (rw && (save.dayIndex || 1) >= (rw.activateOnDayIndexMin || 2)) {
    const branch = (rw.branches || []).find((b) =>
      (b.when?.flagsAll || []).every((f) => save.storyFlags?.[f])
    );
    if (branch?.worldConsequenceId) active.add(branch.worldConsequenceId);
  }
  qs.worldActive = [...active];
}

export function activeWorldConsequences(save, pack) {
  const qs = ensureQuestSave(save);
  const map = pack?.worldConsequences || {};
  return (qs.worldActive || []).map((id) => map[id]).filter(Boolean);
}

export function completeQuest(save, pack, id, grantFn) {
  const def = questDef(pack, id);
  const qs = ensureQuestSave(save);
  const entry = qs.entries[id];
  if (!def || !entry || entry.status !== "active") return null;
  if (!questReadyToComplete(def, entry)) return null;
  entry.status = "complete";
  entry.completedDay = save.dayIndex || 1;
  let rewards = { ...(def.rewards || {}) };
  // Soft expire: half rewards if past window
  if (def.expire?.soft && def.acceptDayMax && (save.dayIndex || 1) > def.acceptDayMax) {
    const mult = def.expire.rewardMultiplier ?? 0.5;
    if (rewards.porch_coins) rewards.porch_coins = Math.floor(rewards.porch_coins * mult);
    if (rewards.neon_thread) rewards.neon_thread = Math.floor(rewards.neon_thread * mult);
  }
  if (grantFn) grantFn(rewards);
  save.storyFlags = save.storyFlags || {};
  for (const f of rewards.flags || []) save.storyFlags[f] = true;
  if (rewards.rep) {
    if (!save.reputation) save.reputation = {};
    for (const [k, v] of Object.entries(rewards.rep)) save.reputation[k] = (save.reputation[k] || 0) + v;
  }
  qs.lastClaimed.push(id);
  refreshWorldConsequences(save, pack);
  return rewards;
}

export function autoOfferArcQuests(pack, save) {
  const offered = [];
  for (const q of allQuestDefs(pack)) {
    if (isAccepted(save, q.id)) continue;
    // story-form-4: auto-accept preferred Day2 echo quests
    const dayMin = q.autoAcceptOnDayMin ?? q._raw?.autoAcceptOnDayMin;
    if (dayMin != null && (save.dayIndex || 1) >= dayMin && unlockOk(save, q.unlockRequires || q._raw?.unlockRequires || {})) {
      acceptQuest(save, pack, q.id);
      offered.push(q.id);
      continue;
    }
    if (!q.arcId) continue;
    if (save.arcs?.[q.arcId] || save.storyFlags?.[`${q.arcId}_active`] || save.storyFlags?.[`${q.arcId}_seed`]) {
      offered.push(q.id);
    }
  }
  return offered;
}

export function progressSummary(def, entry, locale = "en") {
  if (!def) return "";
  return (def.objectives || [])
    .map((o) => {
      const have = entry?.progress?.[o.id] || 0;
      const need = o.count || 1;
      const mark = have >= need ? "✓" : "○";
      const label = o.label?.[locale] || o.label?.en || o.id;
      return `${mark} ${label} (${have}/${need})`;
    })
    .join(" · ");
}

/** Evening agenda rows derived from active main quest (fallback to null). */
export function mainQuestAgenda(pack, save, locale = "en") {
  const main = activeMainQuest(pack, save);
  if (!main) return null;
  const entry = ensureQuestSave(save).entries[main.id];
  return {
    quest: main,
    title: main.title?.[locale] || main.title?.en || main.id,
    objectives: (main.objectives || []).map((o) => ({
      id: o.id,
      label: o.label?.[locale] || o.label?.en || o.id,
      done: objectiveDone(entry, o),
      have: entry?.progress?.[o.id] || 0,
      need: o.count || 1,
      worldConsequenceId: o.worldConsequenceId,
    })),
    ready: questReadyToComplete(main, entry),
  };
}
