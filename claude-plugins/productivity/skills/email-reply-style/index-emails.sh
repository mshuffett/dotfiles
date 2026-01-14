#!/bin/bash
# Re-indexes Michael's sent emails for RAG lookup
# Run periodically via launchd (com.michael.email-index)

set -e

SKILL_DIR="$HOME/.dotfiles/claude-plugins/productivity/skills/email-reply-style"
cd "$SKILL_DIR"

# Extract sent emails using himalaya
echo "[$(date)] Extracting sent emails..."
bun "$HOME/ws/clawdbot/scripts/extract-email-style.ts" > training-data.json.tmp 2>/dev/null

# Check if extraction succeeded (should have JSON array)
if grep -q '^\[' training-data.json.tmp; then
  mv training-data.json.tmp training-data.json
  echo "[$(date)] Extracted emails to training-data.json"
else
  echo "[$(date)] Extraction failed, keeping existing data"
  rm -f training-data.json.tmp
  exit 1
fi

# Convert to JSONL for llm (use email ID from himalaya for dedup)
echo "[$(date)] Converting to JSONL..."
tail -n +5 training-data.json | jq -c '.[] | {
  id: .id,
  content: "Subject: \(.subject)\nTo: \(.to_email)\nis_reply: \(.is_reply)\nOriginal: \(.original_message // "N/A" | .[0:500])\n---\nMichael: \(.michael_reply)"
}' > emails.jsonl

# Re-embed with llm
echo "[$(date)] Embedding with llm..."
llm embed-multi michael-emails --model 3-small --format nl --store emails.jsonl

echo "[$(date)] Done! $(wc -l < emails.jsonl) emails indexed."
