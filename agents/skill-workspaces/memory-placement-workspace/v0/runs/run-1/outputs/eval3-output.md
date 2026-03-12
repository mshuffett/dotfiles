# Eval 3 Output: Auth Token Expiry Discovery

## Decision

**Store this in the project's CLAUDE.md (Debugging/Auth section) AND as a project-local skill.**

---

## Reasoning via Decision Tree

**Step 1: Is this needed MOST of the time?**
No. Auth token expiry facts are only relevant when working on auth flows, not every task.
→ Route away from root CLAUDE.md

**Step 2: Does it auto-load based on context?**
Yes — any time auth, tokens, refresh, or login flows are being worked on in this project.
→ A **project-level skill** is appropriate.

**Step 3: Is it repo-specific?**
Yes. The endpoint `/api/auth/refresh` and the 30-minute expiry window are specific to this project.
→ Use project-local storage, not global dotfiles skills.

---

## Recommended Storage Location

### Primary: Project CLAUDE.md (Debugging section)

Add to the project's `CLAUDE.md` under a `## Auth / Token Behavior` or `## Debugging` section:

```markdown
## Auth Token Behavior

- Auth tokens expire after **30 minutes** (hard limit, discovered during debugging 2026-02-23)
- Refresh endpoint: `POST /api/auth/refresh`
- Always check token expiry when debugging auth-related failures
```

**Why CLAUDE.md?** This is a "gotcha" fact — easy to forget and likely to cause bugs on first occurrence. Per the escalation ladder: "First occurrence → Improve or create the relevant skill." Since there is no pre-existing auth skill for this project, and this is a high-risk miss (expired tokens will silently fail auth), placing it in project CLAUDE.md gives it L0 visibility.

### Alternative (if auth debugging recurs frequently): Project-local skill

Create `./.claude/skills/auth/SKILL.md`:

```markdown
---
name: auth
description: Use when debugging auth failures, token expiry, or working with /api/auth/* endpoints
---

# Auth Behavior

- Tokens expire after 30 minutes (hard limit)
- Refresh endpoint: POST /api/auth/refresh
- Check token age first when debugging 401 errors
```

---

## What NOT to do

- Do NOT put this in `~/.claude/CLAUDE.md` (user-global) — it's project-specific
- Do NOT put this in `~/.dotfiles/agents/skills/` — it's not cross-project knowledge
- Do NOT leave it undocumented — it will be re-discovered at cost each debugging session
- Do NOT put it in a log file only — log files are historical reference, not active guidance

---

## Summary

| Location | Rationale |
|---|---|
| Project `CLAUDE.md` (preferred) | First-occurrence gotcha; high miss-risk; project-specific |
| Project `.claude/skills/auth/SKILL.md` | If auth debugging becomes a recurring context |
| Project memory (`MEMORY.md`) | As a supplemental note for cross-session recall |
