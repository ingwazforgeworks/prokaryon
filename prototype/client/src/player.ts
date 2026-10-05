import { gameSettings, onGameSettings, setGameSettings, uiScale } from "./settings";
import { createUiSound, playUiSound, UI_HOVER, UI_SELECT } from "./uiSound";

const HOVER_SOUND = UI_HOVER;
const CLICK_SOUND = UI_SELECT;
const DEFAULT_VOLUME = 0.1;
const PLAY_ICON = "/ui/music_player/play_16.png";
const PAUSE_ICON = "/ui/music_player/pause_16.png";
const VOLUME_ICON = "/ui/music_player/volume_16.png";
const MUTED_ICON = "/ui/music_player/muted_volume_16.png";
const MARQUEE_SPEED = 20;
const MARQUEE_PAUSE = 5;

export function playMarquee(marquee: HTMLElement, scale = uiScale()): void {
  marquee.getAnimations().forEach((animation) => animation.cancel());
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  marquee.style.transform = "none";
  const view = Number.parseFloat(getComputedStyle(marquee).paddingLeft);
  const range = document.createRange();
  range.selectNodeContents(marquee);
  const textWidth = range.getBoundingClientRect().width / scale;
  marquee.style.transform = "";
  if (view <= 0 || textWidth <= 0) return;
  const enter = view / MARQUEE_SPEED;
  const exit = textWidth / MARQUEE_SPEED;
  const total = enter + MARQUEE_PAUSE + exit;
  const hold = `translateX(${-view}px)`;
  marquee.animate(
    [
      { transform: "translateX(0)", offset: 0 },
      { transform: hold, offset: enter / total },
      { transform: hold, offset: (enter + MARQUEE_PAUSE) / total },
      { transform: `translateX(${-(view + textWidth)}px)`, offset: 1 },
    ],
    { duration: total * 1000, iterations: Infinity, easing: "linear" },
  );
}

function setIcon(img: HTMLImageElement, src: string): void {
  if (img.getAttribute("src") !== src) img.src = src;
}

export function initPlayer(): void {
  const root = document.querySelector<HTMLElement>("#player");
  const back = document.querySelector<HTMLButtonElement>("#player-back");
  const next = document.querySelector<HTMLButtonElement>("#player-next");
  const toggle = document.querySelector<HTMLButtonElement>("#player-toggle");
  const title = document.querySelector<HTMLElement>("#player-title");
  const marquee = document.querySelector<HTMLElement>("#player-marquee");
  const volumeButton = document.querySelector<HTMLButtonElement>("#player-volume");
  const volumeWrap = volumeButton?.parentElement;
  const level = document.querySelector<HTMLInputElement>("#player-level");
  const toggleIcon = toggle?.querySelector<HTMLImageElement>("img");
  const volumeIcon = volumeButton?.querySelector<HTMLImageElement>("img");
  if (!root || !back || !next || !toggle || !title || !marquee || !volumeButton || !volumeWrap || !level || !toggleIcon || !volumeIcon) {
    throw new Error("missing music player");
  }

  const hoverSound = createUiSound(HOVER_SOUND);
  const clickSound = createUiSound(CLICK_SOUND);
  const music = new Audio();
  const initialVolume = gameSettings().music;
  music.preload = "auto";
  music.volume = initialVolume;
  level.value = String(Math.round(initialVolume * 100));
  let tracks: string[] = [];
  let index = 0;
  let remembered = initialVolume > 0 ? initialVolume : DEFAULT_VOLUME;
  let hidePop = 0;
  let shownTitle = "";

  const paint = (): void => {
    const file = tracks[index];
    const label = file ? `${file.replace(/\.mp3$/i, "")} - Prokaryon OST` : "";
    if (label !== shownTitle) {
      shownTitle = label;
      if (label) title.setAttribute("aria-label", label);
      else title.removeAttribute("aria-label");
      marquee.textContent = label;
      if (label) playMarquee(marquee);
      else marquee.getAnimations().forEach((animation) => animation.cancel());
    }
    const playing = !music.paused && music.src !== "";
    setIcon(toggleIcon, playing ? PAUSE_ICON : PLAY_ICON);
    toggle.setAttribute("aria-label", playing ? "Pause" : "Play");
    toggle.setAttribute("aria-pressed", playing ? "true" : "false");
    const muted = music.volume === 0;
    setIcon(volumeIcon, muted ? MUTED_ICON : VOLUME_ICON);
    volumeButton.setAttribute("aria-label", muted ? "Unmute" : "Mute");
    volumeButton.setAttribute("aria-pressed", muted ? "true" : "false");
  };

  const setVolume = (value: number, broadcast = true): void => {
    const next = Math.min(1, Math.max(0, value));
    if (next > 0) remembered = next;
    music.volume = next;
    level.value = String(Math.round(next * 100));
    paint();
    if (broadcast) setGameSettings({ music: next });
  };

  const load = (nextIndex: number, autoplay: boolean): void => {
    if (tracks.length === 0) return;
    index = (nextIndex + tracks.length) % tracks.length;
    music.src = `/music/${encodeURIComponent(tracks[index])}`;
    paint();
    if (autoplay) void music.play().then(paint).catch(() => paint());
  };

  for (const button of [back, next, toggle, volumeButton]) {
    button.addEventListener("pointerenter", () => playUiSound(hoverSound));
  }
  back.addEventListener("click", () => {
    playUiSound(clickSound);
    load(index - 1, !music.paused);
  });
  next.addEventListener("click", () => {
    playUiSound(clickSound);
    load(index + 1, !music.paused);
  });
  toggle.addEventListener("click", () => {
    playUiSound(clickSound);
    if (music.paused) void music.play().then(paint).catch(() => paint());
    else {
      music.pause();
      paint();
    }
  });
  volumeButton.addEventListener("click", () => {
    playUiSound(clickSound);
    setVolume(music.volume === 0 ? remembered : 0);
  });
  level.addEventListener("input", () => {
    setVolume(Number(level.value) / 100);
  });
  const holdPop = (): void => {
    window.clearTimeout(hidePop);
    volumeWrap.classList.add("linger");
  };
  const releasePop = (): void => {
    window.clearTimeout(hidePop);
    hidePop = window.setTimeout(() => volumeWrap.classList.remove("linger"), 1000);
  };
  volumeWrap.addEventListener("pointerenter", holdPop);
  volumeWrap.addEventListener("pointerleave", releasePop);
  onGameSettings((settings) => {
    if (Math.abs(music.volume - settings.music) > 0.0005) setVolume(settings.music, false);
  });
  music.addEventListener("play", paint);
  music.addEventListener("pause", paint);
  music.addEventListener("ended", () => load(index + 1, true));

  void fetch("/music")
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error("music list failed"))))
    .then((names: unknown) => {
      if (!Array.isArray(names) || names.some((name) => typeof name !== "string")) return;
      tracks = names;
      load(0, false);
    })
    .catch(() => {
      shownTitle = "";
      marquee.textContent = "";
      title.removeAttribute("aria-label");
    });
}
