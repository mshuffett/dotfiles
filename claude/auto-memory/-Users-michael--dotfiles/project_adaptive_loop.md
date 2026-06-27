---
name: Adaptive skill-profile loop state
description: As of 2026-04-20, the dotfiles skill-profile system has a working evidence→reflect→review loop. Know what's wired and where before touching it.
type: project
originSessionId: 09dbaba4-9056-4d05-a0a4-fa8bb41f478d
---
`bin/skill-profile.ts` is the control surface. It manages `~/.claude/skills` + `~/.codex/skills` symlinks (activation view of `~/.dotfiles/agents/skills/`) and rewrites `enabledPlugins` in `~/.claude/settings.json`. Commits `21b9ad4e` + `a20fbcf3` introduced the adaptive loop.

**What exists:**
- Profiles: `barebones`, `comms`, `daily`, `full`, `labs`, `omx`, `recommended` (Claude default)
- `recommended` = extends `full`, `includeArchived: false`, excludes `inbox-triage`, disables `agentops` plugin only
- Firing telemetry via Stop hook (`claude/scripts/skill-firing-hook.sh` → `bin/skill-firing-logger.ts`) → `~/.claude/skill-firing.jsonl`
- Subcommands: `stats`, `replay <skill> [--proposed <file>]`, `reflect <skill>`, `review`
- Proposals accumulate in `~/.claude/skill-proposals/{pending,accepted,rejected}/`; nothing auto-applies
- Meta-validated: weakening `mistake-tracking` description correctly flips replay ✓→✗

**Decisions with rationale (don't silently revert these):**
- **Kept** superpowers, skill-creator (CLAUDE.md-mandated), gsd, plannotator, everything-loop, plan-orchestrator, feature-dev. Why: user explicitly said *"i like gsd pretty well"* + overlap-isn't-the-problem framing. See `feedback_measurement_before_pruning.md`.
- **Disabled** agentops only. Why: 50-skill overlap with user's own canonical memory/learning stack; user agreed.
- **Archive filter** hides symlinks resolving into `skills.archive-*`. This catches `ralph-*`, `my-skill`, `yes-flag-test-skill`, etc.
- **No eval backfill yet.** Writing RED/CANARY prompts for every skill would be speculation. Add them per-skill when a real proposal arrives.

**How to apply (if user asks about the system):**
- Don't rebuild from scratch — the plumbing is there.
- If user wants to propose a skill edit: `skill-profile reflect <skill>` writes a proposal; review manually.
- If user wants to verify an edit: `skill-profile replay <skill> --proposed <file>` compares against mistake corpus.
- If they ask "how is it doing?": `skill-profile stats` — but warn that telemetry needs weeks to be meaningful.
- Telemetry Stop hook latency: logger p50=2ms/p95=7ms, wrapper ~4ms. If it ever feels slow, comment out the Stop hook entry before blaming the logger.
