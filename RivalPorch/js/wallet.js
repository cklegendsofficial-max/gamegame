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

function titleCaseWords(s) {
  return String(s || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const COSMETIC_KIND = {
  skin_: "porch_skins",
  pose_: "unit_poses",
  frame_: "comic_frames",
  emote_: "emotes",
  tint_: "porch_skins",
  wrap_: "gift_wraps",
};

function prettyItemId(id = "", locale = "en", economy = null) {
  const raw = String(id || "");
  if (economy?.shopCatalog) {
    for (const items of Object.values(economy.shopCatalog)) {
      const hit = (items || []).find((x) => x.id === raw);
      if (hit?.name) return hit.name[locale] || hit.name.en || titleCaseWords(raw);
    }
  }
  // gift wraps / pass-only ids
  const passOnly = {
    wrap_clay_ribbon: { tr: "Kil Kurdele Paket", en: "Clay Ribbon Wrap" },
    tint_warm_glow: { tr: "Sıcak Işık Tonu", en: "Warm Glow Tint" },
  };
  if (passOnly[raw]) return passOnly[raw][locale] || passOnly[raw].en;
  const kindHint = raw.startsWith("skin_")
    ? locale === "tr" ? "Veranda" : "Porch skin"
    : raw.startsWith("pose_")
      ? locale === "tr" ? "Poz" : "Pose"
      : raw.startsWith("frame_")
        ? locale === "tr" ? "Çerçeve" : "Frame"
        : raw.startsWith("emote_")
          ? locale === "tr" ? "İfade" : "Emote"
          : raw.startsWith("wrap_")
            ? locale === "tr" ? "Paket" : "Wrap"
            : "";
  const body = titleCaseWords(raw.replace(/^(skin_|pose_|frame_|emote_|tint_|decor_|wrap_)/, ""));
  return kindHint ? `${kindHint}: ${body}` : body || "—";
}

export function rewardLabel(reward, locale, economy = null) {
  if (!reward) return "—";
  const names = {
    porch_coins: locale === "tr" ? "Veranda Jetonu" : "Porch Coins",
    neon_thread: locale === "tr" ? "Neon İplik" : "Neon Thread",
    clay_tokens: locale === "tr" ? "Kil Jeton" : "Clay Tokens",
  };
  if (reward.type === "currency") {
    return `${reward.amount} ${names[reward.currency] || reward.currency}`;
  }
  if (reward.type === "bundle") {
    return (reward.items || [])
      .map((i) =>
        i.currency
          ? `${i.amount} ${names[i.currency] || i.currency}`
          : prettyItemId(i.itemId || i.type, locale, economy)
      )
      .join(" + ");
  }
  return prettyItemId(reward.itemId || reward.type, locale, economy);
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
  const before = { ...(save.currencies || {}) };
  const parts = [];
  if (won) {
    grant(save, cup.win || {});
    parts.push({ label: "win", bag: cup.win || {} });
  } else {
    grant(save, cup.loss || {});
    parts.push({ label: "loss", bag: cup.loss || {} });
  }
  if (hadSynergy && cup.synergySpotlight) {
    grant(save, cup.synergySpotlight);
    parts.push({ label: "synergy", bag: cup.synergySpotlight });
  }
  if (shared && cup.shareComicFirstPerCup && !save.dailyEarn.shareClaimed) {
    grant(save, cup.shareComicFirstPerCup);
    save.dailyEarn.shareClaimed = true;
    parts.push({ label: "share", bag: cup.shareComicFirstPerCup });
  }
  const delta = {};
  for (const k of Object.keys(save.currencies || {})) {
    const d = (save.currencies[k] || 0) - (before[k] || 0);
    if (d) delta[k] = d;
  }
  return { delta, parts };
}

export function formatCurrencyDelta(delta, economy, locale) {
  if (!delta) return "";
  return Object.entries(delta)
    .filter(([, v]) => v)
    .map(([k, v]) => {
      const name =
        k === "porch_coins"
          ? econT(economy, locale, "shop.currency.coins")
          : k === "neon_thread"
            ? econT(economy, locale, "shop.currency.thread")
            : econT(economy, locale, "shop.currency.tokens");
      return `${v > 0 ? "+" : ""}${v} ${name}`;
    })
    .join(" · ");
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
