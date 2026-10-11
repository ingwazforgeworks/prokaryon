/**
 * Conditional-promoter responses. A conditional gene does not read the world
 * itself: it reads a receptor the cell is already expressing, then turns that
 * saturation into a 0–1 drive on the gene's amount.
 *
 * The published snapshot is filled once per frame from the water the cell is
 * in. Until a frame publishes a reading, every conditional gene stays off,
 * which is the missing-input behaviour: no receptor is not the same as a
 * receptor that looked and found nothing.
 */

const REGULATORY_ICON_DIR = "/ui/genome_viewer/regulatory_icons";

export type ReceptorRecord = {
  id: string;
  /** Pasta element id. Distinct from the gene id so the two sequences never collide. */
  elementId: string;
  name: string;
  signal: string;
  summary: string;
  description: string;
  icon: string;
};

export type ResponseRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  icon: string;
  /** Threshold and below-level responses need a saturation mark. */
  needsThreshold: boolean;
};

export type SaturationMark = {
  id: string;
  value: number;
  name: string;
  summary: string;
  description: string;
  icon: string;
};

export const RECEPTORS: readonly ReceptorRecord[] = [
  {
    id: "OSMR",
    elementId: "RCV-OSMR",
    name: "Osmolyn Receptor",
    signal: "Osmolyn",
    summary: "Osmolyn in the water",
    description: "Reads the Osmolyn touching the cell. Stronger expression detects a smaller concentration. Only a copy embedded in the membrane supplies a reading.",
    icon: "/ui/genome_viewer/proteins/individuals_32x32/OSMR.png",
  },
];

export const RESPONSES: readonly ResponseRecord[] = [
  {
    id: "ACTV",
    name: "Any activity",
    summary: "On when detected",
    description: "Any detectable receptor activity turns the gene fully on at its amount. Below the receptor's detection limit the gene stays off.",
    icon: `${REGULATORY_ICON_DIR}/conditional_32x32.png`,
    needsThreshold: false,
  },
  {
    id: "PROP",
    name: "Proportional",
    summary: "Follows saturation",
    description: "Expression scales with how saturated the receptor is. No signal stays silent, and a fully saturated receptor reaches the chosen amount.",
    icon: `${REGULATORY_ICON_DIR}/graded_32x32.png`,
    needsThreshold: false,
  },
  {
    id: "INVP",
    name: "Inversely proportional",
    summary: "Falls as it fills",
    description: "Expression scales down as the receptor saturates. The gene runs at its full amount when the receptor detects nothing, and falls silent when the receptor is fully saturated.",
    icon: `${REGULATORY_ICON_DIR}/low_expression_32x32.png`,
    needsThreshold: false,
  },
  {
    id: "GATE",
    name: "Threshold",
    summary: "On past a mark",
    description: "Stays off until receptor saturation passes the mark you set, then switches fully on.",
    icon: `${REGULATORY_ICON_DIR}/threshold_32x32.png`,
    needsThreshold: true,
  },
  {
    id: "INHB",
    name: "Inhibit",
    summary: "Off when active",
    description: "Runs at its amount while the receptor detects nothing, and switches off as soon as the receptor reports any activity.",
    icon: `${REGULATORY_ICON_DIR}/off_32x32.png`,
    needsThreshold: false,
  },
  {
    id: "FADE",
    name: "Repress",
    summary: "Fades as it fills",
    description: "Expression falls as the receptor saturates. Full amount when the receptor is empty, silent when it is full.",
    icon: `${REGULATORY_ICON_DIR}/low_expression_32x32.png`,
    needsThreshold: false,
  },
  {
    id: "BELO",
    name: "Below level",
    summary: "On under a mark",
    description: "Runs at its amount while receptor saturation stays at or under the mark you set, and switches off once the signal climbs past it.",
    icon: `${REGULATORY_ICON_DIR}/microexpression_32x32.png`,
    needsThreshold: true,
  },
];

