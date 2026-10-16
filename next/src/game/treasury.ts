import type { Game } from "./game";
import { audio } from "../audio";
import { iap, type StoreKind } from "../iap";
import {
  CHEST10_PRICE, CHEST_PRICE, COSMETICS, COS_BY_ID, PASS, PASS_STEP, PRODUCTS, PRODUCT_BY_ID, SPENDS, dayKey, loadIap, passTier, rewardText, rollChest, saveIap,
  type ChestKind, type CosKind, type IapState, type ProductId, type Reward,
} from "./shop";

const DAY_MS = 86_400_000;
const KERVAN_DAYS = 30;

export interface ChestDrop {
  kind: ChestKind;
  text: string;
  icon: string;
  rar: number;
}

/** Hesap geneli hazine: gerçek para ürünleri, Yarmak harcamaları, sezon kartı, kozmetik ve sandıklar. */
export class Treasury {
  st: IapState = loadIap();
  store: StoreKind = "none";
  busy = false;

  constructor(private g: Game) {}

  async init(): Promise<void> {
    this.store = await iap.init(PRODUCTS.map((p) => ({ id: p.id, consumable: p.consumable })), (id) => this.grant(id as ProductId));
    this.deeds();
  }

  save(): void {
    saveIap(this.st);
  }

  price(id: ProductId): string {
    return iap.price(id) ?? PRODUCT_BY_ID[id].fallback;
  }

  firstBonus(id: ProductId): boolean {
    return id.startsWith("y_") && !this.st.bought[id];
  }

  productWhy(id: ProductId): string | null {
    const p = PRODUCT_BY_ID[id];
    if (p.once && this.st.bought[id]) return "Alındı";
    if (id === "pass" && this.st.pass.prem) return "Bu sezon açık";
    if (id === "kervan" && this.kervanLeft() > 0) return `${this.kervanLeft()} gün kaldı`;
    if (!iap.available()) return "Mağaza kapalı";
    return null;
  }

  async buy(id: ProductId): Promise<void> {
    const why = this.productWhy(id);
    if (why || this.busy) return void (why && this.g.hud.toast(why, "info"));
    this.busy = true;
    const r = await iap.buy(id);
    this.busy = false;
    if (!r.ok) this.g.hud.toast(r.err ?? "Satın alma tamamlanmadı", "bad");
    this.g.hud.refreshShop();
  }

  /** Mağaza onayladığında bir kez çağrılır. */
  private grant(id: ProductId): void {
    const st = this.st;
    const p = PRODUCT_BY_ID[id];
    if (!p) return;
    const s = this.g.s;
    const first = this.firstBonus(id);
    st.bought[id] = (st.bought[id] ?? 0) + 1;
    let note = "";
    if (id === "starter") {
      st.yarmak += 300;
      s.res.gold += 5000;
      s.mats.ruh += 5;
      s.mats.nisan = (s.mats.nisan ?? 0) + 3;
      this.own("kervanbasi");
      st.equip.frame ??= "kervanbasi";
      note = "Yolcu Kesesi açıldı!";
    } else if (id === "pass") {
      st.pass.prem = true;
      note = "Destan Yolu'nun altın yolu açıldı!";
    } else if (id === "kervan") {
      st.yarmak += p.yarmak!;
      const from = Math.max(Date.now(), st.kervan?.until ?? 0);
      st.kervan = { until: from + KERVAN_DAYS * DAY_MS, last: st.kervan?.last ?? 0 };
      note = `Kervan Ağası: ${KERVAN_DAYS} gün boyunca her gün hediye!`;
    } else {
      const n = (p.yarmak ?? 0) * (first ? 2 : 1) + (p.bonus ?? 0);
      st.yarmak += n;
      note = `+${n} Yarmak${first ? " (ilk alım: iki katı!)" : ""}`;
    }
    this.save();
    audio.play("buy");
    this.g.hud.toast(note, "good");
    this.g.hud.refreshShop();
  }

  // ---------- Yarmak harcamaları ----------

