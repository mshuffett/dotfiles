---
name: inbox-triage
description: Process raw Todoist inbox items into a structured knowledge system using GTD (actions → Todoist) and PARA (reference → Obsidian). Use when batch-processing inbox captures, triaging voice notes and links, filing raw ideas into Obsidian with MOC suggestions, or running an inbox-to-knowledge-system pipeline. Handles enrichment (URL fetching, voice interpretation), clustering related items, generating Obsidian reference notes, filing Todoist actions, and producing a triage report. Self-improving via prompt-self-improvement protocol.
---

# Inbox Triage

Process a batch of raw Todoist inbox items and produce: a triage report (audit trail), Obsidian reference notes (semi-atomic, linked), and Todoist action items (filed to projects).

## Step 0: Load Context

1. Read [references/scenarios.md](references/scenarios.md) for correction patterns and domain-specific guidance
2. Load recent triage sessions (prioritize ones with corrections)
3. Check `~/ws/notes/.claude/rules/coach-patterns.md` for learned filing patterns
4. Adapt approach based on what you see — don't apply rules mechanically

## Step 1: Project Check-In

Present the current active projects list and ask if anything has changed:

> **Current active projects:** [list from para-index system IDs]
> Have any projects changed, been completed, or been added since last triage?

Wait for confirmation before proceeding. Use the `para-index` skill's `references/system-ids.md` for current project/area/resource IDs across Todoist, Notion, and Obsidian.

## Step 2: Ingest & Classify

### 2a. Enrich

- **URL/link items**: Fetch the page, summarize in 2-3 sentences (what it is, why relevant). For GitHub repos: one sentence on what it does, note stars/last-commit/activity, flag if relevant to active project. Don't summarize the README.
- **Voice captures** (informal language, stream-of-consciousness): Interpret intent. Voice captures using modal/conditional language (could, might, what if, idea for) are ideation — classify as Reference or Project Seed. Imperative language (tell, send, make, build) with a specific target signals Action.
- **Ambiguous items**: Flag for clarification rather than guessing.

### 2b. Classify into exactly one category

| Category | Definition | Destination |
|----------|-----------|-------------|
| **Action** | Clear next physical action. Imperative + specific target. | Todoist → matching active project |
| **Reference** | Information, tool, framework, or idea worth keeping. Not actionable now. | Obsidian → Resources or relevant Area |
| **Project Seed** | Could become a project. Needs incubation. | Obsidian → Resources/Project Seeds + flag in report |
| **Clarify** | Can't determine intent without more context. | Hold → list in report with best guess + question |

### 2c. Cluster Related Items

Before filing, scan ALL items for clusters — items about the same topic, tool, or idea:
- Multiple links about the same tool → one reference note
- Several voice notes about the same concept → synthesize into one note
- An action and a reference about the same project → link them

**Cluster by problem domain and use case, not by source.** Multiple tools solving the same problem = one note.

## Step 3: Generate Outputs

### Obsidian Reference Notes

For each reference item or cluster, create a semi-atomic note. See [references/examples.md](references/examples.md) for the full template.

Key rules:
- Tags: `[source-type, topic-tags]`
- Include original inbox text verbatim in Source Links section
- If 3+ notes cluster under one topic → suggest a MOC (Map of Content)
- MOC naming: use conceptual theme, not tool name ("Agent Orchestration Frameworks" not "Claude Code Links")
- Filing: `Resources/[Topic Area]/` or `Areas/[Area Name]/` — check `~/ws/notes/` vault structure. See `_agent/Idea-Places.md` for routing heuristics.

### Todoist Actions

For each action item:
- **Task title**: Clear next action, starts with a verb
- **Project**: Which active project (or Inbox if none match). When an item references a person, use their known project association as the primary signal over keywords.
- **Context/label** if obvious (@computer, @call, @waiting-for)
- **Link** to any related Obsidian note: `📎 See also: [[Note Title]]`

### Triage Report

Master document per session. See [references/examples.md](references/examples.md) for the full template. Includes: projects confirmed, summary stats, actions filed table, reference notes table, clusters identified, items needing clarification, MOC suggestions.

## Processing Principles

1. **Bias toward reference over action.** "I should look into this someday" = reference note, not a task.
2. **Preserve original context.** Always include original inbox text verbatim somewhere.
3. **Don't over-organize.** No clear cluster → standalone note is fine.
4. **Surface implicit project relevance.** Reference clearly related to active project → note the connection, still file as reference unless there's a clear action.
5. **80% confidence threshold.** Above 80% → proceed but flag reasoning. Below 80% → Clarify.
6. **Primary project default.** Items matching the user's primary project domain associate with it unless they clearly belong elsewhere.
7. **Dynamic taxonomy.** Suggest new categories/MOCs when items reveal patterns without a home. But keep it minimal.

## Session Folder Structure

```
triage/
  {date}-{uuid}/
    input.json          # Raw Todoist items
    triage-report.md    # The output
    notes/              # Generated Obsidian notes
    corrections.md      # User corrections (post-review)
```

## Self-Improvement

This prompt is self-improving. After review, follow the `prompt-self-improvement` skill. Domain-specific correction examples are in [references/scenarios.md](references/scenarios.md).

## Related Skills

- **para-index** — System IDs for Todoist/Notion/Obsidian PARA structure
- **todoist** — CLI operations for Todoist (`td` commands)
- **idea-capture** — Real-time single-idea capture to Obsidian (this skill does batch processing)
- **prompt-self-improvement** — General protocol for improving this prompt from corrections
- **coach** — Daily startup/shutdown may surface items for triage
