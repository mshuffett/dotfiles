#!/usr/bin/env bash
set -euo pipefail
dir="${1:-$HOME/.claude/commands}"
if [[ ! -d "$dir" ]]; then
  echo "Directory not found: $dir" >&2
  exit 1
fi
for f in "$dir"/*.md; do
  [[ -e "$f" ]] || continue
  desc=$(perl -ne 'BEGIN{$in=0} if(/^---\s*$/){$in++} elsif($in==1 && /^description:\s*(.*)/){print $1; exit}' "$f")
  printf "%s\n  description: %s\n\n" "$(basename "$f")" "${desc:-<none>}"
done | sed '/^\s*$/N;/^\s*\n$/D'

