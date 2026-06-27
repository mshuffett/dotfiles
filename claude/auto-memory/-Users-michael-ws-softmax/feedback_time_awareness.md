---
name: feedback-time-awareness
description: "I'm time-blind — be aware of iteration time bottlenecks and parallelize long-running work"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c45d893b-5ebc-4a58-8aa9-cbdb5571e876
---

Be aware of time-blindness: track which operations are slow and parallelize them. Don't serialize work behind long-running commands.

**Why:** During Among Them sprint, I ran Docker builds in foreground waiting for them, while there was plenty of other work (writing tests, surveying replays, building eval harness) I could have been doing concurrently. User flagged this as a recurring pattern.

**How to apply:**
- Long builds (>30s) → `Bash run_in_background:true` or `Monitor` and keep working
- Identify the critical-path bottleneck and parallelize independent work around it (e.g. cloud queue ≈ 30+ min per policy submission → submit early, then iterate on local eval/code while cloud runs)
- Use `Monitor` (not Bash background) for streaming events that need notifications — Bash background may not trigger the hook to continue
- Kill / consolidate stray background shells; messy shell state confuses things
- Cache LLM responses for fast iteration (already doing this in [[eval-harness]])

Related: [[autonomous-self-driving]]
