import { Rectangle, Texture } from "pixi.js";

/**
 * Harita için procedural isometric “mini-3D” prop’lar.
 * Foto-sticker / yeşil ada tabanı yok; sadece hacim + yumuşak zemin gölgesi.
 */

type Ctx = CanvasRenderingContext2D;

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/** Çok yumuşak temas gölgesi — koyu uçan disk değil. */
function shadow(g: Ctx, x: number, y: number, rx: number, ry: number, a = 0.22): void {
  const grd = g.createRadialGradient(x, y, 0, x, y, rx);
  grd.addColorStop(0, `rgba(40,24,8,${a})`);
  grd.addColorStop(0.5, `rgba(40,24,8,${a * 0.35})`);
  grd.addColorStop(1, "rgba(40,24,8,0)");
  g.fillStyle = grd;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

/** Keçe yurt: lit/dark yarım + kuşak + kapı + tündük. */
function yurt(g: Ctx, x: number, y: number, r: number, felt = "#e8e0d0", trim = "#5a4030"): void {
  shadow(g, x + r * 0.08, y + r * 0.58, r * 0.95, r * 0.28, 0.2);
  // gövde elips
  const body = g.createLinearGradient(x - r, y, x + r, y);
  body.addColorStop(0, shade(felt, -0.28));
  body.addColorStop(0.35, shade(felt, 0.12));
  body.addColorStop(0.55, felt);
  body.addColorStop(1, shade(felt, -0.38));
  g.fillStyle = body;
  g.beginPath();
  g.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
  g.fill();
  // kubbe
  const dome = g.createRadialGradient(x - r * 0.25, y - r * 0.55, r * 0.1, x, y - r * 0.15, r * 0.95);
  dome.addColorStop(0, shade(felt, 0.2));
  dome.addColorStop(0.55, felt);
  dome.addColorStop(1, shade(felt, -0.35));
  g.fillStyle = dome;
  g.beginPath();
  g.ellipse(x, y - r * 0.28, r * 0.92, r * 0.55, 0, Math.PI, 0);
  g.fill();
  // kuşaklar + keçe şeritleri
  g.strokeStyle = shade(trim, 0.15);
  g.lineWidth = Math.max(1.2, r * 0.06);
  g.beginPath();
  g.ellipse(x, y - r * 0.02, r * 0.93, r * 0.58, 0, 0.15, Math.PI - 0.15);
  g.stroke();
  g.beginPath();
  g.ellipse(x, y + r * 0.22, r * 0.88, r * 0.42, 0, 0.2, Math.PI - 0.2);
  g.stroke();
  g.lineWidth = Math.max(0.8, r * 0.028);
  for (let band = -3; band <= 3; band++) {
    const by = y - r * 0.38 + band * r * 0.11;
    g.strokeStyle = band % 2 === 0 ? shade(felt, -0.12) : shade(felt, 0.08);
    g.beginPath();
    g.ellipse(x, by, r * (0.86 - Math.abs(band) * 0.04), r * (0.48 - Math.abs(band) * 0.05), 0, 0.08, Math.PI - 0.08);
    g.stroke();
  }
  g.strokeStyle = shade(trim, -0.08);
  g.lineWidth = Math.max(0.7, r * 0.022);
  for (let s = 0; s < 5; s++) {
    const a0 = Math.PI * 0.22 + (s / 4) * Math.PI * 0.56;
    g.beginPath();
    g.arc(x, y - r * 0.32, r * 0.78, a0, a0 + 0.08);
    g.stroke();
  }
  // kapı
  const dw = r * 0.28, dh = r * 0.42;
  g.fillStyle = shade(trim, -0.25);
  g.fillRect(x - dw / 2, y + r * 0.08, dw, dh);
  g.fillStyle = shade("#3a2818", 0.1);
  g.fillRect(x - dw / 2 + 1.5, y + r * 0.08 + 1.5, dw - 3, dh - 3);
  // tündük
  g.fillStyle = shade("#8a6a3a", -0.1);
  g.beginPath();
  g.ellipse(x, y - r * 0.78, r * 0.18, r * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = shade("#c8a050", 0.15);
  g.beginPath();
  g.ellipse(x - 1, y - r * 0.8, r * 0.1, r * 0.05, 0, 0, Math.PI * 2);
  g.fill();
}

function yurtCamp(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = 144;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const felt = ["#ebe4d4", "#e2d8c4", "#f0e8d8", "#d8d0c0"][Math.floor(rnd() * 4)];
  const trim = ["#5a4030", "#4a3020", "#6a4830"][Math.floor(rnd() * 3)];
  // soft kum halkası — sert dairesel sticker kenarı yok, kuma karışır
  const sand = g.createRadialGradient(96, 110, 8, 96, 110, 88);
  sand.addColorStop(0, "rgba(180,140,85,0.38)");
  sand.addColorStop(0.45, "rgba(170,130,75,0.16)");
  sand.addColorStop(1, "rgba(170,130,75,0)");
  g.fillStyle = sand;
  g.beginPath();
  g.ellipse(96, 112, 86, 28, 0, 0, Math.PI * 2);
  g.fill();
  yurt(g, 96, 58, 38 + rnd() * 4, felt, trim);
  yurt(g, 48, 78, 26 + rnd() * 3, shade(felt, -0.05), trim);
  yurt(g, 142, 74, 24 + rnd() * 3, shade(felt, 0.05), trim);
  if (rnd() > 0.25) yurt(g, 100, 92, 20, shade(felt, -0.08), trim);
  if (rnd() > 0.5) yurt(g, 30, 68, 18, shade(felt, 0.04), trim);
  // keçe çit / kazık halkası
  g.strokeStyle = "rgba(90,60,35,0.42)";
  g.lineWidth = 2.2;
  g.beginPath();
  g.ellipse(96, 108, 74, 20, 0, 0.2, Math.PI * 1.8);
  g.stroke();
  for (let i = 0; i < 5; i++) {
    const a = 0.4 + i * 0.45;
    const px = 96 + Math.cos(a) * 70;
    const py = 108 + Math.sin(a) * 18;
    g.fillStyle = "#5a4030";
    g.fillRect(px - 1, py - 8, 2.5, 10);
  }
  const fx = 68 + rnd() * 8;
  const fy = 108;
  const ember = g.createRadialGradient(fx, fy, 0, fx, fy, 22);
  ember.addColorStop(0, "rgba(255,200,90,0.55)");
  ember.addColorStop(0.45, "rgba(255,110,40,0.28)");
  ember.addColorStop(1, "rgba(255,60,20,0)");
  g.fillStyle = ember;
  g.beginPath();
  g.ellipse(fx, fy, 20, 10, 0, 0, Math.PI * 2);
  g.fill();
  const flame = g.createRadialGradient(fx, fy - 4, 1, fx, fy - 2, 10);
  flame.addColorStop(0, "rgba(255,230,120,0.9)");
  flame.addColorStop(0.55, "rgba(255,120,35,0.65)");
  flame.addColorStop(1, "rgba(255,50,10,0)");
  g.fillStyle = flame;
  g.beginPath();
  g.arc(fx, fy - 5, 9, 0, Math.PI * 2);
  g.fill();
  if (rnd() > 0.4) {
    g.fillStyle = "rgba(180,180,180,0.35)";
    g.beginPath();
    g.ellipse(96 + rnd() * 6, 18, 6 + rnd() * 4, 10, 0.2, 0, Math.PI * 2);
    g.fill();
  }
  // alt soft fade → harita kumuna karışır
  g.globalCompositeOperation = "destination-out";
  const cut = g.createLinearGradient(0, 118, 0, 144);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(0.55, "rgba(0,0,0,0.25)");
  cut.addColorStop(1, "rgba(0,0,0,0.85)");
  g.fillStyle = cut;
  g.fillRect(0, 118, 192, 26);
  g.globalCompositeOperation = "source-over";
  return c;
}

/** Köy evi: kerpiç gövde + eğik çatı + kapı/pencere — yurtla aynı oturuş mantığı (soft kum, sert sticker kenarı yok). */
function house(g: Ctx, x: number, y: number, w: number, roof: string, wall: string): void {
  shadow(g, x + w * 0.08, y + w * 0.3, w * 0.6, w * 0.18, 0.22);
  const wallGrad = g.createLinearGradient(x - w * 0.42, y, x + w * 0.42, y);
  wallGrad.addColorStop(0, shade(wall, -0.24));
  wallGrad.addColorStop(0.45, wall);
  wallGrad.addColorStop(1, shade(wall, -0.32));
  g.fillStyle = wallGrad;
  g.beginPath();
  g.moveTo(x - w * 0.42, y + w * 0.3);
  g.lineTo(x - w * 0.42, y - w * 0.04);
  g.lineTo(x + w * 0.42, y - w * 0.04);
  g.lineTo(x + w * 0.42, y + w * 0.3);
  g.closePath();
  g.fill();
  // çatı: iki yüzlü eğik çatı, gün ışığı bir yandan
  const roofLit = shade(roof, 0.14);
  const roofDark = shade(roof, -0.32);
  g.fillStyle = roofDark;
  g.beginPath();
  g.moveTo(x, y - w * 0.5);
  g.lineTo(x + w * 0.55, y - w * 0.02);
  g.lineTo(x + w * 0.38, y - w * 0.02);
  g.lineTo(x, y - w * 0.36);
  g.closePath();
  g.fill();
  g.fillStyle = roofLit;
  g.beginPath();
  g.moveTo(x, y - w * 0.5);
  g.lineTo(x - w * 0.55, y - w * 0.02);
  g.lineTo(x - w * 0.38, y - w * 0.02);
  g.lineTo(x, y - w * 0.36);
  g.closePath();
  g.fill();
  g.strokeStyle = shade(roof, -0.45);
  g.lineWidth = Math.max(0.8, w * 0.016);
  for (let k = 1; k <= 2; k++) {
    g.beginPath();
    g.moveTo(x - w * 0.44 * (k / 2.4), y - w * 0.03 - (w * 0.5 - w * 0.03) * (k / 2.4));
    g.lineTo(x - w * 0.3 * (k / 2.4), y - w * 0.03);
    g.stroke();
  }
  // kapı
  const dw = w * 0.14, dh = w * 0.2;
  g.fillStyle = shade("#3a2818", 0.05);
  g.fillRect(x - dw / 2, y + w * 0.3 - dh, dw, dh);
  // pencere — ılık ışık
  g.fillStyle = "rgba(255,205,110,0.55)";
  g.fillRect(x + w * 0.12, y + w * 0.02, w * 0.1, w * 0.1);
  g.strokeStyle = shade(wall, -0.4);
  g.lineWidth = 0.8;
  g.strokeRect(x + w * 0.12, y + w * 0.02, w * 0.1, w * 0.1);
}

/** Küçük köy: bölge stiline göre kerpiç / taş / ahşap / yeşil ova — soft fade, sticker kenarı yok. */
function villageSoft(seed: number, style = 0): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 192;
  c.height = 144;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const palettes = [
    { wall: ["#d8c8a0", "#e0d2ac", "#cabb94"], roof: ["#8a3a28", "#7a3220", "#9a4a2e"], ground: [180, 140, 85] },
    { wall: ["#b8b0a0", "#c4bcac", "#a8a090"], roof: ["#5a5048", "#6a5a50", "#4a4038"], ground: [150, 140, 120] },
    { wall: ["#8a6a40", "#9a7a4a", "#7a5a38"], roof: ["#6a5030", "#5a4828", "#7a5c34"], ground: [140, 120, 70] },
    { wall: ["#e0d4b8", "#d4c8a8", "#ebe0c4"], roof: ["#6a4a28", "#8a5a30", "#5a3a20"], ground: [120, 150, 80] },
  ];
  const pal = palettes[style % 4];
  const wall = pal.wall[Math.floor(rnd() * pal.wall.length)];
  const roof = pal.roof[Math.floor(rnd() * pal.roof.length)];
  const [gr, gg, gb] = pal.ground;
  const sand = g.createRadialGradient(96, 112, 8, 96, 112, 88);
  sand.addColorStop(0, `rgba(${gr},${gg},${gb},0.4)`);
  sand.addColorStop(0.45, `rgba(${gr},${gg},${gb},0.16)`);
  sand.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
  g.fillStyle = sand;
  g.beginPath();
  g.ellipse(96, 112, 86, 28, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = `rgba(${Math.max(40, gr - 60)},${Math.max(40, gg - 50)},${Math.max(20, gb - 35)},0.35)`;
  g.lineWidth = 7;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(20, 118);
  g.quadraticCurveTo(96, 108, 172, 116);
  g.stroke();
  house(g, 96, 58, 70 + rnd() * 8, roof, wall);
  house(g, 46, 80, 48 + rnd() * 6, shade(roof, -0.08), shade(wall, -0.04));
  house(g, 142, 76, 46 + rnd() * 6, shade(roof, 0.06), shade(wall, 0.05));
  if (rnd() > 0.22) house(g, 100, 94, 38, shade(roof, -0.12), shade(wall, -0.08));
  if (rnd() > 0.55) house(g, 28, 70, 34, shade(roof, 0.04), shade(wall, -0.06));
  // saman yığını — köy silüetine hacim
  g.fillStyle = "rgba(190,150,70,0.72)";
  g.beginPath();
  g.ellipse(158, 108, 14, 7, -0.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(160,120,50,0.55)";
  g.beginPath();
  g.ellipse(158, 104, 10, 8, 0, 0, Math.PI * 2);
  g.fill();
  // duman — yerleşim canlılığı
  g.fillStyle = "rgba(200,198,190,0.28)";
  g.beginPath();
  g.ellipse(96 + rnd() * 8, 22, 8 + rnd() * 5, 14, 0.15, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "rgba(190,188,180,0.18)";
  g.beginPath();
  g.ellipse(102, 10, 6, 10, -0.1, 0, Math.PI * 2);
  g.fill();
  // kuyu
  g.fillStyle = "#6a5a48";
  g.beginPath();
  g.ellipse(78, 102, 7, 4, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3a4a58";
  g.beginPath();
  g.ellipse(78, 101, 4.5, 2.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#5a4030";
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(72, 100);
  g.lineTo(72, 90);
  g.lineTo(84, 90);
  g.lineTo(84, 100);
  g.stroke();
  // çevre çiti — sticker değil, yumuşak halka
  g.strokeStyle = `rgba(${Math.max(40, gr - 70)},${Math.max(35, gg - 55)},${Math.max(20, gb - 40)},0.4)`;
  g.lineWidth = 2.5;
  g.lineCap = "round";
  g.beginPath();
  g.ellipse(96, 108, 78, 22, 0, 0.15, Math.PI * 1.85);
  g.stroke();
  // stil detayları
  if (style === 1) {
    // taş duvar / çit
    g.strokeStyle = "rgba(80,70,60,0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(28, 108);
    g.lineTo(60, 104);
    g.lineTo(60, 96);
    g.stroke();
  } else if (style === 2) {
    // ahşap direk + çit
    g.fillStyle = "#5a4030";
    g.fillRect(160, 88, 3, 22);
    g.fillRect(168, 90, 3, 20);
    g.strokeStyle = "rgba(90,60,30,0.5)";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(160, 96);
    g.lineTo(171, 96);
    g.moveTo(160, 102);
    g.lineTo(171, 102);
    g.stroke();
  } else if (style === 3) {
    // yeşil ova: çit + daha fazla ağaç
    g.strokeStyle = "rgba(70,90,40,0.45)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(24, 110);
    g.lineTo(55, 106);
    g.lineTo(55, 98);
    g.lineTo(24, 102);
    g.closePath();
    g.stroke();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = `rgba(${50 + i * 20},${110 + i * 15},40,0.65)`;
      g.beginPath();
      g.ellipse(150 + i * 10, 96 + (i % 2) * 6, 8 + i, 14, 0, 0, Math.PI * 2);
      g.fill();
    }
  } else if (rnd() > 0.45) {
    g.fillStyle = "rgba(90,130,60,0.55)";
    g.beginPath();
    g.ellipse(154 + rnd() * 6, 100, 9, 13, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = "destination-out";
  const cut = g.createLinearGradient(0, 118, 0, 144);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(0.55, "rgba(0,0,0,0.25)");
  cut.addColorStop(1, "rgba(0,0,0,0.85)");
  g.fillStyle = cut;
  g.fillRect(0, 118, 192, 26);
  g.globalCompositeOperation = "source-over";
  return c;
}

/** Hurma ağacı: gövde halkaları + yelpaze yapraklar + gölge. */
function palm(g: Ctx, x: number, y: number, h: number, lean = 0): void {
  shadow(g, x + lean * 0.4 + 4, y + 4, h * 0.28, h * 0.09, 0.3);
  const top = y - h;
  // gövde
  g.lineCap = "round";
  const trunk = g.createLinearGradient(x - 6, 0, x + 8, 0);
  trunk.addColorStop(0, "#4a3020");
  trunk.addColorStop(0.4, "#8a6240");
  trunk.addColorStop(1, "#3a2414");
  g.strokeStyle = trunk;
  g.lineWidth = h * 0.09;
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + lean * 0.6, y - h * 0.45, x + lean, top);
  g.stroke();
  // halkalar
  g.strokeStyle = "rgba(40,24,12,0.45)";
  g.lineWidth = 1.2;
  for (let k = 0.12; k < 0.92; k += 0.1) {
    const py = y - h * k;
    const px = x + lean * k;
    g.beginPath();
    g.moveTo(px - h * 0.04, py);
    g.lineTo(px + h * 0.045, py + 1);
    g.stroke();
  }
  // yapraklar
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * 0.85 + (i / (n - 1)) * Math.PI * 1.5 + lean * 0.01;
    const len = h * (0.42 + (i % 3) * 0.06);
    const lit = i < n * 0.45;
    g.strokeStyle = lit ? "#5a9a3a" : "#2a5a28";
    g.fillStyle = lit ? "rgba(90,160,60,0.85)" : "rgba(36,90,40,0.8)";
    g.lineWidth = 2.2;
    const ex = x + lean + Math.cos(a) * len;
    const ey = top + Math.sin(a) * len * 0.55 + 4;
    g.beginPath();
    g.moveTo(x + lean, top + 2);
    g.quadraticCurveTo(x + lean + Math.cos(a) * len * 0.5, top + Math.sin(a) * len * 0.2 - 6, ex, ey);
    g.stroke();
    // yaprak eni
    g.beginPath();
    g.moveTo(x + lean, top + 2);
    g.quadraticCurveTo(
      x + lean + Math.cos(a) * len * 0.45 + Math.cos(a + 1.2) * 5,
      top + Math.sin(a) * len * 0.15 - 4,
      ex,
      ey,
    );
    g.quadraticCurveTo(
      x + lean + Math.cos(a) * len * 0.45 + Math.cos(a - 1.2) * 5,
      top + Math.sin(a) * len * 0.15,
      x + lean,
      top + 2,
    );
    g.fill();
  }
  // taç merkezi
  g.fillStyle = "#6a3a28";
  g.beginPath();
  g.arc(x + lean, top + 2, h * 0.06, 0, Math.PI * 2);
  g.fill();
  // hurma salkımı
  g.fillStyle = "#8a3a2a";
  for (let k = 0; k < 5; k++) {
    g.beginPath();
    g.arc(x + lean + (k - 2) * 3.2, top + h * 0.12 + (k % 2) * 3, 2.4, 0, Math.PI * 2);
    g.fill();
  }
}

function palmTree(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 160;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  palm(g, 64, 148, 88 + rnd() * 28, (rnd() - 0.5) * 22);
  return c;
}

/** Çöl çalısı / sazak. */
function bush(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 80;
  c.height = 56;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  shadow(g, 40, 46, 28, 8, 0.28);
  const col = rnd() > 0.5 ? "#8a7058" : "#6a5840";
  for (let k = 0; k < 7; k++) {
    const a = -1.1 + (k / 6) * 2.2;
    const len = 14 + rnd() * 12;
    g.strokeStyle = shade(col, (rnd() - 0.5) * 0.3);
    g.lineWidth = 2 + rnd();
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(40, 44);
    g.quadraticCurveTo(40 + Math.sin(a) * len * 0.5, 44 - len * 0.7, 40 + Math.sin(a) * len, 44 - len);
    g.stroke();
  }
  return c;
}

/** Kara çadır / haydut kampı — soft kum taban, sert dirt disk yok. */
function tent(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 120;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const sand = g.createRadialGradient(80, 98, 4, 80, 98, 72);
  sand.addColorStop(0, "rgba(160,120,70,0.4)");
  sand.addColorStop(0.5, "rgba(150,110,65,0.14)");
  sand.addColorStop(1, "rgba(150,110,65,0)");
  g.fillStyle = sand;
  g.beginPath();
  g.ellipse(80, 100, 70, 22, 0, 0, Math.PI * 2);
  g.fill();
  const drawOne = (x: number, y: number, w: number, dark: boolean) => {
    shadow(g, x, y + 8, w * 0.7, w * 0.22, 0.28);
    const L = dark ? "#2a2018" : "#3a2a1e";
    const lit = dark ? "#5a4030" : "#7a5840";
    g.fillStyle = L;
    g.beginPath();
    g.moveTo(x, y - w * 0.55);
    g.lineTo(x + w * 0.55, y + w * 0.15);
    g.lineTo(x - w * 0.55, y + w * 0.15);
    g.closePath();
    g.fill();
    g.fillStyle = lit;
    g.beginPath();
    g.moveTo(x, y - w * 0.55);
    g.lineTo(x - w * 0.55, y + w * 0.15);
    g.lineTo(x - w * 0.1, y + w * 0.15);
    g.lineTo(x + w * 0.05, y - w * 0.2);
    g.closePath();
    g.fill();
    g.strokeStyle = "#1a1008";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x, y - w * 0.55);
    g.lineTo(x, y + w * 0.15);
    g.stroke();
    g.strokeStyle = "rgba(20,12,6,0.35)";
    g.lineWidth = 1;
    for (let band = 0; band < 4; band++) {
      const ty = y - w * 0.42 + band * w * 0.14;
      g.beginPath();
      g.moveTo(x - w * 0.48 + band * 2, ty);
      g.lineTo(x + w * 0.12, ty - w * 0.08);
      g.stroke();
    }
    g.strokeStyle = shade(lit, -0.35);
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(x - w * 0.5, y + w * 0.12);
    g.quadraticCurveTo(x - w * 0.15, y + w * 0.2, x + w * 0.52, y + w * 0.1);
    g.stroke();
  };
  drawOne(80, 66, 48, true);
  drawOne(40, 82, 32, false);
  drawOne(118, 78, 30, rnd() > 0.5);
  const flame = g.createRadialGradient(80, 90, 1, 80, 90, 12);
  flame.addColorStop(0, "rgba(255,220,80,0.95)");
  flame.addColorStop(0.5, "rgba(255,100,30,0.7)");
  flame.addColorStop(1, "rgba(255,40,0,0)");
  g.fillStyle = flame;
  g.beginPath();
  g.arc(80, 90, 12, 0, Math.PI * 2);
  g.fill();
  g.globalCompositeOperation = "destination-out";
  const cut = g.createLinearGradient(0, 100, 0, 120);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(0.5, "rgba(0,0,0,0.2)");
  cut.addColorStop(1, "rgba(0,0,0,0.88)");
  g.fillStyle = cut;
  g.fillRect(0, 100, 160, 20);
  g.globalCompositeOperation = "source-over";
  return c;
}

/** Vaha: su + 3-4 hurma, ada tabanı yok. */
function oasis(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 220;
  c.height = 160;
  const g = c.getContext("2d")!;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  // ıslak kum — koyu disk yok
  const wet = g.createRadialGradient(110, 105, 8, 110, 105, 62);
  wet.addColorStop(0, "rgba(90,110,70,0.4)");
  wet.addColorStop(0.55, "rgba(150,120,70,0.22)");
  wet.addColorStop(1, "rgba(150,120,70,0)");
  g.fillStyle = wet;
  g.beginPath();
  g.ellipse(110, 105, 62, 34, -0.2, 0, Math.PI * 2);
  g.fill();
  // su (kenarda soft fade)
  const pool = g.createRadialGradient(108, 100, 3, 110, 102, 42);
  pool.addColorStop(0, "rgba(110,210,205,0.95)");
  pool.addColorStop(0.4, "rgba(45,140,155,0.92)");
  pool.addColorStop(0.78, "rgba(25,80,110,0.7)");
  pool.addColorStop(1, "rgba(25,80,110,0)");
  g.fillStyle = pool;
  g.beginPath();
  g.ellipse(110, 102, 40, 22, -0.25, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(210,240,235,0.4)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(102, 94, 14, 5, -0.35, 0, Math.PI);
  g.stroke();
  palm(g, 52, 120, 72 + rnd() * 10, -8);
  palm(g, 162, 114, 80 + rnd() * 10, 10);
  palm(g, 108, 82, 64, 2);
  if (rnd() > 0.3) palm(g, 175, 128, 50, 6);
  return c;
}

/** Taş kule / palanka. */
function tower(seed: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 112;
  c.height = 144;
  const g = c.getContext("2d")!;
  void seed;
  shadow(g, 56, 130, 40, 12, 0.35);
  // gövde
  const wood = g.createLinearGradient(30, 0, 82, 0);
  wood.addColorStop(0, "#3a2818");
  wood.addColorStop(0.4, "#8a6238");
  wood.addColorStop(1, "#2a1a10");
  g.fillStyle = wood;
  g.beginPath();
  g.moveTo(34, 120);
  g.lineTo(38, 40);
  g.lineTo(74, 40);
  g.lineTo(78, 120);
  g.closePath();
  g.fill();
  // tahta bantlar
  g.strokeStyle = "rgba(30,18,10,0.4)";
  g.lineWidth = 1.4;
  for (const y of [55, 78, 100]) {
    g.beginPath();
    g.moveTo(36, y);
    g.lineTo(76, y);
    g.stroke();
  }
  // gözetleme penceresi
  g.fillStyle = "#1a1008";
  g.fillRect(48, 58, 16, 12);
  g.fillStyle = "rgba(255,200,100,0.35)";
  g.fillRect(50, 60, 12, 8);
  // platform
  g.fillStyle = "#5a3a22";
  g.fillRect(28, 36, 56, 10);
  g.fillStyle = "#8a5a30";
  for (let k = 0; k < 5; k++) g.fillRect(30 + k * 11, 28, 8, 12);
  // bayrak
  g.strokeStyle = "#2a1a10";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(56, 28);
  g.lineTo(56, 8);
  g.stroke();
  g.fillStyle = "#c82020";
  g.beginPath();
  g.moveTo(56, 8);
  g.lineTo(78, 16);
  g.lineTo(56, 24);
  g.fill();
  return c;
}

/** Çöl dağ silüeti: geniş yumuşak sırtlar, alçak profil, kuma soft fade. */
function peak(kind: 0 | 1 | 2): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 300;
  c.height = 180;
  const g = c.getContext("2d")!;
  const seed = 920 + kind * 29;
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const mist = g.createRadialGradient(150, 162, 2, 150, 162, 155);
  mist.addColorStop(0, "rgba(168,128,78,0.42)");
  mist.addColorStop(0.35, "rgba(158,118,72,0.18)");
  mist.addColorStop(0.72, "rgba(150,112,68,0.06)");
  mist.addColorStop(1, "rgba(150,112,68,0)");
  g.fillStyle = mist;
  g.beginPath();
  g.ellipse(150, 164, 148, 32, 0, 0, Math.PI * 2);
  g.fill();
  const baseY = 168;
  const ridges: { ox: number; top: number; w: number; base: string; snow: boolean }[] = [
    { ox: 48 + rnd() * 14, top: 88 + kind * 5, w: 108, base: "#7a6550", snow: false },
    { ox: 150, top: kind === 0 ? 70 : kind === 1 ? 48 : 32, w: 148, base: kind === 2 ? "#6a6054" : "#8a7458", snow: kind >= 1 },
    { ox: 248 - rnd() * 12, top: 82 + kind * 4, w: 102, base: "#6a5440", snow: kind === 2 },
  ];
  for (const r of ridges) {
    const lit = shade(r.base, 0.26);
    const dark = shade(r.base, -0.4);
    const L = r.ox - r.w * 0.5, R = r.ox + r.w * 0.5;
    g.fillStyle = r.base;
    g.beginPath();
    g.moveTo(L, baseY);
    g.quadraticCurveTo(r.ox - r.w * 0.32, r.top + 52, r.ox - r.w * 0.12, r.top + 16);
    g.quadraticCurveTo(r.ox - 6, r.top + 3, r.ox, r.top);
    g.quadraticCurveTo(r.ox + 8, r.top + 5, r.ox + r.w * 0.14, r.top + 18);
    g.quadraticCurveTo(r.ox + r.w * 0.36, r.top + 56, R, baseY);
    g.closePath();
    g.fill();
    g.fillStyle = lit;
    g.globalAlpha = 0.75;
    g.beginPath();
    g.moveTo(L, baseY);
    g.quadraticCurveTo(r.ox - r.w * 0.32, r.top + 52, r.ox - r.w * 0.12, r.top + 16);
    g.quadraticCurveTo(r.ox - 6, r.top + 3, r.ox, r.top);
    g.lineTo(r.ox - 4, r.top + 40);
    g.lineTo(r.ox + 4, baseY);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = dark;
    g.beginPath();
    g.moveTo(r.ox, r.top);
    g.quadraticCurveTo(r.ox + 8, r.top + 5, r.ox + r.w * 0.14, r.top + 18);
    g.quadraticCurveTo(r.ox + r.w * 0.36, r.top + 56, R, baseY);
    g.lineTo(r.ox + 14, baseY);
    g.lineTo(r.ox + 6, r.top + 46);
    g.closePath();
    g.fill();
    g.strokeStyle = "rgba(30,18,8,0.18)";
    g.lineWidth = 1.1;
    for (let k = 0; k < 3; k++) {
      const tx = r.ox - 18 + k * 14 + rnd() * 4;
      g.beginPath();
      g.moveTo(tx, r.top + 26 + k * 12);
      g.quadraticCurveTo(tx + 6, r.top + 44 + k * 14, tx, r.top + 66 + k * 10);
      g.stroke();
    }
    if (r.snow) {
      g.fillStyle = "rgba(240,244,248,0.85)";
      g.beginPath();
      g.moveTo(r.ox, r.top);
      g.lineTo(r.ox + 14, r.top + 20);
      g.lineTo(r.ox + 4, r.top + 16);
      g.lineTo(r.ox, r.top + 26);
      g.lineTo(r.ox - 6, r.top + 15);
      g.lineTo(r.ox - 13, r.top + 22);
      g.closePath();
      g.fill();
    }
  }
  g.globalCompositeOperation = "destination-out";
  const cut = g.createLinearGradient(0, 130, 0, 180);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(0.35, "rgba(0,0,0,0.1)");
  cut.addColorStop(1, "rgba(0,0,0,0.96)");
  g.fillStyle = cut;
  g.fillRect(0, 130, 300, 50);
  g.globalCompositeOperation = "source-over";
  return c;
}

const PROP_VER = "v10";
const cache = new Map<string, Texture>();

function texFrom(c: HTMLCanvasElement): Texture {
  return Texture.from(c);
}

/**
 * CC0 şehir/kale/kule dokusunu yurt-kamp ailesine yaklaştırır:
 * alttaki soft kum lekesi + alt kenar fade (sert sticker tabanı yok).
 */
export function softenIsoFromImage(img: CanvasImageSource, w0?: number, h0?: number): Texture {
  const w = Math.max(1, Math.round(w0 ?? (img as HTMLImageElement).naturalWidth ?? (img as HTMLCanvasElement).width ?? 256));
  const h = Math.max(1, Math.round(h0 ?? (img as HTMLImageElement).naturalHeight ?? (img as HTMLCanvasElement).height ?? 256));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const sand = g.createRadialGradient(w * 0.5, h * 0.9, 2, w * 0.5, h * 0.9, w * 0.5);
  sand.addColorStop(0, "rgba(196,160,106,0.42)");
  sand.addColorStop(0.45, "rgba(184,144,88,0.16)");
  sand.addColorStop(1, "rgba(184,144,88,0)");
  g.fillStyle = sand;
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.9, w * 0.48, h * 0.11, 0, 0, Math.PI * 2);
  g.fill();
  g.drawImage(img, 0, 0, w, h);
  g.globalCompositeOperation = "destination-out";
  const cut = g.createLinearGradient(0, h * 0.78, 0, h);
  cut.addColorStop(0, "rgba(0,0,0,0)");
  cut.addColorStop(0.5, "rgba(0,0,0,0.22)");
  cut.addColorStop(1, "rgba(0,0,0,0.94)");
  g.fillStyle = cut;
  g.fillRect(0, h * 0.78, w, h * 0.22);
  g.globalCompositeOperation = "source-over";
  return Texture.from(c);
}

/** Pixi Texture kaynağından soft-iso üret; kaynak yoksa orijinali bırak. */
export function softenIsoTex(tex: Texture): Texture {
  const res = tex.source?.resource as unknown;
  if (!(res instanceof HTMLImageElement || res instanceof HTMLCanvasElement || (typeof ImageBitmap !== "undefined" && res instanceof ImageBitmap))) {
    return tex;
  }
  return softenIsoFromImage(res, tex.width, tex.height);
}

/** Prop anahtarı → Texture. `variant` ile çeşit. */
export function propTex(kind: "yurts" | "village" | "palm" | "bush" | "camp" | "oasis" | "tower" | "peak0" | "peak1" | "peak2", variant = 0): Texture {
  const key = `${PROP_VER}:${kind}:${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let c: HTMLCanvasElement;
  switch (kind) {
    case "yurts":
      c = yurtCamp(1000 + variant * 97);
      break;
    case "village":
      c = villageSoft(7000 + variant * 83, variant % 4);
      break;
    case "palm":
      c = palmTree(2000 + variant * 53);
      break;
    case "bush":
      c = bush(3000 + variant * 71);
      break;
    case "camp":
      c = tent(4000 + variant * 41);
      break;
    case "oasis":
      c = oasis(5000 + variant * 29);
      break;
    case "tower":
      c = tower(6000 + variant);
      break;
    case "peak0":
      c = peak(0);
      break;
    case "peak1":
      c = peak(1);
      break;
    case "peak2":
      c = peak(2);
      break;
  }
  const t = texFrom(c);
  cache.set(key, t);
  return t;
}

/** Dağ atlası (3 zirve). */
export function peakTextures(): Texture[] {
  return [propTex("peak0"), propTex("peak1"), propTex("peak2")];
}

/** Yurt varyantları. */
export function yurtTextures(n = 4): Texture[] {
  return Array.from({ length: n }, (_, i) => propTex("yurts", i));
}

export function palmTextures(n = 5): Texture[] {
  return Array.from({ length: n }, (_, i) => propTex("palm", i));
}

export function bushTextures(n = 4): Texture[] {
  return Array.from({ length: n }, (_, i) => propTex("bush", i));
}

/** Atlas karesi (gerekirse). */
export function propFrame(tex: Texture, x: number, y: number, w: number, h: number): Texture {
  return new Texture({ source: tex.source, frame: new Rectangle(x, y, w, h) });
}
