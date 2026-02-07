---
name: doc-placement
description: Use when adding or updating documentation; prefer updating existing content, put deep guides under docs/, use feature-specific names, link from parent docs.
---

# Documentation Placement

Before creating documentation:
1. Read the project README to see what docs exist.
2. Check if existing docs cover this topic - update them instead of creating new.
3. Place most docs in `docs/` - top-level is for meta/navigation only.
4. Use feature-specific names (e.g., `daily-checkin-implementation.md` not `IMPLEMENTATION.md`).
5. Link new docs from README or parent doc (no orphans).

**Top-level docs are for**:
- README, CLAUDE.md, CHANGELOG (meta/navigation)
- Major cross-cutting concerns (TESTING, DESIGN, ARCHITECTURE if truly repo-wide)
- Everything else goes in `docs/` or appropriate subdirectory

## Acceptance Checks
- [ ] Existing docs reviewed and updated when possible (no duplication)
- [ ] New content placed under `docs/` unless truly repo-wide
- [ ] Feature-specific file naming used (not generic)
- [ ] Linked from README or parent doc (no orphans)
