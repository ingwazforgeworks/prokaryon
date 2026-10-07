import type { FlagellinConstruct } from "./flagellinDistribution";
import { PILIN_LENGTH_VARIANCE, PILIN_PILI_MAX, genomeCanDrivePilin, pilinFromConstructs, pilinSecretedFromConstructs } from "./pilinDistribution";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "PILN",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "TransmembraneSignal",
  siteId: null,
  ...overrides,
});

const perSite = PILIN_PILI_MAX / 4;
const countOn = (site: string, coats = pilinFromConstructs([construct()])): number =>
  coats.find((coat) => coat.site === site)?.count ?? 0;

check(PILIN_LENGTH_VARIANCE === 1, "genome pili use full length variance");
check(pilinFromConstructs([]).length === 0, "no constructs grow no pili");
check(pilinFromConstructs([construct({ routeId: null })]).length === 0, "untagged pilin stays inside and grows nothing");
check(pilinFromConstructs([construct({ routeId: "CYTO" })]).length === 0, "cytosolic pilin grows nothing");
check(pilinFromConstructs([construct({ routeId: "SecretoryPeptide" })]).length === 0, "secreted pilin stands no membrane spikes");
check(pilinFromConstructs([construct({ routeId: "SURF" })]).length === 0, "membrane-anchored pilin grows nothing");
check(pilinFromConstructs([construct({ promoterId: "GRAD" })]).length === 0, "unsimulated promoters produce no pilin yet");
check(pilinFromConstructs([construct({ geneId: "FLGN" })]).length === 0, "flagellin constructs do not grow pili");

const spread = pilinFromConstructs([construct()]);
check(spread.length === 4, "pilin with no position tag covers every membrane region");
check(
  spread.every((coat) => coat.count === perSite && coat.length === 1),
  "full untagged expression puts a full share of full-length pili on every region",
);
check(
  spread.reduce((total, coat) => total + coat.count, 0) === PILIN_PILI_MAX,
  "a full untagged coat uses the sandbox maximum",
);

const polar = pilinFromConstructs([construct({ siteId: "PolarLocalizationSignal" })]);
check(polar.length === 1 && polar[0]?.site === "polar" && polar[0]?.count === perSite && polar[0]?.length === 1, "a polar tag keeps the full share on the polar cap");
check(countOn("antipolar", polar) === 0 && countOn("lateral", polar) === 0, "a polar tag leaves the other regions bare");

const antipolar = pilinFromConstructs([construct({ siteId: "AntiPolarLocalizationSignal" })]);
check(antipolar.length === 1 && antipolar[0]?.site === "antipolar", "an antipolar tag sits on the antipolar cap");
const lateral = pilinFromConstructs([construct({ siteId: "LATR" })]);
check(lateral.length === 1 && lateral[0]?.site === "lateral", "a lateral tag sits on one flank");
const antilateral = pilinFromConstructs([construct({ siteId: "ANTL" })]);
check(antilateral.length === 1 && antilateral[0]?.site === "antilateral", "an antilateral tag sits on the other flank");

const bipolar = pilinFromConstructs([construct({ siteId: "BIPO" })]);
check(
  bipolar.length === 2 && bipolar.every((coat) => coat.count === perSite && coat.length === 1),
  "a bipolar tag puts a full share on both poles",
);
check(countOn("lateral", bipolar) === 0 && countOn("antilateral", bipolar) === 0, "a bipolar tag leaves the flanks bare");
const bilateral = pilinFromConstructs([construct({ siteId: "BILT" })]);
check(
  bilateral.length === 2 && bilateral.every((coat) => (coat.site === "lateral" || coat.site === "antilateral") && coat.length === 1),
  "a bilateral tag puts pili on both flanks",
);

