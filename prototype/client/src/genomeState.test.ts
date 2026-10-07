import {
  amountRange,
  applySnapshot,
  behaviorLine,
  beginEditCassette,
  cassetteAtpCost,
  cassetteMutationCost,
  parseSnapshot,
  clearDraft,
  clearPart,
  draftMatchesEditing,
  draftProblems,
  editingCassette,
  illegalDraftSlots,
  geneAcceptsRoute,
  geneAcceptsSite,
  genomeAtpUpkeep,
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
  snapshot,
  unlockedGenes,
  unlockedPromoters,
  unlockedAmounts,
  unlockedTags,
  updateEditedCassette,
  regulatoryIcon,
  CYTOSOLIC_ICON,
  type Cassette,
  type Draft,
} from "./genomeState";
import { resetUnlocks, unlockGene, unlockPart, unlockedGeneIds } from "./geneUnlocks";
import { cellResources, mutationPointCount, setMutationPoints, STARTING_ATP, STARTING_MUTATION_POINTS } from "./resources";
import { applyRequirementEdges, type TechEdge } from "./techTree";

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
check(regulatoryIcon("COSL")?.endsWith("oscillatory_32x32.png") === true, "co-oscillatory reuses the oscillatory icon");
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
check(amountRange("OSCL") && amountRange("COSL") && amountRange("GRAD"), "oscillatory, co-oscillatory, and graded promoters split the amount node");
check(!amountRange("CNST") && !amountRange("COND") && !amountRange("PERS") && !amountRange("THRS"), "other promoters keep a single amount node");
check(!slotAccepts("amount-min", "CNST") && !slotAccepts("amount-max", "AZOH"), "the split amount slots reject non-amount parts");

