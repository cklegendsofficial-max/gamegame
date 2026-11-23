/** Season-1 story pack (schemaVersion 2) helpers. */

export function daysPerWeek(stories) {
  return 7;
}

export function weekIndex(stories, dayIndex) {
  const weeks = stories.season1?.weeks || [];
  const idx = Math.min(weeks.length, Math.max(1, Math.ceil(dayIndex / daysPerWeek(stories))));
  return idx;
}

export function weekDef(stories, dayIndex) {
  const weeks = stories.season1?.weeks || [];
  return weeks[weekIndex(stories, dayIndex) - 1] || weeks[0];
}

export function affinityBand(stories, value) {
  const levels = stories.relationshipThresholds?.levels || [];
  const v = value ?? 0;
  return levels.find((l) => v >= l.min && v <= l.max) || levels[0];
}

export function clampAffinity(stories, v) {
  const min = stories.relationshipThresholds?.affinityMin ?? 0;
  const max = stories.relationshipThresholds?.affinityMax ?? 100;
  return Math.max(min, Math.min(max, v));
}

export function bumpAffinity(save, stories, id, delta) {
  save.affinity[id] = clampAffinity(stories, (save.affinity[id] || 0) + delta);
  const hooks = stories.relationshipThresholds?.unlockHooks || [];
  for (const h of hooks) {
    if (save.affinity[id] >= h.threshold) setFlag(save, h.flag);
  }
}

export function setFlag(save, flag) {
  if (!flag) return;
  save.storyFlags[flag] = true;
}

export function hasFlag(save, flag) {
  return !!save.storyFlags?.[flag];
}

export function hasAllFlags(save, flags = []) {
  return flags.every((f) => hasFlag(save, f));
}

export function bumpRep(save, repObj = {}) {
  if (!save.reputation) save.reputation = {};
  for (const [k, v] of Object.entries(repObj)) {
    save.reputation[k] = (save.reputation[k] || 0) + v;
  }
}

