/**
 * Overdamped swimming. Flagella push the cell, and cilia add a weaker push
 * along the line where their power stroke switches. The two add as vectors, so a coat can reinforce a
 * pole or cancel it. Linear hydrodynamic drag sets the speed that push can
 * sustain, and how quickly the cell stops. With no thrust the heading is no
 * longer held, so spin coasts and a moving cell tumbles until thrust returns.
 * Tufts on opposite sites can cancel that run, and a counterclockwise burst
 * builds none, so the motors stopping still draw a random coast.
 */

import { filamentsForFlagellin } from "./flagellum";
import { capsuleArea, ciliaPlacements, ciliaStrokeSign, flagellarAxisLocal, flagellarBodyLength, flagellumSiteAnchor, type FlagellumSite } from "./shape";
import type { CiliaSwitch } from "./types";

/**
 * Flagellar swim/rest clock. 0 never starts a swim. 1 never rests.
 * In between, the on interval is `0.5 + 5p` seconds and the off interval is
 * the same function of `1 - p`, so 0.1 is 1s on and 5s off, and 0.9 swaps them.
 * A per-cell scale stretches both intervals by the same amount, so the duty
 * set by the slider stays put while each cell keeps its own period.
 */
export interface FlagellarPulseState {
  swimming: boolean;
  elapsed: number;
  pulse: number;
}

/** How far a newborn's swim and rest intervals may sit from the slider. */
export const PULSE_SCALE_MIN = 0.75;
export const PULSE_SCALE_MAX = 1.25;

export function randomPulseScale(randomUnit: () => number = Math.random): number {
  const unit = Math.min(1, Math.max(0, randomUnit()));
  return PULSE_SCALE_MIN + (PULSE_SCALE_MAX - PULSE_SCALE_MIN) * unit;
}

export function flagellarPulseSpan(pulse: number, scale = 1): { on: number; off: number } {
  const factor = Math.min(2, Math.max(0.5, scale));
  const on = (0.5 + 5 * pulse) * factor;
  return { on, off: (0.5 + 5 * (1 - pulse)) * factor };
}

/**
 * A daughter does not inherit the parent's place in the swim/rest cycle.
 * The duty matches the slider. The phase is private, measured on this cell's own period.
 */
export function independentPulseState(
  pulse: number,
  scale = 1,
  randomUnit: () => number = Math.random,
): FlagellarPulseState {
  const next = Math.min(1, Math.max(0, pulse));
  if (next <= 0) return { swimming: false, elapsed: 0, pulse: 0 };
  if (next >= 1) return { swimming: true, elapsed: 0, pulse: 1 };
  const span = flagellarPulseSpan(next, scale);
  const mark = Math.min(1, Math.max(0, randomUnit())) * (span.on + span.off);
  if (mark < span.on) return { swimming: true, elapsed: mark, pulse: next };
  return { swimming: false, elapsed: mark - span.on, pulse: next };
}

export function flagellarPulseLabel(pulse: number): string {
  if (pulse <= 0) return "Off";
  if (pulse >= 1) return "On";
  const span = flagellarPulseSpan(pulse);
  return `${span.on.toFixed(1)}s/${span.off.toFixed(1)}s`;
}

export function stepFlagellarPulse(
  state: FlagellarPulseState,
  pulse: number,
  dt: number,
  scale = 1,
): FlagellarPulseState {
  const next = Math.min(1, Math.max(0, pulse));
  if (next <= 0) return { swimming: false, elapsed: 0, pulse: 0 };
  if (next >= 1) return { swimming: true, elapsed: 0, pulse: 1 };
  const entered = state.pulse <= 0 || state.pulse >= 1;
  let swimming = entered ? true : state.swimming;
  let elapsed = entered ? 0 : state.elapsed;
  elapsed += Math.max(dt, 0);
  const span = flagellarPulseSpan(next, scale);
  for (let guard = 0; guard < 8; guard += 1) {
    const limit = swimming ? span.on : span.off;
    if (elapsed < limit) break;
    elapsed -= limit;
    swimming = !swimming;
  }
  return { swimming, elapsed, pulse: next };
}

export interface FlagellarSwitchState {
  /** Sense of the swim burst underway. True is the normal clockwise whip. */
  clockwise: boolean;
  /** Sense the next swim burst will take while switching is enabled. */
  nextClockwise: boolean;
  /** +1 or -1, the cell spin held for a counterclockwise burst. */
  tumbleSign: number;
  /** Angular velocity of the tumble, rad/s. Same sign for the whole burst. */
  tumbleOmega: number;
}

