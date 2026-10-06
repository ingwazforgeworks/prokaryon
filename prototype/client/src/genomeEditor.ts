import {
  amountById,
  amountRange,
  autoIdentity,
  behaviorLine,
  clearDraft,
  clearPart,
  draftProblems,
  dropTargets,
  geneById,
  getDraft,
  getGenome,
  insertDraft,
  persistGenome,
  placePart,
  promoterById,
  regulatoryIcon,
  removeCassette,
  scalarResponse,
  geneAcceptsRoute,
  setDraftCode,
  setDraftName,
  tagRole,
  slotAccepts,
  subscribeDraft,
  subscribeGenome,
  tagById,
  unlockedAmounts,
  unlockedGenes,
  unlockedPromoters,
  unlockedTags,
  type CatalogPart,
  type Draft,
  type ScalarResponse,
  type Slot,
} from "./genomeState";
import { uiScale } from "./settings";
import { subscribeUnlocks } from "./geneUnlocks";
import { playCue } from "./uiSound";

type TrayTab = "promoter" | "amount" | "gene" | "route" | "site";

/** Pointer travel before a stage press counts as a pan instead of a click. */
const PAN_DRAG_THRESHOLD = 4;
/** Extra travel past the overflowed edge so the end slots are not glued to the border. */
const PAN_SLACK = 32;

type PanDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

