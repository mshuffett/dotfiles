# Memory / Taxonomy Experiments

This repo's memory system is allowed to evolve. Changes should be intentional and reviewable.

## When To Run An Experiment

- Skills are routinely skipped, misunderstood, or too slow to apply.
- The same class of mistake repeats across tasks or repos.
- Context bloat makes it harder to find the right instruction quickly.

## Protocol (Lightweight)

1. **Hypothesis**: what will improve, and why (ex: fewer missed safety steps, faster debugging).
2. **Change**: what you're doing differently (ex: reduce entrypoints, add hop-cost promotion).
3. **Verification**: how you will know it's better (signals: fewer backtracks, clearer reviews, fewer regressions).
4. **Rollback**: how to undo if it makes things worse.

## Commit Message Convention

Prefer making intent explicit in the commit message body:

- What changed (taxonomy/entrypoints/paths)
- Why (hypothesis)
- What to watch for (signals)
- How to rollback (high level)

