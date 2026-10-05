import { bootMark, bootPulse } from "./boot";
import type { DecorationStamp } from "./decorations";
import { NUTRIENT_CELL, NUTRIENT_COLUMNS, NUTRIENT_ORIGIN_X, NUTRIENT_ORIGIN_Y, NUTRIENT_ROWS, type NutrientFace } from "./nutrients";
import { curvedOutlineSamples, orientedCapsule, toLocal } from "./shape";

/**
 * Patch assembly follows the kit rules. Square chunks stay in their original
 * maps and are not reused here. Patches overlap by opaque pixels, at half
 * scale and 64 pixels per world unit, with centers at least 82 assembly
 * pixels apart. Draw order is a stable random value, not a position sort.
 */
const PIXELS_PER_UNIT = 64;
const SPRITE_SCALE = 0.5;
const MIN_SEPARATION = 82 / PIXELS_PER_UNIT;
const OVERLAP_SAMPLES = 6;
const FIBER_TOUCH = 12;
const FIBER_OUTSIDE = 24;
const FIBER_MARGIN = 3 / PIXELS_PER_UNIT;
const BAND = 18;
const COLLAR = 24;
const PLUG = 8;

export const WORLD_LEFT = -120;
export const WORLD_RIGHT = 120;
export const WORLD_BOTTOM = -500;
const COLUMN_TOP = 500;
if (
  NUTRIENT_ORIGIN_X !== WORLD_LEFT ||
  NUTRIENT_ORIGIN_Y !== WORLD_BOTTOM ||
  NUTRIENT_COLUMNS * NUTRIENT_CELL !== WORLD_RIGHT - WORLD_LEFT ||
  NUTRIENT_ROWS * NUTRIENT_CELL !== COLUMN_TOP - WORLD_BOTTOM
) {
  throw new Error("nutrient field does not cover the water column");
}
const OUTER_LEFT = WORLD_LEFT - 6;
const OUTER_RIGHT = WORLD_RIGHT + 6;
const OUTER_BOTTOM = WORLD_BOTTOM - 6;
const SEED_DEPTH = 2.8;

/**
 * Fraction of along-wall motion kept while touching terrain.
 * Lubricin 0 drops that motion. Lubricin 1 keeps all of it.
 */
export function terrainSlideKeep(lubricin: number): number {
  return Math.min(1, Math.max(0, lubricin));
}

/** How far past the outline adhesin can feel solid terrain. */
const ADHESIN_REACH = 0.22;
/** Pull into that terrain at full adhesin, in world units per second. */
export const ADHESIN_SPEED = 8;

/** Speed of the pull into a nearby surface. 0 lets go. 1 is {@link ADHESIN_SPEED}. */
export function adhesinPull(adhesin: number): number {
  const t = Math.min(1, Math.max(0, adhesin));
  return t * ADHESIN_SPEED;
}

const PATCHES = ["patch_00", "patch_01", "patch_02", "patch_03", "patch_04", "patch_05"];
/** Same cell size as the temperature grid. Terrain cannot import that grid without a cycle. */
const ROCK_TEXEL = 10;
const ROCK_COLUMNS = (WORLD_RIGHT - WORLD_LEFT) / ROCK_TEXEL;
const ROCK_ROWS = (COLUMN_TOP - WORLD_BOTTOM) / ROCK_TEXEL;
/** Distance from solid terrain, sampled smoothly by the water. Full deep blue by this reach. */
const SHORE_CELL = 2;
const SHORE_COLUMNS = (WORLD_RIGHT - WORLD_LEFT) / SHORE_CELL;
const SHORE_ROWS = (COLUMN_TOP - WORLD_BOTTOM) / SHORE_CELL;
const SHORE_REACH = 72;
const VENTS = ["vent_00", "vent_01", "vent_02", "vent_03", "vent_04", "vent_05"];
const FIBERS = ["fiber_00", "fiber_01", "fiber_02"];
const DEBRIS = ["debris_00", "debris_01", "debris_02", "debris_03"];

interface ImageMask {
  name: string;
  texture: WebGLTexture;
  alpha: Uint8Array;
  width: number;
  height: number;
  hw: number;
  hh: number;
  asmW: number;
  asmH: number;
  samples: Array<[number, number]>;
  opaque: Array<[number, number]>;
  anchorX: number;
  anchorY: number;
  mineralX: number;
  mineralY: number;
  /** Opaque pixels, in local world units around the sprite center. */
  localMinX: number;
  localMinY: number;
  localMaxX: number;
  localMaxY: number;
}

export interface TerrainFeature {
  id: string;
  title: string;
  lines: readonly string[];
  contains(worldX: number, worldY: number): boolean;
  bounds(): { minX: number; minY: number; maxX: number; maxY: number };
}

interface Sprite {
  image: ImageMask;
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  rotation: number;
  order: number;
  solid: boolean;
}

interface TerrainStamp {
  name: string;
  x: number;
  y: number;
  rotation: number;
}

export interface BakedSprite {
  name: string;
  x: number;
  y: number;
  rotation: number;
  order: number;
  solid: boolean;
}

interface TerrainEdits {
  removed: string[];
  added: TerrainStamp[];
  lights?: Array<{ x: number; y: number }>;
  bubbles?: Array<{ x: number; y: number }>;
  heats?: Array<{ x: number; y: number; size?: number }>;
}

interface Passage {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  inner: number;
  outer: number;
}

export interface Pose {
  x: number;
  y: number;
  angle: number;
  length: number;
}

/** 0 on solid terrain, 1 at SHORE_REACH and beyond. Row 0 is the bottom of the column. */
export interface ShoreField {
  generation: number;
  width: number;
  height: number;
  originX: number;
  originY: number;
  spanX: number;
  spanY: number;
  texels: Uint8Array;
}

const SPRITE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRotation;
uniform vec2 uCamera;
uniform vec2 uHalfView;
out vec2 vUv;
out vec2 vWorld;
void main() {
  vec2 local = aCorner * uHalfSize;
  float c = cos(uRotation);
  float s = sin(uRotation);
  vec2 world = uCenter + vec2(c * local.x - s * local.y, s * local.x + c * local.y);
  gl_Position = vec4((world - uCamera) / uHalfView, 0.0, 1.0);
  vUv = vec2(aCorner.x * 0.5 + 0.5, 0.5 - aCorner.y * 0.5);
  vWorld = world;
}`;

const SPRITE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vWorld;
uniform sampler2D uSprite;
uniform float uLight;
uniform vec3 uPointLights[48];
uniform vec3 uPointColors[48];
uniform int uPointCount;
out vec4 fragColor;

vec3 pointGlow(vec2 world) {
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    if (i >= uPointCount) break;
    float dist = length(world - uPointLights[i].xy);
    float t = clamp(1.0 - dist / uPointLights[i].z, 0.0, 1.0);
    glow += uPointColors[i] * pow(t, 1.35);
  }
  return glow * 0.24;
}

void main() {
  vec4 tex = texture(uSprite, vUv);
  if (tex.a < 0.2) discard;
  vec3 color = mix(tex.rgb * 0.55, tex.rgb, uLight);
  fragColor = vec4(color + pointGlow(vWorld), 1.0);
}`;

export type PackedPointLights = { count: number; data: Float32Array; colors: Float32Array };

const VENT_LIGHT_COLOR: [number, number, number] = [1, 0.45, 0.1];

export class Terrain {
  private readonly program: WebGLProgram;
  private readonly quad: WebGLBuffer;
  private readonly sprites: Sprite[] = [];
  private readonly buckets = new Map<string, number[]>();
  private drawOrder: number[] = [];
  private ready = false;
  private scanPulse: ((local: number) => Promise<void>) | null = null;
  private slideNormal: { x: number; y: number } | null = null;
  /** Fraction of along-wall motion kept on contact. Lubricin raises this toward 1. */
  private slideKeep = 0;
  /** Extra local-space samples, such as pilus shafts, included in the body collider. */
  private colliderProbes: ReadonlyArray<[number, number]> = [];
  private patchMasks: ImageMask[] = [];
  private ventMasks: ImageMask[] = [];
  private depositMasks: ImageMask[] = [];
  private readonly depositCursor = new Map<string, number>();
  private readonly added: TerrainStamp[] = [];
  private readonly removed = new Set<string>();
  private lastStamp: [number, number] | null = null;
  private lights: Array<{ x: number; y: number }> = [];
  private bubbleSources: Array<{ x: number; y: number }> = [];
  private heatSources: Array<{ x: number; y: number; size: number }> = [];
  private readonly lightPack = new Float32Array(48 * 3);
  private readonly lightColor = new Float32Array(48 * 3);
  private readonly heatPack = new Float32Array(48 * 3);
  private readonly rockMask = new Uint8Array(ROCK_COLUMNS * ROCK_ROWS);
  private readonly shoreField: ShoreField = {
    generation: -1,
    width: SHORE_COLUMNS,
    height: SHORE_ROWS,
    originX: WORLD_LEFT,
    originY: WORLD_BOTTOM,
    spanX: WORLD_RIGHT - WORLD_LEFT,
    spanY: COLUMN_TOP - WORLD_BOTTOM,
    texels: new Uint8Array(SHORE_COLUMNS * SHORE_ROWS),
  };
  private structureGeneration = 0;
  private rockBuilt = -1;
  private shoreBuilt = -1;
  private depositFaceBuilt = -1;
  private depositFaceCache: NutrientFace[] = [];

