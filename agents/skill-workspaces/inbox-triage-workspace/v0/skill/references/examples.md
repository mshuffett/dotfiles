# Inbox Triage — Output Templates & Examples

## Obsidian Reference Note Template

```markdown
---
tags: [source-type, topic-tags]
created: {{date}}
source: todoist-inbox-triage
related: [[related notes]]
---

# [Descriptive Title]

## Summary
[2-4 sentences: what this is and why it matters]

## Key Details
[The substance — what you'd want to remember in 6 months]

## Source Links
- [Original Link Title](url)
- Todoist item: "[original inbox text]"

## Connections
- Related to: [[other notes from this batch or known topics]]
- Potential MOC: [[suggested MOC name]]
```

**MOC rules:**
- 3+ notes cluster under one topic → suggest creating/appending to a MOC
- Name by conceptual theme: "Agent Orchestration Frameworks" not "Claude Code Links"
- If a MOC fits under an existing PARA category, suggest where

**Filing locations** (adapt to vault structure):
- `3-Resources/[Topic Area]/[Note Name]`
- `2-Areas/[Area Name]/[Note Name]` (if ongoing area of responsibility)

## Triage Report Template

```markdown
# Inbox Triage Report — {{date}}

## Projects Confirmed
- [list active projects as confirmed in Step 1]

## Summary
- Items processed: X
- Actions created: X
- Reference notes created: X
- Clusters identified: X
- Items needing clarification: X

## Actions Filed
| Original Item | → Action | Project | Notes |
|--------------|----------|---------|-------|
| "let chen-chen know about the space" | Call Chen-Chen re: space availability | Everything AI | |

## Reference Notes Created
| Original Item(s) | → Note Title | Location | MOC |
|------------------|-------------|----------|-----|
| "orchestration things" + "claude stuff" | Agent Orchestration Tools | Resources/AI-Engineering | [[Agent Orchestration Frameworks]] |

## Clusters Identified
### [Cluster Name]
- Items combined: [list]
- Rationale: [why these belong together]
- Output: [what was created]

## Needs Clarification
| Item | Best Guess | Question |
|------|-----------|----------|
| "creating a way to distribute skills..." | Project seed for skills marketplace? | Is this an EAI feature idea or separate concept? |

## MOC Suggestions
- **[[MOC Name]]** — N items relate to [theme]. Suggest creating under [location].
```

## Example Processing

### Voice capture → Action

**Input:** `"let chen-chen know about the space"`

1. No link. Voice-captured reminder.
2. Classify: **Action** (imperative + person + specific communication)
3. Task: "Message Chen-Chen about the space" → Project: Everything AI (person association > keyword)
4. Add to report actions table

### URL + keyword → Clustered Reference

**Input:** `"more orchestration things"` + GitHub link to `mikekelly/claude-sneakpeek` + 3 similar items

1. Fetch GitHub link → repo for parallel build orchestration with Claude
2. Classify: **Reference** (tool/framework, not directly actionable)
3. Cluster: 4 items about Claude orchestration tools → one note
4. Create: "Claude Code Orchestration Tools" with all links and summaries
5. Suggest MOC: "Agent Orchestration Frameworks"
6. Note project relevance: Everything AI uses agent orchestration
7. Add to report references table + clusters section

### Voice capture → Reference (not action)

**Input:** `"could make the bot for the event through the text API"`

1. Voice capture with modal verb "could make"
2. Classify: **Project Seed** (ideation, not commitment — modal language)
3. Create Obsidian note in Resources/Project Seeds
4. Flag in report with connection to relevant project
