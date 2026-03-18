# Note Templates

## Obsidian Reference Note

```markdown
---
tags: [<topic-tags>]
created: {{date}}
source: adaptive-triage
related: [[related notes]]
---

# [Descriptive Title]

## Summary
[2-4 sentences: what this is and why it matters]

## Key Details
[The substance — what you'd want to remember in 6 months]

## Source
[Preserve ALL original text verbatim — title + description + comments are one unit.
Do not summarize or excerpt the user's raw thinking.]

- Todoist item: "[original inbox text]"
- Description: "[full description if any]"
- Links: [any URLs from the item]

## Connections
- Related to: [[other notes or areas]]
```

## Filing Locations

Match against vault structure loaded in enrichment step:
- `3-Resources/[Topic Area]/[Note Name]` — tools, evaluations, general reference
- `2-Areas/[Area Name]/[Note Name]` — ongoing areas of responsibility
- `3-Resources/Project Seeds/[Note Name]` — ideas not yet actionable

**When filing is ambiguous**: Present existing matching areas AND "create new area"
as options. Don't force-fit into existing taxonomy. Always add cross-links to
related areas even if the note doesn't live inside them.

**GitHub repos**: One sentence on what it does + stars/maintenance status. No
README summaries, feature lists, or architecture deep-dives.
