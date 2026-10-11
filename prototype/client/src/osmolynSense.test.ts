import type { FlagellinConstruct } from "./flagellinDistribution";
import {
  genomeCanSenseOsmolyn,
  genomeExpressesOsmolynReceptor,
  osmolynDetectionLimit,
  osmolynReceptorExpressionLevel,
  osmolynReceptorSensitivity,
  osmolynSaturation,
  sensedOsmolyn,
} from "./osmolynSense";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "OSMR",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "TransmembraneSignal",
  siteId: null,
  ...overrides,
});

check(osmolynReceptorExpressionLevel([]) === 0, "no constructs express no receptor");
check(osmolynReceptorExpressionLevel([construct()]) === 1, "a hyperexpressed transmembrane receptor reads full");
check(osmolynReceptorExpressionLevel([construct({ routeId: null })]) === 0, "an untagged receptor stays cytosolic and senses nothing");
check(osmolynReceptorExpressionLevel([construct({ routeId: "CYTO" })]) === 0, "a cytosolic receptor senses nothing");
check(osmolynReceptorExpressionLevel([construct({ routeId: "SecretoryPeptide" })]) === 0, "a secreted receptor senses nothing");
check(osmolynReceptorExpressionLevel([construct({ routeId: "SURF" })]) === 0, "a membrane-anchored receptor senses nothing");
check(osmolynReceptorExpressionLevel([construct({ promoterId: "GRAD" })]) === 0, "unsimulated promoters produce no receptor yet");
check(osmolynReceptorExpressionLevel([construct({ geneId: "CHMR" })]) === 0, "a chemoreceptor does not count as an osmolyn receptor");
check(osmolynReceptorExpressionLevel([construct({ amountId: "MICRO" })]) === 0.1, "microexpression scales the receptor level");
check(osmolynReceptorExpressionLevel([construct({ siteId: "PolarLocalizationSignal" })]) === 1, "a position tag does not stop a transmembrane receptor");
check(genomeCanSenseOsmolyn([construct()]) && !genomeCanSenseOsmolyn([construct({ routeId: "CYTO" })]), "only a transmembrane receptor can sense");

check(osmolynDetectionLimit(0) === Number.POSITIVE_INFINITY, "no expression has no detection limit");
check(Math.abs(osmolynDetectionLimit(1) - 0.04) < 1e-9, "full expression detects down to 0.04 of the field");
check(Math.abs(osmolynDetectionLimit(0.1) - 0.4) < 1e-9, "microexpression only detects rich water");
check(osmolynDetectionLimit(1) < osmolynDetectionLimit(0.1), "higher expression detects a smaller concentration");
check(osmolynReceptorSensitivity([construct(), construct()]) === 2, "a second receptor construct adds to the sensitivity");
check(osmolynDetectionLimit(osmolynReceptorSensitivity([construct(), construct()])) < osmolynDetectionLimit(1), "two full receptors detect a smaller concentration than one");
check(genomeExpressesOsmolynReceptor([construct()]) && !genomeExpressesOsmolynReceptor([construct({ amountId: "OFF" })]), "only a receptor that actually makes protein counts as expressed");

check(sensedOsmolyn(0, 0.4) === null, "an idle receptor leaves the concentration unknown");
check(sensedOsmolyn(1, 0.4) === 0.4, "a working receptor reports the water it is sitting in");
check(sensedOsmolyn(0.1, 0.4) === 0.4, "microexpression just reaches a 0.4 field");
check(sensedOsmolyn(0.1, 0.2) === 0, "microexpression misses dilute osmolyn");
check(sensedOsmolyn(1, 0.2) === 0.2, "full expression still reads that dilute water");
check(sensedOsmolyn(1, 0) === 0, "a working receptor can report water that holds no osmolyn");
check(sensedOsmolyn(1, -1) === 0 && sensedOsmolyn(1, 2) === 1, "the reading stays inside the field range");
check(sensedOsmolyn(1, Number.NaN) === null, "a broken sample is not a reading");
check(osmolynSaturation(0, 0.5) === 0, "a missing receptor is not saturated");
check(osmolynSaturation(0.1, 0.2) === 0, "undetected water does not saturate a weak receptor");
check(osmolynSaturation(1, 0.2) > 0, "the same water saturates a full receptor");
check(osmolynSaturation(1, 1) > osmolynSaturation(1, 0.2), "richer water saturates the receptor further");

if (failed > 0) throw new Error(`${failed} osmolyn receptor checks failed`);
console.log("osmolyn receptor checks passed");
