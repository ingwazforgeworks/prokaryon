import { geneExpressionLevel, geneExpressionSum, genomeCanExpressGene, OSCILLATION_PERIOD_SECONDS, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Osmolyn Receptor (OSMR) expression. The receptor only reads the water while
 * it spans the membrane. Cytosolic, secreted, and membrane-anchored copies
 * report nothing, and an untagged construct stays in the cytosol.
 *
 * Expression sets the detection limit, not the number reported above it.
 * A fully expressed receptor notices faint Osmolyn. A barely expressed one
 * only notices rich water. Below its limit the receptor reports absence,
 * which is a different state from having no receptor at all.
 *
 * Conditional copies of the receptor do not count: a sensor that only exists
 * when it has already sensed would have no first reading.
 */

const TRANSMEMBRANE_ROUTES = new Set(["TransmembraneSignal"]);

/**
 * Field fraction a fully expressed receptor (level 1) can just detect.
 * The limit scales as 1/expression, so microexpression (0.1) only detects
 * ten times that concentration.
 */
export const OSMOLYN_DETECT_AT_FULL = 0.04;

/** Stacked receptors cannot be pushed below this field fraction. */
export const OSMOLYN_DETECT_FLOOR = 0.004;

/**
 * Half-saturation concentration of one receptor, as a field fraction.
 * Copy number does not change this affinity. It only decides whether the
 * occupancy clears the noise floor and becomes a reading.
 */
export const OSMOLYN_KD = 0.25;

/** Transmembrane Osmolyn Receptor copies expressed right now, clamped at full. */
export function osmolynReceptorExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, "OSMR", TRANSMEMBRANE_ROUTES, timeSeconds, false);
}

/**
 * Unclamped transmembrane expression. Detection uses this, so a second
 * receptor construct can notice fainter Osmolyn than one alone, down to the floor.
 */
export function osmolynReceptorSensitivity(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionSum(constructs, "OSMR", TRANSMEMBRANE_ROUTES, timeSeconds, false);
}

/**
 * Whether any construct could embed an Osmolyn Receptor, regardless of the
 * current oscillation phase.
 */
export function genomeCanSenseOsmolyn(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "OSMR", TRANSMEMBRANE_ROUTES, false);
}

/**
 * Whether the genome makes a working Osmolyn Receptor at some point in the
 * expression cycle. An oscillatory receptor counts even at its trough.
 */
export function genomeExpressesOsmolynReceptor(constructs: readonly FlagellinConstruct[]): boolean {
  const crest = OSCILLATION_PERIOD_SECONDS / 2;
  return osmolynReceptorExpressionLevel(constructs, 0) > 0 || osmolynReceptorExpressionLevel(constructs, crest) > 0;
}

/** Smallest field fraction this expression can report. Infinity when nothing is expressed. */
export function osmolynDetectionLimit(expression: number): number {
  if (!(expression > 0) || !Number.isFinite(expression)) return Number.POSITIVE_INFINITY;
  const gain = Math.min(expression, 8);
  return Math.max(OSMOLYN_DETECT_FLOOR, OSMOLYN_DETECT_AT_FULL / gain);
}

/** Occupancy of one receptor at this field fraction, before the detection gate. */
export function osmolynOccupancy(localFraction: number): number {
  if (!Number.isFinite(localFraction) || !(localFraction > 0)) return 0;
  const concentration = localFraction > 1 ? 1 : localFraction;
  return concentration / (concentration + OSMOLYN_KD);
}

export type OsmolynReading = {
  expression: number;
  /** Smallest field fraction this expression can detect. */
  detectionLimit: number;
  /**
   * Null when the cell has no working receptor or the water was not sampled.
   * Zero when the receptor looked and the concentration was below its limit.
   */
  concentration: number | null;
  /**
   * Null when there is no reading. Zero when the receptor is on but the
   * ligand is below its detection limit. Otherwise the occupancy.
   */
  saturation: number | null;
};

/**
 * What a transmembrane Osmolyn Receptor reports. Missing machinery leaves
 * both numbers null. A working receptor below its limit reports concentration
 * 0 and saturation 0: it looked, and the water was too faint to see.
 */
export function readOsmolyn(expression: number, localFraction: number | null): OsmolynReading {
  const level = Number.isFinite(expression) && expression > 0 ? expression : 0;
  const detectionLimit = osmolynDetectionLimit(level);
  if (!(level > 0) || localFraction === null || !Number.isFinite(localFraction)) {
    return { expression: level, detectionLimit, concentration: null, saturation: null };
  }
  const concentration = localFraction < 0 ? 0 : localFraction > 1 ? 1 : localFraction;
  if (concentration < detectionLimit) {
    return { expression: level, detectionLimit, concentration: 0, saturation: 0 };
  }
  return { expression: level, detectionLimit, concentration, saturation: osmolynOccupancy(concentration) };
}

/** Receptor occupancy the cell can act on. Undetected water and a missing receptor are both 0. */
export function osmolynSaturation(expression: number, localFraction: number): number {
  return readOsmolyn(expression, localFraction).saturation ?? 0;
}

/**
 * Osmolyn the cell can actually read, as a field fraction from 0 to 1.
 * A missing or idle receptor returns null: the cell does not know the
 * concentration, which is a different state from water that holds none
 * and from water too faint for this expression to detect.
 */
export function sensedOsmolyn(expression: number, localFraction: number): number | null {
  return readOsmolyn(expression, localFraction).concentration;
}
