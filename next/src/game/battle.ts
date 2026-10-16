import { UNITS, UNIT_KEYS, armyPower, armySize, type Army, type Unit } from "./data";
import type { SkillKind } from "./classes";
import { bossLine } from "./regions";
import { ARENAS, COUNTER, KINS, bossKit, kinSummon, type Arena, type BossKit, type BossMove, type Kin, type KinDef, type MoveKind } from "./bosses";

export interface Champion {
  atk: number;
  def: number;
  hp: number;
  maxHp: number;
  crit: number;
  critMult: number;
  dodge: number;
  heal: number;
  rage: boolean;
  firstStrike: boolean;
  skills: { name: string; kind: SkillKind; pow: number }[];
}

export interface Boss {
  name: string;
  icon: string;
  atk: number;
  def: number;
  hp: number;
}

export interface Round {
  a: Army;
  b: Army;
  hp: number;
  bhp: number;
  ev: string[];
  order?: Order;
  ma?: number;
  mb?: number;
  /** Bossun bir sonraki turda yapacağı hareketin uyarısı. */
  tell?: { name: string; text: string; kind: MoveKind; counter: Order };
  /** Bu turda isabet eden ya da karşılanan boss hareketi. */
  move?: { name: string; kind: MoveKind; countered: boolean };
  /** Boss ikinci evreye geçti. */
  phase?: string;
  /** Bossun bu turdaki sözü. */
  say?: string;
}

export type Ground = "bozkir" | "cayir" | "kum" | "dag";
export interface Field {
  ground: Ground;
  night: boolean;
  sky?: Sky | null;
  note?: string;
  arena?: Arena;
  kin?: Kin;
}
export type Sky = "kum" | "yagmur" | "tipi" | "kar";
export const SKIES: Record<Sky, { name: string; mul: Partial<Record<Unit, number>>; text: string }> = {
  kum: { name: "Kum fırtınası", mul: { archer: 0.6 }, text: "Göz gözü görmüyor: okçu -%40." },
  yagmur: { name: "Sağanak", mul: { archer: 0.8, horse: 0.85 }, text: "Yay kirişleri ıslandı, toprak çamur: okçu -%20, atlı -%15." },
  tipi: { name: "Tipi", mul: { archer: 0.75, horse: 0.8 }, text: "Kar fırtınası: okçu -%25, atlı -%20." },
  kar: { name: "Karlı meydan", mul: { horse: 0.85 }, text: "Atlar karda zorlanıyor: atlı -%15." },
};
export const GROUNDS: Record<Ground, { name: string; icon: string; mul: Partial<Record<Unit, number>>; text: string }> = {
  bozkir: { name: "Açık bozkır", icon: "u_cavalry", mul: { horse: 1.3 }, text: "Atlılar için uçsuz meydan: atlı hasarı +%30." },
  cayir: { name: "Çayır ve koru", icon: "u_spear", mul: { spear: 1.2, archer: 0.85 }, text: "Ağaçlar okları keser, mızrak safı sağlam durur: mızraklı +%20, okçu -%15." },
  kum: { name: "Kum tepeleri", icon: "u_archer", mul: { horse: 1.1, spear: 0.85 }, text: "Ayak kumda batar: mızraklı -%15, atlı +%10." },
  dag: { name: "Dağ geçidi", icon: "u_archer", mul: { archer: 1.3, horse: 0.7 }, text: "Yüksekten atılan ok ölümcül, atlar kayalıkta tökezler: okçu +%30, atlı -%30." },
};
export function fieldMul(f: Field | null): Partial<Record<Unit, number>> {
  if (!f) return {};
  const m = { ...(f.arena ? ARENAS[f.arena].mul : GROUNDS[f.ground].mul) };
  if (f.night) m.archer = (m.archer ?? 1) * 0.75;
  if (f.sky) for (const [u, k] of Object.entries(SKIES[f.sky].mul) as [Unit, number][]) m[u] = (m[u] ?? 1) * k;
  return m;
}

