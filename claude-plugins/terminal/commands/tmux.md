---
description: tmux pane and window management patterns. CRITICAL - always use $TMUX_PANE or tmux display-message to get current pane ID since user may switch panes between commands. Includes splitting panes, sending commands to specific panes, pane selection, and common operations. Use when working with tmux, viewing images, running background processes, or managing terminal layout.
---

# tmux Pane Management

## CRITICAL: Current Pane Detection

**The user may switch panes between your commands.**

❌ **WRONG - Don't capture pane ID early:**
```bash
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
# ... do other things ...
# ... user might switch panes here ...
tmux send-keys -t "$CURRENT_PANE" "command"  # May target wrong pane!
```

✅ **RIGHT - Get pane ID right before use:**
```bash
# ... do other things ...
# Get fresh pane ID right before using it
CURRENT_PANE=$(tmux display-message -p '#{pane_id}')
tmux send-keys -t "$CURRENT_PANE" "command"
```

✅ **BEST - Use $TMUX_PANE for current pane:**
```bash
# $TMUX_PANE always refers to the pane where command runs
echo "Current pane is: $TMUX_PANE"
```

## Splitting Panes

**CRITICAL: Always capture $TMUX_PANE first and use -t to specify which pane to split from!**

```bash
# Capture current pane first (user may switch panes between commands)
ORIGINAL_PANE=$TMUX_PANE

# Split horizontally (new pane on right) from the original pane
tmux split-window -h -t "$ORIGINAL_PANE"

# Split vertically (new pane below) from the original pane
tmux split-window -v -t "$ORIGINAL_PANE"

# Split with specific command
tmux split-window -h -t "$ORIGINAL_PANE" "htop"

# Split and get the new pane ID
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Getting Pane Information

```bash
# Current pane ID (most reliable)
echo $TMUX_PANE

# Current pane ID (alternative)
tmux display-message -p '#{pane_id}'

# List all pane IDs in current window
tmux list-panes -F '#{pane_id}'

# Get most recently created pane
LAST_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)

# Get pane index, size, title
tmux display-message -p '#{pane_index} #{pane_width}x#{pane_height} #{pane_title}'

# List all panes with details
tmux list-panes
```

## Sending Commands to Panes

```bash
# Send to specific pane by ID
tmux send-keys -t %1 "echo hello" Enter

# Send to specific pane by variable
tmux send-keys -t "$NEW_PANE" "ls -la" Enter

# Send to current pane
tmux send-keys "pwd" Enter

# Send multiple commands
tmux send-keys -t "$PANE" "cd /tmp" Enter
tmux send-keys -t "$PANE" "ls" Enter

# Send without pressing Enter (user presses Enter)
tmux send-keys -t "$PANE" "vim file.txt"
```

## Pane Selection

```bash
# Select specific pane
tmux select-pane -t %1

# Select by direction
tmux select-pane -L  # Left
tmux select-pane -R  # Right
tmux select-pane -U  # Up
tmux select-pane -D  # Down

# Select last active pane
tmux select-pane -l

# Select next/previous pane
tmux select-pane -t :.+
tmux select-pane -t :.-
```

## Pane Layouts

```bash
# Cycle through preset layouts
tmux select-layout even-horizontal
tmux select-layout even-vertical
tmux select-layout main-horizontal
tmux select-layout main-vertical
tmux select-layout tiled

# Next/previous layout
tmux next-layout
tmux previous-layout
```

## Resizing Panes

```bash
# Resize by lines/columns
tmux resize-pane -L 10  # Left 10 columns
tmux resize-pane -R 10  # Right 10 columns
tmux resize-pane -U 5   # Up 5 lines
tmux resize-pane -D 5   # Down 5 lines

# Resize specific pane
tmux resize-pane -t %1 -R 20
```

## Closing Panes

```bash
# Kill specific pane
tmux kill-pane -t %1

# Kill current pane (dangerous - use with caution)
tmux kill-pane

# Kill all panes except current
tmux kill-pane -a
```

## Common Workflows

### Run Command in New Pane

```bash
# Split and run command
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "htop" Enter
```

### View File in New Pane

```bash
# Split and view file
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -v -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "cat file.txt" Enter
```

### Run Background Process in New Pane

```bash
# Split, run process, return focus to original
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "npm run dev" Enter
tmux select-pane -t "$ORIGINAL_PANE"
```

### Temporary Pane for Quick View

```bash
# Split, view, user can close when done
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "git log --oneline" Enter
echo "Close the pane with: Ctrl+b x"
```

## Window Operations (Less Common)

```bash
# Create new window
tmux new-window

# Create new window with command
tmux new-window "htop"

# List windows
tmux list-windows

# Select window
tmux select-window -t 1

# Rename current window
tmux rename-window "my-window"

# Kill window
tmux kill-window -t 1
```

## Best Practices

1. **Always get fresh pane IDs** - Don't cache them unless you're using them immediately
2. **Use $TMUX_PANE when possible** - It's always current
3. **Store new pane ID right after creation** - Prevents race conditions
4. **Return focus to original pane** - If you want user to continue in original context
5. **Tell user how to close panes** - `Ctrl+b x` or you can kill them programmatically
6. **Test pane exists before sending** - Use `tmux list-panes` to verify

## Checking if in tmux

```bash
# Check if running inside tmux
if [ -n "$TMUX" ]; then
    echo "Inside tmux session"
else
    echo "Not in tmux"
fi
```

## Integration with Other Tools

### With chafa (image viewing)
See `/view-image` command

### With logs (monitoring)
```bash
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -v -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "tail -f /var/log/system.log" Enter
```

### With build processes
```bash
ORIGINAL_PANE=$TMUX_PANE
tmux split-window -h -t "$ORIGINAL_PANE"
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "pnpm run build --watch" Enter
```
