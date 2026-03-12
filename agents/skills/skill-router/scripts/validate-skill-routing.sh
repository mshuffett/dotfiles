#!/usr/bin/env bash
set -euo pipefail

ROOTS=(
  "$HOME/.agents/skills"
  "$HOME/.dotfiles/agents/skills"
)

tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT

for root in "${ROOTS[@]}"; do
  [ -d "$root" ] || continue
  while IFS= read -r skill_file; do
    name="$(rg '^name:\s' "$skill_file" | head -n1 | sed 's/^name:\s*//' | xargs || true)"
    if [ -n "$name" ]; then
      printf "%s\t%s\n" "$name" "$skill_file" >> "$tmp_file"
    fi
  done < <(fd -HI SKILL.md "$root" -t f)
done

if [ ! -s "$tmp_file" ]; then
  echo "No skills found in configured roots."
  exit 1
fi

dup_report="$(awk -F '\t' '
  {
    count[$1]++
    paths[$1]=paths[$1] "\n  - " $2
  }
  END {
    dup=0
    for (name in count) {
      if (count[name] > 1) {
        dup=1
        printf "DUPLICATE: %s (%d)\n%s\n", name, count[name], paths[name]
      }
    }
    if (!dup) {
      printf "NO_DUPLICATES\n"
    }
  }
' "$tmp_file")"

if grep -q '^NO_DUPLICATES$' <<<"$dup_report"; then
  total="$(wc -l < "$tmp_file" | xargs)"
  echo "Skill routing check passed: $total active skill names, no duplicates."
  exit 0
fi

echo "Skill routing check failed."
echo "$dup_report"
exit 2