export interface BattleResult {
  rounds: Round[];
  win: boolean;
  lostA: Army;
  lostB: Army;
  heroHp: number;
  heroDown: boolean;
  bossDown: boolean;
  orders: Order[];
  rout: "a" | "b" | null;
}

export type Order = "nara" | "kanat" | "ricat" | "yedek" | "yagmur" | "siper";
export const ORDER_KEYS: Order[] = ["nara", "kanat", "yagmur", "siper", "ricat", "yedek"];
export const RESERVE_SHARE = 0.25;
export const RESERVE_MIN = 8;
export const ORDERS: Record<Order, { name: string; icon: string; text: string }> = {
  nara: { name: "Nara", icon: "ord_nara", text: "İki tur boyunca birliğin +%25 güçle vurur." },
  kanat: { name: "Kanat Saldırısı", icon: "ord_kanat", text: "Atlılar yandan dolanır: bu tur atlı hasarı ×1.8." },
  ricat: { name: "Turan Taktiği", icon: "ord_ricat", text: "Sahte ricat: bir tur geri çekil, düşman safını bozarsa sonraki iki tur ×1.7 vur. Atlı oranın düşükse düşman yemi yutmayabilir." },
  yedek: { name: "Yedekler!", icon: "tug", text: "Tepede bekleyen taze kuvvet meydana iner: bu tur ×1.4 vurur, moral +18. Ön saf erirse kendiliğinden iner. İnmezse yenilgide kayıpsız çekilir." },
  yagmur: { name: "Ok Yağmuru", icon: "ord_yagmur", text: "Okçular hep birlikte gökyüzünü karartır: bu tur okçu hasarı ×2, düşman morali −6." },
  siper: { name: "Kalkan Siperi", icon: "ord_siper", text: "Mızraklılar kalkanları kilitler: bu tur gelen hasar −%45, ama sen de %30 az vurursun." },
};

export interface UnitMul {
  atk: Partial<Record<Unit, number>>;
  hp: Partial<Record<Unit, number>>;
}
const NO_MUL: UnitMul = { atk: {}, hp: {} };

function mult(att: Unit, def: Unit): number {
  if (UNITS[att].beats === def) return 1.6;
  if (UNITS[def].beats === att) return 0.7;
  return 1;
}

const CHAMP_WEIGHT = 3;
const BOSS_WEIGHT = 5;
const NONE: Army = { spear: 0, archer: 0, horse: 0 };

function hit(from: Army, to: Army, bonus: number, hp: Record<Unit, number>, extra: number, target: { hp: number } | null, weight: number, uMul: Partial<Record<Unit, number>> = {}, hpMul: Partial<Record<Unit, number>> = {}): { out: Army; toChamp: number } {
  const total = armySize(to) + (target && target.hp > 0 ? weight : 0);
  const out: Army = { ...to };
  let toChamp = 0;
  if (total <= 0) return { out, toChamp };
  const deal = (dmgBase: (v: Unit) => number) => {
    for (const v of UNIT_KEYS) {
      if (to[v] <= 0) continue;
      hp[v] += dmgBase(v) * (to[v] / total);
    }
    if (target && target.hp > 0) toChamp += dmgBase("spear") * (weight / total);
  };
  for (const u of UNIT_KEYS) {
    if (from[u] <= 0) continue;
    deal((v) => from[u] * UNITS[u].atk * (1 + bonus) * (uMul[u] ?? 1) * mult(u, v) * (0.85 + Math.random() * 0.3));
  }
  if (extra > 0) deal(() => extra * (0.85 + Math.random() * 0.3));
  for (const v of UNIT_KEYS) {
    const uh = UNITS[v].hp * (hpMul[v] ?? 1);
    const k = Math.floor(hp[v] / uh);
    if (k > 0) {
      hp[v] -= k * uh;
      out[v] = Math.max(0, out[v] - k);
    }
  }
  return { out, toChamp };
}

function champPow(c: { atk: number } | null, hp: number): number {
  return c ? c.atk * Math.sqrt(Math.max(0, hp)) * 0.6 : 0;
}

