---
description: Reference when you want to remember something across sessions, when deciding where to store learnings, or when creating new plugin content (skills, commands, agents).
---

# Memory Placement & Plugin System

Quick reference for remembering things across Claude Code sessions using the plugin-based architecture.

## Core Decision Workflow (Placement)

### Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md** (or user-level `~/.claude/CLAUDE.md` if it applies to ALL projects)
- **NO** → Create plugin content (skill or command) with a triggering description

## Plugin-Based Architecture

All persistent memory beyond CLAUDE.md lives in **plugins** at `~/.dotfiles/claude-plugins/`:

| Plugin | Purpose |
|--------|---------|
| `productivity` | PPV Notion, GTD, coaching, task management, Todoist |
| `dev` | Git, PR workflow, testing, ports, Linear, Context7 |
| `terminal` | Tmux, image viewing, themes, sounds |
| `media` | TTS, image generation, notifications |
| `claude-meta` | Session management, prototyping |
| `memory` | Docs, notes, mistakes, prompt engineering, configs |
| `misc` | Hammerspoon, Sphere mobile, specialized tools |

### Plugin Structure

```
~/.dotfiles/claude-plugins/<plugin>/
├── skills/           # Auto-loaded contextual knowledge
│   └── <skill-name>/
│       └── SKILL.md
├── commands/         # User-invoked actions (/command)
│   └── <command>.md
├── agents/           # Specialized subagents
└── scripts/          # Helper scripts
```

## Skill vs Command

**Skills** (auto-loaded):
- Contextual knowledge loaded when Claude matches the description
- Good for: Safety protocols, best practices, domain knowledge
- Example: "Use when about to git stash..." → loads automatically
- Location: `~/.dotfiles/claude-plugins/<plugin>/skills/<name>/SKILL.md`

**Commands** (user-invoked):
- User explicitly types `/plugin:command` or `/command` to invoke
- Good for: Actions, workflows, routines
- Example: `/morning` → user starts their day
- Example: `/todoist` → user works with Todoist tasks
- Location: `~/.dotfiles/claude-plugins/<plugin>/commands/<name>.md`

### Writing Triggering Descriptions

**Skill pattern**: `"Use when [specific triggering condition]"`
- `"Use when about to run git stash"` ← auto-loads on git stash
- `"Use when killing processes on ports"` ← auto-loads on port operations

**Command pattern**: `"[Action/Topic]. Use when [user intent]"`
- `"Todoist task management via REST API. Use when user asks to work with Todoist"`
- `"Create pull request. Use when user asks to create a PR"`

**Test**: Would Claude naturally think to load/use this in that situation?

## Placement Decision Tree

```
Is this info needed MOST OF THE TIME?
├── YES → CLAUDE.md (universal rules, guardrails)
└── NO → Does it auto-load based on context?
    ├── YES → Plugin Skill (skills/<name>/SKILL.md)
    └── NO → Is it user-invoked action?
        ├── YES → Plugin Command (commands/<name>.md)
        └── NO → Is it repo-specific?
            ├── YES → Project commands (<repo>/.claude/commands/)
            └── NO → Is it third-party API?
                ├── YES → Fetch via Context7 (don't store)
                └── NO → Log file (historical reference)
```

## Memory Structure

**User-level** (`~/.claude/CLAUDE.md`):
- Personal preferences across ALL projects
- Universal guardrails and rules

**Project-level** (`./CLAUDE.md`):
- Team-shared conventions (git-tracked)
- Project-specific patterns

**Plugins** (`~/.dotfiles/claude-plugins/`):
- Skills: Auto-loaded knowledge (safety, workflows, domain)
- Commands: User-invoked actions (/command)
- Agents: Specialized subagents for Task tool

## Creating Plugin Content

### Creating a Skill

1. Choose plugin from table above
2. Create directory: `~/.dotfiles/claude-plugins/<plugin>/skills/<skill-name>/`
3. Create `SKILL.md` with frontmatter:

```yaml
---
name: Skill Name
description: Use when [triggering condition]
version: 0.1.0
---

# Skill Content

Your skill content here...
```

### Creating a Command

1. Choose plugin from table above
2. Create: `~/.dotfiles/claude-plugins/<plugin>/commands/<command>.md`
3. Add frontmatter:

```yaml
---
description: [Action/Topic]. Use when [user intent]
argument-hint: <optional args>
allowed-tools: Bash(pattern:*)  # If bash execution needed
---

# Command Content

Your command content here...
```

### After Creating Content

1. **Commit to dotfiles immediately**:
```bash
cd ~/.dotfiles
git add claude-plugins/
git commit -m "Add <skill/command>: <description>"
```

2. **No need to update CLAUDE.md** - plugins are auto-discovered via their descriptions

## CLAUDE.md Editing Workflow

### Before ANY Edit to CLAUDE.md

**Pre-Edit Checklist:**
- [ ] **Read memory-placement skill** - Confirmed this belongs in CLAUDE.md
- [ ] **Answer: "Do I need this MOST OF THE TIME or might I make a mistake without it?"**
  - YES → Belongs in CLAUDE.md
  - NO → Create a skill or command instead
- [ ] **If it has trigger conditions** → Should probably be a skill
- [ ] **If it's step-by-step workflow** → Definitely should be a command
- [ ] **Commit dotfiles before editing**
- [ ] **Commit again after editing with clear message**

### Signs This Should Be Plugin Content Instead

- Has clear trigger conditions ("when doing X...")
- Step-by-step workflow or checklist
- Only needed in specific situations
- Contains detailed examples or templates
- Longer than 10-15 lines
- Domain-specific (API patterns, testing, deployment)

## Escalation Ladder (Mistakes)

1. **First occurrence** → Improve or create the relevant skill (clear triggers, acceptance checks)
2. **First recurrence** → Strengthen skill and add anti-miss cues
3. **Second recurrence in same repo (≤14 days)** → Add one-line Hot Rule to repo's CLAUDE.md
4. **Cross-repo recurrence (≥2 repos in ≤14 days)** → Add one-line guardrail to root CLAUDE.md
5. **Cooldown after 14-30 quiet days** → Propose removing one-liners; skill remains canonical

## Quick Commands

```bash
# List all plugins
ls ~/.dotfiles/claude-plugins/

# List skills in a plugin
ls ~/.dotfiles/claude-plugins/<plugin>/skills/

# List commands in a plugin
ls ~/.dotfiles/claude-plugins/<plugin>/commands/

# Check CLAUDE.md sizes
wc -c ~/.claude/CLAUDE.md ./CLAUDE.md

# Where plugins are symlinked
ls ~/.claude/plugins/marketplaces/local-plugins/plugins/
```

## Viewing Current Memory Structure

```bash
# User-level memory
cat ~/.claude/CLAUDE.md

# All plugins
ls -la ~/.dotfiles/claude-plugins/

# Skills in a specific plugin
ls ~/.dotfiles/claude-plugins/dev/skills/

# Commands in a specific plugin
ls ~/.dotfiles/claude-plugins/productivity/commands/
```

---

**Meta-note**: This command's description ("Reference when you want to remember something") should trigger you whenever you're thinking about remembering information across sessions or creating new plugin content.
