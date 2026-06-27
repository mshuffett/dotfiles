---
name: claude-code-orchestration
description: >
  Use when building a skill, command, or Workflow script that orchestrates OTHER Claude Code
  primitives — chaining one skill into another, triggering a slash command programmatically,
  writing a Workflow JS script, building an autonomous goal/pursue-verify loop, or figuring out
  whether a `/command` can be invoked without the user typing it. Trigger on questions like
  "can a skill trigger /X on its own?", "make a meta-skill that runs /goal", "chain skills",
  "my workflow args aren't binding", or "what would that workflow file look like". NOT for
  TeamCreate swarms (use agent-teams) or fire-and-forget subagents (use
  superpowers:dispatching-parallel-agents).
---

# Claude Code Orchestration

How to compose Claude Code's own primitives — skills, slash/UI commands, subagents, and
`Workflow` JS scripts — into automation that runs without the user driving each step. This is
the mechanics layer: what *can* be chained, what *cannot*, and the gotchas that look like
platform bugs but are usage errors.

## The composition primitives (and what each can trigger)

| Primitive | Invoke from agent? | Deterministic? | Use for |
|-----------|-------------------|----------------|---------|
| **Skill** (`Skill` tool) | Yes — by name | No (model decides) | Activatable knowledge/procedures |
| **Slash command** (e.g. `/code-review`) | Sometimes — many are *UI commands* | No | User-facing commands |
| **UI command** (e.g. `/goal`) | **No** — Skill tool refuses | n/a | Commands gated behind the UI |
| **Subagent** (`Agent` / `Task`) | Yes | Yes (you control fan-out) | Isolated work, parallelism |
| **Workflow** (`Workflow` tool, JS) | Yes | Yes (script is deterministic) | Loops, fan-out, pipelines, pursue→verify |
| **Hook** (settings.json) | n/a — harness fires it | Yes | Guaranteed before/after automation |

## Skill chaining is instruction-driven, NOT a hard contract

A skill can invoke another skill two ways:
1. **Description auto-trigger** — if the running task matches another skill's `description`, the
   agent may invoke it on its own.
2. **Explicit body instruction** — a SKILL.md body that says "Invoke the `X` skill before
   proceeding" will be followed.

But there is **no frontmatter field that the harness enforces** ("automatically calls skill X").
Chaining is probabilistic — the model chooses to follow the instruction; nothing guarantees it.
**If you need deterministic chaining, do not rely on a skill calling a skill.** Use a **hook**
(fires every time) or a **Workflow script** (explicit `agent()`/`workflow()` calls), or a slash
command that scripts the sequence.

## Not every `/command` is invocable via the Skill tool

Some slash commands are **UI commands**, not skills. Calling `Skill("goal")` returns:

> `goal is a UI command, not a skill. Ask the user to run /goal themselves — it cannot be
> invoked via the Skill tool.`

Implications when designing a meta-skill that wants to "auto-run /goal" (or any UI command):
- You **cannot** trigger it programmatically. The Skill tool will refuse.
- Workarounds: (a) **reimplement the loop yourself** as a Workflow script (often the cleanest —
  see pursue→verify below); (b) **tmux keystroke injection** to type the command into the pane;
  (c) build a **hook**. Pick (a) unless you specifically need the UI command's own UX.
- Before assuming a command is chainable, just try `Skill("<name>")` once — the error tells you
  immediately whether it's UI-only.

## The Workflow `args` gotcha (looks like a bug, is a usage error)

**Pass `args` as an actual JSON value, never a JSON-encoded string.**

```js
// WRONG — args arrives as the string "{\"goal\":\"...\"}"; args.goal is undefined
Workflow({ script, args: JSON.stringify({ goal: "...", criterion: "..." }) })

// RIGHT — args arrives as the object; args.goal works
Workflow({ script, args: { goal: "...", criterion: "..." } })
```

Inside the script, `args` is the value you passed **verbatim**. If a field read returns
`undefined` and a fail-fast guard trips with "args not bound", check the *type* before declaring
the platform broken: a stringified value reaches the script as one string, so `args.x` / `args.map`
fail. Either pass a real object/array, or `JSON.parse(args)` at the top of the script.

**Meta-lesson (this is why the rule exists):** in this session the agent concluded "args is
broken" and the user pushed back — "maybe you don't understand how to use it properly." The agent
was wrong; args binds fine. **Before declaring any orchestration primitive broken, write a
one-line probe** (`agent("return JSON of typeof args and the raw value", {schema})`) and *read the
actual value*. Verify, don't theorize.

## Pattern: autonomous pursue→verify goal loop (the DIY `/goal`)

When `/goal` (or any UI command) can't be chained, emulate the goal-seeking loop in a Workflow
script. Two phases per iteration:

1. **Pursue** — an agent takes one concrete step toward the goal.
2. **Verify (adversarial)** — a *separate* agent independently checks whether the criterion is
   met. Force a schema `{ met: boolean, evidence: string, nextStep: string }` and instruct it:
   "Actually check it — run the command, inspect the file, observe the value. Default to
   `met=false` unless you have hard evidence. Do not take the pursue agent's claim on faith."

Guards that make it cheap and safe:
- **Fail-fast on unbound spec**: if `goal`/`criterion` are missing, abort at iteration 0 (≈0
  tokens) instead of spinning N iterations against an empty goal.
- **Budget guard**: `while (budget.total && budget.remaining() > 50_000)` so a stuck loop can't
  run away.
- **Hard iteration cap** as a backstop even with the budget guard.

The adversarial verifier is what prevents the pursue agent's optimistic "done!" from triggering a
false exit. Validated in-session: a counter 0→1→2 loop cleanly failed-then-succeeded, exit driven
by independently-observed evidence, not the worker's self-report.

## Workflow scripts have no filesystem / no Date.now / no Math.random

- Scripts can't read or write files directly — parameterize via `args` (a real JSON value) or
  bake the spec into the script / thread it through agent prompts. Agents *spawned by* the
  workflow have full tools.
- `Date.now()`, argless `new Date()`, and `Math.random()` throw (they'd break resume). Pass
  timestamps via `args`; vary randomness by agent index/prompt.

## Decision: which orchestration primitive?

- **Need it to fire every time, no model discretion** → hook.
- **Need a loop / fan-out / pipeline / pursue→verify** → `Workflow` script.
- **Need workers to message each other and self-coordinate** → `agent-teams` (TeamCreate).
- **Need independent parallel tasks, results reported back** → subagents (`superpowers:dispatching-parallel-agents`).
- **Want a skill to lean on another skill's knowledge** → instruction in the body, accepting it's
  probabilistic.
