import { capsuleDistance, capsuleFromLengthWidth } from "./shape";

export interface Granule {
  x: number;
  y: number;
  r: number;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, Granule[]>();

/** Seeded inclusions. Placement is cosmetic and does not affect the simulation. */
export function granulesFor(seed: number, length: number, width: number): Granule[] {
  const key = `${seed}:${length.toFixed(4)}:${width.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const shape = capsuleFromLengthWidth(length, width);
  const rng = mulberry32(seed);
  const count = 3 + (seed % 3);
  const placed: Granule[] = [];
  let attempts = 0;
  while (placed.length < count && attempts < 48) {
    attempts += 1;
    const x = (rng() * 2 - 1) * (shape.halfSegment + shape.radius * 0.55);
    const y = (rng() * 2 - 1) * shape.radius * 0.72;
    const r = 0.045 + rng() * 0.04;
    if (capsuleDistance(x, y, shape) < -0.1 - r) {
      const clear = placed.every((g) => Math.hypot(g.x - x, g.y - y) > g.r + r + 0.03);
      if (clear) placed.push({ x, y, r });
    }
  }
  cache.set(key, placed);
  return placed;
}
