import type { FlagellinConstruct } from "./flagellinDistribution";
import {
  ANABOLASE_DOUBLE_SECONDS_HYPER,
  ANABOLASE_DOUBLE_SECONDS_MED,
  ANABOLASE_DOUBLE_SECONDS_MICRO,
  anabolaseDoublingSeconds,
  anabolaseExpressionLevel,
  cyclinExpressionLevel,
  cyclinTriggersDivision,
  stepAnabolaseGrowth,
} from "./reproduction";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

function closeTo(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

const construct = (overrides: Partial<FlagellinConstruct>): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "ANAB",
  amountId: null,
  routeId: "CYTO",
  siteId: null,
  ...overrides,
});

// Doubling times at the three design anchors.
check(anabolaseDoublingSeconds(0.1) === ANABOLASE_DOUBLE_SECONDS_MICRO, "microexpression doubles every fifteen minutes");
check(anabolaseDoublingSeconds(0.5) === ANABOLASE_DOUBLE_SECONDS_MED, "medium expression doubles every five minutes");
check(anabolaseDoublingSeconds(1) === ANABOLASE_DOUBLE_SECONDS_HYPER, "hyperexpression doubles every three minutes");
check(anabolaseDoublingSeconds(0) === Infinity, "no expression never doubles");

// Growth compounds exponentially: one doubling time exactly doubles the cell.
const DOUBLE_EPS = 1e-9;
check(closeTo(stepAnabolaseGrowth(1, 0.1, ANABOLASE_DOUBLE_SECONDS_MICRO, 3), 2, DOUBLE_EPS), "microexpression doubles the cell in fifteen minutes");
check(closeTo(stepAnabolaseGrowth(1, 0.5, ANABOLASE_DOUBLE_SECONDS_MED, 3), 2, DOUBLE_EPS), "medium expression doubles the cell in five minutes");
check(closeTo(stepAnabolaseGrowth(1, 1, ANABOLASE_DOUBLE_SECONDS_HYPER, 3), 2, DOUBLE_EPS), "hyperexpression doubles the cell in three minutes");
check(stepAnabolaseGrowth(2, 0, 60, 3) === 2, "no expression grows nothing");
check(stepAnabolaseGrowth(2, 0.5, 0, 3) === 2, "no time passes grows nothing");
check(stepAnabolaseGrowth(2.9, 1, 600, 3) === 3, "growth stops at the size cap");
check(stepAnabolaseGrowth(3, 1, 60, 3) === 3, "a capped cell stays capped");
check(stepAnabolaseGrowth(0.5, 0.5, 150, 3) < 1, "a newborn grows toward division size");

// Between anchors the rate interpolates monotonically, so partial expression
// lands between the neighbouring doubling times.
check(anabolaseDoublingSeconds(0.3) > ANABOLASE_DOUBLE_SECONDS_MED && anabolaseDoublingSeconds(0.3) < ANABOLASE_DOUBLE_SECONDS_MICRO, "low-medium expression doubles between medium and micro");
check(anabolaseDoublingSeconds(0.7) > ANABOLASE_DOUBLE_SECONDS_HYPER && anabolaseDoublingSeconds(0.7) < ANABOLASE_DOUBLE_SECONDS_MED, "high expression doubles between hyper and medium");
check(anabolaseDoublingSeconds(1.5) === ANABOLASE_DOUBLE_SECONDS_HYPER, "expression above full is clamped to hyper");
check(anabolaseDoublingSeconds(0.05) > ANABOLASE_DOUBLE_SECONDS_MICRO, "trace expression grows slower than micro");

// Expression follows the cytosolic route rules: untagged counts as cytosolic,
// and exported or membrane-anchored copies never fold into the module.
check(anabolaseExpressionLevel([construct({ amountId: "MED" })]) === 0.5, "medium anabolase expresses at half");
check(anabolaseExpressionLevel([construct({ amountId: "MED", routeId: null })]) === 0.5, "an untagged construct is cytosolic");
check(anabolaseExpressionLevel([construct({ amountId: "HYPER", routeId: "SecretoryPeptide" })]) === 0, "secreted anabolase grows nothing");
check(anabolaseExpressionLevel([construct({ amountId: "HYPER", routeId: "TransmembraneSignal" })]) === 0, "membrane-anchored anabolase grows nothing");
check(anabolaseExpressionLevel([construct({ amountId: "MED", promoterId: "COND" })]) === 0, "unexpressed promoters produce no anabolase");
check(anabolaseExpressionLevel([construct({ amountId: "MED", geneId: "CYCL" })]) === 0, "cyclin is not anabolase");
check(cyclinExpressionLevel([construct({ geneId: "CYCL", amountId: "MED" })]) === 0.5, "medium cyclin expresses at half");
check(cyclinExpressionLevel([construct({ geneId: "CYCL", amountId: "MED", routeId: null })]) === 0.5, "an untagged cyclin construct is cytosolic");
check(cyclinExpressionLevel([construct({ geneId: "CYCL", amountId: "HYPER", routeId: "SecretoryPeptide" })]) === 0, "secreted cyclin commits nothing");

// Cyclin commits the cell to division only while expressed and only at or
// above the minimum division size: dividing halves the cell, so 1.0 is the
// smallest size that leaves both daughters above the 0.5 floor.
check(cyclinTriggersDivision(0.5, 1, false, 1), "expressed cyclin divides a division-size cell");
check(cyclinTriggersDivision(0.1, 1, false, 1), "even trace cyclin commits a ready cell");
check(!cyclinTriggersDivision(0.5, 0.99, false, 1), "cyclin waits below division size");
check(cyclinTriggersDivision(0.5, 0.99995, false, 1), "the divide gate epsilon accepts slider-exact values");
check(!cyclinTriggersDivision(0.5, 1, true, 1), "cyclin does not recommit mid-division");
check(!cyclinTriggersDivision(0, 1, false, 1), "silent cyclin divides nothing");
check(!cyclinTriggersDivision(0.5, 0.5, false, 1), "a newborn cannot divide");

if (failed > 0) throw new Error(`${failed} checks failed`);
console.log("reproduction checks passed");