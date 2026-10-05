import { TAPER_ALL, TAPER_ANTILATERAL, TAPER_ANTIPOLAR, TAPER_LATERAL, TAPER_POLAR, bodySignedDistance, membraneSamples, type BodyShape } from "./shape";
import type { CellTaper } from "./types";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function shell(taper: number | CellTaper = 0, crystal = false, bend = 0): BodyShape {
  return {
    length: 2,
    width: 0.75,
    bend,
    furrow: 0,
    furrowAxis: 0,
    morph: 0,
    divisionShift: 0,
    divisionPlace: 0,
    capsule: 0,
    crystal,
    taper,
  };
}

function surface(dirX: number, dirY: number, taper: number | CellTaper = 0, crystal = false, bend = 0): number {
  const body = shell(taper, crystal, bend);
  let lo = 0;
  let hi = 4;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) * 0.5;
    const distance = bodySignedDistance(dirX * mid, dirY * mid, body);
    if (distance > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) * 0.5;
}

const fullPole = surface(1, 0);
const polarPole = surface(1, 0, TAPER_POLAR);
const polarBack = surface(-1, 0, TAPER_POLAR);
const fullFlank = surface(0, 1);
const lateralFlank = surface(0, 1, TAPER_LATERAL);
const lateralOther = surface(0, -1, TAPER_LATERAL);
const allPole = surface(1, 0, TAPER_ALL);
const allFlank = surface(0, 1, TAPER_ALL);
const bothPole = surface(1, 0, TAPER_POLAR | TAPER_LATERAL);
const bothFlank = surface(0, 1, TAPER_POLAR | TAPER_LATERAL);
const bothBack = surface(-1, 0, TAPER_POLAR | TAPER_LATERAL);
const crystalPole = surface(1, 0, TAPER_POLAR, true);
const crystalFull = surface(1, 0, 0, true);
const crystalBack = surface(-1, 0, TAPER_POLAR, true);
const bentPole = surface(1, 0, TAPER_POLAR, false, 0.6);
const bentBack = surface(-1, 0, TAPER_POLAR, false, 0.6);

check(polarPole < fullPole - 0.05, "polar taper shortens the polar end");
check(Math.abs(polarBack - fullPole) < 0.02, "polar taper leaves the antipolar end");
check(lateralFlank < fullFlank * 0.75, "lateral taper compresses that flank");
check(Math.abs(lateralOther - fullFlank) < 0.02, "lateral taper leaves the antilateral flank");
check(Math.abs(allPole - fullPole) < 0.02, "tapering every side leaves the poles unchanged");
check(Math.abs(allFlank - fullFlank) < 0.02, "tapering every side leaves the flanks unchanged");
check(bothPole < fullPole - 0.05 && bothFlank < fullFlank * 0.75, "two sides compress together");
check(Math.abs(bothBack - fullPole) < 0.02, "an unselected side stays full when others taper");
check(crystalPole < crystalFull - 0.04, "crystal polar taper shortens that pole");
check(Math.abs(crystalBack - crystalFull) < 0.03, "crystal polar taper leaves the other pole");
check(bentPole < bentBack - 0.04, "a crescent still tapers toward the selected pole");

function bellySpan(bend: number, crystal: boolean): number {
  const body = shell(0, crystal, bend);
  let lo = Infinity;
  let hi = -Infinity;
  for (let y = -2; y <= 2; y += 0.002) {
    if (bodySignedDistance(0, y, body) > 0) continue;
    if (y < lo) lo = y;
    if (y > hi) hi = y;
  }
  return hi - lo;
}

const crystalStraight = bellySpan(0, true);
const crystalCrescent = bellySpan(Math.PI / 3, true);
check(crystalCrescent > crystalStraight * 0.85, "a crystalline crescent keeps its girth through the middle");
check(bodySignedDistance(1 - 0.22, 0.18, shell(0, true, 0)) > 0.01, "a crystalline tip narrows to a point");

function flankCorner(bend: number): number {
  const verts = membraneSamples(shell(0, true, bend)).filter((_, index) => index % 2 === 0);
  let peak = 0;
  for (let i = 0; i < verts.length; i += 1) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const c = verts[(i + 2) % verts.length];
    if (!a || !b || !c) continue;
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const bcx = c[0] - b[0];
    const bcy = c[1] - b[1];
    const ab = Math.hypot(abx, aby);
    const bc = Math.hypot(bcx, bcy);
    if (ab < 1e-6 || bc < 1e-6) continue;
    const dot = Math.min(1, Math.max(-1, (abx * bcx + aby * bcy) / (ab * bc)));
    const turn = Math.acos(dot);
    if (turn > peak) peak = turn;
  }
  return peak;
}

check(flankCorner(0) > 1.5, "a crystalline tip is a sharp corner");
check(flankCorner(Math.PI / 3) > 0.5, "a crystalline crescent breaks into flat faces");
const crescentBody = shell(0, true, Math.PI / 3);
const crescentOutline = membraneSamples(crescentBody);
check(crescentOutline.length >= 8, "a crystalline crescent still has a membrane outline");
check(
  crescentOutline.every(([x, y]) => Math.abs(bodySignedDistance(x, y, crescentBody)) < 0.03),
  "crystalline crescent samples stay on the membrane",
);
check(surface(0, -1, TAPER_ANTILATERAL) < fullFlank * 0.75, "antilateral taper compresses that flank");

function degrees(mask: number, polar: number, antipolar = 1, lateral = 1, antilateral = 1): CellTaper {
  return { mask, polar, antipolar, lateral, antilateral };
}

const mildPole = surface(1, 0, degrees(TAPER_POLAR, 0.35));
check(mildPole < fullPole - 0.02, "a partial polar degree shortens that pole");
check(mildPole > polarPole + 0.02, "a smaller polar degree pinches less than full taper");
check(Math.abs(surface(-1, 0, degrees(TAPER_POLAR, 0.35)) - fullPole) < 0.02, "a polar degree leaves the antipolar end");

const splitPoles = degrees(TAPER_POLAR | TAPER_ANTIPOLAR, 1, 0.25);
check(surface(1, 0, splitPoles) < surface(-1, 0, splitPoles) - 0.03, "each pole follows its own degree");

const mildFlank = surface(0, 1, degrees(TAPER_LATERAL, 1, 1, 0.3));
check(mildFlank < fullFlank - 0.02 && mildFlank > lateralFlank + 0.02, "lateral degree scales that flank only");
check(surface(0, -1, degrees(TAPER_ANTILATERAL, 1, 1, 1, 0.3)) < fullFlank * 0.9, "antilateral degree scales that flank");

const even = degrees(TAPER_ALL, 0.4, 0.4, 0.4, 0.4);
check(Math.abs(surface(1, 0, even) - fullPole) < 0.02, "equal degrees on every side leave the poles");
check(Math.abs(surface(0, 1, even) - fullFlank) < 0.02, "equal degrees on every side leave the flanks");

const uneven = degrees(TAPER_ALL, 1, 0.4, 0.4, 0.4);
check(surface(1, 0, uneven) < fullPole - 0.03, "all-sides keeps the extra polar degree");
check(Math.abs(surface(0, 1, uneven) - fullFlank) < 0.02, "all-sides leaves the least-tapered flank full");

if (failed > 0) throw new Error(`${failed} taper checks failed`);
console.log("taper checks passed");
