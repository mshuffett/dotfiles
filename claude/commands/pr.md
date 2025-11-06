---
description: Pull request workflow using gh; verifies conflicts and tests locally before creating a PR. Includes best practices and example commands.
---

# Pull Requests

When asked to create a pull request, use the `gh` command.

## When to Use (Triggers)
- You are ready to open a PR for a branch and want it reviewed/merged
- The branch is up to date locally and tests pass

## Acceptance Checks
- [ ] Guide consulted (this file)
- [ ] Latest base merged locally and conflicts resolved
- [ ] Tests executed and passing
- [ ] Commit messages clear and relevant
- [ ] PR title/body prepared (or `--fill` used appropriately)

Commands:
```bash
# Create PR with interactive prompts
gh pr create

# Create PR with title and body
gh pr create --title "Title" --body "Description"

# Create PR filling from template
gh pr create --fill

# Create PR to specific base branch
gh pr create --base develop --head feature-branch
```

Best practices:
- Use `gh pr create --fill` to auto-populate from commits.
- Include test results in PR description.
- Reference related issues with `Fixes #123` or `Closes #456`.
- For complex PRs, use `--web` to open browser for detailed formatting.
- NEVER use `--squash` — maintain original commits with `gh pr merge 11 --merge --delete-branch`.

IMPORTANT: Always check for merge conflicts before creating PR:
1. After creating a PR branch and pushing, fetch and merge latest from base branch.
2. Resolve any conflicts before the PR is created.
3. Check for conflicts caused by formatters (Biome/Prettier) — these are common.
4. Run tests after resolving conflicts to ensure everything still works.
5. Push the conflict resolution before notifying the user.

Example workflow:
```bash
# After pushing your branch
git fetch origin develop
git merge origin/develop
# Resolve conflicts if any
git add -A && git commit -m "Resolve merge conflicts"
git push
# Now create PR
gh pr create --base develop ...
```
