/** Per-pool storage limit until the simulation reports a real capacity. */
export const STORAGE_CAPACITY = 1000;

/** Mutation points a new cell starts with. */
export const STARTING_MUTATION_POINTS = 100;

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

/** Resources pinned to the top-bar strip, in display order. */
export const QUICK_RESOURCE_IDS = ["atp", "fluxin", "carbex", "sulfex", "oxidex"] as const;

type Listener = () => void;

const listeners = new Set<Listener>();

let mutationPoints = STARTING_MUTATION_POINTS;
let population = 0;
const resources: CellResource[] = CATALOG.map((entry) => ({
  id: entry.id,
  name: entry.name,
  group: entry.group,
  sprite: `/resources/${entry.file}`,
  amount: 0,
  capacity: STORAGE_CAPACITY,
  rate: 0,
}));
const byId = new Map(resources.map((resource) => [resource.id, resource]));

export function onResources(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function cellResources(): readonly CellResource[] {
  return resources;
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

export function setPopulation(count: number): void {
  const next = Math.max(0, Math.round(count));
  if (next === population) return;
  population = next;
  emit();
}

export function updateResource(id: string, patch: ResourcePatch): void {
  const resource = byId.get(id);
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
  if (changed) emit();
}

export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "−" : "";
  const abs = Math.abs(rounded);
  if (abs >= 100000) return `${sign}${Math.round(abs / 1000)}k`;
  return `${sign}${abs}`;
}

export function formatRate(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 0.05) return "0";
  const sign = value > 0 ? "+" : "−";
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : 1;
  return `${sign}${abs.toFixed(digits)}/s`;
}

export function storageFraction(amount: number, capacity: number): number {
  if (!(capacity > 0) || !Number.isFinite(amount)) return 0;
  return Math.min(1, Math.max(0, amount / capacity));
}
