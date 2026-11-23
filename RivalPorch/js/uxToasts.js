/** ux-rewrite-3 — affinity toast parks above dock, TTL <1.5s */
const AFFINITY_TTL_MS = 1400;

export function mountAffinityToast(text, root = document.body) {
  if (!text) return;
  document.querySelectorAll("[data-testid='affinity-toast'], .rp-toast--affinity").forEach((n) => n.remove());
  const el = document.createElement("div");
  el.className = "rp-toast rp-toast--affinity";
  el.dataset.testid = "affinity-toast";
  el.setAttribute("data-testid", "affinity-toast");
  el.setAttribute("role", "status");
  el.textContent = text;
  el.style.pointerEvents = "none";
  root.appendChild(el);
  window.clearTimeout(mountAffinityToast._t);
  mountAffinityToast._t = window.setTimeout(() => el.remove(), AFFINITY_TTL_MS);
}
