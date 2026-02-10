#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

SKILLS_DIR="$ROOT/agents/skills"
# Claude Code loads all skill descriptions at startup into a budget of
# 2% of context window (~16K chars fallback). We check against that.
MAX_DESC_CHARS="${MAX_AGENT_SKILLS_DESC_CHARS:-16000}"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "ERROR: missing $SKILLS_DIR" >&2
  exit 1
fi

if [ ! -L "$ROOT/claude/skills" ]; then
  echo "ERROR: expected claude/skills to be a symlink to agents/skills" >&2
  exit 1
fi

fail=0
total_desc_chars=0

while IFS= read -r file; do
  # Must start with YAML frontmatter and include name + description fields.
  first_line="$(head -n 1 "$file" 2>/dev/null || true)"
  if [ "$first_line" != "---" ]; then
    echo "ERROR: $file: missing YAML frontmatter (first line must be ---)" >&2
    fail=1
    continue
  fi

  # Extract frontmatter and check for required fields
  has_name=0
  has_desc=0
  desc_value=""
  in_fm=0

  while IFS= read -r line; do
    if [ "$in_fm" = "0" ]; then
      in_fm=1
      continue
    fi
    case "$line" in
      ---*) break ;;
      name:*) has_name=1 ;;
      description:*)
        has_desc=1
        desc_value="${line#description: }"
        ;;
    esac
  done < "$file"

  if [ "$has_name" = "0" ] || [ "$has_desc" = "0" ]; then
    echo "ERROR: $file: YAML frontmatter must include name: and description:" >&2
    fail=1
    continue
  fi

  # Accumulate description char count
  desc_len=${#desc_value}
  total_desc_chars=$((total_desc_chars + desc_len))
done < <(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print)

if [ "$total_desc_chars" -gt "$MAX_DESC_CHARS" ]; then
  echo "ERROR: total skill description size ${total_desc_chars} chars exceeds budget (${MAX_DESC_CHARS} chars)" >&2
  echo "Tip: shorten descriptions, consolidate skills, or set SLASH_COMMAND_TOOL_CHAR_BUDGET in Claude Code settings." >&2
  fail=1
fi

exit "$fail"
