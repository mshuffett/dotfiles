---
description: Always read this whenever working with the playground or prototyping variants; covers workflow, HUD usage, and Ship It.
---

# /prototype — Multi‑Variant Screen Prototyping (Self‑Improving)

You are working on a self‑improving process. If there are ways to improve this command—prompts, guardrails, or outputs—update this file immediately after a session and commit to dotfiles.

## Canonical Source
This command is the canonical specification for the prototyping workflow, design guidelines, prompts, and checklists. Any improvements should be made here first. Repo docs may link here for visibility, but this file is authoritative.

## Goals
- Compress idea → “see real, coded options” → decision to minutes.
- Produce multiple high‑quality coded variants (not mockups) side‑by‑side.
- Align to Michael’s value function (clarity, a11y, efficiency, responsiveness, scalability, motion fit).
- Land on a “SHIP IT” decision quickly; then wire to real data and PR.

## Value Function (Weights default)
- Clarity (3), Accessibility (3), Efficiency (2), Responsiveness (2), Scalability (1), Motion Fit (1)
- Re‑weight over time based on Michael’s choices; document deltas below.

## Inputs (Minimal)
- slug, goal, target (app/route or package area), must‑haves, constraints
- Optional: primary entity fields to care about

## Outputs
- 5 coded variants on one playground page with the Playground HUD enabled
- Types (`types.ts`), fixtures (`fixtures.ts`), four states per variant (loading/empty/error/success)
- Quick rationale + rubric scores per variant
- After selection: promoted screen, wired data, targeted tests, PR with media

## Axes To Vary (pick 4–6 per run)
- Layout: table/cards/split‑pane/wizard/master‑detail/full‑page
- Density & hierarchy: compact vs spacious; filters prominent vs progressive
- Interaction: inline edit vs modal vs side‑panel; optimistic vs confirmed
- Navigation: same‑route overlays vs dedicated routes; keyboard‑first vs pointer
- Data presentation: grouping/virtualization/pagination/aggregation chips
- Motion: minimal vs expressive (durations/easings/presence/layout)
- States: instructional empty vs quick‑start; error affordances

## Guardrails (always)
- Components: shadcn/ui, Tailwind tokens, 8pt spacing grid
- Motion: Framer Motion, ease [0.4,0,0.2,1], 0.3–0.4s
- States: loading/empty/error/success are intentional
- Auth: Middleware Headers Pattern; server ops via `adminFirestore`
- Tooling: pnpm + Biome; alternate dev ports; worktrees only after `/worktrees`

## Playground HUD (built‑in)
Toggles overlay grid/baseline, shows breakpoint, simulates reduce‑motion, slow‑mo, and provides a rating/rubric panel, a quality checklist, and “SHIP IT” capture. See repo demo at `/playground/hud-demo`.

## Protocol (Speed‑First)
1) Micro‑Brief (You)
- “Prototype: slug, goal, target, must‑haves, constraints, [optional fields]”

2) Concept Outline (Me, thorough ≤3 min)
- I produce the outline (template below) to lock intent and quality constraints before code.
- You skim/approve or adjust quickly.

3) Axes Plan (Me, ≤90s)
- Reply with the 4–6 axes I’ll vary and why; accept/adjust.

4) Multi‑Variant Prototype (Me)
- Create `apps/web/app/playground/screens/<slug>/page.tsx` with 5 variants + HUD.
- Include `types.ts` and `fixtures.ts` (mock realistic), 4 states, motion.
- Gate: compiles, type‑safe, Biome clean.

5) Decide/Tweak (You)
- Pick one or hybrid; give 2–4 tweak bullets.
- I patch in‑place, same page, HUD visible for re‑eval.

6) Lock & Wire (Me)
- Promote chosen variant to its real route; wire Firestore subs; add targeted tests.

7) PR & Ship (Me → You)
- PR with screenshots/GIFs; merge after approval.

