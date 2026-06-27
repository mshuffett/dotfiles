#!/usr/bin/env bash
# Weekly skill curator: consolidates the per-session reviewer's output into
# class-level umbrella skills and archives one-session cruft. The counterweight
# to eager skill creation (analog of auto-dream, but for skills). Run by launchd
# (com.michael.claude-skill-curator) or manually.
#
# Disable: `touch ~/.claude/self-improve/CURATOR_DISABLED`.

set -u

[ -n "${CLAUDE_SELF_IMPROVE:-}" ] && exit 0   # don't recurse from a review fork
[ -f "$HOME/.claude/self-improve/CURATOR_DISABLED" ] && exit 0

DOTFILES="$HOME/.dotfiles"
PROMPT="$DOTFILES/claude/prompts/self-improve-skill-curator.md"
LOG_DIR="$DOTFILES/claude/logs"
mkdir -p "$LOG_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
RUN_LOG="$LOG_DIR/skill-curator-$STAMP.log"

cd "$DOTFILES" || exit 0

before=$(git status --porcelain -- agents/skills 2>/dev/null | sed 's/^...//' | sort -u)

CLAUDE_SELF_IMPROVE=1 claude -p \
  "$(cat "$PROMPT")" \
  --model opus \
  --allowedTools "Read,Write,Edit,Glob,Grep,Bash" \
  --permission-mode acceptEdits \
  --add-dir "$HOME/.claude" \
  >>"$RUN_LOG" 2>&1 || true

# Commit only what the curator touched under agents/skills + its report.
after=$(git status --porcelain -- agents/skills 2>/dev/null | sed 's/^...//' | sort -u)
newpaths=$(comm -13 <(printf '%s\n' "$before") <(printf '%s\n' "$after") | grep -v '^$' || true)
if [ -n "$newpaths" ]; then
  printf '%s\n' "$newpaths" | while IFS= read -r f; do
    [ -n "$f" ] && git add -- "$f" 2>/dev/null || true
  done
fi
git add -- claude/logs/skill-curator-latest.md 2>/dev/null || true
if ! git diff --cached --quiet 2>/dev/null; then
  git commit -q -m "claude: weekly skill curator $(date +%Y-%m-%d)" 2>/dev/null || true
fi
