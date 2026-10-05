import { cellSeparation, longAxisSide, longAxisT, maxPiliOnSite, maxPilusLength, piliPlacements, type BodyShape, type PilusSite } from "./shape";
import type { PilusSnapshot } from "./types";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function body(length: number, width: number, pili: PilusSnapshot[] = []): BodyShape {
  return {
    length,
    width,
    bend: 0,
    furrow: 0,
    furrowAxis: 0,
    morph: 0,
    divisionShift: 0,
    divisionPlace: 0,
    capsule: 0,
    pili,
  };
}

const length = 2;
const width = 0.75;
const cap = maxPilusLength(length, width);

check(cap < length * 2, "a pilus cap stays shorter than a full flagellum");
check(piliPlacements(0, 1, 0, "polar", length, width, 0).length === 0, "zero pili places nothing");
check(piliPlacements(4, 0, 0, "polar", length, width, 0).length === 0, "zero average length places nothing");

const sites: PilusSite[] = ["polar", "antipolar", "lateral", "antilateral"];
for (const site of sites) {
  check(maxPiliOnSite(32, site) === 8, `${site} emerges a quarter of the maximum`);
}
check(maxPiliOnSite(32, "all") === 32, "every side together emerges the full maximum");
for (const site of sites) {
  const placed = piliPlacements(6, 1, 0, site, length, width, 0);
  check(placed.length === 6, `${site} places the requested count`);
  for (const pilus of placed) {
    const along = longAxisT(pilus.x, pilus.y, length, width, 0);
    const side = longAxisSide(pilus.x, pilus.y, length, width, 0);
    const outward = pilus.x * pilus.dirX + pilus.y * pilus.dirY;
    check(pilus.length <= cap + 1e-6, `${site} length stays under the cap`);
    check(outward > 0, `${site} needle points out of the membrane`);
    if (site === "polar") check(along > 0.4, "polar pili sit on the polar cap");
    if (site === "antipolar") check(along < -0.4, "antipolar pili sit on the antipolar cap");
    if (site === "lateral") check(side > 0 && Math.abs(along) < 0.7, "lateral pili sit on one flank");
    if (site === "antilateral") check(side < 0 && Math.abs(along) < 0.7, "antilateral pili sit on the other flank");
  }
}

const ring = piliPlacements(8, 1, 0, "all", length, width, 0);
const covered = new Set(ring.map((pilus) => {
  const along = longAxisT(pilus.x, pilus.y, length, width, 0);
  const side = longAxisSide(pilus.x, pilus.y, length, width, 0);
  if (along >= 0.55) return "polar";
  if (along <= -0.55) return "antipolar";
  return side >= 0 ? "lateral" : "antilateral";
}));
check(ring.length === 8 && covered.size === 4, "all emergence puts pili on every side");
check(ring.every((pilus) => pilus.x * pilus.dirX + pilus.y * pilus.dirY > 0), "all-around pili point outward");

const polar = piliPlacements(6, 1, 0, "polar", length, width, 0);
const polarAngles = polar.map((pilus) => Math.atan2(pilus.y, pilus.x)).sort((a, b) => a - b);
const polarGaps: number[] = [];
for (let i = 1; i < polarAngles.length; i += 1) polarGaps.push((polarAngles[i] ?? 0) - (polarAngles[i - 1] ?? 0));
check(polarGaps.length > 1 && Math.max(...polarGaps) / Math.min(...polarGaps) > 1.35, "pili are not equally spaced");
check(polar.some((pilus) => pilus.layer === 0) && polar.some((pilus) => pilus.layer === 1), "pili form two layers");

const even = piliPlacements(5, 0.6, 0, "polar", length, width, 0);
const back = even.filter((pilus) => pilus.layer === 0);
const front = even.filter((pilus) => pilus.layer === 1);
check(back.length > 0 && front.length > 0 && back.every((pilus) => Math.abs(pilus.length - back[0].length) < 1e-6), "zero variance keeps one length per layer");
check(front.every((pilus) => Math.abs(pilus.length - back[0].length * 0.62) < 1e-4), "the front layer is the shorter coat");
const varied = piliPlacements(8, 0.7, 1, "lateral", length, width, 0);
const shortest = Math.min(...varied.map((pilus) => pilus.length));
const longest = Math.max(...varied.map((pilus) => pilus.length));
check(longest - shortest > cap * 0.2, "full variance spreads lengths");
check(longest <= cap + 1e-6, "variance cannot pass the cap");

const gap = body(1, 0.5);
const apart = cellSeparation(
  { x: 0, y: 0, angle: 0, body: gap },
  { x: 1.2, y: 0, angle: 0, body: gap },
);
check(apart === null, "bare cells with a gap do not collide");

const curved = piliPlacements(4, 1, 0, "polar", length, width, Math.PI / 3);
check(curved.length === 4 && curved.every((pilus) => pilus.x * pilus.dirX + pilus.y * pilus.dirY > 0), "crescent pili still point outward");

const wide = piliPlacements(3, 1, 0, "polar", 0.75, 2, 0);
check(wide.length === 3 && wide.every((pilus) => pilus.y > 0.5 && pilus.dirY > 0), "polar follows the long axis when girth is longer");

const reaching = piliPlacements(1, 1, 0, "polar", 1, 0.5, 0);
check(reaching.length === 1, "one polar pilus is placed");
const poked = cellSeparation(
  { x: 0, y: 0, angle: 0, body: body(1, 0.5, reaching) },
  { x: 1.2, y: 0, angle: 0, body: gap },
);
check(poked !== null && poked.depth > 0, "a pilus that reaches another cell changes the collider");

if (failed > 0) throw new Error(`${failed} pili checks failed`);
console.log("pili checks passed");
