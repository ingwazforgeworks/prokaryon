/** Capsule SDF shared with the simulation. Spec §7.2. */

import type { CellSnapshot, CellTaper, CiliaSwitch, PilusSnapshot } from "./types";

export interface CapsuleShape {
  halfSegment: number;
  radius: number;
  lateral?: boolean;
}

export function capsuleFromLengthWidth(length: number, width: number): CapsuleShape {
  const radius = width * 0.5;
  const halfSegment = Math.max(0, length * 0.5 - radius);
  return { halfSegment, radius };
}

/** Capsule along local X, or along local Y when the cell is thicker than it is long. */
export function orientedCapsule(length: number, width: number): CapsuleShape {
  if (length >= width) return capsuleFromLengthWidth(length, width);
  return { ...capsuleFromLengthWidth(width, length), lateral: true };
}

/** Area of the capsule, including a circle when length and width match. */
export function capsuleArea(length: number, width: number): number {
  const shape = orientedCapsule(length, width);
  return shape.halfSegment * shape.radius * 4 + Math.PI * shape.radius * shape.radius;
}

export function toLocal(x: number, y: number, lateral: boolean): [number, number] {
  return lateral ? [-y, x] : [x, y];
}

function toAxis(x: number, y: number, lateral: boolean): [number, number] {
  return lateral ? [y, -x] : [x, y];
}

export function capsuleDistance(x: number, y: number, shape: CapsuleShape): number {
  const nearestX = Math.min(Math.max(x, -shape.halfSegment), shape.halfSegment);
  const dx = x - nearestX;
  return Math.hypot(dx, y) - shape.radius;
}

/** Half-angle of the centerline at full crescent and full elongation: 120° of bend. */
export const VIBRIO_HALF_ANGLE = Math.PI / 3;

export function vibrioHalfAngle(crescent: number, elongation: number): number {
  const curve = Math.min(1, Math.max(0, crescent)) * Math.min(1, Math.max(0, elongation));
  return curve * VIBRIO_HALF_ANGLE;
}

export function curvedHalfExtents(shape: CapsuleShape, bend: number): [number, number] {
  const lateral = shape.lateral === true;
  let halfX: number;
  let halfY: number;
  if (bend < 1e-3 || shape.halfSegment < 1e-4) {
    halfX = shape.halfSegment + shape.radius;
    halfY = shape.radius;
  } else {
    const arcR = shape.halfSegment / bend;
    const sagitta = arcR * (1 - Math.cos(bend));
    halfX = arcR * Math.sin(bend) + shape.radius;
    halfY = sagitta + shape.radius;
  }
  return lateral ? [halfY, halfX] : [halfX, halfY];
}

/**
 * Local angle of the long axis, which fission cuts across.
 * Null when the two axes are close enough that the body is round.
 */
export function divisionAxisOffset(halfX: number, halfY: number): number | null {
  const long = Math.max(halfX, halfY);
  const short = Math.min(halfX, halfY);
  if (short <= 1e-8 || long / short < 1.08) return null;
  return halfX >= halfY ? 0 : Math.PI / 2;
}

export function arcPoint(arcR: number, angle: number): [number, number] {
  return [arcR * Math.sin(angle), arcR * (Math.cos(angle) - 1)];
}

/** Below this length/width ratio the body is round and has no long axis. */
const ROUND_AXIS_RATIO = 1.08;

/** Local angle of the flagellar axis: 0 along elongation, π/2 when girth is the long axis. */
export function flagellarAxisLocal(length: number, width: number): number {
  if (width > length * ROUND_AXIS_RATIO) return Math.PI / 2;
  return 0;
}

/**
 * Position along the long axis, −1 at the antipolar pole and +1 at the polar pole.
 * Both flanks at the same station share a value, including on a crescent.
 */
export function longAxisT(x: number, y: number, length: number, width: number, bend: number): number {
  const shape = orientedCapsule(length, width);
  const [ax, ay] = toAxis(x, y, shape.lateral === true);
  const reach = shape.halfSegment + shape.radius;
  if (bend < 1e-3 || shape.halfSegment < 1e-4 || reach < 1e-6) {
    return Math.min(1, Math.max(-1, ax / Math.max(reach, 1e-6)));
  }
  const arcR = shape.halfSegment / bend;
  const ang = Math.min(bend, Math.max(-bend, Math.atan2(ax, ay + arcR)));
  return ang / bend;
}

/** +1 on the lateral flank of the long axis, −1 on the antilateral flank. */
export function longAxisSide(x: number, y: number, length: number, width: number, bend: number): number {
  const shape = orientedCapsule(length, width);
  const [ax, ay] = toAxis(x, y, shape.lateral === true);
  if (bend < 1e-3 || shape.halfSegment < 1e-4) return ay >= 0 ? 1 : -1;
  const arcR = shape.halfSegment / bend;
  const ang = Math.min(bend, Math.max(-bend, Math.atan2(ax, ay + arcR)));
  const [nx, ny] = arcPoint(arcR, ang);
  const across = (ax - nx) * Math.sin(ang) + (ay - ny) * Math.cos(ang);
  return across >= 0 ? 1 : -1;
}

/**
 * +1 where a cilium keeps the resting power stroke, −1 where that stroke is mirrored.
 * A flank choice splits lateral from antilateral. A pole choice splits polar from antipolar.
 * The named site is the half that keeps the resting stroke.
 */
export function ciliaStrokeSign(
  x: number,
  y: number,
  length: number,
  width: number,
  bend: number,
  site: CiliaSwitch,
): number {
  if (site === "polar" || site === "antipolar") {
    const towardPolar = longAxisT(x, y, length, width, bend) >= 0 ? 1 : -1;
    return site === "polar" ? towardPolar : -towardPolar;
  }
  const flank = longAxisSide(x, y, length, width, bend);
  return site === "antilateral" ? -flank : flank;
}

export interface FlagellumAnchor {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
}

/**
 * End-to-end size of the axis flagella attach to.
 * A round cell uses the axis elongation would stretch.
 */
export function flagellarBodyLength(length: number, width: number): number {
  const lateral = width > length;
  const longOnCenterline = lateral ? width > length * ROUND_AXIS_RATIO : length > width * ROUND_AXIS_RATIO;
  if (lateral && !longOnCenterline) return length;
  return lateral ? width : length;
}

/** Where a flagellar tuft emerges. Poles are the long-axis caps. Flanks are the two sides. */
export type FlagellumSite = "polar" | "antipolar" | "lateral" | "antilateral";

/**
 * Surface root of one pole. `pole` is -1 (antipolar) or +1 (polar).
 * `mount` fans the filament around that cap, in radians.
 * Polar is the positive end of the long axis, or of the elongation axis when the cell is round.
 */
export function flagellumAnchor(
  length: number,
  width: number,
  bend: number,
  pole: number,
  mount: number,
): FlagellumAnchor {
  return flagellumSiteAnchor(length, width, bend, pole < 0 ? "antipolar" : "polar", mount);
}

/**
 * Surface root of one emergence site.
 * `mount` fans the filament around that root, in radians.
 * Poles sit on the long axis, or on the elongation axis when the cell is round.
 * Lateral and antilateral sit on the two flanks of that same axis.
 */
