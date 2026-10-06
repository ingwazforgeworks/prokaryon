import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, PreviewServer, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";

const artRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Art/Environment");
const atmosphereRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Art/Atmosphere");
const uiArtRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Art/UI_art");
const resourceArtRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Art/Resources");
const fontRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Fonts/DepartureMono-1.500");
const uiSoundRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Sounds/UI_sounds");
const musicRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Music/game_music");
const themeRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Music/theme_music");
const brandingRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../Art/Branding");
const editsFile = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "public/terrain-edits.json");
const genomeStateFile = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "public/genome-state.json");
const techLayoutFile = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "public/tech-layout.json");
const techUnlocksFile = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "public/tech-unlocks.json");
const geneDataFile = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "public/gene-data.json");
const repoRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

const STATIC_TYPES: Record<string, string> = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

function serveArt(middlewares: Connect.Server, prefix: string, root: string): void {
  middlewares.use(prefix, (request, response, next) => {
    const relative = decodeURIComponent((request.url ?? "/").split("?")[0]).replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) {
      next();
      return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      next();
      return;
    }
    response.setHeader("Content-Type", "image/png");
    fs.createReadStream(file).pipe(response);
  });
}

function serveStatic(middlewares: Connect.Server, prefix: string, root: string): void {
  middlewares.use(prefix, (request, response, next) => {
    const relative = decodeURIComponent((request.url ?? "/").split("?")[0]).replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(root + path.sep)) {
      next();
      return;
    }
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      next();
      return;
    }
    response.setHeader("Content-Type", STATIC_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream");
    fs.createReadStream(file).pipe(response);
  });
}

function sendAudio(request: IncomingMessage, response: ServerResponse, file: string): void {
  const stat = fs.statSync(file);
  const total = stat.size;
  response.setHeader("Accept-Ranges", "bytes");
  response.setHeader("Content-Type", "audio/mpeg");
  const header = request.headers.range;
  const match = header ? /^bytes=(\d*)-(\d*)$/.exec(header) : null;
  if (header && !match) {
    response.statusCode = 416;
    response.setHeader("Content-Range", `bytes */${total}`);
    response.end();
    return;
  }
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : total - 1;
    if (start > end || start >= total) {
      response.statusCode = 416;
      response.setHeader("Content-Range", `bytes */${total}`);
      response.end();
      return;
    }
    const capped = Math.min(end, total - 1);
    response.statusCode = 206;
    response.setHeader("Content-Range", `bytes ${start}-${capped}/${total}`);
    response.setHeader("Content-Length", String(capped - start + 1));
    fs.createReadStream(file, { start, end: capped }).pipe(response);
    return;
  }
  response.setHeader("Content-Length", String(total));
  fs.createReadStream(file).pipe(response);
}

function serveAudioFolder(middlewares: Connect.Server, prefix: string, root: string, list: boolean): void {
  middlewares.use(prefix, (request, response, next) => {
    const relative = decodeURIComponent((request.url ?? "/").split("?")[0]).replace(/^\/+/, "");
    if (!relative && list) {
      const names = fs
        .readdirSync(root)
        .filter((name) => name.toLowerCase().endsWith(".mp3"))
        .sort((a, b) => a.localeCompare(b));
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(names));
      return;
    }
    if (path.basename(relative) !== relative || !relative.toLowerCase().endsWith(".mp3")) {
      next();
      return;
    }
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      next();
      return;
    }
    sendAudio(request, response, file);
  });
}

function serveMusic(middlewares: Connect.Server): void {
  serveAudioFolder(middlewares, "/music", musicRoot, true);
  serveAudioFolder(middlewares, "/theme", themeRoot, false);
}

function saveGenomeState(middlewares: Connect.Server): void {
  middlewares.use("/api/genome-state", (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }
    void writeGenomeState(request, response);
  });
}

function writeGenomeState(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 1_000_000) {
        response.statusCode = 413;
        response.end("too large");
        request.destroy();
        resolve();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", () => {
      response.statusCode = 400;
      response.end("bad request");
      resolve();
    });
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
          v?: unknown;
          draft?: unknown;
          genome?: unknown;
        };
        if (body.v !== 1 || !body.draft || typeof body.draft !== "object" || !Array.isArray(body.genome)) {
          throw new Error("invalid genome state");
        }
        fs.mkdirSync(path.dirname(genomeStateFile), { recursive: true });
        fs.writeFileSync(genomeStateFile, JSON.stringify({ v: 1, draft: body.draft, genome: body.genome }));
        response.statusCode = 204;
        response.end();
      } catch {
        if (!response.writableEnded) {
          response.statusCode = 400;
          response.end("invalid genome state");
        }
      }
      resolve();
    });
  });
}

