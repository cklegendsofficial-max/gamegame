/** ux-session-3 — authoritative End evening gate (pure derive). */
export const END_EVENING_FLAGS = Object.freeze([
  "practice_cup_done",
  "syn_taught_syn_rivalry",
]);

/** Normalize alias syn_taught → syn_taught_syn_rivalry once. */
export function normalizePracticeFlags(save) {
  const flags = (save.storyFlags = save.storyFlags || {});
  if (flags.syn_taught && !flags.syn_taught_syn_rivalry) {
    flags.syn_taught_syn_rivalry = true;
  }
  return flags;
}

export function readFlag(stateOrSave, id) {
  const bags = [
    stateOrSave?.flags,
    stateOrSave?.save?.storyFlags,
    stateOrSave?.save?.flags,
    stateOrSave?.storyFlags,
    stateOrSave?.player?.flags,
    stateOrSave?.meta?.flags,
  ];
  for (const b of bags) {
    if (b && b[id] === true) return true;
  }
  return false;
}

/** ONLY predicate allowed for End evening / overnight link on Day1. Day2+ always. */
export function endEnabled(stateOrSave) {
  const save = stateOrSave?.save || stateOrSave;
  const day = save?.dayIndex ?? 1;
  if (day > 1) return true;
  normalizePracticeFlags(save);
  return (
    readFlag(stateOrSave, "practice_cup_done") &&
    readFlag(stateOrSave, "syn_taught_syn_rivalry")
  );
}

export function endEveningViewModel(stateOrSave, locale = "en") {
  const on = endEnabled(stateOrSave);
  const save = stateOrSave?.save || stateOrSave;
  const day = save?.dayIndex ?? 1;
  return {
    endEnabled: on,
    endEveningBlocked: !on,
    overnightReachable: on || day > 1,
    blockedReason: on
      ? null
      : {
          tr: "Akşam bitmez — Cem Prova'da düdük çalıyor.",
          en: "Evening won't end — Cem's still whistling Practice.",
        },
    blockedCopy: on
      ? ""
      : locale === "tr"
        ? "Akşam bitmez — Cem Prova'da düdük çalıyor."
        : "Evening won't end — Cem's still whistling Practice.",
  };
}

/**
 * Atomic clear — sole writer for Practice→evening unlock.
 * Writes BOTH required flags. Idempotent.
 */
export function markPracticeCleared(save, reason = "fight_finish") {
  const flags = normalizePracticeFlags(save);
  flags.practice_cup_done = true;
  flags.syn_taught_syn_rivalry = true;
  flags.first_evening_practice_cleared = true;
  flags.practice_cleared_reason = String(reason || "fight_finish");
  // Optional companions — never required by endEnabled
  flags.practice_cup_rivalry_pop_seen = true;
  flags.practice_cup_porch_call_done = true;
  if (reason === "audit_settle" || reason === "show_me_settle") {
    flags.practice_soft_settled = true;
  }
  return flags;
}
