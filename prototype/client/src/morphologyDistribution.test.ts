import type { FlagellinConstruct } from "./flagellinDistribution";
import {
  cytosolicMorphologyLevel,
  genomeCanDriveCytosolicMorphology,
  genomeCanDriveSecretedMorphology,
  genomeCanDriveTaperin,
  secretedMorphologyLevel,
  taperinBySite,
  taperinCellTaper,
} from "./morphologyDistribution";
import { TAPER_ALL, TAPER_ANTILATERAL, TAPER_ANTIPOLAR, TAPER_LATERAL, TAPER_POLAR } from "./shape";
import {
  applySnapshot,
  draftProblems,
  geneAcceptsCytosolicSite,
  geneAcceptsRoute,
  geneAcceptsSite,
  getDraft,
  getGenome,
  illegalDraftSlots,
  parseSnapshot,
  placePart,
  resetGenomeState,
  setDraftCode,
  setDraftName,
  slotAccepts,
} from "./genomeState";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "ELGN",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "CYTO",
  siteId: null,
  ...overrides,
});

// --- Cytosolic shape genes: Elongin, Girthin, Crescentin ---

check(cytosolicMorphologyLevel([], "ELGN") === 0, "no constructs express no elongin");
check(cytosolicMorphologyLevel([construct()], "ELGN") === 1, "a hyperexpressed cytosolic elongin reads full");
check(cytosolicMorphologyLevel([construct({ routeId: null })], "ELGN") === 1, "an untagged elongin is cytosolic and counts");
check(cytosolicMorphologyLevel([construct({ routeId: "SecretoryPeptide" })], "ELGN") === 0, "a secreted elongin does nothing");
check(cytosolicMorphologyLevel([construct({ routeId: "TransmembraneSignal" })], "ELGN") === 0, "a membrane-routed elongin does nothing");
check(cytosolicMorphologyLevel([construct({ routeId: "SURF" })], "ELGN") === 0, "a surface-anchored elongin does nothing");
check(cytosolicMorphologyLevel([construct({ promoterId: "GRAD" })], "ELGN") === 0, "unsimulated promoters produce no elongin yet");
check(cytosolicMorphologyLevel([construct({ amountId: "MICRO" })], "ELGN") === 0.1, "microexpression scales the elongin level");
check(
  cytosolicMorphologyLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })], "ELGN") === 1,
  "two half-strength elongin constructs clamp at full",
);
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" };
check(cytosolicMorphologyLevel([construct(swing)], "ELGN", 0) === 0.1, "an oscillatory elongin rests at its minimum at t=0");
check(cytosolicMorphologyLevel([construct(swing)], "ELGN", 2) === 1, "an oscillatory elongin peaks at its maximum at the half period");

check(cytosolicMorphologyLevel([construct({ geneId: "GRTN" })], "GRTN") === 1, "a hyperexpressed cytosolic girthin reads full");
check(cytosolicMorphologyLevel([construct({ geneId: "CRST" })], "CRST") === 1, "a hyperexpressed cytosolic crescentin reads full");
check(cytosolicMorphologyLevel([construct({ geneId: "GRTN" })], "ELGN") === 0, "girthin constructs do not count as elongin");
check(cytosolicMorphologyLevel([construct({ geneId: "CRST", routeId: "SecretoryPeptide" })], "CRST") === 0, "a secreted crescentin does nothing");

check(genomeCanDriveCytosolicMorphology([], "ELGN") === false, "an empty genome cannot drive elongin");
check(genomeCanDriveCytosolicMorphology([construct()], "ELGN") === true, "a cytosolic elongin construct drives elongation");
check(genomeCanDriveCytosolicMorphology([construct({ routeId: null })], "ELGN") === true, "an untagged elongin construct still drives elongation");
check(genomeCanDriveCytosolicMorphology([construct({ routeId: "TransmembraneSignal" })], "ELGN") === false, "a membrane-routed elongin cannot drive elongation");
check(genomeCanDriveCytosolicMorphology([construct({ promoterId: "GRAD" })], "ELGN") === false, "an unsimulated promoter cannot drive elongation");
check(
  genomeCanDriveCytosolicMorphology([construct(swing)], "ELGN") === true,
  "an oscillatory elongin keeps driving elongation even at its trough",
);

// --- Secreted membrane builders: Crystallin, Isoprene Synthase ---