function saveTechLayout(middlewares: Connect.Server): void {
  middlewares.use("/api/tech-layout", (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }
    void writeTechLayout(request, response);
  });
}

function writeTechLayout(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 1_000_000) {
        response.statusCode = 413;
        response.end("too large");
        request.destroy();
        resolve();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", () => {
      response.statusCode = 400;
      response.end("bad request");
      resolve();
    });
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { v?: unknown; functional?: unknown; regulatory?: unknown };
        if (body.v !== 2) throw new Error("invalid tech layout");
        const functional = readTechTree(body.functional);
        const regulatory = readTechTree(body.regulatory);
        fs.mkdirSync(path.dirname(techLayoutFile), { recursive: true });
        fs.writeFileSync(techLayoutFile, JSON.stringify({ v: 2, functional, regulatory }));
        response.statusCode = 204;
        response.end();
      } catch {
        if (!response.writableEnded) {
          response.statusCode = 400;
          response.end("invalid tech layout");
        }
      }
      resolve();
    });
  });
}

function readTechTree(value: unknown): {
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
  edges: { from: string; to: string; kind: "unlocks" | "required" }[];
} {
  if (!value || typeof value !== "object") throw new Error("invalid tech layout");
  const tree = value as { groups?: unknown; nodes?: unknown; labels?: unknown; edges?: unknown };
  if (!Array.isArray(tree.groups) || !Array.isArray(tree.nodes) || !Array.isArray(tree.labels) || !Array.isArray(tree.edges)) {
    throw new Error("invalid tech layout");
  }
  return {
    groups: tree.groups.map((item) => {
      const group = readRecord(item);
      return {
        key: readToken(group.key),
        label: readText(group.label, 80),
        accent: readAccent(group.accent),
        x: readCoord(group.x),
        y: readCoord(group.y),
        w: readCoord(group.w),
        h: readCoord(group.h),
      };
    }),
    nodes: tree.nodes.map((item) => {
      const node = readRecord(item);
      return {
        id: readToken(node.id),
        geneId: node.geneId === null || node.geneId === undefined ? null : readToken(node.geneId),
        name: readText(node.name, 80),
        x: readCoord(node.x),
        y: readCoord(node.y),
        w: readCoord(node.w),
        h: readCoord(node.h),
        groupKey: node.groupKey === null || node.groupKey === undefined ? null : readToken(node.groupKey),
        category: readText(node.category ?? "", 80),
        description: readText(node.description ?? "", 2000),
      };
    }),
    labels: tree.labels.map((item) => {
      const label = readRecord(item);
      return { key: readToken(label.key), text: readText(label.text, 80), x: readCoord(label.x), y: readCoord(label.y) };
    }),
    edges: tree.edges.map((item) => {
      const edge = readRecord(item);
      const kind = edge.kind === "one of" ? "unlocks" : edge.kind;
      if (kind !== "unlocks" && kind !== "required") throw new Error("invalid tech layout");
      return { from: readToken(edge.from), to: readToken(edge.to), kind };
    }),
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid tech layout");
  return value as Record<string, unknown>;
}

function readToken(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 80) throw new Error("invalid tech layout");
  return value;
}

function readText(value: unknown, max: number): string {
  if (typeof value !== "string" || value.length > max) throw new Error("invalid tech layout");
  return value;
}

function readAccent(value: unknown): string {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error("invalid tech layout");
  return value;
}

function readCoord(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 20000) throw new Error("invalid tech layout");
  return Math.round(value);
}

function saveTechUnlocks(middlewares: Connect.Server): void {
  middlewares.use("/api/tech-unlocks", (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }
    void writeTechUnlocks(request, response);
  });
}

function writeTechUnlocks(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 1_000_000) {
        response.statusCode = 413;
        response.end("too large");
        request.destroy();
        resolve();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", () => {
      response.statusCode = 400;
      response.end("bad request");
      resolve();
    });
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { v?: unknown; unlocked?: unknown };
        if (body.v !== 1 || !Array.isArray(body.unlocked)) throw new Error("invalid tech unlocks");
        const unlocked = body.unlocked.map((id) => readToken(id));
        if (new Set(unlocked).size !== unlocked.length) throw new Error("invalid tech unlocks");
        fs.mkdirSync(path.dirname(techUnlocksFile), { recursive: true });
        fs.writeFileSync(techUnlocksFile, JSON.stringify({ v: 1, unlocked }));
        response.statusCode = 204;
        response.end();
      } catch {
        if (!response.writableEnded) {
          response.statusCode = 400;
          response.end("invalid tech unlocks");
        }
      }
      resolve();
    });
  });
}

