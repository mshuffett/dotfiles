# Todoist Context Recovery

Use this before making a recommendation when the task text alone is weak.

## Recovery order

Work from cheapest to richest context:

1. **Task body**
   - Read title, description, labels, due date, assignee, project, priority.
   - Identify obvious action words, people, URLs, and date references.

2. **Comments**
   - If `comment_count > 0`, read comments before classifying.
   - Summarize the latest state, unanswered questions, and any commitments.

3. **Project and section context**
   - Infer the project intent from the Todoist project or section.
   - Check whether the item belongs to an active project, backlog, admin bucket, or review lane.

4. **Notes / local knowledge**
   - Search the notes vault for the project, document title, linked task, or named people when the task clearly points there.
   - Use this only when it can actually change the decision.

5. **Age and recency**
   - Consider created date, due date age, and comment recency.
   - Old tasks without recent activity are candidates for `probably_stale_or_close`.

6. **Escalate**
   - If the task remains under-specified, choose `needs_context` or `needs_user_judgment`.

## Required checks

- Read comments before any destructive recommendation.
- Treat recent human comments as stronger evidence than old task text.
- Distinguish "missing context I can fetch" from "judgment only Michael can provide."

## Search heuristics

Good retrieval targets:

- project names
- document titles
- PR numbers
- person names
- product names
- distinctive nouns from the task text

Bad retrieval targets:

- generic verbs
- full task titles with filler words
- speculative interpretations not grounded in the task

## Escalation templates

Use `needs_context` when the next move is to inspect more evidence:

```markdown
**Recommended next step:**
- Review the last 3 comments and the linked project note before deciding whether to close or follow up.

**Missing context:**
- Current status from comments
- Whether the linked project is still active
```

Use `needs_user_judgment` when the missing piece is intent:

```markdown
**Recommended next step:**
- Ask Michael: "Do you want this treated as a real deliverable for this week, or moved to a backlog/note for later?"
```

## Stop conditions

Stop recovering context when one of these becomes true:

- you have enough evidence for a high-confidence recommendation
- the remaining uncertainty is clearly a user preference call
- more searching would be broad speculation rather than targeted recovery
