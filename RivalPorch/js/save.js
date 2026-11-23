const SAVE_KEY = "rivalPorch.save.v4";

export function defaultSave(economy, depthMeta) {
  const start = depthMeta?.startingBalances || { porch_coins: 80, neon_thread: 2, clay_tokens: 0 };
  const currencies = { porch_coins: 0, neon_thread: 0, clay_tokens: 0, ...start };
  for (const c of economy.currencies || []) {
    if (currencies[c.id] == null) currencies[c.id] = 0;
  }
  return {
    version: 4,
    locale: "tr",
    dayIndex: 1,
    weekNumber: 1,
    affinity: {},
    traits: {},
    dramaFlags: {},
    storyFlags: {},
    storyProgress: {},
    visitedArcToday: {},
    reputation: { rep_mediator: 0, rep_instigator: 0, rep_stage: 0, rep_oven: 0 },
    arcs: {},
    seenDailyEvents: [],
    completedTrees: [],
    storyUnlocks: { skins: [], unitMods: [] },
    endingId: null,
    moodLabel: "calm",
    currencies,
    inventory: {},
    ownedCosmetics: {
      porch_skins: ["skin_warm_lamp"],
      unit_poses: [],
      comic_frames: ["frame_chalk_grid"],
      emotes: ["emote_sip_tea"],
      gift_wraps: [],
      decor: [],
    },
    equipped: {
      porch_skin: "skin_warm_lamp",
      comic_frame: "frame_chalk_grid",
      emote: "emote_sip_tea",
      unit_poses: {},
    },
    checkinStreak: 0,
    lastCheckinDay: 0,
    dailyEarn: { talkCoins: 0, dramaThread: false, shareClaimed: false },
    evening: {
      checkin: false,
      visits: [],
      streetEvent: false,
      errand: false,
      cupDone: false,
      cupEveDone: false,
      complete: false,
    },
    mood: 3,
    totalWins: 0,
    totalCups: 0,
    passXp: 0,
    passLevel: 1,
    passPaidUnlocked: false,
    claimedPassFree: [],
    claimedPassPaid: [],
    decorSlots: { lamp: false, planter: false, awning: false, sign: false },
    cupFlair: false,
    unlockedNeighbors: ["n1", "n2", "n3", "n4", "n5", "n6"],
    cupHistory: [],
  };
}

export function loadSave(economy, depthMeta) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave(economy, depthMeta);
    const data = JSON.parse(raw);
    const base = defaultSave(economy, depthMeta);
    const out = {
      ...base,
      ...data,
      currencies: { ...base.currencies, ...(data.currencies || {}) },
      inventory: { ...base.inventory, ...(data.inventory || {}) },
      evening: { ...base.evening, ...(data.evening || {}) },
      ownedCosmetics: {
        ...base.ownedCosmetics,
        ...(data.ownedCosmetics || {}),
        porch_skins: data.ownedCosmetics?.porch_skins || base.ownedCosmetics.porch_skins,
        unit_poses: data.ownedCosmetics?.unit_poses || base.ownedCosmetics.unit_poses,
        comic_frames: data.ownedCosmetics?.comic_frames || base.ownedCosmetics.comic_frames,
        emotes: data.ownedCosmetics?.emotes || base.ownedCosmetics.emotes,
      },
      equipped: { ...base.equipped, ...(data.equipped || {}) },
      dailyEarn: { ...base.dailyEarn, ...(data.dailyEarn || {}) },
      decorSlots: { ...base.decorSlots, ...(data.decorSlots || {}) },
      affinity: data.affinity || {},
      traits: data.traits || {},
      dramaFlags: data.dramaFlags || {},
      storyFlags: data.storyFlags || {},
      storyProgress: data.storyProgress || {},
      unlockedNeighbors: data.unlockedNeighbors || base.unlockedNeighbors,
      cupHistory: data.cupHistory || [],
      claimedPassFree: data.claimedPassFree || [],
      claimedPassPaid: data.claimedPassPaid || [],
      reputation: { ...base.reputation, ...(data.reputation || {}) },
      arcs: data.arcs || {},
      seenDailyEvents: data.seenDailyEvents || [],
      completedTrees: data.completedTrees || [],
      storyUnlocks: {
        skins: data.storyUnlocks?.skins || [],
        unitMods: data.storyUnlocks?.unitMods || [],
      },
    };
    if ((data.version || 0) < 4) {
      for (const [id, v] of Object.entries(out.affinity || {})) {
        if (typeof v === "number" && v <= 10) out.affinity[id] = Math.round(v * 10);
      }
      out.version = 4;
    }
    return out;
  } catch {
    return defaultSave(economy, depthMeta);
  }
}

export function persistSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}
