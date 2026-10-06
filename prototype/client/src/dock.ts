import { titleScreenOpen } from "./menu";
import { playCue } from "./uiSound";

export type DockTab = "genome" | "gene-editor" | "expression" | "environment" | "codex" | "tech-tree";

const HOTKEYS: Partial<Record<string, DockTab>> = {
  KeyG: "genome",
  KeyX: "gene-editor",
  KeyE: "expression",
  KeyV: "environment",
  KeyC: "codex",
  KeyT: "tech-tree",
};

const environmentListeners = new Set<(visible: boolean) => void>();

/** Dissolved-nutrient plumes follow the Environment dock button. */
export function onEnvironmentVisible(listener: (visible: boolean) => void): void {
  environmentListeners.add(listener);
}

export function initDock(): void {
  const dock = document.querySelector<HTMLElement>("#dock");
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".dock-tab"));
  const viewer = document.querySelector<HTMLElement>("#genome-viewer");
  const viewerClose = document.querySelector<HTMLButtonElement>("#genome-viewer-close");
  const geneEditor = document.querySelector<HTMLElement>("#gene-editor");
  const geneEditorClose = document.querySelector<HTMLButtonElement>("#gene-editor-close");
  const codex = document.querySelector<HTMLElement>("#codex");
  const codexClose = document.querySelector<HTMLButtonElement>("#codex-close");
  const tech = document.querySelector<HTMLElement>("#tech-tree");
  const techClose = document.querySelector<HTMLButtonElement>("#tech-tree-close");
  const expression = document.querySelector<HTMLElement>("#expression");
  const expressionClose = document.querySelector<HTMLButtonElement>("#expression-close");
  if (!dock || tabs.length !== 6 || !viewer || !viewerClose || !geneEditor || !geneEditorClose || !codex || !codexClose || !tech || !techClose || !expression || !expressionClose) {
    throw new Error("missing section dock");
  }

  let open: "genome" | "gene-editor" | "codex" | "tech-tree" | "expression" | null = null;
  let environmentOn = false;

  const setPressed = (tab: DockTab | null): void => {
    for (const button of tabs) {
      const dock = button.dataset.dock;
      const on = dock === "environment" ? environmentOn : dock === tab;
      button.setAttribute("aria-pressed", on ? "true" : "false");
    }
  };

  const setEnvironment = (next: boolean): void => {
    if (environmentOn === next) return;
    environmentOn = next;
    setPressed(open);
    for (const listener of environmentListeners) listener(environmentOn);
  };

  const setOpen = (next: "genome" | "gene-editor" | "codex" | "tech-tree" | "expression" | null): void => {
    open = next;
    viewer.hidden = next !== "genome";
    geneEditor.hidden = next !== "gene-editor";
    codex.hidden = next !== "codex";
    tech.hidden = next !== "tech-tree";
    expression.hidden = next !== "expression";
    if (next) setPressed(next);
    else setPressed(null);
  };

  const select = (tab: DockTab): void => {
    if (tab === "genome" || tab === "gene-editor" || tab === "codex" || tab === "tech-tree" || tab === "expression") {
      setOpen(open === tab ? null : tab);
      return;
    }
    setEnvironment(!environmentOn);
  };

  viewerClose.addEventListener("click", () => {
    setOpen(null);
    playCue("close");
  });
  geneEditorClose.addEventListener("click", () => {
    setOpen(null);
    playCue("close");
  });
  codexClose.addEventListener("click", () => {
    setOpen(null);
    playCue("close");
  });
  techClose.addEventListener("click", () => {
    setOpen(null);
    playCue("close");
  });
  expressionClose.addEventListener("click", () => {
    setOpen(null);
    playCue("close");
  });

  for (const button of tabs) {
    button.addEventListener("pointerenter", () => playCue("hover"));
    button.addEventListener("click", () => {
      const tab = button.dataset.dock;
      if (!isDockTab(tab)) return;
      select(tab);
      playCue("tab");
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
    playCue("tab");
  });
}

function isDockTab(value: string | undefined): value is DockTab {
  return (
    value === "genome" ||
    value === "gene-editor" ||
    value === "expression" ||
    value === "environment" ||
    value === "codex" ||
    value === "tech-tree"
  );
}