export function flagellumSiteAnchor(
  length: number,
  width: number,
  bend: number,
  site: FlagellumSite,
  mount: number,
): FlagellumAnchor {
  const axial = site === "polar" || site === "antipolar";
  const sign = site === "polar" || site === "lateral" ? 1 : -1;
  const shape = orientedCapsule(length, width);
  const lateral = shape.lateral === true;
  const longOnCenterline = lateral ? width > length * ROUND_AXIS_RATIO : length > width * ROUND_AXIS_RATIO;
  const onCenterline = longOnCenterline || !lateral;
  let x: number;
  let y: number;
  let dirX: number;
  let dirY: number;
  if (onCenterline) {
    const cap = axial ? centerlineCap(shape, bend, sign) : centerlineFlank(shape, sign);
    [x, y] = toLocal(cap.x, cap.y, lateral);
    [dirX, dirY] = toLocal(cap.dirX, cap.dirY, lateral);
  } else if (axial) {
    dirX = sign;
    dirY = 0;
    const reach = surfaceReach(length, width, bend, dirX, dirY);
    x = dirX * reach;
    y = 0;
  } else {
    dirX = 0;
    dirY = sign;
    const reach = surfaceReach(length, width, bend, dirX, dirY);
    x = 0;
    y = dirY * reach;
  }
  const mag = Math.hypot(dirX, dirY) || 1;
  dirX /= mag;
  dirY /= mag;
  if (Math.abs(mount) < 1e-6) return { x, y, dirX, dirY };
  const c = Math.cos(mount);
  const s = Math.sin(mount);
  const nx = dirX * c - dirY * s;
  const ny = dirX * s + dirY * c;
  return {
    x: x + (nx - dirX) * shape.radius,
    y: y + (ny - dirY) * shape.radius,
    dirX: nx,
    dirY: ny,
  };
}

export interface CiliumPlacement {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  length: number;
}

/** Longest a cilium grows: half the capsule's minor radius. */
export function maxCiliumLength(length: number, width: number): number {
  return orientedCapsule(length, width).radius * 0.5;
}

const OUTLINE_SAMPLES = 128;

/** Sides named by the morphology taper control. Combined with bitwise or. */
export const TAPER_POLAR = 1;
export const TAPER_ANTIPOLAR = 2;
export const TAPER_LATERAL = 4;
export const TAPER_ANTILATERAL = 8;
/** Every side at once. Even compression leaves the outline unchanged. */
export const TAPER_ALL = TAPER_POLAR | TAPER_ANTIPOLAR | TAPER_LATERAL | TAPER_ANTILATERAL;
/** Fraction of the radius kept on a fully tapered side. Matches the shader. */
export const TAPER_PINCH = 0.5;

type TaperInput = number | CellTaper | undefined;

function clampDegree(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** A mask number is full degree on those sides. Missing degrees are full as well. */
function resolveTaper(taper: TaperInput): CellTaper {
  if (typeof taper === "number") return { mask: taper, polar: 1, antipolar: 1, lateral: 1, antilateral: 1 };
  if (!taper) return { mask: 0, polar: 1, antipolar: 1, lateral: 1, antilateral: 1 };
  return taper;
}

/**
 * Pinch applied on polar, antipolar, lateral, and antilateral.
 * An unselected side is 0. A selected side uses its degree directly.
 * Every side at once is measured from the smallest degree, so a matched
 * setting stays even and leaves the outline unchanged.
 */
export function effectiveTaperDegrees(taper: TaperInput): [number, number, number, number] {
  const spec = resolveTaper(taper);
  const mask = spec.mask & TAPER_ALL;
  const raw: [number, number, number, number] = [
    (mask & TAPER_POLAR) !== 0 ? clampDegree(spec.polar) : 0,
    (mask & TAPER_ANTIPOLAR) !== 0 ? clampDegree(spec.antipolar) : 0,
    (mask & TAPER_LATERAL) !== 0 ? clampDegree(spec.lateral) : 0,
    (mask & TAPER_ANTILATERAL) !== 0 ? clampDegree(spec.antilateral) : 0,
  ];
  if (mask !== TAPER_ALL) return raw;
  const base = Math.min(raw[0], raw[1], raw[2], raw[3]);
  return [raw[0] - base, raw[1] - base, raw[2] - base, raw[3] - base];
}

/** Nonzero when any side actually pinches. None and an even all-sides taper both return 0. */
export function taperEffective(taper: TaperInput): number {
  const [polar, antipolar, lateral, antilateral] = effectiveTaperDegrees(taper);
  const sum = polar + antipolar + lateral + antilateral;
  return sum > 1e-4 ? sum : 0;
}

/** Outline queries use this while cilia and pili are placed on a tapered membrane. */
let outlineTaper: TaperInput = 0;

/**
 * `count` cilia spaced evenly around the outline, pointing along the outward normal.
 * `lengthAmount` is 0–1, and 1 reaches {@link maxCiliumLength}.
 */
export function ciliaPlacements(
  count: number,
  lengthAmount: number,
  bodyLength: number,
  bodyWidth: number,
  bend: number,
  crystal = false,
  taper: TaperInput = 0,
): CiliumPlacement[] {
  const previous = outlineTaper;
  outlineTaper = taper;
  try {
  const n = Math.floor(count);
  const amount = Math.min(1, Math.max(0, lengthAmount));
  const reach = maxCiliumLength(bodyLength, bodyWidth) * amount;
  if (n <= 0 || reach <= 1e-4 || bodyLength <= 1e-6 || bodyWidth <= 1e-6) return [];
  const loop = outlineLoop(bodyLength, bodyWidth, bend, crystal);
  if (loop.total <= 1e-6) return [];
  const placed: CiliumPlacement[] = [];
  for (let i = 0; i < n; i += 1) {
    const at = outlineAt(loop, (i + 0.5) / n, bodyLength, bodyWidth, bend, crystal);
    placed.push({ ...at, length: reach });
  }
  return placed;
  } finally {
    outlineTaper = previous;
  }
}

/**
 * Longest a pilus grows: a bit over half the long axis.
 * A full flagellum reaches twice that axis, so a pilus stays the shorter needle.
 */
const PILUS_MAX_FRACTION = 0.55;
/** |long-axis position| above this belongs to a pole. Each remaining flank is one side. */
const PILUS_POLE = 0.55;
/** Shaft radius. Matches the drawn filament, which is one pixel wide at 32 pixels per unit. */
export const PILUS_RADIUS = 1 / 64;

export type PilusSite = "polar" | "antipolar" | "lateral" | "antilateral" | "all";

export function maxPilusLength(length: number, width: number): number {
  return flagellarBodyLength(length, width) * PILUS_MAX_FRACTION;
}

/** The near coat is shorter than the far coat, so the two layers stay distinct. */
const PILUS_FRONT_SCALE = 0.62;
const PILUS_SIDES = ["polar", "antipolar", "lateral", "antilateral"] as const;

/**
 * How many pili may emerge for this site.
 * One side carries a quarter of the cell maximum. All four sides together carry the whole maximum.
 */
export function maxPiliOnSite(maxCount: number, site: PilusSite): number {
  const max = Math.max(0, Math.floor(maxCount));
  if (site === "all") return max;
  return Math.floor(max / PILUS_SIDES.length);
}

/**
 * `count` rigid needles on one emergence site. `all` splits them across every side.
 * A single site should stay within {@link maxPiliOnSite}.
 * The count is split into a longer layer behind the body and a shorter layer in front.
 * Roots are spaced unevenly along the membrane.
 * `average` and `variance` are 0–1. The average is a fraction of {@link maxPilusLength}.
 * Variance spreads lengths around that average and never past the cap.
 */
export function piliPlacements(
  count: number,
  average: number,
  variance: number,
  site: PilusSite,
  bodyLength: number,
  bodyWidth: number,
  bend: number,
  crystal = false,
  taper: TaperInput = 0,
): PilusSnapshot[] {
  const previous = outlineTaper;
  outlineTaper = taper;
  try {
  const n = Math.floor(count);
  const meanScale = Math.min(1, Math.max(0, average));
  const spread = Math.min(1, Math.max(0, variance));
  const cap = maxPilusLength(bodyLength, bodyWidth);
  if (n <= 0 || cap <= 1e-4 || meanScale <= 1e-4 || bodyLength <= 1e-6 || bodyWidth <= 1e-6) return [];
  const loop = outlineLoop(bodyLength, bodyWidth, bend, crystal);
  const mean = cap * meanScale;
  const placed: PilusSnapshot[] = [];
  let serial = 0;
  const put = (anchor: FlagellumAnchor, layer: number): void => {
    const wobble = (unitHash(serial + layer * 40) * 2 - 1) * spread;
    let length = Math.min(cap, Math.max(mean * 0.12, mean * (1 + wobble)));
    if (layer > 0) length *= PILUS_FRONT_SCALE;
    serial += 1;
    if (length <= 1e-3) return;
    placed.push({ x: anchor.x, y: anchor.y, dirX: anchor.dirX, dirY: anchor.dirY, length, layer });
  };
  const placeOnSite = (side: Exclude<PilusSite, "all">, countOnSite: number, layer: number, salt: number): void => {
    if (countOnSite <= 0) return;
    const arc = siteArc(loop, side, bodyLength, bodyWidth, bend);
    if (arc.length === 0) return;
    const marks = arcStations(loop, arc);
    const total = marks[marks.length - 1] ?? 0;
    for (const at of unevenStations(countOnSite, total, salt)) {
      put(arcAnchor(loop, arc, marks, at, bodyLength, bodyWidth, bend, crystal), layer);
    }
  };
  const placeLayer = (countOnLayer: number, layer: number): void => {
    if (countOnLayer <= 0) return;
    if (site === "all") {
      const shares = divideCount(countOnLayer, PILUS_SIDES.length);
      PILUS_SIDES.forEach((side, index) => placeOnSite(side, shares[index] ?? 0, layer, layer * 1000 + index * 17));
      return;
    }
    placeOnSite(site, countOnLayer, layer, layer * 1000);
  };
  placeLayer(Math.ceil(n / 2), 0);
  placeLayer(n - Math.ceil(n / 2), 1);
  return placed;
  } finally {
    outlineTaper = previous;
  }
}

/** Centerline and both flanks, so a thin needle still meets terrain. */
export function pilusVolumeSamples(pili: readonly PilusSnapshot[]): Array<[number, number]> {
  const samples: Array<[number, number]> = [];
  const step = 1 / 32;
  for (const pilus of pili) {
    if (pilus.length <= 1e-4) continue;
    const steps = Math.max(1, Math.ceil(pilus.length / step));
    const sideX = -pilus.dirY * PILUS_RADIUS;
    const sideY = pilus.dirX * PILUS_RADIUS;
    for (let i = 1; i <= steps; i += 1) {
      const t = (pilus.length * i) / steps;
      const x = pilus.x + pilus.dirX * t;
      const y = pilus.y + pilus.dirY * t;
      samples.push([x, y], [x + sideX, y + sideY], [x - sideX, y - sideY]);
    }
  }
  return samples;
}

/** Points along each shaft, used when testing whether two cells occupy the same space. */
export function pilusCenterSamples(pili: readonly PilusSnapshot[]): Array<[number, number]> {
  const samples: Array<[number, number]> = [];
  for (const pilus of pili) {
    if (pilus.length <= 1e-4) continue;
    const steps = Math.max(1, Math.ceil(pilus.length / PILUS_RADIUS));
    for (let i = 1; i <= steps; i += 1) {
      const t = (pilus.length * i) / steps;
      samples.push([pilus.x + pilus.dirX * t, pilus.y + pilus.dirY * t]);
    }
  }
  return samples;
}

function divideCount(count: number, parts: number): number[] {
  const base = Math.floor(count / parts);
  let extra = count % parts;
  return Array.from({ length: parts }, () => {
    const share = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    return share;
  });
}

/** Stations along an arc. Gaps vary, and a lone needle does not sit at the midpoint. */
function unevenStations(count: number, total: number, salt: number): number[] {
  if (count <= 0 || total <= 1e-6) return [];
  if (count === 1) return [total * (0.15 + unitHash(salt) * 0.7)];
  const weights: number[] = [];
  for (let i = 0; i < count; i += 1) weights.push(0.28 + unitHash(salt + i * 19) * 1.72);
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0);
  const stations: number[] = [];
  let walked = 0;
  for (let i = 0; i < count; i += 1) {
    const gap = ((weights[i] ?? 1) / sum) * total;
    const along = 0.22 + unitHash(salt + 80 + i * 3) * 0.56;
    stations.push(walked + gap * along);
    walked += gap;
  }
  return stations;
}

