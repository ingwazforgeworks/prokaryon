import type { FlagellumSite } from "./shape";

/**
 * Flagellin expression, derived from genome constructs. Pure data logic with no
 * imports on the genome or DOM so the distribution rules stay testable alone.
 */

/** Promoters whose expression is simulated. Others produce no protein yet. */
const EXPRESSED_PROMOTERS = new Set(["CNST", "OSCL"]);

/** Flagellin only assembles extracellular flagella when it is secreted. */
const FUNCTIONAL_ROUTES = new Set(["SecretoryPeptide"]);

/**
 * Flagellin yield per amount tile. Microexpression keeps the old untagged
 * baseline. The middle steps land on the filament thresholds in
 * filamentsForFlagellin (a second filament at 0.5, a third at 0.78), so each
 * tier either lengthens the tuft or adds a whole filament.
 */
const AMOUNT_YIELD: Record<string, number> = {
  OFF: 0,
  MICRO: 0.1,
  LOW: 0.3,
  MED: 0.5,
  HIGH: 0.7,
  OVER: 0.85,
  HYPER: 1,
};

/** Constructs with no amount tile express the microexpression baseline. */
const UNTAGGED_YIELD = 0.1;

/** Oscillatory promoters complete one smooth sine cycle over this span. */
export const OSCILLATION_PERIOD_SECONDS = 4;

/**
 * Beat calibration: the cycle length scales with how much motor protein is
 * expressed. Microexpression (level 0.1) whips every 1.6 seconds; a
 * hyperexpressed motor (level 1) settles into one long 16-second beat.
 */
export const BEAT_PERIOD_AT_MICRO_SECONDS = 1.6;
export const BEAT_PERIOD_AT_HYPER_SECONDS = 16;

/** Shortest cycle the clock will run, so vanishing expression cannot stall it. */
const BEAT_PERIOD_FLOOR_SECONDS = 0.2;

/** Share of each beat cycle the motor spends whipping. Redrawn every cycle. */
const BEAT_SPAN_MIN = 0.55;
const BEAT_SPAN_MAX = 0.8;

/**
 * Deterministic pseudo-random unit in [0, 1). Beat cycles draw their pulse
 * span from this instead of Math.random so the clock stays testable.
 */
function unitNoise(seed: number): number {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export interface FlagellarBeatState {
  /** Fraction of the way through the current beat cycle. */
  phase: number;
  /** Index of the current cycle. The pulse span is drawn from it. */
  cycle: number;
}

function beatSpan(cycle: number): number {
  return BEAT_SPAN_MIN + (BEAT_SPAN_MAX - BEAT_SPAN_MIN) * unitNoise(cycle);
}

export function initialBeatState(cycleOffset = 0): FlagellarBeatState {
  return { phase: 0, cycle: Math.max(0, Math.floor(cycleOffset)) };
}

/** Cycle length for an expression level. Linear, so MICRO lands on 1.6s and HYPER on 16s. */
export function beatPeriodSeconds(level: number): number {
  return Math.max(BEAT_PERIOD_AT_HYPER_SECONDS * Math.max(level, 0), BEAT_PERIOD_FLOOR_SECONDS);
}

/**
 * Advance the motor's beat clock by dt at the given expression level and
 * report the beat strength in [0, 1]: a smooth whip over the cycle's pulse
 * span, then a quiet gap. The span is redrawn from the cycle index, so pulse
 * lengths vary stochastically even under constant expression, and the gaps
 * let the swim layer spend its release kick, turning each beat into a short
 * run with a random reorientation. With no motor protein there is no beat.
 */
export function stepFlagellarBeat(
  state: FlagellarBeatState,
  level: number,
  dt: number,
): { state: FlagellarBeatState; envelope: number } {
  if (!(level > 0)) return { state, envelope: 0 };
  const period = beatPeriodSeconds(level);
  let phase = state.phase + Math.max(dt, 0) / period;
  let cycle = state.cycle;
  for (let guard = 0; phase >= 1 && guard < 4; guard += 1) {
    phase -= 1;
    cycle += 1;
  }
  const span = beatSpan(cycle);
  if (phase >= span) return { state: { phase, cycle }, envelope: 0 };
  const whip = Math.sin(Math.PI * (phase / span));
  return { state: { phase, cycle }, envelope: whip * whip };
}

export type FlagellinConstruct = {
  promoterId: string;
  geneId: string;
  amountId: string | null;
  routeId: string | null;
  siteId: string | null;
  /** Range promoters (OSCL) carry a min/max pair instead of a single amount. */
  amountMinId?: string | null;
  amountMaxId?: string | null;
};

export type FlagellinBySite = Record<FlagellumSite, number>;

/** Position tags concentrate the same flagellin on fewer sites. */
const SITE_WEIGHTS: Record<string, Partial<FlagellinBySite>> = {
  PolarLocalizationSignal: { polar: 1 },
  AntiPolarLocalizationSignal: { antipolar: 1 },
  BIPO: { polar: 0.5, antipolar: 0.5 },
  BILT: { lateral: 0.5, antilateral: 0.5 },
  LATR: { lateral: 1 },
  ANTL: { antilateral: 1 },
};

/** Without a position tag the flagellin spreads evenly across the four sites. */
const SPREAD_WEIGHTS: FlagellinBySite = { antipolar: 0.25, polar: 0.25, lateral: 0.25, antilateral: 0.25 };

const SITES: readonly FlagellumSite[] = ["antipolar", "polar", "lateral", "antilateral"];

export function flagellinFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): FlagellinBySite {
  return distributeBySite(constructs, "FLGN", FUNCTIONAL_ROUTES, timeSeconds);
}