export function dominantRep(save) {
  const entries = Object.entries(save.reputation || {});
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function getTree(stories, id) {
  return (stories.dialogueTrees || []).find((t) => t.id === id);
}

export function getNode(tree, nodeId) {
  if (!tree) return null;
  return (tree.nodes || []).find((n) => n.id === nodeId);
}

export function ensureArcState(save, arcId, dayIndex) {
  if (!save.arcs) save.arcs = {};
  if (!save.arcs[arcId]) {
    save.arcs[arcId] = { startedDay: dayIndex, complete: false, lastBeatId: null };
  }
  return save.arcs[arcId];
}

/** Activate week's arc when player reaches that week. */
export function syncWeekArcs(stories, save) {
  const w = weekDef(stories, save.dayIndex);
  if (w?.activeArc) {
    ensureArcState(save, w.activeArc, save.dayIndex);
    setFlag(save, `${w.activeArc}_active`);
  }
  if (w?.arcSeeds) {
    for (const seed of w.arcSeeds) {
      setFlag(save, seed);
      if (String(seed).endsWith("_seed")) {
        const arcId = String(seed).replace(/_seed$/, "");
        if ((stories.arcs || []).some((a) => a.id === arcId)) {
          ensureArcState(save, arcId, save.dayIndex);
          setFlag(save, `${arcId}_active`);
        }
      }
    }
  }
}

export function activeArcDef(stories, save) {
  const w = weekDef(stories, save.dayIndex);
  if (w?.activeArc) return (stories.arcs || []).find((a) => a.id === w.activeArc);
  // Week-1 seeds / any incomplete started arc (priority: incomplete with progress)
  for (const a of stories.arcs || []) {
    const st = save.arcs?.[a.id];
    if (st && !st.complete) return a;
  }
  return null;
}

export function nextArcBeat(stories, save) {
  const arc = activeArcDef(stories, save);
  if (!arc) return null;
  const st = ensureArcState(save, arc.id, save.dayIndex);
  if (st.complete) return null;
  const started = st.startedDay || save.dayIndex;
  const dayOffset = Math.max(0, save.dayIndex - started);
  for (const beat of arc.beats || []) {
    const flags = beat.setFlags || [];
    const done =
      hasFlag(save, beat.id + "_done") ||
      (flags.length > 0 && flags.every((f) => hasFlag(save, f)));
    if (done) continue;
    if ((beat.requiresFlags || []).length && !hasAllFlags(save, beat.requiresFlags)) return null;
    if (dayOffset < (beat.dayOffset || 0)) return null;
    return { arc, beat };
  }
  st.complete = true;
  setFlag(save, `${arc.id}_complete`);
  resolveArcRewards(stories, save, arc);
  return null;
}

export function markBeatStarted(save, beat) {
  for (const f of beat.setFlags || []) {
    // only set progress flags that aren't complete until dialogue ends — set non-complete now
    if (!String(f).includes("complete")) setFlag(save, f);
  }
  setFlag(save, beat.id);
}

export function applyChoicePayload(save, stories, choice, traitNeighborId) {
  if (!choice) return;
  for (const a of choice.affinity || []) bumpAffinity(save, stories, a.id, a.delta || 0);
  if (choice.rep) bumpRep(save, choice.rep);
  if (choice.traitDeltas && traitNeighborId) {
    if (!save.traits[traitNeighborId]) save.traits[traitNeighborId] = {};
    for (const [k, v] of Object.entries(choice.traitDeltas)) {
      save.traits[traitNeighborId][k] = (save.traits[traitNeighborId][k] || 0) + v;
    }
  }
  if (choice.mood) save.moodLabel = choice.mood;
  for (const f of choice.setFlags || []) setFlag(save, f);
  if (choice.unlock) setFlag(save, choice.unlock);
}

export function applyNodeArrival(save, node) {
  if (!node) return;
  for (const f of node.setFlags || []) setFlag(save, f);
  if (node.unlock) setFlag(save, node.unlock);
  if (node.ends && node.rewards) {
    for (const r of node.rewards) setFlag(save, r);
  }
}

export function resolveArcRewards(stories, save, arc) {
  if (!arc?.rewards) return;
  // pick reward branch by flags
  for (const [branch, flags] of Object.entries(arc.rewards)) {
    // if any reward flag already implied by path flags, grant all listed
    // Grant rewards whose requires are met: listed ids that look like unlock_* or flag_*
    const list = Array.isArray(flags) ? flags : [];
    // Heuristic: if player has a matching path flag containing branch name, or any listed flag already set
    const pathHit =
      hasFlag(save, `path_${branch}`) ||
      list.some((id) => hasFlag(save, id)) ||
      Object.keys(save.storyFlags || {}).some((f) => f.includes(branch));
    if (!pathHit && branch !== "default") continue;
    for (const id of list) setFlag(save, id);
    if (pathHit) break;
  }
  // Always try to grant rewards whose requiresFlags are satisfied from unlock catalog later
}

export function pickDailyEvent(stories, save) {
  const week = weekDef(stories, save.dayIndex);
  const featured = new Set(week?.featuredDailyTags || []);
  const seen = new Set(save.seenDailyEvents || []);
  const pool = (stories.dailyEventPool || []).filter((e) => {
    if (seen.has(e.id) && seen.size < (stories.dailyEventPool.length || 1) * 0.85) {
      // prefer unseen until most consumed
      return false;
    }
    return true;
  });
  const weighted = [];
  for (const e of pool.length ? pool : stories.dailyEventPool || []) {
    let w = e.weight || 1;
    if ((e.tags || []).some((t) => featured.has(t))) w *= 3;
    if (seen.has(e.id)) w *= 0.15;
    // arc-seed events early
    if ((e.tags || []).includes("arc-seed") && save.dayIndex <= 7) w *= 2;
    for (let i = 0; i < Math.ceil(w * 10); i++) weighted.push(e);
  }
  if (!weighted.length) return (stories.dailyEventPool || [])[0] || null;
  return weighted[Math.floor(Math.random() * weighted.length)];
}

export function secretTreeForNeighbor(stories, save, neighborId) {
  const map = {
    n2: "dlg_cem_knee",
    n4: "dlg_orhan_letters",
  };
  const id = map[neighborId];
  if (!id) return null;
  if ((save.affinity[neighborId] || 0) < 40) return null;
  if (save.completedTrees?.includes(id)) return null;
  return getTree(stories, id);
}

export function dialogueForNeighborVisit(stories, save, neighborId) {
  // 1) Active arc beat involving this neighbor
  const next = nextArcBeat(stories, save);
  if (next && (next.arc.neighbors || []).includes(neighborId)) {
    return { kind: "arc", ...next, tree: getTree(stories, next.beat.dialogueTreeId) };
  }
  // 2) Secret personal tree
  const secret = secretTreeForNeighbor(stories, save, neighborId);
  if (secret) return { kind: "secret", tree: secret, neighborId };
  // 3) Cup eve chatter near weekend
  const dow = ((save.dayIndex - 1) % 7) + 1;
  if (dow >= 5) {
    const tree = getTree(stories, "dlg_cup_eve_generic");
    if (tree && !save.evening?.cupEveDone) return { kind: "cup_eve", tree };
  }
  // 4) Any incomplete arc beat (force drama pressure)
  if (next?.tree || next?.beat) {
    const tree = getTree(stories, next.beat.dialogueTreeId);
    if (tree) return { kind: "arc", ...next, tree };
  }
  return null;
}

export function evaluateEndings(stories, save) {
  const dom = dominantRep(save);
  for (const ending of stories.endings || []) {
    const req = ending.requires || {};
    if (req.dominantRep && req.dominantRep !== dom) continue;
    if (req.flagsAll && !hasAllFlags(save, req.flagsAll)) continue;
    if (req.flagsAny && !(req.flagsAny || []).some((f) => hasFlag(save, f))) continue;
    return ending;
  }
  return null;
}

export function applyStoryUnlocks(stories, save) {
  const unlocked = save.storyUnlocks || (save.storyUnlocks = { skins: [], unitMods: [] });
  for (const skin of stories.unlockFlags?.skins || []) {
    if (unlocked.skins.includes(skin.id)) continue;
    if (hasAllFlags(save, skin.requiresFlags || [])) unlocked.skins.push(skin.id);
  }
  for (const mod of stories.unlockFlags?.unitMods || []) {
    if (unlocked.unitMods.includes(mod.id)) continue;
    if (hasAllFlags(save, mod.requiresFlags || [])) unlocked.unitMods.push(mod.id);
  }
  return unlocked;
}

export function unitModFor(save, stories, neighborId) {
  const mods = stories.unlockFlags?.unitMods || [];
  const owned = save.storyUnlocks?.unitMods || [];
  return mods.find((m) => m.neighborId === neighborId && owned.includes(m.id)) || null;
}
