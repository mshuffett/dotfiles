---
name: todoist
description: Use when creating or processing Todoist tasks, triaging inbox items, or doing daily task review. Routes to operations (CLI actions) vs triage (classification + next actions).
---

# Todoist (Entrypoint)

Uses the official **`td` CLI** (`@doist/todoist-cli`) for all operations. No raw API calls needed.

## Prerequisites

- `td` must be installed: `npm install -g @doist/todoist-cli`
- Auth: `td auth login` or set `TODOIST_API_TOKEN` in `~/.env.zsh`
- Verify: `td auth status`

## Safety / Guardrails

- Do **not** create or modify tasks proactively without explicit user request.
- If the user asks to "process my tasks", fetch the full relevant set first (don't silently process a subset).
- Read comments before acting; comments may contain critical context and attachments.
- **Always confirm before destructive actions** (delete, complete, archive).

## Quick Reference

| Command | Purpose |
|---------|---------|
| `td today` | Tasks due today + overdue |
| `td inbox` | Inbox tasks |
| `td upcoming 7` | Next 7 days |
| `td add "text"` | Quick add with natural language |
| `td task view id:xxx` | View task details |
| `td comment list id:xxx` | Read comments |

## Choose A Mode

- **Operations** (CLI commands, bulk edits, moving tasks, due dates): see [references/operations.md](references/operations.md)
- **Triage** (classification, recommendations, "what should I do with these tasks"): see [references/triage.md](references/triage.md)
