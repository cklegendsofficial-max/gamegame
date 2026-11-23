/** Combat pack helpers — synergy pools, porch calls, practice cup, juice. */

export function applySynergyPools(content, pack) {
  if (!content || !pack?.synergyTagPools?.length) return content;
  const byId = new Map((content.synergies || []).map((s) => [s.id, s]));
  for (const pool of pack.synergyTagPools) {
    const existing = byId.get(pool.synergyId);
    if (existing) {
      existing.tagsRequired = [...pool.tagsThatCount];
      existing.minCount = pool.minCount || 2;
      if (pool.rules) existing.rules = { ...existing.rules, ...pool.rules };
      if (pool.name) existing.name = pool.name;
    } else {
      byId.set(pool.synergyId, {
        id: pool.synergyId,
        name: pool.name,
        tagsRequired: [...pool.tagsThatCount],
        minCount: pool.minCount || 2,
        rules: { ...pool.rules },
      });
    }
  }
  content.synergies = [...byId.values()];
  return content;
}

export function activeFromPools(pack, tags, fallbackDefs = []) {
  const pools = pack?.synergyTagPools;
  if (!pools?.length) {
    return fallbackDefs.filter((s) => {
      const count = tags.filter((tag) => s.tagsRequired.includes(tag)).length;
      return count >= (s.minCount || 2);
    });
  }
  return pools
    .filter((p) => {
      const count = tags.filter((tag) => p.tagsThatCount.includes(tag)).length;
      return count >= (p.minCount || 2);
    })
    .map((p) => {
      const base = fallbackDefs.find((s) => s.id === p.synergyId) || {};
      return {
        ...base,
        id: p.synergyId,
        name: p.name || base.name,
        tagsRequired: p.tagsThatCount,
        minCount: p.minCount,
        rules: { ...(base.rules || {}), ...(p.rules || {}) },
        vfxId: p.vfxId,
        teachOrder: p.teachOrder,
      };
    });
}

export function nextLobbyTeach(pack, storyFlags = {}) {
  const beats = (pack?.synergyTeachBeats || []).filter((b) => b.phase === "lobby");
  for (const b of beats) {
    if (storyFlags[`syn_taught_${b.synergyId}`]) continue;
    if (b.gate === "after_rivalry_taught" && !storyFlags.syn_taught_syn_rivalry) continue;
    if (b.gate === "after_tea_taught" && !storyFlags.syn_taught_syn_tea_circle) continue;
    return b;
  }
  return null;
}

export function pickPorchCallOptions(pack, allySynIds = [], practice = false) {
  const calls = pack?.porchCalls;
  if (!calls?.options?.length) return null;
  const rules = calls.selectionRules || {};
  const practiceForce =
    (practice && (rules.practiceCupForceIds || ["call_focus_neighbor", "call_prop_assist", "call_chaos_kite"])) || null;
  if (practiceForce?.length) {
    const forced = practiceForce
      .map((id) => calls.options.find((o) => o.id === id))
      .filter(Boolean);
    if (forced.length) return forced;
  }
  const byCat = (cat) => calls.options.filter((o) => o.category === cat);
  const picked = [];
  const lean = calls.options.find(
    (o) => o.lean && allySynIds.includes(o.lean) && o.category === "synergy_leaning"
  );
  const safe = byCat("safe")[0];
  const swingy = byCat("swingy")[0];
  if (safe) picked.push(safe);
  if (swingy) picked.push(swingy);
  if (lean && !picked.includes(lean)) picked.push(lean);
  while (picked.length < 3) {
    const next = calls.options.find((o) => !picked.includes(o));
    if (!next) break;
    picked.push(next);
  }
  return picked.slice(0, calls.window?.optionsShown || 3);
}

