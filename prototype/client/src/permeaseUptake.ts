import { geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Permease uptake — Ferron Permease (FERP) importing dissolved Ferron and
 * Sulfex Permease (SLFP) importing dissolved Sulfex — derived from genome
 * constructs. Pure data logic with no imports on the renderer, resources, or
 * DOM so the uptake rules stay testable alone. Both transporters share one
 * rule: the import rate tracks the permease expression level, the local
 * concentration of that nutrient, and the room left in the pool.
 */

/** Field fraction 1 is 600,000 µM. */
export const MICROMOLAR_PER_FIELD = 600000;

/** Uptake only runs in water holding more dissolved nutrient than this. */
export const PERMEASE_THRESHOLD_MICROMOLAR = 100;

/** The permeases only import while embedded in the membrane. */
const PERMEASE_ROUTES = new Set(["TransmembraneSignal"]);

/**
 * Pool units imported per second at full expression in water saturated with
 * the nutrient. The real rate scales with expression, concentration, and how
 * much room the pool has left, so a filling cell tapers toward its capacity.
 */
const UPTAKE_PER_SECOND = 25;

/**
 * Field fraction removed from the water for every pool unit imported, so the
 * stain visibly thins around a cell that is feeding. The drawdown lands mostly
 * on the texel the cell occupies, with a thin fringe to its neighbors, and the
 * water keeps a short memory of it: the deposit, diffusion, and the swirl all
 * refill a drained texel slowly, so a feeding cell pins its own texel near
 * black and leaves a fading trail behind it instead of a dimple that snaps
 * shut.
 */
export const FIELD_FRACTION_PER_UNIT = 0.2;

/** Total copies of one permease gene expressed right now, transmembrane copies only. */
export function permeaseExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, geneId, PERMEASE_ROUTES, timeSeconds);
}

/** Whether the water carries more dissolved nutrient than a permease needs to work. */
export function permeaseAboveThreshold(concentrationFraction: number): boolean {
  return concentrationFraction * MICROMOLAR_PER_FIELD > PERMEASE_THRESHOLD_MICROMOLAR;
}

/**
 * Step the cell's nutrient pool forward by dt. The import rate is proportional
 * to the permease expression level, the nutrient concentration in the water,
 * and the share of the pool that is still empty, so accumulation is fastest in
 * rich water at full expression and slows as the pool fills. Below the 100 µM
 * gate, or with no working permease, nothing moves. The returned rate is the
 * realized change per second, for the resource bar readout, and depletion is
 * the field fraction to draw down from the water the cell is sitting in — the
 * imported units made visible in the stain.
 */
export function stepPermeaseUptake(
  amount: number,
  capacity: number,
  expression: number,
  concentrationFraction: number,
  dt: number,
): { amount: number; rate: number; depletion: number } {
  if (!(expression > 0) || !(dt > 0) || !(capacity > 0)) return { amount, rate: 0, depletion: 0 };
  if (!permeaseAboveThreshold(concentrationFraction)) return { amount, rate: 0, depletion: 0 };
  const held = Math.max(0, Math.min(amount, capacity));
  const headroom = 1 - held / capacity;
  if (!(headroom > 0)) return { amount: held, rate: 0, depletion: 0 };
  const rate = UPTAKE_PER_SECOND * expression * concentrationFraction * headroom;
  const next = Math.min(capacity, held + rate * dt);
  const imported = next - held;
  return { amount: next, rate: imported / dt, depletion: imported * FIELD_FRACTION_PER_UNIT };
}