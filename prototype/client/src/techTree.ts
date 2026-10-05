import { GENES, type GeneRecord } from "./genes";
import { uiScale } from "./settings";
import { createUiSound, playUiSound, UI_SELECT } from "./uiSound";

const NODE_W = 56;
const NODE_H = 64;
const COL = 76;
const ROW = 100;
const GRID_ROW = 76;
const ICON_URL = "/ui/genome_viewer/proteins/named/individuals_32x32";
const GROUP_PAD_X = 16;
const GROUP_PAD_TOP = 28;
const GROUP_PAD_BOTTOM = 14;
const GROUP_GAP = 36;
const LABEL_H = 22;
const FREE_ROWS = 8;
const MIN_SCALE = 0.28;
const MAX_SCALE = 2.2;
const DRAG_THRESHOLD = 5;

type EdgeKind = "unlocks" | "required";

type TechEdge = {
  from: string;
  to: string;
  kind: EdgeKind;
};

type TechEntry = {
  name: string;
  category: string;
  description: string;
  code: string;
};

type TechNode = {
  id: string;
  geneId: string | null;
  x: number;
  y: number;
  w?: number;
  h?: number;
  groupKey?: string;
  label?: string;
  entry?: TechEntry;
};

type TechGroup = {
  key: string;
  label: string;
  accent: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type TechLabel = {
  key: string;
  text: string;
  x: number;
  y: number;
};

const ACCENT: Record<string, string> = {
  Metabolism: "#6fbf7a",
  Homeostasis: "#e2a04a",
  Morphology: "#8fb4d4",
  Motility: "#3ec4c0",
  Perception: "#e2d36a",
  Regulation: "#b48ad4",
  Reproduction: "#d46a6a",
  Promoter: "#b48ad4",
};

const EDGES: TechEdge[] = [
  { from: "ATPS", to: "OXDR", kind: "unlocks" },
  { from: "ATPS", to: "SLFR", kind: "unlocks" },
  { from: "ATPS", to: "FLGN", kind: "required" },
  { from: "ATPS", to: "FLGM", kind: "required" },
  { from: "NITP", to: "NITA", kind: "unlocks" },
  { from: "NITP", to: "CHLS", kind: "unlocks" },
  { from: "NITP", to: "PHYS", kind: "unlocks" },
  { from: "CHLS", to: "RXNC", kind: "unlocks" },
  { from: "RHDS", to: "PHOR", kind: "unlocks" },
  { from: "CRTS", to: "PHPR", kind: "unlocks" },
  { from: "RHDS", to: "PCHR", kind: "unlocks" },
  { from: "CRTS", to: "PCHR", kind: "unlocks" },
  { from: "CHLS", to: "PCHR", kind: "unlocks" },
  { from: "PHYS", to: "PCHR", kind: "unlocks" },
  { from: "CHLS", to: "RFP", kind: "unlocks" },
  { from: "PHYS", to: "GFP", kind: "unlocks" },
  { from: "RHDS", to: "YFP", kind: "unlocks" },
  { from: "CHLS", to: "BFP", kind: "unlocks" },
  { from: "CRTS", to: "BFP", kind: "unlocks" },
  { from: "CBXP", to: "GLYS", kind: "required" },
  { from: "RDCD", to: "GLYS", kind: "unlocks" },
  { from: "RXNC", to: "GLYS", kind: "unlocks" },
  { from: "GRNS", to: "GRNH", kind: "unlocks" },
  { from: "FLGN", to: "FLGM", kind: "unlocks" },
  { from: "FLGM", to: "TAXR", kind: "required" },
  { from: "PCHR", to: "TAXR", kind: "unlocks" },
  { from: "CHMR", to: "TAXR", kind: "unlocks" },
  { from: "THMR", to: "TAXR", kind: "unlocks" },
  { from: "OSMR", to: "TAXR", kind: "unlocks" },
  { from: "PRTR", to: "TAXR", kind: "unlocks" },
  { from: "RDXN", to: "TAXR", kind: "unlocks" },
  { from: "QURR", to: "TAXR", kind: "unlocks" },
  { from: "DMGR", to: "TAXR", kind: "unlocks" },
  { from: "PHVC", to: "TAXR", kind: "unlocks" },
  { from: "HSP", to: "MSAT", kind: "unlocks" },
  { from: "CSP", to: "MSAT", kind: "required" },
  { from: "CSP", to: "MDES", kind: "unlocks" },
  { from: "HSP", to: "MDES", kind: "required" },
  { from: "HSP", to: "OXDT", kind: "unlocks" },
  { from: "CSP", to: "OXDT", kind: "required" },
  { from: "MSAT", to: "AQUP", kind: "unlocks" },
  { from: "MDES", to: "AQUP", kind: "unlocks" },
  { from: "MSAT", to: "PPMP", kind: "unlocks" },
  { from: "MDES", to: "PPMP", kind: "unlocks" },
  { from: "AQUP", to: "OSMS", kind: "unlocks" },
  { from: "PPMP", to: "ACDT", kind: "unlocks" },
  { from: "OXDT", to: "REPR", kind: "unlocks" },
  { from: "REPR", to: "DEFN", kind: "unlocks" },
  { from: "DEFN", to: "LYSR", kind: "unlocks" },
  { from: "HSP", to: "PHPR", kind: "required" },
  { from: "CSP", to: "PHPR", kind: "required" },
  { from: "HSP", to: "SIDS", kind: "required" },
  { from: "CSP", to: "SIDS", kind: "required" },
  { from: "BUOY", to: "FLOA", kind: "unlocks" },
  { from: "BUOY", to: "BALA", kind: "unlocks" },
  { from: "REPX", to: "MEML", kind: "unlocks" },
  { from: "CONJ", to: "PLSM", kind: "unlocks" },
  { from: "COMP", to: "PLSM", kind: "unlocks" },
];

let requirementEdges: TechEdge[] = EDGES.map((edge) => ({ ...edge }));

// col is the unlock generation, drawn downward. row is the sibling lane, drawn across.
const TREE_GROUPS: { label: string; accent: string; nodes: { id: string; col: number; row: number }[] }[] = [
  {
    label: "Respiration",
    accent: ACCENT.Metabolism,
    nodes: [
      { id: "ATPS", col: 0, row: 0.5 },
      { id: "OXDR", col: 1, row: 0 },
      { id: "SLFR", col: 1, row: 1 },
    ],
  },
  {
    label: "Nitrogen and chlorophyll",
    accent: ACCENT.Metabolism,
    nodes: [
      { id: "NITP", col: 0, row: 1 },
      { id: "NITA", col: 1, row: 0 },
      { id: "CHLS", col: 1, row: 1 },
      { id: "PHYS", col: 1, row: 2 },
      { id: "RXNC", col: 2, row: 1 },
    ],
  },
  {
    label: "Pigments and light",
    accent: ACCENT.Perception,
    nodes: [
      { id: "RHDS", col: 0, row: 0 },
      { id: "CRTS", col: 0, row: 1 },
      { id: "PHOR", col: 1, row: 0 },
      { id: "PHPR", col: 1, row: 1 },
      { id: "PCHR", col: 2, row: 0.5 },
    ],
  },
  {
    label: "Body pigments",
    accent: ACCENT.Morphology,
    nodes: [
      { id: "RFP", col: 0, row: 0 },
      { id: "GFP", col: 0, row: 1 },
      { id: "YFP", col: 0, row: 2 },
      { id: "BFP", col: 0, row: 3 },
      { id: "SIDS", col: 0, row: 4 },
    ],
  },
  {
    label: "Homeostasis",
    accent: ACCENT.Homeostasis,
    nodes: [
      { id: "HSP", col: 0, row: 0 },
      { id: "CSP", col: 0, row: 2 },
      { id: "MSAT", col: 1, row: 0 },
      { id: "OXDT", col: 1, row: 1 },
      { id: "MDES", col: 1, row: 2 },
      { id: "AQUP", col: 2, row: 0 },
      { id: "REPR", col: 2, row: 1 },
      { id: "PPMP", col: 2, row: 2 },
      { id: "OSMS", col: 3, row: 0 },
      { id: "ACDT", col: 3, row: 2 },
      { id: "DEFN", col: 4, row: 2 },
      { id: "LYSR", col: 5, row: 2 },
    ],
  },
  {
    label: "Carbon fixation",
    accent: ACCENT.Metabolism,
    nodes: [
      { id: "CBXP", col: 0, row: 0 },
      { id: "RDCD", col: 0, row: 1 },
      { id: "GLYS", col: 1, row: 0.5 },
    ],
  },
  {
    label: "Storage",
    accent: ACCENT.Metabolism,
    nodes: [
      { id: "GRNS", col: 0, row: 0 },
      { id: "GRNH", col: 1, row: 0 },
    ],
  },
  {
    label: "Motility",
    accent: ACCENT.Motility,
    nodes: [
      { id: "FLGN", col: 0, row: 0 },
      { id: "FLGM", col: 1, row: 0 },
      { id: "CHMR", col: 1, row: 1 },
      { id: "THMR", col: 1, row: 2 },
      { id: "OSMR", col: 1, row: 3 },
      { id: "PRTR", col: 1, row: 4 },
      { id: "RDXN", col: 1, row: 5 },
      { id: "QURR", col: 1, row: 6 },
      { id: "DMGR", col: 1, row: 7 },
      { id: "PHVC", col: 1, row: 8 },
      { id: "TAXR", col: 2, row: 4 },
    ],
  },
  {
    label: "Buoyancy",
    accent: ACCENT.Motility,
    nodes: [
      { id: "BUOY", col: 0, row: 0.5 },
      { id: "FLOA", col: 1, row: 0 },
      { id: "BALA", col: 1, row: 1 },
    ],
  },
  {
    label: "Regulation",
    accent: ACCENT.Regulation,
    nodes: [
      { id: "REPX", col: 0, row: 0 },
      { id: "MEML", col: 1, row: 0 },
    ],
  },
  {
    label: "Gene transfer",
    accent: ACCENT.Reproduction,
    nodes: [
      { id: "CONJ", col: 0, row: 0 },
      { id: "COMP", col: 0, row: 1 },
      { id: "PLSM", col: 1, row: 0.5 },
    ],
  },
];

const LABEL_NODE_W = 148;
const LABEL_NODE_H = 32;
const LABEL_ROW = 76;

const REGULATORY_EDGES: TechEdge[] = [
  { from: "CNST", to: "COND", kind: "unlocks" },
  { from: "COND", to: "OPTG", kind: "unlocks" },
];

type TechLayout = {
  worldW: number;
  worldH: number;
  groups: TechGroup[];
  nodes: TechNode[];
  labels: TechLabel[];
};

type PlacedGroup = {
  key: string;
  el: HTMLElement;
  nodeIds: string[];
  w: number;
  h: number;
};

type PlacedHeading = {
  key: string;
  el: HTMLElement;
};

type TreeBoard = {
  world: HTMLElement;
  tab: HTMLButtonElement;
  buttons: Map<string, HTMLButtonElement>;
  paths: SVGPathElement[];
  byNode: Map<string, TechNode>;
  groups: PlacedGroup[];
  headings: PlacedHeading[];
  svg: SVGSVGElement;
  edges: TechEdge[];
  names: Map<string, string>;
  camX: number;
  camY: number;
  camScale: number;
  selectedId: string | null;
  selectedGroupKey: string | null;
  emptyText: string;
  detailLabel: string;
  viewportLabel: string;
};

type MoveDrag =
  | { kind: "pan"; x: number; y: number; camX: number; camY: number; moved: boolean; nodeId: string | null }
  | { kind: "node"; x: number; y: number; id: string; originX: number; originY: number; moved: boolean }
  | {
      kind: "group";
      x: number;
      y: number;
      key: string;
      originX: number;
      originY: number;
      members: { id: string; originX: number; originY: number }[];
      moved: boolean;
    }
  | { kind: "heading"; x: number; y: number; key: string; originX: number; originY: number; moved: boolean }
  | { kind: "line"; x: number; y: number; nodeId: string; moved: boolean };

export function initTechTree(): void {
  void mountTechTree();
}

async function mountTechTree(): Promise<void> {
  const viewer = document.querySelector<HTMLElement>("#tech-tree");
  const viewport = document.querySelector<HTMLElement>("#tech-viewport");
  const functionalWorld = document.querySelector<HTMLElement>("#tech-world");
  const regulatoryWorld = document.querySelector<HTMLElement>("#tech-world-regulatory");
  const functionalTab = document.querySelector<HTMLButtonElement>("#tech-mode-functional");
  const regulatoryTab = document.querySelector<HTMLButtonElement>("#tech-mode-regulatory");
  const detail = document.querySelector<HTMLElement>("#tech-detail");
  const zoomOut = document.querySelector<HTMLButtonElement>("#tech-zoom-out");
  const zoomIn = document.querySelector<HTMLButtonElement>("#tech-zoom-in");
  if (!viewer || !viewport || !functionalWorld || !regulatoryWorld || !functionalTab || !regulatoryTab || !detail || !zoomOut || !zoomIn) {
    throw new Error("missing tech tree");
  }

  const arrangeButton = document.querySelector<HTMLButtonElement>("#tech-arrange");
  const saveLayoutButton = document.querySelector<HTMLButtonElement>("#tech-layout-save");
  const renameButton = document.querySelector<HTMLButtonElement>("#tech-rename");
  const deleteButton = document.querySelector<HTMLButtonElement>("#tech-delete");
  const newCategoryButton = document.querySelector<HTMLButtonElement>("#tech-new-category");
  const newNodeButton = document.querySelector<HTMLButtonElement>("#tech-new-node");
  const unlockLineButton = document.querySelector<HTMLButtonElement>("#tech-draw-unlock");
  const requiredLineButton = document.querySelector<HTMLButtonElement>("#tech-draw-required");
  const nameInput = document.querySelector<HTMLInputElement>("#tech-edit-name");
  const selectionNote = document.querySelector<HTMLElement>("#tech-selection");
  const layoutStatus = document.querySelector<HTMLElement>("#tech-layout-status");
  if (!arrangeButton || !saveLayoutButton || !renameButton || !deleteButton || !newCategoryButton || !newNodeButton || !unlockLineButton || !requiredLineButton || !nameInput || !selectionNote || !layoutStatus) {
    throw new Error("missing tech tree layout controls");
  }

  const clickSound = createUiSound(UI_SELECT);
  const genesById = new Map(GENES.map((gene) => [gene.id, gene]));
  const savedLayout = await loadTechLayout();
  let functionalLayout = buildTechLayout(genesById);
  let regulatoryLayout = buildRegulatoryLayout();
  let regulatoryEdges = REGULATORY_EDGES.map((edge) => ({ ...edge }));
  if (savedLayout?.v === 2) {
    const functionalSaved = layoutFromSaved(savedLayout.functional, genesById);
    const regulatorySaved = layoutFromSaved(savedLayout.regulatory, genesById);
    functionalLayout = functionalSaved.layout;
    regulatoryLayout = regulatorySaved.layout;
    requirementEdges = functionalSaved.edges;
    regulatoryEdges = regulatorySaved.edges;
  } else if (savedLayout?.v === 1) {
    applySavedLayout(functionalLayout, savedLayout.functional);
    applySavedLayout(regulatoryLayout, savedLayout.regulatory);
  }
  const functional = boardFrom(functionalWorld, functionalTab, functionalLayout, requirementEdges, genesById, {
    emptyText: "Select a gene",
    detailLabel: "Gene information",
    viewportLabel: "Functional tech tree",
  });
  const regulatory = boardFrom(regulatoryWorld, regulatoryTab, regulatoryLayout, regulatoryEdges, genesById, {
    emptyText: "Select a promoter",
    detailLabel: "Promoter information",
    viewportLabel: "Regulatory tech tree",
  });
  const boards = [functional, regulatory];
  let active = functional;
  let fitted = false;
  let arranging = false;
  let lineMode: EdgeKind | null = null;
  let lineFrom: string | null = null;
  let drag: MoveDrag | null = null;

  const applyCamera = (): void => {
    active.world.style.transform = `translate(${active.camX}px, ${active.camY}px) scale(${active.camScale})`;
  };

  const zoomAt = (clientX: number, clientY: number, nextScale: number): void => {
    const rect = viewport.getBoundingClientRect();
    const px = (clientX - rect.left) / uiScale();
    const py = (clientY - rect.top) / uiScale();
    const worldX = (px - active.camX) / active.camScale;
    const worldY = (py - active.camY) / active.camScale;
    active.camScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    active.camX = px - worldX * active.camScale;
    active.camY = py - worldY * active.camScale;
    applyCamera();
  };

  const showEmpty = (board: TreeBoard): void => {
    detail.classList.add("is-empty");
    detail.setAttribute("aria-label", board.detailLabel);
    const empty = document.createElement("p");
    empty.className = "genome-detail-empty";
    empty.id = "tech-detail-empty";
    empty.textContent = board.emptyText;
    detail.replaceChildren(empty);
  };

  const showDetail = (board: TreeBoard, node: TechNode): void => {
    detail.classList.remove("is-empty");
    detail.setAttribute("aria-label", board.detailLabel);
    const gene = node.geneId ? genesById.get(node.geneId) : undefined;
    const name = document.createElement("h3");
    name.className = "genome-detail-name";
    name.textContent = nodeTitle(node, genesById);
    const meta = document.createElement("p");
    meta.className = "genome-detail-meta";
    const category = gene?.category ?? node.entry?.category ?? "";
    const code = gene?.id ?? node.entry?.code ?? node.id;
    meta.textContent = category ? `${category}  ${code}` : code;
    const copy = document.createElement("p");
    copy.className = "genome-detail-copy";
    copy.textContent = gene?.description ?? node.entry?.description ?? "This node is ready for an assignment.";
    const incoming = board.edges.filter((edge) => edge.to === node.id);
    const outgoing = board.edges.filter((edge) => edge.from === node.id);
    const blocks: HTMLElement[] = [name, meta, copy];
    if (incoming.length > 0 || outgoing.length > 0) {
      blocks.push(relationBlock("Prerequisites", incoming, "from", board.names));
      blocks.push(relationBlock("Unlocks", outgoing, "to", board.names));
    } else {
      const none = document.createElement("p");
      none.className = "genome-detail-meta";
      none.textContent = "No unlock edges";
      blocks.push(none);
    }
    detail.replaceChildren(...blocks);
  };

  const showTree = (board: TreeBoard): void => {
    if (active === board) return;
    for (const other of boards) other.world.hidden = other !== board;
    for (const other of boards) other.tab.setAttribute("aria-selected", other === board ? "true" : "false");
    active = board;
    viewport.setAttribute("aria-label", board.viewportLabel);
    applyCamera();
    if (board.selectedId) {
      const node = board.byNode.get(board.selectedId);
      if (node) showDetail(board, node);
      else showEmpty(board);
    } else if (board.selectedGroupKey) {
      const group = board.groups.find((item) => item.key === board.selectedGroupKey);
      if (group) selectGroup(group.key, true);
    } else {
      showEmpty(board);
    }
    refreshSelection();
  };

  const refreshSelection = (): void => {
    if (active.selectedId) {
      const node = active.byNode.get(active.selectedId);
      const title = node ? nodeTitle(node, genesById) : active.selectedId;
      selectionNote.textContent = `Node: ${title}`;
      if (document.activeElement !== nameInput && node) nameInput.value = nodeCard(node, genesById);
      return;
    }
    if (active.selectedGroupKey) {
      const group = active.groups.find((item) => item.key === active.selectedGroupKey);
      const label = group?.el.querySelector(".tech-group-label")?.textContent ?? "Category";
      selectionNote.textContent = `Category: ${label}`;
      if (document.activeElement !== nameInput) nameInput.value = label;
      return;
    }
    selectionNote.textContent = "Nothing selected";
  };

  const clearGroupSelection = (board: TreeBoard): void => {
    board.selectedGroupKey = null;
    for (const group of board.groups) group.el.classList.remove("is-selected");
  };

  const selectNode = (id: string): void => {
    const node = active.byNode.get(id);
    const button = active.buttons.get(id);
    if (!node || !button) return;
    clearGroupSelection(active);
    if (active.selectedId) active.buttons.get(active.selectedId)?.setAttribute("aria-pressed", "false");
    active.selectedId = id;
    button.setAttribute("aria-pressed", "true");
    for (const path of active.paths) {
      path.classList.toggle("is-lit", path.dataset.from === id || path.dataset.to === id);
    }
    showDetail(active, node);
    refreshSelection();
    playUiSound(clickSound);
  };

  const selectGroup = (key: string, quiet = false): void => {
    const group = active.groups.find((item) => item.key === key);
    if (!group) return;
    if (active.selectedId) active.buttons.get(active.selectedId)?.setAttribute("aria-pressed", "false");
    active.selectedId = null;
    for (const path of active.paths) path.classList.remove("is-lit");
    for (const item of active.groups) item.el.classList.toggle("is-selected", item.key === key);
    active.selectedGroupKey = key;
    const label = group.el.querySelector(".tech-group-label")?.textContent ?? "Category";
    detail.classList.remove("is-empty");
    const name = document.createElement("h3");
    name.className = "genome-detail-name";
    name.textContent = label;
    const meta = document.createElement("p");
    meta.className = "genome-detail-meta";
    meta.textContent = "Category";
    const copy = document.createElement("p");
    copy.className = "genome-detail-copy";
    copy.textContent = `${group.nodeIds.length} nodes`;
    detail.replaceChildren(name, meta, copy);
    refreshSelection();
    if (!quiet) playUiSound(clickSound);
  };

  functionalTab.addEventListener("click", () => {
    if (active === functional) return;
    showTree(functional);
    playUiSound(clickSound);
  });
  regulatoryTab.addEventListener("click", () => {
    if (active === regulatory) return;
    showTree(regulatory);
    playUiSound(clickSound);
  });
  arrangeButton.addEventListener("click", () => {
    arranging = !arranging;
    arrangeButton.classList.toggle("active", arranging);
    arrangeButton.setAttribute("aria-pressed", String(arranging));
    viewport.classList.toggle("is-arranging", arranging);
    layoutStatus.textContent = arranging ? "Drag nodes and categories" : "";
    playUiSound(clickSound);
  });
  saveLayoutButton.addEventListener("click", () => {
    layoutStatus.textContent = "Saving…";
    playUiSound(clickSound);
    void saveTechLayout(functional, regulatory).then((ok) => {
      layoutStatus.textContent = ok ? "Saved" : "Save failed";
    });
  });

  const clearLineSource = (): void => {
    lineFrom = null;
    for (const board of boards) {
      for (const button of board.buttons.values()) button.classList.remove("is-line-source");
    }
  };

  const setLineMode = (kind: EdgeKind): void => {
    lineMode = lineMode === kind ? null : kind;
    clearLineSource();
    unlockLineButton.classList.toggle("active", lineMode === "unlocks");
    requiredLineButton.classList.toggle("active", lineMode === "required");
    unlockLineButton.setAttribute("aria-pressed", String(lineMode === "unlocks"));
    requiredLineButton.setAttribute("aria-pressed", String(lineMode === "required"));
    layoutStatus.textContent = lineMode ? "Click the parent node, then the child" : "";
    playUiSound(clickSound);
  };

  const pickLine = (id: string): void => {
    if (!lineMode) return;
    const button = active.buttons.get(id);
    if (!button) return;
    if (!lineFrom) {
      lineFrom = id;
      button.classList.add("is-line-source");
      selectNode(id);
      layoutStatus.textContent = "Parent set. Click the child node";
      return;
    }
    if (lineFrom === id) {
      clearLineSource();
      layoutStatus.textContent = "Click the parent node, then the child";
      return;
    }
    const result = setEdge(active, lineFrom, id, lineMode);
    clearLineSource();
    selectNode(id);
    layoutStatus.textContent =
      result === "added" ? "Line added" : result === "updated" ? "Line changed" : result === "removed" ? "Line removed" : "Choose two different nodes";
  };

  const editedName = (): string => nameInput.value.trim();

  renameButton.addEventListener("click", () => {
    const name = editedName();
    if (!name) {
      layoutStatus.textContent = "Enter a name";
      return;
    }
    if (active.selectedId) {
      renameNode(active, genesById, active.selectedId, name);
      if (active.selectedId) showDetail(active, active.byNode.get(active.selectedId)!);
      refreshSelection();
      layoutStatus.textContent = "Renamed node";
    } else if (active.selectedGroupKey) {
      renameGroup(active, active.selectedGroupKey, name);
      selectGroup(active.selectedGroupKey, true);
      layoutStatus.textContent = "Renamed category";
    } else {
      layoutStatus.textContent = "Select a category or node";
      return;
    }
    playUiSound(clickSound);
  });
  deleteButton.addEventListener("click", () => {
    if (active.selectedId) {
      const id = active.selectedId;
      deleteNode(active, id);
      showEmpty(active);
      refreshSelection();
      layoutStatus.textContent = "Deleted node";
    } else if (active.selectedGroupKey) {
      deleteGroup(active, active.selectedGroupKey);
      showEmpty(active);
      refreshSelection();
      layoutStatus.textContent = "Deleted category";
    } else {
      layoutStatus.textContent = "Select a category or node";
      return;
    }
    playUiSound(clickSound);
  });
  newCategoryButton.addEventListener("click", () => {
    const name = editedName();
    if (!name) {
      layoutStatus.textContent = "Enter a name";
      return;
    }
    const key = createCategory(active, viewport, name);
    selectGroup(key);
    layoutStatus.textContent = "Category created";
  });
  newNodeButton.addEventListener("click", () => {
    const name = editedName();
    if (!name) {
      layoutStatus.textContent = "Enter a name";
      return;
    }
    const created = createNode(active, genesById, viewport, name);
    if (!created) {
      layoutStatus.textContent = `${name} is already on this tree`;
      return;
    }
    selectNode(created);
    layoutStatus.textContent = "Node created";
  });
  unlockLineButton.addEventListener("click", () => setLineMode("unlocks"));
  requiredLineButton.addEventListener("click", () => setLineMode("required"));

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest(".tech-zoom") || target?.closest(".tech-modes")) return;
    const nodeId = target?.closest<HTMLButtonElement>(".tech-node")?.dataset.nodeId ?? null;
    const headingKey = target?.closest<HTMLElement>(".tech-category")?.dataset.labelKey ?? null;
    const groupKey = target?.closest<HTMLElement>(".tech-group")?.dataset.groupKey ?? null;
    if (lineMode && nodeId && active.byNode.has(nodeId)) {
      drag = { kind: "line", x: event.clientX, y: event.clientY, nodeId, moved: false };
    } else if (arranging && nodeId && active.byNode.has(nodeId)) {
      const node = active.byNode.get(nodeId)!;
      drag = { kind: "node", x: event.clientX, y: event.clientY, id: nodeId, originX: node.x, originY: node.y, moved: false };
    } else if (arranging && headingKey && active.headings.some((heading) => heading.key === headingKey)) {
      const heading = active.headings.find((item) => item.key === headingKey)!;
      drag = {
        kind: "heading",
        x: event.clientX,
        y: event.clientY,
        key: headingKey,
        originX: parseFloat(heading.el.style.left) || 0,
        originY: parseFloat(heading.el.style.top) || 0,
        moved: false,
      };
    } else if (arranging && groupKey) {
      const group = active.groups.find((item) => item.key === groupKey);
      if (!group) return;
      drag = {
        kind: "group",
        x: event.clientX,
        y: event.clientY,
        key: groupKey,
        originX: parseFloat(group.el.style.left) || 0,
        originY: parseFloat(group.el.style.top) || 0,
        members: group.nodeIds.flatMap((id) => {
          const node = active.byNode.get(id);
          return node ? [{ id, originX: node.x, originY: node.y }] : [];
        }),
        moved: false,
      };
    } else {
      drag = {
        kind: "pan",
        x: event.clientX,
        y: event.clientY,
        camX: active.camX,
        camY: active.camY,
        moved: false,
        nodeId,
      };
    }
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const rawDx = event.clientX - drag.x;
    const rawDy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(rawDx, rawDy) < DRAG_THRESHOLD) return;
    const dx = rawDx / uiScale();
    const dy = rawDy / uiScale();
    drag.moved = true;
    viewport.classList.add("is-panning");
    if (drag.kind === "pan") {
      active.camX = drag.camX + dx;
      active.camY = drag.camY + dy;
      applyCamera();
      return;
    }
    const worldDx = dx / active.camScale;
    const worldDy = dy / active.camScale;
    if (drag.kind === "node") moveNode(active, drag.id, drag.originX + worldDx, drag.originY + worldDy);
    else if (drag.kind === "heading") moveHeading(active, drag.key, drag.originX + worldDx, drag.originY + worldDy);
    else if (drag.kind === "group") moveGroup(active, drag.key, drag.originX, drag.originY, drag.members, worldDx, worldDy);
  });
  const endDrag = (event: PointerEvent): void => {
    if (!drag) return;
    const ended = drag;
    drag = null;
    viewport.classList.remove("is-panning");
    if (event.type === "pointercancel" || ended.moved) return;
    if (ended.kind === "line") pickLine(ended.nodeId);
    else if (ended.kind === "group") selectGroup(ended.key);
    else if (ended.kind === "node") selectNode(ended.id);
    else if (ended.kind === "pan" && ended.nodeId) selectNode(ended.nodeId);
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);
  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = Math.max(-90, Math.min(90, event.deltaY));
      zoomAt(event.clientX, event.clientY, active.camScale * Math.exp(-delta * 0.0016));
    },
    { passive: false },
  );
  zoomOut.addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, active.camScale / 1.18);
    playUiSound(clickSound);
  });
  zoomIn.addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, active.camScale * 1.18);
    playUiSound(clickSound);
  });

  const fit = (): void => {
    if (fitted || viewer.hidden) return;
    if (viewport.clientWidth < 2 || viewport.clientHeight < 2) return;
    functional.camX = 24;
    functional.camY = 20;
    functional.camScale = 1.15;
    applyCamera();
    fitted = true;
  };

  viewport.setAttribute("aria-label", functional.viewportLabel);
  applyCamera();
  new MutationObserver(fit).observe(viewer, { attributes: true, attributeFilter: ["hidden"] });
  fit();
}

