import { BackgroundPass } from "./background";
import { BubbleField } from "./bubbles";
import { DecorationField, type DecorationLayer, type DecorationStamp, type DecorationType } from "./decorations";
import { appendRibbon, fillCilium, fillMix, fillWhip, mixScratch, stepFlail, stepLazyChain, whipScratch, type RibbonPoint } from "./flagellum";
import { bodyNormal, bodySignedDistance, ciliaStrokeSign, curvedHalfExtents, effectiveTaperDegrees, flagellumSiteAnchor, longAxisT, orientedCapsule, projectToMembrane, taperEffective, type BodyShape } from "./shape";
import { Terrain, type PackedPointLights, type Pose, type TerrainFeature } from "./terrain";
import { NutrientField } from "./nutrients";
import { OxidexField } from "./oxidex";
import { PressureField } from "./pressure";
import { SulfexField } from "./sulfex";
import { TemperatureField } from "./temperature";
import { TEXEL_COLUMNS, TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y, TEXEL_ROWS, TEXEL_SIZE, TEXEL_SPAN_X, TEXEL_SPAN_Y } from "./texels";
import type { CellSnapshot, ViewSnapshot } from "./types";

const LOGICAL_WIDTH = 640;
const LOGICAL_HEIGHT = 360;
const FLAGELLUM_SEGMENTS = 20;
const FLAGELLUM_BLEND_SECONDS = 0.45;
const ZOOM_MIN = 1;
const ZOOM_MAX = 2;

const PALETTES: number[][][] = [
  [
    [0.34, 0.34, 0.34, 1],
    [0.5, 0.5, 0.5, 1],
    [0.66, 0.66, 0.66, 1],
    [0.82, 0.82, 0.82, 1],
    [1.0, 1.0, 1.0, 1],
  ],
];

const CAPSULE_COLORS = [
  [0.1, 0.22, 0.2],
  [0.45, 0.28, 0.12],
];

const STORAGE = [
  [
    [0.28, 0.15, 0.05],
    [0.82, 0.64, 0.22],
  ],
  [
    [0.16, 0.22, 0.1],
    [0.72, 0.82, 0.48],
  ],
];

const FLAGELLUM_COLORS = [
  [0.68, 0.68, 0.7],
  [0.68, 0.68, 0.7],
];

const CILIUM_COLORS = [
  [0.42, 0.42, 0.44],
  [0.42, 0.42, 0.44],
];

const BODY_FLOATS = 36;

function packPalette(index: number): Float32Array {
  const rows = PALETTES[index] ?? PALETTES[0];
  const out = new Float32Array(20);
  for (let i = 0; i < 5; i += 1) {
    const row = rows[Math.min(i, rows.length - 1)];
    out[i * 4] = row[0];
    out[i * 4 + 1] = row[1];
    out[i * 4 + 2] = row[2];
    out[i * 4 + 3] = row[3];
  }
  return out;
}

const PALETTE0 = packPalette(0);
const PALETTE1 = packPalette(1);
const interiorRow = PALETTES[0][0];
/** Darkest cytoplasm band. The isoprenoid membrane starts a step under this. */
export const INTERIOR_BASE_COLOR: [number, number, number] = [interiorRow[0], interiorRow[1], interiorRow[2]];
/** Default isoprenoid rim, relative to the shaded cytoplasm base. */
export const ISOPRENOID_SHADE = 0.8;
const CAPSULE_PACK = new Float32Array([
  ...CAPSULE_COLORS[0],
  ...(CAPSULE_COLORS[1] ?? CAPSULE_COLORS[0]),
]);

