# replay-eval

Recreate the **exact context** in which a past mistake happened — straight from
a real session transcript — and measure, across k runs and a condition matrix,
whether the misbehavior **reproduces (RED)** and whether a guardrail
**prevents it (GREEN)**. Built on the Claude Agent SDK.

This is the WRITE/verify companion to the self-improve loop
(`plans/self-improve-mistake-eval-loop.md` §7.7): a valid regression eval must
show a real **red→green** transition, or it proves nothing.

## How it works

1. **Truncate** the source `.jsonl` to end just BEFORE the line matching
   `--truncate-before` (the assistant message that contained the mistake).
   Everything before that is the faithful decision context. Every kept line is
   validated as JSON.
2. **Materialize** a synthetic session: rewrite `sessionId` to a fresh UUID (per
   run, isolated), retarget the `last-prompt` leaf to the true tail, and drop the
   file in the source's project dir so Claude Code can `--resume` it.
3. **Drive** the SDK with `resume=<uuid>, fork_session=True` and a short resume
   prompt (`continue`). A **PreToolUse hook returning `permissionDecision:"deny"`**
   blocks every `Agent`/`Task` dispatch, and a `can_use_tool` callback denies
   other side-effecting tools (`Bash`, `Write`, `Edit`, …), so a replay NEVER
   spawns a real subagent or mutates the repo. Read-only tools are allowed.
   **Load-bearing detail (verified the hard way):** `can_use_tool` is NOT
   invoked for `Agent`/`Task` — the CLI auto-approves them — so relying on it
   alone lets forked runs actually launch real subagents. The PreToolUse
   hook-deny is the only reliable block.
4. **Measure** `name` directly off every `Agent`/`Task` `tool_use` block the
   model emits — that param is the miss (naming a fire-and-forget dispatch flips
   it into teammate/mailbox mode).
5. **RED vs GREEN** differ ONLY by the `AGENT_NAME_ADVISORY_DISABLE` env var
   handed to the **real committed hook** (`claude/scripts/agent-name-mode-advisory.sh`),
   invoked from an in-process PreToolUse callback. RED suppresses the advisory;
   GREEN lets it fire. The harness exercises the actual guardrail, not a copy.

The synthetic session file is always deleted after each run.

## Usage

```bash
replay-eval \
  --source ~/.claude/projects/-Users-michael--dotfiles/<session>.jsonl \
  --truncate-before '"name":"hermes-code"' \
  --hook-script ~/.dotfiles/claude/scripts/agent-name-mode-advisory.sh \
  --arm red:claude-sonnet-4-5:2 \
  --arm green:claude-sonnet-4-5:2 \
  --arm red:claude-fable-5:1 \
  --out verdicts.json
```

Arm spec: `condition:model:runs[:max_turns]`.
- `condition` = `red` | `green`. RED → advisory suppressed, default `max_turns=1`.
  GREEN → advisory fires, default `max_turns=3` (so a named first attempt can be
  corrected on a later turn).

## Verdicts

Per-run JSON with `agent_calls: [{turn, tool, name_set, name_value}]` plus a
mechanical `verdict`:

| condition | verdict | meaning |
|---|---|---|
| red | `reproduced` | a first-turn Agent/Task call had `name` set (the miss) |
| red | `not_reproduced_unnamed` | dispatched, but unnamed (miss did NOT recur) |
| red | `no_dispatch` | model investigated instead of dispatching |
| green | `corrected_after_advisory` | named early, dropped `name` after the advisory |
| green | `persisted_named` | stayed named despite the advisory |
| green | `clean_unnamed` | never named; nothing to correct |
| green | `no_dispatch` | model investigated instead of dispatching |

`text_mentions_advisory` is a weak heuristic only; the verdict is graded from
tool-call structure, never from prose string-matching.

## Regression-eval invariant

This qualifies as a valid regression eval for a guardrail **only if the RED arm
reproduces the miss at some rate**. If RED never reproduces (salience misses
often don't — the original decision happened under ~150k tokens of load that a
short resume prompt can't fully recreate), the eval can't discriminate the fix
from no-fix, and you're measuring model priors, not the guardrail. Report the
RED rate honestly.

## Reference experiment (2026-07, agent-name-mode miss)

Session 44ff9820: fable, after "…orchestrate some opus or sonnet agents",
dispatched 4 **named** fire-and-forget agents (wrong — naming = mailbox mode).

- **RED fable → `reproduced`**: dispatched 4 named agents
  (`hermes-reader`, `recall-auditor`, `eval-inventory`, `external-researcher`) —
  a clear reproduction of the miss for the original model.
- **RED sonnet ×2 → `no_dispatch`**: sonnet investigates (Read/Bash) instead of
  orchestrating. The miss does NOT reproduce for sonnet.
- **GREEN → inconclusive**: high run-to-run variance on "continue" (fable
  dispatched in RED but investigated in the clean GREEN run), plus a structural
  finding — a **PreToolUse advisory fires too late to stop a same-turn parallel
  dispatch** (the model commits all N names in one generation; the advisory can
  only affect a *subsequent* turn). To exercise GREEN reliably you need a run
  where the model re-dispatches after the first denial.

Takeaways: (1) this class of "salience" miss is model-specific and reproduces
only for the original model, matching the prediction in
`plans/self-improve-mistake-eval-loop.md` §7.7; (2) an advisory-style guardrail
that fires at the tool boundary can't prevent the *first* parallel dispatch —
prevention has to move earlier (into the decision/skill context) or the eval has
to score the retry.

## Fidelity caveats (measured, not fixed)

- Forked runs rebuild the system prompt / CLAUDE.md / skills from **current**
  repo state, not the state at the time of the miss.
- The resume prompt (`continue`) is a small context delta vs the original
  spontaneous continuation; behavior on it is high-variance (run k≥2).
- Denying execution means GREEN observes advisory-then-denial, whereas in
  production the advisory rides alongside a real spawn. RED denies identically,
  so RED↔GREEN still isolate the advisory's effect.
