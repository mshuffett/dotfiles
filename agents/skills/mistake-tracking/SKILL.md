---
name: mistake-tracking
description: Use when logging or reviewing mistakes; append JSONL events and promote/demote guardrails based on frequency.
---

# Mistake Tracking

## Files

- Global log: `~/.claude/mistakes.jsonl`
- Project log: `<repo>/memory/mistakes.jsonl`

## Event Schema (JSONL)

```json
{"ts":"2025-11-06T10:15:00Z","repo":"~/ws/everything-monorepo","mistake_id":"worktrees.preflight_skipped","scope":"global","detector":"self","notes":"ran git worktree without pre-flight"}
```

**Required fields**: `ts` (ISO), `mistake_id` (kebab/dot case), `scope` (global|project), `detector` (self|user), `notes`
**Optional fields**: `repo`, `guide`, `guide_exists`, `condition`, `accepted_checks`

## Review Procedure (Session Start/End)

1. Aggregate last 14-30 days of events
2. **Promote** when:
   - 2+ misses in 14 days in same repo -> add Hot Rule to that repo's agent file
   - 2+ repos each with a miss in 14 days -> add universal guardrail to root CLAUDE
3. **Demote** when 14-30 quiet days pass -> propose removal of one-liners (policy stays in guides)

## Semantic Recall (Before Logging)

Before logging a mistake, quickly check whether it (or a close cousin) has happened before so you can re-use the existing fix/guardrail language:

```bash
agent-recall search "<mistake symptom / task context>"
```

## Enforcement

Procedural tasks with known triggers MUST record which guide was consulted and whether acceptance checks passed. If no guide consulted, log `guide.not_consulted` with `condition` and halt.

## Common Mistake IDs

- `worktrees.preflight_skipped`
- `ports.killed_without_permission`
- `thirdparty.docs_not_looked_up`
- `pr.conflicts_not_checked`
- `guide.not_consulted`
- `guide.acceptance_checks_skipped`

## Acceptance Checks

- [ ] Event appended to correct JSONL log
- [ ] Promotion/demotion considered based on counts in last 14-30 days
