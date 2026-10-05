/**
 * Stylized flagellar centerline from spec §12.2.
 * A soft envelope keeps the root planted while letting the wave begin near the base.
 * An active filament is a traveling sine. An idle one drifts like a loose chain.
 */

const WAVE_NUMBER = Math.PI * 4;

export interface RibbonPoint {
  x: number;
  y: number;
}

export type FlagellumMotion = "whip" | "chain" | "flail";

export interface FlagellinFilament {
  slot: number;
  mount: number;
  length: number;
}

/**
 * Map one site's flagellin, 0–1, onto up to three filaments.
 * Length climbs across the whole slider, to twice the body at the top.
 * A second filament joins halfway up, and a third near the top.
 * The same tuft is used at a pole or a flank. The site chooses where it roots.
 */
export function filamentsForFlagellin(amount: number, bodyLength: number): FlagellinFilament[] {
  const t = Math.min(1, Math.max(0, amount));
  if (t <= 1e-4 || bodyLength <= 1e-4) return [];
  const count = t < 0.5 ? 1 : t < 0.78 ? 2 : 3;
  const shared = bodyLength * 2 * t;
  if (count === 1) return [{ slot: 0, mount: 0, length: shared }];
  if (count === 2) {
    const emerge = Math.min(1, (t - 0.5) / 0.12);
    const spread = 0.16 * emerge;
    return [
      { slot: 0, mount: -spread, length: shared },
      { slot: 1, mount: spread, length: shared * emerge },
    ].filter((filament) => filament.length > 1e-3);
  }
  const emerge = Math.min(1, (t - 0.78) / 0.12);
  const side = 0.16 + 0.05 * emerge;
  return [
    { slot: 0, mount: -side, length: shared },
    { slot: 1, mount: side, length: shared },
    { slot: 2, mount: 0, length: shared * emerge },
  ].filter((filament) => filament.length > 1e-3);
}

const CILIUM_SEGMENTS = 6;
const CILIUM_POWER = 0.3;
const CILIUM_STROKE = 1.05;

/**
 * One cilium beat. The effective stroke is a quick, nearly straight sweep.
 * The recovery is slower and curls the tip back along the cell.
 * `phase` is radians. Neighbors should be offset so the beat travels.
 */
/** Reused centerlines. Callers must copy or draw before the next fill. */
export const whipScratch: RibbonPoint[] = Array.from({ length: 64 }, () => ({ x: 0, y: 0 }));
export const mixScratch: RibbonPoint[] = Array.from({ length: 64 }, () => ({ x: 0, y: 0 }));

export function fillCilium(
  out: RibbonPoint[],
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  phase: number,
  amplitude = 1,
): number {
  if (length < 1e-4) {
    out[0].x = rootX;
    out[0].y = rootY;
    return 1;
  }
  const sway = Math.min(1, Math.max(-1, amplitude));
  const base = Math.atan2(dirY, dirX);
  const { sweep, curl } = ciliumBeat(phase);
  const link = length / CILIUM_SEGMENTS;
  let x = rootX;
  let y = rootY;
  for (let i = 0; i <= CILIUM_SEGMENTS; i += 1) {
    out[i].x = x;
    out[i].y = y;
    if (i === CILIUM_SEGMENTS) break;
    const s = (i + 1) / CILIUM_SEGMENTS;
    const heading = base + (sweep * Math.pow(s, 1.15) + curl * Math.pow(s, 2.4)) * sway;
    x += Math.cos(heading) * link;
    y += Math.sin(heading) * link;
  }
  return CILIUM_SEGMENTS + 1;
}

export function ciliumCenterline(
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  phase: number,
  amplitude = 1,
): RibbonPoint[] {
  const points = Array.from({ length: CILIUM_SEGMENTS + 1 }, () => ({ x: 0, y: 0 }));
  const count = fillCilium(points, rootX, rootY, dirX, dirY, length, phase, amplitude);
  points.length = count;
  return points;
}

