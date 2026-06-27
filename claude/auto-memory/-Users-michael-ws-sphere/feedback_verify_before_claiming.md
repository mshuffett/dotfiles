---
name: Verify before claiming things work
description: Always verify outcomes with concrete steps (curl, screenshot, test run) before telling the user something works or should work
type: feedback
---

Never say "should work" or "that will work" without verifying first. Always test the actual outcome before claiming success.

**Why:** The user got frustrated when I said things "should work" multiple times (CORS, shader fix, provisioning) without verifying, only for them to fail. Speculative claims waste the user's time and erode trust.

**How to apply:** Before telling the user something works:
1. Run the simplest verification (curl for APIs, screenshot for UI, test command for code)
2. If verification isn't possible, say "I haven't verified this yet — let me check" and then check
3. If blocked on user action, be explicit: "I can't verify until you do X, but here's what I expect"
4. Never use "should work" — either verify it works, or say you haven't verified yet
