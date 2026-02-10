---
name: agent-teams
description: Use when creating, coordinating, or managing Claude Code agent teams. Covers display modes, delegate mode, hooks, task sizing, keyboard shortcuts, and known limitations.
---

# Agent Teams

Detailed reference: [agent-teams atom](../../knowledge/atoms/agent-teams.md)

## Prerequisites

Requires experimental flag:

```json
// settings.json
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

## Quick Decision: Teams vs Subagents

Use **subagents** when workers report results back (lower tokens, simpler).
Use **teams** when workers need to message each other, share findings, and self-coordinate (higher tokens).

## Key Controls

- **Delegate mode** (`Shift+Tab`): Prevents lead from implementing — coordination only
- **Task sizing**: Aim for 5-6 tasks per teammate
- **File conflicts**: Assign non-overlapping files to each teammate
- **Plan approval**: Spawn with "require plan approval" for risky work
- **Permissions**: Pre-approve common operations before spawning to reduce friction

## Keyboard Shortcuts (In-Process Mode)

| Shortcut | Action |
|----------|--------|
| `Shift+Up/Down` | Select teammate |
| `Enter` | View teammate's session |
| `Escape` | Interrupt teammate's turn |
| `Ctrl+T` | Toggle task list |
| `Shift+Tab` | Delegate mode |

## Quality Gate Hooks

- **TeammateIdle**: Exit code 2 = send feedback, keep working
- **TaskCompleted**: Exit code 2 = prevent completion, send feedback

## Known Limitations

- No session resumption for in-process teammates
- One team per session; no nested teams
- Lead is fixed (can't promote)
- Split panes don't work in VS Code terminal, Windows Terminal, Ghostty

## Cleanup

Always clean up via the lead. Shut down all teammates first, then ask lead to clean up.

## Acceptance Checks

- [ ] `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled
- [ ] Display mode appropriate to terminal
- [ ] Tasks sized ~5-6 per teammate
- [ ] Non-overlapping file assignments
- [ ] Team cleaned up via lead when done
