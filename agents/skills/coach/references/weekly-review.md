# Weekly Review SOP

Reference for the coach skill. Loaded on "weekly review" or "let's do my weekly review".

Create a TaskList from the phases below and guide Michael through them.

**Convention:** Saturday 12:00-16:00 (adjustable by Michael).
**Output location:** `Calendar/Weekly/YYYY-Www.md`

**Time discipline:** At session start, state total available time, budget per phase, and track against it. If a phase is running over, name it and decide: extend (cut something else) or wrap and move on.

---

## Phase 0: Align on State (5 min)

Before reviewing, agree on the starting picture — **don't assume it.** This catches the
failure mode where the coach plans off a stale or mis-read snapshot.

1. Read `references/current-state.md` and pull the live Todoist **P1 / P2** priorities.
2. Present them back as a **dated draft**: "Here's where I think things stand as of
   <date> — P1/P2, focus themes, connections. Correct anything that's off."
3. Once Michael confirms/corrects, record the agreed state (dated) in
   `references/current-state.md`. That dated baseline is what the rest of the review uses.

## Phase 1: Retro (20 min)

Start with what happened — context before planning.

### Scan the Week (added 2026-06-15)

Ground the retro in what actually happened, not just memory:
- Skim the week's **conversations/threads** (coaching sessions, key chats), **completed
  Todoist tasks**, and the **calendar** for recurring themes, decisions, and self-awareness moments.
- **Assertiveness check** (a tracked pattern): note specific moments Michael asserted his real
  opinion vs. swallowed it. Treat as evolving data, not a verdict. (See `memory.md` → Assertiveness.)
- Feed what surfaces into Good/Bad/Start/Stop below.

### Plan vs Actual

1. Pull up last week's plan (previous weekly note or W(N-1) big rocks / deliverables).
2. For each planned item: did it ship, slip, or get cut? Why?
3. Surface any deadline carry-forwards that need explicit new dates.

### Good / Bad / Start / Stop

4. **Good:** What worked well this week? (process, output, energy, decisions)
5. **Bad:** What didn't work? (missed targets, energy drains, friction, avoidance)
6. **Start:** What should you begin doing next week? (new habits, practices, rituals)
7. **Stop:** What should you stop doing? (time sinks, bad patterns, scope creep triggers)

Each Start/Stop item becomes a concrete action item for next week's plan.

### Hill Updates

8. Hill status per active deliverable: what moved, what stalled, what surprised you?

## Phase 2: Inbox Triage (15 min)

Inbox clearing is NOT the identity of this review. Scale effort to inbox size.

**CLARIFY before you date — don't date-shuffle.** For each item, run the GTD clarify step *before* assigning any date: (1) **Actionable?** No → reference / someday / trash. Yes → (2) **project or single next-action?** name the concrete next action. (3) **Merge duplicates** — collapse overlapping items (esp. investor-DB / outreach). (4) **Then** date it (park-with-review). And: if an item's **importance or deadline is unknown, SURFACE and flag it** (check its comments/description first, then ask) — never defer-to-hide by dating it forward. Rescheduling a date without clarifying/merging/surfacing is the anti-pattern. See `memory.md` → **GTD Processing — clarify, don't just shuffle** and **Don't hide unknowns — surface them**.

- **Small inbox (<15 items):** Process fully to PARA using `references/inbox-processing.md`.
- **Large inbox (15+ items):** Quick scan for high-priority / time-sensitive items only. Process those. Park or bulk-archive the rest — don't let a stale backlog eat the strategic window.

5. Triage notes inbox (`+Inbox/`).
6. Triage Todoist inbox.
7. Brain dump: Ask Michael for any uncommitted thoughts — capture to `+Inbox/` or daily note.

## Phase 3: GTD Trigger-List Scan (15 min)

8a. **Walk the raise dashboard (canonical Notion hub).** Open the
   [OpenBatch Company Raise — Project Dashboard](https://app.notion.com/p/OpenBatch-Company-Raise-Project-Dashboard-7a38c400565c4380aab4a2c856d5e3ad)
   and go through each surface in its **Investor Flow & Pipeline** section: the canonical Investor
   Flow page, Custom Investor Onboarding, the Investors DB (Target Investors / Founder Dinners view),
   and the deep-research target list. For each: is it current? what moved? what's stale or contradicts
   the live source? Capture next actions into Todoist. (Pointer: memory wiki `[[fundraise-surfaces]]`;
   records are point-in-time — verify against the live source.)
8b. **Review the full Todoist project tree** (not just loose tasks): walk the **P1 / P2 / P3**
   favorites and their subprojects (Raise → Write Pitch, Define Target Investors, Book Demo Day Venue,
   Build Open Batch Investor Process, Demo Day; Manage Open Batch; etc.). For each active project:
   - Still active? Next action clear? Anything to archive or reprioritize?
   - Update Todoist (and `references/current-state.md` if the priority set changed).
9. Scan `1-Projects/` folder for anything in-flight not reflected in the active list.
10. Check other active commitments (cofounder considerations, relationships, health) as trigger list.
11. Check `@waiting` items (in Todoist + daily notes) for follow-ups.
12. Review any stalled or orphaned items.

## Phase 4: Weekly Plan by Active Project (60 min)

This is the core of the review. Informed by the retro. Source of projects:
the live Todoist **P1 / P2** priorities (see SKILL.md → Current Project Context).

For each active project that needs focus this week:

13. Define:
   - **In-scope** this week (bullets)
   - **Out-of-scope** (bullets) — be explicit about what you're NOT doing
   - **Deliverables** this week (bullets)
   - **Top risks/unknowns** + mitigations
   - **Initial hill estimate per deliverable**: `uphill/downhill, ~X%, on track? y/n, note`

Not every active project needs weekly focus — pick 2-4 that will actually get
time this week. The others stay dormant for the week (still tracked, not worked).

### Red-Team the Plan

14. Quick murphyjitsu per focused project: "What's the biggest risk to this plan
    this week? What's the weakest assumption?"

## Phase 5: Schedule + Deep Work (30 min)

15. Lock weekly big rocks (1-3 major outcomes for the week).
16. Schedule protected deep-work windows: minimum 3 blocks of 2+ hours each.
17. Define 1-line objective per deep-work block.
18. Load scheduling rules from SKILL.md and check calendar conflicts:
    ```bash
    gcal list --from monday --to sunday
    ```
19. Identify prep needed for any meetings or deadlines this week.

## Phase 6: Write-Up + Close (15 min)

20. Create or update weekly note in `Calendar/Weekly/YYYY-Www.md`.
21. Write "first day" plan: top outcomes + Pomodoro #1 + Pomodoro #2 in Monday's daily note.
21b. **Update the recurring 🎯 weekly-target P1 Todoist task** (id `6gwHWj5CCXQ4Q53x`, daily-recurring in "Raise $5M by July 28th") to this week's ONE THING — it keeps the target in his face every day.
22. Update coach log if trends/policies emerged.

## Phase 7: Memory Review

23. Review `references/memory.md`:
    - Prune stale entries
    - Promote confirmed patterns
    - Note what's working / not working
    - Archive resolved commitments

## Phase 8: Session Feedback

24. "How was this session? 1-5."
25. "One small thing I could do better next time?"
26. Log to `references/memory.md` under Feedback.

---

## Trigger Phrases

`weekly review`, `let's do my weekly review`
