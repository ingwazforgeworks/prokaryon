import { columnAttenuation } from "./light";
import { TEXEL_COLUMNS, TEXEL_ORIGIN_Y, TEXEL_ROWS, TEXEL_SIZE, texelAt } from "./texels";

/**
 * Heat in the water column. Vents are held near 110°C and the heat they lose
 * spreads to neighbors. The sun pulls the lit water toward 60°C, and that pull
 * follows the day-night brightness. A sink through the middle gives heat up to
 * currents leaving in the unseen depth, so the column can settle overall.
 * A divergence-free stir keeps neighboring cells exchanging heat, so a single
 * cell does not freeze at one number. The visible field advances twice a second.
 * Coraly rock holds heat: it still accepts heat from hotter water, but gives
 * that heat up slowly. Vents keep pouring at the full rate.
 */
const COUNT = TEXEL_COLUMNS * TEXEL_ROWS;
const THERMAL_DT = 0.5;
const SUBSTEPS = 8;
const DIFFUSION = 0.55;
/** Share of a water cell's heat loss that a rocky cell still allows. */
const ROCK_LEAK = 0.15;
const SUN_TARGET = 60;
const SUN_COUPLING = 9;
const SINK_TARGET = 4;
const SINK_COUPLING = 5.5;
const STIR = 4.2;
const AMBIENT = 4;

export class TemperatureField {
  readonly values = new Float64Array(COUNT);
  revision = 0;
  private readonly scratch = new Float64Array(COUNT);
  private readonly vents = new Uint8Array(COUNT);
  private readonly rock = new Uint8Array(COUNT);
  private readonly sunWeight = new Float64Array(TEXEL_ROWS);
  private readonly sinkWeight = new Float64Array(TEXEL_ROWS);
  private accumulator = 0;
  private time = 0;
  private brightness = 1;
  private rockStamp = -1;

  constructor() {
    this.values.fill(AMBIENT);
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const y = TEXEL_ORIGIN_Y + (row + 0.5) * TEXEL_SIZE;
      const depth = row / (TEXEL_ROWS - 1);
      const mid = 1 - Math.abs(depth - 0.5) * 2;
      this.sunWeight[row] = columnAttenuation(y);
      this.sinkWeight[row] = mid * mid;
    }
  }

  advance(
    dt: number,
    sunBrightness: number,
    ventPoints: ReadonlyArray<readonly [number, number]>,
    rock: Uint8Array,
    rockStamp = -1,
  ): void {
    this.brightness = sunBrightness;
    if (rockStamp !== this.rockStamp && rock.length === COUNT) {
      this.rock.set(rock);
      this.rockStamp = rockStamp;
    }
    this.accumulator += Math.min(Math.max(dt, 0), 0.1);
    let ticks = 0;
    while (this.accumulator >= THERMAL_DT && ticks < 2) {
      this.markVents(ventPoints);
      this.tick(THERMAL_DT);
      this.accumulator -= THERMAL_DT;
      ticks += 1;
    }
    if (ticks === 2) this.accumulator = 0;
  }

  private tick(dt: number): void {
    const h = dt / SUBSTEPS;
    for (let step = 0; step < SUBSTEPS; step += 1) {
      this.time += h;
      this.diffuse(h);
      this.blendSun(h);
      this.blendSink(h);
    }
    this.stir();
    this.pinVents();
    this.revision += 1;
  }

  private markVents(points: ReadonlyArray<readonly [number, number]>): void {
    this.vents.fill(0);
    for (const [x, y] of points) {
      const texel = texelAt(x, y);
      if (!texel) continue;
      this.vents[texel.row * TEXEL_COLUMNS + texel.column] = 1;
    }
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
        if (column + 1 < TEXEL_COLUMNS) this.exchange(src, dst, index, index + 1, gain);
        if (row + 1 < TEXEL_ROWS) this.exchange(src, dst, index, index + TEXEL_COLUMNS, gain);
      }
    }
    src.set(dst);
  }

  /** Heat leaves a rocky cell slowly. Heat still enters it from hotter water at the full rate. */
  private exchange(src: Float64Array, dst: Float64Array, a: number, b: number, gain: number): void {
    const hotter = src[a] >= src[b] ? a : b;
    const flux = gain * this.leak(hotter) * (src[b] - src[a]);
    dst[a] += flux;
    dst[b] -= flux;
  }

  private leak(index: number): number {
    if (this.vents[index] || !this.rock[index]) return 1;
    return ROCK_LEAK;
  }

  private blendSun(h: number): void {
    if (this.brightness <= 0) return;
    const values = this.values;
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const start = row * TEXEL_COLUMNS;
      const rowGain = SUN_COUPLING * h * this.brightness * this.sunWeight[row];
      if (rowGain <= 0) continue;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = start + column;
        const gain = 1 - Math.exp(-rowGain * this.leak(index));
        values[index] += gain * (SUN_TARGET - values[index]);
      }
    }
  }

  private blendSink(h: number): void {
    const values = this.values;
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const start = row * TEXEL_COLUMNS;
      const rowGain = SINK_COUPLING * h * this.sinkWeight[row];
      if (rowGain <= 0) continue;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = start + column;
        const gain = 1 - Math.exp(-rowGain * this.leak(index));
        values[index] += gain * (SINK_TARGET - values[index]);
      }
    }
  }

  /** Exchange heat across every shared edge. The exchanges cancel, so the column total stays put. */
  private stir(): void {
    const src = this.values;
    const dst = this.scratch;
    dst.set(src);
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = row * TEXEL_COLUMNS + column;
        if (column + 1 < TEXEL_COLUMNS) {
          let flux = STIR * eddy(column, row, this.time, 0.4);
          flux *= this.leak(flux >= 0 ? index : index + 1);
          dst[index] -= flux;
          dst[index + 1] += flux;
        }
        if (row + 1 < TEXEL_ROWS) {
          let flux = STIR * eddy(column, row, this.time, 2.2);
          flux *= this.leak(flux >= 0 ? index : index + TEXEL_COLUMNS);
          dst[index] -= flux;
          dst[index + TEXEL_COLUMNS] += flux;
        }
      }
    }
    for (let index = 0; index < COUNT; index += 1) {
      const value = dst[index];
      src[index] = value < 0 ? 0 : value > 140 ? 140 : value;
    }
  }

  private pinVents(): void {
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
        const index = row * TEXEL_COLUMNS + column;
        if (this.vents[index]) this.values[index] = ventTarget(column, this.time);
      }
    }
  }
}

function ventTarget(column: number, time: number): number {
  const wobble = Math.sin(time * 0.21 + column * 1.3) * 6.5 + Math.sin(time * 0.07 + column * 0.6) * 3.5;
  return 110 + wobble;
}

function eddy(column: number, row: number, time: number, salt: number): number {
  return Math.sin(column * 0.73 + row * 0.41 + time * 0.47 + salt) * 0.65
    + Math.sin(column * 0.29 - row * 0.63 + time * 0.19 + salt * 1.7) * 0.35;
}
