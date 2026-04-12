#!/usr/bin/env bash
set -euo pipefail

mode="text"
if [[ "${1:-}" == "--json" ]]; then
  mode="json"
fi

cwd="$(pwd)"
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || printf '%s' "$cwd")"
codex_thread_id="${CODEX_THREAD_ID:-}"
claude_session_id="${CLAUDE_SESSION_ID:-}"

primary_runtime="unknown"
primary_session_id=""

if [[ -n "$claude_session_id" ]]; then
  primary_runtime="claude-code"
  primary_session_id="$claude_session_id"
elif [[ -n "$codex_thread_id" ]]; then
  primary_runtime="codex"
  primary_session_id="$codex_thread_id"
fi

if [[ "$mode" == "json" ]]; then
  export SESSION_SAVE_CWD="$cwd"
  export SESSION_SAVE_REPO_ROOT="$repo_root"
  export SESSION_SAVE_PRIMARY_RUNTIME="$primary_runtime"
  export SESSION_SAVE_PRIMARY_SESSION_ID="$primary_session_id"
  export SESSION_SAVE_CODEX_THREAD_ID="$codex_thread_id"
  export SESSION_SAVE_CLAUDE_SESSION_ID="$claude_session_id"
  python3 - <<'PY'
import json
import os

print(json.dumps({
    "cwd": os.environ["SESSION_SAVE_CWD"],
    "repo_root": os.environ["SESSION_SAVE_REPO_ROOT"],
    "primary_runtime": os.environ["SESSION_SAVE_PRIMARY_RUNTIME"],
    "primary_session_id": os.environ["SESSION_SAVE_PRIMARY_SESSION_ID"],
    "codex_thread_id": os.environ.get("SESSION_SAVE_CODEX_THREAD_ID", ""),
    "claude_session_id": os.environ.get("SESSION_SAVE_CLAUDE_SESSION_ID", ""),
}, indent=2))
PY
else
  cat <<EOF
cwd=$cwd
repo_root=$repo_root
primary_runtime=$primary_runtime
primary_session_id=$primary_session_id
codex_thread_id=$codex_thread_id
claude_session_id=$claude_session_id
EOF
fi