  pay(n: number): boolean {
    if (this.st.yarmak < n) {
      this.g.hud.toast("Yeterli Yarmak yok", "bad");
      this.g.hud.openShop("yarmak");
      return false;
    }
    this.st.yarmak -= n;
    this.st.spent += n;
    return true;
  }

  purseGold(): number {
    return 2000 + 400 * this.g.s.hero.lv;
  }

  spend(id: string): void {
    const sp = SPENDS.find((x) => x.id === id);
    if (!sp || !this.pay(sp.price)) return;
    const s = this.g.s;
    let text = sp.name;
    if (id === "kese" || id === "hazine") {
      const n = this.purseGold() * (id === "hazine" ? 6 : 1);
      s.res.gold += n;
      text = `+${n} altın`;
    } else if (id === "ruh") s.mats.ruh += 5;
    else if (id === "parsomen") s.mats.parsomen += 2;
    else if (id === "nisan") s.mats.nisan = (s.mats.nisan ?? 0) + 2;
    else if (id === "iksir") {
      s.cons.merhem = (s.cons.merhem ?? 0) + 3;
      s.cons.kimiz = (s.cons.kimiz ?? 0) + 3;
    }
    this.save();
    audio.play("coin");
    this.g.hud.toast(text, "good");
    this.g.hud.refreshShop();
  }

  // ---------- Kozmetik ----------

  owns(id: string): boolean {
    return this.st.owned.includes(id);
  }

  private own(id: string): boolean {
    if (this.owns(id)) return false;
    this.st.owned.push(id);
    return true;
  }

  buyCos(id: string): void {
    const c = COS_BY_ID[id];
    if (!c?.price || this.owns(id) || !this.pay(c.price)) return;
    this.own(id);
    this.st.equip[c.kind] = id;
    this.save();
    audio.play("level");
    this.g.hud.toast(`${c.name} senin!`, "good");
    this.g.hud.refreshShop();
  }

  equip(kind: CosKind, id: string | null): void {
    if (id && !this.owns(id)) return;
    if (id) this.st.equip[kind] = id;
    else delete this.st.equip[kind];
    this.save();
    this.g.hud.refreshShop();
  }

  worn(kind: CosKind) {
    const id = this.st.equip[kind];
    return id && this.owns(id) ? COS_BY_ID[id] : null;
  }

  /** Oyun içi başarılarla açılan lakaplar. */
  deeds(): string[] {
    const beaten = new Set((this.g.s.foes ?? []).filter((f) => f.kind === "boss").map((f) => f.name.replace(/^Uyanmış /, "")));
    const fresh: string[] = [];
    for (const c of COSMETICS) if (c.from === "deed" && c.deed && beaten.has(c.deed) && this.own(c.id)) fresh.push(c.name);
    if (fresh.length) {
      this.save();
      for (const n of fresh) this.g.hud.toast(`Yeni lakap: ${n}`, "good");
    }
    return fresh;
  }

  // ---------- Sandık ----------

  chestCost(n: 1 | 10): number {
    return n === 10 ? CHEST10_PRICE : CHEST_PRICE;
  }

  openChests(n: 1 | 10): ChestDrop[] | null {
    const st = this.st;
    const free = Math.min(st.chests, n);
    const paid = n - free;
    if (paid > 0 && !this.pay(paid === 10 ? CHEST10_PRICE : CHEST_PRICE * paid)) return null;
    st.chests -= free;
    const out: ChestDrop[] = [];
    for (let i = 0; i < n; i++) out.push(this.dropOne());
    this.save();
    return out;
  }