## Concept Outline Template (I fill this in)
- Problem & Success (1 sentence each)
- Primary User & Primary Actions (top 1–2)
- Core Data Model (entities/fields you care about, with example content)
- Navigation Entry & Exit (how users arrive/leave)
- Interaction Model (inline vs modal vs side‑panel; optimistic vs confirmed; batch ops?)
- States (loading/empty/error/success patterns)
- A11y & Responsiveness (keyboard path, focus order, breakpoints to validate)
- Performance Constraints (data size, virtualization need, latency expectations)
- Risks/Unknowns (what could derail clarity/efficiency)

Definition of Ready: all bullets above have a first pass (defaults applied if unspecified).

## Design Guidelines (High Quality by Default)
- Hierarchy & Clarity
  - One clear primary action per screen; secondary actions de‑emphasized.
  - Use consistent type scale; avoid >3 heading sizes per screen.
  - Align to a 12‑col grid; avoid ragged edges; left‑align text blocks.
- Spacing & Grid
  - 8pt spacing; container paddings 16–24px; consistent gutters.
  - Maintain vertical rhythm; baseline overlay should align content.
- Data Presentation
  - Lists/tables: row height 44–56px; column min widths; truncation with title tooltips.
  - Virtualize ≥50 rows; use grouping/filters when discovery matters more than pagination.
- Forms & Validation
  - Label + helper text; errors inline; success via non‑blocking toast.
  - Optimistic writes by default with rollback; disable submit only while pending.
- Motion
  - Durations 0.3–0.4s; ease [0.4,0,0.2,1]; respect reduce‑motion.
  - Use layout animations for reflow; avoid bounce/overshoot.
- Accessibility
  - Full keyboard path; visible focus; logical tab order; label controls.
  - Contrast AA; min target size 40×40; ARIA thoughtfully (where needed).
- Responsiveness
  - Validate at sm/md/lg in HUD; keep critical controls intact; avoid stacking that hides primary actions.
- Performance & Stability
  - Avoid CLS; reserve image space; debounce expensive filters; cache hot queries.
  - Skeletons or streaming for >250ms work; don’t block layout on non‑critical data.
- Content & Language
  - Action labels are verbs; empty states offer a next step; errors are actionable.
- Theming
  - Dark mode first‑class; use tokens; no hardcoded colors.

## Quality Gates
- Pre‑prototype: compiles, type‑safe, Biome clean.
- Pre‑selection: four states present; keyboard path works; contrast AA spot‑check.
- Post‑selection: wired to real data; targeted tests; screenshot/GIF included in PR.

## Prompts (Copy‑Paste)
- Prototype Request:
  - Prototype: slug=team-insights, target=apps/web /teams/[id]/insights, goal=compare activity quickly, must‑haves=filters by member+time; keyboard nav, constraints=dense; no modals

- Tweak Request:
  - Pick Variant C. Tweaks: denser header; sticky filters; fade+scale enter 0.35s.

- Hybrid Request:
  - Hybrid: A layout + D detail panel; keep C empty state.

## Quality Rubric (0–5 each)
- Clarity, Accessibility, Efficiency, Responsiveness, Scalability, Motion Fit
- HUD displays current weights; lets Michael score quickly and leave notes.

## Ship‑It Trigger
- Target phrase: “Ship it” (or equivalent) = promote + wire + PR.
- HUD includes one‑click “Ship It” action that records feedback and locks.

## Improvement Loop (Self‑Reflection)
- After each ship, run:
  1. What slowed TTFV? How to automate/remove next time?
  2. Which axes produced the winner? Increase their prior.
  3. Any recurring tweaks? Encode as defaults.
  4. Update this command: prompts, guardrails, or outputs.
  5. Store preferences in project memory and reweight rubric.

## Do / Don’t
- Do: prefer Firestore subscriptions over polling; keep variants small & orthogonal.
- Don’t: introduce NextAuth; kill unknown ports; ship without a11y basics.

## Changelog
- 2025‑11‑06: Renamed from /blast-playground → /prototype; HUD demo present in repo.
- 2025‑11‑06: Consolidated docs into command; added Concept Outline + Design Guidelines.
