#!/bin/bash
set -euo pipefail

BASE="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-more-skin"
KEY="$BASE/scripts/chroma-green.py"

for id_slug in \
  01-smirk-i-knew-it \
  02-finger-wag-absolutely-not \
  03-celebration-jump \
  09-focused-troubleshooting \
  11-tiny-correction \
  13-soft-loyal-smile; do
  python3 "$KEY" "$BASE/raw/${id_slug}.png" "$BASE/transparent/${id_slug}.png"
done