  constructor(
    private readonly gl: WebGL2RenderingContext,
    start = true,
  ) {
    this.program = link(gl, SPRITE_VS, SPRITE_FS);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );
    if (start) void this.prepare();
  }

  /** Runs the seeded placement search once so the client can load the result. */
  async bakeLayout(groups: { patches: ImageMask[]; fibers: ImageMask[]; debris: ImageMask[] }): Promise<BakedSprite[]> {
    const random = mulberry32(0x5e1f_c0de);
    const passages = buildPassages(random);
    await this.assemble(groups.patches, passages, random);
    await this.attachFibers(groups.fibers, random);
    await this.scatterDebris(groups.debris, random);
    return this.sprites.map((sprite) => ({
      name: sprite.image.name,
      x: sprite.cx,
      y: sprite.cy,
      rotation: sprite.rotation,
      order: sprite.order,
      solid: sprite.solid,
    }));
  }

  maskFromPixels(pixels: Uint8Array, width: number, height: number, name: string): ImageMask {
    return buildMask(pixels, width, height, name, {} as WebGLTexture);
  }

  draw(halfView: [number, number], camera: [number, number], intensity: number, lights?: PackedPointLights): void {
    if (!this.ready) return;
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.uniform2f(uniform(gl, this.program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform2f(uniform(gl, this.program, "uCamera"), camera[0], camera[1]);
    gl.uniform1f(uniform(gl, this.program, "uLight"), intensity);
    const packed = lights ?? this.packPointLights({
      minX: camera[0] - halfView[0],
      maxX: camera[0] + halfView[0],
      minY: camera[1] - halfView[1],
      maxY: camera[1] + halfView[1],
    });
    gl.uniform1i(uniform(gl, this.program, "uPointCount"), packed.count);
    gl.uniform3fv(uniform(gl, this.program, "uPointLights"), packed.data);
    gl.uniform3fv(uniform(gl, this.program, "uPointColors"), packed.colors);
    gl.uniform1i(uniform(gl, this.program, "uSprite"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    for (const index of this.drawOrder) {
      const sprite = this.sprites[index];
      const [hw, hh] = bounds(sprite);
      if (Math.abs(sprite.cx - camera[0]) > halfView[0] + hw + 1) continue;
      if (Math.abs(sprite.cy - camera[1]) > halfView[1] + hh + 1) continue;
      gl.bindTexture(gl.TEXTURE_2D, sprite.image.texture);
      gl.uniform2f(uniform(gl, this.program, "uCenter"), sprite.cx, sprite.cy);
      gl.uniform2f(uniform(gl, this.program, "uHalfSize"), sprite.hw, sprite.hh);
      gl.uniform1f(uniform(gl, this.program, "uRotation"), sprite.rotation);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  setSlideKeep(keep: number): void {
    this.slideKeep = Math.min(1, Math.max(0, keep));
  }

  /** Unit direction from the body toward nearby solid terrain, or null when nothing is in reach. */
  stickDirection(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
  ): { x: number; y: number } | null {
    const saved = this.colliderProbes;
    this.colliderProbes = [];
    const normal = this.surfaceNormal(x, y, angle, length, width, bend, ADHESIN_REACH);
    this.colliderProbes = saved;
    return normal;
  }

  fitPose(previous: Pose, next: Pose, width: number, bend = 0, probes: ReadonlyArray<[number, number]> = []): Pose {
    this.colliderProbes = probes;
    const length = next.length;
    const angle = next.angle;
    if (!this.ready) return { x: next.x, y: next.y, angle, length };
    const free = (x: number, y: number, poseAngle = angle, poseLength = length) =>
      !this.overlaps(x, y, poseAngle, poseLength, width, bend);
    let x = previous.x;
    let y = previous.y;
    const carried = previous.angle;
    if (!free(x, y, carried, previous.length)) {
      const freed = this.separate(x, y, carried, length, width, bend);
      x = freed.x;
      y = freed.y;
    }
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-5) {
      const turned = this.settleRotation(x, y, previous.angle, angle, length, width, bend);
      return { x: turned.x, y: turned.y, angle: turned.angle, length };
    }
    const pushing =
      this.slideKeep < 0.999 &&
      this.slideNormal !== null &&
      dx * this.slideNormal.x + dy * this.slideNormal.y > 0.2 * dist;
    if (!free(x + dx, y + dy, carried, length) || pushing) {
      const slid = this.moveContact(x, y, dx, dy, carried, length, width, bend);
      x = slid.x;
      y = slid.y;
    } else {
      this.slideNormal = null;
      x += dx;
      y += dy;
    }
    const turned = this.settleRotation(x, y, previous.angle, angle, length, width, bend);
    return { x: turned.x, y: turned.y, angle: turned.angle, length };
  }

  /** True when the body, or the extra probes, sits in solid terrain. */
  poseOverlaps(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
    probes: ReadonlyArray<[number, number]> = [],
  ): boolean {
    this.colliderProbes = probes;
    return this.overlaps(x, y, angle, length, width, bend);
  }

  /** World-space point where the body meets solid terrain, if it does. */
  bodyContact(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
    probes: ReadonlyArray<[number, number]> = [],
  ): { x: number; y: number } | null {
    this.colliderProbes = probes;
    const direct = this.outlineContact(x, y, angle, length, width, bend);
    if (direct) return direct;
    if (!this.slideNormal) return null;
    const probe = 0.2;
    return this.outlineContact(
      x + this.slideNormal.x * probe,
      y + this.slideNormal.y * probe,
      angle,
      length,
      width,
      bend,
    );
  }

  private async prepare(): Promise<void> {
    let imagesDone = 0;
    const imageTotal = PATCHES.length + VENTS.length + FIBERS.length + DEBRIS.length;
    this.scanPulse = (local) => bootPulse("terrainImages", (imagesDone + local) / imageTotal);
    const track = async (url: string): Promise<ImageMask> => {
      const mask = await this.load(url);
      imagesDone += 1;
      bootMark("terrainImages", imagesDone / imageTotal);
      return mask;
    };
    const patches = await Promise.all(PATCHES.map((name) => track(`/environment/decorations/${name}.png`)));
    const vents = await Promise.all(VENTS.map((name) => track(`/environment/geothermal/${name}.png`)));
    const fibers = await Promise.all(FIBERS.map((name) => track(`/environment/decorations/${name}.png`)));
    const debris = await Promise.all(DEBRIS.map((name) => track(`/environment/decorations/${name}.png`)));
    this.scanPulse = null;
    bootMark("terrainImages", 1);
    const layout = await loadTerrainLayout();
    if (layout) await this.placeLayout(layout, [...patches, ...fibers, ...debris]);
    else {
      const random = mulberry32(0x5e1f_c0de);
      const passages = buildPassages(random);
      await this.assemble(patches, passages, random);
      await this.attachFibers(fibers, random);
      await this.scatterDebris(debris, random);
    }
    this.patchMasks = patches;
    this.ventMasks = vents;
    this.depositMasks = await this.loadDeposits();
    bootMark("deposits", 1);
    this.drawOrder = this.sprites.map((_, index) => index).sort((a, b) => this.sprites[a].order - this.sprites[b].order);
    await this.applySavedEdits();
    this.ready = true;
    bootMark("terrainBuild", 1);
  }

  paintAt(x: number, y: number): (() => boolean) | null {
    if (!this.ready || this.patchMasks.length === 0) return null;
    if (this.lastStamp && Math.hypot(x - this.lastStamp[0], y - this.lastStamp[1]) < MIN_SEPARATION) return null;
    if (!this.separated(x, y)) return null;
    const mask = this.patchMasks[Math.floor(Math.random() * this.patchMasks.length)];
    const rotation = Math.floor(Math.random() * 24) * (Math.PI / 12);
    const stamp = { name: mask.name, x, y, rotation };
    const sprite: Sprite = {
      image: mask,
      cx: x,
      cy: y,
      hw: mask.hw,
      hh: mask.hh,
      rotation,
      order: Math.floor(Math.random() * 1_000_000),
      solid: true,
    };
    this.add(sprite);
    this.added.push(stamp);
    this.insertDraw(this.sprites.length - 1);
    this.lastStamp = [x, y];
    return () => this.dropPainted(sprite, stamp);
  }

  ventAt(x: number, y: number): (() => boolean) | null {
    if (!this.ready || this.ventMasks.length === 0) return null;
    if (this.lastStamp && Math.hypot(x - this.lastStamp[0], y - this.lastStamp[1]) < 2.2) return null;
    const mask = this.ventMasks[Math.floor(Math.random() * this.ventMasks.length)];
    const stamp = { name: mask.name, x, y, rotation: 0 };
    const sprite: Sprite = {
      image: mask,
      cx: x,
      cy: y,
      hw: mask.hw,
      hh: mask.hh,
      rotation: 0,
      order: 2_500_000 + Math.floor(Math.random() * 100_000),
      solid: true,
    };
    this.add(sprite);
    this.added.push(stamp);
    this.insertDraw(this.sprites.length - 1);
    this.lastStamp = [x, y];
    return () => this.dropPainted(sprite, stamp);
  }

  depositAt(x: number, y: number, resource: string, facing: string): (() => boolean) | null {
    if (!this.ready || this.patchMasks.length === 0) return null;
    const variants = this.depositMasks.filter(
      (entry) => entry.name === `deposit_${resource}_${facing}` || entry.name.startsWith(`deposit_${resource}_${facing}_`),
    );
    if (variants.length === 0) return null;
    if (this.lastStamp && Math.hypot(x - this.lastStamp[0], y - this.lastStamp[1]) < 2.4) return null;
    const cursorKey = `${resource}_${facing}`;
    const cursor = this.depositCursor.get(cursorKey) ?? 0;
    const mask = variants[cursor % variants.length];
    this.depositCursor.set(cursorKey, cursor + 1);
    const intoX = mask.anchorX - mask.mineralX;
    const intoY = mask.anchorY - mask.mineralY;
    const into = Math.hypot(intoX, intoY);
    const bury = into > 0.05 ? 0.55 / into : 0;
    const [sx, sy] = snapSprite(mask, x - mask.anchorX + intoX * bury, y - mask.anchorY + intoY * bury, 0, 0);
    const stamp = { name: mask.name, x: sx, y: sy, rotation: 0 };
    const sprite: Sprite = {
      image: mask,
      cx: stamp.x,
      cy: stamp.y,
      hw: mask.hw,
      hh: mask.hh,
      rotation: 0,
      order: 2_600_000 + Math.floor(Math.random() * 100_000),
      solid: true,
    };
    this.add(sprite);
    this.added.push(stamp);
    const cleared = this.clearAroundVein(sprite);
    const built = this.meshAround(sprite);
    this.lastStamp = [x, y];
    return () => {
      this.dropPainted(sprite, stamp);
      for (let index = built.length - 1; index >= 0; index -= 1) this.dropPainted(built[index].sprite, built[index].stamp);
      for (const item of cleared) {
        if (item.stamp) this.added.push(item.stamp);
        else this.removed.delete(stampKey(item.sprite));
        this.sprites.push(item.sprite);
      }
      this.rebuildSpatial();
      return true;
    };
  }

  private clearAroundVein(vein: Sprite): Array<{ sprite: Sprite; stamp: TerrainStamp | null }> {
    const margin = 1.6;
    const pad = vein.hw + margin + 4;
    const x0 = Math.floor((vein.cx - pad) / 4);
    const x1 = Math.floor((vein.cx + pad) / 4);
    const y0 = Math.floor((vein.cy - pad) / 4);
    const y1 = Math.floor((vein.cy + pad) / 4);
    const seen = new Set<number>();
    for (let iy = y0; iy <= y1; iy += 1) {
      for (let ix = x0; ix <= x1; ix += 1) {
        const bucket = this.buckets.get(`${ix},${iy}`);
        if (!bucket) continue;
        for (const index of bucket) seen.add(index);
      }
    }
    const drop = new Set<number>();
    for (const index of seen) {
      const sprite = this.sprites[index];
      if (sprite === vein || sprite.image.name.startsWith("deposit_")) continue;
      if (this.touchesVein(sprite, vein, margin)) drop.add(index);
    }
    if (drop.size === 0) return [];
    const cleared: Array<{ sprite: Sprite; stamp: TerrainStamp | null }> = [];
    const kept: Sprite[] = [];
    for (let index = 0; index < this.sprites.length; index += 1) {
      const sprite = this.sprites[index];
      if (!drop.has(index)) {
        kept.push(sprite);
        continue;
      }
      const key = stampKey(sprite);
      const painted = this.added.findIndex((entry) => stampKey(entry) === key);
      const stamp = painted >= 0 ? this.added.splice(painted, 1)[0] : null;
      if (!stamp) this.removed.add(key);
      cleared.push({ sprite, stamp });
    }
    this.sprites.length = 0;
    this.sprites.push(...kept);
    this.rebuildSpatial();
    return cleared;
  }

  private touchesVein(sprite: Sprite, vein: Sprite, margin: number): boolean {
    const reach = margin + Math.hypot(sprite.hw, sprite.hh) + Math.hypot(vein.hw, vein.hh);
    const dx = sprite.cx - vein.cx;
    const dy = sprite.cy - vein.cy;
    if (dx * dx + dy * dy > reach * reach) return false;
    for (const [ax, ay] of sprite.image.samples) {
      const [wx, wy] = assemblyToWorld(sprite.image, sprite.cx, sprite.cy, sprite.rotation, ax, ay);
      if (this.spriteContains(vein, wx, wy)) return true;
      for (let step = 0; step < 8; step += 1) {
        const angle = (step / 8) * Math.PI * 2;
        if (this.spriteContains(vein, wx + Math.cos(angle) * margin, wy + Math.sin(angle) * margin)) return true;
      }
    }
    return false;
  }

  private meshAround(vein: Sprite): Array<{ sprite: Sprite; stamp: TerrainStamp }> {
    const texel = SPRITE_SCALE / PIXELS_PER_UNIT;
    const originX = vein.cx - (vein.image.width / 2) * texel;
    const originY = vein.cy + (vein.image.height / 2) * texel;
    const reach = Math.max(vein.hw, vein.hh) + 2.4;
    const built: Array<{ sprite: Sprite; stamp: TerrainStamp }> = [];
    for (let pass = 0; pass < 4 && built.length < 72; pass += 1) {
      const shift = pass % 2 === 0 ? 0 : MIN_SEPARATION * 0.5;
      for (let y = vein.cy - reach + shift; y <= vein.cy + reach && built.length < 72; y += MIN_SEPARATION) {
        for (let x = vein.cx - reach + shift; x <= vein.cx + reach && built.length < 72; x += MIN_SEPARATION) {
          const mask = this.patchMasks[built.length % this.patchMasks.length];
          const [sx, sy] = snapSprite(mask, x, y, originX, originY);
          if (!this.separated(sx, sy)) continue;
          if (this.sampleOverlap(mask, sx, sy, 0) < OVERLAP_SAMPLES) continue;
          const stamp = { name: mask.name, x: sx, y: sy, rotation: 0 };
          const sprite: Sprite = {
            image: mask,
            cx: sx,
            cy: sy,
            hw: mask.hw,
            hh: mask.hh,
            rotation: 0,
            order: 400_000 + built.length,
            solid: true,
          };
          this.add(sprite);
          this.added.push(stamp);
          this.insertDraw(this.sprites.length - 1);
          built.push({ sprite, stamp });
        }
      }
    }
    return built;
  }

  placeLight(x: number, y: number): (() => boolean) | null {
    if (!this.ready) return null;
    const existing = this.lights.findIndex((light) => Math.hypot(light.x - x, light.y - y) < 0.85);
    if (existing >= 0) {
      this.lights.splice(existing, 1);
      return null;
    }
    const light = { x, y };
    this.lights.push(light);
    return () => {
      const index = this.lights.indexOf(light);
      if (index >= 0) this.lights.splice(index, 1);
      return false;
    };
  }

  placeBubble(x: number, y: number): (() => boolean) | null {
    const existing = this.bubbleSources.findIndex((source) => Math.hypot(source.x - x, source.y - y) < 0.85);
    if (existing >= 0) {
      this.bubbleSources.splice(existing, 1);
      return null;
    }
    if (this.bubbleSources.length >= 48) return null;
    const source = { x, y };
    this.bubbleSources.push(source);
    return () => {
      const index = this.bubbleSources.indexOf(source);
      if (index >= 0) this.bubbleSources.splice(index, 1);
      return false;
    };
  }

  placeHeat(x: number, y: number, size: number): (() => boolean) | null {
    if (!this.ready) return null;
    const scale = clampHeatSize(size);
    const existing = this.heatSources.findIndex((source) => Math.hypot(source.x - x, source.y - y) < 0.85);
    if (existing >= 0) {
      const source = this.heatSources[existing];
      if (Math.abs(source.size - scale) < 0.01) {
        this.heatSources.splice(existing, 1);
        return null;
      }
      const previous = source.size;
      source.size = scale;
      return () => {
        source.size = previous;
        return false;
      };
    }
    if (this.heatSources.length >= 48) return null;
    const source = { x, y, size: scale };
    this.heatSources.push(source);
    return () => {
      const index = this.heatSources.indexOf(source);
      if (index >= 0) this.heatSources.splice(index, 1);
      return false;
    };
  }

  isReady(): boolean {
    return this.ready;
  }

  solidAt(x: number, y: number): boolean {
    return this.pointHits(x, y);
  }

  refreshIndex(): void {
    this.rebuildSpatial();
  }

  bubblePoints(): ReadonlyArray<{ x: number; y: number }> {
    return this.bubbleSources;
  }

  packPointLights(bounds?: { minX: number; minY: number; maxX: number; maxY: number }): PackedPointLights {
    const reach = 12;
    let count = 0;
    for (let i = 0; i < this.lights.length && count < 48; i += 1) {
      const light = this.lights[i];
      if (bounds) {
        if (light.x + reach < bounds.minX || light.x - reach > bounds.maxX) continue;
        if (light.y + reach < bounds.minY || light.y - reach > bounds.maxY) continue;
      }
      this.lightPack[count * 3] = light.x;
      this.lightPack[count * 3 + 1] = light.y;
      this.lightPack[count * 3 + 2] = reach;
      this.lightColor[count * 3] = VENT_LIGHT_COLOR[0];
      this.lightColor[count * 3 + 1] = VENT_LIGHT_COLOR[1];
      this.lightColor[count * 3 + 2] = VENT_LIGHT_COLOR[2];
      count += 1;
    }
    return { count, data: this.lightPack, colors: this.lightColor };
  }

  packHeat(): { count: number; data: Float32Array } {
    const count = Math.min(this.heatSources.length, 48);
    for (let i = 0; i < count; i += 1) {
      this.heatPack[i * 3] = this.heatSources[i].x;
      this.heatPack[i * 3 + 1] = this.heatSources[i].y;
      this.heatPack[i * 3 + 2] = this.heatSources[i].size;
    }
    return { count, data: this.heatPack };
  }

  ventCenters(): Array<[number, number]> {
    const points: Array<[number, number]> = [];
    for (const sprite of this.sprites) {
      if (sprite.image.name.startsWith("vent_")) points.push([sprite.cx, sprite.cy]);
    }
    return points;
  }

  /** Mineral faces that leak dissolved nutrient into the water. Cached until the terrain changes. */
  depositFaces(): { generation: number; faces: readonly NutrientFace[] } {
    if (!this.ready) return { generation: -1, faces: [] };
    if (this.depositFaceBuilt === this.structureGeneration) {
      return { generation: this.structureGeneration, faces: this.depositFaceCache };
    }
    const faces: NutrientFace[] = [];
    for (const sprite of this.sprites) {
      const face = mineralFace(sprite);
      if (face) faces.push(face);
    }
    this.depositFaceCache = faces;
    this.depositFaceBuilt = this.structureGeneration;
    return { generation: this.structureGeneration, faces };
  }

  /** Geothermal vents and resource nodes, front-most first. */
  features(): TerrainFeature[] {
    if (!this.ready) return [];
    const found: TerrainFeature[] = [];
    for (let index = this.drawOrder.length - 1; index >= 0; index -= 1) {
      const sprite = this.sprites[this.drawOrder[index]];
      const title = featureTitle(sprite.image.name);
      if (!title) continue;
      const bounds = spriteBounds(sprite);
      found.push({
        id: stampKey(sprite),
        title,
        lines: ["Placeholder"],
        contains: (x, y) => this.spriteContains(sprite, x, y),
        bounds: () => bounds,
      });
    }
    return found;
  }

  /** 1 where a coraly rock tile overlaps that temperature cell. */
  rockTexels(): Uint8Array {
    if (!this.ready || this.rockBuilt === this.structureGeneration) return this.rockMask;
    this.rockMask.fill(0);
    for (const sprite of this.sprites) {
      if (sprite.image.name.startsWith("patch_")) this.markRock(sprite);
    }
    this.rockBuilt = this.structureGeneration;
    return this.rockMask;
  }

  /** Normalized distance to the nearest solid terrain tile. Null until the world is built. */
  shoreFieldData(): ShoreField | null {
    if (!this.ready) return null;
    if (this.shoreBuilt === this.structureGeneration) return this.shoreField;
    this.rebuildShore();
    return this.shoreField;
  }

  eraseAt(x: number, y: number): void {
    const radius = 1.35;
    this.bubbleSources = this.bubbleSources.filter((source) => Math.hypot(source.x - x, source.y - y) > radius);
    if (!this.ready) return;
    this.lights = this.lights.filter((light) => Math.hypot(light.x - x, light.y - y) > radius);
    this.heatSources = this.heatSources.filter((source) => Math.hypot(source.x - x, source.y - y) > radius);
    const seen = new Set<number>();
    const x0 = Math.floor((x - radius - 4) / 4);
    const x1 = Math.floor((x + radius + 4) / 4);
    const y0 = Math.floor((y - radius - 4) / 4);
    const y1 = Math.floor((y + radius + 4) / 4);
    for (let iy = y0; iy <= y1; iy += 1) {
      for (let ix = x0; ix <= x1; ix += 1) {
        const bucket = this.buckets.get(`${ix},${iy}`);
        if (!bucket) continue;
        for (const index of bucket) seen.add(index);
      }
    }
    const drop = new Set<number>();
    for (const index of seen) {
      if (this.spriteNear(this.sprites[index], x, y, radius)) drop.add(index);
    }
    if (drop.size === 0) return;
    const kept: Sprite[] = [];
    for (let index = 0; index < this.sprites.length; index += 1) {
      const sprite = this.sprites[index];
      if (!drop.has(index)) {
        kept.push(sprite);
        continue;
      }
      const key = stampKey(sprite);
      const painted = this.added.findIndex((stamp) => stampKey(stamp) === key);
      if (painted >= 0) this.added.splice(painted, 1);
      else this.removed.add(key);
    }
    this.sprites.length = 0;
    this.sprites.push(...kept);
    this.rebuildSpatial();
  }

  endStroke(): void {
    this.lastStamp = null;
  }

  private dropPainted(sprite: Sprite, stamp: TerrainStamp): boolean {
    const added = this.added.indexOf(stamp);
    if (added >= 0) this.added.splice(added, 1);
    const index = this.sprites.indexOf(sprite);
    if (index < 0) return false;
    this.sprites.splice(index, 1);
    return true;
  }

  async saveEdits(decorations: DecorationStamp[] | null): Promise<"saved" | "loading" | "failed"> {
    if (!this.ready || !decorations) return "loading";
    try {
      const response = await fetch("/api/terrain-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          removed: [...this.removed],
          added: this.added,
          lights: this.lights,
          bubbles: this.bubbleSources,
          heats: this.heatSources,
          decorations,
        }),
      });
      return response.ok ? "saved" : "failed";
    } catch {
      return "failed";
    }
  }

  private async placeLayout(layout: BakedSprite[], masks: ImageMask[]): Promise<void> {
    const byName = new Map(masks.map((mask) => [mask.name, mask]));
    for (let index = 0; index < layout.length; index += 1) {
      const stamp = layout[index];
      const image = byName.get(stamp.name);
      if (!image) continue;
      this.add({
        image,
        cx: stamp.x,
        cy: stamp.y,
        hw: image.hw,
        hh: image.hh,
        rotation: stamp.rotation,
        order: stamp.order,
        solid: stamp.solid,
      });
      if ((index & 511) === 0) await bootPulse("terrainBuild", index / layout.length);
    }
    bootMark("terrainBuild", 1);
  }

  private async assemble(patches: ImageMask[], passages: Passage[], random: () => number): Promise<void> {
    const points = scatter(random);
    points.sort((a, b) => wallDistance(a[0], a[1]) - wallDistance(b[0], b[1]));
    let seeds = 0;
    let extended = 0;
    let seen = 0;
    for (const [x, y] of points) {
      seen += 1;
      if ((seen & 63) === 0) await bootPulse("terrainBuild", 0.18 * (seen / Math.max(1, points.length)));
      const depth = wallDistance(x, y);
      const seeding = depth < SEED_DEPTH && seeds < 2000;
      if (!seeding && extended >= 1200) continue;
      const mask = patches[Math.floor(random() * patches.length)];
      const rotation = Math.floor(random() * 24) * (Math.PI / 12);
      if (!seeding && this.sampleOverlap(mask, x, y, rotation) < OVERLAP_SAMPLES) continue;
      if (this.blocksPassage(mask, x, y, rotation, passages)) continue;
      this.add({
        image: mask,
        cx: x,
        cy: y,
        hw: mask.hw,
        hh: mask.hh,
        rotation,
        order: Math.floor(random() * 1_000_000),
        solid: true,
      });
      if (seeding) seeds += 1;
      else extended += 1;
    }
    await this.addCollar(patches, random);
    await this.growInward(patches, passages, random);
  }

  private async growInward(patches: ImageMask[], passages: Passage[], random: () => number): Promise<void> {
    buildShoreWander(random);
    const caves = carveCaves(random);
    const points: Array<[number, number]> = [];
    let row = 0;
    const rows = Math.max(1, Math.ceil((COLUMN_TOP - (OUTER_BOTTOM + 2)) / 2.3));
    for (let y = OUTER_BOTTOM + 2; y < COLUMN_TOP; y += 2.3) {
      row += 1;
      if ((row & 3) === 0) await bootPulse("terrainBuild", 0.55 + 0.12 * (row / rows));
      const left = sideReach(y, -1);
      const right = sideReach(y, 1);
      for (let depth = 2.3; depth < left; depth += 2.3) {
        points.push([OUTER_LEFT + depth + (random() - 0.5) * 0.45, y + (random() - 0.5) * 0.45]);
      }
      for (let depth = 2.3; depth < right; depth += 2.3) {
        points.push([OUTER_RIGHT - depth + (random() - 0.5) * 0.45, y + (random() - 0.5) * 0.45]);
      }
    }
    for (let x = OUTER_LEFT + 8; x < OUTER_RIGHT - 8; x += 2.3) {
      const room = floorRoom(x);
      for (let rise = 2.3; rise < room; rise += 2.3) {
        points.push([x + (random() - 0.5) * 0.4, OUTER_BOTTOM + rise + (random() - 0.5) * 0.4]);
      }
    }
    points.sort((a, b) => wallDistance(a[0], a[1]) - wallDistance(b[0], b[1]));
    for (let pass = 0; pass < 3; pass += 1) {
      let placed = 0;
      for (const [x, y] of points) {
        placed += 1;
        if ((placed & 63) === 0) {
          await bootPulse("terrainBuild", 0.67 + 0.15 * ((pass + placed / Math.max(1, points.length)) / 3));
        }
        if (!this.canGrow(x, y) || insidePassage(x, y, caves) || !keepOpen(x, y)) continue;
        this.tryAttach(patches, passages, random, x, y);
      }
    }
  }

  private canGrow(x: number, y: number): boolean {
    if (x < OUTER_LEFT + 1.5 || x > OUTER_RIGHT - 1.5 || y < OUTER_BOTTOM + 1.5 || y > 530) return false;
    if (inPlug(x, y)) return false;
    if (x * x + y * y < 36) return false;
    const fromSide = Math.min(x - OUTER_LEFT, OUTER_RIGHT - x);
    const fromFloor = y - OUTER_BOTTOM;
    const reach = x <= 0 ? sideReach(y, -1) : sideReach(y, 1);
    return fromSide <= reach || fromFloor <= floorRoom(x);
  }

  private tryAttach(
    patches: ImageMask[],
    passages: Passage[],
    random: () => number,
    x: number,
    y: number,
  ): boolean {
    if (!this.separated(x, y)) return false;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const mask = patches[Math.floor(random() * patches.length)];
      const rotation = Math.floor(random() * 24) * (Math.PI / 12);
      if (this.sampleOverlap(mask, x, y, rotation) < OVERLAP_SAMPLES) continue;
      if (this.blocksPassage(mask, x, y, rotation, passages)) continue;
      this.add({
        image: mask,
        cx: x,
        cy: y,
        hw: mask.hw,
        hh: mask.hh,
        rotation,
        order: Math.floor(random() * 1_000_000),
        solid: true,
      });
      return true;
    }
    return false;
  }

  private async addCollar(patches: ImageMask[], random: () => number): Promise<void> {
    let placed = 0;
    const spots = scatterCollar(random);
    let seen = 0;
    for (const [x, y] of spots) {
      seen += 1;
      if ((seen & 127) === 0) await bootPulse("terrainBuild", 0.18 + 0.37 * (seen / Math.max(1, spots.length)));
      if (placed >= 30000) break;
      if (!this.separated(x, y)) continue;
      const mask = patches[Math.floor(random() * patches.length)];
      const rotation = Math.floor(random() * 24) * (Math.PI / 12);
      this.add({
        image: mask,
        cx: x,
        cy: y,
        hw: mask.hw,
        hh: mask.hh,
        rotation,
        order: Math.floor(random() * 1_000_000),
        solid: true,
      });
      placed += 1;
    }
  }

  private async attachFibers(fibers: ImageMask[], random: () => number): Promise<void> {
    const hosts = this.sprites.filter((sprite) => sprite.solid && !inPlug(sprite.cx, sprite.cy));
    let seen = 0;
    for (const host of hosts) {
      seen += 1;
      if ((seen & 31) === 0) await bootPulse("terrainBuild", 0.82 + 0.1 * (seen / Math.max(1, hosts.length)));
      if (random() > 0.28) continue;
      const mask = fibers[Math.floor(random() * fibers.length)];
      const rotation = Math.floor(random() * 24) * (Math.PI / 12);
      const angle = random() * Math.PI * 2;
      const reachOut = host.hw * (0.35 + random() * 0.5);
      const x = host.cx + Math.cos(angle) * reachOut;
      const y = host.cy + Math.sin(angle) * reachOut;
      let touch = 0;
      let outside = 0;
      for (const [ax, ay] of mask.opaque) {
        const [wx, wy] = assemblyToWorld(mask, x, y, rotation, ax, ay);
        if (this.nearTerrain(wx, wy)) touch += 1;
        else outside += 1;
      }
      if (touch < FIBER_TOUCH || outside < FIBER_OUTSIDE) continue;
      this.add({
        image: mask,
        cx: x,
        cy: y,
        hw: mask.hw,
        hh: mask.hh,
        rotation,
        order: 1_000_000 + Math.floor(random() * 1_000_000),
        solid: false,
      });
    }
  }

  private async scatterDebris(debris: ImageMask[], random: () => number): Promise<void> {
    const hosts = this.sprites.filter((sprite) => sprite.solid && !inPlug(sprite.cx, sprite.cy));
    let seen = 0;
    for (const host of hosts) {
      seen += 1;
      if ((seen & 31) === 0) await bootPulse("terrainBuild", 0.92 + 0.08 * (seen / Math.max(1, hosts.length)));
      if (random() > 0.22) continue;
      const mask = debris[Math.floor(random() * debris.length)];
      const rotation = Math.floor(random() * 24) * (Math.PI / 12);
      const angle = random() * Math.PI * 2;
      const x = host.cx + Math.cos(angle) * host.hw * 0.35;
      const y = host.cy + Math.sin(angle) * host.hh * 0.35;
      this.add({
        image: mask,
        cx: x,
        cy: y,
        hw: mask.hw,
        hh: mask.hh,
        rotation,
        order: 2_000_000 + Math.floor(random() * 1_000_000),
        solid: false,
      });
    }
  }

  private sampleOverlap(mask: ImageMask, x: number, y: number, rotation: number): number {
    let count = 0;
    for (const [ax, ay] of mask.samples) {
      const [wx, wy] = assemblyToWorld(mask, x, y, rotation, ax, ay);
      if (this.pointHits(wx, wy)) count += 1;
    }
    return count;
  }

  private blocksPassage(mask: ImageMask, x: number, y: number, rotation: number, passages: Passage[]): boolean {
    let blocked = 0;
    for (const [ax, ay] of mask.samples) {
      const [wx, wy] = assemblyToWorld(mask, x, y, rotation, ax, ay);
      if (insidePassage(wx, wy, passages)) blocked += 1;
    }
    return blocked > 28;
  }

  private nearTerrain(x: number, y: number): boolean {
    if (this.pointHits(x, y)) return true;
    return (
      this.pointHits(x + FIBER_MARGIN, y) ||
      this.pointHits(x - FIBER_MARGIN, y) ||
      this.pointHits(x, y + FIBER_MARGIN) ||
      this.pointHits(x, y - FIBER_MARGIN)
    );
  }

  private add(sprite: Sprite): void {
    const index = this.sprites.length;
    this.sprites.push(sprite);
    this.indexSprite(index);
    this.structureGeneration += 1;
  }

  private moveContact(
    x: number,
    y: number,
    dx: number,
    dy: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
  ): { x: number; y: number } {
    const blocked = (qx: number, qy: number) => this.overlaps(qx, qy, angle, length, width, bend);
    const sensed = this.surfaceNormal(x, y, angle, length, width, bend);
    let normal = sensed;
    if (normal && this.slideNormal) {
      const agree = normal.x * this.slideNormal.x + normal.y * this.slideNormal.y;
      if (agree < 0) normal = this.slideNormal;
      else {
        const bx = this.slideNormal.x * 0.65 + normal.x * 0.35;
        const by = this.slideNormal.y * 0.65 + normal.y * 0.35;
        const mag = Math.hypot(bx, by);
        if (mag > 1e-4) normal = { x: bx / mag, y: by / mag };
      }
    }
    if (!normal && this.slideNormal && this.wallAhead(x, y, this.slideNormal, angle, length, width, bend)) {
      normal = this.slideNormal;
    }
    if (!normal) normal = this.normalOnMove(x, y, dx, dy, angle, length, width, bend);
    if (!normal) {
      this.slideNormal = null;
      return this.sweep(x, y, dx, dy, blocked);
    }
    this.slideNormal = normal;
    const into = dx * normal.x + dy * normal.y;
    let tx = dx;
    let ty = dy;
    if (into > 0) {
      tx -= normal.x * into;
      ty -= normal.y * into;
    }
    if (Math.hypot(tx, ty) <= 1e-4) {
      if (sensed) return { x, y };
      return this.sweep(x, y, dx, dy, blocked);
    }
    const ahead = tx * dx + ty * dy;
    const step2 = dx * dx + dy * dy;
    if (ahead < 0 && step2 > 1e-8) {
      const scale = ahead / step2;
      tx -= dx * scale;
      ty -= dy * scale;
    }
    tx *= this.slideKeep;
    ty *= this.slideKeep;
    return this.slideClear(x, y, tx, ty, normal, blocked, sensed !== null);
  }

  /** Normal where the attempted move meets terrain, when the start pose is still clear. */
  private normalOnMove(
    x: number,
    y: number,
    dx: number,
    dy: number,
    angle: number,
    length: number,
    width: number,
    bend: number,
  ): { x: number; y: number } | null {
    for (const t of [1, 0.75, 0.5, 0.25]) {
      const found = this.surfaceNormal(x + dx * t, y + dy * t, angle, length, width, bend);
      if (found) return found;
    }
    return null;
  }

  /**
   * Move along the wall. A short hit is a lip: lubricin steps the body back out and tries again
   * instead of leaving it parked on the first pixel.
   */
  private slideClear(
    x: number,
    y: number,
    tx: number,
    ty: number,
    normal: { x: number; y: number },
    blocked: (x: number, y: number) => boolean,
    sensed: boolean,
  ): { x: number; y: number } {
    const wanted = Math.hypot(tx, ty);
    const travel = (ox: number, oy: number) => {
      const slid = this.sweep(ox, oy, tx, ty, blocked);
      return { x: slid.x, y: slid.y, dist: Math.hypot(slid.x - ox, slid.y - oy) };
    };
    let best = travel(x, y);
    if (this.slideKeep > 0.02 && best.dist < wanted * 0.8) {
      const steps = Math.max(1, Math.ceil(8 * this.slideKeep));
      const pixel = 1 / 32;
      for (let i = 1; i <= steps; i += 1) {
        const ox = x - normal.x * pixel * i;
        const oy = y - normal.y * pixel * i;
        if (blocked(ox, oy)) continue;
        const attempt = travel(ox, oy);
        if (attempt.dist > best.dist) best = attempt;
        if (best.dist >= wanted * 0.8) break;
      }
    }
    if (best.dist <= 1e-4) return { x, y };
    if (sensed || this.slideKeep >= 0.999) return { x: best.x, y: best.y };
    const close = 1 / 32;
    const cx = best.x + normal.x * close;
    const cy = best.y + normal.y * close;
    if (!blocked(cx, cy)) return { x: cx, y: cy };
    return { x: best.x, y: best.y };
  }

  private wallAhead(
    x: number,
    y: number,
    normal: { x: number; y: number },
    angle: number,
    length: number,
    width: number,
    bend = 0,
  ): boolean {
    return (
      this.overlaps(x + normal.x * 0.25, y + normal.y * 0.25, angle, length, width, bend) ||
      this.overlaps(x + normal.x * 0.8, y + normal.y * 0.8, angle, length, width, bend)
    );
  }

  private surfaceNormal(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
    reach = 2 / 32,
  ): { x: number; y: number } | null {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let hx = 0;
    let hy = 0;
    let count = 0;
    this.forEachSample(length, width, bend, (lx, ly) => {
      const wx = x + cos * lx - sin * ly;
      const wy = y + sin * lx + cos * ly;
      const ox = wx - x;
      const oy = wy - y;
      const mag = Math.hypot(ox, oy) || 1;
      const dirX = ox / mag;
      const dirY = oy / mag;
      const near =
        reach <= 2 / 32 + 1e-8
          ? this.pointHits(wx + dirX * reach, wy + dirY * reach)
          : this.hitsAlong(wx, wy, dirX, dirY, reach);
      if (!this.pointHits(wx, wy) && !near) return;
      hx += dirX;
      hy += dirY;
      count += 1;
    });
    if (count === 0) return null;
    const mag = Math.hypot(hx, hy);
    if (mag < 1e-4) return null;
    return { x: hx / mag, y: hy / mag };
  }

  private hitsAlong(wx: number, wy: number, dirX: number, dirY: number, reach: number): boolean {
    const steps = Math.max(1, Math.ceil(reach / (1 / 32)));
    for (let i = 1; i <= steps; i += 1) {
      const d = (reach * i) / steps;
      if (this.pointHits(wx + dirX * d, wy + dirY * d)) return true;
    }
    return false;
  }

  private sweep(
    x: number,
    y: number,
    dx: number,
    dy: number,
    blocked: (x: number, y: number) => boolean,
  ): { x: number; y: number } {
    if (!blocked(x + dx, y + dy)) return { x: x + dx, y: y + dy };
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 7; i += 1) {
      const mid = (lo + hi) * 0.5;
      if (blocked(x + dx * mid, y + dy * mid)) hi = mid;
      else lo = mid;
    }
    return { x: x + dx * lo, y: y + dy * lo };
  }

  private settleRotation(
    x: number,
    y: number,
    previousAngle: number,
    angle: number,
    length: number,
    width: number,
    bend: number,
  ): { x: number; y: number; angle: number } {
    if (!this.overlaps(x, y, angle, length, width, bend)) return { x, y, angle };
    let lo = 0;
    let hi = 1;
    let best = previousAngle;
    const delta = angleDelta(previousAngle, angle);
    for (let i = 0; i < 6; i += 1) {
      const mid = (lo + hi) * 0.5;
      const candidate = previousAngle + delta * mid;
      if (!this.overlaps(x, y, candidate, length, width, bend)) {
        best = candidate;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return { x, y, angle: best };
  }

  private outlineContact(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend: number,
  ): { x: number; y: number } | null {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = this.slideNormal?.x ?? 0;
    const ny = this.slideNormal?.y ?? 0;
    let best = -Infinity;
    let found = false;
    let bx = x;
    let by = y;
    this.forEachSample(length, width, bend, (lx, ly) => {
      const wx = x + cos * lx - sin * ly;
      const wy = y + sin * lx + cos * ly;
      if (!this.pointHits(wx, wy)) return;
      const score = this.slideNormal ? (wx - x) * nx + (wy - y) * ny : Math.hypot(wx - x, wy - y);
      if (!found || score > best) {
        best = score;
        bx = wx;
        by = wy;
        found = true;
      }
    });
    if (!found) return null;
    return { x: bx, y: by };
  }

  private overlaps(x: number, y: number, angle: number, length: number, width: number, bend = 0): boolean {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let hit = false;
    this.forEachSample(length, width, bend, (lx, ly) => {
      if (hit) return;
      if (this.pointHits(x + cos * lx - sin * ly, y + sin * lx + cos * ly)) hit = true;
    });
    return hit;
  }

  private forEachSample(length: number, width: number, bend: number, visit: (lx: number, ly: number) => void): void {
    for (const [lx, ly] of bodySamples(length, width, bend)) visit(lx, ly);
    for (const [lx, ly] of this.colliderProbes) visit(lx, ly);
  }

  private separate(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend: number,
  ): { x: number; y: number } {
    const normal = this.surfaceNormal(x, y, angle, length, width, bend) ?? this.slideNormal;
    if (!normal) return { x, y };
    for (let i = 1; i <= 4; i += 1) {
      const dist = i / 32;
      const ox = x - normal.x * dist;
      const oy = y - normal.y * dist;
      if (!this.overlaps(ox, oy, angle, length, width, bend)) return { x: ox, y: oy };
    }
    return { x, y };
  }

  private separated(x: number, y: number): boolean {
    const min2 = MIN_SEPARATION * MIN_SEPARATION;
    const ix = Math.floor(x / 4);
    const iy = Math.floor(y / 4);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const bucket = this.buckets.get(`${ix + dx},${iy + dy}`);
        if (!bucket) continue;
        for (const index of bucket) {
          const sprite = this.sprites[index];
          if (!sprite.solid) continue;
          const ddx = sprite.cx - x;
          const ddy = sprite.cy - y;
          if (ddx * ddx + ddy * ddy < min2) return false;
        }
      }
    }
    return true;
  }

  private pointHits(x: number, y: number): boolean {
    const bucket = this.buckets.get(`${Math.floor(x / 4)},${Math.floor(y / 4)}`);
    if (!bucket) return false;
    for (const index of bucket) {
      const sprite = this.sprites[index];
      if (!sprite.solid) continue;
      const dx = x - sprite.cx;
      const dy = y - sprite.cy;
      const c = Math.cos(sprite.rotation);
      const s = Math.sin(sprite.rotation);
      const lx = c * dx + s * dy;
      const ly = -s * dx + c * dy;
      if (Math.abs(lx) > sprite.hw || Math.abs(ly) > sprite.hh) continue;
      const px = Math.min(sprite.image.width - 1, Math.max(0, Math.floor((lx / (sprite.hw * 2) + 0.5) * sprite.image.width)));
      const py = Math.min(sprite.image.height - 1, Math.max(0, Math.floor((0.5 - ly / (sprite.hh * 2)) * sprite.image.height)));
      if (sprite.image.alpha[py * sprite.image.width + px] >= 51) return true;
    }
    return false;
  }

  private insertDraw(index: number): void {
    const order = this.sprites[index].order;
    let at = this.drawOrder.length;
    for (let i = 0; i < this.drawOrder.length; i += 1) {
      if (this.sprites[this.drawOrder[i]].order > order) {
        at = i;
        break;
      }
    }
    this.drawOrder.splice(at, 0, index);
  }

  private markRock(sprite: Sprite): void {
    const c = Math.cos(sprite.rotation);
    const s = Math.sin(sprite.rotation);
    const step = 0.8;
    for (let ly = -sprite.hh; ly <= sprite.hh + 0.001; ly += step) {
      for (let lx = -sprite.hw; lx <= sprite.hw + 0.001; lx += step) {
        const px = Math.min(sprite.image.width - 1, Math.max(0, Math.floor((lx / (sprite.hw * 2) + 0.5) * sprite.image.width)));
        const py = Math.min(sprite.image.height - 1, Math.max(0, Math.floor((0.5 - ly / (sprite.hh * 2)) * sprite.image.height)));
        if (sprite.image.alpha[py * sprite.image.width + px] < 51) continue;
        const x = sprite.cx + c * lx - s * ly;
        const y = sprite.cy + s * lx + c * ly;
        const column = Math.floor((x - WORLD_LEFT) / ROCK_TEXEL);
        const row = Math.floor((y - WORLD_BOTTOM) / ROCK_TEXEL);
        if (column < 0 || row < 0 || column >= ROCK_COLUMNS || row >= ROCK_ROWS) continue;
        this.rockMask[row * ROCK_COLUMNS + column] = 1;
      }
    }
  }

  private rebuildShore(): void {
    const grid = new Uint8Array(SHORE_COLUMNS * SHORE_ROWS);
    for (const sprite of this.sprites) {
      if (sprite.solid) this.markShore(sprite, grid);
    }
    const distance = distanceToSolid(grid, SHORE_COLUMNS, SHORE_ROWS);
    const texels = this.shoreField.texels;
    for (let i = 0; i < distance.length; i += 1) {
      const units = Math.sqrt(distance[i]) * SHORE_CELL;
      texels[i] = Math.min(255, Math.round((units / SHORE_REACH) * 255));
    }
    this.shoreField.generation = this.structureGeneration;
    this.shoreBuilt = this.structureGeneration;
  }

  private markShore(sprite: Sprite, grid: Uint8Array): void {
    const [hw, hh] = bounds(sprite);
    const x0 = Math.max(0, Math.floor((sprite.cx - hw - WORLD_LEFT) / SHORE_CELL));
    const x1 = Math.min(SHORE_COLUMNS - 1, Math.floor((sprite.cx + hw - WORLD_LEFT) / SHORE_CELL));
    const y0 = Math.max(0, Math.floor((sprite.cy - hh - WORLD_BOTTOM) / SHORE_CELL));
    const y1 = Math.min(SHORE_ROWS - 1, Math.floor((sprite.cy + hh - WORLD_BOTTOM) / SHORE_CELL));
    for (let row = y0; row <= y1; row += 1) {
      for (let column = x0; column <= x1; column += 1) {
        const index = row * SHORE_COLUMNS + column;
        if (grid[index]) continue;
        const x = WORLD_LEFT + (column + 0.5) * SHORE_CELL;
        const y = WORLD_BOTTOM + (row + 0.5) * SHORE_CELL;
        if (this.spriteContains(sprite, x, y)) grid[index] = 1;
      }
    }
  }

  private rebuildSpatial(): void {
    this.structureGeneration += 1;
    this.buckets.clear();
    for (let index = 0; index < this.sprites.length; index += 1) this.indexSprite(index);
    this.drawOrder = this.sprites.map((_, index) => index).sort((a, b) => this.sprites[a].order - this.sprites[b].order);
  }

  private indexSprite(index: number): void {
    const sprite = this.sprites[index];
    const [hw, hh] = bounds(sprite);
    const x0 = Math.floor((sprite.cx - hw - 0.08) / 4);
    const x1 = Math.floor((sprite.cx + hw + 0.08) / 4);
    const y0 = Math.floor((sprite.cy - hh - 0.08) / 4);
    const y1 = Math.floor((sprite.cy + hh + 0.08) / 4);
    for (let y = y0; y <= y1; y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const key = `${x},${y}`;
        const bucket = this.buckets.get(key);
        if (bucket) bucket.push(index);
        else this.buckets.set(key, [index]);
      }
    }
  }

  private spriteNear(sprite: Sprite, x: number, y: number, radius: number): boolean {
    const reach = radius + Math.hypot(sprite.hw, sprite.hh);
    const dx = x - sprite.cx;
    const dy = y - sprite.cy;
    if (dx * dx + dy * dy > reach * reach) return false;
    if (this.spriteContains(sprite, x, y)) return true;
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      if (this.spriteContains(sprite, x + Math.cos(angle) * radius * 0.7, y + Math.sin(angle) * radius * 0.7)) return true;
    }
    return false;
  }

  private spriteContains(sprite: Sprite, x: number, y: number): boolean {
    const dx = x - sprite.cx;
    const dy = y - sprite.cy;
    const c = Math.cos(sprite.rotation);
    const s = Math.sin(sprite.rotation);
    const lx = c * dx + s * dy;
    const ly = -s * dx + c * dy;
    if (Math.abs(lx) > sprite.hw || Math.abs(ly) > sprite.hh) return false;
    const px = Math.min(sprite.image.width - 1, Math.max(0, Math.floor((lx / (sprite.hw * 2) + 0.5) * sprite.image.width)));
    const py = Math.min(sprite.image.height - 1, Math.max(0, Math.floor((0.5 - ly / (sprite.hh * 2)) * sprite.image.height)));
    return sprite.image.alpha[py * sprite.image.width + px] >= 51;
  }

  private async applySavedEdits(): Promise<void> {
    const response = await fetch("/terrain-edits.json", { cache: "no-store" });
    if (!response.ok) return;
    const edits = (await response.json()) as Partial<TerrainEdits>;
    const removed = Array.isArray(edits.removed) ? edits.removed.filter((key) => typeof key === "string") : [];
    const added = Array.isArray(edits.added) ? edits.added.filter(isStamp) : [];
    this.lights = (Array.isArray(edits.lights) ? edits.lights : []).filter(isPointLight).map((light) => ({
      x: light.x,
      y: light.y,
    }));
    this.bubbleSources = (Array.isArray(edits.bubbles) ? edits.bubbles : []).filter(isPointLight).map((source) => ({
      x: source.x,
      y: source.y,
    }));
    this.heatSources = (Array.isArray(edits.heats) ? edits.heats : []).filter(isPointLight).map((source) => ({
      x: source.x,
      y: source.y,
      size: clampHeatSize(source.size ?? 1),
    }));
    if (removed.length === 0 && added.length === 0) return;
    const gone = new Set(removed);
    const kept = this.sprites.filter((sprite) => !gone.has(stampKey(sprite)));
    this.sprites.length = 0;
    this.sprites.push(...kept);
    for (const key of gone) this.removed.add(key);
    for (const stamp of added) {
      const mask = this.maskNamed(stamp.name);
      if (!mask) continue;
      const vent = stamp.name.startsWith("vent_");
      const deposit = stamp.name.startsWith("deposit_");
      this.add({
        image: mask,
        cx: stamp.x,
        cy: stamp.y,
        hw: mask.hw,
        hh: mask.hh,
        rotation: stamp.rotation,
        order: deposit
          ? 2_600_000 + Math.floor(Math.random() * 100_000)
          : vent
            ? 2_500_000 + Math.floor(Math.random() * 100_000)
            : Math.floor(Math.random() * 1_000_000),
        solid: true,
      });
      this.added.push(stamp);
    }
    this.rebuildSpatial();
  }

  private maskNamed(name: string): ImageMask | undefined {
    return (
      this.patchMasks.find((mask) => mask.name === name) ??
      this.ventMasks.find((mask) => mask.name === name) ??
      this.depositMasks.find((mask) => mask.name === name)
    );
  }

  private async loadDeposits(): Promise<ImageMask[]> {
    const resources = ["ammonia", "chloride", "iron", "sulfur"];
    const facings: Array<[string, string]> = [
      ["right", "channel/deposits/right_wall"],
      ["up", "cavities/deposits/ceiling"],
      ["left", "channel/deposits/left_wall"],
      ["bottom", "channel/deposits/floor"],
    ];
    const masks: ImageMask[] = [];
    const filesPerResource = 4;
    const budget = facings.length * resources.length * filesPerResource;
    let step = 0;
    this.scanPulse = (local) => bootPulse("deposits", (step + local) / budget);
    for (const [facing, folder] of facings) {
      for (const resource of resources) {
        const files = ["module.png", "module_01.png", "module_02.png", "module_03.png"];
        let count = 0;
        for (const file of files) {
          const mask = await this.loadOptional(`/environment/${folder}/${resource}/${file}`);
          if (!mask) {
            step += files.length - count;
            bootMark("deposits", step / budget);
            break;
          }
          step += 1;
          bootMark("deposits", step / budget);
          mask.name = count === 0 ? `deposit_${resource}_${facing}` : `deposit_${resource}_${facing}_${count}`;
          masks.push(mask);
          count += 1;
        }
      }
    }
    this.scanPulse = null;
    return masks;
  }

  private async loadOptional(url: string): Promise<ImageMask | null> {
    try {
      return await this.load(url);
    } catch {
      return null;
    }
  }

  private async load(url: string): Promise<ImageMask> {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error(`could not read ${url}`);
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    if (this.scanPulse) await this.scanPulse(0.2);
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error("could not create terrain texture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    const name = url.slice(url.lastIndexOf("/") + 1).replace(/\.png$/i, "");
    if (this.scanPulse) await this.scanPulse(1);
    return buildMask(pixels, image.width, image.height, name, texture);
  }
}

