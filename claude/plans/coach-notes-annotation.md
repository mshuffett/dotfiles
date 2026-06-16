---
title: Coach Handoff Notes — Annotated Proposal
status: active
date: 2026-06-15
source: "Coaching Session Handoff — State as of Mon 2026-06-15 (eve)"
---

# Coach Handoff Notes — Annotated Proposal

Annotates your 2026-06-15 handoff notes with: what I'd update (and where), what's
already incorporated, and the few real decisions only you can make.

**This is a proposal, not applied changes.** Per your own rule — *align on state,
don't assume it* — nothing here touches `memory.md`, the SOPs, Todoist, or Notion
until you confirm. SKILL.md/SOP edits are additionally gated on `skill-creator`.

**Legend:** ✅ already incorporated · 🆕 propose to add · ✏️ propose to change ·
❓ your decision · ⚠️ correction / risk

---

## Read this if nothing else — the 3 things that actually matter

1. **⚠️ The patterns you think you saved aren't saved.** The notes say assertiveness,
   Dave-drift, and delegation-overhead were "logged to Claude user memory this session."
   I checked both stores — global auto-memory (`~/.claude/.../memory/`) and the coach's
   own `memory.md`. **They're in neither.** These notes are currently the *only* copy.
   Persisting them is the single highest-value action here.

2. **❓ One memory-architecture decision unblocks everything else** (the notes raise it
   in §8). Where do durable facts about you live vs. live working-state? My recommendation
   is below — it's a 2-minute decision and the rest follows from it.

3. **⚠️ The coach already HAD Notion + PPV integration — it was deleted in Feb.**
   `references/MIGRATION-RECOVERY.md` shows morning/evening/weekly commands with Notion
   PPV databases were stripped in the 2026-02-15 consolidation. So the "repoint to Notion"
   job is *partly recovery*, not greenfield. **But the old DB IDs in that file are stale**
   (old PPV "Daily Tracking / Weeks" DBs) and are **not** the new Waycraft Command Center
   DBs — use the Waycraft IDs from `coach-reonboarding-resume.md`, not the recovery file.

---

## My recommendation on the memory architecture (the §8 question)

Three stores exist. Don't add more — assign clearly:

| Store | Loaded when | Put here |
|---|---|---|
| **Coach `memory.md`** | only when coach runs | **Durable patterns + conventions + preferences** about you (assertiveness, over-building, scaffolding, delegation, naming rules, scheduling rules, due-date rule, calendars, key people). This is the coach's brain. |
| **New `current-state.md`** (dated, 1-week TTL) | read at coach session-start | **Live working baseline** — the agreed Command Center snapshot, the **dated P1/P2 tree**, current focus themes, this-cycle OKRs. Each entry carries a date; **anything >1 week old is treated as stale → re-confirm before acting.** This file *is* the "align on state" loop made concrete. |
| **Todoist + Notion** | — | **Live source of truth** for the actual task tree, projects, calendar. The `current-state.md` snapshot is the *agreed baseline*; the 1-week TTL is the forcing function that pulls it back into sync with the tools. |
| Global auto-memory | every session | Leave mostly alone. At most a 1-line pointer if a pattern is truly cross-cutting. Coaching patterns don't belong in every non-coaching session. |

**Why:** the notes' instinct (user memory vs. session memory) is right. The clean split is
*durable → `memory.md`*, *ephemeral/working → `current-state.md`*, *authoritative → the tools*.
This also kills the recurring "this week's plan ends up frozen in memory and goes stale" failure.

---

## Section-by-section

### §0 TL;DR — no action (context only).

### §1 System-of-record
- ✏️ **Obsidian → Notion/Todoist repoint.** `memory.md` session-start protocol hardcodes
  `~/ws/notes/2-Areas/System/Active Projects.md`; SKILL.md description says "auto-loads in
  `~/ws/notes`". Both must change to: **Command Center (Notion) is the live source; Todoist
  is the task layer.** (Gated on `skill-creator`.)
