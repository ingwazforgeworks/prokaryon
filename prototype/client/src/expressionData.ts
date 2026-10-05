import { GENES, type GeneRecord } from "./genes";
import type { CellSnapshot } from "./types";

/** Where a protein is drawn. Secreted is reserved for a real localization tag. */
export type Compartment = "membrane" | "cytosol" | "secreted";

export type ExpressionMode = "live" | "preview";

export type Measured<T> = { availability: "available"; value: T } | { availability: "unavailable" };

export interface LocalizationDistribution {
  membrane: number;
  cytosol: number;
  secreted: number;
}

/** Age is seconds before the display clock. 0 is the newest sample. */
export interface HistoryPoint {
  age: number;
  value: number;
}

export interface PromoterInfo {
  name: string;
  detail: string;
}

export interface GenomeEntryView {
  entryId: string;
  geneId: string;
  copyIndex: number;
  name: string;
  symbol: string;
  category: string;
  description: string;
  spriteUrl: string;
  /** Destination tag. Null means no destination was chosen. */
  tagId: string | null;
  /** Position tag. Null when the protein has no body-site tag, including cytosolic. */
  siteId: string | null;
  /**
   * Compartment used for the distribution summary.
   * Envelope tags count as membrane. This is the tag, not a measured fraction.
   */
  schematicCompartment: Compartment | null;
  promoter: PromoterInfo | null;
}

export interface ExpressionReading {
  ratePerSecond: Measured<number>;
  abundance: Measured<number>;
  distribution: Measured<LocalizationDistribution>;
  rateHistory: Measured<HistoryPoint[]>;
  abundanceHistory: Measured<HistoryPoint[]>;
}

export interface ExpressionCellView {
  id: number;
  label: string;
  length: number;
  width: number;
  bend: number;
  furrow: number;
  furrowAxis: number;
  morph: number;
  divisionShift: number;
  divisionPlace: number;
  capsule: number;
}

export interface ExpressionSnapshot {
  mode: ExpressionMode;
  /** True only while preview numbers are on screen. Morphology stays real in both modes. */
  preview: boolean;
  cell: ExpressionCellView | null;
  entries: GenomeEntryView[];
  selected: GenomeEntryView | null;
  reading: ExpressionReading | null;
  /** True when at least one live sample has been published for this cell. */
  liveTelemetry: boolean;
}

export interface ExpressionSampleInput {
  /** Monotonic seconds. The display pause does not stop recording. */
  time: number;
  ratePerSecond?: number;
  abundance?: number;
  distribution?: LocalizationDistribution;
}

export interface GenomeSourceEntry {
  geneId: string;
  copyIndex?: number;
  name?: string | null;
  tagId?: string | null;
  siteId?: string | null;
  promoterName?: string | null;
  promoterDetail?: string | null;
}

export interface ExpressionQuery {
  mode: ExpressionMode;
  cell: CellSnapshot | null;
  selectedEntryId: string | null;
  /** Right edge of the charts. Frozen while the monitoring display is paused. */
  displayTime: number;
  rangeSeconds: number;
  compartments: ReadonlyMap<string, Compartment>;
}

const HISTORY_LIMIT_SECONDS = 600;
const HISTORY_LIMIT_COUNT = 1500;
const PREVIEW_STEPS = 96;

const genesById = new Map<string, GeneRecord>(GENES.map((gene) => [gene.id, gene]));
const history = new Map<string, ExpressionSampleInput[]>();

/**
 * Optional per-cell genome. Return null to keep the catalog stand-in.
 * An empty array is an empty genome.
 */
let genomeSource: ((cellId: number) => readonly GenomeSourceEntry[] | null) | null = null;

export function setCellGenomeSource(source: ((cellId: number) => readonly GenomeSourceEntry[] | null) | null): void {
  genomeSource = source;
}

export function proteinSpriteUrl(geneId: string): string {
  return `/ui/genome_viewer/proteins/named/individuals_32x32/${encodeURIComponent(geneId)}.png`;
}

export function expressionEntryId(cellId: number, geneId: string, copyIndex: number): string {
  return `${cellId}:${geneId}:${copyIndex}`;
}

/**
 * Future expression telemetry connects here.
 * Samples are stored per cell and genome entry. Nothing in the lab publishes them yet,
 * so live mode stays empty until a recorder calls this. History is not backfilled.
 */
export function publishExpressionSample(cellId: number, entryId: string, sample: ExpressionSampleInput): void {
  const key = historyKey(cellId, entryId);
  const list = history.get(key) ?? [];
  list.push(sample);
  const newest = sample.time;
  while (list.length > 1 && (list.length > HISTORY_LIMIT_COUNT || newest - (list[0]?.time ?? newest) > HISTORY_LIMIT_SECONDS)) {
    list.shift();
  }
  history.set(key, list);
}

export function clearExpressionHistory(cellId?: number): void {
  if (cellId === undefined) {
    history.clear();
    return;
  }
  const prefix = `${cellId}:`;
  for (const key of history.keys()) {
    if (key.startsWith(prefix)) history.delete(key);
  }
}