const BODY_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 iCenterAxis;
layout(location = 2) in vec4 iExpandShape;
layout(location = 3) in vec4 iCurve;
layout(location = 4) in vec4 iDivision;
layout(location = 5) in vec4 iMembrane;
layout(location = 6) in vec4 iLook;
layout(location = 7) in vec4 iPaletteDepth;
layout(location = 8) in vec4 iTaper;
layout(location = 9) in vec4 iPigment;
uniform vec2 uHalfView;
uniform vec2 uCamera;
flat out vec2 uCenter;
flat out vec2 uAxis;
flat out float uHalfSegment;
flat out float uRadius;
flat out float uBend;
flat out float uFurrow;
flat out float uWaist;
flat out float uDivision;
flat out float uMorph;
flat out float uShift;
flat out float uPlace;
flat out float uLateral;
flat out float uMembranePx;
flat out float uMembraneStyle;
flat out float uCapsuleThickness;
flat out float uSeed;
flat out float uAngle;
flat out vec3 uMembraneColor;
flat out float uPaletteIndex;
flat out vec4 uTaper;
flat out vec3 uPigment;
out vec2 vLocal;
void main() {
  vec2 center = iCenterAxis.xy;
  vec2 axis = iCenterAxis.zw;
  vec2 local = aCorner * iExpandShape.xy;
  vec2 world = center + vec2(
    axis.x * local.x - axis.y * local.y,
    axis.x * local.y + axis.y * local.x
  );
  gl_Position = vec4((world - uCamera) / uHalfView, iPaletteDepth.y, 1.0);
  vLocal = local;
  uCenter = center;
  uAxis = axis;
  uHalfSegment = iExpandShape.z;
  uRadius = iExpandShape.w;
  uBend = iCurve.x;
  uFurrow = iCurve.y;
  uWaist = iCurve.z;
  uDivision = iCurve.w;
  uMorph = iDivision.x;
  uShift = iDivision.y;
  uPlace = iDivision.z;
  uLateral = iDivision.w;
  uMembranePx = iMembrane.x;
  uMembraneStyle = iMembrane.y;
  uCapsuleThickness = iMembrane.z;
  uSeed = iMembrane.w;
  uAngle = iLook.x;
  uMembraneColor = iLook.yzw;
  uPaletteIndex = iPaletteDepth.x;
  uTaper = iTaper;
  uPigment = iPigment.rgb;
}`;

const BODY_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
flat in vec2 uCenter;
flat in vec2 uAxis;
flat in float uHalfSegment;
flat in float uRadius;
flat in float uBend;
flat in float uFurrow;
flat in float uWaist;
flat in float uDivision;
flat in float uMorph;
flat in float uShift;
flat in float uPlace;
flat in float uLateral;
flat in float uMembranePx;
flat in float uMembraneStyle;
flat in float uCapsuleThickness;
flat in float uSeed;
flat in float uAngle;
flat in vec3 uMembraneColor;
flat in float uPaletteIndex;
flat in vec4 uTaper;
flat in vec3 uPigment;
uniform float uPixel;
uniform vec3 uLightDir;
uniform float uLightIntensity;
uniform vec3 uPointLights[48];
uniform vec3 uPointColors[48];
uniform int uPointCount;
uniform vec4 uPalette0[5];
uniform vec4 uPalette1[5];
uniform vec3 uCapsuleColors[2];
uniform vec3 uStorageA0;
uniform vec3 uStorageB0;
uniform vec3 uStorageA1;
uniform vec3 uStorageB1;
uniform int uGranuleCount;
uniform vec4 uGranules[6];
out vec4 fragColor;

vec4 paletteBand(int band) {
  return uPaletteIndex < 0.5 ? uPalette0[band] : uPalette1[band];
}

vec3 capsuleColor() {
  return uPaletteIndex < 0.5 ? uCapsuleColors[0] : uCapsuleColors[1];
}

vec3 storageColor(float g) {
  return uPaletteIndex < 0.5 ? mix(uStorageA0, uStorageB0, g) : mix(uStorageA1, uStorageB1, g);
}

vec2 cellWorld() {
  return uCenter + vec2(uAxis.x * vLocal.x - uAxis.y * vLocal.y, uAxis.x * vLocal.y + uAxis.y * vLocal.x);
}

vec2 toAxis(vec2 p) {
  return uLateral > 0.5 ? vec2(p.y, -p.x) : p;
}

vec2 fromAxis(vec2 p) {
  return uLateral > 0.5 ? vec2(-p.y, p.x) : p;
}

vec2 centerlineNearestAxis(vec2 p) {
  if (uBend < 1.0e-3 || uHalfSegment < 1.0e-4) {
    return vec2(clamp(p.x, -uHalfSegment, uHalfSegment), 0.0);
  }
  float arcR = uHalfSegment / uBend;
  vec2 fromCenter = vec2(p.x, p.y + arcR);
  float ang = clamp(atan(fromCenter.x, fromCenter.y), -uBend, uBend);
  return vec2(arcR * sin(ang), arcR * (cos(ang) - 1.0));
}

float divisionAxial(vec2 p) {
  float c = cos(uDivision);
  float s = sin(uDivision);
  vec2 spun = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
  if (uBend < 1.0e-3 || uHalfSegment < 1.0e-4) return spun.x;
  float arcR = uHalfSegment / uBend;
  vec2 fromCenter = vec2(spun.x, spun.y + arcR);
  return arcR * atan(fromCenter.x, fromCenter.y);
}

vec2 divisionTangent(vec2 nearest) {
  if (uBend < 1.0e-3 || uHalfSegment < 1.0e-4) return vec2(cos(uDivision), sin(uDivision));
  float arcR = uHalfSegment / uBend;
  float ang = clamp(atan(nearest.x, nearest.y + arcR), -uBend, uBend);
  return vec2(cos(ang), -sin(ang));
}

float furrowNotch(float axial) {
  float waist = max(uWaist, 1.0e-4);
  return exp(-(axial * axial) / (waist * waist));
}

float radiusAt(float axial) {
  return uRadius * (1.0 - uFurrow * furrowNotch(axial));
}

float taperPinch(float degree, float coord) {
  float s = smoothstep(0.0, 1.0, clamp(coord, 0.0, 1.0));
  // degree 1 keeps 0.5 of the radius. Matches TAPER_PINCH in shape.ts.
  return 1.0 - 0.5 * clamp(degree, 0.0, 1.0) * s;
}

vec2 taperAxes(float along, float across, float halfSegment, float radius) {
  vec4 degree = uTaper;
  if (degree.x + degree.y + degree.z + degree.w < 1.0e-4) return vec2(1.0);
  float reach = max(halfSegment + radius, 1.0e-4);
  float axial = clamp(along / reach, -1.0, 1.0);
  float side = clamp(across / max(radius, 1.0e-4), -1.0, 1.0);
  float sx = taperPinch(degree.x, max(axial, 0.0)) * taperPinch(degree.y, max(-axial, 0.0));
  float sy = taperPinch(degree.z, max(side, 0.0)) * taperPinch(degree.w, max(-side, 0.0));
  return vec2(sx, sy);
}

vec2 taperFrame(vec2 axisP, float halfSegment, float bend) {
  float along;
  float across;
  if (bend < 1.0e-3 || halfSegment < 1.0e-4) {
    vec2 nearest = vec2(clamp(axisP.x, -halfSegment, halfSegment), 0.0);
    vec2 rel = axisP - nearest;
    along = nearest.x + rel.x;
    across = rel.y;
  } else {
    float arcR = halfSegment / bend;
    float ang = clamp(atan(axisP.x, axisP.y + arcR), -bend, bend);
    vec2 nearest = vec2(arcR * sin(ang), arcR * (cos(ang) - 1.0));
    vec2 rel = axisP - nearest;
    vec2 tangent = vec2(cos(ang), -sin(ang));
    vec2 outward = vec2(sin(ang), cos(ang));
    along = arcR * ang + dot(rel, tangent);
    across = dot(rel, outward);
  }
  return vec2(along, across);
}

float taperRadiusScale(vec2 axisP, float halfSegment, float radius, float bend) {
  vec2 frame = taperFrame(axisP, halfSegment, bend);
  vec2 axes = taperAxes(frame.x, frame.y, halfSegment, radius);
  return min(axes.x, axes.y);
}

float plainCapsule(vec2 p, float halfSegment, float radius, float bend, float lateral) {
  vec2 axisP = lateral > 0.5 ? vec2(p.y, -p.x) : p;
  vec2 nearest;
  if (bend < 1.0e-3 || halfSegment < 1.0e-4) {
    nearest = vec2(clamp(axisP.x, -halfSegment, halfSegment), 0.0);
  } else {
    float arcR = halfSegment / bend;
    vec2 fromCenter = vec2(axisP.x, axisP.y + arcR);
    float ang = clamp(atan(fromCenter.x, fromCenter.y), -bend, bend);
    nearest = vec2(arcR * sin(ang), arcR * (cos(ang) - 1.0));
  }
  return length(axisP - nearest) - radius * taperRadiusScale(axisP, halfSegment, radius, bend);
}

float capsuleDistance(vec2 p) {
  vec2 axisP = toAxis(p);
  vec2 nearest = centerlineNearestAxis(axisP);
  float base = radiusAt(divisionAxial(axisP));
  return length(axisP - nearest) - base * taperRadiusScale(axisP, uHalfSegment, uRadius, uBend);
}

float daughterDistance(vec2 p) {
  vec2 axis = vec2(cos(uPlace), sin(uPlace));
  float halfSegment = uHalfSegment * 0.5;
  float radius = uRadius * 0.5;
  float left = plainCapsule(p - axis * uShift, halfSegment, radius, uBend, uLateral);
  float right = plainCapsule(p + axis * uShift, halfSegment, radius, uBend, uLateral);
  return min(left, right);
}


float bodyDistance(vec2 p) {
  float parent = capsuleDistance(p);
  if (uMorph <= 0.0) return parent;
  return mix(parent, daughterDistance(p), uMorph);
}

vec3 surfaceNormal() {
  vec2 axisP = toAxis(vLocal);
  vec2 nearest = centerlineNearestAxis(axisP);
  float axial = divisionAxial(axisP);
  vec2 radial = (axisP - nearest) / max(radiusAt(axial), 1e-4);
  float nx = radial.x;
  float ny = radial.y;
  if (uFurrow > 1.0e-4) {
    float waist = max(uWaist, 1.0e-4);
    float dRadius = uRadius * uFurrow * furrowNotch(axial) * (2.0 * axial / (waist * waist));
    vec2 tilted = vec2(nx, ny) - divisionTangent(nearest) * dRadius;
    nx = tilted.x;
    ny = tilted.y;
  } else if (uBend < 1.0e-3) {
    float elongate = smoothstep(0.05, 0.65, uHalfSegment / max(uRadius, 1e-4));
    float capT = clamp((abs(axisP.x) - uHalfSegment) / max(uRadius, 1e-4), 0.0, 1.0);
    float cap = capT * capT * (3.0 - 2.0 * capT);
    float shade = clamp(axisP.x / max(uHalfSegment + uRadius, 1e-4), -1.0, 1.0) * 0.9;
    nx = mix(radial.x, mix(shade, radial.x, cap), elongate);
  }
  vec2 nxy = fromAxis(vec2(nx, ny));
  // The outline is not sampled here. Extra samples inline the whole capsule into
  // the linker until it exceeds the GPU timeout and the boot screen freezes.
  float mag2 = dot(nxy, nxy);
  if (mag2 > 1.0) nxy *= inversesqrt(mag2);
  float nz = sqrt(max(0.0, 1.0 - dot(nxy, nxy)));
  float c = cos(uAngle);
  float s = sin(uAngle);
  return vec3(c * nxy.x - s * nxy.y, s * nxy.x + c * nxy.y, nz);
}

vec3 pointReflect(vec3 n) {
  if (uPointCount <= 0) return vec3(0.0);
  vec2 world = cellWorld();
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 48; i++) {
    if (i >= uPointCount) break;
    vec2 toLight = uPointLights[i].xy - world;
    float dist = length(toLight);
    float t = clamp(1.0 - dist / uPointLights[i].z, 0.0, 1.0);
    float atten = pow(t, 1.35);
    vec3 L = normalize(vec3(toLight, 0.7));
    float diff = max(dot(n, L), 0.0);
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, H), 0.0), 18.0);
    glow += uPointColors[i] * atten * (diff * 0.72 + spec * 0.95);
  }
  return glow;
}

float straightStation(vec2 q, float H, float R) {
  if (q.x > H) {
    float travel = clamp(1.57079632679 - atan(q.y, q.x - H), 0.0, 3.14159265359);
    return 2.0 * H + travel * R;
  }
  if (q.x < -H) {
    vec2 v = vec2(q.x + H, q.y);
    float ccw = atan(-v.x, -v.y);
    if (ccw < 0.0) ccw += 6.28318530718;
    return 4.0 * H + 3.14159265359 * R + clamp(ccw, 0.0, 3.14159265359) * R;
  }
  if (q.y >= 0.0) return q.x + H;
  return 2.0 * H + 3.14159265359 * R + (H - q.x);
}

float capBulge(vec2 q, float a, float arcR) {
  vec2 center = vec2(arcR * sin(a), arcR * (cos(a) - 1.0));
  vec2 tangent = vec2(cos(a), -sin(a));
  float bulgeSign = a >= 0.0 ? 1.0 : -1.0;
  return dot(q - center, tangent) * bulgeSign;
}

float capTravel(vec2 q, float a, float arcR) {
  vec2 center = vec2(arcR * sin(a), arcR * (cos(a) - 1.0));
  vec2 outward = vec2(sin(a), cos(a));
  vec2 tangent = vec2(cos(a), -sin(a));
  float bulgeSign = a >= 0.0 ? 1.0 : -1.0;
  vec2 v = q - center;
  float capAng = atan(dot(v, tangent) * bulgeSign, dot(v, outward));
  if (capAng < 0.0) capAng += 6.28318530718;
  return clamp(capAng, 0.0, 3.14159265359);
}

float shapeStation(vec2 p, float H, float R) {
  vec2 q = toAxis(p);
  if (H < 1.0e-4) return (atan(q.y, q.x) + 3.14159265359) * max(R, 1.0e-4);
  if (uBend < 1.0e-3) return straightStation(q, H, R);
  float arcR = H / uBend;
  if (arcR <= R) {
    float around = atan(q.x, q.y + arcR);
    if (around < -uBend) around += 6.28318530718;
    return (around + uBend) * (arcR + R);
  }
  float ang = atan(q.x, q.y + arcR);
  float outerR = arcR + R;
  float innerR = max(arcR - R, 1.0e-3);
  float outerLen = 2.0 * uBend * outerR;
  float capLen = 3.14159265359 * R;
  float innerLen = 2.0 * uBend * innerR;
  float endA = ang >= 0.0 ? uBend : -uBend;
  if (capBulge(q, endA, arcR) > 1.0e-4) {
    float travel = capTravel(q, endA, arcR);
    if (endA >= 0.0) return outerLen + travel * R;
    return outerLen + capLen + innerLen + clamp(3.14159265359 - travel, 0.0, 3.14159265359) * R;
  }
  float a = clamp(ang, -uBend, uBend);
  if (length(vec2(q.x, q.y + arcR)) >= arcR) return (a + uBend) * outerR;
  return outerLen + capLen + (uBend - a) * innerR;
}

float contourStation(vec2 p) {
  if (uMorph > 0.5) {
    vec2 axis = vec2(cos(uPlace), sin(uPlace));
    vec2 leftP = p - axis * uShift;
    vec2 rightP = p + axis * uShift;
    float halfH = uHalfSegment * 0.5;
    float halfR = uRadius * 0.5;
    if (plainCapsule(leftP, halfH, halfR, uBend, uLateral) <= plainCapsule(rightP, halfH, halfR, uBend, uLateral)) {
      return shapeStation(leftP, halfH, halfR);
    }
    return shapeStation(rightP, halfH, halfR);
  }
  return shapeStation(p, uHalfSegment, uRadius);
}

float membraneColumn(vec2 p) {
  float shift = fract(sin(uSeed * 91.7) * 13.2) * 32.0;
  return floor(contourStation(p) / max(uPixel, 1.0e-6) + shift);
}

vec3 membraneTone(vec3 base, float lift) {
  float luma = dot(base, vec3(0.299, 0.587, 0.114));
  vec3 pale = mix(base, vec3(0.93, 0.91, 0.84), 0.9);
  vec3 deep = mix(base, vec3(0.05, 0.05, 0.06), 0.85);
  float t = clamp(abs(lift), 0.0, 1.0);
  if (luma > 0.65 && lift > 0.0) return mix(base, deep, t);
  if (lift >= 0.0) return mix(base, pale, t);
  return mix(base, deep, t);
}

float isoHash(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}

// Pixels off the smooth outline. Positive hairs stick out, a negative nick
// pulls that column one pixel in so the membrane itself steps.
float isoprenoidEdge(float column) {
  float c = floor(column);
  float h = isoHash(c);
  float prev = isoHash(c - 1.0);
  float next = isoHash(c + 1.0);
  if (h > 0.92 && h > prev && h > next) return 2.0;
  if (h > 0.58 || (prev > 0.80 && h > 0.42)) return 1.0;
  if (h < 0.16 && prev < 0.45 && next < 0.45) return -1.0;
  return 0.0;
}

bool isoSupport(vec2 p, float d, vec2 step, float pixel) {
  // Neighbor test stays on the capsule radius. The full outline, and the contour
  // walk inside membraneColumn, inline until the linker exceeds the GPU timeout.
  vec2 q = toAxis(p + step);
  vec2 nearest = centerlineNearestAxis(q);
  float nd = length(q - nearest) - radiusAt(divisionAxial(q));
  if (nd > d - pixel * 0.15) return false;
  return nd <= pixel;
}

vec3 diffuseRim(vec3 base, float row, bool lip, vec3 bodyN) {
  vec2 radial = bodyN.xy;
  float rlen = length(radial);
  radial = rlen > 1.0e-4 ? radial / rlen : vec2(0.0, 1.0);
  float outward = lip ? 1.0 : 1.0 - clamp(row / max(uMembranePx, 1.0), 0.0, 1.0);
  vec3 wn = normalize(vec3(radial * mix(0.5, 0.92, outward), mix(0.28, 0.45, outward)));
  float wrap = clamp(dot(wn, normalize(uLightDir)) * 0.55 + 0.45, 0.0, 1.0);
  float shade = smoothstep(0.2, 0.82, wrap);
  vec3 shadow = mix(base, vec3(0.0), 0.42);
  vec3 lit = mix(base, vec3(1.0), 0.26);
  vec3 tone = mix(shadow, lit, shade);
  float creaseRow = uMembranePx < 1.5 ? 0.5 : uMembranePx - 1.5;
  if (lip) tone = mix(tone, lit, 0.35);
  else if (row > creaseRow) tone = mix(tone, shadow, 0.4);
  // Sun shading fades with the water column. The unlit pigment stays the wall color,
  // only darkened, so the outline does not dissolve into the body's flat gray.
  float light = clamp(uLightIntensity, 0.0, 1.0);
  vec3 surface = mix(base * 0.28, tone, light);
  vec3 glow = pointReflect(wn);
  return surface * (vec3(1.0) + glow) + glow * 0.22;
}

// Darkest cytoplasm band, dimmed the same way the cell body is in deeper water.
vec3 interiorBaseColor(vec3 bounce) {
  vec3 base = paletteBand(0).rgb;
  vec3 unlit = vec3(0.22);
  vec3 surface = mix(unlit, base, clamp(uLightIntensity, 0.0, 1.0));
  return surface * (vec3(1.0) + bounce) + bounce * 0.22;
}

vec3 envelopeColor(vec2 p, float row, bool nub) {
  vec3 base = uMembraneColor;
  if (uMembraneStyle < 1.5 || nub || row < 1.0) return base;
  float column = membraneColumn(p);
  float h = isoHash(floor(column) + row * 13.0 + 4.0);
  if (h > 0.74) return membraneTone(base, 0.22);
  if (h < 0.08) return membraneTone(base, -0.24);
  return base;
}

void main() {
  float d = bodyDistance(vLocal);
  float pixel = max(uPixel, 1.0e-6);
  bool wall = uMembraneStyle > 0.5 && uMembraneStyle < 1.5;
  bool crystal = uMembraneStyle > 2.5;
  bool isoprenoid = uMembraneStyle > 1.5 && uMembraneStyle < 2.5;
  bool nub = false;
  bool lip = wall && uCapsuleThickness <= 0.0 && d > 0.0 && d <= pixel;
  float depth = -d / pixel;
  bool crease = wall && uMembranePx < 1.5 && d <= 0.0 && depth >= uMembranePx && depth < uMembranePx + 1.0;
  float edge = 0.0;
  bool nearRim = d <= pixel * 2.0 && d > -(uMembranePx + 1.5) * pixel;
  if (isoprenoid && uCapsuleThickness <= 0.0 && nearRim) edge = isoprenoidEdge(membraneColumn(vLocal));
  if (edge > 0.0 && d > 0.0 && d <= edge * pixel) {
    vec2 step = vec2(pixel, 0.0);
    nub = isoSupport(vLocal, d, step, pixel)
      || isoSupport(vLocal, d, -step, pixel)
      || isoSupport(vLocal, d, step.yx, pixel)
      || isoSupport(vLocal, d, -step.yx, pixel);
  }
  if (d > uCapsuleThickness && !nub && !lip) discard;

  vec3 n = surfaceNormal();
  vec3 bounce = pointReflect(n);

  if (uCapsuleThickness > 0.0 && d > 0.0) {
    float fade = 1.0 - d / uCapsuleThickness;
    fragColor = vec4(capsuleColor() + bounce, 0.4 * fade);
    return;
  }

  float bandStart = edge < 0.0 ? 1.0 : 0.0;
  float bandEnd = uMembranePx + bandStart;
  float row = (nub || lip) ? -1.0 : floor(depth + 1.0e-4);
  if (edge < 0.0) row -= 1.0;
  // One interior-colored pixel through the middle of the crystal wall.
  // Thickness grows inward, so this row moves with it and stays centered.
  bool crystalCore = crystal && d <= 0.0 && depth >= bandStart && depth < bandEnd
    && abs(row - floor(uMembranePx * 0.5)) < 0.5;
  if ((nub || lip || crease || (d <= 0.0 && depth >= bandStart && depth < bandEnd)) && !crystalCore) {
    vec3 pigment = uMembraneColor;
    // Default isoprenoid pigment tracks the cytoplasm base, a step darker so the
    // rough edge stays visible against the interior.
    bool interiorPigment = isoprenoid && length(pigment - paletteBand(0).rgb * ${ISOPRENOID_SHADE}) < 2.0e-3;
    vec3 ink = interiorPigment
      ? interiorBaseColor(bounce) * ${ISOPRENOID_SHADE}
      : (wall || crystal)
        ? diffuseRim(pigment, row, lip, n)
        : envelopeColor(vLocal, row, nub) + bounce * 0.4;
    fragColor = vec4(ink, 1.0);
    return;
  }

  // Spec section 8.1, with one correction for elongated capsules. On the straight
  // section the analytic normal has no lengthwise component, so a side light
  // used to slice the far cap off with a straight shadow. The axial term bends
  // that shadow around the end. A circle keeps the radial normal.
  float nz = n.z;
  vec3 lightDir = normalize(uLightDir);
  float lightValue = clamp(max(0.0, dot(n, lightDir)), 0.0, 0.999);
  int band = int(floor(lightValue * 5.0));
  vec3 color = paletteBand(band).rgb * uPigment;
  if (uGranuleCount > 0) {
    for (int i = 0; i < 6; i++) {
      if (i >= uGranuleCount) break;
      float gr = uGranules[i].z;
      if (gr <= 0.0) continue;
      float gd = length(vLocal - uGranules[i].xy) - gr;
      if (gd < 0.0) {
        float g = clamp(floor((0.3 + 0.7 * nz) * 3.0), 0.0, 2.0) / 2.0;
        color = storageColor(g);
      }
    }
  }
  vec3 unlit = vec3(0.22) * uPigment;
  vec3 surface = mix(unlit, color, uLightIntensity);
  fragColor = vec4(surface * (vec3(1.0) + bounce) + bounce * 0.22, 1.0);
}`;

