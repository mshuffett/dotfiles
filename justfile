# Dotfiles Command Runner
# Run `just` or `just --list` to see available commands

# Show all available commands
default:
  @just --list

# ============================================================================
# Git Helpers
# ============================================================================

# Show detailed git status
wtf:
  ~/.dotfiles/bin/git-wtf

# Promote current branch
promote:
  ~/.dotfiles/bin/git-promote

# Amend last commit
amend:
  ~/.dotfiles/bin/git-amend

# Delete merged local branches
clean-branches:
  ~/.dotfiles/bin/git-delete-local-merged

# ============================================================================
# Notifications
# ============================================================================

# Send push notification
notify message:
  ~/.dotfiles/bin/push "{{message}}"

# ============================================================================
# TTS (Text-to-Speech)
# ============================================================================

# Generate speech with Inworld TTS (default)
speak text:
  ~/.dotfiles/bin/inworld-tts "{{text}}"

# Generate speech with specific provider
tts text provider:
  ~/.dotfiles/bin/{{provider}}-tts "{{text}}"

# ============================================================================
# Image Generation
# ============================================================================

# Generate an image from a prompt
image prompt:
  ~/.dotfiles/bin/generate-image "{{prompt}}"

# ============================================================================
# Tmux Session Management
# ============================================================================

# Create or attach to named tmux session
session name:
  tmux new -A -s {{name}}

# Create tmux session in specific workspace directory
workspace name:
  tmux new -A -s {{name}} -c ~/ws/{{name}}

# ============================================================================
# Claude Commands
# ============================================================================

# Process Todoist tasks with GTD workflow
gtd:
  claude --dangerously-skip-permissions -p "/gtd"

# Quick idea capture
idea text:
  claude --dangerously-skip-permissions -p "/idea {{text}}"

# ============================================================================
# Dotfiles Management
# ============================================================================

# Edit this justfile
edit:
  $EDITOR ~/.dotfiles/justfile

# Reload shell configuration
reload:
  exec zsh

# Update Homebrew packages
brew-update:
  brew update && brew upgrade && brew cleanup

# Show modern CLI tools documentation
tools:
  bat ~/.dotfiles/MODERN_CLI_TOOLS.md
