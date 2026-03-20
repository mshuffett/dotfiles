# Todoist Preference Memory

Use this when Michael corrects a triage recommendation or explains a preference.

The goal is to capture **reusable decision rules**, not entire conversations.

## Promotion rule

Only promote a correction into durable preference memory when at least one of these is true:

- the same pattern has appeared more than once
- the correction expresses a stable policy, not a one-off exception
- the rule would help in future fresh sessions

Keep one-off quirks out of the main skill.

## Memory record shape

Store each candidate preference in a compact normalized structure:

```json
{
  "id": "pref-2026-03-17-001",
  "pattern": "Tasks that are really idea fragments should be converted to notes, not kept as open Todoist tasks.",
  "signals": [
    "no concrete verb",
    "contains idea language",
    "better as knowledge artifact"
  ],
  "preferred_bucket": "convert_to_project_or_note",
  "preferred_action": "Suggest filing to notes with a proposed title, then closing the task.",
  "anti_pattern": "Do not keep it as a vague open task just because it mentions a project.",
  "evidence_task_ids": [
    "9904273656"
  ],
  "status": "candidate",
  "confidence": 0.7
}
```

## Statuses

| Status | Meaning |
|--------|---------|
| `candidate` | Seen once or still uncertain |
| `validated` | Repeatedly correct in fresh-session evals |
| `deprecated` | No longer reliable or superseded |

## Correction workflow

1. Capture the original task and model recommendation.
2. Capture Michael's correction in concrete terms.
3. Infer the smallest reusable rule.
4. Mark it `candidate` unless you have repeat evidence.
5. Add or update eval cases that test the pattern cold.
6. Promote to `validated` only after fresh-session confirmation.

## What to store

Store:

- trigger signals
- preferred bucket/action
- anti-patterns
- a small number of example task IDs

Do not store:

- full chat transcripts
- long rationale paragraphs
- temporary project-specific state
- secrets or private operational details that are not required for future triage

## Failure modes

Watch for these mistakes:

- promoting a one-off preference too early
- writing rules that are too vague to execute
- writing rules that merely restate a single example
- relying on a long prior thread instead of explicit memory entries

## Fresh-session bar

A preference is only trustworthy when it helps the model make the same call in a fresh session with:

- the task
- the intended reference files
- the normalized preference entry

If it only works after a long conversation, it is not durable memory yet.