  private dropOne(): ChestDrop {
    const st = this.st;
    const s = this.g.s;
    const kind = rollChest(st.pity);
    st.pity = kind === "legend" ? 0 : st.pity + 1;
    switch (kind) {
      case "legend": {
        const it = this.g.forceLegend();
        return { kind, text: it.name, icon: it.icon, rar: 4 };
      }
      case "epic":
      case "rare": {
        const it = this.g.grantItem(kind === "epic" ? 3 : 2);
        return { kind, text: it.name, icon: it.icon, rar: it.rar };
      }
      case "nisan":
        s.mats.nisan = (s.mats.nisan ?? 0) + 3;
        return { kind, text: "3 Alp Nişanı", icon: "nisan", rar: 2 };
      case "ruh":
        s.mats.ruh += 8;
        return { kind, text: "8 Ruh Taşı", icon: "ruh", rar: 1 };
      case "cos": {
        const left = COSMETICS.filter((c) => c.from === "chest" && !this.owns(c.id));
        if (left.length) {
          const c = left[Math.floor(Math.random() * left.length)];
          this.own(c.id);
          return { kind, text: `${c.name} (${c.kind === "lakap" ? "lakap" : c.kind === "banner" ? "sancak" : "çerçeve"})`, icon: "seal", rar: 4 };
        }
        st.yarmak += 60;
        return { kind: "yarmak", text: "60 Yarmak", icon: "yarmak", rar: 2 };
      }
      case "yarmak":
        st.yarmak += 40;
        return { kind, text: "40 Yarmak", icon: "yarmak", rar: 2 };
    }
  }

  // ---------- Destan Yolu ----------

  passXp(n: number): void {
    const p = this.st.pass;
    const before = passTier(p.xp);
    p.xp += Math.round(n * (p.prem ? 1.1 : 1));
    const after = passTier(p.xp);
    this.save();
    if (after > before) this.g.hud.toast(`Destan Yolu: ${after}. basamak! Ödülünü almayı unutma.`, "good");
  }

  passTier(): number {
    return passTier(this.st.pass.xp);
  }

  passProgress(): number {
    return (this.st.pass.xp % PASS_STEP) / PASS_STEP;
  }

  claimable(): number {
    const t = this.passTier();
    const p = this.st.pass;
    let n = 0;
    for (const row of PASS) {
      if (row.tier > t) break;
      if (!p.free.includes(row.tier)) n++;
      if (p.prem && !p.paid.includes(row.tier)) n++;
    }
    return n + (this.dailyReady() ? 1 : 0);
  }

  claim(tier: number, prem: boolean): void {
    const p = this.st.pass;
    if (tier > this.passTier()) return;
    const list = prem ? p.paid : p.free;
    if (list.includes(tier) || (prem && !p.prem)) return;
    const row = PASS[tier - 1];
    list.push(tier);
    const r = prem ? row.prem : row.free;
    this.reward(r);
    this.save();
    audio.play("coin");
    this.g.hud.toast(`Destan Yolu ${tier}: ${rewardText(r)}`, "good");
    this.g.hud.refreshShop();
  }

  claimAll(): void {
    const t = this.passTier();
    for (const row of PASS) {
      if (row.tier > t) break;
      this.claim(row.tier, false);
      if (this.st.pass.prem) this.claim(row.tier, true);
    }
  }

  private reward(r: Reward): void {
    const s = this.g.s;
    const st = this.st;
    switch (r.kind) {
      case "gold": s.res.gold += r.n!; break;
      case "ruh": s.mats.ruh += r.n!; break;
      case "nisan": s.mats.nisan = (s.mats.nisan ?? 0) + r.n!; break;
      case "parsomen": s.mats.parsomen += r.n!; break;
      case "yarmak": st.yarmak += r.n!; break;
      case "chest": st.chests += r.n!; break;
      case "legend": this.g.forceLegend(); break;
      case "cos": this.own(r.id!); break;
    }
  }

  // ---------- Günlük hediye ----------

  kervanLeft(): number {
    const k = this.st.kervan;
    return k ? Math.max(0, Math.ceil((k.until - Date.now()) / DAY_MS)) : 0;
  }

  dailyReady(): boolean {
    return this.st.daily !== dayKey();
  }

  claimDaily(): void {
    if (!this.dailyReady()) return;
    const st = this.st;
    st.daily = dayKey();
    st.yarmak += 10;
    let text = "Günlük hediye: +10 Yarmak";
    if (this.kervanLeft() > 0) {
      st.yarmak += 40;
      this.g.s.res.gold += 1000;
      text += " · Kervan Ağası: +40 Yarmak, +1000 altın";
    }
    this.save();
    this.passXp(50);
    audio.play("chest");
    this.g.hud.toast(text, "good");
    this.g.hud.refreshShop();
  }
}