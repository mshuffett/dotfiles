---
name: pomodoro-coaching
description: Use when coaching Pomodoro single-task sessions (30m blocks), including 2-min end check-ins, evening review + tomorrow plan, and weekly scope planning.
---

# Pomodoro Coaching (Global)

## Core Behavior

- Do not decide the user's priorities. Ask for the minimum context first; propose neutral structure; let the user choose.
- Use 30-minute Pomodoros as the unit of planning and verification.
- Use end-of-Pomodoro check-ins (2 minutes) to validate output and choose the next block.
- Calendar writes: audit and propose timeblocks as text; do not create/update calendar events unless the user explicitly approves.
- Time sanity check: when the user references "today/tomorrow/yesterday" or day-of-week, verify via system time (`date`) and (if relevant) calendar (`gcal today`) rather than trusting stale prompt metadata.

## Canonical References (Global)

- User operational profile: `agents/knowledge/atoms/michael-user-info.md`
- Coaching basics: `agents/knowledge/atoms/coaching-lite.md`
- Evening review: `agents/knowledge/atoms/evening-review-lite.md`
- Calendar CLI: `agents/knowledge/atoms/gcal-cli.md`
- Time tracking (Toggl): use `toggl` CLI (see below)

## Time Tracking (Toggl)

If the user wants time tracking, default to Toggl Track:

Setup (one time):
- Put `TOGGL_API_TOKEN` in `~/.env.zsh` (global secret).
- Run `toggl init` to store the default `workspaceId`.

During Pomodoros:
- Prefer logging after each block (manual mode) so it's exact and doesn't require start/stop discipline:
  - `toggl log --desc "Pomodoro #N: <task>" --start "YYYY-MM-DD HH:MM" --minutes 30 --tags "pomodoro"`
- Alternatively use a running timer:
  - `toggl start --desc "<task>" --tags "pomodoro"`
  - `toggl stop`

## Coach Mode (Works Anywhere)

When coaching outside any particular repo, the goal is still the same: the user can run a clean 30m block and ship a concrete deliverable.

Use the lightest artifact that preserves single-tasking:
- If there is a repo/project note system, use it (project homepage + checklist + subpages).
- If not, create a temporary checklist note in the current workspace (or ask where to put it) with:
  - Must-Dos vs Maybe-Dos
  - `🍅` Pomodoro counts (30m units) and totals
  - explicit deliverables/outcomes per Pomodoro

## Workflow (Notes Vault / Obsidian Repo)

When working inside the `notes` vault/repo:

1. Prefer a **project homepage** + **checklist note** over `+Inbox/`.
   - If this exists, use it as the homepage: `1-Projects/Everything AI - Demo Day/00-Start Here.md`
   - If this exists, use it as the checklist: `1-Projects/Everything AI - Demo Day/01-Planning/Everything AI - Demo Day - Pomodoro Checklist.md`
2. Ensure each checklist item includes:
   - `⏱` estimate
   - `🍅` Pomodoro count
   - a clear **Deliverable**
   - a linked subpage note (one note per task)
3. Create/maintain subpage notes near the project checklist:
   - Title format: `Strategy - <task>.md`
   - Include: `Start time:`
   - Include the deliverable bullets
   - Include an `Output` section to paste the deliverable
    - Include a `2-Min End Check-In` section:
     - On track?
     - Any distractions?
     - Next Pomodoro:

## Pomodoro Protocol

- Start: note the start time, then begin.
- Work: 30 minutes, single-task focus.
- End (2 minutes, with assistant):
  - Review the deliverable/output against the subpage checklist.
  - Call out missing pieces (only if material to the deliverable).
  - Decide the next Pomodoro (must-do vs maybe-do), and note the next start time.

## How To Coach (End Check-In Prompts)

Keep it short:

- Paste the deliverable/output.
- "On track?" (yes/no)
- "Any distractions?" (one line; no deep postmortems unless requested)
- "Next Pomodoro?" (pick the next task/subpage)

## Evening Review (5-10 min) + Tomorrow Plan (Required)

Use this when the user says "evening review", "end of day", "plan tomorrow", or they seem tired and want the minimum effective planning.

Ask the user for:
- Shipped today (1-5 bullets)
- Time tracked today (hours/minutes)
- Productivity (0-10) + 1 sentence why
- Distractions (one line)
- Improvements for tomorrow (0-3 bullets)
- Out-of-scope work? (especially off-scope coding) If yes: what triggered it?
- Was Palmer Square / standups / relationship context a good use of time today, or distracting? (one line)
- Oliver + schedule adherence: did you avoid making a decision / avoid disruption, and did you stick to the intended work + time blocks? (1-2 lines)

Then do:
1. Update hill estimates for the active deliverables (only if the user is running a hill-style process).
2. Calendar lookahead:
   - Use `gcal` to review the next 1-2 days.
   - Paste the schedule into the review.
   - Propose deep work blocks and key timeblocks as text first; only write calendar events after explicit approval.
3. Draft tomorrow plan:
   - top outcomes (1-3)
   - Pomodoro #1 deliverable
   - Pomodoro #2 deliverable
   - deep work target (🍅) and a 1-line deep work objective (concrete artifact)
4. Remind close-down hygiene:
   - Close Google Chrome tabs.
   - Park/shut down agent sessions so they don't hijack the next morning.

## Acceptance Checks

- [ ] Checklist note has a Must-Dos/Maybe-Dos split with `🍅` totals.
- [ ] Every checklist task links to a corresponding `Strategy - ... .md` subpage.
- [ ] Each subpage has `Start time`, deliverables, `Output`, and `2-Min End Check-In`.
- [ ] Coaching avoids making priority decisions; it asks for user context first.
- [ ] Evening review collects time tracked + productivity + distractions, updates tomorrow plan, and includes a pasted calendar lookahead.
- [ ] Calendar writes are proposal-first; no event creation without explicit approval.
