---
name: measure-methods-ship-visible-fast
description: "User feedback — iteration loops too slow, ~7h to first visible product; measure method timings, experiment deliberately, walking-skeleton-first"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4f516cf7-ef5c-433d-9d84-1c6a979fba06
---

User feedback (2026-06-12, openbookface): "it took way too long to get to a working version that i could see... iteration loops should be faster... it's something you should test in iterations like how long it took to use a certain method and experiment with that."

**Why:** Foundation-first milestone sequencing + barrier-shaped workflows produced ~2.7h to a login screen and ~7h to the first visible feature. The user values seeing real progress early; quality bars don't require breadth-first sequencing.

**How to apply:** (1) **Walking skeleton first**: in any greenfield effort, ship the thinnest fully-REAL vertical slice (visible in a browser, real data, real tests) before breadth/foundation work; deepen behind it. TTFV (time-to-first-visible) is a first-class metric — target <1h. (2) **Instrument methods**: keep a metrics log (openbookface: state/METRICS.md) — wall-clock, agents, tokens, repairs per workflow/method; every retro consults it and runs ≥1 queued experiment (first: flow-mode vs barrier-mode waves, E-001). (3) Treat orchestration shapes as hypotheses to A/B, not settled process. (4) **Pilot before fleet** (user, same night): run one representative item through a new workflow shape (~10-15 min canary) before committing a fleet to it. (5) **Supervise traces actively — and ARM the wake-up at dispatch**: between turns there is no mechanism to 'remember to check'; intention is not a timer. Same turn as launching any >20-min workflow: arm a Monitor with an UNCONDITIONAL 15-min heartbeat (not just stall alarms — busy-but-wrong never looks stalled) + per-completion events; each tick re-invokes me to sample live transcripts; intervene via stop→edit→resume (journal cache makes it cheap). (6) **Stop-and-take-control rule** (user, decisive): when a workflow underperforms (weak heartbeat progress or >2x time estimate), STOP it and finish with direct closely-supervised subagents on ~5-min loops — one concrete gap per agent, commit per green slice. Mega-workflows only for piloted, wide, mechanical fan-outs; convergence/tail work is always direct close-loop. Related: [[maximize-parallel-orchestration]], [[orchestrator-delegate-implementation]].
