# Iter9 Learning Loop

Use this loop after each completed effort (or major phase) to improve the process without uncontrolled drift.

## Inputs

- Task cards and stage history
- Reviewer findings (A/B)
- Verification matrix
- Human review outcomes
- Post-mortem notes
- Process change log (`process-change-log.jsonl`)

## Improvement Cycle

1. Detect
- Find where defects, rework, or delays occurred.
- Identify which gate failed to catch the issue early.

2. Classify
- Requirements gap
- Planning/dependency gap
- Implementation quality gap
- Review quality gap
- Verification gap
- Human review/coordination gap

3. Log (Append-Only)
- Append an entry to `projects/<project-name>/_plans/process-change-log.jsonl`.
- Do not edit prior entries.

4. Promote Only on Repeat
- If the same `failure_signature` appears fewer than 2 times: keep `decision=observed`.
- If it appears 2+ times across distinct tasks/runs: mark `decision=candidate` and draft a change proposal.

5. Approve and Apply
- Apply template/rule changes only after explicit human approval.
- Append `approved` and `applied` entries to the log.

6. Validate Next Run
- Verify the applied change catches the prior failure mode without excessive friction.

## Required Output

Add closure notes in plan:
- `improvement_added:` <short statement>
- `failure_prevented:` <what it is meant to stop>
- `evidence_next_run:` <how to validate it worked>
- `process_log_path:` `projects/<project-name>/_plans/process-change-log.jsonl`

For log schema and decisions, use `references/process-change-log-schema.md`.