function pilusSiteOf(t: number, side: number): Exclude<PilusSite, "all"> {
  if (t >= PILUS_POLE) return "polar";
  if (t <= -PILUS_POLE) return "antipolar";
  return side >= 0 ? "lateral" : "antilateral";
}

function unitHash(index: number): number {
  const n = Math.sin((index + 1) * 127.1) * 43758.5453;
  return n - Math.floor(n);
}

function siteArc(loop: OutlineLoop, site: Exclude<PilusSite, "all">, length: number, width: number, bend: number): number[] {
  const flags = loop.points.map(
    (point) => pilusSiteOf(longAxisT(point.x, point.y, length, width, bend), longAxisSide(point.x, point.y, length, width, bend)) === site,
  );
  const count = flags.length;
  if (count === 0 || !flags.some(Boolean)) return [];
  let start = 0;
  for (let i = 0; i < count; i += 1) {
    if (flags[i] && !flags[(i - 1 + count) % count]) {
      start = i;
      break;
    }
  }
  const arc: number[] = [];
  for (let k = 0; k < count; k += 1) {
    const i = (start + k) % count;
    if (!flags[i]) break;
    arc.push(i);
  }
  return arc;
}

function arcStations(loop: OutlineLoop, arc: number[]): number[] {
  const marks = [0];
  for (let k = 1; k < arc.length; k += 1) {
    const a = loop.points[arc[k - 1] ?? 0];
    const b = loop.points[arc[k] ?? 0];
    if (!a || !b) {
      marks.push(marks[k - 1] ?? 0);
      continue;
    }
    marks.push((marks[k - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return marks;
}

function arcAnchor(
  loop: OutlineLoop,
  arc: number[],
  marks: number[],
  target: number,
  length: number,
  width: number,
  bend: number,
  crystal: boolean,
): FlagellumAnchor {
  const last = arc.length - 1;
  let k = 0;
  while (k < last && (marks[k + 1] ?? 0) < target) k += 1;
  const span = (marks[k + 1] ?? 0) - (marks[k] ?? 0);
  const f = span > 1e-8 ? (target - (marks[k] ?? 0)) / span : 0;
  const a = loop.points[arc[k] ?? 0];
  const b = loop.points[arc[Math.min(k + 1, last)] ?? 0];
  const x = (a?.x ?? 0) + ((b?.x ?? 0) - (a?.x ?? 0)) * f;
  const y = (a?.y ?? 0) + ((b?.y ?? 0) - (a?.y ?? 0)) * f;
  const mag = Math.hypot(x, y) || 1;
  const reach = surfaceReach(length, width, bend, x / mag, y / mag, crystal);
  const px = (x / mag) * reach;
  const py = (y / mag) * reach;
  const [dirX, dirY] = outlineNormal(px, py, length, width, bend, crystal);
  return { x: px, y: py, dirX, dirY };
}

interface OutlineLoop {
  points: FlagellumAnchor[];
  cum: number[];
  total: number;
}

function outlineLoop(length: number, width: number, bend: number, crystal = false): OutlineLoop {
  const points: FlagellumAnchor[] = [];
  for (let i = 0; i < OUTLINE_SAMPLES; i += 1) {
    const angle = (Math.PI * 2 * i) / OUTLINE_SAMPLES;
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const t = surfaceReach(length, width, bend, dirX, dirY, crystal);
    const x = dirX * t;
    const y = dirY * t;
    const [nx, ny] = outlineNormal(x, y, length, width, bend, crystal);
    points.push({ x, y, dirX: nx, dirY: ny });
  }
  const cum = [0];
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    cum.push(cum[i] + Math.hypot(next.x - points[i].x, next.y - points[i].y));
  }
  return { points, cum, total: cum[cum.length - 1] };
}

function outlineAt(
  loop: OutlineLoop,
  u: number,
  length: number,
  width: number,
  bend: number,
  crystal: boolean,
): FlagellumAnchor {
  const target = Math.min(Math.max(u, 0), 1) * loop.total;
  let i = 0;
  const last = loop.points.length - 1;
  while (i < last && loop.cum[i + 1] < target) i += 1;
  const span = loop.cum[i + 1] - loop.cum[i];
  const f = span > 1e-8 ? (target - loop.cum[i]) / span : 0;
  const a = loop.points[i];
  const b = loop.points[(i + 1) % loop.points.length];
  const x = a.x + (b.x - a.x) * f;
  const y = a.y + (b.y - a.y) * f;
  const mag = Math.hypot(x, y) || 1;
  const t = surfaceReach(length, width, bend, x / mag, y / mag, crystal);
  const px = (x / mag) * t;
  const py = (y / mag) * t;
  const [dirX, dirY] = outlineNormal(px, py, length, width, bend, crystal);
  return { x: px, y: py, dirX, dirY };
}

function outlineNormal(
  x: number,
  y: number,
  length: number,
  width: number,
  bend: number,
  crystal: boolean,
): [number, number] {
  const e = 1e-4;
  const dx =
    cellOutlineDistance(x + e, y, length, width, bend, crystal) -
    cellOutlineDistance(x - e, y, length, width, bend, crystal);
  const dy =
    cellOutlineDistance(x, y + e, length, width, bend, crystal) -
    cellOutlineDistance(x, y - e, length, width, bend, crystal);
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-8) {
    const fallback = Math.hypot(x, y) || 1;
    return [x / fallback, y / fallback];
  }
  return [dx / mag, dy / mag];
}

/** Midpoint of one flank, in the capsule's axis frame. `sign` is +1 lateral, −1 antilateral. */
function centerlineFlank(shape: CapsuleShape, sign: number): FlagellumAnchor {
  return {
    x: 0,
    y: sign * shape.radius,
    dirX: 0,
    dirY: sign,
  };
}

function centerlineCap(shape: CapsuleShape, bend: number, sign: number): FlagellumAnchor {
  if (bend < 1e-3 || shape.halfSegment < 1e-4) {
    return {
      x: sign * (shape.halfSegment + shape.radius),
      y: 0,
      dirX: sign,
      dirY: 0,
    };
  }
  const angle = sign * bend;
  const arcR = shape.halfSegment / bend;
  const [cx, cy] = arcPoint(arcR, angle);
  const dirX = sign * Math.cos(bend);
  const dirY = -Math.sin(bend);
  return {
    x: cx + dirX * shape.radius,
    y: cy + dirY * shape.radius,
    dirX,
    dirY,
  };
}

function surfaceReach(length: number, width: number, bend: number, dirX: number, dirY: number, crystal = false): number {
  let t = 0;
  for (let i = 0; i < 24; i += 1) {
    const d = cellOutlineDistance(dirX * t, dirY * t, length, width, bend, crystal);
    if (Math.abs(d) < 1e-4) break;
    const next = Math.max(0, t - d);
    if (Math.abs(next - t) < 1e-6) break;
    t = next;
  }
  return t;
}

function cellOutlineDistance(x: number, y: number, length: number, width: number, bend: number, crystal = false): number {
  return bodySignedDistance(x, y, {
    length,
    width,
    bend,
    furrow: 0,
    furrowAxis: 0,
    morph: 0,
    divisionShift: 0,
    divisionPlace: 0,
    capsule: 0,
    crystal,
    taper: outlineTaper,
  });
}

/** Outline samples for a thick arc. `bend` is the centerline half-angle in radians. */
export function curvedOutlineSamples(shape: CapsuleShape, bend: number, inset: number): Array<[number, number]> {
  const arcR = shape.halfSegment / bend;
  const samples: Array<[number, number]> = [];
  const steps = Math.max(1, Math.ceil((shape.halfSegment * 2) / 0.2));
  for (let i = 0; i <= steps; i += 1) {
    const angle = -bend + (2 * bend * i) / steps;
    const [cx, cy] = arcPoint(arcR, angle);
    const nx = Math.sin(angle);
    const ny = Math.cos(angle);
    samples.push([cx + nx * inset, cy + ny * inset], [cx - nx * inset, cy - ny * inset]);
  }
  const cap = (sign: number) => {
    const angle = sign * bend;
    const [cx, cy] = arcPoint(arcR, angle);
    const tx = sign * Math.cos(bend);
    const ty = -Math.sin(bend);
    const nx = Math.sin(angle);
    const ny = Math.cos(angle);
    const arcSteps = 4;
    for (let i = 0; i <= arcSteps; i += 1) {
      const a = -Math.PI / 2 + (Math.PI * i) / arcSteps;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      samples.push([cx + (ca * tx + sa * nx) * inset, cy + (ca * ty + sa * ny) * inset]);
    }
  };
  cap(1);
  cap(-1);
  return samples;
}

/**
 * Local cell body, in the same frame as the renderer.
 * `bodySignedDistance` matches the shader `bodyDistance`, including the furrow, daughter blend, and crystalline polygon.
 */
export interface BodyShape {
  length: number;
  width: number;
  bend: number;
  furrow: number;
  furrowAxis: number;
  morph: number;
  divisionShift: number;
  divisionPlace: number;
  capsule: number;
  /** Crystalline wall: flat faces and pointed tips, never a smooth outline. */
  crystal?: boolean;
  /** Rigid needles included in the collider. The membrane distance ignores them. */
  pili?: PilusSnapshot[];
  /** Which sides pinch, and how hard. A number is the mask at full degree. */
  taper?: TaperInput;
}

export function bodyFromSnapshot(cell: Pick<CellSnapshot, "length" | "width" | "bend" | "furrow" | "furrowAxis" | "morph" | "divisionShift" | "divisionPlace" | "capsule" | "pili" | "membraneStyle" | "taper">): BodyShape {
  return {
    length: cell.length,
    width: cell.width,
    bend: cell.bend ?? 0,
    furrow: cell.furrow ?? 0,
    furrowAxis: cell.furrowAxis ?? 0,
    morph: cell.morph ?? 0,
    divisionShift: cell.divisionShift ?? 0,
    divisionPlace: cell.divisionPlace ?? 0,
    capsule: cell.capsule,
    crystal: cell.membraneStyle === 3,
    pili: cell.pili,
    taper: cell.taper ?? 0,
  };
}

function clampUnit(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value));
}

