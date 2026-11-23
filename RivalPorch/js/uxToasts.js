/** ux-rewrite-5 — affinity toast clear of lamp; TTL <1.2s */
const AFFINITY_TTL_MS = 1100;

function intersects(a, b) {
  if (!a || !b) return false;
  const r = a.getBoundingClientRect();
  const s = b.getBoundingClientRect();
  return !(r.bottom <= s.top || r.top >= s.bottom || r.right <= s.left || r.left >= s.right);
}

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

  requestAnimationFrame(() => {
    const lamp =
      document.querySelector("[data-testid='evening-primary']") ||
      document.querySelector("[data-testid='street-primary']") ||
      document.querySelector(".rp-cta-lamp");
    const dock = document.querySelector(".rp-dock");
    if (intersects(el, lamp) || intersects(el, dock)) {
      el.style.bottom = "auto";
      el.style.top = "72px";
    }
  });

  window.clearTimeout(mountAffinityToast._t);
  mountAffinityToast._t = window.setTimeout(() => el.remove(), AFFINITY_TTL_MS);
}
