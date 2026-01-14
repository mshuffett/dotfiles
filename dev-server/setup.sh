#!/bin/bash
# Dev Server First-Time Setup Script
# Run this after deploying to clone repos and set up dotfiles
#
# Usage (from local machine):
#   ANTHROPIC_API_KEY=$(source ~/.env.zsh && echo $ANTHROPIC_API_KEY) \
#     fly ssh console -a dev-server -u michael -C "ANTHROPIC_API_KEY='$ANTHROPIC_API_KEY' bash /data/dotfiles/dev-server/setup.sh"
#
# Or for fresh deploy (SSH key not yet on GitHub):
#   fly ssh console -a dev-server -u michael -C "bash ~/.dotfiles/dev-server/setup.sh"
#   Then manually set ANTHROPIC_API_KEY

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

# Set ANTHROPIC_API_KEY if provided
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "Setting ANTHROPIC_API_KEY..."
  # Remove any existing ANTHROPIC_API_KEY lines (avoid duplicates)
  sed -i '/^export ANTHROPIC_API_KEY=/d' ~/.zshrc 2>/dev/null || true
  echo "export ANTHROPIC_API_KEY=\"$ANTHROPIC_API_KEY\"" >> ~/.zshrc
  echo "✓ ANTHROPIC_API_KEY configured"
else
  echo "⚠ ANTHROPIC_API_KEY not provided - set it manually:"
  echo "  echo 'export ANTHROPIC_API_KEY=\"your-key\"' >> ~/.zshrc"
fi

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "  1. Start a tmux session: tmux new -s main"
echo "  2. Run: cd ~/ws/compose-monorepo && pnpm dev"
echo "  3. Run: claude --version  # to verify Claude Code works"
