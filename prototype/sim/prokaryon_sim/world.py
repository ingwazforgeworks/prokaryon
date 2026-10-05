"""Overdamped planar swimming. The player does not steer.

Terminal velocity matches the local flow, plus flagellar thrust along the
cell's long axis. Turning is run-and-tumble, not a heading command.
A filament with no motor activity adds no thrust.
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field

from prokaryon_sim.shape import Capsule

HALF_WIDTH = 10.0
HALF_HEIGHT = 5.625
PIXELS_PER_UNIT = 32.0
LOGICAL_WIDTH = 640
LOGICAL_HEIGHT = 360


def flow_at(x: float, y: float) -> tuple[float, float]:
    """Slow gyre so a non-motile cell still has visible motion."""
    return (
        -0.65 * math.sin(y * 0.38),
        0.65 * math.sin(x * 0.24),
    )


@dataclass
class FlagellumState:
    structure_id: int
    pole: int
    mount: float
    length: float
    assembly: float

    def to_dict(self) -> dict:
        return {
            "id": self.structure_id,
            "pole": self.pole,
            "mount": self.mount,
            "length": self.length,
            "assembly": self.assembly,
        }


@dataclass
class Cell:
    id: int
    x: float
    y: float
    angle: float
    length: float
    width: float
    palette: int
    seed: int
    capsule: float
    motor_activity: float
    flagella: list[FlagellumState]
    tumbling: bool = False
    tumble_left: float = 0.0
    tumble_omega: float = 0.0
    run_left: float = 1.0
    contact_cooldown: float = 0.0
    drift: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    omega: float = 0.0

    def capsule_shape(self) -> Capsule:
        return Capsule.from_length_width(self.length, self.width)

    def parallel_drag(self) -> float:
        ratio = self.width / self.length
        return 1.15 * self.length * (0.55 + 0.45 * ratio)

    def thrust(self) -> float:
        if not self.flagella or self.motor_activity <= 0.0:
            return 0.0
        assembly = sum(f.assembly for f in self.flagella) / len(self.flagella)
        bundle = 0.65 + 0.35 * min(len(self.flagella), 3)
        scale = 0.15 if self.tumbling else 1.0
        return 2.8 * self.motor_activity * assembly * bundle * scale

    def to_dict(self) -> dict:
        if self.motor_activity <= 0.0 or not self.flagella:
            motor = "idle"
        elif self.tumbling:
            motor = "tumble"
        else:
            motor = "run"
        return {
            "id": self.id,
            "x": self.x,
            "y": self.y,
            "angle": self.angle,
            "vx": self.vx,
            "vy": self.vy,
            "omega": self.omega,
            "length": self.length,
            "width": self.width,
            "palette": self.palette,
            "seed": self.seed,
            "capsule": self.capsule,
            "motor": motor,
            "activity": self.motor_activity,
            "flagella": [f.to_dict() for f in self.flagella],
        }


def _mounts(count: int) -> list[float]:
    if count <= 1:
        return [0.0]
    if count == 2:
        return [-0.18, 0.18]
    return [-0.32, 0.0, 0.32]


def _make_flagella(cell_id: int, count: int, body_length: float) -> list[FlagellumState]:
    if count <= 0:
        return []
    filament = max(0.85, body_length * 0.95)
    return [
        FlagellumState(
            structure_id=cell_id * 100 + index + 1,
            pole=-1,
            mount=mount,
            length=filament,
            assembly=1.0,
        )
        for index, mount in enumerate(_mounts(count))
    ]


@dataclass
class _Spawn:
    length: float
    width: float
    palette: int
    flagella: int
    activity: float
    capsule: float
    tumble_rate: float


SPAWN: tuple[_Spawn, ...] = (
    _Spawn(1.50, 0.75, 0, 0, 0.00, 0.0, 0.0),
)


@dataclass
class World:
    rng: random.Random = field(default_factory=lambda: random.Random(26))
    time: float = 0.0
    cells: list[Cell] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.cells:
            self.cells = self._spawn()
            for _ in range(8):
                self._separate(1.0)

    def _spawn(self) -> list[Cell]:
        cells: list[Cell] = []
        for index, spec in enumerate(SPAWN):
            cell_id = index + 1
            cell = Cell(
                id=cell_id,
                x=0.0,
                y=0.0,
                angle=0.0,
                length=spec.length,
                width=spec.width,
                palette=spec.palette,
                seed=1000 + cell_id * 17,
                capsule=spec.capsule,
                motor_activity=spec.activity,
                flagella=_make_flagella(cell_id, spec.flagella, spec.length),
                run_left=self.rng.expovariate(spec.tumble_rate) if spec.tumble_rate > 0.0 else 1.0e9,
            )
            cells.append(cell)
        return cells

    def step(self, dt: float) -> None:
        if dt <= 0.0:
            return
        dt = min(dt, 0.05)
        for cell in self.cells:
            self._integrate(cell, dt)
        self._separate(dt)
        self._constrain_walls()
        self.time += dt

    def _integrate(self, cell: Cell, dt: float) -> None:
        cell.contact_cooldown = max(0.0, cell.contact_cooldown - dt)
        rate = self._tumble_rate(cell)
        if cell.tumbling:
            cell.tumble_left -= dt
            cell.omega = cell.tumble_omega
            if cell.tumble_left <= 0.0:
                cell.tumbling = False
                cell.tumble_left = 0.0
                cell.run_left = self.rng.expovariate(rate) if rate > 0.0 else 1.0e9
        else:
            cell.run_left -= dt
            cell.drift += self.rng.gauss(0.0, 0.55) * dt
            cell.drift *= math.exp(-dt / 0.7)
            cell.omega = cell.drift
            if rate > 0.0 and cell.run_left <= 0.0:
                self._begin_tumble(cell)

        drag = cell.parallel_drag()
        speed = cell.thrust() / drag
        ax = math.cos(cell.angle)
        ay = math.sin(cell.angle)
        fx, fy = flow_at(cell.x, cell.y)
        cell.vx = fx + ax * speed
        cell.vy = fy + ay * speed
        cell.x += cell.vx * dt
        cell.y += cell.vy * dt
        cell.angle = math.atan2(math.sin(cell.angle + cell.omega * dt), math.cos(cell.angle + cell.omega * dt))

    def _tumble_rate(self, cell: Cell) -> float:
        if cell.motor_activity <= 0.0 or not cell.flagella:
            return 0.0
        spec = SPAWN[cell.id - 1]
        return spec.tumble_rate

    def _begin_tumble(self, cell: Cell) -> None:
        cell.tumbling = True
        cell.tumble_left = self.rng.uniform(0.10, 0.18)
        cell.tumble_omega = self.rng.choice((-1.0, 1.0)) * self.rng.uniform(5.5, 10.0)
        cell.contact_cooldown = max(cell.contact_cooldown, 0.25)

    def _separate(self, _dt: float) -> None:
        cells = self.cells
        for _ in range(3):
            for i in range(len(cells)):
                for j in range(i + 1, len(cells)):
                    self._separate_pair(cells[i], cells[j])

    def _separate_pair(self, a: Cell, b: Cell) -> None:
        a0, a1, ar = _centerline(a)
        b0, b1, br = _centerline(b)
        c1, c2 = _closest_points(a0, a1, b0, b1)
        dx = c1[0] - c2[0]
        dy = c1[1] - c2[1]
        dist = math.hypot(dx, dy)
        target = ar + br
        if dist >= target:
            return
        if dist < 1.0e-6:
            dx = a.x - b.x
            dy = a.y - b.y
            dist = math.hypot(dx, dy)
            if dist < 1.0e-6:
                dx, dy, dist = 1.0, 0.0, 1.0
        nx = dx / dist
        ny = dy / dist
        push = (target - dist) * 0.5
        a.x += nx * push
        a.y += ny * push
        b.x -= nx * push
        b.y -= ny * push

    def _constrain_walls(self) -> None:
        for cell in self.cells:
            shape = cell.capsule_shape()
            ax = abs(math.cos(cell.angle))
            ay = abs(math.sin(cell.angle))
            reach_x = shape.half_segment * ax + shape.radius
            reach_y = shape.half_segment * ay + shape.radius
            hit = False
            if cell.x - reach_x < -HALF_WIDTH:
                cell.x = -HALF_WIDTH + reach_x
                if cell.vx < 0.0:
                    cell.vx = 0.0
                hit = True
            elif cell.x + reach_x > HALF_WIDTH:
                cell.x = HALF_WIDTH - reach_x
                if cell.vx > 0.0:
                    cell.vx = 0.0
                hit = True
            if cell.y - reach_y < -HALF_HEIGHT:
                cell.y = -HALF_HEIGHT + reach_y
                if cell.vy < 0.0:
                    cell.vy = 0.0
                hit = True
            elif cell.y + reach_y > HALF_HEIGHT:
                cell.y = HALF_HEIGHT - reach_y
                if cell.vy > 0.0:
                    cell.vy = 0.0
                hit = True
            if hit and cell.contact_cooldown <= 0.0 and cell.motor_activity > 0.0 and cell.flagella:
                self._begin_tumble(cell)

    def snapshot(self) -> dict:
        return {
            "v": 1,
            "t": self.time,
            "view": {
                "half_width": HALF_WIDTH,
                "half_height": HALF_HEIGHT,
                "logical_width": LOGICAL_WIDTH,
                "logical_height": LOGICAL_HEIGHT,
                "pixels_per_unit": PIXELS_PER_UNIT,
            },
            "cells": [cell.to_dict() for cell in self.cells],
        }


def _centerline(cell: Cell) -> tuple[tuple[float, float], tuple[float, float], float]:
    shape = cell.capsule_shape()
    ax = math.cos(cell.angle)
    ay = math.sin(cell.angle)
    h = shape.half_segment
    p0 = (cell.x - ax * h, cell.y - ay * h)
    p1 = (cell.x + ax * h, cell.y + ay * h)
    return p0, p1, shape.radius


def _closest_points(
    p1: tuple[float, float],
    q1: tuple[float, float],
    p2: tuple[float, float],
    q2: tuple[float, float],
) -> tuple[tuple[float, float], tuple[float, float]]:
    d1 = (q1[0] - p1[0], q1[1] - p1[1])
    d2 = (q2[0] - p2[0], q2[1] - p2[1])
    r = (p1[0] - p2[0], p1[1] - p2[1])
    a = d1[0] * d1[0] + d1[1] * d1[1]
    e = d2[0] * d2[0] + d2[1] * d2[1]
    f = d2[0] * r[0] + d2[1] * r[1]
    b = d1[0] * d2[0] + d1[1] * d2[1]
    c = d1[0] * r[0] + d1[1] * r[1]
    denom = a * e - b * b

    if a <= 1.0e-12 and e <= 1.0e-12:
        return p1, p2
    if a <= 1.0e-12:
        s = 0.0
        t = min(max(f / e, 0.0), 1.0)
    elif e <= 1.0e-12:
        t = 0.0
        s = min(max(-c / a, 0.0), 1.0)
    else:
        s = min(max((b * f - c * e) / denom, 0.0), 1.0) if denom != 0.0 else 0.0
        t = (b * s + f) / e
        if t < 0.0:
            t = 0.0
            s = min(max(-c / a, 0.0), 1.0)
        elif t > 1.0:
            t = 1.0
            s = min(max((b - c) / a, 0.0), 1.0)

    c1 = (p1[0] + d1[0] * s, p1[1] + d1[1] * s)
    c2 = (p2[0] + d2[0] * t, p2[1] + d2[1] * t)
    return c1, c2
