---
name: orchestrator-delegate-implementation
description: "User directive — in openbookface, act as orchestrator: dispatch all implementation to subagents/workflows, never do grunt work directly"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

In the openbookface project (autonomous Bookface-clone build), the user corrected me mid-run (2026-06-11): "i would have expected you to already be using workflows and subagents more because you are supposed to be more of the orchestrator not the grunt worker."

**Why:** The project's PLAYBOOK.md §5 defines me as orchestrator (plan, decompose, dispatch, review, integrate); implementation belongs to subagents. I drifted into solo implementation because it felt faster.

**How to apply:** Default-dispatch every implementation task via Workflow/Agent with disjoint file ownership; set model explicitly per [[subagent-model-policy-openbookface]]. Orchestrator-direct only for: planning, specs, architecture, review, integration, state files, commits. Exceptions need written justification in the task file. Recorded in repo at state/PITFALLS.md P-001 and state/PROCESS.md orchestration rules.
