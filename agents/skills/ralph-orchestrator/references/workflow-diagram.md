# Ralph Orchestrator Workflow Diagrams

## PRD-Driven Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                      ralph run                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Iteration 1: 📋 PRD Planner                                │
│    - Reads specs/prd.md                                     │
│    - Creates tasks in .agent/tasks.jsonl                    │
│    - Publishes tasks.ready                                  │
│                                                             │
│  Iteration 2-N: ⚙️ Builder (repeats for each task)          │
│    - Re-reads specs/prd.md ← KEY: PRD consulted each time   │
│    - Picks highest priority ready task                      │
│    - Implements, tests, commits                             │
│    - Closes task, publishes build.done                      │
│                                                             │
│  After each build: 🔎 Reviewer                              │
│    - Re-reads specs/prd.md                                  │
│    - Checks if more tasks remain                            │
│    - Publishes build.continue OR prd.complete               │
│                                                             │
│  Final: ✅ Final Verifier                                   │
│    - Re-reads specs/prd.md one last time                    │
│    - Verifies ALL acceptance criteria                       │
│    - Outputs LOOP_COMPLETE                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Event Flow (Spec-Driven Preset)

```
spec.start
    ↓
📋 Spec Writer → emits "spec.ready"
    ↓
🔎 Spec Critic → emits "spec.approved" or "spec.rejected"
    ↓                              ↓
    ↓                    (loops back to Spec Writer)
    ↓
⚙️ Implementer → emits "implementation.done"
    ↓
✅ Verifier → emits "LOOP_COMPLETE" or "spec.violated"
                              ↓
                    (loops back to Implementer)
```

## Task State Machine

```
┌──────────┐     ralph task add     ┌──────────┐
│          │ ────────────────────▶  │          │
│  (none)  │                        │   open   │
│          │                        │          │
└──────────┘                        └────┬─────┘
                                         │
                                         │ Builder picks task
                                         ▼
                                    ┌──────────┐
                                    │          │
                                    │in_progress│
                                    │          │
                                    └────┬─────┘
                                         │
                                         │ ralph task close
                                         ▼
                                    ┌──────────┐
                                    │          │
                                    │  closed  │
                                    │          │
                                    └──────────┘
```

## Loop Termination Logic

```
Agent outputs LOOP_COMPLETE
           │
           ▼
    ┌─────────────────┐
    │ Check tasks.jsonl│
    │ has_open_tasks()?│
    └────────┬────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
   YES              NO
     │               │
     ▼               ▼
┌─────────┐   ┌─────────────┐
│ REJECT  │   │ Increment   │
│completion│   │ confirmation│
│ counter=0│   │   counter   │
└─────────┘   └──────┬──────┘
                     │
                     ▼
              counter >= 2?
                     │
             ┌───────┴───────┐
             │               │
             ▼               ▼
            NO              YES
             │               │
             ▼               ▼
        Continue       ┌──────────┐
          loop         │TERMINATE │
                       │  LOOP    │
                       └──────────┘
```

## Backpressure Flow

```
Builder implements feature
           │
           ▼
    ┌─────────────────┐
    │ Run quality gate│
    │ tests/lint/type │
    └────────┬────────┘
             │
     ┌───────┴───────┐
     │               │
     ▼               ▼
   FAIL            PASS
     │               │
     ▼               ▼
┌─────────────┐ ┌─────────────┐
│ Must fix    │ │Close task   │
│ before      │ │Commit       │
│ proceeding  │ │Publish done │
└─────────────┘ └─────────────┘
```

## Multi-Backend Support

```
ralph run
    │
    ▼
┌─────────────────────┐
│ Resolve backend     │
│ (flag → config →    │
│  auto-detect)       │
└──────────┬──────────┘
           │
           ▼
    ┌──────────────┐
    │              │
    │   Backend    │
    │              │
    └──────┬───────┘
           │
    ┌──────┴──────┬──────────┬──────────┬──────────┬──────────┬──────────┐
    │             │          │          │          │          │          │
    ▼             ▼          ▼          ▼          ▼          ▼          ▼
 claude         amp       codex      gemini      kiro     copilot   opencode
```

## Comparison: snarktank/ralph vs ralph-orchestrator

```
snarktank/ralph                    ralph-orchestrator
──────────────────────────────────────────────────────────────────
PRD → prd.json (lossy)             PRD stays in specs/ (preserved)

passes: true/false                 Task system (.agent/tasks.jsonl)

No quality gates                   Backpressure enforced

Single persona                     Hat system (multiple personas)

Bash script loop                   Rust event loop

Amp or Claude only                 7 backends supported
```
