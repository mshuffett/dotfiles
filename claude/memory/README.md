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

### Place by recall, not by topic
Before writing or updating an entry, ask: **"In what future moment would I need this, and what would I be doing or searching for then?"** Then **trace that recall chain backwards** and put the entry — *and its trigger* — where that chain actually passes (the right `index.md` line, the right trigger phrasing, the page itself). Topical tidiness is worthless if no realistic recall path reaches the entry; a perfectly-written page nothing triggers is dead memory. Placement is a recall-engineering decision, not a filing decision.

### Verify the trigger with a fresh subagent (eval-first)
Don't assume a trigger fires — **test it.** After adding or rewording a trigger, spawn a subagent given *only* the triggering scenario (no extra context, no hints) and watch whether it actually reaches and uses the entry. If it doesn't fire, fix the **trigger wording/placement**, not the page body. This is the cheapest way to catch a memory that's correct but unreachable.

### Do memory work via background agents by default
Recording, the recall-chain placement, the trigger-verification check, and lint passes are all **offloaded to background agents** by default so they don't block the main thread. The main thread states the intent and the entry; a background agent does the write + the fresh-subagent trigger check and reports back. Inline only for trivial one-line touch-ups.

### Root-file edits: as general as possible, trigger still guaranteed
Edits to the always-on root (`CLAUDE.personal.md`) are expensive context every session pays for. Keep them **as general as they can be while still guaranteeing the trigger occurs** — the root should *point* (name the scenario, send to the wiki/skill), not *store* the specifics. Push detail down into the wiki or a skill; promote to the root only the minimal trigger that the recall chain requires.
