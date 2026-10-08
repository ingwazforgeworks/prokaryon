import {
  MUTATION_POINTS_PER_DIVISION,
  STARTING_ATP,
  cellResources,
  createCellStore,
  focusCellStore,
  focusedCellStore,
  grantMutationPoints,
  mutationPointCount,
  setMutationPoints,
  quickResourceIds,
  splitCellStore,
  storedResource,
  updateCellResource,
  updateResource,
} from "./resources";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

const amount = (id: string): number => cellResources().find((resource) => resource.id === id)?.amount ?? Number.NaN;

check(amount("atp") === STARTING_ATP, "the focused cell starts with a full ATP store");
check(amount("sulfex") === 0, "the focused cell starts with no sulfex");

const parent = createCellStore(STARTING_ATP);
updateCellResource(parent, "sulfex", { amount: 40, rate: 2, capacity: 80 });
updateCellResource(parent, "atp", { amount: 1000, rate: 5 });
const daughter = splitCellStore(parent);

check(storedResource(parent, "atp")?.amount === 500, "division leaves the parent half its ATP");
check(storedResource(daughter, "atp")?.amount === 500, "division gives the daughter the other half of the ATP");
check(storedResource(parent, "sulfex")?.amount === 20, "division leaves the parent half its sulfex");
check(storedResource(daughter, "sulfex")?.amount === 20, "division gives the daughter the other half of the sulfex");
check(storedResource(parent, "sulfex")?.capacity === 80, "division keeps the parent's storage limit");
check(storedResource(daughter, "sulfex")?.capacity === 80, "the daughter inherits the storage limit");
check(storedResource(parent, "sulfex")?.rate === 0, "the parent's rate clears until the next economy step");
check(storedResource(daughter, "atp")?.rate === 0, "the daughter starts with a flat rate");

updateCellResource(daughter, "atp", { amount: 10 });
updateCellResource(parent, "sulfex", { amount: 3 });
check(storedResource(parent, "atp")?.amount === 500, "spending the daughter's ATP leaves the parent alone");
check(storedResource(daughter, "sulfex")?.amount === 20, "spending the parent's sulfex leaves the daughter alone");
check(storedResource(focusedCellStore(), "atp")?.amount === STARTING_ATP, "another cell's stores do not touch the focused cell");

focusCellStore(daughter);
check(amount("atp") === 10, "the resource bar follows the focused cell");
updateResource("atp", { amount: 7 });
check(storedResource(daughter, "atp")?.amount === 7, "the bar's edits land on the focused cell");
check(storedResource(parent, "atp")?.amount === 500, "the bar's edits do not land on a sister");

const wallet = mutationPointCount();
grantMutationPoints(MUTATION_POINTS_PER_DIVISION);
check(mutationPointCount() === wallet + 1, "one division awards one mutation point");
grantMutationPoints(0);
check(mutationPointCount() === wallet + 1, "a zero grant adds nothing");
setMutationPoints(wallet);

const ribbon = createCellStore(0);
check(
  quickResourceIds(ribbon.resources).join() === "atp,fluxin,reducin,biomass",
  "an empty cell shows ATP and the first three stores",
);
updateCellResource(ribbon, "oxidex", { amount: 12 });
updateCellResource(ribbon, "sulfex", { amount: 9 });
updateCellResource(ribbon, "ferron", { amount: 4 });
updateCellResource(ribbon, "fluxin", { amount: 1 });
check(
  quickResourceIds(ribbon.resources).join() === "atp,oxidex,sulfex,ferron",
  "the ribbon follows the three fullest stores after ATP",
);
updateCellResource(ribbon, "biomass", { amount: 20 });
updateCellResource(ribbon, "sulfex", { amount: 12 });
check(
  quickResourceIds(ribbon.resources).join() === "atp,biomass,sulfex,oxidex",
  "a fuller store moves beside ATP, and a tie keeps catalog order",
);

if (failed > 0) throw new Error(`${failed} checks failed`);
console.log("resource checks passed");
