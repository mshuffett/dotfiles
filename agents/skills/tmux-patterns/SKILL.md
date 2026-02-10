---
name: tmux-patterns
description: Use before any tmux split-window or send-keys command. Covers $TMUX_PANE tracking, pane splitting, and send-keys quoting to prevent targeting the wrong pane.
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

RIGHT - Use $TMUX_PANE or get fresh ID right before use:
```bash
# $TMUX_PANE always refers to the pane where command runs
echo "Current pane is: $TMUX_PANE"
```

## Splitting Panes

**Always capture $TMUX_PANE first and use -t to specify which pane to split from.**

```bash
ORIGINAL_PANE=$TMUX_PANE

# Split horizontally (new pane on right)
tmux split-window -h -t "$ORIGINAL_PANE"

# Split vertically (new pane below)
tmux split-window -v -t "$ORIGINAL_PANE"

# Capture new pane ID immediately
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
```

## Sending Commands to Panes

```bash
tmux send-keys -t %1 "echo hello" Enter            # To pane by ID
tmux send-keys -t "$NEW_PANE" "ls -la" Enter       # To pane by variable
tmux send-keys "pwd" Enter                         # To current pane
```

## Getting Pane Information

```bash
echo $TMUX_PANE                                    # Current pane ID (most reliable)
tmux list-panes -F '#{pane_id}'                    # All pane IDs in window
tmux list-panes -F '#{pane_id}' | tail -n 1        # Most recently created pane
```

## Pane Selection & Navigation

```bash
tmux select-pane -t %1       # Specific pane
tmux select-pane -L/-R/-U/-D # Directional
tmux select-pane -l          # Last active pane
```

## Common Workflow: Run Command in New Pane

```bash
ORIGINAL_PANE=$TMUX_PANE && \
tmux split-window -h -t "$ORIGINAL_PANE" && \
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
tmux send-keys -t "$NEW_PANE" "npm run dev" Enter && \
tmux select-pane -t "$ORIGINAL_PANE"
```

## Best Practices

1. **Always get fresh pane IDs** - Don't cache unless using immediately
2. **Use $TMUX_PANE when possible** - It's always current
3. **Store new pane ID right after creation** - Prevents race conditions
4. **Return focus to original pane** - If user should continue in original context

## Acceptance Checks

- [ ] Using $TMUX_PANE or fresh tmux display-message for current pane
- [ ] Specifying -t target when splitting panes
- [ ] Capturing new pane ID immediately after creation
