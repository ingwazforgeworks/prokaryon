/** How long the punctured cell deflates before it tears apart. */
export const APOPTOSIS_COLLAPSE_SECONDS = 0.8;
/** How long scraps keep leaving the hole while the cell deflates. */
export const APOPTOSIS_SQUIRT_SECONDS = 0.72;
/** How long the debris and shards stay fully visible after the cell breaks. */
export const APOPTOSIS_HOLD_SECONDS = 5;
/** How long everything takes to fade once the hold ends. */
export const APOPTOSIS_FADE_SECONDS = 0.8;

const CHIP_IMMEDIATE = 4;
const CHIP_TOTAL = 24;
const SHARD_COUNT = 8;
/**
 * How far the valleys cave in, in resting-shrivel units.
 * 1 matches the osmotic slider at full shrivel. Deeper than that empties the
 * cell while the crests of the membrane stay at the original hull.
 */
const SHRIVEL_DEPTH = 3.2;
/** Exponential rate. Most of the volume is gone early; the rest eases out. */
const SHRIVEL_RATE = 4.2;
/** Launch speed of a membrane scrap. Quieter than a pilus shot, same water. */
const CHIP_SPEED_MIN = 2.3;
const CHIP_SPEED_SPAN = 1.8;
/** Half-width of the exit cone, in radians. Each scrap picks its own angle inside it. */
const CHIP_TILT = 0.465;
/** How far a scrap coasts, in body lengths. Drag is set so the stop lands in this band. */
const CHIP_COAST_MIN = 0.5;
const CHIP_COAST_SPAN = 2.5;
/**
 * The old deflation shortened length by 0.60 and width by 0.672.
 * This keeps half of that, on the same fast-then-slow curve as the volume.
 */
const LENGTH_DROP = 0.3;
const WIDTH_DROP = 0.336;
/** Large pieces coast farther. They have more inertia than a pilus needle. */
const SHARD_DRAG = 4.5;
const SHARD_SPEED_MIN = 0.55;
const SHARD_SPEED_SPAN = 0.85;

export type DebrisKind = "chip" | "shard";

export type DebrisPiece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  /** Spin slows with the same drag as the drift. */
  drag: number;
  rx: number;
  ry: number;
  /** Polygon irregularity. The renderer turns this into a jagged outline. */
  seed: number;
  /** Convex corner count, 3 through 6. */
  sides: number;
  kind: DebrisKind;
  fill: [number, number, number];
  rim: [number, number, number];
};

export type ApoptosisBurst = {
  age: number;
  cellId: number;
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  holeX: number;
  holeY: number;
  holeDirX: number;
  holeDirY: number;
  holeTanX: number;
  holeTanY: number;
  fill: [number, number, number];
  rim: [number, number, number];
  seed: number;
  chipsBorn: number;
  shardsSpawned: boolean;
  pieces: DebrisPiece[];
};

export type BurstOrigin = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
  fill: readonly [number, number, number];
  rim: readonly [number, number, number];
  seed: number;
};

export type BodyCollapse = {
  /** Multipliers on the living length and width. A modest shrink beside the wrinkles. */
  length: number;
  width: number;
  x: number;
  y: number;
  /** Osmotic stress. Negative caves the membrane inward. */
  shrivel: number;
};

function hash(seed: number, index: number, channel: number): number {
  const n = Math.sin(seed * 12.9898 + index * 78.233 + channel * 39.425) * 43758.5453;
  return n - Math.floor(n);
}

function mixColor(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  t: number,
): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function placeHole(origin: BurstOrigin): { x: number; y: number; dirX: number; dirY: number; tanX: number; tanY: number } {
  const theta = hash(origin.seed, 0, 0) * Math.PI * 2;
  const hx = Math.max(origin.length, 0.05) * 0.5;
  const hy = Math.max(origin.width, 0.05) * 0.5;
  const lx = Math.cos(theta) * hx;
  const ly = Math.sin(theta) * hy;
  let ox = Math.cos(theta) / hx;
  let oy = Math.sin(theta) / hy;
  const span = Math.hypot(ox, oy) || 1;
  ox /= span;
  oy /= span;
  const c = Math.cos(origin.angle);
  const s = Math.sin(origin.angle);
  const dirX = c * ox - s * oy;
  const dirY = s * ox + c * oy;
  return {
    x: origin.x + c * lx - s * ly,
    y: origin.y + s * lx + c * ly,
    dirX,
    dirY,
    tanX: -dirY,
    tanY: dirX,
  };
}

/** Fraction of the cell's volume that has left. Fast at first, then slower. */
export function volumeLost(age: number): number {
  const t = Math.min(1, Math.max(0, age / APOPTOSIS_COLLAPSE_SECONDS));
  const span = 1 - Math.exp(-SHRIVEL_RATE);
  return (1 - Math.exp(-SHRIVEL_RATE * t)) / span;
}

