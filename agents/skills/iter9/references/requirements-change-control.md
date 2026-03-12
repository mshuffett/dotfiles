# Requirements Change Control (Mid-Iteration)

Use this workflow whenever new requirements appear after execution has started.

## Step 1: Capture the Change

Record:
- requirement statement
- source (user message/date)
- urgency (critical/non-critical)
- affected user outcome

## Step 2: Impact Analysis

Identify what is affected:
- task IDs
- stages currently in progress
- dependency graph impacts
- test impacts (unit/integration/E2E)
- risk increase

## Step 3: User Decision Gate

Present concise options:
1. `apply this iteration`
2. `defer to next iteration`

Do not choose automatically unless the user has already set a standing policy.

## Step 4A: Apply This Iteration

1. Add/update requirement IDs in plan.
2. Update requirement traceability on affected task cards.
3. Reset affected tasks:
- to `specified` when implementation shape changes
- to `draft` when problem framing changes materially
4. Re-run pre-implementation gate for affected tasks.
5. Recompute DAG readiness before dispatching any work.

## Step 4B: Defer to Next Iteration

1. Append to backlog/change log with owner and decision date.
2. Keep current iteration DAG unchanged.
3. Include deferred item in next iteration intake.

## Rules

- Never silently inject new requirements into `in_impl` tasks.
- Any applied mid-iteration requirement must update acceptance checks.
- If UI behavior changes, refresh UI E2E scenarios and screenshots.