export const SATURATION_MARKS: readonly SaturationMark[] = [
  {
    id: "M25",
    value: 0.25,
    name: "Quarter",
    summary: "25% saturation",
    description: "The mark sits at a quarter of receptor saturation.",
    icon: `${REGULATORY_ICON_DIR}/low_expression_32x32.png`,
  },
  {
    id: "M50",
    value: 0.5,
    name: "Half",
    summary: "50% saturation",
    description: "The mark sits at half receptor saturation.",
    icon: `${REGULATORY_ICON_DIR}/medium_expression_32x32.png`,
  },
  {
    id: "M75",
    value: 0.75,
    name: "Three quarters",
    summary: "75% saturation",
    description: "The mark sits at three quarters of receptor saturation.",
    icon: `${REGULATORY_ICON_DIR}/high_expression_32x32.png`,
  },
];

const receptorsById = new Map(RECEPTORS.map((receptor) => [receptor.id, receptor]));
const receptorsByElement = new Map(RECEPTORS.map((receptor) => [receptor.elementId, receptor]));
const responsesById = new Map(RESPONSES.map((response) => [response.id, response]));
const marksById = new Map(SATURATION_MARKS.map((mark) => [mark.id, mark]));

export function receptorById(id: string | null | undefined): ReceptorRecord | undefined {
  if (!id) return undefined;
  return receptorsById.get(id);
}

export function receptorByElementId(id: string | null | undefined): ReceptorRecord | undefined {
  if (!id) return undefined;
  return receptorsByElement.get(id);
}

export function responseById(id: string | null | undefined): ResponseRecord | undefined {
  if (!id) return undefined;
  return responsesById.get(id);
}

export function markById(id: string | null | undefined): SaturationMark | undefined {
  if (!id) return undefined;
  return marksById.get(id);
}

export function responseNeedsThreshold(responseId: string | null | undefined): boolean {
  return responseById(responseId)?.needsThreshold === true;
}

/** The saturation mark nearest this value, when it lands on one of the three tiles. */
export function markIdForThreshold(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  let best: SaturationMark | null = null;
  let gap = Number.POSITIVE_INFINITY;
  for (const mark of SATURATION_MARKS) {
    const next = Math.abs(mark.value - value);
    if (next < gap) {
      gap = next;
      best = mark;
    }
  }
  return best !== null && gap < 0.02 ? best.id : null;
}

/**
 * Drive in [0, 1] for one response. A null saturation is a missing input and
 * drives nothing, including inhibition: the gene does not turn on just because
 * the receptor is absent. Saturation 0 is a real reading of "nothing detected".
 */
export function responseGain(responseId: string | null | undefined, saturation: number | null, threshold: number | null | undefined): number {
  if (saturation === null || !Number.isFinite(saturation)) return 0;
  const sat = clamp01(saturation);
  const mark = typeof threshold === "number" && Number.isFinite(threshold) ? clamp01(threshold) : null;
  switch (responseId) {
    case "ACTV":
      return sat > 0 ? 1 : 0;
    case "PROP":
      return sat;
    case "INVP":
      return 1 - sat;
    case "GATE":
      return mark === null ? 0 : sat >= mark ? 1 : 0;
    case "INHB":
      return sat > 0 ? 0 : 1;
    case "FADE":
      return 1 - sat;
    case "BELO":
      return mark === null ? 0 : sat <= mark ? 1 : 0;
    default:
      return 0;
  }
}

export type SignalSnapshot = {
  /** Null when the Osmolyn Receptor is absent or the water was not sampled. */
  osmolynSaturation: number | null;
};

let snapshot: SignalSnapshot = { osmolynSaturation: null };

export function publishReceptorSignals(next: SignalSnapshot): void {
  const saturation = next.osmolynSaturation;
  snapshot = {
    osmolynSaturation: saturation === null || !Number.isFinite(saturation) ? null : clamp01(saturation),
  };
}

export function receptorSignalSnapshot(): SignalSnapshot {
  return snapshot;
}

/** 0–1 multiplier a conditional construct applies to its amount. Other promoters return 1. */
export function conditionalMultiplier(construct: {
  promoterId: string;
  receptorId?: string | null;
  responseId?: string | null;
  threshold?: number | null;
}): number {
  if (construct.promoterId !== "COND") return 1;
  if (!receptorById(construct.receptorId) || !responseById(construct.responseId)) return 0;
  if (construct.receptorId === "OSMR") {
    return responseGain(construct.responseId, snapshot.osmolynSaturation, construct.threshold);
  }
  return 0;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
