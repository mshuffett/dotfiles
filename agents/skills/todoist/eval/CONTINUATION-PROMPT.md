# Continuation prompt (hand this to an autonomous runner, e.g. "goal")

Copy the block below and send it. It points at the process doc and lets the agent continue to
completion without blocking. It self-describes state via the README's **Current state** section.

---

```
Continue the Todoist context-recovery eval.

Read agents/skills/todoist/eval/README.md in full — it is the single source of truth for the
goal, the staged pipeline (plan -> retrieve -> act), the file layout, the core principles, and
the Current state / next steps. Then continue the loop autonomously:

- Work one stage at a time for the current round's tasks. Do NOT block waiting for Michael's
  approval between stages — make each stage's output inspectable on disk and in the HTML, and
  keep going.
- WITHHOLD any human-authored triage-guidance comment from the stage agents (it is the oracle;
  use it only when scoring). Genuine task descriptions/comments ARE allowed context.
- Cache everything fetched under agents/skills/todoist/fixtures/private/cache/ and reuse it —
  never re-fetch data you already have.
- After each stage: write runs/round-N/<stage>.json, run
  `python agents/skills/todoist/eval/generate_review.py <that file>` to regenerate the HTML,
  append a summary to fixtures/private/rounds-log.md, and update README.md's Current state.
- When Michael sends back a corrections-*.json, fold it into fixtures/private/recovery-evals.json
  (flip candidates to verified gold, record acceptable alternatives + accessibility), update the
  SMALLEST artifact that should change (triage-process.md / a knowledge fact / the dataset), then
  re-run cold on the held-out set to confirm it generalized.
- NEVER commit anything under fixtures/private/ (it contains PII). Verify with `git check-ignore`.

Continue until the Definition of Done in README.md is met on the held-out set, then stop and
summarize what changed and what (if anything) still needs Michael.
```