function boardFrom(
  world: HTMLElement,
  tab: HTMLButtonElement,
  layout: TechLayout,
  edges: TechEdge[],
  genesById: Map<string, GeneRecord>,
  copy: { emptyText: string; detailLabel: string; viewportLabel: string },
): TreeBoard {
  const mounted = mountWorld(world, layout, edges, genesById);
  return {
    world,
    tab,
    ...mounted,
    edges,
    camX: 24,
    camY: 20,
    camScale: 1.15,
    selectedId: null,
    selectedGroupKey: null,
    ...copy,
  };
}

function mountWorld(
  world: HTMLElement,
  layout: TechLayout,
  edges: TechEdge[],
  genesById: Map<string, GeneRecord>,
): Pick<TreeBoard, "buttons" | "paths" | "byNode" | "names" | "groups" | "headings" | "svg"> {
  const buttons = new Map<string, HTMLButtonElement>();
  const paths: SVGPathElement[] = [];
  const names = new Map<string, string>();
  const groups: PlacedGroup[] = [];
  const headings: PlacedHeading[] = [];
  world.style.width = `${layout.worldW}px`;
  world.style.height = `${layout.worldH}px`;

  for (const group of layout.groups) {
    const box = document.createElement("div");
    box.className = "tech-group";
    box.dataset.groupKey = group.key;
    box.style.left = `${group.x}px`;
    box.style.top = `${group.y}px`;
    box.style.width = `${group.w}px`;
    box.style.height = `${group.h}px`;
    box.style.setProperty("--accent", group.accent);
    const label = document.createElement("span");
    label.className = "tech-group-label";
    label.textContent = group.label;
    box.append(label);
    world.append(box);
    groups.push({
      key: group.key,
      el: box,
      nodeIds: layout.nodes.filter((node) => node.groupKey === group.key).map((node) => node.id),
      w: group.w,
      h: group.h,
    });
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "tech-edges");
  svg.setAttribute("viewBox", `0 0 ${layout.worldW} ${layout.worldH}`);
  svg.style.width = `${layout.worldW}px`;
  svg.style.height = `${layout.worldH}px`;
  const byNode = new Map(layout.nodes.map((node) => [node.id, node]));
  for (const edge of edges) {
    const from = byNode.get(edge.from);
    const to = byNode.get(edge.to);
    if (!from || !to) continue;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", edgePath(from, to));
    path.setAttribute("class", edgeClass(edge.kind));
    path.dataset.from = edge.from;
    path.dataset.to = edge.to;
    svg.append(path);
    paths.push(path);
  }
  world.append(svg);

  for (const label of layout.labels) {
    const text = document.createElement("p");
    text.className = "tech-category";
    text.dataset.labelKey = label.key;
    text.textContent = label.text;
    text.style.left = `${label.x}px`;
    text.style.top = `${label.y}px`;
    world.append(text);
    headings.push({ key: label.key, el: text });
  }

  for (const node of layout.nodes) {
    const gene = node.geneId ? genesById.get(node.geneId) : undefined;
    const entry = node.entry;
    const title = nodeTitle(node, genesById);
    const card = nodeCard(node, genesById);
    const code = gene?.id ?? entry?.code ?? node.id;
    const category = gene?.category ?? entry?.category ?? "";
    names.set(node.id, title);
    const button = document.createElement("button");
    button.type = "button";
    button.className = gene ? "tech-node" : "tech-node is-label";
    button.dataset.nodeId = node.id;
    button.draggable = false;
    button.style.left = `${node.x}px`;
    button.style.top = `${node.y}px`;
    button.style.width = `${node.w ?? NODE_W}px`;
    button.style.height = `${node.h ?? NODE_H}px`;
    button.style.setProperty("--accent", ACCENT[category] ?? "#8aa4a2");
    button.setAttribute("aria-pressed", "false");
    button.title = title;
    button.setAttribute("aria-label", gene || entry ? `${title} (${code})` : "Unassigned node");
    if (gene) {
      const icon = document.createElement("img");
      icon.className = "tech-node-icon";
      icon.src = `${ICON_URL}/${gene.id}.png`;
      icon.alt = "";
      icon.draggable = false;
      button.append(icon);
    }
    const id = document.createElement("span");
    id.className = "tech-node-id";
    id.textContent = card;
    button.append(id);
    buttons.set(node.id, button);
    world.append(button);
  }

  return { buttons, paths, byNode, names, groups, headings, svg };
}