/** How fast tumble spin bleeds off, 1/seconds. Most of the turn lands inside a second. */
export const TUMBLE_DRAG = 2.7;
const TUMBLE_ANGLE_MIN = 0.45;
const TUMBLE_ANGLE_SPAN = 2.15;

/**
 * With switching on, each new swim burst takes the opposite sense.
 * Clockwise is the normal whip. Counterclockwise picks one spin direction
 * and a random total angle, then that spin slows under friction.
 */
export function stepFlagellarSwitch(
  state: FlagellarSwitchState,
  enabled: boolean,
  wasSwimming: boolean,
  swimming: boolean,
  randomSign: () => number = () => (Math.random() < 0.5 ? -1 : 1),
  randomUnit: () => number = Math.random,
): FlagellarSwitchState {
  if (!enabled) return { ...state, clockwise: true, tumbleOmega: 0 };
  if (swimming && !wasSwimming) {
    const clockwise = state.nextClockwise;
    if (clockwise) {
      return { clockwise, nextClockwise: false, tumbleSign: state.tumbleSign, tumbleOmega: 0 };
    }
    const sign = randomSign() < 0 ? -1 : 1;
    const unit = Math.min(1, Math.max(0, randomUnit()));
    const angle = TUMBLE_ANGLE_MIN + TUMBLE_ANGLE_SPAN * unit;
    return {
      clockwise: false,
      nextClockwise: true,
      tumbleSign: sign,
      tumbleOmega: sign * angle * TUMBLE_DRAG,
    };
  }
  return state;
}

/**
 * Genome beat switching: every whip is a clockwise run, and the rest between
 * whips belongs to the tumble. When a whip ends the motors flip
 * counterclockwise and draw a tumble angle, so the cell reorients between
 * runs instead of spending whole whips tumbling. The process per beat is
 * swim, stop, tumble, swim.
 */
export function stepBeatSwitch(
  state: FlagellarSwitchState,
  enabled: boolean,
  wasWhipping: boolean,
  whipping: boolean,
  randomSign: () => number = () => (Math.random() < 0.5 ? -1 : 1),
  randomUnit: () => number = Math.random,
): FlagellarSwitchState {
  if (!enabled) return { ...state, clockwise: true, tumbleOmega: 0 };
  if (whipping && !wasWhipping) {
    return { clockwise: true, nextClockwise: false, tumbleSign: state.tumbleSign, tumbleOmega: 0 };
  }
  if (!whipping && wasWhipping) {
    const sign = randomSign() < 0 ? -1 : 1;
    const unit = Math.min(1, Math.max(0, randomUnit()));
    const angle = TUMBLE_ANGLE_MIN + TUMBLE_ANGLE_SPAN * unit;
    return {
      clockwise: false,
      nextClockwise: true,
      tumbleSign: sign,
      tumbleOmega: sign * angle * TUMBLE_DRAG,
    };
  }
  return state;
}

/**
 * Sense of the whip is private. While the slider is between off and on, a
 * swimming daughter may be born already tumbling, and the following burst is
 * its own coin flip, so a lineage does not tumble together. With the pulse
 * pinned on or off there is no burst edge to desync, and the motor stays on
 * the normal clockwise whip.
 */
export function independentSwitchState(
  pulse: number,
  swimming: boolean,
  randomUnit: () => number = Math.random,
): FlagellarSwitchState {
  const bursts = pulse > 0 && pulse < 1;
  const unit = (): number => Math.min(1, Math.max(0, randomUnit()));
  const tumble = bursts && swimming && unit() < 0.5;
  if (!tumble) {
    return {
      clockwise: true,
      nextClockwise: bursts ? unit() < 0.5 : true,
      tumbleSign: 1,
      tumbleOmega: 0,
    };
  }
  const sign = unit() < 0.5 ? -1 : 1;
  const angle = TUMBLE_ANGLE_MIN + TUMBLE_ANGLE_SPAN * unit();
  return {
    clockwise: false,
    nextClockwise: true,
    tumbleSign: sign,
    tumbleOmega: sign * angle * TUMBLE_DRAG,
  };
}

/**
 * Exact step of ω' = -drag·ω. The turned angle is the integral, so the
 * rate falls smoothly and the sign never flips.
 */
export function stepTumble(omega: number, dt: number, drag = TUMBLE_DRAG): { omega: number; delta: number } {
  const step = Math.max(dt, 0);
  if (step <= 0 || drag <= 1e-6) return { omega, delta: 0 };
  const decay = Math.exp(-Math.min(drag * step, 40));
  const next = omega * decay;
  return { omega: next, delta: (omega - next) / drag };
}

