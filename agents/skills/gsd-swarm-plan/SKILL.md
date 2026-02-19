---
name: gsd-swarm-plan
description: >
  Plan multiple GSD phases in parallel using a team swarm. Use when planning 2+ phases simultaneously,
  when user says "plan phases in parallel", "swarm plan", or when multiple unplanned phases exist and
  can be planned concurrently. Orchestrates phase planner agents with cross-phase red-team review.
---

# Parallel Phase Planning with Swarm

Plan multiple GSD phases concurrently using Claude Code teams. One orchestrator coordinates
parallel phase planners, then a cross-phase reviewer red-teams all plans for conflicts.

## Prerequisites

- Active GSD project (`.planning/` exists with ROADMAP.md, STATE.md)
- 2+ phases to plan
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` enabled in settings

## Team Roles

| Role | Agent Type | Model | Count | Purpose |
|------|-----------|-------|-------|---------|
| **Orchestrator** | team lead (you) | opus | 1 | Coordinate, review, decide |
| **Phase Planner** | `general-purpose` | opus | 1 per phase | Research + plan one phase |
| **Cross-Phase Reviewer** | `general-purpose` | sonnet | 1 | Red-team all plans together |

See [references/team-config.md](references/team-config.md) for model selection rationale and agent configuration.

## Workflow

```
1. ANALYZE    — Identify phases to plan, load shared context
2. SPAWN      — Create team, launch parallel planners
3. PLAN       — Each planner runs the /gsd:plan-phase workflow (parallel)
4. RED-TEAM   — Cross-phase reviewer checks all plans together
5. REVISE     — If issues found, affected planners fix (max 2 rounds)
6. FINALIZE   — Commit plans, update roadmap, teardown team
```

### Step 1: Analyze

Use `/gsd:progress` logic to load project state and identify plannable phases. From the
roadmap analysis, identify phases where `plan_count == 0`. Confirm with user which phases
to plan in parallel.

Collect shared context to embed in each planner's prompt:
- `state_content`, `roadmap_content`, `requirements_content` (from `gsd-tools.js init`)
- Per-phase: any existing `CONTEXT.md` or `RESEARCH.md`

### Step 2: Spawn Team

```
TeamCreate(team_name="gsd-parallel-plan", description="Planning phases N, M, P in parallel")
```

Spawn one planner agent per phase — all in parallel. See [references/task-specs.md](references/task-specs.md) for prompt templates.

Each planner is spawned as:
```
Task(
  subagent_type="general-purpose",
  model="opus",
  team_name="gsd-parallel-plan",
  name="planner-phase-{N}",
  prompt=<phase_planner_prompt>
)
```

### Step 3: Parallel Planning

Each planner follows the same workflow as `/gsd:plan-phase` — they read the
`gsd-phase-researcher.md` and `gsd-planner.md` agent definitions and execute that
workflow for their assigned phase. Since team members are `general-purpose` agents,
they can spawn their own subagents (researcher, planner, checker) if needed.

The key difference from sequential `/gsd:plan-phase`: planners work simultaneously,
and the orchestrator adds cross-phase review afterward.

Orchestrator waits for all planners to report completion. If one gets stuck, provide guidance.

### Step 4: Cross-Phase Red-Team Review

Once ALL planners complete, spawn the cross-phase reviewer. This is the **novel step**
that doesn't exist in standard `/gsd:plan-phase` — it catches issues that only emerge
when plans are viewed together.

See [references/task-specs.md](references/task-specs.md) for the reviewer prompt template.

**Review Dimensions:**

| Dimension | What to Check |
|-----------|--------------|
| **File Conflicts** | Same file in `files_modified` across phases |
| **Assumption Contradictions** | Phase A assumes X, Phase B assumes not-X |
| **Missing Handoffs** | Phase N output needed by N+1 but not documented |
| **Scope Leakage** | Work belonging in another phase |
| **Shared Infrastructure** | Both phases need a utility neither creates |
| **Dependency Violations** | Plan assumes prior phase output that won't exist yet |
| **Success Criteria Gaps** | Combined plans miss roadmap success criteria |

### Step 5: Revision Loop (max 2 rounds)

If reviewer finds issues:

1. Orchestrator routes relevant issues to each affected planner via SendMessage
2. Planners make targeted edits (not full replans)
3. Re-run cross-phase review on updated plans
4. After 2 rounds, present remaining issues to user for decision

### Step 6: Finalize

1. Verify all plans committed (planners should have committed via `gsd-tools.js commit`)
2. Update ROADMAP.md with plan counts for each phase
3. Shutdown teammates, cleanup team via TeamDelete
4. Present summary with next steps

## Anti-Patterns

- **Don't skip cross-phase review.** Catching conflicts is the whole point.
- **Don't let planners message each other.** Route through orchestrator for coherence.
- **Don't replan from scratch on revision.** Targeted edits only.
- **Don't plan phases with informational dependencies simultaneously** where you need Phase N's exact output to plan Phase N+1. Execution-order dependencies are fine.
- **Don't duplicate GSD workflows.** Planners should read and follow the existing agent definitions, not get a rewritten version of them.

## When NOT to Use

- Only 1 phase to plan → `/gsd:plan-phase` directly
- No roadmap exists → `/gsd:new-project` first
- Phases are strongly informationally coupled (can't plan one without knowing other's output)
