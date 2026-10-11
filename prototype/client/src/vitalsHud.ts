import {
  ATP_LOW,
  HEAT_ONSET,
  STRESS_CAUSES,
  type CellVitals,
  type StressCause,
} from "./cellVitals";
import { formatAmount, formatRate } from "./resources";

/** Water this close under the onset reads as a warning before it starts doing harm. */
const WARM_MARGIN = 8;
/** Shrivel past this reads as a warning before it starts doing harm. */
const SHRIVEL_CAUTION = 0.15;
const OBITUARY_SECONDS = 6;

export type VitalsTone = "caution" | "danger" | "mend" | "dead";

export type VitalsReading = {
  label: string;
  vitals: CellVitals;
  celsius: number | null;
  osmotic: number;
  atp: number;
  atpRate: number;
  /** Set once the cell has started to die. A null cause is a death the player triggered. */
  dying: { cause: StressCause | null } | null;
};

export type VitalsReport = {
  tone: VitalsTone;
  title: string;
  detail: string;
  hint: string;
  /** 0 to 1. Null hides the bar. */
  integrity: number | null;
  causes: StressCause[];
};

const STRESS_TITLE: Record<StressCause, string> = {
  heat: "Overheating",
  osmotic: "Shriveling",
  starvation: "Starving",
};

const DEATH_WORD: Record<StressCause, string> = {
  heat: "Overheated",
  osmotic: "Shriveled in brine",
  starvation: "Starved",
};

const HINT: Record<StressCause, string> = {
  heat: "Swim to cooler water",
  osmotic: "Leave the osmolyn, or express Osmoprotectin",
  starvation: "Burn more fuel than upkeep, or trim genes",
};

function celsiusText(celsius: number | null): string {
  return celsius === null ? "—" : `${Math.round(celsius)}°C`;
}

