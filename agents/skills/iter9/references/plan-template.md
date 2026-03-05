# Plan: <Project Name>

## 0. Requirements Discussion and Sign-Off

### Requirements
- R1:
- R2:

### Assumptions
- A1:

### Open Questions
- None, or deferred items with owner/date:
- Q1:
  - owner:
  - decision_due:
  - mitigation:

### Sign-Off
- Requirements exhaustive for execution: yes/no
- Approved by:
- Approved at (ISO-8601):
- Notes:

## 1. Target Outcome
- Outcome:
- Why this matters:
- Success criteria:

## 2. Scope Boundaries
- In scope:
- Out of scope:
- Constraints:

## 3. DAG Definition

| Node ID | Task File | Depends On | Deliverable | Risk Level |
|---|---|---|---|---|
| N1 | TASK-001-<slug>.md | none | ... | ... |

Rules:
- Node IDs map 1:1 to task cards.
- Dependencies must be explicit.
- Nodes in same wave must avoid overlapping file ownership.

## 4. Story-Level Risks and Decisions

| Task | Major Risks | Locked Decisions | Discretionary Decisions |
|---|---|---|---|
| TASK-001 | ... | ... | ... |

## 5. Acceptance and Verification Strategy
- Per-task acceptance checks live on task cards.
- Cross-task integration checks listed in verification matrix.

## 6. Stage-Gate Policy
Apply `references/stage-gates.md` to every task.

## 7. Execution Notes
- Orchestrator mode: DAG + subagents
- Reviewer policy: dual independent reviews per implemented task
- Conflict policy:

## 8. Closure
- What shipped:
- Evidence:
- Follow-ups:
- improvement_added:
- failure_prevented:
- evidence_next_run:
- process_log_path: `projects/<project-name>/_plans/process-change-log.jsonl`
