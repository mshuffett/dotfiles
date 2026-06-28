#!/usr/bin/env python3
"""Clean transparent PNG cutouts: flood-fill bg remnants, defringe, despill."""

from __future__ import annotations

import collections
import sys
from pathlib import Path

from PIL import Image


def _luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def _saturation(r: int, g: int, b: int) -> float:
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == 0:
        return 0.0
    return (mx - mn) / mx


def _flood_fill_background(img: Image.Image, tolerance: int = 28) -> None:
    px = img.load()
    w, h = img.size
    seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)]
    visited = set()
    queue: collections.deque[tuple[int, int]] = collections.deque()

    for sx, sy in seeds:
        if px[sx, sy][3] == 0:
            continue
        sr, sg, sb, _ = px[sx, sy]
        queue.append((sx, sy))
        visited.add((sx, sy))
        while queue:
            x, y = queue.popleft()
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if abs(r - sr) + abs(g - sg) + abs(b - sb) > tolerance * 3:
                continue
            px[x, y] = (r, g, b, 0)
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))


def _defringe(img: Image.Image) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            touches_transparent = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 20:
                    touches_transparent = True
                    break
            if not touches_transparent:
                continue

            lum = _luminance(r, g, b)
            sat = _saturation(r, g, b)
            if lum > 210 and sat < 0.12:
                px[x, y] = (r, g, b, 0)
            elif lum < 55 and sat < 0.25:
                px[x, y] = (r, g, b, 0)
            elif lum < 90 and sat < 0.08:
                px[x, y] = (r, g, b, 0)


def _despill_green(img: Image.Image) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            if g <= max(r, b) + 8:
                continue
            avg_rb = (r + b) // 2
            g2 = min(g, avg_rb + max(4, (g - avg_rb) // 3))
            px[x, y] = (r, g2, b, a)


def _remove_speckles(img: Image.Image, min_area: int = 24) -> None:
    px = img.load()
    w, h = img.size
    seen = set()
    for y in range(h):
        for x in range(w):
            if (x, y) in seen or px[x, y][3] < 20:
                continue
            stack = [(x, y)]
            comp = []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in seen and px[nx, ny][3] >= 20:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            if len(comp) < min_area:
                for cx, cy in comp:
                    px[cx, cy] = (0, 0, 0, 0)


def clean_cutout(path: Path, out: Path) -> None:
    img = Image.open(path).convert("RGBA")
    _flood_fill_background(img)
    _defringe(img)
    _defringe(img)
    _despill_green(img)
    _remove_speckles(img)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)


def main() -> int:
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input.png> <output.png>", file=sys.stderr)
        return 1
    clean_cutout(Path(sys.argv[1]), Path(sys.argv[2]))
    print(f"Wrote {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())