/** Traveling sine used while a filament is whipping. Writes `out` and returns the point count. */
export function fillWhip(
  out: RibbonPoint[],
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  amplitude: number,
  phase: number,
  velX: number,
  velY: number,
  segments: number,
): number {
  const sideX = -dirY;
  const sideY = dirX;
  const alongVel = velX * dirX + velY * dirY;
  const perpX = velX - alongVel * dirX;
  const perpY = velY - alongVel * dirY;
  const count = segments + 1;
  for (let i = 0; i < count; i += 1) {
    const s = segments > 0 ? i / segments : 0;
    const wave = amplitude * Math.pow(s, 1.25) * Math.sin(WAVE_NUMBER * s - phase);
    const trail = -0.14 * s * s;
    out[i].x = rootX + dirX * (length * s) + sideX * wave + perpX * trail;
    out[i].y = rootY + dirY * (length * s) + sideY * wave + perpY * trail;
  }
  return count;
}

export function fillMix(
  from: RibbonPoint[],
  fromCount: number,
  to: RibbonPoint[],
  toCount: number,
  t: number,
  out: RibbonPoint[],
): number {
  const count = Math.min(fromCount, toCount);
  for (let i = 0; i < count; i += 1) {
    out[i].x = from[i].x + (to[i].x - from[i].x) * t;
    out[i].y = from[i].y + (to[i].y - from[i].y) * t;
  }
  return count;
}

function ciliumBeat(phase: number): { sweep: number; curl: number } {
  const tau = Math.PI * 2;
  const cycle = (((phase % tau) + tau) % tau) / tau;
  if (cycle < CILIUM_POWER) {
    const u = cycle / CILIUM_POWER;
    const eased = u * u * (3 - 2 * u);
    return { sweep: -CILIUM_STROKE + 2 * CILIUM_STROKE * eased, curl: 0 };
  }
  const u = (cycle - CILIUM_POWER) / (1 - CILIUM_POWER);
  return {
    sweep: CILIUM_STROKE - 2 * CILIUM_STROKE * u,
    curl: -Math.sin(Math.PI * u) * 2.15,
  };
}

export function flagellumCenterline(
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  amplitude: number,
  phase: number,
  velX: number,
  velY: number,
  segments: number,
  motion: FlagellumMotion = "whip",
): RibbonPoint[] {
  if (motion === "chain") {
    return chainCenterline(rootX, rootY, dirX, dirY, length, amplitude, phase, segments);
  }
  if (motion === "flail") {
    return flailCenterline(rootX, rootY, dirX, dirY, length, phase, segments);
  }
  const points = Array.from({ length: segments + 1 }, () => ({ x: 0, y: 0 }));
  fillWhip(points, rootX, rootY, dirX, dirY, length, amplitude, phase, velX, velY, segments);
  return points;
}

/**
 * A filament with no undulation. The root stays on the cell and each link
 * keeps its place in the water, so the tail trails when the cell moves
 * and slowly wanders when the cell is still.
 *
 * The bend is overdamped: each joint eases toward a gentle rest curve and
 * never receives an extra kick. A hard stop on the whole filament's heading
 * made the tail slam into a limit and sit there until the drive reversed.
 */
export function stepLazyChain(
  previous: RibbonPoint[] | undefined,
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  segments: number,
  dt: number,
  phase: number,
): RibbonPoint[] {
  const count = segments + 1;
  const link = length / Math.max(segments, 1);
  if (!previous || previous.length !== count || Math.hypot(previous[0].x - rootX, previous[0].y - rootY) > Math.max(length, 1) * 4) {
    const seeded: RibbonPoint[] = [];
    for (let i = 0; i < count; i += 1) {
      seeded.push({ x: rootX + dirX * link * i, y: rootY + dirY * link * i });
    }
    return seeded;
  }
  const step = Math.min(Math.max(dt, 0), 0.05);
  const pole = Math.atan2(dirY, dirX);
  let parent = pole;
  let prevX = rootX;
  let prevY = rootY;
  previous[0].x = rootX;
  previous[0].y = rootY;
  for (let i = 1; i < count; i += 1) {
    const s = i / segments;
    const oldX = previous[i].x;
    const oldY = previous[i].y;
    const dx = oldX - prevX;
    const dy = oldY - prevY;
    const lagged = Math.hypot(dx, dy) < 1e-6 ? parent : Math.atan2(dy, dx);
    // One smooth arc. The tip wanders farther than the root, and the second
    // term shifts along the length so the bend travels instead of hinging.
    const wander =
      Math.sin(phase * 0.85) * 0.55 * s +
      Math.sin(phase * 0.4 + s * 1.15 + 1.2) * 0.28 * s;
    const rest = pole + wander;
    // Root tracks the motor. The tip is drag-limited and keeps its lag.
    const rate = 6 * (1 - s) + 2.2 * s;
    const relax = 1 - Math.exp(-step * rate);
    let heading = lagged + wrapAngle(rest - lagged) * relax;
    const bend = wrapAngle(heading - parent);
    const maxBend = 0.32 + 0.2 * s;
    heading = parent + Math.min(maxBend, Math.max(-maxBend, bend));
    prevX += Math.cos(heading) * link;
    prevY += Math.sin(heading) * link;
    previous[i].x = prevX;
    previous[i].y = prevY;
    parent = heading;
  }
  return previous;
}

