import { formatLightUe } from "./light";
import { formatPressureAtm } from "./pressure";
import type { EnvironmentReading } from "./renderer";

const NUTRIENT_COLORS: Record<string, string> = {
  Sulfex: "#e0c56a",
  Ferron: "#f08a4a",
  Nitrox: "#7ec0e8",
  Osmolyn: "#9ee6c7",
  Oxidex: "#d5dde2",
};

/** Below this, the nutrient is treated as absent and the row is dimmed. */
const PRESENT = 0.002;
/** Axis length of the 45° lead, in CSS pixels. */
const DIAG = 40;
/** Vertical run after the corner. Shorter than the diagonal, long enough to clear the card shadow. */
const STEM = 22;
/** Where the vertical run meets the tooltip edge, in from the near corner. */
const INSET = 12;
const MARGIN = 12;

type Aim = { x: 1 | -1; y: -1 | 1 };

interface Callout {
  left: number;
  top: number;
  x0: number;
  y0: number;
  elbowX: number;
  elbowY: number;
  tipX: number;
  tipY: number;
}

/** Top-right first, then the other side, then below. */
const AIMS: readonly Aim[] = [
  { x: 1, y: -1 },
  { x: -1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

export function createEnvironmentProbe(
  read: (clientX: number, clientY: number) => EnvironmentReading | null,
) {
  const panel = document.createElement("aside");
  panel.id = "env-probe";
  panel.setAttribute("aria-hidden", "true");

  const title = document.createElement("div");
  title.className = "env-probe-title";
  title.textContent = "Environment";

  const temperature = row("Temperature");
  const pressure = row("Pressure");
  const light = row("Light");
  const uv = row("UV");

  const nutrients = document.createElement("div");
  nutrients.className = "env-probe-nutrients";
  const nutrientLabel = document.createElement("div");
  nutrientLabel.className = "env-probe-label";
  nutrientLabel.textContent = "Nutrients";
  nutrients.append(nutrientLabel);

  panel.append(title, temperature.line, pressure.line, light.line, uv.line, nutrients);
  const leader = document.createElement("div");
  leader.id = "env-probe-leader";
  leader.setAttribute("aria-hidden", "true");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  svg.append(poly);
  leader.append(svg);
  document.body.append(leader, panel);

  const nutrientRows = new Map<string, ReturnType<typeof row>>();
  let enabled = false;
  let inside = false;
  let pointerX = 0;
  let pointerY = 0;
  let shown = "";

  const hide = (): void => {
    if (!panel.classList.contains("on") && !leader.classList.contains("on")) return;
    panel.classList.remove("on");
    leader.classList.remove("on");
    shown = "";
  };

  const place = (): void => {
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    if (width <= 0 || height <= 0) return;
    const box = chooseCallout(pointerX, pointerY, width, height);
    panel.style.left = `${box.left}px`;
    panel.style.top = `${box.top}px`;
    svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    poly.setAttribute("points", `${box.x0},${box.y0} ${box.elbowX},${box.elbowY} ${box.tipX},${box.tipY}`);
    leader.classList.add("on");
  };

  const paint = (reading: EnvironmentReading): void => {
    const lines = [
      reading.temperature === null ? "—" : `${reading.temperature.toFixed(1)}°C`,
      formatPressureAtm(reading.pressure),
      formatLightUe(reading.light),
      formatLightUe(reading.uv),
    ];
    const nutrientText = reading.nutrients.map((nutrient) => {
      const amount = clamp01(nutrient.amount);
      return `${nutrient.name} ${formatNutrient(amount)}`;
    });
    const key = `${lines.join("|")}|${nutrientText.join("|")}`;
    if (key !== shown) {
      shown = key;
      temperature.value.textContent = lines[0];
      pressure.value.textContent = lines[1];
      light.value.textContent = lines[2];
      uv.value.textContent = lines[3];
      for (const nutrient of reading.nutrients) {
        let entry = nutrientRows.get(nutrient.name);
        if (!entry) {
          entry = row(nutrient.name);
          nutrientRows.set(nutrient.name, entry);
          nutrients.append(entry.line);
        }
        const amount = clamp01(nutrient.amount);
        const present = amount >= PRESENT;
        entry.line.classList.toggle("is-empty", !present);
        entry.name.style.color = present ? (NUTRIENT_COLORS[nutrient.name] ?? "") : "";
        entry.value.textContent = formatNutrient(amount);
      }
    }
    panel.classList.add("on");
    place();
  };

  return {
    setEnabled(next: boolean): void {
      enabled = next;
      if (!enabled) hide();
      else if (inside) this.refresh();
    },
    pointer(clientX: number, clientY: number): void {
      inside = true;
      pointerX = clientX;
      pointerY = clientY;
      if (enabled) this.refresh();
    },
    pointerLeave(): void {
      inside = false;
      hide();
    },
    refresh(): void {
      if (!enabled || !inside) {
        hide();
        return;
      }
      const reading = read(pointerX, pointerY);
      if (!reading) {
        hide();
        return;
      }
      paint(reading);
    },
  };
}

function row(label: string): { line: HTMLDivElement; name: HTMLSpanElement; value: HTMLSpanElement } {
  const line = document.createElement("div");
  line.className = "env-probe-row";
  const name = document.createElement("span");
  name.className = "env-probe-name";
  name.textContent = label;
  const value = document.createElement("span");
  value.className = "env-probe-value";
  line.append(name, value);
  return { line, name, value };
}

/**
 * Millimolar value of a 0–100 field percent. 100% is 600 mM (0.6 M) and 1% is
 * 0.0001 mM (100 nM). The same curve continues below 1%.
 */
export function nutrientConcentrationMM(percent: number): number {
  return 0.0001 * Math.pow(6_000_000, (percent - 1) / 99);
}

/**
 * Environment readout, always micromolar to the nearest 0.001. Field fraction 1
 * is 600,000 µM; absent water reads 0.000 µM.
 */
export function formatNutrient(amount: number): string {
  if (amount < PRESENT) return "0.000 µM";
  const percent = (amount > 1 ? 1 : amount) * 100;
  const microMolar = nutrientConcentrationMM(percent) * 1_000;
  return `${microMolar.toFixed(3)} µM`;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function chooseCallout(pointerX: number, pointerY: number, width: number, height: number): Callout {
  const scales = [1, 0.8, 0.6, 0.45];
  for (const aim of AIMS) {
    for (const scale of scales) {
      const box = callout(pointerX, pointerY, aim, DIAG * scale, STEM * scale, width, height);
      if (onScreen(box, width, height)) return box;
    }
  }
  const aim = AIMS[0];
  const fallback = callout(pointerX, pointerY, aim, DIAG, STEM, width, height);
  const left = Math.min(Math.max(fallback.left, MARGIN), Math.max(MARGIN, window.innerWidth - MARGIN - width));
  const top = Math.min(Math.max(fallback.top, MARGIN), Math.max(MARGIN, window.innerHeight - MARGIN - height));
  const tipX = aim.x > 0 ? left + INSET : left + width - INSET;
  const tipY = aim.y < 0 ? top + height : top;
  const rise = Math.max(8, Math.min(DIAG, Math.abs(tipX - fallback.x0)));
  return {
    left,
    top,
    x0: fallback.x0,
    y0: fallback.y0,
    elbowX: fallback.x0 + aim.x * rise,
    elbowY: fallback.y0 + aim.y * rise,
    tipX,
    tipY,
  };
}

function callout(pointerX: number, pointerY: number, aim: Aim, diag: number, stem: number, width: number, height: number): Callout {
  const x0 = Math.round(pointerX);
  const y0 = Math.round(pointerY);
  const diagPx = Math.max(8, Math.round(diag));
  const stemPx = Math.max(6, Math.round(stem));
  const elbowX = x0 + aim.x * diagPx;
  const elbowY = y0 + aim.y * diagPx;
  const tipX = elbowX;
  const tipY = elbowY + aim.y * stemPx;
  const left = aim.x > 0 ? tipX - INSET : tipX - width + INSET;
  const top = aim.y < 0 ? tipY - height : tipY;
  return { left, top, x0, y0, elbowX, elbowY, tipX, tipY };
}

function onScreen(box: Callout, width: number, height: number): boolean {
  return (
    box.left >= MARGIN &&
    box.top >= MARGIN &&
    box.left + width <= window.innerWidth - MARGIN &&
    box.top + height <= window.innerHeight - MARGIN
  );
}
