---
name: image-generation
description: Use when generating images, creating visual assets, or working with AI image generation. Covers generate-image CLI with OpenAI GPT Image 1.5, Gemini Pro, Gemini, and Imagen providers.
---

# Image Generation

Use the `generate-image` command to create images with OpenAI GPT Image 1.5, Google Gemini, or Imagen.

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

Use `-i` or `--input` for editing, style transfer, or composition:

| Provider    | Max Images | Behavior                          |
|-------------|------------|-----------------------------------|
| OpenAI      | 16         | Uses `/edits` endpoint, supports mask |
| Gemini Pro  | 14         | Multimodal reference/editing      |
| Gemini      | 3          | Multimodal reference/editing      |
| Imagen      | 0          | Generation only                   |

**Mask (OpenAI only):** Use `-k` or `--mask` with a PNG that has transparent areas indicating where to edit. Must match input dimensions.

## Providers and Models

| Provider     | Model ID                       | Best For                         |
|--------------|--------------------------------|----------------------------------|
| `openai`     | gpt-image-1.5                  | Best quality, editing (default)  |
| `gemini-pro` | gemini-3-pro-image-preview     | High-res, text rendering         |
| `gemini`     | gemini-2.5-flash-image         | Faster, general use              |
| `imagen`     | imagen-4.0-generate-001        | Photorealistic                   |

## Sizes

- Standard (all providers): 1024x1024, 1024x1536, 1536x1024
- Gemini Pro only: 2048x2048, 2048x3072, 3072x2048

## Environment Variables

- `OPENAI_API_KEY` - required for openai provider (default)
- `GEMINI_API_KEY` - required for gemini, gemini-pro, and imagen providers

## Prompting Tips

For detailed prompts (especially Gemini Pro), include:

- **Style**: "editorial photography", "vintage poster", "cinematic", "flat lay"
- **Color palette**: Specific colors and interactions ("warm orange glow contrasting with cool blue shadows")
- **Lighting**: Direction, quality, mood ("harsh overhead spotlight", "golden hour backlight")
- **Composition**: Camera angle, framing ("overhead shot", "low angle", "shallow depth of field")
- **Texture**: "film grain", "halftone dots", "distressed paper", "chalk texture"
- **Specific text**: Enclose in single quotes within the prompt

For batch generation workflow, see [references/batch-workflow.md](references/batch-workflow.md).

The command is available at `~/.dotfiles/bin/generate-image`.

## Acceptance Checks

- [ ] API key is set for the chosen provider (`OPENAI_API_KEY` or `GEMINI_API_KEY`)
- [ ] Image was generated and saved to the expected location
- [ ] Output filename follows project conventions (if applicable)
