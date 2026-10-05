"""Shape and physics checks for the cell lab."""

from __future__ import annotations

import math
import unittest

from prokaryon_sim.shape import Capsule
from prokaryon_sim.world import HALF_HEIGHT, HALF_WIDTH, World, _closest_points


class CapsuleTests(unittest.TestCase):
    def test_circle_limit(self) -> None:
        shape = Capsule.from_length_width(0.9, 0.9)
        self.assertAlmostEqual(shape.half_segment, 0.0)
        self.assertAlmostEqual(shape.distance(0.0, 0.0), -0.45)
        self.assertAlmostEqual(shape.distance(0.45, 0.0), 0.0, places=6)

    def test_reference_capsule(self) -> None:
        length, width = 1.5, 0.75
        shape = Capsule.from_length_width(length, width)
        radius = 0.375
        half = 0.375
        self.assertAlmostEqual(shape.half_segment, half)
        self.assertAlmostEqual(shape.distance(0.0, 0.0), -radius)
        self.assertAlmostEqual(shape.distance(half + radius, 0.0), 0.0, places=6)
        self.assertAlmostEqual(shape.distance(0.0, radius), 0.0, places=6)
        self.assertGreater(shape.distance(half + radius + 0.1, 0.0), 0.0)
        self.assertAlmostEqual(shape.area(), 4.0 * half * radius + math.pi * radius * radius)

    def test_rejects_invalid_dimensions(self) -> None:
        with self.assertRaises(ValueError):
            Capsule.from_length_width(0.5, 0.8)


class GeometryTests(unittest.TestCase):
    def test_parallel_segments(self) -> None:
        c1, c2 = _closest_points((0.0, 0.0), (1.0, 0.0), (0.0, 1.0), (1.0, 1.0))
        self.assertAlmostEqual(math.hypot(c1[0] - c2[0], c1[1] - c2[1]), 1.0)

    def test_crossing_segments(self) -> None:
        c1, c2 = _closest_points((0.0, 0.0), (2.0, 0.0), (1.0, -1.0), (1.0, 1.0))
        self.assertAlmostEqual(c1[0], 1.0, places=5)
        self.assertAlmostEqual(c1[1], 0.0, places=5)
        self.assertAlmostEqual(c2[0], 1.0, places=5)
        self.assertAlmostEqual(c2[1], 0.0, places=5)


class WorldTests(unittest.TestCase):
    def test_stays_finite_and_inside_arena(self) -> None:
        world = World()
        dt = 1.0 / 60.0
        for _ in range(60 * 5):
            world.step(dt)
        self.assertGreater(world.time, 4.9)
        for cell in world.cells:
            self.assertTrue(math.isfinite(cell.x))
            self.assertTrue(math.isfinite(cell.y))
            self.assertTrue(math.isfinite(cell.angle))
            shape = cell.capsule_shape()
            self.assertGreaterEqual(cell.x - shape.radius, -HALF_WIDTH - 0.05)
            self.assertLessEqual(cell.x + shape.radius, HALF_WIDTH + 0.05)
            self.assertGreaterEqual(cell.y - shape.radius, -HALF_HEIGHT - 0.05)
            self.assertLessEqual(cell.y + shape.radius, HALF_HEIGHT + 0.05)

    def test_lab_cell_holds_still(self) -> None:
        world = World()
        self.assertEqual(len(world.cells), 1)
        cell = world.cells[0]
        self.assertEqual(cell.flagella, [])
        self.assertEqual(cell.thrust(), 0.0)
        self.assertAlmostEqual(cell.x, 0.0)
        self.assertAlmostEqual(cell.y, 0.0)

    def test_snapshot_contract(self) -> None:
        snap = World().snapshot()
        self.assertEqual(snap["v"], 1)
        self.assertEqual(snap["view"]["logical_width"], 640)
        self.assertEqual(snap["view"]["pixels_per_unit"], 32)
        self.assertEqual(len(snap["cells"]), 1)
        self.assertEqual(snap["cells"][0]["motor"], "idle")
        self.assertEqual(snap["cells"][0]["flagella"], [])


if __name__ == "__main__":
    unittest.main()
