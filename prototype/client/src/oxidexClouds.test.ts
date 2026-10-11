import { COLUMN_BOTTOM, COLUMN_TOP } from "./light";
import {
  NUTRIENT_CELL,
  NUTRIENT_COLUMNS,
  NUTRIENT_ORIGIN_X,
  NUTRIENT_ORIGIN_Y,
  NUTRIENT_ROWS,
  paintScaledPlume,
} from "./nutrients";
import { depleteOxidexCell, oxidexPresence, placeOxidexClouds } from "./oxidexClouds";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

check(oxidexPresence(COLUMN_BOTTOM) === 0, "oxidex presence is zero at the bottom");
check(oxidexPresence(COLUMN_TOP) === 1, "oxidex presence is certain at the surface");
check(oxidexPresence(COLUMN_BOTTOM + 200) < 0.002, "oxidex presence stays almost zero in the deep");
check(oxidexPresence(COLUMN_TOP - 80) > 0.6, "oxidex presence is very likely high in the column");

const open = placeOxidexClouds(() => 0);
const again = placeOxidexClouds(() => 0);
check(JSON.stringify(open) === JSON.stringify(again), "the same water places the same clouds");

const deep = open.filter((cloud) => cloud.y < COLUMN_BOTTOM + 200).length;
const high = open.filter((cloud) => cloud.y > COLUMN_TOP - 200).length;
check(deep === 0, `the deep holds no oxidex clouds (found ${deep})`);
check(high >= 8, `the surface holds many oxidex clouds (found ${high})`);

let smallest = Infinity;
let largest = 0;
for (const cloud of open) {
  if (cloud.scale < smallest) smallest = cloud.scale;
  if (cloud.scale > largest) largest = cloud.scale;
}
check(smallest < 0.75 && largest > 1.35, `cloud sizes vary (smallest ${smallest}, largest ${largest})`);

const stained = placeOxidexClouds((x, y) => (x > 0 && y > 200 ? 1 : 0));
const sitting = stained.filter((cloud) => cloud.x > 8 && cloud.y > 250).length;
check(sitting === 0, `clouds do not sit inside another field (found ${sitting})`);

const grid = new Float32Array(NUTRIENT_COLUMNS * NUTRIENT_ROWS);
paintScaledPlume(grid, NUTRIENT_COLUMNS, NUTRIENT_ROWS, NUTRIENT_ORIGIN_X, NUTRIENT_ORIGIN_Y, NUTRIENT_CELL, 0, 0, 0, 1, 0.6);
const wide = new Float32Array(NUTRIENT_COLUMNS * NUTRIENT_ROWS);
paintScaledPlume(wide, NUTRIENT_COLUMNS, NUTRIENT_ROWS, NUTRIENT_ORIGIN_X, NUTRIENT_ORIGIN_Y, NUTRIENT_CELL, 0, 0, 0, 1, 1.6);

function covered(values: Float32Array): number {
  let count = 0;
  for (let index = 0; index < values.length; index += 1) if (values[index] > 0.05) count += 1;
  return count;
}

const center = (Math.floor((0 - NUTRIENT_ORIGIN_Y) / NUTRIENT_CELL) * NUTRIENT_COLUMNS)
  + Math.floor((0 - NUTRIENT_ORIGIN_X) / NUTRIENT_CELL);
const cloud = new Float32Array(NUTRIENT_COLUMNS * NUTRIENT_ROWS);
const scar = new Float32Array(cloud.length);
cloud[0] = 0.8;
const removed = depleteOxidexCell(cloud, scar, NUTRIENT_ORIGIN_X + 0.5, NUTRIENT_ORIGIN_Y + 0.5, 0.3);
check(removed === 0.3 && Math.abs(cloud[0] - 0.5) < 1e-6, "oxidex drawdown removes what the cell holds");
check(scar[0] > 0, "a drawdown leaves a refill scar");
check(depleteOxidexCell(cloud, scar, NUTRIENT_ORIGIN_X + 0.5, NUTRIENT_ORIGIN_Y + 0.5, 5) === 0.5, "a drawdown cannot remove more than the cell holds");

check(grid[center] > 0.4, "a cloud is bright at its root");
check(covered(wide) > covered(grid) * 1.5, "a larger cloud covers more water");

if (failed > 0) throw new Error(`${failed} oxidex cloud checks failed`);
console.log("oxidex cloud checks passed");
