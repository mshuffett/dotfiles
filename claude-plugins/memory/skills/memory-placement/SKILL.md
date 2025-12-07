---
name: Memory Placement
description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new command/procedure files. Provides decision tree for proper placement.
version: 0.1.0
---

# Memory Placement Guide

Quick reference for deciding where information should be stored across Claude sessions.

## Core Decision: Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md**
  - User-level: `~/.claude/CLAUDE.md` (all projects)
  - Project-level: `./CLAUDE.md` (this project)
- **NO** → Create a **command** or **skill** with a triggering description

## Placement Decision Tree

```
Is this info needed MOST OF THE TIME?
├── YES → CLAUDE.md (universal rules, guardrails)
└── NO → Is it procedural/runbook with clear trigger?
    ├── YES → Skill (auto-loaded when context matches)
    └── NO → Is it user-invoked action?
        ├── YES → Command (user types /command)
        └── NO → Is it repo-specific?
            ├── YES → Repo docs (README, docs/)
            └── NO → Is it third-party API?
                ├── YES → Fetch via Context7 (don't store)
                └── NO → Log file (historical reference)
```

## Summary by Type

| Type | Location | When to Use |
|------|----------|-------------|
| Universal rules | CLAUDE.md | Always needed, guardrails |
| Auto-loaded guidance | Skills (SKILL.md) | Procedural, triggered by context |
| User actions | Commands (.md) | Explicit /command invocation |
| Repo setup | README, docs/ | Project-specific |
| API docs | Context7 | External libraries |
| Historical | Log files | Learnings, mistakes |

## Skill vs Command

**Skills** (auto-loaded):
- Contextual knowledge loaded when Claude matches the description
- Good for: Safety protocols, best practices, domain knowledge
- Example: "Use when about to git stash..." → loads automatically

**Commands** (user-invoked):
- User explicitly types `/command` to invoke
- Good for: Actions, workflows, routines
- Example: `/morning` → user starts their day

## Writing Good Descriptions

**Pattern**: `"Use when [specific triggering condition]"`

**Good examples**:
- `"Use when about to run git stash"` ← triggers on git stash
- `"Use when killing processes on ports"` ← triggers on port operations
- `"Query PPV Notion system when user asks about tasks"` ← triggers on task questions

**Test**: Would Claude naturally think to load this in that situation?

## Creating New Items

1. **Decide type** using decision tree above
2. **Write description** that triggers appropriate loading
3. **If command**: Add to plugin's `commands/` directory
4. **If skill**: Create `skills/skill-name/SKILL.md`
5. **Update CLAUDE.md** if it's a frequently-needed reminder

## Before Editing CLAUDE.md

Checklist:
- [ ] Is this info needed MOST of the time? If no, use skill/command instead
- [ ] Will it cause mistakes if not present? If no, consider on-demand loading
- [ ] Is there an existing section it fits in?
- [ ] Commit dotfiles before editing
- [ ] Commit again after editing with clear message
