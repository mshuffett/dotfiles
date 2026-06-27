#!/usr/bin/env bash
# Back up Claude Code's per-project auto-memory into the dotfiles repo.
#
# Claude Code writes auto-memory to ~/.claude/projects/<slug>/memory/ (a real
# dir, unversioned). This converts each such dir into a symlink pointing at
# ~/.dotfiles/claude/auto-memory/<slug>/ so native auto-memory + auto-dream
# write straight through into the git-backed repo. Idempotent: already-symlinked
# dirs are skipped; new project dirs are migrated on the next run.
#
# Commits ONLY claude/auto-memory/ (machine-managed, no hand edits), so it never
# sweeps up unrelated dotfiles work.

set -u

PROJECTS_ROOT="$HOME/.claude/projects"
DOTFILES="$HOME/.dotfiles"
DEST_ROOT="$DOTFILES/claude/auto-memory"
mkdir -p "$DEST_ROOT"

[ -d "$PROJECTS_ROOT" ] || exit 0

changed=0
while IFS= read -r memdir; do
  [ -z "$memdir" ] && continue
  slug=$(basename "$(dirname "$memdir")")
  dest="$DEST_ROOT/$slug"

  if [ -L "$memdir" ]; then
    # Already a symlink. Repair only if it points somewhere unexpected.
    target=$(readlink "$memdir")
    [ "$target" = "$dest" ] && continue
  fi

  mkdir -p "$dest"
  if [ -d "$memdir" ] && [ ! -L "$memdir" ]; then
    # Merge real-dir contents into dotfiles (source wins on same-name), then
    # replace the real dir with a symlink.
    if command -v rsync >/dev/null 2>&1; then
      rsync -a "$memdir/" "$dest/" 2>/dev/null || true
    else
      cp -a "$memdir/." "$dest/" 2>/dev/null || true
    fi
    rm -rf "$memdir"
  fi
  ln -sfn "$dest" "$memdir"
  changed=1
done < <(find "$PROJECTS_ROOT" -maxdepth 2 -type d -name memory 2>/dev/null)

# Commit the mirror (scoped — auto-memory only).
if [ "$changed" -eq 1 ] || [ -n "$(git -C "$DOTFILES" status --porcelain -- claude/auto-memory 2>/dev/null)" ]; then
  git -C "$DOTFILES" add -- claude/auto-memory 2>/dev/null || true
  if ! git -C "$DOTFILES" diff --cached --quiet -- claude/auto-memory 2>/dev/null; then
    git -C "$DOTFILES" commit -q -m "claude: sync auto-memory $(date +%Y-%m-%d)" \
      -- claude/auto-memory 2>/dev/null || true
  fi
fi
