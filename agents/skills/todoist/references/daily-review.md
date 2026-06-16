# Todoist Daily Review

Use this when reviewing due, overdue, or inbox tasks.

The goal is not just to categorize tasks. The goal is to recover enough context to turn each task into the next reversible move.

## Fetch scope

Fetch both sets before making recommendations. Prefer the **Todoist MCP** when connected
(`find-tasks` with filter "today | overdue", and `find-tasks` projectId "inbox"); the `td`
commands below are the fallback / for shell scripts (see [operations.md](operations.md)).

```bash
td today --json --full --all
td inbox --json --full --all
```

Dedupe by task id. Include tasks due today, overdue tasks, and inbox tasks. If the user gives a Todoist URL, inspect that task directly with `td task view <url> --json`.

## Review loop

For each task:

1. Read the task body, project, due date, priority, labels, assignee, and URL.
2. Read Todoist comments before recommending comments, completion, deletion, or follow-up.
3. Recover context using [context-recovery.md](context-recovery.md).
4. Search across the most likely systems when names or shorthand appear:
   - Gmail for recent conversations and signatures.
   - Notes / local knowledge for project context, investor lists, people, and prior drafts.
   - Notion when the task points to current operating-state pages or project databases.
5. Classify with [triage-policy.md](triage-policy.md).
6. Propose the smallest concrete next step.

## Cross-app action tasks

Some tasks are shorthand for a relationship move, for example "Ask Shelley if she knows the best way to get in contact with Justin." Do not stop at "needs context" if the context is recoverable.

For these tasks:

- Search Gmail for each named person before inferring from notes alone. Recent direct email evidence beats broad notes matches.
- Identify the named people from Gmail, notes, Notion, and task context.
- Resolve which project or relationship the task is about.
- Use the recovered context to draft the likely message.
- Prepare a Todoist comment that records the reasoning and draft.
- Ask before creating a Gmail draft, adding a Todoist comment, sending email, completing, deleting, or moving the task.
- When confidence is high enough to recommend the action, do not turn residual ambiguity into another interview. Name the remaining uncertainty briefly, then ask for approval to take the reversible next step.

## Output shape

For each reviewed task include:

```markdown
### [Task title]

**Bucket:** [clear_action | needs_context | needs_user_judgment | probably_stale_or_close | convert_to_project_or_note]
**Confidence:** [0-100]%
**Evidence:** [short bullets naming the sources checked]
**Reasoning:** [brief chain from evidence to conclusion]
**Recommended next step:** [specific action]

**Proposed task comment:** [only when useful]
**Draft message:** [only when the task implies an outbound message]
**Needs approval before:** [send email | create draft | comment on task | complete task | etc.]
```

## Quality bar

Good daily review is evidence-backed and action-ready. It should produce a usable draft when the context supports one, but it should not perform external changes without approval.