function stressDetail(cause: StressCause, reading: VitalsReading): string {
  if (cause === "heat") return `Water ${celsiusText(reading.celsius)} · harmful above ${HEAT_ONSET}°C`;
  if (cause === "osmotic") return `Brine is drawing water out · osmotic ${reading.osmotic.toFixed(2)}`;
  return "ATP empty · motors stalled";
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "now";
  const whole = Math.ceil(seconds);
  if (whole < 60) return `${whole}s`;
  const minutes = Math.floor(whole / 60);
  if (minutes < 60) return `${minutes}m ${whole % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/** What the readout should say about one cell. Null when there is nothing to say. */
export function vitalsReport(reading: VitalsReading): VitalsReport | null {
  const { vitals } = reading;
  if (reading.dying) {
    const cause = reading.dying.cause;
    return {
      tone: "dead",
      title: `${reading.label} died`,
      detail: cause ? DEATH_WORD[cause] : "Apoptosis",
      hint: cause ? `Next time: ${HINT[cause].charAt(0).toLowerCase()}${HINT[cause].slice(1)}` : "",
      integrity: 0,
      causes: cause ? [cause] : [],
    };
  }
  const causes = STRESS_CAUSES.filter((cause) => vitals.stress[cause] > 0);
  if (causes.length > 0) {
    const lead = vitals.cause && causes.includes(vitals.cause) ? vitals.cause : causes[0];
    return {
      tone: "danger",
      title: causes.map((cause) => STRESS_TITLE[cause]).join(" + "),
      detail: stressDetail(lead, reading),
      hint: HINT[lead],
      integrity: vitals.integrity,
      causes,
    };
  }
  const hurt = vitals.integrity < 1 - 1e-6;
  const celsius = reading.celsius;
  if (celsius !== null && celsius > HEAT_ONSET - WARM_MARGIN) {
    return {
      tone: "caution",
      title: "Water is getting hot",
      detail: `${celsiusText(celsius)} · harm starts at ${HEAT_ONSET}°C`,
      hint: HINT.heat,
      integrity: hurt ? vitals.integrity : null,
      causes: ["heat"],
    };
  }
  if (reading.osmotic < -SHRIVEL_CAUTION) {
    return {
      tone: "caution",
      title: "Losing water",
      detail: `Osmotic ${reading.osmotic.toFixed(2)} · deeper shrivel tears the membrane`,
      hint: HINT.osmotic,
      integrity: hurt ? vitals.integrity : null,
      causes: ["osmotic"],
    };
  }
  if (reading.atp < ATP_LOW && reading.atpRate < 0) {
    return {
      tone: "caution",
      title: "ATP running low",
      detail: `${formatAmount(reading.atp)} left · ${formatRate(reading.atpRate)} · empty in ${formatDuration(reading.atp / -reading.atpRate)}`,
      hint: HINT.starvation,
      integrity: hurt ? vitals.integrity : null,
      causes: ["starvation"],
    };
  }
  if (hurt) {
    return {
      tone: "mend",
      title: "Recovering",
      detail: vitals.cause ? `Mending damage from ${STRESS_TITLE[vitals.cause].toLowerCase()}` : "Mending damage",
      hint: "",
      integrity: vitals.integrity,
      causes: [],
    };
  }
  return null;
}

/** One sentence for a cell that died off screen. */
export function obituaryText(label: string, cause: StressCause | null): string {
  return `${label} died · ${cause ? DEATH_WORD[cause] : "Apoptosis"}`;
}

export function createVitalsHud() {
  const stack = document.createElement("div");
  stack.id = "cell-vitals-stack";
  const panel = document.createElement("section");
  panel.id = "cell-vitals";
  panel.setAttribute("role", "status");
  panel.setAttribute("aria-live", "polite");
  panel.hidden = true;
  const head = document.createElement("div");
  head.className = "vitals-head";
  const title = document.createElement("span");
  title.className = "vitals-title";
  const percent = document.createElement("span");
  percent.className = "vitals-percent";
  head.append(title, percent);
  const bar = document.createElement("div");
  bar.className = "vitals-bar";
  const fill = document.createElement("div");
  fill.className = "vitals-fill";
  bar.append(fill);
  const detail = document.createElement("div");
  detail.className = "vitals-detail";
  const hint = document.createElement("div");
  hint.className = "vitals-hint";
  panel.append(head, bar, detail, hint);
  const obituaries = document.createElement("div");
  obituaries.className = "vitals-obituaries";
  stack.append(panel, obituaries);
  document.body.append(stack);

  let shown = "";
  const paint = (report: VitalsReport | null): void => {
    const key = report
      ? `${report.tone}|${report.title}|${report.detail}|${report.hint}|${report.integrity === null ? "-" : Math.round(report.integrity * 100)}|${report.causes.join(",")}`
      : "";
    if (key === shown) return;
    shown = key;
    if (!report) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    panel.dataset.tone = report.tone;
    panel.dataset.cause = report.causes[0] ?? "";
    title.textContent = report.title;
    detail.textContent = report.detail;
    hint.textContent = report.hint;
    hint.hidden = report.hint === "";
    if (report.integrity === null) {
      bar.hidden = true;
      percent.textContent = "";
    } else {
      bar.hidden = false;
      const value = Math.round(report.integrity * 100);
      fill.style.width = `${value}%`;
      percent.textContent = `Integrity ${value}%`;
    }
  };

  return {
    /** Null hides the readout, for the title screen. */
    update(reading: VitalsReading | null): void {
      paint(reading ? vitalsReport(reading) : null);
    },
    obituary(label: string, cause: StressCause | null): void {
      const note = document.createElement("div");
      note.className = "vitals-obituary";
      note.dataset.cause = cause ?? "";
      note.textContent = obituaryText(label, cause);
      obituaries.append(note);
      window.setTimeout(() => note.classList.add("is-leaving"), OBITUARY_SECONDS * 1000);
      window.setTimeout(() => note.remove(), OBITUARY_SECONDS * 1000 + 600);
    },
    clearObituaries(): void {
      obituaries.replaceChildren();
    },
  };
}
