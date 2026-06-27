---
name: subagent-model-policy-openbookface
description: "User directive — never use Haiku; Opus-class for planning/review/complex subagent work, Sonnet for mechanical; never Fable for subagents"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

User directives (2026-06-11, openbookface session): "never haiku" — for anything. "more opus for planning and such and sonnet for mechanical."

**Why:** User prioritizes quality over token savings for this long-running autonomous build.

**How to apply:** Every subagent/Workflow agent() call sets model explicitly: `opus` for planning, review, design-heavy or complex implementation; `sonnet` for mechanical/routine work. Never `haiku`. Never Fable for subagents (orchestrator reasoning only). Recorded in repo at PLAYBOOK.md changelog A2, state/DECISIONS.md D-004. Related: [[orchestrator-delegate-implementation]].
