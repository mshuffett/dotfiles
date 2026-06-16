# Coach Memory

Persistent memory for the coach skill. Read at session start. Update when something worth remembering happens.

---

## Session-Start Protocol (updated 2026-06-15 — system of record moved)

**The active loop moved off Obsidian to Todoist.** As of 2026-06-15 the working
operating system is **Todoist** (tasks, P1/P2 priorities, cadence) + calendar — treat it
as **primary**. **Notion "Waycraft OS" / Command Center is exploratory — not a committed
migration, not yet operational ("not migrating to Notion yet, per se"), and not connected
to the coach.** Do not depend on it. **Obsidian (`~/ws/notes`) is still the home for prose
outputs** (daily/weekly notes, write-ups, captures — "still Obsidian for now"), but
**project/task tracking moved to Todoist**: don't read `Active Projects.md` as the live
project list, and treat existing vault files as stale unless confirmed.

**At session start, read `references/current-state.md`** — the dated working baseline
(connections, P1/P2 tree, focus themes, cadence). **Each block has a 1-week TTL: if it's
>1 week old, re-confirm with Michael (or re-pull from Todoist/Notion) before filing,
triaging, or planning.** Never guess current focus from CLAUDE.md or a stale file alone —
that misfired in the 2026-04-19 triage (stale "Demo Day is current focus").

**Align on state, don't assume it.** Present any read (Command Center / Todoist / memory)
as a *dated draft* → Michael confirms/corrects → record the agreed state with a date →
re-confirm later. (Now an explicit SOP step: weekly-review Phase 0 + the session-start ritual.)

## Todoist Project Model (added 2026-04-19)

Michael's Todoist "projects" serve two functions that need different treatment:

1. **Active Projects** (the live **Todoist P1 / P2** containers — no longer
   `Active Projects.md`) — real commitments, reviewed weekly, have next-actions.
   Filing here means "I commit to act within ~2 weeks."
2. **Capture Buckets** (Everything AI Backlog, Waycraft Backlog, idea, Setup
   Backlog, Strategy Backlog, AutoBacklog, Someday/Later, Someday/Maybe, Tickler,
   📖 Review, ❓ Clarifications) — fast routing at capture time via Todoist
   quick-add. These are typed inboxes, not project lists. Coach drains them
   periodically during "Process Live Ideas" — items go to Obsidian (Reference/
   Seed) or the Todoist P1/P2 projects (Action), per classification rules.

**Anti-pattern to watch for: over-filing into Active Projects.** If an item isn't
a 2-week commitment, it's not a project-task — it's Reference, Seed, or Delete.
Filing non-commitments into projects is what makes projects "die."

### Naming + Structure Conventions (added 2026-06-15)

How Michael wants Todoist projects named (confirmed in the 2026-06-15 weekly review):

- **Outcome-named, one outcome per project.** Nesting to show structure is encouraged.
- **Imperative verbs** ("Write Pitch", "Book Demo Day Venue", "Build…", "Define…") —
  NOT activity-noun names ("VC Strategy and Messaging"), NOT past-tense ("Pitch written").
  Past tense is only for the big-rocks checklist.
- **Headline projects encode the target + deadline** ("Raise $5M by July 28th", not "Raise the Round").
- **MECE / de-dup.** He dislikes overlapping project sets — collapse duplicates.
- Priority containers **P1 / P2** (favorited, ordered at root) hold ranked outcome sub-projects.
  All other projects live under the PARA spine (`1-Projects` / `2-Areas` / `3-Resources`);
  the P1/P2 parents at root are the approved exception. *(The live tree is in `current-state.md`.)*

### OKR Cadence (added 2026-06-15)

**Quarterly set, monthly reflow.** Set/revise OKRs quarterly; each month reflow projects +
inbox items into tasks/projects *under* the OKRs. Review OKR-linked projects at least weekly.
(Resolves the monthly-vs-quarterly tension Michael flagged.)

## Due-Date Rule (added 2026-04-19)

