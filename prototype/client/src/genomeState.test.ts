import {
  amountRange,
  applySnapshot,
  behaviorLine,
  cassetteAtpCost,
  cassetteMutationCost,
  parseSnapshot,
  clearDraft,
  clearPart,
  draftProblems,
  getDraft,
  getGenome,
  getInsertionIndex,
  insertDraft,
  placePart,
  removeCassette,
  resetGenomeState,
  setCatalogGenesPopulated,
  scalarResponse,
  setDraftCode,
  setDraftName,
  setInsertionIndex,
  slotAccepts,
  unlockedGenes,
  unlockedPromoters,
  unlockedAmounts,
  unlockedTags,
  regulatoryIcon,
  CYTOSOLIC_ICON,
  type Cassette,
} from "./genomeState";
import { resetUnlocks, unlockGene, unlockPart, unlockedGeneIds } from "./geneUnlocks";
import { mutationPointCount, setMutationPoints, STARTING_MUTATION_POINTS } from "./resources";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

resetGenomeState();
check(mutationPointCount() === STARTING_MUTATION_POINTS, "a new cell starts with 100 mutation points");
check(getGenome().length === 0, "genome starts with only genes made in the editor");
setCatalogGenesPopulated(true);
const full = getGenome().length;
check(full > 4, "populate genes fills the catalog");
check(unlockedGenes().some((gene) => gene.id === "AZOH"), "unlocked tray includes catalog genes");
const promoterIcons = unlockedPromoters().map((part) => part.icon);
const tagIcons = unlockedTags().map((part) => part.icon);
check(new Set([...promoterIcons, ...tagIcons]).size === promoterIcons.length + tagIcons.length, "each regulatory type has its own icon");
check(promoterIcons.every((icon) => icon.includes("/regulatory_icons/")), "promoter cards use regulatory icons");
check(tagIcons.every((icon) => icon.includes("/localization_icons/")), "tag cards use the unified localization icons");
check(regulatoryIcon("CYTO") === CYTOSOLIC_ICON, "cytosolic tag uses the cytosolic icon");
check(unlockedTags().some((part) => part.id === "CYTO" && part.kind === "tag"), "cytosolic is a localization tag");
check(regulatoryIcon("CNST")?.endsWith("constitutive_32x32.png") === true, "constitutive icon");
check(regulatoryIcon("GRAD")?.endsWith("graded_32x32.png") === true, "graded icon");
check(regulatoryIcon("OSCL")?.endsWith("oscillatory_32x32.png") === true, "oscillatory icon");
check(regulatoryIcon("PERS")?.endsWith("persistence_gated_32x32.png") === true, "persistence gated icon");
check(regulatoryIcon("SURF")?.endsWith("membrane_anchored_32x32.png") === true, "membrane anchored icon");
check(regulatoryIcon("THRS")?.endsWith("threshold_32x32.png") === true, "threshold icon");
check(regulatoryIcon("ANTL")?.endsWith("antilateral_32x32.png") === true, "antilateral icon");
check(regulatoryIcon("LATR")?.endsWith("lateral_32x32.png") === true, "lateral icon");
check(regulatoryIcon("BILT")?.endsWith("bilateral_32x32.png") === true, "bilateral icon");
check(regulatoryIcon("BIPO")?.endsWith("bipolar_32x32.png") === true, "bipolar icon");
check(!unlockedTags().some((part) => part.id === "SURF"), "membrane anchored starts locked on the regulatory tree");
check(unlockedTags("route").map((part) => part.id).join(",") === "CYTO,SecretoryPeptide,TransmembraneSignal", "destination tab lists the default routes only");
check(unlockedTags("site").map((part) => part.id).join(",") === "", "position tab starts empty");
check(!unlockedTags().some((part) => part.id === "ANTL" || part.id === "LATR" || part.id === "BILT" || part.id === "BIPO"), "body-site tags start locked");
setMutationPoints(5);
check(unlockPart("SURF"), "membrane anchored can be bought once transmembrane is unlocked");
check(unlockedTags("route").map((part) => part.id).join(",") === "CYTO,SecretoryPeptide,TransmembraneSignal,SURF", "buying membrane anchored adds it to the destination tab");
check(!unlockedPromoters().some((part) => part.id === "SURF" || part.id === "ANTL" || part.id === "LATR" || part.id === "BILT" || part.id === "BIPO"), "placement marks are not promoters");
check(!unlockedPromoters().some((part) => part.id === "PERS"), "persistence gated promoter is off the promoter tray until bought");
check(regulatoryIcon("SecretoryPeptide")?.endsWith("secreted_32x32.png") === true, "secreted icon");
check(scalarResponse("CNST") === null, "constitutive promoter has no scalar curve");
check(scalarResponse("COND") === null, "conditional promoter has no scalar curve");
check(!slotAccepts("promoter", "AZOH"), "a gene is not a promoter");
check(!slotAccepts("coding", "CNST"), "a promoter is not a coding region");
check(!slotAccepts("route", "CNST"), "a promoter is not a destination tag");
check(!slotAccepts("site", "SecretoryPeptide"), "a destination tag is not a position");
check(!slotAccepts("amount", "CNST"), "a promoter is not an amount part");
check(!slotAccepts("amount", "AZOH"), "a gene is not an amount part");
check(amountRange("OSCL") && amountRange("GRAD"), "oscillatory and graded promoters split the amount node");
check(!amountRange("CNST") && !amountRange("COND") && !amountRange("PERS") && !amountRange("THRS"), "other promoters keep a single amount node");
check(!slotAccepts("amount-min", "CNST") && !slotAccepts("amount-max", "AZOH"), "the split amount slots reject non-amount parts");

