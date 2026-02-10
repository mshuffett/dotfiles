---
name: todoist
description: Use when creating or processing Todoist tasks, triaging inbox items, or doing daily task review. Routes to operations (API/batch actions) vs triage (classification + next actions).
---

# Todoist (Entrypoint)

This consolidates the previous `todoist-operations` and `todoist-triage` entrypoints into one top-level skill.

## Safety / Guardrails

- Do **not** create or modify tasks proactively without explicit user request.
- If the user asks to "process my tasks", fetch the full relevant set first (don’t silently process a subset).
- Read comments before acting; comments may contain critical context and attachments.

## Choose A Mode

- **Operations** (API calls, bulk edits, moving tasks, due dates): see [references/operations.md](references/operations.md)
- **Triage** (classification, recommendations, “what should I do with these tasks”): see [references/triage.md](references/triage.md)

