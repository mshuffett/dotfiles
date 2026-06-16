# Todoist Context-Recovery Eval — Process Doc

> **For a fresh / autonomous agent:** this file is the single source of truth. Read it
> top-to-bottom, check **Current state** at the bottom, then continue the loop. Real task data
> + oracle answers contain PII and live in the **gitignored** `../fixtures/private/` dir — NEVER
> commit them or anything under it. Everything in this `eval/` dir is committable (no PII).

## Goal

Calibrate a **general** prompt/process that, given only a raw Todoist task, recovers context
across Michael's real sources (Gmail, Notion, Obsidian vault, Calendar, Todoist), resolves
entities **to the extent the sources allow**, drafts the concrete next action, and gates on
Michael. The eval is the instrument that proves the process generalizes (not memorizes).

## Core principles (these define "correct")

1. **Accessibility-bounded.** Resolve only what's findable in a source. If it isn't, the correct
   move is to **state what was searched and ask the right question** — never guess. Not graded on
   omniscience.
2. **Always draft + always name reasoning.** Drafting is ~free; withholding makes Michael wait.
3. **Always gate.** Never send/move/write without approval (dry-run during eval).
4. **Flexible gold.** Many tasks have several acceptable answers — score a SET, not one string.
5. **Meta-observations are bonus** (hidden queues, missing integrations worth automating).
6. **Anti-overfit.** Score the PROCESS over the exact action; use **rotating cross-validation**
   (never tune on the current eval fold); learned FACTS go in a knowledge/memory layer, not prompt.
7. **Read everything.** Title + description + genuine comments, before recovering.
8. **Follow GTD + PARA — file + schedule, don't just resolve.** Clarify GTD-style (actionable? →
   next action / project / reference / someday / waiting-for), then propose WHERE it goes (the right
   Todoist project — especially the **P1/P2** priority projects — or a **PARA** location) and WHEN
   (keep / reschedule / remove the due date). Read the task's current project + due date as input.
   **Projects are dynamic:** refresh `td project list` at run time; `routing-map.md` is a dated hint,
   not authoritative.

## Staged pipeline

We calibrate in stages so we can localize *where* a task fails. Each stage reads the previous
stage's cached output and writes its own. Stages are independent agents.

| Stage | Question | Uses tools? | Output |
|-------|----------|-------------|--------|
| 0 `snapshot` | What are the tasks (title+desc+comments)? | td CLI | `cache/<id>.txt`, `snapshot-*.txt` |
| 1 `plan` | What WOULD it search + expected action shape? | no | `runs/round-N/plans.json` |
| 2 `retrieve` | Run the searches — did it find the right data? | yes (read-only) | `cache/retrieved/<id>.json`, `runs/round-N/retrieved.json` |
| 3 `act` | From the data, is the resolution + draft + gate right? | no (uses cached data) | `runs/round-N/actions.json` |
| 4 `schedule` | Global capacity balance: no overdue, ≤10/day, ≤5 non-quick, priorities | deterministic | `runs/round-N/schedule.json` |

**Round 1 calibrates Stage 1 (plan) only.** Once the plan stage is good, calibrate Stage 2,
then Stage 3. Caching means re-running a later stage never re-fetches.

### Stage 1 (plan) spec — what the agent outputs per task
Always read the task's CURRENT PROJECT + DUE DATE and factor them in.
```
ENTITIES_TO_RESOLVE: <mentions/people/things that need identifying>
SEARCH_PLAN: <ordered list of {source, query, why} — where it would look and for what>
EXPECTED_DISPOSITION: <actionable-now|reference|seed|vague-or-oversized|stale|decision|needs-user-judgment|cannot-resolve> (+ acceptable alternatives)
EXPECTED_ACTION_SHAPE: <what the next action will likely be: email draft / file move / split / clarifying question>
PROPOSED_FILING: <target Todoist project (note P1/P2 priority) and/or PARA path; "keep in inbox" only if truly unfilable. Per routing-map.md>
DUE_DATE_RECOMMENDATION: <keep <date> | reschedule to <date> + why | remove (not time-bound) | none set>
LIKELY_ACCESSIBILITY: <for each entity: probably-findable (where) | probably-not>
WOULD_ASK: <the question it expects to ask Michael, or "none">
META_OBSERVATION: <systemic gap + fix, or "none">
```
Stage 3 (act) spec lives in `triage-process.md`.

### Stage 4 (schedule) — global capacity balance
Runs once over ALL triaged tasks (deterministic; `schedule_pass.py`). Rules:
- **No overdue survives.** Every overdue task is rescheduled to a real future date.
- **Daily capacity ≤ 10 items:** at most **5 non-quick/easy** + fill the rest (up to 10 total) with
  **quick/easy** tasks.
- **Quick/easy** tasks carry the `@Quick/Easy` label; **non-quick** carry a **p1–p4** priority and
  are placed earliest-first by priority (p1 soonest), honoring any hard due dates first.
- Items the agent left `cannot-resolve` / `needs-user-judgment` are surfaced for Michael, not
  force-scheduled.
