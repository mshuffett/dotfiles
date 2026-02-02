---
description: Use when capturing or organizing notes, storing reference information, documenting people/vendors/recommendations, or user says "take a note" or "remember this" (for personal reference, not Claude instructions).
---

# Notes & Knowledge Management

Primary notes system: `~/ws/notes/` (PARA method, Obsidian-compatible)

## Directory Structure

| Folder | Purpose | Examples |
|--------|---------|----------|
| `+Inbox/` | New notes, unsorted | Quick captures, unclear placement |
| `1-Projects/` | Active projects with outcomes | `Puffin Bot.md`, `Phase 3 Migration.md` |
| `2-Areas/` | Ongoing responsibilities | `Agents/`, `Strategy/`, `System/` |
| `3-Resources/` | Reference materials | `Messaging Providers.md`, `People/Oliver Zou.md` |
| `4-Archives/` | Completed/inactive | Old projects, deprecated references |
| `5-Tools/` | Scripts, automation | Operational tools |

## Subdirectories

Create subdirectories for logical groupings:
- `3-Resources/People/` — Contact notes, who said what
- `3-Resources/Vendors/` — Service providers, tools
- `1-Projects/<Project> - <Feature>.md` — Feature notes linked to parent project

## Creating Linked Notes

Use `[[wikilinks]]` to connect related notes. When capturing information:

1. **Identify the entities** — People, projects, topics, vendors
2. **Create a note for each** — One concept per file
3. **Link them together** — Every note should link to related notes

### Example: Capturing a Recommendation

User says: "Oliver recommended Linq for phone numbers, it's what Poke uses"

Create these notes:
```
3-Resources/People/Oliver Zou.md     → links to [[Messaging Providers]]
3-Resources/Messaging Providers.md   → links to [[Oliver Zou]], [[Puffin Bot]]
1-Projects/Puffin Bot.md             → links to [[Messaging Providers]]
```

### Note Template

```markdown
# Note Title

## Context
Where this info came from, when, why it matters.

## Content
The actual information.

## Related
- [[Link to related note]]
- [[Another related note]]
```

### People Notes Template

```markdown
# Person Name

## Context
- How you know them, their role/company
- What topics they're knowledgeable about

## Recommendations
- [[Topic]] - what they said (date)
```

## Workflow

1. **Don't ask "where should this go?"** — Just pick the most logical PARA category
2. **Create all related notes at once** — Don't leave dangling links
3. **Link bidirectionally** — If A links to B, B should link back to A
4. **Include source and date** — "From Oliver (Jan 2025)" helps future you
5. **Keep notes atomic** — One topic per note, link for connections

## When to Use This vs Other Systems

| Information Type | Where It Goes |
|-----------------|---------------|
| Personal reference (vendors, people, recommendations) | **Notes (here)** |
| Instructions for Claude | CLAUDE.md or Skills |
| Project documentation | Project repo docs/ |
| Task tracking | Todoist / Linear |
| Long-form knowledge base | Notion |

## Acceptance Checks

- [ ] Note placed in correct PARA location
- [ ] All entities have their own note (people, projects, topics)
- [ ] Notes are bidirectionally linked
- [ ] Source and date included where relevant
- [ ] No orphan notes (everything links to something)
