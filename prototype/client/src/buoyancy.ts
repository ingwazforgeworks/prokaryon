import { pressureAt } from "./pressure";

/** Fastest rise from buoyin, in world units per second. */
export const MAX_RISE_SPEED = 6;
/** Fastest sink from ballastin. Sinking outruns rising. */
export const MAX_SINK_SPEED = 12;
/** Pressure band over which a rate eases to zero at its line. */
const EASE = 0.008;

/**
 * Vertical drift from the buoyin and ballastin sliders. Positive rises.
 * Each slider is a rate, and it only acts on one side of its pressure line.
 * Ballastin sinks while pressure is below the slider, which is above that
 * depth. Buoyin rises while pressure is above `1 - buoyin`, which is below
 * that depth. Zero on both holds still. Full ballastin and no buoyin sinks
 * anywhere above the bottom. The opposite rises anywhere below the surface.
 * The result adds to the cilia and flagella velocity for that move, and it
 * is not kept as swim momentum after the drift changes.
 */
export function buoyancyVelocity(y: number, buoyin: number, ballastin: number): number {
  const up = clamp01(buoyin);
  const down = clamp01(ballastin);
  const pressure = pressureAt(y);
  const sink = gatedRate(down - pressure, down * MAX_SINK_SPEED);
  const rise = gatedRate(pressure - (1 - up), up * MAX_RISE_SPEED);
  return rise - sink;
}

function gatedRate(past: number, rate: number): number {
  if (past <= 0 || rate <= 0) return 0;
  if (past >= EASE) return rate;
  return rate * (past / EASE);
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
