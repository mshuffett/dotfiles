# Memory Placement Decision: pnpm Preference

## Input

User statement: "Remember that I always prefer pnpm over npm across all my projects."

## Decision

**Store in: `~/.claude/CLAUDE.md` (user-level, Preferences section)**

## Reasoning

Applying the skill's decision tree:

**Q: Is this info needed MOST OF THE TIME when assisting?**
A: YES. Package manager preference applies to every project, every session. Without it, Claude would default to `npm` commands, causing repeated friction across all projects.

**Q: Will it cause mistakes if not present?**
A: YES. Missing this preference leads to consistently wrong commands (`npm install` instead of `pnpm install`, `npm run dev` instead of `pnpm dev`, etc.).

Both YES answers route directly to **CLAUDE.md** at the user level (not project level, since this preference applies across all projects — not just one repo).

## Target Location

```
~/.claude/CLAUDE.md
```

Specifically in the **Preferences** section, which already exists and already contains `pnpm` in a brief list. The existing entry reads:

> pnpm, Ultracite linter

This should be expanded to make the preference explicit and unambiguous:

> Always use pnpm over npm for package management across all projects.

Or augmented in the existing list:
> pnpm (always prefer over npm), Ultracite linter

## What Not to Do

- **Not a skill**: This is needed constantly, not triggered by specific context. A skill would add a hop cost and risk being missed.
- **Not a command**: This is a passive preference, not a user-invoked action.
- **Not project-scoped**: The user said "across all my projects", so project-level CLAUDE.md is wrong.
- **Not a log**: This is an active rule, not historical reference.

## Current State

The preference is already partially captured in `~/.claude/CLAUDE.md` under **Preferences**:
```
- Vercel AI SDK over provider SDKs; fetch docs via Context7 (never rely on memory)
- pnpm, Ultracite linter
```

The `pnpm` mention exists but is terse. It should be made explicit that this means "prefer pnpm over npm", not just that pnpm is used.

## Recommended Edit

In `~/.claude/CLAUDE.md`, update the Preferences section to make the pnpm preference explicit:

```markdown
- pnpm over npm for all package management (install, run, exec)
```
