---
name: skill-creation
description: Creates and organizes Agent Skills (SKILL.md files) following the AgentSkills spec. Covers frontmatter, invocation control, subagent execution, progressive disclosure, and supporting files. Commit changes to dotfiles repo.
---

# Skill Creation

## Location

Personal skills (available across all projects):

```
~/.dotfiles/agents/skills/<skill-name>/SKILL.md
```

- `~/.dotfiles/claude/skills/` is a symlink to `~/.dotfiles/agents/skills/`
- Claude Code discovers at `~/.claude/skills/` (symlinked to dotfiles on this machine)

Project skills (per-repo):

```
.claude/skills/<skill-name>/SKILL.md
```

- Claude Code auto-discovers nested `.claude/skills/` in subdirectories (monorepo support)
- Skills from `--add-dir` directories load automatically with live change detection
- Codex CLI also loads from `./skills/<skill-name>/SKILL.md`

## Skill Count & Budget

There is **no hard limit** on skill count. The real constraint is the **description character budget**: 2% of context window (~16K chars fallback). Only descriptions load at startup; full content loads on invocation.

- Run `/context` to check if skills are being excluded
- Override budget with `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var
- Keep descriptions concise to maximize how many skills fit

Our lint hook (`script/agents-skill-lint.sh`) checks total description chars against this budget.

## Quick Creation

```bash
mkdir -p ~/.dotfiles/agents/skills/<skill-name>
# Write SKILL.md (see template below)
cd ~/.dotfiles && git add agents/skills/<skill-name> && git commit -m "feat(agents-skills): add <skill-name>"
```

## SKILL.md Template

```markdown
---
name: my-skill
description: Processes X and generates Y. Use when working with X or when the user mentions Y.
---

# Skill Title

<Core content>

## Acceptance Checks

- [ ] <Verification criteria>
```

## Frontmatter Reference

### Required Fields (AgentSkills Spec)

| Field | Constraints |
|-------|-------------|
| `name` | Max 64 chars. Lowercase, numbers, hyphens only. **Must match parent directory name.** No consecutive hyphens, can't start/end with hyphen. |
| `description` | Max 1024 chars. What the skill does AND when to use it. Write in third person. |

### Optional Fields (AgentSkills Spec)

| Field | Description |
|-------|-------------|
| `license` | License name or reference to bundled LICENSE file |
| `compatibility` | Max 500 chars. Environment requirements (required tools, network access, etc.) |
| `metadata` | Arbitrary key-value map (e.g., `author`, `version`) |
| `allowed-tools` | Space-delimited pre-approved tools, e.g. `Read Grep Glob` or `Bash(git:*) Read` |

### Claude Code Extensions

| Field | Description |
|-------|-------------|
| `argument-hint` | Autocomplete hint, e.g. `[issue-number]` |
| `disable-model-invocation` | `true` = only user can invoke via `/name`. Use for side-effect workflows. |
| `user-invocable` | `false` = hidden from `/` menu. Use for background knowledge. |
| `model` | Model to use when skill is active |
| `context` | `fork` = run in isolated subagent context |
| `agent` | Subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or custom. |
| `hooks` | Hooks scoped to this skill's lifecycle |

### Invocation Control Matrix

| Frontmatter | User invokes | Claude invokes | Description in context |
|-------------|:-:|:-:|:-:|
| (default) | Yes | Yes | Yes |
| `disable-model-invocation: true` | Yes | No | No |
| `user-invocable: false` | No | Yes | Yes |

### String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` / `$ARGUMENTS[N]` / `$N` | Arguments passed on invocation |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `` !`command` `` | Dynamic context injection — shell command output replaces placeholder before Claude sees it |

## Content Principles

**The context window is a public good.** Skills share it with system prompt, conversation history, other skills' metadata, and the user's actual request.

- **Claude is already smart** — only add context Claude doesn't already have. Challenge each paragraph: "Does this justify its token cost?"
- **Prefer concise examples over verbose explanations**
- **No extraneous files** — don't create README.md, INSTALLATION_GUIDE.md, CHANGELOG.md, or QUICK_REFERENCE.md. The skill should only contain what an AI agent needs to do the job.

