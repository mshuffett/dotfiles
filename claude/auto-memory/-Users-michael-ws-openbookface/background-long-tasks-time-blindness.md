---
name: background-long-tasks-time-blindness
description: User preference — run anything potentially slow in background; state expected durations explicitly; design around model time blindness
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

User (2026-06-12, openbookface): "i would generally prefer running things in background if they might take some time. i think you should account for the time blindness more."

**Why:** Foreground long commands block the conversation and hide progress; models don't sense elapsed time, so duration must be handled mechanically, not intuitively.

**How to apply:** (1) Any command plausibly >30s runs with run_in_background + an expected-duration estimate stated when launching (so deviations are detectable). (2) Long autonomous work always has an armed wake-up (Monitor heartbeat / completion notification) — never an intention to check. (3) Prompts for sub-agents include cycle-time tripwires with concrete thresholds (e.g. "if a verify cycle exceeds 90s, switch lanes") because agents can't feel slowness either. (4) When reporting, compare actual vs estimated durations — drift is signal. Related: [[measure-methods-ship-visible-fast]], [[maximize-parallel-orchestration]].
