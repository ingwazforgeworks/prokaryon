import { stepAtpSynthase, ATP_PER_FLUXIN } from "./atpSynthase";
import { stepPermeaseUptake } from "./permeaseUptake";
import {
  FLUXIN_PER_FUEL,
  PAIRED_FLUXIN_PER_FUEL,
  REDUCTASE_FUEL_PER_SECOND,
  REDUCTASE_HALF_STORE,
  reductaseExpressionLevel,
  stepPairedReductase,
  stepReductase,
} from "./reductase";
import type { FlagellinConstruct } from "./flagellinDistribution";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

type ConstructOverrides = Partial<FlagellinConstruct>;

function construct(overrides: ConstructOverrides = {}): FlagellinConstruct {
  return {
    promoterId: "CNST",
    geneId: "FERR",
    amountId: "HYPER",
    amountMinId: null,
    amountMaxId: null,
    routeId: "CYTO",
    siteId: null,
    ...overrides,
  };
}

// The charge: five fuel per second at full expression once the store is saturated,
// one fluxin per fuel unit. A pair recharges three. At the half-saturation store
// the burn runs at half rate.
check(REDUCTASE_FUEL_PER_SECOND === 5, "full expression burns five units per second from a saturated store");
check(REDUCTASE_HALF_STORE === 100, "half the expressed rate needs a store of 100");
check(FLUXIN_PER_FUEL === 1, "every burned unit recharges one carrier");
check(PAIRED_FLUXIN_PER_FUEL === 3, "a paired reductase recharges three carrier per fuel unit");
check(ATP_PER_FLUXIN === 2, "ATP synthase returns two ATP per fluxin");

// Reductase expression: cytosolic copies of the right gene under simulated promoters.
check(reductaseExpressionLevel([], "FERR") === 0, "no constructs express no reductase");
check(reductaseExpressionLevel([construct()], "FERR") === 1, "a hyperexpressed cytosolic reductase reads full");
check(reductaseExpressionLevel([construct({ routeId: null })], "FERR") === 1, "an untagged reductase is cytosolic and counts");
check(reductaseExpressionLevel([construct({ routeId: "TransmembraneSignal" })], "FERR") === 0, "a membrane-routed reductase is not the soluble module and burns nothing");
check(reductaseExpressionLevel([construct({ routeId: "SecretoryPeptide" })], "FERR") === 0, "a secreted reductase is outside the cytosol and burns nothing");
check(reductaseExpressionLevel([construct({ promoterId: "GRAD" })], "FERR") === 0, "unsimulated promoters produce no reductase yet");
check(reductaseExpressionLevel([construct({ geneId: "FLGM" })], "FERR") === 0, "motor constructs do not count as reductase");
check(reductaseExpressionLevel([construct({ amountId: "MICRO" })], "FERR") === 0.1, "microexpression scales the reductase level");
check(
  reductaseExpressionLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })], "FERR") === 1,
  "stacked reductase constructs clamp at full expression",
);
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" } satisfies ConstructOverrides;
check(reductaseExpressionLevel([construct(swing)], "FERR", 0) === 0.1, "an oscillatory reductase rests at its minimum at t=0");
check(reductaseExpressionLevel([construct(swing)], "FERR", 2) === 1, "an oscillatory reductase peaks at its maximum at the half period");

// The sulfex reductase follows the same expression rule under its own gene.
check(reductaseExpressionLevel([construct({ geneId: "SLFR" })], "SLFR") === 1, "a hyperexpressed cytosolic sulfex reductase reads full");
check(reductaseExpressionLevel([construct({ geneId: "SLFR", routeId: "TransmembraneSignal" })], "SLFR") === 0, "a membrane-routed sulfex reductase is not the soluble module and burns nothing");
check(reductaseExpressionLevel([construct()], "SLFR") === 0, "ferron reductase constructs do not count as sulfex reductase");
check(reductaseExpressionLevel([construct({ geneId: "SLFR" })], "FERR") === 0, "sulfex reductase constructs do not count as ferron reductase");

