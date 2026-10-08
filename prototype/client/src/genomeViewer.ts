import { GENES, type GeneRecord } from "./genes";
import {
  amountById,
  amountRange,
  applySnapshot,
  behaviorLine,
  beginEditCassette,
  cassetteAtpCost,
  cassetteMutationCost,
  CYTOSOLIC_ICON,
  geneById,
  getDraft,
  getGenome,
  persistGenome,
  promoterById,
  regulatoryIcon,
  removeCassette,
  snapshot,
  subscribeGenome,
  tagById,
  type Cassette,
} from "./genomeState";
import { openDockWindow } from "./dock";
import { genomeToPasta, parsePasta } from "./pasta";
import { speciesFileStem } from "./species";
import { playCue } from "./uiSound";

const SHEET_URL = "/ui/genome_viewer/DNA_Pixel_Grooves_32_Frames_Long.png";
const HELIX_PART_URL = {
  promoter: "/ui/genome_viewer/DNA_Muted_Orange_32_Frames.png",
  coding: "/ui/genome_viewer/DNA_Muted_Blue_32_Frames.png",
  terminator: "/ui/genome_viewer/DNA_Muted_Red_32_Frames.png",
} as const;
const SRC_X = 0;
const SRC_W = 2048;
const FRAME_COUNT = 32;
const FRAME_H = 64;
const HELIX_SCALE = 0.5;
const HELIX_ANCHOR = 0.38;
const HELIX_GENES = 3;
const MARK_FADE_MS = 520;
const HELIX_TURNS = 8;
const SWOOSH_NEAR_TURNS = 2;
const SWOOSH_FAR_TURNS = 20;
const PARTS = ["spacer", "promoter", "coding", "terminator"] as const;

