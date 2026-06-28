#!/usr/bin/env bash
# dev-provision.sh — rebuild the dev box's toolchain, repos, and services from scratch.
# Run AFTER bin/dev-harden.sh, as the `ubuntu` user, on a fresh Ubuntu 24.04 box.
# Idempotent (safe to re-run). Secrets restore from 1Password (`op`); non-secret
# systemd unit files come from this dotfiles repo (dev-server/systemd/).
#
# Reproducibility for the box that OOM-died 2026-06-27. Install methods captured
# from the original box's apt history. See plans/dev-box-full-reproducibility.md.
set -uo pipefail
log(){ echo -e "\n== $* =="; }
export DEBIAN_FRONTEND=noninteractive

# ---------- base apt packages (from original box apt history) ----------
log "apt base packages"
sudo apt-get update -qq
sudo apt-get install -y -qq \
  zsh git curl wget unzip build-essential ca-certificates gnupg \
  ripgrep fd-find bat fzf jq direnv neovim btop tmux less locales \
  python3 python3-pip python3-dev libffi-dev ffmpeg \
  postgresql postgresql-16-pgvector postgresql-client zoxide || true

# ---------- node 22 (nodesource) ----------
if ! command -v node >/dev/null 2>&1 || ! node -v 2>/dev/null | grep -q '^v22'; then
  log "node 22 (nodesource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi

# ---------- pnpm + claude code (npm global) ----------
log "pnpm + claude code (npm -g)"
sudo npm install -g pnpm @anthropic-ai/claude-code

# ---------- github cli (apt repo) ----------
if ! command -v gh >/dev/null 2>&1; then
  log "github cli"
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg status=none
  echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
  sudo apt-get update -qq && sudo apt-get install -y -qq gh
fi

# ---------- docker-ce (apt repo) ----------
if ! command -v docker >/dev/null 2>&1; then
  log "docker-ce"
  sudo install -m0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
  sudo usermod -aG docker "$USER" || true
fi

# ---------- bun (user installer) ----------
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  log "bun"; curl -fsSL https://bun.sh/install | bash
fi
export PATH="$HOME/.bun/bin:$PATH"

# global bun tools: openclaw (messaging gateway) + gbrain
log "bun global tools (openclaw, gbrain)"
"$HOME/.bun/bin/bun" add -g openclaw gbrain 2>&1 | tail -2 || echo "  (bun global install needs review)"

# ---------- git auth for private repos ----------
# Use gh's token (from ~/.config/gh/hosts.yml, delivered by dev-push-secrets.sh) so the
# private clones below (platform, polylog, compose-monorepo) authenticate over https.
command -v gh >/dev/null 2>&1 && gh auth setup-git 2>/dev/null || true

# ---------- repos ----------
log "clone repos"
clone(){ [ -d "$2/.git" ] || git clone --quiet "$1" "$2" || echo "  (clone failed: $1 — may need auth/access)"; }
clone https://github.com/mshuffett/dotfiles.git           "$HOME/.dotfiles"
clone https://github.com/mshuffett/platform.git           "$HOME/platform"
clone https://github.com/mshuffett/polylog.git            "$HOME/polylog"
clone https://github.com/mshuffett/tana-clone.git         "$HOME/tana-clone"
clone https://github.com/mshuffett/pomodoro-vibe.git      "$HOME/pomodoro-app"
clone https://github.com/NousResearch/hermes-agent.git    "$HOME/.hermes/hermes-agent"
# compose-monorepo + openclaw: private/org — clone if `gh auth` has access
clone https://github.com/compose-ai/compose-monorepo.git  "$HOME/compose-monorepo-review"

# ---------- dotfiles symlinks ----------
[ -x "$HOME/.dotfiles/script/bootstrap" ] && "$HOME/.dotfiles/script/bootstrap" || true

# ---------- hermes python venv (uv + python 3.11, per pyproject requires-python + uv.lock) ----------
if [ -d "$HOME/.hermes/hermes-agent" ] && [ ! -x "$HOME/.hermes/hermes-agent/venv/bin/python" ]; then
  log "hermes venv (uv, python 3.11)"
  command -v uv >/dev/null 2>&1 || curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  ( cd "$HOME/.hermes/hermes-agent" \
    && uv venv --python 3.11 venv \
    && VIRTUAL_ENV="$PWD/venv" uv pip install -e . ) 2>&1 | tail -3 \
    || echo "  (hermes uv install needs review)"
fi

# ---------- openclaw bun deps ----------
[ -d "$HOME/.openclaw" ] && ( cd "$HOME/.openclaw" && bun install ) || true

# ---------- secrets ----------
# Secrets are delivered separately by bin/dev-push-secrets.sh, run from the AUTHED MAC
# (op stays on the trusted machine; nothing secret lives on the box image). `dev create`
# runs it automatically after this script.
log "secrets: deliver with 'dev-push-secrets.sh <host>' from your op-authed mac"

# ---------- systemd user services ----------
log "systemd user services"
loginctl enable-linger "$USER" 2>/dev/null || true
mkdir -p "$HOME/.config/systemd/user"
UNITS_SRC="$HOME/.dotfiles/dev-server/systemd"
[ -d "$UNITS_SRC" ] && cp "$UNITS_SRC"/*.service "$HOME/.config/systemd/user/" 2>/dev/null || true
export XDG_RUNTIME_DIR="/run/user/$(id -u)"
systemctl --user daemon-reload 2>/dev/null || true
for svc in hermes-gateway hermes-gateway-rin-grok openclaw-gateway todoist-claude; do
  if [ -f "$HOME/.config/systemd/user/$svc.service" ]; then
    systemctl --user enable --now "$svc" 2>/dev/null && echo "  started $svc" || echo "  $svc failed to start (check secrets/deps)"
  else echo "  unit $svc.service not present (skip)"; fi
done

echo -e "\nPROVISION_DONE"
