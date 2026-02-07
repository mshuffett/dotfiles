---
name: Image Generation
description: Use when generating images, creating visual assets, or working with AI image generation providers (OpenAI GPT Image, Gemini, Imagen).
---

# Image Generation

Use the `generate-image` command to create images with OpenAI GPT Image 1.5, Google Gemini, or Imagen.

## When This Skill Activates

- User asks to generate images or visual assets
- Creating illustrations, mockups, or visual content
- User mentions "generate image", "create picture", "make illustration"
- Working with image editing or style transfer

## Provider Selection

- **openai** (default) - GPT Image 1.5, best quality, supports image editing, excellent text rendering
- **gemini-pro** - Nano Banana Pro, high resolution (up to 4K), great text rendering
- **gemini** - Nano Banana, faster generation, use when speed matters
- **imagen** - Google Imagen 4.0, photorealistic

## Commands

```bash
generate-image "prompt"                                    # 1024x1024 with GPT Image 1.5 (default)
generate-image "prompt" --quality high                     # higher fidelity, slower
generate-image "prompt" --provider gemini-pro              # uses Nano Banana Pro
generate-image "prompt" --provider gemini-pro --size 2048x2048  # high-res with Pro
generate-image "prompt" --provider gemini                  # uses Nano Banana (faster)
generate-image "prompt" --provider imagen                  # Imagen 4.0
generate-image "prompt" --size 1024x1536                   # portrait
generate-image "prompt" --output filename.png              # saves with specific filename
generate-image "prompt" -i input.png                       # edit/transform an input image
generate-image "prompt" -i input.png --mask mask.png       # targeted edit with mask (OpenAI)
generate-image "prompt" -i style.png -i content.png        # multi-image (style transfer)
generate-image "prompt" --url-only                         # returns URL without downloading (OpenAI only)
generate-image --help                                      # shows all available options
```

## Input Images

Use `-i` or `--input` to provide images for editing, style transfer, or composition:

| Provider    | Max Images | Behavior                          |
|-------------|------------|-----------------------------------|
| OpenAI      | 16         | Uses `/edits` endpoint, supports mask |
| Gemini Pro  | 14         | Multimodal reference/editing      |
| Gemini      | 3          | Multimodal reference/editing      |
| Imagen      | 0          | Generation only                   |

**OpenAI editing examples:**

```bash
generate-image "Make this more vibrant" -i photo.png
generate-image "Add a cat on the chair" -i room.png --mask chair-area.png
generate-image "Combine products into gift basket" -i item1.png -i item2.png -i item3.png
```

**Gemini reference examples:**

```bash
generate-image "Apply style of first to second" -i style.png -i content.png --provider gemini-pro
generate-image "Generate in this style" -i reference.png --provider gemini
```

## Mask Parameter (OpenAI only)

Use `-k` or `--mask` for targeted edits:
- Mask must be PNG with **transparent areas** indicating where to edit
- Must have same dimensions as input image
- Applied to first input image only

```bash
generate-image "Replace with a lake" -i landscape.png --mask sky-mask.png
```

## Providers and Models

| Provider     | Model ID                       | Codename         | Best For                         |
|--------------|--------------------------------|------------------|----------------------------------|
| `openai`     | gpt-image-1.5                  | GPT Image 1.5    | Best quality, editing (default)  |
| `gemini-pro` | gemini-3-pro-image-preview     | Nano Banana Pro  | High-res, text rendering         |
| `gemini`     | gemini-2.5-flash-image         | Nano Banana      | Faster, general use              |
| `imagen`     | imagen-4.0-generate-001        | Imagen 4.0       | Photorealistic                   |

## Sizes

- Standard (all providers): 1024x1024, 1024x1536, 1536x1024
- Gemini Pro only: 2048x2048, 2048x3072, 3072x2048

## Environment Variables

- `OPENAI_API_KEY` - required for openai provider (default)
- `GEMINI_API_KEY` - required for gemini, gemini-pro, and imagen providers

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

```text
"A vintage boxing poster style illustration. Bold distressed typography at top: 'ACCOUNTABILITY CLUB' in chunky serif font, cream color. Center: two silhouetted figures at laptops facing each other. Background: deep navy blue with halftone texture. Accent: bright orange. Worn paper texture, torn edges. Style: screenprint aesthetic."
```

The command is available at `~/.dotfiles/bin/generate-image`.

## Batch Image Generation Workflow

When generating multiple related images (slides, assets, variations):

### Before Starting

1. **Establish design system first** - don't generate ad-hoc
2. **Create reference images** - generate 3-5 test images to validate aesthetic
3. **Document the design language** - colors (hex), typography, layout rules
4. **Note what works/doesn't** - update prompts based on results

### During Generation

- **Generate variations in parallel** - use multiple bash calls simultaneously
- **Be explicit about negatives** - "no gradients, no glows, no logos"
- **Use specific hex colors** - not "dark gray" but "#0a0a0a"
- **Avoid brand names** - describe style instead ("minimal dark aesthetic" not "Apple style")

### After Each Batch

- **Review and note patterns** - what prompt language worked?
- **Update skill/memory** - document successful prompts
- **Iterate on failures** - refine prompts, don't just regenerate

### Common Pitfalls

- Starting generation without design system = inconsistent results
- Vague color descriptions = wrong palette
- Mentioning brands = unwanted logos/elements
- Not specifying negatives = decorative clutter

## Acceptance Checks

- [ ] API key is set for the chosen provider (`OPENAI_API_KEY` or `GEMINI_API_KEY`)
- [ ] Image was generated and saved to the expected location
- [ ] Output filename follows project conventions (if applicable)
- [ ] For batch work: design system was established before generation

## Related Skills

See `media:slide-design` for presentation-specific image generation guidance.
