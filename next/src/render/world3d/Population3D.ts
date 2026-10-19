import { Group } from "three";
import { buildBandit, buildCamel, buildNpc, buildSoldier, horseOpts, type Actor, type BanditKind } from "./Actors3D";
import { buildQuadruped } from "./Rigs";
import type { NpcSpot, PlaceModel } from "./Build";

/** Haritadaki figürlerin tek ölçek çarpanı (kamera uzaklığında okunurluk). */
export const ACTOR_MUL = 1.0;
/** Yerle�im i�indeki halk: binalara oranla ger�ek�i (k���k) boy. */
export const PLACE_NPC_MUL = 0.2;

export function actorForSpot(s: NpcSpot, team = 0x7a3a2a, mul = PLACE_NPC_MUL): Actor {
  let a: Actor;
  switch (s.kind) {
    case "bandit":
      a = buildBandit((["sword", "axe", "heavy"] as BanditKind[])[s.seed % 3], s.seed);
      break;
    case "chief":
      a = buildBandit("chief", s.seed);
      break;
    case "soldier":
    case "guard":
      a = buildNpc("guard", s.seed, s.team ?? team);
      break;
    case "archer":
      a = buildSoldier("archer", s.team ?? team, s.seed);
      break;
    case "camel":
      a = buildCamel(s.seed, 0);
      break;
    case "horse":
      a = buildQuadruped({ ...horseOpts(s.seed), saddle: null });
      break;
    default:
      a = buildNpc(s.kind, s.seed, team);
  }
  a.root.scale.multiplyScalar(mul);
  a.height *= mul;
  a.mode = s.mode === "walk" ? "walk" : s.mode;
  return a;
}

interface Live {
  a: Actor;
  s: NpcSpot;
}

/**
 * Bir yerleşimin canlı nüfusu: kapıda bekleyen muhafızlar, çekiç sallayan demirci,
 * dolaşan köylüler. Kameraya yakınken oluşturulur, uzaklaşınca gizlenir.
 */
export class PlaceLife {
  group = new Group();
  private live: Live[] = [];
  private built = false;
  private t0 = Math.random() * 20;

  constructor(
    private place: PlaceModel,
    private team = 0x7a3a2a,
  ) {
    this.group.userData.keep = true; // overlayGlb prosed�rel gizlerken NPC grubunu koru
    place.root.add(this.group);
    this.group.visible = false;
  }

  private build(): void {
    this.built = true;
    for (const s of this.place.npcs) {
      const a = actorForSpot(s, this.team);
      a.root.position.set(s.x, 0, s.z);
      a.face(s.yaw);
      this.group.add(a.root);
      this.live.push({ a, s });
    }
  }

  setTeam(col: number): void {
    if (col === this.team) return;
    this.team = col;
    if (!this.built) return;
    for (const l of this.live) this.group.remove(l.a.root);
    this.live = [];
    this.built = false;
    if (this.group.visible) this.build();
  }

  /** `near`: kameraya yakın mı. */
  update(dt: number, t: number, near: boolean): void {
    if (!near) {
      this.group.visible = false;
      return;
    }
    if (!this.built) this.build();
    if (!this.group.visible) for (const l of this.live) l.a.reset();
    this.group.visible = true;
    for (const l of this.live) {
      const w = l.s.walk;
      if (w) {
        const k = (t + this.t0) * w.speed * 5 + w.phase;
        l.a.follow(w.cx + Math.cos(k) * w.rx, 0, w.cz + Math.sin(k) * w.rz, dt, t);
      } else {
        l.a.update(dt, 0, t);
      }
    }
  }
}
