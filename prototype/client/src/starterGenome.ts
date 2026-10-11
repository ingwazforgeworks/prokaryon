import type { Cassette, GenomeSnapshot } from "./genomeState";

/**
 * The smallest genome that can refill ATP, swim, grow, and divide.
 *
 * Ferron permease, in the membrane, imports dissolved ferron. Ferron
 * reductase, in the cytosol, burns that store and recharges refluxin into
 * fluxin. ATP synthase, in the membrane, spends the fluxin: two ATP, and the
 * carrier comes back as refluxin. The cell already holds a small carrier pool
 * without Fluxin Synthase. Those three run at medium, which is what it takes
 * to pay for the rest of this genome.
 *
 * Flagellin is secreted at the pole and the motor sits in the membrane at
 * that same pole. Low expression is one short filament. Anabolase and cyclin
 * stay in the cytosol at the same light setting, so the cell grows and can
 * divide. Always On needs no receptor.
 *
 * Low, medium, and the polar tag are not free, and neither are the flagellum
 * genes. A minimal start unlocks them. Anabolase and cyclin already come with
 * every cell.
 */
export const VIABLE_STARTING_FERRON = 400;

/** Parts and genes a minimal start unlocks so the genome it installs can be edited. */
export const VIABLE_UNLOCKS: readonly string[] = ["LOW", "MED", "PolarLocalizationSignal", "FLGN", "FLGM"];

const EMPTY_DRAFT: GenomeSnapshot["draft"] = {
  name: "Untitled construct",
  code: "",
  promoterId: null,
  amountId: null,
  amountMinId: null,
  amountMaxId: null,
  geneId: null,
  routeId: null,
  siteId: null,
  receptorId: null,
  responseId: null,
  threshold: null,
};

export const VIABLE_GENOME: readonly Cassette[] = [
  {
    uid: "starter-ferp",
    name: "Ferron import",
    code: "FERP",
    promoterId: "CNST",
    amountId: "MED",
    amountMinId: null,
    amountMaxId: null,
    geneId: "FERP",
    routeId: "TransmembraneSignal",
    siteId: null,
  },
  {
    uid: "starter-ferr",
    name: "Ferron burn",
    code: "FERR",
    promoterId: "CNST",
    amountId: "MED",
    amountMinId: null,
    amountMaxId: null,
    geneId: "FERR",
    routeId: "CYTO",
    siteId: null,
  },
  {
    uid: "starter-atps",
    name: "ATP synthase",
    code: "ATPS",
    promoterId: "CNST",
    amountId: "MED",
    amountMinId: null,
    amountMaxId: null,
    geneId: "ATPS",
    routeId: "TransmembraneSignal",
    siteId: null,
  },
  {
    uid: "starter-flgn",
    name: "Polar flagellin",
    code: "FLGN",
    promoterId: "CNST",
    amountId: "LOW",
    amountMinId: null,
    amountMaxId: null,
    geneId: "FLGN",
    routeId: "SecretoryPeptide",
    siteId: "PolarLocalizationSignal",
  },
  {
    uid: "starter-flgm",
    name: "Polar motor",
    code: "FLGM",
    promoterId: "CNST",
    amountId: "LOW",
    amountMinId: null,
    amountMaxId: null,
    geneId: "FLGM",
    routeId: "TransmembraneSignal",
    siteId: "PolarLocalizationSignal",
  },
  {
    uid: "starter-anab",
    name: "Anabolase",
    code: "ANAB",
    promoterId: "CNST",
    amountId: "LOW",
    amountMinId: null,
    amountMaxId: null,
    geneId: "ANAB",
    routeId: "CYTO",
    siteId: null,
  },
  {
    uid: "starter-cycl",
    name: "Cyclin",
    code: "CYCL",
    promoterId: "CNST",
    amountId: "LOW",
    amountMinId: null,
    amountMaxId: null,
    geneId: "CYCL",
    routeId: "CYTO",
    siteId: null,
  },
];

/** A fresh copy, so a later edit in the lab cannot rewrite the template. */
export function viableGenomeSnapshot(): GenomeSnapshot {
  return {
    v: 1,
    draft: { ...EMPTY_DRAFT },
    genome: VIABLE_GENOME.map((cassette) => ({ ...cassette })),
  };
}
