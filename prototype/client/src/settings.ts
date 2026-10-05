const STORAGE_KEY = "prokaryon.settings";

export const UI_SCALE_MIN = 0.75;
export const UI_SCALE_MAX = 3;
/** Fallback when the monitor size is unavailable. */
const UI_REFERENCE_WIDTH = 1280;
const UI_REFERENCE_HEIGHT = 720;

export type GameSettings = {
  music: number;
  ui: number;
  scale: number;
  autoScale: boolean;
};

const DEFAULTS: GameSettings = { music: 0.1, ui: 0.2, scale: 1, autoScale: true };

let current = loadSettings();
const listeners = new Set<(settings: GameSettings) => void>();

applyScale(current.scale);

export function gameSettings(): GameSettings {
  return current;
}

export function uiScale(): number {
  return current.scale;
}

/**
 * The layout reads correctly at about half the monitor. A full window
 * scales up so type and windows keep that same share of the screen.
 */
export function monitorUiScale(): number {
  if (typeof window === "undefined") return 1;
  const viewW = document.documentElement?.clientWidth || window.innerWidth || UI_REFERENCE_WIDTH;
  const viewH = document.documentElement?.clientHeight || window.innerHeight || UI_REFERENCE_HEIGHT;
  const screen = window.screen;
  const halfW = (screen?.width || viewW) / 2;
  const halfH = (screen?.height || viewH) / 2;
  return clampScale(Math.min(viewW / halfW, viewH / halfH), 1);
}

export function setGameSettings(patch: Partial<GameSettings>): void {
  const autoScale = patch.autoScale ?? (patch.scale === undefined ? current.autoScale : false);
  const next = {
    music: clampUnit(patch.music, current.music),
    ui: clampUnit(patch.ui, current.ui),
    scale: autoScale ? monitorUiScale() : clampScale(patch.scale, current.scale),
    autoScale,
  };
  if (
    next.music === current.music &&
    next.ui === current.ui &&
    next.scale === current.scale &&
    next.autoScale === current.autoScale
  ) return;
  current = next;
  applyScale(current.scale);
  store(current);
  for (const listener of listeners) listener(current);
}

function store(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode can reject storage. The session still keeps the values.
  }
}

export function onGameSettings(listener: (settings: GameSettings) => void): void {
  listeners.add(listener);
}

/** Follows the monitor until the scale slider is moved. */
export function refreshAutoScale(): void {
  if (!current.autoScale) return;
  const scale = monitorUiScale();
  if (scale === current.scale) return;
  current = { ...current, scale };
  applyScale(scale);
  store(current);
  for (const listener of listeners) listener(current);
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS, scale: monitorUiScale() };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const autoScale = parsed.autoScale !== false;
    return {
      music: clampUnit(parsed.music, DEFAULTS.music),
      ui: clampUnit(parsed.ui, DEFAULTS.ui),
      scale: autoScale ? monitorUiScale() : clampScale(parsed.scale, DEFAULTS.scale),
      autoScale,
    };
  } catch {
    return { ...DEFAULTS, scale: monitorUiScale() };
  }
}

function applyScale(scale: number): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--ui-scale", String(scale));
  document.documentElement.dataset.uiScale = scale === 1 ? "1" : "custom";
}

function clampUnit(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", () => refreshAutoScale());
}

function clampScale(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const stepped = Math.round(value * 20) / 20;
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, stepped));
}