function buildTechLayout(genesById: Map<string, GeneRecord>): {
  worldW: number;
  worldH: number;
  groups: TechGroup[];
  nodes: TechNode[];
  labels: TechLabel[];
} {
  const groups: TechGroup[] = [];
  const nodes: TechNode[] = [];
  const labels: TechLabel[] = [];
  const seen = new Set<string>();
  let cursorX = 28;
  let rowBottom = 28;

  for (const group of TREE_GROUPS) {
    let right = 0;
    let bottom = 0;
    for (const slot of group.nodes) {
      if (!genesById.has(slot.id)) throw new Error(`tech tree node ${slot.id} has no gene`);
      if (seen.has(slot.id)) throw new Error(`duplicate tech tree node ${slot.id}`);
      seen.add(slot.id);
      right = Math.max(right, slot.row * COL + NODE_W);
      bottom = Math.max(bottom, slot.col * ROW + NODE_H);
    }
    const box: TechGroup = {
      key: `tree:${group.label}`,
      label: group.label,
      accent: group.accent,
      x: cursorX,
      y: 28,
      w: GROUP_PAD_X + right + GROUP_PAD_X,
      h: GROUP_PAD_TOP + bottom + GROUP_PAD_BOTTOM,
    };
    groups.push(box);
    for (const slot of group.nodes) {
      nodes.push({
        id: slot.id,
        geneId: slot.id,
        groupKey: box.key,
        x: box.x + GROUP_PAD_X + slot.row * COL,
        y: box.y + GROUP_PAD_TOP + slot.col * ROW,
      });
    }
    cursorX += box.w + GROUP_GAP;
    rowBottom = Math.max(rowBottom, box.y + box.h);
  }

  const freeBands: { category: string; ids: string[] }[] = [];
  for (const gene of GENES) {
    if (seen.has(gene.id)) continue;
    const band = freeBands[freeBands.length - 1];
    if (!band || band.category !== gene.category) freeBands.push({ category: gene.category, ids: [gene.id] });
    else band.ids.push(gene.id);
  }
  let freeX = 28;
  let freeBottom = rowBottom;
  if (freeBands.length > 0) {
    const freeTop = rowBottom + GROUP_GAP;
    labels.push({ key: "label:Independently available", text: "Independently available", x: 28, y: freeTop });
    const bandTop = freeTop + LABEL_H + 8;
    for (const [bandIndex, band] of freeBands.entries()) {
      const lanes = Math.ceil(band.ids.length / FREE_ROWS);
      const rows = Math.min(FREE_ROWS, band.ids.length);
      const box: TechGroup = {
        key: `free:${bandIndex}:${band.category}`,
        label: band.category,
        accent: ACCENT[band.category] ?? "#8aa4a2",
        x: freeX,
        y: bandTop,
        w: GROUP_PAD_X + lanes * NODE_W + Math.max(0, lanes - 1) * (COL - NODE_W) + GROUP_PAD_X,
        h: GROUP_PAD_TOP + rows * GRID_ROW - (GRID_ROW - NODE_H) + GROUP_PAD_BOTTOM,
      };
      groups.push(box);
      band.ids.forEach((id, index) => {
        const lane = Math.floor(index / FREE_ROWS);
        const row = index % FREE_ROWS;
        nodes.push({
          id,
          geneId: id,
          groupKey: box.key,
          x: box.x + GROUP_PAD_X + lane * COL,
          y: box.y + GROUP_PAD_TOP + row * GRID_ROW,
        });
        seen.add(id);
      });
      freeX += box.w + GROUP_GAP;
      freeBottom = Math.max(freeBottom, box.y + box.h);
    }
  }

  const worldW = Math.max(cursorX, freeX) - GROUP_GAP;
  const cursorY = freeBottom;

  for (const edge of EDGES) {
    if (!seen.has(edge.from) || !seen.has(edge.to)) throw new Error(`tech tree edge ${edge.from}->${edge.to} is missing a node`);
  }
  if (seen.size !== GENES.length) throw new Error(`tech tree prepared ${seen.size} of ${GENES.length} genes`);

  return { worldW: worldW + 28, worldH: cursorY + 28, groups, nodes, labels };
}