const secreted = (geneId: string, overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct =>
  construct({ geneId, routeId: "SecretoryPeptide", ...overrides });

check(secretedMorphologyLevel([], "CRYS") === 0, "no constructs express no crystallin");
check(secretedMorphologyLevel([secreted("CRYS")], "CRYS") === 1, "a hyperexpressed secreted crystallin reads full");
check(secretedMorphologyLevel([secreted("CRYS", { routeId: "CYTO" })], "CRYS") === 0, "a cytosolic crystallin never reaches the envelope");
check(secretedMorphologyLevel([secreted("CRYS", { routeId: null })], "CRYS") === 0, "an untagged crystallin is not secreted and does nothing");
check(secretedMorphologyLevel([secreted("CRYS", { amountId: "MICRO" })], "CRYS") === 0.1, "microexpression scales the crystallin level");
check(secretedMorphologyLevel([secreted("ISPR")], "ISPR") === 1, "a hyperexpressed secreted isoprene synthase reads full");
check(secretedMorphologyLevel([secreted("ISPR", { routeId: "CYTO" })], "ISPR") === 0, "a cytosolic isoprene synthase does nothing");

check(genomeCanDriveSecretedMorphology([], "CRYS") === false, "an empty genome cannot drive the membrane structure");
check(genomeCanDriveSecretedMorphology([secreted("CRYS")], "CRYS") === true, "a secreted crystallin construct drives the membrane");
check(genomeCanDriveSecretedMorphology([secreted("CRYS", { routeId: null })], "CRYS") === false, "an untagged crystallin construct cannot drive the membrane");
check(genomeCanDriveSecretedMorphology([secreted("ISPR")], "ISPR") === true, "a secreted isoprene synthase construct drives the membrane");
check(
  genomeCanDriveSecretedMorphology([secreted("ISPR", { promoterId: "OSCL", amountId: null, amountMinId: "OFF", amountMaxId: "HYPER" })], "ISPR") === true,
  "an oscillatory isoprene synthase keeps driving the membrane even at its trough",
);

// --- Taperin: cytosolic, positionally tagged ---

const spread = taperinBySite([]);
check(spread.polar === 0 && spread.antipolar === 0 && spread.lateral === 0 && spread.antilateral === 0, "no constructs taper nothing");

const untagged = taperinBySite([construct({ geneId: "TPRN" })]);
check(untagged.polar === 0.25 && untagged.antipolar === 0.25 && untagged.lateral === 0.25 && untagged.antilateral === 0.25, "untagged taperin spreads a quarter strength per end");
const noRoute = taperinBySite([construct({ geneId: "TPRN", routeId: null })]);
check(noRoute.polar === 0.25, "an untagged taperin construct is cytosolic and spreads too");

const polar = taperinBySite([construct({ geneId: "TPRN", siteId: "PolarLocalizationSignal" })]);
check(polar.polar === 1 && polar.antipolar === 0 && polar.lateral === 0 && polar.antilateral === 0, "a polar-tagged taperin gathers at the pole alone");
const bipolar = taperinBySite([construct({ geneId: "TPRN", siteId: "BIPO" })]);
check(bipolar.polar === 0.5 && bipolar.antipolar === 0.5 && bipolar.lateral === 0, "a bipolar taperin splits across the two poles");
const wrongRoute = taperinBySite([construct({ geneId: "TPRN", routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" })]);
check(wrongRoute.polar === 0, "a membrane-routed taperin never folds into the scaffold");
const otherGene = taperinBySite([construct({ geneId: "ELGN", siteId: "PolarLocalizationSignal" })]);
check(otherGene.polar === 0, "elongin constructs do not count as taperin");

const noneTaper = taperinCellTaper([]);
check(noneTaper.mask === 0 && noneTaper.polar === 0 && noneTaper.antilateral === 0, "no taperin means no taper mask and no degrees");
const polarTaper = taperinCellTaper([construct({ geneId: "TPRN", siteId: "PolarLocalizationSignal" })]);
check(polarTaper.mask === TAPER_POLAR && polarTaper.polar === 1 && polarTaper.antipolar === 0, "a polar-tagged taperin sets only the polar bit at full degree");
const allTaper = taperinCellTaper([construct({ geneId: "TPRN" })]);
check(allTaper.mask === TAPER_ALL, "untagged taperin tapers every end");
check(allTaper.polar === 0.25 && allTaper.lateral === 0.25, "untagged taperin thins the whole body at a quarter strength per end");
const lateralTaper = taperinCellTaper([construct({ geneId: "TPRN", siteId: "LATR", amountId: "MICRO" })]);
check(lateralTaper.mask === TAPER_LATERAL && lateralTaper.lateral === 0.1, "a lateral microexpressed taperin pinches one side thinly");
const antilateralTaper = taperinCellTaper([construct({ geneId: "TPRN", siteId: "ANTL" })]);
check(antilateralTaper.mask === TAPER_ANTILATERAL, "an antilateral tag sets the antilateral bit");
const antipolarTaper = taperinCellTaper([construct({ geneId: "TPRN", siteId: "AntiPolarLocalizationSignal" })]);
check(antipolarTaper.mask === TAPER_ANTIPOLAR, "an antipolar tag sets the antipolar bit");

check(genomeCanDriveTaperin([]) === false, "an empty genome cannot drive the taper");
check(genomeCanDriveTaperin([construct({ geneId: "TPRN", siteId: "PolarLocalizationSignal" })]) === true, "a cytosolic tagged taperin drives the taper");
check(genomeCanDriveTaperin([construct({ geneId: "TPRN", routeId: null })]) === true, "an untagged taperin construct still drives the taper");
check(genomeCanDriveTaperin([construct({ geneId: "TPRN", routeId: "TransmembraneSignal" })]) === false, "a membrane-routed taperin cannot drive the taper");
check(genomeCanDriveTaperin([construct({ geneId: "TPRN", promoterId: "GRAD" })]) === false, "an unsimulated promoter cannot drive the taper");

if (failed > 0) throw new Error(`${failed} morphology distribution checks failed`);
console.log("morphology distribution checks passed");

// --- Editor rules: routes, position tags, cytosolic taperin ---

for (const geneId of ["ELGN", "GRTN", "CRST", "TPRN"]) {
  check(geneAcceptsRoute(geneId, "CYTO"), `${geneId} accepts the cytosol route`);
  check(!geneAcceptsRoute(geneId, "SecretoryPeptide"), `${geneId} rejects the secreted route`);
  check(!geneAcceptsRoute(geneId, "TransmembraneSignal"), `${geneId} rejects the transmembrane route`);
  check(!geneAcceptsRoute(geneId, "SURF"), `${geneId} rejects the surface route`);
}
for (const geneId of ["CRYS", "ISPR"]) {
  check(geneAcceptsRoute(geneId, "SecretoryPeptide"), `${geneId} accepts the secreted route`);
  check(!geneAcceptsRoute(geneId, "CYTO"), `${geneId} rejects the cytosol route`);
  check(!geneAcceptsRoute(geneId, "TransmembraneSignal"), `${geneId} rejects the transmembrane route`);
  check(!geneAcceptsRoute(geneId, "SURF"), `${geneId} rejects the surface route`);
}

for (const geneId of ["ELGN", "GRTN", "CRST", "CRYS", "ISPR"]) {
  check(!geneAcceptsSite(geneId), `${geneId} cannot take a position tag`);
}
check(geneAcceptsSite("TPRN"), "taperin can take a position tag");
check(geneAcceptsCytosolicSite("TPRN"), "taperin's cytosolic copies take a position tag");
check(!geneAcceptsCytosolicSite("ELGN"), "elongin's cytosolic copies take no position tag");
check(!geneAcceptsCytosolicSite(null), "an empty coding region has no cytosolic site rule");

resetGenomeState();
setDraftName("Taper bench");
setDraftCode("TPR1");
check(placePart("promoter", "CNST"), "the promoter places");
check(placePart("coding", "TPRN"), "taperin places in the coding region");
check(slotAccepts("site", "PolarLocalizationSignal"), "taperin takes a position tag with no route placed yet");
check(placePart("site", "PolarLocalizationSignal"), "the polar tag places on taperin");
check(placePart("route", "CYTO"), "the cytosol route places on taperin");
check(getDraft().siteId === "PolarLocalizationSignal", "placing the cytosol route afterwards keeps taperin's position tag");
check(illegalDraftSlots().length === 0, "a tagged cytosolic taperin draft breaks no slot rule");
check(draftProblems().length === 0, "a tagged cytosolic taperin draft has no problems");

resetGenomeState();
setDraftName("Elongin bench");
placePart("promoter", "CNST");
placePart("coding", "ELGN");
check(!slotAccepts("site", "PolarLocalizationSignal"), "elongin takes no position tag at all");
check(placePart("site", "PolarLocalizationSignal") === false, "the polar tag refuses to place on elongin");
check(placePart("route", "SecretoryPeptide") === false, "elongin rejects the secreted route");
check(placePart("route", "CYTO"), "elongin accepts the cytosol route");

// Persisted drafts and cassettes load through parseSnapshot, which sanitizes
// every cassette: a cytosolic position tag survives only for taperin.
applySnapshot({
  v: 1,
  draft: { name: "Stripped", code: "STR1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "ELGN", routeId: "CYTO", siteId: "LATR" },
  genome: [],
});
check(getDraft().siteId === null, "a snapshot strips the position tag from a cytosolic elongin draft");
applySnapshot({
  v: 1,
  draft: { name: "Kept", code: "KEP1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "TPRN", routeId: "CYTO", siteId: "LATR" },
  genome: [],
});
check(getDraft().siteId === "LATR", "a snapshot keeps the position tag on a cytosolic taperin draft");

const parsed = parseSnapshot({
  v: 1,
  draft: { name: "Bench", code: "BEN1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "ELGN", routeId: "CYTO", siteId: null },
  genome: [
    { uid: "tp", name: "Taper", code: "TPR1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "TPRN", routeId: "CYTO", siteId: "BIPO" },
    { uid: "el", name: "Long", code: "ELG1", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "ELGN", routeId: "CYTO", siteId: "BIPO" },
  ],
});
check(parsed !== null, "the persisted genome parses");
if (parsed) applySnapshot(parsed);
check(getGenome().find((cassette) => cassette.uid === "tp")?.siteId === "BIPO", "a persisted cytosolic taperin cassette keeps its position tag");
check(getGenome().find((cassette) => cassette.uid === "el")?.siteId === null, "a persisted cytosolic elongin cassette loses its position tag");

if (failed > 0) throw new Error(`${failed} morphology editor checks failed`);
console.log("morphology editor checks passed");