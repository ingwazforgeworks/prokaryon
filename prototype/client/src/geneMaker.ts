import { GENES, type GeneRecord } from "./genes";
import { geneUnlockCost } from "./geneUnlocks";
import { playCue } from "./uiSound";

export type GeneMakerRecord = Record<string, string>;
type GeneDataFile = { v: 1; genes: Record<string, GeneMakerRecord> };

const STATUSES = ["Proposed", "Confirmed"] as const;
const CATEGORIES = [
  "Metabolism",
  "Homeostasis",
  "Morphology",
  "Motility",
  "Perception",
  "Regulation",
  "Reproduction",
] as const;
const FUNCTION_TYPES = [
  "Importer",
  "Exporter",
  "Converter",
  "Respiratory Module",
  "Morphology Modifier",
  "Motor",
  "Buoyancy Modifier",
  "Sensor",
  "Regulator",
  "Tolerance",
  "Population",
  "Emitter",
] as const;
const DESTINATIONS = ["Cytosol", "Secreted", "Transmembrane", "Membrane-Anchored"] as const;
const POSITIONS = ["Polar", "Anti-Polar", "Lateral", "Anti-Lateral", "Bi-Lateral", "Bi-Polar"] as const;
const SCALING = ["Linear", "Saturating"] as const;

type FieldKind = "text" | "textarea" | "select" | "checks";

type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  tip: string;
  wide?: boolean;
  rows?: number;
  options?: readonly string[];
  placeholder?: string;
  prefill?: (gene: GeneRecord) => string;
};

const FIELDS: readonly FieldSpec[] = [
  {
    key: "name",
    label: "Gene Name",
    kind: "text",
    tip: "The protein's common name, shown in the genome viewer and codex.",
    prefill: (gene) => gene.name,
  },
  {
    key: "category",
    label: "Category",
    kind: "select",
    options: CATEGORIES,
    tip: "The gene's category; sets its tech-tree branch and genome-viewer tab.",
    prefill: (gene) => gene.category,
  },
  {
    key: "status",
    label: "Status",
    kind: "select",
    options: STATUSES,
    tip: "Confirmed genes exist in the prototype; Proposed genes are design-stage only.",
    prefill: () => "Proposed",
  },
  {
    key: "functionType",
    label: "Function Type",
    kind: "select",
    options: FUNCTION_TYPES,
    tip: "The effect archetype: how this gene changes the cell (import, export, convert, sense, regulate, etc.).",
  },
  {
    key: "description",
    label: "Function Description",
    kind: "textarea",
    rows: 3,
    wide: true,
    tip: "Player-facing description of what the gene does, shown in the codex.",
    prefill: (gene) => gene.description,
  },
  {
    key: "destinations",
    label: "Destination Constraints",
    kind: "checks",
    options: DESTINATIONS,
    wide: true,
    tip: "Where the protein can be routed: built in the cytosol, secreted, spanning the membrane, or anchored to it.",
  },
  {
    key: "positions",
    label: "Position Constraints",
    kind: "checks",
    options: POSITIONS,
    wide: true,
    tip: "Which membrane sites the protein may occupy: polar, anti-polar, lateral, or the paired variants.",
  },
  {
    key: "functionalPosition",
    label: "Functional Position",
    kind: "select",
    options: POSITIONS,
    tip: "The membrane site where the protein's effect actually counts.",
  },
  {
    key: "defaultLocalization",
    label: "Default Localization",
    kind: "text",
    tip: "Where the protein goes when the player hasn't assigned it a target.",
  },
  {
    key: "inputs",
    label: "Inputs",
    kind: "textarea",
    rows: 2,
    wide: true,
    placeholder: "one per line: <resource> @ <units/sec>",
    tip: "Resources consumed per second while expressed. One per line: <resource> @ <units/sec>.",
  },
  {
    key: "outputs",
    label: "Outputs",
    kind: "textarea",
    rows: 2,
    wide: true,
    placeholder: "one per line: <resource> @ <units/sec> (public|private)",
    tip: "Resources produced per second while expressed. One per line: <resource> @ <units/sec> (public|private).",
  },
  {
    key: "effectParameters",
    label: "Effect Parameters",
    kind: "textarea",
    rows: 2,
    wide: true,
    placeholder: "one per line, e.g. thrust: 0.8",
    tip: "Archetype-specific numbers, one key: value pair per line — e.g. thrust: 0.8 or stressor: Heat.",
  },
  {
    key: "mpCost",
    label: "Mutation Point Cost",
    kind: "text",
    tip: "Mutation points spent to unlock this gene in the tech tree.",
    prefill: (gene) => {
      const cost = geneUnlockCost(gene.id);
      return cost === null ? "" : String(cost);
    },
  },
  {
    key: "upkeepCost",
    label: "Upkeep ATP Cost",
    kind: "text",
    tip: "ATP per second the cell pays while this protein is expressed.",
  },
  {
    key: "assemblyCost",
    label: "Assembly ATP Cost",
    kind: "text",
    tip: "One-time ATP cost to build the protein when expression begins (open design question).",
  },
  {
    key: "scaling",
    label: "Expression Scaling",
    kind: "select",
    options: SCALING,
    tip: "How the effect grows with expression level: Linear scales directly, Saturating has diminishing returns.",
  },
  {
    key: "interactions",
    label: "Gene Interactions",
    kind: "textarea",
    rows: 3,
    wide: true,
    placeholder: "one per line: requires: FLGN",
    tip: "Relationships to other genes, one per line: requires:, unlocked-by:, unlocks:, modifies:, regulates:, competes-with:.",
  },
  {
    key: "artKey",
    label: "Art Key",
    kind: "text",
    tip: "Sprite key for this gene's protein art; defaults to the gene tag.",
    prefill: (gene) => gene.id,
  },
  {
    key: "designBasis",
    label: "Design Basis",
    kind: "text",
    tip: "The real-world biology this gene is modeled on.",
  },
];

