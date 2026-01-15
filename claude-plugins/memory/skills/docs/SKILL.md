---
description: Use when adding or updating docs; prefer updating existing content and put deep guides under docs/.
---

# Documentation Guidelines

Before creating documentation:
1. Read the project README to see what docs exist.
2. Check if existing docs cover this — update them instead of creating new ones.
3. Don't create top-level docs without good reason — most docs should go in `docs/`.
4. Use feature-specific names, not generic ones (e.g., `daily-checkin-implementation.md` not `IMPLEMENTATION.md`).
5. Link new docs from README or parent doc (no orphaned files).

Top-level docs are for:
- README, CLAUDE.md, CHANGELOG (meta/navigation)
- Major cross-cutting concerns (TESTING, DESIGN, ARCHITECTURE if truly repo-wide)
- Everything else → `docs/` or appropriate subdirectory

## When to Use (Triggers)
- You need to add or update documentation for a feature, workflow, or pattern

## Acceptance Checks
- [ ] Existing docs reviewed and updated when possible (no duplication)
- [ ] New content placed under `docs/` (not cluttering root) unless truly repo‑wide
- [ ] Feature‑specific file naming used (not generic)
- [ ] Linked from README or parent doc (no orphans)