/**
 * Art-catalog sprite class. M and R include a bilayer; I and P do not.
 * The index describes the drawing, not a vault localization tag.
 */
export function compartmentFromArtType(type: string): Compartment | null {
  if (type === "M" || type === "R") return "membrane";
  if (type === "I" || type === "P") return "cytosol";
  return null;
}

export async function loadArtCompartments(): Promise<Map<string, Compartment>> {
  const map = new Map<string, Compartment>();
  try {
    const response = await fetch("/ui/genome_viewer/proteins/named/gene_index.json");
    if (!response.ok) return map;
    const body = (await response.json()) as { sheets?: Array<{ genes?: Array<{ code?: string; type?: string }> }> };
    for (const sheet of body.sheets ?? []) {
      for (const gene of sheet.genes ?? []) {
        if (!gene.code || !gene.type) continue;
        const compartment = compartmentFromArtType(gene.type);
        if (compartment) map.set(gene.code, compartment);
      }
    }
  } catch {
    return map;
  }
  return map;
}

/** Protein on hand. Null means abundance is not connected, which is not a zero. */
export function entryAbundance(mode: ExpressionMode, cellId: number, entryId: string, displayTime: number): number | null {
  if (mode === "preview") return previewAbundance(entryId, displayTime);
  const list = history.get(historyKey(cellId, entryId));
  if (!list) return null;
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const sample = list[index];
    if (!sample || sample.time > displayTime + 1e-6) continue;
    if (typeof sample.abundance === "number") return sample.abundance;
  }
  return null;
}

/** List-row expression indicator. Null means the rate is not connected, which is not a zero. */
export function entryMeter(mode: ExpressionMode, cellId: number, entryId: string, displayTime: number): number | null {
  if (mode === "preview") return previewRate(entryId, displayTime);
  const list = history.get(historyKey(cellId, entryId));
  if (!list) return null;
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const sample = list[index];
    if (!sample || sample.time > displayTime + 1e-6) continue;
    if (typeof sample.ratePerSecond === "number") return sample.ratePerSecond;
  }
  return null;
}

export function readExpression(query: ExpressionQuery): ExpressionSnapshot {
  const cell = query.cell ? cellView(query.cell) : null;
  const entries = cell ? genomeEntries(cell.id, query) : [];
  const selected = entries.find((entry) => entry.entryId === query.selectedEntryId) ?? null;
  const reading = cell && selected ? readingFor(query.mode, cell.id, selected, query.displayTime, query.rangeSeconds) : null;
  return {
    mode: query.mode,
    preview: query.mode === "preview",
    cell,
    entries,
    selected,
    reading,
    liveTelemetry: cell ? cellHasTelemetry(cell.id) : false,
  };
}

function cellView(cell: CellSnapshot): ExpressionCellView {
  return {
    id: cell.id,
    label: `Cell ${String(cell.id).padStart(3, "0")}`,
    length: cell.length,
    width: cell.width,
    bend: cell.bend ?? 0,
    furrow: cell.furrow ?? 0,
    furrowAxis: cell.furrowAxis ?? 0,
    morph: cell.morph ?? 0,
    divisionShift: cell.divisionShift ?? 0,
    divisionPlace: cell.divisionPlace ?? 0,
    capsule: cell.capsule,
  };
}

function genomeEntries(cellId: number, _query: ExpressionQuery): GenomeEntryView[] {
  const source = sourceEntries(cellId);
  const entries: GenomeEntryView[] = [];
  for (const item of source) {
    const gene = genesById.get(item.geneId);
    const entryId = expressionEntryId(cellId, item.geneId, item.copyIndex);
    entries.push({
      entryId,
      geneId: item.geneId,
      copyIndex: item.copyIndex,
      name: item.name || gene?.name || item.geneId,
      symbol: item.geneId,
      category: gene?.category ?? "",
      description: gene?.description ?? "",
      spriteUrl: proteinSpriteUrl(item.geneId),
      tagId: item.tagId ?? null,
      siteId: item.siteId ?? null,
      schematicCompartment: compartmentForTag(item.tagId ?? null, item.siteId ?? null),
      promoter: item.promoterName ? { name: item.promoterName, detail: item.promoterDetail ?? "" } : null,
    });
  }
  return entries;
}

function compartmentForTag(routeId: string | null, siteId: string | null): Compartment {
  if (routeId === "SecretoryPeptide") return "secreted";
  if (routeId === "CYTO") return "cytosol";
  if (routeId || siteId) return "membrane";
  return "cytosol";
}

function sourceEntries(cellId: number): Array<GenomeSourceEntry & { copyIndex: number }> {
  const provided = genomeSource ? genomeSource(cellId) : null;
  if (provided) {
    const seen = new Map<string, number>();
    return provided.map((entry) => {
      const next = seen.get(entry.geneId) ?? 0;
      const copyIndex = entry.copyIndex ?? next;
      seen.set(entry.geneId, Math.max(next, copyIndex) + 1);
      return { ...entry, copyIndex };
    });
  }
  return GENES.map((gene) => ({ geneId: gene.id, copyIndex: 0, tagId: null }));
}

