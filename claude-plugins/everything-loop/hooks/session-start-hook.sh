#!/bin/bash

# Everything Loop Session Start Hook
# Captures session_id and persists it as CLAUDE_SESSION_ID for stop hook

set -euo pipefail

# Debug log
DEBUG_LOG="${HOME}/.claude/everything-loop-session-start.log"

# Read hook input from stdin
HOOK_INPUT=$(cat)

# Extract session_id from hook input
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // empty')

# Log for debugging
{
  echo "=== SessionStart Hook $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  echo "SESSION_ID: $SESSION_ID"
  echo "CLAUDE_ENV_FILE: ${CLAUDE_ENV_FILE:-not set}"
} >> "$DEBUG_LOG"

if [[ -z "$SESSION_ID" ]]; then
  echo "ERROR: No session_id in hook input" >> "$DEBUG_LOG"
  exit 0
fi

# Persist session ID for the session
if [[ -n "${CLAUDE_ENV_FILE:-}" ]]; then
  {
    echo "unset CLAUDE_SESSION_ID"
    echo "export CLAUDE_SESSION_ID=\"$SESSION_ID\""
  } >> "$CLAUDE_ENV_FILE"
  echo "Wrote CLAUDE_SESSION_ID to env file" >> "$DEBUG_LOG"
else
  echo "WARNING: CLAUDE_ENV_FILE not set" >> "$DEBUG_LOG"
fi

exit 0