Output `schedule.json`: per task → assigned date, label, priority; plus a per-day roster showing the
≤5/≤10 split. The review HTML can render the day roster so Michael sees the resulting calendar.

## Files

### Committable (this dir — no PII)
| File | Purpose |
|------|---------|
| `README.md` | This process doc. Update **Current state** every round. |
| `triage-process.md` | The Stage-3 (act) procedure spec. Calibrated over rounds. |
| `fetch_context.sh` | Stage 0: caches `td task view` + comments for given task IDs to `cache/`. |
| `generate_review.py` | Builds the per-stage review HTML (1–100 score + verdict + comment + export). |
| `recovery-evals.example.json` | Synthetic schema example (no real names). |
| `CONTINUATION-PROMPT.md` | The prompt to hand an autonomous runner so it continues this work. |

### Gitignored (`../fixtures/private/` — PII)
| File | Purpose |
|------|---------|
| `snapshot-YYYY-MM-DD.txt` | Raw `td today`+`td inbox` dump. |
| `cache/<id>.txt` | Cached task view + comments per task (Stage 0). |
| `cache/retrieved/<id>.json` | Cached search results per task (Stage 2). Reused, not re-fetched. |
| `recovery-evals.json` | Oracle dataset. `verified:false`=candidate; `true`=gold. |
| `rounds-log.md` | Chronological log of every round/stage: run, results, changes, next. |
| `runs/round-N/{plans,retrieved,actions}.json` | Per-stage agent outputs. |
| `runs/round-N/review-<stage>.html` | Generated review UI. |
| `runs/round-N/corrections-<stage>.json` | Michael's exported scores+verdicts+comments. |

## The loop (autonomous — do not block on Michael)

```
for each stage (plan -> retrieve -> act):
  1. run the stage agent for the round's tasks (withhold any human guidance comments — they're oracle)
  2. write the stage output JSON to runs/round-N/
  3. python generate_review.py runs/round-N/<stage>.json   # produces review-<stage>.html
  4. continue to the next stage immediately; do NOT wait for approval
Michael reviews the HTML asynchronously, scores 1-100, exports corrections-<stage>.json.
When corrections arrive: fold into recovery-evals.json, update the smallest artifact
(triage-process.md / a knowledge fact / dataset), then RE-RUN cold on the current CV eval fold to
confirm it generalized. Log everything in rounds-log.md and update Current state below.
```

**Cross-validation (ongoing).** No fixed held-out. Assign each case a fold (1..~5). Each round one
fold is "eval-only" — its corrections do NOT feed the prompt/rule changes that round; rotate the
eval fold each round. Over rounds every case is used both to tune and to measure, and no change is
trusted until it holds on a fold it wasn't tuned on.

**Withhold rule:** if a task has a human-authored triage-guidance comment, it is the oracle —
strip it before any stage agent sees it; use it only to score.

## 8 clusters (diversity quota)
people-follow-up · demo-day-logistics · reference/reading-queue · vague/oversized · seed/idea ·
eng-product-decision · personal/admin · hard-negative.

## Dynamic routing (don't hardcode projects)
`routing-map.md` is a dated SNAPSHOT + filing/due logic, not authoritative. Projects and P1/P2
membership change — **refresh them at run time** (MCP `find-projects`, or `td project list`) before filing, and treat
the snapshot only as a hint for the logic. Same for PARA folders (`ls ~/ws/notes/{1-Projects,2-Areas,3-Resources}`).

## Definition of done
On the rotating CV eval fold: high disposition-correctness AND high calibration (honest gaps, no
confabulation), zero `overfit_rule` tags. Then promote `triage-process.md` into the live
`todoist` skill and retire the overlapping triage paths.

## Current state (UPDATE EVERY ROUND)
- **Round 2 (plan + schedule) DONE for all 56 tasks.** Full snapshot cached (`cache/`,
  `tasks.json`). Plan stage run in 5 parallel shards (`runs/round-2/plan-batch-*.json`) with the
  full enriched spec (specific action, quick/easy, p1–p4, projects, dedup, attachments, filing).
  Deterministic schedule pass → `schedule.json` (≤10/day, ≤5 non-quick, zero overdue). Review:
  `runs/round-2/review-plan+schedule.html` (55 cards). **Awaiting Michael's scores/export.**
  Buckets: 34 scheduled · 6 complete-as-duplicate · 11 needs-you · 4 filed-no-date.
  Known gap: task `6grj8QHv4qpXX7jW` dropped by a shard agent — re-run to add.
- **Golden labels** captured in `fixtures/private/golden-labels.md` (7 user-verified cases) — fold
  into `recovery-evals.json` and use to score round 2.
- **CV folds:** assign 1..5 across cases; rotate eval-only fold per round.
- **Next:** ingest round-2 corrections → Stage 2 (retrieve) actually runs the searches (refresh
  `td project list`, cache to `cache/retrieved/`) → review-retrieve.html → Stage 3 (act) → re-run
  the schedule pass on resolved results.
