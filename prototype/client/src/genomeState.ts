import { GENES, type GeneRecord } from "./genes";
import { isGeneUnlocked, isPartUnlocked } from "./geneUnlocks";
import { missingGeneRequirements } from "./techTree";

const REGULATORY_ICON_DIR = "/ui/genome_viewer/regulatory_icons";
const TAG_ICON_DIR = "/ui/genome_viewer/localization_icons";
const NAME_LIMIT = 48;

const REGULATORY_ICONS: Record<string, string> = {
  CNST: `${REGULATORY_ICON_DIR}/constitutive_32x32.png`,
  COND: `${REGULATORY_ICON_DIR}/conditional_32x32.png`,
  COSL: `${REGULATORY_ICON_DIR}/oscillatory_32x32.png`,
  GRAD: `${REGULATORY_ICON_DIR}/graded_32x32.png`,
  OSCL: `${REGULATORY_ICON_DIR}/oscillatory_32x32.png`,
  PERS: `${REGULATORY_ICON_DIR}/persistence_gated_32x32.png`,
  SURF: `${TAG_ICON_DIR}/membrane_anchored_32x32.png`,
  THRS: `${REGULATORY_ICON_DIR}/threshold_32x32.png`,
  OFF: `${REGULATORY_ICON_DIR}/off_32x32.png`,
  MICRO: `${REGULATORY_ICON_DIR}/microexpression_32x32.png`,
  LOW: `${REGULATORY_ICON_DIR}/low_expression_32x32.png`,
  MED: `${REGULATORY_ICON_DIR}/medium_expression_32x32.png`,
  HIGH: `${REGULATORY_ICON_DIR}/high_expression_32x32.png`,
  OVER: `${REGULATORY_ICON_DIR}/overexpression_32x32.png`,
  HYPER: `${REGULATORY_ICON_DIR}/hyperexpression_32x32.png`,
  ANTL: `${TAG_ICON_DIR}/antilateral_32x32.png`,
  BILT: `${TAG_ICON_DIR}/bilateral_32x32.png`,
  BIPO: `${TAG_ICON_DIR}/bipolar_32x32.png`,
  LATR: `${TAG_ICON_DIR}/lateral_32x32.png`,
  CYTO: `${TAG_ICON_DIR}/cytosolic_32x32.png`,
  SecretoryPeptide: `${TAG_ICON_DIR}/secreted_32x32.png`,
  TransmembraneSignal: `${TAG_ICON_DIR}/transmembrane_32x32.png`,
  PolarLocalizationSignal: `${TAG_ICON_DIR}/polar_32x32.png`,
  AntiPolarLocalizationSignal: `${TAG_ICON_DIR}/antipolar_32x32.png`,
};

/** No localization tag leaves the protein in the cytosol. */
export const CYTOSOLIC_ICON = `${TAG_ICON_DIR}/cytosolic_32x32.png`;

export function regulatoryIcon(id: string | null): string | null {
  if (id === null) return CYTOSOLIC_ICON;
  return REGULATORY_ICONS[id] ?? null;
}

export type PartKind = "promoter" | "amount" | "gene" | "tag";
export type TagRole = "route" | "site";
export type Slot = "promoter" | "amount" | "amount-min" | "amount-max" | "coding" | "route" | "site";

export type PromoterRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  activation: string;
  /** Ranged promoters vary between a minimum and a maximum amount. */
  amountMode?: "range";
};

export type AmountRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  /** Rank on the six-step expression ladder, 1 (micro) through 6 (over). */
  level: number;
};

export type TagRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  destination: string;
};

export type CatalogPart = {
  id: string;
  kind: PartKind;
  name: string;
  summary: string;
  description: string;
  icon: string;
};

export type ScalarResponse = {
  input: string;
  samples: number[];
};

export type Draft = {
  name: string;
  code: string;
  promoterId: string | null;
  amountId: string | null;
  amountMinId: string | null;
  amountMaxId: string | null;
  geneId: string | null;
  routeId: string | null;
  siteId: string | null;
};

export type Cassette = {
  uid: string;
  name: string;
  code: string;
  promoterId: string;
  amountId: string | null;
  amountMinId: string | null;
  amountMaxId: string | null;
  geneId: string;
  routeId: string | null;
  siteId: string | null;
};

export type GenomeSnapshot = {
  v: 1;
  draft: Draft;
  genome: Cassette[];
};

export type GenomeNotice = {
  inserted: number | null;
};

const PROMOTERS: PromoterRecord[] = [
  {
    id: "CNST",
    name: "Always On",
    summary: "Always active",
    description: "Drives downstream genes at a fixed strength, all the time. This is the starter promoter, and it works before the cell has any receptor.",
    activation: "Always active",
  },
  {
    id: "COND",
    name: "Conditional",
    summary: "Receptor condition",
    description: "Drives downstream genes when a condition on receptor inputs is met. A condition can only read a quantity some receptor in the genome actually measures.",
    activation: "When a receptor condition is met",
  },
  {
    id: "GRAD",
    name: "Graded",
    summary: "Rises with input",
    description: "Expression strength follows the input instead of switching fully on or off. The slope is not parameterized yet.",
    activation: "Rises with the input",
    amountMode: "range",
  },
  {
    id: "OSCL",
    name: "Oscillatory",
    summary: "Cycles on and off",
    description: "Expression sweeps smoothly between the minimum and maximum amounts in a repeating cycle of about four seconds.",
    activation: "Cycles on and off",
    amountMode: "range",
  },
  {
    id: "COSL",
    name: "Co-oscillatory",
    summary: "Cycles opposite Oscillatory",
    description: "Expression sweeps between the minimum and maximum amounts on the same cycle as the oscillatory promoter, but perfectly out of phase: it rests at its maximum while oscillatory sits at its trough.",
    activation: "Cycles opposite the oscillatory clock",
    amountMode: "range",
  },
  {
    id: "THRS",
    name: "Threshold",
    summary: "On past a level",
    description: "Expression stays off until an input passes a level, then switches on. The level is not parameterized yet.",
    activation: "On once an input passes a level",
  },
];