function saveGeneData(middlewares: Connect.Server): void {
  middlewares.use("/api/gene-data", (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }
    void writeGeneData(request, response);
  });
}

function writeGeneData(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 2_000_000) {
        response.statusCode = 413;
        response.end("too large");
        request.destroy();
        resolve();
        return;
      }
      chunks.push(chunk);
    });
    request.on("error", () => {
      response.statusCode = 400;
      response.end("bad request");
      resolve();
    });
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { v?: unknown; genes?: unknown };
        if (body.v !== 1 || typeof body.genes !== "object" || body.genes === null || Array.isArray(body.genes)) {
          throw new Error("invalid gene data");
        }
        const genes: Record<string, Record<string, string>> = {};
        for (const [tag, value] of Object.entries(body.genes)) {
          if (!/^[A-Za-z0-9]{1,8}$/.test(tag)) throw new Error("invalid gene data");
          if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("invalid gene data");
          const record: Record<string, string> = {};
          for (const [field, fieldValue] of Object.entries(value)) {
            if (typeof fieldValue !== "string" || fieldValue.length > 2000 || field.length > 40) throw new Error("invalid gene data");
            record[field] = fieldValue;
          }
          genes[tag] = record;
        }
        fs.mkdirSync(path.dirname(geneDataFile), { recursive: true });
        fs.writeFileSync(geneDataFile, JSON.stringify({ v: 1, genes }, null, 2));
        response.statusCode = 204;
        response.end();
      } catch {
        if (!response.writableEnded) {
          response.statusCode = 400;
          response.end("invalid gene data");
        }
      }
      resolve();
    });
  });
}

function saveTerrainEdits(middlewares: Connect.Server): void {
  middlewares.use("/api/terrain-edits", (request, response, next) => {
    if (request.method !== "POST") {
      next();
      return;
    }
    void writeTerrainEdits(request, response);
  });
}

function writeTerrainEdits(request: IncomingMessage, response: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("error", () => {
      response.statusCode = 400;
      response.end("bad request");
      resolve();
    });
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
          removed?: unknown;
          added?: unknown;
          lights?: unknown;
          bubbles?: unknown;
          heats?: unknown;
          decorations?: unknown;
        };
        if (!Array.isArray(body.removed) || !Array.isArray(body.added)) throw new Error("invalid edits");
        const lights = Array.isArray(body.lights) ? body.lights : [];
        const bubbles = Array.isArray(body.bubbles) ? body.bubbles : [];
        const heats = Array.isArray(body.heats) ? body.heats : [];
        const decorations = Array.isArray(body.decorations) ? body.decorations : [];
        fs.mkdirSync(path.dirname(editsFile), { recursive: true });
        fs.writeFileSync(
          editsFile,
          JSON.stringify({ removed: body.removed, added: body.added, lights, bubbles, heats, decorations }),
        );
        response.statusCode = 204;
        response.end();
      } catch {
        response.statusCode = 400;
        response.end("invalid edits");
      }
      resolve();
    });
  });
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [repoRoot],
    },
  },
  plugins: [
    {
      name: "environment-art",
      configureServer(server: ViteDevServer) {
        serveArt(server.middlewares, "/environment", artRoot);
        serveArt(server.middlewares, "/atmosphere", atmosphereRoot);
        serveArt(server.middlewares, "/ui", uiArtRoot);
        serveArt(server.middlewares, "/branding", brandingRoot);
        serveArt(server.middlewares, "/resources", resourceArtRoot);
        serveStatic(server.middlewares, "/fonts", fontRoot);
        serveStatic(server.middlewares, "/ui-sounds", uiSoundRoot);
        serveMusic(server.middlewares);
        saveTerrainEdits(server.middlewares);
        saveGenomeState(server.middlewares);
        saveTechLayout(server.middlewares);
        saveTechUnlocks(server.middlewares);
        saveGeneData(server.middlewares);
      },
      configurePreviewServer(server: PreviewServer) {
        serveArt(server.middlewares, "/environment", artRoot);
        serveArt(server.middlewares, "/atmosphere", atmosphereRoot);
        serveArt(server.middlewares, "/ui", uiArtRoot);
        serveArt(server.middlewares, "/branding", brandingRoot);
        serveArt(server.middlewares, "/resources", resourceArtRoot);
        serveStatic(server.middlewares, "/fonts", fontRoot);
        serveStatic(server.middlewares, "/ui-sounds", uiSoundRoot);
        serveMusic(server.middlewares);
        saveTerrainEdits(server.middlewares);
        saveGenomeState(server.middlewares);
        saveTechLayout(server.middlewares);
        saveTechUnlocks(server.middlewares);
        saveGeneData(server.middlewares);
      },
    },
  ],
});
