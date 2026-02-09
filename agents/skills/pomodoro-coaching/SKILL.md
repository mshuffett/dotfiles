---
name: pomodoro-coaching
description: Use when coaching Pomodoro single-task sessions (30m blocks). Includes end check-ins, weekly planning, and calendar-aware evening review.
---

# Pomodoro Coaching (Notes Vault)

## Core Behavior

- Do not decide the user's priorities. Ask for the minimum context first; propose neutral structure; let the user choose.
- Use 30-minute Pomodoros as the unit of planning and verification.
- Use end-of-Pomodoro check-ins (2 minutes) to validate output and choose the next block.

## Canonical References (Global)

- User operational profile: `agents/knowledge/atoms/michael-user-info.md`
- Coaching basics: `agents/knowledge/atoms/coaching-lite.md`
- Evening review: `agents/knowledge/atoms/evening-review-lite.md`
- Calendar CLI: `agents/knowledge/atoms/gcal-cli.md`

## Workflow (Notes Repo)

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

## Acceptance Checks

- [ ] Checklist note has a Must-Dos/Maybe-Dos split with `🍅` totals.
- [ ] Every checklist task links to a corresponding `Strategy - ... .md` subpage.
- [ ] Each subpage has `Start time`, deliverables, `Output`, and `2-Min End Check-In`.
- [ ] Coaching avoids making priority decisions; it asks for user context first.