function buildRegulatoryLayout(): TechLayout {
  const parts: { id: string; name: string; description: string; col: number }[] = [
    {
      id: "CNST",
      name: "Always On",
      description: "Drives downstream genes at a fixed strength, all the time. This is the starter promoter, and it works before the cell has any receptor.",
      col: 0,
    },
    {
      id: "COND",
      name: "Conditional",
      description: "Drives downstream genes when a condition on receptor inputs is met. A condition can only read a quantity some receptor in the genome actually measures.",
      col: 1,
    },
    {
      id: "OPTG",
      name: "Operator Tag",
      description: "A label on a promoter that a repressor or activator can bind. One regulator can then address every promoter carrying the matching tag.",
      col: 2,
    },
  ];
  const bottom = (parts.length - 1) * LABEL_ROW + LABEL_NODE_H;
  const box: TechGroup = {
    key: "tree:Promoters",
    label: "Promoters",
    accent: ACCENT.Promoter,
    x: 28,
    y: 28,
    w: GROUP_PAD_X + LABEL_NODE_W + GROUP_PAD_X,
    h: GROUP_PAD_TOP + bottom + GROUP_PAD_BOTTOM,
  };
  const nodes: TechNode[] = parts.map((part) => ({
    id: part.id,
    geneId: null,
    groupKey: box.key,
    x: box.x + GROUP_PAD_X,
    y: box.y + GROUP_PAD_TOP + part.col * LABEL_ROW,
    w: LABEL_NODE_W,
    h: LABEL_NODE_H,
    entry: {
      name: part.name,
      category: "Promoter",
      description: part.description,
      code: part.id,
    },
  }));
  const ids = new Set(nodes.map((node) => node.id));
  for (const edge of REGULATORY_EDGES) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) throw new Error(`regulatory edge ${edge.from}->${edge.to} is missing a node`);
  }
  return {
    worldW: box.x + box.w + 28,
    worldH: box.y + box.h + 28,
    groups: [box],
    nodes,
    labels: [],
  };
}

