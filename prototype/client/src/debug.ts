import { sunCycleBrightness, sunDirection, type SunCycle } from "./light";

export class LightDebug {
  private cycle: SunCycle = { angle: 0, night: false };
  private readonly root: HTMLElement;
  private readonly value: HTMLElement;
  private readonly level: HTMLElement;
  private readonly decrease: HTMLButtonElement;
  private readonly increase: HTMLButtonElement;

  constructor() {
    const root = document.querySelector<HTMLElement>("#debug");
    const value = document.querySelector<HTMLElement>("#light-value");
    const level = document.querySelector<HTMLElement>("#light-level");
    const decrease = document.querySelector<HTMLButtonElement>("#light-dec");
    const increase = document.querySelector<HTMLButtonElement>("#light-inc");
    if (!root || !value || !level || !decrease || !increase) throw new Error("missing debug menu");
    this.root = root;
    this.value = value;
    this.level = level;
    this.decrease = decrease;
    this.increase = increase;
    decrease.disabled = true;
    increase.disabled = true;
    this.refresh();
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  private shownAngle = Number.NaN;
  private shownPercent = -1;

  toggle(): void {
    this.root.hidden = !this.root.hidden;
    if (this.open) {
      this.shownAngle = Number.NaN;
      this.shownPercent = -1;
      this.refresh();
    }
  }

  follow(cycle: SunCycle): void {
    this.cycle = cycle;
    if (this.open) this.refresh();
  }

  brightness(): number {
    return sunCycleBrightness(this.cycle);
  }

  showBrightness(intensity: number): void {
    if (!this.open) return;
    const percent = Math.round(intensity * 100);
    if (percent === this.shownPercent) return;
    this.shownPercent = percent;
    this.level.textContent = `Brightness ${percent}%`;
  }

  direction(): [number, number, number] {
    return sunDirection(this.cycle.angle);
  }

  private refresh(): void {
    const shown = Math.round(this.cycle.angle * 10) / 10;
    if (shown === this.shownAngle) return;
    this.shownAngle = shown;
    const text = Math.abs(shown).toFixed(1);
    const sign = shown > 0 ? "+" : shown < 0 ? "-" : "";
    this.value.textContent = `${sign}${text}°`;
  }
}