function centerlineNearest(axisX: number, axisY: number, halfSegment: number, bend: number): [number, number] {
  if (bend < 1e-3 || halfSegment < 1e-4) {
    return [Math.min(Math.max(axisX, -halfSegment), halfSegment), 0];
  }
  const arcR = halfSegment / bend;
  const angle = clampUnit(Math.atan2(axisX, axisY + arcR), bend);
  return arcPoint(arcR, angle);
}

function divisionAxial(axisX: number, axisY: number, halfSegment: number, bend: number, furrowAxis: number): number {
  const along = Math.cos(furrowAxis);
  const across = Math.sin(furrowAxis);
  const spunX = along * axisX + across * axisY;
  const spunY = -across * axisX + along * axisY;
  if (bend < 1e-3 || halfSegment < 1e-4) return spunX;
  const arcR = halfSegment / bend;
  return arcR * Math.atan2(spunX, spunY + arcR);
}

function furrowWaist(shape: CapsuleShape): number {
  const axialReach = shape.halfSegment + shape.radius;
  return Math.max(Math.min(shape.radius * 0.62, axialReach * 0.22), 1 / 32);
}

function taperPinch(degree: number, coord: number): number {
  if (degree <= 1e-4) return 1;
  const t = Math.min(1, Math.max(0, coord));
  const s = t * t * (3 - 2 * t);
  return 1 - (1 - TAPER_PINCH) * degree * s;
}