function buildMask(pixels: Uint8ClampedArray | Uint8Array, width: number, height: number, name: string, texture: WebGLTexture): ImageMask {
  const alpha = new Uint8Array(width * height);
  let minPx = width;
  let minPy = height;
  let maxPx = -1;
  let maxPy = -1;
  const asmW = Math.max(1, Math.floor(width / 2));
  const asmH = Math.max(1, Math.floor(height / 2));
  const samples: Array<[number, number]> = [];
  const opaque: Array<[number, number]> = [];
  let rockX = 0;
  let rockY = 0;
  let rockCount = 0;
  let anyX = 0;
  let anyY = 0;
  let anyCount = 0;
  let colorX = 0;
  let colorY = 0;
  let colorCount = 0;
  for (let i = 0; i < alpha.length; i += 1) {
    const coverage = pixels[i * 4 + 3];
    alpha[i] = coverage;
    if (coverage < 51) continue;
    const px = i % width;
    const py = (i - px) / width;
    if (px < minPx) minPx = px;
    if (py < minPy) minPy = py;
    if (px > maxPx) maxPx = px;
    if (py > maxPy) maxPy = py;
  }
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const pixel = (y * width + x) * 4;
      const red = pixels[pixel];
      const green = pixels[pixel + 1];
      const blue = pixels[pixel + 2];
      if (pixels[pixel + 3] < 51) continue;
      anyX += x;
      anyY += y;
      anyCount += 1;
      if (Math.max(red, green, blue) - Math.min(red, green, blue) < 30) {
        rockX += x;
        rockY += y;
        rockCount += 1;
      } else {
        colorX += x;
        colorY += y;
        colorCount += 1;
      }
    }
  }
  for (let ay = 0; ay < asmH; ay += 1) {
    for (let ax = 0; ax < asmW; ax += 1) {
      const sx = Math.min(width - 1, ax * 2);
      const sy = Math.min(height - 1, ay * 2);
      if (alpha[sy * width + sx] <= 128) continue;
      opaque.push([ax, ay]);
      if (ax % 3 === 0 && ay % 3 === 0) samples.push([ax, ay]);
    }
  }
  const seated = rockCount > 30;
  const texel = SPRITE_SCALE / PIXELS_PER_UNIT;
  const toWorld = (px: number, py: number): [number, number] => [(px - width / 2) * texel, (height / 2 - py) * texel];
  const rock = toWorld(
    seated ? rockX / rockCount : anyCount > 0 ? anyX / anyCount : width / 2,
    seated ? rockY / rockCount : anyCount > 0 ? anyY / anyCount : height / 2,
  );
  const mineral = colorCount > 30 ? toWorld(colorX / colorCount, colorY / colorCount) : rock;
  const extent = opaqueExtent(width, height, minPx, minPy, maxPx, maxPy, texel);
  return {
    name,
    texture,
    alpha,
    width,
    height,
    hw: (width * SPRITE_SCALE) / PIXELS_PER_UNIT / 2,
    hh: (height * SPRITE_SCALE) / PIXELS_PER_UNIT / 2,
    asmW,
    asmH,
    samples,
    opaque,
    anchorX: rock[0],
    anchorY: rock[1],
    mineralX: mineral[0],
    mineralY: mineral[1],
    localMinX: extent.minX,
    localMinY: extent.minY,
    localMaxX: extent.maxX,
    localMaxY: extent.maxY,
  };
}

