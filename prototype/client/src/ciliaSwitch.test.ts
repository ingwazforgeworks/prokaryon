import { ciliaPlacements, ciliaStrokeSign, longAxisSide, longAxisT } from "./shape";
import { stepSwim, type SwimBody, type SwimState } from "./swim";
import type { CiliaSwitch } from "./types";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const length = 2;
const width = 0.75;
const placed = ciliaPlacements(24, 1, length, width, 0);
check(placed.length === 24, "a coat is placed");

for (const cilium of placed) {
  const flank = longAxisSide(cilium.x, cilium.y, length, width, 0);
  const along = longAxisT(cilium.x, cilium.y, length, width, 0);
  check(ciliaStrokeSign(cilium.x, cilium.y, length, width, 0, "lateral") === flank, "lateral keeps the flank split");
  check(ciliaStrokeSign(cilium.x, cilium.y, length, width, 0, "antilateral") === -flank, "antilateral swaps the flanks");
  const polar = along >= 0 ? 1 : -1;
  check(ciliaStrokeSign(cilium.x, cilium.y, length, width, 0, "polar") === polar, "polar splits the poles");
  check(ciliaStrokeSign(cilium.x, cilium.y, length, width, 0, "antipolar") === -polar, "antipolar swaps the poles");
}

const curved = ciliaPlacements(16, 1, length, width, Math.PI / 3);
check(
  curved.every((cilium) => Math.abs(ciliaStrokeSign(cilium.x, cilium.y, length, width, Math.PI / 3, "polar")) === 1),
  "a crescent still has a stroke sign",
);

function rest(): SwimState {
  return { vx: 0, vy: 0, omega: 0, thrusting: false, driveX: 0, driveY: 0 };
}

function coast(site: CiliaSwitch, reverse = false): SwimState {
  const body: SwimBody = {
    length,
    width,
    bend: 0,
    angle: 0,
    antipolar: 0,
    polar: 0,
    lateral: 0,
    antilateral: 0,
    undulation: 0,
    ciliation: 32,
    ciliaLength: 1,
    ciliaSpeed: 1,
    ciliaSway: 1,
    ciliaOrder: 1,
    ciliaSwitch: site,
    ciliaReverse: reverse,
  };
  let state = rest();
  for (let i = 0; i < 40; i += 1) state = stepSwim(state, body, 0.05);
  return state;
}

function mostly(state: SwimState, axis: "x" | "y", sign: number, message: string): void {
  const along = axis === "x" ? state.vx : state.vy;
  const across = axis === "x" ? state.vy : state.vx;
  check(along * sign > 0.02 && Math.abs(across) < Math.abs(along) * 0.35 && Math.abs(state.omega) < 0.05, message);
}

const lateral = coast("lateral");
mostly(lateral, "x", -1, `lateral switch swims antipolar (${lateral.vx.toFixed(3)}, ${lateral.vy.toFixed(3)})`);
const antilateral = coast("antilateral");
mostly(antilateral, "x", 1, `antilateral switch swims polar (${antilateral.vx.toFixed(3)}, ${antilateral.vy.toFixed(3)})`);
const polar = coast("polar");
mostly(polar, "y", 1, `polar switch swims lateral (${polar.vx.toFixed(3)}, ${polar.vy.toFixed(3)})`);
const antipolar = coast("antipolar");
mostly(antipolar, "y", -1, `antipolar switch swims antilateral (${antipolar.vx.toFixed(3)}, ${antipolar.vy.toFixed(3)})`);
const reversed = coast("lateral", true);
mostly(reversed, "x", 1, `reversal turns the lateral stroke around (${reversed.vx.toFixed(3)}, ${reversed.vy.toFixed(3)})`);

if (failed > 0) throw new Error(`${failed} cilia switch checks failed`);
console.log("cilia switch checks passed");
