# Iter9 Testing Policy

## Core Policy

1. Default to TDD (`red -> green -> refactor`) for implementation tasks.
2. Require high coverage evidence for touched modules (default target from task card).
3. Validate listed corner cases per task before verification pass.
4. For UI tasks, run real E2E with `agent-browser` and capture screenshots.
5. Record all test commands and outcomes as evidence on task card and verification matrix.

## TDD Exceptions

TDD may be waived only when all are documented on the task card:
- reason TDD is impractical
- replacement validation strategy
- reviewer acknowledgement

## UI E2E Evidence

For `ui_involved: true`, include:
- E2E scenario list
- commands or steps executed
- screenshot artifact paths
- pass/fail outcome per scenario
- at least one deterministic assertion per scenario

Without screenshot evidence, UI tasks do not pass verification.

## Corner Case Coverage

Each task must enumerate corner cases and show test outcomes for each:
- boundary inputs
- error paths
- empty/null states
- retry/idempotency/concurrency concerns when relevant

## Coverage Gate

Coverage must meet task `coverage_target` or stricter project policy.

If below target, task returns to implementation.