async function loadTerrainLayout(): Promise<BakedSprite[] | null> {
  const response = await fetch("/terrain-layout.json");
  if (!response.ok) return null;
  const body = (await response.json()) as { sprites?: unknown };
  if (!Array.isArray(body.sprites)) return null;
  const sprites: BakedSprite[] = [];
  for (const value of body.sprites) {
    if (!value || typeof value !== "object") continue;
    const stamp = value as BakedSprite;
    if (typeof stamp.name !== "string" || !Number.isFinite(stamp.x) || !Number.isFinite(stamp.y) || !Number.isFinite(stamp.rotation) || !Number.isFinite(stamp.order)) continue;
    sprites.push({ name: stamp.name, x: stamp.x, y: stamp.y, rotation: stamp.rotation, order: stamp.order, solid: stamp.solid !== false });
  }
  return sprites.length > 0 ? sprites : null;
}

function snapSprite(mask: ImageMask, x: number, y: number, originX: number, originY: number): [number, number] {
  const texel = SPRITE_SCALE / PIXELS_PER_UNIT;
  const left = x - (mask.width / 2) * texel;
  const top = y + (mask.height / 2) * texel;
  const snappedLeft = originX + Math.round((left - originX) / texel) * texel;
  const snappedTop = originY + Math.round((top - originY) / texel) * texel;
  return [snappedLeft + (mask.width / 2) * texel, snappedTop - (mask.height / 2) * texel];
}

