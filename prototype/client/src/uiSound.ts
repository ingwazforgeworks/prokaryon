import { gameSettings, onGameSettings } from "./settings";

/**
 * Level-matched clips in Sounds/UI_sounds/new_sounds.
 */
const CUES = {
  hover: "/ui-sounds/new_sounds/quiet_hover_over1.wav",
  select: "/ui-sounds/new_sounds/organic_pop1.wav",
  button: "/ui-sounds/new_sounds/organic_button2.wav",
  toggle: "/ui-sounds/new_sounds/organic_chirp1.wav",
  tab: "/ui-sounds/new_sounds/organic_boop1.wav",
  open: "/ui-sounds/new_sounds/organic_button1.wav",
  close: "/ui-sounds/new_sounds/organic_button3.wav",
  step: "/ui-sounds/new_sounds/analog_click1.wav",
  tool: "/ui-sounds/new_sounds/analog_click2.wav",
  device: "/ui-sounds/new_sounds/analog_button1.wav",
  tray: "/ui-sounds/new_sounds/analog_button_2.wav",
  back: "/ui-sounds/new_sounds/descending_chime1.wav",
  deny: "/ui-sounds/new_sounds/negative_boop2.wav",
  reject: "/ui-sounds/new_sounds/negative_boop1.wav",
  alarm: "/ui-sounds/new_sounds/negative_alert1.wav",
  success: "/ui-sounds/new_sounds/positive_trill_1.wav",
  confirm: "/ui-sounds/new_sounds/positive_alert1.wav",
  chime: "/ui-sounds/new_sounds/positive_chime1.wav",
  level: "/ui-sounds/new_sounds/scifi_levelup.wav",
} as const;

export type UiCue = keyof typeof CUES;

const clips: HTMLAudioElement[] = [];

/** Returns null outside the browser (e.g. node test runs) so importing stays safe. */
function make(url: string): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  const audio = new Audio(url);
  audio.preload = "auto";
  audio.volume = gameSettings().ui;
  clips.push(audio);
  return audio;
}

const bank = new Map<UiCue, HTMLAudioElement | null>(
  (Object.keys(CUES) as UiCue[]).map((cue) => [cue, make(CUES[cue])]),
);

onGameSettings((settings) => {
  for (const audio of clips) audio.volume = settings.ui;
});

function playUiSound(audio: HTMLAudioElement): void {
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

export function playCue(cue: UiCue): void {
  const audio = bank.get(cue);
  if (audio) playUiSound(audio);
}

const TOOLS = new Set([
  "terrain-paint",
  "terrain-vent",
  "terrain-light",
  "terrain-bubble",
  "terrain-heat",
  "terrain-deposit",
  "terrain-erase",
  "terrain-decor",
]);

function cueForButton(button: HTMLButtonElement): UiCue {
  const id = button.id;
  if (id === "terrain-save" || id === "cell-divide") return "button";
  if (id === "cell-clear") return "back";
  if (id.endsWith("-dec") || id.endsWith("-inc")) return "step";
  if (TOOLS.has(id)) return "tool";
  if (id === "debug-tab-environment" || id === "debug-tab-cell" || id === "debug-tab-genetics") return "tray";
  if (id.includes("-tab-") || button.getAttribute("role") === "tab") return "tab";
  if (button.hasAttribute("aria-pressed")) return "toggle";
  return "select";
}

/** Hover and click cues for a panel whose buttons do not each own a sound. */
export function bindButtonSounds(root: ParentNode): void {
  root.addEventListener("pointerover", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    if (root instanceof Node && !root.contains(button)) return;
    const related = event instanceof PointerEvent ? event.relatedTarget : null;
    if (related instanceof Node && button.contains(related)) return;
    playCue("hover");
  });
  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("button") : null;
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;
    if (root instanceof Node && !root.contains(button)) return;
    playCue(cueForButton(button));
  });
}
