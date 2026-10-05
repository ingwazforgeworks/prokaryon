/** Startup progress for the boot bar in index.html. */

const WEIGHTS = {
  scripts: 5,
  shaders: 8,
  terrainImages: 14,
  terrainBuild: 28,
  deposits: 16,
  decorations: 23,
  bubbles: 4,
  session: 2,
} as const;

export type BootStage = keyof typeof WEIGHTS;

const LABELS: Record<BootStage, string> = {
  scripts: "Scripts",
  shaders: "Shaders",
  terrainImages: "Terrain",
  terrainBuild: "Terrain",
  deposits: "Deposits",
  decorations: "Decorations",
  bubbles: "Bubbles",
  session: "Connecting",
};

const stage = new Map<BootStage, number>();
let lastYield = 0;
let latestLabel = "Loading";

type BootReport = (fraction: number, label?: string) => void;

function publish(force?: number): void {
  if (typeof window === "undefined") return;
  let total = 0;
  let filled = 0;
  for (const key of Object.keys(WEIGHTS) as BootStage[]) {
    total += WEIGHTS[key];
    filled += WEIGHTS[key] * (stage.get(key) ?? 0);
  }
  const fraction = force ?? (total === 0 ? 0 : filled / total);
  const report = (window as Window & { __boot?: BootReport }).__boot;
  report?.(fraction, latestLabel);
}

export function bootMark(id: BootStage, fraction: number): void {
  latestLabel = LABELS[id];
  const next = Math.max(stage.get(id) ?? 0, Math.min(1, Math.max(0, fraction)));
  if (next === stage.get(id)) return;
  stage.set(id, next);
  publish();
}

/** Records progress and lets the bar paint when a slice of work has been running. */
export async function bootPulse(id: BootStage, fraction: number): Promise<void> {
  const before = stage.get(id) ?? 0;
  bootMark(id, fraction);
  if ((stage.get(id) ?? 0) === before) publish();
  if (typeof requestAnimationFrame !== "function") return;
  const now = performance.now();
  if (now - lastYield < 50) return;
  lastYield = now;
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export function bootFinish(): void {
  for (const key of Object.keys(WEIGHTS) as BootStage[]) stage.set(key, 1);
  latestLabel = "Ready";
  publish(1);
}
