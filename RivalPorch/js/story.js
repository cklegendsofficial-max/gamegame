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
  const summary = { affinity: [], rep: [], traits: [], mood: null };
  if (!choice) return summary;
  for (const a of choice.affinity || []) {
    bumpAffinity(save, stories, a.id, a.delta || 0);
    if (a.delta) summary.affinity.push({ id: a.id, delta: a.delta });
  }
  if (choice.rep) {
    bumpRep(save, choice.rep);
    for (const [k, v] of Object.entries(choice.rep)) if (v) summary.rep.push({ id: k, delta: v });
  }
  if (choice.traitDeltas && traitNeighborId) {
    if (!save.traits[traitNeighborId]) save.traits[traitNeighborId] = {};
    for (const [k, v] of Object.entries(choice.traitDeltas)) {
      save.traits[traitNeighborId][k] = (save.traits[traitNeighborId][k] || 0) + v;
      if (v) summary.traits.push({ id: k, delta: v });
    }
  }
  if (choice.mood) {
    save.moodLabel = choice.mood;
    summary.mood = choice.mood;
  }
  for (const f of choice.setFlags || []) setFlag(save, f);
  if (choice.unlock) setFlag(save, choice.unlock);
  return summary;
}

export function repLabel(repId, locale = "en") {
  const map = {
    rep_mediator: { tr: "Arabulucu", en: "Mediator" },
    rep_instigator: { tr: "Kışkırtıcı", en: "Instigator" },
    rep_stage: { tr: "Sahne", en: "Stage" },
    rep_oven: { tr: "Fırın", en: "Oven" },
  };
  const row = map[repId];
  return row ? row[locale] || row.en : repId;
}

