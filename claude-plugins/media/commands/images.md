---
description: Use when generating images; choose provider (Gemini/Gemini Pro/OpenAI/Imagen), ensure API keys, and select size/output options.
---

# Image Generation

Use the `generate-image` command to create images with Google Gemini, Imagen, or OpenAI:

## When to Use (Triggers)
- You are asked to generate images or visual assets

## Acceptance Checks
- [ ] Provider chosen based on need (see Provider Selection below)
- [ ] Required API key is present in env
- [ ] Size/output options selected appropriately

## Provider Selection
- **gemini-pro** (default) — Better text rendering, higher resolution (up to 4K), best quality
- **gemini** — Faster generation, use when speed matters over quality
- **imagen** — Google Imagen 4.0, photorealistic
- **openai** — DALL-E 3, good for creative/artistic images

## Commands
- `generate-image "prompt"` — generates a 1024x1024 image with Gemini Pro (default)
- `generate-image "prompt" --provider gemini` — uses Nano Banana (faster)
- `generate-image "prompt" --provider gemini-pro --size 2048x2048` — high-res with Pro
- `generate-image "prompt" --provider openai` — generates image with OpenAI DALL‑E 3
- `generate-image "prompt" --provider imagen` — generates image with Imagen 4.0
- `generate-image "prompt" --size 1024x1536` — portrait
- `generate-image "prompt" --output filename.png` — saves with specific filename
- `generate-image "prompt" -i input.png` — edit/transform an input image
- `generate-image "prompt" -i style.png -i content.png` — multi-image (style transfer, composition)
- `generate-image "prompt" --url-only` — returns URL without downloading (OpenAI only)
- `generate-image --help` — shows all available options

## Input Images (Gemini only)
Use `-i` or `--input` to provide reference images for editing, style transfer, or composition:
- **Single image editing**: `generate-image "Make this more vibrant" -i photo.png`
- **Style transfer**: `generate-image "Apply the style of first image to second" -i style.png -i content.png`
- **Multi-image composition**: Up to 14 images with Gemini Pro, 3 with Gemini Flash
- Supports: PNG, JPEG, WebP, GIF

## Providers & Models
| Provider | Model ID | Codename | Best For |
|----------|----------|----------|----------|
| `gemini-pro` | gemini-3-pro-image-preview | Nano Banana Pro | Best quality, text (default) |
| `gemini` | gemini-2.5-flash-image | Nano Banana | Faster, general use |
| `imagen` | imagen-4.0-generate-001 | Imagen 4.0 | Photorealistic |
| `openai` | dall-e-3 | DALL-E 3 | Creative/artistic |

## Sizes
- Standard (all providers): 1024x1024, 1024x1536, 1536x1024
- Gemini Pro only: 2048x2048, 2048x3072, 3072x2048

## Environment Variables
- `GEMINI_API_KEY` — required for gemini, gemini-pro, and imagen providers
- `OPENAI_API_KEY` — required for openai provider

## Prompting Tips for Gemini Pro (Nano Banana Pro)
Nano Banana Pro excels with highly detailed prompts. Include:
- **Style**: "editorial photography", "vintage poster", "cinematic", "flat lay"
- **Color palette**: Specific colors and how they interact ("warm orange glow contrasting with cool blue shadows")
- **Lighting**: Direction, quality, mood ("harsh overhead spotlight", "golden hour backlight")
- **Composition**: Camera angle, framing ("overhead shot", "low angle", "shallow depth of field")
- **Texture**: "film grain", "halftone dots", "distressed paper", "chalk texture"
- **Specific text**: Enclose in single quotes within the prompt
- **Mood/energy**: "moody", "triumphant", "chaotic but clean"

Example detailed prompt:
```
"A vintage boxing poster style illustration. Bold distressed typography at top: 'ACCOUNTABILITY CLUB' in chunky serif font, cream color. Center: two silhouetted figures at laptops facing each other. Background: deep navy blue with halftone texture. Accent: bright orange. Worn paper texture, torn edges. Style: screenprint aesthetic."
```

The command is available at `~/bin/generate-image` (symlinked from `~/.dotfiles/bin/generate-image`).

## Batch Image Generation Workflow

When generating multiple related images (slides, assets, variations):

### Before Starting
1. **Establish design system first** — don't generate ad-hoc
2. **Create reference images** — generate 3-5 test images to validate aesthetic
3. **Document the design language** — colors (hex), typography, layout rules
4. **Note what works/doesn't** — update prompts based on results

### During Generation
- **Generate variations in parallel** — use multiple bash calls simultaneously
- **Be explicit about negatives** — "no gradients, no glows, no logos"
- **Use specific hex colors** — not "dark gray" but "#0a0a0a"
- **Avoid brand names** — describe style instead ("minimal dark aesthetic" not "Apple style")

### After Each Batch
- **Review and note patterns** — what prompt language worked?
- **Update skill/memory** — document successful prompts
- **Iterate on failures** — refine prompts, don't just regenerate

### Common Pitfalls
- Starting generation without design system = inconsistent results
- Vague color descriptions = wrong palette
- Mentioning brands = unwanted logos/elements
- Not specifying negatives = decorative clutter

See `~/.dotfiles/claude-plugins/media/skills/slide-design/SKILL.md` for presentation-specific guidance.
