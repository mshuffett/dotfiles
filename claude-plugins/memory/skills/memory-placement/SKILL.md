---
name: Memory Placement
description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new plugin content (skills, commands, agents).
version: 0.2.0
---

# Memory Placement Guide

Quick reference for deciding where information should be stored across Claude sessions.

## Core Decision: Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md**
  - User-level: `~/.claude/CLAUDE.md` (all projects)
  - Project-level: `./CLAUDE.md` (this project)
- **NO** → Create a **skill** or **command** in a plugin

## Plugin-Based Architecture

All persistent memory beyond CLAUDE.md lives in **plugins** at `~/.dotfiles/claude-plugins/`:

```
~/.dotfiles/claude-plugins/
├── productivity/     # PPV, GTD, task management
├── dev/              # Git, PR, testing, Linear
├── media/            # TTS, images, notifications
├── memory/           # This plugin - docs, notes, configs
├── terminal/         # Tmux, themes, sounds
├── claude-meta/      # Session management, prototyping
└── misc/             # Specialized tools
```

Each plugin contains:
- `skills/` - Auto-loaded contextual knowledge
- `commands/` - User-invoked actions (/command)
- `agents/` - Specialized subagents
- `scripts/` - Helper scripts

## Placement Decision Tree

```
Is this info needed MOST OF THE TIME?
├── YES → CLAUDE.md (universal rules, guardrails)
└── NO → Does it auto-load based on context?
    ├── YES → Skill (plugin/skills/name/SKILL.md)
    └── NO → Is it user-invoked action?
        ├── YES → Command (plugin/commands/name.md)
        └── NO → Is it repo-specific?
            ├── YES → Project commands (<repo>/.claude/commands/)
            └── NO → Is it third-party API?
                ├── YES → Fetch via Context7 (don't store)
                └── NO → Log file (historical reference)
```

## Summary by Type

| Type | Location | When to Use |
|------|----------|-------------|
| Universal rules | CLAUDE.md | Always needed, guardrails |
| Auto-loaded guidance | Plugin skills | Procedural, triggered by context |
| User actions | Plugin commands | Explicit /command invocation |
| Repo patterns | Project .claude/commands/ | Project-specific workflows |
| API docs | Context7 | External libraries (fetch on demand) |
| Historical | Log files | Learnings, mistakes |

## Skill vs Command

**Skills** (auto-loaded):
- Contextual knowledge loaded when Claude matches the description
- Good for: Safety protocols, best practices, domain knowledge
- Location: `~/.dotfiles/claude-plugins/<plugin>/skills/<skill-name>/SKILL.md`
- Example: "Use when about to git stash..." → loads automatically

**Commands** (user-invoked):
- User explicitly types `/plugin:command` or `/command` to invoke
- Good for: Actions, workflows, routines
- Location: `~/.dotfiles/claude-plugins/<plugin>/commands/<command>.md`
- Example: `/morning` → user starts their day
- Example: `/todoist` → user wants to work with Todoist tasks

## Writing Good Skill Descriptions

**Pattern**: `"Use when [specific triggering condition]"`

**Good examples**:
- `"Use when about to run git stash"` ← triggers on git stash
- `"Use when killing processes on ports"` ← triggers on port operations
- `"Use when user says 'remember this' or deciding where to store learnings"` ← triggers on memory decisions

**Test**: Would Claude naturally think to load this in that situation?

## Writing Good Command Descriptions

**Pattern**: `"[Action] when [user intent or request]"`

**Good examples**:
- `"Todoist task management via REST API. Use when user asks to work with Todoist tasks"`
- `"Create pull request workflow. Use when user asks to create a PR"`
- `"Morning routine. Use when user starts their day or says /morning"`

## Creating New Plugin Content

1. **Decide type** using decision tree above
2. **Choose plugin** from the table (productivity, dev, media, etc.)
3. **Write description** that triggers appropriate loading/discovery
4. **Create file**:
   - Skill: `~/.dotfiles/claude-plugins/<plugin>/skills/<name>/SKILL.md`
   - Command: `~/.dotfiles/claude-plugins/<plugin>/commands/<name>.md`
5. **Commit to dotfiles** immediately

## Before Editing CLAUDE.md

Checklist:
- [ ] Is this info needed MOST of the time? If no, use skill/command instead
- [ ] Will it cause mistakes if not present? If no, consider on-demand loading
- [ ] Is there an existing section it fits in?
- [ ] Commit dotfiles before editing
- [ ] Commit again after editing with clear message

## Quick Reference: Plugin Locations

```bash
# List all plugins
ls ~/.dotfiles/claude-plugins/

# List skills in a plugin
ls ~/.dotfiles/claude-plugins/dev/skills/

# List commands in a plugin
ls ~/.dotfiles/claude-plugins/productivity/commands/

# Where plugins are symlinked
ls ~/.claude/plugins/marketplaces/local-plugins/plugins/
```
