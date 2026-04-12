---
name: session-save
description: Use when the user asks to save session context, identify the current session or thread, create a resumable handoff, or prepare a Todoist/note summary that must include the working directory and session id. Works across Codex and Claude Code by detecting runtime-specific session identifiers and normalizing them into one summary.
---

# Session Save

Create a durable handoff with the current runtime, directory, and session identifiers.

## Use This For

- "what session is this"
- "save this session"
- "create a handoff with the session id and directory"
- "make a Todoist task with the current session info"
- "/session-save"

## Core Step

Run the helper first:

```bash
~/.dotfiles/agents/skills/session-save/scripts/session_context.sh --json
```

This returns normalized context for:

- `cwd`
- `repo_root`
- `codex_thread_id`
- `claude_session_id`
- `primary_runtime`
- `primary_session_id`

## Rules

1. Never guess a session id. If the helper returns none, say it is unavailable.
2. If both Codex and Claude identifiers are present, report both and label them.
3. For Todoist actions, prefer `td task add` or other `td` commands over raw API calls.
4. For resumable handoffs, always include:
   - directory
   - repo root
   - primary runtime
   - primary session id
   - other runtime id if present
   - current state
   - next steps
   - key artifact paths
5. Keep the saved summary concise and operator-friendly.

## Output Template

```text
Directory: ...
Repo root: ...
Primary runtime: ...
Primary session id: ...
Other session ids:
- Codex thread: ...
- Claude session: ...

State:
- ...

Next steps:
1. ...
2. ...

Artifacts:
- ...
```

## Claude Code Notes

- In plain conversation, Claude may not know its own session id unless it inspects env or SDK/session metadata.
- `CLAUDE_SESSION_ID` is the best local env signal when available.
- Claude Code CLI also supports `--resume <session>` and `--session-id <uuid>`.

## Codex Notes

- `CODEX_THREAD_ID` is the main session/thread identity to capture.
- If a nested Claude run is launched from Codex, both ids may exist; report both rather than collapsing them.
