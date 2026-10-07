import { geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Reproduction — Anabolase (ANAB) growth and Cyclin (CYCL) division — derived
 * from genome constructs. Pure data logic with no imports on the renderer,
 * resources, or DOM so the growth rules stay testable alone. Anabolase is the
 * growth module: while it is expressed the cell's size scale compounds upward,
 * faster the harder the gene runs. Cyclin is the commitment module: while it
 * is expressed, a cell that has reached the minimum division size divides in
 * two, halving both daughters.
 */

/** Seconds a hyperexpressing cell (level 1.0) takes to double in size. */
export const ANABOLASE_DOUBLE_SECONDS_HYPER = 3 * 60;
/** Seconds a medium-expressing cell (level 0.5) takes to double in size. */
export const ANABOLASE_DOUBLE_SECONDS_MED = 5 * 60;
/** Seconds a microexpressing cell (level 0.1) takes to double in size. */
export const ANABOLASE_DOUBLE_SECONDS_MICRO = 15 * 60;

const LN2 = Math.log(2);

/**
 * Growth-rate anchors: expression level to exponential growth rate per second.
 * Rate space is piecewise linear so expression interpolates smoothly between
 * the micro/medium/hyper doubling times, and zero expression grows nothing.
 */
const GROWTH_RATES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.1, LN2 / ANABOLASE_DOUBLE_SECONDS_MICRO],
  [0.5, LN2 / ANABOLASE_DOUBLE_SECONDS_MED],
  [1, LN2 / ANABOLASE_DOUBLE_SECONDS_HYPER],
];

function growthRate(expression: number): number {
  if (!(expression > 0)) return 0;
  const level = Math.min(1, expression);
  for (let index = 1; index < GROWTH_RATES.length; index += 1) {
    const [maxLevel, maxRate] = GROWTH_RATES[index];
    if (level <= maxLevel) {
      const [minLevel, minRate] = GROWTH_RATES[index - 1];
      const t = (level - minLevel) / (maxLevel - minLevel);
      return minRate + (maxRate - minRate) * t;
    }
  }
  return LN2 / ANABOLASE_DOUBLE_SECONDS_HYPER;
}

/** Seconds the cell takes to double at this anabolase expression level; Infinity when the gene is off. */
export function anabolaseDoublingSeconds(expression: number): number {
  const rate = growthRate(expression);
  return rate > 0 ? LN2 / rate : Infinity;
}

/**
 * Step the cell's size scale forward by dt under anabolase. Growth is
 * exponential — the doubling time is constant at a given expression level —
 * and it never passes the size cap.
 */
export function stepAnabolaseGrowth(scale: number, expression: number, dt: number, maxSize: number): number {
  if (!(expression > 0) || !(dt > 0) || !(scale < maxSize)) return scale;
  const rate = growthRate(expression);
  if (rate <= 0) return scale;
  return Math.min(maxSize, scale * Math.exp(rate * dt));
}

/**
 * Both reproduction proteins are soluble cytosolic modules: they work with no
 * destination tag at all, and an explicit Cytosol tag changes nothing. Copies
 * routed to the membrane or out of the cell never fold into the working module.
 */
const REPRODUCTION_ROUTES = new Set(["CYTO"]);

/** Total Anabolase expressed right now, cytosolic copies only. */
export function anabolaseExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  // An untagged construct is also cytosolic — no signal peptide means the
  // protein stays in the cytosol — so it counts for a soluble module.
  const cytosolic = constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
  return geneExpressionLevel(cytosolic, "ANAB", REPRODUCTION_ROUTES, timeSeconds);
}

/** Total Cyclin expressed right now, cytosolic copies only. */
export function cyclinExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  const cytosolic = constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
  return geneExpressionLevel(cytosolic, "CYCL", REPRODUCTION_ROUTES, timeSeconds);
}

/**
 * Whether expressed Cyclin commits a cell of this size to division. A cell
 * halves when it divides, so the minimum valid division size is twice the
 * size floor: below it a daughter would come out under the minimum. The
 * epsilon matches the manual divide gate so slider-set exact values count.
 */
export function cyclinTriggersDivision(
  expression: number,
  scale: number,
  dividing: boolean,
  divisionMinScale: number,
): boolean {
  return expression > 0 && !dividing && scale >= divisionMinScale - 1e-4;
}