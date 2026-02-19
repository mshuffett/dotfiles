# Plan File Convention

Use when creating persistent plan files for complex, multi-session work.

## Location & Naming

- Directory: `./plans/` at the project root (create if needed)
- Naming: `<descriptive-slug>.md` in kebab-case (e.g., `sandbox-providers-completion.md`)

## Required Frontmatter

```yaml
---
status: active
created: YYYY-MM-DD
---
```

**Status values:**
- `active` — Currently being worked on. Prefer at most one active plan at a time.
- `completed` — Work finished successfully.
- `abandoned` — Plan was dropped (note reason in the body).
- `paused` — Work intentionally stopped; will resume later.

## Session Start

Scan `./plans/` for files with `status: active` frontmatter. If one exists, read it and resume from where it left off.

## Session End

Update frontmatter to `status: completed` (or `abandoned`/`paused`). Never leave stale `active` plans behind.

## Suggested Structure

```markdown
---
status: active
created: YYYY-MM-DD
---
# Plan Title

## Goal
What we're trying to accomplish.

## Steps
1. First step
2. Second step

## Progress Log
- YYYY-MM-DD: What happened, decisions made, blockers found
```

The Progress Log section is append-only — add entries as work proceeds so future sessions can pick up context.
