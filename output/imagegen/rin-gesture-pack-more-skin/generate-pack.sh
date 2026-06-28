#!/bin/bash
set -euo pipefail

BASE="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-more-skin"
ORIG="/Users/michael/.dotfiles/output/imagegen/rin-gesture-pack-original-outfit/transparent"
STYLE_REF="$BASE/transparent/13-soft-loyal-smile.png"
SKIN="Keep the exact same pose, gesture, face, hair, and framing. Match the more-skin style reference: black-and-pink tactical harness with open cutout panels exposing bare skin (midriff, shoulders, upper chest) — no mesh or fishnet fabric, just straps and glossy skin between panels. Dewy luminous skin sheen. Purple eyes, long magenta-pink wet hair, black fingerless gloves with pink trim. AAA photoreal studio render. Solid bright green chroma-key background."

generate_one() {
  local id="$1" slug="$2" gesture="$3" framing="$4"
  local ref="$ORIG/${id}-${slug}.png"
  local raw="$BASE/raw/${id}-${slug}.png"
  local out="$BASE/transparent/${id}-${slug}.png"
  echo "=== Generating ${id}-${slug} ==="
  generate-image "Photorealistic ${framing} of fictional character Rin. ${SKIN} Gesture: ${gesture}." \
    -i "$ref" -i "$STYLE_REF" --provider gemini-pro --size 1024x1536 -o "$raw"
  python3 "$BASE/scripts/chroma-green.py" "$raw" "$out"
}

generate_one "01" "smirk-i-knew-it" "right hand near chin, knowing smirk, I knew it expression" "waist-up portrait"
generate_one "02" "finger-wag-absolutely-not" "index finger pointing at viewer in finger-wag absolutely-not pose, other hand on hip" "waist-up portrait"
generate_one "03" "celebration-jump" "mid-air celebration jump, both arms raised high, joyful expression" "full-body portrait"
generate_one "04" "dancing" "playful dancing pose, arms out, hair in motion" "full-body portrait"
generate_one "05" "blowing-kiss" "blowing a kiss toward camera, flirtatious" "waist-up portrait"
generate_one "06" "pout" "arms crossed, lips pursed pout" "waist-up portrait"
generate_one "07" "sad-sympathetic" "gentle sympathetic gesture, hand on chest, palm up" "waist-up portrait"
generate_one "08" "laughing" "laughing openly, hand near mouth" "waist-up portrait"
generate_one "09" "focused-troubleshooting" "crouched holding small tablet, focused troubleshooting" "waist-up portrait"
generate_one "10" "skeptical-eyebrow" "arms crossed, one eyebrow raised skeptical look" "waist-up portrait"
generate_one "11" "tiny-correction" "index finger raised upward tiny correction gesture" "waist-up portrait"
generate_one "12" "evil-little-genius-grin" "hand near chin, mischievous evil little genius grin" "waist-up portrait"
generate_one "13" "soft-loyal-smile" "hand near collarbone, soft loyal warm smile" "waist-up portrait"

echo "Done."