export function initGenomeEditor(): void {
  const root = document.querySelector<HTMLElement>("#genome-editor-pane");
  const host = document.querySelector<HTMLElement>("#gene-editor");
  if (!root || !host) throw new Error("missing genome editor");

  let tab: TrayTab = "promoter";
  const queries: Record<TrayTab, string> = { promoter: "", amount: "", gene: "", route: "", site: "" };
  const scrolls: Record<TrayTab, number> = { promoter: 0, amount: 0, gene: 0, route: 0, site: 0 };
  let selectedSlot: Slot | null = null;
  let selectedPart: CatalogPart | null = null;
  let status = "";
  let busy = false;

  root.className = "genome-editor";
  root.replaceChildren();

  const main = document.createElement("div");
  main.className = "editor-main";
  const bench = document.createElement("section");
  bench.className = "editor-bench";
  bench.setAttribute("aria-label", "Construct assembly");
  const identity = document.createElement("div");
  identity.className = "editor-identity";
  const benchBar = document.createElement("div");
  benchBar.className = "editor-bench-bar";
  const benchName = nameInput("Gene name");
  const nameLabel = fieldLabel("GENE NAME:", benchName);
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "editor-clear";
  clear.textContent = "Clear";
  const auto = document.createElement("button");
  auto.type = "button";
  auto.className = "editor-auto";
  auto.textContent = "Auto";
  auto.title = "Generate name and code from placed parts";
  auto.setAttribute("aria-label", "Auto-generate gene name and code");
  nameLabel.append(auto);
  benchBar.append(nameLabel, clear);
  const codeInput = document.createElement("input");
  codeInput.className = "editor-code";
  codeInput.maxLength = 5;
  codeInput.autocomplete = "off";
  codeInput.spellcheck = false;
  codeInput.autocapitalize = "characters";
  const codeLabel = fieldLabel("GENE CODE:", codeInput);
  identity.append(benchBar, codeLabel);
  const stage = document.createElement("div");
  stage.className = "editor-stage";
  const stageWorld = document.createElement("div");
  stageWorld.className = "editor-stage-world";
  const track = document.createElement("div");
  track.className = "editor-track";
  const behavior = document.createElement("p");
  behavior.className = "editor-behavior";
  stageWorld.append(track, behavior);
  const resetView = document.createElement("button");
  resetView.type = "button";
  resetView.className = "editor-stage-reset genome-scroll-step";
  resetView.textContent = "◎";
  resetView.title = "Reset view";
  resetView.setAttribute("aria-label", "Reset view");
  stage.append(stageWorld, resetView);
  bench.append(identity, stage);

  const tray = document.createElement("section");
  tray.className = "editor-tray";
  tray.setAttribute("aria-label", "Parts");
  const trayBar = document.createElement("div");
  trayBar.className = "editor-tray-bar";
  const tabs = document.createElement("div");
  tabs.className = "editor-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Part kinds");
  const tabButtons = new Map<TrayTab, HTMLButtonElement>();
  for (const entry of [
    ["promoter", "Promoters"],
    ["amount", "Amount"],
    ["gene", "Genes"],
    ["route", "Destination"],
    ["site", "Position"],
  ] as const) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "editor-tab";
    button.setAttribute("role", "tab");
    button.textContent = entry[1];
    button.addEventListener("click", () => {
      selectTab(entry[0]);
    });
    tabButtons.set(entry[0], button);
    tabs.append(button);
  }
  const searchWrap = document.createElement("div");
  searchWrap.className = "genome-search editor-search";
  const search = document.createElement("input");
  search.type = "search";
  search.placeholder = "Search parts...";
  search.setAttribute("aria-label", "Search parts");
  search.autocomplete = "off";
  search.spellcheck = false;
  search.addEventListener("input", () => {
    queries[tab] = search.value;
    renderCards();
  });
  searchWrap.append(search);
  trayBar.append(tabs, searchWrap);
  const cards = document.createElement("div");
  cards.className = "editor-cards";
  cards.addEventListener("scroll", () => {
    scrolls[tab] = cards.scrollLeft;
  });
  cards.addEventListener("wheel", (event) => {
    const max = cards.scrollWidth - cards.clientWidth;
    if (max <= 0) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;
    const next = Math.min(max, Math.max(0, cards.scrollLeft + delta));
    if (next === cards.scrollLeft) return;
    cards.scrollLeft = next;
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });
  tray.append(trayBar, cards);
  main.append(bench, tray);

  const aside = document.createElement("aside");
  aside.className = "editor-inspector";
  aside.setAttribute("aria-label", "Construct and selection");
  const constructPane = document.createElement("section");
  constructPane.className = "editor-pane editor-construct";
  const constructLabel = document.createElement("p");
  constructLabel.className = "editor-kicker";
  constructLabel.textContent = "Construct";
  const inspect = document.createElement("div");
  inspect.className = "editor-inspect";
  const response = document.createElement("div");
  response.className = "editor-response";
  const problems = document.createElement("p");
  problems.className = "editor-problems";
  const statusLine = document.createElement("p");
  statusLine.className = "editor-status";
  statusLine.setAttribute("role", "status");
  statusLine.setAttribute("aria-live", "polite");
  const actions = document.createElement("div");
  actions.className = "editor-actions";
  const add = document.createElement("button");
  add.type = "button";
  add.className = "editor-add";
  add.textContent = "Add to genome";
  actions.append(add);
  constructPane.append(constructLabel, inspect, response, problems, statusLine, actions);
  const selectionPane = document.createElement("section");
  selectionPane.className = "editor-pane editor-selection";
  selectionPane.setAttribute("aria-label", "Selected tile");
  const selectionLabel = document.createElement("p");
  selectionLabel.className = "editor-kicker";
  selectionLabel.textContent = "Selected";
  const selected = document.createElement("div");
  selected.className = "editor-inspect";
  selectionPane.append(selectionLabel, selected);
  aside.append(constructPane, selectionPane);
  root.append(main, aside);

  const preview = document.createElement("div");
  preview.className = "editor-drag";
  preview.hidden = true;
  document.body.append(preview);

  benchName.addEventListener("input", () => setDraftName(benchName.value));
  codeInput.addEventListener("input", () => {
    const caret = codeInput.selectionStart ?? codeInput.value.length;
    setDraftCode(codeInput.value);
    const code = getDraft().code;
    if (codeInput.value === code) return;
    codeInput.value = code;
    const next = Math.min(code.length, caret);
    codeInput.setSelectionRange(next, next);
  });
  clear.addEventListener("click", () => {
    status = "Construct cleared.";
    selectedSlot = null;
    clearDraft();
    playCue("back");
  });
  auto.addEventListener("click", () => {
    const identity = autoIdentity();
    if (!identity) {
      status = "Place a coding region before generating a name.";
      render();
      playCue("deny");
      return;
    }
    setDraftName(identity.name);
    setDraftCode(identity.code);
    status = "Generated name and gene code.";
    render();
    playCue("select");
  });
  add.addEventListener("click", () => {
    void addToGenome();
  });
  host.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  let panX = 0;
  let panY = 0;
  let panMoved = false;
  let panDrag: PanDrag | null = null;

  const applyPan = (): void => {
    stageWorld.style.transform = `translate(${panX}px, ${panY}px)`;
  };

  // Panning only exists while the world overflows the stage; the slack lets
  // the end slots clear the border instead of stopping flush against it.
  const panBounds = (): { maxX: number; maxY: number } => {
    const styles = window.getComputedStyle(stage);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const padY = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    const overflowX = Math.max(0, stageWorld.offsetWidth - (stage.clientWidth - padX));
    const overflowY = Math.max(0, stageWorld.offsetHeight - (stage.clientHeight - padY));
    return {
      maxX: overflowX > 0 ? overflowX / 2 + PAN_SLACK : 0,
      maxY: overflowY > 0 ? overflowY / 2 + PAN_SLACK : 0,
    };
  };

  const clampPan = (): void => {
    const { maxX, maxY } = panBounds();
    panX = Math.min(maxX, Math.max(-maxX, panX));
    panY = Math.min(maxY, Math.max(-maxY, panY));
    applyPan();
  };

  resetView.addEventListener("click", () => {
    panX = 0;
    panY = 0;
    applyPan();
    playCue("select");
  });

  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest(".editor-stage-reset")) return;
    panMoved = false;
    panDrag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: panX, originY: panY, moved: false };
  });

  stage.addEventListener("pointermove", (event) => {
    const drag = panDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < PAN_DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      stage.classList.add("is-panning");
      try {
        stage.setPointerCapture(event.pointerId);
      } catch {
        // Capture only guarantees event delivery; the pan still works without it.
      }
    }
    const { maxX, maxY } = panBounds();
    panX = Math.min(maxX, Math.max(-maxX, drag.originX + (event.clientX - drag.startX) / uiScale()));
    panY = Math.min(maxY, Math.max(-maxY, drag.originY + (event.clientY - drag.startY) / uiScale()));
    applyPan();
  });

  const endPan = (event: PointerEvent): void => {
    const drag = panDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    panDrag = null;
    stage.classList.remove("is-panning");
    if (drag.moved) panMoved = true;
  };
  stage.addEventListener("pointerup", endPan);
  stage.addEventListener("pointercancel", endPan);

  // A finished pan ends as a click on whatever slot is under the pointer; swallow it.
  stage.addEventListener("click", (event) => {
    if (!panMoved) return;
    panMoved = false;
    event.stopPropagation();
    event.preventDefault();
  }, true);

  stage.addEventListener("wheel", (event) => {
    const { maxX, maxY } = panBounds();
    if (maxX <= 0 && maxY <= 0) return;
    const nextX = Math.min(maxX, Math.max(-maxX, panX + event.deltaX));
    const nextY = Math.min(maxY, Math.max(-maxY, panY + event.deltaY));
    if (nextX === panX && nextY === panY) return;
    panX = nextX;
    panY = nextY;
    applyPan();
    event.preventDefault();
    event.stopPropagation();
  }, { passive: false });

  const panObserver = new ResizeObserver(() => clampPan());
  panObserver.observe(stage);
  panObserver.observe(stageWorld);

  const render = (): void => {
    syncIdentity();
    renderTrack();
    renderInspect();
    renderSelection();
    renderActions();
    renderCards();
    syncTabs();
  };

  subscribeDraft(render);
  subscribeGenome(() => render());
  subscribeUnlocks(() => renderCards());
  render();

  function syncIdentity(): void {
    const value = getDraft();
    if (document.activeElement !== benchName) benchName.value = value.name;
    if (document.activeElement !== codeInput) codeInput.value = value.code;
  }

  function renderTrack(): void {
    const value = getDraft();
    const range = amountRange(value.promoterId);
    track.replaceChildren(
      partModule("promoter", "Promoter", value.promoterId),
      joint("editor-joint-a"),
      range
        ? amountStack(partModule("amount-min", "Min amount", value.amountMinId), partModule("amount-max", "Max amount", value.amountMaxId))
        : partModule("amount", "Amount", value.amountId),
      joint("editor-joint-b"),
      partModule("coding", "Coding region", value.geneId),
      joint("editor-joint-c"),
      tagModule("route", "Destination", value.routeId, false),
      joint("editor-joint-d"),
      tagModule("site", "Position", value.siteId, value.routeId === "CYTO"),
    );
    behavior.textContent = behaviorLine(value);
  }

  /** Range promoters stack min over max so the gap between them sits on the row centerline. */
  function amountStack(min: HTMLElement, max: HTMLElement): HTMLElement {
    const stack = document.createElement("div");
    stack.className = "editor-amount-stack";
    stack.append(min, max);
    return stack;
  }

  function partModule(slot: Exclude<Slot, "tag">, label: string, id: string | null): HTMLElement {
    const record = !id
      ? undefined
      : slot === "promoter"
        ? promoterById(id)
        : slot === "coding"
          ? geneById(id)
          : amountById(id);
    const icon = !id
      ? null
      : slot === "coding"
        ? `/ui/genome_viewer/proteins/individuals_32x32/${id}.png`
        : regulatoryIcon(id);
    return slotFrame(slot, label, record?.name ?? null, icon);
  }

  function tagModule(slot: "route" | "site", label: string, id: string | null, locked: boolean): HTMLElement {
    const tag = id ? tagById(id) : undefined;
    return slotFrame(slot, label, tag?.name ?? null, id ? regulatoryIcon(id) : null, locked);
  }

  function slotFrame(slot: Slot, label: string, installed: string | null, iconUrl: string | null = null, locked = false): HTMLElement {
    const frame = document.createElement("button");
    frame.type = "button";
    frame.className = `editor-slot editor-${slot}${installed ? "" : " is-empty"}${selectedSlot === slot ? " is-selected" : ""}${locked ? " is-locked" : ""}`;
    frame.dataset.slot = slot;
    frame.setAttribute("aria-label", installed ? `${label}: ${installed}` : `Empty ${label}`);
    const kind = document.createElement("span");
    kind.className = "editor-slot-kind";
    kind.textContent = label;
    frame.append(kind);
    if (iconUrl) frame.append(regulatoryMark(iconUrl));
    if (installed) {
      const name = document.createElement("span");
      name.className = "editor-slot-name";
      name.textContent = installed;
      name.title = installed;
      frame.append(name);
    }
    if (installed) {
      const remove = document.createElement("span");
      remove.className = "editor-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove ${installed}`);
      remove.addEventListener("click", (event) => {
        event.stopPropagation();
        clearPart(slot);
        playCue("close");
      });
      frame.append(remove);
    }
    frame.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest(".editor-remove")) return;
      selectedSlot = slot;
      selectTab(slotTab(slot));
      render();
    });
    return frame;
  }

  function joint(place: string): HTMLElement {
    const node = document.createElement("span");
    node.className = `editor-joint ${place}`;
    node.setAttribute("aria-hidden", "true");
    return node;
  }

  function renderInspect(): void {
    const value = getDraft();
    const gene = value.geneId ? geneById(value.geneId) : undefined;
    const promoter = value.promoterId ? promoterById(value.promoterId) : undefined;
    const route = value.routeId ? tagById(value.routeId) : undefined;
    const site = value.siteId ? tagById(value.siteId) : undefined;
    inspect.replaceChildren();
    const frame = document.createElement("figure");
    frame.className = "editor-protein";
    if (gene) {
      const image = document.createElement("img");
      image.src = `/ui/genome_viewer/proteins/individuals/${gene.id}.png`;
      image.alt = gene.name;
      frame.append(image);
    }
    const name = document.createElement("h3");
    name.className = "editor-gene-name";
    name.textContent = gene?.name ?? "No coding region";
    name.title = gene?.name ?? "";
    const meta = document.createElement("p");
    meta.className = "editor-meta";
    meta.textContent = gene ? `${gene.category} · ${gene.id}` : "Coding region";
    const copy = document.createElement("p");
    copy.className = "editor-copy";
    copy.textContent = gene?.description ?? promoter?.description ?? "Choose a promoter and a coding region.";
    const activation = field("Activation", promoter?.activation ?? "None", promoter ? regulatoryIcon(promoter.id) : null);
    const localizationName = [route?.name, site?.name].filter((name): name is string => Boolean(name)).join(" · ");
    const localization = field("Localization", localizationName || "None", route ? regulatoryIcon(route.id) : site ? regulatoryIcon(site.id) : null);
    inspect.append(frame, name, meta, copy, activation, ...amountInspectorFields(value), localization);

    response.replaceChildren();
    const curve = scalarResponse(value.promoterId);
    if (curve) {
      const heading = document.createElement("p");
      heading.className = "editor-kicker";
      heading.textContent = "Expression response";
      const canvas = document.createElement("canvas");
      canvas.className = "editor-graph";
      canvas.width = 180;
      canvas.height = 72;
      response.append(heading, canvas);
      paintResponse(canvas, curve);
    } else if (promoter) {
      const note = document.createElement("p");
      note.className = "editor-copy";
      note.textContent = promoter.id === "CNST"
        ? "Fixed strength. This promoter has no input axis to graph."
        : promoter.id === "COND"
          ? "No scalar curve. Expression follows a receptor condition, which is not parameterized."
          : "No scalar curve is stored for this promoter yet.";
      response.append(note);
    }
  }

  function amountInspectorFields(value: Draft): HTMLParagraphElement[] {
    if (amountRange(value.promoterId)) {
      const min = value.amountMinId ? amountById(value.amountMinId) : undefined;
      const max = value.amountMaxId ? amountById(value.amountMaxId) : undefined;
      return [
        ...(min ? [field("Min amount", min.name, regulatoryIcon(min.id))] : []),
        ...(max ? [field("Max amount", max.name, regulatoryIcon(max.id))] : []),
      ];
    }
    const single = value.amountId ? amountById(value.amountId) : undefined;
    return single ? [field("Amount", single.name, regulatoryIcon(single.id))] : [];
  }

  function partKey(part: CatalogPart): string {
    return `${part.kind}:${part.id}`;
  }

  function partKindLabel(part: CatalogPart): string {
    if (part.kind === "promoter") return "Promoter";
    if (part.kind === "amount") return "Amount";
    if (part.kind === "gene") return "Gene";
    return tagRole(part.id) === "site" ? "Position" : "Destination";
  }

  function renderSelection(): void {
    selected.replaceChildren();
    const part = selectedPart;
    if (!part) {
      const empty = document.createElement("p");
      empty.className = "editor-copy";
      empty.textContent = "Hover a tile.";
      selected.append(empty);
      return;
    }
    const frame = document.createElement("figure");
    frame.className = part.kind === "gene" ? "editor-protein" : "editor-protein editor-protein-mark";
    const image = document.createElement("img");
    image.src = part.kind === "gene" ? `/ui/genome_viewer/proteins/individuals/${part.id}.png` : part.icon;
    image.alt = "";
    frame.append(image);
    const name = document.createElement("h3");
    name.className = "editor-gene-name";
    name.textContent = part.name;
    name.title = part.name;
    const meta = document.createElement("p");
    meta.className = "editor-meta";
    meta.textContent = part.kind === "gene" ? `Gene · ${part.id}` : partKindLabel(part);
    const copy = document.createElement("p");
    copy.className = "editor-copy";
    copy.textContent = part.description;
    selected.append(frame, name, meta, copy);
    if (part.kind === "promoter") {
      const promoter = promoterById(part.id);
      if (promoter) selected.append(field("Activation", promoter.activation, regulatoryIcon(promoter.id)));
    } else if (part.kind === "tag") {
      const tag = tagById(part.id);
      if (tag) selected.append(field(partKindLabel(part), tag.destination, regulatoryIcon(tag.id)));
    } else {
      const gene = geneById(part.id);
      if (gene) selected.append(field("Category", gene.category));
    }
  }

  function renderActions(): void {
    const reasons = draftProblems();
    problems.textContent = reasons.join(" ");
    problems.hidden = reasons.length === 0;
    add.disabled = busy || reasons.length > 0;
    statusLine.textContent = status;
    statusLine.hidden = status.length === 0;
  }

  function renderCards(): void {
    const parts = filteredParts();
    cards.replaceChildren();
    if (parts.length === 0) {
      const empty = document.createElement("p");
      empty.className = "editor-cards-empty";
      empty.textContent = "No parts match";
      cards.append(empty);
      return;
    }
    for (const part of parts) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "editor-card";
      card.dataset.part = partKey(part);
      const label = part.kind === "gene" ? part.id : part.name;
      card.title = part.kind === "gene" ? `${part.name} (${part.id})` : part.summary ? `${part.name} — ${part.summary}` : part.name;
      card.setAttribute("aria-label", part.kind === "gene" ? `${part.name}, ${part.id}` : part.name);
      if (part.kind === "tag" && tagRole(part.id) === "route" && !geneAcceptsRoute(getDraft().geneId, part.id)) {
        card.classList.add("is-dimmed");
        card.title = `${card.title} — not a valid destination for this gene`;
      }
      const icon = document.createElement("img");
      icon.src = part.icon;
      icon.alt = "";
      icon.width = 32;
      icon.height = 32;
      icon.draggable = false;
      const name = document.createElement("span");
      name.className = "editor-card-name";
      name.textContent = label;
      card.append(icon, name);
      card.addEventListener("pointerenter", () => {
        selectedPart = part;
        renderSelection();
        playCue("hover");
      });
      card.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        beginDrag(card, part, event);
      });
      cards.append(card);
    }
    cards.scrollLeft = scrolls[tab];
  }

  function beginDrag(card: HTMLButtonElement, part: CatalogPart, event: PointerEvent): void {
    const pointerId = event.pointerId;
    const originX = event.clientX;
    const originY = event.clientY;
    const home = card.getBoundingClientRect();
    const grabX = event.clientX - home.left;
    const grabY = event.clientY - home.top;
    let dragging = false;
    card.setPointerCapture(pointerId);
    card.classList.add("is-holding");
    markTargets(part, true);
    const move = (moveEvent: PointerEvent): void => {
      if (moveEvent.pointerId !== pointerId) return;
      if (!dragging && Math.hypot(moveEvent.clientX - originX, moveEvent.clientY - originY) < 4) return;
      if (!dragging) {
        dragging = true;
        card.classList.add("is-source");
        showPreview(part, home);
      }
      movePreview(moveEvent.clientX - grabX, moveEvent.clientY - grabY);
      markDrop(part, moveEvent.clientX - grabX + home.width / 2, moveEvent.clientY - grabY + home.height / 2, moveEvent.clientX, moveEvent.clientY);
    };
    const finish = (endEvent: PointerEvent): void => {
      if (endEvent.pointerId !== pointerId) return;
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerup", finish);
      card.removeEventListener("pointercancel", finish);
      card.classList.remove("is-holding", "is-source");
      const slot = dragging
        ? dropSlot(part, endEvent.clientX - grabX + home.width / 2, endEvent.clientY - grabY + home.height / 2, endEvent.clientX, endEvent.clientY)
        : null;
      hidePreview();
      markTargets(part, false);
      if (!slot) {
        if (dragging) playCue("deny");
        return;
      }
      placePart(slot, part.id);
      selectedSlot = slot;
      playCue("select");
    };
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerup", finish);
    card.addEventListener("pointercancel", finish);
  }

  function filteredParts(): CatalogPart[] {
    const all =
      tab === "promoter"
        ? unlockedPromoters()
        : tab === "amount"
          ? unlockedAmounts()
          : tab === "gene"
            ? unlockedGenes()
            : unlockedTags(tab);
    const query = queries[tab].trim().toLowerCase();
    if (query.length === 0) return all;
    return all.filter((part) => `${part.name} ${part.summary} ${part.description} ${part.id}`.toLowerCase().includes(query));
  }

  function syncTabs(): void {
    for (const [kind, button] of tabButtons) {
      button.setAttribute("aria-selected", String(kind === tab));
    }
  }

  function selectTab(next: TrayTab): void {
    if (tab === next) return;
    scrolls[tab] = cards.scrollLeft;
    tab = next;
    search.value = queries[tab];
    renderCards();
    syncTabs();
    playCue("tab");
  }

  function slotTab(slot: Slot): TrayTab {
    if (slot === "promoter") return "promoter";
    if (slot === "amount" || slot === "amount-min" || slot === "amount-max") return "amount";
    if (slot === "coding") return "gene";
    if (slot === "route") return "route";
    return "site";
  }

  async function addToGenome(): Promise<void> {
    if (busy) return;
    const reasons = draftProblems();
    if (reasons.length > 0) {
      status = reasons.join(" ");
      render();
      playCue("deny");
      return;
    }
    playCue("button");
    busy = true;
    renderActions();
    const before = getGenome().length;
    const result = insertDraft();
    if ("problems" in result || getGenome().length !== before + 1) {
      busy = false;
      status = "problems" in result ? result.problems.join(" ") : "Genome was not changed.";
      render();
      playCue("deny");
      return;
    }
    const saved = await persistGenome();
    if (!saved) {
      removeCassette(result.cassette.uid);
      status = "Genome was not changed. The save failed.";
      playCue("alarm");
    } else {
      status = `Added ${result.cassette.name} to the genome.`;
      playCue("success");
    }
    busy = false;
    render();
  }

  function showPreview(part: CatalogPart, home: DOMRect): void {
    preview.replaceChildren();
    const icon = document.createElement("img");
    icon.src = part.icon;
    icon.alt = "";
    icon.draggable = false;
    const name = document.createElement("span");
    name.textContent = part.kind === "gene" ? part.id : part.name;
    preview.append(icon, name);
    const scale = uiScale();
    preview.style.width = `${home.width / scale}px`;
    preview.style.height = `${home.height / scale}px`;
    preview.hidden = false;
    movePreview(home.left, home.top);
  }

  function movePreview(x: number, y: number): void {
    preview.style.transform = `scale(${uiScale()})`;
    preview.style.transformOrigin = "top left";
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
  }

  function dropSlot(part: CatalogPart, centerX: number, centerY: number, pointerX: number, pointerY: number): Slot | null {
    const hits = [slotAt(centerX, centerY), slotAt(pointerX, pointerY)];
    for (const slot of hits) {
      if (slot && slotAccepts(slot, part.id)) return slot;
    }
    return null;
  }

  function markDrop(part: CatalogPart, centerX: number, centerY: number, pointerX: number, pointerY: number): void {
    const slot = dropSlot(part, centerX, centerY, pointerX, pointerY);
    const nodes = track.querySelectorAll<HTMLElement>("[data-slot]");
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.item(index);
      if (!node) continue;
      node.classList.toggle("is-drop", node.dataset.slot === slot);
    }
  }

  function hidePreview(): void {
    preview.hidden = true;
    preview.replaceChildren();
    const nodes = track.querySelectorAll<HTMLElement>("[data-slot]");
    for (let index = 0; index < nodes.length; index += 1) nodes.item(index)?.classList.remove("is-drop");
  }

  function markTargets(part: CatalogPart, active: boolean): void {
    const slots = dropTargets(part.id);
    track.classList.toggle("is-aiming", active);
    const nodes = track.querySelectorAll<HTMLElement>("[data-slot]");
    for (let index = 0; index < nodes.length; index += 1) {
      const node = nodes.item(index);
      if (!node) continue;
      node.classList.toggle("is-target", active && slots.includes(node.dataset.slot as Slot));
    }
  }
}

