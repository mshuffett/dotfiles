#!/usr/bin/env bash
# dev-push-secrets.sh — deliver the dev box's service secrets from 1Password to a box.
# Run on the AUTHED MAC (op signed in). Pulls the devbox/* op documents and writes them
# straight to the box over ssh — secrets never touch local disk, and the box never needs
# op installed/authed. Usage: dev-push-secrets.sh [ssh_host]   (default: dev-default)
set -uo pipefail
HOST="${1:-dev-default}"
VAULT="${OP_VAULT:-Employee}"

push() { # $1 = op document title, $2 = remote path (relative to box home)
  local title="$1" path="$2" dir; dir="$(dirname "$path")"
  if op document get "$title" --vault "$VAULT" 2>/dev/null \
     | ssh "$HOST" "mkdir -p '$dir' && cat > '$path' && chmod 600 '$path'"; then
    echo "  pushed $path"
  else echo "  FAIL: $title -> $path"; fi
}

echo "Pushing secrets from 1Password ($VAULT) to $HOST ..."
push devbox/openclaw.env                ".config/agents/openclaw.env"
push devbox/gbrain.env                  ".config/agents/gbrain.env"
push devbox/claude-credentials          ".claude/.credentials.json"
push devbox/hermes.env                  ".hermes/.env"
push devbox/hermes-config.yaml          ".hermes/config.yaml"
push devbox/hermes-rin-grok.env         ".hermes/profiles/rin-grok/.env"
push devbox/hermes-rin-grok-config.yaml ".hermes/profiles/rin-grok/config.yaml"
push devbox/todoist-claude.env          "platform/services/todoist-claude/.env"
push devbox/gh-hosts.yml                 ".config/gh/hosts.yml"

# openclaw agent identity/config workspace (tarball) — restores the SAME agent identity
echo "  restoring openclaw workspace (identity/config) ..."
if op document get "devbox/openclaw-workspace.tgz" --vault "$VAULT" 2>/dev/null | base64 -d \
   | ssh "$HOST" "mkdir -p ~/.openclaw && tar xzf - -C ~/.openclaw"; then
  echo "  pushed openclaw workspace"
else echo "  FAIL: openclaw workspace"; fi
echo "SECRETS_PUSHED"
