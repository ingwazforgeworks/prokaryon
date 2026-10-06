// Painted decorations on three parallax layers. They never collide with the cell.

import { bootMark, bootPulse } from "./boot";
import type { PackedPointLights } from "./terrain";

const SOURCE_PER_UNIT = 128;

export type DecorationLayer = "back" | "mid" | "fore";

export interface DecorationStamp {
  name: string;
  x: number;
  y: number;
  layer: DecorationLayer;
  rotation: number;
  scale: number;
  border?: boolean;
  borderVersion?: number;
  anchored?: boolean;
  dither?: number;
  haze?: number;
  defocus?: number;
}

export interface DecorationType {
  name: string;
  label: string;
  group: DecorationLayer;
}

const PARALLAX: Record<DecorationLayer, number> = { back: 0.42, mid: 0.78, fore: 1.28 };
const DECO_CELL = 32;

function decoKey(ix: number, iy: number): number {
  return (ix + 64) * 1024 + (iy + 64);
}
const PARALLAX_REACH = 24;
const SCALE: Record<DecorationLayer, number> = { back: 0.82, mid: 1, fore: 1.18 };
const SHADE: Record<DecorationLayer, number> = { back: 0.72, mid: 1, fore: 1 };
const DITHER: Record<DecorationLayer, number> = { back: 0, mid: 0.32, fore: 0 };

const DECO_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRotation;
uniform vec2 uCamera;
uniform vec2 uHalfView;
out vec2 vUv;
out vec2 vWorld;
void main() {
  vec2 local = aCorner * uHalfSize;
  float c = cos(uRotation);
  float s = sin(uRotation);
  vec2 world = uCenter + vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  gl_Position = vec4((world - uCamera) / uHalfView, 0.0, 1.0);
  vUv = vec2(aCorner.x * 0.5 + 0.5, 0.5 - aCorner.y * 0.5);
  vWorld = world;
}`;

const DECO_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vWorld;
uniform sampler2D uSprite;
uniform float uLight;
uniform float uShade;
uniform float uDither;
uniform float uHaze;
uniform float uDefocus;
uniform float uPixelsPerUnit;
uniform vec3 uPointLights[48];
uniform vec3 uPointColors[48];
uniform int uPointCount;
out vec4 fragColor;
float bayer8(vec2 pixel) {
  int x = int(mod(pixel.x, 8.0));
  int y = int(mod(pixel.y, 8.0));
  int index = x + y * 8;
  int pattern[64] = int[64](
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  );
  return float(pattern[index]) / 64.0;
}
vec3 pointGlow(vec2 world) {
  if (uPointCount <= 0) return vec3(0.0);
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    if (i >= uPointCount) break;
    float dist = length(world - uPointLights[i].xy);
    float t = clamp(1.0 - dist / uPointLights[i].z, 0.0, 1.0);
    glow += uPointColors[i] * pow(t, 1.35);
  }
  return glow * 0.24;
}
vec4 readSprite(vec2 uv) {
  if (uDefocus <= 0.001) return texture(uSprite, uv);
  vec2 texel = vec2(uDefocus) / vec2(textureSize(uSprite, 0));
  vec4 sum = texture(uSprite, uv) * 0.28;
  sum += texture(uSprite, uv + vec2(texel.x, 0.0)) * 0.11;
  sum += texture(uSprite, uv - vec2(texel.x, 0.0)) * 0.11;
  sum += texture(uSprite, uv + vec2(0.0, texel.y)) * 0.11;
  sum += texture(uSprite, uv - vec2(0.0, texel.y)) * 0.11;
  sum += texture(uSprite, uv + texel) * 0.05;
  sum += texture(uSprite, uv - texel) * 0.05;
  sum += texture(uSprite, uv + vec2(texel.x, -texel.y)) * 0.05;
  sum += texture(uSprite, uv + vec2(-texel.x, texel.y)) * 0.05;
  sum += texture(uSprite, uv + vec2(texel.x * 2.0, 0.0)) * 0.02;
  sum += texture(uSprite, uv - vec2(texel.x * 2.0, 0.0)) * 0.02;
  sum += texture(uSprite, uv + vec2(0.0, texel.y * 2.0)) * 0.02;
  sum += texture(uSprite, uv - vec2(0.0, texel.y * 2.0)) * 0.02;
  return sum;
}
void main() {
  vec4 tex = readSprite(vUv);
  if (tex.a < 0.04) discard;
  vec3 color = mix(tex.rgb * 0.55, tex.rgb, uLight) * uShade;
  color = mix(color, vec3(0.03, 0.055, 0.066), uHaze);
  color += pointGlow(vWorld) * (1.0 - uHaze * 0.65);
  if (uDither > 0.0 && bayer8(vWorld * uPixelsPerUnit) < uDither) discard;
  fragColor = vec4(color, tex.a);
}`;

