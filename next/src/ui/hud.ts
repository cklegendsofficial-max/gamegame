import { LORD_SERAIS, NEWS_GOLD, VAKIF, type Game, type Hint, type Quest, type Target } from "../game/game";
import { BUILDINGS, DAY_SEC, NODE_NAME, RES_ICON, RES_KEYS, RES_NAME, UNITS, UNIT_KEYS, armySize, buildCost, buildTime, prodPerMin, unitUnlocked, xpNeed, type Army, type Res, type Unit } from "../game/data";
import { FORM_LANE_NAME, FORM_LANES, FORM_DEFAULT, GROUNDS, ORDERS, ORDER_KEYS, RESERVE_MIN, SKIES, TACTICS, TACTIC_KEYS, UNIT_FORM_NAME, type BattleResult, type Boss, type Field, type FormLane, type Order, type Sim, type Tactic } from "../game/battle";
import { BattleField } from "./battleField";
import { ARENAS, COUNTER, KINS, MOVE_HINT, bossKit } from "../game/bosses";
import { tamgaCanvas } from "../game/ozan";
import { SpiritView, type Realm } from "./spirit";
import { openDestan } from "./destan";
import { CityScene, JourneyView, type CitySceneData } from "./journey";
import { GOODS, GOOD_KEYS, PLUS_CHANCE, RARITY, SKILL_INFO, SKILL_KEYS, SLOTS, SLOT_NAME, STAT_INFO, STAT_KEYS, canPlus, itemStats, kindName, plusCost, skillLv, skillNext, type Item, type Slot } from "../game/rpg";
import { ARMOR_NAME, CLASSES, CLASS_ULTI, SKILL_MAX, WEAPON_NAME, skillPow, skillRank, type ClassId } from "../game/classes";
import { CAPITAL, SAVE_SLOTS, curSlot, exportSave, kurganBoss, slotInfo } from "../game/state";
import { applyUi, haptic, saveSettings, setGfx, settings, toggleFullscreen } from "../settings";
import { ACHIEVEMENTS } from "../game/achievements";
import { BRANCHES, BRANCH_KEYS, ROW_NEED, TALENTS, branchSpent } from "../game/talents";
import { CONSUMABLES, CONS_BY_ID, CRAFT_MATS, CRAFT_SLOTS, MASTERY, MAT_BY_ID, REFINES, RUNES, RUNE_BY_ID, SIGNATURES, isStoreMat, type Cost, type Mat } from "../game/crafting";
import { SIDE_TEXT, type SideQuest } from "../game/sidequests";
import { CHAINS } from "../game/chains";
import { CITY_NAME } from "../game/data";
import { ACT2, ACT3, CHAPTERS, COMPANIONS, COMP_BY_ID, COMP_MAX, ERLIK, FORT_GUARD, GATE_GUARD, KARA_HAN, ENDINGS, KOK_BORU, PEAK_GUARD, endingOf, type CompId } from "../game/story";
import { LEGACY_PERKS, legacy } from "../game/legacy";
import { HERD_BUY, HERD_GOLD, HERD_MAX, MOVE_FOOD, OTAG_GOLD, OTAG_WOOD, REST_FOOD, ZONE_DESC, ZONE_NAME, bestZone, zoneOf } from "../game/otag";
import { VET_LV_MAX, VET_MAX, VET_RANKS, vetBonus, vetTitle } from "../game/vets";
import { PERSONAS, PERSONA_KEYS } from "../game/director";
import { heirOf, kidAge } from "../game/dynasty";
import { BOYS } from "../game/korkut";
import { Archery, type ArchMode } from "./archery";
import { Wrestle } from "./wrestle";
import { KokBoru } from "./kokboru";
import { Gamepad, type PadButton } from "./gamepad";
import { CODEX, CODEX_CATS, codexText, codexTitle, type CodexCat } from "../game/codex";
import { KUT_TIERS, kutArmy, kutTier, kutVote } from "../game/kut";
import { SING_GOLD, TAMGA_COLORS, TAMGA_DEFAULT, TAMGA_MARKS, TAMGA_SHAPES, singRenown, tamgaSvg, type Tamga } from "../game/ozan";
import { CITIES, H, NAV, NH, NW, W } from "../world/gen";
import { assetUrl } from "../render/assets";
import { audio, type MusicScene } from "../audio";
import { CHEST10_PRICE, CHEST_PITY, CHEST_PRICE, CHEST_TABLE, COSMETICS, PASS, PASS_STEP, PASS_TIERS, PRODUCTS, PRODUCT_BY_ID, SPENDS, rewardIcon, rewardText, seasonLeftDays, type CosKind, type Cosmetic, type Product, type Reward } from "../game/shop";
import type { ChestDrop } from "../game/treasury";
import { canNarrate, hush, narrate, speaking } from "../narrator";
import { LANGS, lang, t, t as tr, type Lang } from "../i18n";
import { cloudPush, cloudReady, onDeck, steam } from "../platform";
import { WEEK_TIERS, weekEnd, weekNeed, weekReward, weekTheme } from "../game/weekly";
import { loadedMods, modBridge, removeMod, storeMod, storedMods, toggleMod } from "../mods";
import { ROUTE as MONGOL_ROUTE } from "../game/mongol";
import { AREA_BOSSES, LEGIONS, RARE_INFO, RARE_MATS, RELICS, YORE, bossLine, bossRegion, denBoss, denGuard, type RareMat } from "../game/regions";
import { DIFFS, DRILL, DRILL_MAX, DRILL_XP, ELITE, FEALTY_REP, FEALTY_FEE, SPECS, TAX as REALM_TAX, sparkline, type Diff, type Tax } from "../game/reforms";
import { techRailStatus } from "../game/techRail";
import { KIP_FOOD, KIP_GIFT, KIP_GIFT_REP, KIP_HIRE_GAP, KIP_HIRE_N, KIP_MIN_LV, KIP_STEPS, STONES, kipBoss, kipFortArmy, kipHireCost } from "../game/kipchak";

const MOD_LABEL: Record<string, string> = { atk: "saldırı", army: "ordu gücü", heal: "iyileşme", xp: "tecrübe", trade: "ticaret", speed: "hız", sight: "görüş" };
const SCORE_LABEL: Record<string, string> = {
  profit: "kâr (altın)", contracts: "emanet", rescued: "kurtarılan kervan", wins: "zafer", camps: "kamp", slain: "can düşmanı", kurgans: "Kurgan Taşı",
  floors: "derinlik katı", crafted: "eşya", trains: "talim", sides: "şehir görevi", conquests: "fetih", beyq: "bey isteği", voyages: "Hazar seferi",
};
import { SUREK_FOOD } from "../game/games";
import { GIFT_GOLD, PEACE_GOLD, SPY_MAX, SPY_OPS, TRADE_GOLD, spyCost } from "../game/spy";
import { MYCV_COST, MYCV_GUARD, MYCV_GUARD_MAX, MYCV_INSURE, MYCV_UPGRADE, mycvRoute } from "../game/mycaravan";
import { ARTISAN_COOLDOWN_DAYS, CRAFTSMAN_BY_CITY, CRAFTSMEN } from "../game/artisans";
import type { Good } from "../game/rpg";
import { BALBAL_GOLD, BALBAL_MAX, BALBAL_STONE, FOE_KIND, balbalBonus, yugCost } from "../game/yug";
import { SIEGE_ACTS, SIEGE_MAX_DAY, parleyChance, siegeGar, siegePhase, type SiegePhase } from "../game/siege";
import { FORT_COFFER_DAYS, FORT_TIERS, FORT_WALL_MAX, fortDefense, fortWall } from "../game/forts";
import { ORIGINS, ORIGIN_BY_ID, type Origin, type OriginId } from "../game/origins";
import { BOND_LIKES, BOND_LIKES_EN, BOND_QUEST, COMP_BATTLE_BARK, COMP_QUESTS, SWORN_MULT, bondTier } from "../game/bonds";
import { BOSS_UNIQUES, SETS, SET_FORGE, SET_KEYS, SET_SLOTS, UNIQUES, modsText, type SetId } from "../game/legend";
import { FACTIONS, FACTION_KEYS, HOSTILE, OCCUPY, REP_RANKS, RANK_PERKS, factionOf } from "../game/factions";
import { RUIN_KINDS, ruinKind } from "../game/delve";
import { CAPTIVE_MAX, GUILD, GUILD_PERKS } from "../game/saga";
import { ERAS, RULER_TRAITS, WOLF_MAX, WOLF_PACK_AT, favTactic, moonPhase, shortMult } from "../game/world";
import { BRO_MODS, NEM_TRAITS, diyetCost, nemName } from "../game/nemesis";
import { BIRDS, birdSight, birdXpNeed } from "../game/falcon";
import { BREEDS, BREED_GOLD, BREED_TIME } from "../game/horse";
import { TITLE_CATS, titleKey, titleOf } from "../game/titles";
import { DAILY_POOL } from "../game/daily";
import { REQ_INFO, RIVAL_TRAITS, STATUS_NAME } from "../game/rivals";
import { DECREES } from "../game/kurultay";
import { ESCORT_GOLD, SHIP_CAP, SHIP_GOLD, SHIP_MAX, portOf, routesFrom } from "../game/hazar";
import { DEEP_PERKS, TOMBS, tombOf } from "../game/deep";
import { ARMY_ORDERS, CITY_BLDS, CITY_BLD_KEYS, CITY_POLICIES, ENGINE_GOLD as ENGINE_GOLD_UI, FEAST_GOLD as FEAST_GOLD_UI, GOVERNORS, GOV_GOLD, SIEGE_LV, SIEGE_RENOWN, TAX as TAX_UI, cityBldCost, type ArmyOrder, type CityPolicy } from "../game/conquest";

const WEAPON_ICON: Record<string, string> = { kilic: "it_sword_", balta: "it_axe_", hancer: "it_dagger_", ok: "it_bow_", asa: "it_staff_" };

const ic = (k: string, cls = "ic") => `<img class="${cls}" src="${assetUrl(k)}" alt="">`;
const CAP_I = CITIES.findIndex((c) => c.id === "samarkand");
const JOURNEY_SPEED = 4;
const RIVAL_CSS: Record<string, string> = { peace: "#e8d39a", ally: "#6fe07a", war: "#ff4a3a", vassal: "#ffc94a", dead: "#888" };
/** Savaş kiti şeridinde her beceri türünün ne zaman devreye girdiğini anlatan kısa etiket. */
const KIT_KIND_LABEL: Record<string, string> = { burst: "3 turda bir", poison: "Her tur", evade: "Sürekli", shield: "İlk 3 tur", aura: "Sürekli", fury: "Sürekli", steal: "Zafer sonrası", drain: "Her tur", stun: "4 turda bir", slayer: "Sürekli", rally: "4 turda bir", heal: "Her tur" };
/** Kuşatma sahnesi: evreye göre mevcut arena görselleri yeniden kullanılır (sur dövülürken, gedik açılınca, son hücumda iç kale). */
const SIEGE_PHASE_ARENA: Record<SiegePhase, keyof typeof ARENAS> = { bombard: "sur", breach: "kale", assault: "avlu" };
const SIEGE_PHASE_LABEL: Record<SiegePhase, string> = { bombard: "Surlar dövülüyor", breach: "Gedik açıldı", assault: "İç kaleye son hücum" };

/** Uzun hikâye metnini paragraf sınırlarından en çok üç sayfaya böler. */
function storyPages(html: string): string[] {
  const plain = (s: string) => s.replace(/<[^>]+>/g, "").length;
  if (!settings.pages || plain(html) < 520) return [html];
  const paras = html.split(/(?:<br\s*\/?>\s*){2,}/);
  if (paras.length < 2) return [html];
  const pages: string[] = [];
  let cur = "";
  for (const para of paras) {
    if (cur && plain(cur) + plain(para) > 380 && pages.length < 2) {
      pages.push(cur);
      cur = para;
    } else cur = cur ? `${cur}<br><br>${para}` : para;
  }
  if (cur) pages.push(cur);
  return pages;
}

function fmt(n: number): string {
  n = Math.floor(n);
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".0", "") + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

function dur(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}sn`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}dk ${s % 60}sn`;
  return `${Math.floor(m / 60)}sa ${m % 60}dk`;
}

function costHtml(c: Partial<Res>, g: Game): string {
  return RES_KEYS.filter((k) => (c[k] ?? 0) > 0)
    .map((k) => `<span class="cost ${g.s.res[k] < (c[k] ?? 0) ? "no" : ""}">${ic(RES_ICON[k])}${fmt(c[k] ?? 0)}</span>`)
    .join("");
}

function armyHtml(a: Army, cls = "", names?: Partial<Record<Unit, string>>): string {
  return `<div class="army ${cls}">${UNIT_KEYS.map((u) => {
    const label = names?.[u];
    return `<span class="u" title="${label ?? UNITS[u].name}">${ic(UNITS[u].icon)}<b>${a[u]}</b>${label ? `<em>${label}</em>` : ""}</span>`;
  }).join("")}</div>`;
}

function bar(v: number, max: number, cls = "", label = ""): string {
  return `<div class="bar ${cls}"><i style="width:${Math.max(0, Math.min(100, (v / Math.max(1, max)) * 100))}%"></i><span>${label || `${Math.floor(v)}/${Math.floor(max)}`}</span></div>`;
}

export class Hud {
  private root = document.getElementById("hud")!;
  private top!: HTMLElement;
  private questEl!: HTMLElement;
  private sagaEl!: HTMLElement;
  private taskEl!: HTMLElement;
  private mogEl!: HTMLElement;
  private trackEl!: HTMLElement;
  private moreEl!: HTMLElement;
  private bondPulseEl!: HTMLElement;
  private trackOpen = false;
  private ufukAt = 0;
  private bondPulseAt = 0;
  private narrow = matchMedia("(max-width: 760px)");
  private jv: JourneyView | null = null;
  private cs: CityScene | null = null;
  private interiorSeen = new Set<string>();
  private interiorBusy = false;
  private actEl!: HTMLElement;
  private panel!: HTMLElement;
  private toasts!: HTMLElement;
  private mini!: HTMLCanvasElement;
  private birdBtn!: HTMLButtonElement;
  private miniBase!: HTMLCanvasElement;
  private acts = new Map<string, () => void>();
  private actN = 0;
  private panelHtml = "";
  private panelKey = "";
  private htmlCache = new WeakMap<Element, string>();
  private fogRev = -1;
  private fogC?: HTMLCanvasElement;
  private place: Target | { kind: "hero" } | null = null;
  private tab = "";
  private liveT = 0;
  private miniT = 0;
  private panelT = 0;
  private holding = false;
  private sel: Army = { spear: 0, archer: 0, horse: 0 };
  battleOpen = false;
  private storyOpen = false;

  /** Ekranı kaplayan bir savaş/hikâye penceresi açık mı. */
  get covered(): boolean {
    return this.battleOpen || this.storyOpen || !!this.root.querySelector(".battle");
  }
  private sagaOpen = false;
  private craftTier = 1;
  private craftMat: Partial<Record<Slot, string>> = {};
  private forgePick: SetId = "gokkurt";
  private allSongs = false;

  private sideEl!: HTMLElement;

  private topSide(): SideQuest | null {
    const q = this.g.s.sideQ;
    return q.find((x) => this.g.sideReady(x)) ?? q[0] ?? null;
  }

  private sideRow(q: SideQuest, right: string): string {
    const g = this.g;
    const p = Math.max(0, Math.min(q.need, g.sideProg(q)));
    const ready = p >= q.need;
    const back = ready ? `<small class="cheap">Tamamlandı — ${CITY_NAME[g.sideTurnIn(q)]} şehrine dön</small>` : q.need > 1 ? `<small>İlerleme ${p}/${q.need}</small>` : "";
    return `<div class="grow sq">${ic(SIDE_TEXT[q.kind].icon, "gimg")}<div class="bi2"><b>${q.title}</b><small class="dim">${q.giver}</small><small>${q.text}</small>${back}<small>${ic("coins")}${q.gold} · ${ic("scroll")}${q.xp} TP · ${ic("crown")}${q.renown}${q.item ? ` · ${ic("chest")}eşya` : ""}</small></div>${right}</div>`;
  }

  private boardHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const mine = s.sideQ.filter((q) => q.city === city || g.sideTurnIn(q) === city);
    const why = g.sideReason(city);
    return (
      `<h3>${ic("quest")} Şehir görevleri <em>${s.sideQ.length}/3</em></h3>` +
      mine.map((q) => this.sideRow(q, `<button class="btn sm" data-a="${this.act(() => g.dropSide(q.id))}">Bırak</button>`)).join("") +
      (g.sideBoard(city).map((q) => this.sideRow(q, `<button class="btn sm ${why || !near ? "off" : ""}" data-a="${this.act(() => g.takeSide(city, q.id))}">Al</button>`)).join("") || `<p class="dim">Bugünlük iş kalmadı. Yarın yeni ilanlar asılır.</p>`)
    );
  }

  private runePick: Record<number, string> = {};

  /** Bölge bosslarından düşen nadir malzemelerle dökülen efsaneler. */
  private relicsHtml(zl: number): string {
    const g = this.g;
    const s = g.s;
    const have = RARE_MATS.filter((m) => (s.mats[m] ?? 0) > 0);
    const pouch = `<div class="rarepouch">${RARE_MATS.map((m) => `<span class="rmat ${(s.mats[m] ?? 0) ? "" : "none"}" title="${RARE_INFO[m].name}: ${RARE_INFO[m].desc}">${ic(RARE_INFO[m].icon)}<b>${s.mats[m] ?? 0}</b></span>`).join("")}</div>`;
    return `<h3>${ic("mt_gokdemir")} ${t("Bölge efsaneleri")}</h3><p class="dim">${t("Bölge bosslarından düşen nadir malzemelerle dövülür. Her bölgenin bossu saatte bir yeniden uyanır; çeteler ve kamplar da az da olsa malzeme bırakır.")}</p>${pouch}` +
      (have.length || (s.relics ?? []).length ? "" : `<p class="dim">${t("Henüz nadir malzemen yok. Haritadaki boss inlerini ara.")}</p>`) +
      RELICS.map((r) => {
        const why = g.relicReason(r.id);
        const locked = zl < r.zl;
        const made = (s.relics ?? []).includes(r.id);
        return `<div class="grow relic ${locked ? "locked" : ""}"><div class="icard r4">${ic(r.icon, "gimg")}</div><div class="bi2"><b class="r4">${r.name}${made ? ` <em>${t("dövüldü")}</em>` : ""}</b><small>${r.desc}</small><small>${this.matsHtml(r.cost as Cost)}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why ? "off" : "go"}" data-a="${this.act(() => g.craftRelic(r.id))}">${t("Döv")}</button></div>`;
      }).join("");
  }

  /** Yeni bir bölgeye girerken ekranın üstünde beliren başlık. */
  regionBanner(name: string, text: string, boss: string, tries = 0): void {
    // Seviye atlama afişi öncelikli: bitene kadar bekle (üst üste binmesin)
    if (this.root.querySelector(".lvup") || this.root.querySelector(".regban")) {
      if (tries < 16) setTimeout(() => this.regionBanner(name, text, boss, tries + 1), 800);
      return;
    }
    const el = document.createElement("div");
    el.className = "regban";
    el.innerHTML = `<b>${t(name)}</b><small>${t(text)}</small>${boss ? `<em>${ic("swords")} ${boss}</em>` : ""}`;
    this.root.appendChild(el);
    setTimeout(() => el.classList.add("out"), 4200);
    setTimeout(() => el.remove(), 5200);
  }

  private runesHtml(zl: number): string {
    const g = this.g;
    const s = g.s;
    const gear = SLOTS.map((sl) => s.hero.equip[sl]).filter((it): it is Item => !!it);
    const head = `<h3>${ic("rune")} ${tr("Orhun rünleri")} <em>${ic("nisan")} ${s.mats.nisan ?? 0}</em></h3><p class="dim">${tr("Her boss zaferi Alp Nişanı getirir. Kuşandığın eşyaya bir rün kazı; yeni rün eskisini siler.")}</p>`;
    if (!gear.length) return head + `<p class="dim">${tr("Önce bir eşya kuşan.")}</p>`;
    return (
      head +
      gear
        .map((it) => {
          const rs = RUNES.filter((r) => r.slots.includes(it.slot));
          const pick = RUNE_BY_ID[this.runePick[it.id] ?? ""] ?? rs.find((r) => r.id !== it.rune && zl >= r.zl) ?? rs[0];
          const cur = it.rune ? RUNE_BY_ID[it.rune] : null;
          const why = g.runeReason(it.id, pick.id);
          const chips = rs.map((r) => `<button class="chip rune ${r.id === pick.id ? "on" : ""} ${zl < r.zl ? "lock" : ""}" title="${r.desc}" data-a="${this.act(() => (this.runePick[it.id] = r.id))}"><span class="rglyph">${r.glyph}</span> ${r.name}${zl < r.zl ? ` 🔒${r.zl}` : ""}</button>`).join("");
          return `<div class="grow">${ic(it.icon, "gimg")}<div class="bi2"><b class="r${it.rar}">${it.name}</b><small>${cur ? `<span class="rglyph on">${cur.glyph}</span> ${cur.name}: ${modsText(cur.mods)}` : `<span class="dim">${tr("Rün kazınmamış")}</span>`}</small><div class="matrow">${chips}</div><small class="cheap">${pick.desc}</small><small>${this.matsHtml(pick.cost)}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.engraveRune(it.id, pick.id))}">${tr("Kazı")}</button></div>`;
        })
        .join("")
    );
  }

  private matsHtml(c: Cost): string {
    const rows = (Object.entries(c) as [Mat, number][])
      .map(([m, v]) => {
        const rare = RARE_INFO[m as RareMat];
        const icon = m === "gold" ? "coins" : rare ? rare.icon : isStoreMat(m) ? m : GOODS[m].icon;
        const have = this.g.matHave(m);
        return `<span class="mat ${rare ? "rare" : ""} ${have < v ? "lack" : ""}" ${rare ? `title="${rare.name}"` : ""}>${ic(icon)}${m === "gold" ? v : `${have}/${v}`}</span>`;
      })
      .join(" ");
    const lack = (Object.entries(c) as [Mat, number][]).some(([m, v]) => this.g.matHave(m) < v && m !== "gold");
    const shop = lack
      ? ` <button type="button" class="btn xs go mat-go" data-a="${this.act(() => this.openPlaceTab("pazar"))}">${ic("coins")} ${t("Pazara git")}</button>`
      : "";
    return rows + shop;
  }

  constructor(private g: Game) {
    this.root.innerHTML = `
      <div class="top"></div>
      <div class="track"><button class="destanchip">${ic("scroll")}<span>${t("Destan")}</span></button><div class="quest"></div><div class="quest saga hidden"></div><div class="quest task hidden"></div><div class="quest sq hidden"></div><div class="quest mog hidden"></div><button class="qmore hidden"></button></div>
      <div class="toasts"></div>
      <div class="rumor"></div>
      <div class="notes"></div>
      <div class="actbar hidden"></div>
      <div class="bottom">
        <button data-b="capital"><img class="bi" src="${assetUrl("cities/samarkand")}" alt=""><span>${t("Semerkant")}</span></button>
        <button data-b="hero"><img class="bi round" src="${assetUrl("heroes/slave")}" alt=""><span>${t("Kahraman")}</span></button>
        <button data-b="ufuk" class="ufukbtn"><b class="bi">✦</b><span>${t("Ufuk")}</span></button>
        <button data-b="find">${ic("tug", "bi")}<span>${t("Birliğim")}</span></button>
        <button data-b="shop" class="shopbtn">${ic("sandik", "bi")}<span>${t("Hazine")}</span><i class="badge hidden"></i></button>
        <button data-b="snd" class="snd ${audio.muted ? "off" : ""}"><b class="bi">♪</b><span>${t("Ses")}</span></button>
      </div>
      <canvas class="mini" width="220" height="128" title="${t("Tıkla: git · tekerlek: yakınlaş")}"></canvas>
      <div class="bondpulse hidden" aria-hidden="true"></div>
      <div class="pckeys" aria-hidden="true"><kbd>WASD</kbd><kbd>H</kbd><kbd>U</kbd><kbd>O</kbd><kbd>Space</kbd><kbd>+/−</kbd></div>
      <button class="birdbtn hidden"><img alt=""><span></span></button>
      <div class="panel hidden"></div>`;
    this.top = this.root.querySelector(".top")!;
    this.top.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("[data-spd]")) this.cycleSpeed();
      if ((e.target as HTMLElement).closest("[data-shop]")) this.openShop("yarmak");
    });
    this.questEl = this.root.querySelector(".quest")!;
    this.sagaEl = this.root.querySelector(".saga")!;
    this.taskEl = this.root.querySelector(".task")!;
    this.sideEl = this.root.querySelector(".quest.sq")!;
    this.mogEl = this.root.querySelector(".quest.mog")!;
    this.trackEl = this.root.querySelector(".track")!;
    this.moreEl = this.root.querySelector(".qmore")!;
    this.bondPulseEl = this.root.querySelector(".bondpulse")!;
    this.bondPulseEl.addEventListener("click", () => {
      this.openHero();
      this.tab = "ordu";
      this.render();
    });
    this.root.querySelector(".destanchip")!.addEventListener("click", () => this.openDestan());
    this.moreEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.trackOpen = !this.trackOpen;
      this.foldTrack();
    });
    this.mogEl.addEventListener("click", () => {
      const m = g.s.mongol;
      if (m?.stage === 2) g.mongolMenu();
    });
    this.sideEl.addEventListener("click", () => {
      const q = this.topSide();
      const p = q && g.sideGoto(q);
      if (p) g.cam.flyTo(p.x, p.y, Math.max(g.cam.zoom, 0.65));
    });
    this.taskEl.addEventListener("click", () => {
      const r = g.s.raid;
      if (r) {
        const v = g.s.villages[r.v];
        g.cam.flyTo(v.x, v.y, Math.max(g.cam.zoom, 0.65));
        return;
      }
      const war = g.s.rivals.find((x) => x.status === "war");
      if (war) {
        g.cam.flyTo(war.x, war.y, Math.max(g.cam.zoom, 0.75));
        return;
      }
      const ask = g.s.rivals.find((x) => x.req);
      if (ask) {
        const p = g.reqGoto(ask) ?? ask;
        g.cam.flyTo(p.x, p.y, Math.max(g.cam.zoom, 0.7));
        return;
      }
      const c = g.s.contract;
      const to = c?.to ?? g.s.fleet.voyage?.to;
      const p = to ? CITIES.find((x) => x.id === to) : null;
      if (p) g.cam.flyTo(p.x, p.y, Math.max(g.cam.zoom, 0.65));
    });
    this.sagaEl.addEventListener("click", () => {
      const p = g.chapter()?.goto(g);
      if (p) g.cam.flyTo(p.x, p.y, Math.max(g.cam.zoom, 0.65));
    });
    this.actEl = this.root.querySelector(".actbar")!;
    this.panel = this.root.querySelector(".panel")!;
    this.toasts = this.root.querySelector(".toasts")!;
    this.mini = this.root.querySelector(".mini")!;
    this.root.querySelector(".bottom")!.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("button")?.dataset.b;
      if (b === "capital") this.openPlace({ kind: "capital" });
      if (b === "hero") this.openHero();
      if (b === "ufuk") {
        this.openHero();
        this.tab = "ufuk";
        this.render();
      }
      if (b === "find") {
        this.close();
        g.cam.flyTo(g.s.hero.x, g.s.hero.y, Math.max(g.cam.zoom, 0.7));
      }
      if (b === "snd") this.root.querySelector(".snd")!.classList.toggle("off", audio.toggle());
      if (b === "shop") this.openShop();
    });
    window.addEventListener("pointerdown", () => audio.unlock());
    this.root.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("button")) audio.play("click");
      const el = (e.target as HTMLElement).closest("[data-a]") as HTMLElement | null;
      if (!el || el.classList.contains("off")) return;
      this.acts.get(el.dataset.a!)?.();
    });
    this.panel.addEventListener("pointerdown", () => (this.holding = true));
    window.addEventListener("pointerup", () => (this.holding = false));
    this.panel.addEventListener("change", (e) => {
      const el = e.target as HTMLSelectElement;
      const cv = el.dataset.cv;
      if (cv) {
        const [id, f] = cv.split(":");
        const v = el.value || null;
        g.setMyCv(Number(id), f === "to" ? { to: v! } : { [f]: v } as { go?: Good | null; back?: Good | null });
        this.render();
        return;
      }
      const cg = el.dataset.compgear;
      if (cg) {
        if (el.value) g.equipCompGear(cg as CompId, Number(el.value));
        this.render();
      }
    });
    this.panel.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      const k = el.dataset.set as "music" | "fx" | undefined;
      if (k) {
        settings[k] = Number(el.value) / 100;
        saveSettings();
        audio.volumes();
        const out = this.panel.querySelector(`[data-so="${k}"]`);
        if (out) out.textContent = el.value;
      }
      if (el.dataset.u) {
        this.sel[el.dataset.u as Unit] = Number(el.value);
        const out = this.panel.querySelector(`[data-o="${el.dataset.u}"]`);
        if (out) out.textContent = el.value;
        const ld = this.panel.querySelector("[data-load]");
        if (ld) ld.textContent = fmt(g.marchLoad(this.sel));
      }
    });
    this.questEl.addEventListener("click", () => {
      const q = g.quest();
      const p = q?.goto?.(g);
      if (p) g.cam.flyTo(p.x, p.y, Math.max(g.cam.zoom, 0.65));
      // Tutorial CTA: ilgili şehir sekmesini aç
      if (!q) return;
      const nearCap = Math.hypot(CAPITAL.x - g.s.hero.x, CAPITAL.y - g.s.hero.y) < 200;
      if (q.title.includes("Hürriyet") && nearCap) {
        this.openPlace({ kind: "capital" });
        this.tab = "efendi";
        this.render();
      } else if (q.title.includes("silah") && nearCap && g.s.free) {
        this.openPlace({ kind: "capital" });
        this.tab = "demirci";
        this.render();
      } else if (q.title.includes("döküm") && nearCap && g.s.free) {
        this.openPlace({ kind: "capital" });
        this.tab = g.atelierOpen() && Object.values(g.s.hero.cargo).some((v) => (v ?? 0) > 0) ? "atolye" : "pazar";
        this.render();
      } else if (q.title.includes("Destanın")) {
        const bi = CITIES.findIndex((c) => c.id === "bukhara");
        if (bi >= 0) this.openPlace({ kind: "city", i: bi });
      }
    });
    this.miniBase = document.createElement("canvas");
    this.miniBase.width = 220;
    this.miniBase.height = 128;
    this.miniBase.getContext("2d")!.drawImage(g.world.canvas, 0, 0, 220, 128);
    this.mini.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      const r = this.mini.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * W;
      const y = ((e.clientY - r.top) / r.height) * H;
      if (g.birdAim) g.sendBird(x, y);
      else g.cam.flyTo(x, y);
    });
    this.mini.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        g.cam.zoomBy(Math.exp(-e.deltaY * 0.002));
      },
      { passive: false },
    );
    this.birdBtn = this.root.querySelector(".birdbtn")!;
    this.birdBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    this.birdBtn.addEventListener("click", () => g.aimBird());
    const PAN = ["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"];
    const openTab = (tab: string) => {
      this.openHero();
      this.tab = tab;
      this.render();
    };
    window.addEventListener("keydown", (e) => {
      if ((e.target as HTMLElement).closest?.("input, textarea")) return;
      const k = e.key.toLowerCase();
      if (k === "escape") {
        if (this.cs) return this.cs.close();
        if (this.jv) return g.tripEnd();
        if (this.menuOpen) return this.closeMenu();
        if (!this.panel.classList.contains("hidden")) return this.close();
        if (!this.archery && !this.minigame && !this.modal() && !g.battleLock) this.openMenu();
        return;
      }
      if (this.menuOpen) return;
      if (PAN.includes(k)) {
        g.cam.keys.add(k);
        e.preventDefault();
        return;
      }
      if (e.repeat || this.battleOpen || this.storyOpen) return;
      if (k === "h") this.place?.kind === "hero" && this.tab === "karakter" ? this.close() : openTab("karakter");
      else if (k === "u" && g.s.free) this.place?.kind === "hero" && this.tab === "ufuk" ? this.close() : openTab("ufuk");
      else if (k === "o") this.place?.kind === "hero" && this.tab === "ordu" ? this.close() : openTab("ordu");
      else if (k === "c") this.openPlace({ kind: "capital" });
      else if (k === " ") {
        e.preventDefault();
        g.cam.flyTo(g.s.hero.x, g.s.hero.y, Math.max(g.cam.zoom, 0.7));
      } else if (k === "b" && g.s.bird && g.s.free) g.aimBird();
      else if (k === "m") this.root.querySelector(".snd")!.classList.toggle("off", audio.toggle());
      else if (k === "t") this.cycleSpeed();
      else if (k === "p" && !this.archery && !this.minigame && !this.modal() && !g.battleLock) this.openPhoto();
      else if (k === "f" || k === "f11") {
        e.preventDefault();
        toggleFullscreen();
      } else if (k === "+" || k === "=") g.cam.zoomBy(1.2);
      else if (k === "-") g.cam.zoomBy(1 / 1.2);
    });
    window.addEventListener("keyup", (e) => g.cam.keys.delete(e.key.toLowerCase()));
    window.addEventListener("blur", () => g.cam.keys.clear());
    this.gamepad = new Gamepad(this.root, {
      scope: () => {
        const ar = this.root.querySelector<HTMLElement>(".archery");
        if (ar) return ar.querySelector<HTMLElement>(".aresult.on");
        const ov = this.root.querySelectorAll<HTMLElement>(".battle");
        if (ov.length) return ov[ov.length - 1];
        return this.panel.classList.contains("hidden") ? null : this.panel;
      },
      shooting: () => (!!this.archery || !!this.minigame) && !this.root.querySelector(".archery .aresult.on"),
      shoot: () => (this.archery ? this.archery.shootAuto() : this.minigame?.press()),
      press: (b, ui) => this.padPress(b, ui),
      pan: (x, y) => {
        g.cam.pad.x = x;
        g.cam.pad.y = y;
      },
      zoom: (f) => g.cam.zoomBy(f),
    });
    const begin = (): void => {
      if (g.s.cls === null) setTimeout(() => this.classSelect(), 300);
      else if (!g.s.free && g.s.c.shifts === 0 && g.s.quest === 0) setTimeout(() => this.intro(), 400);
    };
    if (!navigator.webdriver || location.search.includes("title")) this.openMenu(true, begin);
    else begin();
  }

  private originIntro(): string {
    const o = this.g.s.origin ? ORIGIN_BY_ID[this.g.s.origin] : null;
    return o ? `<i>${lang() === "en" ? o.introEn : o.intro}</i><br><br>` : "";
  }

  private intro(): void {
    const done = (this.g.s.slaveEv ??= []);
    if (!done.includes("prolog")) this.prologRaid();
    else this.slaveBriefing();
  }

  /** İlk dakikada oynanabilir Kara Tamga baskını; sonra köle brifingi. */
  private prologRaid(): void {
    const g = this.g;
    (g.s.slaveEv ??= []).push("prolog");
    const name = g.s.hero.name;
    audio.play("story");
    const after = (path: "fight" | "hide" | "ayse", blocked = false) => {
      const flags = (g.s.story.flags ??= []);
      if (path === "fight") {
        g.s.hero.skills.silah += blocked ? 50 : 35;
        g.s.renown += blocked ? 3 : 2;
        flags.push("prolog_fight");
        if (blocked) flags.push("prolog_block");
        g.chron(
          blocked
            ? `${name}, Kara Tamga baskınında kalkan siperi tuttu; yine yenildi ama emir aklında kaldı.`
            : `${name}, Kara Tamga baskınında kılıç tuttu; yenildi ama eli silaha alıştı.`,
        );
      } else if (path === "hide") {
        g.s.res.gold += 8;
        g.s.hero.skills.emek += 20;
        flags.push("prolog_hide");
        g.chron(`${name}, baskında gölgelere çekildi; tabanına 8 akçe sakladı.`);
      } else {
        flags.push("prolog_ayse");
        g.chron(`${name}, baskında Ayşe'nin elini bıraktı ama söz verdi: bulacağım.`);
      }
      const end =
        path === "fight"
          ? blocked
            ? `Kalkanını kilitledin; ilk darbe çaldı. Yine de ikinci atlı seni yere çaldı. Ayşe'nin çığlığı uzaklaşırken gözlerin karardı.<br><br><i>"Bu çocuk satılır,"</i> dedi bir ses.`
            : `Kılıç elinde kırıldı. Bir atlı seni boynundan tutup yere çaldı. Ayşe'nin çığlığı uzaklaşırken gözlerin karardı.<br><br><i>"Bu çocuk satılır,"</i> dedi bir ses.`
          : path === "hide"
            ? `Keçe yığınında nefesini tuttun. Atlılar geçti; bir torbadan düşen akçeleri cebine attın. Sonra seni de buldular — ama kesen dolu çıktı.`
            : `Ayşe'nin elini sıktın: <i>"Bırakma."</i> Kalabalık sizi ayırdı. Son gördüğün, Merv yoluna götürülen kız kardeşinin sırtıydı.`;
      this.cinema(
        "cine/cine_yurt",
        t("Zincirler"),
        `${end}<br><br>Semerkant pazarında uyandın. Bileklerinde taze demir, efendinin sözü kulaklarında: <b>60 akçe</b> biriktirirsen hürsün.`,
        { done: () => this.slaveBriefing() },
      );
    };
    this.cinema(
      "cine/cine_grass",
      t("Kara Tamga baskını"),
      `Geceydi. Oba ateşleri sönmek üzereydi. Uzakta toynak sesi — fazla hızlı, fazla çok.<br><br>Kara Tamga atlıları ufuktan aktı. Annen seni itti: <i>"Kaç!"</i> Ayşe elini tuttu. Tuğlar kırılıyordu.<br><br><b>${name}</b>, bir anın içinde seçim yapmak zorundasın.`,
      {
        done: () => {
          this.choice(
            t("Baskın gecesi"),
            "j_bandit",
            t("Atlılar otağa girdi. Ne yaparsın?"),
            [
              {
                label: t("Kılıç kap · otağı savun"),
                cls: "go",
                fn: () => this.prologMicroBattle((ok) => after("fight", ok)),
              },
              {
                label: t("Gölgelere çekil · saklan"),
                cls: "",
                fn: () => after("hide"),
              },
              {
                label: t("Ayşe'nin elini tut · kaç"),
                cls: "",
                fn: () => after("ayse"),
              },
            ],
          );
        },
      },
    );
  }

  /** Savun yolu: tek tur tell + Nara/Siper — kaybedilir ama emir öğretilir. */
  private prologMicroBattle(done: (blocked: boolean) => void): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.prologMicroBattle(done));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    audio.play("horn");
    const el = document.createElement("div");
    el.className = "battle prolog-micro";
    el.innerHTML = `<div class="bbox story choice pmbox">
      <h2>${ic("swords")} ${t("Oba savunması")}</h2>
      <p class="dim">${t("Tek tur. Doğru emri seç — yine de sayı üstünlüğü seni ezecek, ama aklında kalacak.")}</p>
      <div class="btell urgent pm-tell"><b>⚠ ${t("Hücum naraı")}</b><span>${t("Atlılar nara ile üzerine çöküyor. Kalkan kilidi hasarı keser; nara ise sen de vurursun ama ezilirsin.")}</span><small>${t("Karşıla")}: ${t("Kalkan Siperi")}</small></div>
      <div class="pm-ords">
        <button type="button" class="btn big" data-o="nara">${ic("ord_nara")} ${t("Nara")}<em>${t("Güç +%25 · iki tur")}</em></button>
        <button type="button" class="btn big go" data-o="siper">${ic("ord_siper")} ${t("Kalkan Siperi")}<em>${t("Hasar −%45 · doğru karşı")}</em></button>
      </div>
    </div>`;
    this.root.appendChild(el);
    const finish = (blocked: boolean) => {
      el.remove();
      this.storyOpen = false;
      if (blocked) {
        audio.play("clash");
        this.toast(t("Siper tuttu! Emir aklında kaldı — yine de sayı yetmedi."), "good");
      } else {
        audio.play("hit");
        this.toast(t("Nara ile karşına çıktın; ezildin. Sonraki savaşta tell'e bak."), "info");
      }
      done(blocked);
      this.nextStory();
    };
    el.querySelectorAll<HTMLButtonElement>("[data-o]").forEach((b) =>
      b.addEventListener("click", () => finish(b.dataset.o === "siper")),
    );
  }

  private slaveBriefing(): void {
    this.story(
      "Kervan Krallık",
      "heroes/slave",
      `${this.originIntro()}${t("Adın {n}, yolun {c} yolu.", { n: this.g.s.hero.name, c: this.g.cls().name })} ${t("Bir baskında ailenden koparıldın ve Semerkant'ta bir tüccara köle olarak satıldın.")}<br><br>${t("Efendin sana bir söz verdi")}: <b>60 ${t("akçe")}</b> ${t("biriktirirsen hürriyetini geri alabilirsin. Şehrin yakınındaki ormanda, taş ocağında ve tarlalarda çalış, her vardiyada birkaç akçe kazan.")}<br><br>${t("Özgürlüğünü kazandıktan sonra İpek Yolu seni bekliyor")}: ${this.g.cls().name} ${t("silahlarını al, talim yap, ticaret yap, haramileri yen ve bir gün kendi beyliğini kur.")}`,
      t("Çalışmaya başla"),
    );
  }

  private classSelect(): void {
    const g = this.g;
    this.storyOpen = true;
    let pick: ClassId = "alp";
    let opick: OriginId = "oba";
    const en = lang() === "en";
    const oName = (o: Origin) => (en ? o.en[0] : o.name);
    const odetail = () => {
      const o = ORIGIN_BY_ID[opick];
      return `<p>${en ? o.en[1] : o.desc}</p><small class="cheap">${en ? o.en[2] : o.perk}</small>`;
    };
    const el = document.createElement("div");
    el.className = "battle csel";
    const pips = (v: number) => "●".repeat(v) + `<i>${"●".repeat(Math.max(0, 4 - v))}</i>`;
    const detail = () => {
      const c = CLASSES.find((x) => x.id === pick)!;
      return `<img class="cbig" src="${assetUrl(c.portrait)}" alt=""><div class="cinfo">
        <h2 style="color:${c.color}">${c.name}</h2><em>${t(c.role)}</em><p>${t(c.desc)}</p>
        <div class="cstats">${STAT_KEYS.map((k) => `<div class="${c.primary.includes(k) ? "prim" : ""}"><span>${c.primary.includes(k) ? "★ " : ""}${t(STAT_INFO[k].name)}</span><b>${pips(c.start[k])}</b></div>`).join("")}</div>
        <div class="cgear">${ic("swords")} ${c.weapons.map((w) => WEAPON_NAME[w]).join(", ")} · ${ARMOR_NAME[c.armor]}${c.shield ? ` · ${t("Kalkan")}` : ""}</div>
        <div class="cpass">${t(c.passive)}</div></div>`;
    };
    el.innerHTML = `<div class="bbox cbox"><h2>${t("Yolunu seç")}</h2><p class="dim">${t("Seçtiğin yol hangi silahları ve zırhları kullanabileceğini, hangi özelliklerin seni güçlendireceğini belirler. Daha sonra değiştirilemez.")}</p>
      <div class="ccards">${CLASSES.map((c) => `<button class="ccard ${c.id === pick ? "on" : ""}" data-c="${c.id}" style="--cc:${c.color}"><img src="${assetUrl(c.portrait)}" alt=""><b>${c.name}</b><small>${t(c.role).split(" · ")[0]}</small></button>`).join("")}</div>
      <div class="cdet">${detail()}</div>
      <h3 class="otitle">${t("Kökenin")}</h3>
      <div class="origins">${ORIGINS.map((o) => `<button class="ocard ${o.id === opick ? "on" : ""}" data-o="${o.id}"><img src="${assetUrl(o.icon)}" alt=""><b>${oName(o)}</b></button>`).join("")}</div>
      <div class="odet">${odetail()}</div>
      <div class="cname"><label>${t("Adın")}</label><input maxlength="14" value="${g.s.hero.name}"><button class="btn go big">${t("Bu yolu seç")}</button></div></div>`;
    this.root.appendChild(el);
    el.querySelector(".ccards")!.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("[data-c]") as HTMLElement | null;
      if (!b) return;
      pick = b.dataset.c as ClassId;
      el.querySelectorAll(".ccard").forEach((x) => x.classList.toggle("on", x === b));
      el.querySelector(".cdet")!.innerHTML = detail();
    });
    el.querySelector(".origins")!.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest("[data-o]") as HTMLElement | null;
      if (!b) return;
      opick = b.dataset.o as OriginId;
      el.querySelectorAll(".ocard").forEach((x) => x.classList.toggle("on", x === b));
      el.querySelector(".odet")!.innerHTML = odetail();
    });
    el.querySelector(".cname .btn")!.addEventListener("click", () => {
      const name = (el.querySelector(".cname input") as HTMLInputElement).value.trim().slice(0, 14) || "Toygar";
      g.chooseClass(pick, name, opick);
      el.remove();
      this.storyOpen = false;
      if (!g.s.free) this.intro();
    });
  }

  private itemRow(it: Item, right: string): string {
    const why = this.g.canUse(it);
    const req = `Sv ${it.lvReq}${it.req ? ` · ${STAT_INFO[it.req.stat].short} ${it.req.v}` : ""}`;
    const yore = it.org ? YORE[it.org] : null;
    return `<div class="grow item ${it.set || it.uq || it.relic ? "leg" : ""}">${this.icard(it)}<div class="bi2"><b class="r${it.rar}">${it.name}</b>${this.legendTag(it)}${yore ? `<em class="yore" title="${yore.desc}">${yore.name}</em>` : ""}<small>${kindName(it)} · ${itemStats(it)}</small>${this.cmpHtml(it)}<small class="${why ? "why" : "dim"}">${why ?? "Gerekli: " + req}</small></div>${right}</div>`;
  }

  /** Nadirlik çerçeveli, kademe yıldızlı büyük eşya kartı. */
  icard(it: Item, cls = ""): string {
    const r = it.relic || it.uq || it.set ? 4 : it.rar;
    return `<div class="icard r${r} ${cls}">${ic(it.icon, "gimg")}<span class="istars">${"★".repeat(Math.max(1, Math.min(5, it.tier)))}</span>${it.rune ? `<span class="irune">${RUNE_BY_ID[it.rune]?.glyph ?? ""}</span>` : ""}</div>`;
  }

  /** Kuşanılan eşyaya göre kesin farklar: "+12 saldırı · −3 savunma". */
  private cmpHtml(it: Item): string {
    const g = this.g;
    if (g.s.hero.equip[it.slot] === it || g.classBlocked(it)) return "";
    const d = g.compare(it);
    const cur = g.s.hero.equip[it.slot];
    const setNote = (() => {
      if (!it.set) return "";
      const before = g.setCount(it.set);
      const losing = cur?.set === it.set ? 1 : 0;
      const after = before - losing + 1;
      if (before < 2 && after >= 2) return `<span class="cheap">${tr("(2) set uyanır")}: ${modsText(SETS[it.set].b2)}</span>`;
      if (before < 4 && after >= 4) return `<span class="cheap">${tr("(4) set tamam")}: ${modsText(SETS[it.set].b4)}</span>`;
      return "";
    })();
    if (!d.length && !setNote) return `<small class="cmp dim">${cur ? tr("Kuşandığınla aynı güçte") : ""}</small>`;
    return `<small class="cmp">${cur ? "" : tr("Boş yuvaya") + ": "}${d.map((x) => `<span class="${x.d > 0 ? "cheap" : "dear"}">${x.text}</span>`).join(" · ")}${setNote ? (d.length ? " · " : "") + setNote : ""}</small>`;
  }

  private legendTag(it: Item): string {
    if (it.uq) return `<small class="ltag">Destan eşyası</small>`;
    if (!it.set) return "";
    const st = SETS[it.set];
    return `<small class="ltag" style="color:${st.color}">${st.name} (${this.g.setCount(it.set)}/4)</small>`;
  }

  private forgeHtml(): string {
    const g = this.g;
    const st = SETS[this.forgePick];
    const why = g.forgeReason();
    const cl = g.cls();
    const zlNow = skillLv(g.s.hero.skills.zanaat ?? 0);
    const sigHint = SIGNATURES.filter((sg) => zlNow >= sg.zl - 2 && zlNow < sg.zl + 3).slice(0, 2);
    return (
      `<h3>${ic("trophy")} Efsane Ocağı</h3><p class="dim">Seviye ${SET_FORGE.lv}'ten itibaren efsanevi set parçası dövebilirsin. Aynı setten 2 ve 4 parça giyince gizli güçler uyanır. Üstte imza tariflerin; burada destan setleri.</p>` +
      (sigHint.length
        ? `<div class="odds mid">${ic("seal")} <b>${t("Yakın tarifler")}</b><small class="dim">${sigHint.map((sg) => `${g.sigName(sg.id)} · Sv ${sg.zl}`).join(" · ")}</small></div>`
        : "") +
      `<div class="row tiers">${SET_KEYS.map((k) => `<button class="btn sm ${k === this.forgePick ? "go" : ""}" style="--sc:${SETS[k].color}" data-a="${this.act(() => (this.forgePick = k))}">${SETS[k].name.replace(" Takımı", "")}</button>`).join("")}</div>` +
      `<div class="setb" style="--sc:${st.color}"><b>${st.name}</b><small class="dim"><i>${st.lore}</i></small><small class="on">(2) ${modsText(st.b2)}</small><small class="on">(4) ${modsText(st.b4)}</small><small>${this.matsHtml(g.forgeCost())}</small>${why ? `<small class="why">${why}</small>` : ""}</div>` +
      SET_SLOTS.map((sl) => {
        const icon = sl === "silah" ? (WEAPON_ICON[cl.weapons[0]] ?? "it_sword_") + "5" : sl === "zirh" ? (cl.armor === "agir" ? "it_armor_5" : "it_light_5") : sl === "at" ? "mount_3" : "tr_star";
        const got = g.s.codex.includes(`set:${this.forgePick}:${sl}`);
        return `<div class="grow leg">${ic(icon, "gimg")}<div class="bi2"><b class="r4">${st.pieces[sl]}</b><small>${SLOT_NAME[sl]}${got ? " · koleksiyonda" : ""}</small></div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.forgeSet(this.forgePick, sl))}">Döv</button></div>`;
      }).join("")
    );
  }

  private deepHtml(i: number, near: boolean): string {
    const g = this.g;
    const s = g.s;
    const k = s.kurgans[i];
    const why = g.deepReason(i);
    const t: Target = { kind: "kurgan", i };
    return `<p>Taş paramparça. Kara büyü ${dur(k.respawnAt - g.now)} sonra yeniden toplanacak.</p>
      <h3>${ic("map/kurgan")} Kurgan Derinlikleri</h3>
      <p>Kırık taşın altında mezara inen bir merdiven açıldı. Kat kat aşağı in: her katta üç kapıdan birini seç. Savaş, hazine, şifa pınarı, Taş Ozan'ın bilmeceleri, Erlik'in teklifleri… Her 5 katta bir bekçi. Ne kadar derine inersen ganimet o kadar büyür.</p>
      ${this.tombHtml(i)}
      <div class="odds mid">Meşale: <b>${g.deepTorches()}</b> · En derin inişin: <b>${s.deepBest ? `${s.deepBest}. kat` : "—"}</b> · Toplam kat: <b>${s.c.floors}</b></div>
      ${why ? `<p class="dim">${why}</p>` : near ? `<div class="col">${g.deepStarts().map((f) => `<button class="btn red big" data-a="${this.act(() => { this.close(); g.enterDeep(i, f); })}">${ic("map/kurgan")} ${f === 1 ? "Derinliklere in" : `Kestirmeden ${f}. kata in`}</button>`).join("")}</div>` : this.walkBtn(t, "Mezara yürü")}
      ${this.perksHtml()}`;
  }

  private tombHtml(i: number): string {
    const tb = TOMBS[tombOf(i)];
    return `<div class="brow"><img class="bimg" src="${assetUrl(tb.boss.icon)}" alt=""><div class="bi2"><b>${tb.name}</b><small>${tb.desc}</small><small class="dim">Bekçisi: ${tb.boss.name}</small></div></div>`;
  }

  private perksHtml(): string {
    const g = this.g;
    const s = g.s;
    return `<h3>${ic("ruh")} Derinlik Sırları <em>${s.seals} Kemik Mühür</em></h3><p class="dim">Her inilen kat 1, her bekçi 3 Kemik Mühür kazandırır. Mühürlerle kalıcı zindan yetenekleri açılır.</p>` +
      DEEP_PERKS.map((p) => {
        const lv = g.dperk(p.id);
        const max = lv >= p.max;
        const cost = p.cost(lv);
        return `<div class="grow">${ic(p.icon, "gimg")}<div class="bi2"><b>${p.name} <em>${lv}/${p.max}</em></b><small>${p.desc(Math.max(1, max ? lv : lv + 1))}</small></div>${max ? `<em class="cheap">✓</em>` : `<button class="btn sm ${s.seals < cost ? "off" : ""}" data-a="${this.act(() => g.buyDeepPerk(p.id))}">Aç<br>${cost} mühür</button>`}</div>`;
      }).join("");
  }

  private dailyHtml(): string {
    const g = this.g;
    const d = g.daily();
    if (!d) return "";
    return (
      `<h3>${ic("seal")} ${tr("Günlük Fermanlar")} <em class="dim">· ${tr("seri {n} gün", { n: d.streak })}</em></h3><p class="dim">${tr("Her gün yeni üç ferman. Hepsini bitirip sandığı aç; üst üste gelirsen sandık daha cömert olur.")}</p>` +
      d.tasks
        .map((t, i) => {
          const p = DAILY_POOL.find((x) => x.key === t.key)!;
          const v = g.dailyProg(t);
          const ok = v >= t.need;
          return `<div class="grow ${t.done ? "dim" : ""}">${ic(p.icon, "gimg")}<div class="bi2"><b>${t.need} ${p.what}</b><div class="fbar" style="--fc:${ok ? "#7fd36a" : "#e0b04a"}"><i style="width:${(v / t.need) * 100}%"></i></div><small>${v}/${t.need} · ${ic("coins")}${g.dailyGold()}</small></div>${t.done ? `<em class="cheap">✓</em>` : `<button class="btn sm ${ok ? "go" : "off"}" data-a="${this.act(() => g.claimDaily(i))}">${tr("Al")}</button>`}</div>`;
        })
        .join("") +
      (d.chest ? `<div class="odds good">${tr("Bugünün sandığı açıldı. Yarın yeni fermanlar gelecek.")}</div>` : `<button class="btn big ${g.chestReady() ? "go" : "off"}" style="width:100%" data-a="${this.act(() => g.openChest())}"> ${ic("chest")} ${tr("Ferman sandığını aç")}</button>`)
    );
  }

  private kipHtml(i: number): string {
    const g = this.g;
    const s = g.s;
    const p = g.kipPois()[i];
    if (!p) return "";
    const k = g.kip();
    const en = lang() === "en";
    const near = g.kipNear(i);
    const walk = this.walkBtn({ kind: "kip", i }, tr("Oraya yürü"));
    const btn = (label: string, why: string, fn: () => void, cls = "") => `<button class="btn ${cls} ${why ? "off" : ""}" data-a="${this.act(fn)}">${label}${why ? ` <small>· ${why}</small>` : ""}</button>`;
    if (p.kind === "stone") {
      const read = k.stones.includes(p.n);
      return this.frame(tr("Taş Baba"), `${tr("Deşt-i Kıpçak")} · ${k.stones.length}/${STONES.length}`, assetUrl("map/kurgan"),
        read ? `<p><i>"${en ? STONES[p.n].en : STONES[p.n].tr}"</i></p><p class="dim">${tr("Bu taşın sözünü okudun.")}</p>`
          : `<p class="dim">${tr("Bozkırın ortasında, yüzü doğuya dönük, elinde kâse tutan bir taş heykel. Kaidesinde silik Göktürk harfleri var.")}</p>${near ? "" : walk}`);
    }
    if (p.kind === "fort") {
      if (k.fort) return this.frame(tr("Kara Kıpçak Ordugâhı"), tr("Dağıtıldı"), assetUrl("map/castle"), `<p class="dim">${tr("Yanık çadırlar ve devrilmiş bir sancak. Kara Kıpçaklar dağıldı.")}</p>`);
      const lv = s.hero.lv;
      const b = kipBoss(lv);
      const odds = Math.round(g.kipFortOdds() * 100);
      return this.frame(tr("Kara Kıpçak Ordugâhı"), `${tr("Deşt-i Kıpçak")} · ${tr("önerilen seviye")} ${KIP_MIN_LV}+`, assetUrl("map/castle"), `
        <p>${en ? KIP_STEPS[1].textEn : KIP_STEPS[1].text}</p>
        <div class="brow">${ic(b.icon, "bimg round")}<div class="bi2"><b>${tr(b.name)}</b><small>${tr("Can")} ${b.hp} · ${tr("Saldırı")} ${b.atk} · ${tr("Savunma")} ${b.def}</small></div></div>
        <h3>${tr("Düşman")}</h3>${armyHtml(kipFortArmy(lv), "enemy")}<h3>${tr("Sen ve birliğin")}</h3>${armyHtml(s.hero.army)}
        <div class="odds ${odds >= 65 ? "good" : odds >= 35 ? "mid" : "bad"}">${tr("Zafer şansı")}: <b>%${odds}</b></div>
        ${near ? btn(`${ic("swords")} ${tr("Ordugâha saldır")}`, "", () => {
          this.close();
          g.kipFortAttack();
        }, "red big") : walk}`);
    }
    const st = KIP_STEPS[k.step];
    const quest = st
      ? `<h3>${ic("quest")} ${en ? st.en : st.title} <em class="dim">${k.step + 1}/${KIP_STEPS.length}</em></h3><p>${en ? st.textEn : st.text}</p>
        ${k.step === 2 ? `<p class="dim">${tr("Taş Baba")}: ${k.stones.length}/${STONES.length}</p>` : ""}
        ${near ? btn(`${ic("seal")} ${k.step === 0 ? tr("{n} yiyecek ver", { n: KIP_FOOD }) : tr("Hana haber ver")}`, g.kipStepReady() ? "" : tr("henüz değil"), () => g.kipStep(), "go") : ""}`
      : `<div class="odds good">${tr("Kıpçak kardeşliği: ordu gücü +%3, hız +%3")}</div>`;
    return this.frame(tr("Kıpçak Ordası"), `${tr("Köten Han")} · ${tr("itibar")} ${k.rep}/100${k.ally ? ` · ${tr("Kardeş")}` : ""}`, assetUrl("map/yurts"), `
      <p class="dim">${tr("Yüzlerce keçe çadır, at sürüleri ve kımız kokusu. Kıpçaklar dışarıdan gelene temkinli ama cömerttir.")}</p>
      ${bar(k.rep, 100, "", `${tr("itibar")} ${k.rep}/100`)}
      ${quest}
      <h3>${ic("lord_bey")} ${tr("Orda pazarı")}</h3>
      ${near ? `<div class="col2">
        ${btn(`${ic("coins")} ${tr("Armağan sun")} (${KIP_GIFT}) · +${KIP_GIFT_REP}`, g.kipGiftReason(), () => g.kipGift())}
        ${btn(`${ic("u_cavalry")} ${tr("{n} Kıpçak atlısı kirala", { n: KIP_HIRE_N })} (${kipHireCost(s.hero.lv)})`, g.kipHireReason(), () => g.kipHire())}
        ${btn(`${ic("j_caravan")} ${tr("Bütün yükü sat")} (+${g.kipSellValue()})`, g.kipSellReason(), () => g.kipSell())}
      </div><p class="dim">${tr("Orda malı bozkır fiyatının %25 üstünden alır, ama günde bir kez. Atlılar {d} günde bir kiralanabilir.", { d: KIP_HIRE_GAP })}</p>` : walk}`);
  }

  private weeklyHtml(): string {
    const g = this.g;
    const w = g.weekly();
    const th = weekTheme(w.id);
    const en = lang() === "en";
    const score = g.weekScoreNow();
    const left = Math.max(0, weekEnd(w.id) - Date.now());
    const d = Math.floor(left / 864e5), h = Math.floor((left % 864e5) / 36e5);
    const mods = Object.entries(th.mods).map(([k, v]) => (k === "carry" ? `+${v} ${tr("yük")}` : `+${Math.round((v ?? 0) * 100)}% ${tr(MOD_LABEL[k] ?? k)}`)).join(" · ");
    const tiers = Array.from({ length: WEEK_TIERS }, (_, i) => {
      const need = weekNeed(i, w.lv);
      const r = weekReward(i, w.lv);
      const st = i < w.claimed ? "done" : i === w.claimed && score >= need ? "ready" : "";
      return `<div class="wtier ${st}"><b>${["I", "II", "III"][i]}</b><small>${need} ${tr("puan")}</small><small class="cheap">${ic("coins")}${r.gold} · ${ic("crown")}${r.renown}${r.parsomen ? ` · ${ic("parsomen")}${r.parsomen}` : ""}</small>${st === "ready" ? `<button class="btn sm go" data-a="${this.act(() => g.weekClaim(i))}">${tr("Al")}</button>` : st === "done" ? `<em class="good">✓</em>` : ""}</div>`;
    }).join("");
    const next = w.claimed < WEEK_TIERS ? weekNeed(w.claimed, w.lv) : weekNeed(WEEK_TIERS - 1, w.lv);
    const board = g.weekBoardNow();
    const rows = board.map((r, i) => `<div class="wrow ${r.me ? "me" : ""}"><i>${i + 1}</i><span>${r.name}</span><b>${r.score}</b></div>`).join("");
    const pts = Object.entries(th.score).map(([k, v]) => `${tr(SCORE_LABEL[k] ?? k)} ×${v}`).join(" · ");
    const hist = w.hist.length ? `<p class="dim">${tr("Geçmiş haftalar")}: ${w.hist.slice(0, 5).map((x) => `${weekTheme(x.id)[en ? "en" : "name"]} ${x.rank}. (${x.score})`).join(" · ")}</p>` : "";
    return `<h3>${ic(th.icon)} ${en ? th.en : th.name} <em class="dim">· ${tr("{d}g {h}s kaldı", { d, h })}</em></h3>
      <p class="dim">${en ? th.descEn : th.desc} ${tr("Haftanın lütfu")}: <b class="cheap">${mods}</b></p>
      <p class="dim small">${tr("Puanlama")}: ${pts}</p>
      ${bar(Math.min(score, next), next, "", `${tr("Hafta puanı")} ${score}/${next}`)}
      <div class="wtiers">${tiers}</div>
      <div class="wboard"><div class="wrow hd"><i>#</i><span>${tr("Bozkır sıralaması")}</span><b>${tr("puan")}</b></div>${rows}</div>${hist}`;
  }

  private studPick: number[] = [];

  private stableHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (s.hero.lv < 4 && !s.hero.equip.at) return this.lockHtml("mount_2", t("At pazarı ve ahır"), t("{n}. seviyede açılır", { n: 4 }));
    const shop =
      `<h3>${ic("mount_2")} At pazarı</h3>` +
      g
        .horseShop(city)
        .map((k) => {
          const b = BREEDS[k];
          return `<div class="grow">${ic(b.icon, "gimg")}<div class="bi2"><b>${b.name}</b><small>${b.desc}</small><small>Hız +%${Math.round(b.spd * 100)} · Yük +${b.carry} · Can +${b.hp}</small></div><button class="btn sm ${!near || !s.free || s.res.gold < b.gold ? "off" : ""}" data-a="${this.act(() => g.buyHorse(k, city))}">Al<br>${ic("coins")}${b.gold}</button></div>`;
        })
        .join("");
    if (!g.canStud(city)) return shop + `<p class="dim">Kendi ahırında at çiftleştirmek için burada bir kervansaray kur (ya da Semerkant'ta çiftleştir).</p>`;
    const st = s.stud;
    let stud = `<h3>${ic("stable")} Ahır</h3>`;
    if (st) {
      stud += `<div class="brow">${ic("foal", "bimg")}<div class="bi2"><b>${st.a.name.split(" (")[0]} × ${st.b.name.split(" (")[0]}</b>${bar(BREED_TIME - (st.until - g.now), BREED_TIME, "", `Tay ${dur(st.until - g.now)} sonra`)}<small>${CITY_NAME[st.city]} ahırında</small></div></div>`;
    } else {
      const hs = g.studHorses();
      this.studPick = this.studPick.filter((id) => hs.some((x) => x.id === id));
      stud += `<p class="dim">İki atını seç ve çiftleştir. Tay, ebeveynlerinin hızını, yük gücünü ve dayanıklılığını karışık alır; bazen ikisinden de üstün doğar. Kuşaklar ilerledikçe efsanevi <b>Tulpar</b> doğabilir.</p>` +
        (hs.length < 2
          ? `<p class="dim">En az iki atın olmalı (${hs.length}/2).</p>`
          : hs
              .map((it) => {
                const on = this.studPick.includes(it.id);
                const hi = it.horse;
                const ped = hi ? `<small class="ped">${BREEDS[hi.breed].name} · <b>${hi.gen}. kuşak</b>${hi.sire ? ` · ♂ ${hi.sire.split(" (")[0]} × ♀ ${hi.dam.split(" (")[0]}` : ""}</small>` : "";
                return `<div class="grow ${on ? "pick" : ""}">${ic(it.icon, "gimg")}<div class="bi2"><b class="r${it.rar}">${it.name}</b><small>${itemStats(it)}</small>${ped}</div><button class="btn sm ${on ? "go" : ""}" data-a="${this.act(() => (this.studPick = on ? this.studPick.filter((x) => x !== it.id) : [...this.studPick.slice(-1), it.id]))}">${on ? "Seçili" : "Seç"}</button></div>`;
              })
              .join("") +
            `<button class="btn big ${this.studPick.length === 2 && near && s.res.gold >= BREED_GOLD ? "go" : "off"}" style="width:100%" data-a="${this.act(() => { g.breedHorses(this.studPick[0], this.studPick[1], city); this.studPick = []; })}">${ic("foal")} Çiftleştir · ${ic("coins")}${BREED_GOLD}</button>`);
    }
    const herd = g.studHorses();
    const tree =
      herd.length > 0
        ? `<h3>${ic("foal")} ${tr("Soyağacı")}</h3><div class="lineage">` +
          herd
            .map((it) => {
              const hi = it.horse;
              if (!hi) return "";
              return `<div class="linrow">${ic(it.icon)}<div><b class="r${it.rar}">${it.name}</b><small>${BREEDS[hi.breed].name} · ${hi.gen}. ${tr("kuşak")}${hi.sire ? ` · ${hi.sire.split(" (")[0]} × ${hi.dam.split(" (")[0]}` : ""}</small></div></div>`;
            })
            .join("") +
          `</div>`
        : "";
    return shop + stud + tree;
  }

  private birdShopHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (s.hero.lv < 6 && !s.bird) return this.lockHtml("bird_dogan", t("Kuşçu"), t("{n}. seviyede açılır", { n: 6 }));
    return (
      `<h3>${ic("bird_dogan")} Kuşçu</h3>` +
      g
        .birdShop(city)
        .map((k) => {
          const d = BIRDS[k];
          const mine = s.bird?.kind === k;
          return `<div class="grow">${ic("bird_" + k, "gimg")}<div class="bi2"><b>${d.name}</b><small>${d.desc}</small><small>${modsText(d.mods(5))} (5. seviyede) · her ${d.cd} sn uçar</small></div>${mine ? `<em class="cheap">Senin</em>` : `<button class="btn sm ${!near || !s.free || s.res.gold < d.gold ? "off" : ""}" data-a="${this.act(() => g.buyBird(k, city))}">Al<br>${ic("coins")}${d.gold}</button>`}</div>`;
        })
        .join("") +
      (city !== "bukhara" && city !== "kashgar" ? `<p class="dim">Ak Sungur yalnız Buhara'da, Altın Kartal yalnız Kaşgar'da satılır.</p>` : "")
    );
  }

  private birdHtml(): string {
    const g = this.g;
    const b = g.s.bird;
    if (!b) return `<h3>${ic("bird_dogan")} Av kuşu</h3><p class="dim">Henüz bir kuşun yok. Şehirlerin hanındaki kuşçudan bir doğan alabilirsin; keşif yapar, av getirir, düşmanı gözetler.</p>`;
    const d = BIRDS[b.kind];
    const cd = g.birdReady();
    return `<h3>${ic("bird_" + b.kind)} Av kuşu</h3><div class="brow">${ic("bird_" + b.kind, "bimg")}<div class="bi2"><b>${b.name} <em>${d.name} · Sv ${b.lv}</em></b>${b.lv < 10 ? bar(b.xp, birdXpNeed(b.lv), "", `${b.xp}/${birdXpNeed(b.lv)}`) : ""}<small>${modsText(d.mods(b.lv))} · görüş +${birdSight(b)}${b.lv >= 3 ? " · düşman taktiğini haber verir" : " · 3. seviyede düşman taktiğini haber verir"}</small></div><button class="btn sm ${cd > 0 || g.birdFly ? "off" : "go"}" data-a="${this.act(() => { this.close(); g.aimBird(); })}">${g.birdFly ? "Uçuyor" : cd > 0 ? `${Math.ceil(cd)} sn` : "Uçur"}</button></div>`;
  }

  private chronAll = false;

  private haggleHtml(city: string, near: boolean): string {
    const g = this.g;
    if (!near || !g.s.free) return "";
    const m = g.haggleMod(city);
    if (g.haggleDone(city)) {
      const n = Math.round(Math.abs(m) * 100);
      return `<div class="odds haggle ${m > 0 ? "good" : "bad"}">${ic("merchant")} ${m > 0 ? t("Bugünkü pazarlık: fiyatlar %{n} lehine.", { n }) : t("Tüccar küstü: bugün fiyatlar %{n} aleyhine.", { n })}</div>`;
    }
    return `<div class="odds haggle mid">${ic("merchant")} ${t("Çarşıda pazarlık günde bir kez yapılır; başarı bütün gün fiyatlarını iyileştirir.")} <button class="btn sm go" data-a="${this.act(() => g.haggleMenu(city))}">${t("Pazarlık et")}</button></div>`;
  }

  private newsHtml(city: string, near: boolean): string {
    const g = this.g;
    if (near) return "";
    const age = g.newsAge(city);
    const canBuy = g.nearCity() >= 0;
    const msg = age === null ? t("Bu şehrin fiyatlarından haberin yok.") : age === 0 ? t("Bugünkü haber: fiyatlar taze.") : t("Fiyatlar {n} gün önceki habere göre; değişmiş olabilir.", { n: age });
    const net = g.s.serais[city] ? ` · ${t("kervansaray ağın her gün haber taşır")}` : "";
    return `<div class="odds news ${age === null ? "bad" : age > 1 ? "mid" : "good"}">${ic("scroll")} ${msg}${net}${canBuy ? ` <button class="btn sm ${g.s.res.gold < NEWS_GOLD ? "off" : ""}" data-a="${this.act(() => g.buyNews())}">${t("Kervancılardan haber al")} (${NEWS_GOLD})</button>` : ""}</div>`;
  }

  openDestan(): void {
    const g = this.g;
    const s = g.s;
    const end = s.act3.ending ? endingOf(s.act3.ending) : null;
    const tl = s.title ? titleOf(s.title) : null;
    const title = [end?.name, s.kagan ? "Kağan" : s.beylik ? "Bey" : s.free ? "Hür yiğit" : "Köle", tl?.name].filter(Boolean).join(" · ");
    void openDestan(this.root, { name: s.hero.name, title, portrait: assetUrl(g.face()), lv: s.hero.lv, day: g.dayOf().day, kills: s.kills, renown: Math.round(s.renown), verses: s.chron });
  }

  private chronHtml(): string {
    const c = this.g.s.chron;
    if (!c.length) return "";
    const list = [...c].reverse().slice(0, this.chronAll ? 80 : 6);
    return (
      `<h3>${ic("parsomen")} Ozanın Defteri <button class="btn sm go dsbtn" data-a="${this.act(() => this.openDestan())}">${ic("scroll")} Destan Kitabı</button></h3><div class="chron">` +
      list.map((e) => `<div class="cr"><em>Gün ${e.d}</em><p>${e.t}</p></div>`).join("") +
      `</div>` +
      (c.length > 6 ? `<button class="btn sm" style="width:100%" data-a="${this.act(() => (this.chronAll = !this.chronAll))}">${this.chronAll ? "Kısalt" : `Bütün destanı oku (${c.length})`}</button>` : "")
    );
  }

  private nemesisHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.nemeses.length) return `<h3>${ic("j_bandit")} Kan Davası</h3><p class="dim">Henüz can düşmanın yok. Seni yenen ya da kampını yaktığın harami reisleri intikam yemini eder; isim, lakap ve güç kazanıp peşine düşerler.</p>`;
    const list = [...s.nemeses].sort((a, b) => Number(b.alive) - Number(a.alive) || b.lv - a.lv);
    return (
      `<h3>${ic("j_bandit")} Kan Davası <em class="dim">· ${s.c.slain} reis öldürüldü</em></h3>` +
      list
        .map((n) => {
          const t = NEM_TRAITS[n.trait];
          const out = g.nemesisOut(n);
          const where = n.bro ? `<b class="cheap">Kan kardeşin · ${BRO_MODS[n.trait].text}</b>` : n.alive ? (out ? `<b class="dear">Bozkırda seni arıyor</b>` : `${s.camps[n.camp]?.name ?? "?"} çevresinde`) : n.peace ? `<b class="cheap">Diyetle barışıldı</b>` : "Öldürüldü";
          const dc = diyetCost(n.lv);
          const btn = n.alive ? `<div class="col2"><button class="btn sm" data-a="${this.act(() => { this.close(); const p = out ?? s.camps[n.camp]; g.cam.flyTo(p.x, p.y, 0.8); })}">Bul</button>${n.han ? "" : `<button class="btn sm ${s.res.gold < dc ? "off" : ""}" title="Töreye göre kan bedeli öde, davayı kapat" data-a="${this.act(() => g.payDiyet(n.id))}">Diyet ${dc}</button>`}</div>` : n.bro ? `<em class="cheap">⚭</em>` : `<em class="cheap">${n.peace ? "☮" : "✓"}</em>`;
          const face = n.han ? "heroes/enemy_chief" : n.trait === "zirhli" ? "heroes/enemy_heavy" : n.trait === "akinci" ? "heroes/enemy_rider" : n.trait === "okcu" ? "heroes/enemy_axe" : "heroes/enemy_sword";
          return `<div class="grow nem ${n.alive || n.bro ? "" : "dim dead"} ${n.han ? "han" : ""}">${ic(face, "gimg")}<div class="bi2"><b>${nemName(n)}</b> <small>Sv ${n.lv}</small><small>${t.name} · ${t.desc}</small><small>${where}${n.wins ? ` · seni ${n.wins} kez yendi` : ""}${n.scars ? ` · ${n.scars} yara izi` : ""}</small></div>${btn}</div>`;
        })
        .join("")
    );
  }

  private kurultayHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.beylik || !s.rivals.length) return "";
    const why = g.kurultayReason();
    const kr = g.kaganReason();
    const act = s.kurultay.decrees.map((id) => DECREES.find((d) => d.id === id)).filter(Boolean);
    return `<h3>${ic("lord_bey")} Kurultay ${s.kagan ? `<em class="cheap">· ${s.hero.name} Kağan</em>` : ""}</h3>
      <p class="dim">Müttefik ve tabi beylerinle Semerkant'ta toplan, fermanları oya sun. ${s.kagan ? "" : `Yeterince güçlüysen Kağanlığını ilan ettir.`}</p>
      ${act.length ? act.map((d) => `<div class="grow">${ic(d!.icon, "gimg")}<div class="bi2"><b>${d!.name} <em class="cheap">yürürlükte</em></b><small>${d!.desc}</small></div></div>`).join("") : `<p class="dim">Yürürlükte ferman yok.</p>`}
      <div class="stats"><div>Toplanan kurultay: <b>${s.kurultay.held}</b></div><div>${ic("crown")}Kağanlık: <b>${s.kagan ? "Evet" : kr ? "Henüz değil" : "Hazır!"}</b></div></div>
      ${why ? `<p class="why">${why}</p>` : ""}
      ${!s.kagan && kr && !why ? `<p class="dim">${kr}</p>` : ""}
      <button class="btn go ${why ? "off" : ""}" data-a="${this.act(() => { this.close(); g.holdKurultay(); })}">${ic("lord_bey")} Kurultayı topla</button>`;
  }

  private rivalsHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.rivals.length) return "";
    const own = Object.keys(s.owned);
    return (
      `<h3>${ic("lord_bey")} ${t("Beyler")} <em class="dim">· ${t("müttefik gücü")} +%${Math.round(g.allyBonus() * 100)}</em></h3>` +
      (own.length ? `<div class="odds good">${ic("siege")} ${t("Fethettiğin şehirler")}: <b>${own.map((c) => CITY_NAME[c]).join(", ")}</b></div>` : "") +
      `<p class="dim diplo-hint">${t("Görüş: hediye, ittifak, biat veya barış. Bul: haritada uç.")}</p>` +
      s.rivals
        .map((r, i) => {
          const trt = RIVAL_TRAITS[r.trait];
          const dead = r.status === "dead";
          const btn = dead
            ? `<em class="dim">✝</em>`
            : `<div class="col2 diplo-acts"><button class="btn sm go" data-a="${this.act(() => { this.close(); g.meetRival(i); })}">${t("Görüş")}</button><button class="btn sm" data-a="${this.act(() => { this.close(); g.cam.flyTo(r.x, r.y, 0.8); })}">${t("Bul")}</button></div>`;
          const q = r.req;
          const p = q && g.reqGoto(r);
          const reqRow = q
            ? `<div class="grow req">${ic(REQ_INFO[q.kind].icon, "gimg")}<div class="bi2"><b>${REQ_INFO[q.kind].name} <em>· ${Math.max(0, q.until - g.dayOf().day + 1)} ${t("gün")}</em></b><small>${g.reqText(r)}</small><small class="cheap">${t("Ödül")}: ${q.gold} ${t("altın")} · ${t("dostluk")}</small></div>${p ? `<button class="btn sm go" data-a="${this.act(() => { this.close(); g.cam.flyTo(p.x, p.y, 0.8); })}">${t("Git")}</button>` : ""}</div>`
            : "";
          return `<div class="grow rival ${dead ? "dim dead" : ""}">${ic(r.icon, "gimg")}<div class="bi2"><b>${r.name} ${r.title}</b> <small style="color:${RIVAL_CSS[r.status]}">${STATUS_NAME[r.status]}</small><small>${trt.name} · Sv ${r.lv} · ${armySize(r.army)} ${t("asker")} · ${CITY_NAME[r.home]}</small>${r.age && !dead ? `<small class="dim">${r.age} ${t("yaşında")}${(r.gen ?? 1) > 1 ? ` · ${r.gen}. ${t("kuşak")}` : ""}${r.wed ? ` · <b class="cheap">${t("dünürün")}</b>` : ""}</small>` : ""}${dead ? "" : bar(r.rel + 100, 200, r.rel < 0 ? "hp" : "", `${t("Dostluk")} ${Math.round(r.rel)}`)}</div>${btn}</div>${reqRow}`;
        })
        .join("")
    );
  }

  private titlesHtml(): string {
    const g = this.g;
    const s = g.s;
    const cur = s.title ? titleOf(s.title) : null;
    return (
      `<h3>${ic("trophy")} Unvanlar</h3><div class="odds ${cur ? "good" : "mid"}">${cur ? `Aktif unvan: <b>${cur.name}</b> · ${modsText(cur.mods)}` : "Henüz aktif bir unvanın yok."}</div><p class="dim">Her başarım bir unvan ve ödül kazandırır. Kazandığın unvanlardan birini taşıyabilirsin; taşıdığın unvanın gücü sana geçer. ${s.titles.length}/${TITLE_CATS.length * 3} unvan.</p>` +
      TITLE_CATS.map((cat) => {
        const v = cat.value(s);
        const next = cat.tiers.find((t) => v < t.need);
        return `<div class="tcat"><div class="tch">${ic(cat.icon, "gimg")}<div class="bi2"><b>${next ? `${Math.min(v, next.need)}/${next.need} ${cat.what}` : `${tr("Tamamlandı")} · ${cat.what}`}</b>${next ? `<div class="fbar" style="--fc:#e0b04a"><i style="width:${Math.min(100, (v / next.need) * 100)}%"></i></div>` : ""}</div></div><div class="ttiers">${cat.tiers
          .map((t, i) => {
            const key = titleKey(cat.id, i);
            const got = s.titles.includes(key);
            const on = s.title === key;
            return `<button class="tt ${got ? "got" : ""} ${on ? "on" : ""}" ${got ? `data-a="${this.act(() => g.setTitle(on ? "" : key))}"` : ""} title="${modsText(t.mods)}"><b>${t.name}</b><small>${got ? modsText(t.mods) : `${t.need}`}</small></button>`;
          })
          .join("")}</div></div>`;
      }).join("")
    );
  }

  private repHtml(): string {
    const g = this.g;
    return (
      `<h3>${ic("seal")} İtibar</h3><p class="dim">Şehir görevleri, emanetler, köy savunmaları, kamp ve kurgan zaferleri ile kârlı ticaret, o bölgenin hükümdarı gözünde itibarını artırır. Dikkat: birine yaranmak rakibini kızdırır.</p>` +
      FACTION_KEYS.map((f) => {
        const fac = FACTIONS[f];
        const v = g.rep(f);
        const r = g.rank(f);
        const next = REP_RANKS[r + 1];
        const lo = REP_RANKS[r].need;
        const pct = next ? Math.max(0, Math.min(100, ((v - lo) / (next.need - lo)) * 100)) : 100;
        return `<div class="frep" style="--fc:${fac.color}"><div class="frh">${ic(fac.icon, "gimg")}<div class="bi2"><b>${fac.name} <em>${v <= HOSTILE ? "Düşman" : REP_RANKS[r].name}</em></b><small class="dim">${fac.ruler} · rakibi ${FACTIONS[fac.rival].short} · özel birlik: ${UNITS[fac.unit].name}</small></div><span class="rv ${v < 0 ? "dear" : ""}">${v}</span></div><div class="fbar"><i style="width:${pct}%"></i></div><small>${next ? `Sonraki (${next.name}, ${next.need}): ${RANK_PERKS[r + 1]}` : "En yüksek rütbe"}</small></div>`;
      }).join("")
    );
  }

  private setsHtml(): string {
    const g = this.g;
    const have = SET_KEYS.filter((k) => g.setCount(k) > 0);
    const near = SET_KEYS.filter((k) => g.setCount(k) === 0).slice(0, 2);
    const rows = [...have, ...near.filter((k) => !have.includes(k))];
    if (!rows.length) return "";
    return (
      `<h3>${ic("trophy")} ${t("Set bonusları")}</h3>` +
      rows
        .map((k) => {
          const st = SETS[k];
          const n = g.setCount(k);
          return `<div class="setb ${n ? "" : "dim"}" style="--sc:${st.color}"><b>${st.name} <em>${n}/4</em></b><small class="${n >= 2 ? "on" : ""}">(2) ${modsText(st.b2)}</small><small class="${n >= 4 ? "on" : ""}">(4) ${modsText(st.b4)}</small>${n === 1 ? `<small class="cheap">${t("1 parça daha → (2) uyanır")}</small>` : ""}${n === 3 ? `<small class="cheap">${t("1 parça daha → (4) tamam")}</small>` : ""}</div>`;
        })
        .join("")
    );
  }

  private codexHtml(): string {
    const g = this.g;
    const s = g.s;
    const cl = g.cls();
    const pieceIcon = (sl: Slot) => (sl === "silah" ? (WEAPON_ICON[cl.weapons[0]] ?? "it_sword_") + "5" : sl === "zirh" ? (cl.armor === "agir" ? "it_armor_5" : "it_light_5") : sl === "at" ? "mount_3" : "tr_star");
    const cell = (key: string, icon: string, name: string) => `<div class="cx ${s.codex.includes(key) ? "got" : ""}" title="${s.codex.includes(key) ? name : "???"}">${ic(icon)}</div>`;
    return (
      `<h3>${ic("parsomen")} Destan Koleksiyonu ${s.codex.length}/${g.codexMax()}</h3><p class="dim">Kurgan boss'ları, güçlü kamplar, harabeler ve şehir görevleri efsane eşya düşürür. Set parçalarını Atölye'deki Efsane Ocağı'nda da dövebilirsin.</p>` +
      `<div class="codex">${UNIQUES.map((u) => cell(`uq:${u.id}`, u.slot === "silah" ? pieceIcon("silah") : u.slot === "zirh" ? pieceIcon("zirh") : u.slot === "kalkan" ? "it_shield_5" : u.slot === "at" ? "mount_3" : "tr_jadeeye", u.name)).join("")}</div>` +
      SET_KEYS.map((k) => `<div class="codex" style="--sc:${SETS[k].color}"><span class="cxn">${SETS[k].name}</span>${SET_SLOTS.map((sl) => cell(`set:${k}:${sl}`, pieceIcon(sl), SETS[k].pieces[sl])).join("")}</div>`).join("") +
      `<h3>${ic("nisan")} ${tr("Boss kupaları")}</h3><p class="dim">${tr("Her biri yalnızca kendi bossunu yenince düşer.")}</p><div class="codex bosscx">${BOSS_UNIQUES.map((u) => `<div class="cx ${s.codex.includes(`uq:${u.id}`) ? "got" : ""}" title="${s.codex.includes(`uq:${u.id}`) ? `${u.name} · ${u.boss}` : `??? · ${u.boss}`}">${ic(u.slot === "silah" ? pieceIcon("silah") : u.slot === "zirh" ? pieceIcon("zirh") : u.slot === "kalkan" ? "it_shield_5" : u.slot === "at" ? "mount_3" : "tr_jadeeye")}</div>`).join("")}</div>`
    );
  }

  modal(): boolean {
    return this.storyOpen || this.battleOpen || this.menuOpen || !!this.siegeEl || !!this.shopEl;
  }

  // ---------- Hazine (mağaza) ----------

  private shopEl: HTMLElement | null = null;
  private shopTab: "yol" | "yarmak" | "sandik" | "pazar" | "gorunum" = "yol";
  private shopActs = new Map<string, () => void>();

  /** Hürriyet kazanılmadan önce kilitli kalan sekmeler: Destan Yolu ve Yarmak (gerçek para / Altın yol). */
  private shopLocked(tab: typeof this.shopTab): boolean {
    return !this.g.s.free && (tab === "yol" || tab === "yarmak");
  }

  openShop(tab?: typeof this.shopTab): void {
    if (tab && this.shopLocked(tab)) {
      this.toast("Önce hürriyetini kazan", "info");
      tab = "sandik";
    }
    if (tab) this.shopTab = tab;
    else if (this.shopLocked(this.shopTab)) this.shopTab = "sandik";
    if (!this.shopEl) {
      this.close();
      const el = document.createElement("div");
      el.className = "shop";
      el.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest<HTMLElement>("[data-sh]");
        if (!b || b.classList.contains("off")) return;
        audio.play("click");
        this.shopActs.get(b.dataset.sh!)?.();
      });
      this.root.appendChild(el);
      this.shopEl = el;
      this.g.treasury.deeds();
    }
    this.renderShop();
  }

  closeShop(): void {
    this.shopEl?.classList.add("out");
    const el = this.shopEl;
    this.shopEl = null;
    setTimeout(() => el?.remove(), 250);
  }

  refreshShop(): void {
    if (this.shopEl) this.renderShop();
  }

  private renderShop(): void {
    const el = this.shopEl;
    if (!el) return;
    const tr_ = this.g.treasury;
    const st = tr_.st;
    this.shopActs.clear();
    let n = 0;
    const on = (fn: () => void) => {
      const id = "s" + n++;
      this.shopActs.set(id, fn);
      return id;
    };
    const tabs: [typeof this.shopTab, string, string][] = [
      ["yol", "Destan Yolu", "arena/pass"],
      ["sandik", "Sandık", "sandik"],
      ["yarmak", "Yarmak", "yarmak"],
      ["pazar", "Pazar", "coins"],
      ["gorunum", "Görünüm", "seal"],
    ];
    const claim = tr_.claimable();
    const tabHtml = tabs.map(([id, name, icon]) => {
      const locked = this.shopLocked(id);
      const act = locked
        ? () => this.toast("Önce hürriyetini kazan", "info")
        : () => { this.shopTab = id; this.renderShop(); };
      return `<button class="shtab ${this.shopTab === id ? "on" : ""} ${locked ? "lock" : ""}" data-sh="${on(act)}">${ic(icon)}<span>${t(name)}</span>${locked ? `<i class="badge lock">🔒</i>` : id === "yol" && claim ? `<i class="badge">${claim}</i>` : ""}</button>`;
    }).join("");
    const free = this.g.s.free;
    const daily = tr_.dailyReady()
      ? `<button class="shdaily" data-sh="${on(() => tr_.claimDaily())}">${ic("sandik")}<div><b>${t("Günlük hediye hazır!")}</b><small>${free ? `+10 Yarmak · +50 ${t("Destan Yolu puanı")}${tr_.kervanLeft() > 0 ? " · Kervan Ağası: +40 Yarmak, +1000 altın" : ""}` : t("+10 Yarmak · Hür olunca Destan Yolu açılır")}</small></div><em>${t("Al")}</em></button>`
      : "";
    let body = "";
    if (this.shopTab === "yol") body = this.shopPass(on);
    else if (this.shopTab === "yarmak") body = this.shopYarmak(on);
    else if (this.shopTab === "sandik") body = this.shopChest(on);
    else if (this.shopTab === "pazar") body = this.shopSpend(on);
    else body = this.shopLook(on);
    el.innerHTML = `<div class="shbox">
      <div class="shhead" style="background-image:url('${assetUrl("arena/pass")}')">
        <div class="shtitle"><small>${t("Kervan Krallık")}</small><b>${t("Hazine")}</b></div>
        <button class="shbal" data-sh="${on(() => { this.shopTab = "yarmak"; this.renderShop(); })}">${ic("yarmak")}<b>${fmt(st.yarmak)}</b><i>+</i></button>
        <button class="shx" data-sh="${on(() => this.closeShop())}">✕</button>
      </div>
      <div class="shtabs">${tabHtml}</div>
      <div class="shbody">${daily}${body}</div>
    </div>`;
  }

  private shopPass(on: (fn: () => void) => string): string {
    const tr_ = this.g.treasury;
    const p = tr_.st.pass;
    const tier = tr_.passTier();
    const cell = (r: Reward, got: boolean, ready: boolean, locked: boolean, fn: () => void) =>
      `<button class="pcell ${got ? "got" : ready && !locked ? "ready" : ""} ${locked ? "lock" : ""} rk-${r.kind}" ${ready && !got && !locked ? `data-sh="${on(fn)}"` : ""}>${ic(rewardIcon(r))}<small>${t(rewardText(r))}</small>${got ? "<i>✓</i>" : locked ? "<i>🔒</i>" : ""}</button>`;
    const rows = PASS.map((row) => {
      const ready = row.tier <= tier;
      return `<div class="prow ${ready ? "on" : ""} ${row.tier === tier + 1 ? "next" : ""}"><b class="pt">${row.tier}</b>${cell(row.free, p.free.includes(row.tier), ready, false, () => tr_.claim(row.tier, false))}${cell(row.prem, p.paid.includes(row.tier), ready, !p.prem, () => tr_.claim(row.tier, true))}</div>`;
    }).join("");
    const can = tr_.claimable() - (tr_.dailyReady() ? 1 : 0);
    return `<div class="pass-hd">
        <div><small>${t("Sezon")} ${p.season + 1} · ${t("{n} gün kaldı", { n: seasonLeftDays() })}</small><b>${t("Destan Yolu")} · ${tier}/${PASS_TIERS}</b>
        <div class="pbar"><i style="width:${tier >= PASS_TIERS ? 100 : tr_.passProgress() * 100}%"></i><span>${tier >= PASS_TIERS ? t("Zirve!") : `${p.xp % PASS_STEP}/${PASS_STEP}`}</span></div>
        <small class="dim">${t("Savaş kazan, boss yen, görev bitir, zanaat yap: her şey puan getirir.")}</small></div>
        <div class="pass-act">${can > 0 ? `<button class="btn go" data-sh="${on(() => tr_.claimAll())}">${t("Hepsini al")} (${can})</button>` : ""}
        ${p.prem ? `<span class="ppaid">★ ${t("Altın yol açık")} · +%10 ${t("puan")}</span>` : `<button class="btn buy" data-sh="${on(() => void tr_.buy("pass"))}">★ ${t("Altın yolu aç")} · ${tr_.price("pass")}</button>`}</div>
      </div>
      <div class="prow head"><b class="pt">#</b><span>${t("Ücretsiz")}</span><span class="gold">★ ${t("Altın yol")}</span></div>
      <div class="plist">${rows}</div>`;
  }

  private shopYarmak(on: (fn: () => void) => string): string {
    const tr_ = this.g.treasury;
    const card = (p: Product, big = false) => {
      const why = tr_.productWhy(p.id);
      const first = tr_.firstBonus(p.id);
      const done = why && why !== "Mağaza kapalı";
      return `<div class="pcard ${big ? "big" : ""} ${done ? "done" : ""}">${p.tag ? `<em class="rib">${t(p.tag)}</em>` : ""}${first ? `<em class="rib x2">${t("İlk alım 2×")}</em>` : ""}
        ${ic(p.icon, "pimg")}<b>${t(p.name)}</b><small>${t(p.desc)}</small>
        ${p.id.startsWith("y_") ? `<span class="yam">${ic("yarmak")}${first ? `<s>${p.yarmak}</s> ${p.yarmak! * 2}` : p.yarmak}${p.bonus ? ` <i>+${p.bonus}</i>` : ""}</span>` : ""}
        <button class="btn buy ${why ? "off" : ""}" data-sh="${on(() => void tr_.buy(p.id))}">${done ? t(why!) : tr_.price(p.id)}</button></div>`;
    };
    const store = tr_.store;
    const note = store === "native" ? t("Ödemeler Google Play / App Store üzerinden güvenle alınır.") : store === "dev" ? `<b class="warn">${t("TEST MAĞAZASI: gerçek para çekilmez.")}</b>` : t("Bu sürümde gerçek para ile satın alma kapalı. Yarmak'ı günlük hediye ve Destan Yolu'ndan kazanabilirsin.");
    return `<div class="pfeat">${card(PRODUCT_BY_ID.starter, true)}${card(PRODUCT_BY_ID.pass, true)}${card(PRODUCT_BY_ID.kervan, true)}</div>
      <h3>${ic("yarmak")} Yarmak</h3><div class="pgrid">${PRODUCTS.filter((p) => p.id.startsWith("y_")).map((p) => card(p)).join("")}</div>
      <div class="shnote">${note}<br>${t("Hazinedeki her şey oyunda da kazanılabilir: güç satılmaz, zaman kazandırılır. Sandık oranları açıkça yazılıdır.")}</div>`;
  }

  private chestFx: ChestDrop[] | null = null;

  private shopChest(on: (fn: () => void) => string): string {
    const tr_ = this.g.treasury;
    const st = tr_.st;
    const open = (k: 1 | 10) => {
      const res = tr_.openChests(k);
      if (!res) return;
      audio.play("chest");
      haptic([30, 50, 80]);
      this.chestFx = res;
      this.renderShop();
    };
    const fx = this.chestFx;
    this.chestFx = null;
    const reveal = fx
      ? `<div class="chfx">${fx.map((d, i) => `<div class="chcard r${d.rar}" style="--d:${0.25 + i * 0.12}s">${ic(d.icon)}<small class="r${d.rar}">${t(d.text)}</small></div>`).join("")}</div>`
      : "";
    const left = Math.max(1, CHEST_PITY - st.pity);
    return `<div class="chest">
        <div class="chart ${fx ? "opened" : ""}">${ic("sandik", "chimg")}</div>
        <div class="chinfo"><b>${t("Destan Sandığı")}</b><small>${t("Destan eşyasına en fazla {n} sandık kaldı.", { n: left })}</small>${st.chests ? `<small class="cheap">${t("Hediye sandık")}: ${st.chests}</small>` : ""}
          <div class="row"><button class="btn go" data-sh="${on(() => open(1))}">${st.chests ? t("Hediyeyi aç") : `${t("Aç")} · ${ic("yarmak")}${CHEST_PRICE}`}</button><button class="btn buy" data-sh="${on(() => open(10))}">10× · ${ic("yarmak")}${CHEST10_PRICE} <i>-%10</i></button></div>
        </div>
      </div>${reveal}
      <h3>${t("Oranlar")}</h3>
      <div class="odds-tbl">${CHEST_TABLE.map((c) => `<div>${ic(c.icon)}<span>${t(c.name)}</span><b>%${Math.round(c.p * 100)}</b></div>`).join("")}<div class="pity">${ic("trophy")}<span>${t("Garanti: {n} sandıkta bir destan eşyası", { n: CHEST_PITY })}</span><b>✓</b></div></div>`;
  }

  private shopSpend(on: (fn: () => void) => string): string {
    const tr_ = this.g.treasury;
    return `<div class="pgrid">${SPENDS.map((sp) => {
      const desc = sp.id === "kese" ? `+${fmt(tr_.purseGold())} altın` : sp.id === "hazine" ? `+${fmt(tr_.purseGold() * 6)} altın` : sp.desc;
      return `<div class="pcard">${ic(sp.icon, "pimg")}<b>${t(sp.name)}</b><small>${t(desc)}</small><button class="btn buy ${tr_.st.yarmak < sp.price ? "dim" : ""}" data-sh="${on(() => tr_.spend(sp.id))}">${ic("yarmak")}${sp.price}</button></div>`;
    }).join("")}</div>`;
  }

  private shopLook(on: (fn: () => void) => string): string {
    const g = this.g;
    const tr_ = g.treasury;
    const fr = tr_.worn("frame");
    const lk = tr_.worn("lakap");
    const bn = tr_.worn("banner");
    const preview = `<div class="lookpv"><div class="pvface ${fr ? `fr fr-${fr.id}` : ""}" style="--fc:${fr?.color ?? "#e2bd62"}"><img src="${assetUrl(g.face())}" alt=""></div>
      <div><b>${g.s.hero.name}</b>${lk ? `<em style="color:${lk.color}">« ${t(lk.name)} »</em>` : ""}<div class="pvban" style="--bc:${bn?.color ?? "#8a5d2a"}">${tamgaSvg({ ...TAMGA_DEFAULT, ...g.s.tamga }, 40)}</div></div></div>`;
    const kinds: [CosKind, string][] = [["frame", "Çerçeveler"], ["banner", "Sancaklar"], ["lakap", "Lakaplar"]];
    const src = (c: Cosmetic) => (c.from === "pass" ? "Destan Yolu" : c.from === "chest" ? "Sandık" : c.from === "starter" ? "Yolcu Kesesi" : c.from === "deed" ? c.desc : "");
    return (
      preview +
      kinds.map(([k, name]) => `<h3>${t(name)}</h3><div class="cosgrid">${COSMETICS.filter((c) => c.kind === k).map((c) => {
        const own = tr_.owns(c.id);
        const worn = tr_.st.equip[k] === c.id;
        const btn = own
          ? `<button class="btn sm ${worn ? "go" : ""}" data-sh="${on(() => tr_.equip(k, worn ? null : c.id))}">${worn ? t("Kuşanıldı") : t("Kuşan")}</button>`
          : c.price ? `<button class="btn sm buy" data-sh="${on(() => tr_.buyCos(c.id))}">${ic("yarmak")}${c.price}</button>` : `<small class="dim">🔒 ${t(src(c))}</small>`;
        return `<div class="cos ${own ? "own" : ""} ${worn ? "worn" : ""}" style="--cc:${c.color}"><i class="sw k-${k}"></i><b>${t(c.name)}</b><small>${t(c.desc)}</small>${btn}</div>`;
      }).join("")}</div>`).join("")
    );
  }

  private siegeEl: HTMLElement | null = null;

  openSiege(): void {
    this.close();
    this.siegeEl?.remove();
    const el = document.createElement("div");
    el.className = "battle siege";
    this.root.appendChild(el);
    this.siegeEl = el;
    this.renderSiege();
  }

  closeSiege(): void {
    this.siegeEl?.remove();
    this.siegeEl = null;
  }

  private renderSiege(): void {
    const g = this.g, r = g.siegeRun, el = this.siegeEl;
    if (!r || !el) return this.closeSiege();
    const en = lang() === "en";
    const s = g.s;
    const over = r.day > SIEGE_MAX_DAY;
    const food = g.siegeFood();
    const odds = Math.round(g.siegeAssaultOdds() * 100);
    const pc = Math.round(parleyChance(r, g.siegeCtx()) * 100);
    const run = (fn: () => void) => this.act(() => {
      fn();
      this.renderSiege();
    });
    const wallPct = Math.round(100 - r.breach);
    const towers = Array.from({ length: 7 }, (_, i) => `<i class="${(i + 0.5) / 7 * 100 < r.breach ? "down" : ""}${i === 3 && r.sap ? " sap" : ""}"></i>`).join("");
    const phase = siegePhase(r);
    const phaseBg = assetUrl(ARENAS[SIEGE_PHASE_ARENA[phase]].img);
    el.innerHTML = `<div class="bbox sgbox ph-${phase}" style="background-image:linear-gradient(180deg,#0a0603cc,#0a0603aa 45%,#0a0603ee),url('${phaseBg}')">
      <h2>${ic("siege")} ${g.siegeName(r.city)} ${t("kuşatması")} · ${t("Gün")} ${Math.min(r.day, SIEGE_MAX_DAY)}/${SIEGE_MAX_DAY} <em class="sgphase">${t(SIEGE_PHASE_LABEL[phase])}</em></h2>
      <div class="sgwall">${towers}</div>
      ${bar(wallPct, 100, "sgw", `${t("Sur sağlamlığı")} ${wallPct}%`)}
      ${bar(r.morale, 100, "sgm", `${t("Savunmacı morali")} ${Math.round(r.morale)}`)}
      <div class="sgstats">
        <span>${ic("shield")} ${t("Garnizon")}: <b>${armySize(siegeGar(r))}</b></span>
        <span>${ic("swords")} ${t("Ordun")}: <b>${armySize(g.siegeArmy(r.city))}</b></span>
        <span>${ic("food")} ${t("Erzak")}: <b class="${s.res.food < food ? "dear" : ""}">${Math.floor(s.res.food)}</b> <small>(-${food}/${t("gün")})</small></span>
        <span class="${r.relief <= 2 && r.relief > 0 ? "sg-urgent" : ""}">${ic("tug")} ${r.relief > 30 ? `<b>${t("Yardım gelmez")}</b>` : r.relief > 0 ? `${t("Yardım ordusu")}: <b class="dear">${r.relief} ${t("gün")}</b>` : `<b>${t("Yardım ordusu geldi")}</b>`}</span>
        <span>${ic("b_tasocagi")} ${t("Lağım")}: <b>${r.sap}/3</b></span>
        <span>${ic("siege")} ${t("Mancınık")}: <b>${r.engines}</b></span>
      </div>
      ${r.relief <= 2 && r.relief > 0 ? `<div class="odds bad sg-warn">${t("Yardım yaklaşıyor — hücum (~%{o}) veya elçi (~%{p}) düşün.", { o: odds, p: pc })}</div>` : ""}
      ${r.breach >= 70 && odds >= 55 ? `<div class="odds good">${t("Gedik açık · hücum avantajlı (~%{o})", { o: odds })}</div>` : ""}
      <div class="sgacts">${over ? "" : SIEGE_ACTS.map((a) => {
        const tip = a.id === "parley" && pc >= 40 ? " tip" : a.id === "bombard" && r.engines && r.breach < 70 ? " tip" : a.id === "starve" && r.relief > 4 ? " tip" : "";
        return `<button class="btn sgact${tip}" data-sg="${a.id}" data-a="${run(() => g.siegeAct(a.id))}">${ic(a.icon)}<b>${en ? a.en[0] : a.name}${a.id === "parley" ? ` ~%${pc}` : ""}</b><small>${en ? a.en[1] : a.desc}</small></button>`;
      }).join("")}</div>
      <div class="sgend">
        <button class="btn go big ${r.relief <= 1 || (r.breach >= 70 && odds >= 50) ? "pulse" : ""}" data-sg="assault" data-a="${this.act(() => g.siegeAssault())}">${t("Hücum!")} <small>~%${odds}</small></button>
        <button class="btn bad" data-sg="retreat" data-a="${this.act(() => g.siegeRetreat())}">${t("Geri çekil")}</button>
      </div>
      <ul class="sglog">${r.log.slice(0, 6).map((l) => `<li class="${l.cls}">${l.t}</li>`).join("")}</ul>
    </div>`;
  }

  gamepad: Gamepad | null = null;

  private padPress(b: PadButton, ui: boolean): void {
    const g = this.g;
    if (this.archery || this.minigame) {
      if (b === "b") window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", key: "Escape" }));
      else if (b === "lb" || b === "y") this.minigame?.move?.(-1);
      else if (b === "rb" || b === "x") this.minigame?.move?.(1);
      return;
    }
    if (this.menuOpen) {
      if (b === "b" || b === "back" || b === "start") this.closeMenu();
      return;
    }
    if (this.modal()) return;
    if (ui) {
      if (b === "b" || (b === "start" && this.place?.kind === "hero")) this.close();
      else if (b === "lb" || b === "rb") {
        const d = b === "rb" ? 1 : -1;
        const sub = [...this.panel.querySelectorAll<HTMLElement>(".tabs.sub .tab")];
        const si = sub.findIndex((x) => x.classList.contains("on"));
        if (sub.length && sub[si + d]) sub[si + d].click();
        else {
          const tabs = [...this.panel.querySelectorAll<HTMLElement>(".tabs:not(.sub) .tab")];
          const i = tabs.findIndex((x) => x.classList.contains("on"));
          if (tabs.length) tabs[(i + d + tabs.length) % tabs.length].click();
        }
      }
      return;
    }
    if (b === "a") g.cam.onTap(g.cam.x, g.cam.y);
    else if (b === "start") this.openHero();
    else if (b === "back") this.openMenu();
    else if (b === "l3") this.cycleSpeed();
    else if (b === "y") g.cam.flyTo(g.s.hero.x, g.s.hero.y, Math.max(g.cam.zoom, 0.7));
    else if (b === "x" && g.s.bird && g.s.free) g.aimBird();
    else if (b === "lb") g.cam.zoomBy(1 / 1.25);
    else if (b === "rb") g.cam.zoomBy(1.25);
  }

  private act(fn: () => void): string {
    const id = "a" + this.actN++;
    this.acts.set(id, () => {
      fn();
      this.render();
    });
    return id;
  }

  panelOpen(): boolean {
    return !this.panel.classList.contains("hidden") || this.battleOpen || this.storyOpen || this.menuOpen || !!this.siegeEl;
  }

  speed(): number {
    if (this.g.battleLock || this.modal() || this.archery || this.minigame) return 1;
    if (this.jv) return Math.max(JOURNEY_SPEED, settings.speed ?? 1);
    return settings.speed ?? 1;
  }

  /** Dar ekranda yalnızca ilk görev tek satır görünür; diğerleri "+N" ile açılır. */
  private foldTrack(): void {
    const qs = [...this.trackEl.querySelectorAll<HTMLElement>(".quest")].filter((q) => !q.classList.contains("hidden"));
    const fold = this.narrow.matches && !this.trackOpen;
    qs.forEach((q, i) => {
      q.classList.toggle("fold", fold && i > 0);
      q.classList.toggle("slim", fold && i === 0);
    });
    const n = fold ? qs.length - 1 : 0;
    this.moreEl.classList.toggle("hidden", !this.narrow.matches || qs.length < 2);
    const label = this.trackOpen ? "▴" : `+${n}`;
    if (this.moreEl.textContent !== label) this.moreEl.textContent = label;
  }

  journeyOpen(from: string, to: string): void {
    this.jv?.close();
    const g = this.g;
    this.jv = new JourneyView(this.root, from, to, {
      env: () => g.tripEnv(),
      prog: () => g.tripProg(),
      clock: () => g.tripClock(),
      skip: () => g.tripEnd(),
      stop: () => g.tripEnd(true),
    });
    audio.play("story");
  }

  journeyLog(text: string): void {
    this.jv?.log(text);
  }

  journeyClose(): void {
    this.jv?.close();
    this.jv = null;
  }

  cityScene(d: Omit<CitySceneData, "img">): void {
    this.cs?.close();
    this.cs = new CityScene(this.root, { ...d, img: assetUrl("cities/" + d.id) }, () => (this.cs = null));
    audio.play("story");
  }

  /** Şehir sekmesine ilk girişte kısa 2.5D iç mekan vignette (cine açıksa). */
  private maybeInterior(cityId: string, tab: string, scene: string, title: string, npc?: string): void {
    if (!settings.cine || this.interiorBusy || this.cs || this.storyOpen || this.battleOpen) return;
    const key = `${cityId}:${tab}`;
    if (this.interiorSeen.has(key)) return;
    this.interiorSeen.add(key);
    this.interiorBusy = true;
    const el = document.createElement("div");
    el.className = "intflash";
    el.innerHTML = `<div class="int-bg" style="background-image:url('${assetUrl(scene)}')"></div>${npc ? `<img class="int-npc" src="${assetUrl(npc)}" alt="">` : ""}<div class="int-cap"><small>${t("Şehir")}</small><b>${title}</b></div>`;
    this.root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("on"));
    audio.play("page");
    window.setTimeout(() => {
      el.classList.add("out");
      window.setTimeout(() => {
        el.remove();
        this.interiorBusy = false;
      }, 480);
    }, 1600);
  }

  /** Kaçış denemesinde muhafız tell micro-savaşı. */
  escapeGuardBattle(done: (won: boolean) => void): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.escapeGuardBattle(done));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    audio.play("horn");
    const el = document.createElement("div");
    el.className = "battle prolog-micro";
    el.innerHTML = `<div class="bbox story choice pmbox">
      <h2>${ic("swords")} ${t("Sur muhafızı")}</h2>
      <p class="dim">${t("Gedikte bir nöbetçi seni gördü. Tek tur — doğru emir geceyi kurtarır.")}</p>
      <div class="btell urgent pm-tell"><b>⚠ ${t("Mızrak hücumu")}</b><span>${t("Muhafız mızrağını indiriyor. Siper hasarı keser; nara ile üstüne atılmak seni açık bırakır.")}</span><small>${t("Karşıla")}: ${t("Kalkan Siperi")}</small></div>
      <div class="pm-ords">
        <button type="button" class="btn big" data-o="nara">${ic("ord_nara")} ${t("Nara")}<em>${t("Gürültü · nöbetçi çağırır")}</em></button>
        <button type="button" class="btn big go" data-o="siper">${ic("ord_siper")} ${t("Kalkan Siperi")}<em>${t("Sessiz geçiş · doğru")}</em></button>
      </div>
    </div>`;
    this.root.appendChild(el);
    const finish = (won: boolean) => {
      el.remove();
      this.storyOpen = false;
      audio.play(won ? "clash" : "hit");
      this.toast(won ? t("Muhafızı geçtin — gece seni yuttu.") : t("Nöbetçi bağırdı; yine kaçtın ama iz bıraktın."), won ? "good" : "info");
      done(won);
      this.nextStory();
    };
    el.querySelectorAll<HTMLButtonElement>("[data-o]").forEach((b) => b.addEventListener("click", () => finish(b.dataset.o === "siper")));
  }

  cycleSpeed(): void {
    settings.speed = (((settings.speed ?? 1) % 3) + 1) as 1 | 2 | 3;
    saveSettings();
    this.toast(t("Oyun hızı: {n}x", { n: settings.speed }), "info");
    this.liveT = 0;
  }

  menuOpen = false;
  photo: { open(): void; on: boolean } | null = null;
  private menuEl: HTMLElement | null = null;
  private menuDone: (() => void) | null = null;
  private menuFly = 0;
  private menuCity = 0;

  openPhoto(): void {
    if (!this.photo || this.g.s.cls === null) return;
    this.close();
    this.closeMenu();
    this.photo.open();
  }

  openMenu(title = false, done: (() => void) | null = null): void {
    const g = this.g;
    if (this.menuOpen || this.archery || this.minigame || this.battleOpen || this.storyOpen) return;
    this.close();
    g.cam.keys.clear();
    this.menuOpen = true;
    this.menuDone = done;
    this.menuFly = 0;
    const s = g.s;
    const started = s.cls !== null;
    const inf = slotInfo(curSlot());
    const cl = s.cls ? CLASSES.find((c) => c.id === s.cls) : null;
    const desktop = navigator.userAgent.includes("Electron");
    const items: [string, string, string, () => void][] = [
      [title ? (started ? t("Destana devam et") : t("Yeni destan")) : t("Oyuna dön"), started ? `${s.hero.name} · ${cl?.name ?? ""} · ${t("Sv")} ${s.hero.lv}${inf?.renown ? ` · ${ic("crown")}${inf.renown}` : ""}` : t("Bir köle olarak başla, hakan olarak öl"), "go", () => this.closeMenu()],
      [t("Kayıt yuvaları"), t("Yükle, yeni yuva aç, dışa/içe aktar"), "", () => this.menuTo("ayar")],
      ...(started ? ([[t("Bitig"), t("Bozkır ansiklopedisi · {n}/{m} sayfa", { n: s.bitig?.length ?? 0, m: CODEX.length }), "", () => this.menuTo("bitig")]] as [string, string, string, () => void][]) : []),
      [t("Ayarlar"), t("Ses, görüntü, anlatıcı, dil"), "", () => this.menuTo("ayar")],
      ...(started && !title ? ([[t("Fotoğraf modu"), t("Arayüzü gizle, süzgeç seç, anı yakala (P)"), "", () => this.openPhoto()]] as [string, string, string, () => void][]) : []),
      ...(desktop ? ([[t("Oyundan çık"), t("İlerlemen kaydedilir"), "red", () => { g.saveNow(); window.close(); }]] as [string, string, string, () => void][]) : []),
    ];
    const el = document.createElement("div");
    el.className = `battle kkmenu${title ? " title" : ""}`;
    const mapBg = assetUrl("cine/silk_road_map");
    el.innerHTML = `${title && mapBg ? `<div class="mmap" style="background-image:url('${mapBg}')"></div>` : ""}<div class="mwrap">
      <div class="mlogo">${tamgaSvg({ ...TAMGA_DEFAULT, ...s.tamga }, 64)}<h1>Kervan Krallık</h1><p>${t("İpek Yolu'nda bir köleden hakana")}</p></div>
      ${title && mapBg ? `<img class="mmap-thumb" src="${mapBg}" alt="${t("İpek Yolu")}">` : ""}
      <div class="mbtns">${items.map(([label, sub, cls], i) => `<button class="mbtn ${cls}" data-m="${i}"><b>${label}</b><small>${sub}</small></button>`).join("")}</div>
      <div class="mfoot">${(Object.keys(LANGS) as Lang[]).map((l) => `<button class="btn sm ${lang() === l ? "on" : ""}" data-l="${l}">${LANGS[l]}</button>`).join("")}<span class="dim">${title ? "" : t("Oyun duraklatıldı")}</span></div>
    </div>`;
    el.addEventListener("click", (e) => {
      const tg = e.target as HTMLElement;
      const m = tg.closest("[data-m]") as HTMLElement | null;
      if (m) {
        audio.play("click");
        items[Number(m.dataset.m)][3]();
        return;
      }
      const l = (tg.closest("[data-l]") as HTMLElement | null)?.dataset.l as Lang | undefined;
      if (l && l !== lang()) {
        settings.lang = l;
        saveSettings();
        if (started) g.saveNow();
        location.reload();
      }
    });
    this.root.appendChild(el);
    this.menuEl = el;
    document.body.classList.toggle("titled", title);
  }

  closeMenu(): void {
    if (!this.menuOpen) return;
    if (this.menuEl?.classList.contains("title")) this.g.cam.flyTo(this.g.s.hero.x, this.g.s.hero.y, 0.75);
    this.menuEl?.remove();
    this.menuEl = null;
    this.menuOpen = false;
    document.body.classList.remove("titled");
    const done = this.menuDone;
    this.menuDone = null;
    done?.();
  }

  /** Bağlamsal ipucu: sağ üstte tek kart, kendiliğinden kaybolur. */
  tip(icon: string, text: string, open: (() => void) | null = null, ttl = 16000): void {
    this.root.querySelector(".tipc")?.remove();
    const el = document.createElement("div");
    el.className = `tipc${open ? " link" : ""}`;
    el.innerHTML = `${ic(icon, "ni")}<div><small>${t("İpucu")}</small><span>${text}</span>${open ? `<em>${t("Göster")} ›</em>` : ""}</div><button class="x" aria-label="×">×</button>`;
    const drop = () => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 350);
    };
    el.querySelector(".x")!.addEventListener("click", (e) => {
      e.stopPropagation();
      drop();
    });
    el.addEventListener("click", () => {
      drop();
      open?.();
    });
    this.root.appendChild(el);
    audio.play("click");
    setTimeout(drop, ttl);
  }

  private feastHtml(city: string, near: boolean): string {
    const g = this.g, s = g.s;
    if (!s.free) return "";
    const on = g.buff("ziyafet");
    const n = armySize(s.hero.army);
    const lv = g.vakifLv(city);
    const v = VAKIF[lv];
    return (
      `<div class="brow">${ic("food", "bimg")}<div class="bi2"><b>${t("Ordu şöleni")}</b><small>${on ? t("Şölen bereketi sürüyor: {n} savaş daha +%10 güç.", { n: s.buffs.ziyafet }) : t("Kazanlar kaynar, kımız akar: sonraki üç savaşta ordun +%10 güçlü.")}</small></div><button class="btn sm ${!near || on || !n || s.res.gold < g.feastCost() ? "off" : ""}" data-a="${this.act(() => g.armyFeast())}">${t("Şölen ver")}<br>${ic("coins")}${g.feastCost()}</button></div>` +
      (s.renown < 30 && !lv ? this.lockHtml("crown", t("Vakıf"), t("{n} şöhrette açılır", { n: 30 })) : this.vakifRows(city, near, lv, v))
    );
  }

  private lockHtml(icon: string, name: string, why: string): string {
    return `<div class="grow locked">${ic(icon, "gimg")}<div class="bi2"><b>${name}</b><small class="dim">${ic("lock")} ${why}</small></div></div>`;
  }

  private vakifRows(city: string, near: boolean, lv: number, v: (typeof VAKIF)[number] | undefined): string {
    const g = this.g, s = g.s;
    return (
      `<h3>${ic("crown")} ${t("Vakıf")} <em>${lv}/${VAKIF.length}</em></h3>` +
      VAKIF.map((x, i) => `<div class="qrow ${i < lv ? "cheap" : "dim"}">${i < lv ? "✓" : "·"} <b>${t(x.name)}</b> — ${t(x.perk)}</div>`).join("") +
      (v
        ? `<div class="brow">${ic("crown", "bimg")}<div class="bi2"><b>${t(v.name)} ${t("yaptır")}</b><small>+${v.renown} ${t("şöhret")}, kut +${v.kut}. ${t(v.perk)}</small></div><button class="btn sm ${!near || s.res.gold < v.cost ? "off" : ""}" data-a="${this.act(() => g.endow(city))}">${t("Yaptır")}<br>${ic("coins")}${fmt(v.cost)}</button></div>`
        : `<p class="dim">${t("Bu şehirdeki bütün vakıfları sen yaptırdın; adın kitabelere kazındı.")}</p>`)
    );
  }

  private recHtml(): string {
    const s = this.g.s, r = s.rec;
    if (!r?.fights) return "";
    const pct = Math.round((100 * r.wins) / r.fights);
    const duels = s.c.duels ?? 0;
    return (
      `<h3>${ic("swords")} ${t("Savaş karnesi")}</h3><div class="rec">` +
      `<div class="rring" style="--p:${pct}"><b>${pct}%</b><small>${t("zafer")}</small></div><div class="rgrid">` +
      `<div><b>${r.fights}</b>${t("savaş")}</div><div><b class="good">${r.wins}</b>${t("zafer")}</div><div><b class="bad">${r.fights - r.wins}</b>${t("yenilgi")}</div>` +
      `<div><b class="good">${r.routs}</b>${t("bozgun ettin")}</div><div><b class="bad">${r.routed}</b>${t("bozguna uğradın")}</div><div><b>${duels}/${r.duelTry}</b>${t("er meydanı")}</div>` +
      `<div><b>${s.kills}</b>${t("yere serilen")}</div></div></div>` +
      (r.best ? `<div class="rbest">${ic("trophy")}<span><small>${t("En büyük zafer")}</small>${r.best.title} · ${t("{n} düşman", { n: r.best.n })} · ${t("Gün")} ${r.best.day}</span></div>` : "")
    );
  }

  levelUp(lv: number, gains: string[], open: () => void): void {
    this.root.querySelector(".lvup")?.remove();
    this.root.querySelector(".regban")?.remove();
    const el = document.createElement("div");
    el.className = "lvup";
    el.innerHTML = `<div class="lvrays"></div><small>${t("Seviye atladın!")}</small><b>${lv}</b><ul>${gains.map((g, i) => `<li style="animation-delay:${0.45 + i * 0.12}s">${g}</li>`).join("")}</ul><em>${t("Puanları dağıt")} ›</em>`;
    const drop = () => {
      el.classList.add("out");
      setTimeout(() => el.remove(), 450);
    };
    el.addEventListener("click", () => {
      drop();
      open();
    });
    this.root.appendChild(el);
    audio.play("level");
    setTimeout(drop, 5200);
  }

  menuTo(tab: string): void {
    this.closeMenu();
    if (this.storyOpen) return;
    this.openHero();
    this.tab = tab;
    this.render();
  }

  menuTick(dt: number): void {
    if (!this.menuEl?.classList.contains("title")) return;
    this.menuFly -= dt;
    if (this.menuFly > 0) return;
    this.menuFly = 7;
    const s = this.g.s;
    const seen = CITIES.filter((c) => s.explored[Math.floor(c.y / NAV) * NW + Math.floor(c.x / NAV)]);
    const spots = seen.length > 1 ? seen : [{ x: s.hero.x, y: s.hero.y }, ...seen];
    const c = spots[this.menuCity++ % spots.length];
    this.g.cam.flyTo(c.x, c.y, 0.62);
  }

  private toastQ: { el: HTMLElement; ms: number }[] = [];

  /** Nadir+ döküm / set tamam: ekran ortası kıvılcım parçacıkları. */
  rarityBurst(rar: number): void {
    const el = document.createElement("div");
    el.className = `rar-burst r${Math.max(0, Math.min(4, rar))}`;
    el.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("i");
      p.style.setProperty("--i", String(i));
      p.style.setProperty("--a", `${(i / 16) * 360}deg`);
      el.appendChild(p);
    }
    this.root.appendChild(el);
    window.setTimeout(() => el.remove(), 1100);
  }

  notice(icon: string, title: string, sub: string, open: () => void, ttl = 0, alive?: () => boolean): void {
    const box = this.root.querySelector(".notes")!;
    const el = document.createElement("button");
    el.className = "note";
    el.innerHTML = `${ic(icon, "ni")}<span><b>${title}</b><small>${sub}</small></span>${ttl ? `<i class="nt" style="animation-duration:${ttl}ms"></i>` : ""}`;
    let gone = false;
    const drop = () => {
      if (gone) return;
      gone = true;
      el.classList.add("out");
      setTimeout(() => el.remove(), 350);
    };
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (gone) return;
      drop();
      audio.play("click");
      open();
    });
    box.appendChild(el);
    audio.play("quest");
    while (box.children.length > (this.narrow.matches ? 2 : 3)) box.firstElementChild!.remove();
    if (ttl) setTimeout(drop, ttl);
    if (alive) {
      const iv = setInterval(() => {
        if (gone || !el.isConnected) return clearInterval(iv);
        if (!alive()) {
          clearInterval(iv);
          drop();
        }
      }, 1000);
    }
  }

  private rumQ: string[] = [];
  private rumOn = false;

  /** Söylentiler bildirim yığınına değil, alt çubuğun üstündeki tek satırlık habere düşer. */
  rumor(text: string): void {
    if (this.rumQ.includes(text)) return;
    this.rumQ.push(text);
    if (this.rumQ.length > 5) this.rumQ.shift();
    if (!this.rumOn) this.nextRumor();
  }

  private nextRumor(): void {
    const el = this.root.querySelector<HTMLElement>(".rumor")!;
    const text = this.rumQ.shift();
    if (!text) {
      this.rumOn = false;
      el.classList.remove("on");
      return;
    }
    this.rumOn = true;
    el.innerHTML = `${ic("scroll", "ni")}<span></span>`;
    el.querySelector("span")!.textContent = text;
    el.title = text;
    el.classList.add("on");
    setTimeout(() => this.nextRumor(), 5200);
  }

  /** Pazar satırlarında kısa pulse. */
  pulseTrade(): void {
    this.panel?.querySelectorAll(".grow.trade").forEach((el) => {
      el.classList.remove("tpulse");
      void (el as HTMLElement).offsetWidth;
      el.classList.add("tpulse");
    });
  }

  toast(text: string, kind: "good" | "bad" | "info" = "info"): void {
    const rm = /^(Söylenti|Rumou?r): /.exec(text);
    if (rm) return this.rumor(text.slice(rm[0].length));
    if ([...this.toasts.children, ...this.toastQ.map((q) => q.el)].some((c) => c.textContent === text)) return;
    if (kind === "bad") audio.play("bad");
    else if (kind === "good" && /altın|\+/.test(text)) audio.play("coin");
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.textContent = text;
    this.pushToast(el, 2800);
  }

  private pushToast(el: HTMLElement, ms: number, first = false): void {
    if (this.covered || this.toasts.children.length >= (this.narrow.matches ? 2 : 3)) {
      if (first) this.toastQ.unshift({ el, ms });
      else this.toastQ.push({ el, ms });
      if (this.toastQ.length > 8) this.toastQ.splice(this.toastQ.findIndex((q) => !q.el.classList.contains("qdone")) >>> 0, 1);
      return;
    }
    this.toasts.appendChild(el);
    const fast = this.toastQ.length > 2 ? 0.6 : 1;
    setTimeout(() => el.classList.add("out"), ms * fast);
    setTimeout(() => {
      el.remove();
      const n = this.toastQ.shift();
      if (n) this.pushToast(n.el, n.ms, true);
    }, ms * fast + 450);
  }

  private storyQ: (() => void)[] = [];
  /** Sahneye özgü müzik (boss, sinematik); null ise oyun kendi seçer. */
  music: MusicScene | null = null;

  /**
   * Sinematik sahne: siyah şeritler, Ken Burns kaydırma, daktilo metni.
   * Her sayfa ayrı bir çekim; dokunuş önce metni tamamlar, sonra ilerletir.
   */
  cinema(img: string, title: string, html: string, opts: { credits?: string[]; done?: () => void } = {}): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.cinema(img, title, html, opts));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    const prevMusic = this.music;
    this.music = "epic";
    audio.duck(false);
    audio.play("story");
    const pages = storyPages(html);
    const el = document.createElement("div");
    el.className = "cine";
    el.innerHTML = `<div class="cn-fill" style="background-image:url('${assetUrl(img)}')"></div><div class="cn-bg" style="background-image:url('${assetUrl(img)}')"></div><div class="cn-vig"></div><div class="lb lbt"></div><div class="lb lbb"></div>
      <div class="cn-title"><small>${t("Destan")}</small><b>${title}</b></div>
      <div class="cn-txt"><p></p><span class="cn-more">▾</span></div>
      <button class="cn-skip">${t("Geç")} ›</button>`;
    this.root.appendChild(el);
    const bg = el.querySelector<HTMLElement>(".cn-bg")!;
    const p = el.querySelector<HTMLElement>(".cn-txt p")!;
    const more = el.querySelector<HTMLElement>(".cn-more")!;
    const pans = ["kb1", "kb2", "kb3", "kb4"];
    let pg = -1;
    let typing = 0;
    let finish: (() => void) | null = null;
    const type = (htmlPage: string) => {
      p.innerHTML = htmlPage;
      const nodes: { n: Text; s: string }[] = [];
      const walk = (n: Node) => {
        if (n.nodeType === 3) {
          nodes.push({ n: n as Text, s: n.textContent ?? "" });
          (n as Text).textContent = "";
        } else n.childNodes.forEach(walk);
      };
      walk(p);
      more.classList.remove("on");
      let ni = 0;
      let ci = 0;
      const speed = settings.speed >= 2 ? 5 : 2;
      finish = () => {
        clearInterval(typing);
        for (const x of nodes) x.n.textContent = x.s;
        more.classList.add("on");
        finish = null;
      };
      typing = window.setInterval(() => {
        for (let k = 0; k < speed; k++) {
          const cur = nodes[ni];
          if (!cur) return finish?.();
          ci++;
          cur.n.textContent = cur.s.slice(0, ci);
          if (ci >= cur.s.length) {
            ni++;
            ci = 0;
          }
        }
        if (Math.random() < 0.25) audio.play("type");
      }, 28);
    };
    const shot = () => {
      pg++;
      if (pg >= pages.length) return opts.credits ? roll() : end();
      bg.classList.remove(...pans);
      void bg.offsetWidth;
      bg.classList.add(pans[pg % pans.length]);
      el.classList.toggle("first", pg === 0);
      if (pg > 0) audio.play("page");
      type(pages[pg]);
    };
    const roll = () => {
      clearInterval(typing);
      el.classList.add("rolling");
      const c = document.createElement("div");
      c.className = "cn-credits";
      c.innerHTML = `<div class="cr-in">${opts.credits!.join("")}</div>`;
      el.appendChild(c);
      opts.credits = undefined;
      const dur = Math.max(14, c.querySelector(".cr-in")!.childElementCount * 1.6);
      c.style.setProperty("--dur", `${dur}s`);
      setTimeout(end, dur * 1000 + 600);
    };
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      clearInterval(typing);
      el.classList.add("out");
      this.music = prevMusic === "epic" ? null : prevMusic;
      setTimeout(() => {
        el.remove();
        this.storyOpen = false;
        // Destan kamerası: bölüm cine sonrası fotoğraf öner
        if (settings.cine && this.photo && !opts.credits) {
          this.toast(t("Destan kamerası: P ile kare kaydedebilirsin"), "info");
        }
        opts.done?.();
        this.nextStory();
      }, 700);
    };
    el.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".cn-skip")) return;
      if (el.classList.contains("rolling")) return end();
      if (finish) return finish();
      shot();
    });
    el.querySelector(".cn-skip")!.addEventListener("click", end);
    haptic([30, 40, 30]);
    setTimeout(shot, 1400);
  }

  story(title: string, img: string, html: string, btn = "Devam", done?: () => void): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.story(title, img, html, btn, done));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    audio.play("story");
    const pages = storyPages(html);
    let pg = 0;
    const el = document.createElement("div");
    el.className = "battle";
    const dots = pages.length > 1 ? `<div class="sdots">${pages.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : "";
    el.innerHTML = `<div class="bbox story${pages.length > 1 ? " paged" : ""}">${this.listenBtn()}<img class="simg" src="${assetUrl(img)}" alt=""><h2>${title}</h2><p class="spage">${pages[0]}</p>${dots}<button class="btn go big">${pages.length > 1 ? `${t("Devam")} ›` : btn}</button>${pages.length > 1 ? `<button class="sskip">${t("Geç")}</button>` : ""}</div>`;
    this.root.appendChild(el);
    this.wireListen(el, title, html);
    const go = el.querySelector<HTMLButtonElement>(".btn.go")!;
    const p = el.querySelector<HTMLElement>(".spage")!;
    const close = () => {
      hush();
      el.remove();
      this.storyOpen = false;
      done?.();
      this.nextStory();
    };
    go.addEventListener("click", () => {
      if (++pg >= pages.length) return close();
      audio.play("page");
      p.classList.remove("turn");
      void p.offsetWidth;
      p.classList.add("turn");
      p.innerHTML = pages[pg];
      el.querySelectorAll(".sdots i").forEach((d, i) => d.classList.toggle("on", i === pg));
      go.textContent = pg === pages.length - 1 ? btn : `${t("Devam")} ›`;
      if (pg === pages.length - 1) el.querySelector(".sskip")?.remove();
    });
    el.querySelector(".sskip")?.addEventListener("click", close);
  }

  private spiritBtn(): string {
    const why = this.g.spiritWhy();
    return `<div class="sprow"><button class="btn spbtn ${why ? "off" : ""}" data-a="${this.act(() => this.spiritRite())}">${ic("ruh")} Kam ayini · ruhlar dünyası</button><small class="dim">${why ?? `${this.g.spiritCost()} Ruh Taşı · Üst ya da Alt Dünya'ya yolculuk`}</small></div>`;
  }

  spiritRite(): void {
    const g = this.g;
    const why = g.spiritWhy();
    if (why) return this.toast(why, "bad");
    if (this.storyOpen || this.battleOpen || !g.spiritBegin()) return;
    this.close();
    this.storyOpen = true;
    audio.play("story");
    const v = new SpiritView(this.root);
    const end = (after?: () => void) => {
      v.close();
      this.storyOpen = false;
      if (after) after();
      else this.nextStory();
    };
    const pick = (id: string) => {
      const r = g.spiritChoose(id);
      v.panel(r.title, r.html, [{ label: r.fight ? "Kılıcını çek" : "Davula tutunup dön", cls: r.fight ? "red" : "go", fn: () => end(r.fight ? () => g.spiritFight() : undefined) }]);
    };
    const realm = (r: Realm) => {
      v.setRealm(r);
      v.panel(
        r === "ust" ? "Üst Dünya" : "Alt Dünya",
        r === "ust" ? "Kayın ağacının dallarına tutunup dokuz kat göğe tırmandın. Yıldızlar ayağının altında, Ülgen'in ak ışığı tepende." : "Ateşin külünden yerin dibine indin. Dokuz kat aşağıda, mor sisin içinde iki göz seni izliyor.",
        g.spiritOpts(r).map((o) => ({ label: `<b>${o.name}</b><small>${o.off ?? o.text}</small>`, cls: o.off ? "off opt" : "opt", fn: () => pick(o.id) })),
      );
    };
    v.setRealm("drum");
    v.panel("Kam Ayini", `Ateş yandı, ardıç tütsüsü dumanlandı. Kam davulunu ısıtıp vurmaya başladı; her vuruşta bedenin biraz daha hafifliyor. Davul bir ata dönüştü.<br><br><small class="dim">Ruh Taşı: −${g.spiritCost()}</small>`, [
      { label: "Üst Dünya · Ülgen'in gökleri", cls: "go", fn: () => realm("ust") },
      { label: "Alt Dünya · Erlik'in katları", cls: "red", fn: () => realm("alt") },
    ]);
  }

  private listenBtn(): string {
    return canNarrate() ? `<button class="listen" title="${t("Dinle")}" aria-label="${t("Dinle")}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffd56a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#ffd56a33"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>` : "";
  }

  private wireListen(el: HTMLElement, title: string, html: string): void {
    const b = el.querySelector<HTMLButtonElement>(".listen");
    if (!b) return;
    const sync = () => b.classList.toggle("on", speaking());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      if (speaking()) hush();
      else narrate(title, html);
      sync();
    });
    if (settings.narrate && !audio.muted) setTimeout(() => {
      if (el.isConnected) narrate(title, html);
      sync();
    }, 350);
    const iv = setInterval(() => (el.isConnected ? sync() : clearInterval(iv)), 500);
  }

  choice(title: string, img: string, html: string, opts: { label: string; cls: string; fn: () => void }[]): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.choice(title, img, html, opts));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    opts = [...opts.filter((o) => !o.cls.includes("off")), ...opts.filter((o) => o.cls.includes("off"))];
    const el = document.createElement("div");
    el.className = "battle";
    el.innerHTML = `<div class="bbox story choice">${this.listenBtn()}<img class="simg" src="${assetUrl(img)}" alt=""><h2>${title}</h2><p>${html}</p>${opts.map((o, i) => `<button class="btn big ${o.cls}" data-i="${i}">${o.label}</button>`).join("")}</div>`;
    this.root.appendChild(el);
    this.wireListen(el, title, html);
    el.querySelectorAll<HTMLButtonElement>(".btn").forEach((b) =>
      b.addEventListener("click", () => {
        const o = opts[Number(b.dataset.i)];
        if (o.cls.includes("off")) return;
        hush();
        el.remove();
        this.storyOpen = false;
        o.fn();
        this.nextStory();
      }),
    );
  }

  /** Destan bitince gösterilen, kopyalanabilir metin kartı: kahraman adı, son adı, tamga ve bir dize. */
  shareCard(name: string, ending: string, tamga: Tamga | undefined, verse: string): void {
    if (this.storyOpen || this.battleOpen) {
      this.storyQ.push(() => this.shareCard(name, ending, tamga, verse));
      return;
    }
    this.storyOpen = true;
    this.stash();
    this.close();
    const tg = tamgaSvg({ ...TAMGA_DEFAULT, ...tamga }, 72);
    const plain = `${name} · ${ending}\n${verse}\n#KervanKrallık`;
    const el = document.createElement("div");
    el.className = "battle";
    el.innerHTML = `<div class="bbox story choice sharecard">
      <h2>${ic("scroll")} ${t("Destan Kartı")}</h2>
      <div class="sc-card">
        <div class="sc-tamga">${tg}</div>
        <b class="sc-name">${name}</b>
        <em class="sc-end">${ending}</em>
        <p class="sc-verse">${verse}</p>
      </div>
      <button class="btn big go sc-copy">${t("Kopyala")}</button>
      <button class="btn sc-close">${t("Kapat")}</button>
    </div>`;
    this.root.appendChild(el);
    const close = () => {
      el.remove();
      this.storyOpen = false;
      this.nextStory();
    };
    el.querySelector(".sc-copy")!.addEventListener("click", () => {
      audio.play("click");
      navigator.clipboard
        ?.writeText(plain)
        .then(() => this.toast(t("Kopyalandı!"), "good"))
        .catch(() => this.toast(t("Kopyalanamadı"), "bad"));
    });
    el.querySelector(".sc-close")!.addEventListener("click", close);
  }

  tactics(title: string, enemy: Army, boss: Boss | null, foe: string, stance: Tactic | null, w: Record<Tactic, number>, opts: { t: Tactic; odds: number; lo?: number; hi?: number }[], last: Tactic, pick: (t: Tactic) => void, flee: string, onFlee: () => void, tell: string | null = null, field: Field | null = null, auto: { odds: number; fn: () => void } | null = null): void {
    if (this.storyOpen) {
      this.storyQ.unshift(() => this.tactics(title, enemy, boss, foe, stance, w, opts, last, pick, flee, onFlee, tell, field, auto));
      return;
    }
    this.battleOpen = true;
    this.close();
    const el = document.createElement("div");
    el.className = "battle";
    const intel = stance
      ? `<div class="intel known">${ic("scroll")}<div>Gözcülerin haber getirdi: düşman <b>${TACTICS[stance].foe}</b>.</div></div>`
      : `<div class="intel">${ic("scroll")}<div>${tell ? `<i class="tell">${tell}</i>` : ""}<small>${t("Düşmanı oku: doğru taktik +%25 TP getirir. İşaretler bazen yanıltır.")} ${TACTIC_KEYS.map((k) => `${TACTICS[k].name} %${Math.round(w[k] * 100)}`).join(" · ")}</small><small>Çeviklik 6, Ferhat ya da Hırsız sınıfı gözcülük sağlar.</small></div></div>`;
    const kit = field?.kit ?? bossKit(boss);
    const ar = field?.arena ? ARENAS[field.arena] : null;
    const kin = field?.kin ? KINS[field.kin] : null;
    const gName = ar ? ar.name : field ? GROUNDS[field.ground].name : "";
    const gText = ar ? ar.text : field ? GROUNDS[field.ground].text : "";
    const gIcon = ar ? ar.img : field ? GROUNDS[field.ground].icon : "";
    el.innerHTML = `<div class="bbox tbox${kit ? " tkitbox th-" + kit.theme : ""}"><h2>${ic("swords")} ${title}</h2>
      <div class="tfoe">${ic(boss?.icon ?? (kin?.icons.spear ?? "j_bandit"), "bp" + (boss ? " boss" : ""))}<div>${kit ? `<small class="ktitle">${t(kit.title)}</small>` : ""}<b>${boss?.name ?? foe}</b>${armySize(enemy) ? armyHtml(enemy) : ""}</div></div>
      ${kit ? `<div class="tkit"><b>${t("Hamleleri")}</b>${kit.moves.map((m) => `<span title="${t(MOVE_HINT[m.kind])}">${ic(ORDERS[COUNTER[m.kind]].icon)}<i>${t(m.name)}</i><em>→ ${t(ORDERS[COUNTER[m.kind]].name)}</em></span>`).join("")}<small>${t("Boss hamlesini bir tur önceden belli eder. Doğru emirle karşılarsan sendeler ve ağır yara alır; karşılık emri tekrar kullanılabilir.")}</small></div>` : ""}
      ${intel}
      ${field ? `<div class="tground g-${field.ground}${ar ? " arena" : ""}">${ar ? `<img class="ic" src="${assetUrl(gIcon)}" alt="">` : ic(gIcon)}<div><b>${t(gName)}${field.night ? ` · ${t("Gece")}` : ""}</b><small>${t(gText)}${field.night ? ` ${t("Karanlıkta oklar şaşar: okçu -%25.")}` : ""}${field.sky ? `<span class="sky">${t(SKIES[field.sky].name)}: ${t(SKIES[field.sky].text)}</span>` : ""}${kin ? `<span class="kinl">◆ ${t(kin.name)}: ${t(kin.text)}</span>` : ""}${field.note ? `<span class="lairn">⚑ ${t(field.note)}</span>` : ""}</small></div></div>` : ""}
      <div class="tacts">${opts
        .map((o) => {
          const T = TACTICS[o.t];
          const range = o.lo !== undefined && o.hi !== undefined && o.hi - o.lo >= 0.1 ? `<small class="orange">%${Math.round(o.lo * 100)}–%${Math.round(o.hi * 100)}</small>` : "";
          return `<button class="tact ${o.t === last ? "last" : ""}" data-t="${o.t}">${ic(T.icon, "ti")}<b>${T.name}</b><small>${T.text}</small><small class="tbeat">${TACTICS[T.beats].name} karşısında güçlü</small><span class="odds ${o.odds >= 0.7 ? "good" : o.odds >= 0.4 ? "mid" : "bad"}">%${Math.round(o.odds * 100)}${range}</span></button>`;
        })
        .join("")}</div>${armySize(this.g.s.hero.army) >= RESERVE_MIN ? `<button class="tresv ${this.g.reserve ? "on" : ""}">${ic("tug")}<div><b>${t("Yedek kuvvet ayır")} <em>${this.g.reserve ? t("Açık") : t("Kapalı")}</em></b><small>${t("Askerlerin dörtte biri tepede bekler; savaşın ortasında 'Yedekler!' emriyle taze kuvvet olarak iner.")}</small></div></button>` : ""}${auto ? `<button class="btn go tauto">${ic("swords")} ${t("Otomatik çöz")} · %${Math.round(auto.odds * 100)}</button>` : ""}<button class="btn flee">${flee}</button></div>`;
    this.root.appendChild(el);
    el.querySelector(".tauto")?.addEventListener("click", () => {
      el.remove();
      this.battleOpen = false;
      auto!.fn();
    });
    el.querySelector(".tresv")?.addEventListener("click", (e) => {
      const b = e.currentTarget as HTMLElement;
      this.g.reserve = !this.g.reserve;
      b.classList.toggle("on", this.g.reserve);
      b.querySelector("em")!.textContent = this.g.reserve ? t("Açık") : t("Kapalı");
      audio.play("click");
    });
    el.querySelector(".flee")!.addEventListener("click", () => {
      el.remove();
      this.battleOpen = false;
      onFlee();
      this.nextStory();
    });
    el.querySelectorAll<HTMLButtonElement>(".tact").forEach((b) =>
      b.addEventListener("click", () => {
        el.remove();
        this.battleOpen = false;
        pick(b.dataset.t as Tactic);
      }),
    );
  }

  private resume: { place: NonNullable<Hud["place"]>; tab: string } | null = null;

  private stash(): void {
    if (this.place && !this.panel.classList.contains("hidden") && !this.resume) this.resume = { place: this.place, tab: this.tab };
  }

  private nextStory(): void {
    const n = this.storyQ.shift();
    if (n) return n();
    const r = this.resume;
    this.resume = null;
    if (!r || this.battleOpen || this.storyOpen || this.menuOpen || !this.panel.classList.contains("hidden")) return;
    if (r.place.kind === "hero") return;
    this.openPlace(r.place as Target);
    this.tab = r.tab;
    this.render();
  }

  questDone(q: Quest, label = "Görev tamamlandı"): void {
    audio.play("quest");
    const el = document.createElement("div");
    el.className = "qdone";
    el.innerHTML = `${ic(label === "Görev tamamlandı" ? "quest" : "trophy", "qi")}<div><small>${label}</small><b>${q.title}</b><span>${costHtml(q.reward, this.g)}</span></div>`;
    this.pushToast(el, 3200, true);
  }

  private chainHtml(city: string, near: boolean): string {
    const g = this.g;
    const ch = CHAINS[city];
    if (!ch || !g.s.free) return "";
    const c = g.chain(city);
    const head = `<h3>${ic("quest")} ${tr("Şehir hikâyesi")}: ${ch.title}</h3>`;
    if (!c) return head + `<div class="grow">${ic("scroll", "gimg")}<div class="bi2"><b>${ch.giver}</b><small>${ch.intro}</small></div><button class="btn sm ${near ? "" : "off"}" data-a="${this.act(() => g.chainStart(city))}">${tr("Dinle")}</button></div>`;
    const dots = ch.steps.map((st, i) => `<span class="${i < c.step || c.done ? "cheap" : i === c.step ? "" : "dim"}">${i < c.step || c.done ? "✔" : i + 1}. ${st.title}</span>`).join(" · ");
    if (c.done) return head + `<p class="dim">${dots}</p>`;
    const st = ch.steps[c.step];
    const p = g.chainProgress(city)!;
    const btn = st.kind === "visit"
      ? `<span class="dim">→ ${CITY_NAME[st.city!]}</span>`
      : `<button class="btn sm ${p.have >= p.need && near ? "" : "off"}" data-a="${this.act(() => g.chainTurnIn(city))}">${st.kind === "deliver" || st.kind === "gold" ? tr("Teslim et") : tr("Bildir")}</button>`;
    return head + `<p class="dim">${dots}</p><div class="grow">${ic("quest", "gimg")}<div class="bi2"><b>${st.title}${st.kind === "visit" ? "" : ` · ${p.have}/${p.need}`}</b><small>${st.text}</small></div>${btn}</div>`;
  }

  /** Hedefler sekmesinde, bütün şehir hikâyelerini (zincirlerini) tek listede gösterir. */
  private chainsHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const rows = CITIES.map((c, i) => {
      const ch = CHAINS[c.id];
      if (!ch) return "";
      const prog = g.chain(c.id);
      const target: Target = i === CAP_I ? { kind: "capital" } : { kind: "city", i };
      const done = prog?.done;
      const sub = done
        ? `<small class="cheap">✔ ${t("Tamamlandı")}</small>`
        : prog
          ? `<small class="dim">${t("Adım")} ${prog.step + 1}/${ch.steps.length} · ${ch.steps[prog.step].title}</small>`
          : `<small class="dim">${ch.giver}</small>`;
      const btn = done ? "" : this.walkBtn(target, t("Yürü")).replace("btn go", "btn sm go");
      return `<div class="grow ${done ? "dim" : ""}">${ic("quest", "gimg")}<div class="bi2"><b>${ch.title} <em>${CITY_NAME[c.id]}</em></b>${sub}</div>${btn}</div>`;
    }).join("");
    return `<h3>${ic("quest")} ${t("Şehir Zincirleri")}</h3>${rows || `<p class="dim">${t("Henüz keşfedilmiş bir şehir hikâyesi yok.")}</p>`}`;
  }

  /** Ana destan + yoldaş + yan görev + zincir + yan destan — tek bakışta yolculuk. */
  private journeyBoardHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const rows: string[] = [];
    const ch = g.chapter();
    if (ch) {
      const at = ch.goto?.(g);
      const go = at
        ? `<button class="btn sm go" data-a="${this.act(() => { this.close(); g.goTo({ kind: "point", x: at.x, y: at.y }); g.cam.flyTo(at.x, at.y, Math.max(g.cam.zoom, 0.65)); })}">${t("Git")}</button>`
        : "";
      rows.push(`<div class="grow jrow main">${ic("scroll", "gimg")}<div class="bi2"><small>${g.sagaLabel()}</small><b>${ch.title}</b><span>${ch.goal}</span></div>${go}</div>`);
    }
    if (s.cq) {
      const q = COMP_QUESTS[s.cq.id];
      const cp = COMP_BY_ID[s.cq.id];
      const st = q?.steps[s.cq.step];
      if (q && st && cp) {
        const ci = CITIES.findIndex((c) => c.id === st.city);
        const target: Target = ci === CAP_I ? { kind: "capital" } : ci >= 0 ? { kind: "city", i: ci } : { kind: "capital" };
        rows.push(`<div class="grow jrow">${ic(cp.icon || "companions/" + s.cq.id, "gimg")}<div class="bi2"><small>${t("Yoldaş görevi")} · ${cp.name}</small><b>${q.title}</b><span>${CITY_NAME[st.city] ?? st.city} · ${t("Adım")} ${s.cq.step + 1}/${q.steps.length}</span></div>${this.walkBtn(target, t("Yürü")).replace("btn go", "btn sm go")}</div>`);
      }
    }
    for (const sq of s.sideQ) {
      const ready = g.sideReady(sq);
      const p = g.sideProg(sq);
      const turn = g.sideTurnIn(sq);
      const ci = CITIES.findIndex((c) => c.id === (ready ? turn : sq.city));
      const target: Target = ci === CAP_I ? { kind: "capital" } : ci >= 0 ? { kind: "city", i: ci } : { kind: "capital" };
      rows.push(`<div class="grow jrow">${ic(SIDE_TEXT[sq.kind].icon, "gimg")}<div class="bi2"><small>${t("Şehir görevi")} · ${CITY_NAME[sq.city] ?? sq.city}</small><b>${sq.title}</b><span>${ready ? `${t("Teslim")}: ${CITY_NAME[turn]}` : `${sq.text}${sq.need > 1 ? ` (${p}/${sq.need})` : ""}`}</span></div>${this.walkBtn(target, t("Yürü")).replace("btn go", "btn sm go")}</div>`);
    }
    const activeChains = CITIES.map((c, i) => {
      const def = CHAINS[c.id];
      const prog = g.chain(c.id);
      if (!def || !prog || prog.done) return "";
      const target: Target = i === CAP_I ? { kind: "capital" } : { kind: "city", i };
      return `<div class="grow jrow">${ic("quest", "gimg")}<div class="bi2"><small>${t("Zincir")} · ${CITY_NAME[c.id]}</small><b>${def.title}</b><span>${t("Adım")} ${prog.step + 1}/${def.steps.length} · ${def.steps[prog.step].title}</span></div>${this.walkBtn(target, t("Yürü")).replace("btn go", "btn sm go")}</div>`;
    }).filter(Boolean);
    rows.push(...activeChains);
    const ss = g.activeSideSaga();
    if (ss && !ss.done) {
      const goal = ss.saga.goals[ss.step];
      rows.push(`<div class="grow jrow">${ic("scroll", "gimg")}<div class="bi2"><small>${t("Yan destan")}</small><b>${ss.saga.title}</b><span>${goal?.text ?? ""} · ${ss.step + 1}/${ss.saga.goals.length}</span></div></div>`);
    }
    if (s.endingSeed) {
      const e = endingOf(s.endingSeed);
      if (e) rows.push(`<div class="grow jrow dim">${ic(e.img, "gimg")}<div class="bi2"><small>${t("Bitiş gölgesi")}</small><b>${e.name}</b><span>${t("Zirvede seçimi boyar — kilit değil")}</span></div></div>`);
    }
    if (!rows.length) return `<div class="jboard"><h3>${ic("tr_star")} ${t("Yolculuk tahtası")}</h3><p class="dim">${t("Açık bir yol yok. Ufka bak, yeni şehir keşfet.")}</p></div>`;
    return `<div class="jboard"><h3>${ic("tr_star")} ${t("Yolculuk tahtası")}</h3>${rows.join("")}</div>`;
  }

  /** Birikmiş başarım/Bitig/unvan bildirimlerini tek kartta gösterir. */
  digest(title: string, lines: string[]): void {
    if (!lines.length) return;
    audio.play("quest");
    const el = document.createElement("div");
    el.className = "qdone digest";
    const shown = lines.slice(0, 6).map((l) => `<li>${l}</li>`).join("");
    const more = lines.length > 6 ? `<li class="mut">${tr("ve {n} kazanım daha", { n: lines.length - 6 })}</li>` : "";
    el.innerHTML = `${ic("trophy", "qi")}<div><small>${title}</small><ul>${shown}${more}</ul></div>`;
    this.pushToast(el, 7000, true);
  }

  close(): void {
    this.panel.classList.add("hidden");
    this.place = null;
    this.panelHtml = "";
  }

  openPlace(t: Target): void {
    const g = this.g;
    if (t.kind === "mongol") return g.mongolMenu();
    if (t.kind === "capital" || t.kind === "city") {
      const id = t.kind === "capital" ? "capital" : "city" + t.i;
      const prev = this.place && "i" in this.place ? "city" + this.place.i : this.place?.kind;
      if (prev !== id) this.tab = t.kind === "capital" ? (!g.s.free ? "efendi" : g.s.beylik ? "bina" : "pazar") : "pazar";
    }
    this.place = t;
    if (t.kind === "node") {
      const s = g.s.garrison;
      const n = Math.min(armySize(s), 20);
      this.sel = { spear: Math.min(s.spear, n), archer: 0, horse: 0 };
    }
    this.panel.classList.remove("hidden");
    this.render();
  }

  /** En yakın şehir (veya Semerkant) panelini verilen sekmede açar. */
  openPlaceTab(tab: string): void {
    const g = this.g;
    const ni = g.nearCity();
    if (ni >= 0) this.openPlace({ kind: "city", i: ni });
    else this.openPlace({ kind: "capital" });
    this.tab = tab;
    this.render();
  }

  private ufukHtml(): string {
    const g = this.g;
    const hs = g.horizon();
    const KIND: Record<Hint["kind"], string> = { acil: t("Acil"), firsat: t("Fırsat"), hikaye: t("Hikâye") };
    const rows = hs.map((x) => {
      const go = x.open === "mongol"
        ? this.act(() => { this.close(); g.mongolMenu(); })
        : x.open
          ? this.act(() => (this.tab = x.open === "goals" ? "unvan" : "karakter"))
          : x.at
            ? this.act(() => { this.close(); g.goTo({ kind: "point", x: x.at!.x, y: x.at!.y }); g.cam.flyTo(x.at!.x, x.at!.y, Math.max(g.cam.zoom, 0.65)); })
            : "";
      return `<div class="ufk ${x.kind}">${ic(x.icon, "gimg")}<div class="bi2"><small>${KIND[x.kind]}</small><b>${x.title}</b><span>${x.text}</span></div>${go ? `<button class="btn sm go" data-a="${go}">${x.at && !x.open ? t("Git") : t("Aç")}</button>` : ""}</div>`;
    }).join("");
    return `<p class="dim">${t("Bozkırda yön bulmak zordur. Ufuk, şu an en çok işine yarayacak adımları gösterir.")}</p>${rows || `<p>${t("Ufuk sakin. Keşfe çık, yeni şehirler gör.")}</p>`}${g.s.free ? this.journeyBoardHtml() + this.ecoBoardHtml() + this.politicsBoardHtml() + this.pathHtml() + this.pulseHtml() : ""}`;
  }

  /** AoE-tarzı çağ + haftalık eco nabız — tek bakışta tempo. */
  private ecoBoardHtml(): string {
    const g = this.g;
    const E = ERAS[g.wd().era];
    const eco = g.economyPulse();
    const rail = techRailStatus(g);
    const pricePct = Math.round((E.price - 1) * 100);
    const boom = rail.nextLock;
    return `<div class="eboard">
      <h3>${ic("scroll")} ${t("Çağ ve kasa")}</h3>
      <div class="ebrow"><b>${t(E.name)}</b><small>${t(E.text)}</small></div>
      <div class="stats">
        <div>${t("Fiyat")} <b class="${pricePct > 0 ? "dear" : pricePct < 0 ? "cheap" : ""}">${pricePct > 0 ? "+" : ""}${pricePct}%</b></div>
        <div>${t("Tecrübe")} <b>×${E.xp.toFixed(2)}</b></div>
        <div>${t("Düşman yenilenme")} <b>×${E.respawn.toFixed(2)}</b></div>
      </div>
      <div class="stats">
        <div>${t("Haftalık net")} <b class="${eco.net >= 0 ? "cheap" : "dear"}">${eco.net >= 0 ? "+" : ""}${fmt(eco.net)}</b></div>
        <div>${t("Gelir")} <b class="cheap">+${fmt(eco.income)}</b></div>
        <div>${t("Masraf")} <b class="dear">−${fmt(eco.upkeep)}</b></div>
      </div>
      ${boom ? `<div class="odds mid">${ic("b_kisla")} ${t("Sıradaki")}: <b>${boom.label}</b><small>${boom.why}</small></div>` : `<div class="odds good">${t("Birlik rayı şu an açık")}</div>`}
      ${(() => {
        const route = g.bestRoute();
        const earlyTrade = g.s.c.profit < 150 || g.s.c.bought === 0;
        if (!route || !earlyTrade) return "";
        return `<div class="odds good route-tip sticky grow">${ic(GOODS[route.good].icon, "gimg")}<div class="bi2"><b>${tr("Altın rota")}</b><small>${route.fromName} → ${route.toName} · ${route.goodName} (~+${Math.round(route.margin)})</small></div><button class="btn sm" data-a="${this.act(() => { const p = CITIES.find((x) => x.id === route.from); if (p) { this.close(); g.cam.flyTo(p.x, p.y, 0.7); } })}">${tr("Harita")}</button><button class="btn sm go" data-a="${this.act(() => { const i = CITIES.findIndex((x) => x.id === route.from); if (i < 0) return; this.close(); g.goTo(i === CAP_I ? { kind: "capital" } : { kind: "city", i }); const p = CITIES[i]!; g.cam.flyTo(p.x, p.y, 0.7); this.toast(tr("Alış: {c}. Varınca Pazar.", { c: route.fromName }), "info"); })}">${tr("Alışa git")}</button></div>`;
      })()}
    </div>`;
  }

  /** Bannerlord-lite siyaset özeti: savaşlar, biat, sıcak rakipler. */
  private politicsBoardHtml(): string {
    const g = this.g;
    const w = g.wd();
    const day = g.dayOf().day;
    const wars = w.wars
      .map((war) => {
        const lead = war.takes > 0 ? FACTIONS[war.a].short : war.takes < 0 ? FACTIONS[war.b].short : t("kimse");
        const you = war.side ? ` · ${t("sen")} ${FACTIONS[war.side].short}` : "";
        return `<div class="qrow">${ic("swords")} <b>${FACTIONS[war.a].short} ⚔ ${FACTIONS[war.b].short}</b><span>${t("{d}. gün", { d: day - war.since + 1 })} · ${lead}${you}</span></div>`;
      })
      .join("");
    const fealty = g.s.fealty?.f
      ? `<div class="odds mid">${ic("seal")} ${t("Biat")}: <b>${FACTIONS[g.s.fealty.f].name}</b> · ${t("haraç")} ${FEALTY_FEE(g.s.hero.lv)}/${t("gün")}</div>`
      : `<p class="dim">${t("Henüz biatın yok. Divan'dan bir devlete and içebilirsin.")}</p>`;
    const hot = (g.s.rivals ?? [])
      .filter((r) => r.status === "war" || r.rel < -30)
      .slice(0, 3)
      .map((r) => `<div class="qrow">${ic(r.icon)} <b>${r.name}</b> ${r.title}<span style="color:${r.status === "war" ? "#ff8a6a" : "#ffd56a"}">${STATUS_NAME[r.status]} · ${Math.round(r.rel)}</span></div>`)
      .join("");
    const asks = (g.s.rivals ?? [])
      .filter((r) => r.req)
      .slice(0, 3)
      .map((r) => {
        const q = r.req!;
        const left = Math.max(0, q.until - day);
        return `<div class="qrow">${ic(REQ_INFO[q.kind].icon)} <b>${r.name}</b> · ${REQ_INFO[q.kind].name}<span class="${left <= 2 ? "dear" : ""}">${left} ${t("gün")} · ${q.gold} ${t("altın")}</span></div>`;
      })
      .join("");
    return `<div class="pboard">
      <h3>${ic("tug")} ${t("Siyaset tahtası")}</h3>
      ${wars || `<p class="dim">${t("Devletler arasında şimdilik büyük savaş yok.")}</p>`}
      ${fealty}
      ${asks ? `<h3>${ic("scroll")} ${t("Bey istekleri")}</h3>${asks}` : ""}
      ${hot ? `<h3>${ic("lord_bey")} ${t("Sıcak rakipler")}</h3>${hot}` : ""}
      <button class="btn sm go" data-a="${this.act(() => { this.tab = "divan"; })}">${t("Divan'ı aç")}</button>
    </div>`;
  }

  /** Köleden hakana uzanan büyük yolun kilometre taşları. */
  private pathHtml(): string {
    const s = this.g.s;
    const owned = Object.keys(s.owned).length;
    const steps: [string, string, number, number][] = [
      ["Bölüm 0: Zincirler", "heroes/slave", 1, 1],
      ["Kara Tamga Destanı", "scroll", s.story.done ? CHAPTERS.length : s.story.ch, CHAPTERS.length],
      ["Kendi beyliğin", "tug", s.beylik ? 1 : 0, 1],
      ["İpek Yolu'nun Efendisi", "map/serai", Math.min(LORD_SERAIS, this.g.seraiCount()), LORD_SERAIS],
      ["Erlik Destanı", "scroll", s.act2.done ? ACT2.length : s.story.done ? s.act2.ch : 0, ACT2.length],
      ["Beş şehre hükmet", "crown", Math.min(5, owned), 5],
      ["Gök Tengri Destanı", "tr_star", s.act3.ending ? ACT3.length : s.act2.done ? s.act3.ch : 0, ACT3.length],
    ];
    const next = steps.findIndex(([, , v, n]) => v < n);
    const rows = steps.map(([name, icon, v, n], i) => {
      const done = v >= n;
      return `<div class="bpath${done ? " done" : i === next ? " now" : ""}">${ic(icon, "ni")}<b>${t(name)}</b><span class="bpbar"><i style="width:${Math.round((v / n) * 100)}%"></i></span><small>${done ? "✓" : `${v}/${n}`}</small></div>`;
    }).join("");
    return `<h3>${ic("tr_star")} ${t("Büyük Yol")}</h3><div class="bpaths">${rows}</div>`;
  }

  /** Dünyanın nabzı: oyuncudan bağımsız dönen savaşlar, kıtlıklar, doğa ve çağ. */
  private pulseHtml(): string {
    const g = this.g;
    const w = g.wd();
    const day = g.dayOf().day;
    const E = ERAS[w.era];
    const wars = w.wars.map((war) => {
      const lead = war.takes > 0 ? FACTIONS[war.a].short : war.takes < 0 ? FACTIONS[war.b].short : t("kimse");
      const side = war.side
        ? `<small class="cheap">${t("{f} safındasın · katkın {n}", { f: FACTIONS[war.side].short, n: Math.round(war.help) })}</small>`
        : `<div class="col2"><button class="btn sm" data-a="${this.act(() => g.warJoin(war, war.a))}">${FACTIONS[war.a].short}</button><button class="btn sm" data-a="${this.act(() => g.warJoin(war, war.b))}">${FACTIONS[war.b].short}</button></div>`;
      return `<div class="qrow">${ic("swords")} <b>${FACTIONS[war.a].short} ⚔ ${FACTIONS[war.b].short}</b><span>${t("{d}. gün · önde: {l}", { d: day - war.since + 1, l: lead })}</span></div>${side}`;
    }).join("");
    const occ = Object.entries(OCCUPY).map(([c, f]) => `${CITY_NAME[c]} → <b>${FACTIONS[f].short}</b>`).join(" · ");
    const shorts = CITIES.filter((c) => (w.short[c.id] ?? 0) >= 2).map((c) => `${CITY_NAME[c.id]} <b class="dear">+%${Math.round((shortMult(w.short[c.id] ?? 0) - 1) * 100)}</b>`).join(" · ");
    const ph = moonPhase(new Date());
    const moon = Math.abs(ph - 0.5) < 0.04 ? t("Dolunay: gece savaşlarında +%5, kurtlar azgın") : ph < 0.035 || ph > 0.965 ? t("Karaay: gece zifiri karanlık") : ph < 0.5 ? t("Hilal büyüyor") : t("Ay küçülüyor");
    const fav = favTactic(w.tac);
    const st = g.playStyle();
    const pend = w.deeds.filter((d) => !d.paid);
    return `<h3>${ic("scroll")} ${t("Dünyanın Nabzı")}</h3>
      <p><b>${t(E.name)}</b> · <span class="dim">${t(E.text)}</span></p>
      ${wars || `<p class="dim">${t("Devletler arasında şimdilik barış var.")}</p>`}
      <p class="dim">${FACTION_KEYS.map((f) => `${FACTIONS[f].short}: <b>${FACTIONS[f].ruler}</b> (${t(RULER_TRAITS[g.rulerTrait(f)].name)})`).join(" · ")}</p>
      ${occ ? `<p>${t("İşgal altındaki şehirler")}: ${occ}</p>` : ""}
      ${shorts ? `<p>${t("Kıtlık")}: ${shorts}</p>` : ""}
      ${bar(w.wolves, WOLF_MAX, w.wolves >= WOLF_PACK_AT ? "en" : "", `${t("Kurt nüfusu")} ${Math.round(w.wolves)}`)}
      ${w.drought ? `<p class="dear">${t("Kuraklık sürüyor · {n} gün kaldı", { n: Math.max(0, w.drought.until - day) })}</p>` : ""}
      <p class="dim">${moon}</p>
      <p>${t("Oyun tarzın")}: <b>${t(st.now)}</b> · ${t("genel")}: <b>${t(st.life)}</b>${fav.n >= 4 ? ` · ${t("düşmanların senin {t} alışkanlığını biliyor (%{p})", { t: t(TACTICS[fav.t].name), p: Math.round(fav.share * 100) })}` : ""}</p>
      ${pend.length ? `<p class="dim">${t("Bozkır unutmaz: {g} iyiliğin ve {b} kötülüğün hâlâ anılıyor.", { g: pend.filter((d) => d.good).length, b: pend.filter((d) => !d.good).length })}</p>` : ""}
      ${this.sagaHtml()}`;
  }

  private sagaHtml(): string {
    const g = this.g;
    const s = g.s;
    const w = g.wd();
    const out: string[] = [];
    const card = (icon: string, title: string, tag: string, body: string, cls = "") => `<div class="scard ${cls}">${ic(icon, "sci")}<div class="scb"><div class="sch"><b>${title}</b>${tag ? `<em>${tag}</em>` : ""}</div>${body}</div></div>`;
    const toy = w.toy;
    if (toy) {
      const me = g.toyTotal();
      const rows = [...toy.foes, { name: s.hero.name, pts: me, me: true }].sort((a, b) => b.pts - a.pts);
      const rank = rows.findIndex((r) => "me" in r) + 1;
      const lead = rows[0];
      out.push(card("trophy", t("Büyük Toy"), t("son gün {d}", { d: toy.to }), `
        <div class="scs"><span>${ic("u_archer")}<b>${toy.pts.ok}</b></span><span>${ic("swords")}<b>${toy.pts.gur}</b></span><span>${ic("u_cavalry")}<b>${toy.pts.kb}</b></span><span class="${rank === 1 ? "cheap" : "dim"}">${rank}/${rows.length}. · ${rank === 1 ? t("lider sensin") : `${lead.name} ${lead.pts}`}</span></div>
        ${bar(me, Math.max(1, lead.pts), "", `${me} / ${lead.pts}`)}
        <div class="row"><button class="btn sm go" data-a="${this.act(() => this.openArchery())}">${t("Okçuluk")}</button><button class="btn sm go" data-a="${this.act(() => this.openMini("wr"))}">${t("Güreş")}</button><button class="btn sm go" data-a="${this.act(() => this.openMini("kb"))}">${t("Kökbörü")}</button></div>`, "gold"));
    }
    if (w.captives.length) {
      out.push(card("j_bandit", t("Esirler"), `${w.captives.length}/${CAPTIVE_MAX}`, w.captives.map((c) => {
        const rec = c.kind === "bey" ? t("Biat ettir") : c.kind === "harami" ? t("Saflarına kat") : "";
        return `<div class="scap">${ic(c.kind === "harami" ? "j_bandit" : c.kind === "bey" ? "lord_bey" : "seal")}<b>${c.name}</b><span class="cheap">${ic("coins")}${c.value}</span></div>
          <div class="row"><button class="btn sm go" data-a="${this.act(() => g.captiveAct(c.id, "ransom"))}">${t("Fidye al")}</button><button class="btn sm" data-a="${this.act(() => g.captiveAct(c.id, "free"))}">${t("Serbest bırak")}</button>${rec ? `<button class="btn sm" data-a="${this.act(() => g.captiveAct(c.id, "recruit"))}">${rec}</button>` : ""}<button class="btn sm bad" data-a="${this.act(() => g.captiveAct(c.id, "sell"))}">${t("Esir pazarına sat")}</button></div>`;
      }).join("")));
    }
    const sick = Object.entries(w.plague).filter(([, p]) => p > 0).sort((a, b) => b[1] - a[1]);
    if (sick.length) out.push(card("healer", t("Salgın"), `${sick.length} ${t("şehir")}`, `<div class="chips">${sick.map(([c, p]) => `<span class="chip ${p >= 3 ? "bad" : ""}">${CITY_NAME[c]} <b>${"●".repeat(Math.ceil(p))}</b>${w.quarantine[c] ? " 🔒" : ""}</span>`).join("")}</div>`, "red"));
    const G = GUILD[w.guild];
    const nx = GUILD[w.guild + 1];
    const ord = w.order;
    out.push(card("merchant", `${t("Lonca")}: ${t(G.name)}`, G.cut ? `-%${Math.round(G.cut * 100)}` : "", `${nx ? bar(s.c.profit, nx.need, "", `${t(nx.name)} · ${Math.floor(s.c.profit)}/${nx.need} ${t("kâr")}`) : ""}${ord ? `<div class="scap">${ic(GOODS[ord.good as keyof typeof GOODS].icon)}<b>${ord.n} ${GOODS[ord.good as keyof typeof GOODS].name} → ${CITY_NAME[ord.city]}</b><span class="cheap">${ic("coins")}${ord.gold}</span></div><small class="dim">${t("{d}. güne kadar", { d: ord.until })}</small>` : ""}`));
    if (w.hoard) out.push(card("parsomen", t("Define haritası"), "", `<small>${t("Define haritası: {w}. Haritada kırmızı çarpı.", { w: w.hoard.near })}</small><div class="row"><button class="btn sm go" data-a="${this.act(() => { this.close(); g.cam.flyTo(w.hoard!.x, w.hoard!.y, 0.8); })}">${t("Göster")}</button></div>`, "gold"));
    else if (w.mapBits) out.push(card("parsomen", t("Harita parçaları"), `${w.mapBits}/3`, `<div class="pips">${[0, 1, 2].map((i) => `<i class="${i < w.mapBits ? "on" : ""}"></i>`).join("")}</div>`));
    const told = w.omens.filter((o) => o.told);
    if (told.length) out.push(card("ruh", t("Kehanetler"), `${told.length}`, `<small class="dim">${t("Kam'ın kehanetleri: {n} rüya gerçekleşmeyi bekliyor.", { n: told.length })}</small>`, "violet"));
    return out.length ? `<div class="scards">${out.join("")}</div>` : "";
  }

  private cityExtraHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const w = g.wd();
    let h = "";
    const p = g.plagueOf(city);
    if (p > 0) {
      const cost = Math.round(80 + 40 * p);
      h += `<div class="odds bad">${ic("healer")} <b>${t("Salgın!")}</b> ${t("Şiddet")} ${"●".repeat(Math.ceil(p))} · ${t("fiyatlar +%{n}", { n: Math.round(p * 3) })}
        <div class="row"><button class="btn sm go ${!near || s.res.gold < cost ? "off" : ""}" data-a="${this.act(() => g.plagueDonate(city))}">${t("Şifacılara bağış · {g} altın", { g: cost })}</button>${s.owned[city] ? `<button class="btn sm ${w.quarantine[city] ? "off" : ""}" data-a="${this.act(() => g.plagueQuarantine(city))}">${t("Karantina ilan et")}</button>` : ""}</div></div>`;
    }
    const o = w.order;
    if (o && o.city === city) {
      const have = s.hero.cargo[o.good as keyof typeof GOODS] ?? 0;
      h += `<div class="odds mid">${ic("merchant")} ${t("Lonca siparişi")}: ${have}/${o.n} ${GOODS[o.good as keyof typeof GOODS].name} · ${o.gold} ${t("altın")} <button class="btn sm go ${g.orderReady() ? "" : "off"}" data-a="${this.act(() => g.orderDeliver())}">${t("Teslim et")}</button></div>`;
    }
    if (city === "samarkand" || city === "bukhara" || city === "merv") h += this.guildHallHtml(near);
    return h;
  }

  /** Destan bayraklarının bu şehir pazarına sızan etkisi. */
  private flagTradeNote(city: string): string {
    const g = this.g;
    const bits: string[] = [];
    if (city === "bukhara" && g.hasFlag("buhara_muhur")) bits.push(t("Buhara mührü: alış ucuz, satış iyi"));
    if (city === "bukhara" && g.hasFlag("buhara_iz")) bits.push(t("Buhara izi: pazar temkinli"));
    if (city === "kashgar" && g.hasFlag("kashgar_aff")) bits.push(t("Kaşgar antı: tüccarlar güleryüzlü"));
    if (city === "kashgar" && g.hasFlag("kashgar_yakt")) bits.push(t("Yakılan tuğlar: fiyatlar gerilimli"));
    if (city === "samarkand" && g.hasFlag("ferman_adalet")) bits.push(t("Adalet fermanı: çarşı güvenli"));
    if (city === "samarkand" && g.hasFlag("ferman_guc")) bits.push(t("Güç fermanı: tezgâhlar gergin"));
    if ((city === "kashgar" || city === "bukhara") && g.hasFlag("yazit_kopya")) bits.push(t("Yazıt nüshası: dil ticareti"));
    if (g.hasFlag("yazit_ezber")) bits.push(t("Ezberlenen yazıt: dökümde nadirlik"));
    if (g.hasFlag("birlik_hediye") && (city === "merv" || city === "bukhara")) bits.push(t("Birlik hediyesi: satış canlı"));
    if (g.hasFlag("birlik_kilic") && (city === "konya" || city === "rey")) bits.push(t("Kılıç birliği: silah pazarı gerilimli"));
    if (g.hasFlag("gogun_meditasyon") && (city === "kashgar" || city === "samarkand")) bits.push(t("Gök meditasyonu: fiyatlar sakin"));
    if (g.hasFlag("kurgan_kurban")) bits.push(t("Kurgan kurbanı: ruhlar dökümü hatırlar"));
    if (!bits.length) return "";
    return `<div class="odds good">${ic("scroll")} <b>${t("Destan izi")}</b><small class="dim">${bits.join(" · ")}</small></div>`;
  }

  /** Lonca odası: rütbe, ayrıcalıklar, sonraki basamak — ticaret kimliği yüzeyi. */
  private guildHallHtml(near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const w = g.wd();
    const G = GUILD[w.guild];
    const nx = GUILD[w.guild + 1];
    const perks = GUILD_PERKS[w.guild] ?? [];
    const tea = near && w.guild >= 1
      ? `<button class="btn sm" data-a="${this.act(() => {
          if (s.res.gold < 5) return this.toast(t("5 altın gerekir"), "bad");
          s.res.gold -= 5;
          g.addXp(8);
          this.toast(t("Lonca çayı: yol haberleri kulaktan kulağa."), "good");
        })}">${t("Çay iç · 5 altın")}</button>`
      : "";
    return `<div class="odds mid">${ic("merchant")} <b>${t("Lonca Odası")} · ${t(G.name)}</b>
      <small class="dim">${t(G.text)}</small>
      <div class="chips">${perks.map((p) => `<span class="chip">${t(p)}</span>`).join("")}</div>
      ${nx ? `<small class="dim">${t(nx.name)} için kâr: ${Math.floor(s.c.profit)}/${nx.need}</small>` : `<small class="cheap">${t("En yüksek rütbe")}</small>`}
      <div class="row">${tea}${near && w.guild >= 2 ? `<button class="btn sm go" data-a="${this.act(() => g.guildDaily(g.dayOf().day))}">${t("Defteri sor")}</button>` : ""}</div>
    </div>`;
  }

  private openHero(): void {
    if (this.place?.kind !== "hero") this.tab = "karakter";
    this.place = { kind: "hero" };
    this.panel.classList.remove("hidden");
    this.render();
  }

  private frame(title: string, sub: string, img: string, body: string, bg = ""): string {
    return `${bg ? `<div class="citybg" style="background-image:url('${bg}')"></div>` : ""}<div class="ph sheet-head"><img class="pimg" src="${img}" alt=""><div><h2>${title}</h2><small>${sub}</small></div><button class="x" data-a="${this.act(() => this.close())}">✕</button></div><div class="pb sheet-body">${body}</div>`;
  }

  private tabs(list: [string, string][]): string {
    if (!list.some(([id]) => id === this.tab)) this.tab = list[0][0];
    const s = this.g.s;
    const seen = (s.tabsSeen ??= []);
    if (!list.some(([id]) => seen.includes(id))) seen.push(...list.map(([id]) => id));
    if (!seen.includes(this.tab)) seen.push(this.tab);
    return `<div class="tabs">${list.map(([id, n]) => `<button class="tab ${this.tab === id ? "on" : ""} ${seen.includes(id) ? "" : "new"}" data-a="${this.act(() => {
      this.tab = id;
      if (!seen.includes(id)) seen.push(id);
    })}">${t(n)}</button>`).join("")}</div>`;
  }

  private subTab: Record<string, string> = {};

  private groupTabs(list: [string, string][], groups: [string, string, string[]][]): string {
    if (!list.some(([id]) => id === this.tab)) this.tab = list[0][0];
    const live = groups.map(([gid, name, ids]) => [gid, name, list.filter(([id]) => ids.includes(id))] as const).filter(([, , l]) => l.length);
    const cur = live.find(([, , l]) => l.some(([id]) => id === this.tab)) ?? live[0];
    this.subTab[cur[0]] = this.tab;
    const main = live
      .map(([gid, name, l]) => {
        const badge = gid !== cur[0] && l.some(([id, n]) => id !== "techizat" && /\(\d+\)|●/.test(n));
        return `<button class="tab ${gid === cur[0] ? "on" : ""} ${badge ? "new" : ""}" data-a="${this.act(() => {
          const want = this.subTab[gid];
          this.tab = l.some(([id]) => id === want) ? want : l[0][0];
        })}">${t(name)}</button>`;
      })
      .join("");
    return `<div class="tabs main">${main}</div>${cur[2].length > 1 ? this.tabs([...cur[2]]).replace('class="tabs"', 'class="tabs sub"') : ""}`;
  }

  private walkBtn(t: Target, label: string): string {
    return `<button class="btn go" data-a="${this.act(() => {
      this.g.goTo(t);
      this.close();
    })}">${label}</button>`;
  }

  private render(): void {
    const t = this.place;
    if (!t) return;
    this.acts.clear();
    this.actN = 0;
    const g = this.g;
    const s = g.s;
    let html = "";
    switch (t.kind) {
      case "hero":
        html = this.heroHtml();
        break;
      case "capital":
        html = this.cityHtml(CAP_I);
        break;
      case "city":
        html = this.cityHtml(t.i);
        break;
      case "point":
      case "bandit":
        return this.close();
      case "village": {
        const v = s.villages[t.i];
        const room = g.heroCap() - armySize(s.hero.army);
        const near = Math.hypot(v.x - s.hero.x, v.y - s.hero.y) < 80;
        const cost = g.recruitCost();
        const btn = (n: number, label: string) => {
          const k = Math.max(0, Math.min(n, v.rec, room));
          return `<button class="btn ${k <= 0 || !near || !s.free ? "off" : ""}" data-a="${this.act(() => g.recruit(t.i, k))}">${label} (${k}) ${ic("coins")}${k * cost}</button>`;
        };
        html = this.frame(v.name, v.yurt ? "Göçebe obası" : "Köy", assetUrl(v.yurt ? "map/yurts" : "map/village"), `
          ${s.raid?.v === t.i ? `<div class="raid"><b>${ic("j_bandit")} Haramiler köyü yağmalıyor!</b><small>Kalan süre ${dur(s.raid.until - g.now)}</small>${armyHtml(s.raid.army, "enemy")}<div class="odds ${g.odds(s.raid.army) >= 0.65 ? "good" : "mid"}">Zafer şansı: <b>%${Math.round(g.odds(s.raid.army) * 100)}</b></div>${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.defendRaid(); })}">${ic("swords")} Köyü savun!</button>` : ""}</div>` : ""}
          ${v.state ? `<div class="grow bad">${ic("j_bandit", "gimg")}<div class="bi2"><b>${v.state === "ruined" ? "Harabe" : "Yağmalanmış"}</b><small>${v.state === "ruined" ? "Köy yanmış, köylüler kaçmış. Onarmadan gönüllü vermez." : "Köy yarasını henüz sarmadı; bağlılığı düşük."}</small></div><button class="btn sm ${!near || s.res.gold < (v.state === "ruined" ? 400 : 150) ? "off" : "go"}" data-a="${this.act(() => g.repairVillage(t.i))}">Onar<br>${ic("coins")}${v.state === "ruined" ? 400 : 150}</button></div>` : ""}
          <p>Köylüler kervan yollarını haramilerden temizleyen bir yiğide gönüllü yazılır. Karizman ne kadar yüksekse o kadar çok genç seninle gelmek ister.</p>
          <div class="stats"><div>${ic("soldier")}Gönüllü: <b>${v.rec}</b>/${g.volMax(v.rep)}</div><div>${ic("crown")}Bağlılık: <b>${v.rep}</b>/100</div><div>${ic("tug")}Birlik: <b>${armySize(s.hero.army)}/${g.heroCap()}</b></div></div>
          ${v.rec < g.volMax(v.rep) ? `<p class="dim">Yeni gönüllü: ${dur(v.recAt - g.now)}</p>` : ""}
          ${!s.free ? `<p class="warn">Köleler asker toplayamaz. Önce hürriyetini kazan.</p>` : near ? "" : `<p class="warn">Gönüllü toplamak için birliğinle köye gitmelisin.</p>`}
          <div class="row">${btn(1, "1 al")}${btn(3, "3 al")}${btn(99, "Hepsi")}</div>
          ${near ? "" : this.walkBtn(t, "Köye yürü")}`);
        break;
      }
      case "camp": {
        const c = s.camps[t.i];
        const near = Math.hypot(c.x - s.hero.x, c.y - s.hero.y) < 90;
        const p = Math.round(g.odds(c.garrison, 0.1) * 100);
        const bounty = s.bounties.find((b) => b.camp === t.i && b.taken);
        const foeFace = assetUrl(c.tier >= 3 ? "heroes/enemy_heavy" : c.tier >= 2 ? "heroes/enemy_rider" : "heroes/enemy_sword");
        html = this.frame(c.name, `Harami kampı · Seviye ${c.tier}`, assetUrl("map/camp"), c.alive ? `
          <div class="smithban sceneban campban" style="background-image:url('${assetUrl("map/camp")}')"><img class="npcface foe" src="${foeFace}" alt=""><div><b>${c.name}</b><small>${tr("Harami kampı")} · ${tr("Seviye")} ${c.tier}</small></div></div>
          <p>Bu kamptan çıkan çeteler yolları ve köyleri yağmalıyor. Kampı yerle bir edersen ganimet ve şöhret kazanırsın.</p>
          ${bounty ? `<div class="odds good">${ic("wanted")} Ödül ilanı: +${bounty.gold} altın, +${bounty.renown} şöhret</div>` : ""}
          <h3>${ic("j_bandit")} ${tr("Kamp muhafızları")}</h3>
          <div class="foerow">${ic("heroes/enemy_sword", "gimg")}${ic("heroes/enemy_axe", "gimg")}${ic("heroes/enemy_rider", "gimg")}</div>
          ${armyHtml(c.garrison, "enemy")}
          <h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
          <div class="stats"><div>${ic("swords")}Saldırın: <b>${g.heroAtk().toFixed(0)}</b></div><div>${ic("shield")}Savunman: <b>${g.heroDef().toFixed(0)}</b></div><div>Can: <b>${Math.floor(s.hero.hp)}/${g.maxHp()}</b></div></div>
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b></div>
          <p class="dim">Mızraklı atlıyı, okçu mızraklıyı, atlı okçuyu yener. Kamplar en az bir eşya düşürür.</p>
          ${p < 50 ? `<p class="why">${tr("Şans düşük. Kamptan çıkan çeteleri yolda yendikçe kamp zayıflar; önce onları avla.")}</p>` : ""}
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.attackCamp(t.i); })}">${ic("swords")} Saldır!</button>` : this.walkBtn(t, "Kampa yürü")}` : `<p>Kamp yerle bir edildi. Haramiler ${dur(c.respawnAt - g.now)} sonra geri dönebilir.</p>`);
        break;
      }
      case "node":
        html = this.nodeHtml(t.i);
        break;
      case "fort": {
        const f = s.story.fort;
        if (!f) return this.close();
        const near = Math.hypot(f.x - s.hero.x, f.y - s.hero.y) < 100;
        const p = Math.round(g.fortOdds() * 100);
        html = this.frame("Kara Tamga Kalesi", "Kara Han'ın ini · Destanın sonu", assetUrl("map/castle"), s.story.done ? "<p>Kale yıkıldı. Zindanlar boş, esirler özgür.</p>" : `
          <p>Kayalıkların arasında, kara bayraklarla donanmış bir kale. Surların ardından zincir sesleri ve davul gümbürtüsü geliyor. Kara Han burada, esirlerin ruhlarıyla son taşı uyandırmak üzere.</p>
          <div class="brow">${ic(KARA_HAN.icon, "bimg round")}<div class="bi2"><b>${KARA_HAN.name}</b><small>Can ${KARA_HAN.hp} · Saldırı ${KARA_HAN.atk} · Savunma ${KARA_HAN.def}</small></div></div>
          <h3>Kale muhafızları</h3>${armyHtml(FORT_GUARD, "enemy")}
          <h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b></div>
          <p class="dim">Önerilen: 15+ seviye, 100+ asker, +5 ve üstü silah. Yoldaşların ve becerilerin büyük fark yaratır.</p>
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.attackFort(); })}">${ic("swords")} Kaleye saldır!</button>` : this.walkBtn(t, "Kaleye yürü")}`);
        break;
      }
      case "gate": {
        const f = s.act2.gate;
        if (!f) return this.close();
        const near = Math.hypot(f.x - s.hero.x, f.y - s.hero.y) < 110;
        const p = Math.round(g.gateOdds() * 100);
        html = this.frame("Erlik'in Kapısı", "Yeraltı Hanı'nın eşiği · Erlik Destanı'nın sonu", assetUrl("map/erlik_gate"), s.act2.done ? "<p>Kapı mühürlendi. Balbalların gözlerindeki mor ışık söndü.</p>" : `
          <p>İki dev balbalın arasında, kayaya oyulmuş kemerli bir kapı. İçeriden mor bir sis ve dokuz katın uğultusu yükseliyor. Erlik Han tahtında seni bekliyor.</p>
          <div class="brow">${ic(ERLIK.icon, "bimg round")}<div class="bi2"><b>${ERLIK.name}</b><small>Can ${ERLIK.hp} · Saldırı ${ERLIK.atk} · Savunma ${ERLIK.def}</small></div></div>
          <h3>Erlik'in ordusu</h3>${armyHtml(GATE_GUARD, "enemy")}
          <h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b> · Müttefik desteği +%${Math.round(g.allyBonus() * 100)}</div>
          <p class="dim">Önerilen: 25+ seviye, dolu birlik, efsanevi setler, müttefik beyler ve kan kardeşleri.</p>
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.attackGate(); })}">${ic("swords")} Kapıdan in!</button>` : this.walkBtn(t, "Kapıya yürü")}`);
        break;
      }
      case "peak": {
        const f = s.act3.peak;
        if (!f) return this.close();
        const near = Math.hypot(f.x - s.hero.x, f.y - s.hero.y) < 110;
        const p = Math.round(g.peakOdds() * 100);
        const end = endingOf(s.act3.ending);
        let body: string;
        if (end) body = `<p>Zirvede rüzgâr dinmiş. Kut'un yerinde bir avuç mavi buz parlıyor.</p><div class="odds good">Seçilen son: <b>${end.name}</b></div>`;
        else if (s.act3.ch >= 3) body = `<p>Kök Börü zirvenin kenarında yatıyor, gözleri sende. Buzun içinde Kut mavi bir alev gibi yanıyor.</p>${near ? `<button class="btn go big" data-a="${this.act(() => g.endingChoice())}">${ic("crown")} Kut'un kaderini seç</button>` : this.walkBtn(t, "Zirveye yürü")}`;
        else body = `<p>Karla örtülü sivri bir zirve; tepesinde gök bozkıra değiyor. Mavi bir ışık sütunu buluta karışıyor. Yamaçlarda gümüş zırhlı Gök Bekçileri nöbet tutuyor.</p>
          <div class="brow">${ic(KOK_BORU.icon, "bimg round")}<div class="bi2"><b>${KOK_BORU.name}</b><small>Can ${KOK_BORU.hp} · Saldırı ${KOK_BORU.atk} · Savunma ${KOK_BORU.def}</small></div></div>
          <h3>Gök Bekçileri</h3>${armyHtml(PEAK_GUARD, "enemy")}
          <h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b> · Müttefik desteği +%${Math.round(g.allyBonus() * 100)}</div>
          <p class="dim">Önerilen: 28+ seviye, dolu birlik, +7 silah, Kağanlık ve tabi beyler.</p>
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.climbPeak(); })}">${ic("swords")} Zirveye tırman!</button>` : this.walkBtn(t, "Dağa yürü")}`;
        html = this.frame("Tengri Dağı", "Göğün bozkıra değdiği yer · Gök Tengri Destanı", assetUrl("map/ruins"), body);
        break;
      }
      case "boy": {
        const x = g.boyStep();
        const at = s.boy?.at;
        if (!x || !at) return this.close();
        const { b, st, n } = x;
        const near = Math.hypot(at.x - s.hero.x, at.y - s.hero.y) < 120;
        let body = `<p>${st.text}</p>`;
        if (st.act === "fight") {
          const p = Math.round(g.boyOdds() * 100);
          body += `${st.boss ? `<div class="brow">${ic(st.boss.icon, "bimg round")}<div class="bi2"><b>${st.boss.name}</b><small>Can ${st.boss.hp} · Saldırı ${st.boss.atk} · Savunma ${st.boss.def}</small></div></div>` : ""}
            <h3>Düşman</h3>${armyHtml(st.army!(s.hero.lv), "enemy")}<h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
            <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b></div>`;
        }
        const cost = st.cost ? ` (${[st.cost.gold ? `${st.cost.gold} altın` : "", st.cost.food ? `${st.cost.food} yiyecek` : ""].filter(Boolean).join(", ")})` : "";
        const poor = st.cost && !g.canAfford({ gold: st.cost.gold ?? 0, food: st.cost.food ?? 0 });
        body += near ? `<button class="btn ${st.act === "fight" ? "red" : "go"} big ${poor ? "off" : ""}" data-a="${this.act(() => { if (st.act === "fight") this.close(); g.boyAct(); })}">${ic(st.act === "fight" ? "swords" : "scroll")} ${st.btn}${cost}</button>` : this.walkBtn(t, "Oraya yürü");
        html = this.frame(st.place, `Dede Korkut · ${b.name} · Adım ${n + 1}/${b.steps.length}`, assetUrl(st.img), body);
        break;
      }
      case "kip": {
        html = this.kipHtml(t.i);
        if (!html) return this.close();
        break;
      }
      case "den": {
        const b = AREA_BOSSES[t.i];
        const reg = bossRegion(b);
        const pos = g.denPos(t.i);
        const near = Math.hypot(pos.x - s.hero.x, pos.y - s.hero.y) < 110;
        const alive = g.denAlive(t.i);
        const boss = denBoss(b, s.hero.lv);
        const p = alive ? Math.round(g.denOdds(t.i) * 100) : 0;
        const mat = RARE_INFO[reg.mat!];
        const left = g.denLeft(t.i);
        const mm = Math.ceil(left / 60000);
        const intro = b.lines.intro?.[0] ?? b.kit.intro;
        html = this.frame(b.lairName, `${reg.name} · ${tr("Bölge bossu")} · ${tr(b.kit.title)}`, assetUrl(b.icon), alive ? `
          <div class="denart"><img src="${assetUrl(b.icon)}" alt=""><i>${intro}</i></div>
          <div class="brow">${ic(b.icon, "bimg round")}<div class="bi2"><b>${b.name}</b><small>${tr("Can")} ${boss.hp} · ${tr("Saldırı")} ${boss.atk} · ${tr("Savunma")} ${boss.def}</small>
            <small class="dim">${tr("Arena")}: ${tr(ARENAS[b.kit.arena].name)} · ${tr(KINS[b.kit.kin]?.name ?? "")}</small>
            <small class="cheap">${tr("Hamleleri")}: ${b.kit.moves.map((m) => `${tr(m.name)}→${tr(ORDERS[COUNTER[m.kind]].name)}`).join(" · ")}</small>
            <small class="dim">${tr("Öfke")}: ${tr(b.kit.rage.name)}</small></div></div>
          <h3>${tr("Muhafızlar")}</h3>${armyHtml(denGuard(b, s.hero.lv), "enemy")}
          <h3>${tr("Sen ve birliğin")}</h3>${armyHtml(s.hero.army)}
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">${tr("Zafer şansı")}: <b>%${p}</b></div>
          <div class="grow rarebuy">${ic(mat.icon, "gimg")}<div class="bi2"><b class="r4">${mat.name}</b><small>${mat.desc}</small><small class="dim">${tr("Ödül")}: ${tr("nadir malzeme, Ruh Taşı, Alp Nişanı şansı, bölge işi eşya, efsane şansı")}</small></div></div>
          ${g.denKills(t.i) ? `<p class="dim">${tr("Yenilgi sayısı")}: ${g.denKills(t.i)}</p>` : ""}
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.attackDen(t.i); })}">${ic("swords")} ${tr("İne gir!")}</button>` : this.walkBtn(t, tr("İne yürü"))}` : `
          <p>${tr("{b} yaralı, inine çekildi. Bir saat içinde yeniden uyanacak.", { b: b.name })}</p>
          <div class="odds mid">${tr("Uyanmasına")}: <b>${mm} ${tr("dk")}</b></div>
          <p class="dim">${b.lore}</p>`);
        break;
      }
      case "otag": {
        const o = s.otag;
        if (!o) return this.close();
        const near = g.nearOtag();
        const z = zoneOf(o.y, H);
        const y = g.otagYield();
        const best = bestZone(g.season());
        html = this.frame("Ak Otağ", `${ZONE_NAME[z]} · ${g.sea().icon} ${g.sea().name}`, assetUrl("map/yurts"), `
          <p class="dim">${ZONE_DESC[z]}</p>
          <div class="stats"><div>${ic("foal")}Sürü: <b>${o.herd}/${HERD_MAX}</b></div><div>${ic("food")}Günlük: <b>+${y.food}</b></div><div>${ic("u_cavalry")}Atlı: <b>+${y.horses}/gün</b></div></div>
          <div class="odds ${y.q >= 1.1 ? "good" : y.q >= 0.8 ? "mid" : "bad"}">Otlak verimi: <b>%${Math.round(y.q * 100)}</b>${z === best ? " · mevsime uygun" : ` · bu mevsim <b>${ZONE_NAME[best].toLowerCase()}</b> daha bereketli`}</div>
          <p class="dim">Göç etmek için otağı istediğin yere taşı (Kahraman › Birlik › Otağ). Mevsime uygun bölgeye göç edersen şenlik yapılır.</p>
          ${near ? `<div class="row"><button class="btn go" data-a="${this.act(() => g.otagRest())}">${ic("healer")} Dinlen (${REST_FOOD} yiyecek)</button><button class="btn ${s.res.gold < HERD_GOLD || o.herd >= HERD_MAX ? "off" : ""}" data-a="${this.act(() => g.buyHerd())}">${ic("coins")} +${HERD_BUY} baş (${HERD_GOLD})</button></div>${this.spiritBtn()}` : this.walkBtn(t, "Otağa yürü")}`);
        break;
      }
      case "kurgan": {
        const k = s.kurgans[t.i];
        const b = kurganBoss(k.tier);
        const near = Math.hypot(k.x - s.hero.x, k.y - s.hero.y) < 90;
        const p = k.alive ? Math.round(g.kurganOdds(t.i) * 100) : 0;
        html = this.frame("Kurgan Taşı", `Lanetli balbal · Seviye ${k.tier}`, assetUrl("map/kurgan"), k.alive ? `
          <p>Eski bir hakanın mezarını bekleyen balbal, kara bir büyüyle uyandı. Etrafına taş askerler toplanıyor, gece olunca köylere korku salıyor. Taşı kırarsan içindeki ruhlar serbest kalır; demircilerin en çok aradığı <b>Ruh Taşları</b> geride kalır.</p>
          <div class="brow">${ic(b.icon, "bimg round")}<div class="bi2"><b>${b.name}</b><small>Can ${b.hp} · Saldırı ${b.atk} · Savunma ${b.def}</small></div></div>
          <h3>Taş askerler</h3>${armyHtml(k.guard, "enemy")}
          <h3>Sen ve birliğin</h3>${armyHtml(s.hero.army)}
          <div class="odds ${p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">Zafer şansı: <b>%${p}</b></div>
          <p class="dim">Ödül: ${2 * k.tier}+ Ruh Taşı, altın, kesin bir eşya (çoğu zaman bir kademe üstü), Kutsal Parşömen şansı.</p>
          ${near ? `<button class="btn red big" data-a="${this.act(() => { this.close(); g.attackKurgan(t.i); })}">${ic("swords")} Taşa saldır!</button>` : this.walkBtn(t, "Taşa yürü")}` : this.deepHtml(t.i, near) + (near ? this.spiritBtn() : ""));
        break;
      }
      case "kale": {
        html = this.fortPanel(t.i);
        break;
      }
      case "ruin": {
        const r = s.ruins[t.i];
        const near = Math.hypot(r.x - s.hero.x, r.y - s.hero.y) < 80;
        const K = RUIN_KINDS[ruinKind(r.x, r.y)];
        const tier = g.ruinTier(t.i);
        html = this.frame(tr(K.name), tr("Antik Harabe"), assetUrl(K.img), r.looted ? `<p>${tr("Burası çoktan yağmalanmış.")}</p>` : `
          <p>${tr(K.text)}</p>
          <p class="dim">${tr("Tehlike")}: <b>${"◆".repeat(tier)}${"◇".repeat(5 - tier)}</b> · ${tr("Üç oda, en dipte hazine")}</p>
          ${near ? `<button class="btn go big" data-a="${this.act(() => { this.close(); g.delveStart(t.i); })}">${ic("chest")} ${tr("Harabeye gir")}</button>` : this.walkBtn(t, tr("Harabeye yürü"))}`);
        break;
      }
    }
    if (html !== this.panelHtml || !this.panel.firstChild) {
      const key = `${JSON.stringify(t)}|${this.tab}`;
      const keep = key === this.panelKey ? [...this.panel.querySelectorAll<HTMLElement>("*")].filter((el) => el.scrollTop > 0).map((el) => [el.className, el.scrollTop] as const) : [];
      const top = key === this.panelKey ? this.panel.scrollTop : 0;
      this.panelKey = key;
      this.panelHtml = html;
      this.panel.innerHTML = html;
      this.panel.scrollTop = top;
      for (const [cls, y] of keep) {
        const el = cls ? this.panel.querySelector<HTMLElement>("." + cls.trim().split(/\s+/).map((c) => CSS.escape(c)).join(".")) : null;
        if (el) el.scrollTop = y;
      }
      this.foldPanel();
    }
  }

  private foldOpen = new Set<string>();

  /** Dar ekranda uzun karakter sekmelerini açılır başlıklara böler (ilk bölüm açık). */
  private foldPanel(): void {
    if (this.place?.kind !== "hero" || !["unvan", "ordu", "kervan", "techizat", "bitig", "divan"].includes(this.tab)) return;
    if (!window.matchMedia?.("(max-width: 700px)").matches) return;
    const body = this.panel.querySelector(".sheet-body");
    if (!body) return;
    const hs = [...body.children].filter((k) => k.tagName === "H3");
    if (hs.length < 3) return;
    hs.forEach((h, i) => {
      const key = `${this.tab}|${h.textContent?.trim()}`;
      const d = document.createElement("details");
      d.className = "fold";
      d.open = i === 0 || this.foldOpen.has(key);
      const sum = document.createElement("summary");
      body.insertBefore(d, h);
      sum.appendChild(h);
      d.appendChild(sum);
      while (d.nextElementSibling && d.nextElementSibling.tagName !== "H3") d.appendChild(d.nextElementSibling);
      d.addEventListener("toggle", () => (d.open ? this.foldOpen.add(key) : this.foldOpen.delete(key)));
    });
  }

  private fortPanel(i: number): string {
    const g = this.g;
    const s = g.s;
    const f = s.forts[i];
    const T = FORT_TIERS[f.tier];
    const tg: Target = { kind: "kale", i };
    const near = g.fortNear(i);
    const sub = `${t(T.name)} · ${t("Önerilen seviye")} ${T.lv} · ${g.fortOwnerName(f.owner)}`;
    if (f.owner === "me") {
      const cost = g.fortWallCost(i);
      const th = f.threat;
      const dp = th ? Math.round(g.fortDefenseOdds(i) * 100) : 0;
      return this.frame(g.fortTitle(i), sub, assetUrl(T.art), `
        <p>${t("Burçlarda senin tuğun dalgalanıyor. Kale çevresindeki yolları korur: {r} adım içinde harami kampı kurulamaz.", { r: T.guard })}</p>
        ${th ? `<div class="odds bad">${t("{w} ~{n} askerle geliyor", { w: g.fortOwnerName(th.from), n: th.n })} · ${t("Gün")} ${th.day} · ${t("Savunma şansı")}: <b>%${dp}</b></div>` : ""}
        <h3>${t("Garnizon")}</h3>${armyHtml(f.gar)}
        <div class="odds mid">${ic("coins")} ${t("Kasa")}: <b>${Math.floor(f.coffer)}</b> / ${T.income * FORT_COFFER_DAYS} · ${t("günde")} +${T.income}</div>
        <p class="dim">${t("Sur seviyesi")}: ${f.wall}/${FORT_WALL_MAX} · ${t("savunma")} +%${Math.round(fortDefense(f) * 100)}</p>
        ${near ? `<div class="row">
          <button class="btn go ${f.coffer < 1 ? "off" : ""}" data-a="${this.act(() => g.fortCollect(i))}">${ic("coins")} ${t("Kasayı al")}</button>
          <button class="btn ${armySize(s.hero.army) === 0 ? "off" : ""}" data-a="${this.act(() => g.fortMove(i, true))}">${ic("shield")} ${t("Garnizona bırak")} (5/${t("tür")})</button>
          <button class="btn ${armySize(f.gar) === 0 ? "off" : ""}" data-a="${this.act(() => g.fortMove(i, false))}">${ic("swords")} ${t("Garnizonu al")}</button>
        </div>
        ${cost ? `<button class="btn ${s.res.gold < cost.gold || s.res.stone < cost.stone ? "off" : ""}" data-a="${this.act(() => g.fortBuild(i))}">${ic("fortress")} ${t("Surları yükselt")} · ${cost.gold} ${t("altın")}, ${cost.stone} ${t("taş")}</button>` : ""}` : this.walkBtn(tg, t("Kaleye yürü"))}`);
    }
    const why = g.fortReason(i, true);
    const p = why ? 0 : Math.round(g.kaleOdds(i) * 100);
    const lore = f.owner === "harami" ? t("Haramiler bu eski kaleyi yuva yapmış. Kervan yolunu gözetliyor, geçenden haraç alıyorlar.") : t("{f} bu kaleyle yolu tutuyor. Saldırırsan onlarla aran bozulur.", { f: g.fortOwnerName(f.owner) });
    return this.frame(g.fortTitle(i), sub, assetUrl(T.art), `
      <p>${lore}</p>
      <h3>${t("Muhafızlar")}</h3>${armyHtml(f.gar, "enemy")}
      <h3>${t("Sen ve birliğin")}</h3>${armyHtml(s.hero.army)}
      <div class="odds ${why ? "bad" : p >= 65 ? "good" : p >= 35 ? "mid" : "bad"}">${why ? why : `${t("Doğrudan hücum şansı")}: <b>%${p}</b> · ${t("sur")} +%${Math.round(fortWall(f, s.engines) * 100)}`}</div>
      <p class="dim">${t("Küçük kale — tek hücum. Şehir kuşatması: başkent Sefer sekmesi, gün gün sur. Ödül: altın, taş, şöhret; kale her gün {n} altın vergi toplar.", { n: T.income })}</p>
      ${s.engines < 3 ? `<button class="btn ${s.res.gold < ENGINE_GOLD_UI ? "off" : ""}" data-a="${this.act(() => g.buyEngine())}">${ic("siege")} ${t("Mancınık kur")} (${ENGINE_GOLD_UI}) · ${s.engines}/3</button>` : ""}
      ${near ? `<button class="btn red big ${g.fortReason(i) ? "off" : ""}" data-a="${this.act(() => g.besiegeFort(i))}">${ic("siege")} ${t("Kuşat!")}</button>` : this.walkBtn(tg, t("Kaleye yürü"))}`);
  }

  private nodeHtml(i: number): string {
    const g = this.g;
    const s = g.s;
    const n = s.nodes[i];
    const near = Math.hypot(n.x - s.hero.x, n.y - s.hero.y) < 90;
    const t: Target = { kind: "node", i };
    const what = { wood: "Odun kes", stone: "Taş kır", food: "Tarlada çalış", gold: "Madende kaz" }[n.kind];
    const yieldTxt = s.free ? `${ic(RES_ICON[n.kind])} +${g.workGain(n.kind)} ${RES_NAME[n.kind].toLowerCase()}` : `${ic("coins")} ${g.slaveWage()}–${g.slaveWage() + 2} akçe ücret`;
    const eta = near ? "" : g.etaLabel(n.x, n.y);
    let body = `
      <p>${s.free ? "Kendi hesabına çalış. Topladığın kereste, taş ve yiyeceği şehir pazarlarında satabilir ya da beyliğin için saklayabilirsin." : "Efendinin işçisisin. Ürünün tamamı efendine gider, sana sadece birkaç akçe ücret düşer."}</p>
      <div class="stats"><div>Vardiya: <b>5sn</b> · ⚡10 enerji</div><div>Kazanç: <b>${yieldTxt}</b></div>${s.free ? `<div>${ic(RES_ICON[n.kind])}Kalan: <b>${fmt(n.left)}</b>/${fmt(n.max)}</div>` : ""}${eta ? `<div>${ic("quest")}${tr("Yol")}: <b>${eta}</b></div>` : ""}</div>
      ${bar(s.hero.energy, g.maxEnergy(), "en", `Enerji ${Math.floor(s.hero.energy)}/${g.maxEnergy()}`)}
      ${near ? `<button class="btn go big ${g.act || s.hero.energy < 10 ? "off" : ""}" data-a="${this.act(() => g.work(i))}">${ic(RES_ICON[n.kind])} ${what}</button>` : this.walkBtn(t, eta ? `${tr("Oraya yürü")} · ${eta}` : tr("Oraya yürü"))}
      <p class="dim">Emek becerin: ${g.skill("emek")} · Güç: ${g.stat("guc")}. İkisi de verimi artırır.</p>`;
    if (s.beylik) {
      const slots = g.marchSlots();
      const busy = s.marches.some((m) => m.node === i);
      const gar = s.garrison;
      const sliders = UNIT_KEYS.map((u) => `<label class="sl">${ic(UNITS[u].icon)}<input type="range" min="0" max="${gar[u]}" value="${Math.min(this.sel[u], gar[u])}" data-u="${u}"><b data-o="${u}">${Math.min(this.sel[u], gar[u])}</b><small>/${gar[u]}</small></label>`).join("");
      body += `<h3>${ic("j_caravan")} Toplama seferi (beylik garnizonu)</h3>
        <div class="stats"><div>Seferler: <b>${s.marches.length}/${slots}</b></div><div>Taşıma: <b data-load>${fmt(g.marchLoad(this.sel))}</b></div></div>
        ${n.left <= 0 ? `<p class="warn">Kaynak tükendi. ${dur(n.regenAt - g.now)} sonra yenilenir.</p>` : busy ? `<p class="warn">Bu noktaya zaten bir sefer gidiyor.</p>` : `${sliders}
        <button class="btn go ${s.marches.length >= slots ? "off" : ""}" data-a="${this.act(() => {
          if (g.sendMarch(i, { ...this.sel })) {
            this.toast("Toplama seferi yola çıktı", "good");
            this.close();
          } else this.toast("Sefer gönderilemedi: asker seç", "bad");
        })}">Sefer gönder</button>`}`;
    }
    return this.frame(NODE_NAME[n.kind], s.free ? `Seviye ${n.lv} kaynak noktası` : "Efendinin arazisi", assetUrl("map/" + ({ food: "farm", wood: "forest", stone: "quarry", gold: "mine" } as const)[n.kind]), body);
  }

  private portHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    const p = portOf(city)!;
    const f = s.fleet;
    const v = f.voyage;
    const calm = (f.calm ?? 0) > s.time;
    let h = `<div class="stats"><div>${ic("merchant")}Gemi: <b>${f.ships}/${SHIP_MAX}</b></div><div>${ic("j_caravan")}Ambar: <b>${g.fleetCap()}</b></div><div>${ic("trophy")}Sefer: <b>${s.c.voyages}</b></div></div>
      <p class="dim">${p.name} · ${p.sea}. Gemiler heybenin sınırına takılmaz: tek seferde gemi başına ${SHIP_CAP} denk taşır ve mal varış iskelesinde kendiliğinden satılır. ${p.sea} korsanlarına dikkat.</p>`;
    if (v) {
      const k = Math.min(1, (s.time - v.at) / v.dur);
      h += `<h3>${ic("j_caravan")} Denizdeki gemiler</h3>${bar(k * 100, 100, "", `${CITY_NAME[v.from]} → ${CITY_NAME[v.to]} · ${v.qty} ${GOODS[v.good].name}${v.escort ? " · muhafızlı" : ""}`)}`;
    }
    const calmLeft = calm ? Math.max(0, Math.ceil(((f.calm ?? 0) - s.time) / DAY_SEC)) : 0;
    h += `<div class="odds ${calm ? "good" : "mid"}">${t("Korsan tehlikesi")}: <b>%${Math.round(g.pirateRisk(false) * 100)}</b> · ${t("muhafızla")} <b>%${Math.round(g.pirateRisk(true) * 100)}</b>${calm ? ` · <b class="cheap">${t("sakin deniz")}: ${calmLeft} ${t("gün")}</b>` : ""}</div>`;
    h += `<div class="row"><button class="btn ${!near || f.ships >= SHIP_MAX || s.res.gold < SHIP_GOLD ? "off" : ""}" data-a="${this.act(() => g.buyShip())}">${ic("coins")} ${t("Gemi al")} (${SHIP_GOLD})</button>
      <button class="btn ${!near || calm ? "off" : ""}" title="${calm ? t("Kıyı hâlen sakin") : ""}" data-a="${this.act(() => g.huntPirates())}">${ic("j_bandit")} ${t("Korsan yuvasına baskın")}${calm ? ` (${calmLeft}g)` : ""}</button></div>`;
    const cargo = GOOD_KEYS.filter((k) => (s.hero.cargo[k] ?? 0) > 0);
    for (const r of routesFrom(city)) {
      h += `<h3>⚓ ${CITY_NAME[r.to]} · ${r.days} gün</h3>`;
      if (!cargo.length) {
        h += `<p class="dim">Heybende mal yok. Pazardan mal alıp buradan yükle.</p>`;
        continue;
      }
      h += cargo.map((k) => {
        const have = s.hero.cargo[k] ?? 0;
        const qty = Math.min(have, g.fleetCap());
        const avg = Math.round((s.hero.paid[k] ?? 0) / have);
        const sp = g.seaPrice(r.to, k);
        const offB = !near || !!v || f.ships <= 0 ? "off" : "";
        return `<div class="grow">${ic(GOODS[k].icon, "gimg")}<div class="bi2"><b>${GOODS[k].name} × ${qty}</b><small>Maliyet ${avg} · orada ~${sp} <em class="${sp > avg ? "cheap" : "dear"}">${sp > avg ? "+" : ""}${(sp - avg) * qty}</em></small></div>
          <div class="col2"><button class="btn sm ${offB}" data-a="${this.act(() => g.sendVoyage(r.to, k, false))}">Yükle</button><button class="btn sm ${offB || s.res.gold < ESCORT_GOLD ? "off" : ""}" data-a="${this.act(() => g.sendVoyage(r.to, k, true))}">Muhafızlı · ${ESCORT_GOLD}</button></div></div>`;
      }).join("");
    }
    return h;
  }

  private cityHtml(ci: number): string {
    const g = this.g;
    const s = g.s;
    const c = CITIES[ci];
    const isCap = ci === CAP_I;
    const near = Math.hypot(c.x - s.hero.x, c.y - s.hero.y) < (isCap ? 170 : 150);
    const t: Target = isCap ? { kind: "capital" } : { kind: "city", i: ci };
    const list: [string, string][] = [];
    if (isCap && !s.free) list.push(["efendi", "Efendi"]);
    if (isCap && s.beylik) list.push(["bina", "Binalar"], ["kisla", "Kışla"], ["ordu", "Ordu"], ["sefer", "Seferler"]);
    if (!s.free) list.push(["pazar", "Pazar"], ["han", "Han"]);
    else {
      list.push(["pazar", "Pazar"], ["demirci", "Demirci"]);
      if (g.atelierOpen()) list.push(["atolye", "Atölye"]);
      else if (s.hero.lv >= 3) list.push(["atolye", "Atölye 🔒"]);
      if (s.hero.lv >= 2 && SLOTS.some((k) => g.eq(k))) list.push(["ors", "Örs"]);
      list.push(["talim", "Talim"], ["han", "Han"]);
    }
    if (isCap && g.beylikTabOpen()) list.push(["beylik", "Beylik"]);
    else if (isCap && s.free && !s.beylik) list.push(["beylik", "Beylik 🔒"]);
    if (!isCap && s.free) list.push(["kale", s.owned[c.id] ? "Kale ★" : "Kale"]);
    if (s.free && portOf(c.id)) list.push(["liman", "Liman ⚓"]);
    const tabs = this.tabs(list);
    let body = "";
    const off = !near ? "off" : "";
    const nearNote = near ? "" : `<p class="warn">Burada iş yapmak için şehre gitmelisin. Uzaktan yalnızca son duyduğun fiyatları bilirsin.</p>${this.walkBtn(t, "Şehre yürü")}`;
    if (near) {
      const flash: Record<string, [string, string, string?]> = {
        pazar: ["scene/pazar", `${CITY_NAME[c.id]} ${tr("pazarı")}`, "heroes/npc_merchant"],
        demirci: [c.id === "konya" || c.id === "constantinople" || c.id === "tabriz" || c.id === "samarkand" || c.id === "bukhara" || c.id === "rey" ? "scene/demirci_weeks" : "scene/demirci", `${CITY_NAME[c.id]} ${tr("demircisi")}`, "heroes/npc_blacksmith"],
        han: ["scene/han", `${CITY_NAME[c.id]} ${tr("hanı")}`, "heroes/npc_innkeeper"],
        atolye: ["scene/atolye", `${CITY_NAME[c.id]} ${tr("atölyesi")}`],
        talim: ["scene/talim", tr("Talim meydanı")],
      };
      const f = flash[this.tab];
      if (f) this.maybeInterior(c.id, this.tab, f[0], f[1], f[2]);
    }
    if (this.tab === "efendi") {
      const cost = g.freedomCost();
      body = `<div class="brow">${ic("master", "bimg")}<div class="bi2"><b>Efendin Tüccar Bahadır</b><small>"Çalış, akçeni biriktir. ${cost} akçeyi getirdiğin gün özgürsün."</small></div></div>
        ${bar(s.res.gold, cost, "", `${Math.floor(s.res.gold)} / ${cost} akçe`)}
        <p class="dim">Şehrin çevresindeki orman, taş ocağı ve tarlalarda çalış. Her vardiya enerji harcar; enerjin şehirde daha hızlı dolar. Güç ve Emek arttıkça ücretin yükselir.</p>
        <button class="btn go big ${!near || s.res.gold < cost ? "off" : ""}" data-a="${this.act(() => g.buyFreedom())}">${ic("seal")} Hürriyetini satın al (${cost} akçe)</button>
        <div class="grow">${ic("j_caravan", "gimg")}<div class="bi2"><b>${tr("Çarşıda hamallık")}</b><small>${tr("Şehirden çıkmadan yük taşı: 12 enerji, 4 saniye. Ücret {w}+ akçe, ticaret tecrübesi kazandırır.", { w: g.slaveWage() + 1 })}</small></div><button class="btn sm ${!near || g.act || s.hero.energy < 12 ? "off" : ""}" data-a="${this.act(() => g.haul())}">${tr("Taşı")}</button></div>
        ${(() => {
          const wi = g.nearestWorkNode();
          const wn = s.nodes[wi];
          const wEta = g.etaLabel(wn.x, wn.y);
          return `<button class="btn go" data-a="${this.act(() => { this.close(); g.goTo({ kind: "node", i: wi }); g.cam.flyTo(wn.x, wn.y, Math.max(g.cam.zoom, 0.85)); if (wEta) this.toast(`${NODE_NAME[wn.kind]} · ${wEta}`, "info"); })}">${ic("quest")} ${tr("Çalışma yerini göster")}${wEta ? ` · ${wEta}` : ""}</button>`;
        })()}`;
    } else if (this.tab === "pazar") {
      const cap = g.carryCap();
      const se = g.sea();
      const route = g.bestRoute();
      body = `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl("scene/pazar")}')"><img class="npcface" src="${assetUrl("heroes/npc_merchant")}" alt=""><div><b>${CITY_NAME[c.id]} ${tr("pazarı")}</b><small>${tr("İpek Yolu tezgâhları · alış-satış burada")}</small></div></div>
        ${route ? `<div class="odds good route-tip sticky grow">${ic(GOODS[route.good].icon, "gimg")}<div class="bi2"><b>${tr("Altın rota")}</b><small>${route.fromName} → ${route.toName} · ${route.goodName} (~+${Math.round(route.margin)}/${tr("adet")})</small></div><button class="btn sm" data-a="${this.act(() => { const p = CITIES.find((x) => x.id === route.from); if (p) { this.close(); g.cam.flyTo(p.x, p.y, 0.7); } })}">${tr("Harita")}</button><button class="btn sm go" data-a="${this.act(() => { if (c.id === route.from && near) { this.tab = "pazar"; return; } const i = CITIES.findIndex((x) => x.id === route.from); if (i < 0) return; this.close(); g.goTo(i === CAP_I ? { kind: "capital" } : { kind: "city", i }); const p = CITIES[i]!; g.cam.flyTo(p.x, p.y, 0.7); this.toast(tr("Alış: {c}. Varınca Pazar.", { c: route.fromName }), "info"); })}">${c.id === route.from && near ? tr("Buradasın") : tr("Alışa git")}</button></div>` : ""}
        <div class="stats"><div>${ic("j_caravan")}Yük: <b>${g.cargoUsed()}/${cap}</b></div><div>${ic("merchant")}Ticaret: <b>${g.skill("ticaret")}</b></div><div>${ic("coins")}<b>${fmt(s.res.gold)}</b></div></div>
        <div class="odds mid season-strip">${se.icon} <b>${se.name}</b> · ${se.desc} · ${tr("{n} gün kaldı", { n: Math.ceil(g.seasonLeft() / DAY_SEC) })}</div>
        <p class="dim">${tr("Malın üretildiği şehirde ucuz, talep edildiği şehirde pahalıdır. Çok alırsan fiyat yükselir, çok satarsan düşer; zamanla eski haline döner.")}</p>
        <div class="odds mid">${se.icon} ${se.name}: ${Object.entries(se.goods).map(([k, m]) => `${GOODS[k as keyof typeof GOODS].name} <b class="${m! > 1 ? "neg" : "cheap"}">${m! > 1 ? "▲" : "▼"}%${Math.round(Math.abs(m! - 1) * 100)}</b>`).join(" · ")}</div>` +
        this.newsHtml(c.id, near) +
        this.cityExtraHtml(c.id, near) +
        this.flagTradeNote(c.id) +
        this.haggleHtml(c.id, near) +
        GOOD_KEYS.map((k) => {
          const intel = near ? null : g.intelOf(c.id);
          const known = near || !!intel?.p[k];
          const bp = near ? g.buyPrice(c.id, k) : intel?.p[k]?.[0] ?? 0;
          const sp = near ? g.sellPrice(c.id, k) : intel?.p[k]?.[1] ?? 0;
          const have = s.hero.cargo[k] ?? 0;
          const avg = have > 0 ? Math.round((s.hero.paid[k] ?? 0) / have) : 0;
          const rel = near ? g.price(c.id, k) / GOODS[k].base : bp / g.buyFactor() / GOODS[k].base;
          const em = near ? g.eventMult(c.id, k) : 1;
          const sat = near ? Math.abs(g.market(c.id)[k] ?? 0) : 0;
          const stockPct = Math.max(8, Math.min(100, Math.round(100 - sat * 50)));
          const tag = !known ? "" : em > 1.2 ? `<em class="pill dear">kıtlık</em>` : em < 0.8 ? `<em class="pill cheap">bolluk</em>` : rel < 0.75 ? `<em class="pill cheap">ucuz</em>` : rel > 1.3 ? `<em class="pill dear">pahalı</em>` : `<em class="pill mid">normal</em>`;
          const pr = known ? `${near ? "" : "~"}Al ${bp} · ${near ? "" : "~"}Sat ${sp}` : `<span class="dim">${tr("Fiyat bilinmiyor")}</span>`;
          return `<div class="grow trade">${ic(GOODS[k].icon, "gimg")}<div class="bi2"><b>${GOODS[k].name} ${tag}${sparkline(g.ledgerOf(c.id, k))}</b><small>${pr}${have ? ` · Elinde ${have} (ort. ${avg})` : ""}</small>${near ? `<div class="stock"><i style="width:${stockPct}%"></i></div>` : ""}</div>
            <div class="col2"><button class="btn sm ${off}" data-a="${this.act(() => g.buyGood(c.id, k, 1))}">Al</button><button class="btn sm ${off}" data-a="${this.act(() => g.buyGood(c.id, k, 5))}">Al 5</button><button class="btn sm ${!near || !have ? "off" : ""}" data-a="${this.act(() => g.sellGood(c.id, k, have))}">Sat</button></div></div>`;
        }).join("") +
        this.depotHtml(c.id, near) +
        `<h3>Ham madde sat</h3><div class="row">${(["wood", "stone", "food"] as const).map((k) => `<button class="btn ${!near || s.res[k] < 1 ? "off" : ""}" data-a="${this.act(() => g.sellRes(k, s.res[k]))}">${ic(RES_ICON[k])} ${fmt(s.res[k])} sat · ${g.resPrice(k)}/adet</button>`).join("")}</div>`;
    } else if (this.tab === "atolye" && !g.atelierOpen()) {
      body = `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl("scene/atolye")}')"><div><b>${tr("Atölye kilitli")}</b><small>${tr("Önce bir silah kuşan veya 5. seviyeye ulaş")}</small></div></div>
        <p class="warn">${tr("Erken oyunda odak: ticaret, demirci ve destan. Atölye 5. seviyede veya ilk silah sonrası açılır.")}</p>`;
    } else if (this.tab === "liman") {
      body = nearNote + this.portHtml(c.id, near);
    } else if (this.tab === "demirci") {
      const items = g.smith(c.id);
      const row = (it: Item, right: string) => this.itemRow(it, right);
      const yore = YORE[c.id];
      const rare = g.rareOf(c.id);
      const restock = g.smithRestockIn(c.id);
      const art = c.id === "konya" || c.id === "constantinople" || c.id === "tabriz" || c.id === "samarkand" || c.id === "bukhara" || c.id === "rey" ? "scene/demirci_weeks" : "scene/demirci";
      const yoreItems = items.filter((it) => it.org === c.id);
      const otherItems = items.filter((it) => it.org !== c.id);
      const buyBtn = (it: Item) => `<button class="btn sm ${!near || s.res.gold < g.itemBuyPrice(it) ? "off" : ""}" data-a="${this.act(() => g.buyItem(c.id, it.id))}">${ic("coins")}${g.itemBuyPrice(it)}</button>`;
      body = `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl(art)}')"><img class="npcface" src="${assetUrl("heroes/npc_blacksmith")}" alt=""><div><b>${CITY_NAME[c.id]} ${tr("demircisi")}</b>${yore ? `<em class="yore">${yore.name}</em><small>${yore.desc} ${tr("Ustalığı")}: ${yore.slots.map((sl) => SLOT_NAME[sl]).join(", ")}</small>` : ""}</div></div>
        <div class="odds mid">${ic("anvil")} ${restock <= 0 ? tr("Tezgâh bugün yenilendi") : tr("Tezgâh {n} gün sonra yenilenir", { n: restock })} · ${tr("Siparişler 3 günde bir")}</div>
        <p class="dim">Her şehrin ustası kendi işinde üstündür; ${yore ? `burada <b>${yore.name}</b> eşyalar dövülür` : "uzak şehirlerde daha iyi eşyalar bulunur"}. Demirci çoğunlukla ${g.cls().name} yoluna uygun mallar ayırır.</p>
        ${rare ? `<div class="grow rarebuy">${ic(RARE_INFO[rare.mat].icon, "gimg")}<div class="bi2"><b class="r4">${RARE_INFO[rare.mat].name}</b><small>${RARE_INFO[rare.mat].desc}</small><small class="dim">${tr("Kervanlarla gelen nadir malzeme")} · ${tr("kalan")} ${rare.left} · ${tr("elinde")} ${s.mats[rare.mat] ?? 0}${rare.left <= 0 ? ` · ${tr("Kervan tezgâhla birlikte gelir")}` : ""}</small></div><button class="btn sm ${!near || rare.left <= 0 || s.res.gold < rare.price ? "off" : ""}" data-a="${this.act(() => g.buyRare(c.id))}">${ic("coins")}${rare.price}</button></div>` : ""}
        ${yoreItems.length ? `<h3>${ic("seal")} ${tr("Yöre işi")}</h3>${yoreItems.map((it) => row(it, buyBtn(it))).join("")}` : ""}
        <h3>${ic("anvil")} ${tr("Satılık")}</h3>` +
        (otherItems.map((it) => row(it, buyBtn(it))).join("") || (yoreItems.length ? "" : `<p>${tr("Demircide mal kalmadı.")}</p>`)) +
        this.ordersHtml(c.id, near) +
        `<h3>${ic("schest")} Heybendeki eşyalar</h3>` +
        (s.hero.bag.map((it) => row(it, `<button class="btn sm ${off}" data-a="${this.act(() => g.sellItem(it.id))}">Sat ${ic("coins")}${g.itemSellPrice(it)}</button>`)).join("") || `<p class="dim">${tr("Heyben boş.")}</p>`);
    } else if (this.tab === "atolye") {
      const zxp = s.hero.skills.zanaat ?? 0;
      const zl = skillLv(zxp);
      const ct = this.craftTier;
      const cl = g.cls();
      const slots = CRAFT_SLOTS.filter((sl) => sl !== "kalkan" || cl.shield);
      const slotName = (sl: Slot) => (sl === "silah" ? cl.weapons.map((w) => WEAPON_NAME[w]).join("/") : sl === "zirh" ? ARMOR_NAME[cl.armor] : SLOT_NAME[sl]);
      const yore = YORE[c.id];
      const odds = g.craftOddsPct(3);
      const buff = s.artisanBuff;
      const buffArt = buff ? CRAFTSMEN.find((a) => a.slot === buff.slot && a.kind === buff.kind) : null;
      const nextM = MASTERY.find((m) => m.zl > zl);
      const openOrders = g.cityOrders(c.id).length;
      body =
        `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl("scene/atolye")}')"><div><b>${CITY_NAME[c.id]} ${tr("atölyesi")}</b><small>${tr("Döküm · iksir · imza tarifler")}</small></div></div>
        <p class="dim">Pazardan aldığın malları burada eşyaya, iksire ve Ruh Taşı'na dönüştür. Zanaatın yükseldikçe nadir, destansı ve <b class="r4">efsanevi</b> eşya çıkarma şansın artar.</p>
        <div class="brow">${ic("anvil", "bimg")}<div class="bi2"><b>${SKILL_INFO.zanaat.name} <em>Sv ${zl}</em></b>${bar(zxp - 20 * zl * zl, skillNext(zl) - 20 * zl * zl, "", `${zxp}/${skillNext(zl)}`)}</div></div>
        <div class="odds mid">${ic("trophy")} ${tr("3 isabet tahmini")}: ${tr("nadir")} ~%${odds.rare} · ${tr("destansı")} ~%${odds.epic} · ${tr("efsane")} ~%${odds.legend}</div>
        ${buff && buffArt ? `<div class="odds good">${ic(buffArt.icon)} <b>${buffArt.name}</b><small class="dim">${buff.kind === "rar" ? tr("Sonraki {s} dökümü +1 nadirlik", { s: SLOT_NAME[buff.slot] }) : tr("Sonraki {s} dökümü yarı altın", { s: SLOT_NAME[buff.slot] })}</small></div>` : ""}
        ${yore ? `<div class="odds mid">${ic("seal")} <b>${tr(yore.name)}</b><small class="dim">${tr(yore.desc)} ${tr("Bu şehirde dökülen")} ${yore.slots.map((sl) => SLOT_NAME[sl]).join(", ")} ${tr("bu damgayı taşır.")}</small></div>` : ""}
        ${CRAFTSMAN_BY_CITY[c.id] ? `<h3>${ic("anvil")} ${tr("Şehir ustası")}</h3>${this.artisanHtml(c.id, near)}` : `<p class="dim">${tr("Bu şehirde usta yok. Rey, Merv, Nişabur, Kaşgar, Semerkant, Buhara veya Konya'ya uğra.")}</p>`}
        ${openOrders ? `<div class="odds mid">${ic("scroll")} ${tr("{n} açık sipariş · Demirci sekmesinde teslim et", { n: openOrders })}</div>` : ""}
        <h3>${ic("swords")} Eşya dök</h3><div class="row tiers">${[1, 2, 3, 4, 5].map((tier) => `<button class="btn sm ${tier === ct ? "go" : ""}" data-a="${this.act(() => (this.craftTier = tier))}">Kademe ${tier}</button>`).join("")}</div>` +
        slots
          .map((sl) => {
            const mats = CRAFT_MATS.filter((m) => m.slots.includes(sl));
            const mid = mats.some((m) => m.id === this.craftMat[sl]) ? this.craftMat[sl]! : "sade";
            const mat = MAT_BY_ID[mid];
            const cost = g.craftCost(g.gearTotal(sl, ct, mid));
            const why = g.gearReason(sl, ct, mid);
            const yoreTag = yore && yore.slots.includes(sl) ? `<small class="ltag">${tr(yore.name)}</small>` : "";
            const preview = `${slotName(sl)} · K${ct}${mid !== "sade" ? ` · ${mat.name}` : ""}${yore && yore.slots.includes(sl) ? ` · ${yore.name}` : ""}`;
            const chips = mats.length > 1
              ? `<div class="matrow">${mats.map((m) => `<button class="chip ${m.id === mid ? "on" : ""} ${zl < m.zl ? "lock" : ""}" title="${m.desc}${zl < m.zl ? ` · Sv ${m.zl}` : ""}" data-a="${this.act(() => (this.craftMat[sl] = m.id))}">${ic(m.icon)} ${m.name}${zl < m.zl ? ` 🔒${m.zl}` : ""}</button>`).join("")}</div>`
              : "";
            return `<div class="grow">${ic(sl === "silah" ? `it_sword_${ct}` : sl === "zirh" ? (cl.armor === "agir" ? `it_armor_${ct}` : `it_light_${ct}`) : sl === "kalkan" ? `it_shield_${ct}` : "tr_star", "gimg")}<div class="bi2"><b>${preview}</b>${yoreTag}${chips}${mid !== "sade" ? `<small class="cheap">${mat.desc}</small>` : ""}<small>${this.matsHtml(cost)}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.craftGear(sl, ct, mid))}">Dök</button></div>`;
          })
          .join("") +
        `<h3>${ic("seal")} İmza eşyaları</h3><p class="dim">${tr("İsimli tarifler: sınıf silahına göre damgalı, yalnızca senin elinden çıkar.")}</p>` +
        SIGNATURES.map((sg) => {
          const why = g.sigReason(sg.id);
          const locked = zl < sg.zl;
          return `<div class="grow ${locked ? "locked" : ""}">${ic(sg.icon, "gimg")}<div class="bi2"><b class="r${sg.rar}">${locked ? "???" : g.sigName(sg.id)} <em>K${sg.tier}</em></b><small>${locked ? tr("Zanaat {n}. seviyede açılır.", { n: sg.zl }) : sg.desc}</small>${locked ? "" : `<small>${this.matsHtml(g.craftCost(sg.cost))}</small>`}${!locked && why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.craftSig(sg.id))}">Döv</button></div>`;
        }).join("") +
        this.relicsHtml(zl) +
        this.runesHtml(zl) +
        `<h3>${ic("tr_star")} ${tr("Tarif rehberi")}</h3>${nextM ? `<div class="odds mid">${ic(nextM.icon)} ${tr("Sıradaki")}: <b>${nextM.name}</b> · ${tr("Sv")} ${nextM.zl} · ${nextM.desc}</div>` : ""}<div class="mastery">` +
        MASTERY.map((m) => `<div class="mnode ${zl >= m.zl ? "on" : ""}${nextM && m.zl === nextM.zl ? " next" : ""}">${ic(m.icon)}<b>${m.name}</b><small>${tr("Sv")} ${m.zl} · ${m.desc}</small></div>`).join("") +
        `</div>` +
        `<h3>${ic("healer")} İksir ve savaş eşyaları</h3>` +
        CONSUMABLES.map((c) => {
          const why = g.craftReason(c.cost, c.lv);
          return `<div class="grow">${ic(c.icon, "gimg")}<div class="bi2"><b>${c.name} <em>${s.cons[c.id] ?? 0} adet</em></b><small>${c.desc}</small><small>${this.matsHtml(g.craftCost(c.cost))}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.craftCons(c.id))}">Yap</button></div>`;
        }).join("") +
        `<h3>${ic("ruh")} Simya <em class="cheap">${ic("mat_iron")} ${tr("Çelik")} ${s.mats.celik ?? 0}</em></h3>` +
        REFINES.map((r) => {
          const why = g.craftReason(r.cost);
          return `<div class="grow">${ic(r.icon, "gimg")}<div class="bi2"><b>${r.name}</b><small>${r.desc}</small><small>${this.matsHtml(g.craftCost(r.cost))}</small></div><button class="btn sm ${why ? "off" : ""}" data-a="${this.act(() => g.refine(r.id))}">Yap</button></div>`;
        }).join("") +
        this.forgeHtml();
    } else if (this.tab === "ors") {
      body = `${nearNote}${ic("anvil", "banner")}<p class="dim">Silah, zırh ve kalkanını +9'a kadar güçlendir. +4'ten sonra başarısızlık eşyayı bir seviye düşürür; +7'den sonra eşya parçalanabilir. Kutsal Parşömen eşyayı korur.</p>
        <div class="stats"><div>${ic("ruh")}Ruh Taşı: <b>${s.mats.ruh}</b></div><div>${ic("parsomen")}Parşömen: <b>${s.mats.parsomen}</b></div><button class="btn sm ${!near || s.res.gold < g.scrollPrice() ? "off" : ""}" data-a="${this.act(() => g.buyScroll())}">Parşömen al ${ic("coins")}${g.scrollPrice()}</button></div>` +
        ([...Object.values(s.hero.equip), ...s.hero.bag].filter((it): it is Item => !!it && canPlus(it)).map((it) => {
          const pc = plusCost(it);
          const p = it.plus ?? 0;
          const risk = p >= 7 ? "kırılabilir" : p >= 4 ? "düşebilir" : "güvenli";
          const why = g.plusReason(it, false);
          const whyP = g.plusReason(it, true);
          return `<div class="grow">${ic(it.icon, "gimg")}<div class="bi2"><b class="r${it.rar}">${it.name}</b><small>+${p} → +${p + 1} · şans %${Math.round(PLUS_CHANCE[p] * 100)} · <span class="${p >= 7 ? "why" : ""}">${risk}</span></small><small>${ic("coins")}${pc.gold}${pc.ruh ? ` · ${ic("ruh")}${pc.ruh}` : ""}</small></div><div class="col2"><button class="btn sm ${why || !near ? "off" : ""}" data-a="${this.act(() => g.upgradeItem(it.id, false))}">Bas</button><button class="btn sm ${whyP || !near ? "off" : ""}" data-a="${this.act(() => g.upgradeItem(it.id, true))}" title="Parşömenle">${ic("parsomen")}</button></div></div>`;
        }).join("") || `<p class="dim">Güçlendirilecek eşyan yok.</p>`);
    } else if (this.tab === "talim") {
      const cost = g.trainCostGold();
      const cl = g.cls();
      const sk = () => {
        const xp = s.hero.skills.silah;
        const lv = skillLv(xp);
        return `<div class="brow">${ic(cl.portrait, "bimg round")}<div class="bi2"><b>${cl.name} talimi · ${SKILL_INFO.silah.name} <em>Sv ${lv}</em></b>${bar(xp - 20 * lv * lv, skillNext(lv) - 20 * lv * lv, "", `${xp}/${skillNext(lv)}`)}<small>${cl.weapons.map((w) => WEAPON_NAME[w]).join(" ve ")} ile çalışırsın. ${STAT_INFO[cl.primary[0]].name} yüksekse daha hızlı öğrenirsin.</small></div>
          <button class="btn ${!near || !s.free || g.act ? "off" : ""}" data-a="${this.act(() => g.trainSkill())}">Talim<br>${ic("coins")}${cost}</button></div>`;
      };
      body = `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl("scene/talim")}')"><div><b>${tr("Talim meydanı")}</b><small>${tr("Silah ustalığı · birlik talimi")}</small></div></div>
        <p>Talim meydanındaki ustalar parasını verene ders verir. Her talim 6 saniye sürer ve 15 enerji harcar.</p>
        ${!s.free ? `<p class="warn">Köleler talim meydanına giremez.</p>` : ""}
        ${bar(s.hero.energy, g.maxEnergy(), "en", `Enerji ${Math.floor(s.hero.energy)}/${g.maxEnergy()}`)}${sk()}${this.drillHtml(near)}`;
    } else if (this.tab === "han") {
      const room = g.heroCap() - armySize(s.hero.army);
      const hire = (u: Unit) => {
        const k = Math.max(0, Math.min(5, room));
        return `<button class="btn ${!near || k <= 0 || !s.free ? "off" : ""}" data-a="${this.act(() => g.hire(u, k, c.id))}">${ic(UNITS[u].icon)} ${k} ${UNITS[u].name} · ${ic("coins")}${g.eliteCost(c.id, u) * k}${g.eliteCost(c.id, u) < g.hireCost(u) ? ` <em class="cheap">−30%</em>` : ""}</button>`;
      };
      const bl = g.cityBounties(c.id);
      const off2 = g.contractOffer(c.id);
      const kadi = s.wanted
        ? `<h3>${ic("wanted")} Kadı</h3><div class="grow">${ic("wanted", "gimg")}<div class="bi2"><b class="dear">Aranıyorsun ${"★".repeat(s.wanted)}</b><small>Muhafızlar şehir dışında peşine düşer; 3 yıldızda kimse sana iş vermez. Kadıya kefaret ödersen sicilin temizlenir.</small></div><button class="btn sm ${!near || s.res.gold < g.bribeCost() ? "off" : ""}" data-a="${this.act(() => g.bribe())}">Öde ${ic("coins")}${g.bribeCost()}</button></div>`
        : "";
      const rumor = kadi + this.chainHtml(c.id, near) + `<h3>${ic("scroll")} Söylentiler</h3>` + (s.events.map((e) => `<div class="qrow">${ic(GOODS[e.good].icon)} ${e.text}<span class="${e.mult > 1 ? "dear" : "cheap"}">×${e.mult.toFixed(1)}</span></div>`).join("") || `<p class="dim">Kervancılar bu aralar sakin günler geçtiğini söylüyor.</p>`) +
        `<h3>${ic("j_caravan")} Kervan sözleşmesi</h3>` +
        (s.contract
          ? `<div class="odds mid">Elinde bir emanet var: ${s.contract.cargo} → <b>${CITY_NAME[s.contract.to]}</b> · ${dur(s.contract.until - g.now)}</div>`
          : off2
            ? `<div class="grow">${ic("j_caravan", "gimg")}<div class="bi2"><b>${off2.cargo} → ${CITY_NAME[off2.to]}</b><small>Ödül ${off2.gold} altın · Süre ${dur(off2.until * 1000)} · Yolda yağmacılar saldırabilir</small>${s.renown < g.contractNeed(off2) ? `<small class="why">${tr("Tüccarlar {n} şöhret görmek istiyor", { n: g.contractNeed(off2) })}</small>` : ""}</div><button class="btn sm ${!near || !s.free || s.renown < g.contractNeed(off2) ? "off" : ""}" data-a="${this.act(() => g.takeContract(c.id))}">Kabul et</button></div>`
            : `<p class="dim">Bugünlük kervan işi kalmadı.</p>`);
      const sr = s.serais[c.id];
      const swhy = g.seraiReason(c.id);
      const serai =
        c.id === CAPITAL.id
          ? ""
          : `<h3>${ic("tug")} ${sr ? `Senin kervansarayın <em>Sv ${sr.lv}</em>` : "Kervansaray kur"}</h3>` +
            (sr
              ? `<div class="brow">${ic("map/serai", "bimg")}<div class="bi2">${bar(sr.coffer, g.seraiCap(c.id), "", `Kasa ${Math.floor(sr.coffer)}/${Math.round(g.seraiCap(c.id))}`)}<small>Dakikada ${g.seraiRate(c.id).toFixed(1)} altın · Ağında ${g.seraiCount()} kervansaray · Bedava konaklama, ticarette %${2 * sr.lv} avantaj</small>${swhy && sr.lv < 3 ? `<small class="why">${swhy}</small>` : ""}</div>${sr.lv < 3 ? `<button class="btn sm ${swhy ? "off" : ""}" data-a="${this.act(() => g.buildSerai(c.id))}">Geliştir<br>${ic("coins")}${g.seraiCost(c.id)}</button>` : ""}</div>`
              : `<div class="brow">${ic("map/serai", "bimg")}<div class="bi2"><b>${CITY_NAME[c.id]} yolunda kendi hanın</b><small>Kasası her dakika altın biriktirir, uğradığında toplarsın. Burada konaklama bedava, emanet teslimine %25 prim. Her yeni kervansaray tüm ağın gelirini %15 artırır.</small>${swhy ? `<small class="why">${swhy}</small>` : ""}</div><button class="btn sm ${swhy || !near ? "off" : ""}" data-a="${this.act(() => g.buildSerai(c.id))}">Kur<br>${ic("coins")}${g.seraiCost(c.id)}</button></div>`);
      const nightOk = near && g.hanNightReady(c.id);
      const nightRow = s.free
        ? `<h3>${ic("han")} ${tr("Han gecesi")}</h3><p class="dim">${tr("Günde en fazla iki kısa sohbet. Söylenti, iş veya düello.")}</p>
          <div class="row han-night">
            <button class="btn sm ${nightOk ? "go" : "off"}" data-a="${this.act(() => g.doHanNight(c.id, "rumor"))}">${ic("scroll")} ${tr("Söylenti dinle")}</button>
            <button class="btn sm ${nightOk ? "" : "off"}" data-a="${this.act(() => g.doHanNight(c.id, "job"))}">${ic("j_caravan")} ${tr("İş ara")}</button>
            <button class="btn sm ${nightOk ? "" : "off"}" data-a="${this.act(() => g.doHanNight(c.id, "duel"))}">${ic("wanted")} ${tr("İlan / düello")}</button>
          </div>`
        : "";
      body = `${nearNote}<div class="smithban sceneban" style="background-image:url('${assetUrl("scene/han")}')"><img class="npcface" src="${assetUrl("heroes/npc_innkeeper")}" alt=""><div><b>${CITY_NAME[c.id]} ${tr("hanı")}</b><small>${tr("Dinlen · kervan · paralı asker · yolcu")}</small></div></div>
        <div class="brow">${ic("han", "bimg")}<div class="bi2"><b>Kervansaray odası</b><small>Canını ve enerjini tamamen doldurur.</small></div><button class="btn ${!near || g.act ? "off" : ""}" data-a="${this.act(() => g.rest())}">Uyu ${g.restCost() ? `${ic("coins")}${g.restCost()}` : "· bedava"}</button></div>
        ${nightRow}${this.feastHtml(c.id, near)}${this.boardHtml(c.id, near)}${serai}${this.stableHtml(c.id, near)}${this.birdShopHtml(c.id, near)}${rumor}
        <h3>${ic("wanted")} Ödül ilanları</h3>` +
        (bl.map(({ b, i }) => {
          const cp = s.camps[b.camp];
          return `<div class="grow">${ic("j_bandit", "gimg")}<div class="bi2"><b>${cp.name} <em>Sv ${cp.tier}</em></b><small>Ödül: ${b.gold} altın · ${b.renown} şöhret</small></div>${b.taken ? `<button class="btn sm" data-a="${this.act(() => { this.close(); g.cam.flyTo(cp.x, cp.y, 0.8); })}">Göster</button>` : `<button class="btn sm ${!near || !s.free ? "off" : ""}" data-a="${this.act(() => g.takeBounty(i))}">İlanı al</button>`}</div>`;
        }).join("") || `<p class="dim">Şu an ilan yok.</p>`) +
        `<h3>${ic("merc")} Paralı askerler</h3><p class="dim">Askerlerin günlük ücret ister. Altının biterse terk ederler.</p><div class="col">${hire("spear")}${hire("archer")}${hire("horse")}</div>` +
        `<div class="grow">${ic("heroes/npc_scout", "gimg")}<div class="bi2"><b>${tr("Yol muhafızı")}</b><small>${tr("5 gün · 3 mızrak + 1 okçu · 120 altın. Süre bitince ayrılırlar.")}</small>${s.roadGuard && s.roadGuard.until > g.dayOf().day ? `<small class="cheap">${tr("{n} gün kaldı", { n: s.roadGuard.until - g.dayOf().day })}</small>` : ""}</div><button class="btn sm ${!near || !s.free ? "off" : "go"}" data-a="${this.act(() => g.hireRoadGuard())}">${tr("Tut")}<br>${ic("coins")}120</button></div>` +
        COMPANIONS.filter((cp) => cp.hire?.city === c.id).map((cp) => {
          const why = g.hireReason(cp);
          return `<h3>${ic("tug")} Handaki yolcu</h3><div class="comp ${g.hasComp(cp.id) ? "on" : ""}"><img src="${assetUrl(cp.icon)}" alt=""><div class="bi2"><b>${cp.name} <em>${cp.role}</em></b><small>${cp.desc}</small><small class="cheap">${cp.perk}</small>${why ? `<small class="why">${why}</small>` : ""}</div>${g.hasComp(cp.id) ? "" : `<button class="btn sm ${why || !near ? "off" : ""}" data-a="${this.act(() => g.hireCompanion(cp.id))}">Yanına al<br>${ic("coins")}${cp.hire!.gold}</button>`}</div>`;
        }).join("");
    } else if (this.tab === "beylik") {
      if (!g.beylikTabOpen() && !s.beylik) {
        body = `${ic("fortress", "banner")}<p class="warn">${tr("Beylik sekmesi Destan Bölüm 1 veya 15 şöhretten sonra açılır. Önce Buhara'ya git.")}</p>
          ${bar(s.renown, 15, "", `Şöhret ${s.renown}/15`)}`;
      } else {
      const bc = g.beylikCost();
      const ok = near && s.renown >= bc.renown && s.res.gold >= bc.gold;
      body = `${ic("fortress", "banner")}<p>Yeterince ün ve servet kazandığında Semerkant'ın dışındaki topraklarda kendi beyliğini kurabilirsin. Beylik; binalar, üretim, kışla ve toplama seferlerini açar.</p>
        ${bar(s.renown, bc.renown, "", `Şöhret ${s.renown}/${bc.renown}`)}${bar(s.res.gold, bc.gold, "", `Altın ${fmt(s.res.gold)}/${bc.gold}`)}
        <button class="btn go big ${ok ? "" : "off"}" data-a="${this.act(() => g.foundBeylik())}">${ic("crown")} Beyliği kur</button>
        <p class="dim">Şöhret; haramileri yenerek, kampları yıkarak ve ödül ilanlarını tamamlayarak kazanılır.</p>`;
      }
    } else if (this.tab === "kale") {
      body = nearNote + this.kaleHtml(c.id, near);
    } else body = this.beylikTabs();
    const fac = FACTIONS[factionOf(c.id)];
    const facTag = s.owned[c.id]
      ? `<span class="ftag" style="--fc:#ffd36a">Senin şehrin · ${fac.name} sınırında</span>`
      : `<span class="ftag" style="--fc:${g.hostile(c.id) ? "#ff6a5a" : fac.color}">${fac.name} · ${g.hostile(c.id) ? "Düşman" : REP_RANKS[g.cityRank(c.id)].name}</span>`;
    const sub = (isCap && s.beylik ? `Beyliğinin merkezi · Saray Sv ${g.bld("saray")} · ` : isCap && !s.free ? "Efendinin şehri · " : "") + facTag;
    return this.frame(g.cityName(ci), sub, assetUrl("cities/" + c.id), this.sagaBox(c.id, near) + tabs + body, assetUrl("cities/" + c.id));
  }

  private realmHtml(): string {
    const g = this.g;
    const r = g.realm();
    const here = g.atCapital();
    const moodCls = r.mood < 25 ? "hp" : "";
    const moodTxt = r.mood < 25 ? t("Öfkeli") : r.mood < 45 ? t("Huzursuz") : r.mood > 75 ? t("Mutlu") : t("Sakin");
    const taxes = REALM_TAX.map((x, i) => `<button class="btn sm ${r.tax === i ? "go" : ""}" title="${t(x.desc)}" data-a="${this.act(() => g.setRealmTax(i as Tax))}">${t(x.name)} ×${x.gold}</button>`).join("");
    const specs = SPECS.map((sp) => {
      const on = r.spec === sp.id;
      const cost = g.specCost();
      return `<div class="grow ${on ? "pick" : ""}">${ic(sp.icon, "gimg")}<div class="bi2"><b>${t(sp.name)}</b><small>${t(sp.desc)}</small></div>${on ? `<em class="cheap">${t("Seçili")}</em>` : `<button class="btn sm ${!here || g.s.res.gold < cost ? "off" : ""}" data-a="${this.act(() => g.setSpec(sp.id))}">${r.spec ? t("Değiştir") : t("Seç")}<br>${ic("coins")}${cost}</button>`}</div>`;
    }).join("");
    const eco = g.economyPulse();
    const E = ERAS[g.wd().era];
    return `<h3>${ic("crown")} ${t("Beylik divanı")}</h3>
      ${bar(r.mood, 100, moodCls, `${t("Halkın memnuniyeti")} ${Math.round(r.mood)}/100 · ${moodTxt}`)}
      <p class="dim">${t("Memnuniyet üretimi etkiler (×0,7 – ×1,12). 20'nin altında ayaklanma çıkabilir. Kut ve erzak da halkın gönlünü belirler.")}</p>
      <div class="eboard compact">
        <div class="ebrow"><b>${t(E.name)}</b><small>${t("Fiyat")} ×${E.price.toFixed(2)} · ${t("Tecrübe")} ×${E.xp.toFixed(2)}</small></div>
        <div class="stats"><div>${ic("coins")}${t("Haftalık gelir")}: <b class="cheap">+${fmt(eco.income)}</b></div><div>${ic("coins")}${t("Haftalık masraf")}: <b class="dear">−${fmt(eco.upkeep)}</b></div><div>${ic("coins")}${t("Net")}: <b class="${eco.net >= 0 ? "cheap" : "dear"}">${eco.net >= 0 ? "+" : ""}${fmt(eco.net)}</b></div></div>
      </div>
      <div class="row">${taxes}</div>
      <h3>${ic("seal")} ${t("Uzmanlık")}</h3><p class="dim">${t("Beyliğin tek bir alanda ün salar. Değiştirmek {g} altına mal olur.", { g: 600 })}</p>${specs}`;
  }

  /** M&B tarzı birlik ağacı — kilitli basamaklar dahil, mobil yatay kaydırma. */
  private troopTreeHtml(): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const node = (name: string, desc: string, on: boolean, lock = "", cls = "") =>
      `<div class="tnode ${on ? "on" : "off"}${cls ? ` ${cls}` : ""}"><b>${name}</b><small>${on ? desc : lock || desc}</small></div>`;
    const tree = UNIT_KEYS.map((u) => {
      const lv = g.drillLv(u);
      const br = s.drill?.[u]?.br;
      const base = UNITS[u];
      const lv1 = DRILL[u].lv1;
      const picked = lv >= 2 ? br ?? DRILL[u].lv2[0].id : "";
      const brHtml = DRILL[u].lv2
        .map((st) => {
          const lit = !!picked && picked === st.id;
          const facLock = st.fac ? FACTIONS[st.fac].name : "";
          const lock = lv < 2 ? (facLock ? `${t("Talim ★2")} · ${facLock}` : t("Talim ★2")) : lit ? "" : t("Seçilmedi");
          return node(st.name, `${st.desc} · ×${st.wage}`, lit, lock, lit ? "pick" : st.fac ? "fac" : "");
        })
        .join("");
      return `<div class="tcol">${node(base.name, `${t("Can")} ${base.hp} · ${t("Saldırı")} ${base.atk}`, true, "", "root")}
        <i class="tline"></i>${node(lv1.name, lv1.desc, lv >= 1, t("Talim ★1"))}
        <i class="tline"></i><div class="tbrs">${brHtml}</div>
        <i class="tline"></i>${node(lv >= 2 ? `${t("Seçkin")} ${g.unitName(u)}` : `${t("Seçkin")}…`, ELITE[u].desc, lv >= 3, t("Kahraman Sv 15"))}
        <i class="tline"></i>${node(LEGIONS[u].name, LEGIONS[u].desc, lv >= 4, t("Kahraman Sv 22"), "leg")}</div>`;
    }).join("");
    return `<h3>${ic("tug")} ${t("Birlik ağacı")}</h3><p class="dim">${t("Talim meydanında terfi: kilitli basamaklar da görünür. Kültür birlikleri için o devletle Dost ol.")}</p><div class="ttree">${tree}</div>`;
  }

  private drillHtml(near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    const rows = UNIT_KEYS.map((u) => {
      const lv = g.drillLv(u);
      const xp = g.drillXp(u);
      const stars = `<span class="dstars">${[1, 2, 3, 4].map((k) => `<i class="${k <= lv ? "on" : ""}${k === 4 ? " leg" : ""}">★</i>`).join("")}</span>`;
      const head = `${ic(UNITS[u].icon, `gimg dl${lv}`)}<div class="bi2"><b>${g.unitName(u)} ${stars}</b>`;
      if (lv >= DRILL_MAX) return `<div class="grow dlegend">${head}<small class="cheap">${t("Destan birliği: bozkırda adları türkülere girdi.")}</small></div></div>`;
      const need = DRILL_XP[lv + 1];
      const xpBar = bar(Math.min(xp, need), need, "", `${t("Birlik tecrübesi")} ${Math.min(xp, need)}/${need}`);
      const cost = g.drillCost(u);
      if (lv >= 2) {
        const why = g.drillReason(u);
        const nx = lv === 2 ? { name: `${t("Seçkin")} ${g.unitName(u)}`, desc: ELITE[u].desc, need: t("Kahraman Sv 15") } : { name: LEGIONS[u].name, desc: LEGIONS[u].desc, need: `${t("Kahraman Sv 22")} · ${this.matsHtml(LEGIONS[u].cost as Cost)}` };
        return `<div class="grow ${lv === 3 ? "dnext4" : ""}">${head}${xpBar}<small>→ <b class="${lv === 3 ? "r4" : "r3"}">${nx.name}</b>: ${nx.desc}</small><small>${nx.need}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why || !near ? "off" : "go"}" data-a="${this.act(() => g.drillUp(u))}">${t("Terfi")}<br>${ic("coins")}${cost}</button></div>`;
      }
      if (lv === 0) {
        const st = DRILL[u].lv1;
        const why = g.drillReason(u);
        return `<div class="grow">${head}${xpBar}<small>→ <b>${st.name}</b>: ${st.desc} · ${t("ücret")} ×${st.wage}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why || !near ? "off" : "go"}" data-a="${this.act(() => g.drillUp(u))}">${t("Terfi")}<br>${ic("coins")}${cost}</button></div>`;
      }
      const brs = DRILL[u].lv2.map((st) => {
        const why = g.drillReason(u, st.id);
        return `<div class="grow sub">${ic(st.fac ? "crown" : "swords", "gimg")}<div class="bi2"><b>${st.name}${st.fac ? ` <em>${t("kültür birliği")}</em>` : ""}</b><small>${st.desc} · ${t("ücret")} ×${st.wage}</small>${why ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm ${why || !near ? "off" : "go"}" data-a="${this.act(() => g.drillUp(u, st.id))}">${t("Seç")}<br>${ic("coins")}${cost}</button></div>`;
      }).join("");
      return `<div class="grow">${head}${xpBar}</div></div>${brs}`;
    }).join("");
    const rail = techRailStatus(g);
    const [railNow, railNext] = rail.queue;
    const railHtml = `<div class="grow sub techq"><div class="bi2"><b>${t("Çağ")}: ${rail.eraName}</b><small>${rail.eraText}</small>${railNow
      ? `<small class="why">${t("Şimdi")}: <b>${railNow.label}</b> · ${t("Sonra")}: ${railNext ? `<b>${railNext.label}</b>` : t("—")}</small><small class="dim">${railNow.why}</small>`
      : `<small class="cheap">${t("Bütün rayda kilit yok")}</small>`}</div></div>`;
    return `<h3>${ic("swords")} ${t("Birlik terfisi")}</h3>${railHtml}<p class="dim">${t("Askerlerin savaştıkça birlik tecrübesi toplar. Yeterince pişen birlik talim meydanında yeni bir ada ve daha güçlü donanıma terfi eder. Kültür birlikleri için o devletle Dost olmalı ya da bir şehrine sahip olmalısın.")}</p>${rows}`;
  }

  private depotHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    if (!s.free) return "";
    if (!g.canDepot(city)) return `<p class="dim">${ic("lock")} ${t("Bu şehirde kervansarayın ya da kalen olursa malını depolayıp fiyat yükselene kadar bekletebilirsin.")}</p>`;
    const d = g.depotOf(city);
    const rows = GOOD_KEYS.filter((k) => (d[k]?.[0] ?? 0) > 0 || (s.hero.cargo[k] ?? 0) > 0).map((k) => {
      const st = d[k]?.[0] ?? 0;
      const have = s.hero.cargo[k] ?? 0;
      return `<div class="grow">${ic(GOODS[k].icon, "gimg")}<div class="bi2"><b>${GOODS[k].name}</b><small>${t("Depoda")} ${st}${st ? ` (ort. ${Math.round(d[k]![1] / st)})` : ""} · ${t("Yükünde")} ${have}</small></div><div class="col2"><button class="btn sm ${!near || !have ? "off" : ""}" data-a="${this.act(() => g.depotPut(city, k))}">${t("Koy")}</button><button class="btn sm ${!near || !st ? "off" : ""}" data-a="${this.act(() => g.depotTake(city, k))}">${t("Al")}</button></div></div>`;
    }).join("");
    return `<h3>${ic("schest")} ${t("Depo")}</h3><p class="dim">${t("Depodaki mal yük tutmaz. Fiyat geçmişine bakıp iyi günü bekle.")}</p>${rows || `<p class="dim">${t("Depo boş.")}</p>`}`;
  }

  private ordersHtml(city: string, near: boolean): string {
    const g = this.g;
    if (!g.s.free) return "";
    const list = g.cityOrders(city);
    const day = g.dayOf().day;
    const rows = list.map((o) => {
      const fits = g.orderFits(o);
      const pick = fits.sort((a, b) => a.tier - b.tier || a.rar - b.rar)[0];
      const need = `${SLOT_NAME[o.slot]} · ${t("Kademe")} ${o.tier}+${o.rar ? ` · <span class="r1">${t("nadir")}+</span>` : ""}`;
      return `<div class="grow">${ic("scroll", "gimg")}<div class="bi2"><b>${o.who} <em>${Math.max(0, o.until - day + 1)} ${t("gün")}</em></b><small>${need} · ${g.orderWhy(o)}</small><small>${ic("coins")}${o.gold} · ${t("itibar")} +${o.rep} · ${t("zanaat tecrübesi")}</small>${pick ? `<small class="cheap">${t("Teslim edilecek")}: ${pick.name}</small>` : `<small class="why">${t("Heybende uygun eşya yok; atölyede dök.")}</small>`}</div><button class="btn sm ${!near || !pick ? "off" : "go"}" data-a="${this.act(() => pick && g.fillOrder(city, o.id, pick.id))}">${t("Teslim et")}</button></div>`;
    }).join("");
    return `<h3>${ic("scroll")} ${t("Sipariş defteri")}</h3><p class="dim">${t("Şehir halkı belirli eşyalar ısmarlar. Atölyede döktüğün eşyayı teslim edersen piyasanın çok üstünde ödeme ve itibar alırsın.")}</p>${rows || `<p class="dim">${t("Şu an sipariş yok; birkaç gün sonra yine uğra.")}</p>`}`;
  }

  private kaleHtml(city: string, near: boolean): string {
    const g = this.g;
    const s = g.s;
    const o = s.owned[city];
    const fac = FACTIONS[factionOf(city)];
    if (!o) {
      const why = g.siegeReason(city);
      const gar = g.cityGar(city);
      const wall = g.siegeWall(city);
      const od = g.siegeOdds(city);
      const ocls = od > 0.7 ? "good" : od > 0.4 ? "mid" : "bad";
      const armyN = armySize(g.siegeArmy(city));
      const ladder = [
        [s.beylik, t("Beylik")],
        [s.hero.lv >= SIEGE_LV, `Sv ${SIEGE_LV}+`],
        [s.renown >= SIEGE_RENOWN, `${SIEGE_RENOWN}+ ${t("şöhret")}`],
        [armyN >= 25, `${t("25 asker")} (${armyN})`],
        [s.engines > 0, `${t("Mancınık")} (${s.engines}/3)`],
      ] as [boolean, string][];
      const ladderHtml = `<div class="odds mid siege-ladder"><b>${t("Kuşatma merdiveni")}</b><small>${ladder.map(([ok, lab]) => `${ok ? "✓" : "○"} ${lab}`).join(" · ")}</small></div>`;
      return `<div class="brow">${ic("siege", "bimg")}<div class="bi2"><b>${CITY_NAME[city]} surları</b><small>${fac.name} garnizonu şehri korur. Surlar savunmaya güç katar; mancınıklar bu üstünlüğü kırar. Kuşatma ${fac.name} ile aranı derinden bozar.</small></div></div>
        ${ladderHtml}
        <div class="stats">${UNIT_KEYS.map((u) => `<div>${ic(UNITS[u].icon)}${UNITS[u].name}: <b>${gar[u]}</b></div>`).join("")}<div>${ic("fortress")}Sur: <b>+%${Math.round(wall * 100)}</b></div></div>
        <div class="grow">${ic("siege", "gimg")}<div class="bi2"><b>Mancınık <em>${s.engines}/3</em></b><small>Her biri sur bonusunu %10 düşürür. Bir kuşatmada harcanır.</small></div><button class="btn sm ${s.engines >= 3 || s.res.gold < ENGINE_GOLD_UI ? "off" : ""}" data-a="${this.act(() => g.buyEngine())}">Kur<br>${ic("coins")}${ENGINE_GOLD_UI}</button></div>
        <p class="dim">Kuşatmaya birliğinle birlikte beyliğinin kışla garnizonu da katılır: <b>${armySize(s.hero.army)}</b> + <b>${armySize(s.garrison)}</b> asker. Sağ kalanlar kışlaya döner.</p>
        ${(() => {
          const hp = g.seferHelp(city);
          return hp ? `<div class="odds good">${ic("tug")} Ortak sefer: <b>${hp.r.name} ${hp.r.title}</b> ${armySize(hp.a)} askerle yanında yürüyor!</div>` : "";
        })()}
        <div class="odds ${ocls}">Zafer ihtimali: <b>%${Math.round(od * 100)}</b></div>
        ${why ? `<p class="why">${why}</p>` : ""}
        <button class="btn go big ${why || !near ? "off" : ""}" data-a="${this.act(() => { this.close(); g.besiege(city); })}">${ic("swords")} Kuşat</button>`;
    }
    const loyCls = o.loy < 25 ? "hp" : "";
    const garRow = (u: Unit) => `<div class="grow">${ic(UNITS[u].icon, "gimg")}<div class="bi2"><b>${UNITS[u].name}</b><small>Garnizon ${o.gar[u]} · Yanında ${s.hero.army[u]}</small></div><button class="btn sm ${!near || s.hero.army[u] <= 0 ? "off" : ""}" data-a="${this.act(() => g.garMove(city, u, 10))}">+10</button><button class="btn sm ${!near || o.gar[u] <= 0 ? "off" : ""}" data-a="${this.act(() => g.garMove(city, u, -10))}">−10</button></div>`;
    return `<div class="brow">${ic("crown", "bimg")}<div class="bi2"><b>${CITY_NAME[city]} senin</b><small>${o.since}. günden beri tuğun burçlarda dalgalanıyor. Vergi kasası dolar, uğradığında toplarsın. Bağlılık düşerse halk ayaklanır; ${FACTIONS[o.from].name} şehri geri almak için ordu gönderir.</small></div></div>
      ${bar(o.loy, 100, loyCls, `Bağlılık ${Math.floor(o.loy)}/100`)}
      ${bar(o.coffer, g.ownCap(city), "", `Kasa ${Math.floor(o.coffer)}/${Math.round(g.ownCap(city))} · dakikada ${g.ownRate(city).toFixed(1)}`)}
      <button class="btn go ${!near || o.coffer < 1 ? "off" : ""}" data-a="${this.act(() => g.collectCity(city))}">${ic("coins")} Vergiyi topla</button>
      <h3>${ic("scroll")} Vergi oranı</h3><div class="row">${TAX_UI.map((t, i) => `<button class="btn sm ${o.tax === i ? "go" : ""}" data-a="${this.act(() => g.setTax(city, i as 0 | 1 | 2))}">${t.name} ×${t.mult}</button>`).join("")}</div>
      <p class="dim">Hafif vergi bağlılığı artırır, ağır vergi kasayı hızla doldurur ama halkı kızdırır. Garnizon da bağlılığı destekler.</p>
      <button class="btn ${s.res.gold < FEAST_GOLD_UI ? "off" : ""}" data-a="${this.act(() => g.feast(city))}">${ic("food")} Şölen ver (+25 bağlılık) · ${ic("coins")}${FEAST_GOLD_UI}</button>
      <h3>${ic("tug")} Garnizon <em>${armySize(o.gar)} · savunma +%${Math.round(g.cityDefense(city) * 100)}</em></h3>${UNIT_KEYS.map(garRow).join("")}
      ${this.cityMgmtHtml(city)}`;
  }

  private cityMgmtHtml(city: string): string {
    const g = this.g;
    const s = g.s;
    const o = s.owned[city]!;
    const ev = g.cityEv(city);
    const evHtml = ev
      ? `<div class="grow cev ${ev.good ? "good" : "bad"}">${ic(ev.icon, "gimg")}<div class="bi2"><b>${ev.name} <em>· ${Math.max(0, o.ev!.until - g.dayOf().day + 1)} gün</em></b><small>${ev.text}</small><small class="${ev.good ? "cheap" : "neg"}">Vergi ×${ev.tax} · bağlılık ${ev.loy > 0 ? "+" : ""}${ev.loy}/dk</small></div>${ev.fix ? `<button class="btn sm go" data-a="${this.act(() => g.fixCityEv(city))}">${ev.fix.label}<br>${ev.fix.gold ? `${ic("coins")}${ev.fix.gold}` : ""}${ev.fix.food ? `${ic("food")}${ev.fix.food}` : ""}</button>` : ""}</div>`
      : "";
    const blds = CITY_BLD_KEYS.map((b) => {
      const B = CITY_BLDS[b];
      const lv = g.cbl(city, b);
      const max = lv >= B.max;
      const c = cityBldCost(b, lv);
      const can = s.res.gold >= c.gold && s.res.stone >= c.stone;
      return `<div class="grow">${ic(B.icon, "gimg")}<div class="bi2"><b>${B.name} <em>${lv}/${B.max}</em></b><small>${B.desc(Math.max(1, lv + (max ? 0 : 1)))}</small></div>${max ? `<em class="cheap">Tamam</em>` : `<button class="btn sm ${can ? "go" : "off"}" data-a="${this.act(() => g.buildCity(city, b))}">Kur<br>${ic("coins")}${c.gold} ${ic("stone")}${c.stone}</button>`}</div>`;
    }).join("");
    const cur = g.cityGov(city);
    const govs = GOVERNORS.map((gv) => {
      const here = cur?.id === gv.id;
      const where = Object.entries(s.owned).find(([, x]) => x.gov === gv.id)?.[0];
      return `<div class="grow ${here ? "pick" : ""}">${ic(gv.icon, "gimg round")}<div class="bi2"><b>${gv.name} <em>${gv.role}</em></b><small>${gv.desc}</small>${where && !here ? `<small class="dim">Şu an ${CITY_NAME[where]} valisi</small>` : ""}</div>${here ? `<em class="cheap">Vali</em>` : `<button class="btn sm ${s.res.gold >= GOV_GOLD ? "" : "off"}" data-a="${this.act(() => g.appointGov(city, gv.id))}">Ata<br>${ic("coins")}${GOV_GOLD}</button>`}</div>`;
    }).join("");
    const policyHtml = cur
      ? `<h3>${ic("scroll")} Vali politikası</h3><p class="dim">Valin bu şehirde bir yöne ağırlık verir; dilediğin an değiştirebilirsin.</p><div class="row">${(Object.keys(CITY_POLICIES) as CityPolicy[])
          .map((p) => {
            const P = CITY_POLICIES[p];
            const on = o.policy === p;
            return `<button class="btn sm ${on ? "go" : ""}" title="${P.desc}" data-a="${this.act(() => g.setCityPolicy(city, on ? null : p))}">${ic(P.icon)}${P.name}</button>`;
          })
          .join("")}</div>
        <div class="grow">${ic("crown", "gimg")}<div class="bi2"><b>${t("Valiye bırak")}</b><small>${t("Açarsan vali haftada bir kendi politikasının gereğini kendiliğinden yerine getirir: vergi kasayı boşaltır, asker garnizonu takviye eder, adalet olayı kasadan öder.")}</small></div><button class="btn sm ${o.auto ? "go" : ""}" data-a="${this.act(() => g.setGovAuto(city, !o.auto))}">${o.auto ? t("Açık") : t("Kapalı")}</button></div>
        <h3>${ic("tug")} ${t("Vali ordu emri")}</h3><p class="dim">${t("Valiye bırakılınca garnizon bu emri haftada bir uygular; kahramanının ya da başkentinin ordusuna hiç dokunmaz.")}</p><div class="row">${(Object.keys(ARMY_ORDERS) as ArmyOrder[])
          .map((a) => {
            const A = ARMY_ORDERS[a];
            const on = o.armyOrder === a;
            return `<button class="btn sm ${on ? "go" : ""}" title="${A.desc}" data-a="${this.act(() => g.setArmyOrder(city, on ? null : a))}">${ic(A.icon)}${A.name}</button>`;
          })
          .join("")}</div>`
      : "";
    return `${evHtml}<h3>${ic("fortress")} Şehir yapıları</h3>${blds}<h3>${ic("crown")} Vali</h3><p class="dim">Her vali yalnızca bir şehri yönetir. Başka şehre atarsan eski görevinden ayrılır.</p>${govs}${policyHtml}`;
  }

  private sagaBox(cityId: string, near: boolean): string {
    const g = this.g;
    const ch = g.chapter();
    if (!ch || ch.city !== cityId || !ch.scene || !g.s.free) return "";
    const why = ch.req?.(g);
    const btns = why
      ? `<p class="why">${why}</p>`
      : !near
        ? `<p class="why">Şehre gitmelisin.</p>`
        : `<div class="row">${ch.scene.choices.map((c) => {
            const w = c.why?.(g);
            return `<button class="btn ${w ? "off" : "go"}" title="${w ?? ""}" data-a="${this.act(() => {
              g.sagaNote(`${tr("Kararın")}: ${c.label}`);
              c.run(g);
            })}">${c.label}</button>`;
          }).join("")}</div>`;
    const more = why ? "" : `<button class="more" data-a="${this.act(() => (this.sagaOpen = !this.sagaOpen))}">${this.sagaOpen ? "Kısalt" : "Hikâyenin devamı…"}</button>`;
    return `<div class="saga-box ${this.sagaOpen ? "open" : ""}"><img src="${assetUrl(ch.scene.img)}" alt=""><div><h3>Destan · ${ch.title}</h3><p class="st">${why ? ch.goal : ch.scene.text(g)}</p>${ch.stage ? `<p class="dim">${ch.stage.siege ? "🏰" : "⚔"} ${tr("Sahne")}: ${ch.stage.title}</p>` : ""}${more}${btns}</div></div>`;
  }

  private beylikTabs(): string {
    const g = this.g;
    const s = g.s;
    if (this.tab === "bina") {
      const cur = g.building();
      return this.realmHtml() + `<h3>${ic("fortress")} ${t("Binalar")}</h3><p class="dim">Aynı anda tek bina geliştirilebilir. Diğer binalar Saray seviyesini geçemez.</p>` + BUILDINGS.map((b) => {
        const st = s.buildings[b.id];
        const next = st.lv + 1;
        const why = g.upgradeReason(b.id);
        const prod = b.produces ? `<small>${ic(RES_ICON[b.produces])} ${prodPerMin(b, st.lv)}/dk → ${prodPerMin(b, next)}/dk</small>` : `<small>${b.desc}</small>`;
        const whyHtml = why && !st.until && why !== "Bir inşaat sürüyor" ? `<small class="why">${why}</small>` : "";
        const right = st.until
          ? `<div class="timer">${bar(buildTime(next) * 1000 - (st.until - g.now), buildTime(next) * 1000, "", dur(st.until - g.now))}</div>`
          : `<div class="bcost">${costHtml(buildCost(b, next), g)}<small>⏱ ${dur(buildTime(next) * 1000)}</small></div><button class="btn ${why ? "off" : ""}" data-a="${this.act(() => g.upgrade(b.id))}">${st.lv === 0 ? "İnşa et" : "Geliştir"}</button>`;
        return `<div class="brow ${cur === b.id ? "busy" : ""}">${ic(b.icon, "bimg")}<div class="bi2"><b>${b.name} <em>Sv ${st.lv}</em></b>${prod}${whyHtml}</div>${right}</div>`;
      }).join("");
    }
    if (this.tab === "kisla") {
      const kl = g.bld("kisla");
      return `<div class="stats"><div>${ic("soldier")}Garnizon: <b>${armySize(s.garrison)}</b></div><div>Kuyruk: <b>${s.queue.length}/3</b></div></div>` + UNIT_KEYS.map((u) => {
        const ok = unitUnlocked(u, kl);
        const d = UNITS[u];
        const btn = (n: number) => `<button class="btn ${!ok || s.queue.length >= 3 || !g.canAfford(g.trainCost(u, n)) ? "off" : ""}" data-a="${this.act(() => g.train(u, n) && this.toast(`${n} ${d.name} eğitime başladı`, "info"))}">+${n}</button>`;
        const uname = g.unitName(u);
        return `<div class="brow">${ic(d.icon, "bimg")}<div class="bi2"><b>${uname}</b><small>Can ${d.hp} · Saldırı ${d.atk} · ${UNITS[d.beats].name} karşısında güçlü${uname !== d.name ? ` · taban: ${d.name}` : ""}</small><div class="bcost">${costHtml(g.trainCost(u, 1), g)}<small>/asker</small></div></div>${ok ? `<div class="col2">${btn(5)}${btn(10)}${btn(25)}</div>` : `<div class="lockd">${ic("lock")}Kışla Sv ${u === "archer" ? 1 : 2}</div>`}</div>`;
      }).join("") + s.queue.map((o, i) => `<div class="qrow">${ic(UNITS[o.unit].icon)} ${o.n} ${g.unitName(o.unit)}<span>${i === 0 ? dur(o.done - g.now) : "sırada"}</span></div>`).join("");
    }
    if (this.tab === "ordu") {
      const at = g.atCapital();
      const room = g.heroCap() - armySize(s.hero.army);
      return `<p class="dim">${at ? "Askerleri garnizon ile birliğin arasında aktar." : "Asker aktarmak için başkentte olmalısın."}</p>
        <div class="stats"><div>${ic("tug")}Birlik: <b>${armySize(s.hero.army)}/${g.heroCap()}</b></div><div>${ic("food")}Garnizon gideri: <b>${g.upkeepPerMin().toFixed(0)}/dk</b></div></div>` + UNIT_KEYS.map((u) => `
        <div class="brow">${ic(UNITS[u].icon, "bimg")}<div class="bi2"><b>${g.unitName(u)}</b><small>Garnizon ${s.garrison[u]} · Birlik ${s.hero.army[u]} · talim Sv ${g.drillLv(u)}</small></div>
        <div class="col2"><button class="btn ${!at || s.hero.army[u] <= 0 ? "off" : ""}" data-a="${this.act(() => g.transfer(u, -10))}">◀ 10</button><button class="btn ${!at || s.garrison[u] <= 0 || room <= 0 ? "off" : ""}" data-a="${this.act(() => g.transfer(u, 10))}">10 ▶</button></div></div>`).join("") +
        `<p class="dim">${t("Talim meydanında birlikleri terfi ettirerek Ağır Piyade, Atlı Okçu, Katafrakt gibi seçenekler açılır.")}</p>`;
    }
    return `<div class="stats"><div>${ic("j_caravan")}Sefer hakkı: <b>${s.marches.length}/${g.marchSlots()}</b></div></div><p class="dim">Haritadaki bir kaynak noktasına dokunarak toplama seferi gönder.</p>` +
      (s.marches.map((m) => {
        const n = s.nodes[m.node];
        const st = m.phase === "go" ? "Yolda" : m.phase === "gather" ? `Topluyor · ${dur(m.until - g.now)}` : `Dönüyor · ${fmt(m.load)} yük`;
        return `<div class="qrow">${ic(RES_ICON[n.kind])} ${NODE_NAME[n.kind]} · ${armySize(m.army)} asker<span>${st}</span></div>`;
      }).join("") || `<p>Şu an sefer yok.</p>`);
  }

  private directorHtml(): string {
    const g = this.g;
    const d = g.dir();
    const p = PERSONAS[d.p];
    const cards = PERSONA_KEYS.map((k) => {
      const x = PERSONAS[k];
      return `<div class="persona ${k === d.p ? "on" : ""}" data-a="${this.act(() => g.setPersona(k))}">${ic(x.icon)}<b>${t(x.name)}</b><small>${t(x.desc)}</small></div>`;
    }).join("");
    const log = d.log.slice(0, 4).map((l) => `<li class="${l.bad ? "dear" : "cheap"}">${l.d}. gün · ${l.t}</li>`).join("");
    return `<h3>${ic(p.icon)} ${t("Hikâye Anlatıcısı")}</h3>
      <p class="dim">${t("Anlatıcı destanının temposunu belirler: işler fazla yolunda giderse bela gönderir, zor anında yardım eli uzatabilir.")}</p>
      <div class="personas">${cards}</div>
      ${bar(d.t, p.limit, "en", `${t("Gerilim")} ${d.t.toFixed(1)}/${p.limit}`)}
      ${log ? `<ul class="runs">${log}</ul>` : ""}`;
  }

  private settingsHtml(): string {
    const g = this.g;
    const cur = curSlot();
    const pct = (v: number) => Math.round(v * 100);
    const toggle = (k: "eco" | "mini" | "haptic" | "narrate" | "dynMusic" | "cine" | "world3d" | "duel" | "tips" | "spoils" | "quick" | "pages" | "fires" | "cb" | "story" | "bigUi" | "calm" | "hiContrast", label: string, note = "", reload = false) =>
      `<div class="setrow"><span>${label}</span><button class="btn sm ${settings[k] ? "on" : ""}" data-a="${this.act(() => {
        settings[k] = !settings[k];
        saveSettings();
        applyUi();
        if (reload) {
          this.toast(t("Sayfa yenileniyor…"), "good");
          setTimeout(() => location.reload(), 280);
          return;
        }
        if (note) this.toast(note, "good");
      })}">${settings[k] ? t("Açık") : t("Kapalı")}</button></div>`;
    const slots = Array.from({ length: SAVE_SLOTS }, (_, i) => {
      const inf = slotInfo(i);
      const cl = inf?.cls ? CLASSES.find((c) => c.id === inf.cls) : null;
      const when = inf?.at ? new Date(inf.at).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
      const btn = i === cur
        ? `<em class="cheap">${t("Aktif")}</em>`
        : g.s.iron
          ? `<em class="dim">${ic("lock")}</em>`
          : `<button class="btn sm ${inf ? "go" : ""}" data-a="${this.act(() => g.switchSlot(i))}">${inf ? t("Yükle") : t("Yeni oyun")}</button>`;
      return `<div class="sslot ${i === cur ? "cur" : ""}">${ic("scroll")}<div><b>${t("Yuva")} ${i + 1}${inf ? ` · ${inf.name}` : ""}</b><small>${inf ? `${cl?.name ?? "Köle"} · Sv ${inf.lv} · ${ic("crown")}${inf.renown} · ${ic("coins")}${fmt(inf.gold)}${inf.owned ? ` · ${inf.owned} şehir` : ""}${when ? ` · ${when}` : ""}` : t("Boş yuva")}</small></div>${btn}</div>`;
    }).join("");
    return `${this.directorHtml()}<h3>${lang() === "tr" ? "Dil · Language" : "Language · Dil"}</h3>
      <div class="setrow">${(Object.keys(LANGS) as Lang[]).map((l) => `<button class="btn sm ${lang() === l ? "on" : ""}" data-a="${this.act(() => {
        if (lang() === l) return;
        settings.lang = l;
        saveSettings();
        g.saveNow();
        location.reload();
      })}">${LANGS[l]}</button>`).join("")}</div>
      <p class="dim">${t("Dil değişikliği sayfa yenilenince tamamlanır.")}</p>
      <h3>${t("Ses")}</h3>
      <div class="setrow"><span>${t("Müzik")}</span><input type="range" min="0" max="100" value="${pct(settings.music)}" data-set="music"><b data-so="music">${pct(settings.music)}</b></div>
      <div class="setrow"><span>${t("Efektler")}</span><input type="range" min="0" max="100" value="${pct(settings.fx)}" data-set="fx"><b data-so="fx">${pct(settings.fx)}</b></div>
      ${toggle("dynMusic", t("Dinamik müzik"))}
      <p class="dim">${t("Müzik savaşta kösle hızlanır, şehirde def ve zille çarşıya döner, harami yaklaşınca tedirgin bir nabız atar, Kıpçak bozkırında hömeye kayar.")}</p>
      ${canNarrate() ? `${toggle("narrate", t("Anlatıcı"))}<p class="dim">${t("Hikâye ekranları açılınca anlatıcı sesli okur; her ekrandaki düğmeyle tek tek de dinleyebilirsin.")}</p>` : `<div class="setrow"><span>${t("Anlatıcı")}</span><em class="dim">${t("Bu cihazda bu dil için ses yok")}</em></div>`}
      <h3>${t("Görüntü")}</h3>
      <div class="setrow"><span>${t("Arayüz boyutu")}</span>${[0.85, 1, 1.15, 1.3, 1.5, 1.7].map((v) => `<button class="btn sm ${settings.ui === v ? "on" : ""}" data-a="${this.act(() => {
        settings.ui = v;
        saveSettings();
        applyUi();
      })}">%${pct(v)}</button>`).join("")}</div>
      <div class="setrow"><span>${t("Tam ekran")}</span><button class="btn sm ${document.fullscreenElement ? "on" : ""}" data-a="${this.act(() => toggleFullscreen())}">${document.fullscreenElement ? t("Açık") : t("Kapalı")}</button><small class="dim">F11 / F</small></div>
      <div class="setrow"><span>${t("Fotoğraf modu")}</span><button class="btn sm" data-a="${this.act(() => this.openPhoto())}">${ic("scroll")} ${t("Aç")}</button><small class="dim">P</small></div>
      ${toggle("mini", t("Mini harita"))}
      ${toggle("story", t("Destan HUD (tek görev)"), t("Ekranda sadece ana görev kalır; mini harita ve notlar gizlenir."))}
      ${toggle("bigUi", t("Büyük dokunmatik düğmeler"))}
      ${toggle("calm", t("Sakin mod (az hareket)"))}
      <p class="dim">${t("Ekran sarsıntısı ve hızlı animasyonları kapatır.")}</p>
      ${toggle("hiContrast", t("Yüksek kontrast"))}
      <p class="dim">${t("Metin ve kenarlıkları keskinleştirir; düşük görüş ve güneşli ekran için.")}</p>
      <div class="a11y-prev"><b>${t("Önizleme")}</b><p>${t("Efendin sana bir söz verdi")}: <b>60 ${t("akçe")}</b> — ${t("Şehrin çevresindeki ormanda, taş ocağında ve tarlalarda çalış.")}</p></div>
      ${toggle("cb", t("Renk körü dostu renkler"))}
      ${toggle("cine", t("Sinematik sahneler"), "Şehre girişte ve uzun yolculuklarda ara sahne gösterilir.")}
      ${toggle("world3d", t("3D dünya"), "", true)}
      <p class="dim">${t("M&B tarzı 3D arazi, birlik ve .glb modelleri. Zayıf cihazda 2D’ye düşer. Aç/kapa sayfa yeniler. Görüntü Düşük olsa da 3D çalışır (Orta önerilir).")}</p>
      <div class="setrow"><span>${t("Görüntü kalitesi")}</span>${(["low", "mid", "high"] as const).map((g) => `<button class="btn sm ${settings.gfx === g ? "on" : ""}" data-a="${this.act(() => {
        if (settings.gfx === g) return;
        setGfx(g);
        this.toast(t("Sayfa yenileniyor…"), "good");
        setTimeout(() => location.reload(), 280);
      })}">${t(g === "low" ? "Düşük" : g === "mid" ? "Orta" : "Yüksek")}</button>`).join("")}</div>
      <p class="dim">${t("Düşük: gölge ve toz yok (eski pil tasarrufu). Orta: küçük gölge. Yüksek: kuş, toz, tam gölge. Değişiklik sayfa yeniler.")}</p>
      ${"vibrate" in navigator ? toggle("haptic", t("Titreşim")) : ""}
      <h3>${t("Oynanış")}</h3>
      <div class="setrow"><span>${t("Zorluk")}</span>${(Object.keys(DIFFS) as Diff[]).map((d) => `<button class="btn sm ${g.diff() === d ? "on" : ""} ${g.s.iron && d === "kolay" ? "off" : ""}" title="${t(DIFFS[d].desc)}" data-a="${this.act(() => !(g.s.iron && d === "kolay") && g.setDiff(d))}">${t(DIFFS[d].name)}</button>`).join("")}</div>
      <p class="dim">${t(DIFFS[g.diff()].desc)}</p>
      <div class="setrow"><span>${t("Demir mod")}</span>${g.s.iron ? `<em class="neg">${t("Açık · geri alınamaz")}</em>` : `<button class="btn sm red" data-a="${this.act(() => this.choice(t("Demir mod"), "icons/seal", t("Demir modda bu yuva başka yuvaya geçemez, dışarıdan kayıt yüklenemez ve Kolay zorluğa dönülemez. Her kararın kalıcıdır. Bu yemin geri alınamaz."), [{ label: t("Yemin ediyorum"), cls: "red", fn: () => g.setIron() }, { label: t("Vazgeç"), cls: "", fn: () => {} }]))}">${t("Yemin et")}</button>`}</div>
      ${toggle("duel", t("Er meydanı"))}
      <p class="dim">${t("Büyük savaşlardan önce teke tek düello mini oyunu. Kazanırsan düşman morali düşük başlar.")}</p>
      ${toggle("tips", t("İpuçları"))}
      ${toggle("quick", t("Hızlı savaş"))}
      <p class="dim">${t("Açıkken kazanacağın savaşlar otomatik çözülür. Kapalıyken küçük çeteler hariç taktik seçersin (kolay savaşta tek dokunuşla geçebilirsin).")}</p>
      ${toggle("spoils", t("Ganimet seçimi"))}
      <p class="dim">${t("Büyük zaferlerden sonra üç ganimetten birini sen seçersin. Kapalıysa altın otomatik alınır.")}</p>
      ${toggle("pages", t("Sayfalı hikâye"))}
      ${toggle("fires", t("Kamp ateşi sohbetleri"))}
      <h3>${t("Kayıt yuvaları")}</h3>
      <p class="dim">${t("Oyun her birkaç saniyede bir etkin yuvaya kaydedilir. Yuva değiştirince mevcut oyunun kaydedilir ve sayfa yeniden yüklenir.")}</p>
      ${slots}
      <div class="setrow"><button class="btn sm" data-a="${this.act(() => this.exportFile())}">${ic("scroll")} ${t("Dışa aktar")}</button>${g.s.iron ? "" : `<button class="btn sm" data-a="${this.act(() => this.importFile())}">${ic("chest")} ${t("İçe aktar")}</button>`}</div>${g.s.iron ? `<p class="dim">${t("Demir mod: yuva değiştirme ve içe aktarma kapalı.")}</p>` : ""}
      ${this.steamHtml()}
      ${this.modsHtml()}
      <h3>${t("Klavye kısayolları")}</h3>
      <p class="dim keys">${t("<kbd>H</kbd> Kahraman · <kbd>U</kbd> Ufuk · <kbd>O</kbd> Birlik · <kbd>C</kbd> Semerkant · <kbd>Boşluk</kbd> Birliğine dön · <kbd>B</kbd> Kuşu uçur · <kbd>M</kbd> Ses · <kbd>F</kbd> Tam ekran · <kbd>WASD</kbd>/<kbd>Oklar</kbd> Kamera · kenar pan · <kbd>+</kbd>/<kbd>−</kbd> Yakınlaş · mini tekerlek · <kbd>T</kbd> Oyun hızı · <kbd>P</kbd> Fotoğraf · <kbd>Esc</kbd> Kapat / Menü")}</p>
      <h3>${t("Oyun kolu")}</h3>
      <p class="dim keys">${t("<kbd>Sol çubuk</kbd> Kamera / seçim · <kbd>A</kbd> Nişangâha git, seç · <kbd>B</kbd> Kapat · <kbd>Y</kbd> Birliğine dön · <kbd>X</kbd> Kuşu uçur · <kbd>LB</kbd>/<kbd>RB</kbd> Yakınlaş, sekme · <kbd>LT</kbd>/<kbd>RT</kbd> Yakınlaş · <kbd>Start</kbd> Kahraman · <kbd>Back</kbd> Menü")}</p>
      ${this.achHtml()}
      ${this.legacyHtml()}
      <button class="btn sm red reset" data-a="${this.act(() => confirm("Bu yuvadaki tüm ilerlemen silinip yeni bir oyun başlayacak. Emin misin?") && g.resetGame())}">${t("Bu yuvada yeni oyun başlat")}</button>`;
  }

  private steamHtml(): string {
    if (!steam) return onDeck ? `<h3>Steam Deck</h3><p class="dim">${t("Steam Deck algılandı: arayüz büyütüldü, oyun kolu kısayolları etkin.")}</p>` : "";
    const cloud = cloudReady();
    return `<h3>${ic("seal")} Steam${onDeck ? " Deck" : ""}</h3>
      <div class="setrow"><span>${t("Hesap")}</span><b>${steam.name() || "—"}</b></div>
      <div class="setrow"><span>${t("Bulut kaydı")}</span><em class="${cloud ? "good" : "dim"}">${cloud ? t("Açık") : t("Kapalı (Steam ayarı)")}</em>${cloud ? `<button class="btn sm" data-a="${this.act(() => {
        this.g.saveNow();
        const ok = cloudPush(true);
        this.toast(ok ? t("Kayıtlar Steam Bulut'a yüklendi.") : t("Steam Bulut'a yüklenemedi."), ok ? "good" : "bad");
      })}">${t("Şimdi yedekle")}</button>` : ""}</div>
      <p class="dim">${t("Başarımlar, kayıt yuvaları ve efsane ocağı Steam Bulut ile cihazlar arasında taşınır; açılışta en yeni kayıt seçilir.")}</p>`;
  }

  bitigOpen = "";

  private bitigHtml(): string {
    const got = new Set(this.g.s.bitig ?? []);
    const cats = (Object.keys(CODEX_CATS) as CodexCat[]).map((c) => {
      const list = CODEX.filter((e) => e.cat === c);
      const rows = list.map((e) => {
        if (!got.has(e.id)) return `<div class="cxrow lock">${ic("lock", "gimg")}<div class="bi2"><b>? ? ?</b><small class="dim">${t("İpucu")}: ${e.hint}</small></div></div>`;
        const open = this.bitigOpen === e.id;
        return `<div class="cxrow ${open ? "open" : ""}" data-a="${this.act(() => (this.bitigOpen = open ? "" : e.id))}">${ic(e.icon, "gimg")}<div class="bi2"><b>${codexTitle(e)}</b>${open ? `<p>${codexText(e)}</p>` : `<small class="dim">${codexText(e).slice(0, 70)}…</small>`}</div></div>`;
      }).join("");
      const n = list.filter((e) => got.has(e.id)).length;
      const cat = CODEX_CATS[c];
      return `<h3>${ic(cat.icon)} ${lang() === "en" ? cat.en : cat.name} <em class="dim">${n}/${list.length}</em></h3>${rows}`;
    }).join("");
    const map = assetUrl("cine/silk_road_map");
    const atlas = map
      ? `<div class="silkmap"><img src="${map}" alt="${t("İpek Yolu")}"><div><b>${t("İpek Yolu")}</b><small class="dim">${t("Konstantinopolis'ten Kaşgar'a · Semerkant yıldızı")}</small></div></div>`
      : "";
    return `${atlas}<p class="dim">${t("Bitig, yolculuğunda öğrendiklerini kaydeder. Yeni yerler gördükçe, yeni işler yaptıkça sayfalar dolar.")} <b>${got.size}/${CODEX.length}</b></p>${cats}`;
  }

  private achHtml(): string {
    const g = this.g;
    const n = ACHIEVEMENTS.filter((a) => g.achDone(a.id)).length;
    return `<h3>${ic("trophy")} ${t("Başarımlar")} <em class="dim">${n}/${ACHIEVEMENTS.length}</em></h3><div class="achs">${ACHIEVEMENTS.map((a) => `<div class="ach ${g.achDone(a.id) ? "on" : ""}" title="${t(a.desc)}">${ic(a.icon)}<b>${t(a.name)}</b><small>${t(a.desc)}</small></div>`).join("")}</div>`;
  }

  private otagHtml(): string {
    const g = this.g;
    const o = g.s.otag;
    const why = g.otagReason();
    const here = zoneOf(g.s.hero.y, H);
    const status = o ? `<div class="stats"><div>${ic("map/yurts")}${ZONE_NAME[zoneOf(o.y, H)]}</div><div>${ic("foal")}Sürü <b>${o.herd}</b></div><div>${ic("food")}+${g.otagYield().food}/gün</div></div>` : `<p class="dim">Göçebe bir otağ kur: sürün otlakta büyür, yiyecek ve atlı gönüllü verir. Yazın kuzeydeki yaylaklara, kışın güneydeki kışlaklara göç et.</p>`;
    return `<h3>${ic("map/yurts")} Otağ</h3>${status}
      <button class="btn ${why ? "off" : "go"}" title="${why}" data-a="${this.act(() => g.pitchOtag())}">${o ? `Otağı buraya göçür (${ZONE_NAME[here]} · ${MOVE_FOOD} yiyecek)` : `Otağı buraya kur (${OTAG_GOLD} altın, ${OTAG_WOOD} kereste)`}</button>${why ? `<small class="why">${why}</small>` : ""}
      ${o ? `<button class="btn sm" data-a="${this.act(() => { this.close(); g.cam.flyTo(o.x, o.y, 0.8); })}">Otağı göster</button>` : ""}`;
  }

  private divanHtml(): string {
    const g = this.g, en = lang() === "en";
    const btn = (why: string, label: string, fn: () => void, cls = "") => `<button class="btn sm ${cls} ${why ? "off" : ""}" title="${why}" data-a="${this.act(fn)}">${label}</button>`;
    const cards = FACTION_KEYS.map((f) => {
      const fac = FACTIONS[f], d = g.dip(f);
      const tags = [
        g.pact(f, "peace") ? `<span class="good">${t("Saldırmazlık")} ${g.pact(f, "peace")}${t("g")}</span>` : "",
        g.pact(f, "trade") ? `<span class="cheap">${t("Ticaret")} ${g.pact(f, "trade")}${t("g")}</span>` : "",
        g.pact(f, "intel") ? `<span class="cheap">${t("İstihbarat")} ${g.pact(f, "intel")}${t("g")}</span>` : "",
      ].filter(Boolean).join(" · ");
      const spy = d.spy ?? 0;
      return `<div class="dipc" style="--fc:${fac.color}">
        <div class="mycvh">${ic(fac.icon, "gimg")}<div class="bi2"><b>${fac.name} <em>${fac.ruler}</em></b><small>${t("İtibar")} <b>${Math.round(g.rep(f))}</b> · ${t("Casus ağı")} ${"●".repeat(spy)}<i class="dim">${"●".repeat(SPY_MAX - spy)}</i></small>${tags ? `<small>${tags}</small>` : ""}</div></div>
        <div class="row">
          ${btn(g.dipReason(f, "gift"), `${t("Armağan")} · ${GIFT_GOLD}`, () => g.sendGift(f))}
          ${btn(g.dipReason(f, "peace"), `${t("Saldırmazlık")} · ${PEACE_GOLD}`, () => g.signPact(f, "peace"))}
          ${btn(g.dipReason(f, "trade"), `${t("Ticaret anlaşması")} · ${TRADE_GOLD}`, () => g.signPact(f, "trade"))}
          ${btn(g.dipReason(f, "spy"), `${t("Casus")} +1 · ${spyCost(spy)}`, () => g.hireSpy(f))}
          ${g.s.fealty?.f === f
            ? btn("", `${ic("seal")} ${t("Biatı boz")} · −220 ${t("itibar")}`, () => this.choice(t("Biatı boz"), `icons/${fac.icon}`, t("Andı bozarsan itibarın düşer ve kutun söner. Emin misin?"), [{ label: t("Andı boz"), cls: "red", fn: () => g.breakFealty() }, { label: t("Vazgeç"), cls: "", fn: () => {} }]), "red")
            : btn(g.fealtyReason(f), `${ic("seal")} ${t("Biat et")} · ${t("İtibar")} ${FEALTY_REP}+`, () => g.swearFealty(f))}
        </div>
        ${g.s.fealty?.f === f ? `<small class="cheap">${t("Biatlısın: ordu +%4, bu devletin şehirlerinde paralı asker %15 ucuz, haftalık sipahi. Günlük haraç {g} altın · şimdiye dek {p}.", { g: FEALTY_FEE(g.s.hero.lv), p: g.s.fealty.paid })}</small>` : ""}
        ${spy ? `<div class="row">${SPY_OPS.map((o) => btn(g.spyReason(f, o.id), en ? o.en[0] : o.name, () => g.spyOp(f, o.id), "go")).join("")}</div>` : ""}
      </div>`;
    }).join("");
    return `${this.politicsBoardHtml()}
      <h3>${ic("scroll")} ${t("Divan")}</h3><p class="dim">${t("Elçilerin hükümdarlara armağan götürür, antlaşmalar imzalar. Saldırmazlık antı o devletin karşı saldırılarını durdurur; bozarsan kutun söner. Ticaret antı pazarlarında fiyatları iyileştirir. Casusların haber toplar, ambar yakar, hazine soyar ama yakalanabilirler.")}</p>
      <div class="dipops">${SPY_OPS.map((o) => `<small><b>${en ? o.en[0] : o.name}</b> (${t("ağ")} ${o.lv}+): ${en ? o.en[1] : o.desc}</small>`).join("")}</div>${cards}`;
  }

  private artisanHtml(city: string, near: boolean): string {
    const g = this.g;
    const a = CRAFTSMAN_BY_CITY[city];
    if (!a) return "";
    const why = g.artisanReason(city);
    const ready = !why;
    const cd = (g.s.artisan?.[city] ?? -ARTISAN_COOLDOWN_DAYS) + ARTISAN_COOLDOWN_DAYS - g.dayOf().day;
    const perk = a.kind === "rar" ? t("Bir sonraki {s} dökümüne nadirlik bahşeder", { s: SLOT_NAME[a.slot] }) : t("Bir sonraki {s} dökümünü yarı fiyatına yapar", { s: SLOT_NAME[a.slot] });
    return `<div class="grow artisan">${ic(a.icon, "gimg")}<div class="bi2"><b>${a.name} <em>${t(a.role)}</em></b><small>${a.desc}</small><small class="${ready ? "cheap" : "dim"}">${ready ? perk : why === t("Önce hürriyetini kazan") || why === t("Ustaya ulaşmak için şehre git") ? why : `${t("Soğuma")}: ${Math.max(0, cd)} ${t("gün")}`}</small></div><button class="btn sm go ${!near || why ? "off" : ""}" data-a="${this.act(() => g.artisanVisit(city))}">${t("Ziyaret et")}</button></div>`;
  }

  /** Kervan Tahtası: yoldaki kendi kervanların ve toplama seferlerinin özeti. */
  private logisticsHtml(): string {
    const g = this.g;
    const board = g.logisticsBoard();
    const cvRows = board.caravans
      .map((c) => `<div class="qrow">${ic("j_caravan")} <b>${c.name}</b>: ${CITY_NAME[c.from]} → ${CITY_NAME[c.to]} · ${c.cargoText}<span>${c.daysLeft > 0 ? `~${c.daysLeft.toFixed(1)} ${t("gün")}` : t("vardı")}</span></div>`)
      .join("");
    const mRows = board.marches
      .map((m) => `<div class="qrow">${ic(RES_ICON[m.nodeKind])} ${NODE_NAME[m.nodeKind]} · ${m.army} ${t("asker")}<span>${m.phase === "go" ? t("yolda") : m.phase === "gather" ? `${t("topluyor")} · ${dur(m.msLeft)}` : t("dönüyor")}</span></div>`)
      .join("");
    const empty = !board.caravans.length && !board.marches.length;
    return `<h3>${ic("j_caravan")} ${t("Kervan Tahtası")}</h3>` +
      (empty
        ? `<p class="dim">${t("Şu an yolda kervanın ya da seferin yok. Bir şehirde kendi kervanını kur ya da haritada bir kaynak noktasına dokunup toplama seferi gönder.")}</p>`
        : `${cvRows || `<p class="dim">${t("Yolda kervanın yok.")}</p>`}${mRows || `<p class="dim">${t("Yolda seferin yok.")}</p>`}`);
  }

  /** Kamp ateşi / usta / şölen-yuğ — görünür dünya buff şeridi. */
  private worldBuffsHtml(): string {
    const g = this.g;
    const s = g.s;
    const day = g.dayOf().day;
    const bits: string[] = [];
    const fb = s.fireBuff;
    if (fb && fb.until > day) {
      const left = fb.until - day;
      const name =
        fb.kind === "trade" ? t("Pazarlık")
        : fb.kind === "wage" ? t("Ücret −%12")
        : fb.kind === "mercy" ? t("Merhamet")
        : fb.kind === "fear" ? t("Korku şanı")
        : t("Liman kârı");
      bits.push(`${ic("map/yurts")} ${name} · ${left}${t("g")}`);
    }
    if (s.artisanBuff) {
      bits.push(`${ic("anvil")} ${t("Usta lütfu")} · ${SLOT_NAME[s.artisanBuff.slot]} (${s.artisanBuff.kind === "rar" ? t("nadir+") : t("indirim")})`);
    }
    for (const [k, n] of Object.entries(s.buffs)) {
      if (!n) continue;
      const nm = CONS_BY_ID[k]?.name ?? (k === "surek" ? t("Sürek") : k === "yug" ? t("Yuğ") : k === "ziyafet" ? t("Şölen") : k);
      bits.push(`${nm} ×${n}`);
    }
    if (!bits.length) return "";
    return `<div class="odds good route-tip sticky world-buffs"><b>${t("Etkin dünya")}</b><small>${bits.join(" · ")}</small></div>`;
  }

  private myCvHtml(): string {
    const g = this.g, s = g.s;
    const list = g.myCvs();
    const ci = g.nearCity();
    const here = ci >= 0 ? CITIES[ci].id : "";
    const why = here ? g.myCvReason(here) : t("Kervan kurmak için bir şehre git");
    const total = list.reduce((a, c) => a + c.profit, 0);
    const goodOpts = (sel: Good | null, from: string, to: string) => `<option value="">${t("— boş —")}</option>` + GOOD_KEYS.map((k) => {
      const m = g.cvMargin(from, to, k);
      return `<option value="${k}" ${k === sel ? "selected" : ""}>${GOODS[k].name} (${m >= 0 ? "+" : ""}${m})</option>`;
    }).join("");
    const cards = list.map((c) => {
      const days = g.myCvDays(c);
      const a = c.dir === 1 ? c.from : c.to, b = c.dir === 1 ? c.to : c.from;
      const gd = c.dir === 1 ? c.go : c.back;
      const prog = c.status === "bekle" ? t("Yük bekliyor") : `${CITY_NAME[a]} → ${CITY_NAME[b]} · ${c.cargo ? `${c.cargo} ${gd ? GOODS[gd].name : ""}` : t("boş")}`;
      return `<div class="mycv">
        <div class="mycvh">${ic("j_caravan", "gimg")}<div class="bi2"><b>${c.name} <em>${c.trips} ${t("sefer")} · ${c.profit >= 0 ? "+" : ""}${c.profit} ${t("altın")}</em></b><small>${t("Yük")} ${c.cap} · ${t("Muhafız")} ${c.guards}/${MYCV_GUARD_MAX} · ${days.toFixed(1)} ${t("gün")}${mycvRoute(c) > 0 ? ` · ${t("Yol bilgisi")} -%${Math.round(mycvRoute(c) * 100)}` : ""}</small></div></div>
        ${bar(c.t * 100, 100, "", prog)}
        <div class="mycvr"><label>${CITY_NAME[c.from]} →</label><select data-cv="${c.id}:to">${CITIES.filter((x) => x.id !== c.from).map((x) => `<option value="${x.id}" ${x.id === c.to ? "selected" : ""}>${CITY_NAME[x.id]}</option>`).join("")}</select></div>
        <div class="mycvr"><label>${t("Gidiş yükü")}</label><select data-cv="${c.id}:go">${goodOpts(c.go, c.from, c.to)}</select></div>
        <div class="mycvr"><label>${t("Dönüş yükü")}</label><select data-cv="${c.id}:back">${goodOpts(c.back, c.to, c.from)}</select></div>
        <div class="row">
          <button class="btn sm go" data-a="${this.act(() => g.applyGoldRoute(c.id))}">${ic("coins")} ${t("Altın rota")}</button>
          <button class="btn sm ${c.guards >= MYCV_GUARD_MAX || s.res.gold < MYCV_GUARD ? "off" : ""}" data-a="${this.act(() => g.guardMyCv(c.id))}">${t("Muhafız")} +1 · ${MYCV_GUARD}</button>
          <button class="btn sm ${c.ins || s.res.gold < MYCV_INSURE ? "off" : ""}" data-a="${this.act(() => g.insureMyCv(c.id))}">${c.ins ? t("Sigortalı") : `${t("Sigorta")} · ${MYCV_INSURE}`}</button>
          <button class="btn sm ${c.cap >= 48 || s.res.gold < MYCV_UPGRADE ? "off" : ""}" data-a="${this.act(() => g.upgradeMyCv(c.id))}">${t("Deve")} +10 · ${MYCV_UPGRADE}</button>
          <button class="btn sm bad" data-a="${this.act(() => g.sellMyCv(c.id))}">${t("Sat")}</button>
        </div>
        ${c.log.length ? `<ul class="cvlog">${c.log.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("");
    return `<h3>${ic("j_caravan")} ${t("Kervan Kumpanyası")} <small class="dim">${list.length}/${g.myCvMax()} · ${total >= 0 ? "+" : ""}${total} ${t("altın")}</small></h3>
      ${this.worldBuffsHtml()}
      <p class="dim">${t("Kendi kervanların iki şehir arasında kendiliğinden alıp satar. Fiyat farkı parantezde: gidişte bir malı ucuza alıp varışta pahalıya sat. Uzun ve korumasız yollar haramilere açıktır; muhafız tut. Her kervansaray bir kervan hakkı daha verir.")}</p>
      ${cards}
      <div class="grow">${ic("j_caravan", "gimg")}<div class="bi2"><b>${t("Yeni kervan")} <em>${MYCV_COST} ${t("altın")}</em></b><small class="${why ? "dim" : "cheap"}">${why || `${CITY_NAME[here]}: ${t("hazır")}`}</small></div><button class="btn sm go ${why ? "off" : ""}" data-a="${this.act(() => g.buyMyCaravan(here))}">${t("Kervan kur")}</button></div>`;
  }

  private yugHtml(): string {
    const g = this.g, s = g.s, en = lang() === "en";
    const un = g.unmourned();
    const foes = s.foes ?? [];
    const raised = foes.filter((f) => f.raised);
    if (!un.length && !foes.length && !(s.fallen ?? []).length) return `<h3>${ic("tug")} ${t("Yuğ ve Balbal")}</h3><p class="dim">${t("Savaşta düşen gaziler için yuğ töreni tutulur. Öldürdüğün can düşmanları, beyler ve efsanevi düşmanlar için kurganına balbal dikebilirsin.")}</p>`;
    const c = yugCost(un.length);
    const why = g.yugReason();
    const yug = un.length
      ? `<div class="grow">${ic("tug", "gimg")}<div class="bi2"><b>${t("Yuğ töreni")} <em>${un.length} ${t("gazi")}</em></b><small>${un.map((f) => `${f.name}${f.warned ? " ⚠" : ""}`).join(", ")}</small><small class="${why ? "dim" : "cheap"}">${why || `${c.food} ${t("yiyecek")} · ${c.gold} ${t("altın")} · ${t("3 savaş +%5 güç, kut")}`}</small></div><button class="btn sm go ${why ? "off" : ""}" data-a="${this.act(() => g.holdYug())}">${t("Yas tut")}</button></div>`
      : `<p class="dim">${t("Bütün gazilerin yası tutuldu.")} (${(s.fallen ?? []).length})</p>`;
    const stones = raised.length ? `<div class="balbals">${raised.map((f) => `<div class="balbal" title="${f.name}"><i></i><small>${f.name.split(" ").slice(-1)[0]}</small></div>`).join("")}</div>` : "";
    const rows = foes.map((f, i) => (f.raised ? "" : `<div class="grow sm">${ic(f.kind === "boss" ? "trophy" : f.kind === "rival" ? "lord_bey" : "j_bandit", "gimg")}<div class="bi2"><b>${f.name} <em>${FOE_KIND[f.kind][en ? 1 : 0]}</em></b><small class="dim">${g.balbalReason(f) || `${BALBAL_STONE} ${t("taş")} · ${BALBAL_GOLD} ${t("altın")}`}</small></div><button class="btn sm go ${g.balbalReason(f) ? "off" : ""}" data-a="${this.act(() => g.raiseBalbal(i))}">${t("Balbal dik")}</button></div>`)).join("");
    return `<h3>${ic("tug")} ${t("Yuğ ve Balbal")}</h3>${yug}
      <h3>${ic("stone")} ${t("Kurgan")} <small class="dim">${raised.length}/${BALBAL_MAX} · ${t("ordu")} +${(balbalBonus(foes) * 100).toFixed(1)}%</small></h3>${stones}${rows}`;
  }

  private kutHtml(): string {
    const s = this.g.s;
    const k = s.kut ?? 50;
    const tier = kutTier(k);
    const pct = (x: number): string => `${x >= 0 ? "+" : ""}${Math.round(x * 100)}%`;
    const left = Math.max(0, (s.tore?.next ?? 0) - this.g.dayOf().day);
    return `<h3>${ic("crown")} ${t("Kut ve Töre")} <em class="${k >= 45 ? "cheap" : "dear"}">${tier.name}</em></h3>
      ${bar(k, 100, "kut", `Kut ${Math.round(k)}/100`)}
      <p class="dim">${tier.desc}</p>
      <div class="stats"><div>${ic("tug")}Ordu <b>${pct(kutArmy(k))}</b></div><div>${ic("lord_bey")}Kurultay oyu <b>${pct(kutVote(k))}</b></div><div>${ic("scroll")}Davalar <b>${s.c.tore ?? 0}</b></div></div>
      <small class="dim">Kut; zaferle, adil hükümle, şölen ve fetihle artar. Yenilgi, soygun, ağır vergi ve kaybedilen şehirle söner. ${left ? `Sıradaki töre davası ~${left} gün sonra.` : "Yakında bir töre davası gelecek."} Kademeler: ${KUT_TIERS.map((x) => x.name).join(" · ")}</small>`;
  }

  archery: Archery | null = null;

  openArchery(mode: ArchMode = "kabak"): void {
    const g = this.g;
    if (this.archery || this.minigame || this.modal() || g.battleLock) return;
    if (mode === "surek" && !g.surekStart()) return;
    this.close();
    g.battleLock = true;
    const el = document.createElement("div");
    el.className = "archery";
    const hint = mode === "surek" ? t("Hedefe dokun ya da <kbd>Boşluk</kbd> · geyik 25 · domuz 30 · kurt 20 · kaplan 120 (3 ok) · 40 saniye") : t("Hedefe dokun ya da <kbd>Boşluk</kbd> · kabak 10 · kurt 20 · kartal 35 · art arda isabet çarpan verir");
    el.innerHTML = `<canvas></canvas><div class="ahud"></div><div class="ahint">${hint}</div><button class="btn sm aclose">${t("Bırak")}</button><div class="aresult"></div>`;
    this.root.appendChild(el);
    const hudEl = el.querySelector(".ahud") as HTMLElement;
    const res = el.querySelector(".aresult") as HTMLElement;
    let tick = 0;
    const key = (e: KeyboardEvent): void => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        this.archery?.shootAuto();
      } else if (e.code === "Escape") {
        e.stopImmediatePropagation();
        finish();
      }
    };
    const finish = (): void => {
      clearInterval(tick);
      window.removeEventListener("keydown", key, true);
      this.archery?.stop();
      this.archery = null;
      el.remove();
      g.battleLock = false;
    };
    const game: Archery = new Archery(el.querySelector("canvas")!, (score, hits) => {
      audio.play(score >= 150 ? "level" : "quest");
      if (mode === "surek") {
        const note = g.surekReward(score, game.kills);
        const k = game.kills;
        res.innerHTML = `<div class="bbox"><h2>${t("Sürek avı bitti")}</h2><p><b>${score}</b> ${t("puan")} · ${t("geyik")} ${k.geyik ?? 0} · ${t("domuz")} ${k.domuz ?? 0} · ${t("kurt")} ${k.kurt ?? 0} · ${t("kaplan")} ${k.kaplan ?? 0}</p><p>${note}</p><div class="row"><button class="btn go quit">${t("Kapat")}</button></div></div>`;
      } else {
        const note = g.archeryReward(score, hits);
        res.innerHTML = `<div class="bbox"><h2>${t("Kabak Atma bitti")}</h2><p><b>${score}</b> ${t("puan")} · ${hits} ${t("isabet")}<br>${t("En iyi")}: <b>${g.s.ok.best}</b></p><p>${note}</p><div class="row"><button class="btn go again">${t("Tekrar")}</button><button class="btn quit">${t("Kapat")}</button></div></div>`;
      }
      res.classList.add("on");
      res.querySelector(".again")?.addEventListener("click", () => { finish(); this.openArchery(); });
      res.querySelector(".quit")!.addEventListener("click", finish);
    }, mode);
    this.archery = game;
    tick = window.setInterval(() => {
      const h = game.hud();
      hudEl.innerHTML = `<span>${ic("u_archer")} ${h.arrows}</span><span>⏱ ${h.time.toFixed(1)}</span><span>${ic("trophy")} ${h.score}</span>${h.combo >= 3 ? `<span class="cheap">Kombo ×${1 + Math.min(4, Math.floor(h.combo / 3)) * 0.5}</span>` : ""}`;
    }, 100);
    window.addEventListener("keydown", key, true);
    el.querySelector(".aclose")!.addEventListener("click", finish);
  }

  minigame: { press(): void; stop(): void; move?(d: number): void } | null = null;

  openMini(kind: "wr" | "kb"): void {
    const g = this.g;
    if (this.archery || this.minigame || this.modal() || g.battleLock) return;
    this.close();
    g.battleLock = true;
    const el = document.createElement("div");
    el.className = `archery mini-${kind}`;
    const foe = g.wrestleFoe();
    const hint = kind === "wr"
      ? t("İbre yeşildeyken dokun ya da <kbd>Boşluk</kbd> · kırmızı ! çıkınca hemen karşı koy · rakibi sırtüstü yere ser")
      : t("Üst/alt yarıya dokun ya da <kbd>↑</kbd>/<kbd>↓</kbd> · <kbd>Boşluk</kbd> en güvenli kulvara kaçar · oğlağı kazana ulaştır");
    el.innerHTML = `<canvas></canvas><div class="ahud"></div><div class="ahint">${hint}</div><button class="btn sm aclose">${t("Bırak")}</button><div class="aresult"></div>`;
    this.root.appendChild(el);
    const hudEl = el.querySelector(".ahud") as HTMLElement;
    const res = el.querySelector(".aresult") as HTMLElement;
    let tick = 0;
    const key = (e: KeyboardEvent): void => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        this.minigame?.press();
      } else if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        e.stopPropagation();
        this.minigame?.move?.(-1);
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        e.stopPropagation();
        this.minigame?.move?.(1);
      } else if (e.code === "Escape") {
        e.stopImmediatePropagation();
        finish();
      }
    };
    const finish = (): void => {
      clearInterval(tick);
      window.removeEventListener("keydown", key, true);
      this.minigame?.stop();
      this.minigame = null;
      el.remove();
      g.battleLock = false;
    };
    const result = (title: string, body: string, note: string, again: boolean): void => {
      res.innerHTML = `<div class="bbox"><h2>${title}</h2><p>${body}</p><p>${note}</p><div class="row">${again ? `<button class="btn go again">${t("Devam")}</button>` : ""}<button class="btn quit">${t("Kapat")}</button></div></div>`;
      res.classList.add("on");
      res.querySelector(".again")?.addEventListener("click", () => { finish(); this.openMini(kind); });
      res.querySelector(".quit")!.addEventListener("click", finish);
    };
    const cv = el.querySelector("canvas")!;
    if (kind === "wr") {
      const open = g.wrestleOpen();
      const w = new Wrestle(cv, foe, g.stat("guc") + g.stat("day") * 0.5, (win, bal, perfect) => {
        const note = g.wrestleReward(win, perfect);
        audio.play(win ? "level" : "quest");
        const more = win && open && foe.round < 2;
        result(win ? t("Zafer!") : t("Yenildin"), `${foe.name} · ${bal > 0 ? "+" : ""}${bal} · ${t("kusursuz")} ${perfect}`, note, more);
      });
      this.minigame = w;
      tick = window.setInterval(() => {
        const h = w.hud();
        hudEl.innerHTML = `<span>${ic("trophy")} ${foe.round + 1}/3 · ${foe.name}</span><span>⏱ ${h.time.toFixed(1)}</span><span>${t("Denge")} ${h.bal > 0 ? "+" : ""}${h.bal}</span>`;
      }, 100);
    } else {
      const k = new KokBoru(cv, g.stat("cev") + g.skill("silah") * 0.5, (goals) => {
        const note = g.kokboruReward(goals);
        audio.play(goals >= 3 ? "level" : "quest");
        result(t("Kökbörü bitti"), `<b>${goals}</b> ${t("gol")} · ${t("En iyi")}: <b>${g.s.games?.kbBest ?? 0}</b>`, note, true);
      });
      this.minigame = { press: () => k.dodge(), stop: () => k.stop(), move: (d) => k.move(d) };
      tick = window.setInterval(() => {
        const h = k.hud();
        hudEl.innerHTML = `<span>${ic("trophy")} ${h.goals}</span><span>⏱ ${h.time.toFixed(1)}</span><span>${Math.round(h.progress * 100)}%</span>`;
      }, 100);
    }
    window.addEventListener("keydown", key, true);
    el.querySelector(".aclose")!.addEventListener("click", finish);
  }

  private gamesHtml(): string {
    const g = this.g;
    const paid = g.archeryPaid();
    const toy = g.toyDay();
    const foe = g.wrestleFoe();
    const wo = g.wrestleOpen(), ko = g.kokboruOpen();
    const st = (ok: boolean) => `<small class="${ok ? "cheap" : "dim"}">${ok ? t("Bugünün ödülü hazır") : t("Bugün ödül alındı · antrenman")}`;
    return `<h3>${ic("u_archer")} ${t("Bozkır Oyunları")}</h3>
      ${toy ? `<div class="odds good">${ic("tug")} <b>${t("Toy günü!")}</b> ${t("Bugün bütün oyunların ödülü iki katı.")}</div>` : `<p class="dim">${t("Her 7 günde bir Toy kurulur; o gün ödüller iki katıdır.")}</p>`}
      <div class="grow">${ic("u_cavalry", "gimg")}<div class="bi2"><b>${t("Kabak Atma")} <em>${t("atlı okçuluk")}</em></b><small>${t("Dörtnala giderken kabakları, kurtları ve kartalları vur. 30 saniye, 20 ok.")}</small>${st(paid)} · ${t("Rekor")}: ${g.s.ok?.best ?? 0}</small></div><button class="btn sm go" data-a="${this.act(() => this.openArchery())}">${t("Oyna")}</button></div>
      <div class="grow">${ic("tr_wolf", "gimg")}<div class="bi2"><b>${t("Sürek Avı")} <em>${t("ordu talimi")}</em></b><small>${t("Askerlerinle ormanı çevirip geyik, domuz, kurt ve kaplan avla. Yiyecek ve deri getirir; iyi bir av orduyu 3 savaş boyunca güçlendirir.")}</small><small class="${g.surekReason() ? "dim" : "cheap"}">${g.surekReason() || `${t("Hazır")} · ${SUREK_FOOD} ${t("yiyecek")}`}</small></div><button class="btn sm go ${g.surekReason() ? "off" : ""}" data-a="${this.act(() => this.openArchery("surek"))}">${t("Ava çık")}</button></div>
      <div class="grow">${ic("arena", "gimg")}<div class="bi2"><b>${t("Kuşak Güreşi")} <em>${t("üç pehlivan")}</em></b><small>${t("Zamanlamayla kuşaktan çek, rakibin hamlesine karşı koy. Üç pehlivanı art arda yenen baş pehlivan olur.")}</small><small class="${wo ? "cheap" : "dim"}">${wo ? `${t("Sıradaki rakip")}: ${foe.name} (${foe.round + 1}/3)` : t("Meydan bugün kapandı · antrenman")} · ${t("Baş pehlivan")}: ${g.s.games?.champ ?? 0}</small></div><button class="btn sm go" data-a="${this.act(() => this.openMini("wr"))}">${t("Oyna")}</button></div>
      <div class="grow">${ic("u_cavalry", "gimg")}<div class="bi2"><b>${t("Kökbörü")} <em>${t("oğlak kapma")}</em></b><small>${t("Oğlağı kap, rakip atlılardan sıyrılarak kazana ulaştır. 40 saniye.")}</small>${st(ko)} · ${t("Rekor")}: ${g.s.games?.kbBest ?? 0}</small></div><button class="btn sm go" data-a="${this.act(() => this.openMini("kb"))}">${t("Oyna")}</button></div>
      ${this.ergenekonHtml()}`;
  }

  private ergenekonHtml(): string {
    const g = this.g;
    const why = g.ergReason();
    const best = g.s.ergBest ?? 0;
    const board = (g.s.ergBoard ?? []).slice(0, 5);
    const rows = board.length
      ? `<div class="wboard">${board
          .map(
            (r, i) =>
              `<div class="wrow"><i>${i + 1}</i><span>${r.name}${r.clear ? " ★" : ""}</span><b>${r.floor}.kat · H${r.week}</b></div>`,
          )
          .join("")}</div>`
      : `<p class="dim">${t("Henüz skor yok. Haftanın tohumu herkese aynı labirenti verir.")}</p>`;
    return `<div class="grow">${ic("heroes/boss_kokboru", "gimg")}<div class="bi2"><b>${t("Ergenekon'dan Çıkış")} <em>${t("20 kat · haftalık")}</em></b><small>${t("Her katta üç nimetten birini seç, demir kapıları aç. 5/10/15/20. katta bekçi.")}</small><small class="${why ? "dim" : "cheap"}">${why || t("Hazır")} · ${t("Rekor")}: ${best ? `${best}. ${t("kat")}` : t("yok")}</small></div><button class="btn sm go ${why ? "off" : ""}" title="${why}" data-a="${this.act(() => { this.close(); g.startErg(); })}">${t("Gir")}</button></div>${rows}`;
  }

  private korkutHtml(): string {
    const g = this.g;
    const s = g.s;
    const cur = g.boyStep();
    const done = s.boysDone ?? [];
    const rows = BOYS.map((b) => {
      const isCur = cur?.b.id === b.id;
      const fin = done.includes(b.id);
      const why = g.boyReason(b);
      const btn = isCur
        ? `<button class="btn sm go" data-a="${this.act(() => { this.close(); const at = s.boy!.at!; g.cam.flyTo(at.x, at.y, 0.8); })}">${t("Bul")}</button>`
        : fin ? `<em class="cheap">✓</em>` : `<button class="btn sm ${why ? "off" : "go"}" title="${why}" data-a="${this.act(() => g.boyStart(b.id))}">${t("Dinle")}</button>`;
      const sub = isCur ? `<small class="cheap">Adım ${cur!.n + 1}/${b.steps.length}: ${cur!.st.place} (${CITY_NAME[cur!.st.near]} yakınları)</small>` : fin ? `<small class="dim">Destan tamamlandı</small>` : `<small class="dim">${b.lv}. seviye${why && why !== "Dede Korkut şehir hanlarında anlatır" ? ` · ${why}` : ""}</small>`;
      return `<div class="grow ${fin ? "dim" : ""}">${ic(b.icon, "gimg")}<div class="bi2"><b>${b.name}</b>${sub}</div>${btn}</div>`;
    }).join("");
    return `<h3>${ic("scroll")} ${t("Dede Korkut Boyları")} <em class="dim">${done.length}/${BOYS.length}</em></h3><p class="dim">Dede Korkut şehir hanlarında Oğuz destanlarını anlatır. Dinlediğin boyu kendi kılıcınla yeniden yaz.</p>${rows}`;
  }

  private familyHtml(): string {
    const g = this.g;
    const f = g.family();
    const day = g.dayOf().day;
    if (!f.spouse) return `<h3>${ic("lord_bey")} ${t("Hanedan")}</h3><p class="dim">Bir hanedan kur: dostluğu 40'ı geçen bir beyle karşılaşınca kızı için dünürcü gönder. Dünürün ittifakı asla bozmaz; oğulların sancak taşır, kızların dünür diplomasiyle ticareti güçlendirir (en fazla 5 çocuk).</p>`;
    const from = g.s.rivals.find((r) => r.id === f.spouse!.from);
    const kids = f.kids.map((k) => {
      const age = kidAge(k, day);
      const role = k.son ? (age >= 1 ? t("sancak taşır") : t("beşikte")) : age >= 2 ? t("dünür bağı") : t("otağda");
      return `<div class="qrow">${ic(k.son ? "u_spear" : "healer")} ${k.name} <span>${k.son ? t("oğul") : t("kız")} · ${age || "<1"} ${t("yaş")} · ${role}</span></div>`;
    }).join("");
    const heir = heirOf(f);
    const allyFac = f.allyFac ? FACTIONS[f.allyFac] : null;
    const trade = Math.round(g.famTradeBonus() * 1000) / 10;
    const seats = f.kids.length
      ? `<div class="chips">${f.kids.map((k) => `<span class="chip">${k.son ? "⚔" : "◈"} ${k.name}</span>`).join("")}<span class="chip dim">${f.kids.length}/5</span></div>`
      : "";
    return `<h3>${ic("lord_bey")} ${t("Hanedan")} <em class="cheap">+%${Math.round(g.famBonus() * 100)} ${t("ordu")} · +%3 ${t("müttefik")}${trade ? ` · +%${trade} ${t("ticaret")}` : ""}</em></h3>
      <div class="grow">${ic("healer", "gimg")}<div class="bi2"><b>${f.spouse.name} Hatun</b><small>${from ? `${from.name} ${from.title} ${t("kızı")} · ${t("dünürün")}` : t("Eşin")}${allyFac ? ` · ${allyFac.name} ${t("ile hısımlık")}` : ""}</small></div></div>
      ${seats}
      ${kids || `<p class="dim">${t("Henüz çocuğun yok. Tengri bir varis bağışlasın.")}</p>`}
      ${heir ? `<p class="dim">${t("Varis")}: <b>${heir.name}</b> · ${kidAge(heir, day)} ${t("yaş")} · ${t("her yıl büyüme olayı")}</p>` : ""}
      ${g.s.endingSeed && endingOf(g.s.endingSeed) ? `<p class="dim">${t("Bitiş gölgesi")}: <b>${endingOf(g.s.endingSeed)!.name}</b></p>` : ""}`;
  }

  private ozanHtml(): string {
    const g = this.g;
    const s = g.s;
    const tg: Tamga = { ...TAMGA_DEFAULT, ...s.tamga };
    const chips = (part: keyof Tamga, opts: [string, string][]): string =>
      `<div class="tchips">${opts.map(([id, label]) => `<button class="tchip ${tg[part] === id ? "on" : ""}" data-a="${this.act(() => g.setTamga(part, id))}">${label}</button>`).join("")}</div>`;
    const songs = s.songs ?? [];
    const why = g.singReason();
    const list = songs.slice(0, this.allSongs ? songs.length : 2).map((sg) => `<div class="song"><b>${sg.title}</b> <small class="dim">${sg.d}. gün</small><i class="poem">${sg.lines.join("<br>")}</i></div>`).join("");
    return `<h3>${ic("scroll")} ${t("Tamga ve Destan Defteri")}</h3>
      <div class="tamgaed">${tamgaSvg(tg, 84)}<div>
        ${chips("shape", Object.keys(TAMGA_SHAPES).map((id) => [id, tamgaSvg({ ...tg, shape: id }, 26)]))}
        ${chips("mark", Object.entries(TAMGA_MARKS).map(([id, x]) => [id, x.name]))}
        ${chips("color", Object.keys(TAMGA_COLORS).map((id) => [id, `<span class="tdot" style="background:${TAMGA_COLORS[id]}"></span>`]))}
      </div></div>
      <p class="dim">Boyunun tamgası sancağında dalgalanır. Büyük işlerin ozanların dilinde destana dönüşür; şehir hanlarında okutursan şöhretin yayılır.</p>
      ${list || `<p class="dim">Henüz hakkında türkü yakılmadı. Bir bey yen, bir şehir fethet, bir kan davası kapat...</p>`}
      ${songs.length > 2 ? `<button class="btn sm" data-a="${this.act(() => { this.allSongs = !this.allSongs; this.render(); })}">${this.allSongs ? "Daha az" : `Bütün destanlar (${songs.length})`}</button>` : ""}
      <button class="btn ${why ? "off" : "go"}" title="${why}" data-a="${this.act(() => g.singSongs())}">Handa destanını okut (${SING_GOLD} altın · +${singRenown(songs.length)} şöhret)</button>${why ? `<small class="why">${why}</small>` : ""}`;
  }

  /** Oyuncunun hürriyetten sonra seçtiği opsiyonel yan destan: kendi hikâyeni yaz. */
  private sideSagaHtml(): string {
    const g = this.g;
    const active = g.activeSideSaga();
    if (active) {
      const { saga, step, done } = active;
      const prog = saga.goals.map((gl, i) => `<li class="${i < step || done ? "ok" : i === step ? "cur" : "dim"}">${i < step || done ? "✓ " : ""}${gl.text}</li>`).join("");
      return `<h3>${ic("scroll")} Yan Destan</h3>
        <div class="grow"><div class="bi2"><b>${saga.title}</b><small>${done ? "Tamamlandı!" : saga.desc}</small></div></div>
        <ul class="runs">${prog}</ul>
        ${done ? "" : `<button class="btn sm bad" data-a="${this.act(() => g.dropSideSaga())}">Vazgeç</button>`}`;
    }
    const list = g.sideSagaList();
    if (!list.length) return "";
    const rows = list.map((sg) => {
      const why = g.sideSagaReason(sg.id);
      const cost = [sg.startCost.gold ? `${sg.startCost.gold} altın` : "", sg.startCost.renown ? `${sg.startCost.renown} şöhret` : ""].filter(Boolean).join(" · ");
      return `<div class="grow">${ic(sg.icon, "gimg")}<div class="bi2"><b>${sg.title}</b><small>${sg.desc}</small></div><button class="btn sm ${why ? "off" : "go"}" title="${why}" data-a="${this.act(() => g.startSideSaga(sg.id))}">Başla${cost ? ` (${cost})` : ""}</button></div>`;
    }).join("");
    return `<h3>${ic("scroll")} Yan Destan <em class="dim">kendi hikâyeni yaz</em></h3>${rows}`;
  }

  private vetsHtml(): string {
    const vets = this.g.s.vets ?? [];
    if (!vets.length) return `<h3>${ic("tug")} Gaziler</h3><p class="dim">Kazandığın savaşlarda saflardan yiğitler öne çıkar. Gaziler savaştıkça rütbe alır ve bütün birliğe güç verir (en fazla ${VET_MAX}).</p>`;
    const icon: Record<string, string> = { spear: "u_spear", archer: "u_archer", horse: "u_cavalry" };
    return `<h3>${ic("tug")} Gaziler (${vets.length}/${VET_MAX}) <em class="cheap">+%${Math.round(vetBonus(vets) * 100)} güç</em></h3>` +
      vets.map((v) => `<div class="grow vet">${ic(icon[v.u], "gimg")}<div class="bi2"><b>${vetTitle(v)} <em>${VET_RANKS[v.lv - 1]}</em></b><small>${"★".repeat(v.lv)}${"☆".repeat(VET_LV_MAX - v.lv)} · ${v.kills} düşman · ${v.day}. günden beri${v.scar ? " · yaralı" : ""}</small></div></div>`).join("");
  }

  private legacyHtml(): string {
    const l = legacy();
    const cards = ENDINGS.map((e) => {
      const on = l.endings.includes(e.id);
      const p = LEGACY_PERKS[e.id];
      return `<div class="ach ${on ? "on" : ""}" title="${on ? p.desc : "Henüz görülmedi"}">${ic(e.img)}<b>${on ? e.name : "???"}</b><small>${on ? `${p.name}: ${p.desc}` : "Bu sonu gör, mirası aç."}</small></div>`;
    }).join("");
    const runs = l.runs.slice(0, 5).map((r) => `<li><b>${r.name}</b> · ${endingOf(r.ending)?.name ?? r.ending} · Sv ${r.lv} · ${r.day}. gün</li>`).join("");
    return `<h3>${ic("scroll")} ${t("Miras")} <em class="dim">${l.endings.length}/${ENDINGS.length} ${t("son")}</em></h3>
      <p class="dim">Gök Tengri Destanı'nın her sonu, sonraki bütün destanlarında geçerli kalıcı bir miras açar.</p>
      <div class="achs">${cards}</div>${runs ? `<ul class="runs">${runs}</ul>` : ""}`;
  }

  private exportFile(): void {
    this.g.saveNow();
    const raw = exportSave();
    if (!raw) return this.toast("Kaydedilecek bir oyun yok.", "bad");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    a.download = `kervan-krallik-yuva${curSlot() + 1}-${this.g.s.hero.name}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    this.toast("Kayıt dosyası indirildi.", "good");
  }

  private importFile(): void {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      const text = await f.text();
      if (!confirm(`Yuva ${curSlot() + 1} içindeki oyunun yerine bu kayıt yüklenecek. Emin misin?`)) return;
      if (!this.g.importText(text)) this.toast("Bu dosya geçerli bir Kervan Krallık kaydı değil.", "bad");
    };
    inp.click();
  }

  private modFile(): void {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json";
    inp.multiple = true;
    inp.onchange = async () => {
      let ok = 0;
      for (const f of Array.from(inp.files ?? [])) {
        const err = storeMod(f.name, await f.text());
        if (err) this.toast(`${f.name}: ${tr(err)}`, "bad");
        else ok++;
      }
      if (ok) {
        this.toast(tr("{n} mod eklendi. Etkinleşmesi için oyunu yeniden yükle.", { n: ok }), "good");
        this.render();
      }
    };
    inp.click();
  }

  private modsHtml(): string {
    const local = new Set(storedMods().map((m) => m.file));
    const rows = loadedMods.map((m) => {
      const errs = m.errors.length ? `<small class="why">${m.errors.length} ${tr("uyarı")}: ${m.errors.slice(0, 3).join(" · ")}</small>` : "";
      const meta = [m.version && `v${m.version}`, m.author, m.on ? `${m.changes} ${tr("değişiklik")}` : tr("kapalı")].filter(Boolean).join(" · ");
      return `<div class="sslot ${m.on ? "cur" : ""}">${ic("scroll")}<div><b>${m.name}</b><small>${meta}</small>${errs}</div><button class="btn sm ${m.on ? "on" : ""}" data-a="${this.act(() => {
        toggleMod(m.id);
        this.toast(tr("Değişiklik oyunu yeniden yükleyince geçerli olur."), "info");
      })}">${m.on ? t("Açık") : t("Kapalı")}</button>${local.has(m.file) ? `<button class="btn sm red" data-a="${this.act(() => {
        removeMod(m.file);
        this.toast(tr("Mod kaldırıldı. Yeniden yükleyince silinir."), "info");
        this.render();
      })}">✕</button>` : ""}</div>`;
    }).join("");
    const pending = storedMods().filter((f) => !loadedMods.some((m) => m.file === f.file)).map((f) => `<div class="sslot">${ic("scroll")}<div><b>${f.file}</b><small>${tr("yeniden yükleyince etkinleşir")}</small></div></div>`).join("");
    return `<h3>${ic("scroll")} ${tr("Modlar")} <em class="dim">${loadedMods.filter((m) => m.on).length}/${loadedMods.length}</em></h3>
      <p class="dim">${tr("Modlar JSON dosyalarıdır: mal fiyatlarını, birlikleri, binaları, şehir adlarını, metinleri değiştirebilir; Bitig'e yeni sayfa ve yeni haftalık temalar ekleyebilir.")}${modBridge ? ` ${tr("Klasör")}: <code>${modBridge.dir}</code>` : ""}</p>
      ${rows}${pending}
      <div class="setrow">${modBridge ? `<button class="btn sm" data-a="${this.act(() => modBridge!.open())}">${ic("chest")} ${tr("Mod klasörünü aç")}</button>` : ""}<button class="btn sm" data-a="${this.act(() => this.modFile())}">${ic("scroll")} ${tr("Mod ekle (.json)")}</button><button class="btn sm go" data-a="${this.act(() => {
        this.g.saveNow();
        location.reload();
      })}">${tr("Yeniden yükle")}</button></div>`;
  }

  private heroHtml(): string {
    const g = this.g;
    const s = g.s;
    const h = s.hero;
    const need = xpNeed(h.lv);
    const tabs = this.groupTabs([...(s.free ? ([["ufuk", "✦ " + t("Ufuk")]] as [string, string][]) : []), ["karakter", t("Karakter")], ["beceri", `${t("Beceriler")}${h.spts ? ` (${h.spts})` : ""}`], ...(h.lv >= 2 || h.tpts ? ([["yetenek", `${t("Yetenekler")}${h.tpts ? ` (${h.tpts})` : ""}`]] as [string, string][]) : []), ["techizat", `${t("Teçhizat")}${h.bag.length ? ` (${h.bag.length})` : ""}`], ["ordu", t("Birlik")], ...(s.free ? ([["unvan", `${t("Hedefler")}${g.dailyClaimable() ? " ●" : ""}`]] as [string, string][]) : []), ...(s.free && (h.lv >= 4 || g.seraiCount() > 0 || s.beylik) ? ([["kervan", t("Kervanlar")]] as [string, string][]) : []), ...(s.free && (h.lv >= 5 || s.beylik) ? ([["divan", t("Divan")]] as [string, string][]) : []), ["bitig", "Bitig"], ["ayar", "⚙"]], [
      ["ufuk", "✦ " + t("Ufuk"), ["ufuk"]],
      ["kahraman", t("Kahraman"), ["karakter", "beceri", "yetenek"]],
      ["techizat", t("Teçhizat"), ["techizat"]],
      ["ordu", t("Ordu"), ["ordu", "kervan", "divan"]],
      ["kayit", `${t("Kayıtlar")}${g.dailyClaimable() ? " ●" : ""}`, ["unvan", "bitig"]],
      ["ayar", "⚙", ["ayar"]],
    ]);
    let body = "";
    if (this.tab === "ufuk") {
      body = this.ufukHtml();
    } else if (this.tab === "karakter") {
      const cl = g.cls();
      const lk = g.treasury.worn("lakap");
      body = `${lk ? `<div class="lakap" style="--lc:${lk.color}">« ${t(lk.name)} »</div>` : ""}<div class="clsrow" style="--cc:${cl.color}">${ic(cl.portrait, "gimg round")}<div class="bi2"><b>${cl.name} <em>${cl.role}</em></b><small>${cl.passive}</small><small class="dim">${cl.weapons.map((w) => WEAPON_NAME[w]).join(", ")} · ${ARMOR_NAME[cl.armor]}${cl.shield ? ` · ${t("Kalkan")}` : ""}</small>${s.origin ? `<small class="cheap">${ic(ORIGIN_BY_ID[s.origin].icon)} ${lang() === "en" ? ORIGIN_BY_ID[s.origin].en[0] : ORIGIN_BY_ID[s.origin].name}: ${lang() === "en" ? ORIGIN_BY_ID[s.origin].en[2] : ORIGIN_BY_ID[s.origin].perk}</small>` : ""}</div></div>
        ${bar(h.xp, need, "", `${t("Seviye")} ${h.lv} · ${h.xp}/${need} ${t("TP")}`)}
        ${h.points > 0 ? `<div class="odds good">${t("Dağıtılacak <b>{n}</b> stat puanın var! ★ işaretliler {c} için ana özelliklerdir.", { n: h.points, c: cl.name })}<button class="btn sm go" data-a="${this.act(() => g.autoStats())}">${t("Önerilen dağıtım")}</button></div>` : ""}
        <h3>${t("Özellikler")}</h3>` +
        STAT_KEYS.map((k) => {
          const bonus = g.stat(k) - h.stats[k];
          const prim = cl.primary.includes(k);
          return `<div class="srow ${prim ? "prim" : ""}">${ic(STAT_INFO[k].icon, "gimg")}<div class="bi2"><b>${prim ? "★ " : ""}${STAT_INFO[k].name} <em>${h.stats[k]}${bonus ? ` +${bonus}` : ""}</em></b><small>${STAT_INFO[k].desc}</small></div><button class="btn sm plus ${h.points > 0 ? "" : "off"}" data-a="${this.act(() => g.statUp(k))}">+</button></div>`;
        }).join("") +
        `<h3>${t("Savaş")}</h3><div class="stats"><div>${ic("swords")}${t("Saldırı")} <b>${g.heroAtk().toFixed(1)}</b></div><div>${ic("shield")}${t("Savunma")} <b>${g.heroDef().toFixed(1)}</b></div><div>${t("Can")} <b>${Math.floor(h.hp)}/${g.maxHp()}</b></div><div>${t("Enerji")} <b>${Math.floor(h.energy)}/${g.maxEnergy()}</b></div><div>${ic("tug")}${t("Birlik sınırı")} <b>${g.heroCap()}</b></div><div>${ic("j_caravan")}${t("Yük")} <b>${g.carryCap()}</b></div><div>${ic("crown")}${t("Şöhret")} <b>${s.renown}</b></div></div>` +
        this.recHtml() +
        `<h3>${t("Beceriler")}</h3>` +
        SKILL_KEYS.map((k) => {
          const xp = h.skills[k];
          const lv = skillLv(xp);
          const need = skillNext(lv);
          const into = xp - 20 * lv * lv;
          const span = need - 20 * lv * lv;
          const pct = span > 0 ? Math.round((into / span) * 100) : 100;
          const near = lv < 10 && pct >= 75 ? `<small class="cheap">${t("Az kaldı")} · %${pct}</small>` : "";
          return `<div class="srow">${ic(SKILL_INFO[k].icon, "gimg")}<div class="bi2"><b>${SKILL_INFO[k].name} <em>${t("Sv")} ${lv}</em></b>${bar(into, span, "", `${xp}/${need}`)}<small>${SKILL_INFO[k].desc}</small>${near}</div></div>`;
        }).join("") +
        (s.free ? this.repHtml() : "") +
        this.chronHtml() +
        (g.seraiCount()
          ? `<h3>${ic("map/serai")} ${t("Kervansarayların · dakikada {n} altın", { n: g.seraiIncome().toFixed(1) })}</h3>` +
            Object.entries(s.serais)
              .map(([id, sr]) => `<div class="qrow">${CITY_NAME[id]} <em>${t("Sv")} ${sr.lv}</em><span class="cheap">${t("kasa")} ${Math.floor(sr.coffer)}/${Math.round(g.seraiCap(id))}</span></div>`)
              .join("")
          : "") +
        `<button class="btn sm red reset" data-a="${this.act(() => confirm(t("Tüm ilerlemen silinip yeni bir oyun başlayacak. Emin misin?")) && g.resetGame())}">${t("Yeni oyun başlat")}</button>`;
    } else if (this.tab === "yetenek") {
      const spentAll = Object.values(h.tal).reduce((a, b) => a + b, 0);
      body =
        `<p class="dim">${t("Her seviyede 1 yetenek puanı kazanırsın. Bir dalın alt sırasını açmak için o dala sıra başına {n} puan harcamalısın. Kendi yolunu seç: üç dalı birden bitiremezsin.", { n: ROW_NEED })}</p>
        <div class="stats"><div>${ic("scroll")}${t("Yetenek puanı")}: <b>${h.tpts}</b></div>${spentAll ? `<button class="btn sm ${s.res.gold < g.respecCost() ? "off" : ""}" data-a="${this.act(() => g.respecTalents())}">${t("Sıfırla")} ${ic("coins")}${g.respecCost()}</button>` : ""}</div><div class="tree">` +
        BRANCH_KEYS.map((b) => {
          const B = BRANCHES[b];
          const spent = branchSpent(h.tal, b);
          return `<div class="tb" style="--bc:${B.color}"><div class="tbh">${ic(B.icon)}<b>${B.name}</b><small>${spent} ${t("puan")}</small></div>${[0, 1, 2, 3, 4]
            .map((row) => {
              const open = spent >= row * ROW_NEED;
              return `<div class="trow ${open ? "" : "shut"}">${TALENTS.filter((t) => t.branch === b && t.row === row)
                .map((t) => {
                  const r = g.tal(t.id);
                  const why = g.talentReason(t);
                  const st = r >= t.max ? "max" : !open ? "lock" : why ? (r ? "own" : "idle") : "can";
                  return `<button class="tnode ${st}" data-a="${this.act(() => g.learnTalent(t.id))}">${ic(t.icon)}<b>${t.name}</b><i>${r}/${t.max}</i><small>${t.text(Math.max(1, r))}</small></button>`;
                })
                .join("")}</div>`;
            })
            .join("")}</div>`;
        }).join("") +
        `</div>`;
    } else if (this.tab === "beceri") {
      const cl = g.cls();
      const early = h.lv < 3
        ? `<div class="odds mid">${ic("u_archer")} <b>${t("Sv 3'e kadar")}</b><small>${t("Sınıf becerileri kilitli. Stat puanını Karakter'de harca; silah becerisi için Talim meydanına uğra.")}</small><button class="btn sm go" data-a="${this.act(() => this.openPlaceTab("talim"))}">${t("Talim")}</button></div>`
        : "";
      body = early + `<p class="dim">${t("{c} becerileri savaşta kendiliğinden devreye girer. 3. seviyeden itibaren her seviyede 1 beceri puanı kazanırsın. Bir beceri en fazla {n}. seviyeye (Usta) çıkar.", { c: cl.name, n: SKILL_MAX })}</p>
        <div class="stats"><div>${ic("scroll")}${t("Beceri puanı")}: <b>${h.spts}</b></div></div>` +
        g.classSkills().map((sk) => {
          const lv = g.skillLvOf(sk.id);
          const why = g.learnReason(sk);
          const cur = lv > 0 ? sk.text(skillPow(sk, lv)) : `${t("Açılınca")}: ${sk.text(skillPow(sk, 1))}`;
          const next = lv > 0 && lv < SKILL_MAX ? `<small class="dim">${t("Sonraki seviye")}: ${sk.text(skillPow(sk, lv + 1))}</small>` : "";
          const when = KIT_KIND_LABEL[sk.kind] ? `<small class="cheap">${t(KIT_KIND_LABEL[sk.kind])}</small>` : "";
          const unlock = lv <= 0 ? `<small class="dim">${t("Açılış")}: ${t("Sv")} ${sk.unlock}</small>` : "";
          return `<div class="brow skill ${lv ? "" : "locked"}">${ic(sk.icon, "bimg")}<div class="bi2"><b>${sk.name} <em>${skillRank(lv)}</em></b>${when}${unlock}<small>${cur}</small>${next}${why && why !== "Beceri puanın yok" ? `<small class="why">${why}</small>` : ""}</div><button class="btn sm plus ${why ? "off" : ""}" data-a="${this.act(() => g.learn(sk.id))}">+</button></div>`;
        }).join("");
    } else if (this.tab === "ayar") {
      body = this.settingsHtml();
    } else if (this.tab === "bitig") {
      body = this.bitigHtml();
    } else if (this.tab === "kervan") {
      body = this.myCvHtml();
    } else if (this.tab === "divan") {
      body = this.divanHtml();
    } else if (this.tab === "unvan") {
      body = (s.free ? this.weeklyHtml() : "") + this.dailyHtml() + (s.free ? this.logisticsHtml() : "") + (s.beylik ? this.kutHtml() + (this.g.dynastyOpen() ? this.familyHtml() : `<h3>${ic("lord_bey")} ${t("Hanedan")} 🔒</h3><p class="dim">${tr("40 şöhretten sonra dünür ve çocuklar açılır.")}</p>`) : "") + (s.free ? this.journeyBoardHtml() + this.korkutHtml() + this.gamesHtml() + this.yugHtml() + this.ozanHtml() + this.sideSagaHtml() + this.chainsHtml() : "") + this.kurultayHtml() + this.rivalsHtml() + this.nemesisHtml() + this.titlesHtml();
    } else if (this.tab === "techizat") {
      const inCity = g.nearCity() >= 0;
      body = this.worldBuffsHtml() + `<div class="slots">` + SLOTS.map((sl) => {
        const it = h.equip[sl];
        const yore = it?.org ? YORE[it.org] : null;
        return `<div class="slot ${it ? "r" + it.rar : ""} ${it?.set || it?.uq ? "leg" : ""}" ${it?.set ? `style="--sc:${SETS[it.set].color}"` : ""} ${it ? `data-a="${this.act(() => g.unequip(sl))}" title="${t("Çıkar")}${yore ? ` · ${yore.name}` : ""}"` : ""}>${it ? ic(it.icon, "simg2") : `<span class="empty">${SLOT_NAME[sl]}</span>`}<small>${it ? it.name : t("Boş")}</small>${yore ? `<em class="yore" title="${yore.desc}">${yore.name}</em>` : ""}</div>`;
      }).join("") + `</div><p class="dim">${t("Kuşanılmış bir eşyaya dokunarak çıkarabilirsin. Eşyaları şehirlerde satabilirsin.")}</p>` + this.setsHtml() +
        (CONSUMABLES.some((c) => s.cons[c.id]) || Object.keys(s.buffs).length
          ? `<h3>${ic("healer")} ${t("Çanta")}</h3>` +
            (Object.keys(s.buffs).length ? `<div class="odds good">${t("Etkin")}: ${Object.entries(s.buffs).map(([k, n]) => `${CONS_BY_ID[k]?.name ?? (k === "surek" ? t("Sürek avı talimi") : k === "yug" ? t("Yuğ") : k)} (${n} ${t("savaş")})`).join(" · ")}</div>` : "") +
            CONSUMABLES.filter((c) => s.cons[c.id]).map((c) => `<div class="grow">${ic(c.icon, "gimg")}<div class="bi2"><b>${c.name} <em>×${s.cons[c.id]}</em></b><small>${c.desc}</small></div><button class="btn sm go" data-a="${this.act(() => g.useCons(c.id))}">${t("Kullan")}</button></div>`).join("")
          : "") +
        `<h3>${ic("schest")} ${t("Heybe")} (${h.bag.length})</h3>` +
        (h.bag.length
          ? (() => {
              const junk = g.junk();
              const val = junk.reduce((a, it) => a + g.itemSellPrice(it), 0);
              return `<div class="row bagtools"><button class="btn sm ${junk.length && inCity ? "" : "off"}" title="${inCity ? "" : t("Bir şehirde olmalısın")}" data-a="${this.act(() => g.sellJunk())}">${ic("coins")} ${t("İşe yaramazları sat")}${junk.length ? ` (${junk.length} · ${val})` : ""}</button><small class="dim">${t("Sıralama: kuşanabildiklerin önce, yuvaya ve güce göre.")}</small></div>`;
            })()
          : "") +
        (g.sortedBag().map((it) => {
          const ok = !g.canUse(it);
          const better = ok && g.compare(it).reduce((a, x) => a + x.d, 0) > 0;
          return this.itemRow(it, `<div class="col2">${better ? `<em class="cheap">▲</em>` : ""}<button class="btn sm ${ok ? "" : "off"}" data-a="${this.act(() => g.equip(it.id))}">${t("Kuşan")}</button>${inCity ? `<button class="btn sm" data-a="${this.act(() => g.sellItem(it.id))}">${g.itemSellPrice(it)}</button>` : ""}</div>`);
        }).join("") || `<p class="dim">${t("Heyben boş. Haramiler, kamplar ve harabeler eşya düşürür.")}</p>`) +
        `<h3>${ic("j_caravan")} ${t("Yük")} (${g.cargoUsed()}/${g.carryCap()})</h3>` +
        (GOOD_KEYS.filter((k) => (h.cargo[k] ?? 0) > 0).map((k) => `<div class="qrow">${ic(GOODS[k].icon)} ${GOODS[k].name}<span>${t("{n} adet · ort. {p} altın", { n: h.cargo[k] ?? 0, p: Math.round((h.paid[k] ?? 0) / (h.cargo[k] ?? 1)) })}</span></div>`).join("") || `<p class="dim">${t("Yükün boş.")}</p>`) +
        (s.free ? this.codexHtml() : "");
    } else {
      body = this.worldBuffsHtml() + `<div class="stats"><div>${ic("tug")}${t("Birlik")}: <b>${armySize(h.army)}/${g.heroCap()}</b></div><div>${ic("coins")}${t("Ücret")}: <b>${g.wagePerMin().toFixed(1)}/${t("dk")}</b></div><div>${ic("shield")}${t("Toplam güç")}: <b>${Math.round(g.heroPower())}</b></div></div>
        ${armyHtml(h.army, "", Object.fromEntries(UNIT_KEYS.map((u) => [u, g.unitName(u)])) as Partial<Record<Unit, string>>)}
        ${this.troopTreeHtml()}
        ${UNIT_KEYS.map((u) => {
          const lv = g.drillLv(u);
          const tip = lv === 0
            ? t("Talim: {a} → {b}", { a: UNITS[u].name, b: DRILL[u].lv1.name })
            : lv === 1
              ? t("Dal seç: {list}", { list: DRILL[u].lv2.map((x) => x.name).join(" · ") })
              : g.unitName(u);
          return `<div class="brow">${ic(UNITS[u].icon, "bimg")}<div class="bi2"><b>${g.unitName(u)}</b><small>${h.army[u]} asker · talim ★${lv}/4 · ${tip}</small></div></div>`;
        }).join("")}
        ${s.free ? `<p class="dim">${t("Şehirde Talim meydanına uğra: mızraklı / okçu / atlı birliklerini kültür dallarına (Gulam, Oğuz Atlı Okçusu, Katafrakt…) terfi ettir.")}</p>` : ""}
        ${this.vetsHtml()}
        ${s.beylik ? this.otagHtml() : ""}
        ${s.free ? this.birdHtml() : ""}
        ${(() => {
          const m = g.compMods();
          const bits = [
            m.atk ? `${t("saldırı")} +%${Math.round(m.atk * 100)}` : "",
            m.army ? `${t("ordu")} +%${Math.round(m.army * 100)}` : "",
            m.heal ? `${t("şifa")} +%${Math.round(m.heal * 100)}` : "",
            m.trade ? `${t("ticaret")} +%${Math.round(m.trade * 100)}` : "",
            m.xp ? `${t("tecrübe")} +%${Math.round(m.xp * 100)}` : "",
            m.speed ? `${t("hız")} +%${Math.round(m.speed * 100)}` : "",
          ].filter(Boolean);
          return bits.length ? `<div class="odds mid">${ic("tug")} <b>${t("Yoldaş bonusları")}</b><small class="dim">${bits.join(" · ")}</small></div>` : "";
        })()}
        ${s.comps.length ? (() => {
          const esc = g.escort();
          const avg = Math.round(s.comps.reduce((a, id) => a + g.bond(id as CompId), 0) / s.comps.length);
          const mood = avg >= 40 ? t("Parti uyumlu") : avg >= 0 ? t("Parti temkinli") : t("Parti gergin");
          const escN = esc ? COMP_BY_ID[esc].name : t("yok (seç)");
          return `<div class="pboard compact"><h3>${ic("tug")} ${t("Parti nabzı")}</h3><div class="stats"><div>${t("Ortalama bağ")} <b class="${avg >= 0 ? "cheap" : "dear"}">${avg}</b></div><div>${t("Ruh hali")} <b>${mood}</b></div><div>${t("Yanındaki")} <b>${escN}</b></div></div><p class="dim">${t("Gece kamp ateşi ve yol olayları bağı güçlendirir. Muhafızını \"Yanımda yürü\" ile seç.")}</p></div>`;
        })() : ""}
        <h3>${ic("tug")} ${t("Yoldaşlar")} (${s.comps.length})</h3>${s.comps.map((id) => {
          const cp = COMP_BY_ID[id as CompId];
          if (!cp) return "";
          const bv = g.bond(cp.id), tier = bondTier(bv), en = lang() === "en";
          const q = COMP_QUESTS[cp.id], done = (s.cqDone ?? []).includes(cp.id);
          const qs = done ? `<small class="good">${t("Kan kardeşi")} · ${t("güçler")} ×${SWORN_MULT}</small>`
            : s.cq?.id === cp.id ? `<small class="cheap">${q.title}: ${CITY_NAME[q.steps[s.cq.step]?.city ?? q.steps[0].city]}</small>${g.cqTarget() ? this.walkBtn(g.cqTarget()!, t("Yola çık")).replace("btn go", "btn sm go cqgo") : ""}`
            : q ? `<small class="dim">${q.title} · ${t("bağ")} ${BOND_QUEST}+</small>` : "";
          const gearIt = g.compGearItem(cp.id);
          const gearOpts = h.bag.filter((it) => it.slot === "tilsim" || it.slot === "silah").map((it) => `<option value="${it.id}">${it.name}</option>`).join("");
          const gearHtml = gearIt
            ? `<small class="cheap">${ic(gearIt.icon)} ${gearIt.name}</small><button class="btn sm" data-a="${this.act(() => g.unequipCompGear(cp.id))}">${t("Çıkar")}</button>`
            : `<select data-compgear="${cp.id}"><option value="">${t("Tılsım/silah kuşandır")}</option>${gearOpts}</select>`;
          const escorting = s.escort === cp.id;
          const modBits = Object.entries(cp.mods).filter(([, v]) => v).map(([k, v]) => `${k} +%${Math.round((v as number) * 100 * (done ? SWORN_MULT : 1))}`).join(" · ");
          const leaveRisk = bv <= -25 ? `<small class="dear">${t("Ayrılma riski")}</small>` : "";
          return `<div class="comp on ${bv <= -25 ? "risk" : ""}"><img src="${assetUrl(cp.icon)}" alt=""><div class="bi2"><b>${cp.name} <em>${cp.role}</em></b><small class="cheap">${cp.perk}</small>${modBits ? `<small class="dim">${modBits}</small>` : ""}${bar(Math.max(0, bv + 100), 200, `bond ${tier.cls}`, `${en ? tier.en : tier.name} ${Math.round(bv)}`)}${leaveRisk}<small class="dim">${t("Sever")}: ${(en ? BOND_LIKES_EN : BOND_LIKES)[cp.id]}</small>${qs}<div class="col2"><button class="btn sm ${escorting ? "go" : ""}" data-a="${this.act(() => g.setEscort(escorting ? null : cp.id))}">${escorting ? t("Yanımda yürüyor") : t("Yanımda yürü")}</button>${gearHtml}</div></div></div>`;
        }).join("") || `<p class="dim">${t("Henüz yoldaşın yok. Destan seni yeni dostlarla buluşturacak; bazı şehirlerin hanlarında da yolcular bekler (en fazla {n} paralı yoldaş).", { n: COMP_MAX })}</p>`}
        <p class="dim">${s.free ? t("Köylerden gönüllü topla ya da şehir hanlarından paralı asker tut. Askerlerin ücretini altınla ödersin; altının biterse terk ederler. Liderlik birlik sınırını ve askerlerin gücünü artırır.") : t("Henüz bir kölesin. Hürriyetini kazanınca birlik kurabilirsin.")}</p>
        <h3>${t("Toplam")}</h3><div class="stats"><div>${ic("j_bandit")}${t("Yenilen düşman")}: <b>${s.kills}</b></div><div>${ic("quest")}${t("Görev")}: <b>${g.questsDone()}/${g.QUESTS.length}</b></div><div>${t("Ticaret kârı")}: <b>${s.c.profit}</b></div></div>`;
    }
    const tl = s.title ? titleOf(s.title) : null;
    return this.frame(h.name, s.free ? `${t("Seviye")} ${h.lv} · ${s.act3.ending ? `<b class="ttl">${endingOf(s.act3.ending)!.name}</b>${tl ? ` · ${tl.name}` : ""}` : s.kagan ? `<b class="ttl">${t("Kağan")}</b>${tl ? ` · ${tl.name}` : ""}` : tl ? `<b class="ttl">${tl.name}</b>` : s.beylik ? t("Bey") : t("Hür yiğit")}` : `${t("Seviye")} ${h.lv} · ${t("Köle")}`, assetUrl(g.face()), tabs + body);
  }

  /** Er meydanı: üç el zamanlamalı vuruş. done(-1) atlandı, aksi halde isabet sayısı. */
  spoils(title: string, opts: { icon: string; name: string; desc: string; cls?: string; off?: string }[], pick: (i: number) => void): void {
    this.battleOpen = true;
    this.close();
    const rare = opts.some((o) => /\br[3-4]\b/.test(o.cls ?? "") || /efsane|nadir|set/i.test(o.name + o.desc));
    const el = document.createElement("div");
    el.className = "battle";
    el.innerHTML = `<div class="bbox spoil${rare ? " chest-open" : ""}"><h2>${ic(rare ? "schest" : "trophy")} ${t("Ganimet payı")}</h2>
      <p class="dim">${t("{t} düştü. Meydanda kalanlardan birini seç.", { t: title })}</p>
      ${rare ? `<div class="chest-fx" aria-hidden="true"></div>` : ""}
      <div class="spks">${opts.map((o, i) => `<button class="spk ${o.off ? "off" : ""} ${o.cls ?? ""}" data-i="${i}" style="animation-delay:${0.08 + i * 0.1}s"><kbd>${i + 1}</kbd>${ic(o.icon, "simg")}<b class="${o.cls ?? ""}">${o.name}</b><small>${o.off ?? o.desc}</small></button>`).join("")}</div>
    </div>`;
    let picked = false;
    const done = (i: number) => {
      if (picked || opts[i]?.off) return;
      picked = true;
      window.removeEventListener("keydown", key);
      el.querySelector(`.spk[data-i="${i}"]`)!.classList.add("chosen");
      el.classList.add("picked");
      audio.play(rare ? "chest" : "coin");
      const rar = /\br4\b/.test(opts[i]?.cls ?? "") ? 4 : /\br3\b/.test(opts[i]?.cls ?? "") ? 3 : rare ? 2 : 0;
      if (rar >= 2) this.rarityBurst(rar);
      setTimeout(() => {
        el.remove();
        this.battleOpen = false;
        pick(i);
      }, 550);
    };
    const key = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < opts.length) done(i);
    };
    window.addEventListener("keydown", key);
    el.querySelectorAll<HTMLButtonElement>(".spk").forEach((b) => b.addEventListener("click", () => done(Number(b.dataset.i))));
    this.root.appendChild(el);
    audio.play(rare ? "chest" : "win");
  }

  /** Örs mini oyunu: daralan halka hedefe oturduğunda çekici indir; ritimle 3 vuruş. */
  anvil(title: string, done: (hits: number) => void): void {
    this.battleOpen = true;
    this.close();
    const el = document.createElement("div");
    el.className = "battle";
    el.innerHTML = `<div class="bbox anvilg"><h2>${ic("anvil")} ${t("Örs başında")}</h2>
      <p class="dim">${title}</p>
      <div class="anv"><div class="atarget"></div><div class="aring"></div>${ic("anvil", "aicon")}</div>
      <div class="pips apips"></div>
      <div class="dmsg">${t("Halka altın çembere oturunca vur! Ritmi kaçırma: üç vuruş.")}</div>
      <div class="dbtns"><button class="btn go big ahit">${t("Çekiç!")}</button><button class="btn askip" title="${t("1/3 isabet · hızlı döküm")}">${t("Kalfaya bırak")} <small>· 1/3</small></button></div>
    </div>`;
    this.root.appendChild(el);
    const ring = el.querySelector(".aring") as HTMLElement;
    const anv = el.querySelector(".anv") as HTMLElement;
    const msg = el.querySelector(".dmsg")!;
    const pips = el.querySelector(".apips")!;
    const hitBtn = el.querySelector(".ahit") as HTMLButtonElement;
    const BEAT = 1050;
    const t0 = performance.now() + 500;
    let beat = 0, hits = 0, struck = false, raf = 0, over = false;
    const finish = (n: number) => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      el.remove();
      this.battleOpen = false;
      done(n);
    };
    const mark = (ok: boolean) => {
      pips.insertAdjacentHTML("beforeend", `<i class="${ok ? "ok" : "no"}"></i>`);
      msg.textContent = ok ? t("Tam isabet! Kıvılcımlar saçıldı.") : t("Iskaladın, demir soğudu.");
    };
    const end = () => {
      over = true;
      cancelAnimationFrame(raf);
      ring.style.opacity = "0";
      msg.innerHTML = `<b class="${hits >= 2 ? "good" : hits ? "" : "dear"}">${t("{n}/3 isabet", { n: hits })} · ${hits === 3 ? t("Ustalara layık bir dövüş!") : hits ? t("Fena değil.") : t("Demir istediğin gibi işlenmedi.")}</b>`;
      hitBtn.textContent = t("Tamam");
      hitBtn.onclick = () => finish(hits);
      el.querySelector(".askip")?.remove();
    };
    const tick = () => {
      const ph = (performance.now() - t0) / BEAT - beat;
      if (ph > 1) {
        if (!struck) {
          mark(false);
          audio.play("bad");
        }
        beat++;
        struck = false;
        if (beat >= 3) return end();
      }
      const p = Math.max(0, (performance.now() - t0) / BEAT - beat);
      ring.style.transform = `translate(-50%,-50%) scale(${Math.max(0.15, 2.4 - 1.87 * p)})`;
      ring.style.opacity = performance.now() < t0 ? "0.3" : struck ? "0.25" : "1";
      raf = requestAnimationFrame(tick);
    };
    const strike = () => {
      if (over || struck || performance.now() < t0) return;
      struck = true;
      const ph = (performance.now() - t0) / BEAT - beat;
      const ok = Math.abs(ph - 0.75) < 0.1;
      if (ok) hits++;
      mark(ok);
      audio.play("anvil");
      haptic(ok ? 30 : 70);
      anv.classList.remove("spark");
      void anv.offsetWidth;
      if (ok) anv.classList.add("spark");
    };
    hitBtn.onclick = strike;
    el.querySelector(".askip")!.addEventListener("click", () => finish(1));
    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      hitBtn.click();
    };
    window.addEventListener("keydown", key);
    raf = requestAnimationFrame(tick);
  }

  duel(title: string, foeName: string, foeIcon: string, zone: number, done: (hits: number) => void): void {
    this.battleOpen = true;
    this.close();
    const el = document.createElement("div");
    el.className = "battle";
    el.innerHTML = `<div class="bbox duel"><h2>${ic("swords")} ${t("Er meydanı")}</h2>
      <p class="dim">${t("{t}: iki ordu durdu, saflardan birer er çıktı.", { t: title })}</p>
      <div class="dsides"><div class="dme">${ic(this.g.face(), "bp")}<b>${this.g.s.hero.name}</b><div class="pips"></div></div><div class="vs">VS</div><div class="dfoe">${ic(foeIcon, "bp")}<b>${foeName}</b><div class="pips"></div></div></div>
      <div class="dtrack"><div class="dzone"></div><div class="dneedle"></div></div>
      <div class="dmsg">${t("İbre altın bölgedeyken vur! Üç el.")}</div>
      <div class="dbtns"><button class="btn go big dhit">${t("Vur!")}</button><button class="btn dskip">${t("Er meydanına çıkma")}</button></div>
    </div>`;
    this.root.appendChild(el);
    const zoneEl = el.querySelector(".dzone") as HTMLElement;
    const needle = el.querySelector(".dneedle") as HTMLElement;
    const msg = el.querySelector(".dmsg")!;
    const hitBtn = el.querySelector(".dhit") as HTMLButtonElement;
    const pips = [el.querySelector(".dme .pips")!, el.querySelector(".dfoe .pips")!];
    let pass = 0, hits = 0, c0 = 0.5, t0 = performance.now(), speed = 0.9, raf = 0, wait = false, pos = 0;
    const finish = (n: number) => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", key);
      el.remove();
      this.battleOpen = false;
      done(n);
    };
    const setup = () => {
      c0 = 0.2 + Math.random() * 0.6;
      speed = 0.9 + pass * 0.35;
      zoneEl.style.left = `${(c0 - zone / 2) * 100}%`;
      zoneEl.style.width = `${zone * 100}%`;
      let p0 = Math.random();
      if (Math.abs(p0 - c0) < zone + 0.1) p0 = c0 > 0.5 ? 0.02 : 0.98;
      const ph0 = Math.random() < 0.5 ? p0 : 2 - p0;
      t0 = performance.now() - (ph0 / speed) * 1000;
      wait = false;
      hitBtn.classList.remove("off");
    };
    const tick = () => {
      const ph = ((performance.now() - t0) / 1000) * speed;
      pos = 1 - Math.abs((ph % 2) - 1);
      needle.style.left = `${pos * 100}%`;
      if (!wait && ph > 6) strike();
      raf = requestAnimationFrame(tick);
    };
    const strike = () => {
      if (wait) return;
      wait = true;
      hitBtn.classList.add("off");
      const ok = Math.abs(pos - c0) <= zone / 2;
      if (ok) hits++;
      pips[ok ? 0 : 1].insertAdjacentHTML("beforeend", "<i></i>");
      el.querySelector(ok ? ".dfoe" : ".dme")!.classList.add("hurt");
      setTimeout(() => el.querySelectorAll(".hurt").forEach((n) => n.classList.remove("hurt")), 350);
      audio.play(ok ? "hit" : "lose");
      haptic(ok ? 25 : 80);
      msg.textContent = ok ? t("İsabet!") : t("Iskaladın, rakip vurdu!");
      pass++;
      if (pass < 3) return void setTimeout(setup, 750);
      cancelAnimationFrame(raf);
      const win = hits >= 2;
      msg.innerHTML = `<b class="${win ? "good" : "dear"}">${win ? t("Er meydanını kazandın! Düşmanın morali çöktü.") : t("Erin yere serildi; askerlerin sarsıldı.")}</b>`;
      hitBtn.textContent = t("Savaşa!");
      hitBtn.classList.remove("off");
      hitBtn.onclick = () => finish(hits);
      el.querySelector(".dskip")!.remove();
    };
    hitBtn.onclick = strike;
    el.querySelector(".dskip")!.addEventListener("click", () => finish(-1));
    const key = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      e.preventDefault();
      hitBtn.click();
    };
    window.addEventListener("keydown", key);
    setup();
    raf = requestAnimationFrame(tick);
  }

  /** Sınıf becerileri + yoldaş becerileri: savaş ekranında "kit" şeridi olarak gösterilir (emir tabanlı savaşta beceri CD'si yok, bu yüzden sadece hangisi aktif ve ne zaman tetiklendiği gösterilir). */
  private battleKit(): { name: string; icon: string; kind: string; comp?: CompId }[] {
    const g = this.g;
    const kit: { name: string; icon: string; kind: string; comp?: CompId }[] = g.classSkills()
      .filter((sk) => g.skillLvOf(sk.id) > 0)
      .map((sk) => ({ name: sk.name, icon: sk.icon, kind: sk.kind }));
    for (const id of g.s.comps) {
      const cp = COMP_BY_ID[id as CompId];
      const sk = cp?.skill;
      if (!sk) continue;
      kit.push({ name: sk.kind === "heal" ? cp.name : `${cp.name}: ${sk.name}`, icon: cp.icon, kind: sk.kind, comp: id as CompId });
    }
    return kit;
  }

  showBattle(title: string, before: Army, enemy: Army, sim: Sim, hero: { hpBefore: number; maxHp: number }, boss: Boss | null, foe: string, auto: boolean, field: Field | null, apply: (res: BattleResult) => { xp: number; lvUp: boolean; note: string }, onClose: () => void): void {
    this.battleOpen = true;
    this.close();
    const el = document.createElement("div");
    el.className = "battle";
    const n0a = armySize(before);
    const skillKit = this.battleKit();
    const n0b = armySize(enemy);
    const face = this.g.face();
    el.innerHTML = `<div class="bbox war${boss ? " epic" : ""}">
      <h2>${ic("swords")} ${title}</h2>
      <div class="sides">
        <div class="side me">${ic(face, "bp")}<b>${this.g.s.hero.name}</b><div class="bar hero"><i></i><span></span></div>${n0a ? `<div class="bar hp"><i></i></div><div class="bar mor"><i></i><span></span></div>` : ""}<div class="arm"></div></div>
        <div class="vs">VS</div>
        <div class="side foe">${ic((boss && assetUrl(boss.icon) ? boss.icon : null) ?? "j_bandit", "bp" + (boss ? " boss" : ""))}<b>${boss?.name ?? foe}</b>${boss ? `<div class="bar boss"><i></i><span></span></div>` : ""}${n0b ? `<div class="bar hp foe"><i></i></div><div class="bar mor"><i></i><span></span></div>` : ""}<div class="arm"></div></div>
      </div>
      ${field ? `<div class="fground">${t(field.arena ? ARENAS[field.arena].name : GROUNDS[field.ground].name)}${field.kin ? ` · <b class="kinn">${t(KINS[field.kin].name)}</b>` : ""}${field.night ? ` · ${t("Gece")}` : ""}${field.sky ? ` · ${t(SKIES[field.sky].name)}` : ""}${field.note ? ` · ${t(field.note)}` : ""}</div>` : ""}
      <p class="dim bhint">${t("Sürükle veya Q/W/E ile saf · 1/2/3 şerit · A/S/D/F/Z/X emir · tur arası komut ver")}</p>
      <div class="formchip" aria-live="polite"></div>
      <div class="fwrap"><canvas class="field"></canvas><div class="bsay hidden"></div><div class="btell hidden"></div></div>
      <div class="orders touch">${ORDER_KEYS.filter((o) => o !== "yedek" || sim.canOrder(o)).map((o, i) => `<button type="button" class="btn ord" data-o="${o}"><kbd>${"ASDFZX"[i]}</kbd>${ic(ORDERS[o].icon)}<b>${t(ORDERS[o].name)}</b><em>${t(ORDERS[o].text)}</em></button>`).join("")}${sim.ultInfo().name ? `<button type="button" class="btn ult" title="${t(CLASS_ULTI[this.g.s.cls ?? "alp"].text)}"><kbd>C</kbd><div class="ubar"><i></i></div>${ic(sim.ultInfo().icon)}<b>${t(sim.ultInfo().name)}</b><em>${t("Kut patlaması")}</em></button>` : ""}<button type="button" class="btn sm fast" title="${t("Hızlandır")}">⏩ ${t("Hızlandır")}</button></div>
      ${skillKit.length ? `<div class="bkit">${skillKit.map((k, idx) => `<span class="kcard" data-i="${idx}" title="${t(KIT_KIND_LABEL[k.kind] ?? "")}">${ic(k.icon)}<b>${t(k.name)}</b></span>`).join("")}</div>` : ""}
      <div class="rlog">Savaş başladı…</div>
      <div class="result"></div>
    </div>`;
    this.root.appendChild(el);
    const bossPortrait = boss ? assetUrl(boss.icon) || assetUrl("j_bandit") : null;
    const bf = new BattleField(el.querySelector("canvas.field")!, sim.rounds[0].a, enemy, assetUrl(face), bossPortrait, field);
    const armor = this.g.s.hero.equip.zirh;
    if (armor && armor.rar >= 1) bf.heroRing = RARITY[armor.rar].color;
    if (this.g.s.free && this.g.s.tamga) bf.tamga = tamgaCanvas({ ...TAMGA_DEFAULT, ...this.g.s.tamga }, 48);
    bf.bannerColor = this.g.treasury.worn("banner")?.color ?? null;
    const kit = field?.kit ?? bossKit(boss);
    const tellEl = el.querySelector(".btell") as HTMLElement;
    const showTell = () => {
      const m = sim.pendingTell();
      tellEl.classList.toggle("hidden", !m);
      if (!m) return;
      const o = COUNTER[m.kind];
      tellEl.innerHTML = `<b>⚠ ${t(m.name)}</b><span>${t(m.tell)}</span><button type="button" class="btn go tcounter" data-o="${o}">${ic(ORDERS[o].icon)} ${t("Karşıla")}: ${t(ORDERS[o].name)}</button><small>${t(MOVE_HINT[m.kind])}</small>`;
      tellEl.querySelector(".tcounter")!.addEventListener("click", () => {
        if (pending || !sim.canOrder(o)) return;
        pickOrder(o);
        tellEl.classList.add("set");
      });
      tellEl.classList.remove("set");
      tellEl.classList.toggle("nounit", !sim.canOrder(o));
      const flags = (this.g.s.story.flags ??= []);
      if (!flags.includes("tut_tell")) {
        flags.push("tut_tell");
        this.toast(t("Boss tehdidi! Tur arasında karşı emri ver."), "info");
      }
    };
    bf.compIds = this.g.s.comps.slice(0, 3);
    bf.setComps(this.g.s.comps.map((id) => COMP_BY_ID[id as CompId]?.icon).filter((x): x is string => !!x).map((k) => assetUrl(k)));
    const setMor = (sel: string, m: number | undefined) => {
      const b = el.querySelector(`${sel} .bar.mor`);
      if (!b || m === undefined) return;
      (b.querySelector("i") as HTMLElement).style.width = `${m}%`;
      b.classList.toggle("low", m < 35);
      b.querySelector("span")!.textContent = `${t("Moral")} ${Math.round(m)}`;
    };
    const r0 = sim.rounds[0];
    setMor(".me", r0.ma ?? 100);
    setMor(".foe", r0.mb ?? 100);
    if (r0.ev.includes("Er meydanını kazandın!")) bf.announce("Er meydanını kazandın!", "#ffd56a", 300);
    else if (r0.ev.includes("Erin yere serildi")) bf.announce("Erin yere serildi", "#ff7a5a", 300);
    let pending: Order | undefined;
    let pendingUlt = false;
    let fast = auto;
    const ordBtns = [...el.querySelectorAll<HTMLButtonElement>(".ord")];
    const ultBtn = el.querySelector<HTMLButtonElement>(".ult");
    const syncUlt = () => {
      if (!ultBtn) return;
      const u = sim.ultInfo();
      const bar = ultBtn.querySelector(".ubar i") as HTMLElement | null;
      if (bar) bar.style.width = `${u.used ? 0 : u.charge}%`;
      ultBtn.classList.toggle("go", u.ready || pendingUlt);
      ultBtn.classList.toggle("on", pendingUlt);
      ultBtn.classList.toggle("off", u.used || (!u.ready && !pendingUlt));
      ultBtn.classList.toggle("hidden", u.used && !pendingUlt);
      if (u.ready && !u.used) {
        const flags = (this.g.s.story.flags ??= []);
        if (!flags.includes("tut_ult")) {
          flags.push("tut_ult");
          this.toast(t("Kut doldu! C ile sınıf ultimini ateşle."), "good");
        }
      }
    };
    const syncOrders = () => {
      const m = sim.pendingTell();
      for (const b of ordBtns) {
        const o = b.dataset.o as Order;
        b.classList.toggle("off", !sim.canOrder(o) || (!!pending && pending !== o) || pendingUlt);
        b.classList.toggle("go", pending === o);
        b.classList.toggle("on", pending === o);
        b.classList.toggle("counter", !!m && COUNTER[m.kind] === o && !pending);
      }
      syncUlt();
    };
    syncOrders();
    const pickOrder = (o: Order) => {
      if (!sim.canOrder(o) || pending || pendingUlt) return;
      pending = o;
      audio.play("click");
      haptic([22, 18, 22]);
      syncOrders();
      bf.previewOrder(o, t(ORDERS[o].name));
    };
    const pickUlt = () => {
      if (!sim.canUlt() || pendingUlt || pending) return;
      pendingUlt = true;
      audio.play("horn");
      haptic([40, 30, 40]);
      syncOrders();
      bf.announce(t(sim.ultInfo().name), "#c58cff", 80);
    };
    for (const b of ordBtns)
      b.addEventListener("click", () => {
        pickOrder(b.dataset.o as Order);
      });
    ultBtn?.addEventListener("click", () => pickUlt());
    const formChip = el.querySelector(".formchip") as HTMLElement;
    const syncFormChip = () => {
      const f = sim.form;
      formChip.innerHTML = UNIT_KEYS.map((u) => {
        if (!before[u]) return "";
        return `<button type="button" class="funit" data-u="${u}" title="${t(UNIT_FORM_NAME[u])}"><b>${t(UNIT_FORM_NAME[u])}</b><em>${t(FORM_LANE_NAME[f[u]])}</em></button>`;
      }).join("");
      formChip.querySelectorAll<HTMLButtonElement>(".funit").forEach((b) => {
        b.addEventListener("click", () => {
          if (auto || sim.done()) return;
          const u = b.dataset.u as Unit;
          const i = FORM_LANES.indexOf(f[u]);
          const lane = FORM_LANES[(i + 1) % FORM_LANES.length]!;
          applyForm(u, lane);
        });
      });
      const hint = sim.formHint().split(" · ").map((p) => t(p)).join(" · ");
      formChip.insertAdjacentHTML("beforeend", `<span class="fsum">${t("Saf")}: ${hint}</span>`);
    };
    const applyForm = (u: Unit, lane: FormLane) => {
      const pose = sim.setForm(u, lane);
      bf.setForm(pose);
      syncFormChip();
      audio.play("click");
      haptic(18);
      bf.announce(`${t(UNIT_FORM_NAME[u])} → ${t(FORM_LANE_NAME[lane])}`, "#ffd56a", 0);
    };
    bf.onForm = (u, lane) => {
      sim.setForm(u, lane);
      syncFormChip();
      audio.play("click");
      haptic(18);
    };
    Object.assign(sim.form, FORM_DEFAULT);
    bf.setForm(sim.form);
    syncFormChip();
    const onFormKey = (ev: KeyboardEvent) => {
      if (auto || sim.done() || el.querySelector(".over")) return;
      const k = ev.key.toLowerCase();
      const unitMap: Record<string, Unit> = { q: "spear", w: "archer", e: "horse" };
      const laneMap: Record<string, FormLane> = { "1": "back", "2": "mid", "3": "front" };
      if (unitMap[k] && before[unitMap[k]!]) {
        ev.preventDefault();
        const u = unitMap[k]!;
        const i = FORM_LANES.indexOf(sim.form[u]);
        applyForm(u, FORM_LANES[(i + 1) % FORM_LANES.length]!);
      } else if (laneMap[k]) {
        // son sürüklenen / en kalabalık birliği o şeride taşı
        ev.preventDefault();
        const u = (UNIT_KEYS.filter((x) => before[x] > 0).sort((a, b) => before[b] - before[a])[0] ?? "spear") as Unit;
        applyForm(u, laneMap[k]!);
      }
    };
    window.addEventListener("keydown", onFormKey);
    const ORD_KEY: Record<string, Order> = { a: "nara", s: "kanat", d: "yagmur", f: "siper", z: "ricat", x: "yedek" };
    const onOrdKey = (ev: KeyboardEvent) => {
      if (auto || sim.done() || el.querySelector(".over")) return;
      const k = ev.key.toLowerCase();
      if (k === "c" || k === " ") {
        if (sim.canUlt()) {
          ev.preventDefault();
          pickUlt();
        }
        return;
      }
      const o = ORD_KEY[k];
      if (!o) return;
      ev.preventDefault();
      pickOrder(o);
    };
    window.addEventListener("keydown", onOrdKey);
    // Sürükle = formasyon; boş sahaya dokun = emir döngüsü
    const fieldCv = el.querySelector("canvas.field") as HTMLCanvasElement;
    let formDrag = false;
    fieldCv.addEventListener("pointerdown", (ev) => {
      if (auto || sim.done()) return;
      ev.preventDefault();
      formDrag = bf.pointerDown(ev.clientX, ev.clientY);
      if (formDrag) {
        fieldCv.setPointerCapture(ev.pointerId);
        return;
      }
      if (pending) return;
      const avail = ORDER_KEYS.filter((o) => o !== "yedek" || sim.canOrder(o)).filter((o) => sim.canOrder(o));
      if (!avail.length) return;
      const i0 = avail.indexOf((ordBtns.find((b) => b.classList.contains("on"))?.dataset.o as Order) ?? avail[0]);
      pickOrder(avail[(i0 + 1) % avail.length]!);
    });
    fieldCv.addEventListener("pointermove", (ev) => {
      if (!formDrag) return;
      bf.pointerMove(ev.clientX, ev.clientY);
    });
    const endForm = (ev: PointerEvent) => {
      if (!formDrag) return;
      formDrag = false;
      bf.pointerUp(ev.clientX, ev.clientY);
    };
    fieldCv.addEventListener("pointerup", endForm);
    fieldCv.addEventListener("pointercancel", () => {
      formDrag = false;
      bf.cancelDrag();
    });
    const fastBtn = el.querySelector(".fast")!;
    fastBtn.classList.toggle("go", fast);
    fastBtn.addEventListener("click", () => {
      fast = !fast;
      fastBtn.classList.toggle("go", fast);
    });
    const setSide = (sel: string, a: Army, n0: number, hp?: number) => {
      const s = el.querySelector(sel)!;
      const hpBar = s.querySelector(".hp i") as HTMLElement | null;
      if (hpBar) hpBar.style.width = `${(armySize(a) / Math.max(1, n0)) * 100}%`;
      s.querySelector(".arm")!.innerHTML = n0 ? armyHtml(a) : "";
      if (hp !== undefined) {
        (s.querySelector(".hero i") as HTMLElement).style.width = `${(hp / hero.maxHp) * 100}%`;
        s.querySelector(".hero span")!.textContent = `Can ${Math.round(hp)}`;
      }
    };
    const bossMax = Math.max(1, Number.isFinite(boss?.hp) ? boss!.hp : 1);
    const setBoss = (hp: number) => {
      if (!boss) return;
      const cur = Number.isFinite(hp) ? Math.max(0, hp) : 0;
      (el.querySelector(".bar.boss i") as HTMLElement).style.width = `${Math.min(100, (cur / bossMax) * 100)}%`;
      el.querySelector(".bar.boss span")!.textContent = `${Math.ceil(cur)}/${Math.ceil(bossMax)}`;
    };
    setSide(".me", before, n0a, hero.hpBefore);
    setSide(".foe", enemy, n0b);
    setBoss(boss?.hp ?? 0);
    let i = 1;
    let sayT = 0;
    const log = el.querySelector(".rlog")!;
    const box = el.querySelector(".bbox") as HTMLElement;
    const kitEls = [...el.querySelectorAll<HTMLElement>(".bkit .kcard")];
    const step = () => {
      if (!sim.done() || i < sim.rounds.length) {
        if (i >= sim.rounds.length) {
          sim.step(pending, pendingUlt);
          pending = undefined;
          pendingUlt = false;
          bf.previewOrder(undefined);
          syncOrders();
        }
        const r = sim.rounds[i];
        const p = sim.rounds[i - 1];
        setSide(".me", r.a, n0a, r.hp);
        setSide(".foe", r.b, n0b);
        setBoss(r.bhp);
        setMor(".me", r.ma);
        setMor(".foe", r.mb);
        bf.round(r.a, r.b, r.order, fast ? 380 : 760, r.ev);
        if (r.ulti) {
          bf.flash("rgba(180,120,255,0.42)", 700);
          bf.announce(t("KUT!") + " · " + t(r.ulti), "#d6a8ff", 60);
          box.classList.add("ulted");
          setTimeout(() => box.classList.remove("ulted"), 900);
          audio.play("rage");
          setTimeout(() => audio.play("horn"), 280);
          haptic([50, 40, 50]);
        }
        if (r.order) {
          bf.previewOrder(undefined);
          bf.flash("rgba(255,213,106,0.28)");
          bf.announce(t("Emrin uygulandı") + " · " + t(ORDERS[r.order].name), "#ffd56a", 120);
          haptic(28);
        }
        if (r.move) {
          if (r.move.countered) {
            bf.flash("rgba(255,214,106,0.4)");
            bf.announce(t("KARŞILANDI!") + " · " + t(r.move.name), "#ffd56a");
            bf.announce(t("Emrin tuttu — darbe savruldu"), "#ffe7a8", 400);
            tellEl.classList.add("blocked");
            setTimeout(() => tellEl.classList.remove("blocked"), 900);
            audio.play("stagger");
            setTimeout(() => audio.play("quest"), 260);
            haptic([20, 30, 20]);
          } else {
            bf.flash("rgba(255,60,30,0.38)");
            bf.announce(t(r.move.name), "#ff7a5a");
            bf.announce(t("Kaçırdın — emir tutmadı"), "#ff8a6a", 380);
            tellEl.classList.add("missed");
            setTimeout(() => tellEl.classList.remove("missed"), 900);
            setTimeout(() => audio.play("roar"), 120);
          }
        }
        if (r.phase) {
          bf.rage(t(kit?.rage.name ?? ""));
          box.classList.add("raged", "rageshake");
          setTimeout(() => box.classList.remove("rageshake"), 900);
          audio.play("rage");
          setTimeout(() => audio.play("horn"), 500);
          haptic([60, 40, 60]);
        }
        if (r.say && boss) {
          const sayEl = el.querySelector(".bsay") as HTMLElement;
          sayEl.innerHTML = `${ic(boss.icon, "sayp")}<span>${t(r.say)}</span>`;
          sayEl.classList.remove("hidden", "pop");
          void sayEl.offsetWidth;
          sayEl.classList.add("pop");
          clearTimeout(sayT);
          sayT = window.setTimeout(() => sayEl.classList.add("hidden"), fast ? 1400 : 2600);
        }
        if (r.tell) {
          bf.announce("⚠ " + t(r.tell.name), "#ffb070", 350);
          tellEl.classList.add("urgent");
          setTimeout(() => tellEl.classList.remove("urgent"), 1600);
          if (!fast) setTimeout(() => audio.play("tell"), 300);
        }
        const dead = armySize(p.a) - armySize(r.a) + armySize(p.b) - armySize(r.b);
        const heavy = (!!r.move && !r.move.countered) || !!r.phase || r.ev.some((e) => e === "Kritik!" || e.endsWith("düştü!") || e.includes("bozguna") || e.includes("dağıldı")) || dead >= Math.max(6, (n0a + n0b) * 0.12) || (!!boss && p.bhp - r.bhp > boss.hp * 0.15);
        box.classList.remove("shake", "shake2", "hit", "crit");
        void box.offsetWidth;
        box.classList.add(heavy ? "shake2" : "shake", heavy ? "crit" : "hit");
        if (heavy && !fast) setTimeout(() => bf.hitStop(110), 760 * 0.42);
        audio.play("hit");
        haptic(heavy ? [30, 40, 30] : 18);
        const counterNote = r.move?.countered ? ` · ${t("Karşılandı: {m}", { m: t(r.move.name) })}` : r.move && !r.move.countered ? ` · ${t("Emir tutmadı")}` : "";
        log.textContent = r.phase ? t(r.phase) : `${r.ev.length ? r.ev.join(" · ") + " — " : ""}${i}. tur: ${p.hp >= r.hp ? `${Math.round(p.hp - r.hp)} hasar aldın` : `${Math.round(r.hp - p.hp)} can yeniledin`}${n0a ? `, ${armySize(p.a) - armySize(r.a)} asker kaybın` : ""} · düşman kaybı ${armySize(p.b) - armySize(r.b)}${counterNote}`;
        let barkComp: CompId | undefined;
        for (const [ki, el2] of kitEls.entries()) {
          const proc = r.ev.includes(skillKit[ki].name);
          el2.classList.toggle("proc", proc);
          if (proc && skillKit[ki].comp) barkComp = skillKit[ki].comp;
        }
        if (!barkComp && this.g.s.comps.length && heavy && Math.random() < 0.38) barkComp = this.g.s.comps[Math.floor(Math.random() * this.g.s.comps.length)] as CompId;
        if (barkComp && !(r.say && boss)) {
          const lines = COMP_BATTLE_BARK[barkComp];
          const cp = COMP_BY_ID[barkComp];
          const bark = lines[Math.floor(Math.random() * lines.length)]!;
          const sayEl = el.querySelector(".bsay") as HTMLElement;
          sayEl.innerHTML = `${ic(cp.icon, "sayp")}<span>${t(bark)}</span>`;
          sayEl.classList.remove("hidden", "pop");
          void sayEl.offsetWidth;
          sayEl.classList.add("pop");
          clearTimeout(sayT);
          sayT = window.setTimeout(() => sayEl.classList.add("hidden"), fast ? 1100 : 2000);
        }
        i++;
        showTell();
        syncOrders();
        const tellWait = !!sim.pendingTell() && !fast && !auto;
        const cmdWait = !fast && !auto && !pending && !sim.done();
        el.querySelector(".orders")?.classList.toggle("wait", cmdWait);
        el.querySelector(".orders")?.classList.toggle("tell-wait", tellWait);
        setTimeout(step, r.phase && !fast ? 2200 : tellWait ? 2800 : fast ? 420 : cmdWait ? 1950 : 1100);
        return;
      }
      tellEl.classList.add("hidden");
      bf.lockForm(true);
      bf.cancelDrag();
      window.removeEventListener("keydown", onFormKey);
      window.removeEventListener("keydown", onOrdKey);
      el.querySelector(".orders")!.remove();
      el.querySelector(".bkit")?.remove();
      el.querySelector(".formchip")?.remove();
      box.classList.add("over");
      const res = sim.finish();
      const { xp, lvUp, note: extra } = apply(res);
      const last = res.rounds[res.rounds.length - 1];
      bf.round(last.a, last.b, undefined, 500);
      bf.finish(res.win);
      setTimeout(() => bf.stop(), 2400);
      setMor(".me", last.ma);
      setMor(".foe", last.mb);
      setSide(".me", last.a, n0a, last.hp);
      setSide(".foe", last.b, n0b);
      setBoss(last.bhp);
      audio.play(res.win ? "win" : "lose");
      haptic(res.win ? [30, 60, 30] : 200);
      if (lvUp) setTimeout(() => audio.play("level"), 900);
      log.textContent = res.win ? (boss ? `${boss.name} yıkıldı!` : res.rout === "b" ? t("Düşman bozguna uğradı!") : "Düşman kaçıyor!") : res.heroDown ? "Yere düştün…" : res.rout === "a" ? t("Askerlerin dağıldı!") : "Geri çekilmek zorunda kaldın.";
      const spoilHint = res.win && armySize(res.lostB) >= 8
        ? `<p class="loot dim">${t("Meydanda ganimet kaldı — Devam’dan sonra payını seç.")}</p>`
        : "";
      el.querySelector(".result")!.innerHTML = `
        <div class="rt ${res.win ? "win" : "lose"}">${res.win ? "ZAFER" : "YENİLGİ"}</div>
        ${res.rout ? `<div class="rout">${t(res.rout === "b" ? "Bozgun! Düşman safları çözüldü." : "Bozgun! Safların çözüldü.")}</div>` : ""}
        <div class="stats"><div>Kayıpların: <b>${armySize(res.lostA)}</b></div><div>Düşman kaybı: <b>${armySize(res.lostB)}</b></div>${kit ? `<div>${t("Karşılanan hamle")}: <b>${sim.counters}</b></div>` : ""}<div>${ic("scroll")}+${xp} TP${lvUp ? " · <b class='gold'>SEVİYE ATLADIN!</b>" : ""}</div></div>
        ${extra ? `<p class="loot">${extra}</p>` : ""}${spoilHint}
        <button class="btn go big">Devam</button>`;
      box.classList.add(res.win ? "won" : "lost");
      if (res.win) bf.flash("rgba(255,213,106,0.35)", 900);
      el.querySelectorAll<HTMLElement>(".result .stats b").forEach((b) => {
        const to = Number(b.textContent);
        if (!Number.isFinite(to) || to <= 0) return;
        const t0 = performance.now();
        const tick = () => {
          const q = Math.min(1, (performance.now() - t0) / 700);
          b.textContent = String(Math.round(to * (1 - Math.pow(1 - q, 3))));
          if (q < 1) requestAnimationFrame(tick);
        };
        tick();
      });
      setTimeout(() => box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }), 650);
      el.querySelector(".result .btn")!.addEventListener("click", () => {
        window.removeEventListener("keydown", onFormKey);
      window.removeEventListener("keydown", onOrdKey);
        el.remove();
        this.battleOpen = false;
        if (this.music === "boss") this.music = null;
        this.nextStory();
        onClose();
      });
    };
    if (kit && boss) this.music = "boss";
    showTell();
    if (kit && boss && !auto) this.bossIntro(el, boss, kit, field, () => setTimeout(step, 250));
    else setTimeout(step, 600);
  }

  /** Boss savaşından önce sinematik giriş: siyah şeritler, portre, unvan ve tehdit sözü. */
  private bossIntro(host: HTMLElement, boss: Boss, kit: NonNullable<ReturnType<typeof bossKit>>, field: Field | null, done: () => void): void {
    const el = document.createElement("div");
    el.className = `bintro th-${kit.theme}`;
    const arena = field?.arena ? ARENAS[field.arena] : null;
    const bg = arena ? assetUrl(arena.img) : "";
    el.innerHTML = `${bg ? `<div class="bi-bg" style="background-image:url('${bg}')"></div>` : ""}<div class="lb lbt"></div><div class="lb lbb"></div>
      <div class="bi-art"><img src="${assetUrl(boss.icon)}" alt=""></div>
      <div class="bi-txt"><small>${t(kit.title)}</small><b>${t(boss.name)}</b><i>${t(bossLine(boss.name, kit.theme, "intro") ?? kit.intro)}</i>${arena ? `<em>${t(arena.name)}</em>` : ""}
      <div class="bi-moves">${kit.moves.map((m) => `<span>${ic(ORDERS[COUNTER[m.kind]].icon)}${t(m.name)}</span>`).join("")}</div>
      <button class="btn go big bi-go">${ic("swords")} ${t("Savaş!")}</button></div>`;
    host.appendChild(el);
    audio.play("horn");
    haptic([40, 60, 40]);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      el.classList.add("out");
      setTimeout(() => el.remove(), 450);
      done();
    };
    el.querySelector(".bi-go")!.addEventListener("click", close);
    setTimeout(close, 10000);
  }

  private setHtml(el: Element, html: string): void {
    if (this.htmlCache.get(el) === html) return;
    this.htmlCache.set(el, html);
    el.innerHTML = html;
  }

  /** Harita kenarında yoldaş bağ nabzı — yeşil güven, kırmızı küskünlük. */
  private syncBondPulse(): void {
    const g = this.g;
    const s = g.s;
    const show = s.free && s.comps.length > 0 && !this.modal() && !g.battleLock;
    this.bondPulseEl.classList.toggle("hidden", !show);
    if (!show) return;
    const html = s.comps
      .slice(0, 4)
      .map((id) => {
        const cp = COMP_BY_ID[id as CompId];
        if (!cp) return "";
        const tier = bondTier(g.bond(id as CompId));
        const esc = s.escort === id ? " esc" : "";
        return `<button type="button" class="bp ${tier.cls}${esc}" data-comp="${id}" title="${cp.name} · ${lang() === "en" ? tier.en : tier.name}"><img src="${assetUrl(cp.icon)}" alt=""></button>`;
      })
      .join("");
    this.setHtml(this.bondPulseEl, html);
  }

  update(): void {
    const g = this.g;
    const s = g.s;
    const now = performance.now();
    this.root.classList.toggle("slave", !s.free);
    if (this.cs && (this.modal() || g.battleLock)) this.cs.close();
    this.foldTrack();
    if (now - this.ufukAt > 1000) {
      this.ufukAt = now;
      const b = this.root.querySelector<HTMLElement>(".ufukbtn")!;
      b.classList.toggle("hidden", !s.free);
      b.classList.toggle("hot", s.free && g.horizon().some((x) => x.kind === "acil"));
    }
    if (now - this.bondPulseAt > 800) {
      this.bondPulseAt = now;
      this.syncBondPulse();
    }
    if (g.act) {
      this.actEl.classList.remove("hidden");
      this.setHtml(this.actEl, `<b>${g.act.label}…</b>${bar(Math.round((g.act.t / g.act.dur) * 200), 200, "", "")}`);
    } else this.actEl.classList.add("hidden");
    if (now - this.liveT < 250) return;
    this.liveT = now;
    const day = g.dayOf();
    const night = g.isNight();
    const se = g.sea();
    const h = s.hero;
    const showRes = RES_KEYS.filter((k) => k === "gold" || s.res[k] >= 1 || s.beylik);
    this.setHtml(this.top,
      showRes.map((k) => {
        const r = g.ratePerMin(k);
        return `<div class="res" title="${RES_NAME[k]}">${ic(RES_ICON[k])}<b>${fmt(s.res[k])}</b>${Math.round(r) ? `<small class="${r < 0 ? "neg" : ""}">${r >= 0 ? "+" : ""}${Math.round(r)}/dk</small>` : ""}</div>`;
      }).join("") +
      `<div class="res vit"><div class="mbar hp"><i style="width:${(h.hp / g.maxHp()) * 100}%"></i><span>❤ ${Math.floor(h.hp)}</span></div><div class="mbar en"><i style="width:${(h.energy / g.maxEnergy()) * 100}%"></i><span>⚡ ${Math.floor(h.energy)}</span></div></div>
       <div class="res hero ${g.treasury.worn("frame") ? `framed fr-${g.treasury.worn("frame")!.id}` : ""}" style="--fc:${g.treasury.worn("frame")?.color ?? "#e2bd62"}">${ic(g.face(), "ic round")}<b>${t("Sv")} ${h.lv}</b>${h.points + h.spts + h.tpts ? `<small class="pts">+${h.points + h.spts + h.tpts}</small>` : ""}${s.wanted ? `<small class="wanted" title="Aranıyorsun">${"★".repeat(s.wanted)}</small>` : ""}</div>
       ${s.free ? `<div class="res">${ic("crown")}<b>${s.renown}</b></div>` : ""}
       <div class="res day" title="${night ? "Gece: görüş azalır, haramiler cesurlaşır, muhafızlar seni zor bulur, Kurgan Taşları güçlenir ama daha çok Ruh Taşı verir" : "Gündüz"}">${night ? "🌙" : "☀️"}<b>${t("Gün")} ${day.day}</b></div>
       ${s.free ? `<div class="res season" title="${se.name}: ${se.desc} (${t("{n} gün kaldı", { n: Math.ceil(g.seasonLeft() / DAY_SEC) })})">${se.icon}<b>${se.name}</b></div>` : ""}
       <div class="res spd ${(settings.speed ?? 1) > 1 ? "fast" : ""}" data-spd title="${t("Oyun hızı (T)")}"><b>${"▶".repeat(settings.speed ?? 1)}</b></div>
       ${s.free ? `<div class="res yam" data-shop title="Yarmak · ${t("Hazine")}">${ic("yarmak")}<b>${fmt(g.treasury.st.yarmak)}</b><i>+</i></div>` : ""}`);
    // Köle evresinde Destan Yolu kilidi: rozet yalnızca günlük hediyeyi göstersin (IAP baskısı yok)
    const badge = s.free ? g.treasury.claimable() : g.treasury.dailyReady() ? 1 : 0;
    const sb = this.root.querySelector<HTMLElement>(".shopbtn .badge");
    if (sb) {
      sb.textContent = badge ? String(badge) : "";
      sb.classList.toggle("hidden", !badge);
    }
    const q = g.quest();
    const qProg =
      q?.title.includes("ocakları") ? `<div class="qprog"><i style="width:${Math.min(100, (s.c.shifts / 3) * 100)}%"></i><em>${s.c.shifts}/3</em></div>` :
      q?.title.includes("Hürriyet") && !s.free ? `<div class="qprog"><i style="width:${Math.min(100, (s.res.gold / g.freedomCost()) * 100)}%"></i><em>${Math.floor(s.res.gold)}/${g.freedomCost()}</em></div>` :
      q?.title.includes("döküm") ? `<div class="qprog"><i style="width:${Math.min(100, s.c.crafted * 100)}%"></i><em>${Math.min(1, s.c.crafted)}/1</em></div>` : "";
    this.setHtml(this.questEl, q
      ? `${ic("quest", "qi")}<div><small>${t("Görev")} ${g.questsDone() + 1}/${g.QUESTS.length} · ${t("dokun → git")}</small><b>${q.title}</b><span>${q.text}</span>${qProg}<em>${costHtml(q.reward, g)}</em></div>`
      : `${ic("crown", "qi")}<div><b>Tüm görevler bitti</b><span>Kampları temizle, beyliğini büyüt, batıya doğru keşfet.</span></div>`);
    const ch = g.chapter();
    this.questEl.classList.toggle("hidden", !q && !!ch && s.free);
    const sq = this.topSide();
    this.sideEl.classList.toggle("hidden", !sq);
    if (sq) {
      const p = Math.max(0, Math.min(sq.need, g.sideProg(sq)));
      const ready = p >= sq.need;
      const html = `${ic(SIDE_TEXT[sq.kind].icon, "qi")}<div><small>Şehir görevi${s.sideQ.length > 1 ? ` · +${s.sideQ.length - 1} daha` : ""}</small><b>${sq.title}</b><span>${ready ? `Tamamlandı! ${CITY_NAME[g.sideTurnIn(sq)]} şehrine dön.` : `${sq.text}${sq.need > 1 ? ` (${p}/${sq.need})` : ""}`}</span></div>`;
      if (this.sideEl.innerHTML !== html) this.sideEl.innerHTML = html;
      this.sideEl.classList.toggle("ready", ready);
    }
    const lordGoal = s.story.done && !s.story.lord;
    this.sagaEl.classList.toggle("hidden", s.free && !ch && !lordGoal);
    if (!s.free) {
      const html = `${ic("heroes/slave", "qi round")}<div><small>${t("Bölüm 0")}</small><b>${t("Zincirler")}</b><span>${t("Hürriyetini kazan.")}</span></div>`;
      if (this.sagaEl.innerHTML !== html) this.sagaEl.innerHTML = html;
    } else if (ch && s.free) {
      const why = ch.req?.(g);
      const html = `${ic(ch.img, "qi round")}<div><small>${g.sagaLabel()}</small><b>${ch.title}</b><span>${ch.goal}${why ? ` <i class="why">(${why})</i>` : ""}</span></div>`;
      if (this.sagaEl.innerHTML !== html) this.sagaEl.innerHTML = html;
    } else if (lordGoal) {
      const html = `${ic("map/serai", "qi round")}<div><small>Destan sonrası</small><b>İpek Yolu'nun Efendisi</b><span>Semerkant dışındaki ${LORD_SERAIS} şehrin hepsinde kervansaray kur (${g.seraiCount()}/${LORD_SERAIS}).</span></div>`;
      if (this.sagaEl.innerHTML !== html) this.sagaEl.innerHTML = html;
    }
    const r = s.raid;
    const ct = s.contract;
    const vy = s.fleet.voyage;
    const warRival = s.free ? s.rivals.find((x) => x.status === "war") : undefined;
    const beyAsk = s.free ? s.rivals.find((x) => x.req) : undefined;
    const askLeft = beyAsk?.req ? beyAsk.req.until - g.dayOf().day : 99;
    const taskOn = !!(r || warRival || beyAsk || ct || vy);
    this.taskEl.classList.toggle("hidden", !taskOn);
    this.taskEl.classList.toggle("alert", !!r || !!warRival || askLeft <= 1);
    if (r) this.setHtml(this.taskEl, `${ic("j_bandit", "qi")}<div><small>${t("Baskın")} · ${dur(r.until - g.now)}</small><b>${s.villages[r.v].name} ${t("yağmalanıyor!")}</b></div>`);
    else if (warRival) this.setHtml(this.taskEl, `${ic(warRival.icon, "qi")}<div><small>${t("Savaş")} · ${armySize(warRival.army)} ${t("asker")}</small><b>${warRival.name} ${warRival.title} — ${t("tuğu kalktı")}</b></div>`);
    else if (beyAsk?.req) this.setHtml(this.taskEl, `${ic(REQ_INFO[beyAsk.req.kind].icon, "qi")}<div><small>${beyAsk.name} · ${Math.max(0, askLeft)} ${t("gün")}</small><b>${REQ_INFO[beyAsk.req.kind].name}</b></div>`);
    else if (ct) this.setHtml(this.taskEl, `${ic("j_caravan", "qi")}<div><small>${t("Kervan sözleşmesi")} · ${dur(ct.until - g.now)}</small><b>${ct.cargo} → ${CITY_NAME[ct.to]}</b></div>`);
    else if (vy) this.setHtml(this.taskEl, `${ic(GOODS[vy.good].icon, "qi")}<div><small>⚓ ${t("Denizde")} · %${Math.floor(Math.min(1, (s.time - vy.at) / vy.dur) * 100)}${vy.escort ? ` · ${t("muhafızlı")}` : ""}</small><b>${vy.qty} ${GOODS[vy.good].name} → ${CITY_NAME[vy.to]}</b></div>`);
    const mg = s.mongol;
    const mgOn = !!mg && (mg.stage === 1 || mg.stage === 2);
    this.mogEl.classList.toggle("hidden", !mgOn);
    if (mg && mgOn) {
      const left = Math.ceil(g.mongolDaysLeft());
      this.mogEl.classList.toggle("alert", mg.stage === 2 && left <= 2);
      this.setHtml(this.mogEl, mg.stage === 1
        ? `${ic("scroll", "qi")}<div><small>${t("Doğudan haberler")}</small><b>${t("Kara bulut yaklaşıyor")} · ${left} ${t("gün")}</b></div>`
        : `${ic("heroes/boss_hakan", "qi")}<div><small>${t("Moğol istilası")} · ${"◆".repeat(mg.str)}${mg.pact === "join" ? ` · ${t("müttefik")}` : ""}</small><b>${CITY_NAME[MONGOL_ROUTE[mg.next]]} · ${left} ${t("gün")}</b></div>`);
    }
    const bld = g.building();
    this.root.querySelector('[data-b="capital"] span')!.textContent = bld ? `⏱ ${dur(s.buildings[bld].until - g.now)}` : t("Semerkant");
    const hb = this.root.querySelector('[data-b="hero"]')!;
    (hb.querySelector("img") as HTMLImageElement).src = assetUrl(g.face());
    hb.classList.toggle("pulse", h.points > 0 || g.dailyClaimable());
    const bird = s.bird;
    this.birdBtn.classList.toggle("hidden", !bird || !s.free);
    if (bird) {
      const img = this.birdBtn.querySelector("img")!;
      const src = assetUrl("bird_" + bird.kind);
      if (img.getAttribute("src") !== src) img.setAttribute("src", src);
      const cd = g.birdReady();
      const txt = g.birdFly ? "Uçuyor" : g.birdAim ? "Hedef seç" : cd > 0 ? `${Math.ceil(cd)} sn` : "Uçur";
      const sp = this.birdBtn.querySelector("span")!;
      if (sp.textContent !== txt) sp.textContent = txt;
      this.birdBtn.classList.toggle("ready", !g.birdFly && cd <= 0);
      this.birdBtn.classList.toggle("aim", g.birdAim);
    }
    if (this.place && !this.holding && now - this.panelT > 1000) {
      this.panelT = now;
      this.render();
    }
    if (now - this.miniT > 400) {
      this.miniT = now;
      this.drawMini();
      if (this.toastQ.length && !this.covered && this.toasts.children.length < (this.narrow.matches ? 2 : 3)) {
        const n = this.toastQ.shift()!;
        this.pushToast(n.el, n.ms, true);
      }
    }
  }

  private drawMini(): void {
    const g = this.g;
    const c = this.mini.getContext("2d")!;
    const w = this.mini.width;
    const h = this.mini.height;
    if (!this.fogC || this.fogRev !== g.fogRev) {
      this.fogRev = g.fogRev;
      const fc = (this.fogC ??= document.createElement("canvas"));
      fc.width = w;
      fc.height = h;
      const f = fc.getContext("2d")!;
      f.drawImage(this.miniBase, 0, 0);
      f.fillStyle = "rgba(28,20,12,0.88)";
      const ex = g.s.explored;
      const cw = w / NW;
      const ch = h / NH;
      for (let y = 0; y < NH; y += 2)
        for (let x = 0; x < NW; x += 2) if (!ex[y * NW + x]) f.fillRect(x * cw, y * ch, cw * 2 + 0.5, ch * 2 + 0.5);
    }
    c.drawImage(this.fogC, 0, 0);
    const sx = w / W;
    const sy = h / H;
    for (const ci of CITIES) {
      const own = ci.id === CAPITAL.id || !!g.s.owned[ci.id];
      c.fillStyle = own ? "#ffd56a" : "#f2e6c8";
      c.fillRect(ci.x * sx - (own ? 3 : 2), ci.y * sy - (own ? 3 : 2), own ? 6 : 4, own ? 6 : 4);
    }
    for (const f of g.s.forts) {
      if (f.owner !== "me" && !g.isExplored(f.x, f.y)) continue;
      c.fillStyle = f.owner === "me" ? "#ffd56a" : f.owner === "harami" ? "#ff8a70" : FACTIONS[f.owner].color;
      c.beginPath();
      c.moveTo(f.x * sx, f.y * sy - 4);
      c.lineTo(f.x * sx + 3.5, f.y * sy + 2.5);
      c.lineTo(f.x * sx - 3.5, f.y * sy + 2.5);
      c.fill();
    }
    for (const sc of g.s.scars ?? []) {
      if (!sc.w) continue;
      c.fillStyle = "#3a2410";
      c.fillRect(sc.x * sx - 0.5, sc.y * sy - 7, 1.5, 8);
      c.fillStyle = "#f2e6c8";
      c.fillRect(sc.x * sx + 1, sc.y * sy - 7, 5, 3.5);
    }
    const wanted = new Set(g.s.bounties.filter((b) => b.taken).map((b) => b.camp));
    g.s.camps.forEach((cp, i) => {
      if (!cp.alive || (!g.isExplored(cp.x, cp.y) && !wanted.has(i))) return;
      c.fillStyle = wanted.has(i) ? "#ffd56a" : "#ff5a3c";
      c.fillRect(cp.x * sx - 2, cp.y * sy - 2, wanted.has(i) ? 5 : 3, wanted.has(i) ? 5 : 3);
    });
    c.fillStyle = "#7fd36a";
    for (const m of g.s.marches) c.fillRect(m.x * sx - 1.5, m.y * sy - 1.5, 3, 3);
    for (const st of g.s.storms) {
      c.fillStyle = st.kind === "kum" ? "rgba(214,160,80,0.35)" : "rgba(90,120,170,0.35)";
      c.beginPath();
      c.arc(st.x * sx, st.y * sy, Math.max(3, st.r * sx), 0, Math.PI * 2);
      c.fill();
    }
    for (const cv of g.s.caravans) {
      if (!g.isExplored(cv.x, cv.y)) continue;
      c.fillStyle = cv.raid ? "#ff5a3c" : FACTIONS[cv.fac as keyof typeof FACTIONS].color;
      c.beginPath();
      c.moveTo(cv.x * sx, cv.y * sy - 2.5);
      c.lineTo(cv.x * sx + 2.5, cv.y * sy);
      c.lineTo(cv.x * sx, cv.y * sy + 2.5);
      c.lineTo(cv.x * sx - 2.5, cv.y * sy);
      c.fill();
    }
    for (const b of g.s.bandits) {
      if (!b.posse && !b.nem) continue;
      c.fillStyle = b.posse ? "#6aa8ff" : "#c27bff";
      c.fillRect(b.x * sx - 2, b.y * sy - 2, b.posse ? 3 : 4, b.posse ? 3 : 4);
    }
    for (const r of g.s.rivals) {
      if (r.status === "dead" || !g.isExplored(r.x, r.y)) continue;
      const war = r.status === "war";
      const pulse = war ? 3.5 + Math.sin(performance.now() / 220) * 1.2 : 3;
      c.fillStyle = RIVAL_CSS[r.status];
      c.beginPath();
      c.arc(r.x * sx, r.y * sy, pulse, 0, Math.PI * 2);
      c.fill();
      if (war) {
        c.strokeStyle = "rgba(255,106,74,0.85)";
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(r.x * sx, r.y * sy, pulse + 2.5, 0, Math.PI * 2);
        c.stroke();
      }
    }
    for (const m of g.s.fxMarch ?? []) {
      if (m.until <= g.now) continue;
      c.strokeStyle = `#${m.col.toString(16).padStart(6, "0")}aa`;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(m.x * sx, m.y * sy);
      c.lineTo(m.tx * sx, m.ty * sy);
      c.stroke();
      c.fillStyle = c.strokeStyle;
      c.beginPath();
      c.arc(m.tx * sx, m.ty * sy, 2.2, 0, Math.PI * 2);
      c.fill();
    }
    const gt = g.s.act2.gate;
    if (gt && !g.s.act2.done) {
      c.strokeStyle = "#c27bff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(gt.x * sx, gt.y * sy, 4 + Math.sin(performance.now() / 300), 0, Math.PI * 2);
      c.stroke();
    }
    const ot = g.s.otag;
    if (ot) {
      c.fillStyle = "#ffe08a";
      c.fillRect(ot.x * sx - 3, ot.y * sy - 3, 6, 6);
    }
    const ba = g.s.boy?.at;
    if (ba) {
      c.strokeStyle = "#ffb24a";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(ba.x * sx, ba.y * sy, 4 + Math.sin(performance.now() / 300), 0, Math.PI * 2);
      c.stroke();
    }
    const pk = g.s.act3.peak;
    if (pk && !g.s.act3.ending) {
      c.strokeStyle = "#7fd0ff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(pk.x * sx, pk.y * sy, 4 + Math.sin(performance.now() / 300), 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#fff";
    c.beginPath();
    c.arc(g.s.hero.x * sx, g.s.hero.y * sy, 3, 0, Math.PI * 2);
    c.fill();
    const cam = g.cam;
    const vw = (cam.w / cam.zoom) * sx;
    const vh = (cam.h / cam.zoom) * sy;
    c.strokeStyle = "rgba(255,230,160,0.9)";
    c.lineWidth = 1;
    c.strokeRect(cam.x * sx - vw / 2, cam.y * sy - vh / 2, vw, vh);
  }
}