export function formatChoiceSummary(summary, locale, nameOf) {
  if (!summary) return "";
  const bits = [];
  for (const a of summary.affinity || []) {
    const name = nameOf?.(a.id) || a.id;
    bits.push(`${name} ${a.delta > 0 ? "+" : ""}${a.delta}`);
  }
  for (const r of summary.rep || []) {
    bits.push(`${repLabel(r.id, locale)} ${r.delta > 0 ? "+" : ""}${r.delta}`);
  }
  for (const t of summary.traits || []) {
    bits.push(`${t.id} ${t.delta > 0 ? "+" : ""}${t.delta}`);
  }
  if (summary.mood) bits.push(summary.mood);
  return bits.join(" · ");
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

/** Neighbor-only porch chats so Scene always feels personal (not another neighbor's arc). */
const FREE_PORCH = {
  n1: {
    id: "free_n1",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n1",
        text: {
          tr: "Demlik kaynıyor. Bu akşam kimin sırrını demleyelim?",
          en: "The pot's boiling. Whose secret do we steep tonight?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Can'ın borcunu sor", en: "Ask about Can's debt" },
            next: "a1",
            affinity: [{ id: "n1", delta: 3 }, { id: "n6", delta: -1 }],
            rep: { rep_instigator: 2 },
            traitDeltas: { Gossip: 1 },
          },
          {
            id: "b",
            label: { tr: "Sessizce çay iç", en: "Sip quietly" },
            next: "b1",
            affinity: [{ id: "n1", delta: 3 }],
            rep: { rep_mediator: 2 },
            traitDeltas: { Soft: 1 },
          },
          {
            id: "c",
            label: { tr: "Cup dedikodusunu çevir", en: "Steer to Cup gossip" },
            next: "c1",
            affinity: [{ id: "n1", delta: 2 }, { id: "n2", delta: 1 }],
            rep: { rep_stage: 2 },
          },
        ],
      },
      {
        id: "a1",
        speaker: "n1",
        text: {
          tr: "Defterim kıpırdadı. Can'ın fırını… kredi kokuyor. Ne yaparsın?",
          en: "My ledger twitched. Can's oven… smells like credit. What now?",
        },
        choices: [
          {
            id: "a2",
            label: { tr: "Sessiz tut, izle", en: "Keep quiet, watch" },
            next: "a_end",
            affinity: [{ id: "n1", delta: 3 }],
            rep: { rep_mediator: 1 },
            setFlags: ["free_n1_debt_watch"],
          },
          {
            id: "a3",
            label: { tr: "Can'a nazikçe sor", en: "Ask Can gently" },
            next: "a_end",
            affinity: [{ id: "n6", delta: 2 }, { id: "n1", delta: 1 }],
            rep: { rep_oven: 1 },
            setFlags: ["free_n1_debt_ask"],
          },
          {
            id: "a4",
            label: { tr: "Söylentiyi büyüt", en: "Fan the rumor" },
            next: "a_end",
            affinity: [{ id: "n1", delta: 2 }, { id: "n6", delta: -2 }],
            rep: { rep_instigator: 2 },
            setFlags: ["free_n1_debt_spread"],
          },
        ],
      },
      {
        id: "b1",
        speaker: "n1",
        text: {
          tr: "İyi. Demlikte kalan sır daha uzun yaşar. Bir şey daha: Peri bass'i kısarsa Orhan pencere açar.",
          en: "Good. Secrets that stay in the pot live longer. One more: if Peri softens the bass, Orhan opens a window.",
        },
        choices: [
          {
            id: "b2",
            label: { tr: "Bunu not et", en: "Note that" },
            next: "b_end",
            affinity: [{ id: "n1", delta: 2 }, { id: "n5", delta: 1 }],
            rep: { rep_mediator: 1 },
            setFlags: ["free_n1_quiet_tea"],
          },
          {
            id: "b3",
            label: { tr: "Peri'ye fısılda", en: "Whisper it to Peri" },
            next: "b_end",
            affinity: [{ id: "n5", delta: 2 }],
            rep: { rep_stage: 1 },
            setFlags: ["free_n1_tip_peri"],
          },
        ],
      },
      {
        id: "c1",
        speaker: "n1",
        text: {
          tr: "Cem formasyon peşinde. Sen sahneyi kurarsan ben fısıltıyı ayarlarım. Kimi öne koyarsın?",
          en: "Cem's hunting formations. You set the stage; I'll tune the whispers. Who goes front?",
        },
        choices: [
          {
            id: "c2",
            label: { tr: "Orhan tank", en: "Orhan tank" },
            next: "c_end",
            affinity: [{ id: "n4", delta: 2 }, { id: "n2", delta: 1 }],
            rep: { rep_stage: 2 },
            setFlags: ["free_n1_cup_orhan"],
          },
          {
            id: "c3",
            label: { tr: "Leyla baskın", en: "Leyla burst" },
            next: "c_end",
            affinity: [{ id: "n3", delta: 2 }],
            rep: { rep_instigator: 1 },
            setFlags: ["free_n1_cup_leyla"],
          },
        ],
      },
      { id: "a_end", speaker: "n1", text: { tr: "Tamam. Bu akşam defter kapalı — ama unutmam.", en: "Done. Ledger closed tonight — but I don't forget." }, ends: true },
      { id: "b_end", speaker: "n1", text: { tr: "Çay bitti. Kapı yine çalacak.", en: "Tea's done. Another knock will come." }, ends: true },
      { id: "c_end", speaker: "n1", text: { tr: "Fısıltı hazır. Cup'ta görüşürüz.", en: "Whisper's set. See you at Cup." }, ends: true },
    ],
  },
  n2: {
    id: "free_n2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n2",
        text: {
          tr: "Dizlikleri bağladım. Bugün antrenman mı, yoksa merhamet mi?",
          en: "Knee braces on. Drill day — or mercy day?",
        },
        choices: [
          { id: "a", label: { tr: "Sert koşu", en: "Hard laps" }, next: "a1", affinity: [{ id: "n2", delta: 3 }], rep: { rep_stage: 2 }, traitDeltas: { Rivalry: 1 } },
          { id: "b", label: { tr: "Isınma + esneme", en: "Warm-up + stretch" }, next: "b1", affinity: [{ id: "n2", delta: 4 }], rep: { rep_mediator: 1 }, traitDeltas: { Soft: 1 } },
          { id: "c", label: { tr: "Rakip Ridge'i konuş", en: "Talk Rival Ridge" }, next: "c1", affinity: [{ id: "n2", delta: 2 }], rep: { rep_instigator: 2 } },
        ],
      },
      {
        id: "a1",
        speaker: "n2",
        text: { tr: "İyi. Diz sızlıyor ama Cup acımaz. Son turda kime baskı?", en: "Good. Knee aches, but Cup doesn't pity. Who do we pressure last lap?" },
        choices: [
          { id: "a2", label: { tr: "Peri'nin tempo kırışı", en: "Break Peri's tempo" }, next: "a_end", affinity: [{ id: "n2", delta: 2 }, { id: "n5", delta: 1 }], rep: { rep_stage: 1 }, setFlags: ["free_n2_hard"] },
          { id: "a3", label: { tr: "Can'ı koru, sen vur", en: "Guard Can, you strike" }, next: "a_end", affinity: [{ id: "n6", delta: 2 }], rep: { rep_oven: 1 }, setFlags: ["free_n2_protect"] },
        ],
      },
      {
        id: "b1",
        speaker: "n2",
        text: { tr: "Diz teşekkür eder. Yarın daha keskin. Bir sır: Karşı Sırt sol kanattan şişiriyor.", en: "Knee thanks you. Tomorrow sharper. Secret: Rival Ridge overloads the left wing." },
        choices: [
          { id: "b2", label: { tr: "Formasyonu not et", en: "Note the formation" }, next: "b_end", affinity: [{ id: "n2", delta: 3 }], rep: { rep_stage: 2 }, setFlags: ["free_n2_care"] },
          { id: "b3", label: { tr: "Merve'ye fısılda", en: "Tip Merve" }, next: "b_end", affinity: [{ id: "n1", delta: 2 }], rep: { rep_mediator: 1 }, setFlags: ["free_n2_tip"] },
        ],
      },
      {
        id: "c1",
        speaker: "n2",
        text: { tr: "Karşı Sırt gürültülü geliyor. Cevabımız formasyon mu, yoksa blöf mü?", en: "Rival Ridge gets loud. Answer with formation — or bluff?" },
        choices: [
          { id: "c2", label: { tr: "Sıkı formasyon", en: "Tight formation" }, next: "c_end", affinity: [{ id: "n2", delta: 3 }], rep: { rep_stage: 2 }, setFlags: ["free_n2_rival"] },
          { id: "c3", label: { tr: "Blöf + neon", en: "Bluff + neon" }, next: "c_end", affinity: [{ id: "n5", delta: 2 }], rep: { rep_instigator: 2 }, setFlags: ["free_n2_bluff"] },
        ],
      },
      { id: "a_end", speaker: "n2", text: { tr: "Antrenman bitti. Porch'ta ter kokusu zaferdir.", en: "Drill done. Sweat on the porch is victory." }, ends: true },
      { id: "b_end", speaker: "n2", text: { tr: "Dinlen. Cumartesi acımaz.", en: "Rest. Saturday won't." }, ends: true },
      { id: "c_end", speaker: "n2", text: { tr: "Tamam. Rakibi ölçtük.", en: "Good. We measured the rival." }, ends: true },
    ],
  },
  n3: {
    id: "free_n3",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n3",
        text: { tr: "Uçurtma ipi dolandı… yine. Yardım mı, yoksa kaçış planı mı?", en: "Kite string tangled… again. Help — or escape plan?" },
        choices: [
          { id: "a", label: { tr: "Birlikte çöz", en: "Untangle together" }, next: "a1", affinity: [{ id: "n3", delta: 4 }, { id: "n4", delta: 1 }], rep: { rep_mediator: 2 } },
          { id: "b", label: { tr: "Daha yükseğe uçur", en: "Fly it higher" }, next: "b1", affinity: [{ id: "n3", delta: 3 }], rep: { rep_instigator: 2 }, traitDeltas: { Chaos: 1 } },
          { id: "c", label: { tr: "Orhan'a haber ver", en: "Tip Orhan" }, next: "c1", affinity: [{ id: "n3", delta: -1 }, { id: "n4", delta: 3 }], rep: { rep_mediator: 1 } },
        ],
      },
      {
        id: "a1",
        speaker: "n3",
        text: { tr: "Sen düğüm, ben rüzgâr! Bir de… ipi antene mi bağlayalım yoksa balkona mı?", en: "You knot, I wind! Also… tie to the antenna or the balcony?" },
        choices: [
          { id: "a2", label: { tr: "Balkon — güvenli", en: "Balcony — safer" }, next: "a_end", affinity: [{ id: "n3", delta: 2 }, { id: "n4", delta: 2 }], setFlags: ["free_n3_coop"] },
          { id: "a3", label: { tr: "Anten — heyecan", en: "Antenna — spicy" }, next: "a_end", affinity: [{ id: "n3", delta: 3 }, { id: "n4", delta: -1 }], rep: { rep_instigator: 1 }, setFlags: ["free_n3_spicy"] },
        ],
      },
      {
        id: "b1",
        speaker: "n3",
        text: { tr: "Eeeeh! Orhan bağıracak. Kaçış rotası?", en: "Wheee! Orhan will yell. Escape route?" },
        choices: [
          { id: "b2", label: { tr: "Can'ın fırınına saklan", en: "Hide in Can's bakery" }, next: "b_end", affinity: [{ id: "n6", delta: 2 }], setFlags: ["free_n3_chaos"] },
          { id: "b3", label: { tr: "Özür + çay", en: "Apology + tea" }, next: "b_end", affinity: [{ id: "n4", delta: 2 }, { id: "n1", delta: 1 }], rep: { rep_mediator: 2 }, setFlags: ["free_n3_sorry"] },
        ],
      },
      {
        id: "c1",
        speaker: "n3",
        text: { tr: "…Hain. Ama tamam. En azından ip kopmadı. Bana bir sır verecek misin?", en: "…Traitor. Fine. String held. Will you owe me a secret?" },
        choices: [
          { id: "c2", label: { tr: "Sır borcu kabul", en: "Owe a secret" }, next: "c_end", affinity: [{ id: "n3", delta: 3 }], setFlags: ["free_n3_tipped"] },
          { id: "c3", label: { tr: "Poğaça ile telafi", en: "Pay with pastry" }, next: "c_end", affinity: [{ id: "n3", delta: 2 }, { id: "n6", delta: 1 }], setFlags: ["free_n3_pastry"] },
        ],
      },
      { id: "a_end", speaker: "n3", text: { tr: "Operasyon başarılı. Uçurtma efsane!", en: "Operation success. Legendary kite!" }, ends: true },
      { id: "b_end", speaker: "n3", text: { tr: "Kaçtık… yani, stratejik geri çekildik.", en: "We fled… strategic retreat." }, ends: true },
      { id: "c_end", speaker: "n3", text: { tr: "Borç kaydı. Çocuk hafızası silinmez.", en: "Debt logged. Kid memory never wipes." }, ends: true },
    ],
  },
  n4: {
    id: "free_n4",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n4",
        text: { tr: "Antenim temiz. Mahalle kuralları da öyle olmalı. Ne diyeceksin?", en: "Antenna clean. Street rules should be too. What's your word?" },
        choices: [
          { id: "a", label: { tr: "Kuralları savuna", en: "Defend the rules" }, next: "a1", affinity: [{ id: "n4", delta: 4 }], rep: { rep_mediator: 1 }, traitDeltas: { Grumpy: 1 } },
          { id: "b", label: { tr: "Esnek mahalle öner", en: "Propose soft rules" }, next: "b1", affinity: [{ id: "n4", delta: 2 }, { id: "n3", delta: 2 }], rep: { rep_mediator: 3 } },
          { id: "c", label: { tr: "Eski mektupları sor", en: "Ask about old letters" }, next: "c1", affinity: [{ id: "n4", delta: 3 }], rep: { rep_stage: 1 } },
        ],
      },
      {
        id: "a1",
        speaker: "n4",
        text: { tr: "Doğru. Sınır olmayan verandada Cup olmaz. Peri'ye de söyle — volume kaç?", en: "Correct. No Cup without a fence. Tell Peri — volume ceiling?" },
        choices: [
          { id: "a2", label: { tr: "Kısık gece", en: "Soft nights" }, next: "a_end", affinity: [{ id: "n5", delta: 1 }, { id: "n4", delta: 2 }], setFlags: ["free_n4_rules"] },
          { id: "a3", label: { tr: "Cup gecesi istisna", en: "Cup-night exception" }, next: "a_end", affinity: [{ id: "n5", delta: 2 }], rep: { rep_stage: 1 }, setFlags: ["free_n4_cup_ex"] },
        ],
      },
      {
        id: "b1",
        speaker: "n4",
        text: { tr: "…Bir santim. Sadece bir. Sonra ölçeriz. Leyla dinler mi?", en: "…One centimeter. Only one. Then we measure. Will Leyla listen?" },
        choices: [
          { id: "b2", label: { tr: "Ben garanti ederim", en: "I'll vouch" }, next: "b_end", affinity: [{ id: "n3", delta: 2 }, { id: "n4", delta: 2 }], setFlags: ["free_n4_soft"] },
          { id: "b3", label: { tr: "Merve arabulucu", en: "Merve mediates" }, next: "b_end", affinity: [{ id: "n1", delta: 2 }], rep: { rep_mediator: 1 }, setFlags: ["free_n4_merve"] },
        ],
      },
      {
        id: "c1",
        speaker: "n4",
        text: { tr: "Mektuplar… henüz değil. Ama sorduğun için not ettim. Neden istiyorsun?", en: "Letters… not yet. But I noted you asked. Why do you want them?" },
        choices: [
          { id: "c2", label: { tr: "Mahalleyi anlamak", en: "To understand the block" }, next: "c_end", affinity: [{ id: "n4", delta: 3 }], rep: { rep_mediator: 1 }, setFlags: ["free_n4_letters_hint"] },
          { id: "c3", label: { tr: "Cup hikâyesi için", en: "For Cup story" }, next: "c_end", affinity: [{ id: "n4", delta: 1 }], rep: { rep_stage: 2 }, setFlags: ["free_n4_letters_cup"] },
        ],
      },
      { id: "a_end", speaker: "n4", text: { tr: "Kural yazıldı. İhlal eden… çay içer.", en: "Rule filed. Violators… drink tea." }, ends: true },
      { id: "b_end", speaker: "n4", text: { tr: "Esneklik denendi. Ölçüm yarın.", en: "Flexibility tested. Measure tomorrow." }, ends: true },
      { id: "c_end", speaker: "n4", text: { tr: "Kapı aralandı. İçeri değil — henüz.", en: "Door cracked. Not inside — yet." }, ends: true },
    ],
  },
  n5: {
    id: "free_n5",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n5",
        text: { tr: "Bass hazır. Bu akşam neon mu, yoksa komşu şikâyeti mi?", en: "Bass is ready. Neon night — or neighbor complaint night?" },
        choices: [
          { id: "a", label: { tr: "Kısık volume, uzun set", en: "Low volume, long set" }, next: "a1", affinity: [{ id: "n5", delta: 3 }, { id: "n4", delta: 2 }], rep: { rep_mediator: 2 } },
          { id: "b", label: { tr: "Full neon drop", en: "Full neon drop" }, next: "b1", affinity: [{ id: "n5", delta: 4 }, { id: "n4", delta: -2 }], rep: { rep_instigator: 3 }, traitDeltas: { Chaos: 1 } },
          { id: "c", label: { tr: "Cup giriş müziği öner", en: "Pitch Cup entrance track" }, next: "c1", affinity: [{ id: "n5", delta: 3 }], rep: { rep_stage: 3 } },
        ],
      },
      {
        id: "a1",
        speaker: "n5",
        text: { tr: "Anlaşıldı. Titreşim var, kavga yok. Hangi renk neon?", en: "Copy. Vibes yes, feud no. Which neon tint?" },
        choices: [
          { id: "a2", label: { tr: "Mercan", en: "Coral" }, next: "a_end", affinity: [{ id: "n5", delta: 2 }], setFlags: ["free_n5_soft"] },
          { id: "a3", label: { tr: "Çay kreması", en: "Tea cream" }, next: "a_end", affinity: [{ id: "n1", delta: 1 }, { id: "n5", delta: 1 }], setFlags: ["free_n5_tea_neon"] },
        ],
      },
      {
        id: "b1",
        speaker: "n5",
        text: { tr: "IŞIKLAR! Orhan pencereyi kapatırsa bonus drop. Risk?", en: "LIGHTS! If Orhan shuts the window — bonus drop. Risk it?" },
        choices: [
          { id: "b2", label: { tr: "Risk al", en: "Take the risk" }, next: "b_end", affinity: [{ id: "n5", delta: 3 }, { id: "n4", delta: -2 }], rep: { rep_instigator: 2 }, setFlags: ["free_n5_loud"] },
          { id: "b3", label: { tr: "Yarıya çek", en: "Pull halfway" }, next: "b_end", affinity: [{ id: "n5", delta: 1 }, { id: "n4", delta: 1 }], setFlags: ["free_n5_mid"] },
        ],
      },
      {
        id: "c1",
        speaker: "n5",
        text: { tr: "Cup'a hook yazıyorum. Senin verandanın teması?", en: "Writing a Cup hook. Your porch theme?" },
        choices: [
          { id: "c2", label: { tr: "Mercan + çay", en: "Coral + tea" }, next: "c_end", affinity: [{ id: "n5", delta: 2 }, { id: "n1", delta: 1 }], setFlags: ["free_n5_theme"] },
          { id: "c3", label: { tr: "Fırın + neon", en: "Oven + neon" }, next: "c_end", affinity: [{ id: "n6", delta: 2 }], rep: { rep_oven: 1 }, setFlags: ["free_n5_oven"] },
        ],
      },
      { id: "a_end", speaker: "n5", text: { tr: "Set kaydı. Mahalle dans eder, uyur da.", en: "Set locked. Block dances and still sleeps." }, ends: true },
      { id: "b_end", speaker: "n5", text: { tr: "Drop atıldı. Kulaklar çınlasın.", en: "Drop landed. Ears ringing." }, ends: true },
      { id: "c_end", speaker: "n5", text: { tr: "Hook hazır. Cup'ta çalacak.", en: "Hook ready. It'll hit at Cup." }, ends: true },
    ],
  },
  n6: {
    id: "free_n6",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n6",
        text: { tr: "Fırın sıcak. Poğaça mı, yoksa mahalle barışı mı?", en: "Oven's hot. Pastries — or street peace?" },
        choices: [
          { id: "a", label: { tr: "Poğaça dağıt", en: "Hand out pastries" }, next: "a1", affinity: [{ id: "n6", delta: 3 }, { id: "n1", delta: 1 }, { id: "n3", delta: 1 }], rep: { rep_oven: 2, rep_mediator: 1 } },
          { id: "b", label: { tr: "Kredi defterini aç", en: "Open the credit book" }, next: "b1", affinity: [{ id: "n6", delta: 2 }, { id: "n1", delta: 2 }], rep: { rep_instigator: 1 } },
          { id: "c", label: { tr: "Cup için enerji ikramı", en: "Energy snack for Cup" }, next: "c1", affinity: [{ id: "n6", delta: 3 }, { id: "n2", delta: 1 }], rep: { rep_stage: 1, rep_oven: 1 } },
        ],
      },
      {
        id: "a1",
        speaker: "n6",
        text: { tr: "Sıcak poğaça, soğuk tartışma. Kime ekstra?", en: "Warm pastry, cool quarrel. Who gets extras?" },
        choices: [
          { id: "a2", label: { tr: "Orhan — barış rüşveti", en: "Orhan — peace bribe" }, next: "a_end", affinity: [{ id: "n4", delta: 3 }], setFlags: ["free_n6_share"] },
          { id: "a3", label: { tr: "Leyla — uçurtma yakıtı", en: "Leyla — kite fuel" }, next: "a_end", affinity: [{ id: "n3", delta: 3 }], setFlags: ["free_n6_leyla"] },
        ],
      },
      {
        id: "b1",
        speaker: "n6",
        text: { tr: "Merve'nin defteri ile benimki… bir gün hizalanır. Bugün ne yazalım?", en: "Merve's ledger and mine… someday align. What do we write today?" },
        choices: [
          { id: "b2", label: { tr: "Borç ertele", en: "Defer a debt" }, next: "b_end", affinity: [{ id: "n6", delta: 2 }], rep: { rep_mediator: 1 }, setFlags: ["free_n6_ledger"] },
          { id: "b3", label: { tr: "Faiz şakası yap", en: "Joke about interest" }, next: "b_end", affinity: [{ id: "n1", delta: 1 }], rep: { rep_instigator: 1 }, setFlags: ["free_n6_joke"] },
        ],
      },
      {
        id: "c1",
        speaker: "n6",
        text: { tr: "Cup öncesi karbonhidrat = zafer. Takıma ne koyayım?", en: "Pre-Cup carbs = victory. What do I pack for the team?" },
        choices: [
          { id: "c2", label: { tr: "Tatlı + kahve", en: "Sweet + coffee" }, next: "c_end", affinity: [{ id: "n2", delta: 2 }], setFlags: ["free_n6_fuel"] },
          { id: "c3", label: { tr: "Tuzlu + çay", en: "Savory + tea" }, next: "c_end", affinity: [{ id: "n1", delta: 2 }], setFlags: ["free_n6_tea_snack"] },
        ],
      },
      { id: "a_end", speaker: "n6", text: { tr: "Poğaçalar gitti. Barış kokusu kaldı.", en: "Pastries gone. Peace smell remains." }, ends: true },
      { id: "b_end", speaker: "n6", text: { tr: "Defter kapandı. Fırın açık.", en: "Book closed. Oven open." }, ends: true },
      { id: "c_end", speaker: "n6", text: { tr: "Paket hazır. Cup'ta gücünüz artsın.", en: "Pack ready. Power up at Cup." }, ends: true },
    ],
  },
};

