import { COLUMN_BOTTOM, COLUMN_TOP } from "./light";
import { TEXEL_COLUMNS, TEXEL_ORIGIN_Y, TEXEL_ROWS, TEXEL_SIZE } from "./texels";

/**
 * Hydrostatic pressure. A straight line from 0 at the surface (y = 500)
 * to 1 at the bottom of the column (y = -500). It does not change.
 */
const COUNT = TEXEL_COLUMNS * TEXEL_ROWS;
const SPAN = COLUMN_TOP - COLUMN_BOTTOM;

/** 0 at y = 500, 1 at y = -500. Outside the column it stays at the nearer end. */
export function pressureAt(y: number): number {
  const depth = y < COLUMN_BOTTOM ? COLUMN_BOTTOM : y > COLUMN_TOP ? COLUMN_TOP : y;
  return (COLUMN_TOP - depth) / SPAN;
}

export class PressureField {
  readonly values = new Float64Array(COUNT);
  readonly revision = 1;

  constructor() {
    for (let row = 0; row < TEXEL_ROWS; row += 1) {
      const y = TEXEL_ORIGIN_Y + (row + 0.5) * TEXEL_SIZE;
      const pressure = pressureAt(y);
      const start = row * TEXEL_COLUMNS;
      for (let column = 0; column < TEXEL_COLUMNS; column += 1) this.values[start + column] = pressure;
    }
  }
}