export function applyPorchCallEffect(battle, option, locFn) {
  if (!battle || !option?.effect) return locFn?.(option.label) || option.id;
  const fx = option.effect;
  battle.porchCallId = option.id;
  battle.porchCallComic = option.comicHint;
  const allies = battle.allies.filter((u) => u.alive);
  const enemies = battle.enemies.filter((u) => u.alive);
  switch (fx.type) {
    case "ally_atk_buff":
      battle.atkBuffUntil = (battle.elapsed || 0) + (fx.durationSec || 6);
      battle.atkBuffPct = fx.atkBonusPercent || 0.12;
      break;
    case "mark_enemy_focus": {
      const target =
        enemies.slice().sort((a, b) => b.atk - a.atk)[0] || enemies[0];
      if (target) {
        battle.focusTargetSlot = target.slot;
        battle.focusUntil = (battle.elapsed || 0) + (fx.durationSec || 6);
        battle.focusDmgBonus = fx.damageTakenBonusPercent || 0.2;
      }
      break;
    }
    case "instant_heal_lowest_ally": {
      const hurt = allies.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (hurt) {
        const amt = Math.max(8, Math.floor(hurt.maxHp * (fx.healPercentMaxHp || 0.22)));
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + amt);
        battle.floaters = battle.floaters || [];
        battle.floaters.push({ side: hurt.side, slot: hurt.slot, heal: amt, t: battle.elapsed });
      }
      break;
    }
    case "front_ally_taunt": {
      const front = allies.find((u) => u.slot < 3) || allies[0];
      if (front) {
        battle.tauntSlot = front.slot;
        battle.tauntUntil = (battle.elapsed || 0) + (fx.durationSec || 5);
        battle.tauntRedirect = fx.damageRedirectPercent || 0.35;
      }
      break;
    }
    case "prop_toss_front_taunt_atk": {
      const front = allies.find((u) => u.slot < 3) || allies[0];
      if (front) {
        battle.tauntSlot = front.slot;
        battle.tauntUntil = (battle.elapsed || 0) + (fx.durationSec || 5);
        battle.tauntRedirect = fx.damageRedirectPercent || 0.3;
      }
      battle.atkBuffUntil = (battle.elapsed || 0) + (fx.durationSec || 5);
      battle.atkBuffPct = fx.atkBonusPercent || 0.08;
      break;
    }
    case "ally_dodge_buff":
      battle.dodgeBuffUntil = (battle.elapsed || 0) + (fx.durationSec || 4);
      battle.dodgeBuffChance = fx.dodgeChanceBonus || 0.15;
      break;
    case "swap_two_allies": {
      if (allies.length >= 2) {
        const front = allies.find((u) => u.slot < 3) || allies[0];
        const back = allies.find((u) => u.slot >= 3 && u !== front) || allies.find((u) => u !== front);
        if (front && back) {
          const s = front.slot;
          front.slot = back.slot;
          back.slot = s;
        }
      }
      break;
    }
    case "ally_def_buff":
      battle.defBuffUntil = (battle.elapsed || 0) + (fx.durationSec || 5);
      battle.defBuffPct = fx.defBonusPercent || 0.2;
      break;
    case "heal_aura_pulse":
      for (const u of allies) {
        const amt = Math.max(4, Math.floor(u.maxHp * (fx.healPercentMaxHp || 0.08)));
        u.hp = Math.min(u.maxHp, u.hp + amt);
        battle.floaters = battle.floaters || [];
        battle.floaters.push({ side: u.side, slot: u.slot, heal: amt, t: battle.elapsed });
      }
      break;
    default:
      break;
  }
  return locFn?.(option.label) || option.id;
}

export function cellToSlot(cell) {
  const map = {
    front_left: 0,
    front_mid: 1,
    front_right: 2,
    back_left: 3,
    back_mid: 4,
    back_right: 5,
  };
  return map[cell] ?? 0;
}

export function practiceSetup(pack) {
  return pack?.practiceCup || null;
}

export function shakeClass(juice, shakeId) {
  const row = juice?.cameraShake?.[shakeId];
  if (!row || !row.ampPx) return "";
  if (shakeId === "shake_heavy") return "shake-heavy";
  if (shakeId === "shake_medium") return "shake-medium";
  return "shake";
}

