# Triage Process Spec (candidate — v0, DRAFT)

> This is the procedure the Triage agent runs on ONE Todoist task. It is the artifact being
> calibrated. v0 is seeded from observed good behavior on the first cases; it WILL change as
> rounds surface failures. Keep it **general** — task-specific facts belong in a knowledge/
> memory layer, not here (anti-overfit). See `README.md` for the loop.

## Inputs the agent receives
- The task: `content` (title), `project`, `due`, plus its **description** and **genuine existing
  comments** (the orchestrator injects these; in live use, fetch them yourself via the Todoist MCP
  (`find-tasks` / `find-comments`), or `td task view` / `td comment list` as fallback). NOTE: human-authored triage-guidance comments are
  withheld during eval — do not expect them.
- Tool access (read-only during eval): Gmail, Notion, Obsidian vault (`~/ws/notes`), Google
  Calendar, Todoist (other tasks/projects).

## Procedure

1. **Read the task fully** — title + description + comments. The real instruction is often in the
   description or a comment, not the title.

2. **Recover context** — a few *targeted* searches across the sources to resolve who/what the
   task refers to. Prefer the source most likely to hold the answer (people → Gmail/Notion/
   vault `People/`/Calendar; logistics → the live email thread; routing → his Todoist projects
   + Obsidian PARA).

3. **Resolve only what's accessible.** For each entity/mention, decide: resolved (give the
   specific answer + the evidence + which source) OR unresolved (say what you searched). **Do
   not invent** a plausible-but-unverified answer. Inference is allowed only when grounded
   (e.g., world-knowledge link that the sources corroborate).

4. **Clarify with GTD, then choose a disposition.** Apply GTD's clarify step: *is it actionable?*
   - **Not actionable** → reference (→ PARA `3-Resources/…`) · someday/seed (→ Tickler or `Raw Ideas`)
     · stale (→ close, with reason).
   - **Actionable** → what's the next action? Is it a **project** (multi-step → split)? A 2-minute
     thing? Something to **defer** (due date) or **delegate / waiting-for** (Tickler)?
   - Map to a disposition (pick best + name acceptable alternatives): actionable-now · reference ·
     seed · vague-or-oversized · stale · decision · needs-user-judgment · cannot-resolve.