/** Crystal outline, compiled only when a crystal cell is drawn.
 * It stays out of the main cell shader: folding the polygon into that shader
 * stalls the GPU compiler and freezes the tab and the IDE. */
const CRYSTAL_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
flat in float uHalfSegment;
flat in float uRadius;
flat in float uBend;
flat in float uFurrow;
flat in float uWaist;
flat in float uDivision;
flat in float uMorph;
flat in float uShift;
flat in float uPlace;
flat in float uLateral;
flat in float uMembranePx;
flat in float uCapsuleThickness;
flat in float uAngle;
flat in vec3 uMembraneColor;
flat in float uPaletteIndex;
flat in vec4 uTaper;
flat in vec3 uPigment;
uniform float uPixel;
uniform vec3 uLightDir;
uniform float uLightIntensity;
uniform vec4 uPalette0[5];
uniform vec4 uPalette1[5];
out vec4 fragColor;

const float CRYSTAL_FACET = 0.9;

vec2 warpPoint(float x, float y, float H, float bend) {
  if (bend < 1.0e-3 || H < 1.0e-4) return vec2(x, y);
  float arcR = H / bend;
  float along = clamp(x, -H, H);
  float overhang = x - along;
  float ang = along / arcR;
  vec2 center = vec2(arcR * sin(ang), arcR * (cos(ang) - 1.0));
  vec2 tangent = vec2(cos(ang), -sin(ang));
  vec2 outward = vec2(sin(ang), cos(ang));
  return center + tangent * overhang + outward * y;
}

float crystalChamfer(float H, float R) {
  float blunt = R * 0.57735026919;
  float sharp = R * 1.73205080757;
  if (H + R < sharp + R * 0.2) return blunt;
  return sharp;
}

float crystalPinch(float degree, float coord) {
  float s = smoothstep(0.0, 1.0, clamp(coord, 0.0, 1.0));
  return 1.0 - 0.5 * clamp(degree, 0.0, 1.0) * s;
}

vec2 taperCrystalPoint(float x, float y, float H, float R) {
  float reach = max(H + R, 1.0e-4);
  float axial = clamp(x / reach, -1.0, 1.0);
  float side = clamp(y / max(R, 1.0e-4), -1.0, 1.0);
  float sx = crystalPinch(uTaper.x, max(axial, 0.0)) * crystalPinch(uTaper.y, max(-axial, 0.0));
  float sy = crystalPinch(uTaper.z, max(side, 0.0)) * crystalPinch(uTaper.w, max(-side, 0.0));
  return vec2(x - sign(x) * (1.0 - sx) * R, y - sign(y) * (1.0 - sy) * R);
}

float crystalCapsule(vec2 axisP, float H, float R) {
  vec2 nearest;
  if (uBend < 1.0e-3 || H < 1.0e-4) {
    nearest = vec2(clamp(axisP.x, -H, H), 0.0);
  } else {
    float arcR = H / uBend;
    float ang = clamp(atan(axisP.x, axisP.y + arcR), -uBend, uBend);
    nearest = vec2(arcR * sin(ang), arcR * (cos(ang) - 1.0));
  }
  return length(axisP - nearest) - R;
}

// Writes stay in crystalDistance. Passing this array into a helper lets some GPU
// compilers drop the writes, the polygon collapses, and every fragment is
// discarded. Appendages still draw because they are placed from the CPU outline.
// && does not short-circuit, so the previous corner is read only when one exists.
#define PUSH_CRYSTAL(PX, PY) \
  if (n < 12) { \
    vec2 _tapered = taperCrystalPoint(PX, PY, H, R); \
    vec2 _point = warpPoint(_tapered.x, _tapered.y, H, uBend); \
    bool _duplicate = false; \
    if (n > 0) { \
      vec2 _prev = v[n - 1]; \
      _duplicate = dot(_point - _prev, _point - _prev) < 1.0e-10; \
    } \
    if (!_duplicate) { \
      v[n] = _point; \
      n += 1; \
    } \
  }

#define PUSH_FLANK(X0, X1, PY) \
  if (uBend >= 1.0e-3 && H >= 1.0e-4) { \
    float _arcR = H / uBend; \
    float _a0 = clamp(X0, -H, H) / _arcR; \
    float _a1 = clamp(X1, -H, H) / _arcR; \
    int _segments = int(ceil(abs(_a1 - _a0) / CRYSTAL_FACET)); \
    if (_segments > 3) _segments = 3; \
    for (int _i = 1; _i < 3; _i++) { \
      if (_i >= _segments) break; \
      float _angle = _a0 + (_a1 - _a0) * (float(_i) / float(_segments)); \
      PUSH_CRYSTAL(_arcR * _angle, PY) \
    } \
  }

float crystalDistance(vec2 p, float H, float radius, float furrow, out vec2 outward) {
  float R = max(radius, 1.0e-6);
  vec2 axisP = uLateral > 0.5 ? vec2(p.y, -p.x) : p;
  float pole = H + R;
  float sx = pole - crystalChamfer(H, R);
  bool facet = furrow <= 0.04;
  vec2 v[12];
  int n = 0;
  PUSH_CRYSTAL(pole, 0.0)
  PUSH_CRYSTAL(sx, R)
  if (facet) { PUSH_FLANK(sx, -sx, R) }
  PUSH_CRYSTAL(-sx, R)
  PUSH_CRYSTAL(-pole, 0.0)
  PUSH_CRYSTAL(-sx, -R)
  if (facet) { PUSH_FLANK(-sx, sx, -R) }
  PUSH_CRYSTAL(sx, -R)
  outward = vec2(0.0, 1.0);
  float span = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    span = max(span, dot(v[i], v[i]));
  }
  // A failed outline used to return a huge distance and discard the whole body.
  if (n < 3 || span < R * R * 0.04) return crystalCapsule(axisP, H, R);
  float s = 1.0;
  float d = dot(axisP - v[0], axisP - v[0]);
  for (int i = 0; i < 12; i++) {
    if (i >= n) break;
    int j = i + 1;
    if (j >= n) j = 0;
    vec2 edge = v[j] - v[i];
    float ee = dot(edge, edge);
    vec2 w = axisP - v[i];
    vec2 closest = w - edge * clamp(ee > 1.0e-12 ? dot(w, edge) / ee : 0.0, 0.0, 1.0);
    float dist2 = dot(closest, closest);
    if (dist2 < d) {
      d = dist2;
      outward = ee > 1.0e-12 ? vec2(edge.y, -edge.x) * inversesqrt(ee) : outward;
    }
    bvec3 cond = bvec3(axisP.y >= v[i].y, axisP.y < v[j].y, edge.x * w.y > edge.y * w.x);
    if (all(cond) || all(not(cond))) s = -s;
  }
  float signedD = s * sqrt(d);
  if (furrow > 0.04) {
    float c = cos(uDivision);
    float sn = sin(uDivision);
    float axial = c * axisP.x + sn * axisP.y;
    float notch = exp(-(axial * axial) / max(uWaist * uWaist, 1.0e-6));
    signedD += min(R * furrow * notch, 0.55 * R);
  }
  return signedD;
}

