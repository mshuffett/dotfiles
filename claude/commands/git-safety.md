---
description: Never stash unfamiliar changes without asking. Lists safe workflow when encountering modified files; explains why stashing blindly is risky.
---

# Git Stash Safety Protocol

CRITICAL: NEVER use `git stash` on unfamiliar files without asking the user first.

## When to Use (Triggers)
- You see modified files you did not create in this session
- You are about to run commands that might require a clean working tree

## Acceptance Checks
- [ ] Guide consulted (this file)
- [ ] Modified files listed (`git status --porcelain`)
- [ ] Confirmation received from the user for unfamiliar files
- [ ] Chosen action documented in commit message or note

When encountering modified files:
1. STOP — Do not automatically stash.
2. Check — Are these files you modified during this session, or are they unfamiliar?
3. If unfamiliar — Ask: "There are modified files I'm not familiar with: [list files]. What would you like me to do?"
4. If familiar — Only then is it safe to stash.

Why this matters:
- The user may have uncommitted work in progress.
- Stashing can hide important changes.
- Always safer to ask than to assume.

Example safe workflow:
```bash
# DON'T do this automatically:
git stash && git pull && git stash pop

# DO this instead:
git status --porcelain
# List files and confirm next action with the user
```