/** Day-2+ follow-ups that remember yesterday's porch chat. */
const FREE_PORCH_FOLLOWUP = {
  n1: {
    id: "free_n1_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n1",
        text: {
          tr: "Dünkü demlik hâlâ sıcak. Defterde bir satır eksik — sen mi yazacaksın?",
          en: "Yesterday's pot is still warm. One ledger line is blank — will you write it?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Can'ı koruyan satır", en: "A line that protects Can" },
            next: "a1",
            affinity: [{ id: "n6", delta: 2 }, { id: "n1", delta: 2 }],
            rep: { rep_mediator: 2 },
          },
          {
            id: "b",
            label: { tr: "Cup dedikodu satırı", en: "A Cup-gossip line" },
            next: "b1",
            affinity: [{ id: "n1", delta: 2 }, { id: "n2", delta: 1 }],
            rep: { rep_stage: 2 },
          },
          {
            id: "c",
            label: { tr: "Boş bırak — sır kalsın", en: "Leave it blank — keep the secret" },
            next: "c1",
            affinity: [{ id: "n1", delta: 2 }],
            rep: { rep_instigator: 1 },
          },
        ],
      },
      {
        id: "a1",
        speaker: "n1",
        text: {
          tr: "Can rahatlar. Ama Peri bass açarsa satır titrer. Ne yaparsın?",
          en: "Can breathes easier. But if Peri opens the bass, the line shakes. What then?",
        },
        choices: [
          {
            id: "a2",
            label: { tr: "Peri'ye kısık söyle", en: "Ask Peri to soften" },
            next: "end",
            affinity: [{ id: "n5", delta: 2 }, { id: "n6", delta: 1 }],
            setFlags: ["free_n1_d2_protect"],
          },
          {
            id: "a3",
            label: { tr: "Defteri kapat, dinle", en: "Close the ledger, listen" },
            next: "end",
            affinity: [{ id: "n1", delta: 2 }],
            setFlags: ["free_n1_d2_protect_quiet"],
          },
        ],
      },
      {
        id: "b1",
        speaker: "n1",
        text: {
          tr: "Cup fısıltısı hazır. Kimi öne koyayım dedikoduda?",
          en: "Cup whisper ready. Who do I put in the gossip front row?",
        },
        choices: [
          {
            id: "b2",
            label: { tr: "Cem — formasyon", en: "Cem — formation" },
            next: "end",
            affinity: [{ id: "n2", delta: 2 }],
            setFlags: ["free_n1_d2_cup"],
          },
          {
            id: "b3",
            label: { tr: "Orhan — kural", en: "Orhan — rules" },
            next: "end",
            affinity: [{ id: "n4", delta: 2 }],
            setFlags: ["free_n1_d2_cup_orhan"],
          },
        ],
      },
      {
        id: "c1",
        speaker: "n1",
        text: {
          tr: "Boş satır… bazen en güçlü silah. Kimseye mi, yoksa sadece bana mı?",
          en: "A blank line… sometimes the sharpest tool. Keep it from everyone — or just from them?",
        },
        choices: [
          {
            id: "c2",
            label: { tr: "Sadece ikimiz", en: "Just us two" },
            next: "end",
            affinity: [{ id: "n1", delta: 3 }],
            setFlags: ["free_n1_d2_blank"],
          },
          {
            id: "c3",
            label: { tr: "Leyla da duysun sonra", en: "Leyla hears later" },
            next: "end",
            affinity: [{ id: "n3", delta: 2 }],
            setFlags: ["free_n1_d2_blank_leyla"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n1",
        text: {
          tr: "Yazıldı. Bu mahallede mürekkep kurur ama unutmaz.",
          en: "Written. On this street, ink dries — memory doesn't.",
        },
        ends: true,
      },
    ],
  },
  n2: {
    id: "free_n2_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n2",
        text: {
          tr: "Dünkü antrenmanın hesabı: diz iyi. Bugün formasyon testi. Hazır mısın?",
          en: "Yesterday's drill report: knee OK. Formation test today. Ready?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Sol kanat sıkı", en: "Pin the left wing" },
            next: "end",
            affinity: [{ id: "n2", delta: 3 }],
            rep: { rep_stage: 2 },
            setFlags: ["free_n2_d2_left"],
          },
          {
            id: "b",
            label: { tr: "Orta sahayı yumuşat", en: "Soften midfield" },
            next: "end",
            affinity: [{ id: "n2", delta: 2 }, { id: "n6", delta: 1 }],
            rep: { rep_mediator: 1 },
            setFlags: ["free_n2_d2_mid"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n2",
        text: {
          tr: "Not alındı. Cumartesi bu çizgi konuşur.",
          en: "Logged. Saturday, that line will talk.",
        },
        ends: true,
      },
    ],
  },
  n3: {
    id: "free_n3_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n3",
        text: {
          tr: "Dünkü ip hâlâ cebimde. Bugün uçuralım mı, yoksa barış mı?",
          en: "Yesterday's string's still in my pocket. Fly today — or make peace?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Alçak uçuş — Orhan rahat", en: "Low flight — Orhan chill" },
            next: "end",
            affinity: [{ id: "n3", delta: 2 }, { id: "n4", delta: 3 }],
            rep: { rep_mediator: 2 },
            setFlags: ["free_n3_d2_low"],
          },
          {
            id: "b",
            label: { tr: "Yüksek — efsane!", en: "High — legendary!" },
            next: "end",
            affinity: [{ id: "n3", delta: 4 }, { id: "n4", delta: -1 }],
            rep: { rep_instigator: 2 },
            setFlags: ["free_n3_d2_high"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n3",
        text: { tr: "Tamam! Uçurtma hafızası silinmez.", en: "Deal! Kite memory never wipes." },
        ends: true,
      },
    ],
  },
  n4: {
    id: "free_n4_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n4",
        text: {
          tr: "Dünkü kural denemesi… sonuç karışık. Bugün netleştirelim.",
          en: "Yesterday's rule trial… mixed results. Let's sharpen it today.",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Sert sınır", en: "Hard boundary" },
            next: "end",
            affinity: [{ id: "n4", delta: 3 }],
            traitDeltas: { Grumpy: 1 },
            setFlags: ["free_n4_d2_hard"],
          },
          {
            id: "b",
            label: { tr: "Cup gecesi esnek", en: "Flex on Cup night" },
            next: "end",
            affinity: [{ id: "n4", delta: 2 }, { id: "n5", delta: 2 }],
            rep: { rep_stage: 1 },
            setFlags: ["free_n4_d2_flex"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n4",
        text: { tr: "Yazıldı. Anten onayladı.", en: "Filed. Antenna approved." },
        ends: true,
      },
    ],
  },
  n5: {
    id: "free_n5_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n5",
        text: {
          tr: "Dünkü set hâlâ kulaklarda. Bugün remix mi, yoksa sustur mu?",
          en: "Yesterday's set is still in the ears. Remix today — or mute?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Remix — daha yumuşak", en: "Remix — softer" },
            next: "end",
            affinity: [{ id: "n5", delta: 2 }, { id: "n4", delta: 2 }],
            rep: { rep_mediator: 1 },
            setFlags: ["free_n5_d2_soft"],
          },
          {
            id: "b",
            label: { tr: "Cup drop hazırla", en: "Prep the Cup drop" },
            next: "end",
            affinity: [{ id: "n5", delta: 3 }],
            rep: { rep_stage: 3 },
            setFlags: ["free_n5_d2_cup"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n5",
        text: { tr: "Track kaydı. Mahalle titreyecek — kontrollü.", en: "Track locked. Block will vibrate — on purpose." },
        ends: true,
      },
    ],
  },
  n6: {
    id: "free_n6_d2",
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: "n6",
        text: {
          tr: "Dünkü poğaçalar bitti. Bugün fırın kime çalışacak?",
          en: "Yesterday's pastries are gone. Who does the oven work for today?",
        },
        choices: [
          {
            id: "a",
            label: { tr: "Cup takımı için", en: "For the Cup team" },
            next: "end",
            affinity: [{ id: "n6", delta: 2 }, { id: "n2", delta: 2 }],
            rep: { rep_oven: 2 },
            setFlags: ["free_n6_d2_team"],
          },
          {
            id: "b",
            label: { tr: "Barış tepsisi — herkese", en: "Peace tray — everyone" },
            next: "end",
            affinity: [{ id: "n6", delta: 2 }, { id: "n1", delta: 1 }, { id: "n4", delta: 1 }],
            rep: { rep_mediator: 2 },
            setFlags: ["free_n6_d2_peace"],
          },
        ],
      },
      {
        id: "end",
        speaker: "n6",
        text: { tr: "Sipariş alındı. Fırın yalan söylemez.", en: "Order in. The oven doesn't lie." },
        ends: true,
      },
    ],
  },
};

