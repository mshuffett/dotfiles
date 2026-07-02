---
name: quiet-background-agents
description: Michael wants background agents/heartbeats to not clutter the main conversation/tmux — minimize inline notifications; batch check-ins; consider detached tmux windows for long fleets.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: b4262ff6-fe11-47c7-92fb-31af933828f3
---

Michael (2026-07-01): "can you make those agents kind of not taking up this tmux real-estate — maybe move them to a different thing."

**Why:** every heartbeat timer firing, agent nudge, and duplicate teammate confirmation lands as a visible turn in his main session, crowding the actual work.

**How to apply:**
1. No short inline heartbeat timers by default. Agents notify on completion anyway; arm at most ONE long fallback (20min+) only for genuinely hang-prone work, and prefer checking status opportunistically when already re-invoked for another reason.
2. Prompt every background agent: send exactly ONE message to main (the final deliverable); no interim confirmations; no "already delivered" replies (nudges cause reply-chatter — nudge only when a deadline is truly blown).
3. For long/chatty fleets, offer running them detached in a separate tmux window (e.g. `tmux new-window -d` with a `claude -p` worker or a workflow watched via /workflows) so their output never enters the main session.
4. **Dispatch subagents UNNAMED by default** — naming switches to teammate/mailbox mode (idle notifications, nudge-reply chatter, reports not auto-returned). Unnamed = fire-and-forget, report returns automatically, zero noise. Name an agent ONLY when mid-run messaging is genuinely needed.
