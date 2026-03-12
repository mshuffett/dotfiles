---
name: terminal-images
description: Use when viewing images in the terminal with chafa. ALWAYS open images in a separate tmux pane to avoid cluttering the conversation. Handles multi-image sequences by persisting the pane ID to a temp file.
---

# Image Viewing with chafa

## Why a Temp File?

Each Bash tool call runs in a fresh shell — variables like `$NEW_PANE` don't survive
between calls. The user also rearranges tmux panes freely, so positional tricks
(`list-panes | tail -n 1`) break. Writing the pane ID to a known file
(`/tmp/claude-image-pane`) solves both problems: any future Bash call can read it
back and verify the pane still exists before sending keys.

## Critical Rules

1. **NEVER view images in the main agent pane** — always use a separate tmux pane
2. **NEVER assume pane IDs are stable** — the user rearranges panes between commands
3. **ALWAYS persist the image pane ID** to `/tmp/claude-image-pane` after creating it
4. **ALWAYS verify the pane exists** before sending keys (it may have been closed)

## Open a New Image Pane

Use this when no image pane exists yet (or the previous one was closed).
Everything runs in a single Bash call so the pane ID is captured reliably.

```bash
ORIGINAL_PANE=$TMUX_PANE && \
tmux split-window -h -t "$ORIGINAL_PANE" && \
IMG_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
echo "$IMG_PANE" > /tmp/claude-image-pane && \
tmux send-keys -t "$IMG_PANE" "chafa --size 120x60 /path/to/image.png" Enter
```

For vertical split, use `-v` instead of `-h`.

## Send Another Image to the Existing Pane

Use this for every image after the first. Reads the persisted pane ID, verifies
it still exists, and reuses it. Falls back to opening a new pane if needed.

```bash
IMG_PANE=$(cat /tmp/claude-image-pane 2>/dev/null) && \
if [ -n "$IMG_PANE" ] && tmux has-session -t "$IMG_PANE" 2>/dev/null; then \
  tmux send-keys -t "$IMG_PANE" "chafa --size 120x60 /path/to/image.png" Enter; \
else \
  ORIGINAL_PANE=$TMUX_PANE && \
  tmux split-window -h -t "$ORIGINAL_PANE" && \
  IMG_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1) && \
  echo "$IMG_PANE" > /tmp/claude-image-pane && \
  tmux send-keys -t "$IMG_PANE" "chafa --size 120x60 /path/to/image.png" Enter; \
fi
```

## Multi-Image Sequence (Scrollable)

When showing many images (e.g., logo explorations), send them all to the same
pane with labels. The user can scroll back in the pane to compare.

```bash
IMG_PANE=$(cat /tmp/claude-image-pane 2>/dev/null)
if [ -z "$IMG_PANE" ] || ! tmux has-session -t "$IMG_PANE" 2>/dev/null; then
  ORIGINAL_PANE=$TMUX_PANE
  tmux split-window -h -t "$ORIGINAL_PANE"
  IMG_PANE=$(tmux list-panes -F '#{pane_id}' | tail -n 1)
  echo "$IMG_PANE" > /tmp/claude-image-pane
fi

for img in /path/to/images/*.png; do
  label=$(basename "$img" .png)
  tmux send-keys -t "$IMG_PANE" "echo '--- $label ---' && chafa --size 120x60 \"$img\"" Enter
  sleep 0.5
done
```

## Chafa Options

```bash
chafa --size 80x40 image.png      # Adjust size
chafa --colors 256 image.png      # 256 colors
chafa --colors full image.png     # True color
chafa --symbols block image.png   # Better detail
```

## Cleanup

```bash
IMG_PANE=$(cat /tmp/claude-image-pane 2>/dev/null) && \
[ -n "$IMG_PANE" ] && tmux kill-pane -t "$IMG_PANE" 2>/dev/null; \
rm -f /tmp/claude-image-pane
```

Or tell the user: focus the image pane and press `Ctrl+b x`.

## Acceptance Checks

- [ ] Image opened in a separate tmux pane, not the agent pane
- [ ] Pane ID written to `/tmp/claude-image-pane`
- [ ] Subsequent images reuse the same pane (no new splits per image)
- [ ] Graceful fallback if the pane was closed between calls