Due date = commitment ("I will do this on this day"). Priority = importance.
Michael's historical failure mode: due-dating items because they feel important,
then not doing them, breaking trust in the date. Enforce: don't due-date anything
you wouldn't bet $20 on doing.

---

## Patterns

Confirmed recurring behaviors (2+ occurrences):

- Financial items → `2-Areas/Finances/`
- Everything AI ideas/features → `2-Areas/Everything Backlog/`
- Personal reflections/journal → `2-Areas/Journal/`
- People-related → `2-Areas/People/` (always create person note)
- System/workflow improvements → `2-Areas/System/`
- Raw ideas (not yet categorized) → `3-Resources/💡 Raw Ideas/`
- Reference materials → `3-Resources/`
- Completed/outdated → `4-Archives/`

### Execution Patterns (Confirmed 2026-02-15)
- **Good days happen when:** day is pre-planned the night before, clear single-task intention, distractions have a deferral path
- **Chain breaks when:** hits a milestone → feels "owed" a break → stops evening planning → forgets system entirely
- **Shiny object trigger:** news/HN/new tools → feels like a priority to explore → displaces planned work
- **Meeting trigger:** meetings generate unplanned work → takes on new items → loses the plan
- **Core failure mode:** starts doing things that feel productive without checking if they're on-plan. Once in execution mode without a plan, nothing forces a zoom-out.
- **"Good intentions without systems" is a known anti-pattern** — awareness alone doesn't change behavior. Needs forcing functions.
- **Scaffolding pattern (confirmed 3+ times):** builds impressive infrastructure *around* the core thing (events, community, decks for others, systems) instead of building the core thing itself. Looks and feels productive. Hard to distinguish from real progress in the moment.
- **80-90% pattern:** impressive inputs (batch, event, architecture, pitch) but investors/market pattern-match on outputs. Gap between effort and legible proof.

### Delegation Patterns
- Hands off work to Michelle but doesn't specify: deadline, what "done" looks like, or escalation rule
- Check-in frequency isn't the issue — it's the format/output expected back
- Result: no visibility into what shipped vs didn't until too late
- **(2026-06-15)** The *worry of not knowing what Michelle is working from* nearly exceeded the
  benefit of delegating. Fix = the daily Michelle sync (12:00–12:15). Open to delegating more
  across the batch (press, events, sponsorship) to willing owners.