const AMOUNTS: AmountRecord[] = [
  {
    id: "OFF",
    name: "No expression",
    summary: "Silent gene",
    description: "Produces no protein at all. Keeps the gene in the genome without spending anything on it.",
    level: 0,
  },
  {
    id: "MICRO",
    name: "Microexpression",
    summary: "Trace output",
    description: "Produces only a trace of protein, just above the detection threshold. Good for genes where even a little does the job.",
    level: 1,
  },
  {
    id: "LOW",
    name: "Low expression",
    summary: "Light output",
    description: "Produces a small, steady stream of protein. Light on the cell's resources.",
    level: 2,
  },
  {
    id: "MED",
    name: "Medium expression",
    summary: "Balanced output",
    description: "Produces a moderate amount of protein. The balanced choice for most genes.",
    level: 3,
  },
  {
    id: "HIGH",
    name: "High expression",
    summary: "Strong output",
    description: "Produces a large amount of protein. Strong output with a real cost to the cell.",
    level: 4,
  },
  {
    id: "OVER",
    name: "Overexpression",
    summary: "Above-normal output",
    description: "Produces more protein than the cell normally uses. Heavy output that strains growth.",
    level: 5,
  },
  {
    id: "HYPER",
    name: "Hyperexpression",
    summary: "Maximum output",
    description: "Produces protein as fast as the cell can manage. The strongest setting available.",
    level: 6,
  },
];

const TAGS: TagRecord[] = [
  {
    id: "CYTO",
    name: "Cytosolic",
    summary: "Stays inside",
    description: "Leaves the protein in the cytosol.",
    destination: "Cytosol",
  },
  {
    id: "SecretoryPeptide",
    name: "Secreted",
    summary: "Released outside",
    description: "Sends the protein out of the cell. It works at range and does not come back.",
    destination: "Extracellular",
  },
  {
    id: "TransmembraneSignal",
    name: "Transmembrane",
    summary: "Anchored in membrane",
    description: "Embeds the protein in the membrane, active side facing out, so it stays with the cell.",
    destination: "Membrane",
  },
  {
    id: "PolarLocalizationSignal",
    name: "Polar",
    summary: "One cell pole",
    description: "Concentrates the protein at one pole instead of distributing it around the envelope.",
    destination: "Polar",
  },
  {
    id: "AntiPolarLocalizationSignal",
    name: "Antipolar",
    summary: "Opposite pole",
    description: "Concentrates the protein at the opposite pole from the polar signal.",
    destination: "Antipolar",
  },
  {
    id: "BIPO",
    name: "Bipolar",
    summary: "Both poles",
    description: "Concentrates the protein at both poles at the same time.",
    destination: "Bipolar",
  },
  {
    id: "SURF",
    name: "Membrane anchored",
    summary: "Held in the membrane",
    description: "Anchors the protein in the membrane so it stays with the cell.",
    destination: "Membrane anchored",
  },
  {
    id: "ANTL",
    name: "Antilateral",
    summary: "The other side",
    description: "Places the protein along the opposite side from the lateral signal.",
    destination: "Antilateral",
  },
  {
    id: "BILT",
    name: "Bilateral",
    summary: "Both sides",
    description: "Places the protein along both sides of the cell at the same time.",
    destination: "Bilateral",
  },
  {
    id: "LATR",
    name: "Lateral",
    summary: "One side",
    description: "Places the protein along one side of the cell rather than at a pole.",
    destination: "Lateral",
  },
];

const genesById = new Map(GENES.map((gene) => [gene.id, gene]));
const promotersById = new Map(PROMOTERS.map((promoter) => [promoter.id, promoter]));
const amountsById = new Map(AMOUNTS.map((amount) => [amount.id, amount]));
const tagsById = new Map(TAGS.map((tag) => [tag.id, tag]));

