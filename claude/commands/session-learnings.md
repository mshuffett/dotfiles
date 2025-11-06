---
description: Use when summarizing a session; append a human‑readable entry and reference any updated guides.
---

# Session Learnings

Human‑readable summaries live at:
- `~/.claude/logs/session-learnings.md`

Event/mistakes log (for escalation logic) lives at:
- `~/.claude/mistakes.jsonl`

Usage:
- Append concise summaries to the log as sessions conclude.
- Cross‑link notable entries to relevant guides (e.g., worktrees, ports, PRs) and update those guides as needed.
- Use the mistakes log for automated promotion/demotion decisions; keep the session‑learnings file readable for humans.

## When to Use (Triggers)
- End of a significant session or after notable learning

## Acceptance Checks
- [ ] Summary appended to `~/.claude/logs/session-learnings.md`
- [ ] Related guide(s) updated if needed
