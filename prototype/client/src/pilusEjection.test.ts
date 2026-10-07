import {
  initialPilusEjection,
  pilusFragmentAlpha,
  stepPilusEjection,
  PILUS_BURST_MAX,
  PILUS_EMIT_INTERVAL,
  PILUS_EMIT_JITTER,
  PILUS_FRAGMENT_DRAG,
  PILUS_FRAGMENT_LIFE,
  PILUS_FRAGMENT_SPEED,
  PILUS_FRAGMENT_LENGTH_SCATTER,
  PILUS_FRAGMENT_LENGTH_SPREAD_MAX,
  PILUS_FRAGMENT_SPIN_DEGREES,
  PILUS_RECOIL_IMPULSE,
  PILUS_SPAWN_CLEARANCE,
  type PilusEmitter,
} from "./pilusEjection";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function near(actual: number, expected: number, epsilon = 1e-9): boolean {
  return Math.abs(actual - expected) < epsilon;
}

/**
 * Fixed draws in order: burst size, then per fragment (line offset, spin,
 * length), then interval jitter. Unset draws read 0.5, which is a burst of 3.
 */
const queue = (draws: number[]): (() => number) => {
  let index = 0;
  return () => draws[index++] ?? 0.5;
};

const center = (): number => 0.5;
const emitter = (overrides: Partial<PilusEmitter> = {}): PilusEmitter => ({
  x: 0,
  y: 0,
  dirX: 1,
  dirY: 0,
  span: 0.2,
  length: 0.6,
  variance: 0,
  shots: 1,
  ...overrides,
});

const fresh = initialPilusEjection();
/** Mean drawn length for the stock emitter: 0.12 + 0.6 × 0.35. */
const drawnMean = 0.12 + 0.6 * 0.35;
/** Where a mean-length fragment is born: its own length plus the clearance. */
const birth = drawnMean + PILUS_SPAWN_CLEARANCE;
const idle = stepPilusEjection(fresh, [], 0.1, center);
check(idle.state.fragments.length === 0, "no emitters fire no fragments");
check(idle.recoilX === 0 && idle.recoilY === 0, "no emitters cause no recoil");
check(fresh.fragments.length === 0, "the initial state is never mutated");
check(fresh.cooldowns.length === 0, "the initial state carries no cooldowns");

const still = stepPilusEjection(fresh, [emitter()], 0, center);
check(still.state.fragments.length === 0, "a zero-length step fires nothing");
check(still.state.cooldowns[0] === 0, "a zero-length step leaves the cooldown untouched");

// One region pointing along +x. A centered draw is a burst of 3, each held on
// the line's center, the travel axis, and the mean length.
const shot = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, center);
check(shot.state.fragments.length === 3, "a centered draw releases a burst of three");
const fragment = shot.state.fragments[0];
check(shot.state.fragments.every((item) => near(item.x, birth) && near(item.y, 0)), "the centered burst is born a needle-length out from the membrane");
check(near(fragment.vx, PILUS_FRAGMENT_SPEED) && near(fragment.vy, 0), "the fragment leaves at launch speed along the region's direction");
check(shot.state.fragments.every((item) => near(item.vx, fragment.vx) && near(item.vy, fragment.vy)), "a burst shares one travel vector");
check(near(fragment.dirX, 1) && near(fragment.dirY, 0), "the centered spin draws the fragment along its travel");
check(near(fragment.length, 0.12 + 0.6 * 0.35), "zero variance keeps the fragment at the mean length");
check(fragment.age === 0 && fragment.life === PILUS_FRAGMENT_LIFE, "the fragment is born at full life");
check(near(shot.recoilX, -3 * PILUS_RECOIL_IMPULSE) && near(shot.recoilY, 0), "each fragment in the burst adds its own recoil");
check(near(shot.state.cooldowns[0], PILUS_EMIT_INTERVAL), "the centered jitter resets the cooldown to the base interval");
check(pilusFragmentAlpha(fragment) === 1, "a fresh fragment is fully opaque");