function readingFor(mode: ExpressionMode, cellId: number, entry: GenomeEntryView, displayTime: number, rangeSeconds: number): ExpressionReading {
  if (mode === "preview") return previewReading(entry, displayTime, rangeSeconds);
  return liveReading(cellId, entry.entryId, displayTime, rangeSeconds);
}

function previewReading(entry: GenomeEntryView, displayTime: number, rangeSeconds: number): ExpressionReading {
  const rate = previewRate(entry.entryId, displayTime);
  const abundance = previewAbundance(entry.entryId, displayTime);
  const step = rangeSeconds / PREVIEW_STEPS;
  const ratePoints: HistoryPoint[] = [];
  const abundancePoints: HistoryPoint[] = [];
  for (let index = 0; index <= PREVIEW_STEPS; index += 1) {
    const age = rangeSeconds - index * step;
    const time = displayTime - age;
    ratePoints.push({ age, value: previewRate(entry.entryId, time) });
    abundancePoints.push({ age, value: previewAbundance(entry.entryId, time) });
  }
  return {
    ratePerSecond: available(rate),
    abundance: available(abundance),
    distribution: entry.schematicCompartment ? available(distributionFor(entry.schematicCompartment)) : unavailable(),
    rateHistory: available(ratePoints),
    abundanceHistory: available(abundancePoints),
  };
}

function liveReading(cellId: number, entryId: string, displayTime: number, rangeSeconds: number): ExpressionReading {
  const samples = samplesInWindow(cellId, entryId, displayTime, rangeSeconds);
  const newest = samples.length > 0 ? samples[samples.length - 1] : undefined;
  const ratePoints = points(samples, displayTime, (sample) => sample.ratePerSecond);
  const abundancePoints = points(samples, displayTime, (sample) => sample.abundance);
  const distribution = newest?.distribution;
  return {
    ratePerSecond: typeof newest?.ratePerSecond === "number" ? available(newest.ratePerSecond) : unavailable(),
    abundance: typeof newest?.abundance === "number" ? available(newest.abundance) : unavailable(),
    distribution: distribution ? available(distribution) : unavailable(),
    rateHistory: ratePoints.length > 0 ? available(ratePoints) : unavailable(),
    abundanceHistory: abundancePoints.length > 0 ? available(abundancePoints) : unavailable(),
  };
}

function samplesInWindow(cellId: number, entryId: string, displayTime: number, rangeSeconds: number): ExpressionSampleInput[] {
  const list = history.get(historyKey(cellId, entryId)) ?? [];
  const start = displayTime - rangeSeconds;
  return list.filter((sample) => sample.time >= start && sample.time <= displayTime + 1e-6);
}

function points(samples: ExpressionSampleInput[], displayTime: number, read: (sample: ExpressionSampleInput) => number | undefined): HistoryPoint[] {
  const result: HistoryPoint[] = [];
  for (const sample of samples) {
    const value = read(sample);
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    result.push({ age: displayTime - sample.time, value });
  }
  return result;
}

function cellHasTelemetry(cellId: number): boolean {
  const prefix = `${cellId}:`;
  for (const [key, samples] of history) {
    if (key.startsWith(prefix) && samples.length > 0) return true;
  }
  return false;
}

function distributionFor(compartment: Compartment): LocalizationDistribution {
  return {
    membrane: compartment === "membrane" ? 1 : 0,
    cytosol: compartment === "cytosol" ? 1 : 0,
    secreted: compartment === "secreted" ? 1 : 0,
  };
}

function previewRate(entryId: string, time: number): number {
  const mixed = hash(entryId);
  const base = 6 + (mixed % 1800) / 100;
  const amp = 1.2 + ((mixed >>> 8) % 500) / 100;
  const period = 9 + ((mixed >>> 16) % 1400) / 100;
  const phase = ((mixed >>> 4) % 628) / 100;
  return Math.max(0.4, base + amp * Math.sin((time / period) * Math.PI * 2 + phase));
}

function previewAbundance(entryId: string, time: number): number {
  const mixed = hash(entryId);
  const base = 6 + (mixed % 1800) / 100;
  const amp = 1.2 + ((mixed >>> 8) % 500) / 100;
  const period = 9 + ((mixed >>> 16) % 1400) / 100;
  const phase = ((mixed >>> 4) % 628) / 100;
  const omega = (Math.PI * 2) / period;
  const turnover = 0.08;
  const gain = 1 / Math.hypot(turnover, omega);
  const lag = Math.atan2(omega, turnover);
  return Math.max(1, base / turnover + amp * gain * Math.sin(omega * time + phase - lag));
}

function available<T>(value: T): Measured<T> {
  return { availability: "available", value };
}

function unavailable<T>(): Measured<T> {
  return { availability: "unavailable" };
}

function historyKey(cellId: number, entryId: string): string {
  return `${cellId}:${entryId}`;
}

function hash(value: string): number {
  let mixed = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    mixed ^= value.charCodeAt(index);
    mixed = Math.imul(mixed, 16777619);
  }
  return mixed >>> 0;
}
