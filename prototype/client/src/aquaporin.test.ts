import type { FlagellinConstruct } from "./flagellinDistribution";
import { aquaporinChannelOpen, aquaporinExpressionLevel, genomeCanDriveAquaporin } from "./aquaporin";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "AQUP",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "TransmembraneSignal",
  siteId: null,
  ...overrides,
});

check(aquaporinExpressionLevel([]) === 0, "no constructs express no aquaporin");
check(aquaporinExpressionLevel([construct()]) === 1, "a hyperexpressed transmembrane aquaporin reads full");
check(aquaporinExpressionLevel([construct({ routeId: null })]) === 0, "an untagged aquaporin stays cytosolic and stays shut");
check(aquaporinExpressionLevel([construct({ routeId: "CYTO" })]) === 0, "a cytosolic aquaporin stays shut");
check(aquaporinExpressionLevel([construct({ routeId: "SecretoryPeptide" })]) === 0, "a secreted aquaporin stays shut");
check(aquaporinExpressionLevel([construct({ routeId: "SURF" })]) === 0, "a membrane-anchored aquaporin stays shut");
check(aquaporinExpressionLevel([construct({ promoterId: "GRAD" })]) === 0, "unsimulated promoters produce no aquaporin yet");
check(aquaporinExpressionLevel([construct({ geneId: "OSMP" })]) === 0, "osmoprotectin does not count as aquaporin");
check(aquaporinExpressionLevel([construct({ amountId: "MICRO" })]) === 0.1, "microexpression still produces a working channel");
check(aquaporinExpressionLevel([construct({ siteId: "PolarLocalizationSignal" })]) === 1, "a position tag does not close a transmembrane channel");
check(genomeCanDriveAquaporin([construct()]) && !genomeCanDriveAquaporin([construct({ routeId: "SURF" })]), "only a transmembrane aquaporin can open");

check(!aquaporinChannelOpen(0), "no expression leaves the channel shut");
check(aquaporinChannelOpen(0.1), "the smallest working expression opens the channel fully");
check(aquaporinChannelOpen(1), "full expression opens the same gate");
check(!aquaporinChannelOpen(Number.NaN), "a broken expression level leaves the channel shut");

if (failed > 0) throw new Error(`${failed} aquaporin checks failed`);
console.log("aquaporin checks passed");
