import {
  entryAbundance,
  entryMeter,
  readExpression,
  setCellGenomeSource,
  type Compartment,
  type ExpressionMode,
  type ExpressionReading,
  type GenomeEntryView,
  type HistoryPoint,
  type Measured,
} from "./expressionData";
import { drawFluorescence } from "./expressionFluorescence";
import { getGenome, promoterById, tagById } from "./genomeState";
import { bodyFromSnapshot, traceBodyContours, type BodyShape, type ContourPoint } from "./shape";
import { playCue } from "./uiSound";
import type { CellSnapshot } from "./types";

const METER_SCALE = 32;
const compartments = new Map<string, Compartment>();

type GeneRow = {
  item: HTMLLIElement;
  button: HTMLButtonElement;
  meter: HTMLElement;
};

let syncedCell: CellSnapshot | null = null;

export function syncExpressionCell(cell: CellSnapshot | null): void {
  syncedCell = cell;
}

export function initExpression(): void {
  const root = document.querySelector<HTMLElement>("#expression");
  const list = document.querySelector<HTMLUListElement>("#expression-genes");
  const search = document.querySelector<HTMLInputElement>("#expression-search");
  const empty = document.querySelector<HTMLElement>("#expression-empty");
  const inspector = document.querySelector<HTMLElement>("#expression-inspector");
  const cellCanvas = document.querySelector<HTMLCanvasElement>("#expression-cell");
  const rateCanvas = document.querySelector<HTMLCanvasElement>("#expression-rate");
  const abundanceCanvas = document.querySelector<HTMLCanvasElement>("#expression-abundance");
  const rateEmpty = document.querySelector<HTMLElement>("#expression-rate-empty");
  const abundanceEmpty = document.querySelector<HTMLElement>("#expression-abundance-empty");
  const isolateInput = document.querySelector<HTMLInputElement>("#expression-isolate");
  const previewButton = document.querySelector<HTMLButtonElement>("#expression-preview");
  const pauseButton = document.querySelector<HTMLButtonElement>("#expression-pause");
  const status = document.querySelector<HTMLElement>("#expression-status");
  const schematic = document.querySelector<HTMLElement>("#expression-schematic");
  const viewerEmpty = document.querySelector<HTMLElement>("#expression-viewer-empty");
  const viewport = document.querySelector<HTMLElement>("#expression-viewport");
  const rangeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-expression-range]"));
  if (!root || !list || !search || !empty || !inspector || !cellCanvas || !rateCanvas || !abundanceCanvas || !rateEmpty || !abundanceEmpty || !isolateInput || !previewButton || !pauseButton || !status || !schematic || !viewerEmpty || !viewport || rangeButtons.length !== 3) {
    throw new Error("missing expression window");
  }

  const cellContext = cellCanvas.getContext("2d");
  const rateContext = rateCanvas.getContext("2d");
  const abundanceContext = abundanceCanvas.getContext("2d");
  if (!cellContext || !rateContext || !abundanceContext) throw new Error("missing expression canvas");

  const rows = new Map<string, GeneRow>();
  let mode: ExpressionMode = "live";
  let paused = false;
  let frozenTime: number | null = null;
  let rangeSeconds: number = 30;
  let isolate = false;
  let selectedEntryId: string | null = null;
  let selectedGeneId: string | null = null;
  let selectedCopy = 0;
  let listSignature = "";
  let inspectorKey = "";
  let contourKey = "";
  let contours: ContourPoint[][] = [];
  let running = false;

  setCellGenomeSource(() =>
    getGenome().map((cassette) => {
      const promoter = promoterById(cassette.promoterId);
      return {
        geneId: cassette.geneId,
        name: cassette.name,
        tagId: cassette.routeId,
        siteId: cassette.siteId,
        promoterName: promoter?.name ?? null,
        promoterDetail: promoter?.description ?? null,
      };
    }),
  );

  const displayTime = (now: number): number => (paused && frozenTime !== null ? frozenTime : now / 1000);

  const rememberSelection = (entry: GenomeEntryView | null): void => {
    selectedEntryId = entry?.entryId ?? null;
    selectedGeneId = entry?.geneId ?? null;
    selectedCopy = entry?.copyIndex ?? 0;
  };

  const stopPointer = (event: Event): void => {
    event.stopPropagation();
  };
  root.addEventListener("pointerdown", stopPointer);
  root.addEventListener("wheel", stopPointer, { passive: true });

  const paint = (now: number): void => {
    if (root.hidden) return;
    const time = displayTime(now);
    let snapshot = readExpression({
      mode,
      cell: syncedCell,
      selectedEntryId,
      displayTime: time,
      rangeSeconds,
      compartments,
    });
    if (!snapshot.selected && selectedGeneId) {
      const carried = snapshot.entries.find((entry) => entry.geneId === selectedGeneId && entry.copyIndex === selectedCopy);
      if (carried) {
        selectedEntryId = carried.entryId;
        snapshot = readExpression({
          mode,
          cell: syncedCell,
          selectedEntryId,
          displayTime: time,
          rangeSeconds,
          compartments,
        });
      } else {
        rememberSelection(null);
      }
    }

    const signature = snapshot.entries.map((entry) => `${entry.entryId}:${entry.name}:${entry.tagId ?? "-"}:${entry.siteId ?? "-"}:${entry.promoter?.name ?? "-"}`).join("|");
    if (signature !== listSignature) {
      listSignature = signature;
      rebuildList(snapshot.entries);
    }
    applyFilter(snapshot.entries);
    for (const entry of snapshot.entries) {
      const row = rows.get(entry.entryId);
      if (!row) continue;
      const pressed = entry.entryId === snapshot.selected?.entryId ? "true" : "false";
      if (row.button.getAttribute("aria-pressed") !== pressed) row.button.setAttribute("aria-pressed", pressed);
      const meter = snapshot.cell ? entryMeter(mode, snapshot.cell.id, entry.entryId, time) : null;
      const width = meter === null ? "0%" : `${Math.min(100, (meter / METER_SCALE) * 100)}%`;
      if (row.meter.style.width !== width) row.meter.style.width = width;
      const meterLabel = meter === null ? "Expression rate not connected" : `Expression rate ${formatNumber(meter, 1)} proteins / s`;
      if (row.meter.title !== meterLabel) row.meter.title = meterLabel;
    }

    renderInspector(snapshot.selected, snapshot.reading, mode);
    renderStatus(snapshot.cell?.label ?? null, snapshot.liveTelemetry);
    renderViewer(snapshot.entries, snapshot.selected?.entryId ?? null, snapshot.cell?.id ?? null, time);
    drawSeries(rateCanvas, rateContext, rateEmpty, snapshot.reading?.rateHistory ?? { availability: "unavailable" }, rangeSeconds, "#c4a574");
    drawSeries(abundanceCanvas, abundanceContext, abundanceEmpty, snapshot.reading?.abundanceHistory ?? { availability: "unavailable" }, rangeSeconds, "#8fb4c8");
  };

  const rebuildList = (entries: GenomeEntryView[]): void => {
    rows.clear();
    list.replaceChildren();
    for (const entry of entries) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "expression-gene";
      button.setAttribute("aria-pressed", "false");
      button.title = entry.name;
      const image = document.createElement("img");
      image.src = entry.spriteUrl;
      image.alt = "";
      image.width = 32;
      image.height = 32;
      image.addEventListener("error", () => {
        image.hidden = true;
      });
      const name = document.createElement("span");
      name.className = "expression-gene-name";
      name.textContent = entry.name;
      const meta = document.createElement("span");
      meta.className = "expression-gene-meta";
      const symbol = document.createElement("span");
      symbol.textContent = entry.copyIndex > 0 ? `${entry.symbol} · ${entry.copyIndex + 1}` : entry.symbol;
      const meter = document.createElement("span");
      meter.className = "expression-meter";
      const fill = document.createElement("span");
      fill.className = "expression-meter-fill";
      meter.append(fill);
      meta.append(symbol, meter);
      button.append(image, name, meta);
      button.addEventListener("click", () => {
        rememberSelection(entry);
        playCue("select");
        paint(performance.now());
      });
      item.append(button);
      list.append(item);
      rows.set(entry.entryId, { item, button, meter: fill });
    }
  };

  const applyFilter = (entries: GenomeEntryView[]): void => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const entry of entries) {
      const row = rows.get(entry.entryId);
      if (!row) continue;
      const haystack = `${entry.name} ${entry.symbol} ${entry.category}`.toLowerCase();
      const match = query.length === 0 || haystack.includes(query);
      row.item.hidden = !match;
      if (match) shown += 1;
    }
    empty.hidden = shown > 0;
    if (entries.length === 0) empty.textContent = syncedCell ? "No genes in this cell" : "No cell selected";
    else empty.textContent = "No genes match";
  };

  const renderStatus = (label: string | null, liveTelemetry: boolean): void => {
    status.classList.toggle("is-preview", mode === "preview");
    if (!label) {
      status.textContent = "No cell";
      return;
    }
    if (mode === "preview") status.textContent = `Preview data · ${label}`;
    else if (liveTelemetry) status.textContent = `Live · ${label}`;
    else status.textContent = `${label} · Not connected`;
  };

  const renderInspector = (entry: GenomeEntryView | null, reading: ExpressionReading | null, shownMode: ExpressionMode): void => {
    const key = inspectorSignature(entry, reading, shownMode);
    if (key !== inspectorKey) {
      inspectorKey = key;
      if (!entry) {
        inspector.classList.add("is-empty");
        const message = document.createElement("p");
        message.className = "genome-detail-empty";
        message.textContent = syncedCell ? "Select a gene" : "No cell selected";
        inspector.replaceChildren(message);
      } else {
        inspector.classList.remove("is-empty");
        inspector.replaceChildren(inspectorView(entry, reading));
      }
    }
    if (!entry || !reading) return;
    setText("expression-rate-value", reading.ratePerSecond.availability === "available" ? `${formatNumber(reading.ratePerSecond.value, 1)} / s` : "—");
    setText("expression-count-value", reading.abundance.availability === "available" ? formatNumber(reading.abundance.value, 0) : "—");
  };

  const renderViewer = (entries: GenomeEntryView[], selectedId: string | null, cellId: number | null, time: number): void => {
    const body = syncedCell ? bodyFromSnapshot(syncedCell) : null;
    const nextKey = body ? bodyKey(body) : "";
    if (body && nextKey !== contourKey) {
      contourKey = nextKey;
      contours = traceBodyContours(body);
    }
    if (!body) {
      contourKey = "";
      contours = [];
    }

    const cssW = cellCanvas.clientWidth;
    const cssH = cellCanvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bitmapW = Math.max(1, Math.floor(cssW * dpr));
    const bitmapH = Math.max(1, Math.floor(cssH * dpr));
    if (cssW >= 2 && cssH >= 2 && (cellCanvas.width !== bitmapW || cellCanvas.height !== bitmapH)) {
      cellCanvas.width = bitmapW;
      cellCanvas.height = bitmapH;
    }
    cellContext.setTransform(dpr, 0, 0, dpr, 0, 0);

    const signals = entries.map((entry) => ({
      entryId: entry.entryId,
      routeId: entry.tagId,
      siteId: entry.siteId,
      abundance: cellId === null ? null : entryAbundance(mode, cellId, entry.entryId, time),
      rate: cellId === null ? null : entryMeter(mode, cellId, entry.entryId, time),
      selected: entry.entryId === selectedId,
    }));
    let drawn = false;
    if (body) drawn = drawFluorescence(cellContext, cssW, cssH, body, contours, signals, time, isolate, selectedId);
    else if (cssW >= 2 && cssH >= 2) {
      cellContext.clearRect(0, 0, cssW, cssH);
      cellContext.fillStyle = "#050708";
      cellContext.fillRect(0, 0, cssW, cssH);
    }
    const selected = entries.find((entry) => entry.entryId === selectedId) ?? null;
    const selectedAmount = selected && cellId !== null ? entryAbundance(mode, cellId, selected.entryId, time) : null;
    const selectedRate = selected && cellId !== null ? entryMeter(mode, cellId, selected.entryId, time) : null;
    schematic.hidden = cellId === null;
    if (cellId === null) schematic.textContent = "Localization not connected";
    else if (!selected) schematic.textContent = "Select a gene";
    else if (mode === "live" && (selectedAmount !== null || selectedRate !== null)) schematic.textContent = "Fluorescence";
    else schematic.textContent = "Schematic fluorescence";
    viewerEmpty.hidden = cellId !== null && drawn;
    viewerEmpty.textContent = cellId !== null ? "Shape unavailable" : "No cell selected";
  };

  search.addEventListener("input", () => paint(performance.now()));
  isolateInput.addEventListener("change", () => {
    isolate = isolateInput.checked;
    playCue("toggle");
    paint(performance.now());
  });
  previewButton.addEventListener("click", () => {
    mode = mode === "preview" ? "live" : "preview";
    previewButton.setAttribute("aria-pressed", String(mode === "preview"));
    inspectorKey = "";
    playCue("toggle");
    paint(performance.now());
  });
  pauseButton.addEventListener("click", () => {
    paused = !paused;
    frozenTime = paused ? performance.now() / 1000 : null;
    pauseButton.setAttribute("aria-pressed", String(paused));
    pauseButton.textContent = paused ? "Resume" : "Pause";
    playCue("toggle");
    paint(performance.now());
  });
  for (const button of rangeButtons) {
    button.addEventListener("click", () => {
      const seconds = Number(button.dataset.expressionRange);
      if (!Number.isFinite(seconds)) return;
      rangeSeconds = seconds;
      for (const other of rangeButtons) other.setAttribute("aria-selected", String(other === button));
      playCue("tab");
      paint(performance.now());
    });
  }

  const kick = (): void => {
    if (root.hidden) {
      running = false;
      return;
    }
    if (running) return;
    running = true;
    const loop = (now: number): void => {
      if (!running || root.hidden) {
        running = false;
        return;
      }
      paint(now);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };

  new MutationObserver(kick).observe(root, { attributes: true, attributeFilter: ["hidden"] });
  new ResizeObserver(() => paint(performance.now())).observe(viewport);
  kick();
}

