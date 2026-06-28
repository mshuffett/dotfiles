#!/usr/bin/env python3
"""Remove near-white studio backgrounds from cutout sources."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def remove_near_white(path: Path, out: Path, threshold: int = 238, tolerance: int = 18) -> None:
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
                continue
            spread = max(r, g, b) - min(r, g, b)
            avg = (r + g + b) / 3
            if avg >= threshold - tolerance and spread <= 12:
                pixels[x, y] = (r, g, b, 0)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def main() -> int:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input> <output.png>", file=sys.stderr)
        return 1
    remove_near_white(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"Wrote {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())