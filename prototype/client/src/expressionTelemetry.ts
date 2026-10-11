import { expressionEntryId, publishExpressionSample, type LocalizationDistribution } from "./expressionData";
import { expressedAmount } from "./flagellinDistribution";
import { getGenome } from "./genomeState";

/** Five samples a second keeps a four-second oscillation smooth and a ten-minute chart intact. */
const SAMPLE_INTERVAL_SECONDS = 0.2;

let lastRecordedAt = Number.NEGATIVE_INFINITY;

/**
 * Writes the current expression of every construct into the expression window.
 * Copy order matches the window's genome list: the nth copy of a gene is copy n.
 * Call this after the receptor snapshot for the same timestamp.
 */
export function recordCellExpression(cellId: number, timeSeconds: number): void {
  if (timeSeconds >= lastRecordedAt && timeSeconds - lastRecordedAt < SAMPLE_INTERVAL_SECONDS) return;
  lastRecordedAt = timeSeconds;
  const seen = new Map<string, number>();
  for (const cassette of getGenome()) {
    const copyIndex = seen.get(cassette.geneId) ?? 0;
    seen.set(cassette.geneId, copyIndex + 1);
    const level = expressedAmount(cassette, timeSeconds);
    publishExpressionSample(cellId, expressionEntryId(cellId, cassette.geneId, copyIndex), {
      time: timeSeconds,
      ratePerSecond: level,
      abundance: level,
      distribution: localizationOf(cassette.routeId, cassette.siteId),
    });
  }
}

function localizationOf(routeId: string | null, siteId: string | null): LocalizationDistribution {
  if (routeId === "SecretoryPeptide") return { membrane: 0, cytosol: 0, secreted: 1 };
  if (routeId === "CYTO" || (routeId === null && siteId === null)) return { membrane: 0, cytosol: 1, secreted: 0 };
  return { membrane: 1, cytosol: 0, secreted: 0 };
}
