import { acceptedVelocity, retainSwimVelocity } from "./swim";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const dt = 0.05;
const swimX = -1.4;
const swimY = 0.35;
const driftY = 2.2;
const travelX = swimX;
const travelY = swimY + driftY;

const open = acceptedVelocity(travelX, travelY, travelX * dt, travelY * dt, dt);
const kept = retainSwimVelocity(swimX, swimY, 0, driftY, open.x, open.y);
check(Math.abs(open.x - travelX) < 1e-6 && Math.abs(open.y - travelY) < 1e-6, "open water keeps the summed velocity");
check(Math.abs(kept.vx - swimX) < 1e-6 && Math.abs(kept.vy - swimY) < 1e-6, "drift is not stored as swim momentum");

const blocked = retainSwimVelocity(swimX, swimY, 0, driftY, 0, 0);
check(Math.abs(blocked.vx) < 1e-6 && Math.abs(blocked.vy) < 1e-6, "a wall that stops the whole move clears the swim");
const climbed = retainSwimVelocity(swimX, swimY, 0, driftY, 0, travelY);
check(Math.abs(climbed.vx) < 1e-6 && Math.abs(climbed.vy - swimY) < 1e-6, "a wall that leaves the rise keeps the swim's vertical part");

const opposed = retainSwimVelocity(0, -1, 0, 3, 0, 2);
check(Math.abs(opposed.vy + 1) < 1e-6, "an opposing rise leaves the downward swim in place");

const popped = retainSwimVelocity(swimX, swimY, 0, 0, swimX + 0.4, swimY);
check(Math.abs(popped.vx - (swimX + 0.4)) < 1e-6 && Math.abs(popped.vy - swimY) < 1e-6, "without drift the accepted move is stored whole");

const reversed = acceptedVelocity(2, 0, -0.2, 0.05, dt);
check(Math.abs(reversed.x) < 1e-6 && Math.abs(reversed.y - 1) < 1e-6, "a shove against the move drops only that component");

if (failed > 0) throw new Error(`${failed} motility combination checks failed`);
console.log("motility combination checks passed");
