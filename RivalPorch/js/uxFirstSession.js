/** UX rewrite-1+2 — first 10 desire: side → Cup gossip → share. */

export function firstShareDone(save) {
  return !!(save?.storyFlags?.first_share_done);
}

export function first10Active(save) {
  const day = save?.dayIndex || 1;
  return day <= 1 || !firstShareDone(save);
}

export function week2ChromeAllowed(save) {
  return firstShareDone(save) && (save?.dayIndex || 1) >= 7;
}

export function rewardUiAllowed(save) {
  return firstShareDone(save);
}

export function scrubProductionEscapeHatches(root = document) {
  const ban = [
    "[data-testid='skip-to-morning']",
    "[data-skip-to-morning]",
    "#btn-skip-morning",
    ".rp-skip-morning",
    "[data-testid='unstuck']",
    ".rp-unstuck",
    ".fight-unstuck",
    "[data-testid='force-overnight-story']",
  ];
  const audit = document.documentElement.dataset.auditCold === "1";
  if (!audit) {
    ban.push("[data-testid='practice-settle']", "[data-testid='practice-settle-wrap']", "[data-testid='practice-settle-sheet']");
  }
  for (const sel of ban) {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  }
}

export function mountSharePorchMoment({ locale = "en", summary = {}, coldLine = "" } = {}) {
  const tr = locale === "tr";
  const call = summary.callLabel || summary.callId || (tr ? "Çağrı" : "Call");
  const prop = summary.mvpProp || summary.mvpName || (tr ? "demlik" : "teapot");
  const syn = summary.synergyFired || "";
  const panel3 =
    coldLine ||
    (tr
      ? "Yarın ip hâlâ orada olacak — mahalle unutmaz."
      : "Tomorrow the line will still be there — the block doesn’t forget.");
  return `<section class="rp-share-porch" data-testid="share-porch-moment">
    <div class="rp-comic-strip rp-comic-strip--share" data-testid="share-comic-strip">
      <div class="rp-comic-panel"><span>${tr ? "Porch’ta vuruş" : "Hit on the porch"}</span></div>
      <div class="rp-comic-panel"><span>${tr ? "Senin çağrın" : "Your call"}: ${call}</span></div>
      <div class="rp-comic-panel"><span>${panel3}</span></div>
    </div>
    <p class="rp-share-caption">${prop}${syn ? ` · ${syn}` : ""}</p>
    <button class="rp-btn rp-btn--primary rp-cta-primary" type="button" data-action="share-porch-moment" data-testid="share-porch-moment-cta">${
      tr ? "Verandayı paylaş" : "Share the porch"
    }</button>
  </section>`;
}

export function markFirstShare(save) {
  save.storyFlags = save.storyFlags || {};
  save.storyFlags.first_share_done = true;
  save.storyFlags.first10_choice_done = true;
  return save;
}

export function situationStrip(day, flags = {}, locale = "en") {
  const tr = locale === "tr";
  if (day >= 10 || flags.natural_ledger_street_wins) {
    return tr ? "Defter masada" : "The book’s on the table";
  }
  if (day >= 7 || flags.quest_volume_accepted || flags.natural_volume_street) {
    return tr ? "01:12 — Orhan’ın ışığı" : "01:12 — Orhan’s light";
  }
  if (flags.cold_open_mediate) {
    return tr ? "Leyla’nın ipi — Merve’nin yanında durdun" : "Leyla’s kite — you stood with Merve";
  }
  if (flags.cold_open_instigate) {
    return tr ? "İpi çektin — Cup’ta görünsün" : "You pulled the string — settle it on the Cup";
  }
  if (flags.cold_open_stage) {
    return tr ? "Sahneyi aldın — verandada" : "You took the stage on the porch";
  }
  if (flags.cold_open_mediate || flags.cold_open_instigate || flags.cold_open_stage || day >= 2) {
    return tr ? "Çatıda ip var" : "There’s a line on the roof";
  }
  return tr ? "Kapı çalıyor" : "Someone’s knocking";
}

/** ux-rewrite-2: cold side → Cup primary (never Demliğe git before share) */
export function coldSideCupPrimary(flags = {}, locale = "en") {
  const tr = locale === "tr";
  if (flags.cold_open_mediate) {
    return {
      id: "sa_cup_side",
      action: "goto-cup",
      label: tr ? "Merve'nin yanında dur — verandada hallet" : "Stand with Merve — settle it on the porch",
    };
  }
  if (flags.cold_open_instigate) {
    return {
      id: "sa_cup_side",
      action: "goto-cup",
      label: tr ? "İpi çek — Cup'ta görünsün" : "Pull the string — settle on the Cup",
    };
  }
  if (flags.cold_open_stage) {
    return {
      id: "sa_cup_side",
      action: "goto-cup",
      label: tr ? "Sahneyi al — verandada" : "Take the stage on the porch",
    };
  }
  return null;
}

export function porchJobLabel(n, locale = "en") {
  if (!n) return "";
  const job = n.porchJob;
  if (job && typeof job === "object") return locale === "tr" ? job.tr || job.en || "" : job.en || job.tr || "";
  if (typeof job === "string") return job;
  return "";
}