function stampKey(stamp: TerrainStamp | Sprite): string {
  const name = "image" in stamp ? stamp.image.name : stamp.name;
  const x = "image" in stamp ? stamp.cx : stamp.x;
  const y = "image" in stamp ? stamp.cy : stamp.y;
  const rotation = stamp.rotation;
  return `${name}|${x.toFixed(3)}|${y.toFixed(3)}|${rotation.toFixed(4)}`;
}

function isStamp(value: unknown): value is TerrainStamp {
  if (!value || typeof value !== "object") return false;
  const stamp = value as TerrainStamp;
  return typeof stamp.name === "string" && Number.isFinite(stamp.x) && Number.isFinite(stamp.y) && Number.isFinite(stamp.rotation);
}

function clampHeatSize(size: number): number {
  if (!Number.isFinite(size)) return 1;
  return Math.min(3, Math.max(0.5, size));
}

function isPointLight(value: unknown): value is { x: number; y: number; size?: number } {
  if (!value || typeof value !== "object") return false;
  const light = value as { x: number; y: number };
  return Number.isFinite(light.x) && Number.isFinite(light.y);
}

function assemblyToWorld(mask: ImageMask, x: number, y: number, rotation: number, ax: number, ay: number): [number, number] {
  const lx = (ax + 0.5 - mask.asmW / 2) / PIXELS_PER_UNIT;
  const ly = (mask.asmH / 2 - (ay + 0.5)) / PIXELS_PER_UNIT;
  const c = Math.cos(rotation);
  const s = Math.sin(rotation);
  return [x + c * lx - s * ly, y + s * lx + c * ly];
}

