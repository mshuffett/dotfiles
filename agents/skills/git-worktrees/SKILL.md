---
name: git-worktrees
description: Use when creating, modifying, or managing git worktrees, working on parallel feature branches, or isolating work from the main repository.
---

# Git Worktrees - Parallel Feature Development

## Acceptance Checks

- [ ] All `.env*` files recursively copied to the worktree
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` env var set in `.env.local` (pointing to `~/.config/firebase/service-account-key.json`)
- [ ] Dependencies installed inside the worktree
- [ ] No git operations performed in the main repo (only inside worktree)
- [ ] Worktree created in sibling directory (not inside repo)

## What are Git Worktrees?

Git worktrees allow multiple branches checked out simultaneously in different directories. Essential for:
- Working on multiple features in parallel
- Running multiple Claude instances on different features
- Keeping the main repository clean and stable
- Avoiding branch switching disruptions

## Standard Worktree Pattern

**CRITICAL: Create worktrees in a sibling directory, NOT inside the repo.**

### Why Sibling Directory?

Worktrees inside the repo (`.worktrees/`) get their own copy of CLAUDE.md at creation time, which becomes stale. Place worktrees in a sibling directory:

```
~/ws/my-project/                    # Main repo
~/ws/my-project.worktrees/          # Worktrees directory (sibling)
  └── feature-auth/
  └── feature-api/
```

### Creating a Worktree

**CRITICAL: NEVER modify the main repository when creating a worktree (no git checkout, no git pull, no branch switching).**

```bash
# From the main repository directory - DO NOT checkout or pull

# Get the repo name for the sibling directory
REPO_NAME=$(basename "$(pwd)")
WORKTREES_DIR="../${REPO_NAME}.worktrees"
mkdir -p "$WORKTREES_DIR"

# Create worktree with new branch (recommended)
git worktree add "$WORKTREES_DIR/feature-name" -b feature/descriptive-name

# OR from existing branch
git worktree add "$WORKTREES_DIR/feature-name" existing-branch-name

# Navigate to worktree BEFORE any git operations
cd "$WORKTREES_DIR/feature-name"

# NOW safe to pull, merge, etc.
git pull origin develop

# Copy environment files (not in git)
MAIN_REPO="../$REPO_NAME"
cp "$MAIN_REPO/.env" .env 2>/dev/null || true
find "$MAIN_REPO/apps" "$MAIN_REPO/packages" -maxdepth 2 \( -name ".env.local" -o -name ".env.*.local" \) 2>/dev/null | while read file; do
  target="${file#$MAIN_REPO/}"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target" 2>/dev/null || true
done

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set
if ! grep -q "GOOGLE_APPLICATION_CREDENTIALS" apps/web/.env.local 2>/dev/null; then
  echo '' >> apps/web/.env.local
  echo '# Firebase Admin SDK - Service Account' >> apps/web/.env.local
  echo 'GOOGLE_APPLICATION_CREDENTIALS="'$HOME'/.config/firebase/service-account-key.json"' >> apps/web/.env.local
fi

# Install dependencies
pnpm install
```

### Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree when done
REPO_NAME=$(basename "$(pwd)")
git worktree remove "../${REPO_NAME}.worktrees/feature-name"

# Prune stale worktree references
git worktree prune
```

### Cleanup After PR Merge

```bash
REPO_NAME=$(basename "$(pwd)")
git worktree remove "../${REPO_NAME}.worktrees/feature-name"
git branch -d feature/descriptive-name
```

## Critical Rules for Multi-Agent Environments

**MULTIPLE AGENTS MAY BE WORKING SIMULTANEOUSLY**

1. **NEVER modify the main repository when creating worktrees** - No checkout, no pull, no branch switching
2. **NEVER stash changes on the main repository** - Disrupts other agents' work
3. **ALWAYS use worktrees for feature development** - Keep main repository clean
4. **NEVER checkout or pull in main repo** - Create worktree first, then pull inside it
5. **COMMUNICATE through commits** - Use clear commit messages

### Rules for Main Repository Directory

- **NEVER** run `git checkout` - disrupts active work
- **NEVER** run `git pull` - may cause conflicts with uncommitted changes
- **NEVER** switch branches - use worktrees instead
- Don't make changes directly - use worktrees
- Don't stash changes - affects all agents
- Create worktrees: `git worktree add "../$(basename $(pwd)).worktrees/name" -b branch-name`

## Working with Issues

```bash
# From main repository (DO NOT checkout or pull)
REPO_NAME=$(basename "$(pwd)")
git worktree add "../${REPO_NAME}.worktrees/issue-{number}" -b feature/issue-{number}-brief-description

cd "../${REPO_NAME}.worktrees/issue-{number}"

# NOW safe to fetch and merge
git fetch origin develop
git merge origin/develop

cp "../$REPO_NAME/.env.local" .env.local 2>/dev/null || true
pnpm i
```

## Task Tracking

When creating a worktree, add it to the TODO list:

```json
{
  "content": "Working in worktree: ../repo.worktrees/feature-name (branch: feature/branch-name)",
  "status": "in_progress",
  "activeForm": "Working in worktree feature-name"
}
```

When done:
```json
{
  "content": "Clean up worktree: ../repo.worktrees/feature-name",
  "status": "completed"
}
```

## When to Use Worktrees

**Use when:**
- User asks to work on a new feature
- Multiple features need parallel development
- Testing changes without disrupting main branch
- Running multiple Claude instances on different features
- User explicitly mentions worktrees or parallel work

**Don't use when:**
- Making quick fixes on current branch
- User hasn't requested parallel development
- Working on a single feature already checked out

