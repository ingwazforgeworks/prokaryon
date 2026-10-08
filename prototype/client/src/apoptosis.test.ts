import {
  APOPTOSIS_COLLAPSE_SECONDS,
  APOPTOSIS_FADE_SECONDS,
  APOPTOSIS_HOLD_SECONDS,
  apoptosisSuccessor,
  bodyCollapse,
  burstAlpha,
  burstSettled,
  spawnBurst,
  stepBurst,
  volumeLost,
} from "./apoptosis";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const origin = {
  x: 2,
  y: -4,
  angle: 0.4,
  length: 1.4,
  width: 0.7,
  fill: [0.4, 0.5, 0.3] as const,
  rim: [0.05, 0.05, 0.05] as const,
  seed: 9,
};

const fadeStart = APOPTOSIS_COLLAPSE_SECONDS + APOPTOSIS_HOLD_SECONDS;
const done = fadeStart + APOPTOSIS_FADE_SECONDS;

const burst = spawnBurst(origin, 4);
const opened = bodyCollapse(burst);
check(opened !== null && Math.abs(opened.length - 1) < 1e-6, "the body starts at its own size");
check(opened !== null && Math.abs(opened.x - origin.x) < 1e-6, "the body starts on its own center");

const localX = Math.cos(origin.angle) * (burst.holeX - origin.x) + Math.sin(origin.angle) * (burst.holeY - origin.y);
const localY = -Math.sin(origin.angle) * (burst.holeX - origin.x) + Math.cos(origin.angle) * (burst.holeY - origin.y);
const outline = Math.hypot(localX / (origin.length * 0.5), localY / (origin.width * 0.5));
check(Math.abs(outline - 1) < 0.02, "the hole sits on the membrane");

check(burst.pieces.length > 0 && burst.pieces.every((piece) => piece.kind === "chip"), "the puncture throws debris at once");
check(
  burst.pieces.every((piece) => piece.sides >= 3 && piece.sides <= 6),
  "debris is an angular polygon",
);
check(
  burst.pieces.every((piece) => Math.hypot(piece.x - burst.holeX, piece.y - burst.holeY) < origin.width),
  "debris leaves from the hole",
);
const bodySpan = Math.max(origin.length, origin.width);
check(
  burst.pieces.every((piece) => Math.max(piece.rx, piece.ry) * 2 <= bodySpan * 0.34),
  "scraps stay shorter than a third of the cell",
);
const chipSpeeds = burst.pieces.map((piece) => Math.hypot(piece.vx, piece.vy));
const chipAngles = burst.pieces.map((piece) => Math.atan2(piece.vy, piece.vx));
const chipCoasts = burst.pieces.map((piece) => Math.hypot(piece.vx, piece.vy) / piece.drag);
const span = (values: number[]): number => Math.max(...values) - Math.min(...values);
check(span(chipSpeeds) > 0.4, "each scrap leaves at its own speed");
check(span(chipAngles) > 0.2, "each scrap leaves at its own angle");
check(
  chipCoasts.every((coast) => coast >= origin.length * 0.5 - 1e-6 && coast <= origin.length * 3 + 1e-6),
  "each scrap coasts between half a body length and three",
);

const speeds = burst.pieces.map((piece) => Math.hypot(piece.vx, piece.vy));
const drags = burst.pieces.map((piece) => piece.drag);
const starts = burst.pieces.map((piece) => ({ x: piece.x, y: piece.y }));
stepBurst(burst, 0.08);
check(
  burst.pieces.some((piece, index) => {
    const start = starts[index];
    return start !== undefined && Math.hypot(piece.x - start.x, piece.y - start.y) > 0.02;
  }),
  "debris slides out of the hole",
);
const kept = burst.pieces.map((piece, index) => Math.hypot(piece.vx, piece.vy) / (speeds[index] ?? 1));
const heaviest = drags.indexOf(Math.max(...drags));
const lightest = drags.indexOf(Math.min(...drags));
check((kept[heaviest] ?? 1) < (kept[lightest] ?? 0), "heavier water drag stops a scrap sooner");

const mid = bodyCollapse(burst);
check(mid !== null && mid.length < 1 && mid.length > 0.7, "the hull shrinks while debris is leaving");
check(mid !== null && mid.width < mid.length && mid.width > 0.66, "the width shrinks by the same share");
check(mid !== null && mid.x === origin.x && mid.y === origin.y, "the hull stays where the cell was");
const finished = volumeLost(APOPTOSIS_COLLAPSE_SECONDS);
check(Math.abs(1 - 0.3 * finished - 0.7) < 1e-6, "length falls by half of the old deflation");
check(Math.abs(1 - 0.336 * finished - 0.664) < 1e-6, "width falls by half of the old deflation");
check(mid !== null && mid.shrivel < -0.5, "the membrane caves in while debris is leaving");
const early = volumeLost(0.08);
const later = volumeLost(0.16) - volumeLost(0.08);
check(early > later, "volume leaves quickly at first, then more slowly");
check(volumeLost(0) === 0, "the cell is full when the hole opens");
check(volumeLost(APOPTOSIS_COLLAPSE_SECONDS) > 0.98, "the volume is gone by the time the cell tears");

const during = burst.pieces.length;
stepBurst(burst, 0.2);
check(burst.pieces.length > during, "more debris follows the first squirt");
stepBurst(burst, APOPTOSIS_COLLAPSE_SECONDS);
check(bodyCollapse(burst) === null, "the body is gone once it finishes collapsing");
check(burst.pieces.some((piece) => piece.kind === "shard"), "the collapsed cell breaks into shards");
const luma = (color: readonly [number, number, number]): number => color[0] * 0.3 + color[1] * 0.59 + color[2] * 0.11;
const bodyLuma = luma(origin.fill);
check(
  burst.pieces.every((piece) => luma(piece.fill) > bodyLuma * 0.55),
  "scraps stay bright enough to see against the water",
);
check(
  burst.pieces.filter((piece) => piece.kind === "shard").every((piece) => piece.sides >= 3 && piece.sides <= 6),
  "shards are angular",
);

check(burstAlpha(0) === 1, "the squirt is visible immediately");
check(burstAlpha(fadeStart - 0.01) === 1, "debris and shards stay opaque for five seconds");
check(Math.abs(burstAlpha(fadeStart + APOPTOSIS_FADE_SECONDS * 0.5) - 0.5) < 1e-6, "everything fades together");
check(burstAlpha(done) === 0, "nothing is left when the fade ends");
check(burstSettled(done - 0.05) === false, "the cell is still dying during the fade");
check(burstSettled(done) === true, "the cell is dead once the fade ends");

check(apoptosisSuccessor([1], 1) === null, "the last cell has no successor");
check(apoptosisSuccessor([1, 2, 3], 1) === 2, "death hands off to the next cell");
check(apoptosisSuccessor([1, 2, 3], 3) === 2, "the last listing hands off to the cell before it");

if (failed > 0) throw new Error(`${failed} apoptosis checks failed`);
console.log("apoptosis checks passed");