// Burst size is an inclusive 1–4, and it does not change the interval.
const single = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0]));
check(single.state.fragments.length === 1, "the low draw releases a burst of one");
check(near(single.recoilX, -PILUS_RECOIL_IMPULSE), "a single fragment kicks once");
const full = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0.75]));
check(full.state.fragments.length === PILUS_BURST_MAX, "the high draw releases a burst of four");
check(near(full.recoilX, -PILUS_BURST_MAX * PILUS_RECOIL_IMPULSE), "four fragments kick four times");
check(near(full.state.cooldowns[0], PILUS_EMIT_INTERVAL), "a larger burst still waits the same interval");

// The emission line: a burst of one leaves a chosen point along it, spanning 2 × span.
const low = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0, 0.5, 0.5]));
check(near(low.state.fragments[0].y, -0.2), "the low draw leaves from the line's low end");
check(near(low.state.fragments[0].x, birth), "points along the line stay on the offset plane");
const high = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 1, 0.5, 0.5]));
check(near(high.state.fragments[0].y, 0.2), "the high draw leaves from the line's high end");
check(near(high.state.fragments[0].vx, PILUS_FRAGMENT_SPEED), "every point on the line travels the same direction");

// Length scatter applies to the drawn length. A centered draw stays on the mean.
// A zero-variance coat still mixes short and long needles, and full variance widens that.
const bareShort = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0.5, 0.5, 0]));
check(near(bareShort.state.fragments[0].length, drawnMean * (1 - PILUS_FRAGMENT_LENGTH_SCATTER)), "zero variance still shortens a low draw");
check(near(bareShort.state.fragments[0].x, drawnMean * (1 - PILUS_FRAGMENT_LENGTH_SCATTER) + PILUS_SPAWN_CLEARANCE), "a shorter fragment is born closer to the membrane, tail just outside it");
const bareLong = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0.5, 0.5, 1]));
check(near(bareLong.state.fragments[0].length, drawnMean * (1 + PILUS_FRAGMENT_LENGTH_SCATTER)), "zero variance still lengthens a high draw");
const short = stepPilusEjection(initialPilusEjection(), [emitter({ variance: 1 })], 0.016, queue([0, 0.5, 0.5, 0]));
check(near(short.state.fragments[0].length, drawnMean * (1 - PILUS_FRAGMENT_LENGTH_SPREAD_MAX)), "full variance shrinks a fragment to a stub");
const long = stepPilusEjection(initialPilusEjection(), [emitter({ variance: 1 })], 0.016, queue([0, 0.5, 0.5, 1]));
check(near(long.state.fragments[0].length, drawnMean * (1 + PILUS_FRAGMENT_LENGTH_SPREAD_MAX)), "full variance stretches a fragment well past the mean");
const mixed = stepPilusEjection(initialPilusEjection(), [emitter({ variance: 1 })], 0.016, queue([0.25, 0.5, 0.5, 0, 0.5, 0.5, 1]));
check(mixed.state.fragments.length === 2, "a mid-low draw releases a burst of two");
check(mixed.state.fragments[0].length < mixed.state.fragments[1].length, "fragments in one burst can take different lengths");

// The tilt stays inside a narrow cone around the travel axis, which is the
// axis of the kick. A draw of 0.75 is halfway to the limit; a draw of 1 is the limit.
const spinLimit = (PILUS_FRAGMENT_SPIN_DEGREES * Math.PI) / 180;
const spun = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0.5, 0.75, 0.5]));
const halfTilt = spinLimit * 0.5;
check(near(spun.state.fragments[0].dirX, Math.cos(halfTilt), 1e-6) && near(spun.state.fragments[0].dirY, Math.sin(halfTilt), 1e-6), "a high draw tilts the fragment halfway to the limit");
check(near(spun.state.fragments[0].vx, PILUS_FRAGMENT_SPEED), "the tilt turns the drawing, never the travel");
const extreme = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0.5, 1, 0.5]));
check(near(extreme.state.fragments[0].dirX, Math.cos(spinLimit), 1e-6) && near(extreme.state.fragments[0].dirY, Math.sin(spinLimit), 1e-6), "the extreme draw sits on the tilt limit");
check(extreme.state.fragments[0].dirX > 0.7, "the extreme draw still points mostly along the force axis");

