/** Session density pack — micro-events, quest echoes, overnight teasers, practice gate. */

function flagsOk(when = {}, save = {}) {
  const flags = save.storyFlags || {};
  if (when.flagsAll?.some((f) => !flags[f])) return false;
  if (when.flagsNone?.some((f) => flags[f])) return false;
  if (when.flagsAny?.length && !when.flagsAny.some((f) => flags[f])) return false;
  return true;
}

function objectiveOpen(pack, save, questId, objectiveId) {
  if (!save?.quests?.entries) return false;
  const entry = save.quests.entries[questId];
  if (!entry || entry.status === "done" || entry.status === "completed") return false;
  // If pack missing/obj unknown, treat unfinished quest as open so echoes/teasers still fire
  if (!pack) return true;
  const quest = (pack.quests || []).find((q) => q.id === questId);
  if (!quest) return true;
  const obj = (quest.objectives || []).find((o) => o.id === objectiveId);
  if (!obj) return true;
  if (obj.track?.type === "flag") return !save.storyFlags?.[obj.track.flag];
  if (obj.type === "flag" && obj.flag) return !save.storyFlags?.[obj.flag];
  const have = entry.progress?.[objectiveId] || 0;
  const need = obj.track?.count || obj.count || 1;
  return have < need;
}

export function pickOvernightTeaser(density, save, questPack) {
  if (!density?.overnightTeasers?.length) return null;
  const ranked = density.overnightTeasers
    .filter((t) => {
      if (!flagsOk(t.when, save)) return false;
      if (t.when?.activeQuestId) {
        const e = save.quests?.entries?.[t.when.activeQuestId];
        if (!e || e.status === "done" || e.status === "completed") return false;
      }
      if (t.objectiveId && t.when?.activeQuestId) {
        return objectiveOpen(questPack, save, t.when.activeQuestId, t.objectiveId);
      }
      return true;
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return ranked[0] || null;
}

export function pickEcho(density, save, questPack, slot = "evening") {
  if (!density?.echoFollowUps?.length) return null;
  const ranked = density.echoFollowUps
    .filter((e) => {
      if (e.when?.slots && !e.when.slots.includes(slot)) return false;
      if (!flagsOk(e.when, save)) return false;
      if (e.questId && e.objectiveId) {
        return objectiveOpen(questPack, save, e.questId, e.objectiveId);
      }
      return true;
    })
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const top = ranked[0];
  if (!top) return null;
  // One high-priority echo per evening when ≥85
  if ((top.priority || 0) >= 85) return top;
  return top;
}

export function pickMicroEvent(density, save, slot = "street") {
  if (!density?.microEvents?.length) return null;
  const used = save.density?.microUsed || {};
  const day = save.dayIndex || 1;
  const pool = density.microEvents.filter((m) => {
    if (m.slot && m.slot !== slot && !(m.tags || []).includes(slot)) return false;
    if (!flagsOk(m.requiresFlags || m.when || {}, save)) return false;
    if (m.requiresFlagsAll && m.requiresFlagsAll.some((f) => !save.storyFlags?.[f])) return false;
    if (m.requiresFlagsAny?.length && !m.requiresFlagsAny.some((f) => save.storyFlags?.[f])) return false;
    if (m.requiresFlagsNone && m.requiresFlagsNone.some((f) => save.storyFlags?.[f])) return false;
    const last = used[m.id];
    if (last != null && day - last < (m.cooldownDays || 1)) return false;
    return true;
  });
  if (!pool.length) return null;
  // Weighted pick
  const total = pool.reduce((s, m) => s + (m.weight || 1), 0);
  let r = Math.random() * total;
  for (const m of pool) {
    r -= m.weight || 1;
    if (r <= 0) return m;
  }
  return pool[pool.length - 1];
}

export function markMicroUsed(save, microId) {
  save.density = save.density || { microUsed: {}, echoShown: {} };
  save.density.microUsed[microId] = save.dayIndex || 1;
}

export function practiceTeach(density) {
  return density?.practiceCupTeach || null;
}

export function practiceExitBlocked(density, save) {
  const teach = practiceTeach(density);
  if (!teach) return false;
  if (!teach.softSkipBlocked) return false;
  if (save.storyFlags?.first_evening_practice_cleared && save.storyFlags?.practice_cup_done) return false;
  // ux-session-2 / mechanics-fix-2: Day1 End evening = Practice flags ONLY
  // (practice_cup_porch_call_done is fight soft-skip, not evening gate)
  const need = teach.ui?.endEvening?.blockedUntilFlagsAll || ["practice_cup_done", "syn_taught_syn_rivalry"];
  return need.some((f) => !save.storyFlags?.[f]);
}

/** Authoritative End-evening gate (ux-session-2). Day1 = practice flags; Day2+ always. */
export function canEndEvening(save, uxPack2 = null, density = null) {
  const day = save?.dayIndex ?? 1;
  const gate = uxPack2?.endEveningGate;
  if (day <= 1) {
    const need =
      gate?.day1RequiresFlagsAll ||
      practiceTeach(density)?.ui?.endEvening?.blockedUntilFlagsAll ||
      ["practice_cup_done", "syn_taught_syn_rivalry"];
    return need.every((f) => !!save?.storyFlags?.[f]);
  }
  return gate?.day2PlusAlwaysAllow !== false;
}

/** Merge density practiceCupTeach moments over combat-pack moments (by id). */
export function mergedPracticeScript(combatPractice, density) {
  const teach = practiceTeach(density);
  const base = [...(combatPractice?.scriptedMoments || [])];
  const overlay = teach?.scriptedMoments || [];
  if (!overlay.length) return base;
  const byId = new Map(base.map((b) => [b.id, { ...b }]));
  for (const beat of overlay) {
    byId.set(beat.id, { ...(byId.get(beat.id) || {}), ...beat });
  }
  // Keep overlay order when ids match density; append any combat-only leftovers at end
  const ordered = [];
  const seen = new Set();
  for (const beat of overlay) {
    ordered.push(byId.get(beat.id));
    seen.add(beat.id);
  }
  for (const beat of base) {
    if (!seen.has(beat.id)) ordered.push(byId.get(beat.id));
  }
  return ordered;
}

export function practiceLineup(combatPractice, density) {
  const teach = practiceTeach(density);
  return {
    playerLineup: teach?.playerLineup || combatPractice?.playerLineup || [],
    enemyLineup: teach?.enemyLineup || combatPractice?.enemyLineup || [],
  };
}

export function practiceSkipBlocked(density, save) {
  const teach = practiceTeach(density);
  if (!teach?.softSkipBlocked) return false;
  if (save.storyFlags?.practice_cup_done && save.storyFlags?.practice_cup_porch_call_done) return false;
  const need = teach.ui?.hideSkipUntilFlagsAll || [
    "syn_taught_syn_rivalry",
    "practice_cup_porch_call_done",
    "practice_cup_done",
  ];
  return need.some((f) => !save.storyFlags?.[f]);
}

export function microToStreetEvent(micro) {
  if (!micro) return null;
  return {
    id: micro.id,
    title: micro.title,
    prompt: micro.prompt,
    choices: (micro.choices || []).map((c) => ({
      id: c.id,
      label: c.label,
      affinity: c.affinity,
      affinityDelta: c.affinity?.[0]?.delta,
      neighborId: c.affinity?.[0]?.id,
      rep: c.rep,
      setFlags: c.setsFlags || micro.setsFlags,
      effects: c.effects,
    })),
    _micro: true,
    worldConsequenceId: micro.worldConsequenceId,
  };
}
