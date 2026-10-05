import { bodyFromSnapshot, colliderSignedDistance, curvedHalfExtents, orientedCapsule } from "./shape";
import type { CellSnapshot } from "./types";

export interface WorldRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Something the pointer can rest on. The card text is placeholder until each kind has real copy. */
export interface InspectTarget {
  id: string;
  title: string;
  lines: readonly string[];
  contains(worldX: number, worldY: number): boolean;
  bounds(): WorldRect;
}

export interface InspectView {
  worldAt(clientX: number, clientY: number): [number, number] | null;
  clientAt(worldX: number, worldY: number): [number, number] | null;
}

interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const HOVER_COLOR = "#8c9aa0";
const SELECT_COLOR = "#e2decd";
const HOVER_THICK = 2;
const SELECT_THICK = 3;

export function playerCellTarget(cell: CellSnapshot): InspectTarget {
  return {
    id: `cell:${cell.id}`,
    title: "Player cell",
    lines: ["Placeholder"],
    contains(worldX, worldY) {
      return cellContains(cell, worldX, worldY);
    },
    bounds() {
      return cellBounds(cell);
    },
  };
}

export function createInspect(host: HTMLCanvasElement, view: InspectView) {
  const corners = document.createElement("canvas");
  corners.id = "inspect-corners";
  corners.setAttribute("aria-hidden", "true");
  const context = corners.getContext("2d");
  if (!context) throw new Error("could not create inspect overlay");

  const panel = document.createElement("aside");
  panel.id = "inspector";
  const head = document.createElement("div");
  head.className = "inspector-head";
  head.textContent = "Inspector";
  const body = document.createElement("div");
  body.className = "inspector-body";
  const inner = document.createElement("div");
  inner.className = "inspector-body-inner";
  const titleEl = document.createElement("div");
  titleEl.className = "inspector-title";
  const linesEl = document.createElement("div");
  linesEl.className = "inspector-lines";
  inner.append(titleEl, linesEl);
  body.append(inner);
  panel.append(head, body);
  document.body.append(corners, panel);

  let enabled = true;
  let targets: readonly InspectTarget[] = [];
  let pointerInside = false;
  let pointerX = 0;
  let pointerY = 0;
  let hoveredId: string | null = null;
  let selectedId: string | null = null;
  let shownKey = "";

  const pick = (clientX: number, clientY: number): string | null => {
    const world = view.worldAt(clientX, clientY);
    for (const target of targets) {
      if (world && target.contains(world[0], world[1])) return target.id;
      const box = screenBox(view, target.bounds());
      if (box && insideBracket(clientX, clientY, box)) return target.id;
    }
    return null;
  };

  const refreshHover = (): void => {
    hoveredId = enabled && pointerInside ? pick(pointerX, pointerY) : null;
  };

  const syncInspector = (): void => {
    const selected = targets.find((target) => target.id === selectedId) ?? null;
    panel.classList.toggle("open", selected !== null);
    if (!selected) return;
    const nextKey = `${selected.title}\n${selected.lines.join("\n")}`;
    if (shownKey === nextKey) return;
    shownKey = nextKey;
    titleEl.textContent = selected.title;
    linesEl.replaceChildren();
    for (const line of selected.lines) {
      const row = document.createElement("div");
      row.textContent = line;
      linesEl.append(row);
    }
  };

  const paint = (): void => {
    const rect = host.getBoundingClientRect();
    corners.style.left = `${rect.left}px`;
    corners.style.top = `${rect.top}px`;
    corners.style.width = `${rect.width}px`;
    corners.style.height = `${rect.height}px`;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (corners.width !== width || corners.height !== height) {
      corners.width = width;
      corners.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    syncInspector();
    if (!enabled || rect.width <= 0 || rect.height <= 0) return;

    const snap = (value: number): number => Math.round(value * ratio) / ratio;
    for (const target of targets) {
      const selected = target.id === selectedId;
      const hovered = target.id === hoveredId;
      if (!selected && !hovered) continue;
      const box = screenBox(view, target.bounds());
      if (!box) continue;
      drawCorners(context, box, rect, selected, snap);
    }
  };

  return {
    setEnabled(next: boolean): void {
      enabled = next;
      if (!enabled) hoveredId = null;
      paint();
    },
    update(next: readonly InspectTarget[]): void {
      targets = next;
      if (selectedId && !targets.some((target) => target.id === selectedId)) selectedId = null;
      refreshHover();
      paint();
    },
    pointer(clientX: number, clientY: number): void {
      pointerInside = true;
      pointerX = clientX;
      pointerY = clientY;
      refreshHover();
      paint();
    },
    pointerLeave(): void {
      pointerInside = false;
      hoveredId = null;
      paint();
    },
    press(clientX: number, clientY: number): void {
      if (!enabled) return;
      pointerInside = true;
      pointerX = clientX;
      pointerY = clientY;
      selectedId = pick(clientX, clientY);
      refreshHover();
      paint();
    },
    hovering(): boolean {
      return hoveredId !== null;
    },
  };
}

function insideBracket(clientX: number, clientY: number, box: ScreenBox): boolean {
  const padded = expandBox(box);
  return clientX >= padded.left && clientX <= padded.right && clientY >= padded.top && clientY <= padded.bottom;
}

function expandBox(box: ScreenBox): ScreenBox {
  const short = Math.min(box.right - box.left, box.bottom - box.top);
  const gap = Math.max(4, Math.min(14, Math.round(short * 0.12)));
  return {
    left: box.left - gap,
    top: box.top - gap,
    right: box.right + gap,
    bottom: box.bottom + gap,
  };
}

function screenBox(view: InspectView, bounds: WorldRect): ScreenBox | null {
  const topLeft = view.clientAt(bounds.minX, bounds.maxY);
  const bottomRight = view.clientAt(bounds.maxX, bounds.minY);
  if (!topLeft || !bottomRight) return null;
  return {
    left: Math.min(topLeft[0], bottomRight[0]),
    top: Math.min(topLeft[1], bottomRight[1]),
    right: Math.max(topLeft[0], bottomRight[0]),
    bottom: Math.max(topLeft[1], bottomRight[1]),
  };
}

function drawCorners(
  context: CanvasRenderingContext2D,
  box: ScreenBox,
  rect: DOMRect,
  selected: boolean,
  snap: (value: number) => number,
): void {
  const width = box.right - box.left;
  const height = box.bottom - box.top;
  if (width < 2 || height < 2) return;
  const short = Math.min(width, height);
  const padded = expandBox(box);
  const thick = Math.min(selected ? SELECT_THICK : HOVER_THICK, Math.max(1, short * 0.16));
  const left = snap(padded.left - rect.left);
  const top = snap(padded.top - rect.top);
  const right = snap(padded.right - rect.left);
  const bottom = snap(padded.bottom - rect.top);
  const span = Math.min(right - left, bottom - top);
  const maxArm = Math.max(thick, span * 0.46);
  const arm = snap(Math.min(maxArm, Math.max(thick * 3, span * 0.22)));
  const stroke = Math.max(1 / (window.devicePixelRatio || 1), snap(thick));
  if (arm < stroke || right - left < stroke * 2 || bottom - top < stroke * 2) return;

  context.fillStyle = selected ? SELECT_COLOR : HOVER_COLOR;
  context.fillRect(left, top, arm, stroke);
  context.fillRect(left, top, stroke, arm);
  context.fillRect(right - arm, top, arm, stroke);
  context.fillRect(right - stroke, top, stroke, arm);
  context.fillRect(left, bottom - stroke, arm, stroke);
  context.fillRect(left, bottom - arm, stroke, arm);
  context.fillRect(right - arm, bottom - stroke, arm, stroke);
  context.fillRect(right - stroke, bottom - arm, stroke, arm);
}

export function cellContains(cell: CellSnapshot, worldX: number, worldY: number): boolean {
  const [x, y] = worldToLocal(cell, worldX, worldY);
  return colliderSignedDistance(x, y, bodyFromSnapshot(cell)) <= 0;
}

export function cellBounds(cell: CellSnapshot): WorldRect {
  const shape = orientedCapsule(cell.length, cell.width);
  const [halfX, halfY] = curvedHalfExtents(shape, cell.bend ?? 0);
  const hx = halfX + cell.capsule;
  const hy = halfY + cell.capsule;
  const cos = Math.cos(cell.angle);
  const sin = Math.sin(cell.angle);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const corners: Array<[number, number]> = [
    [-hx, -hy],
    [-hx, hy],
    [hx, -hy],
    [hx, hy],
  ];
  for (const pilus of cell.pili ?? []) {
    corners.push([pilus.x + pilus.dirX * pilus.length, pilus.y + pilus.dirY * pilus.length]);
  }
  for (const [lx, ly] of corners) {
    const wx = cell.x + cos * lx - sin * ly;
    const wy = cell.y + sin * lx + cos * ly;
    if (wx < minX) minX = wx;
    if (wy < minY) minY = wy;
    if (wx > maxX) maxX = wx;
    if (wy > maxY) maxY = wy;
  }
  return { minX, minY, maxX, maxY };
}

function worldToLocal(cell: CellSnapshot, worldX: number, worldY: number): [number, number] {
  const dx = worldX - cell.x;
  const dy = worldY - cell.y;
  const cos = Math.cos(cell.angle);
  const sin = Math.sin(cell.angle);
  return [cos * dx + sin * dy, -sin * dx + cos * dy];
}
