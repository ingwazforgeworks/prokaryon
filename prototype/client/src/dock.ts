import { titleScreenOpen } from "./menu";
import { createUiSound, playUiSound, UI_HOVER, UI_SELECT } from "./uiSound";

export type DockTab = "genome" | "expression" | "environment" | "codex" | "tech-tree";

const HOTKEYS: Partial<Record<string, DockTab>> = {
  KeyG: "genome",
  KeyE: "expression",
  KeyV: "environment",
  KeyC: "codex",
  KeyT: "tech-tree",
};

const HOVER_SOUND = UI_HOVER;
const CLICK_SOUND = UI_SELECT;

export function initDock(): void {
  const dock = document.querySelector<HTMLElement>("#dock");
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".dock-tab"));
  const viewer = document.querySelector<HTMLElement>("#genome-viewer");
  const viewerClose = document.querySelector<HTMLButtonElement>("#genome-viewer-close");
  const codex = document.querySelector<HTMLElement>("#codex");
  const codexClose = document.querySelector<HTMLButtonElement>("#codex-close");
  const tech = document.querySelector<HTMLElement>("#tech-tree");
  const techClose = document.querySelector<HTMLButtonElement>("#tech-tree-close");
  const expression = document.querySelector<HTMLElement>("#expression");
  const expressionClose = document.querySelector<HTMLButtonElement>("#expression-close");
  if (!dock || tabs.length !== 5 || !viewer || !viewerClose || !codex || !codexClose || !tech || !techClose || !expression || !expressionClose) {
    throw new Error("missing section dock");
  }

  const hoverSound = createUiSound(HOVER_SOUND);
  const clickSound = createUiSound(CLICK_SOUND);
  let open: "genome" | "codex" | "tech-tree" | "expression" | null = null;

  const setPressed = (tab: DockTab | null): void => {
    for (const button of tabs) {
      button.setAttribute("aria-pressed", button.dataset.dock === tab ? "true" : "false");
    }
  };

  const setOpen = (next: "genome" | "codex" | "tech-tree" | "expression" | null): void => {
    open = next;
    viewer.hidden = next !== "genome";
    codex.hidden = next !== "codex";
    tech.hidden = next !== "tech-tree";
    expression.hidden = next !== "expression";
    if (next) setPressed(next);
    else setPressed(null);
  };

  const select = (tab: DockTab): void => {
    if (tab === "genome" || tab === "codex" || tab === "tech-tree" || tab === "expression") {
      setOpen(open === tab ? null : tab);
      return;
    }
    setOpen(null);
    setPressed(tab);
  };

  viewerClose.addEventListener("click", () => {
    setOpen(null);
    playUiSound(clickSound);
  });
  codexClose.addEventListener("click", () => {
    setOpen(null);
    playUiSound(clickSound);
  });
  techClose.addEventListener("click", () => {
    setOpen(null);
    playUiSound(clickSound);
  });
  expressionClose.addEventListener("click", () => {
    setOpen(null);
    playUiSound(clickSound);
  });

  for (const button of tabs) {
    button.addEventListener("pointerenter", () => playUiSound(hoverSound));
    button.addEventListener("click", () => {
      const tab = button.dataset.dock;
      if (!isDockTab(tab)) return;
      select(tab);
      playUiSound(clickSound);
    });
  }

  window.addEventListener("keydown", (event) => {
    if (titleScreenOpen()) return;
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
      return;
    }
    const tab = HOTKEYS[event.code];
    if (!tab) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    select(tab);
    playUiSound(clickSound);
  });
}

function isDockTab(value: string | undefined): value is DockTab {
  return value === "genome" || value === "expression" || value === "environment" || value === "codex" || value === "tech-tree";
}
