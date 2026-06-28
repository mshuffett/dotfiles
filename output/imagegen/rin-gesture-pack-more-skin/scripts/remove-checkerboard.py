#!/usr/bin/env python3
"""Remove fake checkerboard / gray-white studio backdrops."""

from __future__ import annotations

import collections
import sys
from pathlib import Path

from PIL import Image


def _is_backdrop(r: int, g: int, b: int) -> bool:
    spread = max(r, g, b) - min(r, g, b)
    avg = (r + g + b) / 3.0
    if r >= 235 and g >= 235 and b >= 235:
        return True
    if spread <= 10 and 95 <= avg <= 225:
        return True
    return False


def remove_backdrop(path: Path, out: Path) -> None:
    img = Image.open(path).convert("RGBA")
    px = img.load()
    w, h = img.size
    seen: set[tuple[int, int]] = set()
    queue: collections.deque[tuple[int, int]] = collections.deque()

    for seed in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)):
        if _is_backdrop(*px[seed][:3]):
            queue.append(seed)
            seen.add(seed)

    while queue:
        x, y = queue.popleft()
        r, g, b, _a = px[x, y]
        if _is_backdrop(r, g, b):
            px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen:
                if _is_backdrop(*px[nx, ny][:3]):
                    seen.add((nx, ny))
                    queue.append((nx, ny))

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def main() -> int:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input> <output.png>", file=sys.stderr)
        return 1
    remove_backdrop(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"Wrote {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())