export interface FlagellumSnapshot {
  id: number;
  /** -1 at the antipolar or antilateral site, +1 at the polar or lateral site. */
  pole: number;
  /** Emergence site. Poles are the long-axis caps. Flanks are the two sides. */
  site: "polar" | "antipolar" | "lateral" | "antilateral";
  mount: number;
  length: number;
  assembly: number;
}

/**
 * Where the ciliary power stroke flips.
 * The named half keeps the resting stroke. The opposite half mirrors it.
 */
export type CiliaSwitch = "lateral" | "antilateral" | "polar" | "antipolar";

/** A cilium rooted on the cell outline, in the cell's local frame. */
export interface CiliumSnapshot {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  length: number;
}

/** A rigid pilus rooted on the membrane, in the cell's local frame. */
export interface PilusSnapshot {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  length: number;
  /** 0 sits behind the body. 1 is the shorter coat drawn in front. */
  layer: number;
}

/**
 * A pilus fragment shed from a secreted pilus, in world coordinates. Launched
 * off the membrane region, decelerating like a bullet in water, fading out.
 */
export interface PilusFragmentSnapshot {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  length: number;
  /** 1 is fully opaque. 0 has faded out entirely. */
  alpha: number;
}

/**
 * Which sides taper, and how hard each one pinches.
 * `mask` bits: polar 1, antipolar 2, lateral 4, antilateral 8.
 * Each degree is 0–1. 0 leaves that side full. 1 keeps half the radius.
 * Every side at the same degree is even and leaves the outline unchanged.
 * If every side is on and the degrees differ, the smallest stays full and the others pinch by the difference.
 * A bare mask number means those sides at full degree.
 */
export type CellTaper = {
  mask: number;
  polar: number;
  antipolar: number;
  lateral: number;
  antilateral: number;
};

export interface CellSnapshot {
  id: number;
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  omega: number;
  length: number;
  width: number;
  bend?: number;
  /** 0–1 cleavage progress. The waist is closed at 1. */
  furrow?: number;
  /** Local angle of the axis the furrow cuts across. */
  furrowAxis?: number;
  /** 0–1 blend from the pinched parent onto the two daughter silhouettes. */
  morph?: number;
  /** Local offset from the parent center to each daughter center. */
  divisionShift?: number;
  /** Local angle of the axis the daughters separate along. */
  divisionPlace?: number;
  /** Sides whose volume is compressed. A number is the mask at full degree. */
  taper?: number | CellTaper;
  palette: number;
  seed: number;
  capsule: number;
  motor: "idle" | "run" | "tumble";
  activity: number;
  /** Per-site beat strength. Sites the map leaves out fall back to `activity`. */
  activityBySite?: Partial<Record<FlagellumSnapshot["site"], number>>;
  /** 0–2 beat rate. 1 is the resting pace. */
  ciliaSpeed: number;
  /** 0–1 scale of the cilium beat. */
  ciliaSway: number;
  /** 0 random, 1 a wave from one long-axis pole to the other. Propulsion scales with this. */
  ciliaOrder: number;
  /** Which half keeps the resting power stroke. The opposite half mirrors it. */
  ciliaSwitch: CiliaSwitch;
  /** True when the power stroke runs toward the antipolar pole. */
  ciliaReverse: boolean;
  /** 0 shed, 1 a full coat. Omitted cells draw the full coat. */
  ciliaCover?: number;
  /** True when the coat holds still: the cilia grow but no motor rows them. Omitted cells beat. */
  ciliaStill?: boolean;
  /** 0 shed, 1 a full coat of pili. Omitted cells draw every pilus opaque. */
  piliCover?: number;
  flagella: FlagellumSnapshot[];
  cilia: CiliumSnapshot[];
  /** Rigid surface needles. Omitted cells have none. */
  pili?: PilusSnapshot[];
  /** Screen pixels of membrane. Omitted cells use the renderer's membrane. */
  membranePx?: number;
  membraneStyle?: number;
  membraneColor?: [number, number, number];
  /** Multiplier on the cytoplasm palette. Omitted cells stay the neutral gray. */
  pigment?: [number, number, number];
  /** Fluorescent emission. Zero or omitted cells cast no glow. */
  glow?: [number, number, number];
}

export interface ViewSnapshot {
  half_width: number;
  half_height: number;
  logical_width: number;
  logical_height: number;
  pixels_per_unit: number;
}

export interface WorldSnapshot {
  v: number;
  t: number;
  view: ViewSnapshot;
  cells: CellSnapshot[];
}