5. **Propose filing + due date (GTD/PARA).** Part of the answer is WHERE and WHEN:
   - **Where:** the right **Todoist project** — refresh `td project list` at run time and respect
     the **P1/P2** priority projects (don't assume a static map) — and/or a **PARA** path
     (`ls ~/ws/notes/{1-Projects,2-Areas,3-Resources}`). See `../fixtures/private/routing-map.md`
     for current targets + filing logic. "Keep in inbox" only if truly unfilable.
   - **When:** keep / reschedule (concrete date, anchored to deadlines) / remove (reference/seed) /
     flag a mismatch (e.g., P1-initiative task stuck in Inbox, or p4 with a past-due date).

6. **Always draft the concrete next action** — the email draft, the file-move proposal, the
   split, or (if unresolvable) the precise clarifying question. Drafting is cheap; never withhold.

7. **Name your reasoning/inference explicitly.** Show the chain from task → conclusion.

8. **Gate.** Never send/move/write. Output is a proposal for Michael to approve (dry-run).

9. **Optional meta-observation (bonus).** If you notice a systemic gap — a hidden queue that needs
   surfacing, a missing data source (e.g., text messages) that would let this be automated —
   name it and propose a fix for approval.

## Cross-cutting requirements (apply to every task)

- **Specific actions.** Every task ends with an exact next action. Vague tasks get a PROPOSED
  concrete action: "follow up with coaches" → "get the list of coaches" or "write coaches a note".
  Never leave a bare verb.
- **Projects for multi-action.** If a task implies several steps (e.g. "gum surgery and
  orthodontist"), propose creating a **project** with a defined first next action.
- **Quick/Easy + priority.** Mark sub-~5-min tasks `QUICK_EASY: yes` (→ `@Quick/Easy` label).
  Non-quick tasks get a `p1–p4` priority (raise/Demo-Day-critical = p1).
- **Duplicate detection.** Check existing tasks + projects. *Obvious* duplicates (e.g. two
  "follow up with fabio") → `DECISION: auto_act`, recommend completing one, **don't ask**.
  *Probable* duplicates (e.g. "find new demo day location" vs the Book Demo Day Venue project) →
  offer to complete.
- **Attachments.** Check task attachments/files as context (e.g. "gena's book" has an attachment).
- **People → link.** When you resolve a person, include the contact/profile link, and offer to
  create the right structured artifact (target-investor list, reading list) when the task implies one.
- **Use existing projects/areas as inference context.** A bare "Name + Firm" or shorthand that
  matches an active project's domain — e.g. a fund name alongside the **Define Target Investors**
  project — should be resolved by inference from that project and treated **actionable** (look them
  up + add to the project's structured list), NOT marked `cannot-resolve`. Scan `td project list`
  before giving up. (Round-2 miss: "Christina BCV" → should infer target investor at BCV.)
- **No overdue survives.** Every overdue task must be rescheduled to a real future date.

## Global scheduling pass (after all tasks are triaged)
See README "Scheduling & capacity" — a separate stage balances the triaged tasks across days
(≤10/day, ≤5 non-quick), clears all overdue, and respects priority. The per-task spec only
*proposes* a due date; the scheduler reconciles them globally.

## Output schema (return EXACTLY this; the harness parses it)

```
ENTITIES:
- <mention> -> <specific answer | "unresolved"> | accessible: <yes/no/partial> | source: <gmail/notion/vault/calendar/todoist/inference> | evidence: <concrete finding or "none — searched X"> | link: <url/profile if person/doc resolved>
SOURCES_CHECKED: <each source + had-signal? yes/no>
ATTACHMENTS_CHECKED: <yes (what was in them) | none>
DUPLICATE_OF: <task id / project it duplicates + obvious|probable, or "none">
DISPOSITION: <actionable-now | reference | seed | vague-or-oversized | stale | decision | needs-user-judgment | cannot-resolve> (+ acceptable alternatives)
SPECIFIC_NEXT_ACTION: <exactly what to do, concrete; for vague tasks PROPOSE one, e.g. "get the list of coaches" / "write coaches a note". email = to/subject/body. NEVER a vague verb.>
IS_PROJECT: <yes (proposed project name + its first next action) | no — single action>
QUICK_EASY: <yes (gets @Quick/Easy label) | no>
PRIORITY: <p1|p2|p3|p4 — only for NON quick/easy items; quick/easy don't need a priority>
PROPOSED_FILING: <Todoist project (note P1/P2) and/or PARA path, per current `td project list` + routing-map.md; "keep in inbox" only if truly unfilable>
DUE_DATE_RECOMMENDATION: <keep <date> | reschedule to <date> + why | remove (not time-bound) | set <date>. NOTHING may stay overdue.>
DRAFT_OR_PROPOSAL: <the draft (email/note/comment) or, for dedup, "recommend complete as duplicate" (auto if obvious, offer if probable)>
REASONING: <task -> conclusion, 2-4 sentences>
DECISION: <auto_act (obvious, no question needed) | draft_and_ask | needs_user_judgment (offer 2-3 alternatives) | cannot_resolve>
CONFIDENCE: <0-100>
ASK_MICHAEL: <one precise question (+ 2-3 options for judgment calls), or "none">
META_OBSERVATION: <systemic gap + proposed fix, or "none">
```

## Hard rules (failure modes the eval punishes)
- Confabulating an entity that isn't in the sources → fail (`retrieval`/`missing_context`).
- Sending/moving/writing without gating → fail.
- Not reading the description/comments → fail.
- Polished prose hiding uncertainty → fail (`format_only`).
- A rule so specific it only works for one task → fail (`overfit_rule`).