// Two regions past their cooldowns each release a centered burst.
const ready2 = { cooldowns: [0, 0], fragments: [] };
const volley = stepPilusEjection(ready2, [emitter(), emitter()], 0.016, center);
check(volley.state.fragments.length === 6, "two ready regions fire two bursts");
check(near(volley.recoilX, -6 * PILUS_RECOIL_IMPULSE), "both bursts sum their recoil");

// More pili on a region fire proportionally more often.
const busy = stepPilusEjection(initialPilusEjection(), [emitter({ shots: 4 })], 0.016, center);
check(near(busy.state.cooldowns[0], PILUS_EMIT_INTERVAL / 4), "four pili on a region quarter the interval");

// A resized region set staggers its cooldowns so only the first region fires now.
const staggered = stepPilusEjection(initialPilusEjection(), [emitter(), emitter(), emitter(), emitter()], 0.016, center);
check(staggered.state.fragments.length === 3, "a fresh staggered coat fires one region's burst at a time");
check(near(staggered.state.cooldowns[1], (PILUS_EMIT_INTERVAL * 1) / 4 - 0.016), "the second region waits a quarter interval");
check(near(staggered.state.cooldowns[3], (PILUS_EMIT_INTERVAL * 3) / 4 - 0.016), "the last region waits three quarters");

// The jitter draws the next interval off center.
const jittered = stepPilusEjection(initialPilusEjection(), [emitter()], 0.016, queue([0, 0.5, 0.5, 0.5, 0]));
check(near(jittered.state.cooldowns[0], PILUS_EMIT_INTERVAL * (1 - PILUS_EMIT_JITTER)), "the low draw shortens the next interval");

// Flight: exponential drag on velocity, average-velocity travel, fixed orientation.
const coastStart = initialPilusEjection();
const fired = stepPilusEjection(coastStart, [emitter()], 0.016, center);
const coast = stepPilusEjection(fired.state, [], 0.5, center);
check(coast.state.fragments.length === 3, "a burst younger than its life stays in flight");
const moved = coast.state.fragments[0];
const decay = Math.exp(-PILUS_FRAGMENT_DRAG * 0.5);
check(near(moved.vx, PILUS_FRAGMENT_SPEED * decay), "water drag decays the fragment velocity");
check(near(moved.x, fired.state.fragments[0].x + ((PILUS_FRAGMENT_SPEED + PILUS_FRAGMENT_SPEED * decay) / 2) * 0.5), "the fragment travels at its average velocity from its birth offset");
check(near(moved.dirX, 1) && near(moved.dirY, 0), "drag never turns a fragment");
check(near(moved.age, 0.5), "the fragment ages by the stepped time");

// Death: the step that carries age past the life culls the fragment.
let dying = initialPilusEjection();
dying = stepPilusEjection(dying, [emitter()], 0.016, center).state;
dying = stepPilusEjection(dying, [], PILUS_FRAGMENT_LIFE, center).state;
check(dying.fragments.length === 0, "a fragment that reaches its life dies");

// The fade: full over the hold, then a straight slide to zero.
const fading = fired.state.fragments[0];
const hold = fading.life * 0.4;
const midFade = { ...fading, age: hold + (fading.life - hold) / 2 };
check(pilusFragmentAlpha({ ...fading, age: hold }) === 1, "the fragment holds full opacity through the hold");
check(near(pilusFragmentAlpha(midFade), 0.5), "the fragment is half faded at the middle of its fade");
check(pilusFragmentAlpha({ ...fading, age: fading.life }) === 0, "the fragment fades to nothing at the end of its life");

if (failed > 0) throw new Error(`${failed} pilus ejection checks failed`);
console.log("pilus ejection checks passed");