/**
 * Counterclockwise flail. The motor wags the base and the bend travels out
 * along a dragged chain, so the tip follows late instead of the whole
 * filament rewriting its shape at once.
 */
export function stepFlail(
  previous: RibbonPoint[] | undefined,
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  segments: number,
  dt: number,
  phase: number,
): RibbonPoint[] {
  const count = segments + 1;
  const link = length / Math.max(segments, 1);
  const base = Math.atan2(dirY, dirX);
  if (
    !previous ||
    previous.length !== count ||
    Math.hypot(previous[0].x - rootX, previous[0].y - rootY) > Math.max(length, 1) * 4
  ) {
    const seeded: RibbonPoint[] = [];
    for (let i = 0; i < count; i += 1) {
      seeded.push({ x: rootX + dirX * link * i, y: rootY + dirY * link * i });
    }
    return seeded;
  }
  const step = Math.min(Math.max(dt, 0), 0.05);
  let parent = base;
  const sweep = Math.sin(phase * 0.48) * 0.58;
  let oldPrevX = previous[0].x;
  let oldPrevY = previous[0].y;
  previous[0].x = rootX;
  previous[0].y = rootY;
  for (let i = 1; i < count; i += 1) {
    const s = i / segments;
    const oldX = previous[i].x;
    const oldY = previous[i].y;
    const dx = oldX - oldPrevX;
    const dy = oldY - oldPrevY;
    const lagged = Math.hypot(dx, dy) < 1e-6 ? parent : Math.atan2(dy, dx);
    const travel = Math.sin(s * Math.PI * 0.85 - phase * 0.7) * 0.36;
    const offset = (sweep + travel) * s;
    const target = base + offset;
    const rate = 11 * (1 - s) + 4.2 * s;
    const relax = 1 - Math.exp(-step * rate);
    let heading = lagged + wrapAngle(target - lagged) * relax;
    const bend = wrapAngle(heading - parent);
    const maxBend = 0.26 + 0.16 * s;
    heading = parent + Math.min(maxBend, Math.max(-maxBend, bend));
    const x = previous[i - 1].x + Math.cos(heading) * link;
    const y = previous[i - 1].y + Math.sin(heading) * link;
    previous[i].x = x;
    previous[i].y = y;
    oldPrevX = oldX;
    oldPrevY = oldY;
    parent = heading;
  }
  return previous;
}

/** One frame of the flail's rest curve. The drawn flail is `stepFlail`, which lags behind this. */
function flailCenterline(
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  phase: number,
  segments: number,
): RibbonPoint[] {
  const points: RibbonPoint[] = [];
  if (length < 1e-4 || segments < 1) {
    points.push({ x: rootX, y: rootY });
    return points;
  }
  const base = Math.atan2(dirY, dirX);
  let heading = base;
  let x = rootX;
  let y = rootY;
  const link = length / segments;
  const sweep = Math.sin(phase * 0.48) * 0.58;
  for (let i = 0; i <= segments; i += 1) {
    points.push({ x, y });
    if (i === segments) break;
    const s = (i + 0.5) / segments;
    const travel = Math.sin(s * Math.PI * 0.85 - phase * 0.7) * 0.36;
    heading = base + (sweep + travel) * s;
    x += Math.cos(heading) * link;
    y += Math.sin(heading) * link;
  }
  return points;
}

