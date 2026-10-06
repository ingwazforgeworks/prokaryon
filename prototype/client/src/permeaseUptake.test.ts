import {
  FIELD_FRACTION_PER_UNIT,
  MICROMOLAR_PER_FIELD,
  PERMEASE_THRESHOLD_MICROMOLAR,
  permeaseAboveThreshold,
  permeaseExpressionLevel,
  stepPermeaseUptake,
} from "./permeaseUptake";
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
    geneId: "FERP",
    amountId: "HYPER",
    amountMinId: null,
    amountMaxId: null,
    routeId: "TransmembraneSignal",
    siteId: null,
    ...overrides,
  };
}

// The 100 µM gate. Field fraction 1 is 600,000 µM, so the gate sits at 1/6000.
check(MICROMOLAR_PER_FIELD === 600000, "the full field reading is 600000 µM");
check(PERMEASE_THRESHOLD_MICROMOLAR === 100, "the uptake gate is 100 µM");
check(!permeaseAboveThreshold(100 / MICROMOLAR_PER_FIELD), "exactly 100 µM is not above the gate");
check(permeaseAboveThreshold(101 / MICROMOLAR_PER_FIELD), "101 µM passes the gate");
check(!permeaseAboveThreshold(0), "empty water fails the gate");

// Permease expression: only transmembrane copies of the right gene under simulated promoters.
check(permeaseExpressionLevel([], "FERP") === 0, "no constructs express no permease");
check(permeaseExpressionLevel([construct()], "FERP") === 1, "a hyperexpressed transmembrane permease reads full");
check(permeaseExpressionLevel([construct({ routeId: "SecretoryPeptide" })], "FERP") === 0, "a secreted permease is not in the membrane and imports nothing");
check(permeaseExpressionLevel([construct({ routeId: null })], "FERP") === 0, "an untagged permease stays cytosolic and imports nothing");
check(permeaseExpressionLevel([construct({ promoterId: "GRAD" })], "FERP") === 0, "unsimulated promoters produce no permease yet");
check(permeaseExpressionLevel([construct({ geneId: "FLGM" })], "FERP") === 0, "motor constructs do not count as permease");
check(permeaseExpressionLevel([construct({ amountId: "MICRO" })], "FERP") === 0.1, "microexpression scales the permease level");
check(
  permeaseExpressionLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })], "FERP") === 1,
  "stacked permease constructs clamp at full expression",
);
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" } satisfies ConstructOverrides;
check(permeaseExpressionLevel([construct(swing)], "FERP", 0) === 0.1, "an oscillatory permease rests at its minimum at t=0");
check(permeaseExpressionLevel([construct(swing)], "FERP", 2) === 1, "an oscillatory permease peaks at its maximum at the half period");

// The sulfex permease follows the same expression rule under its own gene.
check(permeaseExpressionLevel([construct({ geneId: "SLFP" })], "SLFP") === 1, "a hyperexpressed transmembrane sulfex permease reads full");
check(permeaseExpressionLevel([construct({ geneId: "SLFP", routeId: "SecretoryPeptide" })], "SLFP") === 0, "a secreted sulfex permease is not in the membrane and imports nothing");
check(permeaseExpressionLevel([construct()], "SLFP") === 0, "ferron permease constructs do not count as sulfex permease");
check(permeaseExpressionLevel([construct({ geneId: "SLFP" })], "FERP") === 0, "sulfex permease constructs do not count as ferron permease");

// Uptake stepping: proportional to expression, concentration, and headroom.
const rich = 0.5;
const full = stepPermeaseUptake(0, 1000, 1, rich, 1);
check(full.amount === 12.5 && full.rate === 12.5, "full expression in rich water imports 25 × 0.5 units per second");
check(full.depletion === 12.5 * FIELD_FRACTION_PER_UNIT, "each imported unit draws the local water down with it");
check(stepPermeaseUptake(999, 1000, 1, rich, 100).depletion === 1 * FIELD_FRACTION_PER_UNIT, "the drawdown matches the units that actually moved");
check(stepPermeaseUptake(0, 1000, 0.1, rich, 1).amount === 1.25, "microexpression imports a tenth as much");
check(stepPermeaseUptake(0, 1000, 1, 0.25, 1).amount === 6.25, "halving the concentration halves the import");
check(stepPermeaseUptake(800, 1000, 1, rich, 1).amount === 802.5, "a nearly full pool imports only its headroom");
check(stepPermeaseUptake(999, 1000, 1, rich, 100).amount === 1000, "the pool never passes its capacity");
check(stepPermeaseUptake(1200, 1000, 1, rich, 1).amount === 1000, "an over-capacity pool is clamped and stays still");

// The gate and the expression level both have to hold.
check(stepPermeaseUptake(0, 1000, 1, 100 / MICROMOLAR_PER_FIELD, 5).depletion === 0, "water at the gate does not draw down");
check(stepPermeaseUptake(0, 1000, 0, rich, 5).depletion === 0, "no permease means no drawdown");
check(stepPermeaseUptake(5, 1000, 1, rich, 0).depletion === 0, "a zero step leaves the water alone");

if (failed > 0) throw new Error(`${failed} permease uptake checks failed`);
console.log("permease uptake checks passed");