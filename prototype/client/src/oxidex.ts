import { TEXEL_COLUMNS, TEXEL_ROWS } from "./texels";

/**
 * Dissolved oxidex. It is saturated at the lit surface and falls off
 * exponentially, so the middle of the column and the bottom are almost empty.
 * A sideways stir keeps neighboring cells from locking to one number.
 * The field advances twice a second.
 */
const COUNT = TEXEL_COLUMNS * TEXEL_ROWS;
const STEP = 0.5;
const SUBSTEPS = 8;
const DIFFUSION = 0.42;
/** E-foldings from the surface to the bottom. The middle sits near e^(-half of this). */
const FALLOFF = 9;
const COUPLING = 6;
const STIR = 0.02;

export class OxidexField {
  readonly values = new Float64Array(COUNT);
  revision = 0;
  private readonly scratch = new Float64Array(COUNT);
  private readonly target = new Float64Array(TEXEL_ROWS);
  private accumulator = 0;
  private time = 0;

  constructor() {
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const depth = row / (TEXEL_ROWS - 1);
      this.target[row] = Math.exp(-FALLOFF * (1 - depth));
      const start = row * TEXEL_COLUMNS;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) this.values[start + column] = this.target[row];
    }
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

  private tick(dt: number): void {
    const h = dt / SUBSTEPS;
    for (let step = 0; step < SUBSTEPS; step += 1) {
      this.time += h;
      this.diffuse(h);
      this.restore(h);
    }
    this.stir();
    this.restore(dt);
    this.revision += 1;
  }

  private diffuse(h: number): void {
    const src = this.values;
    const dst = this.scratch;
    const gain = h * DIFFUSION;
    dst.set(src);
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const start = row * TEXEL_COLUMNS;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = start + column;
        if (column + 1 < TEXEL_COLUMNS) exchange(src, dst, index, index + 1, gain);
        if (row + 1 < TEXEL_ROWS) exchange(src, dst, index, index + TEXEL_COLUMNS, gain);
      }
    }
    src.set(dst);
  }

  private restore(h: number): void {
    const values = this.values;
    const gain = 1 - Math.exp(-COUPLING * h);
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const pull = this.target[row];
      const start = row * TEXEL_COLUMNS;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = start + column;
        values[index] += gain * (pull - values[index]);
      }
    }
  }

  /** Sideways exchange. A restore after this puts the depth curve back. */
  private stir(): void {
    const src = this.values;
    const dst = this.scratch;
    dst.set(src);
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const start = row * TEXEL_COLUMNS;
      for (let column = 0; column + 1 < TEXEL_COLUMNS; column += 1) {
        const index = start + column;
        const flux = STIR * eddy(column, row, this.time);
        dst[index] -= flux;
        dst[index + 1] += flux;
      }
    }
    for (let index = 0; index < COUNT; index += 1) {
      const value = dst[index];
      src[index] = value < 0 ? 0 : value > 1 ? 1 : value;
    }
  }
}

function exchange(src: Float64Array, dst: Float64Array, a: number, b: number, gain: number): void {
  const flux = gain * (src[b] - src[a]);
  dst[a] += flux;
  dst[b] -= flux;
}

function eddy(column: number, row: number, time: number): number {
  return Math.sin(column * 0.73 + row * 0.41 + time * 0.47) * 0.65
    + Math.sin(column * 0.29 - row * 0.63 + time * 0.19) * 0.35;
}
