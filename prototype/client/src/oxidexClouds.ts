import { COLUMN_BOTTOM, COLUMN_TOP } from "./light";
import {
  NUTRIENT_CELL,
  NUTRIENT_COLUMNS,
  NUTRIENT_ORIGIN_X,
  NUTRIENT_ORIGIN_Y,
  NUTRIENT_ROWS,
  paintScaledPlume,
} from "./nutrients";
import { TEXEL_COLUMNS, TEXEL_ROWS, TEXEL_SIZE } from "./texels";

/**
 * Dissolved oxidex as scattered clouds. The same tongues as a sulfex, ferron,
 * or nitrox stain, placed in open water. A cloud is very likely near the
 * surface and almost never found in the deep, and it rarely sits on another field.
 */
const X_SLOTS = 7;
const Y_SLOTS = 32;
const SCALE_MIN = 0.5;
const SCALE_SPAN = 1.2;
/** Chance a candidate that would touch another field is kept anyway. */
const FIELD_OVERLAP = 0.045;
/** Chance two clouds are allowed to touch at the edge. */
const CLOUD_OVERLAP = 0.05;
const CLEARANCE = 13;
/** How hard a drawdown suppresses refill, matching the nutrient scar. */
const EXHAUST_PER_FRACTION = 5;
/** How fast that suppression fades, per second. A feeding scar lasts a few minutes. */
const EXHAUST_DECAY = 0.005;
/** How fast an undisturbed cloud climbs back toward the painted supply. */
const LEACH = 0.28;

export type OxidexCloud = {
  x: number;
  y: number;
  nx: number;
  ny: number;
  scale: number;
};

/** 0 at the bottom of the column, 1 at the surface. The deep end falls off very steeply. */
export function oxidexPresence(y: number): number {
  const span = COLUMN_TOP - COLUMN_BOTTOM;
  const t = (y - COLUMN_BOTTOM) / span;
  const height = t < 0 ? 0 : t > 1 ? 1 : t;
  const squared = height * height;
  return squared * squared;
}

function unitHash(x: number, y: number): number {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function hitsStain(x: number, y: number, scale: number, stainAt: (x: number, y: number) => number): boolean {
  if (stainAt(x, y) > 0.08) return true;
  const reach = 14 * scale;
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    if (stainAt(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach) > 0.08) return true;
  }
  return false;
}

function buried(x: number, y: number, scale: number, blocked: (x: number, y: number) => boolean): boolean {
  if (blocked(x, y)) return true;
  const reach = 8 * scale;
  let solid = 0;
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    if (blocked(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach)) solid += 1;
  }
  return solid >= 5;
}

function crowds(cloud: OxidexCloud, accepted: readonly OxidexCloud[], allowTouch: boolean): boolean {
  for (const other of accepted) {
    const dist = Math.hypot(cloud.x - other.x, cloud.y - other.y);
    const need = CLEARANCE * (cloud.scale + other.scale);
    if (dist >= need) continue;
    if (allowTouch && dist >= need * 0.62) continue;
    return true;
  }
  return false;
}

