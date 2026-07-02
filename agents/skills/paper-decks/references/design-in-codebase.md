# Deck-in-codebase: importing Paper `.dc.html` and iterating in a real app

Companion to the main `paper-decks` workflow. That workflow builds slides
*inside Paper* via the **paper-desktop** MCP. This reference covers the other
Paper surface — **claude.ai/design** (the web tool), reached via the
**`claude_design` / DesignSync** MCP — and the pattern of pulling those design
components into a live codebase, iterating there, and pushing back.

Both surfaces are the same Paper product and the same `.dc.html` Design
Component format; pick the surface the user is already in.

## The round-trip

1. **Import.** `DesignSync` (`list_projects` → `list_files` → `get_file`) reads
   a `claude.ai/design/p/<id>` project. A `.dc.html` file is a Design Component:
   a `<x-dc>` wrapper + `<helmet>` head + `<x-import component-from-global-scope>`
   + the `support.js` runtime. To serve it statically in a Next/Vite app, **strip
   the DC wrapper and runtime, move `<helmet>` contents into `<head>`**, and
   serve the inner HTML from `public/`.
2. **Serve.** For a Next App-Router app, drop assets under `public/deck/` and
   exempt the route from auth middleware (add the path prefix to the public
   allowlist) so the deck is viewable without login.
3. **Iterate in code.** Build a navigable viewer (`<deck-stage width height>` +
   one `<section>` per slide + the transcribed web components). Keep the build
   **reproducible** with an `assemble.py` that concatenates picked slides — don't
   hand-maintain the merged file.
4. **Push back.** `DesignSync` `write_files` writes a new `.dc.html` record back
   into the design project so the canonical deck lives in Paper too.

## Gotcha: `wc-chart` / `wc-type` double-render

Capturing a slide via `outerHTML` from the *rendered* DOM includes the chart/
typewriter's already-generated children. Re-mounting that markup builds a second
copy on top of the first (overlapping numbers/bars). Before re-serving, **empty
the generated children of every runtime component**:

```python
def strip_generated(html):
    for tag in ('wc-chart', 'wc-type'):
        html = re.sub(rf'(<{tag}\b[^>]*>).*?(</{tag}>)', r'\1\2', html, flags=re.S)
    return html
```

## Image-based slides

For "make this slide more exciting" / hero art, generate full-bleed backgrounds
with the `imagegen` skill (`gpt-image-2`, edit mode with a **brand reference
image** as input for palette/mood fidelity; `generate-batch` JSONL for several
candidates concurrently). Valid `gpt-image-2` sizes are multiples of 16 — use
`1536x864` for 16:9. Composite the wordmark/thesis as an HTML layer over the
image with a scrim, not baked into the pixels.

Preserve the animated affordances the flat slides had (typed-in text, line-chart
draw-on) *on top of* the richer backgrounds — Michael explicitly wanted "the best
of both worlds," not a static image that drops the motion.

## Variant review: build a gallery, explore in parallel

- When exploring slide directions, **generate multiple concepts in parallel**
  (Michael: "when you explore on things like this explore more than one concept
  at a time in parallel"), not one-at-a-time.
- Give him a **side-by-side comparison view** — a standalone HTML page with
  `<iframe>`s (or a contact sheet for images) so he can judge candidates and
  cross-pick per slide in one screen. Don't re-review slides already in the
  canonical.
