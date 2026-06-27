---
name: Document architecture proactively
description: When discovering undocumented architectural patterns during exploration, create docs and reference them in CLAUDE.md
type: feedback
---

When exploring a codebase and discovering undocumented architectural patterns (state sync mechanisms, data flow patterns, DI conventions, etc.), proactively create documentation in a `docs/` file and add a pointer in the relevant CLAUDE.md. CLAUDE.md should be an index/map, not contain the full detail.

**Why:** Michael flagged that architectural knowledge like the webext-redux state sync mechanism should be documented in a docs file (not inline in CLAUDE.md) so it's discoverable but not loaded into every session.

**How to apply:** During codebase exploration, if you find an important pattern that isn't documented: (1) create a focused doc in the appropriate `docs/` directory, (2) add a one-line pointer in the nearest CLAUDE.md, (3) keep CLAUDE.md as a map — detail lives in linked docs.