/** The living body while it deflates. Null once it has torn into shards. */
export function bodyCollapse(burst: ApoptosisBurst): BodyCollapse | null {
  if (burst.age >= APOPTOSIS_COLLAPSE_SECONDS) return null;
  const lost = volumeLost(burst.age);
  return {
    length: 1 - LENGTH_DROP * lost,
    width: 1 - WIDTH_DROP * lost,
    x: burst.x,
    y: burst.y,
    shrivel: -SHRIVEL_DEPTH * lost,
  };
}

/** 1 from the puncture through the five-second hold, then down to 0. */
export function burstAlpha(age: number): number {
  const fadeStart = APOPTOSIS_COLLAPSE_SECONDS + APOPTOSIS_HOLD_SECONDS;
  if (age < fadeStart) return 1;
  const t = (age - fadeStart) / APOPTOSIS_FADE_SECONDS;
  if (t >= 1 - 1e-9) return 0;
  return 1 - t;
}

/** True once the fade has finished and the cell can be removed. */
export function burstSettled(age: number): boolean {
  return age >= APOPTOSIS_COLLAPSE_SECONDS + APOPTOSIS_HOLD_SECONDS + APOPTOSIS_FADE_SECONDS - 1e-9;
}

/**
 * Another living cell to follow after `deadId` is removed.
 * Null when that cell was the last one in the population.
 */
export function apoptosisSuccessor(lineage: readonly number[], deadId: number): number | null {
  const rest = lineage.filter((id) => id !== deadId);
  if (rest.length === 0) return null;
  const index = lineage.indexOf(deadId);
  const slot = index < 0 ? 0 : Math.min(index, rest.length - 1);
  return rest[slot] ?? rest[0] ?? null;
}

function emitChip(burst: ApoptosisBurst, index: number): void {
  const tilt = (hash(burst.seed, index, 1) - 0.5) * 2 * CHIP_TILT;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  const dirX = burst.holeDirX * cos - burst.holeDirY * sin;
  const dirY = burst.holeDirX * sin + burst.holeDirY * cos;
  const launch = CHIP_SPEED_MIN + hash(burst.seed, index, 2) * CHIP_SPEED_SPAN;
  const slide = (hash(burst.seed, index, 3) - 0.5) * 0.3375;
  const vx = dirX * launch + burst.holeTanX * launch * slide;
  const vy = dirY * launch + burst.holeTanY * launch * slide;
  const body = Math.max(burst.length, 0.05);
  const coast = (CHIP_COAST_MIN + hash(burst.seed, index, 14) * CHIP_COAST_SPAN) * body;
  const drag = Math.hypot(vx, vy) / coast;
  const along = (hash(burst.seed, index, 4) - 0.5) * burst.width * 0.16;
  const reach = Math.max(burst.length, burst.width) * 0.5;
  const long = hash(burst.seed, index, 5) > 0.72;
  const rx = reach * (long ? 0.2 + hash(burst.seed, index, 6) * 0.12 : 0.16 + hash(burst.seed, index, 6) * 0.16);
  const ry = reach * (long ? 0.12 + hash(burst.seed, index, 7) * 0.08 : 0.1 + hash(burst.seed, index, 7) * 0.08);
  const birth = Math.max(rx, ry) + 0.03;
  const membrane = hash(burst.seed, index, 8) * 0.35;
  const shade = 1.05 + hash(burst.seed, index, 9) * 0.25;
  const fill = mixColor(burst.fill, burst.rim, membrane).map((channel) => channel * shade) as [number, number, number];
  burst.pieces.push({
    x: burst.holeX + dirX * birth + burst.holeTanX * along,
    y: burst.holeY + dirY * birth + burst.holeTanY * along,
    vx,
    vy,
    angle: Math.atan2(dirY, dirX) + (hash(burst.seed, index, 10) - 0.5) * 1.4,
    spin: (hash(burst.seed, index, 11) - 0.5) * 7,
    drag,
    rx,
    ry,
    seed: hash(burst.seed, index, 12) * 1000 + 1,
    sides: 3 + Math.floor(hash(burst.seed, index, 13) * 3),
    kind: "chip",
    fill,
    rim: [burst.rim[0], burst.rim[1], burst.rim[2]],
  });
}