### Degrees of Freedom

Match specificity to how fragile the task is:

| Level | When | Example |
|-------|------|---------|
| **High** (text instructions) | Multiple approaches valid, context-dependent | "Choose the right testing strategy based on the component" |
| **Medium** (pseudocode/parameterized scripts) | Preferred pattern exists, some variation OK | "Use this template but adjust the provider config" |
| **Low** (specific scripts, few params) | Fragile operations, consistency critical | "Run exactly this command sequence for PDF rotation" |

Think of it as path width: narrow bridge with cliffs needs guardrails (low freedom), open field allows many routes (high freedom).

## Description Best Practices

Write in **third person**. Include what the skill does AND when to use it. All "when to use" info belongs in the description, not the body — the body only loads after triggering.

```yaml
# Good — third person, specific triggers, key terms
description: Extracts text and tables from PDF files, fills forms, merges documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.

# Bad — vague, no triggers
description: Helps with documents.
```

## Naming Conventions

Prefer **gerund form** (verb + -ing): `processing-pdfs`, `testing-code`, `managing-databases`.

Acceptable alternatives: noun phrases (`pdf-processing`), action-oriented (`process-pdfs`).

Avoid: vague (`helper`, `utils`), overly generic (`data`, `files`).

## Progressive Disclosure

The key architectural pattern for skills. Three layers:

1. **Metadata** (~100 tokens): `name` + `description` loaded at startup for all skills
2. **Instructions** (<5000 tokens recommended): `SKILL.md` body loaded when skill activates
3. **Resources** (as needed): Supporting files loaded only when required

Keep **SKILL.md under 500 lines**. Move detail to supporting files:

```
skill-name/
├── SKILL.md           # Core instructions (required, <500 lines)
├── references/        # Docs loaded into context on demand (schemas, API guides, domain knowledge)
│   └── api-guide.md
├── scripts/           # Executable code — run, not loaded into context (deterministic, token-efficient)
│   └── validate.py
└── assets/            # Files used in output, not loaded into context (templates, images, fonts)
    └── template.pptx
```

**Key distinction**: `references/` = read into context to inform Claude's thinking. `assets/` = used in output without being read. `scripts/` = executed without being read (but may be read for patching).

Keep file references **one level deep** from SKILL.md. Avoid nested reference chains. For files >100 lines, include a table of contents at the top.

Reference from SKILL.md:
```markdown
- For API details, see [references/api-guide.md](references/api-guide.md)
- Run validation: `python scripts/validate.py`
```

## Subagent Execution

Add `context: fork` to run in an isolated subagent. The skill content becomes the task prompt (no conversation history).

```yaml
---
name: deep-research
description: Researches a topic thoroughly using codebase exploration.
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

Only use `context: fork` for skills with explicit task instructions, not reference/guideline skills.

## Personal Knowledge Organization

Beyond the standard skill pattern, we maintain deeper reference material in atoms:

```
~/.dotfiles/agents/knowledge/atoms/
```

Atoms are detailed, topic-specific files that skills or MEMORY.md can point to. They're loaded on demand when referenced. The standard AgentSkills approach is to use `references/` within the skill directory itself — atoms are our extension for cross-cutting knowledge that doesn't belong to any single skill.

## Validation

Use the `skills-ref` reference library to validate skills:

```bash
skills-ref validate ./my-skill
```

## After Creation

```bash
cd ~/.dotfiles
git add agents/skills/<skill-name>
git commit -m "feat(agents-skills): add <skill-name>"
```

## Acceptance Checks

- [ ] Skill directory created with `SKILL.md`
- [ ] `name` field matches directory name exactly
- [ ] `name` and `description` both present (required by spec)
- [ ] Description is third-person, includes what + when
- [ ] SKILL.md under 500 lines
- [ ] File references one level deep (no nested chains)
- [ ] Committed to dotfiles repo
