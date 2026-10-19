/** Eager asset URL map — Hud, BattleField ve 3D/2D view ortak kullanır. */
const urls: Record<string, string> = {};
const add = (entries: Record<string, string>) => {
  for (const [p, u] of Object.entries(entries)) {
    const parts = p.split("/");
    const name = parts[parts.length - 1].replace(/\.(webp|jpg|jpeg)$/i, "");
    urls[parts[parts.length - 2] + "/" + name] = u;
  }
};
add(import.meta.glob<string>("../assets/**/*.webp", { eager: true, query: "?url", import: "default" }));
// cinematic jpg sahneler aynı anahtarı ezer (scene/demirci, scene/han, …)
add(import.meta.glob<string>("../assets/**/*.{jpg,jpeg}", { eager: true, query: "?url", import: "default" }));

export function assetUrl(key: string): string {
  return urls[key] ?? urls["icons/" + key] ?? "";
}

export function assetUrls(): Record<string, string> {
  return urls;
}