const THRUST = 2.8;
/** Per length, well under flagella. A full coat stays below one flagellar pole. */
const CILIA_THRUST = THRUST * 0.12;
const DRAG = 4;
const DENSITY = 2.1;

/**
 * Backward speed set when a flagellar pulse turns off.
 * The forward coast is replaced, so the cell actually drifts back a short way.
 */
export const RELEASE_RECOIL = 1.1;

const RELEASE_KICK_GAIN = 0.34;
const RELEASE_KICK_MAX = 1.6;
const RELEASE_SLIP = 0.08;
/** Random coast when the tufts left no run. Same ceiling as the speed kick. */
const RELEASE_COAST_MIN = 0.55;
const RELEASE_COAST_SPAN = 1.05;

function flagellarAmount(body: SwimBody): number {
  return (
    Math.max(body.antipolar, 0) +
    Math.max(body.polar, 0) +
    Math.max(body.lateral, 0) +
    Math.max(body.antilateral, 0)
  );
}

/**
 * Spin picked up as the flagella let go.
 * A moving cell tumbles off its leftover run. With nothing left to tumble off,
 * the stopping motors still draw a random coast, scaled by how much flagellin is carried.
 */
function releaseSpin(speed: number, slip: number, amount: number, randomUnit: () => number): number {
  const kick = Math.min(Math.max(speed, 0) * RELEASE_KICK_GAIN, RELEASE_KICK_MAX);
  if (kick > 0.05) {
    const sign = Math.abs(slip) > RELEASE_SLIP ? Math.sign(slip) : randomUnit() < 0.5 ? -1 : 1;
    return sign * kick;
  }
  const coverage = Math.min(1, Math.max(amount, 0));
  if (coverage <= 0.02) return 0;
  const sign = randomUnit() < 0.5 ? -1 : 1;
  const unit = Math.min(1, Math.max(0, randomUnit()));
  return sign * (RELEASE_COAST_MIN + RELEASE_COAST_SPAN * unit) * coverage;
}

export interface SwimState {
  vx: number;
  vy: number;
  omega: number;
  /** Stays set through a flagellar pulse, including a counterclockwise burst, until the motors and the cilia have both let go. */
  thrusting: boolean;
  /** Unit direction of the last flagellar push. Recoil travels against it. */
  driveX: number;
  driveY: number;
}

export interface SwimBody {
  length: number;
  width: number;
  bend: number;
  angle: number;
  antipolar: number;
  polar: number;
  lateral: number;
  antilateral: number;
  undulation: number;
  /**
   * Per-site beat strength. When present it replaces the scalar for every site
   * it names; a site it leaves out does not beat at all.
   */
  undulationBySite?: Partial<Record<FlagellumSite, number>>;
  ciliation: number;
  ciliaLength: number;
  ciliaSpeed: number;
  ciliaSway: number;
  /** 0 cancels ciliary thrust. 1 leaves the full ciliary push. */
  ciliaOrder: number;
  /** Which half keeps the resting power stroke. The opposite half mirrors it. */
  ciliaSwitch: CiliaSwitch;
  /** Flips the power stroke, and the direction that stroke pushes the cell. */
  ciliaReverse: boolean;
  /**
   * True for the whole flagellar pulse, including a counterclockwise burst
   * that produces no thrust. Holds the release until that pulse ends.
   */
  motors?: boolean;
}

