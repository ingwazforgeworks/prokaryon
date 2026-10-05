import { bodySignedDistance, flagellarAxisLocal, type BodyShape, type ContourPoint } from "./shape";

export type GlowSite = "cytosol" | "transmembrane" | "secreted" | "polar" | "antipolar" | "bipolar" | "lateral" | "antilateral" | "bilateral" | "anchored";

export interface FluorescenceSignal {
  entryId: string;
  routeId: string | null;
  siteId: string | null;
  abundance: number | null;
  rate: number | null;
  selected: boolean;
}

interface Grain {
  seed: number;
  weight: number;
  routeId: string | null;
  siteId: string | null;
  selected: boolean;
}

interface PlacementFields {
  cytosol: number;
  transmembrane: number;
  membrane: number;
  secreted: number;
  outerFace: number;
  contact: number;
  polarCap: number;
  antipolarCap: number;
  oneSide: number;
  otherSide: number;
}

function directionFactor(siteId: string | null, fields: PlacementFields): number {
  if (siteId === "PolarLocalizationSignal") return fields.polarCap;
  if (siteId === "AntiPolarLocalizationSignal") return fields.antipolarCap;
  if (siteId === "BIPO") return Math.min(1, fields.polarCap + fields.antipolarCap);
  if (siteId === "LATR") return fields.oneSide;
  if (siteId === "ANTL") return fields.otherSide;
  if (siteId === "BILT") return Math.min(1, fields.oneSide + fields.otherSide);
  return 1;
}

/** Route decides inside, wall, outer face, or outside. A site tag limits that to one pole or side. */
function placementMask(routeId: string | null, siteId: string | null, fields: PlacementFields): number {
  const direction = directionFactor(siteId, fields);
  if (routeId === "SecretoryPeptide") return fields.secreted * (siteId ? direction : 1);
  if (routeId === "SURF") return fields.outerFace * (siteId ? direction : fields.contact);
  if (routeId === "TransmembraneSignal") return fields.transmembrane * (siteId ? direction : 1);
  if (siteId) return fields.membrane * direction;
  return fields.cytosol;
}

export function glowSite(tagId: string | null): GlowSite {
  if (tagId === "SecretoryPeptide") return "secreted";
  if (tagId === "TransmembraneSignal") return "transmembrane";
  if (tagId === "PolarLocalizationSignal") return "polar";
  if (tagId === "AntiPolarLocalizationSignal") return "antipolar";
  if (tagId === "BIPO") return "bipolar";
  if (tagId === "LATR") return "lateral";
  if (tagId === "ANTL") return "antilateral";
  if (tagId === "BILT") return "bilateral";
  if (tagId === "SURF") return "anchored";
  return "cytosol";
}

/** 0–1 brightness. Abundance is the GFP signal. Rate is used only when abundance is not connected. */
export function fluorescenceLevel(abundance: number | null, rate: number | null): number | null {
  if (abundance !== null && Number.isFinite(abundance) && abundance >= 0) return abundance / (abundance + 90);
  if (rate !== null && Number.isFinite(rate) && rate >= 0) return rate / (rate + 14);
  return null;
}

/**
 * Procedural cross-section: a two-leaflet bilayer, plus a green grain.
 * Each protein keeps its own stable speckle. Brightness runs continuously
 * from dark green to full green. The tag picks the pattern: cytosol, secreted,
 * transmembrane, one pole, the opposite pole, both poles, one side, the other
 * side, both sides, or one outer contact. Cytosol is stronger near the wall.
 * `time` is the monitoring clock, so a paused display holds still.
 */
export function drawFluorescence(
  context: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  body: BodyShape,
  loops: ContourPoint[][],
  signals: FluorescenceSignal[],
  time: number,
  isolate: boolean,
  selectedId: string | null,
): boolean {
  if (cssW < 2 || cssH < 2) return false;
  context.clearRect(0, 0, cssW, cssH);
  context.fillStyle = "#050708";
  context.fillRect(0, 0, cssW, cssH);

  const usable = loops.filter((loop) => loop.length >= 3);
  if (usable.length === 0) return false;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const loop of usable) {
    for (const point of loop) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
  }
  if (!Number.isFinite(minX) || maxX - minX < 1e-5 || maxY - minY < 1e-5) return false;

  const pad = 46;
  const scale = Math.min((cssW - pad * 2) / (maxX - minX), (cssH - pad * 2) / (maxY - minY));
  if (!Number.isFinite(scale) || scale <= 0) return false;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const sx = (x: number): number => cssW / 2 + (x - midX) * scale;
  const sy = (y: number): number => cssH / 2 - (y - midY) * scale;

  const wall = 3.6 / scale;
  const inners = usable.map((loop) => offsetInward(loop, wall));
  const grains = collectGrains(signals, isolate, selectedId);

  context.beginPath();
  for (const loop of usable) trace(context, loop, sx, sy);
  context.fillStyle = "#0c1211";
  context.fill();
  drawBilayer(context, usable, inners, sx, sy);
  drawPhotonField(context, cssW, cssH, body, usable, grains, time, scale, midX, midY);
  strokeLeaflets(context, usable, inners, sx, sy);
  return true;
}

