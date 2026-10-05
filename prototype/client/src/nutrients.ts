import { COLUMN_BOTTOM, COLUMN_TOP } from "./light";

/**
 * Dissolved nutrient. Each deposit leaches one nutrient into the water beside it.
 * The numbers are a concentration: a later transporter can take from a point,
 * and the deposit leaches that point back up. Open water that was never supplied
 * loses whatever was added there.
 * Thionite leaks sulfex, ferracite leaks ferron, azoite leaks nitrox,
 * and halite leaks osmolyn.
 */
export interface NutrientFace {
  x: number;
  y: number;
  nx: number;
  ny: number;
  resource: string;
}

export type NutrientKind = "sulfex" | "ferron" | "nitrox" | "osmolyn";

/** Playable water. Terrain checks these against its own world edges. */
const FIELD_LEFT = -120;
const FIELD_RIGHT = 120;

export const NUTRIENT_CELL = 1;
export const NUTRIENT_ORIGIN_X = FIELD_LEFT;
export const NUTRIENT_ORIGIN_Y = COLUMN_BOTTOM;
export const NUTRIENT_COLUMNS = (FIELD_RIGHT - FIELD_LEFT) / NUTRIENT_CELL;
export const NUTRIENT_ROWS = (COLUMN_TOP - COLUMN_BOTTOM) / NUTRIENT_CELL;

/** How far the brightest water sits past the mineral, in world units. */
export const PLUME_LEAD = 1.6;
/** Reach into open water, back into the rock, and to either side. */
export const PLUME_WATER = 15;
export const PLUME_ROCK = 6;
export const PLUME_ACROSS = 9;

if (!Number.isInteger(NUTRIENT_COLUMNS) || !Number.isInteger(NUTRIENT_ROWS)) {
  throw new Error("nutrient cell does not divide the water column");
}

const COUNT = NUTRIENT_COLUMNS * NUTRIENT_ROWS;
const CHANNEL: Record<NutrientKind, number> = {
  sulfex: 0,
  ferron: 1,
  nitrox: 2,
  osmolyn: 3,
};

export function nutrientKind(resource: string): NutrientKind | null {
  if (resource === "sulfur") return "sulfex";
  if (resource === "iron") return "ferron";
  if (resource === "ammonia") return "nitrox";
  if (resource === "chloride") return "osmolyn";
  return null;
}

/** 1 at the plume center, 0 outside the lobe. `along` is toward open water. */
export function plumeAmount(along: number, across: number): number {
  const reach = along >= 0 ? PLUME_WATER : PLUME_ROCK;
  const u = along / reach;
  const v = across / PLUME_ACROSS;
  const radius2 = u * u + v * v;
  if (radius2 >= 1) return 0;
  const edge = 1 - Math.sqrt(radius2);
  return edge * edge;
}

type Lobe = {
  dx: number;
  dy: number;
  px: number;
  py: number;
  length: number;
  half: number;
  curve: number;
  ripple: number;
  waves: number;
  taper: number;
};

/** A few tongues. Angles and bends are irregular, and some hooks as they leave the mineral. */
function lobesFor(face: NutrientFace): Lobe[] {
  const sx = Math.floor(face.x * 5);
  const sy = Math.floor(face.y * 5);
  const px = -face.ny;
  const py = face.nx;
  const count = 2 + Math.floor(cellHash(sx, sy) * 3);
  const lobes: Lobe[] = [];
  for (let i = 0; i < count; i += 1) {
    const spin = cellHash(sx + i * 17, sy + 3);
    const reach = cellHash(sx + 5, sy + i * 13);
    const width = cellHash(sx + i * 11, sy + 29);
    const hook = cellHash(sx + i * 23, sy + 41);
    const flutter = cellHash(sx + i * 31, sy + 53);
    const turns = cellHash(sx + 9, sy + i * 37);
    const pinch = cellHash(sx + i * 43, sy + 17);
    const angle = i === 0 ? (spin - 0.5) * 0.55 : (spin - 0.5) * 2.4;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const dx = face.nx * c + px * s;
    const dy = face.ny * c + py * s;
    const sign = hook < 0.5 ? -1 : 1;
    lobes.push({
      dx,
      dy,
      px: -dy,
      py: dx,
      length: 16 + reach * 12,
      half: 1.1 + width * width * 7.2,
      curve: sign * (9 + hook * 10),
      ripple: sign * -(4 + flutter * 7),
      waves: 0.9 + turns * 0.85,
      taper: 0.28 + pinch * 0.68,
    });
  }
  return lobes;
}