export function stepSwim(
  state: SwimState,
  body: SwimBody,
  dt: number,
  randomUnit: () => number = Math.random,
): SwimState {
  const step = Math.min(Math.max(dt, 0), 0.05);
  if (step <= 0) return state;
  const flagellar = flagellarForce(body);
  const thrust = combineForce(flagellar, ciliaryForce(body));
  const axis = worldAxis(body.length, body.width, body.angle);
  const span = Math.max(body.length, body.width);
  const girth = Math.min(body.length, body.width);
  const bendScale = 1 + 0.45 * (body.bend / (Math.PI / 3));
  const bParallel = DRAG * (0.55 * span + 0.45 * girth) * bendScale;
  const bPerpendicular = DRAG * (1.15 * span + 0.45 * girth) * bendScale;
  const { mass, inertia } = rigidBody(body.length, body.width);
  const radius = 0.5 * Math.hypot(body.length, body.width);
  const drive = Math.min(1, Math.max(Math.min(Math.max(body.undulation, 0), 1), ciliaDrive(body)));
  const bSpin = bPerpendicular * radius * radius * (0.04 + 0.96 * drive);
  let omega = state.omega;
  let thrusting = state.thrusting;
  let driveX = state.driveX;
  let driveY = state.driveY;
  const flagellarMag = Math.hypot(flagellar.x, flagellar.y);
  if (flagellarMag > 1e-3) {
    driveX = flagellar.x / flagellarMag;
    driveY = flagellar.y / flagellarMag;
  }
  const motile = body.undulation > 0.02 || body.motors === true || ciliaDriving(body);
  if (thrusting && !motile) {
    thrusting = false;
    const speed = Math.hypot(state.vx, state.vy);
    const slip = axis.x * state.vy - axis.y * state.vx;
    omega += releaseSpin(speed, slip, flagellarAmount(body), randomUnit);
  } else if (motile) {
    thrusting = true;
  }

  const vParallel = state.vx * axis.x + state.vy * axis.y;
  const vPerpX = state.vx - vParallel * axis.x;
  const vPerpY = state.vy - vParallel * axis.y;
  const fParallel = thrust.x * axis.x + thrust.y * axis.y;
  const fPerpX = thrust.x - fParallel * axis.x;
  const fPerpY = thrust.y - fParallel * axis.y;
  const nextParallel = damp(vParallel, fParallel, bParallel, mass, step);
  const nextPerpX = damp(vPerpX, fPerpX, bPerpendicular, mass, step);
  const nextPerpY = damp(vPerpY, fPerpY, bPerpendicular, mass, step);
  return {
    vx: nextParallel * axis.x + nextPerpX,
    vy: nextParallel * axis.y + nextPerpY,
    omega: damp(omega, thrust.torque, bSpin, inertia, step),
    thrusting,
    driveX,
    driveY,
  };
}

function flagellarForce(body: SwimBody): { x: number; y: number; torque: number } {
  const fallback = Math.max(body.undulation, 0);
  const bySite = body.undulationBySite;
  if (fallback <= 0 && !bySite) return { x: 0, y: 0, torque: 0 };
  const reach = Math.max(flagellarBodyLength(body.length, body.width), 1e-4);
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  let x = 0;
  let y = 0;
  let torque = 0;
  const add = (amount: number, site: FlagellumSite): void => {
    const undulation = bySite ? (bySite[site] ?? 0) : fallback;
    if (undulation <= 0) return;
    for (const filament of filamentsForFlagellin(amount, reach)) {
      const anchor = flagellumSiteAnchor(body.length, body.width, body.bend, site, filament.mount);
      const rx = cos * anchor.x - sin * anchor.y;
      const ry = sin * anchor.x + cos * anchor.y;
      const ox = cos * anchor.dirX - sin * anchor.dirY;
      const oy = sin * anchor.dirX + cos * anchor.dirY;
      const push = filament.length * undulation * THRUST;
      const fx = -ox * push;
      const fy = -oy * push;
      x += fx;
      y += fy;
      torque += rx * fy - ry * fx;
    }
  };
  add(body.antipolar, "antipolar");
  add(body.polar, "polar");
  add(body.lateral, "lateral");
  add(body.antilateral, "antilateral");
  return { x, y, torque };
}

/**
 * Both halves row along the line where the stroke flips, so their pushes agree.
 * A flank switch sends the cell along the long axis: lateral toward the antipolar pole,
 * antilateral toward the polar pole. A pole switch sends it across that axis: polar toward
 * the lateral flank, antipolar toward the antilateral flank. Reversal turns every stroke
 * around. Speed, sway, and order scale the push. At zero speed or sway, the hairs produce no force.
 */
function ciliaryForce(body: SwimBody): { x: number; y: number; torque: number } {
  if (!ciliaBeating(body)) return { x: 0, y: 0, torque: 0 };
  const speed = Math.min(Math.max(body.ciliaSpeed, 0), 2);
  const sway = Math.min(Math.max(body.ciliaSway, 0), 1);
  const order = Math.min(Math.max(body.ciliaOrder, 0), 1);
  const mirror = body.ciliaReverse ? -1 : 1;
  const placed = ciliaPlacements(body.ciliation, body.ciliaLength, body.length, body.width, body.bend);
  const cos = Math.cos(body.angle);
  const sin = Math.sin(body.angle);
  let x = 0;
  let y = 0;
  let torque = 0;
  for (const cilium of placed) {
    const stroke = ciliaStrokeSign(cilium.x, cilium.y, body.length, body.width, body.bend, body.ciliaSwitch) * mirror;
    const push = cilium.length * speed * sway * order * CILIA_THRUST;
    const lx = -cilium.dirY * stroke;
    const ly = cilium.dirX * stroke;
    const fx = (cos * lx - sin * ly) * push;
    const fy = (sin * lx + cos * ly) * push;
    const rx = cos * cilium.x - sin * cilium.y;
    const ry = sin * cilium.x + cos * cilium.y;
    x += fx;
    y += fy;
    torque += rx * fy - ry * fx;
  }
  return { x, y, torque };
}

