/**
 * Cell-versus-cell collision on capsule hulls. Each body is approximated as a
 * swept capsule — a spine segment down the long axis plus the body width as
 * radius — ignoring crescent bend, which keeps the pairwise test cheap enough
 * to run across a whole menu crowd every frame.
 */

export type Capsule = {
  x: number;
  y: number;
  angle: number;
  length: number;
  width: number;
};

export type CapsuleContact = {
  /** Negative when the hulls overlap; the magnitude is the penetration depth. */
  gap: number;
  /** Unit vector from the closest point on the first capsule toward the second. */
  nx: number;
  ny: number;
};

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

type Vec2 = { x: number; y: number };

/** Clamped closest-point parameters between two segments. */
function closestSegmentParams(p1: Vec2, q1: Vec2, p2: Vec2, q2: Vec2): { s: number; t: number } {
  const d1x = q1.x - p1.x;
  const d1y = q1.y - p1.y;
  const d2x = q2.x - p2.x;
  const d2y = q2.y - p2.y;
  const rx = p1.x - p2.x;
  const ry = p1.y - p2.y;
  const a = d1x * d1x + d1y * d1y;
  const e = d2x * d2x + d2y * d2y;
  if (a <= 1e-12 && e <= 1e-12) return { s: 0, t: 0 };
  const f = d2x * rx + d2y * ry;
  if (a <= 1e-12) return { s: 0, t: clamp01(f / e) };
  const c = d1x * rx + d1y * ry;
  if (e <= 1e-12) return { s: clamp01(-c / a), t: 0 };
  const b = d1x * d2x + d1y * d2y;
  const denom = a * e - b * b;
  const s = denom > 1e-12 ? clamp01((b * f - c * e) / denom) : 0;
  const t = (b * s + f) / e;
  if (t < 0) return { s: clamp01(-c / a), t: 0 };
  if (t > 1) return { s: clamp01((b - c) / a), t: 1 };
  return { s, t };
}

/**
 * Signed gap between two capsule hulls. Positive is clear space, zero is
 * touching, negative is overlap depth. When the spines cross exactly the push
 * direction falls back to a perpendicular of the first capsule so coincident
 * cells still separate a deterministic way.
 */
export function capsuleGap(a: Capsule, b: Capsule): CapsuleContact {
  const halfA = Math.max(0, (a.length - a.width) / 2);
  const halfB = Math.max(0, (b.length - b.width) / 2);
  const cosA = Math.cos(a.angle);
  const sinA = Math.sin(a.angle);
  const cosB = Math.cos(b.angle);
  const sinB = Math.sin(b.angle);
  const p1 = { x: a.x - cosA * halfA, y: a.y - sinA * halfA };
  const q1 = { x: a.x + cosA * halfA, y: a.y + sinA * halfA };
  const p2 = { x: b.x - cosB * halfB, y: b.y - sinB * halfB };
  const q2 = { x: b.x + cosB * halfB, y: b.y + sinB * halfB };
  const { s, t } = closestSegmentParams(p1, q1, p2, q2);
  const cx = p2.x + (q2.x - p2.x) * t - (p1.x + (q1.x - p1.x) * s);
  const cy = p2.y + (q2.y - p2.y) * t - (p1.y + (q1.y - p1.y) * s);
  const dist = Math.hypot(cx, cy);
  const radii = a.width / 2 + b.width / 2;
  if (dist <= 1e-9) return { gap: -radii, nx: -sinA, ny: cosA };
  return { gap: dist - radii, nx: cx / dist, ny: cy / dist };
}

/** Whether two capsule hulls overlap. */
export function capsulesOverlap(a: Capsule, b: Capsule): boolean {
  return capsuleGap(a, b).gap < 0;
}