import { capsuleGap, capsulesOverlap, type Capsule } from "./cellCollision";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) < 1e-9;
}

// Round bodies: the spine degenerates to a point and the test is circles.
const roundA: Capsule = { x: 0, y: 0, angle: 0, length: 2, width: 2 };
const roundB: Capsule = { x: 3, y: 0, angle: 0, length: 2, width: 2 };
const roundC: Capsule = { x: 1.5, y: 0, angle: 0, length: 2, width: 2 };
check(near(capsuleGap(roundA, roundB).gap, 1), "two round bodies one unit apart are clear by a unit");
check(!capsulesOverlap(roundA, roundB), "clear round bodies do not overlap");
check(near(capsuleGap(roundA, roundC).gap, -0.5), "overlapping round bodies report the depth");
check(capsulesOverlap(roundA, roundC), "overlapping round bodies overlap");
const touching = capsuleGap(roundA, roundC);
check(near(touching.nx, 1) && near(touching.ny, 0), "the push runs from the first body toward the second");

// Parallel capsules side by side: gap is the spine distance minus both radii.
const horizontal: Capsule = { x: 0, y: 0, angle: 0, length: 4, width: 1 };
const beside: Capsule = { x: 0, y: 1.5, angle: 0, length: 4, width: 1 };
const pressed: Capsule = { x: 0, y: 0.5, angle: 0, length: 4, width: 1 };
check(near(capsuleGap(horizontal, beside).gap, 0.5), "side-by-side capsules clear by half a unit");
check(near(capsuleGap(horizontal, pressed).gap, -0.5), "pressed capsules overlap by half a unit");
const sideContact = capsuleGap(horizontal, pressed);
check(near(sideContact.nx, 0) && near(sideContact.ny, 1), "the side push runs straight across");

// End to end: only the spine tips matter.
const after: Capsule = { x: 5, y: 0, angle: 0, length: 4, width: 1 };
const nudging: Capsule = { x: 3.9, y: 0, angle: 0, length: 4, width: 1 };
check(near(capsuleGap(horizontal, after).gap, 1), "tail-to-nose capsules clear by a unit");
check(near(capsuleGap(horizontal, nudging).gap, -0.1), "nudging capsules overlap by a tenth");
check(capsulesOverlap(horizontal, nudging), "nudging capsules overlap");

// Perpendicular bodies: the closest points sit at the crossing.
const crossing: Capsule = { x: 0, y: 2, angle: Math.PI / 2, length: 4, width: 1 };
const crossed = capsuleGap(horizontal, crossing);
check(near(crossed.gap, -0.5) && near(crossed.nx, 0) && near(crossed.ny, 1), "a crossing body overlaps along its spine");

// Coincident spines: full depth and a stable perpendicular push.
const concentric: Capsule = { x: 0, y: 0, angle: Math.PI / 2, length: 4, width: 1 };
const coincident = capsuleGap(horizontal, concentric);
check(near(coincident.gap, -1) && near(coincident.nx, 0) && near(coincident.ny, 1), "coincident spines report full depth");

// A rotated body measures from its own spine, not the world axes.
const diagonal: Capsule = { x: 2, y: 0, angle: Math.PI / 2, length: 2, width: 0.5 };
const angled = capsuleGap(horizontal, diagonal);
check(near(angled.gap, -0.25) && near(angled.nx, 1), "a thin upright body overlaps a horizontal one by a quarter");

if (failed > 0) throw new Error(`${failed} cell collision checks failed`);
console.log("cell collision checks passed");