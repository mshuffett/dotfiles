---
name: paper-decks
description: Build multi-slide presentation/investor decks (or any multi-artboard layout) in Paper, grounded in an existing codebase's design system. Use when the user says "start/make a deck in Paper", "design a deck/presentation in Paper", "build slides in Paper from this repo/homepage/design", wants a Paper file whose look matches a live app, OR wants to import/implement a claude.ai/design `.dc.html` design component and iterate on it in a real app. Covers both Paper surfaces — the paper-desktop MCP and the claude.ai/design web tool (the `claude_design`/DesignSync MCP). This is the Paper counterpart to the `slides` skill (which is PptxGenJS/.pptx); for a single non-deck design use the protected `paper-desktop:code-to-design` plugin skill instead.
---

# Paper decks (paper-desktop MCP)

Build decks in Paper one artboard at a time, matching a real codebase's design
system, then sequence and export. The `paper-desktop` plugin owns the canonical
tool reference — **call `get_guide({topic:"paper-mcp-instructions"})` once at the
start**; this skill adds the deck workflow and the runtime gotchas that the guide
doesn't spell out.

**Two Paper surfaces.** paper-desktop MCP (this skill's default) and the
claude.ai/design web tool via the `claude_design`/DesignSync MCP are the same
Paper product and the same `.dc.html` format. When the task is "import/implement
a claude.ai/design `.dc.html`" or "pull these slides into the app," read
`references/design-in-codebase.md` — it covers the import→strip-runtime→serve→
push round-trip, the `wc-chart`/`wc-type` double-render fix, image-based hero
slides, and building a side-by-side variant gallery.

## Present, don't just save — Michael has to SEE it

Design work is judged by eye. Every generated artifact — a slide, an image, a
keyframe, a comparison board — must be **opened and put in front of Michael in
the same turn you create it**, not left as a file path he has to chase. In the
deck session he had to ask "open it for me," "did you open them," "where do I see
these," "open those html files," and "put these in a view I can see closer to
full screen" over and over. That is the failure to avoid.

- After generating: `open` the file (browser/Preview), or serve it and give the
  exact URL, or build a full-screen gallery/contact sheet — then say where it is.
- Prefer a viewable presentation (local URL, Preview, HTML gallery with iframes)
  over terminal-only chafa for anything design-quality is being judged on.
- **Explore variants in parallel, not sequentially**, and hand him one
  comparison view to cross-pick from (see the reference).

## Workflow

1. **Load Paper + read the repo design system in parallel.** Call `get_guide`
   and `get_basic_info`. Separately, extract the real palette/type/spacing from
   the codebase (e.g. `app/page.tsx` + `globals.css`) — do NOT invent a design
   system. Write a one-paragraph brief (mood, palette hexes, type scale,
   spacing, layout direction) derived from the live source and carry it through.
2. **Confirm the font before any typographic styling.** `get_font_family_info`;
   prefer a family already in `get_basic_info`. Match the source's exact hex
   values inline for fidelity rather than approximating.
3. **Create the file + first artboard at the target size.** 16:9 investor deck =
   1920×1080. Build the first slide as the design-system reference: one visual
   group per `write_html` call (eyebrow row → hero → footer), not one giant blob.
4. **Screenshot-review each section before moving on** (`get_screenshot`).
   Check: content fills the full artboard height (a footer floating mid-slide
   means the layout isn't distributing — fix vertical distribution); decorative
   elements read at the intended weight (e.g. a large block cursor can render as
   a heavy slab, not a delicate blink).
5. **Template subsequent slides via duplicate, not rewrite.** `duplicate_nodes`
   the established slide, then `set_text_content` + targeted `update_styles` /
   `delete_nodes` to reshape the middle. This keeps the eyebrow/footer frame
   consistent and is far faster than re-authoring HTML per slide.
6. **Sequence then export.** Fix layer order last (see gotchas), then
   `export_combined_pdf`. Call `finish_working_on_nodes` when done.

## Gotchas (discovered live — not in the guide)

- **`move_nodes` reorders layer stacking, not canvas x/y position.** Use it to
  put slides in deck order 1→N in the layer tree.
- **Canvas position is not a style prop.** You cannot reposition an artboard on
  the canvas via `update_styles` x/y — it's a no-op. Don't waste calls trying to
  lay artboards out in a tidy filmstrip.
- **`duplicate_nodes` drops the copy in an unpredictable canvas spot** (often
  on top of others). That's cosmetic — ignore it during the build and fix
  **layer order** at the end.
- **Combined-PDF export order follows layer order, not canvas position.** So the
  only ordering that matters for a clean export is the layer sequence — set it
  with `move_nodes` right before `export_combined_pdf`.
- **API 529 "Overloaded" mid-build is transient** — just retry; the prior Paper
  mutation usually still succeeded, so re-check state with `get_basic_info`
  before redoing it.

## Verification

- `get_screenshot` every slide you haven't visually confirmed (don't trust that
  duplicated slides look right after text swaps — alignment can drift).
- Use fixed-width label lanes (flexShrink:0) for any aligned columns/rows
  (team/traction lists) so rows line up across the slide.
- Final check: layers sequence 1→N and the combined PDF opens in deck order.
