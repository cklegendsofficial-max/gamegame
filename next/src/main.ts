import "./style.css";
import "./i18n-road";
import { Application, CullerPlugin, extensions } from "pixi.js";
import { generate, H, W } from "./world/gen";
import { WorldView } from "./render/worldView";
import { WorldView3D } from "./render/world3d";
import type { IWorldView } from "./render/iWorldView";
import { Camera } from "./render/camera";
import { Game } from "./game/game";
import { Hud } from "./ui/hud";
import { applyUi, initA11y, settings, watchFps } from "./settings";
import { glbCount } from "./render/world3d/Models";
import { localizeData } from "./i18n-data";
import { t } from "./i18n";
import { cloudPull, cloudPush, deckDefaults, steam, steamPresence, steamStats, syncAchievements } from "./platform";
import { unlockedSet } from "./game/achievements";
import { loadMods } from "./mods";
import { PhotoMode } from "./ui/photo";

async function boot(): Promise<void> {
  extensions.add(CullerPlugin);
  deckDefaults();
  applyUi();
  initA11y();
  const restored = cloudPull();
  if (restored) console.log("steam cloud restored", restored);
  document.documentElement.lang = settings.lang ?? "tr";
  localizeData();
  loadMods();
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  const host = document.getElementById("game")!;
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.width = "100%";
  host.style.height = "100%";

  const t0 = performance.now();
  const world = generate();
  console.log("world gen ms", Math.round(performance.now() - t0));

  // Ayarlar.world3d tek kapı — weakDevice ile sessizce 2D’ye düşürme (GLB hiç yüklenmezdi)
  const want3d = !!settings.world3d;

  type Booted = {
    view: IWorldView;
    canvas: HTMLCanvasElement;
    renderPhoto: () => void;
    loop: (fn: (dt: number) => void) => void;
  };

  const boot2d = async (): Promise<Booted> => {
    const app = new Application();
    await app.init({
      resizeTo: host,
      background: "#1c120a",
      antialias: !settings.eco,
      resolution: settings.eco ? 1 : Math.min(2, window.devicePixelRatio || 1),
      autoDensity: true,
    });
    if (settings.eco) app.ticker.maxFPS = 30;
    host.appendChild(app.canvas);
    await new Promise((r) => setTimeout(r, 30));
    const view2 = new WorldView(app, world);
    await view2.load();
    return {
      view: view2,
      canvas: app.canvas as HTMLCanvasElement,
      renderPhoto: () => app.render(),
      loop: (fn) => {
        app.ticker.add((tk) => fn(Math.min(0.1, tk.deltaMS / 1000)));
      },
    };
  };

  let booted: Booted;
  if (want3d) {
    try {
      const view3 = new WorldView3D(host, world);
      await view3.load();
      booted = {
        view: view3,
        canvas: view3.canvas,
        renderPhoto: () => view3.renderFrame(),
        loop: (fn) => {
          let last = performance.now();
          const tick = (now: number) => {
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            fn(dt);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        },
      };
      console.log("world view: 3D", glbCount(), "glb");
    } catch (e) {
      console.warn("WorldView3D failed, falling back to 2D", e);
      host.querySelectorAll("canvas").forEach((n) => n.remove());
      [...host.children].forEach((n) => {
        if (n instanceof HTMLElement && n.style.pointerEvents === "none" && n.style.position === "absolute") n.remove();
      });
      booted = await boot2d();
      console.log("world view: 2D (fallback)");
    }
  } else {
    booted = await boot2d();
    console.log("world view: 2D");
  }
  const { view, canvas, renderPhoto, loop } = booted;

  const cam = new Camera(canvas, W, H);
  const game = new Game(world, view, cam);
  const hud = new Hud(game);
  game.hud = hud;
  game.maybeShowRecap();
  void game.treasury.init();
  view.attachState(game);
  (window as unknown as { game: Game }).game = game;
  if (want3d && booted.view.constructor.name === "WorldView3D") {
    hud.toast(t("3D dünya · {n} model hazır — yakınlaşınca şehir/kale/yurt .glb yüklenir", { n: glbCount() }), "info");
  }
  if (import.meta.env.DEV) void import("./ui/admin").then((m) => m.mountAdmin(game));
  const photo = new PhotoMode({ canvas, render: renderPhoto }, game);
  hud.photo = photo;
  cam.fitMin();
  if (view.pickGround) cam.picker = (sx, sy, lift) => view.pickGround!(sx, sy, lift);
  cam.onTap = (x, y, alt) => !photo.on && game.tap(x, y, alt);
  const fpsWatch = watchFps();
  document.body.addEventListener("kk-gfx", ((e: CustomEvent<string>) => {
    hud.toast(
      e.detail === "mid" ? t("FPS düşük — görüntü orta kaliteye düştü") : t("FPS düşük — pil tasarrufu (düşük kalite)"),
      "info",
    );
  }) as EventListener);
  loop((dt) => {
    fpsWatch(dt);
    if (hud.menuOpen) hud.menuTick(dt);
    else if (!photo.on) for (let i = hud.speed(); i > 0; i--) game.update(dt);
    cam.update(dt, view.layer);
    view.update(dt, game, cam);
    hud.update();
  });
  window.addEventListener("resize", () => cam.fitMin());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) game.markAway();
    else {
      const sum = game.consumeAwaySummary();
      if (sum) {
        hud.notice(
          "j_caravan",
          t("Yokken geçen günler"),
          t("{d} gün geçti. Kervansaray ve vergilerden +{g} altın. Haritada {n} olay birikti.", {
            d: sum.days,
            g: sum.gold,
            n: sum.events,
          }),
          () => {},
          8000,
        );
      }
    }
  });
  document.getElementById("loading")!.remove();
  if (steam) {
    syncAchievements(unlockedSet());
    const tick = () => {
      const s = game.s;
      const ch = game.chapter();
      steamPresence(`${s.hero.name} · ${t("Seviye")} ${s.hero.lv}${ch ? ` · ${ch.title}` : ""}`);
      steamStats({ level: s.hero.lv, renown: s.renown, kills: s.kills, profit: s.c.profit, conquests: s.c.conquests ?? 0 });
    };
    tick();
    setInterval(tick, 60_000);
    window.addEventListener("beforeunload", () => cloudPush(true));
  }
}

void boot();
