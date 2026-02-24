---
name: memory-placement
description: "Use when user says 'remember this', when deciding where to store learnings or context, when about to edit CLAUDE.md or create a skill, or when routing any persistent information. Determines the correct storage destination among CLAUDE.md, auto-memory, rules, skills, and local overrides."
---

# Memory Placement

Route persistent information to the right destination. The goal is: information is discoverable when needed, without bloating context that's loaded every session.

## Hop Cost

Each "hop" (notice a skill → open it → open a referenced doc) adds latency and risk of being missed.

- **L0**: CLAUDE.md — loaded every session, universal guardrails only
- **L1**: Skills / rules — loaded when triggered or when files match
- **L2+**: Referenced docs inside skills — loaded on demand

Promote upward only when a miss proves high-risk or recurs. See `mistake-tracking` skill for the escalation ladder.

## Decision Tree

```
Who is writing this? (human instruction vs Claude learning)
├── CLAUDE is writing (learned insight, debugging note, architecture discovery)
│   └── Auto-memory: ~/.claude/projects/<project>/memory/
│
└── HUMAN is writing (instruction, preference, rule, workflow)
    │
    ├── Needed MOST sessions + high miss risk?
    │   ├── All projects → ~/.claude/CLAUDE.md
    │   └── This project → ./CLAUDE.md (checked into git)
    │
    ├── Scoped to specific files/paths?
    │   └── .claude/rules/<topic>.md with paths: frontmatter
    │       (e.g., only load when touching src/api/**/*.ts)
    │
    ├── Personal preference, not shared with team?
    │   ├── All projects → ~/.claude/CLAUDE.md or ~/.claude/rules/
    │   └── This project → ./CLAUDE.local.md (auto-gitignored)
    │
    ├── Procedural knowledge triggered by context?
    │   └── Skill (.claude/skills/<name>/SKILL.md)
    │
    ├── Third-party API/library docs?
    │   └── Don't store — fetch via Context7 or WebFetch at use time
    │
    └── Historical reference (debugging log, past decisions)?
        └── Auto-memory or project logs/
```

## Storage Destinations

| Destination | Path | Loaded | Scope | Who writes |
|-------------|------|--------|-------|------------|
| **User CLAUDE.md** | `~/.claude/CLAUDE.md` | Every session | All projects | Human |
| **Project CLAUDE.md** | `./CLAUDE.md` | Every session in this repo | Team (git) | Human |
| **Local overrides** | `./CLAUDE.local.md` | Every session in this repo | Personal (gitignored) | Human |
| **User rules** | `~/.claude/rules/*.md` | Every session | All projects | Human |
| **Project rules** | `./.claude/rules/*.md` | Every session (or path-filtered) | Team (git) | Human |
| **Auto-memory** | `~/.claude/projects/<project>/memory/` | MEMORY.md index at startup | Per-project, personal | Claude |
| **Personal skills** | `~/.claude/skills/<name>/SKILL.md` | When description matches | All projects | Human |
| **Project skills** | `./.claude/skills/<name>/SKILL.md` | When description matches | Team (git) | Human |
| **Canonical skills** | `~/.dotfiles/agents/skills/<name>/` | Via symlink to ~/.claude/skills/ | All projects | Human |

### Auto-Memory Details

Claude writes to `~/.claude/projects/<project>/memory/` during sessions. Only the first 200 lines of `MEMORY.md` load at startup — keep it concise and link to topic files for details.

```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Index (200-line cap at startup)
├── debugging.md       # Topic-specific notes
├── patterns.md        # Discovered conventions
└── api-notes.md       # Integration learnings
```

Use `/memory` to view and edit memory files. Auto-memory is the right place for things Claude discovers (not things the user instructs).

### Rules with Path Filtering

`.claude/rules/*.md` files support conditional loading via `paths:` frontmatter:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/**/*.test.ts"
---
# API Testing Rules
- All API endpoints must have integration tests
- Use supertest for HTTP assertions
```

This rule only loads when Claude is working on files matching those globs. Use this for domain-specific conventions that would be noise elsewhere.

### CLAUDE.md Imports

CLAUDE.md files support `@path/to/file` imports (up to 5 hops deep):

```markdown
See @README for project overview.
Follow conventions in @docs/coding-standards.md.
```

Use imports to keep CLAUDE.md lean while making related docs discoverable.

## Before Editing CLAUDE.md

- [ ] Is this needed MOST sessions? If no → rule, skill, or auto-memory instead
- [ ] Will missing it cause mistakes? If no → on-demand loading is fine
- [ ] Is there an existing section it fits in? Avoid duplication
- [ ] Could a `@import` reference suffice instead of inlining?
- [ ] Is this personal preference? → `CLAUDE.local.md` or `~/.claude/CLAUDE.md`, not project CLAUDE.md

## Writing Skill Descriptions

Skills trigger based on their `description` field. Write them to match the contexts where they should fire:

```yaml
description: "Use when [specific triggering condition]"
```

Examples:
- `"Use when about to run git stash or git worktree operations"`
- `"Use when killing processes on ports or freeing busy ports"`

Test: would Claude naturally think to load this in that situation? If the description is too narrow, it won't trigger. Err on the side of "pushy" — undertriggering is the more common failure mode.

## Acceptance Checks

- [ ] Information routed to correct destination per decision tree
- [ ] CLAUDE.md contains only universal rules/guardrails (not project learnings or niche instructions)
- [ ] Personal preferences in `CLAUDE.local.md` or user-level files, not project CLAUDE.md
- [ ] New skills have "Use when..." descriptions that will actually trigger
- [ ] Changes committed (dotfiles for global, project repo for project-level)