/** Axial and flank scales at a straight-space station. 1 leaves that axis full. Matches the shader. */
function taperAxes(along: number, across: number, halfSegment: number, radius: number, taper: TaperInput): [number, number] {
  const [polar, antipolar, lateral, antilateral] = effectiveTaperDegrees(taper);
  if (polar + antipolar + lateral + antilateral <= 1e-4) return [1, 1];
  const reach = Math.max(halfSegment + radius, 1e-4);
  const axial = Math.min(1, Math.max(-1, along / reach));
  const side = Math.min(1, Math.max(-1, across / Math.max(radius, 1e-4)));
  const sx = taperPinch(polar, Math.max(axial, 0)) * taperPinch(antipolar, Math.max(-axial, 0));
  const sy = taperPinch(lateral, Math.max(side, 0)) * taperPinch(antilateral, Math.max(-side, 0));
  return [sx, sy];
}

/** Centerline station and signed flank offset, in the same frame as the capsule SDF. */
function taperFrame(axisX: number, axisY: number, halfSegment: number, bend: number): [number, number] {
  const [nearestX, nearestY] = centerlineNearest(axisX, axisY, halfSegment, bend);
  const dx = axisX - nearestX;
  const dy = axisY - nearestY;
  if (bend < 1e-3 || halfSegment < 1e-4) return [nearestX + dx, dy];
  const arcR = halfSegment / bend;
  const ang = clampUnit(Math.atan2(axisX, axisY + arcR), bend);
  const tangentX = Math.cos(ang);
  const tangentY = -Math.sin(ang);
  const outX = Math.sin(ang);
  const outY = Math.cos(ang);
  return [arcR * ang + dx * tangentX + dy * tangentY, dx * outX + dy * outY];
}

function taperRadiusScale(axisX: number, axisY: number, halfSegment: number, radius: number, bend: number, taper: TaperInput): number {
  const [along, across] = taperFrame(axisX, axisY, halfSegment, bend);
  const [sx, sy] = taperAxes(along, across, halfSegment, radius, taper);
  return Math.min(sx, sy);
}

/** Pull a crystal vertex in by up to half a radius on each tapered side. Matches the shader. */
function taperCrystalPoint(x: number, y: number, halfSegment: number, radius: number, taper: TaperInput): [number, number] {
  const [sx, sy] = taperAxes(x, y, halfSegment, radius, taper);
  return [x - Math.sign(x) * (1 - sx) * radius, y - Math.sign(y) * (1 - sy) * radius];
}

function plainCapsuleDistance(x: number, y: number, halfSegment: number, radius: number, bend: number, lateral: boolean, taper: TaperInput = 0): number {
  const [axisX, axisY] = toAxis(x, y, lateral);
  const [nearestX, nearestY] = centerlineNearest(axisX, axisY, halfSegment, bend);
  const scale = taperRadiusScale(axisX, axisY, halfSegment, radius, bend, taper);
  return Math.hypot(axisX - nearestX, axisY - nearestY) - radius * scale;
}

/**
 * Longest arc, in radians, left as one flat face.
 * Wider faces read as crystal; the next corner is inserted before a chord can pinch the cell.
 * Matches the shader.
 */
const CRYSTAL_FACET = 0.9;

function warpAxisPoint(x: number, y: number, halfSegment: number, bend: number): [number, number] {
  if (bend < 1e-3 || halfSegment < 1e-4) return [x, y];
  const arcR = halfSegment / bend;
  const along = Math.min(Math.max(x, -halfSegment), halfSegment);
  const overhang = x - along;
  const ang = along / arcR;
  const [cx, cy] = arcPoint(arcR, ang);
  return [cx + Math.cos(ang) * overhang + Math.sin(ang) * y, cy - Math.sin(ang) * overhang + Math.cos(ang) * y];
}

function pushCrystal(verts: Array<[number, number]>, x: number, y: number): void {
  const last = verts[verts.length - 1];
  if (last && (last[0] - x) * (last[0] - x) + (last[1] - y) * (last[1] - y) < 1e-10) return;
  if (verts.length >= 12) return;
  verts.push([x, y]);
}

/**
 * Pull a narrow angular waist into the flank the ray hits.
 * Knees stay on the edge; the middle vertex draws in. Kept in sync with the shader `insertNotch`.
 */
function insertCrystalNotch(
  verts: Array<[number, number]>,
  dirX: number,
  dirY: number,
  furrow: number,
  knee: number,
): Array<[number, number]> {
  const n = verts.length;
  if (n < 3 || n + 3 > 12) return verts;
  let bestT = Infinity;
  let bestU = 0;
  let bestI = -1;
  for (let i = 0; i < n; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % n];
    if (!a || !b) continue;
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const denom = dirX * ey - dirY * ex;
    if (Math.abs(denom) < 1e-8) continue;
    const t = (a[0] * ey - a[1] * ex) / denom;
    const u = (a[0] * dirY - a[1] * dirX) / denom;
    if (t > 1e-4 && u >= -1e-4 && u <= 1 + 1e-4 && t < bestT) {
      bestT = t;
      bestU = Math.min(1, Math.max(0, u));
      bestI = i;
    }
  }
  if (bestI < 0) return verts;
  // A furrow aimed at a corner bites the neighboring face instead of collapsing that corner into a spike.
  if (bestU < 0.12) bestU = 0.12;
  else if (bestU > 0.88) bestU = 0.88;
  const a = verts[bestI];
  const b = verts[(bestI + 1) % n];
  if (!a || !b) return verts;
  const ex = b[0] - a[0];
  const ey = b[1] - a[1];
  const edgeLen = Math.hypot(ex, ey);
  if (edgeLen < 1e-5) return verts;
  const kneeLen = Math.min(knee, edgeLen * 0.35);
  const uLeft = Math.max(0.02, bestU - kneeLen / edgeLen);
  const uRight = Math.min(0.98, bestU + kneeLen / edgeLen);
  if (uRight - uLeft < 0.04) return verts;
  const hitX = a[0] + ex * bestU;
  const hitY = a[1] + ey * bestU;
  const next: Array<[number, number]> = [];
  for (let i = 0; i < n; i += 1) {
    const vert = verts[i];
    if (vert) next.push(vert);
    if (i !== bestI) continue;
    next.push(
      [a[0] + ex * uLeft, a[1] + ey * uLeft],
      [hitX * (1 - furrow), hitY * (1 - furrow)],
      [a[0] + ex * uRight, a[1] + ey * uRight],
    );
  }
  return next;
}

