#!/usr/bin/env bash
# PreToolUse advisory hook (matcher: Agent|Task).
#
# Why: passing `name` to an Agent/Task call silently switches delivery from
# fire-and-forget (final report auto-returned as the tool result) to
# teammate/mailbox mode (report NOT auto-returned; idle agents need a
# SendMessage nudge). This was user-caught on 2026-07-01 (mistakes.jsonl
# guide.not_consulted recurrence): the rule existed in docs ALREADY IN CONTEXT
# and still failed on salience, so per plans/self-improve-mistake-eval-loop.md
# §7.7 this class needs a forcing function at the decision surface, not a
# third copy of the rule.
#
# Behavior: ADVISORY ONLY. If tool_input.name is set, inject a one-line
# reminder via hookSpecificOutput.additionalContext. Never blocks, never sets
# permissionDecision (permission flow untouched). Zero output when name unset.
set -euo pipefail

input=$(cat)

# A/B test escape hatch: when AGENT_NAME_ADVISORY_DISABLE=1, consume stdin and
# exit silently so the RED arm of a red/green replay eval sees pre-fix behavior
# (no advisory injected). GREEN leaves it unset so the advisory fires normally.
[ "${AGENT_NAME_ADVISORY_DISABLE:-}" = "1" ] && exit 0

name=$(printf '%s' "$input" | jq -r '.tool_input.name // empty' 2>/dev/null || true)
[ -z "$name" ] && exit 0

jq -cn '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    additionalContext: "Advisory: you passed `name` to this Agent/Task call. Naming switches delivery from tool-result (fire-and-forget, report auto-returned) to teammate/mailbox mode (report NOT auto-returned; idle agents must be nudged via SendMessage). For independent parallel subagents whose results you synthesize yourself, dispatch UNNAMED. Keep `name` only if you have a concrete reason to message this agent mid-run. Proceed if intentional."
  }
}'