function inspectorView(entry: GenomeEntryView, reading: ExpressionReading | null): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const figure = document.createElement("figure");
  figure.className = "expression-portrait";
  const image = document.createElement("img");
  image.src = entry.spriteUrl;
  image.alt = entry.name;
  image.addEventListener("error", () => {
    image.hidden = true;
  });
  figure.append(image);
  const name = document.createElement("h3");
  name.className = "genome-detail-name";
  name.textContent = entry.name;
  const meta = document.createElement("p");
  meta.className = "genome-detail-meta";
  const symbol = entry.copyIndex > 0 ? `${entry.symbol} · ${entry.copyIndex + 1}` : entry.symbol;
  meta.textContent = entry.category ? `${entry.category}  ${symbol}` : symbol;
  const copy = document.createElement("p");
  copy.className = "genome-detail-copy";
  copy.textContent = entry.description || "Not connected";
  fragment.append(figure, name, meta, copy, metric("Localization", localizationText(entry)), metric("Promoter", entry.promoter?.name ?? "Not connected"));
  if (entry.promoter) {
    const detail = document.createElement("p");
    detail.className = "expression-promoter";
    detail.textContent = entry.promoter.detail;
    fragment.append(detail);
  }
  fragment.append(metric("Expression rate (proteins / s)", "—", "expression-rate-value"), metric("Protein count", "—", "expression-count-value"));
  const distribution = document.createElement("div");
  distribution.className = "expression-distribution";
  const heading = document.createElement("p");
  heading.className = "genome-detail-meta";
  heading.textContent = "Localization distribution";
  distribution.append(heading);
  if (!reading || reading.distribution.availability === "unavailable") {
    const missing = document.createElement("p");
    missing.className = "expression-missing";
    missing.textContent = "—";
    distribution.append(missing);
  } else {
    const value = reading.distribution.value;
    distribution.append(share("Membrane", value.membrane, "membrane"), share("Cytosol", value.cytosol, "cytosol"), share("Secreted", value.secreted, "secreted"));
  }
  fragment.append(distribution);
  return fragment;
}

