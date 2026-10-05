import { createUiSound, playUiSound, UI_HOVER, UI_SELECT } from "./uiSound";
import {
  QUICK_RESOURCE_IDS,
  cellResources,
  formatAmount,
  formatRate,
  mutationPointCount,
  onResources,
  populationCount,
  storageFraction,
  type CellResource,
} from "./resources";

/** Left, top, width, and height of the source canvas inside the chip, in percent. Each one fits that sprite's artwork. */
const GLYPH_BOX: Record<string, readonly [number, number, number, number]> = {
  atp: [-40.6, -33.1, 181.2, 161.2],
  azoite: [-43.1, -33.1, 181.2, 161.2],
  biomass: [-43.1, -33.1, 181.2, 161.2],
  capsulin: [-43.1, -33.1, 181.2, 161.2],
  carbex: [-43.1, -30.6, 181.2, 161.2],
  carbohydron: [-43.1, -30.6, 181.2, 161.2],
  carotin: [-43.1, -33.1, 181.2, 161.2],
  cerumen: [-43.1, -30.6, 181.2, 161.2],
  chlorin: [-38, -33.1, 181.2, 161.2],
  ectodin: [-43.1, -30.6, 181.2, 161.2],
  fermentate: [-40.6, -33.1, 181.2, 161.2],
  ferracite: [-40.6, -33.1, 181.2, 161.2],
  ferron: [-46.8, -43.5, 193.5, 172.2],
  fluxin: [-47.4, -39.3, 190.3, 169.3],
  glycon: [-63.4, -48.1, 213.9, 190.2],
  granulin: [-43.1, -28.1, 181.2, 161.2],
  lipron: [-22, -24.8, 146.2, 146.2],
  lysin: [-38, -33.1, 181.2, 161.2],
  matrixin: [-40.6, -33.1, 181.2, 161.2],
  nitrox: [-53.8, -44.1, 202.8, 180.4],
  osmolyn: [-40.6, -33.1, 181.2, 161.2],
  oxidex: [-31.5, -25, 162.4, 144.4],
  phycin: [-43.1, -33.1, 181.2, 161.2],
  quoron: [-40.6, -33.1, 181.2, 161.2],
  reducin: [-40.6, -33.1, 181.2, 161.2],
  rhodin: [-40.6, -33.1, 181.2, 161.2],
  siderin: [-40.6, -33.1, 181.2, 161.2],
  sulfex: [-34.9, -28.6, 169.6, 150.9],
  thionite: [-43.1, -33.1, 181.2, 161.2],
};

type Row = {
  root: HTMLElement;
  held: HTMLElement;
  capacity: HTMLElement;
  rate: HTMLElement;
  meter: HTMLElement;
};

export function initResourceBar(): void {
  const bar = document.querySelector<HTMLElement>("#resource-bar");
  const quick = document.querySelector<HTMLElement>("#resource-quick");
  const expand = document.querySelector<HTMLButtonElement>("#resource-expand");
  const panel = document.querySelector<HTMLElement>("#resource-pool");
  const close = document.querySelector<HTMLButtonElement>("#resource-pool-close");
  const summary = document.querySelector<HTMLElement>("#resource-pool-summary");
  const body = document.querySelector<HTMLElement>("#resource-pool-body");
  if (!bar || !quick || !expand || !panel || !close || !summary || !body) {
    throw new Error("missing resource bar");
  }

  const hoverSound = createUiSound(UI_HOVER);
  const clickSound = createUiSound(UI_SELECT);
  const quickValues = new Map<string, HTMLElement>();
  const rows = new Map<string, Row>();

  const mutationChip = iconChip("Mutation points", "/ui/genome_viewer/dna_icon_32x32.png");
  const populationChip = chip("Population", "POP");
  quick.append(mutationChip.root, populationChip.root);
  quickValues.set("mutation", mutationChip.value);
  quickValues.set("population", populationChip.value);

  for (const id of QUICK_RESOURCE_IDS) {
    const resource = cellResources().find((entry) => entry.id === id);
    if (!resource) throw new Error(`missing quick resource ${id}`);
    const built = resourceChip(resource);
    if (id === QUICK_RESOURCE_IDS[0]) built.root.classList.add("resource-split");
    quick.append(built.root);
    quickValues.set(id, built.value);
  }

  let shownGroup = "";
  for (const resource of cellResources()) {
    if (resource.group !== shownGroup) {
      shownGroup = resource.group;
      const heading = document.createElement("div");
      heading.className = "resource-group";
      heading.textContent = resource.group;
      body.append(heading);
    }
    body.append(buildRow(resource, rows));
  }

  const paint = (): void => {
    const points = mutationPointCount();
    const colony = populationCount();
    writeChip(quickValues.get("mutation"), "Mutation points", points);
    writeChip(quickValues.get("population"), "Population", colony);
    for (const resource of cellResources()) {
      const value = quickValues.get(resource.id);
      if (value) writeResourceChip(value, resource);
      const row = rows.get(resource.id);
      if (!row) continue;
      const held = formatAmount(resource.amount);
      const capacity = formatAmount(resource.capacity);
      const rate = formatRate(resource.rate);
      row.held.textContent = held;
      row.capacity.textContent = capacity;
      row.rate.textContent = rate;
      row.rate.dataset.sign = resource.rate > 0.05 ? "up" : resource.rate < -0.05 ? "down" : "flat";
      row.meter.style.width = `${storageFraction(resource.amount, resource.capacity) * 100}%`;
      row.root.setAttribute("aria-label", `${resource.name}, held ${held}, capacity ${capacity}, net ${rate}`);
    }
    summary.replaceChildren(summaryStat("Mutation points", points), summaryStat("Population", colony));
  };

  const setOpen = (open: boolean): void => {
    panel.hidden = !open;
    expand.setAttribute("aria-expanded", open ? "true" : "false");
    expand.setAttribute("aria-label", open ? "Hide resource pool" : "Show resource pool");
  };

  expand.addEventListener("pointerenter", () => playUiSound(hoverSound));
  close.addEventListener("pointerenter", () => playUiSound(hoverSound));
  bar.addEventListener("click", () => {
    playUiSound(clickSound);
    setOpen(panel.hidden);
  });
  close.addEventListener("click", () => {
    playUiSound(clickSound);
    setOpen(false);
  });
  document.addEventListener("pointerdown", (event) => {
    if (panel.hidden) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (panel.contains(target) || bar.contains(target)) return;
    setOpen(false);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat || panel.hidden) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    event.preventDefault();
    setOpen(false);
    playUiSound(clickSound);
  });

  onResources(paint);
  paint();
  setOpen(false);
}

