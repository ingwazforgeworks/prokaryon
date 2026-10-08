/** Per-pool storage limit until the simulation reports a real capacity. */
export const STORAGE_CAPACITY = 1000;

/**
 * ATP a new cell starts with. Genome upkeep drains it toward zero in about
 * four and a half hours for a starter metabolizer, unless the cell refills it.
 */
export const STARTING_ATP = 1000;

/** Mutation points the player starts with. They are shared by the species, not stored in a cell. */
export const STARTING_MUTATION_POINTS = 100;

/** Mutation points earned when any cell of the player's species finishes dividing. */
export const MUTATION_POINTS_PER_DIVISION = 1;

export type ResourceGroup = "Energy" | "Cell" | "Fuels" | "Stocks" | "Acceptors" | "Carbon" | "Shared" | "Pigments";

export type CellResource = {
  id: string;
  name: string;
  group: ResourceGroup;
  sprite: string;
  /** Amount currently held in the cell. */
  amount: number;
  /** How much of this resource the cell can store. */
  capacity: number;
  /** Net change per second. Positive is uptake or production; negative is use. */
  rate: number;
};

export type ResourcePatch = {
  amount?: number;
  capacity?: number;
  rate?: number;
};

type CatalogEntry = {
  id: string;
  name: string;
  group: ResourceGroup;
  file: string;
};

const CATALOG: readonly CatalogEntry[] = [
  { id: "atp", name: "ATP", group: "Energy", file: "ATP.png" },
  { id: "fluxin", name: "Fluxin", group: "Energy", file: "Fluxin.png" },
  { id: "reducin", name: "Reducin", group: "Energy", file: "Reducin.png" },
  { id: "biomass", name: "Biomass", group: "Cell", file: "Biomass.png" },
  { id: "osmolyn", name: "Osmolyn", group: "Cell", file: "Osmolyn.png" },
  { id: "granulin", name: "Granulin", group: "Cell", file: "Granulin.png" },
  { id: "glycon", name: "Glycon", group: "Fuels", file: "Glycon.png" },
  { id: "lipron", name: "Lipron", group: "Fuels", file: "Lipron.png" },
  { id: "nitrox", name: "Nitrox", group: "Fuels", file: "Nitrox.png" },
  { id: "sulfex", name: "Sulfex", group: "Fuels", file: "Sulfex.png" },
  { id: "ferron", name: "Ferron", group: "Fuels", file: "Ferron.png" },
  { id: "carbohydron", name: "Carbohydron", group: "Stocks", file: "Carbohydron.png" },
  { id: "cerumen", name: "Cerumen", group: "Stocks", file: "Cerumen.png" },
  { id: "azoite", name: "Azoite", group: "Stocks", file: "Azoite.png" },
  { id: "thionite", name: "Thionite", group: "Stocks", file: "Thionite.png" },
  { id: "ferracite", name: "Ferracite", group: "Stocks", file: "Ferracite.png" },
  { id: "oxidex", name: "Oxidex", group: "Acceptors", file: "Oxidex.png" },
  { id: "fermentate", name: "Fermentate", group: "Acceptors", file: "Fermentate.png" },
  { id: "carbex", name: "Carbex", group: "Carbon", file: "Carbex.png" },
  { id: "quoron", name: "Quoron", group: "Shared", file: "Quoron.png" },
  { id: "siderin", name: "Siderin", group: "Shared", file: "Siderin.png" },
  { id: "matrixin", name: "Matrixin", group: "Shared", file: "Matrixin.png" },
  { id: "capsulin", name: "Capsulin", group: "Shared", file: "Capsulin.png" },
  { id: "lysin", name: "Lysin", group: "Shared", file: "Lysin.png" },
  { id: "ectodin", name: "Ectodin", group: "Shared", file: "Ectodin.png" },
  { id: "rhodin", name: "Rhodin", group: "Pigments", file: "Rhodin.png" },
  { id: "chlorin", name: "Chlorin", group: "Pigments", file: "Chlorin.png" },
  { id: "carotin", name: "Carotin", group: "Pigments", file: "Carotin.png" },
  { id: "phycin", name: "Phycin", group: "Pigments", file: "Phycin.png" },
];

/** Ribbon slots after ATP, filled by the stores the cell holds the most of. */
export const QUICK_RESOURCE_FOLLOWERS = 3;

/**
 * Ribbon order for one cell: ATP, then the fullest other stores.
 * Equal amounts keep catalog order, so a tie does not shuffle the strip.
 */
export function quickResourceIds(
  resources: readonly { id: string; amount: number }[],
  followers = QUICK_RESOURCE_FOLLOWERS,
): string[] {
  const ranked = resources.filter((resource) => resource.id !== "atp").slice().sort((a, b) => b.amount - a.amount);
  const ids = ["atp"];
  for (const resource of ranked) {
    if (ids.length >= 1 + followers) break;
    ids.push(resource.id);
  }
  return ids;
}

