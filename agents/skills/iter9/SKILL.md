---
name: iter9
description: End-to-end define-to-ship delivery loop with DAG orchestration and stage gates. Use when the user wants to turn high-level product goals into detailed stories (risks, decisions, acceptance checks), execute with subagents, run independent dual reviews, and progress tasks only when explicit gate criteria pass.
---

# Iter9

Run a full delivery loop with explicit stages, gate criteria, and evidence-driven progression.

## Outcomes

Create and maintain these artifacts under `projects/<project-name>/`:
- `_plans/PLAN-001-iter9.md`
- `_plans/verification-matrix.md`
- `_tasks/TASK-*-<story-slug>.md`

Each task card must contain:
- `stage`
- `status`
- `depends_on`
- risks, decisions, acceptance checks
- implementation + review + verification evidence
- testing strategy, coverage evidence, and corner-case evidence
- UI E2E evidence (screenshots) when UI is involved
- human review decision and timestamp

## Project-Level Gate (Required)

Default first phase is requirements gathering/discussion.

Do not proceed to task decomposition or implementation until:
- requirements have been written in the plan artifact
- unresolved requirement questions are either resolved or explicitly deferred with owner/date
- the user explicitly approves that requirements are sufficient for the next executable slice

Record this in the plan as a requirements sign-off entry with approver and timestamp.

## Stage Model (Required)

Use this stage machine for every task card:
- `draft`
- `specified`
- `ready_for_impl`
- `in_impl`
- `impl_done`
- `in_review`
- `reviewed`
- `verified`
- `awaiting_human_review`
- `done`
- `blocked`

Transition rules are mandatory. Use `references/stage-gates.md`.

Use this status lifecycle on task cards:
- `open`
- `in_progress`
- `in_review`
- `blocked`
- `done`

## Workflow

### 1) Initialize Workspace

1. Confirm project slug.
2. Ensure directories exist:
```bash
mkdir -p projects/<project-name>/_plans projects/<project-name>/_tasks
```
3. Check for existing Iter9 artifacts:
```bash
ls projects/<project-name>/_plans/PLAN-001-iter9.md \
   projects/<project-name>/_plans/verification-matrix.md \
   projects/<project-name>/_tasks/TASK-*.md 2>/dev/null
```
4. If existing artifacts are found, report current status before any execution:
- requirements sign-off status
- task count by stage
- blocked tasks
- verification summary
5. Ask user for explicit mode: `resume` | `restart` | `cancel`.
6. Do not continue automatically after detecting existing artifacts without explicit mode selection.

### 2) Requirements Discovery and Interview (Pre-Card)

Run an explicit interview loop before creating cards:
- problem statement and desired outcomes
- users/personas and primary journeys
- must-have behaviors and non-goals
- constraints, risks, and unknowns
- success criteria and acceptance expectations

Produce a requirements draft in the plan, review it with the user, and iterate until sign-off is recorded.

Use `references/requirements-interview-checklist.md` and `references/requirements-interview-prompt.md`.

### 3) Define the Target

Populate `PLAN-001-iter9.md` using `references/plan-template.md`:
- requirements discussion summary
- exhaustive requirements list
- requirement assumptions and open questions
- explicit requirements sign-off
- target outcome
- scope boundaries
- constraints
- success criteria
- DAG nodes and dependencies

Do not create implementation-ready tasks until requirements sign-off is complete.

### 4) Create Task Cards

Create one `TASK-*.md` per DAG node from `references/task-template.md`.

Rules:
- Start each new task in `stage: draft`.
- Use task IDs in `depends_on` (example: `TASK-001`).
- Include at least one mechanical acceptance check.
- Define testing strategy before implementation (unit/integration/E2E and corner cases).
- Set `stage: specified` only when risks/decisions/acceptance checks are complete and mapped back to signed-off requirements.

### 5) Pre-Implementation Gate

Pre-implementation gate policy:
- Medium/high risk: run `pre-mortem` (required).
- Low risk: optional `pre-mortem`, but record waiver rationale on plan/task.

