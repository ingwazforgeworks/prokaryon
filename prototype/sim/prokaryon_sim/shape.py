"""Analytic capsule queries. Matches Prokaryon visuals spec §7.2."""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Capsule:
    half_segment: float
    radius: float

    @classmethod
    def from_length_width(cls, length: float, width: float) -> Capsule:
        if not math.isfinite(length) or not math.isfinite(width):
            raise ValueError("capsule dimensions must be finite")
        if width <= 0.0 or length <= 0.0:
            raise ValueError("capsule dimensions must be positive")
        if length < width:
            raise ValueError("capsule length must be >= width")
        radius = width * 0.5
        half_segment = max(0.0, length * 0.5 - radius)
        return cls(half_segment, radius)

    def distance(self, x: float, y: float) -> float:
        nearest_x = min(max(x, -self.half_segment), self.half_segment)
        dx = x - nearest_x
        return math.hypot(dx, y) - self.radius

    def area(self) -> float:
        r = self.radius
        return 4.0 * self.half_segment * r + math.pi * r * r

    def negative_pole(self) -> tuple[float, float]:
        return (-(self.half_segment + self.radius), 0.0)

    def positive_pole(self) -> tuple[float, float]:
        return (self.half_segment + self.radius, 0.0)
