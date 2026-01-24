---
name: Git Stash Safety
description: Use when about to run "git stash", encountering modified files you didn't create, or working with git operations that require a clean working tree.
version: 0.1.0
---

# Git Stash Safety Protocol

CRITICAL: NEVER use `git stash` on unfamiliar files without asking the user first.

## Safe Workflow

When encountering modified files:

1. **STOP** - Do not automatically stash.
2. **Check** - Are these files you modified during this session, or are they unfamiliar?
3. **If unfamiliar** - Ask: "There are modified files I'm not familiar with: [list files]. What would you like me to do?"
4. **If familiar** - Only then is it safe to stash.

## Acceptance Checks

- [ ] Modified files listed (`git status --porcelain`)
- [ ] Confirmation received from the user for unfamiliar files
- [ ] Chosen action documented in commit message or note

## Why This Matters

- The user may have uncommitted work in progress.
- Stashing can hide important changes.
- Always safer to ask than to assume.

## Example

```bash
# DON'T do this automatically:
git stash && git pull && git stash pop

# DO this instead:
git status --porcelain
# List files and confirm next action with the user
```
