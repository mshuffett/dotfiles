#!/usr/bin/env bash
set -euo pipefail

# Compatibility wrapper: keep old workflows working, but rebuild only
# the current Codex profile instead of forcing every canonical skill on.

exec "${HOME}/.dotfiles/bin/skill-profile" sync --runtime codex