- 🆕 **Connection reality** → record in `current-state.md`: Notion connected = `geteverything.ai`
  ("Everything AI HQ"); `composeai` workspace **not** connected (Command Center + OB002 404);
  Todoist = `mshuffett@gmail.com`; two calendars, `geteverything.ai` primary.
- ⚠️ **PPV is not new inspiration — it's a deleted feature** (see "3 things" #3). ❓ Decide
  later whether to adopt the PPV *data model* (Pillar = cross-cutting tag, Goal = container/gate,
  cascade Value-Goal → Outcome → Project → Action). Worth it, but it's a design project — **defer;
  don't let it become the next scaffolding build.**

### §2 Todoist P1/P2 structure
- 🆕 **Record the P1/P2 tree, dated, in `current-state.md` — with a 1-week TTL.** Keep the
  snapshot as the agreed baseline, but stamp it; **once it's >1 week old, treat it as stale and
  re-confirm against Todoist before acting on it.** (Don't freeze it permanently in `memory.md` —
  the dated working-state file + TTL is what keeps it honest.)
- 🆕 **Naming conventions ARE durable → extend the existing `memory.md` "Todoist Project Model"
  (2026-04-19) section:** outcome-named, one outcome per project, imperative verbs (not
  activity-nouns, not past-tense), headline projects encode target + deadline, MECE / de-dup.
- ✅ "All projects under `1-Projects` / PARA spine" — consistent with existing memory.

### §3 This week's plan + big rocks
- ⚠️ **Ephemeral — do NOT put in memory.** Big rocks, dated next-actions, the scheduled blocks:
  these belong in Todoist/Notion, full stop.
- 🆕 **Scheduling rules are durable → `memory.md` Preferences:** 1–3 prioritized tasks/day + up
  to 5 quick ones, all prioritized; **deep work in the morning** (afternoons meeting-heavy with
  Open Batch syncs); tag low-energy fill `@Quick/Easy`, deep tasks untagged.

### §4 Calendar
- 🆕 **`memory.md` Key People / calendar:** standing **Michelle <> Michael** 12:00–12:15 weekday
  sync (geteverything.ai) — the structural fix for delegation-overhead. Separate **Dave "Daily
  Sync" 11am** (Dave runs it; mentorship + standup).
- ✅ **Primary calendar = `geteverything.ai`** — already in `memory.md` Preferences. This also
  **resolves the open question** from the resume plan ("which calendar is primary").

### §5 Recurring / cadence
- 🆕 **Saturday "📊 update Top Priorities (re-rank top 3, unstar rest)"** in Misc, paired with the
  Saturday review → note in `current-state.md` / cadence list.
- ✏️ **Coach cadence Todoist tasks (🌅 morning / 🌙 evening / 📊 weekly) still point at dead
  Obsidian SOP paths in their descriptions** → repoint to the Notion/Todoist SOPs. (Matches
  the resume plan; do during the `skill-creator` pass.)

### §6 Workflow rules
- ✅ **"A date = a commitment"** — already in `memory.md` as **Due-Date Rule (2026-04-19)**.
  Fully incorporated; the notes confirm it.
- ✅ Review OKR-linked projects ≥ weekly — consistent.
- 🆕 One outcome/project + imperative outcome-naming → folds into the §2 conventions add.
- ❓ **Monthly vs. quarterly OKRs — genuine unresolved conflict.** Don't encode a cadence until
  you pick one. (Open tension, by your own marking.)
- ❓ "Not sure yet / not tied to a live OKR → incubate with a review cadence" — aligns with the
  existing **Capture Buckets** model in memory; minor, low-risk to add.

