import {
  NUTRIENT_CELL,
  NUTRIENT_COLUMNS,
  NUTRIENT_ORIGIN_X,
  NUTRIENT_ORIGIN_Y,
  NUTRIENT_ROWS,
  PLUME_ACROSS,
  PLUME_LEAD,
  PLUME_ROCK,
  PLUME_WATER,
  NutrientConcentrations,
  nutrientKind,
  paintNutrients,
  plumeAmount,
  tailAmount,
  type NutrientFace,
} from "./nutrients";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

check(nutrientKind("sulfur") === "sulfex", "thionite leaks sulfex");
check(nutrientKind("iron") === "ferron", "ferracite leaks ferron");
check(nutrientKind("ammonia") === "nitrox", "azoite leaks nitrox");
check(nutrientKind("chloride") === "osmolyn", "halite leaks osmolyn");
check(nutrientKind("vent") === null, "unknown deposits leak nothing");

check(plumeAmount(0, 0) === 1, "the plume is full at its center");
check(plumeAmount(PLUME_WATER, 0) === 0, "the plume ends at the water reach");
check(plumeAmount(-PLUME_ROCK, 0) === 0, "the plume ends at the rock reach");
check(plumeAmount(0, PLUME_ACROSS) === 0, "the plume ends across the face");
check(plumeAmount(PLUME_WATER * 0.5, 0) > 0 && plumeAmount(PLUME_WATER * 0.5, 0) < 0.4, "the water side fades before the edge");
check(plumeAmount(-(PLUME_ROCK + 1), 0) === 0, "past the rock the plume is empty");
check(plumeAmount(PLUME_ROCK + 2, 0) > 0, "the water side reaches farther than the rock side");
check(tailAmount(0, 0) === 0.25, "the uncolored tail is fullest at the plume center");
check(tailAmount(48, 0) > 0.035 && tailAmount(48, 0) < 0.05, "about 48 units out the tail is near 0.04");
check(tailAmount(24, 0) > tailAmount(48, 0) && tailAmount(48, 0) > tailAmount(90, 0), "the tail falls off with distance");
check(tailAmount(200, 0) === 0, "the tail ends instead of filling the whole column");
check(tailAmount(-40, 0) < tailAmount(40, 0), "the tail reaches farther into open water than back into rock");