/** Set once by initGeneMaker; openGeneMaker delegates into the live panel. */
let openHook: (() => void) | null = null;

export function openGeneMaker(): void {
  openHook?.();
}

export function initGeneMaker(handlers: { onBack: () => void }): void {
  const root = document.querySelector<HTMLElement>("#gene-maker");
  const body = document.querySelector<HTMLElement>("#gene-maker-body");
  const countLabel = document.querySelector<HTMLElement>("#gene-maker-count");
  const statusLabel = document.querySelector<HTMLElement>("#gene-maker-status");
  const select = document.querySelector<HTMLSelectElement>("#gene-select");
  const prevButton = document.querySelector<HTMLButtonElement>("#gene-prev");
  const nextButton = document.querySelector<HTMLButtonElement>("#gene-next");
  const saveButton = document.querySelector<HTMLButtonElement>("#gene-save");
  const closeButton = document.querySelector<HTMLButtonElement>("#gene-maker-close");
  if (!root || !body || !countLabel || !statusLabel || !select || !prevButton || !nextButton || !saveButton || !closeButton) {
    throw new Error("missing gene maker panel");
  }

  const records = new Map<string, GeneMakerRecord>();
  const editedGenes = new Set<string>();
  const controls = new Map<string, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
  const checkControls = new Map<string, HTMLInputElement[]>();
  let geneIndex = 0;
  let loadedFromDisk = false;
  let formDirty = false;
  let savePending = false;

  const ensureRecord = (tag: string): GeneMakerRecord => {
    let record = records.get(tag);
    if (!record) {
      record = {};
      records.set(tag, record);
    }
    return record;
  };

  const buildForm = (): void => {
    for (const field of FIELDS) {
      const wrap = document.createElement("div");
      wrap.className = field.wide ? "gene-maker-field wide" : "gene-maker-field";

      const head = document.createElement("div");
      head.className = "gene-maker-field-head";
      const label = document.createElement("label");
      label.textContent = field.label;
      label.htmlFor = `gene-maker-${field.key}`;
      head.appendChild(label);
      const info = document.createElement("button");
      info.type = "button";
      info.className = "gene-maker-info";
      info.textContent = "i";
      info.dataset.tip = field.tip;
      info.setAttribute("aria-label", `About ${field.label}`);
      head.appendChild(info);
      wrap.appendChild(head);

      if (field.kind === "text") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = label.htmlFor;
        controls.set(field.key, input);
        wrap.appendChild(input);
      } else if (field.kind === "textarea") {
        const textarea = document.createElement("textarea");
        textarea.id = label.htmlFor;
        if (field.rows) textarea.rows = field.rows;
        if (field.placeholder) textarea.placeholder = field.placeholder;
        controls.set(field.key, textarea);
        wrap.appendChild(textarea);
      } else if (field.kind === "select") {
        const selectEl = document.createElement("select");
        selectEl.id = label.htmlFor;
        selectEl.appendChild(new Option("", ""));
        for (const option of field.options ?? []) {
          selectEl.appendChild(new Option(option, option));
        }
        controls.set(field.key, selectEl);
        wrap.appendChild(selectEl);
      } else {
        const box = document.createElement("div");
        box.className = "gene-maker-checks";
        const boxes: HTMLInputElement[] = [];
        for (const option of field.options ?? []) {
          const checkLabel = document.createElement("label");
          checkLabel.className = "gene-maker-check";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = option;
          const text = document.createElement("span");
          text.textContent = option;
          checkLabel.appendChild(input);
          checkLabel.appendChild(text);
          box.appendChild(checkLabel);
          boxes.push(input);
        }
        checkControls.set(field.key, boxes);
        wrap.appendChild(box);
      }

      body.appendChild(wrap);
    }
  };

  const stashCurrentGene = (): void => {
    const gene = GENES[geneIndex];
    // Untouched genes regenerate their prefills, so only edited ones are kept.
    if (!editedGenes.has(gene.id)) return;
    const record = ensureRecord(gene.id);
    for (const field of FIELDS) {
      if (field.kind === "checks") {
        const boxes = checkControls.get(field.key) ?? [];
        record[field.key] = boxes
          .filter((box) => box.checked)
          .map((box) => box.value)
          .join(", ");
      } else {
        const control = controls.get(field.key);
        if (control) record[field.key] = control.value.trim();
      }
    }
  };

  const showGene = (index: number, stash = true): void => {
    if (stash) stashCurrentGene();
    geneIndex = ((index % GENES.length) + GENES.length) % GENES.length;
    const gene = GENES[geneIndex];
    const record = records.get(gene.id) ?? {};

    for (const field of FIELDS) {
      const prefill = field.prefill ? field.prefill(gene) : "";
      const value = record[field.key] ?? prefill;
      if (field.kind === "checks") {
        const chosen = value ? value.split(", ").map((part) => part.trim()) : [];
        for (const box of checkControls.get(field.key) ?? []) {
          box.checked = chosen.includes(box.value);
        }
      } else {
        const control = controls.get(field.key);
        if (control) control.value = value;
      }
    }

    countLabel.textContent = `${geneIndex + 1} / ${GENES.length} — ${gene.id}`;
    if (document.activeElement !== select) {
      select.selectedIndex = geneIndex;
    }
  };

  const markEditedGene = (): void => {
    formDirty = true;
    const gene = GENES[geneIndex];
    editedGenes.add(gene.id);
    statusLabel.textContent = `${gene.id} staged (unsaved)`;
  };

  const loadFromDisk = async (): Promise<void> => {
    if (loadedFromDisk) return;
    loadedFromDisk = true;
    try {
      const response = await fetch("/gene-data.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as Partial<GeneDataFile>;
      if (data.v !== 1 || !data.genes || typeof data.genes !== "object") return;
      for (const [tag, record] of Object.entries(data.genes)) {
        if (!record || typeof record !== "object" || Array.isArray(record)) continue;
        const clean: GeneMakerRecord = {};
        for (const [key, value] of Object.entries(record)) {
          if (typeof value === "string") clean[key] = value;
        }
        records.set(tag, clean);
      }
      if (!formDirty) showGene(geneIndex, false);
    } catch {
      // No saved data yet; prefills cover it.
    }
  };

  const saveToDisk = async (): Promise<void> => {
    if (savePending) return;
    savePending = true;
    stashCurrentGene();
    statusLabel.textContent = "saving...";
    try {
      const genes: Record<string, GeneMakerRecord> = {};
      for (const [tag, record] of records) {
        const hasContent = Object.values(record).some((value) => value !== "");
        if (hasContent) genes[tag] = record;
      }
      const response = await fetch("/api/gene-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ v: 1, genes }),
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      statusLabel.textContent = `saved ${Object.keys(genes).length} genes`;
      formDirty = false;
      playCue("select");
    } catch (error) {
      statusLabel.textContent = `save failed (${error instanceof Error ? error.message : "unknown"}) — dev server required`;
      playCue("back");
    } finally {
      savePending = false;
    }
  };

  buildForm();

  const tip = document.createElement("div");
  tip.className = "gene-maker-tip";
  tip.hidden = true;
  root.appendChild(tip);

  const hideTip = (): void => {
    tip.hidden = true;
  };
  const showTip = (target: HTMLElement): void => {
    const text = target.dataset.tip ?? "";
    if (text === "") return;
    tip.textContent = text;
    tip.hidden = false;
    const rect = target.getBoundingClientRect();
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    let x = rect.left + rect.width / 2 - width / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - width - 8));
    let y = rect.top - height - 8;
    if (y < 8) y = rect.bottom + 8;
    tip.style.left = `${Math.round(x)}px`;
    tip.style.top = `${Math.round(y)}px`;
  };
  for (const info of Array.from(root.querySelectorAll<HTMLElement>(".gene-maker-info"))) {
    info.addEventListener("pointerenter", () => showTip(info));
    info.addEventListener("pointerleave", hideTip);
    info.addEventListener("focus", () => showTip(info));
    info.addEventListener("blur", hideTip);
  }
  body.addEventListener("scroll", hideTip, { passive: true });

  for (const gene of GENES) {
    select.appendChild(new Option(`${gene.id} — ${gene.name}`, gene.id));
  }

  prevButton.addEventListener("click", () => {
    playCue("hover");
    showGene(geneIndex - 1);
  });
  nextButton.addEventListener("click", () => {
    playCue("hover");
    showGene(geneIndex + 1);
  });
  select.addEventListener("change", () => {
    playCue("hover");
    const index = GENES.findIndex((gene) => gene.id === select.value);
    if (index >= 0) showGene(index);
  });

  for (const control of controls.values()) {
    control.addEventListener("input", markEditedGene);
  }
  for (const boxes of checkControls.values()) {
    for (const box of boxes) {
      box.addEventListener("input", markEditedGene);
    }
  }

  saveButton.addEventListener("click", () => void saveToDisk());
  closeButton.addEventListener("click", () => {
    playCue("back");
    handlers.onBack();
  });

  openHook = (): void => {
    hideTip();
    void loadFromDisk();
    showGene(geneIndex);
    select.focus();
  };
}