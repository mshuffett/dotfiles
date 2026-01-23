---
description: Always read this whenever working with git worktrees
---

# Git Worktrees - Parallel Feature Development

## When to Use (Triggers)
- Before creating or modifying any git worktree
- When working on parallel feature branches
- When asked to isolate work from the main repository

## Acceptance Checks

- [ ] All `.env*` files recursively copied to the worktree
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` env var set in `.env.local` (pointing to `~/.config/firebase/service-account-key.json`)
- [ ] Dependencies installed inside the worktree
- [ ] No git operations performed in the main repo (only inside worktree)
- [ ] Worktree created in sibling directory (not inside repo)

## What are Git Worktrees?

Git worktrees allow you to have multiple branches checked out simultaneously in different directories. This is essential for:
- Working on multiple features in parallel
- Running multiple Claude instances on different features
- Keeping the main repository clean and stable
- Avoiding branch switching disruptions

## Standard Worktree Pattern

**IMPORTANT: Create worktrees in a sibling directory, NOT inside the repo.**

### Why Sibling Directory?

Worktrees inside the repo (`.worktrees/`) have a problem: they get their own copy of CLAUDE.md and other config files at creation time, which become stale when the main repo is updated. This leads to:
- Outdated instructions in worktrees
- Broken references to renamed/moved files
- Inconsistent behavior between main repo and worktrees

**Solution:** Place worktrees in a sibling directory next to the repo:

```
~/ws/my-project/                    # Main repo
~/ws/my-project.worktrees/          # Worktrees directory (sibling)
  └── feature-auth/                 # Each worktree
  └── feature-api/
```

### Creating a Worktree

**CRITICAL: NEVER modify the main repository when creating a worktree (no git checkout, no git pull, no branch switching).**

The main repository may have active work, uncommitted changes, or be used by other Claude instances.

```bash
# From the main repository directory
# DO NOT checkout or pull - work with current state

# Get the repo name for the sibling directory
REPO_NAME=$(basename "$(pwd)")
WORKTREES_DIR="../${REPO_NAME}.worktrees"

# Create the worktrees directory if it doesn't exist
mkdir -p "$WORKTREES_DIR"

# Create worktree with new branch directly (recommended)
git worktree add "$WORKTREES_DIR/feature-name" -b feature/descriptive-name

# OR create worktree from existing branch
git worktree add "$WORKTREES_DIR/feature-name" existing-branch-name

# Navigate to worktree BEFORE doing any git operations
cd "$WORKTREES_DIR/feature-name"

# NOW you can safely pull, merge, etc. in the worktree
git pull origin develop  # or whatever base branch you need

# Copy environment files if needed (they're not in git)
# Note: paths are now to the sibling main repo
MAIN_REPO="../$REPO_NAME"
cp "$MAIN_REPO/.env" .env 2>/dev/null || true
find "$MAIN_REPO/apps" "$MAIN_REPO/packages" -maxdepth 2 \( -name ".env.local" -o -name ".env.*.local" \) 2>/dev/null | while read file; do
  target="${file#$MAIN_REPO/}"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target" 2>/dev/null || true
done

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set in .env.local (centralized credential)
if ! grep -q "GOOGLE_APPLICATION_CREDENTIALS" apps/web/.env.local 2>/dev/null; then
  echo '' >> apps/web/.env.local
  echo '# Firebase Admin SDK - Service Account' >> apps/web/.env.local
  echo 'GOOGLE_APPLICATION_CREDENTIALS="'$HOME'/.config/firebase/service-account-key.json"' >> apps/web/.env.local
fi

# Install dependencies
pnpm install

# Work in the worktree, NOT the main repository
```

**Why this matters:**
- Main repository may have uncommitted work
- Other Claude instances may be using it
- Switching branches in main disrupts active development
- Pulling in main can cause merge conflicts that affect everyone
- Worktrees in sibling directory don't have stale CLAUDE.md copies

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
# Remove the worktree
REPO_NAME=$(basename "$(pwd)")
git worktree remove "../${REPO_NAME}.worktrees/feature-name"

# Delete the feature branch
git branch -d feature/descriptive-name
```

## Critical Rules for Multi-Agent Environments

**MULTIPLE AGENTS MAY BE WORKING SIMULTANEOUSLY**

