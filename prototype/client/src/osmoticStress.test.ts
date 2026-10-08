import { osmolynDamageScale } from "./osmoprotectin";
import {
  OSMOTIC_RATE,
  osmoticShrinkFactor,
  osmoticSwellTarget,
  stepOsmoticStress,
} from "./osmoticStress";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function near(actual: number, expected: number, message: string): void {
  check(Math.abs(actual - expected) < 1e-9, `${message} (${actual} vs ${expected})`);
}

function moved(stress: number, concentration: number, osmoprotectin = 0, aquaporin = 0, dt = 1): number {
  return stepOsmoticStress(stress, concentration, osmoprotectin, aquaporin, dt) - stress;
}

near(moved(0, 1), -OSMOTIC_RATE, "saturated water pulls toward shrivel at the full rate");
near(moved(0, 0.75), -OSMOTIC_RATE * 0.5, "a milder excess pulls toward shrivel more slowly");
near(moved(0, 0), OSMOTIC_RATE, "empty water pulls toward swelling at the full rate");
near(moved(0, 0.25), OSMOTIC_RATE * 0.5, "a milder shortage pulls toward swelling more slowly");
near(moved(0.4, 0.5), 0, "neutral water holds the stress where it is");
near(stepOsmoticStress(-0.9, 1, 0, 0, 10), -1, "shrivel stops at -1");
near(stepOsmoticStress(0.9, 0, 0, 0, 10), 1, "swelling stops at 1");
near(stepOsmoticStress(0.2, 1, 0, 0, 0), 0.2, "a zero timestep changes nothing");

near(moved(0, 1, 1, 0), -OSMOTIC_RATE * osmolynDamageScale(1), "one hyperexpressed osmoprotectin leaves about half the shrivel");
near(moved(0, 1, 2, 0), -OSMOTIC_RATE * 0.001, "two hyperexpressed constructs leave a 0.1% shrivel in saturated water");
near(moved(0, 1, 0.5, 0), -OSMOTIC_RATE * osmolynDamageScale(0.5), "half osmoprotectin leaves most of the shrivel");
near(moved(0, 0, 1, 0), OSMOTIC_RATE, "osmoprotectin does not change the swell in empty water");
near(moved(0, 0.25, 1, 0), moved(0, 0.25, 0, 0), "osmoprotectin does not change a shortage");

near(moved(0, 0, 0, 1), 0, "full aquaporin is already at equilibrium in empty water when stress is 0");
near(moved(1, 0, 0, 0.5), OSMOTIC_RATE * (0.5 - 1), "medium aquaporin pulls a fully taut cell back toward equilibrium");
let thin = 1;
for (let step = 0; step < 400; step += 1) thin = stepOsmoticStress(thin, 0.07, 0, 0.5, 0.05);
check(Math.abs(thin - 0.5) < 0.01, `medium aquaporin in thin water settles halfway to equilibrium (${thin})`);
let empty = 1;
for (let step = 0; step < 400; step += 1) empty = stepOsmoticStress(empty, 0, 0, 1, 0.05);
check(Math.abs(empty) < 0.01, `full aquaporin in empty water settles at equilibrium (${empty})`);
near(stepOsmoticStress(1, 0, 0, 0, 10), 1, "thin water with no channel stays fully taut");
near(moved(0, 1, 0, 1), -OSMOTIC_RATE * 2, "full aquaporin doubles the shrivel in saturated water");
near(moved(0, 1, 1, 1), -OSMOTIC_RATE * osmolynDamageScale(1) * 2, "full aquaporin doubles whatever shrivel osmoprotectin left");
near(
  osmoticShrinkFactor(0.25, 0.25),
  osmolynDamageScale(0.25) * 1.25,
  "a partial channel deepens the shrivel osmoprotectin left",
);
let shielded = 0;
for (let step = 0; step < 800; step += 1) shielded = stepOsmoticStress(shielded, 1, 2, 0, 0.05);
check(Math.abs(shielded - -0.001) < 0.0001, `two hyperexpressed constructs settle at a 0.1% shrivel (${shielded})`);
let rescued = -1;
for (let step = 0; step < 800; step += 1) rescued = stepOsmoticStress(rescued, 1, 2, 0, 0.05);
check(Math.abs(rescued - -0.001) < 0.0001, `two hyperexpressed constructs recover a full shrivel to 0.1% (${rescued})`);
near(osmoticSwellTarget(0.5), 0.5, "medium aquaporin equilibrates thin water at half turgor");
near(stepOsmoticStress(Number.NaN, Number.NaN, Number.NaN, Number.NaN, 1), 0, "broken inputs settle at rest");

if (failed > 0) throw new Error(`${failed} osmotic stress checks failed`);
console.log("osmotic stress checks passed");