/** Deterministic scatter. The same water and the same stains always grow the same clouds. */
export function placeOxidexClouds(
  stainAt: (x: number, y: number) => number,
  blocked: (x: number, y: number) => boolean = () => false,
): OxidexCloud[] {
  const x0 = NUTRIENT_ORIGIN_X + 18;
  const y0 = NUTRIENT_ORIGIN_Y + 22;
  const xPitch = (NUTRIENT_COLUMNS * NUTRIENT_CELL - 36) / (X_SLOTS - 1);
  const yPitch = (NUTRIENT_ROWS * NUTRIENT_CELL - 44) / (Y_SLOTS - 1);
  const accepted: OxidexCloud[] = [];
  for (let iy = Y_SLOTS - 1; iy >= 0; iy -= 1) {
    for (let ix = 0; ix < X_SLOTS; ix += 1) {
      const jx = (unitHash(ix * 19 + 3, iy * 7 + 1) - 0.5) * xPitch * 0.7;
      const jy = (unitHash(ix * 11 + 5, iy * 13 + 9) - 0.5) * yPitch * 0.7;
      const x = x0 + ix * xPitch + jx;
      const y = y0 + iy * yPitch + jy;
      if (unitHash(ix * 23 + 2, iy * 29 + 4) > oxidexPresence(y)) continue;
      const scale = SCALE_MIN + unitHash(ix * 31 + 8, iy * 17 + 6) * SCALE_SPAN;
      if (buried(x, y, scale, blocked)) continue;
      if (stainAt(x, y) > 0.08) continue;
      const clips = hitsStain(x, y, scale, stainAt);
      if (clips && unitHash(ix * 37 + 12, iy * 41 + 15) >= FIELD_OVERLAP) continue;
      const angle = unitHash(ix * 43 + 1, iy * 47 + 2) * Math.PI * 2;
      const cloud: OxidexCloud = { x, y, nx: Math.cos(angle), ny: Math.sin(angle), scale };
      const allowTouch = unitHash(ix * 53 + 4, iy * 59 + 7) < CLOUD_OVERLAP;
      if (crowds(cloud, accepted, allowTouch)) continue;
      accepted.push(cloud);
    }
  }
  return accepted;
}

const COUNT = NUTRIENT_COLUMNS * NUTRIENT_ROWS;

