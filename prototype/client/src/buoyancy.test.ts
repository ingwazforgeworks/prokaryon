import {
  BUOYANCY_DRIFT_ACCELERATION,
  BUOYANCY_DRIFT_MAX_SPEED,
  buoyancyExpressionLevel,
  buoyancyVelocity,
  genomeCanDriveBuoyancy,
  MAX_RISE_SPEED,
  MAX_SINK_SPEED,
  stepBuoyancyVelocity,
} from "./buoyancy";
import type { FlagellinConstruct } from "./flagellinDistribution";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const deep = -450;
const shallow = 450;

check(buoyancyVelocity(deep, 0, 0) === 0, "both zero holds in deep water");
check(buoyancyVelocity(shallow, 0, 0) === 0, "both zero holds in shallow water");
check(buoyancyVelocity(deep, 0, 0.4) === 0, "ballastin below the cell does not lift it");
check(buoyancyVelocity(shallow, 0.4, 0) === 0, "buoyin above the cell does not pull it down");

const sinking = buoyancyVelocity(shallow, 0, 1);
check(sinking === -MAX_SINK_SPEED, `full ballastin sinks from the top at ${sinking}`);
const rising = buoyancyVelocity(deep, 1, 0);
check(rising === MAX_RISE_SPEED, `full buoyin rises from the bottom at ${rising}`);
check(MAX_SINK_SPEED > MAX_RISE_SPEED, "sinking is faster than rising");
check(Math.abs(sinking) > rising, "a full sink outruns a full rise");

const partialSink = buoyancyVelocity(400, 0, 0.5);
check(partialSink === -0.5 * MAX_SINK_SPEED, `half ballastin above its line sinks at ${partialSink}`);
const partialRise = buoyancyVelocity(-400, 0.5, 0);
check(partialRise === 0.5 * MAX_RISE_SPEED, `half buoyin below its line rises at ${partialRise}`);

// --- Hydrodynamic drag on the drift ---
// The drift accelerates toward its target instead of snapping to it, so
// oscillating buoyin and ballastin levels swing the cell smoothly.

check(stepBuoyancyVelocity(0, 6, 0) === 0, "a zero-length step keeps the current drift");
check(stepBuoyancyVelocity(0, 6, 0.1) === 1, "the drift accelerates toward its target at the drag rate");
check(stepBuoyancyVelocity(0, -6, 10) === -6, "a long step settles on the target without overshooting");
check(
  Math.abs(stepBuoyancyVelocity(6, -6, 1 / 60) - (6 - BUOYANCY_DRIFT_ACCELERATION / 60)) < 1e-9,
  "a rapid direction flip only eases partway in one frame",
);
check(stepBuoyancyVelocity(11.5, 12, 1) === BUOYANCY_DRIFT_MAX_SPEED, "the drift clamps at the maximum rise speed");
check(stepBuoyancyVelocity(-11.5, -12, 1) === -BUOYANCY_DRIFT_MAX_SPEED, "the drift clamps at the maximum sink speed");
let churned = 0;
for (let i = 0; i < 5; i++) churned = stepBuoyancyVelocity(churned, i % 2 === 0 ? 6 : -6, 1 / 60);
check(Math.abs(churned) < 1, "an alternating target churns near the middle instead of slamming between extremes");

if (failed > 0) throw new Error(`${failed} buoyancy checks failed`);
console.log("buoyancy checks passed");

// --- Buoyancy expression from genome constructs ---

const construct = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "BUOY",
  amountId: "HYPER",
  amountMinId: null,
  amountMaxId: null,
  routeId: "CYTO",
  siteId: null,
  ...overrides,
});

check(buoyancyExpressionLevel([], "BUOY") === 0, "no constructs express no buoyin");
check(buoyancyExpressionLevel([construct()], "BUOY") === 1, "a hyperexpressed cytosolic buoyin reads full");
check(buoyancyExpressionLevel([construct({ routeId: null })], "BUOY") === 1, "an untagged buoyin is cytosolic and counts");
check(buoyancyExpressionLevel([construct({ routeId: "TransmembraneSignal" })], "BUOY") === 0, "a membrane-routed buoyin never folds into the vesicles");
check(buoyancyExpressionLevel([construct({ routeId: "SecretoryPeptide" })], "BUOY") === 0, "a secreted buoyin is outside the cell and does nothing");
check(buoyancyExpressionLevel([construct({ routeId: "SURF" })], "BUOY") === 0, "a surface-anchored buoyin does nothing");
check(buoyancyExpressionLevel([construct({ promoterId: "GRAD" })], "BUOY") === 0, "unsimulated promoters produce no buoyin yet");
check(buoyancyExpressionLevel([construct({ geneId: "FLGM" })], "BUOY") === 0, "motor constructs do not count as buoyin");
check(buoyancyExpressionLevel([construct({ amountId: "MICRO" })], "BUOY") === 0.1, "microexpression scales the buoyin level");
check(
  buoyancyExpressionLevel([construct({ amountId: "MED" }), construct({ amountId: "MED" })], "BUOY") === 1,
  "two half-strength buoyin constructs clamp at full",
);
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" };
check(buoyancyExpressionLevel([construct(swing)], "BUOY", 0) === 0.1, "an oscillatory buoyin rests at its minimum at t=0");
check(buoyancyExpressionLevel([construct(swing)], "BUOY", 2) === 1, "an oscillatory buoyin peaks at its maximum at the half period");

check(buoyancyExpressionLevel([construct({ geneId: "BALA" })], "BALA") === 1, "a hyperexpressed cytosolic ballastin reads full");
check(buoyancyExpressionLevel([construct({ geneId: "BALA", routeId: null })], "BALA") === 1, "an untagged ballastin is cytosolic and counts");
check(buoyancyExpressionLevel([construct({ geneId: "BALA", routeId: "TransmembraneSignal" })], "BALA") === 0, "a membrane-routed ballastin does nothing");
check(buoyancyExpressionLevel([construct()], "BALA") === 0, "buoyin constructs do not count as ballastin");
check(buoyancyExpressionLevel([construct({ geneId: "BALA" })], "BUOY") === 0, "ballastin constructs do not count as buoyin");

check(genomeCanDriveBuoyancy([]) === false, "an empty genome cannot drive buoyancy");
check(genomeCanDriveBuoyancy([construct()]) === true, "a cytosolic buoyin construct drives buoyancy");
check(genomeCanDriveBuoyancy([construct({ geneId: "BALA" })]) === true, "a cytosolic ballastin construct drives buoyancy");
check(genomeCanDriveBuoyancy([construct({ routeId: null })]) === true, "an untagged buoyin construct still drives buoyancy");
check(genomeCanDriveBuoyancy([construct({ routeId: "TransmembraneSignal" })]) === false, "a membrane-routed buoyin construct cannot drive buoyancy");
check(genomeCanDriveBuoyancy([construct({ promoterId: "GRAD" })]) === false, "an unsimulated promoter cannot drive buoyancy");
check(genomeCanDriveBuoyancy([construct({ geneId: "FLGM" })]) === false, "a motor construct cannot drive buoyancy");
check(
  genomeCanDriveBuoyancy([construct(swing)]) === true,
  "an oscillatory buoyin keeps driving buoyancy even at its trough",
);

if (failed > 0) throw new Error(`${failed} buoyancy checks failed`);
console.log("buoyancy expression checks passed");
