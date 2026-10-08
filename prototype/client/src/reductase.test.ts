import { stepPermeaseUptake } from "./permeaseUptake";
import {
  ATP_PER_FUEL_UNIT,
  REDUCTASE_FUEL_PER_SECOND,
  REDUCTASE_HALF_STORE,
  reductaseExpressionLevel,
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

// The yield: five fuel per second at full expression once the store is saturated,
// two ATP per fuel unit. At the half-saturation store the burn runs at half rate.
check(REDUCTASE_FUEL_PER_SECOND === 5, "full expression burns five units per second from a saturated store");
check(REDUCTASE_HALF_STORE === 100, "half the expressed rate needs a store of 100");
check(ATP_PER_FUEL_UNIT === 2, "every burned unit yields two ATP");

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
// limited by the fuel pool and the ATP pool's headroom.
const burn = stepReductase(REDUCTASE_HALF_STORE, 0, 1000, 1, 1);
check(burn.fuel === 97.5 && burn.fuelRate === 2.5, "a half-saturated store burns at half the full rate");
check(burn.atp === 5 && burn.atpRate === 5, "the burn yields two ATP per unit");
const saturated = stepReductase(100000, 0, 1000, 1, 1);
check(Math.abs(saturated.fuelRate - REDUCTASE_FUEL_PER_SECOND) < 0.01, "a deep store burns at the full rate");
check(stepReductase(REDUCTASE_HALF_STORE, 0, 1000, 0.1, 1).fuel === 99.75, "microexpression burns a tenth as much");
check(stepReductase(REDUCTASE_HALF_STORE, 0, 1000, 1, 0.5).fuel === 98.75, "the burn tracks the step length");
const trickle = stepReductase(3, 0, 1000, 1, 1);
check(trickle.fuel > 2.5 && trickle.fuel < 3 && trickle.atp < 1, "a nearly empty store burns only a sliver of itself");
const throttled = stepReductase(100, 999, 1000, 1, 1);
check(throttled.atp === 1000 && throttled.fuel === 99.5, "a nearly full ATP pool throttles the burn to its headroom");
check(stepReductase(100, 1000, 1000, 1, 1).fuel === 100 && stepReductase(100, 1000, 1000, 1, 1).atp === 1000, "a full ATP pool saves the fuel instead of wasting it");
check(stepReductase(100, 1200, 1000, 1, 1).fuel === 100, "an over-capacity ATP pool burns nothing");
check(stepReductase(100, 0, 0, 1, 1).fuel === 100, "a zero-capacity ATP pool burns nothing");
check(stepReductase(0, 0, 1000, 1, 1).fuelRate === 0 && stepReductase(0, 0, 1000, 1, 1).atpRate === 0, "an empty fuel pool burns nothing");
check(stepReductase(100, 0, 1000, 0, 1).atpRate === 0, "no reductase means no burn");
check(stepReductase(100, 0, 1000, 1, 0).atpRate === 0, "a zero step leaves the pools alone");

// A medium permease in modest water used to hand each frame's import straight
// to the reductase, so the store stayed at 0 while ATP climbed. The burn now
// waits on a real reserve: empty water stays dark, and a trickle fills the pool
// before it pays out.
const capacity = 1000;
let stocked = 0;
let stockedAtp = 0;
let stockedAtpRate = 0;
for (let step = 0; step < 4000; step += 1) {
  const imported = stepPermeaseUptake(stocked, capacity, 0.5, 0.1, 0.05);
  const burned = stepReductase(imported.amount, stockedAtp, capacity, 0.5, 0.05);
  stocked = burned.fuel;
  stockedAtp = burned.atp;
  stockedAtpRate = burned.atpRate;
}
check(stocked > 20, `modest water fills a visible fuel reserve (${stocked.toFixed(1)})`);
check(stockedAtpRate > 1, `ATP production follows the reserve (${stockedAtpRate.toFixed(2)}/s)`);
let dry = 0;
let dryAtp = 0;
let dryAtpRate = 0;
for (let step = 0; step < 400; step += 1) {
  const imported = stepPermeaseUptake(dry, capacity, 0.5, 0, 0.05);
  const burned = stepReductase(imported.amount, dryAtp, capacity, 0.5, 0.05);
  dry = burned.fuel;
  dryAtp = burned.atp;
  dryAtpRate = burned.atpRate;
}
check(dry === 0 && dryAtp === 0 && dryAtpRate === 0, "no dissolved fuel and an empty store produce no ATP");

if (failed > 0) throw new Error(`${failed} reductase checks failed`);
console.log("reductase checks passed");