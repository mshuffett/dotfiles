---
name: skill-creation
description: Use when creating a new entrypoint skill, adding reusable knowledge, or user says "remember this". Prefer atoms; keep entrypoint skills <= 20. Commit changes to dotfiles repo.
---

# Skill Creation

## Location

Canonical entrypoint skills live in the dotfiles repo:

```
~/.dotfiles/agents/skills/<skill-name>/SKILL.md
```

Compatibility:

- `~/.dotfiles/claude/skills/` is a symlink to `~/.dotfiles/agents/skills/`
- Claude Code may also have its own `~/.claude/skills/` discovery path depending on setup
- For Codex compatibility, the YAML frontmatter must include both `name:` and `description:`
- Repo-local skills (per-repo):
  - Codex CLI: `./skills/<skill-name>/SKILL.md` auto-loads (verified in `~/ws/notes` on 2026-02-08).
  - Claude Code: repo-local skills dir is not confirmed; observed auto-load path is global `~/.claude/skills/` (symlinked to dotfiles on this machine).

Deeper notes (atoms) live here:

```
~/.dotfiles/agents/knowledge/atoms/
```

## Decide: Entrypoint Skill vs Atom

Hops are expensive. Default to atoms unless the guidance is truly likely to be needed without prompting.

- Create an **entrypoint skill** when it should auto-load frequently and missing it would cause mistakes.
- Create an **atom** when it's detailed, rare, or only relevant after the entrypoint is triggered.

If adding a new entrypoint pushes `agents/skills` above ~20, prefer consolidating or moving detail into atoms.

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
description: Use when <trigger conditions>. <What it provides/does>.
---

# Skill Title

<Core content - what Claude needs to know>

## Acceptance Checks

- [ ] <Verification criteria>
```

## Frontmatter Rules

**Description format**: Start with "Use when..." and include:
- Trigger conditions (when should this skill load?)
- Key constraints or requirements
- Keep under 200 characters

**Good examples**:
```yaml
description: Use when generating images. Choose provider based on quality needs (Gemini Pro for best, OpenAI for fast).
description: Use when about to kill a port process. Never kill processes you didn't start without asking.
```

**Bad examples**:
```yaml
description: Provides image generation guidance.  # No triggers
description: This skill helps with images.  # Vague, no "Use when"
```

## Content Guidelines

1. **Keep it lean** - Target 500-2000 words
2. **Imperative form** - "Run X" not "You should run X"
3. **Include acceptance checks** - How to verify correct execution
4. **Add code examples** with language specifiers (```bash, ```python, etc.)

## Optional: Reference Files

For detailed content, add reference files:

```
skill-name/
├── SKILL.md           # Core content (always loaded)
├── references/        # Detailed docs (loaded on demand)
│   └── patterns.md
└── examples/          # Working examples
    └── sample.sh
```

Reference them in SKILL.md:
```markdown
## References
- `references/patterns.md` - Detailed patterns
```

## After Creation

Always commit new skills:

```bash
cd ~/.dotfiles
git add agents/skills/<skill-name>
git commit -m "feat(agents-skills): add <skill-name> entrypoint"
git push
```

## Acceptance Checks

- [ ] Entrypoint skill created in `~/.dotfiles/agents/skills/<name>/SKILL.md` (or atom created under `agents/knowledge/atoms/`)
- [ ] Description starts with "Use when..."
- [ ] Description under 200 characters
- [ ] Content uses imperative form
- [ ] Committed to dotfiles repo
