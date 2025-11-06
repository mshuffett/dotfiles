#!/usr/bin/env bash
set -euo pipefail
max=40000
file="claude/CLAUDE.md"
if [[ -f "$file" ]]; then
  size=$(wc -c < "$file" | tr -d ' ')
  if [[ "$size" -gt "$max" ]]; then
    echo "ERROR: $file is ${size} bytes; limit is ${max}. Extract procedures to guides in claude/commands/." >&2
    exit 1
  fi
fi