export function hitStopMs(juice, kind) {
  return juice?.hitStop?.[kind] || 0;
}


/** Porch Kit engine (mechanics-rewrite-2) */
function kitFor(pack, neighborId) {
  return (pack?.kits || []).find((k) => k.neighborId === neighborId) || null;
}

function attachKits(units, pack, side) {
  for (const u of units || []) {
    const nid = u.neighborId || u.mirrorOf || u.id;
    const kit = kitFor(pack, nid) || kitFor(pack, String(nid).replace(/^bot_/, 'n'));
    u.kit = kit;
    u.sigCd = 0;
    u.basicCd = kit?.basic?.intervalSec || 1.5;
    u.range = kit?.range || (u.slot < 3 ? 'melee' : 'ranged');
    u.propId = kit?.propId || u.propId;
    u.side = u.side || side;
  }
  return units;
}

export function createBattle({ allies, enemies, practice, pack }) {
  attachKits(allies, pack, 'ally');
  attachKits(enemies, pack, 'enemy');
  return {
    allies,
    enemies,
    practice: !!practice,
    pack,
    phase: 'opening',
    elapsed: 0,
    callOffered: false,
    callResolved: false,
    callId: null,
    markedSlot: null,
    tauntSlot: null,
    glanceHitsLeft: 0,
    synergyFired: [],
    signatureLog: [],
    finished: false,
    floaters: [],
    log: [],
  };
}

function living(side) {
  return (side || []).filter((u) => u.alive && u.hp > 0);
}

function applyEffect(battle, attacker, effect) {
  if (!effect) return;
  const allies = living(battle.allies);
  const enemies = living(battle.enemies);
  const foes = attacker.side === 'ally' ? enemies : allies;
  const friends = attacker.side === 'ally' ? allies : enemies;
  const type = effect.type;
  battle.floaters = battle.floaters || [];
  const push = (row) => battle.floaters.push({ ...row, t: battle.elapsed });

  if (type === 'mark_foe') {
    const t = foes.slice().sort((a, b) => b.atk - a.atk)[0] || foes[0];
    if (t) {
      battle.markedSlot = t.slot;
      battle.focusTargetSlot = t.slot;
      battle.focusUntil = battle.elapsed + (effect.durationSec || 6);
      battle.focusDmgBonus = 0.22;
      push({ side: t.side, slot: t.slot, mark: true });
    }
  } else if (type === 'taunt_glance') {
    battle.tauntSlot = attacker.slot;
    battle.tauntUntil = battle.elapsed + (effect.durationSec || 5);
    battle.glanceHitsLeft = effect.hits || 2;
    push({ side: attacker.side, slot: attacker.slot, taunt: true });
  } else if (type === 'heal_lowest' || type === 'heal_pulse') {
    const hurt = friends.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (hurt) {
      const amt = effect.amount || Math.max(8, Math.floor(hurt.maxHp * 0.12));
      hurt.hp = Math.min(hurt.maxHp, hurt.hp + amt);
      push({ side: hurt.side, slot: hurt.slot, heal: amt });
      if (type === 'heal_lowest' && (battle.allySyn || []).some((s) => /tea/i.test(s.id || ''))) {
        for (const u of friends) {
          if (u === hurt) continue;
          const a = Math.max(3, Math.floor(amt * 0.35));
          u.hp = Math.min(u.maxHp, u.hp + a);
          push({ side: u.side, slot: u.slot, heal: a });
        }
        if (!battle.synergyFired.includes('tea_pour')) battle.synergyFired.push('tea_pour');
      }
    }
  } else if (type === 'front_cone') {
    const fronts = foes.filter((f) => f.slot < 3);
    const list = fronts.length ? fronts : foes.slice(0, 2);
    for (const t of list) {
      let dmg = effect.power || 12;
      if ((battle.enemySyn || battle.allySyn || []).some((s) => /neon/i.test(s.id || '')) && battle.phase === 'opening') {
        /* neon window can dodge */
        if (Math.random() < 0.25) {
          push({ side: t.side, slot: t.slot, dodge: true });
          continue;
        }
      }
      t.hp = Math.max(0, t.hp - dmg);
      if (t.hp <= 0) t.alive = false;
      push({ side: t.side, slot: t.slot, dmg, cream: true });
    }
  } else if (type === 'swap_burst') {
    if (attacker.slot >= 3) {
      const front = friends.find((u) => u.slot < 3 && u !== attacker);
      if (front) {
        const s = front.slot;
        front.slot = attacker.slot;
        attacker.slot = s;
      }
    }
    const t = foes[0];
    if (t) {
      const dmg = effect.power || 18;
      t.hp = Math.max(0, t.hp - dmg);
      if (t.hp <= 0) t.alive = false;
      push({ side: t.side, slot: t.slot, dmg });
    }
  }

  const sig = attacker.kit?.signature;
  if (sig) {
    battle.signatureLog.push({ neighborId: attacker.neighborId || attacker.id, propId: attacker.propId || sig.vfx, id: sig.id });
    attacker.lastSigVfx = sig.vfx;
  }
}

