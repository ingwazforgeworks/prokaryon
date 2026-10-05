import { GENES, type GeneRecord } from "./genes";
import { missingGeneRequirements } from "./techTree";

const REGULATORY_ICON_DIR = "/ui/genome_viewer/regulatory_icons/32x32";
const TAG_ICON_DIR = "/ui/genome_viewer/new_regulatory_icons/32x32";
const NAME_LIMIT = 48;

const REGULATORY_ICONS: Record<string, string> = {
  CNST: `${REGULATORY_ICON_DIR}/constitutive_32x32.png`,
  COND: `${REGULATORY_ICON_DIR}/conditional_32x32.png`,
  GRAD: `${REGULATORY_ICON_DIR}/graded_32x32.png`,
  OSCL: `${REGULATORY_ICON_DIR}/oscillatory_32x32.png`,
  PERS: `${REGULATORY_ICON_DIR}/persistence_gated_32x32.png`,
  SURF: `${TAG_ICON_DIR}/membrane_anchored_32x32.png`,
  THRS: `${REGULATORY_ICON_DIR}/threshold_32x32.png`,
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

export type PartKind = "promoter" | "gene" | "tag";
export type TagRole = "route" | "site";
export type Slot = "promoter" | "coding" | "route" | "site";

export type PromoterRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  activation: string;
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
  geneId: string | null;
  routeId: string | null;
  siteId: string | null;
};