#undef PUSH_CRYSTAL
#undef PUSH_FLANK

void main() {
  vec2 nAxis = vec2(0.0, 1.0);
  float d = crystalDistance(vLocal, uHalfSegment, uRadius, uFurrow, nAxis);
  if (uMorph > 0.0) {
    vec2 axis = vec2(cos(uPlace), sin(uPlace));
    float halfH = uHalfSegment * 0.5;
    float halfR = uRadius * 0.5;
    vec2 ln = nAxis;
    vec2 rn = nAxis;
    float ld = crystalDistance(vLocal - axis * uShift, halfH, halfR, 0.0, ln);
    float rd = crystalDistance(vLocal + axis * uShift, halfH, halfR, 0.0, rn);
    if (min(ld, rd) < d) nAxis = ld < rd ? ln : rn;
    d = mix(d, min(ld, rd), uMorph);
  }
  if (d > uCapsuleThickness) discard;
  vec2 nxy = uLateral > 0.5 ? vec2(-nAxis.y, nAxis.x) : nAxis;
  float c = cos(uAngle);
  float s = sin(uAngle);
  // Each face keeps its own plane. A low camera-facing term leaves the corners
  // visible instead of washing the cut into a round highlight.
  vec3 n = normalize(vec3(c * nxy.x - s * nxy.y, s * nxy.x + c * nxy.y, 0.42));
  float ndotl = dot(n, normalize(uLightDir));
  float lightValue = clamp(ndotl * 0.92 + 0.06, 0.0, 0.999);
  float scaled = lightValue * 5.0;
  float band = floor(scaled);
  float soften = smoothstep(0.82, 0.98, scaled - band) * 0.2;
  int i0 = int(band);
  int i1 = int(min(band + 1.0, 4.0));
  vec3 lo = (uPaletteIndex < 0.5 ? uPalette0[i0] : uPalette1[i0]).rgb * uPigment;
  vec3 hi = (uPaletteIndex < 0.5 ? uPalette0[i1] : uPalette1[i1]).rgb * uPigment;
  vec3 color = mix(mix(lo, hi, soften), vec3(1.0), 0.10);
  float light = clamp(uLightIntensity, 0.0, 1.0);
  color = mix(vec3(0.30) * uPigment, color, light);
  float pixel = max(uPixel, 1.0e-6);
  if (d <= 0.0 && -d < uMembranePx * pixel) color = uMembraneColor * mix(0.22, 1.0, light);
  fragColor = vec4(color, 1.0);
}
`;

const LINE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aPosition;
uniform vec2 uHalfView;
uniform vec2 uCamera;
out float vAlpha;
void main() {
  gl_Position = vec4((aPosition.xy - uCamera) / uHalfView, aPosition.z, 1.0);
  vAlpha = aPosition.w;
}`;

const LINE_FS = `#version 300 es
precision highp float;
uniform vec3 uColor;
in float vAlpha;
out vec4 fragColor;
void main() {
  fragColor = vec4(uColor, vAlpha);
}`;