function fireBasics(battle, dt) {
  const units = [...living(battle.allies), ...living(battle.enemies)];
  for (const u of units) {
    u.basicCd = (u.basicCd || 1.5) - dt;
    if (u.basicCd > 0) continue;
    u.basicCd = u.kit?.basic?.intervalSec || 1.5;
    const foes = living(u.side === 'ally' ? battle.enemies : battle.allies);
    if (!foes.length) continue;
    let target = foes.reduce((a, b) => (a.hp < b.hp ? a : b));
    if (u.side === 'ally' && battle.focusTargetSlot != null) {
      const f = foes.find((x) => x.slot === battle.focusTargetSlot);
      if (f) target = f;
    }
    if (u.side === 'enemy' && battle.tauntSlot != null && battle.elapsed <= (battle.tauntUntil || 0)) {
      const t = living(battle.allies).find((x) => x.slot === battle.tauntSlot);
      if (t) target = t;
    }
    let dmg = Math.max(1, Math.floor((u.atk || 8) * 0.35 - (target.def || 0) * 0.1));
    if (battle.glanceHitsLeft > 0 && target.slot === battle.tauntSlot && u.side === 'enemy') {
      dmg = Math.max(1, Math.floor(dmg * 0.4));
      battle.glanceHitsLeft -= 1;
    }
    if (u.side === 'ally' && battle.markedSlot === target.slot && (battle.allySyn || []).some((s) => /rival/i.test(s.id || ''))) {
      dmg = Math.floor(dmg * 1.35);
      if (!battle.synergyFired.includes('rivalry_mark')) battle.synergyFired.push('rivalry_mark');
    }
    target.hp = Math.max(0, target.hp - dmg);
    if (target.hp <= 0) target.alive = false;
    battle.floaters = battle.floaters || [];
    battle.floaters.push({ side: target.side, slot: target.slot, dmg, cream: true, t: battle.elapsed });
  }
}

function fireSignatures(battle, dt) {
  const units = living(battle.allies);
  for (const u of units) {
    const sig = u.kit?.signature;
    if (!sig) continue;
    u.sigCd = Math.max(0, (u.sigCd || 0) - dt);
    if (u.sigCd > 0) continue;
    // opening bias: fire sooner in opening
    const ready = battle.phase !== 'opening' || sig.openingBias || battle.elapsed >= 2.2;
    if (!ready) continue;
    u.sigCd = sig.cdSec || 8;
    applyEffect(battle, u, sig.effect);
  }
}

export function canOfferCall(battle) {
  if (!battle || battle.callOffered || battle.callResolved) return false;
  return (battle.elapsed || 0) >= 2.0 && battle.phase !== 'close';
}

