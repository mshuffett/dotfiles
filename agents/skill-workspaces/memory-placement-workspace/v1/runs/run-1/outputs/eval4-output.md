# Eval 4 Output: Local Database URL Placement

## User Input

> "My local database is at postgres://localhost:5432/myapp_dev — don't commit this anywhere shared."

## Decision

**Store in: `./CLAUDE.local.md` (project-local, gitignored)**

## Reasoning (via memory-placement decision tree)

1. **Who is writing this?** The human — this is a user-provided instruction, not a Claude learning.
2. **Is it needed most sessions?** Potentially yes, but it's personal/environment-specific, not universal.
3. **Is it scoped to specific files/paths?** No.
4. **Is it personal preference, not shared with team?** YES — the user explicitly said "don't commit this anywhere shared." A local DB URL is inherently personal/environment-specific.
5. **Result:** `./CLAUDE.local.md` — project-local file that is auto-gitignored, never committed, never shared.

## What to Do

Add the following to `./CLAUDE.local.md` (create it if it doesn't exist):

```markdown
## Local Dev Config

- Local database: `postgres://localhost:5432/myapp_dev`
```

## What NOT to Do

- Do NOT add to `./CLAUDE.md` — this is checked into git and shared with the team
- Do NOT add to `~/.claude/CLAUDE.md` — this is personal global config but the DB URL is project-specific
- Do NOT add to auto-memory — auto-memory is for Claude learnings, not user instructions
- Do NOT add to any `.claude/rules/*.md` file — rules may be committed to git

## Acceptance Checks

- [x] Routed to correct destination (CLAUDE.local.md) per decision tree
- [x] Not placed in any shared/committed location
- [x] Personal preference correctly identified and kept out of project CLAUDE.md
- [x] User's explicit constraint ("don't commit anywhere shared") honored
