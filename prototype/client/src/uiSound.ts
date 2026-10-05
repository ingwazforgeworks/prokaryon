import { gameSettings, onGameSettings } from "./settings";

export const UI_HOVER = "/ui-sounds/soft_UI_sounds/soft_click.mp3";
export const UI_SELECT = "/ui-sounds/soft_UI_sounds/selection.mp3";

const clips: HTMLAudioElement[] = [];

export function createUiSound(url: string): HTMLAudioElement {
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = gameSettings().ui;
  clips.push(audio);
  return audio;
}

onGameSettings((settings) => {
  for (const audio of clips) audio.volume = settings.ui;
});

export function playUiSound(audio: HTMLAudioElement): void {
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}
