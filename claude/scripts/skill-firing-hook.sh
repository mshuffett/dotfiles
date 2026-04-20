#!/bin/bash
# Fire-and-forget wrapper for skill firing telemetry.
# Reads hook payload on stdin, launches logger in background, exits immediately.

HOOK_INPUT=$(cat)

# Run logger detached; never block the hook.
(
  echo "$HOOK_INPUT" | exec bun "$HOME/.dotfiles/bin/skill-firing-logger.ts"
) >/dev/null 2>&1 &
disown 2>/dev/null || true

exit 0
