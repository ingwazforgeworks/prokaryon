/**
 * Post-build asset link check. Runs after copy-static.mjs so it validates the
 * exact tree that production serves. Fails the build when a referenced asset
 * is missing, so folder reorganizations cannot silently break art links.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const dist = path.join(clientRoot, "dist");
const src = path.join(clientRoot, "src");

if (!fs.existsSync(dist)) {
  throw new Error("dist is missing; run vite build and copy-static first");
}

const missing = [];
const geneSpriteGaps = [];

function expect(distRelative, why) {
  if (!fs.existsSync(path.join(dist, distRelative))) {
    missing.push(`${distRelative}  (${why})`);
  }
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

// 1. Static asset URLs quoted in index.html and src/*.ts.
const staticUrl =
  /["'`](\/(?:ui|branding|resources|atmosphere|environment|fonts|ui-sounds)\/[^"'`\s)]+?\.(?:png|json|woff2?|otf|mp3|wav|ogg))["'`]/g;
const sourceFiles = [
  path.join(clientRoot, "index.html"),
  ...fs
    .readdirSync(src)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".css"))
    .map((name) => path.join(src, name)),
];
for (const file of sourceFiles) {
  const where = path.relative(clientRoot, file);
  for (const match of read(file).matchAll(staticUrl)) {
    if (match[1].includes("${")) continue;
    expect(decodeURIComponent(match[1]), `referenced in ${where}`);
  }
}

// 2. Per-gene protein sprites in both sizes. A missing sprite is a content gap
// the UI tolerates (the image simply fails to load), so it warns instead of
// failing the build.
const geneIds = [...read(path.join(src, "genes.ts")).matchAll(/"id": "([A-Za-z0-9]+)"/g)].map((m) => m[1]);
for (const id of geneIds) {
  for (const [file, label] of [
    [`ui/genome_viewer/proteins/individuals/${id}.png`, "large sprite"],
    [`ui/genome_viewer/proteins/individuals_32x32/${id}.png`, "icon"],
  ]) {
    if (!fs.existsSync(path.join(dist, file))) geneSpriteGaps.push(`${file}  (gene ${id} ${label})`);
  }
}

// 3. Genome viewer category icons (whitelist mirrors genomeViewer.ts).
for (const slug of ["metabolism", "homeostasis", "morphology", "motility", "perception", "regulation", "reproduction"]) {
  expect(`ui/genome_viewer/categories/${slug}_32x32.png`, `category ${slug}`);
}

// 4. Regulatory and localization icons built from genomeState.ts constants.
const stateText = read(path.join(src, "genomeState.ts"));
const iconDirs = {
  REGULATORY_ICON_DIR: /const REGULATORY_ICON_DIR = "([^"]+)"/.exec(stateText)?.[1],
  TAG_ICON_DIR: /const TAG_ICON_DIR = "([^"]+)"/.exec(stateText)?.[1],
};
for (const [constant, dir] of Object.entries(iconDirs)) {
  if (!dir) throw new Error(`cannot find ${constant} in genomeState.ts`);
  for (const match of stateText.matchAll(new RegExp(`\\$\\{${constant}\\}/([a-z0-9_]+\\.png)`, "g"))) {
    expect(`${dir.slice(1)}/${match[1]}`, `${constant} entry in genomeState.ts`);
  }
}

// 5. Resource bar sprites from the resources.ts catalog.
for (const match of read(path.join(src, "resources.ts")).matchAll(/file: "([^"]+\.png)"/g)) {
  expect(`resources/${match[1]}`, `resource catalog entry`);
}

// 6. Terrain patch, vent, fiber, and debris names.
const terrainText = read(path.join(src, "terrain.ts"));
for (const [constant, folder] of [
  ["PATCHES", "environment/decorations"],
  ["FIBERS", "environment/decorations"],
  ["DEBRIS", "environment/decorations"],
  ["VENTS", "environment/geothermal"],
]) {
  const declaration = new RegExp(`const ${constant} = \\[([^\\]]+)\\]`).exec(terrainText);
  if (!declaration) throw new Error(`cannot find ${constant} in terrain.ts`);
  for (const name of declaration[1].matchAll(/"([^"]+)"/g)) {
    expect(`${folder}/${name[1]}.png`, `${constant} entry in terrain.ts`);
  }
}

// 7. Decoration files and the cut-sprite manifest they are sliced from.
const decorationsText = read(path.join(src, "decorations.ts"));
for (const match of decorationsText.matchAll(/file\("([^"]+)", "([^"]+\.png)"/g)) {
  expect(`environment/${match[1]}/${match[2]}`, `decorations.ts file() call`);
}
expect("environment/decorations/cut/index.json", "cut sprite manifest");
const cutIndex = path.join(dist, "environment/decorations/cut/index.json");
if (fs.existsSync(cutIndex)) {
const cutManifest = JSON.parse(read(cutIndex));
const cutSprites = Array.isArray(cutManifest) ? cutManifest : cutManifest.sprites;
if (Array.isArray(cutSprites)) {
  for (const entry of cutSprites) {
    if (entry && typeof entry.file === "string") {
      expect(`environment/decorations/cut/${entry.file}`, "cut sprite manifest entry");
    }
  }
}
}

if (geneSpriteGaps.length > 0) {
  console.warn(`verify-assets: ${geneSpriteGaps.length} gene sprite(s) without art (content gap, not a build failure):`);
  for (const line of geneSpriteGaps) console.warn(`  ${line}`);
}

if (missing.length > 0) {
  console.error(`verify-assets: ${missing.length} missing asset(s):`);
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`verify-assets: all links resolve (${geneIds.length} genes, ${sourceFiles.length} scanned sources)`);