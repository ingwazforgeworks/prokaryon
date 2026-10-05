/** How strongly each body pigment is expressed, from 0 to 1. */
export type PigmentLevels = {
  carotin: number;
  rhodin: number;
  siderin: number;
  cryptochrome: number;
};

export const PIGMENT_KEYS = ["carotin", "rhodin", "siderin", "cryptochrome"] as const;

/** Neutral cytoplasm. Multiplying the gray palette by this leaves it unchanged. */
export const NEUTRAL_PIGMENT: [number, number, number] = [1, 1, 1];

const PIGMENT_COLOR: Record<(typeof PIGMENT_KEYS)[number], [number, number, number]> = {
  carotin: [1, 0.78, 0.08],
  rhodin: [0.18, 0.74, 0.22],
  siderin: [0.84, 0.14, 0.12],
  cryptochrome: [0.16, 0.32, 0.9],
};

/** Fluorescent proteins. Each value is expression from 0 to 1. */
export type FluorLevels = {
  gfp: number;
  yfp: number;
  bfp: number;
  rfp: number;
};

export const FLUOR_KEYS = ["gfp", "yfp", "bfp", "rfp"] as const;

const FLUOR_COLOR: Record<(typeof FLUOR_KEYS)[number], [number, number, number]> = {
  gfp: [0.15, 0.95, 0.28],
  yfp: [1, 0.88, 0.12],
  bfp: [0.22, 0.38, 1],
  rfp: [1, 0.14, 0.16],
};

export function emptyPigment(): PigmentLevels {
  return { carotin: 0, rhodin: 0, siderin: 0, cryptochrome: 0 };
}

export function emptyFluor(): FluorLevels {
  return { gfp: 0, yfp: 0, bfp: 0, rfp: 0 };
}

export function copyPigment(levels: PigmentLevels): PigmentLevels {
  return {
    carotin: levels.carotin,
    rhodin: levels.rhodin,
    siderin: levels.siderin,
    cryptochrome: levels.cryptochrome,
  };
}

export function copyFluor(levels: FluorLevels): FluorLevels {
  return { gfp: levels.gfp, yfp: levels.yfp, bfp: levels.bfp, rfp: levels.rfp };
}

/**
 * Light emitted by the fluorescent proteins.
 * Colors add, and the total gets brighter as more of them are expressed.
 * Zero means the cell is dark.
 */
export function fluorEmission(levels: FluorLevels): [number, number, number] {
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const key of FLUOR_KEYS) {
    const amount = Math.min(1, Math.max(0, levels[key]));
    if (amount <= 0) continue;
    const color = FLUOR_COLOR[key];
    red += color[0] * amount;
    green += color[1] * amount;
    blue += color[2] * amount;
  }
  return [red, green, blue];
}

/**
 * Body-color multiplier for the cytoplasm palette.
 * Each pigment is a filter: none of it passes every channel, and a full dose
 * passes only its own color. Filters multiply, so a higher total load absorbs
 * more light. All four at full strength leave almost nothing.
 */
export function pigmentTint(levels: PigmentLevels): [number, number, number] {
  let red = NEUTRAL_PIGMENT[0];
  let green = NEUTRAL_PIGMENT[1];
  let blue = NEUTRAL_PIGMENT[2];
  for (const key of PIGMENT_KEYS) {
    const amount = Math.min(1, Math.max(0, levels[key]));
    if (amount <= 0) continue;
    const color = PIGMENT_COLOR[key];
    red *= 1 + (color[0] - 1) * amount;
    green *= 1 + (color[1] - 1) * amount;
    blue *= 1 + (color[2] - 1) * amount;
  }
  return [red, green, blue];
}
