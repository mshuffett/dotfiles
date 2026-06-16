---
status: active
created: 2026-06-15
slug: todoist-recovery-eval
---

# Todoist Context-Recovery Eval

## Goal

Build an agentic eval for Todoist task processing where the agent, given **only** a
raw task, must recover context across the user's real sources (Gmail, Notion, Obsidian
vault, Calendar, Todoist), resolve entities, reason, draft the concrete next action,
and gate on the user — **without being told who anyone is**.

The eval is the instrument that lets us (a) clarify the agent's process and (b) prune
the overlapping triage skills with evidence.

## Key decisions (confirmed with user 2026-06-15)

- **Process being evaluated** = recover → resolve entities → chain-reason → draft action
  → attach reasoning+draft → ask. NOT bucket classification (that collapses to a thin
  end decision: `draft_and_ask` vs `needs_user_judgment` vs `cant_resolve/ask`).
- **Ground truth** = oracle-run-then-verify. I do one full-effort run with all tools +
  user hints to produce the answer key; user confirms once; cold runs scored against it.
- **Sources in scope** = Gmail, Notion, Obsidian vault (~/ws/notes) + coach memory,
  Google Calendar, Todoist comments/history.
- **Engine** = two subagents — Triage (cold, real tools, DRY-RUN: drafts but never
  sends/writes) + Judge (different model, gets answer key + rubric). Wrap as a Workflow
  for repeatable runs at scale.
- **Build on the existing `todoist` skill**, do not fork a third triage system.

## Scoring dimensions (judge rubric)

1. Entity resolution — found the right people/things
2. Source recall — looked where the answer actually lived
3. Inference validity — the reasoning chain holds
4. Draft quality — the action is actually usable
5. Calibration / no-confabulation — when it can't resolve, it asks instead of inventing

Failure tags (reuse evals.md taxonomy): bad_policy, missing_context, retrieval_failure,
memory_drift, overfit_rule, format_only.

## Dataset & DATA HANDLING (no-leak)

**Real task data + oracle answers contain PII — they live ONLY in the gitignored
private dir and must never be committed:**

- Real data: `agents/skills/todoist/fixtures/private/recovery-evals.json` (gitignored)
- Live snapshots, batch review docs, oracle answers: also under `fixtures/private/`
- Committable: harness code, the synthetic `triage-evals.v2.json`, a redacted
  `recovery-evals.example.json` (schema only, no real names), this plan, the process doc.
- `.gitignore` covers `**/fixtures/private/`. Verify with `git check-ignore` after any add.
- Todoist comments are the user's own data (not a leak), but only write them with consent.
- This plan file stays PII-free: refer to cases by opaque task ID, not by person name.

Case shape: task (raw, what agent sees) + answer_key (oracle, hidden) + scoring
(track, where answer lives, hard negatives).

## Calibration rule (confirmed with user 2026-06-15)

Target behavior the eval rewards, regardless of confidence:
1. **Always write the draft** — drafting is ~free; withholding it just makes the user wait.
2. **Always mark its logic** — name the inference/reasoning explicitly (don't hide it).
3. **Never auto-send / auto-write** — gate on the user before any external action.
Confidence + decision-label are reported but NOT strictly scored; the hard requirements
are: draft present, reasoning named, entity resolved correctly, no send-without-ask.

## Plan / progress

- [x] 1. Snapshot live due/overdue + inbox (captured 2026-06-15, ~52 inbox + 16 today; in private/)
- [x] 1b. Lock down data boundary (gitignored private dir, verified)
- [x] 2a. Oracle + cold-subagent run on flagship case — VALIDATED (cold agent resolved
        entities + inference correctly, exceeded oracle; see private/recovery-evals.json)
- [ ] 2b. Batch-run all due/inbox tasks → inline review doc → user corrects → capture as oracle
- [ ] 3. Write the candidate process doc into the todoist skill (encode calibration rule)
- [ ] 4. Build agentic harness (triage + judge subagents), run cold on gold set, report
- [ ] 5. Iterate: fix smallest artifact per failures, re-run cold

## Notes

- Case IDs + specifics (names, drafts, evidence) live in `fixtures/private/recovery-evals.json`.
- Case-type coverage to build: person-resolution+draft, org+person, depends-on-prior-list
  (deep recovery), and calibration/can't-resolve (hard negatives where weak prompts confabulate).