function moveNode(board: TreeBoard, id: string, x: number, y: number): void {
  const node = board.byNode.get(id);
  const button = board.buttons.get(id);
  if (!node || !button) return;
  node.x = Math.max(0, Math.round(x));
  node.y = Math.max(0, Math.round(y));
  button.style.left = `${node.x}px`;
  button.style.top = `${node.y}px`;
  redrawEdges(board);
  resizeWorld(board);
}

function moveHeading(board: TreeBoard, key: string, x: number, y: number): void {
  const heading = board.headings.find((item) => item.key === key);
  if (!heading) return;
  heading.el.style.left = `${Math.max(0, Math.round(x))}px`;
  heading.el.style.top = `${Math.max(0, Math.round(y))}px`;
  resizeWorld(board);
}

function moveGroup(
  board: TreeBoard,
  key: string,
  originX: number,
  originY: number,
  members: { id: string; originX: number; originY: number }[],
  worldDx: number,
  worldDy: number,
): void {
  const group = board.groups.find((item) => item.key === key);
  if (!group) return;
  let dx = worldDx;
  let dy = worldDy;
  dx = Math.max(dx, -originX);
  dy = Math.max(dy, -originY);
  for (const member of members) {
    dx = Math.max(dx, -member.originX);
    dy = Math.max(dy, -member.originY);
  }
  dx = Math.round(dx);
  dy = Math.round(dy);
  group.el.style.left = `${originX + dx}px`;
  group.el.style.top = `${originY + dy}px`;
  for (const member of members) moveNode(board, member.id, member.originX + dx, member.originY + dy);
  resizeWorld(board);
}