// Burn stepping: proportional to expression and to how full the store is, and
// limited by the fuel pool, the spent carrier, and room in the fluxin pool.
const burn = stepReductase(REDUCTASE_HALF_STORE, 1000, 0, 1000, 1, 1);
check(burn.fuel === 97.5 && burn.fuelRate === 2.5, "a half-saturated store burns at half the full rate");
check(burn.fluxin === 2.5 && burn.refluxin === 997.5, "the burn recharges one fluxin per fuel unit");
check(burn.fluxin + burn.refluxin === 1000, "the burn conserves the carrier");
const saturated = stepReductase(100000, 1000, 0, 1000, 1, 1);
check(Math.abs(saturated.fuelRate - REDUCTASE_FUEL_PER_SECOND) < 0.01, "a deep store burns at the full rate");
check(stepReductase(REDUCTASE_HALF_STORE, 1000, 0, 1000, 0.1, 1).fuel === 99.75, "microexpression burns a tenth as much");
check(stepReductase(REDUCTASE_HALF_STORE, 1000, 0, 1000, 1, 0.5).fuel === 98.75, "the burn tracks the step length");
const trickle = stepReductase(3, 1000, 0, 1000, 1, 1);
check(trickle.fuel > 2.5 && trickle.fuel < 3 && trickle.fluxin < 0.5, "a nearly empty store burns only a sliver of itself");
const crowded = stepReductase(100, 1000, 999.5, 1000, 1, 1);
check(crowded.fluxin === 1000 && crowded.fuel === 99.5, "a nearly full fluxin pool throttles the charge to its room");
check(stepReductase(100, 1000, 1000, 1000, 1, 1).fuel === 100, "a full fluxin pool saves the fuel");
check(stepReductase(100, 1000, 0, 0, 1, 1).fuel === 100, "a zero-capacity fluxin pool charges nothing");
check(stepReductase(100, 0, 0, 1000, 1, 1).fuel === 100 && stepReductase(100, 0, 0, 1000, 1, 1).fluxinRate === 0, "no refluxin means the carrier is already charged and the fuel stays put");
check(stepReductase(0, 1000, 0, 1000, 1, 1).fuelRate === 0 && stepReductase(0, 1000, 0, 1000, 1, 1).fluxinRate === 0, "an empty fuel pool charges nothing");
check(stepReductase(100, 1000, 0, 1000, 0, 1).fluxinRate === 0, "no reductase means no charge");
check(stepReductase(100, 1000, 0, 1000, 1, 0).fluxinRate === 0, "a zero step leaves the pools alone");

// A full ATP pool does not stop the reductase. It stops the synthase, and the
// fuel burn ends once the refluxin has all been recharged.
let chargedFuel = 1000;
let chargedRefluxin = 40;
let chargedFluxin = 0;
const chargedAtp = 1000;
for (let step = 0; step < 200; step += 1) {
  const charged = stepReductase(chargedFuel, chargedRefluxin, chargedFluxin, 1000, 1, 0.05);
  chargedFuel = charged.fuel;
  chargedRefluxin = charged.refluxin;
  chargedFluxin = charged.fluxin;
  const spent = stepAtpSynthase(chargedFluxin, chargedRefluxin, 1000, chargedAtp, 1000, 1, 0.05);
  chargedFluxin = spent.fluxin;
  chargedRefluxin = spent.refluxin;
}
const parked = stepReductase(chargedFuel, chargedRefluxin, chargedFluxin, 1000, 1, 0.05);
check(
  chargedFuel < 1000 && chargedFuel > 900 && chargedFluxin > 39.9 && chargedRefluxin < 0.1,
  `a full ATP pool lets the reductase charge the carrier once (fuel ${chargedFuel}, fluxin ${chargedFluxin}, refluxin ${chargedRefluxin})`,
);
check(parked.fuelRate < 1e-6 && parked.fluxinRate < 1e-6, "once the carrier is all fluxin, a full ATP pool saves the rest of the fuel");

