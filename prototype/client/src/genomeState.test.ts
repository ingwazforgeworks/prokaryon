import {
  applySnapshot,
  behaviorLine,
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
  unlockedTags,
  regulatoryIcon,
  CYTOSOLIC_ICON,
} from "./genomeState";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

resetGenomeState();
check(getGenome().length === 0, "genome starts with only genes made in the editor");
setCatalogGenesPopulated(true);
const full = getGenome().length;
check(full > 4, "populate genes fills the catalog");
check(unlockedGenes().some((gene) => gene.id === "AZOH"), "unlocked tray includes catalog genes");
const promoterIcons = unlockedPromoters().map((part) => part.icon);
const tagIcons = unlockedTags().map((part) => part.icon);
check(new Set([...promoterIcons, ...tagIcons]).size === promoterIcons.length + tagIcons.length, "each regulatory type has its own icon");
check(promoterIcons.every((icon) => icon.includes("/regulatory_icons/")), "promoter cards use regulatory icons");
check(tagIcons.every((icon) => icon.includes("/new_regulatory_icons/")), "tag cards use the unified localization icons");
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
check(unlockedTags().some((part) => part.id === "SURF" && part.kind === "tag"), "membrane anchored is a localization tag");
check(unlockedTags("route").map((part) => part.id).join(",") === "CYTO,SecretoryPeptide,TransmembraneSignal,SURF", "destination tab lists cytosolic, secreted, transmembrane, and membrane anchored");
check(unlockedTags("site").map((part) => part.id).join(",") === "PolarLocalizationSignal,AntiPolarLocalizationSignal,BIPO,ANTL,BILT,LATR", "position tab lists the body-site tags");
check(unlockedTags().some((part) => part.id === "ANTL"), "antilateral is a localization tag");
check(unlockedTags().some((part) => part.id === "LATR"), "lateral is a localization tag");
check(unlockedTags().some((part) => part.id === "BILT"), "bilateral is a localization tag");
check(unlockedTags().some((part) => part.id === "BIPO" && part.kind === "tag"), "bipolar is a localization tag");
check(!unlockedPromoters().some((part) => part.id === "SURF" || part.id === "ANTL" || part.id === "LATR" || part.id === "BILT" || part.id === "BIPO"), "placement marks are not promoters");
check(regulatoryIcon("SecretoryPeptide")?.endsWith("secreted_32x32.png") === true, "secreted icon");
check(scalarResponse("CNST") === null, "constitutive promoter has no scalar curve");
check(scalarResponse("COND") === null, "conditional promoter has no scalar curve");
check(!slotAccepts("promoter", "AZOH"), "a gene is not a promoter");
check(!slotAccepts("coding", "CNST"), "a promoter is not a coding region");
check(!slotAccepts("route", "CNST"), "a promoter is not a destination tag");
check(!slotAccepts("site", "SecretoryPeptide"), "a destination tag is not a position");

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
  draft: { name: "Kept", code: "kept", promoterId: "COND", geneId: "AZOH", routeId: null, siteId: null },
  genome: [
    { uid: "a", name: "ATP Synthase", code: "ATPS", promoterId: "CNST", geneId: "ATPS", routeId: null, siteId: null },
  ],
});
check(getDraft().name === "Kept" && getDraft().promoterId === "COND", "snapshot restores the draft");
check(getGenome().length === 1, "snapshot replaces the genome");
check(unlockedGenes().some((gene) => gene.id === "OXDR"), "ATPS unlocks Oxidex Reductase");
check(!unlockedGenes().some((gene) => gene.id === "GLYS"), "Glycon Synthase stays locked without its requirements");
check(placePart("coding", "GLYS"), "a locked gene can still be placed for inspection");
check(draftProblems().some((problem) => problem.includes("Carbex")), "add explains the missing requirement");
check("problems" in insertDraft(), "missing requirements block insertion");

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

if (failed > 0) {
  throw new Error(`${failed} genome editor checks failed`);
}
console.log("genome editor checks passed");
