---
description: Creates a persistent tmux context pane using glow + entr for live-updating markdown display. Shows shared understanding and alignment. Supports multiple Claude instances with unique IDs. Only use when user explicitly requests it.
---

# Tmux Context Pane

## When to Use This Command

**Trigger phrases:**
- "Show me a persistent context pane"
- "Set up a tmux pane for alignment"
- "I want to see our shared understanding in tmux"
- User explicitly requests tmux context display

**DO NOT use:**
- Proactively or automatically
- Without explicit user request
- For normal conversation tracking

## Maintaining This Command

**When you learn something new about tmux context panes:**
- **ADD** new rendering options or display techniques
- **ENHANCE** existing sections with improvements
- **DO NOT REMOVE** existing content (might cause regressions)
- **COMMIT** changes to dotfiles immediately after updates

## Setup Process

### 1. Detect Current Window and Pane

```bash
# Get my pane ID
MY_PANE=$TMUX_PANE  # e.g., %39

# Get my window ID
MY_WINDOW=$(tmux display-message -p '#{window_id}')  # e.g., @38
```

**Why this matters:**
- Multiple Claude instances may run in different tmux windows
- Must create pane in MY window, not the user's active window
- Prevents stealing focus from user's current work

### 2. Generate Unique Context ID

```bash
# Generate 8-character unique ID
CONTEXT_ID=$(openssl rand -hex 4)  # e.g., a3f9c2d8

# Store ID for later reference
echo $CONTEXT_ID > /tmp/claude-pane-${TMUX_PANE}.id

# Create context filename
CONTEXT_FILE="/tmp/claude-context-${CONTEXT_ID}.md"
```

**Why unique IDs:**
- Multiple Claude instances need separate context files
- Short (8 chars) but sufficiently unique
- Pane-specific storage allows retrieval in later updates

### 3. Create Initial Context File

```bash
cat > $CONTEXT_FILE << 'EOF'
# 🎯 Shared Context & Alignment

## Current Focus
- Item 1
- Item 2

## What We're Building

### Project Name
Description
- Detail 1
- Detail 2

## Active Agreements
- Agreement 1
- Agreement 2

---
*Last updated: [timestamp]*
EOF
```

**Template structure:**
- **Current Focus**: What we're working on right now
- **What We're Building**: Projects and their details
- **Active Agreements**: Constraints, time budgets, decisions

### 4. Create Tmux Pane with Live Rendering

```bash
# Create pane in MY window (not active window)
# -t $MY_WINDOW: target my window specifically
# -h: horizontal split
# -d: don't steal focus
# -l 50: 50 columns wide

tmux split-window -t $MY_WINDOW -h -d -l 50 \
  "echo $CONTEXT_FILE | entr -c glow -s dark -w 45 $CONTEXT_FILE"
```

**Command breakdown:**
- `echo $CONTEXT_FILE | entr`: Watch file for changes
- `-c`: Clear screen on update (prevents flicker)
- `glow -s dark`: Render markdown with dark theme
- `-w 45`: Set width to 45 chars for compact display

### 5. Updating Context Later

```bash
# Retrieve the context ID for this pane
CONTEXT_ID=$(cat /tmp/claude-pane-${TMUX_PANE}.id 2>/dev/null)

if [ -n "$CONTEXT_ID" ]; then
  CONTEXT_FILE="/tmp/claude-context-${CONTEXT_ID}.md"

  # Edit the file - entr will auto-refresh the pane
  # Use Edit tool to update specific sections
fi
```

**Important:**
- `entr` automatically detects file changes
- No need to restart the pane or refresh manually
- Updates appear within 1 second

## Dependencies

**Required tools:**
- `glow` - Markdown renderer with themes
- `entr` - File watcher for live updates
- `tmux` - Terminal multiplexer

**Installation:**
```bash
arch -arm64 brew install glow entr
```

## Configuration Options

### Pane Size
```bash
-l 50  # 50 columns (default)
-l 40  # Narrower
-l 60  # Wider
```

### Glow Theme
```bash
glow -s dark   # Dark theme (default)
glow -s light  # Light theme
glow -s auto   # Auto-detect
```

### Glow Width
```bash
-w 45  # 45 chars (default, compact)
-w 50  # More space
-w 40  # Very compact
```

## Troubleshooting

### Pane appears in wrong window
- Ensure using `MY_WINDOW` variable, not active window
- Don't use `-t` without window ID

### Focus stolen on creation
- Ensure `-d` flag is present in split-window command

### File not updating
- Check that `entr` is running: `tmux list-panes -F "#{pane_current_command}"`
- Verify file path is correct: `ls -la /tmp/claude-context-*.md`

### Flickering display
- Use `entr` with `-c` flag (clear screen)
- Avoid manual `while true` loops

### Multiple instances collision
- Each instance must generate unique CONTEXT_ID
- Don't hardcode `/tmp/claude-context.md`

## Full Setup Script

```bash
# Complete setup in one go
setup_tmux_context() {
  # 1. Get my window/pane
  MY_PANE=$TMUX_PANE
  MY_WINDOW=$(tmux display-message -p '#{window_id}')

  # 2. Generate unique ID
  CONTEXT_ID=$(openssl rand -hex 4)
  echo $CONTEXT_ID > /tmp/claude-pane-${MY_PANE}.id
  CONTEXT_FILE="/tmp/claude-context-${CONTEXT_ID}.md"

  # 3. Create initial content
  cat > $CONTEXT_FILE << 'EOF'
# 🎯 Shared Context & Alignment

## Current Focus
- Setting up context pane

## What We're Building
(To be defined)

## Active Agreements
- Keep pane updated with shared understanding

---
*Last updated: $(date '+%Y-%m-%d %H:%M')*
EOF

  # 4. Create pane with live rendering
  tmux split-window -t $MY_WINDOW -h -d -l 50 \
    "echo $CONTEXT_FILE | entr -c glow -s dark -w 45 $CONTEXT_FILE"

  echo "Context pane created: $CONTEXT_FILE"
}
```

## Example Usage

**User request:**
"Set up a tmux context pane so we can track what we're working on"

**Response:**
1. Run setup script
2. Populate initial context with current conversation state
3. Inform user: "Context pane created on the right. I'll keep it updated as we work."

**During conversation:**
- Update context file when focus changes
- Add new items to "What We're Building"
- Update "Active Agreements" when decisions are made
- The pane auto-refreshes via entr

## When NOT to Use

- Normal conversation - use regular responses
- User hasn't requested it
- Short conversations that don't need persistent tracking
- Debugging or quick tasks
