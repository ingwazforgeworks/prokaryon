import { geneExpressionSum, genomeCanExpressGene, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Osmoprotectin Synthase (OSMP) expression. Any copy the cell makes contributes,
 * including an untagged construct, which stays in the cytosol. The level limits
 * how far osmotic stress moves toward -1 in osmolyn-rich water. It does not
 * change the move toward +1 in thin water.
 */

const EXPRESSED_ROUTES = new Set(["CYTO", "SecretoryPeptide", "TransmembraneSignal", "SURF"]);

function countedCopies(constructs: readonly FlagellinConstruct[]): FlagellinConstruct[] {
  return constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
}

/** Osmoprotectin Synthase copies expressed right now. Copies stack past one full expression. */
export function osmoprotectinExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionSum(countedCopies(constructs), "OSMP", EXPRESSED_ROUTES, timeSeconds);
}

/** Whether any construct could make Osmoprotectin, regardless of oscillation phase. */
export function genomeCanDriveOsmoprotectin(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(countedCopies(constructs), "OSMP", EXPRESSED_ROUTES);
}

/** Two hyperexpressed constructs. Protection stops climbing past this. */
export const OSMP_SATURATION_EXPRESSION = 2;

/** Fraction of the shrivel that remains once protection has saturated. */
export const OSMP_RESIDUAL_SHRIVEL = 0.001;

/**
 * How much of a full shrivel rich water can still impose. Protection climbs
 * in a straight line and saturates at 99.9% once expression reaches two
 * hyperexpressed constructs. Nothing removes the last 0.1%.
 */
export function osmolynDamageScale(expression: number): number {
  if (!(expression > 0) || !Number.isFinite(expression)) return 1;
  const coverage = Math.min(1, expression / OSMP_SATURATION_EXPRESSION);
  return 1 - (1 - OSMP_RESIDUAL_SHRIVEL) * coverage;
}
