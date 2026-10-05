import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Terrain } from "../src/terrain.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const art = path.resolve(here, "../../../Art/Environment");
const rawDir = path.join(here, ".terrain-raw");
const outFile = path.resolve(here, "../public/terrain-layout.json");
const editsFile = path.resolve(here, "../public/terrain-edits.json");

const groups = {
  patches: ["patch_00", "patch_01", "patch_02", "patch_03", "patch_04", "patch_05"].map((name) => [`decorations/${name}.png`, name]),
  fibers: ["fiber_00", "fiber_01", "fiber_02"].map((name) => [`decorations/${name}.png`, name]),
  debris: ["debris_00", "debris_01", "debris_02", "debris_03"].map((name) => [`decorations/${name}.png`, name]),
} as const;

fs.rmSync(rawDir, { recursive: true, force: true });
fs.mkdirSync(rawDir, { recursive: true });

const listing = [...groups.patches, ...groups.fibers, ...groups.debris].map(([file, name]) => ({ file, name }));
const extract = spawnSync(
  "python",
  [
    "-c",
    `
import json, struct, sys
from pathlib import Path
from PIL import Image
art = Path(sys.argv[1])
out = Path(sys.argv[2])
jobs = json.loads(sys.argv[3])
for job in jobs:
    image = Image.open(art / job["file"]).convert("RGBA")
    width, height = image.size
    (out / f"{job['name']}.raw").write_bytes(struct.pack("<II", width, height) + image.tobytes())
    print(job["name"], width, height)
`,
    art,
    rawDir,
    JSON.stringify(listing),
  ],
  { encoding: "utf8" },
);
if (extract.status !== 0) {
  console.error(extract.stdout);
  console.error(extract.stderr);
  throw new Error("could not read terrain images");
}
console.log(extract.stdout.trim());

function readRaw(name: string) {
  const buffer = fs.readFileSync(path.join(rawDir, `${name}.raw`));
  return { name, width: buffer.readUInt32LE(0), height: buffer.readUInt32LE(4), pixels: buffer.subarray(8) };
}

const gl = {
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  createProgram: () => ({}),
  createShader: () => ({}),
  shaderSource() {},
  compileShader() {},
  getShaderParameter: () => true,
  getShaderInfoLog: () => "",
  attachShader() {},
  linkProgram() {},
  getProgramParameter: () => true,
  getProgramInfoLog: () => "",
  createBuffer: () => ({}),
  bindBuffer() {},
  bufferData() {},
};

const terrain = new Terrain(gl as unknown as WebGL2RenderingContext, false);
const masks = (entries: ReadonlyArray<readonly [string, string]>) => entries.map(([, name]) => {
  const raw = readRaw(name);
  return terrain.maskFromPixels(raw.pixels, raw.width, raw.height, raw.name);
});
console.log("placing seeded terrain...");
const started = Date.now();
const sprites = await terrain.bakeLayout({
  patches: masks(groups.patches),
  fibers: masks(groups.fibers),
  debris: masks(groups.debris),
});
fs.writeFileSync(outFile, JSON.stringify({ v: 1, sprites }));
fs.rmSync(rawDir, { recursive: true, force: true });

const edits = JSON.parse(fs.readFileSync(editsFile, "utf8")) as { removed?: string[] };
const removed = new Set(edits.removed ?? []);
let matched = 0;
for (const sprite of sprites) {
  const key = `${sprite.name}|${sprite.x.toFixed(3)}|${sprite.y.toFixed(3)}|${sprite.rotation.toFixed(4)}`;
  if (removed.has(key)) matched += 1;
}
console.log(`wrote ${sprites.length} sprites in ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(`matched ${matched} saved removals`);
