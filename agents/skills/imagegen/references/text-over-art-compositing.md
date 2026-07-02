# Text-over-art compositing (slides, covers, posters, hero images with real type)

**Rule: for any deliverable where crisp headline/wordmark/label text matters — deck
slides, deck covers, posters, infographics with real copy, hero images — do NOT ask
the image model to render the text. Generate the ART ONLY, then composite real
typography over it with HTML → headless-Chrome screenshot.**

Why: GPT-Image / Gemini render text unreliably (misspellings, warped glyphs, wrong
kerning, can't carry several one-liners). Worse, a bare AI image *reads as an image*,
not as a finished slide. Michael's binding feedback across the Waycraft deck effort:
"slide visuals are evaluated as FULL SLIDES… AI images can't carry six one-liners
reliably — generated images are for *art elements inside* slides, not slide structure."
When he says "I'd like to see that with the text on there, like the full slide," he
means: composite the real type and show the composed result — don't present raw art
and describe where text would go.

## The recipe (validated on the Waycraft cover, 2026-07-02)

1. **Generate art only.** Prompt the image with generous negative space where the type
   will land and NO text in the image (add `no text, no lettering, no watermark` to the
   avoid list). Match the brand palette. Size to the target aspect ratio
   (e.g. `--size 1536x864` for 16:9, then upscale/render at full deck res).
2. **Write an HTML slide** at exact output resolution (e.g. 1920×1080) with the art as a
   full-bleed `<img class="art" style="object-fit:cover">` and the real type in DOM over
   it. Use the deck's ACTUAL fonts (load via Google Fonts `<link>` or local files) and
   brand CSS variables — not lookalikes. Example skeleton:
   ```html
   <html><head>
   <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;800&display=swap" rel="stylesheet">
   <style>
     :root{--paper:#f6f4ee;--ink:#1a1a1a;--coral:#ff7a45;--muted:#6b6660;}
     html,body{width:1920px;height:1080px;margin:0}
     .slide{position:relative;width:1920px;height:1080px;overflow:hidden;background:var(--paper)}
     .art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
     .wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:80px 120px;font-family:'Geist Mono',monospace}
     .wordmark{font-size:172px;font-weight:800;letter-spacing:-.03em;color:var(--ink)}
     .tagline{margin-top:34px;font-size:46px;font-weight:700;color:var(--coral)}
   </style></head><body>
   <div class="slide"><img class="art" src="c2-constellation.png">
     <div class="wrap"><div class="wordmark">Waycraft</div>
       <div class="tagline">The path to fully autonomous companies.</div></div></div>
   </body></html>
   ```
3. **Render to PNG with headless Chrome** at scale 1 (deterministic, no browser window,
   no foreground steal):
   ```bash
   CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
     --window-size=1920,1080 --screenshot="slide-c2.png" "slide-c2.html"
   ```
4. **Spin variants cheaply by swapping only the art** — keep the type layer fixed so
   each of Michael's reactions eliminates an art family, not one sample:
   ```bash
   sed 's#c2-constellation.png#c3-pavilions.png#' slide-c2.html > slide-c3.html
   # then render both in a loop
   ```
5. **Inspect the composed PNG yourself** (open it), fix contrast (place the wordmark in
   ink over a light region, or drop an illegible footer), then `open` the finalists for
   Michael side by side.

## Pitfalls
- Don't render text at scale factor >1 unintentionally — `--force-device-scale-factor=1`
  keeps the PNG at the CSS pixel size you declared.
- If the footer/label sits over busy art it goes illegible — move it to a calm region or
  drop it; don't ship low-contrast type.
- Keep the art's negative space where the type actually lands; regenerate the art (not
  the type) if the composition fights the wordmark.
- This is for art-plus-real-type deliverables. Pure illustrations with no required copy
  can still let the model handle any incidental lettering.
