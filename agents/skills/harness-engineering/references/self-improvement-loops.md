# Self-Improvement Loops (agent improves its own harness)

Most of this skill is about agents improving a *codebase*. This file covers the
adjacent case: a loop where the agent improves **its own harness** — its skills,
memory, and instruction files — automatically, between sessions. Modeled on
NousResearch's **hermes-agent** (`agent/background_review.py` + `agent/curator.py`):
eager automatic capture, balanced by a consolidation/decay curator.

Michael's concrete implementation lives at `~/.dotfiles/claude/self-improve.md`
(SessionEnd skill reviewer + weekly skill curator + memory→dotfiles backup). This
file is the *generalizable design* so a future harness-engineering session can
build one anywhere.

## The shape

Two opposing forces, never one without the other:

1. **Eager reviewer** — fires at the end of each session (a `SessionEnd` hook
   forking a fresh agent on the just-ended transcript). Biased toward action:
   "nothing to save" is a real option but must NOT be the default. Creates/patches
   skills and/or memory.
2. **Curator** — runs on a slow cadence (e.g. weekly via launchd/cron).
   Consolidates one-session artifacts into class-level umbrellas, archives unused
   ones, dedupes, prunes stale entries. This is the entropy gate; without it the
   library rots. (Mirror of this skill's Entropy Management section, pointed at
   the harness's own knowledge files instead of the codebase.)

**Design rule: eager-create, then consolidate-and-decay.** Don't try to make
creation perfect at capture time — let the reviewer be liberal and make the
curator the quality net. Removing the curator while keeping the reviewer is the
failure mode that produces slop.

## Before building one: subtract what the harness already does

The most expensive mistake is rebuilding native capability. Inventory first:

- Claude Code's `autoMemoryEnabled` already does eager **memory** capture per
  session; `autoDreamEnabled` is already the memory **curator** (consolidate,
  dedupe, prune, absolutize dates after ≥24h + ≥5 sessions).
- So the *only* gap on Claude Code is **skills**: native memory/dream never touch
  them. Build the skill reviewer + skill curator; leave memory to native auto-memory.

Generalize: enumerate the harness's built-in lifecycle hooks and auto-behaviors
before writing any loop. Build only the missing half.

## Design invariants (the hard-won ones)

- **Off the critical path.** The reviewer is fire-and-forget — detached at
  `SessionEnd`, gated to sessions with ≥N real user turns (cost gate), deduped per
  session id. It must never block the interactive session ending.
- **Recursion guard.** The reviewer/curator run the agent CLI with an env var
  (e.g. `CLAUDE_SELF_IMPROVE=1`); the hook bails when it sees that var, so the
  review's own `SessionEnd` doesn't re-trigger the reviewer. Any
  self-hook-firing loop needs this.
- **Scoped commits only.** The reviewer commits ONLY the files it itself
  created/modified (diff against a pre-run snapshot). It must never sweep up
  unrelated working-tree edits. Same for the memory-sync step.
- **Protected paths.** Whitelist exactly one writable skills dir; never touch
  plugin/marketplace skills or any `pinned: true` skill.
- **Versioned, legible store.** Write the agent's memory/skills into a git-backed
  repo (here: symlink `~/.claude/projects/*/memory/` into the dotfiles repo), not
  a local-only store — so the knowledge is reviewable and survives machine loss.
  (Agent Legibility, applied to the harness's own memory.)

## Pitfall: the background reviewer must be exempted from *interactive-only* guardrails

This is the correction that produced the pattern. The user's CLAUDE.md has a hard
rule: "STOP before writing any skill file — invoke `skill-creator` first." That
rule exists to gate a *live, interactive* agent. But the **background reviewer
cannot call an interactive skill-creator** — it runs headless. If you naively
apply the interactive guardrail to the background path, you either break the loop
or (worse) the agent reads "get rid of the skill thing" and tears down the whole
reviewer.

The fix is a **scoped exemption**, not deletion:
- Carve out the background reviewer as the one sanctioned path that may
  create/modify skills without the interactive gate.
- Bake the gated tool's quality bar *into the reviewer's own prompt* (class-level
  naming, required frontmatter + trigger description, anti-slop list) so quality
  isn't lost.
- Let the curator be the safety net that catches anything sub-bar.

Generalize: when a guardrail is written for the interactive agent, check whether
an automated/headless path also trips it. If so, exempt the automated path
explicitly and relocate the guardrail's *intent* (not its mechanism) into that
path's prompt.

## Pitfall: "kill it" is ambiguous — confirm scope before tearing down working code

When the user said "get rid of the skill thing entirely," the prior agent
deleted the entire skill-review half; the user had meant only "kill the
*requirement to call skill-creator*." Before ripping out a working subsystem on a
terse instruction, restate which component you're about to remove and confirm —
removal is hard to reverse and the cheapest disambiguation is one sentence.