### §7 Patterns — the high-value additions (currently UNPERSISTED)
- ⚠️ **All of these need to be written down — they are nowhere right now.** Propose adding to
  `memory.md` Patterns:
  - 🆕 **Assertiveness (core, high-leverage):** defers/absorbs others' assertiveness rather than
    asserting his own opinion; same muscle behind the Dave boundary issue, reactions to directive
    advice (ref. May 31 / Evelisa talk-prep), and fundraising conviction. **Wants it tracked weekly.**
  - 🆕 **Dave-conversation drift:** long unstructured talks derail focus (9/10 → 6/10). Practicing
    kind, direct, up-front boundaries (appreciation + boundary + future-hook). The containerized
    Dave + Michelle syncs are the structural fix.
  - ✅/🆕 **Delegation-overhead (Michelle):** partially present (existing "Delegation Patterns") —
    extend with "the *worry of not knowing what she's working from* nearly exceeded the benefit;
    daily sync is the fix."
  - 🆕 **Category-collision:** mixes *DO the review* with *BUILD the agentic review system*.
    Resolution: do the work; capture system-design ideas in a bucket; build next week. (This is
    also a direct SOP hook — see §8.)
  - 🆕 **Chat-as-interface friction:** chat can be slower/steering; coach should be alignment-first,
    present reads as drafts, stay light / one-thing-at-a-time, not over-steer.
  - 🆕 **Overwhelm + over-building:** strong 0→1 builder who stalls near "done" and over-engineers.
    Explicitly asked: don't over-optimize; bias to small, concrete, shippable steps on real tools.
- ❓ **Store = coach `memory.md`** (my rec) vs. global auto-memory. Decide once (see architecture).

### §8 Coaching-process / SOP improvements
- 🆕 **Weekly-review SOP — add a "scan the week's conversations/threads for recurring themes,
  decisions, and self-awareness moments" step**, feeding the Good/Bad/Start/Stop retro (not just
  tasks). You explicitly valued this. (Gated on `skill-creator`.)
- 🆕 **Add an explicit "Align on state — don't assume" step to the coach process:** present any
  read (Command Center / Todoist / memory) as a *dated draft* → you confirm/correct → record the
  agreed state with a date → re-confirm later. This is the meta-fix and it's already the operating
  principle in `coach-reonboarding-resume.md`; this makes it a literal SOP step. (Gated on `skill-creator`.)
- 🆕 **Add a weekly retro micro-step: "assertiveness check"** — note moments he asserted his real
  opinion vs. swallowed it (ties §7 assertiveness to a recurring observation).
- ❓ user-memory vs. session-memory distinction → resolved by the architecture table above.

### §9 Deferred — mostly already handled
- ✅ **Large-inbox rule already exists** — `weekly-review.md` Phase 2 already says "Large inbox
  (15+): quick scan for high-priority only, park/bulk-archive the rest." Your 71-item instinct is
  already the SOP. No change needed.
- ⚠️ **composeai Notion still blocked** (OB002 404) — open access item, not solvable from notes.
- ❓ OKR-cadence + OKR-vs-Pillar tensions — left open intentionally.
- ✅ Comments-sweep declined — noted, no action.

---

## Open questions for you (the only real decisions)

1. **Memory split:** OK to put durable patterns/conventions in coach `memory.md`, and a dated
   `current-state.md` for live working-state — including the **dated P1/P2 tree with a 1-week
   staleness rule** (>1 week → re-confirm before acting)? *(Updated per your note.)*
2. **OKR cadence:** monthly or quarterly? (Blocks encoding the review cadence.)
3. **PPV adoption:** adopt the PPV data model now, or park it as a named "later" so it doesn't
   become this week's build? *(Recommend park.)*
4. **Pattern store:** coach `memory.md` for the §7 patterns — agreed? Or do you want assertiveness
   (cross-cutting) also pointer-linked in global auto-memory?

---

## Proposed next actions (light, ordered — stop after any one)

1. **Persist the §7 patterns now** (lowest-risk, highest-value, no `skill-creator` needed — it's a
   data file). Write them into `memory.md` Patterns + the Michelle/Dave calendar facts.
2. **Add the durable conventions** (naming + scheduling rules) to `memory.md`.
3. **Create `current-state.md`** with the dated connection reality + a placeholder for the Command
   Center baseline (filled once we align on it / get composeai access).
4. *(later, batched, via `skill-creator`)* The SOP edits: Obsidian→Notion repoint, the
   "align on state" step, the "scan the week's conversations" retro step, and repointing the
   Todoist cadence-task descriptions.

Steps 1–3 are pure `memory.md`/data edits — safe and reversible. Step 4 is the bigger structural
pass and stays gated. We can do just step 1 and stop if that's the right size today.
