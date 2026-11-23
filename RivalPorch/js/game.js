const ART = {
  streetHero: "assets/rival-porch/street-hero.png",
  arenaStage: "assets/rival-porch/arena-stage.png",
  busts: {
    n1: "assets/rival-porch/bust-n1-aunt-merve.png",
    n2: "assets/rival-porch/bust-n2-coach-cem.png",
    n3: "assets/rival-porch/bust-n3-kid-leyla.png",
    n4: "assets/rival-porch/bust-n4-mr-orhan.png",
    n5: "assets/rival-porch/bust-n5-dj-peri.png",
    n6: "assets/rival-porch/bust-n6-baker-can.png",
  },
};

const UNIT_STATS = {
  n1: { hp: 95, atk: 9, def: 7, spd: 10 },
  n2: { hp: 115, atk: 15, def: 9, spd: 9 },
  n3: { hp: 72, atk: 19, def: 4, spd: 15 },
  n4: { hp: 145, atk: 10, def: 17, spd: 6 },
  n5: { hp: 88, atk: 13, def: 5, spd: 12 },
  n6: { hp: 100, atk: 8, def: 8, spd: 8 },
};

const state = {
  content: null,
  locale: "tr",
  affinity: {},
  traits: {},
  visitedDrama: {},
  giftUsed: {},
  talkIdx: {},
  selectedNeighbor: null,
  cupPicks: [],
  placement: [null, null, null, null, null, null],
  selectedBench: null,
  lastResult: null,
  fightTimer: null,
  checkinDone: false,
};

const el = {
  app: document.getElementById("app"),
  canvas: document.getElementById("share-canvas"),
};

function t(key) {
  const s = state.content?.uiStrings?.[key];
  if (!s) return key;
  return s[state.locale] || s.en || key;
}

function loc(obj) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[state.locale] || obj.en || obj.tr || "";
}

function fillTemplate(template, vars) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function bust(id) {
  return ART.busts[id] || ART.busts.n1;
}

function neighborById(id) {
  return state.content.neighbors.find((n) => n.id === id);
}

function toast(msg) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    el.app.appendChild(node);
  }
  node.textContent = msg;
  node.classList.add("show");
  clearTimeout(node._hide);
  node._hide = setTimeout(() => node.classList.remove("show"), 2200);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");
}

function initAffinity() {
  for (const n of state.content.neighbors) {
    state.affinity[n.id] = 3;
    state.traits[n.id] = { [n.trait]: 2 };
    state.talkIdx[n.id] = 0;
  }
}

function setLocale(locale) {
  state.locale = locale;
  document.documentElement.lang = locale;
  document.title = t("app.title");
  renderAll();
}

function renderAll() {
  renderTitle();
  renderStreet();
  if (state.selectedNeighbor) renderNeighbor(state.selectedNeighbor);
  renderCupLobby();
  renderDraft();
  renderComicShell();
}

function buildShell() {
  el.app.innerHTML = `
    <section class="screen screen-title active" id="screen-title"></section>
    <section class="screen screen-street" id="screen-street"></section>
    <section class="screen screen-neighbor" id="screen-neighbor"></section>
    <section class="screen" id="screen-cup"></section>
    <section class="screen" id="screen-draft"></section>
    <section class="screen" id="screen-fight"></section>
    <section class="screen" id="screen-comic"></section>
    <section class="screen" id="screen-shop"></section>
  `;
}

function renderTitle() {
  const screen = document.getElementById("screen-title");
  screen.style.backgroundImage = `url("${ART.streetHero}")`;
  screen.innerHTML = `
    <div class="title-panel">
      <button class="btn btn-secondary lang-toggle" type="button" data-action="toggle-lang">
        ${state.locale === "tr" ? "EN" : "TR"}
      </button>
      <h1 class="brand">${t("app.title")}</h1>
      <p class="title-tag">${state.locale === "tr"
        ? "Mahalleni yaşat; komşuların minyatür arenada unit’e dönüşsün."
        : "Keep your block alive — neighbors become units in a miniature arena."}</p>
      <button class="btn btn-primary" type="button" data-action="start">${t("boot.tap_to_start")}</button>
      <button class="btn btn-secondary" type="button" data-action="open-shop">${t("shop.title")}</button>
    </div>
  `;
}