function columnHeight(y: number): number {
  return clamp((y - OUTER_BOTTOM) / (COLUMN_TOP - OUTER_BOTTOM), 0, 1);
}

function sideRoom(y: number): number {
  const down = 1 - columnHeight(y);
  return 14 + 68 * Math.pow(down, 0.7);
}

function floorRoom(x: number): number {
  return 12 + 34 * Math.pow(clamp(Math.abs(x) / 96, 0, 1), 0.6);
}

let shoreWander: { left: Array<{ y: number; extra: number }>; right: Array<{ y: number; extra: number }> } = {
  left: [],
  right: [],
};

function buildShoreWander(random: () => number): void {
  const trace = () => {
    const samples: Array<{ y: number; extra: number }> = [];
    let y = OUTER_BOTTOM - 12;
    let wobble = 0;
    while (y < COLUMN_TOP + 12) {
      const down = 1 - columnHeight(y);
      const kick =
        random() < 0.3
          ? (random() < 0.42 ? -1 : 1) * (24 + random() * 46)
          : (random() - 0.5) * 16;
      wobble = clamp(wobble * 0.32 + kick, -46, 64);
      samples.push({ y, extra: wobble * (0.55 + down * 0.65) });
      y += 7 + random() * 12;
    }
    return samples;
  };
  shoreWander = { left: trace(), right: trace() };
}

