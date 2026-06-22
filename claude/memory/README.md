# Claude Memory Wiki — contract & schema

An LLM-maintained wiki (pattern: Karpathy, <https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f>).
Canonical home: `~/.dotfiles/claude/memory/` (git-backed), symlinked to `~/.claude/memory/`.
This is the **cross-project, topical, load-on-demand** memory layer ("Rail 2").
**Read this file before recording to or reorganizing the wiki.**

## First principle: records, not facts
Everything here is a **record** — point-in-time, what-was-true-when-written — NOT an eternal fact.
- Every page carries `updated:` (and optional `ttl:`). Treat anything past its `ttl` as **stale → re-verify before acting**.
- When a new record contradicts an old one, **update the page and note it in `log.md`** — don't silently rewrite history.
- Before asserting a record as current truth (file paths, IDs, people, status), **verify against the live source.**

## Routing — what lives where
- **Live/operational payload** (investor lists, outreach status, task state) → the **system of record** (Notion / Todoist / Gmail). NOT copied here. Register a **pointer** here instead (a `pointer`-type page).
- **Activatable knowledge** (how to write X, a procedure, a style) → a **skill** (`~/.dotfiles/agents/skills/`); its `description` is the trigger ("Rail 1"). Not here.
- **Cross-project records/facts you look up** → a topical page here + a line in `index.md`.
- **Repo-local discoveries** (about one codebase) → that project's auto-memory (`~/.claude/projects/<proj>/memory/`), not here.

> Rule of thumb: **payload → system of record · pointer → index · activatable → skill · cross-project record → wiki · repo-local → project memory.**

## Files
- `index.md` — the catalog: one line per page, grouped by category. The map, kept terse.
- `log.md` — append-only chronological log: `## [YYYY-MM-DD] <kind> | <title>` (kinds: `record`, `update`, `pointer`, `lint`, `prune`).
- `<topic>.md` — a page (frontmatter below). Cross-link with `[[topic]]`.

## Page frontmatter
```
---
name: <kebab-slug>
description: <one line — the routing / recall key>
type: record | reference | pointer
updated: YYYY-MM-DD
ttl: <e.g. 30d | none>      # optional; when to re-verify
---
```

## Workflows (adapted from the Karpathy pattern)
- **Record:** decide routing (above) → if it belongs here, write/append the page → add/refresh its `index.md` line → append a `log.md` entry → `[[link]]` related pages.
- **Recall:** read `index.md`, open the matching page(s); for live payload, follow the pointer to the system of record.
- **Lint (periodic anti-entropy):** scan for stale (`updated`/`ttl`), contradictions, orphan pages, missing cross-links, and pointers that 404 → fix or prune → log it. Pairs with the `measurement-before-pruning` principle (prune on signal, not vibe).

## When updating the wiki
Re-read this README (the contract), keep `index.md` terse, and append to `log.md`. The always-on pointer to this wiki lives in `~/.claude/CLAUDE.md` (→ `CLAUDE.personal.md`).
