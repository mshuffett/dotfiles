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

**Why:** Avoid hardcoding pane/window references that depend on user's current focus.

**Key Distinction:**
- `$TMUX_PANE` - **Persistent**: Set when shell starts, doesn't change if user switches focus
- `tmux display-message -p "#{pane_id}"` - **Focus-dependent**: Returns currently active pane

**When to use each:**

```bash
# BEST - Use $TMUX_PANE for the pane where your shell is running
# This stays correct even if user switches to another window/pane
CURRENT_PANE=$TMUX_PANE
tmux split-window -t "$TMUX_PANE" -h "command"

# ONLY use display-message when you specifically want the user's current focus
# (rarely needed - usually you want YOUR pane, not where user is looking)
USER_FOCUSED_PANE=$(tmux display-message -p "#{pane_id}")

# BAD - Hardcoded pane ID from earlier command
tmux split-window -t %69 -h "command"
```

**Working relative to the Claude Code window:**
```bash
# Get info about where Claude Code is running
MY_PANE=$TMUX_PANE
PANE_COUNT=$(tmux list-panes | wc -l)  # Counts panes in current window

# Split relative to Claude's pane, not user's focus
tmux split-window -t "$TMUX_PANE" -h "command"
```

**Key insight:** `$TMUX_PANE` is more reliable because it refers to the pane where the command is executing, regardless of where the user's focus has moved.

## Display Methods

### 1. Background Window (Recommended for Code Review)

Create a new window in the background - doesn't interrupt user's current view.

```bash
# Single command approach - window + split + content
tmux new-window -d -n "claude-window-name" "command-for-left-pane" \
  && tmux split-window -h -t claude-window-name "command-for-right-pane"
```

**Tips:**
- Use `claude-` prefix for all windows you create
- Use descriptive names (e.g., `claude-pm-chat-code`, `claude-api-docs`)
- Tell user which window number to switch to
- Good for code that user may want to reference later
- User can switch with `Ctrl+b` then window number

**Example - Show code with folding:**
```bash
tmux new-window -d -n "claude-code-review" \
  "nvim -c 'set foldmethod=manual' -c '79' -c '1,78fold' file.ts" \
  && tmux split-window -h -t claude-code-review \
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

**Use prefix for easy cleanup:**
- Prefix all Claude-created windows with `claude-` for easy identification
- Makes cleanup simple: `tmux kill-window -t claude-*` won't exist, but easy to identify
- Examples: `claude-code-review`, `claude-api-docs`, `claude-logs`

**Good names:**
- ✅ `claude-api-routes`, `claude-db-schema`, `claude-test-results`
- ✅ `claude-pm-chat-code`, `claude-comparison`

**Bad names:**
- ❌ `code`, `stuff`, `temp` (not descriptive, no prefix)
- ❌ `api-routes` (descriptive but no prefix for cleanup)

**Cleanup pattern:**
```bash
# List all Claude-created windows
tmux list-windows | grep claude-

# Kill specific Claude window
tmux kill-window -t claude-code-review

# Or kill multiple at once
for w in $(tmux list-windows -F "#{window_name}" | grep "^claude-"); do
  tmux kill-window -t "$w"
done
```

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
# Use $TMUX_PANE - it's persistent and not affected by user's focus
PANE_COUNT=$(tmux list-panes | wc -l)
MY_PANE=$TMUX_PANE

# Decide based on current state
if [ "$PANE_COUNT" -gt 1 ]; then
  echo "Window already split - creating background window"
  tmux new-window -d -n "claude-code-view" \
    "nvim file.ts" \
    && tmux split-window -h -t claude-code-view \
    "bat file.ts"
else
  echo "Single pane window - can split if needed"
  # Check if user explicitly wants immediate view
  # Otherwise still prefer background window for code review
  tmux new-window -d -n "claude-code-view" "nvim file.ts"
fi
```

**Quick decision checklist:**
1. ✅ Check pane count first
2. ✅ Use `$TMUX_PANE` for reliable pane reference (not display-message)
3. ✅ Prefer background window when already split
4. ✅ Use descriptive window names
5. ✅ Tell user where to find the new window

## Common Patterns

### Code Comparison

Show two versions side-by-side:
```bash
tmux new-window -d -n "claude-comparison" \
  "nvim file-v1.ts" \
  && tmux split-window -h -t claude-comparison \
  "nvim file-v2.ts"
```

### Log Monitoring

Watch logs while working:
```bash
tmux new-window -d -n "claude-logs" \
  "tail -f app.log" \
  && tmux split-window -h -t claude-logs \
  "tail -f error.log"
```

### Documentation Review

Show docs with relevant code:
```bash
tmux new-window -d -n "claude-docs" \
  "glow README.md" \
  && tmux split-window -h -t claude-docs \
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
