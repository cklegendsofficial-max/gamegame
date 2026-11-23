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
