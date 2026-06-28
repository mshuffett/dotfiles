#!/bin/bash
set -euo pipefail

BASE="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-more-skin"
for raw in "$BASE"/raw/*.png; do
  slug="$(basename "$raw")"
  python3 "$BASE/scripts/chroma-green.py" "$raw" "$BASE/transparent/$slug"
done
echo "Re-keyed $(ls "$BASE"/raw/*.png | wc -l | tr -d ' ') images."