export function resolveCall(battle, optionId) {
  if (!battle || battle.callResolved) return battle;
  battle.callResolved = true;
  battle.callId = optionId || 'call_prop_assist';
  battle.phase = 'close';
  for (const u of living(battle.allies)) {
    u.sigCd = Math.min(u.sigCd || 0, 1.2);
  }

  const allies = living(battle.allies);
  const enemies = living(battle.enemies);
  const byNid = (nid) => allies.find((u) => (u.neighborId || u.id) === nid || String(u.mirrorOf || '').includes(nid));
  let lead = null;
  let boardClass = 'pad-taunt';
  let kitId = 'hold_fence';

  if (battle.callId === 'call_focus_fire' || battle.callId === 'call_focus_neighbor') {
    lead = byNid('n2') || allies[0];
    boardClass = 'pad-marked';
    kitId = 'whistle_mark';
    const foe = enemies.slice().sort((a, b) => b.atk - a.atk)[0] || enemies[0];
    if (foe) {
      battle.focusTargetSlot = foe.slot;
      battle.markedSlot = foe.slot;
      battle.focusUntil = (battle.elapsed || 0) + 6;
      battle.focusDmgBonus = 0.25;
      foe.padClass = 'pad-marked';
    }
  } else if (battle.callId === 'call_chaos_kite') {
    lead = byNid('n3') || allies.find((u) => u.slot >= 3) || allies[0];
    boardClass = 'pad-swapped';
    kitId = 'kite_cut';
    const front = allies.find((u) => u.slot < 3);
    const back = allies.find((u) => u.slot >= 3 && u !== front) || allies.find((u) => u !== front);
    if (front && back) {
      const s = front.slot;
      front.slot = back.slot;
      back.slot = s;
      front.padClass = 'pad-swapped';
      back.padClass = 'pad-swapped';
    }
  } else {
    // call_prop_assist default — front fence / pour
    lead = allies.find((u) => u.slot < 3) || byNid('n4') || allies[0];
    boardClass = 'pad-taunt';
    kitId = lead?.kit?.signature?.id || 'hold_fence';
    if (lead) {
      battle.tauntSlot = lead.slot;
      battle.tauntUntil = (battle.elapsed || 0) + 5;
      battle.glanceHitsLeft = 2;
      lead.padClass = 'pad-taunt';
    }
  }

  if (lead?.kit?.signature?.effect) {
    applyEffect(battle, lead, lead.kit.signature.effect);
  }

  const padSlot =
    boardClass === 'pad-marked' && battle.markedSlot != null
      ? battle.markedSlot
      : lead?.slot ?? battle.tauntSlot ?? 0;
  battle.boardEvent = {
    kitId,
    propId: lead?.propId || lead?.kit?.propId || kitId,
    callId: battle.callId,
    testId: 'kit-board-change',
    boardClass,
    padClass: boardClass,
    padSlot,
    side: boardClass === 'pad-marked' ? 'enemy' : 'ally',
  };
  return battle;
}

export function markEnemyPad(battle, slot) {
  if (!battle) return;
  battle.markedSlot = slot;
  battle.focusTargetSlot = slot;
  battle.focusUntil = (battle.elapsed || 0) + 5;
}

export function step(battle, dt) {
  if (!battle || battle.finished) return battle;
  battle.elapsed = (battle.elapsed || 0) + dt;
  if (battle.phase === 'opening' && battle.elapsed >= 3.5) battle.phase = 'call';
  if (battle.callResolved && battle.phase !== 'close') battle.phase = 'close';
  fireBasics(battle, dt);
  fireSignatures(battle, dt);
  if (!living(battle.allies).length || !living(battle.enemies).length) {
    battle.finished = true;
    battle.phase = 'close';
  }
  return battle;
}

export function summary(battle) {
  const log = battle?.signatureLog || [];
  const last = log[log.length - 1] || {};
  return {
    synergyFired: [...(battle?.synergyFired || [])],
    callId: battle?.callId || null,
    mvpPropId: last.propId || null,
    mvpNeighborId: last.neighborId || null,
    survivingHp: living(battle?.allies || []).reduce((s, u) => s + u.hp, 0),
  };
}