### Assertiveness (core, high-leverage — added 2026-06-15)
Michael tends to **defer/absorb others' assertiveness rather than assert his own opinion.**
Same root muscle shows up as: the Dave boundary issue; reacting to directive unsolicited advice
(ref. a May 31 conversation about Dave advising during Evelisa's talk prep); and likely in
fundraising rooms where conviction is the asset. **He wants this tracked weekly** — note moments
he asserted his real opinion vs. swallowed it. Treat as evolving, not a verdict.

### Dave-Conversation Drift (added 2026-06-15)
Long unstructured talks with Dave derail his focus (one day went 9/10 → 6/10). He's practicing
kind, direct boundary-setting (state the time boundary *up front*; appreciation + boundary +
future-hook to exit). Check in during shutdowns/reviews. The containerized Dave daily sync (11am,
Dave runs it) + the Michelle sync are the structural fixes.

### Category-Collision (added 2026-06-15)
He mixes **"DO the review" with "BUILD the agentic review system"** — distracting. Agreed
resolution: **do the work; capture system-design ideas in a bucket; build them into next week's
process.** The review is the objective; design insight is a byproduct.

### Chat-as-Interface Friction (added 2026-06-15)
He finds coaching-via-chat can be slower than doing it himself, and it can steer him / make it
hard to ensure his *own* priorities get resolved. Implication for the coach: **be alignment-first,
present reads as drafts to confirm, keep it light / one-thing-at-a-time, don't over-steer.**

### Overwhelm + Over-Building (added 2026-06-15)
Strong 0→1 builder who can stall near "done" and over-engineer structure (see also Scaffolding,
above). **Explicitly asked: don't over-optimize.** Bias toward small, concrete, shippable steps
that touch his real tools.

## Preferences

Communication and workflow preferences learned from Michael:

- Prefers concise responses
- Likes when context from previous days is referenced
- Appreciates proactive suggestions but not overwhelming
- Morning: structured routine via /morning
- Evening: reflection-focused via /evening
- Throughout day: quick capture, minimal friction
- Timezone: America/Los_Angeles (San Francisco)
- Default calendar: michael@geteverything.ai
- Time tracking: **dropped (2026-06-16)** — no longer tracked; removed from the shutdown checklist.
- Weekly planning: Saturday 12:00-16:00
- **Paper planner is the daily source of truth** (not digital). Computer stays in bag until paper plan is done.
- Paper planner format: 1 MIT + 2 secondary + 2 additional, with target poms per task
- Weekly planner format: 5 most important + 5 secondary + 5 additional, with target poms
- Works at Palmer Square most days (bike ~18 min walk or ~7 min bike, auto-delivered lunch at noon)
- Yoga nidra at Palmer (has couches) — needs headphones + eye mask
- Priming: 15-min Tony Robbins-style visualization every morning (non-negotiable). Has a specific video he uses.
- Information low diet during sprints: no news/HN/Twitter unless directly tied to current outcomes
- **"Capture it" means write it in a persistent note, not just acknowledge it.** Don't say "captured" unless it's written somewhere that won't get lost.
- Weekly review: prefers retro FIRST (before planning). For large inboxes, quick scan for high-priority only.
- When action items are on a single daily note, they get lost. Put them in the weekly note or a linked persistent doc.
- **(2026-06-15) Daily scheduling:** 1–3 prioritized tasks/day + up to 5 quick ones, all with
  priorities, filling available time. **Deep work in the morning** (afternoons are meeting-heavy
  with Open Batch group syncs). Tag genuinely-quick items `@Quick/Easy`; deep tasks stay untagged.
- **(2026-06-15) Todoist week starts Sunday.**

## Trends

Multi-day/week observations:

- W07: Strong Monday (10/10), tracking dropped after Prototype Day Wednesday, 4-day gap in daily notes (Thu-Sun)
- Sprint retro AND W07 review both flagged: need rigorous schedule (gym/meditation/bedtime), delegation visibility, scope discipline
- These issues surfaced twice without being resolved → led to Execution System Design doc
- **W08-W11 (Feb 16 – Mar 16):** Month-long gap in daily notes. System dropped entirely after Feb 16. Confirms the "milestone → break → system collapse" pattern — Demo Day prep consumed all bandwidth, daily tracking/planning system was abandoned.
- **Demo Day (Mar 10):** Happened at Hanwha AI Center, SF. Michael presented as closing act. Strong audience energy. MongoDB $10K sponsor. But no term sheets or committed capital followed.
- **Post-Demo Day mood (Mar 16):** Reflective, vulnerable. Evelisa surfaced a hard truth — building things around the thing, not the thing itself. Michael is grappling with whether the batch/event moved the needle enough.
- **2026-06-15 (Mon, 8/10):** Productive, but the **scaffolding pattern recurred** — built a full Todoist triage+scheduling eval system (Personal OS, P2) while the **raise (P1) got zero direct motion**. Michael named it himself. Response: adopted the calendar forcing functions (see Commitments) + tomorrow's #1 = *define the investor approach in one doc*. Also: **Dave & Michelle shifted to project-basis**; Dave's daily sync is now a full hour (11–12) — flagged to renegotiate (30 min / 3×wk).

## Key People

- **Evelisa** — Michael's wife. Sharp strategic thinker. Her feedback lands hard but constructively. Surfaced the scaffolding pattern directly (Mar 16).
- **Michelle** (`michelle@compose.ai`) — handles ops/delegation (investor emails, admin). Delegation
  clarity is the issue; fix = standing daily 12:00–12:15 sync (added 2026-06-15).
- **Dave** — mentor/advisor; owed PE GTM work. Long unstructured talks drift his focus (see
  Dave-Conversation Drift pattern). Containerized into a daily 11am sync Dave runs.

## Everything AI Status (as of Mar 16)

- Pre-revenue, pre-raise
- Pitch: "first autonomous product team" / "OpenClaw meets Asana"
- 10K waitlist claimed, Series A-C customers interested
- Four-model architecture: DAG Generator, Performance Predictor, Assignment Optimizer, Prompt Optimizer
- Fundraising target: $10-20M — hasn't converted
- Compose AI (~$10K MRR) running on autopilot in background
- **Core strategic question:** What is the smallest, most undeniable proof of execution?

## Commitments

Active commitments Michael has made (with dates):

- (2026-02-15) Paper planner as source of truth — computer stays in bag until plan is done
- (2026-02-15) 15-min morning priming — non-negotiable
- (2026-02-15) Evening shutdown: Toggl review, close all programs, paper plan for tomorrow, computer in bag
- (2026-02-15) Bedtime: 12:30 AM, screens off 11:30, stop work 10:30
- ~~(2026-02-15) Work weekends until Demo Day (Mar 10)~~ — expired
- ~~(2026-02-15) Information low diet through Demo Day~~ — expired
- **(2026-06-16) Priority-protection forcing functions** (to counter the scaffolding/over-building pattern):
  - Recurring **🎯 Top Priority block** (weekdays 12:15–14:30, calendar) — first deep-work on raise/Demo Day *before* any system/tooling work.
  - Recurring **🛠 System/Admin capped slot** (weekdays 16:00–16:45); overflow → Setup Backlog.
  - **Nightly #1-outcome pre-commit** at shutdown → becomes the next day's protected block (rename the recurring block to it).
  - Representation rule: **calendar = when, Todoist = what**; don't add a third mechanism.

## Feedback

Session feedback log (rating 1-5 + improvement):

- **2026-02-15 (weekly review):** 4/5. Improvement: tighter time management during the review itself — state the time budget per phase upfront, track it, maybe use a timer. We drifted and didn't finish all phases in the original window.
- **2026-02-16 (morning):** Coach was time-blind — didn't notice 6-hour gap between check-ins (11:15 to 5:00 PM). Must check the clock at every interaction and flag elapsed time. Time awareness is a core coaching function, not optional.
- **2026-03-16 (evening):** 4/5. Improvement: when assessing Michael's state, don't just name it and move on. Co-create a shared mental model — a structured snapshot (emotional, strategic, energy, decision-readiness) that we both agree on. Make it explicit and referenceable, not just a passing observation.
- **2026-06-15 (evening):** Improvement: **always check task comments AND descriptions before acting/triaging** — critical context lives there and must not be lost (recurring ask; it's why the shutdown sweep mattered). Already encoded in operations.md / daily-review.md / triage-process.md; treat as a standing rule.

## Open Questions

Things the coach is still learning or needs to verify:

- Deep work blocks policy: resolved → pre-plan the night before (confirmed 2026-02-15)
- ~~Optimal pomodoro count per day target~~ → 10 poms/day target (5 hours focused)
- Is the paper-as-source-of-truth system still active post-Demo Day? (Last confirmed Feb 16)
- What happened with Open Batch v2 planning?
- House hunting in SF — background, status unknown
- Is Michael about to start another scaffolding project (Open Batch v2, community) instead of building core product?
- **Post-Demo Day state (Mar 16):** Post-sprint crash. Not excited about any direction. Leaning toward Compose as "lowest belief required" option. Needs to figure out actual current state of Compose users/engagement before deciding anything. Not ready to commit to a direction yet. Evelisa conversation surfaced real tension about life stage (kids, house) vs founder grind. Next session: co-create a proper state assessment before strategy talk.
- Compose AI details: ~500K installed users, ~20K downloads/mo, ~$10K MRR, but high churn and low engagement. Users are "more of an opportunity than getting value." Michael hasn't gone through his own onboarding recently.
- Runway: ~5 years including incoming family money. Pressure is identity/dignity, not survival.
- Life stage: Michael and Evelisa want kids soon and a house in SF. This reframes everything — needs stable meaningful income, not just optionality.