/** Distance from the pole back to the shoulder. Long cells get a 60° tip; short ones stay a 120° hexagon. */
function crystalChamfer(halfSegment: number, radius: number): number {
  const blunt = radius / Math.sqrt(3);
  const sharp = radius * Math.sqrt(3);
  if (halfSegment + radius < sharp + radius * 0.2) return blunt;
  return sharp;
}

function pushWarpedCrystal(
  verts: Array<[number, number]>,
  x: number,
  y: number,
  halfSegment: number,
  radius: number,
  bend: number,
  taper: TaperInput,
): void {
  const [tx, ty] = taperCrystalPoint(x, y, halfSegment, radius, taper);
  const [wx, wy] = warpAxisPoint(tx, ty, halfSegment, bend);
  pushCrystal(verts, wx, wy);
}

/** Straight cuts along a bent flank, so the crescent stays faceted instead of turning into a curve. */
function addCrystalFlank(
  verts: Array<[number, number]>,
  x0: number,
  x1: number,
  y: number,
  halfSegment: number,
  radius: number,
  bend: number,
  taper: TaperInput,
): void {
  if (bend < 1e-3 || halfSegment < 1e-4) return;
  const arcR = halfSegment / bend;
  const angleOf = (x: number): number => Math.min(halfSegment, Math.max(-halfSegment, x)) / arcR;
  const a0 = angleOf(x0);
  const a1 = angleOf(x1);
  let segments = Math.ceil(Math.abs(a1 - a0) / CRYSTAL_FACET);
  if (segments > 3) segments = 3;
  if (segments <= 1) return;
  for (let i = 1; i < segments; i += 1) {
    const angle = a0 + (a1 - a0) * (i / segments);
    pushWarpedCrystal(verts, arcR * angle, y, halfSegment, radius, bend, taper);
  }
}

/**
 * Crystal polygon in axis space. Faces are straight, tips come to a point,
 * and a crescent is a run of flat faces along the arc.
 */
function crystalVertices(
  halfSegment: number,
  radius: number,
  bend: number,
  furrow: number,
  furrowAxis: number,
  taper: TaperInput = 0,
): Array<[number, number]> {
  const H = halfSegment;
  const R = Math.max(radius, 1e-6);
  const pole = H + R;
  const sx = pole - crystalChamfer(H, R);
  const verts: Array<[number, number]> = [];
  const add = (x: number, y: number): void => pushWarpedCrystal(verts, x, y, H, R, bend, taper);
  const facet = furrow <= 0.04;
  add(pole, 0);
  add(sx, R);
  if (facet) addCrystalFlank(verts, sx, -sx, R, H, R, bend, taper);
  add(-sx, R);
  add(-pole, 0);
  add(-sx, -R);
  if (facet) addCrystalFlank(verts, -sx, sx, -R, H, R, bend, taper);
  add(sx, -R);
  if (furrow <= 0.04) return verts;
  const knee = Math.max(Math.min(R * 0.62, (H + R) * 0.22), 1 / 32);
  const acrossX = -Math.sin(furrowAxis);
  const acrossY = Math.cos(furrowAxis);
  const outer = insertCrystalNotch(verts, acrossX, acrossY, furrow, knee);
  return insertCrystalNotch(outer, -acrossX, -acrossY, furrow, knee);
}

function polygonDistance(x: number, y: number, verts: ReadonlyArray<[number, number]>): number {
  const n = verts.length;
  if (n < 3) return 1e3;
  const first = verts[0];
  if (!first) return 1e3;
  let d = (x - first[0]) * (x - first[0]) + (y - first[1]) * (y - first[1]);
  let s = 1;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const vi = verts[i];
    const vj = verts[j];
    if (!vi || !vj) continue;
    const ex = vj[0] - vi[0];
    const ey = vj[1] - vi[1];
    const wx = x - vi[0];
    const wy = y - vi[1];
    const ee = ex * ex + ey * ey;
    const t = ee > 1e-12 ? Math.min(1, Math.max(0, (wx * ex + wy * ey) / ee)) : 0;
    const bx = wx - ex * t;
    const by = wy - ey * t;
    const dist2 = bx * bx + by * by;
    if (dist2 < d) d = dist2;
    const c0 = y >= vi[1];
    const c1 = y < vj[1];
    const c2 = ex * wy > ey * wx;
    if ((c0 && c1 && c2) || (!c0 && !c1 && !c2)) s = -s;
  }
  return s * Math.sqrt(Math.max(d, 0));
}

function crystalSignedDistance(
  x: number,
  y: number,
  halfSegment: number,
  radius: number,
  bend: number,
  lateral: boolean,
  furrow: number,
  furrowAxis: number,
  taper: TaperInput = 0,
): number {
  const [axisX, axisY] = toAxis(x, y, lateral);
  return polygonDistance(axisX, axisY, crystalVertices(halfSegment, radius, bend, furrow, furrowAxis, taper));
}

/** Signed distance to the cell membrane. Negative values are inside. */
export function bodySignedDistance(x: number, y: number, body: BodyShape): number {
  const shape = orientedCapsule(body.length, body.width);
  const bend = body.bend;
  const lateral = shape.lateral === true;
  const crystal = body.crystal === true;
  const taper = body.taper ?? 0;
  let parent: number;
  if (crystal) {
    parent = crystalSignedDistance(x, y, shape.halfSegment, shape.radius, bend, lateral, body.furrow, body.furrowAxis, taper);
  } else {
    const [axisX, axisY] = toAxis(x, y, lateral);
    const [nearestX, nearestY] = centerlineNearest(axisX, axisY, shape.halfSegment, bend);
    const axial = divisionAxial(axisX, axisY, shape.halfSegment, bend, body.furrowAxis);
    const waist = furrowWaist(shape);
    const notch = Math.exp(-(axial * axial) / (waist * waist));
    const scale = taperRadiusScale(axisX, axisY, shape.halfSegment, shape.radius, bend, taper);
    const radius = shape.radius * (1 - body.furrow * notch) * scale;
    parent = Math.hypot(axisX - nearestX, axisY - nearestY) - radius;
  }
  const morph = body.morph;
  let distance = parent;
  if (morph > 0) {
    const axisXWorld = Math.cos(body.divisionPlace);
    const axisYWorld = Math.sin(body.divisionPlace);
    const shift = body.divisionShift;
    const halfSegment = shape.halfSegment * 0.5;
    const radius = shape.radius * 0.5;
    const left = crystal
      ? crystalSignedDistance(x - axisXWorld * shift, y - axisYWorld * shift, halfSegment, radius, bend, lateral, 0, 0, taper)
      : plainCapsuleDistance(x - axisXWorld * shift, y - axisYWorld * shift, halfSegment, radius, bend, lateral, taper);
    const right = crystal
      ? crystalSignedDistance(x + axisXWorld * shift, y + axisYWorld * shift, halfSegment, radius, bend, lateral, 0, 0, taper)
      : plainCapsuleDistance(x + axisXWorld * shift, y + axisYWorld * shift, halfSegment, radius, bend, lateral, taper);
    const daughters = Math.min(left, right);
    distance = parent + (daughters - parent) * morph;
  }
  return distance - body.capsule;
}

/** Walk along the membrane normal until the point sits on the outline. */
export function projectToMembrane(x: number, y: number, body: BodyShape): [number, number] {
  let px = x;
  let py = y;
  for (let i = 0; i < 8; i += 1) {
    const distance = bodySignedDistance(px, py, body);
    if (Math.abs(distance) < 1e-4) break;
    const [nx, ny] = bodyNormal(px, py, body);
    px -= nx * distance;
    py -= ny * distance;
  }
  return [px, py];
}

