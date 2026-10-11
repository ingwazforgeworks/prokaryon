import { ATP_PER_FLUXIN } from "./atpSynthase";
import { flagellinFromConstructs, motorFromConstructs } from "./flagellinDistribution";
import { filamentsForFlagellin } from "./flagellum";
import { applySnapshot, geneAtpWeight, genomeAtpUpkeep, getGenome, resetGenomeState } from "./genomeState";
import { geneUnlockCost, isGeneDefault, isPartUnlocked, resetUnlocks } from "./geneUnlocks";
import { anabolaseExpressionLevel, cyclinExpressionLevel } from "./reproduction";
import { HARD_MUTATION_POINTS, HARD_STARTING_ATP, STARTING_ATP, STARTING_MUTATION_POINTS } from "./resources";
import { REDUCTASE_FUEL_PER_SECOND, REDUCTASE_HALF_STORE } from "./reductase";
import { VIABLE_GENOME, VIABLE_STARTING_FERRON, VIABLE_UNLOCKS, viableGenomeSnapshot } from "./starterGenome";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

resetGenomeState();
resetUnlocks();
applySnapshot(viableGenomeSnapshot());

const loaded = getGenome();
check(loaded.length === VIABLE_GENOME.length, "the minimal genome is seven constructs");
check(
  loaded.map((cassette) => cassette.geneId).join() === "FERP,FERR,ATPS,FLGN,FLGM,ANAB,CYCL",
  "the minimal genome respires, swims, grows, and can divide",
);
check(loaded.every((cassette) => cassette.promoterId === "CNST"), "every starter construct is always on");
check(
  loaded.filter((cassette) => cassette.geneId === "FERP" || cassette.geneId === "FERR" || cassette.geneId === "ATPS").every((cassette) => cassette.amountId === "MED"),
  "the ferron chain runs at medium so it can carry the rest",
);
check(
  loaded.filter((cassette) => cassette.geneId === "FLGN" || cassette.geneId === "FLGM" || cassette.geneId === "ANAB" || cassette.geneId === "CYCL").every((cassette) => cassette.amountId === "LOW"),
  "the flagellum, anabolase, and cyclin run lightly",
);
check(loaded[0]?.routeId === "TransmembraneSignal" && loaded[1]?.routeId === "CYTO" && loaded[2]?.routeId === "TransmembraneSignal", "the permease and the synthase sit in the membrane, and the reductase stays in the cytosol");
const flagellin = loaded.find((cassette) => cassette.geneId === "FLGN");
const motorGene = loaded.find((cassette) => cassette.geneId === "FLGM");
check(
  flagellin?.routeId === "SecretoryPeptide" && flagellin.siteId === "PolarLocalizationSignal" && motorGene?.routeId === "TransmembraneSignal" && motorGene.siteId === "PolarLocalizationSignal",
  "flagellin is secreted at the pole and the motor sits there with it",
);
check(loaded.find((cassette) => cassette.geneId === "ANAB")?.routeId === "CYTO" && loaded.find((cassette) => cassette.geneId === "CYCL")?.routeId === "CYTO", "anabolase and cyclin stay in the cytosol");
const placed = flagellinFromConstructs(loaded);
const motor = motorFromConstructs(loaded);
check(placed.polar > 0 && placed.antipolar === 0 && placed.lateral === 0 && placed.antilateral === 0, "flagellin gathers only at the pole");
check(filamentsForFlagellin(placed.polar, 1).length === 1, "low flagellin is a single filament");
check(motor.polar > 0 && motor.antipolar === 0 && motor.lateral === 0 && motor.antilateral === 0, "the motor turns that same pole");
check(anabolaseExpressionLevel(loaded) > 0 && cyclinExpressionLevel(loaded) > 0, "anabolase and cyclin are expressed");
check(geneUnlockCost("FERP") === null && geneUnlockCost("FERR") === null && geneUnlockCost("ATPS") === null, "the ferron chain is already unlocked");
check(isGeneDefault("ANAB") && isGeneDefault("CYCL"), "anabolase and cyclin come with every cell");
check(isPartUnlocked("LOW") === false && isPartUnlocked("PolarLocalizationSignal") === false, "low expression and the polar tag stay locked until the minimal start grants them");
check(VIABLE_UNLOCKS.includes("FLGN") && VIABLE_UNLOCKS.includes("FLGM") && VIABLE_UNLOCKS.includes("MED"), "the minimal start unlocks the flagellum and medium expression");

const upkeep = genomeAtpUpkeep(loaded);
const expression = 0.5;
const saturation = VIABLE_STARTING_FERRON / (VIABLE_STARTING_FERRON + REDUCTASE_HALF_STORE);
const atpPerSecond = REDUCTASE_FUEL_PER_SECOND * expression * saturation * ATP_PER_FLUXIN;
check(atpPerSecond > upkeep, `the stored ferron burns faster than the genome's upkeep (${atpPerSecond.toFixed(3)} vs ${upkeep.toFixed(3)})`);
const dryMinutes = STARTING_ATP / upkeep / 60;
check(dryMinutes > 3.5 && dryMinutes < 4.5, `without fuel the minimal genome lasts about four minutes (${dryMinutes.toFixed(1)})`);

check(HARD_STARTING_ATP < STARTING_ATP, "hard mode starts with less ATP");
check(HARD_MUTATION_POINTS < STARTING_MUTATION_POINTS, "hard mode starts with fewer mutation points");
check(STARTING_MUTATION_POINTS >= (geneUnlockCost("FLGN") ?? 0) + (geneUnlockCost("FLGM") ?? 0), "a minimal start can afford flagellin and its motor");
check(HARD_MUTATION_POINTS < (geneUnlockCost("FLGN") ?? 0) + (geneUnlockCost("FLGM") ?? 0), "hard mode cannot afford a flagellum until something divides");
check(geneAtpWeight("GFP") < geneAtpWeight("FERR") && geneAtpWeight("FERR") < geneAtpWeight("FLGM") && geneAtpWeight("FLGM") < geneAtpWeight("CHLS"), "a pigment is cheaper to express than the ferron chain, a motor, and a phototrophy complex");

if (failed > 0) {
  throw new Error(`${failed} starter genome checks failed`);
}
console.log("starter genome checks passed");
