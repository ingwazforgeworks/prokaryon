import { geneExpressionLevel, genomeCanExpressGene, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Lubricin (LUBR) expression, derived from genome constructs. Pure data logic
 * with no imports on the renderer or DOM so the coat rules stay testable
 * alone. The protein is a secreted film: only copies sent out of the cell
 * slick the envelope, and the film's thickness is the expression level. That
 * level is the lubricity the terrain slide already reads, from 0 (sticks) to
 * 1 (keeps every bit of along-wall motion).
 */

/** Lubricin only coats the envelope once it has been secreted. */
const SECRETED_ROUTES = new Set(["SecretoryPeptide"]);

/**
 * Lubricity from expressed Lubricin, in the same 0–1 range as the debug
 * slider. Missing, cytosolic, transmembrane, and membrane-anchored copies
 * add nothing, and stacked constructs clamp at full slickness.
 */
export function lubricinExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, "LUBR", SECRETED_ROUTES, timeSeconds);
}

/**
 * Whether any construct could ever secrete lubricin, regardless of the
 * current oscillation phase. The slider takeover uses this so a troughing
 * oscillatory promoter never hands lubricity back to the sandbox slider.
 */
export function genomeCanDriveLubricin(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "LUBR", SECRETED_ROUTES);
}
