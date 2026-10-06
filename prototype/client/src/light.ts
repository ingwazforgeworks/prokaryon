/** Sun tilt in the screen plane, leaned 20° toward the camera for volume. */

export const SUN_MIN = -90;
export const SUN_MAX = 90;
/** Set, night, and rise each last this long. */
export const SUN_LEG_SECONDS = 5 * 60;
/** One day: afternoon, night, then morning. */
export const SUN_DAY_SECONDS = SUN_LEG_SECONDS * 3;
/** Real seconds in one hour of that day. */
export const SUN_HOUR_SECONDS = SUN_DAY_SECONDS / 24;
const DEPTH_OFFSET_DEG = 20;
const SUN_DARK_ANGLE = 90;

export type SunCycle = {
  angle: number;
  /** Holds the world fully dark between sunset and sunrise. */
  night: boolean;
};

/**
 * Day cycle, repeating:
 * 0° → 90° over 5 minutes, 5 minutes of night, then −90° → 0° over 5 minutes.
 */
export function sunCycle(elapsedSeconds: number): SunCycle {
  const leg = SUN_LEG_SECONDS;
  const period = leg * 3;
  const t = ((elapsedSeconds % period) + period) % period;
  if (t < leg) return { angle: (t / leg) * SUN_MAX, night: false };
  if (t < leg * 2) return { angle: SUN_MAX, night: true };
  const rise = (t - leg * 2) / leg;
  return { angle: SUN_MIN * (1 - rise), night: false };
}

export function sunCycleBrightness(cycle: SunCycle): number {
  return cycle.night ? 0 : sunBrightness(cycle.angle);
}

/**
 * Hours after midnight, in [0, 24).
 * The bright peak at the start of the cycle is noon. Night is centered on midnight.
 */
export function timeOfDayHours(elapsedSeconds: number): number {
  const t = ((elapsedSeconds % SUN_DAY_SECONDS) + SUN_DAY_SECONDS) % SUN_DAY_SECONDS;
  return (12 + (t / SUN_DAY_SECONDS) * 24) % 24;
}

/** Clock readout, `0:00` through `23:59`. */
export function formatTimeOfDay(elapsedSeconds: number): string {
  const clock = timeOfDayHours(elapsedSeconds);
  let hour = Math.floor(clock);
  let minute = Math.floor((clock - hour) * 60 + 1e-9);
  if (minute >= 60) {
    minute = 0;
    hour = (hour + 1) % 24;
  }
  return `${hour}:${minute.toString().padStart(2, "0")}`;
}

export function sunDirection(angleDeg: number): [number, number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const depth = (DEPTH_OFFSET_DEG * Math.PI) / 180;
  const screen = Math.cos(depth);
  return [Math.sin(rad) * screen, Math.cos(rad) * screen, Math.sin(depth)];
}

/** 1 at 0°, 0 at ±90°. Flat near noon, then a steep drop near the edges. */
export function sunBrightness(angleDeg: number): number {
  const t = Math.min(1, Math.abs(angleDeg) / SUN_DARK_ANGLE);
  const falloff = t * t * t;
  return 1 - falloff;
}

/** Water column. Light enters at the surface and is absorbed on the way down. */
export const COLUMN_TOP = 500;
export const COLUMN_BOTTOM = -500;
/**
 * Photon flux at normalized light 1 (full sun at the surface).
 * Shading and the field still use the 0–1 fraction. The environment
 * readout reports it in µE·m⁻²·s⁻¹.
 */
export const LIGHT_UE_AT_UNIT = 1800;
/** Bottom of the column keeps 1% of the surface light, the usual euphotic limit. */
export const COLUMN_OPTICAL_DEPTH = Math.log(100);
/** UV is absorbed this many times faster than visible light. */
export const UV_ATTENUATION_SCALE = 5;

/** Environment readout. Normalized light becomes grouped µE·m⁻²·s⁻¹. */
export function formatLightUe(normalized: number): string {
  const clamped = normalized < 0 ? 0 : normalized > 1 ? 1 : normalized;
  const flux = Math.round(clamped * LIGHT_UE_AT_UNIT);
  const grouped = flux.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped} µE·m⁻²·s⁻¹`;
}

/** Beer-Lambert attenuation at world y. 1 at the surface, 0.01 at the bottom. */
export function columnAttenuation(y: number): number {
  return columnTransmission(y, COLUMN_OPTICAL_DEPTH);
}

/** UV at world y. Same surface flux as light, five times the attenuation coefficient. */
export function uvColumnAttenuation(y: number): number {
  return columnTransmission(y, COLUMN_OPTICAL_DEPTH * UV_ATTENUATION_SCALE);
}

function columnTransmission(y: number, opticalDepth: number): number {
  const depth = Math.min(COLUMN_TOP, Math.max(COLUMN_BOTTOM, y));
  const fromSurface = COLUMN_TOP - depth;
  const span = COLUMN_TOP - COLUMN_BOTTOM;
  return Math.exp((-opticalDepth * fromSurface) / span);
}
