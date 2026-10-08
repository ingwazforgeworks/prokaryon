import { geneExpressionLevel, genomeCanExpressGene, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Aquaporin (AQUP) expression. Only a transmembrane copy counts. In thin
 * water the level equilibrates osmotic stress, from +1 with no channel down
 * to 0 when the channel is fully expressed. In osmolyn-rich water that same
 * level hastens the shrivel toward -1.
 */

const TRANSMEMBRANE_ROUTES = new Set(["TransmembraneSignal"]);

/** Transmembrane Aquaporin copies expressed right now, clamped at full. */
export function aquaporinExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, "AQUP", TRANSMEMBRANE_ROUTES, timeSeconds);
}

/** Whether any construct could open an Aquaporin, regardless of oscillation phase. */
export function genomeCanDriveAquaporin(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "AQUP", TRANSMEMBRANE_ROUTES);
}

/** True once any working transmembrane copy is expressed. Amount does not matter. */
export function aquaporinChannelOpen(expression: number): boolean {
  return expression > 0 && Number.isFinite(expression);
}
