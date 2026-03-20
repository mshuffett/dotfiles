# Todoist Triage Policy

Use this when the user asks for triage recommendations, not direct execution.

The goal is not to force every item into a decisive action. The goal is to make the next decision legible and calibrated.

## Core principle

Separate:

- **What this item is**
- **What context is missing**
- **What the next step should be**

Do not collapse those into one guess.

## Decision buckets

Classify each item into exactly one primary bucket:

| Bucket | Use when | Expected output |
|--------|----------|-----------------|
| `clear_action` | The next step is specific and confidence is high | Recommend the exact action |
| `needs_context` | The task text is not enough, but more context may resolve it | Say what context to fetch next |
| `needs_user_judgment` | Even with context, this depends on Michael's intent or tradeoff | Ask one precise question |
| `probably_stale_or_close` | The task appears obsolete, superseded, or low-signal | Recommend close/delete/archive with reason |
| `convert_to_project_or_note` | The item should not remain a single Todoist task | Recommend the destination and conversion |

Use these buckets before proposing Todoist operations.

## Confidence policy

Use confidence to reflect calibration, not presentation quality.

| Range | Meaning | Behavior |
|-------|---------|----------|
| `90-100` | High confidence | Safe to recommend a direct next step |
| `70-89` | Likely but not certain | Recommend action and name the uncertainty |
| `50-69` | Underspecified | Prefer `needs_context` or `needs_user_judgment` |
| `<50` | Weak signal | Do not pretend to know; recover context or escalate |

Low confidence is often the correct answer.

## Required output shape

For each task, use this structure:

```markdown
### [N]. [Task title]

**Bucket:** [clear_action | needs_context | needs_user_judgment | probably_stale_or_close | convert_to_project_or_note]
**Confidence:** [0-100]%
**Why:** [2-4 sentence explanation grounded in the task text and any recovered context]

**Recommended next step:**
- [specific action, or the next context lookup, or the exact question to ask]

**Missing context:**
- [only include if something important is missing]

**Evidence used:**
- [task title / description]
- [comments, if reviewed]
- [project or note context, if reviewed]
```

If comments or note context materially changed the answer, say so explicitly.

## Action-quality rules

- Prefer exact recommendations over vague verbs.
- Never say only "follow up" or "delegate".
- If recommending a comment, draft the comment text.
- If recommending a due-date change, propose the concrete date rule, not "push it out."
- If recommending closure, explain why the item is stale or superseded.

## Ambiguity handling

Default to `needs_context` when:

- comments may contain the real task state
- the item references a person, doc, or project you can probably resolve
- the task looks like shorthand from a prior conversation

Default to `needs_user_judgment` when:

- the decision is strategic, relational, or priority-sensitive
- there are multiple reasonable outcomes even after context recovery
- the task text encodes a tradeoff only Michael can resolve
- the task is a vague cleanup or review meta-task such as "clear Todoist and email" and the real question is whether to schedule it, split it, or close it

For `needs_user_judgment`:

- confidence can still be high when the next step is unambiguous and the only uncertainty is Michael's answer
- make the next step an active question to Michael, not a passive "wait"

## What good triage looks like

Good triage is:

- specific
- reversible
- evidence-backed
- honest about uncertainty

Bad triage is:

- overconfident
- generic
- context-blind
- optimized for "having an answer"
