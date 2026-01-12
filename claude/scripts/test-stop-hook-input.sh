#!/bin/bash
# Test script to capture Stop hook input and verify session_id is passed

HOOK_INPUT=$(cat)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUTPUT_FILE="/tmp/claude-stop-hook-input-${TIMESTAMP}.json"

echo "$HOOK_INPUT" > "$OUTPUT_FILE"
echo "Stop hook input captured to: $OUTPUT_FILE" >&2

# Also append to a combined log for easy viewing
echo "=== $TIMESTAMP ===" >> /tmp/claude-stop-hook-inputs.log
echo "$HOOK_INPUT" | jq '.' >> /tmp/claude-stop-hook-inputs.log 2>/dev/null || echo "$HOOK_INPUT" >> /tmp/claude-stop-hook-inputs.log
echo "" >> /tmp/claude-stop-hook-inputs.log

# Allow the stop to proceed
exit 0