/** Signed distance to the collider: the membrane, plus each pilus as a thin capsule. */
export function colliderSignedDistance(x: number, y: number, body: BodyShape): number {
  let distance = bodySignedDistance(x, y, body);
  const pili = body.pili;
  if (!pili) return distance;
  for (const pilus of pili) {
    const shaft = pilusShaftDistance(x, y, pilus);
    if (shaft < distance) distance = shaft;
  }
  return distance;
}

function pilusShaftDistance(x: number, y: number, pilus: PilusSnapshot): number {
  return segmentDistance(x, y, pilus.x, pilus.y, pilus.x + pilus.dirX * pilus.length, pilus.y + pilus.dirY * pilus.length) - PILUS_RADIUS;
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  const t = ab2 < 1e-12 ? 0 : Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / ab2));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

export function bodyNormal(x: number, y: number, body: BodyShape): [number, number] {
  const epsilon = 1e-3;
  const dx = bodySignedDistance(x + epsilon, y, body) - bodySignedDistance(x - epsilon, y, body);
  const dy = bodySignedDistance(x, y + epsilon, body) - bodySignedDistance(x, y - epsilon, body);
  const mag = Math.hypot(dx, dy);
  if (mag < 1e-8) {
    const fallback = Math.hypot(x, y) || 1;
    return [x / fallback, y / fallback];
  }
  return [dx / mag, dy / mag];
}

export function bodyHalfExtents(body: BodyShape): [number, number] {
  const shape = orientedCapsule(body.length, body.width);
  const base = curvedHalfExtents(shape, body.bend);
  const extra = Math.abs(body.divisionShift) + body.capsule + (body.crystal ? shape.radius * 0.15 : 0);
  let halfX = base[0] + extra;
  let halfY = base[1] + extra;
  for (const pilus of body.pili ?? []) {
    const tipX = Math.abs(pilus.x + pilus.dirX * pilus.length) + PILUS_RADIUS;
    const tipY = Math.abs(pilus.y + pilus.dirY * pilus.length) + PILUS_RADIUS;
    if (tipX > halfX) halfX = tipX;
    if (tipY > halfY) halfY = tipY;
  }
  return [halfX, halfY];
}

function straightOutlineSamples(halfSegment: number, radius: number): Array<[number, number]> {
  const samples: Array<[number, number]> = [];
  const steps = Math.max(1, Math.ceil((halfSegment * 2) / 0.2));
  for (let i = 0; i <= steps; i += 1) {
    const t = -halfSegment + (halfSegment * 2 * i) / steps;
    samples.push([t, radius], [t, -radius]);
  }
  const arc = 4;
  for (let i = 0; i <= arc; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / arc;
    const lx = Math.cos(a) * radius;
    const ly = Math.sin(a) * radius;
    samples.push([halfSegment + lx, ly], [-halfSegment - lx, ly]);
  }
  return samples;
}

function outlineOf(shape: CapsuleShape, bend: number, radius: number): Array<[number, number]> {
  const raw =
    bend >= 1e-3 && shape.halfSegment >= 1e-4
      ? curvedOutlineSamples(shape, bend, radius)
      : straightOutlineSamples(shape.halfSegment, radius);
  return shape.lateral ? raw.map(([x, y]) => toLocal(x, y, true)) : raw;
}

function crystalMembrane(halfSegment: number, radius: number, bend: number, lateral: boolean, furrow: number, furrowAxis: number): Array<[number, number]> {
  const verts = crystalVertices(halfSegment, radius, bend, furrow, furrowAxis);
  const samples: Array<[number, number]> = [];
  const count = verts.length;
  for (let i = 0; i < count; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % count];
    if (!a || !b) continue;
    samples.push(toLocal(a[0], a[1], lateral), toLocal((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, lateral));
  }
  return samples;
}

/** Points on the membrane, in the cell's local frame. A splitting cell samples both daughters. */
export function membraneSamples(body: BodyShape): Array<[number, number]> {
  const shape = orientedCapsule(body.length, body.width);
  const lateral = shape.lateral === true;
  const parent = body.crystal
    ? crystalMembrane(shape.halfSegment, shape.radius, body.bend, lateral, body.furrow, body.furrowAxis)
    : outlineOf(shape, body.bend, Math.max(shape.radius, 1 / 32));
  if (body.morph <= 0.05 || Math.abs(body.divisionShift) < 1e-4) return parent;
  const childRadius = Math.max(shape.radius * 0.5, 1 / 64);
  const child = body.crystal
    ? crystalMembrane(shape.halfSegment * 0.5, childRadius, body.bend, lateral, 0, 0)
    : outlineOf(
        { halfSegment: shape.halfSegment * 0.5, radius: childRadius, lateral: shape.lateral },
        body.bend,
        childRadius,
      );
  const axisX = Math.cos(body.divisionPlace);
  const axisY = Math.sin(body.divisionPlace);
  const shifted: Array<[number, number]> = [];
  for (const sign of [-1, 1]) {
    for (const [x, y] of child) shifted.push([x + axisX * body.divisionShift * sign, y + axisY * body.divisionShift * sign]);
  }
  if (body.morph < 0.35) return parent;
  if (body.morph > 0.7) return shifted;
  return parent.concat(shifted);
}

export type PosedBody = {
  x: number;
  y: number;
  angle: number;
  body: BodyShape;
};

/**
 * How far `a` and `b` occupy the same space.
 * `nx, ny` is the direction that moves `a` out of `b`. `depth` is the overlap.
 * The push is along the line of centers, extended until the membranes clear.
 */
export function cellSeparation(a: PosedBody, b: PosedBody): { depth: number; nx: number; ny: number; px: number; py: number } | null {
  const [ax, ay] = bodyHalfExtents(a.body);
  const [bx, by] = bodyHalfExtents(b.body);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const reach = Math.hypot(ax, ay) + Math.hypot(bx, by);
  if (dx * dx + dy * dy > reach * reach) return null;
  if (!bodiesOverlap(a, b)) return null;
  let nx = dx;
  let ny = dy;
  const span = Math.hypot(nx, ny);
  if (span < 1e-5) {
    nx = 1;
    ny = 0;
  } else {
    nx /= span;
    ny /= span;
  }
  let lo = 0;
  let hi = reach;
  for (let step = 0; step < 10; step += 1) {
    const mid = (lo + hi) * 0.5;
    const moved = { ...a, x: a.x + nx * mid, y: a.y + ny * mid };
    if (bodiesOverlap(moved, b)) lo = mid;
    else hi = mid;
  }
  return { depth: hi, nx, ny, px: (a.x + b.x) * 0.5, py: (a.y + b.y) * 0.5 };
}

function bodiesOverlap(a: PosedBody, b: PosedBody): boolean {
  return pointInside(a.x, a.y, b) || pointInside(b.x, b.y, a) || membraneInside(a, b) || membraneInside(b, a);
}

function pointInside(x: number, y: number, fieldBody: PosedBody): boolean {
  const fc = Math.cos(fieldBody.angle);
  const fs = Math.sin(fieldBody.angle);
  const dx = x - fieldBody.x;
  const dy = y - fieldBody.y;
  return colliderSignedDistance(fc * dx + fs * dy, -fs * dx + fc * dy, fieldBody.body) < -1e-3;
}

