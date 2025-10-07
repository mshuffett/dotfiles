---
description: CRITICAL - Git worktree workflow for parallel feature development. ALWAYS invoke this command BEFORE creating or working with worktrees to ensure you follow the correct pattern (uses .worktrees/ subdirectory, NOT sibling directories). Use whenever user asks about worktrees, parallel development, or creating feature branches. Documents the standard pattern used across multiple projects (vibe-coding-platform, waycraft-monorepo, everything-monorepo, container-ux-worktree, claude-chat-app).
---

# Git Worktrees - Parallel Feature Development

## What are Git Worktrees?

Git worktrees allow you to have multiple branches checked out simultaneously in different directories. This is essential for:
- Working on multiple features in parallel
- Running multiple Claude instances on different features
- Keeping the main repository clean and stable
- Avoiding branch switching disruptions

## Standard Worktree Pattern

All projects use the `.worktrees/` directory (gitignored) for feature branches.

### Creating a Worktree

```bash
# From the main repository directory (NOT already in a worktree)
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/descriptive-name

# Create worktree for the feature
git worktree add .worktrees/feature-name feature/descriptive-name

# Navigate to worktree
cd .worktrees/feature-name

# Copy environment files if needed (they're not in git)
cp ../../app-name/.env.local app-name/.env.local

# Install dependencies
pnpm install

# Work in the worktree, NOT the main repository
```

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

1. **NEVER modify the main branch directly** - Always create feature branches
2. **NEVER stash changes on the main branch** - This disrupts other agents' work
3. **ALWAYS use worktrees for feature development** - Keep the main repository clean
4. **CHECK before switching branches** - Use `git status` to ensure you won't lose work
5. **COMMUNICATE through commits** - Use clear commit messages so other agents understand changes

### Rules for Main Repository Directory

- Keep it on `main` branch whenever possible
- Don't make changes directly - use worktrees
- Don't stash changes here - it affects all agents
- If you must work here, create a feature branch first

## Project-Specific Examples

### waycraft-monorepo

```bash
# From main repository
git checkout main
git pull origin main
git checkout -b feature/audio-comm

# Create worktree
git worktree add .worktrees/audio-comm feature/audio-comm

# Navigate and setup
cd .worktrees/audio-comm
cp ../../orb-demo-next/.env.local orb-demo-next/.env.local
pnpm i
```

### vibe-coding-platform

```bash
# From main repo (NOT in worktree)
git checkout main
git pull origin main
git checkout -b feature/sandbox-improvements

# Create worktree
git worktree add .worktrees/sandbox feature/sandbox-improvements
cd .worktrees/sandbox
pnpm install
```

### everything-monorepo / container-ux-worktree

```bash
# Create worktree for a feature branch
git worktree add .worktrees/feature-name -b feature-branch-name

# Or use an existing branch
git worktree add .worktrees/feature-name existing-branch-name
```

## Working with Issues

Standard pattern for GitHub issues:

```bash
# From main repository
git checkout main
git pull origin main

# Create feature branch for the issue
git checkout -b feature/issue-{number}-brief-description

# Create worktree
git worktree add .worktrees/issue-{number} feature/issue-{number}-brief-description

# Navigate to worktree
cd .worktrees/issue-{number}

# Copy .env files from main working directory (not from git)
cp /full/path/to/main/repo/app/.env.local app/.env.local

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
