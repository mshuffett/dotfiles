#!/usr/bin/env bash
set -euo pipefail

# Ensure Codex always sees the repo's canonical entrypoint skills.
#
# Canonical skills live in: ~/.dotfiles/agents/skills/<name>
# Codex discovers skills from: ~/.codex/skills/<name>
#
# This script creates/updates symlinks for every entrypoint skill.

REPO_ROOT="${HOME}/.dotfiles"
SRC_DIR="${REPO_ROOT}/agents/skills"
CODEX_SKILLS_DIR="${HOME}/.codex/skills"

if [ ! -d "$SRC_DIR" ]; then
  echo "ERROR: missing $SRC_DIR" 1>&2
  exit 1
fi

mkdir -p "$CODEX_SKILLS_DIR"

updated=0
skipped=0

for src in "$SRC_DIR"/*; do
  name="$(basename "$src")"
  [ -d "$src" ] || continue

  dst="${CODEX_SKILLS_DIR}/${name}"

  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    # Don't clobber real directories (ex: imagegen). Caller can resolve conflicts manually.
    echo "SKIP: $dst exists and is not a symlink" 1>&2
    skipped=$((skipped+1))
    continue
  fi

  if [ -L "$dst" ]; then
    cur="$(readlink "$dst" || true)"
    if [ "$cur" = "$src" ]; then
      continue
    fi
    rm -f "$dst"
  fi

  ln -s "$src" "$dst"
  echo "LINK: $dst -> $src"
  updated=$((updated+1))
done

echo "Done. updated=${updated} skipped=${skipped}"