function redrawEdges(board: TreeBoard): void {
  for (const path of board.paths) {
    const from = board.byNode.get(path.dataset.from ?? "");
    const to = board.byNode.get(path.dataset.to ?? "");
    if (!from || !to) continue;
    path.setAttribute("d", edgePath(from, to));
  }
}

function resizeWorld(board: TreeBoard): void {
  let maxX = 64;
  let maxY = 64;
  for (const group of board.groups) {
    maxX = Math.max(maxX, (parseFloat(group.el.style.left) || 0) + group.w);
    maxY = Math.max(maxY, (parseFloat(group.el.style.top) || 0) + group.h);
  }
  for (const node of board.byNode.values()) {
    maxX = Math.max(maxX, node.x + (node.w ?? NODE_W));
    maxY = Math.max(maxY, node.y + (node.h ?? NODE_H));
  }
  for (const heading of board.headings) {
    maxX = Math.max(maxX, (parseFloat(heading.el.style.left) || 0) + 240);
    maxY = Math.max(maxY, (parseFloat(heading.el.style.top) || 0) + LABEL_H);
  }
  const width = Math.ceil(maxX + 28);
  const height = Math.ceil(maxY + 28);
  board.world.style.width = `${width}px`;
  board.world.style.height = `${height}px`;
  board.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  board.svg.style.width = `${width}px`;
  board.svg.style.height = `${height}px`;
}

type SavedTree = {
  groups: { key: string; label: string; accent: string; x: number; y: number; w: number; h: number }[];
  nodes: {
    id: string;
    geneId: string | null;
    name: string;
    x: number;
    y: number;
    w: number;
    h: number;
    groupKey: string | null;
    category: string;
    description: string;
  }[];
  labels: { key: string; text: string; x: number; y: number }[];
  edges: TechEdge[];
};

async function loadTechLayout(): Promise<
  { v: 2; functional: SavedTree; regulatory: SavedTree } | { v: 1; functional: unknown; regulatory: unknown } | null
> {
  try {
    const response = await fetch("/tech-layout.json", { cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { v?: unknown; functional?: unknown; regulatory?: unknown };
    if (body.v === 2) {
      const functional = parseSavedTree(body.functional);
      const regulatory = parseSavedTree(body.regulatory);
      if (!functional || !regulatory) return null;
      return { v: 2, functional, regulatory };
    }
    if (body.v === 1) return { v: 1, functional: body.functional, regulatory: body.regulatory };
    return null;
  } catch {
    return null;
  }
}

function applySavedLayout(layout: TechLayout, saved: unknown): void {
  if (!saved || typeof saved !== "object") return;
  const record = saved as { groups?: unknown; nodes?: unknown; labels?: unknown };
  const groups = readPoints(record.groups, "key");
  const nodes = readPoints(record.nodes, "id");
  const labels = readPoints(record.labels, "key");
  if (groups.size === 0 && nodes.size === 0 && labels.size === 0) return;
  const groupDelta = new Map<string, { dx: number; dy: number }>();
  for (const group of layout.groups) {
    const hit = groups.get(group.key);
    if (!hit) continue;
    groupDelta.set(group.key, { dx: hit.x - group.x, dy: hit.y - group.y });
    group.x = hit.x;
    group.y = hit.y;
  }
  for (const node of layout.nodes) {
    const hit = nodes.get(node.id);
    if (hit) {
      node.x = hit.x;
      node.y = hit.y;
      continue;
    }
    const delta = node.groupKey ? groupDelta.get(node.groupKey) : undefined;
    if (!delta) continue;
    node.x = Math.max(0, node.x + delta.dx);
    node.y = Math.max(0, node.y + delta.dy);
  }
  for (const label of layout.labels) {
    const hit = labels.get(label.key);
    if (!hit) continue;
    label.x = hit.x;
    label.y = hit.y;
  }
  measureLayout(layout);
}

function readPoints(value: unknown, idField: "key" | "id"): Map<string, { x: number; y: number }> {
  const points = new Map<string, { x: number; y: number }>();
  if (!Array.isArray(value)) return points;
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { key?: unknown; id?: unknown; x?: unknown; y?: unknown };
    const id = record[idField];
    if (typeof id !== "string" || typeof record.x !== "number" || typeof record.y !== "number") continue;
    if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) continue;
    if (record.x < 0 || record.y < 0 || record.x > 20000 || record.y > 20000) continue;
    points.set(id, { x: record.x, y: record.y });
  }
  return points;
}

function measureLayout(layout: TechLayout): void {
  let maxX = 0;
  let maxY = 0;
  for (const group of layout.groups) {
    maxX = Math.max(maxX, group.x + group.w);
    maxY = Math.max(maxY, group.y + group.h);
  }
  for (const node of layout.nodes) {
    maxX = Math.max(maxX, node.x + (node.w ?? NODE_W));
    maxY = Math.max(maxY, node.y + (node.h ?? NODE_H));
  }
  for (const label of layout.labels) {
    maxX = Math.max(maxX, label.x + 240);
    maxY = Math.max(maxY, label.y + LABEL_H);
  }
  layout.worldW = maxX + 28;
  layout.worldH = maxY + 28;
}

function layoutFromSaved(saved: SavedTree, genesById: Map<string, GeneRecord>): { layout: TechLayout; edges: TechEdge[] } {
  const groups: TechGroup[] = saved.groups.map((group) => ({ ...group }));
  const nodes: TechNode[] = saved.nodes.map((node) => {
    const gene = node.geneId ? genesById.get(node.geneId) : undefined;
    return {
      id: node.id,
      geneId: gene ? gene.id : null,
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
      groupKey: node.groupKey ?? undefined,
      label: gene && node.name !== gene.id ? node.name : undefined,
      entry: gene
        ? undefined
        : {
            name: node.name,
            category: node.category || "Custom",
            description: node.description || "A tech tree node.",
            code: node.id,
          },
    };
  });
  const layout: TechLayout = {
    worldW: 0,
    worldH: 0,
    groups,
    nodes,
    labels: saved.labels.map((label) => ({ ...label })),
  };
  measureLayout(layout);
  return { layout, edges: saved.edges.map((edge) => ({ ...edge })) };
}