export class Sim {
  rounds: Round[];
  used: Order[] = [];
  private a: Army;
  private b: Army;
  private c: Champion | null;
  private boss: Boss | null;
  private hpA = { spear: 0, archer: 0, horse: 0 };
  private hpB = { spear: 0, archer: 0, horse: 0 };
  private aBonus: number;
  private r = 0;
  private maxR: number;
  private over = false;
  private nara = 0;
  private lure = 0;
  private sk: (k: SkillKind) => { name: string; kind: SkillKind; pow: number }[];
  private slay: number;
  private rally: number;
  private luckEv: string[];
  private fm: Partial<Record<Unit, number>>;
  ma = 100;
  mb = 100;
  rout: "a" | "b" | null = null;
  resv: Army = { ...NONE };
  private fresh = 0;
  /** Düşman narası: 0 henüz atılmadı, >0 kalan tur, <0 tükendi. */
  private foeCry = 0;

  private am: UnitMul;
  private siper = 0;
  readonly kit: BossKit | null;
  readonly kin: KinDef | null;
  private fmB: Partial<Record<Unit, number>>;
  private tell: BossMove | null = null;
  private tellCd = 1;
  private lastMove: BossMove | null = null;
  private raged = false;
  private lowSaid = false;
  private bossMax = 0;
  private cursed = 0;
  /** Oyuncu yönetmediğinde (olasılık, otomatik savaş) uyarıyı doğru emirle karşılama şansı. */
  autoCounter = 0.6;
  counters = 0;

  constructor(private a0: Army, aBonus0: number, private b0: Army, private bBonus = 0, private champ: Champion | null = null, boss0: Boss | null = null, field: Field | null = null, reserve = false, aMul: UnitMul = NO_MUL) {
    this.fm = fieldMul(field);
    this.kit = bossKit(boss0);
    const kin = field?.kin ?? this.kit?.kin;
    this.kin = kin && kin !== "insan" ? KINS[kin] : null;
    this.fmB = { ...this.fm };
    if (this.kin) {
      for (const [u, k] of Object.entries(this.kin.atk) as [Unit, number][]) this.fmB[u] = (this.fmB[u] ?? 1) * k;
      for (const [u, k] of Object.entries(this.kin.vs) as [Unit, number][]) this.fm[u] = (this.fm[u] ?? 1) * k;
    }
    this.bossMax = boss0?.hp ?? 0;
    this.am = aMul;
    this.a = { ...a0 };
    if (reserve && armySize(a0) >= RESERVE_MIN)
      for (const u of UNIT_KEYS) {
        this.resv[u] = Math.floor(a0[u] * RESERVE_SHARE);
        this.a[u] -= this.resv[u];
      }
    this.b = { ...b0 };
    const c = (this.c = champ ? { ...champ } : null);
    this.boss = boss0 ? { ...boss0 } : null;
    this.sk = (k) => c?.skills.filter((s) => s.kind === k) ?? [];
    const luck = (Math.random() + Math.random() - 1) * 0.6;
    this.aBonus = aBonus0 + this.sk("aura").reduce((t, s) => t + s.pow, 0) + luck;
    if (c) {
      for (const s of this.sk("fury")) c.atk *= 1 + s.pow;
      for (const s of this.sk("evade")) c.dodge = Math.min(0.6, c.dodge + s.pow);
    }
    this.slay = this.sk("slayer").reduce((t, s) => t + s.pow, 0);
    this.rally = this.sk("rally").reduce((t, s) => t + s.pow, 0);
    this.maxR = this.boss ? 16 : 12;
    this.luckEv = luck > 0.25 ? ["Rüzgâr arkanda"] : luck < -0.25 ? ["Talih yüz çevirdi"] : [];
    this.rounds = [{ a: { ...this.a }, b: { ...this.b }, hp: c?.hp ?? 0, bhp: this.boss?.hp ?? 0, ev: [], ma: 100, mb: 100 }];
    if (c?.firstStrike) {
      const ev = ["Gölge Darbesi"];
      const r = hit(NONE, this.b, this.aBonus, this.hpB, this.champHit(ev) * 1.5, this.boss, BOSS_WEIGHT);
      this.b = r.out;
      this.hurtBoss(r.toChamp);
      this.mb -= 8;
      this.rounds.push({ a: { ...this.a }, b: { ...this.b }, hp: c.hp, bhp: this.boss?.hp ?? 0, ev, ma: this.ma, mb: this.mb });
    }
  }

