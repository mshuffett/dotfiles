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
