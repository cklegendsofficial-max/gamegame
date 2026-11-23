/** visual-rewrite-3 — force distinct X across 6 porch niches */
export function spreadPorchNiches(root = document) {
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
    const topPct = i % 2 === 0 ? 39 : 36;
    el.dataset.n = String(i + 1);
    el.style.setProperty("left", `${left}px`, "important");
    el.style.setProperty("top", `${topPct}%`, "important");
    el.style.setProperty("transform", "none", "important");
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
  });
}
