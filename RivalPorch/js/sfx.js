/** Rival Porch SFX — WAV buffers with WebAudio synth fallback (see docs/rival-porch-sfx-map.md). */

const SFX_MASTER = 0.9;
const PATHS = {
  knock: "assets/sfx/knock.wav",
  teapot_clink: "assets/sfx/teapot-clink.wav",
  crowd_murmur: "assets/sfx/crowd-murmur.wav",
  win_sting: "assets/sfx/win-sting.wav",
  ui_tap: "assets/sfx/ui-tap.wav",
};

const GAINS = {
  knock: 0.85,
  teapot_clink: 0.65,
  crowd_murmur: 0.25,
  win_sting: 0.8,
  ui_tap: 0.45,
};

let ctx = null;
const buffers = Object.create(null);
let unlocked = false;
let lastUiTap = 0;
let crowdStop = null;
let muted = false;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  unlocked = true;
}

async function loadBuffer(key) {
  if (buffers[key]) return buffers[key];
  const c = ensureCtx();
  if (!c) return null;
  try {
    const res = await fetch(PATHS[key]);
    if (!res.ok) return null;
    const raw = await res.arrayBuffer();
    buffers[key] = await c.decodeAudioData(raw.slice(0));
    return buffers[key];
  } catch {
    return null;
  }
}

export async function preloadSfx() {
  ensureCtx();
  await Promise.all(Object.keys(PATHS).map((k) => loadBuffer(k)));
}

function playBuffer(buf, gain) {
  const c = ensureCtx();
  if (!c || !buf || muted) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.value = gain * SFX_MASTER;
  src.connect(g);
  g.connect(c.destination);
  src.start();
  return src;
}

function synthKnock(gain = GAINS.knock) {
  const c = ensureCtx();
  if (!c || muted) return;
  const now = c.currentTime;
  for (const [t0, amp] of [
    [0, 1],
    [0.23, 0.85],
  ]) {
    const dur = 0.12;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / c.sampleRate;
      d[i] =
        (Math.random() * 2 - 1) * Math.exp(-t * 55) * 0.55 +
        Math.sin(2 * Math.PI * 95 * t) * Math.exp(-t * 28) * 0.7;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain * amp * SFX_MASTER;
    src.connect(g);
    g.connect(c.destination);
    src.start(now + t0);
  }
}

function synthTeapot(gain = GAINS.teapot_clink) {
  const c = ensureCtx();
  if (!c || muted) return;
  const now = c.currentTime;
  const master = c.createGain();
  master.gain.setValueAtTime(gain * SFX_MASTER, now);
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  master.connect(c.destination);
  for (const [f, a] of [
    [2450, 0.55],
    [3720, 0.28],
    [5100, 0.18],
    [1280, 0.08],
  ]) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = a;
    o.connect(g);
    g.connect(master);
    o.start(now);
    o.stop(now + 0.75);
  }
}

function synthWin(gain = GAINS.win_sting) {
  const c = ensureCtx();
  if (!c || muted) return;
  const now = c.currentTime;
  const notes = [
    [0, 523.25],
    [0.12, 659.25],
    [0.24, 783.99],
    [0.4, 1046.5],
  ];
  for (const [dt, f] of notes) {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now + dt);
    g.gain.exponentialRampToValueAtTime(gain * SFX_MASTER * 0.35, now + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dt + 0.55);
    o.connect(g);
    g.connect(c.destination);
    o.start(now + dt);
    o.stop(now + dt + 0.6);
  }
}

function synthUiTap(gain = GAINS.ui_tap) {
  const c = ensureCtx();
  if (!c || muted) return;
  const now = c.currentTime;
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.value = 1800;
  const g = c.createGain();
  g.gain.setValueAtTime(gain * SFX_MASTER, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  o.connect(g);
  g.connect(c.destination);
  o.start(now);
  o.stop(now + 0.07);
}

function synthCrowdStart(gain = GAINS.crowd_murmur) {
  const c = ensureCtx();
  if (!c || muted) return () => {};
  const bufferSize = 2 * c.sampleRate;
  const buf = c.createBuffer(1, bufferSize, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.7;
  const g = c.createGain();
  g.gain.value = gain * SFX_MASTER;
  src.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  src.start();
  return () => {
    try {
      src.stop();
    } catch {
      /* already stopped */
    }
  };
}

async function playOneShot(key, synthFn) {
  if (muted) return;
  unlockAudio();
  const buf = await loadBuffer(key);
  if (buf) playBuffer(buf, GAINS[key]);
  else synthFn(GAINS[key]);
}

export function playKnock() {
  return playOneShot("knock", synthKnock);
}

export function playTeapotClink() {
  return playOneShot("teapot_clink", synthTeapot);
}

export function playWinSting() {
  return playOneShot("win_sting", synthWin);
}

export function playUiTap() {
  if (muted) return;
  const now = performance.now();
  if (now - lastUiTap < 80) return; // ~12/s cap
  lastUiTap = now;
  unlockAudio();
  const buf = buffers.ui_tap;
  if (buf) playBuffer(buf, GAINS.ui_tap);
  else {
    loadBuffer("ui_tap").then((b) => {
      if (b) playBuffer(b, GAINS.ui_tap);
      else synthUiTap();
    });
  }
}

export function startCrowdMurmur() {
  if (muted) return;
  unlockAudio();
  stopCrowdMurmur();
  loadBuffer("crowd_murmur").then((buf) => {
    if (buf) {
      const c = ensureCtx();
      if (!c) return;
      const src = c.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = c.createGain();
      g.gain.value = GAINS.crowd_murmur * SFX_MASTER;
      src.connect(g);
      g.connect(c.destination);
      src.start();
      crowdStop = () => {
        try {
          src.stop();
        } catch {
          /* */
        }
      };
    } else {
      crowdStop = synthCrowdStart();
    }
  });
}

export function stopCrowdMurmur() {
  if (typeof crowdStop === "function") {
    crowdStop();
    crowdStop = null;
  }
}

export function setSfxMuted(v) {
  muted = !!v;
  if (muted) stopCrowdMurmur();
}

export function isSfxUnlocked() {
  return unlocked;
}
