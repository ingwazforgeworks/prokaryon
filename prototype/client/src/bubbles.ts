// World-space bubble particles. Sources emit bursts; the bubbles never collide.

import { bootMark } from "./boot";

const POP_DURATION = 0.72;
const VIEW_PIXELS = 32;
const SOURCE_PER_PIXEL = 12;
const PIXEL = 1 / VIEW_PIXELS;
const MAX_BUBBLES = 360;
const IDLE_URL = "/atmosphere/Bubble_spite_sheet.png";
const POP_URL = "/atmosphere/Bubble_popping_sprite_sheet.png";
const IDLE_X = [0, 362, 724, 1086, 1448];
const IDLE_Y = [0, 330, 650, 1086];
const POP_X = [0, 305, 600, 895, 1190, 1485, 1774];
const POP_Y = [0, 285, 573, 887];

const BUBBLE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform vec2 uCamera;
uniform vec2 uHalfView;
out vec2 vUv;
void main() {
  vec2 world = uCenter + aCorner * uHalfSize;
  gl_Position = vec4((world - uCamera) / uHalfView, 0.0, 1.0);
  vUv = aCorner * 0.5 + 0.5;
}`;

const BUBBLE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uSprite;
out vec4 fragColor;
void main() {
  vec4 tex = texture(uSprite, vUv);
  if (tex.a < 0.5) discard;
  fragColor = tex;
}`;

interface SpriteFrame {
  texture: WebGLTexture;
  w: number;
  h: number;
  ox: number;
  oy: number;
}

interface Emitter {
  x: number;
  y: number;
  wait: number;
}

interface Bubble {
  x0: number;
  y0: number;
  rise: number;
  amp: number;
  freq: number;
  phase: number;
  lean: number;
  drift: number;
  wander: number;
  meander: number;
  meanderPhase: number;
  life: number;
  clock: number;
  hold: number;
  size: number;
  variant: number;
}

interface Sheet {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

export class BubbleField {
  private readonly program: WebGLProgram;
  private readonly quad: WebGLBuffer;
  private readonly emitters: Emitter[] = [];
  private readonly live: Bubble[] = [];
  private idle: SpriteFrame[][] = [];
  private pop: SpriteFrame[][] = [];
  private ready = false;

  constructor(private readonly gl: WebGL2RenderingContext) {
    this.program = link(gl, BUBBLE_VS, BUBBLE_FS);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );
    void this.prepare();
  }

  private syncedGeneration = -1;
  private itemUsed = 0;
  private readonly items: Array<{ frame: SpriteFrame; x: number; y: number }> = [];
  private readonly order: number[] = [];

  sync(sources: ReadonlyArray<{ x: number; y: number }>, generation: number): void {
    if (generation === this.syncedGeneration) return;
    this.syncedGeneration = generation;
    const next: Emitter[] = [];
    for (const source of sources) {
      const existing = this.emitters.find((emitter) => Math.hypot(emitter.x - source.x, emitter.y - source.y) < 0.05);
      if (existing) next.push(existing);
      else next.push({ x: source.x, y: source.y, wait: 0 });
    }
    this.emitters.length = 0;
    this.emitters.push(...next);
  }

  update(dt: number): void {
    if (!this.ready) return;
    for (const emitter of this.emitters) {
      emitter.wait -= dt;
      if (emitter.wait > 0) continue;
      this.spawnBurst(emitter);
      emitter.wait = 2 + Math.random() * 8;
    }
    for (const bubble of this.live) {
      if (bubble.hold > 0) {
        bubble.hold -= dt;
        if (bubble.hold > 0) continue;
        bubble.clock = -bubble.hold;
        bubble.hold = 0;
        continue;
      }
      bubble.clock += dt;
    }
    let write = 0;
    for (let index = 0; index < this.live.length; index += 1) {
      const bubble = this.live[index];
      if (bubble.clock < bubble.life + POP_DURATION) this.live[write++] = bubble;
    }
    this.live.length = write;
  }

