import {
  applySnapshot,
  clearPart,
  draftProblems,
  getDraft,
  getGenome,
  insertDraft,
  placePart,
  resetGenomeState,
  setDraftBinding,
  setDraftCode,
  setDraftName,
} from "./genomeState";
import { resetUnlocks, unlockGene, unlockPart } from "./geneUnlocks";
import { setMutationPoints } from "./resources";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

resetUnlocks();
resetGenomeState();
setMutationPoints(10);
check(unlockPart("OSCL") && unlockPart("COND"), "conditional unlocks after oscillatory");
check(unlockGene("OSMR"), "the osmolyn receptor can be bought");

setDraftName("Osmolyn Receptor");
setDraftCode("OSMR");
check(placePart("promoter", "CNST") && placePart("amount", "HYPER") && placePart("coding", "OSMR") && placePart("route", "TransmembraneSignal"), "the receptor construct assembles");
const receptor = insertDraft();
check(!("problems" in receptor), "the receptor construct commits");

clearPart("promoter");
setDraftName("Guarded Flagellin");
setDraftCode("GFLG");
check(placePart("promoter", "COND"), "a conditional promoter places");
check(placePart("coding", "FLGN") && placePart("amount", "MED") && placePart("route", "SecretoryPeptide"), "the downstream gene assembles");
check(draftProblems().some((problem) => problem.includes("Choose which receptor")), "a conditional gene must name a receptor");
check(setDraftBinding("receptor", "OSMR"), "the expressed osmolyn receptor can be chosen");
check(draftProblems().some((problem) => problem.includes("Choose how")), "a chosen receptor still needs a response");
check(setDraftBinding("response", "PROP"), "proportional response places");
check(draftProblems().length === 0, "a proportional conditional gene is complete");
check(getDraft().threshold === null, "proportional response keeps no saturation mark");
check(setDraftBinding("response", "INVP"), "inversely proportional response places");
check(draftProblems().length === 0, "an inversely proportional gene is complete");
check(getDraft().threshold === null, "inversely proportional response keeps no saturation mark");
check(setDraftBinding("response", "GATE") && getDraft().threshold === 0.5, "threshold defaults to half saturation");
check(setDraftBinding("threshold", "M25") && getDraft().threshold === 0.25, "the quarter mark replaces the default");
const committed = insertDraft();
check(!("problems" in committed), "the conditional gene commits");
if (!("problems" in committed)) {
  const cassette = getGenome()[committed.index];
  check(cassette?.receptorId === "OSMR" && cassette?.responseId === "GATE" && cassette?.threshold === 0.25, "the cassette keeps the receptor, response, and mark");
}

const saved = {
  v: 1 as const,
  draft: getDraft(),
  genome: getGenome().map((cassette) => ({ ...cassette })),
};
applySnapshot(saved);
const restored = getGenome().find((cassette) => cassette.responseId === "GATE");
check(restored?.receptorId === "OSMR" && restored?.threshold === 0.25, "a snapshot keeps the conditional binding");

check(placePart("promoter", "CNST"), "leaving conditional clears the need for a receptor");
check(getDraft().receptorId === null && getDraft().responseId === null && getDraft().threshold === null, "a constitutive promoter drops the receptor binding");

if (failed > 0) throw new Error(`${failed} conditional promoter checks failed`);
console.log("conditional promoter checks passed");
