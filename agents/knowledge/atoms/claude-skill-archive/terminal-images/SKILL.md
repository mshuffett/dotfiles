---
description: View images in the terminal using chafa. ALWAYS open images in a separate tmux pane (never in the main agent pane) to avoid disrupting the conversation. Includes protocols for splitting panes and sending commands to specific panes.
---

# Image Viewing with chafa

## Critical Rules

1. **NEVER view images in the main agent pane** - Always use a separate tmux pane
2. **NEVER assume pane IDs are stable** - User may switch panes between commands
3. **ALWAYS capture $TMUX_PANE first** - Use it to target splits correctly

## Standard Protocol

```bash
# All-in-one command (safest - no chance for pane switching)
ORIGINAL_PANE=$TMUX_PANE && \
tmux split-window -h -t "$ORIGINAL_PANE" && \
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter
```

## Step-by-Step Version

```bash
# Step 1: Capture current pane RIGHT NOW before user can switch
ORIGINAL_PANE=$TMUX_PANE

# Step 2: Split from the ORIGINAL_PANE explicitly
tmux split-window -h -t "$ORIGINAL_PANE"

# Step 3: Get the newly created pane ID immediately
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)

# Step 4: Send command to the new pane
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter
```

## Vertical Split

```bash
ORIGINAL_PANE=$TMUX_PANE && \
tmux split-window -v -t "$ORIGINAL_PANE" && \
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter
```

## Chafa Options

```bash
chafa --size 80x40 image.png      # Adjust size
chafa --colors 256 image.png      # 256 colors
chafa --colors full image.png     # True color
chafa --symbols block image.png   # Better detail
```

## After Image Generation

```bash
# 1. Generate image
generate-image "prompt" --output my-image.png

# 2. View in new pane (use all-in-one command above)
```

## Cleanup (Optional)

```bash
tmux kill-pane -t "$NEW_PANE"
# Or tell user: Ctrl+b x to close
```

## Why Separate Pane?

- chafa output clutters conversation history
- User can keep image visible while working
- Easy to reference image while discussing
- Close pane without losing conversation context
