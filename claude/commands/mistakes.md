---
description: Log and review recurring mistakes; propose promotions/demotions of guardrails based on frequency.
---

# Mistakes Log & Review

Files:
- Global log: `~/.claude/mistakes.jsonl`
- Project log: `<repo>/memory/mistakes.jsonl`

Event schema (JSONL):
```
{"ts":"2025-11-06T10:15:00Z","repo":"~/ws/everything-monorepo","mistake_id":"worktrees.preflight_skipped","scope":"global","detector":"self","notes":"ran git worktree without pre-flight"}
```
Fields: `ts` ISO time, `repo` path (omit for global), `mistake_id` (kebab or dot case), `scope` (global|project), `detector` (self|user), `notes` (brief context). Optional: `guide`, `guide_exists`, `condition`, `accepted_checks`.

Review procedure:
1) On session start/end, aggregate last 14–30 days of events.
2) Promote when:
   - ≥2 misses within 14 days in the same repo → add a one‑line Hot Rule to that repo’s agent file.
   - ≥2 repos each show a miss within 14 days → add a one‑line universal guardrail to root CLAUDE.
3) Demote when 14–30 quiet days pass → propose removal of one‑liners (policy remains in guides).

Enforcement:
- Any attempt to execute a procedural task when a known trigger condition applies MUST record which guide was consulted and whether acceptance checks passed.
- If no guide was consulted, automatically log `guide.not_consulted` with `condition` and stop until consultation occurs.

Example mistake IDs:
- `worktrees.preflight_skipped`
- `ports.killed_without_permission`
- `thirdparty.docs_not_looked_up`
- `pr.conflicts_not_checked`
- `guide.not_consulted`
- `guide.acceptance_checks_skipped`

