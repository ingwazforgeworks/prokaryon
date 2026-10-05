import type { Compartment } from "./expressionData";
import {
  bodyHalfExtents,
  bodyNormal,
  bodySignedDistance,
  orientedCapsule,
  traceBodyContours,
  type BodyShape,
  type ContourPoint,
} from "./shape";

export interface PlacementEntry {
  entryId: string;
  geneId: string;
  compartment: Compartment;
}

export interface PlacementSlot {
  entryId: string;
  geneId: string;
  compartment: Compartment;
  kind: "primary" | "cluster";
  x: number;
  y: number;
  nx: number;
  ny: number;
}

export interface OutlineLoop {
  points: ContourPoint[];
  cum: number[];
  total: number;
}

export interface SchematicLayout {
  loops: OutlineLoop[];
  slots: PlacementSlot[];
}

const MAX_PLACED = 96;
const CLUSTER = 5;
const GOLDEN = 0.6180339887;

/**
 * Deterministic schematic positions. Parameters come from the entry id, then sit on the
 * current outline, so a selection change does not move them and a shape change does not reshuffle them.
 */
export function schematicLayout(body: BodyShape, entries: readonly PlacementEntry[]): SchematicLayout {
  const contours = traceBodyContours(body);
  const loops = contours.map(toLoop).filter((loop) => loop.total > 1e-4);
  const total = loops.reduce((sum, loop) => sum + loop.total, 0);
  const slots: PlacementSlot[] = [];
  if (total <= 1e-4) return { loops, slots };
  const placed = entries.length > MAX_PLACED ? entries.slice(0, MAX_PLACED) : entries;
  for (const entry of placed) {
    const primary = placeSlot(body, loops, total, entry, entry.compartment, `${entry.entryId}:primary`, "primary");
    if (primary) slots.push(primary);
    for (let index = 0; index < CLUSTER; index += 1) {
      const slot = placeSlot(body, loops, total, entry, entry.compartment, `${entry.entryId}:cluster:${index}`, "cluster");
      if (slot) slots.push(slot);
    }
  }
  return { loops, slots };
}

function placeSlot(
  body: BodyShape,
  loops: OutlineLoop[],
  total: number,
  entry: PlacementEntry,
  compartment: Compartment,
  salt: string,
  kind: PlacementSlot["kind"],
): PlacementSlot | null {
  if (compartment === "membrane") {
    const at = pointAlong(loops, total, unit(hash(`${salt}:u`)));
    if (!at) return null;
    return { ...entry, compartment, kind, x: at.x, y: at.y, nx: at.nx, ny: at.ny };
  }
  if (compartment === "cytosol") {
    const inside = cytosolPoint(body, salt);
    if (!inside) return null;
    return { ...entry, compartment, kind, ...inside };
  }
  const outside = secretedPoint(body, loops, total, salt);
  if (!outside) return null;
  return { ...entry, compartment, kind, ...outside };
}

function secretedPoint(body: BodyShape, loops: OutlineLoop[], total: number, salt: string): { x: number; y: number; nx: number; ny: number } | null {
  const shape = orientedCapsule(body.length, body.width);
  const gap = Math.max(0.08, shape.radius * 0.34);
  const at = pointAlong(loops, total, unit(hash(`${salt}:sec`)));
  if (!at) return null;
  let x = at.x + at.nx * gap;
  let y = at.y + at.ny * gap;
  for (let step = 0; step < 10; step += 1) {
    const distance = bodySignedDistance(x, y, body);
    if (distance > gap * 0.45) break;
    const push = Math.max(gap * 0.12, gap * 0.5 - distance);
    x += at.nx * push;
    y += at.ny * push;
  }
  if (bodySignedDistance(x, y, body) <= gap * 0.2) return null;
  const [nx, ny] = bodyNormal(x, y, body);
  return { x, y, nx, ny };
}

