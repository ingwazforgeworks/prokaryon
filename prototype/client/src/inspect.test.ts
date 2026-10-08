import { playerCellTarget, setPlayerCellLines } from "./inspect";
import { ownedSpecies } from "./species";
import type { CellSnapshot } from "./types";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

const cell: CellSnapshot = {
  id: 2,
  x: 0,
  y: 0,
  angle: 0,
  vx: 0,
  vy: 0,
  omega: 0,
  length: 4,
  width: 2,
  palette: 0,
  seed: 0,
  capsule: 0,
  motor: "idle",
  activity: 0,
  ciliaSpeed: 0,
  ciliaSway: 0,
  ciliaOrder: 0,
  ciliaSwitch: "lateral",
  ciliaReverse: false,
  flagella: [],
  cilia: [],
};

// Selecting a cell titles the card like a specimen label: species plus the
// cell's lineage number, zero-padded to three digits.
const target = playerCellTarget(cell);
check(target.id === "cell:2", "the target id follows the cell");
check(target.title === `${ownedSpecies} 002`, `the card reads species plus padded number (${target.title})`);
check(/^[A-Z][a-z]+ [a-z]+ 002$/.test(target.title), "the title is Genus epithet followed by the padded cell number");
check(target.contains(0, 0), "the target still hits its own cell");
const bounds = target.bounds();
check(bounds.maxX > bounds.minX && bounds.maxY > bounds.minY, "the target reports its cell bounds");

// Switching to a different cell retitles the card for that cell.
const nextTarget = playerCellTarget({ ...cell, id: 1000 });
check(nextTarget.id === "cell:1000", "a new cell gets its own target id");
check(nextTarget.title === `${ownedSpecies} 1000`, `a four-digit cell number is not truncated (${nextTarget.title})`);

// The body lines are whatever the game publishes, size first.
setPlayerCellLines(["Cell Size: 1x", "Osmolyn  12 nM"]);
const published = playerCellTarget(cell);
check(published.lines.length === 2 && published.lines[0] === "Cell Size: 1x", "published lines show on the card, size first");

if (failed > 0) {
  throw new Error(`${failed} inspect check${failed === 1 ? "" : "s"} failed`);
}
console.log("inspect checks passed");