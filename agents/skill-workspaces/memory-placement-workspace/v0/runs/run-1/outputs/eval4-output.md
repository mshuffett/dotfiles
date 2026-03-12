# Memory Placement Decision: Local Database URL

## User Input

> "My local database is at postgres://localhost:5432/myapp_dev — don't commit this anywhere shared."

## Key Constraint

The user explicitly says **do not commit this anywhere shared**. This rules out any location that is tracked in git or synced across machines.

## Decision Tree Analysis

```
Is this info needed MOST OF THE TIME?
└── NO (it's a local dev credential, not a universal rule)
    Does it auto-load based on context?
    └── NO (not procedural guidance)
        Is it a user-invoked action?
        └── NO
            Is it repo-specific?
            └── YES — but also LOCAL (must not be shared/committed)
```

The decision tree's normal branch would route repo-specific items to `<repo>/.claude/commands/` or project CLAUDE.md, but both of those are committed to git. The explicit "don't commit anywhere shared" constraint overrides the normal routing.

## Recommended Storage Locations (in priority order)

### 1. Project `.env` file (gitignored) — BEST for credentials

```
# .env (local to this machine, must be in .gitignore)
DATABASE_URL=postgres://localhost:5432/myapp_dev
```

- Standard practice for local credentials
- Gitignored by convention (check `.gitignore` to confirm)
- Tooling (dotenv, Docker, Railway) picks it up automatically
- Never committed

### 2. Local machine memory — `~/.claude/projects/<project>/memory/MEMORY.md`

```markdown
## Local Dev Config
- Database: postgres://localhost:5432/myapp_dev (local only, do not commit)
```

- Path: `~/.claude/projects/-Users-michael-ws-puffin-monorepo/memory/MEMORY.md`
- This file lives outside the repo, on the local machine only
- Not committed to git
- Survives across Claude sessions for this project

### NOT appropriate

| Location | Why Not |
|----------|---------|
| `./CLAUDE.md` | Committed to project repo — shared |
| `~/.claude/CLAUDE.md` | Committed to dotfiles — shared |
| `~/.dotfiles/agents/knowledge/atoms/` | Committed to dotfiles — shared |
| Any skill/command in dotfiles | Committed — shared |
| `./.claude/commands/` | Committed to project repo — shared |

## Summary

Store the database URL in the project's **local `.env` file** (gitignored) — this is the standard location for local credentials. If you want Claude to remember it across sessions for this project specifically, also note it in the **local machine memory file** (`~/.claude/projects/.../memory/MEMORY.md`), which is never committed.

Do NOT put it in CLAUDE.md, any dotfiles, or any committed file.
