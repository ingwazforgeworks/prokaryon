/**
 * Secreted pili — fragments shot out of the cell's membrane regions instead of
 * standing as spikes on it. Pure data logic with no imports on the renderer,
 * pose, or DOM so the flight rules stay testable alone. Each membrane region
 * acts as an emitter: its fragments leave random points along a line half the
 * cell's width long, all travel the region's outward direction in a parallel
 * stream, and each is drawn a little off that direction so the spray is not a
 * set of identical darts. A fragment is drawn trailing back from its head, so
 * it is born a full needle-length out from the membrane — its tail starts just
 * outside the outline instead of buried in the body. A region fires bursts of
 * one to four fragments on a
 * short, steady cadence, and each fragment's length scatters around the
 * region's mean even when the coat itself has no variance. Every fragment
 * decelerates like a bullet in water, holds, fades, and dies, and every
 * fragment kicks the cell back along the
 * region's outward direction.
 */

/** One membrane region standing in as a launch site, in world coordinates. */
export interface PilusEmitter {
  /** Center of the emission line, on the membrane region. */
  x: number;
  y: number;
  /** The region's outward direction: the line every fragment travels along. */
  dirX: number;
  dirY: number;
  /** Half the emission line's length. The line spans 2 × span across the region. */
  span: number;
  /** Mean pilus length on this region, in world units, for the fragment size. */
  length: number;
  /** 0–1. Spreads each fragment's length around the mean, the way the coat does. */
  variance: number;
  /** Pili feeding this region. More pili fire proportionally more often. */
  shots: number;
}

/** A fragment in flight, in world coordinates. */
export interface PilusFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Unit orientation the fragment is drawn at, spun randomly at launch. */
  dirX: number;
  dirY: number;
  length: number;
  age: number;
  life: number;
}

export interface PilusEjectionState {
  /** Seconds until each emitter's next shot, one per emitter. */
  cooldowns: number[];
  fragments: PilusFragment[];
}

/** Launch speed of a fresh fragment, in world units per second. */
export const PILUS_FRAGMENT_SPEED = 9;
/**
 * Exponential water drag on a fragment. Higher stops it sooner.
 * At 21 a fragment sheds most of its speed within about a fifth of a second.
 */
export const PILUS_FRAGMENT_DRAG = 21;
/** Seconds a fragment lives before it is culled. Doubled so the spray lingers. */
export const PILUS_FRAGMENT_LIFE = 1.7;
/** Share of its life a fragment holds full opacity before fading. */
export const PILUS_FRAGMENT_HOLD = 0.4;
/**
 * Seconds between bursts from one pilus on the region. Doubled from the fast
 * 0.4s cadence, so half as many fragments enter the water over time.
 */
export const PILUS_EMIT_INTERVAL = 0.8;
/**
 * Random jitter on the burst interval, as a fraction of the interval.
 * A tenth either way keeps the beat from locking to a metronome without the
 * old wide gaps.
 */
export const PILUS_EMIT_JITTER = 0.1;
/** Smallest and largest burst. Each release draws a count in this inclusive range. */
export const PILUS_BURST_MIN = 1;
export const PILUS_BURST_MAX = 4;
/** Mean burst size. The per-fragment kick is scaled by this so the average push holds. */
const PILUS_BURST_MEAN = (PILUS_BURST_MIN + PILUS_BURST_MAX) / 2;
/**
 * Half of the random tilt on a fragment's drawn orientation, in degrees off
 * the region's outward direction. That direction is the axis of the kick the
 * fragment gives the cell, so a small tilt keeps the needle nearly along it.
 */
export const PILUS_FRAGMENT_SPIN_DEGREES = 40;
/**
 * World units of open water between the membrane and a newborn fragment's
 * tail. The rest of the birth offset is the fragment's own drawn length, so
 * the needle appears whole, just outside the body.
 */
export const PILUS_SPAWN_CLEARANCE = 0.05;
/**
 * Swim velocity, in world units per second, kicked back per fragment.
 * The burst mean and the factor of 5 are the earlier kick, and the interval
 * ratio keeps the average push constant whenever the emission rate changes.
 */
const PILUS_EMIT_INTERVAL_WAS = 0.9;
export const PILUS_RECOIL_IMPULSE = (2.2 / PILUS_BURST_MEAN / 5) * (PILUS_EMIT_INTERVAL / PILUS_EMIT_INTERVAL_WAS);

export function initialPilusEjection(): PilusEjectionState {
  return { cooldowns: [], fragments: [] };
}

/** A fragment's drawn opacity: full over the hold, then a straight fade to zero. */
export function pilusFragmentAlpha(fragment: PilusFragment): number {
  const hold = fragment.life * PILUS_FRAGMENT_HOLD;
  if (fragment.age <= hold) return 1;
  const fade = Math.max(fragment.life - hold, 1e-6);
  return clamp01(1 - (fragment.age - hold) / fade);
}

/** Fragment length scales with the pilus it was shed from. */
function fragmentLengthFor(pilusLength: number): number {
  return Math.min(0.6, 0.12 + pilusLength * 0.35);
}

