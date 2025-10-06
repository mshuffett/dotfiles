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

# Count only user/assistant messages (not file snapshots or other entries)
msg_count=$(jq -s '[.[] | select(.message.role == "user" or .message.role == "assistant")] | length' "$transcript_path" 2>/dev/null || echo 0)

# Debug logging
{
  echo "=== $(date) ==="
  echo "session=$session_id"
  echo "transcript=$transcript_path"
  echo "transcript exists: $([ -f "$transcript_path" ] && echo 'YES' || echo 'NO')"
  echo "msg_count=$msg_count"
} >> /tmp/tmux-hook-debug.log 2>&1

# After 3+ messages, set title once
if [ "$msg_count" -ge 3 ]; then
  # Extract last 5 user/assistant messages as text summary
  context=$(jq -s -r '[.[] | select(.message.role == "user" or .message.role == "assistant") | {role: .message.role, content: (.message.content | if type == "array" then map(select(.type == "text") | .text) | join(" ") else . end)} | select((.content | length) > 0)] | .[-5:] | map("\(.role): \(.content)") | join("\n")' "$transcript_path" 2>/dev/null)

  echo "context_length=${#context}" >> /tmp/tmux-hook-debug.log
  echo "context_preview: ${context:0:100}..." >> /tmp/tmux-hook-debug.log

  # Check if we have an API key
  if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "mode=fallback (no API key)" >> /tmp/tmux-hook-debug.log
    # Fallback: use first 40 chars of last user message
    title=$(jq -s -r '[.[] | select(.message.role == "user")] | .[-1].message.content | if type == "array" then map(select(.type == "text") | .text) | join(" ") else . end // "claude-session"' "$transcript_path" | tr '\n' ' ' | cut -c1-40)
  else
    echo "mode=api" >> /tmp/tmux-hook-debug.log
    # Call Claude API to generate a concise title
    prompt="Based on this conversation, generate a concise 3-5 word title that captures the main topic. Respond with ONLY the title, no quotes or punctuation:\n\n$context"
    title=$(jq -n \
      --arg model "claude-sonnet-4-5-20250929" \
      --arg prompt "$prompt" \
      '{model: $model, max_tokens: 20, messages: [{role: "user", content: $prompt}]}' | \
      curl -s https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d @- | \
      jq -r '.content[0].text // "claude-session"' | tr '\n' ' ' | head -c 50)
  fi

  echo "title='$title' (length=${#title})" >> /tmp/tmux-hook-debug.log
  echo "---" >> /tmp/tmux-hook-debug.log

  # Fallback if title is empty
  if [ -z "$title" ] || [ "$title" = "null" ]; then
    title="claude-session"
  fi

  # Use TMUX_PANE env var to target the correct pane even if user switched windows
  # TMUX_PANE is set when Claude starts and doesn't change
  claude_pane="${TMUX_PANE}"
  claude_window=$(tmux display-message -t "$claude_pane" -p '#I')

  # Set tmux window title, targeting Claude's window specifically
  tmux rename-window -t "$claude_window" "$title"

  # Create flag file so we don't update again this session
  touch "$flag_file"
fi
