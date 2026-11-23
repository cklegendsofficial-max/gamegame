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
            label: { tr: "Orhan fence", en: "Orhan fence" },
            next: "c_end",
            affinity: [{ id: "n4", delta: 2 }, { id: "n2", delta: 1 }],
            rep: { rep_stage: 2 },
            setFlags: ["free_n1_cup_orhan"],
          },
          {
            id: "c3",
            label: { tr: "Leyla uçurtma", en: "Leyla kite" },
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

/** Day-2+ follow-ups that remember yesterday's porch chat — flag-specific 2-beat trees. */
const FOLLOWUP_FLAG_BEATS = {
  n1: [
    {
      flags: ["free_n1_debt_watch", "free_n1_debt_ask", "free_n1_debt_spread"],
      root: {
        tr: "Dün Can'ın borcunu konuştuk. Defter hâlâ titreşiyor — bugün ne yazıyoruz?",
        en: "Yesterday we talked Can's debt. The ledger's still humming — what do we write today?",
      },
      a: { tr: "Koruyucu satır", en: "A protective line", next: "a1" },
      b: { tr: "Söylentiyi dondur", en: "Freeze the rumor", next: "b1" },
      a1: {
        tr: "Koruma satırı hazır. Peri bass açarsa satır titrer. Ne yaparsın?",
        en: "Protection line ready. If Peri opens the bass, it shakes. What then?",
      },
      a2: { tr: "Peri'ye kısık söyle", en: "Ask Peri to soften", flag: "free_n1_d2_protect" },
      a3: { tr: "Defteri kapat, dinle", en: "Close the ledger, listen", flag: "free_n1_d2_protect_quiet" },
      b1: {
        tr: "Söylenti donduruldu. Kim hâlâ duysun — yoksa sadece sen?",
        en: "Rumor iced. Who still hears — or only you?",
      },
      b2: { tr: "Sadece ikimiz", en: "Just us two", flag: "free_n1_d2_blank" },
      b3: { tr: "Leyla da sonra", en: "Leyla later", flag: "free_n1_d2_blank_leyla" },
    },
    {
      flags: ["free_n1_quiet_tea", "free_n1_tip_peri"],
      root: {
        tr: "Dünkü çay hâlâ dilimde. Peri'ye fısıltı gitti mi — yoksa sadece demlikte mi kaldı?",
        en: "Yesterday's tea is still on my tongue. Did the Peri whisper travel — or stay in the pot?",
      },
      a: { tr: "Fısıltıyı doğrula", en: "Confirm the whisper", next: "a1" },
      b: { tr: "Cup satırına çevir", en: "Turn it into a Cup line", next: "b1" },
      a1: {
        tr: "Peri dinledi. Bass kısılacak mı, yoksa Orhan'a mı bırakacağız?",
        en: "Peri listened. Soften the bass — or leave it to Orhan?",
      },
      a2: { tr: "Peri kısık", en: "Peri softens", flag: "free_n1_d2_protect" },
      a3: { tr: "Orhan karar versin", en: "Let Orhan decide", flag: "free_n1_d2_protect_quiet" },
      b1: {
        tr: "Cup fısıltısı hazır. Kimi öne koyayım?",
        en: "Cup whisper ready. Who goes front in the gossip?",
      },
      b2: { tr: "Cem — formasyon", en: "Cem — formation", flag: "free_n1_d2_cup" },
      b3: { tr: "Orhan — kural", en: "Orhan — rules", flag: "free_n1_d2_cup_orhan" },
    },
    {
      flags: ["free_n1_cup_orhan", "free_n1_cup_leyla"],
      root: {
        tr: "Dün Cup dedikodusunu ayarladık. Bugün sahne kuruluyor — kimin adını yazıyorum?",
        en: "Yesterday we set Cup gossip. Stage is building — whose name do I ink?",
      },
      a: { tr: "Dünkü ismi tut", en: "Keep yesterday's name", next: "a1" },
      b: { tr: "Yeni bir twist", en: "Add a twist", next: "b1" },
      a1: {
        tr: "İsim sabit. İkinci satır: zafer mi, kaos mu?",
        en: "Name locked. Second line: victory — or chaos?",
      },
      a2: { tr: "Zafer satırı", en: "Victory line", flag: "free_n1_d2_cup" },
      a3: { tr: "Kaos satırı", en: "Chaos line", flag: "free_n1_d2_cup_orhan" },
      b1: {
        tr: "Twist hazır. Kime sızdırayım?",
        en: "Twist ready. Who gets the leak?",
      },
      b2: { tr: "Sadece Cem", en: "Only Cem", flag: "free_n1_d2_blank" },
      b3: { tr: "Leyla da duysun", en: "Leyla hears too", flag: "free_n1_d2_blank_leyla" },
    },
  ],
  n2: [
    {
      flags: ["free_n2_hard", "free_n2_protect"],
      root: {
        tr: "Dünkü sert koşunun hesabı: diz yanıyor. Bugün formasyon testi — aynı baskı mı?",
        en: "Yesterday's hard laps: knee burning. Formation test today — same pressure?",
      },
      a: { tr: "Sol kanat sıkı", en: "Pin the left wing", next: "a1" },
      b: { tr: "Can'ı koru yine", en: "Guard Can again", next: "b1" },
      a1: { tr: "Sol kilit. Kim destekler?", en: "Left locked. Who supports?", },
      a2: { tr: "Orhan fence", en: "Orhan fence", flag: "free_n2_d2_left" },
      a3: { tr: "Ben önde", en: "I go front", flag: "free_n2_d2_mid" },
      b1: { tr: "Can korunacak. Sen nereye?", en: "Can stays safe. Where do you go?", },
      b2: { tr: "Orta saha", en: "Midfield", flag: "free_n2_d2_mid" },
      b3: { tr: "Sol baskı", en: "Left press", flag: "free_n2_d2_left" },
    },
    {
      flags: ["free_n2_care", "free_n2_tip"],
      root: {
        tr: "Dün esnedik — diz teşekkür etti. Karşı Sırt notu hâlâ cebimde. Bugün ne yapıyoruz?",
        en: "Yesterday we stretched — knee thanks you. Rival Ridge note still in my pocket. Today?",
      },
      a: { tr: "Formasyonu del", en: "Drill the formation", next: "a1" },
      b: { tr: "Merve'ye güncelle", en: "Update Merve", next: "b1" },
      a1: { tr: "Formasyon çizildi. Sol mu orta mı?", en: "Formation drawn. Left or mid?", },
      a2: { tr: "Sol kanat", en: "Left wing", flag: "free_n2_d2_left" },
      a3: { tr: "Orta yumuşak", en: "Soft mid", flag: "free_n2_d2_mid" },
      b1: { tr: "Merve dinliyor. Ne fısıldayayım?", en: "Merve's listening. What whisper?", },
      b2: { tr: "Sol şişirme", en: "Left overload", flag: "free_n2_d2_left" },
      b3: { tr: "Merhamet temposu", en: "Mercy tempo", flag: "free_n2_d2_mid" },
    },
    {
      flags: ["free_n2_rival", "free_n2_bluff"],
      root: {
        tr: "Dün Karşı Sırt'ı ölçtük. Bugün blöf mü, demir formasyon mu?",
        en: "Yesterday we measured Rival Ridge. Today: bluff — or iron formation?",
      },
      a: { tr: "Demir formasyon", en: "Iron formation", next: "a1" },
      b: { tr: "Blöfü büyüt", en: "Grow the bluff", next: "b1" },
      a1: { tr: "Demir hazır. Hangi kanat?", en: "Iron ready. Which wing?", },
      a2: { tr: "Sol", en: "Left", flag: "free_n2_d2_left" },
      a3: { tr: "Orta", en: "Mid", flag: "free_n2_d2_mid" },
      b1: { tr: "Blöf neon'la parla. Kim önde?", en: "Bluff with neon. Who fronts?", },
      b2: { tr: "Peri tempo", en: "Peri tempo", flag: "free_n2_d2_left" },
      b3: { tr: "Sen + Can", en: "You + Can", flag: "free_n2_d2_mid" },
    },
  ],
  n3: [
    {
      flags: ["free_n3_coop", "free_n3_sorry"],
      root: {
        tr: "Dün ipi birlikte çözdük. Orhan hâlâ antene bakıyor — bugün alçak mı, yüksek mi?",
        en: "Yesterday we untangled together. Orhan's still watching the antenna — low or high today?",
      },
      a: { tr: "Alçak — barış", en: "Low — peace", next: "a1" },
      b: { tr: "Biraz yüksek — heyecan", en: "A bit higher — spice", next: "b1" },
      a1: { tr: "Alçak uçuş. Kim onaylasın?", en: "Low flight. Who signs off?", },
      a2: { tr: "Orhan razı", en: "Orhan okays", flag: "free_n3_d2_low" },
      a3: { tr: "Merve şahit", en: "Merve witnesses", flag: "free_n3_d2_low" },
      b1: { tr: "Yükseklik çağırıyor. Risk?", en: "Height calls. Risk it?", },
      b2: { tr: "Kontrollü yüksek", en: "Controlled high", flag: "free_n3_d2_high" },
      b3: { tr: "Tam efsane", en: "Full legend", flag: "free_n3_d2_high" },
    },
    {
      flags: ["free_n3_spicy", "free_n3_chaos"],
      root: {
        tr: "Dün antene meydan okuduk. İp hâlâ cebimde — bugün barış mı, devam mı?",
        en: "Yesterday we dared the antenna. String still in my pocket — peace or continue?",
      },
      a: { tr: "Barış uçuşu", en: "Peace flight", next: "a1" },
      b: { tr: "Efsane tekrar", en: "Legend again", next: "b1" },
      a1: { tr: "Barış için alçak. Onay?", en: "Low for peace. Confirm?", },
      a2: { tr: "Evet — Orhan rahat", en: "Yes — Orhan chill", flag: "free_n3_d2_low" },
      a3: { tr: "Poğaça ile özür", en: "Apology pastry", flag: "free_n3_d2_low" },
      b1: { tr: "Yüksek yine. Kim izler?", en: "High again. Who watches?", },
      b2: { tr: "Tüm mahalle", en: "Whole block", flag: "free_n3_d2_high" },
      b3: { tr: "Sadece sen + ben", en: "Just you + me", flag: "free_n3_d2_high" },
    },
    {
      flags: ["free_n3_tipped", "free_n3_pastry"],
      root: {
        tr: "Dün sır borcu / poğaça… bugün uçurtma hafızası ne ister?",
        en: "Yesterday's secret-debt / pastry… what does kite memory want today?",
      },
      a: { tr: "Alçak teşekkür uçuşu", en: "Low thank-you flight", next: "a1" },
      b: { tr: "Yüksek gösteri", en: "High show", next: "b1" },
      a1: { tr: "Teşekkür alçak. Kime?", en: "Thanks low. For whom?", },
      a2: { tr: "Orhan", en: "Orhan", flag: "free_n3_d2_low" },
      a3: { tr: "Can", en: "Can", flag: "free_n3_d2_low" },
      b1: { tr: "Gösteri yüksek. Risk seviyesi?", en: "Show high. Risk level?", },
      b2: { tr: "Orta risk", en: "Medium risk", flag: "free_n3_d2_high" },
      b3: { tr: "Maksimum", en: "Max", flag: "free_n3_d2_high" },
    },
  ],
  n4: [
    {
      flags: ["free_n4_rules", "free_n4_cup_ex"],
      root: {
        tr: "Dünkü kural denemesi… sonuç karışık. Bugün sert sınır mı, Cup esnekliği mi?",
        en: "Yesterday's rule trial… mixed. Hard boundary today — or Cup flex?",
      },
      a: { tr: "Sert sınır", en: "Hard boundary", next: "a1" },
      b: { tr: "Cup gecesi esnek", en: "Flex on Cup night", next: "b1" },
      a1: { tr: "Sınır çizildi. Kim imzalar?", en: "Boundary drawn. Who signs?", },
      a2: { tr: "Ben + anten", en: "Me + antenna", flag: "free_n4_d2_hard" },
      a3: { tr: "Merve şahit", en: "Merve witnesses", flag: "free_n4_d2_hard" },
      b1: { tr: "Esneklik notu. Peri dahil mi?", en: "Flex note. Include Peri?", },
      b2: { tr: "Peri dahil", en: "Include Peri", flag: "free_n4_d2_flex" },
      b3: { tr: "Sadece Cup saati", en: "Cup hour only", flag: "free_n4_d2_flex" },
    },
    {
      flags: ["free_n4_soft", "free_n4_merve"],
      root: {
        tr: "Dün yumuşak kaldık / Merve arabuldu. Bugün kuralı netleştirelim.",
        en: "Yesterday we stayed soft / Merve mediated. Sharpen the rule today.",
      },
      a: { tr: "Yine yumuşak ama yazılı", en: "Soft but written", next: "a1" },
      b: { tr: "Cup için esnek madde", en: "Cup flex clause", next: "b1" },
      a1: { tr: "Yazılı yumuşaklık. Son madde?", en: "Written softness. Final clause?", },
      a2: { tr: "Bass sınırı", en: "Bass limit", flag: "free_n4_d2_hard" },
      a3: { tr: "Gece sessizliği", en: "Night quiet", flag: "free_n4_d2_hard" },
      b1: { tr: "Cup maddesi. Kim faydalanır?", en: "Cup clause. Who benefits?", },
      b2: { tr: "Peri seti", en: "Peri's set", flag: "free_n4_d2_flex" },
      b3: { tr: "Tüm mahalle", en: "Whole block", flag: "free_n4_d2_flex" },
    },
    {
      flags: ["free_n4_letters_hint", "free_n4_letters_cup"],
      root: {
        tr: "Dün mektupları konuştuk. Bugün kural defterine ne düşüyor?",
        en: "Yesterday we talked letters. What lands in the rule book today?",
      },
      a: { tr: "Mahalle anlayışı maddesi", en: "Understand-the-block clause", next: "a1" },
      b: { tr: "Cup hikâyesi maddesi", en: "Cup-story clause", next: "b1" },
      a1: { tr: "Anlayış maddesi. Sert mi esnek mi?", en: "Understanding clause. Hard or flex?", },
      a2: { tr: "Sert", en: "Hard", flag: "free_n4_d2_hard" },
      a3: { tr: "Esnek", en: "Flex", flag: "free_n4_d2_flex" },
      b1: { tr: "Cup maddesi. Ne kadar geniş?", en: "Cup clause. How wide?", },
      b2: { tr: "Dar — sadece gece", en: "Narrow — night only", flag: "free_n4_d2_flex" },
      b3: { tr: "Geniş — tüm hafta sonu", en: "Wide — whole weekend", flag: "free_n4_d2_flex" },
    },
  ],
  n5: [
    {
      flags: ["free_n5_soft", "free_n5_tea_neon"],
      root: {
        tr: "Dünkü yumuşak set hâlâ kulaklarda. Bugün remix mi, Cup drop mu?",
        en: "Yesterday's soft set is still in the ears. Remix today — or Cup drop?",
      },
      a: { tr: "Remix — daha yumuşak", en: "Remix — softer", next: "a1" },
      b: { tr: "Cup drop hazırla", en: "Prep the Cup drop", next: "b1" },
      a1: { tr: "Remix. Hangi renk?", en: "Remix. Which color?", },
      a2: { tr: "Mercan", en: "Coral", flag: "free_n5_d2_soft" },
      a3: { tr: "Çay kreması", en: "Tea cream", flag: "free_n5_d2_soft" },
      b1: { tr: "Cup drop. Bass seviyesi?", en: "Cup drop. Bass level?", },
      b2: { tr: "Kısık — Orhan razı", en: "Soft — Orhan ok", flag: "free_n5_d2_cup" },
      b3: { tr: "Tam drop", en: "Full drop", flag: "free_n5_d2_cup" },
    },
    {
      flags: ["free_n5_loud", "free_n5_mid"],
      root: {
        tr: "Dün risk aldık / yarıya çektik. Kulaklar çınlıyor. Bugün ne?",
        en: "Yesterday we risked it / pulled halfway. Ears ringing. Today?",
      },
      a: { tr: "Yumuşat — barış", en: "Soften — peace", next: "a1" },
      b: { tr: "Cup için sakla", en: "Save it for Cup", next: "b1" },
      a1: { tr: "Yumuşak remix. Orhan'a haber?", en: "Soft remix. Tell Orhan?", },
      a2: { tr: "Evet haber ver", en: "Yes, tell him", flag: "free_n5_d2_soft" },
      a3: { tr: "Sadece çal", en: "Just play", flag: "free_n5_d2_soft" },
      b1: { tr: "Cup'a saklandı. Hook rengi?", en: "Saved for Cup. Hook color?", },
      b2: { tr: "Neon mercan", en: "Neon coral", flag: "free_n5_d2_cup" },
      b3: { tr: "Fırın ısısı", en: "Oven heat", flag: "free_n5_d2_cup" },
    },
    {
      flags: ["free_n5_theme", "free_n5_oven"],
      root: {
        tr: "Dün Cup hook'unu yazdık. Bugün track'i kilitleyelim mi?",
        en: "Yesterday we wrote the Cup hook. Lock the track today?",
      },
      a: { tr: "Yumuşak final mix", en: "Soft final mix", next: "a1" },
      b: { tr: "Cup drop kilidi", en: "Lock Cup drop", next: "b1" },
      a1: { tr: "Final mix. Tema?", en: "Final mix. Theme?", },
      a2: { tr: "Mercan + çay", en: "Coral + tea", flag: "free_n5_d2_soft" },
      a3: { tr: "Sadece çay", en: "Tea only", flag: "free_n5_d2_soft" },
      b1: { tr: "Drop kilit. Kim ilk dinlesin?", en: "Drop locked. Who hears first?", },
      b2: { tr: "Cem", en: "Cem", flag: "free_n5_d2_cup" },
      b3: { tr: "Can", en: "Can", flag: "free_n5_d2_cup" },
    },
  ],
  n6: [
    {
      flags: ["free_n6_share", "free_n6_leyla"],
      root: {
        tr: "Dünkü poğaçalar bitti — Orhan/Leyla payı gitti. Bugün fırın kime?",
        en: "Yesterday's pastries gone — Orhan/Leyla share delivered. Oven for whom today?",
      },
      a: { tr: "Cup takımı", en: "Cup team", next: "a1" },
      b: { tr: "Barış tepsisi", en: "Peace tray", next: "b1" },
      a1: { tr: "Cup paketi. Tatlı mı tuzlu mu?", en: "Cup pack. Sweet or savory?", },
      a2: { tr: "Tatlı + kahve", en: "Sweet + coffee", flag: "free_n6_d2_team" },
      a3: { tr: "Tuzlu + çay", en: "Savory + tea", flag: "free_n6_d2_team" },
      b1: { tr: "Barış tepsisi. Kim önce?", en: "Peace tray. Who first?", },
      b2: { tr: "Orhan", en: "Orhan", flag: "free_n6_d2_peace" },
      b3: { tr: "Herkes birlikte", en: "Everyone together", flag: "free_n6_d2_peace" },
    },
    {
      flags: ["free_n6_ledger", "free_n6_joke"],
      root: {
        tr: "Dün defteri açtık. Bugün fırın borç mu yazar, yoksa poğaça mı?",
        en: "Yesterday we opened the book. Today: oven writes debt — or pastry?",
      },
      a: { tr: "Poğaça ile sil", en: "Erase with pastry", next: "a1" },
      b: { tr: "Cup enerjisi yaz", en: "Write Cup energy", next: "b1" },
      a1: { tr: "Poğaça silgisi. Kime?", en: "Pastry eraser. For whom?", },
      a2: { tr: "Mahalle barışı", en: "Block peace", flag: "free_n6_d2_peace" },
      a3: { tr: "Merve defteri", en: "Merve's ledger", flag: "free_n6_d2_peace" },
      b1: { tr: "Cup enerjisi. Paket?", en: "Cup energy. Pack?", },
      b2: { tr: "Takım paketi", en: "Team pack", flag: "free_n6_d2_team" },
      b3: { tr: "Sadece Cem", en: "Cem only", flag: "free_n6_d2_team" },
    },
    {
      flags: ["free_n6_fuel", "free_n6_tea_snack"],
      root: {
        tr: "Dün Cup ikramını paketledik. Bugün fırın aynı siparişi mi basacak?",
        en: "Yesterday we packed Cup snacks. Same order from the oven today?",
      },
      a: { tr: "Aynı paket — takım", en: "Same pack — team", next: "a1" },
      b: { tr: "Barışa çevir", en: "Flip to peace", next: "b1" },
      a1: { tr: "Takım paketi onay. Ekstra?", en: "Team pack confirmed. Extra?", },
      a2: { tr: "Çift kahve", en: "Double coffee", flag: "free_n6_d2_team" },
      a3: { tr: "Ekstra çay", en: "Extra tea", flag: "free_n6_d2_team" },
      b1: { tr: "Barış tepsisi. Kim?", en: "Peace tray. Who?", },
      b2: { tr: "Herkes", en: "Everyone", flag: "free_n6_d2_peace" },
      b3: { tr: "Orhan + Leyla", en: "Orhan + Leyla", flag: "free_n6_d2_peace" },
    },
  ],
};

function buildFlagFollowup(neighborId, pack) {
  return {
    id: `free_${neighborId}_d2`,
    start: "root",
    nodes: [
      {
        id: "root",
        speaker: neighborId,
        text: pack.root,
        choices: [
          { id: "a", label: { tr: pack.a.tr, en: pack.a.en }, next: pack.a.next, affinity: [{ id: neighborId, delta: 2 }] },
          { id: "b", label: { tr: pack.b.tr, en: pack.b.en }, next: pack.b.next, affinity: [{ id: neighborId, delta: 2 }] },
        ],
      },
      {
        id: "a1",
        speaker: neighborId,
        text: pack.a1,
        choices: [
          { id: "a2", label: { tr: pack.a2.tr, en: pack.a2.en }, next: "end", affinity: [{ id: neighborId, delta: 2 }], setFlags: [pack.a2.flag] },
          { id: "a3", label: { tr: pack.a3.tr, en: pack.a3.en }, next: "end", affinity: [{ id: neighborId, delta: 2 }], setFlags: [pack.a3.flag] },
        ],
      },
      {
        id: "b1",
        speaker: neighborId,
        text: pack.b1,
        choices: [
          { id: "b2", label: { tr: pack.b2.tr, en: pack.b2.en }, next: "end", affinity: [{ id: neighborId, delta: 2 }], setFlags: [pack.b2.flag] },
          { id: "b3", label: { tr: pack.b3.tr, en: pack.b3.en }, next: "end", affinity: [{ id: neighborId, delta: 2 }], setFlags: [pack.b3.flag] },
        ],
      },
      {
        id: "end",
        speaker: neighborId,
        text: {
          tr: "Not alındı. Dünün izi bugüne yazıldı.",
          en: "Logged. Yesterday's mark is written into today.",
        },
        ends: true,
      },
    ],
  };
}

export function freePorchTree(neighborId, save = null) {
  const base = FREE_PORCH[neighborId];
  if (!base) return null;
  if (!save) return base;
  const day = save.dayIndex || 1;
  if (day < 2) return base;
  const flags = Object.keys(save.storyFlags || {}).filter((f) => save.storyFlags[f]);
  // Prefer flag-specific Day2+ follow-up (not already consumed d2 flags)
  const packs = FOLLOWUP_FLAG_BEATS[neighborId] || [];
  for (const pack of packs) {
    if (pack.flags.some((f) => flags.includes(f))) {
      // Skip if this evening already finished a d2 follow-up for this neighbor
      const d2Done = flags.some((f) => f.startsWith(`free_${neighborId}_d2`));
      if (!d2Done) return buildFlagFollowup(neighborId, pack);
    }
  }
  // Fallback: any free_* touch without matching pack still gets generic 2-beat echo
  const touched = flags.some((f) => f.startsWith(`free_${neighborId}_`) && !f.includes("_d2"));
  if (touched) {
    const fallback = packs[0];
    if (fallback && !flags.some((f) => f.startsWith(`free_${neighborId}_d2`))) {
      return buildFlagFollowup(neighborId, {
        ...fallback,
        root: {
          tr: `Dünkü porch konuşmamız hâlâ duruyor. Bugün ikinci tur — ne diyorsun?`,
          en: `Yesterday's porch talk is still standing. Second round today — what do you say?`,
        },
      });
    }
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