function renderStreet() {
  const screen = document.getElementById("screen-street");
  const spots = state.content.neighbors
    .map(
      (n) => `
      <button class="hotspot" type="button" data-action="open-neighbor" data-id="${n.id}" aria-label="${loc(n.name)}">
        <img class="bust-mini" src="${bust(n.id)}" alt="" />
        <span class="label">${loc(n.name)}</span>
      </button>`
    )
    .join("");

  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("street.header")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-cup">${t("cup.lobby_title")}</button>
    </div>
    <div class="street-stage" style="background-image:url('${ART.streetHero}')">
      <div class="hotspots">${spots}</div>
    </div>
    <p class="street-hint">${t("street.hint_tap_neighbor")}</p>
    <div class="mood-bar">
      <button class="btn btn-rose" type="button" data-action="checkin">${t("street.porch_checkin")}</button>
      <button class="btn btn-secondary" type="button" data-action="idle-night">${t("idle.overnight")}</button>
      <button class="btn btn-secondary" type="button" data-action="goto-title">${t("common.back")}</button>
    </div>
  `;
}

function renderNeighbor(id) {
  const n = neighborById(id);
  if (!n) return;
  state.selectedNeighbor = id;
  const affinity = state.affinity[id] ?? 0;
  const screen = document.getElementById("screen-neighbor");
  screen.innerHTML = `
    <div class="topbar">
      <h2>${loc(n.name)}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-street">${t("common.back")}</button>
    </div>
    <div class="neighbor-hero">
      <div class="bust-frame"><img src="${bust(id)}" alt="${loc(n.name)}" /></div>
      <div class="neighbor-meta">
        <h2>${loc(n.name)}</h2>
        <p class="meta-line"><strong>${t("neighbor.trait")}:</strong> ${n.trait}</p>
        <p class="meta-line"><strong>${t("neighbor.role")}:</strong> ${n.role}</p>
        <p class="meta-line"><strong>${t("neighbor.prop")}:</strong> ${loc(n.prop.label)}</p>
        <p class="meta-line"><span class="chip ${n.synergyTag.toLowerCase()}">${n.synergyTag}</span></p>
        <p class="meta-line">${t("neighbor.affinity")}: ${affinity}/10</p>
        <div class="affinity-bar"><div class="affinity-fill" style="width:${affinity * 10}%"></div></div>
      </div>
    </div>
    <div class="dialog-box" id="neighbor-dialog">
      ${state.locale === "tr" ? "Hediye ver, konuş, ya da mini drama çöz." : "Give a gift, talk, or resolve a mini drama."}
    </div>
    <div class="btn-row" id="neighbor-actions">
      <button class="btn btn-primary" type="button" data-action="gift" data-id="${id}">${t("neighbor.gift")}</button>
      <button class="btn btn-teal" type="button" data-action="talk" data-id="${id}">${t("neighbor.talk")}</button>
      <button class="btn btn-ember" type="button" data-action="drama" data-id="${id}">${t("neighbor.drama")}</button>
    </div>
  `;
}

function setDialog(html) {
  const box = document.getElementById("neighbor-dialog");
  if (box) box.innerHTML = html;
}

function doGift(id) {
  const n = neighborById(id);
  const lines = n.giftLines;
  const used = state.giftUsed[id] || 0;
  const line = lines[Math.min(used, lines.length - 1)];
  state.giftUsed[id] = used + 1;
  bumpAffinity(id, line.affinityDelta);
  setDialog(`<p>${loc(line.text)}</p><p class="muted">+${line.affinityDelta} ${t("neighbor.affinity")}</p>`);
  renderNeighbor(id);
  setDialog(`<p>${loc(line.text)}</p><p class="muted">+${line.affinityDelta} ${t("neighbor.affinity")}</p>`);
}

function doTalk(id) {
  const n = neighborById(id);
  const idx = state.talkIdx[id] % n.talkLines.length;
  const line = n.talkLines[idx];
  state.talkIdx[id] = idx + 1;
  bumpAffinity(id, 1);
  renderNeighbor(id);
  setDialog(`<p>${loc(line.text)}</p><p class="muted">+1 ${t("neighbor.affinity")}</p>`);
}

function doDrama(id) {
  const n = neighborById(id);
  const d = n.drama;
  setDialog(`
    <p class="prompt">${loc(d.prompt)}</p>
    <div class="choice-stack">
      ${d.choices
        .map(
          (c) =>
            `<button class="btn btn-secondary" type="button" data-action="drama-choice" data-nid="${id}" data-cid="${c.id}">${loc(c.label)}</button>`
        )
        .join("")}
    </div>
  `);
  const actions = document.getElementById("neighbor-actions");
  if (actions) actions.style.display = "none";
}

function resolveDrama(nid, cid) {
  const n = neighborById(nid);
  const choice = n.drama.choices.find((c) => c.id === cid);
  if (!choice) return;
  bumpAffinity(nid, choice.affinityDelta);
  for (const [trait, delta] of Object.entries(choice.traitDeltas || {})) {
    state.traits[nid][trait] = (state.traits[nid][trait] || 0) + delta;
  }
  state.visitedDrama[nid] = true;
  renderNeighbor(nid);
  setDialog(
    `<p>${loc(choice.label)} ✓</p><p class="muted">+${choice.affinityDelta} ${t("neighbor.affinity")}</p>`
  );
}

function bumpAffinity(id, delta) {
  state.affinity[id] = Math.max(0, Math.min(10, (state.affinity[id] || 0) + delta));
}

function porchCheckin() {
  if (state.checkinDone) {
    toast(state.locale === "tr" ? "Bugünkü çay içildi." : "Today's tea already sipped.");
    return;
  }
  state.checkinDone = true;
  for (const n of state.content.neighbors) bumpAffinity(n.id, 1);
  toast(t("street.mood_tea") + " (+1)");
}

function overnightIdle() {
  for (const n of state.content.neighbors) {
    const gain = 1 + Math.floor(Math.random() * 3);
    bumpAffinity(n.id, gain);
  }
  state.checkinDone = false;
  toast(t("idle.overnight"));
}

function renderCupLobby() {
  const screen = document.getElementById("screen-cup");
  const cards = state.content.neighbors
    .map((n) => {
      const selected = state.cupPicks.includes(n.id);
      return `
        <button class="pick-card ${selected ? "selected" : ""}" type="button" data-action="toggle-pick" data-id="${n.id}">
          <img src="${bust(n.id)}" alt="" />
          <div class="name">${loc(n.name)}</div>
          <div class="muted" style="font-size:0.65rem">${n.role}</div>
        </button>`;
    })
    .join("");

  const ready = state.cupPicks.length === 3;
  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("cup.lobby_title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-street">${t("common.back")}</button>
    </div>
    <div class="arena-hero" style="background-image:url('${ART.arenaStage}')"></div>
    <p class="street-hint">${t("cup.pick_three")}</p>
    <div class="pick-grid">${cards}</div>
    <p class="pick-status">${ready ? "3/3" : `${state.cupPicks.length}/3 — ${t("cup.locked_need_three")}`}</p>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="goto-draft" ${ready ? "" : "disabled"}>${t("cup.start")}</button>
    </div>
  `;
}