  /** Kahramanın sınıf, yoldaş ve eşya becerileri: savaş kiti şeridinde gösterilir. */
  skills(): { name: string; kind: SkillKind; pow: number }[] {
    return this.c?.skills ?? [];
  }

  /** Şu an ekranda bekleyen boss uyarısı. */
  pendingTell(): BossMove | null {
    return this.tell;
  }

  private unitFor(o: Order): boolean {
    if (o === "kanat") return this.a.horse > 0;
    if (o === "yagmur") return this.a.archer > 0;
    if (o === "siper") return this.a.spear > 0;
    if (o === "ricat") return armySize(this.a) > 0;
    return true;
  }

  private pickMove(): BossMove | null {
    const kit = this.kit;
    if (!kit) return null;
    const pool = this.raged ? [...kit.moves, kit.rage.move, kit.rage.move] : kit.moves;
    const fresh = pool.filter((m) => m !== this.lastMove);
    const list = fresh.length ? fresh : pool;
    return list[Math.floor(Math.random() * list.length)];
  }

  private setTell(m: BossMove, round: Round): void {
    this.tell = m;
    round.tell = { name: m.name, text: m.tell, kind: m.kind, counter: COUNTER[m.kind] };
    round.ev.push(`⚠ ${m.name}`);
  }

  /** Savaş başlamadan (er meydanı vb.) iki tarafın moralini ayarlar. */
  opening(ma: number, mb: number, ev: string): void {
    this.ma = ma;
    this.mb = mb;
    const r0 = this.rounds[this.rounds.length - 1];
    r0.ma = ma;
    r0.mb = mb;
    r0.ev.push(ev);
  }

  private aAlive(): boolean {
    return armySize(this.a) + armySize(this.resv) > 0 || (!!this.c && this.c.hp > 0);
  }

  private bAlive(): boolean {
    return this.boss ? this.boss.hp > 0 : armySize(this.b) > 0;
  }

  private champHit(ev: string[]): number {
    const c = this.c;
    if (!c || c.hp <= 0) return 0;
    let d = c.atk;
    if (c.rage && c.hp < c.maxHp / 2) {
      d *= 1.3;
      if (!ev.includes("Öfke")) ev.push("Öfke");
    }
    if (Math.random() < c.crit) {
      d *= c.critMult;
      ev.push("Kritik!");
    }
    return d;
  }

  private hurtBoss(dmg: number): void {
    if (this.boss) this.boss.hp = Math.max(0, this.boss.hp - (dmg * 100) / (100 + this.boss.def * 6));
  }

  canOrder(o: Order): boolean {
    if (this.over) return false;
    if (this.tell && COUNTER[this.tell.kind] === o) return this.unitFor(o);
    if (this.used.includes(o)) return false;
    if (o === "yedek") return armySize(this.resv) > 0;
    return this.unitFor(o);
  }

  done(): boolean {
    return this.over;
  }

