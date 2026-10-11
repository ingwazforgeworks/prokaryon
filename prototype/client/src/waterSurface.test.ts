import { COLUMN_TOP } from "./light";
import { holdBelowSurface, surfaceLimit, waterSurfaceY } from "./waterSurface";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const time = 2.4;
const x = 12;
const expected = COLUMN_TOP
  + Math.sin(x * 0.22 + time * 0.9) * 0.85
  + Math.sin(x * 0.57 - time * 1.35) * 0.38
  + Math.sin(x * 1.15 + time * 1.8) * 0.14;
check(Math.abs(waterSurfaceY(x, time) - expected) < 1e-9, "the ripple line matches the shared wave");
check(Math.abs(waterSurfaceY(x, time) - COLUMN_TOP) < 1.4, "the ripple stays a small disturbance of y=500");

const limit = surfaceLimit(x, 0.4, 6, 2, 0.2, time);
check(limit < waterSurfaceY(x, time), "a body has to sit below the line, not on its center");

const pose = { x, y: COLUMN_TOP + 4, angle: 0.4, length: 6 };
check(holdBelowSurface(pose, 2, 0.2, time), "a pose above the ripples is caught");
check(pose.y <= limit + 1e-9, "the held pose is on the ripple ceiling");
check(!holdBelowSurface({ x, y: -100, angle: 0, length: 2 }, 1, 0, time), "a deep cell is left where it is");

if (failed > 0) throw new Error(`${failed} water surface checks failed`);
console.log("water surface checks passed");
