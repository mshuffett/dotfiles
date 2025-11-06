---
description: Decide where information belongs (root vs guide vs repo docs) and how to escalate repeated mistakes. Includes placement tree, escalation ladder, and command creation guidelines.
---

# Memory Placement & Commands System

Quick reference for remembering things across Claude Code and Codex sessions.

## Core Decision Workflow (Placement)

### Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md** (or user-level `~/.claude/CLAUDE.md` if it applies to ALL projects)
- **NO** → Create a **command/prompt** with a description that triggers checking it

### Writing Triggering Descriptions

**The description field determines when you'll check this command.**

**Good pattern**: `"[Action] when [specific triggering condition]"`

**Examples that work**:
- `"Reference when you want to remember something across sessions"` ← This file
- `"Consult when stumped on hard problems or need extended reasoning"` ← /codex
- `"Deploy to production or development environments"` ← /deploy
- `"Reference for Linear task management workflows"` ← /linear-workflow

**Test**: Would you naturally think to check this command in that situation? If no, rewrite the description.

### Consultation Rule (Mandatory for procedures)
- Whenever a trigger condition applies (e.g., pre‑worktree, creating a PR, checking ports), you MUST consult the matching on‑demand guide/command and pass its acceptance checks before proceeding. If a suitable guide exists and is not consulted, log `guide.not_consulted` and stop.

## Memory Structure

**User-level** (`~/.claude/CLAUDE.md`):
- Personal preferences across ALL projects
- Symlinked at `~/.codex/AGENTS.md` for Codex

**Project-level** (`./CLAUDE.md`):
- Team-shared conventions (git-tracked)
- Symlinked at `./AGENTS.md` for Codex

## Commands Structure

**User-level**:
- `~/.claude/commands/*.md` - Claude Code commands
- `~/.codex/prompts/*.md` - Codex prompts (symlinked when identical)

**Project-level**:
- `.claude/commands/*.md` - Project-specific commands

**Symlinking Commands/Prompts**:
When a command and prompt are identical (like this file), symlink instead of copying:
```bash
ln -s ~/.claude/commands/name.md ~/.codex/prompts/name.md
```

## Creating Commands/Guides

### Command Format (Claude Code)

```yaml
---
description: [Action] when [triggering condition]
argument-hint: <what args this expects>
allowed-tools: Bash(pattern:*)  # Required for bash execution
model: haiku|sonnet|opus        # Optional: override default
---

# Command Body

Clear explanation of what this does and when to use it.

## Execution

Bash commands use `!` prefix:
!`your-command "$ARGUMENTS"`
```

### Prompt Format (Codex)

```yaml
---
description: [Action] when [triggering condition]
argument-hint: <what args this expects>
---

# Prompt Body

Pure text that gets sent to GPT-5.
Use $ARGUMENTS or $1, $2 for placeholders.
No bash execution - just text expansion.
```

## Writing Workflow

### To Remember a Fact or Pattern

1. **Ask**: Do I need this most of the time or might I make a mistake?
   - **YES** → Add to CLAUDE.md
   - **NO** → Continue to step 2

2. **Ask**: Can I describe a specific situation when I'd need this?
   - **YES** → Create a command with that situation as the description
   - **NO** → It might not need to be remembered, or reconsider step 1

3. **Ask**: Does this apply to ALL projects or just this one?
   - **ALL projects** → User-level (`~/.claude/CLAUDE.md` or `~/.claude/commands/`)
   - **This project** → Project-level (`./CLAUDE.md` or `.claude/commands/`)

### To Create a Procedural Workflow

1. **Write the triggering description**: When would you need this workflow?
2. **Choose location**: All projects (user-level) or project-specific?
3. **Write the workflow**: Step-by-step procedures
4. **Test the description**: Would you think to check this command in that situation?

## Checklist: Before Saving a Command/Guide

Use this checklist when creating or updating commands:

### Discoverability
- [ ] **Does the description trigger me to check this?** Would I naturally think of this command when I need it?
- [ ] **Is the description specific enough?** Does it include the situation/condition that triggers using it?
- [ ] **Does the description avoid being vague?** ("Helper", "Tool", "Utility" are too vague)
- [ ] **Can I test it?** Ask: "If I were in situation X, would this description make me check this command?"

### Red-Teaming
- [ ] **When might I need this but NOT think to check it?** Are there edge cases where the description won't trigger?
- [ ] **What similar situations might confuse me?** Could I mistakenly use this when I shouldn't?
- [ ] **Why might this memory throw me off?** Are there cases where following this advice would be wrong?
- [ ] **What are the failure modes?** When does this command's advice not apply?
- [ ] **Is there a better place for this?** Should this be in CLAUDE.md instead because I'll need it most of the time?
- [ ] **Does this work for both Claude Code and Codex?** If symlinked, does the content make sense for both systems without confusion?

### Technical
- [ ] **Is the location correct?** User-level for all projects, project-level for this project only
- [ ] **Does the body explain WHEN to use it?** Not just what it does, but when you'd need it
- [ ] **If using bash: Is `allowed-tools` declared?** Required for commands that execute bash
- [ ] **Does it avoid duplicating memory content?** Commands should reference rules by name, not copy them

## Key Principles

- **Memory is always loaded** - Commands apply filters to it
- **Descriptions are discovery** - They tell you when to use the command
- **Be specific**: "Deploy when ready for production" > "Deployment helper"
- **Think like a trigger**: What situation would make you want this information?

## Escalation Ladder (Mistakes)
- 0) Improve or create the relevant guide first (clear triggers, acceptance checks, quick path)
- 1) First recurrence → strengthen guide and add anti‑miss cues (e.g., “Before X, always do Y”)
- 2) Second recurrence in same repo (≤14 days) → add a one‑line Hot Rule to that repo’s agent file
- 3) Cross‑repo recurrence (≥2 repos in ≤14 days) → add a one‑line universal guardrail to root CLAUDE
- 4) Cooldown after 14–30 quiet days → propose removing one‑liners; guide remains canonical

## Argument Syntax

Both systems use identical placeholders:
- `$ARGUMENTS` - All arguments joined
- `$1`, `$2`, ... `$9` - Positional arguments
- `$NAME` or `NAME=value` - Named arguments

## Quick Memory Addition

### Using Claude Code
- `#` shortcut: Start message with `#` to add to memory
- `/memory` command: Opens memory file in editor

### Direct Editing
- Edit `CLAUDE.md` or `AGENTS.md` (same file via symlink)

## Viewing Current Memory Structure

To see all your memory and command files:

**User-level files**:
```bash
# Memory
ls -lh ~/.claude/CLAUDE.md
ls -la ~/.codex/AGENTS.md

# Commands/Prompts
ls ~/.claude/commands/
ls -la ~/.codex/prompts/
```

**Project-level files**:
```bash
# Memory
ls -lh ./CLAUDE.md ./AGENTS.md

# Commands
ls ./.claude/commands/
```

Or ask: "Can you tell me all the memory and command files we have?"

---

**Meta-note**: This command's description ("Reference when you want to remember something") should trigger you whenever you're thinking about remembering information across sessions.
