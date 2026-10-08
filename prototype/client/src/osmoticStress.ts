/**
 * Osmotic stress from the osmolyn in the water. Stress runs from -1 (shriveled,
 * water leaving) to +1 (taut, water pushing in). Water richer than the neutral
 * mark pulls toward -1 in proportion to that excess. Water poorer than the
 * mark pulls toward +1 in proportion to the shortage.
 *
 * Osmoprotectin limits how far that pull goes. Two hyperexpressed constructs
 * settle at a 0.1% shrivel and stay there, and further copies do not erase that
 * last sliver. Thin water is unchanged, and the gene's only price there is the
 * usual cost of expressing it. Aquaporin in thin water equilibrates that
 * stress: no channel settles at +1, a full channel settles at 0, and a partial
 * channel settles in between. In rich water the channel does the opposite of
 * osmoprotectin and deepens the shrivel.
 */

import { osmolynDamageScale } from "./osmoprotectin";

/** Field fraction where the two pulls balance. A saturated plume is 1. */
export const OSMOTIC_NEUTRAL = 0.5;

/** Stress units per second at a full excess or a full shortage, with no genes. */
export const OSMOTIC_RATE = 0.35;

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function clampStress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= -1) return -1;
  if (value >= 1) return 1;
  return value;
}

/**
 * How far rich water pulls toward -1, as a fraction of a full shrivel.
 * Osmoprotectin brings that down to 0.1% once two hyperexpressed constructs are
 * present. Aquaporin multiplies whatever remains, so a fully open channel
 * doubles the leftover shrivel.
 */
export function osmoticShrinkFactor(osmoprotectin: number, aquaporin: number): number {
  return osmolynDamageScale(osmoprotectin) * (1 + clamp01(aquaporin));
}

/**
 * Where thin water leaves osmotic stress. No channel settles at full turgor.
 * A full channel equilibrates at 0. Expression in between settles on the way.
 */
export function osmoticSwellTarget(aquaporin: number): number {
  return Math.max(0, 1 - clamp01(aquaporin));
}

/**
 * Advance osmotic stress by dt seconds. Concentration is the field fraction
 * at the cell, 0 to 1. Aquaporin is expression from 0 to 1. Osmoprotectin
 * stacks, and two hyperexpressed constructs saturate its shield.
 */
export function stepOsmoticStress(
  stress: number,
  concentration: number,
  osmoprotectin: number,
  aquaporin: number,
  dt: number,
): number {
  const held = clampStress(stress);
  if (!(dt > 0) || !Number.isFinite(dt) || !Number.isFinite(concentration)) return held;
  const water = clamp01(concentration);
  const excess = water > OSMOTIC_NEUTRAL ? (water - OSMOTIC_NEUTRAL) / (1 - OSMOTIC_NEUTRAL) : 0;
  const deficit = water < OSMOTIC_NEUTRAL ? (OSMOTIC_NEUTRAL - water) / OSMOTIC_NEUTRAL : 0;
  const shrinkTarget = -excess * osmoticShrinkFactor(osmoprotectin, aquaporin);
  const shrink = excess > 0 ? OSMOTIC_RATE * (shrinkTarget - held) : 0;
  const target = osmoticSwellTarget(aquaporin);
  const swell = OSMOTIC_RATE * deficit * (target - held);
  return clampStress(held + (shrink + swell) * dt);
}