/** Pattern strength used when a selected gene has no measured abundance yet. */
const SCHEMATIC_LEVEL = 0.78;

function collectGrains(signals: FluorescenceSignal[], isolate: boolean, selectedId: string | null): Grain[] {
  const hideOthers = isolate && selectedId !== null && signals.some((signal) => signal.selected);
  const grains: Grain[] = [];
  let otherWeight = 0;
  for (const signal of signals) {
    const measured = fluorescenceLevel(signal.abundance, signal.rate);
    if (!signal.selected && (hideOthers || measured === null || measured <= 0)) continue;
    const level = signal.selected && measured === null ? SCHEMATIC_LEVEL : measured;
    if (level === null || level <= 0) continue;
    const weight = signal.selected ? level : level * 0.05;
    grains.push({
      seed: hashString(signal.entryId),
      weight,
      routeId: signal.routeId,
      siteId: signal.siteId,
      selected: signal.selected,
    });
    if (!signal.selected) otherWeight += weight;
  }
  if (otherWeight > 0.34) {
    const scale = 0.34 / otherWeight;
    for (const grain of grains) {
      if (!grain.selected) grain.weight *= scale;
    }
  }
  return grains;
}

function offsetInward(loop: ContourPoint[], distance: number): ContourPoint[] {
  return loop.map((point) => ({
    x: point.x - point.nx * distance,
    y: point.y - point.ny * distance,
    nx: point.nx,
    ny: point.ny,
  }));
}

