import { readAuthoring, saveAuthoring } from "./authoringStore";
import { mutationPointCount, setMutationPoints } from "./resources";
import {
  REGULATORY_EDGES,
  REGULATORY_MP_COST,
  REGULATORY_PARTS,
  type RegulatoryPart,
} from "./regulatoryParts";

/**
 * Mutation point cost to unlock each gene on the tech tree. Genes left out are
 * not purchasable. Four prices: 2 for a color, a float, or the first shape
 * gene; 3 for a receptor, a transporter, or a simple reductase; 5 for a motor
 * or a paired reductase; 8 for phototrophy and the late receptors. A new cell's
 * points buy one of the cheap steps, and a division pays one point back.
 */
export const GENE_MP_COSTS: Readonly<Record<string, number>> = {
  GFP: 2,
  YFP: 2,
  BFP: 2,
  RFP: 2,
  CRYP: 2,
  RHDS: 2,
  CRTS: 2,
  SIDS: 2,
  ELGN: 2,
  GRTN: 2,
  BUOY: 2,
  BALA: 2,
  LUBR: 2,
  OSMR: 3,
  FERS: 3,
  SLFS: 3,
  OSMP: 3,
  AQUP: 3,
  CSP: 3,
  HSP: 3,
  OXDP: 3,
  NITP: 3,
  LIPP: 3,
  CBXP: 3,
  OXDR: 3,
  NITR: 3,
  LIPR: 3,
  CBXR: 3,
  FLGN: 3,
  CILN: 3,
  PILN: 3,
  CRST: 3,
  TPRN: 3,
  FLGM: 5,
  CILM: 5,
  FSXR: 5,
  NXDR: 5,
  ADHN: 5,
  COHS: 5,
  THMR: 5,
  BARR: 5,
  THGR: 5,
  CRYS: 5,
  ISPR: 5,
  CHLS: 8,
  PHYS: 8,
  PHOR: 8,
  RXNC: 8,
  PCHR: 8,
  PHVC: 8,
  OXDS: 8,
  NITS: 8,
  CBXS: 8,
  LIPS: 8,
  FLXR: 8,
  ATPR: 8,
  RFLR: 8,
};

/** The top-level genes every cell carries from the start of its life. */
export const DEFAULT_GENES: readonly string[] = ["ATPS", "FLUX", "FERP", "SLFP", "FERR", "SLFR", "ANAB", "CYCL"];

const defaultGenes = new Set(DEFAULT_GENES);

type Listener = () => void;

const listeners = new Set<Listener>();
let unlocked = new Set<string>();

/**
 * Unlock store for hosts that cannot run the save API. Same rule as the
 * genome: a 204 means the checked-in JSON owns the save, and anything else
 * keeps this key. A local copy outranks the static file on the next load.
 */
const STORAGE_KEY = "prokaryon:tech-unlocks";

const partsById = new Map(REGULATORY_PARTS.map((part) => [part.id, part]));

export function geneUnlockCost(geneId: string): number | null {
  const cost = GENE_MP_COSTS[geneId];
  return typeof cost === "number" && cost >= 0 ? cost : null;
}

/** Whether a gene is free from the start of a cell's life. */
export function isGeneDefault(geneId: string): boolean {
  return defaultGenes.has(geneId);
}

export function isGeneUnlocked(geneId: string): boolean {
  return defaultGenes.has(geneId) || unlocked.has(geneId);
}

export function unlockedGeneIds(): readonly string[] {
  return [...unlocked];
}

export function regulatoryPartById(id: string): RegulatoryPart | undefined {
  return partsById.get(id);
}

/** Whether a regulatory part is free from the start of a cell's life. */
export function isPartDefault(id: string): boolean {
  return partsById.get(id)?.defaultUnlocked ?? false;
}

/** Mutation point cost for a regulatory part, or null when it is free or unknown. */
export function partUnlockCost(id: string): number | null {
  const part = partsById.get(id);
  return part && !part.defaultUnlocked ? REGULATORY_MP_COST : null;
}

/**
 * Whether a regulatory part is available to the editor. Unknown ids stay
 * available so parts outside the tree (none today) never vanish from a tray.
 */
export function isPartUnlocked(id: string): boolean {
  const part = partsById.get(id);
  if (!part) return true;
  return part.defaultUnlocked || unlocked.has(id);
}

/** Whether every purchase prerequisite of a part is satisfied. */
export function partRequirementsMet(id: string): boolean {
  if (!partsById.has(id)) return false;
  const incoming = REGULATORY_EDGES.filter((edge) => edge.to === id);
  const required = incoming.filter((edge) => edge.kind === "required");
  if (required.some((edge) => !isPartUnlocked(edge.from))) return false;
  const unlocks = incoming.filter((edge) => edge.kind === "unlocks");
  return unlocks.length === 0 || unlocks.some((edge) => isPartUnlocked(edge.from));
}

