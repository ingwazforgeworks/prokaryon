import { buoyancyVelocity, MAX_RISE_SPEED, MAX_SINK_SPEED } from "./buoyancy";

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

if (failed > 0) throw new Error(`${failed} buoyancy checks failed`);
console.log("buoyancy checks passed");