function trace(context: CanvasRenderingContext2D, loop: ContourPoint[], sx: (x: number) => number, sy: (y: number) => number): void {
  loop.forEach((point, index) => {
    const x = sx(point.x);
    const y = sy(point.y);
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
}

function drawBilayer(
  context: CanvasRenderingContext2D,
  outers: ContourPoint[][],
  inners: ContourPoint[][],
  sx: (x: number) => number,
  sy: (y: number) => number,
): void {
  context.save();
  context.globalCompositeOperation = "source-over";
  context.beginPath();
  for (let index = 0; index < outers.length; index += 1) {
    const outer = outers[index];
    const inner = inners[index];
    if (!outer || !inner) continue;
    trace(context, outer, sx, sy);
    trace(context, inner, sx, sy);
  }
  context.fillStyle = "#24302c";
  context.fill("evenodd");
  context.lineWidth = 1;
  context.strokeStyle = "#d7e4de";
  context.beginPath();
  for (const loop of outers) trace(context, loop, sx, sy);
  context.stroke();
  context.strokeStyle = "#93aaa0";
  context.beginPath();
  for (const loop of inners) trace(context, loop, sx, sy);
  context.stroke();
  context.restore();
}

function strokeLeaflets(
  context: CanvasRenderingContext2D,
  outers: ContourPoint[][],
  inners: ContourPoint[][],
  sx: (x: number) => number,
  sy: (y: number) => number,
): void {
  context.save();
  context.lineWidth = 1;
  context.strokeStyle = "#d7e4de";
  context.beginPath();
  for (const loop of outers) trace(context, loop, sx, sy);
  context.stroke();
  context.strokeStyle = "#93aaa0";
  context.beginPath();
  for (const loop of inners) trace(context, loop, sx, sy);
  context.stroke();
  context.restore();
}

const PHOTON_BIN = 3;

let photonCanvas: HTMLCanvasElement | null = null;
let photonPixels = new Uint8ClampedArray(0);

function drawPhotonField(
  context: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  body: BodyShape,
  loops: ContourPoint[][],
  grains: Grain[],
  time: number,
  scale: number,
  midX: number,
  midY: number,
): void {
  if (grains.length === 0) return;

  const cols = Math.ceil(cssW / PHOTON_BIN);
  const rows = Math.ceil(cssH / PHOTON_BIN);
  const count = cols * rows;
  if (photonPixels.length !== count * 4) photonPixels = new Uint8ClampedArray(count * 4);
  else photonPixels.fill(0);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let poleMin = Infinity;
  let poleMax = -Infinity;
  let sideMin = Infinity;
  let sideMax = -Infinity;
  const axis = flagellarAxisLocal(body.length, body.width);
  const ax = Math.cos(axis);
  const ay = Math.sin(axis);
  const sideX = -ay;
  const sideY = ax;
  for (const loop of loops) {
    for (const point of loop) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
      const projection = point.x * ax + point.y * ay;
      if (projection < poleMin) poleMin = projection;
      if (projection > poleMax) poleMax = projection;
      const side = point.x * sideX + point.y * sideY;
      if (side < sideMin) sideMin = side;
      if (side > sideMax) sideMax = side;
    }
  }
  const poleSpan = Math.max(1e-4, poleMax - poleMin);
  const sideSpan = Math.max(1e-4, sideMax - sideMin);
  const toScreenX = (x: number): number => cssW / 2 + (x - midX) * scale;
  const toScreenY = (y: number): number => cssH / 2 - (y - midY) * scale;
  const margin = 26;
  const x0 = Math.max(0, Math.floor((toScreenX(minX) - margin) / PHOTON_BIN));
  const x1 = Math.min(cols - 1, Math.ceil((toScreenX(maxX) + margin) / PHOTON_BIN));
  const y0 = Math.max(0, Math.floor((toScreenY(maxY) - margin) / PHOTON_BIN));
  const y1 = Math.min(rows - 1, Math.ceil((toScreenY(minY) + margin) / PHOTON_BIN));
  const membraneSigma = 2.2 / scale;
  const transmembraneSigma = 8 / scale;
  const secretedReach = 20 / scale;
  const rimSigma = Math.max(Math.min(body.length, body.width) * 0.16, 0.02);

  for (let iy = y0; iy <= y1; iy += 1) {
    for (let ix = x0; ix <= x1; ix += 1) {
      const px = ix * PHOTON_BIN + PHOTON_BIN / 2;
      const py = iy * PHOTON_BIN + PHOTON_BIN / 2;
      const wx = midX + (px - cssW / 2) / scale;
      const wy = midY - (py - cssH / 2) / scale;
      const distance = bodySignedDistance(wx, wy, body);
      const membrane = Math.exp(-(distance * distance) / (2 * membraneSigma * membraneSigma));
      const transmembrane = Math.exp(-(distance * distance) / (2 * transmembraneSigma * transmembraneSigma));
      const interior = Math.max(0, -distance);
      const rim = Math.exp(-interior / rimSigma);
      const cytosol = distance < -1.2 / scale ? 0.2 + 0.8 * rim : 0;
      const outside = distance > 1.2 / scale ? Math.exp(-(distance - 1.2 / scale) / secretedReach) : 0;
      const projection = (wx * ax + wy * ay - poleMin) / poleSpan;
      const polarCap = Math.exp(-((1 - projection) * (1 - projection)) / 0.05);
      const antipolarCap = Math.exp(-(projection * projection) / 0.05);
      const side = (wx * sideX + wy * sideY - sideMin) / sideSpan;
      const oneSide = Math.exp(-(side * side) / 0.09);
      const otherSide = Math.exp(-((side - 1) * (side - 1)) / 0.09);
      const secreted = outside * (1 - membrane);
      const contact = Math.exp(-(side * side) / 0.04);
      const outerFace = Math.exp(-((distance - 2.4 / scale) * (distance - 2.4 / scale)) / (2 * membraneSigma * membraneSigma));
      const masks = { cytosol, transmembrane, membrane, secreted, outerFace, contact, polarCap, antipolarCap, oneSide, otherSide };
      let energy = 0;
      let voiceSum = 0;
      for (const grain of grains) {
        const mask = placementMask(grain.routeId, grain.siteId, masks);
        if (mask <= 0.02) continue;
        const placed = grain.weight * mask;
        energy += placed;
        voiceSum += grain.selected ? placed * 4 : placed;
      }
      if (energy <= 0.03 || voiceSum <= 0) continue;
      let pick = unitHash(ix, iy, 0x51ed) * voiceSum;
      let seed = 1;
      for (const grain of grains) {
        const mask = placementMask(grain.routeId, grain.siteId, masks);
        if (mask <= 0.02) continue;
        pick -= (grain.selected ? 4 : 1) * grain.weight * mask;
        if (pick <= 0) {
          seed = grain.seed;
          break;
        }
      }
      const speck = unitHash(ix, iy, seed);
      const breathe = 0.97 + 0.03 * Math.sin(time * 0.35 + speck * Math.PI * 2);
      const amount = (1 - Math.exp(-energy * 1.65)) * (0.38 + 0.62 * speck) * breathe;
      if (amount <= 0.03) continue;
      const pixel = (iy * cols + ix) * 4;
      photonPixels[pixel] = 8 + 42 * amount;
      photonPixels[pixel + 1] = 34 + 198 * amount;
      photonPixels[pixel + 2] = 20 + 90 * amount;
      photonPixels[pixel + 3] = Math.min(255, 70 + 185 * amount);
    }
  }

  if (!photonCanvas) photonCanvas = document.createElement("canvas");
  if (photonCanvas.width !== cols || photonCanvas.height !== rows) {
    photonCanvas.width = cols;
    photonCanvas.height = rows;
  }
  const target = photonCanvas.getContext("2d");
  if (!target) return;
  const image = target.createImageData(cols, rows);
  image.data.set(photonPixels);
  target.putImageData(image, 0, 0);
  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(photonCanvas, 0, 0, cols * PHOTON_BIN, rows * PHOTON_BIN);
  context.restore();
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function unitHash(ix: number, iy: number, seed: number): number {
  let hash = Math.imul(ix + 1, 0x9e3779b1) ^ Math.imul(iy + 1, 0x85ebca6b) ^ seed;
  hash = Math.imul(hash ^ (hash >>> 16), 0x7feb352d);
  hash = Math.imul(hash ^ (hash >>> 15), 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967295;
}

