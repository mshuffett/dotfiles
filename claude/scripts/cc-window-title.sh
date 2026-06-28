#!/usr/bin/env bash
# Async Stop hook: name the tmux window after a <=3-word summary of the Claude Code session.
# Uses `claude -p --model haiku` with hooks disabled for the child (no recursion, no sound,
# no API key needed). Debounced. Wired in claude/settings.json as a Stop hook with
# "async": true so it never adds latency to the turn.
set -uo pipefail

[ -n "${CLAUDE_CC_TITLE_GUARD:-}" ] && exit 0   # belt-and-suspenders anti-recursion
input=$(cat)
[ -z "${TMUX:-}" ] && exit 0
pane="${TMUX_PANE:-}"; [ -z "$pane" ] && exit 0

session_id=$(printf '%s' "$input" | jq -r '.session_id // empty' 2>/dev/null)
transcript=$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)
[ -z "$transcript" ] && exit 0
transcript="${transcript/#\~/$HOME}"
[ -f "$transcript" ] || exit 0

# Debounce: regenerate at most once per 150s per session.
stamp="/tmp/cc-title-${session_id}"; now=$(date +%s)
if [ -f "$stamp" ]; then last=$(cat "$stamp" 2>/dev/null || echo 0); [ $((now - last)) -lt 150 ] && exit 0; fi
echo "$now" > "$stamp"

# Recent user+assistant text (last 6 messages, capped).
ctx=$(jq -rs '[.[]|select(.message.role=="user" or .message.role=="assistant")
        |(.message.content|if type=="array" then (map(select(.type=="text").text)|join(" ")) else . end)
        |select(type=="string" and (.|length)>0)] | .[-6:] | join("\n")' "$transcript" 2>/dev/null | tail -c 1800)
[ -z "$ctx" ] && exit 0

prompt="Name this Claude Code session's topic in AT MOST 3 words, Title Case, no quotes or punctuation. Reply with ONLY the words.

$ctx"
title=$(CLAUDE_CC_TITLE_GUARD=1 command claude -p --model haiku --settings '{"disableAllHooks":true}' "$prompt" 2>/dev/null \
        | tr -d '\r' | head -1 | tr -cd '[:alnum:] ' | sed 's/  */ /g; s/^ //; s/ $//' | cut -c1-28)
[ -z "$title" ] && exit 0

win=$(tmux display-message -t "$pane" -p '#{window_id}' 2>/dev/null)
[ -z "$win" ] && exit 0
tmux set-window-option -t "$win" automatic-rename off 2>/dev/null
tmux rename-window -t "$win" "$title" 2>/dev/null
