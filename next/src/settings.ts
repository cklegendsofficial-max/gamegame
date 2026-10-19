const KEY = "kk_settings";

export interface Settings {
  music: number;
  fx: number;
  ui: number;
  eco: boolean;
  mini: boolean;
  haptic: boolean;
  lang: "tr" | "en";
  speed: 1 | 2 | 3;
  narrate: boolean;
  dynMusic: boolean;
  cine: boolean;
  /** 3D campaign harita (Three.js). Zayıf cihaz / pil tasarrufunda otomatik 2D’ye düşer; değişiklikte sayfa yenilenir. */
  world3d: boolean;
  duel: boolean;
  tips: boolean;
  spoils: boolean;
  /** Kolay savaşları da tek dokunuşta otomatik çöz (kapalıysa küçük çeteler hariç taktik seçersin). */
  quick: boolean;
  pages: boolean;
  fires: boolean;
  cb: boolean;
  /** Sakin mod: sarsıntı ve hızlı animasyonlar kapalı (varsayılan: işletim sistemi tercihi). */
  calm: boolean;
  /** Destan HUD: ekranda sadece ana görev kalır, mini harita ve notlar gizlenir. Dokunmatik cihazlarda varsayılan açık. */
  story: boolean;
  /** Dokunmatik dokunuş hedefi: düğmeler büyür (arayüz ölçeği en az %110). */
  bigUi: boolean;
  /** Yüksek kontrast: metin ve kenarlıklar daha keskin. */
  hiContrast: boolean;
  /** Görüntü kalitesi: low = pil, mid = gölge küçük, high = tam. eco ile eşlenir. */
  gfx: "low" | "mid" | "high";
}

function weakDeviceProbe(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  const touch = matchMedia("(pointer: coarse)").matches;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const lowCpu = (nav.hardwareConcurrency ?? 8) <= 4;
  return (touch && (lowMem || lowCpu)) || (lowMem && lowCpu);
}

export function weakDevice(): boolean {
  return weakDeviceProbe();
}

const DEF: Settings = {
  cb: false,
  calm: typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  music: 0.5,
  fx: 0.7,
  ui: 1,
  eco: false,
  mini: true,
  haptic: true,
  lang: "tr",
  speed: 1,
  narrate: false,
  dynMusic: true,
  cine: true,
  // Varsayılan 3D açık; zayıf dokunmatikte kullanıcı Ayarlar’dan kapatabilir
  world3d: true,
  duel: !navigator.webdriver,
  tips: !navigator.webdriver,
  spoils: !navigator.webdriver,
  quick: false,
  pages: !navigator.webdriver,
  fires: !navigator.webdriver,
  story: matchMedia("(pointer: coarse)").matches,
  bigUi: false,
  hiContrast: typeof matchMedia === "function" && matchMedia("(prefers-contrast: more)").matches,
  gfx: weakDeviceProbe() ? "low" : "high",
};

const WORLD3D_MIG = "kk_world3d_mig";

function read(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEF, eco: weakDevice(), gfx: weakDevice() ? "low" : "high", world3d: true };
    const parsed = { ...DEF, ...(JSON.parse(raw) as Partial<Settings>) };
    if (!parsed.gfx) parsed.gfx = parsed.eco ? "low" : "high";
    // Eski kayıtlarda world3d kapalı kalmış olabilir — bir kez zorla aç (kullanıcı sonra kapatabilir)
    const mig = Number(localStorage.getItem(WORLD3D_MIG) || 0);
    if (mig < 4) {
      parsed.world3d = true;
      try {
        localStorage.setItem(WORLD3D_MIG, "4");
      } catch {
        /* ignore */
      }
    }
    // 3D + Düşük kalite birlikte kalırsa GLB/harita 2D’ye düşmesin diye en az orta
    if (parsed.world3d && parsed.gfx === "low") parsed.gfx = "mid";
    parsed.eco = parsed.gfx === "low";
    return parsed;
  } catch {
    return { ...DEF, world3d: true };
  }
}

export const settings: Settings = read();

export function saveSettings(): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

export function setGfx(g: Settings["gfx"]): void {
  settings.gfx = g;
  settings.eco = g === "low";
  saveSettings();
}

/** Sürekli düşük FPS’te kaliteyi bir basamak düşürür; kullanıcı high’a geri alabilir. */
export function watchFps(sampleMs = 1000): (frameDt: number) => void {
  let acc = 0;
  let frames = 0;
  let lowSec = 0;
  let cooled = 0;
  return (frameDt: number) => {
    if (settings.gfx === "low" || cooled > 0) {
      cooled = Math.max(0, cooled - frameDt);
      return;
    }
    acc += frameDt;
    frames++;
    if (acc < sampleMs / 1000) return;
    const fps = frames / acc;
    acc = 0;
    frames = 0;
    if (fps < 28) lowSec++;
    else lowSec = Math.max(0, lowSec - 1);
    if (lowSec < 6) return;
    lowSec = 0;
    cooled = 45;
    // 3D açıkken low'a düşme — eco=true eski kodda 3D'yi tamamen kapatıyordu;
    // mid'de gölge küçülür ama GLB modelleri çalışır.
    const next: Settings["gfx"] = settings.gfx === "high" ? "mid" : settings.world3d ? "mid" : "low";
    if (next === settings.gfx) return;
    setGfx(next);
    document.body.dispatchEvent(new CustomEvent("kk-gfx", { detail: next }));
  };
}

export function haptic(ms: number | number[]): void {
  if (settings.haptic) navigator.vibrate?.(ms);
}

export function toggleFullscreen(): void {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

let a11yOn = false;

/** Yalnızca simgeli düğmelere erişilebilir ad verir (title / sınıf adından). */
export function initA11y(): void {
  if (a11yOn || typeof MutationObserver === "undefined") return;
  a11yOn = true;
  const fix = (b: Element): void => {
    if (b.hasAttribute("aria-label") || (b.textContent ?? "").replace(/[✕×▸▾\s]/g, "").length) return;
    const lab = b.getAttribute("title") || (b.classList.contains("x") ? "Kapat" : "");
    if (lab) b.setAttribute("aria-label", lab);
  };
  const scan = (n: ParentNode): void => n.querySelectorAll("button").forEach(fix);
  new MutationObserver((ms) => {
    for (const m of ms)
      m.addedNodes.forEach((n) => {
        if (n.nodeType !== 1) return;
        const e = n as Element;
        if (e.tagName === "BUTTON") fix(e);
        scan(e);
      });
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
}

export function applyUi(): void {
  document.documentElement.style.setProperty("--ui", String(settings.bigUi ? Math.max(1.1, settings.ui) : settings.ui));
  document.body.classList.toggle("nomini", !settings.mini);
  document.body.classList.toggle("cb", settings.cb);
  document.body.classList.toggle("calm", settings.calm);
  document.body.classList.toggle("storymode", settings.story);
  document.body.classList.toggle("bigui", settings.bigUi);
  document.body.classList.toggle("hicontrast", settings.hiContrast);
}
