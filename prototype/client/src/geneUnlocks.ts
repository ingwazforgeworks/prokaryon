import { mutationPointCount, setMutationPoints } from "./resources";
import {
  REGULATORY_EDGES,
  REGULATORY_MP_COST,
  REGULATORY_PARTS,
  type RegulatoryPart,
} from "./regulatoryParts";

/** Mutation point cost to unlock each gene on the tech tree. Genes left out are not purchasable. */
export const GENE_MP_COSTS: Readonly<Record<string, number>> = {
  FLGN: 1,
  FLGM: 1,
  CILN: 1,
  CILM: 1,
  PILN: 1,
  LUBR: 1,
  ADHN: 1,
  COHS: 1,
  BUOY: 1,
  BALA: 1,
};

/** The top-level metabolism genes every cell carries from the start of its life. */
export const DEFAULT_GENES: readonly string[] = ["ATPS", "FLUX", "FERP", "SLFP", "FERR", "SLFR"];

const defaultGenes = new Set(DEFAULT_GENES);

type Listener = () => void;

const listeners = new Set<Listener>();
let unlocked = new Set<string>();

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
  try {
    const response = await fetch("/tech-unlocks.json", { cache: "no-store" });
    if (!response.ok) return;
    const body = (await response.json()) as { v?: unknown; unlocked?: unknown };
    if (body.v !== 1 || !Array.isArray(body.unlocked)) return;
    const next = new Set(body.unlocked.filter((id): id is string => typeof id === "string" && isKnownUnlockId(id)));
    if (next.size === unlocked.size && [...next].every((id) => unlocked.has(id))) return;
    unlocked = next;
    notify();
  } catch {
    return;
  }
}

/** Clears every unlock, so a new cell starts with an empty tech tree. */
export function resetUnlocks(): void {
  if (unlocked.size === 0) return;
  unlocked = new Set();
  notify();
  void persistUnlocks();
}

/** Debug restore: replaces the unlocked set outright, filtering unknown ids. */
export function applyUnlockedIds(ids: readonly string[]): void {
  unlocked = new Set(ids.filter((id) => isKnownUnlockId(id)));
  notify();
  void persistUnlocks();
}

async function persistUnlocks(): Promise<boolean> {
  try {
    const response = await fetch("/api/tech-unlocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ v: 1, unlocked: [...unlocked] }),
    });
    return response.ok;
  } catch {
    return false;
  }
}