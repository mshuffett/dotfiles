# Plugin Audit & Consolidation Plan

**Started:** 2026-01-17
**Status:** In Progress

## Current State

### Marketplaces Configured
| Name | Source | Path |
|------|--------|------|
| claude-code-plugins | GitHub: anthropics/claude-code | ~/.claude/plugins/marketplaces/claude-code-plugins |
| claude-plugins-official | GitHub: anthropics/claude-plugins-official | ~/.claude/plugins/marketplaces/claude-plugins-official |
| local-plugins | Local directory | ~/.claude/plugins/marketplaces/local-plugins |

### Installed Plugins

**From claude-code-plugins (anthropics/claude-code):**
- claude-opus-4-5-migration (1.0.0)
- feature-dev (1.0.0)
- frontend-design (1.0.0)
- hookify (0.1.0)
- ralph-wiggum (1.0.0)
- plugin-dev (0.1.0)

**From claude-plugins-official (anthropics/claude-plugins-official):**
- Notion (0.1.0)
- swift-lsp (1.0.0)
- hookify (96276205880a) - DUPLICATE with claude-code-plugins!
- frontend-design (96276205880a) - DUPLICATE with claude-code-plugins!

**From local-plugins:**
- productivity (1.0.0)
- dev (1.0.0)
- terminal (1.0.0)
- media (1.0.0)
- claude-meta (1.0.0)
- memory (1.0.0)
- misc (1.0.0)
- ppv (unknown version)
- everything-loop (1.0.0)

## Issues Identified

1. **Duplicate plugins**: hookify and frontend-design installed from BOTH repos
2. **ralph-wiggum vs ralph-loop**: Need to compare code differences
3. **Local modifications**: Need to check if local ralph-wiggum has custom changes

## Tasks

- [ ] Compare ralph-wiggum (claude-code) vs ralph-loop (claude-plugins-official)
- [ ] Check local-plugins source for any ralph modifications
- [ ] Determine which duplicates to keep
- [ ] Document local plugin modifications
- [ ] Plan consolidation

---

## Progress Log

### 2026-01-17 - Initial Audit

**Finding 1:** Three marketplaces configured
- Two are GitHub-based (anthropic repos)
- One is local directory

**Finding 2:** Duplicate installations detected
- hookify: installed from both repos
- frontend-design: installed from both repos

---

### Ralph Plugin Comparison

**Three versions exist:**

| Version | Location | State Storage | Session Isolation | Author |
|---------|----------|---------------|-------------------|--------|
| **Local custom** | `~/.dotfiles/claude-plugins/ralph-wiggum/` | N/A (hardcoded paths) | N/A | Michael |
| **ralph-wiggum** | claude-code repo | `${PLUGIN_ROOT}/state/${SESSION_ID}.md` | Yes | Daisy Hollman |
| **ralph-loop** | claude-plugins-official | `.claude/ralph-loop.local.md` | No (project-local) | Anthropic |

**Key Differences:**

1. **Local custom version** - Completely different, hardcoded to Michael's setup:
   - References `~/ws/plan/ralph-overnight-prompt.md`
   - References `~/ws/plan/RALPH-INDEX.md`
   - No hooks/scripts - just simple command files
   - NOT a fork of upstream

2. **ralph-wiggum (claude-code)** - Full-featured:
   - Session isolation via session ID in state filename
   - Uses `${CLAUDE_PLUGIN_ROOT}` variables
   - Has hooks, scripts, help command
   - More sophisticated implementation

3. **ralph-loop (claude-plugins-official)** - Simpler:
   - Project-local state in `.claude/ralph-loop.local.md`
   - No session isolation
   - Slightly simplified hooks

**Verdict:** Local custom is NOT needed if using either upstream. The upstream `ralph-wiggum` is more feature-complete.

---

### 2026-01-17 - Local Plugin Inventory

**Local plugins source:** `~/.dotfiles/claude-plugins/`

| Plugin | Skills | Commands | Agents | Hooks | Marketplace Overlap |
|--------|--------|----------|--------|-------|---------------------|
| claude-meta | 0 | 7 | 0 | 0 | None |
| communication | 6 | 0 | 0 | 0 | None |
| dev | 8 | 3 | 0 | 0 | None |
| everything-loop | 2 | 3 | 7 | 3 | None |
| media | 2 | 3 | 0 | 0 | None |
| memory | 10 | 0 | 0 | 0 | None |
| misc | 4 | 0 | 0 | 0 | None |
| productivity | 15 | 12 | 2 | 0 | None |
| ralph-wiggum | 0 | 2 | 0 | 0 | **YES** (claude-code) |
| terminal | 5 | 2 | 0 | 0 | None |

**Total local content:** 52 skills, 37 commands, 9 agents, 3 hooks

---

### Recommendations

1. **Delete local ralph-wiggum** - It's a hardcoded custom version that's superseded by the proper upstream `ralph-wiggum@claude-code-plugins`

2. **Resolve duplicate installations:**
   - hookify: Keep only one (suggest claude-code-plugins since it's the source repo)
   - frontend-design: Keep only one (suggest claude-code-plugins)

3. **Consider converting plugins to standalone skills** - Skills in `~/.claude/skills/` auto-load without installation. This would simplify:
   - No `/plugin install` needed
   - Changes take effect immediately
   - Simpler structure

---

## Consolidation Strategy

### Option A: Keep Plugin Architecture (Current)
**Pros:** Commands and agents require plugins, good organization
**Cons:** Requires `/plugin install`, cache can get stale

### Option B: Hybrid Approach (Recommended)
1. **Skills** → Move to `~/.claude/skills/` (auto-load, no install)
2. **Commands/Agents/Hooks** → Keep as plugins (required)

### Immediate Actions

```bash
# 1. Remove local ralph-wiggum (using upstream instead)
rm -rf ~/.dotfiles/claude-plugins/ralph-wiggum

# 2. Uninstall duplicate plugins (keep claude-code-plugins versions)
# In Claude Code:
# /plugin uninstall hookify@claude-plugins-official
# /plugin uninstall frontend-design@claude-plugins-official

# 3. Verify ralph-wiggum@claude-code-plugins is installed
# /plugin install ralph-wiggum@claude-code-plugins
```

### Future Consideration: Standalone Skills Migration

Skills from local plugins that could be standalone:
- memory/* (10 skills) - pure documentation/instructions
- misc/* (4 skills) - pure documentation
- communication/* (6 skills) - if no command dependencies

Skills that need plugins (have commands/agents):
- productivity (has commands + agents)
- dev (has commands)
- everything-loop (has agents + hooks)
- media (has commands)
- terminal (has commands)
- claude-meta (has commands)

---

## Skill Loading Summary (from research)

**Auto-loading locations (no install needed):**
- `~/.claude/skills/` - Personal, all projects
- `.claude/skills/` - Project-specific, shared via git

**Plugin skills (require install):**
- Installed via `/plugin install`
- Cached in `~/.claude/plugins/cache/`

**Precedence:** Managed > Personal > Project > Plugin