  step(order?: Order): Round | null {
    if (this.over) return null;
    const { c, boss } = this;
    const r = this.r++;
    const ev: string[] = r === 0 ? [...this.luckEv] : [];
    const tell = this.tell;
    if (!order && tell && Math.random() < this.autoCounter && this.canOrder(COUNTER[tell.kind])) order = COUNTER[tell.kind];
    if (order && this.canOrder(order)) {
      if (!this.used.includes(order)) this.used.push(order);
    } else order = undefined;
    this.tell = null;
    const countered = !!tell && order === COUNTER[tell.kind];
    let ordMul = 1;
    let inOrd = 1;
    const uMul: Partial<Record<Unit, number>> = {};
    if (!order && armySize(this.resv) > 0 && (armySize(this.a) < armySize(this.a0) * 0.3 || this.ma < 20)) {
      order = "yedek";
      this.used.push(order);
    }
    if (order === "yedek") {
      for (const u of UNIT_KEYS) this.a[u] += this.resv[u];
      this.resv = { ...NONE };
      this.fresh = 2;
      ev.push("Yedekler meydana indi!");
    }
    if (this.fresh > 0) {
      ordMul *= 1.35;
      this.fresh--;
    }
    if (order === "nara") {
      this.nara = 2;
      ev.push("Nara!");
    }
    if (order === "kanat") {
      uMul.horse = 1.8;
      ev.push("Kanat saldırısı!");
    }
    if (order === "yagmur") {
      uMul.archer = 2;
      ev.push("Ok yağmuru!");
    }
    if (order === "siper") {
      this.siper = 1;
      ordMul *= 0.7;
      ev.push("Kalkan siperi!");
    }
    if (order === "ricat") {
      const share = this.a.horse / Math.max(1, armySize(this.a));
      const ok = countered || Math.random() < (boss ? 0.45 : 0.35 + share * 1.6);
      ordMul = 0;
      inOrd = 0.3;
      if (ok) {
        this.lure = 2;
        ev.push("Turan taktiği: düşman yemi yuttu!");
      } else ev.push("Düşman sahte ricatı sezdi");
    } else if (this.lure > 0) {
      ordMul *= 1.7;
      this.lure--;
      ev.push("Safları bozuldu!");
    }
    if (this.nara > 0) {
      ordMul *= 1.25;
      this.nara--;
    }
    let extra = this.champHit(ev) * (1 + this.aBonus);
    if (c && c.hp > 0) {
      if (r % 3 === 0)
        for (const s of this.sk("burst")) {
          extra += c.atk * s.pow;
          ev.push(s.name);
        }
      for (const s of this.sk("poison")) {
        extra += c.atk * s.pow;
        if (r === 0) ev.push(s.name);
      }
      if (this.slay) {
        extra *= 1 + (boss ? this.slay : this.slay / 2);
        if (r === 0 && boss) for (const s of this.sk("slayer")) ev.push(s.name);
      }
      for (const s of this.sk("drain")) {
        c.hp = Math.min(c.maxHp, c.hp + extra * s.pow * 0.4);
        if (r === 0) ev.push(s.name);
      }
    }
    const shield = this.sk("shield");
    let inMul = (r < 3 ? shield.reduce((m, s) => m * (1 - s.pow), 1) : 1) * inOrd;
    if (r < 3 && shield.length && r === 0) for (const s of shield) ev.push(s.name);
    if (c && c.hp > 0 && r % 4 === 1)
      for (const s of this.sk("stun")) {
        inMul *= 1 - Math.min(0.8, s.pow);
        ev.push(s.name);
      }
    if (this.rally && r === 1) for (const s of this.sk("rally")) ev.push(s.name);
    if (armySize(this.resv) > 0) inMul *= 0.92;
    if (this.siper > 0) {
      inMul *= 0.55;
      this.siper--;
    }
    let moveMul = 1;
    let stagger = 1;
    let roundMove: Round["move"];
    if (tell && boss && boss.hp > 0) {
      roundMove = { name: tell.name, kind: tell.kind, countered };
      if (countered) {
        stagger = 1.6;
        this.ma = Math.min(100, this.ma + 8);
        this.counters++;
        ev.push(`Karşılandı: ${tell.name}!`);
      } else {
        ev.push(`${boss.name}: ${tell.name}!`);
        if (tell.kind === "nefes") {
          moveMul = 1 + tell.pow;
          inMul *= 1 + tell.pow * 0.35;
        } else if (tell.kind === "hucum") {
          if (c && c.hp > 0) {
            if (c.dodge > 0 && Math.random() < c.dodge) ev.push("Sıyrıldın");
            else c.hp = Math.max(0, c.hp - (boss.atk * tell.pow * 100) / (100 + c.def * 6));
          } else moveMul = 1 + tell.pow;
        } else if (tell.kind === "cagir") {
          const add = kinSummon(this.b0, tell.pow, tell.mix);
          for (const u of UNIT_KEYS) this.b[u] += add[u];
        } else if (tell.kind === "lanet") {
          this.ma = Math.max(0, this.ma - tell.pow);
          this.cursed = 2;
        } else if (tell.kind === "sifa") {
          boss.hp = Math.min(this.bossMax, boss.hp + this.bossMax * tell.pow);
        } else {
          ordMul *= 1 - tell.pow;
          inMul *= 1.15;
        }
      }
    }
    if (this.cursed > 0) {
      ordMul *= 0.85;
      this.cursed--;
    }
    const kin = this.kin;
    if (kin?.ambush && r === 0) {
      inMul *= 1 + kin.ambush;
      ev.push(`${kin.name} pusudan saldırdı!`);
    }
    if (kin?.drain && c && c.hp > 0) c.hp = Math.max(1, c.hp - c.maxHp * kin.drain);
    for (const u of UNIT_KEYS) if (this.fm[u]) uMul[u] = (uMul[u] ?? 1) * this.fm[u]!;
    for (const u of UNIT_KEYS) if (this.am.atk[u]) uMul[u] = (uMul[u] ?? 1) * this.am.atk[u]!;
    const bonus = (1 + this.aBonus + this.rally * Math.min(1, r / 4)) * ordMul - 1;
    if (this.foeCry === 0 && !boss && r >= 2 && this.mb < 40 && armySize(this.b) >= 6) {
      this.foeCry = 2;
      this.mb = Math.min(100, this.mb + 5);
      ev.push("Düşman komutanı nara attı!");
    }
    if (this.foeCry > 0) {
      inMul *= 1.12;
      if (--this.foeCry === 0) this.foeCry = -1;
    }
    const prevA = armySize(this.a);
    const prevB = armySize(this.b);
    const atkB = hit(ordMul ? this.a : NONE, this.b, bonus, this.hpB, extra * ordMul, boss, BOSS_WEIGHT, uMul);
    const bossDmg = boss && boss.hp > 0 ? boss.atk * inMul * moveMul : 0;
    const atkA = hit(this.b, this.a, (1 + this.bBonus) * inMul - 1, this.hpA, bossDmg, c, CHAMP_WEIGHT, this.fmB, this.am.hp);
    this.hurtBoss(atkB.toChamp * stagger);
    if (c) {
      if (c.dodge > 0 && Math.random() < c.dodge) ev.push("Sıyrıldın");
      else c.hp = Math.max(0, c.hp - (atkA.toChamp * 100) / (100 + c.def * 6));
      if (c.heal > 0 && c.hp > 0) {
        c.hp = Math.min(c.maxHp, c.hp + c.maxHp * c.heal);
        ev.push("Ruh şifası");
      }
    }
    this.a = atkA.out;
    this.b = atkB.out;
    if (boss && boss.hp <= 0) ev.push(`${boss.name} düştü!`);
    let rage: BossMove | null = null;
    let phase: string | undefined;
    if (boss && this.kit && !this.raged && boss.hp > 0 && boss.hp <= this.bossMax * 0.5) {
      this.raged = true;
      boss.atk *= this.kit.rage.atk;
      ev.push(`${this.kit.rage.name}!`);
      phase = this.kit.rage.text;
      rage = this.kit.rage.move;
    }
    this.morale(prevA, prevB, order, ev);
    let say: string | undefined;
    if (boss && this.kit && boss.hp > 0) {
      const line = (k: Parameters<typeof bossLine>[2]) => bossLine(boss.name, this.kit!.theme, k) ?? undefined;
      if (phase) say = line("rage");
      else if (roundMove) say = line(roundMove.countered ? "hurt" : "hit");
      else if (!this.lowSaid && boss.hp < this.bossMax * 0.25) {
        this.lowSaid = true;
        say = line("low");
      } else if (Math.random() < 0.3) say = line("taunt");
    }
    const round: Round = { a: { ...this.a }, b: { ...this.b }, hp: c?.hp ?? 0, bhp: boss?.hp ?? 0, ev, order, ma: this.ma, mb: this.mb, move: roundMove, phase, say };
    this.rounds.push(round);
    if (
      !!this.rout ||
      this.r >= this.maxR ||
      !this.aAlive() ||
      !this.bAlive() ||
      (c && c.hp <= 0) ||
      (!boss && armySize(this.b) < armySize(this.b0) * 0.2) ||
      (!c && armySize(this.a) + armySize(this.resv) < armySize(this.a0) * 0.25)
    )
      this.over = true;
    if (!this.over && boss && boss.hp > 0 && this.kit) {
      if (rage) {
        this.setTell(rage, round);
        this.lastMove = rage;
        this.tellCd = 2;
      } else if (--this.tellCd <= 0) {
        const m = this.pickMove();
        if (m) {
          this.setTell(m, round);
          this.lastMove = m;
          this.tellCd = this.raged ? 2 : 3;
        }
      }
    }
    return round;
  }

