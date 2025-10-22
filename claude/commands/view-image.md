---
description: View images in the terminal using chafa. ALWAYS open images in a separate tmux pane (never in the main agent pane) to avoid disrupting the conversation. Use $TMUX_PANE or tmux display-message to get current pane ID since user may have switched panes. Includes protocols for splitting panes, sending commands to specific panes, and optional cleanup.
---

# Image Viewing with chafa

## Critical Rules

1. **NEVER view images in the main agent pane** - Always use a separate tmux pane
2. **NEVER assume pane IDs are stable** - User may switch panes between commands
3. **ALWAYS use current pane detection** - Use `$TMUX_PANE` or `tmux display-message -p '#{pane_id}'`

## Standard Image Viewing Protocol

```bash
# Step 1: Split a new pane (horizontal split - new pane on right)
tmux split-window -h

# Step 2: Get the ID of the newly created pane
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)

# Step 3: Send chafa command to the new pane
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter

# Optional: Return focus to original pane
tmux select-pane -t "$TMUX_PANE"
```

## Alternative: Vertical Split

```bash
# Split vertically (new pane below)
tmux split-window -v

# Get new pane ID and view image
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "chafa /path/to/image.png" Enter
```

## Viewing Multiple Images

```bash
# View multiple images in the same pane (one after another)
tmux split-window -h
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "chafa image1.png && read && chafa image2.png" Enter
```

## Chafa Options

```bash
# Adjust size to fit pane better
chafa --size 80x40 image.png

# Different color modes
chafa --colors 256 image.png  # 256 colors
chafa --colors full image.png  # True color

# Symbols for better detail
chafa --symbols block image.png
```

## After Image Generation Workflow

```bash
# 1. Generate image
generate-image "prompt" --output my-image.png

# 2. Immediately view in new pane
tmux split-window -h
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
tmux send-keys -t "$NEW_PANE" "chafa my-image.png" Enter

# 3. Continue conversation in original pane
```

## Cleanup (Optional)

```bash
# Close the image viewing pane
tmux kill-pane -t "$NEW_PANE"

# Or tell the user they can close it with: Ctrl+b x
```

## Why Separate Pane?

- chafa output is large and will clutter conversation history
- User can keep image visible while continuing to work
- Easy to reference image while discussing it
- Can close pane when done without losing conversation context

## Common Mistakes to Avoid

❌ **Don't capture pane ID early and reuse:**
```bash
PANE=$(tmux display-message -p '#{pane_id}')  # Gets current pane
# ... user switches panes ...
tmux send-keys -t "$PANE" "..."  # Wrong pane!
```

✅ **Do get pane ID right before use:**
```bash
# ... user might switch panes ...
tmux split-window -h
NEW_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)  # Fresh ID
tmux send-keys -t "$NEW_PANE" "chafa image.png" Enter
```