export function freePorchTree(neighborId, save = null) {
  const base = FREE_PORCH[neighborId];
  if (!base) return null;
  if (!save) return base;
  // After day 1, if any free_* flag exists for this neighbor, serve the follow-up tree
  const flags = Object.keys(save.storyFlags || {}).filter((f) => save.storyFlags[f]);
  const touched = flags.some((f) => f.startsWith(`free_${neighborId}`));
  if ((save.dayIndex || 1) >= 2 && touched && FREE_PORCH_FOLLOWUP[neighborId]) {
    // Don't re-serve follow-up if its end flags already set this evening's visit path fully —
    // still OK to show follow-up once per day via evening.visits gate in UI.
    return FREE_PORCH_FOLLOWUP[neighborId];
  }
  return base;
}

export function dialogueForNeighborVisit(stories, save, neighborId) {
  // 1) Active arc beat — only if this neighbor speaks in the beat tree
  //    (being listed on the arc roster is not enough; avoids Orhan's lines on Merve's porch)
  const next = nextArcBeat(stories, save);
  if (next && (next.arc.neighbors || []).includes(neighborId)) {
    const tree = getTree(stories, next.beat.dialogueTreeId);
    if (tree) {
      const speakers = new Set((tree.nodes || []).map((n) => n.speaker).filter(Boolean));
      if (!speakers.size || speakers.has(neighborId)) {
        return { kind: "arc", ...next, tree };
      }
    }
  }
  // 2) Secret personal tree
  const secret = secretTreeForNeighbor(stories, save, neighborId);
  if (secret) return { kind: "secret", tree: secret, neighborId };
  // 3) Cup-eve chatter on weekend — once per evening
  const dow = ((save.dayIndex - 1) % 7) + 1;
  if (dow >= 5 && !save.evening?.cupEveDone) {
    const tree = getTree(stories, "dlg_cup_eve_generic");
    if (tree) return { kind: "cup_eve", tree, neighborId };
  }
  // 4) Neighbor-specific free porch scene (day-aware follow-ups)
  const free = freePorchTree(neighborId, save);
  if (free) return { kind: "free", tree: free, neighborId };
  return null;
}

/** Only evaluate endings late — early dominantRep alone must not spoil. */
export function evaluateEndings(stories, save) {
  if ((save.dayIndex || 1) < 28 && !save.endingId) return null;
  const dom = dominantRep(save);
  for (const ending of stories.endings || []) {
    const req = ending.requires || {};
    if (req.dominantRep && req.dominantRep !== dom) continue;
    if (req.flagsAll && !hasAllFlags(save, req.flagsAll)) continue;
    if (req.flagsAny && !(req.flagsAny || []).some((f) => hasFlag(save, f))) continue;
    // Prefer endings that demand story flags once available
    if (!req.flagsAll && !req.flagsAny && req.dominantRep && (save.dayIndex || 1) < 28) continue;
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