const amountBefore = JSON.stringify(getDraft());
check(placePart("amount", "CNST") === false && JSON.stringify(getDraft()) === amountBefore, "a non-amount drop leaves the amount slot empty");

const before = JSON.stringify(getDraft());
check(placePart("promoter", "AZOH") === false, "invalid drop is rejected");
check(JSON.stringify(getDraft()) === before, "invalid drop leaves the construct unchanged");

check(placePart("promoter", "CNST"), "promoter places");
check(placePart("coding", "AZOH"), "coding region places");
check(placePart("coding", "ATPS"), "occupied coding region is replaced");
check(getDraft().geneId === "ATPS", "replacement keeps the new gene");
check(placePart("site", "PolarLocalizationSignal"), "position tag places");
clearPart("site");
check(getDraft().siteId === null, "removed position tag is gone");
check(placePart("route", "TransmembraneSignal"), "destination tag places");
check(placePart("site", "AntiPolarLocalizationSignal"), "position tag can join a destination tag");
check(getDraft().routeId === "TransmembraneSignal" && getDraft().siteId === "AntiPolarLocalizationSignal", "a construct can carry both tag types");
check(placePart("route", "CYTO"), "cytosolic tag places");
check(getDraft().routeId === "CYTO" && getDraft().siteId === null, "cytosolic clears the position tag");
check(placePart("site", "LATR") === false, "cytosolic cannot take a second tag");
clearPart("route");
check(getDraft().promoterId === "CNST" && getDraft().geneId === "ATPS", "removing a tag keeps the other parts");

setDraftName("Nitrox scavenger");
check(getDraft().name === "Nitrox scavenger", "construct name is shared state");
check(behaviorLine().includes("ATP Synthase"), "behavior summary follows the coding region");
setDraftCode("ntr1!");
check(getDraft().code === "NTR1", "gene code is uppercase letters and numbers");
setDraftCode("AB");
check(draftProblems().some((problem) => problem.includes("Gene code")), "a short code is explained");
check("problems" in insertDraft() && getGenome().length === full, "a code shorter than 3 characters blocks insertion");
setDraftCode("TOOLONG");
check(getDraft().code === "TOOLO", "gene code stops at 5 characters");
setDraftCode("NTRX1");

const inserted = insertDraft();
check(!("problems" in inserted), "valid construct inserts");
check(getGenome().length === full + 1, "insertion commits one cassette");
if (!("problems" in inserted)) {
  check(getGenome()[inserted.index]?.name === "Nitrox scavenger", "inserted cassette keeps the construct name");
  check(getGenome()[inserted.index]?.code === "NTRX1", "inserted cassette keeps the gene code");
  check(getDraft().name === "Nitrox scavenger", "insertion keeps the unfinished draft");
  const again = insertDraft();
  check(!("problems" in again) && getGenome().length === full + 2, "a second add commits one more cassette");
  if (!("problems" in again)) check(removeCassette(again.cassette.uid), "cassette removal deletes one entry");
  check(getGenome().length === full + 1, "removal does not delete the earlier cassette");
}

clearDraft();
check(getDraft().promoterId === null && getDraft().geneId === null, "clear removes draft parts");
check(getGenome().length === full + 1, "clear keeps the committed genome");
check(draftProblems().length > 0, "an empty construct cannot be added");
const blocked = insertDraft();
check("problems" in blocked && getGenome().length === full + 1, "invalid add leaves the genome unchanged");

applySnapshot({
  v: 1,
  draft: { name: "Kept", code: "kept", promoterId: "COND", amountId: null, amountMinId: null, amountMaxId: null, geneId: "AZOH", routeId: null, siteId: null },
  genome: [
    { uid: "a", name: "ATP Synthase", code: "ATPS", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "ATPS", routeId: null, siteId: null },
  ],
});
check(getDraft().name === "Kept" && getDraft().promoterId === "COND", "snapshot restores the draft");
check(getGenome().length === 1, "snapshot replaces the genome");
check(unlockedGenes().some((gene) => gene.id === "OXDR"), "an empty tech tree leaves Oxidex Reductase available");
check(unlockedGenes().some((gene) => gene.id === "GLYS"), "an empty tech tree leaves Glycon Synthase available");

setInsertionIndex(99);
check(getInsertionIndex() === getGenome().length, "insertion index stays inside the genome");

