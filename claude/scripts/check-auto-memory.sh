#!/usr/bin/env bash
# Verifies auto-memory + auto-dream are writing files after enabling them in
# ~/.claude/settings.json. Run via `at` ~12h after enabling so real interactive
# sessions have had a chance to trigger extraction.

set -u

LOG_DIR="$HOME/claude-debug"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/auto-memory-check-$(date +%Y%m%d-%H%M%S).log"
PROJECTS_ROOT="$HOME/.claude/projects"

# Compute counts first (no subshell) so we can use them for the notification.
TOTAL_FILES=0
POPULATED_DIRS=0
DIR_REPORT=""
if [ -d "$PROJECTS_ROOT" ]; then
  while IFS= read -r dir; do
    count=$(find "$dir" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    DIR_REPORT+=$(printf "  %s  (%s .md files)\n" "$(dirname "$dir")" "$count")
    DIR_REPORT+=$'\n'
    TOTAL_FILES=$((TOTAL_FILES + count))
    [ "$count" -gt 0 ] && POPULATED_DIRS=$((POPULATED_DIRS + 1))
  done < <(find "$PROJECTS_ROOT" -maxdepth 2 -type d -name memory 2>/dev/null)
fi

if [ "$TOTAL_FILES" -gt 0 ]; then
  VERDICT="WORKING"
  MSG="Auto-memory wrote $TOTAL_FILES files across $POPULATED_DIRS projects"
  SOUND="Glass"
else
  VERDICT="NOT WORKING"
  MSG="No memory files found. Settings may be loaded but extraction not firing."
  SOUND="Basso"
fi

{
  echo "=== Auto-memory check $(date) ==="
  echo
  echo "Settings:"
  jq '{autoMemoryEnabled, autoDreamEnabled, autoMemoryDirectory}' \
     "$HOME/.claude/settings.json" 2>/dev/null || echo "  (no settings.json)"
  echo
  echo "Memory dirs:"
  printf "%s" "$DIR_REPORT"
  echo
  echo "Summary: $TOTAL_FILES total .md files across $POPULATED_DIRS populated dirs"
  echo "VERDICT: $VERDICT"
} | tee "$LOG"

osascript -e "display notification \"$MSG\" with title \"Auto-memory: $VERDICT\" sound name \"$SOUND\"" 2>/dev/null || true
echo "$VERDICT — see $LOG" > "$HOME/claude-debug/LATEST_AUTO_MEMORY_VERDICT.txt"
