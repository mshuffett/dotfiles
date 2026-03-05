# Iter9 Stage Gates

A task may advance only when the current stage exit criteria are satisfied.

## Project-Level Prerequisite: Requirements Lock

Before any task may move from `draft` to `specified`, all must be true:
- Requirements section is complete in the Iter9 plan.
- Open requirement questions are resolved or explicitly deferred with owner/date.
- User has explicitly approved requirements as sufficient for the next executable slice.
- Plan contains a requirements sign-off entry (approver + timestamp).

## Stages and Criteria

| Stage | Enter Criteria | Exit Criteria | Next Stage |
|---|---|---|---|
| `draft` | Task file created | Goal/scope/risks/decisions/acceptance checks populated and requirements lock satisfied | `specified` |
| `specified` | Task details complete | Dependencies identified, acceptance checks mechanically testable, no critical ambiguity | `ready_for_impl` |
| `ready_for_impl` | Pre-implementation gate passed (pre-mortem pass/warn, or low-risk waiver), deps done | Implementer assigned and work started | `in_impl` |
| `in_impl` | Implementer active | Code + implementation report complete; TDD evidence recorded or exception recorded | `impl_done` |
| `impl_done` | Implementation complete | Two independent reviewers started | `in_review` |
| `in_review` | Reviewer A + B active | Both reviewer verdicts PASS or accepted WARN, FAIL fixes applied | `reviewed` |
| `reviewed` | Review gate cleared | Acceptance + integration checks pass; corner cases checked; coverage gate met; UI E2E screenshots captured when applicable | `verified` |
| `verified` | Verification evidence complete | Human review packet prepared and presented | `awaiting_human_review` |
| `awaiting_human_review` | Human review requested | Human approval recorded on task card (`approved`) OR human requests rework (`rework`) | `done` or `in_impl` |
| `blocked` | Any hard blocker appears | Blocker resolved with evidence | previous actionable stage |

## Mandatory Rules

1. Never skip stages.
2. Every stage transition must append `stage_history` on the task card.
3. `done` requires verification evidence, not claims.
4. Any reviewer FAIL sends task back to `in_impl`.
5. Any failed verification sends task back to `in_impl` or `specified` depending on root cause.
6. Requirements lock is a hard prerequisite for all execution stages.
7. Dual agent review is required before human review.
8. Reviewer A and Reviewer B must have distinct reviewer agent IDs.
9. UI tasks require `agent-browser` E2E screenshot evidence before `verified`.
10. High coverage gate must be met before `verified`.
11. Evidence is valid only with command, exit/result, UTC timestamp, commit SHA, and artifact path.
12. After 2 FAIL -> rework cycles, move task to `blocked` and require root-cause analysis + human decision.