function placeGlyph(img: HTMLImageElement, id: string): void {
  const box = GLYPH_BOX[id];
  if (!box) return;
  img.style.left = `${box[0]}%`;
  img.style.top = `${box[1]}%`;
  img.style.width = `${box[2]}%`;
  img.style.height = `${box[3]}%`;
}

function iconChip(label: string, src: string): { root: HTMLElement; value: HTMLElement } {
  const root = document.createElement("span");
  root.className = "resource-chip";
  const img = document.createElement("img");
  img.className = "resource-badge";
  img.src = src;
  img.alt = "";
  img.draggable = false;
  const value = document.createElement("span");
  value.className = "resource-value";
  root.append(img, value);
  root.title = label;
  return { root, value };
}

function chip(label: string, tag: string): { root: HTMLElement; value: HTMLElement } {
  const root = document.createElement("span");
  root.className = "resource-chip";
  const mark = document.createElement("span");
  mark.className = "resource-tag";
  mark.textContent = tag;
  const value = document.createElement("span");
  value.className = "resource-value";
  root.append(mark, value);
  root.title = label;
  return { root, value };
}

function resourceChip(resource: CellResource): { root: HTMLElement; value: HTMLElement } {
  const root = document.createElement("span");
  root.className = "resource-chip";
  const frame = document.createElement("span");
  frame.className = "resource-glyph";
  const img = document.createElement("img");
  img.src = resource.sprite;
  img.alt = "";
  img.draggable = false;
  placeGlyph(img, resource.id);
  frame.append(img);
  const value = document.createElement("span");
  value.className = "resource-value";
  root.append(frame, value);
  root.title = resource.name;
  return { root, value };
}

function writeChip(value: HTMLElement | undefined, label: string, amount: number): void {
  if (!value) return;
  value.textContent = formatAmount(amount);
  const chipRoot = value.parentElement;
  if (chipRoot) chipRoot.setAttribute("aria-label", `${label} ${formatAmount(amount)}`);
}

function writeResourceChip(value: HTMLElement, resource: CellResource): void {
  value.textContent = formatAmount(resource.amount);
  const chipRoot = value.parentElement;
  if (!chipRoot) return;
  chipRoot.title = `${resource.name} · ${formatAmount(resource.amount)} / ${formatAmount(resource.capacity)} · ${formatRate(resource.rate)}`;
  chipRoot.setAttribute("aria-label", chipRoot.title);
}

function summaryStat(label: string, amount: number): HTMLElement {
  const item = document.createElement("p");
  item.className = "resource-summary-stat";
  const name = document.createElement("span");
  name.textContent = label;
  const value = document.createElement("span");
  value.textContent = formatAmount(amount);
  item.append(name, value);
  return item;
}

function buildRow(resource: CellResource, rows: Map<string, Row>): HTMLElement {
  const row = document.createElement("div");
  row.className = "resource-row";
  row.setAttribute("role", "row");

  const frame = document.createElement("span");
  frame.className = "resource-glyph";
  const img = document.createElement("img");
  img.src = resource.sprite;
  img.alt = "";
  img.draggable = false;
  placeGlyph(img, resource.id);
  frame.append(img);

  const name = document.createElement("span");
  name.className = "resource-name";
  name.textContent = resource.name;

  const heldWrap = document.createElement("span");
  heldWrap.className = "resource-held";
  const held = document.createElement("span");
  const meterTrack = document.createElement("span");
  meterTrack.className = "resource-meter";
  const meter = document.createElement("span");
  meterTrack.append(meter);
  heldWrap.append(held, meterTrack);

  const capacity = document.createElement("span");
  capacity.className = "resource-num";
  const rate = document.createElement("span");
  rate.className = "resource-num resource-rate";

  row.append(frame, name, heldWrap, capacity, rate);
  rows.set(resource.id, { root: row, held, capacity, rate, meter });
  return row;
}
