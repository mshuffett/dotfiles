# Process Change Log Schema

Use an append-only log at:
- `projects/<project-name>/_plans/process-change-log.jsonl`

## Entry Schema (JSONL)

Each line is one immutable event:

```json
{
  "timestamp_utc": "2026-03-05T21:30:00Z",
  "run_id": "iter9-2026-03-05-01",
  "task_id": "TASK-004",
  "stage": "in_review",
  "category": "review-quality-gap",
  "failure_signature": "warn-accepted-without-owner",
  "severity": "high",
  "evidence_refs": ["projects/foo/_tasks/TASK-004-auth.md"],
  "proposed_action": "require WARN owner+due+follow-up",
  "decision": "observed",
  "decided_by": "orchestrator"
}
```

## Mutation Policy

1. Log first, do not mutate process rules on first occurrence.
2. A process change becomes eligible only when the same `failure_signature` appears at least 2 times across distinct tasks/runs.
3. Eligible changes require explicit human approval before editing stage-gates/templates/policies.
4. Never rewrite existing log lines; corrections are appended as new superseding entries.

## Decision Values

- `observed`: first occurrence logged
- `candidate`: repeated signature, ready for review
- `approved`: human approved process change
- `rejected`: human rejected change
- `applied`: change merged into iter9 references
- `superseded`: replaced by newer proposal
