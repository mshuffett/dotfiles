---
name: claude-code-routines
description: How Claude Code Routines work — Remote (cloud) vs Local (desktop scheduled task) and which tools map to which
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3a20c884-9081-4961-9cee-56829f210771
---

Claude Code **Routines** (research preview) are saved configs (prompt + repo(s) + connectors) with one or more triggers. Two runtimes, selected via "New routine → Remote/Local" in the Desktop Routines panel:

- **Remote** = runs on Anthropic cloud infra (works with laptop closed). This is the "Routines" panel in the app, `/schedule` in the CLI, and claude.ai/code/routines — all write to the same cloud account. Triggers: **Schedule** (hourly/daily/weekday/weekly or one-off; local tz; **min 1-hour interval**), **API** (per-routine `POST …/fire` + bearer token, `experimental-cc-routine-2026-04-01` beta header), **GitHub** (PR + Release events, with filters). Plans: Pro/Max/Team/Enterprise with Claude Code on the web; daily run cap per account (~5–25 by tier); one-off runs exempt from cap.
- **Local** = a **Desktop scheduled task**, runs on the user's machine. This is what the local `scheduled-tasks` MCP tools (`create_scheduled_task`/`list_scheduled_tasks`/`update_scheduled_task`) and the loaded "schedule" skill actually manage; stored under `~/.claude/scheduled-tasks/`. Runs only while the app is open (fires on next launch if missed). Distinct from `/loop` + in-session `CronCreate` (session-only, in-memory, 7-day expiry).

Gotcha: a green run status only means the session started/exited without infra error — NOT that the task succeeded; open the run to confirm.

Docs: https://code.claude.com/docs/en/routines (Desktop scheduled tasks: /en/desktop-scheduled-tasks; in-session: /en/scheduled-tasks).