  private morale(prevA: number, prevB: number, order: Order | undefined, ev: string[]): void {
    const { c, boss } = this;
    const nA0 = Math.max(1, armySize(this.a0));
    const nB0 = Math.max(1, armySize(this.b0));
    let da = 2 - ((prevA - armySize(this.a)) / nA0) * 128;
    let db = 2 - ((prevB - armySize(this.b)) / nB0) * 128;
    if (order === "nara") da += 14;
    if (order === "yedek") {
      da += 18;
      db -= 5;
    }
    if (order === "kanat") db -= 8;
    if (order === "yagmur") db -= 6;
    if (ev.includes("Turan taktiği: düşman yemi yuttu!")) db -= 16;
    if (ev.includes("Safları bozuldu!")) db -= 6;
    const kin = this.kin;
    if (kin) {
      if (db < 0) db *= kin.fear;
      if (kin.dread) da -= kin.dread;
    }
    if (c) {
      if (c.hp <= 0) da -= 40;
      else if (c.hp > c.maxHp * 0.5) da += 2;
      else if (c.hp < c.maxHp * 0.3) da -= 4;
    }
    if (boss && boss.hp > 0) db = Math.max(db, 0);
    this.ma = Math.max(c && c.hp > c.maxHp * 0.5 ? 25 : 0, Math.min(100, this.ma + da));
    this.mb = Math.max((boss && boss.hp > 0) || kin?.fear === 0 ? 30 : 0, Math.min(100, this.mb + db));
    if (this.mb <= 0 && !boss && armySize(this.b) > 0) {
      this.rout = "b";
      ev.push("Düşman bozguna uğradı!");
    } else if (this.ma <= 0 && armySize(this.a) > 0) {
      this.rout = "a";
      ev.push("Askerlerin dağıldı!");
    }
  }

