import { applyUnlockedIds, unlockedGeneIds } from "./geneUnlocks";
import { applySnapshot, persistGenome, snapshot, type GenomeSnapshot } from "./genomeState";
import { cellResources, mutationPointCount, setMutationPoints, updateResource } from "./resources";

/**
 * Debug-only cell snapshot kept in localStorage, so the New Cell reset cannot
 * touch it. One slot is enough: this exists so iteration does not force a
 * re-unlock and re-assembly of the same organism every run.
 */
const STORAGE_KEY = "prokaryon:debug-cell-state";
const STATE_VERSION = 1;

type SavedCellState = {
  v: number;
  genome: GenomeSnapshot;
  unlocked: string[];
  mutationPoints: number;
  resources: { id: string; amount: number }[];
};

export function saveCellState(): boolean {
  const state: SavedCellState = {
    v: STATE_VERSION,
    genome: snapshot(),
    unlocked: [...unlockedGeneIds()],
    mutationPoints: mutationPointCount(),
    resources: cellResources().map((resource) => ({ id: resource.id, amount: resource.amount })),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadCellState(): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== "object") return false;
  const state = parsed as Partial<SavedCellState>;
  if (state.v !== STATE_VERSION || !state.genome) return false;
  applySnapshot(state.genome);
  applyUnlockedIds(Array.isArray(state.unlocked) ? state.unlocked : []);
  if (typeof state.mutationPoints === "number" && Number.isFinite(state.mutationPoints)) {
    setMutationPoints(state.mutationPoints);
  }
  if (Array.isArray(state.resources)) {
    for (const item of state.resources) {
      if (!item || typeof item !== "object") continue;
      const entry = item as { id?: unknown; amount?: unknown };
      if (typeof entry.id !== "string" || typeof entry.amount !== "number" || !Number.isFinite(entry.amount)) continue;
      try {
        updateResource(entry.id, { amount: entry.amount });
      } catch {
        // Resource ids can change between builds; unknown ids are skipped.
      }
    }
  }
  // Keep the on-disk session files in step, so a plain reload also restores.
  void persistGenome();
  return true;
}