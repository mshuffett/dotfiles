---
name: Slide Design System
description: Use when generating presentation slides, deck images, or visual assets for meetings and pitches. Applies dark minimal Vercel/Apple aesthetic with strict design language.
---

# Slide Design System

## When to Use
- Generating presentation slides or deck images
- Creating visual assets for meetings, pitches, or proposals
- Any image generation task requiring professional corporate aesthetic

## Design Language: Dark Minimal

### Color Palette
| Role | Hex | Usage |
|------|-----|-------|
| Background | `#0a0a0a` | Primary slide background (near-black) |
| Surface | `#141414` | Cards, containers, subtle elevation |
| Border | `#262626` | Subtle dividers, card borders |
| Text Primary | `#fafafa` | Headlines, primary content |
| Text Secondary | `#a1a1a1` | Subtitles, captions, secondary info |
| Accent | `#ededed` | Emphasis, highlights (white-ish) |
| Accent Warm | `#f5a623` | Sparingly for key callouts (gold/amber) |

### Typography
- **Headlines:** SF Pro Display or Inter, Bold/Semibold, large (48-72pt equivalent)
- **Body:** SF Pro Text or Inter, Regular/Medium, comfortable size (18-24pt)
- **Captions:** SF Pro Text or Inter, Regular, smaller (14-16pt), secondary color
- **Letter-spacing:** Slightly tracked for headlines (+0.02em)
- **No decorative fonts** — ever

### Layout Principles
- **Extreme whitespace** — let content breathe
- **Asymmetric balance** — not perfectly centered, creates tension
- **Grid-based** — 12-column grid, content rarely spans full width
- **Hierarchy through size** — not color or decoration
- **One focal point per slide** — avoid competing elements

### Image Treatment
- **Full-bleed or generous padding** — no awkward medium crops
- **Subtle rounded corners** — 8-12px radius max
- **No drop shadows** — use subtle borders or elevation through color
- **Photography style:** High contrast, moody lighting, editorial feel
- **Consistent color grading:** Desaturated, cooler tones

### What to Avoid
- Gradients (except very subtle dark-to-darker)
- Glows, lens flares, "tech" effects
- Decorative icons or illustrations
- Busy backgrounds or patterns
- Multiple accent colors
- Centered layouts for everything
- Stock photo aesthetic (bright, saturated, generic)

---

## Prompt Engineering for Slide Generation

### Base Prompt Template
```
Presentation slide, 16:9 aspect ratio.
Background: solid near-black (#0a0a0a).
Typography: clean sans-serif (SF Pro/Inter style), white (#fafafa).
Layout: asymmetric, generous negative space, grid-based.
Style: Vercel/Apple keynote aesthetic, minimal, high contrast, editorial.
No gradients, no glows, no decorative elements, no logos.
[SPECIFIC CONTENT HERE]
```

### For 3-Image Layouts
```
Presentation slide, 16:9 aspect ratio.
Background: solid near-black (#0a0a0a).
Three LANDSCAPE orientation photographs arranged horizontally with 16px gaps.
Images have 8px rounded corners, no borders or frames.
Small caption text bottom-right corner of slide, gray (#a1a1a1), small sans-serif.
Photography style: editorial, moody lighting, desaturated colors, high contrast.
No logos, no decorative elements.
[DESCRIBE THE THREE IMAGES - be specific about content and mood]
```

### For System Diagrams
**CRITICAL:** Diagrams often default to white backgrounds. Be extremely explicit.
```
Technical system diagram.
BACKGROUND: Must be solid near-black (#0a0a0a). NOT white. NOT light. Solid dark.
Line art style: thin white lines (1-2px weight), outlined only, no fills.
Icons: simple geometric shapes, outlined in white, not filled.
Typography: clean sans-serif, white (#fafafa) primary, gray (#a1a1a1) secondary.
Layout: left-to-right flow OR hub-spoke, generous spacing between elements.
NO glows, NO 3D effects, NO gradients, NO shadows, NO decorative elements.
Connection lines: straight or single-curve, subtle small arrows.
Overall: stark, minimal, technical, high contrast white-on-black.
[DESCRIBE THE DIAGRAM CONTENT]
```

### For Text-Heavy Slides
```
Presentation slide, solid near-black background (#0a0a0a).
Large headline top-left, white (#fafafa), bold sans-serif.
Body text or list below, lighter gray (#a1a1a1), regular weight.
Generous left margin (20% of width).
Asymmetric layout, content weighted to left or top-left.
No bullets — use spacing to separate items.
[SPECIFY TEXT CONTENT]
```

---

## Iteration Workflow

### Before Generating
1. Establish the full design system (this document)
2. Generate 3-5 reference slides to validate aesthetic
3. Note what works and doesn't
4. Refine prompts based on results
5. Then generate the actual deck

### During Generation
- Generate variations in parallel (3-5 options)
- Review results and note patterns:
  - What prompt language produces desired results?
  - What gets ignored or misinterpreted?
  - What unexpected elements appear?
- Update this skill with learnings

### After Generation
- Document successful prompt patterns
- Note provider-specific behaviors (Gemini Pro vs others)
- Add examples of good/bad outputs
- Suggest improvements to user

---

## Provider Notes

### Gemini Pro (gemini-3-pro-image-preview)
- Good at text rendering
- Tends to add Apple logos when "Apple style" mentioned — avoid that phrase
- Sometimes adds unwanted decorative elements
- Better with explicit negative instructions ("no gradients, no glows")
- Responds well to specific hex colors

### Known Issues & Workarounds
- **Unwanted logos:** Never mention brand names in prompt — describe the style instead
- **Light backgrounds:** Be explicit: "solid near-black (#0a0a0a) background, NOT white"
- **Busy diagrams:** Add "generous whitespace, minimal elements, clean"
- **Generic photography:** Specify "editorial, moody, desaturated" not just "professional"

---

## Validated Examples

### Headline Slide (ref-02) — EXCELLENT
**Prompt:**
```
Presentation slide, 16:9 aspect ratio. Background: solid near-black (#0a0a0a). Large bold white (#fafafa) sans-serif headline top-left: 'The Future of Space'. Generous left margin. Asymmetric layout. Below headline: single line of gray (#a1a1a1) text as subtitle. Rest of slide is empty black space. Minimal, stark, confident. No logos, no gradients, no decorative elements, no icons.
```
**Result:** Perfect stark minimal headline with asymmetric layout.

### Grid Menu Slide (ref-04) — GOOD
**Prompt:**
```
Presentation slide, 16:9 aspect ratio. Background: solid near-black (#0a0a0a). Four rectangular cards in 2x2 grid, cards are dark gray (#141414) with very subtle border (#262626). Each card contains: one thin-line white icon (simple geometric) and one word label below in white sans-serif. Cards have generous internal padding. Generous gaps between cards. Overall layout centered but with asymmetric feel. No shadows, no gradients, no glows, no logos. Clean minimal grid.
```
**Result:** Good dark cards with thin-line icons. Could use more contrast.

### Photography Triptych (ref-01, ref-05) — GOOD
**Key phrases that work:**
- "editorial, moody lighting, desaturated colors, high contrast"
- "silhouetted" for people
- Specific scene descriptions
**Issue:** Images often come out portrait even with LANDSCAPE specified.
**Workaround:** Use "wide horizontal" or "16:9 aspect ratio photographs" or "wider than tall images"

### System Diagram (ref-03) — FAILED (white background)
**Learning:** Must add "BACKGROUND: Must be solid near-black (#0a0a0a). NOT white. NOT light."