function cytosolPoint(body: BodyShape, salt: string): { x: number; y: number; nx: number; ny: number } | null {
  const seeds = interiorSeeds(body);
  if (seeds.length === 0) return null;
  const shape = orientedCapsule(body.length, body.width);
  const inset = Math.max(0.04, shape.radius * 0.2);
  const seed = seeds[hash(`${salt}:seed`) % seeds.length];
  if (!seed) return null;
  const base = unit(hash(`${salt}:ang`)) * Math.PI * 2;
  const fraction = 0.22 + unit(hash(`${salt}:rad`)) * 0.56;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const angle = base + attempt * GOLDEN * Math.PI * 2;
    const reach = rayToBoundary(seed[0], seed[1], angle, body);
    if (reach === null || reach < inset) continue;
    let x = seed[0] + Math.cos(angle) * reach * fraction;
    let y = seed[1] + Math.sin(angle) * reach * fraction;
    for (let step = 0; step < 6 && bodySignedDistance(x, y, body) > -inset; step += 1) {
      x += (seed[0] - x) * 0.35;
      y += (seed[1] - y) * 0.35;
    }
    if (bodySignedDistance(x, y, body) > -inset * 0.5) continue;
    const [nx, ny] = bodyNormal(x, y, body);
    return { x, y, nx, ny };
  }
  return null;
}

function rayToBoundary(seedX: number, seedY: number, angle: number, body: BodyShape): number | null {
  if (bodySignedDistance(seedX, seedY, body) > 0) return null;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const [halfX, halfY] = bodyHalfExtents(body);
  const maxR = Math.hypot(halfX, halfY) * 2 + 0.2;
  let radius = 0;
  for (let step = 0; step < 28; step += 1) {
    const distance = bodySignedDistance(seedX + dx * radius, seedY + dy * radius, body);
    if (distance >= -1e-3) return Math.max(0, radius);
    radius += Math.max(0.008, -distance * 0.85);
    if (radius > maxR) return null;
  }
  return null;
}

function interiorSeeds(body: BodyShape): Array<[number, number]> {
  const seeds: Array<[number, number]> = [];
  const consider = (x: number, y: number): void => {
    if (bodySignedDistance(x, y, body) < -1e-3) seeds.push([x, y]);
  };
  consider(0, 0);
  if (body.morph > 0.02) {
    const axisX = Math.cos(body.divisionPlace);
    const axisY = Math.sin(body.divisionPlace);
    consider(-axisX * body.divisionShift, -axisY * body.divisionShift);
    consider(axisX * body.divisionShift, axisY * body.divisionShift);
  }
  if (seeds.length > 0) return seeds;
  const [halfX, halfY] = bodyHalfExtents(body);
  consider(halfX * 0.15, 0);
  consider(-halfX * 0.15, 0);
  consider(0, halfY * 0.15);
  consider(0, -halfY * 0.15);
  return seeds;
}

function pointAlong(loops: OutlineLoop[], total: number, u: number): ContourPoint | null {
  if (loops.length === 0 || total <= 1e-6) return null;
  let target = ((u % 1) + 1) % 1 * total;
  for (const loop of loops) {
    if (target > loop.total && loop !== loops[loops.length - 1]) {
      target -= loop.total;
      continue;
    }
    const capped = Math.min(target, loop.total);
    let index = 0;
    const last = loop.points.length - 1;
    while (index < last && (loop.cum[index + 1] ?? 0) < capped) index += 1;
    const start = loop.cum[index] ?? 0;
    const end = loop.cum[index + 1] ?? start;
    const span = end - start;
    const t = span > 1e-8 ? (capped - start) / span : 0;
    const a = loop.points[index];
    const b = loop.points[(index + 1) % loop.points.length];
    if (!a || !b) return a ?? null;
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      nx: a.nx + (b.nx - a.nx) * t,
      ny: a.ny + (b.ny - a.ny) * t,
    };
  }
  return loops[0]?.points[0] ?? null;
}

function toLoop(points: ContourPoint[]): OutlineLoop {
  const cum = [0];
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    if (!a || !b) {
      cum.push(cum[cum.length - 1] ?? 0);
      continue;
    }
    cum.push((cum[cum.length - 1] ?? 0) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return { points, cum, total: cum[cum.length - 1] ?? 0 };
}

function unit(value: number): number {
  return (value % 100000) / 100000;
}

function hash(value: string): number {
  let mixed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    mixed ^= value.charCodeAt(index);
    mixed = Math.imul(mixed, 16777619);
  }
  return mixed >>> 0;
}