interface SpriteDef {
  name: string;
  label: string;
  group: DecorationLayer;
  texture: WebGLTexture;
  hw: number;
  hh: number;
}

/** Sprites cut from the decoration sheets ahead of time. See Art/_tools/split_decoration_sheets.py. */
const CUT_URL = "/environment/decorations/cut";

interface CutSprite {
  file: string;
  group: DecorationLayer;
  label: string;
}

const FILES: Array<{ url: string; group: DecorationLayer; label: string }> = [
  file("decorations", "debris_00.png", "mid", "Debris"),
  file("decorations", "debris_01.png", "mid", "Debris"),
  file("decorations", "debris_02.png", "mid", "Debris"),
  file("decorations", "debris_03.png", "mid", "Debris"),
  file("decorations", "fiber_00.png", "mid", "Fiber"),
  file("decorations", "fiber_01.png", "mid", "Fiber"),
  file("decorations", "fiber_02.png", "mid", "Fiber"),
];

function artUrl(folder: string, name: string): string {
  return `/environment/${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;
}

function file(folder: string, name: string, group: DecorationLayer, label: string): { url: string; group: DecorationLayer; label: string } {
  return { url: artUrl(folder, name), group, label };
}

export class DecorationField {
  private readonly program: WebGLProgram;
  private readonly quad: WebGLBuffer;
  private readonly sprites = new Map<string, SpriteDef>();
  private readonly order: DecorationType[] = [];
  private readonly stamps: DecorationStamp[] = [];
  private counts: Record<string, number> = { Fragment: 0, Tendril: 0, Rock: 0, Edge: 0, Debris: 0, Fiber: 0 };
  private lastStamp: [number, number] | null = null;
  private nextGap = 0.7;
  private anchorMigration = false;
  private ready = false;
  private loadFailed = false;
  private gridDirty = true;
  private readonly decoGrid = new Map<number, number[]>();
  private readonly picked: number[] = [];

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = link(gl, DECO_VS, DECO_FS);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    void this.prepare();
  }

  isReady(): boolean {
    return this.ready;
  }

  settled(): boolean {
    return this.ready || this.loadFailed;
  }

  consumeAnchorMigration(): boolean {
    const pending = this.anchorMigration;
    this.anchorMigration = false;
    return pending;
  }

  plantInnerBorder(hits: (x: number, y: number) => boolean): number {
    const backDone = this.stamps.some((stamp) => stamp.border && stamp.layer === "back" && stamp.borderVersion === 5);
    const foreDone = this.stamps.some((stamp) => stamp.border && stamp.layer === "fore" && stamp.borderVersion === 8);
    if (!this.ready || (backDone && foreDone)) return 0;
    const backNames = this.order.filter((type) => type.group === "back" && !type.name.startsWith("rock_")).map((type) => type.name);
    const foreNames = this.order.filter((type) => type.group === "fore").map((type) => type.name);
    if ((backDone || backNames.length === 0) && (foreDone || foreNames.length === 0)) return 0;
    this.gridDirty = true;
    if (!backDone) {
      for (let index = this.stamps.length - 1; index >= 0; index -= 1) {
        if (this.stamps[index].border && this.stamps[index].layer === "back") this.stamps.splice(index, 1);
      }
    }
    if (!foreDone) {
      for (let index = this.stamps.length - 1; index >= 0; index -= 1) {
        if (this.stamps[index].layer === "fore") this.stamps.splice(index, 1);
      }
    }
    const step = 1.25;
    const x0 = -126;
    const y0 = -506;
    const x1 = 126;
    const y1 = 500;
    const cols = Math.ceil((x1 - x0) / step);
    const rows = Math.ceil((y1 - y0) / step);
    const solid = new Uint8Array(cols * rows);
    const water = new Uint8Array(cols * rows);
    const at = (column: number, row: number): number => row * cols + column;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < cols; column += 1) {
        if (hits(x0 + column * step, y0 + row * step)) solid[at(column, row)] = 1;
      }
    }
    let seed = -1;
    const seedColumn = Math.min(cols - 1, Math.max(0, Math.round((0 - x0) / step)));
    for (let row = rows - 1; row >= 0; row -= 1) {
      const index = at(seedColumn, row);
      if (!solid[index]) {
        seed = index;
        break;
      }
    }
    if (seed < 0) return 0;
    const queue = new Uint32Array(cols * rows);
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    water[seed] = 1;
    while (head < tail) {
      const index = queue[head++];
      const column = index % cols;
      const row = (index / cols) | 0;
      const stepTo = (nextColumn: number, nextRow: number): void => {
        if (nextColumn < 0 || nextRow < 0 || nextColumn >= cols || nextRow >= rows) return;
        const next = at(nextColumn, nextRow);
        if (solid[next] || water[next]) return;
        water[next] = 1;
        queue[tail++] = next;
      };
      stepTo(column - 1, row);
      stepTo(column + 1, row);
      stepTo(column, row - 1);
      stepTo(column, row + 1);
    }
    const shore: number[] = [];
    for (let row = 1; row < rows - 1; row += 1) {
      for (let column = 1; column < cols - 1; column += 1) {
        const index = at(column, row);
        if (!water[index]) continue;
        let awayX = 0;
        let awayY = 0;
        let touched = false;
        for (let oy = -1; oy <= 1; oy += 1) {
          for (let ox = -1; ox <= 1; ox += 1) {
            if (ox === 0 && oy === 0) continue;
            if (solid[at(column + ox, row + oy)]) {
              touched = true;
              awayX -= ox;
              awayY -= oy;
            } else if (water[at(column + ox, row + oy)]) {
              awayX += ox;
              awayY += oy;
            }
          }
        }
        if (!touched) continue;
        const length = Math.hypot(awayX, awayY);
        if (length < 0.45) continue;
        shore.push(index);
      }
    }
    for (let i = shore.length - 1; i > 0; i -= 1) {
      const swap = Math.floor(Math.random() * (i + 1));
      const held = shore[i];
      shore[i] = shore[swap];
      shore[swap] = held;
    }
    let added = 0;
    if (!backDone) added += this.scatterShore(shore, { cols, step, x0, y0, solid, water }, hits, backNames, "back", 5, true);
    if (!foreDone) added += this.scatterShore(shore, { cols, step, x0, y0, solid, water }, hits, foreNames, "fore", 8, false);
    return added;
  }

  private scatterShore(
    shore: number[],
    grid: { cols: number; step: number; x0: number; y0: number; solid: Uint8Array; water: Uint8Array },
    hits: (x: number, y: number) => boolean,
    names: string[],
    layer: DecorationLayer,
    version: number,
    intoWater: boolean,
  ): number {
    if (names.length === 0) return 0;
    const placed: Array<[number, number]> = [];
    let previous = "";
    let added = 0;
    for (const index of shore) {
      const column = index % grid.cols;
      const row = (index / grid.cols) | 0;
      let awayX = 0;
      let awayY = 0;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          if (ox === 0 && oy === 0) continue;
          const neighbor = (row + oy) * grid.cols + (column + ox);
          if (grid.solid[neighbor]) {
            awayX -= ox;
            awayY -= oy;
          } else if (grid.water[neighbor]) {
            awayX += ox;
            awayY += oy;
          }
        }
      }
      const length = Math.hypot(awayX, awayY);
      if (length < 0.45) continue;
      const nx = awayX / length;
      const ny = awayY / length;
      const originX = grid.x0 + column * grid.step;
      const originY = grid.y0 + row * grid.step;
      let travel = 0;
      let rockX = originX;
      let rockY = originY;
      while (travel < grid.step + 0.7 && !hits(rockX, rockY)) {
        travel += 0.28;
        rockX = originX - nx * travel;
        rockY = originY - ny * travel;
      }
      if (!hits(rockX, rockY)) continue;
      const dir = intoWater ? 1 : -1;
      let offset = intoWater ? 0.85 + Math.random() * 0.55 : 1.6 + Math.random() * 0.55;
      let wx = rockX + nx * offset * dir;
      let wy = rockY + ny * offset * dir;
      let guard = 0;
      const seated = (): boolean => (intoWater ? !hits(wx, wy) : hits(wx, wy));
      while (guard < 4 && !seated()) {
        offset += 0.2;
        wx = rockX + nx * offset * dir;
        wy = rockY + ny * offset * dir;
        guard += 1;
      }
      if (!seated() || offset > (intoWater ? 1.85 : 2.6)) continue;
      const slide = (Math.random() - 0.5) * 1.15;
      const slidX = wx - ny * slide;
      const slidY = wy + nx * slide;
      if (intoWater ? !hits(slidX, slidY) : hits(slidX, slidY)) {
        wx = slidX;
        wy = slidY;
      }
      const scale = layer === "fore" ? 1 : 0.7 + Math.random() ** 0.45 * 2.15;
      const separation = layer === "fore" ? 8 : 12 + scale * 4;
      if (placed.some(([px, py]) => Math.hypot(px - wx, py - wy) < separation)) continue;
      const pool = names.length > 1 ? names.filter((name) => name !== previous) : names;
      const name = pool[Math.floor(Math.random() * pool.length)];
      previous = name;
      placed.push([wx, wy]);
      this.stamps.push({
        name,
        x: wx,
        y: wy,
        layer,
        rotation: Math.floor(Math.random() * 24) * (Math.PI / 12),
        scale,
        border: true,
        borderVersion: version,
        anchored: true,
      });
      added += 1;
    }
    return added;
  }

  plantFarRocks(hits: (x: number, y: number) => boolean): number {
    const version = 7;
    const done = this.stamps.some((stamp) => stamp.border && stamp.layer === "back" && stamp.borderVersion === version);
    if (!this.ready || done) return 0;
    this.gridDirty = true;
    for (let index = this.stamps.length - 1; index >= 0; index -= 1) {
      const stamp = this.stamps[index];
      if (stamp.border && stamp.layer === "back" && stamp.name.startsWith("rock_")) this.stamps.splice(index, 1);
    }
    const names = this.order.filter((type) => type.name.startsWith("rock_")).map((type) => type.name);
    if (names.length === 0) return 0;
    const step = 1.25;
    const x0 = -126;
    const y0 = -506;
    const x1 = 126;
    const y1 = 500;
    const cols = Math.ceil((x1 - x0) / step);
    const rows = Math.ceil((y1 - y0) / step);
    const solid = new Uint8Array(cols * rows);
    const water = new Uint8Array(cols * rows);
    const at = (column: number, row: number): number => row * cols + column;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < cols; column += 1) {
        if (hits(x0 + column * step, y0 + row * step)) solid[at(column, row)] = 1;
      }
    }
    let seed = -1;
    const seedColumn = Math.min(cols - 1, Math.max(0, Math.round((0 - x0) / step)));
    for (let row = rows - 1; row >= 0; row -= 1) {
      const index = at(seedColumn, row);
      if (!solid[index]) {
        seed = index;
        break;
      }
    }
    if (seed < 0) return 0;
    const queue = new Uint32Array(cols * rows);
    let head = 0;
    let tail = 0;
    queue[tail++] = seed;
    water[seed] = 1;
    while (head < tail) {
      const index = queue[head++];
      const column = index % cols;
      const row = (index / cols) | 0;
      const stepTo = (nextColumn: number, nextRow: number): void => {
        if (nextColumn < 0 || nextRow < 0 || nextColumn >= cols || nextRow >= rows) return;
        const next = at(nextColumn, nextRow);
        if (solid[next] || water[next]) return;
        water[next] = 1;
        queue[tail++] = next;
      };
      stepTo(column - 1, row);
      stepTo(column + 1, row);
      stepTo(column, row - 1);
      stepTo(column, row + 1);
    }
    const dist = new Uint16Array(cols * rows);
    dist.fill(65535);
    head = 0;
    tail = 0;
    for (let row = 1; row < rows - 1; row += 1) {
      for (let column = 1; column < cols - 1; column += 1) {
        const index = at(column, row);
        if (!water[index]) continue;
        const besideWall =
          solid[at(column - 1, row)] === 1 ||
          solid[at(column + 1, row)] === 1 ||
          solid[at(column, row - 1)] === 1 ||
          solid[at(column, row + 1)] === 1;
        if (!besideWall) continue;
        dist[index] = 1;
        queue[tail++] = index;
      }
    }
    while (head < tail) {
      const index = queue[head++];
      const column = index % cols;
      const row = (index / cols) | 0;
      const next = dist[index] + 1;
      const stepTo = (nextColumn: number, nextRow: number): void => {
        if (nextColumn < 0 || nextRow < 0 || nextColumn >= cols || nextRow >= rows) return;
        const neighbor = at(nextColumn, nextRow);
        if (!water[neighbor] || dist[neighbor] <= next) return;
        dist[neighbor] = next;
        queue[tail++] = neighbor;
      };
      stepTo(column - 1, row);
      stepTo(column + 1, row);
      stepTo(column, row - 1);
      stepTo(column, row + 1);
    }
    const candidates: Array<{ index: number; rank: number }> = [];
    for (let row = 1; row < rows - 1; row += 1) {
      for (let column = 1; column < cols - 1; column += 1) {
        const index = at(column, row);
        if (dist[index] === 65535) continue;
        const distance = dist[index] * step;
        if (distance < 2.6) continue;
        const stride = distance < 14 ? 1 : distance < 40 ? 2 : 4;
        if (column % stride !== 0 || row % stride !== 0) continue;
        candidates.push({ index, rank: distance + Math.random() * 2.4 });
      }
    }
    candidates.sort((a, b) => a.rank - b.rank);
    const placed: Array<[number, number, number]> = [];
    let previous = "";
    let near = 0;
    let far = 0;
    for (const candidate of candidates) {
      const column = candidate.index % cols;
      const row = (candidate.index / cols) | 0;
      const distance = dist[candidate.index] * step;
      const farBand = distance > 22;
      if (farBand ? far >= 40 : near >= 110) continue;
      const along = Math.min(1, Math.max(0, (distance - 3) / 70));
      const separation = 22 + along * along * 64;
      if (farBand && Math.random() > Math.exp(-(distance - 22) / 30)) continue;
      let x = x0 + column * step;
      let y = y0 + row * step;
      const jx = (Math.random() - 0.5) * step * 0.85;
      const jy = (Math.random() - 0.5) * step * 0.85;
      if (!hits(x + jx, y + jy)) {
        x += jx;
        y += jy;
      }
      if (hits(x, y)) continue;
      if (placed.some(([px, py, radius]) => Math.hypot(px - x, py - y) < (separation + radius) * 0.5)) continue;
      const pool = names.length > 1 ? names.filter((name) => name !== previous) : names;
      const name = pool[Math.floor(Math.random() * pool.length)];
      previous = name;
      const depth = Math.random();
      const defocus = depth > 0.64 ? 3 + Math.random() * 5 : 0;
      const dither = defocus > 0 ? 0.08 + Math.random() * 0.06 : 0.16 + depth * 0.14;
      const haze = 0.1 + depth * 0.16;
      const scale = (0.52 + Math.random() * 0.62) * (defocus > 0 ? 0.84 : 1);
      placed.push([x, y, separation]);
      if (farBand) far += 1;
      else near += 1;
      this.stamps.push({
        name,
        x,
        y,
        layer: "back",
        rotation: Math.floor(Math.random() * 24) * (Math.PI / 12),
        scale,
        border: true,
        borderVersion: version,
        anchored: true,
        dither,
        haze,
        defocus,
      });
    }
    return near + far;
  }

  types(): DecorationType[] {
    return this.ready ? this.order : [];
  }

  exportStamps(): DecorationStamp[] | null {
    return this.ready ? this.stamps.map((stamp) => ({ ...stamp })) : null;
  }

  endStroke(): void {
    this.lastStamp = null;
    this.nextGap = 0.7;
  }

  place(x: number, y: number, layer: DecorationLayer, name: string): (() => boolean) | null {
    const sprite = this.sprites.get(name);
    if (!sprite) return null;
    if (this.lastStamp && Math.hypot(x - this.lastStamp[0], y - this.lastStamp[1]) < this.nextGap) return null;
    const stamp: DecorationStamp = {
      name,
      x,
      y,
      layer,
      rotation: Math.floor(Math.random() * 24) * (Math.PI / 12),
      scale: jitterScale(layer),
      anchored: true,
    };
    this.stamps.push(stamp);
    this.gridDirty = true;
    this.lastStamp = [x, y];
    this.nextGap = layer === "mid" ? 0.38 + Math.random() * 1.28 : 0.7;
    return () => {
      const index = this.stamps.indexOf(stamp);
      if (index >= 0) this.stamps.splice(index, 1);
      this.gridDirty = true;
      return false;
    };
  }

  erase(x: number, y: number, camera: [number, number]): void {
    this.gridDirty = true;
    const radius = 1.35;
    for (let i = this.stamps.length - 1; i >= 0; i -= 1) {
      const [vx, vy] = visual(this.stamps[i], camera);
      if (Math.hypot(vx - x, vy - y) <= radius) this.stamps.splice(i, 1);
    }
  }

  draw(
    layer: DecorationLayer,
    halfView: [number, number],
    camera: [number, number],
    intensity: number,
    lights: PackedPointLights,
    pixelsPerUnit: number,
  ): void {
    if (!this.ready) return;
    if (this.gridDirty) this.rebuildDecoGrid();
    const picked = this.picked;
    picked.length = 0;
    const pad = 28;
    const x0 = Math.floor((camera[0] - halfView[0] - pad) / DECO_CELL);
    const x1 = Math.floor((camera[0] + halfView[0] + pad) / DECO_CELL);
    const y0 = Math.floor((camera[1] - halfView[1] - pad) / DECO_CELL);
    const y1 = Math.floor((camera[1] + halfView[1] + pad) / DECO_CELL);
    for (let iy = y0; iy <= y1; iy += 1) {
      for (let ix = x0; ix <= x1; ix += 1) {
        const cell = this.decoGrid.get(decoKey(ix, iy));
        if (!cell) continue;
        for (let n = 0; n < cell.length; n += 1) {
          const index = cell[n];
          if (this.stamps[index]?.layer === layer) picked.push(index);
        }
      }
    }
    if (picked.length === 0) return;
    picked.sort((a, b) => a - b);
    const gl = this.gl;
    let begun = false;
    let bound: WebGLTexture | null = null;
    for (let n = 0; n < picked.length; n += 1) {
      const stamp = this.stamps[picked[n]];
      const sprite = this.sprites.get(stamp.name);
      if (!sprite) continue;
      const [cx, cy] = visual(stamp, camera);
      const scale = spriteScale(stamp) * SCALE[layer];
      const reach = Math.hypot(sprite.hw, sprite.hh) * scale;
      if (Math.abs(cx - camera[0]) > halfView[0] + reach) continue;
      if (Math.abs(cy - camera[1]) > halfView[1] + reach) continue;
      if (!begun) {
        begun = true;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.program);
        gl.uniform2f(uniform(gl, this.program, "uCamera"), camera[0], camera[1]);
        gl.uniform2f(uniform(gl, this.program, "uHalfView"), halfView[0], halfView[1]);
        gl.uniform1f(uniform(gl, this.program, "uLight"), intensity);
        gl.uniform1f(uniform(gl, this.program, "uShade"), SHADE[layer]);
        gl.uniform1f(uniform(gl, this.program, "uPixelsPerUnit"), pixelsPerUnit);
        gl.uniform1i(uniform(gl, this.program, "uPointCount"), lights.count);
        gl.uniform3fv(uniform(gl, this.program, "uPointLights"), lights.data);
        gl.uniform3fv(uniform(gl, this.program, "uPointColors"), lights.colors);
        gl.uniform1i(uniform(gl, this.program, "uSprite"), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      }
      if (sprite.texture !== bound) {
        bound = sprite.texture;
        gl.bindTexture(gl.TEXTURE_2D, bound);
      }
      gl.uniform2f(uniform(gl, this.program, "uCenter"), cx, cy);
      gl.uniform2f(uniform(gl, this.program, "uHalfSize"), sprite.hw * scale, sprite.hh * scale);
      gl.uniform1f(uniform(gl, this.program, "uRotation"), stamp.rotation);
      gl.uniform1f(uniform(gl, this.program, "uDither"), stamp.dither ?? DITHER[layer]);
      gl.uniform1f(uniform(gl, this.program, "uHaze"), stamp.haze ?? 0);
      gl.uniform1f(uniform(gl, this.program, "uDefocus"), stamp.defocus ?? 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  private rebuildDecoGrid(): void {
    for (const list of this.decoGrid.values()) list.length = 0;
    for (let index = 0; index < this.stamps.length; index += 1) {
      const stamp = this.stamps[index];
      const key = decoKey(Math.floor(stamp.x / DECO_CELL), Math.floor(stamp.y / DECO_CELL));
      let list = this.decoGrid.get(key);
      if (!list) {
        list = [];
        this.decoGrid.set(key, list);
      }
      list.push(index);
    }
    this.gridDirty = false;
  }

  private async prepare(): Promise<void> {
    try {
      const cuts = await loadCutIndex();
      const total = cuts.length + FILES.length;
      let done = 0;
      const mark = async (): Promise<void> => {
        done += 1;
        await bootPulse("decorations", done / total);
      };
      const queue = cuts.slice();
      const loadCut = async (): Promise<void> => {
        while (queue.length > 0) {
          const sprite = queue.shift();
          if (!sprite) return;
          const image = await fetchImage(`${CUT_URL}/${encodeURIComponent(sprite.file)}`);
          const name = this.addImage(image, sprite.group, sprite.label);
          if (!name) throw new Error(`could not read ${sprite.file}`);
          await mark();
        }
      };
      await Promise.all([loadCut(), loadCut(), loadCut(), loadCut()]);
      for (const job of FILES) {
        await this.loadFile(job.url, job.group, job.label);
        await mark();
      }
      const saved = await loadSaved();
      for (const stamp of saved) {
        if (!this.sprites.has(stamp.name)) continue;
        if (stamp.anchored !== true) {
          const parallax = PARALLAX[stamp.layer];
          stamp.x /= parallax;
          stamp.y /= parallax;
          stamp.anchored = true;
          this.anchorMigration = true;
        }
        this.stamps.push(stamp);
      }
      this.gridDirty = true;
      this.ready = true;
      bootMark("decorations", 1);
    } catch (error) {
      this.loadFailed = true;
      bootMark("decorations", 1);
      console.error(error);
    }
  }

  private async loadFile(url: string, group: DecorationLayer, label: string): Promise<void> {
    const image = await fetchImage(url);
    const name = this.addImage(image, group, label);
    if (!name) throw new Error(`could not read ${url}`);
  }

  private addImage(image: HTMLImageElement, group: DecorationLayer, label: string): string | null {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) return null;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    const index = this.counts[label] ?? 0;
    this.counts[label] = index + 1;
    const name = `${label.toLowerCase()}_${String(index).padStart(2, "0")}`;
    this.sprites.set(name, {
      name,
      label: `${label} ${index + 1}`,
      group,
      texture,
      hw: image.naturalWidth / SOURCE_PER_UNIT / 2,
      hh: image.naturalHeight / SOURCE_PER_UNIT / 2,
    });
    this.order.push({ name, label: `${label} ${index + 1}`, group });
    return name;
  }
}

function visual(stamp: DecorationStamp, camera: [number, number]): [number, number] {
  const parallax = PARALLAX[stamp.layer];
  const dx = camera[0] - stamp.x;
  const dy = camera[1] - stamp.y;
  const dist = Math.hypot(dx, dy);
  const shift = (1 - parallax) * (PARALLAX_REACH / (PARALLAX_REACH + dist));
  return [stamp.x + dx * shift, stamp.y + dy * shift];
}

async function loadCutIndex(): Promise<CutSprite[]> {
  const response = await fetch(`${CUT_URL}/index.json`);
  if (!response.ok) throw new Error("missing decoration sprites");
  const body = (await response.json()) as { sprites?: unknown };
  if (!Array.isArray(body.sprites)) throw new Error("bad decoration sprite list");
  return body.sprites.map((value) => {
    if (!value || typeof value !== "object") throw new Error("bad decoration sprite");
    const sprite = value as CutSprite;
    if (
      typeof sprite.file !== "string" ||
      (sprite.group !== "back" && sprite.group !== "mid" && sprite.group !== "fore") ||
      typeof sprite.label !== "string"
    ) {
      throw new Error("bad decoration sprite");
    }
    return sprite;
  });
}

function fetchImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error(`timed out ${url}`));
    }, 20000);
    image.onload = () => {
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`could not load ${url}`));
    };
    image.src = url;
  });
}

async function loadSaved(): Promise<DecorationStamp[]> {
  const response = await fetch("/terrain-edits.json", { cache: "no-store" });
  if (!response.ok) return [];
  const body = (await response.json()) as { decorations?: unknown };
  if (!Array.isArray(body.decorations)) return [];
  return body.decorations.filter(isStamp);
}

function isStamp(value: unknown): value is DecorationStamp {
  if (!value || typeof value !== "object") return false;
  const stamp = value as DecorationStamp;
  if (
    typeof stamp.name !== "string" ||
    !Number.isFinite(stamp.x) ||
    !Number.isFinite(stamp.y) ||
    !Number.isFinite(stamp.rotation) ||
    (stamp.layer !== "back" && stamp.layer !== "mid" && stamp.layer !== "fore")
  ) {
    return false;
  }
  if (!Number.isFinite(stamp.scale)) stamp.scale = 1;
  if (stamp.border !== true) delete stamp.border;
  if (
    stamp.borderVersion !== 2 &&
    stamp.borderVersion !== 5 &&
    stamp.borderVersion !== 6 &&
    stamp.borderVersion !== 7 &&
    stamp.borderVersion !== 8
  ) {
    delete stamp.borderVersion;
  }
  if (!Number.isFinite(stamp.dither)) delete stamp.dither;
  if (!Number.isFinite(stamp.haze)) delete stamp.haze;
  if (!Number.isFinite(stamp.defocus)) delete stamp.defocus;
  return true;
}

function jitterScale(layer: DecorationLayer): number {
  if (layer === "mid") return 0.52 + Math.random() * 0.96;
  return 0.8 + Math.random() * 0.4;
}

function spriteScale(stamp: DecorationStamp): number {
  return Number.isFinite(stamp.scale) ? stamp.scale : 1;
}

const locations = new WeakMap<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation | null {
  let table = locations.get(program);
  if (!table) {
    table = new Map();
    locations.set(program, table);
  }
  if (!table.has(name)) table.set(name, gl.getUniformLocation(program, name));
  return table.get(name) ?? null;
}

function link(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  return program;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}
