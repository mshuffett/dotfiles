#!/bin/bash
# Capture session ID from stdin and write to CLAUDE_ENV_FILE
# This makes CLAUDE_SESSION_ID available to all subsequent bash commands

# Read JSON input from stdin
input=$(cat)

# Extract session_id using jq
session_id=$(echo "$input" | jq -r '.session_id // empty')

# Write to CLAUDE_ENV_FILE if available and session_id was found
if [[ -n "$CLAUDE_ENV_FILE" && -n "$session_id" ]]; then
    echo "export CLAUDE_SESSION_ID=\"$session_id\"" >> "$CLAUDE_ENV_FILE"
fi
