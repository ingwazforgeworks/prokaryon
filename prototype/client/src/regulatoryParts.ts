/**
 * Regulatory tech tree graph: every promoter, amount, destination, and position
 * part that can be unlocked with mutation points, plus the edges between them.
 * Pure data with no imports so the unlock logic and the tree renderer both
 * depend on it without touching the DOM or the genome state module.
 */

export type RegulatoryCategory = "Promoter" | "Expression" | "Destination" | "Position";

export type RegulatoryPart = {
  id: string;
  /** Short code shown on the tree node card. */
  code: string;
  category: RegulatoryCategory;
  name: string;
  description: string;
  icon: string;
  /** Free from the start of a cell's life. */
  defaultUnlocked: boolean;
  /** Layout slot inside the category box: generation column (down) and lane row (across). */
  col: number;
  row: number;
};

const REGULATORY_ICON_DIR = "/ui/genome_viewer/regulatory_icons";
const TAG_ICON_DIR = "/ui/genome_viewer/localization_icons";

/** Flat mutation point cost for every purchasable regulatory node. */
export const REGULATORY_MP_COST = 1;

export const REGULATORY_PARTS: readonly RegulatoryPart[] = [
  // Promoter: Constitutive seeds everything; Persistence Gated tops it off.
  {
    id: "CNST",
    code: "CNST",
    category: "Promoter",
    name: "Constitutive",
    description: "Always on. Drives its gene at a steady strength with no input needed.",
    icon: `${REGULATORY_ICON_DIR}/constitutive_32x32.png`,
    defaultUnlocked: true,
    col: 0,
    row: 0,
  },
  {
    id: "GRAD",
    code: "GRAD",
    category: "Promoter",
    name: "Graded",
    description: "Rises with the input instead of switching fully on or off.",
    icon: `${REGULATORY_ICON_DIR}/graded_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 0,
  },
  {
    id: "OSCL",
    code: "OSCL",
    category: "Promoter",
    name: "Oscillatory",
    description: "Sweeps smoothly between its minimum and maximum amounts in a repeating cycle of about four seconds.",
    icon: `${REGULATORY_ICON_DIR}/oscillatory_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 1,
  },
  {
    id: "THRS",
    code: "THRS",
    category: "Promoter",
    name: "Threshold",
    description: "Stays off until an input passes a level, then switches on.",
    icon: `${REGULATORY_ICON_DIR}/threshold_32x32.png`,
    defaultUnlocked: false,
    col: 2,
    row: 0,
  },
  {
    id: "COND",
    code: "COND",
    category: "Promoter",
    name: "Conditional",
    description: "Drives downstream genes when a condition on receptor inputs is met.",
    icon: `${REGULATORY_ICON_DIR}/conditional_32x32.png`,
    defaultUnlocked: false,
    col: 2,
    row: 1,
  },
  {
    id: "PERS",
    code: "PERS",
    category: "Promoter",
    name: "Persistence Gated",
    description: "Combines condition and threshold logic, keeping expression on once it starts.",
    icon: `${REGULATORY_ICON_DIR}/persistence_gated_32x32.png`,
    defaultUnlocked: false,
    col: 3,
    row: 0,
  },
  // Expression: a linear ladder from silence up to hyperexpression.
  {
    id: "OFF",
    code: "OFF",
    category: "Expression",
    name: "No Expression",
    description: "Produces no protein at all. Keeps the gene in the genome without spending anything on it.",
    icon: `${REGULATORY_ICON_DIR}/off_32x32.png`,
    defaultUnlocked: true,
    col: 0,
    row: 0,
  },
  {
    id: "MICRO",
    code: "MICRO",
    category: "Expression",
    name: "Microexpression",
    description: "Produces only a trace of protein, just above the detection threshold.",
    icon: `${REGULATORY_ICON_DIR}/microexpression_32x32.png`,
    defaultUnlocked: true,
    col: 1,
    row: 0,
  },
  {
    id: "LOW",
    code: "LOW",
    category: "Expression",
    name: "Low Expression",
    description: "Produces a small, steady stream of protein.",
    icon: `${REGULATORY_ICON_DIR}/low_expression_32x32.png`,
    defaultUnlocked: false,
    col: 2,
    row: 0,
  },
  {
    id: "MED",
    code: "MED",
    category: "Expression",
    name: "Medium Expression",
    description: "Produces a moderate amount of protein. The balanced choice for most genes.",
    icon: `${REGULATORY_ICON_DIR}/medium_expression_32x32.png`,
    defaultUnlocked: false,
    col: 3,
    row: 0,
  },
  {
    id: "HIGH",
    code: "HIGH",
    category: "Expression",
    name: "High Expression",
    description: "Produces a large amount of protein with a real cost to the cell.",
    icon: `${REGULATORY_ICON_DIR}/high_expression_32x32.png`,
    defaultUnlocked: false,
    col: 4,
    row: 0,
  },
  {
    id: "OVER",
    code: "OVER",
    category: "Expression",
    name: "Overexpression",
    description: "Produces more protein than the cell normally uses. Heavy output that strains growth.",
    icon: `${REGULATORY_ICON_DIR}/overexpression_32x32.png`,
    defaultUnlocked: false,
    col: 5,
    row: 0,
  },
  {
    id: "HYPER",
    code: "HYPER",
    category: "Expression",
    name: "Hyperexpression",
    description: "Produces protein as fast as the cell can manage. The strongest setting available.",
    icon: `${REGULATORY_ICON_DIR}/hyperexpression_32x32.png`,
    defaultUnlocked: false,
    col: 6,
    row: 0,
  },
  // Destination: the three basic fates are free; anchoring builds on transmembrane.
  {
    id: "CYTO",
    code: "CYTO",
    category: "Destination",
    name: "Cytosolic",
    description: "Leaves the protein in the cytosol.",
    icon: `${TAG_ICON_DIR}/cytosolic_32x32.png`,
    defaultUnlocked: true,
    col: 0,
    row: 0,
  },
  {
    id: "SecretoryPeptide",
    code: "SECR",
    category: "Destination",
    name: "Secreted",
    description: "Sends the protein out of the cell. It works at range and does not come back.",
    icon: `${TAG_ICON_DIR}/secreted_32x32.png`,
    defaultUnlocked: true,
    col: 0,
    row: 1,
  },
  {
    id: "TransmembraneSignal",
    code: "TMBR",
    category: "Destination",
    name: "Transmembrane",
    description: "Embeds the protein in the membrane, active side facing out, so it stays with the cell.",
    icon: `${TAG_ICON_DIR}/transmembrane_32x32.png`,
    defaultUnlocked: true,
    col: 0,
    row: 2,
  },
  {
    id: "SURF",
    code: "SURF",
    category: "Destination",
    name: "Membrane Anchored",
    description: "Anchors the protein in the membrane so it stays with the cell.",
    icon: `${TAG_ICON_DIR}/membrane_anchored_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 2,
  },
  // Position: everything must be bought, poles first, then sides, then combos.
  {
    id: "PolarLocalizationSignal",
    code: "POLR",
    category: "Position",
    name: "Polar",
    description: "Concentrates the protein at one pole instead of distributing it around the envelope.",
    icon: `${TAG_ICON_DIR}/polar_32x32.png`,
    defaultUnlocked: false,
    col: 0,
    row: 0,
  },
  {
    id: "AntiPolarLocalizationSignal",
    code: "ANTP",
    category: "Position",
    name: "Antipolar",
    description: "Concentrates the protein at the opposite pole from the polar signal.",
    icon: `${TAG_ICON_DIR}/antipolar_32x32.png`,
    defaultUnlocked: false,
    col: 0,
    row: 1,
  },
  {
    id: "BIPO",
    code: "BIPO",
    category: "Position",
    name: "Bipolar",
    description: "Concentrates the protein at both poles at the same time.",
    icon: `${TAG_ICON_DIR}/bipolar_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 0,
  },
  {
    id: "LATR",
    code: "LATR",
    category: "Position",
    name: "Lateral",
    description: "Places the protein along one side of the cell rather than at a pole.",
    icon: `${TAG_ICON_DIR}/lateral_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 1,
  },
  {
    id: "ANTL",
    code: "ANTL",
    category: "Position",
    name: "Antilateral",
    description: "Places the protein along the opposite side from the lateral signal.",
    icon: `${TAG_ICON_DIR}/antilateral_32x32.png`,
    defaultUnlocked: false,
    col: 1,
    row: 2,
  },
  {
    id: "BILT",
    code: "BILT",
    category: "Position",
    name: "Bilateral",
    description: "Places the protein along both sides of the cell at the same time.",
    icon: `${TAG_ICON_DIR}/bilateral_32x32.png`,
    defaultUnlocked: false,
    col: 2,
    row: 0,
  },
];

export type RegulatoryEdgeKind = "unlocks" | "required";

export type RegulatoryEdge = {
  from: string;
  to: string;
  kind: RegulatoryEdgeKind;
};

/**
 * "required" edges must all be unlocked before the child can be bought;
 * "unlocks" edges need at least one parent unlocked (or none, if there are only
 * required edges).
 */
export const REGULATORY_EDGES: readonly RegulatoryEdge[] = [
  // Promoter
  { from: "CNST", to: "GRAD", kind: "unlocks" },
  { from: "CNST", to: "OSCL", kind: "unlocks" },
  { from: "GRAD", to: "THRS", kind: "unlocks" },
  { from: "OSCL", to: "COND", kind: "unlocks" },
  { from: "COND", to: "PERS", kind: "required" },
  { from: "THRS", to: "PERS", kind: "required" },
  // Expression
  { from: "OFF", to: "MICRO", kind: "required" },
  { from: "MICRO", to: "LOW", kind: "unlocks" },
  { from: "LOW", to: "MED", kind: "unlocks" },
  { from: "MED", to: "HIGH", kind: "unlocks" },
  { from: "HIGH", to: "OVER", kind: "unlocks" },
  { from: "OVER", to: "HYPER", kind: "unlocks" },
  // Destination
  { from: "TransmembraneSignal", to: "SURF", kind: "required" },
  // Position
  { from: "PolarLocalizationSignal", to: "BIPO", kind: "required" },
  { from: "AntiPolarLocalizationSignal", to: "BIPO", kind: "required" },
  { from: "PolarLocalizationSignal", to: "LATR", kind: "required" },
  { from: "AntiPolarLocalizationSignal", to: "LATR", kind: "required" },
  { from: "PolarLocalizationSignal", to: "ANTL", kind: "required" },
  { from: "AntiPolarLocalizationSignal", to: "ANTL", kind: "required" },
  { from: "LATR", to: "BILT", kind: "required" },
  { from: "ANTL", to: "BILT", kind: "required" },
];

/** Category display order, left to right on the board. */
export const REGULATORY_CATEGORY_ORDER: readonly RegulatoryCategory[] = ["Promoter", "Expression", "Destination", "Position"];