/** 1 at the root, narrowing to nothing at the tip. The centerline wanders as it goes. */
function lobeAmount(
  along: number,
  across: number,
  length: number,
  half: number,
  curve: number,
  ripple: number,
  waves: number,
  taper: number,
): number {
  if (along < -0.5 || along >= length) return 0;
  const t = Math.max(along, 0) / length;
  const width = half * (1 - t * taper);
  if (width <= 0) return 0;
  const sway = Math.sin(t * Math.PI * waves);
  const wiggle = Math.sin(t * Math.PI * waves * 2.2 + 1.4);
  const center = t * (curve * sway + ripple * wiggle);
  const side = Math.abs(across - center) / width;
  if (side >= 1) return 0;
  const fade = Math.pow(1 - t, 1.15);
  return (1 - side * side) * fade;
}

/** One channel per nutrient, 0 to 1. Overlapping faces of one kind keep the stronger value. */
export function paintNutrients(
  values: Float32Array,
  faces: readonly NutrientFace[],
  blocked?: (x: number, y: number) => boolean,
  rock?: Uint8Array,
  span?: { c0: number; c1: number; r0: number; r1: number },
): void {
  const reach = 36;
  for (const face of faces) {
    const kind = nutrientKind(face.resource);
    if (!kind) continue;
    const channel = CHANNEL[kind];
    const ox = face.x + face.nx * PLUME_LEAD;
    const oy = face.y + face.ny * PLUME_LEAD;
    const lobes = lobesFor(face);
    const x0 = Math.max(0, Math.floor((ox - reach - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL));
    const x1 = Math.min(NUTRIENT_COLUMNS - 1, Math.floor((ox + reach - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL));
    const y0 = Math.max(0, Math.floor((oy - reach - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL));
    const y1 = Math.min(NUTRIENT_ROWS - 1, Math.floor((oy + reach - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL));
    for (let row = y0; row <= y1; row += 1) {
      const y = NUTRIENT_ORIGIN_Y + (row + 0.5) * NUTRIENT_CELL;
      const dy = y - oy;
      for (let column = x0; column <= x1; column += 1) {
        const x = NUTRIENT_ORIGIN_X + (column + 0.5) * NUTRIENT_CELL;
        const cell = row * NUTRIENT_COLUMNS + column;
        if (blocked?.(x, y)) {
          if (rock) rock[cell] = 1;
          continue;
        }
        const dx = x - ox;
        let amount = 0;
        for (let i = 0; i < lobes.length; i += 1) {
          const lobe = lobes[i];
          const along = dx * lobe.dx + dy * lobe.dy;
          const across = dx * lobe.px + dy * lobe.py;
          const sample = lobeAmount(
            along,
            across,
            lobe.length,
            lobe.half,
            lobe.curve,
            lobe.ripple,
            lobe.waves,
            lobe.taper,
          );
          if (sample > amount) amount = sample;
        }
        if (amount <= 0) continue;
        if (span) {
          if (column < span.c0) span.c0 = column;
          if (column > span.c1) span.c1 = column;
          if (row < span.r0) span.r0 = row;
          if (row > span.r1) span.r1 = row;
        }
        const index = (row * NUTRIENT_COLUMNS + column) * 4 + channel;
        if (amount > values[index]) values[index] = amount;
      }
    }
  }
}

function cellHash(x: number, y: number): number {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const STEP = 0.5;
const SUBSTEPS = 2;
/** Spreads concentration into neighboring water. */
const DIFFUSION = 0.16;
/** How fast a cell climbs back toward the deposit's supply. */
const LEACH = 0.28;
/** How fast concentration thins once it has left the supply. */
const FADE = 0.16;
/** Swirl speed, in cells per second. The curl has no preferred direction. */
const FLOW = 6;

/**
 * Concentration in the water. Deposits write a supply. The live values can be
 * raised or lowered at a point, then they drift back toward that supply.
 */
export class NutrientConcentrations {
  readonly values = new Float32Array(COUNT * 4);
  revision = 0;
  private readonly target = new Float32Array(COUNT * 4);
  private readonly scratch = new Float32Array(COUNT * 4);
  private generation = Number.NaN;
  private seeded = false;
  private accumulator = 0;
  private time = 0;
  private readonly span = { c0: 0, c1: -1, r0: 0, r1: -1 };
  private readonly rock = new Uint8Array(COUNT);
  private useRock = false;

  /** Rebuilds the supply when the deposits change. The first supply fills the water. */
  sources(
    generation: number,
    faces: readonly NutrientFace[],
    blocked?: (x: number, y: number) => boolean,
  ): void {
    if (generation === this.generation) return;
    this.generation = generation;
    if (generation < 0) return;
    this.target.fill(0);
    this.rock.fill(0);
    this.useRock = Boolean(blocked);
    this.span.c0 = NUTRIENT_COLUMNS;
    this.span.c1 = -1;
    this.span.r0 = NUTRIENT_ROWS;
    this.span.r1 = -1;
    paintNutrients(this.target, faces, blocked, this.useRock ? this.rock : undefined, this.span);
    if (!this.seeded) {
      this.values.set(this.target);
      this.seeded = true;
    }
    this.revision += 1;
  }

  advance(dt: number): void {
    this.accumulator += Math.min(Math.max(dt, 0), 0.1);
    let ticks = 0;
    while (this.accumulator >= STEP && ticks < 2) {
      this.tick(STEP);
      this.accumulator -= STEP;
      ticks += 1;
    }
    if (ticks === 2) this.accumulator = 0;
  }

  /** Concentration in the cell that contains this point. 0 outside the column. */
  read(kind: NutrientKind, x: number, y: number): number {
    const index = this.cellIndex(x, y, kind);
    return index === null ? 0 : this.values[index];
  }

  /** Stores up to `amount` in that cell. Returns what actually fit. */
  add(kind: NutrientKind, x: number, y: number, amount: number): number {
    if (!(amount > 0)) return 0;
    const index = this.cellIndex(x, y, kind);
    if (index === null) return 0;
    const room = 1 - this.values[index];
    const stored = amount < room ? amount : room;
    if (stored <= 0) return 0;
    this.values[index] += stored;
    const column = Math.floor((x - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
    const row = Math.floor((y - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
    if (column < this.span.c0) this.span.c0 = column;
    if (column > this.span.c1) this.span.c1 = column;
    if (row < this.span.r0) this.span.r0 = row;
    if (row > this.span.r1) this.span.r1 = row;
    this.revision += 1;
    return stored;
  }

  /** Removes up to `amount` from that cell. Returns what was actually there. */
  take(kind: NutrientKind, x: number, y: number, amount: number): number {
    if (!(amount > 0)) return 0;
    const index = this.cellIndex(x, y, kind);
    if (index === null) return 0;
    const held = this.values[index];
    const removed = amount < held ? amount : held;
    if (removed <= 0) return 0;
    this.values[index] = held - removed;
    this.revision += 1;
    return removed;
  }

  private tick(dt: number): void {
    const h = dt / SUBSTEPS;
    for (let step = 0; step < SUBSTEPS; step += 1) {
      this.time += h;
      this.growSpan();
      this.stir(h);
      this.diffuse(h);
      this.leach(h);
    }
    this.clearRock();
    this.revision += 1;
  }

  private clearRock(): void {
    if (!this.useRock) return;
    const values = this.values;
    const rock = this.rock;
    for (let cell = 0; cell < COUNT; cell += 1) {
      if (rock[cell] === 0) continue;
      const index = cell * 4;
      values[index] = 0;
      values[index + 1] = 0;
      values[index + 2] = 0;
      values[index + 3] = 0;
    }
  }

  private growSpan(): void {
    if (this.span.c1 < this.span.c0) return;
    this.span.c0 = Math.max(0, this.span.c0 - 1);
    this.span.c1 = Math.min(NUTRIENT_COLUMNS - 1, this.span.c1 + 1);
    this.span.r0 = Math.max(0, this.span.r0 - 1);
    this.span.r1 = Math.min(NUTRIENT_ROWS - 1, this.span.r1 + 1);
  }

  private stir(h: number): void {
    const src = this.values;
    const dst = this.scratch;
    dst.set(src);
    const time = this.time;
    const stride = NUTRIENT_COLUMNS * 4;
    const columns = NUTRIENT_COLUMNS;
    const gain = h * FLOW;
    const c0 = this.span.c0;
    const c1 = this.span.c1;
    const r0 = this.span.r0;
    const r1 = this.span.r1;
    if (c1 < c0) return;
    for (let row = r0; row <= r1; row += 1) {
      const rowCell = row * columns;
      for (let column = c0; column <= c1; column += 1) {
        const index = (rowCell + column) * 4;
        if (src[index] === 0 && src[index + 1] === 0 && src[index + 2] === 0 && src[index + 3] === 0) continue;
        if (this.blockedCell(column, row)) continue;
        const [fx, fy] = eddy(column, row, time);
        let east = fx > 0 ? fx * gain : 0;
        let west = fx < 0 ? -fx * gain : 0;
        let north = fy > 0 ? fy * gain : 0;
        let south = fy < 0 ? -fy * gain : 0;
        if (column + 1 >= columns || this.blockedCell(column + 1, row)) east = 0;
        if (column === 0 || this.blockedCell(column - 1, row)) west = 0;
        if (row + 1 >= NUTRIENT_ROWS || this.blockedCell(column, row + 1)) north = 0;
        if (row === 0 || this.blockedCell(column, row - 1)) south = 0;
        const total = east + west + north + south;
        const scale = total > 0.4 ? 0.4 / total : 1;
        east *= scale;
        west *= scale;
        north *= scale;
        south *= scale;
        for (let channel = 0; channel < 4; channel += 1) {
          const held = src[index + channel];
          if (held === 0) continue;
          const at = index + channel;
          if (east) {
            const moved = held * east;
            dst[at] -= moved;
            dst[at + 4] += moved;
          }
          if (west) {
            const moved = held * west;
            dst[at] -= moved;
            dst[at - 4] += moved;
          }
          if (north) {
            const moved = held * north;
            dst[at] -= moved;
            dst[at + stride] += moved;
          }
          if (south) {
            const moved = held * south;
            dst[at] -= moved;
            dst[at - stride] += moved;
          }
        }
      }
    }
    src.set(dst);
  }

  private blockedCell(column: number, row: number): boolean {
    return this.useRock && this.rock[row * NUTRIENT_COLUMNS + column] === 1;
  }

  private diffuse(h: number): void {
    const src = this.values;
    const dst = this.scratch;
    const gain = h * DIFFUSION;
    dst.set(src);
    const stride = NUTRIENT_COLUMNS * 4;
    const c0 = this.span.c0;
    const c1 = this.span.c1;
    const r0 = this.span.r0;
    const r1 = this.span.r1;
    if (c1 < c0) return;
    for (let row = r0; row <= r1; row += 1) {
      for (let column = c0; column <= c1; column += 1) {
        if (this.blockedCell(column, row)) continue;
        const index = (row * NUTRIENT_COLUMNS + column) * 4;
        if (column + 1 < NUTRIENT_COLUMNS && !this.blockedCell(column + 1, row)) {
          exchangeAll(src, dst, index, index + 4, gain);
        }
        if (row + 1 < NUTRIENT_ROWS && !this.blockedCell(column, row + 1)) {
          exchangeAll(src, dst, index, index + stride, gain);
        }
      }
    }
    src.set(dst);
  }

  private leach(h: number): void {
    const emit = 1 - Math.exp(-LEACH * h);
    const fade = 1 - Math.exp(-FADE * h);
    const values = this.values;
    const target = this.target;
    for (let index = 0; index < values.length; index += 1) {
      const pull = target[index] - values[index];
      if (pull > 0) values[index] += emit * pull;
      else if (pull < 0) values[index] += fade * pull;
    }
  }

  private cellIndex(x: number, y: number, kind: NutrientKind): number | null {
    if (x < NUTRIENT_ORIGIN_X || y < NUTRIENT_ORIGIN_Y || x >= FIELD_RIGHT || y >= COLUMN_TOP) return null;
    const column = Math.floor((x - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
    const row = Math.floor((y - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
    if (column < 0 || row < 0 || column >= NUTRIENT_COLUMNS || row >= NUTRIENT_ROWS) return null;
    return (row * NUTRIENT_COLUMNS + column) * 4 + CHANNEL[kind];
  }
}

function eddy(column: number, row: number, time: number): [number, number] {
  const step = 3;
  const here = flowNoise(column, row, time);
  const east = flowNoise(column + step, row, time);
  const north = flowNoise(column, row + step, time);
  return [(north - here) / step, (here - east) / step];
}

function flowNoise(column: number, row: number, time: number): number {
  const x = column * 0.09 + time * 0.22;
  const y = row * 0.09 - time * 0.17;
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = cellHash(i, j);
  const b = cellHash(i + 1, j);
  const c = cellHash(i, j + 1);
  const d = cellHash(i + 1, j + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
}

function exchangeAll(src: Float32Array, dst: Float32Array, a: number, b: number, gain: number): void {
  for (let channel = 0; channel < 4; channel += 1) {
    const left = a + channel;
    const right = b + channel;
    if (src[left] === 0 && src[right] === 0) continue;
    const flux = gain * (src[right] - src[left]);
    dst[left] += flux;
    dst[right] -= flux;
  }
}

export class NutrientField {
  readonly texture: WebGLTexture;
  readonly concentrations = new NutrientConcentrations();
  private readonly gl: WebGL2RenderingContext;
  private readonly bytes = new Uint8Array(COUNT * 4);
  private uploaded = -1;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("could not create nutrient field");
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      NUTRIENT_COLUMNS,
      NUTRIENT_ROWS,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.bytes,
    );
  }

  advance(
    dt: number,
    generation: number,
    faces: readonly NutrientFace[],
    blocked?: (x: number, y: number) => boolean,
  ): void {
    this.concentrations.sources(generation, faces, blocked);
    this.concentrations.advance(dt);
    this.upload();
  }

  private upload(): void {
    if (this.concentrations.revision === this.uploaded) return;
    const values = this.concentrations.values;
    const bytes = this.bytes;
    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];
      bytes[index] = value <= 0 ? 0 : value >= 1 ? 255 : Math.round(value * 255);
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      NUTRIENT_COLUMNS,
      NUTRIENT_ROWS,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      bytes,
    );
    this.uploaded = this.concentrations.revision;
  }
}