Outcomes:
- FAIL: revise tasks and rerun.
- PASS/WARN or low-risk waiver: move eligible tasks to `ready_for_impl`.

### 5.5) New Requirements During Execution (Change Control)

When the user introduces new requirements mid-iteration:
- identify impacted tasks/stages immediately
- summarize impact on in-flight work (scope, dependencies, tests, timeline risk)
- ask explicit decision: `apply this iteration` or `defer to next iteration`

If `apply this iteration`:
- update requirement IDs and traceability
- reset affected tasks to `specified` (or `draft` if scope changed materially)
- rerun pre-implementation gate for affected tasks

If `defer to next iteration`:
- append requirement to backlog/change log with owner and due decision date
- keep current iteration DAG stable

Use `references/requirements-change-control.md`.

### 6) DAG Orchestration and Implementation

For each runnable node (dependencies done), orchestrate subagents with fresh context:

1. Implementer agent
- Input: task card only + required files
- Output: code changes + `implementation_report` section on task card
- Development mode: TDD by default (red -> green -> refactor)
- On start: `in_impl`
- On completion: `impl_done`

2. Dual independent reviewers (parallel)
- Reviewer A: correctness, edge cases, security, tests
- Reviewer B: architecture fit, maintainability, conventions
- Each writes findings with file references to task card
- Stage while running: `in_review`
- Advance only when both reviewer verdicts are PASS or accepted WARN

3. Rework loop
- Any FAIL sends task back to `in_impl` with required fixes.

### 7) Verification Gate

After reviews pass:
- Execute exhaustive task acceptance checks.
- Execute required integration checks for the current DAG level.
- Validate corner cases listed on the task card.
- Enforce high coverage target from the task card.
- If UI is involved, run E2E with `agent-browser` and capture screenshots as evidence.
- Update `verification-matrix.md` using `references/verification-matrix-template.md`.

Only then set `stage: verified`.

### 8) Human Review Gate

After a task is `verified`, set stage to `awaiting_human_review` and present:
- implementation report
- reviewer A/B findings and resolutions
- verification and test evidence
- UI screenshots (if applicable)

Advance only when human review outcome is explicitly recorded on the task card.

### 9) Completion Gate

Set `stage: done` only when all are true:
- acceptance checks passed
- reviewer verdicts resolved
- verification matrix row marked pass
- dependencies satisfied and no open blockers
- human review marked approved

### 10) Closeout

When all tasks are `done`:
- write plan closure summary (what shipped, proof, follow-ups)
- run `post-mortem` for non-trivial efforts

### 11) Learning Loop (Required)

After closeout:
- capture failure patterns, false positives, and gate escapes
- append findings to an append-only process change log
- propose rule/template changes only after the same failure signature repeats at least twice across distinct tasks/runs
- record one concrete process improvement in the plan closure

Use `references/learning-loop.md`.

## Orchestration Rules

- Use DAG order: only dispatch tasks whose dependencies are `done`.
- Do not dispatch any task beyond `draft` unless the project-level requirements lock is signed off.
- Do not run parallel tasks that edit the same files unless conflict handling is explicit.
- Require evidence before every stage transition.
- Record all stage transitions in `stage_history` on each task card.
- Keep artifacts under `projects/<project-name>/` only.
- Require dual agent review before human review.
- Default to TDD unless an explicit exception is recorded.
- For UI work, require `agent-browser` E2E screenshot artifacts.
- Evidence is valid only if it includes command, result/exit code, UTC timestamp, commit SHA, and artifact path.
- Process rules/templates are immutable during active execution unless a critical exception is approved by human review.

## References

- `references/plan-template.md`
- `references/task-template.md`
- `references/stage-gates.md`
- `references/verification-matrix-template.md`
- `references/testing-policy.md`
- `references/requirements-interview-checklist.md`
- `references/requirements-interview-prompt.md`
- `references/requirements-change-control.md`
- `references/learning-loop.md`
- `references/process-change-log-schema.md`
