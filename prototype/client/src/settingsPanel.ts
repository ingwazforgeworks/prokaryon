import { gameSettings, onGameSettings, setGameSettings } from "./settings";
import { createUiSound, playUiSound, UI_HOVER, UI_SELECT } from "./uiSound";

type SettingsTab = "audio" | "video" | "gameplay";

export function initSettings(): void {
  const openButton = document.querySelector<HTMLButtonElement>("#settings-open");
  const panel = document.querySelector<HTMLElement>("#settings");
  const close = document.querySelector<HTMLButtonElement>("#settings-close");
  const music = document.querySelector<HTMLInputElement>("#settings-music");
  const musicValue = document.querySelector<HTMLElement>("#settings-music-value");
  const ui = document.querySelector<HTMLInputElement>("#settings-ui");
  const uiValue = document.querySelector<HTMLElement>("#settings-ui-value");
  const scale = document.querySelector<HTMLInputElement>("#settings-scale");
  const scaleValue = document.querySelector<HTMLElement>("#settings-scale-value");
  const tabs = {
    audio: document.querySelector<HTMLButtonElement>("#settings-tab-audio"),
    video: document.querySelector<HTMLButtonElement>("#settings-tab-video"),
    gameplay: document.querySelector<HTMLButtonElement>("#settings-tab-gameplay"),
  };
  const panes = {
    audio: document.querySelector<HTMLElement>("#settings-audio"),
    video: document.querySelector<HTMLElement>("#settings-video"),
    gameplay: document.querySelector<HTMLElement>("#settings-gameplay"),
  };
  if (!openButton || !panel || !close || !music || !musicValue || !ui || !uiValue || !scale || !scaleValue) {
    throw new Error("missing settings");
  }
  if (!tabs.audio || !tabs.video || !tabs.gameplay || !panes.audio || !panes.video || !panes.gameplay) {
    throw new Error("missing settings");
  }

  const hoverSound = createUiSound(UI_HOVER);
  const clickSound = createUiSound(UI_SELECT);
  const tabButtons = [tabs.audio, tabs.video, tabs.gameplay];

  const paint = (): void => {
    const settings = gameSettings();
    const musicPercent = String(Math.round(settings.music * 100));
    const uiPercent = String(Math.round(settings.ui * 100));
    const scalePercent = String(Math.round(settings.scale * 100));
    music.value = musicPercent;
    musicValue.textContent = `${musicPercent}%`;
    ui.value = uiPercent;
    uiValue.textContent = `${uiPercent}%`;
    scale.value = scalePercent;
    scaleValue.textContent = `${scalePercent}%`;
    const open = !panel.hidden;
    openButton.setAttribute("aria-pressed", open ? "true" : "false");
    openButton.setAttribute("aria-expanded", open ? "true" : "false");
  };

  const setOpen = (open: boolean): void => {
    panel.hidden = !open;
    paint();
  };

  const selectTab = (next: SettingsTab): void => {
    (Object.keys(tabs) as SettingsTab[]).forEach((id) => {
      const on = id === next;
      tabs[id]?.setAttribute("aria-selected", on ? "true" : "false");
      const pane = panes[id];
      if (pane) pane.hidden = !on;
    });
  };

  for (const button of [openButton, close, ...tabButtons]) {
    button.addEventListener("pointerenter", () => playUiSound(hoverSound));
  }
  openButton.addEventListener("click", () => {
    playUiSound(clickSound);
    setOpen(panel.hidden);
  });
  close.addEventListener("click", () => {
    playUiSound(clickSound);
    setOpen(false);
  });
  (Object.keys(tabs) as SettingsTab[]).forEach((id) => {
    tabs[id]?.addEventListener("click", () => {
      playUiSound(clickSound);
      selectTab(id);
    });
  });
  music.addEventListener("input", () => {
    setGameSettings({ music: Number(music.value) / 100 });
  });
  ui.addEventListener("input", () => {
    setGameSettings({ ui: Number(ui.value) / 100 });
  });
  scale.addEventListener("input", () => {
    setGameSettings({ scale: Number(scale.value) / 100 });
  });
  onGameSettings(paint);
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.repeat || panel.hidden) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    event.preventDefault();
    setOpen(false);
    playUiSound(clickSound);
  });
  paint();
}