const parsed = parseSnapshot({
  v: 1,
  draft: { name: "Bad", promoterId: "NOPE", geneId: "NOPE", tagId: "NOPE" },
  genome: [{ uid: "bad", name: "Bad", promoterId: "NOPE", geneId: "NOPE", tagId: null }],
});
check(parsed !== null, "a versioned snapshot parses");
if (parsed) applySnapshot(parsed);
check(getDraft().promoterId === null && getDraft().geneId === null, "unknown draft ids are dropped");
check(getGenome().length === 0, "unknown cassettes are dropped");

check(unlockedAmounts().map((part) => part.id).join(",") === "OFF,MICRO", "the amount tab starts with no expression and microexpression");
check(unlockedAmounts().every((part) => part.icon.includes("/regulatory_icons/")), "amount cards use the expression level icons");
check(placePart("amount", "MED"), "an amount part places in the single amount slot");
check(getDraft().amountId === "MED", "the single amount slot holds the placed part");
check(placePart("amount-min", "LOW") === false, "the split amount slots stay inactive without a ranged promoter");
clearPart("amount");
check(getDraft().amountId === null, "a removed amount part is gone");
check(placePart("promoter", "OSCL"), "an oscillatory promoter places");
check(placePart("amount", "MED") === false, "the single amount slot is inactive under a ranged promoter");
check(placePart("amount-min", "LOW") && placePart("amount-max", "HYPER"), "min and max amount parts place under a ranged promoter");
check(getDraft().amountMinId === "LOW" && getDraft().amountMaxId === "HYPER", "the split slots hold the placed parts");
clearPart("amount-max");
check(placePart("amount-max", "MICRO") && placePart("amount-min", "HYPER"), "the split slots can be replaced");
check(draftProblems().some((problem) => problem.includes("Minimum amount")), "a minimum above the maximum is explained");
placePart("amount-max", "HYPER");
check(draftProblems().every((problem) => !problem.includes("Minimum amount")), "a minimum at or below the maximum is valid");

setDraftName("Ranged scavenger");
setDraftCode("RNG1");
check(placePart("coding", "AZOH"), "a coding region places beside the split amounts");
const rangedInsert = insertDraft();
check(!("problems" in rangedInsert), "a ranged construct inserts");
if (!("problems" in rangedInsert)) {
  const placed = getGenome()[rangedInsert.index];
  check(
    placed?.amountId === null && placed?.amountMinId === "HYPER" && placed?.amountMaxId === "HYPER",
    "a ranged cassette keeps only the min and max amounts",
  );
}

applySnapshot({
  v: 1,
  draft: { name: "Ranged", code: "RNG2", promoterId: "GRAD", amountId: "MED", amountMinId: "LOW", amountMaxId: "HIGH", geneId: "AZOH", routeId: null, siteId: null },
  genome: [],
});
check(
  getDraft().amountId === null && getDraft().amountMinId === "LOW" && getDraft().amountMaxId === "HIGH",
  "a ranged snapshot drops the single amount",
);
applySnapshot({
  v: 1,
  draft: { name: "Single", code: "SNG1", promoterId: "CNST", amountId: "MED", amountMinId: "LOW", amountMaxId: "HIGH", geneId: "AZOH", routeId: null, siteId: null },
  genome: [],
});
check(
  getDraft().amountId === "MED" && getDraft().amountMinId === null && getDraft().amountMaxId === null,
  "a single-mode snapshot drops the min and max amounts",
);

check(unlockGene("FLGN"), "a mutation point unlocks a gene");
check(mutationPointCount() === STARTING_MUTATION_POINTS - 1, "unlocking spends a mutation point");
resetUnlocks();
check(unlockedGeneIds().length === 0, "a new cell starts with no unlocked genes");
resetGenomeState();
check(getGenome().length === 0 && getDraft().geneId === null, "a new cell starts with an empty genome and draft");

const hyperCassette: Cassette = {
  uid: "cost-hyper",
  name: "Cost probe",
  code: "CST1",
  promoterId: "CNST",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  geneId: "AZOH",
  routeId: null,
  siteId: null,
};
check(cassetteAtpCost(hyperCassette) === 8, "hyperexpression upkeep is 8 ATP per second");
check(cassetteMutationCost(hyperCassette) === 9, "assembly cost adds promoter, amount, and coding parts");
const rangedCassette: Cassette = {
  ...hyperCassette,
  uid: "cost-ranged",
  promoterId: "GRAD",
  amountId: null,
  amountMinId: "LOW",
  amountMaxId: "HIGH",
  routeId: "SURF",
  siteId: "LATR",
};
check(cassetteAtpCost(rangedCassette) === 2.2, "ranged upkeep averages the two amount levels and charges the tags");
check(cassetteMutationCost(rangedCassette) === 10, "ranged assembly cost includes both tags");
const bareCassette: Cassette = {
  ...hyperCassette,
  uid: "cost-bare",
  amountId: null,
};
check(cassetteAtpCost(bareCassette) === 1 && cassetteMutationCost(bareCassette) === 6, "a cassette without an amount uses the medium baseline");

if (failed > 0) {
  throw new Error(`${failed} genome editor checks failed`);
}
console.log("genome editor checks passed");
