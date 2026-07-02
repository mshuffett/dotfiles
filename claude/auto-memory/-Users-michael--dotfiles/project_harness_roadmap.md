---
name: harness-self-improvement-roadmap
description: "The three active plan files that together form the harness self-improvement roadmap (read/prove/clean) — check before any self-improve, recall, eval, or curator work."
metadata: 
  node_type: memory
  type: project
  originSessionId: 44ff9820-58b1-428c-887b-15c81e88a428
---

The harness self-improvement roadmap (as of 2026-07-01) is three active plans in `~/.dotfiles/plans/`, built in session 44ff9820 from a 4-agent research pass + a 107-agent deep-research run:

- `self-improve-recall-layer.md` — the READ half: wire `agent-recall` (works, was 19 days stale, auto-reindex + missing sources) into reviewer/curator/live sessions.
- `self-improve-mistake-eval-loop.md` — the PROVE half: mistakes.jsonl capture (Phase 1 SHIPPED — reviewer now detects neutral-question corrections and logs mistakes), red→green evals, regression suite, digest.
- `harness-maintenance-gc.md` — the CLEAN half: Friday-night curator + weekly self-improvement report → Todoist inbox (Michael's explicit ask, top priority), usage-decay lifecycle, mechanical sweeps. Michael declined a goal loop for this (2026-07-01) — execute opportunistically or when he asks, don't re-propose a goal loop.

Key tools/facts: `bin/replay-eval` (Agent SDK harness — replays a real transcript prefix to red→green test behavioral fixes; Agent/Task must be hard-denied via permissionDecision, `can_use_tool` is NOT invoked for them). The named-subagent miss is [[feedback-agent-name-mode]] territory: reproduced 1/1 on fable from real context, 0/2 on sonnet; PreToolUse advisories fire too late for same-turn parallel dispatches — decision-time CLAUDE.md placement is the effective layer.
