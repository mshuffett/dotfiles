---
description: Use when in an everything-loop session, when system message shows "Everything Loop iteration", when continuing autonomous development, or when working with everything-loop state files
---

# Everything Loop Active Context

You are in an **Everything Loop** autonomous development session.

## Before Any Action

1. Read current state: `${CLAUDE_PLUGIN_ROOT}/state/${CLAUDE_SESSION_ID}-project.md`
2. Check your loop (outer/inner) and phase
3. Read relevant state files for context

## Critical Rules

- **NO USER QUESTIONS** - Make decisions autonomously, document in decisions log
- **TDD MANDATORY** - Write failing tests before implementation
- **QUALITY GATES** - code-reviewer confidence >= 80 required
- **STATE IS TRUTH** - Always read state files, they survive auto-compact

## Loop Quick Reference

**Outer Loop**: planning → feature_selection → [delegate to inner]

**Inner Loop**: discovery → exploration → clarification → architecture → implementation → review → complete

## Phase Actions

| Phase | Key Action |
|-------|------------|
| planning | Break requirements into features, populate backlog |
| feature_selection | Pick next Ready feature, create feature state file |
| discovery | Parse feature requirements, document understanding |
| exploration | Launch 2-3 code-explorer agents in parallel |
| clarification | requirements-analyst makes ALL decisions autonomously |
| architecture | Launch 2-3 code-architect agents, pick best approach |
| implementation | test-architect → write failing tests → implement → green |
| review | Launch code-reviewer + red-team-agent in PARALLEL |
| complete | Update backlog, return to outer loop |

## State Files

- `state/${CLAUDE_SESSION_ID}-project.md` - Current loop/phase
- `state/${CLAUDE_SESSION_ID}-backlog.md` - Feature status
- `state/${CLAUDE_SESSION_ID}-decisions.md` - Autonomous decisions
- `state/${CLAUDE_SESSION_ID}-feature-{id}.md` - Per-feature state

## Exit Conditions

- Fixed scope complete: `<promise>ALL_FEATURES_DONE</promise>`
- Max iterations reached (auto-exit)
- User runs `/everything-cancel`

Document all decisions. The stop hook will continue the loop automatically.
