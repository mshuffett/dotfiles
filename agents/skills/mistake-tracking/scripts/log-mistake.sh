#!/usr/bin/env bash
# Validate and append a mistake event to the JSONL log.
# Usage: log-mistake.sh '{"ts":"...","mistake_id":"...","scope":"global","detector":"self","notes":"..."}'
# Validates required fields and mistake_id format before appending.

set -euo pipefail

JSONL="$HOME/.claude/mistakes.jsonl"
EVENT="${1:-}"

if [[ -z "$EVENT" ]]; then
  echo '{"error":"Usage: log-mistake.sh <json-event>"}' >&2
  exit 1
fi

# Validate it's valid JSON
if ! echo "$EVENT" | jq empty 2>/dev/null; then
  echo '{"error":"Invalid JSON"}' >&2
  exit 1
fi

# Validate required fields
ERRORS=$(echo "$EVENT" | jq -r '
  [
    (if .ts == null or .ts == "" then "missing required field: ts" else empty end),
    (if .mistake_id == null or .mistake_id == "" then "missing required field: mistake_id" else empty end),
    (if .scope == null or .scope == "" then "missing required field: scope" else empty end),
    (if .detector == null or .detector == "" then "missing required field: detector" else empty end),
    (if .notes == null or .notes == "" then "missing required field: notes" else empty end),
    (if .scope != null and (.scope | IN("global", "project") | not) then "scope must be global|project" else empty end),
    (if .detector != null and (.detector | IN("self", "user") | not) then "detector must be self|user" else empty end),
    (if .mistake_id != null and (.mistake_id | test("^[a-z][a-z0-9_.]+$") | not) then "mistake_id must be lowercase kebab/dot (e.g. guide.not_consulted)" else empty end)
  ] | if length == 0 then empty else .[] end
')

if [[ -n "$ERRORS" ]]; then
  echo "$ERRORS" | jq -Rs '{error: "Validation failed", details: split("\n") | map(select(. != ""))}' >&2
  exit 1
fi

# Append to log
echo "$EVENT" >> "$JSONL"
echo '{"ok":true,"appended_to":"'"$JSONL"'","event_count":'$(wc -l < "$JSONL" | tr -d ' ')'}'
