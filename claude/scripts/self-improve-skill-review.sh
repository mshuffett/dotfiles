#!/usr/bin/env bash
# SessionEnd hook: fork an Opus reviewer that updates the user's skill library
# based on the session that just ended (the "hermes magic" — eager skill
# capture). Memory is left to Claude Code's native auto-memory/auto-dream.
#
# Pattern mirrors skill-firing-hook.sh: read hook JSON on stdin, do cheap
# gating synchronously, launch the heavy review detached, exit 0 immediately so
# it never blocks session teardown.
#
# Disable: `touch ~/.claude/self-improve/DISABLED` or export
# CLAUDE_SELF_IMPROVE_DISABLE=1.  Tune the turn gate with
# CLAUDE_SELF_IMPROVE_MIN_TURNS (default 5).

set -u

# --- Recursion guard: the reviewer is itself a `claude -p` run whose own
# SessionEnd would re-fire this hook. The review invocation sets
# CLAUDE_SELF_IMPROVE=1, so bail when we see it. ---
[ -n "${CLAUDE_SELF_IMPROVE:-}" ] && exit 0
[ -n "${CLAUDE_SELF_IMPROVE_DISABLE:-}" ] && exit 0
[ -f "$HOME/.claude/self-improve/DISABLED" ] && exit 0

HOOK_INPUT=$(cat)

DOTFILES="$HOME/.dotfiles"
PROMPT="$DOTFILES/claude/prompts/self-improve-skill-review.md"
STATE_DIR="$HOME/.claude/self-improve"
REVIEWED_DIR="$STATE_DIR/reviewed"
LOG_DIR="$DOTFILES/claude/logs"
MIN_TURNS="${CLAUDE_SELF_IMPROVE_MIN_TURNS:-5}"
mkdir -p "$REVIEWED_DIR" "$LOG_DIR"

# --- Parse hook payload (jq if present, else python) ---
read_field() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$HOOK_INPUT" | jq -r ".$1 // empty" 2>/dev/null
  else
    printf '%s' "$HOOK_INPUT" | python3 -c "import json,sys;print(json.load(sys.stdin).get('$1','') or '')" 2>/dev/null
  fi
}
TRANSCRIPT_PATH=$(read_field transcript_path)
SESSION_ID=$(read_field session_id)
CWD=$(read_field cwd)

[ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ] && exit 0

# --- Dedupe: never review the same session twice ---
if [ -n "$SESSION_ID" ]; then
  MARKER="$REVIEWED_DIR/$SESSION_ID"
  [ -f "$MARKER" ] && exit 0
fi

# --- Cost gate: skip trivial sessions (fewer than MIN_TURNS REAL user prompts).
# Count only genuine user prompts (string content), not tool_result messages or
# sidechain/subagent turns, which inflate a naive "type":"user" grep ~30x. ---
USER_TURNS=$(python3 - "$TRANSCRIPT_PATH" <<'PY' 2>/dev/null || echo 0
import json,sys
n=0
for l in open(sys.argv[1]):
    l=l.strip()
    if not l: continue
    try: o=json.loads(l)
    except Exception: continue
    if o.get("type")!="user" or o.get("isSidechain"): continue
    c=o.get("message",{}).get("content")
    if isinstance(c,str) and c.strip(): n+=1
print(n)
PY
)
if [ "${USER_TURNS:-0}" -lt "$MIN_TURNS" ]; then
  exit 0
fi

# Mark reviewed up front so a crash mid-review doesn't cause a re-run loop.
[ -n "$SESSION_ID" ] && touch "$MARKER"

# --- Heavy work, fully detached ---
(
  cd "$DOTFILES" || exit 0
  STAMP=$(date +%Y%m%d-%H%M%S)
  RUN_LOG="$LOG_DIR/skill-review-$STAMP.log"

  # 1) Back up project auto-memory into dotfiles (symlink + commit). Idempotent;
  #    handles brand-new project memory dirs created since the last run.
  bash "$DOTFILES/claude/scripts/sync-auto-memory.sh" >>"$RUN_LOG" 2>&1 || true

  # 2) Snapshot pre-existing skill changes so we only commit what the reviewer
  #    touches — never the user's in-flight edits.
  before=$(git status --porcelain -- agents/skills 2>/dev/null | sed 's/^...//' | sort -u)

  # 3) Run the Opus reviewer. No Bash tool (file tools only); auto-approve edits.
  CLAUDE_SELF_IMPROVE=1 claude -p \
    "$(cat "$PROMPT")

Transcript to review: $TRANSCRIPT_PATH
Session cwd: ${CWD:-unknown}" \
    --model opus \
    --allowedTools "Read,Write,Edit,Glob,Grep" \
    --disallowedTools "Bash" \
    --permission-mode acceptEdits \
    --add-dir "$HOME/.claude" \
    >>"$RUN_LOG" 2>&1 || true

  # 4) Commit ONLY the skill files the reviewer created/modified.
  after=$(git status --porcelain -- agents/skills 2>/dev/null | sed 's/^...//' | sort -u)
  newpaths=$(comm -13 <(printf '%s\n' "$before") <(printf '%s\n' "$after") | grep -v '^$' || true)
  if [ -n "$newpaths" ]; then
    printf '%s\n' "$newpaths" | while IFS= read -r f; do
      [ -n "$f" ] && git add -- "$f" 2>/dev/null || true
    done
    if ! git diff --cached --quiet -- agents/skills 2>/dev/null; then
      git commit -q -m "claude: self-improve skill review (session ${SESSION_ID:0:8})" \
        -- agents/skills 2>/dev/null || true
    fi
  fi
) >/dev/null 2>&1 &
disown 2>/dev/null || true

exit 0
