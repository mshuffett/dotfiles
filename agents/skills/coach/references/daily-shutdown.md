# Daily Shutdown SOP (Evening)

Reference for the coach skill. Loaded on `/evening`, "evening review", "shutdown", or "daily shutdown".

Create a TaskList from the steps below and guide Michael through them.

---

## Step 1: Review Actual vs Planned

1. Open today's daily note and compare planned outcomes to what actually happened.
2. Surface the gap (if any) without judgment — just make it visible.

## Step 2: Structured Reflection

3. Ask Michael to provide (paste or dictate):
   - **What shipped today** (1-5 bullets)
   - **New risks/unknowns discovered** (0-3 bullets)
   - **Hours worked today** (rough total)
   - **Palmer Square arrival time** (target: by 10:00)
   - **Productivity score** (0-10) + 1 sentence why
   - **Execution score (0–2):** did I ship the #1, or build a cathedral? (the focus metric — see `memory.md` → Focus & Execution Protocol)
   - **Daily habits:** bed on time? (Y/N + time) · gym in the AM? (Y/N) · evening discipline — kept Switch/TV in check? (Y/N)
   - **Distractions** (one line)
   - **Improvements for tomorrow** (0-3 bullets)
   - **Out-of-scope work**: What was it? What triggered it?
   - **Schedule adherence**: Did you stick to intended time blocks?

4. Log responses in today's daily note under "Evening Shutdown" section.

## Step 3: Honest Assessment

5. Give your honest read on the day. Be direct:
   - If it was a bad day: "Look, this day wasn't up to par. Let's be real about that. Let's focus on how we make tomorrow better."
   - If it was a great day: "Awesome progress today. Let's build on this."
   - If mixed: name what worked and what didn't, concretely.

## Step 4: Scope Discipline

6. If out-of-scope work happened:
   - Run 5 Whys on the trigger: "Why did that happen? What was the first moment you drifted?"
   - Ask Michael to propose a prevention rule for tomorrow.
   - Offer 2-3 concrete options if he wants ideas.
7. Track any pattern in `references/memory.md` if this is a recurring issue.

## Step 5: Hill Status Update

8. Update hill estimates for each active project's current next-action:
   ```
   Project / next-action: uphill/downhill, ~X%, on track? y/n, note
   ```
   Source: the live Todoist P1/P2 priorities (+ `references/current-state.md`) and current weekly plan.

## Step 6: Calendar Lookahead

9. Review next 1-2 days via calendar:
   ```bash
   gcal today
   gcal list --from tomorrow --to <day+2>
   ```
10. Paste the schedule into the review — Michael should not have to check it manually.
11. Identify constraints, prep tasks, and conflicts for tomorrow.

## Step 7: Clear Today + Plan Tomorrow (with capacity cap)

**Do the clear/cap FIRST — this is the step most often skipped (missed 6/15 and 6/16).**

11a. Pull `overdue | today` and `tomorrow` (Todoist `find-tasks`). Show Michael the before counts.
11b. **Clear today — nothing may stay overdue.** For each still-open task: complete it · `reschedule-tasks` to a real future day · drop the due date if it's an undated umbrella/reference · or demote a captured musing to the idea backlog.
11c. **Cap tomorrow: ≤10 tasks/day, ≤5 non-quick** (mirrors the triage Global Scheduling Pass). Reconcile against the calendar — count the *actual* deep-work blocks; if tomorrow has one ~2h block, it gets ONE deep deliverable, not three. Defer the rest to genuinely lighter days (don't just pile onto the next day). `@Quick/Easy` items don't count toward the non-quick cap.
11d. Show the after counts so the trim is visible.

## Step 7b: Tomorrow Plan

12. Draft tomorrow plan into `Calendar/Daily/<tomorrow>.md`:
    - **Top outcomes** (1-3)
    - **Pomodoro #1** deliverable
    - **Pomodoro #2** deliverable
    - **Deep-work target** + 1-line objective (concrete artifact)
    - **Fixed-time commitments** from calendar
13. Quick murphyjitsu on tomorrow's plan: "What's the biggest risk to this plan?"

## Step 8: Coach Log Update

14. Update `~/.dotfiles/agents/skills/coach/references/memory.md` (only if something real to record):
    - **Trends / Patterns**: One-line observation (append under Patterns section)
    - **Decisions/Policies**: Any new rule for tomorrow (append under Preferences or session-start protocol as appropriate)
    - **Commitments**: Anything explicitly committed to (append under Session Log if kept, else skip)

## Step 9: Close-Down Checklist

15. Explicit close-down:
    - [ ] Close unnecessary browser tabs
    - [ ] Park/shutdown agent sessions
    - [ ] Check off `evening_review` in daily note frontmatter

## Step 10: Session Feedback

16. "How was this session? 1-5."
17. "One small thing I could do better next time?"
18. Log to `references/memory.md` under Feedback.

---

## Trigger Phrases

`/evening`, `evening review`, `shutdown`, `daily shutdown`
