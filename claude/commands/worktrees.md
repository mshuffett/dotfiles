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
- [ ] Worktree path uses `.worktrees/` convention

## What are Git Worktrees?

Git worktrees allow you to have multiple branches checked out simultaneously in different directories. This is essential for:
- Working on multiple features in parallel
- Running multiple Claude instances on different features
- Keeping the main repository clean and stable
- Avoiding branch switching disruptions

## Standard Worktree Pattern

All projects use the `.worktrees/` directory (gitignored) for feature branches.

### Creating a Worktree

**CRITICAL: NEVER modify the main repository when creating a worktree (no git checkout, no git pull, no branch switching).**

The main repository may have active work, uncommitted changes, or be used by other Claude instances.

```bash
# From the main repository directory
# DO NOT checkout or pull - work with current state

# Create worktree with new branch directly (recommended)
git worktree add .worktrees/feature-name -b feature/descriptive-name

# OR create worktree from existing branch
git worktree add .worktrees/feature-name existing-branch-name

# Navigate to worktree BEFORE doing any git operations
cd .worktrees/feature-name

# NOW you can safely pull, merge, etc. in the worktree
git pull origin develop  # or whatever base branch you need

# Copy environment files if needed (they're not in git)
# Copy all .env files recursively from main repo to worktree
cp ../../.env .env 2>/dev/null || true
find ../../apps ../../packages -maxdepth 2 -name ".env.local" -o -name ".env.*.local" 2>/dev/null | while read file; do
  target="${file#../../}"
  cp "$file" "$target" 2>/dev/null || true
done

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set in .env.local (centralized credential)
# Note: Firebase service account key should be at ~/.config/firebase/service-account-key.json
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

### Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree when done
git worktree remove .worktrees/feature-name

# Prune stale worktree references
git worktree prune
```

### Cleanup After PR Merge

```bash
# Remove the worktree
git worktree remove .worktrees/feature-name

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
- Create worktrees with `git worktree add .worktrees/name -b branch-name` directly

## Project-Specific Examples

### waycraft-monorepo

```bash
# From main repository (DO NOT checkout or pull here)
# Create worktree with new branch directly
git worktree add .worktrees/audio-comm -b feature/audio-comm

# Navigate to worktree
cd .worktrees/audio-comm

# NOW safe to pull from base branch
git fetch origin main
git merge origin/main

# Setup environment
cp ../../orb-demo-next/.env.local orb-demo-next/.env.local
pnpm i
```

### vibe-coding-platform

```bash
# From main repo (DO NOT checkout or pull here)
# Create worktree with new branch directly
git worktree add .worktrees/sandbox -b feature/sandbox-improvements

# Navigate to worktree
cd .worktrees/sandbox

# NOW safe to pull from base branch
git fetch origin develop
git merge origin/develop

# Install dependencies
pnpm install
```

### everything-monorepo / container-ux-worktree

```bash
# Create worktree with new branch directly (recommended)
git worktree add .worktrees/feature-name -b feature-branch-name

# Or use an existing branch
git worktree add .worktrees/feature-name existing-branch-name

# Navigate to worktree before any other operations
cd .worktrees/feature-name
```

## Working with Issues

Standard pattern for GitHub issues:

```bash
# From main repository (DO NOT checkout or pull here)
# Create worktree with new branch directly
git worktree add .worktrees/issue-{number} -b feature/issue-{number}-brief-description

# Navigate to worktree
cd .worktrees/issue-{number}

# NOW safe to fetch and merge base branch
git fetch origin develop  # or main, depending on project
git merge origin/develop

# Copy .env files from main working directory (not from git)
cp ../../.env.local .env.local  # Use relative path

# Install dependencies
pnpm i
```

## Important Notes

- `.worktrees/` directory is gitignored
- Each worktree is an isolated working directory
- When working in a worktree, DO NOT edit files outside of that worktree unless explicitly asked
- Environment files (.env.local) are NOT in git - must copy manually from main working directory
- Always use full paths when copying .env files to avoid confusion
- The user will explicitly request work to be done in a specific worktree

## TODO List Tracking

**IMPORTANT: When creating a worktree, add it to the TODO list to track which worktree you're working in.**

```json
{
  "content": "Working in worktree: .worktrees/feature-name (branch: feature/branch-name)",
  "status": "in_progress",
  "activeForm": "Working in worktree .worktrees/feature-name"
}
```

This helps you:
- Remember which worktree you're working in
- Avoid committing to the wrong branch
- Track when to clean up the worktree

**When done with the worktree:**
```json
{
  "content": "Clean up worktree: .worktrees/feature-name",
  "status": "completed",
  "activeForm": "Cleaning up worktree .worktrees/feature-name"
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