function nodeCard(node: TechNode, genesById: Map<string, GeneRecord>): string {
  if (node.label) return node.label;
  const gene = node.geneId ? genesById.get(node.geneId) : undefined;
  return gene?.id ?? node.entry?.name ?? node.id;
}

function nodeTitle(node: TechNode, genesById: Map<string, GeneRecord>): string {
  if (node.label) return node.label;
  const gene = node.geneId ? genesById.get(node.geneId) : undefined;
  return gene?.name ?? node.entry?.name ?? node.id;
}

function renameNode(board: TreeBoard, genesById: Map<string, GeneRecord>, id: string, name: string): void {
  const node = board.byNode.get(id);
  const button = board.buttons.get(id);
  if (!node || !button) return;
  const gene = node.geneId ? genesById.get(node.geneId) : undefined;
  if (gene) node.label = name === gene.id ? undefined : name;
  else if (node.entry) node.entry.name = name;
  else node.label = name;
  const card = nodeCard(node, genesById);
  const title = nodeTitle(node, genesById);
  const code = gene?.id ?? node.entry?.code ?? node.id;
  const text = button.querySelector(".tech-node-id");
  if (text) text.textContent = card;
  button.title = title;
  button.setAttribute("aria-label", `${title} (${code})`);
  board.names.set(id, title);
}

function renameGroup(board: TreeBoard, key: string, name: string): void {
  const group = board.groups.find((item) => item.key === key);
  const label = group?.el.querySelector(".tech-group-label");
  if (label) label.textContent = name;
}

function deleteNode(board: TreeBoard, id: string): void {
  board.buttons.get(id)?.remove();
  board.buttons.delete(id);
  board.byNode.delete(id);
  board.names.delete(id);
  if (board.selectedId === id) board.selectedId = null;
  for (const group of board.groups) group.nodeIds = group.nodeIds.filter((nodeId) => nodeId !== id);
  for (let index = board.edges.length - 1; index >= 0; index -= 1) {
    const edge = board.edges[index];
    if (edge.from === id || edge.to === id) board.edges.splice(index, 1);
  }
  for (let index = board.paths.length - 1; index >= 0; index -= 1) {
    const path = board.paths[index];
    if (path.dataset.from === id || path.dataset.to === id) {
      path.remove();
      board.paths.splice(index, 1);
    }
  }
}

function deleteGroup(board: TreeBoard, key: string): void {
  const index = board.groups.findIndex((group) => group.key === key);
  if (index < 0) return;
  const group = board.groups[index];
  for (const id of group.nodeIds) {
    const node = board.byNode.get(id);
    if (node) node.groupKey = undefined;
  }
  group.el.remove();
  board.groups.splice(index, 1);
  if (board.selectedGroupKey === key) board.selectedGroupKey = null;
}

function createCategory(board: TreeBoard, viewport: HTMLElement, name: string): string {
  const point = viewCenter(board, viewport);
  const key = `custom:${Date.now().toString(36)}`;
  const box = document.createElement("div");
  box.className = "tech-group";
  box.dataset.groupKey = key;
  box.style.left = `${point.x}px`;
  box.style.top = `${point.y}px`;
  box.style.width = "220px";
  box.style.height = "160px";
  box.style.setProperty("--accent", "#8aa4a2");
  const label = document.createElement("span");
  label.className = "tech-group-label";
  label.textContent = name;
  box.append(label);
  board.world.prepend(box);
  board.groups.push({ key, el: box, nodeIds: [], w: 220, h: 160 });
  resizeWorld(board);
  return key;
}

function createNode(board: TreeBoard, genesById: Map<string, GeneRecord>, viewport: HTMLElement, name: string): string | null {
  const gene = GENES.find((item) => item.id.toLowerCase() === name.toLowerCase() || item.name.toLowerCase() === name.toLowerCase());
  if (gene && board.byNode.has(gene.id)) return null;
  const group = selectedGroup(board);
  const id = gene?.id ?? freshId(board, name);
  const width = gene ? NODE_W : LABEL_NODE_W;
  const height = gene ? NODE_H : LABEL_NODE_H;
  let x = viewCenter(board, viewport).x;
  let y = viewCenter(board, viewport).y;
  if (group) {
    const originX = parseFloat(group.el.style.left) || 0;
    const originY = parseFloat(group.el.style.top) || 0;
    x = originX + GROUP_PAD_X;
    y = originY + GROUP_PAD_TOP + group.nodeIds.length * (height + 12);
    const needed = y + height + GROUP_PAD_BOTTOM - originY;
    if (needed > group.h) {
      group.h = needed;
      group.el.style.height = `${needed}px`;
    }
  }
  const node: TechNode = {
    id,
    geneId: gene?.id ?? null,
    x,
    y,
    w: width,
    h: height,
    groupKey: group?.key,
    entry: gene
      ? undefined
      : { name, category: "Custom", description: "A tech tree node.", code: id },
  };
  const button = buildNodeButton(node, genesById, board.names);
  board.byNode.set(id, node);
  board.buttons.set(id, button);
  board.world.append(button);
  group?.nodeIds.push(id);
  resizeWorld(board);
  return id;
}

function selectedGroup(board: TreeBoard): PlacedGroup | undefined {
  if (board.selectedGroupKey) return board.groups.find((group) => group.key === board.selectedGroupKey);
  const node = board.selectedId ? board.byNode.get(board.selectedId) : undefined;
  return node?.groupKey ? board.groups.find((group) => group.key === node.groupKey) : undefined;
}

function viewCenter(board: TreeBoard, viewport: HTMLElement): { x: number; y: number } {
  const rect = viewport.getBoundingClientRect();
  const scale = uiScale();
  return {
    x: Math.max(28, Math.round((rect.width / scale / 2 - board.camX) / board.camScale)),
    y: Math.max(28, Math.round((rect.height / scale / 2 - board.camY) / board.camScale)),
  };
}

function freshId(board: TreeBoard, name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "NODE";
  let id = base;
  let suffix = 2;
  while (board.byNode.has(id)) {
    id = `${base.slice(0, 6)}${suffix}`;
    suffix += 1;
  }
  return id;
}

function buildNodeButton(node: TechNode, genesById: Map<string, GeneRecord>, names: Map<string, string>): HTMLButtonElement {
  const gene = node.geneId ? genesById.get(node.geneId) : undefined;
  const entry = node.entry;
  const title = nodeTitle(node, genesById);
  const card = nodeCard(node, genesById);
  const code = gene?.id ?? entry?.code ?? node.id;
  const category = gene?.category ?? entry?.category ?? "";
  names.set(node.id, title);
  const button = document.createElement("button");
  button.type = "button";
  button.className = gene ? "tech-node" : "tech-node is-label";
  button.dataset.nodeId = node.id;
  button.draggable = false;
  button.style.left = `${node.x}px`;
  button.style.top = `${node.y}px`;
  button.style.width = `${node.w ?? NODE_W}px`;
  button.style.height = `${node.h ?? NODE_H}px`;
  button.style.setProperty("--accent", ACCENT[category] ?? "#8aa4a2");
  button.setAttribute("aria-pressed", "false");
  button.title = title;
  button.setAttribute("aria-label", `${title} (${code})`);
  if (gene) {
    const icon = document.createElement("img");
    icon.className = "tech-node-icon";
    icon.src = `${ICON_URL}/${gene.id}.png`;
    icon.alt = "";
    icon.draggable = false;
    button.append(icon);
  }
  const id = document.createElement("span");
  id.className = "tech-node-id";
  id.textContent = card;
  button.append(id);
  return button;
}