const CATALOG_PLACEMENTS: Record<string, { routeId: string | null; siteId: string | null }> = {
  GFP: { routeId: "CYTO", siteId: null },
  ANAB: { routeId: "CYTO", siteId: null },
  CYCL: { routeId: "CYTO", siteId: null },
  GLYP: { routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" },
  NITP: { routeId: "SecretoryPeptide", siteId: "AntiPolarLocalizationSignal" },
  OXDP: { routeId: "SecretoryPeptide", siteId: "BIPO" },
  LIPP: { routeId: "SecretoryPeptide", siteId: "LATR" },
  SLFP: { routeId: "TransmembraneSignal", siteId: null },
  CBXP: { routeId: "SecretoryPeptide", siteId: "BILT" },
  ATPS: { routeId: "TransmembraneSignal", siteId: null },
  ADHN: { routeId: "TransmembraneSignal", siteId: null },
  AQUP: { routeId: "SURF", siteId: "PolarLocalizationSignal" },
  PPMP: { routeId: "SURF", siteId: "AntiPolarLocalizationSignal" },
  PHOR: { routeId: "SURF", siteId: "BIPO" },
  SIDP: { routeId: "SURF", siteId: "LATR" },
  CRTS: { routeId: "SURF", siteId: "ANTL" },
  BFP: { routeId: "SURF", siteId: "BILT" },
  FLGN: { routeId: null, siteId: "PolarLocalizationSignal" },
  FLGM: { routeId: "TransmembraneSignal", siteId: null },
  PILN: { routeId: "TransmembraneSignal", siteId: "AntiPolarLocalizationSignal" },
  CHMR: { routeId: null, siteId: "BIPO" },
  CHLS: { routeId: null, siteId: "LATR" },
  FERP: { routeId: "TransmembraneSignal", siteId: null },
  FERR: { routeId: "CYTO", siteId: null },
  SLFR: { routeId: "CYTO", siteId: null },
  BUOY: { routeId: "CYTO", siteId: null },
  BALA: { routeId: "CYTO", siteId: null },
  LUBR: { routeId: "SecretoryPeptide", siteId: null },
  CILN: { routeId: "SecretoryPeptide", siteId: null },
  ELGN: { routeId: "CYTO", siteId: null },
  GRTN: { routeId: "CYTO", siteId: null },
  CRST: { routeId: "CYTO", siteId: null },
  CRYS: { routeId: "SecretoryPeptide", siteId: null },
  ISPR: { routeId: "SecretoryPeptide", siteId: null },
  TPRN: { routeId: "CYTO", siteId: "PolarLocalizationSignal" },
  CILM: { routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" },
  FRMP: { routeId: null, siteId: "BILT" },
};

let draft: Draft = emptyDraft();
let genome: Cassette[] = [];
let insertion = 0;
let editingUid: string | null = null;
let catalogPopulated = false;
const draftListeners = new Set<() => void>();
const genomeListeners = new Set<(notice: GenomeNotice) => void>();

export function geneById(id: string): GeneRecord | undefined {
  return genesById.get(id);
}

export function promoterById(id: string): PromoterRecord | undefined {
  return promotersById.get(id);
}

export function amountById(id: string): AmountRecord | undefined {
  return amountsById.get(id);
}

export function tagById(id: string): TagRecord | undefined {
  return tagsById.get(id);
}

export function getDraft(): Draft {
  return { ...draft };
}

export function getGenome(): readonly Cassette[] {
  return genome;
}

export function getInsertionIndex(): number {
  return insertion;
}

export function subscribeDraft(listener: () => void): () => void {
  draftListeners.add(listener);
  return () => draftListeners.delete(listener);
}

export function subscribeGenome(listener: (notice: GenomeNotice) => void): () => void {
  genomeListeners.add(listener);
  return () => genomeListeners.delete(listener);
}

export function partKind(id: string): PartKind | null {
  if (promotersById.has(id)) return "promoter";
  if (amountsById.has(id)) return "amount";
  if (genesById.has(id)) return "gene";
  if (tagsById.has(id)) return "tag";
  return null;
}

export function tagRole(id: string): TagRole | null {
  if (id === "CYTO" || id === "SecretoryPeptide" || id === "TransmembraneSignal" || id === "SURF") return "route";
  if (id === "PolarLocalizationSignal" || id === "AntiPolarLocalizationSignal" || id === "BIPO" || id === "LATR" || id === "ANTL" || id === "BILT") return "site";
  return null;
}

/** Genes whose protein only works through one specific destination route. */
const GENE_ROUTES: Record<string, string[]> = {
  ANAB: ["CYTO"],
  CYCL: ["CYTO"],
  ATPS: ["TransmembraneSignal"],
  ADHN: ["TransmembraneSignal"],
  COHS: ["SecretoryPeptide", "SURF"],
  FLGN: ["SecretoryPeptide"],
  FLGM: ["TransmembraneSignal"],
  FERP: ["TransmembraneSignal"],
  SLFP: ["TransmembraneSignal"],
  FERR: ["CYTO"],
  SLFR: ["CYTO"],
  BUOY: ["CYTO"],
  BALA: ["CYTO"],
  ELGN: ["CYTO"],
  GRTN: ["CYTO"],
  CRST: ["CYTO"],
  TPRN: ["CYTO"],
  CILN: ["SecretoryPeptide"],
  LUBR: ["SecretoryPeptide"],
  CRYS: ["SecretoryPeptide"],
  ISPR: ["SecretoryPeptide"],
  CILM: ["TransmembraneSignal"],
  PILN: ["TransmembraneSignal", "SecretoryPeptide"],
};

/** Genes that cannot carry a position tag. Genes left out take any position. */
const GENE_SITES: Record<string, string[]> = {
  ANAB: [],
  CYCL: [],
  ATPS: [],
  ADHN: [],
  COHS: [],
  FERP: [],
  SLFP: [],
  FERR: [],
  SLFR: [],
  BUOY: [],
  BALA: [],
  CILN: [],
  LUBR: [],
  ELGN: [],
  GRTN: [],
  CRST: [],
  CRYS: [],
  ISPR: [],
};

/**
 * Genes whose cytosolic copies may still carry a position tag. Taperin shapes
 * the cell where it gathers, so its mandatory cytosolic route is the one route
 * allowed to pair with a position tag; for every other gene the cytosol tag
 * still means "nowhere in particular".
 */
const CYTOSOLIC_SITE_GENES: ReadonlySet<string> = new Set(["TPRN"]);

/** Whether a gene's cytosolic copies accept a position tag. */
export function geneAcceptsCytosolicSite(geneId: string | null): boolean {
  return geneId !== null && CYTOSOLIC_SITE_GENES.has(geneId);
}

/**
 * Whether a gene accepts a destination route. Genes without a restriction take
 * any route; the restriction only binds once the coding region is placed.
 */
export function geneAcceptsRoute(geneId: string | null, routeId: string): boolean {
  if (geneId === null) return true;
  const allowed = GENE_ROUTES[geneId];
  return allowed === undefined || allowed.includes(routeId);
}

/**
 * Whether a gene accepts a position tag at all. Genes without a restriction
 * take any position; the restriction only binds once the coding region is placed.
 */
export function geneAcceptsSite(geneId: string | null): boolean {
  if (geneId === null) return true;
  const allowed = GENE_SITES[geneId];
  return allowed === undefined || allowed.length > 0;
}

/** True when the promoter varies between a minimum and a maximum amount. */
export function amountRange(promoterId: string | null): boolean {
  return promoterId !== null && promotersById.get(promoterId)?.amountMode === "range";
}

export function dropTargets(id: string): Slot[] {
  const kind = partKind(id);
  if (kind === "promoter") return ["promoter"];
  if (kind === "amount") return amountRange(draft.promoterId) ? ["amount-min", "amount-max"] : ["amount"];
  if (kind === "gene") return ["coding"];
  const role = tagRole(id);
  if (role === "route") return geneAcceptsRoute(draft.geneId, id) ? ["route"] : [];
  if (role === "site" && (draft.routeId !== "CYTO" || geneAcceptsCytosolicSite(draft.geneId)) && geneAcceptsSite(draft.geneId)) return ["site"];
  return [];
}

export function dropTarget(id: string): Slot | null {
  return dropTargets(id)[0] ?? null;
}

export function slotAccepts(slot: Slot, id: string): boolean {
  return dropTargets(id).includes(slot);
}

export function unlockedPromoters(): CatalogPart[] {
  return PROMOTERS.filter((promoter) => isPartUnlocked(promoter.id)).map(promoterPart);
}

export function unlockedAmounts(): CatalogPart[] {
  return AMOUNTS.filter((amount) => isPartUnlocked(amount.id)).map(amountPart);
}

export function catalogGenesPopulated(): boolean {
  return catalogPopulated;
}

export function setCatalogGenesPopulated(on: boolean): void {
  if (on === catalogPopulated) return;
  catalogPopulated = on;
  if (on) {
    const made = genome.filter((cassette) => !isCatalogCassette(cassette.uid));
    genome = catalogGenome().concat(made);
  } else {
    genome = genome.filter((cassette) => !isCatalogCassette(cassette.uid));
  }
  insertion = clamp(insertion, 0, genome.length);
  notifyGenome(null);
}

export function unlockedGenes(): CatalogPart[] {
  if (!catalogPopulated) {
    const made = new Set(genome.map((cassette) => cassette.geneId));
    for (const gene of GENES) if (isGeneUnlocked(gene.id)) made.add(gene.id);
    return GENES.filter((gene) => made.has(gene.id)).map(genePart);
  }
  return GENES.filter((gene) => missingGeneRequirements(gene.id).length === 0).map(genePart);
}

export function unlockedTags(role?: TagRole): CatalogPart[] {
  const tags = role ? TAGS.filter((tag) => tagRole(tag.id) === role) : TAGS;
  return tags.filter((tag) => isPartUnlocked(tag.id)).map(tagPart);
}

export function scalarResponse(promoterId: string | null): ScalarResponse | null {
  if (!promoterId || !promotersById.has(promoterId)) return null;
  // None of the promoters store a sampled response curve yet.
  return null;
}

export function behaviorLine(value: Draft = draft): string {
  const promoter = value.promoterId ? promotersById.get(value.promoterId) : undefined;
  const gene = value.geneId ? genesById.get(value.geneId) : undefined;
  const tags = [value.routeId, value.siteId].flatMap((id) => {
    const tag = id ? tagsById.get(id) : undefined;
    return tag ? [tag.destination] : [];
  });
  if (!promoter && !gene) return "Add parts to assemble a gene.";
  if (!promoter) return "Add a promoter.";
  if (!gene) return "Add a coding region.";
  const where = tags.length > 0 ? ` · ${tags.join(" · ")}` : "";
  return `${promoter.activation} → ${gene.name} production${where}`;
}

// Placeholder costs in tenths, until the simulation reports real economy values.
const AMOUNT_ATP_TENTHS: readonly number[] = [2, 5, 10, 20, 40, 80];
const PROMOTER_ATP_TENTHS: Record<string, number> = { CNST: 0, COND: 1, COSL: 1, GRAD: 2, OSCL: 1, THRS: 2 };
const PROMOTER_MP: Record<string, number> = { CNST: 1, COND: 2, COSL: 3, GRAD: 3, OSCL: 3, THRS: 2 };
const TAG_ATP_TENTHS = 5;
const CODING_MP = 2;
const DEFAULT_AMOUNT_LEVEL = 3;

/** Placeholder ATP upkeep per second for one cassette, until the simulation reports real costs. */
export function cassetteAtpCost(cassette: Cassette): number {
  const level = Math.round(cassetteAmountLevel(cassette));
  const amount = AMOUNT_ATP_TENTHS[Math.min(AMOUNT_ATP_TENTHS.length - 1, Math.max(0, level - 1))] ?? 10;
  const promoter = PROMOTER_ATP_TENTHS[cassette.promoterId] ?? 2;
  const tags = (cassette.routeId === null ? 0 : 1) + (cassette.siteId === null ? 0 : 1);
  return (amount + promoter + tags * TAG_ATP_TENTHS) / 10;
}

/** Placeholder mutation point cost of assembling one cassette in the editor. */
export function cassetteMutationCost(cassette: Cassette): number {
  const promoter = PROMOTER_MP[cassette.promoterId] ?? 2;
  const amount = Math.max(1, Math.round(cassetteAmountLevel(cassette)));
  const tags = (cassette.routeId === null ? 0 : 1) + (cassette.siteId === null ? 0 : 1);
  return promoter + amount + CODING_MP + tags;
}

/** Expression level of a cassette, 1 through 6. Ranged promoters average their two levels. */
function cassetteAmountLevel(cassette: Cassette): number {
  if (amountRange(cassette.promoterId)) {
    const min = cassette.amountMinId ? amountsById.get(cassette.amountMinId)?.level : undefined;
    const max = cassette.amountMaxId ? amountsById.get(cassette.amountMaxId)?.level : undefined;
    if (min === undefined && max === undefined) return DEFAULT_AMOUNT_LEVEL;
    if (min === undefined) return max ?? DEFAULT_AMOUNT_LEVEL;
    if (max === undefined) return min;
    return (min + max) / 2;
  }
  return cassette.amountId ? amountsById.get(cassette.amountId)?.level ?? DEFAULT_AMOUNT_LEVEL : DEFAULT_AMOUNT_LEVEL;
}

/**
 * Construct nodes holding a part the current coding region does not accept.
 * An empty node is not listed. The outline is for a tag that is already installed.
 */
export function illegalDraftSlots(value: Draft = draft): Slot[] {
  const slots: Slot[] = [];
  if (value.routeId && !geneAcceptsRoute(value.geneId, value.routeId)) slots.push("route");
  if (value.siteId && ((value.routeId === "CYTO" && !geneAcceptsCytosolicSite(value.geneId)) || tagRole(value.siteId) !== "site" || !geneAcceptsSite(value.geneId))) slots.push("site");
  return slots;
}

export function draftProblems(value: Draft = draft): string[] {
  const problems: string[] = [];
  if (value.name.trim().length === 0) problems.push("Name the construct.");
  if (!/^[A-Z0-9]{3,5}$/.test(value.code)) problems.push("Gene code must be 3 to 5 letters or numbers.");
  if (!value.promoterId) problems.push("Add a promoter.");
  else if (!promotersById.has(value.promoterId)) problems.push("Promoter is not in the catalog.");
  if (!value.geneId) problems.push("Add a coding region.");
  else if (!genesById.has(value.geneId)) problems.push("Coding region is not in the catalog.");
  else problems.push(...missingGeneRequirements(value.geneId));
  if (amountRange(value.promoterId)) {
    if (value.amountMinId && partKind(value.amountMinId) !== "amount") problems.push("Minimum amount part is not in the catalog.");
    if (value.amountMaxId && partKind(value.amountMaxId) !== "amount") problems.push("Maximum amount part is not in the catalog.");
    const min = value.amountMinId ? amountsById.get(value.amountMinId) : undefined;
    const max = value.amountMaxId ? amountsById.get(value.amountMaxId) : undefined;
    if (min && max && min.level > max.level) problems.push("Minimum amount cannot be above the maximum amount.");
  } else if (value.amountId && partKind(value.amountId) !== "amount") problems.push("Amount part is not in the catalog.");
  if (value.routeId && tagRole(value.routeId) !== "route") problems.push("Destination tag is not in the catalog.");
  if (value.routeId && !geneAcceptsRoute(value.geneId, value.routeId)) {
    const gene = value.geneId ? genesById.get(value.geneId) : undefined;
    const accepted = (GENE_ROUTES[value.geneId ?? ""] ?? [])
      .map((id) => tagsById.get(id)?.name ?? id)
      .join(" or ");
    problems.push(`${gene?.name ?? "This gene"} only takes the ${accepted || "matching"} destination tag.`);
  }
  if (value.siteId && ((value.routeId === "CYTO" && !geneAcceptsCytosolicSite(value.geneId)) || tagRole(value.siteId) !== "site")) problems.push("Cytosolic localization cannot take a second tag.");
  if (value.siteId && !geneAcceptsSite(value.geneId)) {
    const gene = value.geneId ? genesById.get(value.geneId) : undefined;
    problems.push(`${gene?.name ?? "This gene"} cannot take a position tag.`);
  }
  return problems;
}

export function insertionChoices(): { index: number; label: string }[] {
  const choices = [{ index: 0, label: "At start" }];
  genome.forEach((cassette, index) => {
    choices.push({ index: index + 1, label: `After ${cassette.name}` });
  });
  return choices;
}

export function setDraftName(name: string): void {
  const next = name.slice(0, NAME_LIMIT);
  if (next === draft.name) return;
  draft = { ...draft, name: next };
  notifyDraft();
}

export function setDraftCode(code: string): void {
  const next = normalizeCode(code);
  if (next === draft.code) return;
  draft = { ...draft, code: next };
  notifyDraft();
}

/**
 * AUTO identity for the draft: the position word plus the gene name ("Polar
 * Flagellin"), and a code from the position initial plus the gene name's
 * consonant skeleton ("PFLG"). Needs a placed coding region; null otherwise.
 */
export function autoIdentity(value: Draft = draft): { name: string; code: string } | null {
  if (!value.geneId) return null;
  const gene = genesById.get(value.geneId);
  if (!gene) return null;
  const site = value.siteId !== null ? tagsById.get(value.siteId) : undefined;
  const prefix = site && tagRole(site.id) === "site" ? site.name : "";
  const name = prefix ? `${prefix} ${gene.name}` : gene.name;
  const consonants = gene.name.toUpperCase().replace(/[^A-Z]/g, "").replace(/[AEIOU]/g, "");
  let code = (prefix ? prefix[0].toUpperCase() : "") + consonants.slice(0, prefix ? 3 : 4);
  if (code.length < 3) code = (code + gene.id).slice(0, prefix ? 4 : 5);
  return { name: name.slice(0, NAME_LIMIT), code: normalizeCode(code) };
}

export function setInsertionIndex(index: number): void {
  const next = clamp(Math.round(index), 0, genome.length);
  if (next === insertion) return;
  insertion = next;
  notifyDraft();
}

export function placePart(slot: Slot, id: string): boolean {
  if (!slotAccepts(slot, id)) return false;
  if (slot === "promoter" && draft.promoterId === id) return true;
  if (slot === "amount" && draft.amountId === id) return true;
  if (slot === "amount-min" && draft.amountMinId === id) return true;
  if (slot === "amount-max" && draft.amountMaxId === id) return true;
  if (slot === "coding" && draft.geneId === id) return true;
  if (slot === "route" && draft.routeId === id) return true;
  if (slot === "site" && draft.siteId === id) return true;
  draft = {
    ...draft,
    promoterId: slot === "promoter" ? id : draft.promoterId,
    amountId: slot === "amount" ? id : draft.amountId,
    amountMinId: slot === "amount-min" ? id : draft.amountMinId,
    amountMaxId: slot === "amount-max" ? id : draft.amountMaxId,
    geneId: slot === "coding" ? id : draft.geneId,
    routeId: slot === "route" ? id : draft.routeId,
    siteId: slot === "route" && id === "CYTO" && !geneAcceptsCytosolicSite(draft.geneId) ? null : slot === "site" ? id : draft.siteId,
  };
  notifyDraft();
  return true;
}

export function clearPart(slot: Slot): void {
  if (slot === "promoter" && draft.promoterId === null) return;
  if (slot === "amount" && draft.amountId === null) return;
  if (slot === "amount-min" && draft.amountMinId === null) return;
  if (slot === "amount-max" && draft.amountMaxId === null) return;
  if (slot === "coding" && draft.geneId === null) return;
  if (slot === "route" && draft.routeId === null) return;
  if (slot === "site" && draft.siteId === null) return;
  draft = {
    ...draft,
    promoterId: slot === "promoter" ? null : draft.promoterId,
    amountId: slot === "amount" ? null : draft.amountId,
    amountMinId: slot === "amount-min" ? null : draft.amountMinId,
    amountMaxId: slot === "amount-max" ? null : draft.amountMaxId,
    geneId: slot === "coding" ? null : draft.geneId,
    routeId: slot === "route" ? null : draft.routeId,
    siteId: slot === "site" ? null : draft.siteId,
  };
  notifyDraft();
}

export function clearDraft(): void {
  draft = emptyDraft();
  editingUid = null;
  notifyDraft();
}

function draftCassetteFields(): Omit<Cassette, "uid"> | null {
  if (!draft.promoterId || !draft.geneId) return null;
  const ranged = amountRange(draft.promoterId);
  return {
    name: draft.name.trim(),
    code: draft.code,
    promoterId: draft.promoterId,
    amountId: ranged ? null : draft.amountId,
    amountMinId: ranged ? draft.amountMinId : null,
    amountMaxId: ranged ? draft.amountMaxId : null,
    geneId: draft.geneId,
    routeId: draft.routeId,
    siteId: draft.siteId,
  };
}

export function insertDraft(): { cassette: Cassette; index: number } | { problems: string[] } {
  const problems = draftProblems();
  const fields = draftCassetteFields();
  if (problems.length > 0 || !fields) return { problems };
  const at = clamp(insertion, 0, genome.length);
  const appending = at === genome.length;
  const cassette: Cassette = { uid: nextUid(), ...fields };
  genome = genome.slice(0, at).concat(cassette, genome.slice(at));
  insertion = appending ? genome.length : at + 1;
  notifyGenome(at);
  return { cassette, index: at };
}

/** Loads a committed construct onto the bench for editing. */
export function beginEditCassette(uid: string): boolean {
  const cassette = genome.find((entry) => entry.uid === uid);
  if (!cassette) return false;
  draft = {
    name: cassette.name,
    code: cassette.code,
    promoterId: cassette.promoterId,
    amountId: cassette.amountId,
    amountMinId: cassette.amountMinId,
    amountMaxId: cassette.amountMaxId,
    geneId: cassette.geneId,
    routeId: cassette.routeId,
    siteId: cassette.siteId,
  };
  editingUid = uid;
  notifyDraft();
  return true;
}

/** The committed construct being edited, when one is loaded on the bench. */
export function editingCassette(): Cassette | null {
  if (!editingUid) return null;
  return genome.find((entry) => entry.uid === editingUid) ?? null;
}

/** True while the bench still matches the construct being edited. */
export function draftMatchesEditing(): boolean {
  const cassette = editingCassette();
  const fields = draftCassetteFields();
  if (!cassette || !fields) return true;
  return (
    fields.name === cassette.name &&
    fields.code === cassette.code &&
    fields.promoterId === cassette.promoterId &&
    fields.amountId === cassette.amountId &&
    fields.amountMinId === cassette.amountMinId &&
    fields.amountMaxId === cassette.amountMaxId &&
    fields.geneId === cassette.geneId &&
    fields.routeId === cassette.routeId &&
    fields.siteId === cassette.siteId
  );
}

/** Swaps the construct being edited for the bench version, keeping its slot. */
export function updateEditedCassette(): { cassette: Cassette; index: number } | { problems: string[] } {
  const cassette = editingCassette();
  if (!cassette) return { problems: ["The construct being edited is no longer in the genome."] };
  const problems = draftProblems();
  const fields = draftCassetteFields();
  if (problems.length > 0 || !fields) return { problems };
  const index = genome.findIndex((entry) => entry.uid === cassette.uid);
  if (index < 0) return { problems: ["The construct being edited is no longer in the genome."] };
  const replacement: Cassette = { uid: cassette.uid, ...fields };
  genome = genome.slice(0, index).concat(replacement, genome.slice(index + 1));
  editingUid = null;
  notifyGenome(null);
  return { cassette: replacement, index };
}

export function removeCassette(uid: string): boolean {
  const index = genome.findIndex((cassette) => cassette.uid === uid);
  if (index < 0) return false;
  genome = genome.slice(0, index).concat(genome.slice(index + 1));
  if (uid === editingUid) editingUid = null;
  insertion = clamp(insertion, 0, genome.length);
  notifyGenome(null);
  return true;
}

export function clearGenome(): void {
  if (genome.length === 0) return;
  genome = [];
  insertion = 0;
  notifyGenome(null);
}

export function snapshot(): GenomeSnapshot {
  return {
    v: 1,
    draft: { ...draft },
    genome: genome.map((cassette) => ({ ...cassette })),
  };
}

export function applySnapshot(value: GenomeSnapshot): void {
  draft = sanitizeDraft(value.draft);
  const loaded = value.genome.map(copyCassette);
  genome = catalogPopulated ? loaded : loaded.filter((cassette) => !isCatalogCassette(cassette.uid));
  editingUid = editingUid !== null && genome.some((cassette) => cassette.uid === editingUid) ? editingUid : null;
  insertion = clamp(insertion, 0, genome.length);
  notifyDraft();
  notifyGenome(null);
}

export async function loadGenomeState(): Promise<void> {
  try {
    const response = await fetch("/genome-state.json", { cache: "no-store" });
    if (!response.ok) return;
    const snapshotValue = parseSnapshot(await response.json());
    if (!snapshotValue) return;
    applySnapshot(snapshotValue);
  } catch {
    return;
  }
}

export async function persistGenome(): Promise<boolean> {
  try {
    const response = await fetch("/api/genome-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot()),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function parseSnapshot(value: unknown): GenomeSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { v?: unknown; draft?: unknown; genome?: unknown };
  if (body.v !== 1 || !Array.isArray(body.genome)) return null;
  const nextDraft = sanitizeDraft(body.draft);
  const nextGenome = body.genome.map(sanitizeCassette).filter((cassette): cassette is Cassette => cassette !== null);
  return { v: 1, draft: nextDraft, genome: nextGenome };
}

export function resetGenomeState(): void {
  draft = emptyDraft();
  catalogPopulated = false;
  genome = [];
  insertion = 0;
  editingUid = null;
  notifyDraft();
  notifyGenome(null);
}

function emptyDraft(): Draft {
  return { name: "Untitled construct", code: "", promoterId: null, amountId: null, amountMinId: null, amountMaxId: null, geneId: null, routeId: null, siteId: null };
}

function isCatalogCassette(uid: string): boolean {
  return uid.startsWith("catalog-");
}

function catalogGenome(): Cassette[] {
  return GENES.map((gene, index) => ({
    uid: `catalog-${gene.id}-${index}`,
    name: gene.name,
    code: gene.id,
    promoterId: "CNST",
    amountId: null,
    amountMinId: null,
    amountMaxId: null,
    geneId: gene.id,
    ...catalogTagFields(gene.id),
  }));
}

function catalogTagFields(geneId: string): { routeId: string | null; siteId: string | null } {
  return CATALOG_PLACEMENTS[geneId] ?? { routeId: null, siteId: null };
}

function readAmountFields(
  body: { amountId?: unknown; amountMinId?: unknown; amountMaxId?: unknown },
  promoterId: string | null,
): { amountId: string | null; amountMinId: string | null; amountMaxId: string | null } {
  const amountId = typeof body.amountId === "string" && amountsById.has(body.amountId) ? body.amountId : null;
  const amountMinId = typeof body.amountMinId === "string" && amountsById.has(body.amountMinId) ? body.amountMinId : null;
  const amountMaxId = typeof body.amountMaxId === "string" && amountsById.has(body.amountMaxId) ? body.amountMaxId : null;
  // Only the fields matching the promoter's amount mode are kept.
  if (amountRange(promoterId)) return { amountId: null, amountMinId, amountMaxId };
  return { amountId, amountMinId: null, amountMaxId: null };
}

function readTagFields(body: { routeId?: unknown; siteId?: unknown; tagId?: unknown }, geneId: string | null): { routeId: string | null; siteId: string | null } {
  let routeId = typeof body.routeId === "string" ? body.routeId : null;
  let siteId = typeof body.siteId === "string" ? body.siteId : null;
  if (!routeId && !siteId && typeof body.tagId === "string") {
    if (tagRole(body.tagId) === "route") routeId = body.tagId;
    else if (tagRole(body.tagId) === "site") siteId = body.tagId;
  }
  if (!routeId || tagRole(routeId) !== "route") routeId = null;
  if (!siteId || tagRole(siteId) !== "site" || (routeId === "CYTO" && !geneAcceptsCytosolicSite(geneId))) siteId = null;
  return { routeId, siteId };
}

function promoterPart(promoter: PromoterRecord): CatalogPart {
  return {
    id: promoter.id,
    kind: "promoter",
    name: promoter.name,
    summary: promoter.summary,
    description: promoter.description,
    icon: regulatoryIcon(promoter.id) ?? CYTOSOLIC_ICON,
  };
}

function amountPart(amount: AmountRecord): CatalogPart {
  return {
    id: amount.id,
    kind: "amount",
    name: amount.name,
    summary: amount.summary,
    description: amount.description,
    icon: regulatoryIcon(amount.id) ?? CYTOSOLIC_ICON,
  };
}

function genePart(gene: GeneRecord): CatalogPart {
  return {
    id: gene.id,
    kind: "gene",
    name: gene.name,
    summary: gene.category,
    description: firstSentence(gene.description),
    icon: `/ui/genome_viewer/proteins/individuals_32x32/${gene.id}.png`,
  };
}

function tagPart(tag: TagRecord): CatalogPart {
  return {
    id: tag.id,
    kind: "tag",
    name: tag.name,
    summary: tag.summary,
    description: tag.description,
    icon: regulatoryIcon(tag.id) ?? CYTOSOLIC_ICON,
  };
}

function firstSentence(text: string): string {
  const sentence = text.split(/(?<=\.)\s/)[0] ?? text;
  return sentence;
}

function sanitizeDraft(value: unknown): Draft {
  const blank = emptyDraft();
  if (!value || typeof value !== "object") return blank;
  const body = value as { name?: unknown; code?: unknown; promoterId?: unknown; amountId?: unknown; amountMinId?: unknown; amountMaxId?: unknown; geneId?: unknown; routeId?: unknown; siteId?: unknown; tagId?: unknown };
  const name = typeof body.name === "string" && body.name.trim().length > 0 ? body.name.slice(0, NAME_LIMIT) : blank.name;
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const promoterId = typeof body.promoterId === "string" && promotersById.has(body.promoterId) ? body.promoterId : null;
  const geneId = typeof body.geneId === "string" && genesById.has(body.geneId) ? body.geneId : null;
  return { name, code, promoterId, geneId, ...readAmountFields(body, promoterId), ...readTagFields(body, geneId) };
}

function sanitizeCassette(value: unknown): Cassette | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { uid?: unknown; name?: unknown; code?: unknown; promoterId?: unknown; amountId?: unknown; amountMinId?: unknown; amountMaxId?: unknown; geneId?: unknown; routeId?: unknown; siteId?: unknown; tagId?: unknown };
  if (typeof body.promoterId !== "string" || !promotersById.has(body.promoterId)) return null;
  if (typeof body.geneId !== "string" || !genesById.has(body.geneId)) return null;
  const tags = readTagFields(body, body.geneId);
  const gene = genesById.get(body.geneId);
  const name = typeof body.name === "string" && body.name.trim().length > 0 ? body.name.trim().slice(0, NAME_LIMIT) : gene?.name ?? "Construct";
  const supplied = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const code = /^[A-Z0-9]{3,5}$/.test(supplied) ? supplied : gene?.id ?? body.geneId;
  const uid = typeof body.uid === "string" && body.uid.trim().length > 0 ? body.uid.slice(0, 64) : nextUid();
  return { uid, name, code, promoterId: body.promoterId, geneId: body.geneId, ...readAmountFields(body, body.promoterId), ...tags };
}

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

function copyCassette(cassette: Cassette): Cassette {
  return { ...cassette };
}

function notifyDraft(): void {
  for (const listener of draftListeners) listener();
}

function notifyGenome(inserted: number | null): void {
  const notice = { inserted };
  for (const listener of genomeListeners) listener(notice);
}

function nextUid(): string {
  return `c${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