function wanderAt(samples: Array<{ y: number; extra: number }>, y: number): number {
  if (samples.length === 0) return 0;
  if (y <= samples[0].y) return samples[0].extra;
  const last = samples[samples.length - 1];
  if (y >= last.y) return last.extra;
  for (let i = 1; i < samples.length; i += 1) {
    const next = samples[i];
    if (y > next.y) continue;
    const prev = samples[i - 1];
    const t = (y - prev.y) / (next.y - prev.y);
    const blend = t * t * (3 - 2 * t);
    return prev.extra + (next.extra - prev.extra) * blend;
  }
  return last.extra;
}

function sideReach(y: number, sign: number): number {
  const extra = wanderAt(sign < 0 ? shoreWander.left : shoreWander.right, y);
  const half = (OUTER_RIGHT - OUTER_LEFT) * 0.5;
  return clamp(sideRoom(y) + extra, 10, half - 8);
}

function keepOpen(x: number, y: number): boolean {
  const down = 1 - columnHeight(y);
  const fromSide = Math.min(x - OUTER_LEFT, OUTER_RIGHT - x);
  const reach = x <= 0 ? sideReach(y, -1) : sideReach(y, 1);
  const inward = clamp(fromSide / Math.max(reach, 1), 0, 1);
  if (inward < 0.52) return true;
  let n = Math.imul(Math.floor(x / 6) + Math.imul(Math.floor(y / 8), 10007), 0x9e3779b1) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x85ebca6b) >>> 0;
  const clump = ((n ^ (n >>> 13)) >>> 0) / 4294967296;
  return clump > (inward - 0.52) * (0.5 + down * 0.65);
}

function carveDescent(random: () => number, caves: Passage[]): void {
  let y = COLUMN_TOP - 6;
  let x = (random() - 0.5) * 20;
  while (y > OUTER_BOTTOM + 8) {
    const limit = Math.max(10, (OUTER_RIGHT - OUTER_LEFT) * 0.5 - Math.max(sideReach(y, -1), sideReach(y, 1)) - 8);
    const nx = clamp(x + (random() - 0.5) * 18, -limit, limit);
    const ny = y - (9 + random() * 11);
    const radius = 10 + random() * 3;
    caves.push({ ax: x, ay: y, bx: nx, by: ny, inner: radius, outer: radius });
    x = nx;
    y = ny;
  }
}

function carveCaves(random: () => number): Passage[] {
  const caves: Passage[] = [];
  carveDescent(random, caves);
  const walk = (
    x: number,
    y: number,
    dir: number,
    bias: number,
    steps: number,
    mouth: number,
    end: number,
    branch: boolean,
  ) => {
    let radius = mouth;
    for (let i = 0; i < steps; i += 1) {
      dir += (random() - 0.5) * 1.7;
      const bx = Math.cos(dir) * 0.74 + Math.cos(bias) * 0.26;
      const by = Math.sin(dir) * 0.74 + Math.sin(bias) * 0.26;
      dir = Math.atan2(by, bx);
      const nx = x + Math.cos(dir) * (2.6 + random() * 2.4);
      const ny = y + Math.sin(dir) * (2.6 + random() * 2.4);
      const next = mouth + (end - mouth) * ((i + 1) / steps);
      const bulge = random() < 0.28 ? next + 1.4 + random() * 2.2 : next;
      caves.push({ ax: x, ay: y, bx: nx, by: ny, inner: radius, outer: Math.max(1.4, bulge) });
      x = nx;
      y = ny;
      radius = Math.max(1.4, bulge);
      const low = 1 - columnHeight(y);
      if (branch && i > 0 && i < steps - 1 && random() < 0.22 + low * 0.28) {
        const turn = dir + (random() < 0.5 ? 1 : -1) * (0.7 + random() * 1.1);
        walk(x, y, turn, turn, 2 + Math.floor(random() * 4), radius * (0.7 + random() * 0.4), 1.35, false);
      }
    }
  };
  const carveSide = (sign: number) => {
    const bias = sign < 0 ? Math.PI : 0;
    let y = OUTER_BOTTOM + 14;
    while (y < COLUMN_TOP - 16) {
      const height = columnHeight(y);
      y += (18 + height * 26) * (0.55 + random() * 1.05);
      const room = sideReach(y, sign);
      if (room < 22) continue;
      const mouthDepth = room * (0.36 + random() * 0.26);
      const x = sign < 0 ? OUTER_LEFT + mouthDepth : OUTER_RIGHT - mouthDepth;
      const steps = Math.floor(3 + (1 - height) * 5 + random() * 3);
      walk(x, y + (random() - 0.5) * 8, bias + (random() - 0.5) * 1.3, bias, steps, 2.1 + (1 - height) * 1.6, 1.4, true);
    }
    let cy = OUTER_BOTTOM + 22;
    let depth = sideRoom(cy) * (0.32 + random() * 0.16);
    while (cy < COLUMN_TOP - 40) {
      const room = sideReach(cy, sign);
      if (room < 26) break;
      const low = columnHeight(cy) < 0.48;
      depth += (random() - 0.48) * (low ? 8 : 4);
      depth = Math.min(room * 0.62, Math.max(room * 0.24, depth));
      const ny = cy + 6 + random() * (low ? 10 : 6);
      const x0 = sign < 0 ? OUTER_LEFT + depth : OUTER_RIGHT - depth;
      const wander = (random() - 0.5) * (low ? 7 : 3);
      const x1 = sign < 0 ? OUTER_LEFT + depth + wander : OUTER_RIGHT - depth - wander;
      const radius = low ? 1.7 + random() * 1.2 : 1.6 + random() * 0.5;
      if (random() > 0.55) caves.push({ ax: x0, ay: cy, bx: x1, by: ny, inner: radius, outer: radius });
      if (low && random() < 0.4) {
        const pocket = depth + (random() < 0.5 ? -1 : 1) * (6 + random() * 8);
        const px = sign < 0 ? OUTER_LEFT + pocket : OUTER_RIGHT - pocket;
        caves.push({ ax: x0, ay: cy, bx: px, by: cy + (random() - 0.5) * 6, inner: 2.1, outer: 1.45 });
      }
      cy = ny;
    }
  };
  carveSide(-1);
  carveSide(1);
  let x = OUTER_LEFT + 20;
  while (x < OUTER_RIGHT - 20) {
    const beside = clamp(Math.abs(x) / 100, 0, 1);
    x += (20 + (1 - beside) * 24) * (0.55 + random() * 1.05);
    const room = floorRoom(Math.min(OUTER_RIGHT - 12, Math.max(OUTER_LEFT + 12, x)));
    if (room < 16) continue;
    const mouth = OUTER_BOTTOM + room * (0.32 + random() * 0.26);
    const steps = Math.floor(3 + beside * 4 + random() * 3);
    walk(x, mouth, -Math.PI / 2 + (random() - 0.5) * 1.2, -Math.PI / 2, steps, 2.2 + beside * 1.6, 1.4, true);
  }
  const span = COLUMN_TOP - OUTER_BOTTOM;
  for (let i = 0; i < 36; i += 1) {
    const y = OUTER_BOTTOM + 24 + random() * span * 0.9;
    const down = 1 - columnHeight(y);
    const sign = random() < 0.5 ? -1 : 1;
    const reach = sideReach(y, sign);
    const depth = 6 + random() * Math.max(8, reach * 0.72);
    const x = sign < 0 ? OUTER_LEFT + depth : OUTER_RIGHT - depth;
    const radius = 1.8 + down * 2.6 + random() * 1.2;
    const dir = random() * Math.PI * 2;
    const steps = 3 + Math.floor(down * 5 + random() * 3);
    walk(x, y, dir, dir + (random() - 0.5) * 1.5, steps, radius, 1.6 + down, true);
  }
  return caves;
}

function angleDelta(from: number, to: number): number {
  const tau = Math.PI * 2;
  return ((((to - from) % tau) + tau + Math.PI) % tau) - Math.PI;
}

function wallDistance(x: number, y: number): number {
  return Math.min(x - OUTER_LEFT, OUTER_RIGHT - x, y - OUTER_BOTTOM);
}

function bodySamples(length: number, width: number, bend = 0): Array<[number, number]> {
  const shape = orientedCapsule(length, width);
  const radius = Math.max(1 / 32, shape.radius - 1 / 32);
  const axis =
    bend >= 1e-3 && shape.halfSegment >= 1e-4
      ? curvedOutlineSamples(shape, bend, radius)
      : straightOutlineSamples(shape, radius);
  if (!shape.lateral) return axis;
  return axis.map(([x, y]) => toLocal(x, y, true));
}

