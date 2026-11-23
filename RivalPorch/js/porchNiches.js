/** visual-rewrite-3/4/5/6 — spread X, seat doors, mud jambs, readable names */

const MUD = "rgb(90, 67, 50)"; // #5A4332 — auditor acceptance literal

export function spreadPorchNiches(root = document) {
  return seatPorchNiches(root);
}

export function seatPorchNiches(root = document) {
  const street = root.querySelector("#screen-street.rp-screen--street, .rp-screen--street, #screen-street");
  if (!street) return;
  const nodes = [...street.querySelectorAll(".rp-hotspot")];
  if (nodes.length < 4) return;
  const w = street.clientWidth || 390;
  const pad = 8;
  const nicheW = 56;
  const span = Math.max(w - pad * 2 - nicheW, nicheW * 5);
  const step = span / Math.max(nodes.length - 1, 1);
  nodes.slice(0, 6).forEach((el, i) => {
    const left = Math.round(pad + step * i);
    const topPct = i % 2 === 0 ? 46 : 38;
    el.dataset.n = String(i + 1);
    el.classList.add("is-porch-door");
    if (!el.querySelector(".rp-hotspot__door")) {
      const door = document.createElement("span");
      door.className = "rp-hotspot__door";
      door.setAttribute("aria-hidden", "true");
      el.insertBefore(door, el.firstChild);
    }
    el.style.setProperty("left", `${left}px`, "important");
    el.style.setProperty("top", `${topPct}%`, "important");
    el.style.setProperty("transform", "none", "important");
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  });
  street.querySelectorAll(
    ".rp-world-banner, .world-banner, .rp-world-consequence, [data-testid='world-banner'], .rp-street-visual, .street-float.rp-wc-loud"
  ).forEach((n) => n.remove());
  mudPorchDoorframes(root);
  readablePorchNames(root);
}

export function mudPorchDoorframes(root = document) {
  const street = root.querySelector(".rp-screen--street, #screen-street");
  if (!street) return;

  street.querySelectorAll(".rp-hotspot").forEach((el, i) => {
    el.classList.add("is-porch-door");
    el.dataset.n ||= String(i + 1);

    let frame = el.querySelector(".rp-hotspot__doorframe");
    if (!frame) {
      frame = document.createElement("span");
      frame.className = "rp-hotspot__doorframe";
      frame.setAttribute("aria-hidden", "true");
      el.insertBefore(frame, el.firstChild);
    }
    // Hollow jamb — transparent fill, mud border (visual-rewrite-6)
    frame.style.setProperty("background", "transparent", "important");
    frame.style.setProperty("background-color", "transparent", "important");
    frame.style.setProperty("border", `4px solid ${MUD}`, "important");
    frame.style.setProperty("border-color", MUD, "important");
    frame.style.setProperty("box-shadow", `inset 0 0 0 1px ${MUD}`, "important");
    frame.style.setProperty("outline-color", MUD, "important");

    const bust = el.querySelector(".rp-hotspot__bust");
    if (bust) {
      bust.style.setProperty("border", `3px solid ${MUD}`, "important");
      bust.style.setProperty("border-color", MUD, "important");
      bust.style.setProperty("outline", "none", "important");
      bust.style.setProperty("border-radius", "20px 20px 3px 3px", "important");
      bust.style.setProperty("box-shadow", "none", "important");
      bust.style.setProperty("filter", "none", "important");
    }
  });
}

export function readablePorchNames(root = document) {
  const street = root.querySelector(".rp-screen--street, #screen-street");
  if (!street) return;

  street.querySelectorAll(".rp-hotspot").forEach((el, i) => {
    const frame = el.querySelector(".rp-hotspot__doorframe");
    if (frame) {
      frame.style.setProperty("background", "transparent", "important");
      frame.style.setProperty("background-color", "transparent", "important");
      frame.style.setProperty("border", `4px solid ${MUD}`, "important");
      frame.style.setProperty("border-color", MUD, "important");
      frame.style.setProperty("box-shadow", `inset 0 0 0 1px ${MUD}`, "important");
    }

    el.querySelectorAll(
      ".rp-hotspot__caption, .rp-hotspot__sub, .rp-hotspot__meta, .rp-hotspot__tag"
    ).forEach((n) => n.remove());

    const name = el.querySelector(".rp-hotspot__name");
    if (!name) return;
    name.style.setProperty("font-size", "11px", "important");
    name.style.setProperty("line-height", "1.15", "important");
    name.style.setProperty("font-weight", "700", "important");
    name.style.setProperty("color", "#f2e6d8", "important");
    name.style.setProperty("background", "rgba(26, 22, 18, 0.82)", "important");
    name.style.setProperty("border", `1px solid ${MUD}`, "important");
    name.style.setProperty("padding", "3px 5px", "important");
    name.style.setProperty("max-width", "64px", "important");
    name.style.setProperty("min-height", "28px", "important");
    name.style.setProperty("white-space", "normal", "important");
    name.style.setProperty("overflow", "visible", "important");
    name.style.setProperty("text-overflow", "clip", "important");
    name.style.setProperty("text-align", "center", "important");
    name.style.setProperty("border-radius", "3px", "important");

    const topPct = i % 2 === 0 ? 46 : 38;
    el.style.setProperty("top", `${topPct}%`, "important");
  });
}