function localizationText(entry: GenomeEntryView): string {
  const names = [entry.tagId, entry.siteId].flatMap((id) => {
    const name = id ? tagById(id)?.name : undefined;
    return name ? [name] : [];
  });
  return names.length > 0 ? names.join(" · ") : "Cytosol";
}

function metric(label: string, value: string, valueId?: string): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "expression-metric";
  const term = document.createElement("span");
  term.textContent = label;
  const amount = document.createElement("span");
  if (valueId) amount.id = valueId;
  amount.textContent = value;
  row.append(term, amount);
  return row;
}

function share(label: string, fraction: number, compartment: Compartment): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "expression-share";
  const name = document.createElement("span");
  name.textContent = label;
  const track = document.createElement("span");
  track.className = "expression-share-track";
  const fill = document.createElement("span");
  fill.dataset.compartment = compartment;
  fill.style.width = `${Math.round(fraction * 100)}%`;
  track.append(fill);
  const percent = document.createElement("span");
  percent.textContent = `${Math.round(fraction * 100)}%`;
  row.append(name, track, percent);
  return row;
}

function inspectorSignature(entry: GenomeEntryView | null, reading: ExpressionReading | null, mode: ExpressionMode): string {
  if (!entry) return syncedCell ? "none" : "nocell";
  const rate = reading?.ratePerSecond.availability ?? "unavailable";
  const abundance = reading?.abundance.availability ?? "unavailable";
  const distribution = reading?.distribution.availability === "available"
    ? `${reading.distribution.value.membrane.toFixed(3)}:${reading.distribution.value.cytosol.toFixed(3)}:${reading.distribution.value.secreted.toFixed(3)}`
    : "unavailable";
  return `${entry.entryId}|${mode}|${entry.tagId ?? "-"}|${entry.siteId ?? "-"}|${entry.promoter?.name ?? "-"}|${rate}|${abundance}|${distribution}|${entry.description.length}`;
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node && node.textContent !== value) node.textContent = value;
}

