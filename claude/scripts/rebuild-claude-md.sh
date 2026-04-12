#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
claude_file="$(cd "$script_dir/.." && pwd)/CLAUDE.md"
personal_file="$(cd "$script_dir/.." && pwd)/CLAUDE.personal.md"
marker='^## Personal Addendum$'

if [[ ! -f "$claude_file" ]]; then
  echo "Missing CLAUDE file: $claude_file" >&2
  exit 1
fi

if [[ ! -f "$personal_file" ]]; then
  echo "Missing personal source file: $personal_file" >&2
  exit 1
fi

tmp_file="$(mktemp)"
trimmed_file="$(mktemp)"
trap 'rm -f "$tmp_file" "$trimmed_file"' EXIT

awk -v marker="$marker" '
  $0 ~ marker { exit }
  { print }
' "$claude_file" > "$tmp_file"

awk '
  { lines[NR] = $0 }
  END {
    end = NR
    while (end > 0 && lines[end] == "") {
      end--
    }
    while (end > 0 && lines[end] == "---") {
      end--
      while (end > 0 && lines[end] == "") {
        end--
      }
    }
    for (i = 1; i <= end; i++) {
      print lines[i]
    }
  }
' "$tmp_file" > "$trimmed_file"

mv "$trimmed_file" "$tmp_file"

{
  printf '\n---\n\n'
  printf '## Personal Addendum\n\n'
  printf 'Canonical personal source: `%s`.\n' "$personal_file"
  printf 'Rebuild after a plugin overwrite with `%s`.\n\n' "$script_dir/rebuild-claude-md.sh"
  cat "$personal_file"
} >> "$tmp_file"

mv "$tmp_file" "$claude_file"
