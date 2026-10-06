import {
  ATP_PER_FUEL_UNIT,
  REDUCTASE_FUEL_PER_SECOND,
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

// The yield: five fuel per second at full expression, two ATP per fuel unit.
check(REDUCTASE_FUEL_PER_SECOND === 5, "full expression burns five units per second");
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

// Burn stepping: proportional to expression, limited by the fuel pool and the ATP pool's headroom.
const burn = stepReductase(100, 0, 1000, 1, 1);
check(burn.fuel === 95 && burn.fuelRate === 5, "full expression burns five units per second");
check(burn.atp === 10 && burn.atpRate === 10, "the burn yields two ATP per unit");
check(stepReductase(100, 0, 1000, 0.1, 1).fuel === 99.5, "microexpression burns a tenth as much");
check(stepReductase(100, 0, 1000, 1, 0.5).fuel === 97.5, "the burn tracks the step length");
check(stepReductase(3, 0, 1000, 1, 1).fuel === 0 && stepReductase(3, 0, 1000, 1, 1).atp === 6, "the burn stops at an empty fuel pool");
const throttled = stepReductase(100, 999, 1000, 1, 1);
check(throttled.atp === 1000 && throttled.fuel === 99.5, "a nearly full ATP pool throttles the burn to its headroom");
check(stepReductase(100, 1000, 1000, 1, 1).fuel === 100 && stepReductase(100, 1000, 1000, 1, 1).atp === 1000, "a full ATP pool saves the fuel instead of wasting it");
check(stepReductase(100, 1200, 1000, 1, 1).fuel === 100, "an over-capacity ATP pool burns nothing");
check(stepReductase(100, 0, 0, 1, 1).fuel === 100, "a zero-capacity ATP pool burns nothing");
check(stepReductase(0, 0, 1000, 1, 1).fuelRate === 0 && stepReductase(0, 0, 1000, 1, 1).atpRate === 0, "an empty fuel pool burns nothing");
check(stepReductase(100, 0, 1000, 0, 1).atpRate === 0, "no reductase means no burn");
check(stepReductase(100, 0, 1000, 1, 0).atpRate === 0, "a zero step leaves the pools alone");

if (failed > 0) throw new Error(`${failed} reductase checks failed`);
console.log("reductase checks passed");