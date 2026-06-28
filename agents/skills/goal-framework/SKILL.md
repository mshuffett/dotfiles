---
name: goal-framework
description: Turn a fuzzy intention into a goal with a checkable definition of done, track it in a file, and optionally pursue it with an autonomous loop. Use whenever the user wants to set, sharpen, track, or pursue a goal or objective, turn a vague intention into something with a clear "done", run a loop toward an outcome, or check progress on a goal. Triggers on "set a goal", "make a goal for", "track this", "I want to finally X", "help me get X done", "where is goal X at", OKRs, and accountability or progress tracking. Use it even when the user does not say the word "goal" but is describing an outcome they want to reach and track.
---

# Goal Framework

Turn a fuzzy intention into a goal with a falsifiable definition of done, track it in a file, and optionally pursue it.

Most goals fail because "done" is never made checkable. The core job of this skill is to fix that, then track and optionally drive the goal.

## The flow

1. Sharpen the intention.
2. Write the spec.
3. Create the tracking file.
4. Optional: pursue it now.
5. Write the result back.

## 1. Sharpen

A goal is useless if "done" cannot be checked. Reflect the intention back in one sentence. Ask at most one or two questions, and only the ones that change the success criterion. If you can pick a sensible default, state it and proceed instead of asking.

## 2. Spec

Produce four fields:

- **objective**: the outcome, not a vague verb. "Signup flow is protected end to end" not "improve signup".
- **criterion**: the definition of done. It must map to a concrete observable: a command that exits 0, a file that contains X, a number against a target, or a visible state. If you cannot name the check, the goal is not ready. Go back to step 1.
- **type**: `milestone` | `metric` | `habit`. This picks the pursuit engine.
- **anti-goal** (optional): the failure mode to avoid, for example a test quarantined to make CI green.

## 3. Tracking file

Write one file per goal at `plans/goals/<goal-id>.md`. `<goal-id>` is a short kebab-case slug.

```markdown
---
goal: <goal-id>
status: active
type: milestone
created: <YYYY-MM-DD>
criterion: "<the checkable done condition>"
---
# <Title>

**Why now:** <one line>

## Done when
- [ ] <sub-check 1>
- [ ] <sub-check 2>

## Check-in log
- <YYYY-MM-DD> — goal created
```

## 4. Pursue it now (optional)

Pick the engine by type:

| Type | Engine |
|------|--------|
| `milestone`, agent-actionable in this repo | author a workflow, run it |
| `metric`, agent-actionable | author a measure-act workflow, run it |
| `habit` | no workflow; schedule a recurring check |
| not agent-actionable (e.g. revenue, external) | track only, no workflow |

To author the workflow, read `references/workflow-authoring.md`. It has the rules and three worked examples. Pick the closest example, adapt it to this goal, or write your own following the rules. `scripts/run-goal.workflow.js` is the ready-made milestone runner; call it with args when the goal is a single end-state.

The criterion is the loop's exit condition. A well-formed criterion is what lets the loop terminate honestly. A vague one means the verifier can never confirm done, which is the correct failure signal.

## 5. Write the result back

The workflow returns structured data. It has no filesystem access, so it cannot update the tracking file itself. Read the returned result, append a check-in line with the evidence, and update `status`. On verified success set `status: done`.

```markdown
## Check-in log
- <date> — pursued via run-goal (<n> iters). MET. evidence: <verifier evidence>
```

## Status checks

When the user asks where a goal stands, read its file, show the checklist and check-in log, and either resume the loop or close it once the criterion verifies.