function membraneInside(sampleBody: PosedBody, fieldBody: PosedBody): boolean {
  const c = Math.cos(sampleBody.angle);
  const s = Math.sin(sampleBody.angle);
  const fc = Math.cos(fieldBody.angle);
  const fs = Math.sin(fieldBody.angle);
  const inside = (lx: number, ly: number, slack: number): boolean => {
    const wx = sampleBody.x + c * lx - s * ly;
    const wy = sampleBody.y + s * lx + c * ly;
    const dx = wx - fieldBody.x;
    const dy = wy - fieldBody.y;
    return colliderSignedDistance(fc * dx + fs * dy, -fs * dx + fc * dy, fieldBody.body) < slack;
  };
  for (const [lx, ly] of membraneSamples(sampleBody.body)) {
    if (inside(lx, ly, -1e-3)) return true;
  }
  const pili = sampleBody.body.pili;
  if (!pili) return false;
  for (const [lx, ly] of pilusCenterSamples(pili)) {
    if (inside(lx, ly, PILUS_RADIUS - 1e-3)) return true;
  }
  return false;
}

export interface ContourPoint {
  x: number;
  y: number;
  nx: number;
  ny: number;
}

type ContourEdge = "S" | "E" | "N" | "W";

/**
 * Closed membrane loops for the current body. Supports every shape the SDF can express,
 * including a pinched or splitting cell, without assuming a capsule polygon.
 */
export function traceBodyContours(body: BodyShape, divisions = 88): ContourPoint[][] {
  const [halfX, halfY] = bodyHalfExtents(body);
  const margin = Math.max(halfX, halfY, 0.05) * 0.12 + 0.04;
  const minX = -halfX - margin;
  const maxX = halfX + margin;
  const minY = -halfY - margin;
  const maxY = halfY + margin;
  const spanX = Math.max(maxX - minX, 1e-4);
  const spanY = Math.max(maxY - minY, 1e-4);
  const nx = divisions;
  const ny = Math.max(28, Math.round(divisions * (spanY / spanX)));
  const dx = spanX / nx;
  const dy = spanY / ny;
  const field = new Float64Array((nx + 1) * (ny + 1));
  const at = (i: number, j: number): number => field[j * (nx + 1) + i] ?? 0;
  for (let j = 0; j <= ny; j += 1) {
    for (let i = 0; i <= nx; i += 1) {
      field[j * (nx + 1) + i] = bodySignedDistance(minX + i * dx, minY + j * dy, body);
    }
  }

  type Seg = { ax: number; ay: number; bx: number; by: number };
  const segs: Seg[] = [];
  const pairs = (code: number, centerInside: boolean): Array<[ContourEdge, ContourEdge]> => {
    switch (code) {
      case 1: return [["W", "S"]];
      case 2: return [["S", "E"]];
      case 3: return [["W", "E"]];
      case 4: return [["E", "N"]];
      case 5: return centerInside ? [["S", "E"], ["N", "W"]] : [["W", "S"], ["E", "N"]];
      case 6: return [["S", "N"]];
      case 7: return [["W", "N"]];
      case 8: return [["N", "W"]];
      case 9: return [["N", "S"]];
      case 10: return centerInside ? [["W", "S"], ["E", "N"]] : [["S", "E"], ["N", "W"]];
      case 11: return [["N", "E"]];
      case 12: return [["E", "W"]];
      case 13: return [["E", "S"]];
      case 14: return [["S", "W"]];
      default: return [];
    }
  };

  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const v00 = at(i, j);
      const v10 = at(i + 1, j);
      const v11 = at(i + 1, j + 1);
      const v01 = at(i, j + 1);
      const c0 = v00 <= 0 ? 1 : 0;
      const c1 = v10 <= 0 ? 1 : 0;
      const c2 = v11 <= 0 ? 1 : 0;
      const c3 = v01 <= 0 ? 1 : 0;
      const code = c0 | (c1 << 1) | (c2 << 2) | (c3 << 3);
      if (code === 0 || code === 15) continue;
      const center = (v00 + v10 + v11 + v01) * 0.25;
      const x0 = minX + i * dx;
      const y0 = minY + j * dy;
      const cross = (a: number, b: number): number => {
        const delta = a - b;
        return Math.abs(delta) < 1e-8 ? 0.5 : a / delta;
      };
      const point = (edge: ContourEdge): [number, number] => {
        if (edge === "S") return [x0 + cross(v00, v10) * dx, y0];
        if (edge === "E") return [x0 + dx, y0 + cross(v10, v11) * dy];
        if (edge === "N") return [x0 + cross(v01, v11) * dx, y0 + dy];
        return [x0, y0 + cross(v00, v01) * dy];
      };
      for (const [from, to] of pairs(code, center <= 0)) {
        const [ax, ay] = point(from);
        const [bx, by] = point(to);
        segs.push({ ax, ay, bx, by });
      }
    }
  }

  const scale = 1e4;
  const keyOf = (x: number, y: number): string => `${Math.round(x * scale)}:${Math.round(y * scale)}`;
  const buckets = new Map<string, Seg[]>();
  for (const seg of segs) {
    const key = keyOf(seg.ax, seg.ay);
    const list = buckets.get(key);
    if (list) list.push(seg);
    else buckets.set(key, [seg]);
  }
  const used = new Set<Seg>();
  const raw: Array<Array<[number, number]>> = [];
  for (const seg of segs) {
    if (used.has(seg)) continue;
    used.add(seg);
    const loop: Array<[number, number]> = [[seg.ax, seg.ay]];
    let current = seg;
    for (let guard = 0; guard < segs.length + 2; guard += 1) {
      if (keyOf(current.bx, current.by) === keyOf(seg.ax, seg.ay)) break;
      const options = buckets.get(keyOf(current.bx, current.by));
      let found: Seg | undefined;
      if (options) {
        for (let index = options.length - 1; index >= 0; index -= 1) {
          const candidate = options[index];
          if (!candidate || used.has(candidate)) continue;
          found = candidate;
          options.splice(index, 1);
          break;
        }
      }
      if (!found) break;
      used.add(found);
      loop.push([found.ax, found.ay]);
      current = found;
    }
    if (loop.length >= 8) raw.push(loop);
  }

  const shape = orientedCapsule(body.length, body.width);
  const spacing = Math.max(shape.radius / 18, (halfX + halfY) / 80);
  const contours: ContourPoint[][] = [];
  for (const loop of raw) {
    let length = 0;
    for (let index = 0; index < loop.length; index += 1) {
      const a = loop[index];
      const b = loop[(index + 1) % loop.length];
      if (!a || !b) continue;
      length += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    if (length < shape.radius * 0.35) continue;
    const count = Math.max(24, Math.round(length / spacing));
    const points: ContourPoint[] = [];
    for (let step = 0; step < count; step += 1) {
      const target = (length * step) / count;
      let walked = 0;
      let px = loop[0]?.[0] ?? 0;
      let py = loop[0]?.[1] ?? 0;
      for (let index = 0; index < loop.length; index += 1) {
        const a = loop[index];
        const b = loop[(index + 1) % loop.length];
        if (!a || !b) continue;
        const span = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (walked + span >= target) {
          const t = span > 1e-8 ? (target - walked) / span : 0;
          px = a[0] + (b[0] - a[0]) * t;
          py = a[1] + (b[1] - a[1]) * t;
          break;
        }
        walked += span;
      }
      for (let pass = 0; pass < 6; pass += 1) {
        const distance = bodySignedDistance(px, py, body);
        if (Math.abs(distance) < 1e-4) break;
        const [nx, ny] = bodyNormal(px, py, body);
        px -= nx * distance;
        py -= ny * distance;
      }
      const [nx, ny] = bodyNormal(px, py, body);
      points.push({ x: px, y: py, nx, ny });
    }
    if (points.length >= 12) contours.push(points);
  }
  return contours;
}
