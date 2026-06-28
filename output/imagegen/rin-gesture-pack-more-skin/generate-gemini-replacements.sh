#!/bin/bash
set -euo pipefail

BASE="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-more-skin"
ORIG="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-original-outfit/transparent"
STYLE_REF="$BASE/transparent/13-soft-loyal-smile.png"
KEY="$BASE/scripts/chroma-green.py"
LOG="$BASE/generate-gemini.log"
: > "$LOG"

SKIN="Keep the exact same pose, gesture, face, hair, and framing. Match the more-skin style reference: black-and-pink tactical harness with open cutout panels exposing bare skin (midriff, shoulders, upper chest) — no mesh or fishnet fabric, just straps and glossy skin between panels. Dewy luminous skin sheen. Purple eyes, long magenta-pink wet hair, black fingerless gloves with pink trim. AAA photoreal studio render. Solid bright green chroma-key background."

generate_one() {
  local id="$1" slug="$2" gesture="$3" framing="$4"
  local ref="$ORIG/${id}-${slug}.png"
  local raw="$BASE/raw/${id}-${slug}.png"
  local out="$BASE/transparent/${id}-${slug}.png"
  echo "=== ${id}-${slug} ===" | tee -a "$LOG"
  if generate-image "Photorealistic ${framing} of fictional character Rin. ${SKIN} Gesture: ${gesture}." \
    -i "$ref" -i "$STYLE_REF" --provider gemini-pro --size 1024x1536 -o "$raw" >> "$LOG" 2>&1; then
    python3 "$KEY" "$raw" "$out"
    echo "OK ${id}-${slug}" >> "$LOG"
  else
    echo "FAIL ${id}-${slug}" >> "$LOG"
    return 1
  fi
}

set +e
generate_one "04" "dancing" "playful dancing pose, arms out to sides, hair in motion, energetic" "full-body portrait"
generate_one "05" "blowing-kiss" "blowing a kiss toward camera, flirtatious" "waist-up portrait"
generate_one "06" "pout" "arms crossed, lips pursed pout" "waist-up portrait"
generate_one "07" "sad-sympathetic" "gentle sympathetic gesture, hand on chest, palm up" "waist-up portrait"
generate_one "08" "laughing" "laughing openly, hand near mouth" "waist-up portrait"
generate_one "10" "skeptical-eyebrow" "arms crossed, one eyebrow raised skeptical look" "waist-up portrait"
generate_one "12" "evil-little-genius-grin" "hand near chin, mischievous evil little genius grin" "waist-up portrait"
echo "DONE" >> "$LOG"