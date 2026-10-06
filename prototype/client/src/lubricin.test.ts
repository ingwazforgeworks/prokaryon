import type { FlagellinConstruct } from "./flagellinDistribution";
import { genomeCanDriveLubricin, lubricinExpressionLevel } from "./lubricin";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "LUBR",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "SecretoryPeptide",
  siteId: null,
  ...overrides,
});

check(lubricinExpressionLevel([]) === 0, "no constructs express no lubricin");
check(lubricinExpressionLevel([construct()]) === 1, "a hyperexpressed secreted lubricin reads full");
check(lubricinExpressionLevel([construct({ routeId: null })]) === 0, "an untagged lubricin stays inside and slicks nothing");
check(lubricinExpressionLevel([construct({ routeId: "CYTO" })]) === 0, "a cytosolic lubricin slicks nothing");
check(lubricinExpressionLevel([construct({ routeId: "TransmembraneSignal" })]) === 0, "a transmembrane lubricin slicks nothing");
check(lubricinExpressionLevel([construct({ routeId: "SURF" })]) === 0, "a membrane-anchored lubricin slicks nothing");
check(lubricinExpressionLevel([construct({ promoterId: "GRAD" })]) === 0, "unsimulated promoters produce no lubricin yet");
check(lubricinExpressionLevel([construct({ geneId: "FLGN" })]) === 0, "flagellin constructs do not count as lubricin");
check(lubricinExpressionLevel([construct({ amountId: "MICRO" })]) === 0.1, "microexpression is a thin film");
check(lubricinExpressionLevel([construct({ amountId: "MED" })]) === 0.5, "medium expression is half slick");
check(
  lubricinExpressionLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })]) === 1,
  "stacked lubricin constructs clamp at full slickness",
);
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" };
check(lubricinExpressionLevel([construct(swing)], 0) === 0.1, "an oscillatory lubricin rests at its minimum at t=0");
check(lubricinExpressionLevel([construct(swing)], 2) === 1, "an oscillatory lubricin peaks at its maximum at the half period");

check(genomeCanDriveLubricin([]) === false, "an empty genome cannot drive lubricity");
check(genomeCanDriveLubricin([construct()]) === true, "a secreted lubricin construct drives lubricity");
check(genomeCanDriveLubricin([construct({ routeId: null })]) === false, "an untagged lubricin construct cannot drive lubricity");
check(genomeCanDriveLubricin([construct({ routeId: "CYTO" })]) === false, "a cytosolic lubricin construct cannot drive lubricity");
check(genomeCanDriveLubricin([construct({ routeId: "TransmembraneSignal" })]) === false, "a transmembrane lubricin construct cannot drive lubricity");
check(genomeCanDriveLubricin([construct({ routeId: "SURF" })]) === false, "a membrane-anchored lubricin construct cannot drive lubricity");
check(genomeCanDriveLubricin([construct({ promoterId: "GRAD" })]) === false, "an unsimulated promoter cannot drive lubricity");
check(genomeCanDriveLubricin([construct({ geneId: "FLGN" })]) === false, "a flagellin construct cannot drive lubricity");
check(genomeCanDriveLubricin([construct(swing)]) === true, "an oscillatory lubricin at its trough still owns lubricity");

if (failed > 0) throw new Error(`${failed} lubricin checks failed`);
console.log("lubricin checks passed");