1. **NEVER modify the main repository when creating worktrees** - No checkout, no pull, no branch switching
2. **NEVER stash changes on the main repository** - This disrupts other agents' work
3. **ALWAYS use worktrees for feature development** - Keep the main repository clean
4. **NEVER checkout or pull in main repo** - Create worktree first, then pull inside it
5. **COMMUNICATE through commits** - Use clear commit messages so other agents understand changes

### Rules for Main Repository Directory

- **NEVER** run `git checkout` - it disrupts active work
- **NEVER** run `git pull` - may cause conflicts with uncommitted changes
- **NEVER** switch branches - use worktrees instead
- Don't make changes directly - use worktrees
- Don't stash changes here - it affects all agents
- Create worktrees in sibling directory with `git worktree add "../$(basename $(pwd)).worktrees/name" -b branch-name`

## Project-Specific Examples

### everything-monorepo

```bash
# From ~/ws/everything-monorepo (DO NOT checkout or pull here)
# Create worktree with new branch directly
git worktree add ../everything-monorepo.worktrees/feature-auth -b feature/auth-improvements

# Navigate to worktree
cd ../everything-monorepo.worktrees/feature-auth

# NOW safe to pull from base branch
git fetch origin develop
git merge origin/develop

# Setup environment
cp ../everything-monorepo/.env .env 2>/dev/null || true
cp ../everything-monorepo/apps/web/.env.local apps/web/.env.local 2>/dev/null || true
pnpm i
```

### waycraft-monorepo

```bash
# From main repository (DO NOT checkout or pull here)
git worktree add ../waycraft-monorepo.worktrees/audio-comm -b feature/audio-comm

# Navigate to worktree
cd ../waycraft-monorepo.worktrees/audio-comm

# NOW safe to pull from base branch
git fetch origin main
git merge origin/main

# Setup environment
cp ../waycraft-monorepo/orb-demo-next/.env.local orb-demo-next/.env.local
pnpm i
```

## Working with Issues

Standard pattern for GitHub issues:

```bash
# From main repository (DO NOT checkout or pull here)
REPO_NAME=$(basename "$(pwd)")
git worktree add "../${REPO_NAME}.worktrees/issue-{number}" -b feature/issue-{number}-brief-description

# Navigate to worktree
cd "../${REPO_NAME}.worktrees/issue-{number}"

# NOW safe to fetch and merge base branch
git fetch origin develop  # or main, depending on project
git merge origin/develop

# Copy .env files from main working directory
cp "../$REPO_NAME/.env.local" .env.local 2>/dev/null || true

# Install dependencies
pnpm i
```

## Important Notes

- Worktrees directory is a sibling to the main repo (e.g., `repo.worktrees/`)
- Each worktree is an isolated working directory
- When working in a worktree, DO NOT edit files outside of that worktree unless explicitly asked
- Environment files (.env.local) are NOT in git - must copy manually from main working directory
- Always use full paths when copying .env files to avoid confusion
- The user will explicitly request work to be done in a specific worktree

## Migrating from .worktrees/ (Legacy)

If you have existing worktrees inside the repo at `.worktrees/`:

```bash
# Option 1: Just use new pattern going forward
# Old worktrees will continue to work but may have stale configs

# Option 2: Move existing worktrees (if needed)
# First, note the branch each worktree is on
git worktree list

# Remove old worktree reference (keeps the files)
git worktree remove .worktrees/feature-name --force

# Re-add in new location
REPO_NAME=$(basename "$(pwd)")
git worktree add "../${REPO_NAME}.worktrees/feature-name" feature/branch-name
```

## TODO List Tracking

**IMPORTANT: When creating a worktree, add it to the TODO list to track which worktree you're working in.**

```json
{
  "content": "Working in worktree: ../repo.worktrees/feature-name (branch: feature/branch-name)",
  "status": "in_progress",
  "activeForm": "Working in worktree feature-name"
}
```

This helps you:
- Remember which worktree you're working in
- Avoid committing to the wrong branch
- Track when to clean up the worktree

**When done with the worktree:**
```json
{
  "content": "Clean up worktree: ../repo.worktrees/feature-name",
  "status": "completed",
  "activeForm": "Cleaning up worktree feature-name"
}
```

## When to Use Worktrees

**Use worktrees when:**
- User asks to work on a new feature
- Multiple features need parallel development
- You need to test changes without disrupting main branch
- Running multiple Claude instances on different features
- User explicitly mentions worktrees or parallel work

**Don't use worktrees when:**
- Making quick fixes on current branch
- User hasn't requested parallel development
- Working on a single feature that's already checked out
