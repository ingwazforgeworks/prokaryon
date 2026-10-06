import {
  geneUnlockCost,
  isGeneDefault,
  isGeneUnlocked,
  isPartDefault,
  isPartUnlocked,
  missingPartRequirements,
  partRequirementsMet,
  partUnlockCost,
  resetUnlocks,
  unlockGene,
  unlockPart,
} from "./geneUnlocks";
import { mutationPointCount, setMutationPoints } from "./resources";
import { REGULATORY_CATEGORY_ORDER, REGULATORY_EDGES, REGULATORY_PARTS } from "./regulatoryParts";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

// Graph integrity: edges reference real parts, ids are unique, categories valid.
const ids = new Set(REGULATORY_PARTS.map((part) => part.id));
check(REGULATORY_PARTS.length === 23, "the regulatory tree carries 23 parts");
check(ids.size === REGULATORY_PARTS.length, "regulatory part ids are unique");
for (const edge of REGULATORY_EDGES) {
  check(ids.has(edge.from) && ids.has(edge.to), `edge ${edge.from}->${edge.to} references a real part`);
}
for (const part of REGULATORY_PARTS) {
  check(REGULATORY_CATEGORY_ORDER.includes(part.category), `${part.id} sits in a known category`);
}

// Defaults: Constitutive, No Expression, Microexpression, and the three basic routes.
const defaults = REGULATORY_PARTS.filter((part) => part.defaultUnlocked).map((part) => part.id);
check(
  defaults.length === 6 &&
    isPartDefault("CNST") &&
    isPartDefault("OFF") &&
    isPartDefault("MICRO") &&
    isPartDefault("CYTO") &&
    isPartDefault("SecretoryPeptide") &&
    isPartDefault("TransmembraneSignal"),
  "exactly the six intended parts are default unlocked",
);

// A fresh cell: defaults available, everything else locked.
resetUnlocks();
for (const id of defaults) check(isPartUnlocked(id), `${id} is unlocked by default`);
check(!isPartUnlocked("GRAD") && !isPartUnlocked("PERS") && !isPartUnlocked("SURF") && !isPartUnlocked("BILT"), "non-default parts start locked");
check(isPartUnlocked("UNKNOWN_PART_ID"), "unknown part ids stay available so trays never lose catalog items");

// Purchase gating.
check(partRequirementsMet("GRAD") && partRequirementsMet("OSCL"), "Constitutive unlocks Graded and Oscillatory");
check(!partRequirementsMet("THRS") && missingPartRequirements("THRS").join(" ") === "Unlocked by Graded", "Threshold waits on Graded");
check(!partRequirementsMet("COND"), "Conditional waits on Oscillatory");
check(!partRequirementsMet("PERS"), "Persistence Gated waits on its parents");
check(partUnlockCost("GRAD") === 1 && partUnlockCost("CNST") === null && partUnlockCost("FLGN") === null, "purchasable parts cost 1 MP; defaults and genes are not parts");

// Expression ladder: each rung needs the one below it.
check(partRequirementsMet("LOW"), "Low expression is unlocked by default Microexpression");
check(!partRequirementsMet("MED"), "Medium waits on Low");
check(!partRequirementsMet("HYPER"), "Hyperexpression waits on the ladder below it");
check(missingPartRequirements("MED").join(" ") === "Unlocked by Low Expression", "Medium names Low as its parent");

// Destination and position gates.
check(partRequirementsMet("SURF") && missingPartRequirements("SURF").length === 0, "Membrane anchored's default Transmembrane prerequisite is already met");
check(!isPartUnlocked("SURF"), "Membrane anchored still has to be bought");
check(!partRequirementsMet("BIPO"), "Bipolar waits on both poles");
check(!partRequirementsMet("LATR") && !partRequirementsMet("ANTL"), "laterals wait on both poles");
check(!partRequirementsMet("BILT"), "bilateral waits on both laterals");

// Spending mutation points: requirements enforced, MP deducted, state kept.
setMutationPoints(30);
check(!unlockPart("MED"), "Medium cannot be bought before Low");
check(!unlockPart("HIGH"), "High cannot be bought before Medium");
check(!unlockPart("CNST"), "default parts cannot be bought");
check(unlockPart("LOW"), "Low can be bought");
check(mutationPointCount() === 29, "buying Low spent a mutation point");
check(isPartUnlocked("LOW") && unlockPart("LOW") === false, "Low stays unlocked and cannot be rebought");
check(unlockPart("MED"), "Medium can be bought after Low");
check(unlockPart("HIGH"), "High can be bought after Medium");

const polar = "PolarLocalizationSignal";
const antipolar = "AntiPolarLocalizationSignal";
check(unlockPart(polar) && unlockPart(antipolar), "both poles can be bought");
check(partRequirementsMet("BIPO") && partRequirementsMet("LATR") && partRequirementsMet("ANTL"), "pole unlocks open the side and combo tags");
check(unlockPart("LATR") && unlockPart("ANTL") && unlockPart("BILT"), "the side and combo tags can be bought");
check(!partRequirementsMet("PERS") && unlockPart("PERS") === false, "Persistence Gated still closed until its parents are bought");
check(unlockPart("GRAD") && unlockPart("THRS") && unlockPart("OSCL") && unlockPart("COND") && unlockPart("PERS"), "the promoter chain can be walked in order");

// A reset clears purchases but never the defaults.
resetUnlocks();
check(!isPartUnlocked("GRAD") && !isPartUnlocked("BILT"), "a reset clears purchased parts");
check(isPartUnlocked("CNST") && isPartUnlocked("TransmembraneSignal"), "defaults survive a reset");

// Gene defaults: the six top-level metabolism genes are free from the start of a cell's life.
check(
  isGeneDefault("ATPS") && isGeneDefault("FLUX") && isGeneDefault("FERP") &&
    isGeneDefault("SLFP") && isGeneDefault("FERR") && isGeneDefault("SLFR"),
  "the six metabolism genes are default unlocked",
);
check(!isGeneDefault("FLGN") && !isGeneDefault("OXDR") && !isGeneDefault("FCTR"), "no other gene is marked default");
check(isGeneUnlocked("ATPS") && isGeneUnlocked("FERR"), "default genes read as unlocked");
check(!isGeneUnlocked("FLGN"), "non-default genes stay locked after a reset");
check(geneUnlockCost("ATPS") === null && geneUnlockCost("FERR") === null, "default genes cost no MP and cannot be bought");
check(unlockGene("ATPS") === false && unlockGene("FERR") === false, "default genes reject purchase");

if (failed > 0) throw new Error(`${failed} regulatory unlock checks failed`);
console.log("regulatory unlock checks passed");