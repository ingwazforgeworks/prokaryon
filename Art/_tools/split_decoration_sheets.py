"""Cut decoration sprite sheets into individual PNGs.

Mirrors the client's old flood fill: 4-connected components above an alpha
threshold, dropping specks under the minimum area, then padding each sprite
by a few pixels. Output names follow the same sheet order and top-to-bottom
sort, so fragment_00 and the rest stay the sprites already placed in the world.

Run from anywhere:
  python Art/_tools/split_decoration_sheets.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "Environment"
OUT = ROOT / "decorations" / "cut"

SHEETS = [
    ("close_foreground_out_of_plane", "Nine blurred porous foreground fragments.png", "fore", "Fragment", 48, 8000, 8),
    ("close_foreground_out_of_plane", "Six Blurred Porous Foreground Fragments (1).png", "fore", "Fragment", 48, 8000, 8),
    ("far_background_out_of_plane", "Defocused curved tendril sprite sheet.png", "back", "Tendril", 24, 4000, 8),
    ("far_background_out_of_plane", "Eight delicate curved tendril assets.png", "back", "Tendril", 24, 2500, 8),
    ("far_background_out_of_plane", "Faint microscopic tendril asset sheet.png", "back", "Tendril", 16, 2000, 8),
    ("far_background_out_of_plane", "Dim background rock sprite sheet.png", "back", "Rock", 24, 8000, 8),
    ("far_background_out_of_plane", "Twelve Dim Microscopic Rock Formations.png", "back", "Rock", 24, 8000, 8),
    ("decorations", "Porous Microscopic Edge Extension Sheet.png", "mid", "Edge", 24, 4000, 6),
]


def split_sheet(alpha: np.ndarray, threshold: int, min_area: int, pad: int) -> tuple[np.ndarray, list[dict]]:
    height, width = alpha.shape
    count = width * height
    mask = (alpha.reshape(-1) > threshold).astype(np.uint8)
    seen = np.zeros(count, np.uint8)
    owner = np.zeros(count, np.int32)
    stack = np.empty(count, np.int32)
    members = np.empty(count, np.int32)
    boxes: list[dict] = []
    written = 0
    next_id = 1
    for start in range(count):
        if mask[start] == 0 or seen[start]:
            continue
        top = 0
        stack[0] = start
        top = 1
        seen[start] = 1
        member_start = written
        min_x = width
        min_y = height
        max_x = 0
        max_y = 0
        while top > 0:
            top -= 1
            index = int(stack[top])
            members[written] = index
            written += 1
            x = index % width
            y = index // width
            if x < min_x:
                min_x = x
            if y < min_y:
                min_y = y
            if x > max_x:
                max_x = x
            if y > max_y:
                max_y = y
            if x > 0 and mask[index - 1] and not seen[index - 1]:
                seen[index - 1] = 1
                stack[top] = index - 1
                top += 1
            if x + 1 < width and mask[index + 1] and not seen[index + 1]:
                seen[index + 1] = 1
                stack[top] = index + 1
                top += 1
            if y > 0 and mask[index - width] and not seen[index - width]:
                seen[index - width] = 1
                stack[top] = index - width
                top += 1
            if y + 1 < height and mask[index + width] and not seen[index + width]:
                seen[index + width] = 1
                stack[top] = index + width
                top += 1
        if written - member_start < min_area:
            continue
        box_id = next_id
        next_id += 1
        boxes.append({"id": box_id, "minX": min_x, "minY": min_y, "maxX": max_x + 1, "maxY": max_y + 1})
        owner[members[member_start:written]] = box_id

    dist = np.full(count, 255, np.uint8)
    queue = np.empty(count, np.int32)
    head = 0
    tail = 0
    for index in np.flatnonzero(owner):
        dist[index] = 0
        queue[tail] = index
        tail += 1
    while head < tail:
        index = int(queue[head])
        head += 1
        if dist[index] >= pad:
            continue
        x = index % width
        y = index // width
        nxt = int(dist[index]) + 1
        box_id = int(owner[index])
        box = boxes[box_id - 1]
        if x > 0 and owner[index - 1] == 0 and dist[index - 1] == 255:
            owner[index - 1] = box_id
            dist[index - 1] = nxt
            queue[tail] = index - 1
            tail += 1
            if x - 1 < box["minX"]:
                box["minX"] = x - 1
        if x + 1 < width and owner[index + 1] == 0 and dist[index + 1] == 255:
            owner[index + 1] = box_id
            dist[index + 1] = nxt
            queue[tail] = index + 1
            tail += 1
            if x + 2 > box["maxX"]:
                box["maxX"] = x + 2
        if y > 0 and owner[index - width] == 0 and dist[index - width] == 255:
            owner[index - width] = box_id
            dist[index - width] = nxt
            queue[tail] = index - width
            tail += 1
            if y - 1 < box["minY"]:
                box["minY"] = y - 1
        if y + 1 < height and owner[index + width] == 0 and dist[index + width] == 255:
            owner[index + width] = box_id
            dist[index + width] = nxt
            queue[tail] = index + width
            tail += 1
            if y + 2 > box["maxY"]:
                box["maxY"] = y + 2
    boxes.sort(key=lambda box: (box["minY"], box["minX"]))
    return owner.reshape(height, width), boxes


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    counts: dict[str, int] = {}
    manifest: list[dict[str, str]] = []
    for folder, name, group, label, threshold, min_area, pad in SHEETS:
        path = ROOT / folder / name
        image = np.array(Image.open(path).convert("RGBA"))
        owner, boxes = split_sheet(image[:, :, 3], threshold, min_area, pad)
        print(f"{label:10} {len(boxes):3}  {name}")
        for box in boxes:
            index = counts.get(label, 0)
            counts[label] = index + 1
            file_name = f"{label.lower()}_{index:02d}.png"
            min_x, min_y, max_x, max_y = box["minX"], box["minY"], box["maxX"], box["maxY"]
            crop = image[min_y:max_y, min_x:max_x].copy()
            crop[:, :, 3] = np.where(owner[min_y:max_y, min_x:max_x] == box["id"], crop[:, :, 3], 0)
            Image.fromarray(crop, "RGBA").save(OUT / file_name)
            manifest.append({"file": file_name, "group": group, "label": label})
    (OUT / "index.json").write_text(json.dumps({"sprites": manifest}, indent=2) + "\n", encoding="utf-8")
    print("wrote", len(manifest), "sprites to", OUT)


if __name__ == "__main__":
    main()