export function initGenomeViewer(): void {
  const viewer = document.querySelector<HTMLElement>("#genome-viewer");
  const list = document.querySelector<HTMLUListElement>("#genome-gene-list");
  const search = document.querySelector<HTMLInputElement>("#genome-gene-search");
  const categories = document.querySelector<HTMLElement>("#genome-category-tabs");
  const categoryLabel = document.querySelector<HTMLElement>("#genome-category-label");
  const empty = document.querySelector<HTMLElement>("#genome-gene-empty");
  const detail = document.querySelector<HTMLElement>("#genome-detail");
  const browser = document.querySelector<HTMLElement>(".genome-browser");
  const canvas = document.querySelector<HTMLCanvasElement>("#genome-helix");
  const map = document.querySelector<HTMLElement>("#genome-scroll-map");
  const segments = document.querySelector<HTMLElement>("#genome-scroll-segments");
  const viewWindow = document.querySelector<HTMLElement>("#genome-scroll-window");
  const viewLabel = document.querySelector<HTMLElement>("#genome-scroll-count");
  const viewBack = document.querySelector<HTMLButtonElement>("#genome-scroll-back");
  const viewForward = document.querySelector<HTMLButtonElement>("#genome-scroll-forward");
  const viewOut = document.querySelector<HTMLButtonElement>("#genome-scroll-out");
  const viewIn = document.querySelector<HTMLButtonElement>("#genome-scroll-in");
  const pastaSave = document.querySelector<HTMLButtonElement>("#genome-pasta-save");
  const pastaLoad = document.querySelector<HTMLButtonElement>("#genome-pasta-load");
  if (!viewer || !list || !search || !categories || !categoryLabel || !empty || !detail || !browser || !canvas || !map || !segments || !viewWindow || !viewLabel || !viewBack || !viewForward || !viewOut || !viewIn || !pastaSave || !pastaLoad) {
    throw new Error("missing genome viewer");
  }
  viewer.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  viewer.addEventListener("wheel", (event) => {
    event.stopPropagation();
  });

  const confirmRoot = document.createElement("div");
  confirmRoot.className = "genome-confirm";
  confirmRoot.hidden = true;
  confirmRoot.setAttribute("role", "dialog");
  confirmRoot.setAttribute("aria-modal", "true");
  confirmRoot.setAttribute("aria-label", "Delete gene confirmation");
  const confirmCard = document.createElement("div");
  confirmCard.className = "genome-confirm-card";
  const confirmTitle = document.createElement("h3");
  confirmTitle.className = "genome-confirm-title";
  confirmTitle.textContent = "Delete gene";
  const confirmCopy = document.createElement("p");
  confirmCopy.className = "genome-confirm-copy";
  const confirmActions = document.createElement("div");
  confirmActions.className = "genome-confirm-actions";
  const confirmCancel = document.createElement("button");
  confirmCancel.type = "button";
  confirmCancel.className = "genome-mode-tab";
  confirmCancel.textContent = "Cancel";
  const confirmDelete = document.createElement("button");
  confirmDelete.type = "button";
  confirmDelete.className = "genome-mode-tab genome-confirm-delete";
  confirmDelete.textContent = "Delete";
  confirmActions.append(confirmCancel, confirmDelete);
  confirmCard.append(confirmTitle, confirmCopy, confirmActions);
  confirmRoot.append(confirmCard);
  viewer.append(confirmRoot);

  let confirmTarget: Cassette | null = null;
  let lastDeleteButton: HTMLButtonElement | null = null;
  const closeConfirm = (): void => {
    confirmRoot.hidden = true;
    confirmTarget = null;
    if (lastDeleteButton && lastDeleteButton.isConnected) {
      lastDeleteButton.focus();
    }
  };
  confirmCancel.addEventListener("click", () => {
    playCue("back");
    closeConfirm();
  });
  confirmRoot.addEventListener("pointerdown", (event) => {
    if (event.target !== confirmRoot) return;
    playCue("back");
    closeConfirm();
  });
  viewer.addEventListener("keydown", (event) => {
    if (confirmRoot.hidden || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    playCue("back");
    closeConfirm();
  });
  confirmDelete.addEventListener("click", () => {
    const cassette = confirmTarget;
    if (!cassette) return;
    const restore = snapshot();
    confirmRoot.hidden = true;
    confirmTarget = null;
    removeCassette(cassette.uid);
    void persistGenome().then((saved) => {
      if (!saved) {
        applySnapshot(restore);
        playCue("alarm");
        return;
      }
      playCue("success");
    });
  });

  /** Repurposes the confirmation card as a plain notice with a single OK button. */
  const showNotice = (title: string, message: string): void => {
    confirmTitle.textContent = title;
    confirmCopy.textContent = message;
    confirmRoot.setAttribute("aria-label", title);
    confirmDelete.hidden = true;
    confirmCancel.textContent = "OK";
    lastDeleteButton = null;
    confirmRoot.hidden = false;
    confirmCancel.focus();
  };

  // .pasta export: the committed genome as FASTA-like text, downloaded whole.
  pastaSave.addEventListener("pointerenter", () => playCue("hover"));
  pastaLoad.addEventListener("pointerenter", () => playCue("hover"));
  pastaSave.addEventListener("click", () => {
    if (getGenome().length === 0) {
      showNotice("Save .pasta", "The genome has no genes to save yet.");
      playCue("deny");
      return;
    }
    const blob = new Blob([genomeToPasta(getGenome())], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${speciesFileStem()}.pasta`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    playCue("confirm");
  });

  // .pasta import: any genome the catalog can read, loaded over the current one.
  const pastaFile = document.createElement("input");
  pastaFile.type = "file";
  pastaFile.accept = ".pasta,text/plain";
  pastaFile.hidden = true;
  viewer.append(pastaFile);
  pastaLoad.addEventListener("click", () => {
    playCue("button");
    pastaFile.click();
  });
  pastaFile.addEventListener("change", () => {
    const file = pastaFile.files?.[0];
    pastaFile.value = "";
    if (!file) return;
    void file.text().then((text) => {
      const parsed = parsePasta(text);
      if (parsed.cassettes.length === 0) {
        showNotice("Load .pasta", parsed.errors[0] ?? "The file contains no genes.");
        playCue("reject");
        return;
      }
      applySnapshot({ v: 1, draft: getDraft(), genome: parsed.cassettes });
      void persistGenome();
      playCue("success");
      if (parsed.errors.length > 0) {
        showNotice("Load .pasta", `Loaded ${parsed.cassettes.length} of ${parsed.cassettes.length + parsed.errors.length} genes. The rest could not be read: ${parsed.errors[0]}`);
      }
    });
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const image = new Image();
  image.src = SHEET_URL;
  const partSheets = {
    promoter: new Image(),
    coding: new Image(),
    terminator: new Image(),
  };
  partSheets.promoter.src = HELIX_PART_URL.promoter;
  partSheets.coding.src = HELIX_PART_URL.coding;
  partSheets.terminator.src = HELIX_PART_URL.terminator;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("missing genome helix context");

  let selected: HTMLButtonElement | null = null;
  let selectedIndex = 0;
  let displayAngle = 0;
  let running = false;
  let draggingHelix = false;
  let catchingUp = false;
  let helixArmed = false;
  let chaseTarget = 0;
  let chaseVelocity = 0;
  let lastViewAngle = 0;
  let lastChaseSample = 0;
  let gestureOrigin = 0;
  let gestureView = 0;
  let spinStart = 0;
  let tween: { from: number; to: number; t0: number; dur: number } | null = null;
  let markAlpha = 0;
  let markFading = false;
  let markFadeFrom = 0;
  let markFadeStart = 0;
  let viewStart = 0;
  let viewSpan = 8;
  let visibleSpan = getGenome().length;
  const geneButtons: HTMLButtonElement[] = [];
  const geneItems: HTMLLIElement[] = [];
  let layout = layoutGenome(getGenome());
  const marks: HTMLElement[] = [];

  const showGene = (gene: GeneRecord, cassette: Cassette, index: number): void => {
    detail.classList.remove("is-empty");
    const name = document.createElement("h3");
    name.className = "genome-detail-name";
    name.textContent = cassette.name;
    const meta = document.createElement("p");
    meta.className = "genome-detail-meta";
    const code = cassette.code && cassette.code !== gene.id ? cassette.code : gene.id;
    meta.textContent = cassette.name === gene.name && code === gene.id ? `${gene.category}  ${gene.id}` : `${gene.category}  ${code}  ·  ${gene.name}`;
    const copy = document.createElement("p");
    copy.className = "genome-detail-copy";
    copy.textContent = gene.description;
    const frame = document.createElement("figure");
    frame.className = "genome-detail-protein";
    const protein = document.createElement("img");
    protein.src = `/ui/genome_viewer/proteins/individuals/${gene.id}.png`;
    protein.alt = gene.name;
    frame.append(protein);
    const bar = document.createElement("div");
    bar.className = "genome-detail-bar";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "genome-mode-tab";
    editButton.textContent = "Edit Gene";
    editButton.title = "Load this construct into the gene editor";
    editButton.addEventListener("pointerenter", () => playCue("hover"));
    editButton.addEventListener("click", () => {
      if (!beginEditCassette(cassette.uid)) {
        playCue("deny");
        return;
      }
      openDockWindow("gene-editor");
      playCue("tab");
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "genome-mode-tab";
    deleteButton.textContent = "Delete Gene";
    lastDeleteButton = deleteButton;
    deleteButton.addEventListener("pointerenter", () => playCue("hover"));
    deleteButton.addEventListener("click", () => {
      confirmCopy.textContent = `Remove ${cassette.name} (${code}) from the genome? The cell will stop producing it. This cannot be undone.`;
      confirmTarget = cassette;
      confirmTitle.textContent = "Delete gene";
      confirmRoot.setAttribute("aria-label", "Delete gene confirmation");
      confirmDelete.hidden = false;
      confirmCancel.textContent = "Cancel";
      confirmRoot.hidden = false;
      playCue("button");
      confirmCancel.focus();
    });
    bar.append(editButton, deleteButton);
    const blocks: HTMLElement[] = [bar, frame, name, meta, copy];

    const behavior = document.createElement("p");
    behavior.className = "genome-detail-copy";
    behavior.textContent = behaviorLine(cassette);
    blocks.push(behavior);

    const assemblyLabel = document.createElement("p");
    assemblyLabel.className = "genome-detail-meta";
    assemblyLabel.textContent = `Assembly · slot ${index + 1} of ${getGenome().length}`;
    blocks.push(assemblyLabel);
    const recipe = document.createElement("div");
    recipe.className = "genome-detail-recipe";
    for (const tile of cassetteTiles(gene, cassette)) {
      const cell = document.createElement("figure");
      cell.className = "genome-detail-tile";
      const icon = document.createElement("img");
      icon.src = tile.icon;
      icon.alt = "";
      const kind = document.createElement("span");
      kind.className = "genome-detail-tile-kind";
      kind.textContent = tile.kind;
      const tileName = document.createElement("span");
      tileName.className = "genome-detail-tile-name";
      tileName.textContent = tile.name;
      cell.append(icon, kind, tileName);
      recipe.append(cell);
    }
    blocks.push(recipe);

    const costs = document.createElement("p");
    costs.className = "genome-detail-meta";
    costs.textContent = `Costs · ATP upkeep ${cassetteAtpCost(cassette)}/s  ·  assembly ${cassetteMutationCost(cassette)} MP`;
    blocks.push(costs);
    detail.replaceChildren(...blocks);
  };

  const showEmptyDetail = (): void => {
    detail.classList.add("is-empty");
    const message = document.createElement("p");
    message.className = "genome-detail-empty";
    message.textContent = "Select a gene";
    detail.replaceChildren(message);
  };

  let categoryFilter = "";
  const categoryTabs: HTMLButtonElement[] = [];
  const addCategoryTab = (label: string, category: string, selectedTab: boolean): void => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "genome-category";
    tab.role = "tab";
    tab.title = label;
    tab.setAttribute("aria-label", label);
    tab.setAttribute("aria-selected", String(selectedTab));
    const icon = categoryIcon(category);
    if (icon) {
      const image = document.createElement("img");
      image.src = icon;
      image.alt = "";
      image.width = 32;
      image.height = 32;
      tab.append(image);
    } else {
      tab.textContent = label;
    }
    tab.addEventListener("click", () => {
      categoryFilter = category;
      categoryLabel.textContent = category === "" ? "All genes" : category;
      for (const other of categoryTabs) other.setAttribute("aria-selected", String(other === tab));
      applyFilter();
      playCue("tab");
    });
    categoryTabs.push(tab);
    categories.append(tab);
  };
  addCategoryTab("All", "", true);
  const seenCategories = new Set<string>();
  for (const gene of GENES) {
    if (seenCategories.has(gene.category)) continue;
    seenCategories.add(gene.category);
    addCategoryTab(gene.category, gene.category, false);
  }

  const applyFilter = (): void => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    getGenome().forEach((cassette, index) => {
      const item = geneItems[index];
      const gene = geneById(cassette.geneId);
      if (!item || !gene) return;
      const haystack = `${cassette.name} ${cassette.code} ${gene.name} ${gene.category} ${gene.id}`.toLowerCase();
      const textMatch = query.length === 0 || haystack.includes(query);
      const categoryMatch = categoryFilter === "" || gene.category === categoryFilter;
      const match = textMatch && categoryMatch;
      item.hidden = !match;
      if (match) shown += 1;
    });
    empty.hidden = shown > 0;
  };
  search.addEventListener("input", applyFilter);

  const paint = (): void => {
    if (!image.complete || image.naturalWidth === 0) return;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (cssW < 2 || cssH < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bitmapW = Math.floor(cssW * dpr);
    const bitmapH = Math.floor(cssH * dpr);
    if (canvas.width !== bitmapW || canvas.height !== bitmapH) {
      canvas.width = bitmapW;
      canvas.height = bitmapH;
    }
    const drawnW = Math.round(SRC_W * HELIX_SCALE);
    const drawnH = Math.round(FRAME_H * HELIX_SCALE);
    const destX = Math.round((cssW - drawnW) / 2);
    const destY = Math.min(Math.max(0, cssH - drawnH), Math.round(cssH * HELIX_ANCHOR - drawnH / 2));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, cssW, cssH);
    const srcY = frameIndex(displayAngle) * FRAME_H;
    context.drawImage(image, SRC_X, srcY, SRC_W, FRAME_H, destX, destY, drawnW, drawnH);
    const moving = Boolean(tween) || draggingHelix || catchingUp;
    if (moving || markAlpha <= 0.001 || !selected) return;
    const helixCount = Math.min(HELIX_GENES, getGenome().length);
    const helixStart = Math.max(0, Math.min(selectedIndex - Math.floor((helixCount - 1) / 2), getGenome().length - helixCount));
    const bands = layout.segments.filter(
      (segment) => segment.gene >= helixStart && segment.gene < helixStart + helixCount && segment.part !== "spacer",
    );
    const total = bands.reduce((sum, segment) => sum + segment.weight, 0);
    const visibleLeft = Math.max(0, destX);
    const visibleRight = Math.min(cssW, destX + drawnW);
    if (!selected || total <= 0 || visibleRight <= visibleLeft) return;
    const span = visibleRight - visibleLeft;
    let weightSum = 0;
    let cursor = visibleLeft;
    let selectedLeft = 0;
    let selectedRight = 0;
    let selectedSeen = false;
    for (let index = 0; index < bands.length; index += 1) {
      const band = bands[index];
      if (!band) continue;
      weightSum += band.weight;
      const edge = index === bands.length - 1 ? visibleRight : visibleLeft + Math.round((weightSum / total) * span);
      const x0 = Math.round(cursor);
      const x1 = Math.round(edge);
      cursor = edge;
      if (x1 <= x0 || band.gene !== selectedIndex) continue;
      if (band.part !== "promoter" && band.part !== "coding" && band.part !== "terminator") continue;
      const sheet = partSheets[band.part];
      if (!sheet.complete || sheet.naturalWidth === 0) continue;
      const srcX = ((x0 - destX) / drawnW) * SRC_W;
      const srcW = ((x1 - x0) / drawnW) * SRC_W;
      context.save();
      context.globalAlpha = markAlpha;
      context.drawImage(sheet, srcX, srcY, srcW, FRAME_H, x0, destY, x1 - x0, drawnH);
      context.restore();
      selectedLeft = selectedSeen ? selectedLeft : x0;
      selectedRight = x1;
      selectedSeen = true;
    }
    if (selectedSeen && selectedRight > selectedLeft) {
      context.save();
      context.globalAlpha = markAlpha;
      context.strokeStyle = "rgba(244, 255, 254, 0.92)";
      context.lineWidth = 1;
      context.strokeRect(selectedLeft + 0.5, destY - 4.5, selectedRight - selectedLeft - 1, drawnH + 8);
      context.restore();
    }
  };

  const viewAngle = (): number => {
    const shown = Math.min(viewSpan, getGenome().length - viewStart);
    const from = layout.genes[viewStart]?.start ?? 0;
    const to = layout.genes[viewStart + shown - 1]?.end ?? from;
    return (((from + to) / 2) / layout.total) * HELIX_TURNS * Math.PI * 2;
  };

  const followHelix = (dt: number): boolean => {
    let remaining = dt;
    while (remaining > 0) {
      const stepDt = Math.min(0.008, remaining);
      remaining -= stepDt;
      const error = chaseTarget - displayAngle;
      const queued = Math.abs(chaseTarget - spinStart) / (Math.PI * 2);
      const cruise = peakRadians(queued);
      const accel = cruise / 0.55;
      if (Math.abs(error) < 0.02 && Math.abs(chaseVelocity) < 0.08) {
        displayAngle = chaseTarget;
        chaseVelocity = 0;
        return true;
      }
      const direction = Math.sign(error) || Math.sign(chaseVelocity) || 1;
      const stopping = (chaseVelocity * chaseVelocity) / (2 * Math.max(accel, 0.001));
      const targetVelocity = Math.abs(error) > stopping ? direction * cruise : 0;
      const maxStep = accel * stepDt;
      const deltaV = targetVelocity - chaseVelocity;
      chaseVelocity += Math.max(-maxStep, Math.min(maxStep, deltaV));
      const step = chaseVelocity * stepDt;
      if (step * error > 0 && Math.abs(error) > 1e-5) {
        if (Math.abs(step) >= Math.abs(error)) {
          displayAngle = chaseTarget;
          chaseVelocity = 0;
          return true;
        }
        displayAngle = slerpAngle(displayAngle, chaseTarget, step / error);
      } else {
        displayAngle += step;
      }
    }
    return false;
  };

  const sampleHelix = (now: number): void => {
    if (draggingHelix || catchingUp) {
      const dt = Math.min(0.05, Math.max(0, (now - lastChaseSample) / 1000));
      lastChaseSample = now;
      const settled = followHelix(dt);
      if (settled && !draggingHelix) catchingUp = false;
      return;
    }
    if (!tween) return;
    const amount = swooshEase(Math.min(1, (now - tween.t0) / tween.dur));
    displayAngle = slerpAngle(tween.from, tween.to, amount);
    if (amount >= 1) tween = null;
  };

  const hideMark = (): void => {
    markAlpha = 0;
    markFading = false;
  };

  const settleMark = (now: number): void => {
    const moving = Boolean(tween) || draggingHelix || catchingUp;
    if (moving) {
      hideMark();
      return;
    }
    if (!markFading && markAlpha < 1) {
      markFading = true;
      markFadeFrom = markAlpha;
      markFadeStart = now;
    }
    if (!markFading) return;
    const amount = Math.min(1, (now - markFadeStart) / MARK_FADE_MS);
    const eased = amount * amount * (3 - 2 * amount);
    markAlpha = markFadeFrom + (1 - markFadeFrom) * eased;
    if (amount >= 1) {
      markAlpha = 1;
      markFading = false;
    }
  };

  const aimHelix = (motion: "none" | "in-out" | "drag" | "scroll", geneDelta = 0): void => {
    const next = viewAngle();
    if (motion === "none" || reducedMotion) {
      displayAngle = next;
      chaseTarget = next;
      chaseVelocity = 0;
      lastViewAngle = next;
      helixArmed = false;
      tween = null;
      draggingHelix = false;
      catchingUp = false;
      markAlpha = selected ? 1 : 0;
      markFading = false;
      paint();
      return;
    }
    if (motion === "drag" || motion === "scroll") {
      if (!catchingUp && !draggingHelix) {
        chaseTarget = displayAngle;
        spinStart = displayAngle;
        lastChaseSample = performance.now();
      }
      chaseTarget = motion === "drag"
        ? windTarget(gestureOrigin, next, viewStart - gestureView)
        : windTarget(chaseTarget, next, geneDelta);
      lastViewAngle = next;
      helixArmed = true;
      tween = null;
      catchingUp = true;
      if (motion === "drag") draggingHelix = true;
      hideMark();
      kick();
      return;
    }
    draggingHelix = false;
    catchingUp = false;
    helixArmed = false;
    chaseVelocity = 0;
    lastViewAngle = next;
    const destination = windTarget(displayAngle, next, geneDelta);
    if (Math.abs(destination - displayAngle) < 0.0001) {
      tween = null;
      if (markAlpha < 1) {
        markFading = true;
        markFadeFrom = markAlpha;
        markFadeStart = performance.now();
        kick();
      }
      paint();
      return;
    }
    const turns = Math.abs(destination - displayAngle) / (Math.PI * 2);
    tween = {
      from: displayAngle,
      to: destination,
      t0: performance.now(),
      dur: swooshDuration(turns),
    };
    hideMark();
    kick();
  };

  const tick = (now: number): void => {
    if (!running) return;
    if (viewer.hidden || document.hidden) {
      running = false;
      return;
    }
    sampleHelix(now);
    settleMark(now);
    paint();
    if (tween || draggingHelix || catchingUp || markFading) requestAnimationFrame(tick);
    else running = false;
  };

  const kick = (): void => {
    if (viewer.hidden || document.hidden) return;
    if (running) return;
    running = true;
    requestAnimationFrame(tick);
  };

  const start = (): void => {
    if (viewer.hidden || document.hidden) return;
    paint();
    kick();
  };

  const visibleRange = (): { from: number; to: number } => {
    const pad = Math.max(0, visibleSpan - viewSpan);
    const maxScroll = Math.max(0, getGenome().length - visibleSpan);
    const scrollStart = Math.min(maxScroll, Math.max(0, viewStart - Math.floor(pad / 2)));
    const from = layout.genes[scrollStart]?.start ?? 0;
    const last = Math.min(getGenome().length, scrollStart + visibleSpan) - 1;
    const to = layout.genes[last]?.end ?? from;
    return { from, to: Math.max(to, from + 1) };
  };

  const placeTrack = (): void => {
    const { from, to } = visibleRange();
    const span = to - from;
    layout.segments.forEach((segment, index) => {
      const mark = marks[index];
      if (!mark) return;
      mark.style.left = `${((segment.start - from) / span) * 100}%`;
      mark.style.width = `${((segment.end - segment.start) / span) * 100}%`;
    });
    const shown = Math.min(viewSpan, getGenome().length - viewStart);
    const boxFrom = layout.genes[viewStart]?.start ?? from;
    const boxTo = layout.genes[viewStart + shown - 1]?.end ?? boxFrom;
    viewWindow.style.left = `${((boxFrom - from) / span) * 100}%`;
    viewWindow.style.width = `${((boxTo - boxFrom) / span) * 100}%`;
  };

  const selectGene = (index: number): void => {
    const button = geneButtons[index];
    const cassette = getGenome()[index];
    const gene = cassette ? geneById(cassette.geneId) : undefined;
    const item = geneItems[index];
    if (!button || !cassette || !gene || selected === button) return;
    if (selected) selected.setAttribute("aria-pressed", "false");
    selected = button;
    selectedIndex = index;
    button.setAttribute("aria-pressed", "true");
    showGene(gene, cassette, index);
    item?.scrollIntoView({ block: "nearest" });
  };

  const focusedGene = (): number => {
    const shown = Math.min(viewSpan, getGenome().length - viewStart);
    return Math.min(getGenome().length - 1, viewStart + Math.min(Math.floor(viewSpan / 2), shown - 1));
  };

  const setView = (start: number, motion: "none" | "in-out" | "drag" | "scroll" = "in-out", travelGenes?: number): void => {
    const previous = viewStart;
    const maxStart = Math.max(0, getGenome().length - viewSpan);
    viewStart = Math.min(maxStart, Math.max(0, start));
    const shown = Math.min(viewSpan, getGenome().length - viewStart);
    placeTrack();
    viewWindow.setAttribute("aria-valuemax", String(maxStart));
    viewWindow.setAttribute("aria-valuenow", String(viewStart));
    viewWindow.setAttribute("aria-valuetext", `${shown} of ${getGenome().length} genes in view`);
    viewLabel.textContent = `${shown} of ${getGenome().length} genes in view`;
    viewBack.disabled = viewStart <= 0;
    viewForward.disabled = viewStart >= maxStart;
    viewIn.disabled = visibleSpan <= viewSpan;
    viewOut.disabled = visibleSpan >= getGenome().length;
    for (let index = 0; index < geneButtons.length; index += 1) {
      geneButtons[index]?.classList.toggle("in-view", index >= viewStart && index < viewStart + shown);
    }
    aimHelix(motion, travelGenes ?? viewStart - previous);
  };

  const geneAt = (clientX: number): number => {
    const rect = map.getBoundingClientRect();
    const fraction = rect.width <= 0 ? 0 : (clientX - rect.left) / rect.width;
    const { from, to } = visibleRange();
    const cursor = from + Math.min(1, Math.max(0, fraction)) * (to - from);
    const index = layout.genes.findIndex((gene) => cursor < gene.end);
    return index < 0 ? getGenome().length - 1 : index;
  };

  viewBack.addEventListener("click", () => {
    setView(viewStart - 1, "scroll");
    selectGene(focusedGene());
    playCue("step");
  });
  viewForward.addEventListener("click", () => {
    setView(viewStart + 1, "scroll");
    selectGene(focusedGene());
    playCue("step");
  });
  const zoomBy = (factor: number): void => {
    const center = viewStart + (viewSpan - 1) / 2;
    let next = Math.round(visibleSpan * factor);
    if (next === visibleSpan) next = visibleSpan + (factor > 1 ? 1 : -1);
    visibleSpan = Math.min(getGenome().length, Math.max(viewSpan, next));
    setView(Math.round(center - (viewSpan - 1) / 2));
  };
  viewOut.addEventListener("click", () => {
    zoomBy(1 / 0.72);
    playCue("step");
  });
  viewIn.addEventListener("click", () => {
    zoomBy(0.72);
    playCue("step");
  });
  map.addEventListener("pointerdown", (event) => {
    if (event.target === viewWindow) return;
    setView(geneAt(event.clientX) - Math.floor(viewSpan / 2));
    selectGene(focusedGene());
    playCue("select");
  });
  viewWindow.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    tween = null;
    draggingHelix = true;
    catchingUp = true;
    helixArmed = true;
    gestureOrigin = displayAngle;
    gestureView = viewStart;
    spinStart = displayAngle;
    chaseTarget = displayAngle;
    chaseVelocity = 0;
    lastChaseSample = performance.now();
    kick();
    const originX = event.clientX;
    const originFrom = layout.genes[viewStart]?.start ?? 0;
    const { from, to } = visibleRange();
    const width = map.getBoundingClientRect().width || 1;
    const move = (moveEvent: PointerEvent): void => {
      const cursor = originFrom + ((moveEvent.clientX - originX) / width) * (to - from);
      const index = layout.genes.findIndex((gene) => cursor < gene.end);
      setView(index < 0 ? getGenome().length - viewSpan : index, "drag");
      selectGene(focusedGene());
    };
    const end = (): void => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      draggingHelix = false;
      if (Math.abs(chaseTarget - displayAngle) < 0.02 && Math.abs(chaseVelocity) < 0.08) catchingUp = false;
      else kick();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
  });
  const fillGenome = (focus: number | null): void => {
    const keep = focus ?? (selected ? selectedIndex : null);
    layout = layoutGenome(getGenome());
    list.replaceChildren();
    geneButtons.length = 0;
    geneItems.length = 0;
    selected = null;
    getGenome().forEach((cassette) => {
      const gene = geneById(cassette.geneId);
      if (!gene) return;
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "genome-gene";
      button.setAttribute("aria-pressed", "false");
      button.title = cassette.name === gene.name ? gene.name : `${cassette.name} (${gene.name})`;
      const name = document.createElement("span");
      name.className = "genome-gene-name";
      name.textContent = cassette.name;
      const category = document.createElement("span");
      category.className = "genome-gene-category";
      category.textContent = gene.category;
      button.append(name, category);
      button.addEventListener("click", () => {
        const nextIndex = geneButtons.indexOf(button);
        const travel = nextIndex - selectedIndex;
        selectGene(nextIndex);
        setView(nextIndex - Math.floor(viewSpan / 2), "in-out", travel);
        playCue("select");
      });
      geneButtons.push(button);
      geneItems.push(item);
      item.append(button);
      list.append(item);
    });
    segments.replaceChildren();
    marks.length = 0;
    for (const segment of layout.segments) {
      const mark = document.createElement("span");
      mark.className = `genome-segment ${segment.part}`;
      const cassette = getGenome()[segment.gene];
      if (cassette && segment.part !== "spacer") mark.title = `${cassette.name} ${segment.part}`;
      segments.append(mark);
      marks.push(mark);
    }
    const count = getGenome().length;
    const minSpan = Math.min(viewSpan, count);
    if (visibleSpan < minSpan || visibleSpan > count) visibleSpan = count;
    const focusIndex = keep === null || count === 0 ? null : Math.min(count - 1, Math.max(0, keep));
    if (count === 0) selectedIndex = 0;
    setView(focusIndex === null ? viewStart : focusIndex - Math.floor(viewSpan / 2), focus === null || viewer.hidden ? "none" : "in-out");
    if (focusIndex !== null) selectGene(focusIndex);
    else if (count === 0) showEmptyDetail();
    applyFilter();
  };
  fillGenome(null);
  subscribeGenome((notice) => fillGenome(notice.inserted));

  image.addEventListener("load", start);
  partSheets.promoter.addEventListener("load", start);
  partSheets.coding.addEventListener("load", start);
  partSheets.terminator.addEventListener("load", start);
  new ResizeObserver(() => paint()).observe(browser);
  new MutationObserver(start).observe(viewer, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", start);
  start();
}

type CassetteTile = { kind: string; name: string; icon: string };

/** Every tile the editor used to assemble the cassette, in bench order. */
function cassetteTiles(gene: GeneRecord, cassette: Cassette): CassetteTile[] {
  const tiles: CassetteTile[] = [];
  const push = (kind: string, name: string, icon: string | null): void => {
    tiles.push({ kind, name, icon: icon ?? CYTOSOLIC_ICON });
  };
  push("Promoter", promoterById(cassette.promoterId)?.name ?? cassette.promoterId, regulatoryIcon(cassette.promoterId));
  if (amountRange(cassette.promoterId)) {
    const ranged: readonly (readonly [string | null, string])[] = [
      [cassette.amountMinId, "Amount min"],
      [cassette.amountMaxId, "Amount max"],
    ];
    for (const [id, kind] of ranged) {
      if (!id) continue;
      push(kind, amountById(id)?.name ?? id, regulatoryIcon(id));
    }
  } else if (cassette.amountId) {
    push("Amount", amountById(cassette.amountId)?.name ?? cassette.amountId, regulatoryIcon(cassette.amountId));
  }
  push("Coding", gene.name, `/ui/genome_viewer/proteins/individuals_32x32/${gene.id}.png`);
  const tagged: readonly (readonly [string | null, string])[] = [
    [cassette.routeId, "Destination"],
    [cassette.siteId, "Position"],
  ];
  for (const [id, kind] of tagged) {
    if (!id) continue;
    push(kind, tagById(id)?.name ?? id, regulatoryIcon(id));
  }
  return tiles;
}

function layoutGenome(entries: readonly { geneId: string }[]): {
  total: number;
  segments: { gene: number; part: string; weight: number; start: number; end: number }[];
  genes: { start: number; end: number }[];
} {
  const segments: { gene: number; part: string; weight: number; start: number; end: number }[] = [];
  const genes: { start: number; end: number }[] = [];
  let cursor = 0;
  entries.forEach((entry, index) => {
    const start = cursor;
    for (const part of PARTS) {
      const weight = spanWeight(part, entry.geneId);
      segments.push({ gene: index, part, start: cursor, end: cursor + weight, weight });
      cursor += weight;
    }
    genes.push({ start, end: cursor });
  });
  return { total: Math.max(1, cursor), segments, genes };
}

function swooshEase(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  const sharpness = 16;
  const sigmoid = (value: number): number => 1 / (1 + Math.exp(-sharpness * (value - 0.5)));
  const start = sigmoid(0);
  const end = sigmoid(1);
  return (sigmoid(x) - start) / (end - start);
}

function frameIndex(angle: number): number {
  const tau = Math.PI * 2;
  let wrapped = angle % tau;
  if (wrapped < 0) wrapped += tau;
  return Math.floor((wrapped / tau) * FRAME_COUNT + 0.5) % FRAME_COUNT;
}

type Quat = { x: number; y: number; z: number; w: number };

function axisQuat(angle: number): Quat {
  const half = angle * 0.5;
  return { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) };
}

function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;
  let dot = a.x * bx + a.y * by + a.z * bz + a.w * bw;
  if (dot < 0) {
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
    dot = -dot;
  }
  if (dot > 0.9995) {
    const x = a.x + (bx - a.x) * t;
    const y = a.y + (by - a.y) * t;
    const z = a.z + (bz - a.z) * t;
    const w = a.w + (bw - a.w) * t;
    const inv = 1 / Math.hypot(x, y, z, w);
    return { x: x * inv, y: y * inv, z: z * inv, w: w * inv };
  }
  const theta = Math.acos(Math.min(1, dot));
  const sin = Math.sin(theta);
  const w1 = Math.sin((1 - t) * theta) / sin;
  const w2 = Math.sin(t * theta) / sin;
  return { x: a.x * w1 + bx * w2, y: a.y * w1 + by * w2, z: a.z * w1 + bz * w2, w: a.w * w1 + bw * w2 };
}

function quatAngle(q: Quat): number {
  return 2 * Math.atan2(q.x, q.w);
}

function unwrapNear(angle: number, target: number): number {
  const tau = Math.PI * 2;
  return angle + Math.round((target - angle) / tau) * tau;
}

function categoryIcon(category: string): string | null {
  const slug = category.toLowerCase();
  if (!["metabolism", "homeostasis", "morphology", "motility", "perception", "regulation", "reproduction"].includes(slug)) return null;
  return `/ui/genome_viewer/categories/${slug}_32x32.png`;
}

function turnsForGenes(geneDelta: number): number {
  const span = Math.max(1, getGenome().length - 1);
  const magnitude = Math.min(1, Math.abs(geneDelta) / span);
  return SWOOSH_NEAR_TURNS + (SWOOSH_FAR_TURNS - SWOOSH_NEAR_TURNS) * magnitude;
}

function peakRadians(turns: number): number {
  const span = Math.max(1, SWOOSH_FAR_TURNS - SWOOSH_NEAR_TURNS);
  const amount = Math.min(1, Math.max(0, (turns - SWOOSH_NEAR_TURNS) / span));
  const turnsPerSecond = 12 + (48 - 12) * amount;
  return turnsPerSecond * Math.PI * 2;
}

function swooshDuration(turns: number): number {
  const peak = peakRadians(Math.max(turns, SWOOSH_NEAR_TURNS));
  const duration = (4 * Math.max(turns, 0.25) * Math.PI * 2) / peak;
  return Math.min(2000, Math.max(800, duration));
}

function windTarget(from: number, to: number, geneDelta: number): number {
  const tau = Math.PI * 2;
  let shortest = (to - from) % tau;
  if (shortest > Math.PI) shortest -= tau;
  if (shortest < -Math.PI) shortest += tau;
  if (geneDelta === 0) return from + shortest;
  const direction = Math.sign(geneDelta);
  if (shortest * direction < 0) shortest += direction * tau;
  const spin = direction * turnsForGenes(geneDelta) * tau;
  let correction = shortest - spin;
  correction = ((correction % tau) + tau) % tau;
  if (correction > tau / 2) correction -= tau;
  let travel = spin + correction;
  if (Math.abs(travel) + 1e-6 < Math.abs(spin)) travel += direction * tau;
  return from + travel;
}

function slerpAngle(from: number, to: number, t: number): number {
  const delta = to - from;
  if (Math.abs(delta) <= Math.PI) {
    return unwrapNear(quatAngle(quatSlerp(axisQuat(from), axisQuat(to), t)), from + delta * t);
  }
  const pieces = Math.ceil(Math.abs(delta) / Math.PI);
  const piece = delta / pieces;
  const pos = Math.min(pieces, t * pieces);
  const index = Math.min(pieces - 1, Math.floor(pos));
  const local = pos - index;
  const start = from + piece * index;
  const expected = start + piece * local;
  return unwrapNear(quatAngle(quatSlerp(axisQuat(start), axisQuat(start + piece), local)), expected);
}

function spanWeight(part: (typeof PARTS)[number], id: string): number {
  const roll = hash(`${id}:${part}`);
  if (part === "coding") return 8 + (roll % 13);
  if (part === "promoter") return 2 + (roll % 5);
  if (part === "terminator") return 2 + (roll % 5);
  return 3 + (roll % 8);
}

function hash(value: string): number {
  let mixed = 0;
  for (const char of value) mixed = (mixed * 33 + char.charCodeAt(0)) >>> 0;
  return mixed;
}
