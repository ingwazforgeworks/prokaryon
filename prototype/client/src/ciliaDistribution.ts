import {
  distributeBySite,
  geneExpressionLevel,
  genomeCanExpressGene,
  type FlagellinBySite,
  type FlagellinConstruct,
} from "./flagellinDistribution";
import type { FlagellumSite } from "./shape";

/**
 * Cilin and Ciliary Motor Protein expression, derived from genome constructs.
 * Pure data logic with no imports on the renderer, swim, or DOM so the
 * distribution rules stay testable alone. Cilin bristles the whole surface
 * evenly — it carries no position tag — and the coat density and hair length
 * both follow its total expression. The motor sits in the membrane wherever
 * its position tag puts it, and the cilia around it row the cell toward the
 * direction that site names; motors on opposing sites cancel, the way
 * opposing flagellar tufts do.
 */

/** Coat density at full expression, matching the sandbox slider's ceiling. */
export const CILIATION_MAX = 48;

/** Cilin only bristles the surface once it is exported out of the cell. */
const CILIN_ROUTES = new Set(["SecretoryPeptide"]);

/** The ciliary motor only rows from inside the membrane. */
const CILIUM_MOTOR_ROUTES = new Set(["TransmembraneSignal"]);

/** Net ciliary push: a direction in body coordinates and its strength. */
export type CiliumMotorDrive = { x: number; y: number; strength: number };

/**
 * Coat density and hair length from expressed Cilin. Both scale with the total
 * expression level, so a microexpressed construct grows a sparse coat of short
 * hairs and a hyperexpressed one grows the full dense thatch.
 */
export function cilinFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): { ciliation: number; length: number } {
  const level = geneExpressionLevel(constructs, "CILN", CILIN_ROUTES, timeSeconds);
  return { ciliation: Math.round(CILIATION_MAX * level), length: level };
}

/** Per-site ciliary motor levels from expressed CILM constructs. */
export function ciliumMotorFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): FlagellinBySite {
  return distributeBySite(constructs, "CILM", CILIUM_MOTOR_ROUTES, timeSeconds);
}

/**
 * Direction each site's motor rows the cell, in body coordinates: the polar
 * end is +x and the lateral flank is +y. A lateral motor sends the cell toward
 * the antipolar pole, a polar motor toward the lateral flank, and so on — the
 * same directions the sandbox's cilia switch picks.
 */
const MOTOR_DIRECTIONS: Record<FlagellumSite, { x: number; y: number }> = {
  polar: { x: 0, y: 1 },
  antipolar: { x: 0, y: -1 },
  lateral: { x: -1, y: 0 },
  antilateral: { x: 1, y: 0 },
};

const MOTOR_SITES: readonly FlagellumSite[] = ["polar", "antipolar", "lateral", "antilateral"];

/**
 * Net ciliary push from the per-site motor levels. Sites add as vectors, so a
 * motor on one site rows straight and motors on opposing sites cancel to a
 * standstill. Strength is the clamped length of the combined vector, so mixed
 * placements both steer between the named directions and row more gently than
 * a full single-site motor.
 */
export function ciliumMotorDrive(motor: FlagellinBySite): CiliumMotorDrive {
  let x = 0;
  let y = 0;
  for (const site of MOTOR_SITES) {
    const direction = MOTOR_DIRECTIONS[site];
    x += motor[site] * direction.x;
    y += motor[site] * direction.y;
  }
  const magnitude = Math.hypot(x, y);
  if (magnitude < 1e-6) return { x: 0, y: 0, strength: 0 };
  return { x: x / magnitude, y: y / magnitude, strength: Math.min(1, magnitude) };
}

/**
 * Whether any construct could ever bristle cilia, regardless of the current
 * oscillation phase. The frame loop uses this so a troughing oscillatory
 * promoter never hands the coat back to the sandbox sliders for a moment.
 */
export function genomeCanDriveCilia(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "CILN", CILIN_ROUTES);
}