/**
 * Cell integrity, from 1 (whole) to 0 (dead). Three stressors wear it down:
 * hot water, a deep osmotic shrivel, and an empty ATP pool that upkeep keeps
 * draining. Each has a severity from 0 to 1, and a full severity kills an
 * unhurt cell in that stressor's own time. Stressors that overlap add up.
 * Once nothing is doing damage, the cell mends back to whole.
 *
 * Swelling in thin water is not lethal: the wall holds turgor, and a cell
 * without aquaporin sits fully taut in ordinary open water.
 */

export type StressCause = "heat" | "osmotic" | "starvation";

export const STRESS_CAUSES: readonly StressCause[] = ["heat", "osmotic", "starvation"];

/** Water above this temperature starts to denature the cell, in °C. Sunlit water peaks at 60. */
export const HEAT_ONSET = 62;
/** Water at or above this temperature is fully lethal, in °C. Vents hold near 110. */
export const HEAT_LETHAL = 100;
/** Shrivel past this osmotic stress starts to tear the membrane from the wall. */
export const SHRIVEL_ONSET = 0.35;
/** ATP below this counts as an empty pool. */
export const ATP_EMPTY = 0.5;
/** ATP below this reads as running low, and the cytoplasm starts to pale. */
export const ATP_LOW = 100;

/** Seconds from whole to dead at full severity, per stressor. */
export const SECONDS_TO_DEATH: Readonly<Record<StressCause, number>> = {
  heat: 20,
  osmotic: 30,
  starvation: 45,
};
/** Seconds to mend from 0 back to whole once nothing is doing damage. */
export const RECOVERY_SECONDS = 60;
/** Visible stress eases toward its severity at this rate, so a half-second heat tick does not flicker. */
const SHOWN_RATE = 3;

export type StressLevels = Record<StressCause, number>;

export type CellVitals = {
  integrity: number;
  /** Severity per stressor as of the last step, 0 to 1. */
  stress: StressLevels;
  /** Eased copy of `stress` for the body visuals. */
  shown: StressLevels;
  /** The stressor doing the most damage, or the last one that did while the cell mends. Null once whole. */
  cause: StressCause | null;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

export function noStress(): StressLevels {
  return { heat: 0, osmotic: 0, starvation: 0 };
}

export function createVitals(): CellVitals {
  return { integrity: 1, stress: noStress(), shown: noStress(), cause: null };
}

export function copyVitals(vitals: CellVitals): CellVitals {
  return {
    integrity: vitals.integrity,
    stress: { ...vitals.stress },
    shown: { ...vitals.shown },
    cause: vitals.cause,
  };
}

/** 0 at the onset temperature, 1 at the lethal one. Unknown water is harmless. */
export function heatSeverity(celsius: number | null): number {
  if (celsius === null || !Number.isFinite(celsius)) return 0;
  return clamp01((celsius - HEAT_ONSET) / (HEAT_LETHAL - HEAT_ONSET));
}

/** 0 until the shrivel passes the onset, 1 at a full shrivel. Turgor does no damage. */
export function osmoticSeverity(stress: number): number {
  if (!Number.isFinite(stress)) return 0;
  return clamp01((-stress - SHRIVEL_ONSET) / (1 - SHRIVEL_ONSET));
}

/**
 * 0 while any ATP is left. With the pool empty, the share of upkeep that
 * production fails to cover: none covered is 1, half covered is 0.5.
 */
export function starvationSeverity(atp: number, netRate: number, upkeep: number): number {
  if (!(atp < ATP_EMPTY) || !(upkeep > 0)) return 0;
  return clamp01(-netRate / upkeep);
}

/** Motors need ATP. An empty pool leaves flagella and cilia still. */
export function motorsStalled(atp: number): boolean {
  return atp < ATP_EMPTY;
}

/**
 * How washed out the cytoplasm looks, 0 to 1. A low pool pales it partway,
 * and real starvation takes it the rest of the way.
 */
export function starvationPallor(atp: number, shownStarvation: number): number {
  const low = Number.isFinite(atp) ? clamp01(1 - atp / ATP_LOW) : 0;
  return Math.max(low * 0.55, clamp01(shownStarvation));
}

/**
 * Cytoplasm tint for a starving cell: drained of color and dimmed, so even
 * the neutral gray body reads as hollow. Pallor 0 leaves the tint alone.
 */
export function starvedTint(tint: readonly [number, number, number], pallor: number): [number, number, number] {
  const p = clamp01(pallor);
  const luma = tint[0] * 0.3 + tint[1] * 0.59 + tint[2] * 0.11;
  const dim = 1 - 0.4 * p;
  return [
    (tint[0] + (luma - tint[0]) * p) * dim,
    (tint[1] + (luma - tint[1]) * p) * dim,
    (tint[2] + (luma - tint[2]) * p) * dim,
  ];
}

/** Integrity lost per second at these severities. */
export function damageRate(levels: StressLevels): number {
  let rate = 0;
  for (const cause of STRESS_CAUSES) rate += clamp01(levels[cause]) / SECONDS_TO_DEATH[cause];
  return rate;
}

/** The stressor doing the most damage. Null when nothing is. */
export function worstCause(levels: StressLevels): StressCause | null {
  let worst: StressCause | null = null;
  let most = 0;
  for (const cause of STRESS_CAUSES) {
    const rate = clamp01(levels[cause]) / SECONDS_TO_DEATH[cause];
    if (rate > most) {
      most = rate;
      worst = cause;
    }
  }
  return worst;
}

/** Advance integrity by dt seconds under these severities. */
export function stepVitals(vitals: CellVitals, levels: StressLevels, dt: number): void {
  for (const cause of STRESS_CAUSES) vitals.stress[cause] = clamp01(levels[cause]);
  if (!(dt > 0) || !Number.isFinite(dt)) return;
  const ease = 1 - Math.exp(-SHOWN_RATE * dt);
  for (const cause of STRESS_CAUSES) vitals.shown[cause] += (vitals.stress[cause] - vitals.shown[cause]) * ease;
  const rate = damageRate(vitals.stress);
  if (rate > 0) {
    vitals.integrity = clamp01(vitals.integrity - rate * dt);
    vitals.cause = worstCause(vitals.stress);
    return;
  }
  vitals.integrity = clamp01(vitals.integrity + dt / RECOVERY_SECONDS);
  if (vitals.integrity >= 1) vitals.cause = null;
}

export function vitalsDead(vitals: CellVitals): boolean {
  return vitals.integrity <= 0;
}
