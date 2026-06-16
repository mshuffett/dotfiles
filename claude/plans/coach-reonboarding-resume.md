---
title: Coach Re-Onboarding — Session Resume
status: active
date: 2026-06-14
---

# Coach Re-Onboarding — Session Resume (2026-06-14)

Paste this into a fresh session to resume. It captures everything done + learned so far.

> **UPDATE 2026-06-15 — re-point DONE (steps 1–4 below mostly complete).**
> - Memory split implemented: durable facts → `references/memory.md`; dated working baseline →
>   new `references/current-state.md` (P1/P2 tree with **1-week TTL**). Todoist/Notion stay authoritative.
> - **Clarified with Michael: NOT migrating to Notion yet.** Todoist is the active operating system;
>   Notion/Waycraft is exploratory (not operational, not connected). Obsidian still holds *prose outputs*
>   (daily/weekly notes, captures) — only project/task *tracking* moved (Obsidian `Active Projects.md` → Todoist P1/P2).
> - SKILL.md + all SOPs (weekly-review, daily-startup, daily-shutdown, pomodoro) repointed off
>   `Active Projects.md` → Todoist P1/P2. Added weekly-review **Phase 0: Align on State** + a **Scan-the-Week /
>   assertiveness** retro step; session-start now reads `current-state.md` with the align-on-state check.
> - §7 patterns persisted to `memory.md` (assertiveness, Dave-drift, category-collision, chat-friction,
>   over-building) — they were previously saved nowhere. Naming/scheduling conventions + OKR cadence
>   (quarterly set / monthly reflow) + Michelle/Dave added.
> - Todoist cadence tasks repointed: 🌅 morning + 📊 "update Top Priorities" descriptions fixed.
> - **STILL OPEN:** composeai Notion access (Command Center baseline = 404, can't read/confirm);
>   coach changes are uncommitted. Annotated proposal: `claude/plans/coach-notes-annotation.md`.

## TL;DR — where we are
1. **Done & shipped:** merged the `joe-coach` skill into the `coach` skill (one skill, two modes). Committed + pushed.
2. **In progress (paused — got overwhelmed):** re-onboarding the `coach` skill because the operating system **moved off Obsidian → Notion ("Waycraft OS") + Todoist**. The coach is still hardcoded to a now-abandoned Obsidian vault.
3. **Next:** align on the current state of "Command Center" (don't assume), fix Notion access, then re-point the coach off the dead Obsidian paths. Keep it lightweight / one-thing-at-a-time.

---

## Part 1 — COMPLETED: joe-coach → coach merge
- Unified the two coaching skills into one. `coach` now has **two modes**: operational (default — routines, scheduling, daily notes) and **emotional/decision** (the Joe Hudson engine, moved in from `joe-coach`).
- Added `references/emotional-coaching.md`; bundled the full verbatim corpus inline under `corpus/` (index + 66 transcripts + snippet bank + voice library); moved scripts/ + evals/; fixed eval paths; removed the standalone `joe-coach` skill.
- Verified: retrieval works from bundled index (929 chunks), retrieval eval 5/5, links resolve.
- **Commit `77629c2d` pushed to `master`.** (Unrelated `zsh/zshrc.symlink` change left uncommitted on purpose.)

## Part 2 — IN PROGRESS: coach re-onboarding

### Why
The coach skill assumes the Obsidian vault `~/ws/notes/` everywhere. That system was **abandoned**: last weekly note ~Feb (W08), last daily ~Apr 5, `Active Projects.md` last edited 2026-04-19, coach `memory.md` frozen ~Mar 16. Michael now lives in **Todoist + Notion**, less Obsidian. So the *system of record moved* — this is a re-point + re-onboard, not a resume.

### Current reality discovered (from live Todoist + Notion)
- **Operating system = "Waycraft OS" in Notion.** Daily driver = **Command Center** page = linked views into 5 databases. Path: *Project Melange → Waycraft → Waycraft OS → Command Center*. **This is the new `Active Projects.md`.**
  - Command Center page id: `3d4e9c5ffe944bafb7380b7af488dc3a`
  - DBs: My Tasks `6bebca67ea71450cb6da5125ca330247` · Active Projects `b15d2feb35384fb5882ef23634ded82a` · Goals–This Cycle `f64ba3791a714d86b9347be94b437700` (+2 more)
- **Coach cadence ALREADY rebuilt in Todoist** as recurring tasks: 🌅 `/morning` (weekdays 9am), 🌙 `/evening` (weekdays 6pm), 📊 weekly review (Sat 12pm, "dual-track Product + Investor"). **BUT their descriptions still point at the dead Obsidian SOP + `Active Projects.md`.** ← key seam to fix.
- **Current focus themes:** fundraising → **Open Batch 002** (Fabio/Ares, WeekendFund, etc.); **Everything AI** product proof ("Decide v0 direction" p1, Superhuman convergence-loop demo, landing page, GSD agent-git workflow); **Compose AI** in background (24 website redesigns, exploring his "options"); **PE GTM** still alive (owes Dave); personal admin (card-churning before Dec mortgage, IRA). **New entity: Waycraft** (the OS/holding layer; didn't exist in March).
- Today (Sun 06-14) Michael has a half-finished **"@Today Weekly Review"** page with a bare agenda — a live opening for the coach SOP.

### Accounts / connections (verified)
- **Todoist:** `mshuffett@gmail.com` (Pro). Shared workspace: "Compose AI". ✅ connected.
- **Notion connected:** `michael@geteverything.ai` → workspace **"Everything AI HQ"**. ✅ view works; **edit untested**.
- **Notion NOT connected:** the **`composeai`** workspace (2nd account). **Open Batch 002 page = 404 for me.** Needs authorization or paste.
- **Two Google calendars:** `michael@compose.ai` + `michael@geteverything.ai`. Calendar review NOT done (2wk×2cal pull overflowed — needs tight per-calendar pull). Which is primary for planning = unresolved.

### Principles / directives established (from Michael this session)
1. **Be a coach, not a static system.** Orient to current state each session; treat the toolset as *current-and-changing*, not permanent. Don't re-hardcode Obsidian→Notion; make the coach **tool-aware/adaptive**.
2. **Align on state — don't assume it.** Present any read (Command Center / Todoist / memory) as a **draft**, have Michael confirm/correct *before acting*, record the agreed state **with a date** in coach memory, re-confirm later. (Confirmed pattern — already in memory.md as Mar-16 feedback → promote to permanent.) **Add this as an explicit step in the coach process.**
3. **Work on top of Command Center** — extend it, don't replace it.
4. **Use the memory system** actively (coach `memory.md`).
5. **Iterate:** propose → check how it lands → ask how it went / could improve → note the learning.
6. **Document the workflow/tooling reality.**

### Blockers / open access
- **composeai Notion** not connected (OB002 404). Fix: Notion is per-workspace — authorize the composeai workspace in Claude **Settings → Connectors → Notion** (may need re-auth/select account), or page **••• → Connections → add Claude connector**; fallback = paste content. Uncertain whether Claude's Notion connector supports 2 accounts — verify empirically.
- **Notion edit access** untested — test with a trivial reversible edit on a Michael-designated page.
- **Calendar** — re-pull tighter, per calendar; confirm primary planning calendar.

## Part 3 — Decisions locked
- Merge joe-coach into coach: ✅ done.
- System of record going forward: **Notion (Waycraft OS / Command Center) + Todoist**; Obsidian drops out of the active loop.
- Coach becomes **adaptive + alignment-first**.

## Part 4 — Next steps to resume (in order, keep it light)
1. **Align on Command Center state:** read the 3 DBs (Active Projects, Goals, My Tasks), present back as a *draft* current state, Michael confirms/corrects → record dated baseline in coach `memory.md`.
2. **Fix Notion access:** authorize composeai (or paste OB002); test edit on a designated page.
3. **Re-point the coach off Obsidian:** (a) refresh `memory.md` to current truth; (b) via `skill-creator` (+ brainstorming) update `SKILL.md` + SOP references + the Todoist recurring-task descriptions from Obsidian paths → Waycraft OS Command Center; make coach tool-adaptive; **add the "align on state" step**.
4. **Calendar:** tight per-calendar pull for this week + next.
5. Open feedback question (unanswered): is the pace/format working, or shorter / one-thing-at-a-time? → Michael said **it's too much to manage** → default to smaller, one-thing-at-a-time chunks.

## Key paths
- Coach skill: `~/.dotfiles/agents/skills/coach/` (SKILL.md, references/, corpus/, scripts/, evals/) — `claude/skills/` is a symlink to `agents/skills/`.
- Coach memory (STALE, ~Mar 16): `~/.dotfiles/agents/skills/coach/references/memory.md`
- Coach SOPs: `references/{weekly-review,daily-startup,daily-shutdown,metacognitive-coaching,emotional-coaching,inbox-processing,pomodoro}.md`
- Obsidian legacy (stale, do not assume current): `~/ws/notes/2-Areas/System/Active Projects.md`
- Rule: never edit `SKILL.md`/SOP files without invoking `skill-creator` first.
