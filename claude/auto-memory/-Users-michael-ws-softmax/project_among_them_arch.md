---
name: project-among-them-arch
description: Among Them bot architecture — Nim bot is thin HTTP client to local FastAPI policy server with hot-reloadable strategies
metadata: 
  node_type: memory
  type: project
  originSessionId: c45d893b-5ebc-4a58-8aa9-cbdb5571e876
---

Architecture: thin Nim Docker bot + local FastAPI policy server + cloudflared tunnel.

**Components:**
- Nim bot (`amongthemstarter.nim` ~4900 lines) — screen-reading + websocket protocol + thin HTTP clients (`llm_vote.py`, `llm_chat.py`, `llm_intent.py`) that POST to policy server
- Policy server (`policy_server/server.py` FastAPI async) — receives state, applies named strategy from `strategies.py`, calls Anthropic API, returns decision
- Persistent tunnel `michael-dev-4000.geteverything.ai` → localhost:4000 (cloudflared `linq-dev` named tunnel)
- Anthropic API (not Bedrock — Bedrock daily quota hit). `ANTHROPIC_API_KEY` in env.

**Decision endpoints:**
- `/vote` → int 0..skip_index (which slot to vote for). Opus 4.5 baseline.
- `/chat` → color name (Nim wraps as `"<Color> sus"` + spams 60+ times per meeting). Opus 4.5 baseline.
- `/intent` → hierarchical action: kill, report_body, call_emergency, go_to_room, go_to_task, follow, wait, vent, do_task. Sonnet 4.5 baseline.

**Why:** lets us iterate prompts in ~10s (edit `strategies.py` → restart server → next cloud /intent call uses new logic) without rebuilding Docker (~30 min for placement after resubmit).

**Why:** game-theoretic reward formula `1*tasks + 10*kills + 100*win` makes WIN the dominant term; LLM prompts emphasize EV math + AoPS-style vote thresholds (40% confidence) + AmongAgents persona findings (Manipulator/Paranoid imp, Tech-Expert/Leader crew).

**How to apply:**
- Before resubmitting, exhaust server-side options first
- Run `policy_server/test_intent.py --server http://localhost:4000` after prompt edits (14 cases covering schema + behavior + regression)
- Server logs at `/tmp/policy_server.log`; archived dumps in `/tmp/policy_archives/`
- Monitor cloud bot behavior via `grep "→ intent=|→ vote=|→ color="` in log
- Cloud queue / EWMA-half-life-2hr is the score-update bottleneck — be patient, iterate prompts in the meantime

**State the bot sends to /intent:** color, role, alive list, my room+pos, kill_cooldown, visible_players, visible_bodies, last_seen tracking, event_log (last 30 events: saw/body_seen/role_revealed/etc.), prior memory carryover. Server treats `alive_colors.len` as authoritative (Nim crew_alive/imp_alive counts are best-effort estimates).

**Last-resubmit commitment:** any future bot Nim change is a budget-blowing decision. Server-side prompt iteration is the default workflow.

Related: [[cloudflared-tunnel-ua-block]] (browser UA required for Python HTTP through Cloudflare), [[autonomous-self-driving]]