function togglePick(id) {
  const i = state.cupPicks.indexOf(id);
  if (i >= 0) state.cupPicks.splice(i, 1);
  else if (state.cupPicks.length < 3) state.cupPicks.push(id);
  else toast(t("cup.locked_need_three"));
  renderCupLobby();
}

function renderDraft() {
  const screen = document.getElementById("screen-draft");
  const bot = state.content.botCupRoster;
  const enemyIds = bot.defaultLineup;

  const allyCells = state.placement
    .map((pid, idx) => {
      const filled = pid ? `<img src="${bust(pid)}" alt="" />` : "";
      return `<button class="cell ${pid ? "filled" : ""}" type="button" data-action="place-cell" data-idx="${idx}">${filled}</button>`;
    })
    .join("");

  const enemyCells = Array.from({ length: 6 }, (_, idx) => {
    const botId = enemyIds[idx] || null;
    if (!botId) return `<div class="cell enemy"></div>`;
    const unit = bot.units.find((u) => u.id === botId);
    const mirror = unit?.mirrorOf || "n2";
    return `<div class="cell enemy filled"><img src="${bust(mirror)}" alt="${loc(unit.name)}" /></div>`;
  }).join("");

  // Show enemy only in first 3 front/back sensible slots: indices 0,1,2 for front visually in enemy row
  // We'll show them in a 2x3 with defaultLineup in slots 0,1,3 (front two + back)
  const enemyLayout = [enemyIds[0], enemyIds[1], null, enemyIds[2], null, null];
  const enemyHtml = enemyLayout
    .map((botId) => {
      if (!botId) return `<div class="cell enemy"></div>`;
      const unit = bot.units.find((u) => u.id === botId);
      return `<div class="cell enemy filled"><img src="${bust(unit.mirrorOf)}" alt="" /></div>`;
    })
    .join("");

  const bench = state.cupPicks
    .map((id) => {
      const placed = state.placement.includes(id);
      const selected = state.selectedBench === id;
      return `
        <button class="bench-unit ${placed ? "placed" : ""} ${selected ? "selected" : ""}" type="button" data-action="select-bench" data-id="${id}" ${placed ? "disabled" : ""}>
          <img src="${bust(id)}" alt="" />
        </button>`;
    })
    .join("");

  const placedCount = state.placement.filter(Boolean).length;
  void enemyCells;

  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("draft.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-cup">${t("common.back")}</button>
    </div>
    <p class="street-hint">${t("draft.hint")}</p>
    <div class="placement-board">
      <div>
        <div class="grid-label">${state.locale === "tr" ? "Sen (2×3)" : "You (2×3)"}</div>
        <div class="grid-side">${allyCells}</div>
      </div>
      <div>
        <div class="grid-label">${loc(bot.label)}</div>
        <div class="grid-side">${enemyHtml}</div>
      </div>
    </div>
    <div class="bench">${bench}</div>
    <div class="btn-row">
      <button class="btn btn-secondary" type="button" data-action="auto-place">${state.locale === "tr" ? "Otomatik yerleştir" : "Auto-place"}</button>
      <button class="btn btn-primary" type="button" data-action="start-fight" ${placedCount === 3 ? "" : "disabled"}>${t("draft.confirm")}</button>
    </div>
  `;
}

function selectBench(id) {
  state.selectedBench = id;
  renderDraft();
}

function placeCell(idx) {
  const current = state.placement[idx];
  if (current) {
    state.placement[idx] = null;
    state.selectedBench = current;
    renderDraft();
    return;
  }
  if (!state.selectedBench) {
    toast(state.locale === "tr" ? "Önce birim seç" : "Pick a unit first");
    return;
  }
  if (state.placement.includes(state.selectedBench)) return;
  state.placement[idx] = state.selectedBench;
  state.selectedBench = null;
  renderDraft();
}

function autoPlace() {
  state.placement = [null, null, null, null, null, null];
  state.cupPicks.forEach((id, i) => {
    state.placement[i] = id;
  });
  state.selectedBench = null;
  renderDraft();
}

function activeSynergies(tags) {
  return state.content.synergies.filter((s) => {
    const count = s.tagsRequired.reduce((acc, tag) => acc + tags.filter((t) => t === tag).length, 0);
    return count >= s.minCount;
  });
}

function makeFighter(neighborId, side, slot) {
  const n = neighborById(neighborId);
  const base = { ...UNIT_STATS[neighborId] };
  const aff = state.affinity[neighborId] || 0;
  base.hp += aff * 2;
  base.atk += Math.floor(aff / 3);
  return {
    id: neighborId,
    side,
    slot,
    name: loc(n.name),
    synergyTag: n.synergyTag,
    role: n.role,
    maxHp: base.hp,
    hp: base.hp,
    atk: base.atk,
    def: base.def,
    spd: base.spd,
    alive: true,
    damageDealt: 0,
  };
}

function makeBotFighter(botUnit, slot) {
  const stats = botUnit.stats;
  return {
    id: botUnit.id,
    mirrorOf: botUnit.mirrorOf,
    side: "enemy",
    slot,
    name: loc(botUnit.name),
    synergyTag: botUnit.synergyTag,
    role: botUnit.role,
    maxHp: stats.hp,
    hp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    alive: true,
    damageDealt: 0,
  };
}

function startFight() {
  if (state.fightTimer) {
    clearInterval(state.fightTimer);
    state.fightTimer = null;
  }

  const allyIds = state.placement.filter(Boolean);
  const bot = state.content.botCupRoster;
  const enemyUnits = bot.defaultLineup.map((id, i) => {
    const u = bot.units.find((x) => x.id === id);
    return makeBotFighter(u, i);
  });
  const allies = allyIds.map((id, i) => makeFighter(id, "ally", i));

  const allyTags = allies.map((a) => a.synergyTag);
  const enemyTags = enemyUnits.map((a) => a.synergyTag);
  const allySyn = activeSynergies(allyTags);
  const enemySyn = activeSynergies(enemyTags);

  const battle = {
    allies,
    enemies: enemyUnits,
    allySyn,
    enemySyn,
    elapsed: 0,
    finished: false,
    log: [],
  };

  renderFight(battle);
  showScreen("screen-fight");

  const tickMs = 400;
  state.fightTimer = setInterval(() => {
    if (battle.finished) return;
    battle.elapsed += tickMs / 1000;
    combatTick(battle);
    updateFightUI(battle);
    if (battle.elapsed >= 75 || !battle.allies.some((u) => u.alive) || !battle.enemies.some((u) => u.alive)) {
      endFight(battle);
    }
  }, tickMs);
}

function combatTick(battle) {
  const livingAllies = battle.allies.filter((u) => u.alive);
  const livingEnemies = battle.enemies.filter((u) => u.alive);
  if (!livingAllies.length || !livingEnemies.length) return;

  applySynergies(battle);

  const order = [...livingAllies, ...livingEnemies].sort((a, b) => b.spd - a.spd);
  for (const attacker of order) {
    if (!attacker.alive) continue;
    const foes = attacker.side === "ally" ? battle.enemies.filter((u) => u.alive) : battle.allies.filter((u) => u.alive);
    if (!foes.length) break;
    let target = foes[0];
    for (const f of foes) {
      if (f.hp < target.hp) target = f;
    }

    // Neon Night dodge
    const syns = attacker.side === "ally" ? battle.enemySyn : battle.allySyn;
    const neon = syns.find((s) => s.rules.type === "opening_dodge");
    if (neon && battle.elapsed <= neon.rules.windowSec && Math.random() < neon.rules.dodgeChance) {
      battle.log.push(`${target.name} dodge`);
      flashUnit(target.side, target.slot, false);
      continue;
    }

    let dmg = Math.max(1, attacker.atk - Math.floor(target.def * 0.45));

    // Rivalry low HP buff
    const selfSyn = attacker.side === "ally" ? battle.allySyn : battle.enemySyn;
    const rivalry = selfSyn.find((s) => s.rules.type === "low_hp_damage_buff");
    if (rivalry && attacker.hp / attacker.maxHp <= rivalry.rules.hpThresholdPercent) {
      dmg = Math.floor(dmg * (1 + rivalry.rules.damageBonusPercent));
    }

    // Chaos glass / AoE splash light
    if (attacker.role === "AoE") {
      for (const f of foes) {
        const splash = f === target ? dmg : Math.max(1, Math.floor(dmg * 0.35));
        applyDamage(f, splash, attacker);
      }
    } else {
      applyDamage(target, dmg, attacker);
    }

    // Soft healer tick occasionally
    if (attacker.role === "Healer" || attacker.synergyTag === "Oven") {
      const friends = attacker.side === "ally" ? battle.allies : battle.enemies;
      const hurt = friends.filter((u) => u.alive && u.hp < u.maxHp).sort((a, b) => a.hp - b.hp)[0];
      if (hurt) {
        const heal = Math.max(2, Math.floor(attacker.atk * 0.6));
        hurt.hp = Math.min(hurt.maxHp, hurt.hp + heal);
      }
    }

    flashUnit(target.side, target.slot, true);
  }

  // Tea Circle periodic heal
  for (const side of ["ally", "enemy"]) {
    const syns = side === "ally" ? battle.allySyn : battle.enemySyn;
    const tea = syns.find((s) => s.rules.type === "periodic_heal_aura");
    if (!tea) continue;
    if (Math.floor(battle.elapsed / tea.rules.intervalSec) !== Math.floor((battle.elapsed - 0.4) / tea.rules.intervalSec)) {
      const units = side === "ally" ? battle.allies : battle.enemies;
      for (const u of units) {
        if (!u.alive) continue;
        u.hp = Math.min(u.maxHp, u.hp + Math.floor(u.maxHp * tea.rules.healPercentMaxHp));
      }
    }
  }
}

function applySynergies(_battle) {
  // Synergies applied inline during ticks; kept for clarity/extension.
}

function applyDamage(target, dmg, attacker) {
  target.hp -= dmg;
  attacker.damageDealt += dmg;
  if (target.hp <= 0) {
    target.hp = 0;
    target.alive = false;
  }
}

function flashUnit(side, slot, hit) {
  const node = document.querySelector(`.unit-slot[data-side="${side}"][data-slot="${slot}"]`);
  if (!node || !hit) return;
  node.classList.remove("hit");
  void node.offsetWidth;
  node.classList.add("hit");
}

function renderFight(battle) {
  const screen = document.getElementById("screen-fight");
  const synPills = [...battle.allySyn, ...battle.enemySyn]
    .map((s) => `<span class="chip ${s.tagsRequired[0].toLowerCase()}">${loc(s.name)}</span>`)
    .join("") || `<span class="muted">${t("synergy.active")}: —</span>`;

  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("fight.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="skip-fight">${t("fight.skip")}</button>
    </div>
    <div class="fight-hud" style="margin-bottom:0.35rem">
      <span id="ally-hp-total"></span>
      <span id="fight-timer">0s</span>
      <span id="enemy-hp-total"></span>
    </div>
    <div class="fight-stage" style="background-image:url('${ART.arenaStage}')">
      <div class="fight-row" id="enemy-row"></div>
      <div class="fight-row" id="ally-row"></div>
    </div>
    <div class="synergy-pills">${synPills}</div>
  `;
  screen._battle = battle;
  updateFightUI(battle);
}

function unitCard(u, side) {
  const img = bust(u.mirrorOf || u.id);
  const pct = Math.max(0, Math.round((u.hp / u.maxHp) * 100));
  return `
    <div class="unit-slot ${side === "enemy" ? "enemy" : ""} ${u.alive ? "" : "dead"}" data-side="${side}" data-slot="${u.slot}">
      <img src="${img}" alt="${u.name}" />
      <div class="hp-track"><div class="hp-fill" style="width:${pct}%"></div></div>
    </div>`;
}

function updateFightUI(battle) {
  const enemyRow = document.getElementById("enemy-row");
  const allyRow = document.getElementById("ally-row");
  if (!enemyRow || !allyRow) return;
  enemyRow.innerHTML = battle.enemies.map((u) => unitCard(u, "enemy")).join("");
  allyRow.innerHTML = battle.allies.map((u) => unitCard(u, "ally")).join("");
  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const a = document.getElementById("ally-hp-total");
  const e = document.getElementById("enemy-hp-total");
  const tm = document.getElementById("fight-timer");
  if (a) a.textContent = `${state.locale === "tr" ? "Sen" : "You"} ${allyHp}`;
  if (e) e.textContent = `Bot ${enemyHp}`;
  if (tm) tm.textContent = `${Math.floor(battle.elapsed)}s`;
}

function endFight(battle) {
  if (battle.finished) return;
  battle.finished = true;
  if (state.fightTimer) {
    clearInterval(state.fightTimer);
    state.fightTimer = null;
  }
  const allyHp = battle.allies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const enemyHp = battle.enemies.reduce((s, u) => s + Math.max(0, u.hp), 0);
  const won = allyHp >= enemyHp;
  const mvpUnit = [...battle.allies].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  const syn = battle.allySyn[0] || null;
  const winnerName = won
    ? state.locale === "tr"
      ? "Senin Porch"
      : "Your Porch"
    : loc(state.content.botCupRoster.label);

  state.lastResult = {
    won,
    allyHp,
    enemyHp,
    mvp: mvpUnit?.name || "—",
    mvpId: mvpUnit?.id || state.cupPicks[0],
    synergy: syn ? loc(syn.name) : state.locale === "tr" ? "Solo trait" : "Solo trait",
    synergyId: syn?.id || null,
    winner: winnerName,
    team: state.cupPicks.slice(),
  };

  renderComic();
  showScreen("screen-comic");
}

function skipFight() {
  const screen = document.getElementById("screen-fight");
  const battle = screen?._battle;
  if (!battle || battle.finished) return;
  // Fast-forward a few ticks then settle by HP
  for (let i = 0; i < 20 && !battle.finished; i++) {
    battle.elapsed += 2;
    combatTick(battle);
  }
  endFight(battle);
}

function renderComicShell() {
  // placeholder until result
  const screen = document.getElementById("screen-comic");
  if (!state.lastResult) {
    screen.innerHTML = `<div class="topbar"><h2>${t("comic.title")}</h2></div>`;
  }
}

function renderComic() {
  const r = state.lastResult;
  const comic = state.content.matchComic;
  const vars = { winner: r.winner, synergy: r.synergy, mvp: r.mvp };
  const panels = comic.panels
    .map((p, i) => {
      const imgId = r.team[i % r.team.length];
      return `
        <article class="comic-panel" style="animation-delay:${i * 0.08}s">
          <img src="${bust(imgId)}" alt="" />
          <p>${fillTemplate(loc(p.textTemplate), vars)}</p>
        </article>`;
    })
    .join("");

  const shareText = fillTemplate(loc(state.content.uiStrings["comic.share_text"]), vars);
  const screen = document.getElementById("screen-comic");
  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("comic.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-street">${t("common.continue")}</button>
    </div>
    <p class="result-banner ${r.won ? "win" : "lose"}">${r.won ? t("common.win") : t("common.lose")}</p>
    <p class="street-hint muted">${t("fight.hp_total")}: ${r.allyHp} vs ${r.enemyHp}</p>
    <div class="comic-panels">${panels}</div>
    <div class="btn-row">
      <button class="btn btn-primary" type="button" data-action="share-copy" data-text="${encodeURIComponent(shareText)}">${t("comic.copy_text")}</button>
      <button class="btn btn-teal" type="button" data-action="share-export">${t("comic.export_image")}</button>
      <button class="btn btn-secondary" type="button" data-action="share-native" data-text="${encodeURIComponent(shareText)}">${t("comic.share")}</button>
    </div>
  `;
  screen._shareText = shareText;
}

async function copyShare(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(state.locale === "tr" ? "Kopyalandı" : "Copied");
  } catch {
    toast(text);
  }
}

async function nativeShare(text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: t("app.title"), text });
      return;
    } catch {
      /* fall through */
    }
  }
  copyShare(text);
}

function exportShareImage() {
  const r = state.lastResult;
  if (!r) return;
  const canvas = el.canvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#1A1612";
  ctx.fillRect(0, 0, w, h);

  const arena = new Image();
  arena.onload = () => {
    ctx.drawImage(arena, 0, 0, w, Math.floor(h * 0.42));
    ctx.fillStyle = "rgba(26,22,18,0.55)";
    ctx.fillRect(0, 0, w, Math.floor(h * 0.42));

    ctx.fillStyle = "#F2E6D8";
    ctx.font = "bold 64px Fraunces, serif";
    ctx.fillText(t("app.title"), 64, 120);
    ctx.font = "bold 48px Nunito, sans-serif";
    ctx.fillStyle = r.won ? "#F5C878" : "#FF6B4A";
    ctx.fillText(r.won ? t("common.win") : t("common.lose"), 64, 190);

    const ids = r.team;
    let loaded = 0;
    ids.forEach((id, i) => {
      const img = new Image();
      img.onload = () => {
        const size = 260;
        const x = 80 + i * (size + 40);
        const y = 520;
        ctx.drawImage(img, x, y, size, size);
        loaded += 1;
        if (loaded === ids.length) {
          ctx.fillStyle = "#F2E6D8";
          ctx.font = "32px Nunito, sans-serif";
          const share = fillTemplate(loc(state.content.uiStrings["comic.share_text"]), {
            winner: r.winner,
            synergy: r.synergy,
            mvp: r.mvp,
          });
          wrapText(ctx, share, 64, 920, w - 128, 40);
          canvas.toBlob((blob) => {
            if (!blob) {
              toast("Export stub OK");
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "rival-porch-cup.png";
            a.click();
            URL.revokeObjectURL(url);
            toast(state.locale === "tr" ? "Görsel indirildi (stub)" : "Image downloaded (stub)");
          });
        }
      };
      img.src = bust(id);
    });
  };
  arena.src = ART.arenaStage;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, yy);
      line = word + " ";
      yy += lineHeight;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, yy);
}

function renderShop() {
  const screen = document.getElementById("screen-shop");
  screen.innerHTML = `
    <div class="topbar">
      <h2>${t("shop.title")}</h2>
      <button class="btn btn-secondary" type="button" data-action="goto-title">${t("common.back")}</button>
    </div>
    <div class="dialog-box" style="margin-top:2rem;text-align:center">
      <p style="font-size:1.2rem;font-weight:800;margin:0 0 0.5rem">${t("shop.placeholder")}</p>
      <p class="muted">Ads: off</p>
    </div>
  `;
}

function onAction(action, target) {
  switch (action) {
    case "toggle-lang":
      setLocale(state.locale === "tr" ? "en" : "tr");
      showScreen("screen-title");
      break;
    case "start":
      showScreen("screen-street");
      break;
    case "goto-title":
      showScreen("screen-title");
      break;
    case "goto-street":
      renderStreet();
      showScreen("screen-street");
      break;
    case "goto-cup":
      renderCupLobby();
      showScreen("screen-cup");
      break;
    case "goto-draft":
      state.placement = [null, null, null, null, null, null];
      state.selectedBench = null;
      renderDraft();
      showScreen("screen-draft");
      break;
    case "open-shop":
      renderShop();
      showScreen("screen-shop");
      break;
    case "open-neighbor":
      renderNeighbor(target.dataset.id);
      showScreen("screen-neighbor");
      break;
    case "gift":
      doGift(target.dataset.id);
      break;
    case "talk":
      doTalk(target.dataset.id);
      break;
    case "drama":
      doDrama(target.dataset.id);
      break;
    case "drama-choice":
      resolveDrama(target.dataset.nid, target.dataset.cid);
      break;
    case "checkin":
      porchCheckin();
      break;
    case "idle-night":
      overnightIdle();
      break;
    case "toggle-pick":
      togglePick(target.dataset.id);
      break;
    case "select-bench":
      selectBench(target.dataset.id);
      break;
    case "place-cell":
      placeCell(Number(target.dataset.idx));
      break;
    case "auto-place":
      autoPlace();
      break;
    case "start-fight":
      startFight();
      break;
    case "skip-fight":
      skipFight();
      break;
    case "share-copy":
      copyShare(decodeURIComponent(target.dataset.text || ""));
      break;
    case "share-native":
      nativeShare(decodeURIComponent(target.dataset.text || ""));
      break;
    case "share-export":
      exportShareImage();
      break;
    default:
      break;
  }
}

el.app.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  onAction(target.dataset.action, target);
});

async function boot() {
  try {
    const res = await fetch("data/content.json");
    if (!res.ok) throw new Error(`content.json ${res.status}`);
    state.content = await res.json();
    initAffinity();
    buildShell();
    setLocale(state.content.localeDefault || "tr");
    showScreen("screen-title");
  } catch (err) {
    el.app.innerHTML = `<div class="loading">Failed to load content.json<br/><code>${String(err)}</code></div>`;
  }
}

boot();
