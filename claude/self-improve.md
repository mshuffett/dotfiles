# Claude Code self-improvement system

Ports the distinctive trait of NousResearch's **hermes-agent** — eager,
automatic capture of skills + memory, balanced by a consolidation/decay
"curator" — onto Claude Code. See `~/ws/hermes/agent/background_review.py` and
`agent/curator.py` for the upstream originals this is modeled on.

## What Claude Code already does natively (do NOT rebuild)

- **`autoMemoryEnabled`** (settings.json) — eager memory capture during every
  session → writes to `~/.claude/projects/<slug>/memory/`.
- **`autoDreamEnabled`** — the memory *curator*: after ≥24h + ≥5 sessions it
  consolidates, dedupes, prunes stale notes, absolutizes dates. This is hermes's
  curator, but **memory-only**.

Native auto-memory/dream never touch **skills**. That missing half — eager skill
capture + a skill curator — is what this system adds.

## Components

| Piece | File | Trigger | Does |
|---|---|---|---|
| Skill reviewer | `claude/scripts/self-improve-skill-review.sh` | `SessionEnd` hook | Forks Opus on the just-ended transcript; creates/patches skills in `~/.dotfiles/agents/skills/`. Memory left to native auto-memory. |
| Review prompt | `claude/prompts/self-improve-skill-review.md` | — | The "be ACTIVE / nothing-to-save isn't the default" + anti-slop + class-level-naming prompt, adapted from hermes `_SKILL_REVIEW_PROMPT`. |
| Skill curator | `claude/scripts/self-improve-skill-curator.sh` | weekly launchd | Consolidates one-session skills into class-level umbrellas, archives unused. Uses `~/.claude/skill-firing.jsonl` as usage data. |
| Curator prompt | `claude/prompts/self-improve-skill-curator.md` | — | Adapted from hermes `CURATOR_REVIEW_PROMPT`. |
| Curator schedule | `launchd/com.michael.claude-skill-curator.plist` | Sun 03:30 | Runs the curator weekly. |
| Memory backup | `claude/scripts/sync-auto-memory.sh` | called by reviewer (idempotent) | Symlinks every `~/.claude/projects/*/memory/` into `claude/auto-memory/<slug>/` so native memory/dream write into the git-backed repo. |

## Design invariants

- **Eager create, then consolidate + decay.** The reviewer is biased toward
  action; the curator is the counterweight. Removing the curator would let the
  skill library rot — do not run one without the other.
- **Off the critical path.** The reviewer is fire-and-forget (detached at
  `SessionEnd`), gated to sessions with ≥`CLAUDE_SELF_IMPROVE_MIN_TURNS` (default
  5) real user prompts, and deduped per session id.
- **Recursion guard.** The reviewer/curator run `claude -p` with
  `CLAUDE_SELF_IMPROVE=1`; the hook bails when it sees that var, so the review's
  own `SessionEnd` doesn't re-fire it.
- **Scoped commits only.** The reviewer commits only the skill files it itself
  created/modified (diffed against a pre-run snapshot); `sync-auto-memory.sh`
  commits only `claude/auto-memory/`. Neither ever sweeps up unrelated dotfiles
  edits.
- **Protected skills.** Only `~/.dotfiles/agents/skills/` is writable; plugin/
  marketplace skills under `~/.claude/plugins/` and any `pinned: true` skill are
  never touched.

## Controls

- Disable reviewer: `touch ~/.claude/self-improve/DISABLED` (or export
  `CLAUDE_SELF_IMPROVE_DISABLE=1`).
- Disable curator: `touch ~/.claude/self-improve/CURATOR_DISABLED`.
- Tune cost gate: `CLAUDE_SELF_IMPROVE_MIN_TURNS=<n>`.
- Logs: `claude/logs/skill-review-*.log`, `claude/logs/skill-curator-*.log`.
- Load the weekly curator:
  `launchctl bootstrap gui/$(id -u) ~/.dotfiles/launchd/com.michael.claude-skill-curator.plist`

## Wiring (settings.json — the SessionEnd hook)

```json
"SessionEnd": [
  { "hooks": [ { "type": "command",
    "command": "bash \"$HOME/.dotfiles/claude/scripts/self-improve-skill-review.sh\"" } ] }
]
```
