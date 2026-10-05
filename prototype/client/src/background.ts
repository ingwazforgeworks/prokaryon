// Background stack behind and in front of the cell: water, drifting specks, then a light edge grade.

import { COLUMN_BOTTOM, COLUMN_OPTICAL_DEPTH, COLUMN_TOP } from "./light";
import type { PackedPointLights, ShoreField } from "./terrain";
import { TEXEL_COLUMNS, TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y, TEXEL_ROWS, TEXEL_SIZE } from "./texels";

const FULLSCREEN_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
out vec2 vClip;
void main() {
  vClip = aCorner;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

const NOISE = `
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

vec2 layerPoint(vec2 camera, vec2 clip, vec2 halfView, float parallax) {
  return camera * parallax + clip * halfView;
}

vec3 applyLight(vec3 color, float intensity) {
  return mix(color * 0.8, color, intensity);
}
`;

const WATER_FS = `#version 300 es
precision highp float;
in vec2 vClip;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform float uSun;
uniform vec3 uPointLights[48];
uniform vec3 uPointColors[48];
uniform int uPointCount;
uniform sampler2D uShore;
uniform sampler2D uNutrients;
uniform vec2 uShoreOrigin;
uniform vec2 uShoreSpan;
out vec4 fragColor;
vec4 dissolved(vec2 uv) {
  vec2 s = 1.1 / uShoreSpan;
  vec4 c = texture(uNutrients, uv) * 0.20;
  c += texture(uNutrients, uv + vec2(-s.x, -s.y)) * 0.10;
  c += texture(uNutrients, uv + vec2(0.0, -s.y)) * 0.10;
  c += texture(uNutrients, uv + vec2(s.x, -s.y)) * 0.10;
  c += texture(uNutrients, uv + vec2(-s.x, 0.0)) * 0.10;
  c += texture(uNutrients, uv + vec2(s.x, 0.0)) * 0.10;
  c += texture(uNutrients, uv + vec2(-s.x, s.y)) * 0.10;
  c += texture(uNutrients, uv + vec2(0.0, s.y)) * 0.10;
  c += texture(uNutrients, uv + vec2(s.x, s.y)) * 0.10;
  return c;
}
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
float columnLight(float y) {
  float depth = clamp(y, ${COLUMN_BOTTOM}.0, ${COLUMN_TOP}.0);
  float fromSurface = ${COLUMN_TOP}.0 - depth;
  return exp(-${COLUMN_OPTICAL_DEPTH} * fromSurface / ${COLUMN_TOP - COLUMN_BOTTOM}.0);
}
void main() {
  vec2 world = uCamera + vClip * uHalfView;
  vec2 uv = (world - uShoreOrigin) / uShoreSpan;
  float away = smoothstep(0.0, 1.0, texture(uShore, uv).r);
  vec3 nearDay = vec3(0.036, 0.0695, 0.082);
  vec3 night = vec3(0.012, 0.022, 0.03);
  float light = uSun * columnLight(world.y);
  vec3 lit = mix(night, nearDay, light);
  float seen = smoothstep(0.0, 0.08, light);
  vec3 deep = vec3(lit.r * 0.4, lit.g * 0.55, min(1.0, lit.b * 1.1 + 0.04));
  vec3 water = mix(lit, deep, away * seen) + pointGlow(world);
  vec4 nutrient = dissolved(uv);
  float weight = nutrient.r + nutrient.g + nutrient.b + nutrient.a;
  vec3 hue = vec3(0.86, 0.68, 0.18) * nutrient.r
    + vec3(0.92, 0.38, 0.08) * nutrient.g
    + vec3(0.16, 0.55, 0.78) * nutrient.b
    + vec3(0.62, 0.90, 0.78) * nutrient.a;
  hue = weight > 0.0001 ? hue / weight : water;
  float peak = max(max(nutrient.r, nutrient.g), max(nutrient.b, nutrient.a));
  float open = smoothstep(0.012, 0.04, texture(uShore, uv).r);
  float cover = peak * 0.4 * open;
  fragColor = vec4(mix(water, hue, cover), 1.0);
}`;

const PARTICLE_FS = `#version 300 es
precision highp float;
in vec2 vClip;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform float uPixelsPerUnit;
uniform float uLightIntensity;
uniform float uTime;
uniform sampler2D uTemperature;
uniform sampler2D uOxidex;
uniform sampler2D uSulfex;
uniform vec2 uOrigin;
uniform vec2 uGrid;
uniform float uCell;
out vec4 fragColor;
${NOISE}

float sampleCelsius(vec2 cell) {
  vec2 clamped = clamp(cell, vec2(0.0), uGrid - 1.0);
  return texture(uTemperature, (clamped + 0.5) / uGrid).r * 130.0;
}

float sampleOxidex(vec2 cell) {
  vec2 clamped = clamp(cell, vec2(0.0), uGrid - 1.0);
  return texture(uOxidex, (clamped + 0.5) / uGrid).r;
}

float sampleSulfex(vec2 cell) {
  vec2 clamped = clamp(cell, vec2(0.0), uGrid - 1.0);
  return texture(uSulfex, (clamped + 0.5) / uGrid).r;
}

float blendGrid(vec2 world, float a, float b, float c, float d) {
  vec2 grid = (world - uOrigin) / uCell - 0.5;
  vec2 f = fract(grid);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float celsiusAt(vec2 world) {
  vec2 cell = floor((world - uOrigin) / uCell - 0.5);
  return blendGrid(
    world,
    sampleCelsius(cell),
    sampleCelsius(cell + vec2(1.0, 0.0)),
    sampleCelsius(cell + vec2(0.0, 1.0)),
    sampleCelsius(cell + vec2(1.0, 1.0))
  );
}

float oxidexAt(vec2 world) {
  vec2 cell = floor((world - uOrigin) / uCell - 0.5);
  return blendGrid(
    world,
    sampleOxidex(cell),
    sampleOxidex(cell + vec2(1.0, 0.0)),
    sampleOxidex(cell + vec2(0.0, 1.0)),
    sampleOxidex(cell + vec2(1.0, 1.0))
  );
}

float sulfexAt(vec2 world) {
  vec2 cell = floor((world - uOrigin) / uCell - 0.5);
  return blendGrid(
    world,
    sampleSulfex(cell),
    sampleSulfex(cell + vec2(1.0, 0.0)),
    sampleSulfex(cell + vec2(0.0, 1.0)),
    sampleSulfex(cell + vec2(1.0, 1.0))
  );
}

bool mote(vec2 p, float spacing, float keep) {
  vec2 cell = floor(p / spacing);
  if (hash(cell) > keep) return false;
  vec2 jitter = vec2(hash(cell + 2.0), hash(cell + 5.0));
  vec2 center = (cell + 0.18 + 0.64 * jitter) * spacing;
  float radiusPx = hash(cell + 8.0) > 0.9 ? 2.0 : 1.0;
  vec2 delta = floor(p * uPixelsPerUnit) - floor(center * uPixelsPerUnit);
  if (radiusPx < 1.5) return delta.x == 0.0 && delta.y == 0.0;
  return delta.x >= 0.0 && delta.y >= 0.0 && delta.x < 2.0 && delta.y < 2.0;
}

vec2 curlNoise(vec2 q) {
  float e = 0.65;
  float n = noise(q);
  float nx = noise(q + vec2(e, 0.0));
  float ny = noise(q + vec2(0.0, e));
  return vec2(ny - n, n - nx);
}

// Fixed clock. Heat must not scale time or frequency: the field steps twice a second,
// and that used to teleport the curl into a new shape.
vec2 eddy(vec2 p) {
  float t = uTime * 0.28;
  vec2 q = p * 0.075;
  vec2 broad = curlNoise(q + vec2(t, t * 0.61));
  vec2 fine = curlNoise(q * 1.85 + vec2(-t * 1.05, t * 0.74) + 23.0);
  return broad + fine * 0.42;
}

void main() {
  vec2 lit = uCamera + vClip * uHalfView;
  float warmth = clamp((celsiusAt(lit) - 4.0) / 106.0, 0.0, 1.0);
  float amp = warmth * warmth * 3.4;
  vec2 world = layerPoint(uCamera, vClip, uHalfView, 0.75);
  vec2 driftA = world + vec2(uTime * 0.022, uTime * 0.008) + eddy(world) * amp;
  vec2 driftB = world + vec2(uTime * -0.012, uTime * 0.016) + eddy(world + vec2(70.0, 19.0)) * amp;
  float oxidex = clamp(oxidexAt(lit), 0.0, 1.0);
  float sulfex = clamp(sulfexAt(lit), 0.0, 1.0);
  bool white = false;
  bool yellow = false;
  if (oxidex > 0.015) {
    white = mote(driftA + vec2(19.0, 7.0), 1.35, oxidex * 0.7);
    if (!white) white = mote(driftB + vec2(-13.0, 23.0), 2.15, oxidex * 0.48);
  }
  if (sulfex > 0.015) {
    yellow = mote(driftA + vec2(-27.0, 11.0), 1.35, sulfex * 0.7);
    if (!yellow) yellow = mote(driftB + vec2(15.0, -21.0), 2.15, sulfex * 0.48);
  }
  if (!white && !yellow) discard;
  vec3 color = yellow && (!white || sulfex > oxidex) ? vec3(0.66, 0.60, 0.38) : vec3(0.55, 0.58, 0.60);
  fragColor = vec4(applyLight(color, uLightIntensity), 0.55);
}`;

const ATMOSPHERE_FS = `#version 300 es
precision highp float;
in vec2 vClip;
uniform float uZoom;
out vec4 fragColor;

float bayer8(vec2 pixel) {
  int x = int(mod(pixel.x, 8.0));
  int y = int(mod(pixel.y, 8.0));
  int index = x + y * 8;
  int pattern[64] = int[64](
    0, 32, 8, 40, 2, 34, 10, 42,
    48, 16, 56, 24, 50, 18, 58, 26,
    12, 44, 4, 36, 14, 46, 6, 38,
    60, 28, 52, 20, 62, 30, 54, 22,
    3, 35, 11, 43, 1, 33, 9, 41,
    51, 19, 59, 27, 49, 17, 57, 25,
    15, 47, 7, 39, 13, 45, 5, 37,
    63, 31, 55, 23, 61, 29, 53, 21
  );
  return float(pattern[index]) / 64.0;
}

void main() {
  float radius = length(vClip * vec2(0.75, 1.05)) * uZoom;
  float shade = smoothstep(0.5, 1.5, radius) * 0.7;
  if (shade <= bayer8(gl_FragCoord.xy)) discard;
  fragColor = vec4(0.0, 0.008, 0.012, 0.4);
}`;

export class BackgroundPass {
  private readonly waterProgram: WebGLProgram;
  private readonly particleProgram: WebGLProgram;
  private readonly atmosphereProgram: WebGLProgram;
  private readonly shoreTexture: WebGLTexture;
  private shoreGeneration = Number.NaN;
  private time = 0;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly drawQuad: (program: WebGLProgram) => void,
  ) {
    this.waterProgram = link(gl, FULLSCREEN_VS, WATER_FS);
    this.particleProgram = link(gl, FULLSCREEN_VS, PARTICLE_FS);
    this.atmosphereProgram = link(gl, FULLSCREEN_VS, ATMOSPHERE_FS);
    this.shoreTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.shoreTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
  }

  drawBehind(
    halfView: [number, number],
    camera: [number, number],
    pixelsPerUnit: number,
    intensity: number,
    sun: number,
    dt: number,
    lights: PackedPointLights,
    temperature: WebGLTexture,
    oxidex: WebGLTexture,
    sulfex: WebGLTexture,
    nutrients: WebGLTexture,
    shore: ShoreField | null,
  ): void {
    this.time += dt;
    const gl = this.gl;
    gl.disable(gl.BLEND);
    this.drawWater(halfView, camera, sun, lights, shore, nutrients);
    this.drawParticles(halfView, camera, pixelsPerUnit, intensity, temperature, oxidex, sulfex);
  }

  drawInFront(zoom: number): void {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.atmosphereProgram);
    gl.uniform1f(uniform(gl, this.atmosphereProgram, "uZoom"), zoom);
    this.drawQuad(this.atmosphereProgram);
    gl.disable(gl.BLEND);
  }

  private drawWater(
    halfView: [number, number],
    camera: [number, number],
    sun: number,
    lights: PackedPointLights,
    shore: ShoreField | null,
    nutrients: WebGLTexture,
  ): void {
    const gl = this.gl;
    const program = this.waterProgram;
    this.syncShore(shore);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.shoreTexture);
    gl.uniform1i(uniform(gl, program, "uShore"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nutrients);
    gl.uniform1i(uniform(gl, program, "uNutrients"), 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform1f(uniform(gl, program, "uSun"), sun);
    gl.uniform1i(uniform(gl, program, "uPointCount"), lights.count);
    gl.uniform3fv(uniform(gl, program, "uPointLights"), lights.data);
    gl.uniform3fv(uniform(gl, program, "uPointColors"), lights.colors);
    if (shore) {
      gl.uniform2f(uniform(gl, program, "uShoreOrigin"), shore.originX, shore.originY);
      gl.uniform2f(uniform(gl, program, "uShoreSpan"), shore.spanX, shore.spanY);
    } else {
      gl.uniform2f(uniform(gl, program, "uShoreOrigin"), 0, 0);
      gl.uniform2f(uniform(gl, program, "uShoreSpan"), 1, 1);
    }
    this.drawQuad(program);
  }

  private syncShore(shore: ShoreField | null): void {
    if (!shore || shore.generation === this.shoreGeneration) return;
    const gl = this.gl;
    const rgba = new Uint8Array(shore.width * shore.height * 4);
    for (let i = 0; i < shore.texels.length; i += 1) {
      rgba[i * 4] = shore.texels[i];
      rgba[i * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.shoreTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, shore.width, shore.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    this.shoreGeneration = shore.generation;
  }

  private drawParticles(
    halfView: [number, number],
    camera: [number, number],
    pixelsPerUnit: number,
    intensity: number,
    temperature: WebGLTexture,
    oxidex: WebGLTexture,
    sulfex: WebGLTexture,
  ): void {
    const gl = this.gl;
    const program = this.particleProgram;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, temperature);
    gl.uniform1i(uniform(gl, program, "uTemperature"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, oxidex);
    gl.uniform1i(uniform(gl, program, "uOxidex"), 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, sulfex);
    gl.uniform1i(uniform(gl, program, "uSulfex"), 2);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform2f(uniform(gl, program, "uOrigin"), TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y);
    gl.uniform2f(uniform(gl, program, "uGrid"), TEXEL_COLUMNS, TEXEL_ROWS);
    gl.uniform1f(uniform(gl, program, "uCell"), TEXEL_SIZE);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform1f(uniform(gl, program, "uPixelsPerUnit"), pixelsPerUnit);
    gl.uniform1f(uniform(gl, program, "uLightIntensity"), intensity);
    gl.uniform1f(uniform(gl, program, "uTime"), this.time);
    this.drawQuad(program);
    gl.disable(gl.BLEND);
  }
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
