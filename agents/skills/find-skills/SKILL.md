---
name: find-skills
description: Discovers and installs agent skills from the open ecosystem. Use when the user asks "find a skill for X", "is there a skill that can...", wants to extend capabilities, or mentions skills.sh or npx skills.
---

# Find Skills

Discover and install skills from the open agent skills ecosystem.

## Key Commands

```bash
# Search for skills
npx skills find [query]

# Install a skill globally
npx skills add <owner/repo@skill> -g -y

# Check for updates
npx skills check

# Update all installed skills
npx skills update

# Initialize a new skill
npx skills init <skill-name>
```

**Browse skills at:** https://skills.sh/

## Claude Code Plugin Install (Alternative)

Anthropic's official skills repo can be registered as a marketplace:

```bash
/plugin marketplace add anthropics/skills
```

Then install via `/plugin install document-skills@anthropic-agent-skills` or browse with `/plugin`.

## Search Workflow

1. Identify the domain and task from the user's request
2. Run `npx skills find <query>` with specific keywords
3. Present results with install command and skills.sh link
4. Install with `-g -y` if user approves

Example queries: `react performance`, `pr review`, `changelog`, `testing playwright`

## Popular Sources

- `anthropics/skills` — Official Anthropic skills (documents, frontend, design)
- `vercel-labs/agent-skills` — Vercel React/Next.js best practices
- `ComposioHQ/awesome-claude-skills` — Community curated collection

## Known Issue: Broken Symlinks

The skills CLI may create broken symlinks when `~/.claude/skills/` is itself a symlink (our setup).

```bash
# Check for broken symlinks after install
for link in ~/.claude/skills/*/; do
  if [ -L "${link%/}" ] && ! ls "${link%/}/SKILL.md" &>/dev/null; then
    echo "Broken: ${link%/}"
    skill_name=$(basename "${link%/}")
    [ -d ~/.agents/skills/"$skill_name" ] && rm "${link%/}" && ln -s ~/.agents/skills/"$skill_name" "${link%/}" && echo "Fixed"
  fi
done
```

## When No Skills Found

1. Acknowledge no match
2. Offer to help directly with general capabilities
3. Suggest creating a custom skill: `npx skills init my-skill` or see the `skill-creation` skill

## Acceptance Checks

- [ ] Search performed with specific keywords
- [ ] Results presented with install command
- [ ] Symlinks verified after install