/**
 * The motor protein only works embedded in the membrane. Cytosolic, secreted,
 * and surface-anchored copies spin nothing, so the motor accepts no substitute
 * for the transmembrane route.
 */
const MOTOR_ROUTES = new Set(["TransmembraneSignal"]);

/** Per-site flagellar motor levels from expressed FLGM constructs. */
export function motorFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): FlagellinBySite {
  return distributeBySite(constructs, "FLGM", MOTOR_ROUTES, timeSeconds);
}

/**
 * Total motor protein expressed right now, before it is distributed to sites.
 * The beat clock reads this, so the pulse length tracks the promoter and
 * amount tiles rather than where the protein ends up. Position tags that
 * spread the protein thin do not slow the beat; only expression level does.
 */
export function motorExpressionLevel(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): number {
  let total = 0;
  for (const construct of constructs) {
    if (construct.geneId !== "FLGM") continue;
    if (!EXPRESSED_PROMOTERS.has(construct.promoterId)) continue;
    if (construct.routeId === null || !MOTOR_ROUTES.has(construct.routeId)) continue;
    total += producedAmount(construct, timeSeconds);
  }
  return Math.min(1, total);
}

/**
 * Smooth sine phase in [0, 1] for oscillatory promoters: 0 at t=0, rising
 * through 0.5 at the half period, 1 at the crest, back to the trough. Constant
 * promoters stay pinned at full output.
 */
function promoterPhase(promoterId: string, timeSeconds: number): number {
  if (promoterId !== "OSCL") return 1;
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * timeSeconds) / OSCILLATION_PERIOD_SECONDS);
}

/**
 * Protein output of one construct at a point in time. Range promoters swing
 * between their min and max tiles; missing tiles fall back to the untagged
 * baseline, and a nonsensical min/max pair is clamped into order.
 */
function producedAmount(construct: FlagellinConstruct, timeSeconds: number): number {
  if (construct.promoterId !== "OSCL") {
    return construct.amountId !== null ? (AMOUNT_YIELD[construct.amountId] ?? UNTAGGED_YIELD) : UNTAGGED_YIELD;
  }
  const min = construct.amountMinId !== null && construct.amountMinId !== undefined
    ? (AMOUNT_YIELD[construct.amountMinId] ?? 0)
    : 0;
  const max = construct.amountMaxId !== null && construct.amountMaxId !== undefined
    ? (AMOUNT_YIELD[construct.amountMaxId] ?? UNTAGGED_YIELD)
    : UNTAGGED_YIELD;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + (hi - lo) * promoterPhase(construct.promoterId, timeSeconds);
}

function distributeBySite(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  functionalRoutes: ReadonlySet<string>,
  timeSeconds: number,
): FlagellinBySite {
  const totals: FlagellinBySite = { antipolar: 0, polar: 0, lateral: 0, antilateral: 0 };
  for (const construct of constructs) {
    if (construct.geneId !== geneId) continue;
    if (!EXPRESSED_PROMOTERS.has(construct.promoterId)) continue;
    if (construct.routeId === null || !functionalRoutes.has(construct.routeId)) continue;
    const weights = (construct.siteId !== null ? SITE_WEIGHTS[construct.siteId] : undefined) ?? SPREAD_WEIGHTS;
    const produced = producedAmount(construct, timeSeconds);
    for (const site of SITES) totals[site] += produced * (weights[site] ?? 0);
  }
  return {
    antipolar: Math.min(1, totals.antipolar),
    polar: Math.min(1, totals.polar),
    lateral: Math.min(1, totals.lateral),
    antilateral: Math.min(1, totals.antilateral),
  };
}

export function genomeDrivesFlagellin(totals: FlagellinBySite): boolean {
  return SITES.some((site) => totals[site] > 0);
}

/**
 * Whether any construct could ever put flagellin on the cell, regardless of
 * the current oscillation phase. The frame loop uses this so a troughing
 * oscillatory promoter never hands the flagella back to the sandbox sliders.
 */
export function genomeCanDriveFlagellin(constructs: readonly FlagellinConstruct[]): boolean {
  return constructs.some(
    (construct) =>
      construct.geneId === "FLGN" &&
      EXPRESSED_PROMOTERS.has(construct.promoterId) &&
      construct.routeId !== null &&
      FUNCTIONAL_ROUTES.has(construct.routeId),
  );
}

/** Whether any simulated construct oscillates and needs per-frame updates. */
export function genomeHasOscillation(constructs: readonly FlagellinConstruct[]): boolean {
  return constructs.some((construct) => construct.promoterId === "OSCL");
}