export type Cassette = {
  uid: string;
  name: string;
  code: string;
  promoterId: string;
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
  },
  {
    id: "OSCL",
    name: "Oscillatory",
    summary: "Cycles on and off",
    description: "Expression turns on and off in a repeating cycle. The period is not parameterized yet.",
    activation: "Cycles on and off",
  },
  {
    id: "PERS",
    name: "Persistence gated",
    summary: "Holds after the signal",
    description: "Once expression starts, it continues for a while after the triggering signal is gone. The hold time is not parameterized yet.",
    activation: "Holds after the signal ends",
  },
  {
    id: "THRS",
    name: "Threshold",
    summary: "On past a level",
    description: "Expression stays off until an input passes a level, then switches on. The level is not parameterized yet.",
    activation: "On once an input passes a level",
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
const tagsById = new Map(TAGS.map((tag) => [tag.id, tag]));

const CATALOG_PLACEMENTS: Record<string, { routeId: string | null; siteId: string | null }> = {
  GFP: { routeId: "CYTO", siteId: null },
  ANAB: { routeId: "SecretoryPeptide", siteId: null },
  GLYP: { routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" },
  NITP: { routeId: "SecretoryPeptide", siteId: "AntiPolarLocalizationSignal" },
  OXDP: { routeId: "SecretoryPeptide", siteId: "BIPO" },
  LIPP: { routeId: "SecretoryPeptide", siteId: "LATR" },
  SLFP: { routeId: "SecretoryPeptide", siteId: "ANTL" },
  CBXP: { routeId: "SecretoryPeptide", siteId: "BILT" },
  ATPS: { routeId: "TransmembraneSignal", siteId: null },
  ADHN: { routeId: "SURF", siteId: null },
  AQUP: { routeId: "SURF", siteId: "PolarLocalizationSignal" },
  PPMP: { routeId: "SURF", siteId: "AntiPolarLocalizationSignal" },
  PHOR: { routeId: "SURF", siteId: "BIPO" },
  SIDP: { routeId: "SURF", siteId: "LATR" },
  CRTS: { routeId: "SURF", siteId: "ANTL" },
  BFP: { routeId: "SURF", siteId: "BILT" },
  FLGN: { routeId: null, siteId: "PolarLocalizationSignal" },
  PILN: { routeId: null, siteId: "AntiPolarLocalizationSignal" },
  CHMR: { routeId: null, siteId: "BIPO" },
  CHLS: { routeId: null, siteId: "LATR" },
  FERP: { routeId: null, siteId: "ANTL" },
  FRMP: { routeId: null, siteId: "BILT" },
};

let draft: Draft = emptyDraft();
let genome: Cassette[] = [];
let insertion = 0;
let catalogPopulated = false;
const draftListeners = new Set<() => void>();
const genomeListeners = new Set<(notice: GenomeNotice) => void>();

export function geneById(id: string): GeneRecord | undefined {
  return genesById.get(id);
}

export function promoterById(id: string): PromoterRecord | undefined {
  return promotersById.get(id);
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
  if (genesById.has(id)) return "gene";
  if (tagsById.has(id)) return "tag";
  return null;
}

export function tagRole(id: string): TagRole | null {
  if (id === "CYTO" || id === "SecretoryPeptide" || id === "TransmembraneSignal" || id === "SURF") return "route";
  if (id === "PolarLocalizationSignal" || id === "AntiPolarLocalizationSignal" || id === "BIPO" || id === "LATR" || id === "ANTL" || id === "BILT") return "site";
  return null;
}

export function dropTarget(id: string): Slot | null {
  const kind = partKind(id);
  if (kind === "promoter") return "promoter";
  if (kind === "gene") return "coding";
  const role = tagRole(id);
  if (role === "route") return "route";
  if (role === "site" && draft.routeId !== "CYTO") return "site";
  return null;
}

export function slotAccepts(slot: Slot, id: string): boolean {
  return dropTarget(id) === slot;
}

export function unlockedPromoters(): CatalogPart[] {
  return PROMOTERS.map(promoterPart);
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
  const present = genomeGeneIds();
  if (!catalogPopulated) {
    const made = new Set(genome.map((cassette) => cassette.geneId));
    return GENES.filter((gene) => made.has(gene.id)).map(genePart);
  }
  return GENES.filter((gene) => missingGeneRequirements(gene.id, present).length === 0).map(genePart);
}

export function unlockedTags(role?: TagRole): CatalogPart[] {
  const tags = role ? TAGS.filter((tag) => tagRole(tag.id) === role) : TAGS;
  return tags.map(tagPart);
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

export function draftProblems(value: Draft = draft, present: ReadonlySet<string> = genomeGeneIds()): string[] {
  const problems: string[] = [];
  if (value.name.trim().length === 0) problems.push("Name the construct.");
  if (!/^[A-Z0-9]{3,5}$/.test(value.code)) problems.push("Gene code must be 3 to 5 letters or numbers.");
  if (!value.promoterId) problems.push("Add a promoter.");
  else if (!promotersById.has(value.promoterId)) problems.push("Promoter is not in the catalog.");
  if (!value.geneId) problems.push("Add a coding region.");
  else if (!genesById.has(value.geneId)) problems.push("Coding region is not in the catalog.");
  else problems.push(...missingGeneRequirements(value.geneId, present));
  if (value.routeId && tagRole(value.routeId) !== "route") problems.push("Destination tag is not in the catalog.");
  if (value.siteId && (value.routeId === "CYTO" || tagRole(value.siteId) !== "site")) problems.push("Cytosolic localization cannot take a second tag.");
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

export function setInsertionIndex(index: number): void {
  const next = clamp(Math.round(index), 0, genome.length);
  if (next === insertion) return;
  insertion = next;
  notifyDraft();
}

export function placePart(slot: Slot, id: string): boolean {
  if (!slotAccepts(slot, id)) return false;
  if (slot === "promoter" && draft.promoterId === id) return true;
  if (slot === "coding" && draft.geneId === id) return true;
  if (slot === "route" && draft.routeId === id) return true;
  if (slot === "site" && draft.siteId === id) return true;
  draft = {
    ...draft,
    promoterId: slot === "promoter" ? id : draft.promoterId,
    geneId: slot === "coding" ? id : draft.geneId,
    routeId: slot === "route" ? id : draft.routeId,
    siteId: slot === "route" && id === "CYTO" ? null : slot === "site" ? id : draft.siteId,
  };
  notifyDraft();
  return true;
}

export function clearPart(slot: Slot): void {
  if (slot === "promoter" && draft.promoterId === null) return;
  if (slot === "coding" && draft.geneId === null) return;
  if (slot === "route" && draft.routeId === null) return;
  if (slot === "site" && draft.siteId === null) return;
  draft = {
    ...draft,
    promoterId: slot === "promoter" ? null : draft.promoterId,
    geneId: slot === "coding" ? null : draft.geneId,
    routeId: slot === "route" ? null : draft.routeId,
    siteId: slot === "site" ? null : draft.siteId,
  };
  notifyDraft();
}

export function clearDraft(): void {
  draft = emptyDraft();
  notifyDraft();
}

export function insertDraft(): { cassette: Cassette; index: number } | { problems: string[] } {
  const problems = draftProblems();
  if (problems.length > 0 || !draft.promoterId || !draft.geneId) return { problems };
  const at = clamp(insertion, 0, genome.length);
  const appending = at === genome.length;
  const cassette: Cassette = {
    uid: nextUid(),
    name: draft.name.trim(),
    code: draft.code,
    promoterId: draft.promoterId,
    geneId: draft.geneId,
    routeId: draft.routeId,
    siteId: draft.siteId,
  };
  genome = genome.slice(0, at).concat(cassette, genome.slice(at));
  insertion = appending ? genome.length : at + 1;
  notifyGenome(at);
  return { cassette, index: at };
}

export function removeCassette(uid: string): boolean {
  const index = genome.findIndex((cassette) => cassette.uid === uid);
  if (index < 0) return false;
  genome = genome.slice(0, index).concat(genome.slice(index + 1));
  insertion = clamp(insertion, 0, genome.length);
  notifyGenome(null);
  return true;
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
  notifyDraft();
  notifyGenome(null);
}

function emptyDraft(): Draft {
  return { name: "Untitled construct", code: "", promoterId: null, geneId: null, routeId: null, siteId: null };
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
    geneId: gene.id,
    ...catalogTagFields(gene.id),
  }));
}

function genomeGeneIds(): Set<string> {
  return new Set(genome.map((cassette) => cassette.geneId));
}

function catalogTagFields(geneId: string): { routeId: string | null; siteId: string | null } {
  return CATALOG_PLACEMENTS[geneId] ?? { routeId: null, siteId: null };
}

function readTagFields(body: { routeId?: unknown; siteId?: unknown; tagId?: unknown }): { routeId: string | null; siteId: string | null } {
  let routeId = typeof body.routeId === "string" ? body.routeId : null;
  let siteId = typeof body.siteId === "string" ? body.siteId : null;
  if (!routeId && !siteId && typeof body.tagId === "string") {
    if (tagRole(body.tagId) === "route") routeId = body.tagId;
    else if (tagRole(body.tagId) === "site") siteId = body.tagId;
  }
  if (!routeId || tagRole(routeId) !== "route") routeId = null;
  if (!siteId || tagRole(siteId) !== "site" || routeId === "CYTO") siteId = null;
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

function genePart(gene: GeneRecord): CatalogPart {
  return {
    id: gene.id,
    kind: "gene",
    name: gene.name,
    summary: gene.category,
    description: firstSentence(gene.description),
    icon: `/ui/genome_viewer/proteins/named/individuals_32x32/${gene.id}.png`,
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
  const body = value as { name?: unknown; code?: unknown; promoterId?: unknown; geneId?: unknown; routeId?: unknown; siteId?: unknown; tagId?: unknown };
  const name = typeof body.name === "string" && body.name.trim().length > 0 ? body.name.slice(0, NAME_LIMIT) : blank.name;
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const promoterId = typeof body.promoterId === "string" && promotersById.has(body.promoterId) ? body.promoterId : null;
  const geneId = typeof body.geneId === "string" && genesById.has(body.geneId) ? body.geneId : null;
  return { name, code, promoterId, geneId, ...readTagFields(body) };
}

function sanitizeCassette(value: unknown): Cassette | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { uid?: unknown; name?: unknown; code?: unknown; promoterId?: unknown; geneId?: unknown; routeId?: unknown; siteId?: unknown; tagId?: unknown };
  if (typeof body.promoterId !== "string" || !promotersById.has(body.promoterId)) return null;
  if (typeof body.geneId !== "string" || !genesById.has(body.geneId)) return null;
  const tags = readTagFields(body);
  const gene = genesById.get(body.geneId);
  const name = typeof body.name === "string" && body.name.trim().length > 0 ? body.name.trim().slice(0, NAME_LIMIT) : gene?.name ?? "Construct";
  const supplied = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const code = /^[A-Z0-9]{3,5}$/.test(supplied) ? supplied : gene?.id ?? body.geneId;
  const uid = typeof body.uid === "string" && body.uid.trim().length > 0 ? body.uid.slice(0, 64) : nextUid();
  return { uid, name, code, promoterId: body.promoterId, geneId: body.geneId, ...tags };
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