  draw(halfView: [number, number], camera: [number, number]): void {
    if (!this.ready || this.live.length === 0) return;
    this.itemUsed = 0;
    for (const bubble of this.live) {
      if (bubble.hold > 0) continue;
      const [x, y] = bubblePosition(bubble);
      const poppingNow = bubble.clock >= bubble.life;
      const frame = poppingNow
        ? this.pop[bubble.size][Math.min(5, Math.floor(((bubble.clock - bubble.life) / POP_DURATION) * 6))]
        : this.idle[bubble.size][bubble.variant];
      this.placeItem(frame, x, y);
    }
    const order = this.order;
    order.length = this.itemUsed;
    for (let index = 0; index < this.itemUsed; index += 1) order[index] = index;
    order.sort((a, b) => this.items[a].y - this.items[b].y);
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.program);
    gl.uniform2f(uniform(gl, this.program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, this.program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform1i(uniform(gl, this.program, "uSprite"), 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    let bound: WebGLTexture | null = null;
    for (let n = 0; n < order.length; n += 1) {
      const item = this.items[order[n]];
      const centerX = snapCenter(item.x + item.frame.ox, item.frame.w);
      const centerY = snapCenter(item.y + item.frame.oy, item.frame.h);
      const hw = (item.frame.w * PIXEL) / 2;
      const hh = (item.frame.h * PIXEL) / 2;
      if (Math.abs(centerX - camera[0]) > halfView[0] + hw + PIXEL) continue;
      if (Math.abs(centerY - camera[1]) > halfView[1] + hh + PIXEL) continue;
      if (item.frame.texture !== bound) {
        bound = item.frame.texture;
        gl.bindTexture(gl.TEXTURE_2D, bound);
      }
      gl.uniform2f(uniform(gl, this.program, "uCenter"), centerX, centerY);
      gl.uniform2f(uniform(gl, this.program, "uHalfSize"), hw, hh);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }

  private placeItem(frame: SpriteFrame, x: number, y: number): void {
    const index = this.itemUsed;
    const existing = this.items[index];
    if (existing) {
      existing.frame = frame;
      existing.x = x;
      existing.y = y;
    } else this.items.push({ frame, x, y });
    this.itemUsed = index + 1;
  }

  private spawnBurst(emitter: Emitter): void {
    const count = 3 + Math.floor(Math.random() * 8);
    let release = 0;
    for (let i = 0; i < count; i += 1) {
      if (this.live.length >= MAX_BUBBLES) return;
      if (i > 0) release += 0.06 + Math.random() * 0.06;
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 0.42;
      const roll = Math.random();
      const rise = 0.46 + Math.random() * 0.52;
      this.live.push({
        x0: emitter.x + Math.cos(angle) * dist,
        y0: emitter.y + Math.sin(angle) * dist,
        rise: rise * (1 + Math.random() * 2),
        amp: 0.14 + Math.random() * 0.26,
        freq: 1.4 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        lean: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.4),
        drift: 0.28 + Math.random() * 0.32,
        wander: 0.12 + Math.random() * 0.22,
        meander: 0.45 + Math.random() * 0.55,
        meanderPhase: Math.random() * Math.PI * 2,
        life: 5 + Math.random() * 6,
        clock: 0,
        hold: release,
        size: roll < 0.5 ? 0 : roll < 0.82 ? 1 : 2,
        variant: Math.floor(Math.random() * 4),
      });
    }
  }

  private async prepare(): Promise<void> {
    try {
      const [idleSheet, popSheet] = await Promise.all([this.loadSheet(IDLE_URL), this.loadSheet(POP_URL)]);
      bootMark("bubbles", 0.6);
      this.idle = sliceIdle(this.gl, idleSheet);
      this.pop = slicePop(this.gl, popSheet);
      this.ready = true;
      bootMark("bubbles", 1);
    } catch (error) {
      console.error(error);
    }
  }

  private async loadSheet(url: string): Promise<Sheet> {
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
    return { width: image.width, height: image.height, pixels };
  }
}

function bubblePosition(bubble: Bubble): [number, number] {
  const popping = bubble.clock >= bubble.life;
  const travel = popping ? bubble.life + (bubble.clock - bubble.life) * 0.3 : bubble.clock;
  const grown = Math.min(bubble.clock, bubble.life);
  const along = grown / bubble.life;
  const sway = Math.sin(bubble.clock * bubble.freq + bubble.phase) * bubble.amp;
  const wander = Math.sin(bubble.clock * bubble.meander + bubble.meanderPhase) * bubble.wander * (0.35 + along);
  const tend = bubble.lean * bubble.drift * along * travel * bubble.rise;
  return [bubble.x0 + sway + wander + tend, bubble.y0 + travel * bubble.rise];
}

function sliceIdle(gl: WebGL2RenderingContext, sheet: Sheet): SpriteFrame[][] {
  const xs = scaled(IDLE_X, sheet.width);
  const ys = scaled(IDLE_Y, sheet.height);
  const rows: SpriteFrame[][] = [];
  for (let row = 0; row < ys.length - 1; row += 1) {
    const frames: SpriteFrame[] = [];
    for (let col = 0; col < xs.length - 1; col += 1) {
      const box = alphaBounds(sheet, xs[col], ys[row], xs[col + 1], ys[row + 1]);
      if (!box) throw new Error("bubble sheet is missing a sprite");
      const x0 = Math.max(xs[col], box.minX - 1);
      const y0 = Math.max(ys[row], box.minY - 1);
      const x1 = Math.min(xs[col + 1], box.maxX + 1);
      const y1 = Math.min(ys[row + 1], box.maxY + 1);
      const w = Math.max(4, Math.round((x1 - x0) / SOURCE_PER_PIXEL));
      const h = Math.max(4, Math.round((y1 - y0) / SOURCE_PER_PIXEL));
      frames.push({ texture: rasterize(gl, sheet, x0, y0, x1, y1, w, h), w, h, ox: 0, oy: 0 });
    }
    rows.push(frames);
  }
  return rows;
}

function slicePop(gl: WebGL2RenderingContext, sheet: Sheet): SpriteFrame[][] {
  const xs = scaled(POP_X, sheet.width);
  const ys = scaled(POP_Y, sheet.height);
  const rows: SpriteFrame[][] = [];
  for (let row = 0; row < ys.length - 1; row += 1) {
    const anchor = alphaBounds(sheet, xs[0], ys[row], xs[1], ys[row + 1]);
    if (!anchor) throw new Error("bubble pop sheet is missing a sprite");
    const originW = xs[1] - xs[0];
    const originH = ys[row + 1] - ys[row];
    const ax = ((anchor.minX + anchor.maxX) / 2 - xs[0]) / originW;
    const ay = ((anchor.minY + anchor.maxY) / 2 - ys[row]) / originH;
    const frames: SpriteFrame[] = [];
    for (let col = 0; col < xs.length - 1; col += 1) {
      const x0 = xs[col];
      const y0 = ys[row];
      const x1 = xs[col + 1];
      const y1 = ys[row + 1];
      const w = Math.max(1, Math.round((x1 - x0) / SOURCE_PER_PIXEL));
      const h = Math.max(1, Math.round((y1 - y0) / SOURCE_PER_PIXEL));
      frames.push({
        texture: rasterize(gl, sheet, x0, y0, x1, y1, w, h),
        w,
        h,
        ox: (w / 2 - ax * w) * PIXEL,
        oy: (ay * h - h / 2) * PIXEL,
      });
    }
    rows.push(frames);
  }
  return rows;
}

function rasterize(
  gl: WebGL2RenderingContext,
  sheet: Sheet,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  dw: number,
  dh: number,
): WebGLTexture {
  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("could not rasterize a bubble");
  const image = context.createImageData(dw, dh);
  const sw = x1 - x0;
  const sh = y1 - y0;
  for (let dy = 0; dy < dh; dy += 1) {
    for (let dx = 0; dx < dw; dx += 1) {
      const xa = Math.floor(x0 + (dx * sw) / dw);
      const xb = Math.max(xa + 1, Math.floor(x0 + ((dx + 1) * sw) / dw));
      const ya = Math.floor(y0 + (dy * sh) / dh);
      const yb = Math.max(ya + 1, Math.floor(y0 + ((dy + 1) * sh) / dh));
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      for (let y = ya; y < yb; y += 1) {
        if (y < 0 || y >= sheet.height) continue;
        for (let x = xa; x < xb; x += 1) {
          if (x < 0 || x >= sheet.width) continue;
          const index = (y * sheet.width + x) * 4;
          if (sheet.pixels[index + 3] < 100) continue;
          red += sheet.pixels[index];
          green += sheet.pixels[index + 1];
          blue += sheet.pixels[index + 2];
          count += 1;
        }
      }
      if (count === 0) continue;
      const out = (dy * dw + dx) * 4;
      image.data[out] = red / count;
      image.data[out + 1] = green / count;
      image.data[out + 2] = blue / count;
      image.data[out + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = gl.createTexture();
  if (!texture) throw new Error("could not create bubble texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const flip = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL) as boolean;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flip);
  return texture;
}

function snapCenter(world: number, pixels: number): number {
  const steps = Math.round(world / PIXEL);
  return (pixels % 2 === 0 ? steps : steps + 0.5) * PIXEL;
}

function alphaBounds(
  sheet: Sheet,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): { minX: number; minY: number; maxX: number; maxY: number } | null {
  const width = sheet.width;
  const height = sheet.height;
  const xa = Math.max(0, Math.floor(x0));
  const ya = Math.max(0, Math.floor(y0));
  const xb = Math.min(width, Math.ceil(x1));
  const yb = Math.min(height, Math.ceil(y1));
  let minX = xb;
  let minY = yb;
  let maxX = xa;
  let maxY = ya;
  let hit = false;
  for (let y = ya; y < yb; y += 1) {
    for (let x = xa; x < xb; x += 1) {
      if (sheet.pixels[(y * width + x) * 4 + 3] < 8) continue;
      hit = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + 1 > maxX) maxX = x + 1;
      if (y + 1 > maxY) maxY = y + 1;
    }
  }
  return hit ? { minX, minY, maxX, maxY } : null;
}

function scaled(edges: number[], size: number): number[] {
  const span = edges[edges.length - 1];
  return edges.map((edge) => (edge / span) * size);
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
