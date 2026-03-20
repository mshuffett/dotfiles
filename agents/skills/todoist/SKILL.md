---
name: todoist
description: Use when creating or processing Todoist tasks, triaging inbox items, doing daily task review, calibrating Todoist triage behavior, or turning corrections into reusable preferences. Routes to operations (CLI actions) vs calibrated triage (policy, context recovery, preference memory, evals). Trigger this whenever the user asks what to do with Todoist items, wants better task triage, or is refining how Todoist decisions should work.
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
- When context is weak, do **not** guess. Prefer `needs_context` or `needs_user_judgment` over a polished but brittle answer.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `td today` | Tasks due today + overdue |
| `td inbox` | Inbox tasks |
| `td upcoming 7` | Next 7 days |
| `td add "text"` | Quick add with natural language |
| `td task view id:xxx` | View task details |
| `td comment list id:xxx` | Read comments |

## Operating Model

Todoist triage is a **copilot** workflow, not a blind classifier.

1. Recover as much context as possible before deciding.
2. Classify the item into a small set of decision buckets.
3. Recommend a specific next step only when confidence is justified.
4. Record durable corrections as preference memory, not as one-off prose.
5. Verify new rules in fresh-session evals before trusting them.

## Choose A Mode

- **Operations** (CLI commands, bulk edits, moving tasks, due dates): see [references/operations.md](references/operations.md)
- **Triage overview** (when user asks "what should I do with these tasks?"): see [references/triage.md](references/triage.md)
- **Triage policy** (decision buckets, output format, calibration): see [references/triage-policy.md](references/triage-policy.md)
- **Context recovery** (how to recover missing information before deciding): see [references/context-recovery.md](references/context-recovery.md)
- **Preference memory** (how to turn corrections into reusable rules): see [references/preference-memory.md](references/preference-memory.md)
- **Eval loop** (cold-session checks, dataset structure, failure taxonomy): see [references/evals.md](references/evals.md)
