---
name: Tmux Patterns
description: Use when working with tmux panes, splitting terminal windows, sending commands to specific panes, viewing images in terminal, or running background processes. Critical patterns for reliable pane targeting.
version: 0.1.0
---

# Tmux Patterns

## CRITICAL: Current Pane Detection

**The user may switch panes between your commands.**

### Wrong - Don't cache pane ID early
```bash
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
# ... do other things ...
# ... user might switch panes here ...
tmux send-keys -t "$CURRENT_PANE" "command"  # May target wrong pane!
```

### Right - Get pane ID right before use
```bash
# Get fresh pane ID right before using it
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
tmux send-keys -t "$CURRENT_PANE" "command"
```

### Best - Use $TMUX_PANE for current pane
```bash
# $TMUX_PANE always refers to the pane where command runs
echo "Current pane is: $TMUX_PANE"
```

## Splitting Panes

**Always capture $TMUX_PANE first and use -t to specify which pane to split from!**

```bash
# Capture current pane first
ORIGINAL_PANE=$TMUX_PANE

# Split horizontally (new pane on right) from original pane
tmux split-window -h -t "$ORIGINAL_PANE"

# Split vertically (new pane below)
tmux split-window -v -t "$ORIGINAL_PANE"

# Split with specific command
tmux split-window -h -t "$ORIGINAL_PANE" "htop"

# Get the new pane ID after split
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Sending Commands to Panes

```bash
# Send to specific pane (use stored pane ID, not stale one)
tmux send-keys -t "$PANE_ID" "command" Enter

# Send without pressing enter (for interactive setup)
tmux send-keys -t "$PANE_ID" "partial command"
```

## Getting Pane Information

```bash
# Current pane ID (most reliable)
echo $TMUX_PANE

# List all pane IDs in current window
tmux list-panes -F '#{pane_id}'

# Get most recently created pane
LAST_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Common Workflow: Display in New Pane

```bash
# 1. Save current pane
ORIGINAL_PANE=$TMUX_PANE

# 2. Split to create display pane
tmux split-window -h -t "$ORIGINAL_PANE"
DISPLAY_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)

# 3. Send command to display pane
tmux send-keys -t "$DISPLAY_PANE" "cat file.txt | less" Enter

# 4. Return focus to original pane
tmux select-pane -t "$ORIGINAL_PANE"
```

## Moving Panes/Windows Between Sessions

**CRITICAL: Always use $TMUX_PANE when moving the current pane in async workflows.**

Since Claude operates asynchronously and the user may switch panes between commands, always capture or use `$TMUX_PANE` to ensure you're moving the intended pane.

### Move Current Pane to Another Session (As New Window)

```bash
# ALWAYS use $TMUX_PANE for the source pane in async workflows
tmux move-pane -s "$TMUX_PANE" -t "target-session:"

# With explicit window name in target
tmux move-pane -s "$TMUX_PANE" -t "target-session:new-window-name"
```

### Break Current Pane Into New Window (Same Session)

```bash
# Move current pane to its own window
tmux break-pane -t "$TMUX_PANE"

# With custom window name
tmux break-pane -t "$TMUX_PANE" -n "window-name"
```

### Move Pane to Another Session (Join Existing Window)

```bash
# Join as split in existing window
tmux join-pane -s "$TMUX_PANE" -t "target-session:window-name"

# Specify split direction
tmux join-pane -s "$TMUX_PANE" -t "target-session:window" -h  # horizontal
tmux join-pane -s "$TMUX_PANE" -t "target-session:window" -v  # vertical
```

### Move Entire Window to Another Session

```bash
# Get current window ID
CURRENT_WINDOW=$(tmux display-message -p '#{window_id}')

# Move window to another session
tmux move-window -s "$CURRENT_WINDOW" -t "target-session:"
```

### List Sessions (To Find Target)

```bash
# List all sessions
tmux list-sessions

# List sessions with more detail
tmux list-sessions -F '#{session_name}: #{session_windows} windows'
```

### Why $TMUX_PANE Matters in Async Workflows

When Claude Code runs commands asynchronously:
1. User may switch between panes while Claude is "thinking"
2. Using `tmux display-message -p '#{pane_id}'` might return the *user's current pane*, not Claude's
3. `$TMUX_PANE` is set when the shell session starts and remains stable
4. Always prefer `$TMUX_PANE` over querying the current pane dynamically
