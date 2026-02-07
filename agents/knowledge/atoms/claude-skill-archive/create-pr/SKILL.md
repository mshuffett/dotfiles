---
name: Create Pull Request
description: Use when creating a PR, pushing to a feature branch for review, or about to run gh pr create. Covers conflict resolution, PR templates, and merge strategies.
---

# Create Pull Request

Use the `gh` CLI to create pull requests.

## Acceptance Checks
- [ ] Guide consulted (this file)
- [ ] Latest base merged locally and conflicts resolved
- [ ] Tests executed and passing
- [ ] Commit messages clear and relevant
- [ ] PR title/body prepared (or `--fill` used appropriately)

## Commands

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

## Best Practices

- Use `gh pr create --fill` to auto-populate from commits
- Include test results in PR description
- Reference related issues with `Fixes #123` or `Closes #456`
- For complex PRs, use `--web` to open browser for detailed formatting
- NEVER use `--squash` - maintain original commits with `gh pr merge 11 --merge --delete-branch`

## Merge Conflict Resolution

Always check for conflicts before creating the PR:

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

Key points:
1. Fetch and merge latest from base branch after pushing
2. Watch for formatter conflicts (Biome/Prettier) - these are common
3. Run tests after resolving conflicts
4. Push conflict resolution before notifying the user
