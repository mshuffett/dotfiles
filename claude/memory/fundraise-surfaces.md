---
name: fundraise-surfaces
description: Where the Everything AI $5M raise / Open Batch lives — canonical dashboard hub, Notion CRMs/DBs, Todoist projects, email accounts. The "where's my Open Batch / raise / investor / demo day page" entry point. Pointers, not payload.
type: pointer
updated: 2026-07-01
ttl: 30d
---

Pointers into the systems of record for the raise. **Content lives there, not here** — verify against the live source before asserting status (it changes daily).

## ⭐ Start here — canonical hub
- **OpenBatch Company Raise — Project Dashboard** (the parent page; everything below hangs off it): <https://app.notion.com/p/OpenBatch-Company-Raise-Project-Dashboard-7a38c400565c4380aab4a2c856d5e3ad>
- **⭐ CANONICAL strategy/operating doc — "OpenBatch Raise — Operating Plan & Scorecard"**: <https://app.notion.com/p/84d811f7e7ec4dd7b4109ae587138a8b> — promoted from DRAFT to canonical on 2026-06-25 and pinned to the TOP of the Project Dashboard. Holds: strategy, funnel math, ROI ranking of investment levers, owners, the June-30 scorecard, and open questions. **Updated only at the weekly review.**
  - **This is the single canonical plan doc.** Other plan/proposal/flow pages on the Dashboard are kept as *source/reference material*, NOT competing live plans. Do **not** spawn a new parallel plan doc or Todoist project — that is the known **drift** failure mode (a prior session created a whole "Raise Operating Plan (Review)" Todoist project as copy #4; it now lives nested under the P2 project for weekly review). Edit the canonical doc above instead.

## Notion (Everything AI HQ workspace)
- **Investors DB** (inline on the 💰 Target Investors page): <https://app.notion.com/p/38141187d56481a2b6a4d83c7b94ed3b> — the single investor tracker; fields incl. **Founder Dinner** + a "Founder Dinners" view.
- **Demo Day Venue / Sponsor CRM**: <https://app.notion.com/p/38141187d56481e9ae44e29343013385> — venue hosts + sponsors; has a "🤖 Instructions for AI" toggle describing how to maintain it.
- **Founder Dinners** page (now a linked view of the Investors DB): <https://app.notion.com/p/38341187d56481f3bdadc89a44a6c8e1>
- **📥 Investor Intro & Reply Policy (v1 — DRAFT, refining)** — how to handle warm investor intros/inbounds: <https://app.notion.com/p/38c41187d56481eb9e99ef8b05514720> (subpage of the Investor Flow — Canonical page). Rule: warm intro → thank + BCC the connector, 1-line OpenBatch context + ask + Cal.com link, **log to the Investors DB with the intro source**, and **draft-don't-send by default** (Michael reviews before send). v1 draft, still being refined.
- **Deck-thesis PR/investor leads (from metrics research, 2026-07-01)** — 4 people surfaced by the cost-of-a-company deck research, filed by lane (before outreach/PR work, check here so they aren't re-surfaced or mis-approached):
  - **Mark Suster** (Upfront GP, *investor*) → row in the **🎯 Investors DB** (Tier 1). Angle: his own 2011 cost-collapse thesis, extended.
  - **Christine Dare-Bryan** (Forbes journalist, *PR*) → row in the **🗞️ Press Outreach Candidates DB** (under the Press Outreach Brief). Wrote the Griffel piece; covers the beat.
  - **Mattan Griffel** (validator) + **Peter Walker** (Carta data-ally) → *Deck-thesis Validators & Data Allies* subpage under the Press Outreach Brief: <https://app.notion.com/p/39141187d564810caa22cfc39e4b4849> (they fit neither DB — amplification/validation, not journalists or investors). Full context: `waycraft-web/plans/deck-narrative.md` § "People surfaced by the metrics research".

## Open Batch operational sheets (Google Sheets)
- **OB002 Founder Goal Tracker** (canonical per-founder tracker): <https://docs.google.com/spreadsheets/d/1X50G1Rc23epl77qGF2pKrt8XpIRhIbrCg1V13-cRtKQ/edit?gid=0> — OB002 founder roster + biweekly goals/progress. Columns: Group, Company, Short Description, Names (with emails), Demo Day Goal, Day-0 state, and 2-week goal/progress pairs through Demo Day. **Publicly readable via CSV export**: `https://docs.google.com/spreadsheets/d/1X50G1Rc23epl77qGF2pKrt8XpIRhIbrCg1V13-cRtKQ/export?format=csv&gid=<gid>`.
- **OB source/master data sheet** (Michael's source data): <https://docs.google.com/spreadsheets/d/1sbE27fHSAwS_g5MHCdEEFPhbjP_k4ftL8YVQGdN4KRQ/edit?gid=127991153> — ⚠️ as of 2026-06-27 **NOT link-shared**: anonymous/CSV access returns HTTP 401 and no local credential has Google Sheets scope, so it **can't be read programmatically** until Michael shares it ("Anyone with link → Viewer") or provides a CSV.

## Todoist
- P1 **"Raise $5M by July 28th"**: `6gq5WrR2JpMPhgVx` (children: Write Pitch · Define Target Investors + Start Outreach)
- **"Book Demo Day Venue"**: `6grwMff4mFvJ6GmQ`
- **"Build Open Batch Investor Process"**: `6grwMfXW3MjVmCm4`
- **Outreach follow-up sweep** (self-contained instructions task): `6gvJgmrXvJ5F98gx`

## Email
- Gmail MCP = **michael@geteverything.ai** (all venue/sponsor outreach lives here).
- himalaya CLI accounts: **`everything-ai`** (geteverything) + **`compose`** (compose.ai). Draft/send: `himalaya message save|send -a everything-ai`; compose.ai All Mail = `"[Gmail]/All Mail"`.

## Key dates
- Demo Day: **Tue Jul 28, 2026** (~4 hrs, ~250 people). Unconference: **Fri Jul 10, 4 PM** (~100). Raise-close target: Jul 28.
