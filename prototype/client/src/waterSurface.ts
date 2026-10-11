import { COLUMN_TOP } from "./light";
import { curvedHalfExtents, orientedCapsule } from "./shape";

/** Waves that draw the waterline. The shader uses the same terms. */
const RIPPLE = [
  { freq: 0.22, speed: 0.9, amp: 0.85 },
  { freq: 0.57, speed: -1.35, amp: 0.38 },
  { freq: 1.15, speed: 1.8, amp: 0.14 },
] as const;

/** World y of the ripple line at this x. Matches the surface drawn in the water shader. */
export function waterSurfaceY(x: number, time: number): number {
  let ripple = 0;
  for (const wave of RIPPLE) ripple += Math.sin(x * wave.freq + time * wave.speed) * wave.amp;
  return COLUMN_TOP + ripple;
}

/** GLSL `surfaceY`, kept identical to {@link waterSurfaceY}. */
export function waterSurfaceGlsl(): string {
  const terms = RIPPLE.map((wave) => `sin(x * ${wave.freq} + uTime * ${wave.speed}) * ${wave.amp}`).join(" + ");
  return `float surfaceY(float x) { return ${COLUMN_TOP}.0 + ${terms}; }`;
}

/**
 * Highest world y the cell center may occupy without the body crossing the
 * ripple line. Samples the line across the body's width, and uses the lowest.
 */
export function surfaceLimit(
  x: number,
  angle: number,
  length: number,
  width: number,
  bend: number,
  time: number,
): number {
  const shape = orientedCapsule(length, width);
  const [halfX, halfY] = curvedHalfExtents(shape, Math.abs(bend));
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const reachY = Math.abs(s) * halfX + Math.abs(c) * halfY;
  const spanX = Math.abs(c) * halfX + Math.abs(s) * halfY;
  const crownX = x + c * Math.sign(s) * halfX - s * Math.sign(c) * halfY;
  const ceiling = Math.min(
    waterSurfaceY(x, time),
    waterSurfaceY(crownX, time),
    waterSurfaceY(x - spanX, time),
    waterSurfaceY(x + spanX, time),
  );
  return ceiling - reachY;
}

/** Pulls a pose down to the ripple line. Returns whether the body was crossing it. */
export function holdBelowSurface(
  pose: { x: number; y: number; angle: number; length: number },
  width: number,
  bend: number,
  time: number,
): boolean {
  const limit = surfaceLimit(pose.x, pose.angle, pose.length, width, bend, time);
  if (pose.y <= limit) return false;
  pose.y = limit;
  return true;
}