// Ferron Permease restrictions: transmembrane destination only, no position tag.
check(geneAcceptsRoute(null, "CYTO") && geneAcceptsRoute("FLGN", "SecretoryPeptide") && !geneAcceptsRoute("FLGN", "TransmembraneSignal"), "flagellin still only takes the secreted route");
check(geneAcceptsRoute("SLFP", "TransmembraneSignal") && !geneAcceptsRoute("SLFP", "SecretoryPeptide"), "the sulfex permease only takes the transmembrane route");
check(geneAcceptsRoute("FERR", "CYTO") && !geneAcceptsRoute("FERR", "TransmembraneSignal") && !geneAcceptsRoute("FERR", "SecretoryPeptide"), "the ferron reductase only takes the cytosol destination");
check(geneAcceptsRoute("SLFR", "CYTO") && !geneAcceptsRoute("SLFR", "TransmembraneSignal") && !geneAcceptsRoute("SLFR", "SecretoryPeptide"), "the sulfex reductase only takes the cytosol destination");
check(!geneAcceptsSite("FERR") && !geneAcceptsSite("SLFR"), "the reductases refuse position tags");
check(geneAcceptsSite(null) && geneAcceptsSite("FLGN") && !geneAcceptsSite("FERP") && !geneAcceptsSite("SLFP"), "only the permeases refuse position tags");
// Anabolase and cyclin are soluble cytosolic modules with no position tag.
check(geneAcceptsRoute("ANAB", "CYTO") && !geneAcceptsRoute("ANAB", "TransmembraneSignal") && !geneAcceptsRoute("ANAB", "SecretoryPeptide"), "anabolase only takes the cytosol destination");
check(geneAcceptsRoute("CYCL", "CYTO") && !geneAcceptsRoute("CYCL", "SecretoryPeptide") && !geneAcceptsRoute("CYCL", "TransmembraneSignal"), "cyclin only takes the cytosol destination");
check(!geneAcceptsSite("ANAB") && !geneAcceptsSite("CYCL"), "anabolase and cyclin refuse position tags");
// ATP synthase works from the membrane: transmembrane only, no position tag.
check(geneAcceptsRoute("ATPS", "TransmembraneSignal") && !geneAcceptsRoute("ATPS", "CYTO") && !geneAcceptsRoute("ATPS", "SecretoryPeptide") && !geneAcceptsRoute("ATPS", "SURF"), "ATP synthase only takes the transmembrane route");
check(!geneAcceptsSite("ATPS"), "ATP synthase refuses position tags");
// Adhesin embeds in the membrane: transmembrane only, no position tag.
check(geneAcceptsRoute("ADHN", "TransmembraneSignal") && !geneAcceptsRoute("ADHN", "SURF") && !geneAcceptsRoute("ADHN", "SecretoryPeptide"), "adhesin only takes the transmembrane route");
check(!geneAcceptsSite("ADHN"), "adhesin refuses position tags");
// Cohesin works at range or anchored: secreted or membrane anchored, no position tag.
check(geneAcceptsRoute("COHS", "SecretoryPeptide") && geneAcceptsRoute("COHS", "SURF") && !geneAcceptsRoute("COHS", "CYTO") && !geneAcceptsRoute("COHS", "TransmembraneSignal"), "cohesin takes the secreted or membrane-anchored destinations");
check(!geneAcceptsSite("COHS"), "cohesin refuses position tags");
check(placePart("coding", "FERP"), "the permease places as a coding region");
check(placePart("route", "TransmembraneSignal"), "the permease takes the transmembrane destination");
check(!placePart("route", "SecretoryPeptide") && !placePart("route", "CYTO"), "the permease rejects the other destinations");
check(!placePart("site", "PolarLocalizationSignal"), "the permease rejects every position tag");
const permeaseDraft: Draft = { name: "Probe", code: "PRB1", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "FERP", routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" };
check(draftProblems(permeaseDraft).some((problem) => problem.includes("only takes the Transmembrane")), "a misrouted permease draft names the accepted destination");
check(draftProblems(permeaseDraft).some((problem) => problem.includes("cannot take a position tag")), "a position tag on the permease draft is flagged");
clearPart("coding");
clearPart("route");

// Sulfex Permease mirrors the Ferron Permease restrictions.
check(placePart("coding", "SLFP"), "the sulfex permease places as a coding region");
check(placePart("route", "TransmembraneSignal"), "the sulfex permease takes the transmembrane destination");
check(!placePart("route", "SecretoryPeptide") && !placePart("route", "CYTO"), "the sulfex permease rejects the other destinations");
check(!placePart("site", "PolarLocalizationSignal"), "the sulfex permease rejects every position tag");
const sulfexDraft: Draft = { name: "Probe", code: "PRB2", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "SLFP", routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" };
check(draftProblems(sulfexDraft).some((problem) => problem.includes("only takes the Transmembrane")), "a misrouted sulfex permease draft names the accepted destination");
check(draftProblems(sulfexDraft).some((problem) => problem.includes("cannot take a position tag")), "a position tag on the sulfex permease draft is flagged");
clearPart("coding");
clearPart("route");

// Reductases are cytosolic: cytosol destination only, no position tag.
check(placePart("coding", "FERR"), "the ferron reductase places as a coding region");
check(placePart("route", "CYTO"), "the ferron reductase takes the cytosol destination");
check(!placePart("route", "TransmembraneSignal") && !placePart("route", "SecretoryPeptide"), "the ferron reductase rejects the membrane and secreted destinations");
check(!placePart("site", "PolarLocalizationSignal"), "the ferron reductase rejects every position tag");
clearPart("coding");
clearPart("route");
check(placePart("coding", "SLFR"), "the sulfex reductase places as a coding region");
check(placePart("route", "CYTO"), "the sulfex reductase takes the cytosol destination");
check(!placePart("route", "TransmembraneSignal") && !placePart("route", "SecretoryPeptide"), "the sulfex reductase rejects the membrane and secreted destinations");
check(!placePart("site", "PolarLocalizationSignal"), "the sulfex reductase rejects every position tag");
const reductaseDraft: Draft = { name: "Probe", code: "PRB3", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "FERR", routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" };
check(draftProblems(reductaseDraft).some((problem) => problem.includes("only takes the Cytosolic")), "a misrouted reductase draft names the accepted destination");
check(draftProblems(reductaseDraft).some((problem) => problem.includes("cannot take a position tag")), "a position tag on the reductase draft is flagged");
clearPart("coding");
clearPart("route");

// Lubricin is a secreted coat: secreted destination only, no position tag.
check(geneAcceptsRoute("LUBR", "SecretoryPeptide") && !geneAcceptsRoute("LUBR", "CYTO") && !geneAcceptsRoute("LUBR", "TransmembraneSignal") && !geneAcceptsRoute("LUBR", "SURF"), "lubricin only takes the secreted route");
check(!geneAcceptsSite("LUBR"), "lubricin refuses position tags");
check(placePart("coding", "LUBR"), "lubricin places as a coding region");
check(placePart("route", "SecretoryPeptide"), "lubricin takes the secreted destination");
check(!placePart("route", "CYTO") && !placePart("route", "TransmembraneSignal") && !placePart("route", "SURF"), "lubricin rejects the other destinations");
check(!placePart("site", "PolarLocalizationSignal"), "lubricin rejects every position tag");
const lubricinDraft: Draft = { name: "Probe", code: "PRB4", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "LUBR", routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" };
check(illegalDraftSlots(lubricinDraft).join(",") === "route,site", "a coding-region change that leaves a rejected destination and position marks both nodes");
check(illegalDraftSlots({ ...lubricinDraft, routeId: "SecretoryPeptide", siteId: null }).length === 0, "a secreted lubricin with no position tag marks no node");
check(illegalDraftSlots({ ...lubricinDraft, geneId: "FLGN", routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" }).length === 0, "flagellin keeps a secreted polar tag unmarked");
check(illegalDraftSlots({ ...lubricinDraft, geneId: "BUOY", routeId: "CYTO", siteId: "PolarLocalizationSignal" }).join(",") === "site", "a position tag beside a cytosolic destination marks the position node");
check(illegalDraftSlots({ ...lubricinDraft, geneId: null, routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" }).length === 0, "no coding region leaves installed tags unmarked");
check(draftProblems(lubricinDraft).some((problem) => problem.includes("only takes the Secreted")), "a misrouted lubricin draft names the accepted destination");
check(draftProblems(lubricinDraft).some((problem) => problem.includes("cannot take a position tag")), "a position tag on the lubricin draft is flagged");
clearPart("coding");
clearPart("route");

// Cilin is a whole-cell coat: secreted destination only, no position tag.
check(geneAcceptsRoute("CILN", "SecretoryPeptide") && !geneAcceptsRoute("CILN", "CYTO") && !geneAcceptsRoute("CILN", "TransmembraneSignal"), "cilin only takes the secreted route");
check(!geneAcceptsSite("CILN"), "cilin refuses position tags");
check(placePart("coding", "CILN"), "cilin places as a coding region");
check(placePart("route", "SecretoryPeptide"), "cilin takes the secreted destination");
check(!placePart("route", "CYTO") && !placePart("route", "TransmembraneSignal"), "cilin rejects the other destinations");
check(!placePart("site", "PolarLocalizationSignal"), "cilin rejects every position tag");
const cilinDraft: Draft = { name: "Probe", code: "PRB5", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "CILN", routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" };
check(draftProblems(cilinDraft).some((problem) => problem.includes("only takes the Secreted")), "a misrouted cilin draft names the accepted destination");
check(draftProblems(cilinDraft).some((problem) => problem.includes("cannot take a position tag")), "a position tag on the cilin draft is flagged");
clearPart("coding");
clearPart("route");

// The ciliary motor protein sits in the membrane and takes any position tag.
check(geneAcceptsRoute("CILM", "TransmembraneSignal") && !geneAcceptsRoute("CILM", "SecretoryPeptide") && !geneAcceptsRoute("CILM", "CYTO"), "the ciliary motor protein only takes the transmembrane route");
check(geneAcceptsRoute("PILN", "TransmembraneSignal") && geneAcceptsRoute("PILN", "SecretoryPeptide") && !geneAcceptsRoute("PILN", "CYTO") && !geneAcceptsRoute("PILN", "SURF"), "pilin takes the transmembrane or secreted route");
check(geneAcceptsSite("PILN"), "pilin accepts a position tag");
check(geneAcceptsSite("CILM"), "the ciliary motor protein accepts position tags");
check(placePart("coding", "CILM"), "the ciliary motor protein places as a coding region");
check(placePart("route", "TransmembraneSignal"), "the ciliary motor protein takes the transmembrane destination");
check(!placePart("route", "SecretoryPeptide") && !placePart("route", "CYTO"), "the ciliary motor protein rejects the other destinations");
check(placePart("site", "PolarLocalizationSignal"), "the ciliary motor protein takes a polar position tag");
clearPart("site");
check(placePart("site", "LATR"), "the ciliary motor protein takes a lateral position tag");
clearPart("site");
const motorDraft: Draft = { name: "Probe", code: "PRB6", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "CILM", routeId: "SecretoryPeptide", siteId: null };
check(draftProblems(motorDraft).some((problem) => problem.includes("only takes the Transmembrane")), "a misrouted ciliary motor draft names the accepted destination");
check(draftProblems(motorDraft).every((problem) => !problem.includes("cannot take a position tag")), "the ciliary motor draft is free to carry position tags");
clearPart("coding");
clearPart("route");

const amountBefore = JSON.stringify(getDraft());
check(placePart("amount", "CNST") === false && JSON.stringify(getDraft()) === amountBefore, "a non-amount drop leaves the amount slot empty");

const before = JSON.stringify(getDraft());
check(placePart("promoter", "AZOH") === false, "invalid drop is rejected");
check(JSON.stringify(getDraft()) === before, "invalid drop leaves the construct unchanged");

check(placePart("promoter", "CNST"), "promoter places");
check(placePart("coding", "ATPS"), "coding region places");
check(placePart("coding", "AZOH"), "occupied coding region is replaced");
check(getDraft().geneId === "AZOH", "replacement keeps the new gene");
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
check(getDraft().promoterId === "CNST" && getDraft().geneId === "AZOH", "removing a tag keeps the other parts");

setDraftName("Nitrox scavenger");
check(getDraft().name === "Nitrox scavenger", "construct name is shared state");
check(behaviorLine().includes("Azoite Hydrolase"), "behavior summary follows the coding region");
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
check(placePart("promoter", "COSL"), "a co-oscillatory promoter places and also splits the amount node");
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

// Editing a committed construct: load it onto the bench, change it, replace it in place.
applySnapshot({
  v: 1,
  draft: { name: "Bench", code: "BEN1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "AZOH", routeId: null, siteId: null },
  genome: [
    { uid: "edit-a", name: "Scavenger A", code: "SCA1", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "AZOH", routeId: null, siteId: null },
    { uid: "edit-b", name: "Scavenger B", code: "SCB1", promoterId: "COND", amountId: "LOW", amountMinId: null, amountMaxId: null, geneId: "OXDR", routeId: null, siteId: null },
  ],
});
check(editingCassette() === null, "no construct is being edited before an edit begins");
check(beginEditCassette("edit-b"), "edit loads a committed construct");
check(getDraft().name === "Scavenger B" && getDraft().promoterId === "COND" && getDraft().geneId === "OXDR" && getDraft().amountId === "LOW", "the bench carries the edited construct's parts");
check(editingCassette()?.uid === "edit-b", "the edited construct is tracked");
check(draftMatchesEditing(), "a freshly loaded edit still matches its construct");
setDraftName("Scavenger B Prime");
check(!draftMatchesEditing(), "a changed draft no longer matches its construct");
const updated = updateEditedCassette();
check(!("problems" in updated), "a changed edit replaces its construct");
if (!("problems" in updated)) {
  check(updated.cassette.uid === "edit-b" && updated.cassette.name === "Scavenger B Prime" && updated.index === 1, "the replacement keeps the slot identity and position");
  check(getGenome()[1]?.name === "Scavenger B Prime" && getGenome().length === 2, "the edited construct is replaced in place");
}
check(editingCassette() === null, "the edit session ends after a replacement");
check(beginEditCassette("edit-a"), "a second edit loads the other construct");
clearDraft();
check(editingCassette() === null, "clearing the bench ends the edit session");
check(beginEditCassette("edit-a") && removeCassette("edit-a"), "the edited construct can still be deleted");
check(editingCassette() === null, "deleting the edited construct ends the edit session");
check(getGenome().length === 1 && getGenome()[0]?.uid === "edit-b", "removal only deletes the edited construct");
check(beginEditCassette("edit-b"), "an edit resumes after a removal");
applySnapshot(snapshot());
check(editingCassette()?.uid === "edit-b" && draftMatchesEditing(), "an edit session survives a snapshot round-trip");
check(!beginEditCassette("missing"), "an unknown construct cannot be edited");

setMutationPoints(STARTING_MUTATION_POINTS);
check(unlockGene("FLGN"), "a mutation point unlocks a gene");
check(mutationPointCount() === STARTING_MUTATION_POINTS - 1, "unlocking spends a mutation point");
resetUnlocks();
check(unlockedGeneIds().length === 0, "a new cell starts with no purchased gene unlocks (defaults are not purchases)");
resetGenomeState();
check(getGenome().length === 0 && getDraft().geneId === null, "a new cell starts with an empty genome and draft");

// Motility genes gate on flagellin being unlocked, never on it being in the genome.
setMutationPoints(10);
const motilityEdges: TechEdge[] = [
  { from: "FLGN", to: "CILN", kind: "required" },
  { from: "FLGN", to: "CILM", kind: "required" },
  { from: "FLGN", to: "PILN", kind: "required" },
];
applyRequirementEdges(motilityEdges);
const cilinOnlyDraft: Draft = { name: "Probe", code: "PRB7", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "CILN", routeId: "SecretoryPeptide", siteId: null };
check(draftProblems(cilinOnlyDraft).some((problem) => problem.includes("Requires Flagellin")), "a locked flagellin gates cilin");
check(!unlockedGenes().some((part) => part.id === "CILN"), "the palette hides cilin while flagellin is locked");
check(unlockGene("FLGN"), "flagellin unlocks after a reset");
check(unlockGene("CILN") && unlockGene("CILM") && unlockGene("PILN"), "the motility genes unlock once flagellin is unlocked");
check(getGenome().length === 0, "unlocking the motility genes never touches the genome");
check(draftProblems(cilinOnlyDraft).length === 0, "an unlocked flagellin fully clears the cilin gate");
check(unlockedGenes().some((part) => part.id === "PILN"), "the palette lists pilin once flagellin is unlocked");

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

// Upkeep is charged at runtime, so the scale carries the new-cell economy.
const offCassette: Cassette = { ...hyperCassette, uid: "cost-off", amountId: "OFF" };
check(cassetteAtpCost(offCassette) === 0, "a silenced cassette spends nothing, as its tile promises");
const microCassette: Cassette = { ...hyperCassette, uid: "cost-micro", amountId: "MICRO" };
check(cassetteAtpCost(microCassette) === 0.2, "microexpression upkeep is 0.2 ATP per second");
check(genomeAtpUpkeep([]) === 0, "an empty genome has no upkeep");
check(genomeAtpUpkeep([hyperCassette, hyperCassette]) === 16, "upkeep sums across constructs");
// Calibration: the starter metabolizer - one transmembrane permease and one
// cytosolic reductase at medium - runs a new cell's starting ATP dry in
// about five minutes when nothing refills it.
const starterPermease: Cassette = { ...hyperCassette, uid: "cal-permease", amountId: "MED", routeId: "TransmembraneSignal" };
const starterReductase: Cassette = { ...hyperCassette, uid: "cal-reductase", amountId: "MED", routeId: "CYTO" };
const dryMinutes = STARTING_ATP / genomeAtpUpkeep([starterPermease, starterReductase]) / 60;
check(dryMinutes > 4.5 && dryMinutes < 6.5, `the starter metabolizer runs dry in about five minutes (${dryMinutes.toFixed(1)})`);
check(cellResources().find((resource) => resource.id === "atp")?.amount === STARTING_ATP, "a new cell starts with 1000 ATP");

if (failed > 0) {
  throw new Error(`${failed} genome editor checks failed`);
}
console.log("genome editor checks passed");
