import { geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * Respiratory reductases — Ferron Reductase (FERR), Sulfex Reductase (SLFR),
 * and the paired modules Ferrosulfex Reductase (FSXR) and Nitroxidex Reductase
 * (NXDR). Pure data logic with no imports on the renderer, resources, or DOM
 * so the burn rules stay testable alone.
 *
 * A reductase does not mint ATP. It burns fuel to recharge spent carrier:
 * one refluxin becomes one fluxin. ATP synthase is what spends that fluxin
 * and hands the carrier back as refluxin. A cell with fuel and no refluxin
 * is fully charged and waits on the synthase. A cell with refluxin and no
 * fuel is discharged and waits on a reductase.
 */

/** Fuel units burned per second at full expression with a saturated store. */
export const REDUCTASE_FUEL_PER_SECOND = 5;

/**
 * Store size at which the burn runs at half its expressed rate. Below this the
 * reductase slows, so a permease feeding an empty cell fills a visible reserve
 * instead of turning each frame's import into charge before the pool can be seen.
 */
export const REDUCTASE_HALF_STORE = 100;

/** Fluxin restored for every fuel unit a single reductase burns. One spent carrier, recharged. */
export const FLUXIN_PER_FUEL = 1;

/**
 * Fluxin restored for every fuel unit a paired reductase burns. A pair spends
 * one unit of each fuel and recharges three carrier, so ATP synthase later
 * returns more ATP from that meal than from burning the same units apart.
 */
export const PAIRED_FLUXIN_PER_FUEL = 3;

/**
 * The reductases are soluble cytosolic modules: they work with no destination
 * tag at all, and an explicit Cytosol tag changes nothing. Copies routed to
 * the membrane or out of the cell never fold into the working module.
 */
const REDUCTASE_ROUTES = new Set(["CYTO"]);

export type ReductaseStep = {
  fuel: number;
  refluxin: number;
  fluxin: number;
  fuelRate: number;
  refluxinRate: number;
  fluxinRate: number;
};

export type PairedReductaseStep = {
  fuelA: number;
  fuelB: number;
  refluxin: number;
  fluxin: number;
  fuelRate: number;
  refluxinRate: number;
  fluxinRate: number;
};

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
 * Step one reductase forward by dt. The burn rate follows expression and how
 * full the fuel store is: an empty pool burns nothing, a store at
 * REDUCTASE_HALF_STORE burns at half the expressed rate, and only a deep store
 * reaches the full rate. The burn also stops when refluxin runs out or the
 * fluxin pool has no room, because the carrier has to be there to recharge.
 * The returned rates are the realized change per second, for the resource bar.
 */
export function stepReductase(
  fuelAmount: number,
  refluxinAmount: number,
  fluxinAmount: number,
  fluxinCapacity: number,
  expression: number,
  dt: number,
): ReductaseStep {
  const idle: ReductaseStep = {
    fuel: fuelAmount,
    refluxin: refluxinAmount,
    fluxin: fluxinAmount,
    fuelRate: 0,
    refluxinRate: 0,
    fluxinRate: 0,
  };
  if (!(expression > 0) || !(dt > 0) || !(fuelAmount > 0) || !(refluxinAmount > 0)) return idle;
  const saturation = fuelAmount / (fuelAmount + REDUCTASE_HALF_STORE);
  const desired = REDUCTASE_FUEL_PER_SECOND * expression * saturation * dt;
  const room = Math.max(0, fluxinCapacity - fluxinAmount);
  const burned = Math.min(desired, fuelAmount, refluxinAmount / FLUXIN_PER_FUEL, room / FLUXIN_PER_FUEL);
  if (!(burned > 0)) return idle;
  const charged = burned * FLUXIN_PER_FUEL;
  return {
    fuel: fuelAmount - burned,
    refluxin: refluxinAmount - charged,
    fluxin: fluxinAmount + charged,
    fuelRate: burned / dt,
    refluxinRate: -charged / dt,
    fluxinRate: charged / dt,
  };
}

/**
 * Step a paired reductase forward by dt. It burns the same amount from both
 * stores, and it burns nothing when either store is empty. Each unit of each
 * fuel recharges PAIRED_FLUXIN_PER_FUEL carrier, so the pair needs a deeper
 * discharged pool than a single reductase and pays it back as a larger charge.
 */
export function stepPairedReductase(
  fuelA: number,
  fuelB: number,
  refluxinAmount: number,
  fluxinAmount: number,
  fluxinCapacity: number,
  expression: number,
  dt: number,
): PairedReductaseStep {
  const idle: PairedReductaseStep = {
    fuelA,
    fuelB,
    refluxin: refluxinAmount,
    fluxin: fluxinAmount,
    fuelRate: 0,
    refluxinRate: 0,
    fluxinRate: 0,
  };
  if (!(expression > 0) || !(dt > 0) || !(fuelA > 0) || !(fuelB > 0) || !(refluxinAmount > 0)) return idle;
  const lesser = Math.min(fuelA, fuelB);
  const saturation = lesser / (lesser + REDUCTASE_HALF_STORE);
  const desired = REDUCTASE_FUEL_PER_SECOND * expression * saturation * dt;
  const room = Math.max(0, fluxinCapacity - fluxinAmount);
  const burned = Math.min(desired, fuelA, fuelB, refluxinAmount / PAIRED_FLUXIN_PER_FUEL, room / PAIRED_FLUXIN_PER_FUEL);
  if (!(burned > 0)) return idle;
  const charged = Math.min(refluxinAmount, room, burned * PAIRED_FLUXIN_PER_FUEL);
  const used = charged / PAIRED_FLUXIN_PER_FUEL;
  return {
    fuelA: fuelA - used,
    fuelB: fuelB - used,
    refluxin: refluxinAmount - charged,
    fluxin: fluxinAmount + charged,
    fuelRate: used / dt,
    refluxinRate: -charged / dt,
    fluxinRate: charged / dt,
  };
}
