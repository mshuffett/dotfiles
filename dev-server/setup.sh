#!/bin/bash
# Dev Server First-Time Setup Script
# Run this after deploying to clone repos and set up dotfiles
#
# Usage (from local machine):
#   fly ssh console -a dev-server -u michael -C "bash /data/dotfiles/dev-server/setup.sh"
#
# After running this script, copy OAuth credentials from local machine:
#   CREDS=$(security find-generic-password -s "Claude Code-credentials" -w)
#   fly ssh console -a dev-server -u michael -C "bash -c 'echo '\''$CREDS'\'' > ~/.claude/.credentials.json && chmod 600 ~/.claude/.credentials.json'"

set -e

echo "=== Dev Server Setup ==="

# Clone dotfiles if not exists
if [ ! -d "/data/dotfiles/.git" ]; then
  echo "Cloning dotfiles..."
  git clone git@github.com:mshuffett/dotfiles.git /data/dotfiles
else
  echo "Dotfiles already cloned"
fi

# Clone repos if not exist
cd /data/ws

if [ ! -d "compose-monorepo" ]; then
  echo "Cloning compose-monorepo..."
  git clone git@github.com:compose-ai/compose-monorepo.git
else
  echo "compose-monorepo already cloned"
fi

if [ ! -d "everything-monorepo" ]; then
  echo "Cloning everything-monorepo..."
  git clone git@github.com:compose-ai/everything-monorepo.git
else
  echo "everything-monorepo already cloned"
fi

# Symlink configs
echo "Setting up dotfiles symlinks..."
ln -sf ~/.dotfiles/zsh/zshrc.symlink ~/.zshrc
ln -sf ~/.dotfiles/git/gitconfig.symlink ~/.gitconfig
ln -sf ~/.dotfiles/tmux/tmux.conf.symlink ~/.tmux.conf
ln -sf ~/.dotfiles/claude ~/.claude

# Install dependencies
echo "Installing compose-monorepo dependencies..."
cd /data/ws/compose-monorepo && pnpm install

echo "Installing everything-monorepo dependencies..."
cd /data/ws/everything-monorepo && pnpm install

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "  1. Copy OAuth credentials from local machine (see header comment)"
echo "  2. Start a tmux session: tmux new -s main"
echo "  3. Run: claude --version  # to verify Claude Code works"
