/**
 * Where a gene's protein is allowed to sit. These rules belong with the
 * catalog, not with the player's draft. A gene missing from a map takes any
 * value of that kind. An empty site list means the gene refuses a position tag.
 */

/** Default tags the genome viewer stamps on a catalog cassette. */
const CATALOG_PLACEMENTS: Record<string, { routeId: string | null; siteId: string | null }> = {
  GFP: { routeId: "CYTO", siteId: null },
  ANAB: { routeId: "CYTO", siteId: null },
  CYCL: { routeId: "CYTO", siteId: null },
  GLYP: { routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" },
  NITP: { routeId: "TransmembraneSignal", siteId: null },
  OXDP: { routeId: "TransmembraneSignal", siteId: null },
  LIPP: { routeId: "SecretoryPeptide", siteId: "LATR" },
  SLFP: { routeId: "TransmembraneSignal", siteId: null },
  CBXP: { routeId: "SecretoryPeptide", siteId: "BILT" },
  ATPS: { routeId: "TransmembraneSignal", siteId: null },
  ADHN: { routeId: "TransmembraneSignal", siteId: null },
  AQUP: { routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" },
  PPMP: { routeId: "SURF", siteId: "AntiPolarLocalizationSignal" },
  PHOR: { routeId: "SURF", siteId: "BIPO" },
  SIDP: { routeId: "SURF", siteId: "LATR" },
  CRTS: { routeId: "SURF", siteId: "ANTL" },
  BFP: { routeId: "SURF", siteId: "BILT" },
  FLGN: { routeId: null, siteId: "PolarLocalizationSignal" },
  FLGM: { routeId: "TransmembraneSignal", siteId: null },
  PILN: { routeId: "TransmembraneSignal", siteId: "AntiPolarLocalizationSignal" },
  CHMR: { routeId: null, siteId: "BIPO" },
  OSMR: { routeId: "TransmembraneSignal", siteId: null },
  CHLS: { routeId: null, siteId: "LATR" },
  FERP: { routeId: "TransmembraneSignal", siteId: null },
  FERR: { routeId: "CYTO", siteId: null },
  SLFR: { routeId: "CYTO", siteId: null },
  FSXR: { routeId: "CYTO", siteId: null },
  NXDR: { routeId: "CYTO", siteId: null },
  BUOY: { routeId: "CYTO", siteId: null },
  BALA: { routeId: "CYTO", siteId: null },
  LUBR: { routeId: "SecretoryPeptide", siteId: null },
  CILN: { routeId: "SecretoryPeptide", siteId: null },
  ELGN: { routeId: "CYTO", siteId: null },
  GRTN: { routeId: "CYTO", siteId: null },
  CRST: { routeId: "CYTO", siteId: null },
  CRYS: { routeId: "SecretoryPeptide", siteId: null },
  ISPR: { routeId: "SecretoryPeptide", siteId: null },
  TPRN: { routeId: "CYTO", siteId: "PolarLocalizationSignal" },
  CILM: { routeId: "TransmembraneSignal", siteId: "PolarLocalizationSignal" },
  FRMP: { routeId: null, siteId: "BILT" },
};

/** Genes whose protein only works through one specific destination route. */
const GENE_ROUTES: Record<string, string[]> = {
  ANAB: ["CYTO"],
  CYCL: ["CYTO"],
  ATPS: ["TransmembraneSignal"],
  ADHN: ["TransmembraneSignal"],
  COHS: ["SecretoryPeptide", "SURF"],
  FLGN: ["SecretoryPeptide"],
  FLGM: ["TransmembraneSignal"],
  FERP: ["TransmembraneSignal"],
  SLFP: ["TransmembraneSignal"],
  NITP: ["TransmembraneSignal"],
  OXDP: ["TransmembraneSignal"],
  FERR: ["CYTO"],
  SLFR: ["CYTO"],
  FSXR: ["CYTO"],
  NXDR: ["CYTO"],
  BUOY: ["CYTO"],
  BALA: ["CYTO"],
  ELGN: ["CYTO"],
  GRTN: ["CYTO"],
  CRST: ["CYTO"],
  TPRN: ["CYTO"],
  CILN: ["SecretoryPeptide"],
  LUBR: ["SecretoryPeptide"],
  CRYS: ["SecretoryPeptide"],
  ISPR: ["SecretoryPeptide"],
  CILM: ["TransmembraneSignal"],
  PILN: ["TransmembraneSignal", "SecretoryPeptide"],
  OSMR: ["TransmembraneSignal"],
  AQUP: ["TransmembraneSignal"],
};

/** Genes that cannot carry a position tag. Genes left out take any position. */
const GENE_SITES: Record<string, string[]> = {
  ANAB: [],
  CYCL: [],
  ATPS: [],
  ADHN: [],
  COHS: [],
  FERP: [],
  SLFP: [],
  NITP: [],
  OXDP: [],
  FERR: [],
  SLFR: [],
  FSXR: [],
  NXDR: [],
  BUOY: [],
  BALA: [],
  CILN: [],
  LUBR: [],
  ELGN: [],
  GRTN: [],
  CRST: [],
  CRYS: [],
  ISPR: [],
};

/**
 * Genes whose cytosolic copies may still carry a position tag. Taperin shapes
 * the cell where it gathers, so its mandatory cytosolic route is the one route
 * allowed to pair with a position tag.
 */
const CYTOSOLIC_SITE_GENES: ReadonlySet<string> = new Set(["TPRN"]);

/** Whether a gene's cytosolic copies accept a position tag. */
export function geneAcceptsCytosolicSite(geneId: string | null): boolean {
  return geneId !== null && CYTOSOLIC_SITE_GENES.has(geneId);
}

/**
 * Whether a gene accepts a destination route. Genes without a restriction take
 * any route; the restriction only binds once the coding region is placed.
 */
export function geneAcceptsRoute(geneId: string | null, routeId: string): boolean {
  if (geneId === null) return true;
  const allowed = GENE_ROUTES[geneId];
  return allowed === undefined || allowed.includes(routeId);
}

/**
 * Whether a gene accepts a position tag at all. Genes without a restriction
 * take any position; the restriction only binds once the coding region is placed.
 */
export function geneAcceptsSite(geneId: string | null): boolean {
  if (geneId === null) return true;
  const allowed = GENE_SITES[geneId];
  return allowed === undefined || allowed.length > 0;
}

/** Route ids a restricted gene accepts. Empty when the gene takes any route. */
export function routeIdsFor(geneId: string): readonly string[] {
  return GENE_ROUTES[geneId] ?? [];
}

/** Tags stamped onto a catalog cassette for this gene. */
export function catalogPlacement(geneId: string): { routeId: string | null; siteId: string | null } {
  return CATALOG_PLACEMENTS[geneId] ?? { routeId: null, siteId: null };
}
