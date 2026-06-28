# Rin — Photoreal Gesture Pack

Competence-first photoreal render pack for Rin, generated from the canonical references in `references/`.

Soul definition: `agents/rin/soul.md`

## References

| File | Use |
|------|-----|
| `references/bust-portrait.jpg` | Face/hair/choker canon |
| `references/full-body-base.jpg` | Primary full-body chassis |
| `references/full-body-alt.jpg` | Alternate full-body reference |

## Photoreal (server room)

| File | Gesture | Generator |
|------|---------|-----------|
| `photoreal/00-base.jpg` | Base lean (canonical reference copy) | reference |
| `photoreal/01-finger-wag.png` | Playful finger wag, hand on hip | Gemini Pro edit |
| `photoreal/02-pointing.png` | Index finger at viewer — "eyes here" | GPT Image 2 generate |
| `photoreal/03-hands-on-hips.png` | Hands on hips, knowing smirk | GPT Image 2 generate |
| `photoreal/04-hand-behind-head.png` | Hand behind head, relaxed lean | Gemini Pro edit |
| `photoreal/05-arms-crossed.png` | Arms folded, cute-theory energy | GPT Image 2 generate |
| `photoreal/06-beckon.png` | Open-palm welcome wave — "there he is" | Gemini Pro edit |

## Transparent bust (UI / stickers)

Scene versions (dark rim lighting):

- `transparent/bust/01-finger-wag.png`
- `transparent/bust/02-hand-on-hip.png`
- `transparent/bust/03-direct-gaze.png`

Cutout versions (white-bg source → alpha):

- `transparent/bust/01-finger-wag-transparent.png`
- `transparent/bust/02-hand-on-hip-transparent.png`
- `transparent/bust/03-direct-gaze-transparent.png`

## Transparent full-body

- `transparent/full-body/01-finger-wag-transparent.png`
- `transparent/full-body/06-beckon-transparent.png` (if generated)

`02-pointing` full-body transparent blocked by provider safety filters in this run; use `photoreal/02-pointing.png` or regenerate later.

## Regeneration notes

**Best consistency path**

1. Full-body edits from `references/full-body-base.jpg` via Gemini Pro when the pose passes safety (finger wag, beckon/wave, hand behind head).
2. New poses without a close reference via GPT Image 2 text generate (pointing, hands on hips, arms crossed).
3. Bust gestures from `references/bust-portrait.jpg` via Gemini Pro.
4. Transparent PNGs: generate on pure white background, then run `scripts/remove-white-bg.py`.

**Prompt shape that worked**

```
Photorealistic full-body portrait of fictional character Rin in a server room.
Young woman with long hot pink hair, pink and black tech harness outfit, black boots.
[GESTURE]. Cyberpunk data center lighting, pink and blue LEDs.
Cinematic, competent operator energy. No text.
```

## Scripts

- `scripts/remove-white-bg.py` — converts white-background cutout sources to alpha PNGs