#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

SKILLS_DIR="$ROOT/agents/skills"
MAX_ENTRYPOINTS="${MAX_AGENT_SKILLS_ENTRYPOINTS:-20}"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "ERROR: missing $SKILLS_DIR" >&2
  exit 1
fi

if [ ! -L "$ROOT/claude/skills" ]; then
  echo "ERROR: expected claude/skills to be a symlink to agents/skills" >&2
  exit 1
fi

entrypoints_count="$(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print | wc -l | tr -d ' ')"
if [ "$entrypoints_count" -gt "$MAX_ENTRYPOINTS" ]; then
  echo "ERROR: too many entrypoint skills: $entrypoints_count (max $MAX_ENTRYPOINTS)" >&2
  echo "Tip: move detail into agents/knowledge/atoms/ and keep agents/skills as entrypoints." >&2
  exit 1
fi

fail=0
while IFS= read -r file; do
  # Must start with YAML frontmatter and include name + description fields.
  if [ "$(head -n 1 "$file" 2>/dev/null || true)" != "---" ]; then
    echo "ERROR: $file: missing YAML frontmatter (first line must be ---)" >&2
    fail=1
    continue
  fi

  if ! awk '
    BEGIN { infm=0; okname=0; okdesc=0 }
    NR==1 { infm=1; next }
    infm==1 && $0 ~ /^name:[[:space:]]+/ { okname=1 }
    infm==1 && $0 ~ /^description:[[:space:]]+/ { okdesc=1 }
    infm==1 && $0 ~ /^---[[:space:]]*$/ { infm=0 }
    END { exit((okname && okdesc) ? 0 : 1) }
  ' "$file"; then
    echo "ERROR: $file: YAML frontmatter must include name: and description:" >&2
    fail=1
  fi
done < <(find "$SKILLS_DIR" -mindepth 2 -maxdepth 2 -name SKILL.md -print)

exit "$fail"
