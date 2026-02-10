---
name: terminal-images
description: Use when viewing images in the terminal with chafa. ALWAYS open images in a separate tmux pane to avoid cluttering the conversation.
---

# Image Viewing with chafa

## Critical Rules

1. **NEVER view images in the main agent pane** - Always use a separate tmux pane
2. **NEVER assume pane IDs are stable** - User may switch panes between commands
3. **ALWAYS capture $TMUX_PANE first** - Use it to target splits correctly

## Standard Protocol (All-in-One)

```bash
ORIGINAL_PANE=$TMUX_PANE && \
tmux split-window -h -t "$ORIGINAL_PANE" && \
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter
```

For vertical split, use `-v` instead of `-h`.

## Chafa Options

```bash
chafa --size 80x40 image.png      # Adjust size
chafa --colors 256 image.png      # 256 colors
chafa --colors full image.png     # True color
chafa --symbols block image.png   # Better detail
```

## After Image Generation

```bash
generate-image "prompt" --output my-image.png
# Then view with the standard protocol above
```

## Cleanup

```bash
tmux kill-pane -t "$NEW_PANE"     # Or tell user: Ctrl+b x
```

## Acceptance Checks

- [ ] Image opened in a separate tmux pane, not the agent pane
- [ ] $TMUX_PANE captured before splitting
