---
name: Tmux Pane Targeting
description: >-
  Use when splitting, moving, or targeting tmux panes, sending commands to panes, or any tmux
  operation requiring pane IDs. Critical: user may switch panes while Claude thinks.
version: 1.0.0
---

# Tmux Pane Targeting

## CRITICAL: Use $TMUX_PANE, Not Dynamic Queries

The user may switch panes between your commands. `$TMUX_PANE` is set when the shell session starts and remains stable, while `tmux display-message -p '#{pane_id}'` returns the user's *current* pane which may have changed.

```bash
# WRONG - User might switch panes between commands
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
# ... user switches panes while Claude thinks ...
tmux send-keys -t "$CURRENT_PANE" "command"  # Targets wrong pane!

# RIGHT - $TMUX_PANE always refers to Claude's pane
tmux send-keys -t "$TMUX_PANE" "command" Enter
```

## Splitting Panes

Always capture `$TMUX_PANE` first and use `-t` to specify which pane to split from.

```bash
ORIGINAL_PANE=$TMUX_PANE

# Split horizontally (new pane on right)
tmux split-window -h -t "$ORIGINAL_PANE"

# Split vertically (new pane below)
tmux split-window -v -t "$ORIGINAL_PANE"

# Split with command
tmux split-window -h -t "$ORIGINAL_PANE" "htop"

# Get the new pane ID after split
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Sending Commands to Panes

```bash
# Send command with Enter
tmux send-keys -t "$PANE_ID" "command" Enter

# Send without pressing Enter (for interactive setup)
tmux send-keys -t "$PANE_ID" "partial command"
```

## Common Workflow: Display in New Pane

```bash
ORIGINAL_PANE=$TMUX_PANE

# Split and capture new pane ID
tmux split-window -h -t "$ORIGINAL_PANE"
DISPLAY_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)

# Send command to display pane
tmux send-keys -t "$DISPLAY_PANE" "cat file.txt | less" Enter

# Return focus to original pane
tmux select-pane -t "$ORIGINAL_PANE"
```

## Moving Panes Between Sessions

```bash
# Move current pane to another session (as new window)
tmux move-pane -s "$TMUX_PANE" -t "target-session:"

# Break current pane into new window (same session)
tmux break-pane -t "$TMUX_PANE" -n "window-name"

# Join pane as split in existing window
tmux join-pane -s "$TMUX_PANE" -t "target-session:window" -h  # horizontal
tmux join-pane -s "$TMUX_PANE" -t "target-session:window" -v  # vertical

# Move entire window to another session
CURRENT_WINDOW=$(tmux display-message -p '#{window_id}')
tmux move-window -s "$CURRENT_WINDOW" -t "target-session:"
```

## Getting Pane Information

```bash
echo $TMUX_PANE                              # Current pane ID (most reliable)
tmux list-panes -F '#{pane_id}'              # All panes in current window
tmux list-panes -F '#{pane_id}' | tail -n 1  # Most recently created pane
tmux list-sessions                           # All sessions
```

## Acceptance Checks

- [ ] Using `$TMUX_PANE` instead of `tmux display-message -p '#{pane_id}'` for current pane
- [ ] Capturing `ORIGINAL_PANE=$TMUX_PANE` before split operations
- [ ] Using `-t` flag to target specific panes
- [ ] Getting new pane ID after splits with `tmux list-panes`
