import { geneExpressionLevel, genomeCanExpressGene, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Osmolyn Receptor (OSMR) expression. The receptor only reads the water while
 * it spans the membrane. Cytosolic, secreted, and membrane-anchored copies
 * report nothing, and an untagged construct stays in the cytosol.
 */

const TRANSMEMBRANE_ROUTES = new Set(["TransmembraneSignal"]);

/** Transmembrane Osmolyn Receptor copies expressed right now, clamped at full. */
export function osmolynReceptorExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, "OSMR", TRANSMEMBRANE_ROUTES, timeSeconds);
}

/**
 * Whether any construct could embed an Osmolyn Receptor, regardless of the
 * current oscillation phase.
 */
export function genomeCanSenseOsmolyn(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "OSMR", TRANSMEMBRANE_ROUTES);
}

/**
 * Osmolyn the cell can actually read, as a field fraction from 0 to 1.
 * A missing or idle receptor returns null: the cell does not know the
 * concentration, which is a different state from water that holds none.
 * Any working transmembrane copy reports the water the cell is sitting in.
 * Extra copies do not change the number.
 */
export function sensedOsmolyn(expression: number, localFraction: number): number | null {
  if (!(expression > 0) || !Number.isFinite(localFraction)) return null;
  if (localFraction < 0) return 0;
  if (localFraction > 1) return 1;
  return localFraction;
}