function fieldLabel(text: string, control: HTMLElement): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "editor-field-label";
  label.append(text, control);
  return label;
}

function nameInput(label: string): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "editor-name";
  input.maxLength = 48;
  input.setAttribute("aria-label", label);
  input.autocomplete = "off";
  input.spellcheck = false;
  return input;
}

function field(label: string, value: string, iconUrl: string | null = null): HTMLParagraphElement {
  const row = document.createElement("p");
  row.className = "editor-field";
  const name = document.createElement("span");
  name.textContent = label;
  const text = document.createElement("span");
  text.className = "editor-field-value";
  if (iconUrl) text.append(regulatoryMark(iconUrl));
  const words = document.createElement("span");
  words.textContent = value;
  text.append(words);
  text.title = value;
  row.append(name, text);
  return row;
}

function regulatoryMark(src: string): HTMLImageElement {
  const image = document.createElement("img");
  image.className = "editor-regulatory";
  image.src = src;
  image.alt = "";
  image.width = 32;
  image.height = 32;
  image.draggable = false;
  return image;
}

function slotAt(x: number, y: number): Slot | null {
  const hit = document.elementFromPoint(x, y);
  const slot = hit instanceof Element ? hit.closest<HTMLElement>("[data-slot]")?.dataset.slot : undefined;
  if (
    slot === "promoter" ||
    slot === "amount" ||
    slot === "amount-min" ||
    slot === "amount-max" ||
    slot === "coding" ||
    slot === "route" ||
    slot === "site"
  ) {
    return slot;
  }
  return null;
}

function paintResponse(canvas: HTMLCanvasElement, curve: ScalarResponse): void {
  const context = canvas.getContext("2d");
  if (!context || curve.samples.length < 2) return;
  const width = canvas.width;
  const height = canvas.height;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  context.strokeStyle = "rgba(138, 164, 162, 0.45)";
  context.strokeRect(8.5, 8.5, width - 18, height - 22);
  context.strokeStyle = "#e2a04a";
  context.beginPath();
  curve.samples.forEach((sample, index) => {
    const x = 8 + (index / (curve.samples.length - 1)) * (width - 18);
    const y = 8 + (1 - Math.min(1, Math.max(0, sample))) * (height - 22);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  context.fillStyle = "#8aa4a2";
  context.font = "11px 'Departure Mono', ui-monospace, monospace";
  context.fillText(curve.input, 8, height - 2);
}
