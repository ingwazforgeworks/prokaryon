import { formatNutrient, nutrientConcentrationMM } from "./environmentProbe";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

check(nutrientConcentrationMM(100) === 600, "full field is 600 mM");
check(Math.abs(nutrientConcentrationMM(1) - 0.0001) < 1e-12, "1% of the field is 100 nM");
check(nutrientConcentrationMM(1) < nutrientConcentrationMM(50) && nutrientConcentrationMM(50) < nutrientConcentrationMM(100), "concentration rises with the field");

check(formatNutrient(1) === "600000.000 µM", "a full reading shows 600000.000 µM");
check(formatNutrient(0.01) === "0.100 µM", "1% of the field shows 0.100 µM");
check(formatNutrient(0) === "0.000 µM", "absent nutrient reads 0.000 µM");
check(formatNutrient(0.5).endsWith(" µM"), "the readout is always micromolar");
check(formatNutrient(0.04) === "0.160 µM", "a faint tail rounds to the nearest 0.001");

if (failed > 0) throw new Error(`${failed} nutrient readout checks failed`);
console.log("nutrient readout checks passed");
