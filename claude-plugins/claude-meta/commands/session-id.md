---
description: Find the current Claude Code session ID and file path by generating a unique marker and searching for it in session files.
---

# Get Current Session ID

Your task is to find the current Claude Code session ID and file path.

## Method

1. Generate a unique marker using `uuidgen`
2. Output the marker (this writes it to the session transcript)
3. Wait 2 seconds for the session to flush to disk
4. Search all session files for the marker using ripgrep
5. Extract the session ID from the filename

## Implementation

```bash
# Generate and output unique marker
MARKER="session-marker-$(uuidgen)"
echo "Marker: $MARKER"

# Wait for session to flush
sleep 2

# Search for marker
SESSION_FILE=$(rg -l "$MARKER" ~/.claude/projects/*/*.jsonl 2>/dev/null | head -1)

if [ -z "$SESSION_FILE" ]; then
    echo "Error: Could not find current session"
    exit 1
fi

# Extract session ID
SESSION_ID=$(basename "$SESSION_FILE" .jsonl)

# Output results
echo ""
echo "Session ID: $SESSION_ID"
echo "File: $SESSION_FILE"
echo ""
echo "Full path: $SESSION_FILE"
```

## Output Format

Provide:
- Session ID (UUID)
- Full file path to the `.jsonl` session file
- Confirmation that this is the current active session

This is useful for:
- Attaching session transcripts to Linear issues
- Debugging which session you're in
- SessionEnd hooks that need the session ID
- Manual session analysis