function drawSeries(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  empty: HTMLElement,
  series: Measured<HistoryPoint[]>,
  rangeSeconds: number,
  color: string,
): void {
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  empty.hidden = series.availability === "available";
  if (cssW < 2 || cssH < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bitmapW = Math.max(1, Math.floor(cssW * dpr));
  const bitmapH = Math.max(1, Math.floor(cssH * dpr));
  if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
    canvas.width = bitmapW;
    canvas.height = bitmapH;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssW, cssH);
  if (series.availability === "unavailable") return;
  const points = [...series.value].sort((a, b) => b.age - a.age);
  if (points.length === 0) {
    empty.hidden = false;
    return;
  }
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 16;
  const plotW = Math.max(1, cssW - padL - padR);
  const plotH = Math.max(1, cssH - padT - padB);
  const peak = Math.max(...points.map((point) => point.value), 1e-6);
  const max = peak * 1.15;
  const xAt = (age: number): number => padL + ((rangeSeconds - age) / rangeSeconds) * plotW;
  const yAt = (value: number): number => padT + (1 - value / max) * plotH;
  context.font = '11px "Departure Mono", ui-monospace, monospace';
  context.strokeStyle = "rgba(150, 196, 194, 0.16)";
  context.fillStyle = "#8aa4a2";
  context.lineWidth = 1;
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (const fraction of [0, 0.5, 1]) {
    const y = yAt(max * fraction);
    context.beginPath();
    context.moveTo(padL, y);
    context.lineTo(padL + plotW, y);
    context.stroke();
    context.fillText(formatNumber(max * fraction, max >= 100 ? 0 : 1), padL - 4, y);
  }
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillText(rangeLabel(rangeSeconds), padL, padT + plotH + 3);
  context.textAlign = "right";
  context.fillText("Now", padL + plotW, padT + plotH + 3);
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = 1.5;
  let drawing = false;
  let previous = points[0];
  const gap = Math.max(rangeSeconds * 0.04, 1);
  for (const point of points) {
    if (previous && Math.abs(previous.age - point.age) > gap) drawing = false;
    const x = xAt(point.age);
    const y = yAt(point.value);
    if (!drawing) {
      context.moveTo(x, y);
      drawing = true;
    } else context.lineTo(x, y);
    previous = point;
  }
  context.stroke();
  if (points.length < 3) {
    context.fillStyle = color;
    for (const point of points) context.fillRect(xAt(point.age) - 1.5, yAt(point.value) - 1.5, 3, 3);
  }
}

function rangeLabel(seconds: number): string {
  if (seconds >= 120 && seconds % 60 === 0) return `-${seconds / 60} min`;
  return `-${seconds} s`;
}

function formatNumber(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function bodyKey(body: BodyShape): string {
  return [
    body.length.toFixed(4),
    body.width.toFixed(4),
    body.bend.toFixed(4),
    body.furrow.toFixed(3),
    body.furrowAxis.toFixed(3),
    body.morph.toFixed(3),
    body.divisionShift.toFixed(4),
    body.divisionPlace.toFixed(3),
    body.capsule.toFixed(4),
    body.crystal ? "1" : "0",
  ].join("|");
}
