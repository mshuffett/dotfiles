# Skill Migration Subagent Prompt

## Task

Migrate a skill from `~/.dotfiles/claude-plugins/<plugin>/skills/<skill-name>/SKILL.md` to `~/.claude/skills/<new-name>/SKILL.md`.

## Source Skill

**File path**: `{SOURCE_PATH}`

## Instructions

1. **Read the source skill** completely

2. **Determine the new name**:
   - Use descriptive kebab-case that describes what the skill provides/manages
   - Avoid tool names (e.g., `context7` → `library-docs`)
   - Keep concise but clear (2-3 words max)

3. **Improve the frontmatter**:
   - Description MUST start with "Use when..."
   - Include key constraints/requirements in description
   - Keep under ~200 characters

4. **Clean up content**:
   - Remove "When to Use (Triggers)" section if fully covered in description
   - Consolidate verbose step-by-step examples into concise single-command versions where possible
   - Keep "Acceptance Checks" section (these are valuable)
   - Remove obvious "Why" explanations unless they provide non-obvious insights
   - Ensure code blocks have language specifiers (```bash, ```typescript, etc.)

5. **Create the new skill**:
   ```bash
   mkdir -p ~/.claude/skills/<new-name>
   ```
   Then write the improved SKILL.md

6. **DO NOT delete the old skill** - the user will handle cleanup after verification

7. **Report back** with:
   - Original name → New name
   - Key changes made
   - Any concerns or questions

## Skills to Skip (leave in plugins)

Skip these - they require plugin features:
- Anything in `commands/` directory (slash commands - plugin only)
- Anything in `agents/` directory (subagents - plugin only)
- Anything in `hooks/` directory (hooks - plugin only)

Only migrate files from `skills/<name>/SKILL.md` directories.

## Example Transformation

**Before** (`dev/skills/context7/SKILL.md`):
```markdown
---
description: Use when you need third‑party library docs; fetch with Context7 (resolve-library-id → get-library-docs) instead of relying on memory.
---

# Context7 Library Documentation Workflow

CRITICAL: Always use Context7 for third‑party library documentation instead of relying on memory.

When working with any third‑party library:
1. Use Context7 first — Search for the library using the `resolve-library-id` tool.
2. Fetch docs — Use `get-library-docs` with the exact ID and optional topic.
3. Implement using the current documentation and examples.

## When to Use (Triggers)
- You need to use or answer questions about a third‑party library
...
```

**After** (`~/.claude/skills/library-docs/SKILL.md`):
```markdown
---
description: Use when you need third-party library documentation. Fetch current docs with Context7 MCP tools (resolve-library-id then query-docs) instead of relying on training data.
---

# Third-Party Library Documentation

Always use Context7 for third-party library documentation instead of relying on memory.

## Workflow

1. **Resolve library ID** - Use `resolve-library-id` with the library name
2. **Query docs** - Use `query-docs` with the exact ID and your question
3. **Implement** - Use the fetched documentation and examples
...
```

## Quality Checklist

- [ ] New name is descriptive (not a tool name)
- [ ] Description starts with "Use when..."
- [ ] Description is under 200 characters
- [ ] Redundant sections removed
- [ ] Code blocks have language specifiers
- [ ] Acceptance checks preserved
- [ ] Created in `~/.claude/skills/<new-name>/SKILL.md`
