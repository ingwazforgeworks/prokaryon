import { createLyricScroll } from "./lyrics";
import { resetUnlocks } from "./geneUnlocks";
import { initGeneMaker, openGeneMaker } from "./geneMaker";
import { persistGenome, resetGenomeState } from "./genomeState";
import { playMarquee } from "./player";
import { setMutationPoints, STARTING_ATP, STARTING_MUTATION_POINTS, updateResource } from "./resources";
import { gameSettings, onGameSettings, setGameSettings, uiScale } from "./settings";
import { playCue } from "./uiSound";

const THEME_TRACKS = ["Micronauts in the Void (Reprise).mp3", "Into the Microcosmos.mp3"];
const PLAY_ICON = "/ui/music_player/play_16.png";
const PAUSE_ICON = "/ui/music_player/pause_16.png";
const VOLUME_ICON = "/ui/music_player/volume_16.png";
const MUTED_ICON = "/ui/music_player/muted_volume_16.png";

const BLACK_MS = 700;
const LOGO_FADE_MS = 900;
const LOGO_SETTLE_MS = 400;
const PROMPT_HOLD_MS = 2000;
const WORDMARK_FADE_MS = 1000;
const SWIM_DELAY_MS = 280;
const SWIM_MS = 4600;
const DOCK_MS = 3000;
const LIFT_DELAY_MS = 400;
const LIFT_MS = 1600;
const BUTTON_AFTER_LYRICS_MS = 600;
const WORDMARK_LETTER_CENTER = (278 + 535) / 2 / 753;
const MICROBE_FRAME_MS = 120;
const MICROBE_SHEET = 1254;
const MICROBE_PAD_X = 188;
const MICROBE_PAD_Y = 88;
const MICROBE_SRC_W = 610;
const MICROBE_SRC_H = 174;
const WORDMARK_LETTER_TOP = 278 / 753;
/** Body center of each sheet frame, in source pixels. The cells are not evenly registered. */
const MICROBE_ANCHORS = [
  [224.7, 216.0],
  [807.5, 216.1],
  [224.2, 515.1],
  [807.6, 515.0],
  [225.6, 812.8],
  [810.0, 812.7],
  [226.3, 1107.6],
  [807.9, 1107.8],
] as const;
/** Exclusive source x of each frame's right edge, before the next cell begins. */
const MICROBE_CROP_RIGHT = [623, 1224, 616, 1224, 618, 1222, 617, 1226] as const;

type Phase = "boot" | "splash" | "menu" | "note" | "maker" | "lab";

let phase: Phase = "boot";

/** True until New Cell leaves the title screens. */
export function titleScreenOpen(): boolean {
  return phase !== "lab";
}

