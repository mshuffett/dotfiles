---
name: Always check screenshots before theorizing about test failures
description: When Puppeteer E2E tests fail, view the actual page screenshot before assuming reasons. Use agent-browser to inspect real DOM.
type: feedback
---

When E2E tests fail, ALWAYS:
1. Take a screenshot from the ACTUAL page being tested (not the offscreen browser window)
2. Read the screenshot before theorizing about why it failed
3. If DOM selectors don't find expected elements, use agent-browser to inspect the real page structure
4. Don't assume "rate limiting" or "element not found" — verify with evidence

**Why:** Multiple times during v2.2.0 release testing, I assumed failure reasons without checking screenshots. The `captureScreenshot` helper takes blank screenshots (offscreen window). Real page screenshots revealed the actual issues (Google notification popups, button elements instead of li elements, popup.close() before evaluate).

**How to apply:** Add `await page.screenshot({ path: 'test-results/debug.png' })` on the actual page before closing it. Read the image with the Read tool. Use `agent-browser snapshot -i` to see what elements exist when Puppeteer can't find them.