const GRID_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
void main() {
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

const GRID_FS = `#version 300 es
precision highp float;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform vec2 uSpan;
uniform float uCell;
uniform vec3 uColor;
out vec4 fragColor;
void main() {
  vec2 clip = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  vec2 world = uCamera + clip * uHalfView;
  vec2 local = world - uOrigin;
  vec2 pad = fwidth(local);
  if (local.x < -pad.x || local.y < -pad.y || local.x > uSpan.x + pad.x || local.y > uSpan.y + pad.y) discard;
  vec2 cell = local / uCell;
  vec2 edge = min(fract(cell), 1.0 - fract(cell));
  vec2 fw = fwidth(cell);
  if (min(edge.x / fw.x, edge.y / fw.y) > 0.5) discard;
  fragColor = vec4(uColor, 1.0);
}`;

const TEMPERATURE_FS = `#version 300 es
precision highp float;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform vec2 uGrid;
uniform float uCell;
uniform sampler2D uTemperature;
out vec4 fragColor;
vec3 temperatureColor(float celsius) {
  float t = clamp(celsius / 110.0, 0.0, 1.0);
  vec3 cold = vec3(0.12, 0.28, 0.86);
  vec3 cool = vec3(0.12, 0.66, 0.78);
  vec3 warm = vec3(0.95, 0.58, 0.12);
  vec3 hot = vec3(0.90, 0.14, 0.07);
  if (t < 0.28) return mix(cold, cool, t / 0.28);
  if (t < 0.55) return mix(cool, warm, (t - 0.28) / 0.27);
  return mix(warm, hot, (t - 0.55) / 0.45);
}
void main() {
  vec2 clip = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  vec2 world = uCamera + clip * uHalfView;
  vec2 cell = (world - uOrigin) / uCell;
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) discard;
  vec2 uv = (floor(cell) + 0.5) / uGrid;
  float celsius = texture(uTemperature, uv).r * 130.0;
  fragColor = vec4(temperatureColor(celsius), 0.48);
}`;

const CONCENTRATION_FS = `#version 300 es
precision highp float;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform vec2 uGrid;
uniform float uCell;
uniform sampler2D uField;
uniform vec3 uTint;
out vec4 fragColor;
void main() {
  vec2 clip = gl_FragCoord.xy / uResolution * 2.0 - 1.0;
  vec2 world = uCamera + clip * uHalfView;
  vec2 cell = (world - uOrigin) / uCell;
  if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) discard;
  vec2 uv = (floor(cell) + 0.5) / uGrid;
  float amount = clamp(texture(uField, uv).r, 0.0, 1.0);
  vec3 empty = vec3(0.04, 0.07, 0.09);
  fragColor = vec4(mix(empty, uTint, amount), 0.5);
}`;

export type FieldOverlay = "temperature" | "oxidex" | "sulfex" | "pressure";

const PRESENT_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
out vec2 vUv;
void main() {
  vUv = aCorner * 0.5 + 0.5;
  gl_Position = vec4(aCorner, 0.0, 1.0);
}`;

const PRESENT_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uWorld;
uniform vec2 uCamera;
uniform vec2 uHalfView;
uniform float uTime;
uniform vec3 uHeat[48];
uniform int uHeatCount;
out vec4 fragColor;

vec4 texelAt(ivec2 p, ivec2 size) {
  return texelFetch(uWorld, clamp(p, ivec2(0), size - 1), 0);
}

vec4 sampleWorld(vec2 uv) {
  ivec2 size = textureSize(uWorld, 0);
  vec2 coord = clamp(uv, 0.0, 1.0) * vec2(size) - 0.5;
  vec2 blend = fract(coord);
  ivec2 base = ivec2(floor(coord));
  vec4 a = texelAt(base, size);
  vec4 b = texelAt(base + ivec2(1, 0), size);
  vec4 c = texelAt(base + ivec2(0, 1), size);
  vec4 d = texelAt(base + ivec2(1, 1), size);
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

float heatMask(vec2 world, vec3 source) {
  float scale = max(source.z, 0.05);
  float below = 0.4 * scale;
  float reach = 3.8 * scale;
  vec2 delta = world - source.xy;
  if (delta.y < -below || delta.y > reach) return 0.0;
  float along = clamp((delta.y + below) / (reach + below), 0.0, 1.0);
  float halfWidth = mix(0.62, 1.35, along) * scale;
  float across = delta.x / halfWidth;
  float body = exp(-across * across * 1.55);
  float vertical = smoothstep(-below, 0.05 * scale, delta.y) * (1.0 - smoothstep(reach * 0.684, reach, delta.y));
  return body * vertical;
}

void main() {
  ivec2 size = textureSize(uWorld, 0);
  ivec2 texel = clamp(ivec2(vUv * vec2(size)), ivec2(0), size - 1);
  vec4 sharp = texelAt(texel, size);
  if (uHeatCount == 0) {
    fragColor = vec4(sharp.rgb, 1.0);
    return;
  }

  vec2 world = uCamera + (vUv * 2.0 - 1.0) * uHalfView;
  float heat = 0.0;
  vec2 shift = vec2(0.0);
  for (int i = 0; i < 48; i++) {
    if (i >= uHeatCount) break;
    float mask = heatMask(world, uHeat[i]);
    if (mask <= 0.0) continue;
    heat = max(heat, mask);
    float phase = fract(sin(dot(uHeat[i].xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831853;
    float rise = world.y - uHeat[i].y;
    float primary = sin(rise * 8.0 - uTime * 5.2 + phase);
    float secondary = sin(rise * 15.0 - uTime * 7.6 + phase * 1.7);
    shift += vec2(primary * 0.65 + secondary * 0.35, secondary * 0.28) * mask;
  }
  if (heat < 0.02) {
    fragColor = vec4(sharp.rgb, 1.0);
    return;
  }

  shift = clamp(shift, vec2(-1.0), vec2(1.0)) * 0.055;
  vec2 uv = vUv + shift / (uHalfView * 2.0);
  vec2 pixel = 1.0 / vec2(size);
  vec4 center = sampleWorld(uv);
  vec4 blur = (
    center * 2.0 +
    sampleWorld(uv + vec2(pixel.x, 0.0)) +
    sampleWorld(uv - vec2(pixel.x, 0.0)) +
    sampleWorld(uv + vec2(0.0, pixel.y)) +
    sampleWorld(uv - vec2(0.0, pixel.y))
  ) / 6.0;
  fragColor = vec4(mix(sharp.rgb, blur.rgb, smoothstep(0.0, 0.45, heat)), 1.0);
}`;

export class CellRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly bodyProgram: WebGLProgram;
  private crystalProgram: WebGLProgram | null = null;
  private readonly lineProgram: WebGLProgram;
  private readonly gridProgram: WebGLProgram;
  private readonly temperatureProgram: WebGLProgram;
  private readonly concentrationProgram: WebGLProgram;
  private readonly presentProgram: WebGLProgram;
  private readonly background: BackgroundPass;
  private readonly nutrients: NutrientField;
  private readonly terrain: Terrain;
  private readonly bubbles: BubbleField;
  private readonly decorations: DecorationField;
  private readonly quad: WebGLBuffer;
  private readonly ribbon: WebGLBuffer;
  private ribbonData = new Float32Array(65536);
  private ribbonCursor = 0;
  private ribbonTransparent = false;
  private ribbonColor: number[] | null = null;
  private ribbonHalfView: [number, number] = [1, 1];
  private ribbonCamera: [number, number] = [0, 0];
  private instanceData = new Float32Array(BODY_FLOATS * 64);
  private instanceCapacity = 64;
  private readonly instanceBuffer: WebGLBuffer;
  private readonly worldTarget: WebGLTexture;
  private readonly worldFbo: WebGLFramebuffer;
  private readonly worldDepth: WebGLRenderbuffer;
  private readonly temperatureTexture: WebGLTexture;
  private readonly temperatureBytes = new Uint8Array(TEXEL_COLUMNS * TEXEL_ROWS * 4);
  private readonly particleTemperatureTexture: WebGLTexture;
  private readonly particleTemperature = new Float32Array(TEXEL_COLUMNS * TEXEL_ROWS);
  private readonly particleTemperatureBytes = new Uint8Array(TEXEL_COLUMNS * TEXEL_ROWS * 4);
  private particleTemperatureReady = false;
  private readonly temperatureField = new TemperatureField();
  private readonly oxidexTexture: WebGLTexture;
  private readonly oxidexBytes = new Uint8Array(TEXEL_COLUMNS * TEXEL_ROWS * 4);
  private readonly oxidexField = new OxidexField();
  private readonly sulfexTexture: WebGLTexture;
  private readonly sulfexBytes = new Uint8Array(TEXEL_COLUMNS * TEXEL_ROWS * 4);
  private readonly sulfexField = new SulfexField();
  private readonly pressureTexture: WebGLTexture;
  private readonly pressureBytes = new Uint8Array(TEXEL_COLUMNS * TEXEL_ROWS * 4);
  private readonly pressureField = new PressureField();
  private readonly labels: HTMLCanvasElement;
  private readonly labelContext: CanvasRenderingContext2D;
  private readonly phases = new Map<number, number>();
  private readonly filamentBlends = new Map<
    number,
    { blend: number; chain: RibbonPoint[]; chainPhase: number; flail?: RibbonPoint[] }
  >();
  private width = 1;
  private height = 1;
  private logicalWidth = LOGICAL_WIDTH;
  private logicalHeight = LOGICAL_HEIGHT;
  private camera: [number, number] | null = null;
  private zoom = ZOOM_MIN;
  private zoomFloor = ZOOM_MIN;
  private frame: { halfView: [number, number]; camera: [number, number] } | null = null;
  private stroke: Array<() => boolean> = [];
  private paintHistory: Array<Array<() => boolean>> = [];
  private borderPlanted = false;
  private heatTime = 0;
  private texelGrid = false;
  private fieldOverlay: FieldOverlay | null = null;
  private sunBrightness = 1;
  private temperatureRevision = -1;
  private oxidexRevision = -1;
  private sulfexRevision = -1;
  private pressureRevision = -1;
  private membranePx = 1;
  private membraneStyle = 0;
  private membraneColor: [number, number, number] = [0, 0, 0];

  constructor(private readonly canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is required");
    this.gl = gl;
    this.bodyProgram = link(gl, BODY_VS, BODY_FS);
    this.lineProgram = link(gl, LINE_VS, LINE_FS);
    this.gridProgram = link(gl, GRID_VS, GRID_FS);
    this.temperatureProgram = link(gl, GRID_VS, TEMPERATURE_FS);
    this.concentrationProgram = link(gl, GRID_VS, CONCENTRATION_FS);
    this.presentProgram = link(gl, PRESENT_VS, PRESENT_FS);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]),
      gl.STATIC_DRAW,
    );
    this.background = new BackgroundPass(gl, (program) => this.drawQuad(program));
    this.nutrients = new NutrientField(gl);
    this.terrain = new Terrain(gl);
    this.bubbles = new BubbleField(gl);
    this.decorations = new DecorationField(gl);
    this.ribbon = gl.createBuffer()!;
    this.instanceBuffer = gl.createBuffer()!;
    this.worldDepth = gl.createRenderbuffer()!;
    this.worldTarget = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.worldTarget);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.worldFbo = gl.createFramebuffer()!;
    this.allocateWorldTarget();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.worldFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.worldTarget, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.worldDepth);
    gl.clearDepth(1);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error("world framebuffer is incomplete");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.temperatureTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.temperatureTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      TEXEL_COLUMNS,
      TEXEL_ROWS,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.temperatureBytes,
    );
    this.particleTemperatureTexture = this.makeGridTexture(this.particleTemperatureBytes);
    this.oxidexTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.oxidexTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      TEXEL_COLUMNS,
      TEXEL_ROWS,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.oxidexBytes,
    );
    this.sulfexTexture = this.makeGridTexture(this.sulfexBytes);
    this.pressureTexture = this.makeGridTexture(this.pressureBytes);
    const labels = document.createElement("canvas");
    labels.id = "temperature-labels";
    document.body.appendChild(labels);
    const labelContext = labels.getContext("2d", { alpha: true });
    if (!labelContext) throw new Error("could not create temperature labels");
    this.labels = labels;
    this.labelContext = labelContext;
  }

  setTexelGrid(enabled: boolean): void {
    this.texelGrid = enabled;
  }

  setFieldOverlay(overlay: FieldOverlay | null): void {
    this.fieldOverlay = overlay;
    this.labels.classList.toggle("on", overlay !== null);
    if (!overlay) this.labelContext.clearRect(0, 0, this.labels.width, this.labels.height);
  }

  setSunBrightness(brightness: number): void {
    this.sunBrightness = brightness;
  }

  setCellScale(scale: number): void {
    // 0.5× → 0.5, 1× → 1, 3× → 2.
    this.zoomFloor = scale <= 1 ? scale : 0.5 * scale + 0.5;
    this.zoom = Math.min(ZOOM_MAX, Math.max(this.zoomFloor, this.zoom));
  }

  setMembrane(pixels: number, style: number, color: [number, number, number]): void {
    const nextStyle = Math.min(3, Math.max(0, Math.round(style)));
    const cap = nextStyle === 0 ? 1 : 6;
    this.membranePx = Math.min(cap, Math.max(1, Math.round(pixels)));
    this.membraneStyle = nextStyle;
    this.membraneColor = color;
  }

  zoomLevel(): number {
    return this.zoom;
  }

  /** Half the visible world, in the same units `render` uses for the camera. */
  viewExtent(pixelsPerUnit: number): [number, number] {
    const pixels = Math.max(pixelsPerUnit, 1);
    return [
      (this.logicalWidth / pixels) * 0.5 * this.zoom,
      (this.logicalHeight / pixels) * 0.5 * this.zoom,
    ];
  }

  /** Drops the camera on a point instead of easing toward it. */
  placeCamera(x: number, y: number): void {
    this.camera = [x, y];
  }

  zoomBy(deltaY: number, deltaMode: number): void {
    let delta = deltaY;
    if (deltaMode === 1) delta *= 16;
    else if (deltaMode === 2) delta *= 400;
    const next = this.zoom * Math.exp(delta * 0.0032);
    this.zoom = Math.min(ZOOM_MAX, Math.max(this.zoomFloor, next));
  }

  private allocateWorldTarget(): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.worldTarget);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      this.logicalWidth,
      this.logicalHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.worldDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, this.logicalWidth, this.logicalHeight);
  }

  resize(): void {
    const cssWidth = Math.max(1, document.documentElement.clientWidth);
    const cssHeight = Math.max(1, document.documentElement.clientHeight);
    const fit = Math.min(cssWidth / LOGICAL_WIDTH, cssHeight / LOGICAL_HEIGHT);
    const scale = fit >= 1 ? Math.floor(fit) : fit;
    const maxTexture = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
    const logicalWidth = Math.max(1, Math.min(maxTexture, Math.round(cssWidth / scale)));
    const logicalHeight = Math.max(1, Math.min(maxTexture, Math.round(cssHeight / scale)));
    this.width = cssWidth;
    this.height = cssHeight;
    this.canvas.width = cssWidth;
    this.canvas.height = cssHeight;
    if (logicalWidth === this.logicalWidth && logicalHeight === this.logicalHeight) return;
    this.logicalWidth = logicalWidth;
    this.logicalHeight = logicalHeight;
    this.allocateWorldTarget();
  }

  render(
    view: ViewSnapshot,
    cells: CellSnapshot[],
    dt: number,
    light: [number, number, number],
    intensity: number,
    camera: [number, number],
  ): void {
    const gl = this.gl;
    const ordered = [...cells].sort((a, b) => a.y - b.y || a.id - b.id);
    const pixelsPerUnit = view.pixels_per_unit;
    const halfView: [number, number] = [
      (this.logicalWidth / pixelsPerUnit) * 0.5 * this.zoom,
      (this.logicalHeight / pixelsPerUnit) * 0.5 * this.zoom,
    ];
    // Framebuffer pixels, so a thickness of N stays N pixels as the view zooms.
    const pixelWorld = (halfView[0] * 2) / Math.max(this.logicalWidth, 1);
    const filamentHalf = 0.5 / view.pixels_per_unit;
    const pixel = view.pixels_per_unit;
    const followed = this.followCamera(camera, dt);
    const snapped: [number, number] = [
      Math.round(followed[0] * pixel) / pixel,
      Math.round(followed[1] * pixel) / pixel,
    ];
    this.frame = { halfView, camera: snapped };
    this.plantInnerBorder();
    this.temperatureField.advance(dt, this.sunBrightness, this.terrain.ventCenters(), this.terrain.rockTexels());
    this.oxidexField.advance(dt);
    this.sulfexField.advance(dt);
    this.syncTemperatureTexture();
    this.syncParticleTemperature(dt);
    this.syncOxidexTexture();
    this.syncSulfexTexture();
    this.syncPressureTexture();

    const viewBounds = {
      minX: snapped[0] - halfView[0],
      maxX: snapped[0] + halfView[0],
      minY: snapped[1] - halfView[1],
      maxY: snapped[1] + halfView[1],
    };
    const lights = this.terrain.packPointLights(viewBounds);
    this.appendFluorLights(lights, ordered, viewBounds);
    const deposits = this.terrain.depositFaces();
    this.nutrients.advance(dt, deposits.generation, deposits.faces, (x, y) => this.terrain.solidAt(x, y));
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.worldFbo);
    gl.viewport(0, 0, this.logicalWidth, this.logicalHeight);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const drawnPixelsPerUnit = this.logicalWidth / (halfView[0] * 2);
    this.background.drawBehind(
      halfView,
      snapped,
      view.pixels_per_unit,
      intensity,
      this.sunBrightness,
      dt,
      lights,
      this.particleTemperatureTexture,
      this.oxidexTexture,
      this.sulfexTexture,
      this.nutrients.texture,
      this.terrain.shoreFieldData(),
    );
    this.decorations.draw("back", halfView, snapped, intensity, lights, drawnPixelsPerUnit);
    this.decorations.draw("mid", halfView, snapped, intensity, lights, drawnPixelsPerUnit);
    this.terrain.draw(halfView, snapped, intensity, lights);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    for (const cell of ordered) {
      this.appendFlagella(cell, halfView, snapped, filamentHalf, dt);
      this.appendPili(cell, halfView, snapped, filamentHalf);
    }
    this.flushRibbon();
    this.drawBodies(ordered, halfView, snapped, pixelWorld, light, intensity, lights);
    gl.disable(gl.DEPTH_TEST);

    this.bubbles.sync(this.terrain.bubblePoints());
    this.bubbles.update(dt);
    this.bubbles.draw(halfView, snapped);
    this.decorations.draw("fore", halfView, snapped, intensity, lights, drawnPixelsPerUnit);
    this.background.drawInFront(this.zoom);
    if (this.fieldOverlay === "temperature") this.drawTemperature(halfView, snapped);
    else if (this.fieldOverlay) this.drawConcentration(halfView, snapped, this.fieldOverlay);
    if (this.texelGrid) this.drawTexelGrid(halfView, snapped);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.disable(gl.BLEND);
    gl.useProgram(this.presentProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.worldTarget);
    this.heatTime = (this.heatTime + Math.min(dt, 0.05)) % 1000;
    const heat = this.terrain.packHeat();
    gl.uniform1i(uniform(gl, this.presentProgram, "uWorld"), 0);
    gl.uniform2f(uniform(gl, this.presentProgram, "uCamera"), snapped[0], snapped[1]);
    gl.uniform2f(uniform(gl, this.presentProgram, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform1f(uniform(gl, this.presentProgram, "uTime"), this.heatTime);
    gl.uniform1i(uniform(gl, this.presentProgram, "uHeatCount"), heat.count);
    gl.uniform3fv(uniform(gl, this.presentProgram, "uHeat"), heat.data);
    this.drawQuad(this.presentProgram);
    const screenPixel = Math.min(
      (halfView[0] * 2) / Math.max(this.width, 1),
      (halfView[1] * 2) / Math.max(this.height, 1),
    );
    const ciliumHalf = Math.min(filamentHalf, screenPixel * 0.5);
    for (const cell of ordered) this.appendCilia(cell, halfView, snapped, ciliumHalf, dt);
    this.flushRibbon();
    this.drawTemperatureLabels(halfView, snapped);
  }

  /** Along-wall motion kept while a body touches terrain. 1 is frictionless. */
  setTerrainSlide(keep: number): void {
    this.terrain.setSlideKeep(keep);
  }

  /** Unit direction toward solid terrain within adhesin reach, or null. */
  stickDirection(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
  ): { x: number; y: number } | null {
    return this.terrain.stickDirection(x, y, angle, length, width, bend);
  }

  fitPose(
    previous: Pose,
    next: Pose,
    width: number,
    bend = 0,
    probes: ReadonlyArray<[number, number]> = [],
  ): Pose {
    return this.terrain.fitPose(previous, next, width, bend, probes);
  }

  bodyContact(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
    probes: ReadonlyArray<[number, number]> = [],
  ): { x: number; y: number } | null {
    return this.terrain.bodyContact(x, y, angle, length, width, bend, probes);
  }

  /** True when this pose is inside solid terrain. */
  poseOverlaps(
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    bend = 0,
    probes: ReadonlyArray<[number, number]> = [],
  ): boolean {
    return this.terrain.poseOverlaps(x, y, angle, length, width, bend, probes);
  }

  inspectFeatures(): TerrainFeature[] {
    return this.terrain.features();
  }

  worldAt(clientX: number, clientY: number): [number, number] | null {
    if (!this.frame) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - ((clientY - rect.top) / rect.height) * 2;
    return [this.frame.camera[0] + nx * this.frame.halfView[0], this.frame.camera[1] + ny * this.frame.halfView[1]];
  }

  clientAt(worldX: number, worldY: number): [number, number] | null {
    if (!this.frame) return null;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const nx = (worldX - this.frame.camera[0]) / this.frame.halfView[0];
    const ny = (worldY - this.frame.camera[1]) / this.frame.halfView[1];
    return [
      rect.left + (nx * 0.5 + 0.5) * rect.width,
      rect.top + (0.5 - ny * 0.5) * rect.height,
    ];
  }

  paintTerrain(x: number, y: number): void {
    this.notePaint(this.terrain.paintAt(x, y));
  }

  paintVent(x: number, y: number): void {
    this.notePaint(this.terrain.ventAt(x, y));
  }

  paintDeposit(x: number, y: number, resource: string, facing: string): void {
    this.notePaint(this.terrain.depositAt(x, y, resource, facing));
  }

  placeLight(x: number, y: number): void {
    this.notePaint(this.terrain.placeLight(x, y));
  }

  placeBubble(x: number, y: number): void {
    this.notePaint(this.terrain.placeBubble(x, y));
  }

  placeHeat(x: number, y: number, size: number): void {
    this.notePaint(this.terrain.placeHeat(x, y, size));
  }

  paintDecoration(x: number, y: number, layer: DecorationLayer, name: string): boolean {
    if (!this.frame) return false;
    const revert = this.decorations.place(x, y, layer, name);
    this.notePaint(revert);
    return revert !== null;
  }

  undoPaint(): void {
    const stroke = this.stroke.length > 0 ? this.stroke : this.paintHistory.pop();
    this.stroke = [];
    if (!stroke || stroke.length === 0) return;
    let refresh = false;
    for (let i = stroke.length - 1; i >= 0; i -= 1) {
      if (stroke[i]()) refresh = true;
    }
    if (refresh) this.terrain.refreshIndex();
    this.terrain.endStroke();
    this.decorations.endStroke();
  }

  decorationTypes(): DecorationType[] {
    return this.decorations.types();
  }

  worldReady(): boolean {
    return this.terrain.isReady() && this.decorations.settled();
  }

  eraseTerrain(x: number, y: number): void {
    if (this.frame) this.decorations.erase(x, y, this.frame.camera);
    this.terrain.eraseAt(x, y);
  }

  endTerrainStroke(): void {
    if (this.stroke.length > 0) {
      this.paintHistory.push(this.stroke);
      if (this.paintHistory.length > 80) this.paintHistory.shift();
      this.stroke = [];
    }
    this.terrain.endStroke();
    this.decorations.endStroke();
  }

  private plantInnerBorder(): void {
    if (this.borderPlanted || !this.terrain.isReady() || !this.decorations.isReady()) return;
    this.borderPlanted = true;
    const hits = (x: number, y: number): boolean => this.terrain.solidAt(x, y);
    const added = this.decorations.plantInnerBorder(hits) + this.decorations.plantFarRocks(hits);
    if (added > 0 || this.decorations.consumeAnchorMigration()) void this.saveTerrain();
  }

  private notePaint(revert: (() => boolean) | null): void {
    if (revert) this.stroke.push(revert);
  }

  saveTerrain(): Promise<"saved" | "loading" | "failed"> {
    return this.terrain.saveEdits(this.decorations.exportStamps());
  }

  private followCamera(target: [number, number], dt: number): [number, number] {
    if (!this.camera) {
      this.camera = [target[0], target[1]];
      return this.camera;
    }
    const blend = 1 - Math.exp(-dt * 18);
    this.camera[0] += (target[0] - this.camera[0]) * blend;
    this.camera[1] += (target[1] - this.camera[1]) * blend;
    return this.camera;
  }

  private appendFlagella(
    cell: CellSnapshot,
    halfView: [number, number],
    camera: [number, number],
    halfWidth: number,
    dt: number,
  ): void {
    if (cell.flagella.length === 0) return;
    const cos = Math.cos(cell.angle);
    const sin = Math.sin(cell.angle);
    const bend = cell.bend ?? 0;
    const whipping = cell.motor !== "idle" && cell.activity > 0.01;
    const whipFrequency = whipping ? (cell.motor === "tumble" ? 3.5 : 12) * cell.activity : 0;
    const visible = this.cellOnScreen(cell, halfView, camera);
    const color = FLAGELLUM_COLORS[cell.palette] ?? FLAGELLUM_COLORS[0];
    const depth = this.flagellumDepth(cell.y);
    for (const filament of cell.flagella) {
      const drift = (filament.id % 50) * 1.7 + (filament.pole < 0 ? 0 : 2.4);
      const phase = this.advancePhase(filament.id, whipFrequency, dt) + drift;
      const anchor = flagellumSiteAnchor(cell.length, cell.width, bend, filament.site, filament.mount);
      const crystal = (cell.membraneStyle ?? this.membraneStyle) === 3;
      const taper = cell.taper ?? 0;
      let rootX = anchor.x;
      let rootY = anchor.y;
      let dirX = anchor.dirX;
      let dirY = anchor.dirY;
      if (crystal || taperEffective(taper) !== 0) {
        const shell: BodyShape = {
          length: cell.length,
          width: cell.width,
          bend,
          furrow: cell.furrow ?? 0,
          furrowAxis: cell.furrowAxis ?? 0,
          morph: cell.morph ?? 0,
          divisionShift: cell.divisionShift ?? 0,
          divisionPlace: cell.divisionPlace ?? 0,
          capsule: cell.capsule,
          crystal,
          taper,
        };
        const planted = projectToMembrane(anchor.x, anchor.y, shell);
        const normal = bodyNormal(planted[0], planted[1], shell);
        rootX = planted[0];
        rootY = planted[1];
        dirX = normal[0];
        dirY = normal[1];
      }
      const worldRoot = toWorld(rootX, rootY, cell.x, cell.y, cos, sin);
      const worldDir = toWorld(dirX, dirY, 0, 0, cos, sin);
      const length = Math.max(0, filament.length * filament.assembly);
      if (length < 1e-3) continue;
      const amplitude = length * 0.2;
      const pose = this.filamentBlends.get(filament.id);
      const chainPhase = (pose?.chainPhase ?? drift) + 1.2 * dt;
      const chain = stepLazyChain(
        pose?.chain,
        worldRoot[0],
        worldRoot[1],
        worldDir[0],
        worldDir[1],
        length,
        FLAGELLUM_SEGMENTS,
        dt,
        chainPhase,
      );
      let flail = pose?.flail;
      let whip = chain;
      let whipCount = chain.length;
      if (cell.motor === "tumble") {
        if (!flail || flail === chain || flail.length !== FLAGELLUM_SEGMENTS + 1) {
          flail = chain.map((point) => ({ x: point.x, y: point.y }));
        }
        flail = stepFlail(
          flail,
          worldRoot[0],
          worldRoot[1],
          worldDir[0],
          worldDir[1],
          length,
          FLAGELLUM_SEGMENTS,
          dt,
          phase,
        );
        whip = flail;
        whipCount = flail.length;
      } else {
        flail = undefined;
      }
      const target = whipping ? 1 : 0;
      const blend = pose ? moveToward(pose.blend, target, dt / FLAGELLUM_BLEND_SECONDS) : target;
      this.filamentBlends.set(filament.id, { blend, chain, chainPhase, flail });
      if (!visible) continue;
      if (cell.motor !== "tumble" && blend > 0) {
        whipCount = fillWhip(
          whipScratch,
          worldRoot[0],
          worldRoot[1],
          worldDir[0],
          worldDir[1],
          length,
          amplitude,
          phase,
          cell.vx,
          cell.vy,
          FLAGELLUM_SEGMENTS,
        );
        whip = whipScratch;
      }
      let line = chain;
      let count = chain.length;
      if (blend >= 1) {
        line = whip;
        count = whipCount;
      } else if (blend > 0) {
        count = fillMix(chain, chain.length, whip, whipCount, blend, mixScratch);
        line = mixScratch;
      }
      this.queueRibbon(line, count, halfWidth, depth, 1, color, halfView, camera);
    }
  }

  /** Straight needles on the membrane. Same ribbon as a flagellum, with no wave. */
  private appendPili(
    cell: CellSnapshot,
    halfView: [number, number],
    camera: [number, number],
    halfWidth: number,
  ): void {
    const pili = cell.pili;
    const cover = Math.min(1, Math.max(0, cell.piliCover ?? 1));
    if (!pili || pili.length === 0 || cover <= 0.01 || !this.cellOnScreen(cell, halfView, camera)) return;
    const cos = Math.cos(cell.angle);
    const sin = Math.sin(cell.angle);
    const color = FLAGELLUM_COLORS[cell.palette] ?? FLAGELLUM_COLORS[0];
    const bodyDepth = this.cellDepth(cell.y);
    for (const pilus of pili) {
      if (pilus.length < 1e-3) continue;
      const root = toWorld(pilus.x, pilus.y, cell.x, cell.y, cos, sin);
      const dir = toWorld(pilus.dirX, pilus.dirY, 0, 0, cos, sin);
      whipScratch[0].x = root[0];
      whipScratch[0].y = root[1];
      whipScratch[1].x = root[0] + dir[0] * pilus.length;
      whipScratch[1].y = root[1] + dir[1] * pilus.length;
      const depth = pilus.layer > 0 ? Math.max(-0.985, bodyDepth - 1.5e-4) : Math.min(0.985, bodyDepth + 1.5e-4);
      this.queueRibbon(whipScratch, 2, halfWidth, depth, cover, color, halfView, camera);
    }
  }

  /**
   * Hairs on the outline. A quick straight stroke and a slower curled return.
   * Order blends a private phase into a wave that runs from one long-axis pole
   * to the other. Reversal flips that wave and the power stroke. The switch names
   * which half keeps the resting stroke; the opposite half mirrors it. Drawn after the pixel-art frame so each stroke stays one
   * screen pixel wide.
   */
  private appendCilia(
    cell: CellSnapshot,
    halfView: [number, number],
    camera: [number, number],
    halfWidth: number,
    dt: number,
  ): void {
    const cover = Math.min(1, Math.max(0, cell.ciliaCover ?? 1));
    if (cell.cilia.length === 0 || cover <= 0.01) return;
    const speed = Math.min(2, Math.max(0, cell.ciliaSpeed));
    const beat = this.advancePhase(-cell.id, speed * 3.4 * Math.PI * 2, dt);
    if (!this.cellOnScreen(cell, halfView, camera)) return;
    const cos = Math.cos(cell.angle);
    const sin = Math.sin(cell.angle);
    const bend = cell.bend ?? 0;
    const sway = Math.min(1, Math.max(0, cell.ciliaSway));
    const order = Math.min(1, Math.max(0, cell.ciliaOrder));
    const sense = cell.ciliaReverse ? -1 : 1;
    const color = CILIUM_COLORS[cell.palette] ?? CILIUM_COLORS[0];
    for (const cilium of cell.cilia) {
      if (cilium.length < 1e-3) continue;
      const along = (longAxisT(cilium.x, cilium.y, cell.length, cell.width, bend) + 1) * 0.5;
      const ordered = along * Math.PI * 2;
      const random = ciliumRandomPhase(cilium.x, cilium.y);
      const phase = beat - sense * (random * (1 - order) + ordered * order);
      const stroke = ciliaStrokeSign(cilium.x, cilium.y, cell.length, cell.width, bend, cell.ciliaSwitch);
      const root = toWorld(cilium.x, cilium.y, cell.x, cell.y, cos, sin);
      const dir = toWorld(cilium.dirX, cilium.dirY, 0, 0, cos, sin);
      const count = fillCilium(whipScratch, root[0], root[1], dir[0], dir[1], cilium.length, phase, sway * stroke * sense);
      this.queueRibbon(whipScratch, count, halfWidth, 0, cover, color, halfView, camera);
    }
  }

  private queueRibbon(
    points: RibbonPoint[],
    count: number,
    halfWidth: number,
    z: number,
    alpha: number,
    color: number[],
    halfView: [number, number],
    camera: [number, number],
  ): void {
    if (count < 2) return;
    const floats = (count - 1) * 24;
    if (this.ribbonCursor > 0 && this.ribbonColor !== color) this.flushRibbon();
    this.ribbonColor = color;
    this.ribbonHalfView = halfView;
    this.ribbonCamera = camera;
    if (this.ribbonCursor + floats > this.ribbonData.length) {
      if (this.ribbonCursor > 0) this.flushRibbon();
      this.ribbonColor = color;
      this.ribbonHalfView = halfView;
      this.ribbonCamera = camera;
      if (floats > this.ribbonData.length) {
        let size = this.ribbonData.length;
        while (size < floats) size *= 2;
        this.ribbonData = new Float32Array(size);
      }
    }
    if (alpha < 0.999) this.ribbonTransparent = true;
    this.ribbonCursor = appendRibbon(points, count, halfWidth, this.ribbonData, this.ribbonCursor, z, alpha);
  }

  private flushRibbon(): void {
    const cursor = this.ribbonCursor;
    const transparent = this.ribbonTransparent;
    const color = this.ribbonColor;
    this.ribbonCursor = 0;
    this.ribbonTransparent = false;
    if (!color || cursor < 24) return;
    const gl = this.gl;
    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }
    gl.useProgram(this.lineProgram);
    gl.uniform2f(uniform(gl, this.lineProgram, "uHalfView"), this.ribbonHalfView[0], this.ribbonHalfView[1]);
    gl.uniform2f(uniform(gl, this.lineProgram, "uCamera"), this.ribbonCamera[0], this.ribbonCamera[1]);
    gl.uniform3f(uniform(gl, this.lineProgram, "uColor"), color[0], color[1], color[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ribbon);
    gl.bufferData(gl.ARRAY_BUFFER, this.ribbonData.subarray(0, cursor), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, cursor / 4);
    if (transparent) gl.disable(gl.BLEND);
  }

  private drawTemperature(halfView: [number, number], camera: [number, number]): void {
    this.syncTemperatureTexture();
    const gl = this.gl;
    const program = this.temperatureProgram;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.temperatureTexture);
    gl.uniform1i(uniform(gl, program, "uTemperature"), 0);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform2f(uniform(gl, program, "uResolution"), this.logicalWidth, this.logicalHeight);
    gl.uniform2f(uniform(gl, program, "uOrigin"), TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y);
    gl.uniform2f(uniform(gl, program, "uGrid"), TEXEL_COLUMNS, TEXEL_ROWS);
    gl.uniform1f(uniform(gl, program, "uCell"), TEXEL_SIZE);
    this.drawQuad(program);
    gl.disable(gl.BLEND);
  }

  private drawConcentration(halfView: [number, number], camera: [number, number], overlay: Exclude<FieldOverlay, "temperature">): void {
    const gl = this.gl;
    const program = this.concentrationProgram;
    const tint = overlay === "oxidex" ? [0.78, 0.84, 0.86] : overlay === "sulfex" ? [0.86, 0.72, 0.28] : [0.32, 0.5, 0.9];
    const texture = overlay === "oxidex" ? this.oxidexTexture : overlay === "sulfex" ? this.sulfexTexture : this.pressureTexture;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniform(gl, program, "uField"), 0);
    gl.uniform3f(uniform(gl, program, "uTint"), tint[0], tint[1], tint[2]);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform2f(uniform(gl, program, "uResolution"), this.logicalWidth, this.logicalHeight);
    gl.uniform2f(uniform(gl, program, "uOrigin"), TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y);
    gl.uniform2f(uniform(gl, program, "uGrid"), TEXEL_COLUMNS, TEXEL_ROWS);
    gl.uniform1f(uniform(gl, program, "uCell"), TEXEL_SIZE);
    this.drawQuad(program);
    gl.disable(gl.BLEND);
  }

  /** Particles follow an eased copy so a half-second heat step cannot yank the curl. */
  private syncParticleTemperature(dt: number): void {
    const target = this.temperatureField.values;
    const shown = this.particleTemperature;
    const blend = 1 - Math.exp(-Math.min(Math.max(dt, 0), 0.1) / 0.55);
    if (!this.particleTemperatureReady) {
      shown.set(target);
      this.particleTemperatureReady = true;
    } else {
      for (let index = 0; index < shown.length; index += 1) shown[index] += (target[index] - shown[index]) * blend;
    }
    const bytes = this.particleTemperatureBytes;
    for (let index = 0; index < shown.length; index += 1) {
      const scaled = Math.round((shown[index] / 130) * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.particleTemperatureTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXEL_COLUMNS, TEXEL_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  private makeGridTexture(bytes: Uint8Array): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, TEXEL_COLUMNS, TEXEL_ROWS, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    return texture;
  }

  private syncTemperatureTexture(): void {
    if (this.temperatureField.revision === this.temperatureRevision) return;
    this.temperatureRevision = this.temperatureField.revision;
    const values = this.temperatureField.values;
    const bytes = this.temperatureBytes;
    for (let index = 0; index < values.length; index += 1) {
      const scaled = Math.round((values[index] / 130) * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.temperatureTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXEL_COLUMNS, TEXEL_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  private syncOxidexTexture(): void {
    if (this.oxidexField.revision === this.oxidexRevision) return;
    this.oxidexRevision = this.oxidexField.revision;
    const values = this.oxidexField.values;
    const bytes = this.oxidexBytes;
    for (let index = 0; index < values.length; index += 1) {
      const scaled = Math.round(values[index] * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.oxidexTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXEL_COLUMNS, TEXEL_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  private syncSulfexTexture(): void {
    if (this.sulfexField.revision === this.sulfexRevision) return;
    this.sulfexRevision = this.sulfexField.revision;
    const values = this.sulfexField.values;
    const bytes = this.sulfexBytes;
    for (let index = 0; index < values.length; index += 1) {
      const scaled = Math.round(values[index] * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.sulfexTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXEL_COLUMNS, TEXEL_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  private syncPressureTexture(): void {
    if (this.pressureField.revision === this.pressureRevision) return;
    this.pressureRevision = this.pressureField.revision;
    const values = this.pressureField.values;
    const bytes = this.pressureBytes;
    for (let index = 0; index < values.length; index += 1) {
      const scaled = Math.round(values[index] * 255);
      const byte = scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
      bytes[index * 4] = byte;
      bytes[index * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.pressureTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, TEXEL_COLUMNS, TEXEL_ROWS, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
  }

  private drawTemperatureLabels(halfView: [number, number], camera: [number, number]): void {
    const canvas = this.labels;
    const context = this.labelContext;
    if (!this.fieldOverlay) {
      canvas.classList.remove("on");
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    canvas.classList.add("on");
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    const cellPx = (TEXEL_SIZE / (halfView[0] * 2)) * rect.width;
    if (cellPx < 48 || rect.width <= 0) return;
    const column0 = Math.max(0, Math.floor((camera[0] - halfView[0] - TEXEL_ORIGIN_X) / TEXEL_SIZE));
    const column1 = Math.min(TEXEL_COLUMNS - 1, Math.floor((camera[0] + halfView[0] - TEXEL_ORIGIN_X) / TEXEL_SIZE));
    const row0 = Math.max(0, Math.floor((camera[1] - halfView[1] - TEXEL_ORIGIN_Y) / TEXEL_SIZE));
    const row1 = Math.min(TEXEL_ROWS - 1, Math.floor((camera[1] + halfView[1] - TEXEL_ORIGIN_Y) / TEXEL_SIZE));
    context.font = `${cellPx > 90 ? 13 : 11}px ui-monospace, Consolas, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#f4f4f4";
    context.shadowColor = "rgba(0, 0, 0, 0.9)";
    context.shadowBlur = 0;
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    const values =
      this.fieldOverlay === "temperature"
        ? this.temperatureField.values
        : this.fieldOverlay === "oxidex"
          ? this.oxidexField.values
          : this.fieldOverlay === "sulfex"
            ? this.sulfexField.values
            : this.pressureField.values;
    for (let row = row0; row <= row1; row += 1) {
      const worldY = TEXEL_ORIGIN_Y + (row + 0.5) * TEXEL_SIZE;
      const screenY = (0.5 - (worldY - camera[1]) / halfView[1] / 2) * rect.height;
      for (let column = column0; column <= column1; column += 1) {
        const worldX = TEXEL_ORIGIN_X + (column + 0.5) * TEXEL_SIZE;
        const screenX = ((worldX - camera[0]) / halfView[0] * 0.5 + 0.5) * rect.width;
        const value = values[row * TEXEL_COLUMNS + column];
        const label = this.fieldOverlay === "temperature" ? `${Math.round(value)}°C` : value.toFixed(2);
        context.fillText(label, screenX, screenY);
      }
    }
  }

  private drawTexelGrid(halfView: [number, number], camera: [number, number]): void {
    const gl = this.gl;
    const program = this.gridProgram;
    gl.disable(gl.BLEND);
    gl.useProgram(program);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform2f(uniform(gl, program, "uResolution"), this.logicalWidth, this.logicalHeight);
    gl.uniform2f(uniform(gl, program, "uOrigin"), TEXEL_ORIGIN_X, TEXEL_ORIGIN_Y);
    gl.uniform2f(uniform(gl, program, "uSpan"), TEXEL_SPAN_X, TEXEL_SPAN_Y);
    gl.uniform1f(uniform(gl, program, "uCell"), TEXEL_SIZE);
    gl.uniform3f(uniform(gl, program, "uColor"), 0.72, 0.28, 1);
    this.drawQuad(program);
  }

  private appendFluorLights(
    lights: PackedPointLights,
    cells: CellSnapshot[],
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
  ): void {
    const reach = 1.45;
    for (const cell of cells) {
      const glow = cell.glow;
      if (!glow || glow[0] + glow[1] + glow[2] < 0.004) continue;
      if (lights.count >= 48) return;
      if (cell.x + reach < bounds.minX || cell.x - reach > bounds.maxX) continue;
      if (cell.y + reach < bounds.minY || cell.y - reach > bounds.maxY) continue;
      const slot = lights.count * 3;
      lights.data[slot] = cell.x;
      lights.data[slot + 1] = cell.y;
      lights.data[slot + 2] = reach;
      lights.colors[slot] = glow[0];
      lights.colors[slot + 1] = glow[1];
      lights.colors[slot + 2] = glow[2];
      lights.count += 1;
    }
  }

  private crystalBodyProgram(): WebGLProgram {
    if (this.crystalProgram) return this.crystalProgram;
    this.crystalProgram = link(this.gl, BODY_VS, CRYSTAL_FS);
    return this.crystalProgram;
  }

  private drawBodies(
    cells: CellSnapshot[],
    halfView: [number, number],
    camera: [number, number],
    pixelWorld: number,
    light: [number, number, number],
    intensity: number,
    lights: PackedPointLights,
  ): void {
    this.drawBodyPass(cells, halfView, camera, pixelWorld, light, intensity, lights, false);
    this.drawBodyPass(cells, halfView, camera, pixelWorld, light, intensity, lights, true);
  }

  private drawBodyPass(
    cells: CellSnapshot[],
    halfView: [number, number],
    camera: [number, number],
    pixelWorld: number,
    light: [number, number, number],
    intensity: number,
    lights: PackedPointLights,
    crystal: boolean,
  ): void {
    this.growInstances(cells.length);
    let count = 0;
    for (const cell of cells) {
      if (!this.cellOnScreen(cell, halfView, camera)) continue;
      const style = cell.membraneStyle ?? this.membraneStyle;
      if ((style === 3) !== crystal) continue;
      this.writeBody(count, cell, pixelWorld);
      count += 1;
    }
    if (count === 0) return;
    const gl = this.gl;
    const program = crystal ? this.crystalBodyProgram() : this.bodyProgram;
    const storage0 = STORAGE[0];
    const storage1 = STORAGE[1] ?? STORAGE[0];
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);
    gl.uniform2f(uniform(gl, program, "uHalfView"), halfView[0], halfView[1]);
    gl.uniform2f(uniform(gl, program, "uCamera"), camera[0], camera[1]);
    gl.uniform1f(uniform(gl, program, "uPixel"), pixelWorld);
    gl.uniform3f(uniform(gl, program, "uLightDir"), light[0], light[1], light[2]);
    gl.uniform1f(uniform(gl, program, "uLightIntensity"), intensity);
    gl.uniform1i(uniform(gl, program, "uPointCount"), lights.count);
    gl.uniform3fv(uniform(gl, program, "uPointLights"), lights.data);
    gl.uniform3fv(uniform(gl, program, "uPointColors"), lights.colors);
    gl.uniform4fv(uniform(gl, program, "uPalette0"), PALETTE0);
    gl.uniform4fv(uniform(gl, program, "uPalette1"), PALETTE1);
    gl.uniform3fv(uniform(gl, program, "uCapsuleColors"), CAPSULE_PACK);
    gl.uniform3f(uniform(gl, program, "uStorageA0"), storage0[0][0], storage0[0][1], storage0[0][2]);
    gl.uniform3f(uniform(gl, program, "uStorageB0"), storage0[1][0], storage0[1][1], storage0[1][2]);
    gl.uniform3f(uniform(gl, program, "uStorageA1"), storage1[0][0], storage1[0][1], storage1[0][2]);
    gl.uniform3f(uniform(gl, program, "uStorageB1"), storage1[1][0], storage1[1][1], storage1[1][2]);
    gl.uniform1i(uniform(gl, program, "uGranuleCount"), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.subarray(0, count * BODY_FLOATS), gl.DYNAMIC_DRAW);
    const stride = BODY_FLOATS * 4;
    for (let loc = 1; loc <= 9; loc += 1) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, stride, (loc - 1) * 16);
      gl.vertexAttribDivisor(loc, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(0, 0);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
    for (let loc = 1; loc <= 9; loc += 1) {
      gl.vertexAttribDivisor(loc, 0);
      gl.disableVertexAttribArray(loc);
    }
    gl.disable(gl.BLEND);
  }

  private writeBody(index: number, cell: CellSnapshot, pixelWorld: number): void {
    const shape = orientedCapsule(cell.length, cell.width);
    const bend = cell.bend ?? 0;
    const [halfX, halfY] = curvedHalfExtents(shape, bend);
    const divisionPad = (cell.morph ?? 0) > 0 || (cell.furrow ?? 0) > 0 ? 1 / 16 : 0;
    const membranePx = cell.membranePx ?? this.membranePx;
    const membraneStyle = cell.membraneStyle ?? this.membraneStyle;
    const membraneColor = cell.membraneColor ?? this.membraneColor;
    const cellMembrane = membranePx * pixelWorld;
    const fringePx = membraneStyle === 2 ? 2 : membraneStyle === 1 ? 1 : 0;
    const skirt = cellMembrane + fringePx * pixelWorld;
    const crystalPad = membraneStyle === 3 ? shape.radius * 0.15 : 0;
    const pad = cell.capsule + skirt + 1 / 32 + divisionPad + crystalPad;
    const axialReach = shape.halfSegment + shape.radius;
    const waist = Math.max(Math.min(shape.radius * 0.62, axialReach * 0.22), 1 / 32);
    const data = this.instanceData;
    const o = index * BODY_FLOATS;
    data[o] = cell.x;
    data[o + 1] = cell.y;
    data[o + 2] = Math.cos(cell.angle);
    data[o + 3] = Math.sin(cell.angle);
    data[o + 4] = halfX + pad;
    data[o + 5] = halfY + pad;
    data[o + 6] = shape.halfSegment;
    data[o + 7] = shape.radius;
    data[o + 8] = bend;
    data[o + 9] = cell.furrow ?? 0;
    data[o + 10] = waist;
    data[o + 11] = cell.furrowAxis ?? 0;
    data[o + 12] = cell.morph ?? 0;
    data[o + 13] = cell.divisionShift ?? 0;
    data[o + 14] = cell.divisionPlace ?? 0;
    data[o + 15] = shape.lateral ? 1 : 0;
    data[o + 16] = membranePx;
    data[o + 17] = membraneStyle;
    data[o + 18] = cell.capsule;
    data[o + 19] = cell.seed;
    data[o + 20] = cell.angle;
    data[o + 21] = membraneColor[0];
    data[o + 22] = membraneColor[1];
    data[o + 23] = membraneColor[2];
    data[o + 24] = cell.palette;
    data[o + 25] = this.cellDepth(cell.y);
    const [polar, antipolar, lateral, antilateral] = effectiveTaperDegrees(cell.taper);
    data[o + 28] = polar;
    data[o + 29] = antipolar;
    data[o + 30] = lateral;
    data[o + 31] = antilateral;
    const pigment = cell.pigment ?? [1, 1, 1];
    data[o + 32] = pigment[0];
    data[o + 33] = pigment[1];
    data[o + 34] = pigment[2];
    data[o + 35] = 1;
  }

  private growInstances(count: number): void {
    if (count <= this.instanceCapacity) return;
    let cap = this.instanceCapacity;
    while (cap < count) cap *= 2;
    const next = new Float32Array(cap * BODY_FLOATS);
    next.set(this.instanceData);
    this.instanceData = next;
    this.instanceCapacity = cap;
  }

  private cellOnScreen(cell: CellSnapshot, halfView: [number, number], camera: [number, number]): boolean {
    const reach = Math.max(cell.length, cell.width) * 3 + Math.abs(cell.divisionShift ?? 0) + 0.5;
    return Math.abs(cell.x - camera[0]) <= halfView[0] + reach && Math.abs(cell.y - camera[1]) <= halfView[1] + reach;
  }

  /** Higher world y is nearer. Clip z stays inside (-1, 1). */
  private cellDepth(y: number): number {
    const z = (500 - y) / 500 - 1;
    if (z < -0.98) return -0.98;
    if (z > 0.98) return 0.98;
    return z;
  }

  private flagellumDepth(y: number): number {
    return Math.min(0.985, this.cellDepth(y) + 1e-4);
  }

  private drawQuad(program: WebGLProgram): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private advancePhase(id: number, frequency: number, dt: number): number {
    const next = (this.phases.get(id) ?? 0) + frequency * dt;
    this.phases.set(id, next);
    return next;
  }
}

function ciliumRandomPhase(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return (n - Math.floor(n)) * Math.PI * 2;
}

function moveToward(current: number, target: number, amount: number): number {
  if (current < target) return Math.min(target, current + amount);
  return Math.max(target, current - amount);
}

function toWorld(
  x: number,
  y: number,
  originX: number,
  originY: number,
  cos: number,
  sin: number,
): [number, number] {
  return [originX + cos * x - sin * y, originY + sin * x + cos * y];
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