  finish(): BattleResult {
    while (!this.over) this.step();
    const { c, boss, a0, b0, aBonus, bBonus, resv } = this;
    const alive = this.aAlive();
    this.resv = { ...NONE };
    let a = { ...this.a };
    let b = this.b;
    const heroDown = !!c && c.hp <= 0;
    let win: boolean;
    if (this.rout) win = this.rout === "b" && !heroDown;
    else if (boss) win = boss.hp <= 0 && !heroDown && alive;
    else {
      const full = { ...a };
      for (const u of UNIT_KEYS) full[u] += resv[u];
      const startA = armyPower(a0, aBonus) + champPow(c, this.champ?.hp ?? 0);
      const endA = armyPower(full, aBonus) + champPow(c, c?.hp ?? 0);
      win = !heroDown && endA / Math.max(1, startA) >= armyPower(b, bBonus) / Math.max(1, armyPower(b0, bBonus)) && alive;
    }
    if (win) b = { ...NONE };
    else for (const u of UNIT_KEYS) a[u] = Math.floor(a[u] * 0.6);
    for (const u of UNIT_KEYS) a[u] += resv[u];
    const rounds = [...this.rounds, { a: { ...a }, b: { ...b }, hp: c?.hp ?? 0, bhp: boss?.hp ?? 0, ev: [] }];
    const lostA = { spear: a0.spear - a.spear, archer: a0.archer - a.archer, horse: a0.horse - a.horse };
    const lostB = { spear: b0.spear - b.spear, archer: b0.archer - b.archer, horse: b0.horse - b.horse };
    return { rounds, win, lostA, lostB, heroHp: Math.round(c?.hp ?? 0), heroDown, bossDown: !!boss && boss.hp <= 0, orders: [...this.used], rout: this.rout };
  }
}

