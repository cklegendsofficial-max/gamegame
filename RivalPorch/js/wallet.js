/** Soft/hard currency + cosmetic shop helpers (power flags always ignored). */

export function econT(economy, locale, key) {
  const s = economy?.uiStrings?.[key];
  if (!s) return key;
  return s[locale] || s.en || key;
}

export function grant(save, bag) {
  if (!bag) return;
  for (const [k, v] of Object.entries(bag)) {
    if (typeof v === "number") save.currencies[k] = (save.currencies[k] || 0) + v;
  }
}

export function canPay(save, price) {
  if (!price) return false;
  return (save.currencies[price.currency] || 0) >= price.amount;
}

export function pay(save, price) {
  if (!canPay(save, price)) return false;
  save.currencies[price.currency] -= price.amount;
  return true;
}

/** Prefer soft prices first; clay_tokens last — cosmetics only. */
export function bestAffordablePrice(save, prices = []) {
  const soft = prices.filter((p) => p.currency !== "clay_tokens");
  const hard = prices.filter((p) => p.currency === "clay_tokens");
  for (const p of [...soft, ...hard]) {
    if (canPay(save, p)) return p;
  }
  return prices[0] || null;
}

export function ownCosmetic(save, kind, id) {
  const list = save.ownedCosmetics[kind] || (save.ownedCosmetics[kind] = []);
  if (!list.includes(id)) list.push(id);
}

export function owns(save, kind, id) {
  return (save.ownedCosmetics[kind] || []).includes(id);
}

export function catalogKind(key) {
  const map = {
    porch_skins: "porch_skins",
    unit_poses: "unit_poses",
    comic_frames: "comic_frames",
    emotes: "emotes",
  };
  return map[key] || key;
}

export function formatPrice(price, economy, locale) {
  if (!price) return "—";
  const names = {
    porch_coins: econT(economy, locale, "shop.currency.coins"),
    neon_thread: econT(economy, locale, "shop.currency.thread"),
    clay_tokens: econT(economy, locale, "shop.currency.tokens"),
  };
  return `${price.amount} ${names[price.currency] || price.currency}`;
}

export function rewardLabel(reward, locale) {
  if (!reward) return "—";
  if (reward.type === "currency") {
    return `${reward.amount} ${reward.currency}`;
  }
  if (reward.type === "bundle") {
    return (reward.items || [])
      .map((i) => (i.currency ? `${i.amount} ${i.currency}` : i.itemId || i.type))
      .join(" + ");
  }
  return reward.itemId || reward.type;
}

export function applyDailyEarn(save, economy, action) {
  const daily = economy.earnRates?.daily || {};
  if (action === "checkin" && daily.porch_checkin) {
    grant(save, { porch_coins: daily.porch_checkin.porch_coins || 0 });
    return daily.porch_checkin;
  }
  if (action === "talk" && daily.talk) {
    const cap = daily.talk.maxCoinAwardsPerDay ?? 2;
    if ((save.dailyEarn.talkCoins || 0) < cap) {
      grant(save, { porch_coins: daily.talk.porch_coins || 0 });
      save.dailyEarn.talkCoins = (save.dailyEarn.talkCoins || 0) + 1;
      return daily.talk;
    }
    return null;
  }
  if (action === "drama" && daily.drama_resolve) {
    const bag = { porch_coins: daily.drama_resolve.porch_coins || 0 };
    if (daily.drama_resolve.neonThreadOnlyFirstDramaPerDay) {
      if (!save.dailyEarn.dramaThread) {
        bag.neon_thread = daily.drama_resolve.neon_thread || 0;
        save.dailyEarn.dramaThread = true;
      }
    } else {
      bag.neon_thread = daily.drama_resolve.neon_thread || 0;
    }
    grant(save, bag);
    return bag;
  }
  if (action === "overnight" && daily.overnight_idle_claim) {
    grant(save, { porch_coins: daily.overnight_idle_claim.porch_coins || 0 });
    return daily.overnight_idle_claim;
  }
  return null;
}

export function applyCupEarn(save, economy, { won, hadSynergy, shared }) {
  const cup = economy.earnRates?.cup || {};
  if (won) grant(save, cup.win || {});
  else grant(save, cup.loss || {});
  if (hadSynergy && cup.synergySpotlight) grant(save, cup.synergySpotlight);
  if (shared && cup.shareComicFirstPerCup && !save.dailyEarn.shareClaimed) {
    grant(save, cup.shareComicFirstPerCup);
    save.dailyEarn.shareClaimed = true;
  }
}

export function addPassXp(save, amount = 1) {
  const target = 30;
  save.passXp = (save.passXp || 0) + amount;
  // ~1 level per evening completion + cup
  while (save.passLevel < target && save.passXp >= save.passLevel) {
    save.passXp -= save.passLevel;
    save.passLevel += 1;
  }
  if (save.passLevel > target) save.passLevel = target;
}

export function claimPassReward(save, economy, level, track) {
  const row = (economy.seasonPass?.rewards || []).find((r) => r.level === level);
  if (!row) return null;
  if (level > save.passLevel) return null;
  const key = track === "paid" ? "claimedPassPaid" : "claimedPassFree";
  if ((save[key] || []).includes(level)) return null;
  if (track === "paid" && !save.passPaidUnlocked) return null;
  const reward = row[track];
  grantRewardItem(save, reward);
  save[key] = [...(save[key] || []), level];
  return reward;
}

function grantRewardItem(save, reward) {
  if (!reward) return;
  if (reward.type === "currency") {
    grant(save, { [reward.currency]: reward.amount });
    return;
  }
  if (reward.type === "bundle") {
    for (const item of reward.items || []) {
      if (item.currency) grant(save, { [item.currency]: item.amount });
      else if (item.itemId && item.type) mapCosmeticGrant(save, item.type, item.itemId);
      else if (item.itemId) guessCosmetic(save, item.itemId);
    }
    return;
  }
  mapCosmeticGrant(save, reward.type, reward.itemId);
}

function mapCosmeticGrant(save, type, id) {
  if (!id) return;
  const kind =
    type === "porch_skin" || type === "porch_skin_tint"
      ? "porch_skins"
      : type === "unit_pose"
        ? "unit_poses"
        : type === "comic_frame"
          ? "comic_frames"
          : type === "emote"
            ? "emotes"
            : type === "gift_wrap"
              ? "gift_wraps"
              : type === "decor"
                ? "decor"
                : null;
  if (kind) ownCosmetic(save, kind, id);
}

function guessCosmetic(save, id) {
  if (id.startsWith("skin_")) ownCosmetic(save, "porch_skins", id);
  else if (id.startsWith("pose_")) ownCosmetic(save, "unit_poses", id);
  else if (id.startsWith("frame_")) ownCosmetic(save, "comic_frames", id);
  else if (id.startsWith("emote_")) ownCosmetic(save, "emotes", id);
}
