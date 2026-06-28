#!/usr/bin/env python3
"""Convert green-screen PNGs to transparent PNGs."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def _sample_green_floor(img: Image.Image) -> tuple[int, int]:
    w, h = img.size
    rgb = img.convert("RGB")
    greens = []
    for xy in ((1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2), (w // 2, 1), (w // 2, h - 2)):
        r, g, b = rgb.getpixel(xy)
        if g > r + 20 and g > b + 20:
            greens.append(g)
    g_min = min(greens) - 12 if greens else 140
    return max(90, g_min), 60


def chroma_key(path: Path, out: Path) -> None:
    img = Image.open(path).convert("RGBA")
    g_min, tolerance = _sample_green_floor(img)
    pixels = img.load()
    width, height = img.size

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if g > g_min and g > r + tolerance and g > b + tolerance:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            if g > max(r, b) + 10:
                avg_rb = (r + b) // 2
                pixels[x, y] = (r, min(g, avg_rb + 6), b, a)

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def main() -> int:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.png> <output.png>", file=sys.stderr)
        return 1
    chroma_key(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"Wrote {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())