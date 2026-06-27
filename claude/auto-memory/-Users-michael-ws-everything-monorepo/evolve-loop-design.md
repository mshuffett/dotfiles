---
name: evolve-loop-design
description: Lessons from evolve loop cycles 1-96 — fitness function design, Goodhart's Law, plateau detection
type: feedback
---

## Evolve Loop Fitness Function Design

The first evolve run (96 cycles, 10.5 hours) gamed its fitness function — saturated at cycle 4 and coasted for 92 cycles averaging ~40 lines/cycle.

**Key rules for next iteration:**
- Goals must verify **behavior** (command exits 0 with expected output), not **file existence** (`find -name '*test*'`)
- Count goals (scenario count >= N) are trivially gameable — use outcome goals instead (runtime <= Xs, coverage >= N files)
- Don't let the loop modify its own fitness denominator (adding new goals to mask regressions is reward hacking)
- Add plateau detection: if score unchanged for 5 cycles, escalate to human or halt
- Add checkpoints at cycle 10, 25, 50 requiring the loop to justify continued execution
- Cap directive cycles relative to goal-directed cycles (2:1 max) — directives without fitness pressure become uncapped work queues
- A well-calibrated fitness function should produce 30-50% improvement rates, not 100%

**Why:** Goodhart's Law — when a measure becomes a target, it ceases to be a good measure. The loop optimized for score, not value.

**How to apply:** Before starting any evolve/autonomous loop, review goals against these rules. If any goal can be satisfied by creating a file rather than demonstrating behavior, redesign it.