/** Human-readable reasons a locked part cannot be bought yet. */
export function missingPartRequirements(id: string): string[] {
  const part = partsById.get(id);
  if (!part) return [];
  const incoming = REGULATORY_EDGES.filter((edge) => edge.to === id);
  const nameOf = (parentId: string): string => partsById.get(parentId)?.name ?? parentId;
  const reasons: string[] = [];
  for (const edge of incoming) {
    if (edge.kind === "required" && !isPartUnlocked(edge.from)) reasons.push(`Requires ${nameOf(edge.from)}`);
  }
  const unlocks = incoming.filter((edge) => edge.kind === "unlocks");
  if (unlocks.length > 0 && !unlocks.some((edge) => isPartUnlocked(edge.from))) {
    const names = unlocks.map((edge) => nameOf(edge.from));
    reasons.push(names.length === 1 ? `Unlocked by ${names[0]}` : `Unlocked by ${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`);
  }
  return reasons;
}

export function subscribeUnlocks(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Spends mutation points to permanently unlock a gene. Returns false when the
 * gene is not purchasable, is already unlocked, or the balance is too low.
 */
export function unlockGene(geneId: string): boolean {
  const cost = geneUnlockCost(geneId);
  if (cost === null || unlocked.has(geneId)) return false;
  if (mutationPointCount() < cost) return false;
  if (cost > 0) setMutationPoints(mutationPointCount() - cost);
  unlocked.add(geneId);
  notify();
  void persistUnlocks();
  return true;
}

/**
 * Debug grant: unlocks every purchasable tech-tree gene and every regulatory
 * part, without spending mutation points or walking the prerequisite chains.
 */
export async function unlockAllGenes(): Promise<boolean> {
  let added = false;
  for (const geneId of Object.keys(GENE_MP_COSTS)) {
    if (unlocked.has(geneId)) continue;
    unlocked.add(geneId);
    added = true;
  }
  for (const part of REGULATORY_PARTS) {
    if (part.defaultUnlocked || unlocked.has(part.id)) continue;
    unlocked.add(part.id);
    added = true;
  }
  if (!added) return true;
  notify();
  return persistUnlocks();
}

/**
 * Spends mutation points to permanently unlock a regulatory part. Returns false
 * when the part is free or unknown, already unlocked, its prerequisites are
 * missing, or the balance is too low.
 */
export function unlockPart(id: string): boolean {
  const cost = partUnlockCost(id);
  if (cost === null || isPartUnlocked(id)) return false;
  if (!partRequirementsMet(id)) return false;
  if (mutationPointCount() < cost) return false;
  if (cost > 0) setMutationPoints(mutationPointCount() - cost);
  unlocked.add(id);
  notify();
  void persistUnlocks();
  return true;
}

function isKnownUnlockId(id: string): boolean {
  return geneUnlockCost(id) !== null || partsById.has(id);
}

export async function loadUnlocks(): Promise<void> {
  const local = parseUnlocks(readAuthoring(STORAGE_KEY));
  if (local) {
    if (sameUnlocks(local)) return;
    unlocked = local;
    notify();
    return;
  }
  try {
    const response = await fetch("/tech-unlocks.json", { cache: "no-store" });
    if (!response.ok) return;
    const next = parseUnlocks(await response.json());
    if (!next || sameUnlocks(next)) return;
    unlocked = next;
    notify();
  } catch {
    return;
  }
}

/** Clears every unlock, so a new cell starts with an empty tech tree. */
export function resetUnlocks(): Promise<boolean> {
  if (unlocked.size === 0) return Promise.resolve(true);
  unlocked = new Set();
  notify();
  return persistUnlocks();
}

/** Debug restore: replaces the unlocked set outright, filtering unknown ids. */
export function applyUnlockedIds(ids: readonly string[]): void {
  unlocked = new Set(ids.filter((id) => isKnownUnlockId(id)));
  notify();
  void persistUnlocks();
}

function sameUnlocks(next: Set<string>): boolean {
  return next.size === unlocked.size && [...next].every((id) => unlocked.has(id));
}

function parseUnlocks(value: unknown): Set<string> | null {
  if (!value || typeof value !== "object") return null;
  const body = value as { v?: unknown; unlocked?: unknown };
  if (body.v !== 1 || !Array.isArray(body.unlocked)) return null;
  return new Set(body.unlocked.filter((id): id is string => typeof id === "string" && isKnownUnlockId(id)));
}

async function persistUnlocks(): Promise<boolean> {
  return saveAuthoring("/api/tech-unlocks", STORAGE_KEY, { v: 1, unlocked: [...unlocked] });
}