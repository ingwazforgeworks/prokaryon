"""Stream authoritative snapshots to the WebGL client."""

from __future__ import annotations

import asyncio
import json
import time

from prokaryon_sim.world import World

HOST = "127.0.0.1"
PORT = 8765
SEND_HZ = 20.0


async def serve() -> None:
    import websockets

    world = World()
    clients: set = set()

    async def handler(websocket) -> None:
        clients.add(websocket)
        try:
            await websocket.send(json.dumps(world.snapshot()))
            async for _message in websocket:
                pass
        finally:
            clients.discard(websocket)

    async def simulate() -> None:
        last = time.perf_counter()
        send_accum = 0.0
        send_dt = 1.0 / SEND_HZ
        while True:
            now = time.perf_counter()
            dt = min(0.05, now - last)
            last = now
            world.step(dt)
            send_accum += dt
            if send_accum >= send_dt and clients:
                send_accum = 0.0
                payload = json.dumps(world.snapshot())
                dead = []
                for ws in list(clients):
                    try:
                        await ws.send(payload)
                    except Exception:
                        dead.append(ws)
                for ws in dead:
                    clients.discard(ws)
            await asyncio.sleep(1.0 / 60.0)

    async with websockets.serve(handler, HOST, PORT):
        print(f"simulation listening on ws://{HOST}:{PORT}", flush=True)
        await simulate()


def main() -> None:
    asyncio.run(serve())


if __name__ == "__main__":
    main()
