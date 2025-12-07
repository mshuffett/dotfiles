---
description: Keeps Codex sessions tidy by launching codex-auto-compact, which checks context every 15 minutes and issues /compact. Requires explicit approval before starting.
---

# Codex Auto-Compact Command

## Protocol (MANDATORY)

1. **Explain the behavior**:
	- "I'll launch codex-auto-compact in the background"
	- "Every 15 minutes it captures the Codex pane, logs the latest context percentage, then sends /compact"
	- "Logs are appended to codex_auto_compact.log in the current working directory"
2. **Request explicit approval**:
	- Ask: "Should I start Codex auto-compact now? (yes/no)"
	- Only continue when the user responds with a clear affirmative ("yes", "go", "start", etc.)
3. **If the user declines**:
	- Provide the manual command: `PANE_ID=$TMUX_PANE nohup codex-auto-compact "$PANE_ID" "" 900 > /dev/null 2>&1 &`
	- Mention how to tail the log manually.
4. **If the user approves**:
	- Run: `PANE_ID=$TMUX_PANE nohup codex-auto-compact "$PANE_ID" "" 900 > /dev/null 2>&1 &`
	- Confirm launch by showing the new background PID.
	- Remind the user: "Watch with tail -f codex_auto_compact.log".

## Usage Notes

- **Script location**: `~/bin/codex-auto-compact`
- **Defaults**: 15-minute interval (900s), captures the last 80 lines of the pane before compaction, logs to `codex_auto_compact.log`.
- **Requirements**: Must be inside tmux; pass a pane ID explicitly if running from another session.
- **Custom interval**: Provide seconds as third argument, e.g. `codex-auto-compact "$PANE_ID" "" 600` for 10-minute cadence.
- **Stopping**: `pkill -f codex-auto-compact`.
- **Status**: `ps aux | grep codex-auto-compact | grep -v grep`.
- **What gets logged**:
	- Start/stop banners
	- Latest "NN% context left" line if present; otherwise a notice that no meter was detected
	- Confirmation each time `/compact` is sent

## When to Use

- Long Codex hackathon or pairing sessions where context bloat is likely.
- Anytime the session pushes past ~85% context and manual compaction is getting forgotten.
- Never run without the user’s explicit go-ahead.

