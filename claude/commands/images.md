---
description: Use when generating images; choose provider (Gemini/OpenAI), ensure API keys, and select size/output options.
---

# Image Generation

Use the `generate-image` command to create images with Google Gemini or OpenAI:

## When to Use (Triggers)
- You are asked to generate images or visual assets

## Acceptance Checks
- [ ] Provider chosen (Gemini/OpenAI) based on need
- [ ] Required API key is present in env
- [ ] Size/output options selected appropriately

Commands:
- `generate-image "prompt"` — generates a 1024x1024 image with Gemini (default)
- `generate-image "prompt" --provider openai` — generates image with OpenAI DALL‑E 3
- `generate-image "prompt" --size 1024x1536` — portrait
- `generate-image "prompt" --output filename.png` — saves with specific filename
- `generate-image "prompt" --url-only` — returns URL without downloading (OpenAI only)
- `generate-image --help` — shows all available options

Providers:
- `gemini` — Google Gemini 2.5 Flash Image (nano-banana/gemini-2.5-flash-image-preview) — default
- `openai` — OpenAI DALL‑E 3

Environment variables:
- `OPENAI_API_KEY` — required for OpenAI provider
- `GEMINI_API_KEY` — required for Gemini provider

The command is available at `~/bin/generate-image` (symlinked from `~/.dotfiles/bin/generate-image`).
