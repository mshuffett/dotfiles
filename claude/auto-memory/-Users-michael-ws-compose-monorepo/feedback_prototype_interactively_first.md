---
name: feedback_prototype_interactively_first
description: "Prototype browser/E2E checks interactively (REPL lane) BEFORE writing test files — iterate live on selectors/timing/data shapes, then solidify into code"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9c85316b-cd35-4f12-9851-fefdbb1fb6d4
---

**When building E2E tests or browser automation, prototype interactively first, then write the file.** Michael called this out explicitly (2026-06-12) after I wrote a large test suite blind and hit avoidable compile/shape errors: "doing it interactively first… helps with iteration speed."

**Why:** A suite run costs minutes; a REPL probe costs seconds. Selectors, event/data shapes, timing windows, and third-party page behavior are all unknowns best discovered live. Writing the file first means debugging through full-suite reruns — the slow loop he hates.

**How to apply:**
1. Open the persistent REPL (playwright MCP tools for plain web; tmux node REPL per `playwright-interactive` → `references/claude-code-tmux-repl.md` for extension/raw-API work — works with puppeteer too, same pattern).
2. Probe every assumption the test will encode: does the selector match? what does the stored event/payload actually look like (dump one)? how long until the flush/debounce fires? does the third-party page even load headless?
3. Only then write the test file — encoding verified facts, not guesses.
4. Keep the REPL open while iterating on the file; re-probe instead of re-running the suite.

Related: [[feedback_e2e_headless_no_foreground]] (the REPL must be headless too).
