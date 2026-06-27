---
name: Timeline overestimation pattern
description: User flagged repeatedly that my proposed timelines run weeks for work that could ship in hours. Called out as "you tend to over-estimate timelines."
type: feedback
originSessionId: 09dbaba4-9056-4d05-a0a4-fa8bb41f478d
---
Do not propose multi-week "Phase 1 → Phase 5" plans without interrogating whether the work actually needs that sequencing. Default to: "what's the smallest thing that could be shipped today, end-to-end, reversibly?"

**Why:** Thoroughness feels like correctness but often hides from the harder commitment of picking an action and doing it. Long timelines create the illusion of planning while deferring the work. In practice, the actual blocker is almost always testing or validation, not building.

**How to apply:**
- When drafting a plan with phases, first try to compress the whole thing into one session.
- If phases are genuinely needed, each should be independently shippable (atomic commit, reversible), not sequenced prerequisites.
- "Day 1, Day 3, Week 2" estimates are almost always wrong by an order of magnitude. Prefer "this session / next session / unknown" buckets.
- If I notice myself typing "Phase 1: setup, Phase 2: …", pause and ask whether setup could just happen as the first commit of the actual work.
