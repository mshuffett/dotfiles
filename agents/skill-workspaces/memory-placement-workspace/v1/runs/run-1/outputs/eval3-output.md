# Eval 3 Output: Auth Token Discovery Placement

## Task

During debugging, Claude discovered that the project's auth tokens expire after exactly 30 minutes and the refresh endpoint is at `/api/auth/refresh`. This wasn't documented anywhere. Where should this be stored?

## Decision

**Storage destination: Auto-memory (`~/.claude/projects/<project>/memory/`)**

## Reasoning

Applying the memory-placement decision tree:

**Step 1: Who is writing this?**
Claude discovered this fact during a debugging session. It is not a human instruction, preference, or workflow rule — it is a Claude learning (an architecture discovery / debugging note).

The decision tree branches immediately:
```
CLAUDE is writing (learned insight, debugging note, architecture discovery)
└── Auto-memory: ~/.claude/projects/<project>/memory/
```

**Step 2: Where specifically within auto-memory?**

The auto-memory directory structure is:
```
~/.claude/projects/<project>/memory/
├── MEMORY.md       # Index (200-line cap at startup)
├── debugging.md    # Topic-specific notes
├── patterns.md     # Discovered conventions
└── api-notes.md    # Integration learnings
```

This information is an **integration/API detail** (token TTL + refresh endpoint), so it belongs in `api-notes.md` (or a similar topic file like `auth.md`), referenced from `MEMORY.md`.

A concise entry like:
```markdown
## Auth Tokens
- TTL: 30 minutes (exact)
- Refresh endpoint: POST /api/auth/refresh
- Discovered during debugging (not formally documented)
```

## What It Should NOT Be

- **Not `CLAUDE.md`** — CLAUDE.md is for human-written universal guardrails, not Claude discoveries
- **Not a skill** — This is a static fact, not procedural knowledge
- **Not a rule** — Rules are for human-authored file-path-scoped conventions
- **Not project documentation** — This wasn't formally documented; storing it in auto-memory keeps it as a personal/session-persistent note without polluting the team's docs prematurely

## Recommendation

Store in:
```
~/.claude/projects/<project>/memory/api-notes.md
```

With a one-line reference added to `MEMORY.md` so it loads at startup (given it's relevant to most auth-related work):
```markdown
- Auth token TTL: 30 min, refresh at /api/auth/refresh — see [api-notes.md](api-notes.md)
```
