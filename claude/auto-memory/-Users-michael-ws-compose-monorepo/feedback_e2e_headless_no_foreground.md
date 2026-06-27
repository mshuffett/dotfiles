---
name: feedback_e2e_headless_no_foreground
description: HARD RULE — browser automation must be fully headless; headed-but-offscreen STILL activates the app on macOS and is NOT acceptable without explicit user OK
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9c85316b-cd35-4f12-9851-fefdbb1fb6d4
---

**STOP before any browser launch: if `headless` is not `true`, do not run it without Michael's explicit OK for that specific run.** This failed twice (2026-06-11 onboarding-metrics headed; 2026-06-12 Gmail lane headed-offscreen) — the second time because I treated "off-screen window" as satisfying no-foreground. It does not: **macOS activates the app on ANY headed Chromium launch, regardless of window position.** Only headless is invisible.

**Why:** Michael works on the same machine; focus-steal is his most-hated disruption. He corrected this twice — there is no third time.

**The two folk reasons for headed are dead — verified 2026-06-12:**
- "MV3 extensions need headed Chrome" → false: Playwright `launchPersistentContext(..., { headless: true, channel: "chromium" })` (full build, not headless shell) loads the extension SW.
- "Google blocks headless sign-in" → false: full Gmail TOTP login + capture + BigQuery flush passed headless.

**How to apply:**
- Before running ANY e2e suite: `rg "headless" <test files + helpers>` and confirm every launch resolves headless. Suites' env defaults matter (`HEADLESS !== "false"` good, `=== "true"` bad).
- compose-monorepo: all lanes (puppeteer + Playwright Gmail) default headless as of `3552489` on `release/v2.2.0-prep`.
- If a flow genuinely fails headless: stop and ask before launching headed; off-screen+headed is a last resort that still flashes Dock activation.
- Interactive work: `playwright-interactive` skill (tmux-REPL lane for Claude Code) — headless there too.
- Skipping the test is never the fix.
- Related: [[feedback_screenshot_debugging]].
