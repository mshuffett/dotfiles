---
name: git-worktrees
description: Use when creating, modifying, or managing git worktrees, working on parallel feature branches, or isolating work from the main repository.
---

# Git Worktrees - Parallel Feature Development

## Acceptance Checks

- [ ] Worktree created in `worktrees/<name>/` inside the repo (harness keeps cwd stable there)
- [ ] `worktrees/` listed in `.gitignore`
- [ ] All `.env*` files recursively copied to the worktree
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` env var set in `.env.local` if the project uses Firebase Admin
- [ ] Dependencies installed inside the worktree
- [ ] No git operations performed in the main repo (only inside worktree)

## What are Git Worktrees?

Git worktrees allow multiple branches checked out simultaneously in different directories. Essential for:
- Working on multiple features in parallel
- Running multiple Claude instances on different features
- Keeping the main repository clean and stable
- Avoiding branch switching disruptions

## Standard Worktree Pattern

**Place worktrees in `worktrees/<name>/` inside the repo.**

### Why Inside the Repo?

Agent harnesses (Claude Code, etc.) often reset `cwd` to the project root between commands when you `cd` to a sibling path outside the repo. That breaks multi-command workflows that assume persistent cwd. Placing worktrees at `<repo>/worktrees/<name>/` keeps cwd stable because it's still inside the project root.

The old concern — "inside-repo worktrees freeze a stale CLAUDE.md" — applies to any worktree regardless of location (each worktree checks out its branch's version of CLAUDE.md). It's not a reason to prefer sibling directories.

Layout:

```
~/ws/my-project/
├── (main checkout)
└── worktrees/
    ├── feature-auth/
    └── feature-api/
```

Add `worktrees/` to `.gitignore` in the main repo so the directory itself is never committed.

### Creating a Worktree

**NEVER modify the main repository when creating a worktree (no git checkout, no git pull, no branch switching).**

```bash
# From the main repository directory - DO NOT checkout or pull in the main repo

mkdir -p worktrees

# Create worktree with new branch (recommended)
git worktree add worktrees/feature-name -b feature/descriptive-name

# OR from an existing branch
git worktree add worktrees/feature-name existing-branch-name

# OR from main explicitly
git worktree add worktrees/feature-name -b feature/descriptive-name main

# Navigate to worktree BEFORE any further git operations
cd worktrees/feature-name

# NOW safe to pull, merge, etc.
git pull origin main

# Copy environment files (not in git). Paths are relative to the main repo root.
MAIN_REPO="../.."
cp "$MAIN_REPO/.env" .env 2>/dev/null || true
find "$MAIN_REPO/apps" "$MAIN_REPO/packages" -maxdepth 2 \( -name ".env.local" -o -name ".env.*.local" \) 2>/dev/null | while read file; do
  target="${file#$MAIN_REPO/}"
  mkdir -p "$(dirname "$target")"
  cp "$file" "$target" 2>/dev/null || true
done

# Install dependencies (project-appropriate)
pnpm install  # or: npm install / cargo fetch / uv sync — whatever the repo uses
```

### Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree when done (run from the main repo)
git worktree remove worktrees/feature-name

# Prune stale worktree references
git worktree prune
```

### Cleanup After PR Merge

```bash
git worktree remove worktrees/feature-name
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
- Create worktrees: `git worktree add worktrees/<name> -b <branch-name>`

## Working with Issues

```bash
# From main repository (DO NOT checkout or pull in the main repo)
git worktree add worktrees/issue-{number} -b feature/issue-{number}-brief-description
cd worktrees/issue-{number}

# NOW safe to fetch and merge
git fetch origin main
git merge origin/main

cp ../../.env.local .env.local 2>/dev/null || true
pnpm i
```

## Task Tracking

When creating a worktree, add it to the TODO list:

```json
{
  "content": "Working in worktree: worktrees/feature-name (branch: feature/branch-name)",
  "status": "in_progress",
  "activeForm": "Working in worktree feature-name"
}
```

When done:
```json
{
  "content": "Clean up worktree: worktrees/feature-name",
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