function straightOutlineSamples(shape: { halfSegment: number }, radius: number): Array<[number, number]> {
  const samples: Array<[number, number]> = [];
  const steps = Math.max(1, Math.ceil((shape.halfSegment * 2) / 0.2));
  for (let i = 0; i <= steps; i += 1) {
    const t = -shape.halfSegment + (shape.halfSegment * 2 * i) / steps;
    samples.push([t, radius], [t, -radius]);
  }
  const arc = 4;
  for (let i = 0; i <= arc; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * i) / arc;
    const lx = Math.cos(a) * radius;
    const ly = Math.sin(a) * radius;
    samples.push([shape.halfSegment + lx, ly], [-shape.halfSegment - lx, ly]);
  }
  return samples;
}

function inPlug(x: number, y: number): boolean {
  const ySpan = y >= OUTER_BOTTOM - COLLAR && y <= 540;
  const xSpan = x >= OUTER_LEFT - COLLAR && x <= OUTER_RIGHT + COLLAR;
  const left = x >= OUTER_LEFT - COLLAR && x <= OUTER_LEFT + PLUG;
  const right = x >= OUTER_RIGHT - PLUG && x <= OUTER_RIGHT + COLLAR;
  const floor = y >= OUTER_BOTTOM - COLLAR && y <= OUTER_BOTTOM + PLUG;
  return ((left || right) && ySpan) || (floor && xSpan);
}

function scatterCollar(random: () => number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const cell = MIN_SEPARATION / Math.SQRT2;
  const grid = new Map<string, number>();
  const near = (x: number, y: number) => {
    const ix = Math.floor(x / cell);
    const iy = Math.floor(y / cell);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const index = grid.get(`${ix + dx},${iy + dy}`);
        if (index === undefined) continue;
        const point = points[index];
        const ddx = point[0] - x;
        const ddy = point[1] - y;
        if (ddx * ddx + ddy * ddy < MIN_SEPARATION * MIN_SEPARATION) return true;
      }
    }
    return false;
  };
  const top = 540;
  const left0 = OUTER_LEFT - COLLAR;
  const right1 = OUTER_RIGHT + COLLAR;
  const bottom0 = OUTER_BOTTOM - COLLAR;
  let attempts = 0;
  while (points.length < 30000 && attempts < 160000) {
    attempts += 1;
    const region = random();
    let x: number;
    let y: number;
    if (region < 0.42) {
      x = left0 + random() * (COLLAR + PLUG);
      y = bottom0 + random() * (top - bottom0);
    } else if (region < 0.84) {
      x = OUTER_RIGHT - PLUG + random() * (COLLAR + PLUG);
      y = bottom0 + random() * (top - bottom0);
    } else {
      x = left0 + random() * (right1 - left0);
      y = bottom0 + random() * (COLLAR + PLUG);
    }
    if (!inPlug(x, y) || near(x, y)) continue;
    grid.set(`${Math.floor(x / cell)},${Math.floor(y / cell)}`, points.length);
    points.push([x, y]);
  }
  return points;
}

function scatter(random: () => number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  const cell = MIN_SEPARATION / Math.SQRT2;
  const grid = new Map<string, number>();
  const near = (x: number, y: number) => {
    const ix = Math.floor(x / cell);
    const iy = Math.floor(y / cell);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const index = grid.get(`${ix + dx},${iy + dy}`);
        if (index === undefined) continue;
        const point = points[index];
        const ddx = point[0] - x;
        const ddy = point[1] - y;
        if (ddx * ddx + ddy * ddy < MIN_SEPARATION * MIN_SEPARATION) return true;
      }
    }
    return false;
  };
  let attempts = 0;
  while (points.length < 7000 && attempts < 50000) {
    attempts += 1;
    const depth = BAND * Math.pow(random(), 1.7);
    const region = random();
    let x: number;
    let y: number;
    if (region < 0.42) {
      x = OUTER_LEFT + depth;
      y = OUTER_BOTTOM + random() * (540 - OUTER_BOTTOM);
    } else if (region < 0.84) {
      x = OUTER_RIGHT - depth;
      y = OUTER_BOTTOM + random() * (540 - OUTER_BOTTOM);
    } else {
      x = OUTER_LEFT + random() * (OUTER_RIGHT - OUTER_LEFT);
      y = OUTER_BOTTOM + depth;
    }
    if (wallDistance(x, y) > BAND || near(x, y)) continue;
    grid.set(`${Math.floor(x / cell)},${Math.floor(y / cell)}`, points.length);
    points.push([x, y]);
  }
  return points;
}

function buildPassages(random: () => number): Passage[] {
  const passages: Passage[] = [];
  const addSide = (sign: number) => {
    let y = OUTER_BOTTOM + 24;
    while (y < 520) {
      y += 36 + random() * 48;
      const mouth = sign < 0 ? OUTER_LEFT + BAND : OUTER_RIGHT - BAND;
      const end = sign < 0 ? OUTER_LEFT + 0.6 : OUTER_RIGHT - 0.6;
      passages.push({
        ax: mouth,
        ay: y,
        bx: end,
        by: y + (random() - 0.5) * 16,
        inner: 2.2,
        outer: 0.42,
      });
    }
  };
  addSide(-1);
  addSide(1);
  let x = OUTER_LEFT + 18;
  while (x < OUTER_RIGHT - 18) {
    x += 34 + random() * 42;
    passages.push({
      ax: x,
      ay: OUTER_BOTTOM + BAND,
      bx: x + (random() - 0.5) * 14,
      by: OUTER_BOTTOM + 0.6,
      inner: 2.2,
      outer: 0.42,
    });
  }
  return passages;
}

function insidePassage(x: number, y: number, passages: Passage[]): boolean {
  for (const passage of passages) {
    const abx = passage.bx - passage.ax;
    const aby = passage.by - passage.ay;
    const len2 = abx * abx + aby * aby;
    const t = clamp(((x - passage.ax) * abx + (y - passage.ay) * aby) / len2, 0, 1);
    const qx = passage.ax + abx * t;
    const qy = passage.ay + aby * t;
    const radius = passage.inner + (passage.outer - passage.inner) * t;
    if ((x - qx) * (x - qx) + (y - qy) * (y - qy) < radius * radius) return true;
  }
  return false;
}

const DEPOSIT_NAMES: Record<string, string> = {
  ammonia: "Azoite",
  chloride: "Halite",
  iron: "Ferracite",
  sulfur: "Thionite",
};

/** Water direction is from the gray rock toward the colored mineral. The facing name is the wall. */
function mineralFace(sprite: Sprite): NutrientFace | null {
  const name = sprite.image.name;
  if (!name.startsWith("deposit_")) return null;
  const parts = name.slice("deposit_".length).split("_");
  const resource = parts[0] ?? "";
  if (!resource) return null;
  const c = Math.cos(sprite.rotation);
  const s = Math.sin(sprite.rotation);
  const turn = (x: number, y: number): [number, number] => [c * x - s * y, s * x + c * y];
  const [mx, my] = turn(sprite.image.mineralX, sprite.image.mineralY);
  const [ax, ay] = turn(sprite.image.anchorX, sprite.image.anchorY);
  let nx = mx - ax;
  let ny = my - ay;
  const length = Math.hypot(nx, ny);
  if (length > 0.15) {
    nx /= length;
    ny /= length;
  } else {
    [nx, ny] = wallWater(parts[1] ?? "");
  }
  return { x: sprite.cx + mx, y: sprite.cy + my, nx, ny, resource };
}

function wallWater(facing: string): [number, number] {
  if (facing === "right") return [-1, 0];
  if (facing === "left") return [1, 0];
  if (facing === "up") return [0, -1];
  return [0, 1];
}

function featureTitle(name: string): string | null {
  if (name.startsWith("vent_")) return "Geothermal vent";
  if (!name.startsWith("deposit_")) return null;
  const resource = name.slice("deposit_".length).split("_")[0] ?? "";
  if (!resource) return "Resource node";
  const label = DEPOSIT_NAMES[resource] ?? `${resource.charAt(0).toUpperCase()}${resource.slice(1)}`;
  return `${label} node`;
}

function opaqueExtent(
  width: number,
  height: number,
  minPx: number,
  minPy: number,
  maxPx: number,
  maxPy: number,
  texel: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  if (maxPx < 0) {
    const halfW = (width * texel) / 2;
    const halfH = (height * texel) / 2;
    return { minX: -halfW, minY: -halfH, maxX: halfW, maxY: halfH };
  }
  return {
    minX: (minPx - width / 2) * texel,
    maxX: (maxPx + 1 - width / 2) * texel,
    maxY: (height / 2 - minPy) * texel,
    minY: (height / 2 - (maxPy + 1)) * texel,
  };
}

function spriteBounds(sprite: Sprite): { minX: number; minY: number; maxX: number; maxY: number } {
  const mask = sprite.image;
  const cos = Math.cos(sprite.rotation);
  const sin = Math.sin(sprite.rotation);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const lx of [mask.localMinX, mask.localMaxX]) {
    for (const ly of [mask.localMinY, mask.localMaxY]) {
      const wx = sprite.cx + cos * lx - sin * ly;
      const wy = sprite.cy + sin * lx + cos * ly;
      if (wx < minX) minX = wx;
      if (wy < minY) minY = wy;
      if (wx > maxX) maxX = wx;
      if (wy > maxY) maxY = wy;
    }
  }
  return { minX, minY, maxX, maxY };
}

function bounds(sprite: Sprite): [number, number] {
  const c = Math.abs(Math.cos(sprite.rotation));
  const s = Math.abs(Math.sin(sprite.rotation));
  return [c * sprite.hw + s * sprite.hh, s * sprite.hw + c * sprite.hh];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const locations = new WeakMap<WebGLProgram, Map<string, WebGLUniformLocation | null>>();

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation | null {
  let table = locations.get(program);
  if (!table) {
    table = new Map();
    locations.set(program, table);
  }
  if (!table.has(name)) table.set(name, gl.getUniformLocation(program, name));
  return table.get(name) ?? null;
}

function link(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("could not create program");
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "program link failed");
  }
  return program;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("could not create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "shader compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

/** Squared distance, in cells, to the nearest occupied cell. */
function distanceToSolid(solid: Uint8Array, width: number, height: number): Float64Array {
  const count = width * height;
  const inf = (width + height) * (width + height);
  const horizontal = new Float64Array(count);
  const row = new Float64Array(width);
  const transformed = new Float64Array(width);
  for (let y = 0; y < height; y += 1) {
    const start = y * width;
    for (let x = 0; x < width; x += 1) row[x] = solid[start + x] ? 0 : inf;
    edt1d(row, width, transformed);
    horizontal.set(transformed, start);
  }
  const column = new Float64Array(height);
  const vertical = new Float64Array(height);
  const distance = new Float64Array(count);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) column[y] = horizontal[y * width + x];
    edt1d(column, height, vertical);
    for (let y = 0; y < height; y += 1) distance[y * width + x] = vertical[y];
  }
  return distance;
}

function edt1d(f: Float64Array, n: number, out: Float64Array): void {
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0;
  z[0] = Number.NEGATIVE_INFINITY;
  z[1] = Number.POSITIVE_INFINITY;
  for (let q = 1; q < n; q += 1) {
    let s = parabolaSep(f, v[k], q);
    while (s <= z[k]) {
      k -= 1;
      s = parabolaSep(f, v[k], q);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Number.POSITIVE_INFINITY;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    const delta = q - v[k];
    out[q] = delta * delta + f[v[k]];
  }
}

function parabolaSep(f: Float64Array, i: number, q: number): number {
  return (f[q] + q * q - (f[i] + i * i)) / (2 * q - 2 * i);
}
