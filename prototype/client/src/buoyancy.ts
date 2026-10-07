import { pressureAt } from "./pressure";
import { EXPRESSED_PROMOTERS, geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/** Fastest rise from buoyin, in world units per second. */
export const MAX_RISE_SPEED = 6;
/** Fastest sink from ballastin. Sinking outruns rising. */
export const MAX_SINK_SPEED = 12;
/** Pressure band over which a rate eases to zero at its line. */
const EASE = 0.008;

/**
 * Hydrodynamic drag on the drift, in world units per second squared. The
 * cell is a small body in water, so its actual vertical velocity accelerates
 * toward the buoyancy target instead of snapping to it: oscillating vesicle
 * or granule levels swing the drift smoothly, and a rapid flip in the net
 * force only ramps the velocity at this rate.
 */
export const BUOYANCY_DRIFT_ACCELERATION = 10;

/** The drifting velocity is clamped to this magnitude whatever the target does. */
export const BUOYANCY_DRIFT_MAX_SPEED = MAX_SINK_SPEED;

/**
 * Advances the drift's vertical velocity toward the buoyancy target over one
 * step. The velocity change is capped by the drag acceleration over dt, and
 * the result by the maximum drift speed. dt <= 0 keeps the current velocity.
 */
export function stepBuoyancyVelocity(current: number, target: number, dtSeconds: number): number {
  if (dtSeconds <= 0) return current;
  const desired = target - current;
  const maxDelta = BUOYANCY_DRIFT_ACCELERATION * dtSeconds;
  const delta = Math.abs(desired) <= maxDelta ? desired : Math.sign(desired) * maxDelta;
  const next = current + delta;
  return Math.min(BUOYANCY_DRIFT_MAX_SPEED, Math.max(-BUOYANCY_DRIFT_MAX_SPEED, next));
}

/**
 * Vertical drift from the buoyin and ballastin sliders. Positive rises.
 * Each slider is a rate, and it only acts on one side of its pressure line.
 * Ballastin sinks while pressure is below the slider, which is above that
 * depth. Buoyin rises while pressure is above `1 - buoyin`, which is below
 * that depth. Zero on both holds still. Full ballastin and no buoyin sinks
 * anywhere above the bottom. The opposite rises anywhere below the surface.
 * The result is the drift's target velocity: it adds to the cilia and
 * flagella velocity for that move, and the actual drift eases toward it under
 * hydrodynamic drag (stepBuoyancyVelocity) rather than acting instantly.
 */
export function buoyancyVelocity(y: number, buoyin: number, ballastin: number): number {
  const up = clamp01(buoyin);
  const down = clamp01(ballastin);
  const pressure = pressureAt(y);
  const sink = gatedRate(down - pressure, down * MAX_SINK_SPEED);
  const rise = gatedRate(pressure - (1 - up), up * MAX_RISE_SPEED);
  return rise - sink;
}

function gatedRate(past: number, rate: number): number {
  if (past <= 0 || rate <= 0) return 0;
  if (past >= EASE) return rate;
  return rate * (past / EASE);
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Buoyin (BUOY) and Ballastin (BALA) are soluble cytosolic modules, like the
 * reductases: they work with no destination tag at all, and an explicit
 * Cytosol tag changes nothing. Copies routed out of the cell or into the
 * membrane never fold into the working module.
 */
const CYTOSOLIC_ROUTES = new Set(["CYTO"]);

function cytosolicCopies(constructs: readonly FlagellinConstruct[]): FlagellinConstruct[] {
  // An untagged construct is also cytosolic — no signal peptide means the
  // protein stays in the cytosol — so it counts for a soluble module.
  return constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
}

/** Total copies of one buoyancy gene expressed right now, cytosolic copies only. */
export function buoyancyExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  return geneExpressionLevel(cytosolicCopies(constructs), geneId, CYTOSOLIC_ROUTES, timeSeconds);
}

/**
 * Whether any construct could ever put buoyancy protein in the cytosol,
 * regardless of the current oscillation phase. The slider takeover uses this
 * so a troughing oscillatory promoter never hands buoyancy back to the
 * sandbox sliders for a moment.
 */
export function genomeCanDriveBuoyancy(constructs: readonly FlagellinConstruct[]): boolean {
  return cytosolicCopies(constructs).some(
    (construct) =>
      (construct.geneId === "BUOY" || construct.geneId === "BALA") &&
      EXPRESSED_PROMOTERS.has(construct.promoterId) &&
      construct.routeId !== null &&
      CYTOSOLIC_ROUTES.has(construct.routeId),
  );
}
