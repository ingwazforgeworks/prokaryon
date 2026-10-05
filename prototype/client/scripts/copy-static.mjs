import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = path.resolve(clientRoot, "../..");
const dist = path.join(clientRoot, "dist");

const copies = [
  ["Art/Environment", "environment"],
  ["Art/Atmosphere", "atmosphere"],
  ["Art/UI_art", "ui"],
  ["Art/Branding", "branding"],
  ["Art/Resources", "resources"],
  ["Fonts/DepartureMono-1.500", "fonts"],
  ["Sounds/UI_sounds", "ui-sounds"],
  ["Music/game_music", "music"],
  ["Music/theme_music", "theme"],
];

if (!fs.existsSync(dist)) {
  throw new Error("dist is missing; run vite build first");
}

for (const [from, to] of copies) {
  const source = path.join(repoRoot, from);
  if (!fs.existsSync(source)) throw new Error(`missing asset folder ${from}`);
  fs.cpSync(source, path.join(dist, to), { recursive: true });
}

const tracks = fs
  .readdirSync(path.join(repoRoot, "Music/game_music"))
  .filter((name) => name.toLowerCase().endsWith(".mp3"))
  .sort((a, b) => a.localeCompare(b, "en"));
fs.writeFileSync(path.join(dist, "music", "index.json"), JSON.stringify(tracks));
