---
name: Claude Schedule
description: This skill should be used when the user asks to "schedule a task", "run claude in background", "set up a cron job for claude", "schedule recurring task", "run this every X minutes/hours", "unschedule task", "check scheduled tasks", "view task logs", or mentions "claude-schedule", "background claude", "automated claude".
---

# Claude Schedule

Schedule Claude Code tasks to run automatically in the background using cron/launchd.

## Quick Reference

```bash
# Schedule recurring task
claude-schedule add <name> --every 30m --prompt "your task"
claude-schedule add <name> --every 1h --file ./task.md

# Schedule one-time task
claude-schedule add <name> --once --in 2h --prompt "do this once"
claude-schedule add <name> --once --at "2026-01-25 14:00" --prompt "at specific time"

# Manage tasks
claude-schedule list                    # List all tasks
claude-schedule remove <name>           # Remove task
claude-schedule pause <name>            # Pause task
claude-schedule resume <name>           # Resume task
claude-schedule run <name>              # Run immediately

# View logs and notes
claude-schedule logs <name>             # View latest log
claude-schedule logs <name> -f          # Follow log output
claude-schedule logs <name> --all       # List all runs
claude-schedule history <name>          # Show run history table
claude-schedule notes <name>            # View task notes
claude-schedule notes shared            # View shared notes

# Runner management
claude-schedule setup-runner            # Install background runner
claude-schedule remove-runner           # Remove background runner
```

## Intervals

- Minutes: `5m`, `10m`, `30m`
- Hours: `1h`, `6h`, `12h`
- Days: `1d`, `7d`

## How It Works

1. **Runner**: A launchd job (macOS) or cron job (Linux) runs every 60 seconds
2. **Tick**: Each tick checks for due tasks and runs them
3. **Coalescing**: If computer was off and tasks were missed, each task runs once on wake (not multiple times)
4. **Logs**: Each run is logged to `~/.claude/scheduled/logs/<task>/`

## Notifications

Scheduled tasks are told to notify the user via Todoist:

- **Not urgent**: Add to Todoist inbox (no due date)
- **Urgent**: Add to Todoist with due date of today

## Notes System

Tasks can leave persistent notes:

- **Task-specific**: `~/.claude/scheduled/notes/<task-name>.md`
- **Shared (all tasks)**: `~/.claude/scheduled/notes/shared.md`

View notes:
```bash
claude-schedule notes my-task        # Task-specific notes
claude-schedule notes shared         # Shared notes
claude-schedule notes my-task -e     # Edit in $EDITOR
```

## Directory Structure

```
~/.claude/scheduled/
├── tasks.json                    # Task configurations
├── runner.log                    # Runner output
├── notes/
│   ├── shared.md                 # Shared notes (all tasks)
│   └── <task-name>.md            # Task-specific notes
└── logs/
    └── <task-name>/
        ├── latest.log            # Symlink to most recent
        ├── 20260124_143000.log   # Individual run logs
        └── history.jsonl         # Structured run history
```

## Examples

### Monitor a repo for issues

```bash
claude-schedule add issue-monitor --every 1h --prompt "
Check ~/ws/myrepo for any open GitHub issues.
If there are new issues since last check, summarize them in your notes.
If any are critical bugs, add to Todoist with today's due date.
"
```

### Daily cleanup

```bash
claude-schedule add daily-cleanup --every 1d --prompt "
Clean up old branches in ~/ws/myrepo.
Delete merged branches older than 7 days.
Log what was cleaned to notes.
"
```

### One-time reminder

```bash
claude-schedule add deploy-reminder --once --at "2026-01-25 09:00" --prompt "
Add a Todoist task: 'Deploy v2.0 to production - scheduled for today'
"
```

## Troubleshooting

### Tasks not running

```bash
# Check runner is installed
launchctl list | grep claude  # macOS
crontab -l | grep claude      # Linux

# Check runner log
cat ~/.claude/scheduled/runner.log

# Manually trigger tick
claude-schedule tick
```

### Reinstall runner

```bash
claude-schedule remove-runner
claude-schedule setup-runner
```

### View task config

```bash
cat ~/.claude/scheduled/tasks.json
```
