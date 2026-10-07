import { expressedAmount, genomeCanExpressGene, type FlagellinConstruct } from "./flagellinDistribution";
import type { FlagellumSite, PilusSite } from "./shape";

/**
 * Pilin expression, derived from genome constructs. Pure data logic with no
 * imports on the renderer or DOM so the coat rules stay testable alone.
 * Pilin leaves the cell two ways: a transmembrane construct embeds it in the
 * membrane as standing needles, and a secreted construct shoots it out as
 * ejected fragments. The expression level sets how many needles a region gets
 * and how long they are, which for secreted pilin is the fire rate and the
 * fragment size. Length variance is always full. No position tag spreads a
 * coat evenly over the whole membrane; a position tag keeps it on the
 * regions the tag names.
 */

/** Needles at full expression. Matches the sandbox Pili ceiling. */
export const PILIN_PILI_MAX = 32;

/** One membrane region holds a quarter of the full coat. */
const PILI_PER_SITE = PILIN_PILI_MAX / 4;

/** Genome-driven pili always use the sandbox variance ceiling. */
export const PILIN_LENGTH_VARIANCE = 1;

/** Pilin embedded in the membrane stands as spikes. */
const PILIN_MEMBRANE_ROUTES = new Set(["TransmembraneSignal"]);
/** Pilin sent out of the cell is ejected as fragments. */
const PILIN_SECRETED_ROUTES = new Set(["SecretoryPeptide"]);
/** Every route the pilin gene accepts. */
const PILIN_ROUTES = new Set([...PILIN_MEMBRANE_ROUTES, ...PILIN_SECRETED_ROUTES]);

const MEMBRANE_SITES: readonly FlagellumSite[] = ["polar", "antipolar", "lateral", "antilateral"];

/** Regions a position tag covers. An absent tag covers the whole membrane. */
const TAG_REGIONS: Record<string, readonly FlagellumSite[]> = {
  PolarLocalizationSignal: ["polar"],
  AntiPolarLocalizationSignal: ["antipolar"],
  LATR: ["lateral"],
  ANTL: ["antilateral"],
  BIPO: ["polar", "antipolar"],
  BILT: ["lateral", "antilateral"],
};

/** Needles grown from one expressed pilin construct, on one membrane region. */
export type PilinCoat = {
  site: PilusSite;
  /** Needle count on this region, already scaled by expression. */
  count: number;
  /** Average length, 0–1, the expression level on this region. */
  length: number;
};

/**
 * Pili grown from one pilin route, transmembrane or secreted. Each covered
 * region gets a count and length proportional to the pilin expressed there,
 * clamped at one region's share of the full coat. Untagged constructs add the
 * same level to every region, which is an even spread. Tagged constructs add
 * it only to the regions the tag names, at that full level rather than split
 * thin.
 */
function coatsFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds: number,
  routes: ReadonlySet<string>,
): PilinCoat[] {
  const level: Record<FlagellumSite, number> = { polar: 0, antipolar: 0, lateral: 0, antilateral: 0 };
  for (const construct of constructs) {
    if (construct.geneId !== "PILN") continue;
    if (construct.routeId === null || !routes.has(construct.routeId)) continue;
    const amount = expressedAmount(construct, timeSeconds);
    if (!(amount > 0)) continue;
    const regions = construct.siteId === null ? MEMBRANE_SITES : TAG_REGIONS[construct.siteId];
    if (!regions) continue;
    for (const site of regions) level[site] = Math.min(1, level[site] + amount);
  }
  const coats: PilinCoat[] = [];
  for (const site of MEMBRANE_SITES) {
    const expression = level[site];
    const count = Math.round(PILI_PER_SITE * expression);
    if (count <= 0) continue;
    coats.push({ site, count, length: expression });
  }
  return coats;
}

/** Pili standing on the membrane, from transmembrane Pilin. */
export function pilinFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): PilinCoat[] {
  return coatsFromConstructs(constructs, timeSeconds, PILIN_MEMBRANE_ROUTES);
}

/**
 * Pili shot out of the cell, from secreted Pilin. The count is the fire rate
 * — more expressed pilin ejects proportionally more fragments — and the
 * length is the fragment size.
 */
export function pilinSecretedFromConstructs(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): PilinCoat[] {
  return coatsFromConstructs(constructs, timeSeconds, PILIN_SECRETED_ROUTES);
}

/**
 * Whether any construct could ever express pilin on any route, regardless of
 * the current oscillation phase. The slider takeover uses this so a troughing
 * oscillatory promoter never hands the pili back to the sandbox controls.
 */
export function genomeCanDrivePilin(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(constructs, "PILN", PILIN_ROUTES);
}
