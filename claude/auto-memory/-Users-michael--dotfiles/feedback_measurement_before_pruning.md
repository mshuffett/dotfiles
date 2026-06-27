---
name: Measurement before pruning for skill/prompt systems
description: When asked to reduce skill/plugin/memory bloat, resist proposing cuts based on description-overlap alone. Build measurement first.
type: feedback
originSessionId: 09dbaba4-9056-4d05-a0a4-fa8bb41f478d
---
When the user asks to slim down skills, plugins, memories, or any similar library-of-fragments system, the default response should NOT be "here's what I'd cut based on overlap." It should be "here's what I'd measure first."

**Why:** User's explicit framing: *"having some overlap isn't so bad... better than not having the right skill. like i think part of it is you don't currently know what is actually helpful."* Overlap is cheap; missing the right skill at the right moment is expensive. The correct response to apparent redundancy is usually better routing, not deletion.

**How to apply:**
- Before recommending cuts, ask: "what evidence do I have that this is unhelpful?" Description-similarity is not evidence of unhelpfulness.
- Prefer measurement (firing telemetry, historical replay, mistake-anchored evaluation) to curation-by-intuition.
- Only archival symlinks, self-declared deprecations, and test artifacts are safe to cut without evidence — everything else waits for data.
- The `skill-profile` adaptive loop (stats/replay/reflect/review) exists for this. Use it. See `project_adaptive_loop.md`.
- This principle generalizes beyond skills: CLAUDE.md sections, hooks, aliases, any tooling where absence-of-fire is hard to observe.