function emitShards(burst: ApoptosisBurst): void {
  const c = Math.cos(burst.angle);
  const s = Math.sin(burst.angle);
  const halfL = Math.max(burst.length, 0.05) * 0.5;
  const halfW = Math.max(burst.width, 0.05) * 0.5;
  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const along = (hash(burst.seed, i, 21) - 0.5) * halfL * 1.35;
    const across = (hash(burst.seed, i, 22) - 0.5) * halfW * 1.35;
    const x = burst.x + c * along - s * across;
    const y = burst.y + s * along + c * across;
    let ox = x - burst.x;
    let oy = y - burst.y;
    if (ox * ox + oy * oy < 1e-6) {
      const ring = (i / SHARD_COUNT) * Math.PI * 2;
      ox = Math.cos(ring);
      oy = Math.sin(ring);
    }
    const span = Math.hypot(ox, oy) || 1;
    const jitter = (hash(burst.seed, i, 23) - 0.5) * 0.8;
    const dirX = ox / span;
    const dirY = oy / span;
    const travelX = dirX * Math.cos(jitter) - dirY * Math.sin(jitter);
    const travelY = dirX * Math.sin(jitter) + dirY * Math.cos(jitter);
    const speed = SHARD_SPEED_MIN + hash(burst.seed, i, 24) * SHARD_SPEED_SPAN;
    const reach = Math.max(burst.length, burst.width) * 0.5;
    const skinny = hash(burst.seed, i, 25) > 0.62;
    const rx = reach * (skinny ? 0.26 + hash(burst.seed, i, 26) * 0.12 : 0.22 + hash(burst.seed, i, 26) * 0.16);
    const ry = reach * (skinny ? 0.14 + hash(burst.seed, i, 27) * 0.08 : 0.16 + hash(burst.seed, i, 27) * 0.12);
    const shade = 1.05 + hash(burst.seed, i, 28) * 0.25;
    burst.pieces.push({
      x,
      y,
      vx: travelX * speed,
      vy: travelY * speed,
      angle: burst.angle + (hash(burst.seed, i, 29) - 0.5) * Math.PI,
      spin: (hash(burst.seed, i, 30) - 0.5) * 2.4,
      drag: SHARD_DRAG,
      rx,
      ry,
      seed: hash(burst.seed, i, 31) * 1000 + 40,
      sides: 3 + Math.floor(hash(burst.seed, i, 32) * 4),
      kind: "shard",
      fill: [burst.fill[0] * shade, burst.fill[1] * shade, burst.fill[2] * shade],
      rim: [burst.rim[0], burst.rim[1], burst.rim[2]],
    });
  }
  burst.shardsSpawned = true;
}

function coast(piece: DebrisPiece, dt: number): void {
  const drag = Math.max(piece.drag, 1e-4);
  const decay = Math.exp(-drag * dt);
  const travel = (1 - decay) / drag;
  piece.x += piece.vx * travel;
  piece.y += piece.vy * travel;
  piece.vx *= decay;
  piece.vy *= decay;
  piece.angle += piece.spin * travel;
  piece.spin *= decay;
}

export function spawnBurst(origin: BurstOrigin, cellId: number): ApoptosisBurst {
  const hole = placeHole(origin);
  const burst: ApoptosisBurst = {
    age: 0,
    cellId,
    x: origin.x,
    y: origin.y,
    angle: origin.angle,
    length: origin.length,
    width: origin.width,
    holeX: hole.x,
    holeY: hole.y,
    holeDirX: hole.dirX,
    holeDirY: hole.dirY,
    holeTanX: hole.tanX,
    holeTanY: hole.tanY,
    fill: [origin.fill[0], origin.fill[1], origin.fill[2]],
    rim: [origin.rim[0], origin.rim[1], origin.rim[2]],
    seed: origin.seed,
    chipsBorn: 0,
    shardsSpawned: false,
    pieces: [],
  };
  for (let i = 0; i < CHIP_IMMEDIATE; i += 1) emitChip(burst, i);
  burst.chipsBorn = CHIP_IMMEDIATE;
  return burst;
}

export function stepBurst(burst: ApoptosisBurst, dt: number): void {
  if (dt <= 0) return;
  const before = burst.age;
  for (const piece of burst.pieces) coast(piece, dt);
  burst.age = before + dt;
  const squirt = Math.min(burst.age, APOPTOSIS_SQUIRT_SECONDS) / APOPTOSIS_SQUIRT_SECONDS;
  const due =
    burst.age >= APOPTOSIS_SQUIRT_SECONDS
      ? CHIP_TOTAL
      : CHIP_IMMEDIATE + Math.floor(squirt * (CHIP_TOTAL - CHIP_IMMEDIATE));
  while (burst.chipsBorn < due) {
    emitChip(burst, burst.chipsBorn);
    burst.chipsBorn += 1;
  }
  if (!burst.shardsSpawned && before < APOPTOSIS_COLLAPSE_SECONDS && burst.age >= APOPTOSIS_COLLAPSE_SECONDS) {
    const start = burst.pieces.length;
    emitShards(burst);
    const overflow = burst.age - APOPTOSIS_COLLAPSE_SECONDS;
    if (overflow > 0) {
      for (let i = start; i < burst.pieces.length; i += 1) {
        const piece = burst.pieces[i];
        if (piece) coast(piece, overflow);
      }
    }
  }
}