export function fight(a0: Army, aBonus0: number, b0: Army, bBonus = 0, champ: Champion | null = null, boss0: Boss | null = null, field: Field | null = null, reserve = false, aMul: UnitMul = NO_MUL): BattleResult {
  return new Sim(a0, aBonus0, b0, bBonus, champ, boss0, field, reserve, aMul).finish();
}

export type Tactic = "hucum" | "duvar" | "pusu";
export const TACTIC_KEYS: Tactic[] = ["hucum", "duvar", "pusu"];
export const TACTICS: Record<Tactic, { name: string; icon: string; unit: Unit; beats: Tactic; text: string; foe: string }> = {
  hucum: { name: "Hücum", icon: "u_cavalry", unit: "horse", beats: "pusu", text: "Atlılar önde, düşmanı ezip geç.", foe: "hücuma kalkacak" },
  duvar: { name: "Kalkan Duvarı", icon: "u_spear", unit: "spear", beats: "hucum", text: "Mızraklılar saf tutar, okçular arkadan vurur.", foe: "kalkan duvarı kuruyor" },
  pusu: { name: "Pusu", icon: "u_archer", unit: "archer", beats: "duvar", text: "Yandan dolaş, ilk oku sen at.", foe: "pusu kuruyor" },
};

export function tacticDelta(t: Tactic, foe: Tactic, a: Army, cev: number): number {
  const n = Math.max(1, armySize(a));
  let d = TACTICS[t].beats === foe ? 0.25 : TACTICS[foe].beats === t ? -0.2 : 0;
  d += (a[TACTICS[t].unit] / n) * 0.15;
  if (t === "pusu") d += Math.min(0.1, cev * 0.008);
  return d;
}

export function stanceWeights(b: Army, boss: Boss | null): Record<Tactic, number> {
  const n = Math.max(1, armySize(b));
  const w = { hucum: b.horse / n + 0.2, duvar: b.spear / n + 0.2 + (boss ? 0.4 : 0), pusu: b.archer / n + 0.2 };
  const t = w.hucum + w.duvar + w.pusu;
  return { hucum: w.hucum / t, duvar: w.duvar / t, pusu: w.pusu / t };
}

/** Aynı girdiyle kısa süre içinde tekrar sorulan olasılıklar önbellekten gelir: her biri 40 savaş simülasyonu. */
const ODDS_TTL = 1500;
const oddsCache = new Map<string, { t: number; v: number }>();

export function odds(a: Army, aBonus: number, b: Army, bBonus = 0, champ: Champion | null = null, boss: Boss | null = null, field: Field | null = null, aMul: UnitMul = NO_MUL): number {
  const key = JSON.stringify([a, aBonus.toFixed(3), b, bBonus.toFixed(3), champ, boss, field, aMul]);
  const now = performance.now();
  const hitC = oddsCache.get(key);
  if (hitC && now - hitC.t < ODDS_TTL) return hitC.v;
  let w = 0;
  for (let k = 0; k < 40; k++) if (fight(a, aBonus, b, bBonus, champ, boss, field, false, aMul).win) w++;
  const v = w / 40;
  if (oddsCache.size > 200) for (const [k, e] of oddsCache) if (now - e.t >= ODDS_TTL) oddsCache.delete(k);
  if (oddsCache.size > 400) oddsCache.clear();
  oddsCache.set(key, { t: now, v });
  return v;
}
