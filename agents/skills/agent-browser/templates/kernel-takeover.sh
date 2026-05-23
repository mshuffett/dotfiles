#!/usr/bin/env bash
# Launch a non-headless Kernel cloud browser via agent-browser and print a
# live-view "takeover" URL you can open on ANY device (including a phone) to
# click/type in the same session the agent is driving.
#
# Requires: KERNEL_API_KEY in env (auto-loaded from ~/.env.zsh), agent-browser, node.
# Usage:    ./kernel-takeover.sh [start-url]
set -euo pipefail

URL="${1:-https://www.google.com}"

export AGENT_BROWSER_PROVIDER=kernel
export KERNEL_HEADLESS="${KERNEL_HEADLESS:-false}"               # false => live view works
export KERNEL_TIMEOUT_SECONDS="${KERNEL_TIMEOUT_SECONDS:-1800}"  # 30-min idle window
# Optional: persist cookies/logins across runs
# export KERNEL_PROFILE_NAME="${KERNEL_PROFILE_NAME:-default}"

if [ -z "${KERNEL_API_KEY:-}" ]; then
  echo "KERNEL_API_KEY not set. Add it to ~/.env.zsh (auto-loaded) or export it." >&2
  exit 1
fi

agent-browser open "$URL" >/dev/null
CDP="$(agent-browser get cdp-url | tail -1)"

# Build the live-view URL from the CDP URL's JWT (no SDK dependency).
LIVE="$(CDP="$CDP" node -e '
const u=new URL(process.env.CDP);
const p=JSON.parse(Buffer.from(u.searchParams.get("jwt").split(".")[1].replace(/-/g,"+").replace(/_/g,"/"),"base64").toString());
const s=p.session||p;
console.log(`https://${u.host}/browser/live/${s.liveSlug||p.liveSlug}`);')"

cat <<EOF
Opened:        $URL
Takeover URL:  $LIVE
Watch-only:    $LIVE?readOnly=true

Drive it:      agent-browser snapshot -i ; agent-browser click @e1 ; agent-browser fill @e2 'text'
Stop billing:  agent-browser close --all   # then delete the Kernel session (see references/cloud-providers.md)
EOF
