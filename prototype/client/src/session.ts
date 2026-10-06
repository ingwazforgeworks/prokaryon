import type { CellSnapshot, WorldSnapshot } from "./types";

const SOCKET_URL = "ws://127.0.0.1:8765";
const INTERPOLATION_DELAY = 0.1;

export class SimulationSession {
  private readonly buffer: WorldSnapshot[] = [];
  private offset = 0;
  private hasClock = false;
  private socket: WebSocket | null = null;

  constructor(private readonly onStatus: (status: string) => void) {}

  start(): void {
    if (location.protocol === "https:" && SOCKET_URL.startsWith("ws:")) return;
    this.connect();
  }

  private connect(): void {
    this.onStatus("connecting");
    const socket = new WebSocket(SOCKET_URL);
    this.socket = socket;
    socket.onopen = () => this.onStatus("live");
    socket.onmessage = (event) => {
      const snap = JSON.parse(String(event.data)) as WorldSnapshot;
      if (!snap || snap.v !== 1 || !Array.isArray(snap.cells)) return;
      this.buffer.push(snap);
      const local = performance.now() / 1000;
      this.offset = snap.t - local;
      this.hasClock = true;
      const cutoff = snap.t - 2;
      while (this.buffer.length > 2 && this.buffer[0].t < cutoff) this.buffer.shift();
    };
    socket.onclose = () => {
      if (this.socket === socket) {
        this.onStatus("reconnecting");
        window.setTimeout(() => this.connect(), 500);
      }
    };
  }

  sample(): { view: WorldSnapshot["view"]; cells: CellSnapshot[] } | null {
    if (!this.hasClock || this.buffer.length === 0) return null;
    const t = performance.now() / 1000 + this.offset - INTERPOLATION_DELAY;
    return {
      view: this.buffer[this.buffer.length - 1].view,
      cells: sampleCells(this.buffer, t),
    };
  }
}

function sampleCells(buffer: WorldSnapshot[], t: number): CellSnapshot[] {
  if (t <= buffer[0].t) return buffer[0].cells;
  const last = buffer[buffer.length - 1];
  if (t >= last.t) return last.cells;
  let index = 0;
  while (index + 1 < buffer.length && buffer[index + 1].t < t) index += 1;
  const a = buffer[index];
  const b = buffer[index + 1];
  const span = b.t - a.t;
  const u = span > 1e-6 ? (t - a.t) / span : 0;
  return a.cells.map((left) => {
    const right = b.cells.find((cell) => cell.id === left.id) ?? left;
    return {
      ...left,
      x: lerp(left.x, right.x, u),
      y: lerp(left.y, right.y, u),
      angle: lerpAngle(left.angle, right.angle, u),
      vx: lerp(left.vx, right.vx, u),
      vy: lerp(left.vy, right.vy, u),
      omega: lerp(left.omega, right.omega, u),
    };
  });
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}