function cell(values: Float32Array, x: number, y: number): [number, number, number, number] {
  const column = Math.floor((x - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
  const row = Math.floor((y - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
  const index = (row * NUTRIENT_COLUMNS + column) * 4;
  return [values[index], values[index + 1], values[index + 2], values[index + 3]];
}

function boxMax(values: Float32Array, x: number, y: number, channel: number): number {
  let best = 0;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) best = Math.max(best, cell(values, x + dx, y + dy)[channel]);
  }
  return best;
}

const up: NutrientFace = { x: 1, y: 1 - PLUME_LEAD, nx: 0, ny: 1, resource: "sulfur" };
const values = new Float32Array(NUTRIENT_COLUMNS * NUTRIENT_ROWS * 4);
paintNutrients(values, [up]);
const core = cell(values, 1, 1);
check(core[1] === 0 && core[2] === 0 && core[3] === 0, "sulfex fills only its channel");
check(boxMax(values, 1, 1, 0) > 0.45, "sulfex clumps in front of thionite");
let waterSum = 0;
let rockSum = 0;
let spread = 0;
let lo = 1;
let hi = 0;
for (let dy = 0; dy <= 4; dy += 1) {
  const sample = cell(values, 1, 2 + dy)[0];
  waterSum += sample;
  lo = Math.min(lo, sample);
  hi = Math.max(hi, sample);
}
for (let dy = 0; dy <= 3; dy += 1) rockSum += cell(values, 1, -6 + dy)[0];
spread = hi - lo;
check(waterSum > rockSum, "sulfex stays stronger in the water than back in the rock");
check(spread > 0.15, "neighboring water does not share one smooth value");
check(cell(values, 1, 1 + PLUME_WATER * 2)[0] === 0, "sulfex is gone past the water reach");

values.fill(0);
paintNutrients(values, [up], () => true);
check(cell(values, 1, 1)[0] === 0, "nutrient stays out of blocked terrain");

values.fill(0);
paintNutrients(values, [
  { x: 5 - PLUME_LEAD, y: -19, nx: 1, ny: 0, resource: "iron" },
  { x: 9, y: -41 + PLUME_LEAD, nx: 0, ny: -1, resource: "ammonia" },
  { x: -11 + PLUME_LEAD, y: 31, nx: -1, ny: 0, resource: "chloride" },
]);
check(boxMax(values, 5, -19, 1) > 0.45, "ferron clumps in front of ferracite");
check(boxMax(values, 9, -41, 2) > 0.45, "nitrox clumps in front of azoite");
check(boxMax(values, -11, 31, 3) > 0.45, "osmolyn clumps in front of halite");

values.fill(0);
paintNutrients(values, [up]);
const single = cell(values, 1, 1)[0];
paintNutrients(values, [{ x: 0, y: 0, nx: 0, ny: 1, resource: "sulfur" }]);
check(cell(values, 1, 1)[0] >= single, "two sulfex plumes keep the stronger sample");

const field = new NutrientConcentrations();
field.sources(1, [up]);
let spot = { x: 1, y: 1, value: 0 };
for (let dy = -1; dy <= 4; dy += 1) {
  for (let dx = -2; dx <= 2; dx += 1) {
    const value = field.read("sulfex", 1 + dx, 1 + dy);
    if (value > spot.value) spot = { x: 1 + dx, y: 1 + dy, value };
  }
}
check(spot.value > 0.45, "a deposit charges clumps of water in front of it");
const quiet = new Float32Array(NUTRIENT_COLUMNS * NUTRIENT_ROWS * 4);
paintNutrients(quiet, [up]);
check(cell(quiet, 1, 49)[0] === 0, "the colored plume does not reach the distant water");
const distant = field.read("sulfex", 1, 49);
const distantColumn = Math.floor((1 - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
const distantRow = Math.floor((49 - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL);
const distantX = NUTRIENT_ORIGIN_X + (distantColumn + 0.5) * NUTRIENT_CELL;
const distantY = NUTRIENT_ORIGIN_Y + (distantRow + 0.5) * NUTRIENT_CELL;
check(Math.abs(distant - tailAmount(distantY - 1, distantX - 1)) < 1e-5, "distant water keeps the uncolored tail");
check(distant > 0.03 && distant < 0.05, "hovering far from the stain still reads about 0.04");
check(field.read("sulfex", 1, 30) > distant + 0.02, "the tail is stronger closer to the deposit");
check(distant > field.read("sulfex", 1, 80) && field.read("sulfex", 1, 80) > 0, "the tail keeps a gradient past the colored plume");
check(field.read("ferron", 1, 49) === 0, "a sulfex tail does not invent ferron");
const walled = new NutrientConcentrations();
walled.sources(1, [up], () => true);
check(walled.read("sulfex", 1, 49) === 0, "the tail stays out of solid terrain");
const request = Math.min(0.2, spot.value * 0.5);
const taken = field.take("sulfex", spot.x, spot.y, request);
const dipped = field.read("sulfex", spot.x, spot.y);
check(Math.abs(taken - request) < 1e-5 && dipped < spot.value - request * 0.5, "taking nutrient lowers that cell");
check(field.read("ferron", spot.x, spot.y) === 0, "taking sulfex leaves the other nutrients");
check(Math.abs(field.take("sulfex", spot.x, spot.y, 10) - dipped) < 1e-5, "a cell cannot give more than it holds");
const rested = field.read("sulfex", spot.x, spot.y);
check(rested > 0.02 && rested < spot.value * 0.7, "draining the plume leaves the uncolored tail");
for (let step = 0; step < 40; step += 1) field.advance(0.1);
check(field.read("sulfex", spot.x, spot.y) > rested + 0.15, "the deposit leaches concentration back into that cell");

const poured = field.add("nitrox", 40, 200, 0.8);
const pouredAt = field.read("nitrox", 40, 200);
check(Math.abs(poured - 0.8) < 1e-5 && Math.abs(pouredAt - 0.8) < 1e-5, "adding nutrient raises an empty cell");
check(Math.abs(field.add("nitrox", 40, 200, 0.5) - 0.2) < 1e-5, "a cell stops at full concentration");
for (let step = 0; step < 40; step += 1) field.advance(0.1);
check(field.read("nitrox", 40, 200) < pouredAt * 0.55, "open water loses concentration the deposits do not supply");
check(field.read("sulfex", 100, 400) === 0, "water far from a deposit stays empty");
check(field.read("nitrox", -80, -400) === 0, "the far corner is not stirred just because a plume exists");

if (failed > 0) throw new Error(`${failed} nutrient checks failed`);
console.log("nutrient checks passed");