export function oxidexCellIndex(x: number, y: number): number | null {
  const column = Math.floor((x - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
  const row = Math.floor((y - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
  if (column < 0 || row < 0 || column >= NUTRIENT_COLUMNS || row >= NUTRIENT_ROWS) return null;
  return row * NUTRIENT_COLUMNS + column;
}

/** Removes up to `amount` from one cloud cell. Returns what was actually there. */
export function depleteOxidexCell(
  values: Float32Array,
  drawn: Float32Array,
  x: number,
  y: number,
  amount: number,
): number {
  if (!(amount > 0)) return 0;
  const index = oxidexCellIndex(x, y);
  if (index === null) return 0;
  const held = values[index];
  const removed = amount < held ? amount : held;
  if (removed <= 0) return 0;
  values[index] = held - removed;
  drawn[index] = Math.min(1, drawn[index] + removed * EXHAUST_PER_FRACTION);
  return removed;
}

/** Painted oxidex clouds, uploaded as a stain the water can draw like the other nutrients. */
export class OxidexCloudField {
  readonly texture: WebGLTexture;
  /** One value per world texel, the brightest cloud cell inside it. Overlay and motes read this. */
  readonly coarse = new Float64Array(TEXEL_COLUMNS * TEXEL_ROWS);
  revision = 0;
  private generation = Number.NaN;
  private readonly gl: WebGL2RenderingContext;
  private readonly values = new Float32Array(COUNT);
  /** Painted cloud, the level a scar refills toward. */
  private readonly supply = new Float32Array(COUNT);
  /** Refill suppression left by a permease, 0 to 1. */
  private readonly drawn = new Float32Array(COUNT);
  private readonly rowScar = new Uint8Array(NUTRIENT_ROWS);
  private readonly rowDirty = new Uint8Array(NUTRIENT_ROWS);
  private scarred = false;
  private readonly bytes = new Uint8Array(COUNT * 4);
  private uploaded = -1;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("could not create oxidex cloud field");
    this.texture = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, NUTRIENT_COLUMNS, NUTRIENT_ROWS, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.bytes);
  }

  /** Rebuilds when the deposits change, so clouds stay off the stains those deposits leak. */
  sync(
    generation: number,
    stainAt: (x: number, y: number) => number,
    blocked?: (x: number, y: number) => boolean,
  ): void {
    if (generation === this.generation) return;
    if (!(generation >= 0)) return;
    this.generation = generation;
    this.values.fill(0);
    this.coarse.fill(0);
    const clouds = placeOxidexClouds(stainAt, blocked);
    for (const cloud of clouds) {
      paintScaledPlume(
        this.values,
        NUTRIENT_COLUMNS,
        NUTRIENT_ROWS,
        NUTRIENT_ORIGIN_X,
        NUTRIENT_ORIGIN_Y,
        NUTRIENT_CELL,
        cloud.x,
        cloud.y,
        cloud.nx,
        cloud.ny,
        cloud.scale,
        blocked,
      );
    }
    this.supply.set(this.values);
    this.drawn.fill(0);
    this.rowScar.fill(0);
    this.rowDirty.fill(0);
    this.scarred = false;
    this.downsample();
    this.revision += 1;
    this.upload();
  }

  /** Concentration in the cell that contains this point. 0 outside the column. */
  read(x: number, y: number): number {
    const index = oxidexCellIndex(x, y);
    if (index === null) return 0;
    return this.values[index];
  }

  /**
   * Removes up to `amount` from the cloud cell at this point. Returns what was
   * actually there. The cell remembers the drawdown and refills slowly, so a
   * feeding cell leaves a scar instead of a hole that snaps shut.
   */
  take(x: number, y: number, amount: number): number {
    const removed = depleteOxidexCell(this.values, this.drawn, x, y, amount);
    if (removed <= 0) return 0;
    const row = Math.floor((y - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
    if (row >= 0 && row < NUTRIENT_ROWS) this.rowScar[row] = 1;
    this.scarred = true;
    return removed;
  }

  /** Refills scarred cloud cells and uploads whatever changed. */
  advance(dt: number): void {
    if (!this.scarred || !(dt > 0)) return;
    const heal = 1 - Math.exp(-LEACH * dt);
    const fade = Math.exp(-EXHAUST_DECAY * dt);
    let still = false;
    for (let row = 0; row < NUTRIENT_ROWS; row += 1) {
      if (!this.rowScar[row]) continue;
      const start = row * NUTRIENT_COLUMNS;
      let rowStill = false;
      for (let column = 0; column < NUTRIENT_COLUMNS; column += 1) {
        const index = start + column;
        const suppression = this.drawn[index];
        if (suppression > 0) this.drawn[index] = suppression * fade;
        const gap = this.supply[index] - this.values[index];
        if (gap > 0) this.values[index] += gap * heal * (1 - this.drawn[index]);
        if (this.drawn[index] > 0.001 || this.supply[index] - this.values[index] > 1 / 255) rowStill = true;
      }
      this.rowDirty[row] = 1;
      if (rowStill) still = true;
      else this.rowScar[row] = 0;
    }
    this.scarred = still;
    this.downsample();
    this.revision += 1;
    this.uploadDirty();
  }

  private downsample(): void {
    const values = this.values;
    const coarse = this.coarse;
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        let peak = 0;
        const y0 = row * TEXEL_SIZE;
        const x0 = column * TEXEL_SIZE;
        for (let dy = 0; dy < TEXEL_SIZE; dy += 1) {
          const start = (y0 + dy) * NUTRIENT_COLUMNS + x0;
          for (let dx = 0; dx < TEXEL_SIZE; dx += 1) {
            const amount = values[start + dx];
            if (amount > peak) peak = amount;
          }
        }
        coarse[row * TEXEL_COLUMNS + column] = peak;
      }
    }
  }

  private upload(): void {
    if (this.revision === this.uploaded) return;
    const values = this.values;
    const bytes = this.bytes;
    for (let index = 0; index < values.length; index += 1) {
      const scaled = Math.round(values[index] * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NUTRIENT_COLUMNS, NUTRIENT_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    this.uploaded = this.revision;
  }

  private uploadDirty(): void {
    const values = this.values;
    const bytes = this.bytes;
    const gl = this.gl;
    const stride = NUTRIENT_COLUMNS * 4;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    for (let row = 0; row < NUTRIENT_ROWS; row += 1) {
      if (!this.rowDirty[row]) continue;
      const start = row * stride;
      const cells = row * NUTRIENT_COLUMNS;
      for (let column = 0; column < NUTRIENT_COLUMNS; column += 1) {
        const value = values[cells + column];
        const scaled = value <= 0 ? 0 : value >= 1 ? 255 : Math.round(value * 255);
        bytes[start + column * 4] = scaled;
        bytes[start + column * 4 + 3] = 255;
      }
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, row, NUTRIENT_COLUMNS, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes.subarray(start, start + stride));
      this.rowDirty[row] = 0;
    }
    this.uploaded = this.revision;
  }
}