const half = pilinFromConstructs([construct({ amountId: "MED", siteId: "PolarLocalizationSignal" })]);
check(half.length === 1 && half[0]?.count === Math.round(perSite * 0.5) && half[0]?.length === 0.5, "medium expression grows half as many pili at half length");
const thin = pilinFromConstructs([construct({ amountId: "MICRO" })]);
check(
  thin.length === 4 && thin.every((coat) => coat.count === Math.round(perSite * 0.1) && coat.length === 0.1),
  "microexpression grows a short needle on every region",
);
check(
  pilinFromConstructs([construct({ amountId: "MED", siteId: "PolarLocalizationSignal" }), construct({ amountId: "MED", siteId: "PolarLocalizationSignal" })])[0]?.count === perSite,
  "stacked pilin on one region clamps at that region's share",
);

const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER", siteId: "LATR" };
const low = pilinFromConstructs([construct(swing)], 0);
const high = pilinFromConstructs([construct(swing)], 2);
check(low.length === 1 && low[0]?.length === 0.1 && low[0]?.count === Math.round(perSite * 0.1), "an oscillatory pilin rests at its minimum at t=0");
check(high.length === 1 && high[0]?.length === 1 && high[0]?.count === perSite, "an oscillatory pilin peaks at its maximum at the half period");

check(genomeCanDrivePilin([]) === false, "an empty genome cannot drive pili");
check(genomeCanDrivePilin([construct()]) === true, "a transmembrane pilin construct drives pili");
check(genomeCanDrivePilin([construct({ routeId: "SecretoryPeptide" })]) === true, "secreted pilin drives pili");
check(genomeCanDrivePilin([construct({ routeId: null })]) === false, "untagged pilin cannot drive pili");
check(genomeCanDrivePilin([construct({ promoterId: "GRAD" })]) === false, "an unsimulated promoter cannot drive pili");
check(genomeCanDrivePilin([construct(swing)]) === true, "an oscillatory pilin at its trough still owns the pili");

// Secreted pilin: the same coat rules on the secreted route, feeding ejection.
check(pilinSecretedFromConstructs([]).length === 0, "no constructs secrete nothing");
check(pilinSecretedFromConstructs([construct()]).length === 0, "transmembrane pilin secretes nothing");
check(pilinSecretedFromConstructs([construct({ routeId: null })]).length === 0, "untagged pilin secretes nothing");
check(pilinSecretedFromConstructs([construct({ routeId: "CYTO" })]).length === 0, "cytosolic pilin secretes nothing");
const spray = pilinSecretedFromConstructs([construct({ routeId: "SecretoryPeptide" })]);
check(spray.length === 4, "secreted pilin with no position tag ejects from every region");
check(
  spray.every((coat) => coat.count === perSite && coat.length === 1),
  "full untagged secretion fires every region at full rate",
);
const polarSpray = pilinSecretedFromConstructs([construct({ routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" })]);
check(polarSpray.length === 1 && polarSpray[0]?.site === "polar", "a polar tag ejects only from the polar cap");
const halfSpray = pilinSecretedFromConstructs([construct({ routeId: "SecretoryPeptide", amountId: "MED", siteId: "PolarLocalizationSignal" })]);
check(
  halfSpray.length === 1 && halfSpray[0]?.count === Math.round(perSite * 0.5) && halfSpray[0]?.length === 0.5,
  "half expression fires half as often with half-length fragments",
);
const mixed = pilinSecretedFromConstructs([
  construct({ siteId: "PolarLocalizationSignal" }),
  construct({ routeId: "SecretoryPeptide", siteId: "LATR" }),
]);
check(
  mixed.length === 1 && mixed[0]?.site === "lateral",
  "transmembrane and secreted constructs each keep their own coat",
);
check(pilinFromConstructs([
  construct({ siteId: "PolarLocalizationSignal" }),
  construct({ routeId: "SecretoryPeptide", siteId: "LATR" }),
]).length === 1, "the membrane coat ignores secreted constructs");

if (failed > 0) throw new Error(`${failed} pilin checks failed`);
console.log("pilin checks passed");