/**
 * How far a fragment's drawn length can stray from the coat mean when the coat
 * variance is zero. Coat variance widens it further, up to {@link PILUS_FRAGMENT_LENGTH_SPREAD_MAX}.
 */
export const PILUS_FRAGMENT_LENGTH_SCATTER = 0.55;
/** Widest relative scatter on a drawn fragment, at full coat variance. */
export const PILUS_FRAGMENT_LENGTH_SPREAD_MAX = 0.85;

/**
 * One fragment's drawn length. Scatter applies on the drawn length itself, so
 * a zero-variance coat still mixes short and long needles, and full variance
 * runs from a stub to nearly twice the mean.
 */
function variedFragmentLength(mean: number, variance: number, unit: number): number {
  const base = fragmentLengthFor(mean);
  const spread = Math.min(PILUS_FRAGMENT_LENGTH_SPREAD_MAX, PILUS_FRAGMENT_LENGTH_SCATTER + clamp01(variance) * 0.35);
  const scale = 1 + (unit * 2 - 1) * spread;
  return Math.max(0.04, base * scale);
}

/** Inclusive burst count from one uniform draw. */
function burstCount(unit: number): number {
  const span = PILUS_BURST_MAX - PILUS_BURST_MIN + 1;
  return PILUS_BURST_MIN + Math.min(span - 1, Math.floor(unit * span));
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Advance the ejection by dt. A region whose cooldown runs out releases a
 * burst of one to four fragments. Each leaves a random point on the emission
 * line, travels the region's outward direction, and takes its own length.
 * The cooldown is the time until the next burst, with only a little jitter, and
 * more pili on the region shorten it proportionally. A resized region set
 * staggers the cooldowns so a full coat fires in a spread ripple instead of
 * one synchronized volley. Live
 * fragments decelerate under drag, advance, age, and die at the end of their
 * life. The recoil is the swim-velocity kick the emitted fragments owe the
 * cell this step, opposite their travel.
 */
export function stepPilusEjection(
  state: PilusEjectionState,
  emitters: readonly PilusEmitter[],
  dt: number,
  rng: () => number = Math.random,
): { state: PilusEjectionState; recoilX: number; recoilY: number } {
  const count = emitters.length;
  const step = Math.max(dt, 0);
  const intervalFor = (emitter: PilusEmitter): number => PILUS_EMIT_INTERVAL / Math.max(1, emitter.shots);
  const cooldowns =
    state.cooldowns.length === count
      ? state.cooldowns.slice()
      : emitters.map((emitter, index) => (intervalFor(emitter) * index) / Math.max(count, 1));
  const fragments: PilusFragment[] = [];
  let recoilX = 0;
  let recoilY = 0;
  const spin = (PILUS_FRAGMENT_SPIN_DEGREES * Math.PI) / 180;
  for (let index = 0; index < count; index += 1) {
    const emitter = emitters[index];
    let cooldown = cooldowns[index] - step;
    if (cooldown <= 0 && step > 0) {
      // One burst per interval. Each fragment picks its own point on the line,
      // its own spin, and its own length, then is born that length out from the
      // membrane so it never overlaps the body, and kicks back on its own.
      const burst = burstCount(rng());
      for (let n = 0; n < burst; n += 1) {
        const along = (rng() * 2 - 1) * emitter.span;
        const tilt = (rng() * 2 - 1) * spin;
        const length = variedFragmentLength(emitter.length, emitter.variance, rng());
        const cos = Math.cos(tilt);
        const sin = Math.sin(tilt);
        const birth = length + PILUS_SPAWN_CLEARANCE;
        fragments.push({
          x: emitter.x + emitter.dirX * birth - emitter.dirY * along,
          y: emitter.y + emitter.dirY * birth + emitter.dirX * along,
          vx: emitter.dirX * PILUS_FRAGMENT_SPEED,
          vy: emitter.dirY * PILUS_FRAGMENT_SPEED,
          dirX: emitter.dirX * cos - emitter.dirY * sin,
          dirY: emitter.dirX * sin + emitter.dirY * cos,
          length,
          age: 0,
          life: PILUS_FRAGMENT_LIFE,
        });
        recoilX -= emitter.dirX * PILUS_RECOIL_IMPULSE;
        recoilY -= emitter.dirY * PILUS_RECOIL_IMPULSE;
      }
      cooldown = intervalFor(emitter) * (1 + (rng() * 2 - 1) * PILUS_EMIT_JITTER);
    }
    cooldowns[index] = cooldown;
  }
  const decay = Math.exp(-Math.min(PILUS_FRAGMENT_DRAG * step, 40));
  for (const fragment of state.fragments) {
    const age = fragment.age + step;
    if (age >= fragment.life) continue;
    const vx = fragment.vx * decay;
    const vy = fragment.vy * decay;
    fragments.push({
      x: fragment.x + ((fragment.vx + vx) / 2) * step,
      y: fragment.y + ((fragment.vy + vy) / 2) * step,
      vx,
      vy,
      dirX: fragment.dirX,
      dirY: fragment.dirY,
      length: fragment.length,
      age,
      life: fragment.life,
    });
  }
  return { state: { cooldowns, fragments }, recoilX, recoilY };
}