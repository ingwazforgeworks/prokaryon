import type { FlagellinConstruct } from "./flagellinDistribution";
import { genomeCanDriveOsmoprotectin, osmolynDamageScale, osmoprotectinExpressionLevel } from "./osmoprotectin";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "OSMP",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: null,
  siteId: null,
  ...overrides,
});

check(osmoprotectinExpressionLevel([]) === 0, "no constructs express no osmoprotectin");
check(osmoprotectinExpressionLevel([construct()]) === 1, "an untagged hyperexpressed synthase still shields");
check(osmoprotectinExpressionLevel([construct({ routeId: "CYTO" })]) === 1, "a cytosolic synthase shields");
check(osmoprotectinExpressionLevel([construct({ routeId: "TransmembraneSignal" })]) === 1, "a transmembrane synthase still counts as expressed");
check(osmoprotectinExpressionLevel([construct({ routeId: "SecretoryPeptide" })]) === 1, "a secreted synthase still counts as expressed");
check(osmoprotectinExpressionLevel([construct({ promoterId: "GRAD" })]) === 0, "unsimulated promoters produce no osmoprotectin yet");
check(osmoprotectinExpressionLevel([construct({ geneId: "OSMS" })]) === 0, "osmolyn synthase does not count as osmoprotectin");
check(osmoprotectinExpressionLevel([construct({ amountId: "MED" })]) === 0.5, "medium expression is a half shield");
check(
  osmoprotectinExpressionLevel([construct(), construct()]) === 2,
  "two hyperexpressed constructs stack past one full expression",
);
check(
  osmoprotectinExpressionLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })]) === 1,
  "two medium constructs add to one full expression",
);
check(
  genomeCanDriveOsmoprotectin([construct()]) && !genomeCanDriveOsmoprotectin([construct({ promoterId: "GRAD" })]),
  "only a simulated promoter can drive the shield",
);

check(osmolynDamageScale(0) === 1, "no synthase leaves the shrivel untouched");
check(Math.abs(osmolynDamageScale(1) - 0.5005) < 1e-9, "one hyperexpressed construct leaves about half the shrivel");
check(Math.abs(osmolynDamageScale(2) - 0.001) < 1e-9, "two hyperexpressed constructs leave a 0.1% shrivel");
check(osmolynDamageScale(5) === osmolynDamageScale(2), "further constructs do not erase the last 0.1%");
check(osmolynDamageScale(Number.NaN) === 1, "a broken expression level protects nothing");

if (failed > 0) throw new Error(`${failed} osmoprotectin checks failed`);
console.log("osmoprotectin checks passed");
