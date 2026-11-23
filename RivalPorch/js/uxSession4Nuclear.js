/**
 * ux-session-4 NUCLEAR — force Practice flags + live endEnabled paint.
 * Flags live on save.storyFlags (Rival Porch SoT).
 */

export const FLAGS = Object.freeze([
  "practice_cup_done",
  "syn_taught_syn_rivalry",
  "first_evening_practice_cleared",
]);

function flagBag(saveOrState) {
  const save = saveOrState?.save || saveOrState;
  if (!save) return {};
  save.storyFlags = save.storyFlags || {};
  return save.storyFlags;
}

export function readFlag(saveOrState, id) {
  const f = flagBag(saveOrState);
  if (id === "syn_taught_syn_rivalry" && f.syn_taught && !f.syn_taught_syn_rivalry) {
    f.syn_taught_syn_rivalry = true;
  }
  return f[id] === true;
}

/** LIVE Day1 predicate — Day2+ always true when dayIndex > 1 */
export function endEnabled(saveOrState) {
  const save = saveOrState?.save || saveOrState;
  if ((save?.dayIndex ?? 1) > 1) return true;
  return (
    readFlag(saveOrState, "practice_cup_done") &&
    readFlag(saveOrState, "syn_taught_syn_rivalry")
  );
}

/** FORCE both practice flags — idempotent nuclear writer */
export function forcePracticeFlags(saveOrState, reason = "nuclear") {
  const save = saveOrState?.save || saveOrState;
  const f = flagBag(save);
  f.practice_cup_done = true;
  f.syn_taught_syn_rivalry = true;
  f.first_evening_practice_cleared = true;
  f.ux4_nuclear_reason = String(reason || "nuclear");
  f.practice_cup_rivalry_pop_seen = true;
  f.practice_cup_porch_call_done = true;
  if (saveOrState?.ui) {
    saveOrState.ui.endEveningEnabled = true;
    saveOrState.ui.endEveningBlocked = false;
    saveOrState.ui.endEveningBlockedReason = null;
    saveOrState.ui.overnightReachable = true;
  }
  return f;
}

export function paintEndEveningControls(saveOrState, locale = "en") {
  const on = endEnabled(saveOrState);
  const nodes = document.querySelectorAll(
    "#btn-end-evening, [data-testid='end-evening'], [data-end-evening], .rp-end-evening"
  );
  nodes.forEach((el) => {
    if ("disabled" in el) el.disabled = !on;
    el.setAttribute("aria-disabled", String(!on));
    el.dataset.endEnabled = String(on);
    el.classList.toggle("is-enabled", on);
    el.classList.toggle("is-blocked", !on);
  });
  const links = document.querySelectorAll(
    "[data-testid='go-overnight'], [data-overnight-link], .rp-go-overnight"
  );
  links.forEach((el) => {
    el.hidden = !on;
    el.dataset.endEnabled = String(on);
    if ("disabled" in el) el.disabled = !on;
  });
  const hint = document.querySelector("[data-testid='end-evening-hint']");
  if (hint) {
    hint.hidden = on;
    if (!on) {
      hint.textContent =
        locale === "tr"
          ? "Akşam bitmez — Cem Prova'da düdük çalıyor."
          : "Evening won't end — Cem's still whistling Practice.";
    }
  }
  document.documentElement.dataset.endEnabled = String(on);
  document.documentElement.dataset.practiceCupDone = String(
    readFlag(saveOrState, "practice_cup_done")
  );
  document.documentElement.dataset.synTaught = String(
    readFlag(saveOrState, "syn_taught_syn_rivalry")
  );
  return on;
}