type Listener = () => void;

const listeners = new Set<Listener>();

let mutationPoints = STARTING_MUTATION_POINTS;
let population = 0;

/**
 * One cell's inventory. Amounts are not shared: each cell feeds, spends,
 * and divides from its own copy.
 */
export type CellStore = {
  resources: CellResource[];
};

const storeIndex = new WeakMap<CellStore, Map<string, CellResource>>();

function buildStore(atp: number): CellStore {
  const resources = CATALOG.map((entry) => ({
    id: entry.id,
    name: entry.name,
    group: entry.group,
    sprite: `/resources/${entry.file}`,
    amount: entry.id === "atp" ? atp : 0,
    capacity: STORAGE_CAPACITY,
    rate: 0,
  }));
  const store: CellStore = { resources };
  storeIndex.set(store, new Map(resources.map((resource) => [resource.id, resource])));
  return store;
}

/** The cell the resource bar is showing. Switching focus points this at that cell's store. */
let focusedStore = buildStore(STARTING_ATP);

export function createCellStore(atp = STARTING_ATP): CellStore {
  return buildStore(atp);
}

export function focusedCellStore(): CellStore {
  return focusedStore;
}

/** Point the resource bar at this cell's inventory. */
export function focusCellStore(store: CellStore): void {
  if (store === focusedStore) return;
  if (!storeIndex.has(store)) throw new Error("unknown cell store");
  focusedStore = store;
  emit();
}

export function storedResource(store: CellStore, id: string): CellResource | undefined {
  return storeIndex.get(store)?.get(id);
}

export function onResources(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function cellResources(): readonly CellResource[] {
  return focusedStore.resources;
}

export function mutationPointCount(): number {
  return mutationPoints;
}

export function populationCount(): number {
  return population;
}

export function setMutationPoints(count: number): void {
  const next = Math.max(0, Math.round(count));
  if (next === mutationPoints) return;
  mutationPoints = next;
  emit();
}

/** Add mutation points. Division of a species cell grants one. */
export function grantMutationPoints(count: number): void {
  if (!(count > 0)) return;
  setMutationPoints(mutationPointCount() + count);
}

export function setPopulation(count: number): void {
  const next = Math.max(0, Math.round(count));
  if (next === population) return;
  population = next;
  emit();
}

export function updateCellResource(store: CellStore, id: string, patch: ResourcePatch): void {
  const resource = storedResource(store, id);
  if (!resource) throw new Error(`unknown resource ${id}`);
  let changed = false;
  if (patch.amount !== undefined && patch.amount !== resource.amount) {
    resource.amount = patch.amount;
    changed = true;
  }
  if (patch.capacity !== undefined && patch.capacity !== resource.capacity) {
    resource.capacity = Math.max(0, patch.capacity);
    changed = true;
  }
  if (patch.rate !== undefined && patch.rate !== resource.rate) {
    resource.rate = patch.rate;
    changed = true;
  }
  if (changed && store === focusedStore) emit();
}

/** Patch the cell the resource bar is showing. */
export function updateResource(id: string, patch: ResourcePatch): void {
  updateCellResource(focusedStore, id, patch);
}

/**
 * Halve every stored amount. The parent keeps one half and the returned store
 * is the daughter's half. Storage limits stay with each body; they are not
 * amounts to divide. Rates clear until the next economy step writes them.
 */
export function splitCellStore(parent: CellStore): CellStore {
  if (!storeIndex.has(parent)) throw new Error("unknown cell store");
  const daughter = buildStore(0);
  for (const resource of parent.resources) {
    const half = resource.amount * 0.5;
    resource.amount = half;
    resource.rate = 0;
    const born = storedResource(daughter, resource.id);
    if (!born) continue;
    born.amount = half;
    born.capacity = resource.capacity;
  }
  if (parent === focusedStore) emit();
  return daughter;
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "−" : "";
  const abs = Math.abs(rounded);
  if (abs >= 100000) return `${sign}${Math.round(abs / 1000)}k`;
  return `${sign}${abs}`;
}

/**
 * Rates smaller than this read as flat. A quarter of microexpression upkeep,
 * so the scaled expression drain still shows on the resource bar.
 */
export const RATE_DISPLAY_FLOOR = 0.001;

export function formatRate(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < RATE_DISPLAY_FLOOR) return "0";
  const sign = value > 0 ? "+" : "−";
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 1 ? 1 : 3;
  return `${sign}${abs.toFixed(digits)}/s`;
}

export function storageFraction(amount: number, capacity: number): number {
  if (!(capacity > 0) || !Number.isFinite(amount)) return 0;
  return Math.min(1, Math.max(0, amount / capacity));
}
