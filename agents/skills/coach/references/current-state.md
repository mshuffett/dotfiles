---
title: Coach Current-State Baseline
updated: 2026-06-15
ttl: "1 week — any block older than 1 week is STALE; re-confirm before acting"
---

# Coach Current-State Baseline

Dated working-state the coach reads at session start. This is **not** durable memory
(that's `memory.md`) and **not** the source of truth (that's Notion Command Center +
Todoist). It's the *agreed baseline*, stamped.

**Staleness rule:** each block carries a date. **If a block is >1 week old, treat it as
stale → re-confirm with Michael (or re-pull from Todoist/Notion) before acting on it.**
This is the "align on state, don't assume" loop made concrete.

> Wiring note: the coach does not yet auto-read this file at session-start — that SOP/SKILL
> change is gated on `skill-creator` (step 4). Until then, read it manually when coaching.

---

## System of record (2026-06-15)
- **Todoist = the active operating system right now** (tasks, P1/P2 priorities, cadence). This is
  what's actually in use — the coach should treat it as **primary**.
- **Notion "Waycraft OS" → Command Center** = a direction Michael is *exploring*. **Not a committed
  migration, not yet operational** ("not migrating to Notion yet, per se"), and **not currently
  connected** to the coach (composeai workspace = 404). **Do not depend on it or treat it as source
  of truth.** Path/id kept for later only: Project Melange → Waycraft → Waycraft OS → Command Center,
  page `3d4e9c5ffe944bafb7380b7af488dc3a`.
- **Obsidian (`~/ws/notes`)** = still the **home for prose outputs** — daily notes, weekly-review
  write-ups, brain-dumps, captures (decided 2026-06-15: "still Obsidian for now"). **But project/task
  tracking moved to Todoist** — `Active Projects.md` is no longer the project list, and existing vault
  files are stale (last weekly ~Feb, daily ~Apr), so don't assume any given file is current.

## Connections (2026-06-15)
- **Notion connected:** `michael@geteverything.ai` → workspace "Everything AI HQ". View works; edit untested.
- **Notion NOT connected:** `composeai` workspace (2nd account) — Command Center + Open Batch 002 page = **404**. Needs authorization or paste.
- **Todoist:** `mshuffett@gmail.com` (Pro). Shared workspace "Compose AI".
- **Calendars:** `michael@geteverything.ai` (**PRIMARY for planning**) + `michael@compose.ai`.

## Command Center baseline — N/A for now (Notion is exploratory, not operational)
- Not read/confirmed (composeai workspace inaccessible) and **not required** — the coach runs on
  Todoist + calendar today. Revisit only if/when Michael commits to Notion as the operating system.
- DB ids from resume plan (UNVERIFIED, for later): My Tasks `6bebca67ea71450cb6da5125ca330247` ·
  Active Projects `b15d2feb35384fb5882ef23634ded82a` · Goals–This Cycle `f64ba3791a714d86b9347be94b437700`.

## Todoist priority tree (2026-06-15) — TTL 1 week
**P1** (red, favorite):
1. **Raise $5M by July 28th** → *Write Pitch* · *Define Target Investors + Start Outreach*
2. **Book Demo Day Venue**
3. **Build Open Batch Investor Process** (the repeatable process; distinct from his own raise)

**P2** (orange, favorite):
1. **Figure Out Ideal Open Batch Coaching Relationship**
2. **Manage Open Batch**
3. **Personal OS**

## Current focus themes (2026-06-15)
Fundraising → **Open Batch 002** (Fabio/Ares, WeekendFund, Christine, Eric, bootstrap-ventures guy);
**Everything AI** product proof (decide v0 direction); **Compose AI** in background (exploring "options");
**PE GTM** (owes Dave). New entity: **Waycraft** (OS / holding layer).

## Cadence + standing meetings (2026-06-15)
- Coach cadence in Todoist: 🌅 morning (weekdays 9am) · 🌙 evening (weekdays 6pm) · 📊 weekly review (Sat 12pm).
  ⚠️ Their descriptions still point at dead Obsidian SOP paths — **repoint pending (step 4)**.
- 📊 Saturday "update Top Priorities (re-rank top 3, unstar the rest)" — in Misc, paired with the Sat review.
- **Michelle <> Michael** 12:00–12:15 weekday sync (geteverything.ai) — fixes delegation-overhead.
- **Dave "Daily Sync"** 11am (Dave runs it; mentorship + standup).
