# Team Configuration for Parallel Phase Planning

## Team Structure

```
Team: gsd-parallel-plan
├── Orchestrator (you, team lead)
│   Model: opus (complex cross-phase reasoning)
│   Role: Coordinate, review cross-phase impacts, make decisions
│
├── planner-phase-{N} (1 per phase, spawned in parallel)
│   Model: opus
│   SubagentType: general-purpose
│   Role: Research + plan a single phase
│   Tools needed: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, Context7
│
└── cross-phase-reviewer (spawned after all planners complete)
    Model: sonnet
    SubagentType: general-purpose
    Role: Red-team all plans for cross-phase conflicts
    Tools needed: Read, Bash, Grep, Glob
```

## Model Selection Rationale

| Role | Model | Why |
|------|-------|-----|
| Orchestrator | opus | Needs to reason about cross-phase impacts, resolve conflicts, make architectural calls |
| Phase Planner | opus | Planning is high-leverage — quality of plans determines everything downstream. Worth the cost for better task breakdown, dependency analysis, and must_haves derivation |
| Cross-Phase Reviewer | sonnet | Pattern matching across plans, structured analysis. Doesn't need deep reasoning, needs thoroughness |

**Override:** For simple phases (config changes, minor wiring), `sonnet` is sufficient. Default to `opus` for anything non-trivial.

## Spawning Configuration

### Phase Planner

```json
{
  "description": "Plan Phase {N}: {name}",
  "subagent_type": "general-purpose",
  "model": "opus",
  "team_name": "gsd-parallel-plan",
  "name": "planner-phase-{N}",
  "mode": "bypassPermissions",
  "prompt": "<see task-specs.md>"
}
```

**Key flags:**
- `mode: "bypassPermissions"` — planners need to read/write files freely
- `model` — always explicit, never rely on inheritance (known bug)
- `name` — must be descriptive for orchestrator to identify

### Cross-Phase Reviewer

```json
{
  "description": "Red-team review all phase plans",
  "subagent_type": "general-purpose",
  "model": "sonnet",
  "team_name": "gsd-parallel-plan",
  "name": "cross-phase-reviewer",
  "mode": "bypassPermissions",
  "prompt": "<see task-specs.md>"
}
```

## Task Directory Setup

Teams use `~/.claude/tasks/{team-name}/` for task coordination. TaskCreate writes to this
directory when a team is active.

Create tasks BEFORE spawning agents so they can claim work:

```bash
# Task per phase
TaskCreate(
  subject="Plan Phase {N}: {name}",
  description="Research and plan phase {N}. See prompt for full context.",
  activeForm="Planning Phase {N}"
)
```

## Communication Protocol

### Planner → Orchestrator (on completion)

```
SendMessage(
  type="message",
  recipient="team-lead",
  content="Phase {N} planning complete. Created {X} plans in {Y} waves.
    Plans: {list of PLAN.md files created}
    Research: {RESEARCH.md path}
    Key decisions: {brief list}",
  summary="Phase {N} planning complete"
)
```

### Planner → Orchestrator (on blocker)

```
SendMessage(
  type="message",
  recipient="team-lead",
  content="Blocked on Phase {N}: {description of blocker}.
    Need: {what's needed to continue}",
  summary="Phase {N} blocked"
)
```

### Orchestrator → Planner (revision request)

```
SendMessage(
  type="message",
  recipient="planner-phase-{N}",
  content="Cross-phase review found issues: {issues}. Revise plans.",
  summary="Revision needed for Phase {N}"
)
```

### Orchestrator → All (shutdown)

```
SendMessage(
  type="shutdown_request",
  recipient="planner-phase-{N}",
  content="All planning complete. Please shut down."
)
```

## File Ownership

To prevent merge conflicts, phases MUST own non-overlapping files. If overlap is detected
by the cross-phase reviewer, the orchestrator decides which phase owns the file and the
other phase's plan must reference it as a dependency.

## Scaling

| Phases | Planners | Expected Duration | Notes |
|--------|----------|-------------------|-------|
| 2 | 2 | ~5-10 min | Sweet spot |
| 3-4 | 3-4 | ~10-15 min | Good parallelism |
| 5+ | 5+ | ~15-20 min | Consider batching into groups |

More than 5 parallel planners increases coordination overhead. Batch into groups of 3-4
if planning many phases.