function setEdge(board: TreeBoard, from: string, to: string, kind: EdgeKind): "added" | "updated" | "removed" | "same" {
  if (from === to || !board.byNode.has(from) || !board.byNode.has(to)) return "same";
  const index = board.edges.findIndex((edge) => edge.from === from && edge.to === to);
  if (index >= 0 && board.edges[index].kind === kind) {
    board.edges.splice(index, 1);
    const pathIndex = board.paths.findIndex((path) => path.dataset.from === from && path.dataset.to === to);
    if (pathIndex >= 0) {
      board.paths[pathIndex].remove();
      board.paths.splice(pathIndex, 1);
    }
    return "removed";
  }
  if (index >= 0) {
    board.edges[index].kind = kind;
    const path = board.paths.find((item) => item.dataset.from === from && item.dataset.to === to);
    if (path) path.setAttribute("class", edgeClass(kind));
    return "updated";
  }
  board.edges.push({ from, to, kind });
  const fromNode = board.byNode.get(from);
  const toNode = board.byNode.get(to);
  if (!fromNode || !toNode) return "same";
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", edgePath(fromNode, toNode));
  path.setAttribute("class", edgeClass(kind));
  path.dataset.from = from;
  path.dataset.to = to;
  board.svg.append(path);
  board.paths.push(path);
  return "added";
}

async function saveTechLayout(functional: TreeBoard, regulatory: TreeBoard): Promise<boolean> {
  try {
    const response = await fetch("/api/tech-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        v: 2,
        functional: snapshotTree(functional),
        regulatory: snapshotTree(regulatory),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function snapshotTree(board: TreeBoard): SavedTree {
  return {
    groups: board.groups.map((group) => ({
      key: group.key,
      label: group.el.querySelector(".tech-group-label")?.textContent ?? group.key,
      accent: group.el.style.getPropertyValue("--accent") || "#8aa4a2",
      x: Math.round(parseFloat(group.el.style.left) || 0),
      y: Math.round(parseFloat(group.el.style.top) || 0),
      w: group.w,
      h: group.h,
    })),
    nodes: [...board.byNode.values()].map((node) => {
      const gene = node.geneId ? GENES.find((item) => item.id === node.geneId) : undefined;
      return {
        id: node.id,
        geneId: gene?.id ?? null,
        name: node.label ?? gene?.id ?? node.entry?.name ?? node.id,
        x: Math.round(node.x),
        y: Math.round(node.y),
        w: node.w ?? NODE_W,
        h: node.h ?? NODE_H,
        groupKey: node.groupKey ?? null,
        category: gene?.category ?? node.entry?.category ?? "",
        description: gene?.description ?? node.entry?.description ?? "",
      };
    }),
    labels: board.headings.map((heading) => ({
      key: heading.key,
      text: heading.el.textContent ?? heading.key,
      x: Math.round(parseFloat(heading.el.style.left) || 0),
      y: Math.round(parseFloat(heading.el.style.top) || 0),
    })),
    edges: board.edges.map((edge) => ({ from: edge.from, to: edge.to, kind: edge.kind })),
  };
}

function parseSavedTree(value: unknown): SavedTree | null {
  if (!value || typeof value !== "object") return null;
  const record = value as { groups?: unknown; nodes?: unknown; labels?: unknown; edges?: unknown };
  if (!Array.isArray(record.groups) || !Array.isArray(record.nodes) || !Array.isArray(record.labels) || !Array.isArray(record.edges)) return null;
  const groups = record.groups.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const group = item as { key?: unknown; label?: unknown; accent?: unknown; x?: unknown; y?: unknown; w?: unknown; h?: unknown };
    if (typeof group.key !== "string" || typeof group.label !== "string" || typeof group.accent !== "string") return [];
    if (!isLayoutNumber(group.x) || !isLayoutNumber(group.y) || !isLayoutNumber(group.w) || !isLayoutNumber(group.h)) return [];
    return [{ key: group.key, label: group.label, accent: group.accent, x: group.x, y: group.y, w: group.w, h: group.h }];
  });
  const nodes = record.nodes.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const node = item as {
      id?: unknown;
      geneId?: unknown;
      name?: unknown;
      x?: unknown;
      y?: unknown;
      w?: unknown;
      h?: unknown;
      groupKey?: unknown;
      category?: unknown;
      description?: unknown;
    };
    if (typeof node.id !== "string" || typeof node.name !== "string") return [];
    if (!isLayoutNumber(node.x) || !isLayoutNumber(node.y) || !isLayoutNumber(node.w) || !isLayoutNumber(node.h)) return [];
    return [{
      id: node.id,
      geneId: typeof node.geneId === "string" ? node.geneId : null,
      name: node.name,
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h,
      groupKey: typeof node.groupKey === "string" ? node.groupKey : null,
      category: typeof node.category === "string" ? node.category : "",
      description: typeof node.description === "string" ? node.description : "",
    }];
  });
  const labels = record.labels.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = item as { key?: unknown; text?: unknown; x?: unknown; y?: unknown };
    if (typeof label.key !== "string" || typeof label.text !== "string" || !isLayoutNumber(label.x) || !isLayoutNumber(label.y)) return [];
    return [{ key: label.key, text: label.text, x: label.x, y: label.y }];
  });
  const edges = record.edges.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const edge = item as { from?: unknown; to?: unknown; kind?: unknown };
    const kind: EdgeKind | null = edge.kind === "unlocks" || edge.kind === "required" ? edge.kind : edge.kind === "one of" ? "unlocks" : null;
    if (typeof edge.from !== "string" || typeof edge.to !== "string" || !kind) return [];
    return [{ from: edge.from, to: edge.to, kind }];
  });
  return { groups, nodes, labels, edges };
}

function isLayoutNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 20000;
}

function relationBlock(title: string, edges: TechEdge[], end: "from" | "to", names: Map<string, string>): HTMLDivElement {
  const block = document.createElement("div");
  block.className = "tech-rel";
  const heading = document.createElement("p");
  heading.className = "genome-detail-meta";
  heading.textContent = title;
  block.append(heading);
  if (edges.length === 0) {
    const empty = document.createElement("p");
    empty.className = "genome-detail-copy";
    empty.textContent = "None";
    block.append(empty);
    return block;
  }
  const list = document.createElement("ul");
  list.className = "tech-rel-list";
  for (const edge of edges) {
    const item = document.createElement("li");
    item.textContent = `${names.get(edge[end]) ?? edge[end]} · ${edge.kind}`;
    list.append(item);
  }
  block.append(list);
  return block;
}

function edgePath(from: TechNode, to: TechNode): string {
  const fromW = from.w ?? NODE_W;
  const fromH = from.h ?? NODE_H;
  const toW = to.w ?? NODE_W;
  const x1 = from.x + fromW / 2;
  const y1 = from.y + fromH;
  const x2 = to.x + toW / 2;
  const y2 = to.y;
  const bend = Math.max(24, Math.abs(y2 - y1) * 0.45);
  const direction = y2 >= y1 ? 1 : -1;
  return `M ${x1} ${y1} C ${x1} ${y1 + bend * direction}, ${x2} ${y2 - bend * direction}, ${x2} ${y2}`;
}

function edgeClass(kind: EdgeKind): string {
  if (kind === "required") return "tech-edge is-required";
  return "tech-edge is-unlocks";
}

export function missingGeneRequirements(geneId: string, present: ReadonlySet<string>): string[] {
  const incoming = requirementEdges.filter((edge) => edge.to === geneId);
  const reasons: string[] = [];
  const nameOf = (id: string): string => GENES.find((gene) => gene.id === id)?.name ?? id;
  for (const edge of incoming) {
    if (edge.kind !== "required" || present.has(edge.from)) continue;
    reasons.push(`Requires ${nameOf(edge.from)} in the genome`);
  }
  const unlocks = incoming.filter((edge) => edge.kind === "unlocks");
  if (unlocks.length > 0 && !unlocks.some((edge) => present.has(edge.from))) {
    const names = unlocks.map((edge) => nameOf(edge.from));
    reasons.push(names.length === 1 ? `Unlocked by ${names[0]}` : `Unlocked by ${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`);
  }
  return reasons;
}