function ciliaBeating(body: SwimBody): boolean {
  return body.ciliation >= 1 && body.ciliaLength > 0.02 && body.ciliaSpeed > 0.02 && body.ciliaSway > 0.02;
}

function ciliaDriving(body: SwimBody): boolean {
  return ciliaBeating(body) && body.ciliaOrder > 0.02;
}

function ciliaDrive(body: SwimBody): number {
  if (!ciliaDriving(body)) return 0;
  const order = Math.min(Math.max(body.ciliaOrder, 0), 1);
  return (Math.min(body.ciliaSpeed, 2) / 2) * Math.min(Math.max(body.ciliaSway, 0), 1) * order;
}

function combineForce(
  a: { x: number; y: number; torque: number },
  b: { x: number; y: number; torque: number },
): { x: number; y: number; torque: number } {
  return { x: a.x + b.x, y: a.y + b.y, torque: a.torque + b.torque };
}

/**
 * Velocity implied by a resolved move. A shove back against the requested
 * direction is dropped, so contact does not reverse the cell.
 */
export function acceptedVelocity(
  requestedX: number,
  requestedY: number,
  movedX: number,
  movedY: number,
  dt: number,
): { x: number; y: number } {
  if (dt <= 1e-8) return { x: 0, y: 0 };
  let x = movedX / dt;
  let y = movedY / dt;
  const speed2 = requestedX * requestedX + requestedY * requestedY;
  if (speed2 > 1e-8) {
    const approach = x * requestedX + y * requestedY;
    if (approach < 0) {
      const reject = approach / speed2;
      x -= requestedX * reject;
      y -= requestedY * reject;
    }
  }
  return { x, y };
}

/**
 * Swim velocity plus a passive drift share one move. Drift is not momentum:
 * after contact, the stored swim velocity keeps only its share of what got through.
 * With no drift, the stored velocity is the accepted move, including a terrain pop.
 */
export function retainSwimVelocity(
  swimX: number,
  swimY: number,
  driftX: number,
  driftY: number,
  actualX: number,
  actualY: number,
): { vx: number; vy: number } {
  return {
    vx: retainAxis(swimX, driftX, actualX),
    vy: retainAxis(swimY, driftY, actualY),
  };
}

function retainAxis(swim: number, drift: number, actual: number): number {
  if (Math.abs(drift) <= 1e-8) return actual;
  const requested = swim + drift;
  if (Math.abs(requested) <= 1e-6) return swim;
  const scale = actual / requested;
  if (!(scale > 0)) return 0;
  if (scale >= 1) return swim;
  return swim * scale;
}

/**
 * Angular-velocity kick when a wall removes some of the cell's velocity.
 * `rx` and `ry` are the contact point relative to the cell center.
 */
export function collisionSpin(
  vxBefore: number,
  vyBefore: number,
  vxAfter: number,
  vyAfter: number,
  rx: number,
  ry: number,
  length: number,
  width: number,
): number {
  const { mass, inertia } = rigidBody(length, width);
  const jx = mass * (vxAfter - vxBefore);
  const jy = mass * (vyAfter - vyBefore);
  const spin = (rx * jy - ry * jx) / inertia;
  const limit = 2.5;
  return Math.min(limit, Math.max(-limit, spin));
}

function rigidBody(length: number, width: number): { mass: number; inertia: number } {
  const mass = Math.max(DENSITY * capsuleArea(length, width), 1e-4);
  const radius = 0.5 * Math.hypot(length, width);
  const inertia = Math.max(mass * radius * radius * 0.5, 1e-4);
  return { mass, inertia };
}

function worldAxis(length: number, width: number, angle: number): { x: number; y: number } {
  const axis = angle + flagellarAxisLocal(length, width);
  return { x: Math.cos(axis), y: Math.sin(axis) };
}

/** Exact step for dv/dt = force/mass - (damping/mass) v. */
function damp(velocity: number, force: number, damping: number, mass: number, dt: number): number {
  const rate = damping / mass;
  if (rate < 1e-5) return velocity + (force / mass) * dt;
  const decay = Math.exp(-Math.min(rate * dt, 40));
  return force / damping + (velocity - force / damping) * decay;
}
