/** Timed lines for Micronauts in the Void (Reprise). Times are seconds in that recording. */

type LyricLine = { start: number; end: number; text: string; thanks?: boolean; marker?: boolean };

const sung = (text: string, start: string, end: string): LyricLine => ({
  text,
  start: clock(start),
  end: clock(end),
});

const marker = (text: string, start: string, end: string): LyricLine => ({
  text,
  start: clock(start),
  end: clock(end),
  marker: true,
});

/** m:ss from the lyric sheet. */
const clock = (value: string): number => {
  const [minutes, seconds] = value.split(":");
  return Number(minutes) * 60 + Number(seconds);
};

const LINES: LyricLine[] = [
  marker("(Verse 1)", "0:02", "0:06"),
  sung("Floating in the void so small,", "0:06", "0:11"),
  sung("Atoms dance, and rise and fall,", "0:12", "0:17"),
  sung("Whispers in the cosmic sea,", "0:19", "0:23"),
  sung("Micronauts, just you and me.", "0:26", "0:30"),
  sung("Through the microcosmos we soar,", "0:32", "0:36"),
  sung("Vistas never seen before.", "0:38", "0:42"),
  sung("Crystals form like ancient lore,", "0:44", "0:49"),
  sung("Tiny worlds to explore.", "0:50", "0:53"),
  marker("(Chorus)", "0:53", "0:56"),
  sung("In the depths of unseen realms,", "0:56", "1:00"),
  sung("Navigate with fearless helms,", "1:03", "1:07"),
  sung("Micro worlds alive with grace,", "1:09", "1:13"),
  sung("Floating in this secret space.", "1:15", "1:18"),
  marker("(Verse 2)", "1:18", "1:24"),
  sung("Cells collide in a glowing dance,", "1:24", "1:29"),
  sung("Endless cycles, in a trance,", "1:31", "1:35"),
  sung("Molecules with hidden plans,", "1:37", "1:43"),
  sung("Life unfolds in random strands.", "1:44", "1:47"),
  marker("(Bridge)", "1:47", "1:50"),
  sung("Atoms whisper tales untold,", "1:50", "1:54"),
  sung("Microscopic tales of bold", "1:56", "2:01"),
  sung("Journies in this vast expanse,", "2:02", "2:05"),
  sung("Tiny heroes take their chance.", "2:08", "2:12"),
  marker("(Verse 3)", "2:12", "2:14"),
  sung("Through the void we drift and sway", "2:14", "2:19"),
  sung("Find our path and light our way.", "2:21", "2:25"),
  sung("Infinite and yet confined,", "2:27", "2:32"),
  sung("Micronauts of curious...", "2:33", "2:35"),
  sung("Mind!", "2:36", "2:40"),
  marker("(Synth Solo)", "2:40", "2:45"),
  { start: 165, end: 173, text: "Thank you for playing Prokaryon.", thanks: true },
  { start: 173, end: 181, text: "Also thank you to my wife Katherine,", thanks: true },
  { start: 181, end: 189, text: "who supported me in my Ph.D. and in", thanks: true },
  { start: 189, end: 197, text: "the development of this game.", thanks: true },
  { start: 197, end: 205, text: "I love you Kat.", thanks: true },
];

const STEP = 52;

type Row = { row: HTMLElement; words: HTMLElement[]; chars: number };

export function createLyricScroll(host: HTMLElement): { sync(time: number, on: boolean): void } {
  const track = document.createElement("div");
  track.className = "menu-lyric-track";
  const rows: Row[] = LINES.map((line) => {
    const row = document.createElement("p");
    row.className = line.marker ? "menu-lyric is-marker is-off" : "menu-lyric is-off";
    const words: HTMLElement[] = [];
    for (const part of line.text.split(/(\s+)/)) {
      const span = document.createElement("span");
      if (/^\s+$/.test(part)) {
        span.className = "menu-lyric-gap";
        span.textContent = part;
      } else {
        span.className = "menu-lyric-word";
        span.style.setProperty("--fill", "0%");
        const base = document.createElement("span");
        base.className = "menu-lyric-base";
        base.textContent = part;
        const light = document.createElement("span");
        light.className = "menu-lyric-light";
        const lit = document.createElement("span");
        lit.textContent = part;
        light.append(lit);
        span.append(base, light);
        words.push(span);
      }
      row.append(span);
    }
    track.append(row);
    return { row, words, chars: words.reduce((sum, word) => sum + (word.querySelector(".menu-lyric-base")?.textContent?.length ?? 0), 0) };
  });
  host.append(track);

  let shown = false;

  const paint = (word: HTMLElement, fill: number): void => {
    word.style.setProperty("--fill", `${(Math.min(1, Math.max(0, fill)) * 100).toFixed(1)}%`);
  };

  const fillLine = (index: number, time: number): void => {
    const line = LINES[index];
    const row = rows[index];
    if (!line || !row) return;
    const span = Math.max(0.05, line.end - line.start);
    const progress = Math.min(1, Math.max(0, (time - line.start) / span));
    if (line.thanks || line.marker) {
      for (const word of row.words) paint(word, progress >= 0.04 ? 1 : 0);
      return;
    }
    const target = progress * row.chars;
    let seen = 0;
    for (const word of row.words) {
      const count = word.querySelector(".menu-lyric-base")?.textContent?.length ?? 0;
      paint(word, (target - seen) / Math.max(1, count));
      seen += count;
    }
  };

  return {
    sync(time: number, on: boolean): void {
      const reveal = on && !shown;
      host.hidden = !on;
      shown = on;
      if (!on) return;
      if (reveal) {
        for (const row of rows) row.row.style.transition = "none";
      }
      let index = -1;
      for (let i = 0; i < LINES.length; i += 1) {
        if (time >= LINES[i].start) index = i;
      }
      rows.forEach((row, i) => {
        const rel = i - index;
        const y = rel < -1 ? -STEP : rel > 1 ? STEP * 3 : (rel + 1) * STEP;
        row.row.style.transform = `translateY(${y}px)`;
        row.row.classList.toggle("is-prev", rel === -1);
        row.row.classList.toggle("is-active", rel === 0);
        row.row.classList.toggle("is-next", rel === 1);
        row.row.classList.toggle("is-off", rel < -1 || rel > 1);
        if (rel === -1) {
          for (const word of row.words) paint(word, 1);
        } else if (rel !== 0) {
          for (const word of row.words) paint(word, 0);
        }
      });
      if (index >= 0) fillLine(index, time);
      if (reveal) {
        requestAnimationFrame(() => {
          for (const row of rows) row.row.style.transition = "";
        });
      }
    },
  };
}
