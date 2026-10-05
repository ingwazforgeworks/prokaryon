import { COLUMN_BOTTOM, COLUMN_TOP } from "./light";
import { WORLD_BOTTOM, WORLD_LEFT, WORLD_RIGHT } from "./terrain";

/**
 * Invisible water-column cells. Each texel is a square region that can later
 * carry temperature, pH, light, and the rest of the local environment.
 * Columns are letters A–X from west to east. Rows are numbers 1–100 from the
 * bottom of the column up, so the id reads like 40G.
 */
export const TEXEL_SIZE = 10;
export const TEXEL_ORIGIN_X = WORLD_LEFT;
export const TEXEL_ORIGIN_Y = COLUMN_BOTTOM;
export const TEXEL_SPAN_X = WORLD_RIGHT - WORLD_LEFT;
export const TEXEL_SPAN_Y = COLUMN_TOP - COLUMN_BOTTOM;
export const TEXEL_COLUMNS = TEXEL_SPAN_X / TEXEL_SIZE;
export const TEXEL_ROWS = TEXEL_SPAN_Y / TEXEL_SIZE;

if (WORLD_BOTTOM !== COLUMN_BOTTOM) {
  throw new Error("water column bottom does not match the terrain");
}
if (!Number.isInteger(TEXEL_COLUMNS) || !Number.isInteger(TEXEL_ROWS) || TEXEL_COLUMNS > 26) {
  throw new Error("texel size does not divide the water column into A–Z columns");
}

export interface Texel {
  /** Row number then column letter, such as 40G. */
  id: string;
  /** 0 at the west edge. */
  column: number;
  /** 0 at the bottom of the column. The id uses row + 1. */
  row: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const TEXELS: readonly Texel[] = buildTexels();

export function texelAt(x: number, y: number): Texel | null {
  if (x < TEXEL_ORIGIN_X || y < TEXEL_ORIGIN_Y || x > TEXEL_ORIGIN_X + TEXEL_SPAN_X || y > TEXEL_ORIGIN_Y + TEXEL_SPAN_Y) {
    return null;
  }
  const column = Math.min(TEXEL_COLUMNS - 1, Math.floor((x - TEXEL_ORIGIN_X) / TEXEL_SIZE));
  const row = Math.min(TEXEL_ROWS - 1, Math.floor((y - TEXEL_ORIGIN_Y) / TEXEL_SIZE));
  return TEXELS[row * TEXEL_COLUMNS + column];
}

export function texelIdAt(x: number, y: number): string | null {
  return texelAt(x, y)?.id ?? null;
}

function buildTexels(): Texel[] {
  const cells: Texel[] = [];
  for (let row = 0; row < TEXEL_ROWS; row += 1) {
    for (let column = 0; column < TEXEL_COLUMNS; column += 1) {
      const x0 = TEXEL_ORIGIN_X + column * TEXEL_SIZE;
      const y0 = TEXEL_ORIGIN_Y + row * TEXEL_SIZE;
      cells.push({
        id: `${row + 1}${columnLetter(column)}`,
        column,
        row,
        x0,
        y0,
        x1: x0 + TEXEL_SIZE,
        y1: y0 + TEXEL_SIZE,
      });
    }
  }
  return cells;
}

function columnLetter(column: number): string {
  return String.fromCharCode(65 + column);
}
