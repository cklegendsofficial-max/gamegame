import type { Game } from "../game/game";
import type { Camera } from "./camera";

/** Overworld görünümü — Pixi WorldView veya Three.js WorldView3D. */
export interface IWorldView {
  fogDirty: boolean;
  /** Kamera pan için sahne kökü; 3D'de no-op stub olabilir. */
  layer: { scale: { set(z: number): void }; position: { set(x: number, y: number): void } };
  load(): Promise<void>;
  attachState(game: Game): void;
  update(dt: number, game: Game, cam: Camera): void;
  heroPortrait(key: string): void;
  levelUpFx(): void;
  craftBurst(color?: number): void;
  marker(x: number, y: number): void;
  /** 3D: ekran noktasını yer düzlemine ışınla (tıkla-git, sürükle). */
  pickGround?(sx: number, sy: number, lift?: number): { x: number; y: number } | null;
  /** Three.js canvas; foto modu / DOM. */
  canvas?: HTMLCanvasElement;
  renderFrame?(): void;
}
