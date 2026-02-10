# Agent Teams Reference

## Prerequisites

Agent teams are experimental and gated behind a flag:

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

## When to Use Teams vs Subagents

| Criteria | Subagents | Agent Teams |
|----------|-----------|-------------|
| Communication | Results return to caller only | Teammates message each other directly |
| Coordination | Main agent manages all work | Shared task list, self-coordination |
| Best for | Focused tasks where only the result matters | Complex work requiring discussion and collaboration |
| Token cost | Lower (results summarized) | Higher (each teammate = separate context window) |

Best team use cases: parallel code review, competing debug hypotheses, cross-layer coordination (frontend + backend + tests), research from multiple angles.

Avoid teams for: sequential tasks, same-file edits, work with many dependencies.

## Display Modes

Configured via `teammateMode` in settings.json or `--teammate-mode` CLI flag:

- **in-process** (default in non-tmux terminals): All teammates in one terminal
- **split panes**: Each teammate in its own tmux/iTerm2 pane. Requires tmux or iTerm2 with `it2` CLI
- **auto** (default): Split panes if already in tmux, in-process otherwise

Split panes do NOT work in: VS Code terminal, Windows Terminal, Ghostty.

## Keyboard Shortcuts (In-Process Mode)

| Shortcut | Action |
|----------|--------|
| `Shift+Up/Down` | Select a teammate |
| `Enter` | View selected teammate's session |
| `Escape` | Interrupt teammate's current turn |
| `Ctrl+T` | Toggle task list |
| `Shift+Tab` | Cycle into delegate mode |

## Delegate Mode

Activated with `Shift+Tab`. Restricts the lead to coordination-only tools:
- Spawning/messaging/shutting down teammates
- Managing tasks

Use when the lead keeps implementing instead of delegating. Alternatively, tell the lead: "Wait for your teammates to complete their tasks before proceeding."

## Task Sizing

Aim for **5-6 tasks per teammate**:
- Too few: coordination overhead exceeds benefit
- Too large: teammates work too long without check-ins, wasted effort risk
- Right size: self-contained units with clear deliverables (a function, test file, review)

If the lead isn't creating enough tasks, ask it to split work into smaller pieces.

## Quality Gate Hooks

### TeammateIdle
Runs when a teammate is about to go idle.
- Exit code 0: teammate goes idle normally
- Exit code 2: sends feedback and keeps teammate working

### TaskCompleted
Runs when a task is being marked complete.
- Exit code 0: task marked complete
- Exit code 2: prevents completion, sends feedback

## Plan Approval Workflow

Require plan approval at spawn time:
```
Spawn an architect teammate to refactor the auth module.
Require plan approval before they make any changes.
```

Teammate works in read-only plan mode until lead approves. Lead makes approval decisions autonomously. Influence with criteria: "only approve plans that include test coverage."

## Permissions

- Teammates inherit the lead's permission settings at spawn
- Per-teammate modes can be changed after spawning, not at spawn time
- Pre-approve common operations in permission settings BEFORE spawning to reduce interruption friction

## Known Limitations

- **No session resumption**: `/resume` and `/rewind` don't restore in-process teammates
- **One team per session**: Clean up current team before starting a new one
- **No nested teams**: Teammates cannot spawn their own teams
- **Lead is fixed**: Can't promote a teammate or transfer leadership
- **Task status can lag**: Teammates sometimes fail to mark tasks complete; nudge manually
- **Shutdown is slow**: Teammates finish current tool call before exiting

## Troubleshooting

- **Teammates not appearing**: Press `Shift+Down` to cycle through them (may be running but not visible)
- **Too many permission prompts**: Pre-approve common operations in permission settings
- **Lead implements instead of delegating**: Tell it to wait, or use delegate mode
- **Orphaned tmux sessions**: `tmux ls` then `tmux kill-session -t <session-name>`

## Cleanup

Always clean up via the lead (not teammates). Shut down all teammates first, then:
```
Clean up the team
```
