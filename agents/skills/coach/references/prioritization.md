# Prioritization Protocol (living)

> **Status:** v0, living — not fixed. Updated as we run it. Seeded 2026-06-25.
> **Owner:** coach skill reference. Graduate to its own skill (via `skill-creator`) only once stable.
> **Why it exists:** Michael kept re-deriving the same plan from scratch each session (drift +
> duplication across Notion / Todoist / notes). The fix isn't a better plan — it's a *repeatable
> way to prioritize that captures its own reasoning*, so the next session reviews instead of
> re-reasoning.

## Core stance

- **Structure on read, not on write.** Author work as plain English. Dependencies, type, risk,
  priority are *inferred by reading*, not stored as fields. Low authoring friction is what keeps
  it current (heavy schemas are what make Michael avoid updating → drift).
- **Compute the question, not the answer.** The graph's job is to shrink the decision — hand the
  reasoner the ~5-10 startable items + context, not a numeric score. Math does bookkeeping
  (what's ready, what blocks what, fan-out). *Judgment* does the ranking.
- **Never launder judgment into false precision.** No `value ÷ effort` scores. Risk, uncertainty,
  time-sensitivity, leverage are *signals surfaced to reasoning*, never summed into a number.
- **Capture the because.** The rationale is the durable artifact. It's what stops the re-planning loop.

## The loop

1. **Surface the frontier** — what's genuinely startable now (hard deps clear).
2. **Reason, don't compute** — rank the frontier by judgment over: risk, leverage (fan-out / who's
   waiting), time-sensitivity, uncertainty. Front-load cheap unknowns (cheapest uncertainty-reducing
   step first). Write the *because* for the top few.
3. **Name the wedge** — the single next thing + why. "If only one thing happens, this is it."
4. **Lock + capture** — record the ranking and its rationale. Set the date range the plan is locked.
5. **Revisit only at the replan slot** — nowhere else. Re-planning outside the slot is the drift.

## Item shape (plain English)

One or two sentences that make legible, *in words*:
- what it is + what "done" looks like,
- what it's waiting on (→ dependency),
- why it matters / what's risky (→ judgment input).

Structure lives in the verbs: "waiting on" → edge · "riskiest" → risk · "figure out / recommend"
→ investigation · "unblocks" → leverage. The reasoner extracts; the human never fills a form.

## Views = lenses over the same items (derived, nothing stored)

- **Frontier** — what can I start now?
- **Today** — the one thing + the because.
- **My gates** — decisions waiting on me that block others.
- **Graph** — dependency edges + critical path to the week's goals.

## Presentation: by altitude, progressive disclosure

How Michael wants the plan *shown back* (not just ranked). A flat list at one level
reads as "everything is the same importance" — that's the drift, restated visually.
Present top-down by altitude, each level collapsible into the next:

1. **Goal at a glance, first.** The week's goal/objective is the alignment assumption —
   "if we're misaligned on that, everything below is wrong." It leads, always visible.
2. **Today's items** — what's actually happening today (e.g. "move the Todoist stuff"),
   one line each; expand for detail/sub-steps only if he opens it.
3. **The task set** — each with a *very clear one-line description* of what + done.

Be intentional about what shows at each level and how much detail is reachable on
demand — the failure mode is a view that isn't selective enough (shows too much flat)
or can't drill down when he wants more. Author in plain, legible markdown; when listing
discrete items prefer one item per letter/number (A, B, C…) over dense paragraphs —
Michael reads lettered/leveled markdown faster than prose blocks.
Tried this session: Notion page with collapsibles, and a standalone HTML view, as
candidate renderings of the same altitude structure.

## Cadence

- **Lock duration:** one short range (days), reset at each replan slot.
- **Replan slot:** Saturday (recurring). Only place the plan changes.

## Open questions / to improve

- Test the reasoning step with subagents (does a cold agent, given only the plain-English items,
  reproduce the same ranking + rationale? where does it diverge?).
- Decide where the canonical item list lives long-term (Notion relations vs prose file vs Todoist
  projection). For now: prose is source, Todoist is a projection of the frontier.
- Tune what risk/leverage signals are worth surfacing vs noise.

---

## Run log

### 2026-06-25 (Thu 21:41) — raise plan, first run
- **Decisions locked:** roles (Notion=plan · Todoist=tasks · Obsidian=notes, one-way Notion→Todoist);
  plan LOCKED through Sat 2026-06-27; replan slot = Saturday.
- **Frontier ranked for Fri 6/26:**
  1. Pitch deck v1 — wedge. Highest risk + gates 3 investor convos. Best deep-work block.
  2. Notion audit (`@cc`) — cheap, de-risks reorg, runs in background. First agent task.
  3. Top-of-funnel definition — fuzziest piece; resolve the unknown early.
  4. Re-engagement messaging + list (`@cc` drafts, Michael approves).
  5. Investor emails — important, time-sensitive, blocks nothing; batch in a defined slot.
- **Process note:** dogfooded the protocol on the real plan instead of building it abstractly.
  Worked: scoping a late-night session to *decisions + ranked plan* (no execution) kept it clean.
  To watch: whether the lock actually holds until Saturday.