// A medium permease in modest water fills a reserve, and the cycle turns that
// reserve into ATP only while both the reductase and the synthase are working.
const capacity = 1000;
let stocked = 0;
let stockedRefluxin = 40;
let stockedFluxin = 0;
let stockedAtp = 0;
let stockedAtpRate = 0;
for (let step = 0; step < 4000; step += 1) {
  const imported = stepPermeaseUptake(stocked, capacity, 0.5, 0.1, 0.05);
  const burned = stepReductase(imported.amount, stockedRefluxin, stockedFluxin, capacity, 0.5, 0.05);
  const made = stepAtpSynthase(burned.fluxin, burned.refluxin, capacity, stockedAtp, capacity, 0.5, 0.05);
  stocked = burned.fuel;
  stockedRefluxin = made.refluxin;
  stockedFluxin = made.fluxin;
  stockedAtp = made.atp;
  stockedAtpRate = made.atpRate;
}
check(stocked > 20, `modest water fills a visible fuel reserve (${stocked.toFixed(1)})`);
check(stockedAtpRate > 1, `ATP production follows the reserve (${stockedAtpRate.toFixed(2)}/s)`);
check(Math.abs(stockedFluxin + stockedRefluxin - 40) < 1e-6, "the feeding loop conserves the carrier");
let dry = 0;
let dryRefluxin = 40;
let dryFluxin = 0;
let dryAtp = 0;
let dryAtpRate = 0;
for (let step = 0; step < 400; step += 1) {
  const imported = stepPermeaseUptake(dry, capacity, 0.5, 0, 0.05);
  const burned = stepReductase(imported.amount, dryRefluxin, dryFluxin, capacity, 0.5, 0.05);
  const made = stepAtpSynthase(burned.fluxin, burned.refluxin, capacity, dryAtp, capacity, 0.5, 0.05);
  dry = burned.fuel;
  dryRefluxin = made.refluxin;
  dryFluxin = made.fluxin;
  dryAtp = made.atp;
  dryAtpRate = made.atpRate;
}
check(dry === 0 && dryAtp === 0 && dryAtpRate === 0, "no dissolved fuel and an empty store produce no ATP");

// The slower enzyme sets the ATP rate. A fast synthase leaves the carrier spent.
const fastSynthase = stepAtpSynthase(
  stepReductase(100000, 80, 0, 1000, 1, 1).fluxin,
  stepReductase(100000, 80, 0, 1000, 1, 1).refluxin,
  1000,
  0,
  1000,
  1,
  1,
);
check(
  Math.abs(fastSynthase.atp - 10) < 0.02 && fastSynthase.fluxin === 0 && Math.abs(fastSynthase.refluxin - 80) < 1e-6,
  "a faster synthase spends every charge and ATP follows the reductase",
);

// A slow synthase fills the pool with fluxin and ATP follows the synthase.
let slowFluxin = 0;
let slowRefluxin = 10;
let slowAtp = 0;
let slowAtpRate = 0;
for (let step = 0; step < 160; step += 1) {
  const burned = stepReductase(100000, slowRefluxin, slowFluxin, 1000, 1, 0.05);
  const made = stepAtpSynthase(burned.fluxin, burned.refluxin, 1000, slowAtp, 1000, 0.1, 0.05);
  slowFluxin = made.fluxin;
  slowRefluxin = made.refluxin;
  slowAtp = made.atp;
  slowAtpRate = made.atpRate;
}
check(Math.abs(slowAtpRate - 3) < 0.05 && slowFluxin > slowRefluxin, `a slower synthase caps ATP and the carrier sits charged (${slowAtpRate.toFixed(2)}/s)`);

// A paired reductase needs both fuels and recharges more carrier per unit than a single reductase.
const pair = stepPairedReductase(REDUCTASE_HALF_STORE, REDUCTASE_HALF_STORE, 1000, 0, 1000, 1, 1);
const alone = stepReductase(REDUCTASE_HALF_STORE, 1000, 0, 1000, 1, 1);
check(pair.fuelA === 97.5 && pair.fuelB === 97.5, "a paired reductase burns the same amount from both stores");
check(pair.fluxin === 7.5 && pair.fluxin > alone.fluxin * 2, "the pair recharges more carrier than burning both fuels separately");
check(pair.fluxin + pair.refluxin === 1000, "the pair conserves the carrier");
const missing = stepPairedReductase(REDUCTASE_HALF_STORE, 0, 1000, 0, 1000, 1, 1);
check(missing.fuelA === REDUCTASE_HALF_STORE && missing.fluxinRate === 0, "a paired reductase burns nothing when one fuel is missing");
check(stepPairedReductase(0, REDUCTASE_HALF_STORE, 1000, 0, 1000, 1, 1).fuelRate === 0, "a paired reductase burns nothing when the other fuel is missing");
check(stepPairedReductase(REDUCTASE_HALF_STORE, REDUCTASE_HALF_STORE, 0, 0, 1000, 1, 1).fuelA === REDUCTASE_HALF_STORE, "a paired reductase burns nothing when the carrier is already charged");
check(reductaseExpressionLevel([construct({ geneId: "FSXR" })], "FSXR") === 1, "a cytosolic ferrosulfex reductase is expressed");
check(reductaseExpressionLevel([construct({ geneId: "NXDR", routeId: "TransmembraneSignal" })], "NXDR") === 0, "a membrane-routed nitroxidex reductase burns nothing");

if (failed > 0) throw new Error(`${failed} reductase checks failed`);
console.log("reductase checks passed");
