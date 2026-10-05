import { flagellumSiteAnchor, longAxisSide, longAxisT, type FlagellumSite } from "./shape";
import { stepSwim, type SwimState } from "./swim";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const length = 2;
const width = 0.75;
const sites: FlagellumSite[] = ["polar", "antipolar", "lateral", "antilateral"];

for (const site of sites) {
  const root = flagellumSiteAnchor(length, width, 0, site, 0);
  const along = longAxisT(root.x, root.y, length, width, 0);
  const side = longAxisSide(root.x, root.y, length, width, 0);
  const outward = root.x * root.dirX + root.y * root.dirY;
  check(outward > 0.2, `${site} points outward`);
  if (site === "polar") check(along > 0.7, "polar flagellin sits on the polar cap");
  if (site === "antipolar") check(along < -0.7, "antipolar flagellin sits on the antipolar cap");
  if (site === "lateral") check(side > 0 && Math.abs(along) < 0.2, "lateral flagellin sits on one flank");
  if (site === "antilateral") check(side < 0 && Math.abs(along) < 0.2, "antilateral flagellin sits on the other flank");
}

const curved = flagellumSiteAnchor(length, width, Math.PI / 3, "lateral", 0);
check(
  curved.x * curved.dirX + curved.y * curved.dirY > 0.2 &&
    Math.abs(longAxisT(curved.x, curved.y, length, width, Math.PI / 3)) < 0.25,
  "a crescent flank tuft stays on the side and points outward",
);

const widePolar = flagellumSiteAnchor(0.75, 2, 0, "polar", 0);
const wideLateral = flagellumSiteAnchor(0.75, 2, 0, "lateral", 0);
check(widePolar.y > 0.5 && widePolar.dirY > 0, "polar follows the long axis when girth is longer");
check(
  Math.abs(wideLateral.x) > 0.2 && Math.abs(wideLateral.y) < 0.2 && wideLateral.x * wideLateral.dirX > 0,
  "lateral stays on the short axis when girth is longer",
);

function rest(): SwimState {
  return { vx: 0, vy: 0, omega: 0, thrusting: true, driveX: 0, driveY: 0 };
}

function coast(lateral: number, antilateral: number, polar = 0): SwimState {
  return stepSwim(
    rest(),
    {
      length,
      width,
      bend: 0,
      angle: 0,
      antipolar: 0,
      polar,
      lateral,
      antilateral,
      undulation: 1,
      ciliation: 0,
      ciliaLength: 0,
      ciliaSpeed: 0,
      ciliaSway: 0,
      ciliaOrder: 0,
      ciliaSwitch: "lateral",
      ciliaReverse: false,
    },
    0.05,
  );
}

const sideways = coast(1, 0);
check(sideways.vy < -0.05 && Math.abs(sideways.vx) < 0.02 && Math.abs(sideways.omega) < 0.02, "lateral flagellin pushes across the cell");
const opposite = coast(0, 1);
check(opposite.vy > 0.05, "antilateral flagellin pushes the other way");
const cancelled = coast(1, 1);
check(Math.abs(cancelled.vx) < 0.02 && Math.abs(cancelled.vy) < 0.02, "matched flanks cancel");
const ahead = coast(0, 0, 1);
check(ahead.vx < -0.05 && Math.abs(ahead.vy) < 0.02, "polar flagellin still pushes along the axis");

function settled(
  partial: { polar?: number; antipolar?: number; lateral?: number; antilateral?: number },
  undulation = 1,
  motors = false,
): SwimState {
  let state = rest();
  const shaped = {
    length,
    width,
    bend: 0,
    angle: 0,
    antipolar: 0,
    polar: 0,
    lateral: 0,
    antilateral: 0,
    undulation,
    ciliation: 0,
    ciliaLength: 0,
    ciliaSpeed: 0,
    ciliaSway: 0,
    ciliaOrder: 0,
    ciliaSwitch: "lateral" as const,
    ciliaReverse: false,
    motors,
    ...partial,
  };
  for (let i = 0; i < 80; i += 1) state = stepSwim(state, shaped, 0.05, () => 0);
  return state;
}

const opposed = settled({ polar: 1, antipolar: 1 });
check(Math.hypot(opposed.vx, opposed.vy) < 0.02, "opposed poles leave no run");
const opposedRest = stepSwim(
  opposed,
  {
    length,
    width,
    bend: 0,
    angle: 0,
    antipolar: 1,
    polar: 1,
    lateral: 0,
    antilateral: 0,
    undulation: 0,
    ciliation: 0,
    ciliaLength: 0,
    ciliaSpeed: 0,
    ciliaSway: 0,
    ciliaOrder: 0,
    ciliaSwitch: "lateral",
    ciliaReverse: false,
    motors: false,
  },
  0.05,
  () => 0,
);
check(opposedRest.omega < -0.4, "opposed poles still pick a coast when the pulse ends");

let tumbling: SwimState = { vx: 0, vy: 0, omega: 0, thrusting: false, driveX: 0, driveY: 0 };
const burst = {
  length,
  width,
  bend: 0,
  angle: 0,
  antipolar: 0,
  polar: 1,
  lateral: 1,
  antilateral: 1,
  undulation: 0,
  ciliation: 0,
  ciliaLength: 0,
  ciliaSpeed: 0,
  ciliaSway: 0,
  ciliaOrder: 0,
  ciliaSwitch: "lateral" as const,
  ciliaReverse: false,
  motors: true,
};
for (let i = 0; i < 10; i += 1) tumbling = stepSwim(tumbling, burst, 0.05, () => 0);
check(tumbling.thrusting, "a counterclockwise burst keeps the release armed");
check(Math.abs(tumbling.omega) < 0.05, "the counterclockwise burst does not spend the coast");
tumbling = stepSwim(
  tumbling,
  {
    length,
    width,
    bend: 0,
    angle: 0,
    antipolar: 0,
    polar: 1,
    lateral: 1,
    antilateral: 1,
    undulation: 0,
    ciliation: 0,
    ciliaLength: 0,
    ciliaSpeed: 0,
    ciliaSway: 0,
    ciliaOrder: 0,
    ciliaSwitch: "lateral",
    ciliaReverse: false,
    motors: false,
  },
  0.05,
  () => 0,
);
check(tumbling.omega < -0.4, "the rest after a counterclockwise burst still coasts");

const polarRun = settled({ polar: 1 });
const polarRest = stepSwim(
  polarRun,
  {
    length,
    width,
    bend: 0,
    angle: 0,
    antipolar: 0,
    polar: 1,
    lateral: 0,
    antilateral: 0,
    undulation: 0,
    ciliation: 0,
    ciliaLength: 0,
    ciliaSpeed: 0,
    ciliaSway: 0,
    ciliaOrder: 0,
    ciliaSwitch: "lateral",
    ciliaReverse: false,
  },
  0.05,
  () => 0,
);
check(polarRest.omega < -1.2, "a real run still tumbles off its leftover speed");

if (failed > 0) throw new Error(`${failed} flagellum site checks failed`);
console.log("flagellum site checks passed");
