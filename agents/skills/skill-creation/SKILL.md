---
name: skill-creation
description: Use when creating a new entrypoint skill, adding reusable knowledge, or user says "remember this". Covers frontmatter, invocation control, subagent execution, and supporting files. Commit changes to dotfiles repo.
---

# Skill Creation

## Location

Canonical entrypoint skills live in the dotfiles repo:

```
~/.dotfiles/agents/skills/<skill-name>/SKILL.md
```

Compatibility:

- `~/.dotfiles/claude/skills/` is a symlink to `~/.dotfiles/agents/skills/`
- Claude Code discovers skills at `~/.claude/skills/` (symlinked to dotfiles on this machine)
- For Codex compatibility, the YAML frontmatter must include both `name:` and `description:`
- Repo-local skills (per-repo):
  - Codex CLI: `./skills/<skill-name>/SKILL.md` auto-loads
  - Claude Code: `./.claude/skills/<skill-name>/SKILL.md` is a repo-local skills directory
  - Claude Code auto-discovers nested `.claude/skills/` in subdirectories (monorepo support)
  - Skills from `--add-dir` directories are loaded automatically with live change detection

Deeper notes (atoms) live here:

```
~/.dotfiles/agents/knowledge/atoms/
```

## Decide: Entrypoint Skill vs Atom

Skill descriptions consume context budget (2% of context window, ~16K chars fallback). Too many skills can exceed this — run `/context` to check for warnings. Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var.

- Create an **entrypoint skill** when it should auto-load frequently and missing it would cause mistakes.
- Create an **atom** when it's detailed, rare, or only relevant after the entrypoint is triggered.
- If adding a new entrypoint pushes `agents/skills` above ~30, prefer consolidating or moving detail into atoms.

## Quick Creation

```bash
# 1. Create skill directory
mkdir -p ~/.dotfiles/agents/skills/<skill-name>

# 2. Write SKILL.md (see template below)

# 3. Commit to dotfiles
cd ~/.dotfiles && git add agents/skills/<skill-name> && git commit -m "feat(agents-skills): add <skill-name> entrypoint"
```

## SKILL.md Template

```markdown
---
name: my-skill
description: Use when <trigger conditions>. <What it provides/does>.
---

# Skill Title

<Core content - what Claude needs to know>

## Acceptance Checks

- [ ] <Verification criteria>
```

## Frontmatter Reference

All fields are optional. Only `description` is recommended.

| Field | Description |
|-------|-------------|
| `name` | Display name and `/slash-command`. Lowercase, numbers, hyphens only (max 64 chars). Defaults to directory name. |
| `description` | What the skill does and when to use it. Claude uses this for auto-invocation decisions. |
| `argument-hint` | Hint for autocomplete, e.g. `[issue-number]` or `[filename] [format]` |
| `disable-model-invocation` | `true` = only user can invoke via `/name`. Use for side-effect workflows (deploy, commit). |
| `user-invocable` | `false` = hidden from `/` menu. Use for background knowledge Claude should auto-load. |
| `allowed-tools` | Tools Claude can use without permission prompts when skill is active, e.g. `Read, Grep, Glob` |
| `model` | Model to use when skill is active |
| `context` | `fork` = run in isolated subagent context |
| `agent` | Subagent type when `context: fork` is set. Options: `Explore`, `Plan`, `general-purpose`, or custom agent name. |
| `hooks` | Hooks scoped to this skill's lifecycle |

### Invocation Control Matrix

| Frontmatter | User can invoke | Claude can invoke | Description in context |
|-------------|:-:|:-:|:-:|
| (default) | Yes | Yes | Yes |
| `disable-model-invocation: true` | Yes | No | No |
| `user-invocable: false` | No | Yes | Yes |

### String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking. If absent, args appended as `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` / `$N` | Specific argument by 0-based index (`$0` = first, `$1` = second) |
| `${CLAUDE_SESSION_ID}` | Current session ID |

### Dynamic Context Injection

`` !`command` `` runs shell commands before content is sent to Claude. Output replaces the placeholder.

```yaml
---
name: pr-summary
context: fork
agent: Explore
---

PR diff: !`gh pr diff`
Changed files: !`gh pr diff --name-only`

Summarize this pull request.
```

## Subagent Execution

Add `context: fork` to run a skill in an isolated subagent. The skill content becomes the subagent's task prompt. The subagent does NOT get the conversation history.

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

Only use `context: fork` for skills with explicit task instructions, not for reference/guideline skills.

## Description Rules

**Format**: Start with "Use when..." and include trigger conditions.

**Good**:
```yaml
description: Use when generating images. Choose provider based on quality needs.
description: Use when about to kill a port process. Never kill without asking.
```

**Bad**:
```yaml
description: Provides image generation guidance.  # No triggers
description: This skill helps with images.  # Vague
```

## Content Guidelines

1. **Keep SKILL.md under 500 lines** — move detailed reference to supporting files
2. **Imperative form** — "Run X" not "You should run X"
3. **Include acceptance checks** — how to verify correct execution
4. **Add code examples** with language specifiers

## Supporting Files

For complex skills, add supporting files in the skill directory:

```
skill-name/
├── SKILL.md           # Core instructions (required, <500 lines)
├── template.md        # Template for Claude to fill in
├── reference.md       # Detailed docs (loaded on demand)
├── examples/
│   └── sample.md      # Example output
└── scripts/
    └── helper.py      # Script Claude can execute
```

Reference them from SKILL.md:
```markdown
## References
- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples/](examples/)
```

## After Creation

Always commit new skills:

```bash
cd ~/.dotfiles
git add agents/skills/<skill-name>
git commit -m "feat(agents-skills): add <skill-name> entrypoint"
```

## Acceptance Checks

- [ ] Entrypoint skill created in `~/.dotfiles/agents/skills/<name>/SKILL.md` (or atom in `agents/knowledge/atoms/`)
- [ ] Frontmatter includes `name:` and `description:` (required for Codex compatibility)
- [ ] Description starts with "Use when..."
- [ ] Content uses imperative form
- [ ] SKILL.md under 500 lines (detail in supporting files)
- [ ] Committed to dotfiles repo
