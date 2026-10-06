/// <reference types="vite/client" />

import { GENES } from "./genes";
import { playCue } from "./uiSound";

type CodexEntry = {
  id: string;
  title: string;
  category: string;
  body: string[];
  label?: string;
  meta?: string;
};

function isEntry(value: unknown): value is CodexEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.title === "string" &&
    entry.title.length > 0 &&
    typeof entry.category === "string" &&
    entry.category.length > 0 &&
    Array.isArray(entry.body) &&
    entry.body.length > 0 &&
    entry.body.every((part) => typeof part === "string" && part.length > 0)
  );
}

function loadEntries(): CodexEntry[] {
  const loaded = import.meta.glob("../../../Codex/*.json", { eager: true, import: "default" });
  const entries: CodexEntry[] = [];
  const seen = new Set<string>();
  for (const [file, value] of Object.entries(loaded)) {
    if (!isEntry(value)) throw new Error(`invalid codex entry: ${file}`);
    if (seen.has(value.id)) throw new Error(`duplicate codex id: ${value.id}`);
    seen.add(value.id);
    entries.push(value);
  }
  for (const gene of GENES) {
    if (seen.has(gene.id)) throw new Error(`duplicate codex id: ${gene.id}`);
    seen.add(gene.id);
    const description = gene.description.trim();
    entries.push({
      id: gene.id,
      title: gene.name,
      category: "Genes",
      label: gene.category,
      meta: `${gene.category}  ${gene.id}`,
      body: [description || "No description yet."],
    });
  }
  entries.sort((a, b) => a.title.localeCompare(b.title));
  return entries;
}

export function initCodex(): void {
  const list = document.querySelector<HTMLUListElement>("#codex-list");
  const search = document.querySelector<HTMLInputElement>("#codex-search");
  const categories = document.querySelector<HTMLElement>("#codex-categories");
  const empty = document.querySelector<HTMLElement>("#codex-empty");
  const detail = document.querySelector<HTMLElement>("#codex-detail");
  if (!list || !search || !categories || !empty || !detail) throw new Error("missing codex");

  const entries = loadEntries();
  const buttons: HTMLButtonElement[] = [];
  const items: HTMLLIElement[] = [];
  let selected: HTMLButtonElement | null = null;
  let categoryFilter = "";

  const showEmpty = (): void => {
    selected = null;
    detail.classList.add("is-empty");
    const message = document.createElement("p");
    message.className = "genome-detail-empty";
    message.textContent = "Select an entry";
    detail.replaceChildren(message);
  };

  const showEntry = (entry: CodexEntry): void => {
    detail.classList.remove("is-empty");
    const name = document.createElement("h3");
    name.className = "genome-detail-name";
    name.textContent = entry.title;
    const meta = document.createElement("p");
    meta.className = "genome-detail-meta";
    meta.textContent = entry.meta ?? entry.category;
    const paragraphs = entry.body.map((text) => {
      const copy = document.createElement("p");
      copy.className = "genome-detail-copy";
      copy.textContent = text;
      return copy;
    });
    detail.replaceChildren(name, meta, ...paragraphs);
  };

  const selectEntry = (entry: CodexEntry, button: HTMLButtonElement): void => {
    if (selected) selected.setAttribute("aria-pressed", "false");
    selected = button;
    button.setAttribute("aria-pressed", "true");
    showEntry(entry);
  };

  for (const entry of entries) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "genome-gene";
    button.setAttribute("aria-pressed", "false");
    const name = document.createElement("span");
    name.className = "genome-gene-name";
    name.textContent = entry.title;
    button.append(name);
    if (entry.label) {
      const label = document.createElement("span");
      label.className = "genome-gene-category";
      label.textContent = entry.label;
      button.append(label);
    }
    button.addEventListener("click", () => {
      selectEntry(entry, button);
      playCue("select");
    });
    buttons.push(button);
    items.push(item);
    item.append(button);
    list.append(item);
  }

  const categoryNames = [...new Set(entries.map((entry) => entry.category))].sort((a, b) => a.localeCompare(b));
  const categoryTabs: HTMLButtonElement[] = [];
  const applyFilter = (pickFirst: boolean): void => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    let firstVisible: { entry: CodexEntry; button: HTMLButtonElement } | null = null;
    let selectedVisible = false;
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const item = items[index];
      const button = buttons[index];
      if (!entry || !item || !button) continue;
      const haystack = `${entry.title} ${entry.label ?? ""} ${entry.meta ?? ""} ${entry.id} ${entry.body.join(" ")}`.toLowerCase();
      const textMatch = query.length === 0 || haystack.includes(query);
      const match = entry.category === categoryFilter && textMatch;
      item.hidden = !match;
      if (!match) continue;
      shown += 1;
      if (!firstVisible) firstVisible = { entry, button };
      if (button === selected) selectedVisible = true;
    }
    empty.hidden = shown > 0;
    if (selectedVisible && !pickFirst) return;
    if (firstVisible) selectEntry(firstVisible.entry, firstVisible.button);
    else {
      if (selected) selected.setAttribute("aria-pressed", "false");
      showEmpty();
    }
  };
  for (const category of categoryNames) {
    const item = document.createElement("li");
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "genome-gene";
    tab.role = "tab";
    tab.setAttribute("aria-selected", "false");
    tab.setAttribute("aria-pressed", "false");
    const name = document.createElement("span");
    name.className = "genome-gene-name";
    name.textContent = category;
    tab.append(name);
    tab.addEventListener("click", () => {
      if (categoryFilter === category) return;
      categoryFilter = category;
      for (const other of categoryTabs) {
        const on = other === tab;
        other.setAttribute("aria-selected", String(on));
        other.setAttribute("aria-pressed", String(on));
      }
      applyFilter(true);
      playCue("tab");
    });
    categoryTabs.push(tab);
    item.append(tab);
    categories.append(item);
  }

  search.addEventListener("input", () => applyFilter(false));

  const firstCategory = categoryNames[0];
  const firstTab = categoryTabs[0];
  if (firstCategory && firstTab) {
    categoryFilter = firstCategory;
    firstTab.setAttribute("aria-selected", "true");
    firstTab.setAttribute("aria-pressed", "true");
    applyFilter(true);
  }
}
