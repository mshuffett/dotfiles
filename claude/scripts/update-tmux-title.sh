#!/bin/bash
# Hook script to update tmux window title based on conversation context
# This runs on UserPromptSubmit and sets the title once after N messages

# Read hook input JSON from stdin
input=$(cat)

# Extract session ID and transcript path
session_id=$(echo "$input" | jq -r '.session_id')
transcript_path=$(echo "$input" | jq -r '.transcript_path')
prompt=$(echo "$input" | jq -r '.prompt')

# Flag file to track if title was already set for this session
flag_file="/tmp/claude-tmux-title-${session_id}"

# Exit early if already updated
if [ -f "$flag_file" ]; then
  exit 0
fi

# Only run if we're actually in a tmux session
if [ -z "$TMUX" ]; then
  exit 0
fi

# Count messages in transcript
msg_count=$(jq -s 'length' "$transcript_path" 2>/dev/null || echo 0)

# After 3+ messages, set title once
if [ "$msg_count" -ge 3 ]; then
  # Truncate prompt to 40 chars for title, remove newlines
  title=$(echo "$prompt" | tr '\n' ' ' | cut -c1-40)

  # Set tmux window title
  tmux rename-window "$title"

  # Create flag file so we don't update again this session
  touch "$flag_file"
fi
