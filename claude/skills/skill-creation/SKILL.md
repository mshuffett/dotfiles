---
description: Use when creating a new skill, adding reusable knowledge, or user says "remember this as a skill". Creates skills in ~/.dotfiles/claude/skills/ and commits to dotfiles repo.
---

# Skill Creation

## Location

All skills live in the dotfiles repo:

```
~/.dotfiles/claude/skills/<skill-name>/SKILL.md
```

This directory is symlinked to `~/.claude/skills/` for Claude Code to discover.

## Quick Creation

```bash
# 1. Create skill directory
mkdir -p ~/.dotfiles/claude/skills/<skill-name>

# 2. Write SKILL.md (see template below)

# 3. Commit to dotfiles
cd ~/.dotfiles && git add claude/skills/<skill-name> && git commit -m "feat(skills): add <skill-name> skill"
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
git add claude/skills/<skill-name>
git commit -m "feat(skills): add <skill-name> skill"
git push
```

## Acceptance Checks

- [ ] Skill created in `~/.dotfiles/claude/skills/<name>/SKILL.md`
- [ ] Description starts with "Use when..."
- [ ] Description under 200 characters
- [ ] Content uses imperative form
- [ ] Committed to dotfiles repo