function chainCenterline(
  rootX: number,
  rootY: number,
  dirX: number,
  dirY: number,
  length: number,
  amplitude: number,
  phase: number,
  segments: number,
): RibbonPoint[] {
  const points: RibbonPoint[] = [];
  if (length < 1e-4 || segments < 1) {
    points.push({ x: rootX, y: rootY });
    return points;
  }
  const base = Math.atan2(dirY, dirX);
  let heading = base;
  let x = rootX;
  let y = rootY;
  const link = length / segments;
  const flex = amplitude / length;
  for (let i = 0; i <= segments; i += 1) {
    points.push({ x, y });
    if (i === segments) break;
    const s = i / segments;
    const envelope = s * s;
    const curl =
      Math.sin(phase * 0.55) * 0.55 +
      Math.sin(phase * 0.33 + s * 1.8) * 0.85 +
      Math.sin(phase * 0.17 + s * 3.4 + 0.8) * 0.35;
    heading += (envelope * curl * flex * 3.2) / segments;
    const offset = wrapAngle(heading - base);
    heading = base + Math.min(1.35, Math.max(-1.35, offset));
    const step = link * (1 - 0.05 * envelope);
    x += Math.cos(heading) * step;
    y += Math.sin(heading) * step;
  }
  return points;
}

function wrapAngle(angle: number): number {
  const tau = Math.PI * 2;
  const wrapped = ((angle + Math.PI) % tau + tau) % tau;
  return wrapped - Math.PI;
}

const ribbonNormX = new Float32Array(64);
const ribbonNormY = new Float32Array(64);

/** Writes a triangle strip as xyzw vertices. `z` is clip depth and `alpha` is coverage. Returns the new cursor. */
export function appendRibbon(
  points: RibbonPoint[],
  count: number,
  halfWidth: number,
  out: Float32Array,
  cursor: number,
  z: number,
  alpha: number,
): number {
  if (count < 2 || count > ribbonNormX.length) return cursor;
  const end = cursor + (count - 1) * 24;
  if (end > out.length) return cursor;
  for (let i = 0; i < count; i += 1) {
    const i0 = i === 0 ? 0 : i - 1;
    const i1 = i + 1 < count ? i + 1 : count - 1;
    let tx = points[i1].x - points[i0].x;
    let ty = points[i1].y - points[i0].y;
    const len = Math.hypot(tx, ty);
    if (len < 1e-6) {
      tx = 1;
      ty = 0;
    } else {
      tx /= len;
      ty /= len;
    }
    ribbonNormX[i] = -ty * halfWidth;
    ribbonNormY[i] = tx * halfWidth;
  }
  for (let i = 0; i < count - 1; i += 1) {
    const l0x = points[i].x + ribbonNormX[i];
    const l0y = points[i].y + ribbonNormY[i];
    const r0x = points[i].x - ribbonNormX[i];
    const r0y = points[i].y - ribbonNormY[i];
    const l1x = points[i + 1].x + ribbonNormX[i + 1];
    const l1y = points[i + 1].y + ribbonNormY[i + 1];
    const r1x = points[i + 1].x - ribbonNormX[i + 1];
    const r1y = points[i + 1].y - ribbonNormY[i + 1];
    cursor = writeRibbonVertex(out, cursor, l0x, l0y, z, alpha);
    cursor = writeRibbonVertex(out, cursor, r0x, r0y, z, alpha);
    cursor = writeRibbonVertex(out, cursor, l1x, l1y, z, alpha);
    cursor = writeRibbonVertex(out, cursor, r0x, r0y, z, alpha);
    cursor = writeRibbonVertex(out, cursor, r1x, r1y, z, alpha);
    cursor = writeRibbonVertex(out, cursor, l1x, l1y, z, alpha);
  }
  return cursor;
}

function writeRibbonVertex(out: Float32Array, cursor: number, x: number, y: number, z: number, alpha: number): number {
  out[cursor] = x;
  out[cursor + 1] = y;
  out[cursor + 2] = z;
  out[cursor + 3] = alpha;
  return cursor + 4;
}
