/** visual-rewrite-3/4/5 — spread X, seat doors, mud doorframes */

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
    const topPct = i % 2 === 0 ? 44 : 41;
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
    frame.style.setProperty("background", MUD, "important");
    frame.style.setProperty("background-color", MUD, "important");
    frame.style.setProperty("border-color", MUD, "important");
    frame.style.setProperty("outline-color", MUD, "important");

    const bust = el.querySelector(".rp-hotspot__bust");
    if (bust) {
      bust.style.setProperty("border", `3px solid ${MUD}`, "important");
      bust.style.setProperty("border-color", MUD, "important");
      bust.style.setProperty("outline", `2px solid ${MUD}`, "important");
      bust.style.setProperty("outline-offset", "1px", "important");
      bust.style.setProperty("border-radius", "20px 20px 3px 3px", "important");
      bust.style.setProperty("box-shadow", "none", "important");
      bust.style.setProperty("filter", "none", "important");
    }
  });
}