export function initTitleScreen(): void {
  const root = document.querySelector<HTMLElement>("#title");
  const splash = document.querySelector<HTMLButtonElement>("#splash");
  const menu = document.querySelector<HTMLElement>("#main-menu");
  const actions = document.querySelector<HTMLElement>("#menu-actions");
  const note = document.querySelector<HTMLElement>("#menu-note");
  const noteTitle = document.querySelector<HTMLElement>("#menu-note-title");
  const noteBody = document.querySelector<HTMLElement>("#menu-note-body");
  const newCell = document.querySelector<HTMLButtonElement>("#menu-new");
  const loadCell = document.querySelector<HTMLButtonElement>("#menu-load");
  const settings = document.querySelector<HTMLButtonElement>("#menu-settings");
  const credits = document.querySelector<HTMLButtonElement>("#menu-credits");
  const geneMakerButton = document.querySelector<HTMLButtonElement>("#menu-gene-maker");
  const maker = document.querySelector<HTMLElement>("#gene-maker");
  const back = document.querySelector<HTMLButtonElement>("#menu-back");
  const themeBack = document.querySelector<HTMLButtonElement>("#menu-theme-back");
  const themeNext = document.querySelector<HTMLButtonElement>("#menu-theme-next");
  const themeTitle = document.querySelector<HTMLElement>("#menu-theme-title");
  const themeMarquee = document.querySelector<HTMLElement>("#menu-theme-marquee");
  const themeToggle = document.querySelector<HTMLButtonElement>("#menu-theme-toggle");
  const themeIcon = document.querySelector<HTMLImageElement>("#menu-theme-icon");
  const themeVolume = document.querySelector<HTMLButtonElement>("#menu-theme-volume");
  const themeVolumeIcon = document.querySelector<HTMLImageElement>("#menu-theme-volume-icon");
  const themeLevel = document.querySelector<HTMLInputElement>("#menu-theme-level");
  const themeVolumeWrap = themeVolume?.parentElement;
  const lyricHost = document.querySelector<HTMLElement>("#menu-lyrics");
  const wordmark = document.querySelector<HTMLImageElement>("#menu-wordmark");
  const microbe = document.querySelector<HTMLElement>("#menu-microbe");
  const discord = document.querySelector<HTMLButtonElement>("#menu-discord");
  const ui = document.getElementById("ui");
  if (!root || !splash || !menu || !actions || !note || !noteTitle || !noteBody || !newCell || !loadCell || !settings || !credits || !geneMakerButton || !maker || !back || !wordmark || !microbe || !discord) {
    throw new Error("missing title screen");
  }
  if (!themeBack || !themeNext || !themeTitle || !themeMarquee || !themeToggle || !themeIcon || !themeVolume || !themeVolumeIcon || !themeLevel || !themeVolumeWrap || !lyricHost) {
    throw new Error("missing title screen");
  }
  const lyrics = createLyricScroll(lyricHost);

  document.documentElement.dataset.title = "1";
  ui?.setAttribute("inert", "");

  const theme = new Audio();
  theme.preload = "auto";
  const initialVolume = gameSettings().music;
  theme.volume = initialVolume;
  themeLevel.value = String(Math.round(initialVolume * 100));
  let themeIndex = 0;
  let shownTitle = "";
  let remembered = initialVolume > 0 ? initialVolume : 0.1;
  let hidePop = 0;

  const paintTheme = (): void => {
    const file = THEME_TRACKS[themeIndex] ?? THEME_TRACKS[0];
    const label = file.replace(/\.mp3$/i, "");
    if (label !== shownTitle) {
      shownTitle = label;
      themeTitle.setAttribute("aria-label", label);
      themeMarquee.textContent = label;
      playMarquee(themeMarquee, uiScale());
    }
    const playing = !theme.paused && theme.src !== "";
    themeIcon.src = playing ? PAUSE_ICON : PLAY_ICON;
    themeToggle.setAttribute("aria-label", playing ? "Pause" : "Play");
    themeToggle.setAttribute("aria-pressed", playing ? "true" : "false");
    const muted = theme.volume === 0;
    themeVolumeIcon.src = muted ? MUTED_ICON : VOLUME_ICON;
    themeVolume.setAttribute("aria-label", muted ? "Unmute" : "Volume");
    themeVolume.setAttribute("aria-pressed", muted ? "true" : "false");
  };

  const loadTheme = (nextIndex: number, autoplay: boolean): void => {
    themeIndex = (nextIndex + THEME_TRACKS.length) % THEME_TRACKS.length;
    const file = THEME_TRACKS[themeIndex];
    theme.src = `/theme/${encodeURIComponent(file)}`;
    shownTitle = "";
    paintTheme();
    if (autoplay) void theme.play().then(paintTheme).catch(() => paintTheme());
  };

  const setThemeVolume = (value: number, broadcast = true): void => {
    const next = Math.min(1, Math.max(0, value));
    if (next > 0) remembered = next;
    theme.volume = next;
    themeLevel.value = String(Math.round(next * 100));
    paintTheme();
    if (broadcast) setGameSettings({ music: next });
  };

  const startTheme = (): void => {
    if (theme.src === "") loadTheme(themeIndex, true);
    else void theme.play().then(paintTheme).catch(() => paintTheme());
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const splashTimers: number[] = [];
  let removed = false;

  const later = (ms: number, run: () => void): void => {
    splashTimers.push(window.setTimeout(run, ms));
  };

  const clearSplash = (): void => {
    for (const timer of splashTimers) window.clearTimeout(timer);
    splashTimers.length = 0;
  };

  let buttonsReady = false;
  let microbeFrame = 0;
  let microbeFrameBank = 0;
  let microbeLast = 0;
  let swimOrigin = 0;
  let microbeShown = false;
  let microbeRaf = 0;
  let musicAt = 0;
  let lyricsArmed = false;
  let lyricsAt = 0;

  const paintMicrobeFrame = (used: number): void => {
    const anchor = MICROBE_ANCHORS[microbeFrame] ?? MICROBE_ANCHORS[0];
    const lockX = Math.round(MICROBE_PAD_X * used);
    const lockY = Math.round(MICROBE_PAD_Y * used);
    microbe.style.backgroundSize = `${Math.round(MICROBE_SHEET * used)}px ${Math.round(MICROBE_SHEET * used)}px`;
    microbe.style.backgroundPosition = `${lockX - Math.round(anchor[0] * used)}px ${lockY - Math.round(anchor[1] * used)}px`;
  };

  const letterNudge = (): number => {
    const wordH = wordmark.offsetHeight;
    if (wordH < 8) return 0;
    return -Math.round((WORDMARK_LETTER_CENTER - 0.5) * wordH);
  };

  const introPose = (now: number): { x: number; y: number; nudge: number; docked: boolean; lifted: boolean } => {
    const hostW = menu.clientWidth;
    const hostH = menu.clientHeight;
    const nudge = letterNudge();
    const liftFull = -Math.round(Math.min(64, Math.max(28, hostH * 0.05)));
    const stackW = Math.min(640, Math.max(160, hostW - 48));
    const margin = 28;
    const minCenter = stackW / 2 + margin;
    const maxCenter = Math.max(minCenter, hostW - stackW / 2 - margin);
    const center = Math.min(maxCenter, Math.max(minCenter, hostW / 3));
    const fullX = hostW < 8 ? 0 : Math.round(center - hostW / 2);
    if (reduceMotion) return { x: fullX, y: nudge + liftFull, nudge, docked: true, lifted: true };
    if (swimOrigin === 0) return { x: 0, y: nudge, nudge, docked: false, lifted: false };
    const swimDone = swimOrigin + SWIM_DELAY_MS + SWIM_MS;
    const xT = now <= swimDone ? 0 : Math.min(1, (now - swimDone) / DOCK_MS);
    const xEased = xT * xT * (3 - 2 * xT);
    const docked = xT >= 1;
    let liftT = 0;
    if (docked && musicAt > 0 && now > musicAt + LIFT_DELAY_MS) liftT = Math.min(1, (now - musicAt - LIFT_DELAY_MS) / LIFT_MS);
    const liftEased = liftT * liftT * (3 - 2 * liftT);
    return { x: Math.round(fullX * xEased), y: nudge + Math.round(liftFull * liftEased), nudge, docked, lifted: liftT >= 1 };
  };

  const placeLyrics = (): void => {
    const hostW = menu.clientWidth;
    const hostH = menu.clientHeight;
    if (hostW < 8 || hostH < 8) return;
    const stackW = Math.min(640, Math.max(160, hostW - 48));
    const margin = 28;
    const minCenter = stackW / 2 + margin;
    const maxCenter = Math.max(minCenter, hostW - stackW / 2 - margin);
    const menuCenter = Math.min(maxCenter, Math.max(minCenter, hostW / 3));
    const menuRight = menuCenter + stackW / 2;
    const edge = 24;
    const gap = 28;
    const roomLeft = menuRight + gap;
    const roomRight = hostW - edge;
    const room = roomRight - roomLeft;
    if (room < 300) {
      lyricHost.style.left = `${Math.round(menuCenter)}px`;
      lyricHost.style.right = "auto";
      lyricHost.style.top = "auto";
      lyricHost.style.bottom = "88px";
      lyricHost.style.width = `${Math.round(Math.min(520, hostW - 48))}px`;
      lyricHost.style.transform = "translate(-50%, 0)";
      return;
    }
    const lyricsW = Math.min(600, room);
    lyricHost.style.left = `${Math.round(roomLeft + room / 2)}px`;
    lyricHost.style.right = "auto";
    lyricHost.style.top = `${Math.round(hostH / 2 - 36)}px`;
    lyricHost.style.bottom = "auto";
    lyricHost.style.width = `${Math.round(lyricsW)}px`;
    lyricHost.style.transform = "translate(-50%, -50%)";
  };

  const placeMicrobe = (now: number): void => {
    placeLyrics();
    const pose = introPose(now);
    if (!reduceMotion && swimOrigin > 0 && now >= swimOrigin + SWIM_DELAY_MS + SWIM_MS) {
      root.classList.add("is-world");
    }
    const actionsTransform = `translate3d(${pose.x}px, ${pose.y}px, 0)`;
    const noteTransform = `translate3d(${pose.x}px, ${pose.y - pose.nudge}px, 0)`;
    if (actions.style.transform !== actionsTransform) actions.style.transform = actionsTransform;
    if (note.style.transform !== noteTransform) note.style.transform = noteTransform;
    if (!reduceMotion && pose.docked && musicAt === 0) {
      musicAt = now;
      root.classList.add("is-music");
      startTheme();
    }
    if (!reduceMotion && pose.lifted && !lyricsArmed) {
      lyricsArmed = true;
      lyricsAt = now;
    }
    if (!reduceMotion && lyricsArmed && !buttonsReady && now >= lyricsAt + BUTTON_AFTER_LYRICS_MS) revealButtons();
    if (actions.hidden || swimOrigin === 0) return;
    const word = wordmark.getBoundingClientRect();
    const host = menu.getBoundingClientRect();
    if (word.width < 8 || host.width < 8) return;
    const scale = uiScale() || 1;
    const wordW = word.width / scale;
    const wordH = word.height / scale;
    const hostW = host.width / scale;
    let width = Math.round(Math.min(Math.max(150, wordW * 0.5), hostW * 0.78));
    if (width % 2) width += 1;
    const used = Math.round(MICROBE_SHEET * (width / MICROBE_SRC_W)) / MICROBE_SHEET;
    const swimming = !reduceMotion && now - swimOrigin < SWIM_DELAY_MS + SWIM_MS;
    if (swimming) {
      const dt = microbeLast === 0 ? 0 : now - microbeLast;
      microbeFrameBank += dt;
      while (microbeFrameBank >= MICROBE_FRAME_MS) {
        microbeFrameBank -= MICROBE_FRAME_MS;
        microbeFrame = (microbeFrame + 1) % MICROBE_ANCHORS.length;
      }
    }
    microbeLast = now;
    const anchor = MICROBE_ANCHORS[microbeFrame] ?? MICROBE_ANCHORS[0];
    const cropRight = MICROBE_CROP_RIGHT[microbeFrame] ?? MICROBE_CROP_RIGHT[0];
    const srcWidth = cropRight - (anchor[0] - MICROBE_PAD_X);
    const height = Math.round(MICROBE_SRC_H * used);
    microbe.style.width = `${Math.max(1, Math.round(srcWidth * used))}px`;
    microbe.style.height = `${height}px`;
    const letterTop = (word.top - host.top) / scale + wordH * WORDMARK_LETTER_TOP;
    const bodyBottom = Math.round((MICROBE_PAD_Y + 82) * used);
    const settleY = Math.max(4, letterTop - 8 - bodyBottom);
    const settleX = (word.left - host.left) / scale + wordW / 2 - Math.round(MICROBE_PAD_X * used);
    let x = settleX;
    let y = settleY;
    if (!reduceMotion) {
      const elapsed = now - swimOrigin - SWIM_DELAY_MS;
      const t = Math.min(1, Math.max(0, elapsed / SWIM_MS));
      const cruise = t <= 0.7 ? (t / 0.7) * 0.8 : 0.8 + 0.2 * (1 - (1 - (t - 0.7) / 0.3) ** 2);
      x = hostW + 12 + (settleX - (hostW + 12)) * cruise;
    }
    paintMicrobeFrame(used);
    microbe.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    if (!microbeShown && (reduceMotion || now - swimOrigin >= SWIM_DELAY_MS)) {
      microbeShown = true;
      microbe.classList.add("is-shown");
    }
  };

  const tickMicrobe = (now: number): void => {
    if (!root.isConnected || phase === "lab") return;
    placeMicrobe(now);
    microbeRaf = window.requestAnimationFrame(tickMicrobe);
  };

  const beginIntro = (): void => {
    window.cancelAnimationFrame(microbeRaf);
    if (reduceMotion) {
      swimOrigin = performance.now();
      musicAt = swimOrigin;
      lyricsArmed = true;
      lyricsAt = swimOrigin;
      root.classList.add("is-brand", "is-music");
      placeMicrobe(swimOrigin);
      startTheme();
      revealButtons();
      return;
    }
    placeMicrobe(performance.now());
    microbeRaf = window.requestAnimationFrame(tickMicrobe);
  };

  const revealButtons = (): void => {
    if (buttonsReady || phase === "lab") return;
    buttonsReady = true;
    root.classList.add("is-actions");
    if (phase !== "menu") return;
    actions.inert = false;
    newCell.focus();
  };

  const showActions = (): void => {
    phase = "menu";
    note.hidden = true;
    maker.hidden = true;
    actions.hidden = false;
    microbe.classList.remove("is-away");
    if (buttonsReady) {
      actions.inert = false;
      newCell.focus();
    } else {
      actions.inert = true;
    }
    if (reduceMotion) placeMicrobe(performance.now());
  };

  const showNote = (title: string, body: string): void => {
    phase = "note";
    noteTitle.textContent = title;
    noteBody.textContent = body;
    actions.hidden = true;
    note.hidden = false;
    maker.hidden = true;
    microbe.classList.add("is-away");
    back.focus();
  };

  const showMaker = (): void => {
    phase = "maker";
    actions.hidden = true;
    note.hidden = true;
    maker.hidden = false;
    microbe.classList.add("is-away");
    openGeneMaker();
  };

  const showMenu = (): void => {
    if (phase === "menu" || phase === "note" || phase === "lab") return;
    clearSplash();
    phase = "menu";
    splash.inert = true;
    menu.inert = false;
    root.classList.remove("is-splash", "is-logo", "is-prompt");
    root.classList.add("is-menu");
    showActions();
    beginIntro();
    if (reduceMotion) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (phase !== "menu" && phase !== "note") return;
        root.classList.add("is-brand");
        later(WORDMARK_FADE_MS, () => {
          if (phase === "lab") return;
          swimOrigin = performance.now();
          microbeLast = 0;
          microbeFrame = 0;
          microbeFrameBank = 0;
        });
      });
    });
  };

  const enterLab = (): void => {
    if (phase === "lab") return;
    // New Cell always begins from a clean organism, whatever was saved last session.
    resetGenomeState();
    void persistGenome();
    resetUnlocks();
    setMutationPoints(STARTING_MUTATION_POINTS);
    updateResource("atp", { amount: STARTING_ATP, rate: 0 });
    phase = "lab";
    window.cancelAnimationFrame(microbeRaf);
    theme.pause();
    paintTheme();
    document.documentElement.removeAttribute("data-title");
    ui?.removeAttribute("inert");
    root.classList.add("is-leaving");
    const close = (): void => {
      if (removed) return;
      removed = true;
      root.remove();
    };
    root.addEventListener("transitionend", close);
    window.setTimeout(close, reduceMotion ? 0 : 360);
  };

  for (const button of [newCell, loadCell, settings, credits, geneMakerButton, back, discord, themeBack, themeNext, themeToggle, themeVolume]) {
    button.addEventListener("pointerenter", () => playCue("hover"));
  }
  themeBack.addEventListener("click", () => {
    playCue("step");
    loadTheme(themeIndex - 1, !theme.paused && theme.src !== "");
  });
  themeNext.addEventListener("click", () => {
    playCue("step");
    loadTheme(themeIndex + 1, !theme.paused && theme.src !== "");
  });
  themeToggle.addEventListener("click", () => {
    playCue("device");
    if (theme.paused) startTheme();
    else {
      theme.pause();
      paintTheme();
    }
  });
  themeVolume.addEventListener("click", () => {
    playCue("toggle");
    setThemeVolume(theme.volume === 0 ? remembered : 0);
  });
  themeLevel.addEventListener("input", () => {
    setThemeVolume(Number(themeLevel.value) / 100);
  });
  const holdPop = (): void => {
    window.clearTimeout(hidePop);
    themeVolumeWrap.classList.add("linger");
  };
  const releasePop = (): void => {
    window.clearTimeout(hidePop);
    hidePop = window.setTimeout(() => themeVolumeWrap.classList.remove("linger"), 1000);
  };
  themeVolumeWrap.addEventListener("pointerenter", holdPop);
  themeVolumeWrap.addEventListener("pointerleave", releasePop);
  theme.addEventListener("play", paintTheme);
  theme.addEventListener("pause", paintTheme);
  theme.addEventListener("ended", () => loadTheme(themeIndex + 1, true));
  onGameSettings((settings) => {
    if (Math.abs(theme.volume - settings.music) > 0.0005) setThemeVolume(settings.music, false);
  });
  paintTheme();

  splash.addEventListener("click", () => {
    if (phase !== "splash") return;
    playCue("select");
    showMenu();
  });
  newCell.addEventListener("click", () => {
    playCue("chime");
    enterLab();
  });
  loadCell.addEventListener("click", () => {
    playCue("reject");
    showNote("Load Cell", "No saved cells yet.");
  });
  settings.addEventListener("click", () => {
    playCue("reject");
    showNote("Settings", "Open a cell to change settings.");
  });
  credits.addEventListener("click", () => {
    playCue("select");
    showNote("Credits", "Ingwaz Forgeworks");
  });
  geneMakerButton.addEventListener("click", () => {
    playCue("select");
    showMaker();
  });
  initGeneMaker({ onBack: () => showActions() });
  back.addEventListener("click", () => {
    playCue("back");
    showActions();
  });

  window.addEventListener("resize", () => {
    if (reduceMotion && phase !== "lab" && phase !== "boot" && phase !== "splash") placeMicrobe(performance.now());
  });

  window.addEventListener("keydown", (event) => {
    if (phase === "splash" && (event.key === "Enter" || event.key === " " || event.key === "Escape")) {
      event.preventDefault();
      playCue("select");
      showMenu();
      return;
    }
    if (phase === "menu" && (event.key === "i" || event.key === "I") && !event.repeat) {
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select")) return;
      if (geneMakerButton.hidden) {
        geneMakerButton.hidden = false;
        playCue("toggle");
      }
      return;
    }
    if (phase === "menu" && event.key === " " && !event.repeat) {
      const target = event.target;
      if (target instanceof Element && menu.contains(target) && target.closest("button, input, textarea, select")) return;
      event.preventDefault();
      playCue("chime");
      enterLab();
      return;
    }
    if (phase === "note" && event.key === "Escape" && !event.repeat) {
      event.preventDefault();
      playCue("back");
      showActions();
      return;
    }
    if (phase === "maker" && event.key === "Escape" && !event.repeat) {
      event.preventDefault();
      playCue("back");
      showActions();
    }
  });

  const revealSplash = (): void => {
    if (phase !== "boot") return;
    phase = "splash";
    root.hidden = false;
    root.classList.add("is-splash");
    splash.focus();
    const black = reduceMotion ? 160 : BLACK_MS;
    const logo = reduceMotion ? 0 : LOGO_FADE_MS;
    const settle = reduceMotion ? 120 : LOGO_SETTLE_MS;
    const hold = reduceMotion ? 700 : PROMPT_HOLD_MS;
    later(black, () => {
      if (phase === "splash") root.classList.add("is-logo");
    });
    later(black + logo + settle, () => {
      if (phase === "splash") root.classList.add("is-prompt");
    });
    later(black + logo + settle + hold, () => showMenu());
  };

  const tickLyrics = (): void => {
    if (phase === "lab") return;
    const reprise = (THEME_TRACKS[themeIndex] ?? "").startsWith("Micronauts in the Void (Reprise)");
    const on = lyricsArmed && reprise && (phase === "menu" || phase === "note");
    lyrics.sync(on ? theme.currentTime : 0, on);
    requestAnimationFrame(tickLyrics);
  };
  requestAnimationFrame(tickLyrics);

  const boot = document.getElementById("boot");
  if (!boot || boot.classList.contains("is-done")) {
    revealSplash();
    return;
  }
  const observer = new MutationObserver(() => {
    if (!boot.isConnected || boot.classList.contains("is-done")) {
      observer.disconnect();
      revealSplash();
    }
  });
  observer.observe(boot, { attributes: true, attributeFilter: ["class"] });
  observer.observe(document.body, { childList: true });
}
