import { geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Respiratory reductases — Ferron Reductase (FERR) burning intracellular
 * Ferron and Sulfex Reductase (SLFR) burning intracellular Sulfex — derived
 * from genome constructs. Pure data logic with no imports on the renderer,
 * resources, or DOM so the burn rules stay testable alone. Each reductase is a
 * terminal respiratory module: it passes electrons to the fuel it is named
 * for and hands back a modest amount of ATP for every unit it burns.
 */

/** Fuel units burned per second at full expression. */
export const REDUCTASE_FUEL_PER_SECOND = 5;

/** ATP produced for every fuel unit burned. */
export const ATP_PER_FUEL_UNIT = 2;

/**
 * The reductases are soluble cytosolic modules: they work with no destination
 * tag at all, and an explicit Cytosol tag changes nothing. Copies routed to
 * the membrane or out of the cell never fold into the working module.
 */
const REDUCTASE_ROUTES = new Set(["CYTO"]);

/** Total copies of one reductase gene expressed right now, cytosolic copies only. */
export function reductaseExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  // An untagged construct is also cytosolic — no signal peptide means the
  // protein stays in the cytosol — so it counts for a soluble module.
  const cytosolic = constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
  return geneExpressionLevel(cytosolic, geneId, REDUCTASE_ROUTES, timeSeconds);
}

/**
 * Step one reductase forward by dt. The burn rate is proportional to the
 * reductase expression level, and it never outruns its supplies: an empty fuel
 * pool burns nothing, and a full ATP pool stops the burn rather than wasting
 * fuel it cannot store. The returned rates are the realized change per
 * second, for the resource bar readouts.
 */
export function stepReductase(
  fuelAmount: number,
  atpAmount: number,
  atpCapacity: number,
  expression: number,
  dt: number,
): { fuel: number; atp: number; fuelRate: number; atpRate: number } {
  if (!(expression > 0) || !(dt > 0) || !(fuelAmount > 0)) {
    return { fuel: fuelAmount, atp: atpAmount, fuelRate: 0, atpRate: 0 };
  }
  const desired = REDUCTASE_FUEL_PER_SECOND * expression * dt;
  const atpHeadroom = atpCapacity > 0 ? (atpCapacity - atpAmount) / ATP_PER_FUEL_UNIT : 0;
  const burned = Math.min(desired, fuelAmount, Math.max(0, atpHeadroom));
  if (burned <= 0) return { fuel: fuelAmount, atp: atpAmount, fuelRate: 0, atpRate: 0 };
  const gained = burned * ATP_PER_FUEL_UNIT;
  return { fuel: fuelAmount - burned, atp: atpAmount + gained, fuelRate: burned / dt, atpRate: gained / dt };
}