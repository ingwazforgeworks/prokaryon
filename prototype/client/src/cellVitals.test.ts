import {
  ATP_LOW,
  HEAT_LETHAL,
  HEAT_ONSET,
  RECOVERY_SECONDS,
  SECONDS_TO_DEATH,
  SHRIVEL_ONSET,
  createVitals,
  copyVitals,
  heatSeverity,
  motorsStalled,
  noStress,
  osmoticSeverity,
  starvationPallor,
  starvationSeverity,
  starvedTint,
  stepVitals,
  vitalsDead,
  worstCause,
  type StressLevels,
} from "./cellVitals";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function near(actual: number, expected: number, message: string, tolerance = 1e-9): void {
  check(Math.abs(actual - expected) < tolerance, `${message} (${actual} vs ${expected})`);
}

function levels(patch: Partial<StressLevels>): StressLevels {
  return { ...noStress(), ...patch };
}

function secondsUntilDeath(patch: Partial<StressLevels>, limit = 600): number {
  const vitals = createVitals();
  const dt = 0.05;
  let t = 0;
  while (!vitalsDead(vitals) && t < limit) {
    stepVitals(vitals, levels(patch), dt);
    t += dt;
  }
  return t;
}

near(heatSeverity(4), 0, "cold deep water does no heat damage");
near(heatSeverity(60), 0, "the warmest sunlit water does no heat damage");
near(heatSeverity(HEAT_ONSET), 0, "heat damage starts at the onset");
near(heatSeverity((HEAT_ONSET + HEAT_LETHAL) / 2), 0.5, "halfway to lethal is half severity");
near(heatSeverity(110), 1, "vent water is fully lethal");
near(heatSeverity(null), 0, "unknown water is harmless");

near(osmoticSeverity(1), 0, "full turgor does no damage");
near(osmoticSeverity(-SHRIVEL_ONSET), 0, "shrivel damage starts at the onset");
near(osmoticSeverity(-1), 1, "a full shrivel is fully lethal");
check(osmoticSeverity(-0.7) > 0 && osmoticSeverity(-0.7) < 1, "a partial shrivel does partial damage");

near(starvationSeverity(10, -0.06, 0.06), 0, "a cell with ATP left is not starving");
near(starvationSeverity(0, -0.06, 0.06), 1, "an empty pool with no income starves at full severity");
near(starvationSeverity(0, -0.03, 0.06), 0.5, "income covering half the upkeep halves the severity");
near(starvationSeverity(0, 0.01, 0.06), 0, "income above upkeep stops starvation");
near(starvationSeverity(0, 0, 0), 0, "a genome with no upkeep cannot starve");
check(motorsStalled(0) && !motorsStalled(5), "motors stall only on an empty pool");

near(starvationPallor(1000, 0), 0, "a full pool does not pale the cell");
near(starvationPallor(ATP_LOW / 2, 0), 0.275, "a half-low pool pales the cell partway");
near(starvationPallor(0, 1), 1, "real starvation pales the cell fully");

const untouched = starvedTint([1, 0.5, 0.2], 0);
check(untouched[0] === 1 && untouched[1] === 0.5 && untouched[2] === 0.2, "no pallor leaves the tint alone");
const hollow = starvedTint([1, 1, 1], 1);
near(hollow[0], 0.6, "a starving gray cell still dims visibly");
const drained = starvedTint([1, 0.5, 0.2], 1);
near(drained[0], drained[2], "full pallor drains the color");

near(secondsUntilDeath({ heat: 1 }), SECONDS_TO_DEATH.heat, "full heat kills in its own time", 0.06);
near(secondsUntilDeath({ osmotic: 1 }), SECONDS_TO_DEATH.osmotic, "a full shrivel kills in its own time", 0.06);
near(secondsUntilDeath({ starvation: 1 }), SECONDS_TO_DEATH.starvation, "full starvation kills in its own time", 0.06);
near(secondsUntilDeath({ heat: 0.5 }), SECONDS_TO_DEATH.heat * 2, "half severity takes twice as long", 0.06);
check(
  secondsUntilDeath({ heat: 1, starvation: 1 }) < SECONDS_TO_DEATH.heat,
  "overlapping stressors kill faster than either alone",
);

check(worstCause(levels({ heat: 0.2, starvation: 1 })) === "starvation", "the stressor doing the most damage leads");
check(worstCause(noStress()) === null, "nothing leads when nothing hurts");

const mending = createVitals();
for (let step = 0; step < 100; step += 1) stepVitals(mending, levels({ heat: 1 }), 0.05);
check(mending.cause === "heat", "a heat-damaged cell blames the heat");
const hurt = mending.integrity;
near(hurt, 1 - 5 / SECONDS_TO_DEATH.heat, "five seconds of full heat takes a quarter", 1e-6);
stepVitals(mending, noStress(), 1);
near(mending.integrity, hurt + 1 / RECOVERY_SECONDS, "a cell out of danger mends", 1e-9);
check(mending.cause === "heat", "a mending cell remembers what hurt it");
for (let step = 0; step < 2000; step += 1) stepVitals(mending, noStress(), 0.05);
near(mending.integrity, 1, "a cell mends back to whole");
check(mending.cause === null, "a whole cell has nothing to blame");

const eased = createVitals();
stepVitals(eased, levels({ heat: 1 }), 0.05);
check(eased.shown.heat > 0 && eased.shown.heat < 0.5, "the visible heat eases in rather than jumping");

const original = createVitals();
const twin = copyVitals(original);
stepVitals(twin, levels({ osmotic: 1 }), 1);
near(original.integrity, 1, "a copied vitals record is independent of its source");

const broken = createVitals();
stepVitals(broken, levels({ heat: Number.NaN }), Number.NaN);
near(broken.integrity, 1, "broken inputs change nothing");

if (failed > 0) throw new Error(`${failed} cell vitals checks failed`);
console.log("cell vitals checks passed");
