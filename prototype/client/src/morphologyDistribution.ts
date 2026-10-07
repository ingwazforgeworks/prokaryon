import {
  distributeBySite,
  geneExpressionLevel,
  genomeCanExpressGene,
  type FlagellinBySite,
  type FlagellinConstruct,
} from "./flagellinDistribution";
import { TAPER_ANTILATERAL, TAPER_ANTIPOLAR, TAPER_LATERAL, TAPER_POLAR } from "./shape";
import type { CellTaper } from "./types";

/**
 * Shape-gene expression, derived from genome constructs. Pure data logic with
 * no imports on the renderer or DOM so the morphology rules stay testable
 * alone. Elongin (ELGN), Girthin (GRTN) and Crescentin (CRST) are soluble
 * cytoskeletal modules, like the reductases: they fold only in the cytosol,
 * carry no position tag, and their expression level is the elongation, girth
 * or crescent value the sandbox sliders already read. Crystallin (CRYS) and
 * Isoprene Synthase (ISPR) are secreted builders: only copies sent out of the
 * cell reach the envelope, any expression at all installs the membrane
 * structure, and the expression level sets its thickness. Taperin (TPRN) is a
 * cytosolic module that works positionally — copies gathered at a site pinch
 * that end of the cell, in proportion to how strongly they are expressed.
 */

/** The shape modules only fold on copies that stay in the cytosol. */
const CYTOSOLIC_ROUTES = new Set(["CYTO"]);

/** The membrane builders only work once they have been secreted. */
const SECRETED_ROUTES = new Set(["SecretoryPeptide"]);

function cytosolicCopies(constructs: readonly FlagellinConstruct[]): FlagellinConstruct[] {
  // An untagged construct is also cytosolic — no signal peptide means the
  // protein stays in the cytosol — so it counts for a soluble module.
  return constructs.map((construct) =>
    construct.routeId === null ? { ...construct, routeId: "CYTO" } : construct,
  );
}

/** Total copies of one cytosolic shape gene (ELGN, GRTN, CRST) expressed right now. */
export function cytosolicMorphologyLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  return geneExpressionLevel(cytosolicCopies(constructs), geneId, CYTOSOLIC_ROUTES, timeSeconds);
}

/**
 * Whether any construct could ever express a cytosolic shape gene, regardless
 * of the current oscillation phase. The slider takeover uses this so a
 * troughing oscillatory promoter never hands the shape back to the sandbox
 * sliders for a moment.
 */
export function genomeCanDriveCytosolicMorphology(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
): boolean {
  return genomeCanExpressGene(cytosolicCopies(constructs), geneId, CYTOSOLIC_ROUTES);
}

/** Total secreted copies of one membrane builder (CRYS, ISPR) expressed right now. */
export function secretedMorphologyLevel(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
  timeSeconds = 0,
): number {
  return geneExpressionLevel(constructs, geneId, SECRETED_ROUTES, timeSeconds);
}

/**
 * Whether any construct could ever secrete a membrane builder. The button
 * takeover uses this so a troughing oscillatory promoter never hands the
 * membrane structure back to the sandbox controls for a moment.
 */
export function genomeCanDriveSecretedMorphology(
  constructs: readonly FlagellinConstruct[],
  geneId: string,
): boolean {
  return genomeCanExpressGene(constructs, geneId, SECRETED_ROUTES);
}

/** Per-site taperin levels from expressed, cytosolic TPRN constructs. */
export function taperinBySite(
  constructs: readonly FlagellinConstruct[],
  timeSeconds = 0,
): FlagellinBySite {
  return distributeBySite(cytosolicCopies(constructs), "TPRN", CYTOSOLIC_ROUTES, timeSeconds);
}

/**
 * Taperin state in the shape layer's own terms. A site with any taperin at
 * all joins the mask, and its expression level is that site's taper degree,
 * so the pinch lands where the protein gathers and deepens as expression
 * rises. An untagged construct spreads evenly, thinning the whole body at a
 * quarter strength per end.
 */
export function taperinCellTaper(constructs: readonly FlagellinConstruct[], timeSeconds = 0): CellTaper {
  const bySite = taperinBySite(constructs, timeSeconds);
  const mask =
    (bySite.polar > 0 ? TAPER_POLAR : 0) |
    (bySite.antipolar > 0 ? TAPER_ANTIPOLAR : 0) |
    (bySite.lateral > 0 ? TAPER_LATERAL : 0) |
    (bySite.antilateral > 0 ? TAPER_ANTILATERAL : 0);
  return {
    mask,
    polar: bySite.polar,
    antipolar: bySite.antipolar,
    lateral: bySite.lateral,
    antilateral: bySite.antilateral,
  };
}

/**
 * Whether any construct could ever put taperin in the cytosol, regardless of
 * the current oscillation phase. The slider takeover uses this so a troughing
 * oscillatory promoter never hands the taper back for a moment.
 */
export function genomeCanDriveTaperin(constructs: readonly FlagellinConstruct[]): boolean {
  return genomeCanExpressGene(cytosolicCopies(constructs), "TPRN", CYTOSOLIC_ROUTES);
}