# Tmux Display Tips

Tips for showing code, logs, and other content to the user via tmux.

## When to Use

When you need to show the user:
- Code snippets or full files
- Log output or monitoring
- Side-by-side comparisons
- Long-running process output

## Context-Aware Display Decisions

Before choosing how to display content, check the current tmux state:

### Check Current Window Split Status

**Why:** If the user's current window is already split, prefer creating a background window instead of adding more splits.

```bash
# Count panes in current window
PANE_COUNT=$(tmux list-panes | wc -l)

if [ "$PANE_COUNT" -gt 1 ]; then
  # Window already split - use background window
  tmux new-window -d -n "window-name" "command"
else
  # Single pane - splitting is fine if needed
  tmux split-window -h "command"
fi
```

### Use Environment Variables for Current Context

**Why:** Avoid hardcoding pane/window references - user may switch windows between commands.

**Available tmux environment variables:**
- `$TMUX_PANE` - Current pane ID (e.g., `%69`)
- Use `tmux display-message -p` to get other format variables

```bash
# GOOD - Uses current pane from environment
CURRENT_PANE=$TMUX_PANE
tmux split-window -t "$CURRENT_PANE" -h "command"

# BETTER - Get fresh context each time
CURRENT_PANE=$(tmux display-message -p "#{pane_id}")

# BAD - Hardcoded pane ID that may be stale
tmux split-window -t %69 -h "command"
```

**When working relative to current window:**
```bash
# Get current window info
CURRENT_WINDOW=$(tmux display-message -p "#{window_id}")
WINDOW_INDEX=$(tmux display-message -p "#{window_index}")

# Split relative to current pane
tmux split-window -t "$TMUX_PANE" -h "command"
```

## Display Methods

### 1. Background Window (Recommended for Code Review)

Create a new window in the background - doesn't interrupt user's current view.

```bash
# Single command approach - window + split + content
tmux new-window -d -n "window-name" "command-for-left-pane" \
  && tmux split-window -h -t window-name "command-for-right-pane"
```

**Tips:**
- Use descriptive window names (e.g., `pm-chat-code`, `api-docs`)
- Tell user which window number to switch to
- Good for code that user may want to reference later
- User can switch with `Ctrl+b` then window number

**Example - Show code with folding:**
```bash
tmux new-window -d -n "code-review" \
  "nvim -c 'set foldmethod=manual' -c '79' -c '1,78fold' file.ts" \
  && tmux split-window -h -t code-review \
  "nvim -c 'set foldmethod=manual' -c '133' -c '1,132fold' file.ts"
```

### 2. Split Current Window

Split the user's active window - shows content immediately.

```bash
# Horizontal split (side-by-side)
tmux split-window -h "command"

# Vertical split (top-bottom)
tmux split-window -v "command"
```

**Tips:**
- Only use if user explicitly asked to see it now
- Takes up screen space - less room for conversation
- User may need to manually close the pane later
- Good for quick comparisons or monitoring

### 3. Send to Existing Pane

Update content in a pane without changing focus.

```bash
# Get current pane
CURRENT_PANE=$(tmux display-message -p "#{pane_id}")

# Send commands to specific pane
tmux send-keys -t %PANE_ID "command" Enter
```

**Tips:**
- Need to track pane IDs
- Good for updating already-visible content
- Can send multiple commands in sequence
- User stays focused on main conversation

### 4. Temporary Display Message

Quick notifications that disappear.

```bash
tmux display-message "Short message here"
```

**Tips:**
- Only for very short messages (1-2 lines)
- Disappears after a few seconds
- Good for status updates or confirmations
- Not suitable for code or data

## Content Display Commands

### Show Code Files

**Using bat (syntax highlighting):**
```bash
bat --style=plain --language=typescript --line-range=10:50 file.ts
```

**Using sed (specific lines):**
```bash
sed -n '10,50p' file.ts
```

**Using nvim (with folding):**
```bash
nvim -c 'set foldmethod=manual' \
     -c '20' \                    # Jump to line 20
     -c 'normal! zR' \             # Open all folds
     -c '1,19fold' \               # Fold lines 1-19
     -c '51,$fold' \               # Fold lines 51-end
     file.ts
```

### Monitor Logs

**Tail a log file:**
```bash
tail -f /path/to/logfile
```

**Follow command output:**
```bash
watch -n 2 "command"  # Run every 2 seconds
```

### Show Multiple Sections

**Combine sed with echo for headers:**
```bash
echo '=== SECTION 1 ===' && sed -n '10,20p' file.ts && \
echo && echo '=== SECTION 2 ===' && sed -n '50,60p' file.ts
```

## Nvim Folding Quick Reference

- `zo` - Open fold under cursor
- `zc` - Close fold under cursor
- `zR` - Open all folds
- `zM` - Close all folds

**Fold ranges in nvim:**
```vim
:1,10fold    " Fold lines 1-10
:20,$fold    " Fold from line 20 to end
```

## Best Practices

### Naming Windows

Use descriptive names that indicate content:
- ✅ `api-routes`, `db-schema`, `test-results`
- ❌ `code`, `stuff`, `temp`

### Choosing Display Method

**Always check first:** Is the current window already split?
```bash
PANE_COUNT=$(tmux list-panes | wc -l)
```
- If `> 1` panes exist → **Strongly prefer background window**
- If `= 1` pane → Consider split or background based on needs

**Background window when:**
- Current window is already split (multiple panes visible)
- User may want to reference it multiple times
- Content is for review/reading (not urgent)
- You're showing code structure or documentation
- Default choice for most code displays

**Split current window when:**
- Current window has only one pane (unsplit)
- User explicitly asked to "show me now"
- Content needs immediate attention
- Monitoring an ongoing process

**Send to existing pane when:**
- Updating already-visible content
- User has a specific pane open for this purpose
- Running sequential commands in same context
- You have a reliable pane reference (use $TMUX_PANE)

### Informing the User

Always tell the user what you created and how to access it:

```
I've created a background window "api-docs" (window #4) showing:
- Left pane: API endpoint definition
- Right pane: Request/response examples

Switch to it with Ctrl+b then 4
```

## Decision Flow Example

Here's how to make context-aware display decisions:

```bash
# Get current pane count and context
PANE_COUNT=$(tmux list-panes | wc -l)
CURRENT_PANE=$(tmux display-message -p "#{pane_id}")

# Decide based on current state
if [ "$PANE_COUNT" -gt 1 ]; then
  echo "Window already split - creating background window"
  tmux new-window -d -n "code-view" \
    "nvim file.ts" \
    && tmux split-window -h -t code-view \
    "bat file.ts"
else
  echo "Single pane window - can split if needed"
  # Check if user explicitly wants immediate view
  # Otherwise still prefer background window for code review
  tmux new-window -d -n "code-view" "nvim file.ts"
fi
```

**Quick decision checklist:**
1. ✅ Check pane count first
2. ✅ Use `$TMUX_PANE` or fresh `display-message` for current context
3. ✅ Prefer background window when already split
4. ✅ Use descriptive window names
5. ✅ Tell user where to find the new window

## Common Patterns

### Code Comparison

Show two versions side-by-side:
```bash
tmux new-window -d -n "comparison" \
  "nvim file-v1.ts" \
  && tmux split-window -h -t comparison \
  "nvim file-v2.ts"
```

### Log Monitoring

Watch logs while working:
```bash
tmux new-window -d -n "logs" \
  "tail -f app.log" \
  && tmux split-window -h -t logs \
  "tail -f error.log"
```

### Documentation Review

Show docs with relevant code:
```bash
tmux new-window -d -n "docs" \
  "glow README.md" \
  && tmux split-window -h -t docs \
  "nvim src/main.ts"
```

## Troubleshooting

### Pane IDs vs Indexes

- **Pane ID**: Unique identifier like `%69`, persists
- **Pane Index**: Position in window like `.0`, `.1`, changes when panes are rearranged

Use IDs when possible: `tmux list-panes -F "#{pane_id}"`

### Window Targeting

```bash
# By window index
tmux send-keys -t 4 "command" Enter

# By window name
tmux send-keys -t pm-chat-code "command" Enter

# By pane ID (most reliable)
tmux send-keys -t %77 "command" Enter
```

### Getting Current Context

```bash
# Current pane ID
tmux display-message -p "#{pane_id}"

# List all windows
tmux list-windows -F "#{window_index}:#{window_name}"

# List panes in window
tmux list-panes -t window-name -F "#{pane_index}:#{pane_id}"
```
