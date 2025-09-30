#!/bin/bash
# Hook script to update tmux window title based on conversation context
# This runs on UserPromptSubmit and sets the title once after N messages

# Read hook input JSON from stdin
input=$(cat)

# Extract session ID and transcript path
session_id=$(echo "$input" | jq -r '.session_id')
transcript_path=$(echo "$input" | jq -r '.transcript_path')

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
  # Extract last 5 messages for context (limit size for API call)
  context=$(jq -s '.[-5:] | map(select(.role and .content)) | map({role, content: (.content | if type == "array" then map(select(.type == "text") | .text) | join(" ") else . end)})' "$transcript_path" 2>/dev/null)

  # Check if we have an API key
  if [ -z "$ANTHROPIC_API_KEY" ]; then
    # Fallback: use first 40 chars of last user message
    title=$(jq -r '.[-1].content // "claude-session"' "$transcript_path" | tr '\n' ' ' | cut -c1-40)
  else
    # Call Claude API to generate a concise title
    title=$(curl -s https://api.anthropic.com/v1/messages \
      -H "x-api-key: $ANTHROPIC_API_KEY" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" \
      -d "{
        \"model\": \"claude-sonnet-4-5-20250929\",
        \"max_tokens\": 20,
        \"messages\": [
          {\"role\": \"user\", \"content\": \"Based on this conversation, generate a concise 3-5 word title that captures the main topic. Respond with ONLY the title, no quotes or punctuation:\\n\\n${context}\"}
        ]
      }" | jq -r '.content[0].text // "claude-session"' | tr '\n' ' ' | head -c 50)
  fi

  # Fallback if title is empty
  if [ -z "$title" ] || [ "$title" = "null" ]; then
    title="claude-session"
  fi

  # Set tmux window title
  tmux rename-window "$title"

  # Create flag file so we don't update again this session
  touch "$flag_file"
fi
