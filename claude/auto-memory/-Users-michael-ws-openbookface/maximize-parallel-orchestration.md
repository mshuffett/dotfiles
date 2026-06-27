---
name: maximize-parallel-orchestration
description: User feedback — increase the amount of parallel work; overlap next-sprint research/planning with current-sprint implementation
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

User feedback (2026-06-11, openbookface): "perhaps the amount you are doing in parallel could be increased." Reinforced harder same night: "you could plan out a lot more and have a much more efficient dag with significantly more parallelism."

**Why:** Wall-clock throughput matters for this long-running autonomous build; the orchestrator was running one workflow at a time and idling between review gates.

**How to apply (v3 — pipeline-flow, user-corrected):** Flow mode means the Workflow tool's `pipeline()` — every feature dispatched at once, each flowing impl→verify→review independently (impl agents in `isolation:'worktree'`), with ONE mutexed merge stage integrating each into main as it arrives (whole-tree gates + commit per feature). NOT serial lanes (my over-correction after P-007), NOT parallel() barriers (Wave-1b's mistake). Merge is the only blocking point by design.
**(v2 — DAG model):** Plan the FULL remaining scope as a dependency DAG up front (state/DAG.md in repo). Execution = waves on the DAG, not milestone-serial sprints; milestone tags are ordered checkpoints. Key unlock: a wave phase-0 agent fills all shared-file gaps (repo extensions, shared utils), then feature verticals fan out with zero file overlap; an integration agent wires shared surfaces (nav links, cross-links) at the barrier. Also: (1) Always overlap pipeline stages: research/spec milestone N+1 while milestone N implements; run read-only audits/reviews concurrently with implementation. (2) Within workflows, shard large tasks further (e.g., seed content by domain: posts/KB/deals as separate agents). (3) Multiple concurrent workflows are fine when file ownership is disjoint — docs/research/, state specs, and read-only sweeps never conflict with app code. (4) The constraint is file ownership + review bandwidth, not agent count. (v3, 2026-06-12) User: "the workflow should be moreso of a pipeline… features are able to pass through, it shouldn't block on every feature being completed." Barriers only where a stage TRULY needs all siblings. Design: per-feature LANES (impl→verify→review→integrate→whole-tree-gate→commit→critique), with shared-surface edits (nav, cross-links) serialized through an async-mutex integration lane instead of an all-features barrier; each feature commits to green main the moment ITS lane is green (workflow commit agent; orchestrator reviews the commit series post-hoc with revert authority); user-facing deploys (play server) refresh per feature, not per wave. Related: [[orchestrator-delegate-implementation]], [[subagent-model-policy-openbookface]].
