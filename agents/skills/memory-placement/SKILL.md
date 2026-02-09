---
name: memory-placement
description: Use when user says "remember this", when deciding where to store learnings or documentation, when about to edit CLAUDE.md, or when creating new plugin content (skills, commands, agents). Routes info to CLAUDE.md, skills, commands, or logs.
---

# Memory Placement Guide

Quick reference for deciding where information should be stored across Claude sessions.

## Progressive Disclosure (Hop Cost)

Each additional "hop" (need to notice a skill, then open it, then open a referenced doc) adds time and increases the risk the instruction is missed.

Use hop cost intentionally:

- Put only universal guardrails in `CLAUDE.md` (L0)
- Keep `agents/skills/*/SKILL.md` as a small set of entrypoints (L1)
- Put deeper specifics in referenced notes (L2+) and promote them upward only when they prove high-risk or frequently missed

## Semantic Recall (Search Prior Conversations)

If you're stuck, repeating a failure mode, or suspect "I've solved this before", search conversation history semantically before inventing a new approach:

```bash
agent-recall search "<query>"
```

This is cross-runtime and can pull from both Claude and Codex histories (depending on what's present locally).

## Subagents, Tasks, and Context Management

Delegation can reduce time-to-correctness, but it can also create context fragmentation.

Metacognitive checks:

- Prefer a single thread when shared state is high (many coupled files, tricky invariants, complex verification).
- Delegate when work is separable (research, codebase mapping, isolated implementation) and you can verify the output independently.
- Before dispatching a subagent, write down the minimal handoff context (goal, constraints, current findings, relevant files, acceptance checks) so it doesn't guess.
- Use a persistent artifact (plan note / atom / task list) to avoid losing intermediate decisions across threads.

## Core Decision: Where Should This Go?

**Ask yourself**: "Do I need this most of the time when assisting, or might I make a mistake without it?"

- **YES** → Put it in **CLAUDE.md**
  - User-level: `~/.claude/CLAUDE.md` (all projects)
  - Project-level: `./CLAUDE.md` (this project)
- **NO** → Create a **skill** or **command** in a plugin

## Where This Repo Stores Skills / Knowledge

- **Entrypoint skills (cross-runtime)**: `~/.dotfiles/agents/skills/` (canonical)
  - Compatibility: `~/.dotfiles/claude/skills/` is a symlink to `~/.dotfiles/agents/skills/`
- **Deeper notes (atoms)**: `~/.dotfiles/agents/knowledge/atoms/`
  - User profile (operational defaults): `~/.dotfiles/agents/knowledge/atoms/michael-user-info.md`
- **Repo-local skills (per-repo)**:
  - Codex CLI: `./skills/<skill-name>/SKILL.md` auto-loads (verified in `~/ws/notes` on 2026-02-08).
  - Claude Code: `./.claude/skills/<skill-name>/SKILL.md` is a repo-local skills directory (verified in `~/ws/notes` on 2026-02-08 via `claude -p --setting-sources project`).
  - Claude Code (global): `~/.claude/skills/` also exists on this machine (symlinked to dotfiles).
  - If you want one source of truth for both tools, keep the canonical skill under `./skills/` and keep `./.claude/skills/` in sync (or symlink when your environment allows).

## Claude Plugin Architecture (Separate System)

Persistent memory beyond CLAUDE.md lives in **plugins** at `~/.dotfiles/claude-plugins/`. Each plugin contains: `skills/`, `commands/`, `agents/`, `scripts/`

| Plugin | Purpose |
|--------|---------|
| `productivity` | PPV Notion, GTD, coaching, Todoist |
| `dev` | Git, PR workflow, testing, ports, Linear |
| `media` | TTS, image generation, notifications |
| `memory` | Docs, notes, mistakes, configs |
| `terminal` | Tmux, image viewing, themes, sounds |
| `claude-meta` | Session management, prototyping |
| `misc` | Hammerspoon, Sphere, specialized tools |

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
- Loaded when Claude matches the description
- Good for: Safety protocols, best practices, domain knowledge
- Locations:
  - Entrypoints: `~/.dotfiles/agents/skills/<name>/SKILL.md`
  - Claude plugin skills: `~/.dotfiles/claude-plugins/<plugin>/skills/<name>/SKILL.md`

**Commands** (user-invoked):
- User types `/plugin:command` or `/command`
- Good for: Actions, workflows, routines
- Location: `~/.dotfiles/claude-plugins/<plugin>/commands/<name>.md`

## Writing Good Descriptions

**Skills**: `"Use when [specific triggering condition]"`
- `"Use when about to run git stash"`
- `"Use when killing processes on ports"`

**Commands**: `"[Action] when [user intent]"`
- `"Todoist task management. Use when user asks to work with Todoist"`
- `"Morning routine. Use when user starts their day"`

**Test**: Would Claude naturally think to load this in that situation?

## Creating New Plugin Content

```bash
# 1. Decide type using decision tree above
# 2. Choose plugin (productivity, dev, media, terminal, etc.)
# 3. Create file with good description:

# Skill
mkdir -p ~/.dotfiles/claude-plugins/<plugin>/skills/<name>
# Write SKILL.md with frontmatter

# Command
# Write ~/.dotfiles/claude-plugins/<plugin>/commands/<name>.md

# 4. Commit to dotfiles immediately
```

## Before Editing CLAUDE.md

Checklist:
- [ ] Is this info needed MOST of the time? If no, use skill/command instead
- [ ] Will it cause mistakes if not present? If no, consider on-demand loading
- [ ] Is there an existing section it fits in?
- [ ] Commit dotfiles before and after editing

## Escalation Ladder for Mistakes

1. **First occurrence** → Improve or create the relevant skill
2. **First recurrence** → Strengthen skill and add anti-miss cues
3. **Second recurrence in same repo (14 days)** → Add one-line Hot Rule to repo's CLAUDE.md
4. **Cross-repo recurrence (2+ repos in 14 days)** → Add one-line guardrail to root CLAUDE.md
5. **Cooldown after 14-30 quiet days** → Propose removing one-liners; skill remains canonical

## Acceptance Checks

- [ ] Information routed to correct location per decision tree
- [ ] CLAUDE.md only contains universal rules/guardrails
- [ ] New skills have "Use when..." descriptions
- [ ] Changes committed to dotfiles repo
