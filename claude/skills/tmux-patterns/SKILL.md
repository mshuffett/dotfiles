---
description: "MANDATORY before tmux split-window or send-keys. Use $TMUX_PANE and -t flag."
read_when:
  - About to run any tmux split-window command
  - About to run any tmux send-keys command
  - User asks to split a pane or open something in a new pane
---

# tmux Pane Management

## CRITICAL: Current Pane Detection

**The user may switch panes between your commands.**

WRONG - Don't capture pane ID early:
```bash
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
# ... do other things - user might switch panes here ...
tmux send-keys -t "$CURRENT_PANE" "command"  # May target wrong pane!
```

RIGHT - Get pane ID right before use (or use $TMUX_PANE):
```bash
# $TMUX_PANE always refers to the pane where command runs
echo "Current pane is: $TMUX_PANE"

# Or get fresh pane ID right before using it
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
tmux send-keys -t "$CURRENT_PANE" "command"
```

## Splitting Panes

**Always capture $TMUX_PANE first and use -t to specify which pane to split from.**

```bash
# Capture current pane first
ORIGINAL_PANE=$TMUX_PANE

# Split horizontally (new pane on right)
tmux split-window -h -t "$ORIGINAL_PANE"

# Split vertically (new pane below)
tmux split-window -v -t "$ORIGINAL_PANE"

# Split with specific command
tmux split-window -h -t "$ORIGINAL_PANE" "htop"

# Split and capture new pane ID
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Getting Pane Information

```bash
echo $TMUX_PANE                                    # Current pane ID (most reliable)
tmux display-message -p '#{pane_id}'               # Alternative
tmux list-panes -F '#{pane_id}'                    # All pane IDs in window
tmux list-panes -F '#{pane_id}' | tail -n 1        # Most recently created pane
tmux display-message -p '#{pane_index} #{pane_width}x#{pane_height}'  # Pane details
```

## Sending Commands to Panes

```bash
tmux send-keys -t %1 "echo hello" Enter            # To pane by ID
tmux send-keys -t "$NEW_PANE" "ls -la" Enter       # To pane by variable
tmux send-keys "pwd" Enter                         # To current pane
tmux send-keys -t "$PANE" "vim file.txt"           # Without pressing Enter
```

## Pane Selection

```bash
tmux select-pane -t %1       # Specific pane
tmux select-pane -L          # Left
tmux select-pane -R          # Right
tmux select-pane -U          # Up
tmux select-pane -D          # Down
tmux select-pane -l          # Last active pane
```

## Pane Layouts

```bash
tmux select-layout even-horizontal
tmux select-layout even-vertical
tmux select-layout main-horizontal
tmux select-layout main-vertical
tmux select-layout tiled
```

## Resizing Panes

```bash
tmux resize-pane -L 10       # Left 10 columns
tmux resize-pane -R 10       # Right 10 columns
tmux resize-pane -U 5        # Up 5 lines
tmux resize-pane -D 5        # Down 5 lines
tmux resize-pane -t %1 -R 20 # Resize specific pane
```

## Closing Panes

```bash
tmux kill-pane -t %1         # Kill specific pane
tmux kill-pane               # Kill current pane (use with caution)
tmux kill-pane -a            # Kill all panes except current
```

## Common Workflows

### Run Command in New Pane
```bash
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "npm run dev" Enter
tmux select-pane -t "$ORIGINAL_PANE"  # Return focus to original
```

### Monitor Logs in New Pane
```bash
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -v -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "tail -f /var/log/system.log" Enter
```

## Window Operations

```bash
tmux new-window              # Create new window
tmux new-window "htop"       # With command
tmux list-windows            # List windows
tmux select-window -t 1      # Select window
tmux rename-window "name"    # Rename current window
tmux kill-window -t 1        # Kill window
```

## Checking if in tmux

```bash
if [ -n "$TMUX" ]; then
    echo "Inside tmux session"
fi
```

## Best Practices

1. **Always get fresh pane IDs** - Don't cache them unless using immediately
2. **Use $TMUX_PANE when possible** - It's always current
3. **Store new pane ID right after creation** - Prevents race conditions
4. **Return focus to original pane** - If user should continue in original context
5. **Tell user how to close panes** - `Ctrl+b x` or kill programmatically

## Acceptance Checks

- [ ] Always using $TMUX_PANE or fresh tmux display-message for current pane
- [ ] Specifying -t target when splitting panes
- [ ] Capturing new pane ID immediately after creation
- [ ] Returning focus to original pane when appropriate
