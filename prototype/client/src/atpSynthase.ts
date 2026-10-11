import { geneExpressionLevel, type FlagellinConstruct } from "./flagellinDistribution";

/**
 * The fluxin cycle. ATP synthase spends fluxin: each unit becomes two ATP and
 * one refluxin. Fluxin synthase does not burn fuel. It sets how much carrier
 * the cell holds, and newly made carrier arrives spent, as refluxin, so
 * expressing it does not gift ATP. A reductase has to recharge that refluxin
 * before the synthase can spend it.
 *
 * The pool is a buffer. When the synthase outruns the reductase the carrier
 * sits as refluxin and ATP production falls to the reductase's rate. When the
 * reductase outruns the synthase the carrier sits as fluxin and ATP production
 * falls to the synthase's rate. A larger pool lets the cell coast through a
 * lull in either enzyme.
 */

/** Fluxin spent per second at full expression, while any fluxin remains. */
export const SYNTHASE_FLUXIN_PER_SECOND = 15;

/** ATP gained for every fluxin the synthase spends. The spent carrier returns as refluxin. */
export const ATP_PER_FLUXIN = 2;

/**
 * Carrier a cell holds before any Fluxin Synthase is expressed. Enough to run
 * the cycle once a reductase and ATP synthase are in the membrane and the
 * cytosol, and small enough that a lull empties it in a few seconds.
 */
export const CARRIER_BASE = 40;

/**
 * Extra carrier at full Fluxin Synthase expression. One medium copy adds half
 * of this. The pool tops out here because expression itself tops out at 1.
 */
export const CARRIER_PER_FLUX_EXPRESSION = 160;

/** ATP synthase only works while it is embedded in the membrane. */
const SYNTHASE_ROUTES = new Set(["TransmembraneSignal"]);

/** Fluxin synthase is a soluble cytosolic module, same as a reductase. */
const FLUX_ROUTES = new Set(["CYTO"]);

export type SynthaseStep = {
  fluxin: number;
  refluxin: number;
  atp: number;
  fluxinRate: number;
  refluxinRate: number;
  atpRate: number;
};

export type CarrierPool = {
  fluxin: number;
  refluxin: number;
  fluxinRate: number;
  refluxinRate: number;
};

/** Total ATP synthase expressed right now, transmembrane copies only. */
export function atpSynthaseExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, geneId, SYNTHASE_ROUTES, timeSeconds);
}

/** Total Fluxin Synthase expressed right now, cytosolic copies only. Untagged counts. */
export function fluxinSynthaseExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  const cytosolic = constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
  return geneExpressionLevel(cytosolic, geneId, FLUX_ROUTES, timeSeconds);
}

/** Working carrier the cell should hold at this Fluxin Synthase expression. */
export function carrierPoolTarget(fluxExpression: number): number {
  const level = Number.isFinite(fluxExpression) ? Math.min(1, Math.max(0, fluxExpression)) : 0;
  return CARRIER_BASE + CARRIER_PER_FLUX_EXPRESSION * level;
}

/**
 * Move the carrier pool onto its target. New units arrive as refluxin, so a
 * freshly expressed synthase is an empty battery. A shrinking pool sheds
 * refluxin first and fluxin after, so spent carrier goes before charge does.
 * Enzyme steps conserve the total; this is the only place the total changes.
 */
export function reconcileCarrier(fluxin: number, refluxin: number, target: number, dt: number): CarrierPool {
  let nextFluxin = Math.max(0, fluxin);
  let nextRefluxin = Math.max(0, refluxin);
  const goal = Math.max(0, target);
  const total = nextFluxin + nextRefluxin;
  if (total < goal) {
    nextRefluxin += goal - total;
  } else if (total > goal) {
    let extra = total - goal;
    const fromRefluxin = Math.min(nextRefluxin, extra);
    nextRefluxin -= fromRefluxin;
    extra -= fromRefluxin;
    nextFluxin -= Math.min(nextFluxin, extra);
  }
  const scale = dt > 0 ? 1 / dt : 0;
  return {
    fluxin: nextFluxin,
    refluxin: nextRefluxin,
    fluxinRate: (nextFluxin - fluxin) * scale,
    refluxinRate: (nextRefluxin - refluxin) * scale,
  };
}

/**
 * Step ATP synthase forward by dt. It runs at its expressed rate until fluxin
 * runs out, the refluxin pool has no room, or ATP is full. A full ATP pool
 * leaves the fluxin charged. The returned rates are the realized change per
 * second, for the resource bar.
 */
export function stepAtpSynthase(
  fluxinAmount: number,
  refluxinAmount: number,
  refluxinCapacity: number,
  atpAmount: number,
  atpCapacity: number,
  expression: number,
  dt: number,
): SynthaseStep {
  const idle: SynthaseStep = {
    fluxin: fluxinAmount,
    refluxin: refluxinAmount,
    atp: atpAmount,
    fluxinRate: 0,
    refluxinRate: 0,
    atpRate: 0,
  };
  if (!(expression > 0) || !(dt > 0) || !(fluxinAmount > 0)) return idle;
  const desired = SYNTHASE_FLUXIN_PER_SECOND * expression * dt;
  const refluxRoom = Math.max(0, refluxinCapacity - refluxinAmount);
  const atpRoom = Math.max(0, atpCapacity - atpAmount) / ATP_PER_FLUXIN;
  const spent = Math.min(desired, fluxinAmount, refluxRoom, atpRoom);
  if (!(spent > 0)) return idle;
  const gained = spent * ATP_PER_FLUXIN;
  return {
    fluxin: fluxinAmount - spent,
    refluxin: refluxinAmount + spent,
    atp: atpAmount + gained,
    fluxinRate: -spent / dt,
    refluxinRate: spent / dt,
    atpRate: gained / dt,
  };
}
