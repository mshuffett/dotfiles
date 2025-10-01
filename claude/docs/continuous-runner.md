# Continuous Claude Runner - Full Documentation

**Script Location**: `~/bin/claude-continuous`

## Validated Performance
- ✅ 12+ hours continuous operation tested
- ✅ 150+ check-ins without failure
- ✅ Zero restarts required
- ✅ Auto-recovery on crashes

## How It Works

Keeps Claude running with periodic check-ins (default: every 3 minutes) and automatic recovery if the session crashes.

**Two Modes:**

### 1. Background Mode (Recommended)
Runs in the current Claude session. Auto-check-ins keep the conversation active.

```bash
# Start in background
nohup claude-continuous background "" "" 180 start > /dev/null 2>&1 &

# Check status
claude-continuous background "" "" "" status

# Stop
pkill -f "claude-continuous.*background"

# View logs
tail -f claude_continuous.log
```

### 2. New Session Mode
Creates a separate tmux session with a new Claude instance.

```bash
# Start new session
claude-continuous new-session my-task /path/to/dir 180 start

# Check status
claude-continuous new-session my-task /path/to/dir 180 status

# Stop
claude-continuous new-session my-task /path/to/dir 180 stop

# Attach to session
tmux attach -t my-task
```

## When to Use

**Use continuous runner when:**
- Long-running tasks (2+ hours expected)
- Overnight or multi-day operations
- Tasks requiring unattended autonomous work
- User explicitly requests continuous operation

**Do NOT use for:**
- Normal tasks under 1-2 hours
- Interactive work requiring user input
- Tasks where user is actively monitoring
- Without explicit user permission

## What Happens

1. **Background process starts** - Runs in background, doesn't block terminal
2. **Periodic check-ins** - Every 3 minutes (configurable), sends reminder to continue working
3. **Health monitoring** - Checks if Claude is responsive
4. **Auto-recovery** - Restarts if crashed (new-session mode only)
5. **Logging** - All activity logged to `claude_continuous.log`

## Arguments

```
claude-continuous {background|new-session} [session_name] [work_dir] [interval] {start|stop|status}
```

- **Mode**: `background` (current session) or `new-session` (new tmux)
- **session_name**: Name for tmux session (default: claude-continuous)
- **work_dir**: Working directory (default: current directory)
- **interval**: Seconds between check-ins (default: 180)
- **Command**: start, stop, or status

## Logs

Logs are saved to `claude_continuous.log` in the working directory:

```
[2025-10-01 10:49:04] Health check passed (PID: 28639)
[2025-10-01 10:49:04] Sending check-in #150 to Claude
[2025-10-01 10:49:04] Runtime: 770 minutes | Iteration: 150
```

Use `tail -f claude_continuous.log` to watch in real-time.

## Safety Notes

- Always runs in background (non-blocking)
- Can be stopped with `pkill` or the stop command
- Logs provide full audit trail
- No data loss - all work is in normal Claude conversation
