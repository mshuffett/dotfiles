---
name: Batch Slide Image Generation
description: Use when generating multiple presentation slide images, creating slide decks with AI-generated visuals, or iterating on slide designs with image generation.
---

# Batch Slide Image Generation

Workflow for generating presentation slide images at scale using `generate-image` with both Gemini and OpenAI providers.

## Quick Reference

```bash
# Gemini Pro (free, good for iteration)
generate-image "prompt" --provider gemini-pro --size 1536x1024 -o output.png

# OpenAI Low Quality (~$0.01/image, good results)
generate-image "prompt" --quality low --size 1536x1024 -o output.png

# With reference image for style consistency
generate-image "prompt" --provider gemini-pro -i reference.png -o output.png
```

## Workflow

### 1. Setup
- Create `images/` folder for all generated images
- Create `images/selected/` folder for final choices
- Read the slide deck spec to understand visual language and per-slide requirements

### 2. Naming Convention
```
slide-{NN}-{variant}-{provider}-{letter}.png

Examples:
- slide-01-spec1-gemini-a.png    # Specific prompt, Gemini, variation A
- slide-01-simple1-low-b.png     # Simple prompt, OpenAI low, variation B
- slide-08-hansel-text-gemini-c.png  # Custom variant name
```

### 3. Generation Strategy
- Generate 3 variations (a/b/c) per prompt
- Test both providers: Gemini Pro (free) and OpenAI low (~$0.01)
- Run generations in parallel for speed
- Open images immediately for user review

### 4. Iteration Loop
1. Generate initial variations
2. User reviews and selects or requests changes
3. Regenerate with adjusted prompts
4. Copy selected image to `selected/` folder
5. Track progress: which slides are done vs pending

## Prompting Patterns

### What Works

**Include visual language in prompts:**
```
"Dark elegant slide design. Pure black background (#000000).
Heavy black vignette on edges. SF Pro Display typography.
[slide-specific content]. Cinematic, sophisticated."
```

**Be specific about text placement:**
```
"Title 'Your Text Here' in large white at top.
Subtitle below in smaller gray.
Body text centered."
```

**Describe the mood/feeling:**
```
"Cinematic documentary style. Warm ambient lighting.
Team energy not therapy vibes. Ambitious builder feeling."
```

### What Doesn't Work

- **Generic prompts** produce generic results - be specific
- **Too literal** interpretations - sometimes need creative concepts (e.g., Hansel & Gretel for homepage)
- **Wrong text** - double-check exact wording from slide spec
- **Sterile presentation style** - add human elements, photography, emotion

## Using Reference Images

When slides need style consistency:

```bash
generate-image "prompt" --provider gemini-pro \
  -i selected/slide-01.png \
  -i selected/slide-02.png \
  -o slide-06-ref-gemini-a.png
```

This helps Gemini match the visual style of already-selected slides.

## Provider Comparison

| Provider | Cost | Best For |
|----------|------|----------|
| Gemini Pro | Free | Rapid iteration, creative concepts, style matching with references |
| OpenAI Low | ~$0.01 | Final quality, text rendering, photorealistic images |
| OpenAI High | ~$0.25 | Maximum quality (rarely needed) |

**Observations:**
- Gemini handles creative/whimsical prompts well (e.g., fairy tale themes)
- OpenAI low quality is often sufficient and much cheaper than high
- Both struggle with exact text placement - may need multiple attempts
- Use Gemini for exploration, OpenAI for polish

## Common Adjustments

| Issue | Solution |
|-------|----------|
| Too sterile/corporate | Add human elements, warm lighting, real photography feel |
| Wrong text | Regenerate with exact text from slide spec |
| Too literal | Try creative metaphor (e.g., candy trail for "homepage") |
| Inconsistent style | Use reference images from selected slides |
| AA/therapy vibes | Shift to "team energy", "builders", "startup hustle" |

## Tracking Progress

Keep a running status:
```
✅ Selected: 1, 2, 3, 4, 5...
❌ Pending: 10, 11, 12...
```

After each selection:
```bash
cp images/slide-XX-variant.png images/selected/
```

## Final Review

Open all selected slides together:
```bash
open images/selected/*.png
```

Verify count matches expected slides:
```bash
ls images/selected/*.png | wc -l
```

## Cost Management

For a 19-slide deck with iteration:
- **Gemini only**: Free (good for drafts)
- **Mixed approach**: ~$2-5 (Gemini for iteration, OpenAI for finals)
- **Full OpenAI low**: ~$0.01 × iterations (still cheap)

Budget ~$5-10 for a full deck with healthy iteration.
