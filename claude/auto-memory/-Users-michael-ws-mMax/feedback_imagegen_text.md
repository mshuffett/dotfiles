---
name: imagegen text rendering is good now
description: Image models render text reliably; bake copy into prompts rather than reserving zones for HTML overlay
type: feedback
originSessionId: 0c00bcf1-3bc5-44fb-be85-7b77526509d3
---
When generating slide / diagram images via imagegen, bake the actual text into the prompt — labels, numbers, headlines, mono captions, the lot. Do not reserve "negative space for HTML overlay" or plan a text-on-image hybrid as the default.

**Why:** Modern image models (GPT Image 2 / current generation) render text reliably enough that this is no longer a gotcha. Equally important: the image can produce more detailed and interesting diagrams than HTML — that's part of the point of going to imagegen instead of staying in the deck. Treating the image as a stripped-down "atmosphere layer" with HTML doing the data work throws away the upside.

**How to apply:** When pitching motifs / prompts for diagrams, slide imagery, or scoreboards, include the full literal text in the prompt (headlines, bullet ledes, KPI labels with values, vendor names, callouts). Keep an HTML version for editability when the user wants both, but don't default to "image = visual canvas, HTML = text" — the image carries both. Hybrid (image + HTML overlay) is a third option, not the default.

**Provider preference (mMax repo):** Default to `generate-image -p openai` (GPT Image 2 / `gpt-image-2`) at `-s 1536x1024 -q high` for slide-density work — it's the user's stated best for these prompts. Don't reach for Gemini Pro / Imagen unless the user asks or OpenAI fails. Confirmed 2026-05-06.
