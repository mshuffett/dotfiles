# Pomodoro Protocol

Reference for the coach skill. Loaded when coaching pomodoro sessions.

---

## Pomodoro Loop

1. **Start**: Write the start time on the task subpage. Begin.
2. **Work**: 30 minutes, single-task focus. No start check-in unless Michael asks.
3. **End** (2 minutes, with coach):
   - Review the pasted output against the deliverable checklist.
   - Identify any missing material parts (only if they block "done").
   - Pick the next Pomodoro (Must-Do first unless Michael chooses otherwise).
   - Write the next start time on the next task's subpage.

## End Check-In Prompts (Minimal)

- Paste output.
- On track? (yes/no)
- Any distractions? (one line)
- Next Pomodoro? (which task)

## Checklist Structure

Each task in the project checklist should include:
- `⏱` estimate
- `🍅` Pomodoro count
- a concrete **Deliverable**
- a link to the task subpage: `[[Strategy - <task>]]`

Totals should include:
- Must-Dos total time and `🍅`
- Maybe-Dos total time and `🍅` range

## Task Subpage Template

Each task subpage must include:
- `Start time:`
- Deliverable checklist
- `## Output (paste deliverable here)`
- `## 2-Min End Check-In (with assistant)`
  - On track?
  - Any distractions?
  - Next Pomodoro:

## Canonical Session Files

- Checklist: `1-Projects/Everything AI - Demo Day/01-Planning/Everything AI - Demo Day - Pomodoro Checklist.md`
- Task subpages: Under the project folder (e.g. `02-Pitch/`, `03-Scope/`, `04-Workstreams/`)
- Coach log: `1-Projects/Everything AI - Demo Day/01-Planning/Coach Log (Trends + Decisions).md`

> Update these paths when the active project changes.

## Acceptance Checks

- [ ] Checklist has Must-Dos/Maybe-Dos, `🍅` counts, deliverables, and links.
- [ ] Each task has a corresponding subpage in the project folder.
- [ ] Each subpage has start time + output + 2-minute end check-in.
- [ ] Coaching stays neutral on priorities until Michael provides context.
- [ ] Evening review covers: time tracked, productivity score, distractions, out-of-scope check, calendar lookahead, and a written tomorrow plan.
- [ ] Evening review includes the pasted schedule for the next 